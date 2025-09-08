import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";            // pdf-parse needs Node
export const dynamic = "force-dynamic";     // don't statically optimize

// Optional: restrict remote fetches to known-safe domains (e.g. Vercel Blob)
const ALLOW_REMOTE = [
  /\.blob\.vercel-storage\.com$/i,
];

function isAllowedUrl(u: URL) {
  return ALLOW_REMOTE.some(rx => rx.test(u.hostname));
}

// Minimal CSV → text (first ~400 lines)
function csvToText(buf: Buffer) {
  try {
    const str = buf.toString("utf8");
    const lines = str.split(/\r?\n/).slice(0, 400);
    return lines.join("\n");
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get("content-type") || "";

    // Inputs
    let filename = "upload";
    let fileType = "application/octet-stream";
    let data: ArrayBuffer | null = null;

    if (ct.includes("multipart/form-data")) {
      // Client sent the file directly
      const form = await req.formData();
      const f = form.get("file");

      if (!(f instanceof File)) {
        return NextResponse.json(
          { ok: false, error: "No file provided in form-data 'file'." },
          { status: 400 }
        );
      }

      filename = f.name || filename;
      fileType = f.type || fileType;
      data = await f.arrayBuffer();
    } else {
      // Client sent a JSON pointer to a remote file
      const body = await req.json().catch(() => ({} as any));
      const remote = (body?.url || body?.fileUrl) as string | undefined;

      if (!remote) {
        return NextResponse.json(
          { ok: false, error: "Missing 'url' (or 'fileUrl') or multipart file." },
          { status: 400 }
        );
      }

      const u = new URL(remote);
      if (!isAllowedUrl(u)) {
        return NextResponse.json(
          { ok: false, error: `Remote URL not allowed: ${u.hostname}` },
          { status: 400 }
        );
      }

      const r = await fetch(u, { cache: "no-store" });
      if (!r.ok) {
        return NextResponse.json(
          { ok: false, error: `Fetch failed: ${r.status}` },
          { status: 502 }
        );
      }

      const blob = await r.blob();
      filename = body?.fileName || filename;
      fileType = blob.type || body?.fileType || fileType;
      data = await blob.arrayBuffer();
    }

    if (!data) {
      return NextResponse.json({ ok: false, error: "Empty payload." }, { status: 400 });
    }

    const buf = Buffer.from(data);
    const lower = filename.toLowerCase();
    let text = "";

    if (fileType.includes("pdf") || lower.endsWith(".pdf")) {
      // Lazy load pdf-parse
      const pdfParse = (await import("pdf-parse")).default as any;
      const parsed = await pdfParse(buf);
      text = String(parsed?.text || "").slice(0, 120_000);
    } else if (fileType.includes("csv") || lower.endsWith(".csv")) {
      text = csvToText(buf);
    } else if (fileType.includes("text") || lower.endsWith(".txt")) {
      text = buf.toString("utf8").slice(0, 120_000);
    } else {
      // Fallback best-effort utf8
      text = buf.toString("utf8").slice(0, 120_000);
    }

    const rawChars = text.length;

    return NextResponse.json({
      ok: true,
      meta: {
        filename,
        contentType: fileType,
      },
      rawChars,
      excerpt: text.slice(0, 2000),
      // Add any lightweight heuristics here if you want to prefill keyInfo
      // keyInfo: { ... }
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
