import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { m, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Shield,
  Lock,
  Eye,
  FileCheck2,
  GitBranch,
  CheckCircle2,
  ChevronRight,
  Users,
  Database,
} from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useNarrativeRouter } from "@/hooks/useNarrativeRouter";

const TRUST_ROUTE_PROGRESS_KEY = "szl_trust_route_progress";

const TRUST_STEPS = [
  {
    id: "governance",
    step: 1,
    label: "Governance Foundation",
    sublabel: "How decisions are controlled",
    icon: Shield,
    color: "hsl(38,72%,58%)",
    colorRgb: "212,160,84",
    headline: "Trust is built into the architecture, not bolted on.",
    body: "Governance controls — approval gates, audit trails, role-based access — are structural constraints in the platform, not compliance features added later. There is no bypass mode. This is not a marketing claim; it is an architectural constraint verifiable in the product.",
    evidence: [
      "Human-in-the-loop gate is enforced at the workflow layer — not a setting that can be toggled",
      "Every consequential action requires explicit approval before execution",
      "Role-based access is scoped at the data layer, not just the UI",
      "Approval records include actor, timestamp, rationale, and override log",
    ],
    receipts: [
      { label: "Architecture documentation", href: "/trust/architecture" },
      { label: "See approval governance", href: "/trust/approvals" },
      { label: "AI governance model", href: "/trust/ai" },
    ],
  },
  {
    id: "proof-chain",
    step: 2,
    label: "Proof Chain",
    sublabel: "Verifiable provenance from signal to outcome",
    icon: FileCheck2,
    color: "hsl(192,72%,48%)",
    colorRgb: "25,180,210",
    headline: "Every output carries a verifiable lineage record.",
    body: "The Proof Chain is not an audit log — it is a verifiable evidence structure. Every AI recommendation carries a cryptographic proof chain: source document → model output → confidence score → human review → approval decision → execution record. Legal, compliance, and audit teams can inspect this chain. It is not opaque.",
    evidence: [
      "Source → AI output → confidence → human approval → execution: six-stage chain",
      "Cryptographic linking between each chain node — not just sequential logging",
      "Exportable in structured format for legal discovery and compliance review",
      "Chain is append-only — no modification after the fact",
    ],
    receipts: [
      { label: "Proof Chain documentation", href: "/docs/proof-chain" },
      { label: "Architecture overview", href: "/trust/architecture" },
      { label: "Export safety controls", href: "/trust/exports" },
    ],
  },
  {
    id: "source-grounding",
    step: 3,
    label: "Source Grounding",
    sublabel: "AI outputs traceable to verified sources",
    icon: Eye,
    color: "hsl(145,60%,46%)",
    colorRgb: "58,168,90",
    headline: "No hallucinations surface to users. Architecturally enforced.",
    body: "Source grounding is enforced at the model layer — not as a prompt instruction, but as an architectural constraint. AI outputs that cannot be traced to a verified source document are flagged, not surfaced. The Model Mesh enforces this. There is no version of the platform where hallucinated outputs reach users without being flagged.",
    evidence: [
      "Model Mesh enforces source grounding at inference time — not in prompts",
      "Ungrounded outputs are classified and flagged — never silently surfaced",
      "Every AI recommendation includes source attribution visible to the approver",
      "Contradiction detection catches inconsistent outputs before routing",
    ],
    receipts: [
      { label: "Model Mesh documentation", href: "/docs/model-mesh" },
      { label: "AI governance model", href: "/trust/ai" },
      { label: "Trust center overview", href: "/trust" },
    ],
  },
  {
    id: "audit-trail",
    step: 4,
    label: "Audit Trail",
    sublabel: "Immutable, queryable, durable action history",
    icon: GitBranch,
    color: "hsl(260,55%,62%)",
    colorRgb: "134,100,200",
    headline: "The audit trail is an operational tool, not a compliance checkbox.",
    body: "Every user action, workflow execution, approval decision, and system event is written to an append-only audit log designed to resist modification. It is queryable by actor, action type, affected entity, and time range. Audit records are exportable for compliance tools. The trail is the backbone that makes every other trust claim verifiable.",
    evidence: [
      "Append-only write — no modification, deletion, or backdating",
      "Queryable by actor, action type, entity, and time range",
      "Exportable: JSON and CSV formats for compliance integrations",
      "Includes system events, not just user actions — complete operational picture",
    ],
    receipts: [
      { label: "Audit trail architecture", href: "/trust/architecture" },
      { label: "Security posture", href: "/trust/security" },
      { label: "Operations overview", href: "/trust/operations" },
    ],
  },
  {
    id: "readiness",
    step: 5,
    label: "Enterprise Readiness",
    sublabel: "What procurement and security teams check",
    icon: Lock,
    color: "hsl(0,62%,56%)",
    colorRgb: "196,90,74",
    headline: "The enterprise readiness evidence, unredacted.",
    body: "SOC 2 alignment is a structural design goal, not a future checkbox. GDPR data handling is built into the platform. Tenant isolation is enforced at the database layer. SSO via Microsoft 365 is designed in. These are not aspirations — they are architectural decisions made before the first line of product code was written.",
    evidence: [
      "SOC 2 Type II: audit preparation underway, expected Q3 2026",
      "GDPR: data processing, DPIA, and subject access workflows in place",
      "CCPA: consumer privacy rights implemented, opt-out and deletion operational",
      "Tenant isolation: row-level security and schema isolation at the database layer",
      "M365 SSO and conditional access policy integration designed",
    ],
    receipts: [
      { label: "Full compliance status", href: "/trust" },
      { label: "Security posture documentation", href: "/trust/security" },
      { label: "Tenant isolation architecture", href: "/trust/architecture" },
    ],
  },
  {
    id: "next-step",
    step: 6,
    label: "Your Next Step",
    sublabel: "Where trust converts to a commercial conversation",
    icon: Users,
    color: "hsl(192,72%,48%)",
    colorRgb: "25,180,210",
    headline: "Trust evidence reviewed. Now let's talk.",
    body: "You've walked through the governance foundation, proof chain, source grounding, audit trail, and enterprise readiness evidence. This is the company's trust posture in full. The next step depends on who you are and what you need.",
    evidence: [],
    receipts: [],
    isCTA: true,
  },
];

export default function TrustRoutePage() {
  const { recordClickSignal } = useNarrativeRouter();

  const [activeStep, setActiveStep] = useState<number>(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(TRUST_ROUTE_PROGRESS_KEY) ?? "null");
      return typeof stored?.activeStep === "number" ? stored.activeStep : 0;
    } catch { return 0; }
  });

  const [completedSteps, setCompletedSteps] = useState<number[]>(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem(TRUST_ROUTE_PROGRESS_KEY) ?? "null");
      return Array.isArray(stored?.completedSteps) ? stored.completedSteps : [];
    } catch { return []; }
  });

  const persistProgress = useCallback((active: number, completed: number[]) => {
    try {
      sessionStorage.setItem(TRUST_ROUTE_PROGRESS_KEY, JSON.stringify({ activeStep: active, completedSteps: completed }));
    } catch {}
  }, []);

  useEffect(() => {
    recordClickSignal("trust_route_enter", 0.5);
  }, [recordClickSignal]);

  usePageMeta({
    title: "Trust Route — Governance Proof — SZL Holdings",
    description:
      "Walk through the governance evidence, trust receipts, audit trails, and readiness proof for SZL Holdings with progressive disclosure.",
    canonical: "https://szlholdings.com/trust-route",
  });

  const handleStepSelect = (idx: number) => {
    const nextCompleted = idx > activeStep && !completedSteps.includes(activeStep)
      ? [...completedSteps, activeStep]
      : completedSteps;
    if (nextCompleted !== completedSteps) setCompletedSteps(nextCompleted);
    setActiveStep(idx);
    persistProgress(idx, nextCompleted);
  };

  const handleNext = () => {
    const nextCompleted = !completedSteps.includes(activeStep)
      ? [...completedSteps, activeStep]
      : completedSteps;
    if (nextCompleted !== completedSteps) setCompletedSteps(nextCompleted);
    const nextStep = activeStep < TRUST_STEPS.length - 1 ? activeStep + 1 : activeStep;
    setActiveStep(nextStep);
    persistProgress(nextStep, nextCompleted);

    if (nextStep === TRUST_STEPS.length - 1) {
      recordClickSignal("trust_route_complete", 0.7);
    }
  };

  const currentStep = TRUST_STEPS[activeStep];
  const StepIcon = currentStep.icon;
  const progress = Math.round(((completedSteps.length) / (TRUST_STEPS.length - 1)) * 100);

  return (
    <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", color: "hsl(38,8%,95%)" }}>
      <SiteNav />
      <main id="main-content" role="main">

        <section style={{ borderBottom: "1px solid var(--color-szl-border)", paddingTop: "var(--space-hero-pt)", paddingBottom: "clamp(3rem,6vw,4rem)" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                <Shield size={14} style={{ color: "hsl(38,72%,58%)" }} />
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "hsl(38,72%,58%)", fontFamily: "var(--font-mono)" }}>
                  Trust Route
                </p>
              </div>
              <h1 style={{ fontSize: "clamp(2rem,4.5vw,3.25rem)", fontWeight: 600, letterSpacing: "-0.028em", lineHeight: 1.1, maxWidth: "24ch", marginBottom: "1.25rem" }}>
                Governance proof, progressively disclosed.
              </h1>
              <p style={{ fontSize: "clamp(1rem,1.8vw,1.0625rem)", lineHeight: 1.72, color: "hsl(214,7%,60%)", maxWidth: "52ch", marginBottom: "1.5rem" }}>
                Walk through the governance foundation, proof chain, source grounding, audit trail, and enterprise readiness evidence — step by step, with receipts at every stage.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <div style={{ height: "4px", width: "200px", background: "hsla(0,0%,100%,0.07)", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${progress}%`, background: "hsl(38,72%,58%)", transition: "width 0.4s ease", borderRadius: "2px" }} />
                </div>
                <span style={{ fontSize: "0.75rem", color: "hsl(214,7%,50%)", fontFamily: "var(--font-mono)" }}>
                  {completedSteps.length} / {TRUST_STEPS.length - 1} stages reviewed
                </span>
              </div>
            </m.div>
          </div>
        </section>

        <section style={{ padding: "clamp(3rem,6vw,4.5rem) 0" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 var(--space-content-x)" }}>
            <div style={{ display: "grid", gap: "2.5rem", alignItems: "start" }} className="lg:grid-cols-[280px_1fr]">

              <div style={{ position: "sticky", top: "6rem" }}>
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(214,7%,42%)", fontFamily: "var(--font-mono)", marginBottom: "1rem" }}>
                  Trust stages
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  {TRUST_STEPS.map((step, i) => {
                    const Icon = step.icon;
                    const isCompleted = completedSteps.includes(i);
                    const isActive = i === activeStep;
                    return (
                      <button
                        key={step.id}
                        onClick={() => handleStepSelect(i)}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.75rem",
                          padding: "0.75rem 0.875rem",
                          borderRadius: "0.5rem",
                          background: isActive ? `rgba(${step.colorRgb}, 0.07)` : "transparent",
                          border: isActive ? `1px solid rgba(${step.colorRgb}, 0.22)` : "1px solid transparent",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background 0.18s ease, border-color 0.18s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.03)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            (e.currentTarget as HTMLElement).style.background = "transparent";
                          }
                        }}
                      >
                        <div style={{
                          width: "28px", height: "28px", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          borderRadius: "50%",
                          background: isCompleted ? `rgba(${step.colorRgb}, 0.12)` : isActive ? `rgba(${step.colorRgb}, 0.10)` : "hsla(0,0%,100%,0.04)",
                          border: `1px solid ${isCompleted || isActive ? `rgba(${step.colorRgb}, 0.25)` : "hsla(0,0%,100%,0.07)"}`,
                        }}>
                          {isCompleted ? (
                            <CheckCircle2 size={13} style={{ color: step.color }} />
                          ) : (
                            <Icon size={13} style={{ color: isActive ? step.color : "hsl(214,7%,45%)" }} />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: isActive ? "hsl(38,8%,92%)" : "hsl(214,7%,65%)", marginBottom: "0.1rem" }}>
                            {step.label}
                          </p>
                          <p style={{ fontSize: "0.6875rem", color: "hsl(214,7%,45%)" }}>{step.sublabel}</p>
                        </div>
                        {isActive && <ChevronRight size={13} style={{ color: step.color, flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <m.div
                  key={currentStep.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  {currentStep.isCTA ? (
                    <div style={{
                      borderRadius: "0.875rem",
                      padding: "clamp(2rem,4vw,3rem)",
                      background: `rgba(${currentStep.colorRgb}, 0.04)`,
                      border: `1px solid rgba(${currentStep.colorRgb}, 0.18)`,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.5rem" }}>
                        <div style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.5rem", background: `rgba(${currentStep.colorRgb}, 0.12)`, border: `1px solid rgba(${currentStep.colorRgb}, 0.25)` }}>
                          <StepIcon size={18} style={{ color: currentStep.color }} />
                        </div>
                        <div>
                          <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: currentStep.color, fontFamily: "var(--font-mono)" }}>
                            Stage {currentStep.step} of {TRUST_STEPS.length}
                          </p>
                          <h2 style={{ fontSize: "clamp(1.25rem,2.5vw,1.75rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15, marginTop: "0.25rem" }}>
                            {currentStep.headline}
                          </h2>
                        </div>
                      </div>
                      <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "hsl(214,7%,62%)", marginBottom: "2.5rem" }}>
                        {currentStep.body}
                      </p>

                      <div style={{ display: "grid", gap: "1rem" }} className="sm:grid-cols-2 lg:grid-cols-2">
                        {[
                          { label: "Investor", description: "Thesis, moat, data room, architecture", href: "/investors/overview", color: "hsl(38,72%,58%)", rgb: "212,160,84" },
                          { label: "Lender / Bank", description: "Working capital narrative and commercial plan", href: "/investor-relations", color: "hsl(192,72%,48%)", rgb: "25,180,210" },
                          { label: "Operator / Buyer", description: "Platform demo, how it works, solutions", href: "/demo", color: "hsl(145,60%,46%)", rgb: "58,168,90" },
                          { label: "Design Partner", description: "90-day proof program — instrument one workflow", href: "/design-partners", color: "hsl(222,60%,60%)", rgb: "86,112,214" },
                        ].map((cta) => (
                          <Link
                            key={cta.label}
                            href={cta.href}
                            style={{
                              display: "block",
                              padding: "1.25rem",
                              borderRadius: "0.625rem",
                              background: `rgba(${cta.rgb}, 0.05)`,
                              border: `1px solid rgba(${cta.rgb}, 0.15)`,
                              textDecoration: "none",
                              transition: "background 0.18s ease",
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `rgba(${cta.rgb}, 0.09)`; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `rgba(${cta.rgb}, 0.05)`; }}
                          >
                            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: cta.color, marginBottom: "0.25rem" }}>{cta.label}</p>
                            <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,60%)", lineHeight: 1.55 }}>{cta.description}</p>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.75rem" }}>
                              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: cta.color }}>View materials</span>
                              <ArrowRight size={11} style={{ color: cta.color }} />
                            </div>
                          </Link>
                        ))}
                      </div>

                      <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid hsla(0,0%,100%,0.06)" }}>
                        <p style={{ fontSize: "0.8125rem", color: "hsl(214,7%,55%)", marginBottom: "0.875rem" }}>
                          Or start a direct conversation with the founder:
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem" }}>
                          <Link href="/contact" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.625rem 1.25rem", background: "hsl(192,72%,48%)", color: "hsl(214,18%,4%)", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 600, textDecoration: "none" }}>
                            Start a conversation <ArrowRight size={13} />
                          </Link>
                          <Link href="/trust" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.625rem 1.25rem", background: "transparent", color: "hsl(214,7%,62%)", border: "1px solid hsla(0,0%,100%,0.10)", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, textDecoration: "none" }}>
                            Full trust center
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      borderRadius: "0.875rem",
                      background: `rgba(${currentStep.colorRgb}, 0.04)`,
                      border: `1px solid rgba(${currentStep.colorRgb}, 0.14)`,
                      overflow: "hidden",
                    }}>
                      <div style={{ padding: "clamp(1.5rem,3vw,2.25rem)", borderBottom: `1px solid rgba(${currentStep.colorRgb}, 0.12)` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                          <div style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.5rem", background: `rgba(${currentStep.colorRgb}, 0.12)`, border: `1px solid rgba(${currentStep.colorRgb}, 0.25)` }}>
                            <StepIcon size={18} style={{ color: currentStep.color }} />
                          </div>
                          <div>
                            <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: currentStep.color, fontFamily: "var(--font-mono)" }}>
                              Stage {currentStep.step} of {TRUST_STEPS.length}
                            </p>
                            <h2 style={{ fontSize: "clamp(1.25rem,2.5vw,1.75rem)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15, marginTop: "0.2rem" }}>
                              {currentStep.headline}
                            </h2>
                          </div>
                        </div>
                        <p style={{ fontSize: "0.9375rem", lineHeight: 1.72, color: "hsl(214,7%,60%)" }}>
                          {currentStep.body}
                        </p>
                      </div>

                      {currentStep.evidence.length > 0 && (
                        <div style={{ padding: "clamp(1.5rem,3vw,2rem)", borderBottom: `1px solid rgba(${currentStep.colorRgb}, 0.10)` }}>
                          <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(214,7%,45%)", fontFamily: "var(--font-mono)", marginBottom: "1rem" }}>
                            Evidence
                          </p>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                            {currentStep.evidence.map((item, i) => (
                              <m.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: i * 0.06 }}
                                style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}
                              >
                                <CheckCircle2 size={14} style={{ color: currentStep.color, marginTop: "2px", flexShrink: 0 }} />
                                <span style={{ fontSize: "0.875rem", lineHeight: 1.62, color: "hsl(214,7%,68%)" }}>{item}</span>
                              </m.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {currentStep.receipts.length > 0 && (
                        <div style={{ padding: "clamp(1.25rem,2.5vw,1.75rem)", borderBottom: `1px solid rgba(${currentStep.colorRgb}, 0.08)` }}>
                          <p style={{ fontSize: "0.6875rem", fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "hsl(214,7%,45%)", fontFamily: "var(--font-mono)", marginBottom: "0.875rem" }}>
                            Trust receipts
                          </p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                            {currentStep.receipts.map((receipt) => (
                              <Link
                                key={receipt.href}
                                href={receipt.href}
                                style={{
                                  display: "inline-flex", alignItems: "center", gap: "0.375rem",
                                  padding: "0.375rem 0.75rem",
                                  borderRadius: "0.375rem",
                                  background: `rgba(${currentStep.colorRgb}, 0.06)`,
                                  border: `1px solid rgba(${currentStep.colorRgb}, 0.18)`,
                                  fontSize: "0.8125rem", fontWeight: 500,
                                  color: currentStep.color,
                                  textDecoration: "none",
                                  transition: "background 0.18s ease",
                                }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `rgba(${currentStep.colorRgb}, 0.11)`; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `rgba(${currentStep.colorRgb}, 0.06)`; }}
                              >
                                {receipt.label}
                                <ArrowRight size={11} />
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ padding: "clamp(1.25rem,2.5vw,1.75rem)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {TRUST_STEPS.slice(0, -1).map((_, i) => (
                            <div
                              key={i}
                              style={{
                                width: "20px", height: "3px", borderRadius: "1.5px",
                                background: completedSteps.includes(i) ? currentStep.color : i === activeStep ? `rgba(${currentStep.colorRgb}, 0.5)` : "hsla(0,0%,100%,0.08)",
                                transition: "background 0.3s ease",
                              }}
                            />
                          ))}
                        </div>
                        {activeStep < TRUST_STEPS.length - 1 && (
                          <button
                            onClick={handleNext}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: "0.375rem",
                              padding: "0.625rem 1.25rem",
                              background: `rgba(${currentStep.colorRgb}, 0.12)`,
                              border: `1px solid rgba(${currentStep.colorRgb}, 0.28)`,
                              borderRadius: "0.375rem",
                              fontSize: "0.875rem", fontWeight: 600,
                              color: currentStep.color,
                              cursor: "pointer",
                              transition: "background 0.18s ease",
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `rgba(${currentStep.colorRgb}, 0.18)`; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `rgba(${currentStep.colorRgb}, 0.12)`; }}
                          >
                            {activeStep === TRUST_STEPS.length - 2 ? "See next steps" : "Continue to next stage"}
                            <ArrowRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {activeStep < TRUST_STEPS.length - 1 && (
                    <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Database size={12} style={{ color: "hsl(214,7%,40%)" }} />
                      <p style={{ fontSize: "0.75rem", color: "hsl(214,7%,45%)" }}>
                        Your progress is saved for this session. Jump to any stage using the left panel.
                      </p>
                    </div>
                  )}
                </m.div>
              </AnimatePresence>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
