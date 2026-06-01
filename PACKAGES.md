# PACKAGES.md — SZL Holdings monorepo package index

This is the **source of truth** for reusable substrate packages. Flagship deploy repos
(`a11oy`, `amaru`, `sentra`, `rosie`, `killinchu`) and HF Spaces import or vendor from
here — they never own an independent fork. See `SOURCE_OF_TRUTH.md`.

> Doctrine v11 LOCKED — **749 declarations / 14 unique axioms / 163 sorries** (locked `c7c0ba17`).
> Λ = Conjecture 1 (NOT a theorem). SLSA L1 (honest). Reed-Solomon ≠ holographic; event-sourcing ≠ time travel.

## The 14 session-shipped substrate packages

| # | Package | PyPI name | Source dir | What it does | Live in (HF Spaces) |
|---|---------|-----------|-----------|--------------|---------------------|
| 1 | `packages/wire-d` | `szl-wire-d` | `wire_d/` | Wire-D: live provenance wire — SSE stream of DSSE-signed BOE receipts | a11oy, amaru, sentra, rosie |
| 2 | `packages/puriq-os` | `szl-puriq-os` | `puriq_os/` | PURIQ-OS: organ loop, Yuyay-13 gate, Λ aggregator, replay-hash | a11oy, amaru, sentra |
| 3 | `packages/formula-os` | `szl-formula-os` | `formula_os/` | Formula-OS: formula registry, evaluator, prover, citation tracker | a11oy, amaru, sentra, rosie |
| 4 | `packages/khipu-os` | `szl-khipu-os` | `khipu_os/` | Khipu-OS: Merkle DAG + Reed-Solomon erasure coding + verifier | a11oy |
| 5 | `packages/khipu-lmdb` | `szl-khipu-lmdb` | `khipu_lmdb/` | Khipu-LMDB: durable LMDB persistence backend for the receipt log | amaru, sentra, rosie |
| 6 | `packages/kipu-qillqaq` | `szl-kipu-qillqaq` | `kipu/` | KIPU substrate: content-addressed Linda tuple space of receipt cells | a11oy |
| 7 | `packages/unay` | `szl-unay` | `unay/` | UNAY: receipt-keyed semantic memory store (sqlite + cosine/vss) | amaru, sentra, rosie |
| 8 | `packages/ayni-os` | `szl-ayni-os` | `ayni_os/` | Ayni-OS: event-sourced reciprocity ledger, checkpoint, rewind, tinkuy | a11oy |
| 9 | `packages/hatun-mcp` | `szl-hatun-mcp` | `hatun_mcp/` | Hatun-MCP: doctrine-aware MCP server (SSE + HTTP) | (ops repo: hatun-mcp) |
| 10 | `packages/edge-organs` | `szl-edge-organs` | `edge_organs/` | Edge organs (chaski / wallpa / wasi-rikuq) — edge health + fan-out | a11oy |
| 11 | `packages/live-wires` | `szl-live-wires` | `live_wires/` | Live-Wires: framework-agnostic 3D wire viewer (SSE-fed) | a11oy, amaru, sentra, rosie, killinchu |
| 12 | `packages/mobile-controls` | `szl-mobile-controls` | `mobile_controls/` | Mobile touch controls / viz patch for the console | a11oy |
| 13 | `packages/rosie-v3` | `szl-rosie-v3` | `szl_rosie_companion/` | Rosie v3 operator-console companion (shadow + evolve proposals) | a11oy, amaru, sentra, rosie, killinchu |
| 14 | `packages/wayra` | `szl-wayra` | `wayra/` | Wayra: always-learning source ingestion | a11oy |

Every package ships: `pyproject.toml` (`name = "szl-<pkg>"`, `version`, `license = "Apache-2.0"`,
`authors`), a source package dir, a `README.md`, and a `tests/` dir with at least one passing test.

## Install (editable, from the monorepo)
```bash
pip install -e packages/<name>
# e.g.
pip install -e packages/wire-d
pip install -e packages/unay
```

## Import-or-vendor contract
- **Pip path** (CI, local dev, services): install editable from `packages/<name>`.
- **Git path**: `szl-<name> @ git+https://github.com/szl-holdings/platform.git#subdirectory=packages/<name>`.
- **HF Spaces (Docker, no runtime git)**: vendor at *build time* via `scripts/sync_to_flagship.py`,
  which copies `packages/<name>/<src>/*` into the flagship and stamps each file with a
  `# VENDORED from szl-holdings/platform packages/<name> @ <SHA> on <date>. Source of truth: monorepo.`
  header. Vendoring is acceptable **only** when the source of truth remains the monorepo and the
  sync is automated.

---
Apache-2.0. Signed: Yachay &lt;yachay@szlholdings.dev&gt; · Co-Authored-By: Perplexity Computer Agent.
