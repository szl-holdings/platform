import { logger } from "./logger.js";
import { knowledgeStore, createKnowledgeEntry, persistAgentRun, type KnowledgeDomain } from "./knowledge-store.js";
import { agentEventBus, type AgentEventType } from "./event-bus.js";
import { services } from "@workspace/services";
import type { ChatMessage } from "@workspace/services";
import { serverTelemetry } from "@workspace/observability";
import { db, agentKnowledgeTable, agentRunsTable } from "@workspace/db";
import { lt } from "drizzle-orm";

export interface AgentSchedule {
  agentId: string;
  name: string;
  domain: KnowledgeDomain;
  intervalMs: number;
  enabled: boolean;
  taskDescription: string;
  systemPrompt: string;
  analysisPrompt: () => Promise<string>;
  lastRunAt?: number;
  nextRunAt?: number;
}

export interface AgentRunRecord {
  runId: string;
  agentId: string;
  domain: KnowledgeDomain;
  startedAt: number;
  completedAt?: number;
  status: "running" | "completed" | "failed";
  summary?: string;
  knowledgeEntryIds: string[];
  eventsPublished: string[];
  error?: string;
  durationMs?: number;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runAgentAnalysis(
  systemPrompt: string,
  userPrompt: string,
  maxRetries = 3,
  baseUrl?: string,
): Promise<string> {
  const ai = services.ai;
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await ai.chatCompletion(messages, { model: "gpt-4o-mini", maxTokens: 800 });
      return result.content;
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries) {
        const backoffMs = Math.pow(2, attempt) * 500;
        logger.warn({ err, attempt, backoffMs }, "Agent analysis attempt failed, retrying");
        await sleep(backoffMs);
      }
    }
  }
  logger.error({ err: lastErr }, "Agent analysis failed after all retries");
  return "Unable to generate analysis at this time.";
}

function parseFindingsFromText(text: string): Array<{ title: string; severity: string; summary: string; tags: string[] }> {
  const findings: Array<{ title: string; severity: string; summary: string; tags: string[] }> = [];
  const blocks = text.split(/FINDING:/i).slice(1);

  for (const block of blocks) {
    const titleMatch = block.match(/^(.+?)(?:\n|SEVERITY:)/i);
    const severityMatch = block.match(/SEVERITY:\s*([^\n]+)/i);
    const summaryMatch = block.match(/SUMMARY:\s*([^\n]+(?:\n(?!TAGS:|FINDING:)[^\n]+)*)/i);
    const tagsMatch = block.match(/TAGS:\s*([^\n]+)/i);

    if (titleMatch && summaryMatch) {
      const severity = severityMatch?.[1]?.trim().toLowerCase() ?? "medium";
      const tags = tagsMatch?.[1]?.split(",").map(t => t.trim()).filter(Boolean) ?? [];
      findings.push({
        title: titleMatch[1]?.trim() ?? "Finding",
        severity: ["low", "medium", "high", "critical"].includes(severity) ? severity : "medium",
        summary: summaryMatch[1]?.trim() ?? "",
        tags,
      });
    }
  }

  if (findings.length === 0 && text.length > 20) {
    findings.push({
      title: "Autonomous Scan Complete",
      severity: "info",
      summary: text.slice(0, 300),
      tags: ["scan", "automated"],
    });
  }

  return findings;
}

const MAX_RUN_HISTORY = 50;
const DB_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
const DB_CLEANUP_MAX_AGE_DAYS = 7;

export class AgentScheduler {
  private schedules: Map<string, AgentSchedule> = new Map();
  private timers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private runHistory: AgentRunRecord[] = [];
  private isRunning = false;
  private activeAgents: Set<string> = new Set();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  register(schedule: AgentSchedule) {
    this.schedules.set(schedule.agentId, schedule);
    const now = Date.now();
    schedule.nextRunAt = now + schedule.intervalMs;
    logger.info({ agentId: schedule.agentId, intervalMs: schedule.intervalMs }, "Agent schedule registered");
  }

  start(defaultSchedules: AgentSchedule[] = []) {
    if (this.isRunning) return;
    this.isRunning = true;

    for (const schedule of defaultSchedules) {
      this.register(schedule);
    }

    for (const [agentId, schedule] of this.schedules) {
      if (!schedule.enabled) continue;
      const initialDelay = Math.random() * Math.min(schedule.intervalMs, 60000);
      setTimeout(() => {
        this.runAgent(agentId).catch(err => {
          logger.error({ err, agentId }, "Initial agent run failed");
        });
        const timer = setInterval(() => {
          this.runAgent(agentId).catch(err => {
            logger.error({ err, agentId }, "Scheduled agent run failed");
          });
        }, schedule.intervalMs);
        timer.unref();
        this.timers.set(agentId, timer);
      }, initialDelay);
    }

    this.cleanupTimer = setInterval(() => {
      this.pruneOldDbRecords().catch(err => {
        logger.warn({ err }, "Agent scheduler: DB cleanup failed");
      });
    }, DB_CLEANUP_INTERVAL_MS);
    this.cleanupTimer.unref();

    logger.info({ agentCount: this.schedules.size }, "Agent scheduler started");
  }

  stop() {
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.isRunning = false;
    logger.info("Agent scheduler stopped");
  }

  private async pruneOldDbRecords(): Promise<void> {
    try {
      const cutoff = Date.now() - DB_CLEANUP_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
      const [knowledgeResult, runsResult] = await Promise.all([
        db.delete(agentKnowledgeTable).where(lt(agentKnowledgeTable.timestamp, cutoff)),
        db.delete(agentRunsTable).where(lt(agentRunsTable.startedAt, cutoff)),
      ]);
      const deletedKnowledge = knowledgeResult.rowCount ?? 0;
      const deletedRuns = runsResult.rowCount ?? 0;
      if (deletedKnowledge > 0 || deletedRuns > 0) {
        logger.info({ deletedKnowledge, deletedRuns, maxAgeDays: DB_CLEANUP_MAX_AGE_DAYS }, "Agent scheduler: pruned old DB records");
      }
    } catch (err) {
      logger.warn({ err }, "Agent scheduler: DB pruning error (non-fatal)");
    }
  }

  async runAgent(agentId: string): Promise<AgentRunRecord> {
    const schedule = this.schedules.get(agentId);
    if (!schedule) throw new Error(`Agent schedule not found: ${agentId}`);

    if (this.activeAgents.has(agentId)) {
      logger.warn({ agentId }, "Agent run skipped — previous run still in progress");
      const skipped: AgentRunRecord = {
        runId: `skipped-${agentId}-${Date.now()}`,
        agentId,
        domain: schedule.domain,
        startedAt: Date.now(),
        completedAt: Date.now(),
        durationMs: 0,
        status: "failed",
        error: "Skipped: previous run still in progress",
        knowledgeEntryIds: [],
        eventsPublished: [],
      };
      return skipped;
    }

    this.activeAgents.add(agentId);

    const runId = `run-${agentId}-${Date.now()}`;
    const record: AgentRunRecord = {
      runId,
      agentId,
      domain: schedule.domain,
      startedAt: Date.now(),
      status: "running",
      knowledgeEntryIds: [],
      eventsPublished: [],
    };

    this.runHistory.unshift(record);
    if (this.runHistory.length > MAX_RUN_HISTORY) {
      this.runHistory.length = MAX_RUN_HISTORY;
    }

    schedule.lastRunAt = Date.now();
    schedule.nextRunAt = Date.now() + schedule.intervalMs;

    logger.info({ runId, agentId, domain: schedule.domain }, "Agent run started");

    try {
      const prompt = await schedule.analysisPrompt();
      const analysis = await runAgentAnalysis(schedule.systemPrompt, prompt);

      const findings = parseFindingsFromText(analysis);

      for (const finding of findings) {
        const severityToConfidence: Record<string, number> = {
          critical: 0.95, high: 0.85, medium: 0.75, low: 0.65, info: 0.6,
        };
        const confidence = severityToConfidence[finding.severity] ?? 0.75;

        const entry = createKnowledgeEntry({
          type: finding.severity === "critical" || finding.severity === "high" ? "alert" : "observation",
          domain: schedule.domain,
          sourceAgent: agentId,
          title: finding.title,
          summary: finding.summary,
          confidence,
          tags: [...finding.tags, schedule.domain, "autonomous"],
          data: { severity: finding.severity, rawFinding: finding },
          ttlMs: 6 * 60 * 60 * 1000,
        });

        record.knowledgeEntryIds.push(entry.id);

        const correlations = knowledgeStore.findCorrelations(entry);
        if (correlations.length > 0) {
          const correlationEntry = createKnowledgeEntry({
            type: "correlation",
            domain: "global",
            sourceAgent: "correlation-engine",
            title: `Cross-domain signal: ${entry.title}`,
            summary: `Finding from ${schedule.domain} correlates with ${correlations.length} signal(s) from ${correlations.map(c => c.domain).join(", ")}.`,
            confidence: Math.min(0.9, confidence + 0.1),
            tags: ["correlation", "cross-domain", schedule.domain, ...correlations.map(c => c.domain)],
            data: {
              primaryEntryId: entry.id,
              correlatedEntryIds: correlations.map(c => c.id),
              domains: [schedule.domain, ...correlations.map(c => c.domain)],
            },
            ttlMs: 4 * 60 * 60 * 1000,
          });
          record.knowledgeEntryIds.push(correlationEntry.id);

          const correlationEvent = await agentEventBus.publish({
            type: "correlation_found",
            sourceAgent: "correlation-engine",
            sourceDomain: schedule.domain,
            severity: "medium",
            payload: {
              primaryEntry: entry,
              correlatedEntries: correlations,
              correlationEntryId: correlationEntry.id,
            },
          });
          record.eventsPublished.push(correlationEvent.id);
        }

        const severityMap: Record<string, "info" | "low" | "medium" | "high" | "critical"> = {
          info: "info", low: "low", medium: "medium", high: "high", critical: "critical",
        };
        const eventSeverity = severityMap[finding.severity] ?? "medium";
        const eventTypeMap: Record<KnowledgeDomain, AgentEventType> = {
          vessels: "route_anomaly",
          firestorm: "threat_identified",
          lyte: "health_degraded",
          inca: "insight_generated",
          terra: "alert_raised",
          msp: "alert_raised",
          dreamscape: "insight_generated",
          "readiness-report": "insight_generated",
          global: "cross_domain_signal",
        };

        const event = await agentEventBus.publish({
          type: eventTypeMap[schedule.domain] ?? "insight_generated",
          sourceAgent: agentId,
          sourceDomain: schedule.domain,
          severity: eventSeverity,
          payload: {
            finding,
            knowledgeEntryId: entry.id,
            domain: schedule.domain,
          },
          correlationId: runId,
        });
        record.eventsPublished.push(event.id);
      }

      const completedEvent = await agentEventBus.publish({
        type: "scheduled_run_complete",
        sourceAgent: agentId,
        sourceDomain: schedule.domain,
        severity: "info",
        payload: {
          runId,
          findingsCount: findings.length,
          domain: schedule.domain,
        },
        correlationId: runId,
      });
      record.eventsPublished.push(completedEvent.id);

      const totalFindings = findings.length;
      record.status = "completed";
      record.completedAt = Date.now();
      record.durationMs = record.completedAt - record.startedAt;
      record.summary = `Completed scan: ${totalFindings} finding(s) identified.`;

      logger.info({ runId, agentId, domain: schedule.domain, findings: totalFindings, durationMs: record.durationMs }, "Agent run completed");

      serverTelemetry.recordBusinessEvent({
        type: "workflow_completed",
        domain: schedule.domain,
        durationMs: record.durationMs,
        success: true,
        count: totalFindings,
        metadata: { agentId, runId, findingsCount: totalFindings },
      });

      persistAgentRun(record).catch(() => {});
    } catch (err) {
      record.status = "failed";
      record.completedAt = Date.now();
      record.durationMs = record.completedAt - record.startedAt;
      record.error = err instanceof Error ? err.message : String(err);

      agentEventBus.publish({
        type: "scheduled_run_failed",
        sourceAgent: agentId,
        sourceDomain: schedule.domain,
        severity: "low",
        payload: { runId, error: record.error },
        correlationId: runId,
      }).catch(() => {});

      logger.error({ err, runId, agentId }, "Agent run failed");

      serverTelemetry.recordBusinessEvent({
        type: "workflow_failed",
        domain: schedule.domain,
        durationMs: record.durationMs,
        success: false,
        metadata: { agentId, runId, error: record.error },
      });

      persistAgentRun(record).catch(() => {});
    } finally {
      this.activeAgents.delete(agentId);
    }

    return record;
  }

  getSchedules(): AgentSchedule[] {
    return Array.from(this.schedules.values()).map(s => ({ ...s, analysisPrompt: undefined as unknown as AgentSchedule["analysisPrompt"] }));
  }

  getRunHistory(options: { agentId?: string; domain?: string; limit?: number } = {}): AgentRunRecord[] {
    let results = this.runHistory;
    if (options.agentId) results = results.filter(r => r.agentId === options.agentId);
    if (options.domain) results = results.filter(r => r.domain === options.domain);
    return results.slice(0, options.limit ?? 50);
  }

  getStats() {
    const byAgent: Record<string, { total: number; succeeded: number; failed: number; lastRun?: number; avgDurationMs: number }> = {};

    for (const record of this.runHistory) {
      if (!byAgent[record.agentId]) {
        byAgent[record.agentId] = { total: 0, succeeded: 0, failed: 0, avgDurationMs: 0 };
      }
      const stat = byAgent[record.agentId]!;
      stat.total++;
      if (record.status === "completed") stat.succeeded++;
      if (record.status === "failed") stat.failed++;
      if (!stat.lastRun || record.startedAt > stat.lastRun) stat.lastRun = record.startedAt;
      if (record.durationMs) {
        stat.avgDurationMs = (stat.avgDurationMs * (stat.total - 1) + record.durationMs) / stat.total;
      }
    }

    return {
      isRunning: this.isRunning,
      agentCount: this.schedules.size,
      totalRuns: this.runHistory.length,
      byAgent,
      schedules: this.getSchedules().map(s => ({
        agentId: s.agentId,
        name: s.name,
        domain: s.domain,
        intervalMs: s.intervalMs,
        enabled: s.enabled,
        taskDescription: s.taskDescription,
        lastRunAt: s.lastRunAt,
        nextRunAt: s.nextRunAt,
      })),
    };
  }
}

export const agentScheduler = new AgentScheduler();
