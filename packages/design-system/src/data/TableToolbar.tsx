import type { ReactNode } from 'react';
import { color } from '../tokens/index.js';
import { cn } from '../utils.js';

export interface TableToolbarProps {
  totalCount?: number;
  selectedCount?: number;
  onExport?: () => void;
  onRefresh?: () => void;
  children?: ReactNode;
  className?: string;
}

export function TableToolbar({
  totalCount,
  selectedCount,
  onExport,
  onRefresh,
  children,
  className,
}: TableToolbarProps) {
  return (
    <div
      className={cn('flex items-center gap-3 px-4 border-b', className)}
      style={{ height: '40px', background: color.bg.surface, borderColor: color.border.subtle }}
    >
      {totalCount !== undefined && (
        <span style={{ color: color.text.muted, fontSize: '12px' }}>
          {selectedCount !== undefined && selectedCount > 0
            ? `${selectedCount} of ${totalCount} selected`
            : `${totalCount} rows`}
        </span>
      )}
      <div className="flex-1">{children}</div>
      <div className="flex items-center gap-1">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="rounded px-2 text-xs transition-colors"
            style={{
              height: '28px',
              color: color.text.secondary,
              background: 'transparent',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            Refresh
          </button>
        )}
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="rounded px-2 text-xs transition-colors"
            style={{
              height: '28px',
              color: color.text.secondary,
              background: 'transparent',
              cursor: 'pointer',
              border: 'none',
            }}
          >
            Export
          </button>
        )}
      </div>
    </div>
  );
}
