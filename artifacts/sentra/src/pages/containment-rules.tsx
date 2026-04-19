import { useMemo, useState } from "react";
import {
  Shield, Plus, AlertTriangle, CheckCircle2, Edit2, Server, Globe,
  Activity, Ban, Lock, Radio, ShieldOff, Clock,
} from "lucide-react";
import { agentMesh, type EnforcementMode, MESH_AGENT_DISPLAY_NAMES } from "@/data/agent-mesh";
import { cn } from "@szl-holdings/shared-ui/utils";

const TIER_STYLES: Record<string, string> = {
  critical: "text-red-400 border-red-500/30 bg-red-500/10",
  elevated: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  standard: "text-sky-400 border-sky-500/30 bg-sky-500/10",
};

const MODE_META: Record<EnforcementMode, { label: string; icon: typeof Radio; color: string; ring: string; desc: string }> = {
  "log-only": {
    label: "Log-Only",
    icon: Radio,
    color: "text-slate-300",
    ring: "border-slate-600/40 bg-slate-700/20",
    desc: "Observe and record violations as Exposures. Calls still reach the MCP server.",
  },
  block: {
    label: "Block",
    icon: Ban,
    color: "text-amber-300",
    ring: "border-amber-500/30 bg-amber-500/10",
    desc: "Reject offending calls at the gateway. Other calls pass through normally.",
  },
  quarantine: {
    label: "Quarantine",
    icon: ShieldOff,
    color: "text-red-300",
    ring: "border-red-500/30 bg-red-500/10",
    desc: "Reject all calls from this agent class until the rule is cleared.",
  },
};

const DECISION_STYLES: Record<string, { dot: string; chip: string; label: string }> = {
  allowed: { dot: "bg-emerald-400", chip: "text-emerald-400 border-emerald-500/20", label: "ALLOWED" },
  logged: { dot: "bg-sky-400", chip: "text-sky-400 border-sky-500/20", label: "LOGGED" },
  blocked: { dot: "bg-amber-400", chip: "text-amber-400 border-amber-500/20", label: "BLOCKED" },
  quarantined: { dot: "bg-red-400", chip: "text-red-400 border-red-500/20", label: "QUARANTINED" },
};

function formatUptime(s: number) {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  return `${d}d ${h}h`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ContainmentRules() {
  const { containmentRules: initialRules, mcpServers, gateway, gatewayEvents } = agentMesh;
  const [rules, setRules] = useState(initialRules);
  const [expandedId, setExpandedId] = useState<string | null>("rule-codex-restricted");

  const getMcpName = (id: string) => mcpServers.find(m => m.id === id)?.name ?? id.replace("mcp-", "");

  const setMode = (ruleId: string, mode: EnforcementMode) => {
    setRules(prev => prev.map(r => {
      if (r.id !== ruleId) return r;
      if (r.enforcementMode === mode && !r.pendingModeChange) return r;

      if (r.tier === "critical" && r.enforcementMode !== mode) {
        // Critical-tier changes route through Guardian — stage as pending.
        return {
          ...r,
          pendingModeChange: {
            requestedMode: mode,
            requestedBy: "operator@sentra",
            requestedAt: new Date().toISOString(),
            guardianApprovalId: `approval-mcp-gw-${ruleId.slice(-4)}-${Date.now().toString(36)}`,
          },
        };
      }
      return { ...r, enforcementMode: mode, pendingModeChange: undefined };
    }));
  };

  const cancelPending = (ruleId: string) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, pendingModeChange: undefined } : r));
  };

  const totals = useMemo(() => ({
    rules: rules.length,
    violations: rules.reduce((a, r) => a + r.violationCount, 0),
    blocking: rules.filter(r => r.enforcementMode !== "log-only").length,
    pendingApproval: rules.filter(r => r.pendingModeChange).length,
  }), [rules]);

  const recentEvents = useMemo(
    () => [...gatewayEvents].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 8),
    [gatewayEvents]
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-100">Containment Rules</h1>
          <p className="text-slate-400 mt-1">
            Define what each agent class can access — choose log-only, block, or quarantine enforcement at the MCP gateway.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 text-sm font-bold transition-colors">
          <Plus className="w-4 h-4" />
          New Rule
        </button>
      </header>

      <section className="sentra-panel p-5 border-emerald-500/20">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={cn(
              "w-12 h-12 rounded flex items-center justify-center border shrink-0",
              gateway.status === "online"
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-amber-500/10 border-amber-500/30"
            )}>
              <Activity className={cn(
                "w-5 h-5",
                gateway.status === "online" ? "text-emerald-400" : "text-amber-400"
              )} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase text-emerald-400">MCP Traffic Gateway</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[9px] font-mono uppercase border",
                  gateway.status === "online"
                    ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                    : "text-amber-400 border-amber-500/30 bg-amber-500/10"
                )}>
                  ● {gateway.status}
                </span>
              </div>
              <code className="block text-sm font-mono text-slate-100 mt-1.5 select-all">
                {gateway.endpoint}
              </code>
              <p className="text-xs text-slate-500 mt-2 max-w-xl">
                Configure this URL as the MCP endpoint in agent runtimes (Claude Desktop, Cursor, Codex CLI). The gateway evaluates every call against active Containment Rules in real time and blocks violations before they reach external services.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-right shrink-0">
            <div>
              <div className="text-[9px] text-slate-500 font-mono uppercase">Calls / 24h</div>
              <div className="text-xl font-display font-bold text-slate-100">{gateway.callsLast24h.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-500 font-mono uppercase">Avg latency</div>
              <div className="text-xl font-display font-bold text-slate-100">{gateway.averageLatencyMs}<span className="text-xs text-slate-500 ml-0.5">ms</span></div>
            </div>
            <div>
              <div className="text-[9px] text-slate-500 font-mono uppercase">Blocked</div>
              <div className="text-xl font-display font-bold text-amber-400">{gateway.blockedLast24h}</div>
            </div>
            <div>
              <div className="text-[9px] text-slate-500 font-mono uppercase">Quarantined</div>
              <div className="text-xl font-display font-bold text-red-400">{gateway.quarantinedLast24h}</div>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-800/60 text-[10px] font-mono text-slate-500 flex items-center gap-2">
          <Clock className="w-3 h-3" /> Uptime {formatUptime(gateway.uptimeSeconds)} · Critical-tier mode changes require Guardian approval before taking effect.
        </div>
      </section>

      <div className="grid grid-cols-4 gap-4 mb-2">
        <div className="sentra-panel p-4 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Active Rules</div>
          <div className="text-3xl font-display font-bold text-slate-100">{totals.rules}</div>
        </div>
        <div className="sentra-panel p-4 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Total Violations</div>
          <div className="text-3xl font-display font-bold text-red-400">{totals.violations}</div>
        </div>
        <div className="sentra-panel p-4 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Enforcing</div>
          <div className="text-3xl font-display font-bold text-amber-400">{totals.blocking}<span className="text-base text-slate-500">/{totals.rules}</span></div>
        </div>
        <div className="sentra-panel p-4 text-center">
          <div className="text-[10px] text-slate-500 font-mono uppercase mb-1">Pending Guardian</div>
          <div className="text-3xl font-display font-bold text-sky-400">{totals.pendingApproval}</div>
        </div>
      </div>

      <div className="space-y-4">
        {rules.map(rule => {
          const modeMeta = MODE_META[rule.enforcementMode];
          const ModeIcon = modeMeta.icon;
          return (
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
                    <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase border", modeMeta.ring, modeMeta.color)}>
                      <ModeIcon className="w-3 h-3" />
                      {modeMeta.label}
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
                <div className="pt-5">
                  <div className="text-[10px] text-slate-500 font-mono uppercase mb-3 flex items-center gap-1.5">
                    <Activity className="w-3 h-3" />
                    Gateway Enforcement Mode
                    {rule.tier === "critical" && (
                      <span className="flex items-center gap-1 text-[10px] font-mono uppercase text-red-300">
                        <Lock className="w-3 h-3" /> Guardian-gated
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(MODE_META) as EnforcementMode[]).map(mode => {
                      const meta = MODE_META[mode];
                      const Icon = meta.icon;
                      const isActive = rule.enforcementMode === mode;
                      const isPending = rule.pendingModeChange?.requestedMode === mode;
                      return (
                        <button
                          key={mode}
                          onClick={(e) => { e.stopPropagation(); setMode(rule.id, mode); }}
                          className={cn(
                            "text-left rounded border p-3 transition-colors",
                            isActive
                              ? `${meta.ring} ${meta.color}`
                              : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:bg-slate-800/40",
                            isPending && "ring-1 ring-sky-500/40"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <Icon className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-mono uppercase font-bold">{meta.label}</span>
                            {isActive && <span className="ml-auto text-[9px] font-mono text-emerald-400">ACTIVE</span>}
                            {isPending && <span className="ml-auto text-[9px] font-mono text-sky-400">PENDING</span>}
                          </div>
                          <p className="text-[11px] leading-snug text-slate-500">{meta.desc}</p>
                        </button>
                      );
                    })}
                  </div>

                  {rule.pendingModeChange && (
                    <div className="mt-3 flex items-start gap-3 rounded border border-sky-500/30 bg-sky-500/10 p-3">
                      <Lock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-sky-300">
                          Awaiting Guardian approval to switch to {MODE_META[rule.pendingModeChange.requestedMode].label}
                        </div>
                        <div className="text-[11px] font-mono text-sky-400/70 mt-0.5">
                          Requested by {rule.pendingModeChange.requestedBy} · {timeAgo(rule.pendingModeChange.requestedAt)} · {rule.pendingModeChange.guardianApprovalId}
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); cancelPending(rule.id); }}
                        className="text-[11px] font-mono text-sky-300 hover:text-sky-200 underline shrink-0"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-5 mt-5 border-t border-slate-800">
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
                        ? "Codex CLI connected to quarantined mcp-ext-scraper server — not in allowlist. 3 tool calls blocked at the MCP gateway."
                        : "Agent accessed filesystem paths outside the allowed read scope. Gateway logged the call and emitted an Exposure."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );})}
      </div>

      <section className="sentra-panel p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] text-slate-500 font-mono uppercase">Recent Gateway Decisions</div>
            <p className="text-xs text-slate-400 mt-0.5">Live stream of MCP calls evaluated against active Containment Rules.</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            STREAMING
          </div>
        </div>
        <div className="space-y-1.5">
          {recentEvents.map(evt => {
            const decoration = DECISION_STYLES[evt.decision];
            return (
              <div key={evt.id} className="grid grid-cols-12 items-center gap-3 rounded bg-slate-900/40 border border-slate-800/60 px-3 py-2 hover:bg-slate-800/40 transition-colors">
                <div className="col-span-1 flex items-center gap-2">
                  <span className={cn("w-1.5 h-1.5 rounded-full", decoration.dot)} />
                  <span className={cn("text-[9px] font-mono font-bold border px-1.5 py-0.5 rounded", decoration.chip)}>
                    {decoration.label}
                  </span>
                </div>
                <div className="col-span-3 text-xs text-slate-200 font-mono truncate">
                  {MESH_AGENT_DISPLAY_NAMES[evt.agentId] ?? evt.agentId}
                  <span className="text-slate-600"> → </span>
                  <span className="text-slate-400">{getMcpName(evt.mcpServerId)}</span>
                </div>
                <div className="col-span-2 text-[11px] font-mono text-slate-300 truncate">
                  {evt.tool}
                </div>
                <div className="col-span-2 text-[11px] font-mono text-slate-500 truncate">
                  {evt.egressDomain ?? "—"}
                </div>
                <div className="col-span-3 text-[11px] text-slate-400 truncate" title={evt.reason}>
                  {evt.reason}
                </div>
                <div className="col-span-1 text-right text-[10px] font-mono text-slate-600">
                  {timeAgo(evt.occurredAt)}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="sentra-panel p-5 border-sky-500/20">
        <div className="text-[10px] text-sky-400 font-mono uppercase mb-3">Tier-Policy Mapping</div>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded bg-slate-800/50">
            <div className="font-bold text-red-400 mb-1">Critical Tier</div>
            <p className="text-slate-500">Enforcement mode changes require Guardian approval. Blocked calls create P0 Exposures immediately.</p>
          </div>
          <div className="p-3 rounded bg-slate-800/50">
            <div className="font-bold text-amber-400 mb-1">Elevated Tier</div>
            <p className="text-slate-500">Operators can switch between log-only and block. Quarantine still requires Guardian sign-off.</p>
          </div>
          <div className="p-3 rounded bg-slate-800/50">
            <div className="font-bold text-sky-400 mb-1">Standard Tier</div>
            <p className="text-slate-500">Operators may freely toggle enforcement modes. All blocked calls are logged as Exposures.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
