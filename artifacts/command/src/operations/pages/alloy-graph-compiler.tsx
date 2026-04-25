import { api } from '@lyte/lib/api';
import { useStandardQuery } from '@szl-holdings/api-client-react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Cpu,
  Database,
  Eye,
  GitBranch,
  Lock,
  Play,
  RefreshCw,
  RotateCcw,
  Shield,
  Split,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const BG = { page: '#080c14', surface: '#0c1018', elevated: '#10141e' };
const BORDER = { subtle: 'rgba(255,255,255,0.04)', muted: 'rgba(255,255,255,0.07)' };
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
  muted: 'rgba(255,255,255,0.14)',
};
const ACCENT = '#d4a054';

type NodeKind = 'trigger' | 'action' | 'condition' | 'approval' | 'fallback' | 'end';
type NodeState = 'pending' | 'ready' | 'blocked';

interface DAGNode {
  id: string;
  kind: NodeKind;
  label: string;
  sublabel?: string;
  state: NodeState;
  approver?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  fallbackFor?: string;
}

interface DAGEdge {
  from: string;
  to: string;
  label?: string;
  type?: 'primary' | 'fallback' | 'else';
}

interface CompiledPlan {
  goal: string;
  nodes: DAGNode[];
  edges: DAGEdge[];
  approvalCount: number;
  estimatedDuration: string;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
}

type LucideIcon = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
const NODE_CFG: Record<NodeKind, { color: string; bg: string; icon: LucideIcon; label: string }> = {
  trigger: { color: '#d4a054', bg: 'rgba(212,160,84,0.12)', icon: Zap, label: 'Trigger' },
  action: { color: '#6b8f71', bg: 'rgba(107,143,113,0.12)', icon: Play, label: 'Action' },
  condition: { color: '#4a90b8', bg: 'rgba(74,144,184,0.12)', icon: GitBranch, label: 'Condition' },
  approval: {
    color: '#8b7ac8',
    bg: 'rgba(139,122,200,0.12)',
    icon: Shield,
    label: 'Approval Gate',
  },
  fallback: { color: '#c8953c', bg: 'rgba(200,149,60,0.12)', icon: RotateCcw, label: 'Fallback' },
  end: { color: '#6b7280', bg: 'rgba(107,114,128,0.08)', icon: CheckCircle, label: 'End' },
};

const EDGE_CFG: Record<string, { color: string; dash?: boolean }> = {
  primary: { color: 'rgba(255,255,255,0.18)' },
  fallback: { color: '#c8953c', dash: true },
  else: { color: '#4a90b8', dash: true },
};

const EXAMPLE_PLANS: Record<string, CompiledPlan> = {
  'Generate Q1 board report and route for executive approval': {
    goal: 'Generate Q1 board report and route for executive approval',
    approvalCount: 2,
    estimatedDuration: '~8 min',
    riskLevel: 'high',
    confidence: 0.91,
    nodes: [
      {
        id: 'n1',
        kind: 'trigger',
        label: 'Goal Received',
        sublabel: 'Manual trigger',
        state: 'ready',
      },
      {
        id: 'n2',
        kind: 'action',
        label: 'Aggregate Portfolio KPIs',
        sublabel: 'PRISM + Terra + Vessels',
        state: 'ready',
      },
      {
        id: 'n3',
        kind: 'action',
        label: 'Generate Report Draft',
        sublabel: 'AI narrative engine',
        state: 'ready',
      },
      {
        id: 'n4',
        kind: 'condition',
        label: 'Draft Quality ≥ 90%?',
        sublabel: 'Confidence threshold',
        state: 'ready',
      },
      {
        id: 'n5',
        kind: 'approval',
        label: 'CFO Review Gate',
        sublabel: 'Finance approval required',
        state: 'blocked',
        approver: 'CFO',
        riskLevel: 'high',
      },
      {
        id: 'n6',
        kind: 'action',
        label: 'Format for Board',
        sublabel: 'Apply template + redact',
        state: 'pending',
      },
      {
        id: 'n7',
        kind: 'approval',
        label: 'CEO Sign-Off Gate',
        sublabel: 'Exec approval required',
        state: 'pending',
        approver: 'CEO',
        riskLevel: 'high',
      },
      {
        id: 'n8',
        kind: 'action',
        label: 'Distribute Report',
        sublabel: 'Send to board members',
        state: 'pending',
      },
      { id: 'n9', kind: 'end', label: 'Completed', state: 'pending' },
      {
        id: 'f1',
        kind: 'fallback',
        label: 'Request Revision',
        sublabel: 'Loop back to draft',
        state: 'pending',
        fallbackFor: 'n4',
      },
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n3', to: 'n4' },
      { from: 'n4', to: 'n5', label: 'yes', type: 'primary' },
      { from: 'n4', to: 'f1', label: 'no', type: 'else' },
      { from: 'f1', to: 'n3', label: 'retry', type: 'fallback' },
      { from: 'n5', to: 'n6' },
      { from: 'n6', to: 'n7' },
      { from: 'n7', to: 'n8' },
      { from: 'n8', to: 'n9' },
    ],
  },
  'Run vessel rerouting for Pacific Fleet due to weather alert': {
    goal: 'Run vessel rerouting for Pacific Fleet due to weather alert',
    approvalCount: 1,
    estimatedDuration: '~3 min',
    riskLevel: 'medium',
    confidence: 0.88,
    nodes: [
      {
        id: 'n1',
        kind: 'trigger',
        label: 'Weather Alert Ingested',
        sublabel: 'Signal: Pacific storm',
        state: 'ready',
      },
      {
        id: 'n2',
        kind: 'action',
        label: 'Assess Affected Vessels',
        sublabel: 'AIS + weather overlay',
        state: 'ready',
      },
      {
        id: 'n3',
        kind: 'condition',
        label: 'Vessels at Risk?',
        sublabel: 'Exposure threshold',
        state: 'ready',
      },
      {
        id: 'n4',
        kind: 'action',
        label: 'Calculate Alternate Routes',
        sublabel: 'Route optimizer',
        state: 'ready',
      },
      {
        id: 'n5',
        kind: 'approval',
        label: 'Fleet Ops Approval Gate',
        sublabel: 'Ops sign-off required',
        state: 'blocked',
        approver: 'Fleet Ops',
        riskLevel: 'medium',
      },
      {
        id: 'n6',
        kind: 'action',
        label: 'Send Rerouting Orders',
        sublabel: 'Notify captains + ports',
        state: 'pending',
      },
      {
        id: 'n7',
        kind: 'action',
        label: 'Update ETA Database',
        sublabel: 'Cascade ETA corrections',
        state: 'pending',
      },
      { id: 'n8', kind: 'end', label: 'Rerouting Complete', state: 'pending' },
      {
        id: 'f1',
        kind: 'fallback',
        label: 'Hold Position',
        sublabel: 'Monitor until clear',
        state: 'pending',
        fallbackFor: 'n3',
      },
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n3', to: 'n4', label: 'yes', type: 'primary' },
      { from: 'n3', to: 'f1', label: 'no', type: 'else' },
      { from: 'n4', to: 'n5' },
      { from: 'n5', to: 'n6' },
      { from: 'n6', to: 'n7' },
      { from: 'n7', to: 'n8' },
    ],
  },
  'Audit security posture and escalate critical findings': {
    goal: 'Audit security posture and escalate critical findings',
    approvalCount: 1,
    estimatedDuration: '~5 min',
    riskLevel: 'high',
    confidence: 0.93,
    nodes: [
      {
        id: 'n1',
        kind: 'trigger',
        label: 'Audit Request',
        sublabel: 'Manual / scheduled',
        state: 'ready',
      },
      {
        id: 'n2',
        kind: 'action',
        label: 'Enumerate Security Controls',
        sublabel: 'Digital + physical + ops',
        state: 'ready',
      },
      {
        id: 'n3',
        kind: 'action',
        label: 'Score Each Control',
        sublabel: 'NIST framework scoring',
        state: 'ready',
      },
      {
        id: 'n4',
        kind: 'condition',
        label: 'Critical Findings?',
        sublabel: 'Score < 60 or CVE found',
        state: 'ready',
      },
      {
        id: 'n5',
        kind: 'approval',
        label: 'CISO Review Gate',
        sublabel: 'Security approval required',
        state: 'blocked',
        approver: 'CISO',
        riskLevel: 'high',
      },
      {
        id: 'n6',
        kind: 'action',
        label: 'Compile Audit Report',
        sublabel: 'Evidence + recommendations',
        state: 'pending',
      },
      {
        id: 'n7',
        kind: 'action',
        label: 'Push to GRC Platform',
        sublabel: 'Export audit evidence',
        state: 'pending',
      },
      { id: 'n8', kind: 'end', label: 'Audit Complete', state: 'pending' },
      {
        id: 'f1',
        kind: 'fallback',
        label: 'Immediate Escalation',
        sublabel: 'Page on-call CISO now',
        state: 'pending',
        fallbackFor: 'n4',
      },
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n3' },
      { from: 'n3', to: 'n4' },
      { from: 'n4', to: 'n5', label: 'critical', type: 'primary' },
      { from: 'n4', to: 'n6', label: 'clean', type: 'else' },
      { from: 'n5', to: 'f1', label: 'escalate', type: 'fallback' },
      { from: 'n5', to: 'n6', label: 'approved' },
      { from: 'n6', to: 'n7' },
      { from: 'n7', to: 'n8' },
    ],
  },
};

const EXAMPLE_GOALS = Object.keys(EXAMPLE_PLANS);

function NodeCard({ node }: { node: DAGNode }) {
  const cfg = NODE_CFG[node.kind];
  const Icon = cfg.icon;
  const opacity = node.state === 'pending' ? 0.45 : 1;
  return (
    <div className="flex flex-col items-center" style={{ minWidth: 90, opacity }}>
      <div
        className="w-16 h-16 rounded-xl flex flex-col items-center justify-center relative"
        style={{
          background: cfg.bg,
          border: `2px solid ${node.state === 'blocked' ? cfg.color : node.state === 'ready' ? `${cfg.color}80` : 'rgba(255,255,255,0.06)'}`,
          boxShadow: node.state === 'blocked' ? `0 0 12px ${cfg.color}22` : 'none',
        }}
      >
        {node.state === 'blocked' && (
          <div
            className="absolute inset-0 rounded-xl animate-pulse opacity-20"
            style={{ background: cfg.color }}
          />
        )}
        <Icon className="w-5 h-5" style={{ color: cfg.color }} />
        {node.kind === 'approval' && node.state === 'blocked' && (
          <div
            className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
            style={{ background: '#8b7ac8' }}
          >
            <Lock className="w-2 h-2 text-white" />
          </div>
        )}
        {node.riskLevel === 'high' && (
          <div
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full flex items-center justify-center"
            style={{ background: '#c45a4a' }}
          >
            <AlertTriangle className="w-1.5 h-1.5 text-white" />
          </div>
        )}
      </div>
      <div className="mt-1.5 text-center px-1" style={{ maxWidth: 92 }}>
        <div
          className="text-[8px] font-semibold leading-tight"
          style={{ color: node.state === 'pending' ? TEXT.muted : TEXT.secondary }}
        >
          {node.label}
        </div>
        {node.sublabel && (
          <div className="text-[7px] mt-0.5 font-mono" style={{ color: TEXT.muted }}>
            {node.sublabel}
          </div>
        )}
        {node.approver && (
          <div className="text-[7px] mt-0.5" style={{ color: cfg.color }}>
            → {node.approver}
          </div>
        )}
      </div>
    </div>
  );
}

function DAGView({ plan }: { plan: CompiledPlan }) {
  const nodeMap = Object.fromEntries(plan.nodes.map((n) => [n.id, n]));

  const rows: string[][] = [];
  const visited = new Set<string>();
  const starts = plan.nodes.filter((n) => !plan.edges.find((e) => e.to === n.id));

  function buildRows(ids: string[], depth: number) {
    if (!ids.length) return;
    const row: string[] = [];
    const next: string[] = [];
    for (const id of ids) {
      if (visited.has(id)) continue;
      visited.add(id);
      row.push(id);
      const outgoing = plan.edges.filter((e) => e.from === id).map((e) => e.to);
      next.push(...outgoing);
    }
    if (row.length) rows.push(row);
    buildRows([...new Set(next)], depth + 1);
  }
  buildRows(
    starts.map((n) => n.id),
    0,
  );

  return (
    <div className="overflow-x-auto pb-3">
      <div className="flex flex-col gap-4 min-w-max pt-2">
        {rows.map((row, ri) => (
          <div key={ri} className="flex items-center gap-2">
            {row.map((nid, ni) => {
              const node = nodeMap[nid];
              if (!node) return null;
              const inEdges = plan.edges.filter(
                (e) => e.to === nid && rows[ri - 1]?.includes(e.from),
              );
              const edgeLabel = inEdges[0]?.label;
              const edgeType = inEdges[0]?.type ?? 'primary';
              const edgeCfg = EDGE_CFG[edgeType] ?? EDGE_CFG.primary;
              return (
                <div key={nid} className="flex items-center gap-2">
                  {(ri > 0 || ni > 0) && (
                    <div className="flex flex-col items-center" style={{ minWidth: 32 }}>
                      {edgeLabel && (
                        <div
                          className="text-[7px] font-mono mb-0.5"
                          style={{ color: edgeCfg.color }}
                        >
                          {edgeLabel}
                        </div>
                      )}
                      <ArrowRight
                        className="w-4 h-4"
                        style={{
                          color: edgeCfg.color,
                          opacity: edgeCfg.dash ? 0.6 : 0.9,
                          strokeDasharray: edgeCfg.dash ? '3 2' : undefined,
                        }}
                      />
                    </div>
                  )}
                  <NodeCard node={node} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AlloyGraphCompilerPage() {
  const [goalInput, setGoalInput] = useState('');
  const [compiledPlan, setCompiledPlan] = useState<CompiledPlan | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [_selectedNode, _setSelectedNode] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: workflowsData } = useStandardQuery({
    queryKey: ['alloy-workflows-compiler'],
    queryFn: () => api.alloyWorkflows.list({ limit: 5 }),
    staleTime: 60_000,
  });

  const realWorkflows = workflowsData?.data ?? [];

  async function compilePlan() {
    if (!goalInput.trim()) return;
    setIsCompiling(true);
    setCompiledPlan(null);
    setApiError(null);

    const match = EXAMPLE_PLANS[goalInput.trim()];
    if (match) {
      setTimeout(() => {
        setCompiledPlan(match);
        setIsCompiling(false);
      }, 600);
      return;
    }

    try {
      const result = await api.ai.plan(
        goalInput.trim(),
        'Compile this goal into an executable workflow plan with structured steps, approval gates for high-risk actions, and fallback paths.',
      );
      const plan = result.plan;
      const requiresApproval = plan.approvalRequired;
      const confidence = plan.confidence;
      const riskLevel = plan.confidence > 0.9 ? 'low' : plan.confidence > 0.75 ? 'medium' : 'high';

      const nodes: DAGNode[] = [
        {
          id: 'n1',
          kind: 'trigger',
          label: 'Goal Received',
          sublabel: 'AI planning triggered',
          state: 'ready',
        },
        {
          id: 'n2',
          kind: 'action',
          label: 'Gather Context',
          sublabel: plan.impactedOwner ? `Owner: ${plan.impactedOwner}` : 'Data collection',
          state: 'ready',
        },
        {
          id: 'n3',
          kind: 'condition',
          label: 'Data Sufficient?',
          sublabel: `Confidence ≥ ${Math.round(confidence * 100)}%`,
          state: 'ready',
        },
        {
          id: 'n4',
          kind: 'action',
          label: plan.action.slice(0, 28),
          sublabel: plan.actionType,
          state: 'ready',
        },
      ];
      const edges: DAGEdge[] = [
        { from: 'n1', to: 'n2' },
        { from: 'n2', to: 'n3' },
        { from: 'n3', to: 'n4', label: 'yes', type: 'primary' },
        { from: 'n3', to: 'f1', label: 'no', type: 'else' },
        { from: 'f1', to: 'n2', label: 'retry', type: 'fallback' },
      ];
      nodes.push({
        id: 'f1',
        kind: 'fallback',
        label: ((plan as Record<string, unknown>).fallbackPlan as string) ?? 'Request More Data',
        sublabel: 'Retry with augmented context',
        state: 'pending',
        fallbackFor: 'n3',
      });

      if (requiresApproval) {
        nodes.push({
          id: 'n5',
          kind: 'approval',
          label: `${plan.approvalLevel ?? 'Review'} Gate`,
          sublabel: 'Human approval required',
          state: 'blocked',
          approver: plan.approvalLevel ?? 'Operator',
          riskLevel: riskLevel,
        });
        edges.push({ from: 'n4', to: 'n5' });
        edges.push({ from: 'n5', to: 'n6' });
      } else {
        edges.push({ from: 'n4', to: 'n6' });
      }
      nodes.push({
        id: 'n6',
        kind: 'action',
        label: 'Deliver Output',
        sublabel: 'Final delivery + receipt',
        state: 'pending',
      });
      nodes.push({ id: 'n7', kind: 'end', label: 'Completed', state: 'pending' });
      edges.push({ from: 'n6', to: 'n7' });

      setCompiledPlan({
        goal: goalInput.trim(),
        approvalCount: requiresApproval ? 1 : 0,
        estimatedDuration: `~${Math.max(2, Math.round((1 / confidence) * 4))} min`,
        riskLevel,
        confidence,
        nodes,
        edges,
      });
    } catch {
      setApiError('AI planning service unavailable — falling back to template');
      setCompiledPlan({
        goal: goalInput.trim(),
        approvalCount: 1,
        estimatedDuration: '~4 min',
        riskLevel: 'medium',
        confidence: 0.84,
        nodes: [
          {
            id: 'n1',
            kind: 'trigger',
            label: 'Goal Received',
            sublabel: 'Manual trigger',
            state: 'ready',
          },
          {
            id: 'n2',
            kind: 'action',
            label: 'Gather Context',
            sublabel: 'Data collection phase',
            state: 'ready',
          },
          {
            id: 'n3',
            kind: 'condition',
            label: 'Data Sufficient?',
            sublabel: 'Confidence ≥ 80%',
            state: 'ready',
          },
          {
            id: 'n4',
            kind: 'action',
            label: 'Execute Primary Action',
            sublabel: 'Main workflow step',
            state: 'ready',
          },
          {
            id: 'n5',
            kind: 'approval',
            label: 'Review Gate',
            sublabel: 'Human approval required',
            state: 'blocked',
            approver: 'Operator',
            riskLevel: 'medium',
          },
          {
            id: 'n6',
            kind: 'action',
            label: 'Deliver Output',
            sublabel: 'Final delivery',
            state: 'pending',
          },
          { id: 'n7', kind: 'end', label: 'Completed', state: 'pending' },
          {
            id: 'f1',
            kind: 'fallback',
            label: 'Request More Data',
            sublabel: 'Retry data collection',
            state: 'pending',
            fallbackFor: 'n3',
          },
        ],
        edges: [
          { from: 'n1', to: 'n2' },
          { from: 'n2', to: 'n3' },
          { from: 'n3', to: 'n4', label: 'yes', type: 'primary' },
          { from: 'n3', to: 'f1', label: 'no', type: 'else' },
          { from: 'f1', to: 'n2', label: 'retry', type: 'fallback' },
          { from: 'n4', to: 'n5' },
          { from: 'n5', to: 'n6' },
          { from: 'n6', to: 'n7' },
        ],
      });
    } finally {
      setIsCompiling(false);
    }
  }

  const RISK_CFG = {
    low: { color: '#6b8f71', bg: 'rgba(107,143,113,0.08)', label: 'Low Risk' },
    medium: { color: '#c8953c', bg: 'rgba(200,149,60,0.08)', label: 'Medium Risk' },
    high: { color: '#c45a4a', bg: 'rgba(196,90,74,0.08)', label: 'High Risk' },
  };

  return (
    <div className="p-4 md:p-5 space-y-5" style={{ background: BG.page, minHeight: '100vh' }}>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <GitBranch className="w-3.5 h-3.5" style={{ color: ACCENT }} />
          <span
            className="text-[9px] font-mono uppercase tracking-widest"
            style={{ color: ACCENT }}
          >
            Counsel · Action Graph Compiler
          </span>
        </div>
        <h1 className="text-lg font-bold tracking-tight" style={{ color: TEXT.primary }}>
          Action Graph Compiler
        </h1>
        <p className="text-[11px] mt-0.5" style={{ color: TEXT.secondary }}>
          Define a goal — Counsel compiles it into an executable DAG with branch logic, fallback
          paths, and approval gates.
        </p>
        <div
          className="mt-2 flex items-center gap-1.5 text-[9px] font-mono px-2 py-1 rounded w-fit"
          style={{
            background: 'rgba(212,160,84,0.06)',
            border: '1px solid rgba(212,160,84,0.15)',
            color: '#d4a054',
          }}
        >
          <Eye className="w-3 h-3" /> SIMULATION MODE — No live execution
        </div>
        {apiError && (
          <div
            className="mt-2 flex items-center gap-1.5 text-[9px] font-mono px-2 py-1 rounded w-fit"
            style={{
              background: 'rgba(196,90,74,0.06)',
              border: '1px solid rgba(196,90,74,0.15)',
              color: '#c45a4a',
            }}
          >
            <AlertCircle className="w-3 h-3" /> {apiError}
          </div>
        )}
      </div>

      {realWorkflows.length > 0 && !compiledPlan && (
        <div
          className="rounded-md overflow-hidden"
          style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3"
            style={{ borderBottom: `1px solid ${BORDER.subtle}` }}
          >
            <Database className="w-3.5 h-3.5" style={{ color: TEXT.muted }} />
            <span className="text-[10px] font-semibold" style={{ color: TEXT.secondary }}>
              Existing Workflows
            </span>
            <span
              className="ml-auto text-[8px] font-mono px-1 py-0.5 rounded"
              style={{ color: TEXT.muted, background: 'rgba(255,255,255,0.04)' }}
            >
              {realWorkflows.length} loaded
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: BORDER.subtle }}>
            {realWorkflows.map((wf) => (
              <div
                key={wf.id}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-white/[0.015]"
                onClick={() => setGoalInput(wf.name)}
              >
                <GitBranch className="w-3 h-3 shrink-0" style={{ color: TEXT.muted }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-medium truncate" style={{ color: TEXT.primary }}>
                    {wf.name}
                  </div>
                  {wf.description && (
                    <div className="text-[8px] truncate" style={{ color: TEXT.muted }}>
                      {wf.description}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {wf.requiresApproval && (
                    <span
                      className="text-[7px] font-mono px-1 py-0.5 rounded"
                      style={{ color: '#8b7ac8', background: 'rgba(139,122,200,0.08)' }}
                    >
                      Approval
                    </span>
                  )}
                  <span
                    className="text-[7px] font-mono"
                    style={{ color: wf.isActive ? '#6b8f71' : TEXT.muted }}
                  >
                    {wf.isActive ? 'active' : 'inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className="rounded-md p-4 space-y-3"
        style={{ background: BG.surface, border: `1px solid ${BORDER.muted}` }}
      >
        <label
          className="text-[9px] font-semibold uppercase tracking-widest block"
          style={{ color: TEXT.muted }}
        >
          Goal Statement
        </label>
        <textarea
          value={goalInput}
          onChange={(e) => setGoalInput(e.target.value)}
          placeholder="Describe the goal you want Counsel to compile into an executable plan..."
          className="w-full h-20 rounded px-3 py-2.5 text-[11px] resize-none outline-none leading-relaxed"
          style={{
            background: BG.elevated,
            border: `1px solid ${BORDER.muted}`,
            color: TEXT.primary,
          }}
        />
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={compilePlan}
            disabled={isCompiling || !goalInput.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded text-[10px] font-semibold disabled:opacity-40 hover:opacity-85 transition-all"
            style={{
              background: 'rgba(212,160,84,0.12)',
              border: '1px solid rgba(212,160,84,0.22)',
              color: ACCENT,
            }}
          >
            {isCompiling ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" /> Compiling…
              </>
            ) : (
              <>
                <Cpu className="w-3 h-3" /> Compile Plan
              </>
            )}
          </button>
          <span className="text-[8px]" style={{ color: TEXT.muted }}>
            or try an example:
          </span>
          {EXAMPLE_GOALS.map((g) => (
            <button
              key={g}
              onClick={() => setGoalInput(g)}
              className="text-[8px] px-2 py-1 rounded hover:opacity-80 transition-all max-w-[200px] truncate"
              style={{
                background: BG.elevated,
                border: `1px solid ${BORDER.subtle}`,
                color: TEXT.tertiary,
              }}
            >
              {g.slice(0, 40)}…
            </button>
          ))}
        </div>
      </div>

      {compiledPlan && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: 'Approval Gates', value: compiledPlan.approvalCount, color: '#8b7ac8' },
              {
                label: 'Est. Duration',
                value: compiledPlan.estimatedDuration,
                color: TEXT.secondary,
              },
              {
                label: 'Confidence',
                value: `${Math.round(compiledPlan.confidence * 100)}%`,
                color: '#6b8f71',
              },
              {
                label: 'Risk',
                value: RISK_CFG[compiledPlan.riskLevel].label,
                color: RISK_CFG[compiledPlan.riskLevel].color,
              },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-md p-3"
                style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
              >
                <div
                  className="text-[8px] uppercase tracking-widest mb-1"
                  style={{ color: TEXT.muted }}
                >
                  {m.label}
                </div>
                <div className="text-sm font-bold font-mono" style={{ color: m.color }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          <div
            className="rounded-md p-4"
            style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <span
                  className="text-[9px] font-semibold uppercase tracking-widest"
                  style={{ color: TEXT.muted }}
                >
                  Compiled Execution Graph
                </span>
                <p className="text-[10px] mt-0.5" style={{ color: TEXT.tertiary }}>
                  Read left-to-right · dashed = fallback path · purple gates = approval required
                </p>
              </div>
              <div className="flex items-center gap-2">
                {Object.entries(NODE_CFG)
                  .filter(([k]) => k !== 'end')
                  .map(([kind, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <div key={kind} className="flex items-center gap-1">
                        <Icon className="w-2.5 h-2.5" style={{ color: cfg.color }} />
                        <span className="text-[7px] font-mono" style={{ color: TEXT.muted }}>
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
            <DAGView plan={compiledPlan} />
          </div>

          <div
            className="rounded-md overflow-hidden"
            style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
          >
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: `1px solid ${BORDER.subtle}` }}
            >
              <Shield className="w-3.5 h-3.5" style={{ color: '#8b7ac8' }} />
              <span className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>
                Approval Gates Required
              </span>
              <span
                className="ml-auto text-[8px] font-mono px-1.5 py-0.5 rounded"
                style={{ color: '#8b7ac8', background: 'rgba(139,122,200,0.08)' }}
              >
                {compiledPlan.approvalCount} gate{compiledPlan.approvalCount !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: BORDER.subtle }}>
              {compiledPlan.nodes
                .filter((n) => n.kind === 'approval')
                .map((n) => (
                  <div key={n.id} className="flex items-center gap-3 px-4 py-3">
                    <Lock className="w-3 h-3 shrink-0" style={{ color: '#8b7ac8' }} />
                    <div className="flex-1">
                      <div className="text-[10px] font-medium" style={{ color: TEXT.primary }}>
                        {n.label}
                      </div>
                      <div className="text-[8px] mt-0.5" style={{ color: TEXT.muted }}>
                        Approver: {n.approver}
                      </div>
                    </div>
                    <span
                      className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        color: RISK_CFG[n.riskLevel ?? 'medium'].color,
                        background: RISK_CFG[n.riskLevel ?? 'medium'].bg,
                      }}
                    >
                      {RISK_CFG[n.riskLevel ?? 'medium'].label}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div
            className="rounded-md overflow-hidden"
            style={{ background: BG.surface, border: `1px solid ${BORDER.subtle}` }}
          >
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: `1px solid ${BORDER.subtle}` }}
            >
              <RotateCcw className="w-3.5 h-3.5" style={{ color: '#c8953c' }} />
              <span className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>
                Fallback Paths
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: BORDER.subtle }}>
              {compiledPlan.nodes
                .filter((n) => n.kind === 'fallback')
                .map((n) => (
                  <div key={n.id} className="flex items-center gap-3 px-4 py-3">
                    <Split className="w-3 h-3 shrink-0" style={{ color: '#c8953c' }} />
                    <div className="flex-1">
                      <div className="text-[10px] font-medium" style={{ color: TEXT.primary }}>
                        {n.label}
                      </div>
                      {n.sublabel && (
                        <div className="text-[8px] mt-0.5" style={{ color: TEXT.muted }}>
                          {n.sublabel}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="w-3 h-3" style={{ color: TEXT.muted }} />
                  </div>
                ))}
              {compiledPlan.nodes.filter((n) => n.kind === 'fallback').length === 0 && (
                <div className="px-4 py-3 text-[9px]" style={{ color: TEXT.muted }}>
                  No fallback paths in this plan
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              className="flex items-center gap-1.5 px-4 py-2 rounded text-[10px] font-semibold opacity-50 cursor-not-allowed"
              style={{
                background: 'rgba(107,143,113,0.1)',
                border: '1px solid rgba(107,143,113,0.2)',
                color: '#6b8f71',
              }}
            >
              <Play className="w-3 h-3" /> Execute (Requires Approval)
            </button>
            <p className="text-[8px]" style={{ color: TEXT.muted }}>
              Live execution requires COVENANT policy clearance and approval gate sign-off.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
