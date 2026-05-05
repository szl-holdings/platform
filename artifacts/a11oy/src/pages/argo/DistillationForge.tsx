import { useState } from 'react';
import { Link } from 'wouter';
import { Layout } from '../../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, ProgressBar } from '../../components/ui';
import { DISTILLATION_QUEUE, RETIRED_POLICIES, ARGO_DOMAINS, CHAMPION_POLICIES } from '../../data/argo';
import type { DistillationEntry, ForgeStatus, RetiredPolicy } from '../../data/argo';

const GOLD = '#c9b787';
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

type SortKey = 'elo' | 'date' | 'domain';

const STATUS_COLORS: Record<ForgeStatus, string> = {
  queued: '#c9b787',
  distilling: '#60a5fa',
  promoted: '#22c55e',
  held: '#f97316',
};

const TIER_COLORS = {
  Sovereign: '#c9b787',
  Code: '#60a5fa',
  Reason: '#8a8a8a',
  Fast: '#5e5e5e',
};

const GATE_COLORS = { open: '#22c55e', pending: '#c9b787', locked: '#ef4444' };

export function DistillationForge() {
  const [queue, setQueue] = useState(DISTILLATION_QUEUE);
  const [retireSortKey, setRetireSortKey] = useState<SortKey>('elo');

  const handlePromote = (id: string) => {
    setQueue(prev => prev.map(e => e.id === id ? { ...e, status: 'promoted' as ForgeStatus } : e));
  };
  const handleHold = (id: string) => {
    setQueue(prev => prev.map(e => e.id === id ? { ...e, status: 'held' as ForgeStatus } : e));
  };

  const sortedRetired = [...RETIRED_POLICIES].sort((a, b) => {
    if (retireSortKey === 'elo') return b.finalElo - a.finalElo;
    if (retireSortKey === 'date') return new Date(b.retiredAt).getTime() - new Date(a.retiredAt).getTime();
    return a.domain.localeCompare(b.domain);
  });

  const promoted = queue.filter(e => e.status === 'promoted').length;
  const held = queue.filter(e => e.status === 'held').length;
  const distilling = queue.filter(e => e.status === 'distilling').length;
  const pending = queue.filter(e => e.status === 'queued').length;

  return (
    <Layout>
      <PageHeader
        label="ARGO · DISTILLATION FORGE"
        title="Distillation Forge"
        subtitle="Nightly distillation pipeline — champion policies compressed into the Sovereign / Code / Reason / Fast tiers used by the Model Router. Each pending distillation shows its regret bound, rollback gate status, and promote / hold controls. Retirement log records superseded policies."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard label="QUEUE DEPTH" value={queue.length} sub="champion policies" accent={GOLD} />
        <KpiCard label="DISTILLING" value={distilling} sub="in progress" accent="#60a5fa" />
        <KpiCard label="PROMOTED" value={promoted} sub="this session" accent="#22c55e" />
        <KpiCard label="HELD" value={held} sub="pending review" accent="#f97316" />
      </div>

      {/* Distillation queue */}
      <SectionTitle>Distillation Queue</SectionTitle>
      <div className="flex flex-col gap-3 mb-8">
        {queue.map(entry => {
          const dom = ARGO_DOMAINS.find(d => d.id === entry.domain);
          return (
            <Card key={entry.id}>
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: '#f5f5f5' }}>{entry.policyName}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${STATUS_COLORS[entry.status]}18`, color: STATUS_COLORS[entry.status] }}>{entry.status}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${TIER_COLORS[entry.targetTier]}18`, color: TIER_COLORS[entry.targetTier] }}>→ {entry.targetTier}</span>
                    <span className="text-[9px] font-mono" style={{ color: dom?.color ?? '#8a8a8a' }}>{dom?.label}</span>
                  </div>

                  <div className="grid sm:grid-cols-4 gap-4 text-[10px] mb-3">
                    <div>
                      <div className="font-mono mb-0.5" style={{ color: '#5e5e5e' }}>ELO</div>
                      <div className="font-mono font-bold" style={{ color: '#f5f5f5' }}>{entry.elo}</div>
                    </div>
                    <div>
                      <div className="font-mono mb-0.5" style={{ color: '#5e5e5e' }}>REGRET BOUND</div>
                      <div className="font-mono" style={{ color: entry.regretBound <= 0.06 ? '#22c55e' : entry.regretBound <= 0.09 ? GOLD : '#f97316' }}>{(entry.regretBound * 100).toFixed(0)}%</div>
                    </div>
                    <div>
                      <div className="font-mono mb-0.5" style={{ color: '#5e5e5e' }}>ROLLBACK GATE</div>
                      <div className="font-mono" style={{ color: GATE_COLORS[entry.rollbackGate] }}>{entry.rollbackGate}</div>
                    </div>
                    <div>
                      <div className="font-mono mb-0.5" style={{ color: '#5e5e5e' }}>COMPRESSION</div>
                      <div className="font-mono" style={{ color: '#f5f5f5' }}>{(entry.compressionRatio * 100).toFixed(0)}% size reduction</div>
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="text-[9px] font-mono mb-1" style={{ color: '#5e5e5e' }}>Compression ratio</div>
                    <ProgressBar value={Math.round(entry.compressionRatio * 100)} max={100} color={GOLD} />
                  </div>

                  <div className="text-[10px]" style={{ color: '#8a8a8a' }}>Lifetime impact: <span style={{ color: '#f5f5f5' }}>{entry.lifetimeImpact}</span></div>
                  <div className="text-[9px] font-mono mt-1" style={{ color: '#5e5e5e' }}>Queued {new Date(entry.queuedAt).toLocaleString()}</div>
                </div>

                <div className="flex flex-col gap-2 shrink-0 min-w-[120px]">
                  <button
                    onClick={() => handlePromote(entry.id)}
                    disabled={entry.status === 'promoted'}
                    className="text-[10px] font-mono px-4 py-2 rounded-lg"
                    style={{
                      background: entry.status === 'promoted' ? 'rgba(34,197,94,0.04)' : 'rgba(34,197,94,0.12)',
                      color: entry.status === 'promoted' ? '#22c55e66' : '#22c55e',
                      border: '1px solid rgba(34,197,94,0.2)',
                      cursor: entry.status === 'promoted' ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {entry.status === 'promoted' ? '✓ Promoted' : '↑ Promote'}
                  </button>
                  <button
                    onClick={() => handleHold(entry.id)}
                    disabled={entry.status === 'held'}
                    className="text-[10px] font-mono px-4 py-2 rounded-lg"
                    style={{
                      background: entry.status === 'held' ? 'rgba(249,115,22,0.04)' : 'rgba(249,115,22,0.10)',
                      color: entry.status === 'held' ? '#f9731666' : '#f97316',
                      border: '1px solid rgba(249,115,22,0.2)',
                      cursor: entry.status === 'held' ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {entry.status === 'held' ? '⏸ Held' : '⏸ Hold'}
                  </button>
                  {entry.rollbackGate === 'locked' && (
                    <div className="text-[9px] text-center font-mono" style={{ color: '#ef4444' }}>Gate locked</div>
                  )}
                </div>
              </div>

              {entry.status === 'distilling' && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="text-[9px] font-mono mb-1" style={{ color: '#60a5fa' }}>Distillation in progress…</div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full animate-pulse" style={{ width: '62%', background: '#60a5fa' }} />
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Retirement log */}
      <div className="flex items-center justify-between mb-4">
        <SectionTitle>Retirement Log</SectionTitle>
        <div className="flex gap-2">
          {(['elo', 'date', 'domain'] as SortKey[]).map(k => (
            <button
              key={k}
              onClick={() => setRetireSortKey(k)}
              className="text-[9px] font-mono px-2 py-1 rounded"
              style={{ background: retireSortKey === k ? 'rgba(201,183,135,0.12)' : 'transparent', color: retireSortKey === k ? GOLD : '#5e5e5e', border: `1px solid ${retireSortKey === k ? 'rgba(201,183,135,0.2)' : 'transparent'}`, cursor: 'pointer' }}
            >{k === 'elo' ? 'By Elo' : k === 'date' ? 'By Date' : 'By Domain'}</button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {sortedRetired.map(rp => {
          const dom = ARGO_DOMAINS.find(d => d.id === rp.domain);
          return (
            <Card key={rp.id}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-semibold" style={{ color: '#8a8a8a' }}>{rp.name}</span>
                    <span className="text-[9px] font-mono" style={{ color: dom?.color ?? '#8a8a8a' }}>{dom?.label}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: '#5e5e5e' }}>retired</span>
                  </div>
                  <div className="text-[10px] mb-1" style={{ color: '#5e5e5e' }}>
                    Superseded by <span style={{ color: GOLD }}>{rp.supersededBy}</span>
                  </div>
                  <div className="text-[10px]" style={{ color: '#8a8a8a' }}>{rp.retirementReason}</div>
                  <div className="text-[9px] font-mono mt-1" style={{ color: '#5e5e5e' }}>Lifetime impact: {rp.lifetimeImpact}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xl font-mono font-bold" style={{ color: '#5e5e5e' }}>{rp.finalElo}</div>
                  <div className="text-[9px] font-mono" style={{ color: '#3a3a3a' }}>Final Elo</div>
                  <div className="text-[9px] font-mono mt-1" style={{ color: '#3a3a3a' }}>{new Date(rp.retiredAt).toLocaleDateString()}</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 flex gap-4 text-[10px] flex-wrap">
        <Link href={`${BASE}/argo`} className="font-mono" style={{ color: '#8a8a8a' }}>← Argo Bridge</Link>
        <Link href={`${BASE}/model-router`} className="font-mono" style={{ color: GOLD }}>Model Router →</Link>
        <Link href={`${BASE}/self-optimization`} className="font-mono" style={{ color: GOLD }}>Self-Optimization →</Link>
        <Link href={`${BASE}/argo/arena`} className="font-mono" style={{ color: GOLD }}>Self-Play Arena →</Link>
      </div>
    </Layout>
  );
}
