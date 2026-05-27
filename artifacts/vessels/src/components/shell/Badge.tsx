import type { HTMLAttributes } from 'react';
import { cn } from '@szl-holdings/shared-ui/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'ok' | 'warn' | 'critical' | 'outline' | 'ghost';
  size?: 'sm' | 'md';
  mono?: boolean;
}

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  mono = false,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-medium rounded',
        mono && 'font-mono uppercase tracking-wider',
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5',
        variant === 'default' && 'bg-white/[0.04] text-[#a8a8a8] border border-white/[0.06]',
        variant === 'accent' && 'bg-[#c9b787]/10 text-[#c9b787] border border-[#c9b787]/22',
        variant === 'ok' && 'bg-[#5a8a6e]/12 text-[#7eb098] border border-[#5a8a6e]/22',
        variant === 'warn' && 'bg-[#c9b787]/10 text-[#d4c598] border border-[#c9b787]/22',
        variant === 'critical' && 'bg-[#b85450]/12 text-[#d18a86] border border-[#b85450]/22',
        variant === 'outline' && 'bg-transparent text-[#8a8a8a] border border-white/[0.10]',
        variant === 'ghost' && 'bg-transparent text-[#6e6e6e]',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
