import { useState } from 'react';
import { motion } from 'framer-motion';
import { registry } from '@szl-holdings/brand-registry';
import { T } from './alloy-theme';
import { AlloyTopBar } from './AlloyTopBar';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const b = (path: string) => `${BASE}${path}`;

const ease = [0.22, 1, 0.36, 1] as const;

const DOCTRINE_COLOR: Record<string, string> = {
  OBSERVE: '#3b82f6',
  EXECUTE: '#6366f1',
  DEFEND: '#ef4444',
};

const FLEET = registry.products;

export function AlloyFleet() {
  const [filter, setFilter] = useState<'all' | 'live' | 'development'>('all');
  const [doctrine, setDoctrine] = useState<string>('all');

  const filtered = FLEET.filter((p) => {
    const matchStatus = filter === 'all' || p.status === filter;
    const matchDoctrine = doctrine === 'all' || p.doctrineRole === doctrine;
    return matchStatus && matchDoctrine;
  });

  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: T.sans }}>
      <AlloyTopBar backLabel="Alloy" backHref={b('/hub')} />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '5rem clamp(1.25rem, 5vw, 4rem) 3rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          style={{ marginBottom: '2.5rem' }}
        >
          <h1 style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            fontWeight: 800, color: T.text, letterSpacing: '-0.04em',
            marginBottom: '0.75rem',
          }}>
            The SZL Fleet
          </h1>
          <p style={{ fontSize: '0.9375rem', color: T.textDim, maxWidth: '52ch' }}>
            Every surface in the ecosystem. Each one commands its vertical. Together they share one intelligence fabric.
          </p>
        </motion.div>

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {(['all', 'live', 'development'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                style={{
                  padding: '0.375rem 0.75rem',
                  background: filter === s ? T.accentDim : 'transparent',
                  border: `1px solid ${filter === s ? 'rgba(201,183,135,0.25)' : T.border}`,
                  borderRadius: 6, cursor: 'pointer',
                  fontSize: '0.75rem', fontWeight: 500,
                  color: filter === s ? T.accent : T.textDim,
                  transition: 'all 0.15s',
                  textTransform: 'capitalize',
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {(['all', 'OBSERVE', 'EXECUTE', 'DEFEND'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDoctrine(d)}
                style={{
                  padding: '0.375rem 0.75rem',
                  background: doctrine === d ? (d === 'all' ? T.accentDim : `${DOCTRINE_COLOR[d] ?? '#c9b787'}18`) : 'transparent',
                  border: `1px solid ${doctrine === d ? (d === 'all' ? 'rgba(201,183,135,0.25)' : `${DOCTRINE_COLOR[d] ?? '#c9b787'}40`) : T.border}`,
                  borderRadius: 6, cursor: 'pointer',
                  fontSize: '0.75rem', fontWeight: 500,
                  color: doctrine === d ? (d === 'all' ? T.accent : DOCTRINE_COLOR[d]) : T.textDim,
                  transition: 'all 0.15s',
                }}
              >
                {d === 'all' ? 'All roles' : d}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem',
        }}>
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * i, ease }}
            >
              {p.link ? (
                <a
                  href={p.link}
                  style={{
                    display: 'block', padding: '1.5rem',
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: 12, textDecoration: 'none',
                    transition: 'background 0.15s, border-color 0.15s, transform 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = 'rgba(255,255,255,0.045)';
                    el.style.borderColor = T.borderStrong;
                    el.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = T.surface;
                    el.style.borderColor = T.border;
                    el.style.transform = 'translateY(0)';
                  }}
                >
                  <ProductCard p={p} />
                </a>
              ) : (
                <div style={{
                  padding: '1.5rem', background: T.surface,
                  border: `1px solid ${T.border}`, borderRadius: 12,
                  opacity: 0.55,
                }}>
                  <ProductCard p={p} />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <p style={{ color: T.textDim, marginBottom: '0.5rem' }}>No surfaces match your filters.</p>
            <button
              type="button"
              onClick={() => { setFilter('all'); setDoctrine('all'); }}
              style={{
                padding: '0.5rem 1rem', background: T.surface,
                border: `1px solid ${T.border}`, borderRadius: 6,
                cursor: 'pointer', fontSize: '0.8125rem', color: T.textDim,
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function ProductCard({ p }: { p: typeof FLEET[0] }) {
  const docColor = p.doctrineRole ? DOCTRINE_COLOR[p.doctrineRole] ?? T.accent : T.accent;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%',
            background: p.color ?? T.accent, flexShrink: 0,
          }} />
          <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.01em' }}>
            {p.name}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {p.doctrineRole && (
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '0.15rem 0.45rem',
              background: `${docColor}14`,
              border: `1px solid ${docColor}28`,
              borderRadius: 4, fontSize: '0.5625rem', fontFamily: T.mono,
              fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: docColor,
            }}>{p.doctrineRole}</span>
          )}
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '0.15rem 0.45rem',
            background: p.status === 'live' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${p.status === 'live' ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 4, fontSize: '0.5625rem', fontFamily: T.mono,
            fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: p.status === 'live' ? '#10b981' : T.textMuted,
          }}>{p.status}</span>
        </div>
      </div>
      <p style={{ fontSize: '0.75rem', color: T.textMuted, marginBottom: '0.5rem', fontStyle: 'italic' }}>
        {p.tagline}
      </p>
      <p style={{ fontSize: '0.8125rem', color: T.textDim, lineHeight: 1.6, margin: 0 }}>
        {p.oneLiner}
      </p>
      {p.link && (
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.75rem', color: T.accent }}>Open →</span>
        </div>
      )}
    </>
  );
}
