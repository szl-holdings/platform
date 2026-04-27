import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CreditCard,
  DollarSign,
  FileText,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { Link } from 'wouter';

interface BillingHealth {
  openInvoicesTotal: number;
  openInvoicesCurrency: string;
  pastDueCount: number;
  refundQueueDepth: number;
  mrr: number;
  mrrCurrency: string;
  demo?: boolean;
}

const DEMO_HEALTH: BillingHealth = {
  openInvoicesTotal: 48500,
  openInvoicesCurrency: 'usd',
  pastDueCount: 3,
  refundQueueDepth: 1,
  mrr: 124000,
  mrrCurrency: 'usd',
  demo: true,
};

function isDemoMode(): boolean {
  try {
    const env = (import.meta as unknown as { env?: Record<string, unknown> }).env;
    return env?.VITE_BILLING_DEMO_MODE === 'true' || env?.VITE_BILLING_DEMO_MODE === true;
  } catch {
    return false;
  }
}

function fmtCurrency(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

interface MetricChipProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent?: string;
  alert?: boolean;
}

function MetricChip({ icon: Icon, label, value, accent = '#d4a054', alert = false }: MetricChipProps) {
  return (
    <div
      className="flex flex-col gap-1 rounded-xl px-4 py-3 border"
      style={{
        background: alert ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.02)',
        borderColor: alert ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className="w-3.5 h-3.5" style={{ color: alert ? '#ef4444' : accent }} />
        <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {label}
        </span>
      </div>
      <span className="text-lg font-bold text-white tabular-nums">{value}</span>
    </div>
  );
}

export function BillingHealthCard() {
  const { data, isLoading, refetch } = useQuery<BillingHealth>({
    queryKey: ['command-billing-health'],
    queryFn: async () => {
      if (isDemoMode()) return DEMO_HEALTH;
      const health = await apiFetch<BillingHealth>('/api/billing/health-summary');
      return health;
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const health = data ?? (isDemoMode() ? DEMO_HEALTH : null);
  const showDemo = isDemoMode() || (health?.demo ?? false);

  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4" style={{ color: '#d4a054' }} />
          <h2 className="text-sm font-semibold text-white">Billing Health</h2>
          {showDemo && (
            <span
              className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}
            >
              demo
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-1 rounded transition-colors hover:bg-white/5"
            title="Refresh billing health"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} style={{ color: 'rgba(255,255,255,0.3)' }} />
          </button>
          <Link href="/account/billing" className="text-[11px] transition-opacity hover:opacity-70" style={{ color: '#d4a054' }}>
            View billing →
          </Link>
        </div>
      </div>

      {health ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricChip
              icon={DollarSign}
              label="MRR"
              value={fmtCurrency(health.mrr, health.mrrCurrency)}
              accent="#22c55e"
            />
            <MetricChip
              icon={FileText}
              label="Open invoices"
              value={fmtCurrency(health.openInvoicesTotal, health.openInvoicesCurrency)}
              accent="#d4a054"
              alert={health.openInvoicesTotal > 0}
            />
            <MetricChip
              icon={AlertTriangle}
              label="Past due"
              value={health.pastDueCount}
              accent="#ef4444"
              alert={health.pastDueCount > 0}
            />
            <MetricChip
              icon={RotateCcw}
              label="Refund queue"
              value={health.refundQueueDepth}
              accent="#8b5cf6"
              alert={health.refundQueueDepth > 0}
            />
          </div>

          {(health.pastDueCount > 0 || health.refundQueueDepth > 0) && (
            <div
              className="mt-3 flex items-center gap-2 text-[12px] px-3 py-2 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.06)', color: '#fca5a5' }}
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-400" />
              {health.pastDueCount > 0 && (
                <span>
                  {health.pastDueCount} past-due {health.pastDueCount === 1 ? 'account requires' : 'accounts require'} attention.
                </span>
              )}
              {health.refundQueueDepth > 0 && (
                <span className="ml-1">
                  {health.refundQueueDepth} refund {health.refundQueueDepth === 1 ? 'request' : 'requests'} pending.
                </span>
              )}
            </div>
          )}
        </>
      ) : (
        <div
          className="flex items-center gap-2 text-[12px] px-3 py-3"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Billing data unavailable — configure the API server to see live metrics.</span>
        </div>
      )}
    </div>
  );
}
