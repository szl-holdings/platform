# @szl-holdings/unified-kernel

One importable package. One signed artifact. One unified kernel.

The 19 SZL theses are not *cited* here — they **are** the modules, and they
execute on every `kernel.start()`. Each `start()` runs the real boot sequence,
then emits an Ed25519-signed, SHA-256-chained `kernel-init` receipt carrying
every check's real pass/fail, and returns a `KernelHandle` with a live module
registry.

```ts
import { start, verifyInitReceipt } from "@szl-holdings/unified-kernel";

const kernel = await start();
console.log(kernel.status);                 // "PASS" | "DEGRADED" | "FAIL"
console.log(verifyInitReceipt(kernel.initReceipt)); // true
```

Run the boot demo:

```bash
pnpm boot     # tsx src/boot-demo.ts — prints every check + the signed receipt
pnpm test     # vitest — one boot-and-assert test per module + integration
```

## Boot sequence (7 emitted checks + the banned-token guard)

| step | check | module | thesis |
|------|-------|--------|--------|
| 0 | banned-token scan (env + cwd) | `doctrine/` | T11 |
| 1 | Λ invariant + four axioms | `invariants/` | T01 |
| 2 | Ouroboros bounded step + termination | `loop/` (wired v6.3.0) | T02 |
| 3 | receipt append + verify (hash chain) | `ledger/` + `tamper/` | T04 / T18 |
| 4 | doctrine cross-invariant | `doctrine/` | T11 |
| 5 | codex: run all 4 governance contracts | `codex/` | codex-kernel v1.0.2 |
| 6 | QEC encode → corrupt → recover | `qec/` | T10 |

## 19 theses → directories

T01 `invariants/`, T02 `loop/` (wired Ouroboros @ v6.3.0, NOT stubbed),
T03 `lambda_axis/`, T04 `ledger/`, T05 `gates/`, T06 `ledger/`+`tamper/`,
T07+T08 `memory/`, T09 `khipu/`, T10 `qec/`, T11 `doctrine/`, T12 `forecast/`,
T13+T16 `mesh/`, T14 `anatomy/`, T15 `slsa/`, T17 `rag/`, T18 `tamper/`,
T19 `lean/`. Plus `codex/` (codex-kernel v1.0.2 four contracts).

## Canonical "Paper to Receipt" architecture

The founder's canonical architecture (diagram, 2026-05-31) flows top-down:
Ouroboros Thesis v3–v18 (Zenodo DOIs, CC-BY 4.0) → Lutar-Lean (Lean 4 +
Mathlib v4.13.0) → Ouroboros Runtime (bounded loops, Apache 2.0) → the **Λ
Audit-Closure Operator** (THE central operator) → the branch operators
(amaru, rosie, sentra, UDS-Mesh, VSP-OTEL, a11oy) → Platform.

### The Λ Audit-Closure Operator

```ts
import { Λ_audit_closure, DOCTRINE_V7_AXIOMS } from "@szl-holdings/unified-kernel";

const closure = Λ_audit_closure(receiptBus, DOCTRINE_V7_AXIOMS);
// → { compositeLambda, perAxiom, pacBayesTailBound, bekensteinCapBits,
//     bekensteinRespected, reidemeisterClass, ... }
```

The Λ aggregator is proved in Lean 4 against 749 declarations / 14 unique axioms /
163 tracked sorries (Mathlib v4.13.0). Every gate decision emits a DSSE-signed
receipt onto a hash-linked Khipu Merkle DAG with summation-checked integrity. The
receipt chain is a SHA-256 prefix-hash append-only log; the Khipu DAG is a
three-tier Merkle structure (rootValue = Σ pendantValues). These form a
tamper-evident audit substrate (no measure-theoretic space is constructed; this
is a hash-linked log with summation invariants, which is enough). Three named
bounds are exported as individual primitives and tested:

- `pacBayesTailBound(prior, posterior, sampleSize, delta)` — McAllester (2003)
  PAC-Bayes tail bound on the confidence margin.
- `bekensteinCap(energyJ, radiusM)` — Bekenstein (1981) information-density cap
  (bits) on per-receipt entropy.
- `reidemeisterClass(receiptKnotChain)` — Reidemeister (1927) R1/R2/R3
  equivalence class of a receipt-knot chain.

The closure is proved in Lean 4 (Mathlib v4.13.0). `paperToReceipt(paper)`
demonstrates the full canonical path end to end (cite → Lean Λ-gate → Ouroboros
Runtime → rosie CSS-ingress → amaru Shor anchor → sentra Kitaev drift →
uds-mesh + vsp-otel span export).

### Canonical Lean numbers (live)

Live canonical corpus @ `main` HEAD `c7c0ba17` (builds clean): **749
declarations / 14 unique axioms (15 raw) / 163 sorries**. The kernel exports
`getCanonicalNumbers()`, which reads `.github/data/lean_numbers.json` (the Trust
Tier 1 reproducibility-script output) and falls back to the embedded constant.

The screenshot architecture diagram (founder, 2026-05-31) shows earlier
canonical numbers (626 / 14 / 189 + 44 gates); these are documented at
`AGENT_DOCTRINE_ENFORCEMENT.md` and refresh as the corpus evolves. (The
`lutar-lean` v18.0.0 tag's "zero sorry, zero axioms" claim is not used — the
kernel cites the live `main` numbers, per the Real-Realness Auditor's
REALNESS_LEDGER.md.)

### Platform-level totals

The canonical diagram cites the platform as **76 packages · 1220 tests · BSL
1.1**. These are the diagram's figures; the live monorepo count drifts as it
grows (a local `main` clone read ~128 packages with a `package.json` and ~205
colocated `*.test.ts` files at audit time — the platform-wide 1220-test total
was not re-run here, it is out of this package's scope). This package itself
ships **23 test files / 91 tests** (all passing — see ARCH_ALIGNMENT_REPORT.md).

### Boot performance (measured, not claimed)

The canonical Λ-axis paragraph bounds the **per-request Λ overhead** at 0.59 ms
median in the ouroboros bench harness. That is a per-request figure, not the
full kernel boot. The actual full-kernel `start()` init, measured by
`boot-demo.ts` (`pnpm boot`), is on the order of **~20–26 ms** in this
environment — reported as measured, never faked.

## License

This package is published under **BSL 1.1** (platform inheritance). It composes
Apache 2.0 (Ouroboros Runtime, codex-kernel, Mathlib) and CC-BY 4.0 (Ouroboros
theses) components; every imported component is listed with attribution in
`NOTICE.md`.

## Doctrine v7

No mocks. No `() => true` shells — a module with no real backing exports a
clearly-named function that throws `NotYetError` naming the gap, or delegates to
a real caller-supplied implementation. All formulas are real math. See
`HONEST_GAPS.md` for the documented service dependencies (amaru, bge-m3+pgvector,
UDS transport) and the open formal gaps.

Author: Stephen P. Lutar Jr. &lt;stephenlutar2@gmail.com&gt; (ORCID 0009-0001-0110-4173)
License: BSL-1.1 (platform inheritance) — see NOTICE.md for imported-component attribution
