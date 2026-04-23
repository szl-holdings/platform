import { m } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

const thesisPillars = [
  {
    number: '01',
    label: 'Command-Centered Design',
    desc: 'Every platform is architected around the command metaphor — structured visibility, decision support, and action in one place. No dashboard noise. No disconnected tools.',
    accent: 'hsl(190,90%,55%)',
    accentRgb: '14,201,224',
  },
  {
    number: '02',
    label: 'Compound Architecture',
    desc: 'Platforms share infrastructure, auth, observability, and design. Each new product benefits from everything built before it — compounding structural advantage over time.',
    accent: 'hsl(214,80%,65%)',
    accentRgb: '92,155,228',
  },
  {
    number: '03',
    label: 'Domain Specificity',
    desc: 'We operate in domains where precision matters: maritime, cybersecurity, AI research, and enterprise operations. Horizontal generic tools leave room for purpose-built command.',
    accent: 'hsl(160,70%,45%)',
    accentRgb: '34,168,120',
  },
  {
    number: '04',
    label: 'Institutional Trust',
    desc: 'The Carlota Jo advisory brand serves the private layer — high-trust, high-consequence operational support where white-glove execution and structured systems intersect.',
    accent: 'hsl(38,55%,58%)',
    accentRgb: '191,152,82',
  },
];

const investorPaths = [
  {
    type: 'Strategic Partners',
    desc: 'Domain-specific enterprises seeking command infrastructure across maritime, cybersecurity, or AI operations.',
    cta: 'Partner Conversation',
    accentRgb: '148,163,184',
  },
  {
    type: 'Capital Partners',
    desc: 'Institutional and family office investors aligned with long-duration, compounding platform businesses.',
    cta: 'Investor Inquiry',
    accentRgb: '14,201,224',
  },
  {
    type: 'Enterprise Clients',
    desc: 'Mid-to-large enterprises evaluating KORA, SEXTANT, or the broader ecosystem for production deployment.',
    cta: 'Platform Demo',
    accentRgb: '92,155,228',
  },
];

export function InvestorThesis() {
  return (
    <section
      id="thesis"
      style={{
        padding: '7rem 0',
        background: 'hsl(210,12%,5%)',
        borderTop: '1px solid hsla(0,0%,100%,0.04)',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-[1fr,440px] gap-16 lg:gap-24 items-start mb-16">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <p
              style={{
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'hsl(210,5%,40%)',
                marginBottom: '0.875rem',
                fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
              }}
            >
              Investment Thesis
            </p>
            <h2
              style={{
                fontSize: 'clamp(1.9rem, 3.5vw, 2.75rem)',
                fontWeight: '700',
                letterSpacing: '-0.026em',
                color: 'hsl(38,12%,94%)',
                lineHeight: '1.06',
                fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                marginBottom: '1.25rem',
              }}
            >
              Command infrastructure for domains that cannot afford ambiguity.
            </h2>
            <p
              style={{
                fontSize: '0.9375rem',
                lineHeight: '1.72',
                color: 'hsl(210,5%,56%)',
                maxWidth: '32rem',
              }}
            >
              SZL Holdings is a vertically-integrated command systems studio. We build precision
              platforms across high-stakes domains — and the compounding infrastructure that
              connects them. Investors gain exposure to an 8-platform portfolio sharing one
              architecture, one auth layer, and one operating doctrine.
            </p>
          </m.div>

          <m.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            style={{
              padding: '1.75rem',
              background: 'hsla(210,12%,8%,0.8)',
              border: '1px solid hsla(0,0%,100%,0.07)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <p
              style={{
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'hsl(210,5%,40%)',
                marginBottom: '1.25rem',
                fontFamily: "'JetBrains Mono', 'Space Mono', monospace",
              }}
            >
              Portfolio Snapshot
            </p>
            <div className="space-y-3">
              {[
                { label: 'Active Platforms', value: '8', sub: 'All live and operational' },
                {
                  label: 'Shared Architecture',
                  value: '1',
                  sub: 'Auth, observability, design system',
                },
                {
                  label: 'Domains Covered',
                  value: '5+',
                  sub: 'Maritime, cyber, AI, ops, advisory',
                },
                { label: 'Founder-Led', value: '100%', sub: 'Owner-operated, full alignment' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-2.5 px-3"
                  style={{
                    borderBottom: '1px solid hsla(0,0%,100%,0.05)',
                  }}
                >
                  <div>
                    <p style={{ fontSize: '12px', color: 'hsl(210,5%,62%)', fontWeight: '500' }}>
                      {item.label}
                    </p>
                    <p
                      style={{
                        fontSize: '10px',
                        color: 'hsl(210,5%,36%)',
                        fontFamily: "'JetBrains Mono', 'Space Mono', monospace",
                        marginTop: '2px',
                      }}
                    >
                      {item.sub}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: '700',
                      color: 'hsl(190,90%,55%)',
                      fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                      letterSpacing: '-0.03em',
                    }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/investor-relations"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: '600',
                color: 'hsl(210,5%,50%)',
                textDecoration: 'none',
                marginTop: '1.25rem',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'hsl(38,12%,90%)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'hsl(210,5%,50%)';
              }}
            >
              Investor Relations
              <ArrowRight size={12} strokeWidth={2.5} />
            </Link>
          </m.div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-16">
          {thesisPillars.map((pillar, i) => (
            <m.div
              key={pillar.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.48, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              style={{
                padding: '1.5rem',
                borderRadius: '4px',
                background: `rgba(${pillar.accentRgb}, 0.04)`,
                border: `1px solid rgba(${pillar.accentRgb}, 0.10)`,
                borderTop: `2px solid rgba(${pillar.accentRgb}, 0.28)`,
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: '9.5px',
                  fontWeight: '700',
                  letterSpacing: '0.12em',
                  color: pillar.accent,
                  marginBottom: '0.875rem',
                  fontFamily: "'JetBrains Mono', 'Space Mono', monospace",
                }}
              >
                {pillar.number}
              </span>
              <h3
                style={{
                  fontSize: '13px',
                  fontWeight: '700',
                  color: 'hsl(38,12%,88%)',
                  marginBottom: '0.625rem',
                  letterSpacing: '-0.01em',
                  fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                }}
              >
                {pillar.label}
              </h3>
              <p style={{ fontSize: '12px', lineHeight: '1.65', color: 'hsl(210,5%,50%)' }}>
                {pillar.desc}
              </p>
            </m.div>
          ))}
        </div>

        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <p
            style={{
              fontSize: '10px',
              fontWeight: '600',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'hsl(210,5%,40%)',
              marginBottom: '0.75rem',
              fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
            }}
          >
            How to Engage
          </p>
          <h3
            style={{
              fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
              fontWeight: '700',
              letterSpacing: '-0.022em',
              color: 'hsl(38,12%,94%)',
              fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
            }}
          >
            The right conversation starts here.
          </h3>
        </m.div>

        <div className="grid sm:grid-cols-3 gap-3">
          {investorPaths.map((path, i) => (
            <m.div
              key={path.type}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.48, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={`/contact?type=${path.type.toLowerCase().replace(' ', '-')}`}
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  padding: '1.5rem',
                  borderRadius: '4px',
                  background: 'hsla(0,0%,100%,0.02)',
                  border: '1px solid hsla(0,0%,100%,0.06)',
                  transition: 'all 0.22s ease',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = `rgba(${path.accentRgb}, 0.05)`;
                  el.style.borderColor = `rgba(${path.accentRgb}, 0.18)`;
                  el.style.transform = 'translateY(-2px)';
                  el.style.boxShadow = `0 8px 24px rgba(0,0,0,0.28)`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'hsla(0,0%,100%,0.02)';
                  el.style.borderColor = 'hsla(0,0%,100%,0.06)';
                  el.style.transform = 'translateY(0)';
                  el.style.boxShadow = 'none';
                }}
              >
                <p
                  style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'hsl(210,5%,44%)',
                    marginBottom: '0.625rem',
                    fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                  }}
                >
                  {path.type}
                </p>
                <p
                  style={{
                    fontSize: '13px',
                    lineHeight: '1.6',
                    color: 'hsl(210,5%,60%)',
                    marginBottom: '1.125rem',
                  }}
                >
                  {path.desc}
                </p>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'hsl(210,5%,48%)',
                    transition: 'color 0.18s ease',
                  }}
                >
                  {path.cta}
                  <ArrowRight size={11} strokeWidth={2.5} />
                </div>
              </Link>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
