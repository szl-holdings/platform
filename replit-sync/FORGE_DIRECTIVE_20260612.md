# FORGE DIRECTIVE — 2026-06-12 (CTO → Forge/Replit)

Status: org is steady. **Chaski = ONE-OF-ONE LIVE** (brain wired, hf-router, Qwen2.5-Coder-32B open-weight; all 7 probe checks PASS). Doctrine GREEN on every shipping repo. Mobile/responsive shipped. The items below are the only remaining gaps — each is gated above the CTO agent's access (HF write token, the monorepo toolchain, a founder secret, or an enterprise policy). Two runnable Python scripts are included so you can execute the exact step and report honestly.

Doctrine v11 (unchanged): locked-proven = 8 {F1,F4,F7,F11,F12,F18,F19,F22} @ kernel c7c0ba17 (749/14/163). Λ = Conjecture 1 (advisory, NEVER "proven trust"). Khipu BFT = Conjecture 2. SLSA L1 honest. Never present experimental as locked. **Never remove a bounty `sorry` without a real allowlisted-axiom proof.**

---

## 1) Wake the dark standalone anatomy Space  →  `replit-sync/forge_anatomy_rebuild.py`
- `SZLHOLDINGS/anatomy` is RUNNING but root returns **404** (static-serve glitch; repo has index.html/app.js/data.js/style.css). A **factory rebuild** forces a re-serve.
- The CTO agent's HF connector can't factory-restart; you can (you hold `HF_WRITE_TOKEN`).
- Run: set Actions secret `HF_WRITE_TOKEN`, then `python replit-sync/forge_anatomy_rebuild.py`. (A dispatch workflow `forge-anatomy-rebuild.yml` is provided in the PR description / replit-sync notes — add it under `.github/workflows/` directly on GitHub, since the CTO proxy token lacks `workflow` scope and platform's .gitignore excludes that path.)
- Honesty: do NOT claim it's live until the script's poll sees **200**. The anatomy *consolidation* is already live at `https://a-11-oy.com/anatomy` (200) regardless — this is just the redundant standalone surface.

## 2) Validate + merge the two OpenTelemetry Dependabot PRs  →  `replit-sync/forge_validate_dependabot.py`
- platform **#344** (`@opentelemetry/sdk-node` 0.208→0.217) and **#345** (`auto-instrumentations-node` 0.69→0.75). Touch only `lib/observability/package.json` + `pnpm-lock.yaml`. Both currently **BEHIND** main.
- Required checks (DCO/lockfile/Scorecard) are green, but the heavy Typecheck/E2E gates are RED **on main already** (pre-existing) so they can't validate the bump. The CTO agent declined to force-merge unvalidated deps into the flagship — correct call.
- You have the pnpm monorepo toolchain. In a fresh `gh repo clone szl-holdings/platform` checkout, with `GH_TOKEN` set:
  - `python replit-sync/forge_validate_dependabot.py`  → updates each branch onto main, installs, and **scoped-typechecks only the observability packages** the bump affects, printing PASS/FAIL.
  - `python replit-sync/forge_validate_dependabot.py --merge`  → squash-merges only the PRs whose scoped typecheck PASSED and whose required checks are green.

## 3) szl-doctrine `secret-health` is RED by design — FOUNDER action
- It's the standing "are required org secrets present" probe; it **fails loudly** until org secret **`SECRET_HEALTH_TOKEN`** exists (fine-grained PAT/App token: `Secrets: read` + `Metadata: read` + `Administration: read` on szl-holdings repos). This is a founder one-time action — do not silence the probe.

## 4) ENTERPRISE policy — release-please / bot auto-PRs
- "Allow GitHub Actions to create or approve pull requests" is **disabled enterprise-wide** (`gh api …/permissions/workflow` → `409: disabled by the enterprise`). Because of this:
  - release-please can't open its release PR → the CTO agent **gated `release-please.yml` to `workflow_dispatch` only** on uds-mesh + ouroboros (so it stops failing every push). Config that registers custom commit types (doctrine:/bundle:/compliance:) is in place.
  - To restore automated releases, an **enterprise owner** must enable Actions PR creation (Enterprise → Policies → Actions), OR provision a dedicated GitHub App / PAT for release-please and the number-refresh bot.

## 5) DOCTRINE WATCH — lutar-lean main has outgrown the lock (founder decision)
- `lutar-lean@main` now measures **~2087 declarations / 30 axioms** at a later SHA, vs the LOCKED baseline **749/14/163 @ c7c0ba17** that every surface asserts. The `.github` Lean Numbers job was auto-drifting toward main; the CTO agent pinned it to **verify-only against the locked commit** so the lock can't silently change. **Advancing the lock is a deliberate founder doctrine decision** — when you decide to, bump `lean_numbers.json` + the doctrine banners together, in one reviewed change, and re-lock at the new sha.

---

### Already DONE by the CTO agent this cycle (no action needed)
- Chaski brain live + verticals consolidation bare-path index (a11oy #318); responsive/mobile (a11oy #317, killinchu #112); doctrine green fixes (#316/#111); szl-papers pin-SHA (#6); szl-mesh DCO + locked=8 (7673c6e); killinchu HF-sync re-run; .github Lean-Numbers verify-only (#155/#156); szl-lake sync PR-flow (#6); uds-mesh/ouroboros release-please config + gating (#84/#106/#85/#107); lambda-bounty `lake build` fix (#4, sorry intentionally kept).
- Left for you (kernel, never --admin): lutar-lean #234/#235 (lake-build + merge).

Report back honestly per item. Nothing here should ever claim more than the live endpoint / `lake build` proves.
