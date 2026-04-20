import { m } from 'framer-motion';
import { ArrowRight, BarChart3, Building2, MapPin, Shield, Users, Zap } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'wouter';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';

const TERRA_ACCENT = 'hsl(30,55%,52%)';
const TERRA_ACCENT_DIM = 'hsla(30,55%,52%,0.15)';
const TERRA_ACCENT_BORDER = 'hsla(30,55%,52%,0.25)';

const capabilities = [
  {
    icon: Building2,
    title: 'Listings Command View',
    description:
      'Every active, pending, and off-market listing — status, days on market, inquiry volume, agent ownership, and price trajectory — unified into one broker-grade command surface.',
  },
  {
    icon: Users,
    title: 'Inquiry Routing Engine',
    description:
      'Incoming inquiries routed by property type, agent availability, buyer qualification, and brokerage rules. No lead falls through. Every inquiry has an owner and a clock.',
  },
  {
    icon: BarChart3,
    title: 'Agent & Brokerage View',
    description:
      'Performance by agent, team, and brokerage. Close rate, average days to contract, inquiry conversion, and active pipeline — visible at every level of the organization.',
  },
  {
    icon: MapPin,
    title: 'Property Map Intelligence',
    description:
      'Geospatial layer showing listing concentration, inquiry heat, distress signals, and market absorption by submarket. Filter, zoom, act.',
  },
  {
    icon: Zap,
    title: 'Distress Signal Engine',
    description:
      'Pre-foreclosure, auction, tax-lien, and REO intelligence surfaced directly into the listing workflow. Brokers see the opportunity before it becomes a listing.',
  },
  {
    icon: Shield,
    title: 'Market Activity Layer',
    description:
      'Live absorption rates, comparable sales, price-per-sqft, and inventory depth by submarket. The market context every broker needs before pricing or positioning a listing.',
  },
];

const modules = [
  { label: 'Listings Command', tag: 'Core' },
  { label: 'Inquiry Routing', tag: 'Core' },
  { label: 'Agent Workload', tag: 'Core' },
  { label: 'Brokerage View', tag: 'Core' },
  { label: 'Property Map', tag: 'Intelligence' },
  { label: 'Distress Engine', tag: 'Intelligence' },
  { label: 'Market Activity', tag: 'Intelligence' },
  { label: 'Deal Pipeline', tag: 'Pipeline' },
  { label: 'Transaction Log', tag: 'Pipeline' },
  { label: 'Filter & Search', tag: 'UX' },
];

export default function TerraPage() {
  useEffect(() => {
    document.title = 'Terra — Broker Command Platform | SZL Holdings';
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'hsl(210,12%,5%)',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <Navbar />

      <main className="pt-24">
        <section style={{ padding: '5rem 0 4rem' }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: TERRA_ACCENT_DIM,
                    border: `1px solid ${TERRA_ACCENT_BORDER}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Building2 size={14} style={{ color: TERRA_ACCENT }} />
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: TERRA_ACCENT,
                  }}
                >
                  Terra · Broker Command Platform
                </span>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
                  fontWeight: '700',
                  letterSpacing: '-0.03em',
                  color: 'hsl(38,12%,94%)',
                  lineHeight: '1.06',
                  marginBottom: '1.5rem',
                  maxWidth: '800px',
                }}
              >
                The full broker command surface.
                <br />
                <span style={{ color: TERRA_ACCENT }}>Built for commercial real estate.</span>
              </h1>

              <p
                style={{
                  fontSize: '1.125rem',
                  lineHeight: '1.7',
                  color: 'hsl(210,5%,58%)',
                  maxWidth: '38rem',
                  marginBottom: '2.5rem',
                }}
              >
                Terra turns listings, inquiry routing, agent coordination, and market visibility
                into command. Not a consumer portal — a precision tool for how brokers actually
                operate.
              </p>

              <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
                <a
                  href="/terra/"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: TERRA_ACCENT,
                    color: 'hsl(20,10%,10%)',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '6px',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    transition: 'opacity 0.18s ease',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.88')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                >
                  Open Platform <ArrowRight size={14} />
                </a>
                <Link
                  href="/terra/platform"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'hsla(0,0%,100%,0.05)',
                    color: 'hsl(38,12%,80%)',
                    border: '1px solid hsla(0,0%,100%,0.10)',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '6px',
                    fontSize: '13.5px',
                    fontWeight: '500',
                    textDecoration: 'none',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'hsla(0,0%,100%,0.08)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'hsla(0,0%,100%,0.16)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'hsla(0,0%,100%,0.05)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'hsla(0,0%,100%,0.10)';
                  }}
                >
                  Platform Overview
                </Link>
              </div>
            </m.div>
          </div>
        </section>

        <section style={{ padding: '3rem 0 5rem' }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <m.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'hsl(210,5%,38%)',
                marginBottom: '2rem',
              }}
            >
              Platform Capabilities
            </m.p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {capabilities.map((cap, i) => (
                <m.div
                  key={cap.title}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    padding: '1.625rem',
                    borderRadius: '0.875rem',
                    background: 'hsla(0,0%,100%,0.025)',
                    border: '1px solid hsla(0,0%,100%,0.06)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'hsla(0,0%,100%,0.04)';
                    (e.currentTarget as HTMLElement).style.borderColor = TERRA_ACCENT_BORDER;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'hsla(0,0%,100%,0.025)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'hsla(0,0%,100%,0.06)';
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: TERRA_ACCENT_DIM,
                      border: `1px solid ${TERRA_ACCENT_BORDER}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1rem',
                    }}
                  >
                    <cap.icon size={16} style={{ color: TERRA_ACCENT }} />
                  </div>
                  <p
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'hsl(38,12%,90%)',
                      marginBottom: '0.5rem',
                      letterSpacing: '-0.006em',
                    }}
                  >
                    {cap.title}
                  </p>
                  <p style={{ fontSize: '12.5px', lineHeight: '1.6', color: 'hsl(210,5%,52%)' }}>
                    {cap.description}
                  </p>
                </m.div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ padding: '3rem 0 5rem', borderTop: '1px solid hsla(0,0%,100%,0.05)' }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <div className="flex flex-col lg:flex-row gap-12 items-start">
              <m.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                style={{ flex: '1' }}
              >
                <p
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'hsl(210,5%,38%)',
                    marginBottom: '1rem',
                  }}
                >
                  What's Built In
                </p>
                <h2
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    letterSpacing: '-0.022em',
                    color: 'hsl(38,12%,92%)',
                    marginBottom: '1rem',
                    lineHeight: '1.2',
                  }}
                >
                  Every module a broker
                  <br />
                  actually needs.
                </h2>
                <p
                  style={{
                    fontSize: '13px',
                    lineHeight: '1.7',
                    color: 'hsl(210,5%,52%)',
                    marginBottom: '2rem',
                    maxWidth: '28rem',
                  }}
                >
                  Terra isn't a CRM with a listings tab. It's a command surface built specifically
                  for how commercial brokers move deals, route inquiries, and manage agent
                  workloads.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {modules.map((m) => (
                    <span
                      key={m.label}
                      style={{
                        fontSize: '11.5px',
                        fontWeight: '500',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        background: 'hsla(0,0%,100%,0.04)',
                        border: '1px solid hsla(0,0%,100%,0.08)',
                        color: 'hsl(210,5%,60%)',
                      }}
                    >
                      {m.label}
                    </span>
                  ))}
                </div>
              </m.div>

              <m.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  flex: '1',
                  padding: '2rem',
                  borderRadius: '1rem',
                  background: 'hsla(0,0%,100%,0.02)',
                  border: `1px solid ${TERRA_ACCENT_BORDER}`,
                }}
              >
                <p
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: TERRA_ACCENT,
                    marginBottom: '1.25rem',
                  }}
                >
                  Signal Doctrine
                </p>
                {[
                  {
                    label: 'What happened',
                    value:
                      'Listing entered distress signal — 180 days on market, two price reductions.',
                  },
                  {
                    label: 'Why it matters',
                    value:
                      'Seller motivation is rising. Comparable closings are tightening. Window narrows.',
                  },
                  { label: 'Who owns it', value: 'Agent: Rivera, K. — last contact 12 days ago.' },
                  {
                    label: 'What action comes next',
                    value: 'Schedule seller call. Adjust pricing strategy. Reprice within 72hrs.',
                  },
                  {
                    label: 'What value is at risk',
                    value: '$2.4M commission exposure if listing expires without action.',
                  },
                ].map((item, i) => (
                  <div key={i} style={{ marginBottom: '1.125rem' }}>
                    <p
                      style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'hsl(210,5%,38%)',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {item.label}
                    </p>
                    <p style={{ fontSize: '12.5px', lineHeight: '1.55', color: 'hsl(210,5%,62%)' }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </m.div>
            </div>
          </div>
        </section>

        <section
          style={{
            padding: '3rem 0 5rem',
            background: 'hsla(30,10%,7%,0.6)',
            borderTop: '1px solid hsla(0,0%,100%,0.05)',
            borderBottom: '1px solid hsla(0,0%,100%,0.05)',
          }}
        >
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10 text-center">
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
            >
              <h2
                style={{
                  fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                  fontWeight: '700',
                  letterSpacing: '-0.022em',
                  color: 'hsl(38,12%,92%)',
                  marginBottom: '1rem',
                }}
              >
                Part of the SZL ecosystem.
              </h2>
              <p
                style={{
                  fontSize: '13.5px',
                  lineHeight: '1.7',
                  color: 'hsl(210,5%,54%)',
                  maxWidth: '32rem',
                  margin: '0 auto 2rem',
                }}
              >
                Terra runs on the Alloy intelligence engine. Every signal it surfaces follows the
                same doctrine as Lyte and Vessels — observed, understood, decided, executed.
              </p>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '1.5rem',
                  flexWrap: 'wrap',
                }}
              >
                {['SZL Holdings', 'Alloy', 'Lyte', 'Vessels', 'Terra', 'Carlota Jo'].map(
                  (name, i) => (
                    <span
                      key={name}
                      style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: i === 4 ? TERRA_ACCENT : 'hsl(210,5%,44%)',
                        opacity: i === 4 ? 1 : 0.75,
                      }}
                    >
                      {i > 0 && (
                        <span style={{ marginRight: '1.5rem', color: 'hsl(210,5%,28%)' }}>→</span>
                      )}
                      {name}
                    </span>
                  ),
                )}
              </div>
            </m.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
