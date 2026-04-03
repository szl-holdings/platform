import { useState } from "react";
import { Plus, Brain, Globe, Shield, Cpu, Zap, TrendingUp, Activity, Radio, ChevronRight, CheckCircle2, AlertCircle, Sparkles, Settings } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";

const DOMAIN_TEMPLATES = [
  {
    id: "maritime", name: "Maritime Analyst", icon: Globe, color: "text-cyan-400", bg: "bg-cyan-400/10",
    description: "Tracks fleet anomalies, vessel behavior patterns, and predicts maritime disruptions.",
    defaultInstruction: "Monitor vessel AIS data for anomalous behavior, predict port congestion, and surface dark vessel activity in monitored regions.",
    domain: "Vessels", systemType: "inti" as const,
    capabilities: ["AIS signal analysis", "Port congestion prediction", "Dark vessel detection", "Weather correlation"],
  },
  {
    id: "it-ops", name: "IT Sentinel", icon: Cpu, color: "text-blue-400", bg: "bg-blue-400/10",
    description: "Auto-triages IT tickets, predicts outages, and orchestrates remediation playbooks.",
    defaultInstruction: "Monitor ticket queue for patterns, predict infrastructure failures 4 hours ahead, auto-triage P1 incidents.",
    domain: "Aegis Operations", systemType: "mama-quilla" as const,
    capabilities: ["Ticket auto-triage", "Outage prediction", "Playbook orchestration", "SLA tracking"],
  },
  {
    id: "deal-scout", name: "Deal Scout", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-400/10",
    description: "Surfaces investment opportunities, predicts market shifts, and scores properties.",
    defaultInstruction: "Scan MLS, off-market signals, and economic indicators to surface high-yield opportunities in target markets.",
    domain: "Terra", systemType: "mama-quilla" as const,
    capabilities: ["Off-market opportunity detection", "Market shift prediction", "Yield scoring", "Comparable analysis"],
  },
  {
    id: "creative-dir", name: "Alloy Predictor", icon: Zap, color: "text-violet-400", bg: "bg-violet-400/10",
    description: "Surfaces prediction scenarios, models confidence distributions, and generates forecast briefs via Alloy's predictive intelligence engine.",
    defaultInstruction: "Analyze signal data, model forward-looking scenarios, and generate confidence-weighted recommendations based on Alloy's predictive models.",
    domain: "Alloy Predict", systemType: "inti" as const,
    capabilities: ["Scenario modeling", "Confidence scoring", "Risk analysis", "Opportunity surfacing"],
  },
  {
    id: "advisory", name: "Advisory Intelligence", icon: Brain, color: "text-pink-400", bg: "bg-pink-400/10",
    description: "Prepares client briefings, monitors competitive landscape, and surfaces advisory insights.",
    defaultInstruction: "Monitor client portfolio performance, prepare pre-meeting intelligence briefings, and track competitive movements.",
    domain: "Carlota Jo", systemType: "mama-quilla" as const,
    capabilities: ["Client briefing prep", "Competitive monitoring", "Portfolio tracking", "Meeting intelligence"],
  },
  {
    id: "brand-monitor", name: "Brand Monitor", icon: Radio, color: "text-rose-400", bg: "bg-rose-400/10",
    description: "Tracks brand reputation, surfaces PR opportunities, and monitors thought leadership impact.",
    defaultInstruction: "Monitor social, news, and industry forums for brand mentions, reputation risks, and speaking opportunities.",
    domain: "Stephen", systemType: "inti" as const,
    capabilities: ["Reputation monitoring", "Opportunity surfacing", "Sentiment tracking", "Coverage alerts"],
  },
  {
    id: "security-sentinel", name: "Security Sentinel", icon: Shield, color: "text-orange-400", bg: "bg-orange-400/10",
    description: "Enforces agent security policies, detects threats, and orchestrates immune response.",
    defaultInstruction: "Monitor all agent actions for policy violations, detect anomalous AI behavior, enforce Sacsayhuamán Shield protocols.",
    domain: "Firestorm", systemType: "inti" as const,
    capabilities: ["Policy enforcement", "Anomaly detection", "Action auditing", "Threat response"],
  },
  {
    id: "portfolio", name: "Portfolio Analyst", icon: Activity, color: "text-indigo-400", bg: "bg-indigo-400/10",
    description: "Monitors ecosystem health across all 12 apps, surfaces investor insights, and tracks portfolio KPIs.",
    defaultInstruction: "Aggregate 6 Lenses scores across portfolio, detect cross-app anomalies, and generate investor-ready health summaries.",
    domain: "SZL Holdings", systemType: "mama-quilla" as const,
    capabilities: ["Cross-app aggregation", "6 Lenses scoring", "Investor reporting", "Health monitoring"],
  },
];

const LIVE_AGENTS = [
  { name: "Maritime Analyst", domain: "Vessels", status: "active", uptime: "14d 6h", actions: 1240, lastAction: "2m ago" },
  { name: "IT Sentinel", domain: "Aegis Operations", status: "active", uptime: "7d 2h", actions: 3847, lastAction: "30s ago" },
  { name: "Deal Scout", domain: "Terra", status: "active", uptime: "21d 0h", actions: 892, lastAction: "5m ago" },
  { name: "Alloy Predictor", domain: "Alloy Predict", status: "active", uptime: "3d 18h", actions: 445, lastAction: "8m ago" },
  { name: "Advisory Agent", domain: "Carlota Jo", status: "monitoring", uptime: "10d 4h", actions: 312, lastAction: "1h ago" },
  { name: "Security Sentinel", domain: "Firestorm", status: "active", uptime: "30d 0h", actions: 7234, lastAction: "1s ago" },
  { name: "Qhapaq Ñan Router", domain: "Lyte", status: "active", uptime: "30d 0h", actions: 52843, lastAction: "1s ago" },
  { name: "Portfolio Analyst", domain: "SZL Holdings", status: "monitoring", uptime: "14d 12h", actions: 2143, lastAction: "15m ago" },
  { name: "Brand Monitor", domain: "Stephen", status: "monitoring", uptime: "5d 8h", actions: 187, lastAction: "45m ago" },
];

export default function AgentSpawner() {
  const [selected, setSelected] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [spawning, setSpawning] = useState(false);
  const [spawned, setSpawned] = useState<string | null>(null);

  const selectedTemplate = DOMAIN_TEMPLATES.find(t => t.id === selected);

  const handleSelect = (id: string) => {
    setSelected(id);
    const tmpl = DOMAIN_TEMPLATES.find(t => t.id === id);
    if (tmpl) setInstruction(tmpl.defaultInstruction);
    setSpawned(null);
  };

  const handleSpawn = () => {
    if (!selected) return;
    setSpawning(true);
    setTimeout(() => {
      setSpawning(false);
      setSpawned(selected);
    }, 2000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px]">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <Plus className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-xl font-display font-bold text-foreground tracking-tight">Agent Spawner</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Create, configure, and deploy domain-specific intelligence agents across the SZL ecosystem using natural language instructions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template selector */}
        <div className="lg:col-span-1">
          <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Domain Templates</h3>
          <div className="space-y-2">
            {DOMAIN_TEMPLATES.map(tmpl => (
              <button key={tmpl.id} onClick={() => handleSelect(tmpl.id)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all",
                  selected === tmpl.id
                    ? "border-primary/40 bg-primary/8"
                    : "border-border hover:border-primary/20 bg-card/40"
                )}>
                <div className="flex items-center gap-2.5">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", tmpl.bg)}>
                    <tmpl.icon className={cn("w-3.5 h-3.5", tmpl.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{tmpl.name}</p>
                    <p className="text-[10px] text-muted-foreground">{tmpl.domain}</p>
                  </div>
                  {selected === tmpl.id && <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Configuration panel */}
        <div className="lg:col-span-2 space-y-4">
          {selectedTemplate ? (
            <>
              <div className="bg-card/60 border border-border rounded-xl p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", selectedTemplate.bg)}>
                    <selectedTemplate.icon className={cn("w-5 h-5", selectedTemplate.color)} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground">{selectedTemplate.name}</h3>
                    <p className="text-xs text-muted-foreground">{selectedTemplate.description}</p>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-mono",
                    selectedTemplate.systemType === "inti"
                      ? "bg-yellow-400/10 text-yellow-400"
                      : "bg-indigo-400/10 text-indigo-400"
                  )}>
                    {selectedTemplate.systemType === "inti" ? "☀ System 1 (Inti)" : "◑ System 2 (Mama Q)"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {selectedTemplate.capabilities.map(cap => (
                    <span key={cap} className="px-2 py-0.5 rounded text-[10px] font-mono bg-muted/40 text-muted-foreground border border-border/50">
                      {cap}
                    </span>
                  ))}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Natural Language Instruction
                    </label>
                    <textarea
                      value={instruction}
                      onChange={e => setInstruction(e.target.value)}
                      rows={4}
                      className="w-full bg-muted/20 border border-border rounded-lg px-3 py-2.5 text-xs text-foreground resize-none focus:outline-none focus:border-primary/50 font-mono"
                      placeholder="Describe what this agent should do..."
                    />
                    <p className="text-[10px] text-muted-foreground/50 mt-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      The Quipu Engine interprets this instruction and configures the agent's mission parameters.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1.5">Target Domain</label>
                      <div className="bg-muted/20 border border-border rounded-lg px-3 py-2 text-xs text-foreground font-mono">
                        {selectedTemplate.domain}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-1.5">System Mode</label>
                      <div className={cn(
                        "border rounded-lg px-3 py-2 text-xs font-mono",
                        selectedTemplate.systemType === "inti"
                          ? "bg-yellow-400/10 border-yellow-400/20 text-yellow-400"
                          : "bg-indigo-400/10 border-indigo-400/20 text-indigo-400"
                      )}>
                        {selectedTemplate.systemType === "inti" ? "☀ Inti — Reflexive" : "◑ Mama Q — Deep Reasoning"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 p-3 rounded-lg bg-amber-400/5 border border-amber-400/15">
                      <p className="text-[10px] text-amber-400/80 font-mono flex items-center gap-1.5">
                        <Shield className="w-3 h-3" />
                        All agent actions will pass through Sacsayhuamán Shield policy enforcement before execution.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleSpawn}
                    disabled={spawning || !!spawned}
                    className={cn(
                      "w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2",
                      spawned
                        ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                        : spawning
                          ? "bg-primary/10 text-primary border border-primary/20 cursor-wait"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}>
                    {spawned ? (
                      <><CheckCircle2 className="w-4 h-4" /> Agent Spawned Successfully</>
                    ) : spawning ? (
                      <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Initializing Quipu Knot...</>
                    ) : (
                      <><Plus className="w-4 h-4" /> Spawn Agent</>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-card/30 border border-border/50 rounded-xl p-8 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center mb-3">
                <Brain className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Select a domain template to configure and deploy an agent</p>
              <p className="text-xs text-muted-foreground/50 mt-1">Each agent becomes a knot on the Quipu string</p>
            </div>
          )}
        </div>
      </div>

      {/* Live agents table */}
      <div className="bg-card/60 border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-primary" />
            Deployed Agents — Live
          </h3>
          <span className="text-[10px] text-muted-foreground font-mono">{LIVE_AGENTS.length} agents running</span>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/10">
              {["Agent", "Domain", "Status", "Uptime", "Actions", "Last Action"].map(col => (
                <th key={col} className="text-left px-4 py-2 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LIVE_AGENTS.map(agent => (
              <tr key={agent.name} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                <td className="px-4 py-2.5 font-medium text-foreground">{agent.name}</td>
                <td className="px-4 py-2.5">
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">{agent.domain}</span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={cn("flex items-center gap-1.5 text-[10px] font-mono",
                    agent.status === "active" ? "text-emerald-400" : "text-amber-400"
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", agent.status === "active" ? "bg-emerald-400 animate-pulse" : "bg-amber-400")} />
                    {agent.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono text-muted-foreground">{agent.uptime}</td>
                <td className="px-4 py-2.5 font-mono text-foreground">{agent.actions.toLocaleString()}</td>
                <td className="px-4 py-2.5 text-muted-foreground font-mono">{agent.lastAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
