import {
  BookOpen,
  ChevronRight,
  ExternalLink,
  GitBranch,
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
  vessels: '#0ea5e9',
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
  low: '#64748b',
};

interface NarrativeParagraph {
  id: string;
  text: string;
  domain: string;
  entityRefs: string[];
  confidence: number;
  deepLink?: string;
}

interface NarrativeSignal {
  id: string;
  label: string;
  domain: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  deepLink?: string;
}

interface SynthesisData {
  headline: string;
  summary: string;
  paragraphs: NarrativeParagraph[];
  signals: NarrativeSignal[];
  generatedAt: string;
  version: number;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

export default function OmniaNarrativePage() {
  const [data, setData] = useState<SynthesisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const apiBase = `${BASE_API}/api`;

  const load = async (showR = false) => {
    if (showR) setRefreshing(true);
    try {
      const res = await fetch(`${apiBase}/omnia/narrative`);
      if (res.ok) setData(await res.json());
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  const FALLBACK: SynthesisData = {
    headline: 'Portfolio operating within parameters — two elevated signals require attention',
    summary: 'The SZL Holdings portfolio is stable across 12 active domains.',
    paragraphs: [
      { id: 'p-001', text: 'Aegis has elevated the APT-41 threat cluster to HIGH confidence (0.92) following corroborated IOC matches across 14 indicators. Three downstream assets in the Terra portfolio have been flagged for precautionary access review, with Property TER-8821 already restored to compliance following a prior governance action.', domain: 'aegis', entityRefs: ['e-apt41'], confidence: 0.92, deepLink: '/aegis' },
      { id: 'p-002', text: 'MV Stellarwind is tracking 14 nm off its planned route. The Vessels digital twin places the insurance tier breach probability at 82%, approaching the 85% notification threshold. No adverse weather or piracy risk detected in the current deviation zone.', domain: 'vessels', entityRefs: ['e-stellarwind'], confidence: 0.88, deepLink: '/vessels' },
      { id: 'p-003', text: 'Terra property TER-4402 remains on covenant watch with a DSCR of 1.01x — marginally above the 1.0x floor. Legal matter CJL-2291 (Counsel) encumbers this asset. The 48-hour response deadline requires immediate attention from assigned counsel M. Okafor.', domain: 'terra', entityRefs: ['e-ter4402', 'e-cjl2291'], confidence: 0.87, deepLink: '/terra' },
      { id: 'p-004', text: 'The A11oy execution fabric is operational with 24 active workcells and 3 pending human-in-the-loop approvals. The signal mesh ingested 1,284 signals in the last hour across 47 sources. Two drift alerts are active in the design token layer.', domain: 'a11oy', entityRefs: ['e-a11oy-fabric'], confidence: 0.97, deepLink: '/a11oy' },
      { id: 'p-005', text: 'Aggregate portfolio NAV stands at $1.24B (+0.4% over 24h), composed of $841M real estate positions, $243M maritime assets, $112M liquid holdings, and $44M advisory fee income streams. OMNIA provenance traces all constituent values to originating signals via the A11oy proof ledger.', domain: 'holdings', entityRefs: ['e-portfolio-nav'], confidence: 0.96, deepLink: '/' },
    ],
    signals: [
      { id: 's-001', label: 'APT-41 cluster elevated to HIGH', domain: 'aegis', severity: 'high', timestamp: new Date(Date.now() - 45_000).toISOString(), deepLink: '/aegis' },
      { id: 's-002', label: 'MV Stellarwind deviation — 82%', domain: 'vessels', severity: 'medium', timestamp: new Date(Date.now() - 3 * 60_000).toISOString(), deepLink: '/vessels' },
    ],
    generatedAt: new Date(Date.now() - 3 * 60_000).toISOString(),
    version: 47,
  };

  const n = data ?? FALLBACK;

  return (
    <OmniaLayout
      title="Synthesis Narrative"
      subtitle={`Live portfolio story · Cycle #${n.version} · ${relativeTime(n.generatedAt)}`}
    >
      <div style={{ maxWidth: 820 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ padding: '4px 12px', background: `${ACCENT}15`, border: `1px solid ${ACCENT}35`, borderRadius: 20, fontSize: 11, fontWeight: 600, color: ACCENT, letterSpacing: '0.06em' }}>
              LIVE · Cycle #{n.version}
            </div>
            <div style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              Updated {relativeTime(n.generatedAt)}
            </div>
          </div>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: `${ACCENT}12`, border: `1px solid ${ACCENT}30`, borderRadius: 7, cursor: 'pointer', fontSize: 11, color: ACCENT }}
          >
            <RefreshCw size={11} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        <div
          style={{
            background: `${ACCENT}08`,
            border: `1px solid ${ACCENT}20`,
            borderRadius: 14,
            padding: '20px 24px',
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: ACCENT, marginBottom: 8 }}>
            Portfolio Headline
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'rgba(235,230,220,0.95)', margin: '0 0 10px', lineHeight: 1.4 }}>
            {n.headline}
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6 }}>
            {n.summary}
          </p>
        </div>

        {n.paragraphs.map((para, i) => {
          const domainColor = DOMAIN_COLORS[para.domain] ?? ACCENT;
          return (
            <div
              key={para.id}
              style={{
                marginBottom: 20,
                paddingLeft: 20,
                borderLeft: `2px solid ${domainColor}40`,
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: -5,
                  top: 6,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: domainColor,
                  border: '2px solid #060b12',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span
                  style={{
                    padding: '2px 8px',
                    background: `${domainColor}15`,
                    border: `1px solid ${domainColor}30`,
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: domainColor,
                  }}
                >
                  {para.domain}
                </span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                  Confidence: {(para.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(235,230,220,0.8)', margin: '0 0 10px', lineHeight: 1.7 }}>
                {para.text}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {para.deepLink && (
                  <a
                    href={para.deepLink}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      color: domainColor,
                      textDecoration: 'none',
                      padding: '3px 10px',
                      background: `${domainColor}10`,
                      border: `1px solid ${domainColor}25`,
                      borderRadius: 5,
                    }}
                  >
                    <ExternalLink size={10} />
                    View in {para.domain}
                  </a>
                )}
                <button
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.4)',
                    background: 'none',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 5,
                    padding: '3px 10px',
                    cursor: 'pointer',
                  }}
                  title="Show provenance chain for this paragraph"
                >
                  <GitBranch size={10} />
                  Provenance
                </button>
              </div>
            </div>
          );
        })}

        {n.signals.length > 0 && (
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12,
              overflow: 'hidden',
              marginTop: 24,
            }}
          >
            <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                Active Signals ({n.signals.length})
              </div>
            </div>
            {n.signals.map((s) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: SEVERITY_COLORS[s.severity], flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, color: 'rgba(235,230,220,0.8)' }}>{s.label}</span>
                <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: DOMAIN_COLORS[s.domain] ?? ACCENT }}>{s.domain}</span>
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
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </OmniaLayout>
  );
}
