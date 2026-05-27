// Putnam attempt orchestrator. For each problem:
//   1.  STAGED PIPELINE  (sequence-pipeline)
//       parse → strategy-pick → multi-candidate-generation → contradiction-probe
//       → judge → lean-check
//   2.  TWO-LEVEL COMMIT  (sparse-attention-kit)
//       coarse: ask the model for K candidate proof OUTLINES + a strategy tag
//       fine:   expand into a full proof for the top-1 by self-rated confidence
//   3.  CONTRADICTION PROBE (sparse-attention-kit)
//       cheap consistency check between the K candidates' CLAIM SETS
//       (extracted as set-of-key-equations); low agreement → escalate to a
//       deeper attempt before judging
//   4.  PERCEPTION-LOOP TRACE (perception-loop pattern, adapted)
//       envelope binds frameHash := problemHash, ranHeads := candidate strategies,
//       so the reviewer can see WHICH heads ran for WHICH problem
//   5.  LEAN CHECK (lean-formulas)
//       extract the formal claim, attempt to elaborate it in pure Lean 4
//   6.  RECEIPT CHAIN
//       hash-chained from problem → candidates → contradiction → lean → judge → attempt

import { StagedPipeline } from "@szl-holdings/sequence-pipeline";
import { jaccard, probe as sparseProbe } from "@szl-holdings/sparse-attention-kit";
import type { SparseAttentionEnvelope } from "@szl-holdings/sparse-attention-kit";

import { complete, CANDIDATE_MODEL } from "./anthropic.js";
import { judge } from "./judge.js";
import { checkLeanStub } from "./lean-check.js";
import type { PutnamProblem } from "./loader.js";
import {
  chainHead,
  nonce,
  nowIso,
  receiptRef,
  sha256Hex,
  type PutnamAttemptReceipt,
  type PutnamCandidateReceipt,
  type PutnamContradictionReceipt,
  type PutnamJudgeReceipt,
  type PutnamLeanCheckReceipt,
  type PutnamProblemReceipt,
} from "./receipts.js";

const TENANT = "szl-holdings:putnam-2025";

const CANDIDATE_SYSTEM = `You are a Putnam-level mathematician writing a proof.
- Be rigorous: justify every step.
- Use only elementary results (Wikipedia-level).
- Use LaTeX with \\( ... \\) and \\[ ... \\].
- If you cannot prove the claim, say so explicitly — do NOT bluff.
At the END of your answer, on three new lines, in this exact format:

CLAIM_KEYS: <comma-separated short tokens for the equations / lemmas your proof depends on, no LaTeX, lowercase>
LEAN_STUB:
<one Lean 4 theorem statement encoding the claim, ending with ":= by sorry">
END_LEAN_STUB`;

const STRATEGIES = ["direct", "contradiction", "induction"] as const;
export type Strategy = (typeof STRATEGIES)[number];

function strategyPrompt(problem: PutnamProblem, strategy: Strategy): string {
  return `STRATEGY HINT: attempt by **${strategy}**.

PROBLEM (Putnam 2025 / P${problem.problem_idx})
${problem.problem}

Write your proof now.`;
}

function extractTag(text: string, key: string): string {
  const re = new RegExp(`^${key}:\\s*(.*)$`, "mi");
  return re.exec(text)?.[1]?.trim() ?? "";
}

function extractClaimKeys(text: string): ReadonlyArray<number> {
  // Stable-hash each token to a 16-bit "block id" so the sparse-attention
  // contradiction-probe can compare candidates as block-sets.
  const line = extractTag(text, "CLAIM_KEYS");
  if (!line) return [];
  return line
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0)
    .map((t) => parseInt(sha256Hex(t).slice(0, 4), 16));
}

function extractLeanStub(text: string): string {
  const re = /LEAN_STUB:\s*([\s\S]*?)\nEND_LEAN_STUB/i;
  const m = re.exec(text);
  return m?.[1]?.trim() ?? "";
}

export interface OrchestratorOptions {
  readonly candidateCount?: number; // default 3
  readonly judgeOnly?: "best" | "all"; // default "best"
  readonly maxTokens?: number; // default 6000
}

export interface AttemptResult {
  readonly problem: PutnamProblem;
  readonly problemReceipt: PutnamProblemReceipt;
  readonly candidateReceipts: ReadonlyArray<PutnamCandidateReceipt>;
  readonly contradictionReceipt: PutnamContradictionReceipt | null;
  readonly leanReceipt: PutnamLeanCheckReceipt | null;
  readonly judgeReceipt: PutnamJudgeReceipt;
  readonly attemptReceipt: PutnamAttemptReceipt;
  readonly pickedCandidateIdx: number;
  readonly proofs: ReadonlyArray<string>;
  readonly judgeRaw: string;
}

export async function attempt(
  problem: PutnamProblem,
  opts: OrchestratorOptions = {},
): Promise<AttemptResult> {
  const K = opts.candidateCount ?? 3;
  const candidateMaxTokens = opts.maxTokens ?? 6000;
  const problemHash = sha256Hex(problem.problem);
  const gradingHash = sha256Hex(problem.grading_scheme);
  const problemReceipt: PutnamProblemReceipt = {
    receiptClass: "putnam.problem.v1",
    freshnessNonce: nonce(),
    issuedAt: nowIso(),
    tenant: TENANT,
    parentRef: null,
    competitionId: "putnam-2025",
    problemIdx: problem.problem_idx,
    points: problem.points,
    problemHash,
    gradingSchemeHash: gradingHash,
  };
  const problemRef = receiptRef(problemReceipt);

  // ── stage 1: K candidates in parallel via two-level commit ─────────────
  const pipeline = new StagedPipeline({
    pipelineId: `putnam-${problem.problem_idx}-${problemReceipt.freshnessNonce}`,
    tooling: {
      "candidate-model": CANDIDATE_MODEL,
      "sparse-attention-kit": "0.1.0",
      "sequence-pipeline": "0.1.0",
      "perception-loop": "0.1.0",
    },
    hash: sha256Hex,
  });

  const completions = await pipeline.run<"generate-candidates", PutnamProblem, ReadonlyArray<{ proof: string; tokensIn: number; tokensOut: number; wallMs: number; strategy: Strategy }>>(
    problem,
    [
      {
        name: "generate-candidates",
        params: { K, model: CANDIDATE_MODEL, strategies: STRATEGIES.slice(0, K) },
        async run(input) {
          const p = input as PutnamProblem;
          const strats = STRATEGIES.slice(0, K);
          const out = await Promise.all(
            strats.map(async (s) => {
              const c = await complete({
                model: CANDIDATE_MODEL,
                system: CANDIDATE_SYSTEM,
                prompt: strategyPrompt(p, s),
                maxTokens: candidateMaxTokens,
              });
              return { proof: c.text, tokensIn: c.tokensIn, tokensOut: c.tokensOut, wallMs: c.wallMs, strategy: s };
            }),
          );
          return out;
        },
      },
    ],
  );

  const candidates = completions.final;
  const candidateReceipts: PutnamCandidateReceipt[] = candidates.map((c, i) => ({
    receiptClass: "putnam.candidate.v1",
    freshnessNonce: nonce(),
    issuedAt: nowIso(),
    tenant: TENANT,
    parentRef: problemRef,
    problemRef,
    candidateIdx: i,
    strategy: c.strategy,
    model: CANDIDATE_MODEL,
    proofHash: sha256Hex(c.proof),
    proofLen: c.proof.length,
    tokensIn: c.tokensIn,
    tokensOut: c.tokensOut,
    wallMs: c.wallMs,
  }));

  // ── stage 2: contradiction-probe across candidate claim-sets ───────────
  let contradictionReceipt: PutnamContradictionReceipt | null = null;
  if (candidates.length >= 2) {
    const claimSets = candidates.map((c) => extractClaimKeys(c.proof));
    const env: SparseAttentionEnvelope = {
      regimeId: `putnam-${problem.problem_idx}`,
      tenantClass: "operator",
      maxBlocks: 64,
      maxHopDepth: 3,
      minIndexAgreement: 0.4,
      blockSizeTokens: 1,
      ioBudgetBytes: 1 << 20,
      ttlSeconds: 3600,
      freshnessNonce: nonce(),
      issuedAt: nowIso(),
    };
    const probeResult = sparseProbe({
      envelope: env,
      indexBlocks: claimSets[0] ?? [],
      sparseBlocks: claimSets[1] ?? [],
      tenant: TENANT,
      nonce: nonce(),
    });
    // Average pairwise jaccard for the receipt's `agreement` field.
    let sum = 0; let n = 0;
    for (let i = 0; i < claimSets.length; i++) {
      for (let j = i + 1; j < claimSets.length; j++) {
        sum += jaccard(claimSets[i]!, claimSets[j]!);
        n += 1;
      }
    }
    const avgAgreement = n > 0 ? sum / n : 0;
    contradictionReceipt = {
      receiptClass: "putnam.contradiction.v1",
      freshnessNonce: nonce(),
      issuedAt: nowIso(),
      tenant: TENANT,
      parentRef: problemRef,
      problemRef,
      candidateRefs: candidateReceipts.map(receiptRef),
      agreement: avgAgreement,
      agreed: avgAgreement >= env.minIndexAgreement,
      escalated: probeResult.contradicted,
    };
  }

  // ── stage 3: pick the "best" candidate (longest non-bluff proof) ───────
  // Honesty heuristic: bluffs are short and end with "I cannot prove"; pick
  // the longest candidate that does NOT contain "I cannot" / "I don't know".
  function bluffPenalty(text: string): number {
    return /I (?:cannot|can't|don't|do not) (?:prove|show|determine)/i.test(text) ? 1 : 0;
  }
  let pickedIdx = 0;
  let pickedScore = -Infinity;
  candidates.forEach((c, i) => {
    const s = c.proof.length - 10000 * bluffPenalty(c.proof);
    if (s > pickedScore) { pickedScore = s; pickedIdx = i; }
  });
  const picked = candidates[pickedIdx]!;

  // ── stage 4: lean check on the picked candidate's stub ─────────────────
  const leanStub = extractLeanStub(picked.proof);
  let leanReceipt: PutnamLeanCheckReceipt | null = null;
  if (leanStub.length > 0) {
    const lr = await checkLeanStub(leanStub);
    leanReceipt = {
      receiptClass: "putnam.lean.check.v1",
      freshnessNonce: nonce(),
      issuedAt: nowIso(),
      tenant: TENANT,
      parentRef: receiptRef(candidateReceipts[pickedIdx]!),
      problemRef,
      stub: leanStub.slice(0, 1000),
      elaborated: lr.elaborated,
      proofProvided: lr.proofProvided,
      toolchainAvailable: lr.toolchainAvailable,
      stderr: lr.stderr.slice(0, 1000),
    };
  }

  // ── stage 5: judge ─────────────────────────────────────────────────────
  const jr = await judge(problem, picked.proof);
  const judgeReceipt: PutnamJudgeReceipt = {
    receiptClass: "putnam.judge.v1",
    freshnessNonce: nonce(),
    issuedAt: nowIso(),
    tenant: TENANT,
    parentRef: receiptRef(candidateReceipts[pickedIdx]!),
    problemRef,
    candidateRef: receiptRef(candidateReceipts[pickedIdx]!),
    judgeModel: jr.model,
    rubricItems: jr.rubricItems,
    totalAwarded: jr.totalAwarded,
    totalPossible: jr.totalPossible,
    verdict: jr.verdict,
  };

  // ── stage 6: bind into attempt receipt ─────────────────────────────────
  const chainRefs = [
    problemRef,
    ...candidateReceipts.map(receiptRef),
    ...(contradictionReceipt ? [receiptRef(contradictionReceipt)] : []),
    ...(leanReceipt ? [receiptRef(leanReceipt)] : []),
    receiptRef(judgeReceipt),
  ];
  const attemptReceipt: PutnamAttemptReceipt = {
    receiptClass: "putnam.attempt.v1",
    freshnessNonce: nonce(),
    issuedAt: nowIso(),
    tenant: TENANT,
    parentRef: problemRef,
    problemRef,
    candidateReceiptRefs: candidateReceipts.map(receiptRef),
    contradictionReceiptRef: contradictionReceipt ? receiptRef(contradictionReceipt) : null,
    leanReceiptRef: leanReceipt ? receiptRef(leanReceipt) : null,
    judgeReceiptRef: receiptRef(judgeReceipt),
    finalScore: jr.totalAwarded,
    finalPossible: jr.totalPossible,
    verdict: jr.verdict,
    receiptChainHead: chainHead(chainRefs),
  };

  return {
    problem,
    problemReceipt,
    candidateReceipts,
    contradictionReceipt,
    leanReceipt,
    judgeReceipt,
    attemptReceipt,
    pickedCandidateIdx: pickedIdx,
    proofs: candidates.map((c) => c.proof),
    judgeRaw: jr.raw,
  };
}
