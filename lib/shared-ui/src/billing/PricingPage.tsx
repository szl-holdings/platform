import { trackEvent } from '@szl-holdings/observability/react';
import { ArrowRight, Building2, CheckCircle, X } from 'lucide-react';
import * as React from 'react';
import { cn } from '../utils';

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  priceMonthly: number | null;
  priceAnnual: number | null;
  annualSavingsPct?: number;
  features: string[];
  notIncluded?: string[];
  highlight?: boolean;
  cta: string;
  ctaType: 'checkout' | 'contact' | 'disabled';
  checkoutPlanId?: string;
  mode?: 'subscription' | 'payment';
  badge?: string;
}

export interface PricingPageProps {
  productKey: string;
  productName: string;
  accentColor?: string;
  tiers: PricingTier[];
  headline?: string;
  subheadline?: string;
  showAnnualToggle?: boolean;
  onContactSales?: () => void;
  className?: string;
}

async function initiateCheckout(opts: {
  productKey: string;
  planId: string;
  mode: 'subscription' | 'payment';
  basePath: string;
}): Promise<void> {
  const origin = window.location.origin;
  const base = opts.basePath.replace(/\/$/, '');
  const successUrl = `${origin}${base}/account/billing?checkout=success`;
  const cancelUrl = `${origin}${base}/pricing`;

  const endpoint =
    opts.mode === 'payment'
      ? `${base}/api/stripe/checkout`
      : `${base}/api/billing/${opts.productKey}/subscribe`;

  const body =
    opts.mode === 'payment'
      ? { tierId: opts.planId, successUrl, cancelUrl }
      : { planId: opts.planId, successUrl, cancelUrl };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as { data?: { url?: string }; url?: string };
  const url = data?.data?.url ?? (data as { url?: string }).url;
  if (url) {
    window.location.href = url;
  }
}

export function PricingPage({
  productKey,
  productName,
  accentColor = '#6366f1',
  tiers,
  headline,
  subheadline,
  showAnnualToggle = true,
  onContactSales,
  className,
}: PricingPageProps) {
  const [annual, setAnnual] = React.useState(true);
  const [loading, setLoading] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const basePath =
    typeof window !== 'undefined'
      ? (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/'
      : '/';

  async function handleCTA(tier: PricingTier) {
    if (tier.ctaType === 'contact') {
      if (onContactSales) {
        onContactSales();
      } else {
        window.location.href = `mailto:sales@szlholdings.com?subject=Enterprise inquiry — ${productName}`;
      }
      return;
    }

    if (tier.ctaType !== 'checkout' || !tier.checkoutPlanId) return;

    const planId = annual && tier.priceAnnual != null
      ? tier.checkoutPlanId.replace('-monthly', '-annual')
      : tier.checkoutPlanId.replace('-annual', '-monthly');

    trackEvent('upgrade_clicked', {
      feature: `${productKey}_pricing`,
      tier: tier.name,
      plan: planId,
      billing: annual ? 'annual' : 'monthly',
    });

    setLoading(tier.id);
    setError(null);
    try {
      await initiateCheckout({
        productKey,
        planId,
        mode: tier.mode ?? 'subscription',
        basePath,
      });
    } catch (err) {
      setError('Unable to start checkout. Please try again or contact support.');
    } finally {
      setLoading(null);
    }
  }

  const hasAnnual = tiers.some((t) => t.priceAnnual != null);

  return (
    <div
      className={cn('min-h-screen', className)}
      style={{ background: 'hsl(210,12%,5%)', color: 'rgba(255,255,255,0.88)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-12 sm:mb-16">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium mb-5"
            style={{
              background: `${accentColor}15`,
              color: accentColor,
              border: `1px solid ${accentColor}30`,
            }}
          >
            {productName} Pricing
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4 text-white">
            {headline ?? `Simple, transparent pricing`}
          </h1>
          <p
            className="text-[15px] max-w-xl mx-auto"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            {subheadline ?? `Every plan includes a full-featured trial. No hidden fees.`}
          </p>

          {showAnnualToggle && hasAnnual && (
            <div
              className="inline-flex items-center gap-1 p-1 rounded-full mt-8"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <button
                onClick={() => setAnnual(false)}
                className="px-5 py-2 rounded-full text-[13px] font-medium transition-all"
                style={{
                  background: !annual ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: !annual ? 'white' : 'rgba(255,255,255,0.45)',
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className="px-5 py-2 rounded-full text-[13px] font-medium transition-all flex items-center gap-2"
                style={{
                  background: annual ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: annual ? 'white' : 'rgba(255,255,255,0.45)',
                }}
              >
                Annual
                {tiers.find((t) => t.annualSavingsPct) && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: `${accentColor}20`, color: accentColor }}
                  >
                    Save {tiers.find((t) => t.annualSavingsPct)?.annualSavingsPct ?? 17}%
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div
            className="max-w-xl mx-auto mb-8 px-4 py-3 rounded-xl text-sm text-center"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            {error}
          </div>
        )}

        <div
          className={cn(
            'grid gap-6',
            tiers.length === 1
              ? 'grid-cols-1 max-w-sm mx-auto'
              : tiers.length === 2
                ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
          )}
        >
          {tiers.map((tier) => {
            const price = annual && tier.priceAnnual != null ? tier.priceAnnual : tier.priceMonthly;
            const isLoading = loading === tier.id;
            return (
              <div
                key={tier.id}
                className="relative rounded-2xl p-7 flex flex-col"
                style={{
                  background: tier.highlight
                    ? `linear-gradient(135deg, ${accentColor}14, ${accentColor}07)`
                    : 'rgba(255,255,255,0.04)',
                  border: tier.highlight
                    ? `1px solid ${accentColor}40`
                    : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {(tier.highlight || tier.badge) && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider whitespace-nowrap"
                    style={{ background: accentColor, color: '#000' }}
                  >
                    {tier.badge ?? 'Most Popular'}
                  </div>
                )}

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    {tier.ctaType === 'contact' && (
                      <Building2
                        className="w-4 h-4"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                      />
                    )}
                    <span className="text-[15px] font-bold text-white">{tier.name}</span>
                  </div>
                  {price != null ? (
                    <div className="flex items-end gap-1.5">
                      <span className="text-4xl font-bold text-white">${price}</span>
                      <span
                        className="text-[13px] mb-2"
                        style={{ color: 'rgba(255,255,255,0.4)' }}
                      >
                        {tier.mode === 'payment' ? ' one-time' : '/mo'}
                      </span>
                    </div>
                  ) : (
                    <div className="text-3xl font-bold text-white">Custom</div>
                  )}
                  {annual && tier.priceAnnual != null && tier.mode !== 'payment' && (
                    <div
                      className="text-[12px] mt-0.5"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >
                      Billed annually
                    </div>
                  )}
                </div>

                <p
                  className="text-[13px] mb-5 leading-relaxed"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  {tier.description}
                </p>

                <button
                  onClick={() => handleCTA(tier)}
                  disabled={isLoading || tier.ctaType === 'disabled'}
                  className="w-full py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all mb-6 disabled:opacity-60"
                  style={{
                    background: tier.highlight ? accentColor : 'rgba(255,255,255,0.1)',
                    color: tier.highlight ? '#000' : 'white',
                    border: tier.highlight ? 'none' : '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  {isLoading ? 'Redirecting…' : tier.cta}
                  {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
                </button>

                <div className="space-y-2 flex-1">
                  {tier.features.map((f) => (
                    <div
                      key={f}
                      className="flex items-start gap-2.5 text-[13px]"
                      style={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                      <CheckCircle
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: accentColor }}
                      />
                      {f}
                    </div>
                  ))}
                  {(tier.notIncluded ?? []).map((f) => (
                    <div
                      key={f}
                      className="flex items-start gap-2.5 text-[13px]"
                      style={{ color: 'rgba(255,255,255,0.22)' }}
                    >
                      <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center max-w-3xl mx-auto"
        >
          {[
            { label: '14-day free trial', desc: 'No credit card required for trials.' },
            { label: 'Cancel any time', desc: 'No lock-in. Data export included.' },
            { label: 'SOC 2 compliant', desc: 'Enterprise-grade security by default.' },
          ].map((item) => (
            <div key={item.label}>
              <div className="text-[14px] font-semibold text-white mb-1">{item.label}</div>
              <div className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
