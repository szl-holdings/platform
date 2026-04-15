
import { logger } from "./logger.js";
import { TrainingMetrics } from "./training-pipeline.js";

export type ModelLifecycle = "experimental" | "staging" | "production" | "deprecated";

export interface RegisteredModel {
  modelVersionId: string;
  modelName: string;
  domain: string;
  version: string;
  algorithmFamily: string;
  runId: string;
  datasetId: string;
  datasetVersion: string;
  featureIds: string[];
  hyperparameters: Record<string, unknown>;
  trainMetrics: TrainingMetrics;
  testMetrics: TrainingMetrics;
  featureImportance: Record<string, number> | null;
  lifecycle: ModelLifecycle;
  isProduction: boolean;
  promotedBy?: string;
  promotedAt?: Date;
  deprecatedAt?: Date;
  tags: string[];
  notes?: string;
  createdAt: Date;
}

export interface ModelPromotionResult {
  modelVersionId: string;
  from: ModelLifecycle;
  to: ModelLifecycle;
  success: boolean;
  message: string;
}

export interface RegisterModelInput {
  modelName: string;
  domain: string;
  algorithmFamily: string;
  runId: string;
  datasetId: string;
  datasetVersion: string;
  featureIds: string[];
  hyperparameters: Record<string, unknown>;
  trainMetrics: TrainingMetrics;
  testMetrics: TrainingMetrics;
  featureImportance: Record<string, number> | null;
  tags?: string[];
  notes?: string;
}

// ---------------------------------------------------------------------------
// In-memory registry store
// ---------------------------------------------------------------------------

const modelStore = new Map<string, RegisteredModel>();
const versionCounters = new Map<string, number>();

function nextVersion(modelName: string): string {
  const current = versionCounters.get(modelName) ?? 0;
  const next = current + 1;
  versionCounters.set(modelName, next);
  return `1.${next}.0`;
}

// ---------------------------------------------------------------------------
// Registry API
// ---------------------------------------------------------------------------

class MlModelRegistryService {
  async registerModel(input: RegisterModelInput): Promise<RegisteredModel> {
    const modelVersionId = `mv-${crypto.randomUUID()}`;
    const version = nextVersion(input.modelName);

    const model: RegisteredModel = {
      modelVersionId,
      modelName: input.modelName,
      domain: input.domain,
      version,
      algorithmFamily: input.algorithmFamily,
      runId: input.runId,
      datasetId: input.datasetId,
      datasetVersion: input.datasetVersion,
      featureIds: input.featureIds,
      hyperparameters: input.hyperparameters,
      trainMetrics: input.trainMetrics,
      testMetrics: input.testMetrics,
      featureImportance: input.featureImportance,
      lifecycle: "experimental",
      isProduction: false,
      tags: input.tags ?? [],
      notes: input.notes,
      createdAt: new Date(),
    };

    modelStore.set(modelVersionId, model);
    logger.info({ modelVersionId, modelName: input.modelName, version, domain: input.domain }, "Model registered");
    return model;
  }

  promoteModel(modelVersionId: string, targetLifecycle: ModelLifecycle, promotedBy?: string): ModelPromotionResult {
    const model = modelStore.get(modelVersionId);
    if (!model) {
      return { modelVersionId, from: "experimental", to: targetLifecycle, success: false, message: "Model version not found" };
    }

    const validTransitions: Record<ModelLifecycle, ModelLifecycle[]> = {
      experimental: ["staging", "deprecated"],
      staging: ["production", "experimental", "deprecated"],
      production: ["staging", "deprecated"],
      deprecated: [],
    };

    if (!validTransitions[model.lifecycle].includes(targetLifecycle)) {
      return { modelVersionId, from: model.lifecycle, to: targetLifecycle, success: false, message: `Invalid transition from ${model.lifecycle} to ${targetLifecycle}` };
    }

    const from = model.lifecycle;

    // If promoting to production, demote current production models for same name
    if (targetLifecycle === "production") {
      for (const [, m] of modelStore) {
        if (m.modelName === model.modelName && m.isProduction && m.modelVersionId !== modelVersionId) {
          m.lifecycle = "staging";
          m.isProduction = false;
          logger.info({ modelVersionId: m.modelVersionId }, "Previous production model demoted to staging");
        }
      }
    }

    model.lifecycle = targetLifecycle;
    model.isProduction = targetLifecycle === "production";
    if (targetLifecycle === "production") {
      model.promotedAt = new Date();
      model.promotedBy = promotedBy;
    }
    if (targetLifecycle === "deprecated") {
      model.deprecatedAt = new Date();
    }

    logger.info({ modelVersionId, from, to: targetLifecycle }, "Model lifecycle updated");
    return { modelVersionId, from, to: targetLifecycle, success: true, message: `Promoted from ${from} to ${targetLifecycle}` };
  }

  getModel(modelVersionId: string): RegisteredModel | null {
    return modelStore.get(modelVersionId) ?? null;
  }

  getProductionModel(modelName: string): RegisteredModel | null {
    for (const [, m] of modelStore) {
      if (m.modelName === modelName && m.isProduction) return m;
    }
    return null;
  }

  getProductionModelForDomain(domain: string, modelType: string): RegisteredModel | null {
    const modelName = `${domain}-${modelType}`;
    return this.getProductionModel(modelName);
  }

  listModels(domain?: string, lifecycle?: ModelLifecycle): RegisteredModel[] {
    const all = Array.from(modelStore.values());
    return all.filter(m =>
      (domain ? m.domain === domain : true) &&
      (lifecycle ? m.lifecycle === lifecycle : true)
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getModelLineage(modelVersionId: string): { model: RegisteredModel; parents: RegisteredModel[] } | null {
    const model = modelStore.get(modelVersionId);
    if (!model) return null;
    const parents = Array.from(modelStore.values()).filter(m =>
      m.modelName === model.modelName && m.createdAt < model.createdAt
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return { model, parents };
  }

  getRegistrySummary() {
    const models = Array.from(modelStore.values());
    const lifecycleCounts: Record<string, number> = { experimental: 0, staging: 0, production: 0, deprecated: 0 };
    for (const m of models) lifecycleCounts[m.lifecycle] = (lifecycleCounts[m.lifecycle] ?? 0) + 1;

    return {
      totalVersions: models.length,
      lifecycleCounts,
      domains: [...new Set(models.map(m => m.domain))],
      productionModels: models.filter(m => m.isProduction).map(m => ({
        modelVersionId: m.modelVersionId,
        modelName: m.modelName,
        domain: m.domain,
        version: m.version,
        algorithm: m.algorithmFamily,
      })),
    };
  }
}

export const mlModelRegistry = new MlModelRegistryService();
