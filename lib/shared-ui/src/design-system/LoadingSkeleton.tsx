import type * as React from 'react';
import { cn } from '../utils';

export interface LoadingSkeletonProps {
  variant?: 'line' | 'block' | 'card' | 'avatar' | 'table' | 'page';
  lines?: number;
  rows?: number;
  columns?: number;
  className?: string;
  dark?: boolean;
  width?: string;
  height?: string;
}

interface BoneProps {
  className?: string;
  dark?: boolean;
  style?: React.CSSProperties;
}

function Bone({ className, dark, style }: BoneProps) {
  return (
    <div
      className={cn('rounded animate-pulse', dark ? 'bg-white/8' : 'bg-neutral-200', className)}
      style={style}
    />
  );
}

export function LoadingSkeleton({
  variant = 'line',
  lines = 3,
  rows = 5,
  columns = 4,
  className,
  dark = true,
  width,
  height,
}: LoadingSkeletonProps) {
  if (variant === 'line') {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <Bone key={i} dark={dark} className={cn('h-4', i === lines - 1 ? 'w-3/4' : 'w-full')} />
        ))}
      </div>
    );
  }

  if (variant === 'block') {
    return (
      <Bone
        dark={dark}
        {...(className !== undefined ? { className } : {})}
        style={{ width: width ?? '100%', height: height ?? '120px' } as React.CSSProperties}
      />
    );
  }

  if (variant === 'avatar') {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <Bone dark={dark} className="w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Bone dark={dark} className="h-4 w-1/3" />
          <Bone dark={dark} className="h-3 w-1/2" />
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'rounded-2xl border p-5 space-y-4',
          dark ? 'border-white/8 bg-white/3' : 'border-neutral-200 bg-white',
          className,
        )}
      >
        <div className="flex items-start justify-between">
          <Bone dark={dark} className="w-10 h-10 rounded-xl" />
          <Bone dark={dark} className="w-16 h-5 rounded-full" />
        </div>
        <div className="space-y-2">
          <Bone dark={dark} className="h-4 w-2/3" />
          <Bone dark={dark} className="h-3 w-full" />
          <Bone dark={dark} className="h-3 w-5/6" />
        </div>
        <Bone dark={dark} className="h-3 w-1/3" />
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={className}>
        <div
          className={cn(
            'border-b px-4 py-3 grid gap-4',
            dark ? 'border-white/8' : 'border-neutral-200',
          )}
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <Bone key={i} dark={dark} className="h-3 w-2/3" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, ri) => (
          <div
            key={ri}
            className={cn(
              'border-b px-4 py-3 grid gap-4',
              dark ? 'border-white/5' : 'border-neutral-100',
            )}
            style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          >
            {Array.from({ length: columns }).map((_, ci) => (
              <Bone
                key={ci}
                dark={dark}
                className="h-4"
                style={
                  {
                    width: ci === 0 ? '80%' : ci === columns - 1 ? '50%' : '90%',
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'page') {
    return (
      <div className={cn('space-y-6 p-6', className)}>
        <div className="space-y-2">
          <Bone dark={dark} className="h-8 w-1/2" />
          <Bone dark={dark} className="h-4 w-1/3" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Bone key={i} dark={dark} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Bone key={i} dark={dark} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return null;
}
