import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PLUGIN_CATEGORIES, PLUGIN_TOTALS } from '../data/pluginHubData';
import type { Plugin } from '../data/pluginHubData';

const T = {
  bg: '#0a0a0a', surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.12)', text: '#f5f5f5', textDim: '#8a8a8a',
  textMuted: '#5e5e5e', accent: '#c9b787',
  mono: "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
};
const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

const TIER_COLORS: Record<string, string> = {
  core: T.accent,
  governed: '#7ab8d9',
  mcp: '#b794f4',
  skill: T.textMuted,
};

function KpiCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div style={{ padding: '0.75rem 1rem', borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface }}>
      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: T.text, margin: 0, fontFamily: T.mono }}>{value}</p>
      <p style={{ fontSize: '0.5625rem', fontFamily: T.mono, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.textMuted, margin: '0.125rem 0 0' }}>{label}</p>
      {sub && <p style={{ fontSize: '0.625rem', color: T.textDim, margin: '0.125rem 0 0' }}>{sub}</p>}
    </div>
  );
}

function PluginCard({ plugin }: { plugin: Plugin }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '1rem 1.25rem', borderRadius: 8,
        border: `1px solid ${hovered ? 'rgba(201,183,135,0.25)' : T.border}`,
        background: hovered ? 'rgba(201,183,135,0.03)' : T.bg,
        cursor: 'default', transition: 'all 0.2s ease',
        display: 'flex', flexDirection: 'column', gap: '0.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{plugin.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: T.text, margin: 0, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{plugin.name}</h4>
        </div>
        <span style={{
          fontSize: '0.5rem', fontFamily: T.mono, fontWeight: 600,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: TIER_COLORS[plugin.tier] ?? T.textMuted,
          padding: '0.15rem 0.4rem', borderRadius: 3,
          border: `1px solid ${plugin.tier === 'core' ? 'rgba(201,183,135,0.2)' : 'rgba(255,255,255,0.06)'}`,
          background: plugin.tier === 'core' ? 'rgba(201,183,135,0.08)' : 'rgba(255,255,255,0.03)',
          flexShrink: 0,
        }}>{plugin.tier}</span>
      </div>
      <p style={{ fontSize: '0.75rem', lineHeight: 1.55, color: T.textDim, margin: 0 }}>{plugin.desc}</p>
      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: 'auto' }}>
        {plugin.tags.map(tag => (
          <span key={tag} style={{
            fontSize: '0.5625rem', fontFamily: T.mono, padding: '0.1rem 0.35rem', borderRadius: 3,
            background: 'rgba(255,255,255,0.03)', color: T.textMuted,
            border: `1px solid rgba(255,255,255,0.05)`,
          }}>{tag}</span>
        ))}
      </div>
    </motion.div>
  );
}

export function PluginHub() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let cats = PLUGIN_CATEGORIES;
    if (activeCategory) cats = cats.filter(c => c.id === activeCategory);
    if (!search.trim()) return cats;
    const q = search.toLowerCase();
    return cats.map(c => ({
      ...c,
      plugins: c.plugins.filter(p =>
        p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) ||
        p.tags.some(t => t.includes(q))
      ),
    })).filter(c => c.plugins.length > 0);
  }, [activeCategory, search]);

  const totalShown = filtered.reduce((s, c) => s + c.plugins.length, 0);

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, padding: '2rem clamp(1rem, 3vw, 2rem)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 0.75rem' }}>
            Plugin Hub
          </p>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 600, letterSpacing: '-0.035em', color: T.text, margin: '0 0 0.75rem', lineHeight: 1.1 }}>
            Every plugin. Governed.
          </h1>
          <p style={{ fontSize: '0.9375rem', lineHeight: 1.65, color: T.textDim, margin: 0, maxWidth: '60ch' }}>
            {PLUGIN_TOTALS.total} integrations across {PLUGIN_TOTALS.categories} categories — apps, skills, MCPs, and
            a11oy-native modules. Every plugin call is proof-chained. Every action is attributed. Every result
            feeds the Outcome Graph.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
          <KpiCard label="Total Plugins" value={PLUGIN_TOTALS.total} />
          <KpiCard label="Core Apps" value={PLUGIN_TOTALS.apps} />
          <KpiCard label="Skills" value={PLUGIN_TOTALS.skills} />
          <KpiCard label="MCP Servers" value={PLUGIN_TOTALS.mcps} />
          <KpiCard label="Categories" value={PLUGIN_TOTALS.categories} />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search plugins..."
            style={{
              flex: '1 1 240px', padding: '0.625rem 1rem', borderRadius: 6,
              border: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.03)',
              color: T.text, fontSize: '0.8125rem', outline: 'none',
              fontFamily: T.mono,
            }}
          />
          <button
            onClick={() => setActiveCategory(null)}
            style={{
              padding: '0.5rem 0.75rem', borderRadius: 6, cursor: 'pointer',
              border: `1px solid ${!activeCategory ? T.accent : T.border}`,
              background: !activeCategory ? 'rgba(201,183,135,0.08)' : 'transparent',
              color: !activeCategory ? T.accent : T.textDim,
              fontSize: '0.75rem', fontWeight: 500,
            }}
          >
            All ({PLUGIN_TOTALS.total})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {PLUGIN_CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(activeCategory === c.id ? null : c.id)}
              style={{
                padding: '0.375rem 0.75rem', borderRadius: 5, cursor: 'pointer',
                border: `1px solid ${activeCategory === c.id ? T.accent : T.border}`,
                background: activeCategory === c.id ? 'rgba(201,183,135,0.08)' : 'transparent',
                color: activeCategory === c.id ? T.accent : T.textDim,
                fontSize: '0.6875rem', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: '0.875rem' }}>{c.icon}</span>
              {c.name}
              <span style={{ fontSize: '0.5625rem', fontFamily: T.mono, color: T.textMuted }}>
                {c.plugins.length}
              </span>
            </button>
          ))}
        </div>

        <p style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 1rem' }}>
          Showing {totalShown} plugins
        </p>

        {filtered.map(cat => (
          <div key={cat.id} style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.25rem' }}>{cat.icon}</span>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: T.text, margin: 0, letterSpacing: '-0.01em' }}>{cat.name}</h2>
              <span style={{ fontSize: '0.625rem', fontFamily: T.mono, color: T.textMuted, padding: '0.15rem 0.4rem', borderRadius: 3, background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}` }}>
                {cat.plugins.length}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.625rem' }}>
              {cat.plugins.map((p, i) => <PluginCard key={`${cat.id}-${i}`} plugin={p} />)}
            </div>
          </div>
        ))}

        <div style={{
          marginTop: '3rem', padding: '2rem', borderRadius: 10,
          border: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.015)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.accent, margin: '0 0 0.75rem' }}>
            The a11oy Difference
          </p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: T.text, margin: '0 0 1rem', letterSpacing: '-0.02em' }}>
            Every plugin call is proof-chained.
          </h3>
          <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: T.textDim, margin: '0 auto', maxWidth: '56ch' }}>
            Other platforms give you plugins as black boxes. a11oy wraps every integration in the
            governed Decision Loop — signal detection, policy gating, execution with attribution,
            and outcome recording. No plugin bypasses the proof chain.
          </p>
        </div>
      </div>
    </div>
  );
}
