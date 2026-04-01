import { useState, useEffect } from "react";
import { Activity, Brain, Cpu, Globe, Shield, Zap, ChevronRight, Circle, Radio, TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";
import { Link } from "wouter";

const ECOSYSTEM_APPS = [
  { id: "vessels", name: "Vessels", role: "Maritime Intelligence", agent: "Maritime Analyst", icon: Globe, color: "text-cyan-400", bg: "bg-cyan-400/10", borderColor: "border-cyan-400/20" },
  { id: "msp", name: "Aegis Operations", role: "Managed Services Command", agent: "IT Sentinel", icon: Cpu, color: "text-red-400", bg: "bg-red-400/10", borderColor: "border-red-400/20" },
  { id: "terra", name: "Terra", role: "Business Telemetry Intel", agent: "Deal Scout", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-400/10", borderColor: "border-emerald-400/20" },
  { id: "dreamscape", name: "Alloy Predict", role: "Predictive Intelligence", agent: "Alloy Predictor", icon: Zap, color: "text-violet-400", bg: "bg-violet-400/10", borderColor: "border-violet-400/20" },
  { id: "carlota-jo", name: "Carlota Jo", role: "Advisory Intelligence", agent: "Advisory Agent", icon: Brain, color: "text-pink-400", bg: "bg-pink-400/10", borderColor: "border-pink-400/20" },
  { id: "firestorm", name: "Firestorm", role: "Immune System", agent: "Sacsayhuamán Shield", icon: Shield, color: "text-orange-400", bg: "bg-orange-400/10", borderColor: "border-orange-400/20" },
  { id: "lyte", name: "Lyte", role: "Nervous System", agent: "Qhapaq Ñan Router", icon: Activity, color: "text-amber-400", bg: "bg-amber-400/10", borderColor: "border-amber-400/20" },
  { id: "szl-holdings", name: "SZL Holdings", role: "Portfolio Intelligence", agent: "Portfolio Analyst", icon: TrendingUp, color: "text-indigo-400", bg: "bg-indigo-400/10", borderColor: "border-indigo-400/20" },
  { id: "stephen", name: "Stephen", role: "Brand Intelligence", agent: "Brand Monitor", icon: Radio, color: "text-rose-400", bg: "bg-rose-400/10", borderColor: "border-rose-400/20" },
];

const AGENT_STATUSES = ["active", "active", "active", "active", "active", "monitoring", "processing", "standby", "monitoring"] as const;
const AGENT_TASKS = [
  "Tracking vessel anomalies in Pacific trade route",
  "Auto-triaging 3 critical tickets, predicting outage window",
  "Surfacing 2 off-market opportunities in Miami Beach",
  "Modeling 3 risk scenarios and scoring confidence distributions",
  "Preparing Q2 client briefing for Acme Portfolio",
  "Scanning 847 agent actions through policy engine",
  "Routing 1,243 intelligence requests across ecosystem",
  "Monitoring portfolio health — 12 apps, 6 Lenses",
  "Tracking 28 brand mentions, flagging 1 reputation risk",
];

const SYSTEM_STATES: ("inti" | "mama-quilla")[] = [
  "inti", "mama-quilla", "inti", "inti", "mama-quilla", "inti", "mama-quilla", "mama-quilla", "inti",
];

interface AgentNode {
  id: string;
  name: string;
  role: string;
  agent: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  borderColor: string;
  status: typeof AGENT_STATUSES[number];
  task: string;
  systemState: "inti" | "mama-quilla";
  confidence: number;
  actionsToday: number;
}

const agents: AgentNode[] = ECOSYSTEM_APPS.map((app, i) => ({
  ...app,
  status: AGENT_STATUSES[i],
  task: AGENT_TASKS[i],
  systemState: SYSTEM_STATES[i],
  confidence: 78 + Math.floor(Math.random() * 18),
  actionsToday: 4 + Math.floor(Math.random() * 44),
}));

const GLOBAL_STATS = [
  { label: "Active Agents", value: "9", sub: "across ecosystem", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { label: "Actions Today", value: "1,847", sub: "total executions", color: "text-amber-400", bg: "bg-amber-400/10" },
  { label: "Avg Confidence", value: "88%", sub: "decision quality", color: "text-cyan-400", bg: "bg-cyan-400/10" },
  { label: "System 1 (Inti)", value: "6", sub: "reflexive agents", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  { label: "System 2 (Mama Q)", value: "3", sub: "deep reasoning", color: "text-indigo-400", bg: "bg-indigo-400/10" },
  { label: "Policy Checks", value: "0 blocked", sub: "all cleared today", color: "text-emerald-400", bg: "bg-emerald-400/10" },
];

function KnotString({ agents }: { agents: AgentNode[] }) {
  const width = 900;
  const height = 200;
  const centerY = height / 2;
  const spacing = width / (agents.length + 1);

  return (
    <div className="relative overflow-x-auto">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible" style={{ minWidth: 600 }}>
        <defs>
          <linearGradient id="stringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d97706" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#d97706" stopOpacity="0.2" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Main quipu string */}
        <path
          d={`M 0 ${centerY} Q ${width / 4} ${centerY - 20} ${width / 2} ${centerY} Q ${width * 3 / 4} ${centerY + 20} ${width} ${centerY}`}
          fill="none"
          stroke="url(#stringGrad)"
          strokeWidth="2"
        />

        {/* Agent knots */}
        {agents.map((agent, i) => {
          const x = spacing * (i + 1);
          const isActive = agent.status === "active";
          const knotY = centerY;
          const threadY = knotY + 50;

          return (
            <g key={agent.id}>
              {/* Thread hanging down */}
              <line x1={x} y1={knotY + 8} x2={x} y2={threadY}
                stroke={isActive ? "#f59e0b" : "#475569"} strokeWidth="1.5"
                strokeDasharray={agent.status === "standby" ? "4 3" : "none"} />

              {/* Knot circle */}
              <circle cx={x} cy={knotY} r={isActive ? 10 : 7}
                fill={isActive ? "#d97706" : "#334155"} opacity="0.9"
                filter={isActive ? "url(#glow)" : "none"} />

              {/* Pulse ring for active */}
              {isActive && (
                <circle cx={x} cy={knotY} r="14" fill="none"
                  stroke="#f59e0b" strokeWidth="1" opacity="0.3">
                  <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Agent label */}
              <text x={x} y={threadY + 16} textAnchor="middle" fontSize="9"
                fill={isActive ? "#fbbf24" : "#64748b"} fontFamily="monospace">
                {agent.id.toUpperCase()}
              </text>

              {/* System state indicator */}
              <text x={x} y={knotY + 3} textAnchor="middle" fontSize="6"
                fill="white" fontFamily="monospace">
                {agent.systemState === "inti" ? "☀" : "◑"}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function AgentCard({ agent }: { agent: AgentNode }) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (agent.status !== "active") return;
    const t = setInterval(() => setPulse(p => !p), 2000 + Math.random() * 1000);
    return () => clearInterval(t);
  }, [agent.status]);

  const statusDot = agent.status === "active" ? "bg-emerald-400 animate-pulse" :
    agent.status === "monitoring" ? "bg-amber-400" :
    agent.status === "processing" ? "bg-blue-400 animate-pulse" :
    "bg-slate-500";

  return (
    <div className={cn(
      "bg-card/60 backdrop-blur-sm border rounded-xl p-4 transition-all hover:scale-[1.01] hover:shadow-lg",
      agent.borderColor,
      pulse && agent.status === "active" ? "shadow-md" : ""
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", agent.bg)}>
            <agent.icon className={cn("w-4 h-4", agent.color)} />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">{agent.name}</p>
            <p className="text-[10px] text-muted-foreground font-mono">{agent.role}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            <span className={cn("w-2 h-2 rounded-full", statusDot)} />
            <span className={cn("text-[10px] font-mono capitalize", {
              "text-emerald-400": agent.status === "active",
              "text-amber-400": agent.status === "monitoring",
              "text-blue-400": agent.status === "processing",
              "text-slate-400": agent.status === "standby",
            })}>{agent.status}</span>
          </div>
          <span className={cn(
            "text-[9px] px-1.5 py-0.5 rounded-full font-mono",
            agent.systemState === "inti"
              ? "bg-yellow-400/10 text-yellow-400"
              : "bg-indigo-400/10 text-indigo-400"
          )}>
            {agent.systemState === "inti" ? "☀ Inti" : "◑ Mama Q"}
          </span>
        </div>
      </div>

      <p className="text-[10px] font-semibold text-muted-foreground mb-2">{agent.agent}</p>
      <p className="text-[10px] text-muted-foreground/70 line-clamp-2 mb-3 leading-relaxed">{agent.task}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div className="h-1 w-16 bg-border rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full", agent.color.replace("text-", "bg-"))}
              style={{ width: `${agent.confidence}%` }} />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">{agent.confidence}%</span>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">{agent.actionsToday} acts</span>
      </div>
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
      <span className="text-emerald-400 font-semibold text-[10px] uppercase tracking-wider">Quipu Engine Active</span>
      <span className="text-border">·</span>
      <span>{time.toLocaleTimeString("en-US", { hour12: false })}</span>
    </div>
  );
}

export default function QuipuCommand() {
  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-amber-400/15 flex items-center justify-center">
              <span className="text-amber-400 text-lg">𝕼</span>
            </div>
            <h1 className="text-xl font-display font-bold text-foreground tracking-tight">Quipu Command</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-400/10 text-amber-400 border border-amber-400/20">
              9 agents active
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            The agentic core — each knot is an agent with a domain mission, each thread connects to the apps they serve.
            <span className="text-amber-400/60 ml-2 font-mono">Quipu Engine v2.1</span>
          </p>
        </div>
        <LiveClock />
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {GLOBAL_STATS.map((stat) => (
          <div key={stat.label} className={cn("border border-border rounded-xl p-3 text-center", stat.bg)}>
            <p className={cn("text-xl font-display font-bold", stat.color)}>{stat.value}</p>
            <p className="text-[10px] text-foreground font-medium mt-0.5">{stat.label}</p>
            <p className="text-[9px] text-muted-foreground/60 font-mono">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Quipu String Visualization */}
      <div className="bg-card/60 backdrop-blur-sm border border-amber-400/15 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
            <span className="text-amber-400">⌇</span>
            Quipu String — Agent Network Topology
          </h3>
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              Active knot
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
              Standby
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-yellow-400">☀</span>
              Inti (System 1)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-indigo-400">◑</span>
              Mama Q (System 2)
            </span>
          </div>
        </div>
        <KnotString agents={agents} />
        <p className="text-[10px] text-muted-foreground/50 font-mono mt-2 text-center">
          Each knot represents an active domain agent. Threads connect agents to their serving apps. Gold = active, grey = standby.
        </p>
      </div>

      {/* Agent Grid */}
      <div>
        <h3 className="text-sm font-display font-semibold text-foreground mb-3 flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-primary" />
          Domain Agents — Live Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>

      {/* System 1 / System 2 summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border border-yellow-400/20 rounded-xl p-5">
          <h4 className="text-sm font-display font-semibold text-yellow-400 flex items-center gap-2 mb-3">
            <span className="text-xl">☀</span>
            Inti — System 1 (Reflexive)
          </h4>
          <p className="text-xs text-muted-foreground mb-3">Fast, instinctive actions triggered in real-time. No deep reasoning required.</p>
          <div className="space-y-2">
            {agents.filter(a => a.systemState === "inti").map(a => (
              <div key={a.id} className="flex items-center gap-2 text-[11px]">
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", a.status === "active" ? "bg-emerald-400 animate-pulse" : "bg-slate-500")} />
                <span className="text-foreground font-medium">{a.agent}</span>
                <span className="text-muted-foreground truncate">{a.task.split(",")[0]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500/5 to-violet-500/5 border border-indigo-400/20 rounded-xl p-5">
          <h4 className="text-sm font-display font-semibold text-indigo-400 flex items-center gap-2 mb-3">
            <span className="text-xl">◑</span>
            Mama Quilla — System 2 (Deep Reasoning)
          </h4>
          <p className="text-xs text-muted-foreground mb-3">Deliberate, analytical reasoning for trend analysis, strategy, and scenario modeling.</p>
          <div className="space-y-2">
            {agents.filter(a => a.systemState === "mama-quilla").map(a => (
              <div key={a.id} className="flex items-center gap-2 text-[11px]">
                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", a.status === "active" ? "bg-indigo-400 animate-pulse" : "bg-slate-500")} />
                <span className="text-foreground font-medium">{a.agent}</span>
                <span className="text-muted-foreground truncate">{a.task.split(",")[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3">
        {[
          { href: "/agent-spawner", label: "Spawn New Agent" },
          { href: "/chasqui-relay", label: "Chasqui Relay Console" },
          { href: "/dual-mind", label: "Dual-Mind Monitor" },
          { href: "/willaq-umu", label: "Willaq Umu Oracle" },
        ].map(link => (
          <Link key={link.href} href={link.href}>
            <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all cursor-pointer">
              {link.label}
              <ChevronRight className="w-3 h-3" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
