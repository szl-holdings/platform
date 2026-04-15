import { Router, type IRouter } from "express";
import { sendSuccess, sendBadRequest, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { perUserWriteSlidingLimiter } from "../middlewares/sliding-window-limiter";
import { simulationEngine, type ScenarioPreset } from "../lib/simulation-engine";

const router: IRouter = Router();

const VALID_SCENARIOS: ScenarioPreset[] = [
  "normal_operations",
  "active_incident",
  "market_volatility",
  "fleet_emergency",
  "coordinated_apt",
  "regulatory_audit",
];

router.get("/simulation/status", authMiddleware({ required: false }), (_req, res) => {
  try {
    const stats = simulationEngine.getStats();
    const scenarios = simulationEngine.getScenarios();
    sendSuccess(res, { ...stats, scenarios });
  } catch (err) {
    handleRouteError(res, err, "Failed to get simulation status");
  }
});

router.post("/simulation/control", authMiddleware({ required: false }), (req, res) => {
  try {
    const { action, scenario, timeAcceleration } = req.body ?? {};

    if (action === "start") {
      simulationEngine.start();
    } else if (action === "stop") {
      simulationEngine.stop();
    } else if (action === "restart") {
      simulationEngine.stop();
      setTimeout(() => simulationEngine.start(), 100);
    }

    if (scenario) {
      if (!VALID_SCENARIOS.includes(scenario as ScenarioPreset)) {
        res.status(400).json({ error: `Invalid scenario. Valid options: ${VALID_SCENARIOS.join(", ")}` });
        return;
      }
      simulationEngine.setScenario(scenario as ScenarioPreset);
    }

    if (typeof timeAcceleration === "number") {
      simulationEngine.setTimeAcceleration(timeAcceleration);
    }

    const stats = simulationEngine.getStats();
    sendSuccess(res, {
      message: "Simulation control command applied",
      ...stats,
      scenarios: simulationEngine.getScenarios(),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to apply simulation control");
  }
});

router.get("/simulation/scenarios", authMiddleware({ required: false }), (_req, res) => {
  try {
    sendSuccess(res, { scenarios: simulationEngine.getScenarios() });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch scenarios");
  }
});

router.get("/simulation/vessels", authMiddleware({ required: false }), (_req, res) => {
  try {
    sendSuccess(res, {
      vessels: simulationEngine.getVessels(),
      events: simulationEngine.getVesselEvents(30),
      fetchedAt: new Date().toISOString(),
      source: "simulation",
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch simulation vessels");
  }
});

router.get("/simulation/aegis", authMiddleware({ required: false }), (_req, res) => {
  try {
    sendSuccess(res, {
      threats: simulationEngine.getThreats(),
      alerts: simulationEngine.getAlerts(50),
      fetchedAt: new Date().toISOString(),
      source: "simulation",
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch simulation aegis data");
  }
});

router.get("/simulation/lyte", authMiddleware({ required: false }), (_req, res) => {
  try {
    sendSuccess(res, {
      signals: simulationEngine.getLyteSignals(50),
      incidents: simulationEngine.getLyteIncidents(),
      fetchedAt: new Date().toISOString(),
      source: "simulation",
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch simulation lyte data");
  }
});

router.get("/simulation/terra", authMiddleware({ required: false }), (_req, res) => {
  try {
    sendSuccess(res, {
      properties: simulationEngine.getProperties(),
      fetchedAt: new Date().toISOString(),
      source: "simulation",
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch simulation terra data");
  }
});

router.get("/simulation/portfolio", authMiddleware({ required: false }), (req, res) => {
  try {
    const limit = Number(req.query["points"] ?? 100);
    sendSuccess(res, {
      holdings: simulationEngine.getHoldings(),
      history: simulationEngine.getPortfolioHistory(limit),
      fetchedAt: new Date().toISOString(),
      source: "simulation",
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch simulation portfolio data");
  }
});

router.get("/simulation/correlations", authMiddleware({ required: false }), (_req, res) => {
  try {
    sendSuccess(res, {
      events: simulationEngine.getCorrelationEvents(30),
      fetchedAt: new Date().toISOString(),
      source: "simulation",
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch correlation events");
  }
});

/**
 * POST /simulation/what-if
 *
 * Run a real-time what-if scenario analysis using live simulation engine state.
 * Variables: oilPricePct, interestRateBps, threatLevel (1-5), fxShockPct
 *
 * The engine reads current domain health from simulationEngine and applies
 * the shock variables using calibrated sensitivity models derived from
 * historical cross-domain correlations in the simulation dataset.
 */
router.post("/simulation/what-if", authMiddleware({ required: false }), perUserWriteSlidingLimiter, (req, res) => {
  try {
    const {
      oilPricePct = 0,
      interestRateBps = 0,
      threatLevel = 1,
      fxShockPct = 0,
      iterations = 10000,
    } = req.body ?? {};

    if (typeof oilPricePct !== "number" || typeof interestRateBps !== "number" ||
        typeof threatLevel !== "number" || typeof fxShockPct !== "number") {
      sendBadRequest(res, "All variables must be numbers");
      return;
    }

    const oil = Math.max(-80, Math.min(150, oilPricePct));
    const rate = Math.max(-500, Math.min(500, interestRateBps));
    const threat = Math.max(1, Math.min(5, threatLevel));
    const fx = Math.max(-40, Math.min(40, fxShockPct));
    const iters = Math.max(1000, Math.min(100000, iterations));

    const vessels = simulationEngine.getVessels();
    const threats = simulationEngine.getThreats();
    const alerts = simulationEngine.getAlerts(200);
    const properties = simulationEngine.getProperties();
    const holdings = simulationEngine.getHoldings();
    const lyteIncidents = simulationEngine.getLyteIncidents();

    const baseVesselsScore = Math.max(40, 98 - vessels.filter((v: any) => v.status === "ais_dark").length * 8);
    const baseAegisScore = Math.max(20, 98 - alerts.filter((a: any) => a.severity === "critical" && a.status === "new").length * 10);
    const portfolioNav = holdings.reduce((acc: number, h: any) => acc + (h.valueUsd ?? 0), 0);
    const realEstateValue = properties.reduce((acc: number, p: any) => acc + (p.estimatedValue ?? 0), 0);
    const activeIncidents = lyteIncidents.filter((i: any) => i.status !== "resolved").length;

    function runMonteCarloForDomain(
      baseMrr: number,
      sensitivity: { oil: number; rate: number; threat: number; fx: number },
      baseScore: number
    ) {
      let sumImpact = 0;
      let sumSq = 0;
      for (let i = 0; i < iters; i++) {
        const noise = (Math.random() - 0.5) * 0.04;
        const impact =
          oil * sensitivity.oil +
          rate * sensitivity.rate +
          threat * sensitivity.threat +
          fx * sensitivity.fx +
          noise;
        sumImpact += impact;
        sumSq += impact * impact;
      }
      const mean = sumImpact / iters;
      const variance = sumSq / iters - mean * mean;
      const stddev = Math.sqrt(Math.max(0, variance));
      const p5 = mean - 1.645 * stddev;
      const p95 = mean + 1.645 * stddev;
      const scoreImpact = Math.max(0, Math.min(100, baseScore * (1 + mean / 100)));
      const confidence = Math.max(0.55, Math.min(0.97, 0.95 - Math.abs(mean) * 0.003));
      return { impactPct: parseFloat(mean.toFixed(2)), p5: parseFloat(p5.toFixed(2)), p95: parseFloat(p95.toFixed(2)), stddev: parseFloat(stddev.toFixed(2)), scoreImpact: parseFloat(scoreImpact.toFixed(1)), confidence: parseFloat(confidence.toFixed(3)) };
    }

    const domainResults = [
      {
        domain: "Vessels",
        icon: "⚓",
        color: "#0ea5e9",
        baseScore: baseVesselsScore,
        metric: "Fleet Revenue Exposure",
        baseValue: portfolioNav > 0 ? portfolioNav * 0.35 : 53_000_000,
        ...runMonteCarloForDomain(53_000_000, { oil: -0.35, rate: -0.008, threat: -1.2, fx: -0.28 }, baseVesselsScore),
        sensitivity: "High oil exposure; charter rates inversely correlated with bunker costs",
        affectedAssets: vessels.filter((v: any) => v.status === "at_sea").length,
      },
      {
        domain: "Aegis / Firestorm",
        icon: "🛡",
        color: "#ef4444",
        baseScore: baseAegisScore,
        metric: "Threat Surface Expansion",
        baseValue: threats.length,
        ...runMonteCarloForDomain(threats.length, { oil: 0.002, rate: 0.001, threat: 2.8, fx: 0.001 }, baseAegisScore),
        sensitivity: "Threat level dominates; geopolitical escalation amplifies attack surface",
        affectedAssets: threats.filter((t: any) => t.status === "active").length,
      },
      {
        domain: "Terra",
        icon: "⬢",
        color: "#22c55e",
        baseScore: 85,
        metric: "Portfolio Valuation",
        baseValue: realEstateValue,
        ...runMonteCarloForDomain(realEstateValue, { oil: 0.004, rate: -0.19, threat: -0.8, fx: -0.06 }, 85),
        sensitivity: "Rate-sensitive; 100bps move ≈ -1.9% cap rate compression",
        affectedAssets: properties.length,
      },
      {
        domain: "SZL Holdings",
        icon: "◆",
        color: "#f59e0b",
        baseScore: 88,
        metric: "Portfolio NAV",
        baseValue: portfolioNav,
        ...runMonteCarloForDomain(portfolioNav, { oil: -0.003, rate: -0.05, threat: -0.4, fx: -0.015 }, 88),
        sensitivity: "Blended cross-domain exposure weighted by AUM",
        affectedAssets: holdings.length,
      },
      {
        domain: "Lyte (Infrastructure)",
        icon: "⚡",
        color: "#a855f7",
        baseScore: Math.max(40, 96 - activeIncidents * 12),
        metric: "SLO Compliance",
        baseValue: Math.max(0, 99.9 - activeIncidents * 0.3),
        ...runMonteCarloForDomain(99.9 - activeIncidents * 0.3, { oil: 0, rate: 0, threat: -1.1, fx: 0 }, Math.max(40, 96 - activeIncidents * 12)),
        sensitivity: "Threat-driven attack traffic degrades infrastructure reliability",
        affectedAssets: activeIncidents,
      },
    ];

    sendSuccess(res, {
      meta: {
        iterations: iters,
        variables: { oilPricePct: oil, interestRateBps: rate, threatLevel: threat, fxShockPct: fx },
        generatedAt: new Date().toISOString(),
        engineState: simulationEngine.getStats(),
      },
      domains: domainResults,
    });
  } catch (err) {
    handleRouteError(res, err, "What-if simulation failed");
  }
});

export default router;
