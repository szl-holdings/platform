import { useMemo, useState } from 'react';
import { cn } from './utils';

export interface IntelligenceSignal {
  id: string;
  type: string;
  title: string;
  summary: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  confidence: number;
  affectedDomains: string[];
  affectedEntities?: Array<{ id: string; name: string; domain: string; type: string }>;
  evidenceCount?: number;
  recommendedActions?: string[];
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'escalated';
  tags?: string[];
  hasActionDrafts?: boolean;
}

export interface CortexFeedStats {
  total: number;
  active: number;
  critical: number;
  high: number;
  domainsAffected?: string[];
}

export interface CortexIntelligenceFeedProps {
  signals?: IntelligenceSignal[];
  stats?: CortexFeedStats;
  accentColor?: string;
  className?: string;
  maxItems?: number;
  onSignalClick?: (signal: IntelligenceSignal) => void;
  onGenerateDrafts?: (signal: IntelligenceSignal) => void;
  onAcknowledge?: (signalId: string) => void;
  loading?: boolean;
}

const SEVERITY_CONFIG: Record<
  IntelligenceSignal['severity'],
  { color: string; bg: string; border: string; label: string; priority: number }
> = {
  critical: {
    color: '#ef4444',
    bg: '#ef444415',
    border: '#ef444440',
    label: 'CRITICAL',
    priority: 4,
  },
  high: { color: '#f97316', bg: '#f9731615', border: '#f9731640', label: 'HIGH', priority: 3 },
  medium: { color: '#f59e0b', bg: '#f59e0b15', border: '#f59e0b40', label: 'MEDIUM', priority: 2 },
  low: { color: '#3b82f6', bg: '#3b82f615', border: '#3b82f640', label: 'LOW', priority: 1 },
  info: { color: '#6b7280', bg: '#6b728015', border: '#6b728040', label: 'INFO', priority: 0 },
};

const DOMAIN_META: Record<string, { label: string; icon: string; color: string }> = {
  vessels: { label: 'Vessels', icon: '⚓', color: '#0ea5e9' },
  firestorm: { label: 'Aegis', icon: '⬡', color: '#ef4444' },
  aegis: { label: 'Aegis', icon: '⬡', color: '#ef4444' },
  terra: { label: 'Terra', icon: '⬢', color: '#22c55e' },
  lyte: { label: 'Lyte', icon: '⚡', color: '#f59e0b' },
  prism: { label: 'PRISM', icon: '⚖', color: '#a855f7' },
  szl: { label: 'Portfolio', icon: '◆', color: '#c9a84c' },
  'szl-holdings': { label: 'Portfolio', icon: '◆', color: '#c9a84c' },
  inca: { label: 'Counsel', icon: '◈', color: '#8b5cf6' },
  msp: { label: 'MSP', icon: '◇', color: '#6366f1' },
};

const CATEGORY_LABELS: Record<string, string> = {
  cross_domain_risk: 'Cross-Domain Risk',
  entity_correlation: 'Entity Correlation',
  pattern_anomaly: 'Pattern Anomaly',
  sanctions_exposure: 'Sanctions Exposure',
  litigation_impact: 'Litigation Impact',
  financial_stress: 'Financial Stress',
  threat_escalation: 'Threat Escalation',
  opportunity_signal: 'Opportunity Signal',
};

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          width: 40,
          height: 4,
          borderRadius: 2,
          background: '#ffffff12',
          overflow: 'hidden',
        }}
      >
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 11, color: '#ffffff60', fontFamily: 'monospace' }}>{pct}%</span>
    </div>
  );
}

function DomainPill({ domain }: { domain: string }) {
  const meta = DOMAIN_META[domain] ?? { label: domain, icon: '◆', color: '#6b7280' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        fontSize: 10,
        fontWeight: 600,
        padding: '2px 6px',
        borderRadius: 4,
        background: `${meta.color}18`,
        color: meta.color,
        border: `1px solid ${meta.color}30`,
        letterSpacing: '0.05em',
        textTransform: 'uppercase' as const,
      }}
    >
      {meta.icon} {meta.label}
    </span>
  );
}

function SignalCard({
  signal,
  expanded,
  onToggle,
  onGenerateDrafts,
  onAcknowledge,
}: {
  signal: IntelligenceSignal;
  expanded: boolean;
  onToggle: () => void;
  onGenerateDrafts?: (s: IntelligenceSignal) => void;
  onAcknowledge?: (id: string) => void;
}) {
  const sev = SEVERITY_CONFIG[signal.severity];

  return (
    <div
      style={{
        background: expanded ? '#ffffff08' : '#ffffff05',
        border: `1px solid ${expanded ? sev.border : '#ffffff15'}`,
        borderLeft: `3px solid ${sev.color}`,
        borderRadius: 8,
        overflow: 'hidden',
        transition: 'border-color 0.15s',
        cursor: 'pointer',
      }}
      onClick={onToggle}
    >
      <div style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div
            style={{
              marginTop: 2,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: sev.color,
              flexShrink: 0,
              boxShadow: signal.severity === 'critical' ? `0 0 6px ${sev.color}80` : 'none',
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap' as const,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: sev.color,
                  fontFamily: 'monospace',
                  letterSpacing: '0.08em',
                }}
              >
                {sev.label}
              </span>
              {signal.category && (
                <span style={{ fontSize: 10, color: '#ffffff50', letterSpacing: '0.04em' }}>
                  {CATEGORY_LABELS[signal.category] ?? signal.category}
                </span>
              )}
              {signal.hasActionDrafts && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#c9a84c',
                    background: '#c9a84c18',
                    border: '1px solid #c9a84c40',
                    borderRadius: 3,
                    padding: '1px 5px',
                    letterSpacing: '0.06em',
                  }}
                >
                  DRAFTS READY
                </span>
              )}
            </div>

            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 600,
                color: '#ffffff',
                lineHeight: 1.4,
                marginBottom: 4,
              }}
            >
              {signal.title}
            </p>

            {!expanded && (
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: '#ffffff70',
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical' as const,
                  overflow: 'hidden',
                }}
              >
                {signal.summary}
              </p>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column' as const,
              alignItems: 'flex-end',
              gap: 4,
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 11, color: '#ffffff50' }}>
              {formatRelativeTime(signal.timestamp)}
            </span>
            <ConfidenceMeter value={signal.confidence} />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 4,
            flexWrap: 'wrap' as const,
            marginTop: 6,
            paddingLeft: 18,
          }}
        >
          {signal.affectedDomains.map((d) => (
            <DomainPill key={d} domain={d} />
          ))}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 14px 12px 14px', borderTop: '1px solid #ffffff10' }}>
          <div style={{ paddingTop: 10 }}>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: '#ffffffcc', lineHeight: 1.6 }}>
              {signal.summary}
            </p>

            {signal.affectedEntities && signal.affectedEntities.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <p
                  style={{
                    margin: '0 0 5px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#ffffff60',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase' as const,
                  }}
                >
                  Affected Entities
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                  {signal.affectedEntities.map((e) => (
                    <span
                      key={e.id}
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: '#ffffff08',
                        border: '1px solid #ffffff15',
                        color: '#ffffffcc',
                      }}
                    >
                      {e.name}
                      <span style={{ color: '#ffffff50', marginLeft: 4 }}>{e.type}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {signal.recommendedActions && signal.recommendedActions.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <p
                  style={{
                    margin: '0 0 5px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#ffffff60',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase' as const,
                  }}
                >
                  Recommended Actions
                </p>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {signal.recommendedActions.map((action, i) => (
                    <li
                      key={i}
                      style={{ fontSize: 12, color: '#ffffffb0', marginBottom: 2, lineHeight: 1.5 }}
                    >
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {!signal.hasActionDrafts && onGenerateDrafts && signal.status === 'active' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onGenerateDrafts(signal);
                  }}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '5px 12px',
                    borderRadius: 5,
                    background: '#c9a84c20',
                    border: '1px solid #c9a84c50',
                    color: '#c9a84c',
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                  }}
                >
                  Generate Action Drafts
                </button>
              )}
              {signal.status === 'active' && onAcknowledge && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAcknowledge(signal.id);
                  }}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '5px 12px',
                    borderRadius: 5,
                    background: '#ffffff08',
                    border: '1px solid #ffffff20',
                    color: '#ffffffa0',
                    cursor: 'pointer',
                  }}
                >
                  Acknowledge
                </button>
              )}
              {signal.evidenceCount !== undefined && signal.evidenceCount > 0 && (
                <span style={{ fontSize: 11, color: '#ffffff40', alignSelf: 'center' }}>
                  {signal.evidenceCount} evidence item{signal.evidenceCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SEVERITY_FILTERS: Array<{ key: string; label: string; color: string }> = [
  { key: 'all', label: 'All', color: '#ffffff' },
  { key: 'critical', label: 'Critical', color: '#ef4444' },
  { key: 'high', label: 'High', color: '#f97316' },
  { key: 'medium', label: 'Medium', color: '#f59e0b' },
];

const DOMAIN_FILTERS = [
  { key: 'all', label: 'All Domains' },
  { key: 'vessels', label: 'Vessels' },
  { key: 'firestorm', label: 'Aegis' },
  { key: 'terra', label: 'Terra' },
  { key: 'lyte', label: 'Lyte' },
  { key: 'prism', label: 'PRISM' },
  { key: 'szl', label: 'Portfolio' },
];

export function CortexIntelligenceFeed({
  signals = [],
  stats,
  accentColor = '#c9a84c',
  className,
  maxItems = 50,
  onSignalClick,
  onGenerateDrafts,
  onAcknowledge,
  loading,
}: CortexIntelligenceFeedProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');

  const filtered = useMemo(() => {
    let result = [...signals];
    if (severityFilter !== 'all') {
      result = result.filter((s) => s.severity === severityFilter);
    }
    if (domainFilter !== 'all') {
      result = result.filter(
        (s) =>
          s.affectedDomains.includes(domainFilter) ||
          (domainFilter === 'firestorm' && s.affectedDomains.includes('aegis')),
      );
    }
    return result
      .sort((a, b) => {
        const ap = SEVERITY_CONFIG[a.severity].priority;
        const bp = SEVERITY_CONFIG[b.severity].priority;
        if (bp !== ap) return bp - ap;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      })
      .slice(0, maxItems);
  }, [signals, severityFilter, domainFilter, maxItems]);

  const handleToggle = (signal: IntelligenceSignal) => {
    setExpandedId((prev) => (prev === signal.id ? null : signal.id));
    onSignalClick?.(signal);
  };

  return (
    <div className={cn(className)} style={{ fontFamily: 'system-ui, sans-serif' }}>
      {stats && (
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 16,
            flexWrap: 'wrap' as const,
          }}
        >
          {[
            { label: 'Active Signals', value: stats.active, color: '#ffffff' },
            { label: 'Critical', value: stats.critical, color: '#ef4444' },
            { label: 'High', value: stats.high, color: '#f97316' },
            { label: 'Total', value: stats.total, color: '#ffffff60' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                flex: 1,
                minWidth: 80,
                background: '#ffffff06',
                border: '1px solid #ffffff12',
                borderRadius: 8,
                padding: '8px 12px',
                textAlign: 'center' as const,
              }}
            >
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color, lineHeight: 1.2 }}>
                {value}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 10,
                  color: '#ffffff50',
                  marginTop: 2,
                  letterSpacing: '0.05em',
                }}
              >
                {label.toUpperCase()}
              </p>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 12 }}>
        {SEVERITY_FILTERS.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setSeverityFilter(key)}
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 5,
              border: `1px solid ${severityFilter === key ? accentColor : '#ffffff20'}`,
              background: severityFilter === key ? `${accentColor}20` : 'transparent',
              color: severityFilter === key ? accentColor : '#ffffff60',
              cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            {label}
          </button>
        ))}
        <div style={{ width: 1, height: 24, background: '#ffffff15', margin: '0 2px' }} />
        <select
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 8px',
            borderRadius: 5,
            border: '1px solid #ffffff20',
            background: '#0a0a0a',
            color: '#ffffff80',
            cursor: 'pointer',
          }}
        >
          {DOMAIN_FILTERS.map(({ key, label }) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ padding: '32px 0', textAlign: 'center' as const }}>
          <div
            style={{
              width: 24,
              height: 24,
              border: `2px solid ${accentColor}40`,
              borderTopColor: accentColor,
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }}
          />
          <p style={{ margin: 0, fontSize: 13, color: '#ffffff40' }}>
            APEX is scanning cross-domain signals…
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            padding: '32px 16px',
            textAlign: 'center' as const,
            background: '#ffffff04',
            borderRadius: 8,
            border: '1px dashed #ffffff15',
          }}
        >
          <p style={{ margin: '0 0 4px', fontSize: 22 }}>◈</p>
          <p style={{ margin: 0, fontSize: 13, color: '#ffffff50' }}>
            No signals match the current filters
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
          {filtered.map((signal) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              expanded={expandedId === signal.id}
              onToggle={() => handleToggle(signal)}
              {...(onGenerateDrafts !== undefined ? { onGenerateDrafts } : {})}
              {...(onAcknowledge !== undefined ? { onAcknowledge } : {})}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export type { IntelligenceSignal as CortexSignal };
