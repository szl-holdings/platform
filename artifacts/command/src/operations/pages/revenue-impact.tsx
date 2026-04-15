import { useState, useEffect } from "react";
import { DollarSign, TrendingDown, AlertTriangle, Clock, RefreshCw, ChevronRight, Activity, Users, Shield } from "lucide-react";

const GOLD = "#d4a054";
const DS = {
  surface: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.06)",
  text: { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.5)", muted: "rgba(255,255,255,0.25)" },
};

type ImpactCategory = "transaction" | "sla" | "productivity" | "churn";
type IncidentSeverity = "critical" | "high" | "medium" | "low";

interface IncidentImpact {
  id: string;
  title: string;
  service: string;
  severity: IncidentSeverity;
  startedAt: number;
  durationMins: number;
  status: "active" | "resolved";
  lostTransactions: number;
  slaExposure: number;
  productivityCost: number;
  churnRisk: number;
  totalImpact: number;
  affectedClients: number;
  clientNames: string[];
  trend: "worsening" | "stable" | "improving";
}

interface RevenueBreakdown {
  category: ImpactCategory;
  label: string;
  amount: number;
  percentage: number;
  color: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const SEV_COLOR: Record<IncidentSeverity, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#f59e0b",
  low: "#6b8f71",
};

const SEED_INCIDENTS: IncidentImpact[] = [
  {
    id: "INC-2847",
    title: "API Gateway Latency Spike — P95 > 1.2s",
    service: "api-gateway",
    severity: "critical",
    startedAt: Date.now() - 38 * 60000,
    durationMins: 38,
    status: "active",
    lostTransactions: 142800,
    slaExposure: 58400,
    productivityCost: 22100,
    churnRisk: 31500,
    totalImpact: 254800,
    affectedClients: 14,
    clientNames: ["Northgate Corp", "Meridian Fund", "Pacific Logistics", "+11 more"],
    trend: "worsening",
  },
  {
    id: "INC-2845",
    title: "ML Inference Service OOM — Batch Jobs Failing",
    service: "ml-inference",
    severity: "high",
    startedAt: Date.now() - 92 * 60000,
    durationMins: 92,
    status: "active",
    lostTransactions: 38400,
    slaExposure: 22000,
    productivityCost: 14800,
    churnRisk: 12400,
    totalImpact: 87600,
    affectedClients: 6,
    clientNames: ["BlueSky Ventures", "TechBridge Inc", "+4 more"],
    trend: "stable",
  },
  {
    id: "INC-2841",
    title: "Auth Service Degradation — Login Failures 8%",
    service: "auth-service",
    severity: "high",
    startedAt: Date.now() - 4 * 3600000,
    durationMins: 240,
    status: "resolved",
    lostTransactions: 89200,
    slaExposure: 41000,
    productivityCost: 33600,
    churnRisk: 44800,
    totalImpact: 208600,
    affectedClients: 22,
    clientNames: ["Apex Systems", "Coastal Finance", "+20 more"],
    trend: "improving",
  },
  {
    id: "INC-2839",
    title: "Data Pipeline Stall — ETL Queue Backed Up",
    service: "data-pipeline",
    severity: "medium",
    startedAt: Date.now() - 6 * 3600000,
    durationMins: 145,
    status: "resolved",
    lostTransactions: 12400,
    slaExposure: 8800,
    productivityCost: 9200,
    churnRisk: 5600,
    totalImpact: 36000,
    affectedClients: 4,
    clientNames: ["Redwood Capital", "+3 more"],
    trend: "improving",
  },
];

function fmt$(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

function fmtDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function fmtAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function ImpactBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function IncidentCard({ inc }: { inc: IncidentImpact }) {
  const sc = SEV_COLOR[inc.severity];
  const trendColor = inc.trend === "worsening" ? "#ef4444" : inc.trend === "improving" ? "#6b8f71" : "#f59e0b";
  const trendLabel = inc.trend === "worsening" ? "↑ Worsening" : inc.trend === "improving" ? "↓ Improving" : "→ Stable";

  const breakdown: { label: string; amount: number; color: string }[] = [
    { label: "Lost Transactions", amount: inc.lostTransactions, color: "#ef4444" },
    { label: "SLA Exposure", amount: inc.slaExposure, color: "#f97316" },
    { label: "Productivity Cost", amount: inc.productivityCost, color: "#f59e0b" },
    { label: "Churn Risk", amount: inc.churnRisk, color: "#8b5cf6" },
  ];
  const maxAmt = Math.max(...breakdown.map(b => b.amount));

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: `${sc}25`, background: `${sc}04` }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase" style={{ background: `${sc}15`, color: sc }}>{inc.severity}</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: DS.surface, color: DS.text.muted }}>#{inc.id}</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: inc.status === "active" ? "rgba(239,68,68,0.1)" : "rgba(107,143,113,0.1)", color: inc.status === "active" ? "#ef4444" : "#6b8f71" }}>
              {inc.status === "active" ? "● ACTIVE" : "✓ RESOLVED"}
            </span>
          </div>
          <div className="text-[12px] font-semibold leading-tight mb-1" style={{ color: DS.text.primary }}>{inc.title}</div>
          <div className="flex items-center gap-3 text-[10px]" style={{ color: DS.text.muted }}>
            <span className="font-mono">{inc.service}</span>
            <span>·</span>
            <span>{fmtAgo(inc.startedAt)}</span>
            <span>·</span>
            <span>{fmtDuration(inc.durationMins)} duration</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[18px] font-bold font-mono" style={{ color: sc }}>{fmt$(inc.totalImpact)}</div>
          <div className="text-[9px] mt-0.5" style={{ color: trendColor }}>{trendLabel}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {breakdown.map(b => (
          <div key={b.label}>
            <div className="flex justify-between text-[9px] mb-1" style={{ color: DS.text.secondary }}>
              <span>{b.label}</span>
              <span className="font-mono" style={{ color: b.color }}>{fmt$(b.amount)}</span>
            </div>
            <ImpactBar value={b.amount} max={maxAmt} color={b.color} />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[9px]" style={{ color: DS.text.muted }}>
        <div className="flex items-center gap-1">
          <Users className="w-2.5 h-2.5" />
          <span>{inc.affectedClients} clients affected — {inc.clientNames[0]}, {inc.clientNames[1]}</span>
        </div>
        {inc.status === "active" && (
          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
            +{fmt$(Math.round(inc.totalImpact / inc.durationMins))}/min
          </span>
        )}
      </div>
    </div>
  );
}

function SummaryKPI({ label, value, sub, color, icon: Icon }: { label: string; value: string; sub: string; color: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] uppercase tracking-widest font-medium" style={{ color: DS.text.muted }}>{label}</span>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div className="text-[22px] font-bold font-mono" style={{ color }}>{value}</div>
      <div className="text-[9px] mt-1" style={{ color: DS.text.muted }}>{sub}</div>
    </div>
  );
}

export default function RevenueImpactPage() {
  const [incidents, setIncidents] = useState<IncidentImpact[]>(SEED_INCIDENTS);
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => {
      setIncidents(prev => prev.map(inc => {
        if (inc.status !== "active") return inc;
        const additionalMins = 0.5;
        const ratePerMin = inc.totalImpact / inc.durationMins;
        return {
          ...inc,
          durationMins: inc.durationMins + additionalMins,
          totalImpact: inc.totalImpact + ratePerMin * additionalMins,
          lostTransactions: inc.lostTransactions + (inc.lostTransactions / inc.durationMins) * additionalMins,
        };
      }));
      setLastRefresh(Date.now());
    }, 30000);
    return () => clearInterval(t);
  }, []);

  const filtered = incidents.filter(i => filter === "all" ? true : i.status === filter);
  const activeIncs = incidents.filter(i => i.status === "active");
  const totalActiveImpact = activeIncs.reduce((s, i) => s + i.totalImpact, 0);
  const totalTodayImpact = incidents.reduce((s, i) => s + i.totalImpact, 0);
  const maxSlaExposure = incidents.reduce((s, i) => s + i.slaExposure, 0);
  const totalChurnRisk = incidents.reduce((s, i) => s + i.churnRisk, 0);

  const categoryTotals: RevenueBreakdown[] = [
    { category: "transaction", label: "Lost Transactions", amount: incidents.reduce((s, i) => s + i.lostTransactions, 0), percentage: 0, color: "#ef4444", icon: TrendingDown },
    { category: "sla", label: "SLA Penalty Exposure", amount: incidents.reduce((s, i) => s + i.slaExposure, 0), percentage: 0, color: "#f97316", icon: Shield },
    { category: "productivity", label: "Productivity Cost", amount: incidents.reduce((s, i) => s + i.productivityCost, 0), percentage: 0, color: "#f59e0b", icon: Users },
    { category: "churn", label: "Customer Churn Risk", amount: incidents.reduce((s, i) => s + i.churnRisk, 0), percentage: 0, color: "#8b5cf6", icon: AlertTriangle },
  ];
  const grandTotal = categoryTotals.reduce((s, c) => s + c.amount, 0);
  categoryTotals.forEach(c => { c.percentage = Math.round((c.amount / grandTotal) * 100); });

  return (
    <div className="p-4 md:p-6 max-w-7xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4" style={{ color: GOLD }} />
            <h1 className="text-[15px] font-bold" style={{ color: DS.text.primary }}>Revenue Impact Engine</h1>
            <span className="text-[8px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider" style={{ background: "rgba(212,160,84,0.08)", color: GOLD, border: "1px solid rgba(212,160,84,0.15)" }}>LIVE</span>
          </div>
          <p className="text-[11px]" style={{ color: DS.text.muted }}>Every operational event — dollar-valued in real time. Lost transactions, SLA exposure, productivity cost, churn risk.</p>
        </div>
        <div className="flex items-center gap-1 text-[9px] shrink-0" style={{ color: DS.text.muted }}>
          <RefreshCw className="w-2.5 h-2.5" />
          <span>Updated {fmtAgo(lastRefresh)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryKPI label="Active Impact" value={fmt$(totalActiveImpact)} sub={`${activeIncs.length} active incidents`} color="#ef4444" icon={TrendingDown} />
        <SummaryKPI label="Today's Total" value={fmt$(totalTodayImpact)} sub="Across all incidents" color={GOLD} icon={DollarSign} />
        <SummaryKPI label="SLA Exposure" value={fmt$(maxSlaExposure)} sub="Penalty risk this period" color="#f97316" icon={Shield} />
        <SummaryKPI label="Churn Risk" value={fmt$(totalChurnRisk)} sub="Customer revenue at risk" color="#8b5cf6" icon={AlertTriangle} />
      </div>

      <div className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
        <div className="text-[10px] font-medium mb-3" style={{ color: DS.text.secondary }}>Impact Breakdown by Category</div>
        <div className="space-y-2.5">
          {categoryTotals.map(c => (
            <div key={c.category}>
              <div className="flex items-center justify-between text-[10px] mb-1">
                <div className="flex items-center gap-2">
                  <c.icon className="w-3 h-3" style={{ color: c.color }} />
                  <span style={{ color: DS.text.secondary }}>{c.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono" style={{ color: c.color }}>{fmt$(c.amount)}</span>
                  <span style={{ color: DS.text.muted }}>{c.percentage}%</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="h-full rounded-full" style={{ width: `${c.percentage}%`, background: c.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-semibold" style={{ color: DS.text.primary }}>Incident Impact Register</div>
          <div className="flex gap-1">
            {(["all", "active", "resolved"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className="text-[9px] px-2 py-1 rounded capitalize transition-all" style={{
                background: filter === f ? "rgba(212,160,84,0.12)" : DS.surface,
                color: filter === f ? GOLD : DS.text.muted,
                border: `1px solid ${filter === f ? "rgba(212,160,84,0.25)" : DS.border}`,
              }}>{f}</button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {filtered.map(inc => <IncidentCard key={inc.id} inc={inc} />)}
        </div>
      </div>

      <div className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
        <div className="text-[10px] font-medium mb-3" style={{ color: DS.text.secondary }}>Incident Cost Over Time (Last 24h)</div>
        <div className="relative h-24">
          <svg viewBox="0 0 400 80" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="impactGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,72 L20,70 L50,65 L80,68 L110,55 L140,60 L170,20 L200,35 L230,28 L260,40 L290,15 L320,25 L350,18 L380,8 L400,10 L400,80 L0,80 Z" fill="url(#impactGrad)" />
            <path d="M0,72 L20,70 L50,65 L80,68 L110,55 L140,60 L170,20 L200,35 L230,28 L260,40 L290,15 L320,25 L350,18 L380,8 L400,10" fill="none" stroke="#ef4444" strokeWidth="1.5" />
          </svg>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[8px] font-mono" style={{ color: DS.text.muted }}>
            {["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "Now"].map(t => <span key={t}>{t}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}
