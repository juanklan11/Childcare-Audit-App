import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { join } from "path";

type LeadRow = {
  ref: string;
  name: string;
  contact_ph?: string;
  url?: string;
  coordinates?: string;
};

// Parse a CSV string into an array of LeadRow objects.
function parseCsv(text: string): LeadRow[] {
  // Trim whitespace and split into lines.
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  // Extract headers from the first line.
  const headers = lines[0].split(",").map((h) => h.trim());

  // Convert each subsequent line into a LeadRow.
  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? "";
    });
    return {
      ref: row.ref || "",
      name: row.name || "",
      position: row.position || "",
      company: row.company || "",
      location: row.location || "",
      email: row.email || "",
      linkedin: row.linkedin || "",
    };
  });
}

export async function GET() {
  try {
    // Load leads from /public/data/leads.csv
    const filePath = join(process.cwd(), "public", "data", "leads.csv");
    const csv = await fs.readFile(filePath, "utf8");
    const rows = parseCsv(csv);
    return NextResponse.json({
      rows,
      note: "Loaded from /public/data/leads.csv",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        rows: [],
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
