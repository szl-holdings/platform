import { m } from "framer-motion";
import { Link } from "wouter";
import { Building2, ArrowRight, Layers, Shield, Target, Globe, TrendingUp, Users } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const packs = [
  { name: "Lyte", role: "Business observability — surfaces signals, routes action, verifies follow-through", color: "hsl(192,72%,48%)", href: "/lyte" },
  { name: "Alloy", role: "Execution fabric — workflow orchestration, connector mesh, governance layer", color: "hsl(258,55%,68%)", href: "/alloy-fabric" },
  { name: "PRISM Counsel", role: "Legal matter observability — deadlines, pressure, proof chain, export safety", color: "hsl(38,72%,58%)", href: "/solutions/prism-counsel" },
  { name: "Terra", role: "Real estate intelligence — property twins, diligence, distress, readiness scoring", color: "hsl(140,50%,48%)", href: "/solutions/terra" },
  { name: "Vessels", role: "Maritime intelligence — voyage twins, route risk, port congestion, compliance", color: "hsl(206,72%,52%)", href: "/solutions/vessels" },
  { name: "Aegis", role: "Security & defense — threat twins, exposure prioritization, governance response", color: "hsl(222,60%,62%)", href: "/solutions/aegis" },
];

export default function InvestorsOverviewPage() {
  usePageMeta({
    title: "Investor Overview — SZL Holdings",
    description: "SZL Holdings company overview for investors and capital partners — category creation, shared architecture, six verticals, and operational proof.",
    canonical: "https://szlholdings.com/investors/overview",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        <section className="szl-grid-texture szl-depth-glow-gold" style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)", borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.875rem", borderRadius: "99px", border: "1px solid hsla(38,72%,58%,0.25)", background: "hsla(38,72%,58%,0.08)", marginBottom: "1.75rem" }}>
                <Building2 size={13} color="hsl(38,72%,58%)" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "hsl(38,72%,58%)" }}>Investor Overview</span>
              </div>
              <h1 style={{ fontSize: "clamp(2.25rem,5vw,3.75rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.06, maxWidth: "22ch", marginBottom: "1.5rem" }}>
                One architecture. Six verticals. Operational proof first.
              </h1>
              <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "54ch", marginBottom: "2.25rem" }}>
                SZL Holdings is building the business observability category — software that connects
                signal detection, action routing, and outcome verification into a single accountable
                workflow. Lyte is the product. Alloy is the engine. Vertical packs extend the same
                architecture into specific operating domains.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link href="/demo" className="szl-btn-primary">See the live product <ArrowRight size={15} /></Link>
                <Link href="/investors/architecture" className="szl-btn-secondary">Architecture deep dive</Link>
              </div>
            </m.div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(38,72%,58%)", marginBottom: "1rem" }}>Investment Thesis</p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                The thesis
              </h2>
            </m.div>
            <div className="szl-grid-3">
              {[
                { icon: Target, label: "Category creation", body: "Business observability is an emerging category. Dashboards show what happened. Observability shows what needs to happen next — and verifies that it did.", color: "hsl(38,72%,58%)" },
                { icon: Layers, label: "Shared architecture", body: "Every vertical pack shares the same Alloy execution fabric, Model Mesh, GraphQL control plane, and audit infrastructure. Build once, deploy into any operating domain.", color: "hsl(258,55%,68%)" },
                { icon: Shield, label: "Trust as moat", body: "Trust is not a feature — it is the product boundary. Source grounding, approval governance, proof chains, and export safety create defensible differentiation.", color: "hsl(206,72%,52%)" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <m.div key={item.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.38, delay: i * 0.06 }} className="szl-card" style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}>
                    <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: `${item.color}15`, border: `1px solid ${item.color}30`, borderRadius: "0.4375rem", marginBottom: "1rem" }}>
                      <Icon size={16} color={item.color} />
                    </div>
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.625rem" }}>{item.label}</h3>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{item.body}</p>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(192,72%,48%)", marginBottom: "1rem" }}>Portfolio</p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "0.75rem" }}>
                Portfolio map
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.65, color: "hsl(214,7%,55%)", marginBottom: "2.5rem" }}>Six products, one shared execution fabric, one governance model.</p>
            </m.div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {packs.map((p, i) => (
                <m.div key={p.name} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.05 }}>
                  <Link href={p.href} style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="szl-card" style={{ borderRadius: "0.75rem", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", transition: "border-color 0.2s" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                        <div>
                          <span style={{ fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em" }}>{p.name}</span>
                          <p style={{ fontSize: "0.8125rem", lineHeight: 1.55, color: "hsl(214,7%,55%)", marginTop: "0.125rem" }}>{p.role}</p>
                        </div>
                      </div>
                      <ArrowRight size={16} color="hsl(214,7%,35%)" />
                    </div>
                  </Link>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(145,62%,46%)", marginBottom: "1rem" }}>Status</p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "2.5rem" }}>
                Stage and status
              </h2>
            </m.div>
            <div className="szl-grid-2">
              {[
                { label: "Current stage", body: "Design-partner stage. Working directly with early teams to prove the workflow instrumentation thesis in real operating environments before scaling." },
                { label: "GTM approach", body: "Founder-led sales into one vertical (legal operations via PRISM Counsel), then expand horizontally through the shared architecture into adjacent verticals." },
              ].map((item, i) => (
                <m.div key={item.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.38, delay: i * 0.06 }} className="szl-card" style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.75rem" }}>{item.label}</h3>
                  <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{item.body}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(38,72%,58%)", marginBottom: "1rem" }}>Explore</p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "2.5rem" }}>
                Explore further
              </h2>
            </m.div>
            <div className="szl-grid-4">
              {[
                { label: "Architecture", href: "/investors/architecture", icon: Layers, color: "hsl(258,55%,68%)" },
                { label: "Moat & Defensibility", href: "/investors/moat", icon: Shield, color: "hsl(206,72%,52%)" },
                { label: "Trust Center", href: "/trust", icon: Shield, color: "hsl(145,62%,46%)" },
                { label: "Founder", href: "/investors/founder", icon: Users, color: "hsl(38,72%,58%)" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <m.div key={item.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.05 }}>
                    <Link href={item.href} style={{ textDecoration: "none", color: "inherit" }}>
                      <div className="szl-card" style={{ borderRadius: "0.75rem", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", transition: "border-color 0.2s" }}>
                        <Icon size={16} color={item.color} />
                        <span style={{ fontSize: "0.9375rem", fontWeight: 500 }}>{item.label}</span>
                      </div>
                    </Link>
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
