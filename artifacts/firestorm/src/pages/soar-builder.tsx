import { useState } from "react";
import { Zap, Plus, Play, Settings, ChevronRight, CheckCircle, AlertTriangle, User, Globe, Mail, Database, Shield, Clock, Activity, RefreshCw, Trash2, Copy, GitBranch } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { toast } from "@szl-holdings/shared-ui/ui/sonner";

type NodeType = "trigger" | "action" | "condition" | "enrich" | "notify" | "approve" | "loop";

interface PlaybookNode {
  id: string;
  type: NodeType;
  label: string;
  config: string;
  auto: boolean;
  connected?: string[];
}

interface SavedPlaybook {
  id: string;
  name: string;
  trigger: string;
  nodes: number;
  executions: number;
  successRate: number;
  avgRuntime: string;
  optimizations: number;
  status: "active" | "draft" | "disabled";
}

const SAVED_PLAYBOOKS: SavedPlaybook[] = [
  { id: "PB-A01", name: "Critical Alert Auto-Response", trigger: "SIEM: Critical Severity Alert", nodes: 12, executions: 847, successRate: 98, avgRuntime: "1m 23s", optimizations: 4, status: "active" },
  { id: "PB-A02", name: "Phishing Email Quarantine", trigger: "Email Gateway: Phishing Detected", nodes: 9, executions: 1204, successRate: 99, avgRuntime: "47s", optimizations: 7, status: "active" },
  { id: "PB-A03", name: "Malware Containment Chain", trigger: "EDR: Malware Confirmed", nodes: 14, executions: 312, successRate: 97, avgRuntime: "2m 08s", optimizations: 3, status: "active" },
  { id: "PB-A04", name: "Insider Threat Escalation", trigger: "DLP: Critical Data Exfil", nodes: 8, executions: 23, successRate: 100, avgRuntime: "4m 12s", optimizations: 1, status: "active" },
  { id: "PB-A05", name: "Cloud Privilege Abuse", trigger: "CASB: Privilege Escalation", nodes: 11, executions: 89, successRate: 94, avgRuntime: "3m 01s", optimizations: 2, status: "draft" },
  { id: "PB-A06", name: "Vulnerability Auto-Patch", trigger: "Vuln Scanner: CVSS ≥ 9.0", nodes: 7, executions: 178, successRate: 91, avgRuntime: "8m 45s", optimizations: 5, status: "active" },
];

const CANVAS_NODES: PlaybookNode[] = [
  { id: "n1", type: "trigger", label: "SIEM Alert: Critical", config: "Severity = Critical, Source = Any SIEM", auto: true, connected: ["n2"] },
  { id: "n2", type: "enrich", label: "Fetch IOC Reputation", config: "Query VirusTotal, AbuseIPDB, MISP", auto: true, connected: ["n3"] },
  { id: "n3", type: "enrich", label: "Asset Criticality Lookup", config: "CMDB lookup — get asset tier and owner", auto: true, connected: ["n4"] },
  { id: "n4", type: "condition", label: "Asset Tier 1?", config: "IF asset.criticality == 'tier-1'", auto: true, connected: ["n5", "n6"] },
  { id: "n5", type: "approve", label: "CISO Approval Gate", config: "Notify: CISO + Security Lead. Timeout: 15min", auto: false, connected: ["n7"] },
  { id: "n6", type: "action", label: "Auto-Isolate Endpoint", config: "EDR API: isolate host, block network", auto: true, connected: ["n7"] },
  { id: "n7", type: "action", label: "Block IOCs in Firewall", config: "Push to firewall blocklist, DNS sinkhole", auto: true, connected: ["n8"] },
  { id: "n8", type: "notify", label: "Create JIRA Ticket", config: "Create P1 ticket, assign to SOC oncall", auto: true, connected: ["n9"] },
  { id: "n9", type: "notify", label: "Slack Notification", config: "#soc-incidents channel, tag oncall", auto: true },
];

const nodeTypeConfig: Record<NodeType, { color: string; bg: string; border: string; label: string; icon: typeof Zap }> = {
  trigger: { color: "#ef4444", bg: "bg-red-500/10", border: "border-red-500/30", label: "Trigger", icon: Zap },
  action: { color: "#3b82f6", bg: "bg-blue-500/10", border: "border-blue-500/30", label: "Action", icon: Play },
  condition: { color: "#f59e0b", bg: "bg-amber-500/10", border: "border-amber-500/30", label: "Condition", icon: GitBranch },
  enrich: { color: "#8b5cf6", bg: "bg-purple-500/10", border: "border-purple-500/30", label: "Enrich", icon: Database },
  notify: { color: "#06b6d4", bg: "bg-cyan-500/10", border: "border-cyan-500/30", label: "Notify", icon: Mail },
  approve: { color: "#f97316", bg: "bg-orange-500/10", border: "border-orange-500/30", label: "Approve", icon: User },
  loop: { color: "#10b981", bg: "bg-emerald-500/10", border: "border-emerald-500/30", label: "Loop", icon: RefreshCw },
};

const NODE_PALETTE: { type: NodeType; icon: typeof Zap; label: string }[] = [
  { type: "trigger", icon: Zap, label: "Trigger" },
  { type: "action", icon: Play, label: "Action" },
  { type: "condition", icon: GitBranch, label: "Condition" },
  { type: "enrich", icon: Database, label: "Enrich" },
  { type: "notify", icon: Mail, label: "Notify" },
  { type: "approve", icon: User, label: "Approve Gate" },
  { type: "loop", icon: RefreshCw, label: "Loop" },
];

export default function SOARBuilder() {
  const [selectedPlaybook, setSelectedPlaybook] = useState<SavedPlaybook | null>(SAVED_PLAYBOOKS[0]);
  const [selectedNode, setSelectedNode] = useState<PlaybookNode | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Playbook saved and deployed — self-optimization enabled");
    }, 1500);
  };

  const handleAddNode = (type: NodeType) => {
    toast.success(`${nodeTypeConfig[type].label} node added to canvas`);
  };

  return (
    <div className="p-6 space-y-6 max-w-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-cyan-400" />
            <h1 className="text-lg font-semibold text-white">SOAR Visual Playbook Builder</h1>
          </div>
          <p className="text-xs text-zinc-500">Drag-and-drop playbook creation with conditional logic, parallel execution, human-in-the-loop approval gates, and self-optimization.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => toast.success("New playbook canvas opened")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300 text-xs hover:bg-white/8 transition-colors">
            <Plus className="w-3.5 h-3.5" /> New Playbook
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-medium hover:bg-cyan-500/25 transition-colors">
            {saving ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...</> : <><CheckCircle className="w-3.5 h-3.5" /> Save & Deploy</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Playbook Library */}
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Playbook Library</h2>
          <div className="space-y-1.5">
            {SAVED_PLAYBOOKS.map(pb => (
              <button
                key={pb.id}
                onClick={() => setSelectedPlaybook(pb)}
                className={cn("w-full rounded-xl border p-3 text-left transition-all", selectedPlaybook?.id === pb.id ? "border-cyan-500/30 bg-cyan-500/5" : "border-white/8 bg-white/3 hover:bg-white/5")}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="text-[11px] font-medium text-white leading-snug">{pb.name}</span>
                  <span className={cn("text-[9px] px-1 py-0.5 rounded border shrink-0 capitalize", pb.status === "active" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : pb.status === "draft" ? "text-amber-400 border-amber-500/30 bg-amber-500/10" : "text-zinc-400 border-zinc-500/30 bg-zinc-500/10")}>{pb.status}</span>
                </div>
                <div className="text-[9px] text-zinc-500 mb-1.5 truncate">{pb.trigger}</div>
                <div className="flex items-center gap-3 text-[9px] text-zinc-500">
                  <span>{pb.nodes} nodes</span>
                  <span className="text-emerald-400">{pb.successRate}%</span>
                  <span>{pb.avgRuntime}</span>
                </div>
                {pb.optimizations > 0 && <div className="mt-1 text-[9px] text-purple-400">✨ {pb.optimizations} auto-optimizations</div>}
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Playbook Canvas</h2>
            <div className="text-[10px] text-zinc-500">
              {selectedPlaybook?.name ?? "Critical Alert Auto-Response"} · {CANVAS_NODES.length} nodes
            </div>
          </div>

          {/* Node Palette */}
          <div className="flex items-center gap-1.5 flex-wrap mb-3 p-2 rounded-xl border border-white/8 bg-white/2">
            <span className="text-[10px] text-zinc-500 mr-1">Add:</span>
            {NODE_PALETTE.map(p => {
              const Icon = p.icon;
              const cfg = nodeTypeConfig[p.type];
              return (
                <button
                  key={p.type}
                  onClick={() => handleAddNode(p.type)}
                  className={cn("flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] border transition-colors hover:opacity-80", cfg.bg, cfg.border)}
                  style={{ color: cfg.color }}
                >
                  <Icon className="w-2.5 h-2.5" />
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Visual Canvas (simplified flow representation) */}
          <div className="rounded-xl border border-white/8 bg-[#080b12] p-4 min-h-[480px] overflow-auto">
            <div className="space-y-2">
              {CANVAS_NODES.map((node, idx) => {
                const cfg = nodeTypeConfig[node.type];
                const Icon = cfg.icon;
                const isSelected = selectedNode?.id === node.id;
                return (
                  <div key={node.id} className="flex items-start gap-2">
                    {/* Connector line */}
                    {idx > 0 && (
                      <div className="ml-3.5 w-px bg-white/10 h-4 -mt-2 shrink-0" />
                    )}
                    <div className="w-full">
                      {idx > 0 && <div className="ml-3.5 w-px bg-white/10 h-2 mb-0 shrink-0" />}
                      <button
                        onClick={() => setSelectedNode(isSelected ? null : node)}
                        className={cn("w-full rounded-xl border p-3 text-left transition-all", isSelected ? `${cfg.bg} ${cfg.border}` : "border-white/8 bg-white/3 hover:bg-white/5")}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0", cfg.bg)}>
                            <Icon className="w-3 h-3" style={{ color: cfg.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-medium text-white">{node.label}</span>
                              <span className="text-[9px] px-1 py-0.5 rounded" style={{ color: cfg.color, background: cfg.color + "15" }}>{cfg.label}</span>
                              {!node.auto && <span className="text-[9px] text-orange-400 bg-orange-500/10 px-1 py-0.5 rounded">👤 Human</span>}
                              {node.auto && <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded">⚡ Auto</span>}
                            </div>
                            {isSelected && <div className="text-[10px] text-zinc-400 mt-1 leading-relaxed">{node.config}</div>}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={(e) => { e.stopPropagation(); toast.success("Node duplicated"); }} className="p-1 rounded hover:bg-white/8"><Copy className="w-3 h-3 text-zinc-500" /></button>
                            <button onClick={(e) => { e.stopPropagation(); toast.success("Node removed"); }} className="p-1 rounded hover:bg-white/8"><Trash2 className="w-3 h-3 text-zinc-500" /></button>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Playbook Stats / Optimization */}
        <div>
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Playbook Intelligence</h2>
          {selectedPlaybook && (
            <div className="space-y-3">
              <div className="rounded-xl border border-white/8 bg-white/3 p-3 space-y-2">
                <div className="text-xs font-medium text-white mb-2">{selectedPlaybook.name}</div>
                {[
                  { label: "Executions", value: selectedPlaybook.executions.toLocaleString() },
                  { label: "Success Rate", value: `${selectedPlaybook.successRate}%`, color: "#10b981" },
                  { label: "Avg Runtime", value: selectedPlaybook.avgRuntime },
                  { label: "Nodes", value: selectedPlaybook.nodes },
                ].map(stat => (
                  <div key={stat.label} className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500">{stat.label}</span>
                    <span style={stat.color ? { color: stat.color } : {}} className={!stat.color ? "text-white" : ""}>{stat.value}</span>
                  </div>
                ))}
              </div>

              {selectedPlaybook.optimizations > 0 && (
                <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3">
                  <div className="text-[11px] font-semibold text-purple-300 mb-2 flex items-center gap-1.5">
                    <Activity className="w-3 h-3" />
                    Self-Optimization Log
                  </div>
                  <div className="space-y-1.5 text-[10px] text-zinc-400">
                    {["Merged 2 sequential enrich steps into parallel execution (-34s avg)", "Reduced Slack notification latency by batching alerts", "Added retry logic on EDR API timeout (improved success rate +3%)", "Reordered condition checks for 2x faster hot-path"].slice(0, selectedPlaybook.optimizations).map((opt, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <CheckCircle className="w-3 h-3 text-purple-400 shrink-0 mt-0.5" />
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-white/8 bg-white/3 p-3">
                <div className="text-[11px] font-semibold text-zinc-300 mb-2">Connected Integrations</div>
                <div className="space-y-1.5">
                  {["Splunk SIEM", "CrowdStrike EDR", "VirusTotal", "Palo Alto FW", "JIRA", "Slack", "ServiceNow", "Microsoft 365"].map(tool => (
                    <div key={tool} className="flex items-center gap-2 text-[10px]">
                      <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="text-zinc-400">{tool}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => toast.success("Integration catalog opened — 50+ security tools available")} className="mt-2 text-[10px] text-cyan-400 hover:text-cyan-300">
                  + Add integration →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
