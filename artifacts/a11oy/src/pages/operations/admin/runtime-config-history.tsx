import { useStandardQuery } from '@szl-holdings/api-client-react';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Clock,
  History,
  RefreshCw,
  Search,
  Shield,
  User,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface HistoryEntry {
  id: number;
  key: string | null;
  action: string;
  actor: string;
  actorEmail: string | null;
  actorName: string | null;
  description: string | null;
  metadata: {
    previousValue?: string | null;
    newValue?: string | null;
    changedFields?: string[];
    valueType?: string;
    category?: string;
    revert?: boolean;
    revertFromHistoryId?: number;
    bulkImport?: boolean;
    [k: string]: unknown;
  } | null;
  createdAt: string;
}

const actionColors: Record<string, string> = {
  create: 'text-[#6b8f71] bg-[#6b8f71]/10 border-[#6b8f71]/30',
  update: 'text-[#4a90b8] bg-[#4a90b8]/10 border-[#4a90b8]/30',
  delete: 'text-[#c45a4a] bg-[#c45a4a]/10 border-[#c45a4a]/30',
};

const REDACTED = '[redacted]';

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  if (Number.isNaN(then)) return iso;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

function DiffPanel({ entry }: { entry: HistoryEntry }) {
  const prev = entry.metadata?.previousValue;
  const next = entry.metadata?.newValue;
  const changedFields = entry.metadata?.changedFields ?? [];
  const hasValueChange = prev !== undefined || next !== undefined;
  const prevRedacted = prev === REDACTED;
  const nextRedacted = next === REDACTED;

  return (
    <div className="mt-3 ml-7 mr-2 p-3 rounded border border-border bg-muted/20 space-y-3 text-[11px]">
      {entry.description && (
        <div>
          <div className="text-muted-foreground uppercase tracking-wide text-[10px] mb-1">
            Description
          </div>
          <div className="text-foreground">{entry.description}</div>
        </div>
      )}

      {hasValueChange && (
        <div>
          <div className="text-muted-foreground uppercase tracking-wide text-[10px] mb-1">
            Value diff
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <div className="text-[10px] text-[#c45a4a] uppercase tracking-wide mb-0.5">
                Before
              </div>
              <pre className="font-mono text-[11px] whitespace-pre-wrap break-all bg-[#c45a4a]/5 border border-[#c45a4a]/20 rounded px-2 py-1.5 text-foreground">
                {prev === undefined
                  ? '(unchanged)'
                  : prev === null || prev === ''
                    ? '∅'
                    : prevRedacted
                      ? '[redacted]'
                      : String(prev)}
              </pre>
            </div>
            <div>
              <div className="text-[10px] text-[#6b8f71] uppercase tracking-wide mb-0.5">
                After
              </div>
              <pre className="font-mono text-[11px] whitespace-pre-wrap break-all bg-[#6b8f71]/5 border border-[#6b8f71]/20 rounded px-2 py-1.5 text-foreground">
                {next === undefined
                  ? '(deleted)'
                  : next === null || next === ''
                    ? '∅'
                    : nextRedacted
                      ? '[redacted]'
                      : String(next)}
              </pre>
            </div>
          </div>
          {(prevRedacted || nextRedacted) && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Sensitive entry — values redacted in the audit log.
            </p>
          )}
        </div>
      )}

      {changedFields.length > 0 && (
        <div>
          <div className="text-muted-foreground uppercase tracking-wide text-[10px] mb-1">
            Changed fields
          </div>
          <div className="flex flex-wrap gap-1">
            {changedFields.map((f) => (
              <span
                key={f}
                className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div>
          <div className="text-muted-foreground uppercase tracking-wide mb-0.5">Actor</div>
          <div className="text-foreground font-mono break-all">{entry.actor}</div>
          {entry.actorName && entry.actorName !== entry.actor && (
            <div className="text-muted-foreground">{entry.actorName}</div>
          )}
        </div>
        <div>
          <div className="text-muted-foreground uppercase tracking-wide mb-0.5">Timestamp</div>
          <div className="text-foreground font-mono">
            {new Date(entry.createdAt).toLocaleString()}
          </div>
          <div className="text-muted-foreground">{formatRelative(entry.createdAt)}</div>
        </div>
      </div>

      <div className="text-[10px] text-muted-foreground border-t border-border pt-2">
        Entry ID <code className="font-mono">#{entry.id}</code>
        {entry.metadata?.revert && (
          <>
            {' · '}revert of #{entry.metadata.revertFromHistoryId ?? '?'}
          </>
        )}
        {entry.metadata?.bulkImport && <> · bulk import</>}
      </div>
    </div>
  );
}

export default function RuntimeConfigHistory() {
  const [keyFilter, setKeyFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const { data, isLoading, error, refetch, isFetching } = useStandardQuery<{
    data: HistoryEntry[];
  }>({
    queryKey: ['runtime-config-history', '_admin_view'],
    queryFn: () => apiFetch('/runtime-config/_history?limit=200'),
  });

  const allEntries = data?.data ?? [];

  const uniqueActors = useMemo(() => {
    const seen = new Set<string>();
    for (const e of allEntries) if (e.actor) seen.add(e.actor);
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [allEntries]);

  const entries = useMemo(() => {
    const keyQ = keyFilter.trim().toLowerCase();
    return allEntries.filter((e) => {
      if (keyQ && !(e.key ?? '').toLowerCase().includes(keyQ)) return false;
      if (actorFilter && e.actor !== actorFilter) return false;
      if (actionFilter && e.action !== actionFilter) return false;
      return true;
    });
  }, [allEntries, keyFilter, actorFilter, actionFilter]);

  const hasActiveFilter =
    keyFilter.trim() !== '' || actorFilter !== '' || actionFilter !== '';

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(entries.map((e) => e.id)));
  const collapseAll = () => setExpanded(new Set());

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <History className="w-6 h-6 text-primary" />
            Runtime Config — History
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            Admin-only audit trail of every create, update, delete, and revert across all
            runtime-config keys.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border border-border hover:bg-muted/40 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            value={keyFilter}
            onChange={(e) => setKeyFilter(e.target.value)}
            placeholder="Filter by key…"
            className="w-full pl-8 pr-2 py-1.5 text-xs font-mono bg-background rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={actorFilter}
          onChange={(e) => setActorFilter(e.target.value)}
          className="px-2 py-1.5 text-xs bg-background rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All actors ({uniqueActors.length})</option>
          {uniqueActors.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-2 py-1.5 text-xs bg-background rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All actions</option>
          <option value="create">create</option>
          <option value="update">update</option>
          <option value="delete">delete</option>
        </select>
        {hasActiveFilter && (
          <button
            onClick={() => {
              setKeyFilter('');
              setActorFilter('');
              setActionFilter('');
            }}
            className="px-2 py-1.5 text-xs rounded border border-border text-muted-foreground hover:bg-muted/40"
          >
            Clear
          </button>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={expandAll}
            disabled={entries.length === 0}
            className="px-2 py-1.5 text-[11px] rounded border border-border text-muted-foreground hover:bg-muted/40 disabled:opacity-40"
          >
            Expand all
          </button>
          <button
            onClick={collapseAll}
            disabled={expanded.size === 0}
            className="px-2 py-1.5 text-[11px] rounded border border-border text-muted-foreground hover:bg-muted/40 disabled:opacity-40"
          >
            Collapse all
          </button>
        </div>
      </div>

      <div className="text-[11px] text-muted-foreground">
        Showing <span className="text-foreground">{entries.length}</span>
        {hasActiveFilter && (
          <>
            {' '}
            of {allEntries.length}
          </>
        )}{' '}
        entries · most recent 200 events from the activity log
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <AlertTriangle className="w-6 h-6 text-[#d4a054] mx-auto mb-2" />
            Failed to load history. You may not have admin/ops access.
          </div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {hasActiveFilter
              ? 'No entries match the current filters.'
              : 'No recorded runtime config changes.'}
          </div>
        ) : (
          <ol className="divide-y divide-border">
            {entries.map((entry) => {
              const isOpen = expanded.has(entry.id);
              const prev = entry.metadata?.previousValue;
              const next = entry.metadata?.newValue;
              const isRevert = entry.metadata?.revert === true;
              return (
                <li key={entry.id} className="px-4 py-2.5">
                  <button
                    type="button"
                    onClick={() => toggle(entry.id)}
                    className="w-full flex items-center gap-2 text-left"
                  >
                    {isOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide border ${actionColors[entry.action] ?? 'bg-muted text-muted-foreground border-border'}`}
                    >
                      {entry.action}
                    </span>
                    {isRevert && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide bg-[#8b7ac8]/10 text-[#8b7ac8] border border-[#8b7ac8]/30">
                        revert
                      </span>
                    )}
                    <code className="font-mono text-xs text-foreground break-all">
                      {entry.key ?? '—'}
                    </code>
                    {!isOpen && (prev !== undefined || next !== undefined) && (
                      <span className="text-[11px] text-muted-foreground hidden md:inline-flex items-center gap-1 ml-2 truncate">
                        {prev !== undefined && (
                          <code className="font-mono bg-muted/50 px-1 rounded truncate max-w-[120px]">
                            {prev === null || prev === '' ? '∅' : String(prev)}
                          </code>
                        )}
                        <span>→</span>
                        {next !== undefined && (
                          <code className="font-mono bg-muted/50 px-1 rounded truncate max-w-[120px]">
                            {next === null || next === '' ? '∅' : String(next)}
                          </code>
                        )}
                      </span>
                    )}
                    <span className="ml-auto flex items-center gap-3 text-[11px] text-muted-foreground shrink-0">
                      <span className="inline-flex items-center gap-1 max-w-[200px] truncate">
                        <User className="w-3 h-3" />
                        {entry.actor}
                      </span>
                      <span
                        className="inline-flex items-center gap-1"
                        title={new Date(entry.createdAt).toLocaleString()}
                      >
                        <Clock className="w-3 h-3" />
                        {formatRelative(entry.createdAt)}
                      </span>
                    </span>
                  </button>
                  {isOpen && <DiffPanel entry={entry} />}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
