import { useEffect } from "react";
import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const OPERATING_THESIS = [
  {
    title: "Systems, not features",
    body: "Features are copied. Systems — the interconnected logic of how an organization actually works — are not. Every platform is designed around the operational system, not the feature request.",
  },
  {
    title: "Observability before optimization",
    body: "You cannot improve what you cannot see. The first step in every engagement is instrumenting the reality of how the system behaves — not how leadership assumes it behaves.",
  },
  {
    title: "Operators, not consultants",
    body: "SZL Holdings does not drop recommendations. It builds systems, operates them, and owns the outcomes. Skin in the game is a design constraint, not a philosophy.",
  },
  {
    title: "Ship to learn",
    body: "Production is the only true test environment. Release early, measure relentlessly, and let real operational context drive the next iteration.",
  },
];

const FOCUS_AREAS = [
  {
    title: "Business Observability",
    desc: "Designing systems that surface risk, latency, and workflow friction before they hit execution — not after.",
  },
  {
    title: "Workflow Design",
    desc: "Building structured operational workflows that route action, reduce latency, and close ownership gaps.",
  },
  {
    title: "Command Systems",
    desc: "Creating command-centered product surfaces that turn signal into accountable action.",
  },
  {
    title: "Product Architecture",
    desc: "Designing the system architecture behind platforms that operate at institutional scale.",
  },
  {
    title: "Execution Models",
    desc: "High-trust operational support for principals with complex, high-stakes environments.",
  },
  {
    title: "Signal-to-Action Thinking",
    desc: "Designing the full pipeline — from raw signal to owner-identified, value-quantified, action-routed output.",
  },
];

const SELECTED_WORK = [
  {
    title: "Approval Latency Detection — Lyte",
    problem: "A logistics operator had approval queues stalling at 48–72 hours — invisible to leadership.",
    solution: "Built a severity-ranked observability layer compressing 240 operational signals into a prioritized queue with explainable root cause context.",
    result: "Approval cycle reduced from 48 hours to 11 hours. Revenue leakage recovered: $340K/quarter.",
    platform: "Lyte",
    accent: "hsl(190,90%,55%)",
  },
  {
    title: "Pre-Designation Dark Vessel Detection — Vessels",
    problem: "A commodity trader needed to identify sanctions exposure before regulatory designation — not after.",
    solution: "Implemented behavioral fingerprinting across 52K vessels to detect AIS anomalies and pattern laundering 30+ days before formal designation.",
    result: "Client avoided $12M in exposure on two contracts. Became the foundation for the Vessels platform.",
    platform: "Vessels",
    accent: "hsl(205,85%,55%)",
  },
  {
    title: "Workflow Orchestration Engine — Alloy",
    problem: "Manual, inconsistent workflow routing was creating ownership gaps across a multi-team operation.",
    solution: "Designed a 6-layer orchestration engine handling signal ingestion, normalization, reasoning, routing, outputs, and governance with human approval gates at every critical step.",
    result: "Operational decisions accelerated by 3.4x. Zero routing failures across 2,400 workflow executions.",
    platform: "Alloy",
    accent: "hsl(214,80%,65%)",
  },
];

export default function FounderPage() {
  useEffect(() => {
    document.title = "Stephen Lutar | Founder and Operator";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "Stephen Lutar is the founder behind SZL Holdings, building systems that connect observability, execution, workflow design, and command-centered thinking.");
    }
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <Navbar />

      <main className="pt-24">
        <section style={{ padding: "4rem 0 3rem" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "0.75rem" }}>
                Founder
              </p>
              <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: "700", letterSpacing: "-0.025em", color: "hsl(38,12%,94%)", lineHeight: "1.08", marginBottom: "1.25rem" }}>
                Builder. Operator. Systems thinker.
              </h1>
              <p style={{ fontSize: "1rem", lineHeight: "1.7", color: "hsl(210,5%,58%)", maxWidth: "36rem" }}>
                Stephen Lutar builds command-centered systems that connect visibility, workflow discipline, and execution across products, operations, and modern business environments.
              </p>
            </m.div>
          </div>
        </section>

        <section style={{ padding: "2rem 0 4rem", borderTop: "1px solid hsla(0,0%,100%,0.04)" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "1.25rem" }}>
              Operating Thesis
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {OPERATING_THESIS.map((t, i) => (
                <m.div
                  key={t.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.48, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    padding: "1.375rem 1.5rem",
                    borderRadius: "0.75rem",
                    background: "hsla(0,0%,100%,0.025)",
                    border: "1px solid hsla(0,0%,100%,0.06)",
                  }}
                >
                  <p style={{ fontSize: "13.5px", fontWeight: "600", color: "hsl(38,12%,88%)", marginBottom: "0.5rem", letterSpacing: "-0.005em" }}>{t.title}</p>
                  <p style={{ fontSize: "12.5px", lineHeight: "1.65", color: "hsl(210,5%,55%)" }}>{t.body}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "3rem 0", borderTop: "1px solid hsla(0,0%,100%,0.04)", background: "hsl(210,12%,6%)" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "1.25rem" }}>
              Areas of Focus
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {FOCUS_AREAS.map((f, i) => (
                <m.div
                  key={f.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    padding: "1.125rem 1.25rem",
                    borderRadius: "0.75rem",
                    background: "hsla(0,0%,100%,0.02)",
                    border: "1px solid hsla(0,0%,100%,0.06)",
                  }}
                >
                  <p style={{ fontSize: "13px", fontWeight: "600", color: "hsl(38,12%,85%)", marginBottom: "0.35rem", letterSpacing: "-0.005em" }}>{f.title}</p>
                  <p style={{ fontSize: "12px", lineHeight: "1.6", color: "hsl(210,5%,52%)" }}>{f.desc}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "3rem 0", borderTop: "1px solid hsla(0,0%,100%,0.04)" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "1.25rem" }}>
              Selected Work
            </p>
            <div className="space-y-4">
              {SELECTED_WORK.map((w, i) => (
                <m.div
                  key={w.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    padding: "1.5rem",
                    borderRadius: "0.875rem",
                    background: "hsla(0,0%,100%,0.025)",
                    border: "1px solid hsla(0,0%,100%,0.06)",
                    borderLeft: `3px solid ${w.accent}60`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
                    <span style={{ fontSize: "10px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", color: w.accent }}>
                      {w.platform}
                    </span>
                    <p style={{ fontSize: "14px", fontWeight: "700", color: "hsl(38,12%,90%)", letterSpacing: "-0.008em" }}>{w.title}</p>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      { label: "Problem", text: w.problem },
                      { label: "System Built", text: w.solution },
                      { label: "Outcome", text: w.result },
                    ].map((item) => (
                      <div key={item.label}>
                        <p style={{ fontSize: "10px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "0.375rem" }}>
                          {item.label}
                        </p>
                        <p style={{ fontSize: "12.5px", lineHeight: "1.58", color: "hsl(210,5%,55%)" }}>{item.text}</p>
                      </div>
                    ))}
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "3rem 0", borderTop: "1px solid hsla(0,0%,100%,0.04)", background: "hsl(210,12%,6%)" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "0.75rem" }}>
              Why This Work Matters
            </p>
            <div className="max-w-[640px]">
              <p style={{ fontSize: "1.0625rem", lineHeight: "1.72", color: "hsl(210,5%,58%)", marginBottom: "2rem" }}>
                Most organizations run on invisible systems — processes that nobody designed, workflows that nobody owns, signals that nobody reads until the damage is already compounding. The systems built here are designed to make those invisible things visible, and to route action before slippage becomes crisis.
              </p>
              <div style={{ display: "flex", gap: "1rem" }}>
                <Link
                  href="/contact"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "0.625rem 1.25rem",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "hsl(210,12%,6%)",
                    background: "hsl(210,8%,84%)",
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "hsl(38,15%,96%)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "hsl(210,8%,84%)";
                  }}
                >
                  Start a Conversation
                  <ArrowRight size={13} strokeWidth={2.5} />
                </Link>
                <Link
                  href="/"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "0.625rem 1.25rem",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "hsl(210,5%,55%)",
                    background: "transparent",
                    border: "1px solid hsla(0,0%,100%,0.08)",
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "hsl(38,12%,88%)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,55%)";
                  }}
                >
                  View the Ecosystem
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
