import { color } from '@szl-holdings/design-system';
import { cn } from '@szl-holdings/shared-ui/utils';
import { AnimatePresence, motion as m } from 'framer-motion';
import {
  AlertTriangle,
  Camera,
  ChevronRight,
  RefreshCw,
  Star,
  TrendingUp,
  Upload,
  Wrench,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type ConditionGrade = 'A' | 'B' | 'C' | 'D' | 'F';
type HazardSeverity = 'critical' | 'moderate' | 'minor' | 'none';

interface PropertyAnalysis {
  id: string;
  address: string;
  photos: number;
  analyzed: boolean;
  overallCondition: ConditionGrade;
  conditionScore: number;
  renovationEstimate: number;
  neighborhoodQuality: number;
  systems: SystemScore[];
  hazards: HazardItem[];
  compAdjustments: CompAdjustment[];
}

interface SystemScore {
  name: string;
  grade: ConditionGrade;
  score: number;
  detail: string;
  estRepair: number;
}

interface HazardItem {
  type: string;
  severity: HazardSeverity;
  description: string;
  urgency: string;
  estimatedCost: number;
}

interface CompAdjustment {
  factor: string;
  adjustment: number;
  rationale: string;
}

const GRADE_COLORS: Record<ConditionGrade, string> = {
  A: '#34d399',
  B: '#60a5fa',
  C: '#fbbf24',
  D: '#f97316',
  F: '#ef4444',
};

const SEVERITY_COLORS: Record<HazardSeverity, string> = {
  critical: color.accent.red,
  moderate: color.accent.amber,
  minor: color.accent.amber,
  none: color.accent.green,
};

const ANALYSES: PropertyAnalysis[] = [
  {
    id: 'cv-1',
    address: '420 Lexington Ave, New York, NY 10170',
    photos: 24,
    analyzed: true,
    overallCondition: 'B',
    conditionScore: 78,
    renovationEstimate: 285000,
    neighborhoodQuality: 88,
    systems: [
      {
        name: 'Roof',
        grade: 'C',
        score: 62,
        detail:
          'Asphalt shingle showing granule loss, 15+ years old. Flashing around penetrations needs resealing.',
        estRepair: 42000,
      },
      {
        name: 'Foundation',
        grade: 'B',
        score: 81,
        detail:
          'Minor hairline cracks in basement walls. No structural concern. Waterproofing coating recommended.',
        estRepair: 8500,
      },
      {
        name: 'HVAC',
        grade: 'B',
        score: 76,
        detail:
          'Central air unit is 8 years old. Ductwork in good condition. Filter replacement needed.',
        estRepair: 3200,
      },
      {
        name: 'Electrical',
        grade: 'A',
        score: 92,
        detail:
          '200-amp panel with modern breakers. All visible wiring is up to code. GFCI present in wet areas.',
        estRepair: 0,
      },
      {
        name: 'Plumbing',
        grade: 'C',
        score: 65,
        detail:
          'Some galvanized supply lines remain. Water pressure adequate. Recommend gradual re-pipe to copper.',
        estRepair: 15000,
      },
      {
        name: 'Exterior',
        grade: 'B',
        score: 79,
        detail:
          'Brick exterior in good condition. Some mortar joints need repointing. Windows are double-pane.',
        estRepair: 12000,
      },
    ],
    hazards: [
      {
        type: 'Deferred Maintenance',
        severity: 'moderate',
        description:
          'Roof requires replacement within 2-3 years. Granule loss exceeds 40% on south-facing slopes.',
        urgency: '12-18 months',
        estimatedCost: 42000,
      },
      {
        type: 'Plumbing Risk',
        severity: 'minor',
        description:
          'Remaining galvanized pipes may corrode and restrict water flow. No active leaks detected.',
        urgency: '2-3 years',
        estimatedCost: 15000,
      },
      {
        type: 'Lead Paint',
        severity: 'critical',
        description:
          'Pre-1978 construction. Deteriorating paint detected on exterior trim and window sills. EPA RRP compliance required.',
        urgency: 'Immediate',
        estimatedCost: 18000,
      },
    ],
    compAdjustments: [
      {
        factor: 'Roof Condition',
        adjustment: -15000,
        rationale:
          'Below-average roof age vs. comparable sales. Adjusted for remaining useful life of 2-3 years.',
      },
      {
        factor: 'Kitchen Quality',
        adjustment: 22000,
        rationale:
          'Renovated kitchen with quartz counters, soft-close cabinets, and commercial-grade appliances.',
      },
      {
        factor: 'Neighborhood Quality',
        adjustment: 8000,
        rationale: '88th percentile walkability score. Proximity to transit and retail amenities.',
      },
      {
        factor: 'Deferred Maintenance',
        adjustment: -35000,
        rationale: 'Combined plumbing and lead paint remediation costs require discount.',
      },
    ],
  },
  {
    id: 'cv-2',
    address: '1100 Wilshire Blvd, Los Angeles, CA 90017',
    photos: 18,
    analyzed: true,
    overallCondition: 'A',
    conditionScore: 91,
    renovationEstimate: 45000,
    neighborhoodQuality: 82,
    systems: [
      {
        name: 'Roof',
        grade: 'A',
        score: 95,
        detail: 'TPO membrane installed 2021. No ponding or seam issues.',
        estRepair: 0,
      },
      {
        name: 'Foundation',
        grade: 'A',
        score: 94,
        detail: 'Reinforced concrete slab. No visible cracks or settlement.',
        estRepair: 0,
      },
      {
        name: 'HVAC',
        grade: 'A',
        score: 88,
        detail: 'VRF system installed 2020. Smart thermostats throughout.',
        estRepair: 0,
      },
      {
        name: 'Electrical',
        grade: 'A',
        score: 90,
        detail: '400-amp service. EV charging infrastructure pre-wired.',
        estRepair: 0,
      },
      {
        name: 'Plumbing',
        grade: 'B',
        score: 82,
        detail: 'PEX supply lines. Cast iron drains showing minor corrosion.',
        estRepair: 8000,
      },
      {
        name: 'Exterior',
        grade: 'A',
        score: 93,
        detail: 'Curtain wall glazing in excellent condition. Caulking intact.',
        estRepair: 0,
      },
    ],
    hazards: [
      {
        type: 'Seismic Retrofit',
        severity: 'minor',
        description: 'Soft-story screening recommended for lower levels.',
        urgency: '12 months',
        estimatedCost: 35000,
      },
    ],
    compAdjustments: [
      {
        factor: 'Recent Renovation',
        adjustment: 120000,
        rationale: 'Complete interior renovation in 2021. Premium finishes throughout.',
      },
      {
        factor: 'Energy Efficiency',
        adjustment: 45000,
        rationale: 'LEED Gold certification. Below-average utility costs provide tenant value.',
      },
    ],
  },
  {
    id: 'cv-3',
    address: '550 Summer St, Boston, MA 02210',
    photos: 31,
    analyzed: true,
    overallCondition: 'C',
    conditionScore: 58,
    renovationEstimate: 520000,
    neighborhoodQuality: 75,
    systems: [
      {
        name: 'Roof',
        grade: 'D',
        score: 42,
        detail: 'Built-up roof with multiple patch repairs. Active leak in NE corner.',
        estRepair: 85000,
      },
      {
        name: 'Foundation',
        grade: 'C',
        score: 64,
        detail: 'Stone foundation with mortar deterioration. Efflorescence present.',
        estRepair: 45000,
      },
      {
        name: 'HVAC',
        grade: 'D',
        score: 48,
        detail: 'Boiler system 20+ years old. Inefficient. Asbestos insulation on pipes.',
        estRepair: 120000,
      },
      {
        name: 'Electrical',
        grade: 'C',
        score: 60,
        detail: '100-amp service. Outdated panel. Some knob-and-tube wiring in attic.',
        estRepair: 35000,
      },
      {
        name: 'Plumbing',
        grade: 'C',
        score: 55,
        detail: 'Cast iron waste lines showing advanced corrosion. Lead service line suspected.',
        estRepair: 65000,
      },
      {
        name: 'Exterior',
        grade: 'C',
        score: 68,
        detail: 'Brownstone facade. Spalling and water infiltration at parapet. Pointing needed.',
        estRepair: 55000,
      },
    ],
    hazards: [
      {
        type: 'Active Water Intrusion',
        severity: 'critical',
        description:
          'Roof leak causing damage to 3rd floor ceiling and walls. Mold testing recommended.',
        urgency: 'Immediate',
        estimatedCost: 95000,
      },
      {
        type: 'Asbestos',
        severity: 'critical',
        description:
          'Pipe insulation contains friable asbestos. Full abatement required before HVAC replacement.',
        urgency: 'Before renovation',
        estimatedCost: 28000,
      },
      {
        type: 'Electrical Hazard',
        severity: 'moderate',
        description: 'Knob-and-tube wiring is a fire risk and uninsurable. Must be replaced.',
        urgency: '3-6 months',
        estimatedCost: 35000,
      },
      {
        type: 'Lead Service Line',
        severity: 'moderate',
        description:
          'Suspected lead water supply line from street. Testing and replacement required by 2027 mandate.',
        urgency: '6-12 months',
        estimatedCost: 12000,
      },
    ],
    compAdjustments: [
      {
        factor: 'Deferred Maintenance',
        adjustment: -180000,
        rationale: 'Substantial capital expenditure required across all major systems.',
      },
      {
        factor: 'Historic District',
        adjustment: 35000,
        rationale:
          'Historic designation provides tax credits but increases renovation costs by ~15%.',
      },
      {
        factor: 'Location Premium',
        adjustment: 60000,
        rationale: 'Seaport District proximity. Walk score 94. Strong rental demand.',
      },
    ],
  },
];

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000
      ? `$${(n / 1000).toFixed(0)}K`
      : `$${n}`;

function GradeCircle({ grade, size = 40 }: { grade: ConditionGrade; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-full font-bold"
      style={{
        width: size,
        height: size,
        background: `${GRADE_COLORS[grade]}20`,
        color: GRADE_COLORS[grade],
        fontSize: size * 0.45,
        border: `2px solid ${GRADE_COLORS[grade]}30`,
      }}
    >
      {grade}
    </div>
  );
}

function _ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : '#ef4444';
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-white/40 w-20 truncate">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06]">
        <m.div
          className="h-1.5 rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs font-semibold w-8 text-right" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

export default function ComputerVisionPage() {
  const [selected, setSelected] = useState<string | null>(ANALYSES[0].id);
  const [uploading, setUploading] = useState(false);
  const analysis = ANALYSES.find((a) => a.id === selected);

  const portfolioAvg = useMemo(() => {
    const scores = ANALYSES.map((a) => a.conditionScore);
    return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
  }, []);

  const totalRenovation = useMemo(() => ANALYSES.reduce((s, a) => s + a.renovationEstimate, 0), []);

  return (
    <div className="min-h-screen" style={{ background: '#0a0c10' }}>
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">
            Computer Vision
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Property Analysis & Condition Scoring
          </h1>
          <p className="mt-1 text-sm text-white/40">
            Evidence-backed property photo analysis — condition grading, renovation estimates,
            hazard identification, and comparable quality adjustments.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[
            {
              label: 'Properties Analyzed',
              value: String(ANALYSES.length),
              icon: Camera,
              color: '#2d6a4f',
            },
            {
              label: 'Portfolio Avg Score',
              value: `${portfolioAvg}/100`,
              icon: Star,
              color: portfolioAvg >= 75 ? '#34d399' : '#fbbf24',
            },
            {
              label: 'Total Renovation Est.',
              value: fmt(totalRenovation),
              icon: Wrench,
              color: '#f97316',
            },
            {
              label: 'Critical Hazards',
              value: String(
                ANALYSES.reduce(
                  (s, a) => s + a.hazards.filter((h) => h.severity === 'critical').length,
                  0,
                ),
              ),
              icon: AlertTriangle,
              color: '#ef4444',
            },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-black/20"
                    style={{ color: m.color }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
                    {m.label}
                  </span>
                </div>
                <div className="text-2xl font-semibold text-white">{m.value}</div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Properties</h3>
              <button
                onClick={() => {
                  setUploading(true);
                  setTimeout(() => setUploading(false), 2000);
                }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition"
                style={{ background: '#2d6a4f20', color: '#2d6a4f', border: '1px solid #2d6a4f30' }}
              >
                {uploading ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3" />
                )}
                Upload Photos
              </button>
            </div>

            {ANALYSES.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelected(a.id)}
                className={cn(
                  'w-full text-left rounded-xl border p-4 transition',
                  selected === a.id
                    ? 'border-[#2d6a4f]/40 bg-[#2d6a4f]/10'
                    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]',
                )}
              >
                <div className="flex items-center gap-3">
                  <GradeCircle grade={a.overallCondition} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{a.address}</div>
                    <div className="text-[10px] text-white/40">
                      {a.photos} photos · Score: {a.conditionScore}/100
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/20" />
                </div>
                <div className="mt-2 flex items-center gap-3 text-[10px]">
                  <span className="text-white/30">
                    Renovation:{' '}
                    <span className="text-white/60 font-medium">{fmt(a.renovationEstimate)}</span>
                  </span>
                  <span className="text-white/30">
                    Hazards:{' '}
                    <span
                      style={{
                        color: a.hazards.some((h) => h.severity === 'critical')
                          ? '#ef4444'
                          : '#34d399',
                      }}
                      className="font-medium"
                    >
                      {a.hazards.length}
                    </span>
                  </span>
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {analysis && (
                <m.div
                  key={analysis.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 mb-4">
                    <div className="flex items-center gap-4 mb-6">
                      <GradeCircle grade={analysis.overallCondition} size={56} />
                      <div>
                        <h3 className="text-lg font-semibold text-white">{analysis.address}</h3>
                        <div className="flex items-center gap-3 text-xs text-white/40 mt-1">
                          <span>
                            Condition Score:{' '}
                            <span className="font-semibold text-white">
                              {analysis.conditionScore}/100
                            </span>
                          </span>
                          <span>·</span>
                          <span>
                            Neighborhood:{' '}
                            <span className="font-semibold text-white">
                              {analysis.neighborhoodQuality}/100
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <h4 className="text-xs font-semibold uppercase tracking-wider text-white/35 mb-3">
                      System Condition Breakdown
                    </h4>
                    <div className="space-y-2.5">
                      {analysis.systems.map((s) => (
                        <div
                          key={s.name}
                          className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-3"
                        >
                          <div className="flex items-center gap-3 mb-1.5">
                            <GradeCircle grade={s.grade} size={24} />
                            <span className="text-sm font-medium text-white flex-1">{s.name}</span>
                            {s.estRepair > 0 && (
                              <span className="text-xs font-medium" style={{ color: '#f97316' }}>
                                {fmt(s.estRepair)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/40 ml-9">{s.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {analysis.hazards.length > 0 && (
                    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 mb-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-white/35 mb-3">
                        Hazard Identification
                      </h4>
                      <div className="space-y-2.5">
                        {analysis.hazards.map((h, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] p-3"
                          >
                            <div
                              className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full"
                              style={{ background: `${SEVERITY_COLORS[h.severity]}20` }}
                            >
                              <AlertTriangle
                                className="h-3 w-3"
                                style={{ color: SEVERITY_COLORS[h.severity] }}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white">{h.type}</span>
                                <span
                                  className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full"
                                  style={{
                                    background: `${SEVERITY_COLORS[h.severity]}15`,
                                    color: SEVERITY_COLORS[h.severity],
                                  }}
                                >
                                  {h.severity}
                                </span>
                              </div>
                              <p className="text-xs text-white/40 mt-1">{h.description}</p>
                              <div className="flex items-center gap-4 mt-1.5 text-[10px] text-white/30">
                                <span>
                                  Urgency: <span className="text-white/50">{h.urgency}</span>
                                </span>
                                <span>
                                  Cost:{' '}
                                  <span style={{ color: '#f97316' }}>{fmt(h.estimatedCost)}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-white/35 mb-3">
                      Comparable Quality Adjustments
                    </h4>
                    <div className="space-y-2">
                      {analysis.compAdjustments.map((c, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.015] p-3"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20">
                            {c.adjustment >= 0 ? (
                              <TrendingUp className="h-3.5 w-3.5" style={{ color: '#34d399' }} />
                            ) : (
                              <AlertTriangle className="h-3.5 w-3.5" style={{ color: '#ef4444' }} />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">{c.factor}</div>
                            <p className="text-[10px] text-white/35">{c.rationale}</p>
                          </div>
                          <span
                            className="text-sm font-semibold"
                            style={{ color: c.adjustment >= 0 ? '#34d399' : '#ef4444' }}
                          >
                            {c.adjustment >= 0 ? '+' : ''}
                            {fmt(Math.abs(c.adjustment))}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-white/[0.06]">
                        <span className="text-xs font-semibold text-white/50">Net Adjustment</span>
                        <span
                          className="text-sm font-bold"
                          style={{
                            color:
                              analysis.compAdjustments.reduce((s, c) => s + c.adjustment, 0) >= 0
                                ? '#34d399'
                                : '#ef4444',
                          }}
                        >
                          {analysis.compAdjustments.reduce((s, c) => s + c.adjustment, 0) >= 0
                            ? '+'
                            : ''}
                          {fmt(
                            Math.abs(
                              analysis.compAdjustments.reduce((s, c) => s + c.adjustment, 0),
                            ),
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
