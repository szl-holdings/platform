import { cn } from "../utils.js";
import { Shield, User, Bot, GitCommit, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";
import { color } from "../tokens/index.js";

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
  "approval":          { color: color.accent.green,  icon: CheckCircle },
  "rejection":         { color: color.accent.red,    icon: XCircle },
  "policy-gate":       { color: color.accent.amber,  icon: Shield },
  "model-invocation":  { color: color.accent.violet, icon: Bot },
  "tool-call":         { color: color.accent.blue,   icon: GitCommit },
  "human-handoff":     { color: color.accent.violet, icon: User },
  "agent-action":      { color: color.accent.amber,  icon: Bot },
  "override":          { color: color.accent.amber,  icon: AlertTriangle },
  "system":            { color: color.text.muted,    icon: Clock },
};

const ACTOR_TYPE_ICON: Record<AuditEvent["actorType"], typeof Shield> = {
  human:  User,
  agent:  Bot,
  system: Clock,
};

const OUTCOME_COLOR: Record<NonNullable<AuditEvent["outcome"]>, string> = {
  success: color.accent.green,
  failure: color.accent.red,
  blocked: color.accent.amber,
  pending: color.text.muted,
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
      className={cn("rounded-lg overflow-hidden", className)}
      style={{ border: `1px solid ${color.border.subtle}`, background: color.bg.surface }}
    >
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: `1px solid ${color.border.subtle}` }}
      >
        <div className="flex items-center gap-2">
          <Shield className="h-3.5 w-3.5" style={{ color: color.text.muted }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: color.text.muted }}>
            Audit Rail
          </span>
        </div>
        <span className="text-xs" style={{ color: color.text.muted }}>
          {events.length} event{events.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight }}>
        {events.length === 0 && (
          <div className="flex items-center justify-center py-12 text-xs" style={{ color: color.text.muted }}>
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
                    style={{ bottom: 0, background: color.border.subtle }}
                  />
                )}

                <div
                  className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: color.bg.overlay,
                    border: `1px solid ${color.border.default}`,
                  }}
                >
                  <KindIcon className="h-3 w-3" style={{ color: cfg.color }} />
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-xs font-medium" style={{ color: color.text.primary }}>
                        {event.action}
                      </span>
                      {event.outcome && (
                        <span
                          className="ml-2 inline-flex items-center rounded px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider"
                          style={{
                            color: OUTCOME_COLOR[event.outcome],
                            background: color.bg.overlay,
                            border: `1px solid ${color.border.default}`,
                          }}
                        >
                          {event.outcome}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-xs" style={{ color: color.text.muted }}>
                      {relative ? relTs(event.timestamp) : new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="mt-0.5 flex items-center gap-1.5">
                    <ActorIcon className="h-2.5 w-2.5" style={{ color: color.text.muted }} />
                    <span className="text-xs" style={{ color: color.text.secondary }}>{event.actor}</span>
                    {event.traceRef && (
                      <span className="font-mono text-xs" style={{ color: color.text.muted }}>
                        #{event.traceRef.slice(0, 8)}
                      </span>
                    )}
                  </div>

                  {event.detail && (
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: color.text.secondary }}>
                      {event.detail}
                    </p>
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
