import { DataProvenance } from '@szl-holdings/shared-ui/data-provenance';
import type { DataProvenanceInfo } from '@szl-holdings/shared-ui/ontology';
import { m } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Flame,
  Radio,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { DistributionOsLayout } from './admin-dashboard';

const API = import.meta.env.VITE_API_URL || '';

const DS = {
  surface: '#0b0f19',
  elevated: '#0f1420',
  border: 'rgba(255,255,255,0.05)',
  borderMuted: 'rgba(255,255,255,0.08)',
  accent: '#d4a054',
  green: '#5a9c5a',
  blue: '#4a8ab8',
  red: '#c45a4a',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    tertiary: 'rgba(255,255,255,0.28)',
    muted: 'rgba(255,255,255,0.14)',
  },
};

const PROV: DataProvenanceInfo = {
  source: 'Distribution OS — Social Listening & Trend Radar',
  lastUpdated: new Date().toISOString(),
  freshness: 'minutes',
  confidence: 'medium',
  dataState: 'demo',
};

const PLATFORM_COLORS: Record<string, string> = {
  x: DS.blue,
  linkedin: '#0077b5',
  reddit: '#ff4500',
  news: '#9b7fd4',
  'google-trends': DS.green,
  industry: DS.accent,
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  emerging: { label: 'Emerging', color: DS.green },
  rising: { label: 'Rising', color: DS.accent },
  peak: { label: 'At Peak', color: DS.red },
  declining: { label: 'Declining', color: DS.text.tertiary as string },
};

interface TrendSignal {
  id: number;
  topic: string;
  platform: string;
  velocityScore: number;
  sentimentScore: number;
  hoursToMainstream: number | null;
  status: string;
  opportunity: string;
  relatedKeywords: string[];
}

interface TrendData {
  signals: TrendSignal[];
  firstMoverOpportunities: number;
  avgHoursToAct: number;
}

function VelocityBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: 3, background: `${color}14`, borderRadius: 2 }}>
        <m.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 2 }}
        />
      </div>
      <span
        style={{
          fontSize: '0.6875rem',
          fontWeight: 600,
          color,
          fontVariantNumeric: 'tabular-nums',
          minWidth: 24,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function TrendRadarPage() {
  const [location] = useLocation();
  const [data, setData] = useState<TrendData | null>(null);
  const [selected, setSelected] = useState<TrendSignal | null>(null);
  const [filter, setFilter] = useState<'all' | 'emerging' | 'rising' | 'peak'>('all');

  useEffect(() => {
    fetch(`${API}/api/distribution-os/trends/radar`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (d.signals?.length) setSelected(d.signals[0]);
      })
      .catch(() => {});
  }, []);

  const filtered = data?.signals.filter((s) => filter === 'all' || s.status === filter) ?? [];

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
              <Radio size={18} style={{ color: DS.accent }} /> Social Listening & Trend Radar
            </h1>
            <p style={{ fontSize: '0.75rem', color: DS.text.tertiary, marginTop: '0.25rem' }}>
              Real-time trend monitoring with first-mover content opportunity identification
            </p>
          </div>
          <DataProvenance provenance={PROV} />
        </div>

        {/* Stats */}
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
              label: 'Live Signals',
              value: data?.signals.length ?? '—',
              color: DS.accent,
              icon: Radio,
              pulse: true,
            },
            {
              label: 'First-Mover Opportunities',
              value: data?.firstMoverOpportunities ?? '—',
              color: DS.green,
              icon: Zap,
            },
            {
              label: 'Avg Hours to Act',
              value: data ? `${data.avgHoursToAct}h` : '—',
              color: DS.blue,
              icon: Clock,
            },
            {
              label: 'Signals at Peak',
              value: data?.signals.filter((s) => s.status === 'peak').length ?? '—',
              color: DS.red,
              icon: Flame,
            },
          ].map(({ label, value, color, icon: Icon, pulse }) => (
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  marginBottom: '0.5rem',
                }}
              >
                <Icon size={14} style={{ color }} />
                {pulse && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: color,
                      animation: 'pulse 2s infinite',
                      display: 'inline-block',
                    }}
                  />
                )}
              </div>
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

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {(['all', 'emerging', 'rising', 'peak'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.3rem 0.75rem',
                borderRadius: '6px',
                border: `1px solid ${filter === f ? DS.accent + '40' : DS.border}`,
                background: filter === f ? `${DS.accent}10` : 'transparent',
                color: filter === f ? DS.accent : DS.text.tertiary,
                fontSize: '0.75rem',
                fontWeight: filter === f ? 600 : 400,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem' }}>
          {/* Signal list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filtered.map((sig) => {
              const cfg = STATUS_CONFIG[sig.status] || {
                label: sig.status,
                color: DS.text.tertiary,
              };
              const platColor = PLATFORM_COLORS[sig.platform] || DS.text.tertiary;
              const isSelected = selected?.id === sig.id;
              return (
                <button
                  key={sig.id}
                  onClick={() => setSelected(sig)}
                  style={{
                    padding: '1rem 1.125rem',
                    background: isSelected ? `${DS.accent}07` : DS.surface,
                    border: `1px solid ${isSelected ? DS.accent + '25' : DS.border}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.625rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          background: `${platColor}14`,
                          color: platColor,
                          border: `1px solid ${platColor}20`,
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      >
                        {sig.platform}
                      </span>
                      <span
                        style={{
                          fontSize: '0.625rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          background: `${cfg.color}14`,
                          color: cfg.color,
                          fontWeight: 500,
                        }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    {sig.hoursToMainstream !== null && (
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          color: sig.hoursToMainstream < 24 ? DS.red : DS.accent,
                          fontWeight: 600,
                        }}
                      >
                        {sig.hoursToMainstream}h to mainstream
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: DS.text.primary,
                      marginBottom: '0.375rem',
                    }}
                  >
                    {sig.topic}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '0.6875rem',
                        color: DS.text.muted,
                        marginBottom: '0.25rem',
                      }}
                    >
                      Velocity
                    </div>
                    <VelocityBar value={sig.velocityScore} color={cfg.color} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail */}
          {selected &&
            (() => {
              const cfg = STATUS_CONFIG[selected.status] || {
                label: selected.status,
                color: DS.text.tertiary,
              };
              return (
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
                    {selected.topic}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.375rem',
                      marginBottom: '1rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.625rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        background: `${cfg.color}14`,
                        color: cfg.color,
                        fontWeight: 500,
                      }}
                    >
                      {cfg.label}
                    </span>
                    <span
                      style={{
                        fontSize: '0.625rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        background: `${PLATFORM_COLORS[selected.platform]}14`,
                        color: PLATFORM_COLORS[selected.platform],
                        fontWeight: 500,
                        textTransform: 'capitalize',
                      }}
                    >
                      {selected.platform}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '0.625rem',
                      marginBottom: '1.125rem',
                    }}
                  >
                    <div
                      style={{ padding: '0.75rem', background: DS.elevated, borderRadius: '7px' }}
                    >
                      <div style={{ fontSize: '0.625rem', color: DS.text.muted }}>
                        Velocity Score
                      </div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: DS.text.primary }}>
                        {selected.velocityScore}
                      </div>
                    </div>
                    <div
                      style={{ padding: '0.75rem', background: DS.elevated, borderRadius: '7px' }}
                    >
                      <div style={{ fontSize: '0.625rem', color: DS.text.muted }}>Sentiment</div>
                      <div
                        style={{
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color:
                            selected.sentimentScore > 60
                              ? DS.green
                              : selected.sentimentScore < 40
                                ? DS.red
                                : DS.text.primary,
                        }}
                      >
                        {selected.sentimentScore}%
                      </div>
                    </div>
                    {selected.hoursToMainstream !== null && (
                      <div
                        style={{
                          padding: '0.75rem',
                          background: DS.elevated,
                          borderRadius: '7px',
                          gridColumn: 'span 2',
                        }}
                      >
                        <div style={{ fontSize: '0.625rem', color: DS.text.muted }}>
                          Hours to Mainstream
                        </div>
                        <div
                          style={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            color: selected.hoursToMainstream < 24 ? DS.red : DS.accent,
                          }}
                        >
                          {selected.hoursToMainstream}h
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      padding: '0.875rem',
                      background: `${DS.green}08`,
                      border: `1px solid ${DS.green}18`,
                      borderRadius: '8px',
                      marginBottom: '1rem',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        color: DS.green,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: '0.375rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                      }}
                    >
                      <Zap size={11} /> Content Opportunity
                    </div>
                    <p
                      style={{
                        fontSize: '0.75rem',
                        color: DS.text.secondary,
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {selected.opportunity}
                    </p>
                  </div>

                  <div>
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
                      Related Keywords
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                      {selected.relatedKeywords.map((k) => (
                        <span
                          key={k}
                          style={{
                            fontSize: '0.6875rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            background: `${DS.accent}10`,
                            color: DS.accent,
                            border: `1px solid ${DS.accent}18`,
                          }}
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
        </div>
      </m.div>
    </DistributionOsLayout>
  );
}
