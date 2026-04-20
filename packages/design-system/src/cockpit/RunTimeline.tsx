import { color } from '../tokens/index.js';
import { cn } from '../utils.js';

export type RunSpanStatus = 'ok' | 'blocked' | 'error' | 'pending' | 'skipped';

export interface RunSpan {
  spanId: string;
  name: string;
  kind: 'agent' | 'tool' | 'model' | 'policy' | 'approval' | 'retrieval' | 'handoff';
  status: RunSpanStatus;
  latencyMs: number;
  startOffsetMs: number;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  costUsd?: number;
  meta?: Record<string, string | number | boolean>;
}

export interface RunTimelineProps {
  spans: RunSpan[];
  totalMs?: number;
  className?: string;
  onSpanClick?: (span: RunSpan) => void;
  selectedSpanId?: string;
}

const KIND_COLORS: Record<RunSpan['kind'], string> = {
  agent: color.accent.violet,
  tool: color.accent.blue,
  model: color.accent.green,
  policy: color.accent.amber,
  approval: color.accent.violet,
  retrieval: color.accent.teal,
  handoff: color.accent.red,
};

const STATUS_ALPHA: Record<RunSpanStatus, number> = {
  ok: 0.8,
  blocked: 0.9,
  error: 0.9,
  pending: 0.4,
  skipped: 0.25,
};

const STATUS_OVERRIDE: Partial<Record<RunSpanStatus, string>> = {
  blocked: color.accent.red,
  error: color.accent.red,
  skipped: color.text.muted,
};

function fmtMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

function fmtKind(kind: RunSpan['kind']): string {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

export function RunTimeline({
  spans,
  totalMs,
  className,
  onSpanClick,
  selectedSpanId,
}: RunTimelineProps) {
  const maxMs = totalMs ?? Math.max(1, ...spans.map((s) => s.startOffsetMs + s.latencyMs));

  if (spans.length === 0) {
    return (
      <div
        className={cn('rounded-lg px-4 py-6 text-center text-xs', className)}
        style={{
          border: `1px solid ${color.border.default}`,
          background: color.bg.surface,
          color: color.text.muted,
        }}
      >
        No spans recorded
      </div>
    );
  }

  return (
    <div
      className={cn('rounded-lg overflow-hidden', className)}
      style={{ border: `1px solid ${color.border.default}`, background: color.bg.surface }}
    >
      <div className="grid gap-0" style={{ gridTemplateColumns: '130px 1fr 64px 72px' }}>
        {['Span', 'Waterfall', 'Latency', 'Kind'].map((h) => (
          <div
            key={h}
            className="px-3 py-2 text-xs font-bold uppercase tracking-widest"
            style={{ color: color.text.muted, borderBottom: `1px solid ${color.border.subtle}` }}
          >
            {h}
          </div>
        ))}
      </div>

      <ol>
        {spans.map((span) => {
          const baseColor = STATUS_OVERRIDE[span.status] ?? KIND_COLORS[span.kind];
          const alpha = STATUS_ALPHA[span.status];
          const left = (span.startOffsetMs / maxMs) * 100;
          const width = Math.max(2, (span.latencyMs / maxMs) * 100);
          const isSelected = span.spanId === selectedSpanId;

          return (
            <li
              key={span.spanId}
              className={cn('grid transition-colors', onSpanClick && 'cursor-pointer')}
              style={{
                gridTemplateColumns: '130px 1fr 64px 72px',
                borderBottom: `1px solid ${color.border.subtle}`,
                background: isSelected ? color.bg.overlay : 'transparent',
              }}
              onClick={() => onSpanClick?.(span)}
              onMouseEnter={(e) => {
                if (!isSelected)
                  (e.currentTarget as HTMLElement).style.background = color.bg.overlay;
              }}
              onMouseLeave={(e) => {
                if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              <div className="flex items-center px-3 py-2 min-w-0">
                <span
                  className="truncate text-xs font-medium"
                  style={{ color: isSelected ? baseColor : color.text.primary }}
                  title={span.name}
                >
                  {span.name}
                </span>
              </div>

              <div className="flex items-center px-2 py-2">
                <div
                  className="relative w-full h-4 rounded overflow-hidden"
                  style={{ background: color.bg.base }}
                >
                  <div
                    className="absolute top-0 bottom-0 rounded transition-all"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      backgroundColor: baseColor,
                      opacity: alpha,
                    }}
                  />
                  {span.model && (
                    <span
                      className="absolute left-1 top-0 bottom-0 flex items-center text-xs truncate font-mono"
                      style={{ color: color.text.muted, maxWidth: '80%' }}
                    >
                      {span.model}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end px-3 py-2">
                <span className="text-xs font-mono tabular-nums" style={{ color: baseColor }}>
                  {fmtMs(span.latencyMs)}
                </span>
              </div>

              <div className="flex items-center px-2 py-2">
                <span
                  className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider"
                  style={{
                    color: baseColor,
                    background: color.bg.overlay,
                    border: `1px solid ${color.border.default}`,
                  }}
                >
                  {fmtKind(span.kind)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderTop: `1px solid ${color.border.subtle}` }}
      >
        <span className="text-xs" style={{ color: color.text.muted }}>
          {spans.length} span{spans.length !== 1 ? 's' : ''}
        </span>
        <span className="text-xs font-mono" style={{ color: color.text.secondary }}>
          total {fmtMs(maxMs)}
        </span>
      </div>
    </div>
  );
}
