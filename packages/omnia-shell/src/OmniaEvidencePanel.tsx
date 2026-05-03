/**
 * OMNIA — Evidence Panel Component
 * Phase 13 — UX Normalization
 *
 * Renders an immutable evidence chain for any AI decision, policy action,
 * or agent operation. Shared across all SZL domain packs — each pack
 * surfaces domain-appropriate evidence without changing the panel shape.
 *
 * Composition: EvidencePanel → EvidenceEntry list → StatusChip
 */

import React from 'react';

export interface EvidenceEntry {
  id: string;
  label: string;
  type: 'signal' | 'derivation' | 'policy' | 'approval' | 'agent' | 'audit';
  value?: string | number;
  timestamp: string;
  author?: string;
  confidence?: number;
  domain?: string;
  traceUrl?: string;
}

export interface EvidencePanelProps {
  title?: string;
  entries: EvidenceEntry[];
  correlationId?: string;
  auditId?: string;
  className?: string;
}

const TYPE_STYLES: Record<EvidenceEntry['type'], { bg: string; label: string; dot: string }> = {
  signal: { bg: 'rgba(59,130,246,0.10)', label: 'Signal', dot: '#3b82f6' },
  derivation: { bg: 'rgba(139,122,200,0.10)', label: 'Derivation', dot: '#8b7ac8' },
  policy: { bg: 'rgba(249,115,22,0.10)', label: 'Policy', dot: '#f97316' },
  approval: { bg: 'rgba(34,197,94,0.10)', label: 'Approval', dot: '#22c55e' },
  agent: { bg: 'rgba(168,85,247,0.10)', label: 'Agent', dot: '#a855f7' },
  audit: { bg: 'rgba(107,114,128,0.10)', label: 'Audit', dot: '#6b7280' },
};

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return ts;
  }
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
      <div
        style={{
          flex: 1,
          height: 3,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', minWidth: 28, textAlign: 'right' }}>
        {pct}%
      </span>
    </div>
  );
}

function EvidenceEntryRow({ entry }: { entry: EvidenceEntry }) {
  const style = TYPE_STYLES[entry.type] ?? TYPE_STYLES.audit;
  return (
    <div
      style={{
        padding: '10px 14px',
        background: style.bg,
        borderRadius: 6,
        borderLeft: `2px solid ${style.dot}`,
        marginBottom: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: style.dot, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)', flex: 1 }}>{entry.label}</span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: style.dot,
            opacity: 0.8,
          }}
        >
          {style.label}
        </span>
      </div>

      {entry.value !== undefined && (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
          {String(entry.value)}
        </div>
      )}

      {entry.confidence !== undefined && <ConfidenceBar value={entry.confidence} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
        {entry.author && (
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{entry.author}</span>
        )}
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{formatTimestamp(entry.timestamp)}</span>
        {entry.domain && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.2)',
            }}
          >
            {entry.domain}
          </span>
        )}
        {entry.traceUrl && (
          <a
            href={entry.traceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 10, color: style.dot, marginLeft: 'auto', textDecoration: 'none', opacity: 0.7 }}
          >
            Trace →
          </a>
        )}
      </div>
    </div>
  );
}

export function OmniaEvidencePanel({ title = 'Evidence Chain', entries, correlationId, auditId, className }: EvidencePanelProps) {
  return (
    <div
      className={className}
      style={{
        background: 'rgba(6,11,18,0.85)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10,
        padding: 16,
        fontSize: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          {title}
        </span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{entries.length} entries</span>
      </div>

      {entries.length === 0 && (
        <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '20px 0', fontSize: 12 }}>
          No evidence entries
        </div>
      )}

      {entries.map((entry) => (
        <EvidenceEntryRow key={entry.id} entry={entry} />
      ))}

      {(correlationId ?? auditId) && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          {correlationId && (
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
              corr: {correlationId}
            </span>
          )}
          {auditId && (
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
              audit: {auditId}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
