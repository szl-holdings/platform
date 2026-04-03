import { m } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Scale, CheckCircle2, Shield, FileText, Eye, Lock, Database, Zap, AlertTriangle, Clock, Building2 } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const WORKFLOW_STEPS = [
  {
    step: "01",
    label: "Matter Twin",
    body: "Every matter is modeled as a live structured object — claims, parties, deadlines, documents, correspondence, and insurer behavior — assembled from connected systems and continuously updated as signals arrive.",
  },
  {
    step: "02",
    label: "What Changed",
    body: "Signal delta surfaced on demand: new insurer correspondence, clock violations, ownership gaps, document status changes, and any threshold crossing since the last review. Nothing buried in an inbox.",
  },
  {
    step: "03",
    label: "Review Before Send",
    body: "Demand packets reviewed against a completeness checklist — missing medicals, lien exposure, privilege risks, and evidence gaps flagged before the document leaves the firm.",
  },
  {
    step: "04",
    label: "Approval Gate",
    body: "Consequential actions — demand letters, settlement recommendations, compliance filings — require explicit partner or supervisor approval before execution. Human-in-the-loop is structural, not optional.",
  },
  {
    step: "05",
    label: "Word Export",
    body: "Demand letters and compliance documents exported to Word with source citations, metadata, and privilege controls intact. M365-native workflow — no format gymnastics.",
  },
  {
    step: "06",
    label: "Proof Chain",
    body: "An immutable, timestamped audit record of every action, approval, AI use, and data access — structured for regulatory review, malpractice defense, or client accountability.",
  },
];

const SIGNAL_SOURCES = [
  { label: "NY DFS Insurance Regulation 68", detail: "No-fault claim clock tracking, acknowledgment and verification deadlines, payment and denial timing" },
  { label: "NWS Weather Data", detail: "Weather incident context for bodily injury and premises claims — date-of-incident conditions and regional event records" },
  { label: "US Census Bureau", detail: "Demographic and economic context for damages assessment and venue strategy" },
  { label: "CMS MSPRP", detail: "Medicare Secondary Payer records for lien identification and resolution tracking" },
  { label: "Court Scheduling Feeds", detail: "NY court part velocity, scheduling patterns, and ADR milestone data for venue planning" },
  { label: "NYSCEF / Court Records", detail: "Filing status, motion tracking, and deadline compliance for active litigation matters" },
];

const CAPABILITIES = [
  { icon: Eye, title: "Matter Twin", body: "A live structured model of each matter — claims, parties, deadlines, documents, and insurer behavior — updated continuously from connected systems." },
  { icon: AlertTriangle, title: "What Changed", body: "Signal delta surfaced on demand. Know exactly what moved on each matter since the last review — without digging through email." },
  { icon: FileText, title: "Review Before Send", body: "Demand readiness scoring with completeness checklist enforcement, privilege risk flagging, and missing-item detection before any document goes out." },
  { icon: Shield, title: "Proof Chain", body: "Immutable audit record of every action, approval, AI use, and data access. Defensible in court. Exportable for client accountability." },
  { icon: Building2, title: "Insurer Intelligence", body: "Carrier response patterns, adjuster profiles, offer trajectories, silence window tracking, and reserve movement analysis — built over time, available immediately." },
  { icon: Clock, title: "Deadline Engine", body: "NY Insurance Regulation 68 compliance clocks, statute of limitations tracking, and discovery deadline management — with escalation ladders when thresholds approach." },
];

const TRUST_CONTROLS = [
  "Human approval on every consequential action — demand letters, settlement positions, compliance filings",
  "Privilege-aware architecture — attorney-client and work product protections encoded at the data layer",
  "Source-grounded AI — every recommendation tied to a specific document, record, or data source",
  "Immutable proof chain — timestamped, actor-attributed, exportable for regulatory or malpractice review",
  "Role-based access — partners, attorneys, and paralegals see only what their role permits",
  "Export safety — redaction controls, privilege filters, and content review before any document leaves the system",
];

export default function PrismCounselPublicPage() {
  usePageMeta({
    title: "PRISM Counsel — Legal Matter Intelligence | SZL Holdings",
    description: "PRISM Counsel turns fragmented matter signals into governed legal action. Matter Twin, What Changed, Review Before Send, Proof Chain — built for plaintiff-side litigation.",
    canonical: "https://szlholdings.com/prism-counsel-public",
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
            background: "radial-gradient(ellipse at 50% 0%, hsla(38,72%,58%,0.05) 0%, transparent 62%)",
          }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.75rem" }}>
                <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(38,72%,58%,0.10)", border: "1px solid hsla(38,72%,58%,0.22)", borderRadius: "8px" }}>
                  <Scale size={16} color="hsl(38,72%,58%)" />
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(38,72%,58%)" }}>
                  PRISM Counsel · Legal Matter Intelligence
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
                  Every matter. Every signal. Governed.
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
                  PRISM Counsel turns fragmented claim, matter, document, communication, and deadline signals into governed legal action and outcome forecasting. Built for plaintiff-side litigation teams operating in New York insurance litigation.
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
                  A command layer above case management, email, documents, and Microsoft 365. Not a chatbot. Not a case management clone. A matter command system with a proof chain for everything that moves.
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
                style={{ borderRadius: "0.875rem", padding: "clamp(1.25rem,3vw,1.75rem)", background: "hsla(38,72%,58%,0.04)", border: "1px solid hsla(38,72%,58%,0.14)" }}
              >
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--color-szl-text-muted)", marginBottom: "1rem" }}>
                  What PRISM Counsel answers
                </p>
                {[
                  "Which matters are at risk of missing a critical deadline?",
                  "Where is the demand packet incomplete before it goes out?",
                  "What changed on this matter since the last review?",
                  "How is this insurer behaving relative to their pattern?",
                  "What is the settlement band forecast based on current signals?",
                  "Which approvals are pending and who is the gatekeeper?",
                ].map((q, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", marginBottom: "0.75rem" }}>
                    <CheckCircle2 size={14} color="hsl(38,72%,58%)" style={{ marginTop: "2px", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "hsl(214,7%,72%)" }}>{q}</span>
                  </div>
                ))}
                <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--color-szl-border)" }}>
                  <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,48%)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
                    NY insurance litigation · Plaintiff-side · M365-native
                  </p>
                </div>
              </m.div>
            </div>
          </div>
        </section>

        {/* Flagship workflow */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(38,72%,58%)", marginBottom: "1rem" }}>
                Flagship Workflow
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "30ch", marginBottom: "3rem" }}>
                From Matter Twin to Proof Chain — every step governed.
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
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: "hsl(38,72%,58%)", letterSpacing: "0.06em", flexShrink: 0, marginTop: "2px" }}>
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
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(38,72%,58%)", marginBottom: "1rem" }}>
                Core Capabilities
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                Built for the full matter lifecycle.
              </h2>
            </m.div>
            <div className="szl-grid-3">
              {CAPABILITIES.map((cap, i) => {
                const Icon = cap.icon;
                return (
                  <m.div
                    key={cap.title}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.38, delay: i * 0.06 }}
                    className="szl-card"
                    style={{ borderRadius: "0.75rem", padding: "var(--space-card-pad)" }}
                  >
                    <div style={{ width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", background: "hsla(38,72%,58%,0.09)", border: "1px solid hsla(38,72%,58%,0.18)", borderRadius: "0.4375rem", marginBottom: "1rem" }}>
                      <Icon size={16} color="hsl(38,72%,58%)" />
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
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(38,72%,58%)", marginBottom: "1rem" }}>
                  Signal Sources
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, marginBottom: "1.25rem" }}>
                  The outside world, inside the matter model.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "46ch" }}>
                  PRISM Counsel is not just a document system. It connects to regulatory feeds, weather records, federal databases, and court data — and weaves those signals into each matter's twin so attorneys see context they would otherwise miss or manually research.
                </p>
              </m.div>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.08 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {SIGNAL_SOURCES.map((source, i) => (
                    <div key={i} style={{ padding: "1rem 1.25rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                        <Database size={11} color="hsl(38,72%,58%)" />
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

        {/* Trust controls */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.6875rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(38,72%,58%)", marginBottom: "1rem" }}>
                Trust Controls
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, maxWidth: "28ch", marginBottom: "3rem" }}>
                Governance built for legal accountability, not as an afterthought.
              </h2>
            </m.div>
            <div style={{ display: "grid", gap: "0.75rem" }} className="lg:grid-cols-2">
              {TRUST_CONTROLS.map((control, i) => (
                <m.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.06 }}
                  style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "1rem 1.25rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}
                >
                  <Lock size={13} color="hsl(38,72%,58%)" style={{ marginTop: "2px", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "hsl(214,7%,64%)" }}>{control}</span>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* Operator prerequisites */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "grid", gap: "clamp(2rem,5vw,4rem)" }} className="lg:grid-cols-3">
              {[
                {
                  icon: Zap,
                  title: "What PRISM Counsel is",
                  items: [
                    "A matter command system",
                    "A deadline intelligence engine",
                    "An insurer behavior intelligence layer",
                    "A governed action and approval system",
                    "A Microsoft-native legal operating layer",
                    "A proof chain for every action taken",
                  ],
                },
                {
                  icon: AlertTriangle,
                  title: "What PRISM Counsel is not",
                  items: [
                    "A generic legal chatbot",
                    "A Westlaw or Lexis replacement",
                    "A basic case management clone",
                    "An autonomous filing system",
                    "A source of legal advice",
                    "A system that makes decisions for you",
                  ],
                },
                {
                  icon: Shield,
                  title: "Operator prerequisites",
                  items: [
                    "Microsoft 365 tenant (Teams, Outlook, SharePoint, Word)",
                    "Designated partner or admin as approval authority",
                    "Role definitions for attorney and paralegal access",
                    "Connected case management system (preferred)",
                    "Matter intake and client consent workflow",
                  ],
                },
              ].map((section, i) => {
                const Icon = section.icon;
                return (
                  <m.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.38, delay: i * 0.08 }}
                    className="szl-card"
                    style={{ borderRadius: "0.875rem", padding: "1.5rem" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
                      <Icon size={14} color="hsl(38,72%,58%)" />
                      <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.012em" }}>{section.title}</h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {section.items.map((item, j) => (
                        <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                          <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "hsl(38,72%,58%)", flexShrink: 0, marginTop: "7px", opacity: 0.6 }} />
                          <span style={{ fontSize: "0.8125rem", lineHeight: 1.55, color: "hsl(214,7%,62%)" }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: "var(--space-section-md) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              style={{ borderRadius: "1rem", padding: "clamp(2.5rem,5vw,4rem)", gap: "2.5rem", alignItems: "center", background: "hsla(38,72%,58%,0.05)", border: "1px solid hsla(38,72%,58%,0.16)" }}
              className="szl-grid-cta"
            >
              <div>
                <h2 style={{ fontSize: "clamp(1.5rem,3.5vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.18, marginBottom: "0.875rem" }}>
                  Ready to bring your matter operations into one command surface?
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.70, color: "hsl(214,7%,62%)", maxWidth: "48ch" }}>
                  We run focused design partner engagements with plaintiff-side litigation firms — PRISM Counsel instrumented against your actual matters, your actual deadlines, your actual insurer relationships.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flexShrink: 0 }}>
                <Link href="/contact" className="szl-btn-primary">
                  Request controlled access <ArrowRight size={14} />
                </Link>
                <Link href="/demo" className="szl-btn-secondary" style={{ textAlign: "center" }}>
                  See the flagship workflow
                </Link>
              </div>
            </m.div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
