# UDS Ecosystem Alignment Audit — 2026-06-13

**Author:** Forge (parallel dev, T001)
**Scope:** Prove the szl-holdings UDS estate (payload/bundles, mesh, fleet-overlay)
is provably aligned across GitHub + GHCR, and close the one concrete PR-time
coverage gap. **Additive only** — no published bundle version / `ref:` / digest
was changed; nothing referenced was deleted.

> Honesty floor (DOCTRINE v11): refs are labeled `reachable`/`unreachable`
> strictly on a real GHCR HTTP probe. SZL-owned unreachable = ERROR; external
> upstream unreachable = WARN (their retag/flavor lifecycle is out of our control).

---

## 1. Sweep result (live, read-only)

Org guard: `szl-holdings/.github` → `.github/scripts/bundle_ref_check.py`.

- **`--selftest`: PASS** — good ref `ghcr.io/szl-holdings/szl-receipts:0.4.0-upstream` → 200
  (expect reachable); known-bad Task #546 ref `ghcr.io/szl-holdings/packages/szl-receipts:0.3.1`
  → 404 (expect unreachable). The prober itself works.
- **Org sweep** (`GITHUB_TOKEN=$SZL_GITHUB_TOKEN python3 bundle_ref_check.py`):
  swept **28 public repos**, found **31** `kind: UDSBundle` YAMLs.

| metric | count |
|---|---|
| refs probed (GHCR) | 16 |
| reachable | 9 |
| unreachable — SZL-owned | 3 |
| unreachable — external | 4 |
| network/5xx | 0 |
| allowlisted | 3 |
| skipped (local `path:`/`oci://`) | 58 |

- **With the org allowlist (`.github/data/bundle_ref_allowlist.json`): exit 0 —
  every SZL-owned `repository`+`ref` resolves on GHCR.** The 3 owned-unreachable
  refs are the **intentionally-staged** mesh demo organs
  `ghcr.io/szl-holdings/packages/{a11oy,sentra,amaru}:1.0.0-alpha` (FA-001), each
  already allowlisted with a reason (deployable images are digest-pinned in
  `szl-uds-deployment`). These are NOT drift — do not "fix" them; remove the
  allowlist entry only when the mesh bundle is repointed or the image is published.
- The **4 external WARNs** are upstream Defense Unicorns / zarf-dev refs in the
  `v0.3.1-demo` staged mesh bundles
  (`ghcr.io/defenseunicorns/packages/init:v0.77.0`,
  `ghcr.io/defenseunicorns/packages/uds/core:0.34.0-slim-dev`). WARN by design —
  upstream lifecycle, not an SZL ownership failure.

---

## 2. Alignment matrix (GHCR-probed, owned + key external refs)

| repo | bundle (path) | bundle name / version | package → repository:ref | state |
|---|---|---|---|---|
| szl-fleet-overlay | `uds-bundle.yaml` | szl-fleet-overlay **0.1.0** | core → `ghcr.io/defenseunicorns/packages/uds/core:1.5.0-upstream` | **200** |
| szl-fleet-overlay | `uds-bundle.yaml` | szl-fleet-overlay 0.1.0 | szl-fleet-overlay → local `path: .` | skipped-local |
| szl-uds-deployment | `uds-bundle.yaml` | szl-receipts-bundle **0.4.0** | core-base → `…/uds/core-base:1.5.0-upstream` | **200** |
| szl-uds-deployment | `uds-bundle.yaml` | szl-receipts-bundle 0.4.0 | core-identity-authorization → `…/core-identity-authorization:1.5.0-upstream` | **200** |
| szl-uds-deployment | `uds-bundle.yaml` | szl-receipts-bundle 0.4.0 | init → `ghcr.io/zarf-dev/packages/init:v0.77.0` | **200** |
| szl-uds-deployment | `bundles/prove-organs/uds-bundle.yaml` | prove-organs | core-base / init (upstream) | **200** |
| szl-uds-deployment | `bundles/szl-warhacker/uds-bundle.yaml` | szl-warhacker | init → `ghcr.io/zarf-dev/packages/init:v0.77.0` | **200** |
| uds-bundles | `uds-bundle.yaml` / `mesh/uds-bundle.yaml` | szl-mesh **0.4.0** / **0.1.0 (staged)** | a11oy/sentra/amaru → `…/packages/*:1.0.0-alpha` | 404 (allowlisted, FA-001 staged) |
| uds-bundles | `mesh/bundles/v0.3.1-demo/uds-bundle.yaml` | szl-mesh demo | szl-receipts → `ghcr.io/szl-holdings/szl-receipts:0.4.0-upstream` | **200** |
| uds-bundles | `mesh/bundles/v0.3.1-demo/uds-bundle.yaml` | szl-mesh demo | init / core-slim-dev (upstream) | 404 (WARN, external) |
| uds-mesh | `uds-bundle.yaml` | szl-mesh **0.4.0** | (composed organs) | — |
| uds-mesh | `bundles/v0.3.1-demo/uds-bundle.yaml` | szl-mesh demo | szl-receipts:0.4.0-upstream **200**; init/core-slim-dev 404 (WARN) | mixed |

All other refs are local `path:`/`oci://` and are correctly **skipped** by the
guard (no registry round-trip).

---

## 3. Gap closed

**Finding:** `szl-fleet-overlay` ships a `kind: UDSBundle` (`uds-bundle.yaml`,
v0.1.0) + `uds-packages/*.yaml` but had **no per-repo bundle-ref-check workflow**
— it relied solely on the weekly org sweep. `uds-bundles`, `uds-mesh`, and
`szl-uds-deployment` each already carry the fail-fast per-repo caller.

**Fix (additive):** added `szl-fleet-overlay/.github/workflows/bundle-ref-check.yml`,
mirroring the canonical `uds-mesh` caller — delegates to the org reusable
`szl-holdings/.github/.github/workflows/reusable-bundle-ref-check.yml`, triggers
on PR/push of `**/uds-bundle.yaml` (+ the workflow itself), `secrets: inherit`.
The reusable is **SHA-pinned** to `.github` main
`6394f0cdc5ee54693af36efc25583b4ed4f18ae0` per the org `pin-check` rule (40-hex).

- Commit: `a93ad251e7f166cf7b7af2a121423e2d2f49199d` on `szl-fleet-overlay@main`.
- **Verification (STEP 3): the new "Bundle Reference Check" run on `a93ad251`
  concluded `success`** (run 27457704905-series); the repo's `Pin Check`,
  `Doctrine`, `Doctrine Overclaim Guard`, and `CI` were also green on the same
  commit — confirming the SHA-pin is compliant and nothing regressed. The
  fleet-overlay bundle's only owned ref is a local `path:` and its one external
  ref (`uds/core:1.5.0-upstream`) is reachable (200), so the guard is green for a
  real reason, not an allowlist suppression.

---

## 4. Intentional heterogeneity — DO NOT "fix"

These independent bundle versions are **by design** (separately versioned
artifacts, not drift). A future reader must not converge them:

- `szl-receipts` **0.4.0**
- `szl-uds-bundle` **0.3.0**
- `szl-full-stack` **0.3.1**
- `mesh` (`szl-mesh`) **0.4.0** (top-level); `uds-bundles/mesh` staged demo **0.1.0**
- `szl-fleet-overlay` **0.1.0**

Per DOCTRINE v11: never bump a version or change a `ref:`/digest on an
already-published, cosign-signed artifact — that breaks bundle-ref-check /
Version Coherence.

**HF parity:** GitHub↔Hugging Face module parity is already enforced by the org
**module-drift guard**; no action needed here.

---

## 5. Acceptance — met

- [x] Org sweep captured; selftest green; all SZL-owned refs reachable (exit 0
      with allowlist); 3 owned-404 are documented FA-001 staged (allowlisted),
      4 external-404 are upstream WARN.
- [x] `szl-fleet-overlay` now has a **green** per-repo bundle-ref-check.
- [x] Audit report committed (this file).
- [x] No version / `ref:` / digest of any published artifact changed; nothing
      referenced deleted.
