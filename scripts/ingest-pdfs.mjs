#!/usr/bin/env node
// scripts/ingest-pdfs.mjs
// Ingest PDFs from knowledge/pdfs/, chunk + embed, write data/knowledge.json

import path from "path";
import fs from "fs/promises";
import fg from "fast-glob";
import crypto from "crypto";
import OpenAI from "openai";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import dotenv from "dotenv";

// Load env from project root
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const PDF_DIR = path.join(process.cwd(), "knowledge", "pdfs");
const DATA_DIR = path.join(process.cwd(), "data");
const OUT_PATH = path.join(DATA_DIR, "knowledge.json");
const CACHE_PATH = path.join(DATA_DIR, "embedding-cache.json");

// ---------- Config (override via env) ----------
const EMB_PROVIDER =
  process.env.EMB_PROVIDER ||
  (process.env.OPENAI_API_KEY ? "openai" : process.env.OPENROUTER_API_KEY ? "openrouter" : "openai");

const DEFAULT_OPENAI_MODEL = "text-embedding-3-small"; // 1536 dims
const DEFAULT_OPENROUTER_MODEL = "jinaai/jina-embeddings-v3"; // widely available, low-cost
const EMB_MODEL = process.env.EMB_MODEL || (EMB_PROVIDER === "openai" ? DEFAULT_OPENAI_MODEL : DEFAULT_OPENROUTER_MODEL);

const CHUNK_SIZE = Number(process.env.CHUNK_SIZE || 1200);
const CHUNK_OVERLAP = Number(process.env.CHUNK_OVERLAP || 200);
const BATCH_SIZE = Number(process.env.EMB_BATCH || 16);
const MAX_RETRIES = Number(process.env.EMB_MAX_RETRIES || 6);

// ---------- Helpers ----------
function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}
function cleanText(text) {
  return text.replace(/\r/g, "").replace(/\u0000/g, "").trim();
}
function chunkText(text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const out = [];
  let i = 0;
  while (i < text.length) {
    const chunk = text.slice(i, i + size);
    out.push(chunk);
    i += size - overlap;
  }
  return out;
}
async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}
async function loadCache() {
  try {
    const raw = await fs.readFile(CACHE_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return { files: {} };
  }
}
async function saveCache(cache) {
  await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2), "utf8");
}
// Buffer -> plain Uint8Array (pdf.js dislikes Node Buffer subclass)
function toUint8(input) {
  if (input instanceof Uint8Array && !(globalThis.Buffer && Buffer.isBuffer(input))) return input;
  if (globalThis.Buffer && Buffer.isBuffer(input)) {
    const out = new Uint8Array(input.length);
    out.set(input);
    return out;
  }
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  return Uint8Array.from(input);
}
async function extractPdfText(bufferLike) {
  const uint8 = toUint8(bufferLike);
  const loadingTask = pdfjsLib.getDocument({ data: uint8, disableWorker: true });
  const doc = await loadingTask.promise;
  const parts = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const text = content.items.map((it) => (typeof it.str === "string" ? it.str : "")).join(" ");
    parts.push(text);
  }
  await doc.cleanup();
  return parts.join("\n\n");
}

// ---------- Embedding client(s) ----------
function makeOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}
function makeOpenRouterClient() {
  if (!process.env.OPENROUTER_API_KEY) return null;
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
      "X-Title": process.env.SITE_NAME || "LID Chat",
    },
  });
}

async function embedWithRetries(client, model, inputs) {
  let delay = 1000;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await client.embeddings.create({ model, input: inputs });
      return res.data.map((d) => d.embedding);
    } catch (err) {
      const status = err?.status || err?.response?.status;
      const code = err?.code || err?.error?.code;
      const retriable =
        status === 429 || (status >= 500 && status < 600) || code === "insufficient_quota";

      if (!retriable || attempt === MAX_RETRIES) {
        throw err;
      }
      const jitter = Math.floor(Math.random() * 250);
      console.warn(
        `Embeddings retry ${attempt}/${MAX_RETRIES} after ${status || code} — waiting ${delay + jitter}ms…`
      );
      await new Promise((r) => setTimeout(r, delay + jitter));
      delay = Math.min(delay * 2, 20000);
    }
  }
  // unreachable
  throw new Error("Embedding retries exhausted");
}

// Try primary provider; on quota/429 fall back to the other (if configured)
async function embedBatch(texts) {
  const tryOrder = [];
  if (EMB_PROVIDER === "openai") {
    const a = makeOpenAIClient();
    if (a) tryOrder.push({ client: a, model: EMB_MODEL, name: "openai" });
    const b = makeOpenRouterClient();
    if (b) tryOrder.push({ client: b, model: DEFAULT_OPENROUTER_MODEL, name: "openrouter" });
  } else {
    const b = makeOpenRouterClient();
    if (b) tryOrder.push({ client: b, model: EMB_MODEL, name: "openrouter" });
    const a = makeOpenAIClient();
    if (a) tryOrder.push({ client: a, model: DEFAULT_OPENAI_MODEL, name: "openai" });
  }
  if (tryOrder.length === 0) {
    throw new Error("No embedding provider configured. Set OPENAI_API_KEY or OPENROUTER_API_KEY.");
  }

  let lastErr = null;
  for (const { client, model, name } of tryOrder) {
    try {
      return await embedWithRetries(client, model, texts);
    } catch (e) {
      lastErr = e;
      console.warn(`Provider ${name} failed, trying next (if any)…`);
    }
  }
  throw lastErr;
}

// ---------- Main ----------
async function main() {
  await ensureDirs();

  const pdfPaths = await fg(["**/*.pdf"], { cwd: PDF_DIR, absolute: true });
  if (!pdfPaths.length) {
    console.warn(`⚠️  No PDFs in ${PDF_DIR}. Create that folder and drop files in.`);
  }

  const cache = await loadCache();
  /** @type {{model:string, dimension:number, chunks:Array<{id:string, source:string, text:string, embedding:number[]}>}} */
  const index = { model: EMB_MODEL, dimension: 1536, chunks: [] };
  let idCounter = 1;

  for (const abs of pdfPaths) {
    const rel = path.relative(process.cwd(), abs);
    const buf = await fs.readFile(abs);
    const fileHash = sha256(buf);

    const text = cleanText(await extractPdfText(buf));
    const pieces = chunkText(text);

    const already = cache.files[rel];
    const needEmbed = !already || already.hash !== fileHash || already.count !== pieces.length;

    let embeddings = [];
    if (needEmbed) {
      // batch with backoff
      for (let i = 0; i < pieces.length; i += BATCH_SIZE) {
        const batch = pieces.slice(i, i + BATCH_SIZE);
        const vecs = await embedBatch(batch);
        embeddings.push(...vecs);
        process.stdout.write(".");
      }
      cache.files[rel] = { hash: fileHash, count: pieces.length, embeddings };
      process.stdout.write(`\n✅ Embedded ${rel} (${pieces.length} chunks)\n`);
    } else {
      embeddings = already.embeddings;
      console.log(`↩️  Cached ${rel} (${pieces.length} chunks)`);
    }

    for (let i = 0; i < pieces.length; i++) {
      index.chunks.push({
        id: `c${idCounter++}`,
        source: rel,
        text: pieces[i],
        embedding: embeddings[i],
      });
    }
  }

  await fs.writeFile(OUT_PATH, JSON.stringify(index), "utf8");
  await saveCache(cache);
  console.log(`\n💾 Saved index -> ${OUT_PATH}`);
  console.log(`Provider: ${EMB_PROVIDER} | Model: ${EMB_MODEL} | Batch: ${BATCH_SIZE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
