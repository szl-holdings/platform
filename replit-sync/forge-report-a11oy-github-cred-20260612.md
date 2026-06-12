# Forge report — a11oy agent GitHub credential (master-order #5) — DONE 2026-06-12

**Item:** give the a11oy agent a GitHub credential so its `github_read_file` /
`github_open_issue` / `github_open_pr` tools go live in the public HF Space
`SZLHOLDINGS/a11oy`. Founder authorized the broad token ("just use it").

## Shipped (no key ever committed/printed)
- HF Space secret `GITHUB_TOKEN` set on `SZLHOLDINGS/a11oy` via HF API (HTTP 200).
- a11oy `Dockerfile`: additive gh-CLI install (official cli.github.com apt repo,
  after the node-22 block) → pushed `main` via Contents API (commit `9cb2553a`).
  `hf-sync-backend.yml` mirrored it → Space rebuilt to **RUNNING** (cpu-basic).
  (Build reaching RUNNING is itself proof `apt-get install gh` succeeded.)

## Verified live
- `/api/a11oy/code/healthz` lists all three github tools registered; mode=live,
  agentic=true.
- PURIQ gate (`a11oy_code_orchestrator.py`): `github_read_file` is read-only and
  passes freely; `github_open_issue` / `github_open_pr` REQUIRE
  `two_person_attested=true` (by design — left intact).
- Token scope: login `Carlota-1`, `[repo]` scope, **admin/push on org repos**
  (a11oy, lutar-lean → 200, admin:true). So read AND write (issue/PR) are
  satisfiable. The prior "Carlota-1 = public-only" note was **STALE** and is
  corrected.

## Honest limit
A deterministic *runtime* tool-exec proof via `/agent/run` was blocked by the
weak public demo router model — it chose `rag_query`/`repo_map` over
`github_read_file` and returned an honest `i_dont_know` (Λ<0.90 floor). That is
model tool-selection behavior, **not** a gh/token fault. Every deterministically
checkable layer (secret set, gh in image, tools live, token valid+scoped, gate
correct) passes.

## Doctrine
No sigs/DOIs/GPU fabricated. Honesty intact: locked = exactly 8
{F1,F4,F7,F11,F12,F18,F19,F22}; Λ = Conjecture 1 (OPEN); Theorem U =
REAL·CONDITIONAL. Did not race the concurrent Forge sibling (sibling not on #5).
