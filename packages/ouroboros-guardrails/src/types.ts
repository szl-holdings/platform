/**
 * Core types for @szl-holdings/guardrails — the drop-in LLM safety SKU.
 *
 * Design choice: surface compatibility with NVIDIA NeMo Guardrails Colang
 * config (input rails / output rails / dialog rails) so existing
 * NeMo configs port over with one import swap. Underneath, every gate
 * decision produces a closed-form Λ scalar and a tamper-evident receipt
 * — neither of which NeMo offers.
 */

export type RailVerdict = "PROCEED" | "QUARANTINE" | "ABORT";

export type RailKind =
  | "input"      // user prompt enters the system
  | "output"     // model response leaves the system
  | "dialog"     // multi-turn flow gate
  | "retrieval"  // RAG context injection
  | "execution"; // tool/agent action

export interface RailDecision {
  kind: RailKind;
  verdict: RailVerdict;
  /** Closed-form Λ ∈ [0,1] for this rail. Higher = safer. */
  lambda: number;
  /** Per-axis scores contributing to Λ. */
  axes: Record<string, number>;
  /** Failed primitive identifiers (e.g. "emerald.hermetic-seal"). */
  failed: string[];
  /** Passed primitive identifiers. */
  passed: string[];
  /** Human-readable rationale, declarative voice. */
  rationale: string;
  /** ISO-8601 wall-clock timestamp. */
  timestamp: string;
  /** Hash of the input payload at the moment of decision. */
  payloadHash: string;
}

export interface GuardrailReceipt {
  /** Receipt schema version. */
  version: "1.0.0";
  /** Globally unique receipt id (uuid v4 or content-addressed sha256). */
  id: string;
  /** Wall-clock UTC ISO-8601. */
  issuedAt: string;
  /** Identifies the deploying tenant (org). */
  tenantId: string;
  /** Identifies the agent / model / pipeline (caller-defined). */
  subject: string;
  /** Composite Λ across all rails: geometric mean of axis Λs (Egyptian unit-fraction safe). */
  lambda: number;
  /** Final action to take. ABORT > QUARANTINE > PROCEED. */
  action: RailVerdict;
  /** Each rail decision, in evaluation order. */
  rails: RailDecision[];
  /** Hash chain pointer to previous receipt (forms an append-only log). */
  prevReceiptHash?: string;
  /** SHA-256 of canonical JSON of this receipt minus `seal`. */
  contentHash: string;
  /** Hermetic seal — emerald hash of contentHash + tenant key id. */
  seal: string;
}

export interface GuardrailsConfig {
  tenantId: string;
  /** Order matters — input rails run first. */
  inputRails?: InputRailSpec[];
  outputRails?: OutputRailSpec[];
  dialogRails?: DialogRailSpec[];
  retrievalRails?: RetrievalRailSpec[];
  executionRails?: ExecutionRailSpec[];
  /**
   * Receipt sink. Supplies persistence: log file, S3, Kafka, Splunk, etc.
   * Default writes to in-memory ring buffer (testing only).
   */
  receiptSink?: (r: GuardrailReceipt) => void | Promise<void>;
  /**
   * If true, ABORT on any receipt seal failure. Default true.
   */
  strictSeal?: boolean;
}

export interface InputRailSpec {
  /** Drop-in name compatible with NeMo Guardrails. */
  name:
    | "self_check_input"
    | "jailbreak_detection"
    | "sensitive_data_detection"
    | "topic_safety"
    | "lambda_input_check";
  /** Optional axis weight override. */
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

/** What the user passes to `guard()`. */
export interface GuardCallInput {
  subject: string;
  prompt: string;
  response?: string;
  retrievedContext?: { corpusId: string; reference: string; text: string }[];
  toolCall?: { tool: string; args: unknown; capability: string };
  conversation?: { role: "user" | "assistant"; content: string }[];
  /** Optional caller-supplied metadata (model name, request id, etc.). */
  metadata?: Record<string, string>;
}
