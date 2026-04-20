import { AmbientBar, type AmbientSignal } from '@szl-holdings/shared-ui/ambient-intelligence';
import {
  CorrelationFeed,
  type CrossDomainCorrelation,
} from '@szl-holdings/shared-ui/cross-domain-correlation';
import { type EnergyMetrics, EnergyPulse } from '@szl-holdings/shared-ui/energy-heartbeat';
import { cn } from '@szl-holdings/shared-ui/utils';
import { useMemo, useState } from 'react';

interface ThreatCostEstimate {
  id: string;
  incidentTitle: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  breachCostEstimate: number;
  regulatoryPenaltyRange: [number, number];
  regulatoryPenaltyProbability: number;
  insurancePremiumImpact: number;
  reputationDamageScore: number;
  remediationCost: number;
  downtimeCostPerHour: number;
  estimatedDowntimeHours: number;
  totalExposure: number;
  timestamp: number;
  category: string;
}

const DEMO_INCIDENTS: ThreatCostEstimate[] = [
  {
    id: 'tc-001',
    incidentTitle: 'Ransomware — Active Directory Compromise',
    severity: 'critical',
    breachCostEstimate: 4_200_000,
    regulatoryPenaltyRange: [500_000, 2_500_000],
    regulatoryPenaltyProbability: 0.72,
    insurancePremiumImpact: 180_000,
    reputationDamageScore: 87,
    remediationCost: 340_000,
    downtimeCostPerHour: 45_000,
    estimatedDowntimeHours: 72,
    totalExposure: 8_460_000,
    timestamp: Date.now() - 3600000,
    category: 'Ransomware',
  },
  {
    id: 'tc-002',
    incidentTitle: 'Data Exfiltration — Customer PII via API Misconfiguration',
    severity: 'high',
    breachCostEstimate: 1_800_000,
    regulatoryPenaltyRange: [200_000, 1_200_000],
    regulatoryPenaltyProbability: 0.58,
    insurancePremiumImpact: 95_000,
    reputationDamageScore: 64,
    remediationCost: 120_000,
    downtimeCostPerHour: 28_000,
    estimatedDowntimeHours: 8,
    totalExposure: 2_619_000,
    timestamp: Date.now() - 7200000,
    category: 'Data Breach',
  },
  {
    id: 'tc-003',
    incidentTitle: 'Phishing Campaign — Executive Credential Theft',
    severity: 'high',
    breachCostEstimate: 950_000,
    regulatoryPenaltyRange: [50_000, 400_000],
    regulatoryPenaltyProbability: 0.35,
    insurancePremiumImpact: 42_000,
    reputationDamageScore: 38,
    remediationCost: 65_000,
    downtimeCostPerHour: 15_000,
    estimatedDowntimeHours: 4,
    totalExposure: 1_197_000,
    timestamp: Date.now() - 14400000,
    category: 'Social Engineering',
  },
  {
    id: 'tc-004',
    incidentTitle: 'Supply Chain — Compromised NPM Package in CI/CD',
    severity: 'medium',
    breachCostEstimate: 620_000,
    regulatoryPenaltyRange: [0, 150_000],
    regulatoryPenaltyProbability: 0.15,
    insurancePremiumImpact: 28_000,
    reputationDamageScore: 22,
    remediationCost: 85_000,
    downtimeCostPerHour: 12_000,
    estimatedDowntimeHours: 16,
    totalExposure: 925_000,
    timestamp: Date.now() - 28800000,
    category: 'Supply Chain',
  },
];

const SEV_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#3b82f6',
};

function formatDollars(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function ThreatCostTranslator() {
  const [selected, setSelected] = useState<string | null>(null);

  const totalExposure = useMemo(
    () => DEMO_INCIDENTS.reduce((sum, i) => sum + i.totalExposure, 0),
    [],
  );
  const avgReputationDamage = useMemo(
    () =>
      Math.round(
        DEMO_INCIDENTS.reduce((s, i) => s + i.reputationDamageScore, 0) / DEMO_INCIDENTS.length,
      ),
    [],
  );

  const selectedIncident = DEMO_INCIDENTS.find((i) => i.id === selected);

  const ambientSignals: AmbientSignal[] = [
    {
      id: 'sig-1',
      domain: 'aegis',
      title: 'APT-41 Activity Spike',
      summary: 'Threat actor APT-41 activity spike detected across 3 subsidiaries',
      severity: 'high',
      score: 0.92,
      timestamp: Date.now(),
    },
    {
      id: 'sig-2',
      domain: 'lyte',
      title: 'Self-Healing Active',
      summary: '94% of P1 incidents resolved without human intervention',
      severity: 'info',
      score: 0.38,
      timestamp: Date.now(),
    },
  ];
  const energyMetrics: EnergyMetrics = {
    apiCallsPerMinute: 127,
    wsMessagesPerMinute: 340,
    chartRendersPerMinute: 24,
    dataRefreshesPerMinute: 18,
    activeSubscriptions: 42,
    deferredUpdates: 3,
    totalBudget: 120,
    usedBudget: 78,
  };
  const correlations: CrossDomainCorrelation[] = [
    {
      id: 'cor-1',
      title: 'Cyber Resilience ↔ AIOps Maturity',
      description: 'Subsidiaries with higher AIOps adoption resolve incidents 3x faster',
      domains: ['aegis', 'lyte'],
      confidence: 0.91,
      timestamp: Date.now(),
      signals: [
        { domain: 'aegis', event: 'MTTR decreased 42%', severity: 'medium' },
        { domain: 'lyte', event: 'Self-healing rate 94%', severity: 'info' },
      ],
      impact: 'high',
    },
  ];

  return (
    <div className="min-h-screen bg-[#060810] text-white p-6 space-y-6">
      <AmbientBar signals={ambientSignals} appDomain="aegis" accentColor="#ef4444" compact />
      <div>
        <h1 className="text-2xl font-bold text-white/90">Threat Cost Translator</h1>
        <p className="text-sm text-white/40 mt-1">
          Every security incident translated into financial impact — real-time breach cost modeling
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: 'Total Financial Exposure',
            value: formatDollars(totalExposure),
            color: '#ef4444',
          },
          { label: 'Active Incidents', value: DEMO_INCIDENTS.length.toString(), color: '#f59e0b' },
          { label: 'Avg Reputation Damage', value: `${avgReputationDamage}/100`, color: '#8b5cf6' },
          {
            label: 'Insurance Premium Impact',
            value: formatDollars(DEMO_INCIDENTS.reduce((s, i) => s + i.insurancePremiumImpact, 0)),
            color: '#3b82f6',
          },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
            <div className="text-[10px] uppercase tracking-wider text-white/30">{kpi.label}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-7 space-y-3">
          <h2 className="text-sm font-semibold text-white/60">Active Incident Financial Impact</h2>
          {DEMO_INCIDENTS.map((incident) => (
            <div
              key={incident.id}
              className={cn(
                'rounded-xl border p-4 cursor-pointer transition-all',
                selected === incident.id
                  ? 'bg-white/[0.06] border-white/15'
                  : 'bg-white/[0.02] border-white/5 hover:border-white/10',
              )}
              onClick={() => setSelected(selected === incident.id ? null : incident.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className="w-2 h-2 rounded-full mt-1.5"
                    style={{ background: SEV_COLORS[incident.severity] }}
                  />
                  <div>
                    <h3 className="text-sm font-medium text-white/85">{incident.incidentTitle}</h3>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-white/40">
                      <span>{incident.category}</span>
                      <span>•</span>
                      <span className="uppercase" style={{ color: SEV_COLORS[incident.severity] }}>
                        {incident.severity}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-red-400">
                    {formatDollars(incident.totalExposure)}
                  </div>
                  <div className="text-[10px] text-white/30">Total Exposure</div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-3">
                {[
                  { label: 'Breach Cost', value: formatDollars(incident.breachCostEstimate) },
                  { label: 'Remediation', value: formatDollars(incident.remediationCost) },
                  {
                    label: 'Downtime',
                    value: `${incident.estimatedDowntimeHours}h × ${formatDollars(incident.downtimeCostPerHour)}/h`,
                  },
                  { label: 'Reputation', value: `${incident.reputationDamageScore}/100` },
                ].map((m) => (
                  <div key={m.label} className="bg-white/5 rounded-lg px-2 py-1.5">
                    <div className="text-[9px] text-white/30 uppercase">{m.label}</div>
                    <div className="text-xs font-medium text-white/70 mt-0.5">{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="col-span-5 space-y-4">
          {selectedIncident ? (
            <>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <h3 className="text-sm font-semibold text-white/70 mb-3">Financial Breakdown</h3>
                {[
                  {
                    label: 'Direct Breach Cost',
                    value: selectedIncident.breachCostEstimate,
                    pct: selectedIncident.breachCostEstimate / selectedIncident.totalExposure,
                  },
                  {
                    label: 'Downtime Cost',
                    value:
                      selectedIncident.downtimeCostPerHour *
                      selectedIncident.estimatedDowntimeHours,
                    pct:
                      (selectedIncident.downtimeCostPerHour *
                        selectedIncident.estimatedDowntimeHours) /
                      selectedIncident.totalExposure,
                  },
                  {
                    label: 'Remediation Cost',
                    value: selectedIncident.remediationCost,
                    pct: selectedIncident.remediationCost / selectedIncident.totalExposure,
                  },
                  {
                    label: 'Insurance Premium Impact',
                    value: selectedIncident.insurancePremiumImpact,
                    pct: selectedIncident.insurancePremiumImpact / selectedIncident.totalExposure,
                  },
                ].map((item) => (
                  <div key={item.label} className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/50">{item.label}</span>
                      <span className="text-white/70 font-mono">{formatDollars(item.value)}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-500/60"
                        style={{ width: `${item.pct * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <h3 className="text-sm font-semibold text-white/70 mb-3">
                  Regulatory Penalty Assessment
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Penalty Range</span>
                    <span className="text-white/70 font-mono">
                      {formatDollars(selectedIncident.regulatoryPenaltyRange[0])} –{' '}
                      {formatDollars(selectedIncident.regulatoryPenaltyRange[1])}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Probability of Penalty</span>
                    <span className="text-amber-400 font-mono">
                      {Math.round(selectedIncident.regulatoryPenaltyProbability * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">Expected Penalty</span>
                    <span className="text-red-400 font-mono font-semibold">
                      {formatDollars(
                        ((selectedIncident.regulatoryPenaltyRange[0] +
                          selectedIncident.regulatoryPenaltyRange[1]) /
                          2) *
                          selectedIncident.regulatoryPenaltyProbability,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-8 text-center">
              <p className="text-sm text-white/30">
                Select an incident to view detailed financial breakdown
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/5">
        <div className="md:col-span-2">
          <CorrelationFeed
            correlations={correlations}
            currentDomain="aegis"
            accentColor="#ef4444"
          />
        </div>
        <div className="flex items-start justify-center">
          <EnergyPulse
            metrics={energyMetrics}
            utilization={energyMetrics.usedBudget / energyMetrics.totalBudget}
            accentColor="#ef4444"
          />
        </div>
      </div>
    </div>
  );
}
