import { m } from "framer-motion";
import { Link } from "wouter";
import {
  Brain, FileText, Activity, Layers, TrendingUp, DollarSign,
  ShieldCheck, Users, BarChart3, GitMerge, ArrowRight, Cpu,
  Zap, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const MODULES = [
  {
    icon: Brain,
    color: "#d4a054",
    title: "AI Deal Flow Scoring",
    subtitle: "Autonomous deal screening & conviction memos",
    href: "/fund/deal-scoring",
    stats: [{ label: "Deals Scored", value: "47" }, { label: "Avg Score", value: "73.2" }, { label: "In Pipeline", value: "12" }],
    badge: "AI-Powered",
  },
  {
    icon: FileText,
    color: "#4a90b8",
    title: "LP Report Generation",
    subtitle: "Autonomous ILPA-compliant quarterly reports",
    href: "/fund/lp-reports",
    stats: [{ label: "Reports Ready", value: "4" }, { label: "LPs Covered", value: "23" }, { label: "Net IRR", value: "28.4%" }],
    badge: "Autonomous",
  },
  {
    icon: Activity,
    color: "#6aaa72",
    title: "Portfolio Intelligence",
    subtitle: "Real-time health monitoring & early warnings",
    href: "/fund/portfolio-intelligence",
    stats: [{ label: "Companies", value: "6" }, { label: "Alerts", value: "2" }, { label: "Avg Health", value: "84/100" }],
    badge: "Live Monitor",
  },
  {
    icon: Layers,
    color: "#8b7ac8",
    title: "Cap Table & Waterfall",
    subtitle: "Full cap table with exit scenario modeling",
    href: "/fund/cap-table",
    stats: [{ label: "Share Classes", value: "5" }, { label: "Holders", value: "38" }, { label: "FDSO", value: "12.4M" }],
    badge: "Scenario Engine",
  },
  {
    icon: TrendingUp,
    color: "#c45a4a",
    title: "Exit Modeling",
    subtitle: "Monte Carlo simulation across the portfolio",
    href: "/fund/exit-modeling",
    stats: [{ label: "Scenarios", value: "10K+" }, { label: "Avg MOIC", value: "3.8×" }, { label: "Base Case", value: "$284M" }],
    badge: "Monte Carlo",
  },
  {
    icon: DollarSign,
    color: "#d4a054",
    title: "Treasury & Cash Mgmt",
    subtitle: "Capital call optimization & cash forecasting",
    href: "/fund/treasury",
    stats: [{ label: "Dry Powder", value: "$18.2M" }, { label: "Next Call", value: "Jun 15" }, { label: "Runway", value: "28mo" }],
    badge: "Forecast Engine",
  },
  {
    icon: ShieldCheck,
    color: "#4a90b8",
    title: "SEC & Compliance",
    subtitle: "Automated Form D, PF, ADV preparation",
    href: "/fund/compliance",
    stats: [{ label: "Filings Due", value: "3" }, { label: "Compliant", value: "94%" }, { label: "Next Deadline", value: "May 1" }],
    badge: "Regulatory AI",
  },
  {
    icon: Users,
    color: "#6aaa72",
    title: "LP Communication",
    subtitle: "Investor CRM with sentiment & re-up scoring",
    href: "/fund/lp-crm",
    stats: [{ label: "LPs Tracked", value: "23" }, { label: "Avg Sentiment", value: "8.4/10" }, { label: "Re-Up Prob", value: "78%" }],
    badge: "AI Sentiment",
  },
  {
    icon: BarChart3,
    color: "#c8953c",
    title: "Fund Benchmarking",
    subtitle: "Cambridge Associates & peer cohort comparison",
    href: "/fund/benchmarking",
    stats: [{ label: "vs. Median", value: "+14.2pp" }, { label: "Quartile", value: "Top 20%" }, { label: "PME", value: "1.34×" }],
    badge: "Peer Analytics",
  },
  {
    icon: GitMerge,
    color: "#8b7ac8",
    title: "Co-Investment & SPVs",
    subtitle: "Entity tracking, coordination & docs",
    href: "/fund/co-invest",
    stats: [{ label: "Active SPVs", value: "4" }, { label: "Co-Investors", value: "11" }, { label: "SPV Capital", value: "$12.8M" }],
    badge: "SPV Engine",
  },
];

const FUND_METRICS = [
  { label: "Total AUM", value: "$84.2M", trend: "+12.4%" },
  { label: "Net IRR", value: "28.4%", trend: "+3.1pp" },
  { label: "TVPI", value: "2.1×", trend: "+0.3×" },
  { label: "DPI", value: "0.62×", trend: "+0.18×" },
  { label: "Dry Powder", value: "$18.2M", trend: "-$4.1M" },
  { label: "Portfolio cos.", value: "6", trend: "stable" },
];

export default function FundIntelligenceHub() {
  usePageMeta({
    title: "Fund Intelligence Command — SZL Holdings",
    description: "Agentic fund operations platform. AI deal scoring, autonomous LP reports, portfolio intelligence, and regulatory compliance.",
    canonical: "https://szlholdings.com/fund",
  });

  return (
    <div className="min-h-screen bg-[#080b10] text-white">
      <SiteNav />

      <main className="mx-auto max-w-7xl px-6 pt-28 pb-24">
        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d4a054]/15">
              <Cpu className="h-3.5 w-3.5 text-[#d4a054]" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d4a054]">Agentic Operations</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white mb-3">Fund Intelligence Command</h1>
          <p className="text-white/50 text-base max-w-2xl mb-10">
            The industry's first agentic fund operations platform. AI agents autonomously score deals, generate LP reports,
            monitor portfolio health, and run regulatory compliance — so a lean team operates like a 50-person shop.
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-12 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            {FUND_METRICS.map((m) => (
              <div key={m.label} className="text-center">
                <div className="text-xl font-semibold text-white">{m.value}</div>
                <div className="text-[10px] text-white/40 mt-0.5">{m.label}</div>
                <div className={`text-[10px] mt-0.5 font-medium ${m.trend.startsWith("+") ? "text-[#6aaa72]" : m.trend === "stable" ? "text-white/30" : "text-white/40"}`}>{m.trend}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mb-5">
            <Zap className="h-4 w-4 text-[#d4a054]" />
            <span className="text-sm font-semibold text-white">Active Agent Modules</span>
            <span className="ml-auto text-[10px] text-white/30">{MODULES.length} modules operational</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULES.map((mod, i) => (
              <m.div
                key={mod.href}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={mod.href}>
                  <div className="group cursor-pointer rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 hover:border-white/[0.14] hover:bg-white/[0.04] transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-black/20" style={{ color: mod.color }}>
                        <mod.icon className="h-5 w-5" />
                      </div>
                      <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] border"
                        style={{ color: mod.color, borderColor: `${mod.color}30`, background: `${mod.color}12` }}>
                        {mod.badge}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1">{mod.title}</h3>
                    <p className="text-xs text-white/40 mb-4">{mod.subtitle}</p>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {mod.stats.map((s) => (
                        <div key={s.label} className="rounded-lg bg-white/[0.03] px-2 py-1.5 text-center">
                          <div className="text-sm font-semibold text-white">{s.value}</div>
                          <div className="text-[9px] text-white/35 leading-tight">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold transition-colors group-hover:text-white/80 text-white/40">
                      Open Module <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </Link>
              </m.div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-[#6aaa72]/20 bg-[#6aaa72]/[0.04] p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-[#6aaa72]" />
                <span className="text-sm font-semibold text-white">Recent Agent Activity</span>
              </div>
              {[
                "LP Q1 2026 report generated for 23 LPs — ready for review",
                "Deal scored: NovaStar AI — 81/100 conviction score assigned",
                "Early warning: Carlota Jo burn rate accelerated +28% MoM",
                "Form D filing prepared for Fund II — awaiting signature",
                "Treasury forecast updated — next capital call optimized to Jun 15",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 bg-[#6aaa72]" />
                  <span className="text-xs text-white/60">{item}</span>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-[#c45a4a]/20 bg-[#c45a4a]/[0.04] p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-[#c45a4a]" />
                <span className="text-sm font-semibold text-white">Action Required</span>
              </div>
              {[
                { item: "Form PF Q1 filing due May 1 — 16 days remaining", urgency: "high" },
                { item: "Carlota Jo runway compressed to 9 months — intervention rec. pending", urgency: "high" },
                { item: "LP re-up conversations needed: Meridian Capital, Astor Family Office", urgency: "medium" },
                { item: "3 co-investor NDAs expiring in 30 days", urgency: "medium" },
                { item: "Vessels Q1 financial data overdue from portfolio company", urgency: "low" },
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
                  <div className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${a.urgency === "high" ? "bg-[#c45a4a]" : a.urgency === "medium" ? "bg-[#d4a054]" : "bg-white/30"}`} />
                  <span className="text-xs text-white/60">{a.item}</span>
                </div>
              ))}
            </div>
          </div>
        </m.div>
      </main>

      <SiteFooter />
    </div>
  );
}
