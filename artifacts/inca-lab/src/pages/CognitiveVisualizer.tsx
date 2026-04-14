import { useState, useEffect, useRef } from "react";
import { cn } from "../lib/utils";
import {
  Brain, Pause, Play, SkipForward, AlertTriangle, ChevronDown, ChevronUp,
  Zap, Eye, Database, ArrowRight, GitBranch, RefreshCw, Target, Cpu, MessageSquare
} from "lucide-react";

interface ThoughtNode {
  id: string;
  label: string;
  confidence: number;
  depth: number;
  parentId: string | null;
  selected: boolean;
  pruned: boolean;
  children: string[];
}

interface CognitiveState {
  agentId: string;
  agentName: string;
  routingMode: "System1" | "System2";
  routingConfidence: number;
  routingReason: string;
  thoughtNodes: ThoughtNode[];
  metacognition: {
    overallConfidence: number;
    uncertaintyAreas: string[];
    selfCorrectionCount: number;
    knowledgeGaps: string[];
  };
  intentStack: Array<{ intent: string; priority: number; status: "active" | "pending" | "completed" }>;
  memoryRetrievals: Array<{ content: string; type: string; relevance: number; timestamp: string }>;
  selfEvolution: Array<{ event: string; impact: string; timestamp: string }>;
}

const COGNITIVE_STATES: Record<string, CognitiveState> = {
  alloy: {
    agentId: "alloy", agentName: "Alloy",
    routingMode: "System2", routingConfidence: 0.82, routingReason: "Complex multi-agent routing requires deliberate reasoning. Multiple conflicting signals detected across domains.",
    thoughtNodes: [
      { id: "t1", label: "Analyze user intent", confidence: 0.98, depth: 0, parentId: null, selected: false, pruned: false, children: ["t2", "t3"] },
      { id: "t2", label: "Route to maritime domain", confidence: 0.74, depth: 1, parentId: "t1", selected: false, pruned: false, children: ["t4", "t5"] },
      { id: "t3", label: "Route to security domain", confidence: 0.61, depth: 1, parentId: "t1", selected: false, pruned: true, children: [] },
      { id: "t4", label: "Assign Helmsman as lead", confidence: 0.91, depth: 2, parentId: "t2", selected: true, pruned: false, children: [] },
      { id: "t5", label: "Assign Sentinel as validator", confidence: 0.87, depth: 2, parentId: "t2", selected: false, pruned: false, children: ["t6"] },
      { id: "t6", label: "Add Beacon for analytics", confidence: 0.79, depth: 3, parentId: "t5", selected: false, pruned: false, children: [] },
    ],
    metacognition: {
      overallConfidence: 0.84,
      uncertaintyAreas: ["Sanctions scope ambiguity", "Counterparty identity resolution"],
      selfCorrectionCount: 3,
      knowledgeGaps: ["Iranian secondary sanctions updated 2026-Q1"],
    },
    intentStack: [
      { intent: "Investigate MV Aurora Star ownership chain", priority: 1, status: "active" },
      { intent: "Screen against OFAC SDN list", priority: 2, status: "pending" },
      { intent: "Generate risk report for Forge portal", priority: 3, status: "pending" },
    ],
    memoryRetrievals: [
      { content: "SZL Holdings org structure", type: "fact", relevance: 0.95, timestamp: "10:42:01" },
      { content: "Cross-agent routing policy v3", type: "instruction", relevance: 0.92, timestamp: "10:42:03" },
      { content: "MV Aurora Star — prior AIS gap analysis (March 2026)", type: "context", relevance: 0.88, timestamp: "10:42:05" },
    ],
    selfEvolution: [
      { event: "Routing heuristic updated after Helmsman precision drop", impact: "Maritime routing accuracy +3.2%", timestamp: "2026-04-12 14:30" },
      { event: "New pattern: dual-agent validation for CRITICAL flags", impact: "False positive rate -1.8%", timestamp: "2026-04-10 09:15" },
    ],
  },
  sentinel: {
    agentId: "sentinel", agentName: "Sentinel",
    routingMode: "System1", routingConfidence: 0.97, routingReason: "High-confidence threat pattern match. OFAC secondary connection is a well-known pattern. No deliberation needed.",
    thoughtNodes: [
      { id: "s1", label: "Process entity list from Helmsman", confidence: 0.99, depth: 0, parentId: null, selected: false, pruned: false, children: ["s2"] },
      { id: "s2", label: "Screen against SDN list", confidence: 0.98, depth: 1, parentId: "s1", selected: false, pruned: false, children: ["s3", "s4"] },
      { id: "s3", label: "Direct SDN match", confidence: 0.22, depth: 2, parentId: "s2", selected: false, pruned: true, children: [] },
      { id: "s4", label: "Secondary connection via shipping agent", confidence: 0.94, depth: 2, parentId: "s2", selected: true, pruned: false, children: ["s5"] },
      { id: "s5", label: "Compute composite risk score: 0.87", confidence: 0.96, depth: 3, parentId: "s4", selected: false, pruned: false, children: [] },
    ],
    metacognition: {
      overallConfidence: 0.97,
      uncertaintyAreas: ["Shipping agent entity resolution"],
      selfCorrectionCount: 0,
      knowledgeGaps: [],
    },
    intentStack: [
      { intent: "Validate Helmsman AIS findings", priority: 1, status: "completed" },
      { intent: "OFAC secondary screening", priority: 2, status: "active" },
      { intent: "Compute CRITICAL risk score", priority: 3, status: "pending" },
    ],
    memoryRetrievals: [
      { content: "OFAC SDN — March 2026 additions", type: "fact", relevance: 0.99, timestamp: "10:43:12" },
      { content: "Shipping agent secondary connection pattern", type: "instruction", relevance: 0.94, timestamp: "10:43:14" },
    ],
    selfEvolution: [
      { event: "Secondary connection scoring weight increased", impact: "OFAC recall improved 2.1%", timestamp: "2026-04-08 11:00" },
    ],
  },
};

function TreeNode({ node, allNodes, depth = 0 }: { node: ThoughtNode; allNodes: ThoughtNode[]; depth?: number }) {
  const childNodes = node.children.map(id => allNodes.find(n => n.id === id)).filter(Boolean) as ThoughtNode[];
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="ml-4">
      <div className={cn("flex items-center gap-2 py-1.5 px-2 rounded-md group hover:bg-secondary/30 transition-colors cursor-pointer", node.selected && "bg-primary/8 border border-primary/20", node.pruned && "opacity-40")} onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {childNodes.length > 0 ? (
            expanded ? <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" /> : <ChevronUp className="w-3 h-3 text-muted-foreground flex-shrink-0" />
          ) : <div className="w-3" />}
          <div className={cn("w-2 h-2 rounded-full flex-shrink-0", node.pruned ? "bg-red-500/40" : node.selected ? "bg-primary" : "bg-border")} />
          <span className={cn("text-xs text-foreground flex-1 min-w-0 truncate", node.pruned && "line-through text-muted-foreground", node.selected && "font-medium text-primary")}>{node.label}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {node.pruned && <span className="text-xs text-red-400 font-mono">pruned</span>}
          {node.selected && <span className="text-xs text-primary font-mono">selected</span>}
          <div className="flex items-center gap-1">
            <div className="h-1 w-12 bg-secondary rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-primary/60" style={{ width: `${node.confidence * 100}%` }} />
            </div>
            <span className="text-xs font-mono text-muted-foreground w-8">{(node.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
      {expanded && childNodes.map(child => <TreeNode key={child.id} node={child} allNodes={allNodes} depth={depth + 1} />)}
    </div>
  );
}

export function CognitiveVisualizer() {
  const [selectedAgent, setSelectedAgent] = useState<string>("alloy");
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0);
  const [overriddenIntent, setOverriddenIntent] = useState<string | null>(null);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => setTick(t => t + 1), 2000);
    return () => clearInterval(interval);
  }, [paused]);

  const state = COGNITIVE_STATES[selectedAgent]!;
  const confidence = state.metacognition.overallConfidence;
  const rootNodes = state.thoughtNodes.filter(n => n.parentId === null);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">Cognitive Architecture Visualizer</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          Real-time agent cognition: System 1/2 routing, Tree of Thought, metacognition, intent stacks, and memory.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-5">
        {Object.values(COGNITIVE_STATES).map(s => (
          <button
            key={s.agentId}
            onClick={() => setSelectedAgent(s.agentId)}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all", selectedAgent === s.agentId ? "bg-primary/15 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border hover:text-foreground")}
          >
            {s.agentName}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setPaused(!paused)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all", paused ? "bg-amber-500/10 border-amber-500/25 text-amber-400" : "bg-secondary border-border text-muted-foreground hover:text-foreground")}
          >
            {paused ? <><Play className="w-3 h-3" /> Resume</> : <><Pause className="w-3 h-3" /> Pause</>}
          </button>
          <div className={cn("flex items-center gap-1.5 text-xs font-mono", paused ? "text-amber-400" : "text-emerald-400")}>
            <div className={cn("w-1.5 h-1.5 rounded-full", paused ? "bg-amber-400" : "bg-emerald-400 animate-pulse")} />
            {paused ? "PAUSED" : "LIVE"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="space-y-4">
          {/* System 1/2 Routing */}
          <div className="inca-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-primary" />
              <div className="text-sm font-medium text-foreground">Reasoning Mode</div>
            </div>
            <div className="flex gap-2 mb-3">
              <div className={cn("flex-1 py-2 px-3 rounded-lg border text-center text-xs font-bold transition-all", state.routingMode === "System1" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-secondary border-border text-muted-foreground")}>
                System 1
                <div className="text-xs font-normal mt-0.5 text-muted-foreground">Fast / Intuitive</div>
              </div>
              <div className={cn("flex-1 py-2 px-3 rounded-lg border text-center text-xs font-bold transition-all", state.routingMode === "System2" ? "bg-blue-500/15 border-blue-500/30 text-blue-400" : "bg-secondary border-border text-muted-foreground")}>
                System 2
                <div className="text-xs font-normal mt-0.5 text-muted-foreground">Deliberate / Slow</div>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground">Routing confidence:</span>
              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${state.routingConfidence * 100}%` }} />
              </div>
              <span className="text-xs font-mono text-foreground">{(state.routingConfidence * 100).toFixed(0)}%</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{state.routingReason}</p>
          </div>

          {/* Metacognition */}
          <div className="inca-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-primary" />
              <div className="text-sm font-medium text-foreground">Metacognition</div>
            </div>
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Overall Confidence</span>
                <span className={cn("font-mono font-bold", confidence >= 0.85 ? "text-emerald-400" : confidence >= 0.6 ? "text-amber-400" : "text-red-400")}>
                  {(confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${confidence * 100}%`, background: confidence >= 0.85 ? "#22c55e" : confidence >= 0.6 ? "#f59e0b" : "#ef4444" }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground font-medium mb-1.5">Uncertainty Areas</div>
                {state.metacognition.uncertaintyAreas.map(a => (
                  <div key={a} className="flex items-center gap-1.5 py-0.5">
                    <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    <span className="text-xs text-foreground">{a}</span>
                  </div>
                ))}
                {state.metacognition.uncertaintyAreas.length === 0 && <div className="text-xs text-muted-foreground">No uncertainty areas</div>}
              </div>
              {state.metacognition.knowledgeGaps.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground font-medium mb-1.5">Knowledge Gaps</div>
                  {state.metacognition.knowledgeGaps.map(g => (
                    <div key={g} className="flex items-center gap-1.5 py-0.5">
                      <Eye className="w-3 h-3 text-red-400 flex-shrink-0" />
                      <span className="text-xs text-foreground">{g}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between text-xs pt-1 border-t border-border/40">
                <span className="text-muted-foreground">Self-corrections</span>
                <span className="font-mono text-foreground">{state.metacognition.selfCorrectionCount}</span>
              </div>
            </div>
          </div>

          {/* Self-Evolution */}
          <div className="inca-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw className="w-4 h-4 text-primary" />
              <div className="text-sm font-medium text-foreground">Self-Evolution Log</div>
            </div>
            <div className="space-y-2">
              {state.selfEvolution.map((ev, i) => (
                <div key={i} className="py-2 border-b border-border/30 last:border-0">
                  <div className="text-xs font-medium text-foreground mb-0.5">{ev.event}</div>
                  <div className="text-xs text-emerald-400 mb-0.5">{ev.impact}</div>
                  <div className="text-xs text-muted-foreground font-mono">{ev.timestamp}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Tree of Thought */}
        <div className="space-y-4">
          <div className="inca-panel overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-primary" />
              <div className="text-sm font-medium text-foreground">Tree of Thought</div>
              <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> Selected</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500/40" /> Pruned</div>
              </div>
            </div>
            <div className="p-4 overflow-auto max-h-80">
              {rootNodes.map(node => (
                <TreeNode key={node.id} node={node} allNodes={state.thoughtNodes} />
              ))}
            </div>
          </div>

          {/* Intent Stack */}
          <div className="inca-panel overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <div className="text-sm font-medium text-foreground">Active Intent Stack</div>
            </div>
            <div className="divide-y divide-border/30">
              {state.intentStack.map((intent, i) => (
                <div key={i} className="px-4 py-3 flex items-center gap-3">
                  <div className={cn("w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0", intent.status === "active" ? "bg-primary/10 text-primary" : intent.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-secondary text-muted-foreground")}>
                    {intent.priority}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground">{intent.intent}</div>
                  </div>
                  <span className={cn("text-xs px-1.5 py-0.5 rounded border capitalize", intent.status === "active" ? "badge-running" : intent.status === "completed" ? "badge-idle" : "badge-idle")}>
                    {intent.status}
                  </span>
                  {intent.status === "active" && (
                    <button
                      onClick={() => setOverriddenIntent(intent.intent)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      title="Override this intent"
                    >
                      Override
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Memory + Controls */}
        <div className="space-y-4">
          {/* Memory Retrievals */}
          <div className="inca-panel overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <div className="text-sm font-medium text-foreground">Memory Retrievals</div>
              <div className={cn("ml-auto w-2 h-2 rounded-full", paused ? "bg-amber-400" : "bg-emerald-400 animate-pulse")} />
            </div>
            <div className="divide-y divide-border/30">
              {state.memoryRetrievals.map((mem, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-xs px-1.5 py-0.5 rounded border capitalize",
                      mem.type === "fact" ? "bg-blue-500/10 border-blue-500/25 text-blue-400" :
                      mem.type === "instruction" ? "bg-violet-500/10 border-violet-500/25 text-violet-400" :
                      "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                    )}>{mem.type}</span>
                    <span className="text-xs font-mono text-muted-foreground">{mem.timestamp}</span>
                  </div>
                  <div className="text-xs text-foreground mb-1.5">{mem.content}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Relevance:</span>
                    <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${mem.relevance * 100}%` }} />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{(mem.relevance * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Override panel */}
          <div className="inca-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-400" />
              <div className="text-sm font-medium text-foreground">Operator Controls</div>
            </div>
            {overriddenIntent && (
              <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
                Override active: {overriddenIntent}
                <button onClick={() => setOverriddenIntent(null)} className="ml-2 underline">Clear</button>
              </div>
            )}
            <div className="space-y-2">
              <button
                onClick={() => setPaused(true)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/25 text-amber-400 rounded-lg text-xs font-medium hover:bg-amber-500/15 transition-colors"
              >
                <Pause className="w-3.5 h-3.5" /> Pause Reasoning
              </button>
              <button
                onClick={() => setPaused(false)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/15 transition-colors"
              >
                <Play className="w-3.5 h-3.5" /> Resume Reasoning
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 bg-secondary border border-border text-muted-foreground rounded-lg text-xs font-medium hover:text-foreground transition-colors">
                <SkipForward className="w-3.5 h-3.5" /> Step Forward
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/15 transition-colors">
                <MessageSquare className="w-3.5 h-3.5" /> Inject Override Prompt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
