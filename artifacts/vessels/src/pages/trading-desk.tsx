import { StatusBadge as DSStatusBadge, type StatusVariant } from '@szl-holdings/design-system';
import {
  Activity,
  AlertCircle,
  Anchor,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Layers,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BalticPill } from '@/components/baltic-pill';

const ACCENT = '#38bdf8';
const GREEN = '#22c55e';
const RED = '#ef4444';
const AMBER = '#f59e0b';
const BG = { page: '#060a10', surface: '#090d14', card: '#0c1220', elevated: '#0f1628' } as const;
const BORDER = {
  subtle: 'rgba(255,255,255,0.04)',
  muted: 'rgba(255,255,255,0.08)',
  accent: `${ACCENT}20`,
} as const;
const TEXT = {
  primary: 'rgba(255,255,255,0.88)',
  secondary: 'rgba(255,255,255,0.55)',
  tertiary: 'rgba(255,255,255,0.28)',
  muted: 'rgba(255,255,255,0.14)',
} as const;

function fmt(n: number | string | null | undefined, decimals = 2): string {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtChange(n: number | string | null | undefined): { text: string; color: string } {
  if (n == null) return { text: '—', color: TEXT.muted };
  const val = Number(n);
  if (val > 0) return { text: `+${fmt(val)}`, color: GREEN };
  if (val < 0) return { text: fmt(val), color: RED };
  return { text: '0.00', color: TEXT.muted };
}

interface Instrument {
  id: number;
  symbol: string;
  name: string;
  instrumentType: string;
  exchange: string;
  currency: string;
  unit: string;
  routeCode?: string;
  currentPrice: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  change: number;
  changePct: number;
  volume: number;
  openInterest: number;
  description?: string;
  isActive: boolean;
}

interface Order {
  id: number;
  instrumentId: number;
  orderRef: string;
  orderType: string;
  side: string;
  status: string;
  quantity: string;
  limitPrice?: string;
  avgFillPrice?: string;
  filledQty: string;
  remainingQty: string;
  notionalValue?: string;
  commission: string;
  submittedAt: string;
  filledAt?: string;
  cancelledAt?: string;
  instrument?: Instrument;
}

interface Position {
  id: number;
  instrumentId: number;
  side: string;
  quantity: string;
  avgEntryPrice: string;
  currentPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  totalPnl: number;
  notionalValue: number;
  openedAt: string;
  instrument?: Instrument;
}

interface Fill {
  id: number;
  orderId: number;
  fillRef: string;
  side: string;
  quantity: string;
  price: string;
  commission: string;
  executionVenue: string;
  filledAt: string;
  instrument?: Instrument;
  instrumentId?: number;
}

interface PnlSummary {
  unrealizedPnl: number;
  realizedPnl: number;
  totalCommission: number;
  netPnl: number;
  openPositions: number;
  winRate: number;
  sharpeRatio: number;
}

type Tab = 'instruments' | 'orders' | 'positions' | 'fills' | 'pnl' | 'voyages';
type Side = 'buy' | 'sell';
type OrderType = 'market' | 'limit';

function Ticker({ instruments, loading }: { instruments: Instrument[]; loading: boolean }) {
  const slice = instruments.slice(0, 8);
  return (
    <div
      className="flex items-center gap-4 overflow-x-auto px-4 py-2 shrink-0"
      style={{ background: BG.card, borderBottom: `1px solid ${BORDER.subtle}` }}
    >
      {loading && (
        <span className="text-[10px] animate-pulse" style={{ color: TEXT.muted }}>
          Loading rates…
        </span>
      )}
      {slice.map((inst) => {
        const chg = fmtChange(inst.changePct);
        return (
          <div key={inst.id} className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold font-mono" style={{ color: ACCENT }}>
              {inst.symbol}
            </span>
            <span className="text-[11px] font-mono" style={{ color: TEXT.primary }}>
              {fmt(inst.currentPrice, 0)}
            </span>
            <div className="flex items-center gap-0.5">
              {inst.changePct > 0 ? (
                <ChevronUp className="w-3 h-3" style={{ color: GREEN }} />
              ) : (
                <ChevronDown className="w-3 h-3" style={{ color: RED }} />
              )}
              <span className="text-[10px] font-mono" style={{ color: chg.color }}>
                {chg.text}%
              </span>
            </div>
            <span className="text-[9px]" style={{ color: TEXT.muted }}>
              {inst.unit}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function OrderEntry({
  instruments,
  onSubmit,
  submitting,
}: {
  instruments: Instrument[];
  onSubmit: (d: any) => void;
  submitting: boolean;
}) {
  const [orderForm, setOrderForm] = useState<{
    side: Side;
    instrumentId: string;
    orderType: OrderType;
    quantity: string;
    limitPrice: string;
    error: string;
  }>({ side: 'buy', instrumentId: '', orderType: 'market', quantity: '', limitPrice: '', error: '' });

  const selected = instruments.find((i) => String(i.id) === orderForm.instrumentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { side, instrumentId, orderType, quantity, limitPrice } = orderForm;
    setOrderForm((f) => ({ ...f, error: '' }));
    if (!instrumentId) {
      setOrderForm((f) => ({ ...f, error: 'Select an instrument' }));
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      setOrderForm((f) => ({ ...f, error: 'Enter a valid quantity' }));
      return;
    }
    if (orderType === 'limit' && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      setOrderForm((f) => ({ ...f, error: 'Enter a limit price' }));
      return;
    }
    onSubmit({
      instrumentId: parseInt(instrumentId, 10),
      side,
      orderType,
      quantity,
      limitPrice: orderType === 'limit' ? limitPrice : undefined,
    });
    setOrderForm((f) => ({ ...f, quantity: '', limitPrice: '' }));
  };

  const notional =
    selected && orderForm.quantity
      ? parseFloat(orderForm.quantity) *
        (orderForm.orderType === 'limit' && orderForm.limitPrice ? parseFloat(orderForm.limitPrice) : selected.currentPrice)
      : null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div
        className="grid grid-cols-2 rounded-lg overflow-hidden"
        style={{ border: `1px solid ${BORDER.muted}` }}
      >
        {(['buy', 'sell'] as Side[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setOrderForm((f) => ({ ...f, side: s }))}
            className="py-2 text-[11px] font-semibold uppercase tracking-wide transition-colors"
            style={{
              background: orderForm.side === s ? (s === 'buy' ? `${GREEN}20` : `${RED}20`) : 'transparent',
              color: orderForm.side === s ? (s === 'buy' ? GREEN : RED) : TEXT.muted,
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div>
        <label
          className="block text-[10px] uppercase tracking-wider mb-1.5"
          style={{ color: TEXT.muted }}
        >
          Instrument
        </label>
        <select
          value={orderForm.instrumentId}
          onChange={(e) => setOrderForm((f) => ({ ...f, instrumentId: e.target.value }))}
          className="w-full rounded-lg px-3 py-2 text-[12px] outline-none"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${BORDER.muted}`,
            color: TEXT.primary,
          }}
        >
          <option value="">Select instrument…</option>
          {instruments.map((i) => (
            <option key={i.id} value={String(i.id)}>
              {i.symbol} — {i.name}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <div
          className="rounded-lg px-3 py-2"
          style={{ background: 'rgba(56,189,248,0.06)', border: `1px solid ${BORDER.accent}` }}
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px]" style={{ color: TEXT.muted }}>
              Last Price
            </span>
            <span className="text-[13px] font-bold font-mono" style={{ color: ACCENT }}>
              {fmt(selected.currentPrice, selected.currentPrice > 100 ? 0 : 2)}{' '}
              <span className="text-[10px] font-normal">{selected.unit}</span>
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-[10px]" style={{ color: TEXT.muted }}>
              H/L
            </span>
            <span className="text-[10px] font-mono" style={{ color: TEXT.secondary }}>
              <span style={{ color: GREEN }}>{fmt(selected.dayHigh, 0)}</span> /{' '}
              <span style={{ color: RED }}>{fmt(selected.dayLow, 0)}</span>
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {(['market', 'limit'] as OrderType[]).map((ot) => (
          <button
            key={ot}
            type="button"
            onClick={() => setOrderForm((f) => ({ ...f, orderType: ot }))}
            className="py-1.5 rounded-lg text-[10px] font-medium capitalize transition-colors"
            style={{
              background: orderForm.orderType === ot ? `${ACCENT}18` : 'rgba(255,255,255,0.04)',
              color: orderForm.orderType === ot ? ACCENT : TEXT.muted,
              border: `1px solid ${orderForm.orderType === ot ? `${ACCENT}40` : BORDER.muted}`,
            }}
          >
            {ot}
          </button>
        ))}
      </div>

      <div>
        <label
          className="block text-[10px] uppercase tracking-wider mb-1.5"
          style={{ color: TEXT.muted }}
        >
          Quantity (lots)
        </label>
        <input
          type="number"
          value={orderForm.quantity}
          onChange={(e) => setOrderForm((f) => ({ ...f, quantity: e.target.value }))}
          placeholder="e.g. 5"
          min="0.1"
          step="0.1"
          className="w-full rounded-lg px-3 py-2 text-[12px] font-mono outline-none"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${BORDER.muted}`,
            color: TEXT.primary,
          }}
        />
      </div>

      {orderForm.orderType === 'limit' && (
        <div>
          <label
            className="block text-[10px] uppercase tracking-wider mb-1.5"
            style={{ color: TEXT.muted }}
          >
            Limit Price
          </label>
          <input
            type="number"
            value={orderForm.limitPrice}
            onChange={(e) => setOrderForm((f) => ({ ...f, limitPrice: e.target.value }))}
            placeholder={selected ? String(Math.round(selected.currentPrice)) : 'Price'}
            min="0.01"
            step="0.01"
            className="w-full rounded-lg px-3 py-2 text-[12px] font-mono outline-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${BORDER.muted}`,
              color: TEXT.primary,
            }}
          />
        </div>
      )}

      {notional != null && (
        <div
          className="rounded-lg px-3 py-2"
          style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER.subtle}` }}
        >
          <div className="flex justify-between text-[11px]">
            <span style={{ color: TEXT.muted }}>Estimated notional</span>
            <span className="font-mono font-semibold" style={{ color: TEXT.primary }}>
              ${fmt(notional, 0)}
            </span>
          </div>
          <div className="flex justify-between text-[10px] mt-1">
            <span style={{ color: TEXT.muted }}>Commission (est.)</span>
            <span className="font-mono" style={{ color: TEXT.secondary }}>
              ${fmt(notional * 0.003, 0)}
            </span>
          </div>
        </div>
      )}

      {orderForm.error && (
        <div
          className="rounded-lg px-3 py-2 flex items-center gap-2"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: RED }} />
          <span className="text-[11px]" style={{ color: RED }}>
            {orderForm.error}
          </span>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="py-2.5 rounded-lg text-[12px] font-semibold uppercase tracking-wide transition-all disabled:opacity-50"
        style={{
          background: orderForm.side === 'buy' ? `${GREEN}22` : `${RED}22`,
          color: orderForm.side === 'buy' ? GREEN : RED,
          border: `1px solid ${orderForm.side === 'buy' ? `${GREEN}40` : `${RED}40`}`,
        }}
      >
        {submitting
          ? 'Submitting…'
          : `${orderForm.orderType === 'market' ? 'Market' : 'Limit'} ${orderForm.side.toUpperCase()}`}
      </button>
    </form>
  );
}

const ORDER_STATUS_VARIANT: Record<string, StatusVariant> = {
  filled: 'success', open: 'active', partially_filled: 'pending',
  pending: 'pending', cancelled: 'neutral', rejected: 'rejected',
};
function StatusBadge({ status }: { status: string }) {
  return <DSStatusBadge variant={ORDER_STATUS_VARIANT[status] ?? 'neutral'} label={status.replace(/_/g, ' ')} />;
}

function SideBadge({ side }: { side: string }) {
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
      style={{
        background: side === 'buy' ? `${GREEN}15` : `${RED}15`,
        color: side === 'buy' ? GREEN : RED,
      }}
    >
      {side}
    </span>
  );
}

export default function TradingDeskPage() {
  const [tab, setTab] = useState<Tab>('instruments');
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [fills, setFills] = useState<Fill[]>([]);
  const [pnl, setPnl] = useState<PnlSummary | null>(null);
  const [liveVoyages, setLiveVoyages] = useState<Array<{ id: number; voyageNumber: string; status: string; departurePortId?: number; arrivalPortId?: number; scheduledDepartureAt?: string; scheduledArrivalAt?: string; revenueUsd?: string; fuelCostUsd?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = useCallback(async () => {
    try {
      const [instRes, ordRes, posRes, fillRes, pnlRes, voyRes] = await Promise.allSettled([
        fetch('/api/vessels/trading/instruments', { credentials: 'include' }).then((r) => r.json()),
        fetch('/api/vessels/trading/orders', { credentials: 'include' }).then((r) => r.json()),
        fetch('/api/vessels/trading/positions', { credentials: 'include' }).then((r) => r.json()),
        fetch('/api/vessels/trading/fills', { credentials: 'include' }).then((r) => r.json()),
        fetch('/api/vessels/trading/pnl', { credentials: 'include' }).then((r) => r.json()),
        fetch('/api/vessels/voyages?limit=50', { credentials: 'include' }).then((r) => r.json()),
      ]);
      if (instRes.status === 'fulfilled') setInstruments(instRes.value?.data?.instruments ?? []);
      if (ordRes.status === 'fulfilled') setOrders(ordRes.value?.data?.orders ?? []);
      if (posRes.status === 'fulfilled') setPositions(posRes.value?.data?.positions ?? []);
      if (fillRes.status === 'fulfilled') setFills(fillRes.value?.data?.fills ?? []);
      if (pnlRes.status === 'fulfilled') setPnl(pnlRes.value?.data?.summary ?? null);
      if (voyRes.status === 'fulfilled') {
        const voys = voyRes.value?.data ?? voyRes.value ?? [];
        setLiveVoyages(Array.isArray(voys) ? voys : []);
      }
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    pollRef.current = setInterval(fetchAll, 30 * 1000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleOrder = async (data: any) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/vessels/trading/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json?.error ?? 'Order failed', 'error');
        return;
      }
      showToast(json?.data?.message ?? 'Order submitted', 'success');
      fetchAll();
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: number) => {
    try {
      const res = await fetch(`/api/vessels/trading/orders/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json?.error ?? 'Cancel failed', 'error');
        return;
      }
      showToast('Order cancelled', 'success');
      fetchAll();
    } catch {
      showToast('Network error', 'error');
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: 'instruments', label: 'Instruments', icon: BarChart3 },
    {
      key: 'orders',
      label: 'Orders',
      icon: Layers,
      count:
        orders.filter((o) => o.status === 'open' || o.status === 'partially_filled').length ||
        undefined,
    },
    { key: 'positions', label: 'Positions', icon: Activity, count: positions.length || undefined },
    { key: 'fills', label: 'Fills', icon: Clock },
    { key: 'pnl', label: 'P&L', icon: DollarSign },
    {
      key: 'voyages',
      label: 'Voyages',
      icon: Anchor,
      count:
        liveVoyages.filter(
          (v) => v.status === 'active' || v.status === 'in_progress',
        ).length || undefined,
    },
  ];

  const totalUnrealized = positions.reduce((s, p) => s + (p.unrealizedPnl ?? 0), 0);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: BG.page }}>
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 rounded-xl px-4 py-3 shadow-2xl flex items-center gap-2 text-[12px]"
          style={{
            background: toast.type === 'success' ? `${GREEN}18` : `${RED}18`,
            border: `1px solid ${toast.type === 'success' ? `${GREEN}40` : `${RED}40`}`,
            color: toast.type === 'success' ? GREEN : RED,
          }}
        >
          {toast.msg}
        </div>
      )}

      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: `1px solid ${BORDER.subtle}` }}
      >
        <div className="flex items-center gap-3">
          <TrendingUp className="w-4 h-4" style={{ color: ACCENT }} />
          <span className="text-[13px] font-semibold" style={{ color: TEXT.primary }}>
            Commodity Trading Desk
          </span>
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px]"
            style={{ background: 'rgba(56,189,248,0.1)', color: ACCENT }}
          >
            Baltic Exchange · Platts · OTC
          </span>
        </div>
        <div className="flex items-center gap-3">
          {pnl && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px]" style={{ color: TEXT.muted }}>
                Net P&L
              </span>
              <span
                className="text-[13px] font-bold font-mono"
                style={{ color: pnl.netPnl >= 0 ? GREEN : RED }}
              >
                {pnl.netPnl >= 0 ? '+' : ''}${fmt(pnl.netPnl)}
              </span>
            </div>
          )}
          <button
            onClick={fetchAll}
            className="rounded-lg p-1.5 hover:bg-white/5 transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
              style={{ color: TEXT.tertiary }}
            />
          </button>
        </div>
      </div>

      <Ticker instruments={instruments} loading={loading && instruments.length === 0} />

      <div className="flex-1 grid grid-cols-[280px_1fr] overflow-hidden">
        <div
          className="flex flex-col overflow-hidden"
          style={{ borderRight: `1px solid ${BORDER.subtle}` }}
        >
          <div className="p-4" style={{ borderBottom: `1px solid ${BORDER.subtle}` }}>
            <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: TEXT.muted }}>
              Order Entry
            </p>
            <OrderEntry instruments={instruments} onSubmit={handleOrder} submitting={submitting} />
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: TEXT.muted }}>
              Open Positions
            </p>
            {positions.length === 0 ? (
              <p className="text-[11px]" style={{ color: TEXT.muted }}>
                No open positions
              </p>
            ) : (
              <div className="space-y-2">
                {positions.map((pos) => {
                  const isPnlPos = pos.unrealizedPnl >= 0;
                  return (
                    <div
                      key={pos.id}
                      className="rounded-lg p-3"
                      style={{ background: BG.card, border: `1px solid ${BORDER.subtle}` }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold" style={{ color: TEXT.primary }}>
                          {pos.instrument?.symbol}
                        </span>
                        <SideBadge side={pos.side} />
                      </div>
                      <p className="text-[10px] mb-2" style={{ color: TEXT.muted }}>
                        {pos.instrument?.name}
                      </p>
                      <div className="flex justify-between text-[10px]">
                        <span style={{ color: TEXT.tertiary }}>Qty: {pos.quantity}</span>
                        <span className="font-mono" style={{ color: isPnlPos ? GREEN : RED }}>
                          {isPnlPos ? '+' : ''}${fmt(pos.unrealizedPnl)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] mt-0.5">
                        <span style={{ color: TEXT.tertiary }}>
                          Entry: {fmt(pos.avgEntryPrice, 0)}
                        </span>
                        <span style={{ color: TEXT.tertiary }}>
                          Now: {fmt(pos.currentPrice, 0)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div
                  className="rounded-lg px-3 py-2"
                  style={{
                    background: 'rgba(56,189,248,0.06)',
                    border: `1px solid ${BORDER.accent}`,
                  }}
                >
                  <div className="flex justify-between text-[11px]">
                    <span style={{ color: TEXT.secondary }}>Total Unrealized</span>
                    <span
                      className="font-bold font-mono"
                      style={{ color: totalUnrealized >= 0 ? GREEN : RED }}
                    >
                      {totalUnrealized >= 0 ? '+' : ''}${fmt(totalUnrealized)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col overflow-hidden">
          <div
            className="flex items-center gap-1 px-4 py-2 shrink-0"
            style={{ borderBottom: `1px solid ${BORDER.subtle}` }}
          >
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
                style={{
                  background: tab === t.key ? `${ACCENT}15` : 'transparent',
                  color: tab === t.key ? ACCENT : TEXT.muted,
                }}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
                {t.count != null && t.count > 0 && (
                  <span
                    className="rounded-full px-1.5 text-[9px] font-bold"
                    style={{ background: `${ACCENT}30`, color: ACCENT }}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto">
            {tab === 'instruments' && (
              <div className="p-4">
                <div className="grid grid-cols-1 gap-2">
                  {instruments.map((inst) => {
                    const _chg = fmtChange(inst.change);
                    const chgPct = fmtChange(inst.changePct);
                    return (
                      <div
                        key={inst.id}
                        className="rounded-xl px-4 py-3"
                        style={{ background: BG.card, border: `1px solid ${BORDER.subtle}` }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span
                                className="text-[13px] font-bold font-mono"
                                style={{ color: ACCENT }}
                              >
                                {inst.symbol}
                              </span>
                              <span
                                className="rounded px-1.5 py-0.5 text-[9px]"
                                style={{
                                  background: 'rgba(255,255,255,0.06)',
                                  color: TEXT.tertiary,
                                }}
                              >
                                {inst.exchange}
                              </span>
                            </div>
                            <p className="text-[11px] mb-1" style={{ color: TEXT.secondary }}>
                              {inst.name}
                            </p>
                            <p className="text-[10px]" style={{ color: TEXT.tertiary }}>
                              {inst.description?.slice(0, 80)}…
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p
                              className="text-[16px] font-bold font-mono"
                              style={{ color: TEXT.primary }}
                            >
                              {fmt(inst.currentPrice, inst.currentPrice > 100 ? 0 : 2)}
                            </p>
                            <p className="text-[10px]" style={{ color: TEXT.muted }}>
                              {inst.unit}
                            </p>
                            <div className="flex items-center justify-end gap-1 mt-0.5">
                              {inst.changePct > 0 ? (
                                <TrendingUp className="w-3 h-3" style={{ color: GREEN }} />
                              ) : (
                                <TrendingDown className="w-3 h-3" style={{ color: RED }} />
                              )}
                              <span
                                className="text-[10px] font-mono"
                                style={{ color: chgPct.color }}
                              >
                                {chgPct.text}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div
                          className="grid grid-cols-4 gap-3 mt-3 pt-2"
                          style={{ borderTop: `1px solid ${BORDER.subtle}` }}
                        >
                          {[
                            {
                              label: 'Prev Close',
                              value: fmt(inst.previousClose, inst.previousClose > 100 ? 0 : 2),
                            },
                            {
                              label: 'Day High',
                              value: fmt(inst.dayHigh, inst.dayHigh > 100 ? 0 : 2),
                            },
                            {
                              label: 'Day Low',
                              value: fmt(inst.dayLow, inst.dayLow > 100 ? 0 : 2),
                            },
                            { label: 'Volume', value: String(inst.volume) },
                          ].map((f) => (
                            <div key={f.label}>
                              <p className="text-[9px] mb-0.5" style={{ color: TEXT.muted }}>
                                {f.label}
                              </p>
                              <p
                                className="text-[10px] font-mono"
                                style={{ color: TEXT.secondary }}
                              >
                                {f.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === 'orders' && (
              <div className="p-4">
                {orders.length === 0 ? (
                  <p className="text-[12px] text-center mt-8" style={{ color: TEXT.muted }}>
                    No orders placed yet
                  </p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr
                        className="text-[10px] uppercase tracking-wider"
                        style={{ color: TEXT.muted }}
                      >
                        {[
                          'Ref',
                          'Instrument',
                          'Side',
                          'Type',
                          'Qty',
                          'Price',
                          'Status',
                          'Time',
                          '',
                        ].map((h) => (
                          <th key={h} className="text-left pb-2 pr-3">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr
                          key={o.id}
                          className="text-[11px] hover:bg-white/[0.02] transition-colors"
                          style={{ borderTop: `1px solid ${BORDER.subtle}` }}
                        >
                          <td
                            className="py-2.5 pr-3 font-mono text-[10px]"
                            style={{ color: TEXT.tertiary }}
                          >
                            {o.orderRef}
                          </td>
                          <td className="py-2.5 pr-3 font-semibold" style={{ color: ACCENT }}>
                            {o.instrument?.symbol ?? `#${o.instrumentId}`}
                          </td>
                          <td className="py-2.5 pr-3">
                            <SideBadge side={o.side} />
                          </td>
                          <td className="py-2.5 pr-3 capitalize" style={{ color: TEXT.secondary }}>
                            {o.orderType}
                          </td>
                          <td className="py-2.5 pr-3 font-mono" style={{ color: TEXT.primary }}>
                            {o.quantity}
                          </td>
                          <td className="py-2.5 pr-3 font-mono" style={{ color: TEXT.secondary }}>
                            {o.avgFillPrice
                              ? fmt(o.avgFillPrice, 0)
                              : o.limitPrice
                                ? fmt(o.limitPrice, 0)
                                : 'Market'}
                          </td>
                          <td className="py-2.5 pr-3">
                            <StatusBadge status={o.status} />
                          </td>
                          <td
                            className="py-2.5 pr-3 text-[10px] font-mono"
                            style={{ color: TEXT.muted }}
                          >
                            {new Date(o.submittedAt).toLocaleTimeString()}
                          </td>
                          <td className="py-2.5">
                            {(o.status === 'open' || o.status === 'pending') && (
                              <button
                                onClick={() => handleCancel(o.id)}
                                className="hover:opacity-70 transition-opacity"
                              >
                                <X className="w-3.5 h-3.5" style={{ color: RED }} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {tab === 'positions' && (
              <div className="p-4">
                {positions.length === 0 ? (
                  <p className="text-[12px] text-center mt-8" style={{ color: TEXT.muted }}>
                    No open positions
                  </p>
                ) : (
                  <>
                    <table className="w-full mb-4">
                      <thead>
                        <tr
                          className="text-[10px] uppercase tracking-wider"
                          style={{ color: TEXT.muted }}
                        >
                          {[
                            'Instrument',
                            'Side',
                            'Qty',
                            'Entry',
                            'Current',
                            'Notional',
                            'Unrealized P&L',
                            'Opened',
                          ].map((h) => (
                            <th key={h} className="text-left pb-2 pr-3">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {positions.map((p) => {
                          const pnlColor = p.unrealizedPnl >= 0 ? GREEN : RED;
                          return (
                            <tr
                              key={p.id}
                              className="text-[11px] hover:bg-white/[0.02]"
                              style={{ borderTop: `1px solid ${BORDER.subtle}` }}
                            >
                              <td className="py-2.5 pr-3">
                                <div>
                                  <p className="font-bold" style={{ color: ACCENT }}>
                                    {p.instrument?.symbol}
                                  </p>
                                  <p className="text-[10px]" style={{ color: TEXT.muted }}>
                                    {p.instrument?.name?.slice(0, 20)}
                                  </p>
                                </div>
                              </td>
                              <td className="py-2.5 pr-3">
                                <SideBadge side={p.side} />
                              </td>
                              <td className="py-2.5 pr-3 font-mono" style={{ color: TEXT.primary }}>
                                {p.quantity}
                              </td>
                              <td
                                className="py-2.5 pr-3 font-mono"
                                style={{ color: TEXT.secondary }}
                              >
                                {fmt(p.avgEntryPrice, 0)}
                              </td>
                              <td className="py-2.5 pr-3 font-mono" style={{ color: TEXT.primary }}>
                                {fmt(p.currentPrice, 0)}
                              </td>
                              <td
                                className="py-2.5 pr-3 font-mono"
                                style={{ color: TEXT.secondary }}
                              >
                                ${fmt(p.notionalValue, 0)}
                              </td>
                              <td
                                className="py-2.5 pr-3 font-mono font-bold"
                                style={{ color: pnlColor }}
                              >
                                {p.unrealizedPnl >= 0 ? '+' : ''}${fmt(p.unrealizedPnl)}
                              </td>
                              <td className="py-2.5 text-[10px]" style={{ color: TEXT.muted }}>
                                {new Date(p.openedAt).toLocaleDateString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div
                      className="rounded-xl px-4 py-3 flex items-center justify-between"
                      style={{
                        background: `${totalUnrealized >= 0 ? GREEN : RED}10`,
                        border: `1px solid ${totalUnrealized >= 0 ? GREEN : RED}30`,
                      }}
                    >
                      <span className="text-[12px]" style={{ color: TEXT.secondary }}>
                        Total Unrealized P&L
                      </span>
                      <span
                        className="text-[18px] font-bold font-mono"
                        style={{ color: totalUnrealized >= 0 ? GREEN : RED }}
                      >
                        {totalUnrealized >= 0 ? '+' : ''}${fmt(totalUnrealized)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {tab === 'fills' && (
              <div className="p-4">
                {fills.length === 0 ? (
                  <p className="text-[12px] text-center mt-8" style={{ color: TEXT.muted }}>
                    No fills recorded
                  </p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr
                        className="text-[10px] uppercase tracking-wider"
                        style={{ color: TEXT.muted }}
                      >
                        {[
                          'Fill Ref',
                          'Instrument',
                          'Side',
                          'Qty',
                          'Price',
                          'Commission',
                          'Venue',
                          'Time',
                        ].map((h) => (
                          <th key={h} className="text-left pb-2 pr-3">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {fills.map((f) => (
                        <tr
                          key={f.id}
                          className="text-[11px] hover:bg-white/[0.02]"
                          style={{ borderTop: `1px solid ${BORDER.subtle}` }}
                        >
                          <td
                            className="py-2.5 pr-3 font-mono text-[10px]"
                            style={{ color: TEXT.tertiary }}
                          >
                            {f.fillRef}
                          </td>
                          <td className="py-2.5 pr-3 font-bold" style={{ color: ACCENT }}>
                            {f.instrument?.symbol ?? `#${f.instrument?.id ?? f.id}`}
                          </td>
                          <td className="py-2.5 pr-3">
                            <SideBadge side={f.side} />
                          </td>
                          <td className="py-2.5 pr-3 font-mono" style={{ color: TEXT.primary }}>
                            {f.quantity}
                          </td>
                          <td className="py-2.5 pr-3 font-mono" style={{ color: TEXT.primary }}>
                            {fmt(f.price, 0)}
                          </td>
                          <td
                            className="py-2.5 pr-3 font-mono text-[10px]"
                            style={{ color: TEXT.muted }}
                          >
                            ${f.commission}
                          </td>
                          <td className="py-2.5 pr-3 text-[10px]" style={{ color: TEXT.tertiary }}>
                            {f.executionVenue}
                          </td>
                          <td
                            className="py-2.5 text-[10px] font-mono"
                            style={{ color: TEXT.muted }}
                          >
                            {new Date(f.filledAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {tab === 'pnl' && pnl && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: 'Unrealized P&L',
                      value: `${pnl.unrealizedPnl >= 0 ? '+' : ''}$${fmt(pnl.unrealizedPnl)}`,
                      color: pnl.unrealizedPnl >= 0 ? GREEN : RED,
                    },
                    {
                      label: 'Realized P&L',
                      value: `${pnl.realizedPnl >= 0 ? '+' : ''}$${fmt(pnl.realizedPnl)}`,
                      color: pnl.realizedPnl >= 0 ? GREEN : RED,
                    },
                    {
                      label: 'Net P&L',
                      value: `${pnl.netPnl >= 0 ? '+' : ''}$${fmt(pnl.netPnl)}`,
                      color: pnl.netPnl >= 0 ? GREEN : RED,
                    },
                    {
                      label: 'Commission Paid',
                      value: `$${fmt(pnl.totalCommission)}`,
                      color: TEXT.secondary,
                    },
                    { label: 'Win Rate', value: `${pnl.winRate}%`, color: ACCENT },
                    {
                      label: 'Sharpe Ratio',
                      value: String(pnl.sharpeRatio),
                      color: pnl.sharpeRatio >= 1 ? GREEN : AMBER,
                    },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl p-4"
                      style={{ background: BG.card, border: `1px solid ${BORDER.subtle}` }}
                    >
                      <p className="text-[10px] mb-1" style={{ color: TEXT.muted }}>
                        {stat.label}
                      </p>
                      <p className="text-[18px] font-bold font-mono" style={{ color: stat.color }}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
                <div
                  className="rounded-xl p-4"
                  style={{ background: BG.card, border: `1px solid ${BORDER.subtle}` }}
                >
                  <p className="text-[11px] mb-3" style={{ color: TEXT.muted }}>
                    Baltic Exchange Data Attribution
                  </p>
                  <p className="text-[11px]" style={{ color: TEXT.secondary }}>
                    Rate data derived from Baltic Exchange indices (BDI, BCI, BPI, BSI, BDTI, BCTI)
                    and Platts commodity assessments. Pricing refreshes against the operator's
                    licensed Baltic Exchange and Platts feeds.
                  </p>
                </div>
              </div>
            )}

            {tab === 'voyages' && (
              <div className="p-4">
                {liveVoyages.length === 0 ? (
                  <p className="text-[12px] text-center mt-8" style={{ color: TEXT.muted }}>
                    No voyages
                  </p>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr
                        className="text-[10px] uppercase tracking-wider"
                        style={{ color: TEXT.muted }}
                      >
                        {['Voyage #', 'Status', 'Revenue', 'Fuel Cost', 'Departure', 'Margin'].map(
                          (h) => (
                            <th key={h} className="text-left pb-2 pr-3">
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {liveVoyages.map((v) => {
                        const rev = v.revenueUsd ? parseFloat(v.revenueUsd) : null;
                        const fuel = v.fuelCostUsd ? parseFloat(v.fuelCostUsd) : null;
                        const margin =
                          rev && fuel ? (((rev - fuel) / rev) * 100).toFixed(1) : null;
                        return (
                          <tr
                            key={v.id}
                            className="text-[11px] hover:bg-white/[0.02]"
                            style={{ borderTop: `1px solid ${BORDER.subtle}` }}
                          >
                            <td
                              className="py-2.5 pr-3 font-mono text-[10px]"
                              style={{ color: TEXT.tertiary }}
                            >
                              {v.voyageNumber}
                            </td>
                            <td
                              className="py-2.5 pr-3 capitalize text-[10px]"
                              style={{ color: TEXT.muted }}
                            >
                              {v.status}
                            </td>
                            <td className="py-2.5 pr-3 font-mono" style={{ color: TEXT.primary }}>
                              {rev != null ? `$${fmt(rev, 0)}` : '—'}
                            </td>
                            <td className="py-2.5 pr-3 font-mono" style={{ color: TEXT.secondary }}>
                              {fuel != null ? `$${fmt(fuel, 0)}` : '—'}
                            </td>
                            <td className="py-2.5 pr-3" style={{ color: TEXT.secondary }}>
                              {v.scheduledDepartureAt
                                ? new Date(v.scheduledDepartureAt).toLocaleDateString()
                                : '—'}
                            </td>
                            <td
                              className="py-2.5 pr-3 font-mono"
                              style={{
                                color:
                                  margin != null
                                    ? parseFloat(margin) >= 20
                                      ? GREEN
                                      : parseFloat(margin) >= 0
                                        ? AMBER
                                        : RED
                                    : TEXT.muted,
                              }}
                            >
                              {margin != null ? `${margin}%` : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
