import type * as React from 'react';
import { Skeleton } from './ui/skeleton';
import { cn } from './utils';

interface PageDataSkeletonProps {
  className?: string;
  rows?: number;
  showHeader?: boolean;
  showStats?: boolean;
  variant?: 'table' | 'cards' | 'list' | 'dashboard';
  accentColor?: string;
}

export function PageDataSkeleton({
  className,
  rows = 5,
  showHeader = true,
  showStats = false,
  variant = 'list',
  accentColor,
}: PageDataSkeletonProps) {
  const accentStyle = accentColor
    ? ({ '--skeleton-accent': accentColor } as React.CSSProperties)
    : undefined;

  return (
    <div className={cn('w-full space-y-4 animate-pulse', className)} style={accentStyle}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72 opacity-60" />
          </div>
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      )}

      {showStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 p-4 space-y-2">
              <Skeleton className="h-4 w-20 opacity-60" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))}
        </div>
      )}

      {variant === 'table' && (
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <div className="border-b border-border/50 px-4 py-3 flex items-center gap-4 bg-muted/20">
            {[35, 25, 20, 15].map((w, i) => (
              <Skeleton key={i} className="h-4" style={{ width: `${w}%` }} />
            ))}
          </div>
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="px-4 py-3 flex items-center gap-4 border-b border-border/30 last:border-0"
            >
              <Skeleton className="h-4" style={{ width: '35%' }} />
              <Skeleton className="h-4 opacity-70" style={{ width: '25%' }} />
              <Skeleton className="h-4 opacity-60" style={{ width: '20%' }} />
              <Skeleton className="h-4 opacity-50" style={{ width: '15%' }} />
            </div>
          ))}
        </div>
      )}

      {variant === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2 opacity-60" />
                </div>
              </div>
              <Skeleton className="h-3 w-full opacity-50" />
              <Skeleton className="h-3 w-5/6 opacity-40" />
            </div>
          ))}
        </div>
      )}

      {variant === 'list' && (
        <div className="space-y-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3 opacity-60" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full opacity-50" />
            </div>
          ))}
        </div>
      )}

      {variant === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/50 p-4 space-y-4">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-32 w-full opacity-60" />
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border/50 p-4 space-y-3">
            <Skeleton className="h-5 w-36" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded flex-shrink-0 opacity-60" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16 opacity-50" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface InlineDataSkeletonProps {
  rows?: number;
  className?: string;
}

export function InlineDataSkeleton({ rows = 3, className }: InlineDataSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === 0 ? 'w-full' : i === rows - 1 ? 'w-3/5' : 'w-4/5')}
        />
      ))}
    </div>
  );
}
