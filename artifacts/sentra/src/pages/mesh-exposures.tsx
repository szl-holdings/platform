import { ShieldAlert, CheckCircle2, ExternalLink, Clock, FileText, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { agentMesh, MESH_AGENT_DISPLAY_NAMES } from "@/data/agent-mesh";
import {
  ProofEnvelope,
  type PolicyState,
  type AutonomyMode,
  type EvidenceSource,
} from "@szl-holdings/design-system";
import { cn } from "@szl-holdings/shared-ui/utils";
import { useMeshState, queueFix } from "@/lib/mesh-store";

const ACCENT = "#ef4444";

const SEVERITY_STYLES: Record<string, string> = {
  critical: "text-red-400 border-red-500/30 bg-red-500/10",
  high: "text-orange-400 border-orange-500/30 bg-orange-500/10",
  medium: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  low: "text-slate-400 border-slate-500/30 bg-slate-500/10",
};

export default function MeshExposures() {
  const [autonomyModes, setAutonomyModes] = useState<Record<string, AutonomyMode>>({});
  const meshState = useMeshState();
  const { exposures } = agentMesh;

  function getMode(id: string): AutonomyMode {
    return autonomyModes[id] ?? "recommend";
  }

  function setMode(id: string, mode: AutonomyMode) {
    setAutonomyModes((prev) => ({ ...prev, [id]: mode }));
  }

  const statusOf = (id: string) => meshState.exposureStatuses[id] ?? "open";
  const openCount = exposures.filter((e) => statusOf(e.id) === "open").length;
  const criticalCount = exposures.filter((e) => e.severity === "critical" && statusOf(e.id) !== "resolved").length;
  const resolvedCount = exposures.filter((e) => statusOf(e.id) === "resolved").length;

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-100">Exposures</h1>
          <p className="text-slate-400 mt-1">Prioritized findings with governed remediation — all fixes route through Guardian</p>
        </div>
        <div className="flex gap-3">
          <div className="sentra-panel px-4 py-2 text-center">
            <div className="text-[10px] text-slate-500 font-mono uppercase">Open</div>
            <div className="text-2xl font-display font-bold text-red-400">{openCount}</div>
          </div>
          <div className="sentra-panel px-4 py-2 text-center">
            <div className="text-[10px] text-slate-500 font-mono uppercase">Critical</div>
            <div className="text-2xl font-display font-bold text-red-500">{criticalCount}</div>
          </div>
          <div className="sentra-panel px-4 py-2 text-center">
            <div className="text-[10px] text-slate-500 font-mono uppercase">Resolved</div>
            <div className="text-2xl font-display font-bold text-emerald-400">{resolvedCount}</div>
          </div>
        </div>
      </header>

      <div className="space-y-6">
        {exposures.map((exp) => {
          const evidence: EvidenceSource[] = [
            {
              id: `${exp.id}-ev-1`,
              label: "Mesh Resilience Engine — Detection",
              type: "signal",
              timestamp: exp.detectedAt,
              excerpt: exp.explanation,
            },
            ...(exp.cveRefs.length > 0
              ? [{
                  id: `${exp.id}-ev-cve`,
                  label: `CVE Reference — ${exp.cveRefs.join(", ")}`,
                  type: "document" as const,
                  timestamp: exp.detectedAt,
                  excerpt: `Mapped to known vulnerability: ${exp.cveRefs.join(", ")}. See NVD for full advisory.`,
                }]
              : []),
          ];

          const mode = getMode(exp.id);
          const policyState: PolicyState = mode === "approved-act" ? "allowed" : "requires-approval";
          const status = statusOf(exp.id);
          const isFixPending = status === "fix-pending";
          const isResolved = status === "resolved";
          const fixReq = meshState.fixRequests.find((r) => r.exposureId === exp.id && r.status !== "rejected");

          return (
            <ProofEnvelope
              key={exp.id}
              title={exp.title}
              accentColor={ACCENT}
              evidence={evidence}
              timestamp={exp.detectedAt}
              confidence={exp.severity === "critical" ? 97 : exp.severity === "high" ? 91 : 84}
              policyState={isResolved ? "allowed" : policyState}
              policyReason={isResolved ? "Fix executed and verified by Guardian" : "Guardian approval required before executing remediation on agent mesh"}
              autonomyMode={mode}
              onAutonomyChange={(m) => setMode(exp.id, m)}
              domain="sentra.agent-mesh"
              actionLabel={exp.fixLabel}
            >
              <div className="sentra-panel p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 flex-1">
                    <div className={cn(
                      "w-10 h-10 rounded flex items-center justify-center shrink-0 border",
                      isResolved
                        ? "bg-emerald-500/10 border-emerald-500/20"
                        : exp.severity === "critical"
                          ? "bg-red-500/10 border-red-500/20"
                          : "bg-orange-500/10 border-orange-500/20",
                    )}>
                      {isResolved ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <ShieldAlert className={cn("w-5 h-5", exp.severity === "critical" ? "text-red-500" : "text-orange-400")} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-2 mb-3">
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border", SEVERITY_STYLES[exp.severity])}>
                          {exp.severity}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{exp.owaspRef}</span>
                        {exp.cveRefs.map((cve) => (
                          <span key={cve} className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-sky-400 font-mono">
                            <ExternalLink className="w-2.5 h-2.5" />
                            {cve}
                          </span>
                        ))}
                      </div>

                      <p className="text-sm text-slate-300 leading-relaxed mb-4">{exp.explanation}</p>

                      <div className="grid grid-cols-2 gap-4 mb-4 text-[11px]">
                        {exp.affectedAgentIds.length > 0 && (
                          <div>
                            <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Affected Agents</div>
                            <div className="flex flex-wrap gap-1">
                              {exp.affectedAgentIds.map((id) => (
                                <span key={id} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                                  {MESH_AGENT_DISPLAY_NAMES[id] ?? id}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {exp.affectedMcpIds.length > 0 && (
                          <div>
                            <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Affected MCP Servers</div>
                            <div className="flex flex-wrap gap-1">
                              {exp.affectedMcpIds.map((id) => (
                                <span key={id} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                                  {id.replace("mcp-", "")}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className={cn(
                        "p-4 rounded border flex items-center justify-between",
                        isResolved
                          ? "bg-emerald-500/10 border-emerald-500/20"
                          : isFixPending
                            ? "bg-amber-500/5 border-amber-500/20"
                            : "bg-emerald-500/5 border-emerald-500/10",
                      )}>
                        <div className="flex items-center gap-3">
                          {isResolved ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : isFixPending ? (
                            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          )}
                          <div>
                            <div className="text-xs font-bold text-slate-200">
                              {isResolved
                                ? "Fix Executed — Verified on Trust Provenance"
                                : isFixPending
                                  ? "Fix Pending Guardian Approval"
                                  : "Automated Fix Available"}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">{exp.fixLabel}</p>
                            {isResolved && fixReq?.executionLog && (
                              <ul className="mt-2 space-y-0.5 text-[10px] text-emerald-300/80 font-mono list-disc list-inside">
                                {fixReq.executionLog.slice(0, 2).map((line, idx) => (
                                  <li key={idx}>{line}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                        {isResolved ? (
                          <div className="px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300 font-mono font-bold">
                            RESOLVED
                          </div>
                        ) : isFixPending ? (
                          <div className="px-3 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 font-mono font-bold">
                            AWAITING APPROVAL
                          </div>
                        ) : (
                          <button
                            onClick={() => queueFix(exp.id)}
                            className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold transition-colors flex items-center gap-1.5"
                          >
                            Run Fix
                            <AlertTriangle className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-[10px] text-slate-500 font-mono uppercase">Detected</div>
                    <div className="text-xs font-bold text-slate-300 mt-1">
                      {new Date(exp.detectedAt).toLocaleTimeString()}
                    </div>
                    <div className="mt-3 flex flex-col items-end gap-1.5">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-mono font-bold border",
                        status === "open" ? "text-red-400 border-red-500/30 bg-red-500/5" :
                        status === "fix-pending" ? "text-amber-400 border-amber-500/30 bg-amber-500/5" :
                        "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
                      )}>
                        {status.toUpperCase()}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                        <FileText className="w-3 h-3" />
                        {exp.proofHash}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ProofEnvelope>
          );
        })}
      </div>
    </div>
  );
}
