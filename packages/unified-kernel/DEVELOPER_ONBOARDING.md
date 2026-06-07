# unified-kernel — Developer Onboarding

> **Doctrine v11 LOCKED** · 749 declarations · 14 axioms · 163 sorries · Λ = Conjecture 1

This document is the entry point for working on `@szl-holdings/unified-kernel`.

---

## 1. What the unified-kernel is

The unified-kernel is the TypeScript package that makes SZL's 19 mathematical
theses executable software. `kernel.start()` runs a 7-step boot sequence, emits
an Ed25519-signed, SHA-256-chained init receipt, and returns a `KernelHandle`
with a live module registry.

**Founder mandate**: "Make the theses BE THE SOFTWARE. One importable package.
One signed artifact. One unified kernel."

---

## 2. Architecture diagram

```
packages/unified-kernel/src/
├── kernel.ts          Boot sequence (7 checks) + receipt emission
├── types.ts           Shared TypeScript types (KernelHandle, Receipt, etc.)
├── branches.ts        Branch aliases: amaru, rosie, sentra, mesh, a11oy
│
├── invariants/        T01 — Λ invariant + 4 axioms (geometric mean, zero-pinning)
│   ├── lambda-audit-closure.ts  THE central Λ Audit-Closure Operator (public API)
│   ├── pac-bayes.ts   PAC-Bayes tail bound
│   ├── bekenstein.ts  Bekenstein capacity cap
│   └── reidemeister.ts Reidemeister knot invariant
├── loop/              T02 — Ouroboros bounded step/termination (wired v6.3.0)
│   └── vendor_ouroboros/  vendored kernel (byte-for-byte upstream, 218 tests)
├── ledger/            T04 — receipt append + SHA-256 chain verify
├── tamper/            T18 — tamper detection (Ed25519 key generation + signing)
├── doctrine/          T11 — banned-token scanner + doctrine invariant enforcer
├── codex/             Codex-kernel v1.0.2 (4 governance contracts)
├── qec/               T10 — Shor-9 QEC encode/corrupt/recover
├── gates/             T05 — KS-18 policy gate evaluation
├── memory/            T07+T08 — memory store
├── khipu/             T09 — Khipu receipt DAG (TypeScript)
├── rag/               T17 — RAG retrieval
├── mesh/              T13+T16 — OTEL span schemas
├── slsa/              T15 — SLSA posture check
├── forecast/          T12 — witnessed forecasting (Mādhava)
├── lean/              T19 — Lean proof stub linkage
└── anatomy/           T14 — anatomy module
```

---

## 3. Running locally

```bash
cd packages/unified-kernel

# Install (from monorepo root)
pnpm install

# Run boot demo (prints every check + signed receipt)
pnpm boot

# Run tests (one test per module + integration)
pnpm test
```

### Quick import

```typescript
import { start, verifyInitReceipt } from "@szl-holdings/unified-kernel";

const kernel = await start();
console.log(kernel.status);                    // "PASS" | "DEGRADED" | "FAIL"
console.log(verifyInitReceipt(kernel.initReceipt)); // true
```

---

## 4. The 7 boot checks

| Step | Check | Module | Thesis |
|---|---|---|---|
| 0 | Banned-token scan (env + cwd) | `doctrine/` | T11 |
| 1 | Λ invariant + 4 axioms | `invariants/` | T01 |
| 2 | Ouroboros bounded step + termination | `loop/` (wired v6.3.0) | T02 |
| 3 | Receipt append + chain verify | `ledger/` + `tamper/` | T04/T18 |
| 4 | Doctrine cross-invariant | `doctrine/` | T11 |
| 5 | Codex: 4 governance contracts | `codex/` | codex-kernel v1.0.2 |
| 6 | QEC encode → corrupt → recover | `qec/` | T10 |

---

## 5. The Λ Audit-Closure Operator

The `Λ_audit_closure` in `invariants/lambda-audit-closure.ts` is the central
operator in the SZL architecture. It sits between:
- Ouroboros (bounded loops) upstream
- Branch operators (amaru, rosie, sentra, mesh, a11oy) downstream

It consumes a `ReceiptBus` (stream of Khipu receipts) and emits:
- `compositeLambda` — the platform-level Λ score
- `perAxiom` — per-axiom contribution
- `pacBayesTailBound` — PAC-Bayes confidence bound
- `bekensteinCapBits` — Bekenstein information capacity cap

**Doctrine note**: `compositeLambda` uniqueness = **Conjecture 1** (not a closed
theorem). The CAUCHY_ND sorry in `Lutar/Uniqueness.lean:120` is still open.

---

## 6. Ouroboros loop wiring (T02)

`loop/` uses the real Ouroboros runtime (vendored from `@szl-holdings/ouroboros`
tag v6.3.0, SHA `d64748cc`). The vendored copy is byte-for-byte upstream; the
218 upstream tests are the proof. Do NOT replace the vendored copy with a stub.

`RUNTIME_CONTRACT_V4_MAX_STEPS = 12` is the canonical max step budget from the
v4 runtime contract. Do not bump this without a doctrine version change.

---

## 7. Doctrine constants (LOCKED)

| Constant | Value |
|---|---|
| Declarations | 749 |
| Axioms | 14 unique |
| Sorries | 163 |
| Kernel commit | `c7c0ba17` |
| Λ uniqueness | Conjecture 1 — NOT proven |

---

## 8. KNOWN_GOTCHAS.md

See `KNOWN_GOTCHAS.md` in this package directory for platform-specific gotchas.

---

*Authored by Perplexity Computer Agent on behalf of Yachay (CTO).*
*Doctrine v11 LOCKED · 749/14/163 · Λ = Conjecture 1.*
*Signed-off-by: stephenlutar2-hash <stephenlutar2@gmail.com>*
