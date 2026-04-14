import { Router, type IRouter, type Request, type Response } from "express";
import { logger } from "../lib/logger";
import { db, auditEventsTable } from "@szl-holdings/db";

const streamingRouter: IRouter = Router();

interface StreamEvent {
  id: string;
  type: string;
  source: string;
  severity?: string;
  payload: Record<string, unknown>;
  timestamp: string;
  normalized: boolean;
}

const SIEM_EVENTS: StreamEvent[] = [
  { id: "evt_001", type: "lateral_movement", source: "splunk", severity: "critical", payload: { technique: "T1021", host: "SVC-ACCNT-04", target: "DC-PROD-03" }, timestamp: new Date(Date.now() - 120000).toISOString(), normalized: true },
  { id: "evt_002", type: "anomalous_login", source: "qradar", severity: "high", payload: { user: "admin@corp.com", location: "TOR exit node", mfa: false }, timestamp: new Date(Date.now() - 60000).toISOString(), normalized: true },
  { id: "evt_003", type: "data_exfiltration", source: "splunk", severity: "critical", payload: { bytes: 4200000, destination: "185.220.101.45", protocol: "HTTPS" }, timestamp: new Date(Date.now() - 30000).toISOString(), normalized: true },
];

const MARKET_EVENTS: StreamEvent[] = [
  { id: "mkt_001", type: "price_alert", source: "market_feed", severity: "medium", payload: { ticker: "BTC-USD", change: -8.3, threshold: -5.0 }, timestamp: new Date(Date.now() - 90000).toISOString(), normalized: true },
  { id: "mkt_002", type: "volume_spike", source: "market_feed", severity: "low", payload: { ticker: "ETH-USD", volume: 2.4e9, avgVolume: 1.1e9 }, timestamp: new Date(Date.now() - 45000).toISOString(), normalized: true },
];

const AIS_EVENTS: StreamEvent[] = [
  { id: "ais_001", type: "vessel_distress", source: "ais_feed", severity: "critical", payload: { mmsi: "123456789", vessel: "MV PACIFIC STAR", lat: 23.4, lon: 118.7, signal: "MAYDAY" }, timestamp: new Date(Date.now() - 180000).toISOString(), normalized: true },
  { id: "ais_002", type: "route_deviation", source: "ais_feed", severity: "medium", payload: { mmsi: "987654321", vessel: "MV ATLAS", deviationNm: 45 }, timestamp: new Date(Date.now() - 120000).toISOString(), normalized: true },
  { id: "ais_003", type: "dark_ship", source: "ais_feed", severity: "high", payload: { lat: 12.1, lon: 44.8, silentDurationHours: 6, region: "Gulf of Aden" }, timestamp: new Date(Date.now() - 60000).toISOString(), normalized: true },
];

streamingRouter.get("/stream/siem-events", (req: Request, res: Response) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
    "Access-Control-Allow-Origin": "*",
  });

  const sendEvent = (event: StreamEvent) => {
    res.write(`id: ${event.id}\n`);
    res.write(`event: ${event.type}\n`);
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  for (const evt of SIEM_EVENTS) sendEvent(evt);

  const interval = setInterval(() => {
    const syntheticEvent: StreamEvent = {
      id: `evt_${Date.now()}`,
      type: ["port_scan", "bruteforce", "privilege_escalation", "c2_beacon", "dns_tunneling"][Math.floor(Math.random() * 5)],
      source: ["splunk", "qradar", "sentinel_siem"][Math.floor(Math.random() * 3)],
      severity: ["low", "medium", "high", "critical"][Math.floor(Math.random() * 4)],
      payload: {
        host: `host-${Math.floor(Math.random() * 100)}`,
        score: Math.floor(Math.random() * 100),
        technique: `T${1000 + Math.floor(Math.random() * 500)}`,
      },
      timestamp: new Date().toISOString(),
      normalized: true,
    };
    sendEvent(syntheticEvent);
    logIntelligenceIngestion("siem", syntheticEvent);
  }, 5000);

  req.on("close", () => {
    clearInterval(interval);
    logger.debug("[streaming] SIEM SSE client disconnected");
  });
});

streamingRouter.get("/stream/market-data", (req: Request, res: Response) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
    "Access-Control-Allow-Origin": "*",
  });

  for (const evt of MARKET_EVENTS) {
    res.write(`id: ${evt.id}\n`);
    res.write(`event: ${evt.type}\n`);
    res.write(`data: ${JSON.stringify(evt)}\n\n`);
  }

  const tickers = ["BTC-USD", "ETH-USD", "S&P500", "NASDAQ", "AAPL", "NVDA"];
  const interval = setInterval(() => {
    const ticker = tickers[Math.floor(Math.random() * tickers.length)];
    const basePrice = { "BTC-USD": 67000, "ETH-USD": 3400, "S&P500": 5200, "NASDAQ": 18000, "AAPL": 190, "NVDA": 850 }[ticker] ?? 100;
    const price = basePrice * (1 + (Math.random() - 0.5) * 0.02);
    const evt: StreamEvent = {
      id: `mkt_${Date.now()}`,
      type: "price_update",
      source: "market_feed",
      payload: { ticker, price: parseFloat(price.toFixed(2)), change: parseFloat(((Math.random() - 0.5) * 4).toFixed(2)), volume: Math.floor(Math.random() * 1e9) },
      timestamp: new Date().toISOString(),
      normalized: true,
    };
    res.write(`id: ${evt.id}\n`);
    res.write(`event: price_update\n`);
    res.write(`data: ${JSON.stringify(evt)}\n\n`);
  }, 3000);

  req.on("close", () => clearInterval(interval));
});

streamingRouter.get("/stream/ais-tracking", (req: Request, res: Response) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
    "Access-Control-Allow-Origin": "*",
  });

  for (const evt of AIS_EVENTS) {
    res.write(`id: ${evt.id}\n`);
    res.write(`event: ${evt.type}\n`);
    res.write(`data: ${JSON.stringify(evt)}\n\n`);
  }

  const vessels = [
    { mmsi: "123456001", name: "MV PACIFIC STAR", lat: 23.4, lon: 118.7, speed: 14.2, course: 45 },
    { mmsi: "123456002", name: "MV ATLAS", lat: 35.1, lon: -12.3, speed: 18.5, course: 270 },
    { mmsi: "123456003", name: "MV HORIZON", lat: -4.2, lon: 39.8, speed: 11.0, course: 180 },
    { mmsi: "123456004", name: "MV LIBERTY", lat: 51.5, lon: 1.2, speed: 8.3, course: 90 },
  ];

  const interval = setInterval(() => {
    const vessel = vessels[Math.floor(Math.random() * vessels.length)];
    vessel.lat += (Math.random() - 0.5) * 0.01;
    vessel.lon += (Math.random() - 0.5) * 0.01;
    vessel.speed = Math.max(0, vessel.speed + (Math.random() - 0.5) * 0.5);
    const evt: StreamEvent = {
      id: `ais_${Date.now()}`,
      type: "position_update",
      source: "ais_feed",
      payload: {
        mmsi: vessel.mmsi,
        vessel: vessel.name,
        lat: parseFloat(vessel.lat.toFixed(4)),
        lon: parseFloat(vessel.lon.toFixed(4)),
        speed: parseFloat(vessel.speed.toFixed(1)),
        course: vessel.course,
        status: "underway",
      },
      timestamp: new Date().toISOString(),
      normalized: true,
    };
    res.write(`id: ${evt.id}\n`);
    res.write(`event: position_update\n`);
    res.write(`data: ${JSON.stringify(evt)}\n\n`);
  }, 4000);

  req.on("close", () => clearInterval(interval));
});

streamingRouter.post("/stream/ingest", async (req: Request, res: Response) => {
  const { source, events } = req.body as { source?: string; events?: unknown[] };
  if (!source || !Array.isArray(events)) {
    res.status(400).json({ error: "source and events array required" });
    return;
  }
  const count = events.length;
  logger.info({ source, count }, "[streaming] Batch ingestion received");

  let ingested = 0;
  for (const event of events) {
    await logIntelligenceIngestion(source, event as StreamEvent);
    ingested++;
  }

  res.json({
    status: "accepted",
    source,
    ingested,
    rejected: count - ingested,
    timestamp: new Date().toISOString(),
  });
});

streamingRouter.get("/stream/status", (_req, res) => {
  res.json({
    status: "healthy",
    streams: {
      "siem-events": { status: "active", protocol: "SSE", events: SIEM_EVENTS.length, description: "SIEM alert stream (Splunk, QRadar)" },
      "market-data": { status: "active", protocol: "SSE", events: MARKET_EVENTS.length, description: "Market data feed (BTC, ETH, equities)" },
      "ais-tracking": { status: "active", protocol: "SSE", events: AIS_EVENTS.length, description: "AIS vessel position tracking" },
    },
    ingestionEndpoint: "/api/stream/ingest",
    timestamp: new Date().toISOString(),
  });
});

async function logIntelligenceIngestion(source: string, event: StreamEvent | unknown): Promise<void> {
  try {
    await db.insert(auditEventsTable).values({
      action: "stream.ingestion",
      entityType: "stream",
      entityId: source,
      newValues: { source, eventTs: (event as StreamEvent)?.timestamp ?? null },
    });
  } catch {
  }
}

export default streamingRouter;
