import React from 'react';
import { color } from '../tokens/index.js';
import { cn } from '../utils.js';

interface SkeletonBaseProps {
  className?: string;
  style?: React.CSSProperties;
}

function Skeleton({ className, style }: SkeletonBaseProps) {
  return (
    <>
      <style>{`@keyframes gi-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
      <div
        className={cn('rounded', className)}
        style={{
          background: `linear-gradient(90deg, ${color.bg.raised} 25%, ${color.bg.hover} 50%, ${color.bg.raised} 75%)`,
          backgroundSize: '200% 100%',
          animation: 'gi-shimmer 1.8s ease-in-out infinite',
          ...style,
        }}
        aria-hidden="true"
      />
    </>
  );
}

export interface SkeletonTextProps extends SkeletonBaseProps {
  lines?: number;
  lastLineWidth?: string;
}

export function SkeletonText({ lines = 2, lastLineWidth = '60%', className }: SkeletonTextProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)} aria-label="Loading content">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          style={{
            height: '13px',
            width: i === lines - 1 ? lastLineWidth : '100%',
          }}
        />
      ))}
    </div>
  );
}

export interface SkeletonCardProps extends SkeletonBaseProps {
  lines?: number;
}

export function SkeletonCard({ lines = 3, className }: SkeletonCardProps) {
  return (
    <div
      className={cn('flex flex-col gap-3 p-4 rounded-lg border', className)}
      style={{ background: color.bg.surface, borderColor: color.border.subtle }}
      aria-label="Loading card"
    >
      <Skeleton style={{ height: '14px', width: '40%' }} />
      <SkeletonText lines={lines} />
    </div>
  );
}

export interface SkeletonKPIProps extends SkeletonBaseProps {
  columns?: number;
}

export function SkeletonKPI({ columns = 4, className }: SkeletonKPIProps) {
  return (
    <div
      className={cn('grid gap-3', className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      aria-label="Loading KPI metrics"
    >
      {Array.from({ length: columns }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 p-4 rounded-lg border"
          style={{ background: color.bg.surface, borderColor: color.border.subtle }}
        >
          <Skeleton style={{ height: '11px', width: '55%' }} />
          <Skeleton style={{ height: '26px', width: '70%' }} />
          <Skeleton style={{ height: '10px', width: '40%' }} />
        </div>
      ))}
    </div>
  );
}

const CELL_WIDTHS = ['80%', '65%', '75%', '70%', '85%'];

export interface SkeletonTableProps extends SkeletonBaseProps {
  rows?: number;
  cols?: number;
}

export function SkeletonTable({ rows = 5, cols = 4, className }: SkeletonTableProps) {
  return (
    <div
      className={cn('rounded-lg border overflow-hidden', className)}
      style={{ borderColor: color.border.subtle }}
      aria-label="Loading table"
    >
      <div
        className="flex gap-4 px-3 border-b"
        style={{ height: '36px', background: color.bg.surface, borderColor: color.border.subtle, alignItems: 'center' }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} style={{ height: '10px', flex: i === 0 ? 2 : 1 }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex gap-4 px-3 border-b last:border-0"
          style={{ height: '40px', background: r % 2 === 0 ? color.bg.base : color.bg.surface, borderColor: color.border.subtle, alignItems: 'center' }}
        >
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} style={{ height: '12px', flex: i === 0 ? 2 : 1, width: CELL_WIDTHS[(r * cols + i) % CELL_WIDTHS.length] }} />
          ))}
        </div>
      ))}
    </div>
  );
}
