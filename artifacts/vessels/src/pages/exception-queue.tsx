import { useState } from "react";
import { AlertTriangle, Anchor, Shield, Clock, User, CheckCircle, ArrowUpRight } from "lucide-react";
import { EmptyState } from "@szl-holdings/shared-ui/EmptyState";
import { useFleetExceptions } from "@/hooks/use-vessels-data";

type FleetException = ReturnType<typeof useFleetExceptions>["fleetExceptions"][number];

const ACCENT = "hsl(205 70% 50%)";

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const SEVERITY_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  critical: { color: "#f87171", bg: "#9b1c1c08", border: "#9b1c1c35" },
  high: { color: "#c04a2a", bg: "#c04a2a08", border: "#c04a2a25" },
  medium: { color: "#c08a2c", bg: "#c08a2c08", border: "#c08a2c20" },
  low: { color: "rgba(255,255,255,0.45)", bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.06)" },
};

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  open: { color: "#c04a2a", bg: "#c04a2a20" },
  investigating: { color: "#c08a2c", bg: "#c08a2c20" },
  resolved: { color: "#40856a", bg: "#40856a20" },
  escalated: { color: "#a855f7", bg: "#a855f720" },
};

const TYPE_LABELS: Record<string, string> = {
  ais_gap: "AIS Gap",
  route_deviation: "Route Deviation",
  sanctions_exposure: "Sanctions Exposure",
  psc_deficiency: "PSC Deficiency",
  cert_expired: "Certificate Expired",
  port_detention: "Port Detention",
  weather_diversion: "Weather Diversion",
  cargo_discrepancy: "Cargo Discrepancy",
};

function ExceptionCard({ exc, onResolve }: { exc: FleetException; onResolve: (id: string) => void }) {
  const ss = SEVERITY_STYLE[exc.severity];
  const ts = STATUS_STYLE[exc.status];
  return (
    <div className="rounded-xl border p-4" style={{ background: ss.bg, borderColor: ss.border }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} style={{ color: ss.color, flexShrink: 0 }} />
          <div>
            <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
              {TYPE_LABELS[exc.type] ?? exc.type.replace(/_/g, " ")}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{exc.vesselName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: ts.bg, color: ts.color }}>
            {exc.status}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>
            {exc.severity}
          </span>
        </div>
      </div>
      <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.55)" }}>{exc.description}</p>
      <div className="flex items-center gap-3 text-xs mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
        <span className="flex items-center gap-1"><Clock size={10} />Detected {relTime(exc.detectedAt)}</span>
        {exc.owner && exc.owner !== "—" && <span className="flex items-center gap-1"><User size={10} />{exc.owner}</span>}
      </div>
      {exc.status !== "resolved" && (
        <div className="flex gap-2">
          <button
            onClick={() => onResolve(exc.id)}
            className="text-xs px-3 py-1 rounded-md font-medium"
            style={{ background: "hsl(205 70% 38%)", color: "white" }}
          >
            <CheckCircle size={12} className="inline mr-1" />
            Resolve
          </button>
          <button className="text-xs px-3 py-1 rounded-md hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
            Escalate
          </button>
        </div>
      )}
    </div>
  );
}

export default function ExceptionQueue() {
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("open");

  const { fleetExceptions } = useFleetExceptions();

  const exceptions = fleetExceptions.map((e: FleetException) => ({
    ...e,
    status: resolved.has(e.id) ? ("resolved" as const) : e.status,
  }));

  const displayed = exceptions.filter((e: FleetException) =>
    filter === "all" || (filter === "open" && e.status !== "resolved") || e.status === filter
  );

  const openCount = exceptions.filter((e: FleetException) => e.status !== "resolved").length;
  const criticalCount = exceptions.filter((e: FleetException) => e.severity === "critical" && e.status !== "resolved").length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.95)" }}>Exception Queue</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
            Fleet-wide exception management — AIS gaps, deviations, detentions, cert issues
          </p>
        </div>
        {criticalCount > 0 && (
          <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium"
            style={{ background: "#9b1c1c20", color: "#f87171", border: "1px solid #9b1c1c40" }}>
            <AlertTriangle size={12} />
            {criticalCount} critical
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Open", value: openCount, color: "#c04a2a" },
          { label: "Critical", value: criticalCount, color: "#f87171" },
          { label: "Acknowledged", value: exceptions.filter((e: FleetException) => e.status === "acknowledged").length, color: "#c08a2c" },
          { label: "Resolved", value: exceptions.filter(e => e.status === "resolved").length, color: "#40856a" },
        ].map(m => (
          <div key={m.label} className="rounded-xl border p-4" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{m.label}</div>
            <div className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-5">
        {["open", "investigating", "resolved", "all"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="text-xs px-3 py-1 rounded-lg capitalize transition-colors"
            style={{
              background: filter === f ? "hsl(205 70% 38% / 0.15)" : "rgba(255,255,255,0.04)",
              color: filter === f ? ACCENT : "rgba(255,255,255,0.4)",
              border: `1px solid ${filter === f ? "hsl(205 70% 38% / 0.35)" : "rgba(255,255,255,0.06)"}`,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {displayed.length === 0 ? (
          <EmptyState icon={CheckCircle} headline="No exceptions" description="No exceptions match the current filter." accentColor={ACCENT} />
        ) : (
          displayed.map(e => (
            <ExceptionCard key={e.id} exc={e} onResolve={id => setResolved(prev => new Set([...prev, id]))} />
          ))
        )}
      </div>
    </div>
  );
}
