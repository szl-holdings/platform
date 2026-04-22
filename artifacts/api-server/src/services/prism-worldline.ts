import { db } from '@szl-holdings/db';
import {
  pcWorldlineFeaturesTable,
  pcWorldlineSignalsTable,
  pcWorldlineSourcesTable,
} from '@szl-holdings/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { logger } from '../lib/logger';

type SourceClass =
  | 'regulatory_insurance'
  | 'crash_incident'
  | 'weather_environmental'
  | 'county_demographic'
  | 'court_venue'
  | 'lien_recovery'
  | 'internal_firm';

interface SignalInput {
  orgId: number;
  sourceId: number;
  sourceClass: SourceClass;
  eventType: string;
  title: string;
  summary?: string;
  rawData?: any;
  jurisdiction?: string;
  county?: string;
  geoLat?: number;
  geoLon?: number;
}

const PUBLIC_SOURCES: Array<{
  name: string;
  sourceClass: SourceClass;
  endpoint: string;
  fetchMethod: string;
  description: string;
}> = [
  {
    name: 'NY DFS Complaints',
    sourceClass: 'regulatory_insurance',
    endpoint: 'https://data.ny.gov/resource/7jyb-hfk3.json',
    fetchMethod: 'api_pull',
    description: 'NY DFS insurance complaint data',
  },
  {
    name: 'NYC Open Data Crashes',
    sourceClass: 'crash_incident',
    endpoint: 'https://data.cityofnewyork.us/resource/h9gi-nx95.json',
    fetchMethod: 'api_pull',
    description: 'NYPD motor vehicle crash data',
  },
  {
    name: 'NWS Weather Alerts',
    sourceClass: 'weather_environmental',
    endpoint: 'https://api.weather.gov/alerts/active?area=NY',
    fetchMethod: 'api_pull',
    description: 'National Weather Service active alerts for NY',
  },
  {
    name: 'NWS Observations NYC',
    sourceClass: 'weather_environmental',
    endpoint: 'https://api.weather.gov/stations/KNYC/observations/latest',
    fetchMethod: 'api_pull',
    description: 'NWS latest weather observations NYC',
  },
  {
    name: 'Census ACS County Data',
    sourceClass: 'county_demographic',
    endpoint: 'https://api.census.gov/data/2022/acs/acs5',
    fetchMethod: 'api_pull',
    description: 'Census American Community Survey county-level data',
  },
  {
    name: 'NY Courts eCourts',
    sourceClass: 'court_venue',
    endpoint: 'https://iapps.courts.state.ny.us/nyscef',
    fetchMethod: 'api_pull',
    description: 'NY State Unified Court System public case data',
  },
  {
    name: 'CMS MSP Recovery',
    sourceClass: 'lien_recovery',
    endpoint: 'https://www.cms.gov/medicare-coordination-of-benefits',
    fetchMethod: 'api_pull',
    description: 'CMS Medicare Secondary Payer recovery context',
  },
];

class WorldlineEngine {
  async initializeDefaultSources(orgId: number) {
    for (const src of PUBLIC_SOURCES) {
      const existing = await db
        .select()
        .from(pcWorldlineSourcesTable)
        .where(
          and(eq(pcWorldlineSourcesTable.orgId, orgId), eq(pcWorldlineSourcesTable.name, src.name)),
        )
        .limit(1);
      if (existing.length === 0) {
        await db.insert(pcWorldlineSourcesTable).values({
          orgId,
          sourceClass: src.sourceClass as any,
          name: src.name,
          description: src.description,
          endpoint: src.endpoint,
          fetchMethod: src.fetchMethod as any,
          schedule: 'daily',
        });
      }
    }
    logger.info({ orgId, count: PUBLIC_SOURCES.length }, 'Worldline default sources initialized');
  }

  async fetchSource(orgId: number, sourceId: number): Promise<number> {
    const [source] = await db
      .select()
      .from(pcWorldlineSourcesTable)
      .where(eq(pcWorldlineSourcesTable.id, sourceId));
    if (!source) throw new Error(`Source ${sourceId} not found`);

    try {
      const rawSignals = await this.pullFromSource(source);
      let ingested = 0;

      for (const raw of rawSignals) {
        const normalized = this.normalizeSignal(raw, source);
        const scored = this.scoreSignal(normalized, source);

        await db.insert(pcWorldlineSignalsTable).values({
          orgId,
          sourceId,
          sourceClass: source.sourceClass,
          eventType: scored.eventType,
          title: scored.title,
          summary: scored.summary,
          rawData: raw,
          normalizedData: scored.normalized,
          jurisdiction: scored.jurisdiction,
          county: scored.county,
          geoLat: scored.geoLat,
          geoLon: scored.geoLon,
          freshnessScore: scored.freshnessScore,
          provenanceScore: scored.provenanceScore,
          legalUsefulnessScore: scored.legalUsefulnessScore,
        });
        ingested++;
      }

      await db
        .update(pcWorldlineSourcesTable)
        .set({
          lastFetchAt: new Date(),
          lastFetchStatus: 'success',
          totalSignals: (source.totalSignals ?? 0) + ingested,
          updatedAt: new Date(),
        })
        .where(eq(pcWorldlineSourcesTable.id, sourceId));

      logger.info({ sourceId, name: source.name, ingested }, 'Worldline source fetched');
      return ingested;
    } catch (error: any) {
      await db
        .update(pcWorldlineSourcesTable)
        .set({
          lastFetchAt: new Date(),
          lastFetchStatus: `error: ${error.message}`,
          updatedAt: new Date(),
        })
        .where(eq(pcWorldlineSourcesTable.id, sourceId));
      throw error;
    }
  }

  private async pullFromSource(source: any): Promise<any[]> {
    if (!source.endpoint) return [];
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(source.endpoint, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timer);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data.slice(0, 50) : [data];
    } catch (e: any) {
      logger.warn({ source: source.name, error: e.message }, 'Worldline source fetch failed');
      return [];
    }
  }

  private normalizeSignal(raw: any, source: any) {
    const title =
      raw.title ??
      raw.complaint_type ??
      raw.event_type ??
      raw.name ??
      `${source.sourceClass} signal`;
    const summary =
      raw.summary ?? raw.description ?? raw.descriptor ?? JSON.stringify(raw).substring(0, 200);
    return { ...raw, _title: title, _summary: summary, _sourceClass: source.sourceClass };
  }

  private scoreSignal(normalized: any, source: any) {
    const now = Date.now();
    const eventDate =
      normalized.date ?? normalized.crash_date ?? normalized.created_date ?? normalized.onset;
    const ageMs = eventDate ? now - new Date(eventDate).getTime() : now;
    const ageDays = ageMs / 86400000;

    const freshnessScore = Math.max(0, Math.min(1, 1 - ageDays / 365));
    const provenanceScore = source.fetchMethod === 'api_pull' ? 0.9 : 0.7;
    const legalUsefulnessScore = this.estimateLegalUsefulness(normalized, source.sourceClass);

    return {
      eventType: normalized._sourceClass,
      title: normalized._title,
      summary: normalized._summary,
      normalized: normalized,
      jurisdiction: normalized.jurisdiction ?? normalized.state ?? 'NY',
      county: normalized.county ?? normalized.borough ?? null,
      geoLat: parseFloat(normalized.latitude ?? normalized.geo_lat ?? '0') || null,
      geoLon: parseFloat(normalized.longitude ?? normalized.geo_lon ?? '0') || null,
      freshnessScore,
      provenanceScore,
      legalUsefulnessScore,
    };
  }

  private estimateLegalUsefulness(_data: any, sourceClass: string): number {
    const usefulnessBase: Record<string, number> = {
      regulatory_insurance: 0.85,
      crash_incident: 0.8,
      weather_environmental: 0.6,
      county_demographic: 0.5,
      court_venue: 0.9,
      lien_recovery: 0.75,
      internal_firm: 0.95,
    };
    return usefulnessBase[sourceClass] ?? 0.5;
  }

  async publishFeatures(orgId: number, signalId: number, matterId: number) {
    const [signal] = await db
      .select()
      .from(pcWorldlineSignalsTable)
      .where(eq(pcWorldlineSignalsTable.id, signalId));
    if (!signal) return;

    const features = this.deriveFeatures(signal);
    for (const f of features) {
      await db.insert(pcWorldlineFeaturesTable).values({
        orgId,
        signalId,
        matterId,
        featureName: f.name,
        featureValue: f.value,
        featureText: f.text,
        sourceClass: signal.sourceClass,
        confidence: f.confidence,
      });
    }

    await db
      .update(pcWorldlineSignalsTable)
      .set({
        featuresPublished: true,
        matchedMatterIds: [...((signal.matchedMatterIds as number[]) ?? []), matterId],
      })
      .where(eq(pcWorldlineSignalsTable.id, signalId));
  }

  private deriveFeatures(
    signal: any,
  ): Array<{ name: string; value: number; text: string; confidence: number }> {
    return [
      {
        name: `${signal.sourceClass}_signal_strength`,
        value: signal.legalUsefulnessScore ?? 0.5,
        text: signal.title,
        confidence: signal.provenanceScore ?? 0.7,
      },
      {
        name: `${signal.sourceClass}_freshness`,
        value: signal.freshnessScore ?? 0.5,
        text: `Freshness: ${signal.freshnessScore}`,
        confidence: 0.95,
      },
    ];
  }

  async getSources(orgId: number) {
    return db
      .select()
      .from(pcWorldlineSourcesTable)
      .where(eq(pcWorldlineSourcesTable.orgId, orgId));
  }

  async getSignals(orgId: number, opts?: { sourceClass?: string; limit?: number }) {
    const conditions = [eq(pcWorldlineSignalsTable.orgId, orgId)];
    if (opts?.sourceClass) {
      conditions.push(eq(pcWorldlineSignalsTable.sourceClass, opts.sourceClass as any));
    }
    return db
      .select()
      .from(pcWorldlineSignalsTable)
      .where(and(...conditions))
      .orderBy(desc(pcWorldlineSignalsTable.createdAt))
      .limit(opts?.limit ?? 100);
  }

  async getFeatures(orgId: number, matterId: number) {
    return db
      .select()
      .from(pcWorldlineFeaturesTable)
      .where(
        and(
          eq(pcWorldlineFeaturesTable.orgId, orgId),
          eq(pcWorldlineFeaturesTable.matterId, matterId),
        ),
      );
  }
}

export const worldlineEngine = new WorldlineEngine();
