// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 25 * 1024 * 1024; // 25MB
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

    const key = `uploads/${crypto.randomUUID()}-${file.name}`;

    // Vercel Blob upload
    const result = await put(key, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type || "application/octet-stream",
    });

    // result has at least: url, pathname, contentType (no 'size')
    return NextResponse.json({
      ok: true,
      url: result.url,
      key: result.pathname ?? new URL(result.url).pathname,
      meta: { filename: file.name, type: result.contentType },
      message: "Upload successful",
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ ok: false, error: err?.message ?? "Upload failed" }, { status: 500 });
  }
}
