import { BookOpen, CheckCircle, Circle, AlertTriangle } from "lucide-react";
import { NY_PLAYBOOKS } from "../../data/ny-data";

export default function NyPlaybooksPage() {
  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-5 h-5 text-[#d4a054]" />
          <h1 className="text-lg font-semibold text-slate-100">NY Insurance Playbooks</h1>
        </div>
        <p className="text-xs text-slate-500">10 NY-specific governed execution playbooks — each with required artifacts, missing-item detector, responsible role, approval checkpoint, and audit output</p>
      </div>

      <div className="space-y-3">
        {NY_PLAYBOOKS.map((pb, i) => {
          const completedSteps = pb.steps.filter(s => s.done).length;
          const totalSteps = pb.steps.length;
          const blockers = pb.steps.filter(s => s.blocker && !s.done).length;
          const pct = Math.round((completedSteps / totalSteps) * 100);

          return (
            <div key={i} className="rounded-lg border border-white/[0.06] p-4" style={{ background: "#0c1220" }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-semibold text-slate-200">{pb.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{pb.description}</div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {blockers > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] bg-[#c45a4a]/10 text-[#c45a4a] border border-[#c45a4a]/20">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {blockers} BLOCKER{blockers > 1 ? "S" : ""}
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-slate-500">{completedSteps}/{totalSteps} steps</span>
                </div>
              </div>

              <div className="flex items-center gap-1 mb-3">
                {pb.steps.map((_, si) => (
                  <div
                    key={si}
                    className="h-1.5 flex-1 rounded-full"
                    style={{ background: si < completedSteps ? "#d4a054" : "rgba(255,255,255,0.06)" }}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="space-y-1">
                  {pb.steps.map((step, si) => (
                    <div key={si} className="flex items-start gap-2 py-0.5">
                      {step.done ? (
                        <CheckCircle className="w-3 h-3 text-[#d4a054] flex-shrink-0 mt-0.5" />
                      ) : step.blocker ? (
                        <AlertTriangle className="w-3 h-3 text-[#c45a4a] flex-shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-3 h-3 text-slate-600 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-[11px] leading-relaxed ${step.done ? "text-slate-300" : step.blocker ? "text-[#c45a4a]" : "text-slate-500"}`}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="rounded border border-white/[0.04] p-2.5" style={{ background: "#080c14" }}>
                    <div className="text-[9px] text-slate-500 uppercase mb-0.5">Responsible Role</div>
                    <div className="text-[10px] text-slate-300">{pb.responsibleRole}</div>
                  </div>
                  <div className="rounded border border-white/[0.04] p-2.5" style={{ background: "#080c14" }}>
                    <div className="text-[9px] text-[#d4a054] uppercase mb-0.5">Approval Checkpoint</div>
                    <div className="text-[10px] text-slate-300">{pb.approvalCheckpoint}</div>
                  </div>
                  <div className="rounded border border-white/[0.04] p-2.5" style={{ background: "#080c14" }}>
                    <div className="text-[9px] text-slate-500 uppercase mb-0.5">Fallback Path</div>
                    <div className="text-[10px] text-slate-400">{pb.fallbackPath}</div>
                  </div>
                  <div className="rounded border border-white/[0.04] p-2.5" style={{ background: "#080c14" }}>
                    <div className="text-[9px] text-[#4a90b8] uppercase mb-0.5">Audit Output</div>
                    <div className="text-[10px] text-slate-300">{pb.auditOutput}</div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wider mb-1.5">Required Artifacts</div>
                <div className="flex flex-wrap gap-1">
                  {pb.requiredArtifacts.map((artifact, ai) => (
                    <span key={ai} className="px-2 py-0.5 rounded text-[9px] bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                      {artifact}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
