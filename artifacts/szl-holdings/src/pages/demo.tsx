import { useState } from "react";
import { m, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle, Play, BarChart3, Zap, GitBranch, Shield, Eye, Clock } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { DataStateBadge } from "@/components/DataStateBadge";
import { usePageMeta } from "@/hooks/usePageMeta";
import { toast } from "sonner";

const API_BASE = "/api";

interface DemoStep {
  id: string;
  label: string;
  platform: "Lyte" | "Alloy";
  icon: typeof BarChart3;
  duration: string;
  headline: string;
  description: string;
  details: string[];
  accent: string;
  accentRgb: string;
  dataState: "DEMO DATA" | "LIVE" | "PILOT";
  ctaLabel?: string;
  ctaHref?: string;
}

const DEMO_STEPS: DemoStep[] = [
  {
    id: "signal-detection",
    label: "Signal Detection",
    platform: "Lyte",
    icon: Eye,
    duration: "2 min",
    headline: "See the signals before they become incidents.",
    description: "Lyte's PRISM engine continuously monitors your operational surface — approval queues, ownership gaps, workflow drift, and performance anomalies — and surfaces them the moment they cross threshold.",
    details: [
      "PRISM Signals layer: real-time anomaly detection across connected systems",
      "Approval latency surfaced before it compounds into risk",
      "Ownership gap detection with responsible-party attribution",
      "Risk classification: severity, velocity, and blast radius scoring",
    ],
    accent: "hsl(192,80%,48%)",
    accentRgb: "6,182,212",
    dataState: "DEMO DATA",
    ctaLabel: "Open Lyte Dashboard",
    ctaHref: "/lyte-command-center/",
  },
  {
    id: "action-routing",
    label: "Action Routing",
    platform: "Alloy",
    icon: GitBranch,
    duration: "2 min",
    headline: "Route action. Not noise.",
    description: "When Lyte surfaces a signal, Alloy routes it to the right person with the right context. No alert fatigue. No missed escalations. Every action has an owner, a deadline, and a tracked outcome.",
    details: [
      "Intelligent routing rules: role, urgency, escalation path",
      "Human-in-the-loop gates for consequential decisions",
      "Full context handed off — signal, evidence, recommended action",
      "SLA tracking: response time, resolution time, breach detection",
    ],
    accent: "hsl(222,68%,60%)",
    accentRgb: "86,122,214",
    dataState: "DEMO DATA",
    ctaLabel: "Open Alloy",
    ctaHref: "/alloy/",
  },
  {
    id: "execution-verification",
    label: "Execution Verification",
    platform: "Alloy",
    icon: CheckCircle,
    duration: "2 min",
    headline: "Confirm it happened. Prove it.",
    description: "Every action taken through Alloy creates an immutable audit record. Who acted, when, with what authority, and what the outcome was. This is execution accountability — not just logging.",
    details: [
      "Immutable audit trail: actor, timestamp, decision context",
      "Evidence capture: before/after state, rationale, approvals",
      "Compliance-ready export formats",
      "Exception tracking: actions not taken, escalations overridden",
    ],
    accent: "hsl(142,62%,46%)",
    accentRgb: "34,197,94",
    dataState: "DEMO DATA",
    ctaLabel: "Open Governance Audit",
    ctaHref: "/alloy/governance",
  },
  {
    id: "orchestration",
    label: "Orchestration Dashboard",
    platform: "Alloy",
    icon: Zap,
    duration: "2 min",
    headline: "One view of everything in motion.",
    description: "The Alloy orchestration dashboard gives operators a single surface — active workflows, pending approvals, signal feeds, execution status, and cross-platform health — all in one operational layer.",
    details: [
      "Factory floor view: active workflows, queue depth, throughput",
      "Cross-platform signal aggregation: Lyte, Aegis, Terra, Vessels",
      "Approval queue with priority sorting and context preview",
      "Real-time execution health with drift detection",
    ],
    accent: "hsl(38,55%,58%)",
    accentRgb: "191,152,82",
    dataState: "DEMO DATA",
    ctaLabel: "Open Alloy Factory Floor",
    ctaHref: "/alloy/",
  },
];

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            height: "3px",
            flex: 1,
            borderRadius: "2px",
            background: i <= current ? "hsl(192,80%,48%)" : "hsla(0,0%,100%,0.10)",
            transition: "background 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

export default function DemoPage() {
  const [step, setStep] = useState(0);
  const [accessForm, setAccessForm] = useState({ name: "", email: "", company: "" });
  const [accessErrors, setAccessErrors] = useState<Record<string, string>>({});
  const [accessSubmitting, setAccessSubmitting] = useState(false);
  const [accessSent, setAccessSent] = useState(false);

  usePageMeta({
    title: "Demo — Lyte + Alloy | SZL Holdings",
    description: "An 8-minute guided walkthrough of Lyte + Alloy: signal detection, action routing, execution verification, and orchestration dashboard.",
    canonical: "https://szlholdings.com/demo",
  });

  const currentStep = DEMO_STEPS[step];
  const isLast = step === DEMO_STEPS.length - 1;

  const handleNext = () => {
    if (!isLast) setStep((s) => s + 1);
  };

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const validateAccess = () => {
    const e: Record<string, string> = {};
    if (!accessForm.name.trim()) e.name = "Name is required";
    if (!accessForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accessForm.email)) e.email = "Valid email required";
    if (!accessForm.company.trim()) e.company = "Company is required";
    return e;
  };

  const handleAccessRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateAccess();
    if (Object.keys(errs).length > 0) { setAccessErrors(errs); return; }
    setAccessErrors({});
    setAccessSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/holdings/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: accessForm.name.trim(),
          email: accessForm.email.trim(),
          company: accessForm.company.trim(),
          subject: "Demo Access Request — Lyte + Alloy",
          message: `Demo access request from ${accessForm.name.trim()} at ${accessForm.company.trim()}. Email: ${accessForm.email.trim()}`,
        }),
      });
      if (response.status === 201 || response.ok) {
        setAccessSent(true);
        toast.success("Request received. We'll follow up within 24 hours.");
      } else {
        setAccessErrors({ general: "Submission failed. Please try again or email inquiries@szlholdings.com." });
      }
    } catch {
      setAccessErrors({ general: "Network error. Please check your connection and try again." });
    } finally {
      setAccessSubmitting(false);
    }
  };

  const inputStyle = (hasError?: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "0.625rem 0.875rem",
    background: "hsla(0,0%,100%,0.04)",
    border: `1px solid ${hasError ? "hsla(0,72%,55%,0.5)" : "hsla(0,0%,100%,0.09)"}`,
    borderRadius: "6px",
    color: "hsl(38,12%,88%)",
    fontSize: "13.5px",
    outline: "none",
    transition: "border-color 0.18s",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  });

  const StepIcon = currentStep.icon;

  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <SiteNav />
      <main className="pt-24">

        <section style={{ padding: "3rem 0 2rem" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <Play size={12} style={{ color: "hsl(192,80%,48%)" }} />
                <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)" }}>
                  Guided Demo · 8–12 minutes
                </p>
              </div>
              <h1 style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.025em", color: "hsl(38,12%,94%)", lineHeight: 1.1, marginBottom: "0.875rem" }}>
                Lyte + Alloy: Business Observability<br />and Execution Accountability
              </h1>
              <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "hsl(210,5%,58%)", maxWidth: "40rem" }}>
                A step-by-step walkthrough of the four most important screens: signal detection, action routing, execution verification, and the orchestration dashboard.
              </p>
            </m.div>
          </div>
        </section>

        <section style={{ padding: "0 0 2rem" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.625rem" }}>
                <p style={{ fontSize: "11px", color: "hsl(210,5%,40%)", fontFamily: "var(--font-mono, monospace)" }}>
                  Step {step + 1} of {DEMO_STEPS.length}
                </p>
                <div style={{ display: "flex", gap: "0.375rem" }}>
                  {DEMO_STEPS.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => setStep(i)}
                      style={{
                        padding: "3px 10px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: 600,
                        cursor: "pointer",
                        background: i === step ? "hsla(192,80%,48%,0.15)" : "transparent",
                        border: i === step ? "1px solid hsla(192,80%,48%,0.35)" : "1px solid transparent",
                        color: i === step ? "hsl(192,80%,55%)" : "hsl(210,5%,42%)",
                        transition: "all 0.18s",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <ProgressBar current={step} total={DEMO_STEPS.length} />
            </div>

            <AnimatePresence mode="wait">
              <m.div
                key={currentStep.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="grid lg:grid-cols-2 gap-8">
                  <div style={{ position: "relative", padding: "2rem", borderRadius: "12px", background: `rgba(${currentStep.accentRgb}, 0.04)`, border: `1px solid rgba(${currentStep.accentRgb}, 0.16)`, minHeight: "340px" }}>
                    <DataStateBadge state={currentStep.dataState} position="top-right" />

                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1.5rem" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: `rgba(${currentStep.accentRgb}, 0.12)`, border: `1px solid rgba(${currentStep.accentRgb}, 0.22)` }}>
                        <StepIcon size={15} style={{ color: currentStep.accent }} />
                      </div>
                      <div>
                        <p style={{ fontSize: "9.5px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: currentStep.accent }}>{currentStep.platform}</p>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "hsl(38,12%,88%)" }}>{currentStep.label}</p>
                      </div>
                      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px", color: "hsl(210,5%,42%)", fontSize: "11px" }}>
                        <Clock size={10} />
                        {currentStep.duration}
                      </div>
                    </div>

                    <h2 style={{ fontSize: "clamp(1.125rem, 2vw, 1.4rem)", fontWeight: 700, letterSpacing: "-0.02em", color: "hsl(38,12%,92%)", marginBottom: "0.875rem", lineHeight: 1.25 }}>
                      {currentStep.headline}
                    </h2>
                    <p style={{ fontSize: "13.5px", lineHeight: 1.7, color: "hsl(210,5%,58%)", marginBottom: "1.5rem" }}>
                      {currentStep.description}
                    </p>

                    {currentStep.ctaLabel && currentStep.ctaHref && (
                      <a
                        href={currentStep.ctaHref}
                        style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 600, color: currentStep.accent, textDecoration: "none", padding: "0.5rem 1rem", borderRadius: "6px", background: `rgba(${currentStep.accentRgb}, 0.08)`, border: `1px solid rgba(${currentStep.accentRgb}, 0.2)`, transition: "all 0.2s" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `rgba(${currentStep.accentRgb}, 0.14)`; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `rgba(${currentStep.accentRgb}, 0.08)`; }}
                      >
                        {currentStep.ctaLabel} <ArrowRight size={11} strokeWidth={2.5} />
                      </a>
                    )}
                  </div>

                  <div>
                    <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,40%)", marginBottom: "1rem" }}>What you'll see</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                      {currentStep.details.map((detail, i) => (
                        <m.div
                          key={i}
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.35, delay: i * 0.07 }}
                          style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", padding: "0.875rem 1rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.06)" }}
                        >
                          <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: `rgba(${currentStep.accentRgb}, 0.12)`, border: `1px solid rgba(${currentStep.accentRgb}, 0.22)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                            <span style={{ fontSize: "8px", fontWeight: 700, color: currentStep.accent }}>{i + 1}</span>
                          </div>
                          <p style={{ fontSize: "13px", lineHeight: 1.6, color: "hsl(210,5%,58%)" }}>{detail}</p>
                        </m.div>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: "0.625rem", marginTop: "2rem" }}>
                      <button
                        onClick={handlePrev}
                        disabled={step === 0}
                        style={{
                          display: "flex", alignItems: "center", gap: "5px",
                          padding: "0.625rem 1rem", borderRadius: "6px",
                          background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.09)",
                          color: step === 0 ? "hsl(210,5%,30%)" : "hsl(210,5%,56%)",
                          fontSize: "12px", fontWeight: 600, cursor: step === 0 ? "not-allowed" : "pointer",
                          transition: "all 0.18s",
                        }}
                      >
                        <ArrowLeft size={12} /> Back
                      </button>
                      {!isLast ? (
                        <button
                          onClick={handleNext}
                          style={{
                            display: "flex", alignItems: "center", gap: "5px",
                            padding: "0.625rem 1.25rem", borderRadius: "6px",
                            background: "hsl(38,12%,86%)", border: "none",
                            color: "hsl(210,12%,6%)", fontSize: "12px", fontWeight: 700,
                            cursor: "pointer", transition: "all 0.18s",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(38,15%,94%)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsl(38,12%,86%)"; }}
                        >
                          Next: {DEMO_STEPS[step + 1].label} <ArrowRight size={12} strokeWidth={2.5} />
                        </button>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "0.625rem 1rem", borderRadius: "6px", background: "hsla(142,62%,46%,0.1)", border: "1px solid hsla(142,62%,46%,0.25)", color: "hsl(142,55%,62%)", fontSize: "12px", fontWeight: 600 }}>
                          <CheckCircle size={12} /> Demo complete
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </m.div>
            </AnimatePresence>
          </div>
        </section>

        <section style={{ padding: "3rem 0 5rem", borderTop: "1px solid hsla(0,0%,100%,0.04)", background: "hsl(210,12%,6%)" }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <div>
                <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "0.75rem" }}>
                  Request Access
                </p>
                <h2 style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)", fontWeight: 700, letterSpacing: "-0.022em", color: "hsl(38,12%,92%)", marginBottom: "0.875rem" }}>
                  Ready to see it in your environment?
                </h2>
                <p style={{ fontSize: "14px", lineHeight: 1.7, color: "hsl(210,5%,55%)", maxWidth: "30rem", marginBottom: "1.5rem" }}>
                  We run a focused 3-month design partner engagement — Lyte + Alloy instrumented against your actual operational data. You see real signals, real routing, real audit trail.
                </p>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <Link href="/pricing" style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "0.5rem 1rem", borderRadius: "6px", fontSize: "12px", fontWeight: 600, color: "hsl(210,5%,56%)", border: "1px solid hsla(0,0%,100%,0.09)", textDecoration: "none", background: "transparent", transition: "all 0.18s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,12%,88%)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,56%)"; }}
                  >
                    See Pilot Details <ArrowRight size={11} strokeWidth={2.5} />
                  </Link>
                </div>
              </div>

              <div style={{ padding: "1.75rem", borderRadius: "12px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.07)" }}>
                {accessSent ? (
                  <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                    <CheckCircle size={28} style={{ color: "hsl(142,62%,50%)", margin: "0 auto 0.875rem" }} />
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "hsl(38,12%,88%)", marginBottom: "0.375rem" }}>Request received.</p>
                    <p style={{ fontSize: "13px", color: "hsl(210,5%,52%)" }}>We'll follow up within 24 hours to schedule a conversation.</p>
                  </div>
                ) : (
                  <form onSubmit={handleAccessRequest} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "hsl(210,5%,50%)", marginBottom: "0.3rem" }}>Name *</label>
                      <input type="text" placeholder="Your name" value={accessForm.name} onChange={(e) => { setAccessForm(p => ({ ...p, name: e.target.value })); if (accessErrors.name) setAccessErrors(p => { const n = { ...p }; delete n.name; return n; }); }} style={inputStyle(!!accessErrors.name)} />
                      {accessErrors.name && <p style={{ fontSize: "11px", color: "hsl(0,72%,65%)", marginTop: "0.2rem" }}>{accessErrors.name}</p>}
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "hsl(210,5%,50%)", marginBottom: "0.3rem" }}>Work Email *</label>
                      <input type="email" placeholder="you@company.com" value={accessForm.email} onChange={(e) => { setAccessForm(p => ({ ...p, email: e.target.value })); if (accessErrors.email) setAccessErrors(p => { const n = { ...p }; delete n.email; return n; }); }} style={inputStyle(!!accessErrors.email)} />
                      {accessErrors.email && <p style={{ fontSize: "11px", color: "hsl(0,72%,65%)", marginTop: "0.2rem" }}>{accessErrors.email}</p>}
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "hsl(210,5%,50%)", marginBottom: "0.3rem" }}>Company *</label>
                      <input type="text" placeholder="Organization" value={accessForm.company} onChange={(e) => { setAccessForm(p => ({ ...p, company: e.target.value })); if (accessErrors.company) setAccessErrors(p => { const n = { ...p }; delete n.company; return n; }); }} style={inputStyle(!!accessErrors.company)} />
                      {accessErrors.company && <p style={{ fontSize: "11px", color: "hsl(0,72%,65%)", marginTop: "0.2rem" }}>{accessErrors.company}</p>}
                    </div>
                    {accessErrors.general && <p style={{ fontSize: "12px", color: "hsl(0,72%,65%)" }}>{accessErrors.general}</p>}
                    <button
                      type="submit"
                      disabled={accessSubmitting}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "0.75rem 1.25rem", background: "hsl(38,12%,86%)", border: "none", borderRadius: "6px", color: "hsl(210,12%,6%)", fontSize: "13px", fontWeight: 700, cursor: accessSubmitting ? "not-allowed" : "pointer", opacity: accessSubmitting ? 0.7 : 1, transition: "all 0.18s", fontFamily: "inherit" }}
                    >
                      {accessSubmitting ? "Sending…" : "Request Access"} {!accessSubmitting && <ArrowRight size={13} strokeWidth={2.5} />}
                    </button>
                    <p style={{ fontSize: "11px", color: "hsl(210,5%,38%)", lineHeight: 1.5 }}>
                      We respond within 24 hours. No commitment required to start the conversation.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
