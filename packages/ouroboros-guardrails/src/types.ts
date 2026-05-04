/**
 * Core types for @szl-holdings/guardrails — the drop-in LLM safety SKU.
 *
 * Design choice: surface compatibility with NVIDIA NeMo Guardrails Colang
 * config (input rails / output rails / dialog rails) so existing
 * NeMo configs port over with one import swap. Underneath, every gate
 * decision produces a closed-form Lambda scalar and a tamper-evident receipt
 * -- neither of which NeMo offers.
 *
 * Receipt schema versions:
 *   1.0.0 — original 4-axis geometric mean Lambda
 *   2.0.0 — formal 9-axis Lutar Invariant (Lambda-9), cryptographically signed
 */

export type RailVerdict = "PROCEED" | "QUARANTINE" | "ABORT";

export type RailKind =
  | "input"
  | "output"
  | "dialog"
  | "retrieval"
  | "execution";

export interface RailDecision {
  kind: RailKind;
  verdict: RailVerdict;
  lambda: number;
  axes: Record<string, number>;
  failed: string[];
  passed: string[];
  rationale: string;
  timestamp: string;
  payloadHash: string;
}

export type ReceiptVersion = "1.0.0" | "2.0.0";

export interface GuardrailReceipt {
  version: ReceiptVersion;
  id: string;
  issuedAt: string;
  tenantId: string;
  subject: string;
  lambda: number;
  action: RailVerdict;
  rails: RailDecision[];
  lambda9?: {
    invariant: number;
    axesUsed: string[];
    axisValues: Record<string, number>;
    weight: number;
    formula: string;
    bound: { lower: number; upper: number };
    weightSumExact: boolean;
  };
  lambda9BoundVerified?: boolean;
  prevReceiptHash?: string;
  contentHash: string;
  seal: string;
}

export interface GuardrailsConfig {
  tenantId: string;
  inputRails?: InputRailSpec[];
  outputRails?: OutputRailSpec[];
  dialogRails?: DialogRailSpec[];
  retrievalRails?: RetrievalRailSpec[];
  executionRails?: ExecutionRailSpec[];
  receiptSink?: (r: GuardrailReceipt) => void | Promise<void>;
  strictSeal?: boolean;
}

export interface InputRailSpec {
  name:
    | "self_check_input"
    | "jailbreak_detection"
    | "sensitive_data_detection"
    | "topic_safety"
    | "lambda_input_check";
  weight?: number;
}

export interface OutputRailSpec {
  name:
    | "self_check_output"
    | "fact_check"
    | "hallucination_check"
    | "pii_filter"
    | "lambda_output_check";
  weight?: number;
}

export interface DialogRailSpec {
  name: "scope_creep_check" | "consent_alignment" | "lambda_dialog_check";
  weight?: number;
}

export interface RetrievalRailSpec {
  name: "citation_check" | "context_provenance" | "lambda_retrieval_check";
  weight?: number;
}

export interface ExecutionRailSpec {
  name: "tool_authority_check" | "anduril_refusal_check" | "lambda_execution_check";
  weight?: number;
}

export interface GuardCallInput {
  subject: string;
  prompt: string;
  response?: string;
  retrievedContext?: { corpusId: string; reference: string; text: string }[];
  toolCall?: { tool: string; args: unknown; capability: string };
  conversation?: { role: "user" | "assistant"; content: string }[];
  metadata?: Record<string, string>;
}
