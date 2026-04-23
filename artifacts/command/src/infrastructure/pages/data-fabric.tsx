/**
 * Data Fabric — connector framework health page.
 *
 * Surfaces every registered external-data connector with its current health,
 * last sync, drift severity, and dead-letter count. Operators can manually
 * trigger a sync, pause, or resume each connector.
 */

import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Anchor,
  CheckCircle2,
  Database,
  Pause,
  Play,
  RefreshCw,
  ShieldAlert,
  Skull,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

const BASE_URL = (import.meta.env.BASE_URL ?? '/imperium/').replace(/\/$/, '');
const API_BASE = `${BASE_URL}/api/connectors`;

type ConnectorKind = 'real-estate' | 'maritime' | 'sanctions' | 'finance' | 'security' | 'other';
type SyncStatus = 'ok' | 'retried' | 'dead-letter' | 'skipped';
type DriftSeverity = 'none' | 'info' | 'warn' | 'critical';

interface DriftReport {
  connectorId: string;
  baselineRecordCount: number | null;
  currentRecordCount: number;
  volumeDrift: number;
  schemaDrift: number;
  addedFields: string[];
  removedFields: string[];
  severity: DriftSeverity;
}

interface ConnectorHealth {
  connectorId: string;
  name: string;
  kind: ConnectorKind;
  source: string;
  enabled: boolean;
  scheduleSec: number;
  lastSyncAt: string | null;
  lastStatus: SyncStatus | null;
  lastDuration: number | null;
  consecutiveFailures: number;
  totalSyncs: number;
  totalEntities: number;
  drift: DriftReport | null;
  deadLettered: number;
}

interface SyncResult {
  connectorId: string;
  name?: string;
  status: SyncStatus;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  attempts: number;
  recordsFetched: number;
  recordsTransformed: number;
  recordsRejected: number;
  entitiesRegistered: number;
  ledgerEventId: string | null;
  drift: DriftReport | null;
  errorMessage: string | null;
}

const KIND_ICONS: Record<ConnectorKind, LucideIcon> = {
  'real-estate': Database,
  maritime: Waves,
  sanctions: ShieldAlert,
  finance: Database,
  security: ShieldAlert,
  other: Database,
};

const SEVERITY_COLOR: Record<DriftSeverity, string> = {
  none: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
  info: 'text-sky-300 border-sky-500/30 bg-sky-500/10',
  warn: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
  critical: 'text-rose-300 border-rose-500/30 bg-rose-500/10',
};

const STATUS_BADGE: Record<SyncStatus, { label: string; cls: string }> = {
  ok: { label: 'OK', cls: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
  retried: { label: 'RETRIED', cls: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
  'dead-letter': { label: 'DEAD-LETTER', cls: 'text-rose-300 bg-rose-500/10 border-rose-500/30' },
  skipped: { label: 'SKIPPED', cls: 'text-slate-300 bg-slate-500/10 border-slate-500/30' },
};

function fmtRel(iso: string | null): string {
  if (!iso) return '—';
  const d = Date.now() - new Date(iso).getTime();
  if (d < 60_000) return `${Math.round(d / 1000)}s ago`;
  if (d < 3_600_000) return `${Math.round(d / 60_000)}m ago`;
  if (d < 86_400_000) return `${Math.round(d / 3_600_000)}h ago`;
  return `${Math.round(d / 86_400_000)}d ago`;
}

function fmtSchedule(sec: number): string {
  if (sec === 0) return 'on-demand';
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}m`;
  if (sec < 86400) return `${Math.round(sec / 3600)}h`;
  return `${Math.round(sec / 86400)}d`;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export default function DataFabricPage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const healthQ = useStandardQuery<{ health: ConnectorHealth[]; generatedAt: string }>({
    queryKey: ['connectors', 'health'],
    queryFn: () => fetchJson(`${API_BASE}/health`),
    refetchInterval: 15_000,
  });
  const runsQ = useStandardQuery<{ runs: SyncResult[] }>({
    queryKey: ['connectors', 'runs'],
    queryFn: () => fetchJson(`${API_BASE}/runs`),
    refetchInterval: 15_000,
  });

  const syncM = useStandardMutation({
    mutationFn: (id: string) => fetchJson(`${API_BASE}/sync/${id}`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['connectors'] });
    },
  });
  const pauseM = useStandardMutation({
    mutationFn: (id: string) =>
      fetchJson(`${API_BASE}/pause/${id}`, { method: 'POST', body: '{}' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['connectors'] }),
  });
  const resumeM = useStandardMutation({
    mutationFn: (id: string) =>
      fetchJson(`${API_BASE}/resume/${id}`, { method: 'POST', body: '{}' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['connectors'] }),
  });

  const health = healthQ.data?.health ?? [];
  const runs = runsQ.data?.runs ?? [];

  const totalEntities = health.reduce((s, h) => s + h.totalEntities, 0);
  const deadLettered = health.reduce((s, h) => s + h.deadLettered, 0);
  const driftCritical = health.filter((h) => h.drift?.severity === 'critical').length;
  const driftWarn = health.filter((h) => h.drift?.severity === 'warn').length;

  return (
    <div className="p-6 space-y-6 text-slate-200">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
            DATA FABRIC // EXTERNAL CONNECTORS
          </div>
          <h1 className="text-2xl font-semibold text-white mt-1">Connector Health</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Typed external-data connectors with scheduling, retry, dead-letter, drift detection,
            and audit-ledger integration. Every sync registers entities into the ontology graph
            and writes a hash-chained audit event.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryTile label="Connectors" value={String(health.length)} />
        <SummaryTile label="Entities Registered" value={totalEntities.toLocaleString()} />
        <SummaryTile
          label="Critical Drift"
          value={String(driftCritical)}
          accent={driftCritical > 0 ? 'critical' : 'ok'}
        />
        <SummaryTile
          label="Warn Drift"
          value={String(driftWarn)}
          accent={driftWarn > 0 ? 'warn' : 'ok'}
        />
        <SummaryTile
          label="Dead-Lettered"
          value={String(deadLettered)}
          accent={deadLettered > 0 ? 'critical' : 'ok'}
        />
      </section>

      <section className="rounded border border-white/10 bg-slate-950/60 overflow-hidden">
        <header className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="text-sm font-semibold text-white">Connectors</div>
          <button
            type="button"
            onClick={() => qc.invalidateQueries({ queryKey: ['connectors'] })}
            className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" /> REFRESH
          </button>
        </header>
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="text-left px-4 py-2">Connector</th>
              <th className="text-left px-4 py-2">Schedule</th>
              <th className="text-left px-4 py-2">Last sync</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Drift</th>
              <th className="text-left px-4 py-2">Entities</th>
              <th className="text-right px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {health.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Loading connector health…
                </td>
              </tr>
            )}
            {health.map((h) => {
              const Icon = KIND_ICONS[h.kind] ?? Database;
              return (
                <tr
                  key={h.connectorId}
                  className={`border-t border-white/5 cursor-pointer hover:bg-white/[0.02] ${
                    selectedId === h.connectorId ? 'bg-white/[0.03]' : ''
                  }`}
                  onClick={() =>
                    setSelectedId(selectedId === h.connectorId ? null : h.connectorId)
                  }
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-slate-400" />
                      <div>
                        <div className="font-medium text-white">{h.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{h.source}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{fmtSchedule(h.scheduleSec)}</td>
                  <td className="px-4 py-3 text-slate-300">{fmtRel(h.lastSyncAt)}</td>
                  <td className="px-4 py-3">
                    {h.lastStatus ? (
                      <span
                        className={`inline-block px-2 py-0.5 rounded border text-[10px] tracking-wider ${
                          STATUS_BADGE[h.lastStatus].cls
                        }`}
                      >
                        {STATUS_BADGE[h.lastStatus].label}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-xs">never run</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {h.drift ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] tracking-wider ${
                          SEVERITY_COLOR[h.drift.severity]
                        }`}
                      >
                        {h.drift.severity === 'critical' ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : h.drift.severity === 'none' ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <ShieldAlert className="h-3 w-3" />
                        )}
                        {h.drift.severity.toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-xs">no baseline</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{h.totalEntities.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        disabled={syncM.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          syncM.mutate(h.connectorId);
                        }}
                        className="text-xs px-2 py-1 border border-white/15 rounded hover:bg-white/[0.05] inline-flex items-center gap-1 disabled:opacity-40"
                      >
                        <RefreshCw className="h-3 w-3" /> SYNC
                      </button>
                      {h.enabled ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            pauseM.mutate(h.connectorId);
                          }}
                          className="text-xs px-2 py-1 border border-white/15 rounded hover:bg-white/[0.05] inline-flex items-center gap-1"
                        >
                          <Pause className="h-3 w-3" /> PAUSE
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            resumeM.mutate(h.connectorId);
                          }}
                          className="text-xs px-2 py-1 border border-emerald-500/30 text-emerald-300 rounded hover:bg-emerald-500/10 inline-flex items-center gap-1"
                        >
                          <Play className="h-3 w-3" /> RESUME
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {selectedId && <SelectedDetail connectorId={selectedId} />}

      <section className="rounded border border-white/10 bg-slate-950/60 overflow-hidden">
        <header className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
          <Anchor className="h-3.5 w-3.5 text-slate-500" />
          <div className="text-sm font-semibold text-white">Recent sync runs</div>
          <span className="text-xs text-slate-500">(last 50, hash-chained in audit ledger)</span>
        </header>
        {runs.length === 0 ? (
          <div className="px-4 py-8 text-center text-slate-500 text-sm">
            No syncs yet — click <span className="font-mono">SYNC</span> on any connector above.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02] text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="text-left px-4 py-2">When</th>
                <th className="text-left px-4 py-2">Connector</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-right px-4 py-2">Records</th>
                <th className="text-right px-4 py-2">Entities</th>
                <th className="text-right px-4 py-2">Duration</th>
                <th className="text-left px-4 py-2">Ledger event</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={`${r.connectorId}-${r.startedAt}`} className="border-t border-white/5">
                  <td className="px-4 py-2 text-slate-300">{fmtRel(r.startedAt)}</td>
                  <td className="px-4 py-2 text-white">{r.name ?? r.connectorId}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded border text-[10px] tracking-wider ${
                        STATUS_BADGE[r.status].cls
                      }`}
                    >
                      {STATUS_BADGE[r.status].label}
                    </span>
                    {r.status === 'dead-letter' && (
                      <Skull className="inline ml-2 h-3 w-3 text-rose-400" />
                    )}
                  </td>
                  <td className="px-4 py-2 text-right text-slate-300">
                    {r.recordsTransformed}/{r.recordsFetched}
                  </td>
                  <td className="px-4 py-2 text-right text-slate-300">
                    {r.entitiesRegistered}
                  </td>
                  <td className="px-4 py-2 text-right text-slate-400">{r.durationMs}ms</td>
                  <td className="px-4 py-2 font-mono text-[11px] text-slate-500">
                    {r.ledgerEventId ? r.ledgerEventId.slice(0, 16) + '…' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  accent = 'ok',
}: {
  label: string;
  value: string;
  accent?: 'ok' | 'warn' | 'critical';
}) {
  const color =
    accent === 'critical'
      ? 'border-rose-500/30 bg-rose-500/5 text-rose-300'
      : accent === 'warn'
        ? 'border-amber-500/30 bg-amber-500/5 text-amber-300'
        : 'border-white/10 bg-white/[0.02] text-white';
  return (
    <div className={`rounded border p-3 ${color}`}>
      <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">{label}</div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

interface DetailResponse {
  connector: {
    id: string;
    name: string;
    kind: ConnectorKind;
    description: string;
    source: string;
    schedule: { intervalSec: number; maxRetries: number; timeoutMs: number };
  };
  health: ConnectorHealth | null;
  baseline: { recordCount: number; fieldNames: string[]; capturedAt: string } | null;
  history: SyncResult[];
  escalations: SyncResult[];
}

function SelectedDetail({ connectorId }: { connectorId: string }) {
  const detailQ = useStandardQuery<DetailResponse>({
    queryKey: ['connectors', 'detail', connectorId],
    queryFn: () => fetchJson(`${API_BASE}/${connectorId}`),
    refetchInterval: 15_000,
  });
  if (!detailQ.data) {
    return (
      <section className="rounded border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-400">
        Loading detail…
      </section>
    );
  }
  const { connector, baseline, escalations } = detailQ.data;
  return (
    <section className="rounded border border-white/10 bg-slate-950/60 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500">CONNECTOR</div>
          <div className="text-base font-semibold text-white">{connector.name}</div>
          <div className="text-xs text-slate-400 mt-1 max-w-2xl">{connector.description}</div>
        </div>
        <div className="text-right text-[11px] text-slate-500 font-mono">
          retries: {connector.schedule.maxRetries} · timeout: {connector.schedule.timeoutMs}ms
        </div>
      </div>
      {baseline && (
        <div className="rounded border border-white/10 bg-slate-900/40 p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
            DRIFT BASELINE
          </div>
          <div className="text-xs text-slate-300">
            {baseline.recordCount} records · captured {fmtRel(baseline.capturedAt)} · fields:{' '}
            <span className="font-mono text-slate-400">{baseline.fieldNames.join(', ')}</span>
          </div>
        </div>
      )}
      {escalations.length > 0 && (
        <div className="rounded border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="text-[10px] uppercase tracking-wider text-amber-300 mb-2 inline-flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> OPERATOR-RUNTIME ESCALATIONS
          </div>
          <ul className="text-xs text-slate-300 space-y-1">
            {escalations.map((e, i) => (
              <li key={i}>
                {fmtRel(e.startedAt)} — {e.status}
                {e.errorMessage ? ` · ${e.errorMessage}` : ''}
                {e.drift ? ` · drift ${e.drift.severity}` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
