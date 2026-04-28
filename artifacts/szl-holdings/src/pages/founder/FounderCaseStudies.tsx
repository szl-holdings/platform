import { registry } from '@szl-holdings/brand-registry';
import { m } from 'framer-motion';
import { ArrowRight, Building2, Clock } from 'lucide-react';
import { Link } from 'wouter';
import { FounderLayout } from './FounderLayout';

function productName(id: string): string {
  return registry.products.find((p) => p.id === id)?.name ?? id;
}

const CASE_STUDIES = [
  {
    slug: 'maritime-risk-detection',
    client: 'Global Shipping Operator',
    sector: 'Maritime',
    sectorColor: 'hsl(206, 72%, 40%)',
    duration: '6 weeks',
    headline: 'From manual port-call audits to real-time dark vessel detection',
    summary: `A maritime operations team was spending 40+ analyst hours per week manually auditing vessel port calls for compliance and sanctions exposure. We instrumented their AIS data feed through ${productName('vessels')}, connected it to ${productName('continuum')}'s workflow engine, and automated the compliance signal generation — reducing manual audit time by 78% while increasing coverage to the full fleet.`,
    outcome:
      '78% reduction in manual audit hours. Full-fleet coverage. Audit-grade record for every compliance check.',
    tags: [productName('vessels'), productName('continuum'), 'Maritime Intelligence', 'Compliance'],
  },
  {
    slug: 'real-estate-pipeline-intelligence',
    client: 'NYC Real Estate Investment Firm',
    sector: 'Real Estate',
    sectorColor: 'hsl(140, 50%, 38%)',
    duration: '8 weeks',
    headline: "Surfacing $4.8B in distressed deal flow that wasn't visible before",
    summary: `A real estate investment firm had no systematic way to identify distressed properties in their target markets before they hit the open market. We deployed ${productName('terra')}'s distress detection engine against their target neighborhoods in NYC, connected ownership graph tracking to their deal CRM, and built a tiered alert system through ${productName('continuum')}. Within 6 weeks, they had a live pipeline of distressed opportunities with full ownership chain visibility.`,
    outcome:
      '$4.8B in tracked deal pipeline. 340+ distressed properties surfaced. First deals under LOI within 60 days of deployment.',
    tags: [productName('terra'), productName('continuum'), 'Real Estate Intelligence', 'Deal Pipeline'],
  },
  {
    slug: 'fintech-operational-risk',
    client: 'Fintech Platform (Series B)',
    sector: 'Fintech',
    sectorColor: 'hsl(38, 52%, 58%)',
    duration: '10 weeks',
    headline: 'Closing the loop between payment anomaly detection and operational response',
    summary: `A fintech platform processing millions in daily transactions had robust monitoring but no structured operational response layer. Anomalies surfaced in dashboards; response happened through Slack and email. We instrumented their payment processing signals through ${productName('lyte')}'s PRAXIS engine, built approval-gated response workflows in ${productName('continuum')}, and gave their operations team a governed command surface. Incident response time dropped from 4.2 hours average to 38 minutes.`,
    outcome:
      '89% reduction in mean time to resolution. Every incident response now has a complete proof chain. Zero unauthorized autonomous actions in production.',
    tags: [productName('lyte'), productName('continuum'), 'Fintech', 'Operational Risk'],
  },
];

export default function FounderCaseStudies() {
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
              Case Studies
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
            What the platform actually did.
          </h1>
          <p
            style={{
              fontSize: '1.0625rem',
              lineHeight: 1.65,
              color: 'hsl(214, 6%, 57%)',
              maxWidth: '56ch',
            }}
          >
            Documented proof from real deployments. No mock data, no projected outcomes — these are
            the actual results from operators who instrumented real workflows through the SZL stack.
          </p>
        </m.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {CASE_STUDIES.map((cs, i) => (
            <m.div
              key={cs.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              style={{
                padding: '2.5rem',
                borderRadius: '14px',
                border: '1px solid hsla(0,0%,100%,0.055)',
                background: 'hsla(214, 14%, 6%, 0.6)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1.25rem',
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: cs.sectorColor,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px',
                    border: `1px solid ${cs.sectorColor}40`,
                    background: `${cs.sectorColor}10`,
                  }}
                >
                  <Building2 size={11} />
                  {cs.sector}
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.8125rem',
                    color: 'hsl(214, 6%, 55%)',
                  }}
                >
                  <Clock size={12} />
                  {cs.duration}
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'hsl(214, 6%, 55%)' }}>
                  {cs.client}
                </span>
              </div>

              <h2
                style={{
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                  fontWeight: 600,
                  fontSize: 'clamp(1.125rem, 2.5vw, 1.5rem)',
                  letterSpacing: '-0.015em',
                  color: 'hsl(38, 8%, 95%)',
                  marginBottom: '1rem',
                  lineHeight: 1.25,
                  maxWidth: '52ch',
                }}
              >
                {cs.headline}
              </h2>

              <p
                style={{
                  fontSize: '0.9375rem',
                  lineHeight: 1.7,
                  color: 'hsl(214, 6%, 57%)',
                  marginBottom: '1.5rem',
                  maxWidth: '72ch',
                }}
              >
                {cs.summary}
              </p>

              <div
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '8px',
                  background: 'hsla(38, 52%, 58%, 0.06)',
                  border: '1px solid hsla(38, 52%, 58%, 0.18)',
                  marginBottom: '1.5rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: 'hsl(38, 52%, 58%)',
                    marginBottom: '0.5rem',
                  }}
                >
                  Outcome
                </div>
                <p
                  style={{
                    fontSize: '0.9375rem',
                    color: 'hsl(38, 8%, 88%)',
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  {cs.outcome}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {cs.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      color: 'hsl(214, 6%, 57%)',
                      border: '1px solid hsla(0,0%,100%,0.07)',
                      background: 'hsla(0,0%,100%,0.03)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </m.div>
          ))}
        </div>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          style={{ marginTop: '4rem' }}
        >
          <p
            style={{
              fontSize: '0.9375rem',
              color: 'hsl(214, 6%, 57%)',
              marginBottom: '1.25rem',
            }}
          >
            Want to add yours?
          </p>
          <Link href="/founder/design-partner">
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
              Apply to the design partner program
              <ArrowRight size={15} />
            </span>
          </Link>
        </m.div>
      </section>
    </FounderLayout>
  );
}
