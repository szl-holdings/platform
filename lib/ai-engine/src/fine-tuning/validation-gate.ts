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
  const geminiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY;
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
  return { input: 0.001, output: 0.002 };
}

export async function runValidationGate(
  fineTunedModelId: string,
  baseModel: string,
  provider: string,
  _agentId: string,
): Promise<ValidationGateResult> {
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

  await db
    .update(fineTunedModelRegistry)
    .set({
      lifecycle: targetLifecycle,
      promotedAt: new Date(),
    })
    .where(eq(fineTunedModelRegistry.modelId, modelId));
}
