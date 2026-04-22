import { m } from "framer-motion";
import { Link } from "wouter";
import {
  Building2, ArrowRight, Shield, Target, Clock, Zap,
  CheckCircle2, Ship, ShieldCheck, Home, BriefcaseBusiness
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const WHY_NOW = [
  {
    icon: Zap,
    title: "AI adoption without governance infrastructure",
    body: "Organizations are deploying AI at the workflow level with no infrastructure to track what was recommended, who approved it, and what actually happened. That gap is the product.",
  },
  {
    icon: Clock,
    title: "Execution latency is invisible",
    body: "Most leadership teams can see their metrics. Almost none can see why approvals are stalling, where ownership has drifted, or which signals were missed before a decision was made. Dashboards show what happened. Observability shows what needs to happen next.",
  },
  {
    icon: Shield,
    title: "Enterprise workflow is still unstructured",
    body: "Email, meetings, and spreadsheets still govern most high-stakes operational decisions. The market for structured, auditable, AI-assisted workflow is large and underpenetrated.",
  },
];

const WEDGE_PLATFORM = [
  {
    title: "Lyte as the command layer",
    body: "Lyte surfaces what matters — approval latency, ownership gaps, execution risk, threshold crossings — across all connected systems. Every vertical inherits this signal layer.",
  },
  {
    title: "Alloy as the action spine",
    body: "Alloy routes signals to structured recommendations, manages the human-in-the-loop approval chain, and executes approved actions via a connector mesh. Built once. Shared across all verticals.",
  },
  {
    title: "Domain packs as the expansion model",
    body: "Each vertical — Counsel, Vessels, Aegis, Terra — is a domain pack layered on top of the shared platform. New verticals inherit signal ingestion, AI governance, workflow orchestration, and audit infrastructure without rebuilding from scratch.",
  },
];

const VERTICALS = [
  { icon: Target, name: "Counsel", color: "#d4a054", wedge: true, body: "Legal matter observability — deadlines, exposure tracking, approval governance, export safety. The commercial wedge. First vertical entering design-partner engagement." },
  { icon: Ship, name: "SEXTANT", color: "#4a90b8", body: "Maritime intelligence — voyage twins, AIS monitoring, route risk, port congestion, sanctions compliance. Second vertical. Infrastructure ready." },
  { icon: ShieldCheck, name: "PARAGON", color: "#c45a4a", body: "Security and defense observability — threat twins, incident workflows, exposure prioritization. Third vertical. Architecture shared." },
  { icon: Home, name: "DOMAINE", color: "#c8953c", body: "Real estate intelligence — property twins, diligence workflows, distress scoring. Fourth vertical. Same execution model." },
  { icon: BriefcaseBusiness, name: "Carlota Jo", color: "#8b7ac8", body: "Advisory and consulting intelligence. Premium client-facing layer. Near-term revenue opportunity while the software matures." },
];

const PROOF_TODAY = [
  "Live Counsel product across full workflow — signal detection, twin enrichment, approval gates, export safety, audit trail",
  "Vessels Maritime Intelligence: voyage twin, AIS monitoring, sanctions compliance surface, port risk",
  "Aegis Defense: threat twin, incident workflows, exposure prioritization",
  "Terra Real Estate: property twin, distress scoring, diligence workflows",
  "Alloy execution fabric running across all verticals — same connector mesh, same governance model",
  "GitHub is real code, not a demonstration repository",
  "This investor surface is built on the same platform it describes",
];

const MILESTONES = [
  { phase: "Now", label: "Lyte proof", items: ["Counsel in active design-partner engagement", "Full workflow demo available on request", "Architecture and trust surface complete and reviewable"] },
  { phase: "Next", label: "Alloy maturity", items: ["First paid pilot contract signed", "Vessels entering design-partner phase", "SOC 2 Type II audit preparation underway"] },
  { phase: "Later", label: "Expansion", items: ["Aegis and Terra design-partner engagement", "Cross-vertical analytics via shared Lyte command layer", "Enterprise GTM with Microsoft 365 integration"] },
];

export default function InvestorPage() {
  const __pageMeta = usePageMeta({
    title: "Investor — SZL Holdings",
    description: "SZL Holdings investor overview — company thesis, wedge and platform logic, why Lyte first, proof today, honest milestones, contact.",
    canonical: "https://szlholdings.com/investor",
  });

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
        <SiteNav />
        <main id="main-content" >
  
          <section className="szl-grid-texture szl-depth-glow-gold" style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)", borderBottom: "1px solid var(--color-szl-border)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.875rem", borderRadius: "99px", border: "1px solid hsla(38,52%,58%,0.22)", background: "hsla(38,52%,58%,0.08)", marginBottom: "1.75rem" }}>
                  <Building2 size={13} color="hsl(38,52%,58%)" />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "hsl(38,52%,58%)" }}>Investor</span>
                </div>
                <h1 style={{ fontSize: "clamp(2.25rem,5vw,3.75rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.06, maxWidth: "22ch", marginBottom: "1.5rem" }}>
                  Governed decision infrastructure. One 9-step loop. Multiple domains.
                </h1>
                <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "56ch", marginBottom: "2rem" }}>
                  SZL Holdings is building the infrastructure layer for how governed organizations
                  detect operational risk, route decisions to the right people, and verify what
                  happened. This page is honest about where we are.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  <Link href="/demo" className="szl-btn-primary">
                    See the live product <ArrowRight size={14} />
                  </Link>
                  <Link href="/investors/data-room" className="szl-btn-secondary">
                    Request data room access →
                  </Link>
                  <Link href="/investors" className="szl-btn-ghost">
                    Full investor hub
                  </Link>
                </div>
              </m.div>
            </div>
          </section>
  
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Company Thesis</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "32ch", marginBottom: "1.5rem" }}>
                  Dashboards show what happened. We show what needs to happen next.
                </h2>
                <p style={{ fontSize: "clamp(1rem,1.8vw,1.0625rem)", lineHeight: 1.72, color: "hsl(214,7%,60%)", maxWidth: "58ch" }}>
                  Governed decision infrastructure is not a dashboard category. It is the structural
                  layer between signal detection and action execution — nine governed stages, full AI
                  provenance, policy gates that cannot be bypassed, and an immutable proof chain on
                  every consequential decision. Every domain pack inherits this. This is architecture,
                  not a feature set.
                </p>
              </m.div>
            </div>
          </section>
  
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Why now</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>Three converging conditions create the window.</h2>
              </m.div>
              <div className="szl-grid-3" style={{ gap: "1.25rem" }}>
                {WHY_NOW.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <m.div key={item.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.38, delay: i * 0.07 }} className="szl-card" style={{ borderRadius: "0.875rem", padding: "var(--space-card-pad)" }}>
                      <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(38,52%,58%,0.08)", border: "1px solid hsla(38,52%,58%,0.18)", borderRadius: "0.5rem", marginBottom: "1rem" }}>
                        <Icon size={16} color="hsl(38,52%,58%)" />
                      </div>
                      <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.625rem", lineHeight: 1.4 }}>{item.title}</h3>
                      <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,58%)" }}>{item.body}</p>
                    </m.div>
                  );
                })}
              </div>
            </div>
          </section>
  
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Wedge + Platform logic</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "3rem" }}>The shared spine is the strategic asset.</h2>
              </m.div>
              <div className="szl-grid-3" style={{ gap: "1.25rem" }}>
                {WEDGE_PLATFORM.map((item, i) => (
                  <m.div key={item.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.38, delay: i * 0.07 }} className="szl-card" style={{ borderRadius: "0.875rem", padding: "var(--space-card-pad)" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.625rem", lineHeight: 1.4, color: "hsl(38,8%,88%)" }}>{item.title}</h3>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,58%)" }}>{item.body}</p>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Vertical strategy</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "3rem" }}>Five operating domains. One shared execution fabric.</h2>
              </m.div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {VERTICALS.map((v, i) => {
                  const Icon = v.icon;
                  return (
                    <m.div key={v.name} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.06 }} className="szl-card" style={{ borderRadius: "0.75rem", padding: "1.125rem 1.375rem", display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                      <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: `${v.color}14`, border: `1px solid ${v.color}28`, borderRadius: "0.5rem", flexShrink: 0 }}>
                        <Icon size={16} color={v.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.375rem" }}>
                          <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,8%,88%)" }}>{v.name}</span>
                          {v.wedge && (
                            <span style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.125rem 0.4375rem", borderRadius: "99px", color: "#d4a054", background: "hsla(38,52%,58%,0.10)", border: "1px solid hsla(38,52%,58%,0.22)" }}>Commercial wedge</span>
                          )}
                        </div>
                        <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "hsl(214,7%,56%)" }}>{v.body}</p>
                      </div>
                    </m.div>
                  );
                })}
              </div>
            </div>
          </section>
  
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Proof that exists today</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "2rem" }}>This is running code, not a roadmap.</h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.68, color: "hsl(214,7%,60%)", maxWidth: "52ch", marginBottom: "2.5rem" }}>
                  No fake revenue, clients, audits, or contracts. What follows is what exists today.
                </p>
              </m.div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {PROOF_TODAY.map((item, i) => (
                  <m.div key={item} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.05 }} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.75rem 1rem", borderRadius: "0.5rem", background: "hsla(145,62%,40%,0.04)", border: "1px solid hsla(145,62%,40%,0.10)" }}>
                    <CheckCircle2 size={15} color="hsl(145,62%,46%)" style={{ flexShrink: 0, marginTop: "1px" }} />
                    <span style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "hsl(214,7%,64%)" }}>{item}</span>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Milestones</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>Now, Next, Later.</h2>
              </m.div>
              <div className="szl-grid-3" style={{ gap: "1.25rem" }}>
                {MILESTONES.map((phase, i) => (
                  <m.div key={phase.phase} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.38, delay: i * 0.08 }} className="szl-card" style={{ borderRadius: "0.875rem", padding: "var(--space-card-pad)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: i === 0 ? "hsl(145,62%,46%)" : i === 1 ? "hsl(38,52%,58%)" : "hsl(214,7%,52%)" }}>{phase.phase}</span>
                      <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "hsl(38,8%,78%)" }}>— {phase.label}</span>
                    </div>
                    <ul style={{ display: "flex", flexDirection: "column", gap: "0.5rem", listStyle: "none", padding: 0, margin: 0 }}>
                      {phase.items.map((item) => (
                        <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                          <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: i === 0 ? "hsl(145,62%,46%)" : i === 1 ? "hsl(38,52%,58%)" : "hsl(214,7%,42%)", flexShrink: 0, marginTop: "8px" }} />
                          <span style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "hsl(214,7%,58%)" }}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          <section style={{ padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }} className="szl-card" style={{ borderRadius: "1rem", padding: "clamp(2rem,4vw,3rem)" }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(38,52%,58%)", marginBottom: "1rem" }}>Contact</p>
                <h2 style={{ fontSize: "clamp(1.375rem,3vw,2rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.2, maxWidth: "28ch", marginBottom: "1rem" }}>
                  The clearest way to understand SZL is to see it running.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.68, color: "hsl(214,7%,60%)", maxWidth: "52ch", marginBottom: "2rem" }}>
                  Every investor conversation starts with the live product, not a slide deck. If you want
                  structured materials, request data room access. If you want to talk about architecture,
                  governance, or sequencing — reach out directly.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  <Link href="/demo" className="szl-btn-primary">
                    See the live product <ArrowRight size={14} />
                  </Link>
                  <Link href="/investors/data-room" className="szl-btn-secondary">
                    Request data room access →
                  </Link>
                  <Link href="/contact" className="szl-btn-ghost">
                    Send a note
                  </Link>
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
