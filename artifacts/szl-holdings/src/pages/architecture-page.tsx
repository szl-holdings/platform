import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Layers, Command, Workflow, Package, Link2, Globe, Network, Brain, ShieldCheck, Lock } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { SignalToActionDiagram } from "@/components/diagrams/SignalToActionDiagram";
import { ProofChainDiagram } from "@/components/diagrams/ProofChainDiagram";
import { ApprovalPathDiagram } from "@/components/diagrams/ApprovalPathDiagram";
import { ControlPlaneDiagram } from "@/components/diagrams/ControlPlaneDiagram";
import { PackToPlatformDiagram } from "@/components/diagrams/PackToPlatformDiagram";

const ARCH_SECTIONS = [
  {
    id: "why",
    icon: Layers,
    number: "01",
    label: "Why this architecture exists",
    headline: "Built to close the gap between signal and accountable action.",
    color: "var(--color-lyte-light)",
    colorMuted: "var(--color-lyte-muted)",
    colorBorder: "var(--color-lyte-border)",
    business: "Every operating organization loses value in the gap between what is known and what gets done. Intelligence accumulates in dashboards. Actions get routed through email. Accountability disappears in status updates. Lyte + Counsel exists to close that gap structurally — not through better tooling, but through a different architecture.",
    product: "The platform connects signal detection, context interpretation, action recommendation, human approval, execution, and audit in a single governed pipeline. Each stage is a first-class product surface with structured inputs and outputs — not a sequence of loosely connected apps.",
    trust: "The pipeline architecture means every consequential action has a complete record: where the signal came from, who interpreted it, what was recommended, who approved it, what was executed, and what the outcome was. There are no gaps in the lineage.",
    operational: "Because the pipeline stages are defined at the infrastructure level, not the application level, operational observability, retry logic, and audit logging are built-in — not bolted on. Operations teams work with structured records, not logs.",
  },
  {
    id: "lyte",
    icon: Command,
    number: "02",
    label: "Lyte as command layer",
    headline: "Signal intelligence and command surface for every pack.",
    color: "var(--color-lyte-light)",
    colorMuted: "var(--color-lyte-muted)",
    colorBorder: "var(--color-lyte-border)",
    business: "Lyte is the intelligence and command layer of the platform. It monitors connected systems for operational signals — approval latency, ownership gaps, performance anomalies, threshold crossings — and translates them into structured recommendations that operators can act on immediately.",
    product: "The PRAXIS signal engine runs continuously across tenant-configured integrations. Signals are classified by type, severity, velocity, and blast radius. The Copilot surface turns classified signals into actionable briefings. The Today view gives operators a prioritized, contextualized command surface for their operating environment.",
    trust: "All signal classification includes confidence scoring and source attribution. Signals cannot be acted upon without going through the Counsel approval layer. Lyte surfaces intelligence — Counsel controls execution. The separation is architectural, not configurable away.",
    operational: "Lyte's signal namespace is tenant-isolated. Signals from one tenant cannot surface in another tenant's command layer. Signal deduplication, correlation, and freshness management are handled at the platform level, not per-implementation.",
  },
  {
    id: "continuum",
    icon: Workflow,
    number: "03",
    label: "Counsel as action spine",
    headline: "Structured execution with human approval built into the model.",
    color: "var(--color-continuum-light)",
    colorMuted: "var(--color-continuum-muted)",
    colorBorder: "var(--color-continuum-border)",
    business: "Counsel is the execution layer — but execution here means structured, approved, audited action, not automation. Counsel receives interpreted signals from Lyte, generates structured action recommendations, routes them for human approval, executes on approval, and records the complete chain. The action spine connects every consequential workflow from signal to audit.",
    product: "Each Counsel action is structured: action type, responsible actor, routing path, SLA expectation, evidence package, and confidence basis. The recommendation is not a generic alert — it is a structured proposal with the full context an approver needs to decide. Execution is scoped to the approved parameters only.",
    trust: "The approval gate is built into the Counsel execution model at the infrastructure level. Bypassing the gate requires an explicit override record. There is no silent execution path. Every action that executes has an approval record, a named approver, and an attribution timestamp.",
    operational: "Counsel's connector model uses scoped permissions. A connector configured for task assignment cannot read financial records. Connector health is monitored continuously. Failed executions are retried with exponential backoff and surfaced for operator review.",
  },
  {
    id: "packs",
    icon: Package,
    number: "04",
    label: "Pack-specific twins",
    headline: "Vertical domain packs extend the platform without bypassing the governance model.",
    color: "hsl(40,90%,54%)",
    colorMuted: "hsla(40,90%,54%,0.08)",
    colorBorder: "hsla(40,90%,54%,0.22)",
    business: "Defense operations (Aegis), maritime logistics (Vessels), real estate intelligence (Terra), and legal operations (Counsel) all have fundamentally different signal vocabularies, workflow models, and regulatory contexts. Pack-specific twins allow the platform to serve each vertical with domain-appropriate intelligence — without rebuilding the core governance model for each.",
    product: "Each domain pack extends Lyte's signal classification with pack-specific types, enriches the Counsel recommendation model with domain context, and surfaces domain-specific workflow surfaces. The pack sits above the core platform layer — it does not replace it.",
    trust: "Domain packs extend the governance model — they do not bypass it. Every signal, recommendation, approval, and action in a domain pack goes through the same core pipeline with the same approval tiers and audit requirements. Pack configuration cannot remove governance gates.",
    operational: "Pack deployments are versioned and independently updatable. A pack update does not affect core platform behavior. Pack-specific connectors are scoped to the data types required for that domain — no cross-pack permission leakage.",
  },
  {
    id: "proofchain",
    icon: Link2,
    number: "05",
    label: "Proof Chain",
    headline: "A complete, exportable lineage record for every consequential decision.",
    color: "hsl(145,62%,46%)",
    colorMuted: "hsla(145,62%,40%,0.08)",
    colorBorder: "hsla(145,62%,40%,0.20)",
    business: "Capital partners, regulators, and enterprise buyers need to know not just what happened, but why it happened, who authorized it, and what evidence supported the decision. The Proof Chain is the platform's answer: a structured, exportable lineage record attached to every consequential action.",
    product: "The Proof Chain captures: signal source and classification, interpretation and enrichment logic, AI recommendation with confidence basis, human approval with attribution and rationale, execution scope and connector, and outcome verification. The full chain is a first-class product output — not a log file accessed after the fact.",
    trust: "Proof Chains are written immutably at each pipeline stage. They cannot be retroactively modified. The chain is structured for export — JSON, CSV — in formats compatible with compliance review tools. Fields and formats are designed for external review use cases from the start.",
    operational: "Proof Chain records are retained for a minimum of seven years. They are stored in a tenant-isolated namespace with access controls matching the action sensitivity level. Proof Chain export is a governed event — routed through the same export controls as document exports.",
  },
  {
    id: "worldline",
    icon: Globe,
    number: "06",
    label: "External Intelligence",
    headline: "External intelligence context without external data liability.",
    color: "hsl(200,70%,52%)",
    colorMuted: "hsla(200,70%,52%,0.08)",
    colorBorder: "hsla(200,70%,52%,0.20)",
    business: "Operational intelligence is worthless without external context. Market movements, regulatory changes, counterparty events, and external signals all affect the meaning of internal data. The external intelligence layer ingests, structures, and attributes external context — without importing the liability of unstructured external data into the governance model.",
    product: "External intelligence ingests data through defined source connectors, applies provenance tagging at ingestion, and makes that data available to signal enrichment and interpretation stages. External intelligence appears in the platform with its origin, timestamp, and freshness clearly marked — never silently mixed with source-of-record data.",
    trust: "Every external data point carries a provenance record: origin system, ingestion timestamp, schema version, and processing status. External data cannot overwrite internal source-of-record data. Retention policies for external data are defined per source category and enforced at the storage layer.",
    operational: "External intelligence source connectors are configured by tenant admins. No silent collection from unconfigured sources. Source health is monitored continuously. Ingestion failures are surfaced as operational events — not silently dropped.",
  },
  {
    id: "graphql",
    icon: Network,
    number: "07",
    label: "Governance API",
    headline: "A typed, governed interface for every data access and action.",
    color: "hsl(258,55%,68%)",
    colorMuted: "hsla(258,55%,68%,0.08)",
    colorBorder: "hsla(258,55%,68%,0.20)",
    business: "Unstructured data access is the source of most governance failures in enterprise platforms — data that should be scoped leaks through undisciplined interfaces. The governance API gives the platform a typed, governed surface for all data access: every query is tenant-scoped, every mutation is permission-checked, every interface is versioned.",
    product: "The governance API serves as the single interface layer between all platform surfaces (Lyte, Counsel, packs) and the underlying data and connector services. Frontend surfaces, mobile clients, external integrations, and the audit layer all operate through the same typed interface — no side channels.",
    trust: "Every resolver is tenant-scoped by middleware. Cross-tenant data access is not possible through the governance API. Every mutation goes through the permission model. Interface versioning allows governance changes to propagate uniformly across all platform surfaces.",
    operational: "The governance API is monitored for query latency, error rates, and resolver performance. Schema changes are versioned and backward-compatible by policy. Breaking changes require a migration path — not a flag day.",
  },
  {
    id: "modelmesh",
    icon: Brain,
    number: "08",
    label: "Governed Inference",
    headline: "Governed model selection, inference, and output validation.",
    color: "hsl(258,55%,68%)",
    colorMuted: "hsla(258,55%,68%,0.08)",
    colorBorder: "hsla(258,55%,68%,0.20)",
    business: "AI capabilities differentiate the platform — but only if they operate under governance that buyers and capital partners can trust. The governed inference layer is the configuration and governance surface for all AI inference in the platform: model selection, prompt templates, context scoping, output validation, and training isolation.",
    product: "The governed inference layer allows per-tenant and per-task model configuration. Different actions can use different models. Prompt templates are versioned and governed. Output validation — confidence scoring, contradiction detection, source-grounding checks — runs before any AI output reaches a review queue.",
    trust: "Tenant data is never used for model training. Model providers receive only anonymized, scoped context — never raw client data. Training isolation is architectural, not a policy promise. Every model interaction is logged with the model version, prompt template version, and output confidence score.",
    operational: "Model provider health is monitored. Inference failures surface as operational events. Model version changes are logged in the audit record. Prompt template changes require a versioned deployment — not an ad-hoc update.",
  },
  {
    id: "trust-approvals",
    icon: ShieldCheck,
    number: "09",
    label: "Trust and approvals",
    headline: "Approval infrastructure is built into the platform, not applied on top of it.",
    color: "hsl(40,90%,54%)",
    colorMuted: "hsla(40,90%,54%,0.08)",
    colorBorder: "hsla(40,90%,54%,0.22)",
    business: "Trust is not a feature layer — it is an architectural property. The approval infrastructure, audit trail, proof chain, and governance model are built into the platform at the infrastructure level. They cannot be configured away, skipped in development mode, or bypassed without a logged exception.",
    product: "Every consequential action goes through the four-tier approval model: auto-cleared for low-risk reads, single reviewer for bounded actions, dual approval for external writes, senior authorization for irreversible actions. The approval gate is enforced at the Counsel execution layer — not as application logic.",
    trust: "The trust model is designed for external review: LP reporting, regulatory inquiry, enterprise compliance review. Fields, formats, and export paths are designed from that use case backward. Nothing in the trust model requires the reviewer to trust the platform's self-reporting.",
    operational: "Approval SLAs are enforced with escalation chains. If primary approvers are unavailable, the system escalates to configured fallbacks. SLA breaches are surfaced as operational events. Override records trigger mandatory post-hoc review — they are not logged silently.",
  },
  {
    id: "moat",
    icon: Lock,
    number: "10",
    label: "Why this is hard to copy",
    headline: "Eleven independent architectural properties that compound into a defensible whole.",
    color: "hsl(358,75%,58%)",
    colorMuted: "hsla(358,75%,58%,0.08)",
    colorBorder: "hsla(358,75%,58%,0.20)",
    business: "Any individual piece of this architecture can be copied. The moat is the combination: a six-stage governed pipeline, tenant-isolated at every layer, with domain packs that extend without bypassing governance, a proof chain attached to every action, a structured external intelligence layer, a typed governance API, a governed inference layer, and approval infrastructure built into the execution model — all designed for external review. Assembling these properties coherently takes years, not quarters.",
    product: "The product moat is the coherence: signal, command, action, approval, audit, and external intelligence all integrated in a platform that feels native to the operator's domain through pack-specific surfaces — not a generic tool with domain templates applied.",
    trust: "The trust moat is completeness: every layer has a governance property, every claim is backed by architecture rather than policy, and the entire system is designed to withstand external diligence review. No layer is exempt, no bypass is silent, no promise requires trusting the vendor.",
    operational: "The operational moat is the embedded observability: health monitoring, retry and replay, structured incidents, and runbook-backed procedures are not features added later — they are part of the architecture from the start. A competitor starting fresh would need to build all of this while simultaneously shipping product.",
  },
];

function SectionCard({ section, i }: { section: typeof ARCH_SECTIONS[0]; i: number }) {
  const Icon = section.icon;
  return (
    <m.div
      id={section.id}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: 0.05 }}
      className="szl-card"
      style={{ borderRadius: "1rem", overflow: "hidden" }}
    >
      <div style={{ padding: "clamp(1.5rem,3vw,2.5rem)", borderBottom: "1px solid var(--color-szl-border)", display: "flex", alignItems: "flex-start", gap: "1.25rem", background: `linear-gradient(135deg, ${section.colorMuted} 0%, transparent 80%)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", background: section.colorMuted, border: `1px solid ${section.colorBorder}`, borderRadius: "0.5625rem", flexShrink: 0 }}>
            <Icon size={20} color={section.color} />
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: section.color, marginBottom: "0.375rem" }}>
              Section {section.number}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-szl-text-muted)" }}>
              {section.label}
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: "clamp(1.5rem,3vw,2.5rem)" }}>
        <h2 style={{ fontSize: "clamp(1.25rem,2.5vw,1.75rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.22, marginBottom: "2rem", maxWidth: "40ch" }}>
          {section.headline}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
          {[
            { label: "Business purpose", text: section.business },
            { label: "Product purpose", text: section.product },
            { label: "Trust purpose", text: section.trust },
            { label: "Operational purpose", text: section.operational },
          ].map((quadrant) => (
            <div key={quadrant.label}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: section.color, marginBottom: "0.625rem", opacity: 0.85 }}>
                {quadrant.label}
              </div>
              <p style={{ fontSize: "0.875rem", lineHeight: 1.72, color: "hsl(214,7%,60%)" }}>{quadrant.text}</p>
            </div>
          ))}
        </div>
      </div>
    </m.div>
  );
}

export default function ArchitecturePage() {
  const __pageMeta = usePageMeta({
    title: "System Architecture — SZL Holdings",
    description: "Why this architecture exists, how Lyte, Counsel, packs, Proof Chain, external intelligence, the governance API, governed inference, and trust infrastructure work together — and why this is hard to copy.",
    canonical: "https://szlholdings.com/architecture",
  });

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
        <SiteNav />
        <main id="main-content" >
  
          {/* Hero */}
          <section className="szl-grid-texture szl-depth-glow-dual" style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)", borderBottom: "1px solid var(--color-szl-border)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.875rem", borderRadius: "99px", border: "1px solid hsla(145,62%,40%,0.22)", background: "hsla(145,62%,40%,0.08)", marginBottom: "1.75rem" }}>
                  <Layers size={13} color="hsl(145,62%,46%)" />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "hsl(145,62%,46%)" }}>System Architecture</span>
                </div>
                <h1 style={{ fontSize: "clamp(2.25rem,5vw,3.75rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.06, maxWidth: "22ch", marginBottom: "1.5rem" }}>
                  Ten layers. One governed pipeline. Built to be defensible.
                </h1>
                <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "55ch", marginBottom: "2rem" }}>
                  This page explains every architectural layer of Lyte + Counsel — what it does,
                  why it exists, what it means for trust, and what it means for operations.
                  Written for technical buyers, capital partners, and enterprise diligence teams.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  <Link href="/trust" className="szl-btn-secondary">
                    Trust Center →
                  </Link>
                  <Link href="/contact" className="szl-btn-primary">
                    Technical diligence conversation <ArrowRight size={14} />
                  </Link>
                </div>
              </m.div>
            </div>
          </section>
  
          {/* Section nav */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "1.5rem 0", background: "hsla(214,12%,5%,0.80)", position: "sticky", top: 0, zIndex: 10 }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)", overflowX: "auto" }}>
              <div style={{ display: "flex", gap: "0.375rem", flexWrap: "nowrap", minWidth: "max-content" }}>
                {ARCH_SECTIONS.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(214,7%,48%)", textDecoration: "none", padding: "0.3125rem 0.625rem", borderRadius: "0.3125rem", border: "1px solid transparent", whiteSpace: "nowrap", transition: "color 0.15s ease, border-color 0.15s ease" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = s.color; (e.currentTarget as HTMLElement).style.borderColor = s.colorBorder; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "hsl(214,7%,48%)"; (e.currentTarget as HTMLElement).style.borderColor = "transparent"; }}
                  >
                    {s.number} {s.label}
                  </a>
                ))}
              </div>
            </div>
          </section>
  
          {/* Architecture sections */}
          <section style={{ padding: "var(--space-section-md) 0", borderBottom: "1px solid var(--color-szl-border)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                {ARCH_SECTIONS.map((section, i) => (
                  <SectionCard key={section.id} section={section} i={i} />
                ))}
              </div>
            </div>
          </section>
  
          {/* Diagram: Signal-to-Action */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-lyte-light)", marginBottom: "0.75rem" }}>Signal pipeline</p>
                <h2 style={{ fontSize: "clamp(1.375rem,2.5vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.22, maxWidth: "36ch", marginBottom: "2rem" }}>
                  How every action flows from signal to audit record.
                </h2>
              </m.div>
              <SignalToActionDiagram />
            </div>
          </section>
  
          {/* Diagram: Approval Path */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(40,90%,54%)", marginBottom: "0.75rem" }}>HITL approval model</p>
                <h2 style={{ fontSize: "clamp(1.375rem,2.5vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.22, maxWidth: "36ch", marginBottom: "2rem" }}>
                  Four-tier human-in-the-loop gate structure.
                </h2>
              </m.div>
              <ApprovalPathDiagram />
            </div>
          </section>
  
          {/* Diagram: GraphQL Control Plane */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(258,55%,68%)", marginBottom: "0.75rem" }}>Governance API</p>
                <h2 style={{ fontSize: "clamp(1.375rem,2.5vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.22, maxWidth: "36ch", marginBottom: "2rem" }}>
                  The single, tenant-scoped data access layer.
                </h2>
              </m.div>
              <ControlPlaneDiagram />
            </div>
          </section>
  
          {/* Diagram: Pack-to-Platform */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(40,90%,54%)", marginBottom: "0.75rem" }}>Domain packs</p>
                <h2 style={{ fontSize: "clamp(1.375rem,2.5vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.22, maxWidth: "36ch", marginBottom: "2rem" }}>
                  How packs extend the platform without bypassing governance.
                </h2>
              </m.div>
              <PackToPlatformDiagram />
            </div>
          </section>
  
          {/* Diagram: Proof Chain */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(145,62%,46%)", marginBottom: "0.75rem" }}>Proof Chain</p>
                <h2 style={{ fontSize: "clamp(1.375rem,2.5vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.22, maxWidth: "36ch", marginBottom: "2rem" }}>
                  Immutable lineage from source to decision to export.
                </h2>
              </m.div>
              <ProofChainDiagram />
            </div>
          </section>
  
          {/* CTA */}
          <section style={{ borderTop: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <div className="szl-card" style={{ borderRadius: "1rem", padding: "clamp(2rem,4vw,3rem)", display: "grid", gridTemplateColumns: "1fr auto", gap: "2rem", alignItems: "center" }}>
                  <div>
                    <h2 style={{ fontSize: "clamp(1.375rem,2.5vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.22, marginBottom: "0.875rem", maxWidth: "32ch" }}>
                      Ready to go deeper on any layer?
                    </h2>
                    <p style={{ fontSize: "0.9375rem", lineHeight: 1.68, color: "hsl(214,7%,58%)", maxWidth: "50ch" }}>
                      We run technical diligence conversations for serious buyers and capital partners.
                      Ask any question about any layer — we will give you a direct, documented answer.
                    </p>
                  </div>
                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <Link href="/contact" className="szl-btn-primary">
                      Start a conversation <ArrowRight size={14} />
                    </Link>
                    <Link href="/trust" className="szl-btn-ghost">
                      Trust Center
                    </Link>
                  </div>
                </div>
              </m.div>
            </div>
          </section>
  
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
