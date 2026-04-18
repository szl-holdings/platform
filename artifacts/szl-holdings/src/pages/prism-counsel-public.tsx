import { m } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight, Scale, CheckCircle2, Shield, FileText, Eye, Lock, Database,
  Zap, AlertTriangle, Clock, Building2, Brain, Layers, Globe, Cpu,
  MessageSquare, ChevronRight, BarChart3, Users, Server, Activity,
  ShieldCheck, FileDown, Workflow, TrendingUp,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { PrismCounselArchitectureDiagram } from "@/components/diagrams/PrismCounselArchitectureDiagram";
import { AlloyMatterFlowDiagram } from "@/components/diagrams/AlloyMatterFlowDiagram";

const WORKFLOW_STEPS = [
  {
    step: "01",
    label: "Matter Twin",
    body: "Every matter is modeled as a live structured object — claims, parties, deadlines, documents, correspondence, and insurer behavior — assembled from connected systems and continuously updated as signals arrive.",
    module: "Section 31",
  },
  {
    step: "02",
    label: "What Changed",
    body: "Signal delta surfaced on demand: new insurer correspondence, clock violations, ownership gaps, document status changes, and any threshold crossing since the last review. Nothing buried in an inbox.",
    module: "Matter Desk",
  },
  {
    step: "03",
    label: "Review Before Send",
    body: "Demand packets reviewed against a completeness checklist — missing medicals, lien exposure, privilege risks, and evidence gaps flagged before the document leaves the firm.",
    module: "Review Desk",
  },
  {
    step: "04",
    label: "Approval Gate",
    body: "Consequential actions — demand letters, settlement recommendations, compliance filings — require explicit partner or supervisor approval before execution. Human-in-the-loop is structural, not optional.",
    module: "Sign-Off Queue",
  },
  {
    step: "05",
    label: "Word Export",
    body: "Demand letters and compliance documents exported to Word with source citations, metadata, and privilege controls intact. M365-native workflow — no format gymnastics.",
    module: "M365 Export",
  },
  {
    step: "06",
    label: "Proof Chain",
    body: "An immutable, timestamped audit record of every action, approval, AI use, and data access — structured for regulatory review, malpractice defense, or client accountability.",
    module: "Section 31",
  },
];

const MODULES = [
  {
    id: "matter-desk",
    icon: Layers,
    name: "Matter Desk",
    tagline: "Your complete matter command surface",
    description: "All active matters in a single operational view. Health scores, settlement forecasts, deadline pressure, and insurer behavior — organized by priority, not docket order.",
    capabilities: [
      "PRISM six-pillar health scoring (Posture, Readiness, Integrity, Strategy, Money, Governance)",
      "Settlement band forecast with contributing signal breakdown",
      "Offer / reserve movement tracking and trajectory analysis",
      "Assignment tracking and workflow handoff visibility",
    ],
    accent: "#4a90b8",
  },
  {
    id: "ny-practice",
    icon: Scale,
    name: "NY Practice",
    tagline: "Insurance defense and no-fault command",
    description: "Built specifically for New York plaintiff-side litigation. NY DFS Regulation 68 clocks, no-fault claim tracking, insurer silence windows, and arbitration readiness — all in one surface.",
    capabilities: [
      "NY Insurance Regulation 68 compliance clock tracking (acknowledgment, verification, pay/deny deadlines)",
      "PIP/no-fault claim status monitoring with breach-risk forecasting",
      "Insurer response cadence analysis and silence window detection",
      "Demand readiness scoring with missing-item enforcement",
    ],
    accent: "#d4a054",
  },
  {
    id: "review-sign-off",
    icon: ShieldCheck,
    name: "Prep / Review / Sign-Off",
    tagline: "Governed workflow from draft to send",
    description: "Three-stage workflow: Prep assembles and checks the packet, Review flags contradictions and low-confidence extractions, Sign-Off records partner approval before any document moves.",
    capabilities: [
      "Demand packet completeness checklist with gap detection",
      "AI contradiction detection with chronology conflict flagging",
      "Low-confidence extraction review before it enters a document",
      "Partner approval gate with timestamped decision record",
    ],
    accent: "#8b7ac8",
  },
  {
    id: "section-31",
    icon: Brain,
    name: "Section 31 Intelligence",
    tagline: "Deep matter intelligence and proof chain",
    description: "The advanced intelligence layer: 14-domain matter twin, external signal assembly, pressure graph analysis, forecast diff tracking, and SHA-256 proof chain for every AI output.",
    capabilities: [
      "14-domain digital matter twin with real-time change tracking",
      "External signal assembly (weather, regulatory, court, medical)",
      "Multi-dimensional pressure graph across deadline, insurer, evidence, settlement axes",
      "SHA-256 hashed proof chain — every AI output source-grounded and export-safe verified",
    ],
    accent: "#c45a4a",
  },
];

const COMPETITIVE_DIFF = [
  {
    dimension: "Intelligence",
    generic: "General legal research and drafting assistance",
    prism: "Matter-specific intelligence: PRISM pillar scoring, settlement forecasting, insurer behavior tracking, deadline breach prediction",
  },
  {
    dimension: "Workflow",
    generic: "Chat interface or basic document generation",
    prism: "Named workflows: Matter Desk, Prep Demand, Review Before Send, Sign-Off Queue — each stage governed and recorded",
  },
  {
    dimension: "Trust",
    generic: "No approval structure; AI acts autonomously",
    prism: "Approval class enforcement: auto / review / admin-only — human approval required on every consequential action",
  },
  {
    dimension: "Audit",
    generic: "No audit trail; no proof of what AI generated",
    prism: "SHA-256 proof chain on every AI output — source-grounded, timestamped, role-attributed, export-safe verified",
  },
  {
    dimension: "Specialization",
    generic: "Generic legal AI for any practice area",
    prism: "Built for NY insurance litigation: Regulation 68, no-fault clocks, insurer behavior intel, NYSCEF, arbitration readiness",
  },
  {
    dimension: "Integration",
    generic: "Standalone tool outside your workflow",
    prism: "M365-native: Teams approval cards, Outlook comms import, Word demand export, SharePoint matter sync",
  },
];

const SIGNAL_SOURCES = [
  { label: "NY DFS Insurance Regulation 68", detail: "No-fault claim clock tracking, acknowledgment and verification deadlines, payment and denial timing" },
  { label: "NWS Weather Data", detail: "Weather incident context for bodily injury and premises claims — date-of-incident conditions and regional event records" },
  { label: "US Census Bureau", detail: "Demographic and economic context for damages assessment and venue strategy" },
  { label: "CMS MSPRP", detail: "Medicare Secondary Payer records for lien identification and resolution tracking" },
  { label: "Court Scheduling Feeds", detail: "NY court part velocity, scheduling patterns, and ADR milestone data for venue planning" },
  { label: "NYSCEF / Court Records", detail: "Filing status, motion tracking, and deadline compliance for active litigation matters" },
];

const M365_CAPABILITIES = [
  { icon: MessageSquare, title: "Teams", body: "Approval cards delivered directly into Teams channels. Deadline alerts, approval requests, and AI recommendations surface in the tools attorneys already monitor." },
  { icon: FileText, title: "Outlook", body: "Insurer correspondence ingested from Outlook. Silence windows tracked. Communication timelines assembled automatically — no manual logging." },
  { icon: FileDown, title: "Word", body: "Demand letters and compliance documents exported to Word with source citations, privilege markers, and version metadata intact. One-click export from the demand review queue." },
  { icon: Globe, title: "SharePoint", body: "Matter documents stored and indexed in SharePoint. Permission-aware search returns only documents the querying role is authorized to view." },
  { icon: Brain, title: "Copilot", body: "Copilot connectors surface matter intelligence inside Microsoft 365. Ask about a matter's status, deadlines, or settlement band without leaving the M365 environment." },
];

const TRUST_CONTROLS = [
  { icon: Shield, label: "Human approval on every consequential action", detail: "Demand letters, settlement recommendations, compliance filings — none execute without explicit partner or attorney approval. Structural, not optional." },
  { icon: Eye, label: "Source-grounded AI", detail: "Every recommendation references the specific document, record, or data feed that informed it. No black-box conclusions. No unsourced outputs." },
  { icon: Lock, label: "Privilege-aware architecture", detail: "Attorney-client privileged materials are tagged at ingestion. AI models never train on privileged content. Export pipelines screen and redact automatically." },
  { icon: Layers, label: "Immutable proof chain", detail: "SHA-256 hash integrity on every AI output. Complete chain of custody for every action, approval, and data access — exportable for regulatory review." },
  { icon: Users, label: "Role-based access with audit", detail: "Partner, associate, paralegal, and admin roles with granular permissions. Every access, edit, export, and approval logged with actor identity, timestamp, and rationale." },
  { icon: AlertTriangle, label: "Hallucination detection", detail: "AI outputs pass through contradiction detection and confidence scoring. Unsupported claims flagged before reaching any review queue. Grounding failures surface immediately." },
];

const OPERATOR_PREREQS = [
  "Microsoft 365 tenant (Teams, Outlook, SharePoint, Word)",
  "Designated partner or admin as approval authority",
  "Role definitions for attorney and paralegal access",
  "Connected case management system (preferred)",
  "Matter intake and client consent workflow",
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(38,72%,58%)", marginBottom: "1rem" }}>
      {children}
    </p>
  );
}

function SectionHeading({ children, maxWidth = "30ch" }: { children: React.ReactNode; maxWidth?: string }) {
  return (
    <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth, marginBottom: "3rem" }}>
      {children}
    </h2>
  );
}

function Divider() {
  return <div style={{ borderBottom: "1px solid var(--color-szl-border)" }} />;
}

export default function PrismCounselPublicPage() {
  usePageMeta({
    title: "PRISM Counsel — Litigation Command System | SZL Holdings",
    description: "PRISM Counsel is a litigation command system for plaintiff-side insurance defense firms. Matter twin, governed workflows, proof chain, NY practice intelligence, and M365-native execution.",
    canonical: "https://szlholdings.com/prism-counsel-public",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        {/* ─── Hero ─────────────────────────────────────────────────── */}
        <section
          className="szl-grid-texture"
          style={{
            paddingTop: "var(--space-hero-pt)",
            paddingBottom: "clamp(5rem,9vw,7rem)",
            borderBottom: "1px solid var(--color-szl-border)",
            background: "radial-gradient(ellipse at 50% 0%, hsla(38,72%,58%,0.05) 0%, transparent 62%)",
          }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.75rem" }}>
                <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(38,72%,58%,0.10)", border: "1px solid hsla(38,72%,58%,0.22)", borderRadius: "8px" }}>
                  <Scale size={16} color="hsl(38,72%,58%)" />
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(38,72%,58%)" }}>
                  PRISM Counsel · Litigation Command System
                </span>
              </div>
            </m.div>

            <div style={{ display: "grid", gap: "clamp(2.5rem,5vw,4rem)", alignItems: "start" }} className="lg:grid-cols-[1.2fr_0.8fr]">
              <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                  {["Insurance Defense", "No-Fault / PIP", "NY Practice", "M365-Native"].map((tag) => (
                    <span key={tag} style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(38,7%,50%)", border: "1px solid hsla(0,0%,100%,0.08)", borderRadius: "4px", padding: "0.125rem 0.5rem" }}>
                      {tag}
                    </span>
                  ))}
                </div>
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
                  Every matter. Every signal. Governed.
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
                  PRISM Counsel is a litigation command system for plaintiff-side insurance defense firms. Not another AI chatbot. A matter command layer with a proof chain for everything that moves.
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
                  Built for NY insurance litigation — no-fault, bodily injury, premises liability — on top of Microsoft 365 and the Alloy Governance API. Human approval on every consequential action. Source-grounded AI. Immutable audit trail.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  <Link href="/aegis/" className="szl-btn-primary">
                    Enter command center <ArrowRight size={15} />
                  </Link>
                  <Link href="/contact" className="szl-btn-secondary">
                    Request controlled access
                  </Link>
                </div>
              </m.div>

              <m.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.15 }}
                style={{ borderRadius: "0.875rem", padding: "clamp(1.25rem,3vw,1.75rem)", background: "hsla(38,72%,58%,0.04)", border: "1px solid hsla(38,72%,58%,0.14)" }}
              >
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>
                  What PRISM Counsel answers
                </p>
                {[
                  "Which matters are at risk of missing a critical deadline?",
                  "Where is the demand packet incomplete before it goes out?",
                  "What changed on this matter since the last review?",
                  "How is this insurer behaving relative to their pattern?",
                  "What is the settlement band forecast based on current signals?",
                  "Which approvals are pending and who is the gatekeeper?",
                ].map((q, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", marginBottom: "0.75rem" }}>
                    <CheckCircle2 size={14} color="hsl(38,72%,58%)" style={{ marginTop: "2px", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "hsl(214,7%,72%)" }}>{q}</span>
                  </div>
                ))}
                <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--color-szl-border)" }}>
                  <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,48%)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                    NY insurance litigation · Plaintiff-side · M365-native
                  </p>
                </div>
              </m.div>
            </div>
          </div>
        </section>

        {/* ─── Product Thesis ──────────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "grid", gap: "clamp(3rem,6vw,5rem)" }} className="lg:grid-cols-2">
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <SectionLabel>Product Thesis</SectionLabel>
                <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.2, marginBottom: "1.5rem", maxWidth: "32ch" }}>
                  Litigation is a coordination and intelligence problem. Most firms solve it with email and spreadsheets.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "hsl(214,7%,60%)", marginBottom: "1rem" }}>
                  Plaintiff-side insurance litigation firms manage dozens of matters simultaneously — across carriers, courts, adjusters, medical providers, lien holders, and deadlines. Critical signals are buried in email. Demand packets go out incomplete. Deadlines get missed. Insurer patterns go unrecognized.
                </p>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "hsl(214,7%,52%)" }}>
                  PRISM Counsel is the command surface that sits above all of that — case management, email, documents, and Microsoft 365 — and turns fragmented signals into governed legal action and outcome intelligence.
                </p>
              </m.div>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.08 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {[
                    { icon: Layers, title: "Litigation command, not case management", body: "A command layer above the systems you already use — not a replacement for them." },
                    { icon: Brain, title: "Matter intelligence, not general AI", body: "Matter-specific context: PRISM scoring, insurer behavior, settlement forecasting, deadline breach risk." },
                    { icon: Shield, title: "Proofable workflows, not autonomous AI", body: "Human approval required on every consequential action. Every AI output source-grounded and proof-chained." },
                    { icon: Scale, title: "Insurance defense wedge", body: "Built specifically for NY insurance litigation — Regulation 68, no-fault clocks, arbitration readiness, insurer intel." },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} style={{ display: "flex", gap: "0.875rem", padding: "1rem 1.25rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
                        <div style={{ width: "32px", height: "32px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(38,72%,58%,0.08)", border: "1px solid hsla(38,72%,58%,0.18)", borderRadius: "6px" }}>
                          <Icon size={14} color="hsl(38,72%,58%)" />
                        </div>
                        <div>
                          <h3 style={{ fontSize: "0.875rem", fontWeight: 600, letterSpacing: "-0.01em", marginBottom: "0.25rem" }}>{item.title}</h3>
                          <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "hsl(214,7%,58%)" }}>{item.body}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </m.div>
            </div>
          </div>
        </section>

        {/* ─── Module Overview ─────────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <SectionLabel>Module Overview</SectionLabel>
              <SectionHeading maxWidth="34ch">Four command surfaces. One operating layer.</SectionHeading>
            </m.div>
            <div style={{ display: "grid", gap: "1.25rem" }} className="lg:grid-cols-2">
              {MODULES.map((mod, i) => {
                const Icon = mod.icon;
                return (
                  <m.div
                    key={mod.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    style={{
                      borderRadius: "0.875rem",
                      padding: "clamp(1.25rem,2.5vw,1.75rem)",
                      background: "hsla(0,0%,100%,0.025)",
                      border: "1px solid hsla(0,0%,100%,0.07)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", marginBottom: "1rem" }}>
                      <div style={{ width: "38px", height: "38px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `${mod.accent}12`, border: `1px solid ${mod.accent}28`, borderRadius: "8px" }}>
                        <Icon size={16} color={mod.accent} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.015em", marginBottom: "0.125rem" }}>{mod.name}</h3>
                        <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,52%)" }}>{mod.tagline}</p>
                      </div>
                    </div>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)", marginBottom: "1rem" }}>{mod.description}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4375rem" }}>
                      {mod.capabilities.map((cap, ci) => (
                        <div key={ci} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                          <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: mod.accent, flexShrink: 0, marginTop: "7px", opacity: 0.7 }} />
                          <span style={{ fontSize: "0.8125rem", lineHeight: 1.55, color: "hsl(214,7%,60%)" }}>{cap}</span>
                        </div>
                      ))}
                    </div>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── Product Screenshots ─────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <SectionLabel>Product Views</SectionLabel>
              <SectionHeading maxWidth="36ch">What the command surface actually looks like.</SectionHeading>
            </m.div>
            <div style={{ display: "grid", gap: "1.25rem" }} className="lg:grid-cols-2">
              {[
                { src: "/prism-counsel/screenshot-dashboard.jpg", label: "Dashboard", caption: "Matter health, AI recommendations, deadline risk queue, and settlement forecast across all active matters" },
                { src: "/prism-counsel/screenshot-matters-list.jpg", label: "Matter Desk", caption: "All active matters with PRISM pillar scores, settlement forecasts, and status — organized by operational priority" },
                { src: "/prism-counsel/screenshot-ny-dashboard.jpg", label: "NY Practice", caption: "New York Insurance Regulation 68 clocks, no-fault claim tracking, insurer silence windows, and carrier intelligence" },
                { src: "/prism-counsel/screenshot-review-desk.jpg", label: "Review Desk", caption: "Managed review operations: AI contradiction detection, low-confidence extractions, attorney review queues, and export safety" },
                { src: "/prism-counsel/screenshot-matter-twin.jpg", label: "Matter Twin", caption: "14-domain digital twin with real-time change tracking, risk factors, missing artifacts, and recommended actions" },
                { src: "/prism-counsel/screenshot-proof-chain.jpg", label: "Proof Chain", caption: "SHA-256 hashed AI output registry with source tracing, review/approval states, and export-safe verification" },
              ].map((view, i) => (
                <m.div
                  key={view.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  style={{ borderRadius: "0.875rem", overflow: "hidden", border: "1px solid hsla(0,0%,100%,0.08)", background: "hsla(0,0%,100%,0.02)" }}
                >
                  <div style={{ aspectRatio: "16/9", overflow: "hidden", background: "hsl(214,16%,6%)", position: "relative" }}>
                    <img
                      src={view.src}
                      alt={`PRISM Counsel — ${view.label}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top left", display: "block" }}
                      loading="lazy"
                    />
                  </div>
                  <div style={{ padding: "0.875rem 1.125rem" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(38,72%,58%)", marginBottom: "0.375rem" }}>
                      {view.label}
                    </div>
                    <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "hsl(214,7%,55%)" }}>{view.caption}</p>
                  </div>
                </m.div>
              ))}
            </div>
            <m.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              style={{ marginTop: "1.5rem", textAlign: "center" }}
            >
              <Link href="/aegis/" className="szl-btn-primary">
                Enter command center — see the full system <ArrowRight size={15} />
              </Link>
            </m.div>
          </div>
        </section>

        {/* ─── Flagship Workflow ───────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <SectionLabel>Flagship Workflow</SectionLabel>
              <SectionHeading maxWidth="30ch">From Matter Twin to Proof Chain — every step governed.</SectionHeading>
            </m.div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {WORKFLOW_STEPS.map((s, i) => (
                <m.div
                  key={s.step}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.38, delay: i * 0.07 }}
                  style={{ display: "flex", gap: "1.5rem", padding: "1.25rem 1.5rem", borderRadius: "10px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)", alignItems: "flex-start" }}
                >
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: "hsl(38,72%,58%)", letterSpacing: "0.06em", flexShrink: 0, marginTop: "2px" }}>
                    {s.step}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.375rem", color: "hsl(38,8%,90%)" }}>{s.label}</h3>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "hsl(214,7%,60%)" }}>{s.body}</p>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(38,7%,45%)", border: "1px solid hsla(0,0%,100%,0.07)", borderRadius: "4px", padding: "0.125rem 0.5rem", whiteSpace: "nowrap" }}>
                      {s.module}
                    </span>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Competitive Differentiation ─────────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <SectionLabel>Why PRISM Counsel</SectionLabel>
              <SectionHeading maxWidth="32ch">What separates litigation command from generic legal AI.</SectionHeading>
            </m.div>
            <div style={{ borderRadius: "0.875rem", overflow: "hidden", border: "1px solid hsla(0,0%,100%,0.07)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 1fr", background: "hsla(38,72%,58%,0.06)", borderBottom: "1px solid hsla(0,0%,100%,0.07)", padding: "0.75rem 1.25rem", gap: "1.5rem" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(38,7%,50%)" }}>Dimension</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(214,7%,45%)" }}>Generic Legal AI</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(38,72%,58%)" }}>PRISM Counsel</div>
              </div>
              {COMPETITIVE_DIFF.map((row, i) => (
                <m.div
                  key={row.dimension}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  style={{ display: "grid", gridTemplateColumns: "140px 1fr 1fr", padding: "1rem 1.25rem", gap: "1.5rem", borderBottom: i < COMPETITIVE_DIFF.length - 1 ? "1px solid hsla(0,0%,100%,0.05)" : "none", background: i % 2 === 0 ? "hsla(0,0%,100%,0.015)" : "transparent" }}
                >
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, color: "hsl(38,7%,60%)", letterSpacing: "0.04em", paddingTop: "1px" }}>{row.dimension}</div>
                  <div style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "hsl(214,7%,48%)" }}>{row.generic}</div>
                  <div style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "hsl(38,8%,76%)" }}>{row.prism}</div>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Alloy as Engine ─────────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <SectionLabel>Alloy Governance API</SectionLabel>
              <SectionHeading maxWidth="34ch">How Alloy powers everything that moves in PRISM Counsel.</SectionHeading>
            </m.div>
            <div style={{ display: "grid", gap: "clamp(2.5rem,5vw,4rem)" }} className="lg:grid-cols-[1fr_1.1fr]">
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {[
                  {
                    icon: Workflow,
                    title: "Workflow orchestration",
                    body: "Every named workflow in PRISM Counsel — Prep a Demand, Review Before Send, Sign-Off Queue, Clear Review Queue — is orchestrated by Alloy. Steps are sequenced, approvals enforced, and blockers surfaced.",
                  },
                  {
                    icon: Cpu,
                    title: "AI governance engine",
                    body: "Alloy classifies every AI action: auto (read-only), review (human approval required), admin-only (elevated authorization). No autonomous execution of high-risk actions. Confidence thresholds enforced at the model lane.",
                  },
                  {
                    icon: Shield,
                    title: "Audit trail infrastructure",
                    body: "Every action — data access, AI output, approval decision, export — is recorded with actor identity, timestamp, and SHA-256 hash. The proof chain is structurally Alloy-native, not a log file bolted on later.",
                  },
                  {
                    icon: Database,
                    title: "Connector framework",
                    body: "Alloy connectors handle Microsoft 365 (Teams, Outlook, SharePoint, Word), case management systems, NYSCEF, court feeds, and external regulatory data. PRISM Counsel adds domain logic on top of a proven integration fabric.",
                  },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <m.div
                      key={item.title}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.38, delay: i * 0.07 }}
                      style={{ display: "flex", gap: "0.875rem", padding: "1rem 1.25rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}
                    >
                      <div style={{ width: "32px", height: "32px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(36,56%,50%,0.10)", border: "1px solid hsla(36,56%,50%,0.22)", borderRadius: "6px" }}>
                        <Icon size={14} color="#c8953c" />
                      </div>
                      <div>
                        <h3 style={{ fontSize: "0.875rem", fontWeight: 600, letterSpacing: "-0.01em", marginBottom: "0.25rem" }}>{item.title}</h3>
                        <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "hsl(214,7%,58%)" }}>{item.body}</p>
                      </div>
                    </m.div>
                  );
                })}
              </div>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.12 }}>
                <AlloyMatterFlowDiagram />
              </m.div>
            </div>
          </div>
        </section>

        {/* ─── M365 Copilot Companion ───────────────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <SectionLabel>Microsoft 365 Companion</SectionLabel>
              <SectionHeading maxWidth="34ch">Matter intelligence inside the tools your attorneys already use.</SectionHeading>
            </m.div>
            <div style={{ display: "grid", gap: "clamp(2.5rem,5vw,4rem)", alignItems: "start" }} className="lg:grid-cols-[1.1fr_1fr]">
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "hsl(214,7%,60%)", marginBottom: "1.25rem" }}>
                  PRISM Counsel is designed to operate inside Microsoft 365, not alongside it. Approval requests surface in Teams. Correspondence is ingested from Outlook. Demand letters are exported to Word. Documents are indexed from SharePoint. Matter intelligence is queryable through Copilot connectors.
                </p>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "hsl(214,7%,52%)", marginBottom: "2rem" }}>
                  The goal: attorneys should be able to get PRISM Counsel intelligence without ever leaving their primary workspace. The command center is always available for deep-work sessions. But for ambient signals and quick approvals, M365 is the surface.
                </p>
                <div style={{ padding: "1rem 1.25rem", borderRadius: "8px", background: "hsla(207,52%,40%,0.06)", border: "1px solid hsla(207,52%,40%,0.18)" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "#4a90b8", marginBottom: "0.625rem" }}>Copilot connector story</p>
                  <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "hsl(214,7%,58%)" }}>
                    PRISM Counsel Copilot connectors expose matter data, deadline alerts, settlement forecasts, and approval queue status to Microsoft 365 Copilot — with permission-aware retrieval so attorneys only see matters they're assigned to. Ask "What's the settlement forecast on the Rodriguez matter?" and get a grounded, source-cited answer.
                  </p>
                </div>
              </m.div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {M365_CAPABILITIES.map((cap, i) => {
                  const Icon = cap.icon;
                  return (
                    <m.div
                      key={cap.title}
                      initial={{ opacity: 0, x: 10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.38, delay: i * 0.07 }}
                      style={{ display: "flex", gap: "0.875rem", padding: "1rem 1.25rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}
                    >
                      <div style={{ width: "32px", height: "32px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(207,52%,40%,0.10)", border: "1px solid hsla(207,52%,40%,0.22)", borderRadius: "6px" }}>
                        <Icon size={14} color="#4a90b8" />
                      </div>
                      <div>
                        <h3 style={{ fontSize: "0.875rem", fontWeight: 600, letterSpacing: "-0.01em", marginBottom: "0.25rem", color: "#d1d5db" }}>{cap.title}</h3>
                        <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "hsl(214,7%,55%)" }}>{cap.body}</p>
                      </div>
                    </m.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Signal Sources ───────────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "grid", gap: "clamp(3rem,6vw,5rem)", alignItems: "start" }} className="lg:grid-cols-2">
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <SectionLabel>Signal Sources</SectionLabel>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, marginBottom: "1.25rem" }}>
                  The outside world, inside the matter model.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "46ch" }}>
                  PRISM Counsel is not just a document system. It connects to regulatory feeds, weather records, federal databases, and court data — and weaves those signals into each matter's twin so attorneys see context they would otherwise miss or manually research.
                </p>
              </m.div>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.08 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {SIGNAL_SOURCES.map((source, i) => (
                    <div key={i} style={{ padding: "1rem 1.25rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                        <Database size={11} color="hsl(38,72%,58%)" />
                        <p style={{ fontSize: "12px", fontWeight: 600, color: "hsl(38,12%,82%)" }}>{source.label}</p>
                      </div>
                      <p style={{ fontSize: "12px", lineHeight: 1.6, color: "hsl(214,7%,52%)" }}>{source.detail}</p>
                    </div>
                  ))}
                </div>
              </m.div>
            </div>
          </div>
        </section>

        {/* ─── Architecture Diagram ─────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <SectionLabel>Architecture</SectionLabel>
              <SectionHeading maxWidth="36ch">Five layers. One governed system.</SectionHeading>
            </m.div>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.08 }}>
              <PrismCounselArchitectureDiagram />
            </m.div>
          </div>
        </section>

        {/* ─── Trust & Security ─────────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <SectionLabel>Trust & Security Posture</SectionLabel>
              <SectionHeading maxWidth="30ch">Governance built for legal accountability, not as an afterthought.</SectionHeading>
            </m.div>
            <div style={{ display: "grid", gap: "0.75rem" }} className="lg:grid-cols-2">
              {TRUST_CONTROLS.map((control, i) => {
                const Icon = control.icon;
                return (
                  <m.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.06 }}
                    style={{ display: "flex", gap: "0.875rem", padding: "1.125rem 1.25rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}
                  >
                    <div style={{ width: "30px", height: "30px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(38,72%,58%,0.08)", border: "1px solid hsla(38,72%,58%,0.18)", borderRadius: "6px", marginTop: "1px" }}>
                      <Icon size={13} color="hsl(38,72%,58%)" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "0.875rem", fontWeight: 600, letterSpacing: "-0.01em", marginBottom: "0.25rem" }}>{control.label}</h3>
                      <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "hsl(214,7%,58%)" }}>{control.detail}</p>
                    </div>
                  </m.div>
                );
              })}
            </div>
            <m.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}
            >
              <Link href="/solutions/prism-counsel/trust" className="szl-btn-secondary">
                Full trust & governance documentation <ChevronRight size={14} />
              </Link>
              <Link href="/trust" className="szl-btn-secondary">
                Platform trust center <ChevronRight size={14} />
              </Link>
            </m.div>
          </div>
        </section>

        {/* ─── What It Is / What It Isn't ──────────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "grid", gap: "clamp(2rem,5vw,4rem)" }} className="lg:grid-cols-3">
              {[
                {
                  icon: Zap,
                  title: "What PRISM Counsel is",
                  accent: "#d4a054",
                  items: [
                    "A matter command system",
                    "A deadline intelligence engine",
                    "An insurer behavior intelligence layer",
                    "A governed action and approval system",
                    "A Microsoft-native legal operating layer",
                    "A proof chain for every action taken",
                  ],
                },
                {
                  icon: AlertTriangle,
                  title: "What PRISM Counsel is not",
                  accent: "#c45a4a",
                  items: [
                    "A generic legal chatbot",
                    "A Westlaw or Lexis replacement",
                    "A basic case management clone",
                    "An autonomous filing system",
                    "A source of legal advice",
                    "A system that makes decisions for you",
                  ],
                },
                {
                  icon: Shield,
                  title: "Operator prerequisites",
                  accent: "#4a90b8",
                  items: OPERATOR_PREREQS,
                },
              ].map((section, i) => {
                const Icon = section.icon;
                return (
                  <m.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.38, delay: i * 0.08 }}
                    className="szl-card"
                    style={{ borderRadius: "0.875rem", padding: "1.5rem" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
                      <Icon size={14} color={section.accent} />
                      <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.012em" }}>{section.title}</h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {section.items.map((item, j) => (
                        <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                          <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: section.accent, flexShrink: 0, marginTop: "7px", opacity: 0.6 }} />
                          <span style={{ fontSize: "0.8125rem", lineHeight: 1.55, color: "hsl(214,7%,62%)" }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── CTA ─────────────────────────────────────────────────── */}
        <section style={{ padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              style={{ borderRadius: "1rem", padding: "clamp(2.5rem,5vw,4rem)", gap: "2.5rem", alignItems: "center", background: "hsla(38,72%,58%,0.05)", border: "1px solid hsla(38,72%,58%,0.16)" }}
              className="szl-grid-cta"
            >
              <div>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, marginBottom: "0.875rem" }}>
                  Ready to bring your matter operations into one command surface?
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "48ch" }}>
                  We run focused design partner engagements with plaintiff-side litigation firms — PRISM Counsel instrumented against your actual matters, your actual deadlines, your actual insurer relationships.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flexShrink: 0 }}>
                <Link href="/aegis/" className="szl-btn-primary">
                  Enter command center <ArrowRight size={15} />
                </Link>
                <Link href="/contact" className="szl-btn-secondary">
                  Request controlled access
                </Link>
                <Link href="/solutions/prism-counsel" className="szl-btn-secondary">
                  Product overview
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
