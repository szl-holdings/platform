# UDS Deploy Stall — Gap Fix Report

**Author:** stephenlutar2-hash &lt;stephenlutar2@gmail.com&gt;
**Date:** 2026-06-07
**Scope:** `szl-holdings/szl-uds-deployment` + `szl-holdings/warhacker-demo` only.
No changes to `uds-bundles` (none required — all three gaps live in
`szl-uds-deployment`). No edits to the live HF app Spaces (a11oy/killinchu).
**Author/committer:** `stephenlutar2-hash <stephenlutar2@gmail.com>`;
every commit ends `Signed-off-by: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>`.

## TL;DR — all three gaps fixed; two are demoable TODAY with zero founder steps

| Gap | State | Founder step needed? |
| --- | --- | --- |
| 1. receipts-server image not published | **DONE — image published + verified on GHCR** | No |
| 2. cosign key 'staged' | **DONE — pubkey committed, image keyless-signed today; key-pair path = 1 founder step** | Optional (keyless works now) |
| 3. start-script wiring (Pepr + flavor) | **DONE — patched, traced clean end-to-end** | No (build needs Docker + a cluster at run time) |
| Core demo (signed-receipt-chain + tamper proof) | **DONE — runs locally, no cluster, real output below** | No |

### Merged commits
- `szl-uds-deployment` PR **#53** → squash-merged to `main` as **`f5bcaab`**
  (branch protection required PR + review + unsatisfiable-on-PR checks; admin
  squash-merge used, admin authorized, `enforce_admins=false`).
- `warhacker-demo` PR **#2** → squash-merged to `main` as **`3adafdd`**.

---

## Gap 1 — `szl-receipts-server` container image NOW PUBLISHED (verified)

**Repo/paths:**
- `szl-uds-deployment/.github/workflows/receipts-server-image.yml` (NEW workflow)
- `szl-uds-deployment/services/szl-receipts-server/{Dockerfile,server.py,requirements.txt}` (verified sound; unchanged — they were already correct)

### (a) Dockerfile + server.py soundness — VERIFIED
The build is sound; no repair needed. Confirmed by static + runtime checks:
- **Self-contained build context:** `services/szl-receipts-server/` contains
  Dockerfile + `server.py` + `requirements.txt`; `COPY` targets all resolve.
- **Deps resolve:** `pip install --no-cache-dir -r requirements.txt` in a clean
  venv resolved to `cryptography==48.0.0`, `opentelemetry-sdk==1.42.1`,
  `opentelemetry-exporter-otlp-proto-grpc==1.42.1` (exit 0).
- **Server boots + endpoints work:** booted `server.py`, `GET /healthz` → `{"status":"ok"}`,
  `GET /metrics` returns Prometheus counters. With an Ed25519 key it logs
  `signed=True`; without one it degrades honestly to `signed=False`
  (`UNSIGNED-NO-ED25519-KEY`, never a forged signature).
- **Healthcheck endpoint present:** Dockerfile `HEALTHCHECK` hits `/healthz`;
  `server.py` serves `/healthz` (alias of `/health`). ✅
- **Non-root:** `USER 65532:65532`; matches `charts/szl-receipts` deployment
  `runAsUser/runAsGroup/fsGroup: 65532`. ✅
- **Correct port:** `EXPOSE 8080`, `ENV SZL_PORT=8080`; chart `server.port: 8080`
  and all NetworkPolicy/UDS Package ports are 8080. ✅

### (b) GHCR build+push workflow — NEW, standard GITHUB_TOKEN push
`receipts-server-image.yml`:
- Triggers: `workflow_dispatch` (input `version`, default `uds-v0.3.1`) **or** a
  `receipts-server-v*` tag push.
- Permissions: `packages: write` (+ `id-token: write` for keyless cosign).
- Logs in to GHCR with the built-in `GITHUB_TOKEN` (NO founder secret needed),
  builds from `services/szl-receipts-server`, pushes
  `ghcr.io/szl-holdings/szl-receipts-server:<version>` with provenance + SBOM,
  then **signs** the image (cosign key-pair if `COSIGN_PRIVATE_KEY` secret is
  present, otherwise **keyless OIDC** — see Gap 2).

### (c) Image actually published — VERIFIED ON GHCR (not fabricated)
Triggered the workflow (`gh workflow run receipts-server-image.yml -f version=uds-v0.3.1`).
Run `27077763042` succeeded (46s). Independently re-probed GHCR:

```
GET https://ghcr.io/v2/szl-holdings/szl-receipts-server/manifests/uds-v0.3.1
  -> HTTP/2 200
  content-type: application/vnd.oci.image.index.v1+json
  docker-content-digest: sha256:3a5aedc1a2cbb99b12b357026e175e2e85e09fb764040c853bd16a084ef74fda
```

- **Published digest (VERIFIED on GHCR, anonymous pull token):**
  `sha256:3a5aedc1a2cbb99b12b357026e175e2e85e09fb764040c853bd16a084ef74fda`
- Anonymous pull token worked ⇒ the package is **public** ⇒ `uds deploy` will no
  longer stall pulling it.
- **Keyless cosign signature verifies** (anchored in Rekor, logIndex `1741204682`):
  `cosign verify ghcr.io/szl-holdings/szl-receipts-server@sha256:3a5aedc1… --certificate-identity-regexp=https://github.com/szl-holdings/szl-uds-deployment --certificate-oidc-issuer=https://token.actions.githubusercontent.com` → `Verified OK`.

> This matches the tag the charts already pull (`charts/szl-receipts/values.yaml`
> → `ghcr.io/szl-holdings/szl-receipts-server:uds-v0.3.1`). No digest was
> fabricated — the value above was read back off GHCR after the push.

**Done-now:** image is published, public, signed, verified. Re-publish anytime
with `gh workflow run receipts-server-image.yml -f version=<tag>`.

---

## Gap 2 — cosign signing key: honest wiring (public committed, private = secret)

**Repo/paths:**
- `szl-uds-deployment/cosign/cosign.pub` (NEW — public key ONLY)
- `szl-uds-deployment/cosign/README.md` (NEW — key handling + founder step)
- `szl-uds-deployment/cosign/.gitignore` (NEW — blocks `*.key`/`*.pem`)
- Wiring in `receipts-server-image.yml` (the optional key-pair sign step)

### What was done
- Generated a **proper** cosign key-pair with `cosign generate-key-pair`
  (ECDSA P-256 — the same scheme the live `szlholdings-cosign` signer uses).
  Self-tested: `cosign sign-blob` + `cosign verify-blob` → `Verified OK`.
- Committed **only** `cosign/cosign.pub`. The private key
  (`-----BEGIN ENCRYPTED SIGSTORE PRIVATE KEY-----`) was **never** committed;
  `cosign/.gitignore` blocks it. Staged-diff scanned — no private material.
- Wired the workflow to use `COSIGN_PRIVATE_KEY` (+ `COSIGN_PASSWORD`) repo
  secrets when present, self-verifying with `cosign verify --key cosign/cosign.pub`.

### Done-now vs founder-step
- **Done-now (no founder step):** image signing already works **keyless via OIDC**
  (verified above), so the image is signed + transparency-logged today. The
  **core demo** signs receipts with the app's in-image **Ed25519** signer (Gap-4
  evidence below) — also no founder step.
- **Founder step (optional, exactly one):** to switch image signing from keyless
  to the committed `cosign.pub` key-pair, the founder runs once:
  ```bash
  export COSIGN_PASSWORD='<strong-password>'
  cosign generate-key-pair
  gh secret set COSIGN_PRIVATE_KEY --repo szl-holdings/szl-uds-deployment < cosign.key
  gh secret set COSIGN_PASSWORD    --repo szl-holdings/szl-uds-deployment --body "$COSIGN_PASSWORD"
  cp cosign.pub cosign/cosign.pub && git commit -am 'chore(cosign): rotate CI signing pubkey'
  ```
  (Full procedure in `cosign/README.md`.) **No private key is ever committed.**

---

## Gap 3 — `start` script wiring gaps (Pepr step + build flavor)

**Repo/path:** `szl-uds-deployment/tasks.yaml` (`start` task) — this IS the
one-command start script (`uds run start`).

### Patches applied
New variables: `FLAVOR` (default `upstream`), `RECEIPTS_IMAGE`,
`RECEIPTS_IMAGE_TAG`, `BUILD_RECEIPTS_LOCAL` (default `true`), `WITH_PEPR`
(default `true`). The `start` task sequence is now:

1. Check required tools
2. **Validate build flavor** — `upstream` is the only flavor with published
   images; `unicorn`/`registry1` (0.5.0-wolfi) **fail fast** with a clear message
   because those images are 404 (per `UDS_PACKAGING_BUILD_REPORT.md` §2). *(flavor gap closed)*
3. Create k3d cluster
4. **Build + load szl-receipts-server image into the cluster (if needed)** —
   `docker build services/szl-receipts-server` + `k3d image import`, so deploy
   never stalls on a GHCR pull even before the workflow publishes. Set
   `BUILD_RECEIPTS_LOCAL=false` to rely on the (now-published) GHCR image. *(Gap-1 belt-and-suspenders)*
5. Build SZL receipts Zarf package **with `--flavor ${FLAVOR}`**
6. Create UDS bundle
7. Deploy the bundle (UDS Core is layer 2 of the bundle → `uds deploy core` covered)
8. **Build + deploy the `capabilities/szl-governance` Pepr capability** —
   `npm ci && npm run build` (emits the controller image + manifests) →
   `zarf package create capabilities/szl-governance` →
   `zarf package deploy`. Skips cleanly when `WITH_PEPR=false`. *(Pepr step gap closed)*
9. **Verify** — wait for `szl-receipts-server` Available + check the
   `szl-governance` admission webhook is present.
10. Print access info

### Trace / lint
- `tasks.yaml` parses as valid YAML (`yaml.safe_load`).
- Step sequence traced (above) — provision → ensure receipts image → zarf
  create (flavor) → uds create → uds deploy (core+bundle) → Pepr capability →
  verify. No remaining wiring gaps.
- `shellcheck` is not installed in-sandbox; the embedded shell uses simple,
  quoted constructs (`case`, `if`, `kubectl rollout status`) and was reviewed
  by hand.

**Needs a live cluster at run time** (expected, not a gap): steps 3–9 require
`k3d`/`docker`/`uds`/`zarf` and a cluster; step 8 needs Docker for `pepr build`.
These are run-time prerequisites of any UDS deploy, documented in the task header.

---

## Core demo — signed-receipt-chain + tamper-evident proof (RUNS TODAY, no cluster)

**Repo/path:** `warhacker-demo/scripts/core_demo.sh` (NEW).

Runs the **real** `szl-receipts-server` in-image Ed25519 signer locally (no
cluster, no GPU, no GHCR pull, no founder secret), emits a signed receipt chain,
verifies it with a standalone verifier, then tampers one receipt and shows the
break. Executed in-sandbox from the merged `main` — **real output**:

```
==> 1/5  Generate Ed25519 signing key (in-image signer; no founder secret)
  OK   Ed25519 private key generated at $KEY
==> 2/5  Boot szl-receipts-server (port 8137)
  OK   server healthy (signed=True)
==> 3/5  Emit a signed receipt chain (4 governance events)
  OK   4 receipts emitted; chain saved to $WORK/chain.json
==> 4/5  Verify chain: Ed25519 signatures + SHA-256 prev_hash links
  signatures verified : 4/4
  chain links verified: 4/4 (head=db8c7d5c7ce5cdb3...)
  CHAIN VALID: every receipt is Ed25519-signed and correctly linked.
  OK   chain verified — real signed-receipt-chain
==> 5/5  Tamper test: flip a byte in receipt #2 and re-verify
  adversary changed receipt #1 payload:
    before: {"action": "deploy", "verdict": "admit", "workload": "killinchu"}
    after : {"action": "deploy", "verdict": "deny", "workload": "killinchu"}
  DETECTED: Ed25519 signature on receipt #1 FAILS (InvalidSignature).
  recomputed hash of #1: 64354232dd7aff3c...
  stored   hash of #1  : 4bc8c0ac300119d8...
  DETECTED: receipt #1 hash changed -> downstream prev_hash links are now broken.
    receipt #2 expects prev_hash=4bc8c0ac300119d8..., but #1 now hashes to 64354232dd7aff3c... -> MISMATCH
  TAMPER-EVIDENT: both the signature and the hash chain detect the edit.
  OK   tamper test passed — the edit broke the signature AND the chain
========================================================
 CORE DEMO PASSED
  Real Ed25519 signed-receipt-chain + tamper-evident proof.
  Ran locally with the in-image signer — no cluster, no founder secret.
========================================================
```

### Existing cosign-signed bundle fixtures — also VERIFIED
The pre-existing `warhacker-demo/fixtures/` bundle verifies cleanly with cosign
v2.4.3 (the `szlholdings-cosign` ECDSA-P256 key, fingerprint
`a4d73120…`):
- `sha256sum -c bundle.tar.zst.sha256` → `bundle.tar.zst: OK`
- `cosign verify-blob --key cosign.pub --insecure-ignore-tlog=true --signature bundle.tar.zst.sig bundle.tar.zst` → `Verified OK`
- `cosign verify-blob --key cosign.pub --insecure-ignore-tlog=true --bundle bundle.tar.zst.rekor.bundle bundle.tar.zst.sha256` → `Verified OK`

> The full warhacker demo launchers (`scripts/demo_run.sh`,
> `scripts/bootstrap_verify.sh`) require the live Hetzner/RTX-4060-Ti tower
> (NVIDIA driver, GPU passthrough, k3d+uds). They are correct and unchanged;
> they need the live tower to run end-to-end. `core_demo.sh` is the cluster-free
> heart-of-pitch proof that runs anywhere `python3 + cryptography + openssl`
> exist.

---

## Honest status matrix: done-now vs needs-founder-step vs needs-live-cluster

| Item | Status |
| --- | --- |
| receipts-server image published to GHCR (digest `sha256:3a5aedc1…`) | **DONE-NOW (verified on GHCR)** |
| receipts-server image keyless-signed (Rekor logIndex 1741204682) | **DONE-NOW (verified)** |
| Dockerfile/server.py soundness (deps resolve, boots, healthz, non-root, port) | **DONE-NOW (verified)** |
| `cosign.pub` committed; private key kept out of repo | **DONE-NOW** |
| Image key-pair signing via `COSIGN_PRIVATE_KEY` secret | **NEEDS-FOUNDER-STEP (one command; keyless works meanwhile)** |
| `start` task FLAVOR selection + Pepr step + verify wired | **DONE-NOW (patched, traced)** |
| Core demo: signed-receipt-chain + tamper proof | **DONE-NOW (ran, output above)** |
| cosign bundle fixtures verify | **DONE-NOW (Verified OK)** |
| `uds run start` full deploy end-to-end | **NEEDS-LIVE-CLUSTER (k3d/uds/zarf/docker at run time; pepr build needs Docker)** |
| unicorn/registry1 (0.5.0-wolfi) flavor | **NEEDS-FOUNDER-STEP (images 404; start fails fast until published)** |
| Full warhacker tower demo (`demo_run.sh`) | **NEEDS-LIVE-CLUSTER (Hetzner/RTX-4060-Ti, GPU passthrough)** |

No bandaids, no fabricated digests, no fabricated keys. The one digest reported
(`sha256:3a5aedc1a2cbb99b12b357026e175e2e85e09fb764040c853bd16a084ef74fda`) was
read back from GHCR after a real push and its signature verified against the
GitHub OIDC issuer in the public Rekor log.

---

## Branch-protection note
Both repos protect `main` (PR + 1 review required; `enforce_admins=false`).
On `szl-uds-deployment` the required status checks (`DCO`,
`Scorecard analysis workflow`) **cannot report on a PR branch** — Scorecard only
runs on `main`/schedule and DCO did not post a status — so they would block
indefinitely. Per the task's authorization, both PRs were **admin squash-merged**
(`gh pr merge --squash --admin`). Author email is `stephenlutar2@gmail.com` and
the `Signed-off-by: Stephen P. Lutar Jr.` trailer is present on each squash
commit (committer shows as GitHub for squash merges, which is standard).

## Sources / references
- GHCR push from Actions — https://docs.github.com/en/actions/use-cases-and-examples/publishing-packages/publishing-docker-images
- cosign (Apache-2.0) — https://github.com/sigstore/cosign
- DSSE PAE — https://github.com/secure-systems-lab/dsse/blob/master/protocol.md
- UDS-CLI tasks — https://github.com/defenseunicorns/uds-cli/blob/main/docs/tasks.md
- Zarf flavors / build-your-bundle — https://github.com/defenseunicorns/uds-core
- Pepr (Apache-2.0) — https://github.com/defenseunicorns/pepr
- Prior squad report — `team/UDS_PACKAGING_BUILD_REPORT.md`
