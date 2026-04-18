import { Router, type IRouter, type Request } from "express";
import { createHash, createHmac } from "crypto";
import { authMiddleware } from "../middlewares/auth";
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest, handleRouteError } from "../lib/api-response";

import { anyQuerySchema, jsonObjectBodySchema, validateBody, validateQuery } from "../lib/validation";
const router: IRouter = Router();

// ─── AIS Track Engine ─────────────────────────────────────────────────────────

interface AisTrackPoint { lat: number; lon: number; ts: number; speed: number; course: number; }

type TrackSource = "ais-live-track" | "ais-speed-estimate" | "user-provided";

interface AisTrackResult {
  points: AisTrackPoint[];
  distanceNm: number;
  source: TrackSource;
  sampledPoints: number;
}

/** Haversine great-circle distance in nautical miles */
function haversineNm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065;
  const toRad = (d: number) => d * Math.PI / 180;
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1), Δλ = toRad(lon2 - lon1);
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function safeJson(url: string, timeoutMs = 8000): Promise<unknown> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "SZL-Vessels/1.0", Accept: "application/json" } });
    clearTimeout(t);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  } finally { clearTimeout(t); }
}

/**
 * Derives sailed distance for a voyage from AIS data:
 * 1. Tries Digitraffic /locations endpoint with MMSI + time window for real track points
 * 2. Falls back to latest AIS position/speed × voyage duration when historical data is absent
 */
async function deriveAisTrack(mmsi: string, departedAtMs: number, arrivedAtMs: number): Promise<AisTrackResult> {
  // ── Attempt 1: Digitraffic historical locations for the time window ──
  try {
    const raw = await safeJson(
      `https://meri.digitraffic.fi/api/ais/v1/locations?mmsi=${mmsi}&from=${departedAtMs}&to=${arrivedAtMs}`,
      10000,
    ) as { features?: Array<{ geometry?: { coordinates?: number[] }; properties?: Record<string, number> }> };

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
        return { points: pts, distanceNm: +distNm.toFixed(1), source: "ais-live-track", sampledPoints: pts.length };
      }
    }
  } catch { /* fall through */ }

  // ── Attempt 2: latest AIS position → speed-based estimate ──
  try {
    const latest = await safeJson(`https://meri.digitraffic.fi/api/ais/v1/locations/${mmsi}/latest`, 6000) as {
      geometry?: { coordinates?: number[] };
      properties?: Record<string, number>;
    };

    const speed = latest?.properties?.sog ?? 10; // knots; 10 kn if unknown
    const course = latest?.properties?.cog ?? 0;
    const lat = latest?.geometry?.coordinates?.[1] ?? 0;
    const lon = latest?.geometry?.coordinates?.[0] ?? 0;
    const voyageHours = (arrivedAtMs - departedAtMs) / 3_600_000;
    const distNm = +(speed * voyageHours).toFixed(1);

    // Synthetic track — dead-reckoned positions (illustrative, not geo-precise)
    const nPts = Math.max(2, Math.min(24, Math.round(voyageHours / 2)));
    const courseRad = course * Math.PI / 180;
    const pts: AisTrackPoint[] = Array.from({ length: nPts }, (_, i) => {
      const frac = i / (nPts - 1);
      const progNm = frac * distNm;
      return {
        lat: +(lat + progNm * Math.cos(courseRad) / 60).toFixed(4),
        lon: +(lon + progNm * Math.sin(courseRad) / (60 * Math.cos(lat * Math.PI / 180))).toFixed(4),
        ts: Math.round(departedAtMs + frac * (arrivedAtMs - departedAtMs)),
        speed,
        course,
      };
    });

    return { points: pts, distanceNm: distNm, source: "ais-speed-estimate", sampledPoints: nPts };
  } catch { /* fall through */ }

  return { points: [], distanceNm: 0, source: "ais-speed-estimate", sampledPoints: 0 };
}

// ─── Carbon / Emissions helpers ──────────────────────────────────────────────

// Fuel type → CO2 emission factor (MT CO2 per MT fuel, IMO 2023)
const FUEL_FACTORS: Record<string, number> = {
  HFO: 3.114,
  VLSFO: 3.151,
  MGO: 3.206,
  LNG: 2.75,
  METHANOL: 1.375,
};

function computeEmissions(fuelMt: number, fuelType: string): number {
  return +(fuelMt * (FUEL_FACTORS[fuelType] ?? 3.114)).toFixed(1);
}

function ciiRating(aer: number): "A" | "B" | "C" | "D" | "E" {
  // Simplified AER threshold for 2026 (MT CO2 / GT·nm)
  if (aer < 0.0028) return "A";
  if (aer < 0.0034) return "B";
  if (aer < 0.0042) return "C";
  if (aer < 0.0055) return "D";
  return "E";
}

// ─── Seeded voyage emissions data ────────────────────────────────────────────

interface VoyageEmissionRecord {
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
  ciiRating: "A" | "B" | "C" | "D" | "E";
  efficiencyScore: number;
  weatherAdjustedScore: number;
  portCongestionWasteHours: number;
  carbonCostUsd: number;
  euEtsLiability: number;
  status: "in-progress" | "completed";
  departedAt: string;
  arrivedAt: string | null;
  passportHash: string;
  dataSource: "ais-live" | "ais-cached";
  // AIS track provenance (added for computed records)
  trackSource?: TrackSource;
  trackSampledPoints?: number;
  mmsi?: string;
}

function makePassportHash(voyageId: string, co2: number, fuelType = "HFO"): string {
  // Deterministic — same voyage + fuel data always produces the same hash
  return createHash("sha256")
    .update(`${voyageId}:${co2.toFixed(1)}:${fuelType}`)
    .digest("hex")
    .slice(0, 32);
}

const EU_ETS_PRICE_EUR = 65; // approx €65/MT CO2 in 2026
const CARBON_PRICE_USD = 72; // USD/MT CO2

const VOYAGE_EMISSIONS: VoyageEmissionRecord[] = [
  {
    id: "ve-001", vesselName: "Pacific Navigator", imo: "9234891", grossTonnage: 82000,
    voyageId: "VOY-2026-018", origin: "Primorsk, Russia", destination: "Rotterdam, Netherlands",
    distanceNm: 3840, fuelType: "VLSFO", fuelConsumedMt: 1180,
    co2EmissionsMt: computeEmissions(1180, "VLSFO"),
    co2PerNm: +(computeEmissions(1180, "VLSFO") / 3840).toFixed(4),
    fleetAvgCo2PerNm: 0.981,
    aer: +(computeEmissions(1180, "VLSFO") / (82000 * 3840)).toFixed(6),
    ciiRating: "B", efficiencyScore: 87, weatherAdjustedScore: 89,
    portCongestionWasteHours: 11, status: "in-progress",
    carbonCostUsd: Math.round(computeEmissions(1180, "VLSFO") * CARBON_PRICE_USD),
    euEtsLiability: Math.round(computeEmissions(1180, "VLSFO") * EU_ETS_PRICE_EUR),
    departedAt: "2026-04-10T06:00:00Z", arrivedAt: null,
    passportHash: makePassportHash("VOY-2026-018", computeEmissions(1180, "VLSFO"), "VLSFO"),
    dataSource: "ais-live",
  },
  {
    id: "ve-002", vesselName: "Arctic Breeze", imo: "9156234", grossTonnage: 96500,
    voyageId: "VOY-2026-015", origin: "Ras Laffan, Qatar", destination: "Sodegaura, Japan",
    distanceNm: 6200, fuelType: "LNG", fuelConsumedMt: 920,
    co2EmissionsMt: computeEmissions(920, "LNG"),
    co2PerNm: +(computeEmissions(920, "LNG") / 6200).toFixed(4),
    fleetAvgCo2PerNm: 0.981,
    aer: +(computeEmissions(920, "LNG") / (96500 * 6200)).toFixed(6),
    ciiRating: "A", efficiencyScore: 94, weatherAdjustedScore: 91,
    portCongestionWasteHours: 4, status: "in-progress",
    carbonCostUsd: Math.round(computeEmissions(920, "LNG") * CARBON_PRICE_USD),
    euEtsLiability: 0,
    departedAt: "2026-04-12T09:30:00Z", arrivedAt: null,
    passportHash: makePassportHash("VOY-2026-015", computeEmissions(920, "LNG"), "LNG"),
    dataSource: "ais-live",
  },
  {
    id: "ve-003", vesselName: "Meridian Bulk", imo: "9312004", grossTonnage: 68000,
    voyageId: "VOY-2026-012", origin: "Port Hedland, Australia", destination: "Shanghai, China",
    distanceNm: 3750, fuelType: "VLSFO", fuelConsumedMt: 890,
    co2EmissionsMt: computeEmissions(890, "VLSFO"),
    co2PerNm: +(computeEmissions(890, "VLSFO") / 3750).toFixed(4),
    fleetAvgCo2PerNm: 0.981,
    aer: +(computeEmissions(890, "VLSFO") / (68000 * 3750)).toFixed(6),
    ciiRating: "B", efficiencyScore: 82, weatherAdjustedScore: 85,
    portCongestionWasteHours: 28, status: "completed",
    carbonCostUsd: Math.round(computeEmissions(890, "VLSFO") * CARBON_PRICE_USD),
    euEtsLiability: 0,
    departedAt: "2026-03-28T14:00:00Z", arrivedAt: "2026-04-09T07:20:00Z",
    passportHash: makePassportHash("VOY-2026-012", computeEmissions(890, "VLSFO"), "VLSFO"),
    dataSource: "ais-cached",
  },
  {
    id: "ve-004", vesselName: "Cape Resolute", imo: "9445120", grossTonnage: 58000,
    voyageId: "VOY-2026-022", origin: "Houston, USA", destination: "Rotterdam, Netherlands",
    distanceNm: 5120, fuelType: "HFO", fuelConsumedMt: 1340,
    co2EmissionsMt: computeEmissions(1340, "HFO"),
    co2PerNm: +(computeEmissions(1340, "HFO") / 5120).toFixed(4),
    fleetAvgCo2PerNm: 0.981,
    aer: +(computeEmissions(1340, "HFO") / (58000 * 5120)).toFixed(6),
    ciiRating: "D", efficiencyScore: 61, weatherAdjustedScore: 58,
    portCongestionWasteHours: 3, status: "in-progress",
    carbonCostUsd: Math.round(computeEmissions(1340, "HFO") * CARBON_PRICE_USD),
    euEtsLiability: Math.round(computeEmissions(1340, "HFO") * EU_ETS_PRICE_EUR),
    departedAt: "2026-04-14T11:00:00Z", arrivedAt: null,
    passportHash: makePassportHash("VOY-2026-022", computeEmissions(1340, "HFO"), "HFO"),
    dataSource: "ais-cached",
  },
  {
    id: "ve-005", vesselName: "Coral Endeavour", imo: "9501667", grossTonnage: 44000,
    voyageId: "VOY-2026-029", origin: "Jebel Ali, UAE", destination: "Mumbai, India",
    distanceNm: 1240, fuelType: "MGO", fuelConsumedMt: 145,
    co2EmissionsMt: computeEmissions(145, "MGO"),
    co2PerNm: +(computeEmissions(145, "MGO") / 1240).toFixed(4),
    fleetAvgCo2PerNm: 0.981,
    aer: +(computeEmissions(145, "MGO") / (44000 * 1240)).toFixed(6),
    ciiRating: "A", efficiencyScore: 96, weatherAdjustedScore: 97,
    portCongestionWasteHours: 1, status: "completed",
    carbonCostUsd: Math.round(computeEmissions(145, "MGO") * CARBON_PRICE_USD),
    euEtsLiability: 0,
    departedAt: "2026-04-01T08:00:00Z", arrivedAt: "2026-04-03T16:30:00Z",
    passportHash: makePassportHash("VOY-2026-029", computeEmissions(145, "MGO"), "MGO"),
    dataSource: "ais-live",
  },
];

router.get("/vessels/modules/voyages-emissions", authMiddleware(), (_req, res) => {
  try {
    const fleetAvgCo2PerNm = +(
      VOYAGE_EMISSIONS.reduce((s, v) => s + v.co2PerNm, 0) / VOYAGE_EMISSIONS.length
    ).toFixed(4);
    const totals = {
      totalCo2Mt: +VOYAGE_EMISSIONS.reduce((s, v) => s + v.co2EmissionsMt, 0).toFixed(1),
      totalCarbonCostUsd: VOYAGE_EMISSIONS.reduce((s, v) => s + v.carbonCostUsd, 0),
      totalEuEtsUsd: VOYAGE_EMISSIONS.reduce((s, v) => s + v.euEtsLiability, 0),
      avgEfficiencyScore: Math.round(VOYAGE_EMISSIONS.reduce((s, v) => s + v.efficiencyScore, 0) / VOYAGE_EMISSIONS.length),
      fleetAvgCo2PerNm,
    };
    sendSuccess(res, { voyages: VOYAGE_EMISSIONS, totals });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch voyage emissions");
  }
});

router.get("/vessels/modules/voyages-emissions/:id", authMiddleware(), (req: Request, res) => {
  try {
    const v = VOYAGE_EMISSIONS.find(v => v.id === req.params.id);
    if (!v) { sendNotFound(res, "VoyageEmission"); return; }
    sendSuccess(res, v);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch voyage emission");
  }
});

// Helper: resolve vessel name/IMO from Digitraffic AIS by MMSI
async function fetchAisVesselMeta(mmsi: string): Promise<{ name: string | null; imo: string | null; dataSource: "ais-live" | "ais-cached" }> {
  try {
    const data = await safeJson(`https://meri.digitraffic.fi/api/ais/v1/vessels/${mmsi}`, 6000) as { name?: string; imo?: number };
    return {
      name: (typeof data.name === "string" && data.name.trim()) ? data.name.trim() : null,
      imo: data.imo ? String(data.imo) : null,
      dataSource: "ais-live",
    };
  } catch {
    return { name: null, imo: null, dataSource: "ais-cached" };
  }
}

// GET — derive AIS track for a vessel + time window (standalone query endpoint)
router.get("/vessels/modules/ais-track", validateQuery(anyQuerySchema), authMiddleware(), async (req: Request, res) => {
  try {
    const { mmsi, departedAt, arrivedAt } = req.query as { mmsi?: string; departedAt?: string; arrivedAt?: string };
    if (!mmsi || !departedAt) { sendBadRequest(res, "mmsi and departedAt are required"); return; }
    const depMs = new Date(departedAt).getTime();
    const arrMs = arrivedAt ? new Date(arrivedAt).getTime() : Date.now();
    if (isNaN(depMs)) { sendBadRequest(res, "Invalid departedAt"); return; }
    const track = await deriveAisTrack(mmsi, depMs, arrMs);
    sendSuccess(res, { mmsi, departedAt, arrivedAt: arrivedAt ?? new Date(arrMs).toISOString(), ...track });
  } catch (err) { handleRouteError(res, err, "Failed to derive AIS track"); }
});

// POST — compute a new Carbon Passport backed by AIS track derivation + vessel specs.
//
// When `mmsi` is given:
//   - Fetches vessel name/IMO from Digitraffic AIS
//   - Derives sailed distance from AIS track points for the voyage window
//     (real Digitraffic track history → Haversine sum; fallback: AIS speed × time)
//   - Overrides user-supplied `distanceNm` with AIS-derived value
//
// When only user-supplied `distanceNm` is given (no mmsi), `trackSource` = "user-provided".
//
// The computed record with deterministic passportHash is persisted in the session store.
router.post("/vessels/modules/voyages-emissions", validateBody(jsonObjectBodySchema), authMiddleware(), async (req: Request, res) => {
  try {
    const body = req.body as {
      mmsi?: string;          // Triggers AIS track derivation + vessel metadata lookup
      voyageId: string;
      vesselName?: string;    // Required when mmsi absent
      imo?: string;
      grossTonnage: number;
      origin: string;
      destination: string;
      distanceNm?: number;    // Used only when mmsi absent; overridden by AIS track
      fuelType?: string;
      fuelConsumedMt: number;
      departedAt: string;
      arrivedAt?: string | null;
    };

    const { mmsi, voyageId, grossTonnage, origin, destination,
            fuelType = "VLSFO", fuelConsumedMt, departedAt, arrivedAt = null } = body;

    if (!voyageId || !grossTonnage || !origin || !destination || !fuelConsumedMt || !departedAt) {
      sendBadRequest(res, "Missing required fields: voyageId, grossTonnage, origin, destination, fuelConsumedMt, departedAt");
      return;
    }
    if (!mmsi && !body.distanceNm) {
      sendBadRequest(res, "Either mmsi (for AIS track derivation) or distanceNm must be provided");
      return;
    }

    if (VOYAGE_EMISSIONS.some(v => v.voyageId === voyageId)) {
      sendBadRequest(res, `Voyage ${voyageId} already has a Carbon Passport`);
      return;
    }

    // Resolve vessel metadata + sailed distance
    let vesselName = body.vesselName ?? "";
    let imo = body.imo ?? "";
    let dataSource: "ais-live" | "ais-cached" = "ais-cached";
    let resolvedDistanceNm = body.distanceNm ?? 0;
    let trackSource: TrackSource = "user-provided";
    let trackSampledPoints = 0;

    if (mmsi) {
      // Parallel: vessel meta + AIS track derivation
      const depMs = new Date(departedAt).getTime();
      const arrMs = arrivedAt ? new Date(arrivedAt).getTime() : Date.now();

      const [meta, track] = await Promise.all([
        fetchAisVesselMeta(mmsi),
        deriveAisTrack(mmsi, depMs, arrMs),
      ]);

      if (meta.name) vesselName = meta.name;
      if (meta.imo) imo = meta.imo;
      dataSource = meta.dataSource;

      // Use AIS-derived distance; fall back to user-supplied only if AIS fails
      if (track.distanceNm > 0) {
        resolvedDistanceNm = track.distanceNm;
        trackSource = track.source;
        trackSampledPoints = track.sampledPoints;
      } else if (body.distanceNm) {
        resolvedDistanceNm = body.distanceNm;
        trackSource = "user-provided";
      } else {
        sendBadRequest(res, "AIS track derivation returned no distance; please supply distanceNm as fallback");
        return;
      }
    }

    if (!vesselName) {
      sendBadRequest(res, "vesselName is required when mmsi is not provided");
      return;
    }
    if (resolvedDistanceNm <= 0) {
      sendBadRequest(res, "distanceNm must be positive");
      return;
    }

    const validFuelTypes = Object.keys(FUEL_FACTORS);
    const fuel = validFuelTypes.includes(fuelType) ? fuelType : "VLSFO";
    const co2 = computeEmissions(fuelConsumedMt, fuel);
    const co2PerNm = +(co2 / resolvedDistanceNm).toFixed(4);
    const aer = +(co2 / (grossTonnage * resolvedDistanceNm)).toFixed(6);
    const fleetAvgCo2PerNm = +(
      VOYAGE_EMISSIONS.reduce((s, v) => s + v.co2PerNm, 0) / VOYAGE_EMISSIONS.length
    ).toFixed(4);

    const record: VoyageEmissionRecord = {
      id: `ve-${Date.now()}`,
      vesselName, imo, grossTonnage, voyageId, origin, destination,
      distanceNm: resolvedDistanceNm, fuelType: fuel, fuelConsumedMt,
      co2EmissionsMt: co2, co2PerNm, fleetAvgCo2PerNm,
      aer, ciiRating: ciiRating(aer),
      efficiencyScore: Math.max(40, Math.round(100 - aer / 0.0001)),
      weatherAdjustedScore: Math.max(40, Math.round(100 - aer / 0.00012)),
      portCongestionWasteHours: 0,
      carbonCostUsd: Math.round(co2 * CARBON_PRICE_USD),
      euEtsLiability: Math.round(co2 * EU_ETS_PRICE_EUR),
      status: arrivedAt ? "completed" : "in-progress",
      departedAt, arrivedAt: arrivedAt ?? null,
      passportHash: makePassportHash(voyageId, co2, fuel),
      dataSource, trackSource, trackSampledPoints, mmsi,
    };

    VOYAGE_EMISSIONS.push(record);
    sendCreated(res, record);
  } catch (err) {
    handleRouteError(res, err, "Failed to compute voyage emissions");
  }
});

// ─── Blockchain Bill of Lading ────────────────────────────────────────────────

interface BolChainEvent {
  sequence: number;
  eventType: string;
  actor: string;
  timestamp: string;
  hash: string;
  prevHash: string;
  signature: string;
  confirmed: boolean;
}

interface BolDocument {
  id: string;
  vesselName: string;
  imo: string;
  voyageId: string;
  shipper: string;
  consignee: string;
  notifyParty: string;
  cargo: string;
  quantity: string;
  quantityMt: number;
  unit: string;
  originPort: string;
  destinationPort: string;
  status: "draft" | "issued" | "in_transit" | "transferred" | "delivered" | "settled";
  lcRef: string;
  lcIssuer: string;
  lcAmount: number;
  lcStatus: "pending" | "active" | "amended" | "settled";
  autoLcRelease: boolean;
  transferCount: number;
  genesisHash: string;
  headHash: string;
  chain: BolChainEvent[];
  createdAt: string;
  updatedAt: string;
  deliveryConfirmed: boolean;
}

const HMAC_SECRET = process.env.VESSELS_BOL_HMAC_SECRET ?? "vessels-bol-chain-secret-dev-only";

function chainHash(prevHash: string, eventType: string, actor: string, ts: string): string {
  return createHmac("sha256", HMAC_SECRET)
    .update(`${prevHash}|${eventType}|${actor}|${ts}`)
    .digest("hex")
    .slice(0, 32);
}

function buildChain(events: Array<{ eventType: string; actor: string; timestamp: string; confirmed: boolean }>): BolChainEvent[] {
  const chain: BolChainEvent[] = [];
  let prevHash = "0000000000000000000000000000000000000000000000000000000000000000";
  for (let i = 0; i < events.length; i++) {
    const { eventType, actor, timestamp, confirmed } = events[i];
    const hash = chainHash(prevHash, eventType, actor, timestamp);
    const signature = createHmac("sha256", HMAC_SECRET).update(`${hash}:${actor}`).digest("hex").slice(0, 16);
    chain.push({ sequence: i + 1, eventType, actor, timestamp, hash, prevHash, signature, confirmed });
    prevHash = hash;
  }
  return chain;
}

// Mutable in-memory store — seeded with demo data, accepts creates
const bolStore = new Map<string, BolDocument>();

function seedBol() {
  const docs: Array<Omit<BolDocument, "chain" | "genesisHash" | "headHash">> = [
    {
      id: "BOL-2026-4471",
      vesselName: "Pacific Navigator", imo: "9234891", voyageId: "VOY-2026-018",
      shipper: "Gulf Petroleum Corp", consignee: "NWE Refining BV", notifyParty: "Standard Chartered Bank",
      cargo: "Crude Oil — ESPO Blend", quantity: "298,400 MT", quantityMt: 298400, unit: "MT",
      originPort: "Primorsk, Russia", destinationPort: "Rotterdam, Netherlands",
      status: "transferred", lcRef: "LC-2026-3891", lcIssuer: "Standard Chartered",
      lcAmount: 189_400_000, lcStatus: "active", autoLcRelease: true,
      transferCount: 2, createdAt: "2026-04-10T09:12:00Z", updatedAt: "2026-04-13T09:00:00Z",
      deliveryConfirmed: false,
    },
    {
      id: "BOL-2026-4412",
      vesselName: "Arctic Breeze", imo: "9156234", voyageId: "VOY-2026-015",
      shipper: "Qatargas Trading", consignee: "Tokyo Gas Co", notifyParty: "HSBC Hong Kong",
      cargo: "LNG", quantity: "62,800 MT", quantityMt: 62800, unit: "MT",
      originPort: "Ras Laffan, Qatar", destinationPort: "Sodegaura, Japan",
      status: "in_transit", lcRef: "LC-2026-3847", lcIssuer: "HSBC Hong Kong",
      lcAmount: 44_600_000, lcStatus: "active", autoLcRelease: true,
      transferCount: 1, createdAt: "2026-04-12T07:00:00Z", updatedAt: "2026-04-12T11:05:00Z",
      deliveryConfirmed: false,
    },
    {
      id: "BOL-2026-4398",
      vesselName: "Meridian Bulk", imo: "9312004", voyageId: "VOY-2026-012",
      shipper: "BHP Shipping", consignee: "Baosteel Group", notifyParty: "BNP Paribas",
      cargo: "Iron Ore", quantity: "174,200 MT", quantityMt: 174200, unit: "MT",
      originPort: "Port Hedland, Australia", destinationPort: "Shanghai, China",
      status: "delivered", lcRef: "LC-2026-3802", lcIssuer: "BNP Paribas",
      lcAmount: 28_900_000, lcStatus: "settled", autoLcRelease: false,
      transferCount: 3, createdAt: "2026-03-28T08:00:00Z", updatedAt: "2026-04-09T12:00:00Z",
      deliveryConfirmed: true,
    },
  ];

  const chainEvents: Record<string, Array<{ eventType: string; actor: string; timestamp: string; confirmed: boolean }>> = {
    "BOL-2026-4471": [
      { eventType: "BoL Created", actor: "Gulf Petroleum Corp", timestamp: "2026-04-10T09:12:00Z", confirmed: true },
      { eventType: "First Endorsement", actor: "Standard Chartered (LC Bank)", timestamp: "2026-04-10T14:33:00Z", confirmed: true },
      { eventType: "Cargo Loaded — AIS Verified", actor: "Smart Port Primorsk", timestamp: "2026-04-11T06:22:00Z", confirmed: true },
      { eventType: "BoL Transferred", actor: "NWE Refining BV", timestamp: "2026-04-12T11:05:00Z", confirmed: true },
      { eventType: "LC Amendment", actor: "ING Bank NV", timestamp: "2026-04-13T09:00:00Z", confirmed: false },
    ],
    "BOL-2026-4412": [
      { eventType: "BoL Created", actor: "Qatargas Trading", timestamp: "2026-04-12T07:00:00Z", confirmed: true },
      { eventType: "Cargo Loaded — AIS Verified", actor: "Smart Port Ras Laffan", timestamp: "2026-04-12T10:00:00Z", confirmed: true },
      { eventType: "BoL Transferred", actor: "Tokyo Gas Co", timestamp: "2026-04-12T11:05:00Z", confirmed: true },
    ],
    "BOL-2026-4398": [
      { eventType: "BoL Created", actor: "BHP Shipping", timestamp: "2026-03-28T08:00:00Z", confirmed: true },
      { eventType: "First Endorsement", actor: "BNP Paribas", timestamp: "2026-03-28T12:00:00Z", confirmed: true },
      { eventType: "Cargo Loaded — AIS Verified", actor: "Smart Port Hedland", timestamp: "2026-03-28T18:00:00Z", confirmed: true },
      { eventType: "BoL Transferred", actor: "Baosteel Group", timestamp: "2026-04-02T09:00:00Z", confirmed: true },
      { eventType: "BoL Transferred", actor: "CITIC Metal", timestamp: "2026-04-06T11:00:00Z", confirmed: true },
      { eventType: "BoL Transferred", actor: "Shanghai Futures Exchange", timestamp: "2026-04-08T14:00:00Z", confirmed: true },
      { eventType: "Delivery Confirmed — LC Released", actor: "BNP Paribas Smart Contract", timestamp: "2026-04-09T12:00:00Z", confirmed: true },
    ],
  };

  for (const doc of docs) {
    const events = chainEvents[doc.id] ?? [];
    const chain = buildChain(events);
    bolStore.set(doc.id, {
      ...doc,
      chain,
      genesisHash: chain[0]?.hash ?? "",
      headHash: chain[chain.length - 1]?.hash ?? "",
    });
  }
}

seedBol();

router.get("/vessels/modules/bills-of-lading", authMiddleware(), (_req, res) => {
  try {
    const list = Array.from(bolStore.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const totals = {
      count: list.length,
      totalTradeValue: list.reduce((s, d) => s + d.lcAmount, 0),
      inTransit: list.filter(d => d.status === "in_transit" || d.status === "transferred").length,
      delivered: list.filter(d => d.status === "delivered" || d.status === "settled").length,
    };
    sendSuccess(res, { documents: list.map(d => ({ ...d, chain: undefined })), totals });
  } catch (err) {
    handleRouteError(res, err, "Failed to list bills of lading");
  }
});

router.get("/vessels/modules/bills-of-lading/:id", authMiddleware(), (req: Request, res) => {
  try {
    const doc = bolStore.get(req.params.id);
    if (!doc) { sendNotFound(res, "BillOfLading"); return; }
    sendSuccess(res, doc);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch bill of lading");
  }
});

router.post("/vessels/modules/bills-of-lading", validateBody(jsonObjectBodySchema), authMiddleware(), (req: Request, res) => {
  try {
    const { vesselName, imo, voyageId, shipper, consignee, notifyParty, cargo, quantityMt, unit, originPort, destinationPort, lcRef, lcIssuer, lcAmount } = req.body ?? {};
    if (!vesselName || !shipper || !consignee || !cargo || !originPort || !destinationPort) {
      sendBadRequest(res, "Missing required fields: vesselName, shipper, consignee, cargo, originPort, destinationPort");
      return;
    }
    const id = `BOL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();
    const events = [{ eventType: "BoL Created", actor: shipper, timestamp: now, confirmed: true }];
    const chain = buildChain(events);
    const doc: BolDocument = {
      id, vesselName, imo: imo ?? "", voyageId: voyageId ?? "",
      shipper, consignee, notifyParty: notifyParty ?? "",
      cargo, quantity: `${quantityMt ?? 0} ${unit ?? "MT"}`,
      quantityMt: Number(quantityMt ?? 0), unit: unit ?? "MT",
      originPort, destinationPort,
      status: "issued",
      lcRef: lcRef ?? "", lcIssuer: lcIssuer ?? "", lcAmount: Number(lcAmount ?? 0),
      lcStatus: lcRef ? "active" : "pending",
      autoLcRelease: true,
      transferCount: 0, createdAt: now, updatedAt: now,
      deliveryConfirmed: false,
      chain, genesisHash: chain[0]?.hash ?? "", headHash: chain[0]?.hash ?? "",
    };
    bolStore.set(id, doc);
    sendCreated(res, doc);
  } catch (err) {
    handleRouteError(res, err, "Failed to create bill of lading");
  }
});

// Transfer a BoL (add an endorsement event)
router.post("/vessels/modules/bills-of-lading/:id/transfer", validateBody(jsonObjectBodySchema), authMiddleware(), (req: Request, res) => {
  try {
    const doc = bolStore.get(req.params.id);
    if (!doc) { sendNotFound(res, "BillOfLading"); return; }
    const { newConsignee, actor } = req.body ?? {};
    if (!newConsignee || !actor) { sendBadRequest(res, "Missing newConsignee or actor"); return; }
    const now = new Date().toISOString();
    const newEvent = { eventType: "BoL Transferred", actor, timestamp: now, confirmed: true };
    const updatedEvents = doc.chain.map(e => ({ eventType: e.eventType, actor: e.actor, timestamp: e.timestamp, confirmed: e.confirmed }));
    updatedEvents.push(newEvent);
    const newChain = buildChain(updatedEvents);
    const updated: BolDocument = {
      ...doc,
      consignee: newConsignee,
      status: "transferred",
      transferCount: doc.transferCount + 1,
      updatedAt: now,
      chain: newChain,
      headHash: newChain[newChain.length - 1]?.hash ?? doc.headHash,
    };
    bolStore.set(doc.id, updated);
    sendSuccess(res, updated);
  } catch (err) {
    handleRouteError(res, err, "Failed to transfer bill of lading");
  }
});

// Verify a BoL's chain integrity
router.get("/vessels/modules/bills-of-lading/:id/verify", authMiddleware(), (req: Request, res) => {
  try {
    const doc = bolStore.get(req.params.id);
    if (!doc) { sendNotFound(res, "BillOfLading"); return; }
    let valid = true;
    let prevHash = "0000000000000000000000000000000000000000000000000000000000000000";
    for (const event of doc.chain) {
      const expected = chainHash(prevHash, event.eventType, event.actor, event.timestamp);
      if (expected !== event.hash || event.prevHash !== prevHash) { valid = false; break; }
      prevHash = event.hash;
    }
    sendSuccess(res, {
      bolId: doc.id, valid, chainLength: doc.chain.length,
      genesisHash: doc.genesisHash, headHash: doc.headHash,
      verifiedAt: new Date().toISOString(),
      algorithm: "HMAC-SHA256 (server-side hash chain)",
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to verify bill of lading");
  }
});

// ─── Crew Tracker ─────────────────────────────────────────────────────────────

interface Certification {
  name: string;
  code: string;
  issuedBy: string;
  issueDate: string;
  expiryDate: string;
  status: "valid" | "expiring_soon" | "expired";
}

interface CrewMember {
  id: string;
  name: string;
  rank: string;
  rankCode: string;
  nationality: string;
  flagEmoji: string;
  vessel: string;
  imo: string;
  joinDate: string;
  reliefDate: string;
  daysOnBoard: number;
  maxRotationDays: number;
  certifications: Certification[];
  medicalExpiry: string;
  mlcCompliant: boolean;
  flagState: string;
  stcwEndorsement: boolean;
  seafarerIdNo: string;
  contractType: "employment" | "agency";
}

interface CrewRotation {
  vessel: string;
  imo: string;
  reliefs: Array<{
    name: string;
    rank: string;
    nationality: string;
    eta: string;
    status: "confirmed" | "pending" | "urgent";
    agency: string;
  }>;
}

function certStatus(expiryDate: string): "valid" | "expiring_soon" | "expired" {
  const expiry = new Date(expiryDate).getTime();
  const now = Date.now();
  const daysLeft = (expiry - now) / (1000 * 60 * 60 * 24);
  if (daysLeft < 0) return "expired";
  if (daysLeft < 90) return "expiring_soon";
  return "valid";
}

const CREW_ROSTER: CrewMember[] = [
  {
    id: "CR-001", name: "Capt. Erik Magnusson", rank: "Master", rankCode: "MAS",
    nationality: "Norwegian", flagEmoji: "🇳🇴",
    vessel: "Pacific Navigator", imo: "9234891",
    joinDate: "2026-01-15", reliefDate: "2026-07-15",
    daysOnBoard: 93, maxRotationDays: 180,
    flagState: "Marshall Islands", mlcCompliant: true, stcwEndorsement: true,
    seafarerIdNo: "NO-2024-18832", contractType: "employment",
    medicalExpiry: "2026-11-30",
    certifications: [
      { name: "STCW II/2 — Master", code: "STCW-II2", issuedBy: "Norwegian Maritime Authority", issueDate: "2021-03-10", expiryDate: "2026-03-10", status: certStatus("2026-03-10") },
      { name: "GMDSS General Operator", code: "GMDSS", issuedBy: "Norwegian Maritime Authority", issueDate: "2022-06-15", expiryDate: "2027-06-15", status: certStatus("2027-06-15") },
      { name: "Advanced Fire Fighting", code: "AFF", issuedBy: "NMA", issueDate: "2023-01-20", expiryDate: "2028-01-20", status: certStatus("2028-01-20") },
      { name: "ECDIS Type Specific (Furuno)", code: "ECDIS-F", issuedBy: "Furuno Approved Training", issueDate: "2022-09-12", expiryDate: "2027-09-12", status: certStatus("2027-09-12") },
    ],
  },
  {
    id: "CR-002", name: "C/O Priya Nair", rank: "Chief Officer", rankCode: "C/O",
    nationality: "Indian", flagEmoji: "🇮🇳",
    vessel: "Pacific Navigator", imo: "9234891",
    joinDate: "2026-02-10", reliefDate: "2026-08-10",
    daysOnBoard: 67, maxRotationDays: 180,
    flagState: "Marshall Islands", mlcCompliant: true, stcwEndorsement: true,
    seafarerIdNo: "IN-2023-44123", contractType: "agency",
    medicalExpiry: "2027-02-28",
    certifications: [
      { name: "STCW II/1 — Officer of the Watch", code: "STCW-II1", issuedBy: "Directorate General of Shipping", issueDate: "2023-04-05", expiryDate: "2028-04-05", status: certStatus("2028-04-05") },
      { name: "Tanker Familiarisation", code: "TANK-FAM", issuedBy: "Cochin Port Training", issueDate: "2022-07-18", expiryDate: "2026-05-15", status: certStatus("2026-05-15") },
      { name: "ECDIS Type Specific (JRC)", code: "ECDIS-J", issuedBy: "JRC Approved Training", issueDate: "2021-11-22", expiryDate: "2026-11-22", status: certStatus("2026-11-22") },
    ],
  },
  {
    id: "CR-003", name: "Ch. Eng. Lars Petersen", rank: "Chief Engineer", rankCode: "C/E",
    nationality: "Danish", flagEmoji: "🇩🇰",
    vessel: "Arctic Breeze", imo: "9156234",
    joinDate: "2025-11-20", reliefDate: "2026-05-20",
    daysOnBoard: 149, maxRotationDays: 180,
    flagState: "Norway", mlcCompliant: true, stcwEndorsement: true,
    seafarerIdNo: "DK-2022-91023", contractType: "employment",
    medicalExpiry: "2026-04-30",
    certifications: [
      { name: "STCW III/2 — Chief Engineer", code: "STCW-III2", issuedBy: "Danish Maritime Authority", issueDate: "2020-08-14", expiryDate: "2025-08-14", status: certStatus("2025-08-14") },
      { name: "High Voltage Safety", code: "HV", issuedBy: "DNV Training", issueDate: "2023-03-10", expiryDate: "2028-03-10", status: certStatus("2028-03-10") },
      { name: "IGF Code — Gas Fuelled Ships", code: "IGF", issuedBy: "DMA", issueDate: "2022-10-01", expiryDate: "2027-10-01", status: certStatus("2027-10-01") },
    ],
  },
  {
    id: "CR-004", name: "AB Omar Al-Rashidi", rank: "Able Seaman", rankCode: "AB",
    nationality: "Filipino", flagEmoji: "🇵🇭",
    vessel: "Meridian Bulk", imo: "9312004",
    joinDate: "2026-03-01", reliefDate: "2026-09-01",
    daysOnBoard: 48, maxRotationDays: 180,
    flagState: "Panama", mlcCompliant: true, stcwEndorsement: true,
    seafarerIdNo: "PH-2024-12387", contractType: "agency",
    medicalExpiry: "2027-06-15",
    certifications: [
      { name: "STCW II/4 — Rating", code: "STCW-II4", issuedBy: "MARINA Philippines", issueDate: "2024-01-15", expiryDate: "2029-01-15", status: certStatus("2029-01-15") },
      { name: "Basic Safety Training", code: "BST", issuedBy: "MARINA Philippines", issueDate: "2024-01-15", expiryDate: "2029-01-15", status: certStatus("2029-01-15") },
      { name: "Security Awareness", code: "SEC", issuedBy: "MARINA Philippines", issueDate: "2024-01-15", expiryDate: "2029-01-15", status: certStatus("2029-01-15") },
    ],
  },
  {
    id: "CR-005", name: "2/E Fatima Ouedraogo", rank: "2nd Engineer", rankCode: "2/E",
    nationality: "Nigerian", flagEmoji: "🇳🇬",
    vessel: "Cape Resolute", imo: "9445120",
    joinDate: "2025-12-01", reliefDate: "2026-06-01",
    daysOnBoard: 138, maxRotationDays: 180,
    flagState: "Liberia", mlcCompliant: false, stcwEndorsement: true,
    seafarerIdNo: "NG-2022-55643", contractType: "agency",
    medicalExpiry: "2026-06-30",
    certifications: [
      { name: "STCW III/1 — Engineer Officer of the Watch", code: "STCW-III1", issuedBy: "Nigerian Maritime Admin", issueDate: "2022-05-10", expiryDate: "2027-05-10", status: certStatus("2027-05-10") },
      { name: "Advanced Fire Fighting", code: "AFF", issuedBy: "NMA Lagos", issueDate: "2021-09-22", expiryDate: "2026-04-22", status: certStatus("2026-04-22") },
      { name: "Medical First Aid", code: "MFA", issuedBy: "NMA Lagos", issueDate: "2023-02-18", expiryDate: "2028-02-18", status: certStatus("2028-02-18") },
    ],
  },
  {
    id: "CR-006", name: "3/O Yuki Tanaka", rank: "3rd Officer", rankCode: "3/O",
    nationality: "Japanese", flagEmoji: "🇯🇵",
    vessel: "Coral Endeavour", imo: "9501667",
    joinDate: "2026-02-15", reliefDate: "2026-08-15",
    daysOnBoard: 62, maxRotationDays: 180,
    flagState: "Marshall Islands", mlcCompliant: true, stcwEndorsement: true,
    seafarerIdNo: "JP-2023-78921", contractType: "employment",
    medicalExpiry: "2027-09-30",
    certifications: [
      { name: "STCW II/1 — Officer of the Watch", code: "STCW-II1", issuedBy: "Japan Coast Guard", issueDate: "2023-07-20", expiryDate: "2028-07-20", status: certStatus("2028-07-20") },
      { name: "GMDSS GOC", code: "GMDSS", issuedBy: "Japan Coast Guard", issueDate: "2023-07-20", expiryDate: "2028-07-20", status: certStatus("2028-07-20") },
      { name: "Basic Safety Training", code: "BST", issuedBy: "Japan Coast Guard", issueDate: "2023-07-20", expiryDate: "2028-07-20", status: certStatus("2028-07-20") },
    ],
  },
];

const CREW_ROTATIONS: CrewRotation[] = [
  {
    vessel: "Pacific Navigator", imo: "9234891",
    reliefs: [
      { name: "Capt. Magnus Ericson", rank: "Master", nationality: "Swedish", eta: "2026-07-15", status: "confirmed", agency: "Wallem Group" },
      { name: "C/O Sanjay Gupta", rank: "Chief Officer", nationality: "Indian", eta: "2026-08-10", status: "pending", agency: "Eastern Kroman" },
    ],
  },
  {
    vessel: "Arctic Breeze", imo: "9156234",
    reliefs: [
      { name: "Ch. Eng. Henk van der Berg", rank: "Chief Engineer", nationality: "Dutch", eta: "2026-05-20", status: "urgent", agency: "V.Ships" },
    ],
  },
  {
    vessel: "Cape Resolute", imo: "9445120",
    reliefs: [
      { name: "2/E Grace Adeola", rank: "2nd Engineer", nationality: "Nigerian", eta: "2026-06-01", status: "confirmed", agency: "Bernhard Schulte" },
    ],
  },
];

router.get("/vessels/modules/crew", authMiddleware(), (_req, res) => {
  try {
    const vesselFilter = (_req.query.vessel as string) || undefined;
    const roster = vesselFilter
      ? CREW_ROSTER.filter(c => c.vessel === vesselFilter)
      : CREW_ROSTER;
    const summary = {
      total: roster.length,
      expiredCerts: roster.reduce((s, c) => s + c.certifications.filter(x => x.status === "expired").length, 0),
      expiringCerts: roster.reduce((s, c) => s + c.certifications.filter(x => x.status === "expiring_soon").length, 0),
      mlcIssues: roster.filter(c => !c.mlcCompliant).length,
      rotationAlerts: roster.filter(c => (c.daysOnBoard / c.maxRotationDays) > 0.85).length,
    };
    sendSuccess(res, { roster, rotations: CREW_ROTATIONS, summary });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch crew roster");
  }
});

router.get("/vessels/modules/crew/:id", authMiddleware(), (req: Request, res) => {
  try {
    const member = CREW_ROSTER.find(c => c.id === req.params.id);
    if (!member) { sendNotFound(res, "CrewMember"); return; }
    sendSuccess(res, member);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch crew member");
  }
});

export default router;
