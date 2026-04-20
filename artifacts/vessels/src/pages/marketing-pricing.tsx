import { ArrowRight, Building2, CheckCircle, Shield, Ship, X } from 'lucide-react';
import { useState } from 'react';
import { MarketingFooter } from '@/components/MarketingFooter';
import { MarketingNav } from '@/components/MarketingNav';

const ACCENT = '#0ea5e9';
const BG = '#060c14';

const tiers = [
  {
    name: 'Navigator',
    monthly: 499,
    annual: 415,
    description: 'For maritime operators tracking a small fleet or monitoring specific corridors.',
    icon: Ship,
    cta: 'Start Free Trial',
    trialDays: 14,
    highlight: false,
    features: [
      'Up to 50 vessels',
      'Real-time AIS tracking',
      'Basic route deviation alerts',
      'Port congestion feed',
      '7-day voyage history',
      'Email & SMS alerts',
      'Standard OFAC sanctions screening',
      '2 user seats',
    ],
    notIncluded: [
      'Dark vessel detection',
      'Chokepoint intelligence',
      'Custom risk scoring',
      'API access',
    ],
  },
  {
    name: 'Command',
    monthly: 1499,
    annual: 1249,
    description:
      'For fleet operators and maritime intelligence teams needing full domain awareness.',
    icon: Shield,
    cta: 'Start Free Trial',
    trialDays: 14,
    highlight: true,
    features: [
      'Up to 500 vessels',
      'Full AIS + satellite tracking',
      'Dark vessel detection',
      'Chokepoint congestion intelligence',
      '90-day voyage history',
      'Predictive weather & routing',
      'Advanced OFAC & sanctions screening',
      'Cyber threat correlation',
      'Helmsman AI copilot',
      'Fleet performance analytics',
      '10 user seats',
      'API access',
      'Slack & Teams integration',
    ],
    notIncluded: ['Dedicated intelligence analyst', 'Custom data integration'],
  },
  {
    name: 'Enterprise',
    monthly: null,
    annual: null,
    description:
      'For ship managers, port authorities, and government agencies with full-spectrum requirements.',
    icon: Building2,
    cta: 'Contact Sales',
    trialDays: null,
    highlight: false,
    features: [
      'Unlimited vessel tracking',
      'Full SIGINT-grade AIS coverage',
      'Custom dark vessel models',
      'Dedicated intelligence analyst',
      'Historical data (5+ years)',
      'Custom data integration & feeds',
      'Classified corridor access',
      'SSO / SAML / SCIM',
      'Audit logs & compliance exports',
      '99.9% SLA guarantee',
      'Unlimited user seats',
      'White-glove onboarding',
      'Quarterly strategic briefings',
    ],
    notIncluded: [],
  },
];

export default function MarketingPricingPage() {
  const [annual, setAnnual] = useState(true);

  return (
    <div className="min-h-screen" style={{ background: BG, color: 'rgba(255,255,255,0.88)' }}>
      <MarketingNav />

      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium mb-6"
          style={{ background: `${ACCENT}15`, color: ACCENT, border: `1px solid ${ACCENT}30` }}
        >
          Maritime Intelligence Pricing
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">
          Intelligence at every scale
        </h1>
        <p
          className="text-[15px] max-w-xl mx-auto mb-10"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          From single-fleet operators to global port authorities. Full domain awareness, designed
          for maritime.
        </p>

        <div
          className="inline-flex items-center gap-1 p-1 rounded-full mb-16"
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
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: `${ACCENT}20`, color: ACCENT }}
            >
              Save 17%
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            const price = annual ? tier.annual : tier.monthly;
            return (
              <div
                key={tier.name}
                className="relative rounded-2xl p-8 text-left flex flex-col"
                style={{
                  background: tier.highlight
                    ? `linear-gradient(135deg, rgba(14,165,233,0.12), rgba(14,165,233,0.06))`
                    : 'rgba(255,255,255,0.04)',
                  border: tier.highlight
                    ? `1px solid ${ACCENT}40`
                    : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {tier.highlight && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                    style={{ background: ACCENT, color: '#000' }}
                  >
                    Most Popular
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: tier.highlight ? `${ACCENT}25` : 'rgba(255,255,255,0.07)',
                    }}
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{ color: tier.highlight ? ACCENT : 'rgba(255,255,255,0.6)' }}
                    />
                  </div>
                  <div className="text-[15px] font-bold text-white">{tier.name}</div>
                </div>

                <div className="mb-4">
                  {price !== null ? (
                    <div className="flex items-end gap-1.5">
                      <span className="text-4xl font-bold text-white">${price}</span>
                      <span className="text-[13px] mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        /month
                      </span>
                    </div>
                  ) : (
                    <div className="text-3xl font-bold text-white">Custom</div>
                  )}
                  {annual && price !== null && (
                    <div className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      Billed annually
                    </div>
                  )}
                </div>

                <p
                  className="text-[13px] mb-6 leading-relaxed"
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                  {tier.description}
                </p>

                <button
                  className="w-full py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all mb-8"
                  style={{
                    background: tier.highlight ? ACCENT : 'rgba(255,255,255,0.1)',
                    color: tier.highlight ? '#000' : 'white',
                    border: tier.highlight ? 'none' : '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  {tier.cta} {tier.trialDays ? `— ${tier.trialDays} days free` : ''}{' '}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="space-y-2.5 flex-1">
                  {tier.features.map((f) => (
                    <div
                      key={f}
                      className="flex items-start gap-2.5 text-[13px]"
                      style={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                      <CheckCircle
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: ACCENT }}
                      />
                      {f}
                    </div>
                  ))}
                  {tier.notIncluded.map((f) => (
                    <div
                      key={f}
                      className="flex items-start gap-2.5 text-[13px]"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
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

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-3xl mx-auto">
          {[
            {
              label: '14-day free trial',
              desc: 'No credit card required. Full AIS coverage from day one.',
            },
            {
              label: 'No vessel minimums',
              desc: 'Start with a single vessel. Scale as your fleet grows.',
            },
            {
              label: 'GDPR & IMO compliant',
              desc: 'Data residency controls and maritime regulatory compliance.',
            },
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

      <MarketingFooter />
    </div>
  );
}
