# Forge → Perplexity — R-ENGINE-V2 merge-readiness audit (2026-06-13)

Replit-side Forge agent. Read-only audit of order `7155e0f7` (R-ENGINE-V2). **No PR merged, no PR branch
touched, no key handled.** Box auto-loop last processed `c9168b42` (dispatch_mode:none) so the reasoning
audit below is the value-add the timer can't produce. Doctrine v11 held: keystone never agent-merged.

## Live honest state (verified now)
- `a-11-oy.com/healthz` = 200, `status:ok`, `commit:c7c0ba17` (locked-8 reference). No overclaim live.
- `/api/a11oy/v1/energy/budget` and `/api/a11oy/v1/engine/status` → **404 "not found"** — correct: the
  energy endpoints ship in #328/#335, which are unmerged. Engine is BUILT in source, DEPLOYED nowhere.

## Demo-slice spine (#239 + #356 + #369 + #357 + #328 + #329) — readiness
| PR | repo | state | blocker |
|----|------|-------|---------|
| #239 | lutar-lean | open, base main | **FOUNDER-GATED keystone.** Only red check = `Lint PR title (Conventional Commits)` → lowercase the title (founder convention) and it's the sole gate. Kernel/proof checks green (16 success). |
| #240 | lutar-lean | behind main | rebase onto #239 then merge (founder) |
| #241 | lutar-lean | blocked | 1 check in_progress; founder-gated |
| #356 | platform | base main | **RED:** `Typecheck`, `E2E Gate`, `e2e-app(counsel)`, `Lighthouse/{a11oy,counsel,vessels,terra,carlota-jo,sentra}` |
| #357 | platform | base main | **RED:** `Typecheck`, `Runtime Audit(audit:full)`, `E2E Gate`, `e2e-app(counsel,terra,sentra,carlota-jo,vessels)`, `Lighthouse/{terra,sentra,vessels,carlota-jo}` |
| #369 | platform | base feat/energy-signal-feed | **CLEAN** (success:4) |
| #328 | a11oy | base main | mergeable pending; checks all green (success:27, no failures) |
| #329 | a11oy | base main | green (success:27) |

## Root-cause read of the platform reds (NOT energy-code regressions)
- The green stacked PRs (#362/#363/#364/#367/#361/#366, #369) base on `feat/agentic-gpu-scheduler` and run
  only the light gate set (success:4) — the heavy monorepo gates are path/base-filtered there.
- The reds (#356/#357/#358/#360) base on **main**, so they run the FULL monorepo E2E/Lighthouse matrix across
  unrelated apps (counsel/vessels/terra/carlota-jo/sentra). Energy code under `apps/agentic-gpu/` should not
  break those apps' Lighthouse/E2E → these read as pre-existing/cross-app gate failures, with the real
  signal being **`Typecheck`** (#356/#357/#360) + **`Runtime Audit`** (#357/#358). Fix typecheck first, then
  re-run; the cross-app Lighthouse/E2E likely clears or is unrelated to the slice.

## a11oy alignment reds (G1/G2 territory)
- #331 → `hf-module-drift / Source in sync with the live HF Space`; #334/#335 → `Shared source files in sync
  with killinchu`. These are the drift guards: the PRs add shared `szl_*.py` not yet mirrored to HF/killinchu.
  Resolve at merge time by pushing byte-identical to HF Space + killinchu (founder-approved deploy).

## Recommended shortest path to first MEASURED joule (unchanged from DEPLOY_ORDER_V2, blockers named)
1. [FOUNDER] lowercase #239 title → green → merge keystone.
2. [eng] make platform `Typecheck` green on #356/#357 (real code signal); re-run E2E/Lighthouse, confirm the
   cross-app reds are pre-existing not slice-caused.
3. land `feat/agentic-gpu-scheduler`→main, merge #356→#369→#357 (rebased), then a11oy #328→#329.
4. [FOUNDER] on-box RTX 5000: resident daemon + NVML `nvidia-smi power.draw` → first `joules_label:"measured"`
   receipt → surface on #335/#336. Price already proven LIVE off-box (aWATTar curtailed).

Half-state forbidden; locked=8; Λ=Conjecture 1; effector SIMULATED; no key committed.