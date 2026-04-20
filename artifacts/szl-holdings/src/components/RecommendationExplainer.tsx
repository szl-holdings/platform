import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Database,
  Info,
  Shield,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

export interface RecommendationEvidence {
  label: string;
  value: string;
  source: string;
  freshness: string;
  weight: number;
  contribution: 'supporting' | 'neutral' | 'contradicting';
}

export interface Recommendation {
  id: string;
  title: string;
  rationale: string;
  confidence: number;
  confidenceLabel: 'Very High' | 'High' | 'Medium' | 'Low';
  priority: 'critical' | 'high' | 'medium' | 'low';
  evidence: RecommendationEvidence[];
  modelVersion?: string;
  generatedAt?: string;
}

const PRIORITY_STYLE: Record<
  Recommendation['priority'],
  { color: string; bg: string; border: string }
> = {
  critical: { color: '#f87171', bg: 'hsla(0,80%,65%,0.07)', border: 'hsla(0,80%,65%,0.18)' },
  high: { color: '#fbbf24', bg: 'hsla(38,90%,58%,0.07)', border: 'hsla(38,90%,58%,0.18)' },
  medium: { color: '#c9a84c', bg: 'hsla(42,55%,55%,0.07)', border: 'hsla(42,55%,55%,0.15)' },
  low: { color: '#94a3b8', bg: 'hsla(215,20%,60%,0.05)', border: 'hsla(215,20%,60%,0.12)' },
};

const CONTRIBUTION_STYLE: Record<
  RecommendationEvidence['contribution'],
  { icon: typeof Activity; color: string; label: string }
> = {
  supporting: { icon: TrendingUp, color: 'hsl(142,60%,50%)', label: 'Supporting' },
  neutral: { icon: Activity, color: '#94a3b8', label: 'Neutral' },
  contradicting: { icon: AlertTriangle, color: '#fbbf24', label: 'Contradicting' },
};

function ConfidencePip({ confidence, color }: { confidence: number; color: string }) {
  const pips = 5;
  const filled = Math.round((confidence / 100) * pips);
  return (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
      {Array.from({ length: pips }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: i < filled ? color : 'hsla(215,20%,60%,0.15)',
            border: i < filled ? `1px solid ${color}60` : '1px solid hsla(215,20%,60%,0.12)',
          }}
        />
      ))}
    </div>
  );
}

function EvidenceRow({ ev }: { ev: RecommendationEvidence }) {
  const style = CONTRIBUTION_STYLE[ev.contribution];
  const Icon = style.icon;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.625rem',
        padding: '0.5rem 0.75rem',
        borderRadius: 6,
        background: 'hsla(215,40%,10%,0.5)',
        border: '1px solid hsla(215,30%,25%,0.15)',
      }}
    >
      <Icon size={12} style={{ color: style.color, flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#e2e8f0' }}>{ev.label}</span>
          <span
            style={{
              fontSize: '0.6rem',
              fontFamily: 'var(--font-mono, monospace)',
              padding: '1px 5px',
              borderRadius: 3,
              background: 'hsla(215,30%,25%,0.4)',
              color: '#94a3b8',
            }}
          >
            {ev.source}
          </span>
        </div>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>{ev.value}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 4 }}>
          <div
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: 'hsla(215,30%,25%,0.4)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${ev.weight * 100}%`,
                background: style.color,
                borderRadius: 2,
              }}
            />
          </div>
          <span
            style={{
              fontSize: '0.6rem',
              fontFamily: 'var(--font-mono, monospace)',
              color: '#64748b',
            }}
          >
            {Math.round(ev.weight * 100)}% wt
          </span>
          <span style={{ fontSize: '0.6rem', color: '#64748b' }}>{ev.freshness}</span>
        </div>
      </div>
      <span
        style={{
          fontSize: '0.6rem',
          fontFamily: 'var(--font-mono, monospace)',
          color: style.color,
          flexShrink: 0,
          padding: '2px 5px',
          borderRadius: 3,
          background: `${style.color}14`,
          border: `1px solid ${style.color}28`,
        }}
      >
        {style.label}
      </span>
    </div>
  );
}

export function RecommendationExplainer({ rec }: { rec: Recommendation }) {
  const [open, setOpen] = useState(false);
  const pr = PRIORITY_STYLE[rec.priority];
  return (
    <div
      style={{
        borderRadius: 10,
        border: `1px solid ${pr.border}`,
        background: pr.bg,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          padding: '0.875rem 1rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: pr.color,
              boxShadow: `0 0 6px ${pr.color}80`,
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0' }}>
              {rec.title}
            </span>
            <span
              style={{
                fontSize: '0.6rem',
                fontFamily: 'var(--font-mono, monospace)',
                padding: '1px 6px',
                borderRadius: 3,
                background: `${pr.color}18`,
                border: `1px solid ${pr.border}`,
                color: pr.color,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {rec.priority}
            </span>
          </div>
          <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 3, lineHeight: 1.5 }}>
            {rec.rationale}
          </p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.875rem',
              marginTop: 6,
              flexWrap: 'wrap',
            }}
          >
            <ConfidencePip confidence={rec.confidence} color={pr.color} />
            <span
              style={{
                fontSize: '0.6rem',
                fontFamily: 'var(--font-mono, monospace)',
                color: '#64748b',
              }}
            >
              {rec.confidence}% confidence · {rec.confidenceLabel}
            </span>
            <span style={{ fontSize: '0.6rem', color: '#475569' }}>
              {rec.evidence.length} evidence point{rec.evidence.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div style={{ flexShrink: 0, color: '#475569' }}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {/* Evidence drawer */}
      {open && (
        <div
          style={{
            borderTop: '1px solid hsla(215,30%,25%,0.2)',
            padding: '0.875rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.375rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: 6 }}>
            <Info size={11} color="#475569" />
            <span
              style={{
                fontSize: '0.6rem',
                fontFamily: 'var(--font-mono, monospace)',
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Why this recommendation
            </span>
            {rec.modelVersion && (
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '0.6rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  color: '#334155',
                }}
              >
                {rec.modelVersion}
              </span>
            )}
          </div>
          {rec.evidence.map((ev, i) => (
            <EvidenceRow key={i} ev={ev} />
          ))}
          {rec.generatedAt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: 4 }}>
              <Clock size={10} color="#334155" />
              <span style={{ fontSize: '0.6rem', color: '#334155' }}>
                Generated {new Date(rec.generatedAt).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const SAMPLE_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'rec-001',
    title: 'Halt China-origin shipments pending AIS anomaly resolution',
    rationale:
      'Three vessels have gone AIS-dark in a known sanction-evasion corridor. Historical pattern matches 2023 OFAC enforcement action.',
    confidence: 91,
    confidenceLabel: 'Very High',
    priority: 'critical',
    modelVersion: 'Alloy v2.4.1',
    generatedAt: new Date(Date.now() - 12 * 60000).toISOString(),
    evidence: [
      {
        label: 'AIS dark events',
        value: '3 vessels dark >6h in Bohai Strait',
        source: 'Vessels/AIS',
        freshness: '4m ago',
        weight: 0.42,
        contribution: 'supporting',
      },
      {
        label: 'OFAC pattern match',
        value: '85% similarity to SDN-evade tactic 2023-11',
        source: 'Compliance/OFAC',
        freshness: '1h ago',
        weight: 0.31,
        contribution: 'supporting',
      },
      {
        label: 'Cargo manifest',
        value: 'Dual-use goods flagged',
        source: 'Terra/Trade',
        freshness: '18m ago',
        weight: 0.18,
        contribution: 'supporting',
      },
      {
        label: 'Port of loading',
        value: 'Tianjin — not currently sanctioned',
        source: 'Alloy/KB',
        freshness: '2h ago',
        weight: 0.09,
        contribution: 'contradicting',
      },
    ],
  },
  {
    id: 'rec-002',
    title: 'Accelerate Terra portfolio hedge — interest rate exposure',
    rationale:
      'Federal Reserve forward guidance signals 25bps increase. 4 Terra assets floating-rate exposure exceeds risk threshold.',
    confidence: 74,
    confidenceLabel: 'High',
    priority: 'high',
    modelVersion: 'Alloy v2.4.1',
    generatedAt: new Date(Date.now() - 35 * 60000).toISOString(),
    evidence: [
      {
        label: 'Fed forward guidance',
        value: '+25bps priced at 78%',
        source: 'Lyte/Macro',
        freshness: '2h ago',
        weight: 0.35,
        contribution: 'supporting',
      },
      {
        label: 'Floating-rate LTV',
        value: '4 assets >65% LTV',
        source: 'Terra/Portfolio',
        freshness: '1d ago',
        weight: 0.38,
        contribution: 'supporting',
      },
      {
        label: 'Hedge instrument cost',
        value: '+0.4% vs fixed rate',
        source: 'Finance/FX',
        freshness: '30m ago',
        weight: 0.27,
        contribution: 'neutral',
      },
    ],
  },
];
