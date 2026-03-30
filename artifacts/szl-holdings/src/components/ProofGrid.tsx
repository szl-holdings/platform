import { useRef, useEffect, useState } from "react";
import { m, useInView } from "framer-motion";

const KPI_METRICS = [
  { numericValue: 340, prefix: "$", suffix: "K", label: "Revenue recovered / quarter", sublabel: "Approval latency detection", accent: "hsl(192,80%,48%)", accentRgb: "6,182,212" },
  { numericValue: 34, prefix: "", suffix: " days", label: "Dark vessel pre-detection lead", sublabel: "Before formal designation", accent: "hsl(210,78%,44%)", accentRgb: "34,104,175" },
  { numericValue: 3.4, prefix: "", suffix: "×", label: "Decision velocity gain", sublabel: "Workflow orchestration", accent: "hsl(222,68%,58%)", accentRgb: "86,122,214" },
  { numericValue: 40, prefix: "", suffix: "%", label: "Lower infrastructure overhead", sublabel: "Shared ecosystem architecture", accent: "hsl(38,55%,58%)", accentRgb: "191,152,82" },
];

const proofs = [
  {
    platform: "Lyte",
    view: "Command View",
    desc: "Signals surfaced, owners identified, value at risk quantified across business operations.",
    accent: "hsl(192, 80%, 48%)",
    accentRgb: "6, 182, 212",
    href: "/lyte-command-center/",
    status: "Live",
  },
  {
    platform: "Vessels",
    view: "Fleet Command",
    desc: "10 vessels tracked. Route visibility, voyage economics, and exceptions in one operational layer.",
    accent: "hsl(210, 78%, 44%)",
    accentRgb: "34, 104, 175",
    href: "/vessels/",
    status: "Live",
  },
  {
    platform: "Alloy",
    view: "Architecture",
    desc: "6-layer pipeline: Inputs → Normalization → Reasoning → Orchestration → Outputs → Governance.",
    accent: "hsl(222, 68%, 58%)",
    accentRgb: "86, 122, 214",
    href: "/alloy/",
    status: "Live",
  },
  {
    platform: "Lyte",
    view: "Lyte Readiness",
    desc: "Lyte Readiness — execution tracking, maturity scoring, and go/no-go gate management as a first-class Lyte module.",
    accent: "hsl(190,90%,55%)",
    accentRgb: "6, 182, 212",
    href: "/lyte-command-center/",
    status: "Live",
  },
];

function CountUpKPI({ numericValue, prefix, suffix, label, sublabel, accent, accentRgb }: (typeof KPI_METRICS)[0]) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [display, setDisplay] = useState(0);
  const isDecimal = numericValue % 1 !== 0;

  useEffect(() => {
    if (!inView) return;
    const start = Date.now();
    const duration = 1400;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = eased * numericValue;
      setDisplay(isDecimal ? Math.round(val * 10) / 10 : Math.floor(val));
      if (progress < 1) requestAnimationFrame(tick);
      else setDisplay(numericValue);
    };
    requestAnimationFrame(tick);
  }, [inView, numericValue, isDecimal]);

  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        padding: "1.375rem 1.5rem",
        borderRadius: "4px",
        background: `rgba(${accentRgb}, 0.04)`,
        border: `1px solid rgba(${accentRgb}, 0.12)`,
        borderTop: `1px solid rgba(${accentRgb}, 0.22)`,
        transition: "all 0.22s ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = `rgba(${accentRgb}, 0.07)`;
        el.style.borderColor = `rgba(${accentRgb}, 0.24)`;
        el.style.boxShadow = `0 0 18px rgba(${accentRgb}, 0.09)`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = `rgba(${accentRgb}, 0.04)`;
        el.style.borderColor = `rgba(${accentRgb}, 0.12)`;
        el.style.boxShadow = "none";
      }}
    >
      <div style={{
        fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
        fontWeight: "700",
        letterSpacing: "-0.03em",
        color: accent,
        fontFamily: "'JetBrains Mono', 'Space Mono', monospace",
        lineHeight: "1.1",
        marginBottom: "0.375rem",
      }}>
        {prefix}{isDecimal ? display.toFixed(1) : display}{suffix}
      </div>
      <p style={{
        fontSize: "12.5px",
        fontWeight: "600",
        color: "hsl(38,12%,82%)",
        marginBottom: "0.2rem",
        letterSpacing: "-0.005em",
        fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
      }}>
        {label}
      </p>
      <p style={{
        fontSize: "11px",
        color: "hsl(210,5%,44%)",
        fontFamily: "'JetBrains Mono', 'Space Mono', monospace",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}>
        {sublabel}
      </p>
    </m.div>
  );
}

export function ProofGrid() {
  return (
    <section
      style={{
        padding: "5rem 0",
        borderTop: "1px solid var(--color-szl-border)",
        background: "var(--color-szl-bg)",
      }}
    >
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <p style={{
            fontFamily: "'JetBrains Mono', 'Space Mono', monospace",
            fontSize: "0.6875rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-szl-text-muted)",
            marginBottom: "0.75rem",
          }}>
            Proof of Execution
          </p>
          <h2 style={{
            fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
            fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
            fontWeight: 700,
            letterSpacing: "-0.026em",
            color: "var(--color-szl-text)",
            lineHeight: 1.06,
          }}>
            Built. Running. Delivering.
          </h2>
        </m.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {KPI_METRICS.map((kpi, i) => (
            <m.div
              key={kpi.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <CountUpKPI key={kpi.label} {...kpi} />
            </m.div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {proofs.map((p, i) => (
            <m.a
              key={`${p.platform}-${p.view}`}
              href={p.href}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.48, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="block rounded-sm transition-all duration-220"
              style={{
                textDecoration: "none",
                padding: "1.375rem 1.5rem",
                background: "var(--color-szl-surface)",
                border: "1px solid var(--color-szl-border)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "var(--color-szl-elevated)";
                el.style.borderColor = `rgba(${p.accentRgb}, 0.28)`;
                el.style.boxShadow = `0 0 16px rgba(${p.accentRgb}, 0.10)`;
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "var(--color-szl-surface)";
                el.style.borderColor = "var(--color-szl-border)";
                el.style.boxShadow = "none";
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: p.accent, display: "inline-block", boxShadow: `0 0 5px ${p.accent}60` }} />
                <span style={{ fontFamily: "'JetBrains Mono', 'Space Mono', monospace", fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: p.accent }}>
                  {p.platform}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', 'Space Mono', monospace", fontSize: "0.625rem", color: "var(--color-szl-text-faint)", marginLeft: "auto", letterSpacing: "0.04em" }}>
                  {p.status}
                </span>
              </div>
              <p style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif", fontSize: "0.9375rem", fontWeight: 600, color: "var(--color-szl-text)", marginBottom: "0.5rem", letterSpacing: "-0.01em" }}>
                {p.view}
              </p>
              <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "var(--color-szl-text-secondary)" }}>
                {p.desc}
              </p>
            </m.a>
          ))}
        </div>
      </div>
    </section>
  );
}
