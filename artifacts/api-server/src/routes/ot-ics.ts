import { bodyShape } from '@szl-holdings/contracts/common';
import {
  db,
  firestormIncidentsTable,
  insertOtIcsAnomalyScoreSchema,
  insertOtIcsAssetSchema,
  insertOtIcsConversationSchema,
  insertOtIcsDecodedFrameSchema,
  otIcsAnomalyScoresTable,
  otIcsAssetsTable,
  otIcsConversationsTable,
  otIcsDecodedFramesTable,
} from '@szl-holdings/db';
import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { type IRouter, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendCreated, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';
import { guardSeedInProduction } from '../lib/seed-guard';
import { listQuerySchema, validateBody, validateQuery } from '../lib/validation';
import { authMiddleware } from '../middlewares/auth';
import { getOtIcsFeedStats, isOtIcsFeedRunning } from '../jobs/ot-ics-stream-feed';

const router: IRouter = Router();

const protocolEnum = z.enum(['Modbus', 'DNP3', 'S7']);

const framesQuerySchema = z.object({
  protocol: protocolEnum.optional(),
  assetId: z.string().min(1).max(200).optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional().default(50),
  severity: z.enum(['info', 'low', 'medium', 'high', 'critical']).optional(),
});

const conversationsQuerySchema = z.object({
  sessionId: z.string().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional().default(200),
});

const scoresQuerySchema = z.object({
  assetId: z.string().min(1).max(200).optional(),
  hours: z.coerce.number().int().min(1).max(168).optional().default(12),
});

router.get('/aegis/ot-ics/assets', authMiddleware(), async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(otIcsAssetsTable)
      .orderBy(asc(otIcsAssetsTable.zone), asc(otIcsAssetsTable.name));
    sendSuccess(res, rows);
  } catch (err) {
    handleRouteError(res, err, 'Failed to list OT/ICS assets');
  }
});

router.post(
  '/aegis/ot-ics/assets',
  authMiddleware({ required: true }),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const data = insertOtIcsAssetSchema.parse(req.body);
      const [row] = await db.insert(otIcsAssetsTable).values(data).returning();
      sendCreated(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to create OT/ICS asset');
    }
  },
);

router.get(
  '/aegis/ot-ics/frames',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const q = framesQuerySchema.parse(req.query);
      const conditions = [] as ReturnType<typeof eq>[];
      if (q.protocol) conditions.push(eq(otIcsDecodedFramesTable.protocol, q.protocol));
      if (q.assetId) conditions.push(eq(otIcsDecodedFramesTable.assetId, q.assetId));
      if (q.severity) conditions.push(eq(otIcsDecodedFramesTable.severity, q.severity));
      if (q.from) conditions.push(gte(otIcsDecodedFramesTable.observedAt, new Date(q.from)));
      if (q.to) conditions.push(lte(otIcsDecodedFramesTable.observedAt, new Date(q.to)));
      const where = conditions.length ? and(...conditions) : undefined;
      const rows = await db
        .select()
        .from(otIcsDecodedFramesTable)
        .where(where)
        .orderBy(desc(otIcsDecodedFramesTable.observedAt))
        .limit(q.limit);
      sendSuccess(res, rows);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list decoded frames');
    }
  },
);

router.post(
  '/aegis/ot-ics/frames',
  authMiddleware({ required: true }),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const data = insertOtIcsDecodedFrameSchema.parse(req.body);
      const [row] = await db.insert(otIcsDecodedFramesTable).values(data).returning();
      sendCreated(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to ingest decoded frame');
    }
  },
);

router.get(
  '/aegis/ot-ics/conversations',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const q = conversationsQuerySchema.parse(req.query);
      const where = q.sessionId ? eq(otIcsConversationsTable.sessionId, q.sessionId) : undefined;
      const rows = await db
        .select()
        .from(otIcsConversationsTable)
        .where(where)
        .orderBy(asc(otIcsConversationsTable.observedAt), asc(otIcsConversationsTable.seq))
        .limit(q.limit);
      sendSuccess(res, rows);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list conversation frames');
    }
  },
);

router.post(
  '/aegis/ot-ics/conversations',
  authMiddleware({ required: true }),
  validateBody(bodyShape({})),
  async (req, res) => {
    try {
      const data = insertOtIcsConversationSchema.parse(req.body);
      const [row] = await db.insert(otIcsConversationsTable).values(data).returning();
      sendCreated(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to ingest conversation frame');
    }
  },
);

router.get(
  '/aegis/ot-ics/anomaly-scores',
  authMiddleware(),
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const q = scoresQuerySchema.parse(req.query);
      const since = new Date(Date.now() - q.hours * 60 * 60 * 1000);
      const conditions = [gte(otIcsAnomalyScoresTable.bucketAt, since)];
      if (q.assetId) conditions.push(eq(otIcsAnomalyScoresTable.assetId, q.assetId));
      const rows = await db
        .select()
        .from(otIcsAnomalyScoresTable)
        .where(and(...conditions))
        .orderBy(asc(otIcsAnomalyScoresTable.assetId), asc(otIcsAnomalyScoresTable.bucketAt));
      sendSuccess(res, rows);
    } catch (err) {
      handleRouteError(res, err, 'Failed to list anomaly scores');
    }
  },
);

router.post(
  '/aegis/ot-ics/anomaly-scores',
  authMiddleware({ required: true }),
  validateBody(
    bodyShape({
      baselineSnapshot: z.unknown().optional(),
      reason: z.unknown().optional(),
      score: z.unknown().optional(),
    }),
  ),
  async (req, res) => {
    try {
      const data = insertOtIcsAnomalyScoreSchema.parse(req.body);
      const [row] = await db
        .insert(otIcsAnomalyScoresTable)
        .values(data)
        .onConflictDoUpdate({
          target: [otIcsAnomalyScoresTable.assetId, otIcsAnomalyScoresTable.bucketAt],
          set: { score: data.score, baselineSnapshot: data.baselineSnapshot, reason: data.reason },
        })
        .returning();
      sendCreated(res, row);
    } catch (err) {
      handleRouteError(res, err, 'Failed to record anomaly score');
    }
  },
);

const ingestBodySchema = z.object({
  frames: z
    .array(
      z.object({
        frameId: z.string().min(1).max(200),
        observedAt: z.string().datetime({ offset: true }).optional(),
        protocol: protocolEnum,
        src: z.string().min(1).max(400),
        dst: z.string().min(1).max(400),
        assetId: z.string().min(1).max(200).optional(),
        functionLabel: z.string().min(1).max(400),
        summary: z.string().min(1).max(1000),
        severity: z.enum(['info', 'low', 'medium', 'high', 'critical']).default('info'),
        rawHex: z.string().max(10000),
        fields: z.unknown().optional(),
        forensicEventId: z.string().max(200).optional(),
        conversationSessionId: z.string().max(200).optional(),
      }),
    )
    .min(1)
    .max(500),
});

router.post(
  '/aegis/ot-ics/ingest',
  authMiddleware({ required: true }),
  validateBody(bodyShape({ frames: z.unknown().optional() })),
  async (req, res) => {
    try {
      const parsed = ingestBodySchema.parse(req.body);
      const rows = parsed.frames.map((f) => ({
        frameId: f.frameId,
        observedAt: f.observedAt ? new Date(f.observedAt) : new Date(),
        protocol: f.protocol,
        src: f.src,
        dst: f.dst,
        assetId: f.assetId,
        functionLabel: f.functionLabel,
        summary: f.summary,
        severity: f.severity,
        rawHex: f.rawHex,
        fields: (f.fields as typeof otIcsDecodedFramesTable.$inferInsert['fields']) ?? [],
        forensicEventId: f.forensicEventId,
        conversationSessionId: f.conversationSessionId,
      }));
      const inserted = await db
        .insert(otIcsDecodedFramesTable)
        .values(rows)
        .onConflictDoNothing()
        .returning({ frameId: otIcsDecodedFramesTable.frameId });
      sendCreated(res, { accepted: rows.length, inserted: inserted.length });
    } catch (err) {
      handleRouteError(res, err, 'Failed to ingest protocol frames');
    }
  },
);

const triageBodySchema = z.object({
  acknowledgedBy: z.string().min(1).max(200).optional(),
  incidentRef: z.string().min(1).max(200).optional(),
});

router.post(
  '/aegis/ot-ics/frames/:frameId/acknowledge',
  authMiddleware({ required: true }),
  validateBody(bodyShape({ acknowledgedBy: z.unknown().optional() })),
  async (req, res) => {
    try {
      const { acknowledgedBy } = triageBodySchema.parse(req.body);
      const [updated] = await db
        .update(otIcsDecodedFramesTable)
        .set({
          triageStatus: 'acknowledged',
          acknowledgedAt: new Date(),
          acknowledgedBy: acknowledgedBy ?? null,
        })
        .where(eq(otIcsDecodedFramesTable.frameId, req.params.frameId as string))
        .returning();
      if (!updated) {
        res.status(404).json({ success: false, error: 'Frame not found' });
        return;
      }
      sendSuccess(res, { frameId: updated.frameId, triageStatus: updated.triageStatus });
    } catch (err) {
      handleRouteError(res, err, 'Failed to acknowledge frame');
    }
  },
);

router.post(
  '/aegis/ot-ics/frames/:frameId/false-positive',
  authMiddleware({ required: true }),
  validateBody(bodyShape({ acknowledgedBy: z.unknown().optional() })),
  async (req, res) => {
    try {
      const { acknowledgedBy } = triageBodySchema.parse(req.body);
      const [updated] = await db
        .update(otIcsDecodedFramesTable)
        .set({
          triageStatus: 'false_positive',
          acknowledgedAt: new Date(),
          acknowledgedBy: acknowledgedBy ?? null,
        })
        .where(eq(otIcsDecodedFramesTable.frameId, req.params.frameId as string))
        .returning();
      if (!updated) {
        res.status(404).json({ success: false, error: 'Frame not found' });
        return;
      }
      sendSuccess(res, { frameId: updated.frameId, triageStatus: updated.triageStatus });
    } catch (err) {
      handleRouteError(res, err, 'Failed to mark frame as false positive');
    }
  },
);

router.post(
  '/aegis/ot-ics/frames/:frameId/open-incident',
  authMiddleware({ required: true }),
  validateBody(
    bodyShape({ acknowledgedBy: z.unknown().optional(), incidentRef: z.unknown().optional() }),
  ),
  async (req, res) => {
    try {
      const { acknowledgedBy, incidentRef: providedRef } = triageBodySchema.parse(req.body);
      const fid = req.params.frameId as string;

      const [frame] = await db
        .select()
        .from(otIcsDecodedFramesTable)
        .where(eq(otIcsDecodedFramesTable.frameId, fid))
        .limit(1);
      if (!frame) {
        res.status(404).json({ success: false, error: 'Frame not found' });
        return;
      }

      const sevMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
        critical: 'critical',
        high: 'high',
        medium: 'medium',
        low: 'low',
        info: 'low',
      };

      const txResult = await db.transaction(async (tx) => {
        const [socIncident] = await tx
          .insert(firestormIncidentsTable)
          .values({
            title: `OT/ICS Anomaly: ${frame.functionLabel} on ${frame.assetId ?? frame.dst}`,
            description: `Protocol anomaly detected on frame ${frame.frameId}. ${frame.summary}`,
            severity: sevMap[frame.severity] ?? 'medium',
            status: 'triage',
            affectedAssets: frame.assetId ? [frame.assetId] : [frame.dst],
            notes: `Source: ${frame.src} → Dest: ${frame.dst} | Protocol: ${frame.protocol} | Frame: ${frame.frameId}${frame.conversationSessionId ? ` | Session: ${frame.conversationSessionId}` : ''}${frame.forensicEventId ? ` | Forensic: ${frame.forensicEventId}` : ''}`,
            attackTechnique: frame.protocol,
          })
          .returning({ id: firestormIncidentsTable.id });

        const resolvedRef = providedRef ?? `INC-OT-${socIncident.id}`;

        const [updated] = await tx
          .update(otIcsDecodedFramesTable)
          .set({
            triageStatus: 'incident_opened',
            acknowledgedAt: new Date(),
            acknowledgedBy: acknowledgedBy ?? null,
            incidentRef: resolvedRef,
          })
          .where(eq(otIcsDecodedFramesTable.frameId, fid))
          .returning();

        return { updated, socIncidentId: socIncident.id, resolvedRef };
      });

      logger.info(
        { frameId: fid, socIncidentId: txResult.socIncidentId, incidentRef: txResult.resolvedRef },
        '[ot-ics] SOC incident created from OT/ICS frame',
      );

      sendSuccess(res, {
        frameId: txResult.updated.frameId,
        triageStatus: txResult.updated.triageStatus,
        incidentRef: txResult.updated.incidentRef,
        socIncidentId: txResult.socIncidentId,
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to open incident for frame');
    }
  },
);

router.post(
  '/aegis/ot-ics/baseline/recompute',
  validateBody(bodyShape({})),
  authMiddleware({ required: true }),
  async (_req, res) => {
    try {
      const result = await recomputeOtIcsBaselines();
      sendSuccess(res, result);
    } catch (err) {
      handleRouteError(res, err, 'Failed to recompute OT/ICS baselines');
    }
  },
);

export async function recomputeOtIcsBaselines(): Promise<{
  updatedAssets: number;
  baselines: Array<{ assetId: string; baseline: number; sampleCount: number }>;
}> {
  const assets = await db.select().from(otIcsAssetsTable);
  const baselines: Array<{ assetId: string; baseline: number; sampleCount: number }> = [];
  let updated = 0;
  for (const asset of assets) {
    const windowDays = asset.baselineWindowDays ?? 30;
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);
    const rows = await db
      .select({ score: otIcsAnomalyScoresTable.score })
      .from(otIcsAnomalyScoresTable)
      .where(
        and(
          eq(otIcsAnomalyScoresTable.assetId, asset.assetId),
          gte(otIcsAnomalyScoresTable.bucketAt, since),
        ),
      );
    if (rows.length === 0) {
      baselines.push({ assetId: asset.assetId, baseline: Number(asset.baseline), sampleCount: 0 });
      continue;
    }
    // Trimmed-mean baseline: drop top 25% (likely anomalies) so the baseline tracks normal behavior.
    const values = rows.map((r) => Number(r.score)).sort((a, b) => a - b);
    const cutoff = Math.max(1, Math.floor(values.length * 0.75));
    const trimmed = values.slice(0, cutoff);
    const mean = trimmed.reduce((s, v) => s + v, 0) / trimmed.length;
    const baseline = Math.max(1, Math.round(mean * 100) / 100);
    await db
      .update(otIcsAssetsTable)
      .set({
        baseline: String(baseline),
        baselineLastComputedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(otIcsAssetsTable.id, asset.id));
    baselines.push({ assetId: asset.assetId, baseline, sampleCount: rows.length });
    updated += 1;
  }
  logger.info({ updated, total: assets.length }, '[ot-ics] baseline recompute complete');
  return { updatedAssets: updated, baselines };
}

let _seedPromise: Promise<void> | null = null;

export async function ensureOtIcsDemoData(): Promise<void> {
  if (_seedPromise) return _seedPromise;
  _seedPromise = (async () => {
    const [{ count: assetCount }] = await db
      .execute(sql`SELECT COUNT(*)::int AS count FROM ot_ics_assets`)
      .then((r) => (r as unknown as { rows: Array<{ count: number }> }).rows);
    if (assetCount > 0) return;

    const seedAssets: Array<{
      assetId: string;
      name: string;
      zone: string;
      protocol: 'Modbus' | 'DNP3' | 'S7';
      baseline: string;
    }> = [
      {
        assetId: 'PLC-Boiler-2',
        name: 'PLC-Boiler-2',
        zone: 'Process Zone A',
        protocol: 'Modbus',
        baseline: '14',
      },
      {
        assetId: 'S7-CPU-413',
        name: 'S7-CPU-413',
        zone: 'Process Zone A',
        protocol: 'S7',
        baseline: '9',
      },
      {
        assetId: 'PLC-Reactor-1',
        name: 'PLC-Reactor-1',
        zone: 'Process Zone B',
        protocol: 'DNP3',
        baseline: '12',
      },
      {
        assetId: 'HMI-A',
        name: 'HMI-A (Operator)',
        zone: 'Control Room',
        protocol: 'Modbus',
        baseline: '18',
      },
      {
        assetId: 'RTU-Substation-7',
        name: 'RTU-Substation-7',
        zone: 'Substation North',
        protocol: 'DNP3',
        baseline: '11',
      },
      { assetId: 'ENG-WS-3', name: 'ENG-WS-3', zone: 'Engineering', protocol: 'S7', baseline: '7' },
    ];
    await db.insert(otIcsAssetsTable).values(seedAssets).onConflictDoNothing();

    const now = Date.now();
    const observed = (offsetMs: number) => new Date(now - offsetMs);

    const seedFrames: Array<typeof otIcsDecodedFramesTable.$inferInsert> = [
      {
        frameId: 'PKT-MB-2031',
        observedAt: observed(60_000),
        protocol: 'Modbus',
        src: '10.4.12.18 (HMI-A)',
        dst: '10.4.12.41 (PLC-Boiler-2)',
        assetId: 'PLC-Boiler-2',
        functionLabel: 'FC=06 Write Single Register',
        summary: 'Write 0x07D0 (2000) to register 40021 — boiler setpoint override',
        severity: 'critical',
        rawHex: '00 19 00 00 00 06 01 06 00 14 07 D0',
        forensicEventId: 'FE-006',
        conversationSessionId: 'INC-2024-0329',
        fields: [
          { name: 'Transaction ID', value: '0x0019 (25)', bytes: '00 19' },
          { name: 'Protocol ID', value: '0x0000 (Modbus)', bytes: '00 00' },
          { name: 'Length', value: '6 bytes', bytes: '00 06' },
          { name: 'Unit ID', value: '0x01 (PLC-Boiler-2)', bytes: '01' },
          {
            name: 'Function Code',
            value: '0x06 — Write Single Register',
            bytes: '06',
            flag: 'warn',
          },
          {
            name: 'Register Address',
            value: '40021 (Boiler Setpoint)',
            bytes: '00 14',
            flag: 'anomaly',
            note: 'Outside engineering-approved range',
          },
          {
            name: 'Value',
            value: '2000 (target °C × 10)',
            bytes: '07 D0',
            flag: 'anomaly',
            note: 'Exceeds safety ceiling 850 °C × 10',
          },
        ],
      },
      {
        frameId: 'PKT-DNP-1188',
        observedAt: observed(75_000),
        protocol: 'DNP3',
        src: '10.4.12.41 (PLC-Boiler-2)',
        dst: '10.4.12.18 (HMI-A)',
        assetId: 'PLC-Boiler-2',
        functionLabel: 'FC=01 Read / Class 0 Poll Response',
        summary: 'Analog Input 12 reporting 1418 (pressure psi) — above operating envelope',
        severity: 'high',
        rawHex: '05 64 1A 44 03 00 04 00 BD 71 C0 C7 81 00 00 1E 02 00 00 00 00 8A 05',
        forensicEventId: 'FE-007',
        conversationSessionId: 'INC-2024-0329',
        fields: [
          { name: 'Start Bytes', value: '0x0564', bytes: '05 64' },
          { name: 'Length', value: '26', bytes: '1A' },
          { name: 'Control', value: '0x44 PRM=1 FCB=0 FCV=0 FC=4', bytes: '44' },
          { name: 'Destination', value: '3', bytes: '03 00' },
          { name: 'Source', value: '4', bytes: '04 00' },
          { name: 'App Header', value: 'FIR=1 FIN=1 SEQ=0 FC=129 (Response)', bytes: 'C7 81' },
          {
            name: 'Object 30 Var 2',
            value: 'Analog Input #12 = 1418',
            bytes: '1E 02 00 00 00 8A 05',
            flag: 'anomaly',
            note: 'Baseline 740 ±60',
          },
        ],
      },
      {
        frameId: 'PKT-S7-0911',
        observedAt: observed(110_000),
        protocol: 'S7',
        src: '10.4.12.65 (ENG-WS-3)',
        dst: '10.4.12.50 (S7-CPU-413)',
        assetId: 'S7-CPU-413',
        functionLabel: 'Job — PLC STOP',
        summary: 'Engineering workstation issued PLC STOP outside change window',
        severity: 'critical',
        rawHex:
          '03 00 00 21 02 F0 80 32 01 00 00 04 00 00 0E 00 00 05 01 12 04 11 44 01 00 FF 09 00 04 00 01 00 00',
        forensicEventId: 'FE-008',
        conversationSessionId: 'INC-2024-0329',
        fields: [
          { name: 'TPKT Header', value: 'Version 3, Length 33', bytes: '03 00 00 21' },
          { name: 'COTP', value: 'DT TPDU', bytes: '02 F0 80' },
          { name: 'S7 Protocol ID', value: '0x32', bytes: '32' },
          { name: 'ROSCTR', value: '0x01 Job', bytes: '01' },
          {
            name: 'Function',
            value: '0x29 — PLC STOP',
            bytes: '29',
            flag: 'anomaly',
            note: 'Stop command from non-approved host',
          },
          { name: 'PI Service', value: 'P_PROGRAM', bytes: '50 5F 50 52 4F 47 52 41 4D' },
        ],
      },
      {
        frameId: 'PKT-MB-2032',
        observedAt: observed(45_000),
        protocol: 'Modbus',
        src: '10.4.12.18 (HMI-A)',
        dst: '10.4.12.41 (PLC-Boiler-2)',
        assetId: 'PLC-Boiler-2',
        functionLabel: 'FC=03 Read Holding Registers',
        summary: 'Verification read of register 40021 returns 2000',
        severity: 'medium',
        rawHex: '00 1A 00 00 00 06 01 03 00 14 00 01',
        conversationSessionId: 'INC-2024-0329',
        fields: [
          { name: 'Transaction ID', value: '0x001A (26)', bytes: '00 1A' },
          { name: 'Function Code', value: '0x03 Read Holding', bytes: '03' },
          { name: 'Register Start', value: '40021', bytes: '00 14' },
          { name: 'Quantity', value: '1', bytes: '00 01' },
        ],
      },
    ];
    await db.insert(otIcsDecodedFramesTable).values(seedFrames).onConflictDoNothing();

    // Each conversation frame carries an authoritative payload_hex (application-layer bytes
    // that ride on top of the synthetic Ethernet+IPv4+TCP envelope produced by the PCAP
    // exporter). Bytes is the full on-wire size (54-byte L2/L3/L4 envelope + payload).
    const seedConversation: Array<typeof otIcsConversationsTable.$inferInsert> = [
      {
        sessionId: 'INC-2024-0329',
        seq: 1,
        observedAt: observed(170_000),
        direction: '→',
        src: 'ENG-WS-3',
        dst: 'S7-CPU-413',
        protocol: 'S7',
        summary: 'TCP SYN — Port 102',
        bytes: 54,
        anomalous: false,
        payloadHex: '',
      },
      {
        sessionId: 'INC-2024-0329',
        seq: 2,
        observedAt: observed(169_000),
        direction: '←',
        src: 'S7-CPU-413',
        dst: 'ENG-WS-3',
        protocol: 'S7',
        summary: 'SYN/ACK',
        bytes: 54,
        anomalous: false,
        payloadHex: '',
      },
      {
        sessionId: 'INC-2024-0329',
        seq: 3,
        observedAt: observed(168_000),
        direction: '→',
        src: 'ENG-WS-3',
        dst: 'S7-CPU-413',
        protocol: 'S7',
        summary: 'COTP CR Connect Request',
        bytes: 76,
        anomalous: false,
        payloadHex: '03 00 00 16 11 E0 00 00 00 01 00 C0 01 0A C1 02 01 00 C2 02 01 02',
      },
      {
        sessionId: 'INC-2024-0329',
        seq: 4,
        observedAt: observed(167_000),
        direction: '←',
        src: 'S7-CPU-413',
        dst: 'ENG-WS-3',
        protocol: 'S7',
        summary: 'COTP CC Connect Confirm',
        bytes: 76,
        anomalous: false,
        payloadHex: '03 00 00 16 11 D0 00 01 00 01 00 C0 01 0A C1 02 01 00 C2 02 01 02',
      },
      {
        sessionId: 'INC-2024-0329',
        seq: 5,
        observedAt: observed(165_000),
        direction: '→',
        src: 'ENG-WS-3',
        dst: 'S7-CPU-413',
        protocol: 'S7',
        summary: 'Setup Communication',
        bytes: 79,
        anomalous: false,
        payloadHex: '03 00 00 19 02 F0 80 32 01 00 00 00 00 00 08 00 00 F0 00 00 03 00 03 01 E0',
      },
      {
        sessionId: 'INC-2024-0329',
        seq: 6,
        observedAt: observed(110_000),
        direction: '→',
        src: 'ENG-WS-3',
        dst: 'S7-CPU-413',
        protocol: 'S7',
        summary: 'PLC STOP — UNAUTHORIZED',
        bytes: 87,
        anomalous: true,
        frameId: 'PKT-S7-0911',
        payloadHex:
          '03 00 00 21 02 F0 80 32 01 00 00 04 00 00 0E 00 00 05 01 12 04 11 44 01 00 FF 09 00 04 00 01 00 00',
      },
      {
        sessionId: 'INC-2024-0329',
        seq: 7,
        observedAt: observed(95_000),
        direction: '→',
        src: 'HMI-A',
        dst: 'PLC-Boiler-2',
        protocol: 'Modbus',
        summary: 'Read Holding 40000-40020 (baseline scan)',
        bytes: 66,
        anomalous: false,
        payloadHex: '00 17 00 00 00 06 01 03 00 00 00 15',
      },
      {
        sessionId: 'INC-2024-0329',
        seq: 8,
        observedAt: observed(75_000),
        direction: '←',
        src: 'PLC-Boiler-2',
        dst: 'HMI-A',
        protocol: 'DNP3',
        summary: 'AI #12 reading anomalous (1418 psi)',
        bytes: 77,
        anomalous: true,
        frameId: 'PKT-DNP-1188',
        payloadHex: '05 64 1A 44 03 00 04 00 BD 71 C0 C7 81 00 00 1E 02 00 00 00 00 8A 05',
      },
      {
        sessionId: 'INC-2024-0329',
        seq: 9,
        observedAt: observed(60_000),
        direction: '→',
        src: 'HMI-A',
        dst: 'PLC-Boiler-2',
        protocol: 'Modbus',
        summary: 'Write 40021 = 2000 (override setpoint)',
        bytes: 66,
        anomalous: true,
        frameId: 'PKT-MB-2031',
        payloadHex: '00 19 00 00 00 06 01 06 00 14 07 D0',
      },
      {
        sessionId: 'INC-2024-0329',
        seq: 10,
        observedAt: observed(45_000),
        direction: '→',
        src: 'HMI-A',
        dst: 'PLC-Boiler-2',
        protocol: 'Modbus',
        summary: 'Read-back 40021 (confirm tamper)',
        bytes: 66,
        anomalous: false,
        frameId: 'PKT-MB-2032',
        payloadHex: '00 1A 00 00 00 06 01 03 00 14 00 01',
      },
    ];
    await db.insert(otIcsConversationsTable).values(seedConversation).onConflictDoNothing();

    // 12-hour anomaly score series, one bucket per hour, escalating into anomaly territory
    const scoreSeries: Record<string, number[]> = {
      'PLC-Boiler-2': [11, 13, 12, 14, 16, 18, 22, 28, 41, 67, 88, 92],
      'S7-CPU-413': [8, 9, 10, 9, 11, 12, 14, 19, 31, 58, 81, 84],
      'PLC-Reactor-1': [10, 11, 12, 13, 13, 14, 14, 15, 16, 21, 27, 34],
      'HMI-A': [16, 17, 18, 19, 19, 20, 22, 26, 35, 48, 61, 73],
      'RTU-Substation-7': [9, 10, 11, 11, 12, 13, 13, 14, 14, 15, 16, 17],
      'ENG-WS-3': [6, 7, 7, 8, 8, 9, 11, 18, 39, 71, 89, 95],
    };
    const baselines: Record<string, number> = Object.fromEntries(
      seedAssets.map((a) => [a.assetId, Number(a.baseline)]),
    );

    const scoreRows: Array<typeof otIcsAnomalyScoresTable.$inferInsert> = [];
    for (const [assetId, series] of Object.entries(scoreSeries)) {
      for (let h = 0; h < series.length; h++) {
        // Bucket h hours ago: oldest first → newest last. Use h=0 as 11h ago, h=11 as now.
        const hoursAgo = series.length - 1 - h;
        const bucket = new Date(now - hoursAgo * 60 * 60 * 1000);
        bucket.setMinutes(0, 0, 0);
        scoreRows.push({
          assetId,
          bucketAt: bucket,
          score: String(series[h]),
          baselineSnapshot: String(baselines[assetId] ?? 10),
          reason:
            series[h] >= (baselines[assetId] ?? 10) * 3
              ? 'Function-code mix anomaly + off-hours writes'
              : null,
        });
      }
    }
    await db.insert(otIcsAnomalyScoresTable).values(scoreRows).onConflictDoNothing();

    logger.info(
      {
        assets: seedAssets.length,
        frames: seedFrames.length,
        conversations: seedConversation.length,
        scores: scoreRows.length,
      },
      '[ot-ics] demo data seeded',
    );
  })().catch((err) => {
    logger.error({ err: err?.message }, '[ot-ics] failed to seed demo data');
    _seedPromise = null;
  });
  return _seedPromise;
}

router.post(
  '/aegis/ot-ics/demo/seed',
  validateBody(bodyShape({})),
  authMiddleware({ required: true }),
  async (_req, res) => {
    if (guardSeedInProduction(res)) return;
    try {
      await ensureOtIcsDemoData();
      sendSuccess(res, { ok: true });
    } catch (err) {
      handleRouteError(res, err, 'Failed to seed OT/ICS demo data');
    }
  },
);

router.get('/aegis/ot-ics/feed/status', authMiddleware(), (_req, res) => {
  try {
    sendSuccess(res, { running: isOtIcsFeedRunning(), stats: getOtIcsFeedStats() });
  } catch (err) {
    handleRouteError(res, err, 'Failed to retrieve OT/ICS feed status');
  }
});

// Eagerly trigger demo seeding on first import so dev/demo environments get
// realistic data without a manual call. Safe: idempotent and a no-op once data exists.
void ensureOtIcsDemoData();

export default router;
