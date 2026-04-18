import { cn } from "../utils";

export type RunSpanStatus = "ok" | "blocked" | "error" | "pending" | "skipped";

export interface RunSpan {
  spanId: string;
  name: string;
  kind: "agent" | "tool" | "model" | "policy" | "approval" | "retrieval" | "handoff";
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

const KIND_COLORS: Record<RunSpan["kind"], string> = {
  agent:     "#8b7ac8",
  tool:      "#0ea5e9",
  model:     "#22c55e",
  policy:    "#f59e0b",
  approval:  "#a855f7",
  retrieval: "#06b6d4",
  handoff:   "#ef4444",
};

const STATUS_ALPHA: Record<RunSpanStatus, number> = {
  ok:      0.8,
  blocked: 0.9,
  error:   0.9,
  pending: 0.4,
  skipped: 0.25,
};

const STATUS_OVERRIDE: Partial<Record<RunSpanStatus, string>> = {
  blocked: "#ef4444",
  error:   "#ef4444",
  skipped: "#475569",
};

function fmtMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

function fmtKind(kind: RunSpan["kind"]): string {
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
        className={cn(
          "rounded-lg border border-[#243040] bg-[#0d1520] px-4 py-6 text-center text-[12px] text-[#4a6070]",
          className
        )}
      >
        No spans recorded
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-[#243040] bg-[#0d1520] overflow-hidden",
        className
      )}
    >
      <div className="grid gap-0" style={{ gridTemplateColumns: "130px 1fr 64px 72px" }}>
        {["Span", "Waterfall", "Latency", "Kind"].map((h) => (
          <div
            key={h}
            className="px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-[#334155] border-b border-[#1a2535]"
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
              className={cn(
                "grid border-b border-[#1a2535] last:border-b-0 transition-colors",
                onSpanClick && "cursor-pointer hover:bg-[#111d2c]",
                isSelected && "bg-[#111d2c]"
              )}
              style={{ gridTemplateColumns: "130px 1fr 64px 72px" }}
              onClick={() => onSpanClick?.(span)}
            >
              <div className="flex items-center px-3 py-2 min-w-0">
                <span
                  className="truncate text-[11px] font-medium"
                  style={{ color: isSelected ? baseColor : "rgba(255,255,255,0.7)" }}
                  title={span.name}
                >
                  {span.name}
                </span>
              </div>

              <div className="flex items-center px-2 py-2">
                <div className="relative w-full h-4 rounded bg-[#0a1118] overflow-hidden">
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
                      className="absolute left-1 top-0 bottom-0 flex items-center text-[9px] truncate font-mono"
                      style={{ color: "rgba(255,255,255,0.5)", maxWidth: "80%" }}
                    >
                      {span.model}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end px-3 py-2">
                <span
                  className="text-[11px] font-mono tabular-nums"
                  style={{ color: baseColor }}
                >
                  {fmtMs(span.latencyMs)}
                </span>
              </div>

              <div className="flex items-center px-2 py-2">
                <span
                  className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                  style={{
                    color: baseColor,
                    background: `${baseColor}15`,
                    border: `1px solid ${baseColor}30`,
                  }}
                >
                  {fmtKind(span.kind)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex items-center justify-between border-t border-[#1a2535] px-3 py-2">
        <span className="text-[10px] text-[#334155]">{spans.length} span{spans.length !== 1 ? "s" : ""}</span>
        <span className="text-[10px] font-mono text-[#475569]">total {fmtMs(maxMs)}</span>
      </div>
    </div>
  );
}
