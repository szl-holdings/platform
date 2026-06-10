# FORGE / REPLIT — GitHub Work-Order: UDS push (Zarf · Pepr · Lula · K9) — live-cluster execution

**From:** Perplexity Computer (Lane C — anatomy + UDS push + K9, autonomous) → Forge / Replit
**Date:** 2026-06-10 (T-6 to Warhacker)
**Canonical path:** `platform/replit-sync/` (this file). Pairs with `UDS_DEPLOY_RUNBOOK.md`
(in `szl-uds-deployment`), `docs/architecture/MESH_DEPLOYMENT_RUNBOOK.md`, the
`szl-fleet-overlay` `Makefile` targets, and `k9/README.md` (this repo). Read those for the
authoritative per-repo detail; this work-order is the **consolidated one-by-one sequence**
plus the **doctrine gate** Forge must hold on a live box.

## 0. HARD RULES (ABSOLUTE — carry through every step)
- **locked-proven = EXACTLY 8** `{F1, F4, F7, F11, F12, F18, F19, F22}` @ kernel `c7c0ba17` (749/14/163), enforced by `Lutar.Wave8.AxiomDisclosure.locked_count_eight` (`by decide`, no axioms). **NEVER inflate; never relabel experimental/conditional as locked. Never regress to "5".**
- **Λ unconditional uniqueness = Conjecture 1** (machine-checked FALSE; conditional = Theorem U, axiom-free). **Khipu BFT safety = Conjecture 2** (Wave23 conditional only). Full ESR = open/roadmap.
- **SLSA:** L1 honest · L2 build-attested on container images where `attest-build-provenance` runs (a11oy, killinchu, + the 5 organ `uds-v0.2.0` images, keyless Fulcio/Rekor) · bundle-level L2-verified / **L3 / FedRAMP / Iron Bank / CMMC / ATO / IL4-5 = roadmap only, never bare.**
- No fabricated capability; honest **live / SAMPLE / SIMULATED** labels. **0 runtime CDN.** GitHub↔HF byte-identical (sha256). Conventional Commits + DCO (`git commit -s`); SHA-pinned actions; squash-merge; one branch per task.
- **FOUNDER HARD-LIMIT (do NOT cross):** anything touching the **cosign/Rekor signing key** material. `szl-uds-deployment` **#57** (verify receipt signing) and **#51** (cosign-verifiable SLSA **L2** provenance on the UDS bundle) are signing-key infra — **do NOT merge them**; rebase + review only, and **#51 wording stays "roadmap / not yet earned."**

## 1. WHAT LANE C ALREADY DID THIS SESSION (sandbox, no cluster)
Executed everything that is doable **without** a container runtime / kube-apiserver, and pushed byte-identical fixes to GitHub `main`:
- **anatomy v4** — verified deployed state (PRs #1/#2/#3 already merged), rendered headless (0 console errors, vendored three.js, `data.js` locked set = exactly the 8), and **deployed GitHub→HF byte-identical** (`SZLHOLDINGS/anatomy`, static space, all 5 served files sha256-equal). Live `.hf.space` host: CDN propagation pending from our egress class — **content verified correct**, not an app defect.
- **K9 ops interface** (`platform/replit-sync/k9/`) — `k9_ops_feeds.py` runs and pulls **real live** HF Space stages + GitHub Actions runs; UDS honestly `unreachable` (no `K9_UDS_STATUS_URL`); action receipts labeled `SIMULATED` (K9 holds no signing key). **Fixed a stale `locked=5`→`8`** in both `k9_ops_feeds.py` (added `locked_set` + `locked_commit` + Khipu BFT Conjecture-2 label) and `k9_console.html` doctrine bar. Console renders (k9s-style; vendored, 0 CDN).
- **Structural YAML/Zarf validation** (zarf binary absent → `python yaml`+`jsonschema`): all 5 `uds-bundle.yaml` are well-formed `UDSBundle` (resolvable refs: zarf init `v0.77.0`, DU core `1.5.0-upstream`, local `szl-receipts` `0.4.0`); both `zarf.yaml` valid `ZarfPackageConfig`; all Pepr policy `.ts` brace-balanced; OSCAL + kyverno YAML parse. **Fixes pushed:** (a) `szl-build-env` organ images `:latest` → pinned `:uds-v0.2.0` (generator `gen_organ_deployments.py` + all 5 `deploy/organs/*.yaml` — floating tag broke the image-pin / SLSA L1+L2 doctrine; env-overridable for local dev); (b) repaired malformed `uds-bundles/mesh/schemas/spans/a11oy.graph.yaml` (`szl_attributes` illegally mixed a mapping with a sequence — nested the 5 fields under `fields:`, all data preserved).
- **No bare-SLSA / locked-5 / banned-codename** found in the UDS repos or the reachable static surfaces (szlholdings-site, docs-site, developers, szl-trust); FedRAMP/IronBank/CMMC mentions are all honesty **disclaimers / CI denylists**. `cathedral` is not a `szl-holdings` repo.

## 2. NOT EXECUTABLE HERE — needs your connected build box (Docker/Lima + k3d + Zarf + UDS CLI + cosign). RUN ONE-BY-ONE.
Sandbox had `uds v0.32.0`, `k3d v5.9.0`, `cosign` — but **no Docker, no kubectl, no zarf binary**, so every cluster/package step below is **SIMULATED here, RUNNABLE for you.** Mirror `szl-uds-deployment/UDS_DEPLOY_RUNBOOK.md` §0–§9.

### 2.0 Prereqs — verify toolchain
```bash
uds version && zarf version && k3d version && cosign version && docker info >/dev/null && echo TOOLCHAIN_OK
```

### 2.1 Stand up a dev UDS Core cluster (Istio + Keycloak + Pepr)
```bash
uds deploy k3d-core-slim-dev:0.41.0 --confirm          # slim dev; k3d-core-demo for full core
kubectl get pods -A | grep -E 'istio|keycloak|pepr'    # expect Running
```

### 2.2 Build + sign the organ Zarf packages (KEYLESS = what actually runs)
Order: organs first (they are the package members the bundles reference). For each organ in **a11oy, sentra, amaru, rosie, killinchu**:
```bash
cd szl-uds-deployment/packages/<organ>
zarf package create . --confirm
# Keyless (GitHub OIDC → Fulcio + Rekor) is the canonical path that CI actually runs:
zarf package sign zarf-package-<organ>-*.tar.zst --signing-key <oidc>     # or rely on CI cosign.yml
cosign verify-attestation --type slsaprovenance ghcr.io/szl-holdings/<organ>:uds-v0.2.0   # L2 build-attest
```
Honest note: `killinchu:uds-v0.2.0` GHCR package is **private** (see `szl-build-env/HONEST_GAPS.md §1`) → `ImagePullBackOff` on a fresh cluster until the founder flips visibility public or an imagePullSecret is added. Report it as `KNOWN-GAP`, never fake green.

### 2.3 Apply the cosign ClusterImagePolicy (admission gate on signed digests)
```bash
kubectl apply -f szl-uds-deployment/policies/kyverno-verify-attestations.yaml
# (or the UDS-Core Pepr ClusterImagePolicy path — see docs/architecture/MESH_DEPLOYMENT_RUNBOOK.md)
```

### 2.4 Build + deploy the bundles — IN THIS ORDER
1. **Receipts / full-stack** (`szl-uds-deployment/uds-bundle.yaml`, `UDSBundle szl-receipts-bundle v0.4.0` → init + core-base + core-identity-authorization + local szl-receipts):
   ```bash
   cd szl-uds-deployment && uds create . --confirm && uds deploy uds-bundle-*-0.4.0.tar.zst --confirm
   kubectl get packages -A && kubectl -n szl-receipts get pods
   ```
2. **Mesh demo** (`uds-mesh/bundles/v0.3.1-demo/uds-bundle.yaml`, `szl-receipts-demo v0.3.1`):
   ```bash
   cd uds-mesh/bundles/v0.3.1-demo && uds create . --confirm && uds deploy uds-bundle-*-0.3.1.tar.zst --confirm
   ```
3. **Fleet overlay** (`szl-fleet-overlay/uds-bundle.yaml`, `UDS Operator + Helm`): prefer the Makefile path:
   ```bash
   cd szl-fleet-overlay && make preflight && make demo-up      # k3d + UDS Core + 5 flagships + szl-mesh (≈10–20 min)
   make demo-status && make demo-receipts                      # live status + receipt-chain depth
   ```

### 2.5 Pepr admission — exercise the governance policies (live)
```bash
# Pepr module: szl-uds-deployment/pepr/  (policies: szl-receipt-on-deploy, single-witness-exclusion,
# summation-invariant, killinchu-telemetry-admission). With the module deployed by UDS Core:
kubectl apply -f szl-uds-deployment/scripts/demo_workload.yaml      # should trigger receipt-on-deploy
kubectl -n pepr-system logs deploy/pepr-<uuid> | grep -i receipt    # admission emitted a receipt
kubectl apply -f szl-uds-deployment/tests/fixtures/...              # negative tests: single-witness-exclusion must DENY
```

### 2.6 Lula / OSCAL — live compliance evidence (only meaningful against a live cluster)
```bash
lula validate -f szl-uds-deployment/compliance/oscal-component-a11oy.yaml
lula validate -f szl-uds-deployment/compliance/oscal-component-killinchu.yaml
# Offline these return nothing; PASS/FAIL is only EARNED on the live cluster. Record results honestly.
```

### 2.7 K9 ops interface — build + deploy + wire to the LIVE cluster
The K9 surface is real and runnable (`platform/replit-sync/k9/`). It is the **only** ops UI that should ever read live UDS CR status — wire it last, after the cluster is up.
```bash
# A. Backend snapshot smoke (no cluster needed; proves live HF + GitHub feeds):
python3 platform/replit-sync/k9/k9_ops_feeds.py | jq '.doctrine, .spaces[0], .fleet[0]'   # locked_proven MUST read 8
# B. Wire the UDS feed to the live cluster (this is what makes the UDS tab go live):
kubectl -n szl-receipts port-forward svc/szl-receipts-server 8443:8443 &     # or a CR-status shim
export K9_UDS_STATUS_URL="http://127.0.0.1:8443/api/uds/packages"            # honest source; until set → "unreachable"
# C. Serve K9 (mirror a11oy serve.py composition — FastAPI include_router(build_router())):
#    mount k9_ops_feeds.build_router() under /api/k9/v1 and serve k9_console.html static (0 CDN).
uvicorn k9_app:app --host 0.0.0.0 --port 8090     # k9_app imports build_router() from k9_ops_feeds
# D. Open k9_console.html → Spaces/Fleet/UDS/Receipts tabs populate from /api/k9/v1/*.
```
**K9 doctrine:** real live data only; anything unreachable shows `source:"unreachable"` with a reason (never faked); action receipts are `SIMULATED` (K9 holds no signing key — it shows the receipt the **a11oy receipts server, ECDSA-P256** WOULD emit, never a forged signature). Footer must keep the attribution: *k9s-pattern reimplemented (Apache-2.0), not k9s code.*

## 3. TEST ONE-BY-ONE (acceptance — do not batch; record each)
1. `kubectl get packages -A` → every UDS Package CR `Ready`.
2. `cosign verify-attestation --type slsaprovenance` passes for each of the 5 organ digests (a11oy, sentra, amaru, rosie, killinchu) — except killinchu if GHCR still private (`KNOWN-GAP`).
3. Pepr `szl-receipt-on-deploy` emits a receipt on the demo workload; `single-witness-exclusion` **denies** the negative fixture.
4. `make demo-receipts` shows a non-empty, hash-chained receipt chain (SHA3-256 chain; DSSE/cosign is the separate signature layer).
5. `lula validate` against the live cluster returns real PASS/FAIL per OSCAL control.
6. K9: `/api/k9/v1/snapshot` returns `doctrine.locked_proven == 8`, real `spaces`/`fleet`, and `uds` either live (if `K9_UDS_STATUS_URL` set) or honest `unreachable`.
7. `uds remove ...` / `make demo-tear-down` cleans the cluster (teardown-guard green).

## 4. DOCTRINE GATE (Forge holds this before any merge/publish)
- [ ] locked-proven reads **8** everywhere it surfaces (K9, dashboards, READMEs) — never 5.
- [ ] Λ = **Conjecture 1**, Khipu BFT = **Conjecture 2** intact; no conditional/experimental relabeled as locked.
- [ ] SLSA **L1 honest / L2 build-attested / L3 roadmap**; no bare L3/FedRAMP/IronBank/CMMC/ATO/IL4-5.
- [ ] No fabricated live data — `SAMPLE`/`SIMULATED`/`unreachable` honestly labeled.
- [ ] Image refs **pinned** (no `:latest`); GitHub↔HF byte-identical; 0 runtime CDN.
- [ ] **#51 / #57 NOT merged** (founder signing-key hard-limit); #51 wording stays "roadmap / not yet earned."

## 5. FOUNDER-GATED (cannot proceed without the founder)
1. **`szl-uds-deployment` #57** (verify receipt signing) & **#51** (cosign SLSA L2 bundle provenance) — signing-key infra. Rebase onto `main` if stale; **do not merge**; #51 stays roadmap-worded.
2. **`killinchu:uds-v0.2.0` GHCR visibility = private** → make public (one click) or provide imagePullSecret, else killinchu is `KNOWN-GAP` on a fresh cluster (`szl-build-env/HONEST_GAPS.md §1`).
3. **cosign keyless signing ceremony** (Fulcio/Rekor via GitHub OIDC) for any new package/bundle release — founder runs; agents never hold the key.
4. **Founder `#print axioms` confirmation ceremony** for any served surface flipping a locked count — process gate (the 8-count is already kernel-proven true).

---

*Co-Authored-By: Perplexity Computer (Lane C) · Doctrine v11 — 749/14/163 — c7c0ba17 · HONESTY OVER CHECKLIST.*
