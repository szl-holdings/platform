import { useStandardQuery } from '@szl-holdings/api-client-react';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Database,
  InboxIcon,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { useState } from 'react';

const API = import.meta.env.VITE_API_URL ?? '/api';

async function apiFetch(path: string) {
  const r = await fetch(`${API}${path}`, { credentials: 'include' });
  if (!r.ok) throw new Error(`API ${path} failed: ${r.status}`);
  return r.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────

type RegistryEntry = {
  id: string;
  name: string;
  description?: string | null;
  provider: string;
  model: string;
  version: string;
  domain: string;
  policyTier: string;
  status: 'active' | 'deprecated';
  confidenceBaseline: number | null;
  updatedAt: string;
};

type LogEntry = {
  id: number;
  model: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actor: string;
  platform: string;
  confidence: number | null;
  timestamp: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(ts: string) {
  try {
    const d = new Date(ts);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return ts;
  }
}

function ConfidenceBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground text-xs">—</span>;
  const pct = Math.round(value * 100);
  const color = pct >= 90 ? 'text-emerald-400' : pct >= 80 ? 'text-amber-400' : 'text-red-400';
  return <span className={cn('font-mono text-xs font-semibold', color)}>{pct}%</span>;
}

function StatusPill({ status }: { status: string }) {
  const active = status === 'active';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize',
        active ? 'bg-emerald-400/10 text-emerald-400' : 'bg-muted text-muted-foreground',
      )}
    >
      {active ? (
        <CheckCircle2 className="w-2.5 h-2.5" />
      ) : (
        <AlertTriangle className="w-2.5 h-2.5" />
      )}
      {status}
    </span>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const colors: Record<string, string> = {
    Web: 'bg-blue-400/10 text-blue-400',
    Mobile: 'bg-violet-400/10 text-violet-400',
    API: 'bg-cyan-400/10 text-cyan-400',
    Internal: 'bg-muted text-muted-foreground',
  };
  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded text-[10px] font-medium',
        colors[platform] ?? colors.Internal,
      )}
    >
      {platform}
    </span>
  );
}

function EmptyState({
  icon: Icon,
  title,
  detail,
}: {
  icon: React.ElementType;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
      <Icon className="w-8 h-8 text-muted-foreground/40" />
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground/60">{detail}</p>
    </div>
  );
}

function ApiErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// ─── Model Registry Section ───────────────────────────────────────────────────

function ModelRegistryTable({
  entries,
  isLoading,
}: {
  entries: RegistryEntry[];
  isLoading: boolean;
}) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deprecated'>('all');
  const [domainFilter, setDomainFilter] = useState('all');
  const domains = ['all', ...Array.from(new Set(entries.map((e) => e.domain)))];

  const filtered = entries.filter((e) => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false;
    if (domainFilter !== 'all' && e.domain !== domainFilter) return false;
    return true;
  });

  const activeCount = entries.filter((e) => e.status === 'active').length;
  const avgConfidence = (() => {
    const withBaseline = entries.filter((e) => e.confidenceBaseline !== null);
    if (!withBaseline.length) return null;
    return (
      withBaseline.reduce((acc, e) => acc + (e.confidenceBaseline ?? 0), 0) / withBaseline.length
    );
  })();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card/60 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Registered</p>
          <p className="text-2xl font-bold text-foreground">{entries.length}</p>
        </div>
        <div className="bg-card/60 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Active</p>
          <p className="text-2xl font-bold text-emerald-400">{activeCount}</p>
        </div>
        <div className="bg-card/60 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Deprecated</p>
          <p className="text-2xl font-bold text-muted-foreground">{entries.length - activeCount}</p>
        </div>
        <div className="bg-card/60 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            Avg Confidence
          </p>
          <p className="text-2xl font-bold text-cyan-400">
            {avgConfidence != null ? `${Math.round(avgConfidence * 100)}%` : '—'}
          </p>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1">
            {(['all', 'active', 'deprecated'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors',
                  statusFilter === s
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:bg-muted/50',
                )}
              >
                {s}
              </button>
            ))}
          </div>
          {domains.length > 2 && (
            <div className="flex gap-1 flex-wrap">
              {domains.slice(0, 7).map((d) => (
                <button
                  key={d}
                  onClick={() => setDomainFilter(d)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors',
                    domainFilter === d
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:bg-muted/50',
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-card/60 border border-border rounded-xl overflow-x-auto">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Brain}
            title="No models registered"
            detail="Populate alloy_runtime_agents to see live entries"
          />
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                  Model / Agent
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Provider</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Version</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Domain</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                  Policy Tier
                </th>
                <th className="text-center px-4 py-3 text-muted-foreground font-medium">
                  Confidence
                </th>
                <th className="text-center px-4 py-3 text-muted-foreground font-medium">Status</th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Brain className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{entry.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {entry.model || entry.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{entry.provider}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">
                      v{entry.version}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{entry.domain}</td>
                  <td className="px-4 py-3">
                    <span className="text-muted-foreground text-[10px] font-mono">
                      {entry.policyTier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ConfidenceBadge value={entry.confidenceBaseline} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusPill status={entry.status} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[10px] text-muted-foreground">
                    {fmt(entry.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Governance Log Section ───────────────────────────────────────────────────

function GovernanceLog({ entries, isLoading }: { entries: LogEntry[]; isLoading: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? entries : entries.slice(0, 15);

  return (
    <div className="bg-card/60 border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-display font-semibold text-foreground">
            Inference Governance Log
          </h3>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {entries.length} events
          </span>
        </div>
        {entries.length > 15 && (
          <button
            onClick={() => setExpanded((p) => !p)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            {expanded ? 'Collapse' : 'Show all'}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="p-8 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={InboxIcon}
          title="No inference events yet"
          detail="Events will appear here as Alloy agents run inference calls"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Model</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Action</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Entity</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Actor</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">
                  Platform
                </th>
                <th className="text-center px-4 py-2.5 text-muted-foreground font-medium">
                  Confidence
                </th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-border/40 hover:bg-muted/10 transition-colors"
                >
                  <td className="px-4 py-2.5 font-mono text-foreground max-w-[180px] truncate">
                    {e.model}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground capitalize">
                    {e.action.replace(/-/g, ' ')}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-muted-foreground">{e.entityType}</span>
                    {e.entityId && (
                      <span className="text-[10px] font-mono text-muted-foreground/60 ml-1">
                        {e.entityId}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{e.actor}</td>
                  <td className="px-4 py-2.5">
                    <PlatformBadge platform={e.platform} />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <ConfidenceBadge value={e.confidence} />
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-[10px] text-muted-foreground">
                    {fmt(e.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Models() {
  // Live backend routes — /firestorm/* paths are active api-server endpoints.
  // Follow-up task #1715 will rename them to /aegis/* once the server migration lands.
  const {
    data: registryData,
    isLoading: regLoading,
    isError: regError,
    refetch: refetchReg,
  } = useStandardQuery({
    queryKey: ['ai-governance-registry'],
    queryFn: () => apiFetch('/firestorm/ai-governance/registry'),
    staleTime: 30_000,
    retry: false,
  });

  const {
    data: logData,
    isLoading: logLoading,
    isError: logError,
    refetch: refetchLog,
  } = useStandardQuery({
    queryKey: ['ai-governance-log'],
    queryFn: () => apiFetch('/firestorm/ai-governance/log'),
    staleTime: 30_000,
    retry: false,
  });

  const registry: RegistryEntry[] = registryData?.registry ?? [];
  const log: LogEntry[] = logData?.log ?? [];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1300px]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            AI Model Registry & Governance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live registry of active AI models with version tracking, confidence baselines, and a
            full inference audit log
          </p>
        </div>
        <button
          onClick={() => {
            void refetchReg();
            void refetchLog();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Model Registry
          </h2>
        </div>
        {regError ? (
          <ApiErrorBanner message="Could not load model registry — check your session and try again." />
        ) : (
          <ModelRegistryTable entries={registry} isLoading={regLoading} />
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Inference Governance Log
          </h2>
        </div>
        {logError ? (
          <ApiErrorBanner message="Could not load inference log — check your session and try again." />
        ) : (
          <GovernanceLog entries={log} isLoading={logLoading} />
        )}
      </section>
    </div>
  );
}
