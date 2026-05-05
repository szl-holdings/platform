import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout';
import { ResearchCitationPanel } from './ResearchCitationPanel';
import type { Citation } from './ResearchCitationPanel';
import {
  FRONTIER_TOKENS,
  FrontierPageHeader,
  FrontierKpiTile,
  FrontierCitationBanner,
  FrontierCrossLinks,
} from './FrontierPrimitives';

const API = '/api/helios';
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const { GOLD, DIM, MUTED, BORDER, SURFACE } = FRONTIER_TOKENS;

type ScannerStatus = 'healthy' | 'degraded' | 'error' | 'idle';

interface Scanner {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  lastRun: string | null;
  nextRun: string | null;
  status: ScannerStatus;
  signalsToday: number;
  totalSignals: number;
  errorMessage?: string;
  requiresLicense?: boolean;
}

const STATUS_COLOR: Record<ScannerStatus, string> = {
  healthy: '#8de3b5',
  degraded: '#e3d36b',
  error: '#e36b6b',
  idle: '#8a8a8a',
};

const SCANNER_CITATIONS: Citation[] = [
  {
    id: 'cit-scan-arxiv', lab: 'arXiv / Cornell', kind: 'standard',
    title: 'arXiv cs.AI, cs.LG, cs.RO RSS Feed — Intelligence Source',
    sourceUrl: 'https://arxiv.org',
    sourceName: 'arXiv.org',
    excerpt: 'Primary academic pre-print source for capability signals. The A11oy arXiv scanner monitors cs.AI, cs.LG, cs.RO, and cs.CR categories daily, extracting entity mentions and benchmark claims.',
    date: 'May 2026',
  },
  {
    id: 'cit-scan-cisa', lab: 'CISA / DHS', kind: 'standard',
    title: 'Known Exploited Vulnerabilities Catalog',
    sourceUrl: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
    sourceName: 'CISA KEV',
    excerpt: 'Authoritative source for regulatory and threat signals affecting AI infrastructure. The regulation scanner ingests CISA KEV and NIST NVD daily.',
    date: 'May 2026',
  },
];

function StatusDot({ status }: { status: ScannerStatus }) {
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
      background: STATUS_COLOR[status],
      boxShadow: status === 'healthy' ? `0 0 5px ${STATUS_COLOR[status]}` : 'none',
    }} />
  );
}

export function ScannerAdmin() {
  const [scanners, setScanners] = useState<Scanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`${API}/scanners`)
      .then(r => r.json())
      .then(d => setScanners(d.scanners ?? []))
      .catch(() => setError('Scanner network unavailable'))
      .finally(() => setLoading(false));
  }, []);

  function toggle(id: string, enabled: boolean) {
    setToggling(id);
    fetch(`${API}/scanners/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.scanner) {
          setScanners(prev => prev.map(s => s.id === id ? d.scanner : s));
        }
      })
      .catch(() => {})
      .finally(() => setToggling(null));
  }

  function runScanner(id: string) {
    setRunning(id);
    fetch(`${API}/scanners/${id}/run`, { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        if (d.message) setMessages(prev => ({ ...prev, [id]: d.message }));
        if (d.scanner) setScanners(prev => prev.map(s => s.id === id ? d.scanner : s));
        return fetch(`${API}/scanners`).then(r => r.json());
      })
      .then(d => { if (d.scanners) setScanners(d.scanners); })
      .catch(() => setMessages(prev => ({ ...prev, [id]: 'Scanner run failed.' })))
      .finally(() => setRunning(null));
  }

  const activeCount = scanners.filter(s => s.enabled).length;
  const healthyCount = scanners.filter(s => s.status === 'healthy').length;
  const totalToday = scanners.reduce((sum, s) => sum + s.signalsToday, 0);

  return (
    <Layout>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <FrontierPageHeader
          base={BASE}
          section="Scanners"
          title="Scanner Network"
          description="Autonomous intelligence scanners that ingest signals from arXiv, vendor newsrooms, regulatory bodies, and market intelligence feeds."
        />

        {!loading && !error && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <FrontierKpiTile label="Active" value={activeCount} color="#8de3b5" />
            <FrontierKpiTile label="Healthy" value={healthyCount} color="#8de3b5" />
            <FrontierKpiTile label="Signals today" value={totalToday} color={GOLD} />
            <FrontierKpiTile label="Total scanners" value={scanners.length} color={DIM} />
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: 48, color: MUTED, fontFamily: 'var(--font-mono, monospace)', fontSize: 12 }}>
            Loading scanners…
          </div>
        )}
        {error && (
          <div style={{ padding: 16, background: '#e36b6b18', border: '1px solid #e36b6b40', borderRadius: 6, color: '#e36b6b', fontSize: 12 }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {scanners.map(s => (
              <div key={s.id} style={{
                border: `1px solid ${s.enabled ? (s.status === 'error' ? '#e36b6b40' : `${STATUS_COLOR[s.status]}30`) : BORDER}`,
                borderRadius: 10, background: SURFACE, padding: '14px 18px',
                opacity: s.enabled ? 1 : 0.65, transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <StatusDot status={s.status} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#f5f5f5' }}>{s.name}</span>
                      <span style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: STATUS_COLOR[s.status], background: `${STATUS_COLOR[s.status]}18`, border: `1px solid ${STATUS_COLOR[s.status]}40`, padding: '2px 6px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {s.status}
                      </span>
                      {s.requiresLicense && (
                        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: '#e3a06b', background: 'rgba(227,160,107,0.1)', border: '1px solid rgba(227,160,107,0.35)', padding: '2px 8px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          requires commercial license
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: DIM, margin: '0 0 10px', lineHeight: 1.5 }}>{s.description}</p>

                    {s.errorMessage && (
                      <div style={{ fontSize: 11, color: '#e36b6b', background: '#e36b6b10', border: '1px solid #e36b6b30', borderRadius: 4, padding: '6px 10px', marginBottom: 10, fontFamily: 'var(--font-mono, monospace)' }}>
                        {s.errorMessage}
                      </div>
                    )}
                    {messages[s.id] && (
                      <div style={{ fontSize: 11, color: '#8de3b5', background: '#8de3b510', border: '1px solid #8de3b530', borderRadius: 4, padding: '6px 10px', marginBottom: 10, fontFamily: 'var(--font-mono, monospace)' }}>
                        {messages[s.id]}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      <div>
                        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Today </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>{s.signalsToday}</span>
                        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: MUTED }}> signals</span>
                      </div>
                      <div>
                        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#f5f5f5' }}>{s.totalSignals.toLocaleString()}</span>
                      </div>
                      {s.lastRun && (
                        <div>
                          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Last run </span>
                          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono, monospace)', color: DIM }}>
                            {new Date(s.lastRun).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {s.nextRun && (
                        <div>
                          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Next run </span>
                          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono, monospace)', color: DIM }}>
                            {new Date(s.nextRun).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    {s.requiresLicense ? (
                      <div
                        title="Enabling this scanner requires a commercial data license. Contact your administrator."
                        style={{
                          padding: '5px 14px', fontSize: 11, fontFamily: 'var(--font-mono, monospace)',
                          background: 'rgba(227,160,107,0.06)', border: '1px solid rgba(227,160,107,0.25)',
                          color: 'rgba(227,160,107,0.5)', borderRadius: 5, minWidth: 72, textAlign: 'center',
                          userSelect: 'none', cursor: 'not-allowed',
                        }}
                      >
                        Locked
                      </div>
                    ) : (
                    <button
                      type="button"
                      disabled={toggling === s.id}
                      onClick={() => toggle(s.id, !s.enabled)}
                      style={{
                        padding: '5px 14px', fontSize: 11, fontFamily: 'var(--font-mono, monospace)',
                        background: s.enabled ? 'rgba(255,255,255,0.05)' : `${GOLD}20`,
                        border: `1px solid ${s.enabled ? BORDER : `${GOLD}60`}`,
                        color: s.enabled ? DIM : GOLD,
                        borderRadius: 5, cursor: 'pointer', transition: 'all 0.15s',
                        minWidth: 72, textAlign: 'center',
                      }}
                    >
                      {toggling === s.id ? '…' : s.enabled ? 'Disable' : 'Enable'}
                    </button>
                    )}
                    {s.enabled && (
                      <button
                        type="button"
                        disabled={running === s.id}
                        onClick={() => runScanner(s.id)}
                        style={{
                          padding: '5px 14px', fontSize: 11, fontFamily: 'var(--font-mono, monospace)',
                          background: 'transparent', border: `1px solid ${BORDER}`,
                          color: DIM, borderRadius: 5, cursor: 'pointer',
                          minWidth: 72, textAlign: 'center', transition: 'all 0.15s',
                        }}
                      >
                        {running === s.id ? 'Running…' : 'Run now'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <FrontierCrossLinks
          base={BASE}
          links={[
            { label: 'System Health', path: '/frontier/system', desc: 'Scanner status is surfaced in the Frontier system health dashboard' },
            { label: 'Signal Feed', path: '/frontier/feed', desc: 'Healthy scanners produce the signals that populate the Signal Feed' },
            { label: 'Recommendations', path: '/recommendations', desc: 'Scanner throughput determines recommendation queue freshness' },
            { label: 'Self-Optimization', path: '/self-optimization', desc: 'Scanner coverage gaps inform intelligence-layer optimization targets' },
          ]}
        />
        <ResearchCitationPanel citations={SCANNER_CITATIONS} title="Scanner source references" />
      </div>
    </Layout>
  );
}
