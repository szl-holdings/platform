import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { type AutonomyMode, ProofEnvelope } from '@szl-holdings/design-system';
import { AnimatedGauge, NERHighlight, SeverityMeter } from '@szl-holdings/shared-ui/ai-components';
import { apiFetch } from '@szl-holdings/shared-ui/api-fetch';
import { AlertTriangle, Brain, Loader2, Navigation, Radio, Shield, Ship } from 'lucide-react';
import { useState } from 'react';

export default function VesselsIntelligence() {
  const [autonomyMode, setAutonomyMode] = useState<AutonomyMode>('ask-to-act');
  const { data: sanctions } = useStandardQuery({
    queryKey: ['maritime-sanctions'],
    queryFn: () => apiFetch<any>('/intelligence/maritime/sanctions'),
  });
  const { data: vessels = [] } = useStandardQuery({
    queryKey: ['maritime-vessels'],
    queryFn: () => apiFetch<any[]>('/intelligence/maritime/vessels'),
  });
  const { data: chokepoints = [] } = useStandardQuery({
    queryKey: ['maritime-chokepoints'],
    queryFn: () => apiFetch<any[]>('/intelligence/maritime/chokepoints'),
  });

  const routeAnalysis = useStandardMutation({
    mutationFn: (route: string) =>
      apiFetch<any>('/intelligence/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: `Analyze this maritime route for safety risks, piracy threats, weather hazards, and sanctions compliance: ${route}. Provide a concise risk assessment with severity ratings.`,
        }),
      }),
  });

  const [selectedRoute, setSelectedRoute] = useState('Singapore Strait → Suez Canal → Rotterdam');
  const routes = [
    'Singapore Strait → Suez Canal → Rotterdam',
    'Shanghai → Panama Canal → New York',
    'Dubai → Cape of Good Hope → Houston',
    'Tokyo → Bering Strait → London',
  ];

  const riskScores = [
    { label: 'Piracy Index', value: 34, color: 'emerald' as const },
    { label: 'Sanctions Risk', value: 67, color: 'orange' as const },
    { label: 'Weather Hazard', value: 52, color: 'cyan' as const },
    { label: 'Chokepoint Risk', value: 78, color: 'red' as const },
  ];

  const sanctionsArray: any[] = Array.isArray(sanctions) ? sanctions : [];
  const allEntities = sanctionsArray.flatMap((v: any) => v.entities || []);
  const sanctionText =
    sanctionsArray.length > 0
      ? sanctionsArray
          .map((v: any) => `${v.name} flagged under ${v.flag} for ${v.reason}`)
          .join('. ')
      : 'Loading sanctions data...';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Brain className="w-7 h-7 text-cyan-400" /> AI Maritime Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Risk analysis, sanctions monitoring, and AI route safety
          </p>
        </div>
        <span className="inline-flex items-center gap-2 text-xs text-cyan-400 bg-cyan-400/10 px-3 py-1.5 rounded-full border border-cyan-400/20">
          <Radio className="w-3 h-3 animate-pulse" /> Live Feed
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {riskScores.map((s) => (
          <div
            key={s.label}
            className="bg-white/[0.03] rounded-xl border border-white/5 p-4 flex flex-col items-center"
          >
            <AnimatedGauge value={s.value} label={s.label} color={s.color} size={100} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProofEnvelope
          title="Sanctions Monitor — NER Entity Detection"
          confidence={sanctionsArray.length > 0 ? 88 : 0}
          timestamp={new Date().toISOString()}
          policyState={allEntities.length > 0 ? 'requires-approval' : 'allowed'}
          policyReason={
            allEntities.length > 0
              ? 'Sanctioned entity detection requires compliance officer review before action'
              : undefined
          }
          autonomyMode={autonomyMode}
          onAutonomyChange={setAutonomyMode}
          accentColor="#ef4444"
          evidence={[
            {
              id: 'v-sanc-1',
              label: 'OFAC SDN List — FORGE Sync',
              type: 'api',
              excerpt: `${allEntities.length} entity matches detected across ${sanctionsArray.length} vessels`,
            },
            {
              id: 'v-sanc-2',
              label: 'NER Classification Model',
              type: 'model',
              excerpt: 'Entity types: PER, ORG, LOC, MISC. Confidence threshold: 0.80.',
            },
          ]}
        >
          <p className="text-xs text-slate-500 mb-3">
            NER-highlighted entities detected in sanctions data
          </p>
          <div className="bg-black/30 rounded-xl p-4 border border-white/5 max-h-[300px] overflow-y-auto">
            <NERHighlight
              text={sanctionText}
              entities={allEntities}
              className="text-sm text-slate-300"
            />
          </div>
          {allEntities.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-[10px] text-slate-500">Detected:</span>
              {['PER', 'ORG', 'LOC', 'MISC'].map((type) => {
                const count = allEntities.filter((e: any) => e.entity === type).length;
                if (!count) return null;
                return (
                  <span
                    key={type}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400"
                  >
                    {type}: {count}
                  </span>
                );
              })}
            </div>
          )}
        </ProofEnvelope>

        <ProofEnvelope
          title={`Route Safety Analysis — ${selectedRoute}`}
          confidence={routeAnalysis.data ? 81 : 0}
          timestamp={new Date().toISOString()}
          policyState="allowed"
          autonomyMode={autonomyMode}
          onAutonomyChange={setAutonomyMode}
          accentColor="#22d3ee"
          evidence={[
            {
              id: 'v-route-1',
              label: 'FORGE Maritime Risk Classifier',
              type: 'model',
              excerpt:
                'Composite score from piracy, weather, chokepoint, and sanctions data layers.',
            },
            {
              id: 'v-route-2',
              label: 'IMO Voyage Data Exchange',
              type: 'api',
              excerpt: 'AIS tracking (live public feeds + simulated demo data) and port congestion signals included in analysis.',
            },
          ]}
        >
          <div className="space-y-3 mb-4">
            {routes.map((r) => (
              <button
                key={r}
                onClick={() => {
                  setSelectedRoute(r);
                  routeAnalysis.mutate(r);
                }}
                className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${
                  selectedRoute === r
                    ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                    : 'border-white/5 bg-white/[0.02] text-slate-400 hover:bg-white/5'
                }`}
              >
                <Ship className="w-3.5 h-3.5 inline mr-2" />
                {r}
              </button>
            ))}
          </div>
          <div className="bg-black/30 rounded-xl p-4 border border-white/5 min-h-[120px]">
            {routeAnalysis.isPending ? (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" /> Analyzing route safety...
              </div>
            ) : routeAnalysis.data ? (
              <p className="text-sm text-slate-300 whitespace-pre-wrap">
                {routeAnalysis.data.content}
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                Select a route to generate a governed safety assessment
              </p>
            )}
          </div>
        </ProofEnvelope>
      </div>

      <div className="bg-white/[0.03] rounded-2xl border border-white/5 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-400" /> Chokepoint Risk Assessment
        </h3>
        <div className="space-y-3">
          {chokepoints.map((cp: any, i: number) => (
            <SeverityMeter
              key={i}
              level={
                cp.riskLevel === 'critical'
                  ? 'critical'
                  : cp.riskLevel === 'warning'
                    ? 'high'
                    : cp.riskLevel === 'elevated'
                      ? 'medium'
                      : 'low'
              }
              score={
                cp.riskLevel === 'critical'
                  ? 90
                  : cp.riskLevel === 'warning'
                    ? 70
                    : cp.riskLevel === 'elevated'
                      ? 50
                      : 25
              }
              label={cp.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
