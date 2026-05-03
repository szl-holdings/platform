/**
 * OMNIA — Timeline / Audit Component
 * Phase 13 — UX Normalization
 *
 * A vertically stacked audit timeline showing the ordered history of
 * any governed action — agent runs, policy decisions, approvals, deployments.
 *
 * Shared across all SZL domain packs. The timeline is domain-agnostic;
 * each pack supplies its own events.
 */

import React from 'react';

export type TimelineEventSeverity = 'info' | 'success' | 'warning' | 'critical';

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  actor?: string;
  severity?: TimelineEventSeverity;
  tags?: string[];
  traceUrl?: string;
  isLast?: boolean;
}

export interface OmniaTimelineProps {
  events: TimelineEvent[];
  title?: string;
  maxEvents?: number;
  className?: string;
}

const SEVERITY_COLORS: Record<TimelineEventSeverity, string> = {
  info: '#3b82f6',
  success: '#22c55e',
  warning: '#f59e0b',
  critical: '#ef4444',
};

function formatRelativeTime(ts: string): string {
  try {
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 60_000) return 'just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return ts;
  }
}

function TimelineEventItem({ event, isLast }: { event: TimelineEvent; isLast?: boolean }) {
  const severity = event.severity ?? 'info';
  const color = SEVERITY_COLORS[severity];

  return (
    <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
      {/* Vertical connector */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
            flexShrink: 0,
            boxShadow: `0 0 0 3px rgba(6,11,18,1), 0 0 0 4px ${color}33`,
            marginTop: 5,
          }}
        />
        {!isLast && (
          <div
            style={{
              width: 1,
              flex: 1,
              background: 'rgba(255,255,255,0.07)',
              marginTop: 4,
              minHeight: 24,
            }}
          />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.3 }}>
            {event.title}
          </span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', flexShrink: 0, marginTop: 1 }}>
            {formatRelativeTime(event.timestamp)}
          </span>
        </div>

        {event.description && (
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: '4px 0 0', lineHeight: 1.5 }}>
            {event.description}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
          {event.actor && (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{event.actor}</span>
          )}
          {event.tags?.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '1px 6px',
                borderRadius: 3,
                background: 'rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.35)',
              }}
            >
              {tag}
            </span>
          ))}
          {event.traceUrl && (
            <a
              href={event.traceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 10, color, marginLeft: 'auto', textDecoration: 'none', opacity: 0.7 }}
            >
              Trace →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function OmniaTimeline({ events, title = 'Audit Timeline', maxEvents, className }: OmniaTimelineProps) {
  const displayed = maxEvents ? events.slice(0, maxEvents) : events;
  const truncated = maxEvents && events.length > maxEvents ? events.length - maxEvents : 0;

  return (
    <div
      className={className}
      style={{
        background: 'rgba(6,11,18,0.85)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10,
        padding: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
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
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{events.length} events</span>
      </div>

      {displayed.length === 0 && (
        <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '16px 0', fontSize: 12 }}>
          No events recorded
        </div>
      )}

      {displayed.map((event, i) => (
        <TimelineEventItem key={event.id} event={event} isLast={i === displayed.length - 1 && truncated === 0} />
      ))}

      {truncated > 0 && (
        <div style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>
          +{truncated} older events
        </div>
      )}
    </div>
  );
}
