import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { sendBadRequest, sendError, sendNotFound, sendUnauthorized } from '../lib/api-response';
import {
  enqueueWebhookEvent,
  getBufferSnapshot,
  getDataSource,
  getIngestionStats,
  ingestBatch,
  ingestEvent,
  listDataSources,
  normalizeAisNmea,
  normalizeSiemPayload,
  pauseDataSource,
  registerDataSource,
  resumeDataSource,
  type StreamCategory,
  type StreamEvent,
  subscribeToBuffer,
} from '../lib/ingestion-framework';
import { logger } from '../lib/logger';
import { validateBody } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';

const ingestSchema = z.object({
  source: z.string().min(1).max(200),
  category: z.enum(['siem', 'market', 'ais']),
  events: z.array(z.record(z.unknown())).min(1).max(1000),
});

const registerSourceSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(['webhook', 'polling']),
  category: z.enum(['siem', 'market', 'ais']),
  endpoint: z.string().url().max(2048).optional(),
  authToken: z.string().max(500).optional(),
  pollingIntervalMs: z.number().int().min(1000).max(3600000).optional(),
});

const streamingRouter: IRouter = Router();

function sseHeaders(res: Response): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
    // Do not allow cross-origin access to these authenticated feeds.
    // Legitimate same-origin dashboards do not need this header.
  });
}

function writeEvent(res: Response, event: StreamEvent): void {
  res.write(`id: ${event.id}\n`);
  res.write(`event: ${event.type}\n`);
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

function startSseStream(
  req: Request,
  res: Response,
  category: StreamCategory,
  fallbackGenerator: (res: Response) => NodeJS.Timeout,
): void {
  sseHeaders(res);

  const snapshot = getBufferSnapshot(category, 20);
  for (const evt of snapshot) writeEvent(res, evt);

  const unsubscribe = subscribeToBuffer(category, (evt) => {
    if (res.writableEnded) return;
    writeEvent(res, evt);
  });

  const hasSources = listDataSources().some((s) => s.category === category && s.enabled);

  const fallbackTimer = hasSources ? null : fallbackGenerator(res);

  req.on('close', () => {
    unsubscribe();
    if (fallbackTimer) clearInterval(fallbackTimer);
    logger.debug({ category }, '[streaming] SSE client disconnected');
  });
}

streamingRouter.get('/stream/siem-events', authMiddleware(), (req: Request, res: Response) => {
  startSseStream(req, res, 'siem', (r) => {
    const TYPES = [
      'port_scan',
      'bruteforce',
      'privilege_escalation',
      'c2_beacon',
      'dns_tunneling',
      'lateral_movement',
      'anomalous_login',
    ];
    const SOURCES = ['splunk', 'qradar', 'sentinel_siem'];
    const SEVERITIES = ['low', 'medium', 'high', 'critical'];

    return setInterval(() => {
      if (r.writableEnded) return;
      try {
        const evt = ingestEvent({
          type: TYPES[Math.floor(Math.random() * TYPES.length)]!,
          source: SOURCES[Math.floor(Math.random() * SOURCES.length)]!,
          category: 'siem',
          severity: SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)],
          payload: {
            host: `host-${Math.floor(Math.random() * 100)}`,
            score: Math.floor(Math.random() * 100),
            technique: `T${1000 + Math.floor(Math.random() * 500)}`,
          },
          timestamp: new Date().toISOString(),
        });
        writeEvent(r, evt);
      } catch {}
    }, 5000);
  });
});

streamingRouter.get('/stream/market-data', authMiddleware(), (req: Request, res: Response) => {
  startSseStream(req, res, 'market', (r) => {
    const TICKERS = ['BTC-USD', 'ETH-USD', 'S&P500', 'NASDAQ', 'AAPL', 'NVDA'];
    const BASE_PRICES: Record<string, number> = {
      'BTC-USD': 67000,
      'ETH-USD': 3400,
      'S&P500': 5200,
      NASDAQ: 18000,
      AAPL: 190,
      NVDA: 850,
    };

    return setInterval(() => {
      if (r.writableEnded) return;
      try {
        const ticker = TICKERS[Math.floor(Math.random() * TICKERS.length)]!;
        const basePrice = BASE_PRICES[ticker] ?? 100;
        const price = basePrice * (1 + (Math.random() - 0.5) * 0.02);
        const change = parseFloat(((Math.random() - 0.5) * 4).toFixed(2));
        const evt = ingestEvent({
          type: 'price_update',
          source: 'market_feed_simulated',
          category: 'market',
          severity: Math.abs(change) > 3 ? 'medium' : 'low',
          payload: {
            ticker,
            price: parseFloat(price.toFixed(2)),
            change,
            volume: Math.floor(Math.random() * 1e9),
          },
          timestamp: new Date().toISOString(),
        });
        writeEvent(r, evt);
      } catch {}
    }, 3000);
  });
});

streamingRouter.get('/stream/ais-tracking', authMiddleware(), (req: Request, res: Response) => {
  startSseStream(req, res, 'ais', (r) => {
    const vessels = [
      {
        mmsi: '123456001',
        name: 'MV PACIFIC STAR',
        lat: 23.4,
        lon: 118.7,
        speed: 14.2,
        course: 45,
      },
      { mmsi: '123456002', name: 'MV ATLAS', lat: 35.1, lon: -12.3, speed: 18.5, course: 270 },
      { mmsi: '123456003', name: 'MV HORIZON', lat: -4.2, lon: 39.8, speed: 11.0, course: 180 },
      { mmsi: '123456004', name: 'MV LIBERTY', lat: 51.5, lon: 1.2, speed: 8.3, course: 90 },
    ];

    return setInterval(() => {
      if (r.writableEnded) return;
      try {
        const vessel = vessels[Math.floor(Math.random() * vessels.length)]!;
        vessel.lat += (Math.random() - 0.5) * 0.01;
        vessel.lon += (Math.random() - 0.5) * 0.01;
        vessel.speed = Math.max(0, vessel.speed + (Math.random() - 0.5) * 0.5);
        const evt = ingestEvent({
          type: 'position_update',
          source: 'ais_feed_simulated',
          category: 'ais',
          payload: {
            mmsi: vessel.mmsi,
            vessel: vessel.name,
            lat: parseFloat(vessel.lat.toFixed(4)),
            lon: parseFloat(vessel.lon.toFixed(4)),
            speed: parseFloat(vessel.speed.toFixed(1)),
            course: vessel.course,
            status: 'underway',
          },
          timestamp: new Date().toISOString(),
        });
        writeEvent(r, evt);
      } catch {}
    }, 4000);
  });
});

streamingRouter.post('/stream/webhook/:sourceToken', async (req: Request, res: Response) => {
  const sourceToken = String(req.params.sourceToken ?? '');
  const body = req.body as Record<string, unknown>;

  const sources = listDataSources().filter(
    (s) => s.type === 'webhook' && s.authToken === sourceToken,
  );
  if (sources.length === 0) {
    sendUnauthorized(res, 'Unknown or unauthorized webhook source token');
    return;
  }

  const source = sources[0]!;
  if (!source.enabled) {
    sendError(res, 'Data source is paused', 423, 'LOCKED');
    return;
  }

  const rawEvents: Record<string, unknown>[] = Array.isArray(body)
    ? (body as Record<string, unknown>[])
    : [body];

  let accepted = 0;
  for (const raw of rawEvents.slice(0, 100)) {
    try {
      const normalized = normalizeSiemPayload(raw, source.name);
      const full: StreamEvent = { ...normalized, normalized: true, sourceId: source.id };
      enqueueWebhookEvent(source.category, full);
      ingestEvent({ ...normalized, sourceId: source.id }, source.id);
      accepted++;
    } catch {}
  }

  logger.info(
    { sourceId: source.id, name: source.name, accepted },
    '[streaming] Webhook events received',
  );
  res.json({ status: 'accepted', accepted, timestamp: new Date().toISOString() });
});

streamingRouter.post('/stream/webhook-siem', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  // Require a Bearer token matching a registered SIEM webhook data source
  // or the SIEM_WEBHOOK_TOKEN environment variable. An unauthenticated POST
  // must never reach ingestEvent() because doing so allows arbitrary internet
  // actors to inject fabricated events into production SIEM storage.
  const bearerToken =
    typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

  if (!bearerToken) {
    sendUnauthorized(res, 'Missing Bearer token');
    return;
  }

  // Check against SIEM_WEBHOOK_TOKEN env var (timing-safe comparison).
  // This is the only accepted credential for this endpoint. Datasource-based
  // webhook ingestion is handled by POST /stream/webhook/:sourceToken instead.
  const envToken = process.env.SIEM_WEBHOOK_TOKEN;
  let authenticated = false;

  if (envToken) {
    try {
      const { timingSafeEqual } = await import('node:crypto');
      const a = Buffer.from(envToken, 'utf8');
      const b = Buffer.from(bearerToken, 'utf8');
      if (a.length === b.length && timingSafeEqual(a, b)) {
        authenticated = true;
      }
    } catch {}
  }

  if (!authenticated) {
    sendUnauthorized(res, 'Invalid or unrecognized Bearer token');
    return;
  }

  const body = req.body as Record<string, unknown> | Record<string, unknown>[];
  const rawEvents: Record<string, unknown>[] = Array.isArray(body) ? body : [body];
  let accepted = 0;

  for (const raw of rawEvents.slice(0, 100)) {
    try {
      const normalized = normalizeSiemPayload(raw, 'siem_webhook');
      ingestEvent({ ...normalized }, undefined);
      accepted++;
    } catch {}
  }

  logger.info({ accepted }, '[streaming] Authenticated SIEM webhook received');
  res.json({ status: 'accepted', accepted, timestamp: new Date().toISOString() });
});

streamingRouter.post('/stream/ais-nmea', async (req: Request, res: Response) => {
  // Require a registered AIS data source token delivered as a Bearer token in
  // the Authorization header. This mirrors the /stream/webhook/:sourceToken
  // pattern and closes the anonymous-ingest vector described in the security
  // audit (unauthenticated callers could otherwise forge vessel positions that
  // get stored in streamIngestedEventsTable and broadcast to live dashboards).
  const authHeader = req.headers.authorization;
  const bearerToken =
    typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

  if (!bearerToken) {
    sendUnauthorized(res, 'Missing Bearer source token');
    return;
  }

  const aisSources = listDataSources().filter(
    (s) => s.category === 'ais' && s.authToken === bearerToken,
  );
  if (aisSources.length === 0) {
    sendUnauthorized(res, 'Unknown or unauthorized AIS source token');
    return;
  }

  const source = aisSources[0]!;
  if (!source.enabled) {
    sendError(res, 'AIS data source is paused', 423, 'LOCKED');
    return;
  }

  const body = req.body as { sentences?: string[] } | { sentence?: string };
  const sentences: string[] =
    'sentences' in body && Array.isArray(body.sentences)
      ? body.sentences
      : 'sentence' in body && typeof body.sentence === 'string'
        ? [body.sentence]
        : [];

  let accepted = 0;
  for (const sentence of sentences.slice(0, 50)) {
    const normalized = normalizeAisNmea(sentence);
    if (normalized) {
      try {
        ingestEvent({ ...normalized, sourceId: source.id }, source.id);
        accepted++;
      } catch {}
    }
  }

  res.json({ status: 'accepted', accepted, timestamp: new Date().toISOString() });
});

streamingRouter.post(
  '/stream/ingest',
  validateBody(ingestSchema),
  async (req: Request, res: Response) => {
    const { source, category, events } = req.body as z.infer<typeof ingestSchema>;

    const normalized = (events as Record<string, unknown>[]).map((e) => ({
      id: (e.id as string) ?? undefined,
      type: (e.type as string) ?? 'raw_event',
      source: (e.source as string) ?? source,
      category: category as StreamCategory,
      severity: e.severity as string | undefined,
      payload: (e.payload as Record<string, unknown>) ?? e,
      timestamp: (e.timestamp as string) ?? new Date().toISOString(),
    }));

    const { ingested, dropped } = await ingestBatch(normalized, undefined);

    logger.info({ source, category, ingested, dropped }, '[streaming] Batch ingestion accepted');
    res.json({
      status: 'accepted',
      source,
      category,
      ingested,
      dropped,
      timestamp: new Date().toISOString(),
    });
  },
);

streamingRouter.get('/stream/sources', (_req, res) => {
  const sources = listDataSources().map((s) => ({
    ...s,
    authToken: s.authToken ? '***' : undefined,
  }));
  res.json({ sources, timestamp: new Date().toISOString() });
});

streamingRouter.post(
  '/stream/sources',
  authMiddleware(),
  validateBody(registerSourceSchema),
  async (req: Request, res: Response) => {
    const { name, type, category, endpoint, authToken, pollingIntervalMs } = req.body as z.infer<
      typeof registerSourceSchema
    >;

    try {
      const source = await registerDataSource({
        name,
        type,
        category,
        endpoint,
        authToken,
        pollingIntervalMs: pollingIntervalMs ?? 30000,
        enabled: true,
      });
      res.status(201).json({
        source: { ...source, authToken: authToken ? '***' : undefined },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error({ err }, '[streaming] Failed to register source');
      sendError(res, 'Failed to register data source');
    }
  },
);

streamingRouter.post(
  '/stream/sources/:id/pause',
  authMiddleware(),
  async (req: Request, res: Response) => {
    const id = parseInt(String(req.params.id), 10);
    if (Number.isNaN(id)) {
      sendBadRequest(res, 'Invalid id');
      return;
    }
    try {
      await pauseDataSource(id);
      res.json({ status: 'paused', id, timestamp: new Date().toISOString() });
    } catch (_err) {
      sendNotFound(res, 'Data source');
    }
  },
);

streamingRouter.post(
  '/stream/sources/:id/resume',
  authMiddleware(),
  async (req: Request, res: Response) => {
    const id = parseInt(String(req.params.id), 10);
    if (Number.isNaN(id)) {
      sendBadRequest(res, 'Invalid id');
      return;
    }
    try {
      await resumeDataSource(id);
      res.json({ status: 'resumed', id, timestamp: new Date().toISOString() });
    } catch (_err) {
      sendNotFound(res, 'Data source');
    }
  },
);

streamingRouter.get('/stream/sources/:id', (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id), 10);
  const source = getDataSource(id);
  if (!source) {
    sendNotFound(res, 'Source');
    return;
  }
  res.json({ source: { ...source, authToken: source.authToken ? '***' : undefined } });
});

streamingRouter.get('/stream/status', authMiddleware(), (_req, res) => {
  const stats = getIngestionStats();
  res.json({
    status: 'healthy',
    streams: {
      'siem-events': {
        status: 'active',
        protocol: 'SSE',
        buffered: stats.bufferSizes.siem,
        description: 'SIEM alert stream (Splunk, QRadar, webhook receivers)',
      },
      'market-data': {
        status: 'active',
        protocol: 'SSE',
        buffered: stats.bufferSizes.market,
        description: 'Market data feed (CoinGecko live: BTC, ETH, SOL, LINK, AVAX)',
      },
      'ais-tracking': {
        status: 'active',
        protocol: 'SSE',
        buffered: stats.bufferSizes.ais,
        description: 'AIS vessel position tracking (live polling + NMEA input)',
      },
    },
    ingestion: {
      batchEndpoint: '/api/stream/ingest',
      webhookSiem: '/api/stream/webhook-siem',
      aisNmea: '/api/stream/ais-nmea',
      sourcedWebhook: '/api/stream/webhook/:sourceToken',
    },
    sourceManagement: {
      list: 'GET /api/stream/sources',
      create: 'POST /api/stream/sources',
      pause: 'POST /api/stream/sources/:id/pause',
      resume: 'POST /api/stream/sources/:id/resume',
    },
    activePollersCount: stats.activePollersCount,
    dataSources: stats.sources.length,
    timestamp: new Date().toISOString(),
  });
});

export default streamingRouter;
