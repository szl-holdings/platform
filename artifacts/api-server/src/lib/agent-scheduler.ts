export {
  AgentScheduler,
  agentScheduler,
  type AgentSchedule,
  type AgentRunRecord,
} from "@workspace/workflow-engine";

import { agentScheduler } from "@workspace/workflow-engine";
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

export function registerDefaultSchedules() {
  const schedules = [
    {
      agentId: "vessels-autonomous",
      name: "Vessels Fleet Monitor",
      domain: "vessels" as const,
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
      domain: "firestorm" as const,
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
      domain: "lyte" as const,
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
      domain: "inca" as const,
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
      domain: "terra" as const,
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
      domain: "msp" as const,
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
  ];

  for (const schedule of schedules) {
    agentScheduler.register(schedule);
  }

  agentScheduler.start();
  logger.info({ agentCount: schedules.length }, "Default agent schedules registered and started");
}

logger.info("Agent scheduler initialized");
