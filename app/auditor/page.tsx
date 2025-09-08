"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import {
  Upload,
  FileText,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Download,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ---------- Types ----------
type ExtractResult = {
  ok: boolean;
  fileUrl?: string;
  meta?: { filename: string; contentType: string; size: number };
  preview?: string;
  previewChars?: number;
  keyInfo?: Record<string, any>;
  note?: string;
  error?: string;
  message?: string;
};

type EvidenceRecord = {
  category: string;
  filename: string;
  date: string;
  fields: Record<string, string>;
};

// ---------- Constants ----------
const categories = [
  "Electricity bills (12 months)",
  "Gas bills (12 months)",
  "Water bills (12 months)",
  "Tariff/plan pages (current)",
  "PV generation logs (CSV/API)",
  "Single line diagram",
  "Meter list (NMI/MIRN/sub-meters)",
  "Operating hours & exceptions",
  "Waste invoices (monthly)",
  "IEQ logs (CO₂/ppm by room)",
  "Rated area method & plans",
] as const;

const requiredFields: Record<string, string[]> = {
  "Electricity bills (12 months)": ["kWh", "Solar PV", "NMI"],
  "Gas bills (12 months)": ["MJ", "MIRN"],
  "Water bills (12 months)": ["kL"],
  "Tariff/plan pages (current)": ["Price"],
  "PV generation logs (CSV/API)": ["kWh"],
  "Single line diagram": ["Evidence"],
  "Meter list (NMI/MIRN/sub-meters)": ["Evidence"],
  "Operating hours & exceptions": ["Evidence"],
  "Waste invoices (monthly)": ["kg"],
  "IEQ logs (CO₂/ppm by room)": ["Evidence"],
  "Rated area method & plans": ["Evidence"],
};

// API → UI mapping
const fieldMap: Record<string, string> = {
  electricity_kwh: "kWh",
  gas_mj: "MJ",
  water_kl: "kL",
  emissions_tco2e: "tCO2e",
  has_pv: "Solar PV",
  nmi: "NMI",
  mirn: "MIRN",
};

// ---------- Reusable Evidence Item ----------
function EvidenceItem({
  record,
  index,
  update,
}: {
  record: EvidenceRecord;
  index: number;
  update: (i: number, data: Partial<EvidenceRecord>) => void;
}) {
  return (
    <div className="rounded-lg border p-3 bg-slate-50 space-y-2">
      <div className="text-sm font-medium">
        {record.category} — {record.filename}
      </div>

      {/* Date */}
      <div className="text-xs text-slate-500">
        Date:{" "}
        <input
          type="date"
          value={record.date}
          onChange={(e) => update(index, { date: e.target.value })}
          className="rounded border p-1 text-xs"
        />
      </div>

      {/* Fields */}
      {Object.entries(record.fields).map(([k, v]) => (
        <div key={k} className="flex gap-2 text-xs">
          <span className="text-slate-500">{k}:</span>
          <input
            type="text"
            value={v}
            onChange={(e) =>
              update(index, { fields: { ...record.fields, [k]: e.target.value } })
            }
            className="rounded border p-1 flex-1"
          />
        </div>
      ))}
    </div>
  );
}

// ---------- Main Component ----------
export default function AuditorPage() {
  const [tab, setTab] = useState("method");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>(categories[0]);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // ---------- Upload ----------
  async function handleUpload() {
    if (!selectedFile) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", selectedFile);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json: ExtractResult = await res.json();
      if (!res.ok || !json.fileUrl) throw new Error(json.error || "Upload failed");
      setUploadUrl(json.fileUrl);
      setResult(null);
    } catch (err: any) {
      setResult({ ok: false, error: err.message });
    } finally {
      setBusy(false);
    }
  }

  // ---------- Extract ----------
  async function handleExtract() {
    if (!selectedFile) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", selectedFile);
      const res = await fetch("/api/extract", { method: "POST", body: form });
      const json: ExtractResult = await res.json();
      if (!res.ok) throw new Error(json.error || "Extraction failed");

      setResult(json);

      // Map API keys → UI labels
      const fields: Record<string, string> = {};
      for (const f of requiredFields[category]) {
        const apiKey = Object.keys(fieldMap).find((k) => fieldMap[k] === f);
        fields[f] =
          apiKey && json.keyInfo?.[apiKey] !== undefined
            ? String(json.keyInfo[apiKey])
            : "";
      }

      setEvidence((prev) => [
        ...prev,
        {
          category,
          filename: json.meta?.filename || "unknown",
          date: new Date().toISOString().split("T")[0],
          fields,
        },
      ]);
    } catch (err: any) {
      setResult({ ok: false, error: err.message });
    } finally {
      setBusy(false);
    }
  }

  // ---------- Download CSV ----------
  function handleDownloadCSV() {
    const headers = ["Category", "Filename", "Date", "Fields"];
    const rows = evidence.map((e) => [
      e.category,
      e.filename,
      e.date,
      Object.entries(e.fields)
        .map(([k, v]) => `${k}: ${v}`)
        .join("; "),
    ]);
    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: "evidence.csv",
    });
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---------- Update evidence ----------
  function updateEvidence(index: number, data: Partial<EvidenceRecord>) {
    setEvidence((prev) =>
      prev.map((rec, i) =>
        i === index
          ? { ...rec, ...data, fields: { ...rec.fields, ...data.fields } }
          : rec
      )
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50/20 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-0 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-lid.svg" // put your logo file in /public (svg/png)
              alt="LID Consulting"
              width={36}
              height={36}
              className="h-9 w-9"
              priority
            />
            <div>
              <div className="text-sm font-semibold tracking-tight">LID Consulting</div>
              <div className="text-xs text-slate-500">Childcare Energy & Sustainability</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">At-a-glance</h1>
          <p className="mt-1 text-sm text-slate-600">
            High-level energy, water, and waste indicators. Detailed evidence sits on the private dashboard.
          </p>
        </div>
      </main>

      <section className="mx-auto max-w-7xl px-6 pb-10 pt-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="method">Methodology</TabsTrigger>
            <TabsTrigger value="upload">Upload & Extract</TabsTrigger>
            <TabsTrigger value="evidence">Evidence Uploaded</TabsTrigger>
          </TabsList>

          {/* Methodology */}
          <TabsContent value="method">
            <Card>
              <CardHeader><CardTitle>Methodology (A → G)</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <ol className="list-inside list-decimal space-y-2">
                  <li><b>A. Inception</b> — Kickoff, scope, site selection, inductions.</li>
                  <li><b>B. Data request</b> — Issue audit data sheet & evidence checklist.</li>
                  <li><b>C. Desktop review</b> — Validate bills, meters (NMI/MIRN), drawings.</li>
                  <li><b>D. Site visit</b> — Inspect HVAC, PV/inverters, meters; interview ops team.</li>
                  <li><b>E. Analysis</b> — Build baseline (kWh, MJ, kL, kg), PV coverage, IEQ summary.</li>
                  <li><b>F. Initial results</b> — Present preliminary findings & gaps.</li>
                  <li><b>G. Final report & dashboard</b> — Deliver audit report + populated dashboard.</li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upload & Extract */}
          <TabsContent value="upload">
            <Card>
              <CardHeader><CardTitle>Upload evidence</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {/* Category select */}
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded border p-2 text-sm"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.csv,.txt,.doc,.docx,image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="block w-full rounded-lg border p-2 text-sm"
                />

                <div className="flex items-center gap-2">
                  <Button onClick={handleUpload} disabled={!selectedFile || busy}>
                    <Upload className="mr-2 h-4 w-4" /> Upload
                  </Button>
                  <Button
                    onClick={handleExtract}
                    disabled={!selectedFile || busy}
                    variant="outline"
                  >
                    <FileText className="mr-2 h-4 w-4" /> Extract
                  </Button>
                  {busy && <Badge>Working…</Badge>}
                </div>

                {/* PDF preview */}
                {uploadUrl && (
                  <object
                    data={uploadUrl}
                    type="application/pdf"
                    width="100%"
                    height="400px"
                  >
                    <p>
                      PDF preview unavailable.{" "}
                      <a href={uploadUrl} target="_blank" rel="noopener noreferrer">
                        Download file
                      </a>
                    </p>
                  </object>
                )}

                {/* Error */}
                {result?.error && (
                  <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    {result.error}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Evidence Uploaded */}
          <TabsContent value="evidence">
            <Card>
              <CardHeader className="flex justify-between items-center">
                <CardTitle>Evidence Uploaded</CardTitle>
                {evidence.length > 0 && (
                  <Button onClick={handleDownloadCSV}>
                    <Download className="mr-2 h-4 w-4" /> CSV
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {evidence.length === 0 ? (
                  <p className="text-sm text-slate-500">No evidence yet.</p>
                ) : (
                  <div className="space-y-4">
                    {evidence.map((rec, i) => (
                      <EvidenceItem
                        key={i}
                        record={rec}
                        index={i}
                        update={updateEvidence}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
