import { useState, useMemo } from "react";
import { m } from "framer-motion";
import { Link } from "wouter";
import { Layers, ArrowLeft, ChevronRight } from "lucide-react";
import { PieChart as RePie, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const SHARE_CLASSES = [
  { id: "cs", name: "Common Stock", type: "common", issued: 5200000, pref: null, multiple: null, participating: false, seniority: 4 },
  { id: "series-a", name: "Series A Preferred", type: "preferred", issued: 2100000, pref: 1.0, multiple: 1.0, participating: true, seniority: 3 },
  { id: "series-b", name: "Series B Preferred", type: "preferred", issued: 1800000, pref: 1.0, multiple: 1.5, participating: true, seniority: 2 },
  { id: "options", name: "Option Pool (ESOP)", type: "option", issued: 1800000, pref: null, multiple: null, participating: false, seniority: 5 },
  { id: "warrants", name: "Investor Warrants", type: "warrant", issued: 500000, pref: null, multiple: null, participating: false, seniority: 6 },
];

type ShareClassId = "cs" | "series-a" | "series-b" | "options" | "warrants";

const HOLDERS: Array<{ id: string; name: string; type: string; shares: Partial<Record<ShareClassId, number>> }> = [
  { id: "szl", name: "SZL Holdings Fund I", type: "institutional", shares: { "series-a": 1200000, "series-b": 1800000 } },
  { id: "founder-1", name: "Stephen Lutar (Founder)", type: "founder", shares: { "cs": 2400000 } },
  { id: "co-founder", name: "Maria Vasquez (Co-Founder)", type: "founder", shares: { "cs": 1600000 } },
  { id: "seed-vc", name: "Acme Ventures (Seed)", type: "institutional", shares: { "series-a": 900000 } },
  { id: "angels", name: "Angel Syndicate", type: "individual", shares: { "cs": 800000 } },
  { id: "mgmt", name: "Management Team (Options)", type: "employee", shares: { "options": 1400000 } },
  { id: "reserve", name: "Option Reserve", type: "employee", shares: { "options": 400000 } },
  { id: "warrants-holder", name: "Bridge Noteholders", type: "institutional", shares: { "warrants": 500000 } },
  { id: "advisor", name: "Advisor Pool", type: "advisor", shares: { "cs": 400000 } },
];

const CLASS_COLORS: Record<string, string> = {
  "cs": "#4a90b8",
  "series-a": "#d4a054",
  "series-b": "#8b7ac8",
  "options": "#6aaa72",
  "warrants": "#c45a4a",
};

export default function CapTablePage() {
  usePageMeta({ title: "Cap Table & Waterfall — SZL Fund Intelligence", description: "Full cap table management with waterfall and round modeling." });
  const [exitVal, setExitVal] = useState(50_000_000);
  const [roundSize, setRoundSize] = useState(5_000_000);
  const [preMoney, setPreMoney] = useState(40_000_000);
  const [activeTab, setActiveTab] = useState<"captable" | "waterfall" | "modeling">("captable");

  const fdso = SHARE_CLASSES.reduce((s, c) => s + c.issued, 0);

  const holdersWithCalc = useMemo(() => HOLDERS.map(h => {
    const total = Object.values(h.shares).reduce((s, v) => s + v, 0);
    return { ...h, total, pct: (total / fdso) * 100 };
  }), []);

  const pieData = SHARE_CLASSES.map(c => ({ name: c.name, value: c.issued, color: CLASS_COLORS[c.id] }));

  const postMoney = preMoney + roundSize;
  const newPct = (roundSize / postMoney) * 100;

  const waterfall = useMemo(() => {
    let remaining = exitVal;
    const result: Array<{ name: string; proceeds: number; reason: string }> = [];
    const prefByClass = [
      { classId: "series-b", name: "Series B Liquidation Pref", holders: HOLDERS.filter(h => h.shares["series-b"]) },
      { classId: "series-a", name: "Series A Liquidation Pref", holders: HOLDERS.filter(h => h.shares["series-a"]) },
    ];
    for (const p of prefByClass) {
      const cls = SHARE_CLASSES.find(c => c.id === p.classId)!;
      const shares = p.holders.reduce((s, h) => s + (h.shares[cls.id as ShareClassId] ?? 0), 0);
      const prefAmount = Math.min(remaining, shares * (cls.multiple ?? 1));
      remaining -= prefAmount;
      for (const h of p.holders) {
        const hShares = h.shares[cls.id as ShareClassId] ?? 0;
        const hPct = shares > 0 ? hShares / shares : 0;
        result.push({ name: h.name, proceeds: Math.round(prefAmount * hPct), reason: p.name });
      }
    }
    const commonHolders = holdersWithCalc.filter(h => h.total > 0);
    for (const h of commonHolders) {
      result.push({ name: h.name, proceeds: Math.round(remaining * h.pct / 100), reason: "Pro-rata common" });
    }
    return result.filter(r => r.proceeds > 0).sort((a, b) => b.proceeds - a.proceeds);
  }, [exitVal, holdersWithCalc]);

  const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : `$${(n / 1_000).toFixed(0)}K`;

  return (
    <div className="min-h-screen bg-[#080b10] text-white">
      <SiteNav />
      <main className="mx-auto max-w-7xl px-6 pt-28 pb-24">
        <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-6">
            <Link href="/fund"><button className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70"><ArrowLeft className="h-3.5 w-3.5" /> Fund Intelligence</button></Link>
            <ChevronRight className="h-3 w-3 text-white/20" />
            <span className="text-[11px] text-white/60">Cap Table & Waterfall</span>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8b7ac8]/15">
              <Layers className="h-4.5 w-4.5 text-[#8b7ac8]" style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Cap Table & Waterfall Engine</h1>
              <p className="text-xs text-white/40">Full dilution · waterfall distributions · round simulation</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "Fully Diluted Shares", value: fdso.toLocaleString(), color: "#8b7ac8" },
              { label: "Share Classes", value: "5", color: "#d4a054" },
              { label: "Total Holders", value: "9", color: "#4a90b8" },
              { label: "Option Pool %", value: "14.5%", color: "#6aaa72" },
            ].map(m => (
              <div key={m.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                <div className="text-xl font-semibold mb-1" style={{ color: m.color }}>{m.value}</div>
                <div className="text-xs text-white/40">{m.label}</div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-5">
            {(["captable", "waterfall", "modeling"] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`rounded-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] transition-all ${activeTab === t ? "bg-[#8b7ac8] text-white" : "bg-white/[0.04] text-white/40 hover:bg-white/[0.07]"}`}>
                {t === "captable" ? "Cap Table" : t === "waterfall" ? "Waterfall" : "Round Modeling"}
              </button>
            ))}
          </div>

          {activeTab === "captable" && (
            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-5">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePie>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#0c1018", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }}
                        formatter={(v: number) => [v.toLocaleString() + " shares", ""]} />
                      <Legend iconType="circle" formatter={(v) => <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{v}</span>} />
                    </RePie>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="col-span-7 overflow-x-auto rounded-2xl border border-white/[0.06]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                      {["Holder", "Type", "Shares", "Ownership %"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {holdersWithCalc.sort((a, b) => b.pct - a.pct).map(h => (
                      <tr key={h.id} className="border-b border-white/[0.04] hover:bg-white/[0.01]">
                        <td className="px-4 py-2.5 text-sm text-white">{h.name}</td>
                        <td className="px-4 py-2.5 text-xs text-white/40 capitalize">{h.type}</td>
                        <td className="px-4 py-2.5 text-sm text-white/70">{h.total.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-sm font-semibold text-white">{h.pct.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "waterfall" && (
            <div>
              <div className="flex gap-2 mb-4 items-center">
                <span className="text-xs text-white/40">Exit Valuation:</span>
                {[10_000_000, 25_000_000, 50_000_000, 100_000_000, 250_000_000].map(v => (
                  <button key={v} onClick={() => setExitVal(v)}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold transition ${exitVal === v ? "bg-[#8b7ac8] text-white" : "bg-white/[0.04] text-white/50 hover:bg-white/[0.07]"}`}>
                    {fmt(v)}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {waterfall.map((w, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{w.name}</div>
                      <div className="text-[10px] text-white/40">{w.reason}</div>
                    </div>
                    <div className="text-sm font-semibold text-white">{fmt(w.proceeds)}</div>
                    <div className="w-32">
                      <div className="h-1.5 rounded-full bg-white/[0.06]">
                        <div className="h-1.5 rounded-full bg-[#8b7ac8]" style={{ width: `${Math.min((w.proceeds / exitVal) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between px-4 py-3 mt-2 border-t border-white/[0.06]">
                  <span className="text-xs font-semibold text-white/60">Total Exit Value</span>
                  <span className="text-lg font-semibold text-[#8b7ac8]">{fmt(exitVal)}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "modeling" && (
            <div className="grid grid-cols-2 gap-5">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Pro-Forma Round Modeling</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40 mb-1.5">Round Size ($)</label>
                    <input type="number" value={roundSize} onChange={e => setRoundSize(Number(e.target.value))}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#8b7ac8]/40" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40 mb-1.5">Pre-Money Valuation ($)</label>
                    <input type="number" value={preMoney} onChange={e => setPreMoney(Number(e.target.value))}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#8b7ac8]/40" />
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Impact Summary</h3>
                <div className="space-y-3">
                  {[
                    { label: "Post-Money Valuation", value: fmt(postMoney) },
                    { label: "New Investor Ownership", value: `${newPct.toFixed(2)}%` },
                    { label: "Existing Shareholders Retain", value: `${(100 - newPct).toFixed(2)}%` },
                    { label: "Price per Share (est.)", value: `$${(preMoney / fdso).toFixed(2)}` },
                  ].map(f => (
                    <div key={f.label} className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                      <span className="text-xs text-white/50">{f.label}</span>
                      <span className="text-sm font-semibold text-white">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </m.div>
      </main>
      <SiteFooter />
    </div>
  );
}
