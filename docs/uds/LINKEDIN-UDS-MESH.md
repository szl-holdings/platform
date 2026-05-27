# LinkedIn — SZL UDS Mesh Drop (Defense-Unicorns facing, exhaustive)

> Paste-ready. Defense-Unicorns operator audience. Mesh-forward.
> Five signed bundles. One read-only registry feed. One pull-verify-install
> contract. Repos linked. No marketing.

---

## Post

**SZL Holdings — UDS bundle mesh, v0.2.0 — live on GHCR**

We just dropped five signed Zarf payloads + a read-only mesh registry feed
for **Defense-Unicorns (UDS)** environments. Same pull-verify-install
contract across every bundle. One machine-readable feed so downstream UDS
gateways, CI runners, and other mesh nodes discover current `oci://`
coordinates without scraping markdown. Cosign-keyless via GitHub Actions
OIDC. Air-gap-compatible from day one.

If you're standing up a UDS-enabled cluster — connected, edge, or fully
disconnected — you can pull the entire fleet today and have it deployed
before your next stand-up.

---

### The five bundles (all v0.2.0, all signed, all deterministic)

| # | Bundle | What runs on the node | OCI release coordinates | Stages under |
| - | --- | --- | --- | --- |
| 1 | **A11oy** — brand orchestration layer | `@a11oy/core` + `@a11oy/connection` kernels · optional hash-chained `a11oy-attestations` component for offline provenance without a transparency-log round-trip | `oci://ghcr.io/szl-holdings/a11oy-uds:0.2.0` | `/opt/a11oy/` |
| 2 | **Amaru** — Andean Ouroboros convergent data-sync | Doctrine V6 runtime: Lutar Σ family, Λ floor, Bekenstein admission, bounded-loop convergence, KL drift, hash-chained proof receipts | `oci://ghcr.io/szl-holdings/amaru-uds:0.2.0` | `/opt/amaru/` |
| 3 | **ROSIE** — governed decision fabric | Policy admission, contradiction detection, governed-action emit, hash-chained decision receipts | `oci://ghcr.io/szl-holdings/rosie-uds:0.2.0` | `/opt/rosie/` |
| 4 | **Sentra** — cyber resilience command | Asset-scoped fail-closed Safety Gate · NIST CSF 2.0 + SP 800-61r2 + CISA CIRCIA + MITRE D3FEND mappings · risk/exposure/drift/Ising allocation · hash-chained Proof Chain | `oci://ghcr.io/szl-holdings/sentra-uds:0.2.0` | `/opt/sentra/` |
| 5 | **Vessels** — maritime intelligence | CPA (Bowditch) trajectory inspector · collision cone · AIS-gap dark-vessel detector (Doctrine V6 Λ-floor 0.90) · sanctions screen · voyage Λ-receipts | `oci://ghcr.io/szl-holdings/vessels-uds:0.2.0` | `/opt/vessels/` |

Every bundle also ships an unsigned **dev channel** that tracks `main`:
`oci://ghcr.io/szl-holdings/<bundle>-uds:dev`. Release-channel images are
the only ones signed — by design.

---

### The universal three-step contract (one shape, five bundles)

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
```

No bespoke installer. No per-environment glue. No bundle has a private
opinion about the others.

---

### The mesh registry — read-only, machine-readable, live

The whole fleet is exposed on the mesh api-server so downstream
Defense-Unicorns gateways, mesh nodes, and CI runners can discover current
pull coordinates + cosign identity regex without scraping this post:

```bash
# Full fleet — versions, OCI coords, cosign identity regex, install paths, build commands
curl https://<mesh-host>/api/uds/registry

# Single bundle
curl https://<mesh-host>/api/uds/registry/vessels
```

Returns: `schemaVersion`, `generatedAt`, the canonical doc pointer,
universal pull/verify/install templates, the shared-package list, and every
bundle entry. **Read-only by design** — there is no `POST /api/uds/registry`
path. Bundles register at publish time via the per-bundle GitHub Actions
workflow, which is also the workflow whose identity cosign verifies
against. That invariant is the trust anchor; we will not weaken it.

Source of truth: `artifacts/api-server/src/routes/uds-registry.ts`
Canonical doc (mirrored 1:1 by the feed): `docs/uds/REGISTRY.md`

---

### Repos — pull source, build yourself, audit anything

| Repo | What lives there |
| --- | --- |
| **`github.com/szl-holdings/szl`** | The canonical monorepo: every bundle source, every shared package, the mesh api-server, the publish workflows, the verifier scripts, doctrine docs. |
| **`github.com/szl-holdings/.github`** | Reusable composite Actions + the OIDC-bound publish workflows whose identity cosign pins. Auditable from the outside. |
| **`ghcr.io/szl-holdings/<bundle>-uds`** | The signed OCI images. Five repos, one per bundle. |

Per-bundle source directories in the monorepo:

- `artifacts/a11oy-uds/` — README · `scripts/build.sh` · `scripts/verify-manifest.mjs` · `scripts/verify-attestations.mjs`
- `artifacts/amaru-uds/` — README · `scripts/build.sh` · `scripts/verify-manifest.mjs`
- `artifacts/rosie-uds/` — README · `scripts/build.sh` · `scripts/verify-manifest.mjs`
- `artifacts/sentra-uds/` — README · `scripts/build.sh` · `scripts/verify-manifest.mjs`
- `artifacts/vessels-uds/` — README · `scripts/build.sh` · `scripts/verify-manifest.mjs`

Per-bundle publish workflows (the GitHub Actions whose OIDC identity cosign
binds to):

- `.github/workflows/a11oy-uds-publish.yml`
- `.github/workflows/amaru-uds-publish.yml`
- `.github/workflows/rosie-uds-publish.yml`
- `.github/workflows/sentra-uds-publish.yml`
- `.github/workflows/vessels-uds-publish.yml`

Build any bundle locally — output lands in `dist/<bundle>-uds/`:

```bash
git clone https://github.com/szl-holdings/szl.git
cd szl
pnpm install --frozen-lockfile

pnpm --filter @szl/amaru-uds   run build
pnpm --filter @szl/rosie-uds   run build
pnpm --filter @szl/sentra-uds  run build
pnpm --filter @szl/vessels-uds run build
pnpm --filter @workspace/a11oy-uds run build    # a11oy uses @workspace/ scope
```

To sign your local build with our dev cosign keypair:

```bash
COSIGN_KEY=.local/cosign/cosign.key COSIGN_PASSWORD="" \
  pnpm --filter @szl/<bundle>-uds run build
```

---

### Shared SZL packages baked into every bundle (v0.2 payload)

Staged into `build/shared/` on every bundle via
`scripts/release/lib/stage-v2-packages.sh` — one helper, walker + tar-fallback
parity, MANIFEST-bound, attestation-chain-bound (a11oy):

- **`@szl-holdings/perception-loop`** — operator-loop perception envelope for real-time sensing. Privacy invariant enforced by a serialization test: raw frame bytes never appear in the envelope. Feature-vector summaries cross only.
- **`@szl-holdings/sequence-pipeline`** — multi-stage hashed evidence pipeline for data integrity (peak detector + reviewer-presence signals mixed into AMI N/D with max() and G with a multiplicative damper — never overwritten).
- **`@szl-holdings/sparse-attention-kit`** — sparse envelope + **12 receipt classes** with contradiction-probe + fail-up-to-full escalation. Hybrid-sparse wins benchmarks but loses multi-hop reasoning at scale; absorption is non-negotiably gated by the probe.

**Coming in v0.3:** `@szl-holdings/memo-reflection-kit` — MeMo / arXiv
2605.15156 absorption. Reflection memory with content-addressed receipts,
mandatory Stage1↔Stage2 contradiction-pair escalation, span-hash-only
privacy invariant. Already live on the mesh api-server under `/api/memo/*`;
joins the bundle payload at v0.3.

---

### Air-gap path (the reason this whole thing exists)

Every release also attaches the raw `*.tar.zst`, `*.sig`, and `*.sha256`
sidecars to the matching GitHub Release. Air-gapped operators:

1. Fetch tarball + sidecars over HTTP from the GitHub Release
2. Verify offline against the per-file `MANIFEST.json`
3. `zarf package deploy <local-path> --confirm` — no GHCR reach-out needed

Per-file integrity post-unpack:

```bash
node artifacts/<bundle>-uds/scripts/verify-manifest.mjs /path/to/unpacked
```

A11oy additionally ships hash-chained `ATTESTATIONS.json` so operators can
verify provenance offline without a Rekor transparency-log round-trip:

```bash
node artifacts/a11oy-uds/scripts/verify-attestations.mjs /path/to/unpacked
```

---

### Build prerequisites (operator side)

| Tool     | Min version | Required for                            |
| -------- | ----------- | --------------------------------------- |
| `node`   | 18+         | Manifest generation + verification      |
| `tar`    | any         | Fallback packaging when `zarf` missing  |
| `zstd`   | any         | Fallback packaging when `zarf` missing  |
| `zarf`   | 0.36+       | Native Zarf package create / deploy     |
| `cosign` | 2+          | Signing (only when `COSIGN_KEY` is set) |

---

### Doctrine guarantees — the things we will not break

- **Deterministic** — rebuild the same SHA → byte-for-byte the same tarball. Cold-cache rebuilds verify against the original `.sha256`.
- **Strict by default** — builds run `tsc` and refuse to ship if any package built empty. Dev-only source fallback is clearly marked in the manifest (`sourcePackaged: true`) and is never used for release.
- **Content-addressed** — every file in every bundle has a `sha256` line in `MANIFEST.json`. A11oy additionally ships an optional hash-chained `ATTESTATIONS.json` for offline provenance.
- **Read-only mesh registration** — bundles cannot self-register at runtime. The only path onto the registry is through the per-bundle GitHub Actions publish workflow, which is the same workflow whose identity cosign verifies against.
- **One contract, five bundles** — adding a sixth bundle does not change the pull-verify-install shape. New bundles inherit the contract, not the other way around.

---

### Why this matters for UDS / Defense-Unicorns operators

- You get a **single discovery feed** for the whole SZL fleet — wire it into your gateway or CI once, never scrape again.
- You get **keyless cosign verification pinned to a workflow identity** — the trust anchor is GitHub OIDC, not a long-lived key sitting on someone's laptop.
- You get **air-gap parity** — the same bytes that GHCR serves are attached to the GitHub Release, MANIFEST.json walks every file, attestations chain on a11oy.
- You get **doctrine-bound runtimes** — every bundle ships a Λ-receipt or Proof-Chain trail by default; nothing on the node runs without writing what it did.
- You get **source you can audit** — full monorepo public, per-bundle dirs, per-bundle publish workflows, verifier scripts you can read in fifteen minutes.

Pull the registry feed. Pull a bundle. Verify it. Deploy it. If anything
in those four steps surprises you, that is a bug — open an issue.

---

#DefenseUnicorns #UDS #Zarf #Cosign #Sigstore #SupplyChainSecurity
#SLSA #SBOM #AirGap #GHCR #OIDC #ZeroTrust #ICS #OT #MeshGateway
