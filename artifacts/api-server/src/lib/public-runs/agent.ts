/**
 * TrustDocAttestor — the first canonical public agent.
 *
 * What it does, deterministically:
 *   Given a trust-document ID (e.g. "A11OY-01-fedramp-authorization-disclosure"),
 *   reads the corresponding markdown file from docs/trust/, computes structured
 *   metadata, and runs it through the codex-kernel `runLoop()` to produce a
 *   hash-chained trace plus a final immutable state hash.
 *
 * Why this is the right "first canonical run":
 *   - Inputs are entirely public (the trust docs are in the repo).
 *   - Outputs are bit-for-bit reproducible (no clock, no RNG, no I/O leakage).
 *   - The agent's output IS a real claim about a real document — meta-coherent
 *     with the proof-surface premise: every claim we make can be replayed back
 *     to its primary source.
 *
 * The kernel's runLoop produces a typed trace (TraceEvent[]) + a proof ledger
 * (ProofLedgerEntry[]) + a final_state. We capture all of it as the run record.
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  runLoop,
  hashJson,
  canonicalize,
  type KernelConfig,
  type KernelRunResult,
  type StepProposal,
  type Json,
} from "@workspace/codex-kernel";

export const PUBLIC_TRUST_DOC_IDS = [
  "A11OY-01-fedramp-authorization-disclosure",
  "A11OY-02-cmmc-nist-800-171-gap-assessment",
  "A11OY-03-bias-testing-methodology",
  "A11OY-04-us-data-residency",
  "A11OY-05-incident-response-72hr",
  "AMARU-01-data-classification",
  "AMARU-02-retention-deletion",
  "AMARU-03-cots-erp-integration",
  "AMARU-04-privacy-impact-assessment",
  "SENTRA-01-soc2-type-2-plan",
  "SENTRA-02-incident-response-runbook",
  "SENTRA-03-threat-feed-catalog",
  "SENTRA-04-penetration-testing-plan",
] as const;

export type PublicTrustDocId = (typeof PUBLIC_TRUST_DOC_IDS)[number];

export interface PublicAgentInput extends Record<string, Json> {
  agent_id: "TrustDocAttestor";
  agent_version: "1.0.0";
  doc_id: string;
  doc_text_sha256: string;
  doc_text_length: number;
}

export interface AgentState extends Record<string, Json> {
  step_label: string;
  doc_id: string;
  doc_text_sha256: string;
  word_count: number;
  section_count: number;
  references_pii: boolean;
  classification: "Public" | "Internal" | "Confidential";
  conclusion: string;
}

const TRUST_DOCS_DIR = path.resolve(process.cwd(), "..", "..", "docs", "trust");

function findTrustDocPath(docId: string): string {
  const lower = docId.toLowerCase();
  const candidates = fs.readdirSync(TRUST_DOCS_DIR)
    .filter((f) => f.endsWith(".md"))
    .filter((f) => {
      const baseLower = f.toLowerCase();
      return baseLower === `${lower}.md` || baseLower.startsWith(`${lower}.`) || baseLower.startsWith(`${lower}-`);
    });
  if (candidates.length === 0) {
    throw new Error(`No trust doc matches id="${docId}" in ${TRUST_DOCS_DIR}`);
  }
  candidates.sort((a, b) => b.length - a.length);
  return path.join(TRUST_DOCS_DIR, candidates[0]);
}

export function buildAgentInput(docId: string): PublicAgentInput {
  const docPath = findTrustDocPath(docId);
  const text = fs.readFileSync(docPath, "utf8");
  const sha = createHash("sha256").update(text).digest("hex");
  return {
    agent_id: "TrustDocAttestor",
    agent_version: "1.0.0",
    doc_id: docId,
    doc_text_sha256: sha,
    doc_text_length: text.length,
  };
}

/**
 * Generator yielding three deterministic StepProposal objects:
 *   1. parse:    word/section count + PII flag
 *   2. classify: derive Public vs Confidential from PII flag
 *   3. conclude: emit human-readable conclusion
 *
 * Pure: no clock, no RNG, no I/O outside of the trust doc read above.
 */
function* buildStepGenerator(input: PublicAgentInput): Generator<StepProposal<AgentState>, void, AgentState> {
  const docPath = findTrustDocPath(input.doc_id);
  const text = fs.readFileSync(docPath, "utf8");
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const sectionCount = (text.match(/^#{1,6}\s/gm) || []).length;
  const referencesPii = /\b(PII|Personal Identifiable Information|GDPR|HIPAA|SSN|CUI)\b/i.test(text);
  const classification: AgentState["classification"] = referencesPii ? "Confidential" : "Public";

  // Step 1 — parse
  yield {
    pipeline_stage: "Context",
    observation: { input } as Json,
    proposeDelta: () => ({
      step_label: "parse",
      word_count: wordCount,
      section_count: sectionCount,
      references_pii: referencesPii,
    }) as Json,
    validators: [
      () => ({
        name: "non_empty_doc",
        severity: wordCount > 0 ? "pass" : "hard_fail",
        summary: `word_count=${wordCount}`,
      }),
    ],
    buildReceipt: () => null,
  };

  // Step 2 — classify
  yield {
    pipeline_stage: "Recommendation",
    observation: { word_count: wordCount, references_pii: referencesPii } as Json,
    proposeDelta: () => ({ step_label: "classify", classification }) as Json,
    validators: [
      () => ({
        name: "classification_in_set",
        severity: "pass",
        summary: `classification=${classification}`,
      }),
    ],
    buildReceipt: () => ({
      decision_type: "classify",
      summary: `Document classified as ${classification}`,
      assumptions: [
        "PII keywords trigger Confidential; otherwise Public",
        "Documents without PII keywords are deemed safe to publish under our open-trust posture",
      ],
      evidence: [
        { kind: "document", ref: `docs/trust/${input.doc_id}.md` },
        { kind: "hash", ref: input.doc_text_sha256 },
      ],
      policy_version: "trust-doc-attestor-v1.0.0",
      approval_status: "not_required",
      mocked: false,
    }),
  };

  // Step 3 — conclude
  yield {
    pipeline_stage: "Outcome",
    observation: { classification } as Json,
    proposeDelta: () => ({
      step_label: "conclude",
      conclusion: `Document ${input.doc_id} classified as ${classification}; publishable on the public trust surface.`,
    }) as Json,
    validators: [
      () => ({ name: "conclusion_present", severity: "pass", summary: "conclusion populated" }),
    ],
    buildReceipt: () => null,
  };
}

/** Build the kernel config for one canonical run. */
export function buildKernelConfig(input: PublicAgentInput): KernelConfig<AgentState> {
  const initial_state: AgentState = {
    step_label: "init",
    doc_id: input.doc_id,
    doc_text_sha256: input.doc_text_sha256,
    word_count: 0,
    section_count: 0,
    references_pii: false,
    classification: "Public",
    conclusion: "",
  };

  return {
    experiment_id: `trustdoc:${input.doc_id}`,
    initial_state,
    policy_version: "trust-doc-attestor-v1.0.0",
    budgets: { time_budget_ms: 60_000, step_budget: 16, retry_budget: 0 },
    loop_policy: {
      max_steps: 16,
      adaptive_depth: { enabled: false },
      entropy_regularized_exit: { enabled: false },
    },
    governance_enabled: true,
    steps: buildStepGenerator(input),
    // FIXED clock — required for deterministic replay. Every run gets identical timestamps.
    now: () => "1970-01-01T00:00:00.000Z",
  };
}

/**
 * Compute a content-addressable output hash that captures the agent identity,
 * the input, and the final state. Distinct from the kernel's chained
 * final_state_hash so we can compare both surfaces at attestation time.
 */
export function computeOutputHash(input: PublicAgentInput, finalState: AgentState): string {
  const envelope: Json = {
    agent_id: input.agent_id,
    agent_version: input.agent_version,
    doc_id: input.doc_id,
    input,
    final_state: finalState,
  };
  return hashJson(envelope);
}

export function executeCanonicalRun(docId: string): {
  input: PublicAgentInput;
  result: KernelRunResult<AgentState>;
  outputHash: string;
} {
  const input = buildAgentInput(docId);
  const cfg = buildKernelConfig(input);
  const result = runLoop<AgentState>(cfg);
  const outputHash = computeOutputHash(input, result.final_state);
  return { input, result, outputHash };
}

export function replayCanonicalRun(input: PublicAgentInput): { result: KernelRunResult<AgentState>; outputHash: string } {
  const cfg = buildKernelConfig(input);
  const result = runLoop<AgentState>(cfg);
  const outputHash = computeOutputHash(input, result.final_state);
  return { result, outputHash };
}

export const _internal = { findTrustDocPath, canonicalize };
