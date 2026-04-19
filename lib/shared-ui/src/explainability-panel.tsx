import React, { useState } from "react";
import type { ExplainabilityModel, DoctrineContextModel } from "./doctrine-layer";
import { DOCTRINE_LAYER_COLORS } from "./doctrine-layer";
import { colors } from "./tokens";

interface ExplainabilityPanelProps {
  explainability: ExplainabilityModel;
  context?: DoctrineContextModel;
  title?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  variant?: "drawer" | "inline" | "popover";
  accentColor?: string;
}

function ConfidenceBar({ confidence, color }: { confidence: number; color: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(confidence * 100)));
  const statusColor =
    pct >= 80 ? "hsl(152, 65%, 48%)" : pct >= 50 ? "hsl(38, 90%, 55%)" : "hsl(4, 72%, 56%)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          flex: 1,
          height: "4px",
          background: "hsla(0 0% 100% / 0.07)",
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: statusColor,
            borderRadius: "2px",
            transition: "width 0.5s ease",
          }}
        />
      </div>
      <span
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: statusColor,
          minWidth: "32px",
          textAlign: "right",
          fontFamily: "'Geist Mono', monospace",
        }}
      >
        {pct}%
      </span>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <div
        style={{
          fontSize: "9px",
          fontWeight: 700,
          color: "rgba(255,255,255,0.35)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "5px",
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function BulletList({ items, color }: { items: string[]; color: string }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "3px" }}>
      {items.map((item, i) => (
        <li
          key={i}
          style={{
            fontSize: "12px",
            color: "rgba(255,255,255,0.65)",
            display: "flex",
            alignItems: "flex-start",
            gap: "6px",
            lineHeight: 1.5,
          }}
        >
          <span style={{ color, flexShrink: 0, marginTop: "1px", fontSize: "10px" }}>◆</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ExplainabilityPanel({
  explainability,
  context,
  title = "Why this?",
  isOpen,
  onToggle,
  variant = "inline",
  accentColor,
}: ExplainabilityPanelProps) {
  const [localOpen, setLocalOpen] = useState(false);

  const controlled = isOpen !== undefined && onToggle !== undefined;
  const open = controlled ? isOpen : localOpen;
  const toggle = controlled ? onToggle : () => setLocalOpen((v) => !v);

  const layerColor = explainability.layer
    ? DOCTRINE_LAYER_COLORS[explainability.layer].color
    : accentColor || colors.primary.DEFAULT;

  const confidence = context?.confidence;
  const pct = confidence !== undefined ? Math.max(0, Math.min(100, Math.round(confidence * 100))) : null;

  const panelContent = (
    <div
      style={{
        background: "hsl(216 14% 6%)",
        border: "1px solid hsla(0 0% 100% / 0.1)",
        borderRadius: "10px",
        padding: "14px 16px",
        fontSize: "12px",
        color: colors.text.secondary,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
          paddingBottom: "10px",
          borderBottom: "1px solid hsla(0 0% 100% / 0.07)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <span style={{ fontSize: "14px" }}>🔍</span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "rgba(255,255,255,0.8)",
              letterSpacing: "0.02em",
            }}
          >
            {title}
          </span>
        </div>
        <div
          style={{
            fontSize: "8px",
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: "3px",
            background: layerColor + "20",
            color: layerColor,
            border: `1px solid ${layerColor}40`,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontFamily: "'Geist Mono', monospace",
          }}
        >
          {explainability.layer}
        </div>
      </div>

      <Section label="What triggered this">
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", lineHeight: 1.55, margin: 0 }}>
          {explainability.trigger}
        </p>
      </Section>

      {explainability.contributingData.length > 0 && (
        <Section label="Contributing data">
          <BulletList items={explainability.contributingData} color={layerColor} />
        </Section>
      )}

      {confidence !== undefined && (
        <Section label="Confidence">
          <ConfidenceBar confidence={confidence} color={layerColor} />
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginTop: "5px", lineHeight: 1.5 }}>
            {explainability.confidenceExplanation}
          </p>
        </Section>
      )}

      {explainability.assumptions.length > 0 && (
        <Section label="Assumptions">
          <BulletList items={explainability.assumptions} color="rgba(255,255,255,0.25)" />
        </Section>
      )}

      <Section label="Recommended action">
        <div
          style={{
            background: layerColor + "12",
            border: `1px solid ${layerColor}30`,
            borderRadius: "6px",
            padding: "8px 10px",
            fontSize: "12px",
            color: "rgba(255,255,255,0.75)",
            lineHeight: 1.5,
          }}
        >
          {explainability.recommendedAction}
        </div>
      </Section>

      {explainability.alternativeActions && explainability.alternativeActions.length > 0 && (
        <Section label="Alternative actions">
          <BulletList items={explainability.alternativeActions} color="rgba(255,255,255,0.2)" />
        </Section>
      )}

      {context && (
        <>
          {context.impactedEntities.length > 0 && (
            <Section label="Impacted entities">
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {context.impactedEntities.map((e, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: "10px",
                      padding: "2px 7px",
                      borderRadius: "3px",
                      background: "hsla(0 0% 100% / 0.06)",
                      border: "1px solid hsla(0 0% 100% / 0.10)",
                      color: "rgba(255,255,255,0.6)",
                    }}
                  >
                    {e}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {context.businessImpact && (
            <Section label="Business impact">
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", lineHeight: 1.5, margin: 0 }}>
                {context.businessImpact}
              </p>
            </Section>
          )}
        </>
      )}

      {explainability.modelId && (
        <div
          style={{
            marginTop: "10px",
            paddingTop: "8px",
            borderTop: "1px solid hsla(0 0% 100% / 0.06)",
            fontSize: "10px",
            color: "rgba(255,255,255,0.25)",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <span>⬡</span>
          <span>Model: {explainability.modelId}</span>
        </div>
      )}
    </div>
  );

  if (variant === "drawer") {
    return (
      <>
        <button
          onClick={toggle}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "10px",
            fontWeight: 600,
            color: open ? layerColor : "rgba(255,255,255,0.4)",
            background: open ? layerColor + "12" : "transparent",
            border: `1px solid ${open ? layerColor + "30" : "rgba(255,255,255,0.08)"}`,
            borderRadius: "5px",
            padding: "3px 8px",
            cursor: "pointer",
            transition: "all 0.15s ease",
            letterSpacing: "0.03em",
          }}
        >
          <span>🔍</span>
          <span>Why this?</span>
          <span style={{ opacity: 0.6, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            ▾
          </span>
        </button>
        {open && (
          <div style={{ marginTop: "8px" }}>
            {panelContent}
          </div>
        )}
      </>
    );
  }

  return panelContent;
}

interface ExplainabilityToggleProps {
  explainability: ExplainabilityModel;
  context?: DoctrineContextModel;
  accentColor?: string;
}

export function ExplainabilityToggle({ explainability, context, accentColor }: ExplainabilityToggleProps) {
  return (
    <ExplainabilityPanel
      explainability={explainability}
      {...(context !== undefined ? { context } : {})}
      variant="drawer"
      {...(accentColor !== undefined ? { accentColor } : {})}
    />
  );
}
