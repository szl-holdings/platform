import { Router, type IRouter, type Request, type Response } from "express";
import { readLimiter } from "../middlewares/rate-limiters";

const router: IRouter = Router();

type TelemetryEventType =
  | "api_call"
  | "ai_inference"
  | "agent_task"
  | "compliance_check"
  | "signal_routed"
  | "data_sync"
  | "threat_detected"
  | "record_processed";

type Venture = "Vessels" | "Aegis" | "Terra" | "PRISM" | "Lyte" | "Alloy" | "SZL";

interface TelemetryEvent {
  id: string;
  ts: string;
  type: TelemetryEventType;
  venture: Venture;
  message: string;
  durationMs?: number;
  meta?: Record<string, string | number | boolean>;
}

interface EcosystemPulse {
  requestsPerSecond: number;
  activeAgents: number;
  dbOpsPerSecond: number;
  eventsProcessed: number;
  uptime: number;
}

interface VentureHealth {
  name: Venture;
  status: "operational" | "degraded" | "maintenance";
  latencyMs: number;
  uptimePct: number;
}

const VENTURES: Venture[] = ["Vessels", "Aegis", "Terra", "PRISM", "Lyte", "Alloy", "SZL"];

const VENTURE_EVENTS: Record<Venture, Array<{ type: TelemetryEventType; templates: string[] }>> = {
  Vessels: [
    { type: "api_call", templates: [
      "AIS position update processed — {n} active tracks",
      "Voyage ETA recalculated — {n} vessels updated",
      "Port call validation completed — {n} entries verified",
      "Sanctions screening batch finished — {n} entities cleared",
      "Fleet utilization snapshot computed — {n} vessels",
    ]},
    { type: "data_sync", templates: [
      "AIS feed ingestion cycle completed — {n} position deltas",
      "Port authority data reconciled — {n} records synced",
    ]},
    { type: "signal_routed", templates: [
      "Voyage anomaly signal dispatched to risk module",
      "Charter party event propagated to compliance queue",
    ]},
  ],
  Aegis: [
    { type: "threat_detected", templates: [
      "Credential stuffing pattern identified — {n} attempts blocked",
      "Anomalous API access detected — origin quarantined",
      "Privilege escalation attempt logged — alert raised",
      "Brute force signal classified — {n} IPs rate-limited",
    ]},
    { type: "ai_inference", templates: [
      "Threat correlation model inference completed — {n} signals evaluated",
      "Behavioral anomaly classifier ran — {n} entities scored",
      "Malware signature embedding lookup finished — {n} hashes checked",
    ]},
    { type: "compliance_check", templates: [
      "SOC audit log ingestion verified — {n} entries validated",
      "NIST control attestation processed — {n} controls mapped",
      "Incident classification completed — severity assigned",
    ]},
    { type: "agent_task", templates: [
      "SOC triage agent completed review cycle — {n} alerts triaged",
      "Threat hunt agent returned — {n} IOCs surfaced",
    ]},
  ],
  Terra: [
    { type: "record_processed", templates: [
      "Distress scoring cycle completed — {n} properties re-evaluated",
      "Property lien data ingested — {n} new records indexed",
      "Vacancy rate update processed — {n} addresses affected",
      "Tax default signal classified — {n} properties flagged",
    ]},
    { type: "ai_inference", templates: [
      "Property valuation model inference ran — {n} estimates updated",
      "Distress prediction pipeline executed — {n} signals scored",
    ]},
    { type: "signal_routed", templates: [
      "High-distress property alert routed to pipeline",
      "Market stress cluster signal dispatched to broker feed",
    ]},
  ],
  PRISM: [
    { type: "ai_inference", templates: [
      "Citation verification completed — {n} references validated",
      "Settlement pattern analysis finished — {n} cases evaluated",
      "Legal brief classification ran — {n} documents processed",
      "Jurisdiction lookup resolved — {n} matters updated",
    ]},
    { type: "compliance_check", templates: [
      "Court deadline check completed — {n} matters reviewed",
      "Privilege log audit passed — {n} documents cleared",
      "Conflict-of-interest screen processed — {n} parties checked",
    ]},
    { type: "agent_task", templates: [
      "Research agent completed memo draft — {n} citations surfaced",
      "Discovery agent processed document batch — {n} pages reviewed",
    ]},
    { type: "api_call", templates: [
      "Matter status sync completed — {n} records refreshed",
      "Docket alert ingestion processed — {n} filings indexed",
    ]},
  ],
  Lyte: [
    { type: "api_call", templates: [
      "Observability snapshot computed — {n} metrics aggregated",
      "Dashboard query processed — {n} data points returned",
      "Alert rule evaluation completed — {n} rules checked",
    ]},
    { type: "ai_inference", templates: [
      "Anomaly detection inference ran — {n} series evaluated",
      "Forecast model updated — {n} predictions generated",
    ]},
    { type: "data_sync", templates: [
      "Metric ingestion batch completed — {n} data points stored",
      "Trace aggregation cycle finished — {n} spans processed",
    ]},
  ],
  Alloy: [
    { type: "agent_task", templates: [
      "Workflow execution completed — {n} steps orchestrated",
      "Agent handoff processed — {n} context tokens transferred",
      "Execution trace committed — {n} decision nodes logged",
      "Cross-venture orchestration cycle finished — {n} apps coordinated",
    ]},
    { type: "ai_inference", templates: [
      "Reasoning chain inference completed — {n} steps evaluated",
      "Tool selection model ran — {n} candidates scored",
      "Memory consolidation inference finished — {n} fragments merged",
    ]},
    { type: "signal_routed", templates: [
      "Cross-venture signal dispatched — {n} subscribers notified",
      "Governance approval routed to review queue",
      "Knowledge graph update propagated — {n} edges updated",
    ]},
  ],
  SZL: [
    { type: "api_call", templates: [
      "Platform health check completed — {n} services confirmed",
      "Auth token validation processed — {n} sessions verified",
      "Tenant provisioning cycle ran — {n} configurations applied",
    ]},
    { type: "compliance_check", templates: [
      "Audit log rotation completed — {n} entries archived",
      "Security policy attestation verified — {n} controls checked",
    ]},
    { type: "data_sync", templates: [
      "Cross-platform schema sync validated — {n} tables consistent",
      "Connector health refresh completed — {n} integrations verified",
    ]},
  ],
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateEvent(): TelemetryEvent {
  const venture = VENTURES[randomInt(0, VENTURES.length - 1)];
  const eventGroups = VENTURE_EVENTS[venture];
  const group = eventGroups[randomInt(0, eventGroups.length - 1)];
  const template = group.templates[randomInt(0, group.templates.length - 1)];
  const message = template.replace("{n}", String(randomInt(12, 2847)));

  return {
    id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    ts: new Date().toISOString(),
    type: group.type,
    venture,
    message,
    durationMs: group.type === "ai_inference" ? randomInt(45, 890) : group.type === "agent_task" ? randomInt(120, 3200) : randomInt(8, 180),
  };
}

function generatePulse(): EcosystemPulse {
  return {
    requestsPerSecond: parseFloat((Math.random() * 18 + 4).toFixed(1)),
    activeAgents: randomInt(3, 14),
    dbOpsPerSecond: parseFloat((Math.random() * 45 + 12).toFixed(1)),
    eventsProcessed: randomInt(1200, 9800),
    uptime: Math.floor(process.uptime()),
  };
}

function generateVentureHealth(): VentureHealth[] {
  return VENTURES.map((v) => ({
    name: v,
    status: "operational" as const,
    latencyMs: randomInt(18, 95),
    uptimePct: parseFloat((99.5 + Math.random() * 0.499).toFixed(2)),
  }));
}

router.get(
  "/stephen/telemetry/stream",
  readLimiter,
  (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const write = (event: string, data: unknown) => {
      if (res.destroyed || res.writableEnded) return false;
      try {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        if (typeof (res as any).flush === "function") (res as any).flush();
        return true;
      } catch {
        return false;
      }
    };

    write("connected", { ts: new Date().toISOString(), message: "Telemetry stream connected" });
    write("pulse", generatePulse());
    write("health", generateVentureHealth());

    const burstEvents = () => {
      const count = randomInt(1, 3);
      for (let i = 0; i < count; i++) {
        if (!write("event", generateEvent())) return;
      }
    };

    burstEvents();

    const eventInterval = setInterval(() => {
      if (!write("event", generateEvent())) {
        clearInterval(eventInterval);
        clearInterval(pulseInterval);
        clearInterval(healthInterval);
      }
    }, randomInt(600, 2400));

    const pulseInterval = setInterval(() => {
      write("pulse", generatePulse());
    }, 3000);

    const healthInterval = setInterval(() => {
      write("health", generateVentureHealth());
    }, 10000);

    const keepAlive = setInterval(() => {
      if (res.destroyed || res.writableEnded) {
        clearInterval(keepAlive);
        clearInterval(eventInterval);
        clearInterval(pulseInterval);
        clearInterval(healthInterval);
        return;
      }
      res.write(": keepalive\n\n");
    }, 25000);

    req.on("close", () => {
      clearInterval(eventInterval);
      clearInterval(pulseInterval);
      clearInterval(healthInterval);
      clearInterval(keepAlive);
    });

    req.on("error", () => {
      clearInterval(eventInterval);
      clearInterval(pulseInterval);
      clearInterval(healthInterval);
      clearInterval(keepAlive);
    });
  },
);

router.get("/stephen/telemetry/snapshot", readLimiter, (_req: Request, res: Response) => {
  res.json({
    pulse: generatePulse(),
    health: generateVentureHealth(),
    recentEvents: Array.from({ length: 12 }, generateEvent),
    ts: new Date().toISOString(),
  });
});

export default router;
