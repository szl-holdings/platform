# PRICING_TIERS — pricing v1 for the Series-A pitch

**Layer:** PURIQ v12 customer surface · **Author:** Yachay (CTO authority) · **Date:** 2026-06-01
**Status discipline:** spec. v11 LOCKED numbers preserved verbatim (749 / 14 / 163 / 13-axis `yuyay_v3`
/ replay hash `bacf5443…631fc5` / `lutar-v18.0.0` @ `c7c0ba17`). Pricing is a **proposal for the pitch**,
not a contract. NO mock.

---

## 0 — What you pay for

You pay for **governed, receipted agentic calls** — not raw tokens. A "call" is one request to any
flagship endpoint that emits a Khipu receipt (the gate eval + HUKLLA check + receipt write are included).
The wedge vs. raw LLM APIs: every call comes with a **13-axis verified, hash-chained, auditable receipt**
you can verify yourself. That governance layer is the product; the LLM is a commodity input behind it.

---

## 1 — The five tiers

| Tier | Price | Included calls / mo | Best for | Key gates |
|---|---|---:|---|---|
| **Demo** | **Free** | 1,000 | hackathon / academic / Greene-network | all 5 flagships, test+live, community support |
| **Builder** | **$299 / mo** | 100,000 | solo devs, startups, prototypes → production | + email support, 20 req/s burst, 10 keys |
| **Professional** | **$1,999 / mo** | 1,000,000 | production apps at scale | + 99.9% SLA, 100 req/s, RBAC, audit export |
| **Enterprise** | **Contact** | unlimited (contracted) | mission-critical, on-prem | + on-prem, dedicated support, 99.95% SLA, SSO/SAML, custom gates |
| **DoD / IC** | **Custom** | unlimited (air-gapped) | defense / intelligence | + UDS-deployable, air-gapped, IL4+ posture, BoE included, FedRAMP path |

- **Demo** is free for hackathon, academic, and Greene-network accounts (`greene_network=1`); honor-system
  soft quota at 1,000 calls, hard ceiling at 10,000 (see API_KEY_SYSTEM.md). Cost exposure to us ≈
  **$1.05/account/mo** (§3), so the free tier is a cheap top-of-funnel.
- **Enterprise / DoD-IC** are sales-led: on-prem deployment via the UDS bundle, dedicated support, SLAs,
  and (for DoD/IC) an air-gapped IL4+ posture with the Body-of-Evidence (BoE) export bundled — the same
  BoE an auditor (Greene-grade) verifies by recomputing each Khipu `continuum_hash`.

---

## 2 — Comparable pricing (cited)

We price the **governance layer**, so the honest comparison is "what would a customer pay to DIY the raw
inputs, and what do platform/infra layers charge for the surrounding value."

**Raw LLM token APIs (the commodity input we sit on top of):**
- OpenAI lists **gpt-5.4 at $2.50 input / $15.00 output per 1M tokens**, gpt-5.5 at $5.00 / $30.00, and
  budget gpt-5.4-nano at $0.20 / $1.25 ([OpenAI API pricing](https://openai.com/api/pricing/),
  [OpenAI Devs pricing table](https://developers.openai.com/api/docs/pricing)).
- Anthropic lists **Claude Sonnet 4.6 at $3 / $15 per 1M** and Opus 4.6 at $5 / $25, with Haiku 4.5 at
  $1 / $5 ([CloudZero Claude API pricing 2026](https://www.cloudzero.com/blog/claude-api-pricing/),
  [silicondata Claude pricing 2026](https://www.silicondata.com/use-cases/anthropic-claude-api-pricing-2026/)).
- A typical ~2k-in / 500-out governed call costs **~$0.0125 on raw GPT-5.4** or **~$0.0135 on Claude
  Sonnet 4.6** if a customer wired it themselves — *before* they build any gate, audit log, or receipt
  chain.

**Platform / infra layers (the value-add seat we occupy):**
- Pinecone's plans run **Builder $20/mo flat, Standard $50/mo min., Enterprise $500/mo min.** with a free
  Starter tier ([Pinecone pricing](https://www.pinecone.io/pricing/)) — a useful anchor for "flat
  developer tier → usage Standard → $500-floor Enterprise."
- NVIDIA NIM microservices are **free for NVIDIA Developer Program members for research/test**, then
  priced through enterprise/GPU consumption for production
  ([NVIDIA NIM for Developers](https://developer.nvidia.com/nim),
  [NVIDIA NIM FAQ](https://forums.developer.nvidia.com/t/nvidia-nim-faq/300317)) — the model for our
  free Demo → paid production ladder, and for the DoD/IC GPU-consumption posture.
- H100/H200 GPU-hours (our on-prem / air-gapped COGS basis) run roughly **$1.03–$10.60/GPU-hr** depending
  on provider ([Spheron GPU pricing 2026](https://www.spheron.network/blog/gpu-cloud-pricing-comparison-2026/),
  [Jarvislabs H200 price guide 2026](https://jarvislabs.ai/blog/h200-price)).

**Where SZL lands:** Builder at **$299/mo for 100k governed calls = $0.00299/call** is ~**4× cheaper than
a DIY ungoverned GPT-5.4 call ($0.0125)** — and the customer gets the 13-axis gate, HUKLLA halt, and a
verifiable Khipu receipt they would otherwise have to build. We are not selling tokens cheaper; we are
selling *governed* calls cheaper than ungoverned raw tokens, which is the whole pitch.

---

## 3 — Unit economics (back-of-envelope, conservative)

**Assumptions (stated):** an SZL governed call routes through the 7-tier open-LLM router. At scale the
router's **T0 semantic cache** (router contract rule 1: cache hit → no model call) plus a realistic tier
mix dominate COGS. We route **open models via aggregators (Together / Groq / DeepInfra), GREEN-class**,
not frontier APIs — so our per-call input cost is far below the OpenAI/Anthropic list rates above.

Tier mix per call (2k in / 500 out):

| Tier | Share | $/1M in | $/1M out |
|---|---:|---:|---:|
| T0 cache hit (no LLM) | 25% | 0 | 0 |
| T1 small open (8B) classify/extract | 35% | 0.10 | 0.20 |
| T2 mid open (70B) | 30% | 0.60 | 0.80 |
| T4 reasoning (large open) | 10% | 1.20 | 1.60 |

```
Blended LLM cost/call  ≈ $0.00090
+ gate eval + Khipu write + vector lookup (amortized, reserved infra) ≈ $0.00015
= COGS/call ≈ $0.00105
```

| Tier | Calls | COGS | Price | Gross margin | Rev/call |
|---|---:|---:|---:|---:|---:|
| **Builder** | 100,000 | ~$105 | $299 | **~65%** | $0.00299 |
| **Professional** | 1,000,000 | ~$1,055 | $1,999 | **~47%** | $0.00200 |
| **Demo (free)** | 1,000 | ~$1.05 | $0 | — (CAC/funnel cost ~$1/acct) | — |

Healthy SaaS gross margins (47–65%) even on conservative assumptions, with upside as the cache hit rate
and open-model efficiency improve. **Professional's lower per-call rev** ($0.002) is intentional volume
pricing; margin stays positive because high-volume accounts have higher cache-hit rates. Enterprise/DoD
are priced on contracted committed-use + on-prem GPU pass-through (H100/H200 at the cited $1–$10/GPU-hr),
where the margin is on the **governance software + support**, not the GPU.

**Sensitivity:** if the cache hit rate falls to 0% and the mix shifts entirely to T2 (70B), COGS/call
rises to ~$0.0021 → Builder ~30% GM, Professional ~0% (break-even). This is the floor; it argues for (a)
investing in the semantic cache and (b) pushing classify/extract traffic to T1. Disclosed, not hidden.

---

## 4 — Why this is the right v1 for Series-A

- **Self-serve wedge (Demo → Builder → Pro)** mirrors the proven Pinecone / NVIDIA-NIM free-to-paid
  ladder, so the GTM motion is legible to investors.
- **Enterprise + DoD/IC** are where the real ACVs live (on-prem UDS, air-gapped, BoE) — the defense
  vertical the readiness audit flagged as the commercial substance. The pricing page *names* the
  air-gapped IL4+ posture, which is what a defense buyer scans for first.
- **Margins are honest and defensible** under conservative assumptions, and improve with scale — exactly
  the shape a Series-A diligence deck wants.

---

## 5 — Patch files (NOT pushed by authoring step)

| File | Target | Push path |
|---|---|---|
| `patches/a11oy_space/pricing.html` | a11oy `/pricing` tab | HfApi → `SZLHOLDINGS/a11oy` |
| `patches/github_customer_portal/pricing.md` | docs pricing page | git → `szl-holdings/customer-portal` |

— Signed **Yachay** (CTO authority), 2026-06-01. We sell governed calls, not tokens. Margins counted out loud. No bandaid.
