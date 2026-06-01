import { color } from '@szl-holdings/design-system';
import { cn } from '@szl-holdings/shared-ui/utils';
import { AnimatePresence, motion as m } from 'framer-motion';
import {
  AlertTriangle,
} from 'lucide-react';
import { useState } from 'react';

type DefectSeverity = 'critical' | 'major' | 'minor' | 'clear';

interface ChainLink {
  year: number;
  grantee: string;
  grantor: string;
  instrument: string;
  docNumber: string;
  consideration: number;
  notes: string;
}

interface TitleDefect {
  type: string;
  severity: DefectSeverity;
  description: string;
  curativeAction: string;
  estimatedTimeline: string;
  estimatedCost: number;
  status: 'unresolved' | 'in_progress' | 'resolved';
}

interface Lien {
  type: string;
  holder: string;
  amount: number;
  recordedDate: string;
  status: 'active' | 'released' | 'disputed';
  priority: number;
}

interface Easement {
  type: string;
  beneficiary: string;
  area: string;
  description: string;
  impact: 'none' | 'minor' | 'significant';
}

interface TitleReport {
  id: string;
  address: string;
  currentOwner: string;
  legalDescription: string;
  parcelId: string;
  overallRiskScore: number;
  overallGrade: string;
  chain: ChainLink[];
  defects: TitleDefect[];
  liens: Lien[];
  easements: Easement[];
  estimatedClearanceTime: string;
  titleInsurancePremium: number;
}

const SEVERITY_COLORS: Record<DefectSeverity, string> = {
  critical: color.accent.red,
  major: color.accent.amber,
  minor: color.accent.amber,
  clear: color.accent.green,
};

const REPORT: TitleReport = {
  id: 'tr-1',
  address: '2800 Post Oak Blvd, Houston, TX 77056',
  currentOwner: 'Post Oak Development Partners LLC',
  legalDescription: 'LOT 14, BLOCK 3, POST OAK SUBDIVISION, HARRIS COUNTY',
  parcelId: '042-156-0014',
  overallRiskScore: 72,
  overallGrade: 'B',
  chain: [
    {
      year: 2021,
      grantee: 'Post Oak Development Partners LLC',
      grantor: 'Galleria Investments LP',
      instrument: 'General Warranty Deed',
      docNumber: '2021-0284721',
      consideration: 18500000,
      notes: 'Arms-length transaction. Title insurance issued by First American.',
    },
    {
      year: 2016,
      grantee: 'Galleria Investments LP',
      grantor: 'Westchase Land Co.',
      instrument: 'Special Warranty Deed',
      docNumber: '2016-0156832',
      consideration: 12200000,
      notes: 'Entity transfer. Limited covenants. Phase I ESA on file.',
    },
    {
      year: 2008,
      grantee: 'Westchase Land Co.',
      instrument: 'General Warranty Deed',
      grantor: 'Memorial Heights Trust',
      docNumber: '2008-0089421',
      consideration: 8900000,
      notes: 'Trust distribution. Trustee capacity verified.',
    },
    {
      year: 1998,
      grantee: 'Memorial Heights Trust',
      grantor: 'H.R. Patterson Estate',
      instrument: "Executor's Deed",
      docNumber: '1998-0042156',
      consideration: 4200000,
      notes: 'Probate estate transfer. Court order #98-CV-4521.',
    },
    {
      year: 1972,
      grantee: 'H.R. Patterson',
      grantor: 'Post Oak Land & Cattle Co.',
      instrument: 'General Warranty Deed',
      docNumber: '1972-0012845',
      consideration: 285000,
      notes: 'Original subdivision plat recorded same year.',
    },
  ],
  defects: [
    {
      type: 'Gap in Chain',
      severity: 'minor',
      description:
        "1998 Executor's Deed references probate case #98-CV-4521 but certified copy of court order not on file with county recorder.",
      curativeAction:
        'Obtain certified copy of probate court order and record with Harris County Clerk.',
      estimatedTimeline: '2-4 weeks',
      estimatedCost: 850,
      status: 'in_progress',
    },
    {
      type: 'Unreleased Mortgage',
      severity: 'major',
      description:
        '2008 mortgage from Southwest National Bank ($6.2M) shows no recorded satisfaction/release. Bank was acquired by Regions Financial in 2012.',
      curativeAction:
        'Contact Regions Financial mortgage servicing. Obtain and record payoff letter and release of lien.',
      estimatedTimeline: '4-8 weeks',
      estimatedCost: 2500,
      status: 'unresolved',
    },
    {
      type: 'Survey Discrepancy',
      severity: 'minor',
      description:
        "2016 ALTA survey shows 0.3-foot encroachment of neighbor's fence onto subject property along west boundary.",
      curativeAction:
        'Obtain neighbor acknowledgment letter or boundary line agreement. Record with county.',
      estimatedTimeline: '2-6 weeks',
      estimatedCost: 3500,
      status: 'unresolved',
    },
  ],
  liens: [
    {
      type: 'First Mortgage',
      holder: 'JPMorgan Chase',
      amount: 11100000,
      recordedDate: '2021-03-15',
      status: 'active',
      priority: 1,
    },
    {
      type: 'Mezzanine Loan',
      holder: 'Starwood Capital',
      amount: 3700000,
      recordedDate: '2021-03-15',
      status: 'active',
      priority: 2,
    },
    {
      type: 'Property Tax Lien',
      holder: 'Harris County',
      amount: 0,
      recordedDate: '2025-01-01',
      status: 'released',
      priority: 3,
    },
    {
      type: 'Mechanics Lien',
      holder: 'ProBuild Construction Inc.',
      amount: 185000,
      recordedDate: '2024-08-22',
      status: 'disputed',
      priority: 4,
    },
    {
      type: 'UCC Filing',
      holder: 'Equipment Finance Co.',
      amount: 420000,
      recordedDate: '2023-11-01',
      status: 'active',
      priority: 5,
    },
  ],
  easements: [
    {
      type: 'Utility',
      beneficiary: 'CenterPoint Energy',
      area: '10-ft strip, east boundary',
      description:
        'Underground gas and electric service easement. Recorded 1972 with original plat.',
      impact: 'none',
    },
    {
      type: 'Access',
      beneficiary: 'Galleria Towers HOA',
      area: 'Shared driveway, south',
      description:
        'Reciprocal access easement for shared parking structure entry. Maintenance costs split 60/40.',
      impact: 'minor',
    },
    {
      type: 'Drainage',
      beneficiary: 'Harris County Flood Control',
      area: '15-ft setback, north',
      description:
        'Stormwater detention easement. No permanent structures permitted within easement area.',
      impact: 'significant',
    },
  ],
  estimatedClearanceTime: '6-10 weeks',
  titleInsurancePremium: 42500,
};

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1000
      ? `$${(n / 1000).toFixed(0)}K`
      : `$${n.toLocaleString()}`;

export default function TitleIntelligencePage() {
  const [activeTab, setActiveTab] = useState<'chain' | 'defects' | 'liens' | 'easements'>('chain');

  const totalLienBalance = REPORT.liens
    .filter((l) => l.status === 'active' || l.status === 'disputed')
    .reduce((s, l) => s + l.amount, 0);

  return (
    <div className="min-h-screen" style={{ background: '#0a0c10' }}>
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/35">
            Title Intelligence
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            Title & Lien Analysis
          </h1>
          <p className="mt-1 text-sm text-white/40">{REPORT.address}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          {[
            {
              label: 'Title Grade',
              value: REPORT.overallGrade,
              color:
                REPORT.overallGrade === 'A'
                  ? '#34d399'
                  : REPORT.overallGrade === 'B'
                    ? '#60a5fa'
                    : '#fbbf24',
            },
            {
              label: 'Risk Score',
              value: `${REPORT.overallRiskScore}/100`,
              color: REPORT.overallRiskScore >= 80 ? '#34d399' : '#fbbf24',
            },
            { label: 'Active Liens', value: fmt(totalLienBalance), color: '#f97316' },
            {
              label: 'Title Defects',
              value: String(REPORT.defects.length),
              color: REPORT.defects.some((d) => d.severity === 'critical') ? '#ef4444' : '#fbbf24',
            },
            { label: 'Est. Clearance', value: REPORT.estimatedClearanceTime, color: '#60a5fa' },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/35 mb-2">
                {m.label}
              </div>
              <div className="text-xl font-semibold" style={{ color: m.color }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 mb-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-white/30">Owner:</span>{' '}
              <span className="text-white font-medium ml-1">{REPORT.currentOwner}</span>
            </div>
            <div>
              <span className="text-white/30">Parcel:</span>{' '}
              <span className="text-white font-medium ml-1">{REPORT.parcelId}</span>
            </div>
            <div>
              <span className="text-white/30">Insurance Premium:</span>{' '}
              <span className="text-white font-medium ml-1">
                {fmt(REPORT.titleInsurancePremium)}
              </span>
            </div>
            <div>
              <span className="text-white/30">Legal:</span>{' '}
              <span className="text-white/50 ml-1 text-[10px]">{REPORT.legalDescription}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {(['chain', 'defects', 'liens', 'easements'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-semibold transition capitalize',
                tab === activeTab
                  ? 'bg-white/10 text-white'
                  : 'text-white/30 hover:text-white/50 hover:bg-white/[0.03]',
              )}
            >
              {tab === 'chain' ? 'Chain of Title' : tab}
              {tab === 'defects' && REPORT.defects.length > 0 && (
                <span
                  className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full"
                  style={{ background: '#f9731615', color: '#f97316' }}
                >
                  {REPORT.defects.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'chain' && (
            <m.div
              key="chain"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="relative pl-8">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-white/[0.08]" />
                {REPORT.chain.map((link, i) => (
                  <div key={i} className="relative mb-4">
                    <div
                      className="absolute left-[-20px] top-3 w-3 h-3 rounded-full border-2 bg-[#0a0c10]"
                      style={{ borderColor: '#2d6a4f' }}
                    />
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-white">
                          {link.year} — {link.instrument}
                        </span>
                        <span className="text-xs text-white/30">Doc# {link.docNumber}</span>
                      </div>
                      <div className="text-xs text-white/50 mb-1">
                        <span className="text-white/30">From:</span> {link.grantor}{' '}
                        <span className="mx-2 text-white/20">→</span>
                        <span className="text-white/30">To:</span>{' '}
                        <span className="text-white font-medium">{link.grantee}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-white/30">
                        <span>
                          Consideration:{' '}
                          <span className="text-white/50">{fmt(link.consideration)}</span>
                        </span>
                      </div>
                      <p className="text-[10px] text-white/25 mt-1">{link.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            </m.div>
          )}

          {activeTab === 'defects' && (
            <m.div
              key="defects"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {REPORT.defects.map((d, i) => (
                <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ background: `${SEVERITY_COLORS[d.severity]}15` }}
                    >
                      <AlertTriangle
                        className="h-4 w-4"
                        style={{ color: SEVERITY_COLORS[d.severity] }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{d.type}</span>
                        <span
                          className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full"
                          style={{
                            background: `${SEVERITY_COLORS[d.severity]}15`,
                            color: SEVERITY_COLORS[d.severity],
                          }}
                        >
                          {d.severity}
                        </span>
                        <span
                          className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full ml-auto"
                          style={{
                            background:
                              d.status === 'resolved'
                                ? '#34d39915'
                                : d.status === 'in_progress'
                                  ? '#60a5fa15'
                                  : '#fbbf2415',
                            color:
                              d.status === 'resolved'
                                ? '#34d399'
                                : d.status === 'in_progress'
                                  ? '#60a5fa'
                                  : '#fbbf24',
                          }}
                        >
                          {d.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-white/40 mb-3">{d.description}</p>
                  <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] p-3">
                    <div className="text-[10px] font-semibold text-white/50 mb-1">
                      Curative Action
                    </div>
                    <p className="text-xs text-white/40">{d.curativeAction}</p>
                    <div className="flex gap-4 mt-2 text-[10px] text-white/30">
                      <span>
                        Timeline: <span className="text-white/50">{d.estimatedTimeline}</span>
                      </span>
                      <span>
                        Cost: <span style={{ color: '#f97316' }}>{fmt(d.estimatedCost)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </m.div>
          )}

          {activeTab === 'liens' && (
            <m.div
              key="liens"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="space-y-3">
                {REPORT.liens.map((l, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20 text-xs font-bold text-white/40">
                      #{l.priority}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{l.type}</div>
                      <div className="text-[10px] text-white/40">
                        {l.holder} · Recorded {l.recordedDate}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">
                        {l.amount > 0 ? fmt(l.amount) : '—'}
                      </div>
                      <span
                        className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background:
                            l.status === 'active'
                              ? '#60a5fa15'
                              : l.status === 'released'
                                ? '#34d39915'
                                : '#ef444415',
                          color:
                            l.status === 'active'
                              ? '#60a5fa'
                              : l.status === 'released'
                                ? '#34d399'
                                : '#ef4444',
                        }}
                      >
                        {l.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </m.div>
          )}

          {activeTab === 'easements' && (
            <m.div
              key="easements"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {REPORT.easements.map((e, i) => (
                <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-white">{e.type} Easement</span>
                    <span
                      className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background:
                          e.impact === 'none'
                            ? '#34d39915'
                            : e.impact === 'minor'
                              ? '#fbbf2415'
                              : '#ef444415',
                        color:
                          e.impact === 'none'
                            ? '#34d399'
                            : e.impact === 'minor'
                              ? '#fbbf24'
                              : '#ef4444',
                      }}
                    >
                      {e.impact} impact
                    </span>
                  </div>
                  <div className="text-xs text-white/50 mb-1">
                    Beneficiary: {e.beneficiary} · Area: {e.area}
                  </div>
                  <p className="text-[10px] text-white/35">{e.description}</p>
                </div>
              ))}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
