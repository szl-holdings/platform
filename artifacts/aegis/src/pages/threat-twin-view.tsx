import { Shield, Activity, Target, Network, CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { ProofEnvelope, ConfidenceMeter } from "@szl-holdings/design-system";
import { 
  phantomClusterActor, 
  phantomIndicators, 
  affectedSystems, 
  containmentWorkflow,
  threatTwins
} from "../data/threat-twin";

export default function ThreatTwinView() {
  const actor = phantomClusterActor;
  const auditTrail = threatTwins[0].auditTrail.slice(0, 3);

  return (
    <div className="p-6 space-y-6 bg-[#080510] min-h-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-red-500 flex items-center gap-2 tracking-tight">
            <Shield className="w-6 h-6" />
            Threat Digital Twin
          </h1>
          <p className="text-red-400/50 text-sm mt-1">
            Real-time synchronization with active adversary profiles and indicator meshes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Active Monitoring</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Actor Profile */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#09060e] border border-red-500/10 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Target className="w-24 h-24 text-red-500" />
            </div>
            
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-red-100">{actor.alias}</h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 uppercase">
                    {actor.name}
                  </span>
                </div>
                <p className="text-red-400/70 text-sm max-w-xl">{actor.description}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-red-400/40 uppercase font-bold tracking-widest mb-1">Confidence Score</p>
                <ConfidenceMeter value={actor.confidence} />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                <p className="text-[10px] text-red-400/40 uppercase font-bold mb-1">Affiliation</p>
                <p className="text-sm font-medium text-red-200">{actor.affiliation}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                <p className="text-[10px] text-red-400/40 uppercase font-bold mb-1">Motivation</p>
                <p className="text-sm font-medium text-red-200">{actor.motivation}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                <p className="text-[10px] text-red-400/40 uppercase font-bold mb-1">Last Active</p>
                <p className="text-sm font-medium text-red-200">{new Date(actor.lastActivityAt).toLocaleTimeString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                <p className="text-[10px] text-red-400/40 uppercase font-bold mb-1">Impact Level</p>
                <p className="text-sm font-medium text-red-200">Critical</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-red-400/40 uppercase font-bold tracking-widest mb-3">Associated TTPs (MITRE ATT&CK)</p>
              <div className="flex flex-wrap gap-2">
                {actor.ttps.map((ttp, i) => (
                  <span key={i} className="px-2 py-1 rounded bg-[#1a1125] border border-red-500/10 text-[11px] text-red-300/80">
                    {ttp}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Indicator Feed */}
          <div className="bg-[#09060e] border border-red-500/10 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-red-500/10 flex items-center justify-between bg-red-500/5">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-bold text-red-100 uppercase tracking-wider">Indicator Mesh Feed</h3>
              </div>
              <span className="text-[10px] text-red-400/60 font-mono">TLP: AMBER/RED</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-red-500/5 border-b border-red-500/10">
                    <th className="px-5 py-3 text-[10px] font-bold text-red-400/40 uppercase tracking-widest">Indicator</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-red-400/40 uppercase tracking-widest">Type</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-red-400/40 uppercase tracking-widest">TLP</th>
                    <th className="px-5 py-3 text-[10px] font-bold text-red-400/40 uppercase tracking-widest">Last Seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-500/10">
                  {phantomIndicators.map((ioc) => (
                    <tr key={ioc.id} className="hover:bg-red-500/5 transition-colors group">
                      <td className="px-5 py-3">
                        <div className="flex flex-col">
                          <span className="text-xs font-mono text-red-200 group-hover:text-red-400 transition-colors">{ioc.value}</span>
                          <span className="text-[10px] text-red-400/40 mt-0.5">{ioc.description}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[10px] font-bold text-red-400/60 uppercase">{ioc.type}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-bold uppercase border",
                          ioc.tlp === "red" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                          ioc.tlp === "amber" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                          "bg-green-500/20 text-green-400 border-green-500/30"
                        )}>
                          TLP:{ioc.tlp}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[11px] text-red-400/60">
                        {new Date(ioc.lastSeenAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          {/* Affected Systems */}
          <div className="bg-[#09060e] border border-red-500/10 rounded-xl p-5">
            <h3 className="text-sm font-bold text-red-100 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-400" />
              Target Surface Sync
            </h3>
            <div className="space-y-3">
              {affectedSystems.map((system, i) => (
                <div key={i} className="p-3 rounded-lg bg-red-500/5 border border-red-500/10 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-red-200">{system.name}</p>
                    <p className="text-[10px] text-red-400/50 uppercase">{system.type}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={cn(
                      "text-[10px] font-bold uppercase mb-1",
                      system.status === "compromised" ? "text-red-500" :
                      system.status === "at_risk" ? "text-orange-500" : "text-yellow-500"
                    )}>
                      {system.status.replace("_", " ")}
                    </span>
                    <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className={cn(
                        "h-full rounded-full",
                        system.status === "compromised" ? "bg-red-500 w-full" :
                        system.status === "at_risk" ? "bg-orange-500 w-2/3" : "bg-yellow-500 w-1/3"
                      )} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Containment Workflow */}
          <div className="bg-[#09060e] border border-red-500/10 rounded-xl overflow-hidden shadow-2xl shadow-red-500/5">
            <div className="px-5 py-4 border-b border-red-500/10 bg-red-500/5">
              <h3 className="text-sm font-bold text-red-100 uppercase tracking-wider">Containment Workflow</h3>
            </div>
            <div className="p-5">
              <ProofEnvelope
                confidence={0.91}
                timestamp={new Date().toISOString()}
                evidence={[]}
                autonomyMode="recommend"
                policyState="requires-approval"
              >
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-red-200">AI RECOMMENDED ACTIONS</h4>
                    <span className="text-[10px] text-red-400/50 font-mono">WF-2891-B</span>
                  </div>
                  <div className="space-y-2">
                    {containmentWorkflow.steps.map((step, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="mt-1 flex flex-col items-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                          {i < containmentWorkflow.steps.length - 1 && <div className="w-px h-full bg-red-500/20 my-1" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-[11px] font-bold text-red-100">
                            <span className="text-red-400 uppercase mr-1">{step.action}:</span> {step.target}
                          </p>
                          <p className="text-[10px] text-red-400/60 leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button className="flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-red-500 text-white text-[11px] font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve All
                    </button>
                    <button className="flex items-center justify-center gap-2 py-2 px-3 rounded-md bg-white/5 text-red-400 border border-red-500/20 text-[11px] font-bold hover:bg-white/10 transition-colors">
                      <XCircle className="w-3.5 h-3.5" />
                      Decline
                    </button>
                  </div>
                </div>
              </ProofEnvelope>
            </div>
          </div>

          {/* Audit Trail */}
          <div className="bg-[#09060e] border border-red-500/10 rounded-xl p-5">
            <h3 className="text-sm font-bold text-red-100 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-400" />
              Containment Audit
            </h3>
            <div className="space-y-4 relative">
              <div className="absolute left-1.5 top-1.5 bottom-1.5 w-px bg-red-500/10" />
              {auditTrail.map((entry, i) => (
                <div key={i} className="relative pl-6">
                  <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-[#09060e] border-2 border-red-500/30 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-red-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-red-200 leading-tight">{entry.action.replace(/_/g, " ").toUpperCase()}</p>
                    <p className="text-[10px] text-red-400/50 mt-0.5">{entry.actor} ({entry.actorRole})</p>
                    <p className="text-[9px] text-red-500/40 mt-1 font-mono">{new Date(entry.at).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
