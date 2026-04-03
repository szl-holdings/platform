import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Eye, BarChart3, Zap, CheckCircle2, Shield, Clock, GitBranch, Layers, AlertOctagon, Database, Users } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const CROSS_PACK_ROLES = [
  {
    icon: Eye,
    title: "Portfolio Pressure",
    body: "Lyte aggregates signals from every pack — PRISM Counsel, Terra, Vessels, Aegis, Carlota Jo — and surfaces cross-portfolio pressure in a single executive view. What's stuck, what's at risk, and where leadership attention belongs.",
  },
  {
    icon: BarChart3,
    title: "Movement Tracking",
    body: "Track progress across all active workflows with velocity and delay scoring. See which packs are accelerating, which are stalling, and where throughput has dropped below expectation.",
  },
  {
    icon: AlertOctagon,
    title: "Blocker Detection",
    body: "Approval bottlenecks, ownership gaps, and SLA breaches surfaced before they compound into incidents. Lyte attributes every open blocker to a specific actor and workflow stage.",
  },
  {
    icon: GitBranch,
    title: "Action Routing into Alloy",
    body: "When a signal demands leadership intervention, Lyte routes it into Alloy — structured, contextualized, with the right escalation path already defined. No raw alerts. No ambiguous handoffs.",
  },
  {
    icon: Layers,
    title: "Cross-Pack Observability",
    body: "One command surface above all packs. Executives see portfolio health, not application interfaces. Role-based views ensure leadership sees exactly what they need — nothing more, nothing less.",
  },
  {
    icon: Shield,
    title: "Governance Alignment",
    body: "Lyte exposes governance posture at the portfolio level — pending approvals, audit gaps, and exception rates across all operating packs. Compliance-ready by design.",
  },
];

const PLATFORM_ARCHITECTURE = [
  {
    step: "01",
    title: "Connect across every pack",
    body: "Lyte ingests live signal feeds from PRISM Counsel, Terra, Vessels, Aegis, and Carlota Jo. No manual aggregation. No spreadsheet reconciliation.",
  },
  {
    step: "02",
    title: "Score portfolio pressure",
    body: "PRISM scoring classifies every cross-pack signal by severity, velocity, and blast radius. Leaders see prioritized pressure — not raw data volumes.",
  },
  {
    step: "03",
    title: "Surface blockers before they compound",
    body: "Approval queues, ownership gaps, and workflow drift are surfaced with recommended intervention before the cost accumulates into a consequential incident.",
  },
  {
    step: "04",
    title: "Route into Alloy for governed action",
    body: "When a signal demands action, Alloy takes it from there — structured routing, human approval gates, execution verification, and immutable audit trail.",
  },
];

const WHAT_LYTE_ANSWERS = [
  "Which pack has the highest pressure right now?",
  "What approvals are overdue across all workflows?",
  "Where is portfolio velocity falling below target?",
  "Which blockers need leadership intervention?",
  "What is the current governance and audit posture?",
  "What actions are pending but unassigned?",
];

export default function LytePage() {
  usePageMeta({
    title: "Lyte — Cross-Pack Executive Command | SZL Holdings",
    description: "Lyte is the executive command layer above all SZL Holdings packs. Surface cross-portfolio pressure, blockers, and action routing — with full governance alignment.",
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
                Lyte · Cross-Pack Executive Command
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
                  One command surface above every pack.
                </h1>
                <p
                  style={{
                    fontSize: "clamp(1rem,1.8vw,1.125rem)",
                    lineHeight: 1.72,
                    color: "hsl(214,7%,64%)",
                    maxWidth: "50ch",
                    marginBottom: "0.875rem",
                  }}
                >
                  Lyte is the executive command layer above PRISM Counsel, Terra, Vessels, Aegis, and Carlota Jo. It surfaces cross-portfolio pressure, movement, blockers, and action routing — so leadership sees the whole operating picture without touching individual applications.
                </p>
                <p
                  style={{
                    fontSize: "clamp(0.9375rem,1.6vw,1rem)",
                    lineHeight: 1.72,
                    color: "hsl(214,7%,52%)",
                    maxWidth: "50ch",
                    marginBottom: "2.25rem",
                  }}
                >
                  Paired with Alloy for governed execution. When a signal demands action, Alloy routes it through the right workflow — with approval gates and an immutable audit trail.
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
                {WHAT_LYTE_ANSWERS.map((q, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", marginBottom: "0.75rem" }}>
                    <CheckCircle2 size={14} color="var(--color-lyte)" style={{ marginTop: "2px", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "hsl(214,7%,72%)" }}>{q}</span>
                  </div>
                ))}
                <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--color-szl-border)" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                    {["PRISM Counsel", "Terra", "Vessels", "Aegis", "Carlota Jo"].map(pack => (
                      <span key={pack} style={{ fontSize: "0.6875rem", fontWeight: 600, padding: "2px 7px", borderRadius: "4px", background: "var(--color-lyte-muted)", border: "1px solid var(--color-lyte-border)", color: "var(--color-lyte)", letterSpacing: "0.04em" }}>
                        {pack}
                      </span>
                    ))}
                  </div>
                </div>
              </m.div>
            </div>
          </div>
        </section>

        {/* Cross-pack architecture */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-lyte)", marginBottom: "1rem" }}>
                Platform Role
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "3rem" }}>
                The command layer above every vertical product.
              </h2>
            </m.div>
            <div className="szl-grid-3">
              {CROSS_PACK_ROLES.map((cap, i) => {
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
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "3rem" }}>
                From cross-pack signals to governed executive action.
              </h2>
            </m.div>
            <div className="szl-grid-4" style={{ gap: "1.5rem" }}>
              {PLATFORM_ARCHITECTURE.map((step, i) => (
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

        {/* Alloy pairing */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "grid", gap: "clamp(3rem,6vw,5rem)", alignItems: "center" }} className="lg:grid-cols-2">
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-lyte)", marginBottom: "1rem" }}>
                  Lyte + Alloy
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, marginBottom: "1.25rem" }}>
                  Observability is only half the operating system.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "46ch", marginBottom: "1.5rem" }}>
                  Lyte surfaces the signal. Alloy routes the action — through structured workflows with human approval gates, SLA tracking, and an immutable audit trail. Together they close the loop from signal to confirmed outcome.
                </p>
                <Link href="/alloy-fabric" className="szl-btn-ghost" style={{ paddingLeft: 0 }}>
                  Explore Alloy — Execution Fabric <ArrowRight size={14} />
                </Link>
              </m.div>
              <m.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.10 }}
                className="szl-lyte-card"
                style={{ borderRadius: "0.875rem", padding: "clamp(1.5rem,3vw,2rem)" }}
              >
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1.25rem" }}>
                  The full operating loop
                </p>
                {[
                  { platform: "Lyte", desc: "Cross-pack signals aggregated and scored" },
                  { platform: "Lyte", desc: "Portfolio pressure and blockers surfaced" },
                  { platform: "Lyte", desc: "Executive command view updated" },
                  { platform: "Alloy", desc: "Signal routed with context and escalation path" },
                  { platform: "Alloy", desc: "Human approval gate enforced" },
                  { platform: "Alloy", desc: "Action executed and verified" },
                  { platform: "Alloy", desc: "Immutable audit record created" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: i < 6 ? "0.5rem" : 0 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", fontWeight: 700, padding: "1px 5px", borderRadius: "3px", background: item.platform === "Lyte" ? "var(--color-lyte-muted)" : "var(--color-alloy-muted)", border: `1px solid ${item.platform === "Lyte" ? "var(--color-lyte-border)" : "var(--color-alloy-border)"}`, color: item.platform === "Lyte" ? "var(--color-lyte)" : "var(--color-alloy-light)", letterSpacing: "0.06em", flexShrink: 0 }}>
                      {item.platform}
                    </span>
                    <span style={{ fontSize: "0.8125rem", color: "var(--color-szl-text-muted)" }}>{item.desc}</span>
                  </div>
                ))}
              </m.div>
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
                  Ready to put a command surface across your portfolio?
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "48ch" }}>
                  We work with design partners to deploy Lyte + Alloy across one or more packs, measure portfolio signal coverage, and build a replicable executive operating system from the results.
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
