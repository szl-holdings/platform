import React, { useState } from "react";
import {
  type DoctrineLayer,
  type DoctrineLayerConfig,
  DOCTRINE_LAYER_COLORS,
  DOCTRINE_LAYER_DESCRIPTIONS,
  formatLayerLabel,
  getDoctrineConfig,
} from "./doctrine-layer";

interface DoctrineLayerBadgeProps {
  appId: string;
  variant?: "compact" | "full" | "inline";
  showTooltip?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

function LayerPill({ layer, size = "sm" }: { layer: DoctrineLayer; size?: "xs" | "sm" }) {
  const c = DOCTRINE_LAYER_COLORS[layer];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: size === "xs" ? "1px 5px" : "2px 7px",
        borderRadius: "3px",
        fontSize: size === "xs" ? "8px" : "9px",
        fontWeight: 700,
        letterSpacing: "0.07em",
        textTransform: "uppercase" as const,
        color: c.color,
        background: c.bg,
        border: `1px solid ${c.border}`,
        lineHeight: 1.4,
        fontFamily: "'Geist Mono', monospace",
      }}
    >
      {layer}
    </span>
  );
}

function TooltipContent({ config }: { config: DoctrineLayerConfig }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% + 8px)",
        left: "50%",
        transform: "translateX(-50%)",
        background: "hsl(216 14% 6%)",
        border: "1px solid hsla(0 0% 100% / 0.12)",
        borderRadius: "8px",
        padding: "10px 12px",
        minWidth: "220px",
        maxWidth: "280px",
        zIndex: 9999,
        boxShadow: "0 8px 24px hsla(0 0% 0% / 0.5)",
        pointerEvents: "none",
      }}
    >
      <div style={{ marginBottom: "6px", fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        SZL Doctrine Layer
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
        {config.layers.map((layer) => (
          <LayerPill key={layer} layer={layer} size="xs" />
        ))}
      </div>
      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", lineHeight: 1.5, marginBottom: "8px" }}>
        {config.description}
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "6px" }}>
        {config.layers.map((layer) => (
          <div key={layer} style={{ marginBottom: "4px" }}>
            <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: DOCTRINE_LAYER_COLORS[layer].color }}>
              {layer}:{" "}
            </span>
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)" }}>
              {DOCTRINE_LAYER_DESCRIPTIONS[layer]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DoctrineLayerBadge({
  appId,
  variant = "compact",
  showTooltip = true,
  className,
  style,
}: DoctrineLayerBadgeProps) {
  const config = getDoctrineConfig(appId);
  const [hovered, setHovered] = useState(false);

  if (!config) return null;

  if (variant === "inline") {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", ...style }} className={className}>
        {config.layers.map((layer) => (
          <LayerPill key={layer} layer={layer} size="xs" />
        ))}
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          padding: "10px 12px",
          background: "hsla(0 0% 100% / 0.03)",
          border: "1px solid hsla(0 0% 100% / 0.07)",
          borderRadius: "8px",
          ...style,
        }}
        className={className}
      >
        <div style={{ fontSize: "9px", fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Intelligence Layer
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {config.layers.map((layer) => (
            <LayerPill key={layer} layer={layer} />
          ))}
        </div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>
          {config.primaryRole}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ position: "relative", display: "inline-flex", alignItems: "center", ...style }}
      className={className}
      onMouseEnter={() => showTooltip && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "3px",
          padding: "2px 6px",
          borderRadius: "4px",
          background: "hsla(0 0% 100% / 0.04)",
          border: "1px solid hsla(0 0% 100% / 0.08)",
          cursor: showTooltip ? "default" : "auto",
        }}
      >
        {config.layers.map((layer, i) => (
          <React.Fragment key={layer}>
            {i > 0 && (
              <span style={{ fontSize: "8px", color: "rgba(255,255,255,0.25)", margin: "0 1px" }}>+</span>
            )}
            <span
              style={{
                fontSize: "8px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                color: DOCTRINE_LAYER_COLORS[layer].color,
                fontFamily: "'Geist Mono', monospace",
                textTransform: "uppercase",
              }}
            >
              {layer}
            </span>
          </React.Fragment>
        ))}
      </div>
      {showTooltip && hovered && <TooltipContent config={config} />}
    </div>
  );
}

export { LayerPill };
export type { DoctrineLayerBadgeProps };
