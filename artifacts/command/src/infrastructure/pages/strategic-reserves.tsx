import { ClassificationBadge } from '@imp/components/classification-badge';
import {
  type DrawdownRequest,
  INITIAL_DRAWDOWNS,
  INITIAL_RESERVES,
  type ReservePool,
  type ReserveStatus,
} from '@imp/lib/imperium-data';
import { cn } from '@imp/lib/utils';
import { Check, ChevronDown, ChevronUp, Clock, Database, TrendingDown, X } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

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
  const [pools, setPools] = useState<ReservePool[]>(INITIAL_RESERVES);
  const [drawdowns, setDrawdowns] = useState<DrawdownRequest[]>(INITIAL_DRAWDOWNS);
  const [drawdownPoolId, setDrawdownPoolId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(true);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleDrawdownSubmit(request: DrawdownRequest) {
    setDrawdowns((prev) => [request, ...prev]);
    setDrawdownPoolId(null);
    showToast('Drawdown request submitted — awaiting approval before reserves are adjusted');
  }

  function applyDrawdownToPool(poolId: string, amount: number) {
    setPools((prev) =>
      prev.map((p) => {
        if (p.id !== poolId) return p;
        const newLevel = Math.max(0, p.currentLevel - amount);
        const pctLeft = (newLevel / p.totalCapacity) * 100;
        const newStatus: ReserveStatus =
          pctLeft === 0
            ? 'DEPLETED'
            : pctLeft < 15
              ? 'CRITICAL'
              : pctLeft < 35
                ? 'REDUCED'
                : 'NOMINAL';
        return { ...p, currentLevel: newLevel, status: newStatus, lastDrawdown: new Date() };
      }),
    );
  }

  function handleApprove(id: string) {
    const request = drawdowns.find((d) => d.id === id);
    if (!request || request.status !== 'PENDING') return;
    applyDrawdownToPool(request.poolId, request.amount);
    setDrawdowns((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'APPROVED' } : d)));
    showToast('Drawdown approved — reserve levels updated');
  }

  function handleReject(id: string) {
    const request = drawdowns.find((d) => d.id === id);
    if (!request || request.status !== 'PENDING') return;
    setDrawdowns((prev) => prev.map((d) => (d.id === id ? { ...d, status: 'REJECTED' } : d)));
    showToast('Drawdown rejected — reserves unchanged');
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
        <div className="flex items-center gap-3 mb-1">
          <Database className="w-5 h-5" style={{ color: '#c9a227' }} />
          <h1 className="font-display text-lg tracking-[0.2em] gold-text gold-glow font-bold uppercase">
            Strategic Reserve Dashboard
          </h1>
        </div>
        <p className="text-xs text-slate-500 ml-8">
          Monitor reserve pools and submit drawdown requests — changes reflected immediately
        </p>
      </div>

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {pools.map((pool) => (
          <ReservePoolCard key={pool.id} pool={pool} onDrawdown={setDrawdownPoolId} />
        ))}
      </div>

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
