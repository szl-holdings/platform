import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, ChevronRight } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const PRODUCT_HIERARCHY = [
  {
    name: "Lyte",
    role: "Commercial wedge",
    color: "hsl(192,72%,48%)",
    desc: "The operator console. Business observability that surfaces what's stuck, at risk, and about to break — with explainable context behind every flag. This is the product organizations adopt first.",
    href: "/lyte",
  },
  {
    name: "Alloy",
    role: "Execution fabric",
    color: "hsl(215,35%,65%)",
    desc: "The workflow orchestration and audit layer beneath everything. Alloy routes action, verifies follow-through, and records the complete chain for governance review. Every vertical pack runs on Alloy.",
    href: "/alloy-fabric",
  },
];

const EXPANSION_LANES = [
  { name: "PRISM Counsel", domain: "Legal observability", color: "hsl(38,72%,58%)", status: "Design partner stage", href: "/solutions/prism-counsel" },
  { name: "Vessels", domain: "Maritime intelligence", color: "#4a90b8", status: "Design partner stage", href: "/solutions/vessels" },
  { name: "Aegis", domain: "Security & defense", color: "#c85a5a", status: "Design partner stage", href: "/solutions/aegis" },
  { name: "Terra", domain: "Real estate intelligence", color: "#5fa87a", status: "Design partner stage", href: "/solutions/terra" },
  { name: "Carlota Jo", domain: "Private advisory", color: "#c8a05a", status: "Active", href: "/services/carlota-jo" },
];

const GO_TO_MARKET = [
  {
    phase: "Phase 1",
    label: "Lyte design partners",
    desc: "Working directly with operators to instrument one painful workflow. Proving the signal-to-action arc works before scaling the go-to-market.",
  },
  {
    phase: "Phase 2",
    label: "Paid pilots",
    desc: "Structured commercial pilots for organizations where execution latency has a quantifiable cost. Lyte + Alloy as the entry point.",
  },
  {
    phase: "Phase 3",
    label: "Vertical expansion",
    desc: "The architecture generalizes. Each expansion lane (PRISM Counsel, Vessels, Aegis, Terra, Carlota Jo) inherits the same Alloy spine and adds domain-specific signal packs and twin models.",
  },
];

export default function CompanyPage() {
  usePageMeta({
    title: "Company — SZL Holdings",
    description: "SZL Holdings builds Lyte and Alloy — one intelligence and action architecture with distinct vertical operating systems. About the company, product hierarchy, and go-to-market approach.",
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
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-szl-text-secondary)" }}>Est. 2023 · Washington, D.C. · London · Singapore</p>
                </div>
              </div>
              <h1 style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)", fontWeight: 600, letterSpacing: "-0.026em", lineHeight: 1.1, maxWidth: "22ch", marginBottom: "1.5rem", color: "hsl(38,8%,96%)" }}>
                One architecture. One founder. Disciplined company-building.
              </h1>
              <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", maxWidth: "48ch" }}>
                SZL Holdings is building the intelligence and action architecture for industries where execution latency, fragmented signal, and audit requirements make governed automation essential.
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
                  Lyte is the commercial wedge. Alloy is the execution fabric beneath it.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "1rem" }}>
                  Most organizations have dashboards that show what happened and AI tools that generate suggestions. What they lack is the layer that catches what's about to break and routes the right action to the right person with an auditable trail.
                </p>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)" }}>
                  Lyte is that layer. Alloy is the operating fabric beneath it that makes execution governed, verifiable, and audit-grade. Together, they form the operating spine that every vertical pack runs on.
                </p>
              </div>
              <div>
                <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1rem" }}>
                  Operating spine
                </p>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "1rem" }}>
                  The architecture is not a collection of integrations or a platform-of-platforms. It is a layered design where each component has a single responsibility: signal, visibility, forecast, and governed action.
                </p>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)" }}>
                  Worldline captures the event fabric. Proof Chain provides the immutable audit trace. Model Mesh governs AI inference. The GraphQL Control Plane provides a unified API surface. Every vertical pack inherits all of it.
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
              Expansion lanes — on the same Alloy spine
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
              {EXPANSION_LANES.map((lane) => (
                <Link key={lane.name} href={lane.href} style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.5rem 0.875rem",
                  borderRadius: "0.375rem",
                  background: "hsla(0,0%,100%,0.025)",
                  border: "1px solid hsla(0,0%,100%,0.07)",
                  textDecoration: "none",
                  transition: "border-color 0.2s ease",
                  cursor: "pointer",
                }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: lane.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "hsl(38,8%,86%)" }}>{lane.name}</span>
                  <span style={{ fontSize: "0.6875rem", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)" }}>— {lane.domain}</span>
                </Link>
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

        {/* Why Lyte first */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "clamp(3.5rem,7vw,5.5rem) 0", background: "hsla(0,0%,100%,0.01)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ maxWidth: "52rem" }}>
              <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1rem" }}>
                Why Lyte first
              </p>
              <h2 style={{ fontSize: "clamp(1.25rem,2.5vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.018em", lineHeight: 1.15, marginBottom: "1.25rem", color: "hsl(38,8%,94%)" }}>
                The problem is universal. The entry point is specific.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "1rem" }}>
                Every organization has the same problem: execution breaks down between systems. Approvals stall. Ownership is unclear. Workflows go untracked. The damage compounds before anyone notices.
              </p>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "1rem" }}>
                Lyte is the entry point because it addresses this problem in a way that is immediately visible and measurable. There is no data warehouse project, no re-platforming, no 18-month implementation. Operators see value in the first session.
              </p>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)" }}>
                Once Lyte is in place, Alloy is the natural extension — closing the loop from visibility to action. And once Alloy is in place, the vertical packs become the domain-specific deployments of the same spine.
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
