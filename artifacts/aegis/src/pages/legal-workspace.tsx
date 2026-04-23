import {
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  Scale,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { AtlasPrismCounselPanel } from '@/components/atlas-prism-counsel-panel';

const DEMO_MATTERS = [
  {
    id: 1,
    title: 'Chen v. Northgate Capital LLC',
    caseNumber: 'CV-2025-08821',
    jurisdiction: 'S.D.N.Y.',
    status: 'discovery',
    healthScore: 82,
    settlementLow: 180000,
    settlementMid: 310000,
    settlementHigh: 480000,
    deadlines: [
      { title: 'Expert disclosure deadline', date: '2026-04-29', priority: 'critical' },
      { title: 'Discovery cutoff', date: '2026-06-18', priority: 'medium' },
    ],
    recommendations: [
      {
        priority: 'high',
        title: 'Accelerate document review',
        description: 'Current pace risks missing expert disclosure deadline in 6 days',
      },
      {
        priority: 'critical',
        title: 'Privilege review needed',
        description: '14 documents flagged for attorney review before disclosure',
      },
    ],
    readinessScores: {
      discovery: 78,
      privilege: 61,
      witnesses: 85,
      evidence: 72,
      strategy: 68,
      budget: 88,
    },
  },
  {
    id: 2,
    title: 'Walsh Industries v. Meridian Tech',
    caseNumber: 'CV-2025-11042',
    jurisdiction: 'N.D. Cal.',
    status: 'pre_trial',
    healthScore: 65,
    settlementLow: 280000,
    settlementMid: 450000,
    settlementHigh: 720000,
    deadlines: [
      { title: 'Pre-trial brief filing', date: '2026-05-02', priority: 'critical' },
      { title: 'Motions in limine', date: '2026-05-19', priority: 'high' },
    ],
    recommendations: [
      {
        priority: 'critical',
        title: 'Complete witness list',
        description: 'Trial date set — witness list still incomplete with 9 days to brief',
      },
    ],
    readinessScores: {
      discovery: 95,
      privilege: 88,
      witnesses: 55,
      evidence: 79,
      strategy: 62,
      budget: 74,
    },
  },
  {
    id: 3,
    title: 'Meridian RE v. Solaris Group',
    caseNumber: 'CV-2025-05519',
    jurisdiction: 'S.D. Fla.',
    status: 'discovery',
    healthScore: 74,
    settlementLow: 95000,
    settlementMid: 185000,
    settlementHigh: 310000,
    deadlines: [{ title: 'Interrogatories response', date: '2026-05-06', priority: 'high' }],
    recommendations: [
      {
        priority: 'high',
        title: 'Document production review',
        description: "Opposing counsel's production needs analysis before May 6 response",
      },
    ],
    readinessScores: {
      discovery: 68,
      privilege: 82,
      witnesses: 77,
      evidence: 65,
      strategy: 75,
      budget: 91,
    },
  },
  {
    id: 4,
    title: 'Okafor Pharmaceuticals v. Vexar Bio',
    caseNumber: 'CV-2025-14308',
    jurisdiction: 'D. Del.',
    status: 'discovery',
    healthScore: 71,
    settlementLow: 120000,
    settlementMid: 230000,
    settlementHigh: 390000,
    deadlines: [
      { title: 'Claim construction brief', date: '2026-06-04', priority: 'high' },
      { title: 'Protective order deadline', date: '2026-07-11', priority: 'medium' },
    ],
    recommendations: [
      {
        priority: 'high',
        title: 'Finalize prior art search',
        description: 'Three patent families uncharted — needed for claim construction',
      },
    ],
    readinessScores: {
      discovery: 62,
      privilege: 79,
      witnesses: 70,
      evidence: 58,
      strategy: 66,
      budget: 83,
    },
  },
  {
    id: 5,
    title: 'Calloway Logistics v. Harbor Freight Co.',
    caseNumber: 'CV-2025-09917',
    jurisdiction: 'S.D. Tex.',
    status: 'mediation',
    healthScore: 88,
    settlementLow: 60000,
    settlementMid: 120000,
    settlementHigh: 200000,
    deadlines: [
      { title: 'Mediation statement submission', date: '2026-05-14', priority: 'medium' },
    ],
    recommendations: [
      {
        priority: 'medium',
        title: 'Prepare damages model for mediator',
        description: 'Mediator requested detailed freight loss calculations',
      },
    ],
    readinessScores: {
      discovery: 91,
      privilege: 94,
      witnesses: 88,
      evidence: 90,
      strategy: 85,
      budget: 96,
    },
  },
  {
    id: 6,
    title: 'Reyes & Partners v. Fortress Insurance',
    caseNumber: 'CV-2025-07244',
    jurisdiction: 'C.D. Cal.',
    status: 'discovery',
    healthScore: 58,
    settlementLow: 75000,
    settlementMid: 160000,
    settlementHigh: 280000,
    deadlines: [
      { title: 'Deposition of corporate designee', date: '2026-05-28', priority: 'high' },
      { title: 'ESI production complete', date: '2026-06-20', priority: 'medium' },
    ],
    recommendations: [
      {
        priority: 'critical',
        title: 'ESI custodian list overdue',
        description: 'Opposing counsel sent meet-and-confer notice — respond within 5 days',
      },
    ],
    readinessScores: {
      discovery: 44,
      privilege: 68,
      witnesses: 60,
      evidence: 51,
      strategy: 55,
      budget: 77,
    },
  },
  {
    id: 7,
    title: 'Dumont Capital v. Blackthorn Advisory',
    caseNumber: 'CV-2025-16731',
    jurisdiction: 'S.D.N.Y.',
    status: 'pre_trial',
    healthScore: 76,
    settlementLow: 140000,
    settlementMid: 260000,
    settlementHigh: 420000,
    deadlines: [
      { title: 'Summary judgment opposition', date: '2026-06-10', priority: 'high' },
    ],
    recommendations: [
      {
        priority: 'high',
        title: 'Engage financial expert witness',
        description: 'Damages analysis must be expert-supported for summary judgment opposition',
      },
    ],
    readinessScores: {
      discovery: 87,
      privilege: 91,
      witnesses: 63,
      evidence: 80,
      strategy: 72,
      budget: 68,
    },
  },
  {
    id: 8,
    title: 'Sentinel HealthTech v. NovaMed Systems',
    caseNumber: 'CV-2026-00412',
    jurisdiction: 'N.D. Ill.',
    status: 'discovery',
    healthScore: 69,
    settlementLow: 55000,
    settlementMid: 115000,
    settlementHigh: 195000,
    deadlines: [
      { title: 'Initial disclosures due', date: '2026-05-08', priority: 'high' },
      { title: 'Scheduling conference', date: '2026-05-22', priority: 'medium' },
    ],
    recommendations: [
      {
        priority: 'high',
        title: 'Identify key custodians for ESI',
        description: 'HIPAA-covered records require special handling protocol',
      },
    ],
    readinessScores: {
      discovery: 55,
      privilege: 72,
      witnesses: 65,
      evidence: 60,
      strategy: 58,
      budget: 85,
    },
  },
  {
    id: 9,
    title: 'Arroyo Construction v. Paragon Surety',
    caseNumber: 'CV-2025-13084',
    jurisdiction: 'D. Ariz.',
    status: 'mediation',
    healthScore: 83,
    settlementLow: 40000,
    settlementMid: 90000,
    settlementHigh: 155000,
    deadlines: [
      { title: 'Joint mediation brief', date: '2026-05-31', priority: 'medium' },
    ],
    recommendations: [
      {
        priority: 'medium',
        title: 'Consolidate subcontractor affidavits',
        description: 'Four declarations still outstanding for bond claim support',
      },
    ],
    readinessScores: {
      discovery: 89,
      privilege: 92,
      witnesses: 84,
      evidence: 87,
      strategy: 80,
      budget: 93,
    },
  },
  {
    id: 10,
    title: 'Vantage Logistics v. Pacific Rim Shipping',
    caseNumber: 'CV-2025-10628',
    jurisdiction: 'C.D. Cal.',
    status: 'discovery',
    healthScore: 62,
    settlementLow: 85000,
    settlementMid: 175000,
    settlementHigh: 300000,
    deadlines: [
      { title: 'Foreign language document translation', date: '2026-07-02', priority: 'medium' },
      { title: 'Expert witness designation', date: '2026-08-14', priority: 'high' },
    ],
    recommendations: [
      {
        priority: 'high',
        title: 'Retain maritime law expert',
        description: 'Bill of lading dispute requires specialized admiralty expertise',
      },
    ],
    readinessScores: {
      discovery: 61,
      privilege: 75,
      witnesses: 48,
      evidence: 66,
      strategy: 59,
      budget: 80,
    },
  },
];

const PILLAR_LABELS: Record<string, string> = {
  discovery: 'Discovery',
  privilege: 'Privilege',
  witnesses: 'Witnesses',
  evidence: 'Evidence',
  strategy: 'Strategy',
  budget: 'Budget',
};

type SectionKey = 'overview' | 'matters' | 'deadlines' | 'ai';

const SECTION_META: Record<SectionKey, { title: string; subtitle: string }> = {
  overview: {
    title: 'Matter Overview',
    subtitle: 'Cross-matter health, exposure, and forecast at a glance',
  },
  matters: { title: 'Active Matters', subtitle: 'Detailed readiness across all open matters' },
  deadlines: {
    title: 'Deadline Risk Queue',
    subtitle: 'Time-sensitive filings and discovery cutoffs',
  },
  ai: { title: 'AI Recommendations', subtitle: 'Prioritized actions surfaced by Counsel' },
};

function resolveSection(location: string): SectionKey {
  if (location.startsWith('/legal/matters')) return 'matters';
  if (location.startsWith('/legal/deadlines')) return 'deadlines';
  if (location.startsWith('/legal/ai')) return 'ai';
  // /legal and /legal/overview both render the overview section
  return 'overview';
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] p-4" style={{ background: '#0c1220' }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="text-2xl font-semibold text-slate-100">{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

function PillarBar({ label, score }: { label: string; score: number }) {
  const color = score >= 75 ? '#4a90b8' : score >= 50 ? '#d4a054' : '#c45a4a';
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-slate-400 w-16 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-[11px] font-mono text-slate-300 w-7 text-right">{score}</span>
    </div>
  );
}

function DeadlineRow({
  title,
  date,
  matter,
}: {
  title: string;
  date: string;
  priority: string;
  matter: string;
}) {
  const daysLeft = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const urgency = daysLeft <= 7 ? '#c45a4a' : daysLeft <= 30 ? '#d4a054' : '#4a90b8';
  return (
    <div className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: urgency }} />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-200 truncate">{title}</div>
        <div className="text-[10px] text-slate-500">{matter}</div>
      </div>
      <div className="text-[11px] font-mono text-slate-400">
        {daysLeft > 0 ? `${daysLeft}d` : 'OVERDUE'}
      </div>
    </div>
  );
}

function MatterHealthCard({ matter }: { matter: (typeof DEMO_MATTERS)[number] }) {
  return (
    <div className="rounded border border-white/[0.04] p-3" style={{ background: '#080c14' }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold"
            style={{
              background:
                matter.healthScore >= 70
                  ? '#4a90b820'
                  : matter.healthScore >= 50
                    ? '#d4a05420'
                    : '#c45a4a20',
              color:
                matter.healthScore >= 70
                  ? '#4a90b8'
                  : matter.healthScore >= 50
                    ? '#d4a054'
                    : '#c45a4a',
            }}
          >
            {matter.healthScore}
          </div>
          <div>
            <div className="text-xs font-medium text-slate-200">{matter.title}</div>
            <div className="text-[10px] text-slate-500">
              {matter.caseNumber} · {matter.jurisdiction}
            </div>
          </div>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
            matter.status === 'discovery'
              ? 'bg-[#4a90b8]/10 text-[#4a90b8]'
              : 'bg-[#d4a054]/10 text-[#d4a054]'
          }`}
        >
          {matter.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>
      <div className="space-y-1 mt-2">
        {Object.entries(matter.readinessScores)
          .slice(0, 4)
          .map(([k, v]) => (
            <PillarBar key={k} label={PILLAR_LABELS[k] || k} score={v} />
          ))}
      </div>
    </div>
  );
}

export default function LegalWorkspacePage() {
  const [location, navigate] = useLocation();
  // Normalize bare /legal -> /legal/overview so the sidebar entry highlights.
  useEffect(() => {
    if (location === '/legal') {
      navigate('/legal/overview', { replace: true });
    }
  }, [location, navigate]);
  const section = resolveSection(location);
  const meta = SECTION_META[section];

  const allDeadlines = DEMO_MATTERS.flatMap((m) =>
    (m.deadlines || []).map((d) => ({ ...d, matterTitle: m.title })),
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const allRecs = DEMO_MATTERS.flatMap((m) =>
    (m.recommendations || []).map((r) => ({ ...r, matterTitle: m.title })),
  );

  const criticalRecs = allRecs.filter((r) => r.priority === 'critical' || r.priority === 'high');

  const totalExposure = DEMO_MATTERS.reduce((sum, m) => sum + m.settlementMid, 0);

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5" style={{ color: '#d4a054' }} />
            <h1 className="text-lg font-semibold text-slate-100">{meta.title}</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20">
              Counsel
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-500/10 text-slate-500 border border-white/[0.06]">
              <WifiOff className="w-2.5 h-2.5" /> DEMO
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{meta.subtitle}</p>
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
      </div>

      {section === 'overview' && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-3">
            <KpiCard
              label="Active Matters"
              value={String(DEMO_MATTERS.length)}
              sub={`${DEMO_MATTERS.filter((m) => m.status === 'discovery').length} discovery · ${DEMO_MATTERS.filter((m) => m.status === 'pre_trial').length} pre-trial · ${DEMO_MATTERS.filter((m) => m.status === 'mediation').length} mediation`}
              icon={FileText}
              accent="#d4a054"
            />
            <KpiCard
              label="Total Exposure"
              value={`$${(totalExposure / 1_000_000).toFixed(1)}M`}
              sub="Across all active matters"
              icon={DollarSign}
              accent="#c8953c"
            />
            <KpiCard
              label="Upcoming Deadlines"
              value={String(allDeadlines.length)}
              sub={`${allDeadlines.filter((d) => Math.ceil((new Date(d.date).getTime() - Date.now()) / 86400000) <= 14).length} within 14 days`}
              icon={Clock}
              accent="#c45a4a"
            />
            <KpiCard
              label="Pending Approvals"
              value="2"
              sub="1 settlement demand · 1 filing"
              icon={ShieldCheck}
              accent="#4a90b8"
            />
          </div>

          {/* Settlement Forecast */}
          <div
            className="rounded-lg border border-white/[0.06] p-4"
            style={{ background: '#0c1220' }}
          >
            <h2 className="text-sm font-semibold text-slate-200 mb-3">Settlement Forecast</h2>
            <div className="space-y-3">
              {DEMO_MATTERS.map((m) => (
                <div key={m.id} className="py-2 border-b border-white/[0.04] last:border-0">
                  <div className="text-[11px] text-slate-400 mb-1 truncate">
                    {m.title.split(' v. ')[0]}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500">
                      ${(m.settlementLow / 1000).toFixed(0)}K
                    </span>
                    <div className="flex-1 h-2 bg-white/[0.06] rounded-full relative">
                      <div
                        className="absolute h-full rounded-full"
                        style={{
                          left: `${(m.settlementLow / m.settlementHigh) * 40}%`,
                          right: '0%',
                          background: 'linear-gradient(90deg, #d4a054, #4a90b8)',
                          opacity: 0.6,
                        }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white border border-slate-600"
                        style={{
                          left: `${((m.settlementMid - m.settlementLow) / (m.settlementHigh - m.settlementLow)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono text-slate-500">
                      ${(m.settlementHigh / 1000).toFixed(0)}K
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Privilege Engine */}
          <div
            className="rounded-lg border border-white/[0.06] p-4"
            style={{ background: '#0c1220' }}
          >
            <h2 className="text-sm font-semibold text-slate-200 mb-2">Privilege Engine</h2>
            <p className="text-[10px] text-slate-500 mb-3">
              Attorney-client privilege status across all matters
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Reviewed', count: 1842, color: '#4a90b8' },
                { label: 'Flagged', count: 14, color: '#d4a054' },
                { label: 'Cleared', count: 1828, color: '#4ade80' },
                { label: 'Withheld', count: 12, color: '#c45a4a' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded border border-white/[0.04] px-3 py-2"
                  style={{ background: '#080c14' }}
                >
                  <span className="text-[11px] text-slate-400">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-[11px] font-mono text-slate-300">
                      {item.count.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Approvals */}
          <div
            className="rounded-lg border border-white/[0.06] p-4"
            style={{ background: '#0c1220' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4" style={{ color: '#4a90b8' }} />
              <h2 className="text-sm font-semibold text-slate-200">Pending Approvals</h2>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#4a90b8]/10 text-[#4a90b8] border border-[#4a90b8]/20">
                2 awaiting
              </span>
            </div>
            <div className="space-y-2">
              {[
                {
                  id: 'APV-2026-0041',
                  type: 'Settlement Demand',
                  matter: 'Walsh Industries v. Meridian Tech',
                  description: 'Authorize $450K settlement demand letter to opposing counsel',
                  requestedBy: 'J. Harmon, Lead Counsel',
                  age: '18h ago',
                  urgency: '#c45a4a',
                },
                {
                  id: 'APV-2026-0039',
                  type: 'Court Filing',
                  matter: 'Chen v. Northgate Capital LLC',
                  description: 'Sign off on expert witness disclosure filing (due Apr 29)',
                  requestedBy: 'M. Adeyemi, Litigation',
                  age: '2d ago',
                  urgency: '#d4a054',
                },
              ].map((apv) => (
                <div
                  key={apv.id}
                  className="flex items-start gap-3 rounded border border-white/[0.04] px-3 py-2.5"
                  style={{ background: '#080c14' }}
                >
                  <div
                    className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: apv.urgency }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-mono text-slate-500">{apv.id}</span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                        style={{
                          background: `${apv.urgency}15`,
                          color: apv.urgency,
                          border: `1px solid ${apv.urgency}30`,
                        }}
                      >
                        {apv.type}
                      </span>
                    </div>
                    <div className="text-xs text-slate-200">{apv.description}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {apv.matter} · {apv.requestedBy}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-600 flex-shrink-0">{apv.age}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {section === 'matters' && (
        <div
          className="rounded-lg border border-white/[0.06] p-4"
          style={{ background: '#0c1220' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-200">Matter Health</h2>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              {DEMO_MATTERS.length} active <ChevronRight className="w-3 h-3" />
            </span>
          </div>
          <div className="space-y-3">
            {DEMO_MATTERS.map((m) => (
              <MatterHealthCard key={m.id} matter={m} />
            ))}
          </div>
        </div>
      )}

      {section === 'deadlines' && (
        <div className="grid grid-cols-3 gap-4">
          <div
            className="col-span-2 rounded-lg border border-white/[0.06] p-4"
            style={{ background: '#0c1220' }}
          >
            <h2 className="text-sm font-semibold text-slate-200 mb-3">Deadline Risk Queue</h2>
            <div>
              {allDeadlines.map((d, i) => (
                <DeadlineRow
                  key={i}
                  title={d.title}
                  date={d.date}
                  priority={d.priority}
                  matter={d.matterTitle}
                />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <KpiCard
              label="Total Deadlines"
              value={String(allDeadlines.length)}
              sub={`${allDeadlines.filter((d) => Math.ceil((new Date(d.date).getTime() - Date.now()) / 86400000) <= 14).length} within 14 days`}
              icon={Clock}
              accent="#c45a4a"
            />
            <KpiCard
              label="Critical / High"
              value={String(
                allDeadlines.filter((d) => d.priority === 'critical' || d.priority === 'high')
                  .length,
              )}
              sub="Require immediate attention"
              icon={ShieldCheck}
              accent="#d4a054"
            />
          </div>
        </div>
      )}

      {section === 'ai' && (
        <div
          className="rounded-lg border border-white/[0.06] p-4"
          style={{ background: '#0c1220' }}
        >
          <h2 className="text-sm font-semibold text-slate-200 mb-3">AI Recommendations</h2>
          <div className="space-y-2">
            {criticalRecs.map((r, i) => (
              <div
                key={i}
                className="flex items-start gap-3 py-2 border-b border-white/[0.04] last:border-0"
              >
                <div
                  className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${r.priority === 'critical' ? 'bg-[#c45a4a]' : 'bg-[#d4a054]'}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-200">{r.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{r.description}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">{r.matterTitle}</div>
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-medium uppercase ${
                    r.priority === 'critical'
                      ? 'bg-[#c45a4a]/10 text-[#c45a4a]'
                      : 'bg-[#d4a054]/10 text-[#d4a054]'
                  }`}
                >
                  {r.priority}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <AtlasPrismCounselPanel matterId="MTR-2026-0891" isDemo={true} />
          </div>
        </div>
      )}
    </div>
  );
}
