import { useState } from "react";
import { ConstellationGraph } from "@szl-holdings/shared-ui/constellation-graph";

const ACCENT = "#c8a84b";
const DOMAINS = ["terra", "vessels", "aegis", "prism", "lyte"] as const;
const LABELS: Record<string, string> = {
  terra: "Terra",
  vessels: "Vessels",
  aegis: "Aegis",
  prism: "Prism Counsel",
  lyte: "Lyte",
};

export default function Constellation() {
  const [domain, setDomain] = useState<string>("terra");

  return (
    <div style={{ padding: "28px 28px 40px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 600, color: "var(--pulse-text)", margin: 0 }}>
          Constellation
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--pulse-text-muted)", marginTop: 4 }}>
          Cross-domain entity map. Switch between domains to see how vessels, properties, threats,
          and counsel cases interconnect across the SZL Holdings portfolio.
        </p>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {DOMAINS.map((d) => {
          const active = d === domain;
          return (
            <button
              key={d}
              onClick={() => setDomain(d)}
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "5px 11px",
                borderRadius: 4,
                border: `1px solid ${active ? ACCENT : "rgba(255,255,255,0.12)"}`,
                background: active ? `${ACCENT}20` : "transparent",
                color: active ? ACCENT : "var(--pulse-text-muted)",
                cursor: "pointer",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
              data-testid={`pulse-domain-${d}`}
            >
              {LABELS[d]}
            </button>
          );
        })}
      </div>

      <ConstellationGraph domain={domain} accentColor={ACCENT} height={540} />
    </div>
  );
}
