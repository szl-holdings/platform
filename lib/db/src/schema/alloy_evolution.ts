import { pgTable, text, serial, timestamp, integer, real, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { organizationsTable } from "./organizations";
import { usersTable } from "./auth";

export const alloyExpertsTable = pgTable("alloy_experts", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  domain: text("domain", {
    enum: ["legal", "maritime", "defense", "real_estate", "finance", "cyber", "intelligence", "consulting", "general"],
  }).notNull(),
  version: integer("version").notNull().default(1),
  description: text("description"),
  capabilities: jsonb("capabilities").notNull().default([]),
  routingRules: jsonb("routing_rules").notNull().default({}),
  confidenceThreshold: real("confidence_threshold").notNull().default(0.7),
  activationWeight: real("activation_weight").notNull().default(1.0),
  totalInvocations: integer("total_invocations").notNull().default(0),
  successRate: real("success_rate").notNull().default(0),
  avgLatencyMs: integer("avg_latency_ms").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  parentExpertId: integer("parent_expert_id"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("alloy_experts_org_idx").on(t.orgId),
  index("alloy_experts_domain_idx").on(t.domain),
  index("alloy_experts_slug_idx").on(t.slug),
  index("alloy_experts_active_idx").on(t.isActive),
]);

export const alloyGenomesTable = pgTable("alloy_genomes", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  populationId: integer("population_id"),
  generation: integer("generation").notNull().default(0),
  parentGenomeId: integer("parent_genome_id"),
  genes: jsonb("genes").notNull(),
  phenotype: jsonb("phenotype").notNull().default({}),
  fitnessScore: real("fitness_score").notNull().default(0),
  successCount: integer("success_count").notNull().default(0),
  failureCount: integer("failure_count").notNull().default(0),
  avgExecutionMs: integer("avg_execution_ms").notNull().default(0),
  mutationHistory: jsonb("mutation_history").notNull().default([]),
  crossoverSource: jsonb("crossover_source").default(null),
  isElite: boolean("is_elite").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  retiredAt: timestamp("retired_at"),
  retiredReason: text("retired_reason"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("alloy_genomes_org_idx").on(t.orgId),
  index("alloy_genomes_pop_idx").on(t.populationId),
  index("alloy_genomes_gen_idx").on(t.generation),
  index("alloy_genomes_fitness_idx").on(t.fitnessScore),
  index("alloy_genomes_elite_idx").on(t.isElite),
  index("alloy_genomes_active_idx").on(t.isActive),
]);

export const alloyPopulationsTable = pgTable("alloy_populations", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  objectiveFunction: text("objective_function").notNull(),
  domain: text("domain").notNull(),
  generation: integer("generation").notNull().default(0),
  populationSize: integer("population_size").notNull().default(20),
  eliteCount: integer("elite_count").notNull().default(3),
  mutationRate: real("mutation_rate").notNull().default(0.15),
  crossoverRate: real("crossover_rate").notNull().default(0.7),
  selectionStrategy: text("selection_strategy", {
    enum: ["tournament", "roulette", "rank", "elitist"],
  }).notNull().default("tournament"),
  convergenceThreshold: real("convergence_threshold").notNull().default(0.01),
  maxGenerations: integer("max_generations").notNull().default(100),
  bestFitness: real("best_fitness").notNull().default(0),
  avgFitness: real("avg_fitness").notNull().default(0),
  fitnessHistory: jsonb("fitness_history").notNull().default([]),
  status: text("status", {
    enum: ["initializing", "evolving", "converged", "paused", "terminated"],
  }).notNull().default("initializing"),
  startedAt: timestamp("started_at"),
  convergedAt: timestamp("converged_at"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("alloy_populations_org_idx").on(t.orgId),
  index("alloy_populations_domain_idx").on(t.domain),
  index("alloy_populations_status_idx").on(t.status),
]);

export const alloyThreatModelsTable = pgTable("alloy_threat_models", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  targetAsset: text("target_asset").notNull(),
  domain: text("domain").notNull(),
  classification: text("classification", {
    enum: ["unclassified", "confidential", "secret", "top_secret"],
  }).notNull().default("unclassified"),
  threatActors: jsonb("threat_actors").notNull().default([]),
  attackVectors: jsonb("attack_vectors").notNull().default([]),
  vulnerabilities: jsonb("vulnerabilities").notNull().default([]),
  mitigations: jsonb("mitigations").notNull().default([]),
  riskMatrix: jsonb("risk_matrix").notNull().default({}),
  overallRiskScore: real("overall_risk_score").notNull().default(0),
  stride: jsonb("stride").notNull().default({}),
  killChainMapping: jsonb("kill_chain_mapping").notNull().default([]),
  counterIntelIndicators: jsonb("counter_intel_indicators").notNull().default([]),
  lastAssessedAt: timestamp("last_assessed_at"),
  nextReviewAt: timestamp("next_review_at"),
  assessedBy: integer("assessed_by").references(() => usersTable.id, { onDelete: "set null" }),
  status: text("status", {
    enum: ["draft", "under_review", "active", "archived", "compromised"],
  }).notNull().default("draft"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("alloy_threats_org_idx").on(t.orgId),
  index("alloy_threats_domain_idx").on(t.domain),
  index("alloy_threats_classification_idx").on(t.classification),
  index("alloy_threats_risk_idx").on(t.overallRiskScore),
  index("alloy_threats_status_idx").on(t.status),
]);

export const alloyExpertRoutingLogTable = pgTable("alloy_expert_routing_log", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  signalId: integer("signal_id"),
  expertScores: jsonb("expert_scores").notNull(),
  selectedExpertId: integer("selected_expert_id"),
  selectedExpertSlug: text("selected_expert_slug"),
  routingStrategy: text("routing_strategy", {
    enum: ["top_k", "weighted_ensemble", "cascade", "unanimous"],
  }).notNull().default("top_k"),
  confidenceScore: real("confidence_score").notNull().default(0),
  latencyMs: integer("latency_ms").notNull().default(0),
  fallbackUsed: boolean("fallback_used").notNull().default(false),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("alloy_routing_log_org_idx").on(t.orgId),
  index("alloy_routing_log_expert_idx").on(t.selectedExpertId),
  index("alloy_routing_log_created_idx").on(t.createdAt),
]);

export const alloyEvolutionEventsTable = pgTable("alloy_evolution_events", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  populationId: integer("population_id"),
  genomeId: integer("genome_id"),
  eventType: text("event_type", {
    enum: ["mutation", "crossover", "selection", "elimination", "elite_promotion", "convergence", "generation_complete"],
  }).notNull(),
  generation: integer("generation").notNull(),
  details: jsonb("details").notNull().default({}),
  fitnessChange: real("fitness_change").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("alloy_evo_events_org_idx").on(t.orgId),
  index("alloy_evo_events_pop_idx").on(t.populationId),
  index("alloy_evo_events_type_idx").on(t.eventType),
  index("alloy_evo_events_gen_idx").on(t.generation),
]);

export const insertAlloyExpertSchema = createInsertSchema(alloyExpertsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAlloyExpert = z.infer<typeof insertAlloyExpertSchema>;
export type AlloyExpert = typeof alloyExpertsTable.$inferSelect;

export const insertAlloyGenomeSchema = createInsertSchema(alloyGenomesTable).omit({ id: true, createdAt: true });
export type InsertAlloyGenome = z.infer<typeof insertAlloyGenomeSchema>;
export type AlloyGenome = typeof alloyGenomesTable.$inferSelect;

export const insertAlloyPopulationSchema = createInsertSchema(alloyPopulationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAlloyPopulation = z.infer<typeof insertAlloyPopulationSchema>;
export type AlloyPopulation = typeof alloyPopulationsTable.$inferSelect;

export const insertAlloyThreatModelSchema = createInsertSchema(alloyThreatModelsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAlloyThreatModel = z.infer<typeof insertAlloyThreatModelSchema>;
export type AlloyThreatModel = typeof alloyThreatModelsTable.$inferSelect;

export const insertAlloyExpertRoutingLogSchema = createInsertSchema(alloyExpertRoutingLogTable).omit({ id: true, createdAt: true });
export type InsertAlloyExpertRoutingLog = z.infer<typeof insertAlloyExpertRoutingLogSchema>;

export const insertAlloyEvolutionEventSchema = createInsertSchema(alloyEvolutionEventsTable).omit({ id: true, createdAt: true });
export type InsertAlloyEvolutionEvent = z.infer<typeof insertAlloyEvolutionEventSchema>;
