import { useState } from 'react';
import { Layout } from '../../components/layout';
import { PageHeader, KpiCard } from '../../components/ui';
import { filterByVertical } from '../../data/fabric';
import type { VerticalId, FabricOutcome } from '../../data/fabric';
import { useFabricData } from '../../hooks/useFabricData';

const TEXT = '#f5f5f5';
const GHOST = '#5e5e5e';
const SUB = '#8a8a8a';
const GOLD = '#c9b787';
const SURFACE = 'rgba(255,255,255,0.018)';
const BORDER = 'rgba(255,255,255,0.08)';

export function OutcomeMemory() {
  const { data, loading, error } = useFabricData();
  const [verticalFilter, setVerticalFilter] = useState<VerticalId | 'all'>('all');
  const [sortBy, setSortBy] = useState<'error' | 'reward' | 'risk'>('error');
  const [localReviewed, setLocalReviewed] = useState<Set<string>>(new Set());
  const [drawerOutcome, setDrawerOutcome] = useState<FabricOutcome | null>(null);

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <span className="text-sm font-mono" style={{ color: GHOST }}>Loading outcome memory…</span>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div className="flex items-center justify-center h-64 flex-col gap-2">
        <span className="text-sm font-mono" style={{ color: '#ef4444' }}>Failed to load outcomes</span>
        <span className="text-xs font-mono" style={{ color: GHOST }}>{error}</span>
      </div>
    </Layout>
  );

  const { outcomes: allOutcomes, verticals } = data;

  let outcomes = filterByVertical(allOutcomes, verticalFilter);
  outcomes = [...outcomes].sort((a, b) => {
    if (sortBy === 'error') return b.predictionError - a.predictionError;
    if (sortBy === 'reward') return b.rewardScore - a.rewardScore;
    return (b.riskBefore - b.riskAfter) - (a.riskBefore - a.riskAfter);
  });

  const avgError = allOutcomes.length ? Math.round(allOutcomes.reduce((s, o) => s + o.predictionError, 0) / allOutcomes.length * 100) : 0;
  const avgReward = allOutcomes.length ? Math.round(allOutcomes.reduce((s, o) => s + o.rewardScore, 0) / allOutcomes.length * 100) / 100 : 0;
  const policyCandidates = allOutcomes.filter(o => o.policyUpdateCandidate).length;

  const markReviewed = (id: string) => setLocalReviewed(prev => new Set(prev).add(id));

  return (
    <Layout>
      <PageHeader
        label="COMMAND FABRIC · OUTCOME MEMORY"
        title="Cross-Vertical Learning Memory"
        subtitle="Predicted vs actual outcomes, prediction errors, reward scores, and lessons learned. Feeds Argo learning and Chainlight calibration."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="OUTCOMES" value={allOutcomes.length} sub="tracked" accent={GOLD} />
        <KpiCard label="AVG ERROR" value={`${avgError}%`} sub="prediction error" accent={avgError > 15 ? '#f59e0b' : GOLD} />
        <KpiCard label="AVG REWARD" value={avgReward} sub="reward score" accent={GOLD} />
        <KpiCard label="POLICY CANDIDATES" value={policyCandidates} sub="update suggested" accent={GOLD} />
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono mr-1" style={{ color: GHOST }}>VERTICAL</span>
          <select value={verticalFilter} onChange={e => setVerticalFilter(e.target.value as VerticalId | 'all')} className="text-[10px] font-mono px-2 py-1 rounded bg-transparent" style={{ color: GOLD, border: `1px solid ${GOLD}40`, outline: 'none' }}>
            <option value="all" style={{ backgroundColor: '#0a0a0a' }}>ALL</option>
            {verticals.map(v => <option key={v.id} value={v.id} style={{ backgroundColor: '#0a0a0a' }}>{v.name.toUpperCase()}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-[10px] font-mono" style={{ color: GHOST }}>SORT</span>
          {(['error', 'reward', 'risk'] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)} className="text-[10px] font-mono px-2 py-1 rounded" style={{ backgroundColor: sortBy === s ? `${GOLD}18` : 'transparent', color: sortBy === s ? GOLD : GHOST, border: `1px solid ${sortBy === s ? `${GOLD}40` : 'transparent'}` }}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="text-[10px] font-mono mb-3" style={{ color: GHOST }}>{outcomes.length} outcomes</div>

      <div className="flex flex-col gap-3 mb-8">
        {outcomes.map(o => {
          const isReviewed = localReviewed.has(o.id) || o.reviewed;
          const riskDelta = Math.round((o.riskBefore - o.riskAfter) * 100);
          return (
            <div key={o.id} className="rounded-lg border p-4 cursor-pointer hover:border-[#c9b787] transition-colors" onClick={() => setDrawerOutcome(o)} style={{ backgroundColor: SURFACE, borderColor: BORDER }}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${GOLD}18`, color: GOLD }}>{o.verticalId}</span>
                    {o.policyUpdateCandidate && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: '#f59e0b18', color: '#f59e0b' }}>POLICY CANDIDATE</span>}
                    {isReviewed && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: '#22c55e18', color: '#22c55e' }}>REVIEWED</span>}
                  </div>
                  <div className="text-xs mb-0.5" style={{ color: SUB }}>Predicted: <span style={{ color: TEXT }}>{o.predictedOutcome}</span></div>
                  <div className="text-xs" style={{ color: SUB }}>Actual: <span style={{ color: TEXT }}>{o.actualOutcome}</span></div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-mono mb-2">
                <span style={{ color: o.predictionError > 0.15 ? '#f59e0b' : GHOST }}>Error: {Math.round(o.predictionError * 100)}%</span>
                <span style={{ color: GOLD }}>Reward: {o.rewardScore}</span>
                <span style={{ color: riskDelta > 0 ? '#22c55e' : '#ef4444' }}>Risk Δ: {riskDelta > 0 ? '-' : '+'}{Math.abs(riskDelta)}%</span>
                <span style={{ color: GHOST }}>Evidence: {Math.round(o.evidenceCompleteness * 100)}%</span>
              </div>
              <div className="text-xs p-2 rounded" style={{ backgroundColor: `${GOLD}06`, color: SUB }}>
                <span style={{ color: GOLD }}>Lesson:</span> {o.lessonLearned}
              </div>
              {!isReviewed && o.policyUpdateCandidate && (
                <button
                  onClick={e => { e.stopPropagation(); markReviewed(o.id); }}
                  className="mt-2 text-[10px] font-mono px-2 py-0.5 rounded transition-colors"
                  style={{ backgroundColor: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}40` }}
                >
                  MARK REVIEWED
                </button>
              )}
            </div>
          );
        })}
      </div>

      {drawerOutcome && (
        <div className="fixed inset-y-0 right-0 w-full max-w-lg z-50 overflow-y-auto" style={{ backgroundColor: '#0f0f0f', borderLeft: `1px solid ${BORDER}` }}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold" style={{ color: TEXT }}>Outcome Detail</span>
              <button onClick={() => setDrawerOutcome(null)} className="text-sm font-mono px-3 py-1 rounded" style={{ color: GHOST, border: `1px solid ${BORDER}` }}>Close</button>
            </div>
            <div className="mb-4">
              <div className="text-[10px] font-mono mb-1" style={{ color: GOLD }}>PREDICTED</div>
              <p className="text-sm mb-3" style={{ color: TEXT }}>{drawerOutcome.predictedOutcome}</p>
              <div className="text-[10px] font-mono mb-1" style={{ color: GOLD }}>ACTUAL</div>
              <p className="text-sm mb-3" style={{ color: TEXT }}>{drawerOutcome.actualOutcome}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded p-2" style={{ backgroundColor: SURFACE }}><div className="text-[10px] font-mono" style={{ color: GHOST }}>Error</div><div className="text-lg font-bold" style={{ color: drawerOutcome.predictionError > 0.15 ? '#f59e0b' : GOLD }}>{Math.round(drawerOutcome.predictionError * 100)}%</div></div>
              <div className="rounded p-2" style={{ backgroundColor: SURFACE }}><div className="text-[10px] font-mono" style={{ color: GHOST }}>Reward</div><div className="text-lg font-bold" style={{ color: GOLD }}>{drawerOutcome.rewardScore}</div></div>
              <div className="rounded p-2" style={{ backgroundColor: SURFACE }}><div className="text-[10px] font-mono" style={{ color: GHOST }}>Risk Before</div><div className="text-lg font-bold" style={{ color: '#f59e0b' }}>{Math.round(drawerOutcome.riskBefore * 100)}%</div></div>
              <div className="rounded p-2" style={{ backgroundColor: SURFACE }}><div className="text-[10px] font-mono" style={{ color: GHOST }}>Risk After</div><div className="text-lg font-bold" style={{ color: '#22c55e' }}>{Math.round(drawerOutcome.riskAfter * 100)}%</div></div>
            </div>
            <div className="text-xs p-3 rounded mb-4" style={{ backgroundColor: `${GOLD}08`, color: TEXT }}>
              <div className="text-[10px] font-mono mb-1" style={{ color: GOLD }}>LESSON LEARNED</div>
              {drawerOutcome.lessonLearned}
            </div>
            <div className="text-xs mb-2" style={{ color: SUB }}>Operator: {drawerOutcome.operatorFeedback}</div>
            <div className="text-[10px] font-mono" style={{ color: GHOST }}>
              <div>Decision: {drawerOutcome.originatingDecisionId}</div>
              <div>Evidence: {Math.round(drawerOutcome.evidenceCompleteness * 100)}%</div>
              <div>Policy update: {drawerOutcome.policyUpdateCandidate ? 'Candidate' : 'None'}</div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
