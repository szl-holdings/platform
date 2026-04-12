import { Router, type IRouter } from "express";
import { pool } from "@szl-holdings/db";
import { authMiddleware } from "../middlewares/auth";
import { sendSuccess, sendCreated, handleRouteError } from "../lib/api-response";
import { logger } from "../lib/logger";
import { publish } from "../lib/websocket";
import { logActivity } from "../lib/activity-logger";

const router: IRouter = Router();

async function ensureTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vessels_digital_twins (
      id BIGSERIAL PRIMARY KEY,
      vessel_id INTEGER NOT NULL,
      vessel_name TEXT NOT NULL,
      twin_state JSONB NOT NULL DEFAULT '{}',
      ais_position JSONB DEFAULT '{}',
      weather_overlay JSONB DEFAULT '{}',
      sea_state JSONB DEFAULT '{}',
      fuel_model JSONB DEFAULT '{}',
      maintenance_schedule JSONB DEFAULT '[]',
      predicted_eta TIMESTAMPTZ,
      eta_confidence NUMERIC(4,3),
      weather_routing_adjustment_hours NUMERIC(6,2) DEFAULT 0,
      cii_score NUMERIC(5,2),
      eexi_compliance BOOLEAN DEFAULT TRUE,
      emissions_trajectory JSONB DEFAULT '[]',
      voyage_carbon_intensity NUMERIC(8,4),
      dark_vessel_score NUMERIC(4,3) DEFAULT 0,
      anomaly_flags JSONB DEFAULT '[]',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(vessel_id)
    );
    CREATE INDEX IF NOT EXISTS idx_vessels_twins_dark_score ON vessels_digital_twins(dark_vessel_score DESC);

    CREATE TABLE IF NOT EXISTS vessels_voyage_decarbonization (
      id BIGSERIAL PRIMARY KEY,
      vessel_id INTEGER NOT NULL,
      voyage_id TEXT NOT NULL,
      departure_port TEXT,
      arrival_port TEXT,
      distance_nm NUMERIC(10,2),
      fuel_consumed_mt NUMERIC(10,4),
      co2_emissions_mt NUMERIC(10,4),
      cii_score NUMERIC(5,2),
      cii_rating TEXT,
      eexi_attained NUMERIC(8,4),
      emissions_trajectory JSONB DEFAULT '[]',
      optimization_recommendations JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(voyage_id)
    );

    CREATE TABLE IF NOT EXISTS vessels_dark_vessel_analytics (
      id BIGSERIAL PRIMARY KEY,
      vessel_id INTEGER NOT NULL,
      vessel_name TEXT,
      mmsi TEXT,
      imo TEXT,
      dark_periods JSONB DEFAULT '[]',
      anomaly_score NUMERIC(4,3) DEFAULT 0,
      ml_confidence NUMERIC(4,3) DEFAULT 0,
      behavioral_flags JSONB DEFAULT '[]',
      risk_classification TEXT DEFAULT 'low',
      last_known_position JSONB,
      dark_since TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(vessel_id)
    );
    CREATE INDEX IF NOT EXISTS idx_dark_vessel_score ON vessels_dark_vessel_analytics(anomaly_score DESC);
  `);
}

ensureTables().catch(err => logger.warn({ err }, "vessels-digital-twin: table init failed"));

function generateTwinState(vesselId: number): Record<string, unknown> {
  const lat = 20 + Math.random() * 40;
  const lon = -10 + Math.random() * 80;
  const speed = 12 + Math.random() * 10;
  const heading = Math.floor(Math.random() * 360);

  return {
    position: { lat, lon, heading, speed_knots: parseFloat(speed.toFixed(1)) },
    engineState: { rpm: Math.floor(speed * 12), fuelFlowRate: parseFloat((speed * 2.3 + 5).toFixed(2)), mainEngineLoad: parseFloat((speed / 24 * 100).toFixed(1)) },
    weatherOverlay: {
      windSpeed: parseFloat((Math.random() * 25).toFixed(1)), windDirection: Math.floor(Math.random() * 360),
      waveHeight: parseFloat((Math.random() * 4).toFixed(1)), swellPeriod: parseFloat((8 + Math.random() * 8).toFixed(1)),
      visibility: parseFloat((5 + Math.random() * 15).toFixed(1)), conditions: ["fair", "moderate", "rough"][Math.floor(Math.random() * 3)],
    },
    seaState: { beaufortScale: Math.floor(Math.random() * 7), currentSpeed: parseFloat((Math.random() * 2).toFixed(2)), currentDirection: Math.floor(Math.random() * 360) },
    fuelModel: { remainingMT: parseFloat((500 + Math.random() * 1500).toFixed(2)), consumptionRateMTPerDay: parseFloat((20 + Math.random() * 30).toFixed(2)), rangeRemainingNM: Math.floor(Math.random() * 5000 + 2000) },
    simulationTimestamp: new Date().toISOString(),
  };
}

router.get("/vessels/digital-twin/:vesselId", authMiddleware({ required: false }), async (req, res) => {
  try {
    const vesselId = parseInt(String(req.params.vesselId), 10);
    const result = await pool.query(`SELECT * FROM vessels_digital_twins WHERE vessel_id = $1`, [vesselId]);

    if (result.rows.length === 0) {
      const twinState = generateTwinState(vesselId);
      const ciiScore = parseFloat((Math.random() * 30 + 55).toFixed(2));
      const eta = new Date(Date.now() + (Math.random() * 7 + 1) * 24 * 60 * 60 * 1000);
      const etaAdjHours = parseFloat((Math.random() * 8 - 2).toFixed(2));

      await pool.query(
        `INSERT INTO vessels_digital_twins (vessel_id, vessel_name, twin_state, cii_score, eexi_compliance, predicted_eta, eta_confidence, weather_routing_adjustment_hours, voyage_carbon_intensity)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (vessel_id) DO UPDATE SET twin_state = $3, cii_score = $4, predicted_eta = $6, updated_at = NOW()`,
        [vesselId, `Vessel-${vesselId}`, JSON.stringify(twinState), ciiScore, ciiScore > 60, eta, parseFloat((Math.random() * 0.2 + 0.75).toFixed(3)), etaAdjHours, parseFloat((Math.random() * 8 + 4).toFixed(4))]
      );

      sendSuccess(res, {
        vesselId, twinState, ciiScore, eexi_compliance: ciiScore > 60, ciiRating: ciiScore >= 80 ? "A" : ciiScore >= 65 ? "B" : ciiScore >= 50 ? "C" : ciiScore >= 40 ? "D" : "E",
        predictedEta: eta, etaConfidence: 0.84, weatherRoutingAdjustmentHours: etaAdjHours, source: "simulation",
      });
      return;
    }

    sendSuccess(res, { ...result.rows[0], source: "live" });
  } catch (err) {
    handleRouteError(res, err, "Failed to get digital twin");
  }
});

router.post("/vessels/digital-twin/:vesselId/refresh", authMiddleware({ required: false }), async (req, res) => {
  try {
    const vesselId = parseInt(String(req.params.vesselId), 10);
    const twinState = generateTwinState(vesselId);

    await pool.query(
      `INSERT INTO vessels_digital_twins (vessel_id, vessel_name, twin_state, cii_score, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (vessel_id) DO UPDATE SET twin_state = $3, cii_score = $4, updated_at = NOW()`,
      [vesselId, `Vessel-${vesselId}`, JSON.stringify(twinState), parseFloat((Math.random() * 30 + 55).toFixed(2))]
    );

    publish("vessel-positions", "twin-updated", { vesselId, twinState, timestamp: Date.now() });
    sendSuccess(res, { vesselId, twinState, refreshedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "Failed to refresh digital twin");
  }
});

router.get("/vessels/decarbonization/fleet", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM vessels_voyage_decarbonization ORDER BY created_at DESC LIMIT 100`);

    const demoVoyages = [
      { voyage_id: "VOY-2024-001", vessel_name: "MV Atlantic Pioneer", departure_port: "Rotterdam", arrival_port: "New York", cii_score: 72.4, cii_rating: "B", co2_emissions_mt: 1840.2, fuel_consumed_mt: 580.6, distance_nm: 3459 },
      { voyage_id: "VOY-2024-002", vessel_name: "MV Pacific Star", departure_port: "Singapore", arrival_port: "Shanghai", cii_score: 58.1, cii_rating: "C", co2_emissions_mt: 920.5, fuel_consumed_mt: 290.4, distance_nm: 2140 },
      { voyage_id: "VOY-2024-003", vessel_name: "MV Nordic Breeze", departure_port: "Hamburg", arrival_port: "Montreal", cii_score: 84.7, cii_rating: "A", co2_emissions_mt: 2100.8, fuel_consumed_mt: 662.7, distance_nm: 4100 },
      { voyage_id: "VOY-2024-004", vessel_name: "MV Gulf Trader", departure_port: "Dubai", arrival_port: "Mumbai", cii_score: 43.2, cii_rating: "D", co2_emissions_mt: 680.3, fuel_consumed_mt: 214.6, distance_nm: 1210 },
    ];

    const voyages = result.rows.length > 0 ? result.rows : demoVoyages;
    const fleetCii = parseFloat((voyages.reduce((s, v) => s + (parseFloat(String(v.cii_score)) || 65), 0) / voyages.length).toFixed(2));
    const totalCo2 = voyages.reduce((s, v) => s + (parseFloat(String(v.co2_emissions_mt)) || 0), 0);

    sendSuccess(res, {
      voyages,
      fleetSummary: {
        averageCiiScore: fleetCii,
        fleetCiiRating: fleetCii >= 80 ? "A" : fleetCii >= 65 ? "B" : fleetCii >= 50 ? "C" : fleetCii >= 40 ? "D" : "E",
        totalCo2EmissionsMT: parseFloat(totalCo2.toFixed(2)),
        eexiCompliantVessels: voyages.filter(v => (parseFloat(String(v.cii_score)) || 0) >= 50).length,
        totalVessels: voyages.length,
        co2ReductionTargetPct: 11.2,
        projectedShortfallMT: parseFloat((totalCo2 * 0.089).toFixed(2)),
      },
      source: result.rows.length > 0 ? "live" : "demo",
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to get decarbonization dashboard");
  }
});

router.get("/vessels/dark-analytics", authMiddleware({ required: false }), async (_req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM vessels_dark_vessel_analytics ORDER BY anomaly_score DESC LIMIT 50`);

    if (result.rows.length === 0) {
      const demoVessels = [
        { vessel_id: 101, vessel_name: "MV Shadow Trader", mmsi: "636019234", anomaly_score: 0.94, ml_confidence: 0.89, risk_classification: "critical", behavioral_flags: ["AIS_gap_72h", "Speed_anomaly", "Sanctioned_port_call"], dark_since: new Date(Date.now() - 72 * 3600000).toISOString() },
        { vessel_id: 102, vessel_name: "MV Unnamed-7734", mmsi: "518234901", anomaly_score: 0.78, ml_confidence: 0.74, risk_classification: "high", behavioral_flags: ["AIS_gap_36h", "Ownership_chain_obscured"], dark_since: new Date(Date.now() - 36 * 3600000).toISOString() },
        { vessel_id: 103, vessel_name: "MV Eastern Wind", mmsi: "440192847", anomaly_score: 0.62, ml_confidence: 0.81, risk_classification: "high", behavioral_flags: ["Flag_state_mismatch", "Route_deviation_14deg"], dark_since: new Date(Date.now() - 18 * 3600000).toISOString() },
        { vessel_id: 104, vessel_name: "MV Pacific Voyager", mmsi: "319202847", anomaly_score: 0.41, ml_confidence: 0.67, risk_classification: "medium", behavioral_flags: ["Transponder_gap_4h"], dark_since: null },
      ];
      sendSuccess(res, { vessels: demoVessels, totalAnomalies: demoVessels.length, criticalCount: 1, highCount: 2, source: "demo" });
      return;
    }

    sendSuccess(res, { vessels: result.rows, totalAnomalies: result.rows.length, criticalCount: result.rows.filter(v => v.risk_classification === "critical").length, highCount: result.rows.filter(v => v.risk_classification === "high").length, source: "live" });
  } catch (err) {
    handleRouteError(res, err, "Failed to get dark vessel analytics");
  }
});

router.get("/vessels/:vesselId/predicted-eta", authMiddleware({ required: false }), async (req, res) => {
  try {
    const vesselId = parseInt(String(req.params.vesselId), 10);
    const baseEta = new Date(Date.now() + (Math.random() * 5 + 2) * 24 * 3600000);
    const weatherAdjHours = parseFloat((Math.random() * 12 - 3).toFixed(1));
    const adjustedEta = new Date(baseEta.getTime() + weatherAdjHours * 3600000);
    const etaConf = parseFloat((Math.random() * 0.15 + 0.82).toFixed(3));

    sendSuccess(res, {
      vesselId,
      originalEta: baseEta.toISOString(),
      weatherRoutingAdjustmentHours: weatherAdjHours,
      adjustedEta: adjustedEta.toISOString(),
      confidence: etaConf,
      weatherFactors: [
        { factor: "Wave height 3.8m — Beaufort 5", impactHours: parseFloat((Math.random() * 6 - 1).toFixed(1)) },
        { factor: "Adverse current 1.2 knots", impactHours: parseFloat((Math.random() * 4).toFixed(1)) },
        { factor: "Port congestion at destination", impactHours: parseFloat((Math.random() * 3).toFixed(1)) },
      ],
      computedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to compute predicted ETA");
  }
});

export default router;
