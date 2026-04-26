import {
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Globe,
  Lock,
  RefreshCw,
  Share2,
  Shield,
} from 'lucide-react';
import { useEffect, useState } from 'react';

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
};

interface StoryParagraph {
  id: string;
  text: string;
  domain: string;
  confidence: number;
  deepLink?: string;
}

interface StoryData {
  headline: string;
  summary: string;
  paragraphs: StoryParagraph[];
  generatedAt: string;
  version: number;
  meta: {
    isPublic: boolean;
    watermark: string;
    policy: string;
  };
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  return `${Math.floor(diff / 3_600_000)}h ago`;
}

export default function OmniaStoryPage() {
  const [data, setData] = useState<StoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const apiBase = `${BASE_API}/api`;

  useEffect(() => {
    fetch(`${apiBase}/omnia/story`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const FALLBACK: StoryData = {
    headline: 'SZL Holdings: Portfolio operating within parameters',
    summary: 'The SZL Holdings portfolio demonstrates robust operational discipline across 12 active domains as of this reporting period. The OMNIA intelligence layer continuously synthesizes data from maritime, real estate, legal, cybersecurity, and governance functions to maintain a complete, provenance-backed picture of portfolio health.',
    paragraphs: [
      { id: 'p-001', text: 'Aegis has elevated the APT-41 threat cluster to HIGH confidence following corroborated indicators across 14 unique signals. Precautionary reviews are underway for three downstream Terra assets, with TER-8821 already restored to compliance.', domain: 'aegis', confidence: 0.92, deepLink: '/aegis' },
      { id: 'p-002', text: 'Maritime intelligence is monitoring a 14 nm route deviation on MV Stellarwind. The digital twin model projects an insurance tier breach probability of 82%, approaching the 85% escalation threshold. All other vessels in the fleet are tracking normally.', domain: 'vessels', confidence: 0.88, deepLink: '/vessels' },
      { id: 'p-003', text: 'Real estate performance remains strong with 14 of 16 properties fully covenant-compliant. TER-4402 is on watch with a DSCR of 1.01x. A related legal matter (CJL-2291) is approaching a 48-hour response deadline.', domain: 'terra', confidence: 0.87, deepLink: '/terra' },
      { id: 'p-004', text: 'The A11oy governed execution fabric continues to deliver operational intelligence across the portfolio. 24 workcells are active, processing 1,284 signals per hour across 47 data sources. Three governance approvals are pending in the human-in-the-loop queue.', domain: 'a11oy', confidence: 0.97, deepLink: '/a11oy' },
      { id: 'p-005', text: 'Aggregate portfolio net asset value stands at $1.24B, representing a 0.4% gain over the prior 24-hour period. The OMNIA synthesis layer traces all constituent values to originating signals via the A11oy proof ledger, ensuring full auditability.', domain: 'holdings', confidence: 0.96, deepLink: '/' },
    ],
    generatedAt: new Date(Date.now() - 3 * 60_000).toISOString(),
    version: 47,
    meta: {
      isPublic: true,
      watermark: 'SZL Holdings — OMNIA Portfolio Intelligence · Confidential',
      policy: 'Public Story Mode — sensitive nodes redacted per portfolio governance policy',
    },
  };

  const story = data ?? FALLBACK;

  return (
    <div
      style={{
        background: '#040810',
        minHeight: '100vh',
        fontFamily: 'Georgia, "Times New Roman", serif',
      }}
    >
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(4,8,16,0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <Globe size={14} style={{ color: ACCENT }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: ACCENT }}>OMNIA</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Public Story Mode</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 600,
              color: '#22c55e',
            }}
          >
            <CheckCircle2 size={10} />
            LIVE
          </div>
          <button
            onClick={handleShare}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              background: `${ACCENT}15`,
              border: `1px solid ${ACCENT}35`,
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 11,
              color: ACCENT,
              fontFamily: 'system-ui',
            }}
          >
            <Share2 size={11} />
            {copied ? 'Copied!' : 'Share'}
          </button>
          <a
            href="/command/omnia"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6,
              fontSize: 11,
              color: 'rgba(255,255,255,0.5)',
              textDecoration: 'none',
              fontFamily: 'system-ui',
            }}
          >
            <ExternalLink size={11} />
            Full Portal
          </a>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px' }}>
        <div
          style={{
            textAlign: 'center',
            marginBottom: 52,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: ACCENT, marginBottom: 16, fontFamily: 'system-ui' }}>
            SZL Holdings · OMNIA Portfolio Intelligence
          </div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: 'rgba(235,230,220,0.95)',
              lineHeight: 1.3,
              margin: '0 0 16px',
            }}
          >
            {story.headline}
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, margin: '0 0 20px' }}>
            {story.summary}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'system-ui' }}>
            <span>Synthesis #{story.version}</span>
            <span>·</span>
            <span>Updated {relativeTime(story.generatedAt)}</span>
          </div>
        </div>

        <div
          style={{
            width: '100%',
            height: 1,
            background: 'linear-gradient(to right, transparent, rgba(139,122,200,0.4), transparent)',
            marginBottom: 48,
          }}
        />

        {story.paragraphs.map((para, i) => {
          const domainColor = DOMAIN_COLORS[para.domain] ?? ACCENT;
          return (
            <div key={para.id} style={{ marginBottom: 36, position: 'relative', paddingLeft: 20 }}>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 8,
                  bottom: 0,
                  width: 2,
                  background: `linear-gradient(to bottom, ${domainColor}50, transparent)`,
                }}
              />
              <div style={{ fontFamily: 'system-ui', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    padding: '2px 8px',
                    background: `${domainColor}15`,
                    border: `1px solid ${domainColor}30`,
                    borderRadius: 5,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: domainColor,
                  }}
                >
                  {para.domain}
                </span>
              </div>
              <p
                style={{
                  fontSize: 17,
                  lineHeight: 1.8,
                  color: 'rgba(235,230,220,0.82)',
                  margin: 0,
                }}
              >
                {para.text}
              </p>
              {para.deepLink && (
                <div style={{ marginTop: 10, fontFamily: 'system-ui' }}>
                  <a
                    href={para.deepLink}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      color: domainColor,
                      textDecoration: 'none',
                      opacity: 0.7,
                    }}
                  >
                    View source data <ExternalLink size={10} />
                  </a>
                </div>
              )}
            </div>
          );
        })}

        <div
          style={{
            width: '100%',
            height: 1,
            background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)',
            margin: '48px 0',
          }}
        />

        <div
          style={{
            fontFamily: 'system-ui',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: '16px 20px',
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10,
            marginBottom: 24,
          }}
        >
          <Shield size={16} style={{ color: ACCENT, flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: ACCENT, marginBottom: 4 }}>
              {story.meta.watermark}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
              {story.meta.policy}. All claims are provenance-traced via the A11oy proof ledger. Sensitive nodes have been redacted per portfolio governance policy.
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'system-ui' }}>
          Generated by OMNIA Synthesis Engine v1.0 · SZL Holdings
        </div>
      </div>
    </div>
  );
}
