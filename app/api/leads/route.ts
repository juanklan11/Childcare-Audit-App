import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

type LeadRow = {
  ref: string;
  name: string;
  contact_ph?: string;
  url?: string;
  coordinates?: string;
};

function parseCsv(text: string): LeadRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((ln) => {
    const cells = ln.split(",").map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = cells[i] ?? ""));
    // normalise keys to what the UI expects
    return {
      ref: row.ref || "",
      name: row.name || "",
      contact_ph: row.contact_ph || "",
      url: row.url || "",
      coordinates: row.coordinates || "",
    };
  });
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "childcare-centres.csv");
    const csv = await fs.readFile(filePath, "utf8");
    const rows = parseCsv(csv);
    return NextResponse.json({ rows, note: "Loaded from /public/data/childcare-centres.csv" });
  } catch (err: any) {
    return NextResponse.json(
      { rows: [], error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
