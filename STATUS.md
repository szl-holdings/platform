# STATUS.md — SZL Holdings monorepo: live vs experimental vs deprecated

> Doctrine v11 LOCKED — **749 declarations / 14 unique axioms / 163 sorries** (locked `c7c0ba17`).
> Λ = Conjecture 1 (NOT a theorem). SLSA L1 (honest).

## Substrate packages (`packages/`)

| Package | Status | Notes |
|---------|--------|-------|
| wire-d | **LIVE** | SSE provenance wire shipped to the live flagships |
| puriq-os | **LIVE** | organ loop + Yuyay-13 gate + Λ aggregator |
| formula-os | **LIVE** | formula registry + prover + citation tracker |
| khipu-os | **LIVE** | Merkle DAG + Reed-Solomon erasure |
| khipu-lmdb | **LIVE** | durable LMDB backend; `lmdb` runtime dep |
| kipu-qillqaq | **LIVE** | tuple-space substrate; `pool.py` completed this session |
| unay | **LIVE** | sqlite memory; honest `cosine-fallback` when sqlite-vss absent |
| ayni-os | **LIVE** | event-sourced reciprocity ledger |
| hatun-mcp | **LIVE** | MCP server (SSE + HTTP) |
| edge-organs | **EXPERIMENTAL** | wasi-rikuq imports optional `szl_khipu` DAG backend lazily at deploy |
| live-wires | **LIVE** | 3D wire viewer on the live flagships |
| mobile-controls | **LIVE** | console touch controls / viz patch |
| rosie-v3 | **LIVE** | operator-console companion |
| wayra | **EXPERIMENTAL** | always-learning ingestion; source set evolving |

## Flagship deploy repos (HF Spaces)
| Repo | Status | Substrate sourcing |
|------|--------|--------------------|
| a11oy | **LIVE** | vendors substrate locally; sync-from-monorepo tooling landed 2026-07-14 (a11oy#920) |
| killinchu | **LIVE** | vendors szl_dsse / szl_provenance / live_wires; sync tooling landed 2026-07-14 (killinchu#220) |

> **Retired flagships (honest consolidation, July 2026):** amaru, sentra, rosie — GitHub repos and
> HF Spaces removed (404s verified 2026-07-14). This table lists live flagships only.

> **Landed 2026-07-14** (a11oy#920, killinchu#220): `scripts/sync_from_monorepo.sh` +
> pinned `vendor.manifest.json` shipped to both live flagships (byte-identical mapping at platform@e87ad75ec8e2).
> Remaining halves, tracked in each PR: apply attribution headers via `sync` in a normal window, and move
> `scripts/vendor-sync-check.workflow.yml` into `.github/workflows/` (automation token lacks the workflow scope).

## Standalone repos
| Class | Repos |
|-------|-------|
| Artifact (proof/paper) | lutar-lean, ouroboros-thesis, ayni-os-thesis, puriq-preprint, prior-art-disclosures, investor-public-summary |
| Static Spaces mirror | khipu-constellation, doctrine-cathedral, llm-router-live, anatomy-3d, rosie-3d, lean-kernel, uds-demo |
| Public site | customer-portal, founder-page, docs-site, status |
| Ops | hatun-mcp, uds-bundles, compliance-posture, developers, otel-collector |

---
Apache-2.0. Signed: Yachay &lt;yachay@szlholdings.dev&gt; · Co-Authored-By: Perplexity Computer Agent.
