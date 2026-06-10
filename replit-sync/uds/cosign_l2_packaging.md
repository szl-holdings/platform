# COSIGN / SLSA L2 build-attested (container images, verifiable) — PACKAGING & RE-VERIFICATION (2026-06-05)

Author: full-stack supply-chain squad (autonomous run). Honesty contract: an organ/bundle
is marked **L2 PASS only** when `cosign verify-attestation --type slsaprovenance` with
**STRICT identity** (per-image regexp, not wildcard) returns a `slsa.dev/provenance` payload.
All commands below were run with cosign installed locally, anonymous pull against public GHCR.

Strict verify command template:
```
cosign verify-attestation ghcr.io/szl-holdings/<img>:uds-v0.2.0 \
  --type slsaprovenance \
  --certificate-identity-regexp "https://github.com/szl-holdings/<img>/.*" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com"
```

---

## FINAL HONEST L2 SCORECARD — 5 of 6 verify

| Artifact   | L2 before | L2 after | Predicate (after)          | Evidence |
|------------|-----------|----------|----------------------------|----------|
| a11oy      | ✅ PASS   | ✅ PASS  | slsa.dev/provenance/v0.2   | unchanged reference |
| sentra     | ✅ PASS   | ✅ PASS  | slsa.dev/provenance/v0.2   | unchanged reference |
| rosie      | ✅ PASS   | ✅ PASS  | slsa.dev/provenance/v0.2   | unchanged reference |
| amaru      | ❌ FAIL   | ✅ PASS  | slsa.dev/provenance/v0.2   | re-ran existing workflow |
| killinchu  | ❌ FAIL   | ✅ PASS  | slsa.dev/provenance/v0.2   | PR #55 merged + main run |
| szl-uds-bundle | ❌ FAIL | ⛔ BLOCKED (GHCR 403 write_package) | n/a | publish denied; see bundle section |

> NOTE on naming: the ground-truth file checked `ghcr.io/szl-holdings/szl-mesh`, which does
> not exist (MANIFEST_UNKNOWN). The actual customer bundle artifact published by this repo
> (`szl-uds-deployment`, workflow `uds-bundle-publish.yml`) is **`szl-uds-bundle`**. All bundle
> work below targets `ghcr.io/szl-holdings/szl-uds-bundle:uds-v0.2.0`.

---

## ROOT-CAUSE DIAGNOSIS (what produced the gap)

### Reference (PASSING) — a11oy / sentra / rosie
`.github/workflows/ghcr-build-push.yml` builds+pushes the image, then runs **two** provenance
mechanisms:
1. `actions/attest-build-provenance@v2.4.0` → lands provenance in the **GitHub Attestations API
   + public Rekor** (verifiable with `gh attestation verify`), but does **NOT** create an OCI
   referrer that `cosign verify-attestation` reads.
2. **`cosign attest --type slsaprovenance --predicate predicate.json <img>@<digest>`** → writes a
   cosign-native SLSA Provenance **v0.2** predicate as an **OCI referrer** on the image digest.
   THIS is the step that makes `cosign verify-attestation --type slsaprovenance` succeed.

The job then self-gates with `cosign verify-attestation` (strict OIDC issuer + szl-holdings
identity). Mechanism #2 is the load-bearing one for the L2 acceptance command.

### amaru — gap was a FAILED BUILD, not a missing step
amaru's `ghcr-build-push.yml` was **already identical** to a11oy (the `cosign attest
--type slsaprovenance` step was present, merged in PR #140, commit 810b99e). The only `main`
push run that included that step (run 26987043514) **failed at the `docker/build-push-action`
step** with `buildx failed with: ERROR: failed to build: unknown blob` — a transient GHCR
build/cache error. The attest steps were never reached, so the published digest carried only a
`.sig` (L1). **Fix = re-run the workflow.** No YAML change needed.

### killinchu — gap was a MISSING cosign-native attest step
killinchu's `ghcr-build-push.yml` had ONLY `actions/attest-build-provenance` + `cosign sign`
(L1). It had **no** `cosign attest --type slsaprovenance` step — the file even carried the
comment "image stays L1 honest." So `cosign verify-attestation` returned "no matching
attestations." **Fix = port the cosign-native attest + verify steps from a11oy.** (PR #55.)

While landing PR #55 I also found **all PRs to killinchu were blocked** by a corrupted action
pin in `.github/workflows/commit-lint.yml`: `amannn/action-semantic-pull-request@0723387...d98f25d3`
was **39 hex chars** (invalid SHA-1), so the required "Lint PR title" check failed with
`unable to find version`. Repinned to the real v5.5.3 commit `0723387faaf9b38adef4775cd42cfd5155ed6017`
(40 chars). This was the sole non-supply-chain merge blocker; it was a genuine pre-existing CI
bug, fixed rather than bypassed.

### szl-uds-bundle — TWO independent problems
1. **Missing attest step (FIXED in PR #51 branch):** `uds-bundle-publish.yml` signed the bundle
   (L1) and attached an `spdxjson` SBOM attestation, but emitted **no** `slsaprovenance`
   attestation. Added a cosign-native SLSA Provenance v0.2 `cosign attest --type slsaprovenance`
   on the published bundle ref + a strict verify gate (mirrors the per-organ step).
2. **Bundle workflow never reaches publish (PRE-EXISTING INFRA FAILURE):** every recent
   `UDS Bundle Publish` run failed. Confirmed root cause via the runner annotation API on test
   run 26989567988: **`System.IO.IOException: No space left on device`** during "Build member
   Zarf packages" (it pulls all 5 member images into the runner local store and exhausts the
   standard github-hosted runner disk). Added a "Free disk space" reclaim step (drops Android
   SDK/.NET/GHC/CodeQL/PowerShell/Swift + docker prune, ~25–30 GB) before the build.

---

## WORKFLOW DIFFS (summary)

**killinchu `.github/workflows/ghcr-build-push.yml`** (+64 lines): after `cosign sign`, added
`cosign attest SLSA provenance (registry, cosign-verifiable)` writing a v0.2 predicate to
`<img>@<digest>`, plus a `cosign verify-attestation` honesty gate. (Byte-for-byte the a11oy step.)

**killinchu `.github/workflows/commit-lint.yml`** (1 line): action SHA pin 39→40 chars.

**szl-uds-deployment `.github/workflows/uds-bundle-publish.yml`** (+83 lines):
- after the SBOM attest: `cosign attest SLSA provenance on bundle` (v0.2 predicate on the
  published bundle ref) + `cosign verify-attestation bundle` strict gate.
- after checkout: `Free disk space` step (unblocks the member-package build).

---

## PR LINKS

- **killinchu**: https://github.com/szl-holdings/killinchu/pull/55 — **MERGED** (2026-06-05 01:19:51Z).
  Post-merge `main` run 26989528706 = success → attestation published.
- **szl-uds-deployment (bundle)**: https://github.com/szl-holdings/szl-uds-deployment/pull/51 —
  **OPEN**, blocked (see below).
- **amaru**: no PR (workflow already correct); re-triggered run 26989439069 = success.

---

## PER-ORGAN BEFORE / AFTER VERIFY OUTPUT

### a11oy — PASS → PASS (unchanged)
`GitHub Workflow Repository: szl-holdings/a11oy`, `Workflow Ref: refs/heads/main`,
predicateType `https://slsa.dev/provenance/v0.2`, subject `ghcr.io/szl-holdings/a11oy`. Real Rekor.

### sentra — PASS → PASS (unchanged)
`Workflow Repository: szl-holdings/sentra`, predicateType `slsa.dev/provenance/v0.2`.

### rosie — PASS → PASS (unchanged)
`Workflow Repository: szl-holdings/rosie`, predicateType `slsa.dev/provenance/v0.2`.

### amaru — FAIL → **PASS**
- Before: `Error: no matching attestations:`
- After (run 26989439069 succeeded): strict verify returns in-toto payload,
  `Workflow Repository: szl-holdings/amaru`, `Workflow Ref: refs/heads/main`,
  predicateType `https://slsa.dev/provenance/v0.2`.

### killinchu — FAIL → **PASS**
- Before: `Error: no matching attestations:`
- After (PR #55 merged, main run 26989528706 succeeded): strict verify returns in-toto payload,
  `Workflow Repository: szl-holdings/killinchu`, `Workflow Ref: refs/heads/main`,
  predicateType `https://slsa.dev/provenance/v0.2`, subject `ghcr.io/szl-holdings/killinchu`.

### szl-uds-bundle — FAIL → **STILL FAIL (infra-blocked)**
- Before: `Error: no matching attestations:`
- After: see bundle status below. Attestation logic is in place on PR #51; the workflow has not
  yet completed a green run, so **no slsaprovenance referrer exists yet** — honestly reported FAIL.

---

## BUNDLE (#51) — STATUS & EXACT OWNER STEPS

### BUNDLE OUTCOME (after 6 test runs on `ci/slsa-l2-bundle-cosign-attest`, 2026-06-05)

**Honest verdict: szl-uds-bundle is still L2 FAIL.** Strict verify returns
`Error: no matching attestations:` — no `slsaprovenance` referrer exists on the bundle.

The workflow logic for L2 is correct and the upstream defects were fixed and confirmed via
captured run logs, but the pipeline **cannot complete a green run** because the publish step is
hard-denied by GHCR. Progress made, in order:

1. **Disk exhaustion → FIXED** (`Free disk space` step). Builds no longer die on "No space left
   on device".
2. **Member Zarf build VERSION/IMAGE_TAG coupling → FIXED** (commit 204caff). Confirmed by run
   26990486199: all 5 organs `zarf package create` returned **rc=0**.
3. **Create UDS bundle → SUCCEEDS.** Run logs show `dist/uds-bundle-szl-uds-bundle-amd64-0.2.0.tar.zst`
   is produced.
4. **Publish bundle → HARD-BLOCKED (owner-only fix).** The in-workflow `GITHUB_TOKEN` is denied
   write to the GHCR package. Exact error, all 3 retry attempts (run 26992245478, step 17):
   ```
   ERROR: failed to publish bundle: failed to perform "Push" on destination:
   POST "https://ghcr.io/v2/szl-holdings/szl-uds-bundle/blobs/uploads/":
   response status code 403: denied: permission_denied: write_package
   ```

**Root cause (precise):** the customer bundle is published from repo `szl-uds-deployment` under
package name `szl-uds-bundle`. Because the package name does **not** match the repo name, GHCR does
**not** auto-link the package to this repo, so this repo's Actions `GITHUB_TOKEN` has no
`write_package` permission on it. Every one of the 15 historical `uds-bundle-publish.yml` runs
(both `main` and this branch) has failed — **this workflow has never published green**. The
`szl-uds-bundle:uds-v0.2.0` / `:latest` tags that currently exist on GHCR (digest
`sha256:0ce18e25…`, carrying only a `.sig`, no `.att`) were pushed by some other means, not by this
workflow's token. The 403 is therefore not transient (the retry loop I added proved it: 3/3
attempts returned the identical 403).

**This is owner-only.** It cannot be fixed in workflow YAML — it is a GHCR package access-control
grant. Two valid fixes (owner chooses):
- **(A) Grant the repo write access to the existing package** *(keeps the customer-facing name
  `szl-uds-bundle`)*: GitHub → org `szl-holdings` → Packages → `szl-uds-bundle` → Package settings →
  *Manage Actions access* → add repository `szl-uds-deployment` with the **Write** role. Then re-run
  the workflow; it will publish, sign, and attest, and `cosign verify-attestation` will pass.
- **(B) Publish under a repo-linked package name** *(no owner package-settings change, but changes
  the artifact name)*: change `BUNDLE_NAME`/publish target so the package is
  `ghcr.io/szl-holdings/szl-uds-deployment` (auto-linked → token has write). This alters the
  customer deploy URL, so it is a product decision, not a CI decision — left to the owner.

What is already landed on the PR branch and verified working up to the 403:
- `Free disk space` reclaim step.
- VERSION/IMAGE_TAG decoupling across the 5 member `zarf.yaml` + the build step.
- 3-attempt publish retry with full rc capture + `::error::` annotations (this is what surfaced the
  403 cleanly despite egress-blocked run logs).
- `cosign attest --type slsaprovenance` (v0.2 predicate) on the bundle ref + a strict
  `cosign verify-attestation` honesty gate — identical in shape to the per-organ step that earns L2
  on all 5 organs. These steps are correct but are never reached because publish fails first.

Once an owner applies fix (A) or (B) and the workflow runs green through publish, re-verify with the
strict command in the runbook below; only then mark the bundle L2 PASS.

### Blockers (an owner must clear these)

**0. PRIMARY / NEWLY CONFIRMED — GHCR `write_package` 403 (blocks the run itself).**
   The `uds-bundle-publish.yml` workflow's `GITHUB_TOKEN` is denied write to the
   `szl-holdings/szl-uds-bundle` GHCR package (full error + 3/3 retry proof in the BUNDLE OUTCOME
   section above). This is why **no bundle run has ever gone green** (15/15 historical runs failed).
   Owner fix — pick one:
   - **(A)** org `szl-holdings` → Packages → `szl-uds-bundle` → Package settings → *Manage Actions
     access* → add repo `szl-uds-deployment` with **Write**. Keeps the customer name. (Recommended.)
   - **(B)** publish under a repo-linked package name (`szl-uds-deployment`) so the token has write
     by default — changes the customer deploy URL, so it is a product decision.
   Merging PR #51 alone will NOT fix this; the grant is independent of the PR.

**1. Required check `check / doctrine` fails** — a **pre-existing false-positive** from
   the org reusable workflow `szl-holdings/.github/.github/workflows/doctrine-check.yml@main`.
   It flags SLSA "L3"-roadmap strings that appear in **disclaimer** text already on `main`
   (`CATALOG_SPONSOR_APPLICATION.md:69` "L3 was incorrectly badged… purged";
   `operator/SECURITY.md:18` "We do not claim SLSA L2 or L3"). My branch touches ONLY
   `.github/workflows/uds-bundle-publish.yml`, so this failure is NOT caused by this PR. An
   unrelated PR (`fix/doctrine-honest-counts`) also fails the same check. Owner action: fix the
   doctrine check's regex to ignore negated/disclaimer context (or whitelist those lines), re-run.

**2. Required 1 approving review** (`REVIEW_REQUIRED`). I am **not authorized to approve PRs**, so
   this must be done by a human reviewer. `commit-lint.yml` in this repo has the **same corrupted
   39-char action pin** as killinchu had; recommend repinning to
   `0723387faaf9b38adef4775cd42cfd5155ed6017` (not yet changed in PR #51).

### To actually earn bundle L2 (owner runbook)
1. **Grant package write access (blocker 0, fix A or B above).** Without this the workflow cannot
   publish and therefore cannot attest — this is the hard gate.
2. Merge PR #51 (after clearing doctrine + review) so `uds-bundle-publish.yml` on `main` carries the
   `Free disk space`, VERSION/IMAGE_TAG decoupling, publish-retry, and
   `cosign attest --type slsaprovenance` steps.
3. Run the bundle workflow against a ref that has the new steps:
   `gh workflow run uds-bundle-publish.yml --repo szl-holdings/szl-uds-deployment -f tag=uds-v0.2.0`
   (or push a `uds-v*` tag). Confirm the run is GREEN through `cosign attest SLSA provenance`.
4. Re-verify:
   ```
   cosign verify-attestation ghcr.io/szl-holdings/szl-uds-bundle:uds-v0.2.0 \
     --type slsaprovenance \
     --certificate-identity-regexp "https://github.com/szl-holdings/szl-uds-deployment/.*" \
     --certificate-oidc-issuer "https://token.actions.githubusercontent.com"
   ```
   Only mark the bundle L2 when this returns a `slsa.dev/provenance` payload.

---

## LANDED vs NEEDS-OWNER

**Landed & verified (no further action):**
- amaru L2 ✅ (workflow re-run on main)
- killinchu L2 ✅ (PR #55 merged; main run published the attestation; commit-lint pin fixed)
- a11oy / sentra / rosie L2 ✅ (already passing; re-confirmed)

**Needs owner:**
- szl-uds-bundle: **(0) grant `szl-uds-deployment` Actions write access to the GHCR `szl-uds-bundle`
  package** (the hard gate — `403 write_package`), (1) clear the pre-existing doctrine
  false-positive, (2) provide the required review. Then run `uds-bundle-publish.yml` from the merged
  ref and re-verify. All workflow logic (build, create, publish-retry, sign, SBOM attest, SLSA
  provenance attest + verify gate) is correct and already on the PR branch; it is verified working
  up to the publish 403.

## HONESTY NOTES
- No wildcard identity was used in any acceptance verification.
- All 5 organs (a11oy, sentra, rosie, amaru, killinchu) re-verified **L2 PASS** on 2026-06-05 with
  strict per-image identity regexp — real `slsa.dev/provenance/v0.2` payloads.
- The bundle is reported **FAIL** because no `slsaprovenance` referrer exists on it: the workflow
  cannot publish (GHCR `403 write_package`), so the attest steps are never reached. The publish
  failure was reproduced 6 times and proven non-transient via a 3-attempt retry (3/3 identical 403).
  No green was faked; the bundle stays FAIL until an owner grants package write.
- No claims of SLSA L3 / FedRAMP / Iron Bank / CMMC are made. This is SLSA L2 build-attested container provenance (verifiable; bundle-level attestation = roadmap).
- `git ls-files` counts were checked before each commit and did not shrink
  (killinchu 604→604, szl-uds-deployment 281→281).
- Bundle test runs (all on `ci/slsa-l2-bundle-cosign-attest`, 2026-06-05): 26989567988, 26989951499,
  26990486199, 26991095102, 26991662564, 26992245478 — each failure root-caused from captured run
  logs / annotations, not assumed.
