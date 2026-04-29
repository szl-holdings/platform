import { ContactModal, useContactModal } from '@szl-holdings/shared-ui/contact-modal';
import { ArrowRight, BarChart3, Building2, CheckCircle, MapPin, X } from 'lucide-react';
import { useState } from 'react';

const ACCENT = '#2d6a4f';
const ACCENT_LIGHT = '#40856a';
const BG = '#0a0c10';

const tiers = [
  {
    name: 'Scout',
    monthly: 299,
    annual: 249,
    description: 'For individual investors and agents building their first distress pipeline.',
    icon: MapPin,
    cta: 'Start Free Trial',
    trialDays: 14,
    highlight: false,
    features: [
      '1 borough or market',
      'Up to 250 tracked properties',
      'Distress scoring (pre-foreclosure, lis pendens)',
      'Basic ownership resolution',
      'Deal pipeline — up to 10 active deals',
      '30-day signal history',
      'Email alerts',
      '1 user seat',
    ],
    notIncluded: [
      'LLC unmasking & entity resolution',
      'Multi-market intelligence',
      'Auction calendar integration',
      'API access',
    ],
  },
  {
    name: 'Operator',
    monthly: 899,
    annual: 749,
    description:
      'For acquisition teams and active operators running a systematic distress strategy.',
    icon: BarChart3,
    cta: 'Start Free Trial',
    trialDays: 14,
    highlight: true,
    features: [
      'Up to 5 markets or boroughs',
      'Unlimited tracked properties',
      'Full distress intelligence suite',
      'LLC unmasking & entity resolution',
      'Auction calendar & tax lien tracking',
      'Deal pipeline — unlimited deals',
      '90-day signal history',
      'TERRA AI analyst copilot',
      'Market comps & valuation overlays',
      '5 user seats',
      'API access',
      'CRM export (CSV, webhook)',
    ],
    notIncluded: ['Portfolio management module', 'Dedicated analyst'],
  },
  {
    name: 'Enterprise',
    monthly: null,
    annual: null,
    description: 'For private equity firms, family offices, and institutional investors.',
    icon: Building2,
    cta: 'Contact Sales',
    trialDays: null,
    highlight: false,
    features: [
      'Unlimited markets & coverage areas',
      'Full portfolio management module',
      'Institutional-grade distress scoring',
      'Custom entity resolution models',
      'Dedicated intelligence analyst',
      'Investor-grade reporting & dashboards',
      'Capital deployment workflow',
      'Custom data feeds & integrations',
      'SSO / SAML / SCIM',
      'Audit trails & compliance exports',
      'Unlimited user seats',
      'SLA: 99.9% uptime',
      'White-glove onboarding',
    ],
    notIncluded: [],
  },
];

export default function TerraPerricingPage() {
  const [annual, setAnnual] = useState(true);
  const { isOpen: contactOpen, open: openContact, close: closeContact } = useContactModal('demo');

  return (
    <div className="min-h-screen" style={{ background: BG, color: 'rgba(255,255,255,0.88)' }}>
      <ContactModal
        isOpen={contactOpen}
        onClose={closeContact}
        type="demo"
        app="terra"
        title="Request Enterprise Access"
        subtitle="For institutional investors and PE firms."
      />

      <div className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/terra/" className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `${ACCENT}30`, border: `1px solid ${ACCENT}40` }}
            >
              <Building2 className="w-3.5 h-3.5" style={{ color: ACCENT_LIGHT }} />
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">TERRA</span>
          </a>
          <a href="/terra/" className="text-[12px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
            ← Back to Platform
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium mb-6"
          style={{
            background: `${ACCENT}20`,
            color: ACCENT_LIGHT,
            border: `1px solid ${ACCENT}40`,
          }}
        >
          Real Estate Intelligence Pricing
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white">
          Find the deal before the market does
        </h1>
        <p
          className="text-[15px] max-w-xl mx-auto mb-10"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          From individual investors to institutional capital. Distress intelligence built for
          operators.
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
              style={{ background: `${ACCENT}30`, color: ACCENT_LIGHT }}
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
                    ? `linear-gradient(135deg, ${ACCENT}18, ${ACCENT}0a)`
                    : 'rgba(255,255,255,0.03)',
                  border: tier.highlight
                    ? `1px solid ${ACCENT}40`
                    : '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {tier.highlight && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                    style={{ background: ACCENT_LIGHT, color: '#fff' }}
                  >
                    Most Popular
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: tier.highlight ? `${ACCENT}30` : 'rgba(255,255,255,0.06)',
                    }}
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{ color: tier.highlight ? ACCENT_LIGHT : 'rgba(255,255,255,0.5)' }}
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

                {tier.cta === 'Contact Sales' ? (
                  <button
                    onClick={() => openContact()}
                    className="w-full py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all mb-8"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    {tier.cta} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    className="w-full py-3 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 transition-all mb-8"
                    style={{
                      background: tier.highlight ? ACCENT_LIGHT : 'rgba(255,255,255,0.08)',
                      color: 'white',
                      border: tier.highlight ? 'none' : '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    {tier.cta} {tier.trialDays ? `— ${tier.trialDays} days free` : ''}{' '}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <div className="space-y-2.5 flex-1">
                  {tier.features.map((f) => (
                    <div
                      key={f}
                      className="flex items-start gap-2.5 text-[13px]"
                      style={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                      <CheckCircle
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: ACCENT_LIGHT }}
                      />
                      {f}
                    </div>
                  ))}
                  {tier.notIncluded.map((f) => (
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

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-3xl mx-auto">
          {[
            { label: '14-day free trial', desc: 'Full platform access. No credit card required.' },
            {
              label: 'NYC-first, expanding',
              desc: 'All 5 boroughs covered. National expansion in 2026.',
            },
            {
              label: 'No per-deal fees',
              desc: 'One flat subscription. No transaction or AUM charges.',
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
    </div>
  );
}
