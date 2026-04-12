import { WORKFLOWS, APPROVALS, EVENTS, KPI_FRAMEWORK, DRIFT_EVENTS, formatCurrency, getSeverityColor, getStateColor, type Severity } from "@szl-holdings/shared-ui/core-observability-data";
import { cn } from "@szl-holdings/shared-ui/utils";
import { AlertTriangle, Clock, DollarSign, TrendingUp, TrendingDown, ArrowRight, Zap, Eye, Activity, CloudRain, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

function KpiCard({ label, value, trend, unit, description }: { label: string; value: string; trend: number; unit?: string; description?: string }) {
  const up = trend > 0;
  const isGoodUp = label.includes("Recovered") || label.includes("Health") || label.includes("SLA") || label.includes("Resolved") || label.includes("Confidence") || label.includes("Success");
  const isPositive = isGoodUp ? up : !up;

  return (
    <div className="rounded-xl border p-4 flex flex-col gap-2" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
      <div className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="flex items-center gap-1.5">
        {up ? <TrendingUp className="w-3 h-3" style={{ color: isPositive ? "#10b981" : "#ef4444" }} /> : <TrendingDown className="w-3 h-3" style={{ color: isPositive ? "#10b981" : "#ef4444" }} />}
        <span className="text-[11px] font-medium" style={{ color: isPositive ? "#10b981" : "#ef4444" }}>{Math.abs(trend)}% {up ? "↑" : "↓"}</span>
        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>vs last period</span>
      </div>
      {description && <div className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>{description}</div>}
    </div>
  );
}

function CommandLoopPanel({ activePhase }: { activePhase: string }) {
  const phases = [
    { phase: "DETECT", color: "#0ea5e9", current: activePhase === "DETECT" },
    { phase: "INTERPRET", color: "#f59e0b", current: false, link: "/lyte-command-center/" },
    { phase: "DECIDE", color: "#8b5cf6", current: false, link: "/alloy/" },
    { phase: "EXECUTE", color: "#4B8BDB", current: false, link: "/alloy/" },
    { phase: "VERIFY", color: "#10b981", current: activePhase === "VERIFY" },
  ];

  return (
    <div className="rounded-xl border px-4 py-3 flex items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
      <span className="text-[9px] uppercase tracking-widest font-medium mr-2" style={{ color: "rgba(255,255,255,0.3)" }}>Command Loop</span>
      {phases.map((p, i) => (
        <div key={p.phase} className="flex items-center gap-2">
          {p.link ? (
            <a href={p.link} className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded transition-all hover:opacity-80" style={{
              color: p.current ? p.color : "rgba(255,255,255,0.3)",
              background: p.current ? `${p.color}20` : "transparent",
              border: `1px solid ${p.current ? p.color + "60" : "transparent"}`,
            }}>{p.phase}</a>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded" style={{
              color: p.current ? p.color : "rgba(255,255,255,0.3)",
              background: p.current ? `${p.color}20` : "transparent",
              border: `1px solid ${p.current ? p.color + "60" : "transparent"}`,
            }}>{p.phase}</span>
          )}
          {i < phases.length - 1 && <ArrowRight className="w-3 h-3" style={{ color: "rgba(255,255,255,0.15)" }} />}
        </div>
      ))}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const colors: Record<Severity, string> = {
    critical: "bg-red-500/15 text-red-400 border-red-500/30",
    high: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    low: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    info: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  };
  return (
    <span className={cn("text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border", colors[severity])}>{severity}</span>
  );
}

export default function ExecutiveOverview() {
  const kpi = KPI_FRAMEWORK.global;
  const blockedWorkflows = WORKFLOWS.filter(w => w.status === "blocked" || w.status === "escalated");
  const pendingApprovals = APPROVALS.filter(a => a.status === "pending" || a.status === "escalated");
  const criticalEvents = EVENTS.filter(e => e.severity === "critical" || e.severity === "high").slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-4 h-4" style={{ color: "#0ea5e9" }} />
            <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#0ea5e9" }}>Beacon · Executive Overview</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Business Observability Command</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>What the business is doing, what's degraded, and where value is at risk — right now.</p>
        </div>
        <div className="text-right text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          <div>{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
          <div className="flex items-center gap-1 justify-end mt-1">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-sky-400" />
            <span>Live</span>
          </div>
        </div>
      </div>

      <CommandLoopPanel activePhase="DETECT" />

      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(kpi).map(([key, data]) => (
          <KpiCard key={key} label={data.label} value={data.value} trend={data.trend} description={data.description} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: "#ef4444" }} />
              <span className="text-sm font-semibold text-white">Blocked Workflows</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>{blockedWorkflows.length}</span>
            </div>
            <a href="/workflow-health" className="text-xs hover:text-white transition-colors" style={{ color: "#0ea5e9" }}>View all →</a>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {blockedWorkflows.map(w => (
              <div key={w.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-white truncate">{w.name}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {w.blocked_step ?? "Degraded"} · {w.owner || "Unassigned"}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-medium" style={{ color: "#f59e0b" }}>{formatCurrency(w.value_at_risk)}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase" style={{
                    color: getStateColor(w.status),
                    background: `${getStateColor(w.status)}15`,
                    border: `1px solid ${getStateColor(w.status)}30`,
                  }}>{w.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: "#f97316" }} />
              <span className="text-sm font-semibold text-white">Aging Approvals</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "rgba(249,115,22,0.15)", color: "#f97316" }}>{pendingApprovals.length}</span>
            </div>
            <a href="/lyte-command-center/" className="text-xs hover:text-white transition-colors" style={{ color: "#f59e0b" }}>Open in Lyte →</a>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {pendingApprovals.map(a => (
              <div key={a.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-white truncate">{a.title}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {a.owner || "Unassigned"} · {a.team}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px]" style={{ color: a.age_hours > 48 ? "#ef4444" : a.age_hours > 24 ? "#f97316" : "#f59e0b" }}>{a.age_hours}h old</span>
                  <span className="text-[10px] font-medium" style={{ color: "#10b981" }}>{formatCurrency(a.impact_estimate)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: "#0ea5e9" }} />
            <span className="text-sm font-semibold text-white">Recent Signals & Events</span>
          </div>
          <a href="/drift-detection" className="text-xs hover:text-white transition-colors" style={{ color: "#0ea5e9" }}>View drift events →</a>
        </div>
        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          {criticalEvents.map(e => (
            <div key={e.event_id} className="px-5 py-3 flex items-center gap-4">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: getSeverityColor(e.severity) }} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white">{e.entity_name}</div>
                <div className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{e.event_type.replace(/_/g, " ")} · {e.actor_name}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <SeverityBadge severity={e.severity} />
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{new Date(e.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <LivingValuationsPanel />

      <div className="rounded-xl border p-5" style={{ borderColor: "rgba(14,165,233,0.2)", background: "rgba(14,165,233,0.04)" }}>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4" style={{ color: "#0ea5e9" }} />
          <span className="text-sm font-semibold text-white">Golden Flow Demo — Active Scenario</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ml-2" style={{ color: "#0ea5e9", background: "rgba(14,165,233,0.15)", border: "1px solid rgba(14,165,233,0.3)" }}>LIVE TRACE</span>
        </div>
        <p className="text-xs leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
          Beacon detected approval SLA breach on Northgate contract → Lyte routed accountability to Revenue Operations → Alloy predicted Q1 revenue miss → Alloy rerouted workflow to CFO backup → Beacon verifying recovery.
        </p>
        <div className="flex gap-2">
          {[
            { label: "DETECT", desc: "Beacon saw it", color: "#0ea5e9", active: true },
            { label: "INTERPRET", desc: "Lyte routed it", color: "#f59e0b", active: true },
            { label: "DECIDE", desc: "Alloy modeled it", color: "#8b5cf6", active: true },
            { label: "EXECUTE", desc: "Alloy ran it", color: "#4B8BDB", active: true },
            { label: "VERIFY", desc: "Beacon confirms", color: "#10b981", active: false },
          ].map(p => (
            <div key={p.label} className="flex-1 rounded-lg p-2.5 text-center" style={{ background: p.active ? `${p.color}10` : "rgba(255,255,255,0.02)", border: `1px solid ${p.active ? p.color + "30" : "rgba(255,255,255,0.06)"}` }}>
              <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: p.active ? p.color : "rgba(255,255,255,0.2)" }}>{p.label}</div>
              <div className="text-[9px]" style={{ color: p.active ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)" }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type TerraValuationProperty = {
  property_id: string;
  address: string;
  current_valuation: number;
  previous_valuation: number;
  valuation_delta_pct: number;
  confidence_score: number;
  risk_tier: string;
};

function LivingValuationsPanel() {
  const valuations = useQuery({
    queryKey: ["terra-living-valuations"],
    queryFn: async () => {
      const res = await fetch("/api/terra/living-valuations");
      if (!res.ok) throw new Error("fetch failed");
      return res.json() as Promise<{ properties: TerraValuationProperty[]; totalCount: number; source: string; updatedAt: string }>;
    },
    staleTime: 30000,
    retry: false,
  });

  const [tab, setTab] = useState<"values" | "risk">("values");
  const data = valuations.data;

  const totalVal = data
    ? data.properties.reduce((s, p) => s + Number(p.current_valuation), 0)
    : 0;

  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "rgba(14,165,233,0.2)", background: "rgba(14,165,233,0.03)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4" style={{ color: "#0ea5e9" }} />
          <span className="text-sm font-semibold text-white">Living Valuations · 2026</span>
          <span className="text-[8px] px-1.5 py-0.5 rounded font-mono uppercase" style={{ background: "rgba(14,165,233,0.1)", color: "#0ea5e9", border: "1px solid rgba(14,165,233,0.2)" }}>Real-Time</span>
        </div>
        <div className="flex gap-1">
          {(["values", "risk"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className="text-[9px] px-2 py-0.5 rounded transition-colors" style={{ background: tab === t ? "rgba(14,165,233,0.15)" : "rgba(255,255,255,0.04)", color: tab === t ? "#0ea5e9" : "rgba(255,255,255,0.4)", border: `1px solid ${tab === t ? "rgba(14,165,233,0.3)" : "rgba(255,255,255,0.06)"}` }}>
              {t === "values" ? "Live Values" : "Risk Tier"}
            </button>
          ))}
        </div>
      </div>

      {data && totalVal > 0 && (
        <div className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
          Portfolio: <span className="font-mono font-semibold text-white">${(totalVal / 1e6).toFixed(1)}M</span>
          <span className="ml-2 text-[8px]" style={{ color: "rgba(255,255,255,0.3)" }}>{data.source} · {data.totalCount} properties</span>
        </div>
      )}

      <div className="space-y-1.5">
        {data ? (
          data.properties.slice(0, 4).map(p => (
            <div key={p.property_id} className="flex items-center gap-2 py-1">
              {tab === "values" ? (
                <>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: Number(p.valuation_delta_pct) >= 0 ? "#10b981" : "#ef4444" }} />
                  <span className="text-[10px] flex-1 truncate" style={{ color: "rgba(255,255,255,0.7)" }}>{p.address}</span>
                  <span className="text-[9px] font-mono font-semibold" style={{ color: Number(p.valuation_delta_pct) >= 0 ? "#10b981" : "#ef4444" }}>{Number(p.valuation_delta_pct) >= 0 ? "+" : ""}{Number(p.valuation_delta_pct).toFixed(2)}%</span>
                  <span className="text-[8px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>${(Number(p.current_valuation) / 1e6).toFixed(1)}M</span>
                </>
              ) : (
                <>
                  <CloudRain className="w-2.5 h-2.5 shrink-0" style={{ color: p.risk_tier === "critical" ? "#ef4444" : p.risk_tier === "high" ? "#f97316" : "#10b981" }} />
                  <span className="text-[10px] flex-1 truncate" style={{ color: "rgba(255,255,255,0.7)" }}>{p.address}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: p.risk_tier === "critical" ? "rgba(239,68,68,0.1)" : p.risk_tier === "high" ? "rgba(249,115,22,0.1)" : "rgba(245,158,11,0.1)", color: p.risk_tier === "critical" ? "#ef4444" : p.risk_tier === "high" ? "#f97316" : "#f59e0b" }}>{p.risk_tier}</span>
                  <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.35)" }}>{Number(p.confidence_score * 100).toFixed(0)}% conf</span>
                </>
              )}
            </div>
          ))
        ) : (
          <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{valuations.isLoading ? "Loading portfolio..." : "No valuation data available"}</div>
        )}
      </div>
    </div>
  );
}
