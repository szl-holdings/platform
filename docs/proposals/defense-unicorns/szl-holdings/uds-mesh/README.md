# szl-mesh — UDS bundle (A11oy + Sentra + Amaru)

**Author:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
**Plane:** Plane 1 of the mesh plan — see
[`docs/proposals/defense-unicorns/04_mesh_plan.md`](../../04_mesh_plan.md).
**Skeletons promoted from:** [`../../skeletons/`](../../skeletons/).

This directory is the staging copy of what is intended to land in a new
external repository, `szl-holdings/uds-mesh`. It composes three SZL
Zarf packages — A11oy, Sentra, Amaru — into a single UDS bundle
consumable by any `uds-cli`-capable operator unchanged. No change to
`uds-cli` itself is required.

## Layout

```
szl-holdings/
  a11oy/deploy/
    zarf.yaml
    attestations.jsonl
    manifests/{a11oy-namespace,proof-ledger-pvc,a11oy-deployment,a11oy-service}.yaml
  sentra/deploy/
    zarf.yaml
    manifests/{sentra-namespace,sentra-deployment,sentra-service}.yaml
  amaru/deploy/
    zarf.yaml
    manifests/{amaru-namespace,delta-log-pvc,amaru-deployment,amaru-service}.yaml
  uds-mesh/
    uds-bundle.yaml
    README.md   ← this file
```

In the external split, each `<app>/deploy/` directory will live at the
root of its own `szl-holdings/<app>` repository, and `uds-mesh/` will
be the root of `szl-holdings/uds-mesh`.

## Warhacker demo walk-through (validated against §06)

Each numbered step below maps to a step in
[`../../06_warhacker_brief.md`](../../06_warhacker_brief.md).

### 0. Prerequisites (off-stage)

```sh
# uds-cli + zarf, per docs.defenseunicorns.com/cli/getting-started/installation/
brew install defenseunicorns/tap/uds
brew install defenseunicorns/tap/zarf

# A local cluster for the demo
kind create cluster --name szl-mesh
```

### 1. (§06 step 1 — 3 min) Install UDS and verify the install

Run the canonical install command from
`docs.defenseunicorns.com/cli/getting-started/installation/`
(see `_sources/uds-cli-install.html`). No SZL code in the loop yet —
this proves the operator workflow.

```sh
uds version
zarf version
```

### 2. Build the three Zarf packages

From the parent `szl-holdings/` directory:

```sh
( cd a11oy/deploy  && zarf package create . --confirm )
( cd sentra/deploy && zarf package create . --confirm )
( cd amaru/deploy  && zarf package create . --confirm )
```

This produces three `zarf-package-<name>-amd64-1.0.0-alpha.tar.zst`
artifacts. In production these are pushed to
`ghcr.io/szl-holdings/packages/<name>` via `zarf package publish`.

### 3. Build the bundle

As shipped, `uds-bundle.yaml` references the three packages by their
published OCI coordinates (`ghcr.io/szl-holdings/packages/<name>`).
You have two options:

**Option A — published packages (production / post-publish path):**

```sh
# Prereq: run `zarf package publish` for each .tar.zst from step 2 first.
( cd ../a11oy/deploy  && zarf package publish zarf-package-a11oy-amd64-1.0.0-alpha.tar.zst   oci://ghcr.io/szl-holdings/packages )
( cd ../sentra/deploy && zarf package publish zarf-package-sentra-amd64-1.0.0-alpha.tar.zst oci://ghcr.io/szl-holdings/packages )
( cd ../amaru/deploy  && zarf package publish zarf-package-amaru-amd64-1.0.0-alpha.tar.zst  oci://ghcr.io/szl-holdings/packages )

uds-cli bundle create . --confirm
```

**Option B — local demo (no GHCR round-trip, use this for Warhacker dry-runs):**

Swap each package entry's `repository` + `ref` for a `path:` pointing
at the sibling `deploy/` directory, e.g.:

```yaml
packages:
  - name: a11oy
    path: ../a11oy/deploy
  - name: sentra
    path: ../sentra/deploy
  - name: amaru
    path: ../amaru/deploy
```

Then:

```sh
uds-cli bundle create . --confirm
```

Either option produces `uds-bundle-szl-mesh-amd64-0.1.0.tar.zst` —
the single artifact handed to operators (or to Andrew on a USB stick).

### 4. Deploy the bundle into the kind cluster

```sh
uds-cli bundle deploy uds-bundle-szl-mesh-amd64-0.1.0.tar.zst --confirm
```

Expected end-state — three healthy namespaces:

```sh
kubectl get pods -n a11oy
kubectl get pods -n sentra
kubectl get pods -n amaru
```

All three deployments should reach `Ready 1/1` within ~60s on a stock
kind cluster.

### 5. (§06 step 2 — 5 min) Drive the A11oy proof ledger

```sh
kubectl port-forward -n a11oy svc/a11oy 8080:80
# In another shell:
a11oy-code "summarize the doctrine floors"
# Then in the /chat UI: "replay the last /code session"
```

A11oy's proof-ledger PVC (`a11oy-proof-ledger`) persists
`/var/lib/a11oy/proof.jsonl` across restarts so the §06 step-5 USB
hand-off works without re-running the demo.

### 6. (§06 step 3 — 8 min) Sentra posture API — live read

```sh
kubectl port-forward -n sentra svc/sentra 8080:80
curl -s http://localhost:8080/api/sentra/posture | jq .
```

### 7. (§06 step 4 — 6 min) Amaru replay-bound sync

```sh
kubectl port-forward -n amaru svc/amaru 8080:80
# Trigger a sync; re-run and verify the hash chain matches byte-for-byte.
```

### 8. (§06 step 5 — 5 min) Hand Andrew the bundle + attestations

```sh
uds-cli bundle inspect uds-bundle-szl-mesh-amd64-0.1.0.tar.zst
# Then copy the bundle + ../../a11oy/deploy/attestations.jsonl to USB.
```

### 9. Tear down

```sh
uds-cli bundle remove uds-bundle-szl-mesh-amd64-0.1.0.tar.zst --confirm
kind delete cluster --name szl-mesh
```

## Status notes

- Steps 0–4 are the contract for "Done looks like" in Plane 1. They
  require `uds-cli`, `zarf`, and `kind` on the operator's machine —
  none of which run inside the Replit container. Validation against a
  real kind cluster is performed off-platform on a workstation with
  those tools installed; the manifests here are static Kubernetes YAML
  with no Replit-specific assumptions.
- Steps 5–8 are the §06 Warhacker demo overlay; they assume the same
  binaries used in the existing local dev workflow
  (`tools/a11oy-code/`, etc.).
- The `a11oy-attestations` component is marked `optional` in
  `uds-bundle.yaml` so operators who do not need the in-bundle
  hash-chained sidecar can opt out without forking the bundle.
