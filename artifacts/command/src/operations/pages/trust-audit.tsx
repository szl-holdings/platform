import { useState } from "react";
import { Shield, Clock, User, Filter, Activity, CheckCircle2, AlertTriangle, Eye } from "lucide-react";

const BG = { page: "#080c14", surface: "#0c1018", elevated: "#10141e" };
const BORDER = { subtle: "rgba(255,255,255,0.04)", muted: "rgba(255,255,255,0.06)" };
const TEXT = { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.55)", tertiary: "rgba(255,255,255,0.28)", muted: "rgba(255,255,255,0.14)" };
const ELECTRIC = "#2dd4bf";

interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  pack: string;
  packColor: string;
  outcome: "success" | "denied" | "warning";
  details: string;
}

const AUDIT_EVENTS: AuditEvent[] = [
  { id: "AUD-8821", timestamp: "Today · 11:42 AM", actor: "Stephen Lutar", actorRole: "exec", action: "approve_workflow", resourceType: "workflow_run", resourceId: "WF-3041", pack: "PRISM", packColor: "#d4a054", outcome: "success", details: "Q1 financial reporting workflow approved and dispatched." },
  { id: "AUD-8820", timestamp: "Today · 10:18 AM", actor: "System", actorRole: "system", action: "ingest_signal", resourceType: "alloy_signal", resourceId: "SIG-9041", pack: "Vessels", packColor: "#38bdf8", outcome: "success", details: "Fuel surcharge signal ingested — high severity. 22h age." },
  { id: "AUD-8819", timestamp: "Today · 9:55 AM", actor: "Lisa Monroe", actorRole: "ops", action: "update_workflow", resourceType: "alloy_workflow", resourceId: "WF-2981", pack: "Aegis", packColor: "#4f6ef7", outcome: "success", details: "Security audit workflow updated — approver role changed to compliance." },
  { id: "AUD-8818", timestamp: "Today · 8:30 AM", actor: "David Chen", actorRole: "analyst", action: "export_data", resourceType: "alloy_artifact", resourceId: "ART-1204", pack: "PRISM", packColor: "#d4a054", outcome: "denied", details: "Export request denied — insufficient role. Required: ops or above." },
  { id: "AUD-8817", timestamp: "Yesterday · 5:12 PM", actor: "Maria Torres", actorRole: "ops", action: "create_approval", resourceType: "alloy_approval", resourceId: "APR-1041", pack: "PRISM", packColor: "#d4a054", outcome: "success", details: "Q2 pricing approval request created and routed to executive queue." },
  { id: "AUD-8816", timestamp: "Yesterday · 3:44 PM", actor: "System", actorRole: "system", action: "flag_signal", resourceType: "alloy_signal", resourceId: "SIG-9028", pack: "Terra", packColor: "#a07848", outcome: "warning", details: "Lease document signal flagged — compliance review required." },
  { id: "AUD-8815", timestamp: "Yesterday · 2:01 PM", actor: "Stephen Lutar", actorRole: "exec", action: "approve_workflow", resourceType: "alloy_approval", resourceId: "APR-1038", pack: "Vessels", packColor: "#38bdf8", outcome: "success", details: "Charter contract approval completed — 4 vessels authorized." },
  { id: "AUD-8814", timestamp: "Yesterday · 11:30 AM", actor: "James Park", actorRole: "ops", action: "retry_run", resourceType: "workflow_run", resourceId: "WF-2940", pack: "Vessels", packColor: "#38bdf8", outcome: "success", details: "Failed fuel calculation workflow retried and completed." },
  { id: "AUD-8813", timestamp: "2 days ago · 4:00 PM", actor: "System", actorRole: "system", action: "batch_ingest", resourceType: "alloy_signal", resourceId: "BATCH-0412", pack: "Aegis", packColor: "#4f6ef7", outcome: "success", details: "Batch signal ingestion — 34 signals processed across Aegis pack." },
];

const TRUST_METRICS = [
  { label: "Audit Coverage", value: "100%", sub: "All events logged", color: "#22c55e", icon: CheckCircle2 },
  { label: "Access Denials", value: "3", sub: "Last 30 days", color: "#c45a4a", icon: AlertTriangle },
  { label: "Total Events", value: "1,204", sub: "This month", color: ELECTRIC, icon: Activity },
  { label: "Actors", value: "12", sub: "Unique this week", color: "#8b7ac8", icon: User },
];

function OutcomePill({ outcome }: { outcome: AuditEvent["outcome"] }) {
  const cfg = {
    success: { color: "#22c55e", bg: "rgba(34,197,94,0.08)", label: "OK" },
    denied: { color: "#c45a4a", bg: "rgba(196,90,74,0.08)", label: "Denied" },
    warning: { color: "#d4a054", bg: "rgba(212,160,84,0.08)", label: "Warning" },
  }[outcome];
  return (
    <span className="text-[7px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider" style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
  );
}

export default function TrustAuditPage() {
  const [filterOutcome, setFilterOutcome] = useState<string>("all");
  const [filterPack, setFilterPack] = useState<string>("all");

  const packs = Array.from(new Set(AUDIT_EVENTS.map(e => e.pack)));
  const filtered = AUDIT_EVENTS.filter(e => {
    if (filterOutcome !== "all" && e.outcome !== filterOutcome) return false;
    if (filterPack !== "all" && e.pack !== filterPack) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-5 space-y-5" style={{ background: BG.page }}>
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-3.5 h-3.5" style={{ color: "#8b7ac8" }} />
          <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "#8b7ac8" }}>Trust & Audit</span>
        </div>
        <h1 className="text-lg font-bold tracking-tight" style={{ color: TEXT.primary }}>Portfolio Trust Summary</h1>
        <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>Immutable audit log of all decisions, approvals, and access events across the portfolio</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TRUST_METRICS.map(m => (
          <div key={m.label} className="rounded-md p-3 flex items-center gap-3" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
            <div className="w-8 h-8 rounded flex items-center justify-center shrink-0" style={{ background: `${m.color}10` }}>
              <m.icon className="w-4 h-4" style={{ color: m.color }} />
            </div>
            <div>
              <div className="text-base font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
              <div className="text-[9px]" style={{ color: TEXT.secondary }}>{m.label}</div>
              <div className="text-[8px]" style={{ color: TEXT.tertiary }}>{m.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-[9px]" style={{ color: TEXT.tertiary }}>
          <Filter className="w-3 h-3" />
          <span>Filter:</span>
        </div>
        {["all", "success", "denied", "warning"].map(o => (
          <button
            key={o}
            onClick={() => setFilterOutcome(o)}
            className="px-2.5 py-1 rounded text-[9px] font-medium capitalize transition-all"
            style={{
              background: filterOutcome === o ? "rgba(45,212,191,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${filterOutcome === o ? "rgba(45,212,191,0.25)" : BORDER.subtle}`,
              color: filterOutcome === o ? ELECTRIC : TEXT.secondary,
            }}
          >
            {o === "all" ? "All outcomes" : o}
          </button>
        ))}
        <div className="w-px h-5 self-center" style={{ background: BORDER.subtle }} />
        {["all", ...packs].map(pack => (
          <button
            key={pack}
            onClick={() => setFilterPack(pack)}
            className="px-2.5 py-1 rounded text-[9px] font-medium transition-all"
            style={{
              background: filterPack === pack ? "rgba(45,212,191,0.12)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${filterPack === pack ? "rgba(45,212,191,0.25)" : BORDER.subtle}`,
              color: filterPack === pack ? ELECTRIC : TEXT.secondary,
            }}
          >
            {pack === "all" ? "All packs" : pack}
          </button>
        ))}
      </div>

      {/* Audit log */}
      <div className="rounded-md overflow-hidden" style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}>
        <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
          <Eye className="w-3 h-3" style={{ color: TEXT.tertiary }} />
          <span className="text-[9px] uppercase tracking-widest font-medium" style={{ color: TEXT.muted }}>Audit Log</span>
          <span className="text-[8px] font-mono ml-auto" style={{ color: TEXT.tertiary }}>{filtered.length} events shown</span>
        </div>
        <div className="divide-y" style={{ "--tw-divide-opacity": 1 } as any}>
          {filtered.map(ev => (
            <div key={ev.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.01] transition-colors">
              <div className="shrink-0 mt-0.5">
                <OutcomePill outcome={ev.outcome} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-[9px] font-mono font-medium" style={{ color: TEXT.primary }}>{ev.action.replace(/_/g, " ")}</span>
                  <span className="text-[8px] font-mono" style={{ color: ev.packColor }}>{ev.pack}</span>
                  <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>{ev.resourceType} · {ev.resourceId}</span>
                </div>
                <p className="text-[10px]" style={{ color: TEXT.secondary }}>{ev.details}</p>
                <div className="flex items-center gap-2 mt-0.5 text-[8px]">
                  <span style={{ color: TEXT.tertiary }}>{ev.actor}</span>
                  <span style={{ color: TEXT.muted }}>·</span>
                  <span className="capitalize px-1 py-px rounded" style={{ color: TEXT.muted, background: "rgba(255,255,255,0.03)" }}>{ev.actorRole}</span>
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1">
                <span className="text-[8px] font-mono" style={{ color: TEXT.muted }}>{ev.id}</span>
                <span className="text-[8px] flex items-center gap-1" style={{ color: TEXT.tertiary }}>
                  <Clock className="w-2 h-2" /> {ev.timestamp}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
