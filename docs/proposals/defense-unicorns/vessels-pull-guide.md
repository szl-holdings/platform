# Vessels.UDS — Pull Guide for UDS Operators

> **Audience:** Defense-Unicorns release-gate operators integrating Vessels
> into a UDS mesh alongside A11oy, Sentra, and Amaru.
>
> **Bundle:** `artifacts/vessels-uds/` → `dist/vessels-uds/vessels-uds-<v>.tar.zst`
>
> **Mirror of:** the ROSIE / A11oy / Amaru pull-guide pattern, so the
> mesh gate can treat all four products with a single review checklist.

---

## 1. What you are pulling

`vessels-uds` ships the Vessels maritime-intelligence **kernel**, not the
Vessels web surface. It contains six primitives, each with a cited primary
source (see `docs/ARCHITECTURE.md` inside the bundle):

| Primitive                       | Used for                                      |
|--------------------------------|-----------------------------------------------|
| `haversineNm`                   | Range / chokepoint distances                  |
| `closestPointOfApproach`        | Two-vessel CPA under constant velocity        |
| `inCollisionCone`               | COLREGS Rule 7 risk-of-collision verdict      |
| `aisGapLambda`                  | Dark-vessel HALT verdict (Doctrine V6 Λ-floor) |
| `sanctionsScreen`               | OFAC / EU / UK / UN list match                |
| `appendReceipt` / `verifyChain` | Hash-chained voyage receipts (offline audit)  |

The bundle uses the **same** Λ-floor (`0.90`) and **same** receipt-chain shape
as Amaru.UDS, so the mesh-level HUKLLA gate is uniform across products.

---

## 2. Get the assets

```bash
BASE=https://github.com/szl-holdings/vessels/releases/download/uds-v0.1.0
curl -fsSLO $BASE/vessels-uds-0.1.0.tar.zst
curl -fsSLO $BASE/vessels-uds-0.1.0.tar.zst.sha256
curl -fsSLO $BASE/vessels-uds-0.1.0.tar.zst.sig         # optional, when signed
curl -fsSLO $BASE/vessels-uds-dev.pub                   # optional, when signed
curl -fsSLO $BASE/vessels-demo.mjs
```

If the release omits `.sig` / `.pub`, the build was emitted with the
**signature-skipped** warning (see `docs/SECURITY.md`); the `.sha256`
sidecar remains the integrity anchor.

---

## 3. Verify before deploy (always)

```bash
# 3a. tarball integrity
sha256sum -c vessels-uds-0.1.0.tar.zst.sha256

# 3b. signature (when available)
cosign verify-blob \
  --key vessels-uds-dev.pub \
  --signature vessels-uds-0.1.0.tar.zst.sig \
  vessels-uds-0.1.0.tar.zst

# 3c. inspect the Zarf package (no deploy)
zarf package inspect definition vessels-uds-0.1.0.tar.zst
zarf package inspect sbom       vessels-uds-0.1.0.tar.zst --output ./sbom-out
```

If any of 3a–3c fails, **do not deploy** — open a release-gate incident
and capture the failing artifact.

---

## 4. Smoke-test the kernel offline (~30s, no infra)

```bash
zstd -d vessels-uds-0.1.0.tar.zst -o pkg.tar
mkdir staged && tar -xf pkg.tar -C staged
for c in staged/components/*.tar; do tar -xf "$c" -C staged; done
node vessels-demo.mjs staged/vessels-core/files/0/lib
```

The harness exercises every primitive plus a 5-row synthetic-fixture
verdict table. Acceptance criterion: every line is `PASS` and the table
reports the expected `HALT` rows on sanctions-hit / AIS-gap fixtures.

---

## 5. Pull into a UDS mesh

Add Vessels to the parent `uds-bundle.yaml` alongside the other products:

```yaml
kind: UDSBundle
metadata:
  name: szl-mesh
  version: 0.1.0
packages:
  - name: a11oy
    repository: ghcr.io/szl-holdings/packages/a11oy
    ref: 1.0.0-alpha
    optionalComponents: [a11oy-attestations]
  - name: sentra
    repository: ghcr.io/szl-holdings/packages/sentra
    ref: 1.0.0-alpha
  - name: amaru
    repository: ghcr.io/szl-holdings/packages/amaru
    ref: 1.0.0-alpha
  - name: vessels
    repository: ghcr.io/szl-holdings/packages/vessels
    ref: 0.1.0
    optionalComponents: [vessels-docs]
```

For air-gap: swap `repository` + `ref` for `path: ./vessels-uds-0.1.0.tar.zst`.

Then:

```bash
uds-cli bundle create . --confirm
uds-cli bundle deploy uds-bundle-szl-mesh-amd64-0.1.0.tar.zst --confirm
uds-cli bundle inspect uds-bundle-szl-mesh-amd64-0.1.0.tar.zst
```

---

## 6. Post-deploy verification

```bash
# Files land under /opt/vessels/ on the target node.
ls -la /opt/vessels/{lib,docs,vessels-demo.mjs,MANIFEST.json}

# Re-run the harness against the deployed kernel.
node /opt/vessels/vessels-demo.mjs /opt/vessels/lib

# Re-run the manifest verifier in-place (every sha256 round-trips).
# The verifier auto-detects MANIFEST.json at either <root>/MANIFEST.json
# (deployed layout) or <root>/build/MANIFEST.json (source-tree layout).
node artifacts/vessels-uds/scripts/verify-manifest.mjs /opt/vessels
```

The deployed kernel must produce **identical** PASS lines to the
pre-deploy smoke test in §4. If the verdict table diverges, treat as
tamper and roll back.

---

## 7. Rollback

`vessels-uds` is stateless — there is no DB, no migration, no in-place
mutation. Rollback is a re-deploy of the previous tarball:

```bash
zarf package remove vessels-uds --confirm
zarf package deploy vessels-uds-<previous-version>.tar.zst --confirm
```

The Λ-receipt chain emitted by the previous version remains
offline-verifiable via `verifyChain` regardless of which kernel version
is currently deployed.

---

## 8. Where the source lives

| Artifact                         | Location                                                 |
|----------------------------------|----------------------------------------------------------|
| Bundle source                    | `artifacts/vessels-uds/`                                 |
| Kernel                           | `artifacts/vessels-uds/lib/index.mjs`                    |
| Demo harness                     | `artifacts/vessels-uds/vessels-demo.mjs`                 |
| Build / verify scripts           | `artifacts/vessels-uds/scripts/`                         |
| In-bundle docs                   | `artifacts/vessels-uds/docs/{ARCHITECTURE,SECURITY,UDS-BUNDLE,OPERATOR-QUICKSTART}.md` |
| Operator pull guide (this file)  | `docs/proposals/defense-unicorns/vessels-pull-guide.md`  |
| Web surface (not in this bundle) | `artifacts/vessels/`                                     |

---

## 9. Companion bundles

The Vessels pull guide is intentionally shaped like its siblings so the
release gate can run a single review:

* `artifacts/a11oy-uds/` — A11oy brand-orchestration runtime (Fisher /
  Bohr / KS-18 / POVM).
* `artifacts/sentra-uds/` — Sentra cyber-resilience runtime.
* `artifacts/amaru-uds/` — Amaru Doctrine V6 convergent-sync kernel.
* `artifacts/vessels-uds/` — *this bundle* — maritime intelligence kernel.

All four share the same Λ-floor, the same receipt-chain shape, and the
same `<tarball>.tar.zst` + `.sha256` + optional `.sig` shape.
