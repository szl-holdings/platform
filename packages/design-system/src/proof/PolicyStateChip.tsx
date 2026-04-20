import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { v } from '../tokens/vars.js';
import { cn } from '../utils';

export type PolicyState = 'allowed' | 'requires-approval' | 'blocked';

export interface PolicyStateChipProps {
  state: PolicyState;
  reason?: string;
  className?: string;
  variant?: 'compact' | 'full';
}

const stateColor: Record<PolicyState, string> = {
  allowed: v.accentGreen,
  'requires-approval': v.accentAmber,
  blocked: v.accentRed,
};

const stateLabel: Record<PolicyState, string> = {
  allowed: 'Allowed',
  'requires-approval': 'Requires Approval',
  blocked: 'Blocked',
};

const stateIcon: Record<PolicyState, React.ReactNode> = {
  allowed: <CheckCircle2 className="h-3 w-3" />,
  'requires-approval': <Clock className="h-3 w-3" />,
  blocked: <XCircle className="h-3 w-3" />,
};

export function PolicyStateChip({
  state,
  reason,
  className,
  variant = 'compact',
}: PolicyStateChipProps) {
  const color = stateColor[state];

  return (
    <span
      title={reason}
      style={{ color, borderColor: color }}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium bg-black/5',
        className,
      )}
    >
      {stateIcon[state]}
      {stateLabel[state]}
      {variant === 'full' && reason && (
        <span className="ml-1 rounded bg-black/20 px-1 text-[10px] opacity-70">{reason}</span>
      )}
    </span>
  );
}
