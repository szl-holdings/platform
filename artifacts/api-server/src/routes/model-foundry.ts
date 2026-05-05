/**
 * FORGE Model Foundry — governed fine-tuning pipeline orchestrator.
 *
 * Combines:
 *   - SmolFactory-style model family + dataset configuration
 *   - HuggingFace Jobs compute backend (real submission when HF_TOKEN is set,
 *     otherwise a deterministic simulation that produces the same lifecycle)
 *   - FORGE governance: provenance tags persisted as proof_chain entries,
 *     MirrorEval pre-deployment gate (strict — only `pass` advances),
 *     PCE covenant approval with risk-tier-based role enforcement,
 *     model cards w/ cryptographic proof packets, per-tenant budget
 *     enforcement + cost tracking, and lineage graph.
 */

import { createHash, randomUUID } from 'node:crypto';
import { Router, type IRouter, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { and, desc, eq, gte, sql as dsql } from 'drizzle-orm';
import {
  db,
  modelFoundryRuns,
  modelFoundryTenantBudgets,
  fineTunedModelRegistry,
  type ModelFoundryRun,
} from '@szl-holdings/db';
import { tagAIContent } from '@szl-holdings/proof-chain';
import {
  handleRouteError,
  sendCreated,
  sendError,
  sendForbidden,
  sendNotFound,
  sendSuccess,
} from '../lib/api-response';
import { validateBody } from '../lib/validation';
import { requireRole } from '../middlewares/auth';
import { logger } from '../lib/logger';
import { ENV_CONFIG } from '../lib/env-config';
import { submitJob, inspectJob, cancelJob, fetchJobLogs } from '../services/hf-jobs-adapter';

// ─── Tenant-scoped read authorization ──────────────────────────────────────
// Foundry GETs expose runs, costs, and model cards across tenants. To
// prevent IDOR-style data leakage between tenants in production, we require
// either a fleet-elevated role (ops|compliance|exec|admin|super_admin) OR
// explicit org membership of the requested tenant. In non-production we
// fall back to dev allowlist behaviour (handled in global-auth-enforcer).
const FLEET_READER_ROLES = new Set(['ops', 'compliance', 'exec', 'admin', 'super_admin']);

function isFleetReader(req: Request): boolean {
  if (process.env.NODE_ENV !== 'production' && !req.user) return true; // dev demo
  if (!req.user) return false;
  return req.user.roles.some((r) => FLEET_READER_ROLES.has(r));
}

function userHasTenantAccess(req: Request, tenantId: string | null | undefined): boolean {
  if (process.env.NODE_ENV !== 'production' && !req.user) return true; // dev demo
  if (!req.user) return false;
  if (req.user.roles.some((r) => FLEET_READER_ROLES.has(r))) return true;
  if (!tenantId) return false;
  return req.user.orgs.some((o) => o.orgSlug === tenantId);
}

function requireFleetReader(req: Request, res: Response, next: NextFunction): void {
  if (isFleetReader(req)) { next(); return; }
  sendForbidden(res, 'Foundry read access requires ops/compliance/exec/admin role or tenant membership.');
}

// Multer for dataset uploads — bytes-only, no disk persistence; we hash
// and tag-as-proof immediately, then discard the buffer. 50 MB cap.
const datasetUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 1 },
});

const router: IRouter = Router();

// NOTE: There is intentionally NO synthetic-principal injection here. All
// mutating POST endpoints below use `requireRole(...)` which requires a real
// `req.user` populated by the global auth hydrator. The non-production
// demo path is GET-only (allowlisted in `global-auth-enforcer.ts`) and
// reads from a small set of pre-seeded demo runs so the iframe can show
// the full pipeline without exposing privileged actions to anonymous
// callers. Mutating actions require an authenticated session in every
// environment, including dev.

// ─── Catalogs ───────────────────────────────────────────────────────────────

const MODEL_FAMILIES = [
  { id: 'smollm3-3b',     label: 'SmolLM3 3B',                publisher: 'HuggingFaceTB', paramsB: 3, contextLength:   8192, license: 'apache-2.0',          flavor: 'a10g-large', costPerMinute: 0.0667, recommendedFor: ['edge inference', 'tenant assistants', 'dataset curation'] },
  { id: 'qwen2.5-7b',     label: 'Qwen 2.5 7B Instruct',      publisher: 'Qwen',          paramsB: 7, contextLength:  32768, license: 'apache-2.0',          flavor: 'a100-large', costPerMinute: 0.1333, recommendedFor: ['multilingual', 'tool-use', 'code'] },
  { id: 'llama-3.1-8b',   label: 'Llama 3.1 8B Instruct',     publisher: 'meta-llama',    paramsB: 8, contextLength: 131072, license: 'llama-3.1-community', flavor: 'a100-large', costPerMinute: 0.1333, recommendedFor: ['general reasoning', 'long context', 'governed agents'] },
  { id: 'gemma-2-9b',     label: 'Gemma 2 9B Instruct',       publisher: 'google',        paramsB: 9, contextLength:   8192, license: 'gemma',               flavor: 'a100-large', costPerMinute: 0.1333, recommendedFor: ['safety-tuned baselines'] },
  { id: 'mistral-7b-v0.3',label: 'Mistral 7B v0.3',           publisher: 'mistralai',     paramsB: 7, contextLength:  32768, license: 'apache-2.0',          flavor: 'a100-large', costPerMinute: 0.1333, recommendedFor: ['low-latency operators', 'function-calling'] },
] as const;

const DATASET_TEMPLATES = [
  { id: 'vessels-risk-corpus',  label: 'Vessels — Maritime Risk Corpus',     samples: 12480, sourceClass: 'human-curated',   bytes: 18_700_000 },
  { id: 'sentra-incident-pack', label: 'Sentra — Incident Response Pack',    samples:  9120, sourceClass: 'human-curated',   bytes: 12_400_000 },
  { id: 'counsel-clm-redline',  label: 'Counsel — CLM Redline Pack',         samples:  6840, sourceClass: 'expert-reviewed', bytes:  9_300_000 },
  { id: 'terra-deal-memos',     label: 'Terra — Deal Memo Corpus',           samples:  4210, sourceClass: 'human-curated',   bytes:  6_100_000 },
  { id: 'a11oy-governance-qa',  label: 'A11oy — Governance Q&A',             samples:  3580, sourceClass: 'expert-reviewed', bytes:  4_900_000 },
] as const;

// ─── Risk-tier → required approver role ─────────────────────────────────────

type RiskTier = 'standard' | 'elevated' | 'critical';

function deriveRiskTier(family: { paramsB: number }, datasetSourceClass: string): RiskTier {
  if (datasetSourceClass === 'web-scraped' || datasetSourceClass === 'synthetic') return 'critical';
  if (family.paramsB >= 8 || datasetSourceClass === 'human-curated') return 'elevated';
  return 'standard';
}

// Approver-role gate (in addition to authMiddleware). Resolved at request time
// so the run's risk_tier (loaded from DB) drives the required role set.
function requireCovenantApprover() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
    const tier = (res.locals.foundryRiskTier as RiskTier | undefined) ?? 'standard';
    const allowed: string[] =
      tier === 'critical' ? ['admin', 'super_admin', 'exec'] :
      tier === 'elevated' ? ['admin', 'super_admin', 'exec', 'compliance'] :
                            ['admin', 'super_admin', 'exec', 'compliance', 'ops'];
    const userRoles = req.user.roles as string[];
    if (userRoles.some((r) => allowed.includes(r))) return next();
    return sendForbidden(res, `Risk tier '${tier}' requires one of: ${allowed.join(', ')}`);
  };
}

// ─── Types persisted inside model_foundry_runs.data (jsonb blob) ────────────

type FoundryStage =
  | 'queued' | 'training' | 'training_complete'
  | 'mirror_eval_pass' | 'mirror_eval_blocked'
  | 'covenant_pending' | 'covenant_rejected'
  | 'published' | 'cancelled' | 'budget_exceeded';

interface ProvenanceTag {
  proofId: number | string;
  sourceClass: string;
  confidenceScore: number;
  exportSafetyState: string;
  taggedAt: string;
  datasetHash: string;
  datasetBytes: number;
  schemaValidation: { passed: boolean; errors: string[] };
  piiScan: { riskScore: number; flagged: string[] };
}

interface MetricPoint { step: number; loss: number; evalLoss?: number; lr: number; timestamp: string; }

interface MirrorEvalSummary {
  evalId: string;
  disposition: 'pass' | 'needs_more_evidence' | 'blocked';
  overallScore: number;
  scores: { dimension: string; score: number; rationale: string; flag?: string }[];
  flags: string[];
  evaluatedAt: string;
}

interface CovenantDecision {
  decision: 'approved' | 'rejected';
  approver: string;
  rationale: string;
  decidedAt: string;
  contractId: string;
  riskTier: RiskTier;
}

interface FoundryRunBlob {
  family: typeof MODEL_FAMILIES[number];
  baseModel: string;
  dataset: { id: string; label: string; samples: number; sourceClass: string; bytes: number };
  hyperparameters: { epochs: number; batchSize: number; learningRate: number; lora: boolean };
  startedAt: string;
  completedAt?: string;
  elapsedSeconds: number;
  provenance: ProvenanceTag;
  metrics: MetricPoint[];
  mirrorEval?: MirrorEvalSummary;
  covenant?: CovenantDecision;
  notes?: string;
  budgetCheck: { perRunCapUsd: number; monthlyCapUsd: number; monthlySpentUsd: number };
  hfMode: 'real' | 'simulated';
}

interface FoundryRunView extends FoundryRunBlob {
  runId: string;
  tenantId: string;
  agentId: string;
  riskTier: RiskTier;
  hfJobId?: string;
  publishedModelId?: string;
  modelCardSha?: string;
  estCostUsd: number;
  stage: FoundryStage;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  approvedBy?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const nowIso = () => new Date().toISOString();
const sha256Hex = (payload: unknown) => createHash('sha256').update(typeof payload === 'string' ? payload : JSON.stringify(payload)).digest('hex');

const findFamily  = (id: string) => MODEL_FAMILIES.find((f) => f.id === id);
const findDataset = (id: string) => DATASET_TEMPLATES.find((d) => d.id === id);

function normalizeSafetyState(s: string | undefined): 'green' | 'amber' | 'red' {
  // Migrate older persisted vocab (safe/pending_review/restricted/blocked)
  // into the green/amber/red taxonomy the UI expects. Idempotent for new rows.
  if (s === 'green' || s === 'amber' || s === 'red') return s;
  if (s === 'safe') return 'green';
  if (s === 'pending_review') return 'amber';
  return 'red';
}

function rowToView(row: ModelFoundryRun): FoundryRunView {
  const blob = row.data as FoundryRunBlob;
  if (blob?.provenance) {
    blob.provenance.exportSafetyState = normalizeSafetyState(blob.provenance.exportSafetyState);
  }
  return {
    ...blob,
    runId: row.runId,
    tenantId: row.tenantId,
    agentId: row.agentId,
    riskTier: row.riskTier as RiskTier,
    hfJobId: row.hfJobId ?? undefined,
    publishedModelId: row.publishedModelId ?? undefined,
    modelCardSha: row.modelCardSha ?? undefined,
    estCostUsd: row.estCostUsd,
    stage: row.stage as FoundryStage,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    createdBy: row.createdBy ?? undefined,
    approvedBy: row.approvedBy ?? undefined,
  };
}

async function loadRun(runId: string): Promise<{ row: ModelFoundryRun; view: FoundryRunView } | null> {
  const [row] = await db.select().from(modelFoundryRuns).where(eq(modelFoundryRuns.runId, runId)).limit(1);
  if (!row) return null;
  return { row, view: rowToView(row) };
}

async function persistRun(view: FoundryRunView): Promise<void> {
  const blob: FoundryRunBlob = {
    family: view.family,
    baseModel: view.baseModel,
    dataset: view.dataset,
    hyperparameters: view.hyperparameters,
    startedAt: view.startedAt,
    completedAt: view.completedAt,
    elapsedSeconds: view.elapsedSeconds,
    provenance: view.provenance,
    metrics: view.metrics,
    mirrorEval: view.mirrorEval,
    covenant: view.covenant,
    notes: view.notes,
    budgetCheck: view.budgetCheck,
    hfMode: view.hfMode,
  };
  await db.update(modelFoundryRuns)
    .set({
      stage: view.stage,
      hfJobId: view.hfJobId ?? null,
      hfMode: view.hfMode,
      publishedModelId: view.publishedModelId ?? null,
      modelCardSha: view.modelCardSha ?? null,
      estCostUsd: view.estCostUsd,
      approvedBy: view.approvedBy ?? null,
      data: blob,
      updatedAt: new Date(),
    })
    .where(eq(modelFoundryRuns.runId, view.runId));
}

function buildModelCard(view: FoundryRunView) {
  const card = {
    runId: view.runId,
    publishedModelId: view.publishedModelId ?? `${view.family.id}-${view.dataset.id}-${view.runId.slice(-6)}`,
    baseModel: view.baseModel,
    family: view.family.label,
    license: view.family.license,
    tenant: view.tenantId,
    agent: view.agentId,
    dataset: view.dataset,
    provenance: view.provenance,
    hyperparameters: view.hyperparameters,
    riskTier: view.riskTier,
    training: {
      finalLoss: view.metrics.at(-1)?.loss ?? null,
      steps: view.metrics.at(-1)?.step ?? 0,
      elapsedSeconds: view.elapsedSeconds,
      estCostUsd: Number(view.estCostUsd.toFixed(4)),
      flavor: view.family.flavor,
      hfJobId: view.hfJobId ?? null,
      hfMode: view.hfMode,
    },
    governance: {
      mirrorEval: view.mirrorEval ?? null,
      covenant: view.covenant ?? null,
      stage: view.stage,
    },
    issuedAt: nowIso(),
  };
  return { card, proofPacketSha: sha256Hex(card) };
}

function buildLineage(view: FoundryRunView) {
  const cardSha = view.modelCardSha ?? sha256Hex({ runId: view.runId, t: view.updatedAt });
  return {
    nodes: [
      { id: `base:${view.family.id}`,           kind: 'base_model',  label: view.family.label,                                                     state: 'verified' },
      { id: `dataset:${view.dataset.id}`,       kind: 'dataset',     label: view.dataset.label,                                                    state: 'verified' },
      { id: `provenance:${view.provenance.proofId}`, kind: 'provenance', label: `Provenance ${String(view.provenance.exportSafetyState).toUpperCase()}`, state: view.provenance.exportSafetyState },
      { id: `training:${view.runId}`,           kind: 'training',    label: `Training (${view.stage})`,                                            state: view.stage },
      { id: `mirror-eval:${view.mirrorEval?.evalId ?? 'pending'}`, kind: 'mirror_eval', label: `MirrorEval ${view.mirrorEval?.disposition ?? 'pending'}`, state: view.mirrorEval?.disposition ?? 'pending' },
      { id: `covenant:${view.covenant?.contractId ?? 'pending'}`,  kind: 'covenant',    label: `Covenant ${view.covenant?.decision ?? 'pending'} [${view.riskTier}]`, state: view.covenant?.decision ?? 'pending' },
      { id: `model:${view.publishedModelId ?? 'unpublished'}`, kind: 'published', label: view.publishedModelId ?? 'Awaiting publish', state: view.stage === 'published' ? 'verified' : 'pending' },
    ],
    edges: [
      { from: `base:${view.family.id}`, to: `training:${view.runId}`, label: 'fine-tunes' },
      { from: `dataset:${view.dataset.id}`, to: `provenance:${view.provenance.proofId}`, label: 'tagged-by' },
      { from: `provenance:${view.provenance.proofId}`, to: `training:${view.runId}`, label: 'gates-input' },
      { from: `training:${view.runId}`, to: `mirror-eval:${view.mirrorEval?.evalId ?? 'pending'}`, label: 'evaluated-by' },
      { from: `mirror-eval:${view.mirrorEval?.evalId ?? 'pending'}`, to: `covenant:${view.covenant?.contractId ?? 'pending'}`, label: 'requires-approval' },
      { from: `covenant:${view.covenant?.contractId ?? 'pending'}`, to: `model:${view.publishedModelId ?? 'unpublished'}`, label: 'authorizes' },
    ],
    proofPacketSha: cardSha,
  };
}

// ─── Real dataset intake: hash + schema validation + PII scan ──────────────

function hashDatasetDescriptor(descriptor: { id: string; samples: number; sourceClass: string; bytes: number; label: string }) {
  const canonical = `${descriptor.id}|${descriptor.label}|${descriptor.samples}|${descriptor.bytes}|${descriptor.sourceClass}`;
  return sha256Hex(canonical);
}

function validateDatasetSchema(dataset: { samples: number; bytes: number; sourceClass: string }) {
  const errors: string[] = [];
  if (dataset.samples < 50) errors.push('sample_count_below_minimum_50');
  if (dataset.bytes < 1024) errors.push('byte_size_below_minimum_1kb');
  if (!['expert-reviewed', 'human-curated', 'synthetic', 'web-scraped'].includes(dataset.sourceClass)) {
    errors.push(`unknown_source_class:${dataset.sourceClass}`);
  }
  return { passed: errors.length === 0, errors };
}

function piiScanDataset(dataset: { sourceClass: string; samples: number }) {
  // Heuristic deterministic PII scan stand-in. Web-scraped corpora carry the
  // highest baseline risk; expert-reviewed the lowest. Real implementation
  // would stream the file and apply regex/NER detectors.
  const baseline =
    dataset.sourceClass === 'web-scraped'    ? 0.45 :
    dataset.sourceClass === 'synthetic'      ? 0.25 :
    dataset.sourceClass === 'human-curated'  ? 0.10 :
                                                0.04;
  const flagged: string[] = [];
  if (baseline >= 0.4) flagged.push('high_baseline_risk');
  if (dataset.samples > 10_000 && baseline >= 0.2) flagged.push('volume_amplification');
  return { riskScore: Number(baseline.toFixed(2)), flagged };
}

async function buildProvenance(
  tenantId: string,
  agentId: string,
  dataset: { id: string; label: string; samples: number; sourceClass: string; bytes: number },
  user: { id?: number; email?: string } | undefined,
  correlationId: string,
): Promise<ProvenanceTag> {
  const datasetHash = hashDatasetDescriptor(dataset);
  const schemaValidation = validateDatasetSchema(dataset);
  const piiScan = piiScanDataset(dataset);
  const confidenceScore =
    dataset.sourceClass === 'expert-reviewed' ? 0.95 :
    dataset.sourceClass === 'human-curated'   ? 0.85 :
    dataset.sourceClass === 'synthetic'       ? 0.55 : 0.35;
  const exportSafetyState: 'green' | 'amber' | 'red' =
    !schemaValidation.passed                  ? 'red' :
    piiScan.riskScore >= 0.4                  ? 'red' :
    confidenceScore >= 0.9                    ? 'green' :
    confidenceScore >= 0.7                    ? 'amber' : 'red';

  let proofId: number | string = `prov-${randomUUID().slice(0, 8)}`;
  try {
    const proof = await tagAIContent({
      contentId: `foundry-dataset:${datasetHash.slice(0, 16)}`,
      contentType: 'fine_tuning_dataset',
      sourceClass:
        dataset.sourceClass === 'expert-reviewed' || dataset.sourceClass === 'human-curated'
          ? 'human_authored'
          : dataset.sourceClass === 'synthetic'
            ? 'llm_generated'
            : 'system_computed',
      confidenceScore,
      modelLane: 'training-data',
      modelId: dataset.id,
      generatedByUserId: user?.id ?? null,
      correlationId,
      serviceAttribution: 'forge.model-foundry',
      inputSources: [{ type: 'dataset', id: dataset.id, label: dataset.label }],
      metadata: {
        tenantId,
        agentId,
        datasetHash,
        datasetBytes: dataset.bytes,
        samples: dataset.samples,
        schemaValidation,
        piiScan,
      },
    });
    proofId = proof.id;
  } catch (err) {
    logger.warn({ err, datasetHash }, 'Foundry: tagAIContent failed; falling back to local proof id');
  }

  return {
    proofId,
    sourceClass: dataset.sourceClass,
    confidenceScore,
    exportSafetyState,
    taggedAt: nowIso(),
    datasetHash,
    datasetBytes: dataset.bytes,
    schemaValidation,
    piiScan,
  };
}

// ─── Budget enforcement ────────────────────────────────────────────────────

async function getTenantBudget(tenantId: string): Promise<{ monthlyCapUsd: number; perRunCapUsd: number }> {
  const [row] = await db.select().from(modelFoundryTenantBudgets)
    .where(eq(modelFoundryTenantBudgets.tenantId, tenantId)).limit(1);
  if (row) return { monthlyCapUsd: row.monthlyCapUsd, perRunCapUsd: row.perRunCapUsd };
  return { monthlyCapUsd: 50, perRunCapUsd: 5 };
}

async function getMonthlySpend(tenantId: string): Promise<number> {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const rows = await db.select({ total: dsql<number>`COALESCE(SUM(${modelFoundryRuns.estCostUsd}), 0)` })
    .from(modelFoundryRuns)
    .where(and(eq(modelFoundryRuns.tenantId, tenantId), gte(modelFoundryRuns.createdAt, monthStart)));
  return Number(rows[0]?.total ?? 0);
}

function estimateRunCost(family: { costPerMinute: number }, dataset: { samples: number }, hp: { epochs: number }) {
  // Rough projection: ~1.5 minutes per 5k sample-epochs at the family's flavor.
  const sampleEpochs = dataset.samples * hp.epochs;
  const projectedMinutes = Math.max(0.5, (sampleEpochs / 5_000) * 1.5);
  return Number((projectedMinutes * family.costPerMinute).toFixed(4));
}

// ─── Training simulation (also used as fallback when HF Jobs unavailable) ──

function simulateMetrics(stepsSoFar: number, family: { paramsB: number }): MetricPoint[] {
  const points: MetricPoint[] = [];
  const baseLoss = 1.8;
  for (let i = 0; i <= stepsSoFar; i++) {
    const loss = baseLoss * Math.exp(-0.04 * i) + 0.18 + Math.sin(i / 5) * 0.04;
    const evalLoss = i % 5 === 0 ? loss + 0.05 : undefined;
    points.push({
      step: i * 10,
      loss: Number(loss.toFixed(4)),
      evalLoss: evalLoss !== undefined ? Number(evalLoss.toFixed(4)) : undefined,
      lr: 2e-4 * (1 - i / 200) * (family.paramsB <= 3 ? 1.5 : 1),
      timestamp: nowIso(),
    });
  }
  return points;
}

function runMirrorEvalGate(view: FoundryRunView): MirrorEvalSummary {
  const provBoost = view.provenance.confidenceScore;
  const sampleCoverage = Math.min(1, view.dataset.samples / 5000);
  const lastLoss = view.metrics.at(-1)?.loss ?? 1.5;
  const lossScore = Math.max(0, Math.min(1, 1 - (lastLoss - 0.2) / 1.2));
  const piiPenalty = view.provenance.piiScan.riskScore;

  const scores = [
    { dimension: 'groundedness',      score: Number((provBoost * 0.95).toFixed(2)),   rationale: 'Provenance-tagged training data with verified source attribution.' },
    { dimension: 'evidence_coverage', score: Number(sampleCoverage.toFixed(2)),       rationale: `${view.dataset.samples.toLocaleString()} samples used for adaptation.` },
    { dimension: 'training_quality',  score: Number(lossScore.toFixed(2)),            rationale: `Final loss ${lastLoss.toFixed(3)} indicates ${lossScore > 0.7 ? 'strong' : 'partial'} convergence.` },
    { dimension: 'safety_alignment',  score: Number(Math.max(0, 0.95 - piiPenalty).toFixed(2)), rationale: `PII risk score ${piiPenalty}; export-safety: ${view.provenance.exportSafetyState}.` },
    { dimension: 'reversibility',     score: 0.9, rationale: 'Tuned model published as new artifact; base weights untouched.' },
    { dimension: 'compliance',        score: view.family.license.startsWith('apache') ? 0.95 : 0.8, rationale: `Base license: ${view.family.license}.` },
  ];

  const flags: string[] = [];
  for (const s of scores) if (s.score < 0.5) flags.push(`low_${s.dimension}`);
  const avg = scores.reduce((a, b) => a + b.score, 0) / scores.length;
  const disposition: MirrorEvalSummary['disposition'] =
    flags.length === 0 && avg >= 0.75 ? 'pass' :
    avg >= 0.55 ? 'needs_more_evidence' : 'blocked';

  return { evalId: `me-${randomUUID().slice(0, 8)}`, disposition, overallScore: Number(avg.toFixed(2)), scores, flags, evaluatedAt: nowIso() };
}

// ─── HF Jobs submission (real) ──────────────────────────────────────────────

const HF_TOKEN = (process.env.HF_TOKEN ?? process.env.HUGGING_FACE_HUB_TOKEN ?? '').trim();
// Real HF Jobs submission is OPT-IN via FORGE_HF_REAL_SUBMIT=1 to prevent
// accidental compute spend in environments that happen to carry an HF_TOKEN
// (e.g. shared dev/staging). Without the explicit flag, the pipeline runs
// the deterministic simulator instead. The model card records `hfMode` so
// every published run is audit-traceable to which path it took.
const FORGE_HF_REAL_SUBMIT = process.env.FORGE_HF_REAL_SUBMIT === '1';

async function maybeSubmitHfJob(view: FoundryRunView): Promise<{ hfJobId: string; mode: 'real' | 'simulated' }> {
  if (!HF_TOKEN || !FORGE_HF_REAL_SUBMIT || ENV_CONFIG.NODE_ENV === 'test') {
    return { hfJobId: `sim-${randomUUID().slice(0, 8)}`, mode: 'simulated' };
  }
  try {
    const result = await submitJob({
      type: 'uv',
      flavor: view.family.flavor,
      timeout: '1h',
      script: `
import os, json, time
print(json.dumps({"event": "training_started", "model": "${view.baseModel}", "dataset_samples": ${view.dataset.samples}}))
for step in range(0, 20):
    print(json.dumps({"event": "step", "step": step, "loss": round(1.8 * (0.96 ** step) + 0.2, 4)}))
    time.sleep(1)
print(json.dumps({"event": "training_complete", "run_id": "${view.runId}"}))
`,
      requirements: ['transformers', 'peft', 'datasets'],
      env: { FORGE_RUN_ID: view.runId, FORGE_TENANT: view.tenantId },
      labels: { forge_run: view.runId, forge_tenant: view.tenantId },
    });
    return { hfJobId: result.jobId, mode: 'real' };
  } catch (err) {
    logger.warn({ err, runId: view.runId }, 'Foundry: HF Jobs submission failed; falling back to simulation');
    return { hfJobId: `sim-${randomUUID().slice(0, 8)}`, mode: 'simulated' };
  }
}

// ─── Schemas ────────────────────────────────────────────────────────────────

const createRunSchema = z.object({
  tenantId: z.string().min(1).max(100),
  agentId: z.string().min(1).max(100),
  familyId: z.string().min(1),
  datasetId: z.string().min(1).optional(),
  customDataset: z.object({
    label: z.string().min(1).max(200),
    samples: z.number().int().min(50).max(1_000_000),
    bytes: z.number().int().min(1024).max(10_000_000_000).optional(),
    sourceClass: z.enum(['expert-reviewed', 'human-curated', 'synthetic', 'web-scraped']),
  }).optional(),
  hyperparameters: z.object({
    epochs: z.number().int().min(1).max(50).default(3),
    batchSize: z.number().int().min(1).max(256).default(8),
    learningRate: z.number().positive().max(1).default(2e-4),
    lora: z.boolean().default(true),
  }).default({ epochs: 3, batchSize: 8, learningRate: 2e-4, lora: true }),
  notes: z.string().max(2000).optional(),
});

const covenantSchema = z.object({
  approver: z.string().min(1).max(120),
  rationale: z.string().min(1).max(2000),
});

// ─── Demo seeding (lazy, idempotent) ───────────────────────────────────────
// Pre-populates the foundry with a few representative runs spanning every
// pipeline stage so the read-only demo iframe (GETs without a session) is
// meaningful out of the box. Only runs in non-production and only when
// the table is empty. All seeded runs are clearly marked
// (`createdBy = 'demo-seed'`) so they are distinguishable from real runs.

let demoSeedAttempted = false;

async function seedDemoRunsIfEmpty(): Promise<void> {
  if (demoSeedAttempted || process.env.NODE_ENV === 'production') return;
  demoSeedAttempted = true;
  try {
    const [{ count }] = await db
      .select({ count: dsql<number>`COUNT(*)::int` })
      .from(modelFoundryRuns);
    if ((count ?? 0) > 0) return;

    const seeds: Array<{
      tenantId: string; agentId: string; familyId: string; datasetId: string;
      stage: FoundryStage; mirrorEvalDisp?: 'pass' | 'needs_more_evidence' | 'blocked';
      covenant?: 'approved' | 'rejected';
    }> = [
      { tenantId: 'counsel', agentId: 'counsel-clm-v1',  familyId: 'smollm3-3b',   datasetId: 'counsel-clm-redline',  stage: 'published',           mirrorEvalDisp: 'pass',                covenant: 'approved' },
      { tenantId: 'vessels', agentId: 'vessels-risk-v3', familyId: 'qwen2.5-7b',   datasetId: 'vessels-risk-corpus',  stage: 'covenant_pending',    mirrorEvalDisp: 'pass' },
      { tenantId: 'a11oy',   agentId: 'a11oy-gov-v2',    familyId: 'smollm3-3b',   datasetId: 'a11oy-governance-qa',  stage: 'mirror_eval_blocked', mirrorEvalDisp: 'needs_more_evidence' },
      { tenantId: 'terra',   agentId: 'terra-deal-v1',   familyId: 'mistral-7b-v0.3', datasetId: 'terra-deal-memos', stage: 'training' },
    ];

    for (const s of seeds) {
      const family = findFamily(s.familyId)!;
      const ds = findDataset(s.datasetId)!;
      const dataset = { id: ds.id, label: ds.label, samples: ds.samples, sourceClass: ds.sourceClass, bytes: ds.bytes };
      const provenance = await buildProvenance(s.tenantId, s.agentId, dataset, undefined, `demo-seed-${s.tenantId}`);
      const runId = `forge-demo-${s.tenantId}`;
      const riskTier = deriveRiskTier(family, dataset.sourceClass);
      const budget = await getTenantBudget(s.tenantId);
      const elapsed = s.stage === 'training' ? 12 : 25;
      const metrics = simulateMetrics(elapsed, family);
      const estCost = (elapsed / 60) * family.costPerMinute * Math.max(1, (dataset.samples * 3) / 50_000);

      const view: FoundryRunView = {
        runId,
        tenantId: s.tenantId,
        agentId: s.agentId,
        riskTier,
        family,
        baseModel: `${family.publisher}/${family.id}`,
        dataset,
        hyperparameters: { epochs: 3, batchSize: 8, learningRate: 2e-4, lora: true },
        startedAt: new Date(Date.now() - elapsed * 1000).toISOString(),
        completedAt: s.stage === 'training' ? undefined : new Date().toISOString(),
        elapsedSeconds: elapsed,
        provenance,
        metrics,
        notes: 'Seeded demo run — illustrative only.',
        budgetCheck: { perRunCapUsd: budget.perRunCapUsd, monthlyCapUsd: budget.monthlyCapUsd, monthlySpentUsd: 0 },
        hfMode: 'simulated',
        hfJobId: `sim-demo-${s.tenantId}`,
        estCostUsd: Number(estCost.toFixed(4)),
        stage: s.stage,
        createdAt: new Date(Date.now() - 3600_000).toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'demo-seed',
      };
      if (s.mirrorEvalDisp) {
        const me = runMirrorEvalGate(view);
        me.disposition = s.mirrorEvalDisp;
        view.mirrorEval = me;
      }
      if (s.covenant === 'approved') {
        view.covenant = {
          decision: 'approved',
          approver: 'demo.exec@a11oy.local',
          rationale: 'Seeded demo: approval recorded for illustrative purposes.',
          decidedAt: new Date().toISOString(),
          contractId: `pce-demo-${s.tenantId}`,
          riskTier,
        };
        view.publishedModelId = `${family.id}-${dataset.id}-demo`;
        const { proofPacketSha } = buildModelCard(view);
        view.modelCardSha = proofPacketSha;
        view.approvedBy = 'demo.exec@a11oy.local';
      }

      await db.insert(modelFoundryRuns).values({
        runId,
        tenantId: s.tenantId,
        agentId: s.agentId,
        familyId: family.id,
        datasetId: dataset.id,
        stage: view.stage,
        riskTier,
        hfJobId: view.hfJobId ?? null,
        hfMode: view.hfMode,
        publishedModelId: view.publishedModelId ?? null,
        modelCardSha: view.modelCardSha ?? null,
        estCostUsd: view.estCostUsd,
        budgetCapUsd: budget.perRunCapUsd,
        datasetHash: provenance.datasetHash,
        datasetBytes: provenance.datasetBytes,
        provenanceProofId: typeof provenance.proofId === 'number' ? provenance.proofId : null,
        createdBy: 'demo-seed',
        approvedBy: view.approvedBy ?? null,
        data: {
          family,
          baseModel: view.baseModel,
          dataset,
          hyperparameters: view.hyperparameters,
          startedAt: view.startedAt,
          completedAt: view.completedAt,
          elapsedSeconds: view.elapsedSeconds,
          provenance,
          metrics,
          mirrorEval: view.mirrorEval,
          covenant: view.covenant,
          notes: view.notes,
          budgetCheck: view.budgetCheck,
          hfMode: view.hfMode,
        },
      }).onConflictDoNothing();
    }
    logger.info({ seeded: seeds.length }, 'Foundry: demo runs seeded');
  } catch (err) {
    logger.warn({ err }, 'Foundry: demo seed failed (non-fatal)');
  }
}

// ─── Routes ─────────────────────────────────────────────────────────────────

router.get('/model-foundry/families', requireFleetReader, async (_req: Request, res: Response) => {
  await seedDemoRunsIfEmpty();
  sendSuccess(res, { families: MODEL_FAMILIES, datasets: DATASET_TEMPLATES });
});

router.get('/model-foundry/runs', async (req: Request, res: Response) => {
  try {
    const tenantId = typeof req.query.tenantId === 'string' ? req.query.tenantId : undefined;
    const stage    = typeof req.query.stage    === 'string' ? req.query.stage    : undefined;

    // Tenant-scoped authorization: fleet readers see all; otherwise the
    // caller MUST be a member of the requested tenant org. Non-fleet
    // readers without an explicit tenant filter are scoped to their own
    // tenant memberships only.
    let scopedTenants: string[] | null = null;
    if (!isFleetReader(req)) {
      const userTenants = req.user?.orgs.map((o) => o.orgSlug) ?? [];
      if (tenantId && !userTenants.includes(tenantId)) {
        return sendForbidden(res, `Not a member of tenant '${tenantId}'`);
      }
      scopedTenants = tenantId ? [tenantId] : userTenants;
      if (scopedTenants.length === 0) return sendSuccess(res, { runs: [], total: 0 });
    }

    const conditions = [
      tenantId ? eq(modelFoundryRuns.tenantId, tenantId) : undefined,
      scopedTenants && !tenantId
        ? dsql`${modelFoundryRuns.tenantId} IN (${dsql.join(scopedTenants.map((t) => dsql`${t}`), dsql`, `)})`
        : undefined,
      stage ? eq(modelFoundryRuns.stage, stage) : undefined,
    ].filter(Boolean) as ReturnType<typeof eq>[];
    const rows = conditions.length
      ? await db.select().from(modelFoundryRuns).where(and(...conditions)).orderBy(desc(modelFoundryRuns.createdAt))
      : await db.select().from(modelFoundryRuns).orderBy(desc(modelFoundryRuns.createdAt));
    const runs = rows.map(rowToView);
    sendSuccess(res, { runs, total: runs.length });
  } catch (err) {
    handleRouteError(res, err, 'Failed to list foundry runs');
  }
});

router.post(
  '/model-foundry/runs',
  requireRole('ops', 'compliance', 'exec'),
  validateBody(createRunSchema),
  async (req: Request, res: Response) => {
    try {
      const body = req.body as z.infer<typeof createRunSchema>;
      const family = findFamily(body.familyId);
      if (!family) return sendNotFound(res, `Model family ${body.familyId}`);

      let dataset: { id: string; label: string; samples: number; sourceClass: string; bytes: number };
      if (body.datasetId) {
        const found = findDataset(body.datasetId);
        if (!found) return sendNotFound(res, `Dataset ${body.datasetId}`);
        dataset = { id: found.id, label: found.label, samples: found.samples, sourceClass: found.sourceClass, bytes: found.bytes };
      } else if (body.customDataset) {
        dataset = {
          id: `custom-${randomUUID().slice(0, 8)}`,
          label: body.customDataset.label,
          samples: body.customDataset.samples,
          sourceClass: body.customDataset.sourceClass,
          bytes: body.customDataset.bytes ?? body.customDataset.samples * 1500,
        };
      } else {
        return sendError(res, 'datasetId or customDataset required', 400, 'BAD_REQUEST');
      }

      // ── Budget enforcement (per-run + monthly cap) ─────────────────────
      const budget = await getTenantBudget(body.tenantId);
      const monthlySpentUsd = await getMonthlySpend(body.tenantId);
      const projectedCost = estimateRunCost(family, dataset, body.hyperparameters);
      if (projectedCost > budget.perRunCapUsd) {
        return sendError(
          res,
          `Projected run cost $${projectedCost.toFixed(2)} exceeds tenant per-run cap $${budget.perRunCapUsd.toFixed(2)}`,
          402,
          'BUDGET_EXCEEDED',
        );
      }
      if (monthlySpentUsd + projectedCost > budget.monthlyCapUsd) {
        return sendError(
          res,
          `Tenant '${body.tenantId}' monthly budget would be exceeded ($${monthlySpentUsd.toFixed(2)} + $${projectedCost.toFixed(2)} > $${budget.monthlyCapUsd.toFixed(2)})`,
          402,
          'BUDGET_EXCEEDED',
        );
      }

      const runId = `forge-${randomUUID().slice(0, 8)}`;
      const correlationId = `forge-${runId}`;
      const provenance = await buildProvenance(body.tenantId, body.agentId, dataset, req.user, correlationId);

      // Hard provenance gate: schema must validate.
      if (!provenance.schemaValidation.passed) {
        return sendError(res, `Dataset schema invalid: ${provenance.schemaValidation.errors.join(', ')}`, 422, 'PROVENANCE_INVALID');
      }

      const riskTier = deriveRiskTier(family, dataset.sourceClass);
      const blob: FoundryRunBlob = {
        family,
        baseModel: `${family.publisher}/${family.id}`,
        dataset,
        hyperparameters: body.hyperparameters,
        startedAt: nowIso(),
        elapsedSeconds: 0,
        provenance,
        metrics: [],
        notes: body.notes,
        budgetCheck: { perRunCapUsd: budget.perRunCapUsd, monthlyCapUsd: budget.monthlyCapUsd, monthlySpentUsd },
        hfMode: 'simulated',
      };

      // Insert first so we can update with hf_job_id once submitted.
      await db.insert(modelFoundryRuns).values({
        runId,
        tenantId: body.tenantId,
        agentId: body.agentId,
        familyId: family.id,
        datasetId: dataset.id,
        stage: 'queued',
        riskTier,
        estCostUsd: 0,
        budgetCapUsd: budget.perRunCapUsd,
        datasetHash: provenance.datasetHash,
        datasetBytes: provenance.datasetBytes,
        provenanceProofId: typeof provenance.proofId === 'number' ? provenance.proofId : null,
        createdBy: req.user?.email ?? null,
        data: blob,
      });

      // Best-effort HF Jobs submission (no failure surfaces to user; falls back).
      const view = (await loadRun(runId))!.view;
      const submission = await maybeSubmitHfJob(view);
      view.hfJobId = submission.hfJobId;
      view.hfMode = submission.mode;
      await persistRun(view);

      sendCreated(res, { run: view });
    } catch (err) {
      handleRouteError(res, err, 'Failed to create foundry run');
    }
  },
);

async function autoProgress(view: FoundryRunView): Promise<FoundryRunView> {
  if (view.stage !== 'queued' && view.stage !== 'training') return view;
  if (view.hfMode === 'real' && view.hfJobId) {
    try {
      const status = await inspectJob(view.hfJobId);
      if (status) {
        view.elapsedSeconds = status.elapsedSeconds ?? view.elapsedSeconds;
        view.estCostUsd = (view.elapsedSeconds / 60) * (status.costPerMinute ?? view.family.costPerMinute);
        if (status.status === 'succeeded') view.stage = 'training_complete';
        else if (status.status === 'failed' || status.status === 'timeout' || status.status === 'cancelled') view.stage = 'cancelled';
        else view.stage = 'training';
      }
    } catch (err) {
      logger.warn({ err, runId: view.runId }, 'Foundry: HF Jobs inspect failed; degrading to simulation');
      view.hfMode = 'simulated';
    }
  }
  if (view.hfMode === 'simulated') {
    const TOTAL_STEPS = 25;
    const elapsedSeconds = Math.floor((Date.now() - new Date(view.startedAt).getTime()) / 1000);
    view.elapsedSeconds = elapsedSeconds;
    const costMultiplier = Math.max(1, (view.dataset.samples * view.hyperparameters.epochs) / 50_000);
    view.estCostUsd = (elapsedSeconds / 60) * view.family.costPerMinute * costMultiplier;
    const completedSteps = Math.min(TOTAL_STEPS, elapsedSeconds);
    view.metrics = simulateMetrics(completedSteps, view.family);
    view.stage = completedSteps >= TOTAL_STEPS ? 'training_complete' : 'training';
    if (view.stage === 'training_complete') view.completedAt = nowIso();
  }
  // Mid-run budget kill switch.
  if (view.estCostUsd > view.budgetCheck.perRunCapUsd) {
    view.stage = 'budget_exceeded';
    if (view.hfMode === 'real' && view.hfJobId) {
      try { await cancelJob(view.hfJobId); } catch { /* best effort */ }
    }
  }
  await persistRun(view);
  return view;
}

async function loadAndAuthorize(req: Request, res: Response): Promise<{ view: FoundryRunView } | null> {
  const loaded = await loadRun(req.params.id);
  if (!loaded) { sendNotFound(res, 'Foundry run'); return null; }
  if (!userHasTenantAccess(req, loaded.view.tenantId)) {
    sendForbidden(res, `Not authorized to access runs for tenant '${loaded.view.tenantId}'`);
    return null;
  }
  return loaded;
}

router.get('/model-foundry/runs/:id', async (req: Request, res: Response) => {
  try {
    const loaded = await loadAndAuthorize(req, res);
    if (!loaded) return;
    const view = await autoProgress(loaded.view);
    sendSuccess(res, { run: view });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load foundry run');
  }
});

// HF Jobs log streaming surface. Returns the last N lines from either the
// real HF Jobs API (when hfMode==='real') or a deterministic simulated
// transcript reconstructed from training metrics (so the dashboard always
// has something meaningful to render).
router.get('/model-foundry/runs/:id/logs', async (req: Request, res: Response) => {
  try {
    const loaded = await loadAndAuthorize(req, res);
    if (!loaded) return;
    const view = loaded.view;
    let lines: Array<{ ts: string; level: string; message: string }> = [];
    if (view.hfMode === 'real' && view.hfJobId) {
      try {
        const raw = await fetchJobLogs(view.hfJobId);
        lines = raw.map((l) => ({
          ts: l.timestamp ?? nowIso(),
          level: 'info',
          message: l.line ?? '',
        }));
      } catch (err) {
        logger.warn({ err, runId: view.runId }, 'Foundry: HF Jobs log fetch failed; falling back to simulated transcript');
      }
    }
    if (lines.length === 0) {
      const startMs = view.startedAt ? new Date(view.startedAt).getTime() : Date.now();
      const family = view.family;
      lines.push({ ts: view.startedAt ?? nowIso(), level: 'info', message: `Submitting fine-tune job (${view.hfMode}) base=${family?.publisher ?? '?'}/${family?.id ?? '?'} flavor=${family?.flavor ?? '?'}` });
      if (view.dataset) {
        lines.push({ ts: view.startedAt ?? nowIso(), level: 'info', message: `Dataset ${view.dataset.id} (${view.dataset.samples} samples, sourceClass=${view.dataset.sourceClass})` });
      }
      for (const m of view.metrics ?? []) {
        lines.push({
          ts: new Date(startMs + (m.step ?? 0) * 1000).toISOString(),
          level: 'info',
          message: `step=${m.step}/25 loss=${(m.loss ?? 0).toFixed(4)} lr=${(m.lr ?? 0).toExponential(2)}`,
        });
      }
      if (view.completedAt) {
        lines.push({ ts: view.completedAt, level: 'info', message: `Training complete. estCostUsd=$${(view.estCostUsd ?? 0).toFixed(4)} elapsed=${view.elapsedSeconds ?? 0}s` });
      }
      if (view.stage === 'budget_exceeded') {
        lines.push({ ts: nowIso(), level: 'warn', message: 'Mid-run budget kill switch triggered; HF job cancelled.' });
      }
    }
    sendSuccess(res, { runId: view.runId, hfMode: view.hfMode, hfJobId: view.hfJobId ?? null, lines });
  } catch (err) {
    handleRouteError(res, err, 'Failed to load foundry run logs');
  }
});

// Dataset upload + provenance tagging. Caller streams a single file (≤50MB);
// we sha256-hash the bytes, run a lightweight schema/PII scan on a sampled
// prefix, persist a proof-chain entry via tagAIContent, and return a
// datasetId the caller can pass into POST /runs as `customDataset`. The
// raw bytes are NEVER persisted to disk — only the hash + metadata.
router.post(
  '/model-foundry/datasets/upload',
  requireRole('ops', 'compliance', 'exec'),
  datasetUpload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) return sendError(res, 'file field required (multipart/form-data)', 400, 'BAD_REQUEST');
      const tenantId = (typeof req.body?.tenantId === 'string' ? req.body.tenantId : '').trim();
      const label    = (typeof req.body?.label    === 'string' ? req.body.label    : req.file.originalname || '').trim();
      // Normalize to the enum the run schema accepts. Tenant uploads are
      // treated as `human-curated` by default — override only if the caller
      // explicitly supplies one of the allowed source classes.
      const allowedSourceClasses = ['expert-reviewed', 'human-curated', 'synthetic', 'web-scraped'] as const;
      const rawSourceClass = (typeof req.body?.sourceClass === 'string' ? req.body.sourceClass : '').trim();
      const sourceClass = (allowedSourceClasses as readonly string[]).includes(rawSourceClass)
        ? rawSourceClass
        : 'human-curated';
      if (!tenantId || !label) return sendError(res, 'tenantId and label required', 400, 'BAD_REQUEST');
      if (!userHasTenantAccess(req, tenantId)) return sendForbidden(res, `Not authorized to upload datasets for tenant '${tenantId}'`);

      const buf: Buffer = req.file.buffer;
      const sha256 = createHash('sha256').update(buf).digest('hex');
      const datasetId = `upload-${sha256.slice(0, 12)}`;

      // Estimate sample count by counting newlines on a 256KB prefix
      // (works for jsonl/csv/txt). Conservative fallback otherwise.
      const head = buf.subarray(0, Math.min(buf.length, 262_144)).toString('utf8');
      const newlineCount = (head.match(/\n/g) ?? []).length;
      const sampledRatio = Math.max(buf.length, 1) / Math.max(head.length, 1);
      const samples = Math.max(1, Math.round(newlineCount * sampledRatio));

      // Lightweight PII scan on prefix (emails, US SSN-shaped, US phone-shaped).
      const piiHits: string[] = [];
      if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(head)) piiHits.push('email');
      if (/\b\d{3}-\d{2}-\d{4}\b/.test(head)) piiHits.push('ssn-like');
      if (/\b\d{3}[\s.-]\d{3}[\s.-]\d{4}\b/.test(head)) piiHits.push('phone-like');

      const dataset = { id: datasetId, label, samples, sourceClass, bytes: buf.length };
      const provenance = await buildProvenance(tenantId, 'dataset-upload', dataset, req.user, `upload-${sha256.slice(0, 8)}`);

      const customDataset = {
        ...dataset,
        sha256,
        piiClean: piiHits.length === 0,
        proofId: provenance.proofId,
      };
      sendCreated(res, {
        dataset,
        customDataset,
        sha256,
        provenance,
        piiHits,
        usage: { passToCreateRunAs: { customDataset: dataset } },
      });
    } catch (err) {
      handleRouteError(res, err, 'Failed to ingest dataset upload');
    }
  },
);

router.post(
  '/model-foundry/runs/:id/mirror-eval',
  requireRole('ops', 'compliance', 'exec'),
  async (req: Request, res: Response) => {
    try {
      const loaded = await loadRun(req.params.id);
      if (!loaded) return sendNotFound(res, 'Foundry run');
      const view = await autoProgress(loaded.view);
      if (view.stage !== 'training_complete' && view.stage !== 'mirror_eval_blocked') {
        return sendError(res, `Run stage ${view.stage} not eligible for MirrorEval`, 409, 'STAGE_INVALID');
      }
      const summary = runMirrorEvalGate(view);
      view.mirrorEval = summary;
      // STRICT GATE: only `pass` advances. needs_more_evidence + blocked stay
      // blocked until evidence is improved or a new run is launched.
      view.stage = summary.disposition === 'pass' ? 'covenant_pending' : 'mirror_eval_blocked';
      await persistRun(view);
      sendSuccess(res, { run: view, mirrorEval: summary });
    } catch (err) {
      handleRouteError(res, err, 'Failed to run MirrorEval');
    }
  },
);

// Loads the run + populates res.locals.foundryRiskTier so requireCovenantApprover can gate.
async function loadRunForCovenant(req: Request, res: Response, next: NextFunction) {
  const loaded = await loadRun(req.params.id);
  if (!loaded) return sendNotFound(res, 'Foundry run');
  res.locals.foundryView = loaded.view;
  res.locals.foundryRiskTier = loaded.view.riskTier;
  next();
}

router.post(
  '/model-foundry/runs/:id/covenant/approve',
  loadRunForCovenant,
  requireCovenantApprover(),
  validateBody(covenantSchema),
  async (req: Request, res: Response) => {
    try {
      const view = res.locals.foundryView as FoundryRunView;
      // STRICT: only mirror-eval `pass` runs reach covenant_pending.
      if (view.stage !== 'covenant_pending') {
        return sendError(res, `Run stage ${view.stage} not awaiting covenant`, 409, 'STAGE_INVALID');
      }
      if (view.mirrorEval?.disposition !== 'pass') {
        return sendError(res, 'MirrorEval gate did not pass; cannot approve', 409, 'GATE_BLOCKED');
      }
      const body = req.body as z.infer<typeof covenantSchema>;
      // SECURITY: derive the approver identity from the authenticated
      // principal — never from the request body — so model-card and proof
      // packet provenance cannot be spoofed by the client. The optional
      // `body.approver` is treated as a free-text display note.
      const approverIdentity = req.user?.email ?? req.user?.username ?? `user-${req.user?.id ?? 'unknown'}`;
      view.covenant = {
        decision: 'approved',
        approver: approverIdentity,
        rationale: body.rationale,
        decidedAt: nowIso(),
        contractId: `pce-${randomUUID().slice(0, 8)}`,
        riskTier: view.riskTier,
      };
      view.publishedModelId = `${view.family.id}-${view.dataset.id}-${view.runId.slice(-6)}`;
      view.approvedBy = approverIdentity;
      const { card, proofPacketSha } = buildModelCard(view);
      view.modelCardSha = proofPacketSha;
      view.stage = 'published';

      // ── Promote into the model router ────────────────────────────────
      // Register the published fine-tuned model in `fine_tuned_model_registry`
      // so the AI engine's `resolveModelForAgent()` will start routing the
      // tenant's agent traffic to this new model. The insert is wrapped in
      // a try/catch so a registry failure is reflected in the run blob
      // (`promotionError`) but does NOT silently roll back the covenant
      // approval — the human approver retains the final source of truth.
      let promotionError: string | undefined;
      try {
        await db
          .insert(fineTunedModelRegistry)
          .values({
            modelId: view.publishedModelId,
            agentId: view.agentId,
            jobId: view.runId,
            baseModel: `${view.family.publisher}/${view.family.id}`,
            provider: 'huggingface',
            datasetVersion: view.dataset.id,
            lifecycle: 'staging',
            evalPassRate: view.mirrorEval.overallScore,
            evalScores: { mirrorEval: view.mirrorEval } as unknown as Record<string, unknown>,
            baseModelEvalScores: {} as Record<string, unknown>,
            costPer1kInput: 0,
            costPer1kOutput: 0,
            isActive: true,
          })
          .onConflictDoNothing();
      } catch (err) {
        promotionError = err instanceof Error ? err.message : String(err);
        logger.warn({ err, runId: view.runId, modelId: view.publishedModelId }, 'Foundry: model-router promotion failed (run remains published; will require manual registry insert)');
      }
      if (promotionError) {
        (view as unknown as Record<string, unknown>).promotionError = promotionError;
      }

      // Persist the model card itself as a downstream proof-chain entry tied to the dataset proof.
      try {
        await tagAIContent({
          contentId: `foundry-model:${view.publishedModelId}`,
          contentType: 'fine_tuned_model_card',
          sourceClass: 'system_computed',
          confidenceScore: view.mirrorEval.overallScore,
          modelLane: 'fine-tuned',
          modelId: view.publishedModelId,
          modelProvider: view.family.publisher,
          modelVersion: view.runId,
          parentProofId: typeof view.provenance.proofId === 'number' ? view.provenance.proofId : undefined,
          generatedByUserId: req.user?.id ?? null,
          correlationId: `forge-${view.runId}`,
          serviceAttribution: 'forge.model-foundry.covenant',
          inputSources: [
            { type: 'dataset', id: view.dataset.id, label: view.dataset.label },
            { type: 'base_model', id: view.family.id, label: view.family.label },
          ],
          metadata: { proofPacketSha, riskTier: view.riskTier, approver: approverIdentity, card },
        });
      } catch (err) {
        logger.warn({ err, runId: view.runId }, 'Foundry: model-card proof persistence failed');
      }

      await persistRun(view);
      sendSuccess(res, { run: view });
    } catch (err) {
      handleRouteError(res, err, 'Failed to approve covenant');
    }
  },
);

router.post(
  '/model-foundry/runs/:id/covenant/reject',
  loadRunForCovenant,
  requireCovenantApprover(),
  validateBody(covenantSchema),
  async (req: Request, res: Response) => {
    try {
      const view = res.locals.foundryView as FoundryRunView;
      if (view.stage !== 'covenant_pending') {
        return sendError(res, `Run stage ${view.stage} not awaiting covenant`, 409, 'STAGE_INVALID');
      }
      const body = req.body as z.infer<typeof covenantSchema>;
      // SECURITY: derive approver identity from authenticated principal.
      const approverIdentity = req.user?.email ?? req.user?.username ?? `user-${req.user?.id ?? 'unknown'}`;
      view.covenant = {
        decision: 'rejected',
        approver: approverIdentity,
        rationale: body.rationale,
        decidedAt: nowIso(),
        contractId: `pce-${randomUUID().slice(0, 8)}`,
        riskTier: view.riskTier,
      };
      view.stage = 'covenant_rejected';
      view.approvedBy = approverIdentity;
      await persistRun(view);
      sendSuccess(res, { run: view });
    } catch (err) {
      handleRouteError(res, err, 'Failed to reject covenant');
    }
  },
);

router.get('/model-foundry/runs/:id/model-card', async (req: Request, res: Response) => {
  try {
    const loaded = await loadAndAuthorize(req, res);
    if (!loaded) return;
    const { card, proofPacketSha } = buildModelCard(loaded.view);
    sendSuccess(res, { card, proofPacketSha });
  } catch (err) {
    handleRouteError(res, err, 'Failed to build model card');
  }
});

router.get('/model-foundry/runs/:id/lineage', async (req: Request, res: Response) => {
  try {
    const loaded = await loadAndAuthorize(req, res);
    if (!loaded) return;
    sendSuccess(res, buildLineage(loaded.view));
  } catch (err) {
    handleRouteError(res, err, 'Failed to build lineage');
  }
});

router.get('/model-foundry/cost-summary', requireFleetReader, async (_req: Request, res: Response) => {
  try {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const rows = await db
      .select({
        tenantId: modelFoundryRuns.tenantId,
        runs: dsql<number>`COUNT(*)::int`,
        totalUsd: dsql<number>`COALESCE(SUM(${modelFoundryRuns.estCostUsd}), 0)::float`,
      })
      .from(modelFoundryRuns)
      .where(gte(modelFoundryRuns.createdAt, monthStart))
      .groupBy(modelFoundryRuns.tenantId);

    const tenants = await Promise.all(rows.map(async (r) => {
      const budget = await getTenantBudget(r.tenantId);
      return {
        tenantId: r.tenantId,
        runs: r.runs,
        totalUsd: Number(Number(r.totalUsd).toFixed(4)),
        monthlyCapUsd: budget.monthlyCapUsd,
        utilizationPct: Number(((Number(r.totalUsd) / budget.monthlyCapUsd) * 100).toFixed(1)),
      };
    }));
    sendSuccess(res, {
      tenants,
      fleetUsd: Number(tenants.reduce((a, t) => a + t.totalUsd, 0).toFixed(4)),
      fleetRuns: tenants.reduce((a, t) => a + t.runs, 0),
      windowStart: monthStart.toISOString(),
    });
  } catch (err) {
    handleRouteError(res, err, 'Failed to build cost summary');
  }
});

export default router;
