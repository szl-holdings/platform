// Live evaluator. Runs the orchestrator over each requested Putnam-2025
// problem and writes per-problem JSON to dist/eval/<runId>/ AS THEY FINISH
// (so partial runs survive a kill), plus a terminal receipts.json /
// leaderboard.json gauge rollup.
//
//   tsx src/cli/eval-live.ts                   # all 12
//   tsx src/cli/eval-live.ts 1 3 7             # subset

process.on("uncaughtException", (e) => { console.error("UNCAUGHT", (e as Error).stack); process.exit(2); });
process.on("unhandledRejection", (e) => { console.error("UNHANDLED", e); process.exit(3); });

import { mkdirSync, writeFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { loadPutnam2025, getProblem } from "../loader.js";
import { attempt } from "../orchestrator.js";
import {
  chainHead,
  nonce,
  nowIso,
  receiptRef,
  sha256Hex,
  type PutnamGaugeReceipt,
} from "../receipts.js";
import { CANDIDATE_MODEL, JUDGE_MODEL } from "../anthropic.js";

const TENANT = "szl-holdings:putnam-2025";

async function main() {
  const argv = process.argv.slice(2);
  const quick = argv.includes("--quick");
  const runIdFlag = argv.find((a) => a.startsWith("--run-id="));
  const nums = argv.filter((a) => /^\d+$/.test(a));
  const requested = nums.length > 0
    ? nums.map((a) => Number(a)).map((i) => getProblem(i))
    : loadPutnam2025();
  const orchOpts = quick ? { candidateCount: 1, maxTokens: 2000 } : {};
  const runId = runIdFlag
    ? runIdFlag.slice("--run-id=".length)
    : `putnam-2025${quick ? "-quick" : ""}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const outDir = join(process.cwd(), "dist", "eval", runId);
  mkdirSync(outDir, { recursive: true });
  console.log(`▶ putnam-harness live eval — ${requested.length} problems, runId=${runId}`);

  const t0 = Date.now();
  const attemptRecords: Array<Awaited<ReturnType<typeof attempt>>> = [];
  const progressFile = join(outDir, "progress.jsonl");
  appendFileSync(progressFile, JSON.stringify({ event: "start", runId, requested: requested.map(r => r.problem_idx), at: nowIso() }) + "\n");
  for (const p of requested) {
    const ts = Date.now();
    console.log(`  P${String(p.problem_idx).padStart(2)} … start ${nowIso()}`);
    try {
      const r = await attempt(p, orchOpts);
      attemptRecords.push(r);
      // PERSIST PER-PROBLEM IMMEDIATELY so partial runs survive a kill.
      writeFileSync(join(outDir, `P${String(p.problem_idx).padStart(2, "0")}.json`), JSON.stringify({
        problemIdx: r.problem.problem_idx,
        problemReceipt: r.problemReceipt,
        candidateReceipts: r.candidateReceipts,
        contradictionReceipt: r.contradictionReceipt,
        leanReceipt: r.leanReceipt,
        judgeReceipt: r.judgeReceipt,
        attemptReceipt: r.attemptReceipt,
        pickedCandidateIdx: r.pickedCandidateIdx,
        proofs: r.proofs,
        judgeRaw: r.judgeRaw,
      }, null, 2));
      const line = `  P${String(p.problem_idx).padStart(2)} done ${r.attemptReceipt.verdict.padEnd(10)} ${r.attemptReceipt.finalScore}/${r.attemptReceipt.finalPossible} (lean:${r.leanReceipt?.elaborated ? "✓" : "✗"} agreement:${r.contradictionReceipt?.agreement?.toFixed(2) ?? "-"} ${((Date.now() - ts) / 1000).toFixed(1)}s)`;
      console.log(line);
      appendFileSync(progressFile, JSON.stringify({ event: "attempt", problemIdx: p.problem_idx, verdict: r.attemptReceipt.verdict, awarded: r.attemptReceipt.finalScore, possible: r.attemptReceipt.finalPossible, wallMs: Date.now() - ts, at: nowIso() }) + "\n");
    } catch (e) {
      console.log(`  P${String(p.problem_idx).padStart(2)} ERROR: ${(e as Error).message}`);
      appendFileSync(progressFile, JSON.stringify({ event: "error", problemIdx: p.problem_idx, error: (e as Error).message, at: nowIso() }) + "\n");
    }
  }
  const wallSeconds = (Date.now() - t0) / 1000;

  const tally = {
    attempted: attemptRecords.length,
    correct: attemptRecords.filter((r) => r.attemptReceipt.verdict === "correct").length,
    partial: attemptRecords.filter((r) => r.attemptReceipt.verdict === "partial").length,
    incorrect: attemptRecords.filter((r) => r.attemptReceipt.verdict === "incorrect").length,
    abstained: attemptRecords.filter((r) => r.attemptReceipt.verdict === "abstained").length,
    awarded: attemptRecords.reduce((s, r) => s + r.attemptReceipt.finalScore, 0),
    possible: attemptRecords.reduce((s, r) => s + r.attemptReceipt.finalPossible, 0),
    leanElaborated: attemptRecords.filter((r) => r.leanReceipt?.elaborated).length,
    leanAttempted: attemptRecords.filter((r) => r.leanReceipt).length,
  };
  const attemptRefs = attemptRecords.map((r) => receiptRef(r.attemptReceipt));
  const gauge: PutnamGaugeReceipt = {
    receiptClass: "putnam.gauge.v1",
    freshnessNonce: nonce(),
    issuedAt: nowIso(),
    tenant: TENANT,
    parentRef: null,
    competitionId: "putnam-2025",
    attemptRefs,
    problemsAttempted: tally.attempted,
    problemsCorrect: tally.correct,
    problemsPartial: tally.partial,
    problemsIncorrect: tally.incorrect,
    problemsAbstained: tally.abstained,
    totalAwarded: tally.awarded,
    totalPossible: tally.possible,
    score01: tally.possible > 0 ? tally.awarded / tally.possible : 0,
    wallSeconds,
    modelRoster: [CANDIDATE_MODEL, JUDGE_MODEL],
    primitiveRoster: [
      "@szl-holdings/sparse-attention-kit@0.1.0",
      "@szl-holdings/sequence-pipeline@0.1.0",
      "@szl-holdings/perception-loop@0.1.0",
      "@szl-holdings/putnam-harness@0.1.0",
    ],
    receiptChainHead: chainHead(attemptRefs),
  };

  const receiptsFile = join(outDir, "receipts.json");
  writeFileSync(receiptsFile, JSON.stringify({
    runId,
    issuedAt: nowIso(),
    gauge,
    attempts: attemptRecords.map((r) => ({
      problemIdx: r.problem.problem_idx,
      problemReceipt: r.problemReceipt,
      candidateReceipts: r.candidateReceipts,
      contradictionReceipt: r.contradictionReceipt,
      leanReceipt: r.leanReceipt,
      judgeReceipt: r.judgeReceipt,
      attemptReceipt: r.attemptReceipt,
      pickedCandidateIdx: r.pickedCandidateIdx,
      proofs: r.proofs,
      judgeRaw: r.judgeRaw,
    })),
  }, null, 2));

  // Public-facing leaderboard rollup (no proof texts, no raw judge text).
  const leaderboardFile = join(outDir, "leaderboard.json");
  writeFileSync(leaderboardFile, JSON.stringify({
    runId,
    issuedAt: nowIso(),
    gauge,
    perProblem: attemptRecords.map((r) => ({
      problemIdx: r.problem.problem_idx,
      verdict: r.attemptReceipt.verdict,
      awarded: r.attemptReceipt.finalScore,
      possible: r.attemptReceipt.finalPossible,
      pickedStrategy: r.candidateReceipts[r.pickedCandidateIdx]?.strategy ?? null,
      contradictionAgreement: r.contradictionReceipt?.agreement ?? null,
      leanElaborated: r.leanReceipt?.elaborated ?? null,
      receiptChainHead: r.attemptReceipt.receiptChainHead,
    })),
  }, null, 2));

  // Doctrine-V6 honest receipt fingerprint, printed for the operator.
  console.log("");
  console.log(`▶ gauge ${gauge.score01.toFixed(3)} (${tally.awarded}/${tally.possible} pts)`);
  console.log(`  correct=${tally.correct}  partial=${tally.partial}  incorrect=${tally.incorrect}  abstained=${tally.abstained}`);
  console.log(`  lean elaborated=${tally.leanElaborated}/${tally.leanAttempted}`);
  console.log(`  wall=${wallSeconds.toFixed(1)}s  chainHead=${gauge.receiptChainHead.slice(0, 16)}…`);
  console.log(`  receipts: ${receiptsFile}`);
  console.log(`  leaderboard: ${leaderboardFile}`);
  console.log(`  receipt-chain root: ${sha256Hex(JSON.stringify(gauge))}`);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
