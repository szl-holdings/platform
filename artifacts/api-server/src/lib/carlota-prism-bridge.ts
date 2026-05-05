/**
 * Carlota Jo Prism Bus Bridge
 *
 * Emits Carlota Jo domain signals onto the Prism Event Bus so that
 * sibling apps (A11oy ExecutiveBrief, Conduit export, etc.) can subscribe
 * to Carlota intelligence events.
 *
 * Events emitted:
 *   - carlota.strategic_move_prediction   — new strategic move forecast for a competitor
 *   - carlota.engagement_milestone_change — engagement roadmap KPI milestone updated
 *   - carlota.concierge_anomaly           — per-client anomaly ranked by concierge digest
 *   - carlota.radar_refresh               — competitive radar manually or schedule-refreshed
 *   - carlota.inquiry_created             — new prospect inquiry landed (alias of existing pubsub)
 */

import { prismBus } from '@szl-holdings/prism-bus';
import { logger } from './logger';

export interface StrategicMovePredictionPayload {
  competitor: string;
  probability: number;
  predictedAction: string;
  horizon: string;
  topFeatures: Array<{ feature: string; contribution: number }>;
  modelVersionId: string;
  clientId?: string | null;
  correlationId?: string;
}

export interface EngagementMilestonePayload {
  engagementId: string;
  clientName: string;
  milestoneName: string;
  forecastCompletionDate: string;
  p10: string;
  p90: string;
  kpiName: string;
  kpiCurrentValue: number;
  kpiTargetValue: number;
  correlationId?: string;
}

export interface ConciergeAnomalyPayload {
  clientId: string;
  clientName: string;
  weekOf: string;
  anomalyScore: number;
  topSignals: Array<{ source: string; description: string; score: number }>;
  recommendedAction: string;
  correlationId?: string;
}

export interface RadarRefreshPayload {
  triggeredBy: 'schedule' | 'manual';
  competitorCount: number;
  newSignalCount: number;
  feedHealth: Array<{ feedType: string; status: string }>;
  correlationId?: string;
}

export async function emitStrategicMovePrediction(
  payload: StrategicMovePredictionPayload,
): Promise<void> {
  try {
    await prismBus.publish({
      type: 'domain_signal',
      domain: 'carlota-jo',
      sourceId: 'carlota-strategic-forecast',
      severity: payload.probability > 0.7 ? 'high' : payload.probability > 0.5 ? 'medium' : 'low',
      payload: {
        event: 'carlota.strategic_move_prediction',
        competitor: payload.competitor,
        probability: payload.probability,
        predictedAction: payload.predictedAction,
        horizon: payload.horizon,
        topFeatures: payload.topFeatures,
        modelVersionId: payload.modelVersionId,
        clientId: payload.clientId ?? null,
      },
      correlationId: payload.correlationId,
    });
  } catch (err) {
    logger.warn({ err }, '[carlota-prism] emitStrategicMovePrediction failed (non-fatal)');
  }
}

export async function emitEngagementMilestoneChange(
  payload: EngagementMilestonePayload,
): Promise<void> {
  try {
    await prismBus.publish({
      type: 'domain_signal',
      domain: 'carlota-jo',
      sourceId: 'carlota-roadmap-forecast',
      severity: 'info',
      payload: {
        event: 'carlota.engagement_milestone_change',
        engagementId: payload.engagementId,
        clientName: payload.clientName,
        milestoneName: payload.milestoneName,
        forecastCompletionDate: payload.forecastCompletionDate,
        p10: payload.p10,
        p90: payload.p90,
        kpiName: payload.kpiName,
        kpiCurrentValue: payload.kpiCurrentValue,
        kpiTargetValue: payload.kpiTargetValue,
      },
      correlationId: payload.correlationId,
    });
  } catch (err) {
    logger.warn({ err }, '[carlota-prism] emitEngagementMilestoneChange failed (non-fatal)');
  }
}

export async function emitConciergeAnomaly(
  payload: ConciergeAnomalyPayload,
): Promise<void> {
  try {
    const severity =
      payload.anomalyScore > 0.8 ? 'high'
      : payload.anomalyScore > 0.6 ? 'medium'
      : 'low';
    await prismBus.publish({
      type: 'domain_signal',
      domain: 'carlota-jo',
      sourceId: 'carlota-concierge-anomaly',
      severity,
      payload: {
        event: 'carlota.concierge_anomaly',
        clientId: payload.clientId,
        clientName: payload.clientName,
        weekOf: payload.weekOf,
        anomalyScore: payload.anomalyScore,
        topSignals: payload.topSignals,
        recommendedAction: payload.recommendedAction,
      },
      correlationId: payload.correlationId,
    });
  } catch (err) {
    logger.warn({ err }, '[carlota-prism] emitConciergeAnomaly failed (non-fatal)');
  }
}

export async function emitRadarRefresh(
  payload: RadarRefreshPayload,
): Promise<void> {
  try {
    await prismBus.publish({
      type: 'domain_signal',
      domain: 'carlota-jo',
      sourceId: 'carlota-radar-refresh',
      severity: payload.newSignalCount > 10 ? 'medium' : 'info',
      payload: {
        event: 'carlota.radar_refresh',
        triggeredBy: payload.triggeredBy,
        competitorCount: payload.competitorCount,
        newSignalCount: payload.newSignalCount,
        feedHealth: payload.feedHealth,
      },
      correlationId: payload.correlationId,
    });
  } catch (err) {
    logger.warn({ err }, '[carlota-prism] emitRadarRefresh failed (non-fatal)');
  }
}
