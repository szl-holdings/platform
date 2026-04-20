import { m } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'wouter';
import { FounderLayout } from './FounderLayout';

const PILLARS = [
  {
    number: 'I',
    title: 'AI agents advise.',
    detail:
      'Every AI output in the SZL platform is a recommendation, not an action. The model produces a structured suggestion with confidence scoring and source attribution. It does not execute.',
    principle: 'Autonomy without accountability is liability.',
  },
  {
    number: 'II',
    title: 'Humans confirm.',
    detail:
      'The approval surface is designed, not incidental. Operators see what the AI recommended and why, with the minimal context needed to make an informed decision. Rubber-stamping is a UI failure — we design against it.',
    principle: 'The human is in the loop because the loop needs a human.',
  },
  {
    number: 'III',
    title: 'The proof chain records everything.',
    detail:
      "Every state transition in the platform is logged in Alloy's proof chain: what signal arrived, what the AI inferred, what was recommended, who approved, what was executed, and what the outcome was. The record is tamper-evident and auditable by design.",
    principle: "If you can't reconstruct the decision, you can't govern it.",
  },
  {
    number: 'IV',
    title: 'Constraint produces capability.',
    detail:
      "Governed systems get deployed in higher-stakes environments. When operators trust that a system will not act autonomously in ways that cause enterprise damage, they give it access to more sensitive systems. The governance is not a ceiling — it's a door.",
    principle: 'The right constraint creates the right freedom.',
  },
  {
    number: 'V',
    title: "Architecture compounds. Features don't.",
    detail:
      'A feature solves one problem for one customer. An architectural decision made correctly compounds across every customer, every product, and every future capability. Build for the fabric, not the case.',
    principle: 'The durable moat is in the infrastructure, not the interface.',
  },
  {
    number: 'VI',
    title: 'Build at the pace of truth.',
    detail:
      "No announcements before the fact. No metrics without definitions. No partnerships that aren't operational. The posture of disciplined honesty is not just ethical — it is a strategic differentiator in a market full of noise.",
    principle: "Credibility is built by what you don't claim.",
  },
];

export default function FounderDoctrine() {
  return (
    <FounderLayout>
      <section
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: 'clamp(4rem, 8vw, 7rem) clamp(1.5rem, 5vw, 3rem) 3rem',
        }}
      >
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
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
              Doctrine
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(2.25rem, 6vw, 4.5rem)',
              letterSpacing: '-0.03em',
              lineHeight: 1.08,
              color: 'hsl(38, 8%, 95%)',
              marginBottom: '1.5rem',
              maxWidth: '18ch',
            }}
          >
            Governed Autonomy
          </h1>

          <p
            style={{
              fontSize: 'clamp(1rem, 1.75vw, 1.1875rem)',
              lineHeight: 1.7,
              color: 'hsl(214, 6%, 57%)',
              maxWidth: '60ch',
              marginBottom: '1rem',
            }}
          >
            Governed Autonomy is the operating doctrine of SZL Holdings. It is not a compliance
            framework, a safety checklist, or a positioning statement. It is an architectural
            posture with six concrete principles that shape how every product in the portfolio is
            designed and deployed.
          </p>
          <p
            style={{
              fontSize: 'clamp(1rem, 1.75vw, 1.1875rem)',
              lineHeight: 1.7,
              color: 'hsl(214, 6%, 57%)',
              maxWidth: '60ch',
              marginBottom: '4rem',
            }}
          >
            The doctrine emerged from a simple observation: most AI systems in enterprises are
            either ungoverned (fast, fragile, ungovernable at scale) or over-governed (safe, slow,
            not adopted). Governed Autonomy is the architecture that resolves this. It produces
            systems that are deployable in high-stakes environments precisely because they are
            structured to be trusted.
          </p>
        </m.div>

        <div
          style={{
            display: 'grid',
            gap: '0',
            borderTop: '1px solid hsla(0,0%,100%,0.055)',
          }}
        >
          {PILLARS.map((pillar, i) => (
            <m.div
              key={pillar.number}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              style={{
                display: 'grid',
                gridTemplateColumns: '3rem 1fr',
                gap: '2rem',
                padding: '2.5rem 0',
                borderBottom: '1px solid hsla(0,0%,100%,0.055)',
                alignItems: 'start',
              }}
            >
              <div
                style={{
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  color: 'hsl(38, 52%, 58%)',
                  letterSpacing: '-0.01em',
                  paddingTop: '0.25rem',
                }}
              >
                {pillar.number}
              </div>
              <div>
                <h2
                  style={{
                    fontFamily: "'Space Grotesk', system-ui, sans-serif",
                    fontWeight: 600,
                    fontSize: 'clamp(1.25rem, 2.5vw, 1.625rem)',
                    letterSpacing: '-0.015em',
                    color: 'hsl(38, 8%, 95%)',
                    marginBottom: '0.875rem',
                    lineHeight: 1.25,
                  }}
                >
                  {pillar.title}
                </h2>
                <p
                  style={{
                    fontSize: '0.9375rem',
                    lineHeight: 1.7,
                    color: 'hsl(214, 6%, 57%)',
                    marginBottom: '1.25rem',
                    maxWidth: '64ch',
                  }}
                >
                  {pillar.detail}
                </p>
                <p
                  style={{
                    fontSize: '0.8125rem',
                    fontStyle: 'italic',
                    color: 'hsl(214, 7%, 64%)',
                    borderLeft: '2px solid hsl(38, 52%, 58%)',
                    paddingLeft: '0.875rem',
                    margin: 0,
                  }}
                >
                  {pillar.principle}
                </p>
              </div>
            </m.div>
          ))}
        </div>

        <div style={{ marginTop: '4rem' }}>
          <Link href="/founder/essays/governed-autonomy">
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
              Read the full essay on Governed Autonomy
              <ArrowRight size={15} />
            </span>
          </Link>
        </div>
      </section>
    </FounderLayout>
  );
}
