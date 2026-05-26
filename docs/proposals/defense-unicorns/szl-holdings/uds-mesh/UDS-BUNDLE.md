# szl-mesh — UDS bundle reference

## Composition

`szl-mesh` is a top-level UDS bundle composing three Zarf packages:

| Package | Source | What it provides |
| ------- | ------ | ---------------- |
| `a11oy` | `ghcr.io/szl-holdings/packages/a11oy:1.0.0-alpha` | Governed agentic execution fabric. Policy gates, signal mesh, proof ledger, Λ-9 invariant runtime. |
| `sentra` | `ghcr.io/szl-holdings/packages/sentra:1.0.0-alpha` | Cyber Resilience Command. Payload-anchored financial-exposure model, posture API, incident command surface. |
| `amaru` | `ghcr.io/szl-holdings/packages/amaru:1.0.0-alpha` | Replay-bound sync engine with append-only hash-chained delta-log. |

## Variants

| File | Use |
| ---- | --- |
| `uds-bundle.yaml` | Registry path — pulls packages from GHCR by ref. Use this once your environment can reach `ghcr.io/szl-holdings/packages/*`. |
| `uds-bundle.local.yaml` | Local-build path — references the sibling `deploy/` directories via `path:`. Use this on the demo bench, in an air-gapped lab, or in CI. No GHCR round-trip. |

## Build

```bash
# Demo-day / offline:
uds bundle create . --confirm --config uds-bundle.local.yaml

# Production / downstream adopters:
uds bundle create . --confirm
```

Both produce a single deterministic tarball:
`uds-bundle-szl-mesh-amd64-0.1.0.tar.zst`.

The released asset `szl-mesh-uds-0.1.0.tar.zst` is the local-build
variant, renamed for the asset list convention (matches sibling
SZL releases like `a11oy-uds-0.1.0.tar.zst`).

## Attestations sidecar

`a11oy` exposes the proof-ledger as `optionalComponents:
- a11oy-attestations`. When deployed it mounts `attestations.jsonl`
at `/uds-bundle/attestations.jsonl` for offline verification, per
§05 Fix A of the mesh plan.

## CI

- `.github/workflows/uds-bundle-smoke.yml` — build + kind-cluster
  deploy smoke on every PR.
- `.github/workflows/uds-bundle-publish.yml` — sign + publish on
  `uds-v*.*.*` tag.

## Authoring

Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings.
