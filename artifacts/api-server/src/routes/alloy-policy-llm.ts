import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { sendSuccess, sendError, handleRouteError } from "../lib/api-response";
import { authMiddleware, requireRole } from "../middlewares/auth";
import {
  PolicyEffectSchema,
  PolicyConditionSchema,
  type LLMAssistResult,
  type CompiledRuleIR,
} from "@szl-holdings/policy-engine";

const policyLLMRouter: IRouter = Router();

/**
 * Schema for the structured JSON the LLM is asked to return when resolving an
 * ambiguous policy sentence. Mirrors `LLMAssistResult` from policy-engine and
 * is used both in the prompt (as a JSON-schema-style hint) and to validate the
 * model's reply before merging it into the deterministic IR.
 */
/**
 * Operators the studio evaluator currently understands. We narrow the LLM's
 * output to this set so the model can't return e.g. `matches` and have the
 * preview silently skip it.
 */
const StudioOperatorSchema = z.enum(["eq", "gt", "gte", "lt", "lte", "in", "not_in"]);

const StudioConditionSchema = z.object({
  field: z.string().min(1).max(120),
  operator: StudioOperatorSchema,
  value: z.unknown(),
});

const LLMRulePayloadSchema = z.object({
  effect: PolicyEffectSchema.optional(),
  conditions: z.array(StudioConditionSchema).optional(),
  requiredApproverRole: z.string().min(1).max(120).optional(),
  escalateTo: z.string().min(1).max(120).optional(),
  reason: z.string().min(1).max(500).optional(),
  confidence: z.number().min(0).max(1).optional(),
  notes: z.string().max(500).optional(),
});

// PolicyConditionSchema is referenced by the wider request schema but not by
// the LLM payload (the LLM is constrained to the studio-supported subset).
void PolicyConditionSchema;

const RequestBodySchema = z.object({
  sentence: z.string().min(5).max(2000),
  deterministic: z
    .object({
      effect: PolicyEffectSchema,
      confidence: z.number().min(0).max(1),
      conditions: z.array(PolicyConditionSchema).optional(),
      requiredApproverRole: z.string().optional(),
      escalateTo: z.string().optional(),
      warnings: z.array(z.string()).optional(),
    })
    .optional(),
});

interface LLMResponse {
  result: LLMAssistResult | null;
  modelUsed: string;
  llmAvailable: boolean;
  fallbackReason?: string;
}

const SYSTEM_PROMPT = `You are the Alloy Policy Compiler's structured-parse assistant. Your job is to convert one ambiguous sentence of governance policy into a structured JSON object that downstream systems can enforce.

Return ONLY a JSON object — no prose, no markdown fences — matching this shape:

{
  "effect": "allow" | "require_approval" | "escalate" | "block" | "audit_only",
  "conditions": [{ "field": string, "operator": "eq"|"gt"|"gte"|"lt"|"lte"|"in"|"not_in", "value": any }],
  "requiredApproverRole": string (role identifier, e.g. "compliance_officer"),
  "escalateTo": string (role identifier),
  "reason": string (why you chose this effect, ≤ 1 sentence),
  "confidence": number in [0, 1],
  "notes": string (optional, ≤ 1 sentence note for the human reviewer)
}

Rules:
- Omit any field you are not confident about — don't fabricate values.
- Prefer concrete attribute names like "counterparty.watchlist", "estimatedCostUsd", "domain", "subject.role".
- "block" is for hard denials. "require_approval" is for sentences that say a sign-off is needed. "escalate" is for routing to a higher authority. "audit_only" is for log-and-allow.
- Confidence reflects how unambiguous the sentence is. If the sentence remains ambiguous, return ≤ 0.6.`;

const USER_PROMPT_TEMPLATE = (
  sentence: string,
  deterministic?: { effect: string; confidence: number; warnings?: string[] },
): string => {
  const detBlock = deterministic
    ? `Deterministic parser already produced:
- effect: ${deterministic.effect}
- confidence: ${deterministic.confidence.toFixed(2)}
- warnings: ${(deterministic.warnings ?? []).join("; ") || "(none)"}

Repair gaps and resolve ambiguity. If the deterministic parse is correct, echo it back with a higher confidence.`
    : "No deterministic parse available — produce a fresh structured rule.";

  return `Sentence:
"""${sentence}"""

${detBlock}

Return the JSON object now.`;
};

async function callLLM(
  sentence: string,
  deterministic?: { effect: string; confidence: number; warnings?: string[] },
): Promise<LLMResponse> {
  const baseUrl = process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];
  const apiKey = process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];
  const model = process.env["ALLOY_POLICY_LLM_MODEL"] ?? "gpt-5-mini";

  if (!baseUrl || !apiKey) {
    return {
      result: null,
      modelUsed: model,
      llmAvailable: false,
      fallbackReason: "OpenAI integration not configured (AI_INTEGRATIONS_OPENAI_* env vars missing).",
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_completion_tokens: 600,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: USER_PROMPT_TEMPLATE(sentence, deterministic) },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return {
        result: null,
        modelUsed: model,
        llmAvailable: true,
        fallbackReason: `LLM HTTP ${response.status}: ${text.slice(0, 200)}`,
      };
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      return {
        result: null,
        modelUsed: model,
        llmAvailable: true,
        fallbackReason: "LLM returned no content.",
      };
    }

    const cleaned = raw.replace(/^```json\s*|\s*```$/g, "").trim();
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(cleaned);
    } catch (err) {
      return {
        result: null,
        modelUsed: model,
        llmAvailable: true,
        fallbackReason: `LLM produced invalid JSON: ${(err as Error).message}`,
      };
    }

    const validated = LLMRulePayloadSchema.safeParse(parsedJson);
    if (!validated.success) {
      return {
        result: null,
        modelUsed: model,
        llmAvailable: true,
        fallbackReason: `LLM payload failed validation: ${validated.error.issues
          .slice(0, 3)
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ")}`,
      };
    }

    return {
      result: validated.data as LLMAssistResult,
      modelUsed: model,
      llmAvailable: true,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      result: null,
      modelUsed: model,
      llmAvailable: true,
      fallbackReason: `LLM call failed: ${msg}`,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * POST /alloy/policies/llm-assist
 *
 * Resolves a single ambiguous policy sentence using an LLM and returns a
 * structured `LLMAssistResult` the studio UI can merge into the compiled IR.
 * The endpoint is safe to call repeatedly; it is read-only on the server side.
 */
policyLLMRouter.post(
  "/alloy/policies/llm-assist",
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const parsed = RequestBodySchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(
          res,
          `Invalid request body: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
          400,
        );
        return;
      }

      const { sentence, deterministic } = parsed.data;
      const detForPrompt = deterministic
        ? {
            effect: deterministic.effect,
            confidence: deterministic.confidence,
            warnings: deterministic.warnings ?? [],
          }
        : undefined;

      const llm = await callLLM(sentence, detForPrompt);

      sendSuccess(res, {
        sentence,
        result: llm.result,
        modelUsed: llm.modelUsed,
        llmAvailable: llm.llmAvailable,
        fallbackReason: llm.fallbackReason,
        thresholdHint: 0.7,
      });
    } catch (err) {
      handleRouteError(res, err, "Failed to resolve policy sentence with LLM");
    }
  },
);

/**
 * Thin wrapper that mirrors the `LLMAssistFn` shape from the policy-engine.
 * Exported so future server-side code paths (e.g. batch policy compilation
 * jobs) can plug the same LLM into `compilePolicyWithLLM` directly.
 */
export async function llmAssistForCompiler(
  sentence: string,
  deterministic: CompiledRuleIR,
): Promise<LLMAssistResult | null> {
  const llm = await callLLM(sentence, {
    effect: deterministic.effect,
    confidence: deterministic.confidence,
    warnings: deterministic.warnings,
  });
  return llm.result;
}

export default policyLLMRouter;
