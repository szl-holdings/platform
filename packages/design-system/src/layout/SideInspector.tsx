import React, { type ReactNode } from "react";
import { cn } from "../utils.js";
import { color } from "../tokens/index.js";

export interface SideInspectorProps {
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  width?: string;
  className?: string;
}

export function SideInspector({
  title,
  children,
  onClose,
  width = "360px",
  className,
}: SideInspectorProps) {
  return (
    <aside
      className={cn("flex flex-col border-l overflow-hidden", className)}
      style={{ width, background: color.bg.surface, borderColor: color.border.subtle }}
    >
      {(title || onClose) && (
        <div
          className="flex items-center justify-between px-4 border-b flex-shrink-0"
          style={{ height: "44px", borderColor: color.border.subtle }}
        >
          {title && (
            <span className="font-semibold text-sm" style={{ color: color.text.primary }}>
              {title}
            </span>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                color: color.text.muted,
                background: "transparent",
                cursor: "pointer",
                border: "none",
                fontSize: "16px",
              }}
              aria-label="Close inspector"
            >
              ×
            </button>
          )}
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4">{children}</div>
    </aside>
  );
}
