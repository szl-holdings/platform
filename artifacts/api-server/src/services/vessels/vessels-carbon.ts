
export interface AisTrackPoint {
  lat: number;
  lon: number;
  ts: number;
  speed: number;
  course: number;
}

export type TrackSource = 'ais-live-track' | 'ais-speed-estimate' | 'user-provided';

export interface AisTrackResult {
  points: AisTrackPoint[];
  distanceNm: number;
  source: TrackSource;
  sampledPoints: number;
}

export function haversineNm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const φ1 = toRad(lat1),
    φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1),
    Δλ = toRad(lon2 - lon1);
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function safeJson(url: string, timeoutMs = 8000): Promise<unknown> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'SZL-Vessels/1.0', Accept: 'application/json' },
    });
    clearTimeout(t);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  } finally {
    clearTimeout(t);
  }
}

export async function deriveAisTrack(
  mmsi: string,
  departedAtMs: number,
  arrivedAtMs: number,
): Promise<AisTrackResult> {
  try {
    const raw = (await safeJson(
      `https://meri.digitraffic.fi/api/ais/v1/locations?mmsi=${mmsi}&from=${departedAtMs}&to=${arrivedAtMs}`,
      10000,
    )) as {
      features?: Array<{
        geometry?: { coordinates?: number[] };
        properties?: Record<string, number>;
      }>;
    };

    if (Array.isArray(raw?.features) && raw.features.length >= 2) {
      const pts: AisTrackPoint[] = raw.features
        .map((f) => ({
          lat: f.geometry?.coordinates?.[1] ?? 0,
          lon: f.geometry?.coordinates?.[0] ?? 0,
          ts: f.properties?.timestampExternal ?? f.properties?.timestamp ?? 0,
          speed: f.properties?.sog ?? 0,
          course: f.properties?.cog ?? 0,
        }))
        .filter((p) => p.lat !== 0 || p.lon !== 0)
        .sort((a, b) => a.ts - b.ts);

      if (pts.length >= 2) {
        let distNm = 0;
        for (let i = 1; i < pts.length; i++) {
          distNm += haversineNm(pts[i - 1].lat, pts[i - 1].lon, pts[i].lat, pts[i].lon);
        }
        return {
          points: pts,
          distanceNm: +distNm.toFixed(1),
          source: 'ais-live-track',
          sampledPoints: pts.length,
        };
      }
    }
  } catch {
    /* fall through */
  }

  try {
    const latest = (await safeJson(
      `https://meri.digitraffic.fi/api/ais/v1/locations/${mmsi}/latest`,
      6000,
    )) as {
      geometry?: { coordinates?: number[] };
      properties?: Record<string, number>;
    };

    const speed = latest?.properties?.sog ?? 10;
    const course = latest?.properties?.cog ?? 0;
    const lat = latest?.geometry?.coordinates?.[1] ?? 0;
    const lon = latest?.geometry?.coordinates?.[0] ?? 0;
    const voyageHours = (arrivedAtMs - departedAtMs) / 3_600_000;
    const distNm = +(speed * voyageHours).toFixed(1);

    const nPts = Math.max(2, Math.min(24, Math.round(voyageHours / 2)));
    const courseRad = (course * Math.PI) / 180;
    const pts: AisTrackPoint[] = Array.from({ length: nPts }, (_, i) => {
      const frac = i / (nPts - 1);
      const progNm = frac * distNm;
      return {
        lat: +(lat + (progNm * Math.cos(courseRad)) / 60).toFixed(4),
        lon: +(
          lon +
          (progNm * Math.sin(courseRad)) / (60 * Math.cos((lat * Math.PI) / 180))
        ).toFixed(4),
        ts: Math.round(departedAtMs + frac * (arrivedAtMs - departedAtMs)),
        speed,
        course,
      };
    });

    return { points: pts, distanceNm: distNm, source: 'ais-speed-estimate', sampledPoints: nPts };
  } catch {
    /* fall through */
  }

  return { points: [], distanceNm: 0, source: 'ais-speed-estimate', sampledPoints: 0 };
}

export async function fetchAisVesselMeta(
  mmsi: string,
): Promise<{ name: string | null; imo: string | null; dataSource: 'ais-live' | 'ais-cached' }> {
  try {
    const data = (await safeJson(
      `https://meri.digitraffic.fi/api/ais/v1/vessels/${mmsi}`,
      6000,
    )) as { name?: string; imo?: number };
    return {
      name: typeof data.name === 'string' && data.name.trim() ? data.name.trim() : null,
      imo: data.imo ? String(data.imo) : null,
      dataSource: 'ais-live',
    };
  } catch {
    return { name: null, imo: null, dataSource: 'ais-cached' };
  }
}

export const FUEL_FACTORS: Record<string, number> = {
  HFO: 3.114,
  VLSFO: 3.151,
  MGO: 3.206,
  LNG: 2.75,
  METHANOL: 1.375,
};

export function computeEmissions(fuelMt: number, fuelType: string): number {
  return +(fuelMt * (FUEL_FACTORS[fuelType] ?? 3.114)).toFixed(1);
}

export function ciiRating(aer: number): 'A' | 'B' | 'C' | 'D' | 'E' {
  if (aer < 0.0028) return 'A';
  if (aer < 0.0034) return 'B';
  if (aer < 0.0042) return 'C';
  if (aer < 0.0055) return 'D';
  return 'E';
}
