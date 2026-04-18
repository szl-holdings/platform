import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@szl-holdings/shared-ui/api-fetch";
import { EmptyState } from "@szl-holdings/shared-ui/design-system";
import { Badge } from "@szl-holdings/shared-ui/ui/badge";
import {
  AlertTriangle, Clock, User, ChevronDown, ChevronRight,
  CheckCircle2, Ship, CloudLightning, Anchor, Wrench, Fuel, Navigation, Radio,
  RefreshCw, CheckCheck, ArrowUpCircle,
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import {
  OperationalOwnerChip,
  OperationalStatusBadge,
  OperationalRiskBadge,
  severityToRiskLevel,
} from "@szl-holdings/shared-ui/operational-primitives";

export type ExceptionSeverity = "critical" | "high" | "watch" | "normal" | "medium" | "low";
export type ExceptionType = "route_deviation" | "delay_risk" | "port_congestion" | "weather_disruption" | "maintenance_risk" | "fuel_anomaly" | "schedule_variance" | "security_alert";

export interface VesselsException {
  id: number;
  orgId: number;
  vesselId?: number | null;
  vesselName?: string | null;
  exceptionType: string;
  severity: string;
  status: string;
  title: string;
  description?: string | null;
  whyItMatters?: string | null;
  recommendedResponse?: string | null;
  businessConsequence?: string | null;
  route?: string | null;
  estimatedImpactUSD?: number | null;
  owner?: string | null;
  ownerFunction?: string | null;
  detectedAt: string;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  acknowledgedBy?: number | null;
  metadata?: Record<string, unknown> | null;
}

const severityConfig: Record<string, { label: string; color: string; dot: string; badgeColor: string }> = {
  critical: { label: "Critical", color: "text-red-400", dot: "bg-red-400", badgeColor: "text-red-400 bg-red-500/10 border-red-500/20" },
  high: { label: "High", color: "text-orange-400", dot: "bg-orange-400", badgeColor: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  watch: { label: "Watch", color: "text-amber-400", dot: "bg-amber-400", badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  medium: { label: "Medium", color: "text-amber-400", dot: "bg-amber-400", badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  low: { label: "Low", color: "text-blue-400", dot: "bg-blue-400", badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  normal: { label: "Normal", color: "text-emerald-400", dot: "bg-emerald-400", badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
};

const typeConfig: Record<string, { label: string; icon: React.ElementType }> = {
  route_deviation: { label: "Route Deviation", icon: Navigation },
  delay_risk: { label: "Delay Risk", icon: Clock },
  port_congestion: { label: "Port Congestion", icon: Anchor },
  weather_disruption: { label: "Weather Disruption", icon: CloudLightning },
  maintenance_risk: { label: "Maintenance Risk", icon: Wrench },
  fuel_anomaly: { label: "Fuel Anomaly", icon: Fuel },
  schedule_variance: { label: "Schedule Variance", icon: Radio },
  security_alert: { label: "Security Alert", icon: AlertTriangle },
  ais_dark: { label: "AIS Dark Event", icon: Radio },
  sanctions_match: { label: "Sanctions Match", icon: AlertTriangle },
  overdue_arrival: { label: "Overdue Arrival", icon: Clock },
  inspection_failure: { label: "Inspection Failure", icon: Wrench },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  acknowledged: { label: "Acknowledged", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  resolved: { label: "Resolved", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  dismissed: { label: "Dismissed", color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
};

function useExceptions(status?: string, severity?: string) {
  return useQuery({
    queryKey: ["vesselExceptions", status, severity],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status && status !== "all") params.set("status", status);
      if (severity && severity !== "all") params.set("severity", severity);
      const qs = params.toString();
      const resp = await apiFetch<VesselsException[] | { data: VesselsException[] }>(
        `/vessels/exceptions${qs ? `?${qs}` : ""}`
      );
      if (resp && typeof resp === "object" && "data" in resp) return resp.data;
      return resp as VesselsException[];
    },
    refetchInterval: 60_000,
  });
}

function useAcknowledgeException() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) =>
      apiFetch<VesselsException>(`/vessels/exceptions/${id}/acknowledge`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ["vesselExceptions"] });
      const previous = qc.getQueriesData({ queryKey: ["vesselExceptions"] });
      qc.setQueriesData({ queryKey: ["vesselExceptions"] }, (old: VesselsException[] | undefined) =>
        old ? old.map(e => e.id === id ? { ...e, status: "acknowledged" } : e) : old
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      context?.previous?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vesselExceptions"] }),
  });
}

function useEscalateException() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) =>
      apiFetch<VesselsException>(`/vessels/exceptions/${id}/escalate`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vesselExceptions"] }),
  });
}

function useResolveException() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) =>
      apiFetch<VesselsException>(`/vessels/exceptions/${id}/resolve`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: ["vesselExceptions"] });
      const previous = qc.getQueriesData({ queryKey: ["vesselExceptions"] });
      qc.setQueriesData({ queryKey: ["vesselExceptions"] }, (old: VesselsException[] | undefined) =>
        old ? old.map(e => e.id === id ? { ...e, status: "resolved" } : e) : old
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      context?.previous?.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vesselExceptions"] }),
  });
}

function ExceptionCard({
  exc,
  onAcknowledge,
  onEscalate,
  onResolve,
}: {
  exc: VesselsException;
  onAcknowledge: (id: number) => void;
  onEscalate: (id: number) => void;
  onResolve: (id: number, notes: string) => void;
}) {
  const [expanded, setExpanded] = useState(exc.severity === "critical");
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const sev = severityConfig[exc.severity] ?? severityConfig.watch;
  const type = typeConfig[exc.exceptionType] ?? { label: exc.exceptionType, icon: AlertTriangle };
  const TypeIcon = type.icon;
  const stat = statusConfig[exc.status] ?? statusConfig.active;
  const impact = exc.estimatedImpactUSD ?? 0;
  const isPositive = impact < 0;

  const handleAction = async (fn: () => void, key: string) => {
    setActionLoading(key);
    try { fn(); } finally { setActionLoading(null); }
  };

  return (
    <div className={cn(
      "bg-[#0a1628]/80 border rounded-xl overflow-hidden transition-all",
      exc.severity === "critical" ? "border-red-500/20" : exc.severity === "high" ? "border-orange-500/15" : "border-sky-500/10"
    )}>
      <button
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-sky-500/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 mt-0.5 shrink-0">
          <span className={cn("w-2 h-2 rounded-full shrink-0", sev.dot, exc.status === "active" && exc.severity === "critical" && "animate-pulse")} />
          <TypeIcon className={cn("w-3.5 h-3.5", sev.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <p className="text-xs font-semibold text-sky-100">{exc.title}</p>
            <div className="flex items-center gap-1.5 flex-wrap ml-auto">
              <Badge variant="outline" className={cn("text-[9px] shrink-0", sev.badgeColor)}>{sev.label}</Badge>
              <Badge variant="outline" className={cn("text-[9px] shrink-0", stat.color)}>{stat.label}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-sky-400/50">
            {exc.vesselName && <span className="flex items-center gap-1"><Ship className="w-2.5 h-2.5" />{exc.vesselName}</span>}
            {exc.route && <><span className="text-sky-400/30">·</span><span className="truncate">{exc.route}</span></>}
            {Math.abs(impact) > 0 && (
              <span className={cn("ml-auto font-mono shrink-0", isPositive ? "text-emerald-400" : "text-amber-400")}>
                {isPositive ? "+" : ""}${(Math.abs(impact) / 1000).toFixed(0)}K {isPositive ? "opportunity" : "exposure"}
              </span>
            )}
          </div>
        </div>

        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-sky-400/40 shrink-0 mt-0.5" /> : <ChevronRight className="w-3.5 h-3.5 text-sky-400/40 shrink-0 mt-0.5" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-sky-500/10 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              {exc.description && (
                <div className="bg-sky-500/5 rounded-lg p-3 border border-sky-500/10">
                  <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-1.5">What Happened</p>
                  <p className="text-[11px] text-sky-200/80">{exc.description}</p>
                </div>
              )}
              {exc.whyItMatters && (
                <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/10">
                  <p className="text-[9px] text-amber-400/60 uppercase tracking-wider mb-1.5">Why It Matters</p>
                  <p className="text-[11px] text-sky-200/80">{exc.whyItMatters}</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {exc.recommendedResponse && (
                <div className="bg-sky-500/5 rounded-lg p-3 border border-sky-500/10">
                  <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-1.5">Recommended Response</p>
                  <p className="text-[11px] text-sky-200/80">{exc.recommendedResponse}</p>
                </div>
              )}
              {exc.businessConsequence && (
                <div className={cn("rounded-lg p-3 border", impact < 0 ? "bg-emerald-500/5 border-emerald-500/10" : "bg-red-500/5 border-red-500/10")}>
                  <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-1.5">Business Consequence</p>
                  <p className="text-[11px] text-sky-200/80">{exc.businessConsequence}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-1 border-t border-sky-500/10">
            <OperationalOwnerChip
              owner={exc.owner ? { name: exc.owner, role: exc.ownerFunction ?? undefined } : undefined}
              size="xs"
              unassignedLabel="No owner assigned"
            />
            <OperationalRiskBadge level={severityToRiskLevel(exc.severity)} size="xs" />
            <span className="flex items-center gap-1 text-[9px] text-sky-400/40"><Clock className="w-2.5 h-2.5" />Detected {new Date(exc.detectedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} UTC</span>
            <Badge variant="outline" className="text-[9px] text-sky-400/50 border-sky-500/20 ml-auto">{type.label}</Badge>
          </div>

          {exc.status !== "resolved" && exc.status !== "dismissed" && (
            <div className="flex items-center gap-2 pt-2 border-t border-sky-500/10">
              {exc.status === "active" && (
                <button
                  disabled={actionLoading === "ack"}
                  onClick={() => handleAction(() => onAcknowledge(exc.id), "ack")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 transition-all disabled:opacity-50"
                >
                  {actionLoading === "ack" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                  Acknowledge
                </button>
              )}
              <button
                disabled={actionLoading === "escalate"}
                onClick={() => handleAction(() => onEscalate(exc.id), "escalate")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-orange-500/10 border border-orange-500/20 text-orange-300 hover:bg-orange-500/20 transition-all disabled:opacity-50"
              >
                {actionLoading === "escalate" ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ArrowUpCircle className="w-3 h-3" />}
                Escalate
              </button>
              <button
                onClick={() => setShowResolveForm(!showResolveForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 transition-all"
              >
                <CheckCheck className="w-3 h-3" />
                Mark Resolved
              </button>
            </div>
          )}

          {showResolveForm && (
            <div className="flex items-center gap-2 pt-1">
              <input
                value={resolutionNote}
                onChange={e => setResolutionNote(e.target.value)}
                placeholder="Resolution notes (required)..."
                className="flex-1 text-[11px] bg-sky-500/5 border border-sky-500/15 rounded-lg px-3 py-2 text-sky-100 placeholder-sky-400/30 outline-none focus:border-sky-500/40"
              />
              <button
                disabled={!resolutionNote.trim() || actionLoading === "resolve"}
                onClick={() => {
                  setShowResolveForm(false);
                  handleAction(() => onResolve(exc.id, resolutionNote), "resolve");
                }}
                className="px-3 py-2 rounded-lg text-[11px] font-medium bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/25 transition-all disabled:opacity-40"
              >
                {actionLoading === "resolve" ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Confirm"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type StatusFilter = "all" | "active" | "acknowledged" | "resolved";
type SeverityFilter = "all" | string;

export default function ExceptionsCenterPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");

  const { data: exceptions = [], isLoading, isError, refetch } = useExceptions(
    statusFilter !== "all" ? statusFilter : undefined,
    severityFilter !== "all" ? severityFilter : undefined,
  );
  const acknowledgeExc = useAcknowledgeException();
  const escalateExc = useEscalateException();
  const resolveExc = useResolveException();

  const filtered = exceptions.slice().sort((a, b) => {
    const order: Record<string, number> = { critical: 0, high: 1, watch: 2, medium: 2, normal: 3, low: 3 };
    return (order[a.severity] ?? 9) - (order[b.severity] ?? 9);
  });

  const totalExposure = exceptions
    .filter(e => e.status !== "resolved" && (e.estimatedImpactUSD ?? 0) > 0)
    .reduce((a, e) => a + (e.estimatedImpactUSD ?? 0), 0);
  const criticalCount = exceptions.filter(e => e.severity === "critical" && e.status === "active").length;
  const activeCount = exceptions.filter(e => e.status === "active").length;
  const ackCount = exceptions.filter(e => e.status === "acknowledged").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-sky-50">Exceptions Center</h1>
          <p className="text-xs text-sky-400/50 mt-0.5">Prioritized operational exception queue — all vessels, all routes</p>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span className="text-xs font-medium text-red-400">{criticalCount} critical</span>
            </div>
          )}
          <button onClick={() => refetch()} className="p-2 rounded-lg border border-sky-500/15 text-sky-400/50 hover:text-sky-300 hover:border-sky-500/30 transition-all">
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active", value: isLoading ? "—" : activeCount, color: "text-red-400" },
          { label: "Acknowledged", value: isLoading ? "—" : ackCount, color: "text-amber-400" },
          { label: "Critical", value: isLoading ? "—" : criticalCount, color: "text-red-400" },
          { label: "Total Exposure", value: isLoading ? "—" : `$${(totalExposure / 1000).toFixed(0)}K`, color: "text-orange-400" },
        ].map(s => (
          <div key={s.label} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4 text-center">
            <p className={cn("text-2xl font-bold font-display", s.color)}>{s.value}</p>
            <p className="text-[10px] text-sky-400/40 uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-sky-400/40 mr-2">Status:</span>
          {(["all", "active", "acknowledged", "resolved"] as StatusFilter[]).map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} className={cn("text-[10px] px-2.5 py-1.5 rounded-lg border transition-all capitalize", statusFilter === f ? "bg-sky-500/10 border-sky-500/30 text-sky-300" : "border-sky-500/10 text-sky-400/40 hover:text-sky-300")}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-sky-400/40 mr-2">Severity:</span>
          {(["all", "critical", "high", "watch", "normal"] as SeverityFilter[]).map(f => (
            <button key={f} onClick={() => setSeverityFilter(f)} className={cn("text-[10px] px-2.5 py-1.5 rounded-lg border transition-all capitalize", severityFilter === f ? "bg-sky-500/10 border-sky-500/30 text-sky-300" : "border-sky-500/10 text-sky-400/40 hover:text-sky-300")}>
              {f}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[10px] text-sky-400/40">{filtered.length} exceptions shown</span>
      </div>

      {isError && (
        <div className="py-8 text-center rounded-xl border border-red-500/15 bg-red-500/5">
          <AlertTriangle className="w-8 h-8 text-red-400/40 mx-auto mb-2" />
          <p className="text-sm text-red-400/70">Failed to load exceptions — <button onClick={() => refetch()} className="underline">retry</button></p>
        </div>
      )}

      {isLoading && !isError && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-xl border border-sky-500/10 bg-sky-500/5 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              headline="Exception queue is clear"
              description="Every voyage, port call, and charter parameter is operating within tolerance. New exceptions raised by the rules engine or operator escalation will appear here for triage."
              accentColor="#10b981"
            />
          ) : (
            filtered.map(exc => (
              <ExceptionCard
                key={exc.id}
                exc={exc}
                onAcknowledge={id => acknowledgeExc.mutate({ id })}
                onEscalate={id => escalateExc.mutate({ id, notes: "Escalated via command center" })}
                onResolve={(id, notes) => resolveExc.mutate({ id, notes })}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
