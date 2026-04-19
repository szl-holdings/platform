import { useState } from "react";
import { Shield, Plus, AlertTriangle, CheckCircle2, Edit2, Server, Globe } from "lucide-react";
import { agentMesh } from "@/data/agent-mesh";
import { cn } from "@szl-holdings/shared-ui/utils";

const TIER_STYLES: Record<string, string> = {
  critical: "text-red-400 border-red-500/30 bg-red-500/10",
  elevated: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  standard: "text-sky-400 border-sky-500/30 bg-sky-500/10",
};

export default function ContainmentRules() {
  const { containmentRules, mcpServers } = agentMesh;
  const [expandedId, setExpandedId] = useState<string | null>("rule-codex-restricted");

  const getMcpName = (id: string) => mcpServers.find(m => m.id === id)?.name ?? id.replace("mcp-", "");

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-100">Containment Rules</h1>
          <p className="text-slate-400 mt-1">Define what each agent class can access, read, and call — violations become Exposures</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 text-sm font-bold transition-colors">
          <Plus className="w-4 h-4" />
          New Rule
        </button>
      </header>

      <div className="grid grid-cols-3 gap-4 mb-2">
        <div className="sentra-panel p-4 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Active Rules</div>
          <div className="text-3xl font-display font-bold text-slate-100">{containmentRules.length}</div>
        </div>
        <div className="sentra-panel p-4 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Total Violations</div>
          <div className="text-3xl font-display font-bold text-red-400">
            {containmentRules.reduce((a, r) => a + r.violationCount, 0)}
          </div>
        </div>
        <div className="sentra-panel p-4 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Tier Policy</div>
          <div className="text-sm font-bold text-slate-300 mt-1">Guardian-Aware</div>
        </div>
      </div>

      <div className="space-y-4">
        {containmentRules.map(rule => (
          <div key={rule.id} className="sentra-panel overflow-hidden">
            <button
              className="w-full p-6 flex items-center justify-between gap-4 text-left hover:bg-slate-800/20 transition-colors"
              onClick={() => setExpandedId(expandedId === rule.id ? null : rule.id)}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded flex items-center justify-center border shrink-0",
                  rule.violationCount > 0 ? "bg-red-500/10 border-red-500/20" : "bg-emerald-500/10 border-emerald-500/20"
                )}>
                  <Shield className={cn("w-5 h-5", rule.violationCount > 0 ? "text-red-400" : "text-emerald-400")} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-100">{rule.name}</span>
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-mono uppercase border font-bold", TIER_STYLES[rule.tier])}>
                      {rule.tier}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-1">
                    Agent class: {rule.agentClass} · Last evaluated: {new Date(rule.lastEvaluatedAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {rule.violationCount > 0 ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-bold">
                    <AlertTriangle className="w-3 h-3" />
                    {rule.violationCount} violation{rule.violationCount > 1 ? "s" : ""}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Compliant
                  </div>
                )}
                <Edit2 className="w-4 h-4 text-slate-600" />
              </div>
            </button>

            {expandedId === rule.id && (
              <div className="px-6 pb-6 border-t border-slate-800">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-5">
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase mb-3 flex items-center gap-1.5">
                      <Server className="w-3 h-3" />
                      Allowed MCP Servers
                    </div>
                    <div className="space-y-1.5">
                      {rule.allowedMcpServers.map(id => (
                        <div key={id} className="flex items-center gap-2 text-[11px] font-mono text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          {getMcpName(id)}
                        </div>
                      ))}
                      {mcpServers
                        .filter(m => !rule.allowedMcpServers.includes(m.id))
                        .map(m => (
                          <div key={m.id} className="flex items-center gap-2 text-[11px] font-mono text-slate-600 line-through">
                            <AlertTriangle className="w-3 h-3 text-slate-700" />
                            {m.name}
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase mb-3">Allowed Tools</div>
                    <div className="space-y-1.5">
                      {rule.allowedTools.map(t => (
                        <div key={t} className="text-[11px] font-mono text-slate-300 px-2 py-0.5 rounded bg-slate-800 inline-block">
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase mb-3">Read Paths</div>
                    <div className="space-y-1.5">
                      {rule.allowedReadPaths.map(p => (
                        <div key={p} className="text-[11px] font-mono text-slate-400">{p}</div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-500 font-mono uppercase mb-3 flex items-center gap-1.5">
                      <Globe className="w-3 h-3" />
                      Allowed Egress
                    </div>
                    {rule.allowedEgressDomains.length > 0 ? (
                      <div className="space-y-1.5">
                        {rule.allowedEgressDomains.map(d => (
                          <div key={d} className="text-[11px] font-mono text-slate-300">{d}</div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" />
                        Egress blocked
                      </div>
                    )}
                  </div>
                </div>

                {rule.violationCount > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <div className="text-[10px] text-slate-500 font-mono uppercase mb-2">Violation Details</div>
                    <p className="text-xs text-red-400/80">
                      {rule.agentClass === "codex-cli"
                        ? "Codex CLI connected to quarantined mcp-ext-scraper server — not in allowlist. 3 tool calls made before containment."
                        : "Agent accessed filesystem paths outside the allowed read scope. Containment rule applied and logged."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="sentra-panel p-5 border-sky-500/20">
        <div className="text-[10px] text-sky-400 font-mono uppercase mb-3">Tier-Policy Mapping</div>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded bg-slate-800/50">
            <div className="font-bold text-red-400 mb-1">Critical Tier</div>
            <p className="text-slate-500">All rule changes require Guardian approval. Violations create P0 Exposures immediately.</p>
          </div>
          <div className="p-3 rounded bg-slate-800/50">
            <div className="font-bold text-amber-400 mb-1">Elevated Tier</div>
            <p className="text-slate-500">New server additions require approval. Tool scope expansions are auto-flagged.</p>
          </div>
          <div className="p-3 rounded bg-slate-800/50">
            <div className="font-bold text-sky-400 mb-1">Standard Tier</div>
            <p className="text-slate-500">Read-path expansions are logged. Write-path or egress additions require review.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
