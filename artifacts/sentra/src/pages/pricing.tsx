import { ContactModal, useContactModal } from '@szl-holdings/shared-ui/contact-modal';
import { PricingPage, type PricingTier } from '@szl-holdings/shared-ui/billing';
import { useNavigate } from 'wouter';

const ACCENT = '#ef4444';

const tiers: PricingTier[] = [
  {
    id: 'sentra-team',
    name: 'Team',
    description: 'For security teams getting started with unified cyber resilience.',
    priceMonthly: 499,
    priceAnnual: 399,
    annualSavingsPct: 20,
    cta: 'Start Free Trial',
    ctaType: 'checkout',
    checkoutPlanId: 'sentra-team-monthly',
    highlight: false,
    features: [
      'Up to 10 team members',
      'Threat overview & resilience scorecard',
      'Asset risk graph',
      'Incident command center',
      '7-day signal history',
      'Email support (48h)',
    ],
    notIncluded: [
      'Mesh exposure & containment',
      'Trust provenance chain',
      'SSO / SAML',
      'Dedicated CSM',
    ],
  },
  {
    id: 'sentra-enterprise',
    name: 'Enterprise',
    description: 'Full autonomous cyber resilience with compliance-grade audit trails.',
    priceMonthly: null,
    priceAnnual: null,
    cta: 'Contact Sales',
    ctaType: 'contact',
    badge: 'Enterprise',
    highlight: true,
    features: [
      'Unlimited team members',
      'Full SENTRA surface — all modules',
      'Mesh map, exposures, containment & drift',
      'Trust provenance & evidence chain',
      'Unlimited signal history',
      'SSO / SAML / SCIM',
      'Custom detection rules & playbooks',
      'Compliance exports (SOC 2, ISO 27001)',
      'Dedicated Customer Success Manager',
      '99.9% SLA',
      'On-premises / private cloud option',
    ],
    notIncluded: [],
  },
];

export default function SentraPricingPage() {
  const { isOpen, open, close } = useContactModal('demo');
  const [, navigate] = useNavigate();

  return (
    <>
      <ContactModal
        isOpen={isOpen}
        onClose={close}
        type="demo"
        app="sentra"
        title="Request Enterprise Access"
        subtitle="Tell us about your security environment."
      />
      <PricingPage
        productKey="sentra"
        productName="Sentra"
        accentColor={ACCENT}
        tiers={tiers}
        headline="Cyber Resilience at Enterprise Scale"
        subheadline="From reactive security monitoring to autonomous defense. Every tier includes a full-featured trial."
        onContactSales={open}
      />
    </>
  );
}
