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
    caseNumber: 'CV-2024-08821',
    jurisdiction: 'S.D.N.Y.',
    status: 'discovery',
    healthScore: 82,
    settlementLow: 250000,
    settlementMid: 420000,
    settlementHigh: 680000,
    deadlines: [
      { title: 'Expert disclosure deadline', date: '2025-05-15', priority: 'high' },
      { title: 'Discovery cutoff', date: '2025-06-30', priority: 'medium' },
    ],
    recommendations: [
      {
        priority: 'high',
        title: 'Accelerate document review',
        description: 'Current pace risks missing discovery deadline',
      },
      {
        priority: 'critical',
        title: 'Privilege review needed',
        description: '14 documents flagged for attorney review',
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
    caseNumber: 'CV-2024-11042',
    jurisdiction: 'N.D. Cal.',
    status: 'pre_trial',
    healthScore: 65,
    settlementLow: 800000,
    settlementMid: 1200000,
    settlementHigh: 1900000,
    deadlines: [
      { title: 'Pre-trial brief filing', date: '2025-04-28', priority: 'critical' },
      { title: 'Motions in limine', date: '2025-05-05', priority: 'high' },
    ],
    recommendations: [
      {
        priority: 'critical',
        title: 'Complete witness list',
        description: 'Trial date set — witness list incomplete',
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
    caseNumber: 'CV-2024-05519',
    jurisdiction: 'S.D. Fla.',
    status: 'discovery',
    healthScore: 74,
    settlementLow: 150000,
    settlementMid: 310000,
    settlementHigh: 500000,
    deadlines: [{ title: 'Interrogatories response', date: '2025-05-22', priority: 'medium' }],
    recommendations: [
      {
        priority: 'high',
        title: 'Document production review',
        description: "Opposing counsel's production needs analysis",
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
              sub="2 in discovery · 1 pre-trial"
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
              value="3"
              sub="1 demand send · 2 filings"
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
