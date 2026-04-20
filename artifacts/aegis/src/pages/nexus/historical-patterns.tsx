import {
  Activity,
  AlertTriangle,
  BarChart3,
  ChevronRight,
  Clock,
  Eye,
  Globe,
  Layers,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const ACCENT = '#f59e0b';
const RED = '#ef4444';
const GREEN = '#22c55e';
const BLUE = '#3b82f6';
const PURPLE = '#8b5cf6';

const DS = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.06)',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    muted: 'rgba(255,255,255,0.25)',
  },
};

interface HistoricalEvent {
  id: string;
  title: string;
  date: string;
  category: 'conflict' | 'economic' | 'cyber' | 'pandemic' | 'regulatory' | 'climate';
  cascadeImpacts: { domain: string; impact: string; magnitude: string; duration: string }[];
  analogyScore: number;
  currentRelevance: string;
  lessonsLearned: string[];
  financialImpact: string;
}

const EVENTS: HistoricalEvent[] = [
  {
    id: 'HE-001',
    title: 'Suez Canal Blockage (Ever Given)',
    date: 'March 2021',
    category: 'conflict',
    cascadeImpacts: [
      {
        domain: 'Maritime',
        impact:
          '6-day blockage of 12% of global trade. 400+ vessels queued. $9.6B daily trade disruption.',
        magnitude: 'Severe',
        duration: '6 days direct, 3 months cascade',
      },
      {
        domain: 'Financial',
        impact: 'Container shipping rates surged 300%. Insurance claims estimated $1.5B globally.',
        magnitude: 'Major',
        duration: '6 months',
      },
      {
        domain: 'Real Estate',
        impact:
          'Warehouse demand spiked in alternative ports. Rotterdam vacancy dropped 2.1 points.',
        magnitude: 'Moderate',
        duration: '12 months',
      },
      {
        domain: 'Legal',
        impact: 'Force majeure claims across 2,000+ contracts. Salvage disputes lasted 15 months.',
        magnitude: 'Major',
        duration: '15 months',
      },
    ],
    analogyScore: 87,
    currentRelevance:
      'Red Sea disruption follows same trade chokepoint pattern but with sustained military threat vs. one-time accident. Expects longer duration and deeper cascade effects. Insurance market response already more severe than Ever Given baseline.',
    lessonsLearned: [
      'Alternative routing adds 10-14 days and $1-2M per vessel',
      'Insurance repricing happens within 48 hours of major chokepoint event',
      'Port congestion at alternatives peaks 2-3 weeks after initial disruption',
      'Legal force majeure windows are narrow — early notification critical',
    ],
    financialImpact: '$60B estimated global trade disruption',
  },
  {
    id: 'HE-002',
    title: 'NotPetya Cyberattack / Maersk Disruption',
    date: 'June 2017',
    category: 'cyber',
    cascadeImpacts: [
      {
        domain: 'Cyber',
        impact:
          'Wiper malware disguised as ransomware. 49,000 laptops, 3,500 servers destroyed at Maersk alone.',
        magnitude: 'Catastrophic',
        duration: '2 weeks to restore',
      },
      {
        domain: 'Maritime',
        impact:
          'Maersk shut down 76 port terminals worldwide. Shipping operations reverted to paper-based.',
        magnitude: 'Severe',
        duration: '10 days',
      },
      {
        domain: 'Financial',
        impact:
          'Maersk losses: $300M. Total global damages: $10B+. Cyber insurance market fundamentally repriced.',
        magnitude: 'Catastrophic',
        duration: 'Permanent market change',
      },
      {
        domain: 'Legal',
        impact:
          'Merck v. Zurich insurance dispute (war exclusion clause) reached NJ Supreme Court.',
        magnitude: 'Major',
        duration: '5+ years litigation',
      },
    ],
    analogyScore: 72,
    currentRelevance:
      'Dark web intelligence suggests RaaS groups developing maritime-specific capabilities. NotPetya scale attack on interconnected port infrastructure would be 10x more damaging due to increased digitization. War exclusion clause disputes from NotPetya still shaping cyber insurance policy language.',
    lessonsLearned: [
      'Supply chain attacks propagate faster than direct attacks',
      'Paper-based fallback procedures must be maintained and tested',
      'Cyber insurance war exclusion clauses are legally contested',
      'Recovery requires complete infrastructure rebuild, not just patching',
    ],
    financialImpact: '$10B+ estimated global damages',
  },
  {
    id: 'HE-003',
    title: '1996 Taiwan Strait Crisis',
    date: 'March 1996',
    category: 'conflict',
    cascadeImpacts: [
      {
        domain: 'Maritime',
        impact: 'PLA missile tests in shipping lanes. International shipping rerouted for 10 days.',
        magnitude: 'Major',
        duration: '10 days direct',
      },
      {
        domain: 'Financial',
        impact: 'Taiwan stock market dropped 5% in 3 days. Capital flight estimated $15B.',
        magnitude: 'Major',
        duration: '3 months',
      },
      {
        domain: 'Legal',
        impact: 'Sanctions assessment and compliance reviews across Taiwan-China trade agreements.',
        magnitude: 'Moderate',
        duration: '6 months',
      },
    ],
    analogyScore: 58,
    currentRelevance:
      "Current tensions significantly more elevated than 1996 baseline. Semiconductor dependency (TSMC) creates cascading impact that didn't exist in 1996. Any Taiwan contingency now has global supply chain implications that dwarf the 1996 crisis.",
    lessonsLearned: [
      'Markets underestimate geopolitical risk until kinetic events occur',
      'US carrier group deployment is escalation catalyst as well as deterrent',
      'Capital flight begins before crisis peaks — early positioning critical',
      'Semiconductor supply chains add entirely new cascading dimension vs. 1996',
    ],
    financialImpact: '$15B capital flight, 5% equity market decline',
  },
  {
    id: 'HE-004',
    title: 'EU ETS Phase I Launch',
    date: 'January 2005',
    category: 'regulatory',
    cascadeImpacts: [
      {
        domain: 'Financial',
        impact:
          'Carbon credit prices swung from €0 to €30 and back. Over-allocation created market chaos.',
        magnitude: 'Major',
        duration: '3 years',
      },
      {
        domain: 'Legal',
        impact:
          'Compliance frameworks rebuilt across EU. 12,000+ installations required new permits.',
        magnitude: 'Major',
        duration: '2 years',
      },
      {
        domain: 'Infrastructure',
        impact: 'Coal-to-gas switching accelerated. Renewable energy investment surged 40%.',
        magnitude: 'Moderate',
        duration: 'Permanent',
      },
    ],
    analogyScore: 65,
    currentRelevance:
      'CBAM maritime expansion follows ETS trajectory but with more sophisticated initial design. Expects less price volatility but faster compliance burden. Early movers in carbon accounting gained 18-24 month competitive advantage.',
    lessonsLearned: [
      'Initial over-allocation killed price signal — CBAM design avoids this',
      'First movers in compliance gained competitive advantage',
      'Carbon pricing creates permanent market structure change',
      'Industry opposition delays but rarely prevents EU environmental regulation',
    ],
    financialImpact: '€50B+ market cap created in carbon trading',
  },
];

const catColor = (c: string) =>
  c === 'conflict'
    ? RED
    : c === 'economic'
      ? ACCENT
      : c === 'cyber'
        ? PURPLE
        : c === 'pandemic'
          ? '#06b6d4'
          : c === 'regulatory'
            ? BLUE
            : GREEN;

export default function HistoricalPatternsPage() {
  const [selectedId, setSelectedId] = useState(EVENTS[0].id);
  const [expandedImpact, setExpandedImpact] = useState<number | null>(0);

  const selected = useMemo(
    () => EVENTS.find((e) => e.id === selectedId) ?? EVENTS[0],
    [selectedId],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white tracking-tight">
          Historical Pattern Library
        </h1>
        <p className="text-[11px] mt-1" style={{ color: DS.text.muted }}>
          Database of past geopolitical events with cascading impacts — AI uses historical analogies
          to calibrate current predictions
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4 space-y-2">
          <h3
            className="text-[10px] uppercase tracking-wider font-semibold"
            style={{ color: DS.text.muted }}
          >
            Event Database
          </h3>
          {EVENTS.map((e) => (
            <button
              key={e.id}
              onClick={() => {
                setSelectedId(e.id);
                setExpandedImpact(0);
              }}
              aria-label={`Select event ${e.title}`}
              className="w-full text-left rounded-xl p-4 transition"
              style={{
                background: selectedId === e.id ? 'rgba(255,255,255,0.04)' : DS.surface,
                border: `1px solid ${selectedId === e.id ? 'rgba(255,255,255,0.12)' : DS.border}`,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[8px] uppercase font-bold rounded px-1.5 py-0.5"
                  style={{ background: catColor(e.category) + '15', color: catColor(e.category) }}
                >
                  {e.category}
                </span>
                <span className="text-[9px]" style={{ color: DS.text.muted }}>
                  {e.date}
                </span>
              </div>
              <p className="text-sm font-medium text-white">{e.title}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[9px]" style={{ color: DS.text.muted }}>
                  Analogy Score:{' '}
                  <span className="font-semibold" style={{ color: ACCENT }}>
                    {e.analogyScore}%
                  </span>
                </span>
                <span className="text-[9px]" style={{ color: DS.text.muted }}>
                  {e.cascadeImpacts.length} domains
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="col-span-8 space-y-4">
          <div
            className="rounded-xl p-5"
            style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4" style={{ color: ACCENT }} />
              <h2 className="text-lg font-semibold text-white">{selected.title}</h2>
              <span
                className="text-[9px] font-semibold rounded-full px-2.5 py-0.5"
                style={{ background: ACCENT + '15', color: ACCENT }}
              >
                Analogy: {selected.analogyScore}%
              </span>
            </div>

            <p className="text-[9px] mb-4" style={{ color: DS.text.muted }}>
              {selected.date} · Impact: {selected.financialImpact}
            </p>

            <h4
              className="text-[9px] uppercase tracking-wider font-semibold mb-2"
              style={{ color: DS.text.muted }}
            >
              Cascade Impacts
            </h4>
            <div className="space-y-2 mb-4">
              {selected.cascadeImpacts.map((c, i) => (
                <div
                  key={i}
                  className="rounded-lg overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.015)',
                    border: `1px solid ${DS.border}`,
                  }}
                >
                  <button
                    onClick={() => setExpandedImpact(expandedImpact === i ? null : i)}
                    aria-label={`Toggle ${c.domain} impact`}
                    className="w-full text-left p-3 flex items-center gap-3"
                  >
                    <span className="text-[10px] font-semibold text-white w-24">{c.domain}</span>
                    <span
                      className="text-[8px] uppercase font-bold rounded px-1.5 py-0.5"
                      style={{
                        background:
                          c.magnitude === 'Catastrophic'
                            ? RED + '15'
                            : c.magnitude === 'Severe'
                              ? ACCENT + '15'
                              : BLUE + '15',
                        color:
                          c.magnitude === 'Catastrophic'
                            ? RED
                            : c.magnitude === 'Severe'
                              ? ACCENT
                              : BLUE,
                      }}
                    >
                      {c.magnitude}
                    </span>
                    <span className="text-[9px] ml-auto" style={{ color: DS.text.muted }}>
                      {c.duration}
                    </span>
                    <ChevronRight
                      className={`h-3 w-3 transition-transform ${expandedImpact === i ? 'rotate-90' : ''}`}
                      style={{ color: DS.text.muted }}
                    />
                  </button>
                  {expandedImpact === i && (
                    <div className="px-3 pb-3 border-t" style={{ borderColor: DS.border }}>
                      <p
                        className="text-[10px] leading-relaxed pt-2"
                        style={{ color: DS.text.secondary }}
                      >
                        {c.impact}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div
              className="rounded-lg p-3 mb-4"
              style={{ background: ACCENT + '08', borderLeft: `2px solid ${ACCENT}` }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Eye className="h-3 w-3" style={{ color: ACCENT }} />
                <span
                  className="text-[9px] uppercase tracking-wider font-semibold"
                  style={{ color: ACCENT }}
                >
                  Current Relevance
                </span>
              </div>
              <p className="text-[10px] leading-relaxed" style={{ color: DS.text.secondary }}>
                {selected.currentRelevance}
              </p>
            </div>

            <h4
              className="text-[9px] uppercase tracking-wider font-semibold mb-2"
              style={{ color: DS.text.muted }}
            >
              Lessons Learned
            </h4>
            <div className="space-y-1.5">
              {selected.lessonsLearned.map((l, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle
                    className="h-2.5 w-2.5 mt-0.5 flex-shrink-0"
                    style={{ color: ACCENT }}
                  />
                  <span
                    className="text-[10px] leading-relaxed"
                    style={{ color: DS.text.secondary }}
                  >
                    {l}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
