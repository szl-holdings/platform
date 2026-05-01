import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const TERRA_ACCENT = '#c87941';

interface CaseStudy {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  submarket: string;
  scenario?: string;
  status: 'closed' | 'active';
  headerStats: Array<{ label: string; value: string }>;
  problem: { headline: string; body: string };
  context: { property: string; market: string; brokerContext: string };
  constraints: string[];
  system: { headline: string; steps: Array<{ label: string; description: string }> };
  howItWorked: string;
  outcome: { closedAt?: string; commission?: string; priceToList?: string; keyMetric: string; stats: Array<{ label: string; value: string }> };
  visualProof: Array<{ label: string; value: string; color: string }>;
  whyItMatters: string;
  forecastHeads?: Array<{ name: string; value: string; status: 'critical' | 'high' | 'ok'; unit: string }>;
}

const CASE_STUDY_55_WATER: CaseStudy = {
  id: 'CS001',
  title: '55 Water Street',
  subtitle: 'Distress-to-Deal in 60 Days',
  category: 'Listing / Inquiry',
  submarket: 'Financial District, Manhattan',
  status: 'closed',
  headerStats: [
    { label: 'Closed', value: '$118,000,000' },
    { label: 'Days to Close', value: '61d' },
    { label: 'Commission', value: '$2.36M' },
  ],
  problem: {
    headline: 'Extended distress listing with no qualified inquiry flow.',
    body: "55 Water Street had been listed for 189 days — 3 price reductions, 4 inquiries, none qualified. The opportunity score had dropped to 38. Standard outreach cadence had failed. The agent had no visibility into why inquiries weren't converting or where qualified buyers were looking.",
  },
  context: {
    property: '298,000 sqft Class B office tower, Financial District, built 1972. Tenant roll in Q1 2026 created distress signal. Owner debt maturity triggered forced sale at below-market pricing.',
    market: 'Financial District office absorption running at 2.1% — one of the lowest submarkets in NYC. Comparable sales averaging $410–480 psf.',
    brokerContext: 'TERRA Commercial had the exclusive. Agent Chen was managing 6 active listings. No dedicated inquiry classification or routing was in use.',
  },
  constraints: [
    'Owner required close within 90 days of listing expiration',
    'Property had active tenant occupancy — limited showing access',
    '3 prior inquiries from undercapitalized buyers created noise in the pipeline',
    'Listing agent carried 6 concurrent active listings with no inquiry triage',
  ],
  system: {
    headline: 'TERRA Distress Engine surfaced the debt maturity signal. Inquiry Routing filtered and routed the right buyer.',
    steps: [
      { label: 'Distress Engine', description: 'TERRA flagged the debt maturity event and long DOM combination. Opportunity score recalibrated to 78 after manual review override — signaling motivated seller, not weak asset.' },
      { label: 'Inquiry Classification', description: 'Incoming inquiry from Cerberus RE Opportunities classified as investor, cash, score 78. Automatically routed to Chen (office specialty, investor experience) with context attached.' },
      { label: 'Agent Prompt', description: "Routing note: 'Distress signal listing — debt play candidate. Cerberus confirmed cash. Prioritize financials and one-on-one call within 48 hours.'" },
      { label: 'Listing Repricing', description: 'Market Activity Layer surfaced new comp at $398 psf. Agent recommended 11% price reduction to $118M — seller accepted after 1 call.' },
      { label: 'Showing Coordination', description: 'TERRA logged showing date, attendees, and follow-up cadence. Agent returned next action within 24 hours of each touchpoint.' },
    ],
  },
  howItWorked: 'Cerberus submitted a full-price cash offer at $118M within 12 days of first contact. TERRA tracked every inquiry touchpoint, routing decision, and agent action in the audit trail. Close completed in 61 days from offer submission.',
  outcome: {
    closedAt: '$118,000,000',
    commission: '$2,360,000',
    priceToList: '88%',
    keyMetric: '3 prior unrouted inquiries had touched this listing — none converted. The 4th was routed with a buyer profile and context. It closed.',
    stats: [
      { label: 'Closed At', value: '$118,000,000' },
      { label: 'Commission', value: '$2,360,000' },
      { label: 'Price / List', value: '88%' },
    ],
  },
  visualProof: [
    { label: 'DOM at signal', value: '189 days', color: '#f87171' },
    { label: 'Days to offer after routing', value: '12 days', color: TERRA_ACCENT },
    { label: 'Days from offer to close', value: '61 days', color: '#4ade80' },
    { label: 'Prior unrouted inquiries', value: '3', color: '#fbbf24' },
    { label: 'Commission earned', value: '$2.36M', color: TERRA_ACCENT },
  ],
  whyItMatters: "This wasn't a hard-to-sell building — it was a misrouted opportunity. The distress signal was real. The buyer was real. The gap was the system connecting them. TERRA's Inquiry Routing Engine and Distress Signal layer closed that gap in 60 days.",
};

const CASE_STUDY_SUNBELT: CaseStudy = {
  id: 'CS002',
  title: 'Sunbelt Multifamily Distress 2026',
  subtitle: 'Cascade Risk Detection Across a 7-Asset Portfolio',
  category: 'Portfolio / Distress Intelligence',
  submarket: 'Phoenix–Tucson–Las Vegas Corridor',
  scenario: 'sunbelt-multifamily-2026',
  status: 'active',
  headerStats: [
    { label: 'Assets at Risk', value: '7 of 12' },
    { label: 'Cascade Probability (90d)', value: '67%' },
    { label: 'Exposure', value: '$312M' },
  ],
  problem: {
    headline: 'Cross-collateralised Sunbelt multifamily portfolio showing systemic distress signals not visible in any single-asset view.',
    body: 'A 12-asset Sunbelt multifamily portfolio managed by SZL Holdings entered 2026 with occupancy softening across 7 of 12 properties. DSCR on 4 assets had fallen below 1.0. Lender concentration with a single regional bank created a cross-default exposure that standard asset-level monitoring tools entirely missed. Climate risk — rising heat index and property insurance escalation across Phoenix and Las Vegas — had not yet been priced into cap-rate assumptions. No cascade model existed.',
  },
  context: {
    property: '12 multifamily assets, 2,847 total units, across Phoenix AZ, Tucson AZ, and Las Vegas NV. Vintage 2003–2018. 4 assets with DSCR < 1.0. Average occupancy 72% vs. 89% peak in 2024.',
    market: 'Sunbelt multifamily submarket vacancy running at 14% — up from 7% in Q1 2024. New supply deliveries peaking in H1 2026 across all three metros. Insurance loss-ratio escalation averaging 7% YoY in AZ and NV.',
    brokerContext: 'SZL Holdings asset management team monitoring individual assets via static spreadsheet. No cross-asset distress correlation model. Lender concentration risk with Valley Financial (4 loans, $187M exposure) was known but unquantified.',
  },
  constraints: [
    '4 loan maturities falling due within 6 months — Valley Financial cross-collateral clause creates portfolio-wide default exposure',
    'Occupancy recovery timeline uncertain — new supply deliveries not absorbed until Q4 2026 at earliest',
    'Climate insurance premium increases not reflected in existing underwriting models',
    'Owner entity structure (LLC per asset) masks cross-entity distress signal in standard monitoring tools',
    'NOAA temperature drift of +1.1°C over 5 years driving HVAC capex and FEMA NRI risk score to 54',
  ],
  system: {
    headline: 'TERRA Distress Propagation Model identified the cascade trigger 90 days ahead. Climate-Adjusted Cap Rate and Owner Intent heads provided exit and recapitalisation timing.',
    steps: [
      { label: 'Distress Propagation Model', description: 'TERRA ingested DSCR, loan maturity schedule, lender concentration score (0.71), and cross-collateral loan count (4). Cascade probability surfaced at 67% on 90-day horizon — above the 55% alert threshold. Prism Bus signal emitted: severity=critical.' },
      { label: 'Climate Cap-Rate Adjustment', description: 'NOAA climate adapter pulled 5-year temperature and precipitation drift for Phoenix and Las Vegas stations. FEMA NRI score of 54 applied. Climate-adjusted cap rate: 6.41% vs. 5.80% unadjusted — a 61bps adverse delta that rewrites the portfolio\'s levered IRR from 14.2% to 9.8%.' },
      { label: 'Owner Intent Classification', description: 'Owner intent model flagged 74% 12-month sale/refi probability based on 2 NOD filings, 0 deed transfers in 36 months, and submarket vacancy at 14%. Intent signal indicates sale or distressed recapitalisation within 12 months with high confidence.' },
      { label: 'Watchlist + A11oy Tool Registration', description: 'All 7 at-risk assets added to TERRA watchlist via terraWatchlistEdit tool (A11oy-originated). Prism Bus domain_signal emitted. A11oy NEXUS command registered terraDistressScan and terraScenarioRerun as active tools for the SZL Holdings tenant.' },
      { label: 'Conduit Export', description: 'Full portfolio distress dataset exported via Conduit (scenario: sunbelt-multifamily-2026) for lender presentation and restructuring counsel. Dataset includes all 3 forecast head outputs with Monte Carlo intervals at 80% confidence.' },
      { label: 'Lender Scenario Re-run', description: 'Valley Financial requested scenario re-run with modified loan maturity assumptions (+9 months extension). terraScenarioRerun executed — cascade risk drops from 67% to 41% under extended maturity scenario. Extension proposal advanced to credit committee.' },
    ],
  },
  howItWorked: 'TERRA\'s three-head forecast fabric — distress propagation, climate cap rate, and owner intent — ran end-to-end on the Sunbelt portfolio in under 800ms. The cascade signal was the portfolio-level story that no single-asset model could tell. Climate cap-rate adjustment exposed the IRR delta that drove lender recalculation. Owner intent timing gave counsel a clear negotiating window. The scenario re-run with modified loan maturity inputs gave Valley Financial the data to take an extension to credit committee — avoiding a cross-default event with $312M in exposure.',
  outcome: {
    keyMetric: 'Cascade risk reduced from 67% to 41% under extended maturity scenario. Portfolio-wide cross-default event avoided. IRR impact quantified: −4.4pp (14.2% → 9.8%) due to climate cap-rate adjustment — first time this had been calculated for this portfolio.',
    stats: [
      { label: 'Cascade Risk (base)', value: '67%' },
      { label: 'Cascade Risk (extended maturity)', value: '41%' },
      { label: 'Climate Cap-Rate Delta', value: '+61bps' },
    ],
  },
  visualProof: [
    { label: 'Assets flagged', value: '7 / 12', color: '#f87171' },
    { label: 'DSCR < 1.0', value: '4 assets', color: '#f87171' },
    { label: 'Cascade prob (90d)', value: '67%', color: '#fb923c' },
    { label: 'Climate cap-rate delta', value: '+61bps', color: '#fbbf24' },
    { label: 'Owner intent signal', value: '74%', color: TERRA_ACCENT },
    { label: 'Exposure quantified', value: '$312M', color: '#4ade80' },
    { label: 'Cascade risk (ext. maturity)', value: '41%', color: '#4ade80' },
    { label: 'Cross-default avoided', value: 'Yes', color: '#4ade80' },
  ],
  whyItMatters: "Single-asset monitoring fails at scale. The Sunbelt distress wasn't in any one property — it was in the lender concentration, the cross-collateral clause, and the climate-driven cap rate compression acting together across 7 assets. TERRA's cascade model read the portfolio as a system. The distress propagation head, climate cap-rate adjustment, and owner intent classification gave SZL Holdings — and their lender — a shared quantitative basis for restructuring. Without it, the first default would have triggered a cross-default across the full Valley Financial facility.",
  forecastHeads: [
    { name: 'Distress Propagation', value: '67%', status: 'critical', unit: 'cascade probability (90d)' },
    { name: 'Climate Cap Rate', value: '6.41%', status: 'high', unit: 'adjusted 5yr cap rate' },
    { name: 'Owner Intent', value: '74%', status: 'critical', unit: 'sale/refi probability (12mo)' },
  ],
};

const CASE_STUDIES: CaseStudy[] = [CASE_STUDY_SUNBELT, CASE_STUDY_55_WATER];

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.07 } }),
};

function SectionCard({ i, section, icon: Icon, children }: { i: number; section: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
        <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: `${TERRA_ACCENT}15`, border: `1px solid ${TERRA_ACCENT}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={12} style={{ color: TERRA_ACCENT }} />
        </div>
        <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: TERRA_ACCENT }}>
          {section}
        </p>
      </div>
      {children}
    </motion.div>
  );
}

function CaseStudyView({ cs }: { cs: CaseStudy }) {
  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.1em', textTransform: 'uppercase', color: TERRA_ACCENT, padding: '2px 8px', borderRadius: '4px', background: `${TERRA_ACCENT}15`, border: `1px solid ${TERRA_ACCENT}25` }}>
            Case Study · {cs.category}
          </span>
          <span style={{ fontSize: '10px', color: 'hsl(210,5%,40%)' }}>{cs.submarket}</span>
          {cs.status === 'active' && (
            <span style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4ade80', padding: '2px 7px', borderRadius: '4px', background: '#4ade8015', border: '1px solid #4ade8030' }}>
              Active
            </span>
          )}
          {cs.scenario && (
            <span style={{ fontSize: '9px', fontFamily: 'monospace', color: 'hsl(210,5%,36%)', padding: '2px 6px', borderRadius: '4px', background: 'hsla(0,0%,100%,0.04)', border: '1px solid hsla(0,0%,100%,0.06)' }}>
              {cs.scenario}
            </span>
          )}
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'hsl(38,12%,92%)', letterSpacing: '-0.018em', lineHeight: '1.2', marginBottom: '0.25rem' }}>
          {cs.title}
        </h2>
        <p style={{ fontSize: '13px', color: 'hsl(210,5%,50%)', marginBottom: '1rem', fontStyle: 'italic' }}>{cs.subtitle}</p>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {cs.headerStats.map((stat) => (
            <div key={stat.label}>
              <p style={{ fontSize: '9.5px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'hsl(210,5%,38%)', marginBottom: '0.2rem' }}>
                {stat.label}
              </p>
              <p style={{ fontSize: '1.125rem', fontWeight: '700', color: TERRA_ACCENT, fontFamily: "'JetBrains Mono', monospace" }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {cs.forecastHeads && (
        <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp} style={{ marginBottom: '1.25rem', padding: '1.375rem', borderRadius: '0.75rem', background: 'hsla(0,0%,100%,0.025)', border: '1px solid hsla(0,0%,100%,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: `${TERRA_ACCENT}15`, border: `1px solid ${TERRA_ACCENT}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Activity size={12} style={{ color: TERRA_ACCENT }} />
            </div>
            <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', color: TERRA_ACCENT }}>ML Forecast Heads</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {cs.forecastHeads.map((head) => (
              <div key={head.name} style={{ padding: '0.875rem', borderRadius: '0.5rem', background: head.status === 'critical' ? 'hsla(0,70%,50%,0.06)' : head.status === 'high' ? 'hsla(30,90%,50%,0.06)' : 'hsla(140,60%,50%,0.06)', border: `1px solid ${head.status === 'critical' ? 'hsla(0,70%,50%,0.2)' : head.status === 'high' ? 'hsla(30,90%,50%,0.2)' : 'hsla(140,60%,50%,0.2)'}` }}>
                <p style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', color: 'hsl(210,5%,40%)', marginBottom: '0.375rem' }}>{head.name}</p>
                <p style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: "'JetBrains Mono', monospace", color: head.status === 'critical' ? '#f87171' : head.status === 'high' ? '#fb923c' : '#4ade80', marginBottom: '0.2rem' }}>{head.value}</p>
                <p style={{ fontSize: '9px', color: 'hsl(210,5%,42%)' }}>{head.unit}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <SectionCard i={1} section="Problem" icon={AlertTriangle}>
        <p style={{ fontSize: '14px', fontWeight: '600', color: 'hsl(38,12%,85%)', marginBottom: '0.5rem' }}>{cs.problem.headline}</p>
        <p style={{ fontSize: '12.5px', lineHeight: '1.65', color: 'hsl(210,5%,54%)' }}>{cs.problem.body}</p>
      </SectionCard>

      <SectionCard i={2} section="Context" icon={Building2}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[{ label: 'Property', value: cs.context.property }, { label: 'Market', value: cs.context.market }, { label: 'Portfolio / Brokerage Context', value: cs.context.brokerContext }].map((item) => (
            <div key={item.label}>
              <p style={{ fontSize: '10px', fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', color: 'hsl(210,5%,36%)', marginBottom: '0.25rem' }}>{item.label}</p>
              <p style={{ fontSize: '12.5px', lineHeight: '1.6', color: 'hsl(210,5%,54%)' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard i={3} section="Constraints" icon={Clock}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {cs.constraints.map((c, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'hsla(0,0%,100%,0.07)', border: '1px solid hsla(0,0%,100%,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                <span style={{ fontSize: '8px', color: 'hsl(210,5%,50%)', fontWeight: '700' }}>{idx + 1}</span>
              </div>
              <p style={{ fontSize: '12.5px', lineHeight: '1.55', color: 'hsl(210,5%,54%)' }}>{c}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard i={4} section="System Built" icon={Zap}>
        <p style={{ fontSize: '12.5px', color: 'hsl(38,12%,78%)', marginBottom: '1rem', lineHeight: '1.6' }}>{cs.system.headline}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {cs.system.steps.map((step, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '0.875rem' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0, background: `${TERRA_ACCENT}18`, border: `1px solid ${TERRA_ACCENT}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '9px', fontWeight: '700', color: TERRA_ACCENT }}>{idx + 1}</span>
              </div>
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: 'hsl(38,12%,82%)', marginBottom: '0.2rem' }}>{step.label}</p>
                <p style={{ fontSize: '12px', lineHeight: '1.55', color: 'hsl(210,5%,52%)' }}>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard i={5} section="How It Worked" icon={ArrowRight}>
        <p style={{ fontSize: '12.5px', lineHeight: '1.7', color: 'hsl(210,5%,54%)' }}>{cs.howItWorked}</p>
      </SectionCard>

      <SectionCard i={6} section="Outcome" icon={CheckCircle}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
          {cs.outcome.stats.map((stat) => (
            <div key={stat.label} style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'hsla(0,0%,100%,0.03)', border: '1px solid hsla(0,0%,100%,0.06)' }}>
              <p style={{ fontSize: '9px', fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', color: 'hsl(210,5%,36%)', marginBottom: '0.25rem' }}>{stat.label}</p>
              <p style={{ fontSize: '1.125rem', fontWeight: '700', color: TERRA_ACCENT, fontFamily: "'JetBrains Mono', monospace" }}>{stat.value}</p>
            </div>
          ))}
        </div>
        <div style={{ padding: '0.875rem', borderRadius: '0.5rem', background: `${TERRA_ACCENT}10`, border: `1px solid ${TERRA_ACCENT}25` }}>
          <p style={{ fontSize: '12px', lineHeight: '1.6', color: 'hsl(38,12%,75%)' }}>{cs.outcome.keyMetric}</p>
        </div>
      </SectionCard>

      <SectionCard i={7} section="Visual Proof" icon={BarChart3}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {cs.visualProof.map((item) => (
            <div key={item.label} style={{ padding: '0.875rem 1.125rem', borderRadius: '0.625rem', background: 'hsla(0,0%,100%,0.03)', border: '1px solid hsla(0,0%,100%,0.07)', minWidth: '120px' }}>
              <p style={{ fontSize: '9.5px', fontWeight: '600', letterSpacing: '0.07em', textTransform: 'uppercase', color: 'hsl(210,5%,36%)', marginBottom: '0.375rem' }}>{item.label}</p>
              <p style={{ fontSize: '1.125rem', fontWeight: '700', color: item.color, fontFamily: "'JetBrains Mono', monospace" }}>{item.value}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard i={8} section="Why It Matters" icon={DollarSign}>
        <p style={{ fontSize: '13px', lineHeight: '1.7', color: 'hsl(38,12%,76%)', fontWeight: '500' }}>{cs.whyItMatters}</p>
      </SectionCard>
    </div>
  );
}

export default function CaseStudyPage() {
  const [active, setActive] = useState<string>(CASE_STUDIES[0].id);
  const cs = CASE_STUDIES.find((c) => c.id === active) ?? CASE_STUDIES[0];

  return (
    <div style={{ padding: '1.5rem 1.5rem 4rem', maxWidth: '820px', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <TrendingUp size={14} style={{ color: TERRA_ACCENT }} />
          <p style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', textTransform: 'uppercase', color: TERRA_ACCENT }}>
            Case Studies
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {CASE_STUDIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.id)}
              style={{
                padding: '0.375rem 0.875rem',
                borderRadius: '0.5rem',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: active === c.id ? `${TERRA_ACCENT}20` : 'hsla(0,0%,100%,0.04)',
                border: `1px solid ${active === c.id ? TERRA_ACCENT : 'hsla(0,0%,100%,0.08)'}`,
                color: active === c.id ? TERRA_ACCENT : 'hsl(210,5%,55%)',
              }}
            >
              {c.id} — {c.title}
            </button>
          ))}
        </div>
      </div>
      <CaseStudyView key={cs.id} cs={cs} />
    </div>
  );
}
