/**
 * Sentra Active Defense Bootstrap
 *
 * Called once during server startup after migrations complete.
 * Wires DB-backed writers and the full detection→alert→incident pipeline so:
 *
 *  1. Evidence ledger entries are persisted to sentra_evidence_ledger
 *  2. HITL queue actions are persisted to sentra_response_queue
 *  3. Security events from middleware/bus are persisted to sentra_events
 *  4. Every bus event is evaluated by the detection engine; positive detections
 *     are persisted to sentra_alerts and rolled into sentra_incidents
 *
 * All writers are fire-and-forget with soft error handling — a DB failure
 * never interrupts in-memory defense enforcement.
 */

import { randomUUID } from 'node:crypto';
import { db } from '@szl-holdings/db';
import {
  sentraEvidenceLedgerTable,
  sentraEventsTable,
  sentraResponseQueueTable,
  sentraAlertsTable,
  sentraIncidentsTable,
  sentraDuelSessionsTable,
} from '@szl-holdings/db';
import { logger } from './logger.js';
import {
  registerLedgerDbWriter,
  appendLedgerEntry,
  type LedgerEntry,
} from './sentra-defense/evidence-ledger.js';
import { registerQueueWriter } from './sentra-defense/active-response.js';
import {
  sentraEventBus,
  registerPersistenceHandler,
  type SecurityEvent,
} from './sentra-defense/event-bus.js';
import { evaluateEvent, type DetectionAlert } from './sentra-defense/detection-engine.js';
import { registerDuelDbWriter, type DuelSession } from './sentra-defense/sentinel-agent.js';

let _bootstrapped = false;

export function bootstrapSentraDefense(): void {
  if (_bootstrapped) return;
  _bootstrapped = true;

  // ── 1. Evidence Ledger DB writer ──────────────────────────────────────────
  registerLedgerDbWriter(async (entry: LedgerEntry) => {
    try {
      await db.insert(sentraEvidenceLedgerTable).values({
        id: entry.id,
        sequenceNumber: entry.sequenceNumber,
        entryHash: entry.entryHash,
        previousHash: entry.previousHash ?? null,
        entryType: entry.entryType,
        actorType: entry.actorType,
        actorId: entry.actorId ?? null,
        targetType: entry.targetType ?? null,
        targetId: entry.targetId ?? null,
        action: entry.action,
        outcome: entry.outcome,
        details: entry.details ?? {},
        linkedEventId: entry.linkedEventId ?? null,
        linkedIncidentId: entry.linkedIncidentId ?? null,
      });
    } catch (err) {
      logger.debug({ err, entryId: entry.id }, '[SentraDefense] ledger DB write error (non-fatal)');
    }
  });

  // ── 2. Response Queue DB writer ────────────────────────────────────────────
  registerQueueWriter(async (entry) => {
    try {
      await db.insert(sentraResponseQueueTable).values({
        id: entry.id,
        actionType: entry.actionType,
        category: entry.category as 'block' | 'revoke' | 'rotate' | 'quarantine' | 'tarpit' | 'poison_response' | 'counter_move',
        target: entry.target,
        targetType: entry.targetType,
        reason: entry.reason,
        riskLevel: entry.riskLevel as 'critical' | 'high' | 'medium' | 'low',
        status: 'pending',
        autoExecute: false,
        linkedEventId: entry.linkedEventId ?? null,
        linkedIncidentId: entry.linkedIncidentId ?? null,
        details: entry.details ?? {},
      });
    } catch (err) {
      logger.debug({ err, queueId: entry.id }, '[SentraDefense] response queue DB write error (non-fatal)');
    }
  });

  // ── 3. Event bus persistence handler ──────────────────────────────────────
  // Ensures events emitted by middleware (probe detection, honey endpoints)
  // that bypass the REST layer are also persisted to sentra_events.
  registerPersistenceHandler(async (event: SecurityEvent) => {
    try {
      await db.insert(sentraEventsTable).values({
        id: event.id,
        eventType: event.eventType,
        sourceIp: event.sourceIp ?? null,
        sessionId: event.sessionId ?? null,
        userId: event.userId ?? null,
        path: event.path ?? null,
        method: event.method ?? null,
        statusCode: event.statusCode ?? null,
        severity: event.severity,
        payload: event.payload ?? {},
        detectedAt: new Date(event.detectedAt),
        retentionExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }).onConflictDoNothing();
    } catch (err) {
      logger.debug({ err, eventId: event.id }, '[SentraDefense] event persistence error (non-fatal)');
    }
  });

  // ── 4. Telemetry → Detection → Alert → Incident pipeline ──────────────────
  // Core operational path: every security event on the bus (from probe detection
  // middleware, honey handlers, or POST /sentra/events) is evaluated. Positive
  // detections are persisted to sentra_alerts and rolled into sentra_incidents.
  // Scope violations surface via the ledger writer registered in step 1.
  sentraEventBus.onEvent((event: SecurityEvent) => {
    const alert = evaluateEvent(event);
    if (!alert) return;

    _persistDetectionAlert(alert, event.id).catch((err) => {
      logger.debug({ err, alertId: alert.id }, '[SentraDefense] alert persistence error (non-fatal)');
    });
  });

  // ── 5. Duel Session DB writer ──────────────────────────────────────────────
  // Persists Sentinel duel sessions to sentra_duel_sessions so state survives
  // restarts and the evidence ledger stays continuous across process boundaries.
  registerDuelDbWriter(async (session: DuelSession) => {
    try {
      await db.insert(sentraDuelSessionsTable).values({
        id: session.id,
        sessionKey: session.sessionKey,
        attackerProfile: session.attackerProfile as 'human' | 'scripted_automation' | 'llm_agent' | 'unknown',
        attackerConfidence: session.attackerConfidence,
        sentinelStrategy: session.currentStrategy ?? null,
        counterMoveCount: session.counterMoveCount,
        status: session.status as 'active' | 'resolved' | 'escaped',
        timeline: session.timeline,
        policyEstimate: session.policyEstimate,
        startedAt: new Date(session.startedAt),
        updatedAt: new Date(session.updatedAt),
      }).onConflictDoUpdate({
        target: sentraDuelSessionsTable.sessionKey,
        set: {
          attackerProfile: session.attackerProfile as 'human' | 'scripted_automation' | 'llm_agent' | 'unknown',
          attackerConfidence: session.attackerConfidence,
          sentinelStrategy: session.currentStrategy ?? null,
          counterMoveCount: session.counterMoveCount,
          status: session.status as 'active' | 'resolved' | 'escaped',
          timeline: session.timeline,
          policyEstimate: session.policyEstimate,
          updatedAt: new Date(session.updatedAt),
        },
      });
    } catch (err) {
      logger.debug({ err, sessionKey: session.sessionKey }, '[SentraDefense] duel session DB write error (non-fatal)');
    }
  });

  logger.info('[SentraDefense] Active Defense Fabric bootstrap complete — DB writers and detection pipeline registered');
}

/**
 * Persist a detection alert:
 *  a) create a sentra_incidents record for the rule firing
 *  b) create a linked sentra_alerts record (visible in SOC dashboard)
 *  c) append a detection entry to the hash-chained evidence ledger
 *
 * All three writes are best-effort; failures are swallowed so they never
 * break the in-memory enforcement path.
 */
async function _persistDetectionAlert(alert: DetectionAlert, triggerEventId: string): Promise<void> {
  const incidentId = `INC-${randomUUID().slice(0, 8).toUpperCase()}`;
  const now = new Date();
  const ipFragment = alert.sourceIp ? ` from ${alert.sourceIp}` : '';

  // a) Create the incident
  try {
    await db.insert(sentraIncidentsTable).values({
      id: incidentId,
      title: `[AUTO] ${alert.ruleName}${ipFragment}`,
      description: `Detection rule ${alert.ruleId} fired${ipFragment}. MITRE: ${alert.mitreTechnique ?? 'N/A'}. Scores: ${JSON.stringify(alert.anomalyScores)}.`,
      severity: alert.severity,
      status: 'open',
      mitreStage: _mitreStageForTechnique(alert.mitreTechnique),
      detectedAt: now,
      updatedAt: now,
      affectedAssets: alert.sourceIp ? [alert.sourceIp] : [],
      tags: ['auto-detected', `rule:${alert.ruleId}`],
      timeline: [{ ts: now.toISOString(), type: 'detection', note: `${alert.severity} alert: ${alert.ruleName}` }],
    }).onConflictDoNothing();
  } catch (err) {
    logger.debug({ err, incidentId }, '[SentraDefense] incident create error (non-fatal)');
  }

  // b) Create the alert, linked to the incident
  try {
    await db.insert(sentraAlertsTable).values({
      id: alert.id,
      title: alert.ruleName,
      severity: alert.severity,
      source: `detection-engine:${alert.ruleId}`,
      status: 'open',
      description: `Rule ${alert.ruleId}${ipFragment}. MITRE: ${alert.mitreTechnique ?? 'N/A'}. Scores: ${JSON.stringify(alert.anomalyScores)}.`,
      asset: alert.sourceIp ?? null,
      detectedAt: now,
      linkedIncidentId: incidentId,
    }).onConflictDoNothing();
  } catch (err) {
    logger.debug({ err, alertId: alert.id }, '[SentraDefense] alert create error (non-fatal)');
  }

  // c) Append detection entry to the hash-chained evidence ledger
  appendLedgerEntry({
    entryType: 'detection',
    actorType: 'system',
    targetType: 'ip',
    targetId: alert.sourceIp ?? 'unknown',
    action: `rule:${alert.ruleId}`,
    outcome: 'executed',
    details: {
      alertId: alert.id,
      incidentId,
      ruleName: alert.ruleName,
      severity: alert.severity,
      mitreTechnique: alert.mitreTechnique,
      anomalyScores: alert.anomalyScores,
    },
    linkedEventId: triggerEventId,
    linkedIncidentId: incidentId,
  });
}

function _mitreStageForTechnique(technique?: string): string {
  if (!technique) return 'Unknown';
  const map: Record<string, string> = {
    'T1110': 'Credential Access',
    'T1110.004': 'Credential Access',
    'T1046': 'Discovery',
    'T1078': 'Initial Access',
    'T1550.004': 'Lateral Movement',
    'T1563': 'Lateral Movement',
    'T1595': 'Reconnaissance',
    'T1592': 'Reconnaissance',
    'T1190': 'Initial Access',
  };
  return map[technique] ?? 'Unknown';
}
