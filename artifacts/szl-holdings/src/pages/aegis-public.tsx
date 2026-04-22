import { m } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight, ShieldCheck, CheckCircle2, FileText, Eye, Lock,
  Database, AlertTriangle, Zap, Server, Users, Clock, Layers, 
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { AlloyOperatingLoopDiagram } from "@/components/diagrams/AlloyOperatingLoopDiagram";

const WORKFLOW_STEPS = [
  {
    step: "01",
    label: "Threat Twin",
    body: "Every environment modeled as a live structured object — CVEs mapped to your stack, identity anomalies, misconfiguration drift, active incidents, and endpoint telemetry — assembled and continuously updated from connected security data.",
  },
  {
    step: "02",
    label: "Exposure & Readiness",
    body: "CISA KEV urgency scoring applied to known exploited vulnerabilities in your environment. Patch gaps, privilege anomalies, and identity drift scored by blast radius and exploitation likelihood. Readiness posture scored across your attack surface.",
  },
  {
    step: "03",
    label: "Governance Review",
    body: "Analyst reviews finding with NIST NVD context, asset criticality, and playbook recommendation. Structured review ensures findings are understood and prioritized before action is committed.",
  },
  {
    step: "04",
    label: "Response Action Queue",
    body: "Remediation steps and response actions routed to the right analyst through Alloy with SLA tracking, escalation path, and full context. No raw alert dumps. Structured, prioritized action queues.",
  },
  {
    step: "05",
    label: "Traceability",
    body: "Every investigation step, decision, action taken, and action deferred — logged with full analyst attribution and authorization basis. Compliance-ready record for SOC 2, ISO 27001, or board-level review.",
  },
];

const SIGNAL_SOURCES = [
  { label: "CISA KEV", detail: "CISA Known Exploited Vulnerabilities catalog — authoritative prioritization of vulnerabilities actively exploited in the wild" },
  { label: "NIST NVD", detail: "National Vulnerability Database — CVE detail, CVSS scoring, CWE classification, and affected platform data for vulnerability context" },
  { label: "Microsoft Security Feeds", detail: "Microsoft Threat Intelligence, Defender telemetry, and Entra ID signals for identity and endpoint context" },
  { label: "Identity & Endpoint Telemetry", detail: "Authentication anomalies, privilege escalation events, and endpoint behavioral signals from connected security platforms" },
];

const CAPABILITIES = [
  { icon: Eye, title: "Threat Twin", body: "A live structured model of your threat exposure — CVEs mapped to your stack, identity anomalies, misconfiguration drift, and active incidents — continuously updated." },
  { icon: AlertTriangle, title: "Exposure Scoring", body: "CISA KEV urgency and NIST NVD CVSS context applied to your environment. Every finding scored by exploitability, asset criticality, and blast radius." },
  { icon: Zap, title: "Incident Response Routing", body: "When a threat signal crosses threshold, Alloy routes the incident to the right analyst with full context, playbook reference, and human-gated approval chain ready." },
  { icon: Server, title: "XDR Signal Normalization", body: "Threat signals from endpoint, network, identity, and cloud layers normalized into a single structured feed — severity scored and context enriched across sources." },
  { icon: FileText, title: "Compliance Audit Trail", body: "Every security decision, investigation step, and remediation action logged with full attribution. Designed for SOC 2, ISO 27001, and NIST CSF — not as an afterthought." },
  { icon: Users, title: "Analyst Workflow Management", body: "Analyst assignment, workload balance, SLA tracking, and escalation ladders — so the right analyst handles the right finding at the right time with the right context." },
];

const TRUST_CONTROLS = [
  "Human-in-the-loop on all remediation actions — no autonomous execution without analyst approval",
  "Analyst attribution on every investigation step, decision, and deferred action",
  "Compliance-ready audit trail for SOC 2, ISO 27001, NIST CSF, and board reporting",
  "No cross-environment data sharing — isolated telemetry and findings per tenant",
  "Escalation controls — automatic supervisor notification when SLAs breach or decisions exceed analyst authority",
  "Evidence capture — before/after state, rationale, and authorization basis for every action taken",
];

const ALLOY_INHERITED = [
  {
    capability: "Approval Gates",
    description: "Every remediation action — patching, isolation, privilege revocation — requires analyst approval through Alloy's HITL gate before execution. No autonomous remediation.",
  },
  {
    capability: "Signal Normalization",
    description: "CVE feeds, KEV data, identity telemetry, and endpoint signals normalized into a consistent schema before evaluation — regardless of source format or ingestion rate.",
  },
  {
    capability: "Workflow Routing",
    description: "Findings, incidents, and remediation tasks routed to the right analyst with playbook context, SLA deadline, and escalation path already structured.",
  },
  {
    capability: "Immutable Audit Trail",
    description: "Every investigation step, response decision, and evidence review logged with analyst attribution and authorization basis — exportable for SOC 2, ISO 27001, or board review.",
  },
  {
    capability: "Connector Mesh",
    description: "Aegis integrates with SIEM, EDR, SOAR, and identity platforms through Alloy's connector layer — execution happens in existing tools without disruption.",
  },
  {
    capability: "Explainability",
    description: "Why was this CVE scored at this severity? Why was this incident escalated? Every evaluation is traceable to its data source and scoring criteria.",
  },
];

const UNIQUE_TO_AEGIS = [
  "Threat Twin — live multi-signal model of CVE exposure, identity anomalies, and active incidents mapped to your environment",
  "CISA KEV urgency scoring applied to your actual stack — not generic vulnerability data",
  "NIST NVD CVSS context enrichment with asset criticality and blast radius calculation",
  "XDR signal normalization across endpoint, network, identity, and cloud layers",
  "SOC analyst workflow management with assignment, SLA tracking, and escalation ladders",
  "Compliance-ready evidence capture for SOC 2, ISO 27001, and NIST CSF audit requirements",
];

export default function AegisPublicPage() {
  const __pageMeta = usePageMeta({
    title: "Aegis — Threat Twin & Security Operations Command | SZL Holdings",
    description: "Aegis gives security teams a command layer above their threat exposure. Threat Twin, CISA KEV scoring, NIST NVD context, incident routing, and compliance-ready audit trail.",
    canonical: "https://szlholdings.com/products/aegis",
  });

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
        <SiteNav />
        <main id="main-content" >
  
          {/* Maturity banner */}
          <div style={{ background: "hsla(222,60%,50%,0.07)", borderBottom: "1px solid hsla(222,60%,50%,0.18)", padding: "0.75rem var(--space-content-x)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Clock size={13} color="hsl(222,60%,62%)" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(222,60%,62%)" }}>
                  In Development
                </span>
              </div>
              <span style={{ fontSize: "0.8125rem", color: "hsl(214,7%,60%)", lineHeight: 1.5 }}>
                Aegis is in active development. Architecture is established and core capabilities are being built. We are not in general availability. If this fits your security operations environment, we want to have a direct conversation.
              </span>
            </div>
          </div>
  
          {/* Hero */}
          <section
            className="szl-grid-texture"
            style={{
              paddingTop: "var(--space-hero-pt)",
              paddingBottom: "clamp(5rem,9vw,7rem)",
              borderBottom: "1px solid var(--color-szl-border)",
              background: "radial-gradient(ellipse at 50% 0%, hsla(222,60%,50%,0.07) 0%, transparent 62%)",
            }}
          >
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.75rem" }}>
                  <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(222,60%,50%,0.10)", border: "1px solid hsla(222,60%,50%,0.22)", borderRadius: "8px" }}>
                    <ShieldCheck size={16} color="hsl(222,60%,62%)" />
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(222,60%,62%)" }}>
                    Aegis · Threat Intelligence & Security Operations
                  </span>
                </div>
              </m.div>
  
              <div style={{ display: "grid", gap: "clamp(2.5rem,5vw,4rem)", alignItems: "start" }} className="lg:grid-cols-[1.2fr_0.8fr]">
                <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05 }}>
                  <h1 style={{ fontSize: "clamp(2.5rem,5.5vw,4.25rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: "1.5rem", maxWidth: "22ch" }}>
                    SOC command for environments where every decision has consequence.
                  </h1>
                  <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "50ch", marginBottom: "0.875rem" }}>
                    Aegis gives security teams a command layer above their threat exposure. Threat Twin maps every CVE and identity signal to your actual environment. Alloy routes response through governed analyst workflows — with human approval at every consequential action.
                  </p>
                  <p style={{ fontSize: "clamp(0.9375rem,1.6vw,1rem)", lineHeight: 1.72, color: "hsl(214,7%,52%)", maxWidth: "50ch", marginBottom: "2.25rem" }}>
                    Built for environments where CISA KEV urgency is real, where compliance traceability is non-negotiable, and where no action can be autonomous.
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                    <Link href="/contact" className="szl-btn-primary">Request a design partner conversation <ArrowRight size={15} /></Link>
                    <Link href="/demo" className="szl-btn-secondary">See the flagship workflow</Link>
                  </div>
                </m.div>
  
                <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.15 }} style={{ borderRadius: "0.875rem", padding: "clamp(1.25rem,3vw,1.75rem)", background: "hsla(222,60%,50%,0.04)", border: "1px solid hsla(222,60%,50%,0.15)" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>
                    What Aegis answers
                  </p>
                  {[
                    "Which CISA KEV vulnerabilities are present and unpatched in our environment?",
                    "What identity anomalies have crossed threshold in the last 24 hours?",
                    "Which incidents are assigned, which are stalled, and which are unassigned?",
                    "What is the current exposure posture across our critical assets?",
                    "Which remediation actions are pending analyst approval right now?",
                    "What is the audit record for every action taken on this incident?",
                  ].map((q, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", marginBottom: "0.75rem" }}>
                      <CheckCircle2 size={14} color="hsl(222,60%,62%)" style={{ marginTop: "2px", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "hsl(214,7%,72%)" }}>{q}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--color-szl-border)" }}>
                    <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,48%)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                      SOC operations · Compliance · Board reporting
                    </p>
                  </div>
                </m.div>
              </div>
            </div>
          </section>
  
          {/* Lane definition & strategic rationale */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <div style={{ display: "grid", gap: "clamp(3rem,6vw,5rem)", alignItems: "start" }} className="lg:grid-cols-2">
                <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(222,60%,62%)", marginBottom: "1rem" }}>Lane Definition</p>
                  <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, marginBottom: "1.25rem" }}>
                    Why security operations. Why this architecture.
                  </h2>
                  <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "46ch", marginBottom: "1.25rem" }}>
                    Security operations is a domain drowning in signal volume and starved for structured action. The typical SIEM gives analysts raw alerts. The typical SOAR automates without sufficient human judgment. Aegis applies Alloy's governed operating loop to the security workflow — so analysts act on context, not noise, and every action has a traceable record.
                  </p>
                  <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,54%)", maxWidth: "46ch" }}>
                    The architecture mirrors Counsel's operating model: a structured threat object (Threat Twin), signal enrichment from authoritative intelligence sources, governed response routing through Alloy, and a compliance-ready audit footprint for every security decision.
                  </p>
                </m.div>
                <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.08 }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(222,60%,62%)", marginBottom: "1rem" }}>Target Users</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                    {[
                      { role: "SOC Lead / Director", scope: "Analyst workload management, incident queue oversight, SLA tracking, board-level posture reporting" },
                      { role: "SOC Analyst (T2/T3)", scope: "Structured investigation workflow, context-rich finding triage, governed response action queue" },
                      { role: "CISO / VP Security", scope: "Portfolio exposure posture, compliance audit readiness, governance deviation reporting" },
                      { role: "Compliance Officer", scope: "SOC 2, ISO 27001, NIST CSF evidence trail, audit export, control coverage visibility" },
                      { role: "Incident Response Lead", scope: "Threat Twin context, response action governance, post-incident audit record" },
                    ].map((user, i) => (
                      <div key={i} style={{ padding: "0.875rem 1rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                          <Users size={11} color="hsl(222,60%,62%)" />
                          <p style={{ fontSize: "12px", fontWeight: 700, color: "hsl(38,12%,82%)" }}>{user.role}</p>
                        </div>
                        <p style={{ fontSize: "11px", lineHeight: 1.55, color: "hsl(214,7%,50%)" }}>{user.scope}</p>
                      </div>
                    ))}
                  </div>
                </m.div>
              </div>
            </div>
          </section>
  
          {/* Workflow */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(222,60%,62%)", marginBottom: "1rem" }}>
                  Sample Use Case
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "3rem" }}>
                  From Threat Twin to compliance record — every step traced.
                </h2>
              </m.div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {WORKFLOW_STEPS.map((s, i) => (
                  <m.div key={s.step} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.38, delay: i * 0.07 }} style={{ display: "flex", gap: "1.5rem", padding: "1.25rem 1.5rem", borderRadius: "10px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)", alignItems: "flex-start" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: "hsl(222,60%,62%)", letterSpacing: "0.06em", flexShrink: 0, marginTop: "2px" }}>{s.step}</div>
                    <div>
                      <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.375rem", color: "hsl(38,8%,90%)" }}>{s.label}</h3>
                      <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "hsl(214,7%,60%)" }}>{s.body}</p>
                    </div>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Capabilities */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(222,60%,62%)", marginBottom: "1rem" }}>Core Capabilities</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>The full security operations stack, governed.</h2>
              </m.div>
              <div className="szl-grid-3">
                {CAPABILITIES.map((cap, i) => {
                  const Icon = cap.icon;
                  return (
                    <m.div key={cap.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.38, delay: i * 0.06 }} className="szl-card" style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}>
                      <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(222,60%,50%,0.09)", border: "1px solid hsla(222,60%,50%,0.18)", borderRadius: "0.4375rem", marginBottom: "1rem" }}>
                        <Icon size={16} color="hsl(222,60%,62%)" />
                      </div>
                      <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.625rem" }}>{cap.title}</h3>
                      <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{cap.body}</p>
                    </m.div>
                  );
                })}
              </div>
            </div>
          </section>
  
          {/* Alloy inheritance */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(222,60%,62%)", marginBottom: "1rem" }}>
                  What Aegis Inherits from Alloy
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "32ch", marginBottom: "1.25rem" }}>
                  The execution fabric comes with every lane. Aegis builds on top of it.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,58%)", maxWidth: "52ch", marginBottom: "2.5rem" }}>
                  Aegis does not rebuild what Alloy already provides. Every capability below is inherited from the shared platform — the same infrastructure governing Counsel, Vessels, Terra, and Carlota Jo.
                </p>
              </m.div>
              <div style={{ display: "grid", gap: "1rem", marginBottom: "2.5rem" }} className="lg:grid-cols-3 md:grid-cols-2">
                {ALLOY_INHERITED.map((item, i) => (
                  <m.div
                    key={item.capability}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.38, delay: i * 0.06 }}
                    style={{ padding: "1.25rem", borderRadius: "0.75rem", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.07)" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
                      <Layers size={13} color="hsl(222,60%,62%)" style={{ flexShrink: 0 }} />
                      <h3 style={{ fontSize: "0.875rem", fontWeight: 700, letterSpacing: "-0.010em", color: "hsl(38,8%,88%)" }}>{item.capability}</h3>
                    </div>
                    <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "hsl(214,7%,58%)" }}>{item.description}</p>
                  </m.div>
                ))}
              </div>
              <m.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <AlloyOperatingLoopDiagram compact />
              </m.div>
            </div>
          </section>
  
          {/* Signal sources + unique */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <div style={{ display: "grid", gap: "clamp(3rem,6vw,5rem)", alignItems: "start" }} className="lg:grid-cols-2">
                <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(222,60%,62%)", marginBottom: "1rem" }}>Signal Sources</p>
                  <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, marginBottom: "1.25rem" }}>Authoritative threat intelligence in every threat model.</h2>
                  <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "46ch" }}>
                    Aegis connects to CISA, NIST, Microsoft Security, and your endpoint and identity platforms — weaving authoritative threat intelligence into each environment's threat twin so analysts have context before they act.
                  </p>
                </m.div>
                <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.08 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {SIGNAL_SOURCES.map((source, i) => (
                      <div key={i} style={{ padding: "1rem 1.25rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                          <Database size={11} color="hsl(222,60%,62%)" />
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
  
          {/* What's unique to Aegis */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(222,60%,62%)", marginBottom: "1rem" }}>
                  What's Unique to Aegis
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "2.5rem" }}>
                  Security-specific capabilities built on the shared platform.
                </h2>
              </m.div>
              <div style={{ display: "grid", gap: "0.75rem" }} className="lg:grid-cols-2">
                {UNIQUE_TO_AEGIS.map((item, i) => (
                  <m.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.06 }} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "1rem 1.25rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
                    <ShieldCheck size={13} color="hsl(222,60%,62%)" style={{ marginTop: "2px", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "hsl(214,7%,64%)" }}>{item}</span>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Trust */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(222,60%,62%)", marginBottom: "1rem" }}>Trust Controls</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "2.5rem" }}>Governance built for high-consequence security operations.</h2>
              </m.div>
              <div style={{ display: "grid", gap: "0.75rem" }} className="lg:grid-cols-2">
                {TRUST_CONTROLS.map((control, i) => (
                  <m.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.06 }} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "1rem 1.25rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
                    <Lock size={13} color="hsl(222,60%,62%)" style={{ marginTop: "2px", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "hsl(214,7%,64%)" }}>{control}</span>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Maturity state */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(222,60%,62%)", marginBottom: "1rem" }}>
                  Maturity & Path to Pilot
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "1.25rem" }}>
                  In development. Honest about it.
                </h2>
              </m.div>
              <div style={{ display: "grid", gap: "1rem" }} className="lg:grid-cols-3">
                {[
                  {
                    label: "Architecture",
                    status: "Established",
                    statusColor: "hsl(142,60%,46%)",
                    description: "Threat Twin model, signal integration schema, Alloy connector design, and compliance audit trail structure are defined.",
                  },
                  {
                    label: "Core Capabilities",
                    status: "In Development",
                    statusColor: "hsl(40,85%,55%)",
                    description: "CISA KEV integration, NIST NVD enrichment, XDR normalization, and Alloy-gated analyst workflow are in active development.",
                  },
                  {
                    label: "General Availability",
                    status: "Not Yet",
                    statusColor: "hsl(214,7%,50%)",
                    description: "Aegis is not in general availability. We are evaluating design partner fit with a small number of security-sensitive organizations.",
                  },
                ].map((item, i) => (
                  <m.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.38, delay: i * 0.07 }}
                    style={{ padding: "1.375rem", borderRadius: "0.75rem", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.07)" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                      <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "hsl(38,8%,88%)" }}>{item.label}</h3>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", fontWeight: 700, color: item.statusColor, letterSpacing: "0.08em", textTransform: "uppercase", background: `${item.statusColor}18`, padding: "2px 6px", borderRadius: "4px", border: `1px solid ${item.statusColor}30` }}>
                        {item.status}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "hsl(214,7%,58%)" }}>{item.description}</p>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          {/* CTA */}
          <section style={{ padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }} style={{ borderRadius: "1rem", padding: "clamp(2.5rem,5vw,4rem)", gap: "2.5rem", alignItems: "center", background: "hsla(222,60%,50%,0.05)", border: "1px solid hsla(222,60%,50%,0.16)" }} className="szl-grid-cta">
                <div>
                  <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, marginBottom: "0.875rem" }}>
                    The right fit for your security operations?
                  </h2>
                  <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "48ch" }}>
                    Aegis is appropriate for security teams operating in high-consequence environments where compliance traceability is mandatory and analyst judgment cannot be bypassed. If that describes your environment, let's have a direct conversation.
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flexShrink: 0 }}>
                  <Link href="/contact" className="szl-btn-primary">Start a conversation <ArrowRight size={14} /></Link>
                  <Link href="/demo" className="szl-btn-secondary" style={{ textAlign: "center" }}>See the flagship workflow</Link>
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
