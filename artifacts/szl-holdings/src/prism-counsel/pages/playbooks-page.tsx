import { BookOpen, ChevronRight, CheckCircle, Circle } from "lucide-react";

const PLAYBOOKS = [
  {
    title: "Auto Injury — Standard PI Workflow",
    description: "End-to-end workflow for plaintiff-side auto injury matters from intake through settlement or trial.",
    stages: 8,
    completedStages: 3,
    steps: [
      { label: "Client Intake & Engagement", done: true },
      { label: "Medical Treatment Monitoring", done: true },
      { label: "Evidence Collection & Preservation", done: true },
      { label: "Demand Package Preparation", done: false },
      { label: "Negotiation / Counter-Offer Cycle", done: false },
      { label: "Mediation Preparation", done: false },
      { label: "Trial Preparation (if needed)", done: false },
      { label: "Resolution & Lien Satisfaction", done: false },
    ],
  },
  {
    title: "Premises Liability — Slip & Fall",
    description: "Playbook for premises liability matters including evidence preservation, surveillance, and expert retention.",
    stages: 7,
    completedStages: 2,
    steps: [
      { label: "Incident Documentation", done: true },
      { label: "Surveillance & Evidence Request", done: true },
      { label: "Medical Treatment Coordination", done: false },
      { label: "Liability Analysis & Expert Retention", done: false },
      { label: "Demand & Negotiation", done: false },
      { label: "Mediation / ADR", done: false },
      { label: "Trial (if unresolved)", done: false },
    ],
  },
  {
    title: "Insurance Coverage Dispute",
    description: "Coverage analysis, bad faith evaluation, and carrier litigation workflow.",
    stages: 6,
    completedStages: 1,
    steps: [
      { label: "Policy Language Analysis", done: true },
      { label: "Coverage Position & Denial Review", done: false },
      { label: "Bad Faith Evaluation", done: false },
      { label: "Discovery & Underwriting File", done: false },
      { label: "Summary Judgment / Dispositive Motions", done: false },
      { label: "Resolution or Trial", done: false },
    ],
  },
];

export default function PlaybooksPage() {
  return (
    <div className="p-6 max-w-[1000px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#d4a054]" />
          <h1 className="text-lg font-semibold text-slate-100">Playbooks</h1>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">Governed execution workflows for common matter types</p>
      </div>

      <div className="space-y-3">
        {PLAYBOOKS.map((pb, i) => (
          <div key={i} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-200">{pb.title}</h3>
              <span className="text-[10px] text-slate-500 font-mono">{pb.completedStages}/{pb.stages} stages</span>
            </div>
            <p className="text-[10px] text-slate-500 mb-3">{pb.description}</p>
            <div className="flex items-center gap-1 mb-3">
              {pb.steps.map((_, si) => (
                <div
                  key={si}
                  className="h-1.5 flex-1 rounded-full"
                  style={{ background: si < pb.completedStages ? "#d4a054" : "rgba(255,255,255,0.06)" }}
                />
              ))}
            </div>
            <div className="space-y-1">
              {pb.steps.map((step, si) => (
                <div key={si} className="flex items-center gap-2 py-0.5">
                  {step.done ? (
                    <CheckCircle className="w-3 h-3 text-[#d4a054]" />
                  ) : (
                    <Circle className="w-3 h-3 text-slate-600" />
                  )}
                  <span className={`text-[11px] ${step.done ? "text-slate-300" : "text-slate-500"}`}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
