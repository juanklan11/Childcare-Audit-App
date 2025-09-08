"use client";

import Image from "next/image";
import React from "react";

type Lead = {
  ref?: string;
  name?: string;
  contact_ph?: string;
  url?: string;
  coordinates?: string;
};

function parseCSV(text: string): Lead[] {
  const [headerLine, ...rows] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());
  return rows.map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const obj: any = {};
    headers.forEach((h, i) => (obj[h] = cols[i] ?? ""));
    return obj as Lead;
  });
}

export default function LeadsPage() {
  const [data, setData] = React.useState<Lead[]>([]);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setErr(null);
      const candidates = ["/data/leads.csv", "/leads.csv"];
      for (const path of candidates) {
        try {
          const res = await fetch(path, { cache: "no-store" });
          if (!res.ok) continue;
          const txt = await res.text();
          const parsed = parseCSV(txt);
          if (!cancelled) setData(parsed);
          return;
        } catch {
          /* try next */
        }
      }
      if (!cancelled) setErr("No leads CSV found at /data/leads.csv or /leads.csv");
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/lid-logo.svg" alt="LID Consulting" width={36} height={36} className="h-9 w-9" />
          <div>
            <div className="text-sm font-semibold tracking-tight">Leads</div>
            <div className="text-xs text-slate-500">Admin view • CSV-backed</div>
          </div>
        </div>
        <span className="rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-medium text-emerald-700">
          Private
        </span>
      </header>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        {err && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            {err}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-slate-500">
                <th className="px-4 py-2">Ref</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Position</th>
                <th className="px-4 py-2">Company</th>
                <th className="px-4 py-2">Location</th>
                <th className="px-4 py-2">email</th>
                <th className="px-4 py-2">Linkedin</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={5}>
                    {err ? "Could not load leads." : "No rows yet."}
                  </td>
                </tr>
              ) : (
                data.map((r, i) => (
                  <tr key={`${r.ref || r.name || "row"}-${i}`} className="border-t">
                    <td className="px-4 py-2">{r.ref || "—"}</td>
                    <td className="px-4 py-2">{r.name || "—"}</td>
                    <td className="px-4 py-2">{r.Positon || "—"}</td>
                    <td className="px-4 py-2">{r.Company || "—"}</td>
                    <td className="px-4 py-2">{r.Location || "—"}</td>                
                    <td className="px-4 py-2">
                      {r.email ? (
                        <a className="text-emerald-700 underline" href={r.email} target="_blank">
                          {r.email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                     <td className="px-4 py-2">{r.linkedin || "—"}</td>                    
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
