import { Clock } from 'lucide-react';
import { v } from '../tokens/vars.js';
import { cn } from '../utils';

export type FreshnessLevel = 'fresh' | 'aging' | 'stale' | 'unknown';

export interface FreshnessChipProps {
  timestamp: string | Date | null | undefined;
  level?: FreshnessLevel;
  className?: string;
  showAbsolute?: boolean;
}

function computeLevel(ts: string | Date | null | undefined): FreshnessLevel {
  if (!ts) return 'unknown';
  const d = typeof ts === 'string' ? new Date(ts) : ts;
  if (isNaN(d.getTime())) return 'unknown';
  const ageMs = Date.now() - d.getTime();
  const ageH = ageMs / 3_600_000;
  if (ageH < 1) return 'fresh';
  if (ageH < 24) return 'aging';
  return 'stale';
}

function relativeLabel(ts: string | Date | null | undefined): string {
  if (!ts) return 'unknown';
  const d = typeof ts === 'string' ? new Date(ts) : ts;
  if (isNaN(d.getTime())) return 'unknown';
  const ms = Date.now() - d.getTime();
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const day = Math.round(h / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.round(day / 30);
  return `${mo}mo ago`;
}

const levelColor: Record<FreshnessLevel, string> = {
  fresh: v.accentGreen,
  aging: v.accentAmber,
  stale: v.accentRed,
  unknown: v.textMuted,
};

const levelBorder: Record<FreshnessLevel, string> = {
  fresh: v.accentGreen,
  aging: v.accentAmber,
  stale: v.accentRed,
  unknown: v.borderDefault,
};

export function FreshnessChip({ timestamp, level, className, showAbsolute }: FreshnessChipProps) {
  const resolved = level ?? computeLevel(timestamp);
  const label = relativeLabel(timestamp);
  const absLabel = timestamp ? new Date(timestamp).toLocaleString() : undefined;

  return (
    <span
      title={showAbsolute && absLabel ? absLabel : undefined}
      style={{ color: levelColor[resolved], borderColor: levelBorder[resolved] }}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium bg-black/5',
        className,
      )}
    >
      <Clock className="h-2.5 w-2.5 shrink-0" />
      {label}
    </span>
  );
}
