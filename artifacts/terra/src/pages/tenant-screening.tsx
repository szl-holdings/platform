import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  Database,
  X,
} from 'lucide-react';
import { useState } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../lib/api';

const DS = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.05)',
  accent: { gold: '#b8943c', blue: '#3a7ad4', green: '#40856a', red: '#c0503a' },
  text: {
    primary: 'rgba(255,255,255,0.85)',
    secondary: 'rgba(255,255,255,0.5)',
    tertiary: 'rgba(255,255,255,0.3)',
    muted: 'rgba(255,255,255,0.18)',
  },
};

const fmt = (n: number) =>
  n >= 1e6
    ? `$${(n / 1e6).toFixed(1)}M`
    : n >= 1e3
      ? `$${(n / 1e3).toFixed(0)}K`
      : `$${n.toLocaleString()}`;

interface Applicant {
  id: string;
  name: string;
  type: 'individual' | 'entity';
  targetUnit: string;
  proposedRent: number;
  leaseTermMonths: number;
  submittedDate: string;
  status: 'pending' | 'approved' | 'conditional' | 'declined';
  overallScore: number;
  recommendation: 'approve' | 'conditional' | 'decline';

  creditScore: number;
  creditHistory: string;
  bankruptcies: number;
  judgments: number;

  annualIncome: number;
  incomeVerified: boolean;
  rentToIncomeRatio: number;
  employmentStatus: string;
  employerName: string;
  employmentYears: number;

  priorEvictions: number;
  priorLandlordRefs: number;
  priorLandlordScore: number;
  rentalHistory: string;

  backgroundClear: boolean;
  criminalFlags: string[];

  radarScores: { subject: string; score: number }[];
  flags: { type: 'warning' | 'info' | 'error'; text: string }[];
  notes: string;
}

const APPLICANTS: Applicant[] = [
  {
    id: 'app-001',
    name: 'Marcus & Priya Thornton',
    type: 'individual',
    targetUnit: 'Suite 1200, 1200 Gateway Blvd (Office)',
    proposedRent: 31250,
    leaseTermMonths: 60,
    submittedDate: '2026-04-01',
    status: 'approved',
    overallScore: 88,
    recommendation: 'approve',
    creditScore: 768,
    creditHistory: 'Excellent — 12yr history, zero delinquencies, 2 revolving accounts',
    bankruptcies: 0,
    judgments: 0,
    annualIncome: 4_800_000,
    incomeVerified: true,
    rentToIncomeRatio: 7.8,
    employmentStatus: 'Business Owner',
    employerName: 'Meridian Technologies Inc.',
    employmentYears: 9,
    priorEvictions: 0,
    priorLandlordRefs: 3,
    priorLandlordScore: 9.4,
    rentalHistory: '8 years at prior premises — no late payments, full security deposit returned',
    backgroundClear: true,
    criminalFlags: [],
    radarScores: [
      { subject: 'Credit', score: 92 },
      { subject: 'Income', score: 96 },
      { subject: 'Rental Hist.', score: 95 },
      { subject: 'Employment', score: 90 },
      { subject: 'Background', score: 100 },
    ],
    flags: [
      {
        type: 'info',
        text: 'Business entity guaranty requested — requires personal guaranty from S. Thornton as GP',
      },
    ],
    notes:
      'Premium applicant. Strong financials, long operating history. Recommend approve with standard lease terms. Entity guaranty docs to be collected before execution.',
  },
  {
    id: 'app-002',
    name: 'Coastal Health Partners LLC',
    type: 'entity',
    targetUnit: 'Suite 400 (Ground Floor Medical)',
    proposedRent: 24000,
    leaseTermMonths: 84,
    submittedDate: '2026-03-28',
    status: 'conditional',
    overallScore: 71,
    recommendation: 'conditional',
    creditScore: 680,
    creditHistory: 'Entity Paydex 74 — 2 late payments in 2024 Q3, subsequently cured',
    bankruptcies: 0,
    judgments: 1,
    annualIncome: 3_200_000,
    incomeVerified: true,
    rentToIncomeRatio: 9.0,
    employmentStatus: 'Medical Practice',
    employerName: 'Coastal Health Partners LLC',
    employmentYears: 4,
    priorEvictions: 0,
    priorLandlordRefs: 2,
    priorLandlordScore: 7.8,
    rentalHistory:
      '4 years at Westside Medical Park — 1 late payment cured, minor TI dispute resolved',
    backgroundClear: true,
    criminalFlags: [],
    radarScores: [
      { subject: 'Credit', score: 70 },
      { subject: 'Income', score: 76 },
      { subject: 'Rental Hist.', score: 72 },
      { subject: 'Employment', score: 82 },
      { subject: 'Background', score: 100 },
    ],
    flags: [
      { type: 'warning', text: 'D&B Paydex 74 — below 80 threshold; entity only 4 years old' },
      {
        type: 'warning',
        text: 'Judgment (2023 medical billing dispute, $14K) — resolved but on record',
      },
      {
        type: 'info',
        text: 'Recommend additional 2 months security deposit + personal guaranty from all principals',
      },
    ],
    notes:
      'Qualified with conditions. Healthcare tenant adds value (exclusive use clause). Require 3-month security deposit, personal guarantees from all 3 principals, and quarterly financial reporting for Year 1.',
  },
  {
    id: 'app-003',
    name: 'Sterling Creative Studio',
    type: 'individual',
    targetUnit: 'Suite 600 (Open Plan Creative)',
    proposedRent: 9800,
    leaseTermMonths: 24,
    submittedDate: '2026-04-05',
    status: 'declined',
    overallScore: 38,
    recommendation: 'decline',
    creditScore: 591,
    creditHistory: 'Fair — 1 collection account ($3,200 unpaid), 45-day delinquency in 2025',
    bankruptcies: 1,
    judgments: 2,
    annualIncome: 540_000,
    incomeVerified: false,
    rentToIncomeRatio: 21.8,
    employmentStatus: 'Self-Employed',
    employerName: 'Sterling Creative LLC (est. 2025)',
    employmentYears: 1,
    priorEvictions: 1,
    priorLandlordRefs: 1,
    priorLandlordScore: 4.2,
    rentalHistory:
      '1 eviction on record (2024). Single landlord reference — mixed feedback on property upkeep.',
    backgroundClear: false,
    criminalFlags: ['Financial fraud charge (2022, dismissed)'],
    radarScores: [
      { subject: 'Credit', score: 35 },
      { subject: 'Income', score: 28 },
      { subject: 'Rental Hist.', score: 22 },
      { subject: 'Employment', score: 40 },
      { subject: 'Background', score: 65 },
    ],
    flags: [
      { type: 'error', text: 'Active collection account + 45-day delinquency in past 12 months' },
      { type: 'error', text: 'Prior eviction on record (2024) — significant risk indicator' },
      { type: 'error', text: 'Rent-to-income ratio 21.8% (threshold: ≤12%) — income insufficient' },
      {
        type: 'error',
        text: 'Income not verified — tax returns and bank statements not submitted',
      },
      { type: 'warning', text: 'Business entity formed 2025 — insufficient operating history' },
    ],
    notes:
      'Recommend decline. Multiple disqualifying factors: prior eviction, unverified income below threshold, active collections, and bankruptcy within 5 years. Risk exposure too high for standard lease terms.',
  },
];

const RECOMMENDATION_CONFIG = {
  approve: { color: DS.accent.green, label: 'Approve', icon: CheckCircle },
  conditional: { color: DS.accent.gold, label: 'Conditional', icon: AlertTriangle },
  decline: { color: DS.accent.red, label: 'Decline', icon: X },
};

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 75 ? DS.accent.green : score >= 55 ? DS.accent.gold : DS.accent.red;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ * 0.75;
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute inset-0" viewBox="0 0 96 96">
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="6"
          strokeDasharray={`${circ * 0.75} ${circ}`}
          strokeDashoffset={-circ * 0.125}
          strokeLinecap="round"
        />
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={-circ * 0.125}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      </svg>
      <div className="text-center">
        <p className="text-2xl font-black font-mono" style={{ color }}>
          {score}
        </p>
        <p className="text-[8px] uppercase tracking-wider" style={{ color: DS.text.muted }}>
          Score
        </p>
      </div>
    </div>
  );
}

export default function TenantScreeningPage() {
  const queryClient = useQueryClient();

  const {
    data: apiData,
    isLoading,
    isError,
  } = useStandardQuery({
    queryKey: ['terra-tenant-applications'],
    queryFn: () => api.tenantApplications.list(),
    staleTime: 30_000,
  });

  const seedMutation = useStandardMutation({
    mutationFn: async () => {
      for (const a of APPLICANTS) {
        await api.tenantApplications.create({
          name: a.name,
          type: a.type,
          targetUnit: a.targetUnit,
          proposedRent: a.proposedRent,
          leaseTermMonths: a.leaseTermMonths,
          submittedDate: a.submittedDate,
          status: a.status,
          overallScore: a.overallScore,
          recommendation: a.recommendation,
          creditScore: a.creditScore,
          annualIncome: a.annualIncome,
          incomeVerified: a.incomeVerified,
          rentToIncomeRatio: a.rentToIncomeRatio,
          priorEvictions: a.priorEvictions,
          backgroundClear: a.backgroundClear,
          screeningData: {
            creditHistory: a.creditHistory,
            bankruptcies: a.bankruptcies,
            judgments: a.judgments,
            employmentStatus: a.employmentStatus,
            employerName: a.employerName,
            employmentYears: a.employmentYears,
            priorLandlordRefs: a.priorLandlordRefs,
            priorLandlordScore: a.priorLandlordScore,
            rentalHistory: a.rentalHistory,
            criminalFlags: a.criminalFlags,
            radarScores: a.radarScores,
          },
          flags: a.flags as Array<Record<string, unknown>>,
          notes: a.notes,
          isDemo: true,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terra-tenant-applications'] });
    },
  });

  const isLive = !isLoading && !isError && apiData && apiData.dataMode === 'live';
  const applicants: Applicant[] = isLive
    ? apiData.applicants.map((a) => {
        const sd = a.screeningData as Record<string, unknown>;
        return {
          ...a,
          creditHistory: (sd.creditHistory as string) ?? '',
          bankruptcies: (sd.bankruptcies as number) ?? 0,
          judgments: (sd.judgments as number) ?? 0,
          employmentStatus: (sd.employmentStatus as string) ?? '',
          employerName: (sd.employerName as string) ?? '',
          employmentYears: (sd.employmentYears as number) ?? 0,
          priorLandlordRefs: (sd.priorLandlordRefs as number) ?? 0,
          priorLandlordScore: (sd.priorLandlordScore as number) ?? 0,
          rentalHistory: (sd.rentalHistory as string) ?? '',
          criminalFlags: (sd.criminalFlags as string[]) ?? [],
          radarScores: (sd.radarScores as { subject: string; score: number }[]) ?? [],
          flags: a.flags as Applicant['flags'],
        } as Applicant;
      })
    : APPLICANTS;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const effectiveId = selectedId ?? applicants[0]?.id;
  const selected = applicants.find((a) => a.id === effectiveId) ?? applicants[0];
  if (!selected) return null;
  const rec = RECOMMENDATION_CONFIG[selected.recommendation];
  const RecIcon = rec.icon;

  const approved = applicants.filter((a) => a.recommendation === 'approve').length;
  const conditional = applicants.filter((a) => a.recommendation === 'conditional').length;
  const declined = applicants.filter((a) => a.recommendation === 'decline').length;

  return (
    <div className="space-y-4 max-w-[1400px]">
      <div>
        <div className="flex items-center gap-2.5 mb-0.5">
          <h1 className="text-base font-bold text-white tracking-tight font-display">
            Tenant Screening & Credit Module
          </h1>
          <span
            className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider font-bold"
            style={{
              color: DS.accent.green,
              background: `${DS.accent.green}10`,
              border: `1px solid ${DS.accent.green}20`,
            }}
          >
            Risk Scoring
          </span>
          {isLive ? (
            <span
              className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{
                color: DS.accent.green,
                background: `${DS.accent.green}10`,
                border: `1px solid ${DS.accent.green}20`,
              }}
            >
              <Database className="w-2.5 h-2.5" /> Live DB
            </span>
          ) : (
            !isLoading &&
            !isError && (
              <button
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
                className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded cursor-pointer"
                style={{
                  color: DS.text.muted,
                  background: DS.surface,
                  border: `1px solid ${DS.border}`,
                }}
              >
                {seedMutation.isPending ? 'Seeding…' : 'Seed to DB'}
              </button>
            )
          )}
        </div>
        <p className="text-[10px] font-mono" style={{ color: DS.text.muted }}>
          Applicant scoring · credit & income analysis · rental history · background check · lease
          recommendation
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Applications', value: applicants.length.toString(), color: DS.text.primary },
          { label: 'Approved', value: approved.toString(), color: DS.accent.green },
          { label: 'Conditional', value: conditional.toString(), color: DS.accent.gold },
          { label: 'Declined', value: declined.toString(), color: DS.accent.red },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl border p-3"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <p className="text-[8px] uppercase tracking-wider" style={{ color: DS.text.muted }}>
              {m.label}
            </p>
            <p className="text-xl font-bold font-mono mt-1" style={{ color: m.color }}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-3">
          <p
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: DS.text.muted }}
          >
            Applicant Queue
          </p>
          {applicants.map((app) => {
            const r = RECOMMENDATION_CONFIG[app.recommendation];
            const _Icon = r.icon;
            const scoreColor =
              app.overallScore >= 75
                ? DS.accent.green
                : app.overallScore >= 55
                  ? DS.accent.gold
                  : DS.accent.red;
            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedId(app.id)}
                className="rounded-xl border p-4 cursor-pointer transition-all"
                style={{
                  borderColor: selectedId === app.id ? DS.accent.gold : DS.border,
                  background: selectedId === app.id ? 'rgba(184,148,60,0.04)' : DS.surface,
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p
                      className="text-xs font-semibold truncate"
                      style={{ color: DS.text.primary }}
                    >
                      {app.name}
                    </p>
                    <p className="text-[9px] mt-0.5 truncate" style={{ color: DS.text.tertiary }}>
                      {app.targetUnit}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{ color: r.color, background: `${r.color}12` }}
                    >
                      {r.label}
                    </span>
                    <span className="text-sm font-bold font-mono" style={{ color: scoreColor }}>
                      {app.overallScore}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p
                      className="text-[8px] uppercase tracking-wider"
                      style={{ color: DS.text.muted }}
                    >
                      Credit
                    </p>
                    <p
                      className="text-[10px] font-mono"
                      style={{
                        color:
                          app.creditScore >= 720
                            ? DS.accent.green
                            : app.creditScore >= 650
                              ? DS.accent.gold
                              : DS.accent.red,
                      }}
                    >
                      {app.creditScore}
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-[8px] uppercase tracking-wider"
                      style={{ color: DS.text.muted }}
                    >
                      Income RTI
                    </p>
                    <p
                      className="text-[10px] font-mono"
                      style={{
                        color: app.rentToIncomeRatio <= 12 ? DS.accent.green : DS.accent.red,
                      }}
                    >
                      {app.rentToIncomeRatio.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p
                      className="text-[8px] uppercase tracking-wider"
                      style={{ color: DS.text.muted }}
                    >
                      Evictions
                    </p>
                    <p
                      className="text-[10px] font-mono"
                      style={{ color: app.priorEvictions === 0 ? DS.accent.green : DS.accent.red }}
                    >
                      {app.priorEvictions}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div
            className="rounded-xl border p-4"
            style={{ borderColor: DS.border, background: DS.surface }}
          >
            <div className="flex items-start gap-4 mb-4">
              <ScoreGauge score={selected.overallScore} />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold" style={{ color: DS.text.primary }}>
                  {selected.name}
                </h3>
                <p className="text-[10px] mt-0.5" style={{ color: DS.text.tertiary }}>
                  {selected.targetUnit}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: DS.text.muted }}>
                  ${selected.proposedRent.toLocaleString()}/mo · {selected.leaseTermMonths}-month
                  term
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <RecIcon className="w-4 h-4" style={{ color: rec.color }} />
                  <span className="text-sm font-bold" style={{ color: rec.color }}>
                    Recommendation: {rec.label}
                  </span>
                </div>
              </div>
              <div className="w-32 h-28 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={selected.radarScores} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 8 }}
                    />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke={rec.color}
                      fill={rec.color}
                      fillOpacity={0.15}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <p
              className="text-[10px] leading-relaxed p-3 rounded-lg"
              style={{
                color: DS.text.secondary,
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${DS.border}`,
              }}
            >
              {selected.notes}
            </p>
          </div>

          {selected.flags.length > 0 && (
            <div
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: DS.border, background: DS.surface }}
            >
              <div
                className="flex items-center gap-2 px-4 py-2.5 border-b"
                style={{ borderColor: DS.border }}
              >
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: DS.accent.gold }} />
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: `${DS.accent.gold}99` }}
                >
                  Flags & Review Items
                </span>
              </div>
              <div className="divide-y" style={{ borderColor: DS.border }}>
                {selected.flags.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                    <span
                      className="mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                      style={{
                        color:
                          f.type === 'error'
                            ? DS.accent.red
                            : f.type === 'warning'
                              ? DS.accent.gold
                              : DS.accent.blue,
                        background: `${f.type === 'error' ? DS.accent.red : f.type === 'warning' ? DS.accent.gold : DS.accent.blue}12`,
                      }}
                    >
                      {f.type.toUpperCase()}
                    </span>
                    <p className="text-[10px] leading-relaxed" style={{ color: DS.text.secondary }}>
                      {f.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-xl border p-4"
              style={{ borderColor: DS.border, background: DS.surface }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-wider mb-3"
                style={{ color: DS.text.muted }}
              >
                Credit & Financial
              </p>
              {[
                {
                  label: 'Credit Score',
                  value: selected.creditScore.toString(),
                  color:
                    selected.creditScore >= 720
                      ? DS.accent.green
                      : selected.creditScore >= 650
                        ? DS.accent.gold
                        : DS.accent.red,
                },
                {
                  label: 'Annual Income',
                  value: fmt(selected.annualIncome),
                  color: DS.text.secondary,
                },
                {
                  label: 'Income Verified',
                  value: selected.incomeVerified ? 'Yes' : 'Not Verified',
                  color: selected.incomeVerified ? DS.accent.green : DS.accent.red,
                },
                {
                  label: 'Rent-to-Income',
                  value: `${selected.rentToIncomeRatio.toFixed(1)}%`,
                  color: selected.rentToIncomeRatio <= 12 ? DS.accent.green : DS.accent.red,
                },
                {
                  label: 'Bankruptcies',
                  value: selected.bankruptcies.toString(),
                  color: selected.bankruptcies === 0 ? DS.accent.green : DS.accent.red,
                },
                {
                  label: 'Judgments',
                  value: selected.judgments.toString(),
                  color: selected.judgments === 0 ? DS.accent.green : DS.accent.red,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-1.5"
                  style={{ borderTop: `1px solid ${DS.border}` }}
                >
                  <span
                    className="text-[9px] uppercase tracking-wider"
                    style={{ color: DS.text.muted }}
                  >
                    {row.label}
                  </span>
                  <span className="text-[10px] font-bold font-mono" style={{ color: row.color }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="rounded-xl border p-4"
              style={{ borderColor: DS.border, background: DS.surface }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-wider mb-3"
                style={{ color: DS.text.muted }}
              >
                Rental History & Background
              </p>
              {[
                {
                  label: 'Prior Evictions',
                  value: selected.priorEvictions.toString(),
                  color: selected.priorEvictions === 0 ? DS.accent.green : DS.accent.red,
                },
                {
                  label: 'Landlord Score',
                  value: `${selected.priorLandlordScore.toFixed(1)}/10`,
                  color:
                    selected.priorLandlordScore >= 8
                      ? DS.accent.green
                      : selected.priorLandlordScore >= 6
                        ? DS.accent.gold
                        : DS.accent.red,
                },
                {
                  label: 'References',
                  value: `${selected.priorLandlordRefs} provided`,
                  color: DS.text.secondary,
                },
                {
                  label: 'Background',
                  value: selected.backgroundClear ? 'Clear' : 'Flags Noted',
                  color: selected.backgroundClear ? DS.accent.green : DS.accent.red,
                },
                { label: 'Employment', value: selected.employmentStatus, color: DS.text.secondary },
                {
                  label: 'Tenure',
                  value: `${selected.employmentYears}yr`,
                  color: selected.employmentYears >= 3 ? DS.accent.green : DS.accent.gold,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-1.5"
                  style={{ borderTop: `1px solid ${DS.border}` }}
                >
                  <span
                    className="text-[9px] uppercase tracking-wider"
                    style={{ color: DS.text.muted }}
                  >
                    {row.label}
                  </span>
                  <span className="text-[10px] font-bold font-mono" style={{ color: row.color }}>
                    {row.value}
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
