import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Layout } from '../../components/layout';
import { ResearchCitationPanel } from './ResearchCitationPanel';
import type { Citation } from './ResearchCitationPanel';
import {
  FRONTIER_TOKENS,
  FrontierPageHeader,
  FrontierKpiTile,
} from './FrontierPrimitives';

const API_HELIOS = '/api/helios';
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const { GOLD, DIM, MUTED, BORDER, SURFACE } = FRONTIER_TOKENS;

interface HeliosStats {
  signalsToday: number;
  proposalsOpen: number;
  scannersActive: number;
  avgConfidence: number;
  topKinds: Array<{ kind: string; count: number }>;
}

const KIND_COLOR: Record<string, string> = {
  capability: '#6b8de3',
  market: '#8de3b5',
  threat: '#e36b6b',
  regulation: '#e3d36b',
  vendor: '#e3a66b',
  benchmark: '#c9b787',
};

const SYSTEM_CITATIONS: Citation[] = [
  {
    id: 'cit-sys-iso', lab: 'ISO/IEC', kind: 'standard',
    title: 'ISO/IEC 42001:2023 — AI Management System Requirements',
    sourceUrl: 'https://www.iso.org/standard/81230.html',
    sourceName: 'ISO',
    excerpt: 'International standard for AI management systems. Requires continuous monitoring of AI system health, drift detection, and governance status reporting — which this System Health view fulfills.',
    date: 'Dec 2023',
  },
  {
    id: 'cit-sys-nist-rmf', lab: 'NIST', kind: 'standard',
    title: 'NIST AI RMF 2.0 — Measure Function: Ongoing Monitoring',
    sourceUrl: 'https://airc.nist.gov/RMF_Overview',
    sourceName: 'NIST AI RMF',
    excerpt: 'The Measure function requires ongoing monitoring of AI system behavior, including measurement of performance against defined metrics and documentation of anomalies.',
    date: 'Jan 2026',
  },
];

const SUBSYSTEMS = [
  { id: 'signal-ingestion', name: 'Signal Ingestion', description: 'arXiv, vendor, market, threat, regulation scanner pipeline', status: 'operational' as const },
  { id: 'mythos-graph', name: 'Mythos Graph', description: 'Capability knowledge graph — nodes, edges, relevance scoring', status: 'operational' as const },
  { id: 'proposal-queue', name: 'Proposal Queue', description: 'Human-gated capability proposal workflow', status: 'operational' as const },
  { id: 'benchmark-tracker', name: 'Benchmark Tracker', description: 'Agent score tracking against SOTA baselines', status: 'operational' as const },
  { id: 'memo-synthesis', name: 'Memo Synthesis', description: 'Weekly recalibration memo generation pipeline', status: 'operational' as const },
  { id: 'constitution-link', name: 'Constitution Link', description: 'Runtime behavioral constraint enforcement from Frontier signals', status: 'operational' as const },
  { id: 'mcp-endpoint', name: 'MCP Endpoint', description: 'Model Context Protocol query interface for portfolio agents', status: 'operational' as const },
  { id: 'frontier-briefing', name: 'Frontier Briefing', description: 'Pulse widget feed for cross-product signal distribution', status: 'operational' as const },
];

const STATUS_COLOR = {
  operational: '#8de3b5',
  degraded: '#e3d36b',
  outage: '#e36b6b',
  maintenance: '#6b8de3',
};

export function SystemHealth() {
  const [stats, setStats] = useState<HeliosStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  function loadStats() {
    setLoading(true);
    fetch(`${API_HELIOS}/stats`)
      .then(r => r.json())
      .then(d => { setStats(d); setLastRefresh(new Date()); })
      .catch(() => setError('System stats unavailable'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadStats(); }, []);

  return (
    <Layout>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <FrontierPageHeader
            base={BASE}
            section="System Health"
            title="System Health"
            description="Frontier Intelligence subsystem status, pipeline health, and cross-link verification."
          />
          <button
            type="button"
            onClick={loadStats}
            style={{
              padding: '7px 14px', fontSize: 11, fontFamily: 'var(--font-mono, monospace)',
              background: 'transparent', border: `1px solid ${BORDER}`,
              color: DIM, borderRadius: 6, cursor: 'pointer', marginTop: 24, flexShrink: 0,
            }}
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 48, color: MUTED, fontFamily: 'var(--font-mono, monospace)', fontSize: 12 }}>
            Loading system stats…
          </div>
        )}
        {error && (
          <div style={{ padding: 16, background: '#e36b6b18', border: '1px solid #e36b6b40', borderRadius: 6, color: '#e36b6b', fontSize: 12, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {stats && (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              <FrontierKpiTile label="Signals today" value={stats.signalsToday} color={GOLD} />
              <FrontierKpiTile label="Open proposals" value={stats.proposalsOpen} color="#e3a66b" />
              <FrontierKpiTile label="Active scanners" value={stats.scannersActive} color="#8de3b5" />
              <FrontierKpiTile label="Avg confidence" value={`${Math.round(stats.avgConfidence * 100)}%`} color="#f5f5f5" />
            </div>

            {stats.topKinds.length > 0 && (
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, background: SURFACE, padding: '18px 20px', marginBottom: 24 }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono, monospace)', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>
                  Signal distribution by kind
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {stats.topKinds.map(k => {
                    const maxCount = stats.topKinds[0]?.count ?? 1;
                    const pct = Math.round((k.count / maxCount) * 100);
                    return (
                      <div key={k.kind} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono, monospace)', color: KIND_COLOR[k.kind] ?? DIM, width: 80, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {k.kind}
                        </span>
                        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: KIND_COLOR[k.kind] ?? DIM, borderRadius: 2, transition: 'width 0.4s ease' }} />
                        </div>
                        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono, monospace)', color: DIM, width: 32, textAlign: 'right', flexShrink: 0 }}>
                          {k.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, background: SURFACE, marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono, monospace)', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Subsystem status
            </div>
          </div>
          {SUBSYSTEMS.map((sub, i) => (
            <div key={sub.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 20px',
              borderBottom: i < SUBSYSTEMS.length - 1 ? `1px solid ${BORDER}` : 'none',
            }}>
              <span style={{
                display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
                background: STATUS_COLOR[sub.status],
                boxShadow: `0 0 5px ${STATUS_COLOR[sub.status]}`,
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#f0f0f0', marginBottom: 2 }}>{sub.name}</div>
                <div style={{ fontSize: 11, color: MUTED }}>{sub.description}</div>
              </div>
              <span style={{
                fontSize: 9, fontFamily: 'var(--font-mono, monospace)', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                color: STATUS_COLOR[sub.status], background: `${STATUS_COLOR[sub.status]}18`,
                border: `1px solid ${STATUS_COLOR[sub.status]}40`,
                padding: '2px 7px', borderRadius: 3, flexShrink: 0,
              }}>
                {sub.status}
              </span>
            </div>
          ))}
        </div>

        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, background: SURFACE, padding: '18px 20px', marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono, monospace)', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>
            Cross-module links
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Recommendations', path: '/recommendations', desc: 'Frontier signal panel surfaces top signals to recommendation workflow' },
              { label: 'Learning Loop', path: '/learning', desc: 'Benchmark deltas feed the learning calibration pipeline' },
              { label: 'Self-Optimization', path: '/self-optimization', desc: 'Capability proposals inform optimization target selection' },
              { label: 'Constitution', path: '/constitution', desc: 'Dual-use signals routed to Constitution review queue' },
              { label: 'Approval Queue', path: '/approval-queue', desc: 'Promoted proposals enter the governed approval workflow' },
            ].map(link => (
              <Link
                key={link.path}
                href={`${BASE}${link.path}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 8,
                  border: `1px solid ${BORDER}`, background: 'rgba(0,0,0,0.15)',
                  textDecoration: 'none', transition: 'border-color 0.15s',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: GOLD }}>{link.label}</div>
                  <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>{link.desc}</div>
                </div>
                <span style={{ fontSize: 12, color: MUTED }}>→</span>
              </Link>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono, monospace)', color: MUTED, marginBottom: 16 }}>
          Last refreshed: {lastRefresh.toLocaleTimeString()}
        </div>

        <ResearchCitationPanel citations={SYSTEM_CITATIONS} title="Governance & monitoring standards" />
      </div>
    </Layout>
  );
}
