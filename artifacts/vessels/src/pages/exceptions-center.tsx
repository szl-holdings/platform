import { useState } from "react";
import { vesselsDomainMockData, type FleetException, type ExceptionType, type ExceptionSeverity } from "@/data/mock-data";
import { Badge } from "@workspace/shared-ui/ui/badge";
import {
  AlertTriangle, Clock, DollarSign, User, ChevronDown, ChevronRight,
  CheckCircle2, Eye, Filter, Ship, TrendingDown, CloudLightning, Anchor, Wrench, Fuel, Navigation, Radio
} from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";

const { fleetExceptions } = vesselsDomainMockData;

const severityConfig: Record<ExceptionSeverity, { label: string; color: string; dot: string; badgeColor: string }> = {
  critical: { label: "Critical", color: "text-red-400", dot: "bg-red-400", badgeColor: "text-red-400 bg-red-500/10 border-red-500/20" },
  high: { label: "High", color: "text-orange-400", dot: "bg-orange-400", badgeColor: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  watch: { label: "Watch", color: "text-amber-400", dot: "bg-amber-400", badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  normal: { label: "Normal", color: "text-emerald-400", dot: "bg-emerald-400", badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
};

const typeConfig: Record<ExceptionType, { label: string; icon: React.ElementType }> = {
  route_deviation: { label: "Route Deviation", icon: Navigation },
  delay_risk: { label: "Delay Risk", icon: Clock },
  port_congestion: { label: "Port Congestion", icon: Anchor },
  weather_disruption: { label: "Weather Disruption", icon: CloudLightning },
  maintenance_risk: { label: "Maintenance Risk", icon: Wrench },
  fuel_anomaly: { label: "Fuel Anomaly", icon: Fuel },
  schedule_variance: { label: "Schedule Variance", icon: Radio },
  security_alert: { label: "Security Alert", icon: AlertTriangle },
};

const statusConfig = {
  active: { label: "Active", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  acknowledged: { label: "Acknowledged", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  resolved: { label: "Resolved", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
};

function ExceptionCard({ exc }: { exc: FleetException }) {
  const [expanded, setExpanded] = useState(exc.severity === "critical");
  const sev = severityConfig[exc.severity];
  const type = typeConfig[exc.type];
  const TypeIcon = type.icon;
  const stat = statusConfig[exc.status];
  const isPositive = exc.estimatedImpactUSD < 0;

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
            <span className="flex items-center gap-1"><Ship className="w-2.5 h-2.5" />{exc.vesselName}</span>
            <span className="text-sky-400/30">·</span>
            <span className="truncate">{exc.route}</span>
            <span className={cn("ml-auto font-mono shrink-0", isPositive ? "text-emerald-400" : "text-amber-400")}>
              {isPositive ? "+" : ""}${(Math.abs(exc.estimatedImpactUSD) / 1000).toFixed(0)}K {isPositive ? "opportunity" : "exposure"}
            </span>
          </div>
        </div>

        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-sky-400/40 shrink-0 mt-0.5" /> : <ChevronRight className="w-3.5 h-3.5 text-sky-400/40 shrink-0 mt-0.5" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-sky-500/10 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <div className="bg-sky-500/5 rounded-lg p-3 border border-sky-500/10">
                <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-1.5">What Happened</p>
                <p className="text-[11px] text-sky-200/80">{exc.description}</p>
              </div>
              <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/10">
                <p className="text-[9px] text-amber-400/60 uppercase tracking-wider mb-1.5">Why It Matters</p>
                <p className="text-[11px] text-sky-200/80">{exc.whyItMatters}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="bg-sky-500/5 rounded-lg p-3 border border-sky-500/10">
                <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-1.5">Recommended Response</p>
                <p className="text-[11px] text-sky-200/80">{exc.recommendedResponse}</p>
              </div>
              <div className={cn("rounded-lg p-3 border", exc.estimatedImpactUSD < 0 ? "bg-emerald-500/5 border-emerald-500/10" : "bg-red-500/5 border-red-500/10")}>
                <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-1.5">Business Consequence</p>
                <p className="text-[11px] text-sky-200/80">{exc.businessConsequence}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-1 border-t border-sky-500/10 text-[10px] text-sky-400/40">
            <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" />{exc.owner} · {exc.ownerFunction}</span>
            <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />Detected {new Date(exc.detectedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} UTC</span>
            <Badge variant="outline" className="text-[9px] text-sky-400/50 border-sky-500/20 ml-auto">{type.label}</Badge>
          </div>
        </div>
      )}
    </div>
  );
}

type StatusFilter = "all" | "active" | "acknowledged" | "resolved";
type SeverityFilter = "all" | ExceptionSeverity;

export default function ExceptionsCenterPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");

  const filtered = fleetExceptions.filter(e => {
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    if (severityFilter !== "all" && e.severity !== severityFilter) return false;
    return true;
  }).sort((a, b) => {
    const order: Record<ExceptionSeverity, number> = { critical: 0, high: 1, watch: 2, normal: 3 };
    return order[a.severity] - order[b.severity];
  });

  const totalExposure = fleetExceptions.filter(e => e.status !== "resolved" && e.estimatedImpactUSD > 0).reduce((a, e) => a + e.estimatedImpactUSD, 0);
  const criticalCount = fleetExceptions.filter(e => e.severity === "critical" && e.status === "active").length;
  const activeCount = fleetExceptions.filter(e => e.status === "active").length;
  const ackCount = fleetExceptions.filter(e => e.status === "acknowledged").length;

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
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active", value: activeCount, color: "text-red-400" },
          { label: "Acknowledged", value: ackCount, color: "text-amber-400" },
          { label: "Critical", value: criticalCount, color: "text-red-400" },
          { label: "Total Exposure", value: `$${(totalExposure / 1000).toFixed(0)}K`, color: "text-orange-400" },
        ].map(s => (
          <div key={s.label} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4 text-center">
            <p className={cn("text-2xl font-bold font-display", s.color)}>{s.value}</p>
            <p className="text-[10px] text-sky-400/40 uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
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
        <span className="ml-auto text-[10px] text-sky-400/40">{filtered.length} exceptions</span>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400/20 mx-auto mb-3" />
            <p className="text-sm text-sky-400/40">No exceptions match current filters</p>
          </div>
        ) : (
          filtered.map(exc => <ExceptionCard key={exc.id} exc={exc} />)
        )}
      </div>
    </div>
  );
}
