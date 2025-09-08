"use client";

import Image from "next/image";
import React from "react";

type Provider = {
  ref?: string;
  name?: string;
  contact_ph?: string;
  url?: string;
  coordinates?: string;
};

function parseCSV(text: string): Provider[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const row: any = {};
    headers.forEach((h, i) => (row[h] = cols[i] ?? ""));
    return row as Provider;
  });
}

export default function ProvidersPage() {
  const [data, setData] = React.useState<Provider[]>([]);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setErr(null);
      // Try common locations; adjust to your repo structure if needed
      const paths = ["/data/providers.csv", "/providers.csv"];
      for (const p of paths) {
        try {
          const res = await fetch(p, { cache: "no-store" });
          if (!res.ok) continue;
          const text = await res.text();
          const parsed = parseCSV(text);
          if (!cancelled) setData(parsed);
          return;
        } catch {
          // continue
        }
      }
      if (!cancelled) setErr("No providers CSV found at /data/providers.csv or /providers.csv");
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
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
                <th className="px-4 py-2">ref</th>
                <th className="px-4 py-2">name</th>
                <th className="px-4 py-2">contact_ph</th>
                <th className="px-4 py-2">url</th>
                <th className="px-4 py-2">coordinates</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={5}>
                    {err ? "Could not load providers." : "No rows yet."}
                  </td>
                </tr>
              ) : (
                data.map((r, i) => (
                  <tr key={`${r.ref || r.name || "row"}-${i}`} className="border-t">
                    <td className="px-4 py-2">{r.ref || "—"}</td>
                    <td className="px-4 py-2">{r.name || "—"}</td>
                    <td className="px-4 py-2">{r.contact_ph || "—"}</td>
                    <td className="px-4 py-2">
                      {r.url ? (
                        <a className="text-emerald-700 underline" href={r.url} target="_blank">
                          {r.url}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2">{r.coordinates || "—"}</td>
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
