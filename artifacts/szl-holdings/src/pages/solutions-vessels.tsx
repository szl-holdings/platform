import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Ship, Map, BarChart3, FileText, AlertOctagon, Anchor } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const CAPABILITIES = [
  { icon: Map, title: "Fleet Position & Status", body: "Real-time and near-real-time fleet visibility across all your vessels — position, heading, speed, and operational status without tab-switching between systems." },
  { icon: BarChart3, title: "Voyage Performance", body: "Fuel consumption, speed variance, schedule adherence, and cargo milestones — all surfaced as signals when performance deviates from plan." },
  { icon: AlertOctagon, title: "Exception Detection", body: "Vessels surfaces operational exceptions — port delays, weather reroutes, cargo holds, and crew incidents — before they cascade into commercial damage." },
  { icon: FileText, title: "Regulatory Audit Trail", body: "Every maritime operation leaves a compliance footprint. Vessels captures it automatically with full attribution for cargo, crew, customs, and port operations." },
  { icon: Anchor, title: "Port Operations Workflow", body: "Pre-arrival checklists, berth scheduling, agent coordination, and customs workflows — routed through Alloy with approval gates and follow-through verification." },
  { icon: Ship, title: "Fleet Intelligence Dashboard", body: "One command surface for commercial, operations, and chartering teams. Signal-first, not report-first. The right alert at the right moment." },
];

export default function SolutionsVesselsPage() {
  usePageMeta({
    title: "Vessels — Maritime Intelligence · SZL Holdings",
    description: "Fleet command, AIS telemetry, sanctions screening, dark vessel detection, exception-based workflows. Vessels is the maritime domain pack — built on the same governance infrastructure as every SZL product.",
    canonical: "https://szlholdings.com/solutions/vessels",
    ogImage: "https://szlholdings.com/og/og-vessels.jpg",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">
        <section className="szl-grid-texture" style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)", borderBottom: "1px solid var(--color-szl-border)", background: "radial-gradient(ellipse at 50% 0%, hsla(206,72%,40%,0.06) 0%, transparent 60%)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.75rem" }}>
                <Link href="/solutions" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", textDecoration: "none" }}>Solutions</Link>
                <span style={{ color: "var(--color-szl-text-faint)" }}>/</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-vessels)", opacity: 0.9 }}>Vessels</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.75rem" }}>
                <div style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-vessels-muted)", border: "1px solid hsla(206,72%,40%,0.20)", borderRadius: "0.5625rem" }}>
                  <Ship size={20} color="var(--color-vessels)" />
                </div>
                <div>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-vessels)", opacity: 0.8 }}>Maritime Intelligence</p>
                  <h1 style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)", fontWeight: 600, letterSpacing: "-0.028em", lineHeight: 1.08 }}>Vessels</h1>
                </div>
              </div>
              <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "52ch", marginBottom: "2.25rem" }}>
                Business observability for assets underway. Fleet visibility, voyage performance,
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

        <section style={{ padding: "var(--space-section-md) 0" }}>
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
      </main>
      <SiteFooter />
    </div>
  );
}
