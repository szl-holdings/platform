import { ClassificationBadge } from '@imp/components/classification-badge';
import {
  type DrawdownRequest,
  type ReservePool,
  type ReserveTrendPoint,
  type ReserveStatus,
  type Classification,
} from '@imp/lib/imperium-data';
import { cn } from '@imp/lib/utils';
import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ChevronDown, ChevronUp, Clock, Database, RotateCcw, TrendingDown, X } from 'lucide-react';
import React, { useState } from 'react';

const BASE_URL = (import.meta.env.BASE_URL ?? '/imperium/').replace(/\/$/, '');
const API_BASE = `${BASE_URL}/api/command/sync/reserves`;

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

interface PoolDTO {
  id: string;
  name: string;
  category: string;
  totalCapacity: number;
  currentLevel: number;
  unit: string;
  status: ReserveStatus;
  classification: Classification;
  lastDrawdown?: string;
  notes: string;
  trendHistory: ReserveTrendPoint[];
}

interface DrawdownDTO {
  id: string;
  poolId: string;
  amount: number;
  justification: string;
  requestedBy: string;
  requestedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface ReservesResponse {
  data: { pools: PoolDTO[]; drawdowns: DrawdownDTO[] };
}

const RESERVES_QUERY_KEY = ['command-sync', 'reserves'] as const;

function dtoToPool(p: PoolDTO): ReservePool {
  return {
    ...p,
    lastDrawdown: p.lastDrawdown ? new Date(p.lastDrawdown) : undefined,
  };
}

function dtoToDrawdown(d: DrawdownDTO): DrawdownRequest {
  return { ...d, requestedAt: new Date(d.requestedAt) };
}

const STATUS_CONFIG: Record<ReserveStatus, { color: string; bg: string; border: string }> = {
  NOMINAL: { color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.25)' },
  REDUCED: { color: '#facc15', bg: 'rgba(250,204,21,0.08)', border: 'rgba(250,204,21,0.25)' },
  CRITICAL: { color: '#fb923c', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.25)' },
  DEPLETED: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)' },
};

const DRAWDOWN_STATUS_CONFIG = {
  PENDING: { color: '#facc15', label: 'PENDING' },
  APPROVED: { color: '#4ade80', label: 'APPROVED' },
  REJECTED: { color: '#ef4444', label: 'REJECTED' },
};

function pct(pool: ReservePool) {
  return Math.round((pool.currentLevel / pool.totalCapacity) * 100);
}

const W = 220;
const H = 44;
const PAD = 2;

function ReserveTrendChart({
  data,
  color,
  unit,
  chartId,
}: {
  data: ReserveTrendPoint[];
  color: string;
  unit: string;
  chartId: string;
}) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    point: ReserveTrendPoint;
  } | null>(null);

  if (!data || data.length < 2) return null;

  const firstPoint = data[0]!;
  const lastPoint = data[data.length - 1]!;

  const levels = data.map((d) => d.level);
  const minV = Math.min(...levels);
  const maxV = Math.max(...levels);
  const range = maxV - minV || 1;

  function toX(i: number) {
    return PAD + (i / (data.length - 1)) * (W - PAD * 2);
  }
  function toY(v: number) {
    return PAD + (1 - (v - minV) / range) * (H - PAD * 2);
  }

  const points = data.map((d, i) => `${toX(i)},${toY(d.level)}`).join(' ');
  const areaPoints = [
    `${toX(0)},${H}`,
    ...data.map((d, i) => `${toX(i)},${toY(d.level)}`),
    `${toX(data.length - 1)},${H}`,
  ].join(' ');

  const areaId = `area-fill-${chartId}`;

  return (
    <div className="relative w-full mt-3 mb-1">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        className="overflow-visible"
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <polygon points={areaPoints} fill={`url(#${areaId})`} />

        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {data.map((d, i) => (
          <circle
            key={i}
            cx={toX(i)}
            cy={toY(d.level)}
            r={tooltip?.point === d ? 3.5 : 2.5}
            fill={tooltip?.point === d ? color : 'rgba(10,13,26,0.9)'}
            stroke={color}
            strokeWidth="1.5"
            className="cursor-crosshair"
            onMouseEnter={(e) => {
              const svg = e.currentTarget.closest('svg') as SVGSVGElement;
              const rect = svg.getBoundingClientRect();
              const cx = (toX(i) / W) * rect.width + rect.left;
              const cy = (toY(d.level) / H) * rect.height + rect.top;
              setTooltip({ x: cx, y: cy, point: d });
            }}
          />
        ))}
      </svg>

      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none px-2 py-1 rounded border font-mono text-[10px] shadow-xl whitespace-nowrap"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 32,
            background: '#0a0d1a',
            borderColor: `${color}55`,
            color,
          }}
        >
          <span className="text-slate-500 mr-1">{tooltip.point.date}</span>
          {typeof tooltip.point.level === 'number' && tooltip.point.level % 1 !== 0
            ? tooltip.point.level.toFixed(2)
            : tooltip.point.level}{' '}
          {unit}
        </div>
      )}

      <div className="flex justify-between text-[9px] text-slate-700 font-mono mt-0.5 px-0.5">
        <span>{firstPoint.date.slice(5)}</span>
        <span className="text-slate-600">7-day trend</span>
        <span>{lastPoint.date.slice(5)}</span>
      </div>
    </div>
  );
}

function ReservePoolCard({
  pool,
  onDrawdown,
}: {
  pool: ReservePool;
  onDrawdown: (poolId: string) => void;
}) {
  const percentage = pct(pool);
  const statusCfg = STATUS_CONFIG[pool.status];
  const timeAgo = pool.lastDrawdown
    ? Math.round((Date.now() - pool.lastDrawdown.getTime()) / 3600000)
    : null;

  return (
    <div
      className="rounded-lg border p-4 transition-all"
      style={{ background: 'rgba(10,13,26,0.95)', borderColor: statusCfg.border }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="font-display text-xs tracking-[0.15em] gold-text font-semibold">
            {pool.name}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{pool.category}</div>
        </div>
        <div className="flex items-center gap-2">
          <ClassificationBadge classification={pool.classification} size="xs" />
          <span
            className="px-2 py-0.5 rounded font-mono text-[9px] tracking-widest border"
            style={{
              color: statusCfg.color,
              background: statusCfg.bg,
              borderColor: statusCfg.border,
            }}
          >
            {pool.status}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-end justify-between">
          <span className="font-mono text-xl font-bold" style={{ color: statusCfg.color }}>
            {typeof pool.currentLevel === 'number' && pool.currentLevel % 1 !== 0
              ? pool.currentLevel.toFixed(2)
              : pool.currentLevel}
            <span className="text-xs text-slate-500 ml-1">{pool.unit}</span>
          </span>
          <span className="text-xs text-slate-500 font-mono">
            / {pool.totalCapacity} {pool.unit}
          </span>
        </div>

        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${percentage}%`, backgroundColor: statusCfg.color }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-600">
          <span>{percentage}% remaining</span>
          {timeAgo !== null && (
            <span className="flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" /> Last drawdown: {timeAgo}h ago
            </span>
          )}
        </div>
      </div>

      <ReserveTrendChart
        data={pool.trendHistory}
        color={statusCfg.color}
        unit={pool.unit}
        chartId={pool.id}
      />

      <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{pool.notes}</p>

      <button
        onClick={() => onDrawdown(pool.id)}
        disabled={pool.status === 'DEPLETED'}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-2 rounded font-mono text-[10px] tracking-widest font-bold border transition-all',
          pool.status === 'DEPLETED'
            ? 'border-white/5 text-slate-600 cursor-not-allowed'
            : 'border-gold/30 text-gold hover:bg-gold/10',
        )}
      >
        <TrendingDown className="w-3.5 h-3.5" />
        REQUEST DRAWDOWN
      </button>
    </div>
  );
}

interface DrawdownForm {
  poolId: string;
  amount: string;
  justification: string;
  requestedBy: string;
}

function DrawdownModal({
  poolId,
  pools,
  onClose,
  onSubmit,
}: {
  poolId: string;
  pools: ReservePool[];
  onClose: () => void;
  onSubmit: (req: DrawdownRequest) => void;
}) {
  const pool = pools.find((p) => p.id === poolId)!;
  const [form, setForm] = useState<DrawdownForm>({
    poolId,
    amount: '',
    justification: '',
    requestedBy: 'Commander — Direct Request',
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0 || amount > pool.currentLevel || !form.justification.trim()) return;
    onSubmit({
      id: `dd-${Date.now()}`,
      poolId,
      amount,
      justification: form.justification.trim(),
      requestedBy: form.requestedBy.trim() || 'Commander',
      requestedAt: new Date(),
      status: 'PENDING',
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div
        className="w-full max-w-md rounded-xl border p-6 shadow-2xl"
        style={{ background: '#0a0d1a', borderColor: 'rgba(201,162,39,0.25)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4" style={{ color: '#c9a227' }} />
            <span className="font-display text-sm tracking-[0.15em] gold-text uppercase">
              Drawdown Request
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/5 rounded transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="imperial-card rounded-lg p-3 mb-4">
          <div className="font-display text-xs gold-text tracking-[0.12em]">{pool.name}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Available: {pool.currentLevel} {pool.unit} ({pct(pool)}% remaining)
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono tracking-wider text-slate-500 mb-1.5">
              AMOUNT ({pool.unit}) *
            </label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder={`e.g. ${Math.round(pool.currentLevel * 0.2)}`}
              min="0"
              max={pool.currentLevel}
              step="any"
              className="w-full bg-white/3 border border-white/10 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-gold/30 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono tracking-wider text-slate-500 mb-1.5">
              REQUESTED BY
            </label>
            <input
              type="text"
              value={form.requestedBy}
              onChange={(e) => setForm((f) => ({ ...f, requestedBy: e.target.value }))}
              placeholder="Name or system identifier"
              className="w-full bg-white/3 border border-white/10 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-gold/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono tracking-wider text-slate-500 mb-1.5">
              OPERATIONAL JUSTIFICATION *
            </label>
            <textarea
              value={form.justification}
              onChange={(e) => setForm((f) => ({ ...f, justification: e.target.value }))}
              placeholder="Reason for the drawdown — operational necessity, time window, expected restoration..."
              rows={3}
              className="w-full bg-white/3 border border-white/10 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-gold/30 transition-colors resize-none"
              required
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded font-mono text-[11px] tracking-widest border border-white/10 text-slate-400 hover:bg-white/3 transition-all"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded font-mono text-[11px] tracking-widest font-bold border transition-all hover:bg-gold/10"
              style={{ borderColor: 'rgba(201,162,39,0.4)', color: '#c9a227' }}
            >
              SUBMIT REQUEST
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DrawdownHistoryItem({ request, pool }: { request: DrawdownRequest; pool?: ReservePool }) {
  const statusCfg = DRAWDOWN_STATUS_CONFIG[request.status];
  const timeAgo = Math.round((Date.now() - request.requestedAt.getTime()) / 3600000);

  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
      <div
        className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
        style={{ backgroundColor: statusCfg.color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-300 font-mono">{pool?.name ?? request.poolId}</span>
          <span className="text-[10px] font-mono text-slate-500">
            {request.amount} {pool?.unit ?? 'units'}
          </span>
          <span
            className="px-1.5 py-0.5 rounded font-mono text-[9px] tracking-widest"
            style={{ color: statusCfg.color }}
          >
            {statusCfg.label}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{request.justification}</p>
        <div className="text-[10px] text-slate-600 mt-0.5">
          {request.requestedBy} · {timeAgo < 1 ? 'just now' : `${timeAgo}h ago`}
        </div>
      </div>
    </div>
  );
}

export default function StrategicReserves() {
  const qc = useQueryClient();
  const [drawdownPoolId, setDrawdownPoolId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(true);

  const reservesQ = useStandardQuery<ReservesResponse>({
    queryKey: RESERVES_QUERY_KEY,
    queryFn: () => fetchJson<ReservesResponse>(API_BASE),
  });

  const pools: ReservePool[] = (reservesQ.data?.data.pools ?? []).map(dtoToPool);
  const drawdowns: DrawdownRequest[] = (reservesQ.data?.data.drawdowns ?? []).map(dtoToDrawdown);

  const invalidate = () => qc.invalidateQueries({ queryKey: RESERVES_QUERY_KEY });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // Snapshot helper — react-query cache is mirrored to localStorage by the
  // app-level persistQueryClient, so optimistic writes/rollbacks naturally
  // hit the localStorage cache layer.
  function snapshot(): ReservesResponse {
    return (
      qc.getQueryData<ReservesResponse>(RESERVES_QUERY_KEY) ?? {
        data: { pools: [], drawdowns: [] },
      }
    );
  }

  const submitMut = useStandardMutation({
    mutationFn: (req: DrawdownRequest) =>
      fetchJson(`${API_BASE}/drawdowns`, {
        method: 'POST',
        body: JSON.stringify({
          id: req.id,
          poolId: req.poolId,
          amount: req.amount,
          justification: req.justification,
          requestedBy: req.requestedBy,
          requestedAt: req.requestedAt.toISOString(),
        }),
      }),
    onMutate: async (req: DrawdownRequest) => {
      await qc.cancelQueries({ queryKey: RESERVES_QUERY_KEY });
      const prev = snapshot();
      const optimistic: DrawdownDTO = {
        id: req.id,
        poolId: req.poolId,
        amount: req.amount,
        justification: req.justification,
        requestedBy: req.requestedBy,
        requestedAt: req.requestedAt.toISOString(),
        status: 'PENDING',
      };
      qc.setQueryData<ReservesResponse>(RESERVES_QUERY_KEY, {
        data: {
          pools: prev.data.pools,
          drawdowns: [optimistic, ...prev.data.drawdowns],
        },
      });
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(RESERVES_QUERY_KEY, ctx.prev);
      showToast(`Submit failed: ${e.message}`);
    },
    onSuccess: () => {
      setDrawdownPoolId(null);
      showToast('Drawdown request submitted — awaiting approval before reserves are adjusted');
    },
    onSettled: () => invalidate(),
  });

  const approveMut = useStandardMutation({
    mutationFn: (id: string) =>
      fetchJson(`${API_BASE}/drawdowns/${encodeURIComponent(id)}/approve`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: RESERVES_QUERY_KEY });
      const prev = snapshot();
      const req = prev.data.drawdowns.find((d) => d.id === id);
      const updatedDrawdowns = prev.data.drawdowns.map((d) =>
        d.id === id ? { ...d, status: 'APPROVED' as const } : d,
      );
      const updatedPools = req
        ? prev.data.pools.map((p) => {
            if (p.id !== req.poolId) return p;
            const newLevel = Math.max(0, p.currentLevel - req.amount);
            const pctLeft = (newLevel / p.totalCapacity) * 100;
            const newStatus =
              pctLeft === 0
                ? ('DEPLETED' as const)
                : pctLeft < 15
                  ? ('CRITICAL' as const)
                  : pctLeft < 35
                    ? ('REDUCED' as const)
                    : ('NOMINAL' as const);
            return {
              ...p,
              currentLevel: newLevel,
              status: newStatus,
              lastDrawdown: new Date().toISOString(),
            };
          })
        : prev.data.pools;
      qc.setQueryData<ReservesResponse>(RESERVES_QUERY_KEY, {
        data: { pools: updatedPools, drawdowns: updatedDrawdowns },
      });
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(RESERVES_QUERY_KEY, ctx.prev);
      showToast(`Approval failed: ${e.message}`);
    },
    onSuccess: () => showToast('Drawdown approved — reserve levels updated'),
    onSettled: () => invalidate(),
  });

  const rejectMut = useStandardMutation({
    mutationFn: (id: string) =>
      fetchJson(`${API_BASE}/drawdowns/${encodeURIComponent(id)}/reject`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: RESERVES_QUERY_KEY });
      const prev = snapshot();
      qc.setQueryData<ReservesResponse>(RESERVES_QUERY_KEY, {
        data: {
          pools: prev.data.pools,
          drawdowns: prev.data.drawdowns.map((d) =>
            d.id === id ? { ...d, status: 'REJECTED' as const } : d,
          ),
        },
      });
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(RESERVES_QUERY_KEY, ctx.prev);
      showToast(`Rejection failed: ${e.message}`);
    },
    onSuccess: () => showToast('Drawdown rejected — reserves unchanged'),
    onSettled: () => invalidate(),
  });

  function handleDrawdownSubmit(request: DrawdownRequest) {
    submitMut.mutate(request);
  }

  function handleApprove(id: string) {
    approveMut.mutate(id);
  }

  const resetMut = useStandardMutation({
    mutationFn: () =>
      fetchJson<ReservesResponse>(`${API_BASE}/reset`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    onSuccess: (resp) => {
      qc.setQueryData<ReservesResponse>(RESERVES_QUERY_KEY, resp);
      showToast('Reserves reset to defaults');
    },
    onError: (e: Error) => showToast(`Reset failed: ${e.message}`),
    onSettled: () => invalidate(),
  });

  function handleReset() {
    if (
      window.confirm(
        'Reset reserve pools and drawdown history to the original demo data? Any changes you made will be lost.',
      )
    ) {
      resetMut.mutate();
    }
  }

  function handleReject(id: string) {
    rejectMut.mutate(id);
  }

  const nominalCount = pools.filter((p) => p.status === 'NOMINAL').length;
  const reducedCount = pools.filter((p) => p.status === 'REDUCED').length;
  const criticalCount = pools.filter(
    (p) => p.status === 'CRITICAL' || p.status === 'DEPLETED',
  ).length;
  const pendingCount = drawdowns.filter((d) => d.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg border font-mono text-xs tracking-wider shadow-xl"
          style={{ background: '#0a0d1a', borderColor: 'rgba(201,162,39,0.4)', color: '#c9a227' }}
        >
          {toast}
        </div>
      )}

      {drawdownPoolId && (
        <DrawdownModal
          poolId={drawdownPoolId}
          pools={pools}
          onClose={() => setDrawdownPoolId(null)}
          onSubmit={handleDrawdownSubmit}
        />
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5" style={{ color: '#c9a227' }} />
            <h1 className="font-display text-lg tracking-[0.2em] gold-text gold-glow font-bold uppercase">
              Strategic Reserve Dashboard
            </h1>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 rounded font-mono text-[11px] tracking-widest border transition-all hover:bg-white/5"
            style={{ borderColor: 'rgba(148,163,184,0.25)', color: '#94a3b8' }}
            title="Restore the original demo reserve pools and drawdown history"
          >
            <RotateCcw className="w-3.5 h-3.5" /> RESET TO DEFAULTS
          </button>
        </div>
        <p className="text-xs text-slate-500 ml-8">
          Monitor reserve pools and submit drawdown requests — changes reflected immediately
        </p>
      </div>

      {reservesQ.isError && (
        <div className="rounded-lg border border-red-900/40 bg-red-950/20 p-3 text-xs font-mono text-red-400">
          Failed to load strategic reserves: {(reservesQ.error as Error).message}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Nominal', value: nominalCount, color: '#4ade80' },
          { label: 'Reduced', value: reducedCount, color: '#facc15' },
          { label: 'Critical / Depleted', value: criticalCount, color: '#ef4444' },
          { label: 'Pending Drawdowns', value: pendingCount, color: '#c9a227' },
        ].map(({ label, value, color }) => (
          <div key={label} className="imperial-card rounded-lg p-3 text-center">
            <div className="font-mono text-2xl font-bold" style={{ color }}>
              {value}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 tracking-wider">{label}</div>
          </div>
        ))}
      </div>

      {reservesQ.isLoading && pools.length === 0 ? (
        <div className="text-center py-12 text-slate-600 text-sm font-mono">LOADING RESERVES…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {pools.map((pool) => (
            <ReservePoolCard key={pool.id} pool={pool} onDrawdown={setDrawdownPoolId} />
          ))}
        </div>
      )}

      <div className="imperial-card rounded-lg overflow-hidden">
        <button
          onClick={() => setHistoryOpen(!historyOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-white/2 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: '#c9a227' }} />
            <span className="font-display text-xs tracking-[0.15em] gold-text uppercase">
              Drawdown History ({drawdowns.length})
            </span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded font-mono text-[9px] bg-yellow-950/40 border border-yellow-900/30 text-yellow-400">
                {pendingCount} PENDING
              </span>
            )}
          </div>
          {historyOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {historyOpen && (
          <div className="px-4 pb-4 border-t border-white/5">
            {drawdowns.length === 0 ? (
              <div className="text-center py-8 text-slate-600 text-sm font-mono">
                NO DRAWDOWN HISTORY
              </div>
            ) : (
              <div>
                {drawdowns.filter((d) => d.status === 'PENDING').length > 0 && (
                  <div className="mt-3 mb-2">
                    <div className="text-[10px] font-mono tracking-wider text-yellow-400 mb-2">
                      AWAITING APPROVAL
                    </div>
                    {drawdowns
                      .filter((d) => d.status === 'PENDING')
                      .map((req) => {
                        const pool = pools.find((p) => p.id === req.poolId);
                        return (
                          <div
                            key={req.id}
                            className="flex items-center gap-2 py-2 border-b border-white/5"
                          >
                            <div className="flex-1 min-w-0">
                              <DrawdownHistoryItem request={req} pool={pool} />
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0 ml-2">
                              <button
                                onClick={() => handleApprove(req.id)}
                                className="p-1.5 rounded border transition-all hover:bg-green-500/10"
                                style={{ borderColor: '#4ade8040', color: '#4ade80' }}
                                title="Approve"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleReject(req.id)}
                                className="p-1.5 rounded border transition-all hover:bg-red-500/10"
                                style={{ borderColor: '#ef444430', color: '#ef4444' }}
                                title="Reject"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                {drawdowns.filter((d) => d.status !== 'PENDING').length > 0 && (
                  <div className="mt-3">
                    <div className="text-[10px] font-mono tracking-wider text-slate-500 mb-1">
                      DECIDED
                    </div>
                    {drawdowns
                      .filter((d) => d.status !== 'PENDING')
                      .map((req) => {
                        const pool = pools.find((p) => p.id === req.poolId);
                        return <DrawdownHistoryItem key={req.id} request={req} pool={pool} />;
                      })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
