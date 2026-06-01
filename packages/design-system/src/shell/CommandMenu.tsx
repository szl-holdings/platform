import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { type DensityMode, color, densityConfig, elevation, motion } from '../tokens/index.js';
import { cn } from '../utils.js';

export interface CommandMenuAction {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  icon?: ReactNode;
  group?: string;
  keywords?: string[];
  onSelect: () => void;
  disabled?: boolean;
}

export interface CommandMenuGroup {
  id: string;
  label: string;
  actions: CommandMenuAction[];
}

export interface CommandMenuProps {
  open: boolean;
  onClose: () => void;
  groups: CommandMenuGroup[];
  placeholder?: string;
  maxRecentItems?: number;
  storageKey?: string;
  footer?: ReactNode;
  density?: DensityMode;
  className?: string;
}

function fuzzyScore(haystack: string, needle: string): number {
  if (!needle) return 1;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  if (h.includes(n)) return 2;
  let score = 0;
  let hi = 0;
  for (let ni = 0; ni < n.length; ni++) {
    while (hi < h.length && h[hi] !== n[ni]) hi++;
    if (hi >= h.length) return 0;
    score++;
    hi++;
  }
  return score / n.length;
}

function scoreAction(action: CommandMenuAction, query: string): number {
  if (!query.trim()) return 1;
  const fields = [action.label, action.description ?? '', ...(action.keywords ?? [])];
  return Math.max(...fields.map((f) => fuzzyScore(f, query)));
}

export function CommandMenu({
  open,
  onClose,
  groups,
  placeholder = 'Search commands, switch domains…',
  maxRecentItems = 5,
  storageKey = 'gi-command-menu-recent',
  footer,
  density = 'comfortable',
  className,
}: CommandMenuProps) {
  const dc = densityConfig[density];
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) setRecentIds(JSON.parse(stored));
      } catch {
        /* ignore */
      }
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open, storageKey]);

  const allActions = groups.flatMap((g) => g.actions);

  const filteredGroups = (() => {
    const q = query.trim();
    if (!q) {
      const recentActions = recentIds
        .map((id) => allActions.find((a) => a.id === id))
        .filter((a): a is CommandMenuAction => !!a);
      const baseGroups = groups.filter((g) => g.actions.length > 0);
      if (recentActions.length > 0) {
        return [
          { id: '__recent__', label: 'Recent', actions: recentActions.slice(0, maxRecentItems) },
          ...baseGroups,
        ];
      }
      return baseGroups;
    }
    const scored: Array<{ action: CommandMenuAction; score: number; groupLabel: string }> = [];
    for (const group of groups) {
      for (const action of group.actions) {
        if (action.disabled) continue;
        const score = scoreAction(action, q);
        if (score > 0) scored.push({ action, score, groupLabel: group.label });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    if (scored.length === 0) return [];
    const byGroup = new Map<string, CommandMenuAction[]>();
    for (const { action, groupLabel } of scored) {
      const existing = byGroup.get(groupLabel) ?? [];
      byGroup.set(groupLabel, [...existing, action]);
    }
    return Array.from(byGroup.entries()).map(([label, actions]) => ({ id: label, label, actions }));
  })();

  const flatActions = filteredGroups.flatMap((g) => g.actions);

  const handleSelect = useCallback(
    (action: CommandMenuAction) => {
      if (action.disabled) return;
      setRecentIds((prev) => {
        const next = [action.id, ...prev.filter((id) => id !== action.id)].slice(0, maxRecentItems);
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
      action.onSelect();
      onClose();
    },
    [onClose, maxRecentItems, storageKey],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flatActions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        const action = flatActions[activeIndex];
        if (action) handleSelect(action);
      }
    },
    [flatActions, activeIndex, handleSelect, onClose],
  );

  useEffect(() => { setActiveIndex(0); }, [query]);

  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector('[data-active="true"]') as HTMLElement | null;
    active?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape' && open) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const rowH = dc.rowHeight;
  const inputH = dc.inputHeight;
  const fs = dc.fontSize;

  let globalIdx = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center"
      style={{ paddingTop: '100px', background: `${color.bg.base}d0` }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command menu"
    >
      <div
        className={cn('w-full max-w-[560px] rounded-xl overflow-hidden flex flex-col', className)}
        style={{
          background: color.bg.surface,
          border: `1px solid ${color.border.default}`,
          boxShadow: elevation[4],
          maxHeight: '520px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-3 px-4 shrink-0"
          style={{ borderBottom: `1px solid ${color.border.subtle}`, height: inputH }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
            style={{ color: color.text.muted, flexShrink: 0 }}
          >
            <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 9L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent outline-none"
            style={{ color: color.text.primary, fontSize: fs }}
            aria-label="Search commands"
            autoComplete="off"
            spellCheck={false}
            aria-autocomplete="list"
            aria-controls="command-menu-list"
          />
          <kbd
            className="shrink-0 rounded"
            style={{
              background: color.bg.overlay,
              color: color.text.muted,
              border: `1px solid ${color.border.subtle}`,
              fontSize: '10px',
              padding: '2px 6px',
            }}
          >
            ESC
          </kbd>
        </div>

        <div
          ref={listRef}
          id="command-menu-list"
          className="overflow-y-auto flex-1"
          role="listbox"
          aria-label="Commands"
        >
          {filteredGroups.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-2 py-12"
              style={{ color: color.text.muted }}
              role="status"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M13 13L16.5 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span style={{ fontSize: fs }}>No results for "{query}"</span>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.id} className="py-1.5">
                <div
                  className="px-4 pb-1 uppercase tracking-widest"
                  style={{ fontSize: '10px', color: color.text.muted, fontWeight: 600 }}
                >
                  {group.label}
                </div>
                {group.actions.map((action) => {
                  const idx = globalIdx++;
                  const isActive = idx === activeIndex;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      data-active={isActive}
                      role="option"
                      aria-selected={isActive}
                      aria-disabled={action.disabled}
                      disabled={action.disabled}
                      onClick={() => handleSelect(action)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className="w-full flex items-center gap-3 px-4 text-left border-none"
                      style={{
                        height: rowH,
                        color: action.disabled ? color.text.muted : color.text.primary,
                        background: isActive ? color.bg.hover : 'transparent',
                        cursor: action.disabled ? 'not-allowed' : 'pointer',
                        transition: `background ${motion.duration.instant} ${motion.easing.standard}`,
                        opacity: action.disabled ? 0.5 : 1,
                        fontSize: fs,
                      }}
                    >
                      {action.icon && (
                        <span
                          className="flex items-center justify-center shrink-0"
                          style={{ color: color.text.secondary, width: dc.iconSize, height: dc.iconSize }}
                          aria-hidden="true"
                        >
                          {action.icon}
                        </span>
                      )}
                      <span className="flex-1 min-w-0">
                        <span className="truncate block">{action.label}</span>
                        {action.description && (
                          <span className="truncate block" style={{ color: color.text.muted, fontSize: '10px' }}>
                            {action.description}
                          </span>
                        )}
                      </span>
                      {action.shortcut && (
                        <kbd
                          className="shrink-0 rounded"
                          style={{
                            background: color.bg.overlay,
                            color: color.text.muted,
                            border: `1px solid ${color.border.subtle}`,
                            fontSize: '10px',
                            padding: '2px 6px',
                          }}
                        >
                          {action.shortcut}
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {footer ? (
          <div
            className="shrink-0 px-4 py-2.5 flex items-center gap-2"
            style={{
              borderTop: `1px solid ${color.border.subtle}`,
              fontSize: '11px',
              color: color.text.muted,
            }}
          >
            {footer}
          </div>
        ) : (
          <div
            className="shrink-0 px-4 py-2 flex items-center gap-4"
            style={{
              borderTop: `1px solid ${color.border.subtle}`,
              fontSize: '10px',
              color: color.text.muted,
            }}
            aria-hidden="true"
          >
            {(['↑↓ navigate', '↵ select', 'esc close'] as const).map((hint) => (
              <span key={hint} className="flex items-center gap-1">
                <kbd
                  style={{
                    background: color.bg.overlay,
                    border: `1px solid ${color.border.subtle}`,
                    borderRadius: '3px',
                    padding: '1px 4px',
                    fontSize: '9px',
                  }}
                >
                  {hint.split(' ')[0]}
                </kbd>{' '}
                {hint.split(' ').slice(1).join(' ')}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
