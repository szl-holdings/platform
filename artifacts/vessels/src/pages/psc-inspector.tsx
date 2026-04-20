import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Shield,
  Ship,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

interface PscRecord {
  id: string;
  vessel: string;
  imo: string;
  port: string;
  regime: string;
  date: string;
  result: 'passed' | 'deficiency' | 'detained';
  deficiencies: number;
  deficiencyCategories: string[];
  detained: boolean;
  detentionDays?: number;
  inspector: string;
}

interface VesselPscProfile {
  vessel: string;
  imo: string;
  flag: string;
  detentionRisk: number;
  detentionRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  inspections90d: number;
  deficiencies90d: number;
  detentions12m: number;
  lastInspection: string;
  nextPortCall: string;
  nextPortRegime: string;
  history: PscRecord[];
  checklistItems: {
    category: string;
    status: 'pass' | 'fail' | 'action_required';
    note?: string;
  }[];
}

const VESSELS_PSC: VesselPscProfile[] = [
  {
    vessel: 'Pacific Navigator',
    imo: '9234567',
    flag: 'Marshall Islands',
    detentionRisk: 78,
    detentionRiskLevel: 'high',
    inspections90d: 2,
    deficiencies90d: 7,
    detentions12m: 1,
    lastInspection: '2026-03-18',
    nextPortCall: 'Singapore',
    nextPortRegime: 'Tokyo MoU',
    history: [
      {
        id: 'PSC-001',
        vessel: 'Pacific Navigator',
        imo: '9234567',
        port: 'Port Klang, MY',
        regime: 'Tokyo MoU',
        date: '2026-03-18',
        result: 'detained',
        deficiencies: 4,
        deficiencyCategories: ['ISM Code', 'Fire Safety', 'MARPOL'],
        detained: true,
        detentionDays: 3,
        inspector: 'Capt. Tan Wei Hong',
      },
      {
        id: 'PSC-002',
        vessel: 'Pacific Navigator',
        imo: '9234567',
        port: 'Shanghai, CN',
        regime: 'Tokyo MoU',
        date: '2026-01-05',
        result: 'deficiency',
        deficiencies: 3,
        deficiencyCategories: ['Life Saving', 'ISPS'],
        detained: false,
        inspector: 'Capt. Liu Mingzhi',
      },
    ],
    checklistItems: [
      {
        category: 'ISM Code — SMS Manual',
        status: 'fail',
        note: 'Master review not completed for 2 non-conformities from Port Klang detention',
      },
      {
        category: 'Fire Detection System',
        status: 'action_required',
        note: 'Detector in cargo hold #3 requires calibration before Singapore',
      },
      {
        category: 'MARPOL — ORB current',
        status: 'fail',
        note: 'Oil Record Book entries for Apr 10–15 missing',
      },
      {
        category: 'Life Saving Appliances',
        status: 'action_required',
        note: 'Pyrotechnics inspection due Apr 22',
      },
      { category: 'ISPS Documentation', status: 'pass' },
      { category: 'Navigation Equipment', status: 'pass' },
      {
        category: 'Crew Certificates',
        status: 'action_required',
        note: 'Master STCW II/2 expired — renewal in progress',
      },
    ],
  },
  {
    vessel: 'Arctic Breeze',
    imo: '9876543',
    flag: 'Norway',
    detentionRisk: 18,
    detentionRiskLevel: 'low',
    inspections90d: 1,
    deficiencies90d: 1,
    detentions12m: 0,
    lastInspection: '2026-02-22',
    nextPortCall: 'Rotterdam',
    nextPortRegime: 'Paris MoU',
    history: [
      {
        id: 'PSC-003',
        vessel: 'Arctic Breeze',
        imo: '9876543',
        port: 'Rotterdam, NL',
        regime: 'Paris MoU',
        date: '2026-02-22',
        result: 'deficiency',
        deficiencies: 1,
        deficiencyCategories: ['Working Hours'],
        detained: false,
        inspector: 'Insp. van der Berg',
      },
    ],
    checklistItems: [
      { category: 'ISM Code — SMS Manual', status: 'pass' },
      { category: 'Fire Detection System', status: 'pass' },
      { category: 'MARPOL — ORB current', status: 'pass' },
      { category: 'Life Saving Appliances', status: 'pass' },
      {
        category: 'Working Hours Records',
        status: 'action_required',
        note: 'Minor hours breach in March — corrective memo issued',
      },
      { category: 'Crew Certificates', status: 'pass' },
      { category: 'Navigation Equipment', status: 'pass' },
    ],
  },
  {
    vessel: 'Cape Resolute',
    imo: '9123456',
    flag: 'Liberia',
    detentionRisk: 51,
    detentionRiskLevel: 'medium',
    inspections90d: 2,
    deficiencies90d: 5,
    detentions12m: 0,
    lastInspection: '2026-04-01',
    nextPortCall: 'Novorossiysk',
    nextPortRegime: 'Black Sea MoU',
    history: [
      {
        id: 'PSC-004',
        vessel: 'Cape Resolute',
        imo: '9123456',
        port: 'Houston, US',
        regime: 'USCG',
        date: '2026-04-01',
        result: 'deficiency',
        deficiencies: 3,
        deficiencyCategories: ['Propulsion', 'Sewage Treatment'],
        detained: false,
        inspector: 'USCG Lt. Anderson',
      },
      {
        id: 'PSC-005',
        vessel: 'Cape Resolute',
        imo: '9123456',
        port: 'Antwerp, BE',
        regime: 'Paris MoU',
        date: '2026-02-14',
        result: 'deficiency',
        deficiencies: 2,
        deficiencyCategories: ['MARPOL', 'ISPS'],
        detained: false,
        inspector: 'Insp. Dubois',
      },
    ],
    checklistItems: [
      { category: 'ISM Code — SMS Manual', status: 'pass' },
      {
        category: 'Propulsion System',
        status: 'action_required',
        note: 'Rudder inspection pending from USCG deficiency',
      },
      {
        category: 'MARPOL — ORB current',
        status: 'action_required',
        note: 'ORB annotation format inconsistent — update before Novorossiysk',
      },
      {
        category: 'Sewage Treatment Plant',
        status: 'fail',
        note: 'STP overboard valve — repair complete Apr 12 but documentation outstanding',
      },
      { category: 'ISPS Documentation', status: 'pass' },
      { category: 'Crew Certificates', status: 'pass' },
    ],
  },
];

const riskColor: Record<string, string> = {
  low: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const resultColor: Record<string, string> = {
  passed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  deficiency: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  detained: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const checklistStatusIcon = { pass: CheckCircle2, fail: AlertTriangle, action_required: Clock };
const checklistStatusColor = {
  pass: 'text-emerald-400',
  fail: 'text-red-400',
  action_required: 'text-amber-400',
};

export default function PscInspectorPage() {
  const [selected, setSelected] = useState(VESSELS_PSC[0]);
  const [tab, setTab] = useState<'risk' | 'history' | 'checklist'>('risk');

  const totalDetentions = VESSELS_PSC.reduce((a, v) => a + v.detentions12m, 0);
  const highRisk = VESSELS_PSC.filter(
    (v) => v.detentionRiskLevel === 'high' || v.detentionRiskLevel === 'critical',
  ).length;
  const totalDeficiencies = VESSELS_PSC.reduce((a, v) => a + v.deficiencies90d, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-sky-50 flex items-center gap-2">
          <Shield className="w-5 h-5 text-sky-400" />
          Port State Control Inspector
        </h1>
        <p className="text-xs text-sky-400/50 mt-0.5">
          Detention risk predictor, deficiency history, and pre-inspection checklists — Paris MoU /
          Tokyo MoU methodology
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Vessels Tracked',
            value: VESSELS_PSC.length,
            color: 'text-sky-300',
            icon: Ship,
          },
          {
            label: 'Detentions (12m)',
            value: totalDetentions,
            color: 'text-red-400',
            icon: AlertTriangle,
          },
          {
            label: 'Deficiencies (90d)',
            value: totalDeficiencies,
            color: 'text-amber-400',
            icon: FileText,
          },
          {
            label: 'High Risk Vessels',
            value: highRisk,
            color: 'text-orange-400',
            icon: TrendingUp,
          },
        ].map((s) => (
          <div key={s.label} className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={cn('w-3.5 h-3.5', s.color)} />
              <p className="text-[10px] text-sky-400/40 uppercase tracking-wider">{s.label}</p>
            </div>
            <p className={cn('text-xl font-bold font-display', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <p className="text-[10px] text-sky-400/40 uppercase tracking-wider px-1">
            Fleet PSC Risk
          </p>
          {VESSELS_PSC.map((v) => (
            <button
              key={v.vessel}
              onClick={() => setSelected(v)}
              className={cn(
                'w-full text-left bg-[#0a1628]/80 border rounded-xl p-4 transition-all',
                selected.vessel === v.vessel
                  ? 'border-sky-500/30 ring-1 ring-sky-500/15'
                  : v.detentionRiskLevel === 'high' || v.detentionRiskLevel === 'critical'
                    ? 'border-orange-500/20'
                    : 'border-sky-500/10 hover:border-sky-500/20',
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-bold text-sky-100">{v.vessel}</p>
                  <p className="text-[10px] text-sky-400/50">
                    {v.flag} · IMO {v.imo}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      'text-xl font-bold font-mono',
                      v.detentionRisk >= 70
                        ? 'text-red-400'
                        : v.detentionRisk >= 40
                          ? 'text-amber-400'
                          : 'text-emerald-400',
                    )}
                  >
                    {v.detentionRisk}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn('text-[9px]', riskColor[v.detentionRiskLevel])}
                  >
                    {v.detentionRiskLevel} risk
                  </Badge>
                </div>
              </div>
              <div className="h-1.5 bg-sky-500/10 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full',
                    v.detentionRisk >= 70
                      ? 'bg-red-400'
                      : v.detentionRisk >= 40
                        ? 'bg-amber-400'
                        : 'bg-emerald-400',
                  )}
                  style={{ width: `${v.detentionRisk}%` }}
                />
              </div>
              <div className="flex gap-3 mt-2 text-[9px] text-sky-400/40">
                <span>{v.deficiencies90d} defic. (90d)</span>
                <span>{v.detentions12m} detentions (12m)</span>
                <span className="ml-auto flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" />
                  {v.nextPortCall}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-3">
          <div className="flex gap-1">
            {(['risk', 'history', 'checklist'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-lg capitalize transition-colors',
                  tab === t
                    ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                    : 'text-sky-400/50 hover:text-sky-300',
                )}
              >
                {t === 'risk'
                  ? 'Risk Profile'
                  : t === 'history'
                    ? 'Inspection History'
                    : 'Pre-Inspection Checklist'}
              </button>
            ))}
          </div>

          {tab === 'risk' && (
            <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-sky-100">{selected.vessel}</p>
                  <p className="text-[10px] text-sky-400/50">
                    {selected.flag} · IMO {selected.imo}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn('text-[9px]', riskColor[selected.detentionRiskLevel])}
                >
                  {selected.detentionRiskLevel} detention risk
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'Detention Risk Score', value: `${selected.detentionRisk}/100` },
                  { label: 'Inspections (90d)', value: selected.inspections90d },
                  { label: 'Deficiencies (90d)', value: selected.deficiencies90d },
                  { label: 'Detentions (12m)', value: selected.detentions12m },
                  { label: 'Last Inspection', value: selected.lastInspection },
                  { label: 'Next Call Regime', value: selected.nextPortRegime },
                ].map((f) => (
                  <div
                    key={f.label}
                    className="bg-sky-500/5 rounded-lg p-3 border border-sky-500/10"
                  >
                    <p className="text-[9px] text-sky-400/40 uppercase tracking-wider">{f.label}</p>
                    <p className="text-xs font-mono text-sky-200 mt-0.5">{f.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-sky-500/5 rounded-lg p-3 border border-sky-500/10">
                <p className="text-[9px] text-sky-400/40 uppercase tracking-wider mb-1">
                  Next Port of Call
                </p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  <p className="text-sm font-semibold text-sky-200">{selected.nextPortCall}</p>
                  <Badge variant="outline" className="text-[9px] text-sky-400/50 border-sky-500/15">
                    {selected.nextPortRegime}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-2">
              {selected.history.map((rec) => (
                <div
                  key={rec.id}
                  className={cn(
                    'bg-[#0a1628]/80 border rounded-xl p-4',
                    rec.detained
                      ? 'border-red-500/20'
                      : rec.result === 'deficiency'
                        ? 'border-amber-500/20'
                        : 'border-sky-500/10',
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs font-semibold text-sky-200">{rec.port}</p>
                      <p className="text-[10px] text-sky-400/40">
                        {rec.regime} · {rec.date} · {rec.inspector}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn('text-[9px]', resultColor[rec.result])}
                      >
                        {rec.result}
                      </Badge>
                      {rec.detained && (
                        <Badge
                          variant="outline"
                          className="text-[9px] text-red-400 bg-red-500/10 border-red-500/20"
                        >
                          {rec.detentionDays}d detained
                        </Badge>
                      )}
                    </div>
                  </div>
                  {rec.deficiencies > 0 && (
                    <div>
                      <p className="text-[9px] text-sky-400/40 mb-1">
                        {rec.deficiencies} deficiency items:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {rec.deficiencyCategories.map((cat) => (
                          <span
                            key={cat}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === 'checklist' && (
            <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-sky-500/10">
                <p className="text-xs font-semibold text-sky-200">
                  Pre-Inspection Checklist — {selected.nextPortCall} ({selected.nextPortRegime})
                </p>
                <p className="text-[10px] text-sky-400/40">
                  Action items for vessel {selected.vessel} before next PSC inspection
                </p>
              </div>
              <div className="divide-y divide-sky-500/5">
                {selected.checklistItems.map((item, i) => {
                  const Icon = checklistStatusIcon[item.status];
                  return (
                    <div
                      key={i}
                      className={cn(
                        'px-4 py-3 flex items-start gap-3',
                        item.status === 'fail'
                          ? 'bg-red-500/3'
                          : item.status === 'action_required'
                            ? 'bg-amber-500/3'
                            : '',
                      )}
                    >
                      <Icon
                        className={cn('w-4 h-4 shrink-0 mt-0.5', checklistStatusColor[item.status])}
                      />
                      <div className="flex-1">
                        <p className="text-xs text-sky-200">{item.category}</p>
                        {item.note && (
                          <p className="text-[10px] text-sky-400/50 mt-0.5">{item.note}</p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[9px] shrink-0',
                          item.status === 'pass'
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            : item.status === 'fail'
                              ? 'text-red-400 bg-red-500/10 border-red-500/20'
                              : 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                        )}
                      >
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
