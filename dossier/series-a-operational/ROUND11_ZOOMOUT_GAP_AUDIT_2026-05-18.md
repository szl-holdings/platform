# Series-A Round 11 — Top-to-Bottom Zoom-Out Gap Audit
**Date:** 2026-05-18  **Mode:** what's NOT yet real & operational, exhaustively

## Workflow status (post Task #5211 merge)
**RUNNING (8/10):** a11oy, agent-gateway, amaru, api, conduit, sentra, vessels-pitch, vessels
**FAILED (2/10):** temporal-worker, temporal-approval-worker — env gap, needs Temporal Frontend on :7233

## Severity legend
- **P0** — blocks Series-A demo (none open at this writing)
- **P1** — visible in the funder walk, should fix this week
- **P2** — visible to ops/eng, post-Series-A acceptable
- **P3** — hygiene / cleanup

---

## 1. The formal-proof gap — Λ_k kernel uniqueness (P1)
**What's missing:** 7 `sorry`s across the Lean 4 proof of the Lutar Invariant.

```
Lutar/Invariant.lean     0 sorrys  ✓  (Λ defined cleanly)
Lutar/Axioms.lean        0 sorrys  ✓
Lutar/Egyptian.lean      0 sorrys  ✓
Lutar/Bound.lean         3 sorrys  ✗  (Λ_le_max, min_le_Λ)
Lutar/Uniqueness.lean    4 sorrys  ✗  (lutar_unique, lutar_is_geomean)
                          ─
                          7 total; kernel_signed_off = false
```

**Why not operational:** the existence proof is there; the *uniqueness* of Λ_k as the canonical witness is not yet machine-checked. The shield endpoint `/api/org-intelligence/lean-status` ships this honestly (`"sorry: 7"`, `"color: red"`) which is the right behavior — but it means we cannot claim "machine-checked uniqueness" in the deck.

**Real path to operational:** Lean 4 specialist, ~1 week — Bound theorems need `Real.inner_le_nnreal_iff` + `Finset.prod_le_pow_card`; Uniqueness needs the classical geometric-mean uniqueness argument under the Egyptian-weights constraint.

---

## 2. The telemetry-wiring gap — Λ-gate refuses by default (P1)
**What's missing:** real OTEL telemetry streams feeding Λ in a11oy and sentra.

Evidence (`packages/szl-sdk/src/default-policy-provider.ts`):
- L26: "the gate refuses unless the caller supplies an `approvalToken`"
- L85: "a fresh SDK install **refuses by default** until concrete witnesses are supplied"
- L98–102: `builtInDefaultProvider()` returns Λ = 0 so every gated call refuses
- L67: each non-allow decision drives Λ to 0

| App | Λ source | Status |
|---|---|---|
| Vessels | operator UI (Severity / Likelihood / VaR) | **REAL** — `risk-scoring.tsx:285` |
| a11oy | `builtInDefaultProvider` → 0 | **REFUSE-BY-DEFAULT** |
| Sentra | `builtInDefaultProvider` → 0 | **REFUSE-BY-DEFAULT** |
| Conduit/Amaru | `/amaru/state` real evaluation chain | **REAL** — 87+ receipts |

**Why this is correct-but-incomplete:** refuse-by-default is the right safety posture, but for the demo the funder sees three of four apps gating with Λ=0 unless the demo-seed populates the axes. The `vsp-otel` repo is the intended source; no consumer in artifacts/* currently subscribes to it.

**Real path to operational:** wire `vsp-otel` HTTP/gRPC stream → axis aggregator → SDK provider, replacing `builtInDefaultProvider` in a11oy + sentra startup. ~2-3 days.

---

## 3. Temporal worker infrastructure (P2)
**What's missing:** Temporal Frontend on `localhost:7233` in dev env.

The two workers (`temporal-worker`, `temporal-approval-worker`) start fine, poll for the Frontend, timeout after 300s. Code is real and tested; deploy gap only.

**Real path:** either (a) run Temporal Cloud and inject the connection string as a secret, or (b) `docker compose` a local Temporal in the env. Production-side this should be one of the platform tasks.

---

## 4. Test-coverage gap — packages without any tests (P2)
**What's missing:** 20+ workspace packages with zero `*.test.*` files.

Top offenders by size:
| Package | src files | tests |
|---|---|---|
| design-system | 106 | 0 |
| demo-seed | 19 | 0 |
| a11oy-runtime | 16 | 0 |
| auth-shared | 14 | 0 |
| db-schema | 10 | 0 |
| db-repository | 9 | 0 |
| agents-tools | 9 | 0 |
| ai-control-plane | 9 | 0 |
| config | 7 | 0 |
| alloy-crew | 6 | 0 |

Conversely, `packages/szl-sdk` and `packages/ouroboros-invariant` **do** have tests — the formula library is covered. The gap is in the operational glue (db, design, auth, runtime).

**Real path:** start with `db-schema` + `auth-shared` (highest blast radius); add `vitest` smoke per package; estimated ~1 sprint to cover the top 10.

---

## 5. Workflow port-detection lies (P3, cosmetic)
Documented in Round 8 — `amaru` and `agent-gateway` workflows historically flickered "failed" because port-detection raced their sidecar boot. Round 8 confirmed they're alive as PID children of api-server. The latest workflow status now shows them **running** — system has caught up.

**Real path:** none needed; resolved.

---

## 6. The 4-app surface — verified operational (NO gap)
- 55/55 deep SPA page-routes returning 200
- 4/4 product surfaces screenshotted live (`screenshots/round8/`)
- All amaru proxy endpoints returning real bytes
- Production rate limiter is real (`code: RATE_LIMITED` with correlation IDs)
- Receipt chain hash-integrity intact across 127 receipts and 11 ticks

---

## 7. Pre-existing backlog (system task queue) — not yet operational
8 PENDING tasks in the project, in priority order:

| Task | Title | Notes |
|---|---|---|
| #5061 | Show who changed each runtime config and when | Audit history exists at GET `/runtime-config/_history`; admin UI not yet rendering it |
| #5070 | Make the gateway always send a correct Content-Length | Old-client truncation risk |
| #5066 | Stop masking prior values of sensitive config so reverts always work | Hardening |
| #5065 | Confirm before reverting a runtime config change | UX safety |
| #5067 | Show a "reverted by X" marker on the runtime config row | Provenance |
| #5062 | Show operators which embedder scored each discovery | Observability |
| #5064 | Recalibrate thesis-fit thresholds for the new semantic embedder | Tuning |
| #5057 | Warn at author-time when schema files change without a generated migration | Dev-loop guardrail |

Plus 9 other open infra tasks (admin access control, error envelope migration, AI trace persistence, etc.) — see project task list.

---

## 8. Doctrine — the 4 things that ARE real and operational right now
1. The 7-chakra Amaru brain produces real, hash-chained receipts on every tick.
2. The Λ formula library (4-9 axes, Egyptian unit-fraction weights) is implemented in TS + Python with exact rationals, gated by a refuse-on-zero Λ-gate enforced in SDK middleware.
3. The 4 product surfaces (a11oy, sentra, vessels, conduit) are wired, navigable, and screenshot-able — 55/55 routes green.
4. The honest gaps ship in the JSON: `kernel_signed_off: false`, `sorry: 7`, `color: red`, `refuse-by-default`. No theater.

## 9. Series-A ranked fix list (if the funder asks "what's next")
1. **Discharge the 7 Lean sorrys** → ships `kernel_signed_off: true` in lean-status (P1, ~1 week)
2. **Wire `vsp-otel` into a11oy & sentra Λ providers** → flips refuse-by-default to operator-actionable (P1, ~3 days)
3. **Deploy Temporal Frontend** → unblocks workflow-driven approvals (P2, infra ticket)
4. **First-pass test coverage** on `db-schema` + `auth-shared` + `design-system` (P2, ~1 sprint)
5. **Drain the runtime-config audit backlog** (#5061 + #5065-5067) → operator confidence (P2-P3, 2-3 days)
