import { createHash } from 'node:crypto';
import { computeEmissions, ciiRating, deriveAisTrack, type TrackSource } from './vessels-carbon';

export const EU_ETS_PRICE_EUR = 65;
export const CARBON_PRICE_USD = 72;

export interface VoyageEmissionRecord {
  id: string;
  vesselName: string;
  imo: string;
  grossTonnage: number;
  voyageId: string;
  origin: string;
  destination: string;
  distanceNm: number;
  fuelType: string;
  fuelConsumedMt: number;
  co2EmissionsMt: number;
  co2PerNm: number;
  fleetAvgCo2PerNm: number;
  aer: number;
  ciiRating: 'A' | 'B' | 'C' | 'D' | 'E';
  efficiencyScore: number;
  weatherAdjustedScore: number;
  portCongestionWasteHours: number;
  carbonCostUsd: number;
  euEtsLiability: number;
  status: 'in-progress' | 'completed';
  departedAt: string;
  arrivedAt: string | null;
  passportHash: string;
  dataSource: 'ais-live' | 'ais-cached';
  trackSource?: TrackSource;
  trackSampledPoints?: number;
  mmsi?: string;
}

export function makePassportHash(voyageId: string, co2: number, fuelType = 'HFO'): string {
  return createHash('sha256')
    .update(`${voyageId}:${co2.toFixed(1)}:${fuelType}`)
    .digest('hex')
    .slice(0, 32);
}

export const VOYAGE_EMISSIONS: VoyageEmissionRecord[] = [
  {
    id: 've-001',
    vesselName: 'Pacific Navigator',
    imo: '9234891',
    grossTonnage: 82000,
    mmsi: '273456780',
    voyageId: 'VOY-2026-018',
    origin: 'Primorsk, Russia',
    destination: 'Rotterdam, Netherlands',
    distanceNm: 3840,
    fuelType: 'VLSFO',
    fuelConsumedMt: 1180,
    co2EmissionsMt: computeEmissions(1180, 'VLSFO'),
    co2PerNm: +(computeEmissions(1180, 'VLSFO') / 3840).toFixed(4),
    fleetAvgCo2PerNm: 0.981,
    aer: +(computeEmissions(1180, 'VLSFO') / (82000 * 3840)).toFixed(6),
    ciiRating: 'B',
    efficiencyScore: 87,
    weatherAdjustedScore: 89,
    portCongestionWasteHours: 11,
    status: 'in-progress',
    carbonCostUsd: Math.round(computeEmissions(1180, 'VLSFO') * CARBON_PRICE_USD),
    euEtsLiability: Math.round(computeEmissions(1180, 'VLSFO') * EU_ETS_PRICE_EUR),
    departedAt: '2026-04-10T06:00:00Z',
    arrivedAt: null,
    passportHash: makePassportHash('VOY-2026-018', computeEmissions(1180, 'VLSFO'), 'VLSFO'),
    dataSource: 'ais-live',
  },
  {
    id: 've-002',
    vesselName: 'Arctic Breeze',
    imo: '9156234',
    grossTonnage: 96500,
    voyageId: 'VOY-2026-015',
    origin: 'Ras Laffan, Qatar',
    destination: 'Sodegaura, Japan',
    distanceNm: 6200,
    fuelType: 'LNG',
    fuelConsumedMt: 920,
    co2EmissionsMt: computeEmissions(920, 'LNG'),
    co2PerNm: +(computeEmissions(920, 'LNG') / 6200).toFixed(4),
    fleetAvgCo2PerNm: 0.981,
    aer: +(computeEmissions(920, 'LNG') / (96500 * 6200)).toFixed(6),
    ciiRating: 'A',
    efficiencyScore: 94,
    weatherAdjustedScore: 91,
    portCongestionWasteHours: 4,
    status: 'in-progress',
    carbonCostUsd: Math.round(computeEmissions(920, 'LNG') * CARBON_PRICE_USD),
    euEtsLiability: 0,
    departedAt: '2026-04-12T09:30:00Z',
    arrivedAt: null,
    passportHash: makePassportHash('VOY-2026-015', computeEmissions(920, 'LNG'), 'LNG'),
    dataSource: 'ais-live',
    mmsi: '538090123',
  },
  {
    id: 've-003',
    vesselName: 'Meridian Bulk',
    imo: '9312004',
    grossTonnage: 68000,
    voyageId: 'VOY-2026-012',
    origin: 'Port Hedland, Australia',
    destination: 'Shanghai, China',
    distanceNm: 3750,
    fuelType: 'VLSFO',
    fuelConsumedMt: 890,
    co2EmissionsMt: computeEmissions(890, 'VLSFO'),
    co2PerNm: +(computeEmissions(890, 'VLSFO') / 3750).toFixed(4),
    fleetAvgCo2PerNm: 0.981,
    aer: +(computeEmissions(890, 'VLSFO') / (68000 * 3750)).toFixed(6),
    ciiRating: 'B',
    efficiencyScore: 82,
    weatherAdjustedScore: 85,
    portCongestionWasteHours: 28,
    status: 'completed',
    carbonCostUsd: Math.round(computeEmissions(890, 'VLSFO') * CARBON_PRICE_USD),
    euEtsLiability: 0,
    departedAt: '2026-03-28T14:00:00Z',
    arrivedAt: '2026-04-09T07:20:00Z',
    passportHash: makePassportHash('VOY-2026-012', computeEmissions(890, 'VLSFO'), 'VLSFO'),
    dataSource: 'ais-cached',
  },
  {
    id: 've-004',
    vesselName: 'Cape Resolute',
    imo: '9445120',
    grossTonnage: 58000,
    voyageId: 'VOY-2026-022',
    origin: 'Houston, USA',
    destination: 'Rotterdam, Netherlands',
    distanceNm: 5120,
    fuelType: 'HFO',
    fuelConsumedMt: 1340,
    co2EmissionsMt: computeEmissions(1340, 'HFO'),
    co2PerNm: +(computeEmissions(1340, 'HFO') / 5120).toFixed(4),
    fleetAvgCo2PerNm: 0.981,
    aer: +(computeEmissions(1340, 'HFO') / (58000 * 5120)).toFixed(6),
    ciiRating: 'D',
    efficiencyScore: 61,
    weatherAdjustedScore: 58,
    portCongestionWasteHours: 3,
    status: 'in-progress',
    carbonCostUsd: Math.round(computeEmissions(1340, 'HFO') * CARBON_PRICE_USD),
    euEtsLiability: Math.round(computeEmissions(1340, 'HFO') * EU_ETS_PRICE_EUR),
    departedAt: '2026-04-14T11:00:00Z',
    arrivedAt: null,
    passportHash: makePassportHash('VOY-2026-022', computeEmissions(1340, 'HFO'), 'HFO'),
    dataSource: 'ais-cached',
    mmsi: '367123450',
  },
  {
    id: 've-005',
    vesselName: 'Coral Endeavour',
    imo: '9501667',
    grossTonnage: 44000,
    voyageId: 'VOY-2026-029',
    origin: 'Jebel Ali, UAE',
    destination: 'Mumbai, India',
    distanceNm: 1240,
    fuelType: 'MGO',
    fuelConsumedMt: 145,
    co2EmissionsMt: computeEmissions(145, 'MGO'),
    co2PerNm: +(computeEmissions(145, 'MGO') / 1240).toFixed(4),
    fleetAvgCo2PerNm: 0.981,
    aer: +(computeEmissions(145, 'MGO') / (44000 * 1240)).toFixed(6),
    ciiRating: 'A',
    efficiencyScore: 96,
    weatherAdjustedScore: 97,
    portCongestionWasteHours: 1,
    status: 'completed',
    carbonCostUsd: Math.round(computeEmissions(145, 'MGO') * CARBON_PRICE_USD),
    euEtsLiability: 0,
    departedAt: '2026-04-01T08:00:00Z',
    arrivedAt: '2026-04-03T16:30:00Z',
    passportHash: makePassportHash('VOY-2026-029', computeEmissions(145, 'MGO'), 'MGO'),
    dataSource: 'ais-live',
  },
];

interface RefreshCacheEntry {
  record: VoyageEmissionRecord;
  expiry: number;
}
const refreshCache = new Map<string, RefreshCacheEntry>();
const REFRESH_TTL_MS = 90_000;

export async function refreshInProgressFromAis(
  v: VoyageEmissionRecord,
): Promise<VoyageEmissionRecord> {
  if (v.status !== 'in-progress' || !v.mmsi) return v;

  const cached = refreshCache.get(v.id);
  const now = Date.now();
  if (cached && cached.expiry > now) return cached.record;

  const depMs = new Date(v.departedAt).getTime();
  if (Number.isNaN(depMs) || depMs >= now) {
    refreshCache.set(v.id, { record: v, expiry: now + REFRESH_TTL_MS });
    return v;
  }

  const track = await deriveAisTrack(v.mmsi, depMs, now);
  if (track.distanceNm <= 0) {
    refreshCache.set(v.id, { record: v, expiry: now + REFRESH_TTL_MS });
    return v;
  }

  const originalSpecificFuel = v.fuelConsumedMt / v.distanceNm;
  const newDistanceNm = +track.distanceNm.toFixed(1);
  const newFuelMt = +(originalSpecificFuel * newDistanceNm).toFixed(1);
  const newCo2 = computeEmissions(newFuelMt, v.fuelType);
  const newCo2PerNm = +(newCo2 / newDistanceNm).toFixed(4);
  const newAer = +(newCo2 / (v.grossTonnage * newDistanceNm)).toFixed(6);

  const refreshed: VoyageEmissionRecord = {
    ...v,
    distanceNm: newDistanceNm,
    fuelConsumedMt: newFuelMt,
    co2EmissionsMt: newCo2,
    co2PerNm: newCo2PerNm,
    aer: newAer,
    ciiRating: ciiRating(newAer),
    carbonCostUsd: Math.round(newCo2 * CARBON_PRICE_USD),
    euEtsLiability: v.euEtsLiability > 0 ? Math.round(newCo2 * EU_ETS_PRICE_EUR) : 0,
    trackSource: track.source,
    trackSampledPoints: track.sampledPoints,
    dataSource: 'ais-live',
  };

  refreshCache.set(v.id, { record: refreshed, expiry: now + REFRESH_TTL_MS });
  return refreshed;
}
