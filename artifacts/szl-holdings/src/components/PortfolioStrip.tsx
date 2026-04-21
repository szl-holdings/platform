import { m } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const ventures = [
  {
    name: 'FORGE',
    tagline: 'The AI command center powering the entire ecosystem.',
    category: 'AI Orchestration',
    status: 'Live',
    href: '/alloy/',
    accent: 'hsl(218,50%,58%)',
    accentMuted: 'hsla(218,50%,58%,0.10)',
  },
  {
    name: 'KORA',
    tagline: 'Operational decision intelligence for enterprise operations.',
    category: 'Decision Intelligence',
    status: 'Live',
    href: '/command/operations/',
    accent: 'hsl(192,70%,46%)',
    accentMuted: 'hsla(192,70%,46%,0.10)',
  },
  {
    name: 'SEXTANT',
    tagline: 'Maritime command and fleet intelligence at scale.',
    category: 'Maritime Intelligence',
    status: 'Live',
    href: '/vessels/',
    accent: 'hsl(208,65%,48%)',
    accentMuted: 'hsla(208,65%,48%,0.10)',
  },
  {
    name: 'Carlota Jo',
    tagline: 'Founder-led advisory for consequential decisions.',
    category: 'Strategic Advisory',
    status: 'Live',
    href: '/carlota-jo/',
    accent: 'hsl(32,38%,58%)',
    accentMuted: 'hsla(32,38%,58%,0.10)',
  },
];

const statusStyle: Record<string, { color: string; bg: string; border: string }> = {
  Live: {
    color: 'hsl(152,50%,46%)',
    bg: 'hsla(152,50%,42%,0.10)',
    border: 'hsla(152,50%,42%,0.20)',
  },
  Beta: { color: 'hsl(42,80%,54%)', bg: 'hsla(42,80%,50%,0.10)', border: 'hsla(42,80%,50%,0.20)' },
};

export function PortfolioStrip() {
  return (
    <section
      style={{
        background: 'hsl(210,12%,7%)',
        paddingTop: 'clamp(5rem,9vw,8rem)',
        paddingBottom: 'clamp(5rem,9vw,8rem)',
        borderTop: '1px solid hsla(0,0%,100%,0.04)',
        borderBottom: '1px solid hsla(0,0%,100%,0.04)',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(1.25rem,5vw,2.5rem)' }}>
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: 'clamp(2.5rem,5vw,4rem)' }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: '500',
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: 'hsl(210,5%,46%)',
              marginBottom: '1rem',
            }}
          >
            Portfolio
          </span>
          <h2
            style={{
              fontSize: 'clamp(1.75rem,3.5vw,2.5rem)',
              fontWeight: '700',
              letterSpacing: '-0.022em',
              lineHeight: '1.12',
              color: 'hsl(38,12%,94%)',
              marginBottom: '0.75rem',
            }}
          >
            Six operating platforms
          </h2>
          <p
            style={{
              fontSize: '1.0625rem',
              color: 'hsl(210,5%,58%)',
              lineHeight: '1.65',
              maxWidth: '34rem',
            }}
          >
            Each platform commands its vertical while sharing infrastructure and intelligence across
            the ecosystem.
          </p>
        </m.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {ventures.map((v, i) => (
            <m.a
              key={v.name}
              href={v.href}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.52, delay: i * 0.055, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '1.375rem',
                borderRadius: '0.875rem',
                background: 'hsla(210,10%,10%,0.50)',
                border: '1px solid hsla(0,0%,100%,0.06)',
                textDecoration: 'none',
                transition: 'all 0.20s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'hsla(210,10%,12%,0.62)';
                el.style.borderColor = 'hsla(0,0%,100%,0.09)';
                el.style.boxShadow = '0 6px 20px hsla(0,0%,0%,0.28)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'hsla(210,10%,10%,0.50)';
                el.style.borderColor = 'hsla(0,0%,100%,0.06)';
                el.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: v.accentMuted,
                    border: `1px solid ${v.accent}28`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: v.accent,
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '600',
                      letterSpacing: '0.04em',
                      color: statusStyle[v.status]?.color,
                      background: statusStyle[v.status]?.bg,
                      border: `1px solid ${statusStyle[v.status]?.border}`,
                    }}
                  >
                    {v.status}
                  </span>
                  <ArrowUpRight size={14} color="hsl(210,5%,36%)" />
                </div>
              </div>
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  letterSpacing: '-0.008em',
                  color: 'hsl(38,12%,94%)',
                  marginBottom: '0.375rem',
                }}
              >
                {v.name}
              </h3>
              <p
                style={{
                  fontSize: '13px',
                  color: 'hsl(210,5%,56%)',
                  lineHeight: '1.58',
                  marginBottom: '0.875rem',
                }}
              >
                {v.tagline}
              </p>
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: '500',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'hsl(210,5%,40%)',
                }}
              >
                {v.category}
              </p>
            </m.a>
          ))}
        </div>
      </div>
    </section>
  );
}
