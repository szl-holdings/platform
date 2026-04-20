import React, { type ReactNode } from 'react';
import { useDensity } from '../hooks/useDensity.js';
import { color } from '../tokens/index.js';
import { cn } from '../utils.js';

export interface DataGridColumn<T> {
  id: string;
  label: string;
  accessor: (row: T) => ReactNode;
  width?: string;
  minWidth?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

export interface DataGridProps<T> {
  columns: DataGridColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectedRowKey?: string;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  stickyHeader?: boolean;
}

export function DataGrid<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  selectedRowKey,
  loading = false,
  emptyMessage = 'No data',
  className,
  stickyHeader = true,
}: DataGridProps<T>) {
  const { rowHeight, fontSize } = useDensity();

  return (
    <div className={cn('overflow-auto', className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr
            style={{
              background: color.bg.surface,
              position: stickyHeader ? 'sticky' : undefined,
              top: stickyHeader ? 0 : undefined,
              zIndex: stickyHeader ? 1 : undefined,
            }}
          >
            {columns.map((col) => (
              <th
                key={col.id}
                className="text-left px-3 font-medium border-b"
                style={{
                  color: color.text.secondary,
                  fontSize: '11px',
                  fontWeight: 500,
                  borderColor: color.border.subtle,
                  height: '36px',
                  width: col.width,
                  minWidth: col.minWidth,
                  textAlign: col.align ?? 'left',
                  whiteSpace: 'nowrap',
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-8"
                style={{ color: color.text.muted, fontSize }}
              >
                Loading…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-8"
                style={{ color: color.text.muted, fontSize }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const key = getRowKey(row);
              const isSelected = key === selectedRowKey;
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(row)}
                  className="transition-colors border-b"
                  style={{
                    height: rowHeight,
                    background: isSelected ? color.bg.active : 'transparent',
                    borderColor: color.border.subtle,
                    cursor: onRowClick ? 'pointer' : 'default',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected)
                      (e.currentTarget as HTMLElement).style.background = color.bg.overlay;
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className="px-3 truncate"
                      style={{
                        color: color.text.primary,
                        fontSize,
                        textAlign: col.align ?? 'left',
                        maxWidth: col.width,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col.accessor(row)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
