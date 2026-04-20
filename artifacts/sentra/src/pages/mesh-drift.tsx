import { useState } from "react";
import { GitBranch, AlertTriangle, CheckCircle2, Clock, FileText, Shield } from "lucide-react";
import { useAgentMesh } from "@/data/agent-mesh";
import { cn } from "@szl-holdings/shared-ui/utils";

export default function MeshDrift() {
  const [expandedId, setExpandedId] = useState<string | null>("drift-004");
  const { state } = useAgentMesh();
  const { driftSnapshots, exposures } = state;

  const getLinkedExposures = (ids: string[]) =>
    ids.map(id => exposures.find(e => e.id === id)).filter(Boolean);

  const unapproved = driftSnapshots.filter(d => !d.policyApproved);

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-100">Mesh Drift</h1>
          <p className="text-slate-400 mt-1">MCP config file changes over time — who changed what, whether policy-approved</p>
        </div>
        <div className="flex gap-3">
          <div className="sentra-panel px-4 py-2 text-center">
            <div className="text-[10px] text-slate-500 font-mono uppercase">Snapshots</div>
            <div className="text-2xl font-display font-bold text-slate-100">{driftSnapshots.length}</div>
          </div>
          <div className="sentra-panel px-4 py-2 text-center">
            <div className="text-[10px] text-slate-500 font-mono uppercase">Unapproved</div>
            <div className="text-2xl font-display font-bold text-red-400">{unapproved.length}</div>
          </div>
        </div>
      </header>

      {unapproved.length > 0 && (
        <div className="p-4 rounded border border-red-500/30 bg-red-500/5 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <div>
            <div className="text-xs font-bold text-red-300">
              {unapproved.length} config change{unapproved.length > 1 ? "s" : ""} made without Guardian policy approval
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              These drifts may have introduced the active Exposures. Review and either approve retroactively or roll back.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {driftSnapshots.map(snap => {
          const linked = getLinkedExposures(snap.linkedExposureIds);
          return (
            <div key={snap.id} className="sentra-panel overflow-hidden">
              <button
                className="w-full p-6 text-left hover:bg-slate-800/20 transition-colors"
                onClick={() => setExpandedId(expandedId === snap.id ? null : snap.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 flex-1">
                    <div className={cn(
                      "w-10 h-10 rounded flex items-center justify-center border shrink-0",
                      !snap.policyApproved ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20"
                    )}>
                      <GitBranch className={cn("w-5 h-5", !snap.policyApproved ? "text-red-400" : "text-emerald-400")} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-100 font-mono">
                          {snap.configFile.split("/").slice(-1)[0]}
                        </span>
                        {!snap.policyApproved ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border text-red-400 border-red-500/30 bg-red-500/10">
                            UNAPPROVED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                            APPROVED
                          </span>
                        )}
                        {linked.length > 0 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono border text-amber-400 border-amber-500/30 bg-amber-500/10">
                            {linked.length} Linked Exposure{linked.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {snap.configFile} · Changed by {snap.changedBy}
                        {snap.approvedBy ? ` · Approved by ${snap.approvedBy}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(snap.changedAt).toLocaleDateString()} {new Date(snap.changedAt).toLocaleTimeString()}
                  </div>
                </div>
              </button>

              {expandedId === snap.id && (
                <div className="px-6 pb-6 border-t border-slate-800 space-y-5 pt-5">
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase mb-3 flex items-center gap-2">
                      <FileText className="w-3 h-3" />
                      Config Diff
                    </div>
                    <div className="rounded bg-slate-950 border border-slate-800 p-4 font-mono text-xs space-y-1 overflow-x-auto">
                      {snap.diff.removed.map((line, i) => (
                        <div key={`rm-${i}`} className="text-red-400/80 flex gap-3">
                          <span className="text-slate-600 select-none">-</span>
                          <span>{line}</span>
                        </div>
                      ))}
                      {snap.diff.added.map((line, i) => (
                        <div key={`add-${i}`} className="text-emerald-400/80 flex gap-3">
                          <span className="text-slate-600 select-none">+</span>
                          <span>{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {linked.length > 0 && (
                    <div>
                      <div className="text-[10px] text-slate-500 font-mono uppercase mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3" />
                        Linked Exposures
                      </div>
                      <div className="space-y-2">
                        {linked.map(exp => exp && (
                          <div key={exp.id} className="p-3 rounded bg-red-500/5 border border-red-500/20 flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-slate-200">{exp.title}</div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{exp.owaspRef}</div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded border text-red-400 border-red-500/30 bg-red-500/10 font-mono font-bold uppercase">
                              {exp.severity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!snap.policyApproved && (
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <Shield className="w-3 h-3 text-amber-400" />
                        This change bypassed the Guardian approval gate
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 rounded border border-slate-700 hover:border-slate-600 text-[11px] text-slate-400 transition-colors">
                          Roll Back
                        </button>
                        <button className="px-3 py-1.5 rounded bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-[11px] text-amber-400 font-bold transition-colors">
                          Approve Retroactively
                        </button>
                      </div>
                    </div>
                  )}

                  {snap.policyApproved && (
                    <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      Approved by {snap.approvedBy} — proof recorded in Trust Provenance
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
