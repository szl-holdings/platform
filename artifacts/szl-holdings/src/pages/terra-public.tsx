import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Building2, CheckCircle2, Shield, FileText, Eye, Lock, Database, Zap, AlertTriangle, Map, BarChart3 } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const WORKFLOW_STEPS = [
  {
    step: "01",
    label: "Property Twin",
    body: "Every property modeled as a live structured object — ownership records, lien status, permit history, PLUTO data, flood zone classification, and market context — assembled and continuously updated.",
  },
  {
    step: "02",
    label: "Distress & Diligence",
    body: "Distress signals surfaced: tax delinquency, foreclosure filings, code violations, ownership gaps, and price anomalies. Diligence checklist status tracked against the deal team's requirements.",
  },
  {
    step: "03",
    label: "Local Friction",
    body: "Zoning overlays, environmental conditions, FEMA flood risk, and census economic context layered onto the property profile — so the deal team sees friction before they're in front of it.",
  },
  {
    step: "04",
    label: "Review & Approval",
    body: "Deal team reviews property analysis and Alloy routes approval decisions with full context — owner, deadline, outstanding items, and recommended next action all handed off in one structured package.",
  },
  {
    step: "05",
    label: "Export & Write-Back",
    body: "Diligence packages exported in LP-ready format or written back to the deal platform with attribution, approval record, and data provenance intact.",
  },
];

const SIGNAL_SOURCES = [
  { label: "NYC PLUTO", detail: "Primary land use and property data — zoning, building class, lot area, floor area, assessed value, and ownership records" },
  { label: "FEMA NFHL", detail: "National Flood Hazard Layer data for flood zone classification, base flood elevations, and risk scoring" },
  { label: "US Census Bureau", detail: "Demographic, economic, and housing context for acquisition thesis validation and deal underwriting" },
  { label: "Public Lien Records", detail: "Tax lien, mechanic's lien, and judgment lien status drawn from public county records and court filings" },
  { label: "Permit and Violation Records", detail: "Open and closed building permits, code violations, and certificate of occupancy status from municipal sources" },
];

const CAPABILITIES = [
  { icon: Eye, title: "Property Twin", body: "A live structured model of each property — ownership, liens, permits, distress signals, flood risk, and market context — assembled from public and proprietary data sources." },
  { icon: AlertTriangle, title: "Distress Detection", body: "Tax delinquency, foreclosure filings, code violations, and ownership gaps surfaced before the property is widely visible as an opportunity." },
  { icon: Map, title: "Local Context Layer", body: "Zoning overlays, environmental data, FEMA flood risk, and census economics layered onto every property — friction visible before you're committed." },
  { icon: FileText, title: "Diligence Workflow", body: "Structured due diligence checklists routed through Alloy with role-based assignment, deadline tracking, and approval gates for consequential deal decisions." },
  { icon: BarChart3, title: "Portfolio Intelligence", body: "Aggregate distress signals, lease expirations, deferred maintenance indicators, and occupancy drift across your portfolio — surfaced before they compound." },
  { icon: Shield, title: "LP-Ready Export", body: "Diligence packages and property analyses exported in structured format for LP review, regulatory compliance, or investor reporting." },
];

const TRUST_CONTROLS = [
  "Human approval gates on all acquisition decisions and material portfolio actions",
  "Source attribution on every data point — no synthetic or hallucinated property data",
  "Complete diligence audit trail for LP and regulatory review",
  "Role-based access — deal team, analysts, and portfolio managers see their scope",
  "Export controls with provenance tracking for every document leaving the system",
  "No autonomous execution — every recommended action requires explicit approval",
];

export default function TerraPublicPage() {
  usePageMeta({
    title: "Terra — Property Twin & Real Estate Intelligence | SZL Holdings",
    description: "Terra turns fragmented property signals into governed deal intelligence. Property Twin, distress detection, FEMA flood risk, diligence workflow, and LP-ready export.",
    canonical: "https://szlholdings.com/terra-public",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        {/* Hero */}
        <section
          className="szl-grid-texture"
          style={{
            paddingTop: "var(--space-hero-pt)",
            paddingBottom: "clamp(5rem,9vw,7rem)",
            borderBottom: "1px solid var(--color-szl-border)",
            background: "radial-gradient(ellipse at 50% 0%, hsla(140,50%,38%,0.06) 0%, transparent 62%)",
          }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.75rem" }}>
                <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(140,50%,38%,0.10)", border: "1px solid hsla(140,50%,38%,0.22)", borderRadius: "8px" }}>
                  <Building2 size={16} color="hsl(140,50%,48%)" />
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(140,50%,48%)" }}>
                  Terra · Property Intelligence
                </span>
              </div>
            </m.div>

            <div style={{ display: "grid", gap: "clamp(2.5rem,5vw,4rem)", alignItems: "start" }} className="lg:grid-cols-[1.2fr_0.8fr]">
              <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.05 }}>
                <h1
                  style={{
                    fontSize: "clamp(2.5rem,5.5vw,4.25rem)",
                    fontWeight: 600,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.05,
                    marginBottom: "1.5rem",
                    maxWidth: "22ch",
                  }}
                >
                  Every property signal. One command layer.
                </h1>
                <p
                  style={{
                    fontSize: "clamp(1rem,1.8vw,1.125rem)",
                    lineHeight: 1.72,
                    color: "hsl(214,7%,64%)",
                    maxWidth: "50ch",
                    marginBottom: "0.875rem",
                  }}
                >
                  Terra gives real estate operators and investors a command layer above a data-rich but execution-poor industry. Property Twin tracks every asset signal. Alloy routes action through governed workflows with full audit trail.
                </p>
                <p
                  style={{
                    fontSize: "clamp(0.9375rem,1.6vw,1rem)",
                    lineHeight: 1.72,
                    color: "hsl(214,7%,52%)",
                    maxWidth: "50ch",
                    marginBottom: "2.25rem",
                  }}
                >
                  From distress detection to LP-ready diligence export — with human approval at every material decision point.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  <Link href="/demo" className="szl-btn-primary">
                    See the flagship workflow <ArrowRight size={15} />
                  </Link>
                  <Link href="/contact" className="szl-btn-secondary">
                    Request controlled access
                  </Link>
                </div>
              </m.div>

              <m.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.15 }}
                style={{ borderRadius: "0.875rem", padding: "clamp(1.25rem,3vw,1.75rem)", background: "hsla(140,50%,38%,0.04)", border: "1px solid hsla(140,50%,38%,0.15)" }}
              >
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>
                  What Terra answers
                </p>
                {[
                  "Which assets in my portfolio are showing distress signals?",
                  "What is the flood risk and zoning exposure on this property?",
                  "Where is the diligence checklist incomplete before we close?",
                  "What liens and permits are outstanding on this asset?",
                  "Which acquisitions need leadership approval right now?",
                  "What is the portfolio-level friction in our active pipeline?",
                ].map((q, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", marginBottom: "0.75rem" }}>
                    <CheckCircle2 size={14} color="hsl(140,50%,48%)" style={{ marginTop: "2px", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "hsl(214,7%,72%)" }}>{q}</span>
                  </div>
                ))}
                <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--color-szl-border)" }}>
                  <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,48%)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                    Acquisition · Portfolio management · LP reporting
                  </p>
                </div>
              </m.div>
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(140,50%,48%)", marginBottom: "1rem" }}>
                Flagship Workflow
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "3rem" }}>
                From Property Twin to LP-ready export — governed end to end.
              </h2>
            </m.div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {WORKFLOW_STEPS.map((s, i) => (
                <m.div
                  key={s.step}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.38, delay: i * 0.07 }}
                  style={{ display: "flex", gap: "1.5rem", padding: "1.25rem 1.5rem", borderRadius: "10px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)", alignItems: "flex-start" }}
                >
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: "hsl(140,50%,48%)", letterSpacing: "0.06em", flexShrink: 0, marginTop: "2px" }}>
                    {s.step}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.375rem", color: "hsl(38,8%,90%)" }}>{s.label}</h3>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "hsl(214,7%,60%)" }}>{s.body}</p>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(140,50%,48%)", marginBottom: "1rem" }}>
                Core Capabilities
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                Intelligence for every stage of the deal lifecycle.
              </h2>
            </m.div>
            <div className="szl-grid-3">
              {CAPABILITIES.map((cap, i) => {
                const Icon = cap.icon;
                return (
                  <m.div key={cap.title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.38, delay: i * 0.06 }} className="szl-card" style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}>
                    <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(140,50%,38%,0.09)", border: "1px solid hsla(140,50%,38%,0.18)", borderRadius: "0.4375rem", marginBottom: "1rem" }}>
                      <Icon size={16} color="hsl(140,50%,48%)" />
                    </div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.625rem" }}>{cap.title}</h3>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{cap.body}</p>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Signal sources */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "grid", gap: "clamp(3rem,6vw,5rem)", alignItems: "start" }} className="lg:grid-cols-2">
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(140,50%,48%)", marginBottom: "1rem" }}>
                  Signal Sources
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, marginBottom: "1.25rem" }}>
                  Public data woven into every property model.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "46ch" }}>
                  Terra connects to authoritative public data sources — PLUTO, FEMA, Census, and public court records — and weaves that context into each property's twin. No manual data collection. No stale spreadsheets.
                </p>
              </m.div>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.08 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {SIGNAL_SOURCES.map((source, i) => (
                    <div key={i} style={{ padding: "1rem 1.25rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                        <Database size={11} color="hsl(140,50%,48%)" />
                        <p style={{ fontSize: "12px", fontWeight: 600, color: "hsl(38,12%,82%)" }}>{source.label}</p>
                      </div>
                      <p style={{ fontSize: "12px", lineHeight: 1.6, color: "hsl(214,7%,52%)" }}>{source.detail}</p>
                    </div>
                  ))}
                </div>
              </m.div>
            </div>
          </div>
        </section>

        {/* Trust + CTA */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(140,50%,48%)", marginBottom: "1rem" }}>
                Trust Controls
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "2.5rem" }}>
                Governed from signal to LP-ready output.
              </h2>
            </m.div>
            <div style={{ display: "grid", gap: "0.75rem" }} className="lg:grid-cols-2">
              {TRUST_CONTROLS.map((control, i) => (
                <m.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.06 }} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "1rem 1.25rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
                  <Lock size={13} color="hsl(140,50%,48%)" style={{ marginTop: "2px", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "hsl(214,7%,64%)" }}>{control}</span>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }} style={{ borderRadius: "1rem", padding: "clamp(2.5rem,5vw,4rem)", gap: "2.5rem", alignItems: "center", background: "hsla(140,50%,38%,0.05)", border: "1px solid hsla(140,50%,38%,0.16)" }} className="szl-grid-cta">
              <div>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, marginBottom: "0.875rem" }}>
                  Ready to put a command layer on your real estate operations?
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "48ch" }}>
                  We work with operators and investors to instrument Terra against their actual portfolio — real properties, real signals, real diligence workflows — in a focused design partner engagement.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flexShrink: 0 }}>
                <Link href="/contact" className="szl-btn-primary">Request controlled access <ArrowRight size={14} /></Link>
                <Link href="/demo" className="szl-btn-secondary" style={{ textAlign: "center" }}>See the flagship workflow</Link>
              </div>
            </m.div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
