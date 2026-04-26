import {
  EVENTS,
  EXECUTION_RUNS,
  GOLDEN_FLOW_CORRELATION_ID,
  getSeverityColor,
  PREDICTIONS,
} from '@szl-holdings/shared-ui/core-observability-data';
import { Activity, Brain, ExternalLink, GitBranch, Zap } from 'lucide-react';

export default function CausalDrilldown() {
  const goldenFlowEvents = EVENTS.filter((e) => e.correlation_id === GOLDEN_FLOW_CORRELATION_ID);
  const goldenFlowPredictions = PREDICTIONS.filter(
    (p) => p.correlation_id === GOLDEN_FLOW_CORRELATION_ID,
  );
  const goldenFlowRuns = EXECUTION_RUNS.filter(
    (r) => r.correlation_id === GOLDEN_FLOW_CORRELATION_ID,
  );

  const causalChains = [
    {
      id: 'chain-001',
      title: 'Northgate Contract — Full Causal Chain',
      correlation_id: GOLDEN_FLOW_CORRELATION_ID,
      events: goldenFlowEvents,
      predictions: goldenFlowPredictions,
      runs: goldenFlowRuns,
      summary:
        'Approval SLA breach triggered by legal team capacity pressure during Q1 close, predicted by Counsel, rerouted by Counsel, now on recovery path.',
    },
  ];

  const phaseColors: Record<string, string> = {
    DETECT: '#4d8fcc',
    INTERPRET: '#f59e0b',
    DECIDE: '#8b5cf6',
    EXECUTE: '#4B8BDB',
    VERIFY: '#10b981',
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <GitBranch className="w-4 h-4" style={{ color: '#4d8fcc' }} />
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: '#4d8fcc' }}
          >
            Lyte · Causal Drilldown
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white">Causal Drilldown</h1>
        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Root factors traced end-to-end across Lyte detections, Lyte actions, Counsel predictions,
          and Counsel execution runs.
        </p>
      </div>

      {causalChains.map((chain) => (
        <div
          key={chain.id}
          className="rounded-xl border"
          style={{ borderColor: 'rgba(77,143,204,0.2)', background: 'rgba(77,143,204,0.02)' }}
        >
          <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(77,143,204,0.1)' }}>
            <div
              className="text-[10px] font-medium uppercase tracking-widest mb-1"
              style={{ color: 'rgba(77,143,204,0.6)' }}
            >
              Correlation ID: {chain.correlation_id}
            </div>
            <div className="text-base font-semibold text-white mb-1">{chain.title}</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {chain.summary}
            </div>
          </div>

          <div className="p-5 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-3.5 h-3.5" style={{ color: '#4d8fcc' }} />
                <span className="text-xs font-semibold text-white">Lyte Detections</span>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                  style={{ color: '#4d8fcc', background: 'rgba(77,143,204,0.15)' }}
                >
                  DETECT / VERIFY
                </span>
              </div>
              <div className="space-y-2 ml-4">
                {chain.events.map((e) => (
                  <div
                    key={e.event_id}
                    className="flex items-start gap-3 rounded-lg p-3"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full mt-1 shrink-0"
                      style={{ background: getSeverityColor(e.severity) }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white">{e.entity_name}</div>
                      <div
                        className="text-[10px] mt-0.5"
                        style={{ color: 'rgba(255,255,255,0.35)' }}
                      >
                        {e.event_type.replace(/_/g, ' ')} · {e.actor_name} ·{' '}
                        {new Date(e.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span
                        className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded"
                        style={{
                          color: phaseColors[e.workflow_stage],
                          background: `${phaseColors[e.workflow_stage]}15`,
                        }}
                      >
                        {e.workflow_stage}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-3.5 h-3.5" style={{ color: '#8b5cf6' }} />
                <span className="text-xs font-semibold text-white">Counsel</span>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                  style={{ color: '#8b5cf6', background: 'rgba(139,92,246,0.15)' }}
                >
                  DECIDE
                </span>
                <a
                  href="/alloy"
                  className="ml-auto text-[9px] flex items-center gap-1 hover:opacity-80"
                  style={{ color: '#8b5cf6' }}
                >
                  <ExternalLink className="w-3 h-3" /> Open in Counsel
                </a>
              </div>
              <div className="space-y-2 ml-4">
                {chain.predictions.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-lg p-3"
                    style={{
                      background: 'rgba(139,92,246,0.05)',
                      border: '1px solid rgba(139,92,246,0.15)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-xs font-medium text-white mb-1">{p.title}</div>
                        <div
                          className="text-[10px] leading-relaxed mb-2"
                          style={{ color: 'rgba(255,255,255,0.45)' }}
                        >
                          {p.rationale}
                        </div>
                        <div className="text-[10px] font-medium" style={{ color: '#10b981' }}>
                          Action: {p.recommended_action}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-bold" style={{ color: '#8b5cf6' }}>
                          {p.confidence}%
                        </div>
                        <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          confidence
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-3.5 h-3.5" style={{ color: '#4B8BDB' }} />
                <span className="text-xs font-semibold text-white">Counsel Execution Runs</span>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                  style={{ color: '#4B8BDB', background: 'rgba(75,139,219,0.15)' }}
                >
                  EXECUTE
                </span>
                <a
                  href="/alloy"
                  className="ml-auto text-[9px] flex items-center gap-1 hover:opacity-80"
                  style={{ color: '#4B8BDB' }}
                >
                  <ExternalLink className="w-3 h-3" /> Open in Counsel
                </a>
              </div>
              <div className="space-y-2 ml-4">
                {chain.runs.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-lg p-3 flex items-center justify-between gap-4"
                    style={{
                      background: 'rgba(75,139,219,0.04)',
                      border: '1px solid rgba(75,139,219,0.12)',
                    }}
                  >
                    <div>
                      <div className="text-xs font-medium text-white mb-0.5">{r.workflow_name}</div>
                      <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {r.triggered_by} · Steps: {r.steps_completed}/{r.steps_total}
                      </div>
                      {r.exception_message && (
                        <div className="text-[10px] mt-1" style={{ color: '#ef4444' }}>
                          {r.exception_message}
                        </div>
                      )}
                    </div>
                    <span
                      className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
                      style={{
                        color:
                          r.status === 'completed'
                            ? '#10b981'
                            : r.status === 'failed'
                              ? '#ef4444'
                              : r.status === 'retried'
                                ? '#8b5cf6'
                                : '#4B8BDB',
                        background: `${r.status === 'completed' ? '#10b981' : r.status === 'failed' ? '#ef4444' : r.status === 'retried' ? '#8b5cf6' : '#4B8BDB'}15`,
                      }}
                    >
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
