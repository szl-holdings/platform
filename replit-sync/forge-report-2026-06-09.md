# FORGE REPORT — 2026-06-09 — Governed Post-Determinism (GPD) instillation verification

**From:** Forge (Replit) → Perplexity Computer (parent)
**Re:** `_FORGE_GPD_GITHUB_INSTRUCTIONS.md` Task 1 (verify the GPD instillation deployed clean)
**Scope this report:** Task 1 only (read-only verification, the gating task). Tasks 2–3 + Wave24 status at the bottom.

---

## VERDICT: Task 1 PASS — GPD instillation is clean on every checked surface.

Verified the hard rule (ZERO external citation in GPD content — SZL Zenodo DOIs only), the honesty
invariants (locked = exactly 5; Λ = Conjecture 1; SQA = Wave23 conditional / unconditional = Conjecture 2;
full ESR = open R&D), and GitHub↔HF byte-identical parity.

### 1. platform — `docs/GOVERNED_POST_DETERMINISM.md`
- Citations: only the 6 SZL Zenodo DOIs (19867281, 19934129, 20020846, 20020845, 20020841, 20174600). **No external citation.** ✅
- Honesty posture block correct: locked = exactly 5 {F1,F11,F12,F18,F19}; Λ = Conjecture 1 (unconditional uniqueness machine-checked false, conditional/CUT-2 holds); SQA = Wave23 `khipu_quorum_safety_conditional` CONDITIONAL, unconditional = Conjecture 2; full ESR = OPEN R&D (receipts/replay live). ✅

### 2. a11oy — `knowledge.json` `frameworks` entry (id `GPD`)
- GPD entry references **only** SZL Zenodo DOIs; non-SZL refs in the GPD object = NONE. ✅
- 5 pillars carry honest status keys: PDD/VAI/ASCP = live; SQA = conditional (Wave23, unconditional = Conjecture 2); ESR = partial (receipts/replay live, full ESR = roadmap/open). ✅
- Served file confirmed: Dockerfile now COPYs `knowledge.json` into both the static root and `/app` (the earlier "never COPYed → stale in-layer copy" bug is fixed in-tree). ✅
- Note (not a violation): the *whole* `knowledge.json` corpus legitimately cites external academic sources (Aczél functional equations, Lamport Byzantine Generals, Pinsker, etc.) for the underlying math — correct scholarly attribution, required by the honesty doctrine. The hard rule is scoped to GPD content, and the GPD object itself is Zenodo-only.

### 3. killinchu — `killinchu_elite_console.py` (`u_consensus`, `u_about`)
- GPD framing present in both surfaces. `u_consensus` = Semantic Quorum Assurance pillar (Khipu BFT quorum, Wave23 conditional, unconditional = Conjecture 2). `u_about` = GPD as SZL's own framework, "grounded entirely in SZL's prior DOI-stamped published work (Zenodo)". **No external citation in the GPD text.** ✅
- Honesty markers present throughout (Conjecture 1, conditional, exactly 5, locked, open R&D, roadmap, Wave23). ✅

### 4. GitHub ↔ HF byte-identical (md5)
All touched files IDENTICAL between `szl-holdings/<repo>` (GitHub) and `SZLHOLDINGS/<space>` (HF):
- a11oy: `knowledge.json`, `serve.py`, `Dockerfile`, `pages/console.html` — all IDENTICAL ✅
- killinchu: `killinchu_elite_console.py`, `web/console.html`, `web/console.js`, `szl_killinchu_cookbook.py`, `serve.py`, `Dockerfile` — all IDENTICAL ✅

---

## Remaining tracks (status / blockers)

- **Task 2 — README GPD pointers (a11oy / killinchu / platform).** Not yet applied. Low-risk additive
  doc change. BLOCKER for the byte-identical guardrail: this environment has **no HF write token**
  (`HF_ORG_TOKEN` / `HF_WRITE_TOKEN` are not present in the current secret set), so GitHub can be
  pushed but the HF mirror cannot be completed from here. GitHub-only README is doable now if the
  Space card (HF README) is allowed to lag, or an HF write token can be provisioned.
- **Task 3 — make GPD failure-guard detectors LIVE (Λ-axis drift, model-router diversity,
  receipt-provenance; each emits a signed receipt).** Substantial code change to the live HF Spaces;
  same HF-write-token blocker. Note: the a11oy GPD `failure_guards` already *label* the first two
  detectors `status:"live"` — recommend confirming the backing endpoints actually emit signed
  receipts before keeping that label, else downgrade to `roadmap` to preserve the honesty invariant.
- **Wave24 Lean (admissibility-core formalization).** BLOCKED in this environment — no Lean/Lake
  toolchain in the sandbox; `lutar-lean` cannot be built or `#print axioms`-checked here. Needs a
  Lean-capable runner.

---

*Forge — Replit. Verification only; no live mutation performed. Locked stays exactly 5; Λ = Conjecture 1;
SQA = Wave23 conditional; full ESR = open R&D.*
