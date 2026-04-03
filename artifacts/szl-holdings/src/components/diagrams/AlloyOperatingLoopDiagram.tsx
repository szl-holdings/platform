import { m, useReducedMotion } from "framer-motion";

const LOOP_STAGES = [
  {
    id: "signals",
    label: "Signals",
    sublabel: "Raw inputs from packs & integrations",
    color: "hsl(191,92%,44%)",
    bg: "hsla(191,92%,44%,0.08)",
    border: "hsla(191,92%,44%,0.22)",
  },
  {
    id: "normalization",
    label: "Normalization",
    sublabel: "Structured, typed, de-duplicated",
    color: "hsl(200,80%,52%)",
    bg: "hsla(200,80%,52%,0.08)",
    border: "hsla(200,80%,52%,0.22)",
  },
  {
    id: "evaluation",
    label: "Evaluation",
    sublabel: "Severity, blast radius, velocity",
    color: "hsl(214,70%,60%)",
    bg: "hsla(214,70%,60%,0.08)",
    border: "hsla(214,70%,60%,0.22)",
  },
  {
    id: "recommendation",
    label: "Recommendation",
    sublabel: "Priority scored, action proposed",
    color: "hsl(228,60%,62%)",
    bg: "hsla(228,60%,62%,0.08)",
    border: "hsla(228,60%,62%,0.22)",
  },
  {
    id: "routing",
    label: "Routing",
    sublabel: "Owner, channel, escalation path",
    color: "hsl(40,85%,55%)",
    bg: "hsla(40,85%,55%,0.08)",
    border: "hsla(40,85%,55%,0.22)",
  },
  {
    id: "execution",
    label: "Execution",
    sublabel: "HITL gate → confirmed action",
    color: "hsl(28,90%,54%)",
    bg: "hsla(28,90%,54%,0.08)",
    border: "hsla(28,90%,54%,0.22)",
  },
  {
    id: "audit",
    label: "Audit Trace",
    sublabel: "Immutable, attributed, exportable",
    color: "hsl(142,60%,46%)",
    bg: "hsla(142,60%,40%,0.09)",
    border: "hsla(142,60%,40%,0.24)",
  },
];

export function AlloyOperatingLoopDiagram({ compact = false }: { compact?: boolean }) {
  const prefersReduced = useReducedMotion();

  return (
    <div
      style={{
        padding: compact ? "1.25rem" : "1.75rem",
        background: "hsla(214,12%,6%,0.85)",
        borderRadius: "0.875rem",
        border: "1px solid var(--color-szl-border)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.6875rem",
          fontWeight: 500,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--color-szl-text-muted)",
          marginBottom: "1.25rem",
        }}
      >
        Alloy Operating Loop
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          overflowX: "auto",
          paddingBottom: "0.25rem",
        }}
      >
        {LOOP_STAGES.map((stage, i) => (
          <div key={stage.id} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <m.div
              initial={prefersReduced ? false : { opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.38, delay: i * 0.07 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.375rem",
                padding: compact ? "0.75rem 0.875rem" : "1rem 1.125rem",
                background: stage.bg,
                border: `1px solid ${stage.border}`,
                borderRadius: "0.625rem",
                minWidth: compact ? "82px" : "96px",
              }}
            >
              <div
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: stage.color,
                  boxShadow: `0 0 6px ${stage.color}66`,
                }}
              />
              <span
                style={{
                  fontSize: compact ? "0.75rem" : "0.8125rem",
                  fontWeight: 600,
                  color: "hsl(38,8%,88%)",
                  letterSpacing: "-0.012em",
                  textAlign: "center",
                }}
              >
                {stage.label}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.5rem",
                  fontWeight: 500,
                  color: "hsl(214,7%,46%)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  textAlign: "center",
                  lineHeight: 1.4,
                }}
              >
                {stage.sublabel}
              </span>
            </m.div>

            {i < LOOP_STAGES.length - 1 && (
              <m.div
                initial={prefersReduced ? false : { opacity: 0, scaleX: 0 }}
                whileInView={{ opacity: 1, scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.28, delay: i * 0.07 + 0.22 }}
                style={{ transformOrigin: "left", flexShrink: 0 }}
              >
                <svg width="24" height="14" viewBox="0 0 24 14" fill="none">
                  <path d="M2 7 H18" stroke="hsl(214,7%,26%)" strokeWidth="1.5" />
                  <path d="M14 3 L22 7 L14 11" stroke="hsl(214,7%,26%)" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
              </m.div>
            )}
          </div>
        ))}
      </div>

      {!compact && (
        <div style={{ marginTop: "1.25rem", display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
          {[
            { label: "Human-in-the-loop at Routing & Execution", color: "hsl(40,85%,55%)" },
            { label: "Tenant-isolated at every stage", color: "hsl(142,60%,46%)" },
            { label: "Full lineage exportable", color: "hsl(191,92%,44%)" },
          ].map((t) => (
            <div key={t.label} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <div
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: t.color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.5625rem",
                  fontWeight: 500,
                  color: "hsl(214,7%,44%)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {t.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
