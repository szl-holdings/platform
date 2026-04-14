import { useState } from "react";
import { cn } from "../lib/utils";
import {
  Users, Plus, Trash2, Brain, Shield, BarChart3, Server, Compass, ChevronDown, ChevronUp, Settings, Play, Copy, Check
} from "lucide-react";

function AnchorIcon(props: { className?: string }) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/>
    </svg>
  );
}
function TelescopeIcon(props: { className?: string }) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="15" cy="6" r="1"/><path d="M20.2 8.5 22 5l-5.3-1.8-1.8 3.5"/><path d="m11.2 5.2 6 16.4"/><path d="m3.4 14.2 6.1-3.1a1 1 0 0 0 .4-1.4L8.1 7.5a1 1 0 0 0-1.4-.4L0 10.2"/><path d="m4 14 3.5 6"/>
    </svg>
  );
}
function PaletteIcon(props: { className?: string }) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
    </svg>
  );
}

const DOMAIN_AGENTS = [
  { id: "alloy", name: "Alloy", domain: "orchestration", model: "gpt-5.2", provider: "openai", icon: Brain, specialization: "Multi-domain orchestration & routing", tools: ["router", "planner", "context-manager"], color: "#7c3aed" },
  { id: "helmsman", name: "Helmsman", domain: "maritime", model: "claude-sonnet-4-6", provider: "anthropic", icon: AnchorIcon, specialization: "Vessel tracking, AIS analysis, sanctions screening", tools: ["ais-feed", "vessel-db", "sanctions-api"], color: "#3b82f6" },
  { id: "sentinel", name: "Sentinel", domain: "security", model: "claude-sonnet-4-6", provider: "anthropic", icon: Shield, specialization: "Threat assessment, maker-checker validation", tools: ["cve-db", "threat-intel", "policy-engine"], color: "#f43f5e" },
  { id: "inca", name: "INCA", domain: "research", model: "gemini-3.1-pro-preview", provider: "gemini", icon: TelescopeIcon, specialization: "AI model scouting, arXiv research, benchmarking", tools: ["huggingface-api", "arxiv-api", "semantic-scholar"], color: "#8b5cf6" },
  { id: "muse", name: "Muse", domain: "creative", model: "gpt-5.2", provider: "openai", icon: PaletteIcon, specialization: "Content generation, brand strategy, copywriting", tools: ["web-search", "content-store", "template-engine"], color: "#ec4899" },
  { id: "beacon", name: "Beacon", domain: "analytics", model: "gemini-3.1-pro-preview", provider: "gemini", icon: BarChart3, specialization: "Anomaly detection, KPI monitoring, trend analysis", tools: ["telemetry-db", "anomaly-engine", "kpi-store"], color: "#10b981" },
  { id: "zeus", name: "Zeus", domain: "infrastructure", model: "claude-sonnet-4-6", provider: "anthropic", icon: Server, specialization: "Azure operations, Kubernetes, deployment management", tools: ["azure-api", "k8s-api", "terraform"], color: "#f97316" },
  { id: "compass", name: "Compass", domain: "real-estate", model: "gemini-3-flash-preview", provider: "gemini", icon: Compass, specialization: "Property valuation, market analysis, due diligence", tools: ["property-db", "market-feed", "gis-api"], color: "#22d3ee" },
];

const ROLES = ["Leader", "Specialist", "Checker", "Reporter"] as const;
type Role = typeof ROLES[number];

const ROLE_COLORS: Record<Role, string> = {
  Leader: "bg-primary/10 text-primary border-primary/25",
  Specialist: "bg-blue-500/10 text-blue-400 border-blue-500/25",
  Checker: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  Reporter: "bg-green-500/10 text-green-400 border-green-500/25",
};

const CREW_TEMPLATES = [
  {
    name: "Maritime Sanctions Investigation",
    objective: "Investigate suspected sanctions evasion by vessel fleet, correlate ownership structures, assess risk exposure",
    members: [
      { agentId: "alloy", role: "Leader" as Role },
      { agentId: "helmsman", role: "Specialist" as Role },
      { agentId: "sentinel", role: "Checker" as Role },
      { agentId: "beacon", role: "Reporter" as Role },
    ],
  },
  {
    name: "AI Research & Deployment Assessment",
    objective: "Scout new AI models, evaluate deployment feasibility, benchmark candidates, prepare deployment recommendation",
    members: [
      { agentId: "alloy", role: "Leader" as Role },
      { agentId: "inca", role: "Specialist" as Role },
      { agentId: "zeus", role: "Specialist" as Role },
      { agentId: "beacon", role: "Reporter" as Role },
    ],
  },
  {
    name: "Real Estate Due Diligence",
    objective: "Analyze commercial property portfolio, assess market conditions, identify risks, prepare investment brief",
    members: [
      { agentId: "alloy", role: "Leader" as Role },
      { agentId: "compass", role: "Specialist" as Role },
      { agentId: "sentinel", role: "Checker" as Role },
      { agentId: "beacon", role: "Reporter" as Role },
    ],
  },
];

interface CrewMember {
  agentId: string;
  role: Role;
  customInstruction?: string;
}

interface Crew {
  name: string;
  objective: string;
  members: CrewMember[];
  executionMode: "sequential" | "parallel" | "hierarchical";
  maxRounds: number;
}

export function AgentCrewBuilder() {
  const [crew, setCrew] = useState<Crew>({
    name: "New Crew",
    objective: "",
    members: [],
    executionMode: "hierarchical",
    maxRounds: 5,
  });
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [deployed, setDeployed] = useState(false);
  const [copied, setCopied] = useState(false);

  function addAgent(agentId: string) {
    if (crew.members.find(m => m.agentId === agentId)) return;
    const role: Role = crew.members.length === 0 ? "Leader" : "Specialist";
    setCrew(c => ({ ...c, members: [...c.members, { agentId, role }] }));
  }

  function removeAgent(agentId: string) {
    setCrew(c => ({ ...c, members: c.members.filter(m => m.agentId !== agentId) }));
  }

  function updateRole(agentId: string, role: Role) {
    setCrew(c => ({ ...c, members: c.members.map(m => m.agentId === agentId ? { ...m, role } : m) }));
  }

  function updateInstruction(agentId: string, instruction: string) {
    setCrew(c => ({ ...c, members: c.members.map(m => m.agentId === agentId ? { ...m, customInstruction: instruction } : m) }));
  }

  function loadTemplate(t: typeof CREW_TEMPLATES[0]) {
    setCrew(c => ({ ...c, name: t.name, objective: t.objective, members: t.members }));
  }

  function deployCrewAction() {
    setDeployed(true);
    setTimeout(() => setDeployed(false), 3000);
  }

  function copySop() {
    const sop = JSON.stringify({ crew: crew.name, objective: crew.objective, members: crew.members, executionMode: crew.executionMode, maxRounds: crew.maxRounds }, null, 2);
    navigator.clipboard.writeText(sop).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">Agent Crew Builder</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          Assemble role-based agent crews from the Nuro Mesh domain roster. Configure objectives, roles, and execution parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: Agent Roster */}
        <div className="lg:col-span-2 space-y-4">
          <div className="inca-panel p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Domain Agent Roster</div>
            <div className="space-y-2">
              {DOMAIN_AGENTS.map((agent) => {
                const Icon = agent.icon;
                const inCrew = crew.members.find(m => m.agentId === agent.id);
                return (
                  <button
                    key={agent.id}
                    onClick={() => inCrew ? removeAgent(agent.id) : addAgent(agent.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all flex items-start gap-3",
                      inCrew
                        ? "border-primary/40 bg-primary/5"
                        : "border-border hover:border-primary/25 bg-transparent"
                    )}
                  >
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${agent.color}18`, border: `1px solid ${agent.color}30` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: agent.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-foreground">{agent.name}</div>
                        {inCrew && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize mb-1">{agent.domain} · {agent.model}</div>
                      <div className="text-xs text-muted-foreground leading-relaxed">{agent.specialization}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Templates */}
          <div className="inca-panel p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Crew Templates</div>
            <div className="space-y-2">
              {CREW_TEMPLATES.map((t) => (
                <button
                  key={t.name}
                  onClick={() => loadTemplate(t)}
                  className="w-full text-left px-3 py-2.5 rounded-lg bg-secondary hover:bg-secondary/70 transition-colors"
                >
                  <div className="text-sm font-medium text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.objective}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Crew Canvas */}
        <div className="lg:col-span-3 space-y-4">
          {/* Crew config */}
          <div className="inca-panel p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Crew Configuration</div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Crew Name</label>
                <input
                  value={crew.name}
                  onChange={(e) => setCrew(c => ({ ...c, name: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40"
                  placeholder="Name your crew..."
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Mission Objective</label>
                <textarea
                  value={crew.objective}
                  onChange={(e) => setCrew(c => ({ ...c, objective: e.target.value }))}
                  rows={3}
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40 resize-none"
                  placeholder="Define the crew's mission objective..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Execution Mode</label>
                  <select
                    value={crew.executionMode}
                    onChange={(e) => setCrew(c => ({ ...c, executionMode: e.target.value as Crew["executionMode"] }))}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40"
                  >
                    <option value="hierarchical">Hierarchical</option>
                    <option value="sequential">Sequential</option>
                    <option value="parallel">Parallel</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Max Rounds</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={crew.maxRounds}
                    onChange={(e) => setCrew(c => ({ ...c, maxRounds: parseInt(e.target.value) || 5 }))}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Crew members */}
          <div className="inca-panel overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <div className="text-sm font-medium text-foreground">Crew Members</div>
                <span className="badge-idle px-2 py-0.5 rounded-full text-xs">{crew.members.length}</span>
              </div>
              {crew.members.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={copySop}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Export SOP"}
                  </button>
                </div>
              )}
            </div>

            {crew.members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="w-8 h-8 text-muted-foreground mb-3" />
                <div className="text-sm text-muted-foreground">Select agents from the roster to build your crew</div>
                <div className="text-xs text-muted-foreground mt-1">Or load a template to get started</div>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {crew.members.map((member, idx) => {
                  const agentDef = DOMAIN_AGENTS.find(a => a.id === member.agentId)!;
                  if (!agentDef) return null;
                  const Icon = agentDef.icon;
                  const isExpanded = expandedMember === member.agentId;
                  return (
                    <div key={member.agentId} className="animate-fade-in">
                      <div className="px-4 py-3 flex items-center gap-3">
                        <div className="text-xs text-muted-foreground w-4 text-center font-mono">{idx + 1}</div>
                        <div
                          className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
                          style={{ background: `${agentDef.color}18`, border: `1px solid ${agentDef.color}30` }}
                        >
                          <Icon className="w-4 h-4" style={{ color: agentDef.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground">{agentDef.name}</div>
                          <div className="text-xs text-muted-foreground">{agentDef.model} · {agentDef.domain}</div>
                        </div>
                        {/* Role selector */}
                        <div className="flex gap-1 flex-shrink-0">
                          {ROLES.map(role => (
                            <button
                              key={role}
                              onClick={() => updateRole(member.agentId, role)}
                              className={cn(
                                "px-2 py-0.5 rounded text-xs border font-medium transition-all",
                                member.role === role ? ROLE_COLORS[role] : "border-transparent text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setExpandedMember(isExpanded ? null : member.agentId)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => removeAgent(member.agentId)}
                          className="text-muted-foreground hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="px-4 pb-3 bg-secondary/20 border-t border-border/30 animate-fade-in">
                          <div className="pt-3 space-y-2">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Custom System Instruction</div>
                              <textarea
                                value={member.customInstruction || ""}
                                onChange={(e) => updateInstruction(member.agentId, e.target.value)}
                                rows={2}
                                placeholder={`Override instructions for ${agentDef.name}...`}
                                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/40 resize-none font-mono"
                              />
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Available Tools</div>
                              <div className="flex flex-wrap gap-1">
                                {agentDef.tools.map(t => (
                                  <span key={t} className="badge-idle px-1.5 py-0.5 rounded text-xs font-mono">{t}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Deploy */}
          {crew.members.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={deployCrewAction}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
                  deployed
                    ? "bg-green-500/10 border border-green-500/25 text-green-400"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {deployed ? (
                  <><Check className="w-4 h-4" /> Crew Deployed to Mesh</>
                ) : (
                  <><Play className="w-4 h-4" /> Deploy Crew to Nuro Mesh</>
                )}
              </button>
              <button
                onClick={() => setCrew({ name: "New Crew", objective: "", members: [], executionMode: "hierarchical", maxRounds: 5 })}
                className="px-4 py-2.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                Clear
              </button>
            </div>
          )}

          {/* Crew summary card */}
          {crew.members.length > 0 && (
            <div className="inca-panel-active p-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Crew Summary</div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Crew Size</div>
                  <div className="text-lg font-display font-bold text-foreground">{crew.members.length}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Execution</div>
                  <div className="text-sm font-medium text-foreground capitalize">{crew.executionMode}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-0.5">Max Rounds</div>
                  <div className="text-lg font-display font-bold text-foreground">{crew.maxRounds}</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {crew.members.map(m => {
                  const a = DOMAIN_AGENTS.find(ag => ag.id === m.agentId)!;
                  return a ? (
                    <span key={m.agentId} className={cn("px-2 py-0.5 rounded-full text-xs border", ROLE_COLORS[m.role])}>
                      {a.name} · {m.role}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
