import {
  getCounselListMattersQueryKey,
  useCounselUpdateObligation,
} from '@szl-holdings/api-client-react';
import { GraphCanvas } from '@szl-holdings/design-system';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  Building,
  CheckCircle,
  ChevronDown,
  Circle,
  Clock,
  FileText,
  Gavel,
  Hash,
  Lock,
  Move,
  Network,
  RotateCcw,
  Scale,
  User,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { type Obligation, type ObligationStatus, type Party, type PartyRole, type ProofChainEntry, daysUntil, findMatterById, formatDeadline, getObligationStatusColor, getPrivilegeColor, useMatters } from '@/data/matters';
import {
  ACCENT,
  buildGraph,
  CRITICAL_COLOR,
  FILING_COLOR,
  ROLE_COLORS,
} from '@/lib/obligation-graph-builder';

const STATUS_VALUES: ObligationStatus[] = [
  'pending',
  'in-progress',
  'complete',
  'overdue',
  'at-risk',
];

function ObligationStatusSelect({ obligation }: { obligation: Obligation }) {
  const queryClient = useQueryClient();
  const update = useCounselUpdateObligation();
  const [optimistic, setOptimistic] = useState<ObligationStatus | null>(null);
  const value = optimistic ?? obligation.status;
  const handleChange = (next: ObligationStatus) => {
    if (next === obligation.status) return;
    setOptimistic(next);
    const completedDate = next === 'complete' ? new Date().toISOString().split('T')[0] : undefined;
    update.mutate(
      {
        id: obligation.id,
        data: {
          matterId: obligation.matterId,
          status: next,
          ...(completedDate ? { completedDate } : {}),
        },
      },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: getCounselListMattersQueryKey() });
          setOptimistic(null);
        },
        onError: () => {
          setOptimistic(null);
        },
      },
    );
  };
  return (
    <select
      data-testid={`select-obligation-status-${obligation.id}`}
      value={value}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        e.stopPropagation();
        handleChange(e.target.value as ObligationStatus);
      }}
      disabled={update.isPending}
      className="text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-white/70 focus:outline-none focus:border-purple-500/40 disabled:opacity-50"
      style={{ color: getObligationStatusColor(value) }}
    >
      {STATUS_VALUES.map((s) => (
        <option key={s} value={s} style={{ color: '#000' }}>
          {s}
        </option>
      ))}
    </select>
  );
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  complete: <CheckCircle className="w-3 h-3 text-green-400" />,
  'in-progress': (
    <div
      className="w-3 h-3 rounded-full border-2 animate-spin"
      style={{ borderColor: 'rgba(167,139,250,0.2)', borderTopColor: ACCENT }}
    />
  ),
  'at-risk': <AlertTriangle className="w-3 h-3 text-orange-400" />,
  overdue: <AlertTriangle className="w-3 h-3 text-red-400" />,
  pending: <Circle className="w-3 h-3 text-white/20" />,
};

const ROLE_ICONS: Record<PartyRole, React.ReactNode> = {
  client: <Building className="w-3.5 h-3.5" />,
  'opposing-counsel': <Scale className="w-3.5 h-3.5" />,
  regulator: <Gavel className="w-3.5 h-3.5" />,
  'third-party': <User className="w-3.5 h-3.5" />,
  expert: <FileText className="w-3.5 h-3.5" />,
  'co-counsel': <Scale className="w-3.5 h-3.5" />,
};

function ObligationDetail({
  obligation,
  allObligations,
  isCritical,
}: {
  obligation: Obligation;
  allObligations: Obligation[];
  isCritical: boolean;
}) {
  const color = getObligationStatusColor(obligation.status);
  const privColor = getPrivilegeColor(obligation.privilegeLevel);
  const deps = obligation.dependencies
    .map((id) => allObligations.find((o) => o.id === id))
    .filter(Boolean) as Obligation[];
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        {STATUS_ICONS[obligation.status]}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white/90 leading-snug">{obligation.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full"
              style={{ background: `${privColor}20`, color: privColor }}
            >
              {obligation.privilegeLevel}
            </span>
            <span
              className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full"
              style={{ background: `${color}18`, color }}
            >
              {obligation.status}
            </span>
            {isCritical && (
              <span
                className="flex items-center gap-1 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(239,68,68,0.12)', color: CRITICAL_COLOR }}
              >
                <Zap className="w-2.5 h-2.5" /> Critical Path
              </span>
            )}
          </div>
        </div>
      </div>
      <p className="text-xs text-white/55 leading-relaxed">{obligation.description}</p>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <p className="text-[9px] text-white/30 uppercase tracking-wider">Due</p>
          <p style={{ color }} className="flex items-center gap-1 mt-0.5">
            <Clock className="w-2.5 h-2.5" />
            {formatDeadline(obligation.dueDate)}
          </p>
        </div>
        <div>
          <p className="text-[9px] text-white/30 uppercase tracking-wider">Assignee</p>
          <p className="text-white/60 mt-0.5">{obligation.assignee}</p>
        </div>
        {obligation.courtId && (
          <div className="col-span-2">
            <p className="text-[9px] text-white/30 uppercase tracking-wider">Court / Filing ID</p>
            <p className="font-mono text-white/50 mt-0.5">{obligation.courtId}</p>
          </div>
        )}
      </div>
      {obligation.consequence && (
        <div
          className="flex items-start gap-2 p-2.5 rounded-lg"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}
        >
          <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-400/80">{obligation.consequence}</p>
        </div>
      )}
      {deps.length > 0 && (
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Depends on</p>
          <div className="space-y-1.5">
            {deps.map((dep) => (
              <div key={dep.id} className="flex items-center gap-2 text-[11px] text-white/40">
                <ArrowRight className="w-2.5 h-2.5 text-white/20" />
                <span className="flex-1 truncate">{dep.title}</span>
                <span style={{ color: getObligationStatusColor(dep.status) }}>{dep.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="text-[10px] text-white/30">{daysUntil(obligation.dueDate)} days from now</div>
    </div>
  );
}

function PartyDetail({ party }: { party: Party }) {
  const color = ROLE_COLORS[party.role];
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color}18`, color }}
        >
          {ROLE_ICONS[party.role]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white/90 leading-snug">{party.name}</p>
          <p className="text-[10px] capitalize mt-0.5" style={{ color }}>
            {party.role.replace('-', ' ')}
          </p>
        </div>
      </div>
      <div className="space-y-2 text-[11px]">
        {party.counsel && (
          <div>
            <p className="text-[9px] text-white/30 uppercase tracking-wider">Counsel</p>
            <p className="text-white/60 mt-0.5">{party.counsel}</p>
          </div>
        )}
        {party.jurisdiction && (
          <div>
            <p className="text-[9px] text-white/30 uppercase tracking-wider">Jurisdiction</p>
            <p className="text-white/60 mt-0.5">{party.jurisdiction}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilingDetail({ filing }: { filing: ProofChainEntry }) {
  const privColor = getPrivilegeColor(filing.privilegeLevel);
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${FILING_COLOR}18`, color: FILING_COLOR }}
        >
          <FileText className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white/90 leading-snug">{filing.title}</p>
          <p className="text-[10px] mt-0.5" style={{ color: FILING_COLOR }}>
            Court Filing
          </p>
        </div>
      </div>
      <p className="text-xs text-white/55 leading-relaxed">{filing.summary}</p>
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <p className="text-[9px] text-white/30 uppercase tracking-wider">Author</p>
          <p className="text-white/60 mt-0.5">{filing.author}</p>
        </div>
        <div>
          <p className="text-[9px] text-white/30 uppercase tracking-wider">Privilege</p>
          <p className="mt-0.5 uppercase" style={{ color: privColor }}>
            {filing.privilegeLevel}
          </p>
        </div>
        {filing.documentRef && (
          <div className="col-span-2">
            <p className="text-[9px] text-white/30 uppercase tracking-wider">Reference</p>
            <p className="font-mono text-white/50 mt-0.5">{filing.documentRef}</p>
          </div>
        )}
        {filing.hash && (
          <div className="col-span-2">
            <p className="text-[9px] text-white/30 uppercase tracking-wider flex items-center gap-1">
              <Hash className="w-2.5 h-2.5" /> Hash
            </p>
            <p className="font-mono text-white/40 mt-0.5 truncate">{filing.hash}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ObligationCard({
  obligation,
  allObligations,
  index,
}: {
  obligation: Obligation;
  allObligations: Obligation[];
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const color = getObligationStatusColor(obligation.status);
  const privColor = getPrivilegeColor(obligation.privilegeLevel);
  const deps = obligation.dependencies
    .map((depId) => allObligations.find((o) => o.id === depId))
    .filter(Boolean);

  return (
    <div className="relative">
      {index > 0 && (
        <div
          className="absolute -top-3 left-5 w-px h-3"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        />
      )}
      <div
        className="rounded-xl border border-white/5 overflow-hidden hover:border-white/10 transition-colors"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="p-4 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
              {STATUS_ICONS[obligation.status]}
              {deps.length > 0 && (
                <div className="w-px h-4" style={{ background: 'rgba(255,255,255,0.08)' }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-white/85 leading-snug">
                  {obligation.title}
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  {obligation.filingRequired && (
                    <span
                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(167,139,250,0.12)', color: ACCENT }}
                    >
                      FILING
                    </span>
                  )}
                  <span
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase"
                    style={{ background: `${privColor}20`, color: privColor }}
                  >
                    {obligation.privilegeLevel}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[10px] flex-wrap">
                <div className="flex items-center gap-1" style={{ color }}>
                  <Clock className="w-2.5 h-2.5" />
                  {formatDeadline(obligation.dueDate)}
                </div>
                <span className="text-white/30">·</span>
                <span className="text-white/40">{obligation.assignee}</span>
                {obligation.courtId && (
                  <>
                    <span className="text-white/30">·</span>
                    <span className="font-mono text-white/30">{obligation.courtId}</span>
                  </>
                )}
                <span className="text-white/30">·</span>
                <ObligationStatusSelect obligation={obligation} />
              </div>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-white/20 shrink-0 mt-1 transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>

        {expanded && (
          <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
            <p className="text-xs text-white/50 leading-relaxed">{obligation.description}</p>
            {obligation.consequence && (
              <div
                className="flex items-start gap-2 p-2.5 rounded-lg"
                style={{
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.12)',
                }}
              >
                <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-red-400/80">{obligation.consequence}</p>
              </div>
            )}
            {deps.length > 0 && (
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">
                  Depends on
                </p>
                <div className="space-y-1.5">
                  {deps.map(
                    (dep) =>
                      dep && (
                        <div
                          key={dep.id}
                          className="flex items-center gap-2 text-[11px] text-white/40"
                        >
                          <ArrowRight className="w-2.5 h-2.5 text-white/20" />
                          <span>{dep.title}</span>
                          <span
                            className="ml-auto"
                            style={{ color: getObligationStatusColor(dep.status) }}
                          >
                            {dep.status}
                          </span>
                        </div>
                      ),
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PartyNode({ party }: { party: Party }) {
  const color = ROLE_COLORS[party.role];
  const icon = ROLE_ICONS[party.role];
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${color}18`, color }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white/80 leading-snug">{party.name}</p>
        <p className="text-[10px] capitalize mt-0.5" style={{ color }}>
          {party.role.replace('-', ' ')}
        </p>
        {party.counsel && (
          <p className="text-[10px] text-white/30 mt-0.5 truncate">{party.counsel}</p>
        )}
        {party.jurisdiction && (
          <p className="text-[10px] text-white/20 mt-0.5">{party.jurisdiction}</p>
        )}
      </div>
    </div>
  );
}

export default function ObligationGraph() {
  const [, params] = useRoute('/obligation-graph/:matterId');
  const [, navigate] = useLocation();
  const { matters, isLoading } = useMatters();
  const [selectedMatterId, setSelectedMatterId] = useState<string>(params?.matterId ?? '');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<'parties' | 'obligations' | null>(
    'obligations',
  );

  const effectiveId = selectedMatterId || matters[0]?.id || '';
  const matter = useMemo(
    () => findMatterById(matters, effectiveId) ?? matters[0],
    [matters, effectiveId],
  );

  // Reset selection when matter changes
  useEffect(() => {
    setSelectedNodeId(null);
  }, [selectedMatterId]);

  // Custom node positions (per matter), persisted in localStorage so lawyers
  // can clean up the layout for screenshots, depositions, etc.
  const positionsKey = matter ? `prism-counsel:obligation-graph:positions:${matter.id}` : '';
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    if (!positionsKey) {
      setNodePositions({});
      return;
    }
    try {
      const raw = localStorage.getItem(positionsKey);
      setNodePositions(raw ? JSON.parse(raw) : {});
    } catch {
      setNodePositions({});
    }
  }, [positionsKey]);

  const persistPositions = (next: Record<string, { x: number; y: number }>) => {
    if (!positionsKey) return;
    try {
      if (Object.keys(next).length === 0) localStorage.removeItem(positionsKey);
      else localStorage.setItem(positionsKey, JSON.stringify(next));
    } catch {
      // ignore storage failures (private mode, quota, etc.)
    }
  };

  const handleNodeDrag = (id: string, x: number, y: number) => {
    setNodePositions((prev) => ({ ...prev, [id]: { x, y } }));
  };

  const handleNodeDragEnd = (id: string, x: number, y: number) => {
    setNodePositions((prev) => {
      const next = { ...prev, [id]: { x, y } };
      persistPositions(next);
      return next;
    });
  };

  const handleResetLayout = () => {
    setNodePositions({});
    persistPositions({});
  };

  const hasCustomLayout = Object.keys(nodePositions).length > 0;

  const { graphNodes, graphEdges, nodeData, criticalIds } = useMemo(
    () => buildGraph(matter, { selectedId: selectedNodeId, overrides: nodePositions }),
    [matter, selectedNodeId, nodePositions],
  );

  const obligsByStatus = useMemo(
    () => ({
      critical: matter
        ? matter.obligations.filter((o) => o.status === 'at-risk' || o.status === 'overdue')
        : [],
      active: matter ? matter.obligations.filter((o) => o.status === 'in-progress') : [],
      pending: matter ? matter.obligations.filter((o) => o.status === 'pending') : [],
      complete: matter ? matter.obligations.filter((o) => o.status === 'complete') : [],
    }),
    [matter],
  );

  if (!matter) {
    return (
      <div className="p-6 text-xs text-white/30">
        {isLoading ? 'Loading matters…' : 'No matters available.'}
      </div>
    );
  }

  const selected = selectedNodeId ? nodeData[selectedNodeId] : null;
  const criticalObligationCount = matter.obligations.filter((o) =>
    criticalIds.has(`oblig:${o.id}`),
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Network className="w-4 h-4" style={{ color: ACCENT }} />
            <h1 className="text-lg font-semibold font-display text-white/90">Obligation Graph</h1>
          </div>
          <p className="text-xs text-white/30">Parties · Deadlines · Dependencies · Consequences</p>
        </div>
      </div>

      <div>
        <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-2">
          Matter
        </label>
        <select
          value={effectiveId}
          onChange={(e) => {
            setSelectedMatterId(e.target.value);
            navigate(`/obligation-graph/${e.target.value}`);
          }}
          className="text-sm bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white/70 focus:outline-none focus:border-purple-500/40 w-full max-w-md"
        >
          {matters.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.matterNumber})
            </option>
          ))}
        </select>
      </div>

      {/* Interactive Network */}
      <div
        className="rounded-2xl border border-white/5 overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/5 flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: ROLE_COLORS.client }} />
              <span className="text-[10px] text-white/40">Party</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: ACCENT }} />
              <span className="text-[10px] text-white/40">Obligation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: FILING_COLOR }} />
              <span className="text-[10px] text-white/40">Court Filing</span>
            </div>
            <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-white/10">
              <span
                className="w-2 h-2 rounded-full ring-2"
                style={{ background: 'transparent', boxShadow: `0 0 0 2px ${CRITICAL_COLOR}` }}
              />
              <span className="text-[10px]" style={{ color: CRITICAL_COLOR }}>
                Critical Path ({criticalObligationCount})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-white/30 hidden sm:flex items-center gap-1">
              <Move className="w-2.5 h-2.5" /> Drag nodes to reposition · Click for details
            </p>
            <button
              type="button"
              onClick={handleResetLayout}
              disabled={!hasCustomLayout}
              className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: hasCustomLayout ? 'rgba(167,139,250,0.10)' : 'rgba(255,255,255,0.02)',
                borderColor: hasCustomLayout ? 'rgba(167,139,250,0.30)' : 'rgba(255,255,255,0.08)',
                color: hasCustomLayout ? ACCENT : 'rgba(255,255,255,0.35)',
              }}
              title={
                hasCustomLayout
                  ? 'Restore the auto-computed layout'
                  : 'No custom positions to reset'
              }
            >
              <RotateCcw className="w-2.5 h-2.5" />
              Reset Layout
            </button>
          </div>
        </div>
        <div className="grid lg:grid-cols-[1fr_320px]">
          <div className="relative">
            <GraphCanvas
              nodes={graphNodes}
              edges={graphEdges}
              height={460}
              background="transparent"
              showLabels
              onNodeClick={(n) => setSelectedNodeId(n.id)}
              onNodeDrag={handleNodeDrag}
              onNodeDragEnd={handleNodeDragEnd}
              className="border-0 rounded-none"
            />
          </div>
          <div className="border-t lg:border-t-0 lg:border-l border-white/5 p-4 min-h-[180px]">
            {selected ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">Detail</p>
                  <button
                    onClick={() => setSelectedNodeId(null)}
                    className="text-white/30 hover:text-white/60 transition-colors"
                    aria-label="Close detail"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {selected.kind === 'obligation' && selected.obligation && (
                  <ObligationDetail
                    obligation={selected.obligation}
                    allObligations={matter.obligations}
                    isCritical={criticalIds.has(`oblig:${selected.obligation.id}`)}
                  />
                )}
                {selected.kind === 'party' && selected.party && (
                  <PartyDetail party={selected.party} />
                )}
                {selected.kind === 'filing' && selected.filing && (
                  <FilingDetail filing={selected.filing} />
                )}
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-8">
                <Network className="w-6 h-6 text-white/15 mb-2" />
                <p className="text-xs text-white/40">Click any node to inspect</p>
                <p className="text-[10px] text-white/25 mt-1">
                  Red rings mark the critical deadline chain
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl border border-white/5 overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="p-5 border-b border-white/5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-sm font-semibold text-white/85">{matter.name}</h2>
              <p className="text-xs text-white/30 mt-0.5 font-mono">
                {matter.matterNumber} · {matter.jurisdiction}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {matter.wall.enabled && (
                <span
                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full privilege-glow"
                  style={{
                    background: 'rgba(239,68,68,0.10)',
                    color: '#ef4444',
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}
                >
                  <Lock className="w-2.5 h-2.5" />
                  Matter Wall Active
                </span>
              )}
              <span
                className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full"
                style={{
                  background: `${getPrivilegeColor(matter.privilegeLevel)}20`,
                  color: getPrivilegeColor(matter.privilegeLevel),
                }}
              >
                {matter.privilegeLevel}
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Obligations', value: String(matter.obligations.length) },
              { label: 'At Risk', value: String(obligsByStatus.critical.length), color: '#f97316' },
              { label: 'In Progress', value: String(obligsByStatus.active.length), color: ACCENT },
              {
                label: 'Complete',
                value: String(obligsByStatus.complete.length),
                color: '#22c55e',
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg p-3 border border-white/5"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <p className="text-[9px] text-white/25 mb-1">{s.label}</p>
                <p
                  className="text-lg font-semibold font-mono"
                  style={{ color: s.color || 'rgba(255,255,255,0.7)' }}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="divide-y divide-white/5">
          <div>
            <button
              onClick={() => setExpandedSection(expandedSection === 'parties' ? null : 'parties')}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/2 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-white/30" />
                <span className="text-xs font-semibold text-white/60">Parties & Relationships</span>
                <span className="text-[10px] text-white/30">({matter.parties.length})</span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-white/20 transition-transform ${expandedSection === 'parties' ? 'rotate-180' : ''}`}
              />
            </button>
            {expandedSection === 'parties' && (
              <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matter.parties.map((party) => (
                  <PartyNode key={party.id} party={party} />
                ))}
              </div>
            )}
          </div>

          <div>
            <button
              onClick={() =>
                setExpandedSection(expandedSection === 'obligations' ? null : 'obligations')
              }
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/2 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Network className="w-3.5 h-3.5 text-white/30" />
                <span className="text-xs font-semibold text-white/60">Obligation Chain</span>
                <span className="text-[10px] text-white/30">
                  ({matter.obligations.length} items)
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-white/20 transition-transform ${expandedSection === 'obligations' ? 'rotate-180' : ''}`}
              />
            </button>
            {expandedSection === 'obligations' && (
              <div className="px-5 pb-5 space-y-3">
                {obligsByStatus.critical.length > 0 && (
                  <div>
                    <p className="text-[9px] text-orange-400/60 uppercase tracking-widest font-semibold mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" /> Urgent / At Risk
                    </p>
                    <div className="space-y-2">
                      {obligsByStatus.critical.map((o, i) => (
                        <ObligationCard
                          key={o.id}
                          obligation={o}
                          allObligations={matter.obligations}
                          index={i}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {obligsByStatus.active.length > 0 && (
                  <div>
                    <p className="text-[9px] text-purple-400/50 uppercase tracking-widest font-semibold mb-2">
                      In Progress
                    </p>
                    <div className="space-y-2">
                      {obligsByStatus.active.map((o, i) => (
                        <ObligationCard
                          key={o.id}
                          obligation={o}
                          allObligations={matter.obligations}
                          index={i}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {obligsByStatus.pending.length > 0 && (
                  <div>
                    <p className="text-[9px] text-white/20 uppercase tracking-widest font-semibold mb-2">
                      Pending
                    </p>
                    <div className="space-y-2">
                      {obligsByStatus.pending.map((o, i) => (
                        <ObligationCard
                          key={o.id}
                          obligation={o}
                          allObligations={matter.obligations}
                          index={i}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {obligsByStatus.complete.length > 0 && (
                  <div>
                    <p className="text-[9px] text-green-400/40 uppercase tracking-widest font-semibold mb-2">
                      Complete
                    </p>
                    <div className="space-y-2">
                      {obligsByStatus.complete.map((o, i) => (
                        <ObligationCard
                          key={o.id}
                          obligation={o}
                          allObligations={matter.obligations}
                          index={i}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {matter.wall.enabled && (
        <div
          className="rounded-xl p-4 border privilege-glow"
          style={{ background: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.2)' }}
        >
          <div className="flex items-start gap-3">
            <Lock className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-400 mb-1">Matter Wall Active</p>
              <p className="text-[11px] text-red-400/60 mb-2">{matter.wall.reason}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
                <span className="text-white/30">
                  Approved: {matter.wall.approvedUsers.join(', ')}
                </span>
                <span className="text-red-400/50">
                  Blocked roles: {matter.wall.blockedRoles.join(', ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
