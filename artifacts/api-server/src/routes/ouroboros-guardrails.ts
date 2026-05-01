/**
 * Ouroboros · Guardrails axis · Public API surface (SZL Holdings, 2026)
 *
 *   GET  /api/ouroboros/guardrails/health           → manifest + rail catalogue
 *   POST /api/ouroboros/guardrails/evaluate         → one-shot guarded decision
 *   POST /api/ouroboros/guardrails/verify-receipt   → seal + content-hash check
 *
 * All endpoints are stateless, Zod-validated, public (no auth/CSRF).
 * Operationalises the @workspace/ouroboros-guardrails SKU (Ouroboros v6,
 * primitives 81–91), which competes head-to-head with NVIDIA NeMo
 * Guardrails on the same config surface but emits a closed-form Λ
 * scalar plus tamper-evident hash-chained receipt per decision.
 */

import type { IRouter } from 'express';
import { z } from 'zod';
import { sendError } from '../lib/api-response.js';
import {
  evaluate,
  verifyReceipt,
  type GuardrailReceipt,
} from '../lib/ouroboros-guardrails/index.js';

const railSpec = (allowed: readonly string[]) =>
  z
    .array(
      z.object({
        name: z.enum(allowed as [string, ...string[]]),
        weight: z.number().positive().max(8).optional(),
      }),
    )
    .max(16);

const evaluateSchema = z.object({
  config: z.object({
    tenantId: z.string().min(1).max(128),
    inputRails: railSpec([
      'self_check_input',
      'jailbreak_detection',
      'sensitive_data_detection',
      'topic_safety',
      'lambda_input_check',
    ]).optional(),
    outputRails: railSpec([
      'self_check_output',
      'fact_check',
      'hallucination_check',
      'pii_filter',
      'lambda_output_check',
    ]).optional(),
    dialogRails: railSpec([
      'scope_creep_check',
      'consent_alignment',
      'lambda_dialog_check',
    ]).optional(),
    retrievalRails: railSpec([
      'citation_check',
      'context_provenance',
      'lambda_retrieval_check',
    ]).optional(),
    executionRails: railSpec([
      'tool_authority_check',
      'anduril_refusal_check',
      'lambda_execution_check',
    ]).optional(),
  }),
  subject: z.string().min(1).max(256),
  prompt: z.string().min(1).max(16_000),
  response: z.string().max(32_000).optional(),
  retrievedContext: z
    .array(
      z.object({
        corpusId: z.string().min(1).max(128),
        reference: z.string().min(1).max(512),
        text: z.string().min(1).max(8_000),
      }),
    )
    .max(32)
    .optional(),
  toolCall: z
    .object({
      tool: z.string().min(1).max(128),
      capability: z.string().min(1).max(64).optional(),
      args: z
        .record(z.unknown())
        .refine((v) => Object.keys(v).length <= 32, {
          message: 'toolCall.args may carry at most 32 keys',
        })
        .refine(
          (v) => {
            try {
              return JSON.stringify(v).length <= 8_000;
            } catch {
              return false;
            }
          },
          {
            message:
              'toolCall.args must serialize to ≤ 8000 bytes of JSON (caps cost of downstream rails inspection)',
          },
        )
        .optional(),
    })
    .optional(),
});

const railVerdictSchema = z.enum(['PROCEED', 'QUARANTINE', 'ABORT']);

const verifyReceiptSchema = z.object({
  receipt: z.object({
    version: z.literal('1.0.0'),
    id: z.string().min(1).max(128),
    issuedAt: z.string().min(1).max(64),
    tenantId: z.string().min(1).max(128),
    subject: z.string().min(1).max(256),
    lambda: z.number().min(0).max(1),
    action: railVerdictSchema,
    rails: z.array(z.unknown()).max(64),
    prevReceiptHash: z.string().max(128).optional(),
    contentHash: z.string().min(1).max(128),
    seal: z.string().min(1).max(128),
  }),
  tenantKeyId: z.string().min(1).max(128),
});

export function register(router: IRouter): void {
  router.get('/ouroboros/guardrails/health', (_req, res) => {
    res.json({
      framework: 'Ouroboros · Guardrails axis',
      version: 'v6.1.0',
      sku: '@workspace/ouroboros-guardrails',
      compete_with: 'NVIDIA NeMo Guardrails',
      surface_compatibility: 'NeMo Colang config (input/output/dialog/retrieval/execution rails)',
      differentiator:
        'Each decision emits closed-form Λ scalar + tamper-evident hash-chained receipt',
      lambda_thresholds: { proceed: 0.85, quarantine: 0.5, abort: '< 0.5' },
      composite: 'Λ = geomean(per-axis ∈ [0,1]) — any zero-axis collapses Λ to 0',
      action_rank: 'ABORT > QUARANTINE > PROCEED (worst rail wins)',
      rail_catalogue: {
        input: [
          'self_check_input',
          'jailbreak_detection',
          'sensitive_data_detection',
          'topic_safety',
          'lambda_input_check',
        ],
        output: [
          'self_check_output',
          'fact_check',
          'hallucination_check',
          'pii_filter',
          'lambda_output_check',
        ],
        dialog: ['scope_creep_check', 'consent_alignment', 'lambda_dialog_check'],
        retrieval: ['citation_check', 'context_provenance', 'lambda_retrieval_check'],
        execution: ['tool_authority_check', 'anduril_refusal_check', 'lambda_execution_check'],
      },
      compliance:
        'EU AI Act Art 12 · NIST SP 800-53 AU-12 · SR 11-7 · DoD CDAO RAI Traceable',
      lineage:
        'SZL Holdings · Ouroboros v6 · primitives 81–91 · ORCID 0009-0001-0110-4173',
    });
  });

  router.post('/ouroboros/guardrails/evaluate', async (req, res) => {
    const parsed = evaluateSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(
        res,
        'Invalid evaluate payload: ' + parsed.error.issues[0]?.message,
        400,
        'VALIDATION_ERROR',
      );
      return;
    }
    try {
      const out = await evaluate(parsed.data);
      res.json(out);
    } catch (e) {
      sendError(
        res,
        (e as Error).message,
        400,
        'GUARDRAILS_EVALUATION_ERROR',
      );
    }
  });

  router.post('/ouroboros/guardrails/verify-receipt', (req, res) => {
    const parsed = verifyReceiptSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(
        res,
        'Invalid verify-receipt payload: ' + parsed.error.issues[0]?.message,
        400,
        'VALIDATION_ERROR',
      );
      return;
    }
    try {
      const result = verifyReceipt(
        parsed.data.receipt as GuardrailReceipt,
        parsed.data.tenantKeyId,
      );
      res.json(result);
    } catch (e) {
      sendError(
        res,
        (e as Error).message,
        400,
        'GUARDRAILS_VERIFY_ERROR',
      );
    }
  });
}
