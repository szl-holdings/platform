import { m } from 'framer-motion';
import { ArrowRight, Building2, CheckCircle } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'wouter';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';

const TERRA_ACCENT = 'hsl(30,55%,52%)';
const TERRA_ACCENT_DIM = 'hsla(30,55%,52%,0.12)';
const TERRA_ACCENT_BORDER = 'hsla(30,55%,52%,0.22)';

const modules = [
  {
    id: 'listings-command',
    name: 'Listings Command View',
    tier: 'Core',
    description:
      'The central listings surface. Every active, pending, and archived listing with days on market, price history, inquiry volume, agent assignment, and status. Filterable by market, submarket, property type, brokerage, and agent. Not a table — a command view.',
    signals: [
      'Days on market relative to submarket average',
      'Inquiry volume and conversion rate by listing',
      'Price reduction history and cadence',
      'Agent activity and last contact timestamp',
    ],
  },
  {
    id: 'inquiry-routing',
    name: 'Inquiry Routing Engine',
    tier: 'Core',
    description:
      'Every incoming inquiry is classified, scored, and routed. Buyer qualification signals, property match score, agent availability, and brokerage assignment rules determine who gets what. Routing is auditable — every decision has a timestamp and a reason.',
    signals: [
      'Inquiry classification: buyer type, intent level, financing status',
      'Agent match score by specialization and availability',
      'Auto-escalation for high-score inquiries',
      'Routing audit trail with override capability',
    ],
  },
  {
    id: 'agent-view',
    name: 'Agent & Brokerage View',
    tier: 'Core',
    description:
      'Performance at every level of the organization. Individual agent metrics, team views, and brokerage rollups — all with the same signal structure. Close rate, days to contract, inquiry conversion, and active pipeline. No vanity metrics.',
    signals: [
      'Agent close rate vs. brokerage average',
      'Active pipeline by stage and estimated value',
      'Days to contract by listing type',
      'Inquiry conversion rate with cohort comparison',
    ],
  },
  {
    id: 'property-map',
    name: 'Property Map Intelligence',
    tier: 'Intelligence',
    description:
      'Geospatial layer rendering listing concentration, inquiry heat, distress signal density, and market absorption by submarket. Brokers can filter, zoom to a submarket, and surface all relevant signals for that geography in one motion.',
    signals: [
      'Listing concentration by zip and submarket',
      'Inquiry heat — where demand is clustering',
      'Distress signal overlay with severity scoring',
      'Market absorption by property type and radius',
    ],
  },
  {
    id: 'distress-engine',
    name: 'Distress Signal Engine',
    tier: 'Intelligence',
    description:
      "Pre-foreclosure, lis pendens, auction registry, tax lien, and REO signals surfaced into the broker workflow. Opportunity scoring flags the properties with the highest likelihood of motivated sellers. This is not a news feed — it's an action queue.",
    signals: [
      'Opportunity score 0–100 with rationale',
      'Days in distress and escalation stage',
      'Debt-to-value and equity position estimate',
      'Suggested strategy: outreach, note purchase, or monitor',
    ],
  },
  {
    id: 'market-activity',
    name: 'Market Activity Layer',
    tier: 'Intelligence',
    description:
      'Live and trailed market data — comparable sales, price per square foot trends, inventory depth, and absorption rate by submarket. Structured as context a broker needs before pricing a listing or advising a client.',
    signals: [
      'Comparable sales with adjustments by property type',
      'Price-per-sqft trend with 30/60/90 day periods',
      'Inventory months and absorption rate by submarket',
      'YoY price change with volume context',
    ],
  },
  {
    id: 'deal-pipeline',
    name: 'Deal Pipeline',
    tier: 'Pipeline',
    description:
      'Acquisitions and dispositions tracked from first contact to close. Stage-gated pipeline with probability weighting, estimated commission, and days in stage. Every deal has a clock and an owner.',
    signals: [
      'Deal stage with probability-weighted value',
      'Days in stage vs. historical average',
      'Commission exposure and estimated close date',
      'Linked listing and inquiry trail',
    ],
  },
  {
    id: 'transaction-log',
    name: 'Transaction Log',
    tier: 'Pipeline',
    description:
      'Closed transactions with full data: sale price, days on market, commission, agent, buyer, seller, financing terms, and close date. The permanent record of every deal the brokerage has touched.',
    signals: [
      'Closed price vs. list price and variance',
      'Commission by agent and brokerage',
      'Buyer and seller record with linked inquiry history',
      'Days from listing to close',
    ],
  },
];

const featureFlags = [
  {
    key: 'terra_map_mode_enabled',
    description: 'Activates geospatial property map layer with distress and inquiry heat overlays.',
  },
  {
    key: 'terra_broker_view_enabled',
    description: 'Enables brokerage-level rollup view with multi-agent comparative analytics.',
  },
];

export default function TerraPlatformPage() {
  useEffect(() => {
    document.title = 'Terra Platform — Broker Command Surface | SZL Holdings';
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
        <section style={{ padding: '5rem 0 3rem' }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <m.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: TERRA_ACCENT,
                  }}
                >
                  Terra · Platform
                </span>
              </div>
              <h1
                style={{
                  fontSize: 'clamp(2rem, 4.5vw, 3.5rem)',
                  fontWeight: '700',
                  letterSpacing: '-0.028em',
                  color: 'hsl(38,12%,94%)',
                  lineHeight: '1.07',
                  marginBottom: '1.25rem',
                  maxWidth: '740px',
                }}
              >
                Every module. Every signal.
                <br />
                Every action that moves a deal.
              </h1>
              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: '1.75',
                  color: 'hsl(210,5%,56%)',
                  maxWidth: '36rem',
                  marginBottom: '2rem',
                }}
              >
                Terra is structured around eight core modules. Each one follows the same signal
                doctrine: what happened, why it matters, who owns it, what comes next, and what
                value is at risk.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <a
                  href="/terra/"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: TERRA_ACCENT,
                    color: 'hsl(20,10%,10%)',
                    padding: '0.675rem 1.375rem',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    textDecoration: 'none',
                  }}
                >
                  Open Platform <ArrowRight size={13} />
                </a>
                <Link
                  href="/terra/listings"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'hsla(0,0%,100%,0.05)',
                    color: 'hsl(38,12%,78%)',
                    border: '1px solid hsla(0,0%,100%,0.09)',
                    padding: '0.675rem 1.375rem',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    textDecoration: 'none',
                  }}
                >
                  View Listings
                </Link>
              </div>
            </m.div>
          </div>
        </section>

        <section style={{ padding: '2rem 0 5rem' }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            {modules.map((mod, i) => (
              <m.div
                key={mod.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.055, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  display: 'flex',
                  gap: '2rem',
                  padding: '1.75rem',
                  borderRadius: '0.875rem',
                  background: 'hsla(0,0%,100%,0.022)',
                  border: '1px solid hsla(0,0%,100%,0.06)',
                  marginBottom: '0.75rem',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'hsla(0,0%,100%,0.038)';
                  (e.currentTarget as HTMLElement).style.borderColor = TERRA_ACCENT_BORDER;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'hsla(0,0%,100%,0.022)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'hsla(0,0%,100%,0.06)';
                }}
              >
                <div
                  style={{
                    width: '4px',
                    flexShrink: 0,
                    borderRadius: '2px',
                    background: TERRA_ACCENT,
                    opacity: mod.tier === 'Core' ? 0.85 : 0.55,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '15px',
                        fontWeight: '700',
                        color: 'hsl(38,12%,92%)',
                        letterSpacing: '-0.008em',
                      }}
                    >
                      {mod.name}
                    </p>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: '600',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: mod.tier === 'Core' ? TERRA_ACCENT_DIM : 'hsla(0,0%,100%,0.06)',
                        border: `1px solid ${mod.tier === 'Core' ? TERRA_ACCENT_BORDER : 'hsla(0,0%,100%,0.09)'}`,
                        color: mod.tier === 'Core' ? TERRA_ACCENT : 'hsl(210,5%,52%)',
                      }}
                    >
                      {mod.tier}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '13px',
                      lineHeight: '1.65',
                      color: 'hsl(210,5%,54%)',
                      marginBottom: '1rem',
                      maxWidth: '48rem',
                    }}
                  >
                    {mod.description}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {mod.signals.map((sig, j) => (
                      <div
                        key={j}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                      >
                        <CheckCircle
                          size={11}
                          style={{ color: TERRA_ACCENT, flexShrink: 0, opacity: 0.7 }}
                        />
                        <span style={{ fontSize: '12px', color: 'hsl(210,5%,52%)' }}>{sig}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </m.div>
            ))}
          </div>
        </section>

        <section style={{ padding: '3rem 0 5rem', borderTop: '1px solid hsla(0,0%,100%,0.05)' }}>
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            <m.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
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
                Feature Flags
              </p>
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  letterSpacing: '-0.02em',
                  color: 'hsl(38,12%,90%)',
                  marginBottom: '1.5rem',
                }}
              >
                Configurable capability layers.
              </h2>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.625rem',
                  maxWidth: '36rem',
                }}
              >
                {featureFlags.map((flag) => (
                  <div
                    key={flag.key}
                    style={{
                      padding: '1rem 1.25rem',
                      borderRadius: '0.625rem',
                      background: 'hsla(0,0%,100%,0.025)',
                      border: '1px solid hsla(0,0%,100%,0.07)',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '12.5px',
                        fontWeight: '600',
                        color: 'hsl(38,12%,80%)',
                        fontFamily: "'JetBrains Mono', monospace",
                        marginBottom: '0.375rem',
                      }}
                    >
                      {flag.key}
                    </p>
                    <p style={{ fontSize: '12px', lineHeight: '1.55', color: 'hsl(210,5%,50%)' }}>
                      {flag.description}
                    </p>
                  </div>
                ))}
              </div>
            </m.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
