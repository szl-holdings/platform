import { m } from "framer-motion";
import { Link } from "wouter";
import { ChevronRight, ArrowRight } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const principles = [
  {
    heading: "Governed by design",
    body: "Every consequential decision follows the same nine-step loop: signal, context, recommendation, simulation, policy, execution, proof, outcome, learning. Governance is an architecture primitive, not a compliance afterthought.",
  },
  {
    heading: "Build for high-consequence domains",
    body: "Security, maritime, real estate, legal, advisory, cloud sovereignty. Each domain pack extends the same governance infrastructure into industries where every decision has consequence.",
  },
  {
    heading: "Founder-led, indefinitely",
    body: "SZL Holdings is built to operate with a small, high-trust team over a long time horizon. No external pressure to ship, pivot, or exit on a schedule we didn't set.",
  },
  {
    heading: "Honest about what exists",
    body: "Design-partner stage. No fabricated logos, no inflated metrics, no vague AI language. The architecture is real, the products are built, and the founder runs every conversation personally.",
  },
];

const DOMAIN_PACKS = [
  { name: "Aegis", domain: "Security & defense", color: "hsl(222,60%,58%)" },
  { name: "Vessels", domain: "Maritime intelligence", color: "hsl(206,72%,52%)" },
  { name: "Terra", domain: "Real estate intelligence", color: "hsl(140,52%,46%)" },
  { name: "Counsel", domain: "Legal intelligence", color: "hsl(260,60%,65%)" },
  { name: "Carlota Jo", domain: "Premium advisory", color: "hsl(340,52%,58%)" },
  { name: "IMPERIUM", domain: "Cloud sovereignty", color: "hsl(25,72%,52%)" },
];

export default function AboutPage() {
  const __pageMeta = usePageMeta({
    title: "About — SZL Holdings",
    description: "SZL Holdings builds a governed decision operating system — the structural layer between signal detection and action execution, with governance, attribution, and outcome tracking on every decision.",
    canonical: "https://szlholdings.com/about",
  });

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
        <SiteNav />
        <main id="main-content">
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                  <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", margin: 0 }}>
                    About SZL Holdings
                  </p>
                  <span style={{ width: "1px", height: "12px", background: "hsla(0,0%,100%,0.15)" }} aria-hidden="true" />
                  <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(192,72%,48%)", margin: 0 }}>
                    Governed Decision Operating System
                  </p>
                </div>
                <h1 style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)", fontWeight: 600, letterSpacing: "-0.026em", lineHeight: 1.1, maxWidth: "24ch", marginBottom: "1.5rem", color: "hsl(38,8%,96%)" }}>
                  The governed decision layer for enterprise operations.
                </h1>
                <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", maxWidth: "52ch", marginBottom: "0.75rem" }}>
                  SZL Holdings builds the structural layer between signal detection and action execution — with governance, attribution, and outcome tracking on every consequential decision.
                </p>
                <p style={{ fontSize: "0.875rem", color: "var(--color-szl-text-faint)" }}>
                  Est. 2023 · Washington, D.C. · London · Singapore · Owner-Operated
                </p>
              </m.div>
            </div>
          </section>
  
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "clamp(3.5rem,7vw,5.5rem) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "2rem" }}>
                Principles
              </p>
              <div style={{ display: "grid", gap: "1.5rem", maxWidth: "52rem" }}>
                {principles.map((p, i) => (
                  <m.div
                    key={i}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.07 }}
                    style={{ borderLeft: "2px solid hsla(192,72%,48%,0.3)", paddingLeft: "1.25rem" }}
                  >
                    <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,8%,90%)", marginBottom: "0.375rem" }}>{p.heading}</h3>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "var(--color-szl-text-secondary)" }}>{p.body}</p>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "clamp(3.5rem,7vw,5.5rem) 0", background: "hsla(0,0%,100%,0.01)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", marginBottom: "1.5rem" }}>
                Domain packs — governed extensions
              </p>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", maxWidth: "44rem", marginBottom: "1.5rem" }}>
                Domain packs extend the same six platform primitives into specific operational domains. They are not separate products — they are governed extensions that inherit the same audit trail, policy engine, and governance loop.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
                {DOMAIN_PACKS.map((dp) => (
                  <div key={dp.name} style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.5rem 0.875rem",
                    borderRadius: "0.375rem",
                    background: "hsla(0,0%,100%,0.025)",
                    border: "1px solid hsla(0,0%,100%,0.07)",
                  }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: dp.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "hsl(38,8%,86%)" }}>{dp.name}</span>
                    <span style={{ fontSize: "0.6875rem", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)" }}>— {dp.domain}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
  
          <section style={{ padding: "clamp(3.5rem,7vw,5.5rem) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <div style={{ maxWidth: "36rem",
                padding: "2rem 2.5rem",
                borderRadius: "0.875rem",
                background: "hsla(0,0%,100%,0.025)",
                border: "1px solid hsla(0,0%,100%,0.07)",
              }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "hsl(38,8%,92%)", marginBottom: "0.5rem" }}>Start a conversation</h3>
                <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "var(--color-szl-text-secondary)", marginBottom: "1.25rem" }}>
                  Investment, partnership, design partner, or media enquiries — we respond to substantive outreach.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
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
                </div>
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
