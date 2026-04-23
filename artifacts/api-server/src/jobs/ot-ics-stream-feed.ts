/**
 * OT/ICS Protocol Stream Feed
 *
 * Simulates a live sensor relay / PCAP feed that continuously writes new decoded
 * frames, conversation rows, and rolling anomaly scores into the OT/ICS tables.
 * The dashboard polls the API every 15 s, so operators see updates in near-real-time
 * without any manual re-seeding.
 *
 * When a real Modbus/DNP3/S7 capture source or partner SOC integration is
 * available, replace the generateXxx() helpers with real protocol parsers or
 * feed-client calls while keeping the DB write logic unchanged.
 */

import {
  PgPool,
  drizzleConnect,
  otIcsAnomalyScoresTable,
  otIcsAssetsTable,
  otIcsConversationsTable,
  otIcsDecodedFramesTable,
} from '@szl-holdings/db';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { logger } from '../lib/logger';

/**
 * Dedicated connection pool for the OT/ICS feed worker.
 * Isolated from the main `db` pool so that boot-time pool pressure
 * (e.g. bootstrapChainState holding connections) never stalls the feed.
 */
const _feedPool = new PgPool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  statement_timeout: 15_000,
});
const feedDb = drizzleConnect(_feedPool);

// ─── Configuration ────────────────────────────────────────────────────────────

const TICK_INTERVAL_MS = 8_000;
const FRAMES_PER_TICK_MIN = 1;
const FRAMES_PER_TICK_MAX = 3;

// ─── Protocol templates ───────────────────────────────────────────────────────

type Protocol = 'Modbus' | 'DNP3' | 'S7';
type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';

interface FrameTemplate {
  protocol: Protocol;
  functionLabel: string;
  summaryTemplate: string;
  rawHexTemplate: string;
  severityWeights: Array<[Severity, number]>;
  fields: Array<{ name: string; value: string; bytes: string; flag?: 'info' | 'warn' | 'anomaly'; note?: string }>;
}

const FRAME_TEMPLATES: FrameTemplate[] = [
  {
    protocol: 'Modbus',
    functionLabel: 'FC=03 Read Holding Registers',
    summaryTemplate: 'Polling registers {start}–{end} (periodic scan)',
    rawHexTemplate: '00 {txid} 00 00 00 06 01 03 {addr} {qty}',
    severityWeights: [['info', 70], ['low', 20], ['medium', 10]],
    fields: [
      { name: 'Function Code', value: '0x03 Read Holding', bytes: '03' },
      { name: 'Register Start', value: 'varies', bytes: 'XX XX' },
      { name: 'Quantity', value: '8', bytes: '00 08' },
    ],
  },
  {
    protocol: 'Modbus',
    functionLabel: 'FC=01 Read Coils',
    summaryTemplate: 'Coil status request — output relay bank {bank}',
    rawHexTemplate: '00 {txid} 00 00 00 06 01 01 00 {bank} 00 10',
    severityWeights: [['info', 60], ['low', 30], ['medium', 10]],
    fields: [
      { name: 'Function Code', value: '0x01 Read Coils', bytes: '01' },
      { name: 'Coil Start', value: 'bank base', bytes: '00 XX' },
      { name: 'Quantity', value: '16', bytes: '00 10' },
    ],
  },
  {
    protocol: 'Modbus',
    functionLabel: 'FC=16 Write Multiple Registers',
    summaryTemplate: 'Multi-register write to address {addr} ({count} regs)',
    rawHexTemplate: '00 {txid} 00 00 00 0B 01 10 {addr} 00 02 04 {vals}',
    severityWeights: [['low', 30], ['medium', 40], ['high', 20], ['critical', 10]],
    fields: [
      { name: 'Function Code', value: '0x10 Write Multiple', bytes: '10', flag: 'warn' },
      { name: 'Register Address', value: 'varies', bytes: 'XX XX' },
      { name: 'Register Count', value: '2', bytes: '00 02' },
    ],
  },
  {
    protocol: 'DNP3',
    functionLabel: 'FC=01 Read / Class 1 Poll',
    summaryTemplate: 'Class 1 unsolicited data from DNP3 outstation {src}',
    rawHexTemplate: '05 64 14 44 {dst} {src} {crc} C0 C1 81 00 00 1E 01 00 00 00 00 {val}',
    severityWeights: [['info', 65], ['low', 25], ['medium', 10]],
    fields: [
      { name: 'Start Bytes', value: '0x0564', bytes: '05 64' },
      { name: 'Control', value: '0x44 PRM=1', bytes: '44' },
      { name: 'App Header', value: 'FIR=1 FIN=1 FC=1', bytes: 'C0 C1' },
    ],
  },
  {
    protocol: 'DNP3',
    functionLabel: 'FC=03 Read / Direct Operate',
    summaryTemplate: 'Direct operate command — CROB control object to {dst}',
    rawHexTemplate: '05 64 18 44 {dst} {src} {crc} C0 C3 03 3C 01 06',
    severityWeights: [['medium', 40], ['high', 40], ['critical', 20]],
    fields: [
      { name: 'Function Code', value: '0xC3 Direct Operate', bytes: 'C3', flag: 'warn' },
      { name: 'Object 12 Var 1', value: 'CROB', bytes: '3C 01 06', flag: 'anomaly', note: 'Control relay output block' },
    ],
  },
  {
    protocol: 'S7',
    functionLabel: 'Job — Read SZL',
    summaryTemplate: 'SZL diagnostic read from {src} (ID=0x{szlId})',
    rawHexTemplate: '03 00 00 21 02 F0 80 32 07 00 00 {seq} 00 08 00 04 00 01 12 04 11 44 01 00 FF 09 00 04 00 {szlId}',
    severityWeights: [['info', 50], ['low', 30], ['medium', 20]],
    fields: [
      { name: 'ROSCTR', value: '0x07 Userdata', bytes: '07' },
      { name: 'SZL-ID', value: '0x001C (modules)', bytes: '00 1C' },
    ],
  },
  {
    protocol: 'S7',
    functionLabel: 'Job — Read Variable',
    summaryTemplate: 'DB{db} byte {offset} read from {src}',
    rawHexTemplate: '03 00 00 1F 02 F0 80 32 01 00 00 {seq} 00 0E 00 00 04 01 12 0A 10 02 00 01 00 {db} 84 00 {offset}',
    severityWeights: [['info', 60], ['low', 30], ['medium', 10]],
    fields: [
      { name: 'Function Code', value: '0x04 Read Variable', bytes: '04' },
      { name: 'Transport size', value: '0x02 BYTE', bytes: '10 02' },
    ],
  },
];

// ─── Asset catalogue (in-memory cache, refreshed periodically) ────────────────

interface AssetRow { assetId: string; protocol: Protocol; name: string; baseline: string }

let _assetCache: AssetRow[] = [];
let _assetCacheRefreshedAt = 0;

async function getCachedAssets(): Promise<AssetRow[]> {
  const now = Date.now();
  if (_assetCache.length > 0 && now - _assetCacheRefreshedAt < 60_000) return _assetCache;
  try {
    const rows = await feedDb
      .select({
        assetId: otIcsAssetsTable.assetId,
        protocol: otIcsAssetsTable.protocol,
        name: otIcsAssetsTable.name,
        baseline: otIcsAssetsTable.baseline,
      })
      .from(otIcsAssetsTable);
    if (rows.length > 0) {
      _assetCache = rows as AssetRow[];
      _assetCacheRefreshedAt = now;
    }
  } catch (err) {
    logger.warn({ err }, '[ot-ics-feed] getCachedAssets DB query failed — using stale cache');
  }
  return _assetCache;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randHex(bytes: number): string {
  return Array.from({ length: bytes }, () => randInt(0, 255).toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

function pickWeighted<T>(weights: Array<[T, number]>): T {
  const total = weights.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [item, w] of weights) {
    r -= w;
    if (r <= 0) return item;
  }
  return weights[weights.length - 1][0];
}

function pickTemplate(protocol?: Protocol): FrameTemplate {
  const pool = protocol
    ? FRAME_TEMPLATES.filter((t) => t.protocol === protocol)
    : FRAME_TEMPLATES;
  return pool[randInt(0, pool.length - 1)];
}

const ASSET_IPS: Record<string, string> = {
  'PLC-Boiler-2': '10.4.12.41',
  'S7-CPU-413': '10.4.12.50',
  'PLC-Reactor-1': '10.4.12.55',
  'HMI-A': '10.4.12.18',
  'RTU-Substation-7': '10.4.12.60',
  'ENG-WS-3': '10.4.12.65',
};

function assetIp(assetId: string): string {
  return ASSET_IPS[assetId] ?? `10.4.99.${randInt(1, 254)}`;
}

function generateFrameId(): string {
  const prefix = ['PKT-MB', 'PKT-DNP', 'PKT-S7'][randInt(0, 2)];
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${randInt(100, 999)}`;
}

function generateLiveFrame(
  asset: AssetRow,
  template: FrameTemplate,
): typeof otIcsDecodedFramesTable.$inferInsert {
  const severity = pickWeighted(template.severityWeights);
  const srcAssetId = asset.assetId;
  const srcIp = assetIp(srcAssetId);

  const dstAssets = _assetCache.filter((a) => a.assetId !== srcAssetId && a.protocol === template.protocol);
  const dstAsset = dstAssets.length > 0 ? dstAssets[randInt(0, dstAssets.length - 1)] : asset;
  const dstIp = assetIp(dstAsset.assetId);

  const txSeq = randHex(2);
  const summary = template.summaryTemplate
    .replace('{src}', srcAssetId)
    .replace('{dst}', dstAsset.assetId)
    .replace('{start}', String(randInt(40001, 40050)))
    .replace('{end}', String(randInt(40050, 40100)))
    .replace('{addr}', randHex(2))
    .replace('{bank}', String(randInt(0, 7)))
    .replace('{count}', String(randInt(2, 8)))
    .replace('{db}', String(randInt(1, 50)))
    .replace('{offset}', String(randInt(0, 200)))
    .replace('{szlId}', randHex(2).replace(' ', ''));

  const rawHex = template.rawHexTemplate
    .replace('{txid}', txSeq)
    .replace('{addr}', randHex(2))
    .replace('{qty}', randHex(2))
    .replace('{bank}', randHex(1))
    .replace('{vals}', randHex(4))
    .replace('{dst}', randHex(2))
    .replace('{src}', randHex(2))
    .replace('{crc}', randHex(2))
    .replace('{val}', randHex(3))
    .replace('{seq}', randHex(2))
    .replace('{szlId}', randHex(2))
    .replace('{db}', randHex(2))
    .replace('{offset}', randHex(3));

  return {
    frameId: generateFrameId(),
    observedAt: new Date(),
    protocol: template.protocol,
    src: `${srcIp} (${srcAssetId})`,
    dst: `${dstIp} (${dstAsset.assetId})`,
    assetId: srcAssetId,
    functionLabel: template.functionLabel,
    summary,
    severity,
    rawHex,
    fields: template.fields.map((f) => ({ ...f })),
  };
}

// ─── Anomaly score update (rolling current-hour bucket) ───────────────────────

async function updateRollingAnomalyScores(assets: AssetRow[]): Promise<void> {
  const now = new Date();
  const bucket = new Date(now);
  bucket.setMinutes(0, 0, 0);

  for (const asset of assets) {
    try {
      const baseline = Number(asset.baseline) || 10;

      // Fetch the previous bucket score for continuity
      const since = new Date(bucket.getTime() - 2 * 3600_000);
      const recent = await feedDb
        .select({ score: otIcsAnomalyScoresTable.score })
        .from(otIcsAnomalyScoresTable)
        .where(
          and(
            eq(otIcsAnomalyScoresTable.assetId, asset.assetId),
            gte(otIcsAnomalyScoresTable.bucketAt, since),
          ),
        )
        .orderBy(desc(otIcsAnomalyScoresTable.bucketAt))
        .limit(2);

      const prevScore = recent.length > 1 ? Number(recent[1].score) : baseline;

      // Random walk clamped to a plausible range around the baseline
      const walk = (Math.random() - 0.45) * (baseline * 0.35);
      const rawScore = prevScore + walk;
      const score = Math.max(baseline * 0.5, Math.min(baseline * 8, Math.round(rawScore * 100) / 100));

      const isAnomalous = score > baseline * 2.5;
      const reason = isAnomalous ? 'Elevated frame rate + unusual function-code mix' : null;

      await feedDb
        .insert(otIcsAnomalyScoresTable)
        .values({
          assetId: asset.assetId,
          bucketAt: bucket,
          score: String(score),
          baselineSnapshot: String(baseline),
          reason,
        })
        .onConflictDoUpdate({
          target: [otIcsAnomalyScoresTable.assetId, otIcsAnomalyScoresTable.bucketAt],
          set: {
            score: sql`excluded.score`,
            reason: sql`excluded.reason`,
          },
        });
    } catch (err) {
      logger.warn({ err, assetId: asset.assetId }, '[ot-ics-feed] Failed to update anomaly score');
    }
  }
}

// ─── Conversation helper ──────────────────────────────────────────────────────

async function appendConversationFrame(
  frame: typeof otIcsDecodedFramesTable.$inferInsert,
  sessionId: string,
): Promise<void> {
  try {
    const [{ maxSeq }] = await feedDb
      .execute(
        sql`SELECT COALESCE(MAX(seq), 0) AS "maxSeq" FROM ot_ics_conversations WHERE session_id = ${sessionId}`,
      )
      .then((r) => (r as unknown as { rows: Array<{ maxSeq: number }> }).rows);

    const nextSeq = (maxSeq ?? 0) + 1;
    const direction = Math.random() > 0.5 ? '→' : '←';
    const [srcLabel] = (frame.src as string).split(' (');
    const [dstLabel] = (frame.dst as string).split(' (');
    const srcName = srcLabel.trim();
    const dstName = dstLabel.trim();

    await feedDb
      .insert(otIcsConversationsTable)
      .values({
        sessionId,
        seq: nextSeq,
        observedAt: frame.observedAt as Date,
        direction,
        src: direction === '→' ? srcName : dstName,
        dst: direction === '→' ? dstName : srcName,
        protocol: frame.protocol,
        summary: frame.summary as string,
        bytes: (frame.rawHex as string).split(' ').length + 54,
        anomalous: (frame.severity as Severity) === 'critical' || (frame.severity as Severity) === 'high',
        frameId: frame.frameId as string,
        payloadHex: frame.rawHex as string,
      })
      .onConflictDoNothing();
  } catch (err) {
    logger.warn({ err, frameId: frame.frameId }, '[ot-ics-feed] Failed to append conversation frame');
  }
}

// ─── Feed state ───────────────────────────────────────────────────────────────

interface FeedStats {
  tickCount: number;
  framesInserted: number;
  conversationRowsInserted: number;
  scoreUpdates: number;
  lastTickAt: string | null;
  startedAt: string;
}

const feedStats: FeedStats = {
  tickCount: 0,
  framesInserted: 0,
  conversationRowsInserted: 0,
  scoreUpdates: 0,
  lastTickAt: null,
  startedAt: new Date().toISOString(),
};

// ─── Tick ─────────────────────────────────────────────────────────────────────

const LIVE_SESSION_ID = 'LIVE-STREAM';

async function tick(): Promise<void> {
  const assets = await getCachedAssets();
  if (assets.length === 0) {
    logger.warn('[ot-ics-feed] Tick skipped — no assets in cache (DB may not be ready yet)');
    return;
  }

  const frameCount = randInt(FRAMES_PER_TICK_MIN, FRAMES_PER_TICK_MAX);
  let inserted = 0;
  let convInserted = 0;

  for (let i = 0; i < frameCount; i++) {
    const asset = assets[randInt(0, assets.length - 1)];
    const template = pickTemplate(asset.protocol as Protocol);
    const frame = generateLiveFrame(asset, template);

    try {
      const result = await feedDb
        .insert(otIcsDecodedFramesTable)
        .values(frame)
        .onConflictDoNothing()
        .returning({ frameId: otIcsDecodedFramesTable.frameId });

      if (result.length > 0) {
        inserted += 1;
        // Append a matching conversation row ~60% of the time
        if (Math.random() < 0.6) {
          await appendConversationFrame(frame, LIVE_SESSION_ID);
          convInserted += 1;
        }
      }
    } catch (err) {
      logger.warn({ err, frameId: frame.frameId }, '[ot-ics-feed] Frame insert failed');
    }
  }

  await updateRollingAnomalyScores(assets);

  feedStats.tickCount += 1;
  feedStats.framesInserted += inserted;
  feedStats.conversationRowsInserted += convInserted;
  feedStats.scoreUpdates += assets.length;
  feedStats.lastTickAt = new Date().toISOString();

  logger.info(
    { framesInserted: inserted, convInserted, tick: feedStats.tickCount, assetCount: assets.length },
    '[ot-ics-feed] Tick complete',
  );
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

let _timer: ReturnType<typeof setInterval> | null = null;

export function startOtIcsStreamFeed(): void {
  if (_timer) return;
  _timer = setInterval(() => {
    tick().catch((err) => logger.error({ err }, '[ot-ics-feed] Tick error'));
  }, TICK_INTERVAL_MS);
  logger.info({ intervalMs: TICK_INTERVAL_MS }, '[ot-ics-feed] Live OT/ICS stream feed started');
}

export function stopOtIcsStreamFeed(): void {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
    logger.info('[ot-ics-feed] Live OT/ICS stream feed stopped');
  }
}

export function getOtIcsFeedStats(): Readonly<FeedStats> {
  return { ...feedStats };
}

export function isOtIcsFeedRunning(): boolean {
  return _timer !== null;
}

/**
 * Exposed for integration tests only — runs one tick immediately.
 * Do not call from production code.
 */
export async function runOneTick(): Promise<void> {
  return tick();
}
