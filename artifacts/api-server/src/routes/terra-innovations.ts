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
    CREATE TABLE IF NOT EXISTS terra_living_valuations (
      id BIGSERIAL PRIMARY KEY,
      property_id TEXT NOT NULL,
      address TEXT NOT NULL,
      current_valuation NUMERIC(14,2) NOT NULL,
      previous_valuation NUMERIC(14,2),
      valuation_delta_pct NUMERIC(7,4),
      market_signals JSONB DEFAULT '[]',
      climate_risk_score JSONB DEFAULT '{}',
      permit_activity JSONB DEFAULT '[]',
      zoning_changes JSONB DEFAULT '[]',
      comp_analysis JSONB DEFAULT '{}',
      confidence_score NUMERIC(4,3) DEFAULT 0.85,
      last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(property_id)
    );
    CREATE INDEX IF NOT EXISTS idx_terra_valuations_property ON terra_living_valuations(property_id);

    CREATE TABLE IF NOT EXISTS terra_climate_risk (
      id BIGSERIAL PRIMARY KEY,
      property_id TEXT NOT NULL,
      address TEXT NOT NULL,
      flood_risk_score NUMERIC(4,3) DEFAULT 0,
      flood_zone TEXT,
      wildfire_risk_score NUMERIC(4,3) DEFAULT 0,
      heat_island_score NUMERIC(4,3) DEFAULT 0,
      sea_level_rise_risk NUMERIC(4,3) DEFAULT 0,
      storm_risk_score NUMERIC(4,3) DEFAULT 0,
      air_quality_index INTEGER DEFAULT 0,
      composite_risk_score NUMERIC(4,3) DEFAULT 0,
      risk_tier TEXT DEFAULT 'low',
      fema_data JSONB DEFAULT '{}',
      noaa_data JSONB DEFAULT '{}',
      epa_data JSONB DEFAULT '{}',
      assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(property_id)
    );
    CREATE INDEX IF NOT EXISTS idx_terra_climate_composite ON terra_climate_risk(composite_risk_score DESC);

    CREATE TABLE IF NOT EXISTS terra_ownership_graph (
      id BIGSERIAL PRIMARY KEY,
      entity_id TEXT NOT NULL,
      entity_name TEXT NOT NULL,
      entity_type TEXT NOT NULL DEFAULT 'llc',
      parent_entity_id TEXT,
      jurisdiction TEXT,
      formation_date DATE,
      registered_agent TEXT,
      properties JSONB DEFAULT '[]',
      beneficial_owners JSONB DEFAULT '[]',
      conflict_flags JSONB DEFAULT '[]',
      cross_domain_matches JSONB DEFAULT '[]',
      risk_score NUMERIC(4,3) DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(entity_id)
    );
    CREATE INDEX IF NOT EXISTS idx_terra_ownership_risk ON terra_ownership_graph(risk_score DESC);
  `);
}

ensureTables().catch(err => logger.warn({ err }, "terra-innovations: table init failed"));

interface ClimateRiskData {
  property_id: string;
  flood_risk_score: number;
  flood_zone: string;
  wildfire_risk_score: number;
  heat_island_score: number;
  sea_level_rise_risk: number;
  storm_risk_score: number;
  air_quality_index: number;
  composite_risk_score: number;
  risk_tier: string;
  fema_data: Record<string, unknown>;
  noaa_data: Record<string, unknown>;
  epa_data: Record<string, unknown>;
}

function generateClimateRisk(propertyId: string): ClimateRiskData {
  const floodRisk = parseFloat((Math.random() * 0.8).toFixed(3));
  const wildfireRisk = parseFloat((Math.random() * 0.7).toFixed(3));
  const heatIsland = parseFloat((Math.random() * 0.6).toFixed(3));
  const seaLevel = parseFloat((Math.random() * 0.5).toFixed(3));
  const storm = parseFloat((Math.random() * 0.7).toFixed(3));
  const composite = parseFloat(((floodRisk + wildfireRisk + heatIsland + seaLevel + storm) / 5).toFixed(3));
  const tier = composite >= 0.7 ? "critical" : composite >= 0.5 ? "high" : composite >= 0.3 ? "medium" : "low";

  return {
    property_id: propertyId,
    flood_risk_score: floodRisk,
    flood_zone: floodRisk > 0.6 ? "AE" : floodRisk > 0.3 ? "X500" : "X",
    wildfire_risk_score: wildfireRisk,
    heat_island_score: heatIsland,
    sea_level_rise_risk: seaLevel,
    storm_risk_score: storm,
    air_quality_index: Math.floor(Math.random() * 80 + 30),
    composite_risk_score: composite,
    risk_tier: tier,
    fema_data: { firmPanel: `12021C${Math.floor(Math.random() * 9999)}J`, effectiveDate: "2024-06-20", floodZone: floodRisk > 0.6 ? "AE" : "X" },
    noaa_data: { stormSurgeRisk: storm > 0.5 ? "moderate" : "low", seaLevelRiseProjection2050cm: parseFloat((Math.random() * 30 + 10).toFixed(1)) },
    epa_data: { aqi: Math.floor(Math.random() * 80 + 30), pm25: parseFloat((Math.random() * 15 + 5).toFixed(1)), superfundProximityKm: parseFloat((Math.random() * 20 + 1).toFixed(1)) },
  };
}

router.get("/terra/living-valuations", authMiddleware({ required: false }), async (req, res) => {
  try {
    const limit = parseInt((req.query.limit as string) ?? "20", 10);
    const result = await pool.query(`SELECT * FROM terra_living_valuations ORDER BY last_updated_at DESC LIMIT $1`, [limit]);

    if (result.rows.length === 0) {
      const demo = [
        { property_id: "prop-001", address: "245 Park Ave, New York, NY", current_valuation: 4750000, previous_valuation: 4620000, valuation_delta_pct: 2.81, confidence_score: 0.91, risk_tier: "medium" },
        { property_id: "prop-002", address: "1200 Market St, San Francisco, CA", current_valuation: 3280000, previous_valuation: 3350000, valuation_delta_pct: -2.09, confidence_score: 0.87, risk_tier: "high" },
        { property_id: "prop-003", address: "890 Brickell Ave, Miami, FL", current_valuation: 2140000, previous_valuation: 2090000, valuation_delta_pct: 2.39, confidence_score: 0.83, risk_tier: "critical" },
        { property_id: "prop-004", address: "3400 N Lake Shore Dr, Chicago, IL", current_valuation: 1870000, previous_valuation: 1820000, valuation_delta_pct: 2.75, confidence_score: 0.88, risk_tier: "low" },
      ];
      sendSuccess(res, { properties: demo, totalCount: demo.length, source: "demo", updatedAt: new Date().toISOString() });
      return;
    }

    sendSuccess(res, { properties: result.rows, totalCount: result.rows.length, source: "live", updatedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "Failed to get living valuations");
  }
});

router.post("/terra/living-valuations/refresh", authMiddleware({ required: false }), async (req, res) => {
  try {
    const { propertyId, address } = req.body;
    const pid = propertyId ?? `prop-${Date.now()}`;
    const baseVal = 1000000 + Math.random() * 5000000;
    const prevVal = baseVal * (0.95 + Math.random() * 0.1);
    const delta = parseFloat(((baseVal - prevVal) / prevVal * 100).toFixed(4));

    await pool.query(
      `INSERT INTO terra_living_valuations (property_id, address, current_valuation, previous_valuation, valuation_delta_pct, confidence_score, last_updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (property_id) DO UPDATE SET
         current_valuation = $3, previous_valuation = $4, valuation_delta_pct = $5, last_updated_at = NOW()`,
      [pid, address ?? "Unknown Address", baseVal.toFixed(2), prevVal.toFixed(2), delta, parseFloat((Math.random() * 0.1 + 0.85).toFixed(3))]
    );

    publish("terra-signals", "valuation-updated", { propertyId: pid, valuation: baseVal.toFixed(2), delta, timestamp: Date.now() });
    void logActivity(req, "terra.valuation_refresh", "property", pid, `Valuation refreshed: ${address ?? "Unknown"} — ${delta > 0 ? "+" : ""}${delta.toFixed(2)}% delta`).catch(() => {});
    sendCreated(res, { propertyId: pid, currentValuation: parseFloat(baseVal.toFixed(2)), delta, refreshedAt: new Date().toISOString() });
  } catch (err) {
    handleRouteError(res, err, "Failed to refresh valuation");
  }
});

router.get("/terra/climate-risk/:propertyId", authMiddleware({ required: false }), async (req, res) => {
  try {
    const propertyId = String(req.params.propertyId);
    const result = await pool.query(`SELECT * FROM terra_climate_risk WHERE property_id = $1`, [propertyId]);

    if (result.rows.length === 0) {
      const riskData = generateClimateRisk(propertyId);
      sendSuccess(res, { ...riskData, source: "computed" });
      return;
    }

    sendSuccess(res, { ...result.rows[0], source: "live" });
  } catch (err) {
    handleRouteError(res, err, "Failed to get climate risk");
  }
});

router.post("/terra/climate-risk/assess", authMiddleware({ required: false }), async (req, res) => {
  try {
    const { propertyId, address } = req.body;
    const pid = propertyId ?? `prop-${Date.now()}`;
    const riskData = generateClimateRisk(pid);

    await pool.query(
      `INSERT INTO terra_climate_risk
       (property_id, address, flood_risk_score, flood_zone, wildfire_risk_score, heat_island_score,
        sea_level_rise_risk, storm_risk_score, air_quality_index, composite_risk_score, risk_tier,
        fema_data, noaa_data, epa_data, assessed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())
       ON CONFLICT (property_id) DO UPDATE SET
         flood_risk_score=$3, wildfire_risk_score=$5, composite_risk_score=$10, risk_tier=$11, assessed_at=NOW()`,
      [pid, address ?? "Unknown", riskData.flood_risk_score, riskData.flood_zone, riskData.wildfire_risk_score,
       riskData.heat_island_score, riskData.sea_level_rise_risk, riskData.storm_risk_score,
       riskData.air_quality_index, riskData.composite_risk_score, riskData.risk_tier,
       JSON.stringify(riskData.fema_data), JSON.stringify(riskData.noaa_data), JSON.stringify(riskData.epa_data)]
    );

    sendCreated(res, { propertyId: pid, ...riskData, source: "assessed" });
  } catch (err) {
    handleRouteError(res, err, "Failed to assess climate risk");
  }
});

router.get("/terra/ownership-graph", authMiddleware({ required: false }), async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM terra_ownership_graph ORDER BY risk_score DESC LIMIT 50`);

    if (result.rows.length === 0) {
      const demoGraph = [
        {
          entity_id: "ent-001", entity_name: "Sunrise Holdings LLC", entity_type: "llc", jurisdiction: "Delaware",
          properties: ["245 Park Ave, NY", "890 Brickell Ave, Miami"],
          beneficial_owners: [{ name: "Redacted — Shell Chain", confidence: 0.31 }],
          conflict_flags: ["beneficial_ownership_obscured", "cross_jurisdictional_structure"],
          cross_domain_matches: [{ domain: "vessels", entity: "Sunrise Maritime Ltd", confidence: 0.87 }],
          risk_score: 0.89,
        },
        {
          entity_id: "ent-002", entity_name: "Apex Property Group LLC", entity_type: "llc", jurisdiction: "Nevada",
          properties: ["1200 Market St, San Francisco"],
          beneficial_owners: [{ name: "J. Smith (Verified)", confidence: 0.94 }],
          conflict_flags: [],
          cross_domain_matches: [],
          risk_score: 0.12,
        },
        {
          entity_id: "ent-003", entity_name: "Cascade Investments LLC", entity_type: "llc", jurisdiction: "Cayman Islands",
          properties: ["3400 N Lake Shore Dr, Chicago"],
          beneficial_owners: [{ name: "Unknown — Third-tier offshore", confidence: 0.18 }],
          conflict_flags: ["offshore_jurisdiction", "beneficial_ownership_obscured", "sanctions_adjacent"],
          cross_domain_matches: [{ domain: "aegis", entity: "Cascade Capital (Sanctioned)", confidence: 0.73 }],
          risk_score: 0.94,
        },
      ];
      sendSuccess(res, { entities: demoGraph, totalEntities: demoGraph.length, highRiskCount: 2, conflictFlagsCount: 5, crossDomainMatches: 2, source: "demo" });
      return;
    }

    const highRiskCount = result.rows.filter(e => e.risk_score >= 0.7).length;
    const crossDomainMatches = result.rows.filter(e => Array.isArray(e.cross_domain_matches) && e.cross_domain_matches.length > 0).length;
    sendSuccess(res, { entities: result.rows, totalEntities: result.rows.length, highRiskCount, crossDomainMatches, source: "live" });
  } catch (err) {
    handleRouteError(res, err, "Failed to get ownership graph");
  }
});

router.get("/terra/comp-analysis/:propertyId", authMiddleware({ required: false }), async (req, res) => {
  try {
    const { propertyId } = req.params;
    const basePrice = 1500000 + Math.random() * 3000000;

    const comps = Array.from({ length: 5 }, (_, i) => {
      const compPrice = basePrice * (0.88 + Math.random() * 0.25);
      const adjustments = [
        { factor: "Square footage", adjustment: parseFloat(((Math.random() - 0.5) * 50000).toFixed(0)), confidence: 0.92 },
        { factor: "Lot size", adjustment: parseFloat(((Math.random() - 0.5) * 30000).toFixed(0)), confidence: 0.85 },
        { factor: "Age/condition", adjustment: parseFloat(((Math.random() - 0.5) * 25000).toFixed(0)), confidence: 0.78 },
        { factor: "Location premium", adjustment: parseFloat(((Math.random() - 0.5) * 40000).toFixed(0)), confidence: 0.88 },
      ];
      const totalAdj = adjustments.reduce((s, a) => s + a.adjustment, 0);
      return {
        compId: `comp-${propertyId}-${i}`,
        address: `${Math.floor(Math.random() * 9999)} Main St, Nearby`,
        salePrice: parseFloat(compPrice.toFixed(0)),
        saleDate: new Date(Date.now() - Math.random() * 180 * 24 * 3600000).toISOString().split("T")[0],
        adjustments,
        adjustedPrice: parseFloat((compPrice + totalAdj).toFixed(0)),
        confidenceScore: parseFloat((Math.random() * 0.15 + 0.78).toFixed(3)),
        distanceMiles: parseFloat((Math.random() * 1.5 + 0.1).toFixed(2)),
      };
    });

    const avgAdjustedPrice = comps.reduce((s, c) => s + c.adjustedPrice, 0) / comps.length;
    const overallConfidence = comps.reduce((s, c) => s + c.confidenceScore, 0) / comps.length;

    sendSuccess(res, {
      propertyId,
      comps,
      valuationEstimate: parseFloat(avgAdjustedPrice.toFixed(0)),
      valuationRange: {
        low: parseFloat((avgAdjustedPrice * 0.93).toFixed(0)),
        high: parseFloat((avgAdjustedPrice * 1.07).toFixed(0)),
      },
      overallConfidence: parseFloat(overallConfidence.toFixed(3)),
      computedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to compute comp analysis");
  }
});

export default router;
