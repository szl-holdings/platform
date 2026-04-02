import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Eye, BarChart3, Zap, CheckCircle2, Shield, Clock, GitBranch } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const CAPABILITIES = [
  {
    icon: Eye,
    title: "Signal Detection",
    body: "PRISM monitors your operational surface — approval queues, ownership gaps, workflow drift, and performance anomalies — and surfaces them the moment they cross threshold. Not after the fact.",
  },
  {
    icon: BarChart3,
    title: "Approval Latency Tracking",
    body: "See exactly where decisions are stalling across every system. Which approvals are overdue, who owns them, and what risk they carry if they stay stuck.",
  },
  {
    icon: GitBranch,
    title: "Ownership Gap Detection",
    body: "Most execution failures aren't technical. They're accountability failures. Lyte attributes every open item to a specific owner and surfaces gaps before they become incidents.",
  },
  {
    icon: Clock,
    title: "Workflow Friction Scoring",
    body: "Lyte scores the friction in every active workflow — cycle time, handoff latency, exception rate — so operators know exactly where to intervene before the cost compounds.",
  },
  {
    icon: Shield,
    title: "Risk Classification",
    body: "Every signal is classified by severity, velocity, and blast radius. Lyte distinguishes noise from genuine risk so operators act on what matters.",
  },
  {
    icon: Zap,
    title: "Cross-System Visibility",
    body: "Lyte connects to the tools your team already uses — without a data warehouse. A unified command surface without a six-month integration project.",
  },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Connect your operating surface", body: "Lyte integrates with the approval systems, task tools, CRMs, and communication layers your team runs on. No rip and replace required." },
  { step: "02", title: "Surface signals automatically", body: "PRISM begins classifying signals from your connected systems: what's stuck, who owns it, how long it's been stalled, and what risk it carries." },
  { step: "03", title: "Intervene before damage compounds", body: "Operators see a unified command view — signal priority, ownership attribution, and recommended intervention — not a wall of raw data." },
  { step: "04", title: "Route through Alloy", body: "When a signal demands action, Alloy takes it from there — routing, approval gates, execution verification, and audit trail." },
];

export default function LytePage() {
  usePageMeta({
    title: "Lyte — Business Observability Platform",
    description: "Lyte is the business observability platform built for operators. Surface execution risk, ownership drift, and workflow friction before it compounds.",
    canonical: "https://szlholdings.com/lyte",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        {/* Hero */}
        <section
          className="szl-grid-texture szl-depth-glow-lyte"
          style={{
            paddingTop: "var(--space-hero-pt)",
            paddingBottom: "clamp(5rem,9vw,7rem)",
            borderBottom: "1px solid var(--color-szl-border)",
          }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="szl-badge-lyte" style={{ borderRadius: "9999px", marginBottom: "1.75rem", display: "inline-block" }}>
                Lyte · Business Observability
              </span>
            </m.div>

            <div style={{ display: "grid", gap: "clamp(2.5rem,5vw,4rem)", alignItems: "start" }} className="lg:grid-cols-[1.2fr_0.8fr]">
              <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05 }}>
                <h1
                  style={{
                    fontSize: "clamp(2.5rem,5.5vw,4.25rem)",
                    fontWeight: 600,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.05,
                    marginBottom: "1.5rem",
                    maxWidth: "20ch",
                  }}
                >
                  See the signal before it becomes the incident.
                </h1>
                <p
                  style={{
                    fontSize: "clamp(1rem,1.8vw,1.125rem)",
                    lineHeight: 1.72,
                    color: "hsl(214,7%,64%)",
                    maxWidth: "50ch",
                    marginBottom: "2.25rem",
                  }}
                >
                  Lyte is a business observability platform that surfaces execution risk, ownership
                  drift, approval latency, and workflow friction — before the damage is done. One
                  command surface across all the systems your team already runs on.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  <Link href="/demo" className="szl-btn-primary">
                    See Lyte in action <ArrowRight size={15} />
                  </Link>
                  <Link href="/contact" className="szl-btn-secondary">
                    Book a design partner session
                  </Link>
                </div>
              </m.div>

              <m.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.15 }}
                className="szl-lyte-card"
                style={{ borderRadius: "0.875rem", padding: "clamp(1.25rem,3vw,1.75rem)" }}
              >
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>
                  What Lyte answers
                </p>
                {[
                  "What is stuck right now and who owns it?",
                  "Which approvals are overdue and what's at risk?",
                  "Where is workflow friction accumulating?",
                  "What decisions haven't been made and why?",
                  "Which signals cross the threshold for action?",
                ].map((q, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", marginBottom: "0.75rem" }}>
                    <CheckCircle2 size={14} color="var(--color-lyte)" style={{ marginTop: "2px", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "hsl(214,7%,72%)" }}>{q}</span>
                  </div>
                ))}
                <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--color-szl-border)" }}>
                  <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,50%)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                    Paired with Alloy for governed action
                  </p>
                </div>
              </m.div>
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-lyte)", marginBottom: "1rem" }}>
                Capabilities
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                Every piece of the observability stack, purpose-built for operations.
              </h2>
            </m.div>
            <div className="szl-grid-3">
              {CAPABILITIES.map((cap, i) => {
                const Icon = cap.icon;
                return (
                  <m.div
                    key={cap.title}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.38, delay: i * 0.06 }}
                    className="szl-card"
                    style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}
                  >
                    <div
                      style={{
                        width: "36px", height: "36px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "var(--color-lyte-muted)",
                        border: "1px solid var(--color-lyte-border)",
                        borderRadius: "0.4375rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <Icon size={16} color="var(--color-lyte)" />
                    </div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.625rem" }}>{cap.title}</h3>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{cap.body}</p>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>
                How it works
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                From connection to command surface in one operating flow.
              </h2>
            </m.div>
            <div className="szl-grid-4" style={{ gap: "1.5rem" }}>
              {HOW_IT_WORKS.map((step, i) => (
                <m.div
                  key={step.step}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.38, delay: i * 0.08 }}
                  className="szl-card"
                  style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}
                >
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 600, color: "var(--color-lyte)", letterSpacing: "0.08em", marginBottom: "0.875rem" }}>
                    {step.step}
                  </div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.625rem" }}>{step.title}</h3>
                  <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{step.body}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="szl-lyte-card szl-grid-cta"
              style={{ borderRadius: "1rem", padding: "clamp(2.5rem,5vw,4rem)", gap: "2.5rem", alignItems: "center" }}
            >
              <div>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, marginBottom: "0.875rem" }}>
                  Ready to instrument your first workflow?
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "48ch" }}>
                  We work with design partners to apply Lyte to one high-friction workflow, measure
                  the improvement, and build a replicable operating system from the results.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flexShrink: 0 }}>
                <Link href="/contact" className="szl-btn-primary">
                  Book a design partner session <ArrowRight size={14} />
                </Link>
                <Link href="/demo" className="szl-btn-secondary" style={{ textAlign: "center" }}>
                  See the interactive demo
                </Link>
              </div>
            </m.div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
