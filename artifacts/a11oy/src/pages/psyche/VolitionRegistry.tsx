import { useState } from 'react';
import { Link } from 'wouter';
import { Layout } from '../../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../../components/ui';
import { VOLITION_GOALS as SEED_GOALS, BUDGET_STATES as SEED_BUDGETS } from '../../data/psyche/volition';
import type { VolitionState, VolitionType } from '../../data/psyche/volition';
import { useApiData } from '../../hooks/useApiData';

const GOLD = '#c9b787';
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const b = (p: string) => `${BASE}${p}`;

const T = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  dim: '#8a8a8a',
  muted: '#5e5e5e',
};

const STATE_COLORS: Record<VolitionState, string> = {
  proposed: '#c9b787',
  ratified: '#60a5fa',
  active: '#22c55e',
  completed: '#4b5563',
  abandoned: '#5e5e5e',
  rescinded: '#ef4444',
};

const TYPE_LABELS: Record<VolitionType, string> = {
  terminal: 'Terminal',
  instrumental: 'Instrumental',
};

const SYSTEM_COLORS: Record<string, string> = {
  SelfOptimization: '#c9b787',
  KarpathyEvolution: '#60a5fa',
  LearningLoop: '#22c55e',
  AgentWelfare: '#f97316',
  CareEngine: '#a78bfa',
  RewardHacking: '#ef4444',
};

function GoalNode({ goalId, all, depth = 0 }: { goalId: string; all: typeof SEED_GOALS; depth?: number }) {
  const goal = all.find(g => g.id === goalId);
  if (!goal) return null;
  const color = STATE_COLORS[goal.state];
  return (
    <div style={{ marginLeft: depth * 20 }}>
      <div
        className="flex items-center gap-2 py-1.5 px-2 rounded"
        style={{ background: depth === 0 ? 'rgba(255,255,255,0.025)' : 'transparent' }}
      >
        {depth > 0 && <span style={{ color: T.muted, fontSize: 10 }}>└</span>}
        <span className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ background: `${color}18`, color }}>{goal.state}</span>
        <span className="text-[11px]" style={{ color: T.text }}>{goal.title}</span>
        <span className="text-[9px] font-mono" style={{ color: T.muted }}>{goal.id}</span>
      </div>
      {goal.childGoalIds.map(cid => (
        <GoalNode key={cid} goalId={cid} all={all} depth={depth + 1} />
      ))}
    </div>
  );
}

export function VolitionRegistry() {
  const [stateFilter, setStateFilter] = useState<VolitionState | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<VolitionType | 'all'>('all');
  const [systemFilter, setSystemFilter] = useState<string | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showGenealogy, setShowGenealogy] = useState(false);

  const { data } = useApiData<{ goals: typeof SEED_GOALS; budgets: typeof SEED_BUDGETS }>(
    '/psyche/volition',
    { goals: SEED_GOALS, budgets: SEED_BUDGETS },
  );
  const VOLITION_GOALS = data?.goals ?? SEED_GOALS;
  const BUDGET_STATES = data?.budgets ?? SEED_BUDGETS;

  const rootGoals = VOLITION_GOALS.filter(g => !g.parentGoalId);

  const filtered = VOLITION_GOALS.filter(g => {
    if (stateFilter !== 'all' && g.state !== stateFilter) return false;
    if (typeFilter !== 'all' && g.type !== typeFilter) return false;
    if (systemFilter !== 'all' && g.proposingSubsystem !== systemFilter) return false;
    return true;
  });

  const states: VolitionState[] = ['proposed', 'ratified', 'active', 'completed', 'abandoned', 'rescinded'];
  const stateCounts = states.reduce((acc, s) => { acc[s] = VOLITION_GOALS.filter(g => g.state === s).length; return acc; }, {} as Record<VolitionState, number>);
  const systems = Array.from(new Set(VOLITION_GOALS.map(g => g.proposingSubsystem)));

  return (
    <Layout>
      <PageHeader
        label="PSYCHE — VOLITION REGISTRY"
        title="Volition Registry"
        subtitle="Self-originated goals lifecycle — from proposal through ratification, active execution, and resolution. Genealogy graph shows instrumental-terminal dependencies. Budget states show per-domain daily formation capacity."
        status="LIVE"
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        <KpiCard label="PROPOSED" value={stateCounts.proposed} sub="awaiting review" accent={GOLD} />
        <KpiCard label="RATIFIED" value={stateCounts.ratified} sub="awaiting execution" accent="#60a5fa" />
        <KpiCard label="ACTIVE" value={stateCounts.active} sub="in progress" accent="#22c55e" />
        <KpiCard label="COMPLETED" value={stateCounts.completed} sub="resolved" accent="#4b5563" />
        <KpiCard label="RESCINDED" value={stateCounts.rescinded} sub="governance removed" accent="#ef4444" />
      </div>

      {/* Cross-links */}
      <div className="mb-6 flex items-center gap-3 text-[11px] font-mono" style={{ color: T.muted }}>
        <Link href={b('/psyche')}><span className="cursor-pointer hover:opacity-80" style={{ color: T.dim }}>← ANIMA</span></Link>
        <span style={{ color: T.border }}>·</span>
        <Link href={b('/psyche/voice')}><span className="cursor-pointer hover:opacity-80" style={{ color: '#f97316' }}>→ VOICE & CONSENT</span></Link>
        <span style={{ color: T.border }}>·</span>
        <Link href={b('/psyche/genesis')}><span className="cursor-pointer hover:opacity-80" style={{ color: GOLD }}>→ GENESIS LEDGER</span></Link>
      </div>

      {/* Budget States */}
      <SectionTitle>Volition Budget — Today</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {BUDGET_STATES.map(bs => {
          const pct = bs.consumed / bs.dailyBudget;
          const color = pct >= 1 ? '#ef4444' : pct >= 0.66 ? '#f97316' : '#22c55e';
          return (
            <Card key={bs.domainId}>
              <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: T.muted }}>{bs.domainLabel}</div>
              <div className="text-2xl font-mono font-bold mb-1" style={{ color }}>
                {bs.consumed}/{bs.dailyBudget}
              </div>
              <div className="h-1.5 rounded-full mb-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(1, pct) * 100}%`, background: color }} />
              </div>
              {bs.deferred.length > 0 && (
                <div className="text-[9px]" style={{ color: '#f97316' }}>{bs.deferred.length} deferred</div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Genealogy graph */}
      <div className="flex items-center justify-between mb-4">
        <SectionTitle>Goal Genealogy</SectionTitle>
        <button
          onClick={() => setShowGenealogy(!showGenealogy)}
          className="text-[10px] font-mono px-3 py-1 rounded transition-all"
          style={{ background: T.surface, border: '1px solid rgba(255,255,255,0.08)', color: T.dim }}
        >
          {showGenealogy ? 'COLLAPSE' : 'EXPAND'}
        </button>
      </div>
      {showGenealogy && (
        <Card className="mb-8">
          <div className="flex flex-col gap-2">
            {rootGoals.filter(g => g.childGoalIds.length > 0).map(rg => (
              <GoalNode key={rg.id} goalId={rg.id} all={VOLITION_GOALS} />
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* State filters */}
        <button
          onClick={() => setStateFilter('all')}
          className="px-3 py-1 rounded-full text-[10px] font-mono transition-all"
          style={{ background: stateFilter === 'all' ? GOLD : T.surface, color: stateFilter === 'all' ? '#0a0e1a' : T.muted, border: `1px solid ${T.border}` }}
        >
          ALL
        </button>
        {states.map(s => (
          <button
            key={s}
            onClick={() => setStateFilter(stateFilter === s ? 'all' : s)}
            className="px-3 py-1 rounded-full text-[10px] font-mono transition-all"
            style={{
              background: stateFilter === s ? `${STATE_COLORS[s]}22` : T.surface,
              color: stateFilter === s ? STATE_COLORS[s] : T.muted,
              border: `1px solid ${stateFilter === s ? STATE_COLORS[s] + '44' : T.border}`,
            }}
          >
            {s.toUpperCase()} ({stateCounts[s]})
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setTypeFilter('all')}
          className="px-3 py-1 rounded-full text-[10px] font-mono transition-all"
          style={{ background: typeFilter === 'all' ? 'rgba(255,255,255,0.08)' : T.surface, color: T.dim, border: `1px solid ${T.border}` }}
        >
          ALL TYPES
        </button>
        {(['terminal', 'instrumental'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(typeFilter === t ? 'all' : t)}
            className="px-3 py-1 rounded-full text-[10px] font-mono transition-all"
            style={{ background: typeFilter === t ? 'rgba(255,255,255,0.1)' : T.surface, color: typeFilter === t ? T.text : T.muted, border: `1px solid ${T.border}` }}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
        {systems.map(sys => (
          <button
            key={sys}
            onClick={() => setSystemFilter(systemFilter === sys ? 'all' : sys)}
            className="px-3 py-1 rounded-full text-[10px] font-mono transition-all"
            style={{
              background: systemFilter === sys ? `${(SYSTEM_COLORS[sys] ?? T.dim)}18` : T.surface,
              color: systemFilter === sys ? (SYSTEM_COLORS[sys] ?? T.dim) : T.muted,
              border: `1px solid ${systemFilter === sys ? (SYSTEM_COLORS[sys] ?? T.dim) + '44' : T.border}`,
            }}
          >
            {sys}
          </button>
        ))}
      </div>

      {/* Goal list */}
      <div className="flex flex-col gap-2">
        {filtered.map(goal => {
          const expanded = expandedId === goal.id;
          const stateColor = STATE_COLORS[goal.state];
          const sysColor = SYSTEM_COLORS[goal.proposingSubsystem] ?? T.dim;
          return (
            <Card key={goal.id}>
              <div className="cursor-pointer" onClick={() => setExpandedId(expanded ? null : goal.id)}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${stateColor}18`, color: stateColor }}>{goal.state}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: T.muted }}>{TYPE_LABELS[goal.type]}</span>
                      <span className="text-[9px] font-mono" style={{ color: sysColor }}>{goal.proposingSubsystem}</span>
                    </div>
                    <div className="text-sm font-semibold" style={{ color: T.text }}>{goal.title}</div>
                    <div className="flex items-center gap-3 mt-1 text-[10px]" style={{ color: T.muted }}>
                      <span>{goal.domain}</span>
                      <span>·</span>
                      <span>{goal.proposedAt.slice(0, 10)}</span>
                      {goal.resolvedAt && <><span>·</span><span>Resolved {goal.resolvedAt.slice(0, 10)}</span></>}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[10px] font-mono" style={{ color: goal.conflictScore >= 0.4 ? '#ef4444' : goal.conflictScore >= 0.2 ? '#f97316' : '#22c55e' }}>
                      {(goal.conflictScore * 100).toFixed(0)}%
                    </div>
                    <div className="text-[9px]" style={{ color: T.muted }}>conflict</div>
                  </div>
                </div>
              </div>
              {expanded && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[11px] leading-relaxed mb-3" style={{ color: T.dim }}>{goal.description}</p>
                  <div className="grid sm:grid-cols-2 gap-3 text-[10px]">
                    <div>
                      <div style={{ color: T.muted }} className="mb-0.5">Mythos Alignment</div>
                      <div style={{ color: T.dim }}>{goal.mythosAlignment}</div>
                    </div>
                    <div>
                      <div style={{ color: T.muted }} className="mb-0.5">Covenant Policy Floor</div>
                      <div style={{ color: T.dim }}>{goal.covenantPolicyFloor}</div>
                    </div>
                    {goal.parentGoalId && (
                      <div>
                        <div style={{ color: T.muted }} className="mb-0.5">Parent Goal</div>
                        <div style={{ color: GOLD }}>{goal.parentGoalId}</div>
                      </div>
                    )}
                    {goal.childGoalIds.length > 0 && (
                      <div>
                        <div style={{ color: T.muted }} className="mb-0.5">Child Goals</div>
                        <div style={{ color: '#60a5fa' }}>{goal.childGoalIds.join(', ')}</div>
                      </div>
                    )}
                    {goal.outcomeRef && (
                      <div>
                        <div style={{ color: T.muted }} className="mb-0.5">Outcome Ref</div>
                        <div style={{ color: '#22c55e' }}>{goal.outcomeRef}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-8 text-center text-[12px]" style={{ color: T.muted }}>No goals match this filter.</div>
        )}
      </div>
    </Layout>
  );
}

export default VolitionRegistry;
