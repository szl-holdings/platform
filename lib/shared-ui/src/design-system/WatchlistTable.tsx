import type * as React from 'react';
import { colors, effects } from '../tokens';
import { cn } from '../utils';

export interface WatchlistColumn<T> {
  key: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  width?: string;
  align?: 'left' | 'right' | 'center';
  className?: string;
  headerClassName?: string;
}

export interface WatchlistTableProps<T extends Record<string, unknown>> {
  columns: WatchlistColumn<T>[];
  data: T[];
  keyField: keyof T;
  caption?: string;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  onRowClick?: (row: T) => void;
  selectedKey?: string | number;
  accentColor?: string;
  className?: string;
  compact?: boolean;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  stickyHeader?: boolean;
}

function TableSkeleton({ columns, rows }: { columns: number; rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri} style={{ borderBottom: `1px solid ${colors.border.subtle}` }}>
          {Array.from({ length: columns }).map((_, ci) => (
            <td key={ci} className="px-4 py-3">
              <div
                className="h-4 rounded animate-pulse"
                style={{
                  width: ci === 0 ? '72%' : ci === columns - 1 ? '48%' : '88%',
                  background: colors.surface.glass,
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function WatchlistTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  caption,
  loading = false,
  emptyMessage = 'No items to display',
  emptyIcon,
  onRowClick,
  selectedKey,
  accentColor,
  className,
  compact = false,
  sortKey,
  sortDir = 'asc',
  onSort,
  stickyHeader = false,
}: WatchlistTableProps<T>) {
  const cellPx = compact ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div
      className={cn('w-full overflow-auto rounded-xl border', className)}
      style={{
        background: effects.surface.card.background,
        border: effects.surface.card.border,
      }}
    >
      <table className="w-full text-sm border-collapse" aria-label={caption}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead
          className={cn(stickyHeader && 'sticky top-0 z-10')}
          style={{ background: effects.surface.raised.background }}
        >
          <tr style={{ borderBottom: `1px solid ${colors.border.DEFAULT}` }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'text-left font-semibold uppercase tracking-[0.05em] whitespace-nowrap select-none',
                  compact ? 'px-3 py-2 text-[10px]' : 'px-4 py-3 text-[11px]',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center',
                  onSort && 'cursor-pointer',
                  col.headerClassName,
                )}
                style={{ color: colors.text.muted, width: col.width }}
                onClick={() => onSort?.(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {onSort && sortKey === col.key && (
                    <span className="text-[10px] opacity-60">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeleton columns={columns.length} rows={5} />
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center">
                <div className="flex flex-col items-center gap-2">
                  {emptyIcon && <span className="text-2xl opacity-30">{emptyIcon}</span>}
                  <p className="text-sm" style={{ color: colors.text.subtle }}>
                    {emptyMessage}
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row) => {
              const key = String(row[keyField]);
              const isSelected = selectedKey !== undefined && key === String(selectedKey);
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-colors duration-100',
                    onRowClick && 'cursor-pointer hover:bg-white/[0.025]',
                    isSelected && 'bg-white/[0.04]',
                  )}
                  style={{
                    borderBottom: `1px solid ${colors.border.subtle}`,
                    ...(isSelected && accentColor
                      ? { borderLeft: `2px solid ${accentColor}` }
                      : {}),
                  }}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(row) : undefined}
                  role={onRowClick ? 'button' : undefined}
                >
                  {columns.map((col) => {
                    const value =
                      typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : row[col.accessor as keyof T];
                    return (
                      <td
                        key={col.key}
                        className={cn(
                          cellPx,
                          col.align === 'right' && 'text-right',
                          col.align === 'center' && 'text-center',
                          col.className,
                        )}
                        style={{ color: colors.text.primary }}
                      >
                        {value as React.ReactNode}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
