import { m } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight, Eye, BarChart3, Zap, CheckCircle2, Shield, Clock, GitBranch,
  Layers, AlertOctagon, Database, Users, Building, Briefcase, Target,
  TrendingUp, Filter, ChevronDown, ChevronUp
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useState } from "react";

const WHO_ITS_FOR = [
  {
    icon: Briefcase,
    role: "Chief Operating Officer",
    description: "Portfolio-wide operational visibility without touching individual applications. Pressure, blockers, and governance posture in one command surface.",
  },
  {
    icon: Building,
    role: "General Counsel / CLO",
    description: "Cross-portfolio legal risk, pending approvals, and audit trail quality — surfaced before counsel is fielding questions they shouldn't need to ask.",
  },
  {
    icon: Target,
    role: "Chief Risk Officer",
    description: "Cross-pack exception rates, stalled approvals, and governance deviation — quantified and attributed before they compound into reportable incidents.",
  },
  {
    icon: Users,
    role: "Portfolio Operations Lead",
    description: "Visibility across every active pack and workflow — velocity, blockers, ownership gaps, and SLA status without managing five separate dashboards.",
  },
  {
    icon: TrendingUp,
    role: "Capital / Board-Level Reviewer",
    description: "Audit posture, workflow throughput, and governance coverage — structured for capital review and investor diligence, not internal operational use.",
  },
];

const PROBLEMS_SOLVED = [
  {
    problem: "No single view of portfolio pressure",
    before: "Leadership assembles portfolio status from five separate application dashboards, static reports, and Slack threads — by the time the picture is complete, conditions have changed.",
    after: "Lyte aggregates live signals from every pack into one command surface. Portfolio pressure is visible in real time — not reconstructed in a slide deck.",
  },
  {
    problem: "Blockers compound before leadership knows",
    before: "Approval bottlenecks, ownership gaps, and workflow drift become incidents only after they've compounded. Leadership learns about them when they're already consequential.",
    after: "Lyte surfaces blockers when they form — with attribution (who owns it), impact scoring (what's at risk), and a clear escalation path before the cost accumulates.",
  },
  {
    problem: "Signals demand action but routing is ambiguous",
    before: "A dashboard shows something is wrong. Figuring out who acts, through what channel, and with what authority takes hours of coordination — if it happens at all.",
    after: "Lyte routes signals directly into Alloy with context already structured. The right person gets the right action with the right authority — and the outcome is tracked.",
  },
  {
    problem: "Governance posture is reconstructed, not visible",
    before: "Audit readiness is built when someone asks for it. Pending approvals, exception logs, and compliance gaps are aggregated manually under pressure.",
    after: "Lyte exposes governance posture at the portfolio level continuously — pending approvals, exception rates, audit gaps, and compliance coverage, all attributed and current.",
  },
];

const SIGNAL_INPUTS = [
  { source: "PRISM Counsel", signals: "Matter velocity, approval queue depth, settlement exposure, deadline proximity, carrier signal deviations" },
  { source: "Terra", signals: "Acquisition pipeline pressure, diligence checklist completion, LP approval status, distress signal accumulation" },
  { source: "Vessels", signals: "Voyage twin exceptions, pre-arrival readiness, OFAC screening flags, weather exposure threshold breaches" },
  { source: "Aegis", signals: "KEV exposure delta, incident response SLA status, identity anomaly accumulation, analyst queue depth" },
  { source: "Carlota Jo", signals: "Engagement milestone status, delivery confirmation gaps, client communication health, service SLA exceptions" },
  { source: "Alloy", signals: "Workflow execution status, approval gate completions, escalation events, audit record creation rate" },
];

const PRIORITIZATION_MODEL = [
  { dimension: "Severity", description: "How consequential is this signal if unaddressed? Scored by downstream impact, escalation likelihood, and blast radius." },
  { dimension: "Velocity", description: "How fast is this situation evolving? Rapid-moving signals surface higher regardless of current severity." },
  { dimension: "Ownership gap", description: "Is there a clear owner with the authority to act? Unassigned signals with high severity escalate automatically." },
  { dimension: "SLA proximity", description: "How close is this signal to a deadline, threshold, or contractual commitment? Time-weighted scoring applied." },
  { dimension: "Cross-pack blast radius", description: "Does this signal in one pack create exposure in another? Compound risk scored and surfaced to portfolio leadership." },
];

const ROLE_BENEFITS = [
  {
    icon: Eye,
    title: "Portfolio Pressure",
    body: "Aggregated signals from every pack scored and ranked by severity. Leadership sees what needs attention — not a raw data dump.",
  },
  {
    icon: BarChart3,
    title: "Movement Tracking",
    body: "Pack-level velocity and delay scoring. Which workflows are accelerating, which are stalling, and where throughput has dropped below target.",
  },
  {
    icon: AlertOctagon,
    title: "Blocker Detection",
    body: "Approval bottlenecks, ownership gaps, and SLA breaches surfaced with attribution. Every open blocker tied to a specific actor and stage.",
  },
  {
    icon: GitBranch,
    title: "Action Routing via Alloy",
    body: "Signals that demand leadership intervention route into Alloy — structured, contextualized, with the escalation path defined. No raw alerts.",
  },
  {
    icon: Layers,
    title: "Cross-Pack Observability",
    body: "One command surface above all packs. Role-based views ensure leadership sees what they need — nothing more, nothing less.",
  },
  {
    icon: Shield,
    title: "Governance Alignment",
    body: "Portfolio-level governance posture — pending approvals, audit gaps, and exception rates across all packs. Compliance-ready by design.",
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
    body: "Every cross-pack signal is scored by severity, velocity, ownership gap, SLA proximity, and blast radius. Leaders see ranked pressure — not raw data volumes.",
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

const FAQS = [
  {
    q: "Is Lyte a dashboard or an operating system?",
    a: "Lyte is an operating system. Dashboards show what happened. Lyte surfaces what's happening and what needs to happen next — with action routing via Alloy so signals don't stay signals.",
  },
  {
    q: "Does Lyte require all packs to be deployed?",
    a: "No. Lyte can operate above one, two, or all packs. We typically instrument Lyte above the most critical pack first, then expand coverage as additional packs are deployed. The value compounds with each pack added.",
  },
  {
    q: "How does Lyte relate to Alloy?",
    a: "Lyte is the observability and command layer. Alloy is the execution and accountability layer. Lyte tells you what's happening and what needs to change. Alloy routes that signal into a structured workflow — with human approval, tracking, and an immutable audit record. Together, they close the loop from signal to confirmed outcome.",
  },
  {
    q: "Can Lyte take autonomous action?",
    a: "No. Lyte surfaces signals and routes them into Alloy for structured workflow execution. Every consequential action requires human approval through an Alloy gate. Lyte is an observability and command surface — not an autonomous execution engine.",
  },
  {
    q: "What does the design partner engagement look like?",
    a: "We start by instrumenting Lyte above one or two existing packs — real workflows, real signal feeds, real pressure. Over a focused engagement, we calibrate signal scoring, configure role-based views, and connect Alloy routing for the most critical intervention paths. You get measurable portfolio visibility before any broad commitment.",
  },
  {
    q: "How long does it take to see value?",
    a: "Most design partners see meaningful signal coverage within the first two to three weeks of instrumentation — once Lyte is connected to live pack data and signal scoring is calibrated to your operating reality.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderRadius: "8px",
        background: "hsla(0,0%,100%,0.025)",
        border: "1px solid hsla(0,0%,100%,0.07)",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.125rem 1.375rem",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          gap: "1rem",
        }}
      >
        <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,8%,88%)", letterSpacing: "-0.012em", lineHeight: 1.4 }}>{q}</span>
        {open ? (
          <ChevronUp size={15} color="hsl(214,7%,50%)" style={{ flexShrink: 0 }} />
        ) : (
          <ChevronDown size={15} color="hsl(214,7%,50%)" style={{ flexShrink: 0 }} />
        )}
      </button>
      {open && (
        <div style={{ padding: "0 1.375rem 1.25rem", fontSize: "0.875rem", lineHeight: 1.7, color: "hsl(214,7%,60%)" }}>
          {a}
        </div>
      )}
    </div>
  );
}

export default function LytePage() {
  usePageMeta({
    title: "Lyte — Cross-Pack Executive Command | SZL Holdings",
    description: "Lyte is the executive command layer above all SZL Holdings packs. Surface cross-portfolio pressure, blockers, and action routing — with full governance alignment.",
    canonical: "https://szlholdings.com/products/lyte",
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

        {/* Who it's for */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-lyte)", marginBottom: "1rem" }}>
                Who It's For
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "34ch", marginBottom: "3rem" }}>
                Built for the executives who need the whole picture — not one application's view of it.
              </h2>
            </m.div>
            <div style={{ display: "grid", gap: "1rem" }} className="lg:grid-cols-3 md:grid-cols-2">
              {WHO_ITS_FOR.map((person, i) => {
                const Icon = person.icon;
                return (
                  <m.div
                    key={person.role}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.38, delay: i * 0.06 }}
                    className="szl-card"
                    style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.875rem" }}>
                      <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-lyte-muted)", border: "1px solid var(--color-lyte-border)", borderRadius: "6px" }}>
                        <Icon size={15} color="var(--color-lyte)" />
                      </div>
                      <h3 style={{ fontSize: "0.875rem", fontWeight: 700, letterSpacing: "-0.010em", color: "hsl(38,8%,88%)" }}>{person.role}</h3>
                    </div>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{person.description}</p>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Problems solved */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>
                Problems Solved
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "3rem" }}>
                The operating picture that leadership can't get any other way.
              </h2>
            </m.div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {PROBLEMS_SOLVED.map((item, i) => (
                <m.div
                  key={item.problem}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  style={{ display: "grid", gap: "1.5rem", padding: "1.5rem", borderRadius: "10px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}
                  className="lg:grid-cols-[1fr_1fr_1fr]"
                >
                  <div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-lyte)", marginBottom: "0.5rem" }}>Problem</p>
                    <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.010em", color: "hsl(38,8%,88%)", lineHeight: 1.3 }}>{item.problem}</h3>
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(214,7%,42%)", marginBottom: "0.5rem" }}>Before</p>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "hsl(214,7%,54%)" }}>{item.before}</p>
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(142,60%,46%)", marginBottom: "0.5rem" }}>With Lyte</p>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "hsl(214,7%,64%)" }}>{item.after}</p>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* Signal inputs */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "grid", gap: "clamp(3rem,6vw,5rem)", alignItems: "start" }} className="lg:grid-cols-2">
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-lyte)", marginBottom: "1rem" }}>
                  Signal Inputs
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, marginBottom: "1.25rem" }}>
                  Every pack feeds the command surface.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "46ch" }}>
                  Lyte aggregates live signal feeds from all operating packs — normalized, scored, and ranked in real time. No manual aggregation. No stale dashboards. The command surface updates as conditions change.
                </p>
              </m.div>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.08 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {SIGNAL_INPUTS.map((source, i) => (
                    <div key={i} style={{ padding: "0.875rem 1.125rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                        <Database size={11} color="var(--color-lyte)" />
                        <p style={{ fontSize: "12px", fontWeight: 700, color: "hsl(38,12%,82%)", letterSpacing: "0.01em" }}>{source.source}</p>
                      </div>
                      <p style={{ fontSize: "11px", lineHeight: 1.55, color: "hsl(214,7%,50%)" }}>{source.signals}</p>
                    </div>
                  ))}
                </div>
              </m.div>
            </div>
          </div>
        </section>

        {/* Prioritization model */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-lyte)", marginBottom: "1rem" }}>
                Prioritization Model
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "1.25rem" }}>
                Not a raw feed. A ranked operating picture.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,58%)", maxWidth: "52ch", marginBottom: "2.5rem" }}>
                Lyte scores every signal across five dimensions to produce a ranked portfolio pressure view — so leadership sees what matters most, not the most recent event.
              </p>
            </m.div>
            <div style={{ display: "grid", gap: "1rem" }} className="lg:grid-cols-5 md:grid-cols-3">
              {PRIORITIZATION_MODEL.map((dim, i) => (
                <m.div
                  key={dim.dimension}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.38, delay: i * 0.07 }}
                  className="szl-card"
                  style={{ borderRadius: "0.75rem", padding: "1.25rem 1rem" }}
                >
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", fontWeight: 700, color: "var(--color-lyte)", letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 700, letterSpacing: "-0.010em", marginBottom: "0.5rem", color: "hsl(38,8%,88%)" }}>{dim.dimension}</h3>
                  <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "hsl(214,7%,58%)" }}>{dim.description}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* Role benefits grid */}
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
              {ROLE_BENEFITS.map((cap, i) => {
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
                    <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-lyte-muted)", border: "1px solid var(--color-lyte-border)", borderRadius: "0.4375rem", marginBottom: "1rem" }}>
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
                <Link href="/platform/alloy" className="szl-btn-ghost" style={{ paddingLeft: 0 }}>
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

        {/* FAQ */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>
                FAQ
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "2.5rem" }}>
                Common questions about Lyte.
              </h2>
            </m.div>
            <div style={{ maxWidth: "800px", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {FAQS.map((faq) => (
                <FAQItem key={faq.q} q={faq.q} a={faq.a} />
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
