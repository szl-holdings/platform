import { cn } from "../utils";
import { Shield, User, Bot, GitCommit, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";

export type AuditEventKind =
  | "approval"
  | "rejection"
  | "policy-gate"
  | "model-invocation"
  | "tool-call"
  | "human-handoff"
  | "agent-action"
  | "override"
  | "system";

export interface AuditEvent {
  eventId: string;
  kind: AuditEventKind;
  actor: string;
  actorType: "human" | "agent" | "system";
  action: string;
  detail?: string;
  timestamp: string | Date;
  outcome?: "success" | "failure" | "blocked" | "pending";
  traceRef?: string;
}

export interface AuditRailProps {
  events: AuditEvent[];
  maxHeight?: string;
  className?: string;
  emptyMessage?: string;
  relative?: boolean;
}

const KIND_CONFIG: Record<AuditEventKind, { color: string; icon: typeof Shield }> = {
  "approval":          { color: "#22c55e",  icon: CheckCircle },
  "rejection":         { color: "#ef4444",  icon: XCircle },
  "policy-gate":       { color: "#f59e0b",  icon: Shield },
  "model-invocation":  { color: "#8b7ac8",  icon: Bot },
  "tool-call":         { color: "#0ea5e9",  icon: GitCommit },
  "human-handoff":     { color: "#a855f7",  icon: User },
  "agent-action":      { color: "#d4a054",  icon: Bot },
  "override":          { color: "#f97316",  icon: AlertTriangle },
  "system":            { color: "#475569",  icon: Clock },
};

const ACTOR_TYPE_ICON: Record<AuditEvent["actorType"], typeof Shield> = {
  human:  User,
  agent:  Bot,
  system: Clock,
};

const OUTCOME_COLOR: Record<NonNullable<AuditEvent["outcome"]>, string> = {
  success: "#22c55e",
  failure: "#ef4444",
  blocked: "#f59e0b",
  pending: "#475569",
};

function relTs(ts: string | Date): string {
  const d = typeof ts === "string" ? new Date(ts) : ts;
  const ms = Date.now() - d.getTime();
  const s  = Math.round(ms / 1000);
  if (s < 60)   return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60)   return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24)   return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function AuditRail({
  events,
  maxHeight = "480px",
  className,
  emptyMessage = "No audit events",
  relative = true,
}: AuditRailProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[#1a2535] bg-[#0d1520] overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-[#1a2535] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-[#334155]" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#334155]">Audit Rail</span>
        </div>
        <span className="text-[10px] text-[#243040]">{events.length} event{events.length !== 1 ? "s" : ""}</span>
      </div>

      <div
        className="overflow-y-auto"
        style={{ maxHeight }}
      >
        {events.length === 0 && (
          <div className="flex items-center justify-center py-12 text-[12px] text-[#334155]">
            {emptyMessage}
          </div>
        )}

        <ol className="relative px-4 py-2 space-y-0">
          {events.map((event, idx) => {
            const cfg = KIND_CONFIG[event.kind];
            const KindIcon = cfg.icon;
            const ActorIcon = ACTOR_TYPE_ICON[event.actorType];
            const isLast = idx === events.length - 1;

            return (
              <li key={event.eventId} className="relative flex gap-3 pb-3">
                {!isLast && (
                  <div
                    className="absolute left-[13px] top-6 w-px"
                    style={{ bottom: 0, background: "linear-gradient(to bottom, #1a2535, transparent)" }}
                  />
                )}

                <div
                  className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
                  style={{
                    background: `${cfg.color}12`,
                    borderColor: `${cfg.color}30`,
                    boxShadow: `0 0 8px ${cfg.color}20`,
                  }}
                >
                  <KindIcon className="h-3 w-3" style={{ color: cfg.color }} />
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[12px] font-medium text-white">{event.action}</span>
                      {event.outcome && (
                        <span
                          className="ml-2 inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                          style={{
                            color: OUTCOME_COLOR[event.outcome],
                            background: `${OUTCOME_COLOR[event.outcome]}12`,
                            border: `1px solid ${OUTCOME_COLOR[event.outcome]}25`,
                          }}
                        >
                          {event.outcome}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] text-[#334155]">
                      {relative ? relTs(event.timestamp) : new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="mt-0.5 flex items-center gap-1.5">
                    <ActorIcon className="h-2.5 w-2.5 text-[#334155]" />
                    <span className="text-[11px] text-[#475569]">{event.actor}</span>
                    {event.traceRef && (
                      <span className="font-mono text-[9px] text-[#243040]">#{event.traceRef.slice(0, 8)}</span>
                    )}
                  </div>

                  {event.detail && (
                    <p className="mt-1 text-[11px] leading-relaxed text-[#475569]">{event.detail}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
