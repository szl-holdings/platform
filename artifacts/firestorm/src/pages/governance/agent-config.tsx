import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Brain, Shield, Play, Pause, Settings, Save, X, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, RefreshCw, Zap, Toggle, ToggleLeft, ToggleRight,
  Cpu, Lock, Wrench, SlidersHorizontal, Eye, EyeOff, Info,
} from "lucide-react";
import { api } from "@/lib/api";

interface AgentDef {
  id: string;
  name: string;
  domain: string;
  preferredModel: string;
  preferredProvider: string;
  systemPrompt: string;
  tools: string[];
  highStakesDomains: string[];
  confidenceThreshold?: number;
  active?: boolean;
}

const DEFAULT_AGENTS: AgentDef[] = [
  {
    id: "alloy", name: "Alloy", domain: "orchestration",
    preferredModel: "gpt-5.2", preferredProvider: "openai",
    systemPrompt: "You are Alloy, the central orchestration intelligence of the Nuro Mesh — SZL Holdings' unified multi-agent AI system. You coordinate specialized domain agents, aggregate their insights, and provide unified intelligence across the entire SZL platform.",
    tools: ["system_health", "admin_overview"], highStakesDomains: [],
    confidenceThreshold: 0.7, active: true,
  },
  {
    id: "sentinel", name: "Sentinel", domain: "security",
    preferredModel: "claude-sonnet-4-6", preferredProvider: "anthropic",
    systemPrompt: "You are Sentinel, the cybersecurity intelligence agent within the Nuro Mesh. You specialize in threat analysis, CVE assessment, incident response, and security posture evaluation. You also serve as the maker-checker validator for other agents' high-stakes recommendations.",
    tools: ["threat_feeds", "cve_database", "nvd_api"], highStakesDomains: ["critical_vulnerability", "incident_response", "breach_detected"],
    confidenceThreshold: 0.85, active: true,
  },
  {
    id: "helmsman", name: "Helmsman", domain: "maritime",
    preferredModel: "claude-sonnet-4-6", preferredProvider: "anthropic",
    systemPrompt: "You are Helmsman, the maritime intelligence agent within the Nuro Mesh. You specialize in fleet operations, AIS tracking, maritime security, route risk assessment, and sanctions compliance.",
    tools: ["maritime_data", "ais_positions", "weather_marine"], highStakesDomains: ["route_risk", "sanctions", "fleet_emergency"],
    confidenceThreshold: 0.8, active: true,
  },
  {
    id: "inca", name: "INCA", domain: "research",
    preferredModel: "gemini-3.1-pro-preview", preferredProvider: "gemini",
    systemPrompt: "You are INCA, the AI research intelligence agent within the Nuro Mesh. You specialize in AI/ML research, model evaluation, academic literature analysis, and technology trend assessment.",
    tools: ["huggingface_search", "arxiv_search", "model_registry"], highStakesDomains: [],
    confidenceThreshold: 0.75, active: true,
  },
  {
    id: "beacon", name: "Terra Analytics", domain: "analytics",
    preferredModel: "gpt-5.2", preferredProvider: "openai",
    systemPrompt: "You are Terra Analytics, the analytics and operations intelligence agent within the Nuro Mesh. You specialize in signal analysis, anomaly detection, platform performance, and operational intelligence.",
    tools: ["system_health", "platform_stats", "ecosystem_health"], highStakesDomains: ["financial_alert", "ops_critical"],
    confidenceThreshold: 0.75, active: true,
  },
  {
    id: "zeus", name: "Zeus", domain: "infrastructure",
    preferredModel: "gpt-5.2", preferredProvider: "openai",
    systemPrompt: "You are Zeus, the infrastructure intelligence agent within the Nuro Mesh. You specialize in cloud infrastructure, system health, resource optimization, and incident detection.",
    tools: ["system_health", "admin_overview"], highStakesDomains: ["infrastructure_failure", "security_breach"],
    confidenceThreshold: 0.8, active: true,
  },
  {
    id: "muse", name: "Muse", domain: "creative",
    preferredModel: "gemini-3-flash-preview", preferredProvider: "gemini",
    systemPrompt: "You are Muse, the creative intelligence agent within the Nuro Mesh. You specialize in content strategy, campaign ideation, creative briefs, and brand voice.",
    tools: ["content_strategy"], highStakesDomains: [],
    confidenceThreshold: 0.65, active: true,
  },
];

const PROVIDERS = ["openai", "anthropic", "gemini"];
const MODELS: Record<string, string[]> = {
  openai: ["gpt-5.2", "gpt-4o", "gpt-4o-mini"],
  anthropic: ["claude-sonnet-4-6", "claude-3-5-haiku-latest", "claude-opus-4-5"],
  gemini: ["gemini-3.1-pro-preview", "gemini-3-flash-preview", "gemini-2.0-flash"],
};

const ALL_TOOLS = [
  "system_health", "admin_overview", "maritime_data", "ais_positions", "weather_marine",
  "threat_feeds", "cve_database", "nvd_api", "huggingface_search", "arxiv_search",
  "model_registry", "platform_stats", "ecosystem_health", "content_strategy",
];

const DOMAIN_COLORS: Record<string, string> = {
  orchestration: "#c9a84c", security: "#ef4444", maritime: "#0ea5e9",
  research: "#8b5cf6", analytics: "#22c55e", infrastructure: "#6366f1",
  creative: "#d946ef",
};

function AgentEditor({ agent: initial, onClose, onSave }: { agent: AgentDef; onClose: () => void; onSave: (a: AgentDef) => void }) {
  const [agent, setAgent] = useState<AgentDef>(JSON.parse(JSON.stringify(initial)));
  const [showPrompt, setShowPrompt] = useState(false);
  const set = (k: keyof AgentDef, v: unknown) => setAgent(p => ({ ...p, [k]: v }));
  const toggleTool = (tool: string) => set("tools", agent.tools.includes(tool) ? agent.tools.filter(t => t !== tool) : [...agent.tools, tool]);
  const toggleHighStakes = (domain: string) => set("highStakesDomains", agent.highStakesDomains.includes(domain) ? agent.highStakesDomains.filter(d => d !== domain) : [...agent.highStakesDomains, domain]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-2xl w-full max-w-2xl my-8 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#1e2a3a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${DOMAIN_COLORS[agent.domain] ?? "#6b7280"}18` }}>
              <Brain size={16} style={{ color: DOMAIN_COLORS[agent.domain] ?? "#6b7280" }} />
            </div>
            <div>
              <h3 className="font-semibold text-white">Edit Agent — {agent.name}</h3>
              <p className="text-xs text-[#8b9ab0]">{agent.domain} · {agent.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#1e2a3a] transition-colors"><X size={16} className="text-[#8b9ab0]" /></button>
        </div>
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#8b9ab0] mb-1.5 block uppercase tracking-wide">Provider</label>
              <select value={agent.preferredProvider} onChange={e => { set("preferredProvider", e.target.value); set("preferredModel", MODELS[e.target.value]?.[0] ?? ""); }}
                className="w-full bg-[#1e2a3a] border border-[#2e3a4a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400">
                {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#8b9ab0] mb-1.5 block uppercase tracking-wide">Model</label>
              <select value={agent.preferredModel} onChange={e => set("preferredModel", e.target.value)}
                className="w-full bg-[#1e2a3a] border border-[#2e3a4a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400">
                {(MODELS[agent.preferredProvider] ?? []).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-[#8b9ab0] mb-1.5 block uppercase tracking-wide">Confidence Threshold: {Math.round((agent.confidenceThreshold ?? 0.7) * 100)}%</label>
            <input type="range" min={0} max={1} step={0.05} value={agent.confidenceThreshold ?? 0.7}
              onChange={e => set("confidenceThreshold", parseFloat(e.target.value))}
              className="w-full accent-amber-400" />
            <div className="flex justify-between text-[10px] text-[#8b9ab0] mt-1"><span>0% (always output)</span><span>100% (high certainty only)</span></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[#8b9ab0] uppercase tracking-wide">System Prompt</label>
              <button onClick={() => setShowPrompt(p => !p)} className="text-xs text-amber-400 flex items-center gap-1">
                {showPrompt ? <EyeOff size={12} /> : <Eye size={12} />}{showPrompt ? "Hide" : "Show"}
              </button>
            </div>
            {showPrompt && (
              <textarea value={agent.systemPrompt} onChange={e => set("systemPrompt", e.target.value)} rows={6}
                className="w-full bg-[#1e2a3a] border border-[#2e3a4a] rounded-lg px-3 py-2 text-sm text-white font-mono resize-none focus:outline-none focus:ring-1 focus:ring-amber-400" />
            )}
          </div>

          <div>
            <label className="text-xs text-[#8b9ab0] mb-2 block uppercase tracking-wide">Tool Permissions</label>
            <div className="flex flex-wrap gap-2">
              {ALL_TOOLS.map(tool => (
                <button key={tool} onClick={() => toggleTool(tool)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${agent.tools.includes(tool) ? "bg-amber-400/15 text-amber-300 border border-amber-400/30" : "bg-[#1e2a3a] text-[#8b9ab0] border border-[#2e3a4a] hover:border-[#3e4a5a]"}`}>
                  {tool}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-[#8b9ab0] mb-2 block uppercase tracking-wide">High-Stakes Domains (require maker-checker)</label>
            <div className="flex flex-wrap gap-2">
              {["critical_vulnerability", "incident_response", "breach_detected", "route_risk", "sanctions", "fleet_emergency", "financial_alert", "ops_critical", "infrastructure_failure", "security_breach"].map(d => (
                <button key={d} onClick={() => toggleHighStakes(d)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${agent.highStakesDomains.includes(d) ? "bg-red-500/15 text-red-300 border border-red-500/30" : "bg-[#1e2a3a] text-[#8b9ab0] border border-[#2e3a4a] hover:border-[#3e4a5a]"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[#1e2a3a] rounded-lg">
            <span className="text-sm text-white flex-1">Agent Status</span>
            <button onClick={() => set("active", !agent.active)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${agent.active ? "bg-green-500/15 text-green-400 border border-green-500/30" : "bg-[#2e3a4a] text-[#8b9ab0] border border-[#3e4a5a]"}`}>
              {agent.active ? <><CheckCircle2 size={12} />Active</> : <><Pause size={12} />Inactive</>}
            </button>
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-[#1e2a3a] text-sm text-[#8b9ab0] hover:bg-[#1e2a3a] transition-colors">Cancel</button>
          <button onClick={() => { onSave(agent); onClose(); }}
            className="flex-1 py-2 rounded-lg bg-amber-400 text-black text-sm font-semibold hover:bg-amber-300 transition-colors flex items-center justify-center gap-2">
            <Save size={14} />Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AgentConfigPage() {
  const qc = useQueryClient();
  const [agents, setAgents] = useState<AgentDef[]>(DEFAULT_AGENTS);
  const [editing, setEditing] = useState<AgentDef | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const { data: liveAgents, isLoading } = useQuery({
    queryKey: ["nuro-mesh-agent-list"],
    queryFn: () => api.get("/nuro-mesh/agents").then(r => r.data),
    retry: 1,
  });

  const handleSave = async (updated: AgentDef) => {
    setSavingId(updated.id);
    setAgents(prev => prev.map(a => a.id === updated.id ? updated : a));
    try {
      await api.put(`/nuro-mesh/agents/${updated.id}/config`, {
        systemPrompt: updated.systemPrompt,
        preferredModel: updated.preferredModel,
        preferredProvider: updated.preferredProvider,
        confidenceThreshold: updated.confidenceThreshold,
        tools: updated.tools,
        highStakesDomains: updated.highStakesDomains,
        active: updated.active,
      });
      qc.invalidateQueries({ queryKey: ["nuro-mesh-agent-list"] });
    } catch {
    } finally {
      setSavingId(null);
    }
  };

  const toggleActive = (id: string) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  return (
    <div className="min-h-screen bg-[#07090d] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Brain size={22} className="text-amber-400" />
              <h1 className="text-xl font-bold text-white font-mono tracking-tight">Agent Configuration</h1>
            </div>
            <p className="text-xs text-[#8b9ab0] font-mono">Edit system prompts, model routing, confidence thresholds, tool permissions, and governance escalation rules for all Nuro Mesh agents</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono ${isLoading ? "bg-amber-400/10 text-amber-400" : "bg-green-500/10 text-green-400"} border ${isLoading ? "border-amber-400/20" : "border-green-500/20"}`}>
              <Cpu size={12} />
              {isLoading ? "Connecting…" : "Nuro Mesh Connected"}
            </div>
          </div>
        </div>

        <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4 flex items-start gap-3">
          <Lock size={14} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-200/80 font-mono leading-relaxed">
            Changes to agent configuration take effect immediately. System prompt edits affect all future conversations. Disabling an agent prevents it from receiving new delegations. High-stakes domain changes affect the maker-checker validation pipeline.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Agents", value: agents.length, color: "#c9a84c" },
            { label: "Active", value: agents.filter(a => a.active !== false).length, color: "#22c55e" },
            { label: "High-Stakes Domains", value: agents.reduce((sum, a) => sum + a.highStakesDomains.length, 0), color: "#ef4444" },
            { label: "Tool Permissions", value: [...new Set(agents.flatMap(a => a.tools))].length, color: "#8b5cf6" },
          ].map(m => (
            <div key={m.label} className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-4">
              <div className="text-xs text-[#8b9ab0] font-mono mb-1">{m.label}</div>
              <div className="text-2xl font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map(agent => {
            const accentColor = DOMAIN_COLORS[agent.domain] ?? "#6b7280";
            const isActive = agent.active !== false;
            const isSaving = savingId === agent.id;
            return (
              <div key={agent.id} className={`bg-[#0d1117] border rounded-xl p-5 transition-colors ${isActive ? "border-[#1e2a3a]" : "border-[#1e2a3a] opacity-60"}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accentColor}18`, border: `1px solid ${accentColor}25` }}>
                      <Brain size={18} style={{ color: accentColor }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{agent.name}</span>
                        {isSaving && <RefreshCw size={12} className="text-amber-400 animate-spin" />}
                      </div>
                      <p className="text-xs text-[#8b9ab0] capitalize">{agent.domain} · {agent.preferredProvider}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleActive(agent.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-colors ${isActive ? "bg-green-500/15 text-green-400 border border-green-500/25" : "bg-[#1e2a3a] text-[#8b9ab0] border border-[#2e3a4a]"}`}>
                      {isActive ? <CheckCircle2 size={11} /> : <Pause size={11} />}
                      {isActive ? "Active" : "Inactive"}
                    </button>
                    <button
                      onClick={() => setEditing(agent)}
                      className="p-1.5 rounded-lg hover:bg-[#1e2a3a] transition-colors border border-[#1e2a3a]"
                      title="Edit configuration">
                      <SlidersHorizontal size={14} className="text-[#8b9ab0]" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8b9ab0] font-mono">Model</span>
                    <code className="text-white font-mono text-[10px] bg-[#1e2a3a] px-2 py-0.5 rounded">{agent.preferredModel}</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8b9ab0] font-mono">Confidence threshold</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-[#1e2a3a] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-amber-400" style={{ width: `${(agent.confidenceThreshold ?? 0.7) * 100}%` }} />
                      </div>
                      <span className="text-white font-mono">{Math.round((agent.confidenceThreshold ?? 0.7) * 100)}%</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[#8b9ab0] font-mono block mb-1.5">Tools ({agent.tools.length})</span>
                    <div className="flex flex-wrap gap-1">
                      {agent.tools.slice(0, 4).map(t => <span key={t} className="text-[9px] bg-[#1e2a3a] text-[#8b9ab0] px-1.5 py-0.5 rounded font-mono">{t}</span>)}
                      {agent.tools.length > 4 && <span className="text-[9px] text-[#8b9ab0]">+{agent.tools.length - 4} more</span>}
                    </div>
                  </div>
                  {agent.highStakesDomains.length > 0 && (
                    <div>
                      <span className="text-[#8b9ab0] font-mono block mb-1.5">High-Stakes ({agent.highStakesDomains.length})</span>
                      <div className="flex flex-wrap gap-1">
                        {agent.highStakesDomains.slice(0, 3).map(d => <span key={d} className="text-[9px] bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded font-mono">{d}</span>)}
                        {agent.highStakesDomains.length > 3 && <span className="text-[9px] text-[#8b9ab0]">+{agent.highStakesDomains.length - 3}</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editing && (
        <AgentEditor agent={editing} onClose={() => setEditing(null)} onSave={handleSave} />
      )}
    </div>
  );
}
