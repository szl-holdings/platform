import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Ship, Map, BarChart3, FileText, AlertOctagon, Anchor } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const CAPABILITIES = [
  { icon: Map, title: "Fleet Position & Status", body: "Real-time and near-real-time fleet visibility across all your vessels — position, heading, speed, and operational status without tab-switching between systems." },
  { icon: BarChart3, title: "Voyage Performance", body: "Fuel consumption, speed variance, schedule adherence, and cargo milestones — all surfaced as signals when performance deviates from plan." },
  { icon: AlertOctagon, title: "Exception Detection", body: "SEXTANT surfaces operational exceptions — port delays, weather reroutes, cargo holds, and crew incidents — before they cascade into commercial damage." },
  { icon: FileText, title: "Regulatory Audit Trail", body: "Every maritime operation leaves a compliance footprint. SEXTANT captures it automatically with full attribution for cargo, crew, customs, and port operations." },
  { icon: Anchor, title: "Port Operations Workflow", body: "Pre-arrival checklists, berth scheduling, agent coordination, and customs workflows — routed through FORGE with approval gates and follow-through verification." },
  { icon: Ship, title: "Fleet Intelligence Dashboard", body: "One command surface for commercial, operations, and chartering teams. Signal-first, not report-first. The right alert at the right moment." },
];

const USE_CASES = [
  {
    label: "Dark vessel alert",
    title: "AIS gap detected — fleet manager routes to compliance officer",
    role: "Fleet Manager → Compliance Officer → Chartering Desk",
    steps: [
      { signal: true, text: "AIS transmission gap detected on MV Andromeda — 11 hours of dark sailing in a sanctions-sensitive corridor" },
      { text: "Fleet manager opens vessel record: last confirmed position, voyage context, cargo manifest, and flag state displayed" },
      { text: "SEXTANT surfaces correlated signals — similar AIS patterns from this vessel six months prior, current OFAC watch list proximity" },
      { text: "Fleet manager routes incident to compliance officer with full evidence package and recommended escalation path" },
      { proof: true, text: "Proof Chain captures the decision: who reviewed it, what evidence was considered, which action was approved, and when" },
    ],
  },
  {
    label: "Port delay exception",
    title: "Berth delay cascades — operations team acts before commercial impact compounds",
    role: "Operations Team → Commercial Director → Port Agent",
    steps: [
      { signal: true, text: "Berth delay exception fires — MV Crestline is 18 hours behind schedule at Port of Rotterdam, cargo handoff at risk" },
      { text: "Operations team reviews impact model: downstream charter party obligations, demurrage exposure, connecting cargo windows" },
      { text: "FORGE routes pre-arrival workflow revision to port agent with updated ETA, berth instructions, and customs clearance tasks" },
      { text: "Commercial director approves revised voyage plan within the governed decision loop — no off-platform approval chains" },
      { proof: true, text: "Outcome tracked to delivery: revised ETA, actual arrival, and demurrage outcome logged against the original decision" },
    ],
  },
  {
    label: "Sanctions screening",
    title: "Counterparty flag triggers due diligence before charter is signed",
    role: "Chartering Desk → Legal → CCSM Officer",
    steps: [
      { signal: true, text: "Counterparty screening signal fires — proposed cargo receiver matches a newly designated SDN subsidiary" },
      { text: "Chartering desk reviews risk summary: entity ownership graph, prior transaction history, and designation date" },
      { text: "FORGE routes to legal for secondary review with full sanctions context, recommended hold, and charter clause reference" },
      { text: "Legal team confirms hold — charter signing workflow suspended pending clear-to-proceed from CCSM officer" },
      { proof: true, text: "Proof Chain records the entire review chain — no action taken without approved sign-off, evidence preserved for regulator review" },
    ],
  },
];

function UseCaseLane({ useCase, delay }: { useCase: typeof USE_CASES[0]; delay: number }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.42, delay }}
      className="szl-card"
      style={{ borderRadius: "0.875rem", padding: "clamp(1.5rem,3vw,2rem)", display: "flex", flexDirection: "column", gap: "1.5rem" }}
    >
      <div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-vessels)", opacity: 0.85 }}>{useCase.label}</span>
        <h3 style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", fontWeight: 600, letterSpacing: "-0.016em", lineHeight: 1.3, marginTop: "0.4rem", marginBottom: "0.375rem" }}>{useCase.title}</h3>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem", color: "hsl(214,7%,48%)", letterSpacing: "0.06em" }}>{useCase.role}</p>
      </div>
      <ol style={{ display: "flex", flexDirection: "column", gap: "0", listStyle: "none", margin: 0, padding: 0 }}>
        {useCase.steps.map((step, i) => (
          <li key={i} style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <div style={{
                width: "22px", height: "22px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                background: step.signal ? `hsla(206,72%,40%,0.15)` : step.proof ? `hsla(152,70%,50%,0.12)` : "hsla(214,12%,14%,1)",
                border: step.signal ? `1px solid hsla(206,72%,40%,0.40)` : step.proof ? `1px solid hsla(152,70%,50%,0.30)` : "1px solid hsla(0,0%,100%,0.08)",
                fontSize: "0.6rem", fontWeight: 700, color: step.signal ? "hsl(206,72%,68%)" : step.proof ? "hsl(152,70%,55%)" : "hsl(214,7%,52%)",
                fontFamily: "var(--font-mono)",
              }}>
                {i + 1}
              </div>
              {i < useCase.steps.length - 1 && (
                <div style={{ width: "1px", height: "1.5rem", background: "hsla(0,0%,100%,0.07)", margin: "0.25rem 0" }} />
              )}
            </div>
            <div style={{ paddingTop: "0.2rem" }}>
              <p style={{ fontSize: "0.8125rem", lineHeight: 1.62, color: step.signal ? "hsl(38,8%,88%)" : step.proof ? "hsl(152,40%,72%)" : "hsl(214,7%,62%)" }}>
                {step.signal && <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(206,72%,65%)", marginRight: "0.4rem" }}>Signal</span>}
                {step.proof && <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(152,70%,55%)", marginRight: "0.4rem" }}>Proof Chain</span>}
                {step.text}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </m.div>
  );
}

export default function SolutionsVesselsPage() {
  const __pageMeta = usePageMeta({
    title: "SEXTANT — Maritime Intelligence · SZL Holdings",
    description: "Fleet command, simulated AIS telemetry, sanctions screening, dark vessel detection, exception-based workflows. SEXTANT is the maritime domain pack — built on the same governance infrastructure as every SZL product. Public AIS feeds (Digitraffic, BarentsWatch) are integrated; demo dashboards use simulated AIS data.",
    canonical: "https://szlholdings.com/solutions/vessels",
    ogImage: "https://szlholdings.com/og/og-vessels.jpg",
  });

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
        <SiteNav />
        <main id="main-content" >
          <section className="szl-grid-texture" style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)", borderBottom: "1px solid var(--color-szl-border)", background: "radial-gradient(ellipse at 50% 0%, hsla(206,72%,40%,0.06) 0%, transparent 60%)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.75rem" }}>
                  <Link href="/solutions" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", textDecoration: "none" }}>Solutions</Link>
                  <span style={{ color: "var(--color-szl-text-faint)" }}>/</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-vessels)", opacity: 0.9 }}>SEXTANT</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.75rem" }}>
                  <div style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-vessels-muted)", border: "1px solid hsla(206,72%,40%,0.20)", borderRadius: "0.5625rem" }}>
                    <Ship size={20} color="var(--color-vessels)" />
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-vessels)", opacity: 0.8 }}>Maritime Intelligence</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <h1 style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)", fontWeight: 600, letterSpacing: "-0.028em", lineHeight: 1.08 }}>SEXTANT</h1>
                      <span style={{ display: "inline-flex", alignItems: "center", padding: "0.125rem 0.5rem", borderRadius: "0.25rem", background: "hsla(206,72%,40%,0.12)", border: "1px solid hsla(206,72%,40%,0.25)", fontFamily: "var(--font-mono)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-vessels)", alignSelf: "flex-start", marginTop: "0.5rem" }}>Beta</span>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "52ch", marginBottom: "2.25rem" }}>
                  Decision intelligence for assets underway. Fleet visibility, voyage performance,
                  and operational exception management — for the teams that run complex, distributed
                  maritime operations.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  <Link href="/contact" className="szl-btn-primary">Request a walkthrough <ArrowRight size={15} /></Link>
                  <Link href="/solutions/vessels/trust" className="szl-btn-secondary">Trust & Governance</Link>
                  <Link href="/solutions" className="szl-btn-secondary">All solutions</Link>
                </div>
              </m.div>
            </div>
          </section>
  
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-vessels)", marginBottom: "1rem" }}>Capabilities</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                  Command-grade maritime intelligence.
                </h2>
              </m.div>
              <div className="szl-grid-3">
                {CAPABILITIES.map((cap, i) => {
                  const Icon = cap.icon;
                  return (
                    <m.div key={cap.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.38, delay: i * 0.06 }} className="szl-card" style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}>
                      <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-vessels-muted)", border: "1px solid hsla(206,72%,40%,0.18)", borderRadius: "0.4375rem", marginBottom: "1rem" }}>
                        <Icon size={16} color="var(--color-vessels)" />
                      </div>
                      <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.625rem" }}>{cap.title}</h3>
                      <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{cap.body}</p>
                    </m.div>
                  );
                })}
              </div>
            </div>
          </section>
  
          <section style={{ padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-vessels)", marginBottom: "1rem" }}>Scenarios</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "36ch", marginBottom: "0.75rem" }}>
                  A day in the life of a maritime operations team.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "hsl(214,7%,56%)", maxWidth: "56ch", marginBottom: "3rem" }}>
                  Exception fires. Fleet manager acts. Decision is captured. Every consequential maritime workflow — from dark vessel detection to sanctions screening — follows the same governed loop.
                </p>
              </m.div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 360px), 1fr))", gap: "1.25rem" }}>
                {USE_CASES.map((uc, i) => (
                  <UseCaseLane key={uc.label} useCase={uc} delay={i * 0.08} />
                ))}
              </div>
            </div>
          </section>
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
