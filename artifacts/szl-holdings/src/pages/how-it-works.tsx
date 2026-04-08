import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Layers, Zap, Shield, Eye, Workflow, Brain, Radio, CheckCircle, Scale, Ship, Building2, ShieldCheck, BriefcaseBusiness } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const STACK_LAYERS = [
  {
    number: "01",
    title: "Signal Ingestion",
    subtitle: "Worldline Engine",
    desc: "Public APIs, business systems, and domain-specific data feeds are normalized into a unified signal stream. Every data point carries source attribution, retrieval timestamp, and confidence metadata.",
    icon: Radio,
    color: "hsl(192,72%,48%)",
  },
  {
    number: "02",
    title: "Intelligence Processing",
    subtitle: "Model Mesh + AI Routing",
    desc: "Signals are processed through domain-specific AI models routed by the Model Mesh. Task classification determines which model handles each request, with cost and capability optimization. Every routing decision is logged.",
    icon: Brain,
    color: "hsl(258,55%,68%)",
  },
  {
    number: "03",
    title: "State Observation",
    subtitle: "Digital Twins + Pressure Graphs",
    desc: "Processed intelligence updates domain-specific digital twins — living snapshots of matters, properties, vessels, or threat landscapes. Pressure graphs surface risk dimensions and anomaly patterns.",
    icon: Eye,
    color: "hsl(38,52%,58%)",
  },
  {
    number: "04",
    title: "Decision Surface",
    subtitle: "Lyte Command Layer",
    desc: "Lyte presents observed state as actionable intelligence — not dashboards. Forecasts, risk assessments, and recommended actions surface in context with the signals that inform them.",
    icon: Zap,
    color: "hsl(192,72%,48%)",
  },
  {
    number: "05",
    title: "Governed Execution",
    subtitle: "Alloy Action Spine",
    desc: "When a decision is made, Alloy routes the resulting action through approval gates, role-based authorization, and compliance checks. Every execution is logged with actor identity, rationale, and outcome.",
    icon: Workflow,
    color: "hsl(38,72%,58%)",
  },
  {
    number: "06",
    title: "Proof & Audit",
    subtitle: "Proof Chain + Trust Layer",
    desc: "Every decision, action, and state change is recorded in a SHA-256 hashed proof chain. Complete audit trail from signal ingestion through execution. Tamper-evident by construction.",
    icon: Shield,
    color: "hsl(145,62%,46%)",
  },
];

const VERTICALS = [
  { name: "PRISM Counsel", domain: "Legal matter observability", signal: "Claims, deadlines, documents, communications", output: "Governed legal actions, demand packets, audit trails", href: "/solutions/prism-counsel", color: "hsl(38,72%,58%)", icon: Scale },
  { name: "Terra", domain: "Real estate intelligence", signal: "PLUTO, FEMA, permits, market data", output: "Acquisition signals, diligence workflows, LP reports", href: "/solutions/terra", color: "hsl(140,50%,48%)", icon: Building2 },
  { name: "Vessels", domain: "Maritime operations", signal: "AIS, NWS, NOAA, port statistics", output: "Route optimization, weather routing, fleet monitoring", href: "/solutions/vessels", color: "hsl(206,72%,52%)", icon: Ship },
  { name: "Aegis", domain: "Security & defense", signal: "CISA, NVD, MITRE ATT&CK, threat feeds", output: "Threat triage, incident response, compliance evidence", href: "/solutions/aegis", color: "hsl(222,60%,62%)", icon: ShieldCheck },
  { name: "Carlota Jo", domain: "Executive advisory", signal: "Market intelligence, organizational data, capital signals", output: "Strategic recommendations, execution frameworks, advisory deliverables", href: "/services/carlota-jo", color: "hsl(280,50%,65%)", icon: BriefcaseBusiness },
];

const DIFFERENTIATORS = [
  { title: "Signal to action, not dashboards", desc: "Every screen moves from observed signal to recommended action to governed execution. No static charts that require interpretation." },
  { title: "One architecture, many domains", desc: "The same signal, intelligence, observation, action, and proof pipeline runs across legal, real estate, maritime, security, and advisory. Domain expertise lives in the vertical pack, not the plumbing." },
  { title: "Traceable AI, not magic", desc: "Every AI output shows what informed it, which model processed it, and what confidence it carries. When AI fails, you see why." },
  { title: "Built-in accountability", desc: "Governance is a structural constraint. Proof chains, approval gates, and decision lineage are embedded in the architecture, not bolted on." },
];

export default function HowItWorksPage() {
  usePageMeta({
    title: "How It Works — SZL Holdings",
    description: "How the SZL platform transforms raw signals into governed business action through six architectural layers — from ingestion to proof chain.",
    canonical: "https://szlholdings.com/how-it-works",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        <section
          className="szl-grid-texture szl-depth-glow-gold"
          style={{
            paddingTop: "var(--space-hero-pt)",
            paddingBottom: "clamp(4rem,8vw,6rem)",
            borderBottom: "1px solid var(--color-szl-border)",
          }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.875rem", borderRadius: "99px", border: "1px solid var(--color-szl-border-hover)", background: "hsla(0,0%,100%,0.04)", marginBottom: "1.75rem" }}>
                <Layers size={13} color="var(--color-szl-text-muted)" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-szl-text-secondary)" }}>Architecture</span>
              </div>
            </m.div>
            <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05 }}>
              <h1 style={{ fontSize: "clamp(2.25rem,5vw,3.75rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.06, maxWidth: "22ch", marginBottom: "1.5rem" }}>
                Signal → intelligence → action → proof.
              </h1>
              <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "52ch", marginBottom: "0.75rem" }}>
                SZL builds vertical operating systems that transform domain-specific signals into governed business action. The same six-layer architecture runs across every vertical — legal, real estate, maritime, security, and advisory — with domain expertise embedded in each pack.
              </p>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.68, color: "hsl(214,7%,48%)", maxWidth: "52ch" }}>
                This page explains what happens from the moment a data signal enters the platform to the moment a governed action is executed, proved, and auditable.
              </p>
            </m.div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1rem" }}>
                Architecture
              </p>
              <h2 style={{ fontSize: "clamp(1.375rem,3vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.020em", lineHeight: 1.2, marginBottom: "2.5rem" }}>
                The six-layer stack
              </h2>
            </m.div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {STACK_LAYERS.map((layer, i) => {
                const Icon = layer.icon;
                return (
                  <m.div
                    key={layer.number}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                    className="szl-card"
                    style={{ borderRadius: "0.875rem", padding: "clamp(1.25rem,2.5vw,1.75rem)", display: "flex", gap: "1.25rem", alignItems: "flex-start" }}
                  >
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "0.625rem", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: `${layer.color}12`, border: `1px solid ${layer.color}25`,
                    }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", fontWeight: 700, color: layer.color }}>{layer.number}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "hsl(38,8%,90%)" }}>{layer.title}</h3>
                        <span style={{
                          fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 500,
                          letterSpacing: "0.08em", textTransform: "uppercase",
                          padding: "0.125rem 0.5rem", borderRadius: "4px",
                          color: layer.color, background: `${layer.color}10`,
                        }}>
                          {layer.subtitle}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.9rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{layer.desc}</p>
                    </div>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0", background: "hsla(0,0%,100%,0.01)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1rem" }}>
                Domain packs
              </p>
              <h2 style={{ fontSize: "clamp(1.375rem,3vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.020em", lineHeight: 1.2, marginBottom: "0.75rem" }}>
                One architecture, five verticals
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "hsl(214,7%,60%)", maxWidth: "52ch", marginBottom: "2.5rem" }}>
                The same six-layer stack powers each vertical pack. Domain expertise — the signals, models, twins, and actions specific to each industry — lives in the pack, not the platform.
              </p>
            </m.div>

            <div style={{ display: "grid", gap: "1rem" }} className="lg:grid-cols-2">
              {VERTICALS.map((v, i) => {
                const Icon = v.icon;
                return (
                  <m.div
                    key={v.name}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                  >
                    <Link href={v.href} style={{ textDecoration: "none", color: "inherit" }}>
                      <div
                        className="szl-card"
                        style={{
                          borderRadius: "0.875rem",
                          padding: "clamp(1.25rem,2.5vw,1.75rem)",
                          borderLeft: `3px solid ${v.color}`,
                          cursor: "pointer",
                          transition: "border-color 0.2s ease, background 0.2s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.875rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div style={{
                              width: "32px", height: "32px", borderRadius: "0.5rem",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              background: `${v.color}12`, border: `1px solid ${v.color}25`,
                            }}>
                              <Icon size={15} color={v.color} />
                            </div>
                            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "hsl(38,8%,90%)" }}>{v.name}</h3>
                          </div>
                          <ArrowRight size={14} style={{ color: "hsl(214,7%,40%)" }} />
                        </div>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: v.color, marginBottom: "0.875rem" }}>
                          {v.domain}
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                          <div>
                            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "0.375rem" }}>Signals</p>
                            <p style={{ fontSize: "0.8125rem", lineHeight: 1.55, color: "hsl(214,7%,58%)" }}>{v.signal}</p>
                          </div>
                          <div>
                            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "0.375rem" }}>Output</p>
                            <p style={{ fontSize: "0.8125rem", lineHeight: 1.55, color: "hsl(214,7%,58%)" }}>{v.output}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1rem" }}>
                Differentiation
              </p>
              <h2 style={{ fontSize: "clamp(1.375rem,3vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.020em", lineHeight: 1.2, marginBottom: "2rem" }}>
                Why it's different
              </h2>
            </m.div>
            <div style={{ display: "grid", gap: "1rem" }} className="lg:grid-cols-2">
              {DIFFERENTIATORS.map((d, i) => (
                <m.div
                  key={d.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="szl-card"
                  style={{ borderRadius: "0.875rem", padding: "clamp(1.25rem,2.5vw,1.75rem)", display: "flex", alignItems: "flex-start", gap: "0.875rem" }}
                >
                  <div style={{ width: "28px", height: "28px", borderRadius: "0.375rem", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(38,72%,58%,0.10)", border: "1px solid hsla(38,72%,58%,0.18)" }}>
                    <CheckCircle size={14} color="hsl(38,72%,58%)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,8%,90%)", marginBottom: "0.5rem" }}>{d.title}</h3>
                    <p style={{ fontSize: "0.9rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{d.desc}</p>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "var(--space-section-sm) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="szl-card"
              style={{ borderRadius: "0.875rem", padding: "clamp(2rem,4vw,3rem)", textAlign: "center", maxWidth: "640px", margin: "0 auto" }}
            >
              <div style={{ width: "48px", height: "48px", borderRadius: "0.75rem", margin: "0 auto 1.25rem", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(38,72%,58%,0.10)", border: "1px solid hsla(38,72%,58%,0.18)" }}>
                <Layers size={22} color="hsl(38,72%,58%)" />
              </div>
              <h2 style={{ fontSize: "clamp(1.25rem,3vw,1.625rem)", fontWeight: 600, letterSpacing: "-0.015em", marginBottom: "0.75rem" }}>See it in action</h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "hsl(214,7%,60%)", maxWidth: "440px", margin: "0 auto 1.75rem" }}>
                The best way to understand the architecture is to see a real workflow. PRISM Counsel is the flagship — a complete daily lawyer workflow from email ingestion to governed sign-off.
              </p>
              <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link href="/demo" className="szl-btn-primary" style={{ textDecoration: "none" }}>
                  Request a demo <ArrowRight size={14} />
                </Link>
                <Link href="/trust" className="szl-btn-secondary" style={{ textDecoration: "none" }}>
                  Trust Center
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
