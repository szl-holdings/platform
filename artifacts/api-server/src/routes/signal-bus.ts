import { randomUUID } from 'crypto';
import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { Router, type Request, type Response } from 'express';
import {
  db,
  meshSignalsTable,
  signalBusRulesTable,
  signalBusRoutedEventsTable,
  signalBusDeadLettersTable,
} from '@szl-holdings/db';
import { defaultSignalBus } from '@szl-holdings/signal-mesh';
import {
  createSignal,
  type Signal,
  type SignalDomain,
  type SignalType,
} from '@workspace/ontology/signal';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { getUserOrgIds } from '../middlewares/tenant-scope';
import { handleRouteError } from '../lib/api-response.js';
import { logger } from '../lib/logger.js';
import { submitDelivery, type OutboundChannel } from '../services/outbound-gateway';

const router = Router();

const SIGNAL_BUS_OWNED_PREFIXES = [
  '/backfill',
  '/dead-letters',
  '/events',
  '/publish',
  '/rules',
  '/seed-demo-rules',
  '/stats',
  '/test-fire',
];
router.use(SIGNAL_BUS_OWNED_PREFIXES, authMiddleware());

const SEVERITY_ORDER = ['info', 'low', 'medium', 'high', 'critical'] as const;

function severityMet(signalSev: string | undefined, minSev: string): boolean {
  const sigIdx = SEVERITY_ORDER.indexOf((signalSev ?? 'info') as (typeof SEVERITY_ORDER)[number]);
  const minIdx = SEVERITY_ORDER.indexOf(minSev as (typeof SEVERITY_ORDER)[number]);
  return sigIdx >= minIdx;
}

function evaluateConditions(signal: Signal, conditions: Record<string, unknown>): boolean {
  if (!conditions || Object.keys(conditions).length === 0) return true;

  for (const [key, expected] of Object.entries(conditions)) {
    const actual = (signal.rawPayload as Record<string, unknown>)?.[key];
    if (typeof expected === 'string' && typeof actual === 'string') {
      if (!actual.toLowerCase().includes(expected.toLowerCase())) return false;
    } else if (expected !== actual) {
      return false;
    }
  }
  return true;
}

type ActionResult = { action: string; detail: string; entityId?: string };

async function executeAction(
  rule: typeof signalBusRulesTable.$inferSelect,
  signal: Signal,
): Promise<ActionResult> {
  const config = rule.actionConfig as Record<string, unknown>;

  switch (rule.actionType) {
    case 'open_matter': {
      const title = (config.titleTemplate as string) ?? `Auto-opened from ${signal.domain} signal`;
      const entityRef = signal.entityRefs[0];
      return {
        action: 'open_matter',
        detail: `Legal matter opened: "${title}" — triggered by ${signal.type} in ${signal.domain}`,
        entityId: entityRef?.entityId,
      };
    }
    case 'create_briefing_line': {
      const priority = (config.priority as string) ?? 'high';
      return {
        action: 'create_briefing_line',
        detail: `Briefing line added (priority: ${priority}) — ${signal.rawPayload?.title ?? signal.type}`,
        entityId: signal.entityRefs[0]?.entityId,
      };
    }
    case 'portfolio_alert': {
      const alertType = (config.alertType as string) ?? 'exposure_change';
      return {
        action: 'portfolio_alert',
        detail: `Portfolio alert (${alertType}) — ${signal.rawPayload?.title ?? signal.type} from ${signal.domain}`,
        entityId: signal.entityRefs[0]?.entityId,
      };
    }
    case 'raise_threat': {
      return {
        action: 'raise_threat',
        detail: `Threat escalated to Sentra — ${signal.rawPayload?.title ?? signal.type}`,
        entityId: signal.entityRefs[0]?.entityId,
      };
    }
    case 'notify_channel': {
      const channel = (config.channel as OutboundChannel) ?? 'webhook';
      const title = (config.titleTemplate as string) ?? signal.rawPayload?.title ?? signal.type;
      const message =
        (config.messageTemplate as string) ??
        `Signal from ${signal.domain}: ${signal.rawPayload?.title ?? signal.type}`;
      const channelConfig = (config.channelConfig as Record<string, unknown>) ?? {};

      try {
        const deliveryResult = await submitDelivery({
          channel,
          sourceDomain: signal.domain,
          sourceEvent: signal.type,
          sourceSignalId: signal.signalId,
          recipient: config.recipient as string | undefined,
          payload: {
            event: 'signal_bus.rule_triggered',
            title,
            message,
            severity: signal.severity,
            domain: signal.domain,
            signalType: signal.type,
            signalId: signal.signalId,
            ruleName: rule.name,
            sourceDomain: signal.domain,
            sourceEvent: signal.type,
            ...signal.rawPayload,
          },
          channelConfig,
          orgId: rule.orgId ?? undefined,
        });
        return {
          action: 'notify_channel',
          detail: `${channel} notification ${deliveryResult.status} — ${title}`,
          entityId: deliveryResult.deliveryId,
        };
      } catch (err) {
        return {
          action: 'notify_channel',
          detail: `${channel} notification failed: ${err instanceof Error ? err.message : 'unknown error'}`,
        };
      }
    }
    case 'publish_signal': {
      const targetDomain = (config.targetDomain as string) ?? 'cross-domain';
      const targetType = (config.targetType as string) ?? 'escalation';
      const derived = createSignal({
        source: 'system',
        type: targetType as SignalType,
        domain: targetDomain as SignalDomain,
        occurredAt: new Date().toISOString(),
        freshness: 1,
        confidence: signal.confidence ?? 0.9,
        severity: signal.severity,
        entityRefs: signal.entityRefs,
        tenantId: signal.tenantId,
        rawPayload: {
          title: `Routed: ${signal.rawPayload?.title ?? signal.type}`,
          sourceSignalId: signal.signalId,
          sourceRule: rule.name,
          ...signal.rawPayload,
        },
        tags: ['signal-bus-routed', rule.name],
        provenance: {
          sourceService: 'signal-bus',
          correlationId: signal.signalId,
        },
      });
      defaultSignalBus.publish(derived);
      return {
        action: 'publish_signal',
        detail: `Derived signal published to ${targetDomain}/${targetType}`,
        entityId: derived.signalId,
      };
    }
    default:
      return {
        action: rule.actionType,
        detail: `Unknown action type: ${rule.actionType}`,
      };
  }
}

async function evaluateRulesForSignal(signal: Signal): Promise<void> {
  try {
    const rules = await db
      .select()
      .from(signalBusRulesTable)
      .where(eq(signalBusRulesTable.enabled, 'true'));

    for (const rule of rules) {
      if (rule.sourceDomain !== '*' && rule.sourceDomain !== signal.domain) continue;
      if (rule.sourceType !== '*' && rule.sourceType !== signal.type) continue;
      if (!severityMet(signal.severity, rule.minSeverity)) continue;
      if (!evaluateConditions(signal, rule.conditions as Record<string, unknown>)) continue;

      try {
        const result = await executeAction(rule, signal);

        await db.insert(signalBusRoutedEventsTable).values({
          eventId: randomUUID(),
          ruleId: rule.ruleId,
          ruleName: rule.name,
          sourceSignalId: signal.signalId,
          sourceDomain: signal.domain,
          sourceType: signal.type,
          actionType: rule.actionType,
          actionResult: result,
          status: 'success',
          orgId: rule.orgId,
        });

        await db
          .update(signalBusRulesTable)
          .set({
            lastFiredAt: new Date(),
            fireCount: String(parseInt(rule.fireCount, 10) + 1),
            updatedAt: new Date(),
          })
          .where(eq(signalBusRulesTable.ruleId, rule.ruleId));

        logger.info(
          {
            ruleId: rule.ruleId,
            ruleName: rule.name,
            signalId: signal.signalId,
            action: result.action,
          },
          '[signal-bus] rule fired',
        );
      } catch (actionErr) {
        const errMsg = actionErr instanceof Error ? actionErr.message : 'Action execution failed';
        await db.insert(signalBusDeadLettersTable).values({
          deadLetterId: randomUUID(),
          ruleId: rule.ruleId,
          sourceSignalId: signal.signalId,
          sourceDomain: signal.domain,
          sourceType: signal.type,
          errorMessage: errMsg,
          payload: {
            signal: signal.rawPayload,
            rule: { name: rule.name, actionType: rule.actionType },
          },
          orgId: rule.orgId,
        });
        logger.warn(
          { ruleId: rule.ruleId, err: errMsg },
          '[signal-bus] action failed, dead-lettered',
        );
      }
    }
  } catch (err) {
    logger.error({ err }, '[signal-bus] rule evaluation failed');
  }
}

let busSubscribed = false;

export function initSignalBusRuleEngine(): void {
  if (busSubscribed) return;
  busSubscribed = true;

  defaultSignalBus.on('*', (signal) => {
    if (signal.tags?.includes('signal-bus-routed')) return;
    evaluateRulesForSignal(signal).catch((err) => {
      logger.error({ err }, '[signal-bus] async rule evaluation error');
    });
  });

  logger.info('[signal-bus] Rule engine initialized — listening for all signals');
}

router.get('/rules', async (req: Request, res: Response) => {
  try {
    const orgIds = getUserOrgIds(req.user!);
    if (orgIds !== null && orgIds.size === 0) {
      res.json({ rules: [] });
      return;
    }
    const orgFilter =
      orgIds !== null ? inArray(signalBusRulesTable.orgId, [...orgIds].map(String)) : undefined;
    const rules = await db
      .select()
      .from(signalBusRulesTable)
      .where(orgFilter)
      .orderBy(desc(signalBusRulesTable.createdAt));
    res.json({ rules });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list signal bus rules');
  }
});

router.post('/rules', async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      sourceDomain,
      sourceType,
      minSeverity,
      conditions,
      actionType,
      actionConfig,
      targetDomain,
    } = req.body;
    if (!name || !sourceDomain || !sourceType || !actionType || !actionConfig) {
      res.status(400).json({
        error: 'Missing required fields: name, sourceDomain, sourceType, actionType, actionConfig',
      });
      return;
    }
    const rule = {
      ruleId: randomUUID(),
      name,
      description: description ?? null,
      sourceDomain,
      sourceType,
      minSeverity: minSeverity ?? 'info',
      conditions: conditions ?? {},
      actionType,
      actionConfig,
      targetDomain: targetDomain ?? null,
      orgId: (req as unknown as { tenantOrgId?: string }).tenantOrgId ?? null,
      createdBy: (req as unknown as { userId?: string }).userId ?? null,
    };
    await db.insert(signalBusRulesTable).values(rule);
    res.status(201).json({ rule });
  } catch (err) {
    handleRouteError(res, err, 'Failed to create signal bus rule');
  }
});

router.put('/rules/:ruleId', async (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;
    const orgIds = getUserOrgIds(req.user!);
    if (orgIds !== null && orgIds.size === 0) {
      res.status(404).json({ error: 'Rule not found' });
      return;
    }
    const orgFilter =
      orgIds !== null ? inArray(signalBusRulesTable.orgId, [...orgIds].map(String)) : undefined;
    const {
      name,
      description,
      enabled,
      sourceDomain,
      sourceType,
      minSeverity,
      conditions,
      actionType,
      actionConfig,
      targetDomain,
    } = req.body;
    const updated = await db
      .update(signalBusRulesTable)
      .set({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(enabled !== undefined && { enabled: String(enabled) }),
        ...(sourceDomain !== undefined && { sourceDomain }),
        ...(sourceType !== undefined && { sourceType }),
        ...(minSeverity !== undefined && { minSeverity }),
        ...(conditions !== undefined && { conditions }),
        ...(actionType !== undefined && { actionType }),
        ...(actionConfig !== undefined && { actionConfig }),
        ...(targetDomain !== undefined && { targetDomain }),
        updatedAt: new Date(),
      })
      .where(and(eq(signalBusRulesTable.ruleId, ruleId!), orgFilter))
      .returning();
    if (updated.length === 0) {
      res.status(404).json({ error: 'Rule not found' });
      return;
    }
    res.json({ rule: updated[0] });
  } catch (err) {
    handleRouteError(res, err, 'Failed to update signal bus rule');
  }
});

router.delete('/rules/:ruleId', async (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;
    const orgIds = getUserOrgIds(req.user!);
    if (orgIds !== null && orgIds.size === 0) {
      res.status(404).json({ error: 'Rule not found' });
      return;
    }
    const orgFilter =
      orgIds !== null ? inArray(signalBusRulesTable.orgId, [...orgIds].map(String)) : undefined;
    const deleted = await db
      .delete(signalBusRulesTable)
      .where(and(eq(signalBusRulesTable.ruleId, ruleId!), orgFilter))
      .returning();
    if (deleted.length === 0) {
      res.status(404).json({ error: 'Rule not found' });
      return;
    }
    res.json({ deleted: true });
  } catch (err) {
    handleRouteError(res, err, 'Failed to delete signal bus rule');
  }
});

router.get('/events', async (req: Request, res: Response) => {
  try {
    const orgIds = getUserOrgIds(req.user!);
    if (orgIds !== null && orgIds.size === 0) {
      res.json({ events: [], total: 0 });
      return;
    }
    const orgFilter =
      orgIds !== null
        ? inArray(signalBusRoutedEventsTable.orgId, [...orgIds].map(String))
        : undefined;
    const limit = Math.min(parseInt(String(req.query.limit ?? '100'), 10) || 100, 500);
    const events = await db
      .select()
      .from(signalBusRoutedEventsTable)
      .where(orgFilter)
      .orderBy(desc(signalBusRoutedEventsTable.routedAt))
      .limit(limit);
    res.json({ events, total: events.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list routed events');
  }
});

router.get('/dead-letters', async (req: Request, res: Response) => {
  try {
    const orgIds = getUserOrgIds(req.user!);
    if (orgIds !== null && orgIds.size === 0) {
      res.json({ deadLetters: [], total: 0 });
      return;
    }
    const orgFilter =
      orgIds !== null
        ? inArray(signalBusDeadLettersTable.orgId, [...orgIds].map(String))
        : undefined;
    const limit = Math.min(parseInt(String(req.query.limit ?? '50'), 10) || 50, 200);
    const letters = await db
      .select()
      .from(signalBusDeadLettersTable)
      .where(orgFilter)
      .orderBy(desc(signalBusDeadLettersTable.createdAt))
      .limit(limit);
    res.json({ deadLetters: letters, total: letters.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list dead letters');
  }
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const orgIds = getUserOrgIds(req.user!);
    if (orgIds !== null && orgIds.size === 0) {
      res.json({
        totalRules: 0,
        enabledRules: 0,
        totalRoutedEvents: 0,
        totalDeadLetters: 0,
        eventsByAction: [],
      });
      return;
    }
    const ruleOrgFilter =
      orgIds !== null ? inArray(signalBusRulesTable.orgId, [...orgIds].map(String)) : undefined;
    const eventOrgFilter =
      orgIds !== null
        ? inArray(signalBusRoutedEventsTable.orgId, [...orgIds].map(String))
        : undefined;
    const dlOrgFilter =
      orgIds !== null
        ? inArray(signalBusDeadLettersTable.orgId, [...orgIds].map(String))
        : undefined;

    const [ruleCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(signalBusRulesTable)
      .where(ruleOrgFilter);
    const [enabledCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(signalBusRulesTable)
      .where(and(eq(signalBusRulesTable.enabled, 'true'), ruleOrgFilter));
    const [eventCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(signalBusRoutedEventsTable)
      .where(eventOrgFilter);
    const [deadLetterCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(signalBusDeadLettersTable)
      .where(dlOrgFilter);
    const recentEvents = await db
      .select({
        actionType: signalBusRoutedEventsTable.actionType,
        count: sql<number>`count(*)::int`,
      })
      .from(signalBusRoutedEventsTable)
      .where(eventOrgFilter)
      .groupBy(signalBusRoutedEventsTable.actionType);

    res.json({
      totalRules: ruleCount?.count ?? 0,
      enabledRules: enabledCount?.count ?? 0,
      totalRoutedEvents: eventCount?.count ?? 0,
      totalDeadLetters: deadLetterCount?.count ?? 0,
      eventsByAction: recentEvents,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to get signal bus stats');
  }
});

router.post('/publish', async (req: Request, res: Response) => {
  try {
    const { type, domain, severity, title, entityId, entityType, payload } = req.body;
    if (!type || !domain || !title) {
      res.status(400).json({ error: 'Missing required fields: type, domain, title' });
      return;
    }
    const signal = createSignal({
      source: 'api',
      type: type as SignalType,
      domain: domain as SignalDomain,
      occurredAt: new Date().toISOString(),
      freshness: 1,
      confidence: 0.95,
      severity: severity ?? 'medium',
      entityRefs: entityId
        ? [{ entityId, entityType: entityType ?? 'unknown', displayName: title }]
        : [],
      tenantId: (req as unknown as { tenantOrgId?: string }).tenantOrgId ?? undefined,
      rawPayload: { title, ...payload },
      tags: ['manual-publish'],
      provenance: { sourceService: 'signal-bus-api' },
    });
    defaultSignalBus.publish(signal);
    res.status(201).json({ signalId: signal.signalId, message: 'Signal published to bus' });
  } catch (err) {
    handleRouteError(res, err, 'Failed to publish signal');
  }
});

router.post('/test-fire', async (req: Request, res: Response) => {
  try {
    const { scenario } = req.body;
    const scenarios: Record<string, () => Signal> = {
      'sanctions-hit': () =>
        createSignal({
          source: 'connector',
          type: 'sanctions-match',
          domain: 'maritime',
          occurredAt: new Date().toISOString(),
          freshness: 1,
          confidence: 0.97,
          severity: 'critical',
          entityRefs: [
            { entityId: 'vessel-mv-aurora', entityType: 'vessel', displayName: 'MV Aurora' },
          ],
          rawPayload: {
            title: 'OFAC SDN match — MV Aurora',
            sanctionsList: 'OFAC SDN',
            matchScore: 0.97,
            vesselName: 'MV Aurora',
            imo: '9876543',
          },
          tags: ['demo', 'sanctions'],
          provenance: { sourceService: 'vessels-sanctions-scanner' },
        }),
      'threat-detected': () =>
        createSignal({
          source: 'system',
          type: 'anomaly',
          domain: 'security',
          occurredAt: new Date().toISOString(),
          freshness: 1,
          confidence: 0.92,
          severity: 'high',
          entityRefs: [
            { entityId: 'host-dc-prod-07', entityType: 'host', displayName: 'DC-PROD-07' },
          ],
          rawPayload: {
            title: 'Lateral movement detected — DC-PROD-07',
            attackPattern: 'T1021.002',
            attackerIp: '10.0.5.42',
            affectedAssets: 3,
          },
          tags: ['demo', 'threat'],
          provenance: { sourceService: 'sentra-threat-hunter' },
        }),
      'lease-renewal': () =>
        createSignal({
          source: 'api',
          type: 'deadline',
          domain: 'real-estate',
          occurredAt: new Date().toISOString(),
          freshness: 1,
          confidence: 1.0,
          severity: 'medium',
          entityRefs: [
            {
              entityId: 'property-88-wooster',
              entityType: 'property',
              displayName: '88 Wooster St, SoHo',
            },
          ],
          rawPayload: {
            title: 'Lease renewal due in 45 days — 88 Wooster St',
            daysUntilExpiry: 45,
            monthlyRent: 42000,
            tenant: 'Apex Holdings LLC',
          },
          tags: ['demo', 'lease'],
          provenance: { sourceService: 'terra-lease-monitor' },
        }),
    };
    const factory = scenarios[scenario as string];
    if (!factory) {
      res
        .status(400)
        .json({ error: `Unknown scenario. Available: ${Object.keys(scenarios).join(', ')}` });
      return;
    }
    const signal = factory();
    defaultSignalBus.publish(signal);
    res.json({
      signalId: signal.signalId,
      scenario,
      message: `Demo signal "${scenario}" published — rules will evaluate`,
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to fire test scenario');
  }
});

router.post(
  '/backfill',
  requireRole('admin', 'ops', 'super_admin'),
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, domain, type, dryRun } = req.body;
      if (!startDate || !endDate) {
        res.status(400).json({ error: 'Missing required fields: startDate, endDate (ISO 8601)' });
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res
          .status(400)
          .json({ error: 'Invalid date format. Use ISO 8601 (e.g. 2026-01-01T00:00:00Z)' });
        return;
      }
      if (end <= start) {
        res.status(400).json({ error: 'endDate must be after startDate' });
        return;
      }

      const maxRangeMs = 90 * 24 * 60 * 60 * 1000;
      if (end.getTime() - start.getTime() > maxRangeMs) {
        res.status(400).json({ error: 'Date range cannot exceed 90 days' });
        return;
      }

      const orgIds = getUserOrgIds(req.user!);

      const ruleConditions = [eq(signalBusRulesTable.enabled, 'true')];
      if (orgIds !== null) {
        const orgStringIds = [...orgIds].map(String);
        ruleConditions.push(inArray(signalBusRulesTable.orgId, orgStringIds));
      }

      const rules = await db
        .select()
        .from(signalBusRulesTable)
        .where(and(...ruleConditions));

      if (rules.length === 0) {
        res.json({ backfilled: 0, matched: 0, message: 'No enabled rules to evaluate' });
        return;
      }

      const signalConditions = [
        gte(meshSignalsTable.occurredAt, start),
        lte(meshSignalsTable.occurredAt, end),
      ];
      if (domain) signalConditions.push(eq(meshSignalsTable.domain, domain as string));
      if (type) signalConditions.push(eq(meshSignalsTable.type, type as string));
      if (orgIds !== null) {
        const orgStringIds = [...orgIds].map(String);
        signalConditions.push(inArray(meshSignalsTable.tenantId, orgStringIds));
      }

      const historicalRows = await db
        .select()
        .from(meshSignalsTable)
        .where(and(...signalConditions))
        .orderBy(meshSignalsTable.occurredAt);

      if (historicalRows.length === 0) {
        res.json({
          backfilled: 0,
          matched: 0,
          dryRun: !!dryRun,
          dateRange: { start: start.toISOString(), end: end.toISOString() },
          rulesEvaluated: rules.length,
          message: 'No historical signals found in the specified date range',
        });
        return;
      }

      const replayedSignals: Signal[] = historicalRows.map((row) => {
        const storedPayload = row.payload as { signal?: unknown } | unknown;
        const rawPayload =
          typeof storedPayload === 'object' &&
          storedPayload !== null &&
          'signal' in (storedPayload as Record<string, unknown>)
            ? (storedPayload as { signal: unknown }).signal
            : storedPayload;

        return createSignal({
          source: row.source,
          type: row.type as SignalType,
          domain: row.domain as SignalDomain,
          occurredAt: row.occurredAt.toISOString(),
          freshness: row.freshness,
          confidence: row.confidence,
          severity: (row.severity ?? 'medium') as Signal['severity'],
          tenantId: row.tenantId ?? undefined,
          entityRefs: [],
          rawPayload: rawPayload as Record<string, unknown>,
          tags: ['backfill-replay'],
          provenance: {
            sourceService: 'signal-bus-backfill',
            correlationId: `backfill-replay-${start.toISOString()}-${end.toISOString()}`,
            originalSignalId: row.signalId,
          },
        });
      });

      let matched = 0;
      const matchDetails: Array<{
        signalId: string;
        domain: string;
        type: string;
        rulesMatched: string[];
      }> = [];

      for (const signal of replayedSignals) {
        const rulesMatched: string[] = [];
        for (const rule of rules) {
          if (rule.sourceDomain !== '*' && rule.sourceDomain !== signal.domain) continue;
          if (rule.sourceType !== '*' && rule.sourceType !== signal.type) continue;
          if (!severityMet(signal.severity, rule.minSeverity)) continue;
          if (!evaluateConditions(signal, rule.conditions as Record<string, unknown>)) continue;
          rulesMatched.push(rule.name);

          if (!dryRun) {
            try {
              const result = await executeAction(rule, signal);
              await db.insert(signalBusRoutedEventsTable).values({
                eventId: randomUUID(),
                ruleId: rule.ruleId,
                ruleName: rule.name,
                sourceSignalId: signal.signalId,
                sourceDomain: signal.domain,
                sourceType: signal.type,
                actionType: rule.actionType,
                actionResult: { ...result, isBackfill: true },
                status: 'success',
                orgId: rule.orgId,
              });
            } catch (actionErr) {
              const errMsg =
                actionErr instanceof Error ? actionErr.message : 'Backfill action failed';
              await db.insert(signalBusDeadLettersTable).values({
                deadLetterId: randomUUID(),
                ruleId: rule.ruleId,
                sourceSignalId: signal.signalId,
                sourceDomain: signal.domain,
                sourceType: signal.type,
                errorMessage: errMsg,
                payload: {
                  signal: signal.rawPayload,
                  rule: { name: rule.name, actionType: rule.actionType },
                  isBackfill: true,
                },
                orgId: rule.orgId,
              });
            }
          }
        }
        if (rulesMatched.length > 0) {
          matched++;
          if (matchDetails.length < 50) {
            matchDetails.push({
              signalId: signal.signalId,
              domain: signal.domain,
              type: signal.type,
              rulesMatched,
            });
          }
        }
      }

      const actor = {
        userId: req.user!.id,
        displayName: req.user!.displayName,
        roles: req.user!.roles,
      };

      logger.info(
        {
          startDate,
          endDate,
          domain,
          signalCount: replayedSignals.length,
          matched,
          dryRun: !!dryRun,
          actor,
        },
        '[signal-bus] backfill replay completed',
      );

      res.json({
        backfilled: replayedSignals.length,
        matched,
        dryRun: !!dryRun,
        dateRange: { start: start.toISOString(), end: end.toISOString() },
        rulesEvaluated: rules.length,
        matchDetails: dryRun ? matchDetails : undefined,
        actor: { userId: actor.userId, displayName: actor.displayName },
        message: dryRun
          ? `Dry run: ${replayedSignals.length} historical signals replayed, ${matched} would match current rules`
          : `Backfilled ${replayedSignals.length} historical signals, ${matched} matched active rules`,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to backfill signals');
    }
  },
);

router.post('/seed-demo-rules', async (_req: Request, res: Response) => {
  try {
    const demoRules = [
      {
        ruleId: randomUUID(),
        name: 'Sanctions Hit → Open Legal Matter',
        description:
          'When a vessel triggers a sanctions match, automatically open a Counsel legal matter for compliance review.',
        sourceDomain: 'maritime',
        sourceType: 'sanctions-match',
        minSeverity: 'high',
        conditions: {},
        actionType: 'open_matter',
        actionConfig: {
          titleTemplate: 'Sanctions compliance review — {{entityName}}',
          matterType: 'sanctions_review',
          priority: 'urgent',
        },
        targetDomain: 'legal',
      },
      {
        ruleId: randomUUID(),
        name: 'Security Threat → Executive Briefing',
        description:
          'When Sentra detects a high-severity threat, add a line to the next Pulse executive briefing.',
        sourceDomain: 'security',
        sourceType: 'anomaly',
        minSeverity: 'high',
        conditions: {},
        actionType: 'create_briefing_line',
        actionConfig: { priority: 'high', briefingSection: 'security_posture' },
        targetDomain: 'platform',
      },
      {
        ruleId: randomUUID(),
        name: 'Lease Renewal → Portfolio Alert',
        description:
          'When a lease renewal deadline approaches, raise a portfolio-level exposure alert for the holdings dashboard.',
        sourceDomain: 'real-estate',
        sourceType: 'deadline',
        minSeverity: 'medium',
        conditions: {},
        actionType: 'portfolio_alert',
        actionConfig: { alertType: 'lease_expiry', dashboard: 'szl-holdings' },
        targetDomain: 'finance',
      },
      {
        ruleId: randomUUID(),
        name: 'Critical Maritime Risk → Threat Escalation',
        description:
          'When vessel risk score triggers critical, escalate to Sentra for cross-domain threat analysis.',
        sourceDomain: 'maritime',
        sourceType: 'risk',
        minSeverity: 'critical',
        conditions: {},
        actionType: 'raise_threat',
        actionConfig: { threatCategory: 'maritime_risk_escalation' },
        targetDomain: 'security',
      },
      {
        ruleId: randomUUID(),
        name: 'Property Distress → Cross-Domain Signal',
        description:
          'When Terra detects a distressed property opportunity, publish a cross-domain signal for portfolio awareness.',
        sourceDomain: 'real-estate',
        sourceType: 'opportunity',
        minSeverity: 'medium',
        conditions: {},
        actionType: 'publish_signal',
        actionConfig: { targetDomain: 'finance', targetType: 'opportunity' },
        targetDomain: 'finance',
      },
    ];

    for (const rule of demoRules) {
      await db.insert(signalBusRulesTable).values(rule).onConflictDoNothing();
    }

    res.json({
      seeded: demoRules.length,
      rules: demoRules.map((r) => ({ ruleId: r.ruleId, name: r.name })),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to seed demo rules');
  }
});

export default router;
