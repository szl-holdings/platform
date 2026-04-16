import { useState } from "react";
import { m } from "framer-motion";
import { Link } from "wouter";
import { DollarSign, ArrowLeft, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const CASH_FLOW = [
  { month: "Jan 26", cash: 24.8, deployed: 2.1, mgmtFees: 0.26 },
  { month: "Feb 26", cash: 22.4, deployed: 2.7, mgmtFees: 0.26 },
  { month: "Mar 26", cash: 19.8, deployed: 2.9, mgmtFees: 0.26 },
  { month: "Apr 26", cash: 18.2, deployed: 1.8, mgmtFees: 0.26 },
  { month: "May 26", cash: 22.4, deployed: 1.2, mgmtFees: 0.26 },
  { month: "Jun 26", cash: 21.0, deployed: 2.0, mgmtFees: 0.26 },
  { month: "Jul 26", cash: 18.8, deployed: 2.4, mgmtFees: 0.26 },
  { month: "Aug 26", cash: 16.2, deployed: 2.1, mgmtFees: 0.26 },
];

const CAPITAL_CALLS = [
  { id: "cc3", callNo: 3, date: "Jun 15, 2026", amount: "$4.2M", status: "scheduled", purpose: "Follow-on investments + reserves", funded: 0, total: 4200000 },
  { id: "cc2", callNo: 2, date: "Jan 10, 2026", amount: "$8.1M", status: "fully_funded", purpose: "Series A follow-ons + new investment", funded: 8100000, total: 8100000 },
  { id: "cc1", callNo: 1, date: "Mar 15, 2025", amount: "$12.4M", status: "fully_funded", purpose: "Initial deployment + platform costs", funded: 12400000, total: 12400000 },
];

const DISTRIBUTIONS = [
  { id: "d2", date: "Feb 28, 2026", amount: "$3.8M", type: "Realized proceeds — SZL Cortex partial exit", status: "distributed" },
  { id: "d1", date: "Aug 30, 2025", amount: "$2.1M", type: "Income distribution — mgmt fee offsets", status: "distributed" },
];

const FORECAST = [
  { month: "May 26", inflow: 4200, outflow: 1400, net: 2800 },
  { month: "Jun 26", inflow: 0, outflow: 1800, net: -1800 },
  { month: "Jul 26", inflow: 0, outflow: 1400, net: -1400 },
  { month: "Aug 26", inflow: 0, outflow: 1400, net: -1400 },
  { month: "Sep 26", inflow: 2100, outflow: 1400, net: 700 },
  { month: "Oct 26", inflow: 0, outflow: 1400, net: -1400 },
];

const STATUS_COLORS: Record<string, string> = {
  scheduled: "#d4a054",
  fully_funded: "#6aaa72",
  distributed: "#6aaa72",
  partial: "#4a90b8",
};

export default function TreasuryPage() {
  usePageMeta({ title: "Treasury & Cash Management — SZL Fund Intelligence", description: "Capital call optimization, distribution planning, and cash flow forecasting." });
  const [tab, setTab] = useState<"overview" | "calls" | "forecast">("overview");

  return (
    <div className="min-h-screen bg-[#080b10] text-white">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-6 pt-28 pb-24">
        <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-6">
            <Link href="/fund"><button className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70"><ArrowLeft className="h-3.5 w-3.5" /> Fund Intelligence</button></Link>
            <ChevronRight className="h-3 w-3 text-white/20" />
            <span className="text-[11px] text-white/60">Treasury & Cash Management</span>
          </div>

          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d4a054]/15">
              <DollarSign className="h-4.5 w-4.5 text-[#d4a054]" style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Treasury & Cash Management</h1>
              <p className="text-xs text-white/40">Capital call optimization · distribution planning · AI cash flow forecasting</p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3 mb-8">
            {[
              { label: "Dry Powder", value: "$18.2M", sub: "Available capital", color: "#6aaa72" },
              { label: "Total Committed", value: "$65.0M", sub: "Fund I", color: "#4a90b8" },
              { label: "Called Capital", value: "$52.8M", sub: "81.2% called", color: "#d4a054" },
              { label: "Distributed", value: "$5.9M", sub: "DPI 0.62×", color: "#8b7ac8" },
              { label: "Next Capital Call", value: "Jun 15", sub: "$4.2M · Call #3", color: "#c45a4a" },
            ].map(m => (
              <div key={m.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                <div className="text-xl font-semibold mb-1" style={{ color: m.color }}>{m.value}</div>
                <div className="text-xs text-white">{m.label}</div>
                <div className="text-[10px] text-white/35">{m.sub}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-5">
            {(["overview", "calls", "forecast"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`rounded-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] transition-all ${tab === t ? "bg-[#d4a054] text-black" : "bg-white/[0.04] text-white/40 hover:bg-white/[0.07]"}`}>
                {t === "overview" ? "Cash Position" : t === "calls" ? "Capital Calls" : "AI Forecast"}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="text-xs font-semibold text-white/50 mb-4">Cash Position & Deployment ($M)</div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={CASH_FLOW}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                      <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "#0c1018", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} />
                      <Area type="monotone" dataKey="cash" name="Cash Position ($M)" stroke="#6aaa72" fill="#6aaa72" fillOpacity={0.1} strokeWidth={2} />
                      <Area type="monotone" dataKey="deployed" name="Monthly Deployed ($M)" stroke="#d4a054" fill="#d4a054" fillOpacity={0.05} strokeWidth={1.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-white/50 mb-3">Recent Distributions</div>
                {DISTRIBUTIONS.map(d => (
                  <div key={d.id} className="flex items-center gap-4 rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-[#6aaa72]" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{d.amount}</div>
                      <div className="text-[10px] text-white/40">{d.type}</div>
                    </div>
                    <div className="text-[10px] text-white/30">{d.date}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "calls" && (
            <div className="space-y-3">
              {CAPITAL_CALLS.map(cc => (
                <div key={cc.id} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-base font-semibold text-white">Capital Call #{cc.callNo} — {cc.amount}</div>
                      <div className="text-xs text-white/40">{cc.purpose}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/40">{cc.date}</span>
                      <span className="rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase"
                        style={{ color: STATUS_COLORS[cc.status] ?? "#fff", borderColor: `${STATUS_COLORS[cc.status]}30`, background: `${STATUS_COLORS[cc.status]}12` }}>
                        {cc.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                  {cc.status !== "fully_funded" && (
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] text-white/40 mb-1">
                        <span>Funded: ${(cc.funded / 1_000_000).toFixed(1)}M</span>
                        <span>Target: {cc.amount}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06]">
                        <div className="h-1.5 rounded-full bg-[#d4a054]" style={{ width: `${(cc.funded / cc.total) * 100}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div className="rounded-xl border border-[#d4a054]/20 bg-[#d4a054]/[0.04] p-4 flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-[#d4a054] flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-white">AI Optimization Recommendation</div>
                  <div className="text-xs text-white/60 mt-1">Based on deployment pace and LP feedback patterns, AI recommends scheduling Capital Call #3 for Jun 15, 2026 — allowing 30 days for LP processing while aligning with Q2 close targets for NovaStar AI and PortLogix follow-ons.</div>
                </div>
              </div>
            </div>
          )}

          {tab === "forecast" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="text-xs font-semibold text-white/50 mb-4">AI Cash Flow Forecast — Next 6 Months ($K)</div>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={FORECAST}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                      <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: "#0c1018", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }} />
                      <Bar dataKey="inflow" name="Inflows ($K)" fill="#6aaa72" fillOpacity={0.8} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="outflow" name="Outflows ($K)" fill="#c45a4a" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Forecast Accuracy (hist.)", value: "94.2%", sub: "Last 8 periods" },
                  { label: "Projected 6-mo Outflows", value: "$8.8M", sub: "Deployment + fees" },
                  { label: "Est. Runway at Current Pace", value: "28 months", sub: "Conservative forecast" },
                ].map(f => (
                  <div key={f.label} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4">
                    <div className="text-lg font-semibold text-white">{f.value}</div>
                    <div className="text-xs text-white/50">{f.label}</div>
                    <div className="text-[10px] text-white/30">{f.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </m.div>
      </main>
      <SiteFooter />
    </div>
  );
}
