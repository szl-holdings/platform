import { m } from 'framer-motion';
import { BarChart2, Layers } from 'lucide-react';
import { useMemo } from 'react';
import type { EngineState } from '@/hooks/useDecisionEngine';
import type { LiveMetrics, LiveRecommendation } from '@/hooks/useLiveTheaterData';

export function ContextStage({ engine }: { engine: EngineState }) {
  const correlation = useMemo(() => {
    const corrEvt = engine.busHistory.find((e) => e.type === 'cross_domain_correlation');
    if (!corrEvt) return null;
    return {
      confidence: Number(corrEvt.payload.confidence ?? 0),
      pattern: String(corrEvt.payload.pattern ?? ''),
      crossDomainLinks: (corrEvt.payload.crossDomainLinks as string[]) ?? [],
      linkedSignalIds: (corrEvt.payload.linkedSignals as string[]) ?? [],
      correlationId: corrEvt.correlationId ?? corrEvt.id,
      totalBusEvents: engine.busHistory.length,
      signalCount: engine.busHistory.filter((e) => e.type === 'domain_signal').length,
    };
  }, [engine.busHistory]);

  if (!correlation)
    return <p className="text-sm text-muted-foreground">Awaiting correlation data...</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        The platform correlates the Aegis and Vessels signals, identifying a coordinated threat
        pattern across domains.
      </p>
      <div className="rounded-xl border border-border/40 bg-card/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground">Cross-Domain Correlation</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Confidence:</span>
            <span className="text-lg font-bold font-display text-emerald-400">
              {(correlation.confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        <p className="text-sm font-semibold text-amber-400 mb-4">{correlation.pattern}</p>
        <div className="space-y-2">
          {correlation.crossDomainLinks.map((link, i) => (
            <m.div
              key={i}
              className="flex items-start gap-2.5"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.07 }}
            >
              <div className="w-5 h-5 rounded-full bg-purple-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[9px] font-bold text-purple-400">{i + 1}</span>
              </div>
              <p className="text-[12px] text-foreground">{link}</p>
            </m.div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-border/30 bg-muted/10 px-4 py-3 flex items-center gap-3">
        <Layers className="w-4 h-4 text-purple-400 flex-shrink-0" />
        <p className="text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">Event Fabric:</span> Bus history:{' '}
          {correlation.totalBusEvents} events ({correlation.signalCount} signals) · Correlation
          engine matched {correlation.crossDomainLinks.length} cross-domain evidence links across{' '}
          {correlation.linkedSignalIds.length} signals. Correlation ID:{' '}
          <span className="font-mono text-[10px]">{correlation.correlationId}</span>
        </p>
      </div>
    </div>
  );
}

export function LiveContextStage({
  metrics,
  recommendations,
}: {
  metrics: LiveMetrics | null;
  recommendations: LiveRecommendation[];
}) {
  if (!metrics) return <p className="text-sm text-muted-foreground">Loading live context…</p>;

  const domainMetrics = [
    {
      label: 'Real Estate Distress Events',
      value: metrics.beacon.total_distress_properties,
      max: Math.max(metrics.beacon.total_distress_properties, 100),
      color: '#10b981',
    },
    {
      label: 'Security Vulnerabilities',
      value: metrics.firestorm.open_vulnerabilities,
      max: Math.max(metrics.firestorm.open_vulnerabilities, 50),
      color: '#ef4444',
    },
    {
      label: 'AI Recommendations Generated',
      value: metrics.continuum.total_recommendations,
      max: Math.max(metrics.continuum.total_recommendations, 1000),
      color: '#ec4899',
    },
    {
      label: 'Platform Audit Events (30d)',
      value: metrics.platform.audit_events_30d,
      max: Math.max(metrics.platform.audit_events_30d, 500),
      color: '#8b5cf6',
    },
  ];

  const domainSummary = [
    { domain: 'Counsel', count: recommendations.filter((r) => r.domain === 'continuum').length },
    {
      domain: 'Lyte',
      count: recommendations.filter((r) => r.domain === 'beacon' || r.domain === 'terra').length,
    },
    {
      domain: 'Security',
      count: recommendations.filter((r) => r.domain === 'firestorm' || r.domain === 'aegis').length,
    },
    { domain: 'Vessels', count: recommendations.filter((r) => r.domain === 'vessels').length },
  ].filter((d) => d.count > 0);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Cross-domain context assembled from live platform telemetry — real signal correlation across
        active domain packs.
      </p>
      <div className="rounded-xl border border-border/40 bg-card/60 p-5">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Platform Signal Intensity
        </h3>
        <div className="space-y-3">
          {domainMetrics.map((item, i) => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-muted-foreground">{item.label}</span>
                <span className="text-[11px] font-semibold text-foreground">
                  {item.value.toLocaleString()}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted/20 overflow-hidden">
                <m.div
                  className="h-full rounded-full"
                  style={{ background: item.color }}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${item.max > 0 ? Math.min(100, (item.value / item.max) * 100) : 0}%`,
                  }}
                  transition={{ duration: 0.7, delay: i * 0.1, ease: 'easeOut' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      {domainSummary.length > 0 && (
        <div className="rounded-lg border border-border/30 bg-muted/10 px-4 py-3 flex items-center gap-3">
          <BarChart2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
          <p className="text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">Active Recommendations:</span>{' '}
            {domainSummary.map((d) => `${d.count} ${d.domain}`).join(' · ')}
          </p>
        </div>
      )}
    </div>
  );
}
