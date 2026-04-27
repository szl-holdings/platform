import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  FileText,
  FlaskConical,
  RefreshCw,
  Zap,
} from 'lucide-react';
import * as React from 'react';
import { apiFetch } from '../api-fetch';
import { cn } from '../utils';

function isBillingDemoMode(): boolean {
  try {
    const env = (import.meta as unknown as { env?: Record<string, unknown> }).env;
    return env?.VITE_BILLING_DEMO_MODE === 'true' || env?.VITE_BILLING_DEMO_MODE === true;
  } catch {
    return false;
  }
}

interface SubscriptionData {
  subscribed: boolean;
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd?: number;
    cancelAtPeriodEnd?: boolean;
    items?: { data: Array<{ price: { nickname?: string; unit_amount?: number; currency?: string; recurring?: { interval: string } } }> };
  } | null;
  allSubscriptions: Array<{
    id: string;
    status: string;
    currentPeriodEnd?: number;
  }>;
}

interface StripeInvoice {
  id: string;
  amount_paid: number;
  currency: string;
  status: string;
  created: number;
  hosted_invoice_url?: string;
  invoice_pdf?: string;
  description?: string;
}

function formatCurrency(amount: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function statusColor(status: string): string {
  if (status === 'active' || status === 'paid') return '#22c55e';
  if (status === 'trialing') return '#3b82f6';
  if (status === 'past_due') return '#f59e0b';
  if (status === 'canceled') return '#6b7280';
  return '#6b7280';
}

export interface BillingAccountProps {
  accentColor?: string;
  pricingUrl?: string;
  customerEmail?: string;
  productName?: string;
  className?: string;
  onNavigate?: (href: string) => void;
}

export function BillingAccount({
  accentColor = '#6366f1',
  pricingUrl = '/pricing',
  customerEmail,
  productName = 'Platform',
  className,
  onNavigate,
}: BillingAccountProps) {
  const [portalLoading, setPortalLoading] = React.useState(false);
  const [portalError, setPortalError] = React.useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('checkout') === 'success') {
        setCheckoutSuccess(true);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const subsQuery = useQuery({
    queryKey: ['billing-subscription-status', customerEmail],
    queryFn: async () => {
      const params = customerEmail ? `?email=${encodeURIComponent(customerEmail)}` : '';
      const res = await apiFetch<SubscriptionData>(
        `/api/billing/subscription-status${params}`,
      );
      return res;
    },
    staleTime: 30_000,
    refetchInterval: checkoutSuccess ? 5_000 : false,
  });

  const invoicesQuery = useQuery({
    queryKey: ['billing-stripe-invoices', customerEmail],
    queryFn: async () => {
      const invoices = await apiFetch<StripeInvoice[]>('/api/billing/stripe-invoices');
      return invoices ?? [];
    },
    staleTime: 60_000,
  });

  async function openPortal() {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const returnUrl = window.location.href;
      const res = await apiFetch<{ url: string }>('/api/billing/portal-session', {
        method: 'POST',
        body: JSON.stringify({ returnUrl }),
      });
      if (res?.url) {
        window.location.href = res.url;
      }
    } catch {
      setPortalError('Unable to open billing portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  }

  const sub = subsQuery.data?.subscription ?? null;
  const isSubscribed = subsQuery.data?.subscribed ?? false;
  const invoices = invoicesQuery.data ?? [];

  const planName =
    sub?.items?.data?.[0]?.price?.nickname ??
    (isSubscribed ? `${productName} Plan` : 'Free');

  const nextRenewal = sub?.currentPeriodEnd
    ? formatDate(sub.currentPeriodEnd)
    : null;

  const monthlyAmount = sub?.items?.data?.[0]?.price?.unit_amount;
  const currency = sub?.items?.data?.[0]?.price?.currency ?? 'usd';
  const interval = sub?.items?.data?.[0]?.price?.recurring?.interval;

  const demoMode = isBillingDemoMode();

  return (
    <div className={cn('space-y-6', className)}>
      {demoMode && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border"
          style={{
            background: 'rgba(245,158,11,0.06)',
            borderColor: 'rgba(245,158,11,0.2)',
          }}
        >
          <FlaskConical className="w-4 h-4 shrink-0" style={{ color: '#f59e0b' }} />
          <div>
            <p className="text-[13px] font-semibold" style={{ color: '#f59e0b' }}>
              Demo mode active
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: 'rgba(245,158,11,0.7)' }}>
              Showing realistic sample data. Live billing is not enabled — configure{' '}
              <code className="font-mono text-[11px]">STRIPE_SECRET_KEY</code> to go live.
            </p>
          </div>
        </div>
      )}
      {checkoutSuccess && (
        <div
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl border"
          style={{
            background: 'rgba(34,197,94,0.08)',
            borderColor: 'rgba(34,197,94,0.25)',
          }}
        >
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
          <div>
            <div className="text-sm font-semibold text-white">Payment successful!</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Your subscription is now active. It may take a few moments to reflect.
            </div>
          </div>
        </div>
      )}

      <div
        className="rounded-2xl p-6 border"
        style={{
          background: 'rgba(255,255,255,0.03)',
          borderColor: 'rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-semibold text-white mb-0.5">Current Plan</h2>
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {productName} subscription
            </p>
          </div>
          {isSubscribed && (
            <button
              onClick={openPortal}
              disabled={portalLoading}
              className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg transition-all disabled:opacity-60"
              style={{
                background: `${accentColor}18`,
                color: accentColor,
                border: `1px solid ${accentColor}30`,
              }}
            >
              <CreditCard className="w-3.5 h-3.5" />
              {portalLoading ? 'Opening…' : 'Manage'}
            </button>
          )}
        </div>

        {subsQuery.isLoading ? (
          <div className="flex items-center gap-2 py-4">
            <RefreshCw className="w-4 h-4 animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Loading subscription…
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Plan</div>
              <div className="text-sm font-semibold text-white">{planName}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Status</div>
              <div
                className="text-sm font-semibold flex items-center gap-1.5"
                style={{ color: statusColor(sub?.status ?? 'free') }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{ background: statusColor(sub?.status ?? 'free') }}
                />
                {isSubscribed ? (sub?.status ?? 'active') : 'Free'}
              </div>
            </div>
            {monthlyAmount != null && (
              <div>
                <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Amount</div>
                <div className="text-sm font-semibold text-white">
                  {formatCurrency(monthlyAmount, currency)}
                  {interval && (
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>/{interval}</span>
                  )}
                </div>
              </div>
            )}
            {nextRenewal && (
              <div>
                <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {sub?.cancelAtPeriodEnd ? 'Cancels' : 'Renews'}
                </div>
                <div className="text-sm font-semibold text-white">{nextRenewal}</div>
              </div>
            )}
          </div>
        )}

        {!isSubscribed && !subsQuery.isLoading && (
          <div className="mt-5 pt-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-[13px] mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>
              You are on the Free plan. Upgrade to unlock all features.
            </p>
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate(pricingUrl);
                } else {
                  window.location.href = pricingUrl;
                }
              }}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all hover:opacity-90"
              style={{ background: accentColor }}
            >
              <Zap className="w-4 h-4" />
              View Plans
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {portalError && (
          <div
            className="mt-4 flex items-center gap-2 text-[13px]"
            style={{ color: '#f87171' }}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {portalError}
          </div>
        )}
      </div>

      <div
        className="rounded-2xl p-6 border"
        style={{
          background: 'rgba(255,255,255,0.03)',
          borderColor: 'rgba(255,255,255,0.08)',
        }}
      >
        <h2 className="text-base font-semibold text-white mb-4">Invoice History</h2>

        {invoicesQuery.isLoading ? (
          <div className="flex items-center gap-2 py-4">
            <RefreshCw className="w-4 h-4 animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Loading invoices…
            </span>
          </div>
        ) : invoices.length === 0 ? (
          <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
            No invoices yet.
          </p>
        ) : (
          <div className="space-y-2">
            {invoices.slice(0, 10).map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.35)' }} />
                  <div>
                    <div className="text-[13px] font-medium text-white">
                      {formatCurrency(inv.amount_paid, inv.currency)}
                    </div>
                    <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {formatDate(inv.created)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: `${statusColor(inv.status)}20`,
                      color: statusColor(inv.status),
                    }}
                  >
                    {inv.status}
                  </span>
                  {inv.hosted_invoice_url && (
                    <a
                      href={inv.hosted_invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] font-medium transition-opacity hover:opacity-70"
                      style={{ color: accentColor }}
                    >
                      View
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
