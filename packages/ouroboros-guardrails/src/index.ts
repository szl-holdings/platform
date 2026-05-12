/**
 * @szl-holdings/guardrails -- drop-in LLM safety SKU.
 *
 * The runtime competing with NVIDIA NeMo Guardrails. Same config surface,
 * same rail kinds, same drop-in pattern -- but every decision produces a
 * formal Lutar Invariant (9-axis, Egyptian-inspectable, closed-form)
 * and a tamper-evident receipt.
 *
 * v2.0.0 receipts: Lambda-9 fields are included in the signed skeleton.
 * Every field is cryptographically covered by contentHash + seal.
 * Tampering with any Lambda-9 axis value invalidates the receipt.
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
import { lambdaScore9, extractAxes9FromRails } from "./lambda.js";
import type { GuardCallInput, GuardrailReceipt, GuardrailsConfig, RailDecision } from "./types.js";

export * from "./types.js";
export { lambdaScore, lambdaScore9, lambdaVerdict, compositeLambda, extractAxes9FromRails } from "./lambda.js";
export type { Lambda9Result } from "./lambda.js";
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

    const axes9 = extractAxes9FromRails(rails);
    const lambda9Result = lambdaScore9(axes9);

    const receipt = buildReceipt({
      id: randomUUID(),
      tenantId: this.config.tenantId,
      subject: input.subject,
      rails,
      prevReceiptHash: this.prevHash,
      tenantKeyId: this.tenantKeyId,
      lambda9: lambda9Result.report,
      lambda9BoundVerified: lambda9Result.boundVerified,
    });

    this.prevHash = receipt.contentHash;
    this.receiptBuffer.push(receipt);

    if (this.config.receiptSink) await this.config.receiptSink(receipt);

    return receipt;
  }

  receipts(): readonly GuardrailReceipt[] {
    return this.receiptBuffer;
  }

  reset(): void {
    this.prevHash = undefined;
    this.receiptBuffer = [];
  }
}
