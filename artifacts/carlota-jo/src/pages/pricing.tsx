import { PricingPage, type PricingTier } from '@szl-holdings/shared-ui/billing';

const ACCENT = '#d97706';

const tiers: PricingTier[] = [
  {
    id: 'strategy-session',
    name: 'Strategy Session',
    description: 'A 90-minute deep-dive session to align your strategy and identify your highest-leverage opportunities.',
    priceMonthly: 2500,
    priceAnnual: null,
    cta: 'Book Session',
    ctaType: 'checkout',
    checkoutPlanId: 'strategy-session',
    mode: 'payment',
    highlight: false,
    features: [
      '90-minute facilitated session',
      'Pre-session intake and diagnostic',
      'Strategic opportunity mapping',
      'Priority action framework',
      'Written summary with recommendations',
      'Follow-up Q&A (30 min, within 2 weeks)',
    ],
    notIncluded: ['Ongoing advisory access', 'Portfolio review'],
  },
  {
    id: 'portfolio-review',
    name: 'Portfolio Review',
    description: 'Comprehensive analysis of your portfolio or business landscape with actionable intelligence.',
    priceMonthly: 5000,
    priceAnnual: null,
    cta: 'Book Review',
    ctaType: 'checkout',
    checkoutPlanId: 'portfolio-review',
    mode: 'payment',
    highlight: true,
    badge: 'Most Requested',
    features: [
      'Full portfolio or business audit',
      'Competitive landscape analysis',
      'Risk and opportunity matrix',
      'Executive briefing (2 hours)',
      'Detailed written report (20+ pages)',
      'Two follow-up sessions (60 min each)',
      'Priority email access for 30 days',
    ],
    notIncluded: ['Ongoing monthly advisory'],
  },
  {
    id: 'advisory-retainer',
    name: 'Advisory Retainer',
    description: 'Ongoing strategic partnership with dedicated advisory access and continuous intelligence.',
    priceMonthly: 8500,
    priceAnnual: null,
    cta: 'Start Retainer',
    ctaType: 'checkout',
    checkoutPlanId: 'advisory-retainer',
    mode: 'subscription',
    highlight: false,
    features: [
      'Monthly strategy sessions (2 × 90 min)',
      'Unlimited async advisory (email/Slack)',
      'Quarterly portfolio or business review',
      'Strategic intelligence briefings',
      'Priority access for urgent situations',
      'Annual strategic planning workshop',
      'Investor or board preparation support',
    ],
    notIncluded: [],
  },
];

export default function CarlotaJoPricingPage() {
  return (
    <PricingPage
      productKey="carlota-jo"
      productName="Carlota Jo"
      accentColor={ACCENT}
      tiers={tiers}
      showAnnualToggle={false}
      headline="Strategic Advisory Services"
      subheadline="Precision thinking for founders, operators, and executives navigating critical transitions."
    />
  );
}
