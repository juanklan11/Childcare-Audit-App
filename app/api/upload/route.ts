// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";           // must be nodejs (not edge)
export const dynamic = "force-dynamic";    // avoid static optimization of the route

// Optional: basic guardrails
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: "File too large" }, { status: 413 });
    }
    if (ALLOWED.length && !ALLOWED.includes(file.type)) {
      return NextResponse.json({ ok: false, error: `Unsupported type: ${file.type}` }, { status: 415 });
    }

    // Make a unique key inside a folder
    const key = `uploads/${crypto.randomUUID()}-${file.name}`;

    // Persist to Vercel Blob (public by default here)
    const { url, pathname, size, contentType } = await put(key, file, {
      access: "public", // or "private" if you’ll sign URLs yourself
      addRandomSuffix: false, // we already added a UUID
      contentType: file.type || "application/octet-stream",
    });

    return NextResponse.json({
      ok: true,
      url,                         // e.g. https://<your-bucket>.public.blob.vercel-storage.com/uploads/...
      key: pathname,               // blob key in the store
      meta: { filename: file.name, size, type: contentType },
      message: "Upload successful",
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ ok: false, error: err.message ?? "Upload failed" }, { status: 500 });
  }
}
