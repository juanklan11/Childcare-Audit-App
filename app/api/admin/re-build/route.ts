// app/api/admin/rebuild-kb/route.ts
import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("x-admin-token");
    if (!token || token !== process.env.RAG_ADMIN_TOKEN) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Run the script as a child process
    const script = path.join(process.cwd(), "scripts", "ingest-pdfs.mjs");

    const out = await new Promise<{ code: number; stdout: string; stderr: string }>((resolve) => {
      exec(`node "${script}"`, { env: process.env }, (err, stdout, stderr) => {
        resolve({ code: err ? 1 : 0, stdout, stderr });
      });
    });

    if (out.code !== 0) {
      return NextResponse.json({ ok: false, error: out.stderr || "Ingest failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Rebuilt knowledge index", log: out.stdout });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}
