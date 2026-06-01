import { ContactModal, useContactModal } from '@szl-holdings/shared-ui/contact-modal';
import { PricingPage, type PricingTier } from '@szl-holdings/shared-ui/billing';

const ACCENT = '#a78bfa';

const tiers: PricingTier[] = [
  {
    id: 'counsel-team',
    name: 'Team',
    description: 'For in-house legal teams managing structured matter portfolios.',
    priceMonthly: 699,
    priceAnnual: 549,
    annualSavingsPct: 21,
    cta: 'Start Free Trial',
    ctaType: 'checkout',
    checkoutPlanId: 'counsel-team-monthly',
    highlight: false,
    features: [
      'Up to 15 users',
      'Matter overview & obligation timeline',
      'Risk exposure desk',
      'Dependency graph',
      '90-day signal history',
      'Standard integrations (email, calendar)',
      'Priority support (24h)',
    ],
    notIncluded: [
      'Prism counsel intelligence engine',
      'Trust provenance & evidence chain',
      'SSO / SAML',
      'Dedicated CSM',
    ],
  },
  {
    id: 'counsel-enterprise',
    name: 'Enterprise',
    description: 'Full legal intelligence for enterprise GC offices and law firms.',
    priceMonthly: null,
    priceAnnual: null,
    cta: 'Contact Sales',
    ctaType: 'contact',
    badge: 'Enterprise',
    highlight: true,
    features: [
      'Unlimited users',
      'Full Counsel surface — all modules',
      'Prism intelligence engine with evidence chains',
      'Trust provenance & audit chain',
      'Unlimited matter history',
      'SSO / SAML / SCIM provisioning',
      'Custom playbooks & matter templates',
      'Privilege-protected exports',
      'Dedicated Customer Success Manager',
      '99.9% SLA with DPA',
      'On-premises deployment option',
    ],
    notIncluded: [],
  },
];

export default function CounselPricingPage() {
  const { isOpen, open, close } = useContactModal('demo');

  return (
    <>
      <ContactModal
        isOpen={isOpen}
        onClose={close}
        type="demo"
        app="counsel"
        title="Request Enterprise Access"
        subtitle="Tell us about your legal team's requirements."
      />
      <PricingPage
        productKey="counsel"
        productName="Counsel"
        accentColor={ACCENT}
        tiers={tiers}
        headline="Legal Intelligence at Enterprise Scale"
        subheadline="From matter tracking to autonomous risk detection. Built for GC offices and legal operations teams."
        onContactSales={open}
      />
    </>
  );
}
