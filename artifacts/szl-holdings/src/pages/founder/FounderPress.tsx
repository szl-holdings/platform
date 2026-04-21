import { registry } from '@szl-holdings/brand-registry';
import { m } from 'framer-motion';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'wouter';
import { FounderLayout } from './FounderLayout';

const { funding, metrics, company } = registry;

const seedRound = funding.find((f) => f.round === 'Seed');
const seriesA = funding.find((f) => f.round === 'Series A');
const seriesB = funding.find((f) => f.round === 'Series B');

const metricsValues = Object.values(metrics);
const platformMetric = metricsValues.find((m) => m.label === 'Portfolio platforms');
const connectorsMetric = metricsValues.find((m) => m.label.toLowerCase().includes('connector'));

const PROOF_POINTS = [
  {
    category: 'Company',
    items: [
      {
        label: 'Founded',
        value: company.foundedQuarter,
        detail: 'Self-funded, no external capital at inception',
      },
      ...(seedRound
        ? [
            {
              label: seedRound.round,
              value: seedRound.amount,
              detail: seedRound.detail ?? 'Angel investors; founding team of four engineers',
            },
          ]
        : []),
      ...(seriesA
        ? [
            {
              label: seriesA.round,
              value: seriesA.amount,
              detail: seriesA.detail ?? 'Institutional consortium',
            },
          ]
        : []),
      ...(seriesB
        ? [
            {
              label: `${seriesB.round} Target`,
              value: seriesB.amount,
              detail: 'International expansion + three products to GA',
            },
          ]
        : []),
    ],
  },
  {
    category: 'Platform',
    items: [
      {
        label: 'Active Platforms',
        value: platformMetric?.value ?? '6',
        detail: 'Lyte, Alloy, Aegis, Vessels, Terra, Carlota Jo',
      },
      ...(connectorsMetric
        ? [
            {
              label: connectorsMetric.label,
              value: connectorsMetric.value,
              detail: 'Live integrations across the execution fabric',
            },
          ]
        : [
            {
              label: 'Alloy Connectors',
              value: '35+',
              detail: 'Live integrations across the execution fabric',
            },
          ]),
      {
        label: 'Terra Deal Pipeline',
        value: '$4.8B',
        detail: 'Tracked across NYC distress market',
      },
      {
        label: 'Distress Properties Tracked',
        value: '340+',
        detail: 'Live via Terra in target markets',
      },
    ],
  },
  {
    category: 'Target Milestones',
    items: [
      {
        label: 'Target ARR',
        value: '$35M+',
        detail: '2026 — driven by design-partner to commercial conversion',
      },
      {
        label: 'Jurisdictions',
        value: company.headquarters.length.toString(),
        detail: company.headquarters.join(' · '),
      },
      {
        label: 'Architecture',
        value: '1',
        detail: 'One founder. One shared fabric. Eight verticals.',
      },
    ],
  },
];

const MEDIA_MENTIONS = [
  {
    outlet: 'Substack',
    handle: '@szlholdings',
    type: 'Newsletter',
    description: 'Architecture breakdowns, doctrine essays, and company updates.',
    href: 'https://szlholdings.substack.com',
  },
  {
    outlet: 'LinkedIn',
    handle: 'Stephen Lutar',
    type: 'Professional',
    description: 'Building and architecture commentary from the founder.',
    href: 'https://linkedin.com/in/stephen-l-279315240',
  },
  {
    outlet: 'Medium',
    handle: '@stephen_38454',
    type: 'Long-form',
    description: 'Extended essays on enterprise AI, governed systems, and architecture.',
    href: 'https://medium.com/@stephen_38454',
  },
];

const INVESTOR_SIGNALS = [
  {
    signal: `${platformMetric?.value ?? 'Six'} live platforms`,
    detail: `Not ${platformMetric?.value?.toLowerCase() ?? 'six'} slides. ${platformMetric?.value ?? 'Six'} deployed, revenue-generating platforms with real operators and real data.`,
  },
  {
    signal: 'One shared execution fabric',
    detail: `Alloy is not a feature. It is the infrastructure that compounds across every vertical. ${seriesA ? `A ${seriesA.amount} ${seriesA.round} validated the thesis.` : 'Institutional funding validated the thesis.'}`,
  },
  {
    signal: 'Disciplined cap table',
    detail: `Minimal dilution at seed. ${seriesA ? `Institutional ${seriesA.round} with a tight principal-only process.` : 'Institutional Series A with a tight principal-only process.'} No strategic rounds that compromise the roadmap.`,
  },
  {
    signal: `${seriesB ? seriesB.round : 'Series B'} is structured, not speculative`,
    detail: `The ${seriesB ? seriesB.amount : '$45M'} Series B target is tied to specific product milestones: Counsel and Carlota Jo to GA, triple Aegis defense presence. The plan is real.`,
  },
];

export default function FounderPress() {
  const { founder, metrics, funding, company } = registry;

  return (
    <FounderLayout>
      <section
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 3rem) clamp(3rem, 6vw, 5rem)',
        }}
      >
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: '4rem' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              marginBottom: '1.5rem',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'hsl(38, 52%, 58%)',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontSize: '0.8125rem',
                color: 'hsl(214, 6%, 57%)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontWeight: 500,
              }}
            >
              Proof & Press
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: 'hsl(38, 8%, 95%)',
              marginBottom: '1.25rem',
              maxWidth: '22ch',
            }}
          >
            What's auditable.
          </h1>
          <p
            style={{
              fontSize: '1.0625rem',
              lineHeight: 1.65,
              color: 'hsl(214, 6%, 57%)',
              maxWidth: '58ch',
            }}
          >
            Every number here is sourced and auditable. No projected figures presented as current.
            No partnerships that aren't operational. The doctrine of disciplined honesty starts with
            this page.
          </p>
        </m.div>

        {PROOF_POINTS.map((section, si) => (
          <m.div
            key={section.category}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, delay: si * 0.07 }}
            style={{ marginBottom: '3rem' }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                color: 'hsl(214, 6%, 57%)',
                marginBottom: '1rem',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {section.category}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
                gap: '1rem',
              }}
            >
              {section.items.map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: '1.5rem',
                    borderRadius: '10px',
                    border: '1px solid hsla(0,0%,100%,0.055)',
                    background: 'hsla(214, 14%, 6%, 0.5)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Space Grotesk', system-ui, sans-serif",
                      fontWeight: 700,
                      fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
                      letterSpacing: '-0.02em',
                      color: 'hsl(38, 52%, 58%)',
                      lineHeight: 1,
                      marginBottom: '0.5rem',
                    }}
                  >
                    {item.value}
                  </div>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: 'hsl(38, 8%, 95%)',
                      marginBottom: '0.375rem',
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'hsl(214, 6%, 57%)' }}>
                    {item.detail}
                  </div>
                </div>
              ))}
            </div>
          </m.div>
        ))}

        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          style={{ marginBottom: '4rem' }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: 'hsl(214, 6%, 57%)',
              marginBottom: '1rem',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Investor Signals
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {INVESTOR_SIGNALS.map((signal, i) => (
              <div
                key={signal.signal}
                style={{
                  padding: '1.5rem 0',
                  borderBottom: '1px solid hsla(0,0%,100%,0.055)',
                  display: 'grid',
                  gridTemplateColumns: 'min(240px, 40%) 1fr',
                  gap: '2rem',
                  alignItems: 'start',
                }}
              >
                <div
                  style={{
                    fontFamily: "'Space Grotesk', system-ui, sans-serif",
                    fontWeight: 600,
                    fontSize: '0.9375rem',
                    color: 'hsl(38, 8%, 95%)',
                    lineHeight: 1.3,
                  }}
                >
                  {signal.signal}
                </div>
                <div
                  style={{
                    fontSize: '0.9375rem',
                    color: 'hsl(214, 6%, 57%)',
                    lineHeight: 1.65,
                  }}
                >
                  {signal.detail}
                </div>
              </div>
            ))}
          </div>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          style={{ marginBottom: '4rem' }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              color: 'hsl(214, 6%, 57%)',
              marginBottom: '1rem',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Writing & Media
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
              gap: '1rem',
            }}
          >
            {MEDIA_MENTIONS.map((m_item) => (
              <a
                key={m_item.outlet}
                href={m_item.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    padding: '1.5rem',
                    borderRadius: '10px',
                    border: '1px solid hsla(0,0%,100%,0.055)',
                    background: 'hsla(214, 14%, 6%, 0.5)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'hsla(0,0%,100%,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'hsla(0,0%,100%,0.055)';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Space Grotesk', system-ui, sans-serif",
                        fontWeight: 600,
                        fontSize: '0.9375rem',
                        color: 'hsl(38, 8%, 95%)',
                      }}
                    >
                      {m_item.outlet}
                    </span>
                    <ExternalLink size={13} style={{ color: 'hsl(214, 6%, 57%)' }} />
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'hsl(214, 6%, 57%)' }}>
                    {m_item.handle} · {m_item.type}
                  </div>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      color: 'hsl(214, 7%, 60%)',
                      lineHeight: 1.55,
                    }}
                  >
                    {m_item.description}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <p style={{ fontSize: '0.9375rem', color: 'hsl(214, 6%, 57%)', marginBottom: '1rem' }}>
            Press inquiries and investor conversations:
          </p>
          <Link href="/founder/contact">
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.9375rem',
                color: 'hsl(38, 52%, 58%)',
                cursor: 'pointer',
                textDecoration: 'none',
              }}
            >
              Get in touch
              <ArrowRight size={15} />
            </span>
          </Link>
        </m.div>
      </section>
    </FounderLayout>
  );
}
