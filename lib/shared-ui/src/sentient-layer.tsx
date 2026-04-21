/**
 * SentientLayer — Persistent cross-surface intelligence rail.
 *
 * Summonable via ⌘J or the intelligence icon in EcosystemNav.
 * Context-aware: reads current surface, entity, and time range from props.
 * Three panels: Now (what changed), Next (recommended actions), Links (cross-surface jumps).
 *
 * Data is powered by existing Pulse briefing data + Decision Center pending decisions.
 * No new model providers. No new API keys.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from './utils';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface SentientUpdate {
  id: string;
  headline: string;
  surface: string;
  entityId?: string;
  entityLabel?: string;
  severity?: 'info' | 'warning' | 'critical';
  timestamp: string;
  href?: string;
}

export interface SentientAction {
  id: string;
  label: string;
  description: string;
  confidence: number;
  policyVerdict: 'allowed' | 'requires_approval' | 'blocked';
  href?: string;
  onClick?: () => void;
}

export interface SentientCrossLink {
  id: string;
  surface: string;
  surfaceAccent: string;
  label: string;
  description: string;
  href: string;
  preservedContext?: Record<string, string>;
}

export interface SentientLayerConfig {
  /** Current surface identifier (e.g. "vessels", "terra", "sentra") */
  surfaceId: string;
  /** Display name of the current surface */
  surfaceName: string;
  /** Accent color for the current surface */
  accentColor?: string;
  /** Currently selected entity (optional) */
  entityId?: string;
  entityType?: string;
  entityLabel?: string;
  /** Time range context */
  timeRange?: string;
  /** Recent updates relevant to the current surface/entity */
  updates?: SentientUpdate[];
  /** Recommended next actions */
  actions?: SentientAction[];
  /** Cross-surface navigation links with context */
  crossLinks?: SentientCrossLink[];
  /** Keyboard shortcut to toggle (default: ⌘J) */
  shortcut?: string;
}

export interface SentientLayerProps extends SentientLayerConfig {
  /** Controlled open state */
  open?: boolean;
  /** Called when the layer should close */
  onClose?: () => void;
  /** Called when the layer should open */
  onOpen?: () => void;
  className?: string;
}

// ─── Internal tokens ──────────────────────────────────────────────────────

const BG = {
  rail: '#0a0e16',
  header: '#0c1120',
  tab: '#0e1422',
  tabActive: '#111828',
  item: '#0d1220',
  itemHover: '#111828',
} as const;

const BORDER = 'rgba(255,255,255,0.06)';
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.60)',
  muted: 'rgba(255,255,255,0.55)',
} as const;

const VERDICT_COLORS = {
  allowed: '#22c55e',
  requires_approval: '#f59e0b',
  blocked: '#ef4444',
} as const;

const SEVERITY_COLORS = {
  info: '#3b82f6',
  warning: '#f59e0b',
  critical: '#ef4444',
} as const;

type Tab = 'now' | 'next' | 'links';

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function ConfidenceBar({ value, accentColor }: { value: number; accentColor: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-1 rounded-full transition-all"
          style={{ width: `${pct}%`, background: accentColor }}
        />
      </div>
      <span className="text-[10px] font-mono tabular-nums" style={{ color: TEXT.muted }}>
        {pct}%
      </span>
    </div>
  );
}

// ─── Tab Panels ───────────────────────────────────────────────────────────

function NowPanel({ updates, accentColor }: { updates: SentientUpdate[]; accentColor: string }) {
  if (updates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
          style={{ background: `${accentColor}12` }}
        >
          <span className="text-lg">✓</span>
        </div>
        <p className="text-sm font-medium" style={{ color: TEXT.primary }}>
          All clear
        </p>
        <p className="text-[11px] mt-1" style={{ color: TEXT.muted }}>
          No significant changes in the last hour.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 py-2">
      {updates.map((u) => (
        <a
          key={u.id}
          href={u.href ?? '#'}
          className="flex gap-3 px-4 py-3 transition-colors rounded-md mx-2 group"
          style={{ background: 'transparent' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = BG.itemHover;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
            style={{ background: SEVERITY_COLORS[u.severity ?? 'info'] }}
          />
          <div className="flex-1 min-w-0">
            <p
              className="text-[12px] leading-snug font-medium truncate"
              style={{ color: TEXT.primary }}
            >
              {u.headline}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono" style={{ color: TEXT.muted }}>
                {u.surface}
              </span>
              {u.entityLabel && (
                <>
                  <span style={{ color: TEXT.muted }}>·</span>
                  <span className="text-[10px] font-mono truncate" style={{ color: TEXT.muted }}>
                    {u.entityLabel}
                  </span>
                </>
              )}
              <span style={{ color: TEXT.muted }}>·</span>
              <span className="text-[10px] font-mono" style={{ color: TEXT.muted }}>
                {timeAgo(u.timestamp)}
              </span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

function NextPanel({ actions, accentColor }: { actions: SentientAction[]; accentColor: string }) {
  if (actions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
          style={{ background: `${accentColor}12` }}
        >
          <span className="text-lg">⚡</span>
        </div>
        <p className="text-sm font-medium" style={{ color: TEXT.primary }}>
          No recommended actions
        </p>
        <p className="text-[11px] mt-1" style={{ color: TEXT.muted }}>
          The platform has no pending recommendations for the current context.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-2">
      {actions.map((action) => (
        <div
          key={action.id}
          className="mx-3 rounded-lg border p-3 flex flex-col gap-2"
          style={{ background: BG.item, borderColor: BORDER }}
        >
          <div className="flex items-start justify-between gap-2">
            <p
              className="text-[12px] font-semibold leading-snug flex-1"
              style={{ color: TEXT.primary }}
            >
              {action.label}
            </p>
            <span
              className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0"
              style={{
                color: VERDICT_COLORS[action.policyVerdict],
                background: `${VERDICT_COLORS[action.policyVerdict]}14`,
                border: `1px solid ${VERDICT_COLORS[action.policyVerdict]}30`,
              }}
            >
              {action.policyVerdict === 'allowed'
                ? 'Allowed'
                : action.policyVerdict === 'requires_approval'
                  ? 'Needs Approval'
                  : 'Blocked'}
            </span>
          </div>
          <p className="text-[11px] leading-snug" style={{ color: TEXT.secondary }}>
            {action.description}
          </p>
          <ConfidenceBar value={action.confidence} accentColor={accentColor} />
          {(action.href || action.onClick) && (
            <a
              href={action.href ?? '#'}
              onClick={
                action.onClick
                  ? (e) => {
                      e.preventDefault();
                      action.onClick?.();
                    }
                  : undefined
              }
              className="text-[11px] font-medium mt-1 transition-opacity hover:opacity-80"
              style={{ color: accentColor }}
            >
              {action.policyVerdict === 'requires_approval'
                ? 'Request approval →'
                : 'Take action →'}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function LinksPanel({ crossLinks }: { crossLinks: SentientCrossLink[] }) {
  if (crossLinks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <span className="text-lg">🔗</span>
        </div>
        <p className="text-sm font-medium" style={{ color: TEXT.primary }}>
          No cross-surface links
        </p>
        <p className="text-[11px] mt-1" style={{ color: TEXT.muted }}>
          Select an entity to see relevant links across the platform.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 py-2">
      {crossLinks.map((link) => (
        <a
          key={link.id}
          href={link.href}
          className="flex items-start gap-3 px-4 py-3 transition-colors rounded-md mx-2"
          style={{ background: 'transparent' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = BG.itemHover;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}
        >
          <div
            className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
            style={{ background: link.surfaceAccent }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="text-[9px] font-mono uppercase tracking-wider"
                style={{ color: link.surfaceAccent }}
              >
                {link.surface}
              </span>
            </div>
            <p className="text-[12px] font-medium mt-0.5" style={{ color: TEXT.primary }}>
              {link.label}
            </p>
            <p className="text-[10px] mt-0.5 leading-snug" style={{ color: TEXT.muted }}>
              {link.description}
            </p>
          </div>
          <span className="text-[10px] mt-1 flex-shrink-0" style={{ color: TEXT.muted }}>
            →
          </span>
        </a>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export function SentientLayer({
  surfaceId,
  surfaceName,
  accentColor = '#8b7ac8',
  entityId,
  entityType,
  entityLabel,
  timeRange,
  updates = [],
  actions = [],
  crossLinks = [],
  open: controlledOpen,
  onClose,
  onOpen,
  className,
}: SentientLayerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('now');
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const railRef = useRef<HTMLElement>(null);

  const close = useCallback(() => {
    setInternalOpen(false);
    onClose?.();
  }, [onClose]);

  const open = useCallback(() => {
    setInternalOpen(true);
    onOpen?.();
  }, [onOpen]);

  // ⌘J keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        if (isOpen) close();
        else open();
      }
      if (e.key === 'Escape' && isOpen) close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, close, open]);

  const tabs: Array<{ id: Tab; label: string; count?: number }> = [
    { id: 'now', label: 'Now', count: updates.length },
    { id: 'next', label: 'Next', count: actions.length },
    { id: 'links', label: 'Links', count: crossLinks.length },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.32)' }}
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Rail */}
      <aside
        ref={railRef}
        role="complementary"
        aria-label="Sentient Intelligence Rail"
        className={cn(
          'fixed top-0 right-0 bottom-0 z-50 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          className,
        )}
        style={{
          width: 320,
          background: BG.rail,
          borderLeft: `1px solid ${BORDER}`,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${BORDER}`, background: BG.header }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: accentColor }}
            />
            <div>
              <div
                className="text-[11px] font-semibold tracking-wide"
                style={{ color: TEXT.primary }}
              >
                Intelligence
              </div>
              {entityLabel && (
                <div
                  className="text-[9px] font-mono mt-0.5 truncate max-w-[180px]"
                  style={{ color: TEXT.muted }}
                >
                  {entityType ? `${entityType} · ` : ''}
                  {entityLabel}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(255,255,255,0.05)', color: TEXT.muted }}
            >
              ⌘J
            </span>
            <button
              onClick={close}
              className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-white/5"
              style={{ color: TEXT.muted }}
              aria-label="Close intelligence rail"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="flex items-center gap-0 flex-shrink-0 px-2 py-1.5"
          style={{ borderBottom: `1px solid ${BORDER}`, background: BG.tab }}
          role="tablist"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors flex-1 justify-center"
              style={{
                background: activeTab === tab.id ? BG.tabActive : 'transparent',
                color: activeTab === tab.id ? TEXT.primary : TEXT.secondary,
                border: activeTab === tab.id ? `1px solid ${BORDER}` : '1px solid transparent',
              }}
            >
              {tab.label}
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span
                  className="text-[9px] font-mono rounded-full px-1 min-w-[16px] h-4 flex items-center justify-center"
                  style={{
                    background:
                      activeTab === tab.id ? `${accentColor}20` : 'rgba(255,255,255,0.06)',
                    color: activeTab === tab.id ? accentColor : TEXT.muted,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'now' && <NowPanel updates={updates} accentColor={accentColor} />}
          {activeTab === 'next' && <NextPanel actions={actions} accentColor={accentColor} />}
          {activeTab === 'links' && <LinksPanel crossLinks={crossLinks} />}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
          style={{ borderTop: `1px solid ${BORDER}`, background: BG.header }}
        >
          <span
            className="text-[9px] font-mono uppercase tracking-wider"
            style={{ color: TEXT.muted }}
          >
            {surfaceName}
          </span>
          {timeRange && (
            <span className="text-[9px] font-mono" style={{ color: TEXT.muted }}>
              {timeRange}
            </span>
          )}
        </div>
      </aside>
    </>
  );
}

/**
 * Hook to control the SentientLayer from anywhere in the component tree.
 */
export function useSentientLayer() {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const show = useCallback(() => setOpen(true), []);
  const hide = useCallback(() => setOpen(false), []);

  return { open, toggle, show, hide };
}
