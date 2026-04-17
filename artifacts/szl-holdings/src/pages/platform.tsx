import { m } from "framer-motion";
import { Eye, Zap, CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const LAYERS = [
  {
    name: "Lyte + Command",
    tagline: "Governed Command Surface",
    accent: "hsl(190,90%,55%)",
    accentRgb: "14,201,224",
    icon: Eye,
    description: "The operator command surface for governed decisions. Signal timeline, action queue, approval flow, and AI recommendations — with source citations, confidence scores, and full provenance on every output. Where operators observe, decide, and approve.",
    capabilities: [
      "Signal-to-action pipeline with nine-step governance",
      "AI recommendations with source attribution and confidence scores",
      "Approval queue with policy-enforced human-in-the-loop",
      "Cross-domain visibility via Event Fabric correlation",
    ],
  },
  {
    name: "Alloy",
    tagline: "Execution Fabric",
    accent: "hsl(214,80%,65%)",
    accentRgb: "92,155,228",
    icon: Zap,
    description: "The governance backbone beneath every surface. Alloy orchestrates multi-step workflows, enforces approval gates, records immutable audit trails, and coordinates agent execution — with durable state and checkpoint recovery.",
    capabilities: [
      "Workflow orchestration with durable state and recovery",
      "Policy-gated approval enforcement at the platform layer",
      "Immutable Proof Chain audit trail for every action",
      "Monte Carlo risk simulation before consequential decisions",
    ],
  },
];

const EXPANSION_VERTICALS = [
  {
    name: "Aegis",
    domain: "Security & defense — SOC command, threat intelligence, MITRE ATT&CK, governed response.",
    accent: "hsl(222,60%,58%)",
  },
  {
    name: "Vessels",
    domain: "Maritime intelligence — fleet command, AIS telemetry, sanctions screening, voyage economics.",
    accent: "hsl(205,85%,55%)",
  },
  {
    name: "Terra",
    domain: "Real estate intelligence — distress pipeline, ownership graph, governed deal workflow.",
    accent: "hsl(140,52%,46%)",
  },
  {
    name: "PRISM Counsel",
    domain: "Legal intelligence — matter command, deadline tracking, governed demand workflows.",
    accent: "hsl(260,60%,65%)",
  },
  {
    name: "Carlota Jo",
    domain: "Premium advisory — discreet intake, governed delivery, audit-grade document handling.",
    accent: "hsl(38,55%,58%)",
  },
  {
    name: "IMPERIUM",
    domain: "Cloud sovereignty — multi-cloud governance, policy enforcement, infrastructure audit.",
    accent: "hsl(25,72%,52%)",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    heading: "Signal → Context → Recommendation",
    body: "Signals arrive from domain-specific sources — AIS telemetry, threat feeds, court filings, market data. The Event Fabric normalizes and correlates them across domains. An AI agent analyzes the signal and proposes an action with source citations, confidence score, and provenance metadata.",
  },
  {
    step: "02",
    heading: "Simulation → Policy → Execution",
    body: "For high-stakes decisions, the Monte Carlo engine models risk and uncertainty before the recommendation surfaces. Covenant Policy checks who can approve and what conditions apply. Alloy orchestrates the approved action as a governed, durable workflow.",
  },
  {
    step: "03",
    heading: "Proof → Outcome → Learning",
    body: "The Proof Chain records the complete trail: signal, recommendation, simulation, policy decision, approval, execution. The Outcome Graph tracks the real-world result. Historical outcomes feed back into simulation models and AI confidence calibration.",
  },
];

export default function PlatformPage() {
  usePageMeta({
    title: "Platform — SZL Holdings",
    description: "Governed decision operating system: Command operator surface, Alloy execution fabric, and six domain packs — Aegis, Vessels, Terra, PRISM Counsel, Carlota Jo, IMPERIUM. One governance loop. Every high-consequence domain.",
    canonical: "https://szlholdings.com/platform",
    ogImage: "https://szlholdings.com/og/og-platform.jpg",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        <section
          aria-label="Platform overview"
          style={{
            paddingTop: "clamp(7rem,12vw,10rem)",
            paddingBottom: "clamp(4rem,7vw,5rem)",
            borderBottom: "1px solid hsla(0,0%,100%,0.05)",
          }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)" }}>
                  SZL Holdings
                </span>
                <span style={{ color: "hsla(0,0%,100%,0.18)", fontSize: "0.875rem" }} aria-hidden="true">·</span>
                <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(192,72%,48%)" }}>
                  Platform
                </span>
              </div>
              <h1 style={{
                fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 700, letterSpacing: "-0.025em",
                lineHeight: 1.08, color: "hsl(38,12%,94%)", marginBottom: "1.25rem", maxWidth: "28rem",
              }}>
                One governance infrastructure. Every high-consequence domain.
              </h1>
              <p style={{
                fontSize: "1.0625rem", color: "hsl(210,5%,60%)", lineHeight: 1.65,
                maxWidth: "44rem", marginBottom: "1rem",
              }}>
                The SZL Holdings platform is organized in three architectural layers: command surfaces where operators work, an execution fabric that governs every action, and domain packs that bring purpose-built intelligence to specific industries.
              </p>
              <p style={{
                fontSize: "0.9375rem", color: "hsl(210,5%,50%)", lineHeight: 1.65,
                maxWidth: "44rem", marginBottom: "2rem",
              }}>
                Every layer shares one governance model, one audit trail, and one authentication model. Adding a new domain pack does not require rebuilding infrastructure — it inherits it.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link
                  href="/demo"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "0.625rem 1.25rem", background: "hsl(192,72%,48%)",
                    color: "hsl(210,12%,6%)", borderRadius: "4px",
                    fontSize: "13px", fontWeight: 600, textDecoration: "none",
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(192,72%,54%)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(192,72%,48%)"; }}
                >
                  Request a demo <ArrowRight size={13} strokeWidth={2.5} aria-hidden="true" />
                </Link>
                <Link
                  href="/design-partner"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "0.625rem 1.25rem", background: "transparent",
                    color: "hsl(210,5%,60%)",
                    border: "1px solid hsla(0,0%,100%,0.12)",
                    borderRadius: "4px",
                    fontSize: "13px", fontWeight: 600, textDecoration: "none",
                    transition: "border-color 0.2s ease, color 0.2s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.25)"; (e.currentTarget as HTMLElement).style.color = "hsl(38,12%,90%)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.12)"; (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,60%)"; }}
                >
                  Design partner conversation <ArrowRight size={13} strokeWidth={2.5} aria-hidden="true" />
                </Link>
              </div>
            </m.div>
          </div>
        </section>

        <section
          aria-label="Core platform layers"
          style={{ padding: "clamp(4rem,7vw,6rem) 0", borderBottom: "1px solid hsla(0,0%,100%,0.04)" }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
            <m.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "2.5rem" }}
            >
              Governed command surfaces
            </m.p>
            <div className="grid md:grid-cols-2 gap-6">
              {LAYERS.map((layer, i) => {
                const Icon = layer.icon;
                return (
                  <m.div
                    key={layer.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      padding: "2rem",
                      borderRadius: "8px",
                      background: `rgba(${layer.accentRgb}, 0.03)`,
                      border: `1px solid rgba(${layer.accentRgb}, 0.14)`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                      <div style={{
                        width: "32px", height: "32px", borderRadius: "6px",
                        background: `rgba(${layer.accentRgb}, 0.1)`,
                        border: `1px solid rgba(${layer.accentRgb}, 0.2)`,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <Icon size={15} style={{ color: layer.accent }} />
                      </div>
                      <div>
                        <p style={{ fontSize: "15px", fontWeight: 700, color: "hsl(38,12%,92%)", letterSpacing: "-0.01em" }}>{layer.name}</p>
                        <p style={{ fontSize: "11px", color: layer.accent, fontWeight: 600, letterSpacing: "0.04em" }}>{layer.tagline}</p>
                      </div>
                    </div>
                    <p style={{ fontSize: "0.9375rem", lineHeight: 1.68, color: "hsl(210,5%,60%)", marginBottom: "1.5rem" }}>
                      {layer.description}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {layer.capabilities.map((cap) => (
                        <div key={cap} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                          <CheckCircle size={13} style={{ color: layer.accent, flexShrink: 0, marginTop: "2px", opacity: 0.8 }} />
                          <span style={{ fontSize: "13px", color: "hsl(210,5%,56%)", lineHeight: 1.5 }}>{cap}</span>
                        </div>
                      ))}
                    </div>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        <section style={{ padding: "clamp(4rem,7vw,6rem) 0", background: "hsl(210,12%,6%)", borderBottom: "1px solid hsla(0,0%,100%,0.04)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
            <m.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "2.5rem" }}
            >
              How It Works
            </m.p>
            <div style={{ display: "grid", gap: "1.5rem", maxWidth: "52rem" }}>
              {HOW_IT_WORKS.map((item, i) => (
                <m.div
                  key={item.step}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    display: "grid", gridTemplateColumns: "3rem 1fr", gap: "1.25rem",
                    padding: "1.5rem", borderRadius: "8px",
                    background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)",
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "hsl(190,90%,55%)", fontFamily: "'JetBrains Mono', monospace", paddingTop: "2px" }}>
                    {item.step}
                  </span>
                  <div>
                    <p style={{ fontSize: "15px", fontWeight: 600, color: "hsl(38,12%,90%)", marginBottom: "0.5rem", letterSpacing: "-0.01em" }}>{item.heading}</p>
                    <p style={{ fontSize: "14px", lineHeight: 1.65, color: "hsl(210,5%,58%)" }}>{item.body}</p>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "clamp(4rem,7vw,6rem) 0", borderBottom: "1px solid hsla(0,0%,100%,0.04)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
            <m.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{ marginBottom: "2rem" }}
            >
              <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "0.75rem" }}>
                Domain packs — governed extensions
              </p>
              <p style={{ fontSize: "0.9375rem", color: "hsl(210,5%,58%)", lineHeight: 1.65, maxWidth: "36rem" }}>
                Domain packs are not standalone products. They are governed extensions of the same platform — same Alloy execution fabric, same Proof Chain, same Covenant Policy, same RBAC model. Only the domain intelligence layer changes.
              </p>
            </m.div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {EXPANSION_VERTICALS.map((v, i) => (
                <m.div
                  key={v.name}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    padding: "1.25rem", borderRadius: "6px",
                    background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.06)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.625rem" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: v.accent, flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "hsl(38,12%,88%)", letterSpacing: "-0.005em" }}>{v.name}</span>
                  </div>
                  <p style={{ fontSize: "12px", lineHeight: 1.6, color: "hsl(210,5%,50%)" }}>{v.domain}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "clamp(4rem,7vw,6rem) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 clamp(1.25rem,5vw,2.5rem)" }}>
            <m.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{ maxWidth: "30rem" }}
            >
              <h2 style={{ fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 700, letterSpacing: "-0.022em", color: "hsl(38,12%,94%)", lineHeight: 1.15, marginBottom: "1rem" }}>
                Ready to instrument a workflow?
              </h2>
              <p style={{ fontSize: "0.9375rem", color: "hsl(210,5%,58%)", lineHeight: 1.65, marginBottom: "1.5rem" }}>
                Design partners get direct founder access, a focused instrumentation engagement, and measurable improvement on one painful workflow before any broader commitment.
              </p>
              <Link
                href="/design-partners"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "0.625rem 1.25rem", background: "hsl(210,8%,88%)",
                  color: "hsl(210,12%,6%)", borderRadius: "4px",
                  fontSize: "13px", fontWeight: 600, textDecoration: "none",
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(38,15%,96%)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(210,8%,88%)"; }}
              >
                Request a design partner conversation <ArrowRight size={13} strokeWidth={2.5} />
              </Link>
            </m.div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
