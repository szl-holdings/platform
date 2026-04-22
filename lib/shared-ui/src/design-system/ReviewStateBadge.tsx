
import { colors } from '../tokens';
import { cn } from '../utils';

export type ReviewState = keyof typeof colors.reviewState;

export interface ReviewStateBadgeProps {
  state: ReviewState;
  showDot?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function ReviewStateBadge({
  state,
  showDot = true,
  size = 'sm',
  className,
}: ReviewStateBadgeProps) {
  const token = colors.reviewState[state];

  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5 gap-1',
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const dotSizes = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-1.5 h-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium whitespace-nowrap',
        sizeClasses[size],
        className,
      )}
      style={{
        background: token.bg,
        color: token.color,
        border: `1px solid ${token.border}`,
      }}
    >
      {showDot && (
        <span
          className={cn('rounded-full shrink-0', dotSizes[size])}
          style={{ background: token.color }}
        />
      )}
      <span>{token.label}</span>
    </span>
  );
}
