import { m } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const featured = [
  {
    name: 'KORA',
    category: 'Decision Intelligence',
    description:
      'Enterprise-grade platform for operational observability, risk detection, and accountability. Signal cards surface anomalies with action ownership and consequence framing.',
    capabilities: [
      'KPI drift detection',
      'Workflow friction analysis',
      'Role-based insight rail',
      'Executive dashboards',
    ],
    href: '/command/operations/',
    accent: 'hsl(192,70%,46%)',
    accentMuted: 'hsla(192,70%,46%,0.08)',
    status: 'Live',
    weight: 'primary',
  },
  {
    name: 'SEXTANT',
    category: 'Maritime Intelligence',
    description:
      'Fleet command and real-time maritime intelligence. Route adherence, anomalous behaviour detection, and comprehensive fleet visibility across global shipping lanes.',
    capabilities: [
      'Fleet tracking',
      'Route intelligence',
      'Anomaly detection',
      'Operational reporting',
    ],
    href: '/vessels/',
    accent: 'hsl(208,65%,48%)',
    accentMuted: 'hsla(208,65%,48%,0.08)',
    status: 'Live',
    weight: 'primary',
  },
  {
    name: 'Carlota Jo',
    category: 'Strategic Advisory',
    description:
      'Founder-led principal advisory for boards, leadership teams, and investors navigating consequential decisions. Quiet precision at the highest level.',
    capabilities: [
      'Board advisory',
      'Capital strategy',
      'Operational transformation',
      'Executive counsel',
    ],
    href: '/carlota-jo/',
    accent: 'hsl(32,38%,58%)',
    accentMuted: 'hsla(32,38%,58%,0.08)',
    status: 'Live',
    weight: 'secondary',
  },
];

const statusStyle: Record<string, { color: string; bg: string; border: string }> = {
  Live: {
    color: 'hsl(152,50%,46%)',
    bg: 'hsla(152,50%,42%,0.10)',
    border: 'hsla(152,50%,42%,0.20)',
  },
  Pilot: {
    color: 'hsl(210,60%,62%)',
    bg: 'hsla(210,60%,58%,0.10)',
    border: 'hsla(210,60%,58%,0.20)',
  },
  'In Build': {
    color: 'hsl(42,80%,54%)',
    bg: 'hsla(42,80%,50%,0.10)',
    border: 'hsla(42,80%,50%,0.20)',
  },
};

export function FeaturedVentures() {
  return (
    <section
      id="portfolio"
      className="relative"
      style={{
        background: 'hsl(210,12%,5%)',
        paddingTop: 'clamp(5rem,9vw,8rem)',
        paddingBottom: 'clamp(5rem,9vw,8rem)',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(1.25rem,5vw,2.5rem)' }}>
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
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
            Featured Platforms
          </span>
          <h2
            style={{
              fontSize: 'clamp(1.75rem,3.5vw,2.5rem)',
              fontWeight: '700',
              letterSpacing: '-0.022em',
              lineHeight: '1.12',
              color: 'hsl(38,12%,94%)',
              marginBottom: '0.875rem',
            }}
          >
            The flagship platforms
          </h2>
          <p
            style={{
              fontSize: '1.0625rem',
              color: 'hsl(210,5%,58%)',
              lineHeight: '1.65',
              maxWidth: '36rem',
            }}
          >
            Lyte and Vessels lead the portfolio as full command surfaces. Carlota Jo operates as a
            precision advisory practice.
          </p>
        </m.div>

        <div className="grid lg:grid-cols-2 gap-4 lg:gap-5 mb-4 lg:mb-5">
          {featured
            .filter((f) => f.weight === 'primary')
            .map((v, i) => (
              <m.a
                key={v.name}
                href={v.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.58, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 'clamp(1.5rem,3vw,2.25rem)',
                  borderRadius: '1rem',
                  background: 'hsla(210,12%,10%,0.55)',
                  border: '1px solid hsla(0,0%,100%,0.07)',
                  boxShadow: '0 4px 20px hsla(0,0%,0%,0.28), 0 1px 3px hsla(0,0%,0%,0.18)',
                  textDecoration: 'none',
                  transition: 'all 0.22s ease',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'hsla(210,12%,12%,0.65)';
                  el.style.borderColor = 'hsla(0,0%,100%,0.10)';
                  el.style.boxShadow = `0 12px 40px hsla(0,0%,0%,0.38), 0 0 0 1px ${v.accent}18`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'hsla(210,12%,10%,0.55)';
                  el.style.borderColor = 'hsla(0,0%,100%,0.07)';
                  el.style.boxShadow =
                    '0 4px 20px hsla(0,0%,0%,0.28), 0 1px 3px hsla(0,0%,0%,0.18)';
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: `linear-gradient(90deg, transparent, ${v.accent}40, transparent)`,
                  }}
                  aria-hidden="true"
                />

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <div
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: v.accent,
                          boxShadow: `0 0 8px ${v.accent}55`,
                        }}
                      />
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '500',
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: 'hsl(210,5%,46%)',
                        }}
                      >
                        {v.category}
                      </span>
                    </div>
                    <h3
                      style={{
                        fontSize: '1.375rem',
                        fontWeight: '700',
                        letterSpacing: '-0.018em',
                        color: 'hsl(38,12%,94%)',
                      }}
                    >
                      {v.name}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        padding: '3px 9px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        letterSpacing: '0.04em',
                        color: statusStyle[v.status]?.color,
                        background: statusStyle[v.status]?.bg,
                        border: `1px solid ${statusStyle[v.status]?.border}`,
                      }}
                    >
                      {v.status}
                    </span>
                    <ArrowUpRight size={16} color="hsl(210,5%,36%)" />
                  </div>
                </div>

                <p
                  style={{
                    fontSize: '0.9375rem',
                    color: 'hsl(210,5%,60%)',
                    lineHeight: '1.62',
                    marginBottom: '1.5rem',
                    flex: 1,
                  }}
                >
                  {v.description}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {v.capabilities.map((cap) => (
                    <span
                      key={cap}
                      style={{
                        fontSize: '11.5px',
                        fontWeight: '500',
                        padding: '3px 10px',
                        borderRadius: '4px',
                        background: 'hsla(0,0%,100%,0.04)',
                        border: '1px solid hsla(0,0%,100%,0.06)',
                        color: 'hsl(210,5%,56%)',
                        letterSpacing: '-0.003em',
                      }}
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </m.a>
            ))}
        </div>

        <div>
          {featured
            .filter((f) => f.weight === 'secondary')
            .map((v, i) => (
              <m.a
                key={v.name}
                href={v.href}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -2 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  alignItems: 'center',
                  gap: 'clamp(1rem,3vw,2rem)',
                  padding: 'clamp(1.25rem,2.5vw,1.75rem) clamp(1.25rem,3vw,2rem)',
                  borderRadius: '0.875rem',
                  background: 'hsla(210,12%,10%,0.40)',
                  border: '1px solid hsla(0,0%,100%,0.06)',
                  textDecoration: 'none',
                  transition: 'all 0.20s ease',
                  cursor: 'pointer',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'hsla(210,12%,12%,0.55)';
                  el.style.borderColor = 'hsla(0,0%,100%,0.09)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = 'hsla(210,12%,10%,0.40)';
                  el.style.borderColor = 'hsla(0,0%,100%,0.06)';
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: v.accentMuted,
                    border: `1px solid ${v.accent}28`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: v.accent,
                    }}
                  />
                </div>
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: '500',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'hsl(210,5%,44%)',
                      }}
                    >
                      {v.category}
                    </span>
                    <span
                      style={{
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600',
                        color: statusStyle[v.status]?.color,
                        background: statusStyle[v.status]?.bg,
                        border: `1px solid ${statusStyle[v.status]?.border}`,
                      }}
                    >
                      {v.status}
                    </span>
                  </div>
                  <h3
                    style={{
                      fontSize: '1.0625rem',
                      fontWeight: '600',
                      letterSpacing: '-0.008em',
                      color: 'hsl(38,12%,94%)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {v.name}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'hsl(210,5%,56%)', lineHeight: '1.55' }}>
                    {v.description}
                  </p>
                </div>
                <ArrowUpRight size={18} color="hsl(210,5%,36%)" style={{ flexShrink: 0 }} />
              </m.a>
            ))}
        </div>
      </div>
    </section>
  );
}
