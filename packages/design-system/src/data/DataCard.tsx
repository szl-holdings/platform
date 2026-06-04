import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { type DensityMode, color, densityConfig, elevation, motion, semanticColors } from '../tokens/index.js';
import { cn } from '../utils.js';

export type DataCardStatus =
  | 'active'
  | 'inactive'
  | 'warning'
  | 'error'
  | 'pending'
  | 'success'
  | 'neutral';

export type DataCardLayout = 'grid' | 'list';

export interface DataCardAction {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export interface SparklinePoint {
  value: number;
}

export interface DataCardProps {
  title: string;
  subtitle?: string;
  status?: DataCardStatus;
  statusLabel?: string;
  accentColor?: string;
  icon?: ReactNode;
  tags?: string[];
  header?: ReactNode;
  body?: ReactNode;
  footer?: ReactNode;
  sparkline?: SparklinePoint[];
  actions?: DataCardAction[];
  layout?: DataCardLayout;
  density?: DensityMode;
  onClick?: () => void;
  className?: string;
}

const STATUS_CONFIG: Record<DataCardStatus, { bg: string; text: string; dot: string }> = {
  active: { bg: semanticColors.success.bg, text: semanticColors.success.text, dot: semanticColors.success.text },
  success: { bg: semanticColors.success.bg, text: semanticColors.success.text, dot: semanticColors.success.text },
  inactive: { bg: semanticColors.neutral.bg, text: semanticColors.neutral.text, dot: semanticColors.neutral.text },
  neutral: { bg: semanticColors.neutral.bg, text: semanticColors.neutral.text, dot: semanticColors.neutral.text },
  warning: { bg: semanticColors.warning.bg, text: semanticColors.warning.text, dot: semanticColors.warning.text },
  error: { bg: semanticColors.error.bg, text: semanticColors.error.text, dot: semanticColors.error.text },
  pending: { bg: semanticColors.warning.bg, text: semanticColors.warning.text, dot: semanticColors.warning.text },
};

function MiniSparkline({
  points,
  width = 72,
  height = 24,
  lineColor,
}: {
  points: SparklinePoint[];
  width?: number;
  height?: number;
  lineColor: string;
}) {
  if (points.length < 2) return null;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 2;
  const innerH = height - pad * 2;
  const innerW = width - pad * 2;
  const pts = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * innerW;
    const y = pad + (1 - (v - min) / range) * innerH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = pts[pts.length - 1].split(',');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.65}
      />
      <circle cx={last[0]} cy={last[1]} r="2" fill={lineColor} opacity={0.9} />
    </svg>
  );
}

interface ActionMenuProps {
  actions: DataCardAction[];
  onClose: () => void;
  anchorRef: React.RefObject<HTMLDivElement | null>;
}

function ActionMenu({ actions, onClose, anchorRef }: ActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    const el = menuRef.current?.querySelector('button:not(:disabled)') as HTMLElement | null;
    el?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!menuRef.current) return;
      const items = Array.from(
        menuRef.current.querySelectorAll<HTMLElement>('button:not(:disabled)'),
      );
      const idx = items.indexOf(document.activeElement as HTMLElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[Math.min(idx + 1, items.length - 1)]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[Math.max(idx - 1, 0)]?.focus();
      } else if (e.key === 'Tab') {
        onClose();
      }
    },
    [onClose],
  );

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Card actions"
      onKeyDown={handleKeyDown}
      className="absolute right-0 top-6 z-20 rounded-lg overflow-hidden py-1"
      style={{
        background: color.bg.raised,
        border: `1px solid ${color.border.default}`,
        boxShadow: elevation[2],
        minWidth: '140px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          role="menuitem"
          disabled={action.disabled}
          onClick={() => {
            if (!action.disabled) { action.onSelect(); onClose(); }
          }}
          className="w-full flex items-center gap-2 px-3 text-left"
          style={{
            height: '32px',
            fontSize: '12px',
            color: action.destructive ? color.accent.red : action.disabled ? color.text.muted : color.text.primary,
            cursor: action.disabled ? 'not-allowed' : 'pointer',
            background: 'transparent',
            border: 'none',
            opacity: action.disabled ? 0.5 : 1,
            transition: `background ${motion.duration.instant}`,
          }}
          onMouseEnter={(e) => { if (!action.disabled) (e.currentTarget as HTMLElement).style.background = color.bg.hover; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          {action.icon && (
            <span
              className="flex items-center justify-center"
              aria-hidden="true"
              style={{ width: '14px', height: '14px' }}
            >
              {action.icon}
            </span>
          )}
          {action.label}
        </button>
      ))}
    </div>
  );
}

export function DataCard({
  title,
  subtitle,
  status,
  statusLabel,
  accentColor,
  icon,
  tags,
  header,
  body,
  footer,
  sparkline,
  actions,
  layout = 'grid',
  density = 'comfortable',
  onClick,
  className,
}: DataCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnchorRef = useRef<HTMLDivElement>(null);
  const statusCfg = status ? STATUS_CONFIG[status] : null;
  const accent = accentColor ?? color.accent.blue;
  const isList = layout === 'list';
  const dc = densityConfig[density];
  const pad = dc.cardPadding;

  return (
    <div
      className={cn(
        'group rounded-lg relative flex flex-col',
        { 'flex-row items-center': isList },
        { 'cursor-pointer': !!onClick },
        className,
      )}
      style={{
        background: color.bg.surface,
        border: `1px solid ${color.border.subtle}`,
        borderLeft: isList ? `3px solid ${accent}` : undefined,
        borderTop: !isList ? `2px solid ${accent}` : undefined,
        transition: `border-color ${motion.duration.fast} ${motion.easing.standard}, background ${motion.duration.fast} ${motion.easing.standard}`,
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onClick) { e.preventDefault(); onClick(); } }}
      onMouseEnter={(e) => { if (onClick) (e.currentTarget as HTMLElement).style.background = color.bg.overlay; }}
      onMouseLeave={(e) => { if (onClick) (e.currentTarget as HTMLElement).style.background = color.bg.surface; }}
    >
      <div
        className={cn('flex items-start gap-3', { 'flex-1 min-w-0': isList })}
        style={{ padding: pad }}
      >
        {icon && (
          <div
            className="flex items-center justify-center rounded shrink-0"
            style={{
              width: dc.iconSize,
              height: dc.iconSize,
              background: color.bg.overlay,
              border: `1px solid ${color.border.default}`,
              color: accent,
            }}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="font-semibold truncate"
                  style={{ fontSize: dc.fontSize, color: color.text.primary, lineHeight: 1.3 }}
                >
                  {title}
                </span>
                {statusCfg && (
                  <span
                    className="inline-flex items-center gap-1 rounded px-1.5 shrink-0"
                    style={{
                      background: statusCfg.bg,
                      color: statusCfg.text,
                      fontSize: '10px',
                      fontWeight: 600,
                      height: '18px',
                    }}
                  >
                    <span
                      className="rounded-full"
                      style={{ width: '4px', height: '4px', background: statusCfg.dot }}
                      aria-hidden="true"
                    />
                    {statusLabel ?? status}
                  </span>
                )}
              </div>
              {subtitle && (
                <span
                  className="block truncate"
                  style={{ fontSize: '11px', color: color.text.secondary, marginTop: '1px' }}
                >
                  {subtitle}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {sparkline && sparkline.length >= 2 && (
                <MiniSparkline
                  points={sparkline}
                  lineColor={accent}
                  height={density === 'dense' ? 18 : density === 'compact' ? 22 : 28}
                />
              )}
              {actions && actions.length > 0 && (
                <div ref={menuAnchorRef} className="relative">
                  <button
                    type="button"
                    aria-label="Card actions"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
                    className="flex items-center justify-center rounded"
                    style={{
                      width: '24px',
                      height: '24px',
                      color: color.text.muted,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      transition: `background ${motion.duration.instant}`,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = color.bg.hover; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                      <circle cx="7" cy="2.5" r="1.2" />
                      <circle cx="7" cy="7" r="1.2" />
                      <circle cx="7" cy="11.5" r="1.2" />
                    </svg>
                  </button>
                  {menuOpen && (
                    <ActionMenu
                      actions={actions}
                      onClose={() => setMenuOpen(false)}
                      anchorRef={menuAnchorRef}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded px-1.5"
                  style={{
                    background: color.bg.overlay,
                    border: `1px solid ${color.border.subtle}`,
                    color: color.text.muted,
                    fontSize: '10px',
                    height: '16px',
                    lineHeight: '16px',
                    display: 'inline-block',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {header && (
        <div style={{ paddingLeft: pad, paddingRight: pad, paddingBottom: dc.sectionGap }}>
          {header}
        </div>
      )}

      {body && (
        <div
          style={{
            padding: `${dc.sectionGap} ${pad}`,
            borderTop: `1px solid ${color.border.subtle}`,
          }}
        >
          {body}
        </div>
      )}

      {footer && (
        <div
          className="flex items-center"
          style={{
            padding: `${dc.sectionGap} ${pad}`,
            borderTop: `1px solid ${color.border.subtle}`,
            marginTop: 'auto',
          }}
        >
          {footer}
        </div>
      )}

      {menuOpen && (
        <div
          className="fixed inset-0 z-10"
          aria-hidden="true"
          onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
        />
      )}
    </div>
  );
}
