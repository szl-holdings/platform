import type React from 'react';

export type SyncState = 'synced' | 'syncing' | 'pending' | 'conflict' | 'error' | 'offline';

export interface SyncStatusBadgeProps {
  syncState: SyncState;
  pendingCount?: number;
  conflictCount?: number;
  lastSyncedAt?: Date | null;
  className?: string;
  showLabel?: boolean;
  size?: 'xs' | 'sm' | 'md';
}

const STATE_CONFIG: Record<
  SyncState,
  { label: string; color: string; dotColor: string; icon: string }
> = {
  synced: {
    label: 'Synced',
    color: 'text-emerald-600 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
    icon: '✓',
  },
  syncing: {
    label: 'Syncing',
    color: 'text-blue-600 dark:text-blue-400',
    dotColor: 'bg-blue-500',
    icon: '↻',
  },
  pending: {
    label: 'Pending',
    color: 'text-amber-600 dark:text-amber-400',
    dotColor: 'bg-amber-500',
    icon: '⏳',
  },
  conflict: {
    label: 'Conflict',
    color: 'text-red-600 dark:text-red-400',
    dotColor: 'bg-red-500',
    icon: '⚠',
  },
  error: {
    label: 'Sync Error',
    color: 'text-red-600 dark:text-red-400',
    dotColor: 'bg-red-500',
    icon: '✗',
  },
  offline: {
    label: 'Offline',
    color: 'text-zinc-500 dark:text-zinc-400',
    dotColor: 'bg-zinc-400',
    icon: '◌',
  },
};

const SIZE_CLASSES = {
  xs: { dot: 'w-1.5 h-1.5', text: 'text-xs', gap: 'gap-1', padding: 'px-1.5 py-0.5' },
  sm: { dot: 'w-2 h-2', text: 'text-xs', gap: 'gap-1.5', padding: 'px-2 py-0.5' },
  md: { dot: 'w-2.5 h-2.5', text: 'text-sm', gap: 'gap-2', padding: 'px-2.5 py-1' },
};

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString();
}

export function SyncStatusBadge({
  syncState,
  pendingCount = 0,
  conflictCount = 0,
  lastSyncedAt,
  className = '',
  showLabel = true,
  size = 'sm',
}: SyncStatusBadgeProps): React.ReactElement {
  const config = STATE_CONFIG[syncState];
  const sizeClass = SIZE_CLASSES[size];
  const isAnimating = syncState === 'syncing';

  let displayLabel = config.label;
  if (syncState === 'pending' && pendingCount > 0) {
    displayLabel = `${pendingCount} pending`;
  } else if (syncState === 'conflict' && conflictCount > 0) {
    displayLabel = `${conflictCount} conflict${conflictCount !== 1 ? 's' : ''}`;
  } else if (syncState === 'synced' && lastSyncedAt) {
    displayLabel = `Synced ${formatRelativeTime(lastSyncedAt)}`;
  }

  return (
    <span
      className={[
        'inline-flex items-center rounded-full font-medium ring-1 ring-inset ring-current/20',
        sizeClass.gap,
        sizeClass.padding,
        sizeClass.text,
        config.color,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      title={displayLabel}
      aria-label={`Sync status: ${displayLabel}`}
    >
      <span
        className={[
          'rounded-full flex-shrink-0',
          sizeClass.dot,
          config.dotColor,
          isAnimating ? 'animate-pulse' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      />
      {showLabel && <span>{displayLabel}</span>}
    </span>
  );
}

export interface SyncStatusBarProps {
  syncState: SyncState;
  pendingCount?: number;
  conflictCount?: number;
  lastSyncedAt?: Date | null;
  onResolveConflicts?: () => void;
  className?: string;
}

export function SyncStatusBar({
  syncState,
  pendingCount = 0,
  conflictCount = 0,
  lastSyncedAt,
  onResolveConflicts,
  className = '',
}: SyncStatusBarProps): React.ReactElement | null {
  if (syncState === 'synced') return null;

  const config = STATE_CONFIG[syncState];

  return (
    <div
      className={[
        'flex items-center justify-between px-4 py-2 text-sm border-b',
        syncState === 'offline'
          ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
          : syncState === 'conflict' || syncState === 'error'
            ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
            : syncState === 'pending'
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
              : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-center gap-2">
        <span
          className={[
            'w-2 h-2 rounded-full',
            config.dotColor,
            syncState === 'syncing' ? 'animate-pulse' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        />
        <span className="font-medium">
          {syncState === 'offline' && "You're offline — changes will sync when reconnected"}
          {syncState === 'syncing' && 'Syncing changes…'}
          {syncState === 'pending' &&
            `${pendingCount} change${pendingCount !== 1 ? 's' : ''} pending sync`}
          {syncState === 'conflict' &&
            `${conflictCount} conflict${conflictCount !== 1 ? 's' : ''} require review`}
          {syncState === 'error' && 'Sync failed — will retry automatically'}
        </span>
      </div>
      {syncState === 'conflict' && onResolveConflicts && (
        <button
          onClick={onResolveConflicts}
          className="text-xs underline underline-offset-2 font-medium hover:no-underline"
        >
          Review conflicts
        </button>
      )}
    </div>
  );
}
