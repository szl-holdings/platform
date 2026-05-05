/**
 * Detection Engine
 *
 * Evaluates Sigma-style detection rules and lightweight online anomaly scores
 * against the security event stream. Produces alerts and rolls them into
 * incidents using the existing sentra_alerts and sentra_incidents tables.
 *
 * Starter rule pack:
 *  - Credential stuffing
 *  - Token replay
 *  - Scraping bursts
 *  - Recon probing
 *  - Honey-endpoint discovery
 */

import { randomUUID } from 'node:crypto';
import { logger } from '../logger.js';
import type { SecurityEvent } from './event-bus.js';

export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  eventTypes: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  mitreTechnique?: string;
  evaluate: (event: SecurityEvent, state: DetectionState) => boolean;
  cooldownMs?: number;
}

export interface DetectionAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  mitreTechnique?: string;
  sourceIp?: string;
  sessionId?: string;
  triggerEvent: SecurityEvent;
  detectedAt: string;
  anomalyScores: Record<string, number>;
}

export interface DetectionState {
  authFailuresByIp: Map<string, { count: number; windowStart: number }>;
  requestsByIp: Map<string, { count: number; windowStart: number }>;
  pathsByIp: Map<string, Set<string>>;
  lastRuleFireTime: Map<string, number>;
}

function makeState(): DetectionState {
  return {
    authFailuresByIp: new Map(),
    requestsByIp: new Map(),
    pathsByIp: new Map(),
    lastRuleFireTime: new Map(),
  };
}

const RULE_COOLDOWNS = new Map<string, number>();
const WINDOW_MS = 60_000;

function incrIpCounter(map: Map<string, { count: number; windowStart: number }>, ip: string): number {
  const now = Date.now();
  const existing = map.get(ip);
  if (!existing || now - existing.windowStart > WINDOW_MS) {
    map.set(ip, { count: 1, windowStart: now });
    return 1;
  }
  existing.count++;
  return existing.count;
}

function getZScore(map: Map<string, { count: number; windowStart: number }>, ip: string): number {
  const values = Array.from(map.values()).map((v) => v.count);
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);
  if (std === 0) return 0;
  const ipCount = map.get(ip)?.count ?? 0;
  return (ipCount - mean) / std;
}

export const DETECTION_RULES: DetectionRule[] = [
  {
    id: 'DR-001',
    name: 'Credential Stuffing',
    description: 'Multiple authentication failures from a single IP within 60s (≥10)',
    eventTypes: ['auth.failure', 'auth.brute_force'],
    severity: 'high',
    mitreTechnique: 'T1110.004',
    cooldownMs: 120_000,
    evaluate(event, state) {
      const ip = event.sourceIp ?? 'unknown';
      const count = incrIpCounter(state.authFailuresByIp, ip);
      return count >= 10;
    },
  },
  {
    id: 'DR-002',
    name: 'Honey Endpoint Discovery',
    description: 'Any request to a registered honey endpoint — high-confidence attacker',
    eventTypes: ['honey.endpoint_hit'],
    severity: 'critical',
    mitreTechnique: 'T1046',
    cooldownMs: 0,
    evaluate() {
      return true;
    },
  },
  {
    id: 'DR-003',
    name: 'Canary Token Triggered',
    description: 'A canary token embedded in bait data was accessed or used',
    eventTypes: ['canary.triggered'],
    severity: 'critical',
    mitreTechnique: 'T1078',
    cooldownMs: 0,
    evaluate() {
      return true;
    },
  },
  {
    id: 'DR-004',
    name: 'Scraping Burst',
    description: 'High request rate from a single IP — Z-score anomaly (>2.5σ) or ≥100 req/min',
    eventTypes: ['scraping.detected', 'rate.anomaly'],
    severity: 'medium',
    mitreTechnique: 'T1595',
    cooldownMs: 180_000,
    evaluate(event, state) {
      const ip = event.sourceIp ?? 'unknown';
      const count = incrIpCounter(state.requestsByIp, ip);
      const zScore = getZScore(state.requestsByIp, ip);
      return count >= 100 || zScore > 2.5;
    },
  },
  {
    id: 'DR-005',
    name: 'Recon Probing',
    description: 'High path diversity from single IP — exploring endpoints systematically',
    eventTypes: ['recon.probe'],
    severity: 'medium',
    mitreTechnique: 'T1592',
    cooldownMs: 300_000,
    evaluate(event, state) {
      const ip = event.sourceIp ?? 'unknown';
      if (!state.pathsByIp.has(ip)) state.pathsByIp.set(ip, new Set());
      const paths = state.pathsByIp.get(ip)!;
      if (event.path) paths.add(event.path);
      return paths.size >= 30;
    },
  },
  {
    id: 'DR-006',
    name: 'Token Replay Attack',
    description: 'Session replay or stale token reuse detected',
    eventTypes: ['session.replay'],
    severity: 'high',
    mitreTechnique: 'T1550.004',
    cooldownMs: 60_000,
    evaluate() {
      return true;
    },
  },
  {
    id: 'DR-007',
    name: 'Fingerprint Drift',
    description: 'Session fingerprint changed dramatically — possible session hijack',
    eventTypes: ['fingerprint.drift'],
    severity: 'high',
    mitreTechnique: 'T1563',
    cooldownMs: 60_000,
    evaluate() {
      return true;
    },
  },
  {
    id: 'DR-008',
    name: 'Geographic Velocity Anomaly',
    description: 'Same session accessed from geographically impossible locations',
    eventTypes: ['geo.drift'],
    severity: 'high',
    mitreTechnique: 'T1078',
    cooldownMs: 60_000,
    evaluate() {
      return true;
    },
  },
  {
    id: 'DR-009',
    name: 'Suspicious Payload Pattern',
    description: 'Request payload matches injection or enumeration patterns',
    eventTypes: ['payload.suspicious'],
    severity: 'medium',
    mitreTechnique: 'T1190',
    cooldownMs: 30_000,
    evaluate() {
      return true;
    },
  },
];

const _state: DetectionState = makeState();
let _alertHandler: ((alert: DetectionAlert) => void) | null = null;

export function registerAlertHandler(fn: (alert: DetectionAlert) => void): void {
  _alertHandler = fn;
}

export function evaluateEvent(event: SecurityEvent): DetectionAlert | null {
  for (const rule of DETECTION_RULES) {
    if (!rule.eventTypes.includes(event.eventType)) continue;

    const lastFire = RULE_COOLDOWNS.get(rule.id) ?? 0;
    const now = Date.now();
    if (rule.cooldownMs && now - lastFire < rule.cooldownMs) continue;

    const triggered = rule.evaluate(event, _state);
    if (!triggered) continue;

    RULE_COOLDOWNS.set(rule.id, now);

    const scores: Record<string, number> = {};
    if (event.sourceIp) {
      scores['authFailureZScore'] = parseFloat(
        getZScore(_state.authFailuresByIp, event.sourceIp).toFixed(2),
      );
      scores['requestRateZScore'] = parseFloat(
        getZScore(_state.requestsByIp, event.sourceIp).toFixed(2),
      );
      scores['pathDiversity'] = _state.pathsByIp.get(event.sourceIp)?.size ?? 0;
    }

    const alert: DetectionAlert = {
      id: `DETECT-${randomUUID().slice(0, 8).toUpperCase()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      mitreTechnique: rule.mitreTechnique,
      sourceIp: event.sourceIp,
      sessionId: event.sessionId,
      triggerEvent: event,
      detectedAt: new Date().toISOString(),
      anomalyScores: scores,
    };

    logger.info(
      { alertId: alert.id, ruleId: rule.id, ip: event.sourceIp },
      '[DetectionEngine] alert generated',
    );

    _alertHandler?.(alert);
    return alert;
  }
  return null;
}

export function getDetectionState(): DetectionState {
  return _state;
}
