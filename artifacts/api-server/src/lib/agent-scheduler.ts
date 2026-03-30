import { logger } from "./logger";
import { knowledgeStore, createKnowledgeEntry, persistAgentRun, type KnowledgeDomain } from "./knowledge-store";
import { agentEventBus, type AgentEventType } from "./event-bus";
import { services } from "@workspace/services";
import type { ChatMessage } from "@workspace/services";
import { serverTelemetry } from "@workspace/observability";

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

const BASE_URL = `http://localhost:${process.env["PORT"] || 3000}`;

function getInternalHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = process.env["ALLOY_INTERNAL_TOKEN"];
  if (token) headers["x-internal-token"] = token;
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
      logger.warn({ status: resp.status, path }, "Agent fetchData non-OK response");
      return null;
    }
    return resp.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runAgentAnalysis(systemPrompt: string, userPrompt: string, maxRetries = 3): Promise<string> {
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

const AGENT_SCHEDULES: AgentSchedule[] = [
  {
    agentId: "vessels-autonomous",
    name: "Vessels Fleet Monitor",
    domain: "vessels",
    intervalMs: 5 * 60 * 1000,
    enabled: true,
    taskDescription: "Scan AIS data for anomalies, check sanctions matches, monitor chokepoint congestion",
    systemPrompt: `You are an autonomous maritime intelligence agent. Analyze the provided fleet data and generate concise intelligence findings. Focus on: vessel anomalies, sanctions risks, chokepoint congestion, and route deviations. Be specific and actionable. Respond in 2-3 sentences max per finding.`,
    analysisPrompt: async () => {
      const [vessels, chokepoints, sanctions] = await Promise.all([
        fetchData("/api/intelligence/maritime/vessels"),
        fetchData("/api/intelligence/maritime/chokepoints"),
        fetchData("/api/intelligence/maritime/sanctions"),
      ]);
      return `Analyze this maritime data and identify the top 1-2 most significant findings or anomalies:\n\nVessels: ${JSON.stringify(vessels)?.slice(0, 2000)}\nChokepoints: ${JSON.stringify(chokepoints)?.slice(0, 1000)}\nSanctions: ${JSON.stringify(sanctions)?.slice(0, 500)}\n\nRespond with findings in this format:\nFINDING: [title]\nSEVERITY: [low|medium|high|critical]\nSUMMARY: [2-3 sentence summary]\nTAGS: [comma-separated tags]`;
    },
  },
  {
    agentId: "firestorm-autonomous",
    name: "Firestorm Threat Scanner",
    domain: "firestorm",
    intervalMs: 5 * 60 * 1000,
    enabled: true,
    taskDescription: "Monitor threat feeds, scan for new CVEs, assess risk posture changes",
    systemPrompt: `You are an autonomous cybersecurity intelligence agent. Analyze the provided threat data and generate concise security findings. Focus on: critical threats, new CVEs, active incidents, and emerging attack patterns. Be specific and actionable. Respond in 2-3 sentences max per finding.`,
    analysisPrompt: async () => {
      const [threats, cves] = await Promise.all([
        fetchData("/api/intelligence/threats"),
        fetchData("/api/intelligence/cves"),
      ]);
      return `Analyze this security data and identify the top 1-2 most significant findings:\n\nThreats: ${JSON.stringify(threats)?.slice(0, 2000)}\nCVEs: ${JSON.stringify(cves)?.slice(0, 1000)}\n\nRespond with findings in this format:\nFINDING: [title]\nSEVERITY: [low|medium|high|critical]\nSUMMARY: [2-3 sentence summary]\nTAGS: [comma-separated tags]`;
    },
  },
  {
    agentId: "lyte-autonomous",
    name: "Lyte System Health Monitor",
    domain: "lyte",
    intervalMs: 5 * 60 * 1000,
    enabled: true,
    taskDescription: "Check system health metrics, evaluate SLO compliance, detect performance degradation",
    systemPrompt: `You are an autonomous SRE observability agent. Analyze the provided system metrics and generate concise health findings. Focus on: service degradation, SLO breaches, anomalous patterns, and reliability risks. Be specific and actionable.`,
    analysisPrompt: async () => {
      const [health, signals] = await Promise.all([
        fetchData("/api/lyte/executive-summary"),
        fetchData("/api/lyte/signals"),
      ]);
      return `Analyze this system health data and identify the top 1-2 most significant findings:\n\nHealth: ${JSON.stringify(health)?.slice(0, 2000)}\nSignals: ${JSON.stringify(signals)?.slice(0, 1000)}\n\nRespond with findings in this format:\nFINDING: [title]\nSEVERITY: [low|medium|high|critical]\nSUMMARY: [2-3 sentence summary]\nTAGS: [comma-separated tags]`;
    },
  },
  {
    agentId: "inca-autonomous",
    name: "INCA Research Scanner",
    domain: "inca",
    intervalMs: 15 * 60 * 1000,
    enabled: true,
    taskDescription: "Monitor experiment results, evaluate model performance trends, identify research opportunities",
    systemPrompt: `You are an autonomous AI research intelligence agent. Analyze the provided experiment data and generate concise research findings. Focus on: model performance trends, experiment anomalies, and actionable research insights.`,
    analysisPrompt: async () => {
      const [experiments, models, insights] = await Promise.all([
        fetchData("/api/inca/experiments"),
        fetchData("/api/inca/models"),
        fetchData("/api/inca/insights"),
      ]);
      return `Analyze this research data and identify the top 1-2 most significant findings:\n\nExperiments: ${JSON.stringify(experiments)?.slice(0, 1500)}\nModels: ${JSON.stringify(models)?.slice(0, 800)}\nInsights: ${JSON.stringify(insights)?.slice(0, 500)}\n\nRespond with findings in this format:\nFINDING: [title]\nSEVERITY: [low|medium|high|critical]\nSUMMARY: [2-3 sentence summary]\nTAGS: [comma-separated tags]`;
    },
  },
  {
    agentId: "terra-autonomous",
    name: "Terra Market Monitor",
    domain: "terra",
    intervalMs: 15 * 60 * 1000,
    enabled: true,
    taskDescription: "Track geopolitical events, assess market impact on real estate, identify risk factors",
    systemPrompt: `You are an autonomous real estate market intelligence agent. Analyze geopolitical and market data to generate concise real estate investment findings. Focus on: market risks, geopolitical impacts, and emerging opportunities.`,
    analysisPrompt: async () => {
      const [geoEvents] = await Promise.all([
        fetchData("/api/intelligence/geopolitical"),
      ]);
      return `Analyze this geopolitical data for real estate market impact and identify the top 1-2 most significant findings:\n\nGeopolitical Events: ${JSON.stringify(geoEvents)?.slice(0, 2000)}\n\nRespond with findings in this format:\nFINDING: [title]\nSEVERITY: [low|medium|high|critical]\nSUMMARY: [2-3 sentence summary]\nTAGS: [comma-separated tags]`;
    },
  },
  {
    agentId: "msp-autonomous",
    name: "MSP Client Monitor",
    domain: "msp",
    intervalMs: 10 * 60 * 1000,
    enabled: true,
    taskDescription: "Check client SLA compliance, monitor ticket queue, identify service delivery risks",
    systemPrompt: `You are an autonomous managed services monitoring agent. Analyze client infrastructure and SLA data to generate concise service delivery findings. Focus on: SLA breaches, ticket patterns, and client health risks.`,
    analysisPrompt: async () => {
      const [health] = await Promise.all([
        fetchData("/api/services/health"),
      ]);
      return `Analyze this services data and identify the top 1-2 most significant findings for managed service delivery:\n\nServices Health: ${JSON.stringify(health)?.slice(0, 2000)}\n\nRespond with findings in this format:\nFINDING: [title]\nSEVERITY: [low|medium|high|critical]\nSUMMARY: [2-3 sentence summary]\nTAGS: [comma-separated tags]`;
    },
  },
  {
    agentId: "dreamscape-autonomous",
    name: "Dreamscape Creative Monitor",
    domain: "dreamscape",
    intervalMs: 30 * 60 * 1000,
    enabled: true,
    taskDescription: "Analyze campaign performance, identify content opportunities, track creative trends",
    systemPrompt: `You are an autonomous creative intelligence agent. Analyze campaign data to generate concise creative strategy findings. Focus on: campaign performance gaps, content opportunities, and emerging creative trends.`,
    analysisPrompt: async () => {
      const [campaigns] = await Promise.all([
        fetchData("/api/dreamscape/campaigns"),
      ]);
      return `Analyze this campaign data and identify the top 1-2 most significant findings:\n\nCampaigns: ${JSON.stringify(campaigns)?.slice(0, 2000)}\n\nRespond with findings in this format:\nFINDING: [title]\nSEVERITY: [low|medium|high|critical]\nSUMMARY: [2-3 sentence summary]\nTAGS: [comma-separated tags]`;
    },
  },
];

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

const MAX_RUN_HISTORY = 200;

class AgentScheduler {
  private schedules: Map<string, AgentSchedule> = new Map();
  private timers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private runHistory: AgentRunRecord[] = [];
  private isRunning = false;

  register(schedule: AgentSchedule) {
    this.schedules.set(schedule.agentId, schedule);
    const now = Date.now();
    schedule.nextRunAt = now + schedule.intervalMs;
    logger.info({ agentId: schedule.agentId, intervalMs: schedule.intervalMs }, "Agent schedule registered");
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    for (const schedule of AGENT_SCHEDULES) {
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
        this.timers.set(agentId, timer);
      }, initialDelay);
    }

    logger.info({ agentCount: this.schedules.size }, "Agent scheduler started");
  }

  stop() {
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();
    this.isRunning = false;
    logger.info("Agent scheduler stopped");
  }

  async runAgent(agentId: string): Promise<AgentRunRecord> {
    const schedule = this.schedules.get(agentId);
    if (!schedule) throw new Error(`Agent schedule not found: ${agentId}`);

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

      await agentEventBus.publish({
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

logger.info("Agent scheduler initialized");
