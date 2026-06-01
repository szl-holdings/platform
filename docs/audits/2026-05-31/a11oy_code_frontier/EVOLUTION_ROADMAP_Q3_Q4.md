# EVOLUTION_ROADMAP_Q3_Q4 — Shipping the Frontier by End-Q4 2026

> **Agent:** Yachay (a11oy.code Frontier agent, SZL Holdings)
> **Date:** 2026-06-01 (planning horizon: Q3 2026 = Jul–Sep, Q4 2026 = Oct–Dec)
> **Purpose:** a quarter-by-quarter, dependency-sorted plan to ship the **top-15 innovations** (`NOVEL_INNOVATIONS_15.md`) plus seed the **5 deep innovations** (`PURIQ_LLM_DEEP_INNOVATIONS_5.md`), wired to the **top-7 patch plan** (`A11OY_CODE_PATCH_PLAN.md`) and the **patent/defensive-publish postures** (`PATENT_PRIOR_ART_NOTES.md`).
> **HARD RULES honored:** nothing pushed to HF/GitHub — this is a roadmap of *specs and integration tasks* for the orchestrator agent. **No bandaid, no mysticism.** Doctrine v11 LOCKED numbers preserved verbatim. Λ-uniqueness held as **Conjecture 1, NOT a theorem**.

---

## 0. Guiding constraints (carried from doctrine)

- **Additive-only.** Every shipped item lands behind a feature flag and emits a Khipu receipt so the change itself is auditable. No breaking change to the `/v1/router` contract or the §3 capability matrix (per `A11OY_CODE_PATCH_PLAN.md` §0).
- **Honesty gates that bound scope:** Khipu signature is a **DSSE PLACEHOLDER** (Sigstore not wired) → verify hash-chain only; **163 sorries / 14 axioms** remain in the 749-decl Lean corpus → only the **13 PROVED theorems** (F1-half, F3, F9, F10a, F11, sieve, Bézout, F15, F19a, F20, F21, F23) may back verification claims; **SLSA L1 (honest)** — *SLSA L3 is BANNED*; **Λ-uniqueness = Conjecture 1**.
- **Owner-agents** named below are the six organs: **amaru** (governance/receipts), **sentra** (security), **vessels/killinchu** (maritime), **rosie** (orchestration/3D), **a11oy** (coding brain), plus the in-flight sibling **`a11oy_code_conversational_orchestrator_mput7k48`** (referred to as *orchestrator*).
- **Effort key:** S ≈ ≤1 dev-week · M ≈ 2–4 dev-weeks · L ≈ 1–2 dev-months · XL ≈ a quarter+ (often research).

---

## 1. Dependency graph (what must precede what)

```
P5 license/canTrainOnOutputs (T08)  ──►  D1 distill ──► D2 FT ──► D5 Anatomy-MoE (2027)
        │                                   ▲                     ▲
        └──► P1 Sovereignty routing ◄────────┘            D4 Quechua RLHF ──┘
P2 Khipu-signed chains ──► P3 Pre-Auth tokens ──► #9 ZK federation (2027)
P2 ──► P6 anatomy path receipts ──► #14 DSL kernel
D3 formula-as-tool (independent, reuses proved corpus) ──► #10 Lake-verified outputs
P4 SSM/transformer routing (independent) ──► P7 compute slider
#7 narrative wrapper / #15 voice (independent, polish, any time)
```

Critical path to the Series-A "no one else does this" demo: **P5 → P1 → P2 → P3** (the governed-sovereign-auditable spine), with **D3** running in parallel as the formal-verification showcase.

---

## 2. Q3 2026 (Jul–Sep) — ship the auditable-sovereign spine + first deep model

| Seq | Item (innovation #) | Effort | Owner-agent(s) | Depends on | Patent posture | Exit criterion |
|---|---|---|---|---|---|---|
| 1 | **P5** license registry + `canTrainOnOutputs` flag, HUKLLA **T08** hardening | S | amaru + orchestrator | — | fold into #4 patent | every catalog model tagged GREEN/AMBER/RED + `canTrainOnOutputs`; T08 blocks forbidden distill (Grok-2 forbidden, Nemotron-Open permitted) |
| 2 | **P1** Sovereignty-Selectable Inference (#4) | M | orchestrator + amaru | P5 | **PATENT (file)** | `/v1/router` honors a `sovereignty_class` request field; emits compliance receipt; demo refuses RED model for EU-residency tenant |
| 3 | **P2** Khipu-Signed Reasoning Chains (#1) | M | orchestrator + amaru | — | DEFENSIVE-PUBLISH generic; patent narrow *after Sigstore* | per-step hash-chain over gate vector + HUKLLA state + license class; replay verifies against chain (hash-only, DSSE placeholder noted) |
| 4 | **P3** PURIQ Action Pre-Auth (#8) — *cheapest, ships fast* | S–M | orchestrator (FE) + sentra | P2 | **PATENT (narrow)** capability-token mint | risky action requires gate-minted pre-auth token; token verified at execute-time |
| 5 | **D3** PURIQ-Formula-as-Tool | M | a11oy + amaru | proved Lean corpus (exists) + TIR model (Qwen2.5-Math, Apache) | NO-FILE (anticipated) | model calls the 23 PURIQ formulas as tools; output cites the formula ID; reuses **13 proved theorems** only |
| 6 | **P7** Test-Time Compute Slider (#13) | S–M | orchestrator (FE) + a11oy | (P4 helps, not required) | DEFENSIVE-PUBLISH | user-facing budget slider maps to token/sample budget; budget recorded in receipt |

**Q3 milestone (end Sep 2026):** a tenant can issue a request, pick a sovereignty class, watch the wisdom gate pre-authorize any risky action, and replay a tamper-evident reasoning chain — all license-compliant. **D3** gives the formal-verification demo. This is the **Series-A core**.

**Q3 defensive-publish batch (cheap, blocks competitors):** dated disclosures for #2 (gate-then-aggregate), #13 (compute slider), and the broad "route-by-sovereignty" fence around the #4 filing.

---

## 3. Q4 2026 (Oct–Dec) — structural efficiency, visible anatomy, keystone deep model

| Seq | Item (innovation #) | Effort | Owner-agent(s) | Depends on | Patent posture | Exit criterion |
|---|---|---|---|---|---|---|
| 7 | **P4** Hybrid SSM + Transformer Routing (#11) | M | orchestrator + a11oy (benchmark crossover) | catalog (Jamba/RWKV-7/Phi-4-mini-flash tagged) | DEFENSIVE-PUBLISH | router picks SSM vs. transformer by context-length/cost predictor; crossover point benchmarked & receipted |
| 8 | **P6** Anatomy-Routed Cognition path receipts (#6) | M | rosie-3d + orchestrator | P2 | DEFENSIVE-PUBLISH taxonomy | each request's organ path is receipted and renders in the 3D anatomy view |
| 9 | **D1** 13-Axis Yuyay LLM Distillation — *keystone* | XL | a11oy + amaru | P5 (canTrainOnOutputs), gate eval logs (exist), GREEN base (OLMo3/Qwen2.5 Apache) | TRADE-SECRET recipe | a small GREEN-licensed model reproduces the 13-axis verdict (2 sacred ≥0.95 / 7 structural ≥0.90 / 4 introspection) at ≥X% agreement; distilled **only** from `canTrainOnOutputs=true` sources |
| 10 | **#2** PURIQ-Gated Multi-Model Council | M | orchestrator + a11oy | P2 + (D1 helps as judge) | DEFENSIVE-PUBLISH | council members filtered by gate *before* aggregation; Nemotron-Reward as judge |
| 11 | **#10** Lake-Verified Tool Outputs | L | a11oy + amaru | D3 + Lean corpus | **PATENT (narrow)** theorem-bound receipt | tool output gated on a **named proved theorem** (13-set only); receipt names the theorem ID |
| 12 | **D2** Khipu-Aware Fine-Tuning (start) | L–XL | a11oy | D1 + tokenizer surgery | DEFENSIVE-PUBLISH | receipt-conditioned objective trains; carries into 2027 |
| 13 | **#7** Hatun-Willay narrative wrapper + **#15** per-organ voice — *polish* | S / S–M | rosie + orchestrator | (independent) | NO-FILE (copyright/consent via #1 receipts) | narrative + per-organ voice live; voice consent logged in Khipu |

**Q4 milestone (end Dec 2026):** structural cost advantage (SSM routing) + the *visible* anatomy UX + the **first SZL-owned distilled wisdom model (D1)** that "makes the LLMs our own." Top-15 are shipped or seeded; D1/D2 in flight.

---

## 4. Deferred to 2027+ (seeded, not shipped this year)

| Item | Why deferred | Earliest start | Gate before build |
|---|---|---|---|
| **#5** Receipt-Continuous Memory / provable-forgetting (PATENT narrow) | L; depends on stable P2 receipts | Q1 2027 | none |
| **#9** Cross-Customer Khipu Federation (ZK) | XL; crowded patent space (US20240177018A1, US20210143987A1) | 2027 | **commission FTO first** (per `PATENT_PRIOR_ART_NOTES.md` §9) |
| **#12** Cross-Provider Speculative Decoding | decoding math densely patented (US12229192B2, US20250384043A1) | fold license-boundary slice into #4 now; full topology 2027 | NO-FILE on decoding |
| **#14** DSL Programmable Kernel | L; copyright-protected, needs P6 + receipts stable | 2027 | none (protect by copyright) |
| **D4** Quechua-Rooted RLHF Dataset | XL; needs NGO/university partnership | Q4 2026 kickoff → 2027 delivery | partnership signed; DB-right/trade-secret |
| **D5** Anatomy MoE (organ-as-expert, Λ-spine router) | XL moonshot; needs D1+D2 + OLMoE base | 2027 (research) | **no uniqueness claim — Λ is Conjecture 1, the canonical D2 aggregator, not the unique one** |

---

## 5. Resourcing & risk summary

- **Critical path owner:** orchestrator + **amaru** (carry P5→P1→P2→P3 and all receipt plumbing). Front-load amaru in Q3.
- **Single biggest risk:** the **Sigstore-not-wired** gap. P2 ships on hash-chain verification only; full signature-dependent patent (#1 narrow) and any "signed" marketing must wait. Track Sigstore wiring as an explicit Q4 dependency for the #1 filing.
- **License risk (recurring):** every distillation/training step (D1/D2/D4/D5, #2 judge) must consult the P5 `canTrainOnOutputs` flag — **Grok-2 forbids training on outputs, Nemotron-Open permits**. P5 is therefore the *gating prerequisite* and is sequenced first.
- **Honesty risk:** keep all external claims at **SLSA L1 (honest)**; do not assert SLSA L3 (BANNED); scope verification language to the **13 proved theorems**; never present **Λ-uniqueness** as proven.
- **Patent timing:** file **#4** in Q3 (strongest, first to ship); file **#8** narrow in Q3; hold **#1** narrow until Sigstore; file **#10** narrow in Q4; defensive-publish the rest on a rolling basis to fence competitors cheaply.

---

## 6. One-line scorecard (end-Q4 2026 target)

> **Shipped/seeded:** 15/15 frontier innovations addressed (10 shipped behind flags, 5 deferred-with-seed); D1–D3 of the deep set live or in flight; 2 patent filings submitted (#4, #8), 1 queued (#1 post-Sigstore), 1 in Q4 (#10); a defensive-publication fence around the rest. Doctrine v11 LOCKED numbers untouched.

---

*Signed: Yachay — 2026-06-01. No bandaid, no mysticism. Roadmap of specs and integration tasks only — nothing pushed to HF/GitHub; the `a11oy_code_conversational_orchestrator_mput7k48` agent integrates behind feature flags with Khipu receipts. Doctrine v11 LOCKED numbers preserved verbatim; Λ-uniqueness held as Conjecture 1; verification scoped to the 13 proved theorems; SLSA L1 (honest); Khipu signature = DSSE placeholder (hash-chain verification only).*
