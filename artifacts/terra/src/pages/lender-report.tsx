import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Download, Building2, DollarSign, Users,
  ArrowLeft, Shield, Clock, CheckCircle, AlertTriangle,
  Tag, ChevronRight, Printer, Star, Loader2
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";
import { properties, revenueHistory, portfolioSummary } from "@/data/portfolio";
import { cn } from "@szl-holdings/shared-ui/utils";

function formatCurrency(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function ProvenanceTag({ source }: { source: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-mono"
      style={{ background: "rgba(200,160,96,0.04)", border: "1px solid rgba(200,160,96,0.1)", color: "rgba(200,160,96,0.5)" }}>
      <Tag className="w-2.5 h-2.5" />
      {source}
    </span>
  );
}

function FreshnessTag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-mono"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}>
      <Clock className="w-2.5 h-2.5" style={{ color: "#10b981" }} />
      {label}
    </span>
  );
}

const LP_INVESTORS = [
  { name: "Sovereign Capital Partners", commitment: 45000000, deployed: 38000000, distributions: 12400000, netIRR: 19.2, moic: 1.68, tier: "Anchor LP", status: "current" },
  { name: "Pacific Pension Trust", commitment: 30000000, deployed: 26000000, distributions: 7800000, netIRR: 17.4, moic: 1.52, tier: "Major LP", status: "current" },
  { name: "Meridian Family Office", commitment: 15000000, deployed: 15000000, distributions: 4200000, netIRR: 21.8, moic: 1.93, tier: "Major LP", status: "current" },
  { name: "Atlas Endowment Fund", commitment: 25000000, deployed: 19000000, distributions: 5100000, netIRR: 16.7, moic: 1.44, tier: "Standard LP", status: "current" },
  { name: "Pinnacle Investment Group", commitment: 10000000, deployed: 8000000, distributions: 2300000, netIRR: 18.9, moic: 1.61, tier: "Standard LP", status: "current" },
];

const LENDERS = [
  { name: "Wells Fargo Real Estate Capital", property: "Meridian Tower", balance: 41200000, maturity: "2028-06-15", ltv: "57%", dscr: "1.38x", status: "current" },
  { name: "JPMorgan Chase Real Estate", property: "Pacific Heights Plaza", balance: 63800000, maturity: "2027-03-20", ltv: "59%", dscr: "1.22x", status: "current" },
  { name: "Signature Bank RE", property: "Skyline Lofts", balance: 16800000, maturity: "2026-09-14", ltv: "78%", dscr: "0.94x", status: "watch" },
  { name: "Berkadia Multifamily", property: "Harborview Residences", balance: 49200000, maturity: "2029-04-22", ltv: "58%", dscr: "1.51x", status: "current" },
  { name: "CBRE Capital Markets", property: "Beacon Industrial Park", balance: 22500000, maturity: "2027-09-05", ltv: "55%", dscr: "1.74x", status: "current" },
];

const DISTRIBUTIONS = [
  { date: "Mar 15, 2026", amount: 3200000, type: "Operating", perUnit: "$0.58", period: "Q1 2026" },
  { date: "Dec 15, 2025", amount: 4100000, type: "Operating + Disposition", perUnit: "$0.74", period: "Q4 2025" },
  { date: "Sep 15, 2025", amount: 2900000, type: "Operating", perUnit: "$0.52", period: "Q3 2025" },
  { date: "Jun 15, 2025", amount: 3000000, type: "Operating", perUnit: "$0.54", period: "Q2 2025" },
  { date: "Mar 15, 2025", amount: 2750000, type: "Operating", perUnit: "$0.49", period: "Q1 2025" },
];

const COVENANT_STATUS = [
  { name: "DSCR Minimum (1.20x)", status: "watch", detail: "Skyline Lofts at 0.94x — below threshold", property: "prop-007" },
  { name: "LTV Maximum (75%)", status: "watch", detail: "Skyline Lofts at 78% LTV — above threshold", property: "prop-007" },
  { name: "Occupancy Floor (85%)", status: "breach", detail: "Skyline Lofts at 68.4% — material breach", property: "prop-007" },
  { name: "Debt Service Reserve (3 mo)", status: "current", detail: "All properties compliant" },
  { name: "Insurance Coverage Requirements", status: "current", detail: "All properties compliant — renewed Q1 2026" },
  { name: "Reporting Covenants (quarterly)", status: "current", detail: "Q4 2025 report delivered Jan 15, 2026" },
];

const PIE_COLORS = ["#40856a", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444"];

const capitalByType = [
  { name: "Multifamily", value: 178000000 },
  { name: "Office", value: 158300000 },
  { name: "Industrial", value: 40900000 },
  { name: "Retail", value: 21100000 },
  { name: "Mixed-Use", value: 56100000 },
];

type ReportTab = "executive" | "portfolio" | "debt" | "investors" | "covenants";

async function exportLenderReportPDF(reportPeriod: string): Promise<void> {
  const res = await fetch("/api/documents/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      template: "terra-lender-report",
      data: { reportPeriod },
    }),
  });
  if (!res.ok) throw new Error("PDF export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `terra-lender-report-${reportPeriod.replace(/\s+/g, "-").toLowerCase()}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function LenderReportPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("executive");
  const [reportPeriod] = useState("Q1 2026");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  const totalDebt = LENDERS.reduce((s, l) => s + l.balance, 0);
  const totalCommitment = LP_INVESTORS.reduce((s, i) => s + i.commitment, 0);
  const totalDistributed = LP_INVESTORS.reduce((s, i) => s + i.distributions, 0);

  const tabs: { id: ReportTab; label: string }[] = [
    { id: "executive", label: "Executive Summary" },
    { id: "portfolio", label: "Portfolio Performance" },
    { id: "debt", label: "Debt Schedule" },
    { id: "investors", label: "LP/Investor Report" },
    { id: "covenants", label: "Covenant Status" },
  ];

  return (
    <div className="space-y-4 overflow-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/dashboard">
          <span className="inline-flex items-center gap-1 text-sm mb-4 cursor-pointer transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </span>
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">Lender & Investor Reporting Pack</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded"
                style={{ background: "rgba(64,133,106,0.1)", color: "#40856a", border: "1px solid rgba(64,133,106,0.2)" }}>
                {reportPeriod}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <ProvenanceTag source="Asset Management System · Finance" />
              <FreshnessTag label="Updated Apr 2, 2026" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
              <Printer className="w-3.5 h-3.5" />
              Print Report
            </button>
            <button
              onClick={async () => {
                setExporting(true);
                setExportError("");
                try {
                  await exportLenderReportPDF(reportPeriod);
                } catch {
                  setExportError("Export failed. Try again.");
                } finally {
                  setExporting(false);
                }
              }}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
              style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#3b82f6" }}>
              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {exporting ? "Exporting..." : "Export PDF"}
            </button>
          </div>
        </div>
        {exportError && <p className="text-[10px] text-rose-400 mt-1">{exportError}</p>}
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Portfolio Value", value: formatCurrency(portfolioSummary.totalValue), sub: "8 assets", color: "#40856a" },
          { label: "Total Debt", value: formatCurrency(totalDebt), sub: "5 lenders", color: "#3b82f6" },
          { label: "LP Commitments", value: formatCurrency(totalCommitment), sub: "5 investors", color: "#8b5cf6" },
          { label: "YTD Distributions", value: formatCurrency(DISTRIBUTIONS[0].amount), sub: "Q1 2026", color: "#f59e0b" },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{m.label}</p>
            <p className="text-lg font-bold" style={{ color: m.color }}>{m.value}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>{m.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-1 border-b flex-wrap" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-3 py-2 text-xs font-medium transition-colors"
            style={{
              color: activeTab === tab.id ? "#40856a" : "rgba(255,255,255,0.4)",
              borderBottom: activeTab === tab.id ? "2px solid #40856a" : "2px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "executive" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="rounded-xl p-5 space-y-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" style={{ color: "#c8a060" }} />
              <h3 className="font-bold text-white text-sm">Executive Summary — {reportPeriod}</h3>
            </div>
            <div className="prose-style space-y-3 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
              <p>
                The SZL Holdings real estate portfolio closed Q1 2026 with <strong className="text-white/80">$454.1M in total asset value</strong> across 8 properties
                spanning multifamily, office, industrial, retail, and mixed-use asset classes. Portfolio-wide occupancy averaged <strong className="text-white/80">88.0%</strong>, with
                6 of 8 assets classified as "Performing" and two flagged for active monitoring.
              </p>
              <p>
                <strong className="text-white/80">Portfolio NOI for the trailing 12 months</strong> totaled approximately <strong className="text-white/80">$25.8M</strong>,
                with the top-performing asset, Harborview Residences (Boston), generating a 97.2% occupancy rate and 4.9% cap rate yield.
                The portfolio's weighted average cap rate is <strong className="text-white/80">5.93%</strong>, in line with institutional benchmarks for the current rate environment.
              </p>
              <div className="p-3 rounded-lg" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)" }}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
                  <div>
                    <p className="font-semibold" style={{ color: "#f59e0b" }}>Watch Item: Skyline Lofts (Chicago, IL)</p>
                    <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
                      Occupancy at 68.4%, DSCR at 0.94x (below 1.0x covenant floor), and a loan maturity of September 14, 2026 represent the most material risk exposure
                      in the portfolio. Capital markets is actively engaged on refinance and/or maturity extension. Leasing incentive program initiated April 2026.
                    </p>
                  </div>
                </div>
              </div>
              <p>
                Distributions of <strong className="text-white/80">$3.2M</strong> were made on March 15, 2026 ($0.58/unit), consistent with the prior three quarters.
                Total LP capital distributions since fund inception stand at <strong className="text-white/80">{formatCurrency(totalDistributed)}</strong> across all investor accounts.
                No material covenant breaches have been reported for the performing portfolio; Skyline Lofts occupancy covenant is under cure protocol.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h4 className="text-sm font-bold text-white mb-4">Portfolio NOI — Trailing 12 Months</h4>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueHistory}>
                    <defs>
                      <linearGradient id="noiGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#40856a" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#40856a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1e6).toFixed(1)}M`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: "rgba(10,12,16,0.97)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, fontSize: 11 }} />
                    <Area type="monotone" dataKey="noi" name="NOI" stroke="#40856a" fill="url(#noiGrad)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <ProvenanceTag source="Internal · Asset Mgmt System" />
                <FreshnessTag label="Monthly reconciled" />
              </div>
            </div>

            <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h4 className="text-sm font-bold text-white mb-4">Capital Allocation by Asset Type</h4>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={capitalByType} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                      {capitalByType.map((entry, idx) => (
                        <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: "rgba(10,12,16,0.97)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <ProvenanceTag source="Portfolio Model · Q1 2026" />
              </div>
            </div>
          </div>

          <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <h4 className="text-sm font-bold text-white mb-3">Key Risks — {reportPeriod}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { severity: "critical", title: "Loan Maturity Concentration", desc: "Skyline Lofts loan matures Sept 2026. DSCR sub-1.0 constrains refi options. Extension in negotiation." },
                { severity: "high", title: "Vacancy — Two Assets", desc: "Skyline Lofts (68.4%) and The Atrium (78.1%) are below occupancy thresholds. Combined revenue impact: ~$220K/mo." },
                { severity: "medium", title: "Office Market Softness", desc: "Pacific Heights Plaza and Greenfield Office Campus face lease renewal pressure as hybrid work trends persist. NovaBio lease expires Feb 2026." },
              ].map((r, i) => {
                const c = r.severity === "critical" ? "#ef4444" : r.severity === "high" ? "#f59e0b" : "#3b82f6";
                return (
                  <div key={i} className="p-3 rounded-lg" style={{ background: `${c}08`, border: `1px solid ${c}20` }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertTriangle className="w-3.5 h-3.5" style={{ color: c }} />
                      <span className="text-[10px] font-bold uppercase" style={{ color: c }}>{r.severity}</span>
                    </div>
                    <p className="text-xs font-semibold text-white/80 mb-1">{r.title}</p>
                    <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>{r.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "portfolio" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" style={{ color: "#40856a" }} />
                <h3 className="font-bold text-white text-sm">Asset-Level Performance</h3>
              </div>
              <div className="flex items-center gap-2">
                <ProvenanceTag source="Asset Management System" />
                <FreshnessTag label="Updated daily" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    {["Asset", "Type", "City", "Value", "NOI (Annual)", "Cap Rate", "Occupancy", "Status"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[9px]"
                        style={{ color: "rgba(255,255,255,0.3)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
                  {properties.map(p => {
                    const statusColor = p.status === "performing" ? "#10b981" : p.status === "watch" ? "#f59e0b" : "#ef4444";
                    return (
                      <tr key={p.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-white/80">{p.name}</p>
                            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{p.units} units · {(p.sqft / 1000).toFixed(0)}K sqft</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 capitalize" style={{ color: "rgba(255,255,255,0.5)" }}>{p.type}</td>
                        <td className="px-4 py-3" style={{ color: "rgba(255,255,255,0.5)" }}>{p.city}, {p.state}</td>
                        <td className="px-4 py-3 font-semibold" style={{ color: "#c8a060" }}>{formatCurrency(p.value)}</td>
                        <td className="px-4 py-3 font-semibold text-white/70">{formatCurrency(p.annualNOI)}</td>
                        <td className="px-4 py-3 font-semibold text-white/70">{p.capRate}%</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                              <div className="h-full rounded-full" style={{ width: `${p.occupancy}%`, background: statusColor }} />
                            </div>
                            <span className="font-mono font-semibold" style={{ color: statusColor }}>{p.occupancy}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded capitalize"
                            style={{ color: statusColor, background: `${statusColor}12` }}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                    <td className="px-4 py-3 font-bold text-white/80" colSpan={3}>Portfolio Total</td>
                    <td className="px-4 py-3 font-bold" style={{ color: "#c8a060" }}>{formatCurrency(portfolioSummary.totalValue)}</td>
                    <td className="px-4 py-3 font-bold text-white/70">{formatCurrency(portfolioSummary.totalAnnualNOI)}</td>
                    <td className="px-4 py-3 font-bold text-white/70">{portfolioSummary.avgCapRate.toFixed(1)}%</td>
                    <td className="px-4 py-3 font-bold text-white/70">{portfolioSummary.avgOccupancy.toFixed(1)}%</td>
                    <td className="px-4 py-3" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <h4 className="text-sm font-bold text-white mb-4">Revenue vs NOI — Trailing 12 Months</h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1e6).toFixed(1)}M`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ background: "rgba(10,12,16,0.97)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" opacity={0.6} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="noi" name="NOI" fill="#40856a" opacity={0.8} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <ProvenanceTag source="Internal · Finance · Monthly Actuals" />
              <FreshnessTag label="Reconciled monthly" />
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "debt" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" style={{ color: "#3b82f6" }} />
                <h3 className="font-bold text-white text-sm">Debt Schedule</h3>
              </div>
              <div className="flex items-center gap-2">
                <ProvenanceTag source="Lender Statements · Capital Stack Model" />
                <FreshnessTag label="Updated monthly" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    {["Lender", "Property", "Loan Balance", "Maturity", "LTV", "DSCR", "Status"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[9px]"
                        style={{ color: "rgba(255,255,255,0.3)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
                  {LENDERS.map((l, i) => {
                    const dscr = parseFloat(l.dscr);
                    const maturityDate = new Date(l.maturity);
                    const monthsToMaturity = (maturityDate.getTime() - new Date("2026-04-02").getTime()) / (1000 * 60 * 60 * 24 * 30);
                    const maturityUrgent = monthsToMaturity < 6;
                    return (
                      <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-4 py-3 font-semibold text-white/80">{l.name}</td>
                        <td className="px-4 py-3" style={{ color: "rgba(255,255,255,0.5)" }}>{l.property}</td>
                        <td className="px-4 py-3 font-mono font-semibold" style={{ color: "#c8a060" }}>{formatCurrency(l.balance)}</td>
                        <td className="px-4 py-3">
                          <span className={cn("font-semibold", maturityUrgent ? "text-rose-400" : "text-white/60")}>
                            {new Date(l.maturity).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            {maturityUrgent && <span className="ml-1 text-[9px] font-bold bg-rose-500/15 text-rose-400 px-1 py-0.5 rounded">URGENT</span>}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("font-mono font-semibold", parseFloat(l.ltv) > 75 ? "text-rose-400" : parseFloat(l.ltv) > 65 ? "text-amber-400" : "text-white/60")}>
                            {l.ltv}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("font-mono font-semibold", dscr < 1.0 ? "text-rose-400" : dscr < 1.2 ? "text-amber-400" : "text-emerald-400")}>
                            {l.dscr}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded capitalize",
                            l.status === "watch" ? "text-amber-400 bg-amber-400/10" : "text-emerald-400 bg-emerald-400/10")}>
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                    <td className="px-4 py-3 font-bold text-white/80" colSpan={2}>Total Portfolio Debt</td>
                    <td className="px-4 py-3 font-bold font-mono" style={{ color: "#c8a060" }}>{formatCurrency(totalDebt)}</td>
                    <td colSpan={4} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "investors" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" style={{ color: "#8b5cf6" }} />
                <h3 className="font-bold text-white text-sm">LP Investor Summary</h3>
              </div>
              <ProvenanceTag source="Fund Administration · Q1 2026" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    {["Investor", "Tier", "Commitment", "Deployed", "Distributions", "Net IRR", "MOIC"].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wider text-[9px]"
                        style={{ color: "rgba(255,255,255,0.3)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.03)" }}>
                  {LP_INVESTORS.map((inv, i) => (
                    <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-4 py-3 font-semibold text-white/80">{inv.name}</td>
                      <td className="px-4 py-3 text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>{inv.tier}</td>
                      <td className="px-4 py-3 font-mono font-semibold" style={{ color: "#c8a060" }}>{formatCurrency(inv.commitment)}</td>
                      <td className="px-4 py-3 font-mono" style={{ color: "rgba(255,255,255,0.6)" }}>{formatCurrency(inv.deployed)}</td>
                      <td className="px-4 py-3 font-mono" style={{ color: "#10b981" }}>{formatCurrency(inv.distributions)}</td>
                      <td className="px-4 py-3 font-mono font-semibold" style={{ color: "#40856a" }}>{inv.netIRR}%</td>
                      <td className="px-4 py-3 font-mono font-semibold" style={{ color: "#40856a" }}>{inv.moic}x</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                    <td className="px-4 py-3 font-bold text-white/80" colSpan={2}>Total</td>
                    <td className="px-4 py-3 font-bold font-mono" style={{ color: "#c8a060" }}>{formatCurrency(totalCommitment)}</td>
                    <td className="px-4 py-3 font-mono font-bold text-white/60">{formatCurrency(LP_INVESTORS.reduce((s, i) => s + i.deployed, 0))}</td>
                    <td className="px-4 py-3 font-mono font-bold" style={{ color: "#10b981" }}>{formatCurrency(totalDistributed)}</td>
                    <td className="px-4 py-3 font-mono font-bold" style={{ color: "#40856a" }}>
                      {(LP_INVESTORS.reduce((s, i) => s + i.netIRR, 0) / LP_INVESTORS.length).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 font-mono font-bold" style={{ color: "#40856a" }}>
                      {(LP_INVESTORS.reduce((s, i) => s + i.moic, 0) / LP_INVESTORS.length).toFixed(2)}x
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-white">Distribution History</h4>
              <ProvenanceTag source="Fund Admin · Waterfall Model" />
            </div>
            <div className="space-y-2">
              {DISTRIBUTIONS.map((d, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div>
                    <p className="text-sm font-semibold text-white/80">{d.period}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{d.date} · {d.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: "#10b981" }}>{formatCurrency(d.amount)}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{d.perUnit}/unit</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Total Distributed (LTD)</span>
              <span className="font-bold text-sm" style={{ color: "#10b981" }}>
                {formatCurrency(DISTRIBUTIONS.reduce((s, d) => s + d.amount, 0))}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "covenants" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" style={{ color: "#40856a" }} />
                <h3 className="font-bold text-white text-sm">Covenant Compliance — {reportPeriod}</h3>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                <span className="text-emerald-400 font-semibold">
                  {COVENANT_STATUS.filter(c => c.status === "current").length} compliant
                </span>
                <span>·</span>
                <span className="text-amber-400 font-semibold">
                  {COVENANT_STATUS.filter(c => c.status === "watch").length} watch
                </span>
                <span>·</span>
                <span className="text-rose-400 font-semibold">
                  {COVENANT_STATUS.filter(c => c.status === "breach").length} breach
                </span>
              </div>
            </div>
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {COVENANT_STATUS.map((cov, i) => {
                const statusColor = cov.status === "current" ? "#10b981" : cov.status === "watch" ? "#f59e0b" : "#ef4444";
                const StatusIcon = cov.status === "current" ? CheckCircle : AlertTriangle;
                return (
                  <div key={i} className="flex items-start gap-4 px-5 py-4 hover:bg-white/[0.01] transition-colors">
                    <StatusIcon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: statusColor }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-white/80">{cov.name}</p>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                          style={{ color: statusColor, background: `${statusColor}12` }}>
                          {cov.status}
                        </span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{cov.detail}</p>
                    </div>
                    {cov.property && (
                      <Link href={`/property/${cov.property}`}>
                        <button className="text-[10px] px-2 py-1 rounded transition-all flex items-center gap-1"
                          style={{ color: statusColor, border: `1px solid ${statusColor}30` }}>
                          View Asset <ChevronRight className="w-3 h-3" />
                        </button>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
