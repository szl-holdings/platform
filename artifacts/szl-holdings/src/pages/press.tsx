import { m } from "framer-motion";
import { Link } from "wouter";
import { FileText, ArrowRight, Mail } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const PRODUCT_ONELINERS = [
  {
    product: "SZL Holdings",
    oneliner: "Governed decision infrastructure — the structural layer between signal detection and action execution, with AI provenance, policy gates, and immutable proof on every consequential decision.",
  },
  {
    product: "KORA",
    oneliner: "The command layer for governed organizations — surfaces execution risk, approval latency, and ownership gaps across connected systems.",
  },
  {
    product: "FORGE",
    oneliner: "The action fabric that turns operational signals into structured, human-approved decisions — with a complete audit trail.",
  },
  {
    product: "Counsel",
    oneliner: "Legal operations observability — matter intelligence, deadline tracking, approval governance, and export safety for legal teams.",
  },
  {
    product: "SEXTANT",
    oneliner: "Maritime intelligence — voyage twins, AIS monitoring, route risk, port congestion, and sanctions compliance for fleet operators.",
  },
  {
    product: "PARAGON",
    oneliner: "Security and defense observability — threat twins, incident workflows, and exposure prioritization for complex operating environments.",
  },
  {
    product: "DOMAINE",
    oneliner: "Real estate intelligence — property twins, diligence workflows, and distress scoring for institutional operators.",
  },
];

const BRAND_GUIDELINES = [
  "Use the full company name 'SZL Holdings' on first reference. Subsequent references may use 'SZL'.",
  "Product names are capitalized: Lyte, Alloy, Counsel, Vessels, Aegis, Terra.",
  "Do not use 'SZL Holdings Inc.' — the legal entity name is not for press use.",
  "Do not modify logo colors, proportions, or add elements to the logo.",
  "Dark background logos are preferred on dark or colored backgrounds. Light background logos on white.",
  "Minimum logo size: 100px width in digital use. Allow clear space equal to the logo height on all sides.",
];

export default function PressPage() {
  const __pageMeta = usePageMeta({
    title: "Press — SZL Holdings",
    description: "SZL Holdings press resources — company boilerplate, founder bio, product one-liners, brand guidance, and media contact.",
    canonical: "https://szlholdings.com/press",
  });

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
        <SiteNav />
        <main id="main-content" >
  
          <section className="szl-grid-texture" style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)", borderBottom: "1px solid var(--color-szl-border)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.3rem 0.875rem", borderRadius: "99px", border: "1px solid var(--color-szl-border-hover)", background: "hsla(0,0%,100%,0.04)", marginBottom: "1.75rem" }}>
                  <FileText size={13} color="var(--color-szl-text-muted)" />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-szl-text-secondary)" }}>Press</span>
                </div>
                <h1 style={{ fontSize: "clamp(2.25rem,5vw,3.75rem)", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.06, maxWidth: "22ch", marginBottom: "1.5rem" }}>Press resources.</h1>
                <p style={{ fontSize: "clamp(1rem,1.8vw,1.125rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "52ch" }}>
                  Company boilerplate, founder bio, product descriptions, logo guidance, and media
                  contact. For inquiries not covered here, reach out directly.
                </p>
              </m.div>
            </div>
          </section>
  
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Company boilerplate</p>
                <h2 style={{ fontSize: "clamp(1.375rem,3vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.020em", lineHeight: 1.2, marginBottom: "2rem" }}>For media use</h2>
              </m.div>
              <div className="szl-card" style={{ borderRadius: "0.875rem", padding: "var(--space-card-pad)" }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Short (1 sentence)</p>
                <p style={{ fontSize: "1rem", lineHeight: 1.72, color: "hsl(38,8%,82%)", marginBottom: "2rem", paddingBottom: "2rem", borderBottom: "1px solid var(--color-szl-border)" }}>
                  SZL Holdings builds governed decision infrastructure — the structural layer between signal detection and action execution, with a nine-step governance loop, full AI provenance, and an immutable proof chain on every consequential enterprise decision.
                </p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Full (3 sentences)</p>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "hsl(38,8%,78%)" }}>
                  SZL Holdings builds governed decision infrastructure — the structural layer between signal detection and action execution. The platform enforces a nine-step governance loop (Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning) across every domain pack: Vessels for maritime intelligence, Aegis for security and defense, Terra for real estate, Counsel for legal operations, and Carlota Jo for premium advisory. SZL is led by founder Stephen Lutar and is in active design-partner engagement with enterprise teams ahead of a Series A raise in 2026.
                </p>
              </div>
            </div>
          </section>
  
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Founder</p>
                <h2 style={{ fontSize: "clamp(1.375rem,3vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.020em", lineHeight: 1.2, marginBottom: "2rem" }}>Stephen Lutar</h2>
              </m.div>
              <div className="szl-card" style={{ borderRadius: "0.875rem", padding: "var(--space-card-pad)" }}>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "hsl(214,7%,62%)", marginBottom: "1.5rem" }}>
                  Stephen Lutar is the founder of SZL Holdings and the architect of the KORA + FORGE platform. He is a builder and systems thinker with a background in complex operational environments. His approach is operator-first: the company is built by people who understand the execution environments they serve. Stephen is based in New York.
                </p>
                <Link href="/founder" className="szl-btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
                  Full founder profile <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </section>
  
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Product one-liners</p>
                <h2 style={{ fontSize: "clamp(1.375rem,3vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.020em", lineHeight: 1.2, marginBottom: "2rem" }}>For each product and brand</h2>
              </m.div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {PRODUCT_ONELINERS.map((item, i) => (
                  <m.div key={item.product} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.04 }} className="szl-card" style={{ borderRadius: "0.75rem", padding: "1.125rem 1.375rem", display: "grid", gridTemplateColumns: "9rem 1fr", gap: "1.5rem", alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem", fontWeight: 600, color: "hsl(38,8%,88%)" }}>{item.product}</span>
                    <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "hsl(214,7%,60%)" }}>{item.oneliner}</p>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Brand usage</p>
                <h2 style={{ fontSize: "clamp(1.375rem,3vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.020em", lineHeight: 1.2, marginBottom: "2rem" }}>When referencing SZL brands</h2>
              </m.div>
              <div className="szl-card" style={{ borderRadius: "0.875rem", padding: "var(--space-card-pad)" }}>
                <ul style={{ display: "flex", flexDirection: "column", gap: "0.625rem", listStyle: "none", padding: 0, margin: 0 }}>
                  {BRAND_GUIDELINES.map((item) => (
                    <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                      <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "var(--color-szl-text-muted)", flexShrink: 0, marginTop: "9px" }} />
                      <span style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "hsl(214,7%,60%)" }}>{item}</span>
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--color-szl-border)" }}>
                  <Link href="/brand" className="szl-btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
                    Full brand guide <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </section>
  
          <section style={{ padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>Media contact</p>
                <h2 style={{ fontSize: "clamp(1.375rem,3vw,1.875rem)", fontWeight: 600, letterSpacing: "-0.020em", lineHeight: 1.2, marginBottom: "1.5rem" }}>Get in touch</h2>
              </m.div>
              <div className="szl-card" style={{ borderRadius: "0.875rem", padding: "var(--space-card-pad)" }}>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.68, color: "hsl(214,7%,60%)", marginBottom: "1.5rem" }}>
                  For press inquiries, interview requests, speaking opportunities, and media partnerships, please reach out directly. We respond to credentialed media inquiries within one business day.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  <a href="mailto:press@szlholdings.com" className="szl-btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
                    <Mail size={14} /> press@szlholdings.com
                  </a>
                  <Link href="/contact" className="szl-btn-ghost">Contact form</Link>
                </div>
              </div>
            </div>
          </section>
  
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
