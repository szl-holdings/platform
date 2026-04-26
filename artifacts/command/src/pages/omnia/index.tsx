import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Globe,
  Info,
  Layers,
  Network,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { OmniaLayout } from './layout';

const BASE_API = import.meta.env.BASE_URL.replace(/\/$/, '').replace(/\/command$/, '') || '';
const ACCENT = '#8b7ac8';

const DOMAIN_COLORS: Record<string, string> = {
  aegis: '#ef4444',
  sentra: '#22c55e',
  vessels: '#4d8fcc',
  terra: '#22c55e',
  counsel: '#8b5cf6',
  command: '#8b7ac8',
  a11oy: '#c9b787',
  holdings: '#c9b787',
  pulse: '#f59e0b',
  lyte: '#3b82f6',
};

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#3b82f6',
  info: '#6b7280',
};

interface NarrativeSignal {
  id: string;
  label: string;
  domain: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  deepLink?: string;
}

interface WorldSummary {
  totalEntities: number;
  totalRelationships: number;
  lastRefreshed: string;
  activeDomains: string[];
}

interface SynthesisData {
  headline: string;
  summary: string;
  signals: NarrativeSignal[];
  generatedAt: string;
  version: number;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function StatCard({ label, value, sub, accent = ACCENT }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10,
        padding: '14px 18px',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: accent, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

export default function OmniaHubPage() {
  const [narrative, setNarrative] = useState<SynthesisData | null>(null);
  const [worldSummary, setWorldSummary] = useState<WorldSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const apiBase = `${BASE_API}/api`;

  const load = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [narRes, graphRes] = await Promise.all([
        fetch(`${apiBase}/omnia/narrative`),
        fetch(`${apiBase}/omnia/graph`),
      ]);
      if (narRes.ok) setNarrative(await narRes.json());
      if (graphRes.ok) {
        const g = await graphRes.json();
        setWorldSummary(g.meta);
      }
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(() => load(), 30_000);
    return () => clearInterval(t);
  }, []);

  const FALLBACK_NARRATIVE: SynthesisData = {
    headline: 'Portfolio operating within parameters — two elevated signals require attention',
    summary: 'The SZL Holdings portfolio is stable across 12 active domains. Aegis has elevated an APT-41 cluster to HIGH, with downstream exposure flagged in Terra. MV Stellarwind reports a 14 nm deviation — insurance tier breach at 82% threshold. OMNIA synthesis cycle running continuously.',
    signals: [
      { id: 's-001', label: 'APT-41 cluster elevated to HIGH', domain: 'aegis', severity: 'high', timestamp: new Date(Date.now() - 45_000).toISOString(), deepLink: '/aegis' },
      { id: 's-002', label: 'MV Stellarwind deviation — 82% threshold', domain: 'vessels', severity: 'medium', timestamp: new Date(Date.now() - 3 * 60_000).toISOString(), deepLink: '/vessels' },
      { id: 's-003', label: 'CJL-2291 deadline in 48h', domain: 'counsel', severity: 'medium', timestamp: new Date(Date.now() - 60 * 60_000).toISOString(), deepLink: '/counsel' },
      { id: 's-004', label: 'TER-4402 covenant watch', domain: 'terra', severity: 'low', timestamp: new Date(Date.now() - 2 * 60_000).toISOString(), deepLink: '/terra' },
      { id: 's-005', label: '3 approvals pending in A11oy', domain: 'a11oy', severity: 'low', timestamp: new Date(Date.now() - 20 * 60_000).toISOString(), deepLink: '/a11oy' },
    ],
    generatedAt: new Date(Date.now() - 3 * 60_000).toISOString(),
    version: 47,
  };

  const n = narrative ?? FALLBACK_NARRATIVE;
  const ws = worldSummary ?? { totalEntities: 312, totalRelationships: 74, lastRefreshed: new Date(Date.now() - 3 * 60_000).toISOString(), activeDomains: ['aegis', 'vessels', 'terra', 'counsel', 'command', 'a11oy', 'holdings', 'pulse', 'lyte', 'sentra', 'carlota-jo', 'praxis'] };

  const criticalSignals = n.signals.filter((s) => s.severity === 'critical' || s.severity === 'high');
  const otherSignals = n.signals.filter((s) => s.severity !== 'critical' && s.severity !== 'high');

  return (
    <OmniaLayout>
      <div style={{ maxWidth: 1100 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Network size={20} style={{ color: ACCENT }} />
              <h1 style={{ fontSize: 22, fontWeight: 600, color: 'rgba(235,230,220,0.95)', margin: 0 }}>
                OMNIA Hub
              </h1>
              <span style={{ padding: '2px 8px', background: `${ACCENT}18`, border: `1px solid ${ACCENT}35`, borderRadius: 10, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: ACCENT, textTransform: 'uppercase' }}>
                Synthesis #{n.version}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
              Unified portfolio intelligence layer — world model, narrative, and ripple analysis across {ws.activeDomains.length} domains
            </p>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              background: refreshing ? 'rgba(255,255,255,0.03)' : `${ACCENT}15`,
              border: `1px solid ${ACCENT}35`,
              borderRadius: 8,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              fontSize: 12,
              color: ACCENT,
            }}
          >
            <RefreshCw size={12} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          <StatCard label="Portfolio Entities" value={ws.totalEntities} sub="across all domains" />
          <StatCard label="Relationships" value={ws.totalRelationships} sub="in world model" accent="#3b82f6" />
          <StatCard label="Active Domains" value={ws.activeDomains.length} sub="contributing feeds" accent="#22c55e" />
          <StatCard label="Synthesis Cycle" value={`#${n.version}`} sub={`Last: ${relativeTime(n.generatedAt)}`} accent="#f59e0b" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, marginBottom: 20 }}>
          <div>
            <div
              style={{
                background: `${ACCENT}08`,
                border: `1px solid ${ACCENT}20`,
                borderRadius: 12,
                padding: '18px 22px',
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT, marginBottom: 8 }}>
                Portfolio Headline
              </div>
              <p style={{ fontSize: 15, fontWeight: 500, color: 'rgba(235,230,220,0.9)', margin: '0 0 8px', lineHeight: 1.5 }}>
                {n.headline}
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.6 }}>
                {n.summary}
              </p>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <a
                  href="/command/omnia/narrative"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 12,
                    color: ACCENT,
                    textDecoration: 'none',
                    padding: '5px 12px',
                    background: `${ACCENT}12`,
                    border: `1px solid ${ACCENT}30`,
                    borderRadius: 6,
                  }}
                >
                  <BookOpen size={12} /> Full Narrative
                </a>
                <a
                  href="/command/omnia/world-model"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.5)',
                    textDecoration: 'none',
                    padding: '5px 12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6,
                  }}
                >
                  <Layers size={12} /> World Model
                </a>
              </div>
            </div>

            {criticalSignals.length > 0 && (
              <div
                style={{
                  background: 'rgba(239,68,68,0.05)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 10,
                  padding: '14px 18px',
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ef4444', marginBottom: 10 }}>
                  Elevated Signals ({criticalSignals.length})
                </div>
                {criticalSignals.map((s) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(239,68,68,0.1)' }}>
                    <AlertTriangle size={13} style={{ color: SEVERITY_COLORS[s.severity], flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, color: 'rgba(235,230,220,0.85)' }}>{s.label}</span>
                      <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: DOMAIN_COLORS[s.domain] ?? '#8b7ac8' }}>
                        {s.domain}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{relativeTime(s.timestamp)}</span>
                    {s.deepLink && (
                      <a href={s.deepLink} style={{ color: 'rgba(255,255,255,0.3)', display: 'flex' }}>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {otherSignals.length > 0 && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 10,
                  padding: '14px 18px',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
                  Active Signals
                </div>
                {otherSignals.map((s) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                    <Info size={12} style={{ color: SEVERITY_COLORS[s.severity], flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, color: 'rgba(235,230,220,0.75)' }}>{s.label}</span>
                      <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: DOMAIN_COLORS[s.domain] ?? '#8b7ac8' }}>
                        {s.domain}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{relativeTime(s.timestamp)}</span>
                    {s.deepLink && (
                      <a href={s.deepLink} style={{ color: 'rgba(255,255,255,0.25)', display: 'flex' }}>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12,
                overflow: 'hidden',
                marginBottom: 16,
              }}
            >
              <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                  Active Domains
                </div>
              </div>
              <div style={{ padding: '8px 0' }}>
                {ws.activeDomains.map((domain) => (
                  <div
                    key={domain}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 16px' }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: DOMAIN_COLORS[domain] ?? '#8b7ac8',
                        flexShrink: 0,
                        boxShadow: `0 0 6px ${DOMAIN_COLORS[domain] ?? '#8b7ac8'}60`,
                      }}
                    />
                    <span style={{ flex: 1, fontSize: 13, color: 'rgba(235,230,220,0.7)', textTransform: 'capitalize' }}>{domain}</span>
                    <CheckCircle2 size={12} style={{ color: '#22c55e' }} />
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                  OMNIA Surfaces
                </div>
              </div>
              <div>
                {[
                  { href: '/command/omnia/world-model', label: 'World Model Graph', icon: Layers, desc: 'Entity graph with ripple' },
                  { href: '/command/omnia/narrative', label: 'Synthesis Narrative', icon: BookOpen, desc: 'Live portfolio story' },
                  { href: '/command/omnia/ripple', label: 'Ripple / Impact', icon: Activity, desc: 'Downstream effect tracing' },
                  { href: '/command/omnia/story', label: 'Public Story Mode', icon: Globe, desc: 'Investor-grade view' },
                ].map((surface) => {
                  const Icon = surface.icon;
                  return (
                    <a
                      key={surface.href}
                      href={surface.href}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 16px',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        textDecoration: 'none',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${ACCENT}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={14} style={{ color: ACCENT }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: 'rgba(235,230,220,0.8)', fontWeight: 500 }}>{surface.label}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{surface.desc}</div>
                      </div>
                      <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.25)' }} />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </OmniaLayout>
  );
}
