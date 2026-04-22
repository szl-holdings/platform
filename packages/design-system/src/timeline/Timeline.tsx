
import { color } from '../tokens/index.js';
import { cn } from '../utils.js';

export type TimelineEventStatus =
  | 'complete'
  | 'running'
  | 'pending'
  | 'failed'
  | 'skipped'
  | 'approval-required'
  | 'approved'
  | 'rejected';

export interface TimelineEvent {
  id: string;
  label: string;
  description?: string;
  status: TimelineEventStatus;
  timestamp?: string;
  duration?: string;
  metadata?: Record<string, string | number>;
  traceId?: string;
  actor?: string;
}

export interface TimelineProps {
  events: TimelineEvent[];
  onEventClick?: (event: TimelineEvent) => void;
  className?: string;
}

const STATUS_COLORS: Record<TimelineEventStatus, { dot: string; label: string }> = {
  complete: { dot: color.accent.green, label: color.accent.green },
  running: { dot: color.accent.blue, label: color.accent.blue },
  pending: { dot: color.border.default, label: color.text.muted },
  failed: { dot: color.accent.red, label: color.accent.red },
  skipped: { dot: color.border.default, label: color.text.muted },
  'approval-required': { dot: color.accent.amber, label: color.accent.amber },
  approved: { dot: color.accent.green, label: color.accent.green },
  rejected: { dot: color.accent.red, label: color.accent.red },
};

export function Timeline({ events, onEventClick, className }: TimelineProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      {events.map((event, idx) => {
        const cfg = STATUS_COLORS[event.status];
        const isLast = idx === events.length - 1;
        return (
          <div key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center" style={{ width: '20px' }}>
              <div
                className="rounded-full flex-shrink-0 mt-1"
                style={{
                  width: '10px',
                  height: '10px',
                  background: cfg.dot,
                  border: `2px solid ${color.bg.surface}`,
                  boxSizing: 'content-box' as const,
                }}
              />
              {!isLast && (
                <div
                  className="flex-1 w-px mt-1"
                  style={{ background: color.border.subtle, minHeight: '20px' }}
                />
              )}
            </div>

            <button
              type="button"
              className="flex-1 text-left pb-4"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: onEventClick ? 'pointer' : 'default',
                padding: 0,
              }}
              onClick={() => onEventClick?.(event)}
              disabled={!onEventClick}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium" style={{ color: color.text.primary }}>
                    {event.label}
                  </span>
                  {event.description && (
                    <span className="text-xs" style={{ color: color.text.secondary }}>
                      {event.description}
                    </span>
                  )}
                  {event.traceId && (
                    <span className="text-xs font-mono" style={{ color: color.text.muted }}>
                      {event.traceId}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs font-medium" style={{ color: cfg.label }}>
                    {event.status.replace(/-/g, ' ')}
                  </span>
                  {event.timestamp && (
                    <span className="text-xs" style={{ color: color.text.muted }}>
                      {event.timestamp}
                    </span>
                  )}
                  {event.duration && (
                    <span className="text-xs" style={{ color: color.text.muted }}>
                      {event.duration}
                    </span>
                  )}
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
