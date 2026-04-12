import { Router, type Request, type Response } from "express";
import { pool } from "@szl-holdings/db";
import { EvolutionEngine, createWorkflowFitnessFunction, persistPopulation, type Gene } from "../lib/alloy-evolution-engine";
import { ExpertRouter, logRoutingDecision, type SignalContext } from "../lib/alloy-expert-router";
import { ThreatEngine, persistThreatModel } from "../lib/alloy-threat-engine";
import { authMiddleware, AuthenticatedUser } from "../middlewares/auth";
import { sendSuccess, sendCreated, sendBadRequest, handleRouteError } from "../lib/api-response";
import {
  detectCapabilityGaps,
  getStoredCapabilityGaps,
  updateGapStatus,
  ensureCapabilityGapsTable,
} from "../lib/capability-gap-detector";
import {
  synthesizeProposalsFromGaps,
  generateAIProposals,
  getStoredProposals,
  persistProposals,
  updateProposalStatus,
  generateEcosystemAlerts,
  ensureProposalsTable,
} from "../lib/innovation-proposal-engine";
import {
  recordLearningEvent,
  recordUserFeedback,
  recordProposalAction,
  getLearningAggregates,
  computeBehaviorUpdate,
  ensureLearningTable,
} from "../lib/adaptive-learning-recorder";
import { executeWithFourLanes } from "../lib/four-lane-coordinator";

const router = Router();

function getOrgId(req: Request): number {
  return (req as { orgId?: number }).orgId ?? 1;
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

router.post("/evolution/populations", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { name, domain, objectiveFunction, config, orgId: bodyOrgId } = req.body;
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

router.post("/evolution/populations/:id/evolve", authMiddleware(), async (req: Request, res: Response) => {
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

    interface GenomeRow {
      id: number;
      genes: Gene[];
      fitness_score: string;
      generation: number;
      parent_genome_id: number | null;
      mutation_history: import("../lib/alloy-evolution-engine").MutationRecord[];
      is_elite: boolean;
    }
    let currentPopulation = (genomeRows as GenomeRow[]).map((row) => ({
      id: row.id,
      genes: row.genes,
      fitnessScore: parseFloat(row.fitness_score) || 0,
      generation: row.generation,
      parentGenomeId: row.parent_genome_id ?? undefined,
      mutationHistory: row.mutation_history || [],
      isElite: row.is_elite,
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

      await persistPopulation(orgId, populationId, nextGeneration, stats);
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

router.get("/evolution/populations/:id/genomes", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const populationId = parseInt(req.params.id);
    const eliteOnly = req.query.elite === "true";

    const orgId = getOrgId(req);
    const { rows: popRows } = await pool.query(
      `SELECT org_id FROM alloy_populations WHERE id = $1 AND org_id = $2`,
      [populationId, orgId]
    );
    if (popRows.length === 0) return sendBadRequest(res, "Population not found");
    
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

router.get("/experts", authMiddleware(), async (req: Request, res: Response) => {
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

router.post("/experts/route", authMiddleware(), async (req: Request, res: Response) => {
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

router.post("/threats/analyze", authMiddleware(), async (req: Request, res: Response) => {
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

router.post("/threats/analyze/full", authMiddleware(), async (req: Request, res: Response) => {
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

router.get("/threats/models", authMiddleware(), async (req: Request, res: Response) => {
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

// ─── Capability Gap Detector ──────────────────────────────────────────────────

router.get("/gaps", async (req: Request, res: Response) => {
  try {
    await ensureCapabilityGapsTable();
    const { status, severity, domain, limit } = req.query;
    const gaps = await getStoredCapabilityGaps({
      status: status as string | undefined,
      severity: severity as string | undefined,
      domain: domain as string | undefined,
      limit: limit ? parseInt(String(limit)) : 30,
    });
    sendSuccess(res, { gaps, count: gaps.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch capability gaps");
  }
});

router.post("/gaps/detect", authMiddleware(), async (_req: Request, res: Response) => {
  try {
    const windowHours = parseInt(String(_req.body?.windowHours)) || 48;
    const result = await detectCapabilityGaps(windowHours);
    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to run gap detection");
  }
});

router.patch("/gaps/:id/status", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const gapId = parseInt(req.params.id);
    const { status } = req.body;
    if (!["open", "acknowledged", "resolved"].includes(status)) {
      return sendBadRequest(res, "status must be open, acknowledged, or resolved");
    }
    await updateGapStatus(gapId, status);
    sendSuccess(res, { updated: true, gapId, status });
  } catch (err) {
    handleRouteError(res, err, "Failed to update gap status");
  }
});

// ─── Innovation Proposal Engine ───────────────────────────────────────────────

router.get("/proposals", async (req: Request, res: Response) => {
  try {
    await ensureProposalsTable();
    const { status, proposalType, venture, limit } = req.query;
    const proposals = await getStoredProposals({
      status: status as string | undefined,
      proposalType: proposalType as string | undefined,
      venture: venture as string | undefined,
      limit: limit ? parseInt(String(limit)) : 30,
    });
    sendSuccess(res, { proposals, count: proposals.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch innovation proposals");
  }
});

router.post("/proposals/generate", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const windowHours = parseInt(String(req.body?.windowHours)) || 48;
    const useAI = req.body?.useAI !== false;

    const gapResult = await detectCapabilityGaps(windowHours);
    const ruleBasedProposals = synthesizeProposalsFromGaps(gapResult.gaps);

    let aiProposals: ReturnType<typeof synthesizeProposalsFromGaps> = [];
    if (useAI && gapResult.gaps.length > 0) {
      try {
        const latest = await pool.query(
          `SELECT generation, best_fitness, avg_fitness FROM alloy_populations ORDER BY updated_at DESC LIMIT 1`
        );
        const evolutionStats = latest.rows[0] ? {
          generation: latest.rows[0].generation,
          bestFitness: parseFloat(latest.rows[0].best_fitness) || 0,
          avgFitness: parseFloat(latest.rows[0].avg_fitness) || 0,
        } : undefined;

        aiProposals = await generateAIProposals(gapResult.gaps, evolutionStats);
      } catch {
        aiProposals = [];
      }
    }

    const allProposals = [...ruleBasedProposals, ...aiProposals];
    const ids = await persistProposals(allProposals);

    sendSuccess(res, {
      proposalsGenerated: allProposals.length,
      ruleBasedCount: ruleBasedProposals.length,
      aiGeneratedCount: aiProposals.length,
      gapsAnalyzed: gapResult.gapsDetected,
      proposals: allProposals.map((p, i) => ({ ...p, id: ids[i] })),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to generate innovation proposals");
  }
});

router.post("/proposals/:id/approve", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const proposalId = parseInt(req.params.id);
    const userId = req.user?.id;

    await updateProposalStatus(proposalId, "approved", { userId });
    await recordProposalAction({ proposalId, action: "approved", userId, proposalType: req.body?.proposalType });

    sendSuccess(res, { approved: true, proposalId });
  } catch (err) {
    handleRouteError(res, err, "Failed to approve proposal");
  }
});

router.post("/proposals/:id/dismiss", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const proposalId = parseInt(req.params.id);
    const userId = req.user?.id;
    const { reason } = req.body;

    await updateProposalStatus(proposalId, "dismissed", { userId, dismissedReason: reason });
    await recordProposalAction({ proposalId, action: "dismissed", userId, proposalType: req.body?.proposalType });

    sendSuccess(res, { dismissed: true, proposalId });
  } catch (err) {
    handleRouteError(res, err, "Failed to dismiss proposal");
  }
});

// ─── Adaptive Learning Recorder ───────────────────────────────────────────────

router.get("/learning/aggregates", async (req: Request, res: Response) => {
  try {
    await ensureLearningTable();
    const windowHours = parseInt(String(req.query.windowHours)) || 168;
    const aggregates = await getLearningAggregates(windowHours);
    sendSuccess(res, aggregates);
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch learning aggregates");
  }
});

router.get("/learning/behavior-update", async (req: Request, res: Response) => {
  try {
    const windowHours = parseInt(String(req.query.windowHours)) || 48;

    const latest = await pool.query(
      `SELECT generation FROM alloy_populations ORDER BY updated_at DESC LIMIT 1`
    ).catch(() => ({ rows: [] }));
    const currentGeneration = latest.rows[0]?.generation ?? 0;

    const update = await computeBehaviorUpdate(currentGeneration, windowHours);
    sendSuccess(res, update);
  } catch (err) {
    handleRouteError(res, err, "Failed to compute behavior update");
  }
});

router.post("/learning/feedback", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { agentId, domain, sessionId, feedback, satisfaction, comment } = req.body;
    if (!feedback || !["positive", "negative", "neutral"].includes(feedback)) {
      return sendBadRequest(res, "feedback must be positive, negative, or neutral");
    }
    await recordUserFeedback({ agentId, domain, sessionId, feedback, satisfaction, comment });
    sendSuccess(res, { recorded: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to record feedback");
  }
});

router.post("/learning/event", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { eventType, agentId, domain, runId, latencyMs, tokensUsed, successScore, toolsUsed, metadata } = req.body;
    if (!eventType) return sendBadRequest(res, "eventType is required");

    await recordLearningEvent({
      eventType,
      agentId,
      domain,
      runId,
      latencyMs,
      tokensUsed,
      successScore,
      toolsUsed: toolsUsed || [],
      metadata: metadata || {},
    });
    sendSuccess(res, { recorded: true });
  } catch (err) {
    handleRouteError(res, err, "Failed to record learning event");
  }
});

// ─── Four-Lane Coordinator ────────────────────────────────────────────────────

router.post("/four-lane/execute", authMiddleware(), async (req: Request, res: Response) => {
  try {
    const { query, agentId, domain, context, enableRAG, enableMCP, enableA2A } = req.body;
    if (!query || !agentId) return sendBadRequest(res, "query and agentId are required");

    const result = await executeWithFourLanes({
      query,
      agentId,
      domain: domain || "general",
      context,
      enableRAG: enableRAG !== false,
      enableMCP: enableMCP !== false,
      enableA2A: enableA2A !== false,
    });

    sendSuccess(res, result);
  } catch (err) {
    handleRouteError(res, err, "Failed to execute four-lane query");
  }
});

// ─── Evolution Audit Trail ────────────────────────────────────────────────────

interface EvolutionEventRow { id: string; population_name: string; domain: string; created_at: string; details?: Record<string, unknown>; generation?: number; }
interface PopHistoryRow { generation: number; best_fitness: string; avg_fitness: string; worst_fitness: string; fitness_history: unknown; updated_at: string; }
interface ProposalHistoryRow { id: number; title: string; proposal_type: string; estimated_impact: string; status: string; affected_ventures: string[]; confidence_score: number; generated_at: string; approved_at?: string; dismissed_reason?: string; }

router.get("/evolution/audit-trail", async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);
    const limit = parseInt(String(req.query.limit)) || 50;
    const windowHours = parseInt(String(req.query.windowHours)) || 720;

    const [evolutionEvents, learningAggregates, populationHistory, proposalHistory] = await Promise.all([
      pool.query<EvolutionEventRow>(
        `SELECT e.*, p.name as population_name, p.domain
         FROM alloy_evolution_events e
         LEFT JOIN alloy_populations p ON e.population_id = p.id
         WHERE p.org_id = $1
           AND e.created_at > NOW() - INTERVAL '1 hour' * $2
         ORDER BY e.created_at DESC LIMIT $3`,
        [orgId, windowHours, limit]
      ).catch(() => ({ rows: [] as EvolutionEventRow[] })),
      getLearningAggregates(windowHours),
      pool.query<PopHistoryRow>(
        `SELECT generation, best_fitness, avg_fitness, worst_fitness,
                fitness_history, updated_at
         FROM alloy_populations
         WHERE org_id = $1
         ORDER BY updated_at DESC LIMIT 10`,
        [orgId]
      ).catch(() => ({ rows: [] as PopHistoryRow[] })),
      pool.query<ProposalHistoryRow>(
        `SELECT id, title, proposal_type, estimated_impact, status,
                affected_ventures, confidence_score, generated_at, approved_at, dismissed_reason
         FROM alloy_innovation_proposals
         WHERE status IN ('approved', 'dismissed')
         ORDER BY COALESCE(approved_at, generated_at) DESC LIMIT 20`
      ).catch(() => ({ rows: [] as ProposalHistoryRow[] })),
    ]);

    const timelineEvents: Array<{
      id: string;
      type: string;
      timestamp: string;
      title: string;
      description: string;
      before?: Record<string, unknown>;
      after?: Record<string, unknown>;
      metrics?: Record<string, unknown>;
    }> = [];

    for (const event of evolutionEvents.rows) {
      const details = event.details || {};
      timelineEvents.push({
        id: `evo_${event.id}`,
        type: "evolution_cycle",
        timestamp: event.created_at,
        title: `Generation ${details.generation || event.generation} complete — ${event.population_name || event.domain}`,
        description: `Evolution cycle completed. Best fitness: ${(details.bestFitness || 0).toFixed(3)}, Avg: ${(details.avgFitness || 0).toFixed(3)}, Mutations: ${details.mutationCount || 0}`,
        after: {
          generation: details.generation,
          bestFitness: details.bestFitness,
          avgFitness: details.avgFitness,
          diversity: details.diversity,
        },
        metrics: {
          populationSize: details.populationSize,
          mutationCount: details.mutationCount,
          eliteCount: details.eliteCount,
        },
      });
    }

    for (const proposal of proposalHistory.rows) {
      timelineEvents.push({
        id: `prop_${proposal.id}`,
        type: proposal.status === "approved" ? "proposal_approved" : "proposal_dismissed",
        timestamp: proposal.approved_at || proposal.generated_at,
        title: `Proposal ${proposal.status}: ${proposal.title}`,
        description: proposal.status === "approved"
          ? `Innovation proposal approved. Impact: ${proposal.estimated_impact}. Ventures: ${(proposal.affected_ventures || []).join(", ")}`
          : `Proposal dismissed: ${proposal.dismissed_reason || "No reason provided"}`,
        metrics: {
          impact: proposal.estimated_impact,
          confidence: proposal.confidence_score,
          type: proposal.proposal_type,
        },
      });
    }

    timelineEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const populationRows = populationHistory.rows;
    const performanceDeltas = populationRows.length >= 2
      ? {
          bestFitnessDelta: parseFloat(populationRows[0]?.best_fitness) - parseFloat(populationRows[populationRows.length - 1]?.best_fitness),
          avgFitnessDelta: parseFloat(populationRows[0]?.avg_fitness) - parseFloat(populationRows[populationRows.length - 1]?.avg_fitness),
          generationsElapsed: populationRows.length,
        }
      : null;

    sendSuccess(res, {
      timeline: timelineEvents.slice(0, limit),
      totalEvents: timelineEvents.length,
      performanceDeltas,
      learningAggregates,
      populationSummary: populationRows.map(p => ({
        generation: p.generation,
        bestFitness: parseFloat(p.best_fitness),
        avgFitness: parseFloat(p.avg_fitness),
        updatedAt: p.updated_at,
      })),
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch evolution audit trail");
  }
});

// ─── Ecosystem Alerts ─────────────────────────────────────────────────────────

router.get("/ecosystem/alerts", async (req: Request, res: Response) => {
  try {
    const windowHours = parseInt(String(req.query.windowHours)) || 72;

    interface AgentPerfRow { agent_id: string; domain: string; success_rate: string; avg_latency: string; }
    const agentPerf = await pool.query<AgentPerfRow>(
      `SELECT agent_id, domain,
              AVG(success_score) as success_rate,
              AVG(latency_ms) as avg_latency
       FROM alloy_learning_records
       WHERE recorded_at > NOW() - INTERVAL '1 hour' * $1
         AND event_type = 'agent_execution'
         AND agent_id IS NOT NULL
       GROUP BY agent_id, domain
       HAVING COUNT(*) >= 3`,
      [windowHours]
    ).catch(() => ({ rows: [] as AgentPerfRow[] }));

    const perfData: Record<string, { successRate: number; avgLatency: number; domain: string }> = {};
    for (const row of agentPerf.rows) {
      perfData[row.agent_id] = {
        successRate: parseFloat(row.success_rate) || 0,
        avgLatency: parseFloat(row.avg_latency) || 0,
        domain: row.domain || "unknown",
      };
    }

    const alerts = generateEcosystemAlerts(perfData);

    const staticAlerts = [
      {
        alertType: "missed_synergy" as const,
        title: "Terra and Carlota Jo have overlapping property intelligence",
        message: "Terra (real estate) and Carlota Jo (advisory) are independently analyzing property-related signals with no shared context. A Mesh connection would allow Terra's market data to inform Carlota Jo's client advisory recommendations.",
        severity: "medium" as const,
        affectedApps: ["terra", "carlota-jo"],
        recommendation: "Add a Terra → Carlota Jo Mesh connection sharing property market signals and deal flow data.",
        generatedAt: new Date().toISOString(),
        isRead: false,
      },
    ];

    sendSuccess(res, { alerts: [...alerts, ...staticAlerts], count: alerts.length + staticAlerts.length });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch ecosystem alerts");
  }
});

// ─── Innovation Radar Dashboard ───────────────────────────────────────────────

router.get("/evolution/radar", async (req: Request, res: Response) => {
  try {
    const orgId = getOrgId(req);

    const [proposals, gaps, learningAgg, population] = await Promise.all([
      getStoredProposals({ limit: 20 }),
      getStoredCapabilityGaps({ status: "open", limit: 20 }),
      getLearningAggregates(168),
      pool.query<{ generation: number; best_fitness: string; avg_fitness: string; status: string; name: string; domain: string; updated_at: string }>(
        `SELECT generation, best_fitness, avg_fitness, status, name, domain, updated_at
         FROM alloy_populations WHERE org_id = $1 ORDER BY updated_at DESC LIMIT 1`,
        [orgId]
      ).catch(() => ({ rows: [] as Array<{ generation: number; best_fitness: string; avg_fitness: string; status: string; name: string; domain: string; updated_at: string }> })),
    ]);

    const popRow = population.rows[0];

    const gapHeatmap: Record<string, { gapCount: number; severity: string; topGap?: string }> = {};
    for (const gap of gaps) {
      for (const domain of gap.affectedDomains) {
        const venture = domainToVenture(domain);
        if (!gapHeatmap[venture]) gapHeatmap[venture] = { gapCount: 0, severity: "low" };
        gapHeatmap[venture].gapCount++;
        if (!gapHeatmap[venture].topGap) gapHeatmap[venture].topGap = gap.title;
        if (gap.severity === "critical") gapHeatmap[venture].severity = "critical";
        else if (gap.severity === "high" && gapHeatmap[venture].severity !== "critical") gapHeatmap[venture].severity = "high";
        else if (gap.severity === "medium" && gapHeatmap[venture].severity === "low") gapHeatmap[venture].severity = "medium";
      }
    }

    sendSuccess(res, {
      proposals,
      gapHeatmap,
      openGapCount: gaps.length,
      learningAggregates: learningAgg,
      evolutionStatus: popRow ? {
        generation: popRow.generation,
        bestFitness: parseFloat(popRow.best_fitness),
        avgFitness: parseFloat(popRow.avg_fitness),
        status: popRow.status,
        domain: popRow.domain,
        lastEvolved: popRow.updated_at,
      } : null,
    });
  } catch (err) {
    handleRouteError(res, err, "Failed to fetch evolution radar");
  }
});

function domainToVenture(domain: string): string {
  const map: Record<string, string> = {
    maritime: "vessels",
    defense: "aegis",
    cyber: "aegis",
    intelligence: "aegis",
    real_estate: "terra",
    legal: "prism",
    finance: "lyte",
    consulting: "carlota-jo",
    general: "szl-holdings",
  };
  return map[domain] || domain;
}

router.get("/capabilities", authMiddleware(), (_req: Request, res: Response) => {
  sendSuccess(res, {
    platform: "Alloy",
    version: "3.0.0",
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
