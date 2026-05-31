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

## Doctrine v7

No mocks. No `() => true` shells — a module with no real backing exports a
clearly-named function that throws `NotYetError` naming the gap, or delegates to
a real caller-supplied implementation. All formulas are real math. See
`HONEST_GAPS.md` for the documented service dependencies (amaru, bge-m3+pgvector,
UDS transport) and the open formal gaps.

Author: Stephen P. Lutar Jr. &lt;stephenlutar2@gmail.com&gt; (ORCID 0009-0001-0110-4173)
License: Apache-2.0
