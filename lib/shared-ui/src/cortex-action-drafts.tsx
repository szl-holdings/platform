import React, { useState } from 'react';
import { cn } from './utils';

export type ActionDraftType =
  | 'legal_hold'
  | 'lp_notification'
  | 'insurance_claim'
  | 'route_change'
  | 'compliance_memo'
  | 'incident_report'
  | 'risk_brief';

export type ActionDraftStatus = 'pending' | 'approved' | 'dismissed';
export type ActionDraftPriority = 'urgent' | 'high' | 'normal';

export interface ActionDraft {
  id: string;
  alertId: string;
  alertTitle: string;
  domain: string;
  type: ActionDraftType;
  title: string;
  content: string;
  recipient?: string;
  priority: ActionDraftPriority;
  status: ActionDraftStatus;
  generatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface APEXActionDraftsProps {
  drafts?: ActionDraft[];
  pendingCount?: number;
  accentColor?: string;
  className?: string;
  onApprove?: (draftId: string) => Promise<void> | void;
  onDismiss?: (draftId: string) => Promise<void> | void;
  loading?: boolean;
}

const DRAFT_TYPE_META: Record<ActionDraftType, { label: string; icon: string; color: string }> = {
  legal_hold: { label: 'Legal Hold', icon: '⚖', color: '#a855f7' },
  lp_notification: { label: 'LP Notification', icon: '◆', color: '#c9a84c' },
  insurance_claim: { label: 'Insurance Claim', icon: '⛊', color: '#0ea5e9' },
  route_change: { label: 'Route Advisory', icon: '⚓', color: '#0ea5e9' },
  compliance_memo: { label: 'Compliance Memo', icon: '◈', color: '#8b5cf6' },
  incident_report: { label: 'Incident Report', icon: '⬡', color: '#ef4444' },
  risk_brief: { label: 'Risk Brief', icon: '⚠', color: '#f97316' },
};

const PRIORITY_CONFIG: Record<ActionDraftPriority, { color: string; label: string }> = {
  urgent: { color: '#ef4444', label: 'URGENT' },
  high: { color: '#f97316', label: 'HIGH' },
  normal: { color: '#6b7280', label: 'NORMAL' },
};

const DOMAIN_META: Record<string, { label: string; icon: string; color: string }> = {
  vessels: { label: 'SEXTANT', icon: '⚓', color: '#0ea5e9' },
  firestorm: { label: 'PARAGON', icon: '⬡', color: '#ef4444' },
  terra: { label: 'DOMAINE', icon: '⬢', color: '#22c55e' },
  lyte: { label: 'KORA', icon: '⚡', color: '#f59e0b' },
  prism: { label: 'PRISM', icon: '⚖', color: '#a855f7' },
  szl: { label: 'Portfolio', icon: '◆', color: '#c9a84c' },
};

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

function DraftCard({
  draft,
  onApprove,
  onDismiss,
  expanded,
  onToggle,
}: {
  draft: ActionDraft;
  onApprove?: (id: string) => Promise<void> | void;
  onDismiss?: (id: string) => Promise<void> | void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [approving, setApproving] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const typeMeta = DRAFT_TYPE_META[draft.type] ?? {
    label: draft.type,
    icon: '◆',
    color: '#6b7280',
  };
  const priority = PRIORITY_CONFIG[draft.priority];
  const domainMeta = DOMAIN_META[draft.domain] ?? {
    label: draft.domain,
    icon: '◆',
    color: '#6b7280',
  };

  const handleApprove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setApproving(true);
    try {
      await onApprove?.(draft.id);
    } finally {
      setApproving(false);
    }
  };

  const handleDismiss = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissing(true);
    try {
      await onDismiss?.(draft.id);
    } finally {
      setDismissing(false);
    }
  };

  const statusColor =
    draft.status === 'approved'
      ? '#22c55e'
      : draft.status === 'dismissed'
        ? '#6b7280'
        : priority.color;

  return (
    <div
      style={{
        background: draft.status === 'pending' ? '#ffffff06' : '#ffffff03',
        border: `1px solid ${draft.status === 'pending' ? '#ffffff15' : '#ffffff0a'}`,
        borderLeft: `3px solid ${statusColor}`,
        borderRadius: 8,
        overflow: 'hidden',
        opacity: draft.status !== 'pending' ? 0.6 : 1,
      }}
    >
      <div style={{ padding: '10px 14px', cursor: 'pointer' }} onClick={onToggle}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: `${typeMeta.color}18`,
              border: `1px solid ${typeMeta.color}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            {typeMeta.icon}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 2,
                flexWrap: 'wrap' as const,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: priority.color,
                  fontFamily: 'monospace',
                  letterSpacing: '0.08em',
                }}
              >
                {priority.label}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: typeMeta.color,
                  background: `${typeMeta.color}15`,
                  border: `1px solid ${typeMeta.color}30`,
                  borderRadius: 3,
                  padding: '1px 5px',
                  letterSpacing: '0.04em',
                }}
              >
                {typeMeta.label}
              </span>
              {draft.status !== 'pending' && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: draft.status === 'approved' ? '#22c55e' : '#6b7280',
                    background: draft.status === 'approved' ? '#22c55e15' : '#6b728015',
                    border: `1px solid ${draft.status === 'approved' ? '#22c55e30' : '#6b728030'}`,
                    borderRadius: 3,
                    padding: '1px 5px',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase' as const,
                  }}
                >
                  {draft.status}
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
                marginBottom: 3,
              }}
            >
              {draft.title}
            </p>

            <div
              style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 10,
                  color: domainMeta.color,
                  fontWeight: 600,
                }}
              >
                {domainMeta.icon} {domainMeta.label}
              </span>
              {draft.recipient && (
                <span style={{ fontSize: 10, color: '#ffffff50' }}>→ {draft.recipient}</span>
              )}
              <span style={{ fontSize: 10, color: '#ffffff40' }}>
                {formatRelativeTime(draft.generatedAt)}
              </span>
            </div>
          </div>

          <span style={{ fontSize: 14, color: '#ffffff40', flexShrink: 0 }}>
            {expanded ? '▾' : '▸'}
          </span>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid #ffffff10' }}>
          <div style={{ padding: '10px 14px' }}>
            <p
              style={{
                margin: '0 0 10px',
                fontSize: 11,
                fontWeight: 600,
                color: '#ffffff50',
                letterSpacing: '0.06em',
                textTransform: 'uppercase' as const,
              }}
            >
              Draft Content — AI Generated · Requires Human Review
            </p>
            <pre
              style={{
                margin: 0,
                fontFamily: 'monospace',
                fontSize: 12,
                color: '#ffffffcc',
                lineHeight: 1.7,
                background: '#000000',
                border: '1px solid #ffffff10',
                borderRadius: 6,
                padding: '12px',
                whiteSpace: 'pre-wrap' as const,
                wordBreak: 'break-word' as const,
                maxHeight: 240,
                overflowY: 'auto' as const,
              }}
            >
              {draft.content}
            </pre>
          </div>

          {draft.status === 'pending' && (
            <div
              style={{
                padding: '8px 14px 12px',
                display: 'flex',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <button
                onClick={handleApprove}
                disabled={approving}
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '7px 16px',
                  borderRadius: 6,
                  background: '#22c55e',
                  border: 'none',
                  color: '#000000',
                  cursor: approving ? 'wait' : 'pointer',
                  letterSpacing: '0.04em',
                  opacity: approving ? 0.7 : 1,
                }}
              >
                {approving ? 'Approving…' : 'Approve & Queue'}
              </button>
              <button
                onClick={handleDismiss}
                disabled={dismissing}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '7px 16px',
                  borderRadius: 6,
                  background: '#ffffff08',
                  border: '1px solid #ffffff20',
                  color: '#ffffff70',
                  cursor: dismissing ? 'wait' : 'pointer',
                  opacity: dismissing ? 0.7 : 1,
                }}
              >
                {dismissing ? 'Dismissing…' : 'Dismiss'}
              </button>
              <span style={{ fontSize: 11, color: '#ffffff30', marginLeft: 4 }}>
                Human approval required before execution
              </span>
            </div>
          )}

          {draft.status === 'approved' && draft.approvedAt && (
            <div style={{ padding: '0 14px 12px', fontSize: 11, color: '#22c55e80' }}>
              Approved {formatRelativeTime(draft.approvedAt)}
              {draft.approvedBy ? ` by ${draft.approvedBy}` : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function APEXActionDrafts({
  drafts = [],
  pendingCount,
  accentColor = '#c9a84c',
  className,
  onApprove,
  onDismiss,
  loading,
}: APEXActionDraftsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'dismissed'>(
    'pending',
  );

  const filtered = drafts.filter((d) => statusFilter === 'all' || d.status === statusFilter);
  const pending = drafts.filter((d) => d.status === 'pending');
  const approved = drafts.filter((d) => d.status === 'approved');

  return (
    <div className={cn(className)} style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          {(['pending', 'approved', 'dismissed', 'all'] as const).map((s) => {
            const count = s === 'all' ? drafts.length : drafts.filter((d) => d.status === s).length;
            const active = statusFilter === s;
            const color = s === 'pending' ? accentColor : s === 'approved' ? '#22c55e' : '#6b7280';
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: 5,
                  border: `1px solid ${active ? color : '#ffffff20'}`,
                  background: active ? `${color}20` : 'transparent',
                  color: active ? color : '#ffffff50',
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  textTransform: 'capitalize' as const,
                }}
              >
                {s} {count > 0 && <span>({count})</span>}
              </button>
            );
          })}
        </div>

        {(pendingCount !== undefined ? pendingCount : pending.length) > 0 && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#ef4444',
              background: '#ef444415',
              border: '1px solid #ef444440',
              borderRadius: 5,
              padding: '3px 9px',
              letterSpacing: '0.06em',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            {pendingCount ?? pending.length} AWAITING APPROVAL
          </div>
        )}
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
          <p style={{ margin: 0, fontSize: 13, color: '#ffffff40' }}>Loading action drafts…</p>
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
            {statusFilter === 'pending'
              ? 'No action drafts awaiting approval'
              : `No ${statusFilter} drafts`}
          </p>
          {statusFilter === 'pending' && approved.length === 0 && (
            <p style={{ margin: '4px 0 0', fontSize: 11, color: '#ffffff30' }}>
              Generate drafts from the Intelligence Feed when APEX detects a correlation
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
          {filtered.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              expanded={expandedId === draft.id}
              onToggle={() => setExpandedId((prev) => (prev === draft.id ? null : draft.id))}
              {...(onApprove !== undefined ? { onApprove } : {})}
              {...(onDismiss !== undefined ? { onDismiss } : {})}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>
    </div>
  );
}
