import { m } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight, GitBranch, Layers, CheckSquare, FileText, AlertOctagon,
  Workflow, Shield, Zap, Lock, Download, RefreshCw, Database, Filter,
  BarChart3, Network, BookOpen, Puzzle, Activity, Eye, Send
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { AlloyKernelPanel } from "@/components/AlloyKernelPanel";
import { AlloyOperatingLoopDiagram } from "@/components/diagrams/AlloyOperatingLoopDiagram";

const OPERATING_LOOP = [
  {
    phase: "Ingestion",
    step: "01",
    icon: Database,
    description: "Counsel receives structured signal feeds from all connected packs and integrations — Counsel, Terra, Vessels, Aegis, Carlota Jo, and external data sources. Every signal enters the pipeline with source attribution, timestamp, and context metadata intact.",
  },
  {
    phase: "Normalization",
    step: "02",
    icon: Filter,
    description: "Raw signals are normalized into a consistent schema — typed, de-duplicated, and enriched with entity resolution. Signals from different packs using different schemas are reconciled into a single structured format before evaluation begins.",
  },
  {
    phase: "Evaluation",
    step: "03",
    icon: BarChart3,
    description: "Each normalized signal is evaluated against configurable criteria — severity thresholds, SLA proximity, asset criticality, and cross-pack blast radius. Evaluation logic is auditable and explainable: every score has a traceable rationale.",
  },
  {
    phase: "Recommendation",
    step: "04",
    icon: Layers,
    description: "Evaluated signals are scored, ranked, and assembled into prioritized action recommendations. Recommendation factors include severity, velocity, ownership gap, and cross-domain impact. The action queue updates continuously as new signals arrive and conditions change.",
  },
  {
    phase: "Routing",
    step: "05",
    icon: Network,
    description: "Ranked signals are routed to the right actor — with role-based assignment, escalation paths, and channel context already structured. Every routing decision is logged with the routing key, the assignee, and the authority basis.",
  },
  {
    phase: "Workflow Execution",
    step: "06",
    icon: GitBranch,
    description: "Consequential actions pass through human approval gates before execution. Counsel tracks SLAs, escalates stalled approvals, and verifies that actions taken match actions authorized. Nothing executes without confirmation.",
  },
  {
    phase: "Proof Chain",
    step: "07",
    icon: FileText,
    description: "Every stage — ingestion, evaluation, routing, approval, execution — is recorded in the Proof Chain: a SHA-256 hashed, tamper-evident audit record attributed to real actors. Exportable for compliance, capital review, or customer diligence. Covenant Policy violations are logged alongside approvals — nothing is hidden.",
  },
  {
    phase: "Outcome Graph",
    step: "08",
    icon: BookOpen,
    description: "After execution, the Outcome Graph tracks the real-world result: did the action produce the expected outcome? Deviations surface as new signals. Outcomes feed back into simulation calibration and AI confidence scoring — closing the governed decision loop.",
  },
  {
    phase: "Extensibility",
    step: "09",
    icon: Puzzle,
    description: "Counsel is designed to extend — new domain packs plug in via the connector mesh, new evaluation criteria can be configured without code changes, and new workflow types can be registered against existing approval infrastructure.",
  },
];

const CAPABILITIES = [
  {
    icon: GitBranch,
    title: "Workflow Orchestration",
    body: "Counsel routes work through structured workflows with role-based assignment, escalation paths, and SLA tracking. Every task has an owner, a deadline, and a record. No action falls through untracked.",
  },
  {
    icon: CheckSquare,
    title: "Covenant Policy Enforcement",
    body: "Covenant Policy governs every consequential action: who can approve, what conditions apply, and when human-in-the-loop is required. Policy gates are structural — not configurable away — and every Covenant Policy decision is recorded in the Proof Chain.",
  },
  {
    icon: AlertOctagon,
    title: "Escalation Logic",
    body: "When actions stall, Counsel escalates automatically — reassignment, supervisor notification, or hard stops for high-risk situations. Nothing falls through silently. Every exception is tracked.",
  },
  {
    icon: FileText,
    title: "Proof Chain",
    body: "Every action, decision, approval, and outcome is recorded in the Proof Chain — SHA-256 hashed, tamper-evident, and attributed to real actors. Covenant Policy decisions appear alongside execution records. Structured, exportable, and auditable for compliance and capital review.",
  },
  {
    icon: Download,
    title: "Export & Write-Back Controls",
    body: "Counsel governs how outputs leave the system — structured exports, redaction controls, and write-back authorizations. Every data movement has an owner and a record.",
  },
  {
    icon: Layers,
    title: "Signal Normalization",
    body: "Counsel normalizes signals from Lyte and connected systems into a structured action queue — standardized priority, context, and routing logic regardless of the originating pack or data source.",
  },
  {
    icon: Workflow,
    title: "Connector Mesh",
    body: "Counsel's connector layer integrates with CRMs, communication tools, approval systems, and vertical-specific platforms. Execution happens where work already lives — no rip and replace.",
  },
  {
    icon: RefreshCw,
    title: "Cross-Pack Orchestration",
    body: "A single Counsel action can span multiple domain packs. An Aegis incident can trigger a Terra diligence hold. A Counsel approval can gate a Vessels cargo clearance. Counsel orchestrates across the platform.",
  },
  {
    icon: Zap,
    title: "Execution Verification",
    body: "Counsel doesn't just route. It verifies outcomes — confirming actions taken, tracking exceptions where actions weren't taken, and escalating when execution diverges from approval.",
  },
];

const AUDIT_FIELDS = [
  "Actor identity (role + name)",
  "Timestamp and duration",
  "Decision context and rationale",
  "Before/after state",
  "Authorization basis",
  "Escalation path taken",
  "Outcome classification",
  "Linked signal reference",
  "AI involvement flag",
  "Export and write-back log",
];

const PIPELINE_STEPS = [
  { step: "Ingest", desc: "Signal enters from pack or integration" },
  { step: "Normalize", desc: "Schema reconciled, entity resolved" },
  { step: "Evaluate", desc: "Severity, blast radius, SLA proximity" },
  { step: "Recommend", desc: "Priority scored, action proposed" },
  { step: "Route", desc: "Right person, right context, right channel" },
  { step: "Gate", desc: "Human approval for consequential actions" },
  { step: "Execute", desc: "Confirmed action with authorization logged" },
  { step: "Verify", desc: "Outcome tracked, exceptions escalated" },
  { step: "Audit", desc: "Immutable record created and attributable" },
];

const EXPANSION_LANES = [
  { name: "Lyte", desc: "The governed command surface routes signals from all domain packs into Counsel for cross-domain governed action." },
  { name: "Counsel", desc: "Legal workflow approvals, settlement decisions, and compliance filings run through Counsel approval gates." },
  { name: "Terra", desc: "Acquisition decisions, diligence approvals, and LP-ready exports governed through Counsel action chains." },
  { name: "Vessels", desc: "Rerouting decisions, port notifications, and regulatory filings routed with human approval and full audit record." },
  { name: "Aegis", desc: "Security incident response, remediation actions, and compliance evidence governed through analyst-gated workflows." },
  { name: "Carlota Jo", desc: "Intake authorizations, service milestone confirmations, and delivery approvals structured through Counsel." },
];

export default function AlloyPage() {
  const __pageMeta = usePageMeta({
    title: "Counsel — Execution Fabric & Action Spine | SZL Holdings",
    description: "Counsel is the execution Primitive beneath every SZL Holdings domain pack. Governed workflow orchestration, Covenant Policy enforcement, Proof Chain recording, and Outcome Graph tracking — from signal ingestion to verified execution.",
    canonical: "https://szlholdings.com/platform/continuum",
    ogImage: "https://szlholdings.com/og/og-continuum.jpg",
  });

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
        <SiteNav />
        <main id="main-content" >
  
          {/* Hero */}
          <section
            className="szl-grid-texture szl-depth-glow-continuum"
            style={{
              paddingTop: "var(--space-hero-pt)",
              paddingBottom: "clamp(5rem,9vw,7rem)",
              borderBottom: "1px solid var(--color-szl-border)",
            }}
          >
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <span className="szl-badge-continuum" style={{ borderRadius: "9999px", marginBottom: "1.75rem", display: "inline-block" }}>
                  Counsel · Execution Fabric & Action Spine
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
                      maxWidth: "22ch",
                    }}
                  >
                    The action spine that makes intelligence accountable.
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
                    Counsel is the execution Primitive beneath every SZL Holdings domain pack. Every signal — from Lyte, from any domain pack, or from any integration — enters Counsel's operating loop: ingestion, normalization, evaluation, ranking, routing, governed execution, and Proof Chain recording.
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
                    Signal to confirmed action, with Covenant Policy gating every consequential step and the Outcome Graph tracking what actually happened. No black boxes. No autonomous execution without approval.
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                    <Link href="/demo" className="szl-btn-primary">
                      See Counsel in action <ArrowRight size={15} />
                    </Link>
                    <Link href="/trust/architecture" className="szl-btn-secondary">
                      Architecture overview
                    </Link>
                  </div>
                </m.div>
  
                <m.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.15 }}
                  className="szl-continuum-card"
                  style={{ borderRadius: "0.875rem", padding: "clamp(1.25rem,3vw,1.75rem)" }}
                >
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>
                    Counsel's full pipeline
                  </p>
                  {PIPELINE_STEPS.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: i < PIPELINE_STEPS.length - 1 ? "0.5rem" : 0 }}>
                      <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "var(--color-continuum-muted)", border: "1px solid var(--color-continuum-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.55rem", fontWeight: 700, color: "var(--color-continuum-light)" }}>{i + 1}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-continuum-light)", letterSpacing: "-0.01em" }}>{item.step}</span>
                        <span style={{ fontSize: "0.8125rem", color: "var(--color-szl-text-muted)", marginLeft: "0.5rem" }}>{item.desc}</span>
                      </div>
                    </div>
                  ))}
                </m.div>
              </div>
            </div>
          </section>
  
          {/* Operating loop diagram */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-continuum-light)", marginBottom: "1rem" }}>
                  The Operating Loop
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "34ch", marginBottom: "1.25rem" }}>
                  Every signal follows the same governed path — from ingestion to Proof Chain record.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,58%)", maxWidth: "52ch", marginBottom: "2.5rem" }}>
                  No stage is skipped. No signal bypasses evaluation or routing. Human approval gates are structural — not configurable away. The loop is the same for a legal approval, a security remediation, and a maritime rerouting decision.
                </p>
              </m.div>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
                <AlloyOperatingLoopDiagram />
              </m.div>
            </div>
          </section>
  
          {/* Operating loop — detailed phases */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-continuum-light)", marginBottom: "1rem" }}>
                  Each Phase
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "3rem" }}>
                  Nine phases. Every consequential action covered.
                </h2>
              </m.div>
              <div style={{ display: "grid", gap: "1rem" }} className="lg:grid-cols-3 md:grid-cols-2">
                {OPERATING_LOOP.map((phase, i) => {
                  const Icon = phase.icon;
                  return (
                    <m.div
                      key={phase.phase}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.38, delay: i * 0.05 }}
                      className="szl-card"
                      style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
                        <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-continuum-muted)", border: "1px solid var(--color-continuum-border)", borderRadius: "6px", flexShrink: 0 }}>
                          <Icon size={14} color="var(--color-continuum-light)" />
                        </div>
                        <div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", fontWeight: 600, color: "var(--color-continuum-light)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{phase.step}</div>
                          <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, letterSpacing: "-0.012em", color: "hsl(38,8%,88%)" }}>{phase.phase}</h3>
                        </div>
                      </div>
                      <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{phase.description}</p>
                    </m.div>
                  );
                })}
              </div>
            </div>
          </section>
  
          {/* Relationship to Lyte and expansion lanes */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-continuum-light)", marginBottom: "1rem" }}>
                  Counsel Across the Platform
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "1.25rem" }}>
                  One execution fabric. Every domain pack inherits it.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,58%)", maxWidth: "52ch", marginBottom: "2.5rem" }}>
                  Counsel is not built once per pack. It is the shared execution Primitive that every domain pack inherits. When a new domain pack joins the platform, it gets Counsel's full approval, audit, routing, and governance stack from day one.
                </p>
              </m.div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {EXPANSION_LANES.map((lane, i) => (
                  <m.div
                    key={lane.name}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.36, delay: i * 0.06 }}
                    style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", padding: "1rem 1.25rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}
                  >
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: "var(--color-continuum-light)", minWidth: "110px", paddingTop: "1px" }}>{lane.name}</span>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "hsl(214,7%,60%)" }}>{lane.desc}</p>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Capabilities */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-continuum-light)", marginBottom: "1rem" }}>
                  Capabilities
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "3rem" }}>
                  Every layer of the execution stack, built for accountability and control.
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
                      <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-continuum-muted)", border: "1px solid var(--color-continuum-border)", borderRadius: "0.4375rem", marginBottom: "1rem" }}>
                        <Icon size={16} color="var(--color-continuum-light)" />
                      </div>
                      <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.625rem" }}>{cap.title}</h3>
                      <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{cap.body}</p>
                    </m.div>
                  );
                })}
              </div>
            </div>
          </section>
  
          {/* Audit trail detail */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <div style={{ display: "grid", gap: "clamp(3rem,6vw,5rem)", alignItems: "center" }} className="lg:grid-cols-2">
                <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-continuum-light)", marginBottom: "1rem" }}>
                    Audit-grade execution
                  </p>
                  <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, marginBottom: "1.25rem" }}>
                    Not just logging. Full attribution for every decision, action, and export.
                  </h2>
                  <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "46ch", marginBottom: "1.5rem" }}>
                    Counsel's audit trail is designed for capital, compliance, and customer diligence — not just internal debugging. Every field is structured, exportable, and tied to an actor, a timestamp, and an authorization basis. Export logs capture where data went, who authorized it, and what controls applied.
                  </p>
                  <Link href="/trust/governance" className="szl-btn-ghost" style={{ paddingLeft: 0 }}>
                    See governance architecture <ArrowRight size={14} />
                  </Link>
                </m.div>
                <m.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.10 }}
                  className="szl-continuum-card"
                  style={{ borderRadius: "0.875rem", padding: "clamp(1.5rem,3vw,2rem)" }}
                >
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1.25rem" }}>
                    Every audit record captures
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
                    {AUDIT_FIELDS.map((field) => (
                      <div key={field} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                        <Shield size={12} color="var(--color-continuum-light)" style={{ marginTop: "3px", flexShrink: 0, opacity: 0.7 }} />
                        <span style={{ fontSize: "0.8125rem", lineHeight: 1.55, color: "hsl(214,7%,68%)" }}>{field}</span>
                      </div>
                    ))}
                  </div>
                </m.div>
              </div>
            </div>
          </section>
  
          {/* Export and write-back */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-continuum-light)", marginBottom: "1rem" }}>
                  Controlled Outputs
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "1.5rem" }}>
                  Every export and write-back is governed, not assumed.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,58%)", maxWidth: "52ch", marginBottom: "2.5rem" }}>
                  Counsel treats data movement as a consequential action. Exports to Word, PDF, or external systems require authorization. Write-backs to connected platforms are tracked. Redaction rules apply at the record level. Nothing leaves without a record of where it went.
                </p>
              </m.div>
              <div style={{ display: "grid", gap: "1rem" }} className="lg:grid-cols-3">
                {[
                  { icon: Download, title: "Structured Export", body: "Demand letters, audit packets, compliance reports, and data exports governed by format, content, and authorization controls." },
                  { icon: Lock, title: "Redaction Controls", body: "Privilege-aware, PII-aware, and role-aware redaction applied at the record level before any export leaves the system." },
                  { icon: RefreshCw, title: "Write-Back Governance", body: "Data written back to CRMs, case management systems, or connected platforms is tracked with actor attribution and authorization basis." },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <m.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.38, delay: i * 0.07 }}
                      className="szl-card"
                      style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}
                    >
                      <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-continuum-muted)", border: "1px solid var(--color-continuum-border)", borderRadius: "0.4375rem", marginBottom: "1rem" }}>
                        <Icon size={16} color="var(--color-continuum-light)" />
                      </div>
                      <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.625rem" }}>{item.title}</h3>
                      <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{item.body}</p>
                    </m.div>
                  );
                })}
              </div>
            </div>
          </section>
  
          {/* Product-level features — new capabilities */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-continuum-light)", marginBottom: "1rem" }}>
                  Governed Execution Layer
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "32ch", marginBottom: "1.25rem" }}>
                  From intent to verified execution — with accountability at every step.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,58%)", maxWidth: "52ch", marginBottom: "3rem" }}>
                  Counsel's product layer turns goals into governed DAGs, replays every decision, simulates policy outcomes before going live, and delegates to specialized agents with structured receipts.
                </p>
              </m.div>
              <div style={{ display: "grid", gap: "1rem" }} className="lg:grid-cols-2 xl:grid-cols-3">
                {[
                  {
                    icon: GitBranch,
                    tag: "Action Graph Compiler",
                    title: "Goal → Executable DAG",
                    body: "Define an objective. Counsel compiles it into an executable plan with branch logic, fallback paths, and approval gates — rendered as an interactive DAG before any execution begins.",
                    badge: "Simulation-first",
                  },
                  {
                    icon: Activity,
                    tag: "Execution Replay",
                    title: "Step-by-step Replay Timeline",
                    body: "Every completed run shows a full replay: what tools were called, what was seen, what was approved or blocked, evidence collected, and timestamps — down to the millisecond.",
                    badge: "Structured audit trail",
                  },
                  {
                    icon: Shield,
                    tag: "COVENANT Policy Engine",
                    title: "Policy Simulation Console",
                    body: "Test 'what would happen if' scenarios against COVENANT policies before running live. See projected approve, block, escalate, and defer outcomes for any proposed action.",
                    badge: "No live execution",
                  },
                  {
                    icon: Send,
                    tag: "A2A Protocol",
                    title: "Agent Handoff & Delegation",
                    body: "Counsel delegates subtasks to specialized agents — internal or remote — using the A2A protocol. Every delegation is tracked with a structured receipt including status and completion verification.",
                    badge: "Tracked receipts",
                  },
                  {
                    icon: FileText,
                    tag: "Trust Layer",
                    title: "Run-grade Trust Receipts",
                    body: "Every completed run produces a structured receipt: inputs, outputs, policy decisions, evidence chain, confidence levels, approval records, and duration — designed for compliance export.",
                    badge: "Audit-grade receipts",
                  },
                  {
                    icon: Eye,
                    tag: "Governance",
                    title: "Clearly Marked Boundaries",
                    body: "Counsel is explicit about what is simulation versus live execution. Policy gates are structural, not configurable away. Human approval is enforced — not optional — for consequential actions.",
                    badge: "No autonomous execution",
                  },
                ].map((cap, i) => {
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
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
                        <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-continuum-muted)", border: "1px solid var(--color-continuum-border)", borderRadius: "6px", flexShrink: 0 }}>
                          <Icon size={14} color="var(--color-continuum-light)" />
                        </div>
                        <div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", fontWeight: 600, color: "var(--color-continuum-light)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{cap.tag}</div>
                          <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, letterSpacing: "-0.012em", color: "hsl(38,8%,88%)", marginTop: "1px" }}>{cap.title}</h3>
                        </div>
                      </div>
                      <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)", marginBottom: "0.875rem" }}>{cap.body}</p>
                      <span style={{ display: "inline-block", fontFamily: "var(--font-mono)", fontSize: "0.5625rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-continuum-light)", background: "var(--color-continuum-muted)", border: "1px solid var(--color-continuum-border)", borderRadius: "4px", padding: "2px 8px" }}>
                        {cap.badge}
                      </span>
                    </m.div>
                  );
                })}
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
                className="szl-card szl-grid-cta"
                style={{ borderRadius: "1rem", padding: "clamp(2.5rem,5vw,4rem)", gap: "2.5rem", alignItems: "center" }}
              >
                <div>
                  <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.2, marginBottom: "0.875rem" }}>
                    Ready to add execution accountability to your workflows?
                  </h2>
                  <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "48ch" }}>
                    Talk to us about applying Counsel to one critical workflow — with Lyte for cross-domain signal observability and Counsel for governed, auditable execution.
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flexShrink: 0 }}>
                  <Link href="/contact" className="szl-btn-primary">
                    Start a conversation <ArrowRight size={14} />
                  </Link>
                  <Link href="/platform" className="szl-btn-secondary" style={{ textAlign: "center" }}>
                    Full platform overview
                  </Link>
                </div>
              </m.div>
            </div>
          </section>
  
          <div className="container mx-auto max-w-4xl px-6 pb-16">
            <AlloyKernelPanel />
          </div>
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
