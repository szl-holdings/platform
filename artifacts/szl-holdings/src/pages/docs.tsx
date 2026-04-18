import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, BookOpen, ShieldCheck, Eye, GitBranch, Layers, FileText, Cpu, Clock, Link2, Network, FlaskConical, Scale } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const PLATFORM_DOCS = [
  {
    icon: Eye,
    title: "Platform Overview",
    desc: "What Lyte + Alloy is, how the signal-to-action pipeline works, and where it fits in your operating environment.",
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
    ],
    color: "hsl(145,62%,46%)",
    colorMuted: "hsla(145,62%,40%,0.08)",
    colorBorder: "hsla(145,62%,40%,0.18)",
  },
  {
    icon: Layers,
    title: "Domain Solutions",
    desc: "Vertical packs that extend the Lyte + Alloy platform into legal operations, defense, maritime, and real estate.",
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

const TECHNICAL_DOCS = [
  {
    icon: Layers,
    title: "Architecture",
    desc: "Signal ingestion, Twin enrichment, signal-to-action pipeline, governance layer, and proof chain — documented end to end.",
    href: "/docs/architecture",
  },
  {
    icon: Network,
    title: "Outcome Graph",
    desc: "The directed signal and state fabric connecting every input, inference, decision, and output in the platform.",
    href: "/docs/outcome-graph",
  },
  {
    icon: Link2,
    title: "Proof Chain",
    desc: "How every output traces every claim back to its source signal, model invocation, and human approval record.",
    href: "/docs/proof-chain",
  },
  {
    icon: Scale,
    title: "Covenant Policy",
    desc: "The governance rules engine defining what the platform is and is not permitted to do on behalf of any principal.",
    href: "/docs/covenant-policy",
  },
  {
    icon: FlaskConical,
    title: "Simulation",
    desc: "Forward-looking scenario modeling — project the effects of decisions and signal changes before committing.",
    href: "/docs/simulation",
  },
  {
    icon: Clock,
    title: "Audit Timeline",
    desc: "The unified, immutable chronological record of all signal, decision, and execution events in a workflow.",
    href: "/docs/worldline",
  },
  {
    icon: Cpu,
    title: "Governed Inference",
    desc: "AI model routing, versioning, cost tracking, quality signals, and governance integration across all inference.",
    href: "/docs/model-mesh",
  },
  {
    icon: ShieldCheck,
    title: "Trust (technical)",
    desc: "Structural trust controls, governance commitments, and domain-specific compliance considerations by vertical.",
    href: "/docs/trust",
  },
  {
    icon: GitBranch,
    title: "GitHub",
    desc: "GitHub as technical proof and implementation evidence — not the primary CTA. Who it's for and what it demonstrates.",
    href: "/docs/github",
  },
];

const PILOT_PAGES = [
  { label: "PRISM Counsel pilot", href: "/pilot/prism-counsel", desc: "Legal operations — matter twin, workflow, trust controls, 30/60/90 milestones" },
  { label: "Terra pilot", href: "/pilot/terra", desc: "Real estate diligence — property twin, official data, 30/60/90 milestones" },
  { label: "Vessels pilot", href: "/pilot/vessels", desc: "Maritime operations — voyage twin, compliance controls, 30/60/90 milestones" },
  { label: "Aegis pilot", href: "/pilot/aegis", desc: "Security operations — threat twin, KEV/NVD, 30/60/90 milestones" },
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
    description: "Platform documentation, technical architecture, trust controls, capability matrix, pilot pages, and design partner resources for Lyte + Alloy.",
    canonical: "https://szlholdings.com/docs",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        {/* Hero */}
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
                Platform overview, technical architecture, trust documentation, capability matrix,
                pilot pages, and design partner resources — organized for operators, investors, and technical reviewers.
              </p>
            </m.div>
          </div>
        </section>

        {/* Technical docs sub-pages */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "0.75rem" }}>Technical documentation</p>
              <h2 style={{ fontSize: "clamp(1.25rem,3vw,1.75rem)", fontWeight: 600, letterSpacing: "-0.020em", lineHeight: 1.18, marginBottom: "2rem" }}>Architecture, governance, and system documentation.</h2>
            </m.div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: "1rem" }}>
              {TECHNICAL_DOCS.map((doc, i) => {
                const Icon = doc.icon;
                return (
                  <m.div
                    key={doc.title}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.05 }}
                  >
                    <Link
                      href={doc.href}
                      style={{ display: "block", borderRadius: "0.75rem", border: "1px solid var(--color-szl-border)", background: "hsla(0,0%,100%,0.025)", padding: "1.25rem", textDecoration: "none", transition: "border-color 0.18s, background 0.18s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-szl-border-hover)"; (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.04)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-szl-border)"; (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.025)"; }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem" }}>
                        <div style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(0,0%,100%,0.05)", border: "1px solid var(--color-szl-border)", borderRadius: "0.5rem", flexShrink: 0 }}>
                          <Icon size={15} color="hsla(0,0%,100%,0.50)" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", marginBottom: "0.375rem" }}>
                            <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,8%,92%)" }}>{doc.title}</span>
                            <ArrowRight size={14} color="hsla(0,0%,100%,0.25)" style={{ flexShrink: 0 }} />
                          </div>
                          <p style={{ fontSize: "0.8125rem", lineHeight: 1.55, color: "hsl(214,7%,58%)" }}>{doc.desc}</p>
                        </div>
                      </div>
                    </Link>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Platform docs navigation */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "0.75rem" }}>Platform & product</p>
              <h2 style={{ fontSize: "clamp(1.25rem,3vw,1.75rem)", fontWeight: 600, letterSpacing: "-0.020em", lineHeight: 1.18, marginBottom: "2rem" }}>Platform overview, trust, and domain solutions.</h2>
            </m.div>
            <div className="szl-grid-2" style={{ gap: "1.5rem" }}>
              {PLATFORM_DOCS.map((section, i) => {
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

        {/* Pilot pages */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "0.75rem" }}>Pilot readiness</p>
              <h2 style={{ fontSize: "clamp(1.25rem,3vw,1.75rem)", fontWeight: 600, letterSpacing: "-0.020em", lineHeight: 1.18, marginBottom: "0.75rem" }}>Vertical pilot pages.</h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.65, color: "hsl(214,7%,62%)", maxWidth: "52ch", marginBottom: "2rem" }}>Each vertical has a dedicated pilot page with target buyer profile, first use case, integration requirements, 30/60/90 milestones, trust controls, and scope definition.</p>
            </m.div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "0.875rem" }}>
              {PILOT_PAGES.map((pilot, i) => (
                <m.div
                  key={pilot.href}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                >
                  <Link
                    href={pilot.href}
                    style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", borderRadius: "0.75rem", border: "1px solid var(--color-szl-border)", background: "hsla(0,0%,100%,0.025)", padding: "1.125rem 1.25rem", textDecoration: "none", transition: "border-color 0.18s, background 0.18s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-szl-border-hover)"; (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.04)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-szl-border)"; (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.025)"; }}
                  >
                    <FileText size={15} color="hsla(0,0%,100%,0.35)" style={{ flexShrink: 0, marginTop: "2px" }} />
                    <div>
                      <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,8%,90%)", marginBottom: "0.25rem" }}>{pilot.label}</div>
                      <div style={{ fontSize: "0.8125rem", color: "hsl(214,7%,56%)", lineHeight: 1.5 }}>{pilot.desc}</div>
                    </div>
                  </Link>
                </m.div>
              ))}
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

        {/* CTA */}
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
