import { useState } from "react";
import { DollarSign, TrendingDown, AlertTriangle, CheckCircle, BarChart3, Users, FileText, Clock, ArrowUpRight, ArrowDownRight, Star, Building2, XCircle } from "lucide-react";

const PRISM_GOLD = "#c8a96e";
const PRISM_BLUE = "#4a8ab0";
const PRISM_RED = "#b85a4a";

interface Invoice {
  id: string;
  firm: string;
  matter: string;
  amount: number;
  billed: number;
  adjusted: number;
  savings: number;
  violations: { code: string; description: string; amount: number; severity: "critical" | "warning" | "info" }[];
  status: "pending" | "approved" | "disputed" | "paid";
  date: string;
}

interface OutsideCounsel {
  firm: string;
  totalSpend: number;
  matters: number;
  avgRate: number;
  marketRate: number;
  complianceScore: number;
  realization: number;
  winRate: number;
}

const INVOICES: Invoice[] = [
  { id: "INV-2024-0412", firm: "Morrison & Associates", matter: "Martinez v. Pinnacle", amount: 48_750, billed: 52_100, adjusted: 48_750, savings: 3_350, date: "2024-03-10", status: "pending",
    violations: [
      { code: "UTBMS-L220", description: "Block billing detected — 4.5hr entry lacks task-level detail", amount: 1_800, severity: "critical" },
      { code: "BG-003", description: "Excessive research time (12hr) for routine motion", amount: 1_200, severity: "warning" },
      { code: "BG-007", description: "Senior partner billing for document review", amount: 350, severity: "info" },
    ] },
  { id: "INV-2024-0398", firm: "Blackwell & Rodriguez", matter: "Chen v. Harbor Point", amount: 34_200, billed: 34_200, adjusted: 34_200, savings: 0, date: "2024-03-05", status: "approved", violations: [] },
  { id: "INV-2024-0385", firm: "Morrison & Associates", matter: "Okonkwo v. Metro Transit", amount: 67_800, billed: 74_200, adjusted: 67_800, savings: 6_400, date: "2024-02-28", status: "paid",
    violations: [
      { code: "UTBMS-L320", description: "Duplicate billing: same deposition prep billed on two matters", amount: 4_200, severity: "critical" },
      { code: "BG-012", description: "Travel time billed at full rate (guidelines: 50%)", amount: 2_200, severity: "warning" },
    ] },
  { id: "INV-2024-0371", firm: "Park Legal Group", matter: "Williams v. Eastside Dev", amount: 22_400, billed: 23_100, adjusted: 22_400, savings: 700, date: "2024-02-22", status: "approved",
    violations: [
      { code: "BG-005", description: "Meals above $50/person limit", amount: 700, severity: "info" },
    ] },
];

const COUNSEL: OutsideCounsel[] = [
  { firm: "Morrison & Associates", totalSpend: 842_000, matters: 12, avgRate: 485, marketRate: 450, complianceScore: 78, realization: 92, winRate: 64 },
  { firm: "Blackwell & Rodriguez", totalSpend: 624_000, matters: 8, avgRate: 520, marketRate: 510, complianceScore: 96, realization: 100, winRate: 71 },
  { firm: "Park Legal Group", totalSpend: 318_000, matters: 6, avgRate: 380, marketRate: 395, complianceScore: 94, realization: 97, winRate: 58 },
  { firm: "Whitfield Stern LLP", totalSpend: 256_000, matters: 4, avgRate: 550, marketRate: 525, complianceScore: 88, realization: 95, winRate: 82 },
];

const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n}`;

export default function LegalSpendPage() {
  const [tab, setTab] = useState<"invoices" | "counsel">("invoices");
  const [expandedInv, setExpandedInv] = useState<string | null>(INVOICES[0].id);

  const totalSpend = INVOICES.reduce((s, i) => s + i.amount, 0);
  const totalSavings = INVOICES.reduce((s, i) => s + i.savings, 0);
  const totalViolations = INVOICES.reduce((s, i) => s + i.violations.length, 0);
  const criticalViolations = INVOICES.reduce((s, i) => s + i.violations.filter(v => v.severity === "critical").length, 0);

  return (
    <div className="min-h-screen" style={{ background: "#080c14" }}>
      <div className="max-w-7xl mx-auto px-6 py-8 lg:px-8">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-white tracking-tight">Legal Spend Intelligence</h1>
          <p className="text-[11px] text-white/30 mt-1">AI-powered invoice review, billing guideline compliance, rate benchmarking, and outside counsel scorecards</p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Period Spend", value: fmt(totalSpend), icon: DollarSign, color: PRISM_GOLD },
            { label: "AI Savings", value: fmt(totalSavings), icon: TrendingDown, color: "#22c55e" },
            { label: "Billing Violations", value: totalViolations.toString(), icon: AlertTriangle, color: "#f59e0b" },
            { label: "Critical Issues", value: criticalViolations.toString(), icon: XCircle, color: "#ef4444" },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <s.icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                <span className="text-[9px] uppercase tracking-wider text-white/25">{s.label}</span>
              </div>
              <p className="text-2xl font-semibold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          {(["invoices", "counsel"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              aria-label={`Show ${t === "invoices" ? "Invoice Review" : "Outside Counsel Scorecards"} tab`}
              className={`text-[10px] font-semibold uppercase tracking-wider rounded-lg px-4 py-2 transition ${tab === t ? "text-white" : "text-white/25 hover:text-white/40"}`}
              style={tab === t ? { background: PRISM_GOLD + "15", color: PRISM_GOLD } : {}}>
              {t === "invoices" ? "Invoice Review" : "Outside Counsel Scorecards"}
            </button>
          ))}
        </div>

        {tab === "invoices" ? (
          <div className="space-y-3">
            {INVOICES.map(inv => (
              <div key={inv.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                <button onClick={() => setExpandedInv(expandedInv === inv.id ? null : inv.id)}
                  aria-label={`Toggle invoice ${inv.id} details`} className="w-full text-left p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-mono text-white/20">{inv.id}</span>
                      <span className={`text-[8px] uppercase font-bold tracking-wider rounded px-1.5 py-0.5 ${
                        inv.status === "pending" ? "bg-amber-500/10 text-amber-400" :
                        inv.status === "approved" ? "bg-green-500/10 text-green-400" :
                        inv.status === "paid" ? "bg-blue-500/10 text-blue-400" : "bg-red-500/10 text-red-400"
                      }`}>{inv.status}</span>
                    </div>
                    <p className="text-sm font-medium text-white">{inv.firm}</p>
                    <p className="text-[10px] text-white/30">{inv.matter} · {inv.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{fmt(inv.amount)}</p>
                    {inv.savings > 0 && <p className="text-[9px]" style={{ color: "#22c55e" }}>−{fmt(inv.savings)} saved</p>}
                  </div>
                  {inv.violations.length > 0 && (
                    <span className="flex items-center gap-1 text-[9px] font-semibold" style={{ color: "#f59e0b" }}>
                      <AlertTriangle className="h-3 w-3" /> {inv.violations.length}
                    </span>
                  )}
                </button>
                {expandedInv === inv.id && inv.violations.length > 0 && (
                  <div className="border-t border-white/[0.04] px-4 pb-4 pt-3 space-y-2">
                    <h4 className="text-[9px] uppercase tracking-wider text-white/25 font-semibold">AI Flagged Violations</h4>
                    {inv.violations.map((v, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg bg-white/[0.015] border border-white/[0.04] p-3">
                        <div className="h-2 w-2 rounded-full mt-1 flex-shrink-0" style={{ background: v.severity === "critical" ? "#ef4444" : v.severity === "warning" ? "#f59e0b" : PRISM_BLUE }} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[9px] font-mono" style={{ color: PRISM_GOLD }}>{v.code}</span>
                            <span className="text-[8px] uppercase font-bold tracking-wider" style={{ color: v.severity === "critical" ? "#ef4444" : v.severity === "warning" ? "#f59e0b" : PRISM_BLUE }}>{v.severity}</span>
                          </div>
                          <p className="text-[10px] text-white/50">{v.description}</p>
                        </div>
                        <span className="text-[10px] font-semibold text-white">{fmt(v.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {COUNSEL.map(c => (
              <div key={c.firm} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{c.firm}</p>
                    <p className="text-[10px] text-white/30">{c.matters} active matters · Total spend: {fmt(c.totalSpend)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className="h-3 w-3" style={{ color: i < Math.round(c.complianceScore / 20) ? PRISM_GOLD : "rgba(255,255,255,0.1)" }} fill={i < Math.round(c.complianceScore / 20) ? PRISM_GOLD : "none"} />
                    ))}
                    <span className="text-[10px] font-semibold text-white/40 ml-1">{c.complianceScore}%</span>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { label: "Avg Rate", value: `$${c.avgRate}/hr`, sub: c.avgRate > c.marketRate ? `${c.avgRate - c.marketRate} above market` : `${c.marketRate - c.avgRate} below market`, color: c.avgRate > c.marketRate ? "#ef4444" : "#22c55e" },
                    { label: "Compliance", value: `${c.complianceScore}%`, sub: c.complianceScore >= 90 ? "Excellent" : c.complianceScore >= 80 ? "Good" : "Needs improvement", color: c.complianceScore >= 90 ? "#22c55e" : c.complianceScore >= 80 ? PRISM_GOLD : PRISM_RED },
                    { label: "Realization", value: `${c.realization}%`, sub: "Bill vs. paid ratio", color: c.realization >= 95 ? "#22c55e" : PRISM_GOLD },
                    { label: "Win Rate", value: `${c.winRate}%`, sub: "Favorable outcomes", color: c.winRate >= 70 ? "#22c55e" : c.winRate >= 60 ? PRISM_GOLD : PRISM_RED },
                    { label: "Total Spend", value: fmt(c.totalSpend), sub: `${c.matters} matters`, color: "white" },
                  ].map(m => (
                    <div key={m.label} className="rounded-lg bg-white/[0.015] border border-white/[0.04] p-2.5">
                      <p className="text-[8px] uppercase tracking-wider text-white/20 mb-1">{m.label}</p>
                      <p className="text-sm font-semibold" style={{ color: m.color }}>{m.value}</p>
                      <p className="text-[8px] text-white/20 mt-0.5">{m.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
