import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { v } from '../tokens/vars.js';
import { cn } from '../utils';

export interface ColumnDef<T> {
  key: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  mono?: boolean;
}

export interface DenseTableProps<T> {
  columns: ColumnDef<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  stickyHeader?: boolean;
  maxHeight?: string;
  emptyMessage?: string;
  className?: string;
  caption?: string;
}

type SortDir = 'asc' | 'desc' | null;

export function DenseTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  stickyHeader = true,
  maxHeight = '400px',
  emptyMessage = 'No data',
  className,
  caption,
}: DenseTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'));
      if (sortDir === 'desc') setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const displayed = [...rows].sort((a, b) => {
    if (!sortKey || sortDir === null) return 0;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return 0;
    const av = String(col.accessor(a) ?? '');
    const bv = String(col.accessor(b) ?? '');
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  function SortIcon({ col }: { col: ColumnDef<T> }) {
    if (!col.sortable) return null;
    if (sortKey !== col.key || sortDir === null)
      return <ChevronsUpDown className="h-3 w-3 opacity-30" />;
    if (sortDir === 'asc') return <ChevronUp style={{ color: v.accentBlue }} className="h-3 w-3" />;
    return <ChevronDown style={{ color: v.accentBlue }} className="h-3 w-3" />;
  }

  return (
    <div
      style={{ borderColor: v.borderDefault, maxHeight }}
      className={cn('rounded-lg border overflow-hidden', className)}
    >
      <div className="overflow-auto h-full">
        <table className="w-full border-collapse text-xs">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className={cn(stickyHeader && 'sticky top-0 z-10')}>
            <tr
              style={{ borderColor: v.borderDefault, backgroundColor: v.bgSurface }}
              className="border-b"
            >
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  style={{ width: col.width, color: v.textMuted }}
                  className={cn(
                    'px-3 py-2 text-[10px] font-semibold uppercase tracking-wider',
                    col.align === 'center' && 'text-center',
                    col.align === 'right' && 'text-right',
                    col.sortable && 'cursor-pointer select-none transition-colors',
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div
                    className={cn(
                      'inline-flex items-center gap-1',
                      col.align === 'center' && 'justify-center',
                      col.align === 'right' && 'justify-end',
                    )}
                  >
                    {col.header}
                    <SortIcon col={col} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody style={{ borderColor: v.borderSubtle }} className="divide-y">
            {displayed.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ color: v.textMuted }}
                  className="px-3 py-8 text-center"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              displayed.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'bg-transparent transition-colors duration-100',
                    onRowClick && 'cursor-pointer',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{ color: v.textPrimary }}
                      className={cn(
                        'px-3 py-2',
                        col.align === 'center' && 'text-center',
                        col.align === 'right' && 'text-right',
                        col.mono && 'font-mono tabular-nums',
                      )}
                    >
                      {col.accessor(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
