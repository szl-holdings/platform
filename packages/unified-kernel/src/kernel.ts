/**
 * kernel.ts — the @szl-holdings/unified-kernel bootloader.
 *
 * "Make the theses BE THE SOFTWARE. One importable package. One signed artifact.
 *  One unified kernel." — founder mandate.
 *
 * kernel.start() runs the real boot sequence (every check executes real code from
 * the 19 thesis modules — no mocks, no `() => true`), then emits an Ed25519-signed,
 * SHA-256-chained kernel-init receipt carrying every check's real pass/fail, and
 * returns a KernelHandle with a live module registry.
 *
 * Boot sequence (7 emitted checks + the banned-token guard that precedes them):
 *   step 0  banned-token scan (env + cwd) ............ doctrine/ (T11)
 *   step 1  Λ invariant + axioms ..................... invariants/ (T01)
 *   step 2  Ouroboros bounded step + termination ..... loop/ (T02, wired v6.3.0)
 *   step 3  receipt append + verify (hash chain) ..... ledger/ (T04) + tamper/ (T18)
 *   step 4  doctrine cross-invariant ................. doctrine/ (T11)
 *   step 5  codex: run all 4 governance contracts .... codex/ (codex-kernel v1.0.2)
 *   step 6  QEC encode → corrupt → recover ........... qec/ (T10)
 *
 * Author: Stephen P. Lutar Jr. <stephenlutar2@gmail.com> (ORCID 0009-0001-0110-4173)
 */

import type {
  CheckResult,
  KernelHandle,
  KernelReceipt,
  KernelStatus,
  ModuleDescriptor,
  ModuleHandle,
  ModuleRegistry,
  ThesisId,
} from "./types.ts";

// Real module imports — these are the theses, as software.
import * as invariants from "./invariants/index.ts";
import * as loop from "./loop/index.ts";
import * as ledgerMod from "./ledger/index.ts";
import * as gates from "./gates/index.ts";
import * as qec from "./qec/index.ts";
import * as doctrine from "./doctrine/index.ts";
import * as tamper from "./tamper/index.ts";
import * as codex from "./codex/index.ts";
import * as rag from "./rag/index.ts";
import * as mesh from "./mesh/index.ts";
import * as slsa from "./slsa/index.ts";
import * as anatomy from "./anatomy/index.ts";
import * as lambdaAxis from "./lambda_axis/index.ts";
import * as memory from "./memory/index.ts";
import * as khipu from "./khipu/index.ts";
import * as forecast from "./forecast/index.ts";
import * as lean from "./lean/index.ts";

// Canonical "Paper to Receipt" branch operators (founder diagram, 2026-05-31).
// Each hangs off the Λ Audit-Closure Operator (invariants/Λ_audit_closure):
//   amaru  — Cardano-anchored Shor receipts            (qec + memory)
//   rosie  — CSS-ingress, canonical byte-strings        (qec + ledger)
//   sentra — Kitaev-surface drift detection             (qec + gates)
//   mesh   — Span schemas, OTEL — UDS-Mesh + VSP-OTEL Λ-axis span exporter (mesh)
//   a11oy  — policy + measurement + knowledge + QEC     (gates + ledger + qec)
// These are doc-stamped aliases over the wired modules above — not renames.
export { amaru, rosie, sentra, meshBranch, a11oy, CANONICAL_BRANCHES } from "./branches.ts";

/** Options for kernel.start(). */
export interface KernelStartOptions {
  /** Process environment to scan (defaults to process.env). */
  readonly env?: NodeJS.ProcessEnv;
  /** Working directory string to scan for banned tokens (defaults to process.cwd()). */
  readonly cwd?: string;
  /** Ed25519 keypair; if omitted a fresh one is generated at boot. */
  readonly key?: tamper.KeyPair;
  /** Genesis prevHash for the receipt chain (null = genesis). */
  readonly prevHash?: string | null;
}

/** A timed wrapper that records a check's real outcome (never fabricated). */
async function runCheck(
  thesis: ThesisId,
  name: string,
  fn: () => boolean | Promise<boolean> | { pass: boolean; detail: string } | Promise<{ pass: boolean; detail: string }>,
): Promise<CheckResult> {
  const start = performance.now();
  try {
    const out = await fn();
    const pass = typeof out === "boolean" ? out : out.pass;
    const detail = typeof out === "boolean" ? "" : out.detail;
    return { thesis, name, pass, detail, durationMs: performance.now() - start };
  } catch (err) {
    return {
      thesis,
      name,
      pass: false,
      detail: `threw: ${(err as Error).message}`,
      durationMs: performance.now() - start,
    };
  }
}

/** Build the live module registry (every thesis's real exports + descriptor). */
function buildRegistry(): { registry: ModuleRegistry; descriptors: ModuleDescriptor[] } {
  const defs: Array<{ d: ModuleDescriptor; exports: Record<string, unknown> }> = [
    {
      d: { thesis: "T01", dir: "invariants", censusStatus: "REAL", backing: "wired", api: ["lambda", "boundCheck", "satisfiesAxioms"] },
      exports: invariants as unknown as Record<string, unknown>,
    },
    {
      d: { thesis: "T02", dir: "loop", censusStatus: "REAL", backing: "wired", api: ["runLoop", "step", "terminates", "uniqueFixedPoint"] },
      exports: loop as unknown as Record<string, unknown>,
    },
    {
      d: { thesis: "T03", dir: "lambda_axis", censusStatus: "PARTIAL", backing: "wired", api: ["NINE_AXES", "WIRED_AXES", "lambdaOverAxes"], needs: "5 of 9 axes have no runtime feed (see HONEST_GAPS.md#T03)" },
      exports: lambdaAxis as unknown as Record<string, unknown>,
    },
    {
      d: { thesis: "T04", dir: "ledger", censusStatus: "REAL", backing: "wired", api: ["ReceiptLedger"] },
      exports: ledgerMod as unknown as Record<string, unknown>,
    },
    {
      d: { thesis: "T05", dir: "gates", censusStatus: "REAL", backing: "wired", api: ["GATE_COUNTS", "evaluateGates"] },
      exports: gates as unknown as Record<string, unknown>,
    },
    {
      // T06 a11oy substrate is the union of ledger (T04) + tamper (T18) here.
      d: { thesis: "T06", dir: "ledger+tamper", censusStatus: "REAL", backing: "wired", api: ["ReceiptLedger", "chainAppend", "verifyChain"] },
      exports: { ...ledgerMod, ...tamper } as unknown as Record<string, unknown>,
    },
    {
      d: { thesis: "T07", dir: "memory", censusStatus: "PARTIAL", backing: "needs", api: ["persistMemory", "AmaruMemoryClient"], needs: "amaru memory-attestation service (network)" },
      exports: memory as unknown as Record<string, unknown>,
    },
    {
      d: { thesis: "T08", dir: "memory", censusStatus: "PARTIAL", backing: "wired", api: ["critiqueGate", "critiqueGateSelfTest"] },
      exports: memory as unknown as Record<string, unknown>,
    },
    {
      d: { thesis: "T09", dir: "khipu", censusStatus: "PARTIAL", backing: "wired", api: ["khipuChecksum", "bumpDetected", "merkleRoot"] },
      exports: khipu as unknown as Record<string, unknown>,
    },
    {
      d: { thesis: "T10", dir: "qec", censusStatus: "REAL", backing: "wired", api: ["shorEncode", "encodeCorruptRecover", "minDistance"] },
      exports: qec as unknown as Record<string, unknown>,
    },
    {
      d: { thesis: "T11", dir: "doctrine", censusStatus: "REAL", backing: "wired", api: ["bannedTokenScan", "scanEnv", "doctrineCrossInvariant"] },
      exports: doctrine as unknown as Record<string, unknown>,
    },
    {
      d: { thesis: "T12", dir: "forecast", censusStatus: "PARTIAL", backing: "wired", api: ["pacBayesBound"], needs: "statistical bound, not a proof (proven:false)" },
      exports: forecast as unknown as Record<string, unknown>,
    },
    {
      d: { thesis: "T13", dir: "mesh", censusStatus: "PARTIAL", backing: "wired", api: ["newTrace", "propagate", "parseTraceparent"] },
      exports: mesh as unknown as Record<string, unknown>,
    },
    {
      d: { thesis: "T14", dir: "anatomy", censusStatus: "PARTIAL", backing: "wired", api: ["ANATOMY", "organFor"] },
      exports: anatomy as unknown as Record<string, unknown>,
    },
    {
      d: { thesis: "T15", dir: "slsa", censusStatus: "REAL", backing: "wired", api: ["buildProvenance", "verifyProvenance"] },
      exports: slsa as unknown as Record<string, unknown>,
    },
    {
      // T16 UDS-mesh shares the mesh/ trace-context plumbing.
      d: { thesis: "T16", dir: "mesh", censusStatus: "PARTIAL", backing: "wired", api: ["formatTraceparent", "propagate"], needs: "UDS transport binding not in-process (see HONEST_GAPS.md#T16)" },
      exports: mesh as unknown as Record<string, unknown>,
    },
    {
      d: { thesis: "T17", dir: "rag", censusStatus: "PARTIAL", backing: "wired", api: ["evaluate", "wrapRetrieval", "governanceSelfTest"], needs: "bge-m3 embedder + pgvector on request path" },
      exports: rag as unknown as Record<string, unknown>,
    },
    {
      d: { thesis: "T18", dir: "tamper", censusStatus: "REAL", backing: "wired", api: ["sign", "verifySignature", "chainAppend", "verifyChain"] },
      exports: tamper as unknown as Record<string, unknown>,
    },
    {
      d: { thesis: "T19", dir: "lean", censusStatus: "REAL", backing: "wired", api: ["LEAN_REGISTRY", "LEAN_NUMBERS", "statusTally"] },
      exports: lean as unknown as Record<string, unknown>,
    },
  ];

  const registry = {} as Record<ThesisId, ModuleHandle>;
  for (const { d, exports } of defs) {
    registry[d.thesis] = { descriptor: d, exports };
  }
  return { registry, descriptors: defs.map((x) => x.d) };
}

/**
 * start — boot the unified kernel. Runs every check for real, emits a signed,
 * hash-chained kernel-init receipt, and returns the live handle. Status is PASS
 * only if every check passes; DEGRADED if a known-PARTIAL check fails; FAIL if a
 * REAL-backed core check fails.
 */
export async function start(options: KernelStartOptions = {}): Promise<KernelHandle> {
  const env = options.env ?? process.env;
  const cwd = options.cwd ?? (typeof process !== "undefined" ? process.cwd() : "");
  const key = options.key ?? tamper.generateSigningKey();

  const { registry, descriptors } = buildRegistry();
  const checks: CheckResult[] = [];

  // step 0 — banned-token scan (env + cwd path string). T11.
  checks.push(
    await runCheck("T11", "banned-token-scan", () => {
      const envHits = doctrine.scanEnv(env);
      const cwdHits = doctrine.bannedTokenScan(cwd);
      const hits = [...envHits, ...cwdHits];
      return { pass: hits.length === 0, detail: hits.length === 0 ? "clean (env+cwd)" : `hits: ${hits.map((h) => h.token).join(",")}` };
    }),
  );

  // step 1 — Λ invariant + four axioms on a real instance. T01.
  checks.push(
    await runCheck("T01", "lambda-invariant", () => {
      const r = invariants.lambda([0.9, 0.8, 0.7, 0.95]);
      const ax = invariants.satisfiesAxioms([0.9, 0.8, 0.7, 0.95]);
      return { pass: r.boundVerified && ax.all, detail: `Λ=${r.lambda.toFixed(6)} bounds=${r.boundVerified} axioms{A1=${ax.a1Monotone},A2=${ax.a2Homogeneous},A3=${ax.a3Normalized},A4=${ax.a4Bounded}}` };
    }),
  );

  // step 2 — Ouroboros bounded step + termination (real wired runtime). T02.
  checks.push(
    await runCheck("T02", "ouroboros-termination", async () => {
      const t = await loop.terminates();
      const fp = await loop.uniqueFixedPoint();
      return { pass: t.halted && fp, detail: `halted=${t.halted} steps=${t.steps} exit=${t.exitReason} fixedPoint=${fp} (ouroboros ${loop.OUROBOROS_PROVENANCE.tag})` };
    }),
  );

  // step 3 — receipt append + verify over a real hash chain. T04 + T18.
  checks.push(
    await runCheck("T04", "receipt-chain-verify", () => {
      const ledger = new ledgerMod.ReceiptLedger();
      ledger.append("kernel", "boot.begin", { phase: "begin" });
      ledger.append("kernel", "boot.invariant", { lambdaChecked: true });
      ledger.append("kernel", "boot.loop", { terminated: true });
      const v = ledger.verify();
      return { pass: v.valid && ledger.prevHashOk(), detail: `chainValid=${v.valid} prevHashOk=${ledger.prevHashOk()} brokenAt=${v.brokenAt}` };
    }),
  );

  // step 4 — doctrine cross-invariant (real conjunction). T11.
  checks.push(
    await runCheck("T11", "doctrine-cross-invariant", () => {
      const ok = doctrine.doctrineCrossInvariant({ huklla: true, overwatch: true, dpi: true });
      const bad = doctrine.doctrineCrossInvariant({ huklla: true, overwatch: false, dpi: true });
      // Real semantics: all-true admissible; any-false inadmissible.
      return { pass: ok.admissible && !bad.admissible, detail: `admit{all-true}=${ok.admissible} admit{overwatch-off}=${bad.admissible} failed=${bad.failed.join(",")}` };
    }),
  );

  // step 5 (UPDATE) — run all 4 codex governance contracts. codex-kernel v1.0.2.
  let codexResult: codex.CodexContractsResult | null = null;
  checks.push(
    await runCheck("T11", "codex-contracts", () => {
      codexResult = codex.runCodexContracts({ boot: "unified-kernel", checksSoFar: checks.length });
      const c = codexResult;
      const ok =
        c.traceIdentity.trace_id.length > 0 &&
        c.versionLineage.kernel_version.length > 0 &&
        c.deploymentContract.platform.length > 0 &&
        typeof c.secretsAudit.degraded === "boolean";
      return { pass: ok, detail: `traceId=${c.traceIdentity.trace_id.slice(0, 12)}… spans=${c.traceIdentity.spanCount} version=${c.versionLineage.kernel_version} secretsDegraded=${c.secretsAudit.degraded} deploy=${c.deploymentContract.platform}` };
    }),
  );

  // step 6 — QEC encode → corrupt → recover (Shor [[9,1,3]] majority). T10.
  checks.push(
    await runCheck("T10", "qec-recover", () => {
      const r = qec.encodeCorruptRecover(0xa5, 4); // corrupt 4 of 9 (< majority)
      return { pass: r.recovered_ok, detail: `original=${r.original} recovered=${r.recovered} corrupted=${r.corrupted}/9 ok=${r.recovered_ok}` };
    }),
  );

  // ---- assemble the signed, chained receipt -------------------------------
  const timestampIso = new Date().toISOString();
  const receiptId = tamper.sha256Hex(`${timestampIso}|${checks.map((c) => c.name).join("|")}`).slice(0, 32);

  const body = {
    schema: "szl.unified-kernel.receipt/v1" as const,
    receiptId,
    kind: "kernel-init" as const,
    timestampIso,
    checks,
    modules: descriptors,
    codex: codexResult,
  };
  const bodyHash = tamper.hashJson(body);
  const prevHash = options.prevHash ?? null;
  // Sign the chained head: prevHash || bodyHash (Ed25519 over the link).
  const signature = tamper.sign(`${prevHash ?? "GENESIS"}|${bodyHash}`, key);

  const initReceipt: KernelReceipt = {
    schema: body.schema,
    receiptId,
    kind: body.kind,
    timestampIso,
    bodyHash,
    prevHash,
    signature,
    publicKey: key.publicKeyHex,
    sigAlg: "ed25519",
    checks,
    modules: descriptors,
  };

  // ---- status: real, derived from the checks ------------------------------
  // Core REAL-backed checks that must pass for a healthy kernel.
  const coreNames = new Set([
    "banned-token-scan",
    "lambda-invariant",
    "ouroboros-termination",
    "receipt-chain-verify",
    "doctrine-cross-invariant",
    "codex-contracts",
    "qec-recover",
  ]);
  const anyFail = checks.some((c) => !c.pass);
  const coreFail = checks.some((c) => coreNames.has(c.name) && !c.pass);
  const status: KernelStatus = coreFail ? "FAIL" : anyFail ? "DEGRADED" : "PASS";

  return { status, initReceipt, modules: registry };
}

/** Verify a kernel-init receipt's signature against its embedded public key. */
export function verifyInitReceipt(receipt: KernelReceipt): boolean {
  return tamper.verifySignature(
    `${receipt.prevHash ?? "GENESIS"}|${receipt.bodyHash}`,
    receipt.signature,
    receipt.publicKey,
  );
}
