import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs"; // required for pdf-parse

// Minimal CSV to text
function csvToText(buf: Buffer) {
  try {
    const str = buf.toString("utf8");
    const lines = str.split(/\r?\n/).slice(0, 400); // cap rows
    return lines.join("\n");
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // Accept both multipart/form-data (file upload) and JSON ({ fileUrl })
    let filename = "upload";
    let fileType = "application/octet-stream";
    let data: ArrayBuffer | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const f = form.get("file");
      if (f && typeof f !== "string") {
        filename = (f as File).name || filename;
        fileType = (f as File).type || fileType;
        data = await (f as File).arrayBuffer();
      } else {
        return NextResponse.json({ ok: false, error: "No file provided in form-data 'file'." }, { status: 400 });
      }
    } else {
      const body = await req.json().catch(() => ({} as any));
      const fileUrl: string | undefined = body?.fileUrl;
      if (!fileUrl) {
        return NextResponse.json({ ok: false, error: "Missing fileUrl or multipart file." }, { status: 400 });
      }
      const r = await fetch(fileUrl);
      if (!r.ok) return NextResponse.json({ ok: false, error: `Fetch failed: ${r.status}` }, { status: 502 });
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
      // Dynamic import so it only loads on demand
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = (await import("pdf-parse")).default as any;
      const parsed = await pdfParse(buf);
      text = (parsed?.text || "").slice(0, 120_000);
    } else if (fileType.includes("csv") || lower.endsWith(".csv")) {
      text = csvToText(buf);
    } else if (fileType.includes("text") || lower.endsWith(".txt")) {
      text = buf.toString("utf8").slice(0, 120_000);
    } else {
      // Fallback: try as utf8
      text = buf.toString("utf8").slice(0, 120_000);
    }

    const rawChars = (text || "").length;

    return NextResponse.json({
      ok: true,
      filename,
      fileType,
      rawChars,
      excerpt: text.slice(0, 2000),
      // For your UI: feed `text` into your AI step on the client or another API route
      // to summarise/extract KPIs.
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
