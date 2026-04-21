import { Link } from "wouter";
import { m, useInView } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight, CheckCircle2, Shield, Users, FileCheck,
  Zap, Ship, Lock, GitBranch, ChevronRight, ArrowUpRight,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { analytics } from "@/lib/analytics";

/* ─── Design tokens (institutional, no inline neon) ───────────────────── */
const BG      = "var(--gi-bg-base)";
const SURFACE = "var(--gi-bg-surface)";
const OVERLAY = "var(--gi-bg-overlay)";
const BORDER  = "var(--gi-border-subtle)";
const BORDER_D = "var(--gi-border-default)";
const TEXT    = "var(--gi-text-primary)";
const TEXT_S  = "var(--gi-text-secondary)";
const TEXT_M  = "var(--gi-text-muted)";
const ACCENT  = "var(--gi-accent-blue)";
const AMBER   = "var(--gi-accent-amber)";
const MONO    = "var(--font-mono)";

/* ─── Motion ────────────────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

/* ─── Content ────────────────────────────────────────────────────────────── */

// Proof strip — verified numbers only (audit 2026-04-21)
const PROOF_STATS = [
  { value: "915",  label: "Database tables",   note: "Drizzle pgTable, verified" },
  { value: "122",  label: "Shared packages",    note: "81 domain + 41 lib" },
  { value: "382",  label: "API route files",    note: "268 route groups" },
  { value: "165",  label: "Schema files",       note: "10 domain areas" },
];

const GOVERNANCE_STEPS = [
  { n: "01", label: "Recommendation", body: "An AI agent proposes an action with source citations and confidence score. No opaque verdicts." },
  { n: "02", label: "Required Approval", body: "Covenant Policy routes the recommendation to the right human approver. The workflow is blocked until approval is granted." },
  { n: "03", label: "Immutable Record", body: "The Proof Chain records the complete trail: recommendation, policy decision, approver, timestamp. Append-only, tamper-resistant." },
  { n: "04", label: "Outcome Measurement", body: "The Outcome Graph links every approved action to its real-world result, calibrating future AI confidence scores." },
];

const TRUST_POINTS = [
  { icon: Lock, title: "Human approval is non-delegatable", body: "Covenant Policy enforces approval gates at the platform layer — not in the UI, not in application code. No shortcut is possible." },
  { icon: FileCheck, title: "Every action leaves a record", body: "The Proof Chain is append-only. Every recommendation, policy decision, and approval is recorded and queryable." },
  { icon: Shield, title: "Tenant isolation by default", body: "Organisation-scoped, deny-by-default access control. No cross-tenant data access without explicit policy." },
  { icon: GitBranch, title: "Audit-ready from the start", body: "The schema, the proof trail, and the policy log are designed for regulatory and board-level review — not retrofitted." },
];

const SECONDARY_CAPABILITIES = [
  "Live vessel position (NOAA public data)",
  "Sanctions screening against OFAC SDN list",
  "Dark vessel anomaly detection",
  "Voyage economics and route intelligence",
  "Alloy approval gates on high-risk actions",
];

/* ─── Section helper ─────────────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "0.6875rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: TEXT_M, marginBottom: "0.75rem" }}>
      {children}
    </p>
  );
}

/* ─── Reusable fade wrapper ─────────────────────────────────────────────── */
function FadeSection({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <m.div ref={ref} initial="hidden" animate={inView ? "show" : "hidden"} style={style}>
      {children}
    </m.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function Landing() {
  usePageMeta({
    title: "SZL Holdings — Governed Operational Intelligence",
    description: "Governed operational intelligence for regulated enterprises. Alloy execution fabric: every AI recommendation requires human confirmation, every action creates an immutable record.",
  });

  return (
    <div style={{ background: BG, color: TEXT, minHeight: "100vh", overflowX: "hidden" }}>
      <a href="#main" className="skip-to-content">Skip to content</a>
      <SiteNav />

      <main id="main">

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section style={{ paddingTop: "clamp(7rem,13vw,10rem)", paddingBottom: "clamp(5rem,9vw,8rem)", paddingLeft: "var(--space-content-x)", paddingRight: "var(--space-content-x)", maxWidth: "72rem", margin: "0 auto" }}>
          <m.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }}>
            <m.p custom={0} variants={fadeUp} style={{ fontSize: "0.6875rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: AMBER, marginBottom: "1.5rem" }}>
              SZL Holdings — Governed Operational Intelligence
            </m.p>

            <m.h1 custom={1} variants={fadeUp} style={{ fontSize: "clamp(2.25rem,5vw,3.75rem)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, color: TEXT, maxWidth: "20ch", marginBottom: "1.75rem" }}>
              One platform. Every AI action requires human approval.
            </m.h1>

            <m.p custom={2} variants={fadeUp} style={{ fontSize: "clamp(1rem,1.5vw,1.1875rem)", color: TEXT_S, maxWidth: "52ch", lineHeight: 1.65, marginBottom: "2.5rem" }}>
              SZL Holdings builds governed operational intelligence for regulated enterprises.
              The Alloy execution fabric routes every AI recommendation through a required human
              approval gate, creates an immutable audit record, and delivers attributable
              operational outcomes — across every domain.
            </m.p>

            <m.div custom={3} variants={fadeUp} style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap", alignItems: "center" }}>
              <Link
                href="/demo"
                onClick={() => analytics.track("cta_click", { location: "hero_primary", label: "Request Demo" })}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.5rem", background: ACCENT, color: "#ffffff", fontWeight: 600, fontSize: "0.9375rem", borderRadius: "var(--radius-md)", textDecoration: "none", transition: "opacity 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                Request a Demo <ArrowRight size={15} />
              </Link>
              <Link
                href="/platform"
                onClick={() => analytics.track("cta_click", { location: "hero_secondary", label: "See the Platform" })}
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.25rem", background: "transparent", color: TEXT_S, fontWeight: 500, fontSize: "0.9375rem", border: `1px solid ${BORDER_D}`, borderRadius: "var(--radius-md)", textDecoration: "none", transition: "border-color 0.15s, color 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = TEXT; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER_D; e.currentTarget.style.color = TEXT_S; }}
              >
                See the Platform <ChevronRight size={15} />
              </Link>
            </m.div>
          </m.div>
        </section>

        {/* ── PROOF STRIP ──────────────────────────────────────────────────── */}
        <section style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
          <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "2rem var(--space-content-x)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(10rem,1fr))", gap: "2rem" }}>
            {PROOF_STATS.map((s, i) => (
              <FadeSection key={s.label}>
                <m.div custom={i} variants={fadeUp} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <span style={{ fontSize: "1.875rem", fontWeight: 700, fontFamily: MONO, color: TEXT, letterSpacing: "-0.03em" }}>{s.value}</span>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: TEXT_S }}>{s.label}</span>
                  <span style={{ fontSize: "0.6875rem", fontFamily: MONO, color: TEXT_M }}>{s.note}</span>
                </m.div>
              </FadeSection>
            ))}
          </div>
        </section>

        {/* ── CORE PLATFORM — ALLOY ────────────────────────────────────────── */}
        <section style={{ padding: "clamp(5rem,9vw,8rem) var(--space-content-x)", maxWidth: "72rem", margin: "0 auto" }}>
          <FadeSection>
            <m.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } }}>
              <SectionLabel>Core Platform — Alloy Execution Fabric</SectionLabel>
              <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 700, letterSpacing: "-0.025em", color: TEXT, maxWidth: "28ch", marginBottom: "1rem", lineHeight: 1.15 }}>
                Every AI recommendation. Required human approval. Immutable record.
              </h2>
              <p style={{ fontSize: "1.0625rem", color: TEXT_S, maxWidth: "52ch", lineHeight: 1.65, marginBottom: "3.5rem" }}>
                Alloy is the execution fabric that sits beneath every SZL domain. It enforces approval gates,
                orchestrates durable multi-step workflows, and writes an immutable proof trail — at the platform
                layer, not the application layer.
              </p>
            </m.div>
          </FadeSection>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(17rem,1fr))", gap: "1.5rem" }}>
            {GOVERNANCE_STEPS.map((step, i) => (
              <FadeSection key={step.n}>
                <m.div
                  custom={i}
                  variants={fadeUp}
                  style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "var(--radius-lg)", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}
                >
                  <span style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: TEXT_M }}>Step {step.n}</span>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, color: TEXT, margin: 0 }}>{step.label}</h3>
                  <p style={{ fontSize: "0.875rem", color: TEXT_S, lineHeight: 1.6, margin: 0 }}>{step.body}</p>
                </m.div>
              </FadeSection>
            ))}
          </div>
        </section>

        {/* ── PRIMARY WEDGE — GOVERNED WORKFLOW ORCHESTRATION ──────────────── */}
        <section style={{ borderTop: `1px solid ${BORDER}`, background: SURFACE, padding: "clamp(5rem,9vw,8rem) var(--space-content-x)" }}>
          <div style={{ maxWidth: "72rem", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
            <FadeSection>
              <m.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } }}>
                <SectionLabel>Primary Platform — Lyte &amp; Command</SectionLabel>
                <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.25rem)", fontWeight: 700, letterSpacing: "-0.025em", color: TEXT, marginBottom: "1rem", lineHeight: 1.2 }}>
                  Governed Workflow Orchestration
                </h2>
                <p style={{ fontSize: "1rem", color: TEXT_S, lineHeight: 1.65, marginBottom: "2rem" }}>
                  Lyte (PRISM) is the operational command surface for enterprise decision teams.
                  It surfaces cross-domain signals, routes AI recommendations through required approval gates,
                  and delivers every outcome to the right actor with a full audit trail.
                  Command (CORTEX) extends the same governance to mobile and cross-domain oversight.
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  {["Signal detection and cross-domain correlation", "AI recommendation with required human approval gate", "Covenant Policy — non-delegatable at the platform layer", "Immutable Proof Chain for every decision", "Outcome measurement and AI calibration"].map(item => (
                    <li key={item} style={{ display: "flex", gap: "0.625rem", alignItems: "flex-start", fontSize: "0.875rem", color: TEXT_S }}>
                      <CheckCircle2 size={15} style={{ color: ACCENT, flexShrink: 0, marginTop: "0.15rem" }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <div style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap" }}>
                  <Link href="/lyte" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.875rem", fontWeight: 600, color: ACCENT, textDecoration: "none" }}>
                    See Lyte <ArrowUpRight size={13} />
                  </Link>
                  <Link href="/command/" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.875rem", fontWeight: 500, color: TEXT_S, textDecoration: "none" }}>
                    Command Portal <ArrowUpRight size={13} />
                  </Link>
                </div>
              </m.div>
            </FadeSection>

            <FadeSection>
              <m.div variants={{ hidden: { opacity: 0, x: 24 }, show: { opacity: 1, x: 0, transition: { duration: 0.5 } } }}
                style={{ background: OVERLAY, border: `1px solid ${BORDER_D}`, borderRadius: "var(--radius-xl)", padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}
              >
                <p style={{ fontSize: "0.6875rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_M, margin: 0 }}>Live approval queue</p>
                {[
                  { action: "Contract renewal — Meridian Shipping", status: "Awaiting approval", risk: "High" },
                  { action: "Sanctions re-screen — 3 vessels", status: "Policy routed", risk: "Critical" },
                  { action: "Budget reallocation Q2", status: "Awaiting approval", risk: "Medium" },
                ].map((item, i) => (
                  <div key={i} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "var(--radius-md)", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                    <div>
                      <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: TEXT, margin: "0 0 0.25rem" }}>{item.action}</p>
                      <p style={{ fontSize: "0.75rem", color: TEXT_M, margin: 0 }}>{item.status}</p>
                    </div>
                    <span style={{ fontSize: "0.6875rem", fontFamily: MONO, fontWeight: 700, color: item.risk === "Critical" ? "var(--gi-accent-red)" : item.risk === "High" ? AMBER : TEXT_M, flexShrink: 0 }}>
                      {item.risk}
                    </span>
                  </div>
                ))}
                <p style={{ fontSize: "0.6875rem", color: TEXT_M, margin: 0 }}>Seeded demonstration data. Every item routes through Alloy approval gates.</p>
              </m.div>
            </FadeSection>
          </div>
        </section>

        {/* ── SECONDARY WEDGE — MARITIME INTELLIGENCE ──────────────────────── */}
        <section style={{ padding: "clamp(5rem,9vw,8rem) var(--space-content-x)", maxWidth: "72rem", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
            <FadeSection>
              <m.div variants={{ hidden: { opacity: 0, x: -24 }, show: { opacity: 1, x: 0, transition: { duration: 0.5 } } }}
                style={{ background: SURFACE, border: `1px solid ${BORDER_D}`, borderRadius: "var(--radius-xl)", padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}
              >
                <p style={{ fontSize: "0.6875rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_M, margin: 0 }}>Vessels — Maritime Intelligence</p>
                {SECONDARY_CAPABILITIES.map((cap, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.625rem", alignItems: "center", padding: "0.625rem 0", borderBottom: i < SECONDARY_CAPABILITIES.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                    <Ship size={13} style={{ color: ACCENT, flexShrink: 0 }} />
                    <span style={{ fontSize: "0.875rem", color: TEXT_S }}>{cap}</span>
                  </div>
                ))}
              </m.div>
            </FadeSection>

            <FadeSection>
              <m.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } }}>
                <SectionLabel>Domain Intelligence — Vessels</SectionLabel>
                <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.25rem)", fontWeight: 700, letterSpacing: "-0.025em", color: TEXT, marginBottom: "1rem", lineHeight: 1.2 }}>
                  Maritime Intelligence
                </h2>
                <p style={{ fontSize: "1rem", color: TEXT_S, lineHeight: 1.65, marginBottom: "2rem" }}>
                  Vessels surfaces real-time fleet position, sanctions risk, and dark vessel anomalies
                  in a single command surface. A single OFAC violation can result in $1M+ in fines.
                  Vessels gives maritime operators, insurers, and compliance officers the intelligence
                  to act before consequence — with every high-risk action routed through Alloy.
                </p>
                <p style={{ fontSize: "0.8125rem", color: TEXT_M, lineHeight: 1.55, marginBottom: "2rem" }}>
                  External data: NOAA, Open-Meteo, GDELT (all public APIs). AIS is simulated.
                  Sanctions data is seeded for demonstration.
                </p>
                <Link href="/solutions/vessels" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.875rem", fontWeight: 600, color: ACCENT, textDecoration: "none" }}>
                  See Vessels <ArrowUpRight size={13} />
                </Link>
              </m.div>
            </FadeSection>
          </div>
        </section>

        {/* ── TRUST ────────────────────────────────────────────────────────── */}
        <section style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, background: SURFACE, padding: "clamp(5rem,9vw,8rem) var(--space-content-x)" }}>
          <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
            <FadeSection>
              <m.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } }} style={{ marginBottom: "3rem" }}>
                <SectionLabel>Trust &amp; Governance</SectionLabel>
                <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 700, letterSpacing: "-0.025em", color: TEXT, maxWidth: "28ch", marginBottom: "1rem", lineHeight: 1.15 }}>
                  Designed for regulated environments from the schema up.
                </h2>
                <p style={{ fontSize: "1.0625rem", color: TEXT_S, maxWidth: "52ch", lineHeight: 1.65 }}>
                  Governance is not a feature layer — it is the platform architecture. Every trust control
                  is enforced at the data model and policy engine level.
                </p>
              </m.div>
            </FadeSection>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(17rem,1fr))", gap: "1.5rem" }}>
              {TRUST_POINTS.map((pt, i) => (
                <FadeSection key={pt.title}>
                  <m.div
                    custom={i}
                    variants={fadeUp}
                    style={{ background: OVERLAY, border: `1px solid ${BORDER}`, borderRadius: "var(--radius-lg)", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}
                  >
                    <pt.icon size={18} style={{ color: ACCENT }} />
                    <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: TEXT, margin: 0 }}>{pt.title}</h3>
                    <p style={{ fontSize: "0.875rem", color: TEXT_S, lineHeight: 1.6, margin: 0 }}>{pt.body}</p>
                  </m.div>
                </FadeSection>
              ))}
            </div>
          </div>
        </section>

        {/* ── ROI ──────────────────────────────────────────────────────────── */}
        <section style={{ padding: "clamp(5rem,9vw,8rem) var(--space-content-x)", maxWidth: "72rem", margin: "0 auto" }}>
          <FadeSection>
            <m.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } }}>
              <SectionLabel>Return on Governance</SectionLabel>
              <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 700, letterSpacing: "-0.025em", color: TEXT, maxWidth: "28ch", marginBottom: "1rem", lineHeight: 1.15 }}>
                Governance is not overhead. It is measurable outcome improvement.
              </h2>
              <p style={{ fontSize: "1.0625rem", color: TEXT_S, maxWidth: "52ch", lineHeight: 1.65, marginBottom: "3rem" }}>
                Every approval gate creates an audit record. Every audit record creates a latency measurement.
                Every latency measurement creates an optimization target. The platform turns compliance
                into a continuous operational improvement loop.
              </p>
            </m.div>
          </FadeSection>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(18rem,1fr))", gap: "1.5rem" }}>
            {[
              { title: "Approval latency reduction", body: "When every decision gate is measured, the path from AI recommendation to human approval becomes a managed, improvable metric — not an unknown." },
              { title: "Regulatory audit cost reduction", body: "An immutable Proof Chain means audit evidence is always ready. No manual log reconstruction. No sprint to gather evidence before an exam." },
              { title: "AI confidence calibration", body: "The Outcome Graph links approved actions to real results. AI agents that are consistently approved get more autonomy. Agents that are overridden get retrained." },
            ].map((item, i) => (
              <FadeSection key={item.title}>
                <m.div
                  custom={i}
                  variants={fadeUp}
                  style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "var(--radius-lg)", padding: "1.5rem" }}
                >
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: TEXT, margin: "0 0 0.625rem" }}>{item.title}</h3>
                  <p style={{ fontSize: "0.875rem", color: TEXT_S, lineHeight: 1.6, margin: 0 }}>{item.body}</p>
                </m.div>
              </FadeSection>
            ))}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <section style={{ borderTop: `1px solid ${BORDER}`, background: SURFACE, padding: "clamp(5rem,9vw,7rem) var(--space-content-x)" }}>
          <div style={{ maxWidth: "52rem", margin: "0 auto", textAlign: "center" }}>
            <FadeSection>
              <m.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } }}>
                <SectionLabel>Get Started</SectionLabel>
                <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.625rem)", fontWeight: 700, letterSpacing: "-0.025em", color: TEXT, marginBottom: "1.25rem", lineHeight: 1.15 }}>
                  Ready to govern your AI operations?
                </h2>
                <p style={{ fontSize: "1.0625rem", color: TEXT_S, lineHeight: 1.65, marginBottom: "2.5rem" }}>
                  Request a guided demonstration of the Alloy execution fabric, the approval workflow,
                  and the Proof Chain. No live credentials required — the governance demo runs on seeded data.
                </p>
                <div style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap", justifyContent: "center" }}>
                  <Link
                    href="/demo"
                    onClick={() => analytics.track("cta_click", { location: "footer_cta", label: "Request Demo" })}
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.875rem 1.75rem", background: ACCENT, color: "#ffffff", fontWeight: 600, fontSize: "1rem", borderRadius: "var(--radius-md)", textDecoration: "none", transition: "opacity 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                  >
                    Request a Demo <ArrowRight size={16} />
                  </Link>
                  <Link
                    href="/design-partner"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.875rem 1.5rem", background: "transparent", color: TEXT_S, fontWeight: 500, fontSize: "1rem", border: `1px solid ${BORDER_D}`, borderRadius: "var(--radius-md)", textDecoration: "none", transition: "border-color 0.15s, color 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = TEXT; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER_D; e.currentTarget.style.color = TEXT_S; }}
                  >
                    Become a Design Partner
                  </Link>
                </div>
              </m.div>
            </FadeSection>
          </div>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}
