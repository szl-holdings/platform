import { STATUS_STYLES, type VentureStatus } from '@/data/ventures';
import { cn } from '@/lib/utils';

interface StatusTagProps {
  status: VentureStatus;
  pulse?: boolean;
  size?: 'sm' | 'md';
}

export function StatusTag({ status, pulse = false, size = 'md' }: StatusTagProps) {
  const styles = STATUS_STYLES[status];
  const isLive = status === 'Live';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold tracking-wide border rounded-full',
        styles.bg,
        styles.text,
        styles.border,
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
      )}
    >
      <span className="relative flex items-center">
        {isLive && pulse ? (
          <>
            <span
              className={cn(
                'animate-ping absolute inline-flex h-full w-full rounded-full opacity-50',
                styles.dot,
              )}
            />
            <span
              className={cn(
                'relative inline-flex rounded-full',
                styles.dot,
                size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2',
              )}
            />
          </>
        ) : (
          <span
            className={cn('rounded-full', styles.dot, size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2')}
          />
        )}
      </span>
      {status}
    </span>
  );
}
