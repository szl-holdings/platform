import { useState } from "react";
import { cn } from "../lib/utils";
import {
  GitBranch, Plus, Trash2, Play, ArrowRight, GitMerge, AlertCircle,
  Zap, CheckCircle, RefreshCw, CornerDownRight, Loader2, X, Link2
} from "lucide-react";

type NodeType = "start" | "agent-task" | "condition" | "parallel-split" | "parallel-join" | "human-gate" | "loop" | "end";

interface WorkflowNode {
  id: string;
  type: NodeType;
  agentId?: string;
  label: string;
  promptTemplate?: string;
  condition?: string;
  tools?: string[];
}

interface WorkflowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  conditional?: boolean;
}

const NODE_TYPES: { type: NodeType; label: string; icon: React.ComponentType<{className?:string; style?: React.CSSProperties}>; color: string; desc: string }[] = [
  { type: "agent-task", label: "Agent Task", icon: Zap, color: "#7c3aed", desc: "Assign a task to a domain agent" },
  { type: "condition", label: "Condition Gate", icon: GitBranch, color: "#f59e0b", desc: "Branch flow based on output" },
  { type: "parallel-split", label: "Parallel Split", icon: GitBranch, color: "#3b82f6", desc: "Fan out to parallel branches" },
  { type: "parallel-join", label: "Parallel Join", icon: GitMerge, color: "#3b82f6", desc: "Merge parallel branches" },
  { type: "human-gate", label: "Human Approval", icon: AlertCircle, color: "#f43f5e", desc: "Require human sign-off" },
  { type: "loop", label: "Loop Back", icon: RefreshCw, color: "#10b981", desc: "Conditional iteration" },
  { type: "end", label: "End", icon: CheckCircle, color: "#6b7280", desc: "Workflow terminus" },
];

const AGENTS = [
  { id: "alloy", name: "Alloy", tools: ["router", "planner", "context-manager"] },
  { id: "helmsman", name: "Helmsman", tools: ["ais-feed", "vessel-db", "sanctions-api"] },
  { id: "sentinel", name: "Sentinel", tools: ["cve-db", "threat-intel", "policy-engine"] },
  { id: "inca", name: "INCA", tools: ["huggingface-api", "arxiv-api", "semantic-scholar"] },
  { id: "muse", name: "Muse", tools: ["web-search", "content-store", "template-engine"] },
  { id: "beacon", name: "Beacon", tools: ["telemetry-db", "anomaly-engine", "kpi-store"] },
  { id: "zeus", name: "Zeus", tools: ["azure-api", "k8s-api", "terraform"] },
  { id: "compass", name: "Compass", tools: ["property-db", "market-feed", "gis-api"] },
];

const STARTER_TEMPLATES: { name: string; description: string; nodes: WorkflowNode[]; edges: WorkflowEdge[] }[] = [
  {
    name: "Investigation Pipeline",
    description: "Multi-step investigation with evidence gathering, threat assessment, and compliance check",
    nodes: [
      { id: "n1", type: "start", label: "Trigger" },
      { id: "n2", type: "agent-task", label: "Data Gather", agentId: "helmsman", tools: ["ais-feed", "vessel-db"], promptTemplate: "Gather all available data on {{target}} from AIS, vessel DB, and sanctions lists." },
      { id: "n3", type: "parallel-split", label: "Parallel Analysis" },
      { id: "n4", type: "agent-task", label: "Threat Assess", agentId: "sentinel", tools: ["cve-db", "policy-engine"], promptTemplate: "Assess threat profile based on gathered data." },
      { id: "n5", type: "agent-task", label: "Analytics", agentId: "beacon", tools: ["anomaly-engine"], promptTemplate: "Identify anomalies and patterns in the data." },
      { id: "n6", type: "parallel-join", label: "Merge Results" },
      { id: "n7", type: "condition", label: "High Risk?", condition: "risk_score > 0.75" },
      { id: "n8", type: "human-gate", label: "Human Review" },
      { id: "n9", type: "agent-task", label: "Report Gen", agentId: "muse", tools: ["template-engine", "content-store"], promptTemplate: "Generate executive investigation report." },
      { id: "n10", type: "end", label: "Complete" },
    ],
    edges: [
      { id: "e1", from: "n1", to: "n2" },
      { id: "e2", from: "n2", to: "n3" },
      { id: "e3", from: "n3", to: "n4", label: "Branch A", conditional: true },
      { id: "e4", from: "n3", to: "n5", label: "Branch B", conditional: true },
      { id: "e5", from: "n4", to: "n6" },
      { id: "e6", from: "n5", to: "n6" },
      { id: "e7", from: "n6", to: "n7" },
      { id: "e8", from: "n7", to: "n8", label: "Yes", conditional: true },
      { id: "e9", from: "n7", to: "n9", label: "No", conditional: true },
      { id: "e10", from: "n8", to: "n9" },
      { id: "e11", from: "n9", to: "n10" },
    ],
  },
  {
    name: "Compliance Review",
    description: "Automated compliance check with policy validation and escalation",
    nodes: [
      { id: "c1", type: "start", label: "Submission" },
      { id: "c2", type: "agent-task", label: "Initial Screen", agentId: "sentinel", tools: ["policy-engine"], promptTemplate: "Screen submission against compliance policies." },
      { id: "c3", type: "condition", label: "Pass Screen?", condition: "compliance_score > 0.8" },
      { id: "c4", type: "agent-task", label: "Deep Review", agentId: "sentinel", tools: ["cve-db", "policy-engine"], promptTemplate: "Conduct deep compliance analysis." },
      { id: "c5", type: "human-gate", label: "Legal Sign-off" },
      { id: "c6", type: "agent-task", label: "Approve", agentId: "alloy", tools: ["context-manager"], promptTemplate: "Issue compliance approval certificate." },
      { id: "c7", type: "end", label: "Complete" },
    ],
    edges: [
      { id: "ce1", from: "c1", to: "c2" },
      { id: "ce2", from: "c2", to: "c3" },
      { id: "ce3", from: "c3", to: "c6", label: "Pass", conditional: true },
      { id: "ce4", from: "c3", to: "c4", label: "Fail", conditional: true },
      { id: "ce5", from: "c4", to: "c5" },
      { id: "ce6", from: "c5", to: "c6" },
      { id: "ce7", from: "c6", to: "c7" },
    ],
  },
  {
    name: "Threat Assessment Chain",
    description: "Real-time threat triage with escalation and response coordination",
    nodes: [
      { id: "t1", type: "start", label: "Alert" },
      { id: "t2", type: "agent-task", label: "Triage", agentId: "sentinel", tools: ["threat-intel", "cve-db"], promptTemplate: "Triage incoming threat alert and classify severity." },
      { id: "t3", type: "condition", label: "Critical?", condition: "severity == CRITICAL" },
      { id: "t4", type: "human-gate", label: "CISO Approval" },
      { id: "t5", type: "agent-task", label: "Investigate", agentId: "sentinel", tools: ["threat-intel", "policy-engine"], promptTemplate: "Conduct full threat investigation." },
      { id: "t6", type: "agent-task", label: "Coordinate", agentId: "zeus", tools: ["azure-api", "k8s-api"], promptTemplate: "Coordinate infrastructure response." },
      { id: "t7", type: "agent-task", label: "Report", agentId: "muse", tools: ["template-engine"], promptTemplate: "Draft incident report." },
      { id: "t8", type: "end", label: "Resolved" },
    ],
    edges: [
      { id: "te1", from: "t1", to: "t2" },
      { id: "te2", from: "t2", to: "t3" },
      { id: "te3", from: "t3", to: "t4", label: "Yes", conditional: true },
      { id: "te4", from: "t3", to: "t5", label: "No", conditional: true },
      { id: "te5", from: "t4", to: "t5" },
      { id: "te6", from: "t5", to: "t6" },
      { id: "te7", from: "t6", to: "t7" },
      { id: "te8", from: "t7", to: "t8" },
    ],
  },
];

function getNodeColor(type: NodeType): string {
  return NODE_TYPES.find(n => n.type === type)?.color ?? "#6b7280";
}

function NodeIcon({ type, className, style }: { type: NodeType; className?: string; style?: React.CSSProperties }) {
  const NodeTypeDef = NODE_TYPES.find(n => n.type === type);
  if (!NodeTypeDef) return null;
  const Icon = NodeTypeDef.icon;
  return <Icon className={className} style={style} />;
}

let nodeCounter = 100;
function newNodeId() { return `node-${++nodeCounter}`; }
let edgeCounter = 100;
function newEdgeId() { return `edge-${++edgeCounter}`; }

export function WorkflowForge() {
  const [nodes, setNodes] = useState<WorkflowNode[]>([
    { id: "start", type: "start", label: "Start" },
  ]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState("New Workflow");
  const [running, setRunning] = useState(false);
  const [runComplete, setRunComplete] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);

  // Edge authoring state
  const [edgeMode, setEdgeMode] = useState(false);
  const [edgeFrom, setEdgeFrom] = useState<string | null>(null);
  const [editingEdge, setEditingEdge] = useState<string | null>(null);

  function addNode(type: NodeType) {
    const id = newNodeId();
    const label = NODE_TYPES.find(n => n.type === type)?.label ?? "Node";
    setNodes(ns => [...ns, { id, type, label, tools: [] }]);
  }

  function removeNode(id: string) {
    if (id === "start") return;
    setNodes(ns => ns.filter(n => n.id !== id));
    setEdges(es => es.filter(e => e.from !== id && e.to !== id));
    if (selectedNode === id) setSelectedNode(null);
  }

  function updateNode(id: string, patch: Partial<WorkflowNode>) {
    setNodes(ns => ns.map(n => n.id === id ? { ...n, ...patch } : n));
  }

  function toggleTool(nodeId: string, tool: string) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const current = node.tools ?? [];
    const updated = current.includes(tool) ? current.filter(t => t !== tool) : [...current, tool];
    updateNode(nodeId, { tools: updated });
  }

  function loadTemplate(t: typeof STARTER_TEMPLATES[0]) {
    setNodes(t.nodes);
    setEdges(t.edges);
    setWorkflowName(t.name);
    setSelectedNode(null);
    setEdgeMode(false);
    setEdgeFrom(null);
  }

  function handleNodeClickInEdgeMode(nodeId: string) {
    if (!edgeFrom) {
      setEdgeFrom(nodeId);
    } else if (edgeFrom === nodeId) {
      setEdgeFrom(null);
    } else {
      // Check if edge already exists
      const exists = edges.find(e => e.from === edgeFrom && e.to === nodeId);
      if (!exists) {
        const fromNode = nodes.find(n => n.id === edgeFrom);
        const conditional = fromNode?.type === "condition" || fromNode?.type === "parallel-split";
        setEdges(es => [...es, { id: newEdgeId(), from: edgeFrom, to: nodeId, conditional }]);
      }
      setEdgeFrom(null);
    }
  }

  function removeEdge(edgeId: string) {
    setEdges(es => es.filter(e => e.id !== edgeId));
    if (editingEdge === edgeId) setEditingEdge(null);
  }

  function updateEdge(edgeId: string, patch: Partial<WorkflowEdge>) {
    setEdges(es => es.map(e => e.id === edgeId ? { ...e, ...patch } : e));
  }

  async function runWorkflow() {
    setRunning(true);
    setRunComplete(false);
    const steps = nodes.filter(n => n.type !== "start" && n.type !== "end");
    for (const step of steps) {
      setActiveStep(step.id);
      await new Promise(r => setTimeout(r, 700));
    }
    setActiveStep(null);
    setRunning(false);
    setRunComplete(true);
    setTimeout(() => setRunComplete(false), 3000);
  }

  const selected = nodes.find(n => n.id === selectedNode);
  const selectedAgentDef = selected?.agentId ? AGENTS.find(a => a.id === selected.agentId) : null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-5 rounded-full bg-primary" />
          <h1 className="text-xl font-display font-semibold text-foreground">Workflow Forge</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-3.5">
          Visual graph-based multi-agent workflow designer. Build nodes, create edges, add branching logic, and deploy.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Palette + Templates */}
        <div className="lg:col-span-1 space-y-3">
          <div className="inca-panel p-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Add Nodes</div>
            <div className="space-y-1.5">
              {NODE_TYPES.map(nt => {
                const Icon = nt.icon;
                return (
                  <button
                    key={nt.type}
                    onClick={() => addNode(nt.type)}
                    title={nt.desc}
                    className="w-full text-left px-2 py-2 rounded-lg border border-border hover:border-primary/25 bg-transparent transition-all flex items-center gap-2 group"
                  >
                    <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: `${nt.color}18` }}>
                      <Icon className="w-3 h-3" style={{ color: nt.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-foreground">{nt.label}</div>
                    </div>
                    <Plus className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="inca-panel p-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">Templates</div>
            <div className="space-y-1.5">
              {STARTER_TEMPLATES.map(t => (
                <button
                  key={t.name}
                  onClick={() => loadTemplate(t)}
                  className="w-full text-left px-2 py-2 rounded-lg bg-secondary hover:bg-secondary/70 transition-colors"
                >
                  <div className="text-xs font-medium text-foreground leading-snug">{t.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="lg:col-span-3 space-y-3">
          <div className="inca-panel p-4">
            <div className="flex items-center justify-between mb-3">
              <input
                value={workflowName}
                onChange={e => setWorkflowName(e.target.value)}
                className="bg-transparent text-sm font-medium text-foreground focus:outline-none border-b border-transparent focus:border-primary/40 px-1 py-0.5"
              />
              <div className="flex gap-2">
                {/* Edge connect mode toggle */}
                <button
                  onClick={() => { setEdgeMode(!edgeMode); setEdgeFrom(null); }}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                    edgeMode
                      ? "bg-amber-500/10 border border-amber-500/25 text-amber-400"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  {edgeMode ? (edgeFrom ? `From: ${nodes.find(n => n.id === edgeFrom)?.label} — click target` : "Click source node") : "Connect"}
                </button>
                <button
                  onClick={runWorkflow}
                  disabled={running || nodes.length < 2}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    runComplete
                      ? "bg-green-500/10 border border-green-500/25 text-green-400"
                      : running
                        ? "bg-primary/50 text-primary-foreground/70 cursor-not-allowed"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : runComplete ? <CheckCircle className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {running ? "Executing..." : runComplete ? "Complete!" : "Simulate Run"}
                </button>
              </div>
            </div>

            {/* Edge mode instruction banner */}
            {edgeMode && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-400 flex items-center gap-2">
                <Link2 className="w-3.5 h-3.5 flex-shrink-0" />
                {edgeFrom
                  ? `Source: "${nodes.find(n => n.id === edgeFrom)?.label}" — now click the target node to create an edge. Click the same node again to cancel.`
                  : "Click any node to select it as the edge source."}
              </div>
            )}

            {/* Workflow node list */}
            <div className="space-y-2">
              {nodes.map((node, idx) => {
                const color = getNodeColor(node.type);
                const isActive = activeStep === node.id;
                const outEdges = edges.filter(e => e.from === node.id);
                const isEdgeFrom = edgeFrom === node.id;
                return (
                  <div key={node.id} className="animate-fade-in">
                    <button
                      onClick={() => {
                        if (edgeMode) {
                          handleNodeClickInEdgeMode(node.id);
                        } else {
                          setSelectedNode(selectedNode === node.id ? null : node.id);
                        }
                      }}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3",
                        edgeMode && isEdgeFrom
                          ? "border-amber-500/40 bg-amber-500/5"
                          : edgeMode
                            ? "border-primary/20 hover:border-primary/40 hover:bg-primary/5 cursor-crosshair"
                            : selectedNode === node.id
                              ? "border-primary/40 bg-primary/5"
                              : isActive
                                ? "border-amber-500/40 bg-amber-500/5"
                                : "border-border hover:border-primary/20"
                      )}
                    >
                      <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                        <NodeIcon type={node.type} className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-foreground">{node.label}</div>
                          {isActive && <span className="badge-warning px-1.5 py-0 rounded text-xs animate-pulse">executing</span>}
                          {isEdgeFrom && <span className="badge-warning px-1.5 py-0 rounded text-xs">source</span>}
                          {node.agentId && <span className="badge-idle px-1.5 py-0 rounded text-xs capitalize">{node.agentId}</span>}
                          {node.tools && node.tools.length > 0 && (
                            <span className="badge-staged px-1.5 py-0 rounded text-xs">{node.tools.length} tools</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">{node.type.replace(/-/g, " ")}</div>
                      </div>
                      {node.type !== "start" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeNode(node.id); }}
                          className="text-muted-foreground hover:text-red-400 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </button>

                    {/* Outbound edges */}
                    {outEdges.length > 0 && (
                      <div className="ml-10 pl-3 border-l border-border/40 space-y-1 my-1">
                        {outEdges.map((e) => {
                          const targetNode = nodes.find(n => n.id === e.to);
                          return (
                            <div key={e.id} className="flex items-center gap-1.5 py-0.5 group/edge">
                              <CornerDownRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                              {e.conditional && (
                                <button
                                  onClick={() => setEditingEdge(editingEdge === e.id ? null : e.id)}
                                  className="badge-warning px-1.5 py-0 rounded text-xs hover:bg-amber-500/20 transition-colors"
                                >
                                  {e.label || "conditional"}
                                </button>
                              )}
                              {!e.conditional && e.label && (
                                <span className="text-xs text-muted-foreground">{e.label}</span>
                              )}
                              <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                              <span className="text-xs text-muted-foreground">{targetNode?.label ?? e.to}</span>
                              <button
                                onClick={() => removeEdge(e.id)}
                                className="ml-auto opacity-0 group-hover/edge:opacity-100 transition-opacity text-muted-foreground hover:text-red-400 flex-shrink-0"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Edge editor for conditional edges */}
                    {editingEdge && outEdges.find(e => e.id === editingEdge) && (
                      <div className="ml-10 pl-3 mt-1 mb-2 animate-fade-in">
                        <div className="bg-secondary rounded-lg px-3 py-2 space-y-2">
                          <div className="text-xs text-muted-foreground font-medium">Edit Edge Label</div>
                          <input
                            value={edges.find(e => e.id === editingEdge)?.label ?? ""}
                            onChange={ev => updateEdge(editingEdge, { label: ev.target.value })}
                            placeholder="e.g. Yes / No / Branch A"
                            className="w-full bg-card border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary/40"
                          />
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!edges.find(e => e.id === editingEdge)?.conditional}
                                onChange={ev => updateEdge(editingEdge, { conditional: ev.target.checked })}
                                className="accent-primary"
                              />
                              Conditional branch
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {idx < nodes.length - 1 && outEdges.length === 0 && (
                      <div className="flex justify-center my-1">
                        <div className="w-px h-4 bg-border" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {nodes.length < 2 && (
              <div className="text-center py-6 text-xs text-muted-foreground">
                Add node types from the palette to build your workflow
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Nodes</div>
              <div className="text-xl font-display font-bold text-foreground">{nodes.length}</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Edges</div>
              <div className="text-xl font-display font-bold text-foreground">{edges.length}</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Agent Tasks</div>
              <div className="text-xl font-display font-bold text-foreground">{nodes.filter(n => n.type === "agent-task").length}</div>
            </div>
            <div className="kpi-tile p-3">
              <div className="text-xs text-muted-foreground mb-1">Gates</div>
              <div className="text-xl font-display font-bold text-foreground">{nodes.filter(n => n.type === "condition" || n.type === "human-gate").length}</div>
            </div>
          </div>
        </div>

        {/* Inspector */}
        <div className="lg:col-span-1">
          {selected ? (
            <div className="inca-panel-active p-4 animate-scale-in sticky top-4">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Node Inspector</div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Label</label>
                  <input
                    value={selected.label}
                    onChange={(e) => updateNode(selected.id, { label: e.target.value })}
                    className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/40"
                  />
                </div>

                {selected.type === "agent-task" && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Assigned Agent</label>
                    <select
                      value={selected.agentId || ""}
                      onChange={(e) => {
                        const agentDef = AGENTS.find(a => a.id === e.target.value);
                        updateNode(selected.id, { agentId: e.target.value, tools: agentDef?.tools ?? [] });
                      }}
                      className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/40"
                    >
                      <option value="">Select agent...</option>
                      {AGENTS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                )}

                {selected.type === "agent-task" && selectedAgentDef && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Tool Selection</label>
                    <div className="space-y-1">
                      {selectedAgentDef.tools.map(tool => {
                        const isSelected = (selected.tools ?? []).includes(tool);
                        return (
                          <button
                            key={tool}
                            onClick={() => toggleTool(selected.id, tool)}
                            className={cn(
                              "w-full flex items-center gap-2 px-2 py-1.5 rounded border text-xs text-left transition-all",
                              isSelected
                                ? "border-primary/35 bg-primary/8 text-primary"
                                : "border-border text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", isSelected ? "bg-primary" : "bg-muted-foreground")} />
                            <span className="font-mono">{tool}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selected.type === "agent-task" && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Prompt Template</label>
                    <textarea
                      value={selected.promptTemplate || ""}
                      onChange={(e) => updateNode(selected.id, { promptTemplate: e.target.value })}
                      rows={4}
                      className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/40 resize-none font-mono"
                      placeholder="Enter prompt template..."
                    />
                  </div>
                )}

                {selected.type === "condition" && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Condition Expression</label>
                    <input
                      value={selected.condition || ""}
                      onChange={(e) => updateNode(selected.id, { condition: e.target.value })}
                      className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary/40 font-mono"
                      placeholder="e.g. risk_score > 0.75"
                    />
                  </div>
                )}

                <div className="pt-2 border-t border-border/50">
                  <div className="text-xs text-muted-foreground mb-1">Type</div>
                  <span className="badge-staged px-2 py-0.5 rounded text-xs capitalize">{selected.type.replace(/-/g, " ")}</span>
                </div>

                {/* Show outgoing edges for selected node */}
                {edges.filter(e => e.from === selected.id).length > 0 && (
                  <div className="pt-2 border-t border-border/50">
                    <div className="text-xs text-muted-foreground mb-1">Outgoing Edges</div>
                    <div className="space-y-1">
                      {edges.filter(e => e.from === selected.id).map(edge => {
                        const targetNode = nodes.find(n => n.id === edge.to);
                        return (
                          <div key={edge.id} className="flex items-center gap-1.5 group/edge2">
                            <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs text-muted-foreground flex-1">{targetNode?.label ?? edge.to}</span>
                            {edge.conditional && (
                              <span className="badge-warning px-1 py-0 rounded text-xs">{edge.label || "if"}</span>
                            )}
                            <button
                              onClick={() => removeEdge(edge.id)}
                              className="opacity-0 group-hover/edge2:opacity-100 text-muted-foreground hover:text-red-400 transition-all"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="inca-panel p-4 flex flex-col items-center justify-center h-48 text-center">
              <GitBranch className="w-6 h-6 text-muted-foreground mb-2" />
              <div className="text-xs text-muted-foreground">Click a node to inspect<br/>and configure it</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
