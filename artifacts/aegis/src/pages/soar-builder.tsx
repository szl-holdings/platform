import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { toast } from '@szl-holdings/shared-ui/ui/sonner';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle,
  Clock,
  Database,
  GitBranch,
  History,
  Mail,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  User,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

type NodeType = 'trigger' | 'action' | 'condition' | 'enrich' | 'notify' | 'approve' | 'loop';
type PlaybookStatus = 'active' | 'draft' | 'archived';
type RunStatus = 'completed' | 'awaiting_approval' | 'failed' | 'running';

interface PlaybookNode {
  id: string;
  type: NodeType;
  label: string;
  config: string;
  auto: boolean;
}

interface PlaybookSummary {
  id: string;
  name: string;
  trigger: string;
  description: string;
  nodeCount: number;
  status: PlaybookStatus;
  runCount: number;
  successRate: number;
  createdAt: string;
  updatedAt: string;
}

interface PlaybookDetail {
  id: string;
  name: string;
  trigger: string;
  description: string;
  nodes: PlaybookNode[];
  status: PlaybookStatus;
  runCount: number;
  successCount: number;
}

interface SoarRun {
  id: string;
  playbookId: string;
  playbookName: string;
  status: RunStatus;
  triggeredBy: string;
  duration?: string;
  stepsCompleted: number;
  stepsFailed: number;
  outcome?: string;
  incidentId?: string;
  startedAt: string;
  completedAt?: string;
}

const nodeTypeConfig: Record<
  NodeType,
  { color: string; bg: string; border: string; label: string; icon: React.ElementType }
> = {
  trigger: {
    color: '#f5f5f5',
    bg: 'bg-[#f5f5f5]/10',
    border: 'border-[#f5f5f5]/30',
    label: 'Trigger',
    icon: Zap,
  },
  action: {
    color: '#c9b787',
    bg: 'bg-[#c9b787]/10',
    border: 'border-[#c9b787]/30',
    label: 'Action',
    icon: Play,
  },
  condition: {
    color: '#c9b787',
    bg: 'bg-[#c9b787]/10',
    border: 'border-[#c9b787]/30',
    label: 'Condition',
    icon: GitBranch,
  },
  enrich: {
    color: '#8a8a8a',
    bg: 'bg-[#8a8a8a]/10',
    border: 'border-[#8a8a8a]/30',
    label: 'Enrich',
    icon: Database,
  },
  notify: {
    color: '#8a8a8a',
    bg: 'bg-[#8a8a8a]/10',
    border: 'border-[#8a8a8a]/30',
    label: 'Notify',
    icon: Mail,
  },
  approve: {
    color: '#c9b787',
    bg: 'bg-[#c9b787]/10',
    border: 'border-[#c9b787]/30',
    label: 'Approve',
    icon: User,
  },
  loop: {
    color: '#c9b787',
    bg: 'bg-[#c9b787]/10',
    border: 'border-[#c9b787]/30',
    label: 'Loop',
    icon: RefreshCw,
  },
};

const NODE_PALETTE: { type: NodeType; label: string }[] = [
  { type: 'trigger', label: 'Trigger' },
  { type: 'action', label: 'Action' },
  { type: 'condition', label: 'Condition' },
  { type: 'enrich', label: 'Enrich' },
  { type: 'notify', label: 'Notify' },
  { type: 'approve', label: 'Approve Gate' },
  { type: 'loop', label: 'Loop' },
];

const STATUS_COLOR: Record<string, string> = {
  completed: 'text-[#c9b787] bg-[#c9b787]/10 border-[#c9b787]/30',
  awaiting_approval: 'text-[#c9b787] bg-[#c9b787]/10 border-[#c9b787]/30',
  failed: 'text-[#f5f5f5] bg-[#f5f5f5]/10 border-[#f5f5f5]/30',
  running: 'text-[#c9b787] bg-[#c9b787]/10 border-[#c9b787]/30',
};

function relTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const DEFAULT_CANVAS_NODES: PlaybookNode[] = [
  {
    id: 'n1',
    type: 'trigger',
    label: 'SIEM Alert: Critical',
    config: 'Severity = Critical, Source = Any SIEM',
    auto: true,
  },
  {
    id: 'n2',
    type: 'enrich',
    label: 'Fetch IOC Reputation',
    config: 'Query VirusTotal, AbuseIPDB, MISP',
    auto: true,
  },
  {
    id: 'n3',
    type: 'condition',
    label: 'Asset Tier 1?',
    config: "IF asset.criticality == 'tier-1'",
    auto: true,
  },
  {
    id: 'n4',
    type: 'approve',
    label: 'CISO Approval Gate',
    config: 'Notify: CISO + Security Lead. Timeout: 15min',
    auto: false,
  },
  {
    id: 'n5',
    type: 'action',
    label: 'Auto-Isolate Endpoint',
    config: 'EDR API: isolate host, block network',
    auto: true,
  },
  {
    id: 'n6',
    type: 'action',
    label: 'Block IOCs in Firewall',
    config: 'Push to firewall blocklist, DNS sinkhole',
    auto: true,
  },
  {
    id: 'n7',
    type: 'notify',
    label: 'Create JIRA Ticket',
    config: 'Create P1 ticket, assign to SOC oncall',
    auto: true,
  },
  {
    id: 'n8',
    type: 'notify',
    label: 'Slack Notification',
    config: '#soc-incidents channel, tag oncall',
    auto: true,
  },
];

export default function SOARBuilder() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'builder' | 'runs'>('builder');
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<PlaybookNode | null>(null);
  const [canvasNodes, setCanvasNodes] = useState<PlaybookNode[]>(DEFAULT_CANVAS_NODES);

  const playbooksQuery = useStandardQuery({
    queryKey: ['soar-builder', 'playbooks'],
    queryFn: () => api.soarBuilder.playbooks(),
    refetchInterval: 30000,
  });

  const runsQuery = useStandardQuery({
    queryKey: ['soar-builder', 'runs', selectedPlaybookId],
    queryFn: () => api.soarBuilder.runs(selectedPlaybookId ?? undefined),
    refetchInterval: 15000,
  });

  const playbookDetailQuery = useStandardQuery({
    queryKey: ['soar-builder', 'playbook', selectedPlaybookId],
    queryFn: () => (selectedPlaybookId ? api.soarBuilder.getPlaybook(selectedPlaybookId) : null),
    enabled: !!selectedPlaybookId,
  });

  // Hydrate canvas nodes from persisted playbook when a playbook is selected
  useEffect(() => {
    const detail = (playbookDetailQuery.data as { data?: { playbook?: PlaybookDetail } } | null)
      ?.data?.playbook;
    if (detail?.nodes && Array.isArray(detail.nodes) && detail.nodes.length > 0) {
      setCanvasNodes(detail.nodes as PlaybookNode[]);
      setSelectedNode(null);
    }
  }, [playbookDetailQuery.data]);

  const saveMutation = useStandardMutation({
    mutationFn: () => {
      const selectedPlaybook = playbooks.find((p) => p.id === selectedPlaybookId);
      if (selectedPlaybookId && selectedPlaybook) {
        return api.soarBuilder.updatePlaybook(selectedPlaybookId, {
          nodes: canvasNodes,
          status: 'active',
        });
      }
      return api.soarBuilder.createPlaybook({
        name: 'New Playbook',
        trigger: 'Manual Trigger',
        description: 'Custom playbook',
        nodes: canvasNodes,
        status: 'draft',
      });
    },
    onSuccess: (data: { data?: { message?: string; playbook?: { id: string } } }) => {
      qc.invalidateQueries({ queryKey: ['soar-builder', 'playbooks'] });
      qc.invalidateQueries({ queryKey: ['soar-builder', 'playbook', selectedPlaybookId] });
      toast.success(data?.data?.message ?? 'Playbook saved and deployed');
      if (!selectedPlaybookId && data?.data?.playbook?.id) {
        setSelectedPlaybookId(data.data.playbook.id);
      }
    },
    onError: () => toast.error('Failed to save playbook'),
  });

  const executeMutation = useStandardMutation({
    mutationFn: (playbookId: string) =>
      api.soarBuilder.execute(playbookId, undefined, 'Manual execution from SOAR Builder'),
    onSuccess: (data: { data?: { message?: string } }) => {
      qc.invalidateQueries({ queryKey: ['soar-builder', 'runs'] });
      toast.success(data?.data?.message ?? 'Playbook executed');
      setTab('runs');
    },
    onError: () => toast.error('Failed to execute playbook'),
  });

  const deleteMutation = useStandardMutation({
    mutationFn: (id: string) => api.soarBuilder.deletePlaybook(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['soar-builder', 'playbooks'] });
      setSelectedPlaybookId(null);
      setCanvasNodes(DEFAULT_CANVAS_NODES);
      toast.success('Playbook deleted');
    },
    onError: () => toast.error('Failed to delete playbook'),
  });

  const playbooks: PlaybookSummary[] =
    (playbooksQuery.data as { data?: { playbooks?: PlaybookSummary[] } } | null)?.data?.playbooks ??
    [];
  const runs: SoarRun[] =
    (runsQuery.data as { data?: { runs?: SoarRun[] } } | null)?.data?.runs ?? [];
  const selectedPlaybook: PlaybookSummary | null =
    playbooks.find((p) => p.id === selectedPlaybookId) ?? playbooks[0] ?? null;

  const handleSelectPlaybook = (pb: PlaybookSummary) => {
    setSelectedPlaybookId(pb.id);
    setSelectedNode(null);
  };

  const handleAddNode = (type: NodeType) => {
    const cfg = nodeTypeConfig[type];
    const newNode: PlaybookNode = {
      id: `n${Date.now()}`,
      type,
      label: `${cfg.label} Step`,
      config: 'Configure this step',
      auto: type !== 'approve',
    };
    setCanvasNodes((prev) => [...prev, newNode]);
    toast.success(`${cfg.label} node added to canvas`);
  };

  const handleRemoveNode = (id: string) => {
    setCanvasNodes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNode?.id === id) setSelectedNode(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-[#8a8a8a]" />
            <h1 className="text-lg font-semibold text-white">SOAR Visual Playbook Builder</h1>
          </div>
          <p className="text-xs text-zinc-500">
            Build, persist, and execute response playbooks. All runs are recorded with full audit
            history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedPlaybookId(null);
              setCanvasNodes(DEFAULT_CANVAS_NODES);
              setSelectedNode(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300 text-xs hover:bg-white/8 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Playbook
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8a8a8a]/15 border border-[#8a8a8a]/30 text-[#8a8a8a] text-xs font-medium hover:bg-[#8a8a8a]/25 transition-colors disabled:opacity-50"
          >
            {saveMutation.isPending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5" /> Save & Deploy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/10">
        <button
          onClick={() => setTab('builder')}
          className={cn(
            'flex items-center gap-1.5 text-xs px-3 py-2 border-b-2 transition-colors',
            tab === 'builder'
              ? 'border-[#8a8a8a] text-[#8a8a8a]'
              : 'border-transparent text-zinc-500 hover:text-zinc-300',
          )}
        >
          <Zap className="w-3 h-3" /> Builder
        </button>
        <button
          onClick={() => setTab('runs')}
          className={cn(
            'flex items-center gap-1.5 text-xs px-3 py-2 border-b-2 transition-colors',
            tab === 'runs'
              ? 'border-[#8a8a8a] text-[#8a8a8a]'
              : 'border-transparent text-zinc-500 hover:text-zinc-300',
          )}
        >
          <History className="w-3 h-3" /> Run History{' '}
          {runs.length > 0 && (
            <span className="text-[10px] px-1 py-0.5 rounded-full bg-[#8a8a8a]/20 text-[#8a8a8a]">
              {runs.length}
            </span>
          )}
        </button>
      </div>

      {tab === 'builder' && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Playbook Library */}
          <div>
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Playbook Library
            </h2>
            {playbooksQuery.isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                {playbooks.map((pb: PlaybookSummary) => (
                  <button
                    key={pb.id}
                    onClick={() => handleSelectPlaybook(pb)}
                    className={cn(
                      'w-full rounded-xl border p-3 text-left transition-all',
                      selectedPlaybook?.id === pb.id
                        ? 'border-[#8a8a8a]/30 bg-[#8a8a8a]/5'
                        : 'border-white/8 bg-white/3 hover:bg-white/5',
                    )}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="text-[11px] font-medium text-white leading-snug">
                        {pb.name}
                      </span>
                      <span
                        className={cn(
                          'text-[9px] px-1 py-0.5 rounded border shrink-0 capitalize',
                          pb.status === 'active'
                            ? 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10'
                            : pb.status === 'draft'
                              ? 'text-[#c9b787] border-[#c9b787]/30 bg-[#c9b787]/10'
                              : 'text-zinc-400 border-zinc-500/30 bg-zinc-500/10',
                        )}
                      >
                        {pb.status}
                      </span>
                    </div>
                    <div className="text-[9px] text-zinc-500 mb-1.5 truncate">{pb.trigger}</div>
                    <div className="flex items-center gap-3 text-[9px] text-zinc-500">
                      <span>{pb.nodeCount} nodes</span>
                      {pb.runCount > 0 && (
                        <span className="text-[#c9b787]">{pb.successRate}% success</span>
                      )}
                      <span>{pb.runCount} runs</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Canvas */}
          <div className="xl:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Playbook Canvas
              </h2>
              <div className="text-[10px] text-zinc-500">
                {selectedPlaybook?.name ?? 'New Playbook'} · {canvasNodes.length} nodes
              </div>
            </div>

            {/* Node Palette */}
            <div className="flex items-center gap-1.5 flex-wrap mb-3 p-2 rounded-xl border border-white/8 bg-white/2">
              <span className="text-[10px] text-zinc-500 mr-1">Add:</span>
              {NODE_PALETTE.map((p) => {
                const cfg = nodeTypeConfig[p.type];
                const Icon = cfg.icon;
                return (
                  <button
                    key={p.type}
                    onClick={() => handleAddNode(p.type)}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] border transition-colors hover:opacity-80',
                      cfg.bg,
                      cfg.border,
                    )}
                    style={{ color: cfg.color }}
                  >
                    <Icon className="w-2.5 h-2.5" />
                    {p.label}
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-white/8 bg-[#080b12] p-4 min-h-[480px] overflow-auto">
              <div className="space-y-2">
                {canvasNodes.map((node, idx) => {
                  const cfg = nodeTypeConfig[node.type];
                  const Icon = cfg.icon;
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <div key={node.id}>
                      {idx > 0 && <div className="ml-3.5 w-px bg-white/10 h-3" />}
                      <button
                        onClick={() => setSelectedNode(isSelected ? null : node)}
                        className={cn(
                          'w-full rounded-xl border p-3 text-left transition-all',
                          isSelected
                            ? `${cfg.bg} ${cfg.border}`
                            : 'border-white/8 bg-white/3 hover:bg-white/5',
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'w-6 h-6 rounded-lg flex items-center justify-center shrink-0',
                              cfg.bg,
                            )}
                          >
                            <Icon className="w-3 h-3" style={{ color: cfg.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-medium text-white">
                                {node.label}
                              </span>
                              <span
                                className="text-[9px] px-1 py-0.5 rounded"
                                style={{ color: cfg.color, background: `${cfg.color}15` }}
                              >
                                {cfg.label}
                              </span>
                              {!node.auto && (
                                <span className="text-[9px] text-[#c9b787] bg-[#c9b787]/10 px-1 py-0.5 rounded">
                                  👤 Human
                                </span>
                              )}
                              {node.auto && (
                                <span className="text-[9px] text-[#c9b787] bg-[#c9b787]/10 px-1 py-0.5 rounded">
                                  ⚡ Auto
                                </span>
                              )}
                            </div>
                            {isSelected && (
                              <div className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                                {node.config}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveNode(node.id);
                            }}
                            className="p-1 rounded hover:bg-white/8 shrink-0"
                          >
                            <Trash2 className="w-3 h-3 text-zinc-500" />
                          </button>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Playbook Details & Actions */}
          <div>
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Playbook Intelligence
            </h2>
            {selectedPlaybook ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-white/8 bg-white/3 p-3 space-y-2">
                  <div className="text-xs font-medium text-white mb-2">{selectedPlaybook.name}</div>
                  {[
                    { label: 'Runs', value: String(selectedPlaybook.runCount) },
                    {
                      label: 'Success Rate',
                      value: `${selectedPlaybook.successRate}%`,
                      color: '#c9b787',
                    },
                    { label: 'Nodes', value: String(selectedPlaybook.nodeCount) },
                    {
                      label: 'Status',
                      value: selectedPlaybook.status,
                      color: selectedPlaybook.status === 'active' ? '#c9b787' : '#c9b787',
                    },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-500">{stat.label}</span>
                      <span
                        style={stat.color ? { color: stat.color } : {}}
                        className={!stat.color ? 'text-white capitalize' : 'capitalize'}
                      >
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => executeMutation.mutate(selectedPlaybook.id)}
                  disabled={executeMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#8a8a8a]/15 border border-[#8a8a8a]/30 text-[#8a8a8a] text-xs font-medium hover:bg-[#8a8a8a]/25 transition-colors disabled:opacity-50"
                >
                  {executeMutation.isPending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Executing…
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" /> Execute Playbook
                    </>
                  )}
                </button>

                <button
                  onClick={() => deleteMutation.mutate(selectedPlaybook.id)}
                  disabled={deleteMutation.isPending}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#f5f5f5]/10 border border-[#f5f5f5]/20 text-[#f5f5f5] text-xs hover:bg-[#f5f5f5]/15 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Playbook
                </button>

                <div className="rounded-xl border border-white/8 bg-white/3 p-3">
                  <div className="text-[11px] font-semibold text-zinc-300 mb-2">
                    Recent Activity
                  </div>
                  <div className="space-y-1.5">
                    {runs
                      .filter((r) => r.playbookId === selectedPlaybook.id)
                      .slice(0, 3)
                      .map((run: SoarRun) => (
                        <div key={run.id} className="text-[10px] text-zinc-500">
                          <span
                            className={
                              STATUS_COLOR[run.status]
                                ? `text-[10px] px-1 py-0.5 rounded border capitalize ${STATUS_COLOR[run.status]}`
                                : 'text-zinc-500'
                            }
                          >
                            {run.status.replace(/_/g, ' ')}
                          </span>
                          <span className="ml-1">{relTime(run.startedAt)}</span>
                        </div>
                      ))}
                    {runs.filter((r) => r.playbookId === selectedPlaybook.id).length === 0 && (
                      <div className="text-[10px] text-zinc-600">No runs yet</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-white/8 bg-white/3 p-4 text-center">
                <div className="text-xs text-zinc-500">
                  Select a playbook to view details and run history, or build a new one on the
                  canvas.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'runs' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {selectedPlaybookId ? `Run History — ${selectedPlaybook?.name}` : 'All Run History'}
            </h2>
            {selectedPlaybookId && (
              <button
                onClick={() => setSelectedPlaybookId(null)}
                className="text-[10px] text-zinc-500 hover:text-zinc-300"
              >
                Show all runs →
              </button>
            )}
          </div>

          {runsQuery.isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-14 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
              ))}
            </div>
          ) : runs.length === 0 ? (
            <div className="rounded-xl border border-white/8 bg-white/3 p-8 text-center">
              <History className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <div className="text-xs text-zinc-500">
                No runs yet. Execute a playbook to see history here.
              </div>
            </div>
          ) : (
            runs.map((run: SoarRun) => (
              <div key={run.id} className="rounded-xl border border-white/8 bg-white/3 p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="text-xs font-medium text-white">{run.playbookName}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{run.triggeredBy}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded border capitalize',
                        STATUS_COLOR[run.status] ??
                          'text-zinc-400 border-zinc-500/30 bg-zinc-500/10',
                      )}
                    >
                      {run.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] mb-2">
                  <div>
                    <span className="text-zinc-500">Duration: </span>
                    <span className="text-white">{run.duration}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Steps done: </span>
                    <span className="text-white">{run.stepsCompleted}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Failed: </span>
                    <span className={run.stepsFailed > 0 ? 'text-[#f5f5f5]' : 'text-[#c9b787]'}>
                      {run.stepsFailed}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Started: </span>
                    <span className="text-white">{relTime(run.startedAt)}</span>
                  </div>
                </div>
                {run.outcome && (
                  <div className="text-[10px] text-zinc-400 bg-white/3 rounded p-2">
                    {run.outcome}
                  </div>
                )}
                {run.incidentId && (
                  <div className="text-[10px] text-[#8a8a8a] mt-1">Linked: {run.incidentId}</div>
                )}
                {run.status === 'awaiting_approval' && (
                  <div className="flex items-center gap-1.5 text-[10px] text-[#c9b787] mt-2 px-2 py-1.5 rounded bg-[#c9b787]/10 border border-[#c9b787]/20">
                    <Clock className="w-3 h-3" /> Paused at approval gate — awaiting CISO
                    authorization
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
