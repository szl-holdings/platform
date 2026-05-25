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
The three packages at `1.0.0-alpha` have been published to GHCR, so
**Option A is now the default path** — an operator with only `uds-cli`
on their workstation can build the bundle straight from this directory
without any local-path edits. Option B is retained for offline demo
work and for iterating on a package before re-publishing.

**Option A — published packages (default, production path):**

```sh
# Packages are already published at ghcr.io/szl-holdings/packages/{a11oy,sentra,amaru}:1.0.0-alpha.
# To republish (e.g. after a package edit), run the three publish lines first:
# ( cd ../a11oy/deploy  && zarf package publish zarf-package-a11oy-amd64-1.0.0-alpha.tar.zst   oci://ghcr.io/szl-holdings/packages )
# ( cd ../sentra/deploy && zarf package publish zarf-package-sentra-amd64-1.0.0-alpha.tar.zst oci://ghcr.io/szl-holdings/packages )
# ( cd ../amaru/deploy  && zarf package publish zarf-package-amaru-amd64-1.0.0-alpha.tar.zst  oci://ghcr.io/szl-holdings/packages )

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

## Off-platform validation (`preflight.sh`)

Steps 2–4 above are bundled into a single one-shot script,
[`preflight.sh`](./preflight.sh), so the off-platform validation is
push-button on a workstation that has `zarf`, `uds`, `kind`, and
`kubectl` installed:

```sh
cd docs/proposals/defense-unicorns/szl-holdings/uds-mesh
./preflight.sh                # full: static checks + build + kind deploy + Ready wait + teardown
./preflight.sh --static       # static-only (safe inside Replit; what CI runs)
./preflight.sh --keep         # keep the kind cluster + artifacts for poking
```

The script:

1. Parses every YAML (bundle + 3 zarf.yaml + all manifests).
2. Confirms every file referenced from a `zarf.yaml` component
   (`manifests:` and `files:`) exists on disk.
3. Confirms the bundle's package names match the on-disk
   `metadata.name` of each Zarf package.
4. If `--static` is not passed, builds the three Zarf packages with
   `zarf package create`, builds the bundle with `uds bundle create`
   (rewritten to use sibling `path:` entries so no GHCR round-trip is
   needed), spins up a throwaway `kind` cluster, deploys the bundle,
   and waits for `kubectl rollout status` on each namespace.
5. Tears down the cluster + temp artifacts on exit (unless `--keep`).

The static portion (steps 1–3) is what we run inside Replit; it passes
for the current bundle. The live portion (step 4) requires the four
CLIs and a workstation Docker daemon, so it is gated on tool presence
and intended to be run before the Warhacker demo.

## Status notes

- Steps 0–4 in the walk-through are the contract for "Done looks like"
  in Plane 1. They require `uds-cli`, `zarf`, and `kind` on the
  operator's machine — none of which run inside the Replit container.
  Validation against a real kind cluster is performed off-platform on
  a workstation with those tools installed; the manifests here are
  static Kubernetes YAML with no Replit-specific assumptions. Use
  `preflight.sh` (above) to drive that validation in one command.
- Steps 5–8 are the §06 Warhacker demo overlay; they assume the same
  binaries used in the existing local dev workflow
  (`tools/a11oy-code/`, etc.).
- The `a11oy-attestations` component is marked `optional` in
  `uds-bundle.yaml` so operators who do not need the in-bundle
  hash-chained sidecar can opt out without forking the bundle.
