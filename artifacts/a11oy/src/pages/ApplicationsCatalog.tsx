import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, KpiCard, Card } from '../components/ui';

const APPLICATIONS = [
  { id: 'vessels', name: 'Vessels', vertical: 'Maritime', domain: 'vessels-maritime', status: 'live', tier: 'enterprise', description: 'Fleet operations, port scheduling, ETA monitoring, demurrage risk and maritime signal mesh.', icon: '⚓', color: '#8a8a8a' },
  { id: 'counsel', name: 'Counsel', vertical: 'Legal', domain: 'prism-counsel', status: 'live', tier: 'enterprise', description: 'Legal matter lifecycle — filings, obligations, risk scoring, document intelligence.', icon: '⚖', color: '#c9b787' },
  { id: 'terra', name: 'Terra', vertical: 'Real Estate', domain: 'terra-real-estate', status: 'live', tier: 'enterprise', description: 'Portfolio intelligence — valuations, climate risk, deal pipeline, analytics.', icon: '▣', color: '#8a8a8a' },
  { id: 'aegis', name: 'Aegis', vertical: 'Defense & Security', domain: 'aegis-defense', status: 'live', tier: 'sovereign', description: 'Security and defense — threat detection, incident response, compliance posture.', icon: '⬡', color: '#f5f5f5' },
  { id: 'sentra', name: 'Sentra', vertical: 'Cyber Resilience', domain: 'sentra-cyber', status: 'live', tier: 'enterprise', description: 'Cyber resilience command — posture monitoring, threat surface, CISO intelligence.', icon: '⬡', color: '#c9b787' },
  { id: 'lyte', name: 'Lyte', vertical: 'Revenue Intelligence', domain: 'lyte-revenue', status: 'live', tier: 'enterprise', description: 'Decision debt ledger — revenue signals, pipeline health, forecast modeling.', icon: '◆', color: '#c9b787' },
  { id: 'pulse', name: 'Pulse', vertical: 'Founder Operations', domain: 'pulse', status: 'live', tier: 'platform', description: 'Founder operating channel — daily briefings, signal synthesis, decision orchestration.', icon: '◉', color: '#8a8a8a' },
  { id: 'carlota-jo', name: 'Carlota Jo', vertical: 'Consulting', domain: 'carlota-jo', status: 'live', tier: 'professional', description: 'Consulting matter management — client follow-ups, advisory brief generation.', icon: '◎', color: '#c9b787' },
  { id: 'nuro-forge', name: 'NuroForge', vertical: 'AI Infrastructure', domain: 'nuro-forge', status: 'beta', tier: 'platform', description: 'Agent forge — custom agent training, fine-tuning orchestration, evaluation harness.', icon: '⬟', color: '#5e5e5e' },
  { id: 'meridian', name: 'Meridian', vertical: 'Infrastructure', domain: 'meridian-infra', status: 'beta', tier: 'enterprise', description: 'Infrastructure intelligence — cloud cost, capacity planning, incident correlation.', icon: '⬡', color: '#5e5e5e' },
  { id: 'firestorm', name: 'Firestorm', vertical: 'Operations', domain: 'firestorm-ops', status: 'roadmap', tier: 'sovereign', description: 'Crisis operations — incident command, rapid response orchestration, impact simulation.', icon: '⬢', color: '#5e5e5e' },
  { id: 'constellation', name: 'Constellation', vertical: 'Graph Intelligence', domain: 'constellation-graph', status: 'roadmap', tier: 'platform', description: 'Cross-domain intelligence graph — entity relationships, causal chains, emergent patterns.', icon: '✦', color: '#5e5e5e' },
];

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  live:     { bg: 'rgba(201,183,135,0.12)', color: '#c9b787', label: 'LIVE' },
  beta:     { bg: 'rgba(138,138,138,0.12)', color: '#8a8a8a', label: 'BETA' },
  roadmap:  { bg: 'rgba(94,94,94,0.12)',    color: '#5e5e5e', label: 'ROADMAP' },
};

const TIER_LABELS: Record<string, string> = {
  enterprise: 'Enterprise', sovereign: 'Sovereign', professional: 'Professional', platform: 'Platform',
};

export function ApplicationsCatalog() {
  const [filter, setFilter] = useState<'all' | 'live' | 'beta' | 'roadmap'>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');

  const tiers = ['all', ...Array.from(new Set(APPLICATIONS.map(a => a.tier)))];
  const filtered = APPLICATIONS.filter(a =>
    (filter === 'all' || a.status === filter) &&
    (tierFilter === 'all' || a.tier === tierFilter)
  );

  return (
    <Layout>
      <PageHeader
        label="APPLICATIONS CATALOG"
        title="Governed Applications"
        subtitle="All 12 applications governed by the A11oy execution fabric. Each application operates across the seven-layer decision loop with proof-chain coverage on every material action."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <KpiCard label="TOTAL APPS" value={APPLICATIONS.length} sub="in constellation" accent="#c9b787" />
        <KpiCard label="LIVE" value={APPLICATIONS.filter(a => a.status === 'live').length} sub="fully operational" accent="#c9b787" />
        <KpiCard label="BETA" value={APPLICATIONS.filter(a => a.status === 'beta').length} sub="in preview" accent="#8a8a8a" />
        <KpiCard label="ROADMAP" value={APPLICATIONS.filter(a => a.status === 'roadmap').length} sub="coming soon" accent="#5e5e5e" />
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <div className="flex gap-1">
          {(['all', 'live', 'beta', 'roadmap'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="px-3 py-1 rounded text-xs font-mono transition-all"
              style={{
                background: filter === s ? 'rgba(201,183,135,0.15)' : 'rgba(255,255,255,0.04)',
                color: filter === s ? '#c9b787' : 'var(--color-a11oy-text-ghost)',
                border: `1px solid ${filter === s ? 'rgba(201,183,135,0.3)' : 'rgba(255,255,255,0.08)'}`,
              }}
            >{s.toUpperCase()}</button>
          ))}
        </div>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <div className="flex gap-1">
          {tiers.map(t => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className="px-3 py-1 rounded text-xs font-mono transition-all"
              style={{
                background: tierFilter === t ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                color: tierFilter === t ? 'var(--color-a11oy-text)' : 'var(--color-a11oy-text-ghost)',
                border: `1px solid ${tierFilter === t ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >{t === 'all' ? 'ALL TIERS' : TIER_LABELS[t]?.toUpperCase() ?? t.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(app => {
          const sc = STATUS_COLORS[app.status] ?? STATUS_COLORS.roadmap;
          return (
            <div
              key={app.id}
              className="rounded-lg border p-5 flex flex-col gap-3 transition-all"
              style={{
                backgroundColor: 'var(--color-a11oy-card)',
                borderColor: 'var(--color-a11oy-border)',
                borderTop: `3px solid ${app.color}`,
                opacity: app.status === 'roadmap' ? 0.7 : 1,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '1.25rem', color: app.color }}>{app.icon}</span>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{app.name}</div>
                    <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{app.vertical}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                  <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{TIER_LABELS[app.tier]}</span>
                </div>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-a11oy-text-sub)' }}>{app.description}</p>
              <div className="text-xs font-mono mt-auto pt-2 border-t" style={{ color: 'var(--color-a11oy-text-ghost)', borderColor: 'var(--color-a11oy-border)' }}>
                {app.domain}
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
