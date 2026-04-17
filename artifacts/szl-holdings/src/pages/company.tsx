import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, ChevronRight } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const PRODUCT_HIERARCHY = [
  {
    name: "Command + Lyte",
    role: "Governed command surface",
    color: "hsl(192,72%,48%)",
    desc: "The operator command surface. Signal timeline, action queue, approval flow, and AI recommendations — with source citations, confidence scores, and full provenance. Where operators observe signals, review recommendations, run simulations, and make governed decisions.",
    href: "/command",
  },
  {
    name: "Alloy",
    role: "Execution fabric",
    color: "hsl(215,35%,65%)",
    desc: "The governance backbone beneath every surface. Workflow orchestration, approval gates, immutable Proof Chain audit trail, and Monte Carlo risk simulation. Every domain pack runs on Alloy. Every decision is governed, attributed, and traceable.",
    href: "/platform",
  },
];

const EXPANSION_LANES = [
  { name: "Aegis", domain: "Security & defense", color: "#6b7ec8", status: "Active" },
  { name: "Vessels", domain: "Maritime intelligence", color: "#4a90b8", status: "Active" },
  { name: "Terra", domain: "Real estate intelligence", color: "#5fa87a", status: "Active" },
  { name: "PRISM Counsel", domain: "Legal intelligence", color: "#8b7ac8", status: "Governed extension" },
  { name: "Carlota Jo", domain: "Premium advisory", color: "#c8a05a", status: "Live" },
  { name: "IMPERIUM", domain: "Cloud sovereignty", color: "#c87a4a", status: "Governed extension" },
];

const GO_TO_MARKET = [
  {
    phase: "Phase 1",
    label: "Design partners",
    desc: "Working directly with operators in high-consequence domains. Proving the governed decision loop — signal to outcome — on one real operational workflow before scaling.",
  },
  {
    phase: "Phase 2",
    label: "Paid pilots",
    desc: "Structured commercial deployments where decision accountability has measurable ROI. Command + Alloy as the entry point, with domain packs extending into specific verticals.",
  },
  {
    phase: "Phase 3",
    label: "Platform expansion",
    desc: "Every domain pack inherits the same six platform primitives. Adding a new domain does not require rebuilding governance — the Outcome Graph, Proof Chain, Covenant Policy, and Monte Carlo engine are shared infrastructure.",
  },
];

export default function CompanyPage() {
  usePageMeta({
    title: "Company — SZL Holdings",
    description: "SZL Holdings builds a governed decision operating system — the structural layer between signal detection and action execution. About the company, platform hierarchy, and go-to-market approach.",
    canonical: "https://szlholdings.com/company",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        {/* Hero */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1.5rem", marginBottom: "2rem", flexWrap: "wrap" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "0.875rem", flexShrink: 0,
                  background: "linear-gradient(135deg, #d4a054 0%, #c8953c 50%, #b8862c 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 0 1px hsla(38,50%,52%,0.2), 0 8px 32px hsla(0,0%,0%,0.4)",
                }}>
                  <span style={{ color: "#070a10", fontWeight: 800, fontSize: "0.9375rem", letterSpacing: "-0.02em" }}>SZL</span>
                </div>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "0.5rem" }}>
                    About SZL Holdings
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-szl-text-secondary)" }}>Est. 2023 · London · Owner-Operated</p>
                </div>
              </div>
              <h1 style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)", fontWeight: 600, letterSpacing: "-0.026em", lineHeight: 1.1, maxWidth: "22ch", marginBottom: "1.5rem", color: "hsl(38,8%,96%)" }}>
                One governed decision loop. Every high-consequence domain.
              </h1>
              <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", maxWidth: "48ch" }}>
                SZL Holdings builds a governed decision operating system — the structural layer between signal detection and action execution, with governance, attribution, and outcome tracking on every consequential decision.
              </p>
            </m.div>
          </div>
        </section>

        {/* What we are */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "clamp(3.5rem,7vw,5.5rem) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "grid", gap: "3rem" }} className="lg:grid-cols-2">
              <div>
                <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1rem" }}>
                  What we build
                </p>
                <h2 style={{ fontSize: "clamp(1.25rem,2.5vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.018em", lineHeight: 1.15, marginBottom: "1rem", color: "hsl(38,8%,94%)" }}>
                  Command is the operator surface. Alloy is the execution fabric beneath it.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "1rem" }}>
                  Most organizations have dashboards that show what happened and AI tools that generate suggestions. What they lack is the governed layer that routes signals to decisions, enforces approval gates, and tracks outcomes — with attribution at every step.
                </p>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)" }}>
                  Command is the operator surface — where signals arrive, recommendations are reviewed, and decisions are made. Alloy is the execution fabric beneath it — workflow orchestration, policy enforcement, and immutable audit trail. Together, they form the governed decision loop that every domain pack inherits.
                </p>
              </div>
              <div>
                <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1rem" }}>
                  Operating spine
                </p>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "1rem" }}>
                  The architecture is built on six shared primitives — not a collection of integrations or a platform-of-platforms. Each primitive has a single structural responsibility in the governed decision loop.
                </p>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)" }}>
                  The Event Fabric normalizes and correlates cross-domain signals. Proof Chain provides the immutable audit trail. Covenant Policy enforces approval gates. The Monte Carlo engine simulates risk before action. The Outcome Graph closes the loop with outcome tracking and AI calibration. Every domain pack inherits all six.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Product hierarchy */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "clamp(3.5rem,7vw,5.5rem) 0", background: "hsla(0,0%,100%,0.01)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "2rem" }}>
              Product hierarchy
            </p>
            <div style={{ display: "grid", gap: "1rem", marginBottom: "2rem" }} className="lg:grid-cols-2">
              {PRODUCT_HIERARCHY.map((p, i) => (
                <m.div
                  key={p.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  style={{
                    padding: "1.75rem",
                    borderRadius: "0.875rem",
                    background: "hsla(0,0%,100%,0.025)",
                    border: "1px solid hsla(0,0%,100%,0.07)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "hsl(38,8%,92%)" }}>{p.name}</h3>
                    <span style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 500, color: p.color, letterSpacing: "0.06em" }}>{p.role}</span>
                  </div>
                  <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--color-szl-text-secondary)", marginBottom: "1rem" }}>{p.desc}</p>
                  <Link
                    href={p.href}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", fontWeight: 600, color: p.color, textDecoration: "none", transition: "opacity 0.18s ease" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                  >
                    Learn more <ChevronRight size={13} />
                  </Link>
                </m.div>
              ))}
            </div>
            <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1rem" }}>
              Domain packs — governed extensions
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
              {EXPANSION_LANES.map((lane) => (
                <div key={lane.name} style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.5rem 0.875rem",
                  borderRadius: "0.375rem",
                  background: "hsla(0,0%,100%,0.025)",
                  border: "1px solid hsla(0,0%,100%,0.07)",
                }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: lane.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "hsl(38,8%,86%)" }}>{lane.name}</span>
                  <span style={{ fontSize: "0.6875rem", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)" }}>— {lane.domain}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Go-to-market sequencing */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "clamp(3.5rem,7vw,5.5rem) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "2rem" }}>
              Go-to-market sequencing
            </p>
            <div style={{ display: "grid", gap: "1rem" }} className="lg:grid-cols-3">
              {GO_TO_MARKET.map((phase, i) => (
                <m.div
                  key={phase.phase}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  style={{
                    padding: "1.5rem",
                    borderRadius: "0.75rem",
                    background: "hsla(0,0%,100%,0.025)",
                    border: "1px solid hsla(0,0%,100%,0.07)",
                  }}
                >
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 700, color: "hsl(192,72%,48%)", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>{phase.phase}</p>
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,8%,92%)", marginBottom: "0.625rem" }}>{phase.label}</h3>
                  <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "var(--color-szl-text-secondary)" }}>{phase.desc}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why governed decisions */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "clamp(3.5rem,7vw,5.5rem) 0", background: "hsla(0,0%,100%,0.01)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ maxWidth: "52rem" }}>
              <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1rem" }}>
                Why governed decisions
              </p>
              <h2 style={{ fontSize: "clamp(1.25rem,2.5vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.018em", lineHeight: 1.15, marginBottom: "1.25rem", color: "hsl(38,8%,94%)" }}>
                AI adds recommendations. Governance adds accountability.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "1rem" }}>
                Every organization adopting AI faces the same structural gap: more recommendations, more automation, more decisions running in parallel — with no governed way to track who approved what, based on what evidence, with what outcome.
              </p>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "1rem" }}>
                The governed decision loop addresses this gap structurally — signal detection, AI recommendation with provenance, risk simulation, policy enforcement, proof recording, and outcome tracking. One loop. Every domain.
              </p>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)" }}>
                Once the governed loop is in place, domain packs extend it into specific verticals. The governance infrastructure is shared. The domain intelligence layer changes. Adding a new domain does not require rebuilding governance.
              </p>
            </div>
          </div>
        </section>

        {/* Honest posture */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "clamp(3.5rem,7vw,5.5rem) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ maxWidth: "52rem" }}>
              <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1rem" }}>
                Company posture
              </p>
              <h2 style={{ fontSize: "clamp(1.25rem,2.5vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.018em", lineHeight: 1.15, marginBottom: "1.25rem", color: "hsl(38,8%,94%)" }}>
                Design-partner stage. No fake traction.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "1rem" }}>
                SZL Holdings is at design-partner stage. This means we are working directly with operators to instrument one painful workflow — measuring the before and after — before scaling the go-to-market.
              </p>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "1rem" }}>
                There are no fabricated logos, no generic 'AI platform' language, and no fake traction. The architecture is real. The products are built. The founder runs every design-partner and investor conversation personally.
              </p>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "2rem" }}>
                Washington, D.C. · London · Singapore.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link
                  href="/founder"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.375rem",
                    padding: "0.625rem 1.25rem",
                    fontSize: "0.875rem", fontWeight: 500,
                    color: "var(--color-szl-text-secondary)",
                    textDecoration: "none",
                    border: "1px solid var(--color-szl-border-hover)",
                    borderRadius: "0.375rem",
                    transition: "color 0.18s ease, border-color 0.18s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,8%,90%)"; (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.25)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-szl-border-hover)"; }}
                >
                  About the founder <ChevronRight size={13} />
                </Link>
                <Link
                  href="/contact"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.375rem",
                    padding: "0.625rem 1.25rem",
                    fontSize: "0.875rem", fontWeight: 600,
                    color: "hsl(214,18%,4%)",
                    background: "hsl(192,72%,48%)",
                    textDecoration: "none",
                    borderRadius: "0.375rem",
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(192,72%,54%)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(192,72%,48%)"; }}
                >
                  Get in touch <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
