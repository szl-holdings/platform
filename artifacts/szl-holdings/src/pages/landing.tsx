import { Link } from "wouter";
import { m } from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
  Eye,
  Zap,
  Shield,
  CheckCircle2,
  Activity,
  GitBranch,
  Lock,
  Database,
  Globe,
  Layers,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] },
  }),
};

const OPERATING_LOOP = [
  { step: "01", label: "Signal Ingestion", body: "Lyte connects to the approval queues, task systems, and workflow tools your teams already use — and begins tracking what's stuck." },
  { step: "02", label: "Visibility Surface", body: "Execution risk, ownership gaps, and workflow friction surface before they compound. The signal-to-visibility arc is always live." },
  { step: "03", label: "Explainable Forecast", body: "What is at risk, why, and what happens next — explained in plain language with source attribution. No opaque model outputs." },
  { step: "04", label: "Governed Action", body: "Alloy routes action to the right person through the right channel, with approval controls and a full audit trail for every step taken." },
];

const PRODUCT_SCREENSHOTS = [
  { label: "Approval Queue", desc: "Pending approvals ranked by latency and risk exposure", accent: "hsl(192,72%,48%)" },
  { label: "Ownership Map", desc: "Accountability gaps surfaced before decisions go untracked", accent: "hsl(192,72%,48%)" },
  { label: "Workflow Friction Feed", desc: "Stuck workflows identified with root cause attribution", accent: "hsl(192,72%,48%)" },
  { label: "Proof Chain Viewer", desc: "Every action linked to the signal that triggered it", accent: "hsl(192,72%,48%)" },
];

const TRUST_POINTS = [
  { icon: Lock, label: "Human-in-the-loop", body: "Approval controls on every consequential action. No autonomous execution without review." },
  { icon: Database, label: "Source attribution", body: "Every signal traces back to its origin. Model outputs are grounded and linkable, never hallucinated." },
  { icon: Activity, label: "Immutable audit trace", body: "The proof chain records every action, approval, and inference — defensible and retrievable." },
  { icon: Shield, label: "Policy routing", body: "Governance is built into the action primitive, not bolted on by compliance teams after the fact." },
];

const INTEGRATIONS = [
  "GraphQL Control Plane",
  "Worldline — Event fabric",
  "Proof Chain — Audit engine",
  "Model Mesh — AI inference",
  "Alloy Connector Mesh",
  "Azure / M365 / SSO",
  "SCIM Provisioning",
  "Webhook & API ingestion",
];

const EXPANSION_LANES = [
  {
    slug: "PRISM Counsel",
    category: "Legal Observability",
    desc: "Matter twins, deadline tracking, and governed demand workflows for litigation teams.",
    color: "#8b7ac8",
    href: "/solutions/prism-counsel",
    status: "Design partner stage",
  },
  {
    slug: "Vessels",
    category: "Maritime Intelligence",
    desc: "Voyage and fleet twins with risk-ranked action surfaces for fleet operators.",
    color: "#4a90b8",
    href: "/solutions/vessels",
    status: "Design partner stage",
  },
  {
    slug: "Aegis",
    category: "Security & Defense",
    desc: "Threat twins and SOC command for environments where every decision has consequence.",
    color: "#c85a5a",
    href: "/solutions/aegis",
    status: "Design partner stage",
  },
  {
    slug: "Terra",
    category: "Real Estate Intelligence",
    desc: "Property twins with distress signals, deal tracking, and governed underwriting flows.",
    color: "#5fa87a",
    href: "/solutions/terra",
    status: "Design partner stage",
  },
  {
    slug: "Carlota Jo",
    category: "Private Advisory",
    desc: "Premium client advisory with discreet intake, managed service flows, and audit-grade delivery.",
    color: "#c8a05a",
    href: "/carlota-jo/",
    status: "Active",
  },
];

export default function HomePage() {
  usePageMeta({
    title: "SZL Holdings — Business observability with explainable execution.",
    description:
      "SZL Holdings builds Lyte, the business observability platform, and Alloy, the execution fabric beneath it. Signal → visibility → forecast → governed action.",
    canonical: "https://szlholdings.com/",
  });

  return (
    <div className="min-h-screen" style={{ background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content">

        {/* ── 1. Hero ─────────────────────────────────────────────────── */}
        <section style={{ position: "relative", overflow: "hidden", borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
          }}>
            <div style={{
              position: "absolute",
              top: "-10rem",
              left: "50%",
              transform: "translateX(-50%)",
              width: "900px",
              height: "600px",
              borderRadius: "50%",
              background: "hsla(192,72%,48%,0.04)",
              filter: "blur(140px)",
            }} />
          </div>
          <div style={{ position: "relative", maxWidth: "1280px", margin: "0 auto", padding: "clamp(7rem,14vw,10rem) var(--space-content-x) clamp(4rem,8vw,6rem)" }}>
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              <p style={{ marginBottom: "1.5rem", fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)" }}>
                SZL Holdings · Design-partner stage · 2026
              </p>
              <h1 style={{
                fontSize: "clamp(2.5rem,5.5vw,4.25rem)",
                fontWeight: 600,
                letterSpacing: "-0.028em",
                lineHeight: 1.08,
                maxWidth: "22ch",
                marginBottom: "1.5rem",
                color: "hsl(38,8%,96%)",
              }}>
                Business observability<br />with explainable execution.
              </h1>
              <p style={{
                fontSize: "clamp(1rem,1.8vw,1.125rem)",
                lineHeight: 1.72,
                color: "var(--color-szl-text-secondary)",
                maxWidth: "46ch",
                marginBottom: "2.5rem",
              }}>
                Lyte surfaces what's stuck, at risk, and about to break — before the damage compounds. Alloy routes the right action with a full audit trail. One platform, every high-consequence domain.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link
                  href="/demo"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.75rem 1.5rem",
                    background: "hsl(192,72%,48%)",
                    color: "hsl(214,18%,4%)",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem", fontWeight: 600,
                    textDecoration: "none",
                    transition: "background 0.2s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(192,72%,54%)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(192,72%,48%)"; }}
                >
                  Request a demo
                  <ArrowRight size={15} />
                </Link>
                <Link
                  href="/platform"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.75rem 1.5rem",
                    background: "transparent",
                    color: "var(--color-szl-text-secondary)",
                    border: "1px solid var(--color-szl-border-hover)",
                    borderRadius: "0.375rem",
                    fontSize: "0.875rem", fontWeight: 500,
                    textDecoration: "none",
                    transition: "border-color 0.2s ease, color 0.2s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.25)"; (e.currentTarget as HTMLElement).style.color = "hsl(38,8%,90%)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-szl-border-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
                >
                  Explore the platform
                </Link>
              </div>
            </m.div>
          </div>
        </section>

        {/* ── 2. Lyte Summary ─────────────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", background: "hsla(0,0%,100%,0.01)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
            <div style={{ display: "grid", gap: "3rem", alignItems: "center" }} className="lg:grid-cols-2">
              <m.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                  <Eye size={14} style={{ color: "hsl(192,72%,48%)" }} />
                  <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(192,72%,48%)", fontFamily: "var(--font-mono)" }}>
                    Lyte — Business Observability
                  </p>
                </div>
                <h2 style={{ fontSize: "clamp(1.75rem,3vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.12, marginBottom: "1rem", color: "hsl(38,8%,94%)" }}>
                  The commercial wedge. The operator console.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "1.5rem" }}>
                  Lyte ingests signals from the workflows, approvals, and handoffs that run your business — the ones that usually break between systems. It surfaces what's stuck, what's at risk, and what's about to fail, with explainable context behind every flag.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.75rem" }}>
                  {[
                    "Approval latency tracked across every tool and team",
                    "Ownership gaps surfaced before accountability breaks down",
                    "Workflow friction identified with root cause context",
                    "Cross-system visibility without a data warehouse project",
                  ].map((point) => (
                    <div key={point} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                      <CheckCircle2 size={14} style={{ color: "hsl(192,72%,48%)", marginTop: "2px", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.875rem", lineHeight: 1.58, color: "var(--color-szl-text-secondary)" }}>{point}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/lyte"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.375rem",
                    fontSize: "0.875rem", fontWeight: 600,
                    color: "hsl(192,72%,48%)",
                    textDecoration: "none",
                    transition: "opacity 0.18s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                >
                  Explore Lyte <ChevronRight size={14} />
                </Link>
              </m.div>
              <m.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
                <div style={{
                  padding: "1.75rem",
                  borderRadius: "0.875rem",
                  background: "hsla(192,72%,48%,0.04)",
                  border: "1px solid hsla(192,72%,48%,0.16)",
                }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    {[
                      { label: "Approval Latency", value: "3.4 days avg", change: "↑ Risk" },
                      { label: "Ownership Gaps", value: "12 items", change: "↑ New" },
                      { label: "Stuck Workflows", value: "7 flagged", change: "Needs action" },
                      { label: "Audit Coverage", value: "100%", change: "✓ Complete" },
                    ].map((kpi) => (
                      <div key={kpi.label} style={{
                        padding: "1rem",
                        borderRadius: "0.5rem",
                        background: "hsla(0,0%,100%,0.03)",
                        border: "1px solid hsla(0,0%,100%,0.06)",
                      }}>
                        <p style={{ fontSize: "0.625rem", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "0.5rem" }}>
                          {kpi.label}
                        </p>
                        <p style={{ fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.02em", color: "hsl(38,8%,92%)", marginBottom: "0.25rem" }}>
                          {kpi.value}
                        </p>
                        <p style={{ fontSize: "0.6875rem", color: "hsl(192,72%,48%)", fontFamily: "var(--font-mono)" }}>{kpi.change}</p>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: "0.6875rem", marginTop: "1rem", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", textAlign: "center" }}>
                    Staged demo data — not real organization telemetry
                  </p>
                </div>
              </m.div>
            </div>
          </div>
        </section>

        {/* ── 3. Alloy Summary ────────────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
            <div style={{ display: "grid", gap: "3rem", alignItems: "center" }} className="lg:grid-cols-2">
              <m.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
                <div style={{
                  padding: "1.75rem",
                  borderRadius: "0.875rem",
                  background: "hsla(215,35%,56%,0.04)",
                  border: "1px solid hsla(215,35%,56%,0.16)",
                }}>
                  {[
                    { label: "Workflow", status: "Routed", detail: "Approval assigned to Sarah K. — due in 2h" },
                    { label: "Escalation", status: "Triggered", detail: "Task stalled 48h — escalated to team lead" },
                    { label: "Audit record", status: "Logged", detail: "Action traced to signal #A-2141 with attribution" },
                  ].map((item, i) => (
                    <div key={item.label} style={{
                      padding: "0.875rem 1rem",
                      borderRadius: "0.5rem",
                      background: "hsla(0,0%,100%,0.025)",
                      border: "1px solid hsla(0,0%,100%,0.06)",
                      marginBottom: i < 2 ? "0.625rem" : 0,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "hsl(38,8%,88%)" }}>{item.label}</span>
                        <span style={{
                          fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
                          color: "hsl(215,35%,65%)", fontFamily: "var(--font-mono)",
                          padding: "2px 6px", borderRadius: "4px",
                          background: "hsla(215,35%,56%,0.12)", border: "1px solid hsla(215,35%,56%,0.2)",
                        }}>
                          {item.status}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "var(--color-szl-text-secondary)", lineHeight: 1.5 }}>{item.detail}</p>
                    </div>
                  ))}
                  <p style={{ fontSize: "0.6875rem", marginTop: "1rem", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", textAlign: "center" }}>
                    Staged demo data — not real workflow events
                  </p>
                </div>
              </m.div>
              <m.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                  <Zap size={14} style={{ color: "hsl(215,35%,65%)" }} />
                  <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(215,35%,65%)", fontFamily: "var(--font-mono)" }}>
                    Alloy — Execution Fabric
                  </p>
                </div>
                <h2 style={{ fontSize: "clamp(1.75rem,3vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.12, marginBottom: "1rem", color: "hsl(38,8%,94%)" }}>
                  The execution spine beneath everything.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "1.5rem" }}>
                  Alloy is the durable operating layer that routes action and verifies follow-through. When Lyte surfaces a signal, Alloy decides what happens next — assigning ownership, triggering the right step, escalating when nothing moves, and recording the complete chain for audit.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", marginBottom: "1.75rem" }}>
                  {[
                    "Structured workflow routing across teams and systems",
                    "Automated escalation when tasks stall past SLA",
                    "Follow-through verification, not just task assignment",
                    "Governance-grade audit trail for every decision and action",
                  ].map((point) => (
                    <div key={point} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                      <CheckCircle2 size={14} style={{ color: "hsl(215,35%,65%)", marginTop: "2px", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.875rem", lineHeight: 1.58, color: "var(--color-szl-text-secondary)" }}>{point}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/alloy-fabric"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.375rem",
                    fontSize: "0.875rem", fontWeight: 600,
                    color: "hsl(215,35%,65%)",
                    textDecoration: "none",
                    transition: "opacity 0.18s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                >
                  Explore Alloy <ChevronRight size={14} />
                </Link>
              </m.div>
            </div>
          </div>
        </section>

        {/* ── 4. Operating Loop ───────────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", background: "hsla(0,0%,100%,0.01)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
            <div style={{ marginBottom: "3rem", maxWidth: "36rem" }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "0.875rem" }}>
                The operating loop
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15, color: "hsl(38,8%,94%)" }}>
                Signal → visibility → forecast → governed action.
              </h2>
            </div>
            <div style={{ display: "grid", gap: "1rem" }} className="sm:grid-cols-2 lg:grid-cols-4">
              {OPERATING_LOOP.map((step, i) => (
                <m.div
                  key={step.step}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  style={{
                    padding: "1.5rem",
                    borderRadius: "0.75rem",
                    background: "hsla(0,0%,100%,0.025)",
                    border: "1px solid hsla(0,0%,100%,0.07)",
                    position: "relative",
                  }}
                >
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 700, color: "hsl(192,72%,48%)", marginBottom: "0.875rem", letterSpacing: "0.06em" }}>
                    {step.step}
                  </p>
                  <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, letterSpacing: "-0.01em", color: "hsl(38,8%,92%)", marginBottom: "0.625rem" }}>
                    {step.label}
                  </h3>
                  <p style={{ fontSize: "0.8125rem", lineHeight: 1.62, color: "var(--color-szl-text-secondary)" }}>
                    {step.body}
                  </p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. Product Screenshots / Interface ──────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
            <div style={{ marginBottom: "3rem", maxWidth: "36rem" }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "0.875rem" }}>
                The interface
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15, color: "hsl(38,8%,94%)" }}>
                Designed for operators, not analysts.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--color-szl-text-secondary)", marginTop: "0.75rem" }}>
                Every surface is built for the person who owns the outcome — not the analyst who built the model.
              </p>
            </div>
            <div style={{ display: "grid", gap: "1rem" }} className="sm:grid-cols-2">
              {PRODUCT_SCREENSHOTS.map((s, i) => (
                <m.div
                  key={s.label}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  style={{
                    borderRadius: "0.875rem",
                    border: "1px solid hsla(0,0%,100%,0.07)",
                    overflow: "hidden",
                    background: "hsla(192,72%,48%,0.02)",
                  }}
                >
                  <div style={{
                    height: "160px",
                    background: "hsla(0,0%,100%,0.025)",
                    borderBottom: "1px solid hsla(0,0%,100%,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <div style={{ textAlign: "center" }}>
                      <Activity size={24} style={{ color: "hsla(192,72%,48%,0.4)", marginBottom: "0.5rem" }} />
                      <p style={{ fontSize: "0.625rem", color: "hsla(0,0%,100%,0.15)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
                        DEMO DATA ONLY
                      </p>
                    </div>
                  </div>
                  <div style={{ padding: "1.25rem" }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(38,8%,90%)", marginBottom: "0.375rem" }}>{s.label}</p>
                    <p style={{ fontSize: "0.8125rem", color: "var(--color-szl-text-secondary)", lineHeight: 1.58 }}>{s.desc}</p>
                  </div>
                </m.div>
              ))}
            </div>
            <div style={{ marginTop: "1.5rem" }}>
              <Link
                href="/demo"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.375rem",
                  fontSize: "0.875rem", fontWeight: 600,
                  color: "hsl(192,72%,48%)",
                  textDecoration: "none",
                  transition: "opacity 0.18s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
              >
                See a controlled demo <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── 6. Trust / Control ──────────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", background: "hsla(0,0%,100%,0.01)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
            <div style={{ marginBottom: "3rem", maxWidth: "36rem" }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "0.875rem" }}>
                Trust and control
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15, color: "hsl(38,8%,94%)" }}>
                Accountability is built in. Not bolted on.
              </h2>
            </div>
            <div style={{ display: "grid", gap: "1rem" }} className="sm:grid-cols-2">
              {TRUST_POINTS.map((t, i) => {
                const Icon = t.icon;
                return (
                  <m.div
                    key={t.label}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: "1rem",
                      padding: "1.5rem",
                      borderRadius: "0.75rem",
                      background: "hsla(0,0%,100%,0.025)",
                      border: "1px solid hsla(0,0%,100%,0.07)",
                    }}
                  >
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "0.5rem", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "hsla(192,72%,48%,0.08)",
                      border: "1px solid hsla(192,72%,48%,0.18)",
                    }}>
                      <Icon size={15} style={{ color: "hsl(192,72%,48%)" }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "hsl(38,8%,92%)", marginBottom: "0.375rem" }}>{t.label}</h3>
                      <p style={{ fontSize: "0.8125rem", lineHeight: 1.62, color: "var(--color-szl-text-secondary)" }}>{t.body}</p>
                    </div>
                  </m.div>
                );
              })}
            </div>
            <div style={{ marginTop: "1.5rem" }}>
              <Link
                href="/trust"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.375rem",
                  fontSize: "0.875rem", fontWeight: 500,
                  color: "var(--color-szl-text-secondary)",
                  textDecoration: "none",
                  transition: "color 0.18s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,8%,90%)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
              >
                View the Trust Center <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── 7. Integration / Architecture ───────────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
            <div style={{ display: "grid", gap: "3rem", alignItems: "center" }} className="lg:grid-cols-2">
              <m.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "0.875rem" }}>
                  Architecture
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15, color: "hsl(38,8%,94%)", marginBottom: "1rem" }}>
                  One architecture. Eight layers. Every domain.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "1.5rem" }}>
                  The platform is not a monolith or an integration project. It is a layered architecture where each component has a single responsibility, and every vertical pack inherits the same spine.
                </p>
                <Link
                  href="/architecture"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.375rem",
                    fontSize: "0.875rem", fontWeight: 500,
                    color: "var(--color-szl-text-secondary)",
                    textDecoration: "none",
                    transition: "color 0.18s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,8%,90%)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
                >
                  Explore the architecture <ChevronRight size={14} />
                </Link>
              </m.div>
              <m.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  {INTEGRATIONS.map((item, i) => (
                    <div key={item} style={{
                      padding: "0.75rem 1rem",
                      borderRadius: "0.5rem",
                      background: "hsla(0,0%,100%,0.025)",
                      border: "1px solid hsla(0,0%,100%,0.06)",
                      display: "flex", alignItems: "center", gap: "0.5rem",
                    }}>
                      <Layers size={11} style={{ color: "hsla(0,0%,100%,0.2)", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.75rem", color: "var(--color-szl-text-secondary)", lineHeight: 1.4 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </m.div>
            </div>
          </div>
        </section>

        {/* ── 8. Expansion Lane Map ───────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", background: "hsla(0,0%,100%,0.01)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
            <div style={{ marginBottom: "3rem", maxWidth: "42rem" }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "0.875rem" }}>
                Expansion lanes
              </p>
              <h2 style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15, color: "hsl(38,8%,94%)" }}>
                The architecture generalizes. Lyte first. Then every domain where execution latency has a cost.
              </h2>
            </div>
            <div style={{ display: "grid", gap: "1rem" }} className="sm:grid-cols-2 lg:grid-cols-3">
              {EXPANSION_LANES.map((lane, i) => (
                <m.div
                  key={lane.slug}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                >
                  <Link
                    href={lane.href}
                    style={{ display: "block", textDecoration: "none" }}
                  >
                    <div style={{
                      padding: "1.5rem",
                      borderRadius: "0.875rem",
                      background: "hsla(0,0%,100%,0.025)",
                      border: "1px solid hsla(0,0%,100%,0.07)",
                      transition: "border-color 0.2s ease, background 0.2s ease",
                    }}
                      onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${lane.color}30`; el.style.background = `${lane.color}06`; }}
                      onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "hsla(0,0%,100%,0.07)"; el.style.background = "hsla(0,0%,100%,0.025)"; }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.875rem" }}>
                        <div>
                          <p style={{ fontSize: "0.5625rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: lane.color, fontFamily: "var(--font-mono)", marginBottom: "0.25rem" }}>
                            {lane.category}
                          </p>
                          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "hsl(38,8%,92%)" }}>{lane.slug}</h3>
                        </div>
                        <span style={{
                          fontSize: "0.5625rem", fontWeight: 500, color: lane.color,
                          padding: "2px 6px", borderRadius: "4px",
                          background: `${lane.color}12`,
                          border: `1px solid ${lane.color}25`,
                          fontFamily: "var(--font-mono)", letterSpacing: "0.06em",
                          flexShrink: 0, marginLeft: "0.5rem",
                        }}>
                          {lane.status}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.8125rem", lineHeight: 1.62, color: "var(--color-szl-text-secondary)" }}>{lane.desc}</p>
                    </div>
                  </Link>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 9. Company / Founder Strip ──────────────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
            <div style={{ display: "grid", gap: "3rem", alignItems: "center" }} className="lg:grid-cols-2">
              <m.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "0.875rem" }}>
                  The company
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15, color: "hsl(38,8%,94%)", marginBottom: "1rem" }}>
                  Disciplined company-building. No fake traction.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "1.5rem" }}>
                  SZL Holdings is at design-partner stage. The architecture is real. The products are built. The go-to-market is founder-led and honest. Washington, D.C. · London · Singapore.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  <Link
                    href="/company"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "0.375rem",
                      fontSize: "0.875rem", fontWeight: 500,
                      color: "var(--color-szl-text-secondary)",
                      textDecoration: "none",
                      padding: "0.5rem 1rem",
                      border: "1px solid var(--color-szl-border-hover)",
                      borderRadius: "0.375rem",
                      transition: "color 0.18s ease, border-color 0.18s ease",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,8%,90%)"; (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.25)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-szl-border-hover)"; }}
                  >
                    About the company <ChevronRight size={13} />
                  </Link>
                  <Link
                    href="/founder"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "0.375rem",
                      fontSize: "0.875rem", fontWeight: 500,
                      color: "var(--color-szl-text-secondary)",
                      textDecoration: "none",
                      padding: "0.5rem 1rem",
                      border: "1px solid var(--color-szl-border-hover)",
                      borderRadius: "0.375rem",
                      transition: "color 0.18s ease, border-color 0.18s ease",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,8%,90%)"; (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.25)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-szl-border-hover)"; }}
                  >
                    About the founder <ChevronRight size={13} />
                  </Link>
                </div>
              </m.div>
              <m.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
                <div style={{
                  padding: "1.75rem",
                  borderRadius: "0.875rem",
                  background: "hsla(0,0%,100%,0.025)",
                  border: "1px solid hsla(0,0%,100%,0.07)",
                }}>
                  {[
                    "Design-partner mode — working directly with operators",
                    "No fake traction, no fabricated logos, no generic 'AI platform' messaging",
                    "Founder runs every design-partner and investor conversation personally",
                    "Architecture and products are built, not vaporware",
                  ].map((item, i) => (
                    <div key={item} style={{
                      display: "flex", alignItems: "flex-start", gap: "0.75rem",
                      paddingBottom: i < 3 ? "0.875rem" : 0,
                      marginBottom: i < 3 ? "0.875rem" : 0,
                      borderBottom: i < 3 ? "1px solid hsla(0,0%,100%,0.05)" : "none",
                    }}>
                      <Globe size={13} style={{ color: "hsl(192,72%,48%)", marginTop: "2px", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.875rem", lineHeight: 1.58, color: "var(--color-szl-text-secondary)" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </m.div>
            </div>
          </div>
        </section>

        {/* ── 10. Demo CTA ────────────────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid var(--color-szl-border)", background: "hsla(192,72%,48%,0.02)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
            <m.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              style={{
                borderRadius: "1rem",
                border: "1px solid hsla(192,72%,48%,0.18)",
                padding: "clamp(2rem,5vw,3.5rem)",
                background: "hsla(0,0%,100%,0.025)",
              }}
            >
              <div style={{ maxWidth: "32rem" }}>
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(192,72%,48%)", fontFamily: "var(--font-mono)", marginBottom: "1rem" }}>
                  Request a demo
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.25rem)", fontWeight: 600, letterSpacing: "-0.022em", lineHeight: 1.12, color: "hsl(38,8%,94%)", marginBottom: "1rem" }}>
                  See how Lyte works on a real workflow.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "2rem" }}>
                  The demo covers the full signal-to-action arc using staged data. You can also request a design-partner conversation if you want to explore a live instrumentation of one of your own workflows.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  <Link
                    href="/demo"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "0.5rem",
                      padding: "0.75rem 1.5rem",
                      background: "hsl(192,72%,48%)",
                      color: "hsl(214,18%,4%)",
                      borderRadius: "0.375rem",
                      fontSize: "0.875rem", fontWeight: 600,
                      textDecoration: "none",
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(192,72%,54%)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(192,72%,48%)"; }}
                  >
                    Request a demo
                    <ArrowRight size={15} />
                  </Link>
                  <Link
                    href="/design-partner"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "0.5rem",
                      padding: "0.75rem 1.5rem",
                      background: "transparent",
                      color: "var(--color-szl-text-secondary)",
                      border: "1px solid var(--color-szl-border-hover)",
                      borderRadius: "0.375rem",
                      fontSize: "0.875rem", fontWeight: 500,
                      textDecoration: "none",
                      transition: "border-color 0.2s ease, color 0.2s ease",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.25)"; (e.currentTarget as HTMLElement).style.color = "hsl(38,8%,90%)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-szl-border-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
                  >
                    Become a design partner
                  </Link>
                </div>
              </div>
            </m.div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
