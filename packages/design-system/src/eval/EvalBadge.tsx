/**
 * EvalBadge — Open Evaluation Layer badge component.
 *
 * Renders a compact status badge for an evaluation result, surfacing its
 * verification state at a glance:
 *   verified   — cryptographic proof from a sandboxed eval run (green)
 *   community  — open PR, not yet merged (amber)
 *   leaderboard — published on the benchmark leaderboard (blue)
 *   source     — links to traces or paper; self-reported (slate)
 */

import { CheckCircle, ExternalLink, GitPullRequest, Trophy, Link } from 'lucide-react';
import { v } from '../tokens/vars.js';
import { cn } from '../utils.js';

export type EvalBadgeState = 'verified' | 'community' | 'leaderboard' | 'source';

export interface EvalBadgeProps {
  state: EvalBadgeState;
  /** Optional URL — opens in new tab when clicked */
  href?: string;
  /** Override the default label */
  label?: string;
  className?: string;
  compact?: boolean;
}

const STATE_CONFIG: Record<
  EvalBadgeState,
  {
    icon: typeof CheckCircle;
    label: string;
    colorVar: string;
    bgVar: string;
    borderVar: string;
    title: string;
  }
> = {
  verified: {
    icon: CheckCircle,
    label: 'Verified',
    colorVar: 'var(--gi-accent-green)',
    bgVar: 'rgba(34,197,94,0.10)',
    borderVar: 'rgba(34,197,94,0.30)',
    title: 'Cryptographically verified by a sandboxed eval re-run',
  },
  community: {
    icon: GitPullRequest,
    label: 'Community',
    colorVar: 'var(--gi-accent-amber)',
    bgVar: 'rgba(245,158,11,0.10)',
    borderVar: 'rgba(245,158,11,0.30)',
    title: 'Community submission — pending merge and re-run',
  },
  leaderboard: {
    icon: Trophy,
    label: 'Leaderboard',
    colorVar: 'var(--gi-accent-blue)',
    bgVar: 'rgba(59,130,246,0.10)',
    borderVar: 'rgba(59,130,246,0.30)',
    title: 'Published on the benchmark leaderboard',
  },
  source: {
    icon: Link,
    label: 'Source',
    colorVar: v.textSecondary,
    bgVar: v.bgOverlay,
    borderVar: v.borderDefault,
    title: 'Self-reported — links to traces or paper',
  },
};

export function EvalBadge({ state, href, label, className, compact = false }: EvalBadgeProps) {
  const cfg = STATE_CONFIG[state];
  const Icon = cfg.icon;
  const displayLabel = label ?? cfg.label;

  const inner = (
    <span
      title={cfg.title}
      style={{
        color: cfg.colorVar,
        backgroundColor: cfg.bgVar,
        borderColor: cfg.borderVar,
      }}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium select-none',
        href && 'cursor-pointer hover:opacity-80 transition-opacity',
        className,
      )}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {!compact && <span>{displayLabel}</span>}
      {href && !compact && <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-60" />}
    </span>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {inner}
      </a>
    );
  }

  return inner;
}
