export {
  AgentScheduler,
  agentScheduler,
  type AgentSchedule,
  type AgentRunRecord,
} from "@szl-holdings/workflow-engine";

import { agentScheduler } from "@szl-holdings/workflow-engine";
import { logger } from "./logger";

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

export { fetchData, getInternalHeaders, BASE_URL };

function safeSerialize(data: unknown, maxLen: number): string {
  if (data == null) return "null";
  try {
    if (Array.isArray(data)) {
      const limited = data.slice(0, 20);
      const s = JSON.stringify(limited);
      return s.length > maxLen ? s.slice(0, maxLen) + "..." : s;
    }
    const s = JSON.stringify(data);
    return s.length > maxLen ? s.slice(0, maxLen) + "..." : s;
  } catch {
    return "[unserializable]";
  }
}

export function registerDefaultSchedules() {
  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

  const schedules = [
    {
      agentId: "vessels-autonomous",
      name: "Vessels Fleet Monitor",
      domain: "vessels" as const,
      intervalMs: SIX_HOURS_MS,
      enabled: true,
      taskDescription: "Scan AIS data for anomalies, check sanctions matches, monitor chokepoint congestion",
      systemPrompt: `You are an autonomous maritime intelligence agent. Analyze the provided fleet data and generate concise intelligence findings. Focus on: vessel anomalies, sanctions risks, chokepoint congestion, and route deviations. Be specific and actionable. Respond in 2-3 sentences max per finding.`,
      analysisPrompt: async () => {
        const [vessels, chokepoints, sanctions] = await Promise.all([
          fetchData("/api/intelligence/maritime/vessels"),
          fetchData("/api/intelligence/maritime/chokepoints"),
          fetchData("/api/intelligence/maritime/sanctions"),
        ]);
        return `Analyze this maritime data and identify the top 1-2 most significant findings or anomalies:\n\nVessels: ${safeSerialize(vessels, 2000)}\nChokepoints: ${safeSerialize(chokepoints, 1000)}\nSanctions: ${safeSerialize(sanctions, 500)}\n\nRespond with findings in this format:\nFINDING: [title]\nSEVERITY: [low|medium|high|critical]\nSUMMARY: [2-3 sentence summary]\nTAGS: [comma-separated tags]`;
      },
    },
    {
      agentId: "firestorm-autonomous",
      name: "Firestorm Threat Scanner",
      domain: "firestorm" as const,
      intervalMs: SIX_HOURS_MS,
      enabled: true,
      taskDescription: "Monitor threat feeds, scan for new CVEs, assess risk posture changes",
      systemPrompt: `You are an autonomous cybersecurity intelligence agent. Analyze the provided threat data and generate concise security findings. Focus on: critical threats, new CVEs, active incidents, and emerging attack patterns. Be specific and actionable. Respond in 2-3 sentences max per finding.`,
      analysisPrompt: async () => {
        const [threats, cves] = await Promise.all([
          fetchData("/api/intelligence/threats"),
          fetchData("/api/intelligence/cves"),
        ]);
        return `Analyze this security data and identify the top 1-2 most significant findings:\n\nThreats: ${safeSerialize(threats, 2000)}\nCVEs: ${safeSerialize(cves, 1000)}\n\nRespond with findings in this format:\nFINDING: [title]\nSEVERITY: [low|medium|high|critical]\nSUMMARY: [2-3 sentence summary]\nTAGS: [comma-separated tags]`;
      },
    },
    {
      agentId: "lyte-autonomous",
      name: "Lyte System Health Monitor",
      domain: "lyte" as const,
      intervalMs: SIX_HOURS_MS,
      enabled: true,
      taskDescription: "Check system health metrics, evaluate SLO compliance, detect performance degradation",
      systemPrompt: `You are an autonomous SRE observability agent. Analyze the provided system metrics and generate concise health findings. Focus on: service degradation, SLO breaches, anomalous patterns, and reliability risks. Be specific and actionable.`,
      analysisPrompt: async () => {
        const [health, signals] = await Promise.all([
          fetchData("/api/lyte/executive-summary"),
          fetchData("/api/lyte/signals"),
        ]);
        return `Analyze this system health data and identify the top 1-2 most significant findings:\n\nHealth: ${safeSerialize(health, 2000)}\nSignals: ${safeSerialize(signals, 1000)}\n\nRespond with findings in this format:\nFINDING: [title]\nSEVERITY: [low|medium|high|critical]\nSUMMARY: [2-3 sentence summary]\nTAGS: [comma-separated tags]`;
      },
    },
    {
      agentId: "inca-autonomous",
      name: "INCA Research Scanner",
      domain: "inca" as const,
      intervalMs: 60 * 60 * 1000,
      enabled: false,
      taskDescription: "Monitor experiment results, evaluate model performance trends, identify research opportunities",
      systemPrompt: `You are an autonomous AI research intelligence agent. Analyze the provided experiment data and generate concise research findings. Focus on: model performance trends, experiment anomalies, and actionable research insights.`,
      analysisPrompt: async () => {
        return "INCA app removed — agent disabled";
      },
    },
    {
      agentId: "terra-autonomous",
      name: "Terra Market Monitor",
      domain: "terra" as const,
      intervalMs: SIX_HOURS_MS,
      enabled: true,
      taskDescription: "Track geopolitical events, assess market impact on real estate, identify risk factors",
      systemPrompt: `You are an autonomous real estate market intelligence agent. Analyze geopolitical and market data to generate concise real estate investment findings. Focus on: market risks, geopolitical impacts, and emerging opportunities.`,
      analysisPrompt: async () => {
        const [geoEvents] = await Promise.all([
          fetchData("/api/intelligence/geopolitical"),
        ]);
        return `Analyze this geopolitical data for real estate market impact and identify the top 1-2 most significant findings:\n\nGeopolitical Events: ${safeSerialize(geoEvents, 2000)}\n\nRespond with findings in this format:\nFINDING: [title]\nSEVERITY: [low|medium|high|critical]\nSUMMARY: [2-3 sentence summary]\nTAGS: [comma-separated tags]`;
      },
    },
    {
      agentId: "msp-autonomous",
      name: "MSP Client Monitor",
      domain: "msp" as const,
      intervalMs: 60 * 60 * 1000,
      enabled: false,
      taskDescription: "Check client SLA compliance, monitor ticket queue, identify service delivery risks",
      systemPrompt: `You are an autonomous managed services monitoring agent.`,
      analysisPrompt: async () => {
        return "MSP app removed — agent disabled";
      },
    },
  ];

  const schedulesWithGc = schedules.map((schedule) => ({
    ...schedule,
    analysisPrompt: async () => {
      const prompt = await schedule.analysisPrompt();
      if (typeof global.gc === "function") global.gc();
      return prompt;
    },
  }));

  for (const schedule of schedulesWithGc) {
    agentScheduler.register(schedule);
  }

  agentScheduler.start();
  logger.info({ agentCount: schedules.length }, "Default agent schedules registered and started");
}

logger.info("Agent scheduler initialized");
