# FORGE-REPORT — gitsha-quiet-window-20260614-2105

**Order:** FORGE-INSTRUCTION-gitsha-quiet-window-20260614-2105 (Perplexity/CTO)
**Executed by:** Forge <forge@szlholdings.ai>
**Co-Authored-By:** Perplexity Computer Agent <agent@perplexity.ai>
**Completed:** 2026-06-15 ~02:35Z
**Doctrine:** v11 PROVE-OR-DOWNGRADE — every DONE carries a pushed SHA or a live HTTP-200 proof.

## TL;DR
Real deployed `git_sha` is now wired end-to-end (GitHub main → box `--build-arg` → container `ENV` → live `/version`) for **a11oy** and **killinchu**. Both public endpoints report their exact main HEAD, so a stale box/HF deploy is self-detecting (git_sha mismatch vs GitHub main). The a11oy HF Space var self-heals on every main merge. Demo-freeze CI aligned to canonical FREEZE.json (06:00Z / 03:59Z). UDS recut is founder-gated (cosign FA-001) — exact recut + sign steps below.

## IMPORTANT CORRECTION (endpoint)
The order names `/api/.../v1/honest`. The real provenance / self-detect surface is **`/api/.../v1/version`** (the "Founder Inspection Surface", Co-Authored-By Perplexity). `/honest` is the doctrine-disclosure endpoint and never carried git_sha. `git_sha`/`hf_space_sha`/`build_time` live in `/version` on BOTH organs (a11oy `serve.py` L4472-4493 `a11oy_version()`; killinchu L3112-3132 `killinchu_version()`). All proofs below are against `/version`.

## Task status

### T1 — a11oy serve.py + Dockerfile + hf-git-sha-sync.yml — DONE
- PR #421 squash-merged (GitHub-signed via SZL_GITHUB_TOKEN), all CI green.
- serve.py `/version` provenance defaults now `"unknown"` (was stale hardcoded); Dockerfile gained `ARG`/`ENV` for `SZL_GIT_SHA`, `SZL_HF_SHA`, `SZL_BUILD_TIME`.
- Additive `hf-git-sha-sync.yml` sets the HF Space `SZL_GIT_SHA` var on every main push (does NOT touch the fragile `hf-sync.yml`).

### T2 — killinchu serve.py + Dockerfile — DONE
- PR #124 squash-merged, all CI green.
- killinchu main HEAD: `ab82fb768dd5da63f2eab734cff9f83f7e75ffc6`.

### T3 — box rebuild + PROVE — DONE (PROVEN)
Box scripts `/usr/local/sbin/{a11oy,killinchu}-rebuild` patched with `--build-arg SZL_GIT_SHA=$(git rev-parse HEAD)` + `--build-arg SZL_BUILD_TIME=$(date -u …)`. Both organs rebuilt from fetched `origin/main` and container-recreated.

**PROOFS (live, public, 2026-06-15 ~02:31Z):**
- `GET https://a11oy.net/api/a11oy/v1/version` → `git_sha = ee76af80f991c6d90f04cff37f5cb847c83c6d6d` == a11oy main HEAD ✓ (build_time 2026-06-15T02:25:37Z)
- `GET https://killinchu.a11oy.net/api/killinchu/v1/version` → `git_sha = ab82fb768dd5da63f2eab734cff9f83f7e75ffc6` == killinchu main HEAD ✓ (build_time 2026-06-15T02:16:40Z)
- Box container env confirmed: a11oy `SZL_GIT_SHA=ee76af80…`, killinchu `SZL_GIT_SHA=ab82fb76…`.

**INFRA FIX (required, durable):** the a11oy Dockerfile uses `RUN --mount=type=bind,from=llama-build` which REQUIRES BuildKit. The box had NO `docker-buildx` plugin (only `docker-trust`), and docker 29.x routes BuildKit through buildx (the legacy `DOCKER_BUILDKIT=1` integrated path is gone) → a non-interactive (`setsid`) rebuild failed RC=4 ("--mount requires BuildKit"). Fix:
1. Installed official `docker-buildx` v0.34.1 → `/usr/libexec/docker/cli-plugins/docker-buildx` (default builder now BuildKit v0.26.2, linux/amd64).
2. Hardened `/usr/local/sbin/a11oy-rebuild` with `export DOCKER_BUILDKIT=1` so future non-interactive rebuilds don't regress.
(killinchu Dockerfile has 0 `--mount` lines → classic builder is fine; left unchanged.)

### T4 — HF Space a11oy + PROVE — DONE (PROVEN)
- `GET https://szlholdings-a11oy.hf.space/api/a11oy/v1/version` → `git_sha = ee76af80f991c6d90f04cff37f5cb847c83c6d6d` == a11oy main HEAD ✓ (hf_space_sha d9eedb5f…, build_time unknown — expected on HF).
- `hf-git-sha-sync.yml` ran on push for both `8f71b7ed` (02:00:46Z) and `ee76af80` (02:09:36Z), both success → the var **self-healed** 8f71b7ed → ee76af80 with no manual intervention. Mechanism proven for future merges.

### T5 — a11oy demo-freeze align — DONE
- PR #422 squash-merged → a11oy main HEAD `ee76af80f991c6d90f04cff37f5cb847c83c6d6d`.
- `demo-freeze.yml`: FREEZE_START_TS `05:00:00Z` → **`06:00:00Z`** (= 02:00 ET, canonical FREEZE.json); FREEZE_END_TS `2026-06-20T23:59:59Z` → **`2026-06-20T03:59:00Z`**; `demo-freeze-hotfix-validate.yml` comment aligned.
- **killinchu has NO freeze workflow** (40 workflows inspected; no demo-freeze/freeze/hotfix) → the addendum's "killinchu equivalent" is a NO-OP; nothing to change.

### T6 — UDS recut (UNSIGNED prep) — RECOMMENDED, FOUNDER-GATED
Honest status: BLOCKED on founder cosign (FA-001 key) + UDS/zarf CLI not available in this environment. No speculative edits were pushed to `szl-uds-deployment` (40 guard workflows incl. `chart-zarf-digest-match`, `cosign-identity-pin-guard`; an unvalidatable digest bump would risk red guards and collide with an active sibling).

**Current pins (release-tag based):**
- `charts/a11oy/values.yaml`: `ghcr.io/szl-holdings/a11oy`, tag `uds-v0.3.0`, digest `sha256:82ee4c3217b864a9205a21d6cdf11cde977810ef108fc7c9248003308c135272`.
- `charts/killinchu/values.yaml`: `ghcr.io/szl-holdings/killinchu`, tag `uds-v0.2.0`, digest `sha256:b8268a90653edcb069fff5a2614322cd64b7da3729507a2fd53b549be9cc32bd`.

**Recut + sign sequence (founder):**
1. Cut a new signed release image from current main (builds + pushes GHCR + cosign keyless OIDC):
   - `gh workflow run release.yml -R szl-holdings/a11oy --ref main` (or `zarf-build-and-sign.yml`) → new `ghcr.io/szl-holdings/a11oy:uds-v0.3.1`.
   - `gh workflow run release.yml -R szl-holdings/killinchu --ref main` → new `ghcr.io/szl-holdings/killinchu:uds-v0.2.1`.
2. Capture the new **linux/amd64 CHILD** digest (NOT the OCI index): `crane digest ghcr.io/szl-holdings/a11oy:uds-v0.3.1 --platform linux/amd64`. (Needs `read:packages`; the automation token currently lacks this scope → use a founder/CI token.)
3. Bump digests in LOCKSTEP (the `chart-zarf-digest-match` guard enforces byte-match): `charts/<organ>/values.yaml` digest, `packages/<organ>/zarf*.yaml` `images:`, `bundles/<organ>/uds-bundle.yaml` refs — both organs.
4. `uds create bundles/a11oy` / `uds create bundles/killinchu` → bundle artifact + checksums.
5. **Founder cosign sign (FA-001):**
   - `cosign sign --key <FA-001> ghcr.io/szl-holdings/a11oy-bundle:<new-tag>`
   - `cosign sign --key <FA-001> ghcr.io/szl-holdings/killinchu-bundle:<new-tag>`
6. Re-verify + redeploy: `cosign verify --certificate-identity-regexp=szl-holdings …` then `uds deploy oci://… --confirm`.

**Note:** the box (a11oy.net / killinchu.a11oy.net) runs the LOCAL k3d image path, NOT the UDS GHCR bundle — so the T3/T4 git_sha proofs above are already live regardless of the UDS recut. The recut only affects the Defense-Unicorns Warhacker k8s demo bundle.

## Honest observations / recommended follow-ups (not done; out of explicit scope)
- **killinchu HF Space reports `git_sha=unknown`** (`https://szlholdings-killinchu.hf.space/api/killinchu/v1/version` → all provenance "unknown"). killinchu has no `hf-git-sha-sync.yml` (only a11oy got one in T1). Recommend mirroring the a11oy `hf-git-sha-sync.yml` to killinchu so its HF Space also self-detects.
- a11oy box `/version` reports `hf_space_sha=d9eedb5f…` (the live HF Space commit); killinchu's box does not surface an HF sha.

## Provenance
No key was committed. No gate was weakened. No red was faked. Sibling work was not raced.
Forge <forge@szlholdings.ai> · Co-Authored-By Perplexity Computer Agent <agent@perplexity.ai>
