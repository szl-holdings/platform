import { useEffect, useState } from "react";
import { Link } from "wouter";
import { m, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { analytics } from "@/lib/analytics";

const BG = "#0a0a0a";
const SURFACE = "rgba(255,255,255,0.018)";
const BORDER = "rgba(255,255,255,0.08)";
const BORDER_STRONG = "rgba(255,255,255,0.12)";
const TEXT = "#f5f5f5";
const TEXT_DIM = "#8a8a8a";
const TEXT_MUTED = "#5e5e5e";
const ACCENT = "#c9b787";
const MONO = "var(--font-mono)";
const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

const ALLOY_CHARS = [
  { ch: "a", word: "Attribution", desc: "Every action records who proposed it, who approved it, what evidence supported it, and which model — if any — recommended it." },
  { ch: "1", word: "One Decision Loop", desc: "Signal, Context, Recommendation, Simulation, Policy, Execution, Proof, Outcome, Learning. The single canonical path every governed action follows." },
  { ch: "1", word: "One Proof Chain", desc: "An immutable, append-only record of every consequential action across every product. Tamper-resistant. Queryable by actor, decision, or outcome." },
  { ch: "o", word: "Orchestration", desc: "Durable, multi-step workflow execution with checkpoint recovery, agent coordination, and policy gates enforced at the platform layer." },
  { ch: "y", word: "Yield", desc: "The Outcome Graph closes the loop — recording the real-world consequence of every decision and feeding it back to calibrate future confidence." },
];

const LOOP = [
  { n: "01", label: "Signal", body: "Indicators, anomalies, and threshold breaches detected, normalized, and routed with cross-domain context." },
  { n: "02", label: "Context", body: "Cross-domain enrichment via the event fabric. Maritime alerts trigger legal flags. Real-estate signals open KORA cases." },
  { n: "03", label: "Recommendation", body: "An AI agent proposes an action with citations, model identity, and a confidence score. No opaque verdicts." },
  { n: "04", label: "Simulation", body: "Monte Carlo modeling estimates expected outcomes, confidence intervals, and key variables before any commitment." },
  { n: "05", label: "Policy", body: "Covenant Policy enforces who can approve, when, and under what conditions — at the platform layer. Non-delegatable." },
  { n: "06", label: "Execution", body: "a11oy orchestrates the approved action as a durable, multi-step process with checkpoint recovery and agent coordination." },
  { n: "07", label: "Proof", body: "The Proof Chain records the complete trail: signal, recommendation, simulation, policy decision, approval, execution. Immutable." },
  { n: "08", label: "Outcome", body: "The Outcome Graph captures the real-world result. Was the action effective? The data calibrates future confidence." },
  { n: "09", label: "Learning", body: "Historical outcomes feed back into simulation models and agent calibration. The platform improves with every decision." },
];

const VERTICALS = [
  { name: "PARAGON", category: "Security & Defense", href: "/solutions/aegis", desc: "SOC command, threat intelligence, MITRE mapping, and governed SOAR playbooks." },
  { name: "SEXTANT", category: "Maritime Intelligence", href: "/solutions/vessels", desc: "Fleet command, simulated AIS telemetry, sanctions screening, and voyage economics." },
  { name: "DOMAINE", category: "Real Estate Intelligence", href: "/solutions/terra", desc: "Distress property pipeline, ownership entity graph, and governed underwriting." },
  { name: "Counsel", category: "Legal Operations", href: "/counsel", desc: "Matter twins, deadline tracking, and governed demand workflows for litigation teams." },
  { name: "Carlota Jo", category: "Private Advisory", href: "/carlota-jo/", desc: "Discreet client intake, managed service delivery, and advisory operations for UHNW principals." },
  { name: "IMPERIUM", category: "Cloud Sovereignty", href: "/solutions/imperium", desc: "Multi-cloud governance, policy enforcement, and cloud estate visibility." },
];

const ARCHITECTURE = [
  { tier: "01", title: "Command Surfaces", body: "How operators see and act on signals. KORA web command, APEX mobile, and the ecosystem portal — each surface speaks the same governance vocabulary.", items: ["KORA — Web command", "APEX — iOS · Android", "Command — Ecosystem portal"] },
  { tier: "02", title: "Execution Fabric", body: "The structural layer beneath every product. a11oy enforces policy, records provenance, and orchestrates durable multi-step workflows.", items: ["a11oy — Orchestration", "Proof Chain — Audit trail", "Covenant — Policy engine", "Simulation — Risk modeling", "Outcome Graph — Feedback"] },
  { tier: "03", title: "Domain Packs", body: "Industry-specific data models, workflows, and intelligence — all running on the same loop, the same policy engine, and the same proof chain.", items: ["PARAGON · SEXTANT · DOMAINE", "Counsel · Carlota Jo · IMPERIUM"] },
];

function FadeIn({ children, delay = 0, className = "", as = "div" }: { children: React.ReactNode; delay?: number; className?: string; as?: string }) {
  const Component: any = m[as as keyof typeof m] || m.div;
  return (
    <Component
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.7, delay, ease }}
      className={className}
    >
      {children}
    </Component>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: "0.625rem", fontFamily: MONO, fontWeight: 500,
      letterSpacing: "0.18em", textTransform: "uppercase",
      color: TEXT_MUTED, margin: "0 0 1.5rem",
    }}>
      {children}
    </p>
  );
}

function PrimaryButton({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: "0.5rem",
        padding: "0.75rem 1.5rem",
        background: "#f5f5f5", color: "#0a0a0a",
        borderRadius: "999px",
        fontSize: "0.8125rem", fontWeight: 500, letterSpacing: "-0.005em",
        textDecoration: "none",
        transition: "background 0.2s, transform 0.15s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#fff"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; }}
    >
      {children}
    </Link>
  );
}

function SecondaryButton({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: "0.5rem",
        padding: "0.75rem 1.5rem",
        background: "transparent", color: TEXT,
        border: `1px solid ${BORDER_STRONG}`,
        borderRadius: "999px",
        fontSize: "0.8125rem", fontWeight: 500, letterSpacing: "-0.005em",
        textDecoration: "none",
        transition: "border-color 0.2s, background 0.2s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.25)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = BORDER_STRONG; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {children}
    </Link>
  );
}

function AlloyMark() {
  return (
    <svg viewBox="0 0 200 200" width="160" height="160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id="continuum-grad" cx="0.5" cy="0.5" r="0.55">
          <stop offset="0%" stopColor="rgba(201,183,135,0.18)" />
          <stop offset="100%" stopColor="rgba(201,183,135,0)" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="92" fill="url(#continuum-grad)" />
      <circle cx="100" cy="100" r="70" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <circle cx="100" cy="100" r="48" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <g stroke="rgba(255,255,255,0.10)" strokeWidth="1">
        <line x1="100" y1="30" x2="100" y2="170" />
        <line x1="30" y1="100" x2="170" y2="100" />
        <line x1="50" y1="50" x2="150" y2="150" />
        <line x1="150" y1="50" x2="50" y2="150" />
      </g>
      {[
        [100, 30], [170, 100], [100, 170], [30, 100],
        [150, 50], [150, 150], [50, 150], [50, 50],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill="rgba(255,255,255,0.5)" />
      ))}
      <circle cx="100" cy="100" r="6" fill={ACCENT} />
      <circle cx="100" cy="100" r="14" fill="none" stroke={ACCENT} strokeOpacity="0.3" strokeWidth="1" />
    </svg>
  );
}

function LoopDiagram() {
  return (
    <svg viewBox="0 0 600 240" width="100%" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", height: "auto" }}>
      <line x1="40" y1="120" x2="560" y2="120" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="2 4" />
      {LOOP.map((step, i) => {
        const x = 40 + i * (520 / 8);
        return (
          <g key={step.n}>
            <circle cx={x} cy={120} r="5" fill="#0a0a0a" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
            <text x={x} y={92} textAnchor="middle" fontSize="9" fill={TEXT_MUTED} fontFamily="monospace" letterSpacing="0.1em">{step.n}</text>
            <text x={x} y={150} textAnchor="middle" fontSize="11" fill={TEXT} fontWeight="500">{step.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function ArchitectureDiagram() {
  return (
    <svg viewBox="0 0 600 320" width="100%" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", height: "auto" }}>
      {/* Layer 01 — Surfaces */}
      <g>
        {[140, 300, 460].map((x, i) => (
          <g key={`s-${i}`}>
            <rect x={x - 50} y={20} width="100" height="44" rx="4" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
            <text x={x} y={47} textAnchor="middle" fontSize="11" fill={TEXT}>{["KORA", "APEX", "Command"][i]}</text>
          </g>
        ))}
      </g>
      {/* Connectors down */}
      {[140, 300, 460].map((x, i) => (
        <line key={`c1-${i}`} x1={x} y1={64} x2={x} y2={120} stroke="rgba(255,255,255,0.10)" strokeWidth="1" strokeDasharray="2 3" />
      ))}
      {/* Layer 02 — a11oy fabric */}
      <rect x={70} y={120} width="460" height="62" rx="4" fill="rgba(201,183,135,0.04)" stroke="rgba(201,183,135,0.30)" strokeWidth="1" />
      <text x={300} y={148} textAnchor="middle" fontSize="13" fontWeight="600" fill={TEXT} letterSpacing="-0.01em">a11oy — Execution Fabric</text>
      <text x={300} y={167} textAnchor="middle" fontSize="10" fill={TEXT_DIM} fontFamily="monospace" letterSpacing="0.08em">PROOF · POLICY · ORCHESTRATION · OUTCOME</text>
      {/* Connectors down */}
      {[140, 300, 460].map((x, i) => (
        <line key={`c2-${i}`} x1={x} y1={182} x2={x} y2={236} stroke="rgba(255,255,255,0.10)" strokeWidth="1" strokeDasharray="2 3" />
      ))}
      {/* Layer 03 — Domain Packs */}
      {[80, 200, 320, 440].map((x, i) => (
        <g key={`d-${i}`}>
          <rect x={x} y={236} width="80" height="44" rx="4" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
          <text x={x + 40} y={263} textAnchor="middle" fontSize="11" fill={TEXT}>{["PARAGON", "SEXTANT", "DOMAINE", "+ 3"][i]}</text>
        </g>
      ))}
      {/* Layer labels */}
      <text x={26} y={42} fontSize="9" fill={TEXT_MUTED} fontFamily="monospace" letterSpacing="0.14em">01</text>
      <text x={26} y={150} fontSize="9" fill={TEXT_MUTED} fontFamily="monospace" letterSpacing="0.14em">02</text>
      <text x={26} y={258} fontSize="9" fill={TEXT_MUTED} fontFamily="monospace" letterSpacing="0.14em">03</text>
    </svg>
  );
}

function HeroBackdrop() {
  return (
    <div aria-hidden="true" style={{
      position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none",
    }}>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        style={{
          position: "absolute", top: "30%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "1200px", height: "800px",
          background: "radial-gradient(ellipse at center, rgba(201,183,135,0.045) 0%, transparent 55%)",
          filter: "blur(20px)",
        }}
      />
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.35 }}>
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
          </pattern>
          <radialGradient id="grid-fade" cx="0.5" cy="0.45" r="0.6">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="grid-mask"><rect width="100%" height="100%" fill="url(#grid-fade)" /></mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" mask="url(#grid-mask)" />
      </svg>
    </div>
  );
}

export default function HomePage() {
  const __pageMeta = usePageMeta({
    title: "SZL Holdings — Governed Decision Operating System",
    description: "The structural layer between signal detection and action execution. Governance, attribution, and proof on every decision that matters.",
    canonical: "https://szlholdings.com",
  });

  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const path = typeof window !== "undefined" ? window.location.pathname : "/";
    analytics.landingView(path);
    const t = setInterval(() => setActiveStep(p => (p + 1) % LOOP.length), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      {__pageMeta}
      <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFeatureSettings: '"ss01", "cv11"' }}>
        <SiteNav />
        <main id="main-content">

          {/* ── Hero ─────────────────────────────────────────── */}
          <section style={{
            minHeight: "92vh",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative", overflow: "hidden",
            padding: "6rem 2rem 4rem",
          }}>
            <HeroBackdrop />
            <div style={{ position: "relative", maxWidth: "780px", margin: "0 auto", textAlign: "center" }}>
              <m.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease }}
                style={{
                  fontSize: "0.6875rem", fontFamily: MONO, fontWeight: 500,
                  letterSpacing: "0.22em", textTransform: "uppercase",
                  color: TEXT_MUTED, marginBottom: "2.5rem",
                }}
              >
                SZL Holdings · Governed Decision OS
              </m.p>
              <m.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, delay: 0.08, ease }}
                style={{
                  fontSize: "clamp(3rem, 7vw, 5.5rem)",
                  fontWeight: 500,
                  letterSpacing: "-0.045em",
                  lineHeight: 0.98,
                  marginBottom: "2rem",
                  color: TEXT,
                }}
              >
                Decisions you can{" "}
                <span style={{ fontStyle: "italic", fontWeight: 400, color: ACCENT }}>prove</span>.
              </m.h1>
              <m.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.18, ease }}
                style={{
                  fontSize: "clamp(1rem, 1.4vw, 1.125rem)",
                  lineHeight: 1.65,
                  color: TEXT_DIM,
                  maxWidth: "52ch",
                  margin: "0 auto 3rem",
                  letterSpacing: "-0.005em",
                }}
              >
                SZL Holdings is the structural layer between signal detection and action execution —
                with governance, attribution, and proof on every decision that matters.
              </m.p>
              <m.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.28, ease }}
                style={{ display: "flex", gap: "0.625rem", justifyContent: "center", flexWrap: "wrap" }}
              >
                <PrimaryButton href="/demo" onClick={() => { analytics.heroCTAClick("request-demo", "hero"); analytics.demoRequest("hero"); }}>
                  Request a demo <ArrowRight size={13} />
                </PrimaryButton>
                <SecondaryButton href="/continuum-fabric">
                  Explore a11oy
                </SecondaryButton>
              </m.div>
            </div>
          </section>

          {/* ── a11oy Spotlight ──────────────────────────────── */}
          <section style={{ padding: "clamp(6rem, 12vw, 10rem) 0 clamp(5rem, 10vw, 8rem)", borderTop: `1px solid ${BORDER}`, position: "relative" }}>
            <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "0 2rem" }}>

              <FadeIn>
                <div style={{ textAlign: "center", marginBottom: "4rem" }}>
                  <SectionLabel>The Execution Fabric</SectionLabel>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
                    <AlloyMark />
                  </div>
                  <h2 style={{
                    fontSize: "clamp(2.5rem, 5.5vw, 4.25rem)",
                    fontWeight: 500, letterSpacing: "-0.04em",
                    color: TEXT, marginBottom: "1.25rem", lineHeight: 1,
                  }}>
                    a11oy
                  </h2>
                  <p style={{
                    fontSize: "clamp(1rem, 1.4vw, 1.125rem)",
                    lineHeight: 1.65, color: TEXT_DIM,
                    maxWidth: "58ch", margin: "0 auto",
                  }}>
                    The orchestration fabric beneath every SZL product. Every character carries weight.
                  </p>
                </div>
              </FadeIn>

              <div style={{
                display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
                gap: "1px", background: BORDER,
                border: `1px solid ${BORDER}`, borderRadius: "12px",
                overflow: "hidden", marginBottom: "3rem",
              }}>
                {ALLOY_CHARS.map((c, i) => (
                  <FadeIn key={i} delay={i * 0.07}>
                    <div style={{
                      background: BG, padding: "2.5rem 1.75rem",
                      height: "100%", display: "flex", flexDirection: "column",
                    }}>
                      <div style={{
                        fontSize: "3.5rem", fontWeight: 400, fontFamily: MONO,
                        color: ACCENT, lineHeight: 1, marginBottom: "1.75rem",
                        letterSpacing: "-0.02em",
                      }}>
                        {c.ch}
                      </div>
                      <p style={{
                        fontSize: "0.625rem", fontFamily: MONO, fontWeight: 500,
                        letterSpacing: "0.16em", textTransform: "uppercase",
                        color: TEXT_MUTED, marginBottom: "0.625rem",
                      }}>
                        {c.word}
                      </p>
                      <p style={{
                        fontSize: "0.8125rem", lineHeight: 1.6,
                        color: TEXT_DIM, margin: 0, flex: 1,
                      }}>
                        {c.desc}
                      </p>
                    </div>
                  </FadeIn>
                ))}
              </div>

              <FadeIn delay={0.2}>
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                  <PrimaryButton href="/continuum-fabric">
                    See a11oy in detail <ArrowRight size={13} />
                  </PrimaryButton>
                  <SecondaryButton href="/docs/proof-chain">
                    Proof Chain whitepaper <ArrowUpRight size={12} />
                  </SecondaryButton>
                </div>
              </FadeIn>
            </div>
          </section>

          {/* ── The Decision Loop ────────────────────────────── */}
          <section style={{ padding: "clamp(5rem, 10vw, 8rem) 0", borderTop: `1px solid ${BORDER}` }}>
            <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "0 2rem" }}>
              <FadeIn>
                <div style={{ marginBottom: "3rem", maxWidth: "720px" }}>
                  <SectionLabel>The Decision Loop</SectionLabel>
                  <h2 style={{
                    fontSize: "clamp(1.875rem, 3.5vw, 2.75rem)",
                    fontWeight: 500, letterSpacing: "-0.035em",
                    color: TEXT, marginBottom: "1rem", lineHeight: 1.1,
                  }}>
                    Nine stages from signal to outcome — fully traced.
                  </h2>
                  <p style={{
                    fontSize: "1rem", lineHeight: 1.65,
                    color: TEXT_DIM, maxWidth: "58ch", margin: 0,
                  }}>
                    Every consequential action follows the same canonical path. Detection,
                    governance, and outcome are recorded as one continuous record — the basis
                    of operational certainty.
                  </p>
                </div>
              </FadeIn>

              <FadeIn delay={0.1}>
                <div style={{ marginBottom: "3rem" }}>
                  <LoopDiagram />
                </div>
              </FadeIn>

              <FadeIn delay={0.15}>
                <div style={{
                  display: "grid", gridTemplateColumns: "260px 1fr",
                  gap: "2.5rem", alignItems: "start",
                }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                    {LOOP.map((step, i) => (
                      <button
                        key={step.n}
                        onClick={() => setActiveStep(i)}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.875rem",
                          padding: "0.625rem 0",
                          background: "transparent", border: "none",
                          borderTop: i === 0 ? "none" : `1px solid ${BORDER}`,
                          cursor: "pointer", textAlign: "left",
                          color: i === activeStep ? TEXT : TEXT_DIM,
                          transition: "color 0.2s",
                        }}
                      >
                        <span style={{ fontSize: "0.625rem", fontFamily: MONO, color: TEXT_MUTED, letterSpacing: "0.1em", minWidth: "18px" }}>{step.n}</span>
                        <span style={{ fontSize: "0.875rem", fontWeight: i === activeStep ? 500 : 400 }}>{step.label}</span>
                        {i === activeStep && (
                          <m.span layoutId="loop-marker" style={{ marginLeft: "auto", width: "4px", height: "4px", borderRadius: "50%", background: ACCENT }} />
                        )}
                      </button>
                    ))}
                  </div>
                  <AnimatePresence mode="wait">
                    <m.div
                      key={LOOP[activeStep].n}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        padding: "2.5rem",
                        background: SURFACE,
                        border: `1px solid ${BORDER}`,
                        borderRadius: "12px",
                      }}
                    >
                      <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 500, letterSpacing: "0.16em", textTransform: "uppercase", color: ACCENT, marginBottom: "0.75rem", opacity: 0.8 }}>
                        Stage {LOOP[activeStep].n}
                      </p>
                      <h3 style={{ fontSize: "1.5rem", fontWeight: 500, letterSpacing: "-0.02em", color: TEXT, marginBottom: "1rem" }}>
                        {LOOP[activeStep].label}
                      </h3>
                      <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: TEXT_DIM, margin: 0 }}>
                        {LOOP[activeStep].body}
                      </p>
                    </m.div>
                  </AnimatePresence>
                </div>
              </FadeIn>
            </div>
          </section>

          {/* ── Architecture ─────────────────────────────────── */}
          <section style={{ padding: "clamp(5rem, 10vw, 8rem) 0", borderTop: `1px solid ${BORDER}` }}>
            <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "0 2rem" }}>
              <FadeIn>
                <div style={{ marginBottom: "3.5rem", maxWidth: "720px" }}>
                  <SectionLabel>Canonical Architecture</SectionLabel>
                  <h2 style={{
                    fontSize: "clamp(1.875rem, 3.5vw, 2.75rem)",
                    fontWeight: 500, letterSpacing: "-0.035em",
                    color: TEXT, marginBottom: "1rem", lineHeight: 1.1,
                  }}>
                    Three layers. One governed system.
                  </h2>
                  <p style={{ fontSize: "1rem", lineHeight: 1.65, color: TEXT_DIM, maxWidth: "58ch", margin: 0 }}>
                    Surfaces above. Domain packs below. a11oy in the middle —
                    the structural layer that turns signals into governed action.
                  </p>
                </div>
              </FadeIn>

              <FadeIn delay={0.08}>
                <div style={{
                  padding: "2rem",
                  background: SURFACE,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "12px",
                  marginBottom: "2.5rem",
                }}>
                  <ArchitectureDiagram />
                </div>
              </FadeIn>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
                {ARCHITECTURE.map((tier, i) => (
                  <FadeIn key={tier.tier} delay={i * 0.07}>
                    <div style={{
                      padding: "1.75rem",
                      borderRadius: "10px",
                      border: `1px solid ${BORDER}`,
                      background: SURFACE,
                      height: "100%",
                    }}>
                      <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 500, letterSpacing: "0.16em", color: TEXT_MUTED, marginBottom: "0.625rem" }}>LAYER {tier.tier}</p>
                      <h3 style={{ fontSize: "1rem", fontWeight: 500, color: TEXT, marginBottom: "0.75rem", letterSpacing: "-0.01em" }}>{tier.title}</h3>
                      <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: TEXT_DIM, marginBottom: "1.25rem" }}>{tier.body}</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", paddingTop: "1rem", borderTop: `1px solid ${BORDER}` }}>
                        {tier.items.map(item => (
                          <p key={item} style={{ fontSize: "0.75rem", color: TEXT_DIM, fontFamily: MONO, margin: 0, letterSpacing: "0.02em" }}>{item}</p>
                        ))}
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </section>

          {/* ── Domain Packs ─────────────────────────────────── */}
          <section style={{ padding: "clamp(5rem, 10vw, 8rem) 0", borderTop: `1px solid ${BORDER}` }}>
            <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "0 2rem" }}>
              <FadeIn>
                <div style={{ marginBottom: "3rem", maxWidth: "720px" }}>
                  <SectionLabel>Domain Packs</SectionLabel>
                  <h2 style={{ fontSize: "clamp(1.875rem, 3.5vw, 2.75rem)", fontWeight: 500, letterSpacing: "-0.035em", color: TEXT, marginBottom: "1rem", lineHeight: 1.1 }}>
                    Vertical intelligence. Shared governance.
                  </h2>
                  <p style={{ fontSize: "1rem", lineHeight: 1.65, color: TEXT_DIM, maxWidth: "58ch", margin: 0 }}>
                    Each domain pack extends the platform with industry-specific data models and
                    workflows — all running on the same loop, the same policy engine, the same proof chain.
                  </p>
                </div>
              </FadeIn>

              <div style={{
                display: "grid", gridTemplateColumns: "repeat(2, 1fr)",
                gap: "1px", background: BORDER,
                border: `1px solid ${BORDER}`, borderRadius: "12px", overflow: "hidden",
              }}>
                {VERTICALS.map((v, i) => (
                  <FadeIn key={v.name} delay={i * 0.05}>
                    <Link href={v.href} style={{ textDecoration: "none", display: "block", height: "100%" }}>
                      <m.div
                        whileHover={{ background: "rgba(255,255,255,0.025)" }}
                        transition={{ duration: 0.2 }}
                        style={{
                          background: BG, padding: "2rem 2rem",
                          display: "flex", justifyContent: "space-between",
                          alignItems: "flex-start", gap: "2rem",
                          cursor: "pointer", height: "100%",
                          minHeight: "140px",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: "0.625rem", fontFamily: MONO, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT_MUTED, marginBottom: "0.5rem" }}>{v.category}</p>
                          <h3 style={{ fontSize: "1.25rem", fontWeight: 500, color: TEXT, marginBottom: "0.625rem", letterSpacing: "-0.015em" }}>{v.name}</h3>
                          <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: TEXT_DIM, margin: 0 }}>{v.desc}</p>
                        </div>
                        <ArrowUpRight size={16} style={{ color: TEXT_MUTED, flexShrink: 0, marginTop: "0.25rem" }} />
                      </m.div>
                    </Link>
                  </FadeIn>
                ))}
              </div>
            </div>
          </section>

          {/* ── Trust ────────────────────────────────────────── */}
          <section style={{ padding: "clamp(5rem, 10vw, 8rem) 0", borderTop: `1px solid ${BORDER}` }}>
            <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "0 2rem" }}>
              <FadeIn>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(3rem, 5vw, 5rem)", alignItems: "start" }}>
                  <div>
                    <SectionLabel>Trust Architecture</SectionLabel>
                    <h2 style={{ fontSize: "clamp(1.875rem, 3.5vw, 2.5rem)", fontWeight: 500, letterSpacing: "-0.035em", color: TEXT, marginBottom: "1.25rem", lineHeight: 1.1 }}>
                      Governance is architecture — not compliance.
                    </h2>
                    <p style={{ fontSize: "1rem", lineHeight: 1.65, color: TEXT_DIM, marginBottom: "2rem" }}>
                      Every consequential action passes through the same governance layer. Approval gates,
                      policy controls, source attribution, and an immutable audit trail —
                      enforced at the platform layer, not bolted on.
                    </p>
                    <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
                      <SecondaryButton href="/trust">Trust Center <ArrowUpRight size={12} /></SecondaryButton>
                      <SecondaryButton href="/trust/ai">AI Governance</SecondaryButton>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: BORDER, border: `1px solid ${BORDER}`, borderRadius: "10px", overflow: "hidden" }}>
                    {[
                      { title: "Human-in-the-loop enforced", body: "Approval controls on every consequential action. No autonomous execution without review." },
                      { title: "Source attribution", body: "Every recommendation includes model identity, citations, and confidence score." },
                      { title: "Immutable audit trail", body: "Append-only Proof Chain — tamper-resistant, queryable by actor, action, time." },
                      { title: "Policy-gated governance", body: "Who can act, when, under what conditions. Enforced at the platform layer." },
                    ].map((item) => (
                      <div key={item.title} style={{ background: BG, padding: "1.25rem 1.5rem" }}>
                        <p style={{ fontSize: "0.875rem", fontWeight: 500, color: TEXT, marginBottom: "0.375rem", letterSpacing: "-0.005em" }}>{item.title}</p>
                        <p style={{ fontSize: "0.8125rem", lineHeight: 1.6, color: TEXT_DIM, margin: 0 }}>{item.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            </div>
          </section>

          {/* ── Final CTA ────────────────────────────────────── */}
          <section style={{ padding: "clamp(7rem, 14vw, 12rem) 0", borderTop: `1px solid ${BORDER}` }}>
            <div style={{ maxWidth: "640px", margin: "0 auto", padding: "0 2rem", textAlign: "center" }}>
              <FadeIn>
                <SectionLabel>Design Partner Stage · 2026</SectionLabel>
                <h2 style={{ fontSize: "clamp(2.25rem, 5vw, 3.5rem)", fontWeight: 500, letterSpacing: "-0.04em", color: TEXT, marginBottom: "1.25rem", lineHeight: 1.05 }}>
                  See it in your environment.
                </h2>
                <p style={{ fontSize: "1.0625rem", lineHeight: 1.65, color: TEXT_DIM, marginBottom: "2.5rem", maxWidth: "48ch", margin: "0 auto 2.5rem" }}>
                  We work with a small number of design partners on focused, time-bound engagements —
                  real data, real workflows, measured outcomes.
                </p>
                <div style={{ display: "flex", gap: "0.625rem", justifyContent: "center", flexWrap: "wrap" }}>
                  <PrimaryButton href="/demo" onClick={() => { analytics.heroCTAClick("request-demo", "bottom-cta"); analytics.demoRequest("bottom-cta"); }}>
                    Request a demo <ArrowRight size={13} />
                  </PrimaryButton>
                  <SecondaryButton href="/design-partner" onClick={() => analytics.designPartnerInterest("bottom-cta")}>
                    Design partner program
                  </SecondaryButton>
                </div>
              </FadeIn>
            </div>
          </section>

        </main>
        <SiteFooter />
      </div>
    </>
  );
}
