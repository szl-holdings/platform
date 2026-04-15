import { Router, type IRouter } from "express";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
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

export default router;
