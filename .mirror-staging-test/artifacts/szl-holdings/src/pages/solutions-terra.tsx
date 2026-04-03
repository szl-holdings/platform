import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Building2, BarChart3, Map, FileText, AlertOctagon, Workflow } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const CAPABILITIES = [
  { icon: AlertOctagon, title: "Distress Property Detection", body: "Lyte monitors market signals, tax records, foreclosure filings, and price anomalies to surface distressed opportunities before they're widely visible." },
  { icon: BarChart3, title: "Deal Pipeline Command", body: "Every active deal with its current stage, ownership, pending tasks, and approval requirements — in one command view instead of a spreadsheet." },
  { icon: Map, title: "Market Signal Monitoring", body: "Terra watches the signals that matter to your acquisition thesis — cap rate compression, permit activity, absorption rates — and surfaces deviations." },
  { icon: Workflow, title: "Broker Workflow Routing", body: "Alloy routes acquisition tasks, NDA workflows, due diligence requests, and closing steps to the right person with the right context and deadline." },
  { icon: FileText, title: "Acquisition Audit Trail", body: "Every decision in the acquisition process — from initial sourcing to closing — is logged with attribution and rationale for LP and compliance review." },
  { icon: Building2, title: "Portfolio Risk Dashboard", body: "Surface performance anomalies, lease expirations, deferred maintenance signals, and occupancy drift across your portfolio before they compound." },
];

export default function SolutionsTerraPage() {
  usePageMeta({
    title: "Terra — Real Estate Intelligence · SZL Holdings",
    description: "Terra extends Lyte + Alloy into real estate — distress tracking, deal pipeline command, and market signal monitoring for real estate operators and investors.",
    canonical: "https://szlholdings.com/solutions/terra",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">
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
                  <h1 style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)", fontWeight: 600, letterSpacing: "-0.028em", lineHeight: 1.08 }}>Terra</h1>
                </div>
              </div>
              <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "52ch", marginBottom: "2.25rem" }}>
                A data-rich, execution-poor industry finally getting a command layer. Terra
                applies Lyte + Alloy to real estate acquisition, portfolio management, and
                deal operations — so operators see the signal and act on it.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link href="/contact" className="szl-btn-primary">Request a walkthrough <ArrowRight size={15} /></Link>
                <Link href="/solutions" className="szl-btn-secondary">All solutions</Link>
              </div>
            </m.div>
          </div>
        </section>

        <section style={{ padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
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
      </main>
      <SiteFooter />
    </div>
  );
}
