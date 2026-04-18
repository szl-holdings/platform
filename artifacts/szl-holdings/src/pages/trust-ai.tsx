import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Brain, Users, Eye, FileCheck2, AlertTriangle, Workflow, ShieldCheck, Network } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const PRINCIPLES = [
  {
    icon: Users,
    title: "Human-in-the-loop by default",
    body: "Every AI-generated recommendation, draft, or classification requires explicit human approval before it becomes an action. No autonomous execution without operator consent — not configurable away, only configurable tighter.",
  },
  {
    icon: Eye,
    title: "Source-grounded assertions only",
    body: "Every AI output is traceable to the source material that informed it. When a claim cannot be grounded in source, it is flagged as unsupported — never silently presented as fact. Confidence scores are always surfaced.",
  },
  {
    icon: FileCheck2,
    title: "Tiered approval enforcement",
    body: "AI actions are classified into approval tiers matching the action risk level: auto-cleared for low-risk reads, single reviewer for bounded actions, dual approval for external system writes, senior authorization for irreversible actions.",
  },
  {
    icon: AlertTriangle,
    title: "Contradiction and hallucination detection",
    body: "Every generated output passes through contradiction detection and confidence scoring before reaching any review queue. Unsupported claims are surfaced with warnings. Outputs that fail scoring thresholds are blocked and requeued.",
  },
  {
    icon: Workflow,
    title: "Complete decision lineage",
    body: "The full chain from signal detection through AI recommendation to human approval and final action is recorded as an immutable audit trail — not just the outcome. The lineage is a first-class exportable output.",
  },
  {
    icon: ShieldCheck,
    title: "Model isolation and tenant boundaries",
    body: "Tenant data is never used for model training. Model selection, prompt templates, and inference boundaries are governed through the governed inference layer. Each tenant's context is strictly scoped before inference.",
  },
];

const MODEL_MESH_ROWS = [
  { layer: "Model selection", control: "Per-tenant, per-task configuration", note: "Different tasks can use different models. Tenant admins can restrict model access to approved providers only." },
  { layer: "Context scoping", control: "Anonymized and minimized before inference", note: "Raw client data, PII, privileged communications, and credentials are never sent to model providers." },
  { layer: "Prompt governance", control: "Versioned prompt templates with audit trail", note: "Prompt changes are versioned. Prompt override attempts outside template bounds are logged." },
  { layer: "Output validation", control: "Confidence scoring + contradiction detection", note: "Outputs below confidence threshold are flagged. Contradictions with source documents are blocked." },
  { layer: "Training isolation", control: "Zero training on client data", note: "No tenant data, interaction history, or document content is used to improve model behavior." },
  { layer: "Provider governance", control: "Commercially licensed APIs only", note: "No open-weight models with unclear training provenance. Provider selection is auditable." },
];

const HARD_BOUNDARIES = [
  "AI never sends external communications without explicit human sign-off",
  "AI never modifies financial records, legal filings, or compliance artifacts autonomously",
  "AI never accesses data outside the scoped tenant boundary — ever",
  "AI recommendations always include confidence scores and source references",
  "AI-generated content is labeled as generated — never presented as human-authored",
  "Model providers receive only anonymized, scoped context — never raw client data",
  "Emergency AI-initiated actions require post-hoc mandatory review regardless of urgency",
];

export default function TrustAIPage() {
  usePageMeta({
    title: "AI Policy — Trust Center · SZL Holdings",
    description: "AI usage model, source-grounding, governed inference layer, and generated-vs-source controls for Lyte + Alloy.",
    canonical: "https://szlholdings.com/trust/ai",
  });

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        <section className="szl-grid-texture" style={{ paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(4rem,8vw,6rem)", borderBottom: "1px solid var(--color-szl-border)", background: "radial-gradient(ellipse at 50% 0%, hsla(258,55%,68%,0.04) 0%, transparent 60%)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.75rem" }}>
                <Link href="/trust" style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", textDecoration: "none" }}>Trust Center</Link>
                <span style={{ color: "var(--color-szl-text-faint)" }}>/</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(258,55%,68%)" }}>AI Policy</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <div style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(258,55%,68%,0.08)", border: "1px solid hsla(258,55%,68%,0.20)", borderRadius: "0.5625rem" }}>
                  <Brain size={20} color="hsl(258,55%,68%)" />
                </div>
                <h1 style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)", fontWeight: 600, letterSpacing: "-0.028em", lineHeight: 1.08 }}>AI Policy</h1>
              </div>
              <p style={{ fontSize: "clamp(1rem,1.8vw,1.0625rem)", lineHeight: 1.72, color: "hsl(214,7%,64%)", maxWidth: "52ch" }}>
                Every AI capability in Lyte + Alloy — from Copilot recommendations to signal classification
                to document generation — operates within a governance framework that enforces source grounding,
                human approval, complete decision lineage, and hard boundaries on autonomous action.
              </p>
            </m.div>
          </div>
        </section>

        {/* Core principles */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(258,55%,68%)", marginBottom: "1rem" }}>Six principles</p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                How AI is governed across every surface.
              </h2>
            </m.div>
            <div className="szl-grid-2">
              {PRINCIPLES.map((p, i) => {
                const Icon = p.icon;
                return (
                  <m.div
                    key={p.title}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.38, delay: i * 0.06 }}
                    className="szl-card"
                    style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)", display: "flex", gap: "1.25rem", alignItems: "flex-start" }}
                  >
                    <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(258,55%,68%,0.08)", border: "1px solid hsla(258,55%,68%,0.20)", borderRadius: "0.4375rem", flexShrink: 0, marginTop: "1px" }}>
                      <Icon size={16} color="hsl(258,55%,68%)" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em", marginBottom: "0.625rem", lineHeight: 1.4 }}>{p.title}</h3>
                      <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: "hsl(214,7%,60%)" }}>{p.body}</p>
                    </div>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Hard boundaries */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(258,55%,68%)", marginBottom: "1rem" }}>Hard boundaries</p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "0.875rem" }}>
                Operating boundaries. Applied to every tenant, every pack, every environment.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.68, color: "hsl(214,7%,58%)", maxWidth: "60ch", marginBottom: "2.5rem" }}>
                These boundaries are policy commitments enforced through the Alloy execution layer
                and Covenant Policy Engine — not user-facing toggles. Where a boundary is enforced
                structurally (tenant scoping, source attribution) versus by approval-gated workflow
                (external sends, financial writes), the difference is documented in the Architecture page.
              </p>
            </m.div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {HARD_BOUNDARIES.map((b, i) => (
                <m.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className="szl-card"
                  style={{ borderRadius: "0.75rem", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  <ShieldCheck size={16} color="hsl(258,55%,68%)" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "hsl(38,8%,80%)" }}>{b}</span>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* Model mesh governance */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <Network size={14} color="hsl(258,55%,68%)" />
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(258,55%,68%)" }}>Governed Inference</p>
              </div>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                How model selection and inference is governed.
              </h2>
            </m.div>
            <div className="szl-card" style={{ borderRadius: "0.875rem", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1.5fr", padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--color-szl-border)", background: "hsla(214,12%,8%,0.60)" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-szl-text-muted)" }}>Layer</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-szl-text-muted)" }}>Control</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-szl-text-muted)" }}>Detail</span>
              </div>
              {MODEL_MESH_ROWS.map((row, i) => (
                <m.div
                  key={row.layer}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.2fr 1.5fr",
                    padding: "0.875rem 1.25rem",
                    borderBottom: i < MODEL_MESH_ROWS.length - 1 ? "1px solid var(--color-szl-border)" : "none",
                    gap: "1rem",
                    alignItems: "start",
                  }}
                >
                  <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "hsl(38,8%,82%)" }}>{row.layer}</span>
                  <span style={{ fontSize: "0.875rem", color: "hsl(258,55%,72%)", fontWeight: 500 }}>{row.control}</span>
                  <span style={{ fontSize: "0.8125rem", color: "hsl(214,7%,55%)", lineHeight: 1.55 }}>{row.note}</span>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* Generated vs source separation */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(258,55%,68%)", marginBottom: "1rem" }}>Generated vs. source</p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "3rem" }}>
                AI output is always distinguishable from source of record.
              </h2>
            </m.div>
            <div className="szl-grid-2" style={{ gap: "1.25rem" }}>
              <m.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.38 }} className="szl-card" style={{ borderRadius: "0.875rem", padding: "var(--space-card-pad)", borderTop: "2px solid hsl(258,55%,68%)" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, color: "hsl(258,55%,68%)", marginBottom: "0.875rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>AI-Generated content</div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {["Always carries a generated label visible in the UI", "Includes confidence score and source reference list", "Blocked from export without human review", "Cannot overwrite source-of-record data directly", "Audit trail marks it as AI output with model version"].map(item => (
                    <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                      <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "hsl(258,55%,68%)", flexShrink: 0, marginTop: "7px" }} />
                      <span style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "hsl(214,7%,60%)" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </m.div>
              <m.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.38, delay: 0.07 }} className="szl-card" style={{ borderRadius: "0.875rem", padding: "var(--space-card-pad)", borderTop: "2px solid hsl(145,62%,46%)" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, color: "hsl(145,62%,46%)", marginBottom: "0.875rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Source of record</div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {["Stored with version history and attribution", "Only modifiable through approved write actions", "Audit trail records every change with actor and timestamp", "Immutable at rest — modifications create new versions", "Never overwritten by AI output without explicit approval"].map(item => (
                    <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                      <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "hsl(145,62%,46%)", flexShrink: 0, marginTop: "7px" }} />
                      <span style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "hsl(214,7%,60%)" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </m.div>
            </div>
          </div>
        </section>

        <section style={{ padding: "var(--space-section-sm) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              <Link href="/trust/governance" className="szl-btn-secondary">AI Governance →</Link>
              <Link href="/trust/approvals" className="szl-btn-secondary">Approval model →</Link>
              <Link href="/contact" className="szl-btn-ghost">Request AI governance review <ArrowRight size={13} /></Link>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
