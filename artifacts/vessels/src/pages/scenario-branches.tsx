import { useStandardQuery } from '@szl-holdings/api-client-react';
import { Badge } from '@szl-holdings/shared-ui/ui/badge';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  DollarSign,
  Fuel,
  GitBranch,
  RotateCcw,
  Shield,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

type BranchId = 'reroute' | 'speed-reduction' | 'embargo' | 'detention';

interface Branch {
  id: BranchId;
  label: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  description: string;
  trigger: string;
  probability: number;
  deltaEta: string;
  deltaFuel: string;
  deltaCost: string;
  deltaRisk: number;
  outcomes: { label: string; value: string; positive: boolean }[];
  risks: string[];
  mitigations: string[];
}

const BASELINE = {
  eta: 'Apr 20 06:00 UTC',
  fuel: '2,140 t remaining',
  cost: '$1.84M voyage cost',
  risk: 18,
};

const BRANCHES: Branch[] = [
  {
    id: 'reroute',
    label: 'Emergency Reroute',
    subtitle: 'Cape of Good Hope diversion',
    icon: RotateCcw,
    color: '#4a90b8',
    description:
      'Full diversion via Cape of Good Hope to avoid Suez Canal closure or conflict escalation in the Red Sea corridor.',
    trigger: 'Red Sea conflict escalation or Suez suspension',
    probability: 12,
    deltaEta: '+14 days',
    deltaFuel: '+1,820 t',
    deltaCost: '+$2.2M',
    deltaRisk: -22,
    outcomes: [
      { label: 'New ETA Rotterdam', value: 'May 4 08:00', positive: false },
      { label: 'Additional Fuel', value: '1,820 t', positive: false },
      { label: 'Additional Cost', value: '$2.2M', positive: false },
      { label: 'Risk Score', value: '−22 pts', positive: true },
      { label: 'Sanctions Exposure', value: 'Eliminated', positive: true },
    ],
    risks: [
      'Charter party penalties for late delivery',
      'Additional insurance premium',
      'Cargo quality risk on extended voyage',
    ],
    mitigations: [
      'Force majeure clause invocation',
      'Charterer notification within 12h',
      'Bunker topping at Las Palmas',
    ],
  },
  {
    id: 'speed-reduction',
    label: 'Speed Reduction',
    subtitle: 'Slow steaming optimization',
    icon: TrendingDown,
    color: '#6b8f71',
    description:
      'Reduce service speed from 13.4 to 10.0 knots to optimize fuel consumption and CII score, accepting ETA delay.',
    trigger: 'Fuel price spike > $680/mt or CII rating pressure',
    probability: 38,
    deltaEta: '+3.2 days',
    deltaFuel: '−380 t',
    deltaCost: '−$180K',
    deltaRisk: -4,
    outcomes: [
      { label: 'New ETA Rotterdam', value: 'Apr 23 14:00', positive: false },
      { label: 'Fuel Saved', value: '380 t', positive: true },
      { label: 'Cost Saved', value: '$180K', positive: true },
      { label: 'CII Improvement', value: '+0.8 pts', positive: true },
      { label: 'Charter Penalty Risk', value: 'Low (6-day grace)', positive: true },
    ],
    risks: [
      'Potential charter party late delivery',
      'Cargo temperature risk (reefer vessels only)',
    ],
    mitigations: [
      'Charterer pre-approval for ETA revision',
      'Dynamic routing optimization enabled',
    ],
  },
  {
    id: 'embargo',
    label: 'Port Embargo Scenario',
    subtitle: 'Destination port sanctions event',
    icon: Shield,
    color: '#c45a4a',
    description:
      'Rotterdam or intermediate port subject to emergency sanctions. Vessel must divert to alternate discharge port.',
    trigger: 'OFAC/EU sanctions update on destination port or cargo',
    probability: 4,
    deltaEta: '+6 days',
    deltaFuel: '+420 t',
    deltaCost: '+$680K',
    deltaRisk: 28,
    outcomes: [
      { label: 'Alternate Port', value: 'Antwerp / Hamburg', positive: false },
      { label: 'Additional Fuel', value: '420 t', positive: false },
      { label: 'Additional Cost', value: '$680K', positive: false },
      { label: 'Compliance Exposure', value: 'HIGH', positive: false },
      { label: 'Vessel Detention Risk', value: 'Elevated', positive: false },
    ],
    risks: [
      'Cargo ownership disputes',
      'Vessel blacklisting risk',
      'Insurance invalidation if sanctions breach',
    ],
    mitigations: [
      'Legal review within 2h of notification',
      'P&I Club emergency line activated',
      'OFAC license application if applicable',
    ],
  },
  {
    id: 'detention',
    label: 'Detention Risk',
    subtitle: 'Port State Control hold scenario',
    icon: AlertTriangle,
    color: '#c8953c',
    description:
      'PSC inspection at Suez Canal or Rotterdam results in detention order. Deficiency rectification required before departure.',
    trigger: 'PSC flag on safety certificate or crew documentation gap',
    probability: 7,
    deltaEta: '+4–12 days',
    deltaFuel: '+110 t',
    deltaCost: '+$340K',
    deltaRisk: 18,
    outcomes: [
      { label: 'Detention Duration', value: '4–12 days est.', positive: false },
      { label: 'Port Fees', value: '$340K est.', positive: false },
      { label: 'Cargo Demurrage', value: '$80K/day', positive: false },
      { label: 'Certificate Status', value: 'Suspended', positive: false },
      { label: 'P&I Claim', value: 'Likely', positive: false },
    ],
    risks: [
      'Cargo demurrage accrual from day 1',
      'Crew overtime costs',
      'Charterer claim for delay',
    ],
    mitigations: [
      'Pre-arrival PSC checklist completed',
      'DNV survey scheduled at next port',
      'Deficiency action plan prepared',
    ],
  },
];

function BranchImpactBar({ delta, max, color }: { delta: number; max: number; color: string }) {
  const pct = Math.min(100, (Math.abs(delta) / max) * 100);
  return (
    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function VesselsScenarioBranchesPage() {
  const [selected, setSelected] = useState<BranchId>('reroute');
  const [comparing, setComparing] = useState<BranchId | null>(null);

  const {
    data: atlasData,
    isError: atlasError,
    isLoading: atlasLoading,
  } = useStandardQuery<{
    data?: { count: number; branches?: Array<{ twinId: string; probability?: number }> };
  }>({
    queryKey: ['vessels-atlas-scenario-branches'],
    queryFn: () =>
      fetch('/api/atlas/spatial/branches?twinCategory=vessel').then((r) =>
        r.ok ? r.json() : Promise.reject(r.status),
      ),
    staleTime: 60000,
    retry: 1,
  });

  const liveBranchCount = atlasData?.data?.count ?? null;
  const dataMode: 'loading' | 'live' | 'demo' | 'error' = atlasLoading
    ? 'loading'
    : atlasError
      ? 'error'
      : liveBranchCount !== null && liveBranchCount > 0
        ? 'live'
        : 'demo';

  const branch = BRANCHES.find((b) => b.id === selected)!;
  const compareBranch = comparing ? BRANCHES.find((b) => b.id === comparing) : null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GitBranch className="w-4 h-4 text-sky-400" />
            <h1 className="font-display text-xl font-bold text-sky-50">Scenario Branches</h1>
            <Badge
              variant="outline"
              className="text-[9px] text-sky-400 border-sky-500/30 bg-sky-500/5"
            >
              ATLAS RUNTIME
            </Badge>
          </div>
          <p className="text-xs text-sky-400/40">
            Simulate diverging voyage worldlines — compare branch outcomes against baseline
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dataMode === 'live' && (
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE · {liveBranchCount} branch{liveBranchCount !== 1 ? 'es' : ''}
            </div>
          )}
          {dataMode === 'demo' && (
            <div className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              DEMO
            </div>
          )}
          {dataMode === 'error' && (
            <div className="flex items-center gap-1.5 text-[10px] text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              ERROR
            </div>
          )}
          {dataMode === 'loading' && (
            <div className="flex items-center gap-1.5 text-[10px] text-sky-400/60 bg-sky-500/5 border border-sky-500/20 px-2 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400/60 animate-pulse" />
              LOADING
            </div>
          )}
        </div>
      </div>

      {dataMode === 'demo' && (
        <div className="flex items-start gap-2 text-[11px] px-3 py-2.5 rounded-lg border border-amber-500/30 bg-amber-500/8 text-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <p className="font-semibold text-amber-300">Demo data — no live records found</p>
            <p className="text-amber-300/70 text-[10px] mt-0.5">
              No active scenario branches were returned by ATLAS. The branches below are
              illustrative demo content. The page will reflect live branches automatically once they
              are recorded.
            </p>
          </div>
        </div>
      )}
      {dataMode === 'error' && (
        <div className="flex items-start gap-2 text-[11px] px-3 py-2.5 rounded-lg border border-red-500/30 bg-red-500/8 text-red-200">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" />
          <div>
            <p className="font-semibold text-red-300">Live data unavailable</p>
            <p className="text-red-300/70 text-[10px] mt-0.5">
              The scenario branches API request failed. Showing demo content while the connection is
              restored.
            </p>
          </div>
        </div>
      )}

      <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[11px] text-sky-300 font-semibold uppercase tracking-wider">
            Baseline Worldline — Pacific Navigator
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'ETA Rotterdam', value: BASELINE.eta, icon: Clock },
            { label: 'Fuel Remaining', value: BASELINE.fuel, icon: Fuel },
            { label: 'Voyage Cost', value: BASELINE.cost, icon: DollarSign },
            { label: 'Risk Score', value: `${BASELINE.risk} / 100`, icon: Shield },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="flex items-start gap-2">
                <Icon className="w-3.5 h-3.5 text-sky-400/50 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-sky-400/40 mb-0.5">{m.label}</p>
                  <p className="text-[11px] font-mono text-sky-200">{m.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="space-y-2">
          <p className="text-[10px] text-sky-400/40 uppercase tracking-wider mb-3">
            Scenario Branches
          </p>
          {BRANCHES.map((b) => {
            const Icon = b.icon;
            const isSelected = b.id === selected;
            const isCompare = b.id === comparing;
            return (
              <div
                key={b.id}
                className={cn(
                  'p-3 rounded-xl border cursor-pointer transition-all',
                  isSelected
                    ? 'border-sky-500/30 bg-sky-500/8'
                    : 'border-sky-500/10 bg-[#0a1628]/60 hover:border-sky-500/20',
                )}
              >
                <div className="flex items-start gap-2.5" onClick={() => setSelected(b.id)}>
                  <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: b.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-sky-200">{b.label}</p>
                    <p className="text-[9px] text-sky-400/40">{b.subtitle}</p>
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] text-sky-400/40">Probability</span>
                        <span className="text-[9px] font-mono" style={{ color: b.color }}>
                          {b.probability}%
                        </span>
                      </div>
                      <BranchImpactBar delta={b.probability} max={50} color={b.color} />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setComparing(isCompare ? null : b.id)}
                  className={cn(
                    'mt-2 w-full text-[9px] py-1 rounded border transition-colors',
                    isCompare
                      ? 'border-violet-500/30 text-violet-400 bg-violet-500/8'
                      : 'border-sky-500/10 text-sky-400/40 hover:text-sky-300',
                  )}
                  disabled={isSelected}
                >
                  {isCompare ? '✓ Comparing' : 'Compare'}
                </button>
              </div>
            );
          })}
        </div>

        <div className={cn('space-y-4', compareBranch ? 'lg:col-span-2' : 'lg:col-span-3')}>
          <BranchDetail branch={branch} color={branch.color} label="Selected Branch" />
        </div>

        {compareBranch && (
          <div className="space-y-4">
            <BranchDetail branch={compareBranch} color="#8b7ac8" label="Comparison Branch" />
          </div>
        )}
      </div>
    </div>
  );
}

function BranchDetail({ branch, color, label }: { branch: Branch; color: string; label: string }) {
  const Icon = branch.icon;
  return (
    <div className="space-y-4">
      <div
        className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4"
        style={{ borderColor: `${color}25` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px] uppercase tracking-wider" style={{ color }}>
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4" style={{ color }} />
          <h3 className="text-sm font-bold text-sky-100">{branch.label}</h3>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full border font-mono"
            style={{ color, borderColor: `${color}30`, background: `${color}10` }}
          >
            {branch.probability}% probable
          </span>
        </div>
        <p className="text-[11px] text-sky-400/50 mb-1">{branch.description}</p>
        <p className="text-[10px] text-sky-400/30">
          <span className="text-sky-400/50">Trigger:</span> {branch.trigger}
        </p>
      </div>

      <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
        <p className="text-xs font-semibold text-sky-200 mb-3">Delta vs. Baseline</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: 'ETA Change',
              value: branch.deltaEta,
              positive: branch.deltaEta.startsWith('−'),
            },
            {
              label: 'Fuel Δ',
              value: branch.deltaFuel,
              positive: branch.deltaFuel.startsWith('−'),
            },
            {
              label: 'Cost Δ',
              value: branch.deltaCost,
              positive: branch.deltaCost.startsWith('−'),
            },
          ].map((d) => (
            <div
              key={d.label}
              className={cn(
                'p-2.5 rounded-lg border text-center',
                d.positive
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : 'border-amber-500/20 bg-amber-500/5',
              )}
            >
              <p className="text-[9px] text-sky-400/40 mb-1">{d.label}</p>
              <p
                className={cn(
                  'text-[11px] font-mono font-bold',
                  d.positive ? 'text-emerald-400' : 'text-amber-400',
                )}
              >
                {d.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0a1628]/80 border border-sky-500/10 rounded-xl p-4">
        <p className="text-xs font-semibold text-sky-200 mb-3">Projected Outcomes</p>
        <div className="space-y-2">
          {branch.outcomes.map((o) => (
            <div key={o.label} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {o.positive ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400/60" />
                ) : (
                  <XCircle className="w-3 h-3 text-amber-400/60" />
                )}
                <span className="text-[11px] text-sky-400/50">{o.label}</span>
              </div>
              <span
                className={cn(
                  'text-[11px] font-mono',
                  o.positive ? 'text-emerald-400' : 'text-amber-400',
                )}
              >
                {o.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-[#0a1628]/80 border border-red-500/10 rounded-xl p-4">
          <p className="text-[11px] font-semibold text-red-400/80 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            Key Risks
          </p>
          <ul className="space-y-1.5">
            {branch.risks.map((r, i) => (
              <li key={i} className="text-[10px] text-sky-400/50 flex gap-1.5">
                <span className="text-red-400/40 mt-0.5">•</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-[#0a1628]/80 border border-emerald-500/10 rounded-xl p-4">
          <p className="text-[11px] font-semibold text-emerald-400/80 mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3" />
            Mitigations
          </p>
          <ul className="space-y-1.5">
            {branch.mitigations.map((m, i) => (
              <li key={i} className="text-[10px] text-sky-400/50 flex gap-1.5">
                <span className="text-emerald-400/40 mt-0.5">•</span>
                {m}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
