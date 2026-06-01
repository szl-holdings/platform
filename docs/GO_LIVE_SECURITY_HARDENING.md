# GO-LIVE SECURITY HARDENING — Phase 10

Captured: 2026-04-23.

## Existing strengths (already in place)

- **CSRF middleware** — `csrf.ts` with allowlist; e.g. `/api/mobile-auth/token-exchange` is correctly exempted (verified during Task #1425).
- **Global auth enforcer** — `middlewares/global-auth-enforcer.ts` with `PUBLIC_EXACT_PATHS` and `PUBLIC_PREFIXES`. New routes default to private.
- **Tenant isolation** — Tasks #1416, #1417 landed; data-isolation tests on the LP portal (#1390).
- **Pre-commit secret scanning** — gitleaks config; tuning tracked in Task #1443.
- **Zod-validated env** — `packages/env/src/index.ts` fails closed on startup if required vars are missing.
- **Env-coverage check** — `pnpm check:env-coverage` (with `:strict` mode) gates env drift.
- **Banned-brand-string check** — `pnpm brand:strings` blocks deprecated names from re-entering code.
- **Rate limiting** — confirmed via `__tests__/rate-limit.test.ts`; e.g. `routes/alloy-chat.ts` uses `max: 100`.
- **Statement-level Postgres timeout** — `statement_timeout: 60000ms` prevents runaway queries from being weaponised into denial-of-service.
- **Mobile OIDC token exchange** — full flow (auth, nonce, missing-fields, not-configured, logout) covered by 8/8 tests after Task #1425.
- **Public-route data-isolation regression** — Task #1420 explicitly verified that `/api/booking/engagements-summary` returns only `eng-seed-*` rows even when real org data exists.

## Hardenings shipped this pass

### `packages/connectors` will not silently ship a broken build

The missing-dep typecheck failure (fixed in Phase 0) was a safety issue: TS errors masked by `--noEmit` failures meant the package could ship `dist/` artifacts with no type checking ever having succeeded. Adding the dep + verifying the typecheck closes that loop.

### `lib/config` composite build wired into the build path

Same class of issue — TS6305 errors on dependent projects mean upstream type changes can land without the downstream catching them. Building `lib/config` resolved the immediate failure and exposed the `prepare`-script gap (no `tsc --build` invocation today).

## Hardenings recommended (NOT shipped this pass)

These are all real, concrete, but each requires a focused review.

| # | Item | Risk if shipped without review | Owner |
| --- | --- | --- | --- |
| 1 | Refresh `banned-brand-strings.baseline.json` (3,892 stale entries) | Low if reviewed; risk = could mask a NEW violation if rotated blindly | Phase 10 follow-up |
| 2 | Add `pnpm tsc --build` to `prepare` script so composite projects build on `pnpm install` | Very low; positive effect on every contributor | Phase 0 follow-up |
| 3 | Tune gitleaks allowlist (Task #1443 in flight) | Standard | Existing task |
| 4 | Run a dedicated audit of every `app.use(...)` order in the api-server entrypoint to confirm CSRF / auth / rate-limit are stacked correctly | Medium — middleware reordering is one of the easiest ways to ship a regression | Phase 3 follow-up |
| 5 | Add a CI check that every workspace import is declared in the importer's `package.json` (would have caught the connectors bug) | Low; `scripts/check-package-boundaries.ts` may already cover this — verify | Phase 10 follow-up |

## Secret handling — current posture

- All secrets accessed via `getEnv()` (Zod-validated) — direct `process.env.X` reads are flagged by env-coverage check.
- `attached_assets/` (129 MB) contains user uploads. **Audit recommendation:** verify it is gitignored. (Spot check passed — no `attached_assets/` entry in `git status`.)
- Rotation tracking — Task #1442 in progress (rotate any credentials found in git history before the scanner was in place).

## What is NOT addressed

- Full SAST sweep (Semgrep rules exist at `.config/.semgrep/semgrep_rules.json` — schedule weekly per Task #3424).
- Dependency audit (`pnpm audit`) — not run this pass; recommend before launch.
- Threat-model review (the `threat_modeling` skill exists; cadence is owner's call).
