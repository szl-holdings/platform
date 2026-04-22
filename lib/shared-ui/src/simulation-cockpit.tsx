import React, { useMemo, useState } from 'react';

export interface ScenarioRange {
  best: number;
  base: number;
  worst: number;
  confidence?: number;
  unit?: string;
  format?: 'currency' | 'percent' | 'number' | 'days';
}

export interface SensitivityDriver {
  id: string;
  label: string;
  impact: number;
  direction: 'positive' | 'negative' | 'mixed';
  swing?: number;
  correlation?: number;
}

export interface SimulationScenario {
  id: string;
  label: string;
  description?: string;
  probability?: number;
  primaryMetric: ScenarioRange;
  metrics?: Record<string, ScenarioRange & { label: string }>;
  sensitivityDrivers?: SensitivityDriver[];
  costOfWaiting?: {
    perDay?: number;
    perWeek?: number;
    description?: string;
    unit?: string;
  };
  recommendation?: string;
  recommendationStrength?: 'strong' | 'moderate' | 'weak';
  tag?: 'preferred' | 'low-risk' | 'high-upside' | 'baseline';
}

export interface PredictedVsActual {
  label: string;
  predicted: number;
  actual: number;
  unit?: string;
  format?: 'currency' | 'percent' | 'number' | 'days';
  at?: string;
  delta?: number;
}

export interface SimulationCockpitProps {
  title?: string;
  description?: string;
  scenarios: SimulationScenario[];
  activeScenarioId?: string;
  onScenarioChange?: (id: string) => void;
  primaryMetricLabel?: string;
  predictedVsActual?: PredictedVsActual[];
  iterationsRun?: number;
  confidenceLevel?: number;
  lastRunAt?: string;
  accentColor?: string;
  className?: string;
  onRunSimulation?: () => void | Promise<void>;
  loading?: boolean;
}

const TAG_CONFIG: Record<string, { label: string; color: string }> = {
  preferred: { label: 'Preferred', color: '#6b8f71' },
  'low-risk': { label: 'Low Risk', color: '#4a90b8' },
  'high-upside': { label: 'High Upside', color: '#c8953c' },
  baseline: { label: 'Baseline', color: '#8b7ac8' },
};

const FORMAT_FNS: Record<string, (v: number, unit?: string) => string> = {
  currency: (v, unit) => {
    const prefix = unit ?? '$';
    const abs = Math.abs(v);
    if (abs >= 1_000_000) return `${v < 0 ? '-' : ''}${prefix}${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${v < 0 ? '-' : ''}${prefix}${(abs / 1_000).toFixed(0)}K`;
    return `${prefix}${v.toFixed(0)}`;
  },
  percent: (v) => `${(v * 100).toFixed(1)}%`,
  number: (v, unit) =>
    `${v.toLocaleString(undefined, { maximumFractionDigits: 1 })}${unit ? ` ${unit}` : ''}`,
  days: (v) => `${Math.round(v)} days`,
};

function fmt(range: ScenarioRange, value: number): string {
  const fn = FORMAT_FNS[range.format ?? 'number'] ?? FORMAT_FNS.number!;
  return fn(value, range.unit);
}

const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
};
const _BORDER = { subtle: 'rgba(255,255,255,0.06)', muted: 'rgba(255,255,255,0.08)' };

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 9,
        fontWeight: 700,
        color: TEXT.tertiary,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

function RangeBar({
  scenario,
  accentColor,
}: {
  scenario: SimulationScenario;
  accentColor: string;
}) {
  const { best, base, worst } = scenario.primaryMetric;
  const range = best - worst;
  const baseRatio = range === 0 ? 0.5 : (base - worst) / range;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10,
          color: TEXT.tertiary,
        }}
      >
        <span>Worst</span>
        <span>Base</span>
        <span>Best</span>
      </div>
      <div
        style={{
          position: 'relative',
          height: 8,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, #ef444440, #c8953c60, #6b8f7180)',
            borderRadius: 4,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${baseRatio * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: accentColor,
            boxShadow: `0 0 6px ${accentColor}80`,
            border: '2px solid rgba(0,0,0,0.5)',
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        <span style={{ color: '#ef8a8a', fontWeight: 600 }}>
          {fmt(scenario.primaryMetric, worst)}
        </span>
        <span style={{ color: accentColor, fontWeight: 700 }}>
          {fmt(scenario.primaryMetric, base)}
        </span>
        <span style={{ color: '#6b8f71', fontWeight: 600 }}>
          {fmt(scenario.primaryMetric, best)}
        </span>
      </div>
    </div>
  );
}

function SensitivityChart({
  drivers,
  accentColor,
}: {
  drivers: SensitivityDriver[];
  accentColor: string;
}) {
  const sorted = [...drivers].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)).slice(0, 8);
  const maxImpact = Math.max(...sorted.map((d) => Math.abs(d.impact)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {sorted.map((driver) => {
        const pct = maxImpact > 0 ? (Math.abs(driver.impact) / maxImpact) * 100 : 0;
        const color =
          driver.direction === 'positive'
            ? '#6b8f71'
            : driver.direction === 'negative'
              ? '#ef4444'
              : accentColor;
        return (
          <div key={driver.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontSize: 10,
                color: TEXT.secondary,
                minWidth: 110,
                flexShrink: 0,
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {driver.label}
            </span>
            <div
              style={{
                flex: 1,
                height: 5,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: color,
                  borderRadius: 3,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            <span
              style={{
                fontSize: 10,
                color,
                fontWeight: 700,
                minWidth: 36,
                textAlign: 'right',
                fontFamily: 'monospace',
              }}
            >
              {driver.impact > 0 ? '+' : ''}
              {(driver.impact * 100).toFixed(1)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ScenarioTab({
  scenario,
  active,
  onClick,
  accentColor,
}: {
  scenario: SimulationScenario;
  active: boolean;
  onClick: () => void;
  accentColor: string;
}) {
  const tag = scenario.tag ? TAG_CONFIG[scenario.tag] : null;
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 12px',
        borderRadius: 7,
        border: active ? `1px solid ${accentColor}50` : '1px solid rgba(255,255,255,0.06)',
        background: active ? `${accentColor}18` : 'rgba(255,255,255,0.02)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 2,
        textAlign: 'left',
        minWidth: 110,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: active ? 700 : 500,
          color: active ? accentColor : TEXT.secondary,
        }}
      >
        {scenario.label}
      </span>
      {tag && <span style={{ fontSize: 9, color: tag.color, fontWeight: 600 }}>{tag.label}</span>}
      {scenario.probability !== undefined && (
        <span style={{ fontSize: 9, color: TEXT.tertiary }}>
          P={Math.round(scenario.probability * 100)}%
        </span>
      )}
    </button>
  );
}

function PredVsActualRow({ row }: { row: PredictedVsActual }) {
  const fn = FORMAT_FNS[row.format ?? 'number'] ?? FORMAT_FNS.number!;
  const delta = row.delta ?? row.actual - row.predicted;
  const pct = row.predicted !== 0 ? (delta / Math.abs(row.predicted)) * 100 : 0;
  const color = delta >= 0 ? '#6b8f71' : '#ef4444';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 8px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 6,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: TEXT.primary, fontWeight: 500 }}>{row.label}</div>
        {row.at && <div style={{ fontSize: 9, color: TEXT.tertiary }}>{row.at}</div>}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 10, color: TEXT.tertiary }}>
          Predicted: {fn(row.predicted, row.unit)}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: TEXT.primary }}>
          Actual: {fn(row.actual, row.unit)}
        </div>
        <div style={{ fontSize: 10, color, fontWeight: 600 }}>
          {delta >= 0 ? '+' : ''}
          {pct.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

export function SimulationCockpit({
  title = 'Decision Simulation',
  description,
  scenarios,
  activeScenarioId,
  onScenarioChange,
  primaryMetricLabel = 'Primary Metric',
  predictedVsActual,
  iterationsRun,
  confidenceLevel,
  lastRunAt,
  accentColor = '#8b7ac8',
  className,
  onRunSimulation,
  loading,
}: SimulationCockpitProps) {
  const [localActive, setLocalActive] = useState(scenarios[0]?.id ?? '');
  const activeId = activeScenarioId ?? localActive;
  const activeScenario = scenarios.find((s) => s.id === activeId) ?? scenarios[0];
  const [activeTab, setActiveTab] = useState<'ranges' | 'sensitivity' | 'comparison' | 'outcome'>(
    'ranges',
  );
  const [runLoading, setRunLoading] = useState(false);

  function handleScenarioChange(id: string) {
    setLocalActive(id);
    onScenarioChange?.(id);
  }

  const comparison = useMemo(() => {
    const base = scenarios.find((s) => s.tag === 'baseline') ?? scenarios[0];
    return scenarios.map((s) => ({
      ...s,
      delta: base && base.id !== s.id ? s.primaryMetric.base - base?.primaryMetric.base : 0,
    }));
  }, [scenarios]);

  return (
    <div
      className={className}
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid rgba(255,255,255,0.06)`,
        borderRadius: 12,
        overflow: 'hidden',
        fontSize: 12,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.03)',
          borderBottom: `1px solid rgba(255,255,255,0.06)`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span style={{ fontSize: 16 }}>🎛</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: TEXT.primary, fontSize: 13 }}>{title}</div>
          {description && (
            <div style={{ fontSize: 10, color: TEXT.secondary, marginTop: 1 }}>{description}</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {iterationsRun !== undefined && (
            <span style={{ fontSize: 10, color: TEXT.tertiary, fontFamily: 'monospace' }}>
              {iterationsRun.toLocaleString()} iterations
            </span>
          )}
          {confidenceLevel !== undefined && (
            <span style={{ fontSize: 10, color: accentColor, fontWeight: 600 }}>
              {Math.round(confidenceLevel * 100)}% CI
            </span>
          )}
          {onRunSimulation && (
            <button
              disabled={loading || runLoading}
              onClick={async () => {
                setRunLoading(true);
                await onRunSimulation();
                setRunLoading(false);
              }}
              style={{
                padding: '5px 12px',
                background: accentColor,
                border: 'none',
                borderRadius: 6,
                color: '#fff',
                fontSize: 11,
                cursor: 'pointer',
                fontWeight: 600,
                opacity: loading || runLoading ? 0.7 : 1,
              }}
            >
              {loading || runLoading ? 'Running…' : '▶ Run'}
            </button>
          )}
        </div>
      </div>

      {/* Scenario Tabs */}
      {scenarios.length > 1 && (
        <div
          style={{
            padding: '10px 16px',
            borderBottom: `1px solid rgba(255,255,255,0.04)`,
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
          }}
        >
          {scenarios.map((s) => (
            <ScenarioTab
              key={s.id}
              scenario={s}
              active={s.id === activeId}
              onClick={() => handleScenarioChange(s.id)}
              accentColor={accentColor}
            />
          ))}
        </div>
      )}

      {/* Content Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
        {(['ranges', 'sensitivity', 'comparison', 'outcome'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '7px 14px',
              border: 'none',
              borderBottom:
                activeTab === tab ? `2px solid ${accentColor}` : '2px solid transparent',
              background: 'none',
              color: activeTab === tab ? accentColor : TEXT.tertiary,
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: activeTab === tab ? 700 : 400,
              textTransform: 'capitalize',
            }}
          >
            {tab === 'ranges'
              ? 'Scenario Ranges'
              : tab === 'sensitivity'
                ? 'Sensitivity'
                : tab === 'comparison'
                  ? 'Comparison'
                  : 'Predicted vs Actual'}
          </button>
        ))}
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {activeTab === 'ranges' && activeScenario && (
          <>
            <div>
              <SectionLabel>{primaryMetricLabel}</SectionLabel>
              <RangeBar scenario={activeScenario} accentColor={accentColor} />
            </div>

            {/* Additional metrics */}
            {activeScenario.metrics && Object.entries(activeScenario.metrics).length > 0 && (
              <div>
                <SectionLabel>Metric Ranges</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {Object.entries(activeScenario.metrics).map(([key, m]) => (
                    <div
                      key={key}
                      style={{
                        padding: 8,
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: 7,
                        border: `1px solid rgba(255,255,255,0.04)`,
                      }}
                    >
                      <div style={{ fontSize: 10, color: TEXT.tertiary, marginBottom: 4 }}>
                        {m.label}
                      </div>
                      <div
                        style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}
                      >
                        <span style={{ color: '#ef8a8a' }}>{fmt(m, m.worst)}</span>
                        <span style={{ color: accentColor, fontWeight: 700 }}>
                          {fmt(m, m.base)}
                        </span>
                        <span style={{ color: '#6b8f71' }}>{fmt(m, m.best)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confidence */}
            {activeScenario.primaryMetric.confidence !== undefined && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 11,
                  color: TEXT.secondary,
                }}
              >
                <span>Confidence Interval</span>
                <span style={{ color: accentColor, fontWeight: 600 }}>
                  {Math.round(activeScenario.primaryMetric.confidence * 100)}%
                </span>
              </div>
            )}

            {/* Cost of Waiting */}
            {activeScenario.costOfWaiting && (
              <div
                style={{
                  padding: '8px 10px',
                  background: 'rgba(200,149,60,0.07)',
                  border: '1px solid rgba(200,149,60,0.18)',
                  borderRadius: 7,
                }}
              >
                <SectionLabel>⏰ Cost of Waiting</SectionLabel>
                <div style={{ display: 'flex', gap: 12 }}>
                  {activeScenario.costOfWaiting.perDay !== undefined && (
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#c8953c' }}>
                        {FORMAT_FNS.currency?.(
                          activeScenario.costOfWaiting.perDay,
                          activeScenario.costOfWaiting.unit ?? '$',
                        )}
                      </div>
                      <div style={{ fontSize: 9, color: TEXT.tertiary }}>per day</div>
                    </div>
                  )}
                  {activeScenario.costOfWaiting.perWeek !== undefined && (
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#c8953c' }}>
                        {FORMAT_FNS.currency?.(
                          activeScenario.costOfWaiting.perWeek,
                          activeScenario.costOfWaiting.unit ?? '$',
                        )}
                      </div>
                      <div style={{ fontSize: 9, color: TEXT.tertiary }}>per week</div>
                    </div>
                  )}
                </div>
                {activeScenario.costOfWaiting.description && (
                  <div style={{ fontSize: 10, color: TEXT.secondary, marginTop: 4 }}>
                    {activeScenario.costOfWaiting.description}
                  </div>
                )}
              </div>
            )}

            {/* Recommendation */}
            {activeScenario.recommendation && (
              <div
                style={{
                  padding: '8px 10px',
                  background: `${accentColor}0d`,
                  border: `1px solid ${accentColor}28`,
                  borderRadius: 7,
                }}
              >
                <SectionLabel>💡 Recommendation</SectionLabel>
                <div style={{ fontSize: 12, color: TEXT.primary }}>
                  {activeScenario.recommendation}
                </div>
                {activeScenario.recommendationStrength && (
                  <div style={{ fontSize: 10, color: accentColor, marginTop: 3, fontWeight: 600 }}>
                    Strength: {activeScenario.recommendationStrength}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'sensitivity' && (
          activeScenario?.sensitivityDrivers && activeScenario.sensitivityDrivers.length > 0 ? (
              <div>
                <SectionLabel>
                  Key Sensitivity Drivers (impact on {primaryMetricLabel})
                </SectionLabel>
                <SensitivityChart
                  drivers={activeScenario.sensitivityDrivers}
                  accentColor={accentColor}
                />
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  color: TEXT.tertiary,
                  padding: '24px 0',
                  fontSize: 11,
                }}
              >
                No sensitivity data available for this scenario
              </div>
            )
        )}

        {activeTab === 'comparison' && (
          <div>
            <SectionLabel>Scenario Comparison — {primaryMetricLabel}</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {comparison.map((s) => {
                const tag = s.tag ? TAG_CONFIG[s.tag] : null;
                const isActive = s.id === activeId;
                return (
                  <div
                    key={s.id}
                    onClick={() => handleScenarioChange(s.id)}
                    style={{
                      padding: '8px 10px',
                      background: isActive ? `${accentColor}10` : 'rgba(255,255,255,0.02)',
                      border: isActive
                        ? `1px solid ${accentColor}30`
                        : '1px solid rgba(255,255,255,0.04)',
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontWeight: isActive ? 700 : 500,
                            color: isActive ? accentColor : TEXT.primary,
                            fontSize: 12,
                          }}
                        >
                          {s.label}
                        </span>
                        {tag && (
                          <span style={{ fontSize: 9, color: tag.color, fontWeight: 600 }}>
                            {tag.label}
                          </span>
                        )}
                      </div>
                      {s.description && (
                        <div style={{ fontSize: 10, color: TEXT.tertiary, marginTop: 2 }}>
                          {s.description}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: isActive ? accentColor : TEXT.primary,
                        }}
                      >
                        {fmt(s.primaryMetric, s.primaryMetric.base)}
                      </div>
                      <div style={{ fontSize: 10, color: TEXT.tertiary }}>
                        {fmt(s.primaryMetric, s.primaryMetric.worst)} —{' '}
                        {fmt(s.primaryMetric, s.primaryMetric.best)}
                      </div>
                      {s.delta !== 0 && (
                        <div
                          style={{
                            fontSize: 10,
                            color: s.delta > 0 ? '#6b8f71' : '#ef4444',
                            fontWeight: 600,
                          }}
                        >
                          {s.delta > 0 ? '+' : ''}
                          {fmt(s.primaryMetric, s.delta)} vs baseline
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'outcome' && (
          <div>
            {predictedVsActual && predictedVsActual.length > 0 ? (
              <>
                <SectionLabel>Predicted vs Actual Outcome</SectionLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {predictedVsActual.map((row, i) => (
                    <PredVsActualRow key={i} row={row} />
                  ))}
                </div>
              </>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  color: TEXT.tertiary,
                  padding: '24px 0',
                  fontSize: 11,
                }}
              >
                No outcome data yet — outcomes are tracked after decisions execute
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {lastRunAt && (
        <div
          style={{
            padding: '6px 16px',
            borderTop: `1px solid rgba(255,255,255,0.04)`,
            fontSize: 9,
            color: TEXT.tertiary,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>Last simulated {lastRunAt}</span>
          {iterationsRun && <span>{iterationsRun.toLocaleString()} Monte Carlo iterations</span>}
        </div>
      )}
    </div>
  );
}

export function SimulationCockpitCompact({
  scenarios,
  primaryMetricLabel = 'Expected Value',
  accentColor = '#8b7ac8',
}: {
  scenarios: SimulationScenario[];
  primaryMetricLabel?: string;
  accentColor?: string;
}) {
  const scenario = scenarios[0];
  if (!scenario) return null;
  return (
    <div
      style={{
        padding: '10px 12px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8,
        fontSize: 11,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 12 }}>🎛</span>
        <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>
          Simulation — {primaryMetricLabel}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
        {[
          {
            label: 'Worst',
            value: fmt(scenario.primaryMetric, scenario.primaryMetric.worst),
            color: '#ef8a8a',
          },
          {
            label: 'Base',
            value: fmt(scenario.primaryMetric, scenario.primaryMetric.base),
            color: accentColor,
          },
          {
            label: 'Best',
            value: fmt(scenario.primaryMetric, scenario.primaryMetric.best),
            color: '#6b8f71',
          },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: TEXT.tertiary, marginBottom: 2 }}>{label}</div>
            <div style={{ fontWeight: 700, color, fontSize: 13 }}>{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
