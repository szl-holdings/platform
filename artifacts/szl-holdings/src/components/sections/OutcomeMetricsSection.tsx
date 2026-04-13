import { useState, useEffect, useRef } from "react";
import { m } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

function useAnimatedCounter(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

export function OutcomeMetricsSection() {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const c1 = useAnimatedCounter(40, 1600, inView);
  const c2 = useAnimatedCounter(3, 1400, inView);
  const c3 = useAnimatedCounter(62, 1800, inView);
  const c4 = useAnimatedCounter(19, 1500, inView);
  const c5 = useAnimatedCounter(34, 1700, inView);
  const c6 = useAnimatedCounter(94, 1600, inView);

  const metrics = [
    { value: `${c1}%`, label: "Faster threat detection", sub: "Aegis SOC command vs. manual review", color: "hsl(222,60%,62%)" },
    { value: `${c2}×`, label: "Portfolio visibility improvement", sub: "Terra vs. manual property monitoring", color: "hsl(140,50%,48%)" },
    { value: `${c3}%`, label: "Approval overhead reduction", sub: "Lyte design-partner benchmark", color: "hsl(192,72%,48%)" },
    { value: `+${c4}d`, label: "Distress signal lead time", sub: "Before public filing — Terra intelligence", color: "hsl(140,50%,48%)" },
    { value: `${c5}d`, label: "Pre-designation lead time", sub: "Before sanctions — Vessels anomaly detection", color: "hsl(206,72%,52%)" },
    { value: `${c6}%`, label: "MITRE ATT&CK coverage", sub: "Continuous simulation — Aegis platform", color: "hsl(222,60%,62%)" },
  ];

  return (
    <section ref={ref} style={{ borderBottom: "1px solid var(--color-szl-border)", background: "hsla(192,72%,48%,0.015)" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
        <m.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <div style={{ marginBottom: "3rem", maxWidth: "42rem" }}>
            <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "0.875rem" }}>
              Quantified outcomes
            </p>
            <h2 style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15, color: "hsl(38,8%,94%)" }}>
              What the platform produces — in numbers.
            </h2>
            <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--color-szl-text-secondary)", marginTop: "0.75rem" }}>
              From design-partner benchmarks and operational proof across Vessels, Terra, and Aegis. Sample data — not a financial guarantee.
            </p>
          </div>
        </m.div>
        <div style={{ display: "grid", gap: "1rem" }} className="sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((m_, i) => (
            <m.div
              key={m_.label}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              style={{
                padding: "1.75rem",
                borderRadius: "0.875rem",
                background: "hsla(0,0%,100%,0.025)",
                border: "1px solid hsla(0,0%,100%,0.07)",
              }}
            >
              <div style={{ fontSize: "clamp(2rem,3.5vw,2.75rem)", fontWeight: 800, letterSpacing: "-0.035em", color: m_.color, lineHeight: 1, marginBottom: "0.625rem" }}>
                {m_.value}
              </div>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(38,8%,90%)", marginBottom: "0.25rem" }}>{m_.label}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", lineHeight: 1.45 }}>{m_.sub}</p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
