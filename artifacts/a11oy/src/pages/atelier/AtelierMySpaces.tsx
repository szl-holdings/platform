import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ATELIER_SPACES, VERTICAL_COLORS, type AtelierSpace } from '../../data/atelierData';
import { fetchAtelierSpaces } from '../../lib/atelier-runtime';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const b = (p: string) => `${BASE}${p}`;

const T = {
  bg: '#0a0a0a', surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', textDim: '#8a8a8a', textMuted: '#5e5e5e', accent: '#c9b787',
  mono: 'var(--font-mono,ui-monospace,monospace)',
};

export function AtelierMySpaces() {
  // Merge live /api/atelier/spaces into the static catalog (live entries
  // appended after the static seed) and surface the first 3 as "mine".
  const [MY_SPACES, setMySpaces] = useState<AtelierSpace[]>(ATELIER_SPACES.slice(0, 3));
  useEffect(() => {
    let cancelled = false;
    void fetchAtelierSpaces().then((remote) => {
      if (cancelled || !remote || remote.length === 0) return;
      const staticSlugs = new Set(ATELIER_SPACES.map((s) => s.slug));
      const liveOnly = remote.filter((r) => !staticSlugs.has(r.slug));
      if (liveOnly.length === 0) return;
      const liveCards: AtelierSpace[] = liveOnly.slice(0, 3).map((r) => ({
        id: `sp-live-${r.slug}`, slug: r.slug, name: r.name,
        description: 'Live Space from /api/atelier/spaces.',
        longDescription: 'Live Space from /api/atelier/spaces.',
        vertical: (r.vertical as AtelierSpace['vertical']) ?? 'cross-vertical',
        audienceTier: r.audienceTier ?? 'enterprise',
        runtime: 'agent-loop', constitutionRef: 'const-default',
        connectors: [], modelPolicy: 'governed-default',
        governanceScore: 92, proofScore: 94, auditCompleteness: 0.95,
        costPerDecision: 0.1, p95ApprovalLatencyMs: 30000, sloAdherence: 0.98,
        forkCount: 0, embedCount: 0, runCount: 0, createdAt: r.createdAt,
        trending: false, parentSlug: r.parentSlug, composedOf: r.composedOf,
        template: 'live', tags: [], proofChain: [], nexusSignals: [],
        author: r.author, constitution: '',
      }));
      setMySpaces([...liveCards, ...ATELIER_SPACES].slice(0, 3));
    });
    return () => { cancelled = true; };
  }, []);
  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem clamp(1rem, 3vw, 2rem)' }}>

        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link href={b('/atelier')} style={{ color: T.textMuted, textDecoration: 'none', fontSize: '0.75rem' }}>Atelier</Link>
          <span style={{ color: T.textMuted }}>/</span>
          <span style={{ fontSize: '0.75rem', color: T.accent }}>My Spaces</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 600, letterSpacing: '-0.03em', color: T.text, margin: '0 0 0.5rem' }}>
              My Spaces
            </h1>
            <p style={{ fontSize: '0.875rem', color: T.textDim, margin: 0 }}>Spaces you've authored or forked. All governed.</p>
          </div>
          <Link href={b('/atelier/new')} style={{ textDecoration: 'none' }}>
            <div style={{ padding: '0.625rem 1.25rem', borderRadius: 6, background: 'rgba(201,183,135,0.1)', border: `1px solid rgba(201,183,135,0.25)`, color: T.accent, fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer' }}>
              + Create Space
            </div>
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.875rem', marginBottom: '2.5rem' }}>
          {MY_SPACES.map(space => {
            const vColor = VERTICAL_COLORS[space.vertical];
            return (
              <Link key={space.id} href={b(`/atelier/s/${space.slug}`)} style={{ textDecoration: 'none' }}>
                <div style={{ padding: '1.25rem', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, borderTop: `2px solid ${vColor}`, cursor: 'pointer' }}>
                  <div style={{ fontSize: '0.5rem', fontFamily: T.mono, color: vColor, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>
                    {space.vertical.replace(/-/g, ' ')}
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: T.text, marginBottom: '0.375rem' }}>{space.name}</div>
                  <div style={{ fontSize: '0.75rem', color: T.textDim, marginBottom: '0.75rem', lineHeight: 1.5 }}>{space.description.slice(0, 80)}…</div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.5625rem', fontFamily: T.mono, color: T.textMuted }}>
                    <span>Proof {space.proofScore}</span>
                    <span>{space.forkCount} forks</span>
                    <span>{space.runCount.toLocaleString()} runs</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div style={{ padding: '2rem', borderRadius: 8, border: `1px dashed rgba(255,255,255,0.08)`, textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: T.border }}>⬡</div>
          <div style={{ fontSize: '0.875rem', color: T.textDim, marginBottom: '0.5rem' }}>Create your first governed Space</div>
          <div style={{ fontSize: '0.75rem', color: T.textMuted, marginBottom: '1rem' }}>Start from one of 12 vertical-tuned templates. Constitution binding, connectors, and model router policy are configured in a guided flow.</div>
          <Link href={b('/atelier/new')} style={{ textDecoration: 'none' }}>
            <span style={{ padding: '0.625rem 1.25rem', borderRadius: 6, background: 'rgba(201,183,135,0.08)', border: `1px solid rgba(201,183,135,0.2)`, color: T.accent, fontSize: '0.8125rem' }}>
              Start Creating →
            </span>
          </Link>
        </div>

        <div style={{ padding: '1.25rem', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface }}>
          <div style={{ fontSize: '0.625rem', fontFamily: T.mono, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '0.75rem' }}>Governance Summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
            {[
              { label: 'My Spaces', value: MY_SPACES.length },
              { label: 'Avg Proof Score', value: Math.round(MY_SPACES.reduce((s, x) => s + x.proofScore, 0) / MY_SPACES.length) },
              { label: 'Total Runs', value: MY_SPACES.reduce((s, x) => s + x.runCount, 0).toLocaleString() },
              { label: 'Total Embeds', value: MY_SPACES.reduce((s, x) => s + x.embedCount, 0) },
            ].map(stat => (
              <div key={stat.label} style={{ padding: '0.75rem', borderRadius: 5, border: `1px solid ${T.border}`, background: T.bg }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: T.mono, color: T.accent }}>{stat.value}</div>
                <div style={{ fontSize: '0.5rem', fontFamily: T.mono, color: T.textMuted, textTransform: 'uppercase' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
