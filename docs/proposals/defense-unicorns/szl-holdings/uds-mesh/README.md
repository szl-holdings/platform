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

Two bundle files live in this directory:

- **`uds-bundle.local.yaml`** — *demo default.* Each package entry uses
  `path: ../<app>/deploy`, so `uds-cli bundle create` builds the three
  Zarf packages locally at bundle-build time. **No GHCR round-trip and
  no published-package dependency.** This is what the Andrew demo and
  the Warhacker dry-runs use.
- **`uds-bundle.yaml`** — *production path.* References the three
  packages by their OCI coordinates
  (`ghcr.io/szl-holdings/packages/{a11oy,sentra,amaru}:1.0.0-alpha`).
  Use this once the packages have been published — i.e. for downstream
  adopters pulling the bundle from a registry rather than building from
  source.

**Demo path (default — local build, what we run for Andrew):**

```sh
uds-cli bundle create . -f uds-bundle.local.yaml --confirm
```

**Production path (published packages on GHCR):**

```sh
# Pre-req: the three packages are published — and signed — at
#   ghcr.io/szl-holdings/packages/{a11oy,sentra,amaru}:1.0.0-alpha
# To (re)build, sign, and publish, build each package first then:
# export COSIGN_PASSWORD=...    # password for the cosign signing key
# ( cd ../a11oy/deploy  && zarf package publish zarf-package-a11oy-amd64-1.0.0-alpha.tar.zst   oci://ghcr.io/szl-holdings/packages --signing-key ../../uds-mesh/cosign.key )
# ( cd ../sentra/deploy && zarf package publish zarf-package-sentra-amd64-1.0.0-alpha.tar.zst oci://ghcr.io/szl-holdings/packages --signing-key ../../uds-mesh/cosign.key )
# ( cd ../amaru/deploy  && zarf package publish zarf-package-amaru-amd64-1.0.0-alpha.tar.zst  oci://ghcr.io/szl-holdings/packages --signing-key ../../uds-mesh/cosign.key )
# In CI, the GitHub Actions workflow (see .github/workflows/zarf-publish.yml)
# materializes the PEM from the ZARF_COSIGN_PRIVATE_KEY secret into a
# 0600 cosign.key file inside ${GITHUB_WORKSPACE} and passes that path
# to --signing-key, then shreds it on exit.

uds-cli bundle create . --confirm   # uses uds-bundle.yaml
```

**Operator-side signature verification.**

The public half of the signing key lives in this directory as
[`cosign.pub`](./cosign.pub). The same `--key cosign.pub` flag works
both online (against an OCI ref) and fully offline (against a tarball
on a USB stick), which is what makes the §05 Fix A offline story hold:
once the bundle is on the operator's workstation, GHCR is no longer
in the loop.

```sh
# OFFLINE — air-gapped / USB hand-off path. No network required after
# the tarball is on disk. This is the canonical §05 Fix A flow.
zarf package inspect zarf-package-a11oy-amd64-1.0.0-alpha.tar.zst  --key cosign.pub
zarf package inspect zarf-package-sentra-amd64-1.0.0-alpha.tar.zst --key cosign.pub
zarf package inspect zarf-package-amaru-amd64-1.0.0-alpha.tar.zst  --key cosign.pub

uds-cli bundle inspect uds-bundle-szl-mesh-amd64-0.1.0.tar.zst --key cosign.pub
uds-cli bundle deploy  uds-bundle-szl-mesh-amd64-0.1.0.tar.zst --key cosign.pub --confirm

# ONLINE — when the operator pulls straight from GHCR. Same key, same
# command shape; only the source changes.
zarf package inspect oci://ghcr.io/szl-holdings/packages/a11oy:1.0.0-alpha   --key cosign.pub
zarf package inspect oci://ghcr.io/szl-holdings/packages/sentra:1.0.0-alpha --key cosign.pub
zarf package inspect oci://ghcr.io/szl-holdings/packages/amaru:1.0.0-alpha  --key cosign.pub

uds-cli bundle create . --confirm --key cosign.pub          # uses uds-bundle.yaml
```

The pinned digests in `uds-bundle.yaml` still bind the bundle to
specific package contents; the cosign signature additionally proves
who produced them.

If a package was published without a signature, `zarf package inspect
--key` exits non-zero with `package is not signed - verification cannot
be performed`. Treat that as a release-blocker, not a warning.

**Provisioning / rotating the signing key.**

`cosign.pub` here is the production public key. The matching private
key is **never** committed; it lives only as the GitHub Actions secret
`ZARF_COSIGN_PRIVATE_KEY` (PEM contents) plus `COSIGN_PASSWORD` (empty
string for an unencrypted PEM, or the chosen passphrase for a
cosign-encrypted PEM). To rotate:

```sh
# Generates cosign.key (private, do not commit) and cosign.pub (public).
# Prompts twice for a passphrase; press Enter for an unencrypted PEM.
cosign generate-key-pair

# Commit the new public key, then upload the new private key + password
# to the szl-holdings/uds-mesh repo secrets:
#   gh secret set ZARF_COSIGN_PRIVATE_KEY < cosign.key
#   gh secret set COSIGN_PASSWORD --body "<passphrase or empty>"
# Then shred the local cosign.key so the only surviving copy is the
# encrypted GitHub secret:
shred -u cosign.key
```

The companion CI workflow,
[`.github/workflows/zarf-publish.yml`](../../../../../.github/workflows/zarf-publish.yml),
consumes those two secrets and re-publishes signed packages on every
tag matching `uds-mesh-v*`.

Either path produces `uds-bundle-szl-mesh-amd64-0.1.0.tar.zst` —
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
   against `uds-bundle.local.yaml` (sibling `path:` entries — no GHCR
   round-trip), spins up a throwaway `kind` cluster, deploys the
   bundle, and waits for `kubectl rollout status` on each namespace.
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
