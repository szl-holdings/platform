import React, { type ReactNode, useEffect, useState } from 'react';
import { color } from '../tokens/index.js';
import { cn } from '../utils.js';

/**
 * CommandBar — persistent command/search surface for the AEEP shell.
 *
 * Sits in the top bar and triggers the GlobalCommandPalette when activated.
 * Accepts keyboard shortcut (⌘K / Ctrl+K) to open/close the palette.
 */

export interface CommandBarProps {
  placeholder?: string;
  onOpen?: () => void;
  onClose?: () => void;
  open?: boolean;
  shortcut?: string;
  actions?: ReactNode;
  className?: string;
}

export function CommandBar({
  placeholder = 'Search or run a command…',
  onOpen,
  onClose,
  open = false,
  shortcut = '⌘K',
  actions,
  className,
}: CommandBarProps) {
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const isMac = navigator.platform.includes('Mac');
      const trigger = isMac ? e.metaKey : e.ctrlKey;
      if (trigger && e.key === 'k') {
        e.preventDefault();
        open ? onClose?.() : onOpen?.();
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onOpen, onClose]);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onClick={onOpen}
        className="flex items-center gap-2 rounded-md text-sm transition-colors"
        style={{
          height: '32px',
          padding: '0 12px',
          background: color.bg.overlay,
          border: `1px solid ${focused ? color.border.focus : color.border.default}`,
          color: color.text.secondary,
          cursor: 'pointer',
          minWidth: '200px',
          maxWidth: '360px',
          textAlign: 'left',
        }}
        aria-label="Open command palette"
        aria-keyshortcuts="Meta+k Control+k"
      >
        <span style={{ fontSize: '13px' }}>⌕</span>
        <span
          className="flex-1 text-left"
          style={{ fontSize: '13px', color: color.text.placeholder }}
        >
          {placeholder}
        </span>
        <kbd
          className="rounded px-1.5"
          style={{
            background: color.border.subtle,
            color: color.text.muted,
            fontSize: '10px',
            fontFamily: 'inherit',
          }}
        >
          {shortcut}
        </kbd>
      </button>
      {actions}
    </div>
  );
}
