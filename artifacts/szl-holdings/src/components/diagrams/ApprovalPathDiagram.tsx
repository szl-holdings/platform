import { m, useReducedMotion } from "framer-motion";
import { CheckSquare, Clock, AlertOctagon } from "lucide-react";

const TIERS = [
  { tier: "T1", label: "Auto-cleared", gate: "Automated", color: "hsl(145,62%,46%)", bg: "hsla(145,62%,40%,0.10)", border: "hsla(145,62%,40%,0.25)", width: "25%" },
  { tier: "T2", label: "Single reviewer", gate: "1 approver", color: "hsl(40,90%,54%)", bg: "hsla(40,90%,54%,0.10)", border: "hsla(40,90%,54%,0.25)", width: "25%" },
  { tier: "T3", label: "Dual approval", gate: "2 approvers + rationale", color: "hsl(25,90%,55%)", bg: "hsla(25,90%,55%,0.10)", border: "hsla(25,90%,55%,0.20)", width: "25%" },
  { tier: "T4", label: "Senior authorization", gate: "Senior + full audit", color: "hsl(358,75%,58%)", bg: "hsla(358,75%,58%,0.10)", border: "hsla(358,75%,58%,0.20)", width: "25%" },
];

const PATH_STEPS = [
  { icon: CheckSquare, label: "Trigger", color: "var(--color-lyte-light)" },
  { icon: Clock, label: "Route to tier", color: "hsl(40,90%,54%)" },
  { icon: CheckSquare, label: "Human review", color: "hsl(258,55%,68%)" },
  { icon: CheckSquare, label: "Decision recorded", color: "var(--color-alloy-light)" },
  { icon: AlertOctagon, label: "Execute or reject", color: "hsl(145,62%,46%)" },
];

export function ApprovalPathDiagram() {
  const prefersReduced = useReducedMotion();

  return (
    <div style={{ padding: "1.5rem", background: "hsla(214,12%,6%,0.80)", borderRadius: "0.875rem", border: "1px solid var(--color-szl-border)" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1.25rem" }}>
        Approval Path — Four-Tier Model
      </div>

      {/* Tier bars */}
      <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1.25rem" }}>
        {TIERS.map((tier, i) => (
          <m.div
            key={tier.tier}
            initial={prefersReduced ? false : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.08 }}
            style={{ flex: 1, background: tier.bg, border: `1px solid ${tier.border}`, borderRadius: "0.5rem", padding: "0.875rem 0.75rem" }}
          >
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: tier.color, letterSpacing: "0.04em", marginBottom: "0.375rem" }}>{tier.tier}</div>
            <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "hsl(38,8%,80%)", lineHeight: 1.3, marginBottom: "0.375rem" }}>{tier.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", color: "hsl(214,7%,44%)", letterSpacing: "0.04em", textTransform: "uppercase" }}>{tier.gate}</div>
          </m.div>
        ))}
      </div>

      {/* Risk gradient bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", color: "hsl(214,7%,40%)", letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0 }}>Low risk</span>
        <div style={{ flex: 1, height: "3px", borderRadius: "2px", background: "linear-gradient(to right, hsl(145,62%,46%), hsl(40,90%,54%), hsl(25,90%,55%), hsl(358,75%,58%))" }} />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", color: "hsl(214,7%,40%)", letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0 }}>Irreversible</span>
      </div>

      <div style={{ padding: "0.625rem 0.875rem", background: "hsla(40,90%,54%,0.06)", border: "1px solid hsla(40,90%,54%,0.18)", borderRadius: "0.4375rem" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", fontWeight: 500, color: "hsl(40,90%,54%)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Gate mechanism is non-bypassable · Overrides create mandatory review record
        </span>
      </div>
    </div>
  );
}
