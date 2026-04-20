import React, { type InputHTMLAttributes } from 'react';
import { color } from '../tokens/index.js';
import { cn } from '../utils.js';

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onClear?: () => void;
}

export function SearchInput({ className, onClear, value, ...props }: SearchInputProps) {
  return (
    <div className="relative flex items-center">
      <span
        className="absolute left-3 pointer-events-none"
        style={{ color: color.text.muted, fontSize: '13px' }}
      >
        ⌕
      </span>
      <input
        type="search"
        value={value}
        className={cn('w-full rounded-md text-sm outline-none transition-colors', className)}
        style={{
          height: '32px',
          paddingLeft: '32px',
          paddingRight: onClear && value ? '32px' : '12px',
          background: color.bg.overlay,
          border: `1px solid ${color.border.default}`,
          color: color.text.primary,
        }}
        {...props}
      />
      {onClear && value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2"
          style={{
            color: color.text.muted,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
          }}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
}
