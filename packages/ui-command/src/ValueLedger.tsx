import React from "react";
import { TrendingDown, Shield, TrendingUp } from "lucide-react";
import type { ValueEntry } from "./types";

const BG = "hsla(0,0%,100%,0.025)";
const BORDER = "hsla(0,0%,100%,0.07)";

function formatAmt(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toLocaleString()}`;
}

const TYPE_META = {
  "at-risk": { label: "Value at Risk", color: "#ef4444", icon: TrendingDown, bg: "hsla(0,70%,14%,0.6)" },
  "protected": { label: "Value Protected", color: "#22c55e", icon: Shield, bg: "hsla(160,60%,14%,0.6)" },
  "created": { label: "Value Created", color: "#a78bfa", icon: TrendingUp, bg: "hsla(265,60%,14%,0.6)" },
};

interface ValueLedgerProps {
  entries: ValueEntry[];
  title?: string;
  period?: string;
}

export function ValueLedger({ entries, title = "Value Ledger", period = "MTD" }: ValueLedgerProps) {
  const atRisk = entries.filter(e => e.type === "at-risk");
  const protected_ = entries.filter(e => e.type === "protected");
  const created = entries.filter(e => e.type === "created");

  const totalRisk = atRisk.reduce((s, e) => s + e.amount, 0);
  const totalProtected = protected_.reduce((s, e) => s + e.amount, 0);
  const totalCreated = created.reduce((s, e) => s + e.amount, 0);

  const groups = [
    { type: "at-risk" as const, items: atRisk, total: totalRisk },
    { type: "protected" as const, items: protected_, total: totalProtected },
    { type: "created" as const, items: created, total: totalCreated },
  ];

  return (
    <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: "0.875rem", padding: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
          {title}
        </span>
        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>{period}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
        {groups.map(({ type, total }) => {
          const meta = TYPE_META[type];
          const Icon = meta.icon;
          return (
            <div key={type} style={{ background: meta.bg, border: `1px solid ${meta.color}25`, borderRadius: "0.625rem", padding: "0.875rem", textAlign: "center" }}>
              <Icon style={{ width: 14, height: 14, color: meta.color, margin: "0 auto 0.375rem" }} />
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: meta.color, letterSpacing: "-0.03em" }}>{formatAmt(total)}</div>
              <div style={{ fontSize: "9px", fontWeight: 600, color: meta.color, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "2px" }}>{meta.label}</div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
        {entries.map((entry, i) => {
          const meta = TYPE_META[entry.type];
          return (
            <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0", borderBottom: i < entries.length - 1 ? "1px solid hsla(0,0%,100%,0.04)" : "none" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.65)" }}>{entry.label}</div>
                {entry.description && <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.3)", marginTop: "1px" }}>{entry.description}</div>}
              </div>
              {entry.domainColor && (
                <span style={{ fontSize: "9px", fontWeight: 600, padding: "1px 6px", borderRadius: "3px", background: `${entry.domainColor}20`, color: entry.domainColor }}>{entry.domain}</span>
              )}
              <span style={{ fontSize: "12px", fontWeight: 700, color: meta.color, flexShrink: 0 }}>{formatAmt(entry.amount)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
