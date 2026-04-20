import React, { useState } from 'react';
import { cn } from './utils';

export interface WhatIfCascade {
  domain: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  estimatedExposure: string;
  affectedEntities: string[];
  mitigationOptions: string[];
}

export interface WhatIfResult {
  scenarioId: string;
  event: string;
  query: string;
  summary: string;
  affectedDomains: string[];
  cascades: WhatIfCascade[];
  timeHorizon: string;
  overallRisk: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  generatedAt: string;
}

export interface CortexWhatIfProps {
  accentColor?: string;
  className?: string;
  onQuery?: (query: string) => Promise<WhatIfResult>;
  initialResult?: WhatIfResult;
}

const DOMAIN_META: Record<string, { label: string; icon: string; color: string }> = {
  vessels: { label: 'Vessels', icon: '⚓', color: '#0ea5e9' },
  firestorm: { label: 'Aegis', icon: '⬡', color: '#ef4444' },
  aegis: { label: 'Aegis', icon: '⬡', color: '#ef4444' },
  terra: { label: 'Terra', icon: '⬢', color: '#22c55e' },
  lyte: { label: 'Lyte', icon: '⚡', color: '#f59e0b' },
  prism: { label: 'PRISM', icon: '⚖', color: '#a855f7' },
  szl: { label: 'Portfolio', icon: '◆', color: '#c9a84c' },
};

const IMPACT_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: '#ef4444', bg: '#ef444415', label: 'Critical Impact' },
  high: { color: '#f97316', bg: '#f9731615', label: 'High Impact' },
  medium: { color: '#f59e0b', bg: '#f59e0b15', label: 'Medium Impact' },
  low: { color: '#3b82f6', bg: '#3b82f615', label: 'Low Impact' },
};

const STARTER_SCENARIOS = [
  'What if Port of Rotterdam closes for 2 weeks?',
  'What if a sanctioned entity is identified in our supply chain?',
  'What if oil prices spike 30% in 60 days?',
  'What if a critical CVE is exploited in our infrastructure?',
  'What if a vessel is seized by authorities?',
  'What if our largest LP requests emergency redemption?',
];

function CascadeCard({ cascade, index }: { cascade: WhatIfCascade; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const domain = DOMAIN_META[cascade.domain] ?? {
    label: cascade.domain,
    icon: '◆',
    color: '#6b7280',
  };
  const impact = IMPACT_CONFIG[cascade.impact]!;

  return (
    <div
      style={{
        border: `1px solid #ffffff12`,
        borderLeft: `3px solid ${impact.color}`,
        borderRadius: 8,
        overflow: 'hidden',
        background: '#ffffff04',
      }}
    >
      <div
        style={{ padding: '10px 14px', cursor: 'pointer' }}
        onClick={() => setExpanded((p) => !p)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: `${domain.color}18`,
              border: `1px solid ${domain.color}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            {domain.icon}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: domain.color,
                }}
              >
                {domain.label}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 3,
                  background: impact.bg,
                  color: impact.color,
                  border: `1px solid ${impact.color}30`,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase' as const,
                }}
              >
                {impact.label}
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: '#ffffffcc',
                lineHeight: 1.4,
                display: expanded ? 'block' : '-webkit-box',
                WebkitLineClamp: expanded ? undefined : 2,
                WebkitBoxOrient: 'vertical' as const,
                overflow: expanded ? 'visible' : 'hidden',
              }}
            >
              {cascade.description}
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'flex-end',
              gap: 3,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: impact.color,
              }}
            >
              {cascade.estimatedExposure}
            </span>
            <span style={{ fontSize: 14, color: '#ffffff40' }}>{expanded ? '▾' : '▸'}</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 14px 12px', borderTop: '1px solid #ffffff10' }}>
          {cascade.affectedEntities.length > 0 && (
            <div style={{ marginTop: 10, marginBottom: 10 }}>
              <p
                style={{
                  margin: '0 0 5px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#ffffff50',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase' as const,
                }}
              >
                Affected Entities
              </p>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
                {cascade.affectedEntities.map((e) => (
                  <span
                    key={e}
                    style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: '#ffffff08',
                      border: '1px solid #ffffff15',
                      color: '#ffffffcc',
                    }}
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}

          {cascade.mitigationOptions.length > 0 && (
            <div>
              <p
                style={{
                  margin: '0 0 6px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#ffffff50',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase' as const,
                }}
              >
                Mitigation Options
              </p>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {cascade.mitigationOptions.map((opt, i) => (
                  <li
                    key={i}
                    style={{ fontSize: 12, color: '#ffffffb0', marginBottom: 3, lineHeight: 1.5 }}
                  >
                    {opt}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

async function defaultQuery(query: string): Promise<WhatIfResult> {
  const res = await fetch('/api/cortex/whatif', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error('Scenario engine unavailable');
  const data = await res.json();
  return data.data ?? data;
}

export function CortexWhatIf({
  accentColor = '#c9a84c',
  className,
  onQuery,
  initialResult,
}: CortexWhatIfProps) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<WhatIfResult | null>(initialResult ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (q?: string) => {
    const finalQuery = (q ?? query).trim();
    if (!finalQuery) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const fn = onQuery ?? defaultQuery;
      const r = await fn(finalQuery);
      setResult(r);
    } catch (err) {
      setError('CORTEX scenario engine is unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const overallRisk = result ? IMPACT_CONFIG[result.overallRisk] : null;

  return (
    <div className={cn(className)} style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div
        style={{
          background: '#ffffff06',
          border: '1px solid #ffffff15',
          borderRadius: 10,
          padding: '14px',
          marginBottom: 16,
        }}
      >
        <p
          style={{
            margin: '0 0 10px',
            fontSize: 11,
            fontWeight: 600,
            color: '#ffffff50',
            letterSpacing: '0.07em',
            textTransform: 'uppercase' as const,
          }}
        >
          What-If Scenario Engine
        </p>

        <div style={{ position: 'relative' as const }}>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Describe a hypothetical event — e.g., &quot;What if Port X closes?&quot; or &quot;What if a sanctioned entity appears in our supply chain?&quot;"
            rows={2}
            style={{
              width: '100%',
              background: '#000000',
              border: `1px solid ${accentColor}30`,
              borderRadius: 8,
              padding: '10px 12px',
              paddingRight: 90,
              fontSize: 13,
              color: '#ffffff',
              resize: 'none' as const,
              outline: 'none',
              lineHeight: 1.5,
              boxSizing: 'border-box' as const,
              fontFamily: 'system-ui, sans-serif',
            }}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={loading || !query.trim()}
            style={{
              position: 'absolute' as const,
              right: 8,
              bottom: 8,
              fontSize: 11,
              fontWeight: 700,
              padding: '6px 12px',
              borderRadius: 6,
              background: loading || !query.trim() ? '#ffffff10' : accentColor,
              border: 'none',
              color: loading || !query.trim() ? '#ffffff40' : '#000000',
              cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
              letterSpacing: '0.04em',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Running…' : 'Simulate ▶'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const, marginTop: 8 }}>
          {STARTER_SCENARIOS.map((scenario) => (
            <button
              key={scenario}
              onClick={() => {
                setQuery(scenario);
                handleSubmit(scenario);
              }}
              style={{
                fontSize: 10,
                padding: '3px 9px',
                borderRadius: 4,
                border: '1px solid #ffffff15',
                background: 'transparent',
                color: '#ffffff50',
                cursor: 'pointer',
                letterSpacing: '0.02em',
                transition: 'border-color 0.1s, color 0.1s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${accentColor}60`;
                (e.currentTarget as HTMLButtonElement).style.color = accentColor;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#ffffff15';
                (e.currentTarget as HTMLButtonElement).style.color = '#ffffff50';
              }}
            >
              {scenario}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div
          style={{
            padding: '40px 0',
            textAlign: 'center' as const,
            background: '#ffffff04',
            borderRadius: 10,
            border: '1px solid #ffffff10',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              border: `2px solid ${accentColor}40`,
              borderTopColor: accentColor,
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 14px',
            }}
          />
          <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#ffffff80' }}>
            CORTEX is tracing cascades…
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#ffffff40' }}>
            Querying entity graph across all domains
          </p>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '16px',
            background: '#ef444415',
            border: '1px solid #ef444440',
            borderRadius: 8,
            fontSize: 13,
            color: '#ef4444',
          }}
        >
          {error}
        </div>
      )}

      {result && !loading && (
        <div>
          <div
            style={{
              padding: '14px',
              background: '#ffffff06',
              border: `1px solid ${overallRisk?.color ?? '#ffffff15'}30`,
              borderRadius: 10,
              marginBottom: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 6,
                    flexWrap: 'wrap' as const,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: `${overallRisk?.color ?? '#6b7280'}15`,
                      color: overallRisk?.color ?? '#6b7280',
                      border: `1px solid ${overallRisk?.color ?? '#6b7280'}30`,
                      letterSpacing: '0.07em',
                      textTransform: 'uppercase' as const,
                    }}
                  >
                    Overall Risk: {result.overallRisk.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 11, color: '#ffffff50' }}>
                    Time Horizon: {result.timeHorizon}
                  </span>
                  <span style={{ fontSize: 11, color: '#ffffff50' }}>
                    Confidence: {Math.round(result.confidence * 100)}%
                  </span>
                </div>

                <p
                  style={{
                    margin: '0 0 6px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#ffffff60',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase' as const,
                  }}
                >
                  Scenario
                </p>
                <p
                  style={{
                    margin: '0 0 10px',
                    fontSize: 13,
                    fontStyle: 'italic',
                    color: accentColor,
                    lineHeight: 1.5,
                  }}
                >
                  "{result.query}"
                </p>
                <p style={{ margin: 0, fontSize: 13, color: '#ffffffcc', lineHeight: 1.6 }}>
                  {result.summary}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
              <span style={{ fontSize: 11, color: '#ffffff50', marginRight: 4 }}>
                Affected domains:
              </span>
              {result.affectedDomains.map((d) => {
                const meta = DOMAIN_META[d] ?? { label: d, icon: '◆', color: '#6b7280' };
                return (
                  <span
                    key={d}
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: 4,
                      background: `${meta.color}18`,
                      color: meta.color,
                      border: `1px solid ${meta.color}30`,
                    }}
                  >
                    {meta.icon} {meta.label}
                  </span>
                );
              })}
            </div>
          </div>

          <p
            style={{
              margin: '0 0 10px',
              fontSize: 11,
              fontWeight: 600,
              color: '#ffffff50',
              letterSpacing: '0.07em',
              textTransform: 'uppercase' as const,
            }}
          >
            Domain Impact Cascades
          </p>

          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
            {result.cascades.map((cascade, i) => (
              <CascadeCard key={`${cascade.domain}-${i}`} cascade={cascade} index={i} />
            ))}
          </div>

          <div
            style={{
              marginTop: 14,
              padding: '10px 14px',
              background: '#ffffff04',
              borderRadius: 8,
              border: '1px solid #ffffff0a',
              fontSize: 11,
              color: '#ffffff40',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 14 }}>◈</span>
            <span>
              CORTEX scenario engine uses the cross-domain entity graph and historical pattern
              library. Results are probabilistic — human judgment required for final decisions.
            </span>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
