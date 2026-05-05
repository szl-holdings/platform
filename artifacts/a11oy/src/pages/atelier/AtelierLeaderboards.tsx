import { useState } from 'react';
import { Link } from 'wouter';
import { ATELIER_SPACES, VERTICAL_COLORS, LEADERBOARD_SORT_MODES, sortSpaces, type LeaderboardSortMode } from '../../data/atelierData';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const b = (p: string) => `${BASE}${p}`;

const T = {
  bg: '#0a0a0a', surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', textDim: '#8a8a8a', textMuted: '#5e5e5e', accent: '#c9b787',
  mono: 'var(--font-mono,ui-monospace,monospace)',
};

function RankBadge({ rank }: { rank: number }) {
  const color = rank === 1 ? '#c9b787' : rank === 2 ? '#8a8a8a' : rank === 3 ? '#b08d52' : T.textMuted;
  return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}15`, border: `1px solid ${color}30`, flexShrink: 0 }}>
      <span style={{ fontSize: '0.6875rem', fontFamily: T.mono, fontWeight: 700, color }}>{rank}</span>
    </div>
  );
}

function ScoreBar({ value, max, color = T.accent }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ width: 80, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
    </div>
  );
}

function getScoreDisplay(space: typeof ATELIER_SPACES[0], mode: LeaderboardSortMode): { label: string; value: string; bar: number; barMax: number; barColor?: string } {
  switch (mode) {
    case 'proof-score': return { label: 'Proof Score', value: `${space.proofScore}`, bar: space.proofScore, barMax: 100 };
    case 'most-audited': return { label: 'Audit Complete', value: `${Math.round(space.auditCompleteness * 100)}%`, bar: space.auditCompleteness * 100, barMax: 100 };
    case 'lowest-cost': return { label: 'Cost/Decision', value: `$${space.costPerDecision.toFixed(2)}`, bar: Math.max(0, 2 - space.costPerDecision), barMax: 2 };
    case 'fastest-approval': return { label: 'p95 Approval', value: `${Math.round(space.p95ApprovalLatencyMs / 1000)}s`, bar: Math.max(0, 100000 - space.p95ApprovalLatencyMs) / 1000, barMax: 100 };
    case 'slo-adherence': return { label: 'SLO Adherence', value: `${Math.round(space.sloAdherence * 100)}%`, bar: space.sloAdherence * 100, barMax: 100 };
    case 'most-forked': return { label: 'Forks', value: `${space.forkCount}`, bar: space.forkCount, barMax: Math.max(...ATELIER_SPACES.map(s => s.forkCount)) };
    case 'most-embedded': return { label: 'Embeds', value: `${space.embedCount}`, bar: space.embedCount, barMax: Math.max(...ATELIER_SPACES.map(s => s.embedCount)) };
    default: return { label: 'Score', value: '—', bar: 0, barMax: 100 };
  }
}

export function AtelierLeaderboards() {
  const [activeBoard, setActiveBoard] = useState<LeaderboardSortMode>('proof-score');

  const ranked = sortSpaces(ATELIER_SPACES, activeBoard);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem clamp(1rem, 3vw, 2rem)' }}>

        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <Link href={b('/atelier')} style={{ color: T.textMuted, textDecoration: 'none', fontSize: '0.75rem' }}>Atelier</Link>
            <span style={{ color: T.textMuted }}>/</span>
            <span style={{ fontSize: '0.75rem', color: T.accent }}>Leaderboards</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 600, letterSpacing: '-0.035em', color: T.text, margin: '0 0 0.75rem', lineHeight: 1.1 }}>
            Proof-Chain Leaderboards
          </h1>
          <p style={{ fontSize: '0.9375rem', lineHeight: 1.65, color: T.textDim, margin: 0, maxWidth: '58ch' }}>
            Spaces earn rank through governance, not popularity. Every axis is auditable and independently verifiable from the proof chain.
          </p>
        </div>

        <div style={{ padding: '1.25rem', borderRadius: 8, border: `1px solid rgba(201,183,135,0.15)`, background: 'rgba(201,183,135,0.02)', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.625rem', fontFamily: T.mono, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: '0.75rem' }}>Score Formula</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.75rem', color: T.textDim }}>
            {[
              { axis: 'Proof Score', weight: '25%', desc: 'MirrorEval composite across all runs' },
              { axis: 'Audit Completeness', weight: '20%', desc: 'Evidence coverage ratio per decision' },
              { axis: 'Policy Adherence', weight: '20%', desc: 'Constitution violations / total actions' },
              { axis: 'Cost/Decision', weight: '15%', desc: 'USD per governed decision cycle' },
              { axis: 'p95 Approval Latency', weight: '10%', desc: 'Human-in-loop friction at 95th percentile' },
              { axis: 'SLO Adherence', weight: '10%', desc: 'Uptime × throughput contract adherence' },
            ].map(f => (
              <div key={f.axis} style={{ padding: '0.625rem', borderRadius: 5, background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: '0.625rem', fontFamily: T.mono, color: T.accent, marginBottom: '0.2rem' }}>{f.weight}</div>
                <div style={{ fontSize: '0.75rem', color: T.text, marginBottom: '0.2rem' }}>{f.axis}</div>
                <div style={{ fontSize: '0.625rem', color: T.textMuted, lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {LEADERBOARD_SORT_MODES.map(mode => (
            <button key={mode.id} onClick={() => setActiveBoard(mode.id as LeaderboardSortMode)}
              style={{
                padding: '0.375rem 0.75rem', borderRadius: 5, cursor: 'pointer', fontSize: '0.6875rem', fontFamily: T.mono,
                border: `1px solid ${activeBoard === mode.id ? T.accent : T.border}`,
                background: activeBoard === mode.id ? 'rgba(201,183,135,0.08)' : 'transparent',
                color: activeBoard === mode.id ? T.accent : T.textDim, transition: 'all 0.15s',
              }}>
              {mode.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {ranked.map((space, i) => {
            const vColor = VERTICAL_COLORS[space.vertical];
            const scoreInfo = getScoreDisplay(space, activeBoard);
            return (
              <Link key={space.id} href={b(`/atelier/s/${space.slug}`)} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '1rem 1.25rem', borderRadius: 8,
                  border: `1px solid ${i < 3 ? `${T.accent}30` : T.border}`,
                  background: i < 3 ? 'rgba(201,183,135,0.02)' : T.bg,
                  borderLeft: `3px solid ${vColor}`,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <RankBadge rank={i + 1} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: T.text, marginBottom: '0.2rem' }}>{space.name}</div>
                    <div style={{ fontSize: '0.5625rem', fontFamily: T.mono, color: vColor, textTransform: 'uppercase' }}>
                      {space.vertical.replace(/-/g, ' ')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                    <ScoreBar value={scoreInfo.bar} max={scoreInfo.barMax} color={vColor} />
                    <div style={{ textAlign: 'right', minWidth: 80 }}>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 700, fontFamily: T.mono, color: i < 3 ? T.accent : T.text }}>{scoreInfo.value}</div>
                      <div style={{ fontSize: '0.5rem', fontFamily: T.mono, color: T.textMuted }}>{scoreInfo.label}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
                    {[
                      { v: space.proofScore, l: 'Proof' },
                      { v: space.forkCount, l: 'Forks' },
                      { v: space.embedCount, l: 'Embeds' },
                    ].map(stat => (
                      <div key={stat.l} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', fontFamily: T.mono, color: T.textDim }}>{stat.v}</div>
                        <div style={{ fontSize: '0.5rem', fontFamily: T.mono, color: T.textMuted }}>{stat.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div style={{ marginTop: '3rem', padding: '1.5rem', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, textAlign: 'center' }}>
          <div style={{ fontSize: '0.625rem', fontFamily: T.mono, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '0.625rem' }}>
            The One of One Differentiator
          </div>
          <p style={{ fontSize: '0.875rem', color: T.textDim, lineHeight: 1.7, maxWidth: '52ch', margin: '0 auto 1rem' }}>
            No other platform ranks agent Spaces by governance score. Hugging Face ranks by likes. Replicate ranks by downloads. Atelier ranks by proof.
          </p>
          <Link href={b('/atelier/manifesto')} style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '0.8125rem', color: T.accent, borderBottom: `1px solid rgba(201,183,135,0.4)`, paddingBottom: '0.125rem' }}>
              Read the full competitive manifesto →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
