import React from "react";
import { cn } from "../utils.js";
import { color } from "../tokens/index.js";

export type EnvironmentType = "production" | "staging" | "development" | "demo";

export interface TenantIndicatorProps {
  tenantName: string;
  environment?: EnvironmentType;
  className?: string;
}

const ENV_DOT_COLOR: Record<EnvironmentType, string> = {
  production: color.accent.green,
  staging: color.accent.amber,
  development: color.accent.blue,
  demo: color.accent.violet,
};

const ENV_LABEL: Record<EnvironmentType, string> = {
  production: "Production",
  staging: "Staging",
  development: "Development",
  demo: "Demo",
};

export function TenantIndicator({
  tenantName,
  environment = "production",
  className,
}: TenantIndicatorProps) {
  const dotColor = ENV_DOT_COLOR[environment];
  const label = ENV_LABEL[environment];

  return (
    <div
      className={cn("flex items-center gap-1.5 px-2 rounded text-xs", className)}
      style={{
        background: color.bg.overlay,
        border: `1px solid ${color.border.subtle}`,
        color: color.text.secondary,
        height: "26px",
      }}
    >
      <span
        className="rounded-full flex-shrink-0"
        style={{ width: "6px", height: "6px", background: dotColor }}
      />
      <span style={{ color: color.text.primary }}>{tenantName}</span>
      {environment !== "production" && (
        <span
          className="rounded px-1"
          style={{
            background: color.border.subtle,
            color: dotColor,
            fontSize: "9px",
            fontWeight: 600,
          }}
        >
          {label.toUpperCase()}
        </span>
      )}
    </div>
  );
}
