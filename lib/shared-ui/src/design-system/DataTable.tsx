import type * as React from 'react';
import { cn } from '../utils';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
  width?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyField: keyof T;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  selectedKey?: string | number;
  className?: string;
  variant?: 'default' | 'compact' | 'dark';
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  stickyHeader?: boolean;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  selectedKey,
  className,
  variant = 'dark',
  sortKey,
  sortDir = 'asc',
  onSort,
  stickyHeader = false,
}: DataTableProps<T>) {
  const isDark = variant === 'dark';
  const isCompact = variant === 'compact';

  return (
    <div className={cn('w-full overflow-auto', className)}>
      <table className="w-full text-sm border-collapse">
        <thead
          className={cn(
            stickyHeader && 'sticky top-0 z-10',
            isDark ? 'bg-neutral-900' : 'bg-neutral-50',
          )}
        >
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'text-left font-semibold uppercase tracking-wider border-b',
                  isCompact ? 'px-3 py-2 text-[10px]' : 'px-4 py-3 text-[11px]',
                  isDark ? 'text-white/40 border-white/8' : 'text-neutral-400 border-neutral-200',
                  col.sortable && 'cursor-pointer hover:text-current',
                  col.headerClassName,
                )}
                style={col.width ? { width: col.width } : undefined}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <span className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortKey === col.key && (
                    <span className="text-[10px]">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center">
                <div className="flex items-center justify-center gap-2">
                  <span
                    className="w-4 h-4 border-2 rounded-full animate-spin"
                    style={{
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderTopColor: 'rgba(255,255,255,0.5)',
                    }}
                  />
                  <span className={isDark ? 'text-white/40' : 'text-neutral-400'}>Loading...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className={cn(
                  'py-8 text-center text-sm',
                  isDark ? 'text-white/30' : 'text-neutral-400',
                )}
              >
                {emptyMessage}
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
                    'border-b transition-colors duration-100',
                    isDark
                      ? 'border-white/5 hover:bg-white/3'
                      : 'border-neutral-100 hover:bg-neutral-50',
                    onRowClick && 'cursor-pointer',
                    isSelected && (isDark ? 'bg-white/5' : 'bg-neutral-100'),
                  )}
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
                          isCompact ? 'px-3 py-2' : 'px-4 py-3',
                          isDark ? 'text-white/70' : 'text-neutral-700',
                          col.className,
                        )}
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
