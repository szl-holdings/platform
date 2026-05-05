import {
  type AutonomyMode,
  type EvidenceSource,
  type PolicyState,
  ProofEnvelope,
} from '@szl-holdings/design-system';
import { cn } from '@szl-holdings/shared-ui/utils';
import { Activity, CheckCircle2, FileText, ShieldAlert } from 'lucide-react';
import { useCallback, useState } from 'react';
import { sentraTwin as fallbackTwin, type ControlDrift as ControlDriftType } from '@/data/sentra-twin';
import { listCyberTwinControlDrifts } from '@/lib/sentra-api';
import { SourceBadge, useApiQuery } from '@/lib/use-api-query';

const ACCENT = '#f5f5f5';
const DRIFT_EVIDENCE: EvidenceSource[] = [
  {
    id: 'ev-ctrl-001',
    label: 'NIST CSF Gap Scanner — OT Segment',
    type: 'api',
    timestamp: new Date(Date.now() - 8 * 60_000).toISOString(),
    excerpt:
      'Respond family control RC.RP-1 failed automated playbook execution on legacy SCADA (SCADA-01, SCADA-02). 2 critical servers without verified backup integrity.',
  },
  {
    id: 'ev-ctrl-002',
    label: 'Signal Mesh — Control Drift Correlator',
    type: 'model',
    timestamp: new Date(Date.now() - 15 * 60_000).toISOString(),
    excerpt:
      'Correlated 3 control drift signals across Respond and Recover CSF families. Confidence 92% that gaps were exploited in current incident INC-2026-0891.',
  },
];

export default function ControlDrift() {
  const [autonomyMode, setAutonomyMode] = useState<AutonomyMode>('recommend');

  const fetcher = useCallback(() => listCyberTwinControlDrifts(), []);
  const { data: controlDrifts, source } = useApiQuery<ControlDriftType[]>(fetcher, 'controlDrifts', fallbackTwin.controlDrifts);

  const familyNames = ['Identify', 'Protect', 'Detect', 'Respond', 'Recover'] as const;
  const families = familyNames.map((name) => {
    const matching = controlDrifts.filter((d) => d.family === name);
    const driftCount = matching.filter((d) => d.status === 'drift_detected').length;
    const totalCount = matching.length || (name === 'Identify' ? 12 : name === 'Protect' ? 45 : name === 'Detect' ? 18 : name === 'Respond' ? 8 : 14);
    return { name, status: driftCount > 0 ? 'drift_detected' : 'compliant', count: totalCount, drift: driftCount };
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-display font-bold text-slate-100">Control Drift</h1>
          <SourceBadge source={source} />
        </div>
        <p className="text-slate-400 mt-1">
          NIST CSF control family monitoring and drift detection
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {families.map((family) => (
          <div key={family.name} className="sentra-panel p-4 text-center">
            <div className="text-[10px] text-slate-500 uppercase font-mono mb-2">{family.name}</div>
            <div
              className={cn(
                'text-2xl font-display font-bold mb-2',
                family.drift > 0 ? 'text-[#f5f5f5]' : 'text-[#c9b787]',
              )}
            >
              {family.drift > 0 ? family.drift : family.count}
            </div>
            <div className="text-[9px] font-mono text-slate-600">
              {family.drift > 0 ? 'DRIFT DETECTED' : 'CONTROLS OK'}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-display font-bold text-slate-200">Active Drift Indicators</h2>

        <div className="space-y-4">
          {controlDrifts.map((drift, i) => (
            <div key={i} className="sentra-panel p-6">
              <div className="flex justify-between items-start">
                <div className="flex gap-4 flex-1">
                  <div className="w-12 h-12 rounded bg-[#f5f5f5]/10 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-6 h-6 text-[#f5f5f5]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                        {drift.family}
                      </span>
                      <h3 className="font-bold text-slate-100">{drift.control}</h3>
                    </div>
                    <p className="text-sm text-slate-400 mt-2 max-w-2xl">{drift.evidence}</p>

                    <div className="mt-6">
                      <h4 className="text-[10px] text-slate-500 uppercase font-mono font-bold mb-3">
                        Remediation Proof
                      </h4>
                      <ProofEnvelope
                        title="Automated Remediation — Deploy Respond Playbook"
                        accentColor={ACCENT}
                        evidence={DRIFT_EVIDENCE}
                        timestamp={DRIFT_EVIDENCE[0].timestamp}
                        confidence={92}
                        policyState={'requires-approval' as PolicyState}
                        autonomyMode={autonomyMode}
                        onAutonomyChange={setAutonomyMode}
                      >
                        <div className="p-4 bg-[#c9b787]/5 rounded border border-[#c9b787]/10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-4 h-4 text-[#c9b787]" />
                            <div>
                              <div className="text-xs font-bold text-slate-200">
                                Automated Remediation Available
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Deploy baseline Respond playbook to OT firewall cluster.
                              </p>
                            </div>
                          </div>
                          <button className="px-4 py-1.5 rounded bg-[#c9b787] hover:bg-[#c9b787] text-white text-[11px] font-bold transition-colors">
                            Apply Fix
                          </button>
                        </div>
                      </ProofEnvelope>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4 shrink-0">
                  <div className="text-[10px] text-slate-500 font-mono uppercase">Detected</div>
                  <div className="text-xs font-bold text-slate-300">4h ago</div>
                  <div className="mt-4 flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <FileText className="w-3 h-3" />
                      NIST PR.IP-1
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <Activity className="w-3 h-3" />
                      DRIFT MAGNITUDE: HIGH
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
