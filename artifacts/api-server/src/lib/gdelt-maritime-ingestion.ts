import { logger } from "./logger";
import { pool } from "@szl-holdings/db";
import { emitDomainEvent } from "./mastra/event-triggers";
import { publish, WS_CHANNELS } from "./websocket";

export interface GdeltArticle {
  title: string;
  url: string;
  domain: string;
  publishedAt: string;
  sentiment: "negative" | "neutral" | "positive";
  toneScore: number;
  locations: string[];
  themes: string[];
  shareImage?: string;
}

export interface RouteDeviationAlert {
  vesselId: number;
  vesselName: string;
  mmsi: string;
  expectedLat: number;
  expectedLon: number;
  actualLat: number;
  actualLon: number;
  deviationNm: number;
  severity: "minor" | "moderate" | "critical";
  detectedAt: string;
}

async function ensureGdeltTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS gdelt_maritime_events (
      id BIGSERIAL PRIMARY KEY,
      event_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      url TEXT,
      domain TEXT,
      published_at TIMESTAMPTZ,
      sentiment TEXT,
      tone_score NUMERIC(6,2),
      locations JSONB DEFAULT '[]',
      themes JSONB DEFAULT '[]',
      raw JSONB,
      ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_gdelt_maritime_published ON gdelt_maritime_events(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_gdelt_maritime_sentiment ON gdelt_maritime_events(sentiment);
  `);
}

async function fetchGdeltArticles(query: string, maxRecords = 15): Promise<GdeltArticle[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
    url.searchParams.set("query", query);
    url.searchParams.set("mode", "artlist");
    url.searchParams.set("format", "json");
    url.searchParams.set("maxrecords", String(maxRecords));
    url.searchParams.set("sortby", "date");
    url.searchParams.set("sourcelang", "eng");

    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { "User-Agent": "SZL-Vessels/1.0", Accept: "application/json" },
    });

    if (!res.ok) {
      logger.warn({ status: res.status }, "GDELT fetch failed");
      return [];
    }

    const data = (await res.json()) as { articles?: Array<Record<string, unknown>> };
    const articles = data.articles ?? [];

    return articles.map((a: Record<string, unknown>) => {
      const toneScore = typeof a.tone === "number" ? a.tone : parseFloat(String(a.tone ?? "0"));
      return {
        title: String(a.title ?? ""),
        url: String(a.url ?? ""),
        domain: String(a.domain ?? ""),
        publishedAt: String(a.seendate ?? new Date().toISOString()),
        sentiment: toneScore < -2 ? "negative" : toneScore > 2 ? "positive" : "neutral",
        toneScore,
        locations: Array.isArray(a.locations) ? a.locations.map(String) : [],
        themes: Array.isArray(a.themes) ? a.themes.map(String) : [],
        shareImage: a.socialimage ? String(a.socialimage) : undefined,
      };
    });
  } catch (err) {
    logger.warn({ err }, "GDELT article fetch error");
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function runGdeltMaritimeIngestion(): Promise<{
  fetched: number;
  inserted: number;
  negativeCount: number;
  demoMode: boolean;
}> {
  await ensureGdeltTable();

  const queries = [
    "maritime shipping attack piracy",
    "naval incident chokepoint strait",
    "port disruption vessel seizure",
  ];

  let totalFetched = 0;
  let totalInserted = 0;
  let negativeCount = 0;

  for (const query of queries) {
    const articles = await fetchGdeltArticles(query, 10);
    totalFetched += articles.length;

    for (const article of articles) {
      const eventId = Buffer.from(`${article.url}-${article.publishedAt}`).toString("base64url").slice(0, 64);

      try {
        const result = await pool.query(
          `INSERT INTO gdelt_maritime_events
           (event_id, title, url, domain, published_at, sentiment, tone_score, locations, themes, raw, ingested_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
           ON CONFLICT (event_id) DO NOTHING
           RETURNING id`,
          [
            eventId,
            article.title,
            article.url,
            article.domain,
            article.publishedAt,
            article.sentiment,
            article.toneScore,
            JSON.stringify(article.locations),
            JSON.stringify(article.themes),
            JSON.stringify(article),
          ]
        );

        if (result.rowCount && result.rowCount > 0) {
          totalInserted++;
        }

        if (article.sentiment === "negative") {
          negativeCount++;
          if (article.toneScore < -5) {
            await emitDomainEvent("vessel_incident", {
              source: "gdelt",
              title: article.title,
              url: article.url,
              toneScore: article.toneScore,
              publishedAt: article.publishedAt,
              locations: article.locations,
              incidentType: "geopolitical",
              severity: article.toneScore < -10 ? "critical" : "high",
            }, "gdelt-ingestion").catch(() => {});
          }
        }
      } catch (err) {
        logger.warn({ err, eventId }, "Failed to insert GDELT article");
      }
    }

    await new Promise(r => setTimeout(r, 2000));
  }

  logger.info({ totalFetched, totalInserted, negativeCount }, "GDELT maritime ingestion complete");
  return { fetched: totalFetched, inserted: totalInserted, negativeCount, demoMode: false };
}

function haversineNm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function runRouteDeviationDetection(): Promise<{
  checked: number;
  deviationsDetected: number;
  alertsEmitted: number;
}> {
  let checked = 0;
  let deviationsDetected = 0;
  let alertsEmitted = 0;

  try {
    const vesselResult = await pool.query(`
      SELECT v.id, v.name, v.mmsi, vr.waypoints
      FROM vessels v
      JOIN vessels_routes vr ON vr.vessel_id = v.id AND vr.status = 'active'
      WHERE v.status = 'active'
      LIMIT 50
    `);

    for (const vessel of vesselResult.rows) {
      const posResult = await pool.query(`
        SELECT latitude, longitude, recorded_at
        FROM vessels_positions
        WHERE vessel_id = $1
        ORDER BY recorded_at DESC
        LIMIT 1
      `, [vessel.id]);

      if (posResult.rows.length === 0) continue;
      checked++;

      const pos = posResult.rows[0];
      const actualLat = parseFloat(pos.latitude);
      const actualLon = parseFloat(pos.longitude);

      const waypoints = Array.isArray(vessel.waypoints) ? vessel.waypoints : [];
      if (waypoints.length < 2) continue;

      const normalizeWpCoords = (wp: Record<string, unknown>): { lat: number; lon: number } => ({
        lat: parseFloat(String(wp["lat"] ?? wp["latitude"] ?? "0")),
        lon: parseFloat(String(wp["lon"] ?? wp["longitude"] ?? "0")),
      });

      let minDeviation = Infinity;
      let closestWpLat = 0;
      let closestWpLon = 0;
      for (const wp of waypoints) {
        const { lat: wpLat, lon: wpLon } = normalizeWpCoords(wp as Record<string, unknown>);
        const dist = haversineNm(actualLat, actualLon, wpLat, wpLon);
        if (dist < minDeviation) {
          minDeviation = dist;
          closestWpLat = wpLat;
          closestWpLon = wpLon;
        }
      }

      const DEVIATION_THRESHOLD_NM = 25;
      if (minDeviation > DEVIATION_THRESHOLD_NM) {
        deviationsDetected++;
        const severity: RouteDeviationAlert["severity"] =
          minDeviation > 100 ? "critical" : minDeviation > 50 ? "moderate" : "minor";

        const wpLat = closestWpLat;
        const wpLon = closestWpLon;

        const alert: RouteDeviationAlert = {
          vesselId: vessel.id,
          vesselName: vessel.name,
          mmsi: vessel.mmsi ?? "",
          expectedLat: wpLat,
          expectedLon: wpLon,
          actualLat,
          actualLon,
          deviationNm: Math.round(minDeviation),
          severity,
          detectedAt: new Date().toISOString(),
        };

        logger.warn({ alert }, "Route deviation detected");

        await emitDomainEvent("vessel_incident", {
          ...alert,
          incidentType: "route_deviation",
          source: "ais-deviation-scan",
        }, "route-deviation-scan").catch(() => {});

        publish(WS_CHANNELS.INCIDENTS, "route_deviation", {
          ...alert,
          source: "ais-deviation-scan",
        });

        if (severity === "critical" || severity === "moderate") {
          await emitDomainEvent("compliance_deadline", {
            incidentType: "vessel_route_deviation",
            vesselId: alert.vesselId,
            vesselName: alert.vesselName,
            mmsi: alert.mmsi,
            deviationNm: alert.deviationNm,
            severity,
            urgency: severity === "critical" ? "critical" : "urgent",
            description: `Vessel ${alert.vesselName} (MMSI ${alert.mmsi}) deviated ${alert.deviationNm} NM from expected route. Potential regulatory/compliance implications.`,
            detectedAt: alert.detectedAt,
            source: "ais-route-deviation",
            requiresComplianceReview: severity === "critical",
          }, "route-deviation-prism").catch(() => {});
        }

        if (severity === "critical") {
          const { jobQueue } = await import("./job-queue");
          jobQueue.enqueue("aegis_incident_playbook_job", {
            title: `Critical Route Deviation: ${alert.vesselName} (MMSI ${alert.mmsi})`,
            description: `Vessel deviated ${alert.deviationNm} NM from expected route. Expected position: (${alert.expectedLat}, ${alert.expectedLon}). Actual position: (${alert.actualLat}, ${alert.actualLon}).`,
            severity: "critical",
            source: "ais-route-deviation",
            trigger: "route_deviation",
          }).catch(() => {});
        }

        alertsEmitted++;
      }
    }
  } catch (err) {
    logger.warn({ err }, "Route deviation detection error");
  }

  logger.info({ checked, deviationsDetected, alertsEmitted }, "Route deviation detection complete");
  return { checked, deviationsDetected, alertsEmitted };
}

export async function getRecentGdeltEvents(limit = 20): Promise<GdeltArticle[]> {
  try {
    const result = await pool.query(
      `SELECT title, url, domain, published_at, sentiment, tone_score, locations, themes
       FROM gdelt_maritime_events
       ORDER BY published_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows.map(r => ({
      title: r.title,
      url: r.url,
      domain: r.domain,
      publishedAt: r.published_at,
      sentiment: r.sentiment,
      toneScore: parseFloat(r.tone_score),
      locations: r.locations ?? [],
      themes: r.themes ?? [],
    }));
  } catch {
    return [];
  }
}
