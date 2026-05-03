/**
 * Sentra → Prism Bus signal emitter
 *
 * Emits signals onto the Prism Bus for:
 *  - New KEV vulnerability affecting fleet assets
 *  - Identity blast-radius prediction
 *  - Adversary-replay simulation finding
 *
 * All signals include source tracing and severity metadata.
 */
import { prismBus } from '@szl-holdings/prism-bus';
import { logger } from './logger';

export interface KevFleetSignal {
  cveId: string;
  affectedAssets: string[];
  cvssScore?: number;
  epssScore?: number;
  remediation?: string;
}

export interface BlastRadiusSignal {
  identityId: string;
  p7dLateralPath: number;
  estimatedBlastRadius: number;
  highRiskTargets: string[];
}

export interface AdversaryReplaySignal {
  scenarioId: string;
  overallSuccessRate: number;
  chainLength: number;
  missedDetections: number;
  topMitigation: string;
}

export async function emitKevFleetSignal(signal: KevFleetSignal): Promise<void> {
  try {
    await prismBus.publish({
      type: 'domain_signal',
      domain: 'aegis',
      sourceId: 'sentra:threat-feeds',
      severity: signal.cvssScore && signal.cvssScore >= 9 ? 'critical' : 'high',
      payload: {
        signalType: 'kev_fleet_impact',
        cveId: signal.cveId,
        affectedAssetCount: signal.affectedAssets.length,
        affectedAssets: signal.affectedAssets,
        cvssScore: signal.cvssScore,
        epssScore: signal.epssScore,
        remediation: signal.remediation ?? 'Apply vendor patch immediately; validate with EDR telemetry',
        source: 'CISA KEV',
      },
    });
    logger.info({ cveId: signal.cveId, affectedCount: signal.affectedAssets.length }, '[sentra/prism] KEV fleet signal emitted');
  } catch (err) {
    logger.warn({ err }, '[sentra/prism] failed to emit KEV fleet signal');
  }
}

export async function emitBlastRadiusSignal(signal: BlastRadiusSignal): Promise<void> {
  try {
    const severity = signal.p7dLateralPath >= 0.7 ? 'critical' : signal.p7dLateralPath >= 0.4 ? 'high' : 'medium';
    await prismBus.publish({
      type: 'domain_signal',
      domain: 'aegis',
      sourceId: 'sentra:identity-blast-radius',
      severity,
      payload: {
        signalType: 'identity_blast_radius_forecast',
        identityId: signal.identityId,
        p7dLateralPath: signal.p7dLateralPath,
        estimatedBlastRadius: signal.estimatedBlastRadius,
        highRiskTargets: signal.highRiskTargets,
        forecastHorizonDays: 7,
        source: 'Sentra Identity ML',
      },
    });
    logger.info({ identityId: signal.identityId, p7d: signal.p7dLateralPath }, '[sentra/prism] blast-radius signal emitted');
  } catch (err) {
    logger.warn({ err }, '[sentra/prism] failed to emit blast-radius signal');
  }
}

export async function emitAdversaryReplaySignal(signal: AdversaryReplaySignal): Promise<void> {
  try {
    const severity = signal.overallSuccessRate >= 0.5 ? 'critical' : signal.overallSuccessRate >= 0.25 ? 'high' : 'medium';
    await prismBus.publish({
      type: 'domain_signal',
      domain: 'aegis',
      sourceId: 'sentra:adversary-replay',
      severity,
      payload: {
        signalType: 'adversary_replay_finding',
        scenarioId: signal.scenarioId,
        overallSuccessRate: signal.overallSuccessRate,
        chainLength: signal.chainLength,
        missedDetections: signal.missedDetections,
        topMitigation: signal.topMitigation,
        source: 'Sentra Adversary Engine',
      },
    });
    logger.info({ scenarioId: signal.scenarioId, successRate: signal.overallSuccessRate }, '[sentra/prism] adversary replay signal emitted');
  } catch (err) {
    logger.warn({ err }, '[sentra/prism] failed to emit adversary replay signal');
  }
}
