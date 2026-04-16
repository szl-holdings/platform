import { useState } from "react";
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
  Lock,
  Database,
  Globe,
  Layers,
  Users,
  Code2,
  TrendingUp,
  Handshake,
  BarChart3,
  ExternalLink,
  Ship,
  Building2,
  BriefcaseBusiness,
  ShieldCheck,
  Server,
  GitBranch,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

const PLATFORM_LAYERS = [
  {
    tier: "Flagship Command",
    description: "Lyte is the primary operator command surface — the PRISM framework, signal timeline, action queue, and governed approval flow.",
    products: [
      { name: "Lyte", note: "Flagship web command — PRISM framework, signal → action, approvals" },
      { name: "CORTEX", note: "Mobile command — all domains, biometric auth, iOS + Android" },
      { name: "Command Portal", note: "Ecosystem hub — 8-domain SSE dashboard, cross-domain oversight" },
    ],
    accent: "hsl(192,72%,48%)",
    icon: Eye,
  },
  {
    tier: "Execution Fabric + Primitives",
    description: "The governed intelligence backbone shared by every surface — six structural primitives enforced at the platform layer.",
    products: [
      { name: "Alloy", note: "Workflow orchestration, approval gates, immutable audit trail" },
      { name: "Outcome Graph", note: "Decision lifecycle — recommendation → decision → outcome" },
      { name: "Proof Chain", note: "Immutable audit trail with AI provenance" },
      { name: "Covenant Policy", note: "Human-in-the-loop enforcement at the policy layer" },
      { name: "Decision Simulation", note: "Probabilistic risk modeling before action" },
      { name: "Workflow Engine", note: "Durable multi-step process orchestration with agent coordination" },
      { name: "Event Fabric", note: "Cross-domain signal backbone — normalizes and routes events" },
    ],
    accent: "hsl(215,72%,58%)",
    icon: Zap,
  },
  {
    tier: "Domain Packs",
    description: "Domain-specific intelligence built on shared governance infrastructure — not separate products.",
    products: [
      { name: "Aegis", note: "Security & defense — SOC, XDR, MITRE ATT&CK, threat intelligence" },
      { name: "Vessels", note: "Maritime — fleet command, AIS, sanctions, voyage economics" },
      { name: "Terra", note: "Real estate — distress signals, deal pipeline, ownership graph" },
      { name: "PRISM Counsel", note: "Legal — matter command, deadline tracking, governed demand" },
      { name: "Carlota Jo", note: "Advisory — discreet intake, managed delivery, audit-grade" },
      { name: "IMPERIUM", note: "Cloud sovereignty — multi-cloud governance, policy enforcement" },
    ],
    accent: "hsl(260,60%,65%)",
    icon: Layers,
  },
];

const EVIDENCE_STATS = [
  { value: "700+", label: "Database tables", note: "across 116 schema files" },
  { value: "40+", label: "Shared packages", note: "pnpm monorepo" },
  { value: "15", label: "Active artifacts", note: "web, mobile, API, design" },
  { value: "11", label: "RBAC roles", note: "org-scoped tenant isolation" },
  { value: "9", label: "AI decision types", note: "schema-validated outputs" },
  { value: "6", label: "Platform primitives", note: "shared across all surfaces" },
];

const OPERATING_LOOP = [
  { step: "01", label: "Signal", body: "A risk indicator, anomaly, or threshold breach is detected and normalized by the Event Fabric. Domain context, severity, and correlation ID attached." },
  { step: "02", label: "Context", body: "Cross-domain enrichment via PRISM Bus. A sanctions alert from Vessels triggers a legal flag in PRISM Counsel, a risk entry in Lyte." },
  { step: "03", label: "Recommendation", body: "An AI agent proposes an action with source citations, confidence score, and full provenance metadata. No opaque verdicts." },
  { step: "04", label: "Simulation", body: "The Monte Carlo engine models risk and uncertainty. Operators see expected outcomes, confidence intervals, and the variables that matter most." },
  { step: "05", label: "Policy", body: "Covenant Policy checks who can approve and what conditions apply. Governance enforced at the platform layer, not the UI." },
  { step: "06", label: "Execution", body: "Alloy orchestrates the approved action as a durable, multi-step process with checkpoint recovery and agent coordination." },
  { step: "07", label: "Proof", body: "The Proof Chain records the complete trail: signal, recommendation, simulation, policy decision, approval, execution. Immutable and queryable." },
  { step: "08", label: "Outcome", body: "The Outcome Graph records the real-world result. Was the action effective? This data calibrates future AI confidence scores." },
  { step: "09", label: "Learning", body: "Historical outcomes feed back into simulation models and agent confidence calibration. The platform improves with every governed decision." },
];

const TRUST_POINTS = [
  { icon: Lock, label: "Human-in-the-loop enforced", body: "Approval controls on every consequential action. No autonomous execution without review — enforced at the workflow layer, not the UI layer." },
  { icon: Database, label: "Source attribution on every output", body: "Every AI-generated recommendation includes model identity, source citations, and confidence score. No opaque verdicts." },
  { icon: Activity, label: "Immutable audit trail", body: "The Proof Chain records every action, approval, and inference — append-only, tamper-resistant, and fully queryable by actor, action, and time." },
  { icon: Shield, label: "Policy-gated governance", body: "Covenant Policy enforces who can act, when, and under what conditions. Governance is an architecture primitive, not a compliance afterthought." },
];

const DOMAIN_PACKS = [
  {
    icon: ShieldCheck,
    slug: "Aegis",
    category: "Security & Defense",
    desc: "SOC command, threat intelligence, MITRE ATT&CK mapping, and SOAR playbooks for environments where every decision has consequence. Policy-gated, fully audited.",
    color: "hsl(222,60%,58%)",
    href: "/solutions/aegis",
    capabilities: ["Threat classification", "SOC workflow", "AI triage with approval gates", "Compliance audit trail"],
  },
  {
    icon: Ship,
    slug: "Vessels",
    category: "Maritime Intelligence",
    desc: "Fleet command, AIS telemetry, voyage economics, dark vessel detection, and sanctions screening for fleet operators. Same proof chain, maritime intelligence layer.",
    color: "hsl(206,72%,52%)",
    href: "/solutions/vessels",
    capabilities: ["Real-time AIS telemetry", "Voyage P&L", "Dark vessel detection", "Sanctions screening"],
  },
  {
    icon: Building2,
    slug: "Terra",
    category: "Real Estate Intelligence",
    desc: "NYC distress property pipeline, ownership entity graph, deal pipeline, and broker workflow. Data-rich intelligence with a governed underwriting flow.",
    color: "hsl(140,52%,46%)",
    href: "/solutions/terra",
    capabilities: ["Distress signal detection", "Ownership graph", "Deal pipeline", "Acquisition approval gates"],
  },
  {
    icon: BriefcaseBusiness,
    slug: "PRISM Counsel",
    category: "Legal Intelligence",
    desc: "Matter twins, deadline tracking, and governed demand workflows for litigation teams. AI-assisted legal operations with approval gates and Proof Chain.",
    color: "hsl(260,60%,65%)",
    href: "/solutions/prism-counsel",
    capabilities: ["Matter lifecycle command", "Deadline tracking", "AI-assisted review", "Immutable audit trail"],
  },
  {
    icon: Shield,
    slug: "Carlota Jo",
    category: "Premium Advisory",
    desc: "Discreet client intake, managed service delivery, and advisory operations for UHNW principals. Governance-grade document handling and audit trail.",
    color: "hsl(340,52%,58%)",
    href: "/solutions/carlota-jo",
    capabilities: ["Client intake & onboarding", "Service catalog", "Secure document delivery", "Advisory audit trail"],
  },
  {
    icon: Eye,
    slug: "IMPERIUM",
    category: "Cloud Sovereignty",
    desc: "Multi-cloud governance, policy enforcement, and cloud estate visibility — the same governance primitives applied to infrastructure control and compliance.",
    color: "hsl(25,72%,52%)",
    href: "/solutions/imperium",
    capabilities: ["Cloud policy enforcement", "Multi-cloud visibility", "Configuration drift detection", "Infrastructure audit trail"],
  },
];

function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      setStatus("error");
      return;
    }
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "newsletter",
          name: email.split("@")[0],
          email,
          app: "szl-holdings",
          message: "Newsletter signup from homepage",
          metadata: { source: "homepage-newsletter-cta" },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { message?: string }).message || "Submission failed");
      }
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <section style={{ borderBottom: "1px solid var(--color-szl-border)" }} aria-label="Insights newsletter">
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(3rem,6vw,4rem) var(--space-content-x)" }}>
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            display: "flex", flexWrap: "wrap", gap: "2rem", alignItems: "center", justifyContent: "space-between",
            padding: "2rem 2.5rem",
            borderRadius: "0.875rem",
            background: "hsla(0,0%,100%,0.025)",
            border: "1px solid hsla(0,0%,100%,0.07)",
          }}
        >
          <div style={{ maxWidth: "32rem" }}>
            <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "0.5rem" }}>
              Insights & analysis
            </p>
            <h3 style={{ fontSize: "clamp(1.1rem,2vw,1.4rem)", fontWeight: 600, letterSpacing: "-0.018em", color: "hsl(38,8%,92%)", marginBottom: "0.5rem" }}>
              Governed intelligence, operational AI, and the SZL thesis.
            </h3>
            <p style={{ fontSize: "0.875rem", color: "var(--color-szl-text-secondary)", lineHeight: 1.6 }}>
              Founder-written analysis on the ideas shaping enterprise operations. No digest, no filler — published when it's worth reading.
            </p>
          </div>
          <div style={{ minWidth: "280px", flex: "1 1 280px", maxWidth: "420px" }}>
            {status === "success" ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.875rem 1.125rem", borderRadius: "0.5rem", background: "hsla(145,60%,46%,0.12)", border: "1px solid hsla(145,60%,46%,0.25)" }}>
                <CheckCircle2 size={18} style={{ color: "hsl(145,60%,58%)", flexShrink: 0 }} aria-hidden="true" />
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(145,60%,72%)", margin: 0 }}>You're on the list.</p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--color-szl-text-secondary)", margin: "0.15rem 0 0" }}>We'll reach out when something worth reading is published.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate aria-label="Subscribe to SZL Insights">
                <label htmlFor="newsletter-email" style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--color-szl-text-secondary)", marginBottom: "0.5rem" }}>
                  Email address
                </label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    id="newsletter-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (status === "error") { setStatus("idle"); setErrorMsg(""); } }}
                    placeholder="you@company.com"
                    aria-describedby={errorMsg ? "newsletter-error" : undefined}
                    aria-invalid={status === "error"}
                    disabled={status === "submitting"}
                    style={{
                      flex: 1,
                      padding: "0.625rem 0.875rem",
                      background: "hsla(0,0%,100%,0.06)",
                      border: `1px solid ${status === "error" ? "hsla(0,72%,60%,0.6)" : "hsla(0,0%,100%,0.14)"}`,
                      borderRadius: "0.375rem",
                      color: "hsl(38,8%,92%)",
                      fontSize: "0.875rem",
                      outline: "none",
                      transition: "border-color 0.2s ease",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "hsla(192,72%,48%,0.7)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = status === "error" ? "hsla(0,72%,60%,0.6)" : "hsla(0,0%,100%,0.14)"; }}
                  />
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    style={{
                      padding: "0.625rem 1rem",
                      background: "hsl(192,72%,48%)",
                      color: "hsl(214,18%,4%)",
                      border: "none",
                      borderRadius: "0.375rem",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      cursor: status === "submitting" ? "not-allowed" : "pointer",
                      opacity: status === "submitting" ? 0.7 : 1,
                      whiteSpace: "nowrap",
                      transition: "opacity 0.2s ease",
                    }}
                  >
                    {status === "submitting" ? "Sending…" : "Subscribe"}
                  </button>
                </div>
                {errorMsg && (
                  <p id="newsletter-error" role="alert" style={{ fontSize: "0.78125rem", color: "hsl(0,72%,68%)", marginTop: "0.375rem", margin: "0.375rem 0 0" }}>
                    {errorMsg}
                  </p>
                )}
                <p style={{ fontSize: "0.75rem", color: "var(--color-szl-text-faint)", marginTop: "0.5rem" }}>
                  No spam. Unsubscribe anytime.{" "}
                  <Link href="/insights" style={{ color: "var(--color-szl-text-secondary)", textDecoration: "underline" }}>Browse the archive</Link>
                </p>
              </form>
            )}
          </div>
        </m.div>
      </div>
    </section>
  );
}

export default function HomePage() {
  usePageMeta({
    title: "SZL Holdings — Governed Decision Infrastructure",
    description:
      "Governed decision infrastructure for enterprise operations. The structural layer between signal detection and action execution — with governance, attribution, and outcome tracking on every decision. Lyte, Alloy, and domain packs for security, maritime, real estate, and legal.",
    canonical: "https://szlholdings.com/",
    ogImage: "https://szlholdings.com/og/og-home.jpg",
  });

  return (
    <div className="min-h-screen" style={{ background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content">

        {/* ── 1. Platform Hero ─────────────────────────────────────────── */}
        <section
          aria-label="Platform overview"
          style={{ position: "relative", overflow: "hidden", borderBottom: "1px solid var(--color-szl-border)" }}
        >
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
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            >
              {/* Company label */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.75rem", flexWrap: "wrap" }}>
                <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", margin: 0 }}>
                  SZL Holdings
                </p>
                <span style={{ width: "1px", height: "12px", background: "hsla(0,0%,100%,0.15)" }} aria-hidden="true" />
                <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(192,72%,48%)", margin: 0 }}>
                  Governed Decision Infrastructure
                </p>
                <span style={{ width: "1px", height: "12px", background: "hsla(0,0%,100%,0.15)" }} aria-hidden="true" />
                <p style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", margin: 0 }}>
                  Design-partner stage · 2026
                </p>
              </div>

              {/* Primary headline */}
              <h1 style={{
                fontSize: "clamp(2.5rem,5.5vw,4.25rem)",
                fontWeight: 700,
                letterSpacing: "-0.028em",
                lineHeight: 1.06,
                maxWidth: "24ch",
                marginBottom: "1.5rem",
                color: "hsl(38,8%,96%)",
              }}>
                Every satisfying decision follows a loop. We built the infrastructure for it.
              </h1>

              {/* Category definition */}
              <p style={{
                fontSize: "0.8125rem",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.03em",
                color: "hsl(192,72%,52%)",
                marginBottom: "1rem",
                lineHeight: 1.5,
              }}>
                Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning
              </p>

              {/* Subhead */}
              <p style={{
                fontSize: "clamp(1rem,1.8vw,1.125rem)",
                lineHeight: 1.72,
                color: "var(--color-szl-text-secondary)",
                maxWidth: "52ch",
                marginBottom: "1rem",
              }}>
                Governed decision infrastructure for enterprise operations. Not a dashboard. Not an AI copilot. The structural layer between signal detection and action execution — with governance, attribution, and outcome tracking on every decision that matters.
              </p>

              {/* Platform hierarchy quick-read */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2.5rem", alignItems: "center" }}>
                {[
                  { label: "Lyte", note: "flagship command", color: "hsl(192,72%,48%)" },
                  { label: "Alloy", note: "execution fabric", color: "hsl(215,72%,58%)" },
                  { label: "CORTEX", note: "mobile command", color: "hsl(175,70%,46%)" },
                  { label: "Aegis · Vessels · Terra · PRISM Counsel · Carlota Jo · IMPERIUM", note: "domain packs", color: "hsl(260,60%,65%)" },
                ].map((item, i) => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {i > 0 && <span style={{ color: "hsla(0,0%,100%,0.2)", fontSize: "0.75rem" }} aria-hidden="true">→</span>}
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "0.375rem",
                      padding: "0.3rem 0.75rem",
                      borderRadius: "2rem",
                      background: `${item.color}12`,
                      border: `1px solid ${item.color}28`,
                      fontSize: "0.75rem", fontWeight: 600,
                      color: item.color,
                    }}>
                      {item.label}
                      <span style={{ fontSize: "0.625rem", fontWeight: 400, color: `${item.color}99`, fontFamily: "var(--font-mono)" }}>
                        {item.note}
                      </span>
                    </span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <Link
                  href="/demo"
                  aria-label="Request a product demo"
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
                  <ArrowRight size={15} aria-hidden="true" />
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
                  <Handshake size={15} aria-hidden="true" />
                  Become a design partner
                </Link>
              </div>
            </m.div>
          </div>
        </section>

        {/* ── 1b. Trust Strip ─────────────────────────────────────────── */}
        <section
          aria-label="Security and trust overview"
          style={{ borderBottom: "1px solid var(--color-szl-border)", background: "hsla(192,72%,48%,0.025)" }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.25rem var(--space-content-x)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "center" }}>
                {[
                  { icon: Lock, label: "Human-in-the-loop enforcement" },
                  { icon: Shield, label: "TLS 1.3 · AES-256 at rest" },
                  { icon: Activity, label: "Immutable Proof Chain audit trail" },
                  { icon: Users, label: "11-role RBAC · org-scoped isolation" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Icon size={12} style={{ color: "hsl(192,72%,48%)", flexShrink: 0 }} aria-hidden="true" />
                      <span style={{ fontSize: "0.75rem", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", letterSpacing: "0.03em" }}>{item.label}</span>
                    </div>
                  );
                })}
              </div>
              <Link
                href="/trust"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.375rem",
                  fontSize: "0.75rem", fontWeight: 600,
                  color: "hsl(192,72%,48%)",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  transition: "color 0.18s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(192,72%,60%)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(192,72%,48%)"; }}
              >
                Full Trust Center <ExternalLink size={11} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── 2. Audience Paths ───────────────────────────────────────── */}
        <section
          aria-label="Audience entry points"
          style={{ borderBottom: "1px solid var(--color-szl-border)", background: "hsla(0,0%,100%,0.015)" }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(2.5rem,4vw,3rem) var(--space-content-x)" }}>
            <div style={{ marginBottom: "1.5rem" }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)" }}>
                Where do you start?
              </p>
            </div>
            <div style={{ display: "grid", gap: "0.75rem" }} className="sm:grid-cols-2 lg:grid-cols-5">
              {[
                {
                  icon: TrendingUp,
                  label: "Executive buyer",
                  desc: "Value prop, ROI frame, and design-partner path.",
                  href: "/platform",
                  accent: "hsl(192,72%,48%)",
                },
                {
                  icon: Code2,
                  label: "Technical evaluator",
                  desc: "Architecture, stack, and integration surface.",
                  href: "/architecture",
                  accent: "hsl(215,60%,60%)",
                },
                {
                  icon: Shield,
                  label: "Security reviewer",
                  desc: "Controls, AI governance, and audit trail.",
                  href: "/trust",
                  accent: "hsl(340,60%,58%)",
                },
                {
                  icon: Handshake,
                  label: "Design partner",
                  desc: "Work directly with the founding team.",
                  href: "/design-partner",
                  accent: "hsl(38,72%,58%)",
                },
                {
                  icon: BarChart3,
                  label: "Investor",
                  desc: "Market thesis, moat, and data room.",
                  href: "/investor",
                  accent: "hsl(145,60%,50%)",
                },
              ].map((path, i) => {
                const Icon = path.icon;
                return (
                  <m.div
                    key={path.label}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                  >
                    <Link
                      href={path.href}
                      style={{ display: "block", textDecoration: "none" }}
                      aria-label={`${path.label} — ${path.desc}`}
                    >
                      <div
                        style={{
                          padding: "1.125rem 1.25rem",
                          borderRadius: "0.75rem",
                          background: "hsla(0,0%,100%,0.025)",
                          border: "1px solid hsla(0,0%,100%,0.07)",
                          transition: "border-color 0.2s ease, background 0.2s ease",
                          cursor: "pointer",
                          height: "100%",
                        }}
                        onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${path.accent}35`; el.style.background = `${path.accent}06`; }}
                        onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "hsla(0,0%,100%,0.07)"; el.style.background = "hsla(0,0%,100%,0.025)"; }}
                      >
                        <div style={{
                          width: "30px", height: "30px", borderRadius: "0.4rem", marginBottom: "0.75rem",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: `${path.accent}12`,
                          border: `1px solid ${path.accent}28`,
                        }}>
                          <Icon size={14} style={{ color: path.accent }} aria-hidden="true" />
                        </div>
                        <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(38,8%,90%)", marginBottom: "0.3rem" }}>{path.label}</p>
                        <p style={{ fontSize: "0.75rem", lineHeight: 1.5, color: "var(--color-szl-text-faint)" }}>{path.desc}</p>
                      </div>
                    </Link>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 3. Platform Architecture ────────────────────────────────── */}
        <section
          aria-label="Platform architecture layers"
          style={{ borderBottom: "1px solid var(--color-szl-border)" }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <div style={{ marginBottom: "3rem" }}>
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "0.875rem" }}>
                  Platform architecture
                </p>
                <h2 style={{ fontSize: "clamp(1.75rem,3vw,2.25rem)", fontWeight: 700, letterSpacing: "-0.022em", lineHeight: 1.1, color: "hsl(38,8%,94%)", marginBottom: "1rem", maxWidth: "28ch" }}>
                  One platform. Six shared primitives. Every high-consequence domain.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", maxWidth: "52ch" }}>
                  Lyte is the flagship command surface. Alloy is the execution fabric. CORTEX delivers both on mobile. Domain packs extend the same governance infrastructure into security, maritime, real estate, legal, and advisory — without rebuilding the governance layer.
                </p>
              </div>
            </m.div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {PLATFORM_LAYERS.map((layer, i) => {
                const Icon = layer.icon;
                return (
                  <m.div
                    key={layer.tier}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    style={{
                      padding: "1.75rem 2rem",
                      borderRadius: "0.875rem",
                      background: "hsla(0,0%,100%,0.025)",
                      border: `1px solid ${layer.accent}18`,
                      display: "grid",
                      gap: "1.5rem",
                      alignItems: "start",
                    }}
                    className="md:grid-cols-[240px_1fr]"
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
                        <div style={{
                          width: "28px", height: "28px", borderRadius: "0.375rem",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: `${layer.accent}14`,
                          border: `1px solid ${layer.accent}28`,
                          flexShrink: 0,
                        }}>
                          <Icon size={13} style={{ color: layer.accent }} aria-hidden="true" />
                        </div>
                        <p style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: layer.accent, fontFamily: "var(--font-mono)", margin: 0 }}>
                          {layer.tier}
                        </p>
                      </div>
                      <p style={{ fontSize: "0.8125rem", lineHeight: 1.55, color: "var(--color-szl-text-secondary)" }}>
                        {layer.description}
                      </p>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
                      {layer.products.map((p) => (
                        <div key={p.name} style={{
                          padding: "0.5rem 0.875rem",
                          borderRadius: "0.5rem",
                          background: `${layer.accent}08`,
                          border: `1px solid ${layer.accent}18`,
                          flex: "0 1 auto",
                        }}>
                          <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(38,8%,88%)", margin: 0 }}>{p.name}</p>
                          <p style={{ fontSize: "0.6875rem", color: "var(--color-szl-text-faint)", margin: "0.125rem 0 0", fontFamily: "var(--font-mono)" }}>{p.note}</p>
                        </div>
                      ))}
                    </div>
                  </m.div>
                );
              })}
            </div>

            <m.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              style={{ marginTop: "1.5rem", textAlign: "center" }}
            >
              <Link
                href="/platform"
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
                Full platform architecture <ChevronRight size={14} aria-hidden="true" />
              </Link>
            </m.div>
          </div>
        </section>

        {/* ── 4. Proof / Evidence Section ─────────────────────────────── */}
        <section
          aria-label="Platform scale and evidence"
          style={{ borderBottom: "1px solid var(--color-szl-border)", background: "hsla(0,0%,100%,0.01)" }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <div style={{ marginBottom: "3rem", maxWidth: "44rem" }}>
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "0.875rem" }}>
                  What's actually been built
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15, color: "hsl(38,8%,94%)", marginBottom: "1rem" }}>
                  Architecture and products built — not vaporware.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)" }}>
                  SZL Holdings is at design-partner stage. Every number below reflects the functional platform as it stands today — not a roadmap, not a pitch deck projection.
                </p>
              </div>
            </m.div>

            <div style={{ display: "grid", gap: "1rem" }} className="sm:grid-cols-2 lg:grid-cols-3">
              {EVIDENCE_STATS.map((stat, i) => (
                <m.div
                  key={stat.label}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  style={{
                    padding: "1.5rem 1.75rem",
                    borderRadius: "0.875rem",
                    background: "hsla(0,0%,100%,0.025)",
                    border: "1px solid hsla(0,0%,100%,0.07)",
                  }}
                >
                  <p style={{ fontSize: "clamp(2rem,4vw,2.75rem)", fontWeight: 700, letterSpacing: "-0.03em", color: "hsl(192,72%,56%)", lineHeight: 1, marginBottom: "0.375rem" }}>
                    {stat.value}
                  </p>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(38,8%,88%)", marginBottom: "0.25rem" }}>
                    {stat.label}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)" }}>
                    {stat.note}
                  </p>
                </m.div>
              ))}
            </div>

            <m.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid hsla(0,0%,100%,0.06)" }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontSize: "0.8125rem", color: "var(--color-szl-text-secondary)", maxWidth: "52ch" }}>
                  Stack: React 19 · TypeScript · Drizzle ORM · PostgreSQL 16 · Express 5 · Expo · Azure · OpenAI · Anthropic · Gemini · OIDC/PKCE · SCIM 2.0
                </p>
                <Link
                  href="/architecture"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.375rem",
                    fontSize: "0.875rem", fontWeight: 500,
                    color: "var(--color-szl-text-secondary)",
                    textDecoration: "none",
                    transition: "color 0.18s ease",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,8%,90%)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; }}
                >
                  Architecture overview <ChevronRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </m.div>
          </div>
        </section>

        {/* ── 5. Governed Decision Loop ───────────────────────────────── */}
        <section
          aria-label="How the governed decision loop works"
          style={{ borderBottom: "1px solid var(--color-szl-border)" }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
            <div style={{ display: "grid", gap: "3rem", alignItems: "center" }} className="lg:grid-cols-2">
              <m.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "0.875rem" }}>
                  The governed decision loop
                </p>
                <h2 style={{ fontSize: "clamp(1.75rem,3vw,2.25rem)", fontWeight: 700, letterSpacing: "-0.022em", lineHeight: 1.12, marginBottom: "1rem", color: "hsl(38,8%,94%)" }}>
                  Nine steps. One governed loop. Every domain.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "1.75rem" }}>
                  Every consequential decision follows the same canonical loop — signal detection, cross-domain context, AI recommendation with provenance, risk simulation, policy enforcement, governed execution, proof recording, outcome tracking, and learning. The domain changes. The governance does not.
                </p>
                <Link
                  href="/how-it-works"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.375rem",
                    fontSize: "0.875rem", fontWeight: 500,
                    color: "var(--color-szl-text-secondary)",
                    textDecoration: "none",
                    border: "1px solid var(--color-szl-border-hover)",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    transition: "color 0.18s ease, border-color 0.18s ease",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,8%,90%)"; (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.25)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-szl-text-secondary)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-szl-border-hover)"; }}
                >
                  How it works <ChevronRight size={14} aria-hidden="true" />
                </Link>
              </m.div>
              <m.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
                <ol style={{ listStyle: "none", padding: 0, margin: 0 }} aria-label="Decision loop steps">
                  {OPERATING_LOOP.map((item, i) => (
                    <li
                      key={item.step}
                      style={{
                        display: "flex", gap: "1.25rem",
                        paddingBottom: i < OPERATING_LOOP.length - 1 ? "1.25rem" : 0,
                        marginBottom: i < OPERATING_LOOP.length - 1 ? "1.25rem" : 0,
                        borderBottom: i < OPERATING_LOOP.length - 1 ? "1px solid hsla(0,0%,100%,0.05)" : "none",
                      }}
                    >
                      <span style={{ fontSize: "0.6875rem", fontFamily: "var(--font-mono)", fontWeight: 600, color: "hsl(192,72%,48%)", paddingTop: "2px", flexShrink: 0, width: "2ch" }} aria-hidden="true">
                        {item.step}
                      </span>
                      <div>
                        <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(38,8%,88%)", marginBottom: "0.25rem" }}>{item.label}</p>
                        <p style={{ fontSize: "0.8125rem", lineHeight: 1.62, color: "var(--color-szl-text-secondary)" }}>{item.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </m.div>
            </div>
          </div>
        </section>

        {/* ── 6. Domain Packs ─────────────────────────────────────────── */}
        <section
          aria-label="Domain packs overview"
          style={{ borderBottom: "1px solid var(--color-szl-border)", background: "hsla(0,0%,100%,0.01)" }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <div style={{ marginBottom: "3rem" }}>
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "0.875rem" }}>
                  Domain packs
                </p>
                <h2 style={{ fontSize: "clamp(1.75rem,3vw,2.25rem)", fontWeight: 700, letterSpacing: "-0.022em", lineHeight: 1.1, color: "hsl(38,8%,94%)", marginBottom: "1rem", maxWidth: "32ch" }}>
                  The same governed loop applied to every high-consequence domain.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", maxWidth: "52ch" }}>
                  Domain packs are not standalone products. They are governed extensions of the SZL platform — same Alloy execution fabric, same Proof Chain audit trail, same RBAC model. Only the domain intelligence layer changes.
                </p>
              </div>
            </m.div>

            <div style={{ display: "grid", gap: "1rem" }} className="md:grid-cols-2">
              {DOMAIN_PACKS.map((pack, i) => {
                const Icon = pack.icon;
                return (
                  <m.div
                    key={pack.slug}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                  >
                    <Link href={pack.href} style={{ display: "block", textDecoration: "none" }} aria-label={`${pack.slug} — ${pack.category}`}>
                      <div
                        style={{
                          padding: "1.75rem",
                          borderRadius: "0.875rem",
                          background: "hsla(0,0%,100%,0.025)",
                          border: "1px solid hsla(0,0%,100%,0.07)",
                          height: "100%",
                          transition: "border-color 0.2s ease, background 0.2s ease",
                        }}
                        onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${pack.color}35`; el.style.background = `${pack.color}06`; }}
                        onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "hsla(0,0%,100%,0.07)"; el.style.background = "hsla(0,0%,100%,0.025)"; }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem", gap: "1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div style={{
                              width: "36px", height: "36px", borderRadius: "0.5rem", flexShrink: 0,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              background: `${pack.color}14`,
                              border: `1px solid ${pack.color}28`,
                            }}>
                              <Icon size={16} style={{ color: pack.color }} aria-hidden="true" />
                            </div>
                            <div>
                              <p style={{ fontSize: "1rem", fontWeight: 600, color: "hsl(38,8%,90%)", margin: 0 }}>{pack.slug}</p>
                              <p style={{ fontSize: "0.6875rem", color: pack.color, fontFamily: "var(--font-mono)", margin: "0.125rem 0 0", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{pack.category}</p>
                            </div>
                          </div>
                          <ChevronRight size={16} style={{ color: "var(--color-szl-text-faint)", flexShrink: 0, marginTop: "2px" }} aria-hidden="true" />
                        </div>
                        <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "var(--color-szl-text-secondary)", marginBottom: "1.25rem" }}>{pack.desc}</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                          {pack.capabilities.map((cap) => (
                            <span key={cap} style={{
                              padding: "0.25rem 0.625rem",
                              borderRadius: "2rem",
                              background: `${pack.color}08`,
                              border: `1px solid ${pack.color}18`,
                              fontSize: "0.6875rem", fontWeight: 500,
                              color: "var(--color-szl-text-faint)",
                              fontFamily: "var(--font-mono)",
                            }}>
                              {cap}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Link>
                  </m.div>
                );
              })}
            </div>

            <m.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              style={{ marginTop: "1.5rem", textAlign: "center" }}
            >
              <Link
                href="/solutions"
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
                All domain packs <ChevronRight size={14} aria-hidden="true" />
              </Link>
            </m.div>
          </div>
        </section>

        {/* ── 7. Why Different ────────────────────────────────────────── */}
        <section
          aria-label="Why governed decision infrastructure is different"
          style={{ borderBottom: "1px solid var(--color-szl-border)" }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <div style={{ marginBottom: "3rem" }}>
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "0.875rem" }}>
                  Why this is different
                </p>
                <h2 style={{ fontSize: "clamp(1.75rem,3vw,2.25rem)", fontWeight: 700, letterSpacing: "-0.022em", lineHeight: 1.1, color: "hsl(38,8%,94%)", marginBottom: "1rem", maxWidth: "32ch" }}>
                  Dashboards show what happened. Copilots suggest what to do. Neither governs the decision.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", maxWidth: "52ch" }}>
                  Enterprise operations have an accountability gap between signal detection and action execution. The gap grows with every AI tool added. This platform closes it structurally.
                </p>
              </div>
            </m.div>

            <div style={{ display: "grid", gap: "1rem" }} className="md:grid-cols-3">
              {[
                {
                  category: "Dashboards",
                  examples: "Datadog, Grafana, New Relic",
                  what: "Show what happened. Monitor signals. Trigger alerts.",
                  gap: "No decision governance. No approval gates. No outcome tracking. The gap between alert and action is informal.",
                  accent: "hsl(215,60%,55%)",
                },
                {
                  category: "AI Copilots",
                  examples: "ChatGPT, Copilot, AI assistants",
                  what: "Generate recommendations. Summarize data. Draft outputs.",
                  gap: "No provenance. No policy enforcement. No confidence calibration. Recommendations without accountability.",
                  accent: "hsl(260,60%,60%)",
                },
                {
                  category: "Workflow Tools",
                  examples: "Zapier, Camunda, n8n",
                  what: "Automate sequences. Connect systems. Execute triggers.",
                  gap: "No governance layer. No simulation. No audit trail on the decision. Execution without attribution.",
                  accent: "hsl(340,52%,55%)",
                },
              ].map((col, i) => (
                <m.div
                  key={col.category}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  style={{
                    padding: "1.75rem",
                    borderRadius: "0.875rem",
                    background: "hsla(0,0%,100%,0.025)",
                    border: "1px solid hsla(0,0%,100%,0.07)",
                  }}
                >
                  <p style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: col.accent, fontFamily: "var(--font-mono)", marginBottom: "0.75rem" }}>
                    {col.category}
                  </p>
                  <p style={{ fontSize: "0.6875rem", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "1rem" }}>
                    {col.examples}
                  </p>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(38,8%,88%)", marginBottom: "0.375rem" }}>
                    What they do
                  </p>
                  <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "var(--color-szl-text-secondary)", marginBottom: "1rem" }}>
                    {col.what}
                  </p>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "hsl(0,72%,68%)", marginBottom: "0.375rem" }}>
                    What they miss
                  </p>
                  <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: "var(--color-szl-text-secondary)" }}>
                    {col.gap}
                  </p>
                </m.div>
              ))}
            </div>

            <m.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              style={{
                marginTop: "2rem",
                padding: "1.25rem 1.75rem",
                borderRadius: "0.75rem",
                background: "hsla(192,72%,48%,0.04)",
                border: "1px solid hsla(192,72%,48%,0.12)",
              }}
            >
              <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "var(--color-szl-text-secondary)" }}>
                <span style={{ fontWeight: 600, color: "hsl(192,72%,56%)" }}>SZL Holdings</span> governs the decision — not just the signal, the model, or the workflow step. The nine-step loop connects signal to outcome with policy gates, simulation, attribution, and proof at every transition. This is a structural difference, not a feature difference.
              </p>
            </m.div>
          </div>
        </section>

        {/* ── 8. Trust / Governance ───────────────────────────────────── */}
        <section
          aria-label="Trust and governance model"
          style={{ borderBottom: "1px solid var(--color-szl-border)" }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
            <div style={{ display: "grid", gap: "3rem", alignItems: "start" }} className="lg:grid-cols-[1fr_1.5fr]">
              <m.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "0.875rem" }}>
                  Trust & governance
                </p>
                <h2 style={{ fontSize: "clamp(1.75rem,3vw,2.25rem)", fontWeight: 700, letterSpacing: "-0.022em", lineHeight: 1.12, marginBottom: "1rem", color: "hsl(38,8%,94%)" }}>
                  Governance is an architecture primitive, not a policy document.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "1.75rem" }}>
                  Every consequential action in the SZL platform passes through the same governance layer — approval gates, policy controls, source attribution, and an immutable audit trail. This is enforced at the workflow level, not bolted on at the UI layer.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  <Link
                    href="/trust"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "0.375rem",
                      fontSize: "0.875rem", fontWeight: 600,
                      color: "hsl(192,72%,48%)",
                      textDecoration: "none",
                      padding: "0.5rem 1rem",
                      border: "1px solid hsla(192,72%,48%,0.3)",
                      borderRadius: "0.375rem",
                      transition: "border-color 0.18s ease, color 0.18s ease",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(192,72%,48%,0.6)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "hsla(192,72%,48%,0.3)"; }}
                  >
                    Trust Center <ExternalLink size={13} aria-hidden="true" />
                  </Link>
                  <Link
                    href="/trust/ai"
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
                    AI governance model <ChevronRight size={13} aria-hidden="true" />
                  </Link>
                </div>
              </m.div>
              <m.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {TRUST_POINTS.map((tp) => {
                    const Icon = tp.icon;
                    return (
                      <div key={tp.label} style={{
                        display: "flex", gap: "1.125rem", alignItems: "flex-start",
                        padding: "1.25rem 1.5rem",
                        borderRadius: "0.75rem",
                        background: "hsla(0,0%,100%,0.025)",
                        border: "1px solid hsla(0,0%,100%,0.07)",
                      }}>
                        <div style={{
                          width: "32px", height: "32px", borderRadius: "0.375rem", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "hsla(192,72%,48%,0.1)",
                          border: "1px solid hsla(192,72%,48%,0.2)",
                        }}>
                          <Icon size={14} style={{ color: "hsl(192,72%,56%)" }} aria-hidden="true" />
                        </div>
                        <div>
                          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "hsl(38,8%,88%)", marginBottom: "0.25rem" }}>{tp.label}</p>
                          <p style={{ fontSize: "0.8125rem", lineHeight: 1.62, color: "var(--color-szl-text-secondary)" }}>{tp.body}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </m.div>
            </div>
          </div>
        </section>

        {/* ── 8. Company / Founder Context ────────────────────────────── */}
        <section
          aria-label="Company and founder context"
          style={{ borderBottom: "1px solid var(--color-szl-border)", background: "hsla(0,0%,100%,0.01)" }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
            <div style={{ display: "grid", gap: "3rem", alignItems: "center" }} className="lg:grid-cols-2">
              <m.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "0.875rem" }}>
                  About SZL Holdings
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15, color: "hsl(38,8%,94%)", marginBottom: "1rem" }}>
                  One governed platform. Not a portfolio of products.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "1.25rem" }}>
                  SZL Holdings is a governed operational intelligence platform founded in 2025. Every surface — Lyte, CORTEX, Aegis, Vessels, Terra, PRISM Counsel, Carlota Jo — shares one governance infrastructure, one design system, one authentication model, and one data layer.
                </p>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", marginBottom: "1.75rem" }}>
                  Adding a new domain pack does not require rebuilding governance. It inherits Alloy, all six platform primitives, CORTEX mobile access, and shared RBAC — automatically.
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
                    About the company <ChevronRight size={13} aria-hidden="true" />
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
                    Founder — Stephen Lutar <ChevronRight size={13} aria-hidden="true" />
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
                    "Design-partner mode — working directly with operators in target domains",
                    "No fabricated logos, no vague 'AI platform' messaging, no feature vaporware",
                    "Founder personally leads every design-partner and investor conversation",
                    "Architecture and all products are functional — not a roadmap pitch",
                    "Pre-seed / design-partner stage. SOC 2 Type II targeted post-funding.",
                  ].map((item, i, arr) => (
                    <div key={item} style={{
                      display: "flex", alignItems: "flex-start", gap: "0.75rem",
                      paddingBottom: i < arr.length - 1 ? "0.875rem" : 0,
                      marginBottom: i < arr.length - 1 ? "0.875rem" : 0,
                      borderBottom: i < arr.length - 1 ? "1px solid hsla(0,0%,100%,0.05)" : "none",
                    }}>
                      <CheckCircle2 size={13} style={{ color: "hsl(152,70%,50%)", marginTop: "2px", flexShrink: 0 }} aria-hidden="true" />
                      <span style={{ fontSize: "0.875rem", lineHeight: 1.58, color: "var(--color-szl-text-secondary)" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </m.div>
            </div>
          </div>
        </section>

        {/* ── 9. Design Partner Program ───────────────────────────────── */}
        <section
          aria-label="Design partner program"
          style={{ borderBottom: "1px solid var(--color-szl-border)" }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <div style={{ marginBottom: "3rem", maxWidth: "42rem" }}>
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginBottom: "0.875rem" }}>
                  Design partner program
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15, color: "hsl(38,8%,94%)", marginBottom: "1rem" }}>
                  Built with operators, not just for them.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)" }}>
                  Design partners get direct access to the founder, early builds, and the ability to shape the product roadmap. We work with operators in security, maritime, real estate, and professional services who want governed operational intelligence as a competitive advantage.
                </p>
              </div>
            </m.div>

            <div style={{ display: "grid", gap: "1.25rem" }} className="md:grid-cols-3">
              {[
                {
                  quote: "The approval latency detection alone would have saved us six figures last quarter. What Lyte does in four minutes took our weekly ops review six days to catch — if we caught it at all.",
                  role: "VP Operations",
                  org: "Mid-market financial services firm",
                  vertical: "Design partner",
                  accent: "hsl(192,72%,48%)",
                },
                {
                  quote: "We've been waiting for a maritime intelligence platform that thinks in behavioral sequences, not just list checks. The pre-designation lead time is the capability that changes how we operate.",
                  role: "Head of Compliance",
                  org: "Bulk carrier operator",
                  vertical: "Design partner",
                  accent: "hsl(215,72%,58%)",
                },
                {
                  quote: "The distress signal aggregation is exactly what we needed. By the time a foreclosure hits public records, the negotiating window is closed. We need to be there 19 days earlier.",
                  role: "Managing Director",
                  org: "Real estate investment manager",
                  vertical: "Design partner",
                  accent: "hsl(142,72%,48%)",
                },
              ].map((t, i) => (
                <m.div
                  key={i}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  style={{
                    padding: "1.75rem",
                    borderRadius: "0.875rem",
                    background: "hsla(0,0%,100%,0.025)",
                    border: "1px solid hsla(0,0%,100%,0.07)",
                  }}
                >
                  <p style={{ fontSize: "0.625rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: t.accent, fontFamily: "var(--font-mono)", marginBottom: "1rem" }}>
                    {t.vertical}
                  </p>
                  <blockquote style={{ fontSize: "0.875rem", lineHeight: 1.7, color: "var(--color-szl-text-secondary)", fontStyle: "italic", marginBottom: "1.25rem", borderLeft: `2px solid ${t.accent}30`, paddingLeft: "1rem" }}>
                    "{t.quote}"
                  </blockquote>
                  <div>
                    <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "hsl(38,8%,80%)" }}>{t.role}</p>
                    <p style={{ fontSize: "0.6875rem", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", marginTop: "0.125rem" }}>{t.org}</p>
                  </div>
                </m.div>
              ))}
            </div>

            <m.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              style={{ marginTop: "2.5rem", paddingTop: "2rem", borderTop: "1px solid hsla(0,0%,100%,0.06)" }}
            >
              <p style={{ fontSize: "0.6875rem", color: "var(--color-szl-text-faint)", fontFamily: "var(--font-mono)", textAlign: "center", marginBottom: "1.5rem", letterSpacing: "0.08em" }}>
                Active design partner sectors — names withheld at participant request
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
                {["Financial Services", "Maritime Operations", "Real Estate Investment", "Cybersecurity", "Legal Operations", "Private Advisory"].map((sector) => (
                  <div key={sector} style={{
                    padding: "0.5rem 1.25rem",
                    borderRadius: "2rem",
                    background: "hsla(0,0%,100%,0.03)",
                    border: "1px solid hsla(0,0%,100%,0.08)",
                    fontSize: "0.6875rem",
                    color: "var(--color-szl-text-faint)",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.06em",
                  }}>
                    {sector}
                  </div>
                ))}
              </div>
            </m.div>
          </div>
        </section>

        {/* ── 10. Newsletter ──────────────────────────────────────────── */}
        <NewsletterSection />

        {/* ── 11. Demo CTA ────────────────────────────────────────────── */}
        <section
          aria-label="Request a demo"
          style={{ borderBottom: "1px solid var(--color-szl-border)", background: "hsla(192,72%,48%,0.02)" }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(4rem,8vw,6rem) var(--space-content-x)" }}>
            <m.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              style={{
                borderRadius: "1rem",
                border: "1px solid hsla(192,72%,48%,0.18)",
                padding: "clamp(2rem,5vw,3.5rem)",
                background: "hsla(0,0%,100%,0.025)",
                display: "grid",
                gap: "2rem",
                alignItems: "center",
              }}
              className="lg:grid-cols-[1fr_auto]"
            >
              <div>
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(192,72%,48%)", fontFamily: "var(--font-mono)", marginBottom: "1rem" }}>
                  Three ways to engage
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.25rem)", fontWeight: 700, letterSpacing: "-0.022em", lineHeight: 1.12, color: "hsl(38,8%,94%)", marginBottom: "1rem" }}>
                  Ready to see the platform?
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "var(--color-szl-text-secondary)", maxWidth: "48ch" }}>
                  Request a product demo, join the design partner program to work with us directly, or open a diligence conversation. Every engagement is handled by the founder.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", minWidth: "200px" }}>
                <Link
                  href="/demo"
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
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
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
                <Link
                  href="/design-partner"
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
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
                  Design partner inquiry
                </Link>
                <Link
                  href="/contact"
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
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
                  Enterprise diligence
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
