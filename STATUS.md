# STATUS.md — SZL Holdings monorepo: live vs experimental vs deprecated

> Doctrine v11 LOCKED — **749 declarations / 14 unique axioms / 163 sorries** (locked `c7c0ba17`).
> Λ = Conjecture 1 (NOT a theorem). SLSA L1 (honest).

## Substrate packages (`packages/`)

| Package | Status | Notes |
|---------|--------|-------|
| wire-d | **LIVE** | SSE provenance wire shipped to 4 flagships |
| puriq-os | **LIVE** | organ loop + Yuyay-13 gate + Λ aggregator |
| formula-os | **LIVE** | formula registry + prover + citation tracker |
| khipu-os | **LIVE** | Merkle DAG + Reed-Solomon erasure |
| khipu-lmdb | **LIVE** | durable LMDB backend; `lmdb` runtime dep |
| kipu-qillqaq | **LIVE** | tuple-space substrate; `pool.py` completed this session |
| unay | **LIVE** | sqlite memory; honest `cosine-fallback` when sqlite-vss absent |
| ayni-os | **LIVE** | event-sourced reciprocity ledger |
| hatun-mcp | **LIVE** | MCP server (SSE + HTTP) |
| edge-organs | **EXPERIMENTAL** | wasi-rikuq imports optional `szl_khipu` DAG backend lazily at deploy |
| live-wires | **LIVE** | 3D wire viewer on all 5 flagships |
| mobile-controls | **LIVE** | console touch controls / viz patch |
| rosie-v3 | **LIVE** | operator-console companion |
| wayra | **EXPERIMENTAL** | always-learning ingestion; source set evolving |

## Flagship deploy repos (HF Spaces)
| Repo | Status | Substrate sourcing |
|------|--------|--------------------|
| a11oy | **LIVE** | vendors substrate locally; sync-from-monorepo script NOT yet added (see ledger) |
| amaru | **LIVE** | vendors szl_dsse / szl_provenance / szl_unay / szl_khipu_lmdb / live_wires |
| sentra | **LIVE** | vendors same core substrate set as amaru |
| rosie | **LIVE** | vendors substrate; operator console |
| killinchu | **LIVE** | vendors szl_dsse / szl_provenance / live_wires |

> **Open action (tracked, not yet executed — flagships are audit-only during sibling-agent windows):**
> add `scripts/sync_from_monorepo.sh` + vendor-attribution headers to each flagship so the
> monorepo is the explicit source of truth for every vendored file.

## Standalone repos
| Class | Repos |
|-------|-------|
| Artifact (proof/paper) | lutar-lean, ouroboros-thesis, ayni-os-thesis, puriq-preprint, prior-art-disclosures, investor-public-summary |
| Static Spaces mirror | khipu-constellation, doctrine-cathedral, llm-router-live, anatomy-3d, rosie-3d, lean-kernel, uds-demo |
| Public site | customer-portal, founder-page, docs-site, status |
| Ops | hatun-mcp, uds-bundles, compliance-posture, developers, otel-collector |

---
Apache-2.0. Signed: Yachay &lt;yachay@szlholdings.dev&gt; · Co-Authored-By: Perplexity Computer Agent.
