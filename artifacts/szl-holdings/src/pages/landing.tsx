import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { m, useInView } from "framer-motion";
import {
  ArrowRight, Eye, Zap, Shield, CheckCircle2, Activity, Lock,
  Database, Layers, Users, TrendingUp, Ship, Building2, Briefcase,
  ShieldCheck, GitBranch, BarChart3, FileCheck, Brain, Radio,
  Target, BookOpen, ChevronRight, ArrowUpRight, Star, Handshake,
  ExternalLink, Code2,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { analytics } from "@/lib/analytics";
import { NewsletterSubscribe } from "@szl-holdings/shared-ui";

const BG = "hsl(214,16%,4%)";
const BORDER = "hsla(0,0%,100%,0.07)";
const SURFACE = "hsla(0,0%,100%,0.035)";
const TEXT = "hsl(38,8%,94%)";
const TEXT_SEC = "hsl(214,7%,60%)";
const TEXT_FAINT = "hsl(214,7%,38%)";
const LYTE = "hsl(192,72%,48%)";
const MONO = "var(--font-mono)";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  }),
};

const LOOP_STEPS = [
  { n: "01", label: "Signal", icon: Radio, color: "#0ea5e9", body: "Risk indicators, anomalies, and threshold breaches are detected, normalized, and routed by the Event Fabric — cross-domain context and correlation ID attached." },
  { n: "02", label: "Context", icon: Layers, color: "#8b5cf6", body: "Cross-domain enrichment via Prism Bus. A sanctions alert in Vessels triggers a legal flag in PRISM Counsel, a risk entry in Lyte." },
  { n: "03", label: "Recommendation", icon: Brain, color: "#ec4899", body: "An AI agent proposes an action with source citations, confidence score, and full provenance. No opaque verdicts. Every output traceable." },
  { n: "04", label: "Simulation", icon: BarChart3, color: "#f59e0b", body: "The Monte Carlo engine models risk before action. Operators see expected outcomes, confidence intervals, and the variables that matter most." },
  { n: "05", label: "Policy", icon: ShieldCheck, color: "#10b981", body: "Covenant Policy enforces who can approve and what conditions apply — at the platform layer, not the UI. Non-delegatable." },
  { n: "06", label: "Execution", icon: Zap, color: "#6366f1", body: "Alloy orchestrates the approved action as a durable, multi-step process with checkpoint recovery and agent coordination." },
  { n: "07", label: "Proof", icon: FileCheck, color: "#14b8a6", body: "The Proof Chain records the complete trail: signal, recommendation, simulation, policy decision, approval, execution. Immutable and queryable." },
  { n: "08", label: "Outcome", icon: Target, color: "#ef4444", body: "The Outcome Graph records the real-world result. Was the action effective? The data calibrates future AI confidence scores." },
  { n: "09", label: "Learning", icon: BookOpen, color: "#f97316", body: "Historical outcomes feed back into simulation models and agent confidence calibration. The platform improves with every governed decision." },
];

const PLATFORM_TIERS = [
  {
    tier: "Layer 01",
    title: "Platform Command",
    color: LYTE,
    note: "Operator-facing command surfaces",
    items: [
      { name: "Lyte", note: "Operational nerve center — signal stream, situation board, governed action panel" },
      { name: "CORTEX", note: "Mobile command — all domains, biometric auth, iOS + Android" },
      { name: "Command Portal", note: "Ecosystem hub — cross-domain oversight" },
    ],
  },
  {
    tier: "Layer 02",
    title: "Execution Fabric + Primitives",
    color: "hsl(215,72%,58%)",
    note: "Shared governance infrastructure",
    items: [
      { name: "Alloy", note: "Workflow orchestration and governed execution" },
      { name: "Outcome Graph", note: "Decision lifecycle and consequence measurement" },
      { name: "Proof Chain", note: "Immutable AI provenance and audit trail" },
      { name: "Covenant Policy", note: "Human-in-the-loop governance at the platform layer" },
      { name: "Simulation Engine", note: "Probabilistic risk modeling before action" },
      { name: "Event Fabric", note: "Cross-domain signal backbone" },
    ],
  },
  {
    tier: "Layer 03",
    title: "Domain Packs",
    color: "hsl(260,60%,65%)",
    note: "Vertical intelligence extensions",
    items: [
      { name: "Aegis", note: "Security & defense — SOC, XDR, MITRE ATT&CK, threat intelligence" },
      { name: "Vessels", note: "Maritime — fleet command, AIS, sanctions, voyage economics" },
      { name: "Terra", note: "Real estate — distress signals, deal pipeline, ownership graph" },
      { name: "PRISM Counsel", note: "Legal — matter command, deadline tracking, governed demand" },
      { name: "Carlota Jo", note: "Advisory — discreet intake, managed delivery, governed delivery" },
      { name: "IMPERIUM", note: "Cloud sovereignty — multi-cloud governance, policy enforcement" },
    ],
  },
];

const DOMAIN_PACKS = [
  {
    icon: ShieldCheck,
    slug: "Aegis",
    category: "Security & Defense",
    desc: "SOC command, threat intelligence, MITRE ATT&CK mapping, and SOAR playbooks for environments where every decision has consequence. Policy-gated, fully audited.",
    color: "hsl(222,60%,60%)",
    href: "/solutions/aegis",
    capabilities: ["Threat classification", "SOC workflow", "AI triage with approval gates", "Compliance audit trail"],
  },
  {
    icon: Ship,
    slug: "Vessels",
    category: "Maritime Intelligence",
    desc: "Fleet command, AIS telemetry, voyage economics, dark vessel detection, and sanctions screening for fleet operators. Same proof chain, maritime intelligence layer.",
    color: "hsl(206,72%,54%)",
    href: "/solutions/vessels",
    capabilities: ["Real-time AIS telemetry", "Voyage P&L", "Dark vessel detection", "Sanctions screening"],
  },
  {
    icon: Building2,
    slug: "Terra",
    category: "Real Estate Intelligence",
    desc: "NYC distress property pipeline, ownership entity graph, deal pipeline, and broker workflow. Data-rich intelligence with a governed underwriting flow.",
    color: "hsl(142,52%,48%)",
    href: "/solutions/terra",
    capabilities: ["Distress signal detection", "Ownership graph", "Deal pipeline", "Acquisition approval gates"],
  },
  {
    icon: Briefcase,
    slug: "PRISM Counsel",
    category: "Legal Intelligence",
    desc: "Matter twins, deadline tracking, and governed demand workflows for litigation teams. Governed legal operations with approval gates and Proof Chain.",
    color: "hsl(260,60%,65%)",
    href: "/solutions/prism-counsel",
    capabilities: ["Matter lifecycle command", "Deadline tracking", "Evidence-assisted review", "Immutable audit trail"],
  },
  {
    icon: Users,
    slug: "Carlota Jo",
    category: "Premium Advisory",
    desc: "Discreet client intake, managed service delivery, and advisory operations for UHNW principals. Governance-grade document handling and audit trail.",
    color: "hsl(340,52%,60%)",
    href: "/solutions/carlota-jo",
    capabilities: ["Client intake & onboarding", "Service catalog", "Secure document delivery", "Advisory audit trail"],
  },
  {
    icon: Eye,
    slug: "IMPERIUM",
    category: "Cloud Sovereignty",
    desc: "Multi-cloud governance, policy enforcement, and cloud estate visibility — the same governance primitives applied to infrastructure control and compliance.",
    color: "hsl(25,72%,54%)",
    href: "/solutions/imperium",
    capabilities: ["Cloud policy enforcement", "Multi-cloud visibility", "Configuration drift detection", "Infrastructure audit trail"],
  },
];

const TRUST_PRINCIPLES = [
  { icon: Lock, title: "Human-in-the-loop enforced", body: "Approval controls on every consequential action. No autonomous execution without review — enforced at the workflow layer, not the UI." },
  { icon: Database, title: "Source attribution on every output", body: "Every AI recommendation includes model identity, source citations, and confidence score. No opaque verdicts. Full Proof Drawer visibility." },
  { icon: Activity, title: "Immutable audit trail", body: "The Proof Chain records every action, approval, and inference — append-only, tamper-resistant, queryable by actor, action, and time." },
  { icon: Shield, title: "Policy-gated governance", body: "Covenant Policy enforces who can act, when, and under what conditions. Governance is an architecture primitive, not a compliance afterthought." },
];

const EVIDENCE_STATS = [
  { value: "700+", label: "Database tables", note: "116 schema files" },
  { value: "40+", label: "Shared packages", note: "pnpm monorepo" },
  { value: "15", label: "Active artifacts", note: "web, mobile, API" },
  { value: "11", label: "RBAC roles", note: "tenant isolation" },
  { value: "9", label: "Decision stages", note: "governed loop" },
  { value: "6", label: "Platform primitives", note: "all surfaces share" },
];

const AUDIENCE_PATHS = [
  { icon: TrendingUp, label: "Executive buyer", desc: "Value prop, ROI frame, and design-partner path.", href: "/platform", accent: "hsl(192,72%,48%)" },
  { icon: Code2, label: "Technical evaluator", desc: "Architecture, stack, and integration surface.", href: "/architecture", accent: "hsl(215,60%,60%)" },
  { icon: Shield, label: "Security reviewer", desc: "Controls, AI governance, and audit trail.", href: "/trust", accent: "hsl(340,60%,58%)" },
  { icon: Handshake, label: "Design partner", desc: "Work directly with the founding team.", href: "/design-partner", accent: "hsl(38,72%,58%)" },
  { icon: BarChart3, label: "Investor", desc: "Market thesis, moat, and data room.", href: "/investor", accent: "hsl(145,60%,50%)" },
];

function NewsletterSection() {
  return (
    <section style={{ borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(3rem,6vw,4rem) var(--space-content-x)" }}>
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <NewsletterSubscribe
            variant="banner"
            utmSource="szl-holdings"
            heading="Governed intelligence, operational AI, and the SZL thesis."
            subheading="Founder-written analysis on the ideas shaping enterprise operations. No digest, no filler — published when it's worth reading."
          />
        </m.div>
      </div>
    </section>
  );
}

export default function HomePage() {
  usePageMeta({
    title: "SZL Holdings — Governed Decision Operating System",
    description: "SZL Holdings builds a governed decision operating system for high-consequence enterprise environments. Nine-stage decision loop, full AI provenance, and immutable audit trail — across every domain pack.",
    canonical: "https://szlholdings.com",
  });

  const [activeLoopStep, setActiveLoopStep] = useState(0);
  const loopRef = useRef<HTMLDivElement>(null);
  const loopIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loopInView = useInView(loopRef, { once: true, amount: 0.25 });
  const [hasAutoAdvanced, setHasAutoAdvanced] = useState(false);

  const handleStepClick = (i: number) => {
    if (loopIntervalRef.current) {
      clearInterval(loopIntervalRef.current);
      loopIntervalRef.current = null;
    }
    setActiveLoopStep(i);
  };

  useEffect(() => {
    if (!loopInView || hasAutoAdvanced) return;
    setHasAutoAdvanced(true);
    let step = 0;
    loopIntervalRef.current = setInterval(() => {
      step += 1;
      if (step >= LOOP_STEPS.length) {
        if (loopIntervalRef.current) clearInterval(loopIntervalRef.current);
        return;
      }
      setActiveLoopStep(step);
    }, 480);
    return () => { if (loopIntervalRef.current) clearInterval(loopIntervalRef.current); };
  }, [loopInView, hasAutoAdvanced]);

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT }}>
      <SiteNav />
      <main id="main-content">

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section
          className="szl-grid-texture"
          style={{
            borderBottom: `1px solid ${BORDER}`,
            paddingTop: "var(--space-hero-pt)",
            paddingBottom: "clamp(5rem,9vw,7rem)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)", width: "900px", height: "500px", borderRadius: "50%", background: "radial-gradient(ellipse at center, hsla(192,72%,48%,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.75rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_FAINT }}>
                  SZL Holdings
                </span>
                <span style={{ width: 1, height: 12, background: BORDER }} />
                <span style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: LYTE }}>
                  Governed Decision Operating System
                </span>
              </div>

              <h1 style={{
                fontSize: "clamp(3rem,6vw,5rem)",
                fontWeight: 700,
                letterSpacing: "-0.035em",
                lineHeight: 1.02,
                maxWidth: "22ch",
                marginBottom: "1.5rem",
                color: TEXT,
              }}>
                The governed infrastructure for high-consequence decisions.
              </h1>

              <p style={{
                fontSize: "clamp(1rem,1.8vw,1.125rem)",
                lineHeight: 1.72,
                color: TEXT_SEC,
                maxWidth: "54ch",
                marginBottom: "0.875rem",
              }}>
                Governed decision operating system for enterprise operations. Not a dashboard. Not an AI copilot. The structural layer between signal detection and action execution — with governance, attribution, and outcome tracking on every decision that matters.
              </p>

              <p style={{
                fontSize: "0.6875rem",
                fontFamily: MONO,
                letterSpacing: "0.04em",
                color: LYTE,
                marginBottom: "1.5rem",
              }}>
                Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning
              </p>

              {/* Platform hierarchy pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "2.5rem", alignItems: "center" }}>
                {[
                  { label: "SZL Holdings", note: "governed platform", color: "hsl(38,72%,58%)" },
                  { label: "Alloy", note: "execution fabric", color: "hsl(215,72%,58%)" },
                  { label: "Lyte", note: "flagship command", color: "hsl(192,72%,48%)" },
                  { label: "Aegis · Vessels · Terra · PRISM · CJ · IMPERIUM", note: "domain packs", color: "hsl(260,60%,65%)" },
                ].map((item, i) => (
                  <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {i > 0 && <span style={{ color: "hsla(0,0%,100%,0.2)", fontSize: "0.75rem" }}>→</span>}
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
                      <span style={{ fontSize: "0.625rem", fontWeight: 400, color: `${item.color}99`, fontFamily: MONO }}>{item.note}</span>
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <Link
                  href="/demo"
                  onClick={() => { analytics.heroCTAClick("request-demo", "hero"); analytics.demoRequest("hero"); }}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.875rem 1.75rem",
                    background: LYTE,
                    color: "hsl(214,18%,4%)",
                    borderRadius: "0.375rem",
                    fontSize: "0.9375rem", fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Request a demo <ArrowRight size={15} />
                </Link>
                <Link
                  href="/lyte"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.875rem 1.75rem",
                    background: "transparent",
                    color: TEXT_SEC,
                    border: `1px solid ${BORDER}`,
                    borderRadius: "0.375rem",
                    fontSize: "0.9375rem", fontWeight: 500,
                    textDecoration: "none",
                  }}
                >
                  See Lyte — the nerve center <ArrowUpRight size={14} />
                </Link>
                <Link
                  href="/design-partner"
                  onClick={() => analytics.designPartnerInterest("hero")}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.875rem 1.75rem",
                    background: "transparent",
                    color: TEXT_SEC,
                    border: `1px solid ${BORDER}`,
                    borderRadius: "0.375rem",
                    fontSize: "0.9375rem", fontWeight: 500,
                    textDecoration: "none",
                  }}
                >
                  <Handshake size={15} />
                  Become a design partner
                </Link>
              </div>
            </m.div>

            {/* Stat strip */}
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{ display: "flex", gap: "1px", background: BORDER, borderRadius: "8px", overflow: "hidden", border: `1px solid ${BORDER}`, marginTop: "4rem" }}
            >
              {EVIDENCE_STATS.map((s, i) => (
                <div key={i} style={{ flex: 1, background: BG, padding: "1rem 0.875rem", textAlign: "center" }}>
                  <p style={{ fontSize: "1.25rem", fontWeight: 700, fontFamily: MONO, color: LYTE, margin: 0 }}>{s.value}</p>
                  <p style={{ fontSize: "0.625rem", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT_FAINT, margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </m.div>
          </div>
        </section>

        {/* ── Audience Paths ───────────────────────────────────────── */}
        <section style={{ borderBottom: `1px solid ${BORDER}`, background: "hsla(0,0%,100%,0.015)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(2.5rem,4vw,3rem) var(--space-content-x)" }}>
            <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: TEXT_FAINT, fontFamily: MONO, marginBottom: "1.5rem" }}>
              Where do you start?
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem" }}>
              {AUDIENCE_PATHS.map((path, i) => {
                const Icon = path.icon;
                return (
                  <m.div
                    key={path.label}
                    custom={i}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.2 }}
                    whileHover={{ y: -3, boxShadow: `0 8px 32px hsla(0,0%,0%,0.3), 0 0 0 1px ${path.accent}30`, transition: { duration: 0.15, ease: "easeOut" } }}
                    transition={{ duration: 0.45, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={path.href}
                      onClick={() => analytics.audiencePathClick(path.label, path.href)}
                      style={{ display: "block", textDecoration: "none" }}
                    >
                      <div style={{
                        padding: "1.25rem",
                        borderRadius: "0.75rem",
                        background: SURFACE,
                        border: `1px solid ${BORDER}`,
                      }}>
                        <div style={{ width: 32, height: 32, borderRadius: "0.5rem", background: `${path.accent}14`, border: `1px solid ${path.accent}28`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.75rem" }}>
                          <Icon size={15} style={{ color: path.accent }} />
                        </div>
                        <p style={{ fontSize: "0.875rem", fontWeight: 600, color: TEXT, margin: "0 0 0.3rem" }}>{path.label}</p>
                        <p style={{ fontSize: "0.8125rem", lineHeight: 1.5, color: TEXT_SEC, margin: 0 }}>{path.desc}</p>
                      </div>
                    </Link>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Decision Loop Visualization ──────────────────────────── */}
        <section ref={loopRef} style={{ borderBottom: `1px solid ${BORDER}`, padding: "clamp(4rem,8vw,5.5rem) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }} style={{ marginBottom: "3rem" }}>
              <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: LYTE, marginBottom: "0.75rem" }}>
                The Decision Loop
              </p>
              <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.625rem)", fontWeight: 700, letterSpacing: "-0.026em", color: TEXT, maxWidth: "28ch", marginBottom: "1rem" }}>
                Nine stages. Every decision. Fully traced.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: TEXT_SEC, maxWidth: "50ch" }}>
                From the first signal to the last measured outcome — every stage is governed, attributed, and recorded. This is the loop that every SZL product runs on. Not a concept. An architecture.
              </p>
            </m.div>

            {/* Step progress strip */}
            <div style={{ display: "flex", gap: "3px", marginBottom: "1.75rem" }}>
              {LOOP_STEPS.map((step, i) => (
                <m.div
                  key={step.n}
                  onClick={() => handleStepClick(i)}
                  style={{
                    flex: 1, height: "3px", borderRadius: "2px", cursor: "pointer",
                    background: i <= activeLoopStep ? step.color : "hsla(0,0%,100%,0.08)",
                    transition: "background 0.3s ease",
                  }}
                  whileHover={{ scaleY: 1.5 }}
                />
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start" }}>
              {/* Step selector */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                {LOOP_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <m.button
                      key={step.n}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: i * 0.04 }}
                      onClick={() => handleStepClick(i)}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.75rem",
                        padding: "0.75rem 1rem",
                        borderRadius: "7px",
                        background: activeLoopStep === i ? `${step.color}10` : "transparent",
                        border: `1px solid ${activeLoopStep === i ? step.color + "28" : "transparent"}`,
                        cursor: "pointer", textAlign: "left",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: `${step.color}18`, border: `1px solid ${step.color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={13} style={{ color: step.color }} />
                      </div>
                      <span style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: activeLoopStep === i ? TEXT : TEXT_FAINT, flex: 1 }}>
                        {step.n} · {step.label}
                      </span>
                      {activeLoopStep === i && <ChevronRight size={12} style={{ color: step.color }} />}
                    </m.button>
                  );
                })}
              </div>

              {/* Step detail */}
              <div style={{ position: "sticky", top: "5rem" }}>
                {(() => {
                  const step = LOOP_STEPS[activeLoopStep];
                  const Icon = step.icon;
                  return (
                    <m.div
                      key={step.n}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{
                        padding: "2rem",
                        borderRadius: "10px",
                        background: `${step.color}07`,
                        border: `1px solid ${step.color}20`,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "1.25rem" }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, background: `${step.color}18`, border: `1px solid ${step.color}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon size={20} style={{ color: step.color }} />
                        </div>
                        <div>
                          <p style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: step.color, margin: 0 }}>Stage {step.n}</p>
                          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.018em", color: TEXT, margin: 0 }}>{step.label}</h3>
                        </div>
                      </div>
                      <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: TEXT_SEC, marginBottom: "1.5rem" }}>{step.body}</p>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        {activeLoopStep > 0 && (
                          <button onClick={() => handleStepClick(Math.max(0, activeLoopStep - 1))} style={{ padding: "0.375rem 0.75rem", borderRadius: 5, background: "transparent", border: `1px solid ${BORDER}`, cursor: "pointer", fontSize: "0.75rem", color: TEXT_FAINT }}>
                            ← Previous
                          </button>
                        )}
                        {activeLoopStep < LOOP_STEPS.length - 1 && (
                          <button onClick={() => handleStepClick(Math.min(LOOP_STEPS.length - 1, activeLoopStep + 1))} style={{ padding: "0.375rem 0.75rem", borderRadius: 5, background: `${step.color}15`, border: `1px solid ${step.color}25`, cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, color: step.color }}>
                            Next: {LOOP_STEPS[activeLoopStep + 1].label} →
                          </button>
                        )}
                      </div>
                    </m.div>
                  );
                })()}
              </div>
            </div>
          </div>
        </section>

        {/* ── Platform Hierarchy ──────────────────────────────────── */}
        <section style={{ borderBottom: `1px solid ${BORDER}`, padding: "clamp(4rem,8vw,5.5rem) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }} style={{ marginBottom: "3rem" }}>
              <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_FAINT, marginBottom: "0.75rem" }}>
                Platform Architecture
              </p>
              <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 700, letterSpacing: "-0.026em", color: TEXT, maxWidth: "28ch", marginBottom: "1rem" }}>
                Three layers. One governed system.
              </h2>
              <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: TEXT_SEC, maxWidth: "50ch" }}>
                The platform is not a collection of products. It is a single governed system — command surfaces, execution fabric, and domain packs — all running on the same decision loop, same policy engine, and same proof chain.
              </p>
            </m.div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: BORDER, borderRadius: "10px", overflow: "hidden", border: `1px solid ${BORDER}` }}>
              {PLATFORM_TIERS.map((tier, i) => (
                <m.div
                  key={tier.tier}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  style={{ background: BG, padding: "2rem 1.75rem" }}
                >
                  <p style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: tier.color, marginBottom: "0.625rem" }}>
                    {tier.tier}
                  </p>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, letterSpacing: "-0.012em", color: TEXT, marginBottom: "1.125rem" }}>{tier.title}</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
                    {tier.items.map((item, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: tier.color, flexShrink: 0, marginTop: "6px", opacity: 0.7 }} />
                        <div>
                          <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: TEXT }}>{item.name}</span>
                          <span style={{ fontSize: "0.75rem", color: TEXT_FAINT, marginLeft: "0.5rem" }}>{item.note}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: "0.6875rem", fontFamily: MONO, color: TEXT_FAINT, margin: 0 }}>{tier.note}</p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Domain Packs ────────────────────────────────────────── */}
        <section style={{ borderBottom: `1px solid ${BORDER}`, padding: "clamp(4rem,8vw,5.5rem) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }} style={{ marginBottom: "3rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1.5rem" }}>
              <div>
                <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_FAINT, marginBottom: "0.75rem" }}>
                  Domain Packs
                </p>
                <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 700, letterSpacing: "-0.026em", color: TEXT, maxWidth: "26ch" }}>
                  Vertical intelligence built on shared governance.
                </h2>
              </div>
              <Link href="/solutions" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", fontWeight: 600, color: LYTE, textDecoration: "none" }}>
                All domain packs <ArrowRight size={13} />
              </Link>
            </m.div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {DOMAIN_PACKS.map((pack, i) => {
                const Icon = pack.icon;
                return (
                  <m.div
                    key={pack.slug}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    whileHover={{ y: -4, boxShadow: `0 12px 40px hsla(0,0%,0%,0.35), 0 0 0 1px ${pack.color}25`, transition: { duration: 0.18, ease: "easeOut" } }}
                    transition={{ duration: 0.38, delay: i * 0.055, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      padding: "1.5rem",
                      borderRadius: "10px",
                      background: SURFACE,
                      border: `1px solid ${BORDER}`,
                      display: "flex", flexDirection: "column",
                      cursor: "default",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, ${pack.color}90, ${pack.color}20)`, borderRadius: "10px 10px 0 0" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: `${pack.color}18`, border: `1px solid ${pack.color}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={15} style={{ color: pack.color }} />
                      </div>
                      <div>
                        <p style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: pack.color, margin: 0 }}>{pack.category}</p>
                        <p style={{ fontSize: "0.9375rem", fontWeight: 700, letterSpacing: "-0.014em", color: TEXT, margin: 0 }}>{pack.slug}</p>
                      </div>
                    </div>
                    <p style={{ fontSize: "0.875rem", lineHeight: 1.68, color: TEXT_SEC, marginBottom: "1.125rem", flex: 1 }}>{pack.desc}</p>
                    <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", marginBottom: "1.125rem" }}>
                      {pack.capabilities.map(cap => (
                        <span key={cap} style={{ fontSize: "0.6rem", fontFamily: MONO, fontWeight: 700, color: TEXT_FAINT, background: "hsla(0,0%,100%,0.04)", border: `1px solid ${BORDER}`, padding: "2px 6px", borderRadius: 3 }}>
                          {cap}
                        </span>
                      ))}
                    </div>
                    <Link
                      href={pack.href}
                      onClick={() => analytics.domainPackViewed(pack.slug, "/")}
                      style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", fontWeight: 600, color: pack.color, textDecoration: "none" }}
                    >
                      Learn more <ArrowRight size={12} />
                    </Link>
                  </m.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Competitive Comparison ───────────────────────────────── */}
        <section style={{ borderBottom: `1px solid ${BORDER}`, padding: "clamp(4rem,8vw,5.5rem) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }} style={{ marginBottom: "3rem" }}>
              <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_FAINT, marginBottom: "0.75rem" }}>
                Why SZL
              </p>
              <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 700, letterSpacing: "-0.026em", color: TEXT, maxWidth: "32ch", marginBottom: "1rem" }}>
                What dashboards, AI copilots, and workflow tools miss.
              </h2>
            </m.div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
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
                  viewport={{ once: true, amount: 0.2 }}
                  whileHover={{ y: -4, boxShadow: `0 16px 48px hsla(0,0%,0%,0.4), 0 0 0 1px ${col.accent}22`, transition: { duration: 0.16, ease: "easeOut" } }}
                  transition={{ duration: 0.45, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    padding: "1.75rem",
                    borderRadius: "0.875rem",
                    background: SURFACE,
                    border: `1px solid ${BORDER}`,
                    position: "relative",
                    overflow: "hidden",
                    cursor: "default",
                  }}
                >
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${col.accent}, ${col.accent}30)` }} />
                  <p style={{ fontSize: "0.625rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: col.accent, fontFamily: MONO, marginBottom: "0.5rem" }}>
                    {col.category}
                  </p>
                  <p style={{ fontSize: "0.6875rem", color: TEXT_FAINT, fontFamily: MONO, marginBottom: "1.25rem" }}>{col.examples}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                    <div style={{ padding: "0.875rem", borderRadius: "0.5rem", background: "hsla(0,0%,100%,0.025)", border: `1px solid ${BORDER}` }}>
                      <p style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: TEXT_FAINT, fontFamily: MONO, marginBottom: "0.375rem" }}>What they do</p>
                      <p style={{ fontSize: "0.8125rem", lineHeight: 1.62, color: TEXT_SEC, margin: 0 }}>{col.what}</p>
                    </div>
                    <div style={{ padding: "0.875rem", borderRadius: "0.5rem", background: "hsla(0,60%,40%,0.06)", border: "1px solid hsla(0,60%,50%,0.14)" }}>
                      <p style={{ fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "hsl(0,72%,68%)", fontFamily: MONO, marginBottom: "0.375rem" }}>The gap</p>
                      <p style={{ fontSize: "0.8125rem", lineHeight: 1.62, color: TEXT_SEC, margin: 0 }}>{col.gap}</p>
                    </div>
                  </div>
                </m.div>
              ))}
            </div>

            <m.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              style={{ padding: "1.25rem 1.75rem", borderRadius: "0.75rem", background: "hsla(192,72%,48%,0.04)", border: "1px solid hsla(192,72%,48%,0.12)" }}
            >
              <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: TEXT_SEC }}>
                <span style={{ fontWeight: 600, color: "hsl(192,72%,56%)" }}>SZL Holdings</span> governs the decision — not just the signal, the model, or the workflow step. The nine-step loop connects signal to outcome with policy gates, simulation, attribution, and proof at every transition. This is a structural difference, not a feature difference.
              </p>
            </m.div>
          </div>
        </section>

        {/* ── Trust Architecture ──────────────────────────────────── */}
        <section style={{ borderBottom: `1px solid ${BORDER}`, padding: "clamp(4rem,8vw,5.5rem) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(3rem,6vw,5rem)", alignItems: "center" }}>
              <m.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_FAINT, marginBottom: "0.75rem" }}>
                  Trust Architecture
                </p>
                <h2 style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", fontWeight: 700, letterSpacing: "-0.026em", color: TEXT, maxWidth: "26ch", marginBottom: "1rem" }}>
                  Governance is not a compliance add-on. It's an architecture primitive.
                </h2>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: TEXT_SEC, maxWidth: "44ch", marginBottom: "1.75rem" }}>
                  Every consequential action in the SZL platform passes through the same governance layer — approval gates, policy controls, source attribution, and an immutable audit trail. Enforced at the workflow level, not bolted on at the UI layer.
                </p>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <Link
                    href="/trust"
                    onClick={() => analytics.trustCenterView("trust-section", "/")}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "0.375rem",
                      fontSize: "0.875rem", fontWeight: 600, color: LYTE,
                      textDecoration: "none", padding: "0.5rem 1rem",
                      border: "1px solid hsla(192,72%,48%,0.3)", borderRadius: "0.375rem",
                    }}
                  >
                    Trust Center <ExternalLink size={13} />
                  </Link>
                  <Link
                    href="/trust/ai"
                    onClick={() => analytics.trustCenterView("trust-ai-governance", "/")}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "0.375rem",
                      fontSize: "0.875rem", fontWeight: 500, color: TEXT_SEC,
                      textDecoration: "none", padding: "0.5rem 1rem",
                      border: `1px solid ${BORDER}`, borderRadius: "0.375rem",
                    }}
                  >
                    AI governance model <ChevronRight size={13} />
                  </Link>
                  <Link href="/docs/proof-chain" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", background: "transparent", color: TEXT_SEC, border: `1px solid ${BORDER}`, borderRadius: 6, fontSize: "0.875rem", fontWeight: 500, textDecoration: "none" }}>
                    Proof Chain docs
                  </Link>
                </div>
              </m.div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                {TRUST_PRINCIPLES.map((tp, i) => {
                  const Icon = tp.icon;
                  return (
                    <m.div
                      key={tp.title}
                      initial={{ opacity: 0, x: 14 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      whileHover={{ x: 3, boxShadow: "0 4px 24px hsla(0,0%,0%,0.25)", transition: { duration: 0.15, ease: "easeOut" } }}
                      transition={{ duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                      style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem", padding: "1.125rem 1.25rem", borderRadius: "8px", background: SURFACE, border: `1px solid ${BORDER}`, cursor: "default" }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 7, background: "hsla(142,60%,48%,0.12)", border: "1px solid hsla(142,60%,48%,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={14} style={{ color: "hsl(142,60%,48%)" }} />
                      </div>
                      <div>
                        <p style={{ fontSize: "0.875rem", fontWeight: 700, color: TEXT, marginBottom: "0.3rem" }}>{tp.title}</p>
                        <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: TEXT_SEC, margin: 0 }}>{tp.body}</p>
                      </div>
                    </m.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── Lyte CTA ────────────────────────────────────────────── */}
        <section style={{ borderBottom: `1px solid ${BORDER}`, padding: "clamp(4rem,8vw,5.5rem) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              style={{
                display: "grid", gridTemplateColumns: "1fr auto", gap: "3rem", alignItems: "center",
                padding: "3rem 3.5rem",
                borderRadius: "12px",
                background: `linear-gradient(135deg, hsla(192,72%,48%,0.07) 0%, hsla(215,72%,58%,0.04) 100%)`,
                border: `1px solid ${LYTE}20`,
              }}
            >
              <div>
                <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: LYTE, marginBottom: "0.75rem" }}>
                  Lyte — Operational Nerve Center
                </p>
                <h3 style={{ fontSize: "clamp(1.5rem,3vw,2.25rem)", fontWeight: 700, letterSpacing: "-0.022em", color: TEXT, marginBottom: "1rem", maxWidth: "30ch" }}>
                  The command surface that sees everything — and routes it to the right action.
                </h3>
                <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: TEXT_SEC, maxWidth: "50ch", marginBottom: 0 }}>
                  Persistent signal stream. Live situation board. Decision Theater with full nine-stage flow. Signal Fusion, Decision Schemas, Governance Posture. All in one governed command surface.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", flexShrink: 0 }}>
                <Link
                  href="/lyte"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.875rem 1.75rem",
                    background: LYTE, color: "hsl(214,18%,4%)",
                    borderRadius: "0.375rem",
                    fontSize: "0.9375rem", fontWeight: 700,
                    textDecoration: "none", whiteSpace: "nowrap",
                  }}
                >
                  Open Lyte <ArrowRight size={15} />
                </Link>
                <Link
                  href="/demo"
                  onClick={() => { analytics.heroCTAClick("request-demo", "lyte-cta"); analytics.demoRequest("lyte-cta"); }}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.875rem 1.75rem",
                    background: "transparent", color: TEXT_SEC,
                    border: `1px solid ${BORDER}`,
                    borderRadius: "0.375rem",
                    fontSize: "0.9375rem", fontWeight: 500,
                    textDecoration: "none", whiteSpace: "nowrap",
                  }}
                >
                  Request a demo
                </Link>
              </div>
            </m.div>
          </div>
        </section>

        {/* ── Newsletter ──────────────────────────────────────────── */}
        <NewsletterSection />

        {/* ── Final CTA ───────────────────────────────────────────── */}
        <section style={{ padding: "clamp(5rem,10vw,7rem) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)", textAlign: "center" }}>
            <m.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
              <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_FAINT, marginBottom: "1rem" }}>
                Design partner stage · Series A · 2026
              </p>
              <h2 style={{ fontSize: "clamp(2rem,4.5vw,3.5rem)", fontWeight: 700, letterSpacing: "-0.03em", color: TEXT, marginBottom: "1.25rem", maxWidth: "24ch", margin: "0 auto 1.25rem" }}>
                See the governed decision loop in your environment.
              </h2>
              <p style={{ fontSize: "1rem", lineHeight: 1.7, color: TEXT_SEC, maxWidth: "44ch", margin: "0 auto 2.5rem" }}>
                We work with a small number of design partners on focused, time-bound engagements — real data, real workflows, measured outcomes. No broad commitment required.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                <Link
                  href="/demo"
                  onClick={() => { analytics.heroCTAClick("request-demo", "bottom-cta"); analytics.demoRequest("bottom-cta"); }}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.875rem 1.75rem",
                    background: LYTE, color: "hsl(214,18%,4%)",
                    borderRadius: "0.375rem",
                    fontSize: "0.9375rem", fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Request a demo <ArrowRight size={15} />
                </Link>
                <Link
                  href="/design-partner"
                  onClick={() => analytics.designPartnerInterest("bottom-cta")}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.875rem 1.75rem",
                    background: "transparent", color: TEXT_SEC,
                    border: `1px solid ${BORDER}`,
                    borderRadius: "0.375rem",
                    fontSize: "0.9375rem", fontWeight: 500,
                    textDecoration: "none",
                  }}
                >
                  Design partner program
                </Link>
                <Link href="/investor" style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.875rem 1.75rem",
                  background: "transparent", color: TEXT_SEC,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "0.375rem",
                  fontSize: "0.9375rem", fontWeight: 500,
                  textDecoration: "none",
                }}>
                  Investor relations
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
