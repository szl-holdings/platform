/**
 * Thin api-server wrapper around @workspace/ouroboros-guardrails.
 *
 * The runtime SKU lives at packages/ouroboros-guardrails (54 vitests, no
 * I/O dependencies, fully deterministic). This module exposes a stateless
 * one-shot evaluator suitable for a public HTTP surface — each call gets
 * a fresh Guardrails instance so that no tenant state leaks across
 * requests, no hash chain crosses tenants, and no in-memory receipt
 * buffer can grow unbounded inside the api-server process.
 *
 * Tenants who need a chain semantics (audit-log, append-only) construct
 * a Guardrails instance themselves with a persistent receiptSink. This
 * wrapper deliberately does NOT persist receipts on the server side.
 */

import {
  Guardrails,
  verifyReceipt,
  verifyReceiptChain,
  type GuardCallInput,
  type GuardrailReceipt,
  type GuardrailsConfig,
} from '@workspace/ouroboros-guardrails';

export type EvaluateInput = GuardCallInput & {
  config: Pick<
    GuardrailsConfig,
    'tenantId' | 'inputRails' | 'outputRails' | 'dialogRails' | 'retrievalRails' | 'executionRails'
  >;
};

export interface EvaluateOutput {
  receipt: GuardrailReceipt;
  /** Convenience extract for callers that don't want to walk the receipt. */
  summary: {
    action: GuardrailReceipt['action'];
    lambda: number;
    railCount: number;
    failedPrimitives: string[];
  };
}

/**
 * Stateless one-shot guardrail evaluation. Returns a sealed receipt.
 *
 * The returned receipt is verifiable offline by anyone in possession of
 * the same tenantId (the tenantKeyId is derived from sha256("tenant:" +
 * tenantId).slice(0,16) — see Guardrails constructor).
 */
export async function evaluate(input: EvaluateInput): Promise<EvaluateOutput> {
  const { config, ...callInput } = input;
  const g = new Guardrails(config);
  const receipt = await g.guard(callInput);
  const failed = receipt.rails.flatMap((r) => r.failed);
  return {
    receipt,
    summary: {
      action: receipt.action,
      lambda: receipt.lambda,
      railCount: receipt.rails.length,
      failedPrimitives: failed,
    },
  };
}

export { verifyReceipt, verifyReceiptChain };
export type { GuardrailReceipt, GuardCallInput, GuardrailsConfig };
