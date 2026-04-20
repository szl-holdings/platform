import React from "react";
import { cn } from "../utils.js";
import { color } from "../tokens/index.js";

export interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  actorRole?: string;
  resourceType?: string;
  resourceId?: string;
  timestamp: string;
  policyResult?: "allowed" | "requires-approval" | "blocked" | "override";
  traceId?: string;
  ipAddress?: string;
  metadata?: Record<string, string | number>;
}

export interface AuditTrailListProps {
  entries: AuditEntry[];
  className?: string;
}

const POLICY_COLORS: Record<string, string> = {
  allowed: color.accent.green,
  "requires-approval": color.accent.amber,
  blocked: color.accent.red,
  override: color.accent.violet,
};

export function AuditTrailList({ entries, className }: AuditTrailListProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex items-start gap-3 px-4 py-3 border-b"
          style={{ borderColor: color.border.subtle }}
        >
          <div
            className="flex-shrink-0 rounded mt-1"
            style={{
              width: "8px",
              height: "8px",
              background: entry.policyResult
                ? POLICY_COLORS[entry.policyResult]
                : color.text.muted,
            }}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium" style={{ color: color.text.primary }}>
                {entry.action}
              </span>
              <span className="text-xs flex-shrink-0" style={{ color: color.text.muted }}>
                {entry.timestamp}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="text-xs" style={{ color: color.text.secondary }}>
                {entry.actor}
                {entry.actorRole && (
                  <span style={{ color: color.text.muted }}> · {entry.actorRole}</span>
                )}
              </span>
              {entry.resourceType && (
                <span className="text-xs" style={{ color: color.text.muted }}>
                  {entry.resourceType}
                  {entry.resourceId && ` #${entry.resourceId}`}
                </span>
              )}
              {entry.policyResult && (
                <span
                  className="text-xs font-medium"
                  style={{ color: POLICY_COLORS[entry.policyResult] }}
                >
                  {entry.policyResult}
                </span>
              )}
              {entry.traceId && (
                <span className="text-xs font-mono" style={{ color: color.text.muted }}>
                  {entry.traceId}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
