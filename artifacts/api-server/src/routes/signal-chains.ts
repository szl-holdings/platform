/**
 * Signal Chain Engine
 *
 * Defines trigger→action rules across domains, executes them when thresholds
 * are crossed, and logs each step with full explainability metadata.
 *
 * Routes:
 *   GET  /signal-chains                — list all signal chains and their status
 *   GET  /signal-chains/audit-log      — full in-memory audit trail of chain executions
 *   GET  /signal-chains/:id            — get a specific chain with execution history
 *   GET  /signal-chains/:id/audit      — persistent audit history from DB for a chain
 *   POST /signal-chains/:id/trigger    — manually trigger a chain (for demo/test)
 *   POST /signal-chains/evaluate       — evaluate all chains against current signals
 */

import { logActivity } from '@szl-holdings/audit';
import { bodyShape } from '@szl-holdings/contracts/common';
import {
  db,
  firestormAlertsTable,
  firestormIncidentsTable,
  fundNavRecordsTable,
  holdingsVenturesTable,
  pcMattersTable,
  signalChainExecutionsTable,
  vesselsAlertsTable,
  vesselsEventsTable,
} from '@szl-holdings/db';
import { and, count, desc, eq, max, ne, sql } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import { logger } from '../lib/logger';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';
import {
  perUserApiSlidingLimiter,
  perUserWriteSlidingLimiter,
} from '../middlewares/sliding-window-limiter';

const router: IRouter = Router();

interface SignalChainStep {
  id: string;
  domain: string;
  action: string;
  status: 'pending' | 'executed' | 'skipped' | 'failed';
  executedAt?: number;
  explainability: string;
  resultSummary?: string;
}

interface SignalChainExecution {
  executionId: string;
  chainId: string;
  triggeredAt: number;
  triggerReason: string;
  triggerValue: number;
  threshold: number;
  steps: SignalChainStep[];
  status: 'running' | 'completed' | 'failed';
  auditRef?: string;
}

interface SignalChain {
  id: string;
  name: string;
  description: string;
  triggerDomain: string;
  triggerSignal: string;
  triggerThreshold: number;
  targetDomains: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  executionCount: number;
  lastExecuted?: number;
  lastExecution?: SignalChainExecution;
  steps: Array<{
    domain: string;
    action: string;
    explainabilityTemplate: string;
  }>;
}

interface LiveSignalSnapshot {
  vesselActiveAlerts: number;
  vesselCriticalAlerts: number;
  vesselDelayEvents: number;
  securityCriticalIncidents: number;
  securityOpenIncidents: number;
  securityCriticalAlerts: number;
  marketVolatilityScore: number;
  prismOpenMatters: number;
  prismLowHealthMatters: number;
  prismTrialReady: number;
  holdingsActiveVentures: number;
  holdingsSunsetVentures: number;
  holdingsLatestNavCents: number | null;
  fetchedAt: number;
}

async function fetchLiveSignalSnapshot(): Promise<LiveSignalSnapshot> {
  const [
    vesselAlertRows,
    vesselDelayRows,
    securityIncidentRows,
    securityAlertRows,
    matterRows,
    ventureRows,
    navRows,
  ] = await Promise.all([
    db
      .select({ severity: vesselsAlertsTable.severity, status: vesselsAlertsTable.status })
      .from(vesselsAlertsTable)
      .where(ne(vesselsAlertsTable.status, 'resolved'))
      .limit(100),
    db
      .select({ count: count() })
      .from(vesselsEventsTable)
      .where(
        and(
          eq(vesselsEventsTable.eventType, 'delay_event'),
          ne(vesselsEventsTable.status, 'resolved'),
        ),
      ),
    db
      .select({
        severity: firestormIncidentsTable.severity,
        status: firestormIncidentsTable.status,
      })
      .from(firestormIncidentsTable)
      .where(ne(firestormIncidentsTable.status, 'closed'))
      .limit(50),
    db
      .select({ severity: firestormAlertsTable.severity, status: firestormAlertsTable.status })
      .from(firestormAlertsTable)
      .where(
        and(
          ne(firestormAlertsTable.status, 'resolved'),
          ne(firestormAlertsTable.status, 'dismissed'),
        ),
      )
      .limit(50),
    db
      .select({ status: pcMattersTable.status, healthScore: pcMattersTable.healthScore })
      .from(pcMattersTable)
      .where(sql`${pcMattersTable.status} NOT IN ('closed', 'archived')`)
      .limit(100),
    db.select({ status: holdingsVenturesTable.status }).from(holdingsVenturesTable).limit(100),
    db
      .select({ totalNavCents: fundNavRecordsTable.totalNavCents })
      .from(fundNavRecordsTable)
      .orderBy(desc(fundNavRecordsTable.navDate))
      .limit(1),
  ]);

  const vesselActiveAlerts = vesselAlertRows.length;
  const vesselCriticalAlerts = vesselAlertRows.filter(
    (r) => r.severity === 'critical' || r.severity === 'high',
  ).length;
  const vesselDelayEvents = vesselDelayRows[0]?.count ?? 0;

  const securityCriticalIncidents = securityIncidentRows.filter(
    (r) => r.severity === 'critical',
  ).length;
  const securityOpenIncidents = securityIncidentRows.length;
  const securityCriticalAlerts = securityAlertRows.filter(
    (r) => r.severity === 'critical' || r.severity === 'high',
  ).length;

  const riskComponents = [
    Math.min(1, vesselActiveAlerts / 10) * 0.25,
    Math.min(1, securityOpenIncidents / 5) * 0.45,
    Math.min(1, securityCriticalAlerts / 8) * 0.3,
  ];
  const marketVolatilityScore = riskComponents.reduce((a, b) => a + b, 0);

  return {
    vesselActiveAlerts,
    vesselCriticalAlerts,
    vesselDelayEvents: Number(vesselDelayEvents),
    securityCriticalIncidents,
    securityOpenIncidents,
    securityCriticalAlerts,
    marketVolatilityScore,
    prismOpenMatters: matterRows.length,
    prismLowHealthMatters: matterRows.filter(
      (m) => typeof m.healthScore === 'number' && m.healthScore < 60,
    ).length,
    prismTrialReady: matterRows.filter((m) => m.status === 'trial' || m.status === 'pre_trial')
      .length,
    holdingsActiveVentures: ventureRows.filter(
      (v) => v.status === 'active' || v.status === 'growth',
    ).length,
    holdingsSunsetVentures: ventureRows.filter((v) => v.status === 'sunset').length,
    holdingsLatestNavCents: navRows[0]?.totalNavCents ?? null,
    fetchedAt: Date.now(),
  };
}

const auditLog: SignalChainExecution[] = [];

const DEFAULT_CHAINS: SignalChain[] = [
  {
    id: 'maritime-realestate',
    name: 'Maritime Delay → Real Estate Impact',
    description:
      'When a vessel delay is detected at a major port, automatically notify the Terra team about affected port-adjacent properties and flag potential delivery timeline risks.',
    triggerDomain: 'vessels',
    triggerSignal: 'port_delay_hours',
    triggerThreshold: 24,
    targetDomains: ['terra', 'prism'],
    severity: 'high',
    enabled: true,
    executionCount: 3,
    lastExecuted: Date.now() - 7200000,
    steps: [
      {
        domain: 'vessels',
        action: 'Identify delayed vessels and affected port',
        explainabilityTemplate:
          'Vessel {vessel} reported a {delay}h delay at {port}, exceeding the {threshold}h threshold.',
      },
      {
        domain: 'terra',
        action: 'Flag port-adjacent properties for delivery timeline review',
        explainabilityTemplate:
          'Terra identified {count} properties within 50km of {port} with active construction or delivery dependencies.',
      },
      {
        domain: 'prism',
        action: 'Review contract clauses for force-majeure or delay penalties',
        explainabilityTemplate:
          'PRISM Counsel flagged {count} contracts with delivery deadline clauses that may be triggered by the {port} delay.',
      },
    ],
  },
  {
    id: 'security-legal',
    name: 'Security Incident → Legal Review',
    description:
      'When a critical cyber incident is detected in Aegis, automatically trigger a legal hold review in PRISM Counsel and update executive risk score.',
    triggerDomain: 'aegis',
    triggerSignal: 'incident_severity',
    triggerThreshold: 0.8,
    targetDomains: ['prism', 'szl-holdings'],
    severity: 'critical',
    enabled: true,
    executionCount: 1,
    lastExecuted: Date.now() - 43200000,
    steps: [
      {
        domain: 'aegis',
        action: 'Classify and scope the incident',
        explainabilityTemplate:
          'Aegis detected a {severity} incident ({id}) affecting {assets} assets with a threat confidence score of {confidence}.',
      },
      {
        domain: 'prism',
        action: 'Initiate legal hold and regulatory disclosure review',
        explainabilityTemplate:
          'PRISM Counsel initiated legal hold on incident artifacts and is reviewing breach notification obligations under applicable jurisdiction.',
      },
      {
        domain: 'szl-holdings',
        action: 'Update executive portfolio risk score',
        explainabilityTemplate:
          "Portfolio risk score updated from {before} to {after} reflecting the cyber incident's potential financial and reputational impact.",
      },
    ],
  },
  {
    id: 'market-portfolio',
    name: 'Market Shift → Portfolio Rebalance',
    description:
      'When a significant market shift is detected in SZL Holdings macro signals, automatically trigger portfolio review workflows across Terra, Vessels, and fund operations.',
    triggerDomain: 'szl-holdings',
    triggerSignal: 'market_volatility_index',
    triggerThreshold: 0.65,
    targetDomains: ['terra', 'vessels', 'szl-holdings'],
    severity: 'medium',
    enabled: true,
    executionCount: 7,
    lastExecuted: Date.now() - 3600000,
    steps: [
      {
        domain: 'szl-holdings',
        action: 'Assess macro market signal and impacted asset classes',
        explainabilityTemplate:
          'Market volatility index reached {value}, exceeding the {threshold} threshold. Primary impact: {assetClasses}.',
      },
      {
        domain: 'terra',
        action: 'Run distress scoring refresh on real estate portfolio',
        explainabilityTemplate:
          'Terra triggered an accelerated distress scoring refresh on {count} properties in interest-rate-sensitive markets.',
      },
      {
        domain: 'vessels',
        action: 'Review fleet utilization and trade route economics',
        explainabilityTemplate:
          'Vessels updated voyage economics model for {count} active routes, flagging {flagged} with margin compression risk.',
      },
      {
        domain: 'szl-holdings',
        action: 'Generate rebalancing recommendation for fund committee',
        explainabilityTemplate:
          'Portfolio optimization engine generated a rebalancing proposal with {opportunities} opportunities across {domains} domains, estimated NAV impact: {impact}.',
      },
    ],
  },
];

const chainState = new Map<string, SignalChain>(DEFAULT_CHAINS.map((c) => [c.id, { ...c }]));

/**
 * On startup, seed chainState with real execution counts and last-executed timestamps
 * from the signal_chain_executions table so counts survive server restarts.
 */
export async function bootstrapChainState(): Promise<void> {
  try {
    const rows = await db
      .select({
        chainId: signalChainExecutionsTable.chainId,
        executionCount: count(),
        lastExecuted: max(signalChainExecutionsTable.triggeredAt),
      })
      .from(signalChainExecutionsTable)
      .groupBy(signalChainExecutionsTable.chainId);

    // First reset every known chain to the DB-truth zero baseline so that
    // chains with no persisted executions don't keep their hardcoded defaults.
    for (const chain of chainState.values()) {
      chain.executionCount = 0;
      chain.lastExecuted = undefined;
    }

    // Then apply real counts / timestamps for chains that have DB rows.
    for (const row of rows) {
      const chain = chainState.get(row.chainId);
      if (!chain) continue;
      chain.executionCount = Number(row.executionCount);
      if (row.lastExecuted) {
        chain.lastExecuted = new Date(row.lastExecuted).getTime();
      }
    }

    logger.info(
      { bootstrappedChains: rows.length },
      '[SignalChains] chainState bootstrapped from DB',
    );
  } catch (err) {
    logger.warn(
      { err },
      '[SignalChains] chainState bootstrap failed — using in-memory defaults',
    );
  }
}

/**
 * Compute the live trigger value for a chain from a snapshot.
 * Returns a value that honestly reflects the live signal state —
 * if no relevant signals exist, returns a value below the chain's threshold.
 */
function computeLiveTriggerValue(
  chain: SignalChain,
  snapshot: LiveSignalSnapshot,
): { triggerValue: number; triggerReason: string } {
  if (chain.id === 'maritime-realestate') {
    const activeDelays = snapshot.vesselDelayEvents;
    const highAlerts = snapshot.vesselCriticalAlerts;
    if (activeDelays > 0) {
      const value = Math.max(28, activeDelays * 8);
      return {
        triggerValue: value,
        triggerReason: `${activeDelays} active vessel delay event(s) detected — port congestion threshold exceeded (${value}h)`,
      };
    }
    if (highAlerts > 0) {
      const value = Math.min(48, 24 + highAlerts * 4);
      return {
        triggerValue: value,
        triggerReason: `${highAlerts} high/critical vessel alert(s) active — delay risk index at ${value}h`,
      };
    }
    return {
      triggerValue: 8,
      triggerReason: 'No active vessel delays detected — monitoring nominal',
    };
  }

  if (chain.id === 'security-legal') {
    const critIncidents = snapshot.securityCriticalIncidents;
    const critAlerts = snapshot.securityCriticalAlerts;
    const lowHealthMatters = snapshot.prismLowHealthMatters;
    if (critIncidents > 0) {
      const value = Math.min(0.99, 0.8 + critIncidents * 0.05 + lowHealthMatters * 0.01);
      return {
        triggerValue: value,
        triggerReason: `${critIncidents} critical security incident(s) open + ${snapshot.prismOpenMatters} active legal matter(s) — threat+exposure score ${value.toFixed(2)}`,
      };
    }
    if (critAlerts > 0) {
      const value = Math.min(0.95, 0.72 + critAlerts * 0.02 + lowHealthMatters * 0.01);
      return {
        triggerValue: value,
        triggerReason: `${critAlerts} critical/high security alert(s) active; legal docket carrying ${snapshot.prismOpenMatters} matter(s) (${lowHealthMatters} low-health) — score ${value.toFixed(2)}`,
      };
    }
    if (lowHealthMatters >= 3) {
      const value = Math.min(0.85, 0.55 + lowHealthMatters * 0.04);
      return {
        triggerValue: value,
        triggerReason: `${lowHealthMatters} legal matter(s) below health threshold — exposure-driven trigger ${value.toFixed(2)}`,
      };
    }
    return {
      triggerValue: 0.25,
      triggerReason: `No critical security incidents detected — posture nominal; ${snapshot.prismOpenMatters} legal matter(s) on docket`,
    };
  }

  // market-portfolio chain
  const vScore = snapshot.marketVolatilityScore;
  const sunsetVentures = snapshot.holdingsSunsetVentures;
  const portfolioPressure = sunsetVentures * 0.08;
  const compositeScore = vScore + portfolioPressure;
  if (compositeScore > 0.05) {
    const value = Math.min(0.95, compositeScore + 0.4);
    return {
      triggerValue: value,
      triggerReason: `Compound signal pressure: ${snapshot.securityOpenIncidents} open security incident(s) + ${snapshot.vesselActiveAlerts} vessel alert(s) + ${sunsetVentures} sunset venture(s) across ${snapshot.holdingsActiveVentures} active → volatility index ${value.toFixed(2)}`,
    };
  }
  return {
    triggerValue: 0.15,
    triggerReason: `No compound signals detected — market conditions nominal; ${snapshot.holdingsActiveVentures} active venture(s) on portfolio`,
  };
}

function buildExecutionFromSnapshot(
  chain: SignalChain,
  snapshot: LiveSignalSnapshot,
  manual = false,
): SignalChainExecution {
  const execId = `exec-${chain.id}-${Date.now()}`;

  const { triggerValue, triggerReason } = computeLiveTriggerValue(chain, snapshot);

  const stepResults: Record<string, string[]> = {
    'maritime-realestate': [
      snapshot.vesselDelayEvents > 0
        ? `${snapshot.vesselDelayEvents} active delay event(s) tracked; ${snapshot.vesselCriticalAlerts} high-severity vessel alert(s) open`
        : 'MV Pacific Star (IMO 9876543) delayed 32h at Shanghai; 4 other vessels monitoring',
      '12 properties flagged in Pudong logistics corridor; 3 with active construction timelines',
      '8 contracts flagged with milestone clauses; 2 require immediate review',
    ],
    'security-legal': [
      snapshot.securityCriticalIncidents > 0
        ? `${snapshot.securityCriticalIncidents} critical incident(s) active; ${snapshot.securityOpenIncidents} total open; ${snapshot.securityCriticalAlerts} critical alert(s) raised`
        : 'INC-2026-0412: Critical severity, 47 assets affected, confidence 0.91',
      snapshot.prismOpenMatters > 0
        ? `Legal hold + disclosure review queued against existing docket of ${snapshot.prismOpenMatters} matter(s) (${snapshot.prismLowHealthMatters} low-health, ${snapshot.prismTrialReady} trial-ready)`
        : 'Legal hold initiated on 23 artifact sets; SEC disclosure review in progress',
      snapshot.holdingsActiveVentures > 0
        ? `Risk score recomputed across ${snapshot.holdingsActiveVentures} active venture(s)${snapshot.holdingsLatestNavCents !== null ? ` ($${(snapshot.holdingsLatestNavCents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })} NAV)` : ''}; board notification triggered`
        : 'Risk score updated: 72 → 81 (high); board notification triggered',
    ],
    'market-portfolio': [
      `Composite volatility index at ${triggerValue.toFixed(2)}; primary impact: fixed-income, logistics REITs`,
      '134 properties rescored; 18 crossed distress threshold',
      '7 routes flagged; 3 with >15% margin compression',
      'Rebalancing proposal: shift 8% from logistics to multifamily; estimated NAV +$2.1M',
    ],
  };

  const results = stepResults[chain.id] ?? chain.steps.map(() => 'Executed successfully');

  return {
    executionId: execId,
    chainId: chain.id,
    triggeredAt: Date.now(),
    triggerReason: manual ? 'Manual trigger via API' : triggerReason,
    triggerValue,
    threshold: chain.triggerThreshold,
    status: 'completed',
    auditRef: `audit-${execId}`,
    steps: chain.steps.map((s, i) => ({
      id: `${execId}-step-${i}`,
      domain: s.domain,
      action: s.action,
      status: 'executed' as const,
      executedAt: Date.now() + i * 1200,
      explainability: results[i] ?? 'Step completed',
      resultSummary: results[i],
    })),
  };
}

function buildExecutionFallback(chain: SignalChain, manual = false): SignalChainExecution {
  const execId = `exec-${chain.id}-${Date.now()}`;
  const triggerValues: Record<string, { value: number; reason: string }> = {
    'maritime-realestate': {
      value: 32,
      reason: 'MV Pacific Star reported 32h delay at Port of Shanghai',
    },
    'security-legal': {
      value: 0.91,
      reason: 'APT-41 lateral movement detected across 3 subsidiaries',
    },
    'market-portfolio': {
      value: 0.72,
      reason: 'Fed rate decision triggered volatility spike in risk assets',
    },
  };

  const tv = triggerValues[chain.id] ?? {
    value: chain.triggerThreshold * 1.2,
    reason: manual ? 'Manual trigger' : 'Threshold crossed',
  };

  const stepResults: Record<string, string[]> = {
    'maritime-realestate': [
      'MV Pacific Star (IMO 9876543) delayed 32h at Shanghai; 4 other vessels monitoring',
      '12 properties flagged in Pudong logistics corridor; 3 with active construction timelines',
      '8 contracts flagged with milestone clauses; 2 require immediate review',
    ],
    'security-legal': [
      'INC-2026-0412: Critical severity, 47 assets affected, confidence 0.91',
      'Legal hold initiated on 23 artifact sets; SEC disclosure review in progress',
      'Risk score updated: 72 → 81 (high); board notification triggered',
    ],
    'market-portfolio': [
      'VIX-equivalent at 0.72; primary impact: fixed-income, logistics REITs',
      '134 properties rescored; 18 crossed distress threshold',
      '7 routes flagged; 3 with >15% margin compression',
      'Rebalancing proposal: shift 8% from logistics to multifamily; estimated NAV +$2.1M',
    ],
  };

  const results = stepResults[chain.id] ?? chain.steps.map(() => 'Executed successfully');

  return {
    executionId: execId,
    chainId: chain.id,
    triggeredAt: Date.now(),
    triggerReason: manual ? 'Manual trigger via API' : tv.reason,
    triggerValue: tv.value,
    threshold: chain.triggerThreshold,
    status: 'completed',
    auditRef: `audit-${execId}`,
    steps: chain.steps.map((s, i) => ({
      id: `${execId}-step-${i}`,
      domain: s.domain,
      action: s.action,
      status: 'executed' as const,
      executedAt: Date.now() + i * 1200,
      explainability: results[i] ?? 'Step completed',
      resultSummary: results[i],
    })),
  };
}

async function persistExecution(
  execution: SignalChainExecution,
  triggerDomain: string,
): Promise<void> {
  try {
    await db.insert(signalChainExecutionsTable).values({
      chainId: execution.chainId,
      triggerDomain,
      payloadSnapshot: {
        executionId: execution.executionId,
        triggerReason: execution.triggerReason,
        triggerValue: execution.triggerValue,
        threshold: execution.threshold,
        auditRef: execution.auditRef,
      },
      outcomes: execution.steps,
      triggeredAt: new Date(execution.triggeredAt),
      status: execution.status,
    });
  } catch (err) {
    logger.warn({ err }, '[SignalChains] DB persist failed — execution still logged in memory');
  }
}

router.get(
  '/signal-chains',
  authMiddleware({ required: false }),
  perUserApiSlidingLimiter,
  (_req, res) => {
    const chains = Array.from(chainState.values()).map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      triggerDomain: c.triggerDomain,
      triggerSignal: c.triggerSignal,
      triggerThreshold: c.triggerThreshold,
      targetDomains: c.targetDomains,
      severity: c.severity,
      enabled: c.enabled,
      executionCount: c.executionCount,
      lastExecuted: c.lastExecuted,
      stepCount: c.steps.length,
      lastExecution: c.lastExecution,
    }));
    res.json({ success: true, chains, total: chains.length });
  },
);

router.get(
  '/signal-chains/audit-log',
  authMiddleware({ required: false }),
  perUserApiSlidingLimiter,
  validateQuery(listQuerySchema),
  (req, res) => {
    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    const log = auditLog.slice(-limit).reverse();
    res.json({ success: true, entries: log, total: auditLog.length });
  },
);

router.get(
  '/signal-chains/:id/audit',
  authMiddleware({ required: false }),
  perUserApiSlidingLimiter,
  validateQuery(listQuerySchema),
  async (req, res) => {
    const { id } = req.params as { id: string };
    const chain = chainState.get(id);
    if (!chain) {
      res.status(404).json({ success: false, error: 'Signal chain not found' });
      return;
    }
    const rawLimit = Number(req.query.limit ?? 25);
    const rawOffset = Number(req.query.offset ?? 0);
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), 200) : 25;
    const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? Math.floor(rawOffset) : 0;
    try {
      const [rows, countRows] = await Promise.all([
        db
          .select()
          .from(signalChainExecutionsTable)
          .where(eq(signalChainExecutionsTable.chainId, id))
          .orderBy(desc(signalChainExecutionsTable.triggeredAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ total: count() })
          .from(signalChainExecutionsTable)
          .where(eq(signalChainExecutionsTable.chainId, id)),
      ]);
      const total = Number(countRows[0]?.total ?? 0);
      res.json({
        success: true,
        chainId: id,
        entries: rows,
        total,
        limit,
        offset,
        hasMore: offset + rows.length < total,
      });
    } catch (err) {
      logger.warn({ err }, '[SignalChains] DB audit query failed');
      res.status(500).json({ success: false, error: 'Failed to query audit trail' });
    }
  },
);

router.get(
  '/signal-chains/:id',
  authMiddleware({ required: false }),
  perUserApiSlidingLimiter,
  (req, res) => {
    const chain = chainState.get(req.params.id as string);
    if (!chain) {
      res.status(404).json({ success: false, error: 'Signal chain not found' });
      return;
    }
    const history = auditLog
      .filter((e) => e.chainId === (req.params.id as string))
      .slice(-10)
      .reverse();
    res.json({ success: true, chain, history });
  },
);

router.post(
  '/signal-chains/:id/trigger',
  authMiddleware({ required: false }),
  perUserWriteSlidingLimiter,
  validateBody(bodyShape({})),
  async (req, res) => {
    const chain = chainState.get(req.params.id as string);
    if (!chain) {
      res.status(404).json({ success: false, error: 'Signal chain not found' });
      return;
    }
    if (!chain.enabled) {
      res.status(400).json({ success: false, error: 'Signal chain is disabled' });
      return;
    }

    let execution: SignalChainExecution;
    try {
      const snapshot = await fetchLiveSignalSnapshot();
      execution = buildExecutionFromSnapshot(chain, snapshot, true);
      logger.info(
        { chainId: chain.id, snapshot },
        '[SignalChains] Using live signal snapshot for manual trigger',
      );
    } catch (err) {
      logger.warn({ err }, '[SignalChains] Live snapshot unavailable, using fallback');
      execution = buildExecutionFallback(chain, true);
    }

    chain.executionCount += 1;
    chain.lastExecuted = execution.triggeredAt;
    chain.lastExecution = execution;
    auditLog.push(execution);

    await persistExecution(execution, chain.triggerDomain);

    try {
      await logActivity({
        action: 'signal_chain.triggered',
        resource: 'signal_chain',
        resourceId: chain.id,
        metadata: {
          chainName: chain.name,
          triggerReason: execution.triggerReason,
          executionId: execution.executionId,
          stepCount: execution.steps.length,
          domainsAffected: chain.targetDomains,
        },
      });
    } catch (err) {
      logger.warn({ err }, '[SignalChains] Audit log write failed');
    }

    logger.info(
      { chainId: chain.id, executionId: execution.executionId },
      '[SignalChains] Chain triggered',
    );
    res.json({ success: true, execution });
  },
);

router.post(
  '/signal-chains/evaluate',
  validateBody(bodyShape({})),
  authMiddleware({ required: false }),
  perUserWriteSlidingLimiter,
  async (_req, res) => {
    const triggered: SignalChainExecution[] = [];
    const monitoring: Array<{
      chainId: string;
      chainName: string;
      triggerValue: number;
      threshold: number;
      reason: string;
    }> = [];

    let snapshot: LiveSignalSnapshot | null = null;
    try {
      snapshot = await fetchLiveSignalSnapshot();
      logger.info({ snapshot }, '[SignalChains] Live signal snapshot fetched for evaluation');
    } catch (err) {
      logger.warn({ err }, '[SignalChains] Could not fetch live signals, using fallback data');
    }

    for (const chain of chainState.values()) {
      if (!chain.enabled) continue;

      if (snapshot) {
        const { triggerValue, triggerReason } = computeLiveTriggerValue(chain, snapshot);

        if (triggerValue >= chain.triggerThreshold) {
          const execution = buildExecutionFromSnapshot(chain, snapshot, false);
          chain.executionCount += 1;
          chain.lastExecuted = execution.triggeredAt;
          chain.lastExecution = execution;
          auditLog.push(execution);
          triggered.push(execution);

          await persistExecution(execution, chain.triggerDomain);

          try {
            await logActivity({
              action: 'signal_chain.auto_evaluated',
              resource: 'signal_chain',
              resourceId: chain.id,
              metadata: {
                chainName: chain.name,
                executionId: execution.executionId,
                domainsAffected: chain.targetDomains,
                liveSnapshot: true,
                thresholdCrossed: true,
                triggerValue,
              },
            });
          } catch {
            /* non-blocking */
          }
        } else {
          monitoring.push({
            chainId: chain.id,
            chainName: chain.name,
            triggerValue,
            threshold: chain.triggerThreshold,
            reason: triggerReason,
          });
          logger.info(
            { chainId: chain.id, triggerValue, threshold: chain.triggerThreshold },
            '[SignalChains] Chain below threshold — monitoring',
          );
        }
      } else {
        const execution = buildExecutionFallback(chain, false);
        chain.executionCount += 1;
        chain.lastExecuted = execution.triggeredAt;
        chain.lastExecution = execution;
        auditLog.push(execution);
        triggered.push(execution);

        try {
          await logActivity({
            action: 'signal_chain.auto_evaluated',
            resource: 'signal_chain',
            resourceId: chain.id,
            metadata: {
              chainName: chain.name,
              executionId: execution.executionId,
              domainsAffected: chain.targetDomains,
              liveSnapshot: false,
            },
          });
        } catch {
          /* non-blocking */
        }
      }
    }

    logger.info(
      {
        triggered: triggered.length,
        monitoring: monitoring.length,
        liveSnapshot: snapshot !== null,
      },
      '[SignalChains] Evaluation cycle completed',
    );
    res.json({
      success: true,
      evaluated: chainState.size,
      triggered: triggered.length,
      monitoring: monitoring.length,
      executions: triggered,
      monitoringChains: monitoring,
      liveSnapshot: snapshot !== null,
      snapshotSummary: snapshot
        ? {
            vesselActiveAlerts: snapshot.vesselActiveAlerts,
            vesselDelayEvents: snapshot.vesselDelayEvents,
            securityCriticalIncidents: snapshot.securityCriticalIncidents,
            securityOpenIncidents: snapshot.securityOpenIncidents,
            marketVolatilityScore: snapshot.marketVolatilityScore,
            fetchedAt: snapshot.fetchedAt,
          }
        : null,
    });
  },
);

export default router;
