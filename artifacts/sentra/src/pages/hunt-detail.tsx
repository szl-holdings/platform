import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  Building2,
  CheckCircle2,
  ChevronLeft,
  CircleDollarSign,
  Clock,
  FileText,
  Gavel,
  Layers,
  Link2,
  Loader2,
  Network,
  Ship,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  User,
  Wifi,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'wouter';
import { HUNTS, type HuntNode } from '@/data/hunt-data';
import { approveHunt, approveRemediation, dismissHunt } from '@/lib/sentra-api';

const NODE_ICON: Record<HuntNode['type'], typeof ShieldAlert> = {
  endpoint: ShieldAlert,
  credential: User,
  network: Wifi,
  identity: User,
  data: FileText,
  business: Building2,
};

const DOMAIN_ICON: Record<HuntNode['domain'], typeof Building2> = {
  tech: Network,
  deal: CircleDollarSign,
  vessel: Ship,
  matter: Gavel,
  finance: CircleDollarSign,
};

const RISK_CONFIG = {
  critical: {
    border: 'border-red-500/50',
    bg: 'bg-red-500/5',
    dot: 'bg-red-500',
    text: 'text-red-400',
    label: 'CRITICAL',
  },
  high: {
    border: 'border-orange-400/50',
    bg: 'bg-orange-400/5',
    dot: 'bg-orange-400',
    text: 'text-orange-300',
    label: 'HIGH',
  },
  medium: {
    border: 'border-yellow-400/40',
    bg: 'bg-yellow-400/5',
    dot: 'bg-yellow-400',
    text: 'text-yellow-300',
    label: 'MED',
  },
  low: {
    border: 'border-slate-700',
    bg: 'bg-slate-800/30',
    dot: 'bg-slate-500',
    text: 'text-slate-400',
    label: 'LOW',
  },
};

function NodeCard({ node, active, onClick }: { node: HuntNode; active: boolean; onClick: () => void }) {
  const risk = RISK_CONFIG[node.risk];
  const Icon = NODE_ICON[node.type];
  const DomainIcon = DOMAIN_ICON[node.domain];

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-lg border p-3 transition-all',
        risk.border,
        risk.bg,
        active ? 'ring-1 ring-[#f5f5f5]/30 shadow-lg' : 'hover:brightness-110',
      )}
    >
      <div className="flex items-start gap-2">
        <div
          className={cn(
            'w-7 h-7 rounded flex items-center justify-center shrink-0 mt-0.5',
            node.domain === 'tech' ? 'bg-slate-800' : 'bg-slate-700/80',
          )}
        >
          {node.businessLabel ? (
            <DomainIcon className={cn('w-3.5 h-3.5', risk.text)} />
          ) : (
            <Icon className={cn('w-3.5 h-3.5', risk.text)} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-semibold text-slate-200 leading-tight">{node.label}</span>
            {node.businessLabel && (
              <span
                className={cn(
                  'text-[8px] font-mono px-1 py-0.5 rounded uppercase tracking-wider border',
                  risk.border,
                  risk.text,
                )}
              >
                {node.businessLabel}
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 leading-snug mt-0.5 line-clamp-2">{node.description}</p>
          {node.costAtRisk != null && node.costAtRisk > 0 && (
            <div className={cn('text-[10px] font-mono mt-1.5 font-bold', risk.text)}>
              ${(node.costAtRisk / 1000000).toFixed(1)}M at risk
            </div>
          )}
        </div>
        <span
          className={cn('text-[8px] font-mono px-1 py-0.5 rounded-sm font-bold shrink-0', risk.text)}
        >
          {risk.label}
        </span>
      </div>
    </button>
  );
}

function AttackPathVisualization({ hunt }: { hunt: (typeof HUNTS)[0] }) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const { nodes, edges } = hunt.attackPath;
  const techNodes = nodes.filter((n) => n.domain === 'tech');
  const businessNodes = nodes.filter((n) => n.domain !== 'tech');
  const selectedEdges = selectedNode
    ? edges.filter((e) => e.from === selectedNode || e.to === selectedNode)
    : [];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Network className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              Technical Attack Chain
            </span>
          </div>
          <div className="space-y-2">
            {techNodes.map((node, idx) => (
              <div key={node.id} className="relative">
                <NodeCard
                  node={node}
                  active={selectedNode === node.id}
                  onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                />
                {idx < techNodes.length - 1 && (
                  <div className="flex items-center gap-2 py-1.5 pl-5">
                    <div className="w-px h-3 bg-slate-700 mx-2.5" />
                    {(() => {
                      const edge = edges.find((e) => e.from === node.id && e.to === techNodes[idx + 1].id);
                      return edge ? (
                        <span className="text-[9px] font-mono text-slate-600 truncate">
                          {edge.mitreId} — {edge.technique}
                        </span>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              Business Impact Entities
            </span>
          </div>
          <div className="space-y-2">
            {businessNodes.map((node) => (
              <NodeCard
                key={node.id}
                node={node}
                active={selectedNode === node.id}
                onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
              />
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider">
                Total Blast Radius
              </span>
            </div>
            <div className="text-2xl font-mono font-bold text-red-400">
              ${(hunt.attackPath.blastRadiusCost / 1000000).toFixed(1)}M
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Estimated business impact if attack path completes uncontained
            </p>
          </div>
        </div>
      </div>

      {selectedNode && selectedEdges.length > 0 && (
        <div className="rounded-lg border border-[#c9b787]/20 bg-[#c9b787]/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-3.5 h-3.5 text-[#c9b787]" />
            <span className="text-[10px] font-mono text-[#c9b787] uppercase tracking-wider">
              Traversal Edges — {nodes.find((n) => n.id === selectedNode)?.label}
            </span>
          </div>
          <div className="space-y-2">
            {selectedEdges.map((edge, i) => {
              const fromNode = nodes.find((n) => n.id === edge.from);
              const toNode = nodes.find((n) => n.id === edge.to);
              return (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  <span className="text-slate-400 truncate max-w-[120px]">{fromNode?.label}</span>
                  <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                  <span className="text-slate-400 truncate max-w-[120px]">{toNode?.label}</span>
                  <span className="text-slate-600 mx-1">—</span>
                  <span className="font-mono text-[10px] text-slate-500">{edge.mitreId}</span>
                  <span className="text-slate-700">·</span>
                  <span className="text-slate-600">{edge.technique}</span>
                  <span className="ml-auto font-mono text-[10px] text-emerald-400">
                    {Math.round(edge.confidence * 100)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HuntDetailPage() {
  const { id } = useParams<{ id: string }>();
  const hunt = HUNTS.find((h) => h.id === id);
  const [activeTab, setActiveTab] = useState<'path' | 'reasoning' | 'remediation'>('path');
  const [remApproved, setRemApproved] = useState(false);
  const [approving, setApproving] = useState(false);
  const [signalsSent, setSignalsSent] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  if (!hunt) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ShieldAlert className="w-8 h-8 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">Hunt not found.</p>
          <Link href="/hunt">
            <button className="mt-4 text-xs text-[#c9b787] hover:underline">← Back to Hunts</button>
          </Link>
        </div>
      </div>
    );
  }

  const handleApproveRemediation = async () => {
    setApproving(true);
    setApprovalError(null);
    try {
      const huntRes = await approveHunt(hunt.id, {
        huntTitle: hunt.title,
        severity: hunt.severity,
        blastRadiusCost: hunt.attackPath.blastRadiusCost,
        affectedBusinessEntities: hunt.attackPath.affectedBusinessEntities,
        approvedBy: 'Analyst',
      });
      if (!huntRes.ok) throw new Error(huntRes.error);
      const remRes = await approveRemediation(`rem-${hunt.id}`, {
        huntId: hunt.id,
        huntTitle: hunt.title,
        blastRadiusCost: hunt.attackPath.blastRadiusCost,
        stepCount: REMEDIATION_STEPS.length,
        approvedBy: 'Analyst',
        signalsBroadcast: [
          `sentra.remediation.active → ${hunt.id}`,
          'vessels.alert.potential-disruption',
          'counsel.alert.regulatory-review-required',
          'pulse.briefing.incident-update',
        ],
      });
      if (!remRes.ok) throw new Error(remRes.error);
      setRemApproved(true);
      setTimeout(() => setSignalsSent(true), 800);
    } catch (err) {
      setApprovalError(err instanceof Error ? err.message : 'Approval failed — please retry');
    } finally {
      setApproving(false);
    }
  };

  const handleDismissHunt = async () => {
    setDismissing(true);
    try {
      await dismissHunt(hunt.id, { reason: 'Analyst review: false positive', dismissedBy: 'Analyst' });
    } catch {
    } finally {
      setDismissing(false);
      setDismissed(true);
    }
  };

  const REMEDIATION_STEPS = [
    {
      order: 1,
      action: 'Isolate initial beachhead endpoint',
      target: hunt.attackPath.nodes[0]?.label ?? 'Source endpoint',
      requiredApproval: true,
      reversible: true,
      estimatedMinutes: 2,
    },
    {
      order: 2,
      action: 'Revoke compromised credentials / tokens',
      target: hunt.attackPath.nodes[1]?.label ?? 'Identity layer',
      requiredApproval: true,
      reversible: false,
      estimatedMinutes: 8,
    },
    {
      order: 3,
      action: 'Block lateral movement pivot path',
      target: 'Network segmentation — VLAN enforcement',
      requiredApproval: false,
      reversible: true,
      estimatedMinutes: 5,
    },
    {
      order: 4,
      action: 'Notify affected business units',
      target: hunt.attackPath.affectedBusinessEntities.join(', '),
      requiredApproval: false,
      reversible: false,
      estimatedMinutes: 10,
    },
    {
      order: 5,
      action: 'Draft regulatory notification (if required)',
      target: 'Counsel — compliance obligation review',
      requiredApproval: true,
      reversible: false,
      estimatedMinutes: 20,
    },
  ];

  const tabs = [
    { id: 'path' as const, label: 'Attack Path', icon: Target },
    { id: 'reasoning' as const, label: 'Agent Reasoning', icon: Brain },
    { id: 'remediation' as const, label: 'Remediation Plan', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/hunt">
          <button className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
            Threat Hunt
          </button>
        </Link>
        <span className="text-slate-700">/</span>
        <span className="text-xs text-slate-400 truncate">{hunt.title}</span>
      </div>

      <div className="sentra-panel p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className={cn(
                  'text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider',
                  RISK_CONFIG[hunt.severity].border,
                  RISK_CONFIG[hunt.severity].text,
                  RISK_CONFIG[hunt.severity].bg,
                )}
              >
                {RISK_CONFIG[hunt.severity].label}
              </span>
              {hunt.mitreIds.map((id) => (
                <span
                  key={id}
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400"
                >
                  {id}
                </span>
              ))}
            </div>
            <h1 className="text-xl font-display font-bold text-slate-100 mb-1">{hunt.title}</h1>
            <p className="text-sm text-slate-400">{hunt.hypothesis}</p>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              {hunt.signalCount} signals
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {(() => {
                const m = Math.floor((Date.now() - new Date(hunt.proposedAt).getTime()) / 60000);
                return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`;
              })()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: 'Confidence',
              value: `${Math.round(hunt.confidenceScore * 100)}%`,
              color: 'text-emerald-400',
            },
            {
              label: 'False Positive Rate',
              value: `${Math.round(hunt.falsePositiveRate * 100)}%`,
              color:
                hunt.falsePositiveRate <= 0.05
                  ? 'text-emerald-400'
                  : hunt.falsePositiveRate <= 0.15
                    ? 'text-[#c9b787]'
                    : 'text-red-400',
            },
            {
              label: 'Blast Radius',
              value: `$${(hunt.attackPath.blastRadiusCost / 1000000).toFixed(1)}M`,
              color: 'text-red-400',
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg bg-slate-800/40 border border-slate-800 px-3 py-2.5">
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1">
                {label}
              </div>
              <div className={cn('text-lg font-mono font-bold', color)}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-800">
        {tabs.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px',
              activeTab === tabId
                ? 'border-[#f5f5f5]/50 text-[#f5f5f5]'
                : 'border-transparent text-slate-500 hover:text-slate-300',
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'path' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              Simulated Attack Path — Click a node to inspect traversal edges
            </span>
          </div>
          <AttackPathVisualization hunt={hunt} />
        </div>
      )}

      {activeTab === 'reasoning' && (
        <div className="space-y-4">
          <div className="sentra-panel p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#c9b787]" />
              <span className="text-[10px] font-mono text-[#c9b787] uppercase tracking-wider">
                Hunt Proposer Reasoning Trace
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{hunt.reasoning}</p>
          </div>

          <div className="sentra-panel p-5">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-3">
              MITRE ATT&CK Coverage
            </div>
            <div className="space-y-2">
              {hunt.mitreTactics.map((tactic, i) => (
                <div key={tactic} className="flex items-center gap-3">
                  <span className="text-[9px] font-mono text-slate-600 w-20 shrink-0">
                    {hunt.mitreIds[i]}
                  </span>
                  <span className="text-xs text-slate-400">{tactic}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sentra-panel p-5">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-3">
              Affected Business Ontology
            </div>
            <div className="space-y-2">
              {hunt.attackPath.affectedBusinessEntities.map((entity) => (
                <div key={entity} className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-[#c9b787]" />
                  <span className="text-sm text-slate-300">{entity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'remediation' && (
        <div className="space-y-4">
          <div className="sentra-panel p-4 flex items-start gap-3">
            <Brain className="w-4 h-4 text-[#c9b787] shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] font-mono text-[#c9b787] uppercase tracking-wider mb-1">
                Auto-Drafted Remediation Plan
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                This remediation plan was automatically generated by the agentic operator. Review each
                step carefully. Steps marked as requiring approval will pause for CISO sign-off.
                Approving this plan broadcasts signals to the event bus — other products (Counsel,
                Vessels, Pulse) will react automatically.
              </p>
            </div>
          </div>

          {remApproved && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-emerald-400 mb-1">
                  Remediation Plan Approved
                </div>
                <p className="text-[11px] text-slate-400">
                  Agentic operator is executing the plan. Steps requiring approval will pause for CISO
                  confirmation.
                </p>
                {signalsSent && (
                  <div className="mt-2 space-y-1">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      Signals broadcast to bus:
                    </div>
                    {[
                      'sentra.remediation.active → ' + hunt.id,
                      'vessels.alert.potential-disruption',
                      'counsel.alert.regulatory-review-required',
                      'pulse.briefing.incident-update',
                    ].map((sig) => (
                      <div key={sig} className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        {sig}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {REMEDIATION_STEPS.map((step, idx) => (
              <div
                key={step.order}
                className={cn(
                  'sentra-panel p-4 flex items-start gap-4',
                  remApproved && idx < 2 && 'opacity-70',
                )}
              >
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold border',
                      remApproved && idx < 2
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400',
                    )}
                  >
                    {remApproved && idx < 2 ? '✓' : step.order}
                  </div>
                  {idx < REMEDIATION_STEPS.length - 1 && (
                    <div className="w-px h-6 bg-slate-800" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-slate-200">{step.action}</span>
                    {step.requiredApproval && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-[#c9b787]/30 text-[#c9b787] bg-[#c9b787]/5 uppercase">
                        Approval Required
                      </span>
                    )}
                    {!step.reversible && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-red-500/30 text-red-400 bg-red-500/5 uppercase">
                        Irreversible
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mb-0.5">
                    Target:{' '}
                    <span className="text-slate-400 font-mono">{step.target}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-600">
                    <Clock className="w-3 h-3" />
                    ~{step.estimatedMinutes}m estimated
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!remApproved && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleApproveRemediation}
                  disabled={approving}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-lg border text-sm font-semibold transition-all',
                    approving
                      ? 'border-slate-700 text-slate-500 cursor-not-allowed'
                      : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/60',
                  )}
                >
                  {approving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  {approving ? 'Submitting for Approval…' : 'Approve & Execute Remediation Plan'}
                </button>
                <button
                  onClick={handleDismissHunt}
                  disabled={dismissing || dismissed}
                  className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-500 text-sm hover:border-slate-600 hover:text-slate-400 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {dismissed ? 'Dismissed' : dismissing ? 'Dismissing…' : 'Dismiss Hunt'}
                </button>
              </div>
              {approvalError && (
                <p className="text-xs text-red-400">{approvalError}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
