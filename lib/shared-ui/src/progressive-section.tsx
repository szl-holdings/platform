import React, { useState, useId } from "react";
import { cn } from "./utils";

export type DisplayDensity = "compact" | "comfortable" | "spacious";

export interface ProgressiveSectionProps {
  title?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  collapsedPreview?: React.ReactNode;
  accentColor?: string;
  className?: string;
  badgeCount?: number;
  onToggle?: (expanded: boolean) => void;
}

export function ProgressiveSection({
  title,
  children,
  defaultExpanded = false,
  collapsedPreview,
  accentColor = "rgba(255,255,255,0.3)",
  className,
  badgeCount,
  onToggle,
}: ProgressiveSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const headerId = useId();
  const contentId = useId();

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    onToggle?.(next);
  };

  return (
    <div className={cn("szl-progressive-section", className)}>
      <button
        id={headerId}
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={toggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          background: "none",
          border: "none",
          padding: "6px 0",
          cursor: "pointer",
          color: "inherit",
          textAlign: "left",
          fontFamily: "inherit",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "16px",
            height: "16px",
            transition: "transform 0.2s ease",
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            color: accentColor,
            fontSize: "12px",
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          ›
        </span>

        {title && (
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.35)",
            }}
          >
            {title}
          </span>
        )}

        {badgeCount !== undefined && badgeCount > 0 && (
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              padding: "1px 6px",
              borderRadius: "9999px",
              background: "rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.45)",
              marginLeft: "2px",
            }}
          >
            {badgeCount}
          </span>
        )}

        <span
          style={{
            flex: 1,
            height: "1px",
            background: "rgba(255,255,255,0.06)",
            marginLeft: "4px",
          }}
          aria-hidden="true"
        />

        <span
          style={{
            fontSize: "11px",
            color: "rgba(255,255,255,0.25)",
            flexShrink: 0,
          }}
        >
          {expanded ? "Hide" : "Show more"}
        </span>
      </button>

      {!expanded && collapsedPreview && (
        <div style={{ marginBottom: "4px" }}>{collapsedPreview}</div>
      )}

      <div
        id={contentId}
        role="region"
        aria-labelledby={headerId}
        style={{
          display: "grid",
          gridTemplateRows: expanded ? "1fr" : "0fr",
          transition: "grid-template-rows 0.25s ease",
          overflow: "hidden",
        }}
      >
        <div style={{ minHeight: 0 }}>
          <div style={{ paddingTop: "8px" }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export interface DensityToggleProps {
  density: DisplayDensity;
  onChange: (density: DisplayDensity) => void;
  className?: string;
  accentColor?: string;
}

const DENSITIES: Array<{ value: DisplayDensity; label: string; icon: string }> = [
  { value: "compact", label: "Compact", icon: "⊟" },
  { value: "comfortable", label: "Comfortable", icon: "☰" },
  { value: "spacious", label: "Spacious", icon: "⊞" },
];

export function DensityToggle({
  density,
  onChange,
  className,
  accentColor = "hsl(210 60% 58%)",
}: DensityToggleProps) {
  return (
    <div
      role="group"
      aria-label="Display density"
      className={className}
      style={{
        display: "inline-flex",
        gap: "2px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "8px",
        padding: "3px",
      }}
    >
      {DENSITIES.map((d) => {
        const active = density === d.value;
        return (
          <button
            key={d.value}
            onClick={() => onChange(d.value)}
            title={d.label}
            aria-pressed={active}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              borderRadius: "5px",
              border: "none",
              cursor: "pointer",
              fontSize: "11px",
              fontWeight: 500,
              fontFamily: "inherit",
              transition: "all 0.15s ease",
              background: active ? `${accentColor}18` : "transparent",
              color: active ? accentColor : "rgba(255,255,255,0.4)",
              boxShadow: active ? `0 0 0 1px ${accentColor}35` : "none",
            }}
          >
            <span style={{ fontSize: "13px" }} aria-hidden="true">{d.icon}</span>
            <span style={{ display: "none" }}>{d.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function useDensity(defaultDensity: DisplayDensity = "comfortable") {
  const STORAGE_KEY = "szl-display-density";
  const [density, setDensityState] = useState<DisplayDensity>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "compact" || stored === "comfortable" || stored === "spacious") return stored;
    } catch {
    }
    return defaultDensity;
  });

  const setDensity = (d: DisplayDensity) => {
    setDensityState(d);
    try {
      localStorage.setItem(STORAGE_KEY, d);
    } catch {
    }
  };

  const densitySpacing: Record<DisplayDensity, { padding: string; gap: string; rowHeight: string }> = {
    compact: { padding: "0.5rem 0.75rem", gap: "0.5rem", rowHeight: "32px" },
    comfortable: { padding: "0.75rem 1rem", gap: "0.75rem", rowHeight: "40px" },
    spacious: { padding: "1.125rem 1.25rem", gap: "1.125rem", rowHeight: "52px" },
  };

  return {
    density,
    setDensity,
    spacing: densitySpacing[density],
  };
}
