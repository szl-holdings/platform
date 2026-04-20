export {
  type AgentRunRecord,
  type AgentSchedule,
  AgentScheduler,
  agentScheduler,
} from '@szl-holdings/forge-runtime';

import { db, guardianActionsTable, guardianApprovalRequestsTable } from '@szl-holdings/db';
import {
  agentExecutionRuntime,
  agentScheduler,
  durableScheduler,
  seedDefaultSchedules,
} from '@szl-holdings/forge-runtime';
import { computeApprovalExpiresAt } from '@workspace/guardian';
import { createHash } from 'crypto';
import { eq } from 'drizzle-orm';
import { runAtlasCompaction } from '../jobs/atlas-compaction';
import { publishGuardianDecisionEvent } from './guardian-engine';
import { logger } from './logger';
import {
  evaluateAllCovenants,
  recordCovenantEvaluation,
  seedCovenantsFromDistress,
} from './terra-covenant-store';

const BASE_URL = `http://localhost:${process.env['PORT'] || 3000}`;

function getInternalHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = process.env['ALLOY_INTERNAL_TOKEN'];
  if (token) headers['x-internal-token'] = token;
  return headers;
}

async function fetchData(path: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const resp = await fetch(`${BASE_URL}${path}`, {
      signal: controller.signal,
      headers: getInternalHeaders(),
    });
    if (!resp.ok) {
      logger.warn({ status: resp.status, path }, 'Agent fetchData non-OK response');
      return null;
    }
    return resp.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export { BASE_URL, fetchData, getInternalHeaders };

function covenantBreachRequestId(propertyId: string, breachType: string): string {
  return createHash('sha256')
    .update(`terra-covenant-breach:${propertyId}:${breachType}`)
    .digest('hex')
    .slice(0, 36);
}

/**
 * Scan all active covenants in the terra_covenants table, measure them against
 * live financials from the property registry, and dispatch guardian approval
 * requests for any breaches detected. Safe to re-run: onConflictDoNothing
 * prevents duplicates via the deterministic requestId built from
 * (propertyExternalId, covenantType).
 *
 * If the covenants table is empty, seed it from the distress registry first so
 * the monitor has a real working set on first run.
 */
export async function dispatchCovenantBreaches(): Promise<{
  evaluated: number;
  breaches: number;
  approvalsCreated: number;
  seeded: number;
}> {
  let seeded = 0;
  try {
    let measurements = await evaluateAllCovenants();
    if (measurements.length === 0) {
      seeded = await seedCovenantsFromDistress(12);
      if (seeded > 0) measurements = await evaluateAllCovenants();
    }

    let approvalsCreated = 0;
    let breachCount = 0;
    const env = process.env['NODE_ENV'] === 'production' ? 'production' : 'development';

    for (const m of measurements) {
      // Persist this evaluation on the covenant row regardless of status.
      await recordCovenantEvaluation(m.covenant.id, m);

      if (m.status !== 'breach') continue;
      breachCount += 1;

      const requestId = covenantBreachRequestId(
        m.covenant.propertyExternalId,
        m.covenant.covenantType,
      );
      const existing = await db
        .select({ id: guardianActionsTable.id })
        .from(guardianActionsTable)
        .where(eq(guardianActionsTable.requestId, requestId))
        .limit(1);
      if (existing.length > 0) continue;

      const reason =
        `Covenant breach on ${m.covenant.propertyAddress}: ${m.covenant.covenantType.toUpperCase()} ` +
        `${m.covenant.comparator === 'gte' ? '≥' : '≤'} ${m.covenant.thresholdValue} ` +
        `— measured ${m.measuredValue}. Loan agreement ${m.covenant.loanAgreementId ?? '(linked)'}. ` +
        `Lender: ${m.covenant.lender}.`;

      const payload = {
        covenantId: m.covenant.id,
        propertyId: m.covenant.propertyExternalId,
        address: m.covenant.propertyAddress,
        lender: m.covenant.lender,
        loanAgreementId: m.covenant.loanAgreementId,
        loanAgreementUrl: m.covenant.loanAgreementUrl,
        covenantType: m.covenant.covenantType,
        threshold: Number(m.covenant.thresholdValue),
        comparator: m.covenant.comparator,
        measuredValue: m.measuredValue,
        evidence: m.evidence,
        remedyPeriodDays: m.covenant.remedyPeriodDays,
      };

      const decidedAt = new Date();
      const [inserted] = await db
        .insert(guardianActionsTable)
        .values({
          requestId,
          agentId: 'terra-covenant-monitor',
          sessionId: `sched-${Date.now()}`,
          orgId: null,
          tier: 'supervised',
          action: 'covenant_breach_review',
          toolId: 'covenant-monitor',
          model: 'terra-cognitive-v1',
          environment: env,
          outcome: 'require-approval',
          matchedRuleId: 'terra-covenant-t1',
          reason,
          rollbackRequired: false,
          redactApplied: false,
          controlViolations: [],
          payload,
          decidedAt,
        })
        .onConflictDoNothing()
        .returning();

      if (inserted) {
        publishGuardianDecisionEvent({
          id: inserted.id,
          requestId,
          agentId: 'terra-covenant-monitor',
          sessionId: inserted.sessionId,
          workflowId: null,
          orgId: null,
          tier: 'supervised',
          action: 'covenant_breach_review',
          toolId: 'covenant-monitor',
          model: 'terra-cognitive-v1',
          environment: env,
          decision: 'require-approval',
          matchedRuleId: 'terra-covenant-t1',
          reason,
          rollbackRequired: false,
          controlViolations: [],
          domain: 'real-estate',
          latencyMs: null,
          traceId: null,
          traceStatus: null,
          decidedAt: decidedAt.toISOString(),
        });
        await db
          .insert(guardianApprovalRequestsTable)
          .values({
            requestId,
            agentId: 'terra-covenant-monitor',
            sessionId: `sched-${Date.now()}`,
            orgId: null,
            tier: 'supervised',
            action: 'covenant_breach_review',
            toolId: 'covenant-monitor',
            approvalType: 'single',
            status: 'pending',
            requiredApprovers: m.covenant.requiredApprovers ?? ['terra-risk-officer'],
            approvals: [],
            payload,
            expiresAt: computeApprovalExpiresAt('supervised'),
          })
          .onConflictDoNothing();
        approvalsCreated += 1;
        logger.info(
          {
            requestId,
            propertyId: m.covenant.propertyExternalId,
            covenantType: m.covenant.covenantType,
            measured: m.measuredValue,
            threshold: m.covenant.thresholdValue,
          },
          '[terra-covenant-monitor] Guardian approval request dispatched',
        );
      }
    }

    logger.info(
      { evaluated: measurements.length, breaches: breachCount, approvalsCreated, seeded },
      '[terra-covenant-monitor] Covenant breach scan complete',
    );
    return { evaluated: measurements.length, breaches: breachCount, approvalsCreated, seeded };
  } catch (err) {
    logger.warn({ err }, '[terra-covenant-monitor] Guardian dispatch failed (non-fatal)');
    return { evaluated: 0, breaches: 0, approvalsCreated: 0, seeded };
  }
}

function safeSerialize(data: unknown, maxLen: number): string {
  if (data == null) return 'null';
  try {
    if (Array.isArray(data)) {
      const limited = data.slice(0, 20);
      const s = JSON.stringify(limited);
      return s.length > maxLen ? s.slice(0, maxLen) + '...' : s;
    }
    const s = JSON.stringify(data);
    return s.length > maxLen ? s.slice(0, maxLen) + '...' : s;
  } catch {
    return '[unserializable]';
  }
}

function intervalToCron(intervalMs: number): string {
  const minutes = Math.round(intervalMs / 60_000);
  if (minutes < 60) return `*/${minutes} * * * *`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `0 */${hours} * * *`;
  return `0 0 * * *`;
}

export async function registerDefaultSchedules(): Promise<void> {
  const schedules = [
    {
      agentId: 'vessels-autonomous',
      name: 'Vessels Fleet Monitor',
      domain: 'vessels' as const,
      intervalMs: 30 * 60 * 1000,
      enabled: true,
      taskDescription:
        'Scan AIS data for anomalies, check sanctions matches, monitor chokepoint congestion',
      systemPrompt: `You are an autonomous maritime intelligence agent. Analyze the provided fleet data and generate concise intelligence findings. Focus on: vessel anomalies, sanctions risks, chokepoint congestion, and route deviations. Be specific and actionable. Respond in 2-3 sentences max per finding.`,
      analysisPrompt: async () => {
        const [vessels, chokepoints, sanctions] = await Promise.all([
          fetchData('/api/intelligence/maritime/vessels'),
          fetchData('/api/intelligence/maritime/chokepoints'),
          fetchData('/api/intelligence/maritime/sanctions'),
        ]);
        return `Analyze this maritime data and identify the top 1-2 most significant findings or anomalies:\n\nVessels: ${safeSerialize(vessels, 2000)}\nChokepoints: ${safeSerialize(chokepoints, 1000)}\nSanctions: ${safeSerialize(sanctions, 500)}\n\nRespond with findings in this format:\nFINDING: [title]\nSEVERITY: [low|medium|high|critical]\nSUMMARY: [2-3 sentence summary]\nTAGS: [comma-separated tags]`;
      },
    },
    {
      agentId: 'firestorm-autonomous',
      name: 'Firestorm Threat Scanner',
      domain: 'firestorm' as const,
      intervalMs: 30 * 60 * 1000,
      enabled: true,
      taskDescription: 'Monitor threat feeds, scan for new CVEs, assess risk posture changes',
      systemPrompt: `You are an autonomous cybersecurity intelligence agent. Analyze the provided threat data and generate concise security findings. Focus on: critical threats, new CVEs, active incidents, and emerging attack patterns. Be specific and actionable. Respond in 2-3 sentences max per finding.`,
      analysisPrompt: async () => {
        const [threats, cves] = await Promise.all([
          fetchData('/api/intelligence/threats'),
          fetchData('/api/intelligence/cves'),
        ]);
        return `Analyze this security data and identify the top 1-2 most significant findings:\n\nThreats: ${safeSerialize(threats, 2000)}\nCVEs: ${safeSerialize(cves, 1000)}\n\nRespond with findings in this format:\nFINDING: [title]\nSEVERITY: [low|medium|high|critical]\nSUMMARY: [2-3 sentence summary]\nTAGS: [comma-separated tags]`;
      },
    },
    {
      agentId: 'lyte-autonomous',
      name: 'Lyte System Health Monitor',
      domain: 'lyte' as const,
      intervalMs: 30 * 60 * 1000,
      enabled: true,
      taskDescription:
        'Check system health metrics, evaluate SLO compliance, detect performance degradation',
      systemPrompt: `You are an autonomous SRE observability agent. Analyze the provided system metrics and generate concise health findings. Focus on: service degradation, SLO breaches, anomalous patterns, and reliability risks. Be specific and actionable.`,
      analysisPrompt: async () => {
        const [health, signals] = await Promise.all([
          fetchData('/api/lyte/executive-summary'),
          fetchData('/api/lyte/signals'),
        ]);
        return `Analyze this system health data and identify the top 1-2 most significant findings:\n\nHealth: ${safeSerialize(health, 2000)}\nSignals: ${safeSerialize(signals, 1000)}\n\nRespond with findings in this format:\nFINDING: [title]\nSEVERITY: [low|medium|high|critical]\nSUMMARY: [2-3 sentence summary]\nTAGS: [comma-separated tags]`;
      },
    },
    {
      agentId: 'inca-autonomous',
      name: 'INCA Research Scanner',
      domain: 'inca' as const,
      intervalMs: 15 * 60 * 1000,
      enabled: true,
      taskDescription:
        'Monitor experiment results, evaluate model performance trends, identify research opportunities',
      systemPrompt: `You are an autonomous AI research intelligence agent. Analyze the provided experiment data and generate concise research findings. Focus on: model performance trends, experiment anomalies, and actionable research insights.`,
      analysisPrompt: async () => {
        const [experiments, models, insights] = await Promise.all([
          fetchData('/api/inca/experiments'),
          fetchData('/api/inca/models'),
          fetchData('/api/inca/insights'),
        ]);
        return `Analyze this research data and identify the top 1-2 most significant findings:\n\nExperiments: ${safeSerialize(experiments, 1500)}\nModels: ${safeSerialize(models, 800)}\nInsights: ${safeSerialize(insights, 500)}\n\nRespond with findings in this format:\nFINDING: [title]\nSEVERITY: [low|medium|high|critical]\nSUMMARY: [2-3 sentence summary]\nTAGS: [comma-separated tags]`;
      },
    },
    {
      agentId: 'terra-autonomous',
      name: 'Terra Market Monitor',
      domain: 'terra' as const,
      intervalMs: 15 * 60 * 1000,
      enabled: true,
      taskDescription:
        'Track geopolitical events, assess market impact on real estate, identify risk factors',
      systemPrompt: `You are an autonomous real estate market intelligence agent. Analyze geopolitical and market data to generate concise real estate investment findings. Focus on: market risks, geopolitical impacts, and emerging opportunities.`,
      analysisPrompt: async () => {
        const [geoEvents] = await Promise.all([fetchData('/api/intelligence/geopolitical')]);
        return `Analyze this geopolitical data for real estate market impact and identify the top 1-2 most significant findings:\n\nGeopolitical Events: ${safeSerialize(geoEvents, 2000)}\n\nRespond with findings in this format:\nFINDING: [title]\nSEVERITY: [low|medium|high|critical]\nSUMMARY: [2-3 sentence summary]\nTAGS: [comma-separated tags]`;
      },
    },
    {
      agentId: 'terra-covenant-monitor',
      name: 'Terra Covenant Monitor',
      domain: 'terra' as const,
      intervalMs: 24 * 60 * 60 * 1000,
      enabled: true,
      taskDescription:
        'Scan active distress properties for covenant metric deviations (DSCR, LTV, occupancy), dispatch guardian approval requests for breaches, and produce a daily covenant status digest.',
      systemPrompt: `You are an autonomous real estate covenant compliance agent. Analyze distress property data to identify covenant breaches and near-term risks. Focus on: DSCR deterioration, LTV threshold crossings, occupancy covenant failures, and auction proximity. Dispatch guardian approval requests for critical breaches.`,
      analysisPrompt: async () => {
        const [covenants, forecast] = await Promise.all([
          fetchData('/api/terra/cognitive/covenants'),
          fetchData('/api/terra/cognitive/distress-forecast?limit=10'),
        ]);
        return `Analyze this covenant and distress forecast data for the real estate portfolio and identify the top 1-2 most significant covenant compliance findings:\n\nCovenant Status: ${safeSerialize(covenants, 2000)}\nDistress Forecast: ${safeSerialize(forecast, 1000)}\n\nRespond with findings in this format:\nFINDING: [title]\nSEVERITY: [low|medium|high|critical]\nSUMMARY: [2-3 sentence summary]\nTAGS: [comma-separated tags]`;
      },
    },
    {
      agentId: 'nexus-autonomous',
      name: 'Nexus Cross-Domain Fusion Monitor',
      domain: 'global' as const,
      intervalMs: 6 * 60 * 60 * 1000,
      enabled: true,
      taskDescription:
        'Fuse signals across all intelligence domains, surface cross-domain patterns and situational awareness',
      systemPrompt: `You are an autonomous cross-domain fusion intelligence agent. Analyze signals from maritime, cyber, real estate, and financial domains to surface emergent cross-domain patterns, risks, and opportunities. Be specific and actionable.`,
      analysisPrompt: async () => {
        const [maritime, threats, geopolitical] = await Promise.all([
          fetchData('/api/intelligence/maritime/vessels'),
          fetchData('/api/intelligence/threats'),
          fetchData('/api/intelligence/geopolitical'),
        ]);
        return `Analyze these cross-domain signals and identify the top 1-2 most significant fused findings:\n\nMaritime: ${safeSerialize(maritime, 1000)}\nCyber Threats: ${safeSerialize(threats, 1000)}\nGeopolitical: ${safeSerialize(geopolitical, 1000)}\n\nRespond with findings in this format:\nFINDING: [title]\nSEVERITY: [low|medium|high|critical]\nSUMMARY: [2-3 sentence summary]\nTAGS: [comma-separated tags]`;
      },
    },
    {
      agentId: 'msp-autonomous',
      name: 'MSP Client Monitor',
      domain: 'msp' as const,
      intervalMs: 30 * 60 * 1000,
      enabled: true,
      taskDescription:
        'Check client SLA compliance, monitor ticket queue, identify service delivery risks',
      systemPrompt: `You are an autonomous managed services monitoring agent. Analyze client infrastructure and SLA data to generate concise service delivery findings. Focus on: SLA breaches, ticket patterns, and client health risks.`,
      analysisPrompt: async () => {
        const [health] = await Promise.all([fetchData('/api/services/health')]);
        return `Analyze this services data and identify the top 1-2 most significant findings for managed service delivery:\n\nServices Health: ${safeSerialize(health, 2000)}\n\nRespond with findings in this format:\nFINDING: [title]\nSEVERITY: [low|medium|high|critical]\nSUMMARY: [2-3 sentence summary]\nTAGS: [comma-separated tags]`;
      },
    },
  ];

  const durableScheduleEntries = [];
  for (const schedule of schedules) {
    agentScheduler.register(schedule);

    const jobType = `agent_run_${schedule.agentId.replace(/-/g, '_')}`;
    const cronExpression = intervalToCron(schedule.intervalMs);
    const capturedAgentId = schedule.agentId;
    const capturedDomain = schedule.domain;

    agentExecutionRuntime.registerAgent(
      {
        agentId: capturedAgentId,
        name: schedule.name,
        domain: capturedDomain,
        jobType,
        queue: 'agents',
        maxRetries: 0,
      },
      async (_job, ctx) => {
        // For the covenant monitor: dispatch guardian actions for critical
        // breaches BEFORE running the LLM narrative so the agent finding
        // can reference the already-created approval requests.
        if (capturedAgentId === 'terra-covenant-monitor') {
          await dispatchCovenantBreaches();
        }
        await agentScheduler.runAgent(capturedAgentId);
        await ctx.saveState({
          lastRunAt: new Date().toISOString(),
          runCount: ctx.runCount + 1,
          agentId: capturedAgentId,
        });
      },
    );

    durableScheduleEntries.push({
      name: `agent_schedule_${schedule.agentId.replace(/-/g, '_')}`,
      jobType,
      cronExpression,
      payload: { agentId: schedule.agentId },
      queue: 'agents',
      maxRetries: 0,
    });
  }

  agentExecutionRuntime.registerAgent(
    {
      agentId: 'atlas-snapshot-compactor',
      name: 'ATLAS Snapshot Compactor',
      domain: 'system',
      jobType: 'atlas_snapshot_compact',
      queue: 'maintenance',
      maxRetries: 1,
    },
    async (_job, ctx) => {
      const result = await runAtlasCompaction();
      await ctx.saveState({
        lastRunAt: new Date().toISOString(),
        runCount: ctx.runCount + 1,
        lastResult: result,
      });
    },
  );

  durableScheduleEntries.push({
    name: 'atlas_snapshot_compactor',
    jobType: 'atlas_snapshot_compact',
    cronExpression: '0 * * * *',
    payload: {},
    queue: 'maintenance',
    maxRetries: 1,
  });

  agentScheduler.startDurableMode();

  try {
    await seedDefaultSchedules(durableScheduleEntries);
    logger.info(
      { agentCount: schedules.length + 1 },
      'Default agent schedules registered and started',
    );
  } catch (err) {
    logger.warn({ err }, 'Agent durable schedule seeding failed (non-fatal)');
  }
}

logger.info('Agent scheduler initialized');
