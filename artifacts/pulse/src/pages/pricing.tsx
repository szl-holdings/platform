import { ContactModal, useContactModal } from '@szl-holdings/shared-ui/contact-modal';
import { PricingPage, type PricingTier } from '@szl-holdings/shared-ui/billing';

const ACCENT = '#06b6d4';

const tiers: PricingTier[] = [
  {
    id: 'pulse-executive',
    name: 'Executive',
    description: 'AI-curated intelligence briefings for executive leadership.',
    priceMonthly: 299,
    priceAnnual: 249,
    annualSavingsPct: 17,
    cta: 'Start Free Trial',
    ctaType: 'checkout',
    checkoutPlanId: 'pulse-executive-monthly',
    badge: 'LUMINA Executive',
    highlight: true,
    features: [
      'Daily AI executive briefing',
      'Custom intelligence library',
      'Briefing engine configuration',
      'Confidence scoring & dissent channel',
      'Constellation entity graph',
      'Custom brief builder',
      'Governed cockpit',
      'Priority support (4h)',
      'Up to 5 team members',
    ],
    notIncluded: ['Custom data connectors', 'Dedicated analyst', 'Enterprise SSO'],
  },
  {
    id: 'pulse-enterprise',
    name: 'Enterprise',
    description: 'Board-level intelligence infrastructure for complex organizations.',
    priceMonthly: null,
    priceAnnual: null,
    cta: 'Contact Sales',
    ctaType: 'contact',
    highlight: false,
    features: [
      'Everything in Executive',
      'Unlimited team members',
      'Custom data connectors & feeds',
      'Dedicated intelligence analyst',
      'Custom briefing schedules',
      'White-label option',
      'Enterprise SSO / SAML',
      'Custom retention & compliance exports',
      'Dedicated CSM',
      '99.9% SLA',
    ],
    notIncluded: [],
  },
];

export default function PulsePricingPage() {
  const { isOpen, open, close } = useContactModal('demo');

  return (
    <>
      <ContactModal
        isOpen={isOpen}
        onClose={close}
        type="demo"
        app="pulse"
        title="Request Enterprise Access"
        subtitle="Tell us about your leadership team's intelligence needs."
      />
      <PricingPage
        productKey="pulse"
        productName="LUMINA"
        accentColor={ACCENT}
        tiers={tiers}
        headline="Executive Intelligence, Delivered Daily"
        subheadline="AI-curated briefings that surface what matters before it becomes a problem."
        onContactSales={open}
      />
    </>
  );
}
