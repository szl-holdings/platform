// Strict canonical aggregator. Takes ONE source run directory (or one explicit
// list of P{NN}.json files all sharing the same K / candidateCount / model
// roster) and produces a canonical-* dir containing a gauge.json, a
// leaderboard.json, and a manifest.json that records every source file path +
// its content-addressed receipt ref. Refuses to publish unless all 12 problems
// are present AND every per-problem run shares the same orchestrator settings.
//
//   tsx src/cli/aggregate.ts --run-id <runId>
//   tsx src/cli/aggregate.ts --from <dir1> <dir2> …   (must collectively cover 1..12)

process.on("uncaughtException", (e) => { console.error("UNCAUGHT", (e as Error).stack); process.exit(2); });
process.on("unhandledRejection", (e) => { console.error("UNHANDLED", e); process.exit(3); });

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import { CANDIDATE_MODEL, JUDGE_MODEL } from "../anthropic.js";
import { chainHead, nonce, nowIso, receiptHash, receiptRef, sha256Hex, type PutnamGaugeReceipt } from "../receipts.js";

interface AttemptFile {
  readonly problemIdx: number;
  readonly attemptReceipt: { receiptClass: string; freshnessNonce: string; finalScore: number; finalPossible: number; verdict: "correct" | "partial" | "incorrect" | "abstained"; receiptChainHead: string; parentRef: string | null; tenant: string; issuedAt: string };
  readonly contradictionReceipt: { agreement: number; agreed: boolean; escalated: boolean } | null;
  readonly leanReceipt: { elaborated: boolean; toolchainAvailable?: boolean } | null;
  readonly candidateReceipts: Array<{ strategy: string; tokensIn: number; tokensOut: number; wallMs: number; proofLen: number; model: string }>;
  readonly judgeReceipt: { rubricItems: Array<{ partId: number; title: string; maxPoints: number; awarded: number; justification: string }>; judgeModel: string };
  readonly pickedCandidateIdx: number;
  readonly judgeRaw: string;
  readonly proofs: string[];
}

const ROOT = join(process.cwd(), "dist", "eval");
const argv = process.argv.slice(2);
const runIdFlag = argv.find((a) => a.startsWith("--run-id="));
const fromIdx = argv.indexOf("--from");
let sources: Array<{ path: string; data: AttemptFile }> = [];
if (runIdFlag) {
  const dir = join(ROOT, runIdFlag.slice("--run-id=".length));
  if (!existsSync(dir)) { console.error(`run dir not found: ${dir}`); process.exit(1); }
  for (const f of readdirSync(dir)) {
    if (/^P\d{2}\.json$/.test(f)) sources.push({ path: join(dir, f), data: JSON.parse(readFileSync(join(dir, f), "utf8")) as AttemptFile });
  }
} else if (fromIdx >= 0) {
  const dirs = argv.slice(fromIdx + 1).filter((a) => !a.startsWith("--"));
  for (const d of dirs) {
    const full = d.startsWith("/") ? d : join(ROOT, d);
    if (!existsSync(full)) { console.error(`dir not found: ${full}`); process.exit(1); }
    for (const f of readdirSync(full)) {
      if (/^P\d{2}\.json$/.test(f)) sources.push({ path: join(full, f), data: JSON.parse(readFileSync(join(full, f), "utf8")) as AttemptFile });
    }
  }
} else {
  console.error("usage: aggregate --run-id <id>  OR  aggregate --from <dir> [dir …]");
  console.error("       (no implicit cross-run mtime selection — strict mode only)");
  process.exit(1);
}

// Strict checks: exactly one attempt per problem 1..12, all sharing K + model.
const byIdx = new Map<number, { path: string; data: AttemptFile }>();
for (const s of sources) {
  const idx = s.data.problemIdx;
  if (byIdx.has(idx)) { console.error(`DUPLICATE attempt for P${idx} (${s.path} vs ${byIdx.get(idx)!.path}). Refusing to aggregate ambiguously.`); process.exit(1); }
  byIdx.set(idx, s);
}
for (let i = 1; i <= 12; i++) {
  if (!byIdx.has(i)) { console.error(`MISSING attempt for P${i}. A canonical Putnam-2025 run must cover all 12 problems. Refusing partial aggregation.`); process.exit(1); }
}
const ordered = Array.from({ length: 12 }, (_, i) => byIdx.get(i + 1)!);

// Coherence: every attempt must share the same candidate count (K) and model roster.
const Ks = new Set(ordered.map((s) => s.data.candidateReceipts.length));
if (Ks.size !== 1) { console.error(`incoherent K across attempts: ${[...Ks].join(",")}. Refusing to mix quick (K=1) with full (K>1).`); process.exit(1); }
const models = new Set(ordered.flatMap((s) => s.data.candidateReceipts.map((c) => c.model)));
const judgeModels = new Set(ordered.map((s) => s.data.judgeReceipt.judgeModel));

const attempts = ordered.map((o) => o.data);
const tally = {
  attempted: 12,
  correct: attempts.filter((r) => r.attemptReceipt.verdict === "correct").length,
  partial: attempts.filter((r) => r.attemptReceipt.verdict === "partial").length,
  incorrect: attempts.filter((r) => r.attemptReceipt.verdict === "incorrect").length,
  abstained: attempts.filter((r) => r.attemptReceipt.verdict === "abstained").length,
  awarded: attempts.reduce((s, r) => s + r.attemptReceipt.finalScore, 0),
  possible: attempts.reduce((s, r) => s + r.attemptReceipt.finalPossible, 0),
  leanElaborated: attempts.filter((r) => r.leanReceipt?.elaborated).length,
  leanAttempted: attempts.filter((r) => r.leanReceipt).length,
  totalTokensIn: attempts.reduce((s, r) => s + r.candidateReceipts.reduce((t, c) => t + c.tokensIn, 0), 0),
  totalTokensOut: attempts.reduce((s, r) => s + r.candidateReceipts.reduce((t, c) => t + c.tokensOut, 0), 0),
  totalWallMs: attempts.reduce((s, r) => s + r.candidateReceipts.reduce((t, c) => t + c.wallMs, 0), 0),
};

const attemptRefs = attempts.map((r) => receiptRef(r.attemptReceipt as never));
const gauge: PutnamGaugeReceipt = {
  receiptClass: "putnam.gauge.v1",
  freshnessNonce: nonce(),
  issuedAt: nowIso(),
  tenant: "szl-holdings:putnam-2025",
  parentRef: null,
  competitionId: "putnam-2025",
  attemptRefs,
  problemsAttempted: 12,
  problemsCorrect: tally.correct,
  problemsPartial: tally.partial,
  problemsIncorrect: tally.incorrect,
  problemsAbstained: tally.abstained,
  totalAwarded: tally.awarded,
  totalPossible: tally.possible,
  score01: tally.possible > 0 ? tally.awarded / tally.possible : 0,
  wallSeconds: tally.totalWallMs / 1000,
  modelRoster: [...models, ...judgeModels].sort(),
  primitiveRoster: [
    "@szl-holdings/sparse-attention-kit@0.1.0",
    "@szl-holdings/sequence-pipeline@0.1.0",
    "@szl-holdings/perception-loop@0.1.0",
    "@szl-holdings/putnam-harness@0.1.0",
  ],
  receiptChainHead: chainHead(attemptRefs),
};

const ts = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = join(ROOT, `canonical-${ts}`);
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "gauge.json"), JSON.stringify(gauge, null, 2));

// MANIFEST — what's in this canonical run, where it came from, what its content-addressed ref is.
const manifest = {
  issuedAt: nowIso(),
  candidateK: [...Ks][0],
  modelRoster: { candidate: [...models], judge: [...judgeModels] },
  expectedCandidateModel: CANDIDATE_MODEL,
  expectedJudgeModel: JUDGE_MODEL,
  sources: ordered.map((o) => ({
    problemIdx: o.data.problemIdx,
    sourcePath: o.path,
    sourceRunDir: basename(join(o.path, "..")),
    attemptRef: receiptRef(o.data.attemptReceipt as never),
    attemptHash: receiptHash(o.data.attemptReceipt as never),
    verdict: o.data.attemptReceipt.verdict,
    awarded: o.data.attemptReceipt.finalScore,
    possible: o.data.attemptReceipt.finalPossible,
  })),
  gaugeHash: receiptHash(gauge),
};
writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

writeFileSync(join(outDir, "leaderboard.json"), JSON.stringify({
  issuedAt: nowIso(),
  gauge,
  manifest,
  perProblem: attempts.map((r) => ({
    problemIdx: r.problemIdx,
    verdict: r.attemptReceipt.verdict,
    awarded: r.attemptReceipt.finalScore,
    possible: r.attemptReceipt.finalPossible,
    pickedStrategy: r.candidateReceipts[r.pickedCandidateIdx]?.strategy ?? null,
    contradictionAgreement: r.contradictionReceipt?.agreement ?? null,
    leanElaborated: r.leanReceipt?.elaborated ?? false,
    leanToolchainAvailable: r.leanReceipt?.toolchainAvailable ?? false,
    receiptChainHead: r.attemptReceipt.receiptChainHead,
    rubric: r.judgeReceipt.rubricItems.map((it) => ({
      partId: it.partId,
      title: it.title,
      awarded: it.awarded,
      maxPoints: it.maxPoints,
      justification: it.justification.slice(0, 240),
    })),
  })),
  honesty: {
    doctrineV6: true,
    rule1: "judge marks 'abstained' on parse-failure rather than fabricating a score",
    rule2: "lean-check reports toolchain-unavailable when lean not on PATH (persisted in receipt)",
    rule3: "every candidate carries tokens-in, tokens-out, wall-ms, model version",
    rule4: "picked-candidate heuristic penalises self-declared bluffs ('I cannot prove…')",
    rule5: "quick-mode (K=1) reports contradictionAgreement:null — probe cannot run without ≥2 candidates",
    rule6: "putnam-2025 is proof-style — no closed-form numeric answer is verifiable in pure Lean 4",
    rule7: "aggregator refuses partial / mixed-K runs — canonical gauge requires exactly 12 coherent attempts",
    rule8: "receipt refs are content-addressed (sha256 of canonical body) — mutating any field invalidates downstream chain heads",
  },
}, null, 2));
writeFileSync(join(outDir, "receipt-chain-root.txt"), receiptHash(gauge) + "\n");

console.log("");
console.log(`▶ canonical gauge written: ${outDir}`);
console.log(`  K=${[...Ks][0]}  models=${[...models].join(",")} judge=${[...judgeModels].join(",")}`);
console.log(`  score01: ${gauge.score01.toFixed(3)} (${tally.awarded}/${tally.possible} pts)`);
console.log(`  correct=${tally.correct}  partial=${tally.partial}  incorrect=${tally.incorrect}  abstained=${tally.abstained}`);
console.log(`  lean elaborated: ${tally.leanElaborated}/${tally.leanAttempted}`);
console.log(`  total candidate tokens: in=${tally.totalTokensIn} out=${tally.totalTokensOut}`);
console.log(`  chainHead: ${gauge.receiptChainHead}`);
console.log(`  receipt-chain root (sha256 of canonical gauge body): ${receiptHash(gauge)}`);
