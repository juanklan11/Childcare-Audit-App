"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Area,
  Bar,
  Legend,
  ComposedChart,
} from "recharts";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Target,
  Sparkles,
  FileText,
  Clock,
  Building2,
  Leaf,
  Flame,
  Droplet,
  Recycle,
  Thermometer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import BrandHeader from "@/components/BrandHeader";

// =====================================
// Small UI helpers
// =====================================
const InfoPill: React.FC<{ icon?: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm">
    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">{icon}</div>
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-base font-semibold text-slate-900">{value}</div>
    </div>
  </div>
);

const StatusBadge: React.FC<{ status: "Complete" | "Pending" | "Gap" }> = ({ status }) => {
  const styles = {
    Complete: "bg-emerald-100 text-emerald-700 border-emerald-300",
    Pending: "bg-amber-100 text-amber-700 border-amber-300",
    Gap: "bg-red-100 text-red-700 border-red-300",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
      {status === "Complete" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      {status}
    </span>
  );
};

const PriorityBadge: React.FC<{ level: "High" | "Medium" | "Low" }> = ({ level }) => {
  const styles = {
    High: "bg-red-100 text-red-700 border-red-300",
    Medium: "bg-amber-100 text-amber-700 border-amber-300",
    Low: "bg-emerald-100 text-emerald-700 border-emerald-300",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${styles[level]}`}>
      <Target className="h-3.5 w-3.5" />
      {level} priority
    </span>
  );
};

const SourceTag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mt-2 text-[11px] italic text-slate-500">Source: {children}</div>
);

// =====================================
// Mocked data model (replace with live data)
// =====================================

const evidence: Array<{
  id: string;
  category: string;
  items: Array<{ name: string; status: "Complete" | "Pending" | "Gap"; files: number; note?: string }>;
}> = [
  {
    id: "areas",
    category: "Rated Area & Method",
    items: [
      { name: "Rated area (m²)", status: "Pending", files: 1 },
      { name: "GFA/GLA/GLAR/NLA breakdown", status: "Pending", files: 0 },
      { name: "Evidence: method of area calculation", status: "Pending", files: 0, note: "BOMA/lettable/GFA" },
      { name: "Single line & technical drawings", status: "Pending", files: 0 },
    ],
  },
  {
    id: "hours",
    category: "Operating Hours & Occupancy",
    items: [
      { name: "Operating hours (by day)", status: "Pending", files: 0 },
      { name: "Arrival (20%) time", status: "Pending", files: 0 },
      { name: "Departure (80%) time", status: "Pending", files: 0 },
      { name: "Exceptions >20% outside typical hours", status: "Pending", files: 0 },
      { name: "Basis of knowledge (roster/logs)", status: "Pending", files: 0 },
      { name: "Evidence (contract with provider)", status: "Pending", files: 0 },
    ],
  },
  {
    id: "energy",
    category: "Energy – Utilities & End-uses",
    items: [
      { name: "Electricity bills (12 mo)", status: "Pending", files: 0 },
      { name: "Gas bills (12 mo)", status: "Pending", files: 0 },
      { name: "Diesel bills (if any)", status: "Pending", files: 0 },
      { name: "End-use boundary (HVAC/cooking/specialised)", status: "Pending", files: 0 },
      { name: "Non-utility meters list", status: "Pending", files: 0 },
      { name: "On-site renewables (PV) generation logs", status: "Pending", files: 0 },
    ],
  },
  {
    id: "water",
    category: "Water",
    items: [
      { name: "Water bills (12 mo)", status: "Pending", files: 0 },
      { name: "Reticulation diagram", status: "Pending", files: 0 },
      { name: "Non-utility meters data", status: "Pending", files: 0 },
      { name: "Recycled water volumes", status: "Pending", files: 0 },
    ],
  },
  {
    id: "ieq",
    category: "Indoor Environment (IEQ)",
    items: [
      { name: "CO₂ sensors by room (<800 ppm target)", status: "Pending", files: 0 },
      { name: "User guidance (open windows vs AC)", status: "Pending", files: 0 },
    ],
  },
  {
    id: "waste",
    category: "Waste",
    items: [
      { name: "Monthly waste bill & cost", status: "Pending", files: 0 },
      { name: "Streams (gen/recycle/organics)", status: "Pending", files: 0 },
      { name: "Lifts per stream & contamination notes", status: "Pending", files: 0 },
    ],
  },
];

// Sample time-series (replace with real)
const months = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"];
const energySeries = months.map((m, i) => ({
  month: m,
  electricity_kwh: [8200, 7900, 7600, 7300, 7000, 7200, 7800, 8400, 9000, 9500, 9100, 8700][i],
  gas_mj:           [2300, 2100, 1900, 1800, 1700, 1800, 2000, 2200, 2600, 2800, 2600, 2400][i],
  pv_gen_kwh:       [1200, 1300, 1500, 1600, 1700, 1800, 1800, 1700, 1500, 1300, 1200, 1100][i],
}));
const waterSeries = months.map((m, i) => ({ month: m, water_kl: [80, 76, 74, 78, 82, 85, 88, 92, 96, 90, 86, 82][i] }));
const wasteSeries = months.map((m, i) => ({
  month: m,
  waste_total_kg: [1200, 1150, 1100, 1080, 1120, 1180, 1250, 1300, 1350, 1280, 1220, 1180][i],
  recycle_pct:    [  38,   40,   41,   42,   43,   41,   39,   40,   42,   43,   44,   45][i],
}));
const rooms = ["Koalas", "Wombats", "Kookaburras", "Possums", "Platypus"];
const ieq = rooms.map((r, i) => ({ room: r, co2_median: [620, 720, 780, 640, 690][i], co2_p95: [820, 980, 1040, 860, 900][i] }));

// =====================================
// Derived metrics
// =====================================
function pctComplete() {
  const all = evidence.flatMap((c) => c.items);
  const done = all.filter((i) => i.status === "Complete").length;
  return Math.round((done / all.length) * 100);
}

export default function NEPIAuditDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const annuals = useMemo(() => {
    const elec = energySeries.reduce((a, b) => a + b.electricity_kwh, 0);
    const gasMJ = energySeries.reduce((a, b) => a + b.gas_mj, 0);
    const pv = energySeries.reduce((a, b) => a + b.pv_gen_kwh, 0);
    const renewShare = Math.round((pv / (elec || 1)) * 100);
    const water = waterSeries.reduce((a, b) => a + b.water_kl, 0);
    const waste = wasteSeries.reduce((a, b) => a + b.waste_total_kg, 0);
    return { elec, gasMJ, pv, renewShare, water, waste };
  }, []);

  if (typeof window !== "undefined") {
    console.assert(evidence.length >= 5, "Evidence categories present");
    console.assert(energySeries.length === 12, "Energy series should be 12 months");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      {/* PAGE HEADER */}
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

      {/* HERO OVERVIEW */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">At-a-glance</h1>
          <p className="mt-1 text-sm text-slate-600">High-level energy, water, and waste indicators. Detailed evidence sits on the private dashboard.</p>
        </div>
      </main>
      <section className="mx-auto max-w-7xl px-6 pb-2 pt-8">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="rounded-3xl border bg-white p-6 shadow-sm">
              <h1 className="text-2xl font-semibold tracking-tight">Executive Summary</h1>
              <p className="mt-2 text-slate-600">NABERS Energy Performance Indicator (Childcare) intake status, evidence readiness, and early performance KPIs for energy, water, waste, and IEQ.</p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
                <InfoPill icon={<FileText className="h-4 w-4" />} label="Evidence readiness" value={`${pctComplete()}%`} />
                <InfoPill icon={<BarChart3 className="h-4 w-4" />} label="Annual electricity" value={`${annuals.elec.toLocaleString()} kWh`} />
                <InfoPill icon={<Leaf className="h-4 w-4" />} label="Renewables share" value={`${annuals.renewShare}%`} />
                <InfoPill icon={<Droplet className="h-4 w-4" />} label="Annual water" value={`${annuals.water.toLocaleString()} kL`} />
              </div>
              <ul className="mt-4 list-inside list-disc text-sm text-slate-700">
                <li>All intake data aligns to NABERS NEPI “The Rules” for childcare, including rated area, hours, energy boundary, and evidence trail.</li>
                <li>KPIs below update as bills and meter logs are added. IEQ targets use CO₂ &lt; 800 ppm as a steady-state guide.</li>
              </ul>
              <SourceTag>NABERS Energy Performance Indicator for Childcare — The Rules v1.3 (scope, evidence, operating hours).</SourceTag>
            </motion.div>
          </div>
          <div className="lg:col-span-1">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="rounded-3xl border bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Quick context</h2>
              <div className="mt-3 space-y-3 text-sm text-slate-700">
                <p>Use this dashboard to brief investors and parents on verified performance and works in progress.</p>
                <p className="text-slate-500">Modules: Evidence, Occupancy survey, Energy & Water, Waste, IEQ, Recommendations.</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Rated area (m²)</div>
                  <div className="text-lg font-semibold">—</div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="text-xs text-slate-500">Operating hours</div>
                  <div className="text-lg font-semibold">Mon–Fri</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* MAIN */}
      <section className="mx-auto max-w-7xl px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
            <TabsTrigger value="energy">Energy & Water</TabsTrigger>
            <TabsTrigger value="waste">Waste</TabsTrigger>
            <TabsTrigger value="ieq">IEQ</TabsTrigger>
            <TabsTrigger value="recs">Recommendations</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {[
                { icon: <Building2 className="h-4 w-4" />, title: "Rated Area & Method", cat: "areas" },
                { icon: <Clock className="h-4 w-4" />, title: "Operating Hours & Occupancy", cat: "hours" },
                { icon: <Flame className="h-4 w-4" />, title: "Energy & End-uses", cat: "energy" },
                { icon: <Droplet className="h-4 w-4" />, title: "Water", cat: "water" },
                { icon: <Thermometer className="h-4 w-4" />, title: "IEQ", cat: "ieq" },
                { icon: <Recycle className="h-4 w-4" />, title: "Waste", cat: "waste" },
              ].map((c) => {
                const cat = evidence.find((e) => e.id === (c.cat as any));
                const total = cat?.items.length || 0;
                const done = cat?.items.filter((i) => i.status === "Complete").length || 0;
                const pct = total ? Math.round((done / total) * 100) : 0;
                return (
                  <Card key={c.title} className="rounded-3xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">{c.icon}{c.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <StatusBadge status={pct === 100 ? "Complete" : "Pending"} />
                        <span className="text-sm text-slate-500">{done}/{total} items</span>
                      </div>
                      <div className="mt-3">
                        <Progress value={pct} />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* EVIDENCE */}
          <TabsContent value="evidence">
            <div className="space-y-6">
              {evidence.map((cat) => (
                <Card key={cat.id} className="rounded-3xl">
                  <CardHeader>
                    <CardTitle className="text-base">{cat.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-slate-500">
                            <th className="py-2 pr-4">Item</th>
                            <th className="py-2 pr-4">Status</th>
                            <th className="py-2 pr-4">Files</th>
                            <th className="py-2 pr-4">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cat.items.map((it, i) => (
                            <tr key={i} className="border-t">
                              <td className="py-2 pr-4">{it.name}</td>
                              <td className="py-2 pr-4"><StatusBadge status={it.status} /></td>
                              <td className="py-2 pr-4">{it.files}</td>
                              <td className="py-2 pr-4 text-slate-500">{it.note || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <SourceTag>NABERS NEPI v1.3 — evidence sufficiency and boundary definitions.</SourceTag>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* OCCUPANCY */}
          <TabsContent value="occupancy">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="rounded-3xl">
                <CardHeader><CardTitle>Typical Day — 20%/80% markers</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <div className="text-xs text-slate-500">20% arrived by</div>
                      <div className="text-lg font-semibold">08:15</div>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <div className="text-xs text-slate-500">80% departed by</div>
                      <div className="text-lg font-semibold">17:30</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-xs text-slate-500">Exceptions & basis</div>
                    <div className="mt-1 rounded-xl border p-3 text-sm">
                      <div><strong>Exceptions:</strong> School holiday program and occasional weekend community events.</div>
                      <div className="mt-1"><strong>Basis:</strong> Staff roster + sign-in logs</div>
                    </div>
                  </div>
                  <SourceTag>NABERS NEPI v1.3 — operating hours & occupancy guidance.</SourceTag>
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader><CardTitle>Operating Hours</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-sm text-slate-700">Mon–Fri 07:30–18:00 (school terms); holiday program hours vary.</div>
                  <div className="mt-3 rounded-xl border p-3 text-xs text-slate-600">
                    Please provide term calendars and any weekend/community use notes exceeding 20% occupancy.
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ENERGY & WATER */}
          <TabsContent value="energy">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="rounded-3xl">
                <CardHeader><CardTitle>Energy — Monthly</CardTitle></CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={energySeries} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" orientation="left" label={{ value: "kWh", angle: -90, position: "insideLeft" }} />
                      <YAxis yAxisId="right" orientation="right" label={{ value: "MJ", angle: 90, position: "insideRight" }} />
                      <ReTooltip />
                      <Area yAxisId="left" type="monotone" dataKey="electricity_kwh" name="Electricity (kWh)" fillOpacity={0.2} fill="#0ea5e9" stroke="#0ea5e9" />
                      <Line yAxisId="right" type="monotone" dataKey="gas_mj" name="Gas (MJ)" stroke="#f97316" strokeWidth={2} dot />
                      <Line yAxisId="left" type="monotone" dataKey="pv_gen_kwh" name="PV generation (kWh)" stroke="#10b981" strokeWidth={2} dot />
                      <Legend />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                    <div className="rounded-lg bg-slate-50 p-2"><div className="text-slate-500">Annual electricity</div><div className="font-semibold">{annuals.elec.toLocaleString()} kWh</div></div>
                    <div className="rounded-lg bg-slate-50 p-2"><div className="text-slate-500">Annual gas</div><div className="font-semibold">{annuals.gasMJ.toLocaleString()} MJ</div></div>
                    <div className="rounded-lg bg-slate-50 p-2"><div className="text-slate-500">PV generation</div><div className="font-semibold">{annuals.pv.toLocaleString()} kWh</div></div>
                  </div>
                  <SourceTag>Utility bills (12 months), AMI/sub-meter logs, PV inverter portal.</SourceTag>
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader><CardTitle>Water — Monthly</CardTitle></CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={waterSeries} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ReTooltip />
                      <Area type="monotone" dataKey="water_kl" name="Water (kL)" fillOpacity={0.2} fill="#6366f1" stroke="#6366f1" />
                      <Legend />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div className="mt-3 text-xs text-slate-500">Annual water usage: <span className="font-semibold text-slate-700">{annuals.water.toLocaleString()} kL</span></div>
                  <SourceTag>Water bills (12 months) & reticulation diagram.</SourceTag>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* WASTE */}
          <TabsContent value="waste">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="rounded-3xl">
                <CardHeader><CardTitle>Waste & Recycling</CardTitle></CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={wasteSeries} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                      <ReTooltip />
                      <Bar yAxisId="left" dataKey="waste_total_kg" name="Total waste (kg)" fill="#94a3b8" radius={[8,8,0,0]} />
                      <Line yAxisId="right" type="monotone" dataKey="recycle_pct" name="Recycling rate (%)" stroke="#10b981" strokeWidth={2} dot />
                      <Legend />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div className="mt-3 text-xs text-slate-500">Annual waste: <span className="font-semibold text-slate-700">{annuals.waste.toLocaleString()} kg</span></div>
                  <SourceTag>Waste invoices & collector reports; site audit logs.</SourceTag>
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader><CardTitle>Cost & Collection Optimisation</CardTitle></CardHeader>
                <CardContent>
                  <ul className="list-inside list-disc space-y-2 text-sm text-slate-700">
                    <li>Adjust lift frequency to match actual volumes.</li>
                    <li>Improve stream separation to reduce contamination charges.</li>
                    <li>Engage provider on organics diversion where viable.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* IEQ */}
          <TabsContent value="ieq">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="rounded-3xl">
                <CardHeader><CardTitle>CO₂ by Room</CardTitle></CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={ieq} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="room" />
                      <YAxis />
                      <ReTooltip />
                      <Bar dataKey="co2_median" name="Median (ppm)" fill="#64748b" radius={[8,8,0,0]} />
                      <Line type="monotone" dataKey="co2_p95" name="95th (ppm)" stroke="#ef4444" strokeWidth={2} dot />
                      <Legend />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div className="mt-3 text-xs text-slate-500">Target steady-state CO₂ &lt; 800 ppm during occupied hours.</div>
                  <SourceTag>Room-level CO₂ sensors; post-occupancy audits; NABERS/IEQ guidance.</SourceTag>
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader><CardTitle>Comfort & Operations Notes</CardTitle></CardHeader>
                <CardContent>
                  <ul className="list-inside list-disc space-y-2 text-sm text-slate-700">
                    <li>When solar output is high, prefer AC over open windows to capture renewable cooling and maintain comfort.</li>
                    <li>Seal gaps under doors/around windows; check insulation at reveals to reduce leakage.</li>
                    <li>Consider simple prompts or sensors to guide natural ventilation without excessive energy use.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* RECOMMENDATIONS */}
          <TabsContent value="recs">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {[
                { title: "Controls tune-up (6–8 weeks)", detail: "Schedules, set-points, CO₂-linked ventilation, timers.", priority: "High" as const },
                { title: "Fabric fixes (low-cost)", detail: "Door sweeps, window seals, thermal blinds in high-gain rooms.", priority: "Medium" as const },
                { title: "Metering & evidence", detail: "Align NMI/MIRNs, add sub-meters for kitchens/HVAC, PV logging.", priority: "High" as const },
                { title: "Procurement review", detail: "Check demand charges, roll-over dates; consider group buys/PPAs.", priority: "Medium" as const },
                { title: "Waste stream optimisation", detail: "Right-size collections; reduce contamination fees.", priority: "Low" as const },
              ].map((r) => (
                <Card key={r.title} className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>{r.title}</span>
                      <PriorityBadge level={r.priority} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">{r.detail}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-4 text-xs text-slate-500">
              *ROI/IRR available once baseline and bills are ingested; results can be published as investor and parent snapshots.*
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* FOOTER */}
      <footer className="mx-auto max-w-7xl px-6 pb-10 pt-4 text-xs text-slate-500">
        <div className="flex flex-col items-start justify-between gap-3 border-t pt-4 md:flex-row md:items-center">
          <div>© {new Date().getFullYear()} LAMA Sustainability Solutions — NEPI Audit Dashboard</div>
          <div className="flex items-center gap-3">
            <span>Evidence-first • No print/export controls</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
