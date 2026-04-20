import React, { type ReactNode } from "react";
import { cn } from "../utils.js";
import { color } from "../tokens/index.js";

export interface TopBarProps {
  title?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  tenantLabel?: string;
  statusBadge?: ReactNode;
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  className?: string;
}

export function TopBar({
  title,
  breadcrumbs,
  tenantLabel,
  statusBadge,
  left,
  center,
  right,
  className,
}: TopBarProps) {
  return (
    <header
      className={cn("flex items-center gap-3 px-4 border-b flex-shrink-0", className)}
      style={{ height: "48px", background: color.bg.surface, borderColor: color.border.subtle }}
    >
      {left}

      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && (
                <span style={{ color: color.text.muted, fontSize: "12px" }}>/</span>
              )}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="transition-colors"
                  style={{
                    color: idx === breadcrumbs.length - 1 ? color.text.primary : color.text.secondary,
                    fontSize: "13px",
                    textDecoration: "none",
                  }}
                >
                  {crumb.label}
                </a>
              ) : (
                <span
                  style={{
                    color: idx === breadcrumbs.length - 1 ? color.text.primary : color.text.secondary,
                    fontSize: "13px",
                  }}
                >
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {title && !breadcrumbs && (
        <span className="font-semibold text-sm" style={{ color: color.text.primary }}>
          {title}
        </span>
      )}

      {statusBadge}

      <div className="flex-1 flex justify-center">{center}</div>

      {tenantLabel && (
        <div
          className="flex items-center gap-1.5 px-2 rounded text-xs"
          style={{
            background: color.bg.overlay,
            border: `1px solid ${color.border.subtle}`,
            color: color.text.secondary,
            height: "26px",
          }}
        >
          <span
            className="rounded-full"
            style={{ width: "5px", height: "5px", background: color.accent.green }}
          />
          {tenantLabel}
        </div>
      )}

      {right}
    </header>
  );
}
