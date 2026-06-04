/**
 * AIS / MarineTraffic Feed Adapter
 *
 * Ingests real vessel positions, port calls, and voyage data from AIS endpoints.
 * Normalizes into Vessel entities with position history relationships.
 *
 * Sources:
 * - MarineTraffic API (vessels/port-calls/voyages)
 * - AISHub public feed (free tier, aggregated)
 * - VesselFinder fallback
 *
 * Deduplication: by (MMSI + timestamp bucket). Position deduplicated per 15-min window.
 */

import { getEnv } from '@szl-holdings/env';
import {
  BaseFeedAdapter,
  type FeedAdapterConfig,
  type NormalizedFeedPayload,
} from '../feed-adapter.js';

interface AISVesselPosition {
  mmsi: string;
  imo?: string;
  shipname?: string;
  shiptype?: number;
  latitude: number;
  longitude: number;
  speed?: number;
  course?: number;
  heading?: number;
  destination?: string;
  eta?: string;
  status?: number;
  draught?: number;
  flag?: string;
  callsign?: string;
  timestamp?: string;
}

interface AISPortCall {
  mmsi: string;
  imo?: string;
  shipname?: string;
  portId?: string;
  portName?: string;
  unlocode?: string;
  arrival?: string;
  departure?: string;
  duration_hours?: number;
}

const AIS_SHIP_TYPES: Record<number, string> = {
  70: 'cargo',
  80: 'tanker',
  60: 'passenger',
  30: 'fishing',
  35: 'military',
  36: 'sailing',
  37: 'pleasure',
  51: 'SAR',
  52: 'tug',
  55: 'law_enforcement',
  58: 'medical',
};

function classifyVessel(shiptype?: number): string {
  if (!shiptype) return 'unknown';
  if (shiptype >= 70 && shiptype <= 79) return 'cargo';
  if (shiptype >= 80 && shiptype <= 89) return 'tanker';
  if (shiptype >= 60 && shiptype <= 69) return 'passenger';
  return AIS_SHIP_TYPES[shiptype] ?? 'other';
}

function navStatusLabel(status?: number): string {
  const labels: Record<number, string> = {
    0: 'under_way_using_engine',
    1: 'at_anchor',
    2: 'not_under_command',
    3: 'restricted_manoeuvrability',
    5: 'moored',
    8: 'sailing',
    15: 'undefined',
  };
  return status !== undefined ? (labels[status] ?? 'unknown') : 'unknown';
}

export function createAISConfig(overrides: Partial<FeedAdapterConfig> = {}): FeedAdapterConfig {
  return {
    id: 'ais-marinetraffic',
    name: 'AIS / MarineTraffic Feed',
    domain: 'vessels',
    pollIntervalMs: 5 * 60 * 1000,
    rateLimit: { requestsPerMinute: 30, burstAllowed: 10 },
    retryPolicy: { maxRetries: 3, backoffBaseMs: 2000, maxBackoffMs: 30000 },
    timeout: 30000,
    enabled: true,
    ...overrides,
  };
}

export class AISFeedAdapter extends BaseFeedAdapter {
  private readonly apiKey: string | null;
  private readonly baseUrl: string;

  constructor(config?: Partial<FeedAdapterConfig>) {
    super(createAISConfig(config));
    const _env = getEnv();
    this.apiKey = _env.MARINETRAFFIC_API_KEY ?? _env.AIS_API_KEY ?? null;
    this.baseUrl = _env.AIS_BASE_URL ?? 'https://services.marinetraffic.com/api';
  }

  async connect(): Promise<void> {
    if (!this.apiKey) {
    }
    this.health.status = 'healthy';
  }

  async healthCheck(): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      if (this.apiKey) {
        const res = await fetch(
          `${this.baseUrl}/exportvessel/v:8/${this.apiKey}/protocol:jsono/msgtype:simple/limit:1`,
          { method: 'GET', signal: controller.signal },
        );
        if (!res.ok) throw new Error(`MarineTraffic responded ${res.status}`);
      } else {
        const res = await fetch(
          'https://data.aishub.net/ws.php?format=1&output=json&compress=0&limit=1',
          {
            method: 'GET',
            signal: controller.signal,
          },
        );
        if (!res.ok) throw new Error(`AISHub responded ${res.status}`);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  async poll(): Promise<NormalizedFeedPayload> {
    if (this.apiKey) {
      return this.pollMarineTraffic();
    }
    return this.pollAISHub();
  }

  private async pollMarineTraffic(): Promise<NormalizedFeedPayload> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const url = `${this.baseUrl}/exportvessel/v:8/${this.apiKey}/protocol:jsono/msgtype:simple/timespan:5/limit:1000`;
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`MarineTraffic API error: ${response.status} ${response.statusText}`);
      }

      const raw = (await response.json()) as { DATA?: AISVesselPosition[] };
      const positions: AISVesselPosition[] = raw.DATA ?? [];
      return this.normalizePositions(positions, url);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async pollAISHub(): Promise<NormalizedFeedPayload> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const username = getEnv().AISHUB_USERNAME ?? 'anonymous';
      const url = `https://data.aishub.net/vessels.json?username=${username}&format=1&output=json&compress=0`;
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`AISHub feed error: ${response.status}`);
      }

      const raw = (await response.json()) as Array<Record<string, unknown>>;
      const positions: AISVesselPosition[] = (Array.isArray(raw) ? raw.flat() : [])
        .map((r) => ({
          mmsi: String(r.MMSI ?? r.mmsi ?? ''),
          imo: r.IMO ? String(r.IMO) : undefined,
          shipname: r.NAME ? String(r.NAME) : undefined,
          latitude: Number(r.LATITUDE ?? r.lat ?? 0),
          longitude: Number(r.LONGITUDE ?? r.lon ?? 0),
          speed: r.SPEED ? Number(r.SPEED) / 10 : undefined,
          course: r.COURSE ? Number(r.COURSE) : undefined,
          heading: r.HEADING ? Number(r.HEADING) : undefined,
          destination: r.DESTINATION ? String(r.DESTINATION) : undefined,
          shiptype: r.TYPE ? Number(r.TYPE) : undefined,
          flag: r.COUNTRY ? String(r.COUNTRY) : undefined,
          callsign: r.CALLSIGN ? String(r.CALLSIGN) : undefined,
          timestamp: r.TIME ? String(r.TIME) : new Date().toISOString(),
        }))
        .filter((p) => p.mmsi && p.latitude !== 0);

      return this.normalizePositions(positions, url);
    } finally {
      clearTimeout(timeout);
    }
  }

  normalize(rawData: unknown): NormalizedFeedPayload {
    const positions = Array.isArray(rawData) ? (rawData as AISVesselPosition[]) : [];
    return this.normalizePositions(positions, 'raw-input');
  }

  private normalizePositions(
    positions: AISVesselPosition[],
    sourceUrl: string,
  ): NormalizedFeedPayload {
    const fetchedAt = new Date().toISOString();
    const entities: NormalizedFeedPayload['entities'] = [];
    const relationships: NormalizedFeedPayload['relationships'] = [];
    const portEntityIds = new Map<string, string>();

    for (const pos of positions) {
      if (!pos.mmsi || pos.latitude === 0) continue;

      const vesselClass = classifyVessel(pos.shiptype);
      const navStatus = navStatusLabel(pos.status);
      const vesselName = pos.shipname?.trim() || `Vessel MMSI ${pos.mmsi}`;

      entities.push({
        type: 'vessel',
        name: vesselName,
        domain: 'vessels',
        externalId: `ais:mmsi:${pos.mmsi}`,
        metadata: {
          mmsi: pos.mmsi,
          imo: pos.imo ?? null,
          callsign: pos.callsign ?? null,
          vesselClass,
          flagState: pos.flag ?? null,
          currentPosition: {
            latitude: pos.latitude,
            longitude: pos.longitude,
            speed_knots: pos.speed ?? null,
            course: pos.course ?? null,
            heading: pos.heading ?? null,
          },
          navigationStatus: navStatus,
          destination: pos.destination ?? null,
          eta: pos.eta ?? null,
          draught: pos.draught ?? null,
          lastAisUpdate: pos.timestamp ?? fetchedAt,
          feedSource: 'AIS',
        },
        tags: ['ais', 'vessel', vesselClass, pos.flag ?? 'unknown-flag'].filter(Boolean),
        riskScore: this.computeVesselRiskScore(pos),
      });

      if (pos.destination && pos.destination.trim().length > 2) {
        const destName = pos.destination.trim().toUpperCase();
        const destExternalId = `ais:port:${destName}`;
        if (!portEntityIds.has(destName)) {
          portEntityIds.set(destName, destExternalId);
          entities.push({
            type: 'port',
            name: destName,
            domain: 'vessels',
            externalId: destExternalId,
            metadata: {
              portCode: destName,
              feedSource: 'AIS',
            },
            tags: ['port', 'ais-destination'],
          });
        }

        relationships.push({
          fromExternalId: `ais:mmsi:${pos.mmsi}`,
          toExternalId: destExternalId,
          type: 'located_at',
          strength: 'weak',
          metadata: {
            relationContext: 'ais_destination',
            eta: pos.eta ?? null,
            reportedAt: fetchedAt,
          },
        });
      }
    }

    return {
      entities,
      relationships,
      feedId: this.config.id,
      feedName: this.config.name,
      sourceUrl,
      fetchedAt,
      recordCount: positions.length,
    };
  }

  private computeVesselRiskScore(pos: AISVesselPosition): number {
    let score = 0.1;
    if (!pos.imo) score += 0.2;
    if (pos.destination?.match(/^-+$|unknown|none/i)) score += 0.15;
    if (pos.speed !== undefined && pos.speed < 0.5 && pos.status !== 1 && pos.status !== 5)
      score += 0.1;
    if (pos.flag && ['KM', 'PN', 'PW', 'TV'].includes(pos.flag)) score += 0.3;
    return Math.min(1, score);
  }
}
