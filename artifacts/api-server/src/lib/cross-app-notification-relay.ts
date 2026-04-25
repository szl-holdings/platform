import { agentEventBus } from './event-bus';
import { logger } from './logger';
import { publish, WS_CHANNELS } from './websocket';

export type CrossAppSignalType =
  | 'lyte_priority_detected'
  | 'aegis_threat_confirmed'
  | 'vessels_voyage_anomaly'
  | 'terra_deal_blocker'
  | 'holdings_investor_event'
  | 'forge_workflow_created'
  | 'covenant_policy_triggered'
  | 'atlas_artifact_generated';

export interface CrossAppSignal {
  id: string;
  type: CrossAppSignalType;
  sourceApp: string;
  targetApps: string[];
  headline: string;
  detail: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  actionUrl?: string;
  correlationId?: string;
  tenantId?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

const signalHistory: CrossAppSignal[] = [];
const MAX_SIGNAL_HISTORY = 200;

function generateId() {
  return `signal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function dispatchCrossAppSignal(
  signal: Omit<CrossAppSignal, 'id' | 'timestamp'>,
): Promise<CrossAppSignal> {
  const full: CrossAppSignal = {
    ...signal,
    id: generateId(),
    timestamp: Date.now(),
  };

  signalHistory.unshift(full);
  if (signalHistory.length > MAX_SIGNAL_HISTORY) {
    signalHistory.length = MAX_SIGNAL_HISTORY;
  }

  publish(WS_CHANNELS.NOTIFICATIONS, 'cross_app_signal', full);

  await agentEventBus.publish({
    type: 'cross_domain_signal',
    sourceAgent: signal.sourceApp,
    sourceDomain: signal.sourceApp.toLowerCase().replace(/\s+/g, '-'),
    payload: {
      signalId: full.id,
      signalType: signal.type,
      targetApps: signal.targetApps,
      headline: signal.headline,
      detail: signal.detail,
      correlationId: signal.correlationId,
      ...signal.metadata,
    },
    severity: signal.severity,
    correlationId: signal.correlationId,
  });

  logger.info(
    {
      signalId: full.id,
      type: full.type,
      sourceApp: full.sourceApp,
      targetApps: full.targetApps,
      severity: full.severity,
    },
    '[cross-app-relay] Signal dispatched',
  );

  return full;
}

export function getCrossAppSignals(
  options: { limit?: number; sourceApp?: string; type?: CrossAppSignalType; since?: number } = {},
): CrossAppSignal[] {
  let results = signalHistory;
  if (options.sourceApp) results = results.filter((s) => s.sourceApp === options.sourceApp);
  if (options.type) results = results.filter((s) => s.type === options.type);
  if (options.since) results = results.filter((s) => s.timestamp >= options.since!);
  return results.slice(0, options.limit ?? 50);
}

export function getCrossAppSignalStats() {
  const byType: Record<string, number> = {};
  const byApp: Record<string, number> = {};
  for (const s of signalHistory) {
    byType[s.type] = (byType[s.type] ?? 0) + 1;
    byApp[s.sourceApp] = (byApp[s.sourceApp] ?? 0) + 1;
  }
  return {
    total: signalHistory.length,
    byType,
    byApp,
    recent: signalHistory.slice(0, 5),
  };
}

agentEventBus.subscribe(
  'cross-app-relay-listener',
  ['anomaly_detected', 'threat_identified', 'alert_raised', 'metric_spike'],
  async (event) => {
    const signalTypeMap: Record<string, CrossAppSignalType> = {
      threat_identified: 'aegis_threat_confirmed',
      anomaly_detected: 'lyte_priority_detected',
      metric_spike: 'lyte_priority_detected',
      alert_raised: 'lyte_priority_detected',
    };

    const signalType = signalTypeMap[event.type] ?? 'lyte_priority_detected';
    const targetApps =
      event.sourceDomain === 'aegis'
        ? ['COVENANT', 'HELM CONSOLE']
        : event.sourceDomain === 'lyte'
          ? ['Counsel RUNTIME', 'HELM CONSOLE']
          : event.sourceDomain === 'vessels'
            ? ['Counsel RUNTIME', 'HELM CONSOLE']
            : ['HELM CONSOLE'];

    await dispatchCrossAppSignal({
      type: signalType,
      sourceApp: event.sourceAgent,
      targetApps,
      headline: `${event.type.replace(/_/g, ' ')} from ${event.sourceAgent}`,
      detail: `Severity: ${event.severity}. Correlation: ${event.correlationId ?? 'none'}`,
      severity: event.severity,
      correlationId: event.correlationId,
      metadata: event.payload,
    });
  },
);
