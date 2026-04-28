import { m } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight, Ship, CheckCircle2, FileText, Eye, Lock, Database,
  AlertTriangle, Map, Anchor, Wind, Clock, Users, Layers, 
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { ContinuumOperatingLoopDiagram } from "@/components/diagrams/ContinuumOperatingLoopDiagram";

const WORKFLOW_STEPS = [
  {
    step: "01",
    label: "Voyage Twin",
    body: "Every voyage modeled as a live structured object — vessel position via AIS, cargo manifest, port schedule, crew certification status, weather exposure, and compliance flags — assembled and updated as conditions change.",
  },
  {
    step: "02",
    label: "Weather & Port Context",
    body: "NWS marine forecasts overlaid on the route plan. BTS port statistics and pre-arrival condition data layered onto the arrival schedule. Weather deviation risks and port congestion signals surfaced ahead of arrival.",
  },
  {
    step: "03",
    label: "Route Risk",
    body: "Weather deviations, OFAC sanction screening on parties and ports, and port delay signals scored by severity and operational impact. Rerouting recommendations generated with trade-off analysis.",
  },
  {
    step: "04",
    label: "Readiness Assessment",
    body: "Crew certification currency, cargo compliance status, and pre-arrival checklist completion reviewed against port requirements and operator standards before the vessel commits to approach.",
  },
  {
    step: "05",
    label: "Action & Export",
    body: "Rerouting decisions, port notifications, and regulatory filings routed through Counsel with human approval gate, SLA tracking, and a full audit record of every decision made during the voyage.",
  },
];

const SIGNAL_SOURCES = [
  { label: "NWS Marine Forecasts", detail: "NOAA National Weather Service marine zone forecasts, coastal warnings, and offshore sea state predictions along route corridors" },
  { label: "USCG AIS", detail: "US Coast Guard Automatic Identification System — vessel position, heading, speed, and identification for tracked maritime traffic" },
  { label: "BTS Port Statistics", detail: "Bureau of Transportation Statistics port throughput, congestion trends, and vessel arrival pattern data" },
  { label: "OFAC Sanctions", detail: "US Treasury Office of Foreign Assets Control screening for sanctioned parties, vessels, ports, and flag states in the voyage profile" },
];

const CAPABILITIES = [
  { icon: Eye, title: "Voyage Twin", body: "A live structured model of each voyage — vessel position, cargo status, port schedule, weather exposure, crew, and compliance flags — updated as conditions change." },
  { icon: Wind, title: "Weather & Route Risk", body: "NWS marine forecasts integrated into route analysis. Weather deviation risk scored and surfaced before it becomes a commercial incident." },
  { icon: Map, title: "Port Intelligence", body: "BTS port data, pre-arrival conditions, and berth availability layered onto arrival schedules. Congestion and delay signals surfaced ahead of time." },
  { icon: AlertTriangle, title: "Exception Detection", body: "Port delays, cargo holds, crew incidents, and OFAC flags surfaced as structured exceptions — scored by severity and commercial impact." },
  { icon: Anchor, title: "Pre-Arrival Workflow", body: "Pre-arrival checklists, berth scheduling, agent coordination, and customs workflows routed through Counsel with approval gates and follow-through tracking." },
  { icon: FileText, title: "Regulatory Audit Trail", body: "Every maritime operation leaves a compliance footprint — Vessels captures it automatically with full attribution for cargo, crew, customs, and port operations." },
];

const TRUST_CONTROLS = [
  "Human approval on rerouting decisions and material compliance exceptions",
  "Full crew and cargo attribution on every voyage record",
  "OFAC and regulatory screening logged with actor attribution and timestamp",
  "Immutable voyage audit record — exportable for flag state, port authority, or insurer review",
  "Role-based access — commercial, operations, and chartering teams see their scope",
  "No autonomous rerouting or compliance filing without explicit approval",
];

const ALLOY_INHERITED = [
  {
    capability: "Approval Gates",
    description: "Every material voyage decision — rerouting, cargo hold, port exception — requires explicit human approval through Counsel's HITL gate before execution.",
  },
  {
    capability: "Signal Normalization",
    description: "AIS positions, NWS forecasts, OFAC flags, and port data normalized into a consistent schema before evaluation — regardless of source format or update frequency.",
  },
  {
    capability: "Workflow Routing",
    description: "Pre-arrival tasks, compliance reviews, and exception escalations routed to the right operator with context, deadline, and authority scope already structured.",
  },
  {
    capability: "Immutable Audit Trail",
    description: "Every decision in the voyage lifecycle — from route change to regulatory filing — logged with actor attribution, authorization basis, and exportable for external review.",
  },
  {
    capability: "Connector Mesh",
    description: "Vessels integrates with fleet management systems, port agent platforms, and regulatory databases through Counsel's connector layer — no disruption to existing tools.",
  },
  {
    capability: "Explainability",
    description: "Why was a reroute recommended? Why was an OFAC flag elevated to this severity? Every recommendation is traceable to its data source and evaluation criteria.",
  },
];

const UNIQUE_TO_VESSELS = [
  "Voyage Twin — live multi-signal model of vessel, cargo, crew, weather, and compliance status",
  "Maritime-specific signal integration: USCG AIS, NWS Marine, BTS port data, OFAC screening",
  "Route risk scoring with weather deviation, port congestion, and sanction-party detection",
  "Crew certification tracking with expiration alerts and pre-arrival readiness scoring",
  "Pre-arrival workflow management for berth scheduling, customs, and agent coordination",
  "Maritime regulatory audit footprint — structured for flag state, port authority, and insurer review",
];

export default function VesselsPublicPage() {
  const __pageMeta = usePageMeta({
    title: "Vessels — Voyage Twin & Maritime Intelligence | SZL Holdings",
    description: "Vessels gives maritime operators a command layer above fleet operations. Voyage Twin, weather and route risk, USCG AIS, OFAC screening, and governed action routing.",
    canonical: "https://szlholdings.com/products/vessels",
  });

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
        <SiteNav />
        <main id="main-content" >
  
          {/* Maturity banner */}
          <div style={{ background: "hsla(206,72%,40%,0.07)", borderBottom: "1px solid hsla(206,72%,40%,0.18)", padding: "0.75rem var(--space-content-x)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Clock size={13} color="hsl(206,72%,52%)" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(206,72%,52%)" }}>
                  Design Partner Stage
                </span>
              </div>
              <span style={{ fontSize: "0.8125rem", color: "hsl(214,7%,60%)", lineHeight: 1.5 }}>
                Vessels is in active design partner engagements with maritime operators. Architecture and core capabilities are established. We are not yet in general availability. If this is the right fit, we want to hear from you.
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
              background: "radial-gradient(ellipse at 50% 0%, hsla(206,72%,40%,0.07) 0%, transparent 62%)",
            }}
          >
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.75rem" }}>
                  <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(206,72%,40%,0.10)", border: "1px solid hsla(206,72%,40%,0.22)", borderRadius: "8px" }}>
                    <Ship size={16} color="hsl(206,72%,52%)" />
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(206,72%,52%)" }}>
                    Vessels · Maritime Intelligence
                  </span>
                </div>
              </m.div>
  
              <div style={{ display: "grid", gap: "clamp(2.5rem,5vw,4rem)", alignItems: "start" }} className="lg:grid-cols-[1.2fr_0.8fr]">
                <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05 }}>
                  <h1 style={{ fontSize: "clamp(2.5rem,5.5vw,4.25rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: "1.5rem", maxWidth: "22ch" }}>
                    Command-grade visibility for assets underway.
                  </h1>
                  <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "50ch", marginBottom: "0.875rem" }}>
                    Vessels gives maritime operators a command layer above fleet operations. Voyage Twin tracks every signal across position, cargo, weather, crew, and compliance. Counsel routes action through governed workflows with full audit trail.
                  </p>
                  <p style={{ fontSize: "clamp(0.9375rem,1.6vw,1rem)", lineHeight: 1.72, color: "hsl(214,7%,52%)", maxWidth: "50ch", marginBottom: "2.25rem" }}>
                    From weather deviation to regulatory filing — with human approval at every material decision point.
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                    <Link href="/contact" className="szl-btn-primary">Request a design partner conversation <ArrowRight size={15} /></Link>
                    <Link href="/demo" className="szl-btn-secondary">See the flagship workflow</Link>
                  </div>
                </m.div>
  
                <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.15 }} style={{ borderRadius: "0.875rem", padding: "clamp(1.25rem,3vw,1.75rem)", background: "hsla(206,72%,40%,0.04)", border: "1px solid hsla(206,72%,40%,0.15)" }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>
                    What Vessels answers
                  </p>
                  {[
                    "Which voyages have weather exposure above acceptable threshold?",
                    "Are any vessels or cargo parties flagged on OFAC lists?",
                    "What is the pre-arrival readiness status for arrivals in the next 48 hours?",
                    "Which port operations have open compliance exceptions?",
                    "Where are crew certifications approaching expiration?",
                    "What exceptions are currently unresolved in the fleet?",
                  ].map((q, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", marginBottom: "0.75rem" }}>
                      <CheckCircle2 size={14} color="hsl(206,72%,52%)" style={{ marginTop: "2px", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "hsl(214,7%,72%)" }}>{q}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--color-szl-border)" }}>
                    <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,48%)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                      Fleet ops · Commercial · Chartering · Compliance
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
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(206,72%,52%)", marginBottom: "1rem" }}>Lane Definition</p>
                  <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, marginBottom: "1.25rem" }}>
                    Why maritime. Why now.
                  </h2>
                  <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "46ch", marginBottom: "1.25rem" }}>
                    Maritime is a domain where critical decisions — rerouting, cargo holds, regulatory filings — are still made from fragmented data, disconnected systems, and manual reconciliation. Vessels applies Counsel's operating loop to the voyage lifecycle: a domain where the cost of undetected risk compounds fast and audit trails are legally required.
                  </p>
                  <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,54%)", maxWidth: "46ch" }}>
                    The architecture generalizes from Counsel's operating model — a structured object (Voyage Twin, parallel to Matter Twin), signal enrichment from authoritative public data sources, governed action routing through Counsel, and a compliance-ready audit footprint.
                  </p>
                </m.div>
                <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.08 }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(206,72%,52%)", marginBottom: "1rem" }}>Target Users</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                    {[
                      { role: "Fleet Operations Manager", scope: "Voyage Twin oversight, exception management, pre-arrival readiness tracking" },
                      { role: "Commercial Manager", scope: "Route optimization, port intelligence, cargo compliance status" },
                      { role: "Chartering Team", scope: "Vessel availability, voyage performance, charter party compliance" },
                      { role: "Compliance Officer", scope: "OFAC screening records, regulatory audit trail, crew certification status" },
                      { role: "Port Agent Coordinator", scope: "Pre-arrival workflow, berth scheduling, customs documentation" },
                    ].map((user, i) => (
                      <div key={i} style={{ padding: "0.875rem 1rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                          <Users size={11} color="hsl(206,72%,52%)" />
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
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(206,72%,52%)", marginBottom: "1rem" }}>
                  Sample Use Case
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "3rem" }}>
                  From Voyage Twin to governed action — every step traced.
                </h2>
              </m.div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {WORKFLOW_STEPS.map((s, i) => (
                  <m.div key={s.step} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.38, delay: i * 0.07 }} style={{ display: "flex", gap: "1.5rem", padding: "1.25rem 1.5rem", borderRadius: "10px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)", alignItems: "flex-start" }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: "hsl(206,72%,52%)", letterSpacing: "0.06em", flexShrink: 0, marginTop: "2px" }}>{s.step}</div>
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
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(206,72%,52%)", marginBottom: "1rem" }}>Core Capabilities</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>Command-grade maritime intelligence.</h2>
              </m.div>
              <div className="szl-grid-3">
                {CAPABILITIES.map((cap, i) => {
                  const Icon = cap.icon;
                  return (
                    <m.div key={cap.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.38, delay: i * 0.06 }} className="szl-card" style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}>
                      <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(206,72%,40%,0.09)", border: "1px solid hsla(206,72%,40%,0.18)", borderRadius: "0.4375rem", marginBottom: "1rem" }}>
                        <Icon size={16} color="hsl(206,72%,52%)" />
                      </div>
                      <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.625rem" }}>{cap.title}</h3>
                      <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{cap.body}</p>
                    </m.div>
                  );
                })}
              </div>
            </div>
          </section>
  
          {/* Counsel inheritance */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(206,72%,52%)", marginBottom: "1rem" }}>
                  What Vessels Inherits from Counsel
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "32ch", marginBottom: "1.25rem" }}>
                  The execution fabric comes with every lane. Vessels builds on top of it.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,58%)", maxWidth: "52ch", marginBottom: "2.5rem" }}>
                  Vessels does not rebuild what Counsel already provides. Every capability below is inherited from the shared platform — the same infrastructure that governs Counsel, Terra, Aegis, and Carlota Jo.
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
                      <Layers size={13} color="hsl(206,72%,52%)" style={{ flexShrink: 0 }} />
                      <h3 style={{ fontSize: "0.875rem", fontWeight: 700, letterSpacing: "-0.010em", color: "hsl(38,8%,88%)" }}>{item.capability}</h3>
                    </div>
                    <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "hsl(214,7%,58%)" }}>{item.description}</p>
                  </m.div>
                ))}
              </div>
  
              <m.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <ContinuumOperatingLoopDiagram compact />
              </m.div>
            </div>
          </section>
  
          {/* Unique to Vessels */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <div style={{ display: "grid", gap: "clamp(3rem,6vw,5rem)", alignItems: "start" }} className="lg:grid-cols-2">
                <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(206,72%,52%)", marginBottom: "1rem" }}>Signal Sources</p>
                  <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, marginBottom: "1.25rem" }}>Authoritative maritime data in every voyage model.</h2>
                  <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "46ch" }}>
                    Vessels connects to authoritative government and regulatory data sources — USCG AIS, NWS marine, BTS port data, and OFAC screening — and weaves those signals into each voyage's twin in real time.
                  </p>
                </m.div>
                <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.08 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {SIGNAL_SOURCES.map((source, i) => (
                      <div key={i} style={{ padding: "1rem 1.25rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                          <Database size={11} color="hsl(206,72%,52%)" />
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
  
          {/* What's unique to Vessels */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(206,72%,52%)", marginBottom: "1rem" }}>
                  What's Unique to Vessels
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "2.5rem" }}>
                  Maritime-specific capabilities built on the shared platform.
                </h2>
              </m.div>
              <div style={{ display: "grid", gap: "0.75rem" }} className="lg:grid-cols-2">
                {UNIQUE_TO_VESSELS.map((item, i) => (
                  <m.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.06 }} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "1rem 1.25rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
                    <Ship size={13} color="hsl(206,72%,52%)" style={{ marginTop: "2px", flexShrink: 0 }} />
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
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(206,72%,52%)", marginBottom: "1rem" }}>Trust Controls</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "2.5rem" }}>Governed from voyage signal to regulatory record.</h2>
              </m.div>
              <div style={{ display: "grid", gap: "0.75rem" }} className="lg:grid-cols-2">
                {TRUST_CONTROLS.map((control, i) => (
                  <m.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.06 }} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "1rem 1.25rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
                    <Lock size={13} color="hsl(206,72%,52%)" style={{ marginTop: "2px", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "hsl(214,7%,64%)" }}>{control}</span>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Maturity state + path to pilot */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(206,72%,52%)", marginBottom: "1rem" }}>
                  Maturity & Path to Pilot
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "1.25rem" }}>
                  Staged and honest about where we are.
                </h2>
              </m.div>
              <div style={{ display: "grid", gap: "1rem" }} className="lg:grid-cols-3">
                {[
                  {
                    label: "Architecture",
                    status: "Established",
                    statusColor: "hsl(142,60%,46%)",
                    description: "Voyage Twin model, signal integration schema, Counsel connector design, and audit trail structure are defined and validated.",
                  },
                  {
                    label: "Core Capabilities",
                    status: "In Development",
                    statusColor: "hsl(40,85%,55%)",
                    description: "AIS integration, NWS marine signal ingestion, OFAC screening, and pre-arrival workflow routing are being built in active development.",
                  },
                  {
                    label: "General Availability",
                    status: "Not Yet",
                    statusColor: "hsl(214,7%,50%)",
                    description: "Vessels is not generally available. We are working with a small number of design partner operators under structured engagements.",
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
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }} style={{ borderRadius: "1rem", padding: "clamp(2.5rem,5vw,4rem)", gap: "2.5rem", alignItems: "center", background: "hsla(206,72%,40%,0.05)", border: "1px solid hsla(206,72%,40%,0.16)" }} className="szl-grid-cta">
                <div>
                  <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, marginBottom: "0.875rem" }}>
                    The right fit for your fleet operations?
                  </h2>
                  <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "48ch" }}>
                    We work with a small number of maritime operators in structured design partner engagements — real voyages, real weather exposure, real port operations. If this fits, reach out and we'll have a direct conversation.
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
