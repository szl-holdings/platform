import {
  type AutonomyMode,
  type EvidenceSource,
  type PolicyState,
  ProofEnvelope,
} from '@szl-holdings/design-system';
import { FileText, Globe, ShieldAlert, TrendingUp, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DataProvenance } from '@/lib/data-provenance';
import { getSentraPosture, type SentraPosture } from '@/lib/sentra-api';

const ACCENT = '#f5f5f5';

function fmtCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function ExposureBoard() {
  const [autonomyMode, setAutonomyMode] = useState<AutonomyMode>('recommend');
  const [posture, setPosture] = useState<SentraPosture | null>(null);
  const [provenance, setProvenance] = useState<'live' | 'degraded' | 'loading' | 'error'>(
    'loading',
  );

  useEffect(() => {
    let mounted = true;
    getSentraPosture()
      .then((p) => {
        if (!mounted) return;
        if (p) {
          setPosture(p);
          setProvenance(p.source === 'degraded' ? 'degraded' : 'live');
        } else {
          setProvenance('error');
        }
      })
      .catch(() => {
        if (mounted) setProvenance('error');
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (provenance === 'loading') {
    return (
      <div className="space-y-8 animate-fade-in">
        <header>
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-3xl font-display font-bold text-slate-100">Exposure Board</h1>
            <DataProvenance source="loading" />
          </div>
          <p className="text-slate-400 mt-1">Loading posture from /api/sentra/posture…</p>
        </header>
        <div className="sentra-panel p-8 h-64 animate-pulse bg-slate-800/30" />
      </div>
    );
  }

  if (provenance === 'error' || !posture) {
    return (
      <div className="space-y-8 animate-fade-in">
        <header>
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-3xl font-display font-bold text-slate-100">Exposure Board</h1>
            <DataProvenance source="error" />
          </div>
          <p className="text-slate-400 mt-1">
            Posture data is currently unavailable. The cockpit will refresh as soon as the
            posture endpoint reports.
          </p>
        </header>
        <div className="sentra-panel p-8 text-sm text-slate-400">
          <p className="font-mono text-[11px] text-slate-500 mb-2">
            GET /api/sentra/posture · no response
          </p>
          <p>
            No financial-exposure, CVE, or insurance-posture figures will be shown until the
            endpoint is reachable again. Check the api-server workflow logs.
          </p>
        </div>
      </div>
    );
  }

  const exposureEvidence: EvidenceSource[] = [
    {
      id: 'ev-exp-001',
      label: 'Threat Intel — Lateral Movement Probability Model',
      type: 'model',
      timestamp: new Date(Date.now() - 20 * 60_000).toISOString(),
      excerpt: `Posture model surfaces ${fmtCurrency(posture.financialExposure)} aggregate exposure across ${posture.totalAssets} assets · ${posture.openIncidents} open incidents · ${posture.criticalAlerts} critical alerts.`,
    },
    {
      id: 'ev-exp-002',
      label: `Insurance Policy Engine — ${posture.insurancePosture.policyId}`,
      type: 'api',
      timestamp: new Date(Date.now() - 45 * 60_000).toISOString(),
      excerpt: posture.insurancePosture.complianceReason,
    },
  ];

  const trendUp = posture.trendDeltaPct >= 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <header>
        <div className="flex items-center gap-3 flex-wrap mb-1">
          <h1 className="text-3xl font-display font-bold text-slate-100">Exposure Board</h1>
          <DataProvenance source={provenance} />
        </div>
        <p className="text-slate-400 mt-1">
          Financial impact modeling and vulnerability prioritization
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 sentra-panel p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-lg font-display font-bold text-slate-200">
                Financial Exposure at Risk
              </h2>
              <p className="text-sm text-slate-500">
                Aggregate potential loss based on current compromise
              </p>
            </div>
            <div className="text-5xl font-display font-bold text-[#f5f5f5]">
              {posture.financialExposureLabel}
            </div>
          </div>

          <div className="h-64 w-full flex items-end gap-2 px-4 mb-4">
            {posture.sevenDayTrend.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-[#f5f5f5]/20 border-t-2 border-[#f5f5f5] transition-all duration-1000"
                  style={{ height: `${v}%` }}
                />
                <span className="text-[10px] text-slate-600 font-mono">
                  T-{posture.sevenDayTrend.length - 1 - i}D
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 font-mono px-4 border-t border-slate-800 pt-4">
            <span>7 DAY EXPOSURE TREND</span>
            <span className="text-[#f5f5f5]">
              {trendUp ? '↑' : '↓'} {Math.abs(posture.trendDeltaPct)}% SINCE LAST INCIDENT
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="sentra-panel p-6">
            <h3 className="text-xs text-slate-500 uppercase font-mono mb-4 flex items-center gap-2">
              <ShieldAlert className="w-3 h-3" />
              Top CVE Findings
            </h3>
            <div className="space-y-4">
              {posture.topCveFindings.length === 0 ? (
                <p className="text-[10px] text-slate-500 font-mono">No active findings.</p>
              ) : (
                posture.topCveFindings.map((cve) => {
                  const sevColor =
                    cve.severity === 'critical'
                      ? '#f5f5f5'
                      : cve.severity === 'high'
                        ? '#c9b787'
                        : '#888';
                  return (
                    <div
                      key={cve.id}
                      className="p-3 rounded bg-slate-800/50 border border-slate-700"
                    >
                      <div className="flex justify-between mb-1">
                        <span className="text-[11px] font-bold text-slate-200 font-mono">
                          {cve.id}
                        </span>
                        <span className="text-[10px] font-bold" style={{ color: sevColor }}>
                          {cve.score.toFixed(1)} {cve.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">{cve.description}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="sentra-panel p-6">
            <h3 className="text-xs text-slate-500 uppercase font-mono mb-4 flex items-center gap-2">
              <Globe className="w-3 h-3" />
              Insurance Posture
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Carrier</span>
                <span className="text-slate-300 font-mono">{posture.insurancePosture.carrier}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Coverage Limit</span>
                <span className="text-slate-300 font-mono">
                  {fmtCurrency(posture.insurancePosture.coverageLimit)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Retention</span>
                <span className="text-slate-300 font-mono">
                  {fmtCurrency(posture.insurancePosture.retention)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-xs font-bold">
                <span className="text-slate-200">Policy Compliance</span>
                <span
                  className={
                    posture.insurancePosture.complianceStatus === 'pass'
                      ? 'text-emerald-400'
                      : 'text-[#c9b787]'
                  }
                >
                  {posture.insurancePosture.complianceStatus === 'pass' ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {posture.compromisedAssets > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-display font-bold text-slate-200">
            Recommended Cost Avoidance Actions
          </h2>

          <ProofEnvelope
            title={`Contain compromised assets — avoids ~${fmtCurrency(
              posture.compromisedAssets * 700_000,
            )} in projected loss`}
            accentColor={ACCENT}
            evidence={exposureEvidence}
            timestamp={exposureEvidence[0].timestamp}
            confidence={Math.min(
              99,
              60 + Math.min(40, posture.compromisedAssets * 10 + posture.criticalAlerts * 5),
            )}
            policyState={'requires-approval' as PolicyState}
            autonomyMode={autonomyMode}
            onAutonomyChange={setAutonomyMode}
          >
            <div className="sentra-panel p-6">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded bg-[#f5f5f5]/10 flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-[#f5f5f5]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100">
                      Isolate {posture.compromisedAssets} compromised asset
                      {posture.compromisedAssets === 1 ? '' : 's'}
                    </h3>
                    <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                      Containing {posture.compromisedAssets} of {posture.totalAssets} cyber-twin
                      asset{posture.totalAssets === 1 ? '' : 's'} reduces the modelled exposure
                      by {fmtCurrency(posture.compromisedAssets * 700_000)} per Doctrine V6
                      exposure model. {posture.criticalAlerts} critical alert
                      {posture.criticalAlerts === 1 ? ' is' : 's are'} currently open.
                    </p>
                    <div className="flex items-center gap-6 mt-4 text-[10px] font-mono text-slate-500">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-[#c9b787]" />
                        EST. AVOIDED LOSS: {fmtCurrency(posture.compromisedAssets * 700_000)}
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-3 h-3" />
                        SOURCE: /api/sentra/posture · {posture.source.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
                <button className="px-6 py-2 rounded bg-[#f5f5f5] hover:bg-[#f5f5f5] text-white text-sm font-bold transition-colors ml-4 shrink-0">
                  Approve & Deploy
                </button>
              </div>
            </div>
          </ProofEnvelope>
        </div>
      )}
    </div>
  );
}
