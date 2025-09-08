"use client";
import React from "react";
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Area, Line, Bar, Legend, Tooltip as ReTooltip } from "recharts";
import { Sparkles, Leaf, Droplet, BarChart3 } from "lucide-react";
import Image from "next/image";

// ---- AU financial year (Apr → Mar) sample series ----
const months = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"];

const energySeries = months.map((m,i)=>({
  month:m,
  electricity_kwh:[8200,7900,7600,7300,7000,7200,7800,8400,9000,9500,9100,8700][i],
  pv_gen_kwh:[1200,1300,1500,1600,1700,1800,1800,1700,1500,1300,1200,1100][i],
}));

const waterSeries = months.map((m,i)=>({
  month:m,
  water_kl:[80,76,74,78,82,85,88,92,96,90,86,82][i],
}));

const wasteSeries = months.map((m,i)=>({
  month:m,
  waste_total_kg:[1200,1150,1100,1080,1120,1180,1250,1300,1350,1280,1220,1180][i],
  recycle_pct:[38,40,41,42,43,41,39,40,42,43,44,45][i],
}));

export default function ParentSnapshot() {
  const annuals = React.useMemo(()=>{
    const elec = energySeries.reduce((a,b)=>a+b.electricity_kwh,0);
    const pv = energySeries.reduce((a,b)=>a+b.pv_gen_kwh,0);
    const water = waterSeries.reduce((a,b)=>a+b.water_kl,0);
    const renewShare = Math.round((pv/(elec||1))*100);
    return { elec, pv, water, renewShare };
  },[]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      {/* LID-style header */}
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
      
      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* KPI pills */}
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">At-a-glance</h1>
          <p className="mt-1 text-sm text-slate-600">High-level energy, water, and waste indicators. Detailed evidence sits on the private dashboard.</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border bg-slate-50 p-4"><div className="text-xs text-slate-500">Annual electricity</div><div className="flex items-center gap-2 text-lg font-semibold"><BarChart3 className="h-4 w-4"/>{annuals.elec.toLocaleString()} kWh</div></div>
            <div className="rounded-2xl border bg-slate-50 p-4"><div className="text-xs text-slate-500">PV generation</div><div className="text-lg font-semibold">{annuals.pv.toLocaleString()} kWh</div></div>
            <div className="rounded-2xl border bg-slate-50 p-4"><div className="text-xs text-slate-500">Renewables share</div><div className="flex items-center gap-2 text-lg font-semibold"><Leaf className="h-4 w-4"/>{annuals.renewShare}%</div></div>
            <div className="rounded-2xl border bg-slate-50 p-4"><div className="text-xs text-slate-500">Annual water</div><div className="flex items-center gap-2 text-lg font-semibold"><Droplet className="h-4 w-4"/>{annuals.water.toLocaleString()} kL</div></div>
          </div>
        </div>

        {/* Charts */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold">Electricity & Solar</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={energySeries} margin={{ top:10,right:20,bottom:0,left:-10 }}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis dataKey="month"/><YAxis/>
                  <ReTooltip/>
                  <Area type="monotone" dataKey="electricity_kwh" name="Electricity (kWh)" fillOpacity={0.2} fill="#0ea5e9" stroke="#0ea5e9"/>
                  <Line type="monotone" dataKey="pv_gen_kwh" name="PV generation (kWh)" stroke="#10b981" strokeWidth={2} dot/>
                  <Legend/>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[11px] italic text-slate-500">Source: Utility bills & inverter logs (12 months)</div>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold">Water</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={waterSeries} margin={{ top:10,right:20,bottom:0,left:-10 }}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis dataKey="month"/><YAxis/>
                  <ReTooltip/>
                  <Area type="monotone" dataKey="water_kl" name="Water (kL)" fillOpacity={0.2} fill="#6366f1" stroke="#6366f1"/>
                  <Legend/>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[11px] italic text-slate-500">Source: Water bills (12 months)</div>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold">Waste & Recycling</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={wasteSeries} margin={{ top:10,right:20,bottom:0,left:-10 }}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis dataKey="month"/>
                  <YAxis yAxisId="left"/><YAxis yAxisId="right" orientation="right" domain={[0,100]}/>
                  <ReTooltip/>
                  <Bar yAxisId="left" dataKey="waste_total_kg" name="Total waste (kg)" fill="#94a3b8" radius={[8,8,0,0]}/>
                  <Line yAxisId="right" type="monotone" dataKey="recycle_pct" name="Recycling rate (%)" stroke="#10b981" strokeWidth={2} dot/>
                  <Legend/>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-[11px] italic text-slate-500">Source: Waste invoices & collector reports (12 months)</div>
          </div>
        </div>

        <div className="mt-8 text-xs text-slate-500">*Snapshot excludes confidential evidence. Verified results live on the private dashboard.</div>
      </main>
    </div>
  );
}
