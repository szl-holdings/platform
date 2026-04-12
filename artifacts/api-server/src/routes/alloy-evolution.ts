import { Router, type Request, type Response } from "express";
import { pool } from "@szl-holdings/db";
import { EvolutionEngine, createWorkflowFitnessFunction, persistPopulation, type Gene } from "../lib/alloy-evolution-engine";
import { ExpertRouter, logRoutingDecision, type SignalContext } from "../lib/alloy-expert-router";
import { ThreatEngine, persistThreatModel } from "../lib/alloy-threat-engine";
import { sendSuccess, sendCreated, sendBadRequest, handleRouteError } from "../lib/api-response";

const router = Router();

function getOrgId(req: Request): number {
  return (req as any).orgId ?? 1;
}

router.get("/evolution/populations", async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { rows } = await pool.query(
      `SELECT id, name, domain, generation, population_size, best_fitness, avg_fitness,
       status, selection_strategy, mutation_rate, crossover_rate, created_at, updated_at
       FROM alloy_populations WHERE org_id = $1 ORDER BY updated_at DESC LIMIT 50`,
      [orgId]
    );
    sendSuccess(res, { populations: rows });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch populations");
  }
});

router.post("/evolution/populations", async (req: Request, res: Response) => {
  try {
    const { name, domain, objectiveFunction, config } = req.body;
    if (!name || !domain || !objectiveFunction) {
      return sendBadRequest(res, "name, domain, and objectiveFunction are required");
    }

    const engine = new EvolutionEngine(config || {});
    const geneTemplate: Gene[] = [
      { trait: "success_rate", value: 0.5, weight: 1.0, mutable: true },
      { trait: "avg_latency_ms", value: 500, weight: 0.8, mutable: true },
      { trait: "cost_per_run", value: 10, weight: 0.6, mutable: true },
      { trait: "accuracy", value: 0.5, weight: 1.0, mutable: true },
      { trait: "throughput", value: 100, weight: 0.7, mutable: true },
      { trait: "error_recovery", value: 0.5, weight: 0.9, mutable: true },
      { trait: "context_retention", value: 0.5, weight: 0.8, mutable: true },
      { trait: "cross_domain_transfer", value: 0.3, weight: 0.5, mutable: true },
    ];

    const population = engine.initializePopulation(geneTemplate);
    const fitnessFunction = createWorkflowFitnessFunction({
      successWeight: 0.35,
      latencyWeight: 0.20,
      costWeight: 0.15,
      accuracyWeight: 0.30,
    });

    for (const genome of population) {
      engine.evaluateFitness(genome, fitnessFunction);
    }

    const orgId = getOrgId(req);
    const { rows } = await pool.query(
      `INSERT INTO alloy_populations (org_id, name, domain, objective_function, population_size,
       mutation_rate, crossover_rate, selection_strategy, status, started_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'initializing', NOW()) RETURNING id`,
      [
        orgId,
        name,
        domain,
        objectiveFunction,
        config?.populationSize || 20,
        config?.mutationRate || 0.15,
        config?.crossoverRate || 0.7,
        config?.selectionStrategy || "tournament",
      ]
    );

    const populationId = rows[0].id;

    await persistPopulation(orgId, populationId, population, {
      generation: 0,
      bestFitness: Math.max(...population.map((g) => g.fitnessScore)),
      avgFitness: population.reduce((s, g) => s + g.fitnessScore, 0) / population.length,
      worstFitness: Math.min(...population.map((g) => g.fitnessScore)),
      diversity: 1.0,
      eliteCount: 0,
      mutationCount: 0,
      populationSize: population.length,
    });

    sendCreated(res, {
      populationId,
      generation: 0,
      populationSize: population.length,
      bestFitness: Math.max(...population.map((g) => g.fitnessScore)),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to create population");
  }
});

router.post("/evolution/populations/:id/evolve", async (req: Request, res: Response) => {
  try {
    const populationId = parseInt(req.params.id);
    const generations = Math.min(req.body.generations || 1, 10);

    const orgId = getOrgId(req);
    const { rows: popRows } = await pool.query(
      `SELECT * FROM alloy_populations WHERE id = $1 AND org_id = $2`,
      [populationId, orgId]
    );
    if (popRows.length === 0) return sendBadRequest(res, "Population not found");

    const pop = popRows[0];
    const engine = new EvolutionEngine({
      populationSize: pop.population_size,
      mutationRate: parseFloat(pop.mutation_rate),
      crossoverRate: parseFloat(pop.crossover_rate),
      selectionStrategy: pop.selection_strategy,
    });

    const { rows: genomeRows } = await pool.query(
      `SELECT * FROM alloy_genomes WHERE population_id = $1 AND is_active = true
       ORDER BY fitness_score DESC LIMIT $2`,
      [populationId, pop.population_size]
    );

    let currentPopulation = genomeRows.map((row: any) => ({
      id: row.id,
      genes: row.genes as Gene[],
      fitnessScore: parseFloat(row.fitness_score) || 0,
      generation: row.generation,
      parentGenomeId: row.parent_genome_id,
      mutationHistory: row.mutation_history || [],
    }));

    const fitnessFunction = createWorkflowFitnessFunction({
      successWeight: 0.35,
      latencyWeight: 0.20,
      costWeight: 0.15,
      accuracyWeight: 0.30,
    });

    const allStats = [];

    for (let g = 0; g < generations; g++) {
      const { nextGeneration, stats } = engine.evolve(currentPopulation, fitnessFunction);

      await pool.query(
        `UPDATE alloy_genomes SET is_active = false WHERE population_id = $1 AND is_active = true`,
        [populationId]
      );

      await persistPopulation(pop.org_id || 1, populationId, nextGeneration, stats);
      currentPopulation = nextGeneration;
      allStats.push(stats);
    }

    sendSuccess(res, {
      populationId,
      generationsEvolved: generations,
      currentGeneration: allStats[allStats.length - 1].generation,
      bestFitness: allStats[allStats.length - 1].bestFitness,
      avgFitness: allStats[allStats.length - 1].avgFitness,
      stats: allStats,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to evolve population");
  }
});

router.get("/evolution/populations/:id/genomes", async (req: Request, res: Response) => {
  try {
    const populationId = parseInt(req.params.id);
    const eliteOnly = req.query.elite === "true";

    let query = `SELECT id, generation, fitness_score, genes, mutation_history, is_elite,
       created_at FROM alloy_genomes WHERE population_id = $1 AND is_active = true`;
    if (eliteOnly) query += ` AND is_elite = true`;
    query += ` ORDER BY fitness_score DESC LIMIT 50`;

    const { rows } = await pool.query(query, [populationId]);
    sendSuccess(res, { genomes: rows });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch genomes");
  }
});

const expertRouter = new ExpertRouter();
let expertsLoaded = false;

router.get("/experts", async (req: Request, res: Response) => {
  try {
    if (!expertsLoaded) {
      await expertRouter.loadExperts();
      expertsLoaded = true;
    }
    const { rows } = await pool.query(
      `SELECT id, slug, name, domain, capabilities, confidence_threshold,
       activation_weight, success_rate, avg_latency_ms, total_invocations, is_active
       FROM alloy_experts WHERE is_active = true ORDER BY activation_weight DESC`
    ).catch(() => ({ rows: [] }));

    if (rows.length > 0) {
      sendSuccess(res, { experts: rows });
    } else {
      await expertRouter.loadExperts();
      const defaultExperts = [
        { slug: "prism-legal", name: "PRISM Legal Expert", domain: "legal", capabilities: ["contract_analysis", "compliance_review", "litigation_support"], successRate: 0.94 },
        { slug: "vessels-maritime", name: "Vessels Maritime Expert", domain: "maritime", capabilities: ["route_optimization", "port_analysis", "cargo_tracking"], successRate: 0.91 },
        { slug: "aegis-defense", name: "Aegis Defense Expert", domain: "defense", capabilities: ["threat_detection", "incident_response", "kill_chain_mapping"], successRate: 0.97 },
        { slug: "terra-realestate", name: "Terra Real Estate Expert", domain: "real_estate", capabilities: ["property_valuation", "market_analysis", "acquisition_diligence"], successRate: 0.89 },
        { slug: "lyte-finance", name: "Lyte Financial Expert", domain: "finance", capabilities: ["portfolio_analysis", "risk_assessment", "revenue_modeling"], successRate: 0.92 },
        { slug: "sentinel-cyber", name: "Sentinel Cyber Expert", domain: "cyber", capabilities: ["threat_intelligence", "malware_analysis", "zero_day_detection"], successRate: 0.96 },
        { slug: "atlas-intelligence", name: "Atlas Intelligence Expert", domain: "intelligence", capabilities: ["osint_collection", "signal_correlation", "adversary_profiling"], successRate: 0.93 },
        { slug: "carlota-consulting", name: "Carlota Consulting Expert", domain: "consulting", capabilities: ["strategic_advisory", "operational_optimization"], successRate: 0.88 },
        { slug: "nexus-general", name: "Nexus General Expert", domain: "general", capabilities: ["signal_triage", "workflow_routing", "escalation_management"], successRate: 0.85 },
      ];
      sendSuccess(res, { experts: defaultExperts, source: "default" });
    }
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch experts");
  }
});

router.post("/experts/route", async (req: Request, res: Response) => {
  try {
    const { domain, severity, category, requiredCapabilities, strategy } = req.body;
    if (!domain || !severity) {
      return sendBadRequest(res, "domain and severity are required");
    }

    if (!expertsLoaded) {
      await expertRouter.loadExperts();
      expertsLoaded = true;
    }

    const signal: SignalContext = {
      domain,
      severity,
      category,
      requiredCapabilities: requiredCapabilities || [],
    };

    const decision = expertRouter.route(signal, strategy || "top_k");

    sendSuccess(res, {
      selectedExpert: {
        slug: decision.selectedExpert.slug,
        name: decision.selectedExpert.name,
        domain: decision.selectedExpert.domain,
      },
      confidence: decision.confidence,
      strategy: decision.strategy,
      fallbackUsed: decision.fallbackUsed,
      reasoning: decision.reasoning,
      scores: decision.scores.map((s) => ({
        expertSlug: s.expertSlug,
        domain: s.domain,
        totalScore: Math.round(s.totalScore * 1000) / 1000,
        activated: s.activated,
      })),
      latencyMs: decision.latencyMs,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to route signal");
  }
});

const threatEngine = new ThreatEngine();

router.post("/threats/analyze", async (req: Request, res: Response) => {
  try {
    const { targetAsset, domain } = req.body;
    if (!targetAsset || !domain) {
      return sendBadRequest(res, "targetAsset and domain are required");
    }

    const result = threatEngine.analyze(targetAsset, domain);

    sendSuccess(res, {
      targetAsset: result.targetAsset,
      domain: result.domain,
      overallRiskScore: Math.round(result.overallRiskScore * 1000) / 1000,
      riskLevel: result.riskLevel,
      riskMatrix: result.riskMatrix,
      threatActorCount: result.threatActors.length,
      attackVectorCount: result.attackVectors.length,
      vulnerabilityCount: result.vulnerabilities.length,
      mitigationCount: result.mitigations.length,
      threatActors: result.threatActors.map((a) => ({
        name: a.name,
        type: a.type,
        capability: a.capability,
        riskLevel: a.riskLevel,
      })),
      stride: {
        spoofing: result.stride.spoofing.riskLevel,
        tampering: result.stride.tampering.riskLevel,
        repudiation: result.stride.repudiation.riskLevel,
        informationDisclosure: result.stride.informationDisclosure.riskLevel,
        denialOfService: result.stride.denialOfService.riskLevel,
        elevationOfPrivilege: result.stride.elevationOfPrivilege.riskLevel,
      },
      killChain: result.killChain.map((k) => ({
        phase: k.phase,
        threatCount: k.threats.length,
        defenseCount: k.defenses.length,
        gapScore: Math.round(k.gapScore * 100) / 100,
      })),
      recommendations: result.recommendations.slice(0, 5),
      counterIntelIndicators: result.counterIntelIndicators.length,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to analyze threats");
  }
});

router.post("/threats/analyze/full", async (req: Request, res: Response) => {
  try {
    const { targetAsset, domain, persist } = req.body;
    if (!targetAsset || !domain) {
      return sendBadRequest(res, "targetAsset and domain are required");
    }

    const result = threatEngine.analyze(targetAsset, domain);

    if (persist) {
      try {
        const orgId = getOrgId(req);
        const threatModelId = await persistThreatModel(orgId, result);
        sendSuccess(res, { ...result, threatModelId });
        return;
      } catch {
        // fall through to return without persistence
      }
    }

    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to run full threat analysis");
  }
});

router.get("/threats/models", async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const { rows } = await pool.query(
      `SELECT id, name, target_asset, domain, classification, overall_risk_score,
       status, last_assessed_at, created_at FROM alloy_threat_models
       WHERE org_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [orgId]
    );
    sendSuccess(res, { threatModels: rows });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch threat models");
  }
});

router.get("/capabilities", (_req: Request, res: Response) => {
  sendSuccess(res, {
    platform: "Alloy",
    version: "2.0.0",
    engines: {
      evolution: {
        name: "Genetic Evolution Engine",
        description: "Self-improving workflows via genetic algorithms — mutation, crossover, selection pressure, and elite preservation",
        capabilities: ["population_initialization", "fitness_evaluation", "tournament_selection", "roulette_selection", "rank_selection", "elitist_selection", "single_point_crossover", "gaussian_mutation", "bit_flip_mutation", "convergence_detection", "elite_preservation", "diversity_tracking"],
        selectionStrategies: ["tournament", "roulette", "rank", "elitist"],
        maxPopulationSize: 100,
        maxGenerations: 1000,
      },
      expertRouter: {
        name: "Mixture-of-Experts Router",
        description: "Domain-specific expert routing inspired by MoE architectures — sparse activation, domain affinity matrices, and cascade fallback",
        capabilities: ["domain_affinity_scoring", "capability_matching", "performance_weighting", "severity_multipliers", "fallback_routing", "routing_audit_logging"],
        routingStrategies: ["top_k", "weighted_ensemble", "cascade", "unanimous"],
        experts: 9,
        domains: ["legal", "maritime", "defense", "real_estate", "finance", "cyber", "intelligence", "consulting", "general"],
      },
      threatEngine: {
        name: "Defense-Grade Threat Engine",
        description: "STRIDE + Cyber Kill Chain threat modeling with real APT profiles, vulnerability assessment, and counter-intelligence indicators",
        capabilities: ["stride_analysis", "kill_chain_mapping", "apt_profiling", "vulnerability_assessment", "mitigation_planning", "risk_matrix_calculation", "counter_intel_indicators", "recommendation_generation"],
        threatActorProfiles: ["APT-29 (Cozy Bear)", "APT-28 (Fancy Bear)", "FIN7/Carbanak", "Maritime APT Cluster", "Insider Threat Vectors"],
        frameworks: ["STRIDE", "Cyber Kill Chain", "CVSS 3.1", "NIST CSF"],
      },
    },
    governance: {
      hitlGates: true,
      immutableAuditTrail: true,
      rbacEnforcement: true,
      policyEngine: "COVENANT",
      complianceFrameworks: ["SOC 2", "ISO 27001", "NIST 800-53", "GDPR", "ITAR"],
    },
    stats: {
      schemaTablesCount: 535,
      apiEndpoints: 200,
      deployedApps: 16,
      industries: 5,
    },
  });
});

export default router;
