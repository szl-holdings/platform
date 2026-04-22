import type { ReactNode } from 'react';
import { color } from '../tokens/index.js';
import { cn } from '../utils.js';

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

export interface FilterBarProps {
  filters?: FilterOption[];
  activeFilter?: string;
  onFilterChange?: (id: string) => void;
  search?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function FilterBar({
  filters,
  activeFilter,
  onFilterChange,
  search,
  actions,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn('flex items-center gap-3 px-4 border-b', className)}
      style={{ height: '44px', background: color.bg.surface, borderColor: color.border.subtle }}
    >
      {filters && (
        <div className="flex items-center gap-1" role="tablist">
          {filters.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => onFilterChange?.(filter.id)}
                className="flex items-center gap-1.5 px-3 rounded text-xs transition-colors"
                style={{
                  height: '28px',
                  background: isActive ? color.bg.active : 'transparent',
                  color: isActive ? color.text.primary : color.text.secondary,
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                {filter.label}
                {filter.count !== undefined && (
                  <span
                    className="rounded-full px-1"
                    style={{
                      background: isActive ? color.border.default : color.bg.overlay,
                      color: color.text.secondary,
                      fontSize: '10px',
                      minWidth: '18px',
                      textAlign: 'center',
                    }}
                  >
                    {filter.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex-1">{search}</div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
