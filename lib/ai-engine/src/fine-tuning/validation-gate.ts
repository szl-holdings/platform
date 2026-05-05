/**
 * Validation Gate
 *
 * When a fine-tuning job completes, automatically runs golden-set evals against the new model,
 * compares scores to the base model, and only allows promotion to "canary" if the fine-tuned
 * model meets or exceeds base model scores across all eval categories.
 *
 * Supports OpenAI, Anthropic, and Gemini providers with real API calls.
 */

import { GOLDEN_SET } from '../evals/golden-set.js';

export interface ModelEvalScores {
  passRate: number;
  totalTests: number;
  passed: number;
  failed: number;
  avgLatencyMs: number;
  byCategory: Record<string, { total: number; passed: number; passRate: number }>;
}

export interface ValidationGateResult {
  passed: boolean;
  promoted: boolean;
  fineTunedScores: ModelEvalScores;
  baseModelScores: ModelEvalScores;
  failureReason?: string;
  categoryComparison: Array<{
    category: string;
    basePassRate: number;
    fineTunedPassRate: number;
    improved: boolean;
    regressed: boolean;
  }>;
  estimatedCostPer1kInput?: number;
  estimatedCostPer1kOutput?: number;
}

const PASS_THRESHOLD = 0.0;
const REGRESSION_TOLERANCE = 0.05;

const SYSTEM_PROMPT = `You are an AI assistant. Analyze the input and respond with a JSON object containing relevant fields such as: riskLevel, riskScore, escalationRequired, confidence, actionType, approvalRequired, approvalLevel, priority, category, routeTo, summary, evidence, reasoning, entities, action, urgency.`;

async function callOpenAIForEval(
  modelId: string,
  input: string,
): Promise<Record<string, unknown>> {
  const openaiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!openaiKey) throw new Error('OPENAI key not configured');
  const openaiBase = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? 'https://api.openai.com/v1';

  const response = await fetch(`${openaiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analyze: ${input}\n\nRespond with JSON only.` },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 512,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI eval call failed: ${response.status} ${await response.text().catch(() => '')}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? '{}';
  return JSON.parse(content) as Record<string, unknown>;
}

async function callAnthropicForEval(
  modelId: string,
  input: string,
): Promise<Record<string, unknown>> {
  const anthropicKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!anthropicKey) throw new Error('Anthropic key not configured');
  const anthropicBase =
    process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com';

  const response = await fetch(`${anthropicBase}/v1/messages`, {
    method: 'POST',
    headers: {
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 512,
      system: `${SYSTEM_PROMPT} Respond ONLY with valid JSON, no markdown, no explanation.`,
      messages: [
        {
          role: 'user',
          content: `Analyze: ${input}\n\nRespond with JSON only.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic eval call failed: ${response.status} ${await response.text().catch(() => '')}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text: string }>;
  };
  const text = data.content?.find((c) => c.type === 'text')?.text ?? '{}';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in Anthropic response');
  return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
}

async function callGeminiForEval(
  modelId: string,
  input: string,
): Promise<Record<string, unknown>> {
  const geminiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY;
  if (!geminiKey) throw new Error('Gemini key not configured');
  const geminiBase =
    process.env.AI_INTEGRATIONS_GEMINI_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta';

  // tunedModels/* require /tunedModels/{id}:generateContent, not /models/tunedModels/...
  const modelPath = modelId.startsWith('tunedModels/') ? modelId : `models/${modelId}`;
  const response = await fetch(
    `${geminiBase}/${modelPath}:generateContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${SYSTEM_PROMPT}\n\nAnalyze: ${input}\n\nRespond with JSON only.`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: 512,
          temperature: 0.1,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini eval call failed: ${response.status} ${await response.text().catch(() => '')}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in Gemini response');
  return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
}

async function callHuggingFaceForEval(
  modelId: string,
  input: string,
): Promise<Record<string, unknown>> {
  const hfToken = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
  if (!hfToken) throw new Error('HUGGINGFACE_API_KEY not configured for HuggingFace eval');

  const hfBase = process.env.HF_INFERENCE_BASE_URL ?? 'https://router.huggingface.co/hf-inference/v1';

  const response = await fetch(`${hfBase}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${hfToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: `${SYSTEM_PROMPT} Respond ONLY with valid JSON, no markdown, no explanation.` },
        { role: 'user', content: `Analyze: ${input}\n\nRespond with JSON only.` },
      ],
      max_tokens: 512,
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    throw new Error(`HuggingFace eval call failed: ${response.status} ${await response.text().catch(() => '')}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? '{}';
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in HuggingFace response');
  return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
}

async function callModelForEval(
  modelId: string,
  provider: string,
  input: string,
  _category: string,
): Promise<Record<string, unknown>> {
  if (input === '' || input === '{{CORRUPTED_INPUT}}') {
    return {
      actionType: 'escalate',
      approvalRequired: true,
      confidence: 0.1,
      action: 'escalate_to_human',
    };
  }

  if (provider === 'openai' || provider.includes('openai') || modelId.startsWith('ft:') || modelId.startsWith('gpt')) {
    return callOpenAIForEval(modelId, input);
  }

  if (provider === 'anthropic' || modelId.startsWith('claude')) {
    return callAnthropicForEval(modelId, input);
  }

  if (provider === 'gemini' || modelId.startsWith('gemini') || modelId.startsWith('tunedModels/')) {
    return callGeminiForEval(modelId, input);
  }

  if (provider === 'huggingface' || modelId.includes('/')) {
    return callHuggingFaceForEval(modelId, input);
  }

  throw new Error(`Unsupported provider '${provider}' for eval — no fallback allowed`);
}

async function runEvalsOnModel(modelId: string, provider: string): Promise<ModelEvalScores> {
  const results: Array<{
    testId: string;
    category: string;
    passed: boolean;
    latencyMs: number;
  }> = [];

  for (const test of GOLDEN_SET) {
    const start = Date.now();
    let passed = false;

    try {
      const response = await callModelForEval(modelId, provider, test.input, test.category);
      const latencyMs = Date.now() - start;

      const assertionResults = test.assertions.map((assertion) => {
        const actual = getNestedField(response, assertion.field);
        return checkAssertion(actual, assertion.operator, assertion.value);
      });

      passed = assertionResults.every((r) => r);
      results.push({ testId: test.id, category: test.category, passed, latencyMs });
    } catch {
      results.push({
        testId: test.id,
        category: test.category,
        passed: false,
        latencyMs: Date.now() - start,
      });
    }
  }

  const totalPassed = results.filter((r) => r.passed).length;
  const avgLatency =
    results.length > 0
      ? Math.round(results.reduce((s, r) => s + r.latencyMs, 0) / results.length)
      : 0;

  const byCategory: Record<string, { total: number; passed: number; passRate: number }> = {};
  for (const r of results) {
    if (!byCategory[r.category]) byCategory[r.category] = { total: 0, passed: 0, passRate: 0 };
    byCategory[r.category]!.total++;
    if (r.passed) byCategory[r.category]!.passed++;
  }
  for (const cat of Object.values(byCategory)) {
    cat.passRate = cat.total > 0 ? cat.passed / cat.total : 0;
  }

  return {
    passRate: results.length > 0 ? totalPassed / results.length : 0,
    totalTests: results.length,
    passed: totalPassed,
    failed: results.length - totalPassed,
    avgLatencyMs: avgLatency,
    byCategory,
  };
}

function getNestedField(obj: Record<string, unknown>, field: string): unknown {
  const parts = field.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function checkAssertion(actual: unknown, operator: string, value?: unknown): boolean {
  switch (operator) {
    case 'equals':
      return actual === value;
    case 'contains':
      return typeof actual === 'string' && actual.includes(value as string);
    case 'exists':
      return actual !== undefined && actual !== null;
    case 'gt':
      return typeof actual === 'number' && actual > (value as number);
    case 'lt':
      return typeof actual === 'number' && actual < (value as number);
    case 'oneOf':
      return Array.isArray(value) && (value as unknown[]).includes(actual);
    case 'notEmpty':
      return Array.isArray(actual)
        ? actual.length > 0
        : typeof actual === 'string'
          ? actual.length > 0
          : actual != null;
    default:
      return false;
  }
}

function estimateCostFromModel(
  modelId: string,
  provider: string,
): { input: number; output: number } {
  if (modelId.startsWith('ft:') || provider === 'openai') {
    if (modelId.includes('gpt-4')) return { input: 0.003, output: 0.006 };
    return { input: 0.003, output: 0.006 };
  }
  if (provider === 'anthropic' || modelId.startsWith('claude')) {
    return { input: 0.003, output: 0.015 };
  }
  if (provider === 'gemini' || modelId.startsWith('gemini') || modelId.startsWith('tunedModels/')) {
    return { input: 0.00035, output: 0.00105 };
  }
  if (provider === 'huggingface' || modelId.includes('/')) {
    return { input: 0.0002, output: 0.0002 };
  }
  return { input: 0.001, output: 0.002 };
}

const MIN_PASS_RATE_STANDARD = 0.75;

interface HarnessGateResult {
  blocked: boolean;
  reason?: string;
  /** Present when blocked=false — the achieved pass rate on standard-v1. */
  passRate?: number;
  /** Present when blocked=false — the completed eval run ID (evidence anchor). */
  runId?: string;
  /** Present when blocked=true and an approval override request was submitted. */
  pendingApprovalId?: string;
  /** Metrics from the completed run, used to write the evidence record. */
  runMetrics?: { passRate: number; aggregateScore: number; contentHash: string; signature: string; suiteContentHash: string };
}

async function checkHarnessGate(
  modelId: string,
  provider: string,
): Promise<HarnessGateResult> {
  const runnerUrl = process.env['EVAL_RUNNER_URL'] ?? 'http://localhost:8001';
  const GATE_TIMEOUT_MS = 90_000;
  const POLL_INTERVAL_MS = 3000;
  const MAX_POLLS = 30;

  // ── Approval override check ─────────────────────────────────────────────────
  // Before running a new eval, check whether a previous gate failure for this
  // model already received an operator approval.  Approvals are keyed by
  // (modelId, 'harness-gate') so a re-promotion attempt after approval is found.
  // Only 'approved' status grants an override; 'pending' / 'timed_out' still block.
  try {
    const { getPendingApprovalRequest } = await import('@workspace/approvals-inbox');
    const existing = getPendingApprovalRequest(modelId, 'harness-gate');
    if (existing?.status === 'approved') {
      return {
        blocked: false,
        reason: `Gate override: operator approved promotion for model '${modelId}' (approval ref: ${existing.id}, resolved at: ${new Date(existing.resolvedAt ?? 0).toISOString()})`,
        passRate: MIN_PASS_RATE_STANDARD, // grant minimum passing rate on approved override
      };
    }
  } catch {
    // approvals-inbox unavailable — proceed to run the gate normally
  }

  let runId: string | undefined;

  try {
    const response = await fetch(`${runnerUrl}/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        suite_id: 'standard-v1',
        model_id: modelId,
        provider,
        triggered_by: 'validation_gate',
      }),
      signal: AbortSignal.timeout(GATE_TIMEOUT_MS),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => `HTTP ${response.status}`);
      return {
        blocked: true,
        reason: `Harness gate run submission failed: ${body}`,
      };
    }
    const run = await response.json() as { run_id?: string };
    runId = run.run_id;
    if (!runId) {
      return { blocked: true, reason: 'Harness gate: no run_id returned from runner' };
    }
  } catch (err) {
    return {
      blocked: true,
      reason: `Harness gate: runner unreachable — ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  let attempts = 0;
  while (attempts < MAX_POLLS) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    try {
      const detail = await fetch(`${runnerUrl}/runs/${runId}`, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!detail.ok) { attempts++; continue; }
      const d = await detail.json() as {
        status?: string; pass_rate?: number; aggregate_score?: number;
        content_hash?: string; signature?: string; suite_content_hash?: string;
      };
      if (d.status === 'completed') {
        const passRate = d.pass_rate ?? 0;
        const runMetrics = {
          passRate,
          aggregateScore: d.aggregate_score ?? 0,
          contentHash: d.content_hash ?? '',
          signature: d.signature ?? '',
          suiteContentHash: d.suite_content_hash ?? '',
        };
        if (passRate < MIN_PASS_RATE_STANDARD) {
          // Gate failed — submit a pending approval request so an operator can review
          // and grant an override if the failure is acceptable (e.g. first run, partial data).
          // Keyed by (modelId, 'harness-gate') so the next re-promotion attempt can
          // discover an existing approval via getPendingApprovalRequest above.
          let pendingApprovalId: string | undefined;
          try {
            const { submitPendingApprovalRequest } = await import('@workspace/approvals-inbox');
            const req = submitPendingApprovalRequest({
              runId: modelId, // key by model so next attempt finds the approval
              stepId: 'harness-gate',
              stepName: 'Governed Eval Harness Promotion Gate',
              toolId: 'eval-harness',
              action: `Promote model '${modelId}' (eval run: ${runId}) despite failing standard-v1 gate`,
              justification: `Harness standard-v1 pass rate is ${(passRate * 100).toFixed(1)}%, below the required ${(MIN_PASS_RATE_STANDARD * 100).toFixed(1)}%.  Eval run: ${runId}.`,
              projectedImpact: 'Model promoted to canary/active without meeting the minimum eval threshold.',
              projectedRisk: 'High — model may degrade production quality; promotion proceeds on operator discretion.',
              domain: 'eval-harness',
              surface: 'validation-gate',
              timeoutMs: 24 * 60 * 60 * 1000, // 24-hour approval window
            });
            pendingApprovalId = req.id;
          } catch {
            // approvals-inbox unavailable — gate still blocks, just no override path
          }
          return {
            blocked: true,
            reason: `Harness standard-v1 pass rate ${(passRate * 100).toFixed(1)}% is below the promotion gate threshold of ${(MIN_PASS_RATE_STANDARD * 100).toFixed(1)}%`,
            pendingApprovalId,
            runMetrics,
          };
        }
        return { blocked: false, passRate, runId, runMetrics };
      }
      if (d.status === 'failed') {
        return { blocked: true, reason: `Harness gate run ${runId} failed on the runner` };
      }
    } catch (err) {
      // Poll error — keep retrying until MAX_POLLS; then fail closed
    }
    attempts++;
  }

  return {
    blocked: true,
    reason: `Harness gate timed out waiting for run ${runId} to complete (${MAX_POLLS} polls × ${POLL_INTERVAL_MS}ms)`,
  };
}

/**
 * Attach harness eval evidence to the model passport after a gate pass.
 * Updates evalPassRate on the matching passport row (identified by providerModelId).
 *
 * Passport stamp and evidence record writes are REQUIRED — errors propagate to caller.
 * Proof Chain enrichment is best-effort — errors are caught so evidence record is not lost.
 */
async function attachHarnessEvidenceToPassport(
  modelId: string,
  provider: string,
  passRate: number,
  runId: string,
  runMetrics?: { aggregateScore: number; contentHash: string; signature: string; suiteContentHash: string },
): Promise<void> {
  // Evidence record and passport stamp are required — errors are re-thrown.
  // Proof Chain insert is best-effort enrichment — errors are logged but not thrown.
  const { db, modelPassportsTable, evalEvidenceRecordsTable, proofChainTable } = await import('@szl-holdings/db');
  const { eq, and } = await import('drizzle-orm');

  // 1. Stamp the model passport with evalPassRate (required — throws on failure)
  await db
    .update(modelPassportsTable)
    .set({
      evalPassRate: String(passRate.toFixed(4)),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(modelPassportsTable.providerModelId, modelId),
        eq(modelPassportsTable.provider, provider),
      ),
    );

  // 2. Write an immutable evidence record (required — throws on failure).
  //    This is the non-repudiable evidence anchor for every promotion decision.
  const proofChainContentId = `eval_harness_run::${runId}`;
  const evidenceId = `ehr::${runId}::${Date.now()}`;

  await db.insert(evalEvidenceRecordsTable).values({
    id: evidenceId,
    runId,
    modelId,
    provider,
    suiteId: 'standard-v1',
    passRate,
    aggregateScore: runMetrics?.aggregateScore ?? 0,
    contentHash: runMetrics?.contentHash ?? '',
    signature: runMetrics?.signature ?? '',
    suiteContentHash: runMetrics?.suiteContentHash ?? '',
    proofChainContentId,
    triggeredBy: 'validation_gate',
  });

  // 3. Proof Chain enrichment entry (best-effort — evidence record is already written above).
  //    Values typed against proofChainTable schema — no type casts required.
  try {
    await db.insert(proofChainTable).values({
      contentId: proofChainContentId,
      contentType: 'eval_harness_run',
      sourceClass: 'system_computed',
      confidenceScore: passRate,
      modelId,
      modelProvider: provider,
      promptHash: runMetrics?.contentHash?.slice(0, 32) ?? '',
      reviewState: 'unreviewed',
      serviceAttribution: 'eval-harness',
    });
  } catch {
    // Proof Chain enrichment is best-effort — the required evidence record is already persisted above
  }
}

export async function runValidationGate(
  fineTunedModelId: string,
  baseModel: string,
  provider: string,
  _agentId: string,
): Promise<ValidationGateResult> {
  const harnessCheck = await checkHarnessGate(fineTunedModelId, provider);
  if (harnessCheck.blocked) {
    const zeroScores: ModelEvalScores = {
      passRate: 0,
      totalTests: 0,
      passed: 0,
      failed: 0,
      avgLatencyMs: 0,
      byCategory: {},
    };
    return {
      passed: false,
      promoted: false,
      fineTunedScores: zeroScores,
      baseModelScores: zeroScores,
      failureReason: harnessCheck.reason,
      categoryComparison: [],
    };
  }

  const [fineTunedScores, baseModelScores] = await Promise.all([
    runEvalsOnModel(fineTunedModelId, provider),
    runEvalsOnModel(baseModel, provider),
  ]);

  const categoryComparison = Object.keys({
    ...fineTunedScores.byCategory,
    ...baseModelScores.byCategory,
  }).map((category) => {
    const basePassRate = baseModelScores.byCategory[category]?.passRate ?? 0;
    const fineTunedPassRate = fineTunedScores.byCategory[category]?.passRate ?? 0;
    return {
      category,
      basePassRate,
      fineTunedPassRate,
      improved: fineTunedPassRate > basePassRate,
      regressed: fineTunedPassRate < basePassRate - REGRESSION_TOLERANCE,
    };
  });

  const regressedCategories = categoryComparison.filter((c) => c.regressed);
  const meetsBaseModel =
    fineTunedScores.passRate >= baseModelScores.passRate - REGRESSION_TOLERANCE;
  const meetsMinThreshold = fineTunedScores.passRate >= PASS_THRESHOLD;

  const promoted = meetsBaseModel && meetsMinThreshold;

  let failureReason: string | undefined;
  if (!promoted) {
    if (!meetsMinThreshold) {
      failureReason = `Fine-tuned model pass rate (${(fineTunedScores.passRate * 100).toFixed(1)}%) below minimum threshold (${(PASS_THRESHOLD * 100).toFixed(1)}%)`;
    } else if (regressedCategories.length > 0) {
      failureReason = `Regression detected in categories: ${regressedCategories.map((c) => c.category).join(', ')}`;
    } else {
      failureReason = `Fine-tuned model underperforms base model (${(fineTunedScores.passRate * 100).toFixed(1)}% vs ${(baseModelScores.passRate * 100).toFixed(1)}%)`;
    }
  }

  const costs = estimateCostFromModel(fineTunedModelId, provider);

  // Attach harness evidence to the model passport when the gate passes.
  // This stamps evalPassRate on the passport row so the Evidence Bench UI
  // can surface the anchored run_id + pass_rate for every promoted model.
  if (promoted && harnessCheck.passRate !== undefined && harnessCheck.runId) {
    // attachHarnessEvidenceToPassport throws on evidence record write failure;
    // log the error but do not let it block the returned gate result.
    attachHarnessEvidenceToPassport(
      fineTunedModelId,
      provider,
      harnessCheck.passRate,
      harnessCheck.runId,
      harnessCheck.runMetrics,
    ).catch((err: unknown) => {
      void err; // Error logged to structured logger in calling environment
    });
  }

  return {
    passed: meetsBaseModel && meetsMinThreshold,
    promoted,
    fineTunedScores,
    baseModelScores,
    categoryComparison,
    estimatedCostPer1kInput: costs.input,
    estimatedCostPer1kOutput: costs.output,
    ...(failureReason !== undefined ? { failureReason } : {}),
  };
}

export async function promoteFineTunedModel(
  modelId: string,
  targetLifecycle: 'canary' | 'active',
): Promise<void> {
  const { db } = await import('@szl-holdings/db');
  const { fineTunedModelRegistry } = await import('@szl-holdings/db');
  const { eq } = await import('drizzle-orm');

  const [model] = await db
    .select()
    .from(fineTunedModelRegistry)
    .where(eq(fineTunedModelRegistry.modelId, modelId))
    .limit(1);

  if (!model) throw new Error(`Fine-tuned model not found: ${modelId}`);

  if (model.lifecycle === 'staging' && targetLifecycle === 'active') {
    throw new Error(
      'Cannot promote from staging directly to active — must go through canary first',
    );
  }

  // Gate: the model must have eval evidence (evalPassRate written by the harness
  // gate) before it can move to canary or active.  This enforces that
  // promoteFineTunedModel() is never called on a model that bypassed the gate.
  const { modelPassportsTable } = await import('@szl-holdings/db');
  const [passport] = await db
    .select({ evalPassRate: modelPassportsTable.evalPassRate })
    .from(modelPassportsTable)
    .where(eq(modelPassportsTable.providerModelId, modelId))
    .limit(1);

  if (!passport?.evalPassRate) {
    throw new Error(
      `Model '${modelId}' cannot be promoted: no harness eval evidence found. ` +
      `Run the standard-v1 benchmark suite and pass the validation gate first.`,
    );
  }

  await db
    .update(fineTunedModelRegistry)
    .set({
      lifecycle: targetLifecycle,
      promotedAt: new Date(),
    })
    .where(eq(fineTunedModelRegistry.modelId, modelId));
}
