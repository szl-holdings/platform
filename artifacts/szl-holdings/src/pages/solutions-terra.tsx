import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Building2, BarChart3, Map, FileText, AlertOctagon, Workflow } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { UseCaseLane } from "@/components/UseCaseLane";

const CAPABILITIES = [
  { icon: AlertOctagon, title: "Distress Property Detection", body: "Lyte monitors market signals, tax records, foreclosure filings, and price anomalies to surface distressed opportunities before they're widely visible." },
  { icon: BarChart3, title: "Deal Pipeline Command", body: "Every active deal with its current stage, ownership, pending tasks, and approval requirements — in one command view instead of a spreadsheet." },
  { icon: Map, title: "Market Signal Monitoring", body: "Terra watches the signals that matter to your acquisition thesis — cap rate compression, permit activity, absorption rates — and surfaces deviations." },
  { icon: Workflow, title: "Broker Workflow Routing", body: "Counsel routes acquisition tasks, NDA workflows, due diligence requests, and closing steps to the right person with the right context and deadline." },
  { icon: FileText, title: "Acquisition Audit Trail", body: "Every decision in the acquisition process — from initial sourcing to closing — is logged with attribution and rationale for LP and compliance review." },
  { icon: Building2, title: "Portfolio Risk Dashboard", body: "Surface performance anomalies, lease expirations, deferred maintenance signals, and occupancy drift across your portfolio before they compound." },
];

const USE_CASES = [
  {
    label: "Distressed acquisition",
    title: "Distress signal fires — acquisition analyst brings deal to investment committee",
    role: "Acquisition Analyst → Investment Committee → Deal Counsel",
    steps: [
      { signal: true, text: "Distress signal fires on 217 West 48th St — 3 consecutive tax delinquency filings, foreclosure lis pendens recorded" },
      { text: "Analyst opens property record: ownership entity graph, debt stack, comparable sales, and current market exposure displayed" },
      { text: "Decision Simulation models three acquisition scenarios — direct purchase, note acquisition, and joint venture — with risk delta per path" },
      { text: "Analyst packages the signal summary, entity graph, and simulation output for investment committee review" },
      { proof: true, text: "Proof Chain records the sourcing rationale, simulation inputs, and committee decision — LP-ready attribution from signal to approved LOI" },
    ],
  },
  {
    label: "Portfolio risk alert",
    title: "Lease expiration cluster surfaces — asset manager acts before occupancy drops",
    role: "Asset Manager → Portfolio Director → Property Management",
    steps: [
      { signal: true, text: "Portfolio risk signal fires — four leases totaling 38,000 sq ft expire within 90 days, no renewal status recorded" },
      { text: "Asset manager reviews tenant health for each: payment history, market absorption rate, broker relationship status, and space configuration" },
      { text: "Counsel routes renewal workflow to property management team — outreach tasks, broker instruction, and renewal term proposal assigned with deadlines" },
      { text: "Portfolio director approves go/no-go on each renewal path — two renewals, one repositioning, one early marketing directive" },
      { proof: true, text: "Outcome Graph tracks leasing result against the renewal decision — vacancy rate, achieved rent, and time-to-execute recorded for LP reporting" },
    ],
  },
  {
    label: "Market signal deviation",
    title: "Cap rate compression detected — fund manager re-underwrites before committing capital",
    role: "Fund Manager → Acquisitions VP → Capital Markets",
    steps: [
      { signal: true, text: "Market signal deviation detected — multifamily cap rate in target submarket has compressed 60bps in 90 days, beyond thesis tolerance" },
      { text: "Terra surfaces the underlying signals: three distressed sales reset comps, new mixed-use supply under permit, absorption rate trending down" },
      { text: "Fund manager initiates re-underwrite on three pipeline deals — deal pipeline command updated with revised IRR and equity multiple at new entry basis" },
      { text: "Acquisitions VP reviews re-underwrite results — two deals paused, one repriced and returned to seller, one approved for revised LOI" },
      { proof: true, text: "Proof Chain logs the market signal, re-underwrite inputs, and deal disposition decisions — defensible record for LP quarterly reporting" },
    ],
  },
];

const TERRA_SIGNAL_STYLE = {
  bg: "hsla(140,50%,38%,0.15)",
  border: "1px solid hsla(140,50%,38%,0.40)",
  numberColor: "hsl(140,50%,62%)",
  labelColor: "hsl(140,50%,58%)",
};

export default function SolutionsTerraPage() {
  const __pageMeta = usePageMeta({
    title: "Terra — Real Estate Intelligence · SZL Holdings",
    description: "NYC distress property pipeline, ownership entity graph, deal pipeline, broker workflow. Terra is the real estate intelligence domain pack — built on the same governance infrastructure as every SZL product.",
    canonical: "https://szlholdings.com/solutions/terra",
    ogImage: "https://szlholdings.com/og/og-terra.jpg",
  });

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
        <SiteNav />
        <main id="main-content" >
          <section className="szl-grid-texture" style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)", borderBottom: "1px solid var(--color-szl-border)", background: "radial-gradient(ellipse at 50% 0%, hsla(140,50%,38%,0.05) 0%, transparent 60%)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.75rem" }}>
                  <Link href="/solutions" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", textDecoration: "none" }}>Solutions</Link>
                  <span style={{ color: "var(--color-szl-text-faint)" }}>/</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-terra)", opacity: 0.9 }}>Terra</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.75rem" }}>
                  <div style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-terra-muted)", border: "1px solid hsla(140,50%,38%,0.20)", borderRadius: "0.5625rem" }}>
                    <Building2 size={20} color="var(--color-terra)" />
                  </div>
                  <div>
                    <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-terra)", opacity: 0.8 }}>Real Estate Intelligence</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <h1 style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)", fontWeight: 600, letterSpacing: "-0.028em", lineHeight: 1.08 }}>Terra</h1>
                      <span style={{ display: "inline-flex", alignItems: "center", padding: "0.125rem 0.5rem", borderRadius: "0.25rem", background: "hsla(142,50%,40%,0.12)", border: "1px solid hsla(142,50%,40%,0.25)", fontFamily: "var(--font-mono)", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-terra)", alignSelf: "flex-start", marginTop: "0.5rem" }}>Beta</span>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "52ch", marginBottom: "2.25rem" }}>
                  A data-rich, execution-poor industry finally getting a command layer. Terra
                  applies Lyte + Counsel to real estate acquisition, portfolio management, and
                  deal operations — so operators see the signal and act on it.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  <Link href="/contact" className="szl-btn-primary">Request a walkthrough <ArrowRight size={15} /></Link>
                  <Link href="/solutions/terra/trust" className="szl-btn-secondary">Trust & Governance</Link>
                  <Link href="/solutions" className="szl-btn-secondary">All solutions</Link>
                </div>
              </m.div>
            </div>
          </section>
  
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-terra)", marginBottom: "1rem" }}>Capabilities</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                  Signal-to-close, governed throughout.
                </h2>
              </m.div>
              <div className="szl-grid-3">
                {CAPABILITIES.map((cap, i) => {
                  const Icon = cap.icon;
                  return (
                    <m.div key={cap.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.38, delay: i * 0.06 }} className="szl-card" style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}>
                      <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-terra-muted)", border: "1px solid hsla(140,50%,38%,0.18)", borderRadius: "0.4375rem", marginBottom: "1rem" }}>
                        <Icon size={16} color="var(--color-terra)" />
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
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-terra)", marginBottom: "1rem" }}>Scenarios</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "36ch", marginBottom: "0.75rem" }}>
                  A day in the life of an acquisition and asset management team.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "hsl(214,7%,56%)", maxWidth: "56ch", marginBottom: "3rem" }}>
                  Signal fires. Analyst reviews. Committee decides. Every real estate workflow — from distress identification to lease renewal — runs through the same governed loop, with full attribution for LP reporting.
                </p>
              </m.div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 360px), 1fr))", gap: "1.25rem" }}>
                {USE_CASES.map((uc, i) => (
                  <UseCaseLane key={uc.label} useCase={uc} color="var(--color-terra)" delay={i * 0.08} signalStyle={TERRA_SIGNAL_STYLE} />
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
