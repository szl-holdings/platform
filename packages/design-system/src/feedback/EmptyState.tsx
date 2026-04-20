import React, { type ReactNode } from "react";
import { cn } from "../utils.js";
import { color } from "../tokens/index.js";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3 py-12 px-6 text-center", className)}
    >
      {icon && <div style={{ color: color.text.muted, fontSize: "32px" }}>{icon}</div>}
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold text-sm" style={{ color: color.text.primary }}>
          {title}
        </h3>
        {description && (
          <p className="text-sm" style={{ color: color.text.secondary, maxWidth: "320px" }}>
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
