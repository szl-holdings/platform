import {
  db,
  governanceGateBypassesTable,
  governanceGateConfigTable,
  operatorModelRegistryTable,
} from '@szl-holdings/db';
import { and, eq, lt } from 'drizzle-orm';

export type ModelCapability = 'embeddings' | 'retrieval' | 'ocr' | 'geospatial' | 'eval_grading' | 'reasoning' | 'classification' | 'summarization';
export type LicenseStatus = 'approved' | 'pending_review' | 'rejected' | 'unknown';

export interface ModelRegistryEntry {
  id: string;
  provider: string;
  modelId: string;
  capability: ModelCapability;
  license: string;
  licenseStatus: LicenseStatus;
  sensitivityAllowance: 'public' | 'internal' | 'confidential' | 'restricted';
  envGate: string | null;
  productionApproved: boolean;
  description: string;
  addedAt: string;
}

export interface HfGateResult {
  allowed: boolean;
  failedConditions: string[];
  conditions: Record<string, boolean>;
}

const registry = new Map<string, ModelRegistryEntry>();

const SEED_MODELS: ModelRegistryEntry[] = [
  {
    id: 'model-bge-large',
    provider: 'huggingface',
    modelId: 'BAAI/bge-large-en-v1.5',
    capability: 'embeddings',
    license: 'MIT',
    licenseStatus: 'approved',
    sensitivityAllowance: 'internal',
    envGate: 'SUBSTRATE_EMBEDDINGS_ALLOW_DEV_MODEL',
    productionApproved: false,
    description: 'BGE-large-en-v1.5 embeddings model for semantic search and RAG pipelines.',
    addedAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
  },
  {
    id: 'model-bge-m3',
    provider: 'huggingface',
    modelId: 'BAAI/bge-m3',
    capability: 'embeddings',
    license: 'MIT',
    licenseStatus: 'approved',
    sensitivityAllowance: 'internal',
    envGate: 'SUBSTRATE_EMBEDDINGS_ALLOW_DEV_MODEL',
    productionApproved: false,
    description: 'BGE-M3 multilingual embeddings for cross-language retrieval.',
    addedAt: new Date(Date.now() - 28 * 86_400_000).toISOString(),
  },
  {
    id: 'model-bart-summarize',
    provider: 'huggingface',
    modelId: 'facebook/bart-large-cnn',
    capability: 'summarization',
    license: 'MIT',
    licenseStatus: 'approved',
    sensitivityAllowance: 'public',
    envGate: null,
    productionApproved: false,
    description: 'BART-large-CNN for document summarization across legal and maritime domains.',
    addedAt: new Date(Date.now() - 25 * 86_400_000).toISOString(),
  },
  {
    id: 'model-legal-bert',
    provider: 'huggingface',
    modelId: 'nlpaueb/legal-bert-base-uncased',
    capability: 'classification',
    license: 'CC-BY-SA-4.0',
    licenseStatus: 'approved',
    sensitivityAllowance: 'confidential',
    envGate: null,
    productionApproved: false,
    description: 'Legal-BERT for contract clause classification and legal NLP tasks.',
    addedAt: new Date(Date.now() - 20 * 86_400_000).toISOString(),
  },
  {
    id: 'model-qwen3-8b',
    provider: 'huggingface',
    modelId: 'Qwen/Qwen3-8B',
    capability: 'reasoning',
    license: 'Apache-2.0',
    licenseStatus: 'approved',
    sensitivityAllowance: 'internal',
    envGate: null,
    productionApproved: false,
    description: 'Qwen3-8B for governed reasoning tasks via HF Inference API.',
    addedAt: new Date(Date.now() - 14 * 86_400_000).toISOString(),
  },
  {
    id: 'model-tesseract-ocr',
    provider: 'local',
    modelId: 'tesseract-ocr-v5',
    capability: 'ocr',
    license: 'Apache-2.0',
    licenseStatus: 'approved',
    sensitivityAllowance: 'restricted',
    envGate: null,
    productionApproved: true,
    description: 'Tesseract OCR engine for document digitization in substrate workers.',
    addedAt: new Date(Date.now() - 60 * 86_400_000).toISOString(),
  },
  {
    id: 'model-gpt-4o',
    provider: 'openai',
    modelId: 'gpt-4o',
    capability: 'reasoning',
    license: 'Proprietary',
    licenseStatus: 'approved',
    sensitivityAllowance: 'internal',
    envGate: null,
    productionApproved: true,
    description: 'GPT-4o for primary deep reasoning, board packets, and proof reconstruction.',
    addedAt: new Date(Date.now() - 90 * 86_400_000).toISOString(),
  },
  {
    id: 'model-deepseek-r1',
    provider: 'deepseek',
    modelId: 'deepseek-reasoner',
    capability: 'classification',
    license: 'Proprietary',
    licenseStatus: 'approved',
    sensitivityAllowance: 'internal',
    envGate: null,
    productionApproved: true,
    description: 'DeepSeek R1 for cost-efficient triage, classification, and document analysis.',
    addedAt: new Date(Date.now() - 75 * 86_400_000).toISOString(),
  },
  {
    id: 'model-eval-judge',
    provider: 'internal',
    modelId: 'a11oy-eval-judge-v2',
    capability: 'eval_grading',
    license: 'Internal',
    licenseStatus: 'approved',
    sensitivityAllowance: 'restricted',
    envGate: null,
    productionApproved: true,
    description: 'Deterministic MirrorEval 2.0 judge — 14-dimension scoring.',
    addedAt: new Date(Date.now() - 120 * 86_400_000).toISOString(),
  },
  {
    id: 'model-geospatial-rf',
    provider: 'local',
    modelId: 'szl-geospatial-rf-v1',
    capability: 'geospatial',
    license: 'Internal',
    licenseStatus: 'approved',
    sensitivityAllowance: 'restricted',
    envGate: null,
    productionApproved: true,
    description: 'Random-forest geospatial risk model for AIS correlation and anomaly detection.',
    addedAt: new Date(Date.now() - 100 * 86_400_000).toISOString(),
  },
];

function seedRegistry(): void {
  for (const entry of SEED_MODELS) {
    if (!registry.has(entry.id)) {
      registry.set(entry.id, entry);
    }
  }
}

seedRegistry();

export function getModelEntry(id: string): ModelRegistryEntry | undefined {
  return registry.get(id);
}

export function listModelEntries(opts?: { provider?: string; capability?: string }): ModelRegistryEntry[] {
  let entries = Array.from(registry.values());
  if (opts?.provider) entries = entries.filter(e => e.provider === opts.provider);
  if (opts?.capability) entries = entries.filter(e => e.capability === opts.capability);
  return entries.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared gate evaluation — single source of truth for routing AND status reads
// ─────────────────────────────────────────────────────────────────────────────

interface GateConfigLike {
  licenseApproved: boolean;
  sensitivityAllowance: string;
  liveInferenceEnabled: boolean | null;
  productionApproved: boolean | null;
}

/**
 * Pure gate evaluator shared by checkHfLiveRoutingGate (sync, in-memory) and
 * buildGateStatus (async, DB read path) so both always agree on effective state.
 *
 * Precedence: per-model gate config > env-var global > `fallback` (model defaults).
 * `fallback` is used ONLY when no gate config row exists at all (e.g. edge-case
 * DB row without a matching governance_gate_config row).
 */
function computeGateValues(
  gateConfig: GateConfigLike | null | undefined,
  fallback: { licenseApproved: boolean; sensitivityAllowance: string },
  hasBypass: (gate: string) => boolean,
): { licenseApproved: boolean; sensitivityOk: boolean; liveInferenceEnabled: boolean; productionApproved: boolean } {
  const licenseApproved = (
    gateConfig != null
      ? gateConfig.licenseApproved
      : fallback.licenseApproved
  ) || hasBypass('license_approved');

  const sensitivityOk = (
    gateConfig != null
      ? (['public', 'internal'] as string[]).includes(gateConfig.sensitivityAllowance)
      : (['public', 'internal'] as string[]).includes(fallback.sensitivityAllowance)
  ) || hasBypass('sensitivity_match');

  // env-var globals apply when gate config field is explicitly null (meaning "inherit global")
  const liveInferenceEnabled = (
    gateConfig?.liveInferenceEnabled != null
      ? gateConfig.liveInferenceEnabled
      : process.env.HF_ENABLE_LIVE_INFERENCE === '1'
  ) || hasBypass('live_inference_enabled');

  const productionApproved = (
    gateConfig?.productionApproved != null
      ? gateConfig.productionApproved
      : process.env.HF_PRODUCTION_APPROVED === '1'
  ) || hasBypass('production_approved');

  return { licenseApproved, sensitivityOk, liveInferenceEnabled, productionApproved };
}

export function checkHfLiveRoutingGate(modelId: string): HfGateResult {
  const entry = Array.from(registry.values()).find(e => e.modelId === modelId || e.id === modelId);
  const isHfProvider = entry?.provider === 'huggingface';

  // Per-model override from DB gate config, hydrated at startup and kept in-sync
  const overrideRaw = entry ? perModelGateOverrides.get(entry.id) : undefined;
  // Normalise PerModelGateOverride → GateConfigLike (fill optional fields)
  const gateConfig: GateConfigLike | null = overrideRaw
    ? {
        licenseApproved: overrideRaw.licenseApproved ?? false,
        sensitivityAllowance: overrideRaw.sensitivityAllowance ?? 'restricted',
        liveInferenceEnabled: overrideRaw.liveInferenceEnabled ?? null,
        productionApproved: overrideRaw.productionApproved ?? null,
      }
    : null;

  // Fallback from the model's own metadata (used only when no gate config row exists)
  const fallback = {
    licenseApproved: isHfProvider && entry?.licenseStatus === 'approved',
    sensitivityAllowance: entry?.sensitivityAllowance ?? 'restricted',
  };

  // Inline expiry check prevents stale bypasses from affecting routing
  const now = new Date();
  const bypassMap = entry ? (activeBypassedGates.get(entry.id) ?? new Map<string, Date>()) : new Map<string, Date>();
  const hasBypass = (gate: string): boolean => {
    const exp = bypassMap.get(gate);
    return exp != null && exp > now;
  };

  const { licenseApproved, sensitivityOk, liveInferenceEnabled, productionApproved } =
    computeGateValues(gateConfig, fallback, hasBypass);

  const conditions: Record<string, boolean> = {
    registry_record_exists: (!!entry && isHfProvider) || hasBypass('registry_exists'),
    license_approved: !isHfProvider || licenseApproved,
    sensitivity_match: !isHfProvider || sensitivityOk,
    hf_live_inference_enabled: !isHfProvider || liveInferenceEnabled,
    hf_production_approved: !isHfProvider || productionApproved,
  };

  const failedConditions = Object.entries(conditions)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  return {
    allowed: failedConditions.length === 0,
    failedConditions,
    conditions,
  };
}

export function getRegistrySummary(): {
  totalModels: number;
  byProvider: Record<string, number>;
  byCapability: Record<string, number>;
  productionApproved: number;
  hfModels: number;
  hfLiveRoutable: number;
} {
  const entries = Array.from(registry.values());
  const byProvider: Record<string, number> = {};
  const byCapability: Record<string, number> = {};

  for (const e of entries) {
    byProvider[e.provider] = (byProvider[e.provider] ?? 0) + 1;
    byCapability[e.capability] = (byCapability[e.capability] ?? 0) + 1;
  }

  const hfModels = entries.filter(e => e.provider === 'huggingface');
  const hfLiveRoutable = hfModels.filter(e => {
    const gate = checkHfLiveRoutingGate(e.modelId);
    return gate.allowed;
  }).length;

  return {
    totalModels: entries.length,
    byProvider,
    byCapability,
    productionApproved: entries.filter(e => e.productionApproved).length,
    hfModels: hfModels.length,
    hfLiveRoutable,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-model gate override store (in-memory, seeded from DB on startup)
// ─────────────────────────────────────────────────────────────────────────────

interface PerModelGateOverride {
  licenseApproved?: boolean;
  sensitivityAllowance?: string;
  liveInferenceEnabled?: boolean | null;
  productionApproved?: boolean | null;
}

const perModelGateOverrides = new Map<string, PerModelGateOverride>();
// bypass cache: registryId → { gateName → expiresAt }
// Expiry is checked inline by checkHfLiveRoutingGate so stale bypasses never
// affect inference routing even if the periodic sweeper hasn't run yet.
const activeBypassedGates = new Map<string, Map<string, Date>>();

/**
 * Apply a per-model gate override from the DB gate config layer.
 * Called on startup (from DB seed) and on every PATCH /governance/gates/:id.
 */
export function applyGateOverride(registryId: string, override: PerModelGateOverride): void {
  perModelGateOverrides.set(registryId, override);
}

/**
 * Apply an active bypass for a specific gate on a model.
 * expiresAt is stored in the cache so checkHfLiveRoutingGate can enforce
 * expiry inline without a DB round-trip.
 */
export function applyGateBypass(registryId: string, gateName: string, expiresAt: Date): void {
  const existing = activeBypassedGates.get(registryId) ?? new Map<string, Date>();
  existing.set(gateName, expiresAt);
  activeBypassedGates.set(registryId, existing);
}

export function clearGateBypasses(registryId: string): void {
  activeBypassedGates.delete(registryId);
}

/**
 * Remove a single gate bypass from the in-memory cache.
 * Called immediately after a bypass is revoked via the governance API so
 * inference routing sees the revocation without waiting for the next expiry sweep.
 */
export function revokeGateBypass(registryId: string, gateName: string): void {
  const m = activeBypassedGates.get(registryId);
  if (m) {
    m.delete(gateName);
    if (m.size === 0) activeBypassedGates.delete(registryId);
  }
}

/**
 * Remove a model from the in-memory runtime registry.
 * Called when DELETE /governance/registry/:id succeeds.
 */
export function removeModelFromRegistry(id: string): void {
  registry.delete(id);
  perModelGateOverrides.delete(id);
  activeBypassedGates.delete(id);
}

/**
 * Update an existing in-memory registry entry with partial fields.
 * Called when PATCH /governance/registry/:id succeeds.
 * Accepts the full set of mutable operator-facing fields so the routing
 * cache stays in sync with the DB without requiring a full resync.
 */
export function updateModelInRegistry(
  id: string,
  updates: Partial<Pick<ModelRegistryEntry, 'license' | 'description' | 'productionApproved' | 'capability'>> & {
    displayName?: string;
  },
): void {
  const entry = registry.get(id);
  if (!entry) return;
  const { displayName, ...rest } = updates;
  // ModelRegistryEntry doesn't carry displayName (it uses the modelId for routing), but
  // we spread any overlapping keys from `rest` and silently drop displayName since it
  // is only needed for the DB/API surface, not the routing cache.
  registry.set(id, { ...entry, ...rest });
}

/**
 * Add a dynamically registered model to the in-memory registry.
 * Called when POST /governance/registry succeeds.
 */
export function addModelToRegistry(model: {
  id: string;
  hfModelId: string;
  displayName: string;
  provider: string;
  capabilities: string[];
  tier: string;
  contextWindow: number;
  maxOutputTokens: number;
  inputCostPer1kTokens: number;
  outputCostPer1kTokens: number;
  license: string;
  description: string;
}): void {
  const firstCap = (model.capabilities[0] as ModelCapability | undefined) ?? 'reasoning';
  const entry: ModelRegistryEntry = {
    id: model.id,
    provider: model.provider,
    modelId: model.hfModelId,
    capability: firstCap,
    license: model.license,
    licenseStatus: 'pending_review',
    // New dynamically-registered models start with a conservative sensitivity
    // so the sensitivity gate blocks routing until an operator explicitly approves.
    sensitivityAllowance: 'restricted',
    envGate: null,
    productionApproved: false,
    description: model.description,
    addedAt: new Date().toISOString(),
  };
  registry.set(model.id, entry);
}

/**
 * Sync the in-memory runtime registry and gate override/bypass caches from the
 * database. Called once at server startup (via bootstrapStep) and should be
 * re-called after any registry or gate mutation so the cache stays consistent.
 *
 * On first call, upserts the hardcoded SEED_MODELS into operator_model_registry
 * (seeded=true) so the DB becomes the authoritative source of truth. After that,
 * the runtime registry is fully rebuilt from DB rows (updates + removals included).
 */
export async function syncModelRegistryFromDb(): Promise<void> {
  // Step 1: Upsert SEED_MODELS into DB so they appear in governance queries.
  // Also upsert matching gate config rows so both routing and status reads
  // always find an explicit gate config (eliminates fallback edge cases).
  for (const seed of SEED_MODELS) {
    await db
      .insert(operatorModelRegistryTable)
      .values({
        id: seed.id,
        hfModelId: seed.modelId,
        displayName: seed.description.slice(0, 100) || seed.id,
        provider: seed.provider,
        capabilities: [seed.capability],
        tier: seed.productionApproved ? 'frontier' : 'local',
        contextWindow: 4096,
        maxOutputTokens: 1024,
        inputCostPer1kTokens: 0,
        outputCostPer1kTokens: 0,
        license: seed.license,
        description: seed.description,
        isActive: true,
        seeded: true,
      })
      .onConflictDoNothing();

    await db
      .insert(governanceGateConfigTable)
      .values({
        modelRegistryId: seed.id,
        licenseApproved: seed.licenseStatus === 'approved',
        sensitivityAllowance: seed.sensitivityAllowance,
        liveInferenceEnabled: null,   // inherit from HF_ENABLE_LIVE_INFERENCE env var
        productionApproved: null,     // inherit from HF_PRODUCTION_APPROVED env var
        updatedBy: 'system-seed',
      })
      .onConflictDoNothing();
  }

  // Step 2: Load ALL active DB models and fully rebuild the runtime registry
  const [models, gateConfigs, activeBypasses] = await Promise.all([
    db.select().from(operatorModelRegistryTable).where(eq(operatorModelRegistryTable.isActive, true)),
    db.select().from(governanceGateConfigTable),
    db.select().from(governanceGateBypassesTable).where(eq(governanceGateBypassesTable.isActive, true)),
  ]);

  // Full rebuild: clear registry and re-populate from DB
  registry.clear();
  for (const m of models) {
    const firstCap = Array.isArray(m.capabilities) && m.capabilities.length > 0
      ? (m.capabilities[0] as ModelCapability)
      : 'reasoning';
    // For seeded models, look up the SEED_MODELS defaults for licenseStatus/sensitivityAllowance
    const seedDefaults = SEED_MODELS.find(s => s.id === m.id);
    registry.set(m.id, {
      id: m.id,
      provider: m.provider,
      modelId: m.hfModelId,
      capability: firstCap,
      license: m.license,
      licenseStatus: seedDefaults?.licenseStatus ?? 'pending_review',
      sensitivityAllowance: seedDefaults?.sensitivityAllowance ?? 'internal',
      envGate: seedDefaults?.envGate ?? null,
      productionApproved: seedDefaults?.productionApproved ?? false,
      description: m.description,
      addedAt: m.createdAt.toISOString(),
    });
  }

  // Hydrate per-model gate overrides (replaces any in-memory state)
  perModelGateOverrides.clear();
  for (const g of gateConfigs) {
    perModelGateOverrides.set(g.modelRegistryId, {
      licenseApproved: g.licenseApproved,
      sensitivityAllowance: g.sensitivityAllowance,
      liveInferenceEnabled: g.liveInferenceEnabled,
      productionApproved: g.productionApproved,
    });
  }

  // Hydrate active bypass cache with expiry times (only non-expired)
  activeBypassedGates.clear();
  const now = new Date();
  for (const b of activeBypasses) {
    if (b.expiresAt > now) {
      const m = activeBypassedGates.get(b.modelRegistryId) ?? new Map<string, Date>();
      m.set(b.gateName, b.expiresAt);
      activeBypassedGates.set(b.modelRegistryId, m);
    }
  }
}

/**
 * Expire stale bypass records in the DB and clear them from the in-memory cache.
 * Called lazily before governance reads and also by the background sweep interval.
 */
export async function expireStaleBypasses(): Promise<number> {
  try {
    const now = new Date();

    // Clean up in-memory cache first (inline expiry — fast path)
    for (const [registryId, bypassMap] of activeBypassedGates) {
      for (const [gateName, expiresAt] of bypassMap) {
        if (expiresAt <= now) bypassMap.delete(gateName);
      }
      if (bypassMap.size === 0) activeBypassedGates.delete(registryId);
    }

    // Persist DB update so expired rows are not re-hydrated on next sync
    const result = await db
      .update(governanceGateBypassesTable)
      .set({ isActive: false })
      .where(
        and(
          eq(governanceGateBypassesTable.isActive, true),
          lt(governanceGateBypassesTable.expiresAt, now),
        ),
      )
      .returning({ id: governanceGateBypassesTable.id });

    return result.length;
  } catch {
    return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Gate status query helpers (used by the governance-gates route)
// ─────────────────────────────────────────────────────────────────────────────

interface ModelGateStatus {
  modelId: string;
  hfModelId: string;
  displayName: string;
  provider: string;
  gateStatus: 'open' | 'partial' | 'blocked';
  gates: {
    registry_exists: boolean;
    license_approved: boolean;
    sensitivity_match: boolean;
    live_inference_enabled: boolean;
    production_approved: boolean;
  };
  failedGates: string[];
  activeBypasses: string[];
  gateConfig: Record<string, unknown> | null;
}

/**
 * Build a gate status record for a single operator model registry row.
 * bypasses is a Map<gateName, expiresAt>; expiry is checked here so the
 * governance read path also reflects the correct effective state.
 */
async function buildGateStatus(
  model: { id: string; hfModelId: string; displayName: string; provider: string },
  gateConfig: GateConfigLike | null,
  bypasses: Map<string, Date>,
): Promise<ModelGateStatus> {
  const isHf = model.provider === 'huggingface';
  const now = new Date();
  const hasBypass = (gate: string): boolean => {
    const exp = bypasses.get(gate);
    return exp != null && exp > now;
  };

  // Conservative fallback when no gate config row exists: license=false, sensitivity=restricted.
  // In practice this should not happen since syncModelRegistryFromDb seeds gate configs for
  // all SEED_MODELS and POST /governance/registry always creates one.
  const fallback = { licenseApproved: false, sensitivityAllowance: 'restricted' };
  const { licenseApproved, sensitivityOk, liveInferenceEnabled, productionApproved } =
    computeGateValues(gateConfig, fallback, hasBypass);

  const gates = {
    registry_exists: isHf || hasBypass('registry_exists'),
    license_approved: !isHf || licenseApproved,
    sensitivity_match: !isHf || sensitivityOk,
    live_inference_enabled: !isHf || liveInferenceEnabled,
    production_approved: !isHf || productionApproved,
  };

  const failedGates = Object.entries(gates)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  const gateStatus: 'open' | 'partial' | 'blocked' =
    failedGates.length === 0 ? 'open' : failedGates.length < 5 ? 'partial' : 'blocked';

  // Collect gate names whose bypass has not yet expired
  const activeBypasses = Array.from(bypasses.entries())
    .filter(([, exp]) => exp > now)
    .map(([name]) => name);

  return {
    modelId: model.id,
    hfModelId: model.hfModelId,
    displayName: model.displayName,
    provider: model.provider,
    gateStatus,
    gates,
    failedGates,
    activeBypasses,
    gateConfig: gateConfig
      ? {
          licenseApproved: gateConfig.licenseApproved,
          sensitivityAllowance: gateConfig.sensitivityAllowance,
          liveInferenceEnabled: gateConfig.liveInferenceEnabled,
          productionApproved: gateConfig.productionApproved,
        }
      : null,
  };
}

export async function getGateStatusForAllModels(): Promise<ModelGateStatus[]> {
  try {
    const models = await db
      .select()
      .from(operatorModelRegistryTable)
      .where(eq(operatorModelRegistryTable.isActive, true));

    const gateConfigs = await db.select().from(governanceGateConfigTable);
    const configMap = new Map(gateConfigs.map(g => [g.modelRegistryId, g]));

    const activeBypasses = await db
      .select()
      .from(governanceGateBypassesTable)
      .where(eq(governanceGateBypassesTable.isActive, true));

    const bypassMap = new Map<string, Map<string, Date>>();
    const now = new Date();
    for (const b of activeBypasses) {
      if (b.expiresAt > now) {
        const m = bypassMap.get(b.modelRegistryId) ?? new Map<string, Date>();
        m.set(b.gateName, b.expiresAt);
        bypassMap.set(b.modelRegistryId, m);
      }
    }

    return Promise.all(
      models.map(m =>
        buildGateStatus(
          m,
          configMap.get(m.id) ?? null,
          bypassMap.get(m.id) ?? new Map(),
        ),
      ),
    );
  } catch {
    return [];
  }
}

export async function getGateStatusForModel(registryId: string): Promise<ModelGateStatus | null> {
  try {
    const [model] = await db
      .select()
      .from(operatorModelRegistryTable)
      .where(eq(operatorModelRegistryTable.id, registryId))
      .limit(1);

    if (!model) return null;

    const [gateConfig] = await db
      .select()
      .from(governanceGateConfigTable)
      .where(eq(governanceGateConfigTable.modelRegistryId, registryId))
      .limit(1);

    const now = new Date();
    const bypasses = await db
      .select()
      .from(governanceGateBypassesTable)
      .where(
        and(
          eq(governanceGateBypassesTable.modelRegistryId, registryId),
          eq(governanceGateBypassesTable.isActive, true),
        ),
      );

    const activeBypassSet = new Map<string, Date>(
      bypasses.filter(b => b.expiresAt > now).map(b => [b.gateName, b.expiresAt]),
    );

    return buildGateStatus(model, gateConfig ?? null, activeBypassSet);
  } catch {
    return null;
  }
}
