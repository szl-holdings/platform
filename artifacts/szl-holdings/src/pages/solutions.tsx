import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, ShieldCheck, Ship, Building2, BriefcaseBusiness } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const SOLUTIONS = [
  {
    icon: ShieldCheck,
    name: "Aegis",
    slug: "aegis",
    domain: "Defense & Intelligence",
    tagline: "SOC command, XDR, and managed security operations — for high-consequence environments where observability and execution discipline are non-negotiable.",
    color: "var(--color-aegis)",
    colorMuted: "var(--color-aegis-muted)",
    border: "hsla(222,60%,50%,0.18)",
    capabilities: ["Threat signal classification", "SOC workflow automation", "Incident response routing", "Compliance audit trail", "HITL approval gates", "Cross-domain intelligence"],
    href: "/solutions/aegis",
  },
  {
    icon: Ship,
    name: "Vessels",
    slug: "vessels",
    domain: "Maritime Intelligence",
    tagline: "Fleet visibility, voyage performance, and operational exceptions — business observability for assets underway in complex, distributed environments.",
    color: "var(--color-vessels)",
    colorMuted: "var(--color-vessels-muted)",
    border: "hsla(206,72%,40%,0.18)",
    capabilities: ["Fleet position and status", "Voyage performance tracking", "Cargo and customs workflow", "Exception detection", "Crew and port operations", "Regulatory audit trail"],
    href: "/solutions/vessels",
  },
  {
    icon: Building2,
    name: "Terra",
    slug: "terra",
    domain: "Real Estate Intelligence",
    tagline: "Distress tracking, deal pipeline, and market signal — Lyte + Alloy applied to a data-rich, execution-poor industry that desperately needs a command layer.",
    color: "var(--color-terra)",
    colorMuted: "var(--color-terra-muted)",
    border: "hsla(140,50%,38%,0.18)",
    capabilities: ["Distress property detection", "Deal pipeline command", "Market signal monitoring", "Broker workflow routing", "Acquisition approval gates", "Portfolio risk dashboard"],
    href: "/solutions/terra",
  },
  {
    icon: BriefcaseBusiness,
    name: "Carlota Jo",
    slug: "carlota-jo",
    domain: "Executive Advisory",
    tagline: "High-trust advisory services for principals navigating complex operations, capital situations, and organizational execution challenges.",
    color: "var(--color-carlota)",
    colorMuted: "var(--color-carlota-muted)",
    border: "hsla(36,48%,52%,0.18)",
    capabilities: ["Strategic execution advisory", "Capital situation support", "Organizational design", "Operating model review", "Founder & principal support", "Confidential engagement model"],
    href: "/carlota-jo",
  },
];

export default function SolutionsPage() {
  usePageMeta({
    title: "Solutions — SZL Holdings",
    description: "Vertical domain packs that extend the Lyte + Alloy operating platform into defense & intelligence, maritime, real estate, and executive advisory.",
    canonical: "https://szlholdings.com/solutions",
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
              <span className="szl-badge" style={{ borderRadius: "9999px", marginBottom: "1.75rem", display: "inline-block" }}>
                Domain Solutions
              </span>
            </m.div>
            <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05 }}>
              <h1
                style={{
                  fontSize: "clamp(2.25rem,5vw,3.75rem)",
                  fontWeight: 600,
                  letterSpacing: "-0.028em",
                  lineHeight: 1.08,
                  maxWidth: "22ch",
                  marginBottom: "1.5rem",
                }}
              >
                One operating platform. Four domain packs.
              </h1>
              <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,62%)", maxWidth: "52ch" }}>
                Each vertical pack extends the same Lyte + Alloy core into the specific signal
                vocabulary, decision models, and audit requirements of its domain. Not separate
                products — the same platform with domain-specific intelligence on top.
              </p>
            </m.div>
          </div>
        </section>

        <section style={{ padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
              {SOLUTIONS.map((sol, i) => {
                const Icon = sol.icon;
                return (
                  <m.div
                    key={sol.name}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.06 }}
                    className="szl-card"
                    style={{
                      borderRadius: "0.875rem",
                      padding: "clamp(1.75rem,3.5vw,2.5rem)",
                      borderLeft: `3px solid ${sol.color}`,
                    }}
                  >
                    <div style={{ display: "grid", gap: "clamp(2rem,4vw,3rem)", alignItems: "start" }} className="lg:grid-cols-[1fr_1fr]">
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                          <div
                            style={{
                              width: "40px", height: "40px",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              background: sol.colorMuted,
                              border: `1px solid ${sol.border}`,
                              borderRadius: "0.5rem",
                            }}
                          >
                            <Icon size={18} color={sol.color} />
                          </div>
                          <div>
                            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: sol.color, opacity: 0.8 }}>
                              {sol.domain}
                            </p>
                            <h2 style={{ fontSize: "1.375rem", fontWeight: 600, letterSpacing: "-0.018em" }}>{sol.name}</h2>
                          </div>
                        </div>
                        <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", marginBottom: "1.5rem" }}>{sol.tagline}</p>
                        <Link href={sol.href} className="szl-btn-secondary">
                          Explore {sol.name} <ArrowRight size={14} />
                        </Link>
                      </div>
                      <div>
                        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "0.875rem" }}>
                          Domain capabilities
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                          {sol.capabilities.map((cap) => (
                            <div key={cap} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                              <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: sol.color, flexShrink: 0, marginTop: "8px" }} />
                              <span style={{ fontSize: "0.8375rem", lineHeight: 1.55, color: "hsl(214,7%,65%)" }}>{cap}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        <section style={{ padding: "var(--space-section-sm) 0", borderTop: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="szl-card"
              style={{ borderRadius: "0.875rem", padding: "clamp(2rem,4vw,3rem)", textAlign: "center", maxWidth: "640px", margin: "0 auto" }}
            >
              <h2 style={{ fontSize: "clamp(1.25rem,3vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: "0.875rem" }}>
                Don't see your domain?
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", marginBottom: "1.75rem" }}>
                The Lyte + Alloy platform is designed to be adapted to any operating environment
                with complex signals, consequential decisions, and auditability requirements.
                Let's talk about yours.
              </p>
              <Link href="/contact" className="szl-btn-primary">
                Start a conversation <ArrowRight size={14} />
              </Link>
            </m.div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
