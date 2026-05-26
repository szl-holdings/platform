<<<<<<< HEAD
- [Replit GitHub OAuth token lacks workflow scope, but env has one](github-token-workflow-scope.md) — integration token can't touch .github/workflows/*.yml; use the `GH_WORKFLOW_TOKEN` env var (already set in this project) for those merges.
- [Mathlib builds don't fit in a session](lean-mathlib-build-cost.md) — `require mathlib` pulls hundreds of MB and a multi-hour compile; treat lean as one-shot CI, not a live workflow.
- [packages/lean-formulas builds pure-Lean-4](lean-formulas-pure-core.md) — mathlib dropped on purpose; `scripts/check-lean-build.sh` is the green validation; restoring mathlib is a two-edit revert documented in the package README.
- [Partial git clones leave phantom staged deletes](git-partial-clone-staged-deletes.md) — `--filter=blob:none` + LFS smudge failure makes `git add` of two files commit thousands of deletions; sanity-check `git status -s` is empty on a fresh clone before any commit.
- [GitHub org 2FA enforcement silently no-ops via API](github-org-2fa-api-noop.md) — PATCH /orgs returns 200 but the field stays false on free orgs; re-read to verify, surface as manual web-UI step.
- [Replit workflow port prober](replit-workflow-port-prober.md) — port prober dials the external container iface, not loopback; bind `::` / `0.0.0.0` or the workflow flips to FAILED even when the service is up.
- [api-server loopback sidecars](api-server-loopback-sidecars.md) — sidecar POSTs traverse three independent auth gates (CSRF exempt + globalAuthEnforcer loopback bypass + route-level shared secret); fix all three or failures cascade across restarts.
- [KS-18 contextuality witness](ks18-contextuality-witness.md) — the impossibility is parity (each vector in exactly 2 contexts ⇒ Σ contexts = 2·Σv ⇒ 9 = 2·Σv ⇒ Σv = 4.5 ∉ ℤ), NOT physical orthogonality.
- [A11oy.UDS release flow](a11oy-uds-release-flow.md) — build via artifacts/a11oy-uds/scripts/build.sh, sign with COSIGN_KEY=.local/cosign/cosign.key COSIGN_PASSWORD="", smoke-test from PUBLIC URL not local file.
=======
- [A11oy UDS release flow](a11oy-uds-release-flow.md) — cosign signing, sha256, dist/ layout, what v0.1.1 added vs v0.1.0.
- [KS18 contextuality witness](ks18-contextuality-witness.md) — Kochen–Specker 18-vector construction used in @a11oy/core; non-obvious indexing.
- [Replit workflow port-readiness probe](replit-workflow-port-probe.md) — probe hits unknown path; FastAPI services need `/`, `/health`, `/healthz` aliases and must bind `0.0.0.0` for the probe to see them.
- [Artifact toml + workflow config quirks](artifact-toml-and-configure-workflow.md) — never write `.replit-artifact/artifact.toml` directly; `configureWorkflow` counter can become stale after `removeWorkflow` (phantom limit).
- [Doctrine v6 scanner exemptions](doctrine-v6-exemptions.md) — when to add to `EXCLUDE_PATH_PREFIXES` vs `// doctrine-scanner-exempt` marker; "frozen historical receipt" vs "new drift".
- [Multi-artifact preview path routing](multi-artifact-preview-routing.md) — each artifact takes a unique `PORT` from env; hardcoding `server.port` in vite.config collides with the path-routed proxy.
- [Lean toolchain on Replit](lean-toolchain-replit.md) — elan installs to `~/.elan/bin`; symlink `lake`/`lean` into `node_modules/.bin/` so workflows find them on PATH; mathlib full build is 30–60 min from source.
>>>>>>> 23f480b48 (Update platform to version 0.1.1 with improved documentation and builds)
