import React, { type ReactNode } from "react";
import { cn } from "../utils.js";
import { color } from "../tokens/index.js";

export interface EvidenceSource {
  sourceId: string;
  sourceUri?: string;
  chunkId?: string;
  title?: string;
  score?: number;
  profileVersion?: string;
  retrievalPath?: string;
}

export interface PolicyCheckResult {
  policyId: string;
  verdict: "allowed" | "requires-approval" | "blocked" | "override";
  reason?: string;
  timestamp?: string;
}

export interface EvidencePanelProps {
  traceId?: string;
  sources?: EvidenceSource[];
  policyChecks?: PolicyCheckResult[];
  toolsUsed?: string[];
  approvalStatus?: "none" | "pending" | "approved" | "rejected" | "escalated";
  approvalReason?: string;
  children?: ReactNode;
  className?: string;
}

const VERDICT_COLOR: Record<string, string> = {
  allowed: color.accent.green,
  "requires-approval": color.accent.amber,
  blocked: color.accent.red,
  override: color.accent.violet,
};

const APPROVAL_COLOR: Record<string, string> = {
  none: color.text.muted,
  pending: color.accent.amber,
  approved: color.accent.green,
  rejected: color.accent.red,
  escalated: color.accent.violet,
};

export function EvidencePanel({
  traceId,
  sources = [],
  policyChecks = [],
  toolsUsed = [],
  approvalStatus = "none",
  approvalReason,
  children,
  className,
}: EvidencePanelProps) {
  return (
    <aside
      className={cn("flex flex-col gap-0 divide-y", className)}
      style={{ borderColor: color.border.subtle }}
    >
      {traceId && (
        <div className="p-3">
          <div className="text-xs font-medium mb-1" style={{ color: color.text.secondary }}>
            Trace
          </div>
          <code className="text-xs" style={{ color: color.accent.blue, fontFamily: "monospace" }}>
            {traceId}
          </code>
        </div>
      )}

      {sources.length > 0 && (
        <div className="p-3">
          <div className="text-xs font-medium mb-2" style={{ color: color.text.secondary }}>
            Sources ({sources.length})
          </div>
          <div className="flex flex-col gap-2">
            {sources.map((src) => (
              <div key={src.sourceId} className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium truncate" style={{ color: color.text.primary }}>
                    {src.title ?? src.sourceId}
                  </span>
                  {src.score !== undefined && (
                    <span className="text-xs flex-shrink-0" style={{ color: color.accent.green }}>
                      {(src.score * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                {src.sourceUri && (
                  <span className="text-xs truncate" style={{ color: color.text.muted }}>
                    {src.sourceUri}
                  </span>
                )}
                {src.retrievalPath && (
                  <span className="text-xs" style={{ color: color.text.muted }}>
                    via {src.retrievalPath}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {policyChecks.length > 0 && (
        <div className="p-3">
          <div className="text-xs font-medium mb-2" style={{ color: color.text.secondary }}>
            Policy Checks
          </div>
          <div className="flex flex-col gap-1">
            {policyChecks.map((check) => (
              <div key={check.policyId} className="flex items-start justify-between gap-2">
                <span className="text-xs truncate" style={{ color: color.text.primary }}>
                  {check.policyId}
                </span>
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <span
                    className="text-xs font-medium"
                    style={{ color: VERDICT_COLOR[check.verdict] ?? color.text.secondary }}
                  >
                    {check.verdict}
                  </span>
                  {check.reason && (
                    <span className="text-xs" style={{ color: color.text.muted }}>
                      {check.reason}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {toolsUsed.length > 0 && (
        <div className="p-3">
          <div className="text-xs font-medium mb-2" style={{ color: color.text.secondary }}>
            Tools Used
          </div>
          <div className="flex flex-wrap gap-1">
            {toolsUsed.map((tool) => (
              <span
                key={tool}
                className="text-xs rounded px-1.5 py-0.5"
                style={{
                  background: color.bg.overlay,
                  color: color.text.secondary,
                  border: `1px solid ${color.border.subtle}`,
                }}
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {approvalStatus !== "none" && (
        <div className="p-3">
          <div className="text-xs font-medium mb-1" style={{ color: color.text.secondary }}>
            Approval
          </div>
          <div className="flex items-center gap-2">
            <span
              className="rounded-full"
              style={{
                width: "7px",
                height: "7px",
                background: APPROVAL_COLOR[approvalStatus],
                flexShrink: 0,
              }}
            />
            <span
              className="text-xs font-medium capitalize"
              style={{ color: APPROVAL_COLOR[approvalStatus] }}
            >
              {approvalStatus}
            </span>
          </div>
          {approvalReason && (
            <p className="text-xs mt-1" style={{ color: color.text.secondary }}>
              {approvalReason}
            </p>
          )}
        </div>
      )}

      {children && <div className="p-3">{children}</div>}
    </aside>
  );
}
