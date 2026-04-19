import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  Database,
  Compass,
  GitBranch,
  CheckCircle2,
  Sparkles,
  Loader2,
  Shield,
  Brain,
  Radio,
  ScrollText,
} from "lucide-react";

const ONBOARDING_STORAGE_KEY = "szl.onboarding.v1";

type WizardState = {
  completedSteps: number[];
  org: {
    name: string;
    industry: string;
    teamSize: string;
    primaryUseCase: string;
  };
  demoSeeded: boolean;
  loopWalkthroughDone: boolean;
  finishedAt?: string;
};

const DEFAULT_STATE: WizardState = {
  completedSteps: [],
  org: { name: "", industry: "", teamSize: "", primaryUseCase: "" },
  demoSeeded: false,
  loopWalkthroughDone: false,
};

function loadState(): WizardState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<WizardState>;
    return { ...DEFAULT_STATE, ...parsed, org: { ...DEFAULT_STATE.org, ...(parsed.org ?? {}) } };
  } catch {
    return DEFAULT_STATE;
  }
}

function persist(state: WizardState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
}

export function isOnboardingComplete(): boolean {
  const s = loadState();
  return s.completedSteps.length >= 4 && Boolean(s.finishedAt);
}

const INDUSTRIES = [
  "Defense / Security",
  "Maritime / Logistics",
  "Real Estate",
  "Professional Services",
  "Financial Services",
  "Other",
];

const TEAM_SIZES = ["1–10", "11–50", "51–250", "251–1,000", "1,000+"];

const USE_CASES = [
  { id: "ops", title: "Operational signals", subtitle: "Surface the signals my team should act on today" },
  { id: "risk", title: "Risk & compliance", subtitle: "Govern decisions with proof, policy, and audit trail" },
  { id: "exec", title: "Executive briefing", subtitle: "Roll up cross-domain status into one command view" },
  { id: "advisory", title: "Advisory / pilot", subtitle: "Evaluate the platform with a guided demo" },
];

const LOOP_STEPS: { label: string; icon: React.ReactNode; blurb: string }[] = [
  { label: "Signal", icon: <Radio className="w-3.5 h-3.5" />, blurb: "A business event is detected and surfaced in the queue." },
  { label: "Context", icon: <Compass className="w-3.5 h-3.5" />, blurb: "Cross-domain intelligence enriches the signal with prior art." },
  { label: "Recommendation", icon: <Brain className="w-3.5 h-3.5" />, blurb: "AI proposes an action with evidence and confidence score." },
  { label: "Simulation", icon: <Sparkles className="w-3.5 h-3.5" />, blurb: "Monte Carlo models the risk of acting vs. waiting." },
  { label: "Policy", icon: <Shield className="w-3.5 h-3.5" />, blurb: "Covenant Policy verifies the action is authorized." },
  { label: "Approval", icon: <CheckCircle2 className="w-3.5 h-3.5" />, blurb: "Required human approvers are notified and confirm." },
  { label: "Execution", icon: <GitBranch className="w-3.5 h-3.5" />, blurb: "The action runs as a tracked, durable workflow." },
  { label: "Proof", icon: <ScrollText className="w-3.5 h-3.5" />, blurb: "An immutable Proof Chain record is sealed." },
  { label: "Outcome", icon: <CheckCircle2 className="w-3.5 h-3.5" />, blurb: "Real-world result is captured and compared to the prediction." },
];

const STEPS = [
  { idx: 1, label: "Org setup", icon: <Building2 className="w-3.5 h-3.5" /> },
  { idx: 2, label: "Seed demo data", icon: <Database className="w-3.5 h-3.5" /> },
  { idx: 3, label: "First view", icon: <Compass className="w-3.5 h-3.5" /> },
  { idx: 4, label: "Decision loop", icon: <GitBranch className="w-3.5 h-3.5" /> },
];

function StepHeader({ current, completed }: { current: number; completed: number[] }) {
  return (
    <div className="flex items-center gap-2 mb-6 flex-wrap" data-testid="wizard-stepper">
      {STEPS.map((s, i) => {
        const isDone = completed.includes(s.idx);
        const isActive = current === s.idx;
        const tone = isActive
          ? "border-amber-400/50 bg-amber-500/10 text-amber-200"
          : isDone
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
          : "border-amber-500/15 bg-transparent text-amber-400/40";
        return (
          <div key={s.idx} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded border font-mono text-[11px] uppercase tracking-wider ${tone}`}
              data-testid={`wizard-step-pill-${s.idx}`}
            >
              {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.icon}
              <span>
                {String(s.idx).padStart(2, "0")} · {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && <div className="h-px w-4 bg-amber-500/20" />}
          </div>
        );
      })}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="cockpit-panel border border-amber-500/20 p-6 rounded-md">{children}</div>
  );
}

function PrimaryButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }
) {
  const { children, className = "", disabled, ...rest } = props;
  return (
    <button
      {...rest}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded font-mono text-xs uppercase tracking-wider border transition-colors ${
        disabled
          ? "border-amber-500/15 text-amber-400/30 cursor-not-allowed"
          : "border-amber-400/50 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function SecondaryButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }
) {
  const { children, className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded font-mono text-xs uppercase tracking-wider border border-amber-500/20 text-amber-300/70 hover:bg-amber-500/5 ${className}`}
    >
      {children}
    </button>
  );
}

export default function OnboardingPage() {
  const [, navigate] = useLocation();
  const [state, setState] = useState<WizardState>(() => loadState());
  const initialStep = useMemo(() => {
    const next = STEPS.find((s) => !state.completedSteps.includes(s.idx));
    return next ? next.idx : 4;
  }, []);
  const [current, setCurrent] = useState<number>(initialStep);
  const [seeding, setSeeding] = useState(false);
  const [loopStep, setLoopStep] = useState(0);

  useEffect(() => {
    persist(state);
  }, [state]);

  const markComplete = (step: number, partial?: Partial<WizardState>) => {
    setState((prev) => {
      const completedSteps = Array.from(new Set([...prev.completedSteps, step])).sort((a, b) => a - b);
      const next: WizardState = { ...prev, ...partial, completedSteps };
      if (completedSteps.length === STEPS.length && !next.finishedAt) {
        next.finishedAt = new Date().toISOString();
      }
      return next;
    });
  };

  const goNext = () => setCurrent((c) => Math.min(c + 1, STEPS.length));
  const goBack = () => setCurrent((c) => Math.max(c - 1, 1));

  const orgValid =
    state.org.name.trim().length >= 2 &&
    state.org.industry.length > 0 &&
    state.org.teamSize.length > 0 &&
    state.org.primaryUseCase.length > 0;

  const handleSeed = async () => {
    setSeeding(true);
    await new Promise((r) => setTimeout(r, 1400));
    markComplete(2, { demoSeeded: true });
    setSeeding(false);
  };

  const handleLoopAdvance = () => {
    setLoopStep((s) => {
      const next = s + 1;
      if (next >= LOOP_STEPS.length) {
        markComplete(4, { loopWalkthroughDone: true });
      }
      return Math.min(next, LOOP_STEPS.length);
    });
  };

  const handleResetWizard = () => {
    setState(DEFAULT_STATE);
    setCurrent(1);
    setLoopStep(0);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    }
  };

  const allDone = state.completedSteps.length === STEPS.length;

  return (
    <div className="max-w-4xl mx-auto py-6" data-testid="onboarding-wizard">
      <div className="mb-6">
        <p className="text-[10px] font-mono text-amber-400/40 uppercase tracking-wider mb-1">
          New-user onboarding · FLOW-001
        </p>
        <h1 className="text-2xl font-mono font-bold text-amber-200" data-testid="wizard-title">
          Get your org running on the SZL Holdings platform
        </h1>
        <p className="text-sm text-amber-300/60 mt-1">
          Four steps. About five minutes. No CLI, no engineer required.
        </p>
      </div>

      <StepHeader current={current} completed={state.completedSteps} />

      {current === 1 && (
        <Panel>
          <h2 className="text-lg font-mono text-amber-200 mb-1">Step 01 — Tell us about your org</h2>
          <p className="text-xs text-amber-300/60 mb-5">
            We use this to tailor your starting surface and the demo data we provision.
          </p>
          <div className="grid gap-4">
            <label className="block">
              <span className="text-[10px] font-mono text-amber-400/60 uppercase tracking-wider">Organization name</span>
              <input
                data-testid="org-name-input"
                value={state.org.name}
                onChange={(e) => setState((p) => ({ ...p, org: { ...p.org, name: e.target.value } }))}
                placeholder="e.g. Northwind Maritime"
                className="mt-1 w-full bg-black/30 border border-amber-500/20 rounded px-3 py-2 text-sm text-amber-100 placeholder:text-amber-400/30 focus:outline-none focus:border-amber-400/60"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-mono text-amber-400/60 uppercase tracking-wider">Industry</span>
              <select
                data-testid="org-industry-select"
                value={state.org.industry}
                onChange={(e) => setState((p) => ({ ...p, org: { ...p.org, industry: e.target.value } }))}
                className="mt-1 w-full bg-black/30 border border-amber-500/20 rounded px-3 py-2 text-sm text-amber-100 focus:outline-none focus:border-amber-400/60"
              >
                <option value="">Select industry…</option>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] font-mono text-amber-400/60 uppercase tracking-wider">Team size</span>
              <div className="mt-1 flex flex-wrap gap-2">
                {TEAM_SIZES.map((t) => {
                  const sel = state.org.teamSize === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      data-testid={`team-size-${t}`}
                      onClick={() => setState((p) => ({ ...p, org: { ...p.org, teamSize: t } }))}
                      className={`px-3 py-1.5 rounded border font-mono text-xs ${
                        sel
                          ? "border-amber-400/50 bg-amber-500/10 text-amber-200"
                          : "border-amber-500/15 text-amber-300/60 hover:bg-amber-500/5"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </label>
            <div>
              <span className="text-[10px] font-mono text-amber-400/60 uppercase tracking-wider">
                Primary use case
              </span>
              <div className="grid sm:grid-cols-2 gap-2 mt-1">
                {USE_CASES.map((u) => {
                  const sel = state.org.primaryUseCase === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      data-testid={`use-case-${u.id}`}
                      onClick={() => setState((p) => ({ ...p, org: { ...p.org, primaryUseCase: u.id } }))}
                      className={`text-left p-3 rounded border ${
                        sel
                          ? "border-amber-400/50 bg-amber-500/10"
                          : "border-amber-500/15 hover:bg-amber-500/5"
                      }`}
                    >
                      <p className="text-sm font-medium text-amber-100">{u.title}</p>
                      <p className="text-[11px] text-amber-300/60 mt-0.5">{u.subtitle}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <PrimaryButton
              data-testid="step-1-continue"
              disabled={!orgValid}
              onClick={() => {
                markComplete(1);
                goNext();
              }}
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </PrimaryButton>
          </div>
        </Panel>
      )}

      {current === 2 && (
        <Panel>
          <h2 className="text-lg font-mono text-amber-200 mb-1">Step 02 — Seed your demo workspace</h2>
          <p className="text-xs text-amber-300/60 mb-5">
            One click provisions realistic signals, recommendations, policies, and a worked governed
            decision so you can explore the platform with real-feeling data. Nothing leaves your tenant.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mb-5">
            {[
              { label: "Signals", count: 47 },
              { label: "Recommendations", count: 12 },
              { label: "Sealed proofs", count: 9 },
            ].map((card) => (
              <div key={card.label} className="border border-amber-500/15 rounded p-3">
                <p className="text-[10px] font-mono text-amber-400/40 uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl font-mono font-bold text-amber-300 mt-1">{card.count}</p>
              </div>
            ))}
          </div>
          {state.demoSeeded ? (
            <div
              className="flex items-center gap-2 p-3 border border-emerald-500/30 bg-emerald-500/5 rounded"
              data-testid="seed-success"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-300">Demo workspace ready. You can re-seed at any time from Settings.</span>
            </div>
          ) : (
            <PrimaryButton data-testid="seed-demo-button" onClick={handleSeed} disabled={seeding}>
              {seeding ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Seeding…
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5" /> Seed demo workspace
                </>
              )}
            </PrimaryButton>
          )}
          <div className="flex justify-between mt-6">
            <SecondaryButton onClick={goBack}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </SecondaryButton>
            <PrimaryButton
              data-testid="step-2-continue"
              disabled={!state.demoSeeded}
              onClick={goNext}
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </PrimaryButton>
          </div>
        </Panel>
      )}

      {current === 3 && (
        <Panel>
          <h2 className="text-lg font-mono text-amber-200 mb-1">Step 03 — Land in your first view</h2>
          <p className="text-xs text-amber-300/60 mb-5">
            Based on your use case, your starting surface is the <span className="text-amber-300">Lyte Overview</span> —
            the live cockpit for signals, decisions, and workflow health.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mb-5">
            {[
              { href: "/overview", icon: <Compass className="w-4 h-4" />, title: "Overview", blurb: "Cockpit metrics" },
              { href: "/signals", icon: <Radio className="w-4 h-4" />, title: "Signals Console", blurb: "Live ranked feed" },
              { href: "/decisions", icon: <Brain className="w-4 h-4" />, title: "Decision Center", blurb: "Recommendations queue" },
            ].map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="p-3 border border-amber-500/15 rounded hover:bg-amber-500/5 block"
                data-testid={`tour-link-${c.href.replace("/", "")}`}
              >
                <div className="flex items-center gap-2 text-amber-300">
                  {c.icon}
                  <span className="text-sm font-medium">{c.title}</span>
                </div>
                <p className="text-[11px] text-amber-300/60 mt-1">{c.blurb}</p>
              </Link>
            ))}
          </div>
          <div className="flex justify-between mt-6">
            <SecondaryButton onClick={goBack}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </SecondaryButton>
            <PrimaryButton
              data-testid="step-3-continue"
              onClick={() => {
                markComplete(3);
                goNext();
              }}
            >
              Mark visited & continue <ArrowRight className="w-3.5 h-3.5" />
            </PrimaryButton>
          </div>
        </Panel>
      )}

      {current === 4 && (
        <Panel>
          <h2 className="text-lg font-mono text-amber-200 mb-1">Step 04 — Walk a governed decision loop</h2>
          <p className="text-xs text-amber-300/60 mb-5">
            Every action on the platform follows the same nine-step loop. Step through it once so the
            sequence is familiar before you take a real decision.
          </p>
          <div className="space-y-2" data-testid="loop-walkthrough">
            {LOOP_STEPS.map((s, i) => {
              const reached = i < loopStep;
              const active = i === loopStep;
              return (
                <div
                  key={s.label}
                  data-testid={`loop-step-${i}`}
                  className={`flex items-start gap-3 p-3 rounded border ${
                    active
                      ? "border-amber-400/50 bg-amber-500/10"
                      : reached
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-amber-500/10"
                  }`}
                >
                  <div
                    className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] ${
                      reached
                        ? "bg-emerald-500/20 text-emerald-300"
                        : active
                        ? "bg-amber-500/20 text-amber-200"
                        : "bg-amber-500/5 text-amber-400/40"
                    }`}
                  >
                    {reached ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-300">{s.icon}</span>
                      <p className="text-sm font-medium text-amber-100">{s.label}</p>
                    </div>
                    <p className="text-[11px] text-amber-300/60 mt-0.5">{s.blurb}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-6">
            <SecondaryButton onClick={goBack}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </SecondaryButton>
            {loopStep < LOOP_STEPS.length ? (
              <PrimaryButton data-testid="loop-advance" onClick={handleLoopAdvance}>
                Advance loop ({loopStep}/{LOOP_STEPS.length}) <ArrowRight className="w-3.5 h-3.5" />
              </PrimaryButton>
            ) : (
              <Link
                href="/overview"
                className="inline-flex items-center gap-2 px-4 py-2 rounded font-mono text-xs uppercase tracking-wider border border-emerald-400/50 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                data-testid="finish-onboarding"
                onClick={() => navigate("/overview")}
              >
                Enter command surface <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </Panel>
      )}

      {allDone && (
        <div
          className="mt-6 p-4 border border-emerald-500/30 bg-emerald-500/5 rounded flex items-start gap-3"
          data-testid="onboarding-complete-banner"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-emerald-200 font-medium">Onboarding complete.</p>
            <p className="text-[11px] text-emerald-300/70 mt-1">
              You can re-run this wizard any time from <span className="font-mono">/onboarding</span>.
            </p>
          </div>
          <SecondaryButton onClick={handleResetWizard} data-testid="reset-wizard">
            Re-run wizard
          </SecondaryButton>
        </div>
      )}
    </div>
  );
}
