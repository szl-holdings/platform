import { useState } from 'react';
import { Layout } from '../components/layout';
import { KpiCard } from '../components/ui';
import { motion } from 'framer-motion';
import { APPLICATIONS, type ApplicationStatus, type ApplicationSector } from '../data/blueprint';

type StatusKey = ApplicationStatus;
type GroupMode = 'maturity' | 'domain';

const STATUS_META: Record<StatusKey, { label: string; bg: string; color: string; desc: string }> = {
  'operational':    { label: 'Operational',    bg: 'rgba(201,183,135,0.12)', color: '#c9b787', desc: 'Fully operational with live data' },
  'in-development': { label: 'In Development', bg: 'rgba(138,138,138,0.12)', color: '#8a8a8a', desc: 'Active build — preview available' },
  'planned':        { label: 'Planned',         bg: 'rgba(94,94,94,0.12)',   color: '#5e5e5e', desc: 'On the roadmap — not yet started' },
};

const MATURITY_ORDER: StatusKey[] = ['operational', 'in-development', 'planned'];

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

const T = {
  bg: '#0a0a0a',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  textDim: '#8a8a8a',
  textMuted: '#5e5e5e',
  accent: '#c9b787',
  mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
  serif: "Georgia, 'Times New Roman', Times, serif",
};

function AppCard({ app, i }: { app: typeof APPLICATIONS[number]; i: number }) {
  const sm = STATUS_META[app.status];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.45, delay: i * 0.04, ease }}
      style={{
        padding: '1.75rem', background: T.bg,
        borderTop: `2px solid ${app.color}`,
        display: 'flex', flexDirection: 'column', gap: '0.875rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{ fontSize: '1.25rem', color: app.color }}>{app.icon}</span>
          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: T.text, letterSpacing: '-0.015em' }}>{app.name}</div>
            <div style={{ fontSize: '0.625rem', fontFamily: T.mono, color: T.textMuted, marginTop: '0.125rem' }}>{app.vertical}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', flexShrink: 0 }}>
          <span style={{
            fontSize: '0.5625rem', fontFamily: T.mono, fontWeight: 600,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '0.2rem 0.5rem', borderRadius: 4,
            color: sm.color, background: sm.bg,
          }}>{sm.label}</span>
          <span style={{ fontSize: '0.5625rem', color: T.textMuted, fontFamily: T.mono }}>{app.tier}</span>
        </div>
      </div>

      <p style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: T.textDim, margin: 0 }}>
        {app.description}
      </p>

      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', paddingTop: '0.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {app.principles.map(pr => (
          <span key={pr} style={{
            fontSize: '0.5625rem', fontFamily: T.mono, fontWeight: 500,
            padding: '0.15rem 0.45rem', borderRadius: 4,
            color: T.accent, background: 'rgba(201,183,135,0.08)',
            border: '1px solid rgba(201,183,135,0.18)',
          }}>{pr}</span>
        ))}
        {'registryProfileId' in app && app.registryProfileId && (
          <span style={{
            fontSize: '0.5625rem', fontFamily: T.mono,
            padding: '0.15rem 0.45rem', borderRadius: 4,
            color: T.textMuted, background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${T.border}`,
          }}>registry:{app.registryProfileId}</span>
        )}
      </div>
    </motion.div>
  );
}

export function ApplicationsCatalog() {
  const [groupMode, setGroupMode] = useState<GroupMode>('maturity');
  const [statusFilter, setStatusFilter] = useState<StatusKey | 'all'>('all');

  const filtered = statusFilter === 'all' ? APPLICATIONS : APPLICATIONS.filter(a => a.status === statusFilter);

  const operationalCount = APPLICATIONS.filter(a => a.status === 'operational').length;
  const inDevCount = APPLICATIONS.filter(a => a.status === 'in-development').length;
  const plannedCount = APPLICATIONS.filter(a => a.status === 'planned').length;

  const maturityGroups = MATURITY_ORDER.map(status => ({
    key: status,
    label: STATUS_META[status].label,
    meta: STATUS_META[status],
    items: filtered.filter(a => a.status === status),
  })).filter(g => g.items.length > 0);

  const sectors: ApplicationSector[] = Array.from(new Set(filtered.map(a => a.sector)));
  const domainGroups = sectors.map(sector => ({
    key: sector,
    label: sector,
    items: filtered.filter(a => a.sector === sector),
  })).filter(g => g.items.length > 0);

  return (
    <Layout>
      <div style={{ paddingBottom: '4rem' }}>
        <div style={{ padding: '3rem 0 2.5rem', borderBottom: `1px solid ${T.border}`, marginBottom: '2.5rem' }}>
          <p style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 1.25rem' }}>Applications</p>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontFamily: T.serif, fontWeight: 400, letterSpacing: '-0.03em', color: T.text, lineHeight: 1.1, margin: '0 0 1rem' }}>
            Constellation of Governed Applications
          </h1>
          <p style={{ fontSize: '1.0625rem', lineHeight: 1.7, color: T.textDim, maxWidth: '64ch', margin: 0 }}>
            All 12 applications governed by the A11oy agentic layer — each running the same seven governing
            principles with honest status for every domain. Six registered in the AEEP domain profile registry.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: T.border, borderRadius: 12, overflow: 'hidden', border: `1px solid ${T.border}`, marginBottom: '2rem' }}>
          <KpiCard label="TOTAL APPLICATIONS" value={APPLICATIONS.length} sub="in constellation" accent="#c9b787" />
          <KpiCard label="OPERATIONAL" value={operationalCount} sub="fully live" accent="#c9b787" />
          <KpiCard label="IN DEVELOPMENT" value={inDevCount} sub="active build" accent="#8a8a8a" />
          <KpiCard label="PLANNED" value={plannedCount} sub="on roadmap" accent="#5e5e5e" />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '0.25rem', border: `1px solid ${T.border}` }}>
            {(['maturity', 'domain'] as GroupMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setGroupMode(mode)}
                style={{
                  padding: '0.35rem 0.75rem', borderRadius: 6,
                  fontSize: '0.75rem', fontFamily: T.mono, fontWeight: 500,
                  border: 'none',
                  background: groupMode === mode ? 'rgba(201,183,135,0.15)' : 'transparent',
                  color: groupMode === mode ? T.accent : T.textDim,
                  cursor: 'pointer',
                }}
              >
                {mode === 'maturity' ? 'Group by Maturity' : 'Group by Domain'}
              </button>
            ))}
          </div>

          {groupMode === 'maturity' && (
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              {(['all', ...MATURITY_ORDER] as const).map(s => {
                const meta = s !== 'all' ? STATUS_META[s] : null;
                const isActive = statusFilter === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    style={{
                      padding: '0.4rem 0.875rem', borderRadius: 6,
                      fontSize: '0.75rem', fontFamily: T.mono, fontWeight: 500,
                      border: `1px solid ${isActive ? (meta?.color ?? 'rgba(201,183,135,0.3)') : T.border}`,
                      background: isActive ? `${meta?.color ?? '#c9b787'}12` : 'rgba(255,255,255,0.03)',
                      color: isActive ? (meta?.color ?? '#c9b787') : T.textDim,
                      cursor: 'pointer',
                    }}
                  >
                    {s === 'all' ? 'ALL' : STATUS_META[s as StatusKey].label.toUpperCase()}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {groupMode === 'maturity' ? (
          maturityGroups.map(({ key, label, meta, items }) => (
            <div key={key} style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: meta.color }}>
                  {label}
                </span>
                <span style={{ fontSize: '0.625rem', fontFamily: T.mono, color: T.textMuted }}>{meta.desc}</span>
                <span style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: 4, color: meta.color, background: meta.bg }}>
                  {items.length}
                </span>
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1px', background: T.border, borderRadius: 12, overflow: 'hidden',
                border: `1px solid ${T.border}`,
                opacity: key === 'planned' ? 0.75 : 1,
              }}>
                {items.map((app, i) => <AppCard key={app.id} app={app} i={i} />)}
              </div>
            </div>
          ))
        ) : (
          domainGroups.map(({ key, label, items }) => (
            <div key={key} style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.textMuted }}>
                  Domain
                </span>
                <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: T.text, letterSpacing: '-0.015em' }}>{label}</span>
                <span style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: 4, color: T.textDim, background: 'rgba(255,255,255,0.06)' }}>
                  {items.length}
                </span>
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1px', background: T.border, borderRadius: 12, overflow: 'hidden',
                border: `1px solid ${T.border}`,
              }}>
                {items.map((app, i) => <AppCard key={app.id} app={app} i={i} />)}
              </div>
            </div>
          ))
        )}

        <div style={{ marginTop: '2rem', padding: '1.5rem 1.75rem', borderTop: `2px solid ${T.accent}`, background: 'rgba(201,183,135,0.04)', borderRadius: 8 }}>
          <p style={{ fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.accent, margin: '0 0 0.5rem' }}>Atelier</p>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: T.text, margin: '0 0 0.375rem', letterSpacing: '-0.015em' }}>Author governed agent Spaces</h3>
          <p style={{ fontSize: '0.8125rem', lineHeight: 1.6, color: T.textDim, margin: '0 0 0.75rem', maxWidth: '64ch' }}>
            Beyond the constellation — Atelier lets operators publish governed AI Spaces with constitution
            binding, connector allowlists, and proof on every run.
          </p>
          <a href={`${(import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '')}/atelier`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontFamily: T.mono, fontWeight: 600, color: T.accent, textDecoration: 'none', letterSpacing: '0.06em' }}>
            Open Atelier →
          </a>
        </div>
      </div>
    </Layout>
  );
}
