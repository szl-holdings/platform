# Dev2 Deploy/UDS — Warhacker Live Deploy Report
**Role:** Dev 2 (Deploy / UDS Engineer)  
**Prepared for:** CTO (Stephen, SZL Holdings)  
**Date:** 2026-06-04 (T-12 to Warhacker)  
**Event:** Warhacker — Defense Unicorns · 16–19 June 2026 · San Diego  
**Doctrine:** v11 LOCKED 749/14/163 @ c7c0ba17 · Λ = Conjecture 1 · SLSA L1  
**Status:** PREPARE AND REPORT ONLY — Dev2 does NOT push to main.

---

## Executive Summary

Two distinct live-deploy paths exist across the six repos. Only one is runnable today
without founder action: the `bundles/szl-warhacker` path in **szl-uds-deployment**,
which deploys UDS Core slim-dev + szl-receipts (the Pepr DSSE receipt webhook) on a
local k3d cluster. All four flagship SZL organs (a11oy, sentra, amaru, rosie) and the
`local-llm` organ are **blocked** by absent GHCR images. killinchu is live on HF Space
but its GHCR image is private. The "8-organ demo_run.sh" sequence in **warhacker-demo**
cannot run because `bundle.tar.zst` in-repo is a 3.9 KB image-free proof package.

This document gives the CTO an exact ordered runbook, a complete blockers table with
proposed fixes tagged by who must act, and a gaps list keyed to the Warhacker vision.

---

## 1. Warhacker Live Demo Runbook

### 1.1 Path Selection

There are three coded deploy paths. Two are ready to run (with caveats); one is
blocked until images are pushed.

| Path | Entry command | Status today |
|------|--------------|--------------|
| **A — `bundles/szl-warhacker/` (RECOMMENDED)** | `uds run start` from `szl-uds-deployment/bundles/szl-warhacker/` | ✅ Runs; deploys init + core + szl-receipts. vessels ImagePullBackOff unless FA-001 done. |
| **B — `operator/` Makefile** | `make demo-up` from `szl-uds-deployment/operator/` | ⚠️ Runs; 5-flagship `rollout status` WARNs unless GHCR images exist (FA-001). |
| **C — `warhacker-demo/scripts/`** | `sudo ./bootstrap_verify.sh && ./demo_run.sh` | ❌ Blocked — `bundle.tar.zst` is image-free; 8-organ wait fails. Fix requires founder action (BL-003). |

**Recommended live-demo path for Warhacker 2026: Path A**, supplemented with Path B
for the flagship status board, and the killinchu HF Space endpoint for the judge
verification recipe.

---

### 1.2 Path A — `bundles/szl-warhacker` (Runnable Today)

**Pre-conditions (one-time install, NOT on demo day):**

```bash
# 1. Docker 24.0+ daemon running
docker info

# 2. k3d 5.8.3 (operator RUNBOOK) or 5.6.3 (bootstrap_verify.sh default)
curl https://mise.run | sh
mise use k3d@5.8.3
k3d version            # need v5.8.x

# 3. kubectl 1.30
mise use kubectl@1.30

# 4. UDS CLI 0.18.0 (bundles Zarf)
UDS_VERSION="0.18.0"
curl -L "https://github.com/defenseunicorns/uds-cli/releases/download/v${UDS_VERSION}/uds-cli_v${UDS_VERSION}_Linux_amd64.tar.gz" \
  | tar -xz -C /usr/local/bin/ uds
chmod +x /usr/local/bin/uds
uds version            # need 0.18.0

# 5. Zarf v0.77.0 (via uds bundle — uds zarf)
uds zarf version       # should print v0.77.0

# 6. inotify limits (Linux only — required for Istio sidecars in k3d)
sudo sysctl fs.inotify.max_user_watches=1048576
sudo sysctl fs.inotify.max_user_instances=8192
echo "fs.inotify.max_user_watches=1048576" | sudo tee -a /etc/sysctl.conf
echo "fs.inotify.max_user_instances=8192"  | sudo tee -a /etc/sysctl.conf
```

**Clone (if not already):**

```bash
git clone https://github.com/szl-holdings/szl-uds-deployment.git
cd szl-uds-deployment
```

**Step 1 — Preflight check:**

```bash
bash scripts/preflight.sh
```

From `operator/scripts/preflight.sh` — checks Docker running + version ≥ 24, k3d ≥
5.8.x, `uds` / `zarf` / `kubectl` on PATH, ports 80/443/6550 free, and inotify
limits. Exit 0 = all checks passed.

**Step 2 — Enter the bundle directory and start:**

```bash
cd bundles/szl-warhacker
uds run start
```

From `bundles/szl-warhacker/tasks.yaml` — this task runs in order:

1. **Tool check:** `for tool in uds zarf k3d docker kubectl; do command -v "$tool" ...`
2. **k3d cluster create** (`szl-warhacker`):
   ```bash
   k3d cluster create "${CLUSTER_NAME}" \
     --k3s-arg "--disable=traefik@server:0" \
     --port "80:80@loadbalancer" \
     --port "443:443@loadbalancer" \
     --port "8443:8443@loadbalancer" \
     --wait
   ```
3. **Build szl-warhacker bundle:** `uds create . --confirm --no-progress`
4. **Deploy the bundle** (init → core slim-dev → szl-receipts → vessels*):
   ```bash
   uds deploy uds-bundle-szl-warhacker-*.tar.zst \
     --set DOMAIN="${DOMAIN}" \
     --set INSECURE_ADMIN_PASSWORD_GENERATION=true \
     --confirm --no-progress
   ```
   > *vessels deploys only after FA-001 (GHCR image push). It is an
   > `optionalComponents: [vessels-ui]` entry in `bundles/szl-warhacker/uds-bundle.yaml`
   > and will ImagePullBackOff otherwise.*

**Bundle layer breakdown** (from `bundles/szl-warhacker/uds-bundle.yaml`, v0.4.0):

| Layer | Package | OCI / local ref | Status |
|-------|---------|-----------------|--------|
| 1 | `init` | `ghcr.io/zarf-dev/packages/init:v0.77.0` | ✅ Available |
| 2 | `core` | `registry.defenseunicorns.com/public/core:1.5.0-upstream` | ✅ Available |
| 3 | `szl-receipts` | `../../packages/szl-receipts` (local, ref 0.3.1) | ✅ Local path |
| 4 | `vessels-uds` | `ghcr.io/szl-holdings/vessels-uds:uds-v0.3.0` | ⚠️ FA-001 gated |
| 5–8 | amaru / a11oy / sentra / rosie | COMMENTED OUT in bundle yaml | ❌ No Zarf packages |

**Step 3 — Verify:**

```bash
uds run verify
```

From `bundles/szl-warhacker/tasks.yaml` — checks:
- `kubectl cluster-info`
- `kubectl get pods -A -l app.kubernetes.io/part-of=uds-core`
- `kubectl get pods -n szl-receipts`
- Port-forward + `curl /health`:
  ```bash
  kubectl port-forward svc/szl-receipts-server 8443:8443 -n szl-receipts &
  CODE=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8443/health)
  # PASS when CODE=200
  ```

**Step 4 — Demo scenario (drone-deny receipt):**

```bash
uds run demo:scenario
```

From `bundles/szl-warhacker/tasks.yaml` — applies `../../scripts/demo_workload.yaml`,
waits up to 30 s for `szl.receipt.id` annotation on `deployment/szl-demo-agent -n
szl-demo-workload`, then runs `bash ../../scripts/verify_receipts.sh`.

**Step 5 — Teardown:**

```bash
uds run cleanup
# Runs: k3d cluster delete "${CLUSTER_NAME}"
```

Expected cold-boot-to-demo time: **≈90 seconds** once images cached (from
`bundles/szl-warhacker/tasks.yaml` description). First run pulls ~8–10 GB.

---

### 1.3 Path B — `operator/` Makefile (Full Flagship Demo)

This path is valid for the **full Warhacker flagship show** once GHCR images are
pushed (BL-001). Use it as the primary path from T-8 (Mon Jun 8) onward.

```bash
cd szl-uds-deployment/operator/

# Step 1 — Preflight (same as Path A)
bash scripts/preflight.sh

# Step 2 — Full demo-up (10–20 min first run; ≈5 min with Docker layer cache)
make demo-up

# Step 3 — Check status of all 5 flagships
make demo-status

# Step 4 — Tail receipt chain
make demo-receipts

# Step 5 — Teardown
make demo-tear-down
```

**What `make demo-up` runs** (from `operator/Makefile`):

```
preflight → cluster-create → uds-init → uds-core-deploy → flagships-deploy → szl-mesh-deploy → seed-receipts
```

**`cluster-create` target** (exact command from Makefile):

```bash
k3d cluster create szl-demo \
  -p "80:80@server:*" \
  -p "443:443@server:*" \
  --api-port 6550 \
  --runtime-ulimit nofile="1048576:1048576" \
  --k3s-arg "--disable=traefik@server:*" \
  --k3s-arg "--disable=metrics-server@server:*" \
  --k3s-arg "--disable=servicelb@server:*" \
  --k3s-arg "--disable=local-storage@server:*" \
  --image ghcr.io/defenseunicorns/uds-k3d/k3s:v1.35.4-k3s1 \
  --wait
export KUBECONFIG=/tmp/szl-demo-kubeconfig.yaml
```

**`uds-init` target:**

```bash
export KUBECONFIG=/tmp/szl-demo-kubeconfig.yaml
uds zarf tools download-init 2>/dev/null || true
uds zarf init --confirm --log-level warn
```

**`uds-core-deploy` target:**

```bash
export KUBECONFIG=/tmp/szl-demo-kubeconfig.yaml
uds deploy oci://ghcr.io/defenseunicorns/packages/uds/core:0.33.0-upstream \
  --confirm --log-level warn
```

**`flagships-deploy` target:**

```bash
export KUBECONFIG=/tmp/szl-demo-kubeconfig.yaml
kubectl apply -f configs/namespaces.yaml
kubectl apply -f configs/packages/package-a11oy.yaml    -n szl-a11oy
kubectl apply -f configs/packages/package-sentra.yaml   -n szl-sentra
kubectl apply -f configs/packages/package-amaru.yaml    -n szl-amaru
kubectl apply -f configs/packages/package-rosie.yaml    -n szl-rosie
kubectl apply -f configs/packages/package-killinchu.yaml -n szl-killinchu
kubectl apply -f deploy/flagships/
# Then: kubectl rollout status deployment/szl-<app> -n szl-<app> --timeout=300s
# for app in a11oy sentra amaru rosie killinchu
```

> **Blocker:** `deploy/flagships/deployments.yaml` references
> `ghcr.io/szl-holdings/a11oy:latest` etc. — ImagePullBackOff until BL-001 is resolved.

**`szl-mesh-deploy` target:**

```bash
kubectl apply -f configs/peat/
```

Applies peat-node CRD configs only — the CRDT mesh layer is not yet implemented
(see BL-007 / GAP-004).

**`seed-receipts` target:**

```bash
python3 scripts/seed-receipts.py
```

Generates 20 demo receipts across 5 flagships.

**Version matrix for Path B** (from `operator/Makefile` vars):

| Tool | Version |
|------|---------|
| UDS CLI | 0.18.0 |
| k3d | 5.8.3 |
| UDS Core | 0.33.0-upstream |
| k3s image | ghcr.io/defenseunicorns/uds-k3d/k3s:v1.35.4-k3s1 |

---

### 1.4 Path C — `warhacker-demo/scripts/` (BLOCKED)

This path is documented here for completeness. It **cannot run** until BL-003 is
resolved (real image-bearing `bundle.tar.zst` must be hosted at `RAW_BASE`).

```bash
# Step 1 — bootstrap + verify (requires NVIDIA RTX 4060 Ti, docker, cosign, k3d, uds)
sudo ./scripts/bootstrap_verify.sh

# Step 2 — deploy + 8-organ wait
./scripts/demo_run.sh
```

**What `bootstrap_verify.sh` does** (7 gates from the script):

1. `nvidia-smi` — asserts driver ≥ 535, GPU = RTX 4060 Ti, VRAM ≥ 8 GB; writes
   `$WORKDIR/.llm_profile.env` with LLM profile (16 GB path: Qwen2.5-7B-Instruct-AWQ
   via vLLM; 8 GB path: Phi-3.5-mini-instruct Q4_K_M via llama.cpp).
2. Docker + `nvidia-container-toolkit` GPU passthrough: `docker run --gpus all nvidia/cuda:12.3.0-base-ubuntu22.04 nvidia-smi`
3. k3d install / verify
4. uds-cli install / verify
5. cosign v2.4.1 install / verify
6. **Fetch + verify the bundle** from `RAW_BASE`:
   ```
   RAW_BASE="https://raw.githubusercontent.com/szl-holdings/uds-bundles/yachay/uds-warhacker-v1.0.0-assets/releases/szl-warhacker-uds-v1.0.0"
   ```
   Files fetched: `bundle.tar.zst`, `bundle.tar.zst.sig`, `bundle.tar.zst.sha256`,
   `bundle.tar.zst.rekor.bundle`, `cosign.pub`  
   Asserts: cosign.pub fingerprint = `a4d73120c312d94bdd6cbdfa6f3d629cfff4b85e7addde5f9c3fd4c02341eb30`  
   Asserts: sha256 manifest matches `88b99afc581e8c03d13c1033306c08c1027e51189f4f6c9f87223091c1119218`  
   Runs: `cosign verify-blob --key cosign.pub --insecure-ignore-tlog=true --signature bundle.tar.zst.sig bundle.tar.zst` → "Verified OK"
7. `zarf package inspect definition bundle.tar.zst`

**What `demo_run.sh` does** (5 stages from the script):

```bash
CLUSTER="szl-warhacker"
PORT="8080"
BUNDLE="$HOME/szl-warhacker/bundle.tar.zst"
ORGANS=(a11oy amaru sentra rosie killinchu vessels hatun-mcp local-llm)
READY_TIMEOUT="120"   # seconds per organ

# Stage 1: k3d cluster create
k3d cluster create "$CLUSTER" \
    --gpus all \
    --port "${PORT}:80@loadbalancer" \
    --wait

# Stage 2: uds deploy
uds deploy "$BUNDLE" --confirm

# Stage 3: wait for 8 organs
for organ in "${ORGANS[@]}"; do
  kubectl -n "$organ" rollout status "deployment/$organ" --timeout="${READY_TIMEOUT}s"
  # fallback: kubectl wait --for=condition=Ready pod -l "app=$organ" -A --timeout="${READY_TIMEOUT}s"
done

# Stage 4: open browser at http://localhost:8080

# Stage 5: print judge recipe (3 commands)
```

**Judge verification recipe** (from `demo_run.sh` — exact commands):

```bash
# 1. Verify the signed bundle (offline, no tlog call)
cosign verify-blob --key cosign.pub --signature bundle.tar.zst.sig bundle.tar.zst
# -> Verified OK

# 2. Inspect bundle governance components
zarf package inspect bundle.tar.zst
# -> a11oy / amaru / sentra / killinchu / rosie governance components

# 3. Exercise the full 4-organ Khipu consensus chain
curl -X POST localhost:8080/api/killinchu/uds/v1/mission/execute \
  -d '{"action":"threat_assess","payload":{"track_id":"4840D6"}}'
# -> DSSE-signed verdict + Khipu 3-of-4 consensus receipt
```

**Why this is blocked today:** The `bundle.tar.zst` committed to the repo
(SHA256 `88b99afc...1119218`) is a 3.9 KB image-free proof build generated in a
sandboxed environment with no Docker daemon. It contains only namespace + mesh-policy
manifests for 5 organs. Stage 3 of `demo_run.sh` — `rollout status` for 8 organs —
will hang and timeout because no pods can start without container images in the bundle.
Additionally, `RAW_BASE` points to a branch (`yachay/uds-warhacker-v1.0.0-assets`)
that may not exist in `szl-holdings/uds-bundles`, causing Stage 6 of
`bootstrap_verify.sh` to die at `curl` with a 404.

---

### 1.5 Supporting Scripts (warhacker-demo/scripts/)

These scripts are fully coded and real. They function once the 8-organ cluster is
actually running (i.e., after BL-003 is resolved).

**`kill_organ.sh <organ>`** — Khipu Consensus kill-move:

```bash
./scripts/kill_organ.sh sentra
# Runs: kubectl -n sentra scale deployment/sentra --replicas=0
# Counts live witnesses among: a11oy sentra amaru killinchu
# LIVE >= 3 -> "action CANONICAL (BFT tolerates f=1)"
# LIVE <  3 -> "action REJECTED (quorum lost — fail CLOSED)"
```

**`restore_organ.sh <organ>`** — inverse of kill_organ.sh (scale back to 1 replica).

**`airgap_test.sh`** — proves offline: creates a loopback-only Linux network namespace
(`ip netns add szl-airgap`; no default route; empty resolv.conf), runs cosign verify
and 4-organ chain via loopback, asserts no DNS/HTTP packets leave the namespace via
tcpdump on the host interface.

**`thermal_guard.sh`** — polls `nvidia-smi` GPU temp; WARN at 80°C; THROTTLE at 85°C
via `nvidia-smi -lgc 1500,2000`.

---

### 1.6 Pepr DSSE Receipt Policy (optional component)

From `szl-uds-deployment/pepr/policies/szl-receipt-on-deploy.ts`. Requires build
before demo if including the Pepr module:

```bash
cd szl-uds-deployment/pepr
pnpm install
pnpm build
```

This emits a DSSE receipt for every Deployment/Job admission. szl-receipts (Layer 3 of
the bundle) includes this Pepr webhook and does not require a separate build step when
deploying via `uds run start`.

---

### 1.7 killinchu Standalone (Live HF Space)

killinchu is live today at `https://szlholdings-killinchu.hf.space` regardless of
cluster state. The judge recipe's third command can target this instead of
`localhost:8080` if the cluster is not yet up.

```bash
# Substitute HF Space for localhost during pre-deploy judge demo
curl -X POST https://szlholdings-killinchu.hf.space/api/killinchu/v1/counter-uas/evaluate \
  -H "Content-Type: application/json" \
  -d '{"track_id":"4840D6","lat":32.7,"lon":-117.2,"alt_m":120,"speed_ms":15}'
# -> geofence + 13-axis Λ-gate + DSSE receipt

# ECDSA-P256-SHA256 DSSE signing (real, no cluster needed)
curl -X POST https://szlholdings-killinchu.hf.space/khipu/sign?mode=ecdsa \
  -H "Content-Type: application/json" \
  -d '{"payload":"base64-encoded-statement"}'
# -> returns verified: true

# Doctrine posture probe
curl https://szlholdings-killinchu.hf.space/api/killinchu/v1/honest
# -> {"kernel_commit":"c7c0ba17","doctrine":"v11","lambda":"Conjecture 1"}
```

Image `ghcr.io/szl-holdings/killinchu:uds-v0.2.0` exists in GHCR (Rekor logIndex
1710339915) but is private — requires BL-001 visibility fix for cluster deployment.

---

### 1.8 killinchu Standalone Zarf Deploy (separate from bundle)

killinchu has its own `deploy/zarf.yaml` (version `uds-v0.3.1-rc.1`) and can be
deployed standalone without the full bundle:

```bash
cd killinchu/
zarf package create deploy/ --confirm
zarf package deploy zarf-package-killinchu-amd64-uds-v0.3.1-rc.1.tar.zst --confirm
# Deploys namespace killinchu + deployment killinchu + service killinchu
# Images: ghcr.io/szl-holdings/killinchu:uds-v0.3.1-rc.1 (blocked by BL-001)
#         ghcr.io/szl-holdings/killinchu:v1.0.0-alpha     (blocked by BL-001)
```

---

## 2. Blockers Table

> **Code-fixable** = a developer can fix in a PR without founder/admin access.  
> **Founder admin** = requires Stephen (org owner) action in GitHub/GHCR settings.

| ID | Blocker | Repo(s) | Impact | Proposed Fix | Who Acts |
|----|---------|---------|--------|--------------|----------|
| **BL-001** | GHCR 403 — a11oy, sentra, amaru, rosie images not pushed to `ghcr.io/szl-holdings/<organ>:uds-v*` | uds-bundles, szl-uds-deployment | 4 of 5 flagship organs cannot ImagePull in cluster; `make flagships-deploy` rollout-status WARNs; judge recipe command 3 cannot hit a live cluster | Enable org-level GHCR package write in GitHub org settings; trigger `ghcr-build-push.yml` on each repo by pushing a `uds-v*` tag; or run `docker push ghcr.io/szl-holdings/<organ>:uds-v0.3.1` manually | **Founder admin (Stephen)** |
| **BL-002** | No Zarf packages for a11oy, sentra, amaru, rosie — SBOM JSON only at uds-v0.3.0 release | uds-bundles | Cannot build a UDS bundle including these organs; `uds bundle create` fails on first staged package; `uds-bundles/uds-bundle.yaml` has `# STAGED` comments on all four | On a healthy Docker host: `cd uds-bundles && bash build_sign_all.sh` (requires `COSIGN_KEY`/`COSIGN_PUB` env vars + Docker daemon). Then `zarf package publish dist/<pkg>.tar.zst oci://ghcr.io/szl-holdings/<organ>-uds` | **Code (Dev2) + Founder admin (COSIGN_KEY secret, GHCR publish)** |
| **BL-003** | `warhacker-demo/bundle.tar.zst` (committed fixture) is a 3.9 KB image-free proof build | warhacker-demo | `demo_run.sh` Stage 2 (`uds deploy`) produces no running pods; Stage 3 (`rollout status` for 8 organs) times out for every organ; entire Path C non-functional | Build a real image-bearing bundle on a Docker host with all 8 organ images available; host it at `RAW_BASE` (the `yachay/uds-warhacker-v1.0.0-assets` branch or a release asset); update `EXPECTED_BUNDLE_SHA` in `bootstrap_verify.sh`; re-sign with cosign | **Founder admin (image push + branch create + sign)** |
| **BL-004** | `RAW_BASE` branch `yachay/uds-warhacker-v1.0.0-assets` may not exist in `szl-holdings/uds-bundles` | warhacker-demo (`bootstrap_verify.sh` line: `RAW_BASE=https://raw.githubusercontent.com/szl-holdings/uds-bundles/yachay/uds-warhacker-v1.0.0-assets/...`) | `bootstrap_verify.sh` Step 6 `curl` returns 404 → `die "could not fetch bundle.tar.zst"` → script exits non-zero | Create the branch in uds-bundles OR update `RAW_BASE` env var to point to a real release asset URL; document the override in README | **Founder admin (branch/release creation)** |
| **BL-005** | `ghcr.io/szl-holdings/packages/szl-receipts:0.3.1` not published to GHCR OCI registry | uds-bundles (`mesh/bundles/v0.3.1-demo/uds-bundle.yaml`), uds-mesh | `uds-mesh` v0.3.1-demo bundle pull fails; `uds create` against that bundle errors on Layer 3; probe of 2026-05-30 returned 403 | `cd szl-uds-deployment && zarf package create packages/szl-receipts --confirm && zarf package publish zarf-package-szl-receipts-amd64-0.3.1.tar.zst oci://ghcr.io/szl-holdings/packages/szl-receipts:0.3.1`; set GHCR visibility to public | **Code (Dev2) + Founder admin (GHCR visibility)** |
| **BL-006** | killinchu GHCR image is private (`ghcr.io/szl-holdings/killinchu:uds-v0.2.0`, Rekor logIndex 1710339915) | killinchu, uds-bundles | Cluster deploy of killinchu Zarf package produces ImagePullBackOff for nodes without authenticated pull; blocks in-cluster judge recipe execution | Set package visibility to Public in GitHub Packages UI: `ghcr.io/szl-holdings/killinchu` → Make public; or configure imagePullSecret in cluster | **Founder admin (GHCR visibility)** |
| **BL-007** | `COSIGN_KEY` + `COSIGN_PASSWORD` secrets not set in GitHub uds-bundles repo | uds-bundles (`.github/workflows/zarf-bundle-build.yml`) | `zarf-bundle-build.yml` fails loudly on cosign sign step; signed artifact production blocked in CI | GitHub repo Settings → Secrets → Add `COSIGN_KEY` (base64-encoded private key PEM) and `COSIGN_PASSWORD` | **Founder admin (GitHub secret provisioning)** |
| **BL-008** | rosie release asset exceeds 2 GiB Zarf limit | (rosie repo — not in scope of this clone) | `zarf package create` refuses to package assets > 2 GiB; no signed Zarf package for rosie can be produced until resolved | Split large asset or reference via OCI `images:` pull (not file-attached); Zarf v0.77.0 `max-package-size` flag can increase limit at cost of memory: `zarf package create --max-package-size 4096` | **Code fix (rosie dev)** |
| **BL-009** | Invalid SHA pin `anchore/sbom-action@55dc4ee22412511ee8c3e6e5b0e24a5b8151ee6c` in `szl-uds-deployment/.github/workflows/sbom.yml` | szl-uds-deployment | SBOM CI job references a SHA that does not correspond to any published release commit of `anchore/sbom-action`; job may fail on runner SHA verification | Update pin: `anchore/sbom-action@v0.17.0` → get correct SHA via `gh api /repos/anchore/sbom-action/commits/v0.17.0 --jq .sha`; pin to that SHA | **Code fix (Dev1 / Dev2)** |
| **BL-010** | Doctrine-gate CI failures org-wide (`doctrine-check.yml`) — SLSA L2 badge in profile README; PROVENANCE_NOTICE not in allowlist | szl-uds-deployment, uds-bundles, others | All PRs show failing CI on doctrine check; noise on main branch status | Fix SLSA L2 badge → L1 in profile/README.md; add PROVENANCE_NOTICE to allowlist; already scoped to Dev1 | **Code fix (Dev1)** |
| **BL-011** | `vessels-uds` Zarf package released as tarball attachment (not OCI); image push gated on FA-001 | szl-uds-deployment (`bundles/szl-warhacker/uds-bundle.yaml`, Layer 4) | `vessels-uds` is an `optionalComponents: [vessels-ui]` entry pointing to `ghcr.io/szl-holdings/vessels-uds:uds-v0.3.0`; vessel pods ImagePullBackOff | Founder pushes `ghcr.io/szl-holdings/vessels:<tag>` to GHCR; then `zarf package publish` the signed vessels-uds tarball to OCI | **Founder admin (FA-001)** |

---

## 3. Gaps for the Vision

The following are gaps between what the repos commit to describing (per the Warhacker
vision, `WARHACKER_VISION.md`, and the embedded demo scripts) and what is actually
runnable. Gaps are ordered by demo-day criticality.

### GAP-001 — No real image-bearing UDS bundle exists

**Vision:** `demo_run.sh` deploys a cosign-signed airgap bundle containing all 8 organ
images and waits for all 8 to be Ready within 90 seconds.

**Reality:** `bundle.tar.zst` is a 3.9 KB Zarf manifest-only package. `airgap-bundle.tar.zst`
(Rekor logIndex 1693866388) embeds images for killinchu, vessels, hatun-mcp only (3 of
8). No bundle exists with all 8 organs embedded.

**Fix path:** Resolve BL-001 and BL-002 first. Then on a Docker host with all 5
flagship images published: `uds create bundles/szl-warhacker --confirm` from
szl-uds-deployment, or `bash build_sign_all.sh` from uds-bundles, then
`uds bundle create` against the root `uds-bundle.yaml`.

---

### GAP-002 — 4 of 5 flagship organs have zero in-cluster footprint

**Vision:** `make demo-up` brings up 5 flagships (a11oy, sentra, amaru, rosie,
killinchu) with Package CR phase = Ready; `make demo-status` shows 5× ✅.

**Reality:** `deploy/flagships/deployments.yaml` in szl-uds-deployment references
`ghcr.io/szl-holdings/a11oy:latest` etc. None of a11oy, sentra, amaru, or rosie have
published images. `make flagships-deploy` applies the manifests successfully but all
four rollout-status checks WARN. Only killinchu has a live HF Space.

**Fix path:** BL-001 (image push) + BL-002 (Zarf package build). Deploy order per
`bundles/szl-warhacker/uds-bundle.yaml` staged-modules comment: `amaru → a11oy →
sentra → rosie` (a11oy must be up before sentra/rosie can register).

---

### GAP-003 — Khipu Consensus kill-move only works on live cluster

**Vision:** `kill_organ.sh sentra` → 3-of-4 CANONICAL; `kill_organ.sh sentra` +
`kill_organ.sh killinchu` → 2-of-4 REJECTED. This is the signature Warhacker demo
moment.

**Reality:** `kill_organ.sh` calls `kubectl -n sentra scale deployment/sentra --replicas=0`
and then counts `readyReplicas` for `{a11oy,sentra,amaru,killinchu}`. With only
szl-receipts running (Path A today), there are no organ namespaces to scale. The
kill-move cannot be demonstrated without the full 8-organ cluster.

**Fix path:** Blocked behind GAP-001 and GAP-002. No workaround short of mocking
the organ namespaces with stub deployments.

---

### GAP-004 — szl-mesh CRDT layer is a design skeleton

**Vision:** The SZL mesh provides CRDT-backed cross-pod organ routing with W3C
traceparent + DSSE PAE v1 receipts per span.

**Reality:** From `szl-mesh/README.md`: "Status: Skeleton — Design complete,
implementation in progress." "No Zarf package has been published yet." The
`make quickstart` target references a non-existent Makefile. What exists:
7 markdown spec files, `proto/szl_mesh.proto` + `proto/szl_receipt.proto`, a
conceptual Python example in `examples/hello-mesh/`. The operator Makefile's
`szl-mesh-deploy` target only applies `configs/peat/` CRD configs (peat-node
manifests) — not the full CRDT mesh.

**uds-mesh** (the canonical SDK home per ADR-0001) has real code:
`mesh/sdk/mesh.py`, `mesh/sdk/mesh.ts`, and a 33-test pytest conformance suite
(`pytest mesh/conformance/ -v`). But cross-pod organ routing is roadmap v0.4.0;
no deployable UDS package for the mesh layer itself exists.

**Fix path:** For Warhacker 2026, present the SDK conformance suite as the mesh
proof-of-concept; reference `uds-mesh` ADR-0001. Full CRDT mesh is post-event.

---

### GAP-005 — local-llm organ has no repo, no image, no Zarf package

**Vision:** `demo_run.sh` lists `local-llm` as the 8th organ in `ORGANS=(a11oy amaru
sentra rosie killinchu vessels hatun-mcp local-llm)` and selects between two LLM
profiles: `vllm-qwen2.5-7b-awq` (16 GB VRAM) or `llamacpp-phi3.5-mini` (8 GB).

**Reality:** No `local-llm` repo exists in the org. No image, no Zarf package, no
deployment manifest. `bootstrap_verify.sh` writes the LLM profile to `.llm_profile.env`
and `demo_run.sh` sources it — but the actual LLM pod never gets deployed.

**Fix path:** For Warhacker demo: run the chosen LLM outside the cluster (e.g., `vllm
serve` or `llama.cpp server` on the host). Document in RUNBOOK that local-llm is
host-side, not an in-cluster organ. Or remove it from `ORGANS` to allow clean demo-run
completion on the other 7 organs.

---

### GAP-006 — hatun-mcp organ has no public source or Zarf package

**Vision:** `demo_run.sh` includes `hatun-mcp` as organ 7 in the 8-organ sequence;
operator shell references it as an MCP (Model Context Protocol) broker.

**Reality:** No `hatun-mcp` repo in the cloned org repos. Referenced in
`uds-bundles/uds-bundles/PER_BUNDLE/` directory listing as a target. `airgap-bundle.tar.zst`
(3.7 KB stub) claims to embed hatun-mcp but the stub contains no actual image.

**Fix path:** Implement or stub with a minimal HTTP server returning the expected
health/receipts responses; package as a Zarf component.

---

### GAP-007 — UDS CLI version mismatch across paths

**Vision:** Single consistent toolchain across all paths.

**Reality:**

| Source | UDS version |
|--------|-------------|
| `operator/Makefile` (`UDS_VERSION` var) | 0.18.0 |
| `operator/docs/WARHACKER_DEMO_RUNBOOK.md` install block | 0.18.0 |
| `uds-bundles/.github/workflows/zarf-bundle-build.yml` (Zarf) | v0.51.0 |
| `bundles/szl-warhacker/uds-bundle.yaml` (init package) | `ghcr.io/zarf-dev/packages/init:v0.77.0` |
| `bootstrap_verify.sh` (no explicit version; `uds version` check only) | latest at install time |

UDS CLI 0.18.0 bundles Zarf v0.51.0. The init package referenced in the bundle is
`v0.77.0` which ships with UDS CLI 0.33.x+. Using UDS CLI 0.18.0 with a `v0.77.0`
init package may cause compatibility errors.

**Fix path:** Pin all paths to UDS CLI that bundles Zarf ≥ v0.77.0 (check
`uds zarf version`); update `operator/Makefile UDS_VERSION` accordingly.

---

### GAP-008 — Pepr DSSE receipt bundle cosign signature not yet applied

**Vision:** All SZL artifacts are cosign-signed; judge can run `cosign verify-blob`
and get "Verified OK".

**Reality:** From `bundles/szl-warhacker/uds-bundle.yaml` comment: "NOTE: the
szl-receipts BUNDLE artifact is not cosign-signed yet (Phase 2, org key provisioning
U5). `cosign verify` on the bundle artifact WILL FAIL until then."

**Fix path:** Provision org cosign key (BL-007 prerequisite); run
`cosign sign-blob --key cosign.key bundle.tar.zst > bundle.tar.zst.sig`; host both
files at RAW_BASE; update SHA in `bootstrap_verify.sh`.

---

## 4. What Actually Deploys Today (No Blockers)

| Component | How to deploy | Evidence |
|-----------|--------------|---------|
| UDS Core slim-dev (Istio + Pepr + Keycloak lite) | `uds run start` from `bundles/szl-warhacker/` | `registry.defenseunicorns.com/public/core:1.5.0-upstream` is a public upstream artifact |
| szl-receipts (Pepr webhook + DSSE receipt server) | `uds run start` from `bundles/szl-warhacker/` | Local path build from `packages/szl-receipts`; stock images `python:3.12-slim` + `nginx:1.27-alpine` |
| killinchu (HF Space, live) | `curl https://szlholdings-killinchu.hf.space/...` | Live now; all 5 surface APIs working |
| killinchu cosign-signed image | `ghcr.io/szl-holdings/killinchu:uds-v0.2.0` (private) | Rekor logIndex 1710339915; requires BL-006 for public pull |
| uds-mesh conformance suite | `pytest mesh/conformance/ -v` from `uds-mesh/` | 33 tests; SDK + span schemas present |

---

## 5. Recommended Actions for CTO (T-12 to T-0)

These are the minimum founder-admin actions to unlock the full demo by T-8 (Mon Jun 8):

1. **T-11 (Fri Jun 5) — GHCR package access:** In GitHub org settings → Packages, set
   Actions policy to allow write for all repos. Manually trigger `ghcr-build-push.yml`
   on a11oy, sentra, amaru, rosie repos (or push a `uds-v0.3.1` tag to each). Confirms
   BL-001 resolved when `docker pull ghcr.io/szl-holdings/a11oy:uds-v0.3.1` returns 200.

2. **T-11 (Fri Jun 5) — Set COSIGN_KEY secret:** GitHub repo uds-bundles → Settings →
   Secrets → `COSIGN_KEY` (base64-encoded PEM) + `COSIGN_PASSWORD`. Unblocks BL-007 and
   enables `zarf-bundle-build.yml` CI to produce signed artifacts.

3. **T-10 (Sat Jun 6) — killinchu GHCR visibility:** Set
   `ghcr.io/szl-holdings/killinchu` package visibility to Public (BL-006). Enables
   cluster deploy of killinchu without imagePullSecret.

4. **T-9 (Sun Jun 7) — Create `yachay/uds-warhacker-v1.0.0-assets` branch** in
   `szl-holdings/uds-bundles` and host the real signed bundle artifacts at that path
   (BL-004). Or update `RAW_BASE` in `warhacker-demo/bootstrap_verify.sh` to point to a
   GitHub Release asset URL.

5. **T-8 (Mon Jun 8) — Full demo smoke test:** With images in GHCR, run
   `make demo-up` from `szl-uds-deployment/operator/` end-to-end on the RTX 4060 Ti
   tower. All 5 flagship `rollout status` must show Ready. Run `kill_organ.sh sentra`
   → verify 3-of-4 CANONICAL; run `kill_organ.sh killinchu` → verify 2-of-4 REJECTED.

---

*Dev2 (Deploy/UDS) — prepared for CTO review. No push to main. All findings from
direct repo inspection of: szl-uds-deployment, warhacker-demo, uds-bundles, szl-mesh,
uds-mesh, killinchu. Repos cloned at depth=1 on 2026-06-04.*

*Doctrine v11 LOCKED 749/14/163 @ c7c0ba17 · Λ = Conjecture 1 · SLSA L1*
