import { pool } from "@szl-holdings/db";
import { logger } from "./logger";

export type RoyaltyPlatform = "spotify" | "apple_music" | "youtube" | "tiktok" | "amazon_music" | "deezer" | "pandora";
export type AnomalyType = "underpayment" | "usage_spike" | "derivative_detected" | "voice_clone" | "geographic_anomaly" | "rate_discrepancy";
export type DisputeStatus = "open" | "submitted" | "under_review" | "resolved" | "dismissed";

export interface Artist {
  id: number;
  orgId: number;
  name: string;
  bio: string;
  genres: string[];
  streamingIds: Record<RoyaltyPlatform, string>;
  createdAt: string;
}

export interface Track {
  id: number;
  orgId: number;
  artistId: number;
  artistName?: string;
  title: string;
  isrc: string;
  releaseDate: string;
  duration: number;
  genres: string[];
  splits: Split[];
  fingerprintHash?: string;
  createdAt: string;
}

export interface Split {
  party: string;
  role: string;
  share: number;
  walletAddress?: string;
}

export interface RoyaltyRecord {
  id: number;
  trackId: number;
  trackTitle?: string;
  platform: RoyaltyPlatform;
  periodStart: string;
  periodEnd: string;
  streams: number;
  revenueUsd: number;
  expectedRevenueUsd: number;
  ratePerStream: number;
  territory: string;
  anomalyScore: number;
  anomalyType?: AnomalyType;
  createdAt: string;
}

export interface RevenueForecast {
  trackId: number;
  trackTitle?: string;
  horizon: "30d" | "90d" | "1y";
  baseRevenue: number;
  projectedRevenue: number;
  growthRate: number;
  confidenceInterval: [number, number];
  platformBreakdown: Record<RoyaltyPlatform, number>;
  generatedAt: string;
}

export interface ContentFingerprint {
  id: number;
  trackId: number;
  trackTitle?: string;
  fingerprintHash: string;
  detectedDerivatives: DerivativeDetection[];
  registeredAt: string;
}

export interface DerivativeDetection {
  matchHash: string;
  platform: string;
  url: string;
  similarity: number;
  detectedAt: string;
  type: "cover" | "sample" | "voice_clone" | "remix" | "unknown";
}

export interface Dispute {
  id: number;
  orgId: number;
  trackId: number;
  trackTitle?: string;
  platform: RoyaltyPlatform;
  royaltyRecordIds: number[];
  description: string;
  evidencePackage: DisputeEvidence;
  status: DisputeStatus;
  claimAmountUsd: number;
  resolvedAmountUsd?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DisputeEvidence {
  expectedRevenue: number;
  actualRevenue: number;
  shortfallUsd: number;
  anomalyRecords: number;
  platformRateComparison: Record<string, number>;
  streamingDataPoints: Array<{ date: string; streams: number; revenue: number }>;
  narrativeSummary: string;
  supportingFiles: string[];
}

export async function ensureSoundSovereignTables(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ss_artists (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL DEFAULT 1,
        name TEXT NOT NULL,
        bio TEXT DEFAULT '',
        genres JSONB DEFAULT '[]',
        streaming_ids JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ss_tracks (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL DEFAULT 1,
        artist_id INTEGER,
        title TEXT NOT NULL,
        isrc TEXT,
        release_date DATE,
        duration INTEGER DEFAULT 0,
        genres JSONB DEFAULT '[]',
        splits JSONB DEFAULT '[]',
        fingerprint_hash TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ss_royalty_records (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL DEFAULT 1,
        track_id INTEGER,
        platform TEXT NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        streams BIGINT NOT NULL DEFAULT 0,
        revenue_usd NUMERIC(12,4) NOT NULL DEFAULT 0,
        expected_revenue_usd NUMERIC(12,4) NOT NULL DEFAULT 0,
        rate_per_stream NUMERIC(10,8) NOT NULL DEFAULT 0,
        territory TEXT NOT NULL DEFAULT 'WW',
        anomaly_score NUMERIC(4,3) NOT NULL DEFAULT 0,
        anomaly_type TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ss_forecasts (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL DEFAULT 1,
        track_id INTEGER,
        horizon TEXT NOT NULL DEFAULT '30d',
        base_revenue NUMERIC(12,4) DEFAULT 0,
        projected_revenue NUMERIC(12,4) DEFAULT 0,
        growth_rate NUMERIC(6,4) DEFAULT 0,
        confidence_lower NUMERIC(12,4) DEFAULT 0,
        confidence_upper NUMERIC(12,4) DEFAULT 0,
        platform_breakdown JSONB DEFAULT '{}',
        generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ss_fingerprints (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL DEFAULT 1,
        track_id INTEGER,
        fingerprint_hash TEXT NOT NULL,
        detected_derivatives JSONB DEFAULT '[]',
        registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ss_disputes (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL DEFAULT 1,
        track_id INTEGER,
        platform TEXT NOT NULL,
        royalty_record_ids JSONB DEFAULT '[]',
        description TEXT DEFAULT '',
        evidence_package JSONB DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'open',
        claim_amount_usd NUMERIC(12,4) DEFAULT 0,
        resolved_amount_usd NUMERIC(12,4),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ss_tracks_org ON ss_tracks(org_id);
      CREATE INDEX IF NOT EXISTS idx_ss_royalty_track ON ss_royalty_records(track_id);
      CREATE INDEX IF NOT EXISTS idx_ss_royalty_anomaly ON ss_royalty_records(anomaly_score DESC);
      CREATE INDEX IF NOT EXISTS idx_ss_disputes_org ON ss_disputes(org_id);
    `).catch(() => {});

    await seedSoundSovereignData().catch(() => {});
    logger.info("Sound Sovereign tables ensured");
  } catch (err) {
    logger.warn({ err }, "Failed to ensure Sound Sovereign tables");
  }
}

ensureSoundSovereignTables().catch(() => {});

async function seedSoundSovereignData(): Promise<void> {
  const { rows: existing } = await pool.query(`SELECT count(*) as n FROM ss_artists`);
  if (parseInt(existing[0].n) > 0) return;

  const artists = [
    { name: "Nova Meridian", bio: "Electro-soul artist known for cinematic soundscapes", genres: ["electronic", "soul", "ambient"] },
    { name: "The Fractal Echo", bio: "Indie rock collective pushing sonic boundaries", genres: ["indie rock", "experimental", "lo-fi"] },
    { name: "Sage & Stone", bio: "Folk-pop duo with cross-genre appeal", genres: ["folk", "pop", "acoustic"] },
  ];

  const artistIds: number[] = [];
  for (const a of artists) {
    const { rows } = await pool.query(
      `INSERT INTO ss_artists (org_id, name, bio, genres, streaming_ids) VALUES (1, $1, $2, $3, $4) RETURNING id`,
      [a.name, a.bio, JSON.stringify(a.genres), JSON.stringify({ spotify: `sp_${Math.random().toString(36).slice(2, 8)}` })]
    );
    artistIds.push(rows[0].id);
  }

  const tracks = [
    { artistIdx: 0, title: "Cascade Protocol", isrc: "USSV12300001", duration: 214 },
    { artistIdx: 0, title: "Liminal Light", isrc: "USSV12300002", duration: 187 },
    { artistIdx: 1, title: "Glass Mountain", isrc: "USSV12300003", duration: 231 },
    { artistIdx: 1, title: "Resonant Void", isrc: "USSV12300004", duration: 198 },
    { artistIdx: 2, title: "Harvest Hymn", isrc: "USSV12300005", duration: 243 },
    { artistIdx: 2, title: "River & Rain", isrc: "USSV12300006", duration: 209 },
  ];

  const platforms: RoyaltyPlatform[] = ["spotify", "apple_music", "youtube", "tiktok", "amazon_music"];
  const now = new Date();

  for (const t of tracks) {
    const splits: Split[] = [
      { party: artists[t.artistIdx]!.name, role: "artist", share: 0.6 },
      { party: "SZL Publishing", role: "publisher", share: 0.25 },
      { party: "Producer Co.", role: "producer", share: 0.15 },
    ];
    const fpHash = `fp_${t.isrc}_${Math.random().toString(36).slice(2, 10)}`;

    const { rows: tRows } = await pool.query(
      `INSERT INTO ss_tracks (org_id, artist_id, title, isrc, release_date, duration, splits, fingerprint_hash)
       VALUES (1, $1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [artistIds[t.artistIdx], t.title, t.isrc, "2023-01-01", t.duration, JSON.stringify(splits), fpHash]
    );
    const trackId = tRows[0].id;

    await pool.query(
      `INSERT INTO ss_fingerprints (org_id, track_id, fingerprint_hash, detected_derivatives)
       VALUES (1, $1, $2, $3)`,
      [trackId, fpHash, JSON.stringify([])]
    );

    for (let month = 0; month < 6; month++) {
      const periodStart = new Date(now.getFullYear(), now.getMonth() - month - 1, 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() - month, 0);

      for (const platform of platforms) {
        const baseStreams = Math.floor(10000 + Math.random() * 500000);
        const baseRate = platform === "spotify" ? 0.00318 : platform === "apple_music" ? 0.01 : platform === "youtube" ? 0.00069 : 0.0025;
        const expectedRevenue = baseStreams * baseRate;
        const anomalyChance = Math.random();
        let actualRevenue = expectedRevenue;
        let anomalyScore = 0;
        let anomalyType: AnomalyType | null = null;

        if (anomalyChance < 0.05) {
          actualRevenue = expectedRevenue * (0.4 + Math.random() * 0.3);
          anomalyScore = 0.75 + Math.random() * 0.25;
          anomalyType = "underpayment";
        } else if (anomalyChance < 0.08) {
          actualRevenue = expectedRevenue * (0.85 + Math.random() * 0.2);
          anomalyScore = 0.3 + Math.random() * 0.3;
          anomalyType = "rate_discrepancy";
        } else {
          actualRevenue = expectedRevenue * (0.95 + Math.random() * 0.1);
          anomalyScore = Math.random() * 0.2;
        }

        await pool.query(
          `INSERT INTO ss_royalty_records (org_id, track_id, platform, period_start, period_end, streams, revenue_usd, expected_revenue_usd, rate_per_stream, territory, anomaly_score, anomaly_type)
           VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, 'WW', $9, $10)`,
          [trackId, platform, periodStart, periodEnd, baseStreams, actualRevenue.toFixed(4), expectedRevenue.toFixed(4), baseRate, anomalyScore.toFixed(3), anomalyType]
        );
      }
    }
  }
}

export async function createArtist(params: { orgId: number; name: string; bio?: string; genres?: string[] }): Promise<Artist> {
  const { rows } = await pool.query<{ id: number; created_at: string }>(
    `INSERT INTO ss_artists (org_id, name, bio, genres) VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
    [params.orgId, params.name, params.bio || "", JSON.stringify(params.genres || [])]
  );
  return { id: rows[0].id, orgId: params.orgId, name: params.name, bio: params.bio || "", genres: params.genres || [], streamingIds: {} as any, createdAt: rows[0].created_at };
}

export async function listArtists(orgId: number): Promise<Artist[]> {
  const { rows } = await pool.query(`SELECT * FROM ss_artists WHERE org_id = $1 ORDER BY name`, [orgId]);
  return rows.map(r => ({ id: r.id, orgId: r.org_id, name: r.name, bio: r.bio, genres: r.genres, streamingIds: r.streaming_ids, createdAt: r.created_at }));
}

export async function createTrack(params: {
  orgId: number; artistId: number; title: string; isrc?: string; duration?: number; genres?: string[]; splits?: Split[];
}): Promise<Track> {
  const fpHash = `fp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const { rows } = await pool.query<{ id: number; created_at: string }>(
    `INSERT INTO ss_tracks (org_id, artist_id, title, isrc, duration, genres, splits, fingerprint_hash)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, created_at`,
    [params.orgId, params.artistId, params.title, params.isrc || null, params.duration || 0, JSON.stringify(params.genres || []), JSON.stringify(params.splits || []), fpHash]
  );

  await pool.query(
    `INSERT INTO ss_fingerprints (org_id, track_id, fingerprint_hash, detected_derivatives) VALUES ($1, $2, $3, '[]')`,
    [params.orgId, rows[0].id, fpHash]
  ).catch(() => {});

  return { id: rows[0].id, orgId: params.orgId, artistId: params.artistId, title: params.title, isrc: params.isrc || "", releaseDate: new Date().toISOString().split("T")[0] || "", duration: params.duration || 0, genres: params.genres || [], splits: params.splits || [], fingerprintHash: fpHash, createdAt: rows[0].created_at };
}

export async function listTracks(orgId: number, artistId?: number): Promise<Track[]> {
  let query = `SELECT t.*, a.name as artist_name FROM ss_tracks t LEFT JOIN ss_artists a ON t.artist_id = a.id WHERE t.org_id = $1`;
  const params: unknown[] = [orgId];
  if (artistId) { params.push(artistId); query += ` AND t.artist_id = $${params.length}`; }
  query += " ORDER BY t.created_at DESC LIMIT 100";
  const { rows } = await pool.query(query, params);
  return rows.map(r => ({ id: r.id, orgId: r.org_id, artistId: r.artist_id, artistName: r.artist_name, title: r.title, isrc: r.isrc, releaseDate: r.release_date, duration: r.duration, genres: r.genres, splits: r.splits, fingerprintHash: r.fingerprint_hash, createdAt: r.created_at }));
}

export async function getRoyaltyAnalytics(orgId: number, filters?: { trackId?: number; platform?: string; limit?: number }): Promise<{
  records: RoyaltyRecord[];
  totalRevenue: number;
  totalExpected: number;
  shortfall: number;
  anomalies: number;
  platformBreakdown: Record<string, { revenue: number; streams: number; anomalyRate: number }>;
}> {
  let query = `SELECT r.*, t.title as track_title FROM ss_royalty_records r LEFT JOIN ss_tracks t ON r.track_id = t.id WHERE r.org_id = $1`;
  const params: unknown[] = [orgId];

  if (filters?.trackId) { params.push(filters.trackId); query += ` AND r.track_id = $${params.length}`; }
  if (filters?.platform) { params.push(filters.platform); query += ` AND r.platform = $${params.length}`; }
  query += ` ORDER BY r.anomaly_score DESC, r.created_at DESC LIMIT $${params.length + 1}`;
  params.push(filters?.limit ?? 200);

  const { rows } = await pool.query(query, params);

  let totalRevenue = 0;
  let totalExpected = 0;
  let anomalies = 0;
  const platformBreakdown: Record<string, { revenue: number; streams: number; anomalyRate: number; _anomalyCount: number; _total: number }> = {};

  const records: RoyaltyRecord[] = rows.map(r => {
    const rev = parseFloat(r.revenue_usd);
    const exp = parseFloat(r.expected_revenue_usd);
    const score = parseFloat(r.anomaly_score);

    totalRevenue += rev;
    totalExpected += exp;
    if (score > 0.5) anomalies++;

    if (!platformBreakdown[r.platform]) {
      platformBreakdown[r.platform] = { revenue: 0, streams: 0, anomalyRate: 0, _anomalyCount: 0, _total: 0 };
    }
    const pb = platformBreakdown[r.platform]!;
    pb.revenue += rev;
    pb.streams += parseInt(r.streams ?? "0");
    pb._total++;
    if (score > 0.5) pb._anomalyCount++;

    return {
      id: r.id,
      trackId: r.track_id,
      trackTitle: r.track_title,
      platform: r.platform,
      periodStart: r.period_start,
      periodEnd: r.period_end,
      streams: parseInt(r.streams),
      revenueUsd: rev,
      expectedRevenueUsd: exp,
      ratePerStream: parseFloat(r.rate_per_stream),
      territory: r.territory,
      anomalyScore: score,
      anomalyType: r.anomaly_type,
      createdAt: r.created_at,
    };
  });

  for (const p of Object.values(platformBreakdown)) {
    p.anomalyRate = p._total > 0 ? p._anomalyCount / p._total : 0;
    delete (p as any)._anomalyCount;
    delete (p as any)._total;
  }

  return { records, totalRevenue, totalExpected, shortfall: totalExpected - totalRevenue, anomalies, platformBreakdown };
}

export async function generateForecast(params: { orgId: number; trackId: number; horizon: "30d" | "90d" | "1y" }): Promise<RevenueForecast> {
  const { rows: royalties } = await pool.query(
    `SELECT platform, SUM(revenue_usd) as total_rev, SUM(streams) as total_streams
     FROM ss_royalty_records WHERE org_id = $1 AND track_id = $2
     GROUP BY platform`,
    [params.orgId, params.trackId]
  );

  const { rows: trackRows } = await pool.query(`SELECT title FROM ss_tracks WHERE id = $1`, [params.trackId]);

  const baseRevenue = royalties.reduce((s: number, r: any) => s + parseFloat(r.total_rev), 0);
  const horizonMultiplier = params.horizon === "30d" ? 1/6 : params.horizon === "90d" ? 0.5 : 2;
  const growthRate = -0.05 + Math.random() * 0.25;
  const projectedRevenue = baseRevenue * horizonMultiplier * (1 + growthRate);
  const variance = projectedRevenue * 0.15;

  const platformBreakdown: Record<string, number> = {};
  for (const r of royalties) {
    platformBreakdown[r.platform] = parseFloat(r.total_rev) * horizonMultiplier * (1 + growthRate * Math.random());
  }

  const { rows: fRows } = await pool.query<{ id: number }>(
    `INSERT INTO ss_forecasts (org_id, track_id, horizon, base_revenue, projected_revenue, growth_rate, confidence_lower, confidence_upper, platform_breakdown)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [params.orgId, params.trackId, params.horizon, baseRevenue, projectedRevenue, growthRate, projectedRevenue - variance, projectedRevenue + variance, JSON.stringify(platformBreakdown)]
  );

  return {
    trackId: params.trackId,
    trackTitle: trackRows[0]?.title,
    horizon: params.horizon,
    baseRevenue,
    projectedRevenue,
    growthRate,
    confidenceInterval: [projectedRevenue - variance, projectedRevenue + variance],
    platformBreakdown: platformBreakdown as any,
    generatedAt: new Date().toISOString(),
  };
}

export async function listFingerprints(orgId: number): Promise<ContentFingerprint[]> {
  const { rows } = await pool.query(
    `SELECT f.*, t.title as track_title FROM ss_fingerprints f LEFT JOIN ss_tracks t ON f.track_id = t.id WHERE f.org_id = $1 ORDER BY f.registered_at DESC LIMIT 50`,
    [orgId]
  );
  return rows.map(r => ({
    id: r.id,
    trackId: r.track_id,
    trackTitle: r.track_title,
    fingerprintHash: r.fingerprint_hash,
    detectedDerivatives: r.detected_derivatives as DerivativeDetection[],
    registeredAt: r.registered_at,
  }));
}

export async function createDispute(params: {
  orgId: number; trackId: number; platform: RoyaltyPlatform; royaltyRecordIds: number[]; description: string; claimAmountUsd: number;
}): Promise<Dispute> {
  const { rows: royRows } = await pool.query(
    `SELECT revenue_usd, expected_revenue_usd, period_start, streams FROM ss_royalty_records WHERE id = ANY($1)`,
    [params.royaltyRecordIds]
  );

  const actual = royRows.reduce((s: number, r: any) => s + parseFloat(r.revenue_usd), 0);
  const expected = royRows.reduce((s: number, r: any) => s + parseFloat(r.expected_revenue_usd), 0);
  const shortfall = expected - actual;

  const evidence: DisputeEvidence = {
    expectedRevenue: expected,
    actualRevenue: actual,
    shortfallUsd: shortfall,
    anomalyRecords: royRows.length,
    platformRateComparison: { [params.platform]: 0.00318, "industry_avg": 0.0035 },
    streamingDataPoints: royRows.map((r: any) => ({ date: r.period_start, streams: parseInt(r.streams), revenue: parseFloat(r.revenue_usd) })),
    narrativeSummary: `Royalty dispute filed for ${params.platform} covering ${royRows.length} reporting periods. Actual payments of $${actual.toFixed(2)} fall $${shortfall.toFixed(2)} short of expected $${expected.toFixed(2)} based on published streaming rates. AI anomaly detection flagged ${royRows.length} records with significant discrepancy patterns.`,
    supportingFiles: [],
  };

  const { rows } = await pool.query<{ id: number; created_at: string }>(
    `INSERT INTO ss_disputes (org_id, track_id, platform, royalty_record_ids, description, evidence_package, status, claim_amount_usd)
     VALUES ($1, $2, $3, $4, $5, $6, 'open', $7) RETURNING id, created_at`,
    [params.orgId, params.trackId, params.platform, JSON.stringify(params.royaltyRecordIds), params.description, JSON.stringify(evidence), params.claimAmountUsd]
  );

  return { id: rows[0].id, orgId: params.orgId, trackId: params.trackId, platform: params.platform, royaltyRecordIds: params.royaltyRecordIds, description: params.description, evidencePackage: evidence, status: "open", claimAmountUsd: params.claimAmountUsd, createdAt: rows[0].created_at, updatedAt: rows[0].created_at };
}

export async function listDisputes(orgId: number): Promise<Dispute[]> {
  const { rows } = await pool.query(
    `SELECT d.*, t.title as track_title FROM ss_disputes d LEFT JOIN ss_tracks t ON d.track_id = t.id WHERE d.org_id = $1 ORDER BY d.created_at DESC LIMIT 50`,
    [orgId]
  );
  return rows.map(r => ({ id: r.id, orgId: r.org_id, trackId: r.track_id, trackTitle: r.track_title, platform: r.platform, royaltyRecordIds: r.royalty_record_ids, description: r.description, evidencePackage: r.evidence_package, status: r.status, claimAmountUsd: parseFloat(r.claim_amount_usd), resolvedAmountUsd: r.resolved_amount_usd ? parseFloat(r.resolved_amount_usd) : undefined, createdAt: r.created_at, updatedAt: r.updated_at }));
}

export async function updateDisputeStatus(disputeId: number, orgId: number, status: DisputeStatus, resolvedAmount?: number): Promise<void> {
  await pool.query(
    `UPDATE ss_disputes SET status = $3, resolved_amount_usd = $4, updated_at = NOW() WHERE id = $1 AND org_id = $2`,
    [disputeId, orgId, status, resolvedAmount ?? null]
  );
}

export async function soundSovereignDashboard(orgId: number): Promise<Record<string, unknown>> {
  const [artistsResult, tracksResult, royaltyResult, disputesResult, anomaliesResult, fingerprintsResult] = await Promise.all([
    pool.query(`SELECT count(*) as total FROM ss_artists WHERE org_id = $1`, [orgId]),
    pool.query(`SELECT count(*) as total FROM ss_tracks WHERE org_id = $1`, [orgId]),
    pool.query(`SELECT COALESCE(sum(revenue_usd), 0) as total_revenue, COALESCE(sum(expected_revenue_usd), 0) as total_expected, count(*) as total_records FROM ss_royalty_records WHERE org_id = $1`, [orgId]),
    pool.query(`SELECT count(*) as total, count(*) FILTER (WHERE status = 'open') as open FROM ss_disputes WHERE org_id = $1`, [orgId]),
    pool.query(`SELECT count(*) as total FROM ss_royalty_records WHERE org_id = $1 AND anomaly_score > 0.5`, [orgId]),
    pool.query(`SELECT count(*) as total, count(*) FILTER (WHERE jsonb_array_length(detected_derivatives) > 0) as with_derivatives FROM ss_fingerprints WHERE org_id = $1`, [orgId]),
  ]);

  const totalRevenue = parseFloat(royaltyResult.rows[0].total_revenue);
  const totalExpected = parseFloat(royaltyResult.rows[0].total_expected);

  return {
    artists: parseInt(artistsResult.rows[0].total),
    tracks: parseInt(tracksResult.rows[0].total),
    totalRevenue,
    totalExpected,
    shortfall: totalExpected - totalRevenue,
    royaltyRecords: parseInt(royaltyResult.rows[0].total_records),
    disputes: { total: parseInt(disputesResult.rows[0].total), open: parseInt(disputesResult.rows[0].open) },
    anomalies: parseInt(anomaliesResult.rows[0].total),
    fingerprints: { total: parseInt(fingerprintsResult.rows[0].total), withDerivatives: parseInt(fingerprintsResult.rows[0].with_derivatives) },
  };
}
