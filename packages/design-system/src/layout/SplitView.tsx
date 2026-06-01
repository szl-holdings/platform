import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { type DensityMode, color, densityConfig, motion } from '../tokens/index.js';
import { cn } from '../utils.js';

export type SplitViewDirection = 'horizontal' | 'vertical';

export interface SplitViewProps {
  primary: ReactNode;
  secondary: ReactNode;
  direction?: SplitViewDirection;
  defaultSplit?: number;
  minPrimary?: number;
  minSecondary?: number;
  snapPoints?: number[];
  collapsible?: boolean;
  collapseThreshold?: number;
  storageKey?: string;
  density?: DensityMode;
  className?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onSplitChange?: (split: number) => void;
}

const SNAP_RADIUS = 4;

function snapToPoint(value: number, points: number[], radius: number): number {
  for (const point of points) {
    if (Math.abs(value - point) <= radius) return point;
  }
  return value;
}

export function SplitView({
  primary,
  secondary,
  direction = 'horizontal',
  defaultSplit = 50,
  minPrimary = 15,
  minSecondary = 15,
  snapPoints = [25, 33, 50, 67, 75],
  collapsible = true,
  collapseThreshold = 8,
  storageKey,
  density = 'comfortable',
  className,
  primaryLabel,
  secondaryLabel,
  onSplitChange,
}: SplitViewProps) {
  const dc = densityConfig[density];
  const dividerSize = density === 'dense' ? 6 : density === 'compact' ? 7 : 8;

  const [split, setSplit] = useState<number>(() => {
    if (storageKey) {
      try {
        const stored = localStorage.getItem(`gi-split-view-${storageKey}`);
        if (stored) return Number(stored);
      } catch {
        /* ignore */
      }
    }
    return defaultSplit;
  });

  const [collapsed, setCollapsed] = useState<'primary' | 'secondary' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ pos: number; split: number } | null>(null);
  const isHorizontal = direction === 'horizontal';

  const persistSplit = useCallback(
    (value: number) => {
      if (storageKey) {
        try {
          localStorage.setItem(`gi-split-view-${storageKey}`, String(value));
        } catch {
          /* ignore */
        }
      }
      onSplitChange?.(value);
    },
    [storageKey, onSplitChange],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragStartRef.current = { pos: isHorizontal ? e.clientX : e.clientY, split };
      setIsDragging(true);
    },
    [isHorizontal, split],
  );

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalSize = isHorizontal ? rect.width : rect.height;
      const pos = isHorizontal ? e.clientX : e.clientY;
      const origin = isHorizontal ? rect.left : rect.top;
      const raw = ((pos - origin) / totalSize) * 100;
      const clamped = Math.min(Math.max(raw, minPrimary), 100 - minSecondary);
      const snapped = snapToPoint(clamped, snapPoints, SNAP_RADIUS);

      if (collapsible && snapped <= collapseThreshold) {
        setCollapsed('primary');
      } else if (collapsible && snapped >= 100 - collapseThreshold) {
        setCollapsed('secondary');
      } else {
        setCollapsed(null);
        setSplit(snapped);
        persistSplit(snapped);
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isHorizontal, minPrimary, minSecondary, snapPoints, collapsible, collapseThreshold, persistSplit]);

  const handleDividerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 10 : 2;
      if (isHorizontal) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const next = Math.max(split - step, minPrimary);
          setSplit(next); persistSplit(next); setCollapsed(null);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          const next = Math.min(split + step, 100 - minSecondary);
          setSplit(next); persistSplit(next); setCollapsed(null);
        }
      } else {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          const next = Math.max(split - step, minPrimary);
          setSplit(next); persistSplit(next); setCollapsed(null);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const next = Math.min(split + step, 100 - minSecondary);
          setSplit(next); persistSplit(next); setCollapsed(null);
        }
      }
      if (e.key === 'Home') {
        setCollapsed('primary');
      } else if (e.key === 'End') {
        setCollapsed('secondary');
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (collapsed) {
          setCollapsed(null);
          setSplit(defaultSplit);
        } else {
          setCollapsed('secondary');
        }
      }
    },
    [isHorizontal, split, minPrimary, minSecondary, collapsed, defaultSplit, persistSplit],
  );

  const primarySize =
    collapsed === 'primary' ? '0%' : collapsed === 'secondary' ? '100%' : `${split}%`;
  const secondarySize =
    collapsed === 'primary' ? '100%' : collapsed === 'secondary' ? '0%' : `${100 - split}%`;

  const transitionProp = isHorizontal ? 'width' : 'height';
  const transitionVal = `${transitionProp} ${motion.duration.fast} ${motion.easing.decelerate}`;

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex h-full min-h-0 min-w-0 relative overflow-hidden',
        { 'flex-col': !isHorizontal, 'flex-row': isHorizontal, 'select-none': isDragging },
        className,
      )}
    >
      <div
        className="overflow-hidden flex-shrink-0"
        style={{
          [transitionProp]: primarySize,
          transition: isDragging ? 'none' : transitionVal,
        }}
        aria-label={primaryLabel}
      >
        <div className="h-full w-full overflow-auto">{primary}</div>
      </div>

      <div
        role="separator"
        aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
        aria-label={`Resize panels — use arrow keys to adjust${collapsed ? ', Enter/Space to restore' : ''}`}
        aria-valuenow={split}
        aria-valuemin={minPrimary}
        aria-valuemax={100 - minSecondary}
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onKeyDown={handleDividerKeyDown}
        className="relative z-10 flex items-center justify-center flex-shrink-0 focus:outline-none"
        style={{
          [isHorizontal ? 'width' : 'height']: `${dividerSize}px`,
          cursor: isHorizontal ? 'col-resize' : 'row-resize',
          background: isDragging ? color.bg.hover : 'transparent',
          transition: `background ${motion.duration.instant} ${motion.easing.standard}`,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = color.bg.hover; }}
        onMouseLeave={(e) => { if (!isDragging) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        onFocus={(e) => { (e.currentTarget as HTMLElement).style.background = color.bg.active; }}
        onBlur={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        <div
          style={{
            [isHorizontal ? 'width' : 'height']: '1px',
            [isHorizontal ? 'height' : 'width']: '100%',
            background: isDragging ? color.border.strong : color.border.subtle,
            transition: `background ${motion.duration.instant} ${motion.easing.standard}`,
          }}
        />
        <div
          className="absolute flex items-center justify-center"
          aria-hidden="true"
        >
          <div
            style={{
              [isHorizontal ? 'width' : 'height']: '2px',
              [isHorizontal ? 'height' : 'width']: dc.sectionGap,
              background: color.border.strong,
              borderRadius: '1px',
              opacity: 0.5,
            }}
          />
        </div>
      </div>

      <div
        className="overflow-hidden flex-1 min-w-0 min-h-0"
        style={{
          [transitionProp]: secondarySize,
          transition: isDragging ? 'none' : transitionVal,
        }}
        aria-label={secondaryLabel}
      >
        <div className="h-full w-full overflow-auto">{secondary}</div>
      </div>
    </div>
  );
}
