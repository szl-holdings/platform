# 83 — UDS RUNNING DEPLOYMENT PLAN (Warhacker, June 16–19 2026)

**Classification:** SZL Internal — Founder Eyes
**Date:** 2026-05-31
**Goal:** Stand up a *running* UDS deployment of the SZL organs for Andrew Greene and the Warhacker floor — satisfying his ask: *"it'd be awesome to see a running deployment of what you've built!"*

---

## 0. SANDBOX FINDINGS THAT SHAPE THIS PLAN

Verified in the Perplexity sandbox on 2026-05-31:
- `zarf v0.51.0` downloads and runs (binary from zarf-dev/zarf releases). `zarf dev lint` on a11oy's `artifacts/a11oy-uds/zarf.yaml` → **exit 0** (schema valid).
- **The release tarballs are repo-source archives, not built Zarf packages.** `zarf package inspect <tarball>` reports *"no zarf.yaml at archive root."* You must `zarf package create` from the nested manifest dir (`artifacts/a11oy-uds/` or `deploy/`) **before** `zarf package deploy`.
- cosign verifies vessels keyless (Verified OK, Rekor `1675423172`) and verifies the v0.2.0 dev-key artifacts (Verified OK). The 5 unsigned v0.3.x payloads block `cosign verify` until re-signed (doc 81 P0-1).
- amaru/sentra Zarf packages reference container images `ghcr.io/szl-holdings/{amaru,sentra}:v1.0.0-alpha` — these images must exist/be pullable (or be in the Zarf package as `init`-bundled images) for a real deploy. **Phase-2 containerization is the gating dependency for a live deploy.**

---

## 1. CLUSTER OPTIONS (pick one)

| Option | Best for | Bring-up | Notes |
|---|---|---|---|
| **k3d** (k3s-in-Docker) | **Recommended for the laptop demo** | `k3d cluster create uds --servers 1 --agents 1 -p "80:80@loadbalancer" -p "443:443@loadbalancer"` | DU's own UDS bundles target k3d. Lightest, fastest, matches `docs/UDS_DEPLOYMENT.md` ("deployable on a UDS k3d cluster"). |
| **k3s** (bare metal/VM) | Air-gapped USB → field box | `curl -sfL https://get.k3s.io \| sh -` | Closest to tactical-edge. Use if demoing on a NUC/edge box from the USB. |
| **kind** | CI / fallback | `kind create cluster --name uds` | Works but no built-in LB; needs `kubectl port-forward`. Use only if k3d/Docker LB ports are blocked. |

**Recommended demo target:** **k3d** on the demo laptop. Air-gap story: same images/packages deploy on **k3s** from the USB.

---

## 2. PREREQUISITES (install on the demo box)

```bash
# Zarf
curl -sSL -o zarf "https://github.com/zarf-dev/zarf/releases/download/v0.51.0/zarf_v0.51.0_Linux_amd64"
chmod +x zarf && sudo mv zarf /usr/local/bin/
# uds-cli (for the mesh bundle)
curl -sSL -o uds "https://github.com/defenseunicorns/uds-cli/releases/latest/download/uds-cli_$(uname -s)_amd64"
chmod +x uds && sudo mv uds /usr/local/bin/
# k3d + kubectl + docker (already on most dev boxes)
curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash
# verification
cosign version && zarf version && uds version && k3d version
```

---

## 3. BRING-UP SEQUENCE

### Step 0 — Init the UDS cluster
```bash
k3d cluster create uds --servers 1 --agents 1 \
  -p "80:80@loadbalancer" -p "443:443@loadbalancer"
# Zarf init (registry + git server in-cluster, for airgap parity)
zarf init --confirm
# UDS core (Istio + Keycloak + Pepr policy engine) — DU bundle:
uds deploy ghcr.io/defenseunicorns/packages/uds/bundles/k3d-core-demo:latest --confirm
```

### Step 1 — Verify every payload BEFORE deploying (trust-then-deploy)
Run `VERIFY_ALL.sh` from the USB bundle. **Do not deploy anything that fails sha256.** vessels must show "Verified OK" via cosign keyless. The other 5 must show sha256 OK (and cosign OK once re-signed).

### Step 2 — Build + deploy each organ (deploy order matters)
Deploy order follows the dependency direction L1→L7 (a11oy is the kernel everything hangs off; mesh last as the capstone):

```
1. a11oy     (kernel — policy gates, witness, provenance)
2. amaru     (sync runtime — depends on a11oy receipts)
3. sentra    (resilience command — consumes amaru deltas)
4. rosie     (decision fabric — witnesses across organs)
5. vessels   (vertical app — the visible UI for the floor; SIGNED)
6. uds-mesh  (capstone bundle binding the organs)
```

Per-organ (Zarf):
```bash
# a11oy (manifest at artifacts/a11oy-uds/)
zstd -d a11oy-uds-0.3.0.tar.zst -o a11oy.tar && tar -xf a11oy.tar
cd a11oy-*/artifacts/a11oy-uds && zarf package create . --confirm
zarf package deploy zarf-package-a11oy-uds-*.tar.zst --confirm && cd -

# amaru / sentra (manifest at deploy/)  — needs ghcr images pullable
for o in amaru sentra; do
  zstd -d ${o}-uds-0.3.0.tar.zst -o ${o}.tar && tar -xf ${o}.tar
  cd ${o}-*/deploy && zarf package create . --confirm
  zarf package deploy zarf-package-${o}-*.tar.zst --confirm && cd -
done
```

Mesh (uds-cli):
```bash
zstd -d uds-mesh-uds-0.3.0.tar.zst -o mesh.tar && tar -xf mesh.tar
cd uds-mesh-*/ && uds create . --confirm
uds deploy uds-bundle-szl-mesh-*.tar.zst --confirm && cd -
```

### Step 3 — Confirm running
```bash
kubectl get pods -A | grep -E "a11oy|amaru|sentra|rosie|vessels|szl"
kubectl get virtualservices -A    # UDS Istio routes
```

---

## 4. EXPECTED PORTS / ENDPOINTS

| Service | Port | Path | Exposure |
|---|---|---|---|
| vessels web (nginx:alpine) | 8080 (ClusterIP) → 443 via Istio | `/` | UDS Istio VirtualService (the visible demo UI) |
| sentra posture API | service ClusterIP | `/posture` | in-cluster |
| amaru runtime | service ClusterIP | delta-log sync | in-cluster |
| composition-runtime metrics | 9090 | `/metrics` | admin gateway (Prometheus) — from `bundles/v0.3.1` runtime-layer bundle |
| a11oy | file-drop `/opt/a11oy/` | n/a | node-local (no service) |

Access the vessels UI: `https://vessels.uds.dev.local` (add to `/etc/hosts` → k3d LB IP) or `kubectl port-forward svc/vessels 8080:8080`.

---

## 5. DEMO SCRIPT (90 seconds, for the floor)

1. **Trust** (15s): run `VERIFY_ALL.sh` — show `vessels … Verified OK`, Rekor index `1675423172`, all 6 `sha256 … OK`. "Every payload is integrity-checked; vessels is cryptographically signed and in the public Rekor transparency log."
2. **Deploy** (30s): `INSTALL_ON_UDS.sh` already ran; `kubectl get pods -A` shows the organs Running. "This is `zarf package deploy` onto a UDS k3d cluster — same flow as a tactical edge box from this USB."
3. **Show the app** (30s): open the vessels UI — run `scripts/demo_ais_replay.sh` (5 sample AIS messages, no live provider needed) → a dark-vessel alert fires → click it → show the DSSE-wrapped governance receipt (prevHash + selfHash chain).
4. **Prove the chain** (15s): `scripts/verify_receipts.sh` → "Every alert is backed by an offline-verifiable receipt. No phone-home. Air-gap native."

---

## 6. GATING DEPENDENCIES / RISKS

| Risk | Severity | Mitigation |
|---|---|---|
| 5 payloads unsigned → cosign fails on the floor | **P0** | Re-sign with dev key + roll vessels' keyless CI (doc 81 P0-1) before June 16 |
| amaru/sentra images `:v1.0.0-alpha` may not be pullable/airgap-bundled | **P0 for live deploy** | Phase-2 containerize + push to ghcr; or `zarf package create` with `--no-images` and bundle images; or demo vessels-only (it's the visible UI) |
| Tarballs aren't built Zarf packages | P1 | `zarf package create` step baked into INSTALL_ON_UDS.sh |
| rosie/vessels have no committed zarf.yaml | P1 | Use the planned `uds-package-vessels` layout in `docs/UDS_DEPLOYMENT.md`; rosie demo is receipt-replay (no cluster service needed) |
| No network on the floor | P1 (it's a feature) | Pre-pull UDS core + images into the k3d image cache before travel; `zarf init` makes it airgap-capable |

**Fallback for a guaranteed-green demo:** deploy **vessels only** (it is fully signed and is the visible UI), show cosign Verified OK + Rekor index + AIS-replay + receipt chain. That alone satisfies "a running deployment of what you've built" with full provenance.

---

*Sources: sandbox-verified zarf v0.51.0 behavior; vessels `docs/UDS_DEPLOYMENT.md` (k3d, nginx:alpine:8080, demo_ais_replay.sh, verify_receipts.sh); amaru/sentra `deploy/zarf.yaml` image refs; uds-mesh `uds-bundle.yaml`; DU UDS k3d-core bundle conventions. Verification results: doc 81.*
