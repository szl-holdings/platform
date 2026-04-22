import { DataProvenance } from '@szl-holdings/shared-ui/data-provenance';
import type { DataProvenanceInfo } from '@szl-holdings/shared-ui/ontology';
import { m } from 'framer-motion';
import {
  BarChart2,
  CheckCircle2,
  Clock,
  FlaskConical,
  Pause,
  Play,
  Plus,
  Trophy,
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
  source: 'Distribution OS — Dynamic A/B Testing Engine',
  lastUpdated: new Date().toISOString(),
  freshness: 'minutes',
  confidence: 'verified',
  dataState: 'demo',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Play }> = {
  running: { label: 'Running', color: DS.green, icon: Play },
  paused: { label: 'Paused', color: DS.accent, icon: Pause },
  'winner-declared': { label: 'Winner Declared', color: '#9b7fd4', icon: Trophy },
  draft: { label: 'Draft', color: DS.text.tertiary as string, icon: Clock },
};

const TEST_TYPE_LABELS: Record<string, string> = {
  headline: 'Headline',
  image: 'Image',
  cta: 'CTA',
  format: 'Format',
  'send-time': 'Send Time',
};

interface AbTest {
  id: number;
  name: string;
  testType: string;
  status: string;
  winnerVariant: string | null;
  currentSignificance: number;
  totalImpressions: number;
  variants: Record<string, unknown>[];
  uplift: string | null;
  startedAt: string | null;
  concludedAt: string | null;
}

function SignificanceBar({ value, target = 95 }: { value: number; target?: number }) {
  const color = value >= target ? DS.green : value >= 80 ? DS.accent : DS.blue;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.6875rem', color: DS.text.tertiary }}>
          Statistical Significance
        </span>
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            color,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}% / {target}%
        </span>
      </div>
      <div style={{ height: 4, background: `${color}14`, borderRadius: 2, position: 'relative' }}>
        <m.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, value)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 2 }}
        />
        <div
          style={{
            position: 'absolute',
            top: -2,
            left: `${target}%`,
            width: 2,
            height: 8,
            background: DS.text.muted,
            borderRadius: 1,
          }}
        />
      </div>
    </div>
  );
}

export default function AbTestingPage() {
  const [location] = useLocation();
  const [data, setData] = useState<{ tests: AbTest[]; running: number; concluded: number } | null>(
    null,
  );
  const [selected, setSelected] = useState<AbTest | null>(null);

  useEffect(() => {
    fetch(`${API}/api/distribution-os/ab-tests`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (d.tests?.length) setSelected(d.tests[0]);
      })
      .catch(() => {});
  }, []);

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
              <FlaskConical size={18} style={{ color: DS.accent }} /> Dynamic A/B Testing Engine
            </h1>
            <p style={{ fontSize: '0.75rem', color: DS.text.tertiary, marginTop: '0.25rem' }}>
              Multi-armed bandit optimization with automatic winner detection
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
            <DataProvenance provenance={PROV} />
            <button
              style={{
                padding: '0.5rem 0.875rem',
                background: DS.accent,
                color: '#000',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              <Plus size={13} /> New Test
            </button>
          </div>
        </div>

        {/* Summary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.75rem',
            marginBottom: '1.25rem',
          }}
        >
          {[
            { label: 'Active Tests', value: data?.running ?? '—', color: DS.green, icon: Play },
            {
              label: 'Winners Declared',
              value: data?.concluded ?? '—',
              color: '#9b7fd4',
              icon: Trophy,
            },
            {
              label: 'Total Impressions',
              value:
                data?.tests?.reduce((s, t) => s + t.totalImpressions, 0)?.toLocaleString() ?? '—',
              color: DS.blue,
              icon: BarChart2,
            },
            {
              label: 'Draft Tests',
              value: data?.tests?.filter((t) => t.status === 'draft').length ?? '—',
              color: DS.accent,
              icon: Clock,
            },
          ].map(({ label, value, color, icon: Icon }) => (
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1rem' }}>
          {/* Test list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {data?.tests.map((test) => {
              const cfg = STATUS_CONFIG[test.status] || STATUS_CONFIG.draft;
              const isSelected = selected?.id === test.id;
              return (
                <button
                  key={test.id}
                  onClick={() => setSelected(test)}
                  style={{
                    padding: '1rem 1.125rem',
                    background: isSelected ? `${DS.accent}07` : DS.surface,
                    border: `1px solid ${isSelected ? `${DS.accent}25` : DS.border}`,
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
                      marginBottom: '0.625rem',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 600,
                          color: DS.text.primary,
                          marginBottom: '0.125rem',
                        }}
                      >
                        {test.name}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: DS.text.muted }}>
                        {TEST_TYPE_LABELS[test.testType]} test ·{' '}
                        {test.totalImpressions.toLocaleString()} impressions
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        flexShrink: 0,
                      }}
                    >
                      <cfg.icon size={11} style={{ color: cfg.color }} />
                      <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                  {test.status !== 'draft' && (
                    <div style={{ marginTop: '0.375rem' }}>
                      <SignificanceBar value={test.currentSignificance} />
                    </div>
                  )}
                  {test.uplift && (
                    <div
                      style={{
                        marginTop: '0.5rem',
                        fontSize: '0.6875rem',
                        color: DS.green,
                        fontWeight: 600,
                      }}
                    >
                      Uplift: {test.uplift}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Detail */}
          {selected &&
            (() => {
              const _cfg = STATUS_CONFIG[selected.status] || STATUS_CONFIG.draft;
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
                    }}
                  >
                    {selected.name}
                  </div>
                  <div
                    style={{ fontSize: '0.6875rem', color: DS.text.muted, marginBottom: '1rem' }}
                  >
                    {TEST_TYPE_LABELS[selected.testType]} ·{' '}
                    {selected.totalImpressions.toLocaleString()} impressions
                  </div>

                  {selected.status === 'winner-declared' && selected.winnerVariant && (
                    <div
                      style={{
                        padding: '0.75rem',
                        background: `${DS.green}10`,
                        border: `1px solid ${DS.green}20`,
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <Trophy size={14} style={{ color: DS.green }} />
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: DS.green }}>
                          Winner: Variant {selected.winnerVariant}
                        </div>
                        {selected.uplift && (
                          <div style={{ fontSize: '0.6875rem', color: DS.green }}>
                            {selected.uplift} performance uplift
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: '1rem' }}>
                    <SignificanceBar value={selected.currentSignificance} />
                  </div>

                  <div
                    style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      color: DS.text.tertiary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      marginBottom: '0.625rem',
                    }}
                  >
                    Variants
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selected.variants.map((v: Record<string, unknown>, _i) => {
                      const vid = v.id as string;
                      const isWinner = selected.winnerVariant === vid;
                      return (
                        <div
                          key={vid}
                          style={{
                            padding: '0.75rem',
                            background: isWinner ? `${DS.green}08` : DS.elevated,
                            border: `1px solid ${isWinner ? `${DS.green}20` : DS.border}`,
                            borderRadius: '7px',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '0.375rem',
                            }}
                          >
                            <span
                              style={{ fontSize: '0.6875rem', fontWeight: 600, color: DS.accent }}
                            >
                              Variant {vid}
                            </span>
                            {isWinner && <CheckCircle2 size={12} style={{ color: DS.green }} />}
                          </div>
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: DS.text.secondary,
                              marginBottom: '0.375rem',
                            }}
                          >
                            {v.label as string}
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {Object.entries(v)
                              .filter(([k]) => !['id', 'label'].includes(k))
                              .map(([k, val]) => (
                                <div key={k}>
                                  <span
                                    style={{
                                      fontSize: '0.625rem',
                                      color: DS.text.muted,
                                      textTransform: 'capitalize',
                                    }}
                                  >
                                    {k.replace(/([A-Z])/g, ' $1')}:{' '}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: '0.6875rem',
                                      fontWeight: 600,
                                      color: DS.text.primary,
                                    }}
                                  >
                                    {val === null ? '—' : String(val)}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div
                    style={{
                      marginTop: '1rem',
                      padding: '0.75rem',
                      background: DS.elevated,
                      borderRadius: '7px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.6875rem',
                        color: DS.text.muted,
                        marginBottom: '0.25rem',
                      }}
                    >
                      Multi-armed bandit status
                    </div>
                    <div style={{ fontSize: '0.75rem', color: DS.text.secondary }}>
                      {selected.status === 'running'
                        ? `Routing ${100 - Math.round(selected.currentSignificance / 3)}% traffic to current winner variant. Checking significance daily.`
                        : selected.status === 'winner-declared'
                          ? `Traffic fully routed to winning variant. Test concluded ${selected.concludedAt ? new Date(selected.concludedAt).toLocaleDateString() : '—'}.`
                          : 'Test not yet started — configure variants and launch.'}
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
