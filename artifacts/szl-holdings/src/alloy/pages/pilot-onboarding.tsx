import { useState } from "react";
import { DataStateBadge } from "@szl-holdings/shared-ui/data-state-badge";
import {
  CheckCircle, ChevronRight, Building2, Shield, Zap, Play, User,
  Settings2, Database, ArrowRight, Loader2, Star, AlertTriangle
} from "lucide-react";

interface OnboardingStep {
  id: number;
  label: string;
  description: string;
  icon: React.ReactNode;
  fields?: { key: string; label: string; type: "text" | "select" | "toggle"; options?: string[]; default?: string }[];
  autoComplete?: boolean;
}

const STEPS: OnboardingStep[] = [
  {
    id: 1,
    label: "Organization Setup",
    description: "Provision your tenant and configure basic identity.",
    icon: <Building2 className="w-4 h-4" />,
    fields: [
      { key: "orgName", label: "Organization Name", type: "text", default: "" },
      { key: "adminEmail", label: "Admin Email", type: "text", default: "" },
      { key: "plan", label: "Plan", type: "select", options: ["Design Partner (Pilot)", "Enterprise Trial", "Sandbox"] },
      { key: "timezone", label: "Timezone", type: "select", options: ["America/New_York", "America/Los_Angeles", "Europe/London", "Asia/Singapore"] },
    ],
  },
  {
    id: 2,
    label: "Initial Policies",
    description: "Apply governance policies to your tenant. One-click templates from the policy library.",
    icon: <Shield className="w-4 h-4" />,
    fields: [
      { key: "compliance", label: "Compliance Template", type: "select", options: ["SOC 2 Type II", "HIPAA-adjacent", "Financial Services", "None — custom"] },
      { key: "approvalMatrix", label: "Approval Matrix", type: "toggle", default: "true" },
      { key: "costBudget", label: "Monthly Budget ($)", type: "text", default: "500" },
      { key: "modelPolicy", label: "Model Policy", type: "select", options: ["Claude + GPT (recommended)", "GPT only", "Claude only", "Permissive"] },
    ],
  },
  {
    id: 3,
    label: "Seed Demo Data",
    description: "Populate your workspace with realistic sample data so you can explore immediately.",
    icon: <Database className="w-4 h-4" />,
    autoComplete: true,
    fields: [
      { key: "seedWorkflows", label: "Seed Workflows", type: "toggle", default: "true" },
      { key: "seedSignals", label: "Seed Signals", type: "toggle", default: "true" },
      { key: "seedDecisions", label: "Seed Decision Objects", type: "toggle", default: "true" },
      { key: "seedAuditLog", label: "Seed Audit Log", type: "toggle", default: "true" },
    ],
  },
  {
    id: 4,
    label: "Connect Your Data",
    description: "Connect at least one live data source or run fully in demo mode.",
    icon: <Settings2 className="w-4 h-4" />,
    fields: [
      { key: "integration", label: "Primary Integration", type: "select", options: ["Slack", "Microsoft Teams", "Jira", "Salesforce", "Email/SMTP", "Skip — demo mode"] },
      { key: "webhookEnabled", label: "Enable Webhooks", type: "toggle", default: "false" },
    ],
  },
  {
    id: 5,
    label: "First Workflow Execution",
    description: "Run your first workflow to confirm the environment is working end-to-end.",
    icon: <Play className="w-4 h-4" />,
    autoComplete: true,
  },
];

interface StepState {
  completed: boolean;
  values: Record<string, string>;
  running?: boolean;
}

function FieldInput({ field, value, onChange }: {
  field: NonNullable<OnboardingStep["fields"]>[number];
  value: string;
  onChange: (v: string) => void;
}) {
  if (field.type === "toggle") {
    const on = value === "true" || value === "" && field.default === "true";
    return (
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white">{field.label}</span>
        <button
          onClick={() => onChange(on ? "false" : "true")}
          className="relative w-8 h-4 rounded-full transition-all"
          style={{ background: on ? "rgba(16,185,129,0.8)" : "rgba(255,255,255,0.1)" }}
        >
          <div className="absolute top-0.5 rounded-full w-3 h-3 transition-all" style={{
            left: on ? "17px" : "2px",
            background: "white",
          }} />
        </button>
      </div>
    );
  }
  if (field.type === "select") {
    return (
      <div>
        <label className="text-[10px] block mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{field.label}</label>
        <select
          value={value || field.default || ""}
          onChange={e => onChange(e.target.value)}
          className="w-full rounded-lg border px-3 py-1.5 text-[11px] text-white outline-none"
          style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" }}
        >
          {field.options?.map(opt => (
            <option key={opt} value={opt} style={{ background: "#0c1420" }}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }
  return (
    <div>
      <label className="text-[10px] block mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{field.label}</label>
      <input
        type="text"
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder={`Enter ${field.label.toLowerCase()}`}
        className="w-full rounded-lg border px-3 py-1.5 text-[11px] text-white outline-none placeholder:text-white/20"
        style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" }}
      />
    </div>
  );
}

export default function PilotOnboarding() {
  const [activeStep, setActiveStep] = useState(0);
  const [stepStates, setStepStates] = useState<Record<number, StepState>>({});
  const [simulatingRun, setSimulatingRun] = useState(false);
  const [runComplete, setRunComplete] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  const getState = (id: number): StepState =>
    stepStates[id] ?? { completed: false, values: {} };

  const setValue = (stepId: number, key: string, val: string) => {
    setStepStates(prev => ({
      ...prev,
      [stepId]: {
        ...getState(stepId),
        values: { ...getState(stepId).values, [key]: val },
      },
    }));
  };

  const completeStep = async (step: OnboardingStep) => {
    if (step.id === 5) {
      setSimulatingRun(true);
      await new Promise(r => setTimeout(r, 2200));
      setSimulatingRun(false);
      setRunComplete(true);
      setStepStates(prev => ({ ...prev, [step.id]: { ...getState(step.id), completed: true } }));
      setOnboardingComplete(true);
      return;
    }
    setStepStates(prev => ({ ...prev, [step.id]: { ...getState(step.id), completed: true } }));
    if (activeStep < STEPS.length - 1) setActiveStep(s => s + 1);
  };

  const completedCount = STEPS.filter(s => getState(s.id).completed).length;

  return (
    <div className="max-w-3xl mx-auto space-y-5 p-1">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: "#f59e0b" }}>
              Alloy · Pilot Onboarding
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Pilot Onboarding Wizard</h1>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            For accepted design partners. Provision your tenant, apply policies, seed data, and run your first workflow.
          </p>
        </div>
        <DataStateBadge state="demo" />
      </div>

      <div className="flex items-center gap-2 px-4 py-2 rounded-lg border"
        style={{ borderColor: "rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.05)" }}>
        <Star className="w-3 h-3 shrink-0" style={{ color: "#f59e0b" }} />
        <span className="text-[11px]" style={{ color: "rgba(245,158,11,0.8)" }}>
          <strong>Design Partner Program</strong> — Limited to 5 design partners. This wizard provisions a sandbox tenant configuration on the platform.
        </span>
      </div>

      <div className="flex items-center gap-0 overflow-x-auto pb-1">
        {STEPS.map((step, idx) => {
          const state = getState(step.id);
          const isActive = activeStep === idx;
          const isComplete = state.completed;
          return (
            <div key={step.id} className="flex items-center shrink-0">
              <button
                onClick={() => setActiveStep(idx)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-xs"
                style={{
                  background: isActive ? "rgba(245,158,11,0.08)" : "transparent",
                  color: isComplete ? "#10b981" : isActive ? "#f59e0b" : "rgba(255,255,255,0.3)",
                  border: `1px solid ${isActive ? "rgba(245,158,11,0.25)" : "transparent"}`,
                }}
              >
                {isComplete ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                    style={{ background: isActive ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.06)" }}>
                    {step.id}
                  </span>
                )}
                <span className="font-medium hidden sm:block">{step.label}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <ChevronRight className="w-3 h-3 mx-1 shrink-0" style={{ color: "rgba(255,255,255,0.15)" }} />
              )}
            </div>
          );
        })}
      </div>

      <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
        Step {activeStep + 1} of {STEPS.length} · {completedCount} completed
      </div>

      {!onboardingComplete ? (
        <div className="rounded-xl border p-6 space-y-5" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
          {STEPS.map((step, idx) => {
            if (idx !== activeStep) return null;
            const state = getState(step.id);

            return (
              <div key={step.id} className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl shrink-0" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#f59e0b" }}>
                    {step.icon}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">{step.label}</h2>
                    <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{step.description}</p>
                  </div>
                </div>

                {step.fields && (
                  <div className="space-y-3">
                    {step.fields.map(field => (
                      <FieldInput
                        key={field.key}
                        field={field}
                        value={state.values[field.key] ?? ""}
                        onChange={v => setValue(step.id, field.key, v)}
                      />
                    ))}
                  </div>
                )}

                {step.id === 5 && (
                  <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "rgba(75,139,219,0.15)", background: "rgba(75,139,219,0.04)" }}>
                    <div className="text-xs font-semibold text-white">Sample Workflow: Invoice Approval</div>
                    <div className="space-y-2">
                      {[
                        { label: "Signal Ingested", done: runComplete || simulatingRun, active: simulatingRun },
                        { label: "Agent Processed", done: runComplete, active: false },
                        { label: "Decision Produced", done: runComplete, active: false },
                        { label: "Approval Requested", done: runComplete, active: false },
                        { label: "Audit Log Written", done: runComplete, active: false },
                      ].map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {s.done ? (
                            <CheckCircle className="w-3 h-3 shrink-0" style={{ color: "#10b981" }} />
                          ) : s.active ? (
                            <Loader2 className="w-3 h-3 shrink-0 animate-spin" style={{ color: "#f59e0b" }} />
                          ) : (
                            <div className="w-3 h-3 rounded-full border shrink-0" style={{ borderColor: "rgba(255,255,255,0.15)" }} />
                          )}
                          <span className="text-[11px]" style={{ color: s.done ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)" }}>
                            {s.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    {runComplete && (
                      <div className="text-[11px] font-semibold" style={{ color: "#10b981" }}>
                        First workflow executed successfully. Your environment is ready.
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setActiveStep(s => Math.max(0, s - 1))}
                    disabled={activeStep === 0}
                    className="px-3 py-1.5 rounded-lg text-xs border transition-all disabled:opacity-30"
                    style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => completeStep(step)}
                    disabled={simulatingRun}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                    style={{ background: "#f59e0b", color: "#000" }}
                  >
                    {simulatingRun ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Running…</>
                    ) : step.id === STEPS.length ? (
                      <><Play className="w-3 h-3" /> Run First Workflow</>
                    ) : (
                      <><ArrowRight className="w-3 h-3" /> Continue</>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border p-8 text-center" style={{ borderColor: "rgba(16,185,129,0.25)", background: "rgba(16,185,129,0.06)" }}>
          <CheckCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "#10b981" }} />
          <h2 className="text-lg font-bold text-white mb-2">Onboarding Complete</h2>
          <p className="text-[12px] mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
            Your pilot tenant is provisioned, policies applied, demo data seeded, and your first workflow has executed.
          </p>
          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-5">
            {[
              { label: "Policies Applied", value: "3", color: "#8b5cf6" },
              { label: "Workflows Seeded", value: "10", color: "#4B8BDB" },
              { label: "First Run", value: "✓", color: "#10b981" },
            ].map(c => (
              <div key={c.label} className="rounded-lg border p-3" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                <div className="text-lg font-bold mb-0.5" style={{ color: c.color }}>{c.value}</div>
                <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)" }}>{c.label}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-3">
            <a href="/alloy" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold"
              style={{ background: "#10b981", color: "#000" }}>
              <Zap className="w-3 h-3" /> Open Alloy Workspace
            </a>
            <a href="/alloy/policies" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border"
              style={{ borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
              <Shield className="w-3 h-3" /> Review Policies
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
