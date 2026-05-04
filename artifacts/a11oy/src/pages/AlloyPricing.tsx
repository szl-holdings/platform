import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { PricingTier } from '@szl-holdings/design-system';
import { T } from './alloy-theme';
import { AlloyTopBar } from './AlloyTopBar';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');
const b = (path: string) => `${BASE}${path}`;
const ease = [0.22, 1, 0.36, 1] as const;

const TIERS = [
  {
    name: 'Operator',
    tagline: 'For teams getting started with governed AI',
    price: '$490',
    period: 'per seat / mo',
    note: 'Billed annually · 14-day free trial',
    features: [
      { text: 'Up to 10 operator seats', included: true },
      { text: 'Proof Chain — 30-day retention', included: true },
      { text: 'Policy Engine — standard covenants', included: true },
      { text: '3 connected domain packs', included: true },
      { text: 'Cognitive Runtime — shared inference', included: true },
      { text: 'SSO (OIDC)', included: true },
      { text: 'Basic audit export (CSV)', included: true },
      { text: 'Dedicated inference capacity', included: false },
      { text: 'Sovereign regions & residency', included: false },
      { text: 'Custom covenant authoring', included: false },
      { text: 'Air-gapped private spaces', included: false },
      { text: 'SLA + dedicated support', included: false },
    ],
    cta: 'Start free trial',
    featured: false,
  },
  {
    name: 'Team',
    tagline: 'For scaling enterprise deployments across verticals',
    price: '$1,290',
    period: 'per seat / mo',
    note: 'Billed annually · Volume discounts available',
    features: [
      { text: 'Unlimited operator seats', included: true },
      { text: 'Proof Chain — 1-year retention', included: true },
      { text: 'Policy Engine — custom covenants', included: true },
      { text: 'All connected domain packs', included: true },
      { text: 'Cognitive Runtime — dedicated inference', included: true },
      { text: 'SSO (SAML 2.0 + OIDC)', included: true },
      { text: 'Resource groups + RBAC', included: true },
      { text: 'Advanced audit export (JSON + SIEM)', included: true },
      { text: 'Sovereign regions & residency', included: false },
      { text: 'Custom covenant authoring', included: false },
      { text: 'Air-gapped private spaces', included: false },
      { text: 'SLA + dedicated support', included: false },
    ],
    cta: 'Contact sales',
    featured: true,
  },
  {
    name: 'Enterprise',
    tagline: 'For regulated industries and sovereign deployments',
    price: undefined,
    period: '',
    note: 'Starting at $5,000 / mo · Negotiated contracts',
    features: [
      { text: 'Unlimited seats + resource groups', included: true },
      { text: 'Proof Chain — unlimited retention', included: true },
      { text: 'Policy Engine — full covenant stack', included: true },
      { text: 'All packs + custom connectors', included: true },
      { text: 'Dedicated Cognitive Runtime cluster', included: true },
      { text: 'SSO + MFA + SCIM provisioning', included: true },
      { text: 'Sovereign regions + air-gapped spaces', included: true },
      { text: 'Full audit export + regulator-ready packages', included: true },
      { text: 'Custom covenant authoring', included: true },
      { text: 'Air-gapped private spaces', included: true },
      { text: '99.95% SLA + dedicated support', included: true },
      { text: 'Right to audit (SOC 2 + custom)', included: true },
    ],
    cta: 'Talk to us',
    featured: false,
  },
];

const FAQ = [
  {
    q: 'What is a "seat"?',
    a: 'A seat is an operator account with access to the Alloy hub, their assigned domain packs, and the Proof Chain audit log. Service accounts and API keys are not counted as seats.',
  },
  {
    q: 'What is the Proof Chain?',
    a: 'The Proof Chain is an immutable, append-only ledger of every consequential action in your Alloy deployment. Every AI recommendation, human approval, and policy evaluation is recorded with a SHA-256 hash and attributed to a real actor.',
  },
  {
    q: 'What is a "domain pack"?',
    a: 'A domain pack is a pre-configured intelligence surface for a specific vertical — Terra (real estate), Vessels (maritime), Counsel (legal), Sentra (security), Aegis (defense), Carlota Jo (advisory). Each pack connects its domain-specific data, agents, and models into Alloy.',
  },
  {
    q: 'Can I bring my own models?',
    a: 'Yes. The Cognitive Runtime model router supports bring-your-own-model via the AEF adapter. Enterprise plans include a dedicated model registry and inference cluster.',
  },
  {
    q: 'What does "sovereign regions" mean?',
    a: 'On Enterprise plans, your data and agents can be pinned to a specific cloud region or on-premises deployment. Every data placement decision is enforced by Policy Engine covenants and recorded in the Proof Chain.',
  },
];

export function AlloyPricing() {
  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: T.sans }}>
      <AlloyTopBar backLabel="Alloy" backHref={b('/hub')} />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '5rem clamp(1.25rem, 5vw, 4rem) 4rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          style={{ textAlign: 'center', marginBottom: '3.5rem' }}
        >
          <p style={{
            fontSize: '0.625rem', fontFamily: T.mono, fontWeight: 600,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: T.textMuted, marginBottom: '0.75rem',
          }}>Pricing & Plans</p>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800, color: T.text, letterSpacing: '-0.04em',
            marginBottom: '1rem',
          }}>
            Governance that compounds.
          </h1>
          <p style={{
            fontSize: '1.0625rem', color: T.textDim,
            maxWidth: '50ch', margin: '0 auto',
            lineHeight: 1.65,
          }}>
            Every tier is built on compounding intelligence — not raw model count.
            The more your operators use Alloy, the smarter the evidence stream becomes.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem',
          alignItems: 'start',
          marginBottom: '4rem',
        }}>
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * i, ease }}
            >
              <PricingTier
                name={tier.name}
                tagline={tier.tagline}
                price={tier.price}
                priceSuffix={tier.period || undefined}
                features={tier.features}
                cta={tier.cta}
                ctaHref="mailto:inquiries@szlholdings.com"
                featured={tier.featured}
              />
              {tier.note && (
                <p style={{
                  fontSize: '0.6875rem', color: T.textMuted,
                  fontFamily: T.mono, textAlign: 'center',
                  marginTop: '0.5rem',
                }}>
                  {tier.note}
                </p>
              )}
            </motion.div>
          ))}
        </div>

        <div style={{
          borderTop: `1px solid ${T.border}`,
          paddingTop: '3.5rem',
          maxWidth: 720, margin: '0 auto',
        }}>
          <h2 style={{
            fontSize: '1.375rem', fontWeight: 700, color: T.text,
            letterSpacing: '-0.025em', marginBottom: '2rem',
          }}>
            Frequently asked questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {FAQ.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.06 * i, ease }}
              >
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: T.text, marginBottom: '0.5rem' }}>
                  {item.q}
                </h3>
                <p style={{ fontSize: '0.875rem', color: T.textDim, lineHeight: 1.65, margin: 0 }}>
                  {item.a}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        <div style={{
          marginTop: '4rem',
          padding: '2.5rem',
          background: T.accentGlow,
          border: `1px solid ${T.accent}20`,
          borderRadius: 16, textAlign: 'center',
        }}>
          <h2 style={{ fontSize: '1.375rem', fontWeight: 700, color: T.text, marginBottom: '0.75rem' }}>
            Not sure where to start?
          </h2>
          <p style={{ fontSize: '0.9375rem', color: T.textDim, maxWidth: '42ch', margin: '0 auto 1.5rem' }}>
            Talk to our team. We'll match you to the right plan and walk you through Alloy's governance architecture.
          </p>
          <a
            href="mailto:inquiries@szlholdings.com"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.875rem 2rem',
              background: T.accent, color: '#0a0a0a',
              borderRadius: 10, fontSize: '0.9375rem', fontWeight: 700,
              textDecoration: 'none', letterSpacing: '-0.01em',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.85'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
          >
            Contact sales →
          </a>
        </div>
      </main>
    </div>
  );
}
