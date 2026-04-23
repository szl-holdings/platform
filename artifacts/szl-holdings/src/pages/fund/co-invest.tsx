import { useState } from "react";
import { m } from "framer-motion";
import { Link } from "wouter";
import { GitMerge, ArrowLeft, ChevronRight, Building2, FileText, CheckCircle2, Zap } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const SPVS = [
  {
    id: "spv-novastar", name: "SZL-NovaStar SPV I", company: "NovaStar AI", formed: "Mar 2026", status: "closing",
    totalCapital: "$3.2M", szlContrib: "$500K", coInvestors: ["Meridian Capital", "Astor Family Office", "3 Angels"],
    coInvestorCount: 5, minTicket: "$100K", waterfall: "1.0× pref, 20% carry above pref",
    stage: "Series A co-invest", ndaStatus: "All signed", closingDate: "May 10, 2026",
    documents: [{ name: "SPV PPM Draft", status: "review" }, { name: "Subscription Agreements", status: "collecting" }, { name: "Operating Agreement", status: "finalized" }],
  },
  {
    id: "spv-portlogix", name: "SZL-PortLogix SPV I", company: "PortLogix", formed: "Feb 2026", status: "active",
    totalCapital: "$4.8M", szlContrib: "$600K", coInvestors: ["Blackrock Endowment", "Greenway Ventures", "Meridian Capital"],
    coInvestorCount: 3, minTicket: "$500K", waterfall: "1.5× pref, 20% carry",
    stage: "Series A co-invest", ndaStatus: "All signed", closingDate: "Mar 1, 2026",
    documents: [{ name: "SPV Formation Docs", status: "finalized" }, { name: "Capital Call Notices", status: "sent" }, { name: "Tax K-1s (2025)", status: "finalized" }],
  },
  {
    id: "spv-vessels-bridge", name: "SZL-SEXTANT Bridge SPV", company: "SEXTANT", formed: "Jan 2026", status: "active",
    totalCapital: "$2.1M", szlContrib: "$350K", coInvestors: ["Seed angels", "Meridian Capital"],
    coInvestorCount: 4, minTicket: "$50K", waterfall: "No pref, 15% carry above 2× MOIC",
    stage: "Bridge round", ndaStatus: "All signed", closingDate: "Jan 20, 2026",
    documents: [{ name: "Bridge Note Agreements", status: "finalized" }, { name: "Conversion Side Letter", status: "finalized" }],
  },
  {
    id: "spv-regula", name: "SZL-RegulaAI SPV I", company: "RegulaAI", formed: "Dec 2025", status: "active",
    totalCapital: "$2.7M", szlContrib: "$400K", coInvestors: ["Astor Family Office", "3 strategic angels"],
    coInvestorCount: 4, minTicket: "$100K", waterfall: "1.0× pref, 20% carry",
    stage: "Seed+ co-invest", ndaStatus: "All signed", closingDate: "Dec 18, 2025",
    documents: [{ name: "SPV Operating Agreement", status: "finalized" }, { name: "Subscription Agreements", status: "finalized" }, { name: "Form D (SPV)", status: "filed" }],
  },
];

const CO_INVESTORS = [
  { name: "Meridian Capital Partners", type: "Family Office", spvs: 3, totalCapital: "$4.2M", status: "active" },
  { name: "Astor Family Office", type: "Family Office", spvs: 2, totalCapital: "$1.8M", status: "active" },
  { name: "Blackrock Endowment", type: "Endowment", spvs: 1, totalCapital: "$1.5M", status: "active" },
  { name: "Greenway Ventures", type: "Institutional", spvs: 1, totalCapital: "$1.2M", status: "active" },
  { name: "Angel Syndicate A", type: "Angels", spvs: 2, totalCapital: "$0.8M", status: "active" },
];

const STATUS_STYLE: Record<string, string> = {
  active: "text-[#6aaa72] border-[#6aaa72]/20 bg-[#6aaa72]/10",
  closing: "text-[#d4a054] border-[#d4a054]/20 bg-[#d4a054]/10",
  proposed: "text-[#4a90b8] border-[#4a90b8]/20 bg-[#4a90b8]/10",
  wound_up: "text-white/30 border-white/10 bg-white/[0.03]",
};

const DOC_STATUS: Record<string, { color: string; label: string }> = {
  finalized: { color: "#6aaa72", label: "Finalized" },
  review: { color: "#d4a054", label: "In Review" },
  collecting: { color: "#4a90b8", label: "Collecting" },
  sent: { color: "#6aaa72", label: "Sent" },
  filed: { color: "#6aaa72", label: "Filed" },
};

export default function CoInvestPage() {
  const __pageMeta = usePageMeta({ title: "Co-Investment & SPV Management — SZL Fund Intelligence", description: "SPV entity tracking, co-investor coordination, and automated documentation." });
  const [selectedId, setSelectedId] = useState("spv-novastar");
  const [tab, setTab] = useState<"spvs" | "coinvestors">("spvs");

  const spv = SPVS.find(s => s.id === selectedId) ?? SPVS[0];
  const totalSpvCapital = SPVS.reduce((s, v) => s + parseFloat(v.totalCapital.replace(/[$M]/g, "")), 0);

  return (
    <>
      {__pageMeta}
      <div className="min-h-screen bg-[#080b10] text-white">
        <SiteNav />
        <main className="mx-auto max-w-7xl px-6 pt-28 pb-24">
          <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-6">
              <Link href="/fund"><button className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70"><ArrowLeft className="h-3.5 w-3.5" /> Fund Intelligence</button></Link>
              <ChevronRight className="h-3 w-3 text-white/20" />
              <span className="text-[11px] text-white/60">Co-Investment & SPVs</span>
            </div>
  
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8b7ac8]/15">
                <GitMerge className="h-4.5 w-4.5 text-[#8b7ac8]" style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">Co-Investment & SPV Management</h1>
                <p className="text-xs text-white/40">SPV entity tracking · co-investor coordination · automated documentation · separate waterfalls</p>
              </div>
            </div>
  
            <div className="grid grid-cols-4 gap-3 mb-8">
              {[
                { label: "Active SPVs", value: `${SPVS.length}`, color: "#8b7ac8" },
                { label: "Total SPV Capital", value: `$${totalSpvCapital.toFixed(1)}M`, color: "#d4a054" },
                { label: "Co-Investors", value: "11", color: "#4a90b8" },
                { label: "Closing This Month", value: "1", color: "#c45a4a" },
              ].map(m => (
                <div key={m.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                  <div className="text-2xl font-semibold mb-1" style={{ color: m.color }}>{m.value}</div>
                  <div className="text-xs text-white/40">{m.label}</div>
                </div>
              ))}
            </div>
  
            <div className="flex gap-2 mb-5">
              {(["spvs", "coinvestors"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`rounded-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] transition-all ${tab === t ? "bg-[#8b7ac8] text-white" : "bg-white/[0.04] text-white/40 hover:bg-white/[0.07]"}`}>
                  {t === "spvs" ? "SPV Entities" : "Co-Investors"}
                </button>
              ))}
            </div>
  
            {tab === "spvs" && (
              <div className="grid grid-cols-12 gap-5">
                <div className="col-span-4 space-y-2">
                  {SPVS.map(s => (
                    <button key={s.id} onClick={() => setSelectedId(s.id)}
                      className={`w-full text-left rounded-xl border p-4 transition-all ${selectedId === s.id ? "border-[#8b7ac8]/40 bg-[#8b7ac8]/[0.05]" : "border-white/[0.07] bg-white/[0.025] hover:border-white/[0.12]"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-white truncate pr-2">{s.name}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase flex-shrink-0 ${STATUS_STYLE[s.status]}`}>{s.status}</span>
                      </div>
                      <div className="text-[10px] text-white/40 mb-1">{s.company} · {s.stage}</div>
                      <div className="text-[10px] text-white/30">{s.totalCapital} · {s.coInvestorCount} co-investors</div>
                    </button>
                  ))}
                  <button className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/[0.1] px-4 py-3 text-xs text-white/30 hover:text-white/50 hover:border-white/[0.2] transition-all">
                    <Zap className="h-3.5 w-3.5" /> Generate New SPV Docs
                  </button>
                </div>
  
                <div className="col-span-8 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h2 className="text-base font-semibold text-white">{spv.name}</h2>
                      <div className="text-xs text-white/40">{spv.stage} · Formed {spv.formed} · Closed {spv.closingDate}</div>
                    </div>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase ${STATUS_STYLE[spv.status]}`}>{spv.status}</span>
                  </div>
  
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                      { label: "Total SPV Capital", value: spv.totalCapital },
                      { label: "SZL Contribution", value: spv.szlContrib },
                      { label: "Min Ticket", value: spv.minTicket },
                    ].map(f => (
                      <div key={f.label} className="rounded-xl bg-white/[0.03] p-3">
                        <div className="text-sm font-semibold text-white">{f.value}</div>
                        <div className="text-[10px] text-white/40 mt-0.5">{f.label}</div>
                      </div>
                    ))}
                  </div>
  
                  <div className="mb-5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30 mb-2">Co-Investors</div>
                    <div className="flex gap-2 flex-wrap">
                      {spv.coInvestors.map(ci => (
                        <span key={ci} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-white/60">{ci}</span>
                      ))}
                    </div>
                  </div>
  
                  <div className="mb-5">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30 mb-2">Waterfall Structure</div>
                    <div className="rounded-xl border border-[#8b7ac8]/20 bg-[#8b7ac8]/[0.05] px-4 py-2.5 text-xs text-white/70">{spv.waterfall}</div>
                  </div>
  
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30 mb-2">Documents</div>
                    <div className="space-y-2">
                      {spv.documents.map((doc, i) => {
                        const s = DOC_STATUS[doc.status] ?? { color: "#fff", label: doc.status };
                        return (
                          <div key={i} className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-2.5">
                            <FileText className="h-4 w-4 text-white/30 flex-shrink-0" />
                            <span className="flex-1 text-sm text-white/70">{doc.name}</span>
                            <span className="text-[10px] font-semibold" style={{ color: s.color }}>{s.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
  
                  <div className="mt-4 flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 text-xs ${spv.ndaStatus === "All signed" ? "text-[#6aaa72]" : "text-[#d4a054]"}`}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> NDA Status: {spv.ndaStatus}
                    </div>
                  </div>
                </div>
              </div>
            )}
  
            {tab === "coinvestors" && (
              <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.025]">
                      {["Co-Investor", "Type", "SPVs", "Total Capital", "Status"].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CO_INVESTORS.map(ci => (
                      <tr key={ci.name} className="border-b border-white/[0.04] hover:bg-white/[0.01]">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#8b7ac8]/15">
                              <Building2 className="h-3.5 w-3.5 text-[#8b7ac8]" />
                            </div>
                            <span className="text-sm text-white">{ci.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-white/50">{ci.type}</td>
                        <td className="px-5 py-3 text-sm text-white">{ci.spvs}</td>
                        <td className="px-5 py-3 text-sm font-semibold text-white">{ci.totalCapital}</td>
                        <td className="px-5 py-3">
                          <span className="rounded-full border px-2.5 py-0.5 text-[9px] font-semibold uppercase text-[#6aaa72] border-[#6aaa72]/20 bg-[#6aaa72]/10">{ci.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </m.div>
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
