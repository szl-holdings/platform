import { DataProvenance } from '@szl-holdings/shared-ui/data-provenance';
import type { DataProvenanceInfo } from '@szl-holdings/shared-ui/ontology';
import { m } from 'framer-motion';
import {
  AlertCircle,
  ArrowUpRight,
  BarChart2,
  CheckCircle2,
  Eye,
  Flame,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { DistributionOsLayout } from './admin-dashboard';

const API = import.meta.env.VITE_API_URL || '';

const DS = {
  page: '#070a10',
  surface: '#0b0f19',
  elevated: '#0f1420',
  border: 'rgba(255,255,255,0.05)',
  borderMuted: 'rgba(255,255,255,0.08)',
  accent: '#d4a054',
  green: '#5a9c5a',
  red: '#c45a4a',
  blue: '#4a8ab8',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    tertiary: 'rgba(255,255,255,0.28)',
    muted: 'rgba(255,255,255,0.14)',
  },
};

const PROV: DataProvenanceInfo = {
  source: 'Distribution OS — Distribution Analytics Engine',
  lastUpdated: new Date().toISOString(),
  freshness: 'minutes',
  confidence: 'high',
  dataState: 'demo',
};

function ScoreRing({ score, size = 56, color }: { score: number; size?: number; color: string }) {
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${color}18`} strokeWidth={4} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={4}
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2}
        y={size / 2 + 5}
        textAnchor="middle"
        fontSize={13}
        fontWeight={700}
        fill={DS.text.primary}
      >
        {score}
      </text>
    </svg>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: '0.625rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.6875rem', color: DS.text.tertiary }}>{label}</span>
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            color,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}%
        </span>
      </div>
      <div style={{ height: 3, background: `${color}14`, borderRadius: 2 }}>
        <m.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 2 }}
        />
      </div>
    </div>
  );
}

interface ViralityScore {
  id: number;
  title: string;
  contentType: string;
  status: string;
  predictedScore: number;
  engagementProbability: number;
  reachEstimate: number;
  conversionProbability: number;
  trendAlignment: number;
  audienceResonance: number;
  competitiveGap: number;
  confidence: number;
  topPerformerChance: number;
  recommendations: string[];
}

interface ViralityData {
  scores: ViralityScore[];
  summary: { avgScore: number; topPerformers: number; totalScored: number; trendingNow: string[] };
}

export default function PredictiveViralityPage() {
  const [location] = useLocation();
  const [data, setData] = useState<ViralityData | null>(null);
  const [selected, setSelected] = useState<ViralityScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');

  useEffect(() => {
    fetch(`${API}/api/distribution-os/virality/scores`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (d.scores?.length) setSelected(d.scores[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function scoreDraft() {
    if (!draftTitle.trim()) return;
    setScoring(true);
    try {
      const r = await fetch(`${API}/api/distribution-os/virality/score-content`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: draftTitle, contentType: 'article' }),
      });
      const scored = await r.json();
      setData((prev) =>
        prev
          ? {
              ...prev,
              scores: [
                {
                  ...scored,
                  id: 9999,
                  status: 'draft',
                  recommendations: scored.recommendations || [],
                },
                ...prev.scores,
              ],
            }
          : prev,
      );
      setSelected({
        ...scored,
        id: 9999,
        status: 'draft',
        recommendations: scored.recommendations || [],
      });
    } catch (_) {}
    setScoring(false);
  }

  const summary = data?.summary;

  return (
    <DistributionOsLayout currentPath={location}>
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: DS.text.primary,
                letterSpacing: '-0.025em',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Flame size={18} style={{ color: DS.accent }} /> Distribution Analytics Engine
            </h1>
            <p style={{ fontSize: '0.75rem', color: DS.text.tertiary, marginTop: '0.25rem' }}>
              Evidence-backed pre-publish scoring — know what will perform before you hit publish
            </p>
          </div>
          <DataProvenance provenance={PROV} />
        </div>

        {/* Summary cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          {[
            {
              label: 'Avg Virality Score',
              value: summary?.avgScore ?? '—',
              icon: Flame,
              color: DS.accent,
            },
            {
              label: 'Top Performer Picks',
              value: summary?.topPerformers ?? '—',
              icon: TrendingUp,
              color: DS.green,
            },
            {
              label: 'Content Scored',
              value: summary?.totalScored ?? '—',
              icon: BarChart2,
              color: DS.blue,
            },
            {
              label: 'Trending Signals',
              value: summary?.trendingNow?.length ?? '—',
              icon: Zap,
              color: '#9b7fd4',
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              style={{
                padding: '1rem 1.25rem',
                background: DS.surface,
                border: `1px solid ${DS.border}`,
                borderRadius: '10px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: `linear-gradient(90deg, ${color}60, transparent)`,
                }}
              />
              <Icon size={14} style={{ color, marginBottom: '0.5rem' }} />
              <div
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: DS.text.primary,
                  letterSpacing: '-0.025em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {value}
              </div>
              <div style={{ fontSize: '0.6875rem', color: DS.text.tertiary, marginTop: '0.25rem' }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Trending topics */}
        {summary?.trendingNow && (
          <div
            style={{
              padding: '0.75rem 1.125rem',
              background: `${DS.accent}08`,
              border: `1px solid ${DS.accent}20`,
              borderRadius: '8px',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: DS.accent,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                flexShrink: 0,
              }}
            >
              Trending Now
            </span>
            {summary.trendingNow.map((t) => (
              <span
                key={t}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.625rem',
                  borderRadius: '4px',
                  background: `${DS.accent}14`,
                  color: DS.accent,
                  border: `1px solid ${DS.accent}20`,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Score draft */}
        <div
          style={{
            padding: '1rem 1.25rem',
            background: DS.surface,
            border: `1px solid ${DS.border}`,
            borderRadius: '10px',
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: DS.text.secondary,
              marginBottom: '0.625rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            <Sparkles size={13} style={{ color: DS.accent }} /> Score a draft before publishing
          </div>
          <div style={{ display: 'flex', gap: '0.625rem' }}>
            <input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && scoreDraft()}
              placeholder="Enter your headline or title..."
              style={{
                flex: 1,
                background: DS.elevated,
                border: `1px solid ${DS.borderMuted}`,
                borderRadius: '6px',
                padding: '0.5rem 0.75rem',
                color: DS.text.primary,
                fontSize: '0.8125rem',
                outline: 'none',
              }}
            />
            <button
              onClick={scoreDraft}
              disabled={scoring || !draftTitle.trim()}
              style={{
                padding: '0.5rem 1rem',
                background: DS.accent,
                color: '#000',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 600,
                opacity: scoring ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              {scoring ? (
                <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Flame size={13} />
              )}
              {scoring ? 'Scoring…' : 'Score It'}
            </button>
          </div>
        </div>

        {/* Content list + detail */}
        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem',
              color: DS.text.muted,
              fontSize: '0.8125rem',
            }}
          >
            Loading scores…
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem' }}>
            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data?.scores.map((s) => {
                const isSelected = selected?.id === s.id;
                const scoreColor =
                  s.predictedScore >= 80 ? DS.green : s.predictedScore >= 60 ? DS.accent : DS.red;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelected(s)}
                    style={{
                      padding: '0.875rem 1rem',
                      background: isSelected ? `${DS.accent}08` : DS.surface,
                      border: `1px solid ${isSelected ? DS.accent + '30' : DS.border}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <ScoreRing score={s.predictedScore} size={48} color={scoreColor} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            color: DS.text.primary,
                            marginBottom: '0.25rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {s.title}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: DS.text.tertiary }}>
                          {s.status} · {s.contentType} · {s.topPerformerChance}% top-performer
                          chance
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: '0.25rem',
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.625rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '4px',
                            background: `${scoreColor}14`,
                            color: scoreColor,
                            border: `1px solid ${scoreColor}20`,
                            fontWeight: 600,
                          }}
                        >
                          {s.predictedScore >= 80
                            ? 'HIGH'
                            : s.predictedScore >= 60
                              ? 'MEDIUM'
                              : 'LOW'}
                        </span>
                        <span style={{ fontSize: '0.625rem', color: DS.text.muted }}>
                          {(s.reachEstimate / 1000).toFixed(1)}k reach
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detail */}
            {selected && (
              <div
                style={{
                  padding: '1.25rem',
                  background: DS.surface,
                  border: `1px solid ${DS.border}`,
                  borderRadius: '10px',
                  position: 'sticky',
                  top: '1rem',
                  maxHeight: 'calc(100vh - 8rem)',
                  overflowY: 'auto',
                }}
              >
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: DS.text.primary,
                    marginBottom: '0.25rem',
                    lineHeight: 1.3,
                  }}
                >
                  {selected.title}
                </div>
                <div style={{ fontSize: '0.6875rem', color: DS.text.muted, marginBottom: '1rem' }}>
                  {selected.contentType} · confidence {selected.confidence}%
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <ScoreBar
                    label="Engagement Probability"
                    value={selected.engagementProbability}
                    color={DS.accent}
                  />
                  <ScoreBar
                    label="Trend Alignment"
                    value={selected.trendAlignment}
                    color={DS.blue}
                  />
                  <ScoreBar
                    label="Audience Resonance"
                    value={selected.audienceResonance}
                    color="#9b7fd4"
                  />
                  <ScoreBar
                    label="Conversion Probability"
                    value={selected.conversionProbability}
                    color={DS.green}
                  />
                  <ScoreBar
                    label="Competitive Gap"
                    value={selected.competitiveGap}
                    color="#c8953c"
                  />
                </div>

                <div
                  style={{
                    padding: '0.75rem',
                    background: DS.elevated,
                    borderRadius: '8px',
                    marginBottom: '1rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: DS.text.tertiary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Estimated Reach
                  </div>
                  <div
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      color: DS.text.primary,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {selected.reachEstimate.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.625rem', color: DS.text.muted }}>
                    across all distribution channels
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: DS.text.tertiary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '0.625rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                    }}
                  >
                    <Sparkles size={11} /> AI Recommendations
                  </div>
                  {selected.recommendations.map((rec, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <AlertCircle
                        size={13}
                        style={{ color: DS.accent, marginTop: '1px', flexShrink: 0 }}
                      />
                      <span
                        style={{ fontSize: '0.75rem', color: DS.text.secondary, lineHeight: 1.5 }}
                      >
                        {rec}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </m.div>
    </DistributionOsLayout>
  );
}
