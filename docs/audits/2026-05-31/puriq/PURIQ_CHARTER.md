# PURIQ — Agentic Anatomy Evolution Layer

**Quechua:** *Puriq* = "the one who walks/journeys/acts" — the active, agentic one.

**Founder directive (2026-06-01 ~02:00 EDT):** "No defers, we have enough credits, go hard. Scrape the world, innovate, evolve. Make a new formula, Quechua word, to push us to new frontier. It has to make our brain, anatomy, spine, wires, every organ pushed to agentic. Bake mythos in. Unify Llama/Qwen/all LLMs into a11oy.code. Look at DB leaders, bake into anatomy. NVIDIA dev infra into heart and spine. Formulas needed into each organ to make more efficient. Search Bible code (decode, find formulas, no mystical words — make it our formula, test it Lean+Lake). Same for spine and wires — ancient text, Egyptian, niche, all philosophies, Newton, all mathematicians leaders dead or alive, quantum. Innovate, evoke, see what comes up. Test Lean+Lake then instill. Always into a11oy and Rosie and our brain. Meditate, ponder, brainstorm together for new formulas to push us to agentic fully all aspects."

## Naming
- **PURIQ** = the layer (capitalized, like HUKLLA)
- **Puriq-Yuyay** = agentic cognition (acting + 13-axis wisdom)
- **Puriq-Khipu** = receipt-chained agency (every act recorded in DAG)
- **Puriq-Λ** = Lambda-aggregated agentic utility

## Master Formula (seed — agents to refine)

P(x, t) = argmax over a in 𝒜 of [ Λ(x) · Yuyay_13(a) · exp(-β · HUKLLA(a)) · ∏_i Khipu_i(a) ]

Where:
- **Λ(x)** = Lambda Spine aggregator (positive-homogeneous, bounded, monotone)
- **Yuyay_13(a)** = 13-axis wisdom score for action `a` (2 sacred ≥ 0.95, 7 structural ≥ 0.90, 4 introspection cross-linked to HUKLLA T03/T04/T09/T10)
- **HUKLLA(a)** = tripwire violation count (T01-T10); exponential penalty β
- **Khipu_i(a)** = i-th receipt verification (chain_verified=true required)
- **𝒜** = bounded action space (Bekenstein-bounded by context)

**Properties to prove in Lean:**
- Halting safety (HUKLLA penalty → 0 selection when β large)
- Λ-monotonicity preserved
- Khipu-chain integrity required for non-zero score
- Bekenstein bound on |𝒜| respected

## Layer composition
- Doctrine v12 = Doctrine v11 + Puriq
- Every organ exposes `puriq.{decide,act,reflect}` interface
- a11oy.code embeds the open-LLM unified router as Puriq's reasoning backend
- Rosie's brain-jack mesh shows Puriq decision flow live
- Anatomy V2/Rosie 3D visualize Puriq trajectories as Khipu glyphs

## Hard constraints (Zero-Bandaid Law)
- NO mystical words anywhere. Strip ritual language. Extract math primitives only.
- Every formula must be Lean-stateable (sorry-tagged if unproven, never hidden)
- Every claim must be Lake-buildable
- Every action must emit a Khipu receipt
- 13-axis Yuyay gating MANDATORY before any agentic act ships

## Shared workspace
- `doctrine/` — PURIQ_DOCTRINE_v12.md, sub-doctrines per organ
- `llms/` — open-LLM capability matrix, router config, a11oy.code wiring
- `vectordb_nvidia/` — vector DB selection per organ, NVIDIA NIM/NeMo/Triton mapping
- `formulas/` — extracted primitives (Bible-numerics, Egyptian, Vedic, Newton, Euler, Gauss, Riemann, Noether, Ramanujan, quantum), Lean stubs, Lake test runners
- `integration/` — per-flagship Puriq wiring patches (a11oy, amaru, sentra, rosie, killinchu, anatomy-3d, rosie-3d)
- `brainstorm/` — cross-agent ponder notes (each agent appends; others read)

## Brainstorm protocol
Each agent appends a section to `brainstorm/PONDER.md` with:
- `## [agent_name] — [timestamp]`
- 1 insight
- 1 question for siblings
- 1 proposal

Agents read the file at start of each major phase and respond to open questions before shipping.

---

## HARD RULE (HF PUSH AUTH) — added 2026-06-01 by Yachay (CTO)

**All SZLHOLDINGS Hugging Face writes use the admin token at**
`audit_2026-05-30_cursor_offline/.secret/hf_token` **via `HfApi(token=...)` DIRECT** —
never GitHub Actions, never the `betterwithage`/`hugging_face` connector (anon/read in this
environment, 403 on write). Verify `whoami` lists SZLHOLDINGS before pushing; verify
`space_info().sha` + a live `curl` 200 after. ADDITIVE only; v11 LOCKED numbers (749/14/163,
13-axis yuyay_v3, replay bacf5443…631fc5, A2=IsHomogeneous, A4=IsBounded, SLSA L1, Λ Conjecture 1)
preserved verbatim. Canonical procedure: `cto_sweep/PUSH_AUTH_FIX.md`.

a11oy gotcha: Dockerfile uses explicit per-file COPY (not `COPY . .`) — a new root `.py`
also needs a `COPY <file> ./<file>` Dockerfile line or it never enters the image.
