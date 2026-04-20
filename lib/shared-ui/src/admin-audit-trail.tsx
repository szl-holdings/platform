import React, { useMemo, useState } from 'react';

export type AuditActorType = 'human' | 'ai_model' | 'agent' | 'system';
export type AuditActionType =
  | 'ai_decision'
  | 'agent_action'
  | 'human_approval'
  | 'human_denial'
  | 'human_override'
  | 'policy_evaluation'
  | 'proof_review'
  | 'export'
  | 'escalation'
  | 'system_event'
  | 'data_access'
  | 'config_change'
  | 'recommendation'
  | 'outcome_recorded';

export interface AuditTrailEntry {
  id: string;
  timestamp: number;
  actionType: AuditActionType;
  actor: string;
  actorType: AuditActorType;
  domain?: string;
  action: string;
  entityId?: string;
  entityType?: string;
  outcome?: string;
  confidence?: number;
  modelUsed?: string;
  approvedBy?: string;
  overrideReason?: string;
  policyId?: string;
  proofId?: string | number;
  immutableHash?: string;
  chainLink?: string;
  riskLevel?: 'critical' | 'high' | 'medium' | 'low' | 'info';
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface AdminAuditTrailProps {
  entries: AuditTrailEntry[];
  title?: string;
  accentColor?: string;
  className?: string;
  showFilters?: boolean;
  maxVisible?: number;
  onEntryClick?: (entry: AuditTrailEntry) => void;
  domainLabel?: string;
}

const ACTION_TYPE_ICONS: Record<AuditActionType, string> = {
  ai_decision: '🤖',
  agent_action: '⚡',
  human_approval: '✓',
  human_denial: '✕',
  human_override: '⚑',
  policy_evaluation: '🛡',
  proof_review: '🔐',
  export: '📤',
  escalation: '↑',
  system_event: '⚙️',
  data_access: '👁',
  config_change: '🔧',
  recommendation: '💡',
  outcome_recorded: '📊',
};

const ACTOR_ICONS: Record<AuditActorType, string> = {
  human: '👤',
  ai_model: '🤖',
  agent: '⚡',
  system: '⚙️',
};

const RISK_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#4a90b8',
  info: '#6b7280',
};

const ACTION_TYPE_LABELS: Record<AuditActionType, string> = {
  ai_decision: 'AI Decision',
  agent_action: 'Agent Action',
  human_approval: 'Approval',
  human_denial: 'Denial',
  human_override: 'Override',
  policy_evaluation: 'Policy Eval',
  proof_review: 'Proof Review',
  export: 'Export',
  escalation: 'Escalation',
  system_event: 'System',
  data_access: 'Data Access',
  config_change: 'Config Change',
  recommendation: 'Recommendation',
  outcome_recorded: 'Outcome',
};

const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
};
const BORDER = { subtle: 'rgba(255,255,255,0.06)', muted: 'rgba(255,255,255,0.08)' };

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function EntryDetail({
  entry,
  accentColor,
  onClose,
}: {
  entry: AuditTrailEntry;
  accentColor: string;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        background: '#0f1219',
        border: `1px solid rgba(255,255,255,0.08)`,
        borderRadius: 10,
        padding: 16,
        fontSize: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderBottom: `1px solid ${BORDER.subtle}`,
          paddingBottom: 10,
        }}
      >
        <span style={{ fontSize: 18 }}>{ACTION_TYPE_ICONS[entry.actionType]}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: TEXT.primary }}>{entry.action}</div>
          <div style={{ fontSize: 10, color: TEXT.tertiary }}>
            {entry.actionType} · {fmtDate(entry.timestamp)} {fmtTime(entry.timestamp)}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: TEXT.tertiary,
            cursor: 'pointer',
            fontSize: 16,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {(
          [
            { label: 'Actor', value: `${ACTOR_ICONS[entry.actorType]} ${entry.actor}` },
            { label: 'Actor Type', value: entry.actorType },
            entry.domain ? { label: 'Domain', value: entry.domain } : null,
            entry.entityType
              ? {
                  label: 'Entity',
                  value: `${entry.entityType}${entry.entityId ? ` #${entry.entityId}` : ''}`,
                }
              : null,
            entry.modelUsed ? { label: 'Model Used', value: entry.modelUsed } : null,
            entry.confidence !== undefined
              ? { label: 'Confidence', value: `${Math.round(entry.confidence * 100)}%` }
              : null,
            entry.approvedBy ? { label: 'Approved By', value: entry.approvedBy } : null,
            entry.policyId ? { label: 'Policy ID', value: entry.policyId } : null,
            entry.proofId ? { label: 'Proof ID', value: `#${entry.proofId}` } : null,
            entry.riskLevel ? { label: 'Risk Level', value: entry.riskLevel } : null,
          ] as Array<{ label: string; value: string } | null>
        )
          .filter((item): item is { label: string; value: string } => item !== null)
          .map((item, i) => (
            <div
              key={i}
              style={{ padding: '5px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 5 }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: TEXT.tertiary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 2,
                }}
              >
                {item.label}
              </div>
              <div style={{ color: TEXT.primary, fontSize: 11 }}>{item.value}</div>
            </div>
          ))}
      </div>

      {entry.outcome && (
        <div
          style={{
            padding: '6px 10px',
            background: 'rgba(107,143,113,0.07)',
            border: '1px solid rgba(107,143,113,0.18)',
            borderRadius: 6,
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: TEXT.tertiary,
              marginBottom: 2,
              textTransform: 'uppercase',
            }}
          >
            Outcome
          </div>
          <div style={{ fontSize: 11, color: TEXT.primary }}>{entry.outcome}</div>
        </div>
      )}

      {entry.overrideReason && (
        <div
          style={{
            padding: '6px 10px',
            background: 'rgba(200,149,60,0.07)',
            border: '1px solid rgba(200,149,60,0.18)',
            borderRadius: 6,
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: TEXT.tertiary,
              marginBottom: 2,
              textTransform: 'uppercase',
            }}
          >
            Override Reason
          </div>
          <div style={{ fontSize: 11, color: '#c8953c' }}>{entry.overrideReason}</div>
        </div>
      )}

      {entry.notes && (
        <div style={{ fontSize: 11, color: TEXT.secondary, fontStyle: 'italic' }}>
          "{entry.notes}"
        </div>
      )}

      {entry.immutableHash && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 10,
            color: TEXT.tertiary,
            paddingTop: 6,
            borderTop: `1px solid ${BORDER.subtle}`,
          }}
        >
          <span>Immutable Hash</span>
          <span style={{ fontFamily: 'monospace' }}>{entry.immutableHash.slice(0, 20)}…</span>
        </div>
      )}
      {entry.chainLink && (
        <div style={{ fontSize: 10, color: TEXT.tertiary }}>
          Links to: <span style={{ fontFamily: 'monospace' }}>{entry.chainLink}</span>
        </div>
      )}
    </div>
  );
}

function AuditEntryRow({
  entry,
  accentColor,
  onClick,
  isLast,
}: {
  entry: AuditTrailEntry;
  accentColor: string;
  onClick: () => void;
  isLast: boolean;
}) {
  const riskColor = entry.riskLevel
    ? (RISK_COLORS[entry.riskLevel] ?? RISK_COLORS.info!)
    : RISK_COLORS.info!;

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', position: 'relative' }}>
      {/* Timeline line */}
      {!isLast && (
        <div
          style={{
            position: 'absolute',
            left: 14,
            top: 28,
            bottom: -8,
            width: 1,
            background: BORDER.subtle,
          }}
        />
      )}
      {/* Icon */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid rgba(255,255,255,0.07)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          flexShrink: 0,
          zIndex: 1,
          boxShadow:
            entry.riskLevel && entry.riskLevel !== 'info' ? `0 0 8px ${riskColor}40` : 'none',
        }}
      >
        {ACTION_TYPE_ICONS[entry.actionType]}
      </div>

      {/* Content */}
      <div onClick={onClick} style={{ flex: 1, paddingBottom: 12, cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: TEXT.primary, flex: 1 }}>
            {entry.action}
          </span>
          {entry.riskLevel && entry.riskLevel !== 'info' && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: riskColor,
                background: `${riskColor}18`,
                padding: '1px 5px',
                borderRadius: 3,
              }}
            >
              {entry.riskLevel.toUpperCase()}
            </span>
          )}
          <span style={{ fontSize: 10, color: TEXT.tertiary, flexShrink: 0 }}>
            {timeAgo(entry.timestamp)}
          </span>
        </div>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}
        >
          <span style={{ fontSize: 10, color: TEXT.secondary }}>
            {ACTOR_ICONS[entry.actorType]} {entry.actor}
          </span>
          <span
            style={{
              fontSize: 9,
              color: TEXT.tertiary,
              background: 'rgba(255,255,255,0.04)',
              padding: '1px 6px',
              borderRadius: 3,
            }}
          >
            {ACTION_TYPE_LABELS[entry.actionType]}
          </span>
          {entry.domain && (
            <span style={{ fontSize: 9, color: TEXT.tertiary }}>{entry.domain}</span>
          )}
          {entry.confidence !== undefined && (
            <span
              style={{
                fontSize: 9,
                color:
                  entry.confidence >= 0.8
                    ? '#6b8f71'
                    : entry.confidence >= 0.5
                      ? '#c8953c'
                      : '#ef4444',
                fontFamily: 'monospace',
              }}
            >
              {Math.round(entry.confidence * 100)}% conf
            </span>
          )}
        </div>
        {entry.outcome && (
          <div style={{ marginTop: 3, fontSize: 10, color: TEXT.tertiary }}>→ {entry.outcome}</div>
        )}
        {entry.approvedBy && (
          <div style={{ marginTop: 2, fontSize: 10, color: '#6b8f71' }}>
            ✓ Approved by {entry.approvedBy}
          </div>
        )}
      </div>
    </div>
  );
}

type FilterType = 'all' | AuditActionType | AuditActorType;

export function AdminAuditTrail({
  entries,
  title = 'Decision Audit Trail',
  accentColor = '#8b5cf6',
  className,
  showFilters = true,
  maxVisible = 50,
  onEntryClick,
  domainLabel,
}: AdminAuditTrailProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<AuditTrailEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    let result = entries;
    if (filter !== 'all') {
      result = result.filter((e) => e.actionType === filter || e.actorType === filter);
    }
    if (riskFilter !== 'all') {
      result = result.filter((e) => e.riskLevel === riskFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.action.toLowerCase().includes(q) ||
          e.actor.toLowerCase().includes(q) ||
          (e.domain ?? '').toLowerCase().includes(q) ||
          (e.entityType ?? '').toLowerCase().includes(q),
      );
    }
    return result.slice(0, maxVisible);
  }, [entries, filter, riskFilter, searchQuery, maxVisible]);

  const stats = useMemo(
    () => ({
      total: entries.length,
      aiActions: entries.filter((e) => e.actorType === 'ai_model' || e.actorType === 'agent')
        .length,
      humanApprovals: entries.filter((e) => e.actionType === 'human_approval').length,
      overrides: entries.filter((e) => e.actionType === 'human_override').length,
      criticalHigh: entries.filter((e) => e.riskLevel === 'critical' || e.riskLevel === 'high')
        .length,
    }),
    [entries],
  );

  const filterButtons: Array<{ id: FilterType | string; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'ai_decision', label: 'AI Decisions' },
    { id: 'human_approval', label: 'Approvals' },
    { id: 'human_override', label: 'Overrides' },
    { id: 'policy_evaluation', label: 'Policy' },
    { id: 'export', label: 'Exports' },
    { id: 'escalation', label: 'Escalations' },
  ];

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
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 16 }}>🔐</span>
          <div>
            <div style={{ fontWeight: 700, color: TEXT.primary, fontSize: 13 }}>{title}</div>
            {domainLabel && (
              <div style={{ fontSize: 10, color: TEXT.tertiary }}>Domain: {domainLabel}</div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 6,
            marginBottom: showFilters ? 10 : 0,
          }}
        >
          {[
            { label: 'Total Events', value: stats.total, color: accentColor },
            { label: 'AI Actions', value: stats.aiActions, color: '#8b7ac8' },
            { label: 'Approvals', value: stats.humanApprovals, color: '#6b8f71' },
            { label: 'Overrides', value: stats.overrides, color: '#c8953c' },
            { label: 'High Risk', value: stats.criticalHigh, color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center', padding: '5px 0' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 9, color: TEXT.tertiary }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        {showFilters && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              type="text"
              placeholder="Search events…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '5px 10px',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid rgba(255,255,255,0.08)`,
                borderRadius: 6,
                color: TEXT.primary,
                fontSize: 11,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {filterButtons.map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setFilter(btn.id as FilterType)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    border:
                      filter === btn.id
                        ? `1px solid ${accentColor}60`
                        : '1px solid rgba(255,255,255,0.06)',
                    background: filter === btn.id ? `${accentColor}18` : 'rgba(255,255,255,0.02)',
                    color: filter === btn.id ? accentColor : TEXT.secondary,
                    cursor: 'pointer',
                    fontSize: 10,
                    fontWeight: filter === btn.id ? 700 : 400,
                  }}
                >
                  {btn.label}
                </button>
              ))}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                {['all', 'critical', 'high', 'medium'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRiskFilter(r)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      border:
                        riskFilter === r
                          ? `1px solid ${RISK_COLORS[r] ?? accentColor}60`
                          : '1px solid rgba(255,255,255,0.06)',
                      background:
                        riskFilter === r
                          ? `${RISK_COLORS[r] ?? accentColor}18`
                          : 'rgba(255,255,255,0.02)',
                      color: riskFilter === r ? (RISK_COLORS[r] ?? accentColor) : TEXT.secondary,
                      cursor: 'pointer',
                      fontSize: 10,
                    }}
                  >
                    {r === 'all' ? 'All Risk' : r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Entry Detail */}
      {selectedEntry && (
        <div style={{ padding: '12px 16px', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
          <EntryDetail
            entry={selectedEntry}
            accentColor={accentColor}
            onClose={() => setSelectedEntry(null)}
          />
        </div>
      )}

      {/* Timeline */}
      <div style={{ padding: '14px 16px', overflowY: 'auto', maxHeight: 500 }}>
        {filtered.length === 0 ? (
          <div
            style={{ textAlign: 'center', padding: '24px 0', color: TEXT.tertiary, fontSize: 11 }}
          >
            No audit events match the current filters
          </div>
        ) : (
          filtered.map((entry, i) => (
            <AuditEntryRow
              key={entry.id}
              entry={entry}
              accentColor={accentColor}
              onClick={() => {
                setSelectedEntry((prev) => (prev?.id === entry.id ? null : entry));
                onEntryClick?.(entry);
              }}
              isLast={i === filtered.length - 1}
            />
          ))
        )}
      </div>

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
        <span>
          Showing {filtered.length} of {entries.length} events · Immutable append-only log
        </span>
        <span>🔒 Tamper-evident chain</span>
      </div>
    </div>
  );
}
