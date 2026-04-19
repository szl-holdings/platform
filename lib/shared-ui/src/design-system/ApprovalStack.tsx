import * as React from "react";
import { cn } from "../utils";
import { toAlpha } from "../utils";
import { colors, effects } from "../tokens";

export type ApprovalStateKey = keyof typeof colors.reviewState;

export interface Approver {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
  initials?: string;
  state: ApprovalStateKey;
  note?: string;
  timestamp?: string;
}

export interface ApprovalStackProps {
  title?: string;
  approvers: Approver[];
  required?: number;
  accentColor?: string;
  compact?: boolean;
  className?: string;
}

function ApproverAvatar({ approver, accentColor }: { approver: Approver; accentColor?: string }) {
  const token = colors.reviewState[approver.state];
  const initials =
    approver.initials ??
    approver.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div
      className="relative shrink-0"
      title={`${approver.name}${approver.role ? ` — ${approver.role}` : ""}: ${token.label}`}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-semibold"
        style={{
          background: approver.avatarUrl
            ? undefined
            : accentColor
            ? toAlpha(accentColor, 0.10)
            : colors.surface.glass,
          borderColor: token.border,
          color: colors.text.primary,
          backgroundImage: approver.avatarUrl ? `url(${approver.avatarUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {!approver.avatarUrl && initials}
      </div>
      <span
        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full"
        style={{
          background: token.color,
          border: `1px solid ${colors.background.primary}`,
        }}
        aria-label={token.label}
      />
    </div>
  );
}

export function ApprovalStack({
  title = "Approval Status",
  approvers,
  required,
  accentColor,
  compact = false,
  className,
}: ApprovalStackProps) {
  const approved = approvers.filter((a) => a.state === "approved").length;
  const total = required ?? approvers.length;
  const progress = total > 0 ? (approved / total) * 100 : 0;

  return (
    <div
      className={cn("rounded-xl border", compact ? "p-3" : "p-4", className)}
      style={{
        background: effects.surface.card.background,
        border: effects.surface.card.border,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <p
          className="text-[12px] font-semibold uppercase tracking-[0.07em]"
          style={{ color: colors.text.muted }}
        >
          {title}
        </p>
        <span className="text-[11px] font-medium" style={{ color: colors.text.primary }}>
          {approved}/{total}
        </span>
      </div>

      <div
        className="h-1 rounded-full mb-3 overflow-hidden"
        style={{ background: colors.border.subtle }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background:
              progress === 100
                ? colors.semantic.success
                : accentColor ?? colors.semantic.info,
          }}
        />
      </div>

      {!compact ? (
        <div className="space-y-2">
          {approvers.map((approver) => {
            const token = colors.reviewState[approver.state];
            return (
              <div key={approver.id} className="flex items-center gap-2.5">
                <ApproverAvatar approver={approver} {...(accentColor !== undefined ? { accentColor } : {})} />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium truncate" style={{ color: colors.text.primary }}>
                    {approver.name}
                  </p>
                  {approver.role && (
                    <p className="text-[10px] truncate" style={{ color: colors.text.subtle }}>
                      {approver.role}
                    </p>
                  )}
                </div>
                <span
                  className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{
                    background: token.bg,
                    color: token.color,
                    border: `1px solid ${token.border}`,
                  }}
                >
                  {token.label}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-1">
          {approvers.map((approver) => (
            <ApproverAvatar key={approver.id} approver={approver} {...(accentColor !== undefined ? { accentColor } : {})} />
          ))}
        </div>
      )}

      {approvers.some((a) => a.note) && !compact && (
        <div className="mt-3 space-y-1.5">
          {approvers
            .filter((a) => a.note)
            .map((approver) => (
              <div
                key={approver.id}
                className="text-[11px] p-2 rounded-lg"
                style={{ background: colors.surface.glass, color: colors.text.muted }}
              >
                <span className="font-medium" style={{ color: colors.text.primary }}>
                  {approver.name}:
                </span>{" "}
                {approver.note}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
