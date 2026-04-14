import { useState } from "react";
import { Sun, BookOpen, MessageSquare, Building2, AlertTriangle, CheckSquare, ChevronRight, ArrowLeft, Clock, FileText, Zap, TrendingUp, CheckCircle, Shield } from "lucide-react";
import { Link } from "wouter";
import { DEMO_MATTERS } from "../../data/demo-matters";

const WORKFLOWS = [
  {
    id: "open-my-day",
    label: "Open My Day",
    icon: Sun,
    accent: "#d4a054",
    description: "Start with what changed overnight, what's at risk, and what you should do first",
    estimatedMinutes: 15,
    steps: [
      { label: "What changed since yesterday", type: "review" },
      { label: "Deadlines in the next 3 days", type: "check" },
      { label: "Pending approvals and sign-offs", type: "check" },
      { label: "Matters that went quiet", type: "risk" },
      { label: "Your first 30 minutes", type: "action" },
    ],
  },
  {
    id: "prep-demand",
    label: "Prep a Demand",
    icon: BookOpen,
    accent: "#c8953c",
    description: "Walk through everything needed to send a demand package safely",
    estimatedMinutes: 45,
    steps: [
      { label: "Select matter", type: "select" },
      { label: "Review source facts and evidence", type: "review" },
      { label: "Identify missing support", type: "check" },
      { label: "Check contradictions", type: "review" },
      { label: "Confirm export safety", type: "gate" },
      { label: "Submit for sign-off", type: "action" },
    ],
  },
  {
    id: "prep-mediation",
    label: "Prep for Mediation",
    icon: MessageSquare,
    accent: "#4a90b8",
    description: "Build a complete mediation package — case narrative, settlement range, insurer posture",
    estimatedMinutes: 60,
    steps: [
      { label: "Select matter", type: "select" },
      { label: "Case narrative summary", type: "review" },
      { label: "Settlement range and justification", type: "review" },
      { label: "Insurer posture and offer history", type: "review" },
      { label: "Missing items before mediation", type: "check" },
      { label: "Draft mediation memo with Workbench", type: "action" },
      { label: "Sign-off and export", type: "gate" },
    ],
  },
  {
    id: "review-carrier-comms",
    label: "Review Carrier Communications",
    icon: Building2,
    accent: "#8b7ac8",
    description: "Scan all carrier communications for patterns, silence, and required responses",
    estimatedMinutes: 20,
    steps: [
      { label: "Open communications across matters", type: "review" },
      { label: "Flag silence patterns (>14 days)", type: "risk" },
      { label: "Identify required responses", type: "check" },
      { label: "Note reserve changes and posture shifts", type: "review" },
      { label: "Log actions required", type: "action" },
    ],
  },
  {
    id: "blocking",
    label: "Check What Is Blocking Settlement",
    icon: AlertTriangle,
    accent: "#c45a4a",
    description: "Surface every friction source blocking settlement across active matters",
    estimatedMinutes: 15,
    steps: [
      { label: "Open settlement friction map", type: "review" },
      { label: "Identify lien drag", type: "check" },
      { label: "Check missing documentation", type: "check" },
      { label: "Review carrier stalling signals", type: "risk" },
      { label: "Rank by leverage and take action", type: "action" },
    ],
  },
  {
    id: "clear-review",
    label: "Clear My Review Queue",
    icon: CheckSquare,
    accent: "#4a90b8",
    description: "Work through all drafts and outputs pending your review",
    estimatedMinutes: 30,
    steps: [
      { label: "Open all pending reviews", type: "review" },
      { label: "Check source support per item", type: "check" },
      { label: "Review contradictions and warnings", type: "review" },
      { label: "Approve or flag for revision", type: "action" },
      { label: "Submit approved items for sign-off", type: "gate" },
    ],
  },
];

const OPEN_MY_DAY_DATA = {
  changes: [
    { matter: "Rodriguez v. National General", change: "Reserve increase received — $15K to $28K", time: "2h ago", level: "high" },
    { matter: "Chen v. Allstate", change: "IME report uploaded", time: "4h ago", level: "info" },
    { matter: "Vasquez v. GEICO", change: "Discovery deadline extended to May 15", time: "6h ago", level: "info" },
  ],
  deadlines: [
    { title: "Interrogatory responses — Rodriguez", days: 2, priority: "critical" },
    { title: "Motion to compel — Vasquez", days: 3, priority: "high" },
  ],
  approvals: [
    { title: "Chronology export — Rodriguez", type: "sign-off" },
    { title: "Partner update memo", type: "sign-off" },
  ],
  quietRisks: [
    { matter: "Kim v. Progressive", risk: "SOL in 45 days — no clock movement", severity: "critical" },
    { matter: "Park v. Liberty Mutual", risk: "No carrier response in 18 days", severity: "high" },
  ],
  firstActions: [
    { label: "Review reserve increase — Rodriguez", minutes: 10 },
    { label: "Clear interrogatory response", minutes: 20 },
    { label: "Escalate Park carrier silence", minutes: 5 },
  ],
};

export default function NamedWorkflowsPage() {
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  const workflow = WORKFLOWS.find(w => w.id === activeWorkflow);

  if (activeWorkflow === "open-my-day") {
    return <OpenMyDayWorkflow onBack={() => { setActiveWorkflow(null); setStep(0); }} />;
  }

  if (workflow) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => { setActiveWorkflow(null); setStep(0); }}
            className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3 h-3" /> All workflows
          </button>
          <div className="flex items-center gap-2">
            <workflow.icon className="w-4 h-4" style={{ color: workflow.accent }} />
            <h1 className="text-base font-semibold text-slate-100">{workflow.label}</h1>
            <span className="text-[10px] text-slate-500 font-mono">~{workflow.estimatedMinutes}m</span>
          </div>
        </div>

        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <p className="text-sm text-slate-400 mb-4">{workflow.description}</p>
          <div className="space-y-2">
            {workflow.steps.map((s, i) => {
              const isDone = i < step;
              const isActive = i === step;
              return (
                <div key={i} className={`flex items-center gap-3 p-3 rounded border transition-colors ${
                  isDone ? "border-white/[0.04] opacity-60" :
                  isActive ? "border-[#d4a054]/30" :
                  "border-white/[0.04]"
                }`} style={{ background: isActive ? "#0f1a2a" : "#080c14" }}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-semibold ${
                    isDone ? "bg-[#4a90b8]/20 text-[#4a90b8]" :
                    isActive ? "bg-[#d4a054]/20 text-[#d4a054]" :
                    "bg-white/[0.04] text-slate-600"
                  }`}>
                    {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className={`text-sm flex-1 ${isDone ? "text-slate-500 line-through" : isActive ? "text-slate-200" : "text-slate-400"}`}>
                    {s.label}
                  </span>
                  <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${
                    s.type === "gate" ? "bg-[#c45a4a]/10 text-[#c45a4a]" :
                    s.type === "risk" ? "bg-[#d4a054]/10 text-[#d4a054]" :
                    s.type === "action" ? "bg-[#4a90b8]/10 text-[#4a90b8]" :
                    "bg-white/[0.04] text-slate-500"
                  }`}>{s.type}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">Step {step + 1} of {workflow.steps.length}</div>
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="px-3 py-1.5 rounded text-xs bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] transition-colors">
                Back
              </button>
            )}
            {step < workflow.steps.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)}
                className="px-4 py-1.5 rounded text-xs font-medium text-white transition-colors" style={{ background: workflow.accent + "30", border: `1px solid ${workflow.accent}40` }}>
                Continue →
              </button>
            ) : (
              <button onClick={() => { setActiveWorkflow(null); setStep(0); }}
                className="px-4 py-1.5 rounded text-xs font-medium bg-[#4a90b8]/20 text-[#4a90b8] hover:bg-[#4a90b8]/30 transition-colors flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3" /> Complete
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-100 mb-1">Named Workflows</h1>
        <p className="text-xs text-slate-500">Guided flows for the moments that matter — each one surfaces the right data, ranked by urgency, and walks you through completion</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {WORKFLOWS.map(wf => {
          const Icon = wf.icon;
          return (
            <button
              key={wf.id}
              onClick={() => { setActiveWorkflow(wf.id); setStep(0); }}
              className="text-left rounded-lg border border-white/[0.06] p-4 hover:border-white/[0.12] transition-colors cursor-pointer"
              style={{ background: "#0c1220" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={{ background: wf.accent + "15" }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: wf.accent }} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-200">{wf.label}</div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">{wf.estimatedMinutes}m</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">{wf.description}</p>
              <div className="flex items-center gap-1">
                {wf.steps.slice(0, 4).map((s, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded text-[9px] bg-white/[0.04] text-slate-600">{s.label.split(" ").slice(0, 2).join(" ")}</span>
                ))}
                {wf.steps.length > 4 && <span className="text-[9px] text-slate-600">+{wf.steps.length - 4}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OpenMyDayWorkflow({ onBack }: { onBack: () => void }) {
  const d = OPEN_MY_DAY_DATA;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-3 h-3" /> All workflows
        </button>
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-[#d4a054]" />
          <h1 className="text-base font-semibold text-slate-100">Open My Day</h1>
          <span className="text-[10px] text-slate-500 font-mono">~15m</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-[#4a90b8]" />
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">What Changed</h3>
          </div>
          {d.changes.map((c, i) => (
            <div key={i} className="flex items-start gap-2 py-2 border-b border-white/[0.04] last:border-0">
              <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${c.level === "high" ? "bg-[#d4a054]" : "bg-[#4a90b8]"}`} />
              <div>
                <div className="text-[11px] font-medium text-slate-200">{c.matter.split(" v. ")[0]}</div>
                <div className="text-[10px] text-slate-400">{c.change}</div>
                <div className="text-[9px] text-slate-600">{c.time}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-3.5 h-3.5 text-[#c45a4a]" />
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Deadlines (3 days)</h3>
          </div>
          {d.deadlines.map((dl, i) => (
            <div key={i} className="flex items-center gap-2 py-2 border-b border-white/[0.04] last:border-0">
              <div className={`w-1.5 h-1.5 rounded-full ${dl.priority === "critical" ? "bg-[#c45a4a]" : "bg-[#d4a054]"}`} />
              <span className="text-[11px] text-slate-200 flex-1">{dl.title}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${dl.priority === "critical" ? "bg-[#c45a4a]/10 text-[#c45a4a]" : "bg-[#d4a054]/10 text-[#d4a054]"}`}>{dl.days}d</span>
            </div>
          ))}

          <div className="mt-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckSquare className="w-3.5 h-3.5 text-[#d4a054]" />
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Waiting for You</h3>
            </div>
            {d.approvals.map((a, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 border-b border-white/[0.04] last:border-0">
                <Shield className="w-3 h-3 text-[#d4a054]" />
                <span className="text-[11px] text-slate-200 flex-1">{a.title}</span>
                <span className="text-[9px] text-[#d4a054]">{a.type}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[#c45a4a]/20 p-4" style={{ background: "#0c1220" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-[#c45a4a]" />
            <h3 className="text-xs font-semibold text-[#c45a4a] uppercase tracking-wider">Quiet but Dangerous</h3>
          </div>
          {d.quietRisks.map((r, i) => (
            <div key={i} className="py-2 border-b border-white/[0.04] last:border-0">
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${r.severity === "critical" ? "bg-[#c45a4a] animate-pulse" : "bg-[#d4a054]"}`} />
                <span className="text-[11px] font-medium text-slate-200">{r.matter.split(" v. ")[0]}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 ml-3">{r.risk}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-[#d4a054]/20 p-4" style={{ background: "#0c1220" }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-3.5 h-3.5 text-[#d4a054]" />
            <h3 className="text-xs font-semibold text-[#d4a054] uppercase tracking-wider">Your First 30 Minutes</h3>
          </div>
          {d.firstActions.map((a, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
              <div className="w-5 h-5 rounded-full border border-[#d4a054]/30 flex items-center justify-center flex-shrink-0">
                <span className="text-[9px] font-semibold text-[#d4a054]">{i + 1}</span>
              </div>
              <span className="text-[11px] text-slate-200 flex-1">{a.label}</span>
              <span className="text-[10px] text-slate-500 font-mono">{a.minutes}m</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Link href="/prism-counsel/today">
          <button className="px-4 py-2 rounded text-xs font-medium bg-[#d4a054]/15 text-[#d4a054] hover:bg-[#d4a054]/25 transition-colors flex items-center gap-1.5">
            Go to Today <ChevronRight className="w-3 h-3" />
          </button>
        </Link>
      </div>
    </div>
  );
}
