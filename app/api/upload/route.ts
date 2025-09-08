// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const runtime = "nodejs"; // must be nodejs, not edge

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    // ✅ Save inside /public/uploads so it's accessible
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, file.name);
    await writeFile(filePath, bytes);

    // Public URL (Next.js serves /public/* at root)
    const fileUrl = `/uploads/${encodeURIComponent(file.name)}`;

    return NextResponse.json({
      ok: true,
      fileUrl,
      meta: { filename: file.name, size: bytes.length, type: file.type },
      message: "Upload successful",
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}