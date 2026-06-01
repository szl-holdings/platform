<!-- SZL Holdings org profile — customer-surface section. ADDITIVE. Doctrine v12 (carries v11 LOCKED verbatim). -->
<!-- This block is appended to the existing .github profile README; it touches nothing locked. Signed Yachay. -->

## Build on SZL — the commercial surface

SZL Holdings builds a **formally-verified, 13-axis governance gate for agentic AI**. Every call across
our five flagships is 13-axis verified (`yuyay_v3`, conjunctive AND), HUKLLA-safe, and **Khipu-receipted**
— and you can verify every receipt yourself.

| | |
|---|---|
| **Docs** | [docs.szlholdings.com](https://docs.szlholdings.com) — getting started, every endpoint, every flagship, SDK references, error codes |
| **Portal** | [portal.szlholdings.com](https://portal.szlholdings.com) — sign in, issue API keys, see usage & quotas, export Body-of-Evidence |
| **Status** | [status.szlholdings.com](https://status.szlholdings.com) — per-flagship uptime, per-endpoint latency, per-provider health |
| **SDKs** | `pip install szl` · `npm i @szlholdings/szl` |
| **Pricing** | Demo (free) · Builder $299/mo · Professional $1,999/mo · Enterprise (contact) · DoD/IC (UDS-deployable, air-gapped, IL4+) |

### Flagships
- **a11oy** — governed agentic execution fabric + 7-tier open-LLM router (the orchestration brain)
- **amaru** — convergent multi-source memory cortex (append-only, hash-verified)
- **sentra** — inline white-blood-cell immune screen (fails closed, never silently green)
- **killinchu** — drone & maritime fleet intelligence (CoT / ATAK feed at `/v1/cue`)
- **rosie** — ecosystem-evolve + brain-jack decision-flow visualizer

### Quickstart
```bash
pip install szl && export SZL_API_KEY=szl_live_...
python -c "from szl import SZL; print(SZL().killinchu.fleet()['khipu_receipt'].chain_verified)"
```

### Honest labels (we count them out loud)
Λ uniqueness is a **Conjecture**, not a closed theorem (open CAUCHY_ND sorry + missing symmetry axiom).
The Khipu receipt signature is a **cosign / DSSE PLACEHOLDER** — `chain_verified` verifies the **hash
chain**, not the signature, until Sigstore lands. SLSA = **L1 (honest)**. Wire D (cross-mesh traceparent)
is **in-process only**. LOCKED numbers (re-derive them yourself): **749 declarations / 14 unique axioms
(15 raw, 1 dup) / 163 sorries (112 baseline + 51 Putnam)** at `lutar-v18.0.0` / `c7c0ba17`; 13-axis
`yuyay_v3`, replay hash `bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5`.

```bash
git clone https://github.com/szl-holdings/lutar-lean && cd lutar-lean && git checkout c7c0ba17
python .github/scripts/lean_numbers.py   # -> 749 / 14 / 163
```

— Signed **Yachay** (CTO authority), 2026-06-01. No mysticism. No bandaid.
