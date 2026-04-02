import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, ArrowUpRight, BookOpen, ShieldCheck, Eye, GitBranch, Layers, FileText } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const DOCS_SECTIONS = [
  {
    icon: Eye,
    title: "Platform Overview",
    desc: "What Lyte + Alloy is, how the signal-to-action pipeline works, and where the system fits in your operating environment.",
    links: [
      { label: "Platform overview", href: "/platform" },
      { label: "Lyte — Business Observability", href: "/lyte" },
      { label: "Alloy — Execution Fabric", href: "/alloy-fabric" },
    ],
    color: "var(--color-lyte)",
    colorMuted: "var(--color-lyte-muted)",
    colorBorder: "var(--color-lyte-border)",
  },
  {
    icon: ShieldCheck,
    title: "Trust & Security",
    desc: "Security controls, AI governance model, human-in-the-loop architecture, and data handling documentation for diligence.",
    links: [
      { label: "Trust Center", href: "/trust" },
      { label: "Security posture", href: "/trust/security" },
      { label: "AI governance & HITL", href: "/trust/governance" },
      { label: "Architecture", href: "/trust/architecture" },
    ],
    color: "hsl(145,62%,46%)",
    colorMuted: "hsla(145,62%,40%,0.08)",
    colorBorder: "hsla(145,62%,40%,0.18)",
  },
  {
    icon: Layers,
    title: "Domain Solutions",
    desc: "Vertical packs that extend the Lyte + Alloy platform into defense, maritime, real estate, and advisory.",
    links: [
      { label: "Solutions overview", href: "/solutions" },
      { label: "Aegis — Defense & Intelligence", href: "/solutions/aegis" },
      { label: "Vessels — Maritime", href: "/solutions/vessels" },
      { label: "Terra — Real Estate", href: "/solutions/terra" },
    ],
    color: "var(--color-alloy-light)",
    colorMuted: "var(--color-alloy-muted)",
    colorBorder: "var(--color-alloy-border)",
  },
  {
    icon: GitBranch,
    title: "Working with SZL",
    desc: "Design partner program, pilot readiness, investor relations, and how to start a conversation with the team.",
    links: [
      { label: "Design Partners", href: "/design-partners" },
      { label: "Interactive demo", href: "/demo" },
      { label: "Contact & inquiries", href: "/contact" },
      { label: "Investor Relations", href: "/investor-relations" },
    ],
    color: "var(--color-szl-accent)",
    colorMuted: "var(--color-szl-accent-muted)",
    colorBorder: "hsla(38,52%,58%,0.18)",
  },
];

const CAPABILITY_MATRIX = [
  { feature: "Signal detection & classification", lyte: true, alloy: false, aegis: true, vessels: true, terra: true },
  { feature: "Approval latency tracking", lyte: true, alloy: false, aegis: false, vessels: false, terra: true },
  { feature: "Workflow orchestration", lyte: false, alloy: true, aegis: true, vessels: true, terra: true },
  { feature: "Human-in-the-loop gates", lyte: false, alloy: true, aegis: true, vessels: true, terra: true },
  { feature: "Audit trail (immutable)", lyte: false, alloy: true, aegis: true, vessels: true, terra: true },
  { feature: "Escalation logic", lyte: false, alloy: true, aegis: true, vessels: true, terra: false },
  { feature: "Domain signal vocabulary", lyte: false, alloy: false, aegis: true, vessels: true, terra: true },
  { feature: "Connector mesh", lyte: false, alloy: true, aegis: true, vessels: true, terra: true },
  { feature: "Role-scoped execution", lyte: false, alloy: true, aegis: true, vessels: true, terra: true },
];

const DOT = ({ active }: { active: boolean }) => (
  <div style={{ display: "flex", justifyContent: "center" }}>
    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: active ? "var(--color-lyte)" : "hsla(0,0%,100%,0.10)" }} />
  </div>
);

export default function DocsPage() {
  usePageMeta({
    title: "Docs — SZL Holdings",
    description: "Platform documentation, trust center, architecture diagrams, capability matrix, and design partner resources for Lyte + Alloy.",
    canonical: "https://szlholdings.com/docs",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        <section className="szl-grid-texture szl-depth-glow-gold" style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)", borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", border: "1px solid var(--color-szl-border-hover)", background: "hsla(0,0%,100%,0.04)", borderRadius: "9999px", padding: "0.25rem 0.75rem", marginBottom: "1.75rem" }}>
                <BookOpen size={12} color="var(--color-szl-text-muted)" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-secondary)" }}>Documentation Hub</span>
              </div>
              <h1 style={{ fontSize: "clamp(2.25rem,5vw,3.75rem)", fontWeight: 600, letterSpacing: "-0.028em", lineHeight: 1.08, maxWidth: "22ch", marginBottom: "1.5rem" }}>
                Everything you need to understand and evaluate the platform.
              </h1>
              <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,62%)", maxWidth: "52ch" }}>
                Platform overview, trust documentation, architecture diagrams, capability matrix,
                and design partner resources — organized for operators, investors, and technical teams.
              </p>
            </m.div>
          </div>
        </section>

        {/* Docs navigation */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div className="szl-grid-2" style={{ gap: "1.5rem" }}>
              {DOCS_SECTIONS.map((section, i) => {
                const Icon = section.icon;
                return (
                  <m.div
                    key={section.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.07 }}
                    className="szl-card"
                    style={{ borderRadius: "0.875rem", padding: "clamp(1.5rem,3vw,2rem)" }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1.25rem" }}>
                      <div style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", background: section.colorMuted, border: `1px solid ${section.colorBorder}`, borderRadius: "0.5rem", flexShrink: 0 }}>
                        <Icon size={18} color={section.color} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.375rem" }}>{section.title}</h3>
                        <p style={{ fontSize: "0.875rem", lineHeight: 1.58, color: "hsl(214,7%,58%)" }}>{section.desc}</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", paddingTop: "1rem", borderTop: "1px solid var(--color-szl-border)" }}>
                      {section.links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", fontWeight: 500, color: "hsl(214,7%,62%)", textDecoration: "none", padding: "0.1875rem 0", transition: "color 0.18s ease" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,8%,88%)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(214,7%,62%)"; }}
                        >
                          <ArrowRight size={12} style={{ opacity: 0.6 }} />
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Capability matrix */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>
                Capability matrix
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                What each layer of the platform provides.
              </h2>
            </m.div>
            <div className="szl-card" style={{ borderRadius: "0.875rem", overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-szl-border)", background: "hsla(214,12%,8%,0.60)" }}>
                    <th style={{ textAlign: "left", padding: "0.875rem 1.25rem", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", width: "40%" }}>Capability</th>
                    {["Lyte", "Alloy", "Aegis", "Vessels", "Terra"].map((col) => (
                      <th key={col} style={{ textAlign: "center", padding: "0.875rem 1rem", fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-szl-text-muted)" }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CAPABILITY_MATRIX.map((row, i) => (
                    <tr key={row.feature} style={{ borderBottom: i < CAPABILITY_MATRIX.length - 1 ? "1px solid var(--color-szl-border)" : "none" }}>
                      <td style={{ padding: "0.875rem 1.25rem", fontSize: "0.875rem", color: "hsl(214,7%,70%)" }}>{row.feature}</td>
                      <td style={{ padding: "0.875rem 1rem" }}><DOT active={row.lyte} /></td>
                      <td style={{ padding: "0.875rem 1rem" }}><DOT active={row.alloy} /></td>
                      <td style={{ padding: "0.875rem 1rem" }}><DOT active={row.aegis} /></td>
                      <td style={{ padding: "0.875rem 1rem" }}><DOT active={row.vessels} /></td>
                      <td style={{ padding: "0.875rem 1rem" }}><DOT active={row.terra} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Architecture callout */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-sm) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>
                What this proves
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "1.25rem" }}>
                An operating platform with real technical depth.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "56ch", marginBottom: "2rem" }}>
                The Lyte + Alloy platform is not a mockup, a Notion doc, or a deck with wireframes.
                It is a functioning multi-application operating system with a shared data layer, a
                governed execution model, an immutable audit trail, and vertical-specific intelligence
                packs — all built and running.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link href="/trust/architecture" className="szl-btn-secondary">Architecture docs <ArrowRight size={14} /></Link>
                <Link href="/demo" className="szl-btn-secondary">See the interactive demo <ArrowRight size={14} /></Link>
                <a href="https://github.com/szl-holdings" target="_blank" rel="noopener noreferrer" className="szl-btn-ghost">
                  GitHub <ArrowUpRight size={13} />
                </a>
              </div>
            </m.div>
          </div>
        </section>

        <section style={{ padding: "var(--space-section-sm) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }} className="szl-card szl-grid-cta" style={{ borderRadius: "1rem", padding: "clamp(2rem,4vw,3rem)", gap: "2rem", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "clamp(1.25rem,3vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: "0.75rem" }}>Need a full technical brief or diligence package?</h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)" }}>We prepare tailored documentation for investors, design partners, and enterprise teams. Reach out to request one.</p>
              </div>
              <Link href="/contact" className="szl-btn-primary" style={{ flexShrink: 0, whiteSpace: "nowrap" }}>
                Request a package <ArrowRight size={14} />
              </Link>
            </m.div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
