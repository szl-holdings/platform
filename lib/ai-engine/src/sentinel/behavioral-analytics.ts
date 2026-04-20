/**
 * SENTINEL Behavioral Analytics Engine
 *
 * Statistical anomaly detection and insider threat risk scoring.
 * Implements z-score deviation detection, weighted multi-factor risk scoring,
 * and behavioral baseline modeling for identity-centric threat detection.
 */

/** A single recorded access event for a user */
export interface AccessEvent {
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Type of resource accessed */
  resourceType: 'document' | 'database' | 'api' | 'cloud-storage' | 'email' | 'auth';
  /** Sensitivity classification of the resource */
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted' | 'top-secret';
  /** Bytes transferred (upload or download) */
  bytesTransferred?: number;
  /** Whether access occurred outside normal working hours */
  offHours: boolean;
  /** Geographic location identifier */
  geoKey: string;
  /** Whether the device is registered in MDM */
  deviceManaged: boolean;
  /** Whether access is from an IP in an approved range */
  approvedNetwork: boolean;
}

/** Baseline behavioral profile derived from historical access patterns */
export interface BehavioralBaseline {
  userId: string;
  /** Mean weekly access count across resource types */
  meanWeeklyAccesses: number;
  /** Standard deviation of weekly accesses */
  stdWeeklyAccesses: number;
  /** Fraction of accesses that are off-hours historically */
  offHoursRate: number;
  /** Fraction of accesses to confidential/restricted resources */
  sensitiveAccessRate: number;
  /** Mean bytes transferred per session */
  meanBytesPerSession: number;
  /** Standard deviation of bytes per session */
  stdBytesPerSession: number;
  /** Set of known geographic location keys */
  knownGeoKeys: string[];
  /** Fraction of sessions from managed devices */
  managedDeviceRate: number;
}

/** A detected anomaly with statistical evidence */
export interface DetectedAnomaly {
  id: string;
  type:
    | 'volume-spike'
    | 'off-hours-pattern'
    | 'geo-anomaly'
    | 'sensitivity-escalation'
    | 'bytes-anomaly'
    | 'unmanaged-device'
    | 'off-network';
  severity: 'critical' | 'high' | 'medium' | 'low';
  /** Z-score that triggered this detection (absolute value) */
  zScore: number;
  description: string;
  /** Evidence narrative for analyst review */
  evidenceNarrative: string;
  timestamp: number;
  /** Suggested MITRE ATT&CK technique ID if applicable */
  mitreTechnique?: string;
}

/** Final risk assessment for a user */
export interface RiskAssessment {
  userId: string;
  /** 0-100 composite risk score */
  riskScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'normal';
  /** Percent deviation from baseline (e.g., 187 = 187% above baseline) */
  baselineDeviation: number;
  anomalies: DetectedAnomaly[];
  /** Human-readable risk summary */
  summary: string;
  /** Individual factor scores contributing to final score (0-100 each) */
  factorScores: {
    volumeRisk: number;
    temporalRisk: number;
    geographicRisk: number;
    sensitivityRisk: number;
    deviceNetworkRisk: number;
    dataTransferRisk: number;
  };
  assessedAt: number;
}

// ─── Statistical Utilities ────────────────────────────────────────────────────

function zScore(value: number, mean: number, std: number): number {
  if (std === 0) return 0;
  return (value - mean) / std;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Sigmoid-like normalization: maps z-score to 0-100 risk contribution */
function zToRisk(z: number, threshold: number = 2.0): number {
  const absZ = Math.abs(z);
  if (absZ < threshold) return clamp((absZ / threshold) * 30, 0, 30);
  // Above threshold: exponential growth toward 100
  return clamp(30 + (absZ - threshold) * 25, 0, 100);
}

function riskLevelFromScore(score: number): RiskAssessment['riskLevel'] {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 35) return 'medium';
  if (score >= 15) return 'low';
  return 'normal';
}

// ─── Anomaly Detection ────────────────────────────────────────────────────────

function detectVolumeAnomaly(
  currentWeeklyAccesses: number,
  baseline: BehavioralBaseline,
  ts: number,
): DetectedAnomaly | null {
  const z = zScore(currentWeeklyAccesses, baseline.meanWeeklyAccesses, baseline.stdWeeklyAccesses);
  if (Math.abs(z) < 2.0) return null;

  const multiplier =
    baseline.meanWeeklyAccesses > 0
      ? (currentWeeklyAccesses / baseline.meanWeeklyAccesses).toFixed(1)
      : '∞';
  const severity: DetectedAnomaly['severity'] =
    Math.abs(z) >= 4 ? 'critical' : Math.abs(z) >= 3 ? 'high' : 'medium';

  return {
    id: `vol-${ts}`,
    type: 'volume-spike',
    severity,
    zScore: z,
    description: `Access volume ${multiplier}× weekly baseline (z=${z.toFixed(2)})`,
    evidenceNarrative: `User accessed ${currentWeeklyAccesses} resources this week. Baseline: μ=${baseline.meanWeeklyAccesses.toFixed(0)}, σ=${baseline.stdWeeklyAccesses.toFixed(0)}. Statistical deviation: z=${z.toFixed(2)} — ${severity} anomaly threshold exceeded.`,
    timestamp: ts,
    mitreTechnique: 'T1005',
  };
}

function detectOffHoursAnomaly(
  events: AccessEvent[],
  baseline: BehavioralBaseline,
  ts: number,
): DetectedAnomaly | null {
  if (events.length === 0) return null;
  const currentRate = events.filter((e) => e.offHours).length / events.length;
  // Only flag if current rate is significantly higher than baseline
  if (currentRate < 0.3 || currentRate <= baseline.offHoursRate * 1.5) return null;

  const severity: DetectedAnomaly['severity'] =
    currentRate >= 0.6 ? 'critical' : currentRate >= 0.4 ? 'high' : 'medium';
  const offHoursCount = events.filter((e) => e.offHours).length;

  return {
    id: `offhours-${ts}`,
    type: 'off-hours-pattern',
    severity,
    zScore: zScore(currentRate, baseline.offHoursRate, Math.max(baseline.offHoursRate * 0.3, 0.05)),
    description: `Off-hours activity: ${(currentRate * 100).toFixed(0)}% of sessions vs ${(baseline.offHoursRate * 100).toFixed(0)}% baseline`,
    evidenceNarrative: `${offHoursCount} of ${events.length} access events occurred outside standard business hours. Historical off-hours rate: ${(baseline.offHoursRate * 100).toFixed(0)}%. Current period rate: ${(currentRate * 100).toFixed(0)}% — ${severity} deviation.`,
    timestamp: ts,
    mitreTechnique: 'T1078',
  };
}

function detectGeoAnomaly(
  events: AccessEvent[],
  baseline: BehavioralBaseline,
  ts: number,
): DetectedAnomaly | null {
  const unknownGeoEvents = events.filter((e) => !baseline.knownGeoKeys.includes(e.geoKey));
  if (unknownGeoEvents.length === 0) return null;

  const unknownGeoKeys = [...new Set(unknownGeoEvents.map((e) => e.geoKey))];
  const severity: DetectedAnomaly['severity'] =
    unknownGeoEvents.length >= 5 ? 'critical' : unknownGeoEvents.length >= 2 ? 'high' : 'medium';

  return {
    id: `geo-${ts}`,
    type: 'geo-anomaly',
    severity,
    zScore: 3.5,
    description: `Authentication from ${unknownGeoKeys.length} unknown geographic location(s): ${unknownGeoKeys.slice(0, 3).join(', ')}`,
    evidenceNarrative: `${unknownGeoEvents.length} access event(s) originated from geographies not present in 90-day baseline. Unknown locations: ${unknownGeoKeys.join(', ')}. Known geo profile: ${baseline.knownGeoKeys.join(', ')}.`,
    timestamp: ts,
    mitreTechnique: 'T1078.004',
  };
}

function detectSensitivityAnomaly(
  events: AccessEvent[],
  baseline: BehavioralBaseline,
  ts: number,
): DetectedAnomaly | null {
  if (events.length === 0) return null;
  const sensitiveEvents = events.filter(
    (e) =>
      e.sensitivity === 'confidential' ||
      e.sensitivity === 'restricted' ||
      e.sensitivity === 'top-secret',
  );
  const currentRate = sensitiveEvents.length / events.length;
  if (currentRate <= baseline.sensitiveAccessRate * 1.8) return null;

  const severity: DetectedAnomaly['severity'] =
    currentRate >= 0.6 ? 'critical' : currentRate >= 0.4 ? 'high' : 'medium';

  return {
    id: `sensitivity-${ts}`,
    type: 'sensitivity-escalation',
    severity,
    zScore: zScore(
      currentRate,
      baseline.sensitiveAccessRate,
      Math.max(baseline.sensitiveAccessRate * 0.4, 0.05),
    ),
    description: `Sensitive resource access: ${(currentRate * 100).toFixed(0)}% of accesses vs ${(baseline.sensitiveAccessRate * 100).toFixed(0)}% baseline`,
    evidenceNarrative: `${sensitiveEvents.length} of ${events.length} events accessed confidential or restricted resources. Baseline sensitive access rate: ${(baseline.sensitiveAccessRate * 100).toFixed(0)}%. Includes ${events.filter((e) => e.sensitivity === 'restricted').length} restricted resource access(es).`,
    timestamp: ts,
    mitreTechnique: 'T1005',
  };
}

function detectDataTransferAnomaly(
  events: AccessEvent[],
  baseline: BehavioralBaseline,
  ts: number,
): DetectedAnomaly | null {
  const totalBytes = events.reduce((sum, e) => sum + (e.bytesTransferred ?? 0), 0);
  if (totalBytes === 0) return null;

  const z = zScore(
    totalBytes,
    baseline.meanBytesPerSession * events.length,
    baseline.stdBytesPerSession * Math.sqrt(events.length),
  );
  if (Math.abs(z) < 2.5) return null;

  const gb = (totalBytes / 1_073_741_824).toFixed(2);
  const severity: DetectedAnomaly['severity'] =
    Math.abs(z) >= 4 ? 'critical' : Math.abs(z) >= 3 ? 'high' : 'medium';

  return {
    id: `bytes-${ts}`,
    type: 'bytes-anomaly',
    severity,
    zScore: z,
    description: `Abnormal data transfer: ${gb}GB (z=${z.toFixed(2)})`,
    evidenceNarrative: `Total data transfer of ${gb}GB detected across ${events.length} session events. Statistical deviation z=${z.toFixed(2)} from session transfer baseline (μ=${(baseline.meanBytesPerSession / 1024 / 1024).toFixed(1)}MB/session). Indicative of bulk data staging or exfiltration.`,
    timestamp: ts,
    mitreTechnique: 'T1567.002',
  };
}

function detectDeviceNetworkAnomaly(
  events: AccessEvent[],
  baseline: BehavioralBaseline,
  ts: number,
): DetectedAnomaly[] {
  const anomalies: DetectedAnomaly[] = [];

  const unmanagedEvents = events.filter((e) => !e.deviceManaged);
  if (unmanagedEvents.length > 0 && baseline.managedDeviceRate >= 0.9) {
    anomalies.push({
      id: `device-${ts}`,
      type: 'unmanaged-device',
      severity: unmanagedEvents.length >= 3 ? 'high' : 'medium',
      zScore: 2.8,
      description: `${unmanagedEvents.length} access event(s) from non-MDM enrolled device(s)`,
      evidenceNarrative: `${unmanagedEvents.length} session(s) from devices not enrolled in MDM. User baseline: ${(baseline.managedDeviceRate * 100).toFixed(0)}% managed device sessions. Unmanaged access to corporate resources bypasses endpoint security controls.`,
      timestamp: ts,
    });
  }

  const offNetworkEvents = events.filter((e) => !e.approvedNetwork);
  if (offNetworkEvents.length >= 3 && offNetworkEvents.length / events.length > 0.4) {
    anomalies.push({
      id: `network-${ts}`,
      type: 'off-network',
      severity: 'medium',
      zScore: 2.1,
      description: `${offNetworkEvents.length} access events from unapproved network segments`,
      evidenceNarrative: `${offNetworkEvents.length} of ${events.length} events originated from IP ranges outside approved corporate and VPN networks. Possible rogue access point or residential access without approved VPN.`,
      timestamp: ts,
    });
  }

  return anomalies;
}

// ─── Core Scoring Engine ──────────────────────────────────────────────────────

/**
 * Compute a full RiskAssessment for a user given their recent access events
 * and their historical behavioral baseline.
 *
 * @param userId - The identity being assessed
 * @param events - Access events from the current assessment window
 * @param baseline - Pre-computed behavioral baseline for this user
 * @param assessmentWindowDays - Number of days the events span (default 7)
 */
export function computeRiskAssessment(
  userId: string,
  events: AccessEvent[],
  baseline: BehavioralBaseline,
  assessmentWindowDays: number = 7,
): RiskAssessment {
  const now = Date.now();
  const weeklyAccessCount = events.length * (7 / Math.max(assessmentWindowDays, 1));

  // ── Run anomaly detectors ──
  const anomalies: DetectedAnomaly[] = [];

  const volAnomaly = detectVolumeAnomaly(weeklyAccessCount, baseline, now);
  if (volAnomaly) anomalies.push(volAnomaly);

  const offHoursAnomaly = detectOffHoursAnomaly(events, baseline, now);
  if (offHoursAnomaly) anomalies.push(offHoursAnomaly);

  const geoAnomaly = detectGeoAnomaly(events, baseline, now);
  if (geoAnomaly) anomalies.push(geoAnomaly);

  const sensitivityAnomaly = detectSensitivityAnomaly(events, baseline, now);
  if (sensitivityAnomaly) anomalies.push(sensitivityAnomaly);

  const bytesAnomaly = detectDataTransferAnomaly(events, baseline, now);
  if (bytesAnomaly) anomalies.push(bytesAnomaly);

  const deviceAnomalies = detectDeviceNetworkAnomaly(events, baseline, now);
  anomalies.push(...deviceAnomalies);

  // ── Compute factor scores ──
  const volumeRisk = zToRisk(
    zScore(weeklyAccessCount, baseline.meanWeeklyAccesses, Math.max(baseline.stdWeeklyAccesses, 1)),
  );

  const offHoursRate =
    events.length > 0 ? events.filter((e) => e.offHours).length / events.length : 0;
  const temporalRisk = zToRisk(
    zScore(offHoursRate, baseline.offHoursRate, Math.max(baseline.offHoursRate * 0.4, 0.05)),
  );

  const unknownGeoFraction =
    events.length > 0
      ? events.filter((e) => !baseline.knownGeoKeys.includes(e.geoKey)).length / events.length
      : 0;
  const geographicRisk = clamp(unknownGeoFraction * 100, 0, 100);

  const currentSensitiveRate =
    events.length > 0
      ? events.filter((e) => ['confidential', 'restricted', 'top-secret'].includes(e.sensitivity))
          .length / events.length
      : 0;
  const sensitivityRisk = zToRisk(
    zScore(
      currentSensitiveRate,
      baseline.sensitiveAccessRate,
      Math.max(baseline.sensitiveAccessRate * 0.4, 0.05),
    ),
  );

  const unmanagedFraction =
    events.length > 0 ? events.filter((e) => !e.deviceManaged).length / events.length : 0;
  const deviceNetworkRisk = clamp(
    unmanagedFraction * 80 + (deviceAnomalies.length > 0 ? 20 : 0),
    0,
    100,
  );

  const totalBytes = events.reduce((sum, e) => sum + (e.bytesTransferred ?? 0), 0);
  const bytesZ = zScore(
    totalBytes,
    baseline.meanBytesPerSession * events.length,
    Math.max(baseline.stdBytesPerSession * Math.sqrt(Math.max(events.length, 1)), 1_000_000),
  );
  const dataTransferRisk = zToRisk(bytesZ, 2.5);

  // ── Composite score: weighted average of factors ──
  const weights = {
    volumeRisk: 0.2,
    temporalRisk: 0.15,
    geographicRisk: 0.2,
    sensitivityRisk: 0.2,
    deviceNetworkRisk: 0.1,
    dataTransferRisk: 0.15,
  };

  const factorScores = {
    volumeRisk,
    temporalRisk,
    geographicRisk,
    sensitivityRisk,
    deviceNetworkRisk,
    dataTransferRisk,
  };

  let rawScore = Object.entries(weights).reduce(
    (sum, [key, weight]) => sum + factorScores[key as keyof typeof factorScores] * weight,
    0,
  );

  // Boost for multiple correlated critical anomalies (indicator of deliberate insider threat)
  const criticalAnomalyCount = anomalies.filter((a) => a.severity === 'critical').length;
  if (criticalAnomalyCount >= 2) rawScore = Math.min(100, rawScore * 1.35);
  if (criticalAnomalyCount >= 3) rawScore = Math.min(100, rawScore * 1.15);

  const riskScore = Math.round(clamp(rawScore, 0, 100));
  const riskLevel = riskLevelFromScore(riskScore);

  // Baseline deviation = percent over baseline volume
  const baselineDeviation =
    baseline.meanWeeklyAccesses > 0
      ? Math.round(
          ((weeklyAccessCount - baseline.meanWeeklyAccesses) / baseline.meanWeeklyAccesses) * 100,
        )
      : 0;

  // ── Summary generation ──
  const anomalyDescriptions = anomalies
    .slice(0, 3)
    .map((a) => a.description)
    .join('; ');
  const summary =
    anomalies.length === 0
      ? 'No significant behavioral anomalies detected. User activity within normal parameters.'
      : `${anomalies.length} behavioral anomaly${anomalies.length !== 1 ? 's' : ''} detected: ${anomalyDescriptions}.${anomalies.length > 3 ? ` Plus ${anomalies.length - 3} additional finding(s).` : ''}`;

  return {
    userId,
    riskScore,
    riskLevel,
    baselineDeviation,
    anomalies,
    summary,
    factorScores,
    assessedAt: now,
  };
}

/**
 * Build a BehavioralBaseline from a set of historical access events.
 * In production this would be computed from 90-day rolling windows.
 *
 * @param userId - User identity
 * @param historicalEvents - Historical access events (ideally 90 days)
 * @param windowDays - Number of days the historical events cover
 */
export function buildBaseline(
  userId: string,
  historicalEvents: AccessEvent[],
  windowDays: number = 90,
): BehavioralBaseline {
  const weekCount = Math.max(windowDays / 7, 1);

  // Weekly access counts
  const weeksMap = new Map<number, number>();
  for (const evt of historicalEvents) {
    const weekKey = Math.floor(evt.timestamp / (7 * 24 * 3600 * 1000));
    weeksMap.set(weekKey, (weeksMap.get(weekKey) ?? 0) + 1);
  }
  const weekCounts = [...weeksMap.values()];
  const meanWeeklyAccesses =
    weekCounts.length > 0
      ? weekCounts.reduce((s, v) => s + v, 0) / weekCounts.length
      : historicalEvents.length / weekCount;

  const variance =
    weekCounts.length > 1
      ? weekCounts.reduce((s, v) => s + (v - meanWeeklyAccesses) ** 2, 0) / (weekCounts.length - 1)
      : meanWeeklyAccesses * 0.3;
  const stdWeeklyAccesses = Math.sqrt(variance);

  const offHoursRate =
    historicalEvents.length > 0
      ? historicalEvents.filter((e) => e.offHours).length / historicalEvents.length
      : 0.05;

  const sensitiveAccessRate =
    historicalEvents.length > 0
      ? historicalEvents.filter(
          (e) =>
            e.sensitivity === 'confidential' ||
            e.sensitivity === 'restricted' ||
            e.sensitivity === 'top-secret',
        ).length / historicalEvents.length
      : 0.1;

  const sessionBytes = historicalEvents.map((e) => e.bytesTransferred ?? 0).filter((b) => b > 0);
  const meanBytesPerSession =
    sessionBytes.length > 0
      ? sessionBytes.reduce((s, b) => s + b, 0) / sessionBytes.length
      : 5_242_880; // 5MB default
  const bytesVariance =
    sessionBytes.length > 1
      ? sessionBytes.reduce((s, b) => s + (b - meanBytesPerSession) ** 2, 0) /
        (sessionBytes.length - 1)
      : meanBytesPerSession;
  const stdBytesPerSession = Math.sqrt(bytesVariance);

  const knownGeoKeys = [...new Set(historicalEvents.map((e) => e.geoKey))];
  const managedDeviceRate =
    historicalEvents.length > 0
      ? historicalEvents.filter((e) => e.deviceManaged).length / historicalEvents.length
      : 1.0;

  return {
    userId,
    meanWeeklyAccesses,
    stdWeeklyAccesses,
    offHoursRate,
    sensitiveAccessRate,
    meanBytesPerSession,
    stdBytesPerSession,
    knownGeoKeys,
    managedDeviceRate,
  };
}

/**
 * Score a batch of users in parallel.
 * Returns a map of userId → RiskAssessment.
 */
export function batchRiskAssessment(
  assessments: Array<{
    userId: string;
    events: AccessEvent[];
    baseline: BehavioralBaseline;
    windowDays?: number;
  }>,
): Map<string, RiskAssessment> {
  const results = new Map<string, RiskAssessment>();
  for (const { userId, events, baseline, windowDays } of assessments) {
    results.set(userId, computeRiskAssessment(userId, events, baseline, windowDays));
  }
  return results;
}
