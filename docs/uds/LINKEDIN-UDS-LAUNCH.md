# LinkedIn — SZL UDS Bundle Launch (technical, exhaustive)

> Paste-ready. Five bundles. One pull-verify-install contract. One
> machine-readable registry. No marketing fluff.

---

## Post

**SZL Holdings — UDS bundle drop, v0.2.0**

We just shipped five signed Zarf payloads for **Defense-Unicorns (UDS)**
environments. Same pull-verify-install contract across the board, one
machine-readable registry, deterministic builds, dependency-free
kernels, cosign-keyless signing via GitHub Actions OIDC.

If you're standing up a UDS-enabled cluster — air-gap or connected — you
can pull the entire fleet today.

### The five bundles

| # | Bundle | What it runs | OCI release coordinates |
| - | --- | --- | --- |
| 1 | **A11oy** | Brand orchestration layer — @a11oy/core + @a11oy/connection, optional hash-chained attestations | `oci://ghcr.io/szl-holdings/a11oy-uds:0.2.0` |
| 2 | **Amaru** | Andean-Ouroboros convergent data-sync — Doctrine V6 (Lutar Σ, Λ floor, Bekenstein admission, bounded-loop convergence, KL drift, proof receipts) | `oci://ghcr.io/szl-holdings/amaru-uds:0.2.0` |
| 3 | **ROSIE** | Governed decision fabric — policy admission, contradiction detection, governed-action emit, hash-chained decision receipts | `oci://ghcr.io/szl-holdings/rosie-uds:0.2.0` |
| 4 | **Sentra** | Cyber-resilience command — asset-scoped fail-closed Safety Gate, NIST CSF 2.0 / SP 800-61r2 / CISA CIRCIA / MITRE D3FEND mappings, Ising allocation, Proof Chain | `oci://ghcr.io/szl-holdings/sentra-uds:0.2.0` |
| 5 | **Vessels** | Maritime intelligence — CPA (Bowditch), collision cone, AIS-gap dark-vessel detector (Doctrine V6 Λ-floor 0.90), sanctions screen, voyage Λ-receipts | `oci://ghcr.io/szl-holdings/vessels-uds:0.2.0` |

Every bundle also ships an unsigned **dev channel** that tracks `main`:
`oci://ghcr.io/szl-holdings/<bundle>-uds:dev`.

### The universal three-step contract

```bash
# 1. PULL
zarf package pull oci://ghcr.io/szl-holdings/<bundle>-uds:0.2.0

# 2. VERIFY  (release channel only — keyless cosign via GitHub OIDC)
cosign verify \
  --certificate-identity-regexp 'https://github.com/szl-holdings/.+/\.github/workflows/<bundle>-uds-publish\.yml@.+' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  ghcr.io/szl-holdings/<bundle>-uds:0.2.0

# 3. INSTALL
zarf package deploy zarf-package-<bundle>-uds-*.tar.zst --confirm
# Components stage under /opt/<bundle>/ on the target node.
```

That's it. No bespoke installer, no per-environment glue.

### Air-gap path

Every release also attaches the raw `*.tar.zst`, `*.sig`, and `*.sha256`
sidecars to the matching GitHub Release. Pull the tarball + sidecar by
HTTP, verify offline against the per-file `MANIFEST.json`, then deploy
via `zarf package deploy <path-to-local-tarball> --confirm` — no GHCR
reach-out required.

For per-file integrity post-unpack:

```bash
node artifacts/<bundle>-uds/scripts/verify-manifest.mjs /path/to/unpacked
```

### Source repos (build it yourself)

Whole monorepo:

```bash
git clone https://github.com/szl-holdings/szl.git
cd szl
pnpm install --frozen-lockfile
```

Build any bundle locally (output lands in `dist/<bundle>-uds/`):

```bash
pnpm --filter @szl/amaru-uds   run build
pnpm --filter @szl/rosie-uds   run build
pnpm --filter @szl/sentra-uds  run build
pnpm --filter @szl/vessels-uds run build
pnpm --filter @workspace/a11oy-uds run build   # a11oy uses @workspace/ scope
```

To sign your local build:

```bash
COSIGN_KEY=.local/cosign/cosign.key COSIGN_PASSWORD="" \
  pnpm --filter @szl/<bundle>-uds run build
```

Per-bundle source directories:

- `artifacts/a11oy-uds/`   — README + `scripts/build.sh` + `scripts/verify-manifest.mjs` + optional `scripts/verify-attestations.mjs`
- `artifacts/amaru-uds/`   — README + `scripts/build.sh` + `scripts/verify-manifest.mjs`
- `artifacts/rosie-uds/`   — README + `scripts/build.sh` + `scripts/verify-manifest.mjs`
- `artifacts/sentra-uds/`  — README + `scripts/build.sh` + `scripts/verify-manifest.mjs`
- `artifacts/vessels-uds/` — README + `scripts/build.sh` + `scripts/verify-manifest.mjs`

### Shared SZL packages baked into every bundle (v0.2 payload)

Staged into `build/shared/` via `scripts/release/lib/stage-v2-packages.sh`:

- `@szl-holdings/perception-loop` — operator-loop perception envelope
- `@szl-holdings/sequence-pipeline` — multi-stage hashed evidence pipeline
- `@szl-holdings/sparse-attention-kit` — sparse envelope + 12 receipt classes with contradiction-probe escalation

Coming in v0.3: `@szl-holdings/memo-reflection-kit` (MeMo / arXiv
2605.15156 absorption — reflection memory with content-addressed
receipts, mandatory Stage1↔Stage2 contradiction-pair escalation,
span-hash-only privacy invariant). Already live on the mesh api-server
under `/api/memo/*`.

### The mesh registry (machine-readable, live)

The whole fleet is exposed read-only on the mesh api-server, so
downstream gateways, CI runners, and other mesh nodes can discover
current `oci://` coordinates and the cosign identity regex without
scraping markdown:

```bash
# Full fleet
curl https://<mesh-host>/api/uds/registry

# Single bundle
curl https://<mesh-host>/api/uds/registry/vessels
```

Returns the canonical bundle list, per-bundle pull/verify/install
coordinates, the cosign certificate-identity regex needed for keyless
verification, and the shared-package manifest. Bundles register
themselves at publish time via GitHub Actions, not at runtime —
read-only by design.

The canonical doc (mirrored 1:1 by the API feed) lives at
`docs/uds/REGISTRY.md` in the monorepo.

### Build prerequisites (operator side)

| Tool     | Min version | Required for                            |
| -------- | ----------- | --------------------------------------- |
| `node`   | 18+         | Manifest generation + verification      |
| `tar`    | any         | Fallback packaging when `zarf` missing  |
| `zstd`   | any         | Fallback packaging when `zarf` missing  |
| `zarf`   | 0.36+       | Native Zarf package create / deploy     |
| `cosign` | 2+          | Signing (only when `COSIGN_KEY` is set) |

### Doctrine guarantees (what we will not break)

- **Deterministic**: rebuild the same SHA → byte-for-byte the same tarball.
- **Strict by default**: builds run `tsc` and refuse to ship if any
  package built empty. Dev-only source fallback exists and is clearly
  marked in the manifest (`sourcePackaged: true`) — never used for release.
- **Content-addressed**: every file in every bundle has a `sha256` line
  in `MANIFEST.json`. The A11oy bundle additionally ships an optional
  hash-chained `ATTESTATIONS.json` for offline provenance without a
  transparency-log round-trip.
- **Read-only mesh registration**: bundles cannot self-register at
  runtime. The only path onto the registry is through the per-bundle
  GitHub Actions publish workflow, which is the same workflow whose
  identity cosign verifies against.

---

#DefenseUnicorns #Zarf #UDS #Cosign #SupplyChainSecurity #Sigstore
#SLSA #SBOM #AirGap #GHCR
