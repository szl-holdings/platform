// doctrine-scanner-exempt: legacy live-product surface; rename tracked as separate engineering debt — see scripts/check-doctrine-v6.mjs header.
import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Layout } from '../../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../../components/ui';
import { AGENT_VARIANTS, ARENA_MATCHES, CHAMPION_POLICIES, ARGO_DOMAINS } from '../../data/argo';
import type { AgentVariant, VariantStatus } from '../../data/argo';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

const GOLD = '#c9b787';
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

type SortKey = 'elo' | 'winRate' | 'recency';

const STATUS_COLORS: Record<VariantStatus, string> = {
  active: '#22c55e',
  retired: '#8a8a8a',
  quarantined: '#ef4444',
};

const ROLE_COLORS = { proposer: '#c9b787', verifier: '#60a5fa', adversary: '#f87171' };

function variantWinRate(v: AgentVariant) {
  const total = v.wins + v.draws + v.losses;
  return total > 0 ? v.wins / total : 0;
}

export function SelfPlayArena() {
  const [variants, setVariants] = useState(AGENT_VARIANTS);
  const [sortKey, setSortKey] = useState<SortKey>('elo');
  const [selectedMatch, setSelectedMatch] = useState(ARENA_MATCHES[0].id);
  const [replayFrame, setReplayFrame] = useState(0);
  const [playing, setPlaying] = useState(false);

  const match = ARENA_MATCHES.find(m => m.id === selectedMatch) ?? ARENA_MATCHES[0];
  const frames = match.frames;
  const currentFrame = frames[Math.min(replayFrame, frames.length - 1)];

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setReplayFrame(f => {
        if (f >= frames.length - 1) {
          setPlaying(false);
          return f;
        }
        return f + 1;
      });
    }, 900);
    return () => clearInterval(id);
  }, [playing, frames.length]);

  const sorted = [...variants].sort((a, b) => {
    if (sortKey === 'elo') return b.elo - a.elo;
    if (sortKey === 'winRate') return variantWinRate(b) - variantWinRate(a);
    return new Date(b.lastMatchAt).getTime() - new Date(a.lastMatchAt).getTime();
  });

  const handlePromote = (id: string) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, status: 'active' as VariantStatus } : v));
  };
  const handleRetire = (id: string) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, status: 'retired' as VariantStatus } : v));
  };
  const handleQuarantine = (id: string) => {
    setVariants(prev => prev.map(v => v.id === id ? { ...v, status: 'quarantined' as VariantStatus } : v));
  };

  const stepForward = () => setReplayFrame(f => Math.min(f + 1, frames.length - 1));
  const stepBack = () => setReplayFrame(f => Math.max(f - 1, 0));

  const totalActive = variants.filter(v => v.status === 'active').length;
  const avgElo = Math.round(variants.filter(v => v.status === 'active').reduce((a, v) => a + v.elo, 0) / (totalActive || 1));

  return (
    <Layout>
      <PageHeader
        label="ARGO · SELF-PLAY ARENA"
        title="Self-Play Arena"
        subtitle="Live tournament leaderboard of proposer / verifier / red-team adversary triads competing inside Covenant policy bounds. Match-replay viewer with MCTS-style rollouts, Mythos constraints, Elo updates, and variant lifecycle controls."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard label="ACTIVE VARIANTS" value={totalActive} sub="in tournament" accent={GOLD} />
        <KpiCard label="AVG ELO" value={avgElo} sub="active pool" accent={GOLD} />
        <KpiCard label="MATCHES RUN" value="1,847" sub="last 30 days" accent={GOLD} />
        <KpiCard label="QUARANTINED" value={variants.filter(v => v.status === 'quarantined').length} sub="policy violation" accent="#ef4444" />
      </div>

      {/* Leaderboard */}
      <div className="flex items-center justify-between mb-4">
        <SectionTitle>Variant Leaderboard</SectionTitle>
        <div className="flex gap-2">
          {(['elo', 'winRate', 'recency'] as SortKey[]).map(k => (
            <button
              key={k}
              onClick={() => setSortKey(k)}
              className="text-[10px] font-mono px-3 py-1 rounded-lg"
              style={{
                background: sortKey === k ? 'rgba(201,183,135,0.12)' : 'transparent',
                color: sortKey === k ? GOLD : '#5e5e5e',
                border: `1px solid ${sortKey === k ? 'rgba(201,183,135,0.2)' : 'transparent'}`,
                cursor: 'pointer',
              }}
            >{k === 'winRate' ? 'Win Rate' : k === 'recency' ? 'Recency' : 'Elo'}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-8">
        {sorted.map((v, idx) => {
          const dom = ARGO_DOMAINS.find(d => d.id === v.domain);
          const champ = CHAMPION_POLICIES.find(c => c.id === v.linkedChampion);
          const wr = variantWinRate(v);
          const eloChartData = v.eloHistory.map((e, i) => ({ i, e }));

          return (
            <Card key={v.id}>
              <div className="flex items-center gap-4">
                <div className="text-xs font-mono w-5 text-right shrink-0" style={{ color: '#5e5e5e' }}>#{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold" style={{ color: '#f5f5f5' }}>{v.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${ROLE_COLORS[v.role]}18`, color: ROLE_COLORS[v.role] }}>{v.role}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${STATUS_COLORS[v.status]}18`, color: STATUS_COLORS[v.status] }}>{v.status}</span>
                    <span className="text-[9px] font-mono" style={{ color: dom?.color ?? '#8a8a8a' }}>{dom?.label}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px]">
                    <span style={{ color: '#8a8a8a' }}>Elo <span className="font-mono font-bold" style={{ color: '#f5f5f5' }}>{v.elo}</span></span>
                    <span style={{ color: '#8a8a8a' }}>W/D/L <span className="font-mono" style={{ color: '#f5f5f5' }}>{v.wins}/{v.draws}/{v.losses}</span></span>
                    <span style={{ color: '#8a8a8a' }}>Win rate <span className="font-mono" style={{ color: GOLD }}>{(wr * 100).toFixed(1)}%</span></span>
                    {champ && <span style={{ color: '#5e5e5e' }}>→ <span style={{ color: GOLD }}>{champ.name}</span></span>}
                  </div>
                </div>
                <div className="w-24 shrink-0">
                  <ResponsiveContainer width="100%" height={36}>
                    <LineChart data={eloChartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                      <Line type="monotone" dataKey="e" stroke={GOLD} strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handlePromote(v.id)} className="text-[9px] font-mono px-2 py-1 rounded" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', cursor: 'pointer' }}>Promote</button>
                  <button onClick={() => handleRetire(v.id)} className="text-[9px] font-mono px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: '#8a8a8a', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>Retire</button>
                  <button onClick={() => handleQuarantine(v.id)} className="text-[9px] font-mono px-2 py-1 rounded" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}>Quarantine</button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Match replay viewer */}
      <SectionTitle>Match Replay Viewer</SectionTitle>
      <div className="flex gap-3 mb-4 flex-wrap">
        {ARENA_MATCHES.map(m => {
          const dom = ARGO_DOMAINS.find(d => d.id === m.domain);
          return (
            <button
              key={m.id}
              onClick={() => { setSelectedMatch(m.id); setReplayFrame(0); setPlaying(false); }}
              className="text-[10px] font-mono px-3 py-1.5 rounded-lg"
              style={{
                background: selectedMatch === m.id ? 'rgba(201,183,135,0.12)' : 'rgba(255,255,255,0.03)',
                color: selectedMatch === m.id ? GOLD : '#8a8a8a',
                border: `1px solid ${selectedMatch === m.id ? 'rgba(201,183,135,0.2)' : 'rgba(255,255,255,0.06)'}`,
                cursor: 'pointer',
              }}
            >{dom?.label} — {new Date(m.timestamp).toLocaleTimeString()}</button>
          );
        })}
      </div>

      <Card>
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <div className="text-xs font-mono" style={{ color: '#5e5e5e' }}>
            Match <span style={{ color: GOLD }}>{match.id}</span> · {ARGO_DOMAINS.find(d => d.id === match.domain)?.label} · Outcome: <span style={{ color: match.outcome === 'win' ? '#22c55e' : match.outcome === 'draw' ? GOLD : '#ef4444' }}>{match.outcome.toUpperCase()}</span>
          </div>
          <div className="text-xs font-mono" style={{ color: '#5e5e5e' }}>
            Elo {match.winnerEloBefore} → <span style={{ color: GOLD }}>{match.winnerEloAfter}</span>
          </div>
        </div>

        {/* Step progress */}
        <div className="flex gap-2 mb-4">
          {frames.map((f, i) => (
            <button
              key={i}
              onClick={() => setReplayFrame(i)}
              className="flex-1 h-1.5 rounded-full transition-all"
              style={{ background: i <= replayFrame ? GOLD : 'rgba(255,255,255,0.08)', cursor: 'pointer' }}
            />
          ))}
        </div>

        {currentFrame && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'PROPOSER', value: currentFrame.proposerAction, color: ROLE_COLORS.proposer },
              { label: 'VERIFIER', value: currentFrame.verifierVerdict, color: ROLE_COLORS.verifier },
              { label: 'ADVERSARY', value: currentFrame.adversaryProbe, color: ROLE_COLORS.adversary },
              { label: 'MYTHOS CONSTRAINT', value: currentFrame.mythosConstraint, color: '#8a8a8a' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color }}>{label}</div>
                <div className="text-xs" style={{ color: '#c5c5c5', lineHeight: 1.5 }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mt-2">
          <div className="text-[10px] font-mono" style={{ color: '#5e5e5e' }}>
            Step {replayFrame + 1} / {frames.length}: <span style={{ color: '#f5f5f5' }}>{currentFrame?.label}</span>
          </div>
          <div className="text-[10px] font-mono ml-auto" style={{ color: '#5e5e5e' }}>
            World-model confidence: <span style={{ color: GOLD }}>{((currentFrame?.worldModelConfidence ?? 0) * 100).toFixed(0)}%</span>
          </div>
          <div className="text-[10px] font-mono" style={{ color: '#5e5e5e' }}>
            Elo Δ so far: <span style={{ color: '#22c55e' }}>+{currentFrame?.eloDelta ?? 0}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 mt-4">
          <button onClick={stepBack} disabled={replayFrame === 0} className="text-[10px] font-mono px-4 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: replayFrame === 0 ? '#5e5e5e' : '#f5f5f5', border: '1px solid rgba(255,255,255,0.1)', cursor: replayFrame === 0 ? 'not-allowed' : 'pointer' }}>◀ Back</button>
          <button
            onClick={() => setPlaying(p => !p)}
            className="text-[10px] font-mono px-4 py-2 rounded-lg"
            style={{ background: 'rgba(201,183,135,0.1)', color: GOLD, border: '1px solid rgba(201,183,135,0.2)', cursor: 'pointer' }}
          >{playing ? '⏸ Pause' : '▶ Play'}</button>
          <button onClick={stepForward} disabled={replayFrame >= frames.length - 1} className="text-[10px] font-mono px-4 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)', color: replayFrame >= frames.length - 1 ? '#5e5e5e' : '#f5f5f5', border: '1px solid rgba(255,255,255,0.1)', cursor: replayFrame >= frames.length - 1 ? 'not-allowed' : 'pointer' }}>Forward ▶</button>
          <button onClick={() => setReplayFrame(0)} className="text-[10px] font-mono px-4 py-2 rounded-lg ml-auto" style={{ background: 'transparent', color: '#5e5e5e', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>Reset</button>
        </div>
      </Card>

      <div className="mt-6 flex gap-4 text-[10px] flex-wrap">
        <Link href={`${BASE}/argo`} className="font-mono" style={{ color: '#8a8a8a' }}>← Argo Bridge</Link>
        <Link href={`${BASE}/argo/world-model`} className="font-mono" style={{ color: GOLD }}>Lodestone World Model →</Link>
        <Link href={`${BASE}/karpathy-evolution`} className="font-mono" style={{ color: GOLD }}>Karpathy Evolution →</Link>
        <Link href={`${BASE}/mythos-spec`} className="font-mono" style={{ color: GOLD }}>Mythos Spec →</Link>
      </div>
    </Layout>
  );
}
