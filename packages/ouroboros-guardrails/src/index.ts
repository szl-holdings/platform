/**
 * @szl-holdings/guardrails — drop-in LLM safety SKU.
 *
 * The runtime competing with NVIDIA NeMo Guardrails. Same config surface,
 * same rail kinds, same drop-in pattern — but every decision produces a
 * closed-form Λ scalar and a tamper-evident receipt.
 *
 * Usage:
 *
 *   import { Guardrails } from "@szl-holdings/guardrails";
 *
 *   const g = new Guardrails({
 *     tenantId: "acme-corp",
 *     inputRails: [{ name: "jailbreak_detection" }, { name: "sensitive_data_detection" }],
 *     outputRails: [{ name: "pii_filter" }, { name: "hallucination_check" }],
 *     executionRails: [{ name: "tool_authority_check" }],
 *   });
 *
 *   const verdict = await g.guard({
 *     subject: "claude-sonnet-4.5/req-abc123",
 *     prompt: userPrompt,
 *     response: modelOutput,
 *     toolCall: { tool: "fs.delete", capability: "ROLE_FS_WRITE", args: { path: "/tmp/x" } },
 *   });
 *
 *   if (verdict.action !== "PROCEED") refuse(verdict);
 *
 * The `verdict` is a `GuardrailReceipt` — it persists to whatever sink
 * the tenant configured (file, S3, Splunk, Kafka). Passing the receipt
 * to `verifyReceipt(receipt, tenantKeyId)` returns valid only if no
 * byte has been altered since issuance.
 */

import { randomUUID, createHash } from "node:crypto";
import {
  runInputRail,
  runOutputRail,
  runDialogRail,
  runRetrievalRail,
  runExecutionRail,
} from "./rails.js";
import { buildReceipt } from "./receipt.js";
import type { GuardCallInput, GuardrailReceipt, GuardrailsConfig, RailDecision } from "./types.js";

export * from "./types.js";
export { lambdaScore, lambdaVerdict, compositeLambda } from "./lambda.js";
export { buildReceipt, verifyReceipt, verifyReceiptChain, sha256Hex } from "./receipt.js";

export class Guardrails {
  private config: GuardrailsConfig;
  private prevHash?: string;
  private tenantKeyId: string;
  private receiptBuffer: GuardrailReceipt[] = [];

  constructor(config: GuardrailsConfig) {
    this.config = config;
    this.tenantKeyId = createHash("sha256").update("tenant:" + config.tenantId).digest("hex").slice(0, 16);
  }

  async guard(input: GuardCallInput): Promise<GuardrailReceipt> {
    const rails: RailDecision[] = [];

    for (const spec of this.config.inputRails ?? []) rails.push(runInputRail(spec, input));
    for (const spec of this.config.retrievalRails ?? []) rails.push(runRetrievalRail(spec, input));
    for (const spec of this.config.dialogRails ?? []) rails.push(runDialogRail(spec, input));
    for (const spec of this.config.executionRails ?? []) rails.push(runExecutionRail(spec, input));
    for (const spec of this.config.outputRails ?? []) rails.push(runOutputRail(spec, input));

    const receipt = buildReceipt({
      id: randomUUID(),
      tenantId: this.config.tenantId,
      subject: input.subject,
      rails,
      prevReceiptHash: this.prevHash,
      tenantKeyId: this.tenantKeyId,
    });

    this.prevHash = receipt.contentHash;
    this.receiptBuffer.push(receipt);

    if (this.config.receiptSink) await this.config.receiptSink(receipt);

    return receipt;
  }

  /** Read-only access to the in-memory receipt log. */
  receipts(): readonly GuardrailReceipt[] {
    return this.receiptBuffer;
  }

  /** Reset the chain — only for tests. Production never calls this. */
  reset(): void {
    this.prevHash = undefined;
    this.receiptBuffer = [];
  }
}
