import { useState, useMemo, useEffect } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ATELIER_SPACES as STATIC_ATELIER_SPACES, VERTICAL_COLORS, type AudienceTier, type Runtime, type Vertical, type AtelierSpace } from '../../data/atelierData';
import { fetchAtelierSpaces } from '../../lib/atelier-runtime';

// Merge static catalog with live registry from /api/atelier/spaces so
// freshly-created/forked Spaces appear without a redeploy. Live entries
// fall back to placeholder metrics; static entries always win on
// duplicate slug so the rich UI catalog stays intact.
function useMergedSpaces(): AtelierSpace[] {
  const [spaces, setSpaces] = useState<AtelierSpace[]>(STATIC_ATELIER_SPACES);
  useEffect(() => {
    let cancelled = false;
    void fetchAtelierSpaces().then((remote) => {
      if (cancelled || !remote) return;
      const bySlug = new Map(STATIC_ATELIER_SPACES.map((s) => [s.slug, s]));
      for (const r of remote) {
        if (bySlug.has(r.slug)) continue;
        bySlug.set(r.slug, {
          id: `sp-live-${r.slug}`, slug: r.slug, name: r.name,
          description: 'Live Space from /api/atelier/spaces.',
          longDescription: 'Live Space from /api/atelier/spaces.',
          vertical: (r.vertical as Vertical) ?? 'cross-vertical',
          audienceTier: r.audienceTier ?? 'enterprise',
          runtime: 'agent-loop', constitutionRef: 'const-default',
          connectors: [], modelPolicy: 'governed-default',
          governanceScore: 92, proofScore: 94, auditCompleteness: 0.95,
          costPerDecision: 0.1, p95ApprovalLatencyMs: 30000, sloAdherence: 0.98,
          forkCount: 0, embedCount: 0, runCount: 0, createdAt: r.createdAt,
          trending: false, parentSlug: r.parentSlug, composedOf: r.composedOf,
          template: 'live', tags: [], proofChain: [], nexusSignals: [],
          author: r.author, constitution: '',
        });
      }
      setSpaces(Array.from(bySlug.values()));
    });
    return () => { cancelled = true; };
  }, []);
  return spaces;
}

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const b = (p: string) => `${BASE}${p}`;

const T = {
  bg: '#0a0a0a', surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  borderHover: 'rgba(201,183,135,0.25)', text: '#f5f5f5', textDim: '#8a8a8a',
  textMuted: '#5e5e5e', accent: '#c9b787', mono: 'var(--font-mono,ui-monospace,monospace)',
};
const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

const AUDIENCE_META: Record<AudienceTier, { label: string; color: string; bg: string }> = {
  internal:   { label: 'Internal',   color: '#f5f5f5', bg: 'rgba(245,245,245,0.08)' },
  enterprise: { label: 'Enterprise', color: '#c9b787', bg: 'rgba(201,183,135,0.1)' },
  public:     { label: 'Public',     color: '#8a8a8a', bg: 'rgba(138,138,138,0.1)' },
};

const RUNTIME_META: Record<Runtime, { label: string; icon: string }> = {
  chat:         { label: 'Chat',       icon: '💬' },
  form:         { label: 'Form',       icon: '📋' },
  canvas:       { label: 'Canvas',     icon: '🖼' },
  'agent-loop': { label: 'Agent Loop', icon: '⟳' },
};

const VERTICAL_LABELS: Record<Vertical, string> = {
  'real-estate':   'Real Estate',
  'legal':         'Legal',
  'cyber':         'Cyber',
  'maritime':      'Maritime',
  'defense':       'Defense',
  'executive':     'Executive',
  'advisory':      'Advisory',
  'decision':      'Decision Intel',
  'reverse-etl':   'Reverse ETL',
  'brand':         'Brand',
  'cross-vertical':'Cross-Vertical',
  'platform':      'Platform',
};

const SORT_OPTIONS = [
  { id: 'trending',    label: 'Trending' },
  { id: 'new',         label: 'New' },
  { id: 'proof-score', label: 'Highest Proof Score' },
  { id: 'most-audited', label: 'Most Audited' },
  { id: 'lowest-cost', label: 'Lowest Cost' },
  { id: 'fastest-approval', label: 'Fastest Approval' },
] as const;
type SortMode = typeof SORT_OPTIONS[number]['id'];

function ProofScoreBadge({ score }: { score: number }) {
  const color = score >= 97 ? '#c9b787' : score >= 90 ? '#8a8a8a' : '#5e5e5e';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
      <div style={{ position: 'relative', width: 28, height: 28 }}>
        <svg width="28" height="28" viewBox="0 0 28 28" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
          <circle
            cx="14" cy="14" r="11" fill="none" stroke={color} strokeWidth="2.5"
            strokeDasharray={`${(score / 100) * 69.1} 69.1`}
            strokeLinecap="round"
          />
        </svg>
        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6px', fontFamily: T.mono, fontWeight: 700, color }}>
          {score}
        </span>
      </div>
    </div>
  );
}

function SpaceCard({ space, i }: { space: AtelierSpace; i: number }) {
  const [hovered, setHovered] = useState(false);
  const vColor = VERTICAL_COLORS[space.vertical];
  const am = AUDIENCE_META[space.audienceTier];
  const rm = RUNTIME_META[space.runtime];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: i * 0.04, ease }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={b(`/atelier/s/${space.slug}`)} style={{ textDecoration: 'none' }}>
        <div style={{
          padding: '1.25rem', borderRadius: 8,
          border: `1px solid ${hovered ? T.borderHover : T.border}`,
          background: hovered ? 'rgba(201,183,135,0.02)' : T.bg,
          cursor: 'pointer', transition: 'all 0.2s ease',
          display: 'flex', flexDirection: 'column', gap: '0.75rem',
          borderTop: `2px solid ${vColor}`,
          height: '100%',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: T.text, letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                {space.name}
              </div>
              <div style={{ fontSize: '0.5625rem', fontFamily: T.mono, color: vColor, marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {VERTICAL_LABELS[space.vertical]}
              </div>
            </div>
            <ProofScoreBadge score={space.proofScore} />
          </div>

          <p style={{ fontSize: '0.75rem', lineHeight: 1.55, color: T.textDim, margin: 0, flex: 1 }}>
            {space.description}
          </p>

          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.5rem', fontFamily: T.mono, padding: '0.15rem 0.4rem', borderRadius: 3, background: am.bg, color: am.color, border: `1px solid ${am.color}20` }}>
              {am.label}
            </span>
            <span style={{ fontSize: '0.5rem', fontFamily: T.mono, padding: '0.15rem 0.4rem', borderRadius: 3, background: 'rgba(255,255,255,0.04)', color: T.textMuted, border: `1px solid ${T.border}` }}>
              {rm.icon} {rm.label}
            </span>
            {space.trending && (
              <span style={{ fontSize: '0.5rem', fontFamily: T.mono, padding: '0.15rem 0.4rem', borderRadius: 3, background: 'rgba(201,183,135,0.08)', color: T.accent, border: `1px solid rgba(201,183,135,0.2)` }}>
                Trending
              </span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: `1px solid ${T.border}` }}>
            <span style={{ fontSize: '0.5625rem', fontFamily: T.mono, color: T.textMuted }}>{space.forkCount} forks</span>
            <span style={{ fontSize: '0.5625rem', fontFamily: T.mono, color: T.textMuted }}>{space.embedCount} embeds</span>
            <span style={{ fontSize: '0.5625rem', fontFamily: T.mono, color: T.textMuted }}>{space.runCount.toLocaleString()} runs</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function DiscoveryRail({ label, spaces, metricFn }: { label: string; spaces: AtelierSpace[]; metricFn: (s: AtelierSpace) => string }) {
  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <div style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.textMuted, marginBottom: '0.75rem' }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
        {spaces.map(space => {
          const vColor = VERTICAL_COLORS[space.vertical];
          return (
            <Link key={space.id} href={b(`/atelier/s/${space.slug}`)} style={{ textDecoration: 'none', flexShrink: 0 }}>
              <div style={{
                padding: '0.75rem 1rem', borderRadius: 6, minWidth: 200,
                border: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.015)',
                borderLeft: `3px solid ${vColor}`,
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: T.text, marginBottom: '0.25rem' }}>{space.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.5rem', fontFamily: T.mono, color: T.accent }}>Proof {space.proofScore}</span>
                  <span style={{ fontSize: '0.5rem', fontFamily: T.mono, color: T.textMuted }}>{metricFn(space)}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

type ModelFamily = 'claude' | 'gpt-4o' | 'multi-model';
type GovernanceTier = 'gold' | 'silver' | 'bronze';

const MODEL_FAMILY_META: Record<ModelFamily, { label: string; color: string }> = {
  'claude': { label: 'Claude', color: '#d4a574' },
  'gpt-4o': { label: 'GPT-4o', color: '#74b9d4' },
  'multi-model': { label: 'Multi-Model', color: '#b794f4' },
};

const GOV_TIER_META: Record<GovernanceTier, { label: string; color: string; bg: string; min: number }> = {
  'gold': { label: 'Gold', color: '#c9b787', bg: 'rgba(201,183,135,0.1)', min: 95 },
  'silver': { label: 'Silver', color: '#a0a0a0', bg: 'rgba(160,160,160,0.08)', min: 85 },
  'bronze': { label: 'Bronze', color: '#cd7f32', bg: 'rgba(205,127,50,0.08)', min: 0 },
};

function getModelFamily(space: AtelierSpace): ModelFamily {
  const mp = space.modelPolicy.toLowerCase();
  if (mp.includes('→') || mp.includes('fallback') || mp.includes('synthesis') || mp.includes('multi-agent')) return 'multi-model';
  if (mp.includes('gpt-4o')) return 'gpt-4o';
  return 'claude';
}

function getGovernanceTier(space: AtelierSpace): GovernanceTier {
  if (space.governanceScore >= 95) return 'gold';
  if (space.governanceScore >= 85) return 'silver';
  return 'bronze';
}

export function AtelierHub() {
  const spaces = useMergedSpaces();
  const [search, setSearch] = useState('');
  const [filterVertical, setFilterVertical] = useState<Vertical | 'all'>('all');
  const [filterRuntime, setFilterRuntime] = useState<Runtime | 'all'>('all');
  const [filterAudience, setFilterAudience] = useState<AudienceTier | 'all'>('all');
  const [filterModelFamily, setFilterModelFamily] = useState<ModelFamily | 'all'>('all');
  const [filterGovTier, setFilterGovTier] = useState<GovernanceTier | 'all'>('all');
  const [sortMode, setSortMode] = useState<SortMode>('trending');

  const verticals = Object.keys(VERTICAL_LABELS) as Vertical[];
  const runtimes: Runtime[] = ['chat', 'form', 'canvas', 'agent-loop'];
  const audiences: AudienceTier[] = ['internal', 'enterprise', 'public'];
  const modelFamilies: ModelFamily[] = ['claude', 'gpt-4o', 'multi-model'];
  const govTiers: GovernanceTier[] = ['gold', 'silver', 'bronze'];

  const sorted = useMemo(() => {
    let list = [...spaces];
    if (sortMode === 'trending') list = list.filter(s => s.trending).concat(list.filter(s => !s.trending));
    else if (sortMode === 'new') list = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sortMode === 'proof-score') list = list.sort((a, b) => b.proofScore - a.proofScore);
    else if (sortMode === 'most-audited') list = list.sort((a, b) => b.auditCompleteness - a.auditCompleteness);
    else if (sortMode === 'lowest-cost') list = list.sort((a, b) => a.costPerDecision - b.costPerDecision);
    else if (sortMode === 'fastest-approval') list = list.sort((a, b) => a.p95ApprovalLatencyMs - b.p95ApprovalLatencyMs);
    return list;
  }, [sortMode, spaces]);

  const filtered = useMemo(() => {
    let list = sorted;
    if (filterVertical !== 'all') list = list.filter(s => s.vertical === filterVertical);
    if (filterRuntime !== 'all') list = list.filter(s => s.runtime === filterRuntime);
    if (filterAudience !== 'all') list = list.filter(s => s.audienceTier === filterAudience);
    if (filterModelFamily !== 'all') list = list.filter(s => getModelFamily(s) === filterModelFamily);
    if (filterGovTier !== 'all') list = list.filter(s => getGovernanceTier(s) === filterGovTier);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.tags.some(t => t.includes(q)));
    }
    return list;
  }, [sorted, filterVertical, filterRuntime, filterAudience, filterModelFamily, filterGovTier, search]);

  const trendingSpaces = spaces.filter(s => s.trending);
  const newestSpaces = useMemo(() => [...spaces].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6), []);
  const highestProofSpaces = useMemo(() => [...spaces].sort((a, b) => b.proofScore - a.proofScore).slice(0, 6), []);
  const mostAuditedSpaces = useMemo(() => [...spaces].sort((a, b) => b.auditCompleteness - a.auditCompleteness).slice(0, 6), []);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem clamp(1rem, 3vw, 2rem)' }}>

        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <Link href={b('/atelier')} style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.accent }}>
                Atelier
              </span>
            </Link>
            <span style={{ color: T.textMuted, fontSize: '0.625rem' }}>/</span>
            <span style={{ fontSize: '0.625rem', fontFamily: T.mono, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.textMuted }}>Browse</span>
          </div>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 600, letterSpacing: '-0.035em', color: T.text, margin: '0 0 0.75rem', lineHeight: 1.1 }}>
            Governed Agent Spaces
          </h1>
          <p style={{ fontSize: '0.9375rem', lineHeight: 1.65, color: T.textDim, margin: 0, maxWidth: '60ch' }}>
            Every Space is constitutionally-bound, proof-chained, and cross-domain-aware. Run, embed, fork, or author your own.
          </p>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Browse', href: '/atelier', active: true },
              { label: 'Leaderboards', href: '/atelier/leaderboards', active: false },
              { label: 'My Spaces', href: '/atelier/my-spaces', active: false },
              { label: 'Create', href: '/atelier/new', active: false },
              { label: 'Manifesto', href: '/atelier/manifesto', active: false },
            ].map(nav => (
              <Link key={nav.href} href={b(nav.href)} style={{ textDecoration: 'none' }}>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 500,
                  color: nav.active ? T.accent : T.textDim,
                  borderBottom: nav.active ? `1px solid ${T.accent}` : '1px solid transparent',
                  paddingBottom: '0.125rem',
                  transition: 'color 0.15s',
                }}>
                  {nav.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {trendingSpaces.length > 0 && (
          <DiscoveryRail label="Trending Now" spaces={trendingSpaces} metricFn={s => `${s.runCount.toLocaleString()} runs`} />
        )}
        <DiscoveryRail label="Newest Spaces" spaces={newestSpaces} metricFn={s => `Created ${s.createdAt}`} />
        <DiscoveryRail label="Highest Proof Score" spaces={highestProofSpaces} metricFn={s => `Proof ${s.proofScore}`} />
        <DiscoveryRail label="Most Audited" spaces={mostAuditedSpaces} metricFn={s => `${Math.round(s.auditCompleteness * 100)}% audit`} />

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search Spaces..."
            style={{
              flex: '1 1 200px', minWidth: 160, padding: '0.5rem 0.875rem', borderRadius: 6,
              border: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.03)',
              color: T.text, fontSize: '0.8125rem', outline: 'none', fontFamily: T.mono,
            }}
          />
          <Link href={b('/atelier/new')} style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '0.5rem 1rem', borderRadius: 6, cursor: 'pointer',
              border: `1px solid rgba(201,183,135,0.3)`,
              background: 'rgba(201,183,135,0.08)',
              color: T.accent, fontSize: '0.75rem', fontWeight: 500,
              whiteSpace: 'nowrap',
            }}>
              + Create Space
            </div>
          </Link>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.5625rem', fontFamily: T.mono, color: T.textMuted }}>Sort:</span>
          {SORT_OPTIONS.map(opt => (
            <button key={opt.id} onClick={() => setSortMode(opt.id)}
              style={{
                padding: '0.3rem 0.625rem', borderRadius: 5, cursor: 'pointer', fontSize: '0.6875rem',
                border: `1px solid ${sortMode === opt.id ? T.accent : T.border}`,
                background: sortMode === opt.id ? 'rgba(201,183,135,0.08)' : 'transparent',
                color: sortMode === opt.id ? T.accent : T.textDim, transition: 'all 0.15s',
              }}>
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <span style={{ fontSize: '0.5625rem', fontFamily: T.mono, color: T.textMuted, alignSelf: 'center' }}>Filter:</span>
          <button onClick={() => { setFilterVertical('all'); setFilterRuntime('all'); setFilterAudience('all'); setFilterModelFamily('all'); setFilterGovTier('all'); }}
            style={{ padding: '0.25rem 0.5rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.625rem', fontFamily: T.mono,
              border: `1px solid ${filterVertical === 'all' && filterRuntime === 'all' && filterAudience === 'all' && filterModelFamily === 'all' && filterGovTier === 'all' ? T.accent : T.border}`,
              background: filterVertical === 'all' && filterRuntime === 'all' && filterAudience === 'all' && filterModelFamily === 'all' && filterGovTier === 'all' ? 'rgba(201,183,135,0.06)' : 'transparent',
              color: filterVertical === 'all' && filterRuntime === 'all' && filterAudience === 'all' && filterModelFamily === 'all' && filterGovTier === 'all' ? T.accent : T.textMuted }}>
            All
          </button>
          {verticals.map(v => (
            <button key={v} onClick={() => setFilterVertical(filterVertical === v ? 'all' : v)}
              style={{ padding: '0.25rem 0.5rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.625rem', fontFamily: T.mono,
                border: `1px solid ${filterVertical === v ? VERTICAL_COLORS[v] : T.border}`,
                background: filterVertical === v ? `${VERTICAL_COLORS[v]}12` : 'transparent',
                color: filterVertical === v ? VERTICAL_COLORS[v] : T.textMuted }}>
              {VERTICAL_LABELS[v]}
            </button>
          ))}
          {audiences.map(a => (
            <button key={a} onClick={() => setFilterAudience(filterAudience === a ? 'all' : a)}
              style={{ padding: '0.25rem 0.5rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.625rem', fontFamily: T.mono,
                border: `1px solid ${filterAudience === a ? AUDIENCE_META[a].color : T.border}`,
                background: filterAudience === a ? AUDIENCE_META[a].bg : 'transparent',
                color: filterAudience === a ? AUDIENCE_META[a].color : T.textMuted }}>
              {AUDIENCE_META[a].label}
            </button>
          ))}
          {runtimes.map(r => (
            <button key={r} onClick={() => setFilterRuntime(filterRuntime === r ? 'all' : r)}
              style={{ padding: '0.25rem 0.5rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.625rem', fontFamily: T.mono,
                border: `1px solid ${filterRuntime === r ? '#b794f4' : T.border}`,
                background: filterRuntime === r ? 'rgba(183,148,244,0.1)' : 'transparent',
                color: filterRuntime === r ? '#b794f4' : T.textMuted }}>
              {RUNTIME_META[r].icon} {RUNTIME_META[r].label}
            </button>
          ))}
          <span style={{ width: 1, height: 16, background: T.border, alignSelf: 'center', margin: '0 0.25rem' }} />
          {govTiers.map(gt => (
            <button key={gt} onClick={() => setFilterGovTier(filterGovTier === gt ? 'all' : gt)}
              style={{ padding: '0.25rem 0.5rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.625rem', fontFamily: T.mono,
                border: `1px solid ${filterGovTier === gt ? GOV_TIER_META[gt].color : T.border}`,
                background: filterGovTier === gt ? GOV_TIER_META[gt].bg : 'transparent',
                color: filterGovTier === gt ? GOV_TIER_META[gt].color : T.textMuted }}>
              {GOV_TIER_META[gt].label} Tier
            </button>
          ))}
          <span style={{ width: 1, height: 16, background: T.border, alignSelf: 'center', margin: '0 0.25rem' }} />
          {modelFamilies.map(mf => (
            <button key={mf} onClick={() => setFilterModelFamily(filterModelFamily === mf ? 'all' : mf)}
              style={{ padding: '0.25rem 0.5rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.625rem', fontFamily: T.mono,
                border: `1px solid ${filterModelFamily === mf ? MODEL_FAMILY_META[mf].color : T.border}`,
                background: filterModelFamily === mf ? `${MODEL_FAMILY_META[mf].color}18` : 'transparent',
                color: filterModelFamily === mf ? MODEL_FAMILY_META[mf].color : T.textMuted }}>
              {MODEL_FAMILY_META[mf].label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '0.5625rem', fontFamily: T.mono, color: T.textMuted, marginBottom: '1rem' }}>
          {filtered.length} Spaces
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.875rem' }}>
          {filtered.map((space, i) => (
            <SpaceCard key={space.id} space={space} i={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: T.textMuted }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⬡</div>
            <div style={{ fontSize: '0.875rem', color: T.textDim }}>No Spaces match your filters</div>
          </div>
        )}

        <div style={{ marginTop: '4rem', padding: '2rem', borderRadius: 10, border: `1px solid ${T.border}`, background: 'rgba(201,183,135,0.02)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.5625rem', fontFamily: T.mono, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.accent, marginBottom: '0.75rem' }}>
            Governance-First. Not Just Demos.
          </div>
          <h3 style={{ fontSize: 'clamp(1.25rem, 2vw, 1.5rem)', fontWeight: 600, color: T.text, margin: '0 0 0.875rem', letterSpacing: '-0.02em' }}>
            Every Space earns its rank. Governance score, not stars.
          </h3>
          <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: T.textDim, margin: '0 auto 1.5rem', maxWidth: '56ch' }}>
            Atelier ranks Spaces on audit completeness, policy adherence, cost-per-decision, and p95 human-approval latency — not GitHub stars or vote counts.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={b('/atelier/leaderboards')} style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: T.accent, borderBottom: `1px solid rgba(201,183,135,0.4)`, paddingBottom: '0.125rem' }}>
                View Leaderboards →
              </span>
            </Link>
            <Link href={b('/atelier/manifesto')} style={{ textDecoration: 'none' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: T.textDim }}>
                Read the Manifesto →
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
