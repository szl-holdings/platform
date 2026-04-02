import React, { useState } from "react";

export type StatusLevel = "info" | "warning" | "critical" | "maintenance";

export interface StatusBannerConfig {
  active: boolean;
  level: StatusLevel;
  message: string;
  link?: { label: string; href: string };
}

const LEVEL_STYLES: Record<StatusLevel, { bg: string; border: string; color: string; dot: string }> = {
  info: {
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.25)",
    color: "#93c5fd",
    dot: "#3b82f6",
  },
  warning: {
    bg: "rgba(251,191,36,0.08)",
    border: "rgba(251,191,36,0.25)",
    color: "#fcd34d",
    dot: "#f59e0b",
  },
  critical: {
    bg: "rgba(239,68,68,0.10)",
    border: "rgba(239,68,68,0.30)",
    color: "#fca5a5",
    dot: "#ef4444",
  },
  maintenance: {
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.25)",
    color: "#c4b5fd",
    dot: "#8b5cf6",
  },
};

const LEVEL_LABELS: Record<StatusLevel, string> = {
  info: "Notice",
  warning: "Degraded",
  critical: "Incident",
  maintenance: "Maintenance",
};

export interface StatusBannerProps {
  config: StatusBannerConfig;
  dismissible?: boolean;
}

export function StatusBanner({ config, dismissible = true }: StatusBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!config.active || dismissed) return null;

  const styles = LEVEL_STYLES[config.level];
  const label = LEVEL_LABELS[config.level];

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        width: "100%",
        background: styles.bg,
        borderBottom: `1px solid ${styles.border}`,
        padding: "0.5rem 1rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem",
        fontSize: "0.8125rem",
        lineHeight: 1.4,
        position: "relative",
        zIndex: 50,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: styles.dot,
            boxShadow: `0 0 5px ${styles.dot}`,
            animation: config.level === "critical" ? "status-pulse 1.2s ease-in-out infinite" : "none",
          }}
        />
        <span style={{ fontWeight: 700, color: styles.color, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.6875rem" }}>
          {label}
        </span>
      </span>

      <span style={{ color: "rgba(255,255,255,0.70)" }}>{config.message}</span>

      {config.link && (
        <a
          href={config.link.href}
          style={{
            color: styles.color,
            textDecoration: "underline",
            textUnderlineOffset: "2px",
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          {config.link.label}
        </a>
      )}

      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss banner"
          style={{
            position: "absolute",
            right: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.30)",
            fontSize: "1rem",
            lineHeight: 1,
            padding: "2px 4px",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          ×
        </button>
      )}

      <style>{`
        @keyframes status-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

export function useStatusBanner(defaultConfig?: Partial<StatusBannerConfig>): {
  config: StatusBannerConfig;
  setConfig: React.Dispatch<React.SetStateAction<StatusBannerConfig>>;
} {
  const [config, setConfig] = useState<StatusBannerConfig>({
    active: false,
    level: "info",
    message: "",
    ...defaultConfig,
  });
  return { config, setConfig };
}
