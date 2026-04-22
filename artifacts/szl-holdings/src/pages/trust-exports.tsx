import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Download, FileCheck2, Lock, Eye, Hash, Clock, ShieldCheck, ArrowDown } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const EXPORT_CONTROLS = [
  {
    icon: FileCheck2,
    title: "Proof chain attached",
    body: "Every exported document carries a proof chain — a structured record of the sources, review events, and approval actions that produced it. Recipients can verify provenance without accessing the platform.",
  },
  {
    icon: Lock,
    title: "Privilege screening",
    body: "Before any export is generated, the platform scans for privilege-flagged content — internal strategy notes, attorney work product, or confidential markings — and blocks export until cleared by an authorized reviewer.",
  },
  {
    icon: Eye,
    title: "Review Before Send surface",
    body: "Every export passes through the Review Before Send surface where unsupported claims, contradictions, and privilege risks are surfaced for human inspection. Nothing leaves until a named reviewer signs off.",
  },
  {
    icon: Hash,
    title: "Immutable export record",
    body: "Each export event is recorded with a hash of the exported content, the approving user, timestamp, recipient context, and the exact version of every source document included.",
  },
  {
    icon: Clock,
    title: "Post-export access audit",
    body: "Post-export access is tracked: who downloaded, when, from which IP, and how many times. Access patterns that deviate from expected behavior surface as alerts to the tenant admin.",
  },
  {
    icon: ShieldCheck,
    title: "Format governance",
    body: "Exports are generated in controlled formats (Word, PDF) with metadata stripped, watermarks applied where configured, version headers embedded, and AI-generated content clearly labeled.",
  },
];

const EXPORT_FLOW = [
  { step: "01", label: "Review triggered", desc: "Export request initiated by user. Platform immediately begins pre-export review pipeline.", color: "var(--color-lyte-light)" },
  { step: "02", label: "Sources verified", desc: "Every source document referenced in the export is version-locked and verified as accessible to the requesting tenant.", color: "hsl(258,55%,68%)" },
  { step: "03", label: "Privilege screened", desc: "Content is scanned for privilege flags, confidential markings, and attorney work product. Blocked if flagged pending clearance.", color: "hsl(40,90%,54%)" },
  { step: "04", label: "Claims reviewed", desc: "AI-generated content within the export is surfaced in the Review Before Send surface with supporting sources and confidence scores.", color: "hsl(25,90%,55%)" },
  { step: "05", label: "Human approved", desc: "Named reviewer signs off on the export package. Rationale is recorded. The approver's identity is included in the proof chain.", color: "var(--color-alloy-light)" },
  { step: "06", label: "Export + audit", desc: "Document is generated, proof chain attached, and export event permanently recorded. Post-export access tracking begins.", color: "hsl(145,62%,46%)" },
];

const WRITE_BACK_CONTROLS = [
  { label: "Scoped write permissions", body: "Write-back connectors operate under the minimum permissions required for the specific action. No connector has blanket write access." },
  { label: "Action-scoped execution", body: "When Alloy executes a write-back, it operates only within the parameters approved by the human review. The scope cannot expand post-approval." },
  { label: "Before/after state capture", body: "Connector logs capture the state of the external system before and after write-back execution, providing a complete change record." },
  { label: "Rollback documentation", body: "For reversible write-back operations, the rollback procedure is documented in the audit record before execution begins." },
];

export default function TrustExportsPage() {
  const __pageMeta = usePageMeta({
    title: "Exports — Trust Center · SZL Holdings",
    description: "Export model, write-back controls, proof chain, and document generation governance for KORA + FORGE.",
    canonical: "https://szlholdings.com/trust/exports",
  });

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
        <SiteNav />
        <main id="main-content" >
  
          <section className="szl-grid-texture" style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)", borderBottom: "1px solid var(--color-szl-border)", background: "radial-gradient(ellipse at 50% 0%, hsla(210,80%,60%,0.04) 0%, transparent 60%)" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.75rem" }}>
                  <Link href="/trust" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", textDecoration: "none" }}>Trust Center</Link>
                  <span style={{ color: "var(--color-szl-text-faint)" }}>/</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(210,80%,60%)" }}>Exports</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                  <div style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(210,80%,60%,0.08)", border: "1px solid hsla(210,80%,60%,0.20)", borderRadius: "0.5625rem" }}>
                    <Download size={20} color="hsl(210,80%,60%)" />
                  </div>
                  <h1 style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)", fontWeight: 600, letterSpacing: "-0.028em", lineHeight: 1.08 }}>Export Controls</h1>
                </div>
                <p style={{ fontSize: "clamp(1rem,1.8vw,1.0625rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "52ch" }}>
                  The most consequential moment in any workflow is when a document crosses from internal
                  platform to external recipient. SZL treats every export as a governed event — source-verified,
                  privilege-screened, human-approved, proof-chained, and permanently recorded.
                </p>
              </m.div>
            </div>
          </section>
  
          {/* Export flow */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(210,80%,60%)", marginBottom: "1rem" }}>Export pipeline</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                  Six governed stages from request to delivery.
                </h2>
              </m.div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {EXPORT_FLOW.map((stage, i) => (
                  <m.div
                    key={stage.step}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.42, delay: i * 0.07 }}
                  >
                    <div className="szl-card" style={{ borderRadius: "0.75rem", padding: "clamp(1.25rem,2.5vw,1.75rem)", display: "grid", gridTemplateColumns: "160px 1fr", gap: "clamp(1.5rem,3vw,2.5rem)", alignItems: "center", borderLeft: `3px solid ${stage.color}` }}>
                      <div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.08em", color: stage.color, marginBottom: "0.25rem" }}>{stage.step}</div>
                        <div style={{ fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.015em", color: "hsl(38,8%,92%)" }}>{stage.label}</div>
                      </div>
                      <p style={{ fontSize: "0.9rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{stage.desc}</p>
                    </div>
                    {i < EXPORT_FLOW.length - 1 && (
                      <div style={{ display: "flex", justifyContent: "flex-start", padding: "0.5rem 0 0.5rem 1.5rem" }}>
                        <ArrowDown size={16} color="var(--color-szl-text-faint)" />
                      </div>
                    )}
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          {/* Export controls grid */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(210,80%,60%)", marginBottom: "1rem" }}>Governance controls</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                  What every export passes through.
                </h2>
              </m.div>
              <div className="szl-grid-2">
                {EXPORT_CONTROLS.map((c, i) => {
                  const Icon = c.icon;
                  return (
                    <m.div
                      key={c.title}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.38, delay: i * 0.06 }}
                      className="szl-card"
                      style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)", display: "flex", gap: "1.25rem", alignItems: "flex-start" }}
                    >
                      <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(210,80%,60%,0.08)", border: "1px solid hsla(210,80%,60%,0.20)", borderRadius: "0.4375rem", flexShrink: 0, marginTop: "1px" }}>
                        <Icon size={16} color="hsl(210,80%,60%)" />
                      </div>
                      <div>
                        <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em", marginBottom: "0.625rem", lineHeight: 1.4 }}>{c.title}</h3>
                        <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{c.body}</p>
                      </div>
                    </m.div>
                  );
                })}
              </div>
            </div>
          </section>
  
          {/* Write-back controls */}
          <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(210,80%,60%)", marginBottom: "1rem" }}>Write-back model</p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                  Controls on actions that modify external systems.
                </h2>
              </m.div>
              <div className="szl-grid-2">
                {WRITE_BACK_CONTROLS.map((item, i) => (
                  <m.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.38, delay: i * 0.07 }}
                    className="szl-card"
                    style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}
                  >
                    <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.012em", marginBottom: "0.625rem", color: "hsl(38,8%,88%)" }}>{item.label}</h3>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{item.body}</p>
                  </m.div>
                ))}
              </div>
            </div>
          </section>
  
          <section style={{ padding: "var(--space-section-sm) 0" }}>
            <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link href="/trust/approvals" className="szl-btn-secondary">Approval model →</Link>
                <Link href="/trust/ai" className="szl-btn-secondary">AI policy →</Link>
                <Link href="/contact" className="szl-btn-ghost">Request export controls review <ArrowRight size={13} /></Link>
              </div>
            </div>
          </section>
  
        </main>
        <SiteFooter />
      </div>
        </>
  );
}
