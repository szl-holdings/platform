import { useState, useEffect, useMemo, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  TrendingUp, DollarSign, Users, FileText, BarChart3, ShieldCheck,
  AlertCircle, CheckCircle2, Clock, ArrowUpRight, ArrowDownRight,
  PieChart, Activity, Building2, ChevronRight, RefreshCw,
  Plus, X, Briefcase, Scale, Calculator, Download, Layers,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart as RePie, Pie, Cell, Legend,
} from "recharts";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const PORTFOLIO_COMPANIES = [
  { slug: "vessels", name: "Vessels", color: "#4a90b8" },
  { slug: "aegis", name: "Aegis", color: "#c45a4a" },
  { slug: "terra", name: "Terra", color: "#c8953c" },
  { slug: "prism-counsel", name: "PRISM Counsel", color: "#d4a054" },
  { slug: "carlota-jo", name: "Carlota Jo", color: "#8b7ac8" },
  { slug: "lyte", name: "Lyte", color: "#6aaa72" },
];

function fmt(n: number, currency = true): string {
  if (n === 0) return currency ? "$0" : "0";
  if (Math.abs(n) >= 1_000_000) return (currency ? "$" : "") + (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000) return (currency ? "$" : "") + (n / 1_000).toFixed(0) + "K";
  return (currency ? "$" : "") + n.toFixed(0);
}

function pct(n: number | null | undefined): string {
  if (n == null) return "—";
  return (n * 100).toFixed(1) + "%";
}

type Tab = "portfolio" | "compliance" | "captable" | "admin";

type SummaryData = {
  compliance: { totalInvestors: number; verifiedInvestors: number; pendingVerification: number; formDFilings: number; lpReports: number };
  fundAdmin: {
    capitalCalls: number; distributions: number;
    latestNav: { navDate: string; totalNavCents: number; calledCapitalCents: number; netIrr: string | null; tvpi: string | null; dpi: string | null; rvpi: string | null } | null;
    pendingCapitalCalls: Array<{ id: number; callNumber: number; callDate: string; dueDate: string; totalAmountCents: number; fundedAmountCents: number; status: string; purpose: string }>;
  };
};

type PortfolioFinancial = {
  id: number; companySlug: string; companyName: string; periodLabel: string;
  periodStart: string; periodEnd: string; periodType: string;
  revenue: string | null; burnRate: string | null; cashAndEquivalents: string | null;
  runwayMonths: string | null; ebitda: string | null; netIncome: string | null;
  grossProfit: string | null; operatingExpenses: string | null;
  reportingStatus: string; cogs: string | null;
};

type CapTableRow = {
  holder: { id: number; name: string; holderType: string };
  sharesByClass: Record<string, number>;
  totalShares: number;
  ownershipPct: number;
};

type CapTableSummary = {
  holders: CapTableRow[];
  shareClasses: Array<{ id: number; name: string; classType: string; issuedShares: string | null; liquidationPreferencePct: string | null; liquidationMultiple: string | null; isParticipating: boolean; seniority: number }>;
  totalSharesByClass: Record<string, number>;
  fullyDilutedTotal: number;
};

type LpReport = {
  id: number; reportType: string; reportingPeriod: string; status: string;
  periodStart: string; periodEnd: string;
  netIrr: string | null; tvpi: string | null; dpi: string | null; rvpi: string | null;
  grossIrr: string | null; fundNav: string | null; totalCommitments: string | null;
  calledCapital: string | null; distributedCapital: string | null;
  managementFeeRate: string | null; carryRate: string | null; preferredReturnRate: string | null;
  narrativeSummary: string | null; disclaimers: string | null;
};

type AccreditedInvestor = {
  id: number; lpName: string; lpType: string; accreditationBasis: string;
  verificationMethod: string; verificationStatus: string; contactEmail: string | null;
  verifiedAt: string | null; verificationExpiresAt: string | null;
};

type CapitalCall = {
  id: number; callNumber: number; callDate: string; dueDate: string;
  totalAmountCents: number; fundedAmountCents: number; status: string; purpose: string;
};

type FormDFiling = {
  id: number; entityName: string; filingType: string; exemption: string;
  offeringAmount: string | null; amountSold: string | null; investorCount: number | null;
  status: string; regDStatus: string; notes: string | null;
};

function useApiFetch<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api${path}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data ?? json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    verified: "bg-[#6aaa72]/15 text-[#6aaa72] border-[#6aaa72]/20",
    pending: "bg-[#d4a054]/15 text-[#d4a054] border-[#d4a054]/20",
    filed: "bg-[#4a90b8]/15 text-[#4a90b8] border-[#4a90b8]/20",
    compliant: "bg-[#6aaa72]/15 text-[#6aaa72] border-[#6aaa72]/20",
    review_needed: "bg-[#d4a054]/15 text-[#d4a054] border-[#d4a054]/20",
    final: "bg-[#6aaa72]/15 text-[#6aaa72] border-[#6aaa72]/20",
    draft: "bg-white/[0.06] text-white/50 border-white/10",
    notices_sent: "bg-[#4a90b8]/15 text-[#4a90b8] border-[#4a90b8]/20",
    fully_funded: "bg-[#6aaa72]/15 text-[#6aaa72] border-[#6aaa72]/20",
    overdue: "bg-[#c45a4a]/15 text-[#c45a4a] border-[#c45a4a]/20",
    distributed: "bg-[#8b7ac8]/15 text-[#8b7ac8] border-[#8b7ac8]/20",
    approved: "bg-[#4a90b8]/15 text-[#4a90b8] border-[#4a90b8]/20",
    expired: "bg-[#c45a4a]/15 text-[#c45a4a] border-[#c45a4a]/20",
  };
  const cls = colors[status] ?? "bg-white/[0.06] text-white/50 border-white/10";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function MetricCard({ label, value, sub, icon: Icon, color, trend }: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string; trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20" style={{ color }}>
          <Icon className="h-4 w-4" />
        </div>
        {trend && trend !== "neutral" && (
          trend === "up"
            ? <ArrowUpRight className="h-4 w-4" style={{ color: "#6aaa72" }} />
            : <ArrowDownRight className="h-4 w-4" style={{ color: "#c45a4a" }} />
        )}
      </div>
      <div className="text-2xl font-semibold tracking-tight text-white">{value}</div>
      <div className="mt-1 text-xs text-white/50">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-white/35">{sub}</div>}
    </div>
  );
}

function ChartTooltipContent({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0c1018] px-4 py-3 text-xs">
      <p className="text-white/50 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/60">{p.name}:</span>
          <span className="font-semibold text-white">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function derivePeriodDates(periodType: string, year: string, periodValue: string): { start: string; end: string; label: string } {
  const y = parseInt(year, 10);
  if (periodType === "monthly") {
    const m = parseInt(periodValue, 10);
    const lastDay = new Date(y, m, 0).getDate();
    const monthName = new Date(y, m - 1, 1).toLocaleString("en-US", { month: "short" });
    return {
      start: `${y}-${String(m).padStart(2, "0")}-01`,
      end: `${y}-${String(m).padStart(2, "0")}-${lastDay}`,
      label: `${monthName} ${y}`,
    };
  }
  const q = parseInt(periodValue, 10);
  const startMonth = (q - 1) * 3 + 1;
  const endMonth = q * 3;
  const lastDay = new Date(y, endMonth, 0).getDate();
  return {
    start: `${y}-${String(startMonth).padStart(2, "0")}-01`,
    end: `${y}-${String(endMonth).padStart(2, "0")}-${lastDay}`,
    label: `Q${q} ${y}`,
  };
}

function DataEntryModal({ open, onClose, onSubmit, title }: {
  open: boolean; onClose: () => void; onSubmit: (data: Record<string, string>) => void; title: string;
}) {
  const [form, setForm] = useState<Record<string, string>>({
    companySlug: "vessels", periodType: "monthly", year: "2026", periodValue: "4",
    revenue: "", operatingExpenses: "", cashAndEquivalents: "", cogs: "",
  });

  if (!open) return null;

  const handleSubmit = () => {
    if (!form.revenue || !form.year || !form.periodValue) return;
    const dates = derivePeriodDates(form.periodType, form.year, form.periodValue);
    onSubmit({ ...form, periodStart: dates.start, periodEnd: dates.end, periodLabel: dates.label });
    setForm({ companySlug: "vessels", periodType: "monthly", year: "2026", periodValue: "4", revenue: "", operatingExpenses: "", cashAndEquivalents: "", cogs: "" });
  };

  const inputCls = "w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#d4a054]/40";
  const labelCls = "block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <m.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0c1018] p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/[0.06]"><X className="h-4 w-4 text-white/50" /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Portfolio Company</label>
            <select value={form.companySlug} onChange={e => setForm(f => ({ ...f, companySlug: e.target.value }))} className={inputCls}>
              {PORTFOLIO_COMPANIES.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Period Type</label>
            <select value={form.periodType} onChange={e => setForm(f => ({ ...f, periodType: e.target.value, periodValue: e.target.value === "monthly" ? "1" : "1" }))} className={inputCls}>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Year</label>
            <select value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} className={inputCls}>
              {["2024", "2025", "2026", "2027"].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>{form.periodType === "monthly" ? "Month" : "Quarter"}</label>
            <select value={form.periodValue} onChange={e => setForm(f => ({ ...f, periodValue: e.target.value }))} className={inputCls}>
              {form.periodType === "monthly"
                ? Array.from({ length: 12 }, (_, i) => {
                    const m = new Date(2026, i, 1).toLocaleString("en-US", { month: "long" });
                    return <option key={i + 1} value={String(i + 1)}>{m}</option>;
                  })
                : [1, 2, 3, 4].map(q => <option key={q} value={String(q)}>Q{q}</option>)}
            </select>
          </div>
          {[
            { key: "revenue", label: "Revenue ($)" },
            { key: "cogs", label: "COGS ($)" },
            { key: "operatingExpenses", label: "Operating Expenses ($)" },
            { key: "cashAndEquivalents", label: "Cash & Equivalents ($)" },
          ].map(f => (
            <div key={f.key}>
              <label className={labelCls}>{f.label}</label>
              <input type="number" value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} className={inputCls} />
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-3 justify-end">
          <button onClick={onClose} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-white/60 hover:bg-white/[0.04]">Cancel</button>
          <button onClick={handleSubmit} className="rounded-xl bg-[#d4a054] px-4 py-2 text-xs font-semibold text-black hover:bg-[#d4a054]/90">Submit Financial Data</button>
        </div>
      </m.div>
    </div>
  );
}

function WaterfallAnalysis({ capTable }: { capTable: CapTableSummary }) {
  const [exitVal, setExitVal] = useState(10_000_000);
  const exits = [5_000_000, 10_000_000, 25_000_000, 50_000_000, 100_000_000];

  const waterfall = useMemo(() => {
    if (!capTable?.holders.length) return [];
    const total = capTable.fullyDilutedTotal;
    if (total === 0) return [];

    return capTable.holders
      .filter(h => h.totalShares > 0)
      .sort((a, b) => b.ownershipPct - a.ownershipPct)
      .map(h => ({
        name: h.holder.name,
        type: h.holder.holderType,
        shares: h.totalShares,
        pct: h.ownershipPct,
        proceeds: Math.round((h.ownershipPct / 100) * exitVal),
      }));
  }, [capTable, exitVal]);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-white">Waterfall Analysis</h3>
          <p className="text-xs text-white/40 mt-0.5">Distribution of proceeds at configurable exit valuations</p>
        </div>
        <div className="flex gap-1.5">
          {exits.map(v => (
            <button key={v} onClick={() => setExitVal(v)}
              className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold transition ${exitVal === v ? "bg-[#d4a054] text-black" : "bg-white/[0.04] text-white/50 hover:bg-white/[0.06]"}`}>
              {fmt(v)}
            </button>
          ))}
        </div>
      </div>

      {waterfall.length > 0 ? (
        <div className="space-y-2">
          {waterfall.map(w => (
            <div key={w.name} className="flex items-center gap-4 rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{w.name}</div>
                <div className="text-[10px] text-white/40 capitalize">{w.type.replace(/_/g, " ")} · {w.pct.toFixed(2)}% ownership</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-white">{fmt(w.proceeds)}</div>
                <div className="text-[10px] text-white/35">{w.shares.toLocaleString()} shares</div>
              </div>
              <div className="w-24">
                <div className="h-1.5 rounded-full bg-white/[0.06]">
                  <div className="h-1.5 rounded-full bg-[#d4a054]" style={{ width: `${Math.min(w.pct, 100)}%` }} />
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-3 mt-3 border-t border-white/[0.06]">
            <span className="text-xs font-semibold text-white/60">Total Exit Value</span>
            <span className="text-lg font-semibold text-[#d4a054]">{fmt(exitVal)}</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-sm text-white/40">No cap table data — seed data first to see waterfall analysis</div>
      )}
    </div>
  );
}

function RoundModeling({ capTable }: { capTable: CapTableSummary }) {
  const [roundSize, setRoundSize] = useState(1500000);
  const [preMoney, setPreMoney] = useState(8000000);

  const modeling = useMemo(() => {
    const postMoney = preMoney + roundSize;
    const newSharesPct = (roundSize / postMoney) * 100;
    const existingDilution = 100 - newSharesPct;

    const diluted = (capTable?.holders ?? [])
      .filter(h => h.totalShares > 0)
      .map(h => ({
        name: h.holder.name,
        prePct: h.ownershipPct,
        postPct: h.ownershipPct * (existingDilution / 100),
        dilution: h.ownershipPct - h.ownershipPct * (existingDilution / 100),
      }));

    return { postMoney, newSharesPct, existingDilution, diluted };
  }, [capTable, roundSize, preMoney]);

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <h3 className="text-sm font-semibold text-white mb-1">Pro-Forma Round Modeling</h3>
      <p className="text-xs text-white/40 mb-6">Scenario modeling for new funding rounds</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40 mb-1.5">Round Size ($)</label>
          <input type="number" value={roundSize} onChange={e => setRoundSize(Number(e.target.value))}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4a054]/40" />
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40 mb-1.5">Pre-Money Valuation ($)</label>
          <input type="number" value={preMoney} onChange={e => setPreMoney(Number(e.target.value))}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#d4a054]/40" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
          <div className="text-xl font-semibold text-white">{fmt(modeling.postMoney)}</div>
          <div className="text-[10px] text-white/40 mt-1">Post-Money Valuation</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
          <div className="text-xl font-semibold text-[#d4a054]">{modeling.newSharesPct.toFixed(1)}%</div>
          <div className="text-[10px] text-white/40 mt-1">New Investor Ownership</div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
          <div className="text-xl font-semibold text-white">{modeling.existingDilution.toFixed(1)}%</div>
          <div className="text-[10px] text-white/40 mt-1">Existing Shareholders Retain</div>
        </div>
      </div>

      {modeling.diluted.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.025]">
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Holder</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Pre-Round %</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Post-Round %</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Dilution</th>
              </tr>
            </thead>
            <tbody>
              {modeling.diluted.map(d => (
                <tr key={d.name} className="border-b border-white/[0.04]">
                  <td className="px-4 py-2.5 text-sm text-white">{d.name}</td>
                  <td className="px-4 py-2.5 text-right text-white/70">{d.prePct.toFixed(2)}%</td>
                  <td className="px-4 py-2.5 text-right text-white font-semibold">{d.postPct.toFixed(2)}%</td>
                  <td className="px-4 py-2.5 text-right text-[#c45a4a]">-{d.dilution.toFixed(2)}%</td>
                </tr>
              ))}
              <tr className="bg-white/[0.02]">
                <td className="px-4 py-2.5 text-sm font-semibold text-[#d4a054]">New Investor</td>
                <td className="px-4 py-2.5 text-right text-white/40">—</td>
                <td className="px-4 py-2.5 text-right text-[#d4a054] font-semibold">{modeling.newSharesPct.toFixed(2)}%</td>
                <td className="px-4 py-2.5 text-right text-white/40">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function FundOperationsPage() {
  usePageMeta({
    title: "Fund Operations — SZL Holdings",
    description: "Real financial data, SEC compliance, cap table, and fund administration command center.",
    canonical: "https://szlholdings.com/fund-operations",
  });

  const [tab, setTab] = useState<Tab>("portfolio");
  const [showEntry, setShowEntry] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const { data: summary, loading: summaryLoading, reload: reloadSummary } = useApiFetch<SummaryData>("/fund-ops/summary");
  const { data: financialsData, loading: finLoading, reload: reloadFin } = useApiFetch<{ data: PortfolioFinancial[]; meta: { total: number } }>("/fund-ops/portfolio-financials?limit=100");
  const { data: capTable, loading: capLoading, reload: reloadCap } = useApiFetch<CapTableSummary>("/fund-ops/cap-table-summary");
  const { data: lpReportsData, reload: reloadLp } = useApiFetch<{ data: LpReport[] }>("/fund-ops/lp-reports?limit=20");
  const { data: capCallsData, reload: reloadCalls } = useApiFetch<{ data: CapitalCall[] }>("/fund-ops/capital-calls?limit=20");
  const { data: investorsData, reload: reloadInvestors } = useApiFetch<{ data: AccreditedInvestor[] }>("/fund-ops/accredited-investors?limit=50");
  const { data: formDData, reload: reloadFormD } = useApiFetch<{ data: FormDFiling[] }>("/fund-ops/form-d-filings?limit=10");

  const nav = summary?.fundAdmin.latestNav;
  const financials = financialsData?.data ?? [];
  const lpReports = lpReportsData?.data ?? [];
  const capCalls = capCallsData?.data ?? [];
  const investors = investorsData?.data ?? [];
  const formDFilings = formDData?.data ?? [];

  const totalRevenue = financials.reduce((s, f) => s + parseFloat(f.revenue ?? "0"), 0);

  const chartData = useMemo(() => {
    const periodMap: Record<string, { label: string; startDate: string; data: Record<string, number> }> = {};
    for (const f of financials) {
      const key = f.periodStart ?? f.periodLabel;
      if (!periodMap[key]) periodMap[key] = { label: f.periodLabel, startDate: f.periodStart, data: {} };
      periodMap[key].data[f.companySlug] = parseFloat(f.revenue ?? "0");
      periodMap[key].data["_total"] = (periodMap[key].data["_total"] ?? 0) + parseFloat(f.revenue ?? "0");
      periodMap[key].data["_burn"] = (periodMap[key].data["_burn"] ?? 0) + parseFloat(f.burnRate ?? "0");
      periodMap[key].data["_cash"] = (periodMap[key].data["_cash"] ?? 0) + parseFloat(f.cashAndEquivalents ?? "0");
    }
    return Object.values(periodMap)
      .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""))
      .map(({ label, data }) => ({ period: label, ...data }));
  }, [financials]);

  const companyBreakdown = useMemo(() => {
    const latest: Record<string, PortfolioFinancial> = {};
    for (const f of financials) {
      const existingStart = latest[f.companySlug]?.periodStart ?? "";
      if (!latest[f.companySlug] || f.periodStart > existingStart) {
        latest[f.companySlug] = f;
      }
    }
    return Object.values(latest);
  }, [financials]);

  const pieData = useMemo(() => {
    return companyBreakdown
      .filter(f => parseFloat(f.revenue ?? "0") > 0)
      .map(f => {
        const co = PORTFOLIO_COMPANIES.find(c => c.slug === f.companySlug);
        return { name: co?.name ?? f.companySlug, value: parseFloat(f.revenue ?? "0"), fill: co?.color ?? "#d4a054" };
      });
  }, [companyBreakdown]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await fetch("/api/fund-ops/seed", { method: "POST", headers: { "Content-Type": "application/json" } });
      reloadSummary();
      reloadFin();
      reloadCap();
      reloadLp();
      reloadCalls();
      reloadInvestors();
      reloadFormD();
    } finally {
      setSeeding(false);
    }
  };

  const handleDataEntry = async (data: Record<string, string>) => {
    const co = PORTFOLIO_COMPANIES.find(c => c.slug === data.companySlug);
    const rev = parseFloat(data.revenue || "0");
    const cogs = parseFloat(data.cogs || "0");
    const opex = parseFloat(data.operatingExpenses || "0");
    const cash = parseFloat(data.cashAndEquivalents || "0");
    const burn = opex > 0 ? opex : rev * 0.8;

    await fetch("/api/fund-ops/portfolio-financials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companySlug: data.companySlug,
        companyName: co?.name ?? data.companySlug,
        periodType: data.periodType ?? "monthly",
        periodLabel: data.periodLabel,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        reportingStatus: "draft",
        revenue: String(rev),
        cogs: String(cogs),
        grossProfit: String(rev - cogs),
        grossMarginPct: rev > 0 ? String(((rev - cogs) / rev).toFixed(4)) : "0",
        operatingExpenses: String(burn),
        ebitda: String(rev - burn),
        netIncome: String((rev - burn) * 0.85),
        cashAndEquivalents: String(cash),
        burnRate: String(burn),
        runwayMonths: burn > 0 ? String(Math.round((cash / burn) * 10) / 10) : "0",
      }),
    });
    setShowEntry(false);
    reloadFin();
  };

  const exportLpReportPdf = (report: LpReport) => {
    const lines = [
      `SZL Holdings — LP Report`,
      `${"=".repeat(50)}`,
      `Report Type: ${report.reportType.replace(/_/g, " ")}`,
      `Period: ${report.reportingPeriod} (${report.periodStart} – ${report.periodEnd})`,
      `Status: ${report.status}`,
      ``,
      `PERFORMANCE METRICS`,
      `${"─".repeat(30)}`,
      `Gross IRR: ${report.grossIrr ? pct(parseFloat(report.grossIrr)) : "—"}`,
      `Net IRR: ${report.netIrr ? pct(parseFloat(report.netIrr)) : "—"}`,
      `TVPI: ${report.tvpi ? parseFloat(report.tvpi).toFixed(2) + "x" : "—"}`,
      `DPI: ${report.dpi ? parseFloat(report.dpi).toFixed(2) + "x" : "—"}`,
      `RVPI: ${report.rvpi ? parseFloat(report.rvpi).toFixed(2) + "x" : "—"}`,
      ``,
      `FUND FINANCIALS`,
      `${"─".repeat(30)}`,
      `Fund NAV: ${report.fundNav ? "$" + parseFloat(report.fundNav).toLocaleString() : "—"}`,
      `Total Commitments: ${report.totalCommitments ? "$" + parseFloat(report.totalCommitments).toLocaleString() : "—"}`,
      `Called Capital: ${report.calledCapital ? "$" + parseFloat(report.calledCapital).toLocaleString() : "—"}`,
      `Management Fee Rate: ${report.managementFeeRate ? pct(parseFloat(report.managementFeeRate)) : "—"}`,
      `Carried Interest: ${report.carryRate ? pct(parseFloat(report.carryRate)) : "—"}`,
      `Preferred Return: ${report.preferredReturnRate ? pct(parseFloat(report.preferredReturnRate)) : "—"}`,
    ];
    if (report.narrativeSummary) {
      lines.push(``, `NARRATIVE SUMMARY`, `${"─".repeat(30)}`, report.narrativeSummary);
    }
    if (report.disclaimers) {
      lines.push(``, `DISCLAIMERS`, `${"─".repeat(30)}`, report.disclaimers);
    }
    lines.push(``, `${"─".repeat(50)}`, `Generated: ${new Date().toISOString()}`, `CONFIDENTIAL — For authorized recipients only.`);

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SZL_LP_Report_${report.reportingPeriod.replace(/\s/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const complianceDeadlines = useMemo(() => {
    const now = new Date();
    const deadlines: Array<{ label: string; date: string; status: "upcoming" | "overdue" | "complete"; category: string }> = [];

    const q = Math.ceil((now.getMonth() + 1) / 3);
    const y = now.getFullYear();
    const nextQEnd = new Date(y, q * 3, 0);
    const nextReportDue = new Date(nextQEnd);
    nextReportDue.setDate(nextReportDue.getDate() + 45);

    const hasCurrentReport = lpReports.some(r => r.reportingPeriod === `Q${q} ${y}` || r.reportingPeriod === `Q${q - 1 || 4} ${q === 1 ? y - 1 : y}`);
    deadlines.push({
      label: `Q${q} ${y} LP Report`,
      date: nextReportDue.toISOString().split("T")[0],
      status: hasCurrentReport ? "complete" : nextReportDue < now ? "overdue" : "upcoming",
      category: "LP Reporting",
    });

    const formDAmend = new Date(y, 11, 31);
    deadlines.push({
      label: `Form D Annual Amendment (${y})`,
      date: formDAmend.toISOString().split("T")[0],
      status: formDFilings.some(f => f.filingType === "amendment") ? "complete" : formDAmend < now ? "overdue" : "upcoming",
      category: "SEC Filing",
    });

    for (const inv of investors) {
      if (inv.verificationExpiresAt) {
        const exp = new Date(inv.verificationExpiresAt);
        const daysUntil = Math.ceil((exp.getTime() - now.getTime()) / 86400000);
        if (daysUntil <= 90) {
          deadlines.push({
            label: `${inv.lpName} — Accreditation Renewal`,
            date: inv.verificationExpiresAt.split("T")[0],
            status: daysUntil < 0 ? "overdue" : "upcoming",
            category: "Investor Compliance",
          });
        }
      }
    }

    for (const call of capCalls) {
      if (call.status === "notices_sent") {
        const due = new Date(call.dueDate);
        deadlines.push({
          label: `Capital Call #${call.callNumber} Due`,
          date: call.dueDate,
          status: due < now ? "overdue" : "upcoming",
          category: "Fund Admin",
        });
      }
    }

    return deadlines.sort((a, b) => a.date.localeCompare(b.date));
  }, [lpReports, formDFilings, investors, capCalls]);

  const reloadAll = () => { reloadSummary(); reloadFin(); reloadCap(); reloadLp(); reloadCalls(); reloadInvestors(); reloadFormD(); };
  const isLoading = summaryLoading || finLoading || capLoading;

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "portfolio", label: "Portfolio Financials", icon: BarChart3 },
    { id: "compliance", label: "SEC Compliance", icon: ShieldCheck },
    { id: "captable", label: "Cap Table", icon: PieChart },
    { id: "admin", label: "Fund Admin", icon: Briefcase },
  ];

  return (
    <div className="min-h-screen bg-[#070a10] text-white">
      <SiteNav />
      <DataEntryModal open={showEntry} onClose={() => setShowEntry(false)} onSubmit={handleDataEntry} title="Submit Portfolio Company Financials" />

      <main>
        <section className="border-b border-white/[0.07]">
          <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
            <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a054]/20 bg-[#d4a054]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#d4a054]">
                <Activity className="h-3.5 w-3.5" />
                Fund Operations Command
              </div>
              <div className="mt-5 flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">SZL Holdings — Fund Command</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-white/55">
                    Portfolio company financials, SEC compliance, cap table engine, and fund administration. Data is entered manually via structured forms.
                  </p>
                </div>
                <div className="flex gap-2">
                  {financials.length === 0 && (
                    <button onClick={handleSeed} disabled={seeding}
                      className="flex items-center gap-2 rounded-xl border border-[#d4a054]/30 bg-[#d4a054]/10 px-4 py-2 text-xs font-semibold text-[#d4a054] transition hover:bg-[#d4a054]/20 disabled:opacity-50">
                      {seeding ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Layers className="h-3.5 w-3.5" />}
                      Seed Demo Data
                    </button>
                  )}
                  <button onClick={() => setShowEntry(true)}
                    className="flex items-center gap-2 rounded-xl bg-[#d4a054] px-4 py-2 text-xs font-semibold text-black transition hover:bg-[#d4a054]/90">
                    <Plus className="h-3.5 w-3.5" /> Submit Financials
                  </button>
                  <button onClick={reloadAll}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-white/70 transition hover:bg-white/[0.06]">
                    <RefreshCw className="h-3.5 w-3.5" /> Refresh
                  </button>
                </div>
              </div>

              <div className="mt-8 flex gap-1.5 flex-wrap">
                {TABS.map(t => {
                  const Icon = t.icon;
                  return (
                    <button key={t.id} onClick={() => setTab(t.id)}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${tab === t.id ? "bg-[#d4a054] text-black" : "bg-white/[0.04] text-white/50 hover:bg-white/[0.06] hover:text-white/70"}`}>
                      <Icon className="h-3.5 w-3.5" /> {t.label}
                    </button>
                  );
                })}
              </div>
            </m.div>
          </div>
        </section>

        <AnimatePresence mode="wait">
          {tab === "portfolio" && (
            <m.div key="portfolio" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <section className="border-b border-white/[0.07]">
                <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
                  <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">Fund Performance</p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Net Asset Value & Return Metrics</h2>
                  </div>
                  {nav ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                      <MetricCard label="Fund NAV" value={fmt(nav.totalNavCents / 100)} icon={DollarSign} color="#d4a054" />
                      <MetricCard label="Called Capital" value={fmt(nav.calledCapitalCents / 100)} icon={TrendingUp} color="#4a90b8" />
                      <MetricCard label="Net IRR" value={nav.netIrr ? pct(parseFloat(nav.netIrr)) : "—"} icon={BarChart3} color="#6aaa72" />
                      <MetricCard label="TVPI" value={nav.tvpi ? `${parseFloat(nav.tvpi).toFixed(2)}x` : "—"} sub="Total Value to Paid-In" icon={Activity} color="#8b7ac8" />
                      <MetricCard label="DPI" value={nav.dpi ? `${parseFloat(nav.dpi).toFixed(2)}x` : "—"} sub="Distributions to Paid-In" icon={ArrowUpRight} color="#c45a4a" />
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <MetricCard label="Portfolio Companies" value={PORTFOLIO_COMPANIES.length.toString()} icon={Building2} color="#d4a054" />
                      <MetricCard label="Total Revenue" value={totalRevenue > 0 ? fmt(totalRevenue) : "No data"} icon={DollarSign} color="#4a90b8" />
                      <MetricCard label="Reporting Periods" value={String(chartData.length)} icon={Clock} color="#6aaa72" />
                      <MetricCard label="LP Reports Filed" value={String(summary?.compliance.lpReports ?? 0)} icon={FileText} color="#8b7ac8" />
                    </div>
                  )}
                </div>
              </section>

              {chartData.length > 0 && (
                <section className="border-b border-white/[0.07]">
                  <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
                    <div className="mb-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">Revenue Intelligence</p>
                      <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Consolidated Revenue & Burn by Period</h2>
                    </div>
                    <div className="grid gap-6 lg:grid-cols-3">
                      <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40 mb-4">Revenue by Company</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={chartData}>
                            <defs>
                              {PORTFOLIO_COMPANIES.map(co => (
                                <linearGradient key={co.slug} id={`grad-${co.slug}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={co.color} stopOpacity={0.25} />
                                  <stop offset="95%" stopColor={co.color} stopOpacity={0} />
                                </linearGradient>
                              ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="period" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} />
                            <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} tickFormatter={v => fmt(v, true)} />
                            <Tooltip content={<ChartTooltipContent />} />
                            {PORTFOLIO_COMPANIES.map(co => (
                              <Area key={co.slug} type="monotone" dataKey={co.slug} name={co.name} stackId="rev"
                                fill={`url(#grad-${co.slug})`} stroke={co.color} strokeWidth={1.5} />
                            ))}
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40 mb-4">Revenue Concentration</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <RePie>
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                              paddingAngle={2} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}>
                              {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                            </Pie>
                            <Tooltip formatter={(v: number) => fmt(v)} />
                          </RePie>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {chartData.length > 0 && (
                <section className="border-b border-white/[0.07]">
                  <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
                    <div className="mb-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">Operating Metrics</p>
                      <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Total Revenue vs Burn Rate</h2>
                    </div>
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                          <XAxis dataKey="period" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} />
                          <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} tickFormatter={v => fmt(v, true)} />
                          <Tooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="_total" name="Revenue" fill="#6aaa72" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="_burn" name="Burn Rate" fill="#c45a4a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </section>
              )}

              <section className="border-b border-white/[0.07]">
                <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">Portfolio Intelligence</p>
                      <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Company Financial Health — Latest Period</h2>
                    </div>
                  </div>
                  {companyBreakdown.length > 0 ? (
                    <div className="space-y-3">
                      {companyBreakdown.map((f, i) => {
                        const co = PORTFOLIO_COMPANIES.find(c => c.slug === f.companySlug);
                        const color = co?.color ?? "#d4a054";
                        const revenue = parseFloat(f.revenue ?? "0");
                        const burn = parseFloat(f.burnRate ?? "0");
                        const cash = parseFloat(f.cashAndEquivalents ?? "0");
                        const runway = parseFloat(f.runwayMonths ?? "0");
                        const ebitda = parseFloat(f.ebitda ?? "0");
                        const gm = parseFloat(f.grossProfit ?? "0");
                        return (
                          <m.div key={f.companySlug} initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: i * 0.04 }}
                            className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                              <div className="flex items-center gap-3">
                                <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                                <div>
                                  <div className="text-sm font-semibold text-white">{f.companyName}</div>
                                  <div className="text-xs text-white/40">{f.periodLabel}</div>
                                </div>
                              </div>
                              <StatusBadge status={f.reportingStatus} />
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Revenue</p>
                                <p className="mt-1 text-sm font-semibold text-white">{revenue > 0 ? fmt(revenue) : "—"}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Gross Profit</p>
                                <p className="mt-1 text-sm font-semibold text-white">{gm > 0 ? fmt(gm) : "—"}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">EBITDA</p>
                                <p className="mt-1 text-sm font-semibold" style={{ color: ebitda >= 0 ? "#6aaa72" : "#c45a4a" }}>
                                  {ebitda !== 0 ? fmt(ebitda) : "—"}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Burn Rate</p>
                                <p className="mt-1 text-sm font-semibold text-white">{burn > 0 ? fmt(burn) + "/mo" : "—"}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Cash</p>
                                <p className="mt-1 text-sm font-semibold text-white">{cash > 0 ? fmt(cash) : "—"}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Runway</p>
                                <p className="mt-1 text-sm font-semibold" style={{ color: runway > 12 ? "#6aaa72" : runway > 6 ? "#d4a054" : "#c45a4a" }}>
                                  {runway > 0 ? `${runway.toFixed(0)} mo` : "—"}
                                </p>
                              </div>
                            </div>
                          </m.div>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState icon={BarChart3} title="No financial data yet" description="Submit portfolio company financials using the button above, or seed demo data." />
                  )}
                </div>
              </section>
            </m.div>
          )}

          {tab === "compliance" && (
            <m.div key="compliance" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <section className="border-b border-white/[0.07]">
                <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
                  <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">SEC Compliance</p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Regulatory Status & Accredited Investor Registry</h2>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    <MetricCard label="Registered LPs" value={String(summary?.compliance.totalInvestors ?? 0)} icon={Users} color="#4a90b8" />
                    <MetricCard label="Verified Accredited" value={String(summary?.compliance.verifiedInvestors ?? 0)} icon={ShieldCheck} color="#6aaa72" />
                    <MetricCard label="Pending Verification" value={String(summary?.compliance.pendingVerification ?? 0)} icon={AlertCircle} color="#c8953c" />
                    <MetricCard label="Form D Filings" value={String(summary?.compliance.formDFilings ?? 0)} icon={FileText} color="#8b7ac8" />
                  </div>

                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-white">Reg D Compliance Checklist</h3>
                      <StatusBadge status={formDFilings.length > 0 ? "filed" : "pending"} />
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { label: "Form D filing on file", done: formDFilings.length > 0 },
                        { label: "Accredited investor verification records", done: (summary?.compliance.verifiedInvestors ?? 0) > 0 },
                        { label: "LP report — most recent period", done: lpReports.length > 0 },
                        { label: "Capital call notices documented", done: (summary?.fundAdmin.capitalCalls ?? 0) > 0 },
                        { label: "Distribution waterfall calculations on file", done: (summary?.fundAdmin.distributions ?? 0) > 0 },
                        { label: "Risk disclosures and disclaimers attached", done: lpReports.some(r => r.disclaimers) },
                        { label: "Performance reported as net returns", done: lpReports.some(r => r.netIrr) },
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3">
                          {item.done
                            ? <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#6aaa72" }} />
                            : <AlertCircle className="h-4 w-4 shrink-0" style={{ color: "#d4a054" }} />}
                          <span className="text-sm text-white/70">{item.label}</span>
                          <div className="ml-auto"><StatusBadge status={item.done ? "compliant" : "review_needed"} /></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {formDFilings.length > 0 && (
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 mb-6">
                      <h3 className="text-sm font-semibold text-white mb-4">Form D Filings</h3>
                      <div className="space-y-3">
                        {formDFilings.map(f => (
                          <div key={f.id} className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3">
                            <div>
                              <div className="text-sm font-medium text-white">{f.entityName}</div>
                              <div className="text-xs text-white/40">
                                {f.exemption.replace(/_/g, " ").toUpperCase()} · {f.filingType.replace(/_/g, " ")} · Offering: {f.offeringAmount ? fmt(parseFloat(f.offeringAmount)) : "TBD"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={f.regDStatus} />
                              <StatusBadge status={f.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {investors.length > 0 && (
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 mb-6">
                      <h3 className="text-sm font-semibold text-white mb-4">Accredited Investor Registry</h3>
                      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/[0.06] bg-white/[0.025]">
                              <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">LP Name</th>
                              <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Type</th>
                              <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Accreditation Basis</th>
                              <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Verification</th>
                              <th className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {investors.map(inv => (
                              <tr key={inv.id} className="border-b border-white/[0.04]">
                                <td className="px-4 py-2.5 text-sm font-medium text-white">{inv.lpName}</td>
                                <td className="px-4 py-2.5 text-xs text-white/50 capitalize">{inv.lpType.replace(/_/g, " ")}</td>
                                <td className="px-4 py-2.5 text-xs text-white/50">{inv.accreditationBasis.replace(/_/g, " ")}</td>
                                <td className="px-4 py-2.5 text-xs text-white/50">{inv.verificationMethod.replace(/_/g, " ")}</td>
                                <td className="px-4 py-2.5"><StatusBadge status={inv.verificationStatus} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                    <h3 className="text-sm font-semibold text-white mb-4">LP Reports & Performance Attribution</h3>
                    {lpReports.length > 0 ? (
                      <div className="space-y-3">
                        {lpReports.map(r => (
                          <div key={r.id} className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <div className="text-sm font-semibold text-white capitalize">{r.reportType.replace(/_/g, " ")} — {r.reportingPeriod}</div>
                                <div className="text-xs text-white/40">
                                  Net IRR: {r.netIrr ? pct(parseFloat(r.netIrr)) : "—"} ·
                                  TVPI: {r.tvpi ? `${parseFloat(r.tvpi).toFixed(2)}x` : "—"} ·
                                  DPI: {r.dpi ? `${parseFloat(r.dpi).toFixed(2)}x` : "—"} ·
                                  RVPI: {r.rvpi ? `${parseFloat(r.rvpi).toFixed(2)}x` : "—"}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => exportLpReportPdf(r)}
                                  className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-semibold text-white/60 hover:bg-white/[0.06] transition"
                                  title="Export PDF">
                                  <Download className="h-3 w-3" /> PDF
                                </button>
                                <StatusBadge status={r.status} />
                              </div>
                            </div>
                            {r.narrativeSummary && (
                              <p className="text-xs text-white/45 leading-5 border-t border-white/[0.05] pt-3 mt-2">{r.narrativeSummary}</p>
                            )}
                            {r.disclaimers && (
                              <p className="text-[10px] text-white/25 leading-4 mt-2 italic">{r.disclaimers}</p>
                            )}
                            {r.fundNav && (
                              <div className="mt-3 grid grid-cols-4 gap-3 border-t border-white/[0.05] pt-3">
                                <div><span className="text-[10px] text-white/35 block">Fund NAV</span><span className="text-xs font-semibold text-white">{fmt(parseFloat(r.fundNav))}</span></div>
                                <div><span className="text-[10px] text-white/35 block">Commitments</span><span className="text-xs font-semibold text-white">{r.totalCommitments ? fmt(parseFloat(r.totalCommitments)) : "—"}</span></div>
                                <div><span className="text-[10px] text-white/35 block">Called Capital</span><span className="text-xs font-semibold text-white">{r.calledCapital ? fmt(parseFloat(r.calledCapital)) : "—"}</span></div>
                                <div><span className="text-[10px] text-white/35 block">Mgmt Fee Rate</span><span className="text-xs font-semibold text-white">{r.managementFeeRate ? pct(parseFloat(r.managementFeeRate)) : "—"}</span></div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState icon={FileText} title="No LP reports yet" description="Seed demo data to populate quarterly LP reports with IRR, TVPI, DPI metrics." />
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 mt-6">
                    <h3 className="text-sm font-semibold text-white mb-1">Compliance Calendar</h3>
                    <p className="text-xs text-white/40 mb-4">Upcoming deadlines and regulatory milestones</p>
                    {complianceDeadlines.length > 0 ? (
                      <div className="space-y-2">
                        {complianceDeadlines.map((dl, i) => (
                          <div key={i} className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3">
                            {dl.status === "complete"
                              ? <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#6aaa72" }} />
                              : dl.status === "overdue"
                                ? <AlertCircle className="h-4 w-4 shrink-0" style={{ color: "#c45a4a" }} />
                                : <Clock className="h-4 w-4 shrink-0" style={{ color: "#d4a054" }} />}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-white">{dl.label}</div>
                              <div className="text-[10px] text-white/35">{dl.category} · Due: {dl.date}</div>
                            </div>
                            <StatusBadge status={dl.status === "complete" ? "compliant" : dl.status} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-sm text-white/40">No upcoming deadlines</div>
                    )}
                  </div>

                  <div className="mt-6 rounded-2xl border border-[#d4a054]/15 bg-[#d4a054]/[0.04] p-4">
                    <div className="flex items-start gap-2">
                      <Scale className="h-4 w-4 text-[#d4a054] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-[#d4a054]">SEC Compliance Disclaimer</p>
                        <p className="text-xs text-white/40 mt-0.5">
                          This module is for internal compliance tracking only. It does not constitute legal or regulatory advice. All filings, disclosures, and
                          investor communications should be reviewed by qualified securities counsel before external distribution. Past performance data
                          does not guarantee future results. IRR, TVPI, DPI, and RVPI calculations follow ILPA/GIPS standards.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </m.div>
          )}

          {tab === "captable" && (
            <m.div key="captable" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <section className="border-b border-white/[0.07]">
                <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
                  <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">Cap Table Engine</p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Ownership & Equity Register</h2>
                  </div>

                  {capTable && capTable.holders.length > 0 ? (
                    <>
                      <div className="mb-6 flex items-center justify-between">
                        <div className="text-xs text-white/40">
                          {capTable.holders.length} holders · {capTable.fullyDilutedTotal.toLocaleString()} fully diluted shares
                        </div>
                      </div>
                      <div className="overflow-x-auto rounded-2xl border border-white/[0.06] mb-8">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-white/[0.06] bg-white/[0.025]">
                              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Holder</th>
                              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Type</th>
                              <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Shares</th>
                              <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Ownership %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...capTable.holders]
                              .sort((a, b) => b.ownershipPct - a.ownershipPct)
                              .map((row, i) => (
                                <tr key={row.holder.id} className={`border-b border-white/[0.04] ${i % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                                  <td className="px-4 py-3 text-sm font-medium text-white">{row.holder.name}</td>
                                  <td className="px-4 py-3 text-xs text-white/45 capitalize">{row.holder.holderType.replace(/_/g, " ")}</td>
                                  <td className="px-4 py-3 text-right text-sm text-white">{row.totalShares.toLocaleString()}</td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <div className="h-1.5 w-20 rounded-full bg-white/[0.06]">
                                        <div className="h-1.5 rounded-full bg-[#d4a054]" style={{ width: `${Math.min(row.ownershipPct, 100)}%` }} />
                                      </div>
                                      <span className="text-sm font-semibold text-white w-16 text-right">{row.ownershipPct.toFixed(2)}%</span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>

                      {capTable.shareClasses.length > 0 && (
                        <div className="mb-8">
                          <h3 className="text-sm font-semibold text-white mb-3">Share Classes</h3>
                          <div className="flex flex-wrap gap-2">
                            {capTable.shareClasses.map(sc => (
                              <span key={sc.id} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-white/55">
                                {sc.name} · {sc.issuedShares ? parseInt(sc.issuedShares).toLocaleString() : "0"} shares · {sc.classType.replace(/_/g, " ")}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <EmptyState icon={PieChart} title="Cap table not yet populated" description="Seed demo data to populate the cap table with share classes, holders, and transactions." />
                  )}
                </div>
              </section>

              <section className="border-b border-white/[0.07]">
                <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
                  <WaterfallAnalysis capTable={capTable!} />
                </div>
              </section>

              <section className="border-b border-white/[0.07]">
                <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
                  <RoundModeling capTable={capTable!} />
                </div>
              </section>
            </m.div>
          )}

          {tab === "admin" && (
            <m.div key="admin" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <section className="border-b border-white/[0.07]">
                <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
                  <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">Fund Administration</p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Capital Calls, Distributions & Performance</h2>
                  </div>

                  {nav && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
                      <MetricCard label="Fund NAV" value={fmt(nav.totalNavCents / 100)} icon={DollarSign} color="#d4a054" />
                      <MetricCard label="Net IRR" value={nav.netIrr ? pct(parseFloat(nav.netIrr)) : "—"} icon={TrendingUp} color="#6aaa72" />
                      <MetricCard label="TVPI" value={nav.tvpi ? `${parseFloat(nav.tvpi).toFixed(2)}x` : "—"} icon={Activity} color="#4a90b8" />
                      <MetricCard label="DPI" value={nav.dpi ? `${parseFloat(nav.dpi).toFixed(2)}x` : "—"} icon={ArrowUpRight} color="#8b7ac8" />
                      <MetricCard label="RVPI" value={nav.rvpi ? `${parseFloat(nav.rvpi).toFixed(2)}x` : "—"} icon={BarChart3} color="#c45a4a" />
                    </div>
                  )}

                  <div className="grid gap-6 lg:grid-cols-2 mb-8">
                    <div>
                      <h3 className="mb-4 text-sm font-semibold text-white">Capital Calls</h3>
                      {capCalls.length > 0 ? (
                        <div className="space-y-3">
                          {capCalls.map(call => {
                            const fundedPct = call.totalAmountCents > 0
                              ? (call.fundedAmountCents / call.totalAmountCents) * 100 : 0;
                            return (
                              <div key={call.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <div className="text-sm font-semibold text-white">Capital Call #{call.callNumber}</div>
                                    <div className="text-xs text-white/40">{call.purpose} · Due {call.dueDate}</div>
                                  </div>
                                  <StatusBadge status={call.status} />
                                </div>
                                <div className="flex items-center gap-3 mt-3">
                                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
                                    <div className="h-1.5 rounded-full bg-[#4a90b8]" style={{ width: `${fundedPct}%` }} />
                                  </div>
                                  <span className="text-xs text-white/50">{fmt(call.fundedAmountCents / 100)} / {fmt(call.totalAmountCents / 100)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-6 text-sm text-white/40 text-center">No capital calls on record</div>
                      )}
                    </div>

                    <div>
                      <h3 className="mb-4 text-sm font-semibold text-white">Administration Status</h3>
                      <div className="space-y-3">
                        {[
                          { label: "LP Capital Accounts", value: `${summary?.compliance.totalInvestors ?? 0} LPs`, icon: Users, color: "#4a90b8" },
                          { label: "Fund Distributions", value: `${summary?.fundAdmin.distributions ?? 0} on record`, icon: DollarSign, color: "#6aaa72" },
                          { label: "Capital Calls", value: `${summary?.fundAdmin.capitalCalls ?? 0} total`, icon: TrendingUp, color: "#d4a054" },
                          { label: "Latest NAV Date", value: nav?.navDate ?? "Not recorded", icon: Activity, color: "#8b7ac8" },
                        ].map(item => {
                          const Icon = item.icon;
                          return (
                            <div key={item.label} className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20" style={{ color: item.color }}>
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex-1">
                                <div className="text-xs text-white/40">{item.label}</div>
                                <div className="text-sm font-semibold text-white">{item.value}</div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-white/20" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {(summary?.compliance.totalInvestors ?? 0) > 0 && (
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 mb-8">
                      <h3 className="text-sm font-semibold text-white mb-4">Fee & Carry Summary</h3>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {lpReports.length > 0 && (() => {
                          const latest = lpReports[0];
                          return (
                            <>
                              <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-4 text-center">
                                <div className="text-lg font-semibold text-white">{latest.managementFeeRate ? pct(parseFloat(latest.managementFeeRate)) : "—"}</div>
                                <div className="text-[10px] text-white/40 mt-1">Management Fee Rate</div>
                              </div>
                              <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-4 text-center">
                                <div className="text-lg font-semibold text-white">{latest.carryRate ? pct(parseFloat(latest.carryRate)) : "—"}</div>
                                <div className="text-[10px] text-white/40 mt-1">Carried Interest</div>
                              </div>
                              <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-4 text-center">
                                <div className="text-lg font-semibold text-white">{latest.preferredReturnRate ? pct(parseFloat(latest.preferredReturnRate)) : "—"}</div>
                                <div className="text-[10px] text-white/40 mt-1">Preferred Return</div>
                              </div>
                              <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-4 text-center">
                                <div className="text-lg font-semibold text-[#d4a054]">{latest.grossIrr ? pct(parseFloat(latest.grossIrr)) : "—"}</div>
                                <div className="text-[10px] text-white/40 mt-1">Gross IRR</div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border border-[#d4a054]/15 bg-[#d4a054]/[0.04] p-4">
                    <div className="flex items-start gap-2">
                      <Calculator className="h-4 w-4 text-[#d4a054] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-[#d4a054]">Internal Use Only</p>
                        <p className="text-xs text-white/40 mt-0.5">
                          Fund administration data is for internal recordkeeping and LP communication only. IRR, TVPI, DPI, and RVPI calculations follow
                          ILPA/GIPS standards. Management fees and carried interest are calculated per the fund's limited partnership agreement.
                          All figures should be verified by the fund's administrator and auditor before external distribution.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </m.div>
          )}
        </AnimatePresence>
      </main>
      <SiteFooter />
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: {
  icon: React.ElementType; title: string; description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
        <Icon className="h-6 w-6 text-white/30" />
      </div>
      <h3 className="text-sm font-semibold text-white/60">{title}</h3>
      <p className="mt-2 max-w-sm mx-auto text-xs leading-5 text-white/35">{description}</p>
    </div>
  );
}
