import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Zap,
} from 'lucide-react';

const TERRA_ACCENT = '#c87941';

const CASE_STUDY = {
  id: 'CS001',
  title: '55 Water Street — Distress-to-Deal in 60 Days',
  category: 'Listing / Inquiry',
  submarket: 'Financial District, Manhattan',
  listPrice: 134000000,
  salePrice: 118000000,
  daysToClose: 61,
  closedDate: '2026-03-14',
  problem: {
    headline: 'Extended distress listing with no qualified inquiry flow.',
    body: "55 Water Street had been listed for 189 days — 3 price reductions, 4 inquiries, none qualified. The opportunity score had dropped to 38. Standard outreach cadence had failed. The agent had no visibility into why inquiries weren't converting or where qualified buyers were looking.",
  },
  context: {
    property:
      '298,000 sqft Class B office tower, Financial District, built 1972. Tenant roll in Q1 2026 created distress signal. Owner debt maturity triggered forced sale at below-market pricing.',
    market:
      'Financial District office absorption running at 2.1% — one of the lowest submarkets in NYC. Comparable sales averaging $410–480 psf.',
    brokerContext:
      'Terra Commercial had the exclusive. Agent Chen was managing 6 active listings. No dedicated inquiry classification or routing was in use.',
  },
  constraints: [
    'Owner required close within 90 days of listing expiration',
    'Property had active tenant occupancy — limited showing access',
    '3 prior inquiries from undercapitalized buyers created noise in the pipeline',
    'Listing agent carried 6 concurrent active listings with no inquiry triage',
  ],
  system: {
    headline:
      'Terra Distress Engine surfaced the debt maturity signal. Inquiry Routing filtered and routed the right buyer.',
    steps: [
      {
        label: 'Distress Engine',
        description:
          'Terra flagged the debt maturity event and long DOM combination. Opportunity score recalibrated to 78 after manual review override — signaling motivated seller, not weak asset.',
      },
      {
        label: 'Inquiry Classification',
        description:
          'Incoming inquiry from Cerberus RE Opportunities classified as investor, cash, score 78. Automatically routed to Chen (office specialty, investor experience) with context attached.',
      },
      {
        label: 'Agent Prompt',
        description:
          "Routing note: 'Distress signal listing — debt play candidate. Cerberus confirmed cash. Prioritize financials and one-on-one call within 48 hours.'",
      },
      {
        label: 'Listing Repricing',
        description:
          'Market Activity Layer surfaced new comp at $398 psf. Agent recommended 11% price reduction to $118M — seller accepted after 1 call.',
      },
      {
        label: 'Showing Coordination',
        description:
          'Terra logged showing date, attendees, and follow-up cadence. Agent returned next action within 24 hours of each touchpoint.',
      },
    ],
  },
  howItWorked:
    'Cerberus submitted a full-price cash offer at $118M within 12 days of first contact. Terra tracked every inquiry touchpoint, routing decision, and agent action in the audit trail. Close completed in 61 days from offer submission.',
  outcome: {
    closedAt: '$118,000,000',
    daysFromSignal: 61,
    commission: '$2,360,000',
    commissionPct: '2.0%',
    priceToList: '88%',
    keyMetric:
      '3 prior unrouted inquiries had touched this listing — none converted. The 4th was routed with a buyer profile and context. It closed.',
  },
  visualProof: [
    { label: 'DOM at signal', value: '189 days', color: '#f87171' },
    { label: 'Days to offer after routing', value: '12 days', color: TERRA_ACCENT },
    { label: 'Days from offer to close', value: '61 days', color: '#4ade80' },
    { label: 'Prior unrouted inquiries', value: '3', color: '#fbbf24' },
    { label: 'Commission earned', value: '$2.36M', color: TERRA_ACCENT },
  ],
  whyItMatters:
    "This wasn't a hard-to-sell building — it was a misrouted opportunity. The distress signal was real. The buyer was real. The gap was the system connecting them. Terra's Inquiry Routing Engine and Distress Signal layer closed that gap in 60 days.",
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.07 } }),
};

export default function CaseStudyPage() {
  return (
    <div
      style={{
        padding: '1.5rem 1.5rem 4rem',
        maxWidth: '780px',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: '2rem' }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}
        >
          <span
            style={{
              fontSize: '10px',
              fontWeight: '600',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: TERRA_ACCENT,
              padding: '2px 8px',
              borderRadius: '4px',
              background: `${TERRA_ACCENT}15`,
              border: `1px solid ${TERRA_ACCENT}25`,
            }}
          >
            Case Study · {CASE_STUDY.category}
          </span>
          <span style={{ fontSize: '10px', color: 'hsl(210,5%,40%)' }}>{CASE_STUDY.submarket}</span>
        </div>
        <h1
          style={{
            fontSize: '1.625rem',
            fontWeight: '700',
            color: 'hsl(38,12%,92%)',
            letterSpacing: '-0.018em',
            lineHeight: '1.2',
            marginBottom: '0.75rem',
          }}
        >
          {CASE_STUDY.title}
        </h1>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Closed', value: CASE_STUDY.outcome.closedAt },
            { label: 'Days to Close', value: `${CASE_STUDY.daysToClose}d` },
            { label: 'Commission', value: CASE_STUDY.outcome.commission },
          ].map((stat) => (
            <div key={stat.label}>
              <p
                style={{
                  fontSize: '9.5px',
                  fontWeight: '600',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'hsl(210,5%,38%)',
                  marginBottom: '0.2rem',
                }}
              >
                {stat.label}
              </p>
              <p
                style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: TERRA_ACCENT,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {[
        {
          i: 0,
          section: 'Problem',
          icon: AlertTriangle,
          content: (
            <div>
              <p
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'hsl(38,12%,85%)',
                  marginBottom: '0.5rem',
                }}
              >
                {CASE_STUDY.problem.headline}
              </p>
              <p style={{ fontSize: '12.5px', lineHeight: '1.65', color: 'hsl(210,5%,54%)' }}>
                {CASE_STUDY.problem.body}
              </p>
            </div>
          ),
        },
        {
          i: 1,
          section: 'Context',
          icon: Building2,
          content: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Property', value: CASE_STUDY.context.property },
                { label: 'Market', value: CASE_STUDY.context.market },
                { label: 'Brokerage Context', value: CASE_STUDY.context.brokerContext },
              ].map((item) => (
                <div key={item.label}>
                  <p
                    style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      letterSpacing: '0.07em',
                      textTransform: 'uppercase',
                      color: 'hsl(210,5%,36%)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {item.label}
                  </p>
                  <p style={{ fontSize: '12.5px', lineHeight: '1.6', color: 'hsl(210,5%,54%)' }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          ),
        },
        {
          i: 2,
          section: 'Constraints',
          icon: Clock,
          content: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {CASE_STUDY.constraints.map((c, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: 'hsla(0,0%,100%,0.07)',
                      border: '1px solid hsla(0,0%,100%,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '1px',
                    }}
                  >
                    <span style={{ fontSize: '8px', color: 'hsl(210,5%,50%)', fontWeight: '700' }}>
                      {idx + 1}
                    </span>
                  </div>
                  <p style={{ fontSize: '12.5px', lineHeight: '1.55', color: 'hsl(210,5%,54%)' }}>
                    {c}
                  </p>
                </div>
              ))}
            </div>
          ),
        },
        {
          i: 3,
          section: 'System Built',
          icon: Zap,
          content: (
            <div>
              <p
                style={{
                  fontSize: '12.5px',
                  color: 'hsl(38,12%,78%)',
                  marginBottom: '1rem',
                  lineHeight: '1.6',
                }}
              >
                {CASE_STUDY.system.headline}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {CASE_STUDY.system.steps.map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.875rem' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        flexShrink: 0,
                        background: `${TERRA_ACCENT}18`,
                        border: `1px solid ${TERRA_ACCENT}30`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <span style={{ fontSize: '9px', fontWeight: '700', color: TERRA_ACCENT }}>
                        {idx + 1}
                      </span>
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'hsl(38,12%,82%)',
                          marginBottom: '0.2rem',
                        }}
                      >
                        {step.label}
                      </p>
                      <p style={{ fontSize: '12px', lineHeight: '1.55', color: 'hsl(210,5%,52%)' }}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ),
        },
        {
          i: 4,
          section: 'How It Worked',
          icon: ArrowRight,
          content: (
            <p style={{ fontSize: '12.5px', lineHeight: '1.7', color: 'hsl(210,5%,54%)' }}>
              {CASE_STUDY.howItWorked}
            </p>
          ),
        },
        {
          i: 5,
          section: 'Outcome',
          icon: CheckCircle,
          content: (
            <div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                }}
              >
                {[
                  { label: 'Closed At', value: CASE_STUDY.outcome.closedAt },
                  { label: 'Commission', value: CASE_STUDY.outcome.commission },
                  { label: 'Price / List', value: CASE_STUDY.outcome.priceToList },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '0.5rem',
                      background: 'hsla(0,0%,100%,0.03)',
                      border: '1px solid hsla(0,0%,100%,0.06)',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '9px',
                        fontWeight: '600',
                        letterSpacing: '0.07em',
                        textTransform: 'uppercase',
                        color: 'hsl(210,5%,36%)',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {stat.label}
                    </p>
                    <p
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: '700',
                        color: TERRA_ACCENT,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
              <div
                style={{
                  padding: '0.875rem',
                  borderRadius: '0.5rem',
                  background: `${TERRA_ACCENT}10`,
                  border: `1px solid ${TERRA_ACCENT}25`,
                }}
              >
                <p style={{ fontSize: '12px', lineHeight: '1.6', color: 'hsl(38,12%,75%)' }}>
                  {CASE_STUDY.outcome.keyMetric}
                </p>
              </div>
            </div>
          ),
        },
        {
          i: 6,
          section: 'Visual Proof',
          icon: BarChart3,
          content: (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {CASE_STUDY.visualProof.map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: '0.875rem 1.125rem',
                    borderRadius: '0.625rem',
                    background: 'hsla(0,0%,100%,0.03)',
                    border: '1px solid hsla(0,0%,100%,0.07)',
                    minWidth: '120px',
                  }}
                >
                  <p
                    style={{
                      fontSize: '9.5px',
                      fontWeight: '600',
                      letterSpacing: '0.07em',
                      textTransform: 'uppercase',
                      color: 'hsl(210,5%,36%)',
                      marginBottom: '0.375rem',
                    }}
                  >
                    {item.label}
                  </p>
                  <p
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: '700',
                      color: item.color,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          ),
        },
        {
          i: 7,
          section: 'Why It Matters',
          icon: DollarSign,
          content: (
            <p
              style={{
                fontSize: '13px',
                lineHeight: '1.7',
                color: 'hsl(38,12%,76%)',
                fontWeight: '500',
              }}
            >
              {CASE_STUDY.whyItMatters}
            </p>
          ),
        },
      ].map(({ i, section, icon: Icon, content }) => (
        <motion.div
          key={section}
          custom={i}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          style={{
            marginBottom: '1.25rem',
            padding: '1.375rem',
            borderRadius: '0.75rem',
            background: 'hsla(0,0%,100%,0.025)',
            border: '1px solid hsla(0,0%,100%,0.06)',
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: `${TERRA_ACCENT}15`,
                border: `1px solid ${TERRA_ACCENT}25`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={12} style={{ color: TERRA_ACCENT }} />
            </div>
            <p
              style={{
                fontSize: '10px',
                fontWeight: '700',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: TERRA_ACCENT,
              }}
            >
              {section}
            </p>
          </div>
          {content}
        </motion.div>
      ))}
    </div>
  );
}
