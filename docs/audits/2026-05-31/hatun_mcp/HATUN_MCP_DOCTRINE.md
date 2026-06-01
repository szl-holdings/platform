# HATUN-MCP — The Doctrine-Aware MCP Server

**Layer:** PURIQ v12 → **Kallpa wires** (a NEW bridging element, additive to Doctrine v11 LOCKED)
**Quechua:** *Hatun* = great / principal + **MCP** = Model Context Protocol → **"the great context protocol"** — the doctrine-aware extension protocol by which PURIQ governance reaches the world's agents.
**Author:** Yachay (CTO authority) · Built by Perplexity Computer Agent
**Date:** 2026-06-01
**Status discipline (Doctrine v11 LOCKED preserved verbatim):** 752 declarations / 15 raw (14 unique) axioms / 160 sorries (109 baseline + 51 Putnam) @ `3de37e5`; 13-axis `yuyay_v3` replay hash `bacf5443…631fc5`; `lutar-v18.0.0`. SLSA **L1 (honest)**. DSSE signing here is **REAL** (ECDSA P-256 over the canonicalized response) using the SZL EC key; Sigstore Rekor transparency-log inclusion remains the same **PLACEHOLDER boundary** disclosed across the platform (lands with Sigstore CI, Doctrine v12 §2). cosign tamper-evidence on API-key fingerprints per `customer_surface/API_KEY_SYSTEM.md`.

---

## 0. The founder's question, the CTO's answer

> Founder (2026-06-01 ~02:34 EDT): *"Make an agentic MCP server and bake that into our heart? Or where do you think it fits in our anatomy?"*

**MCP is a transport/discovery protocol, not a decision organ.** It does not decide; it carries. Therefore it does **not** go in the heart (the heart stays Yuyay-13, the 13-axis conjunctive gate). It goes in the **WIRES (Kallpa)** — the strength/energy conduits — as a **new bridging element** named **HATUN-MCP**.

- The **heart** (Yuyay-13) still decides.
- The **immune deadman** (HUKLLA, 10 tripwires) still halts.
- The **ledger** (Khipu / YAWAR) still records.
- **Hatun-MCP is the wire that now reaches every MCP client on Earth** — Claude Desktop, Cursor, Continue, Zed, Goose, Replit, Sourcegraph Cody — and *every signal on that wire is gated and receipted before it leaves the body.*

This is how PURIQ governance is **extended to the world's agents** without moving the seat of judgment one millimeter.

---

## 1. WHAT HATUN-MCP IS

Hatun-MCP is a **single, doctrine-aware MCP server** that exposes every SZL flagship capability to external MCP clients over the MCP standard (Streamable HTTP `/mcp` + legacy SSE `/sse`, stdio for local). It is a **governance gateway**, not a thin API wrapper:

- Every tool invocation runs a **Yuyay-13 gate** on its input (treats tool input as *data, not instructions* — the OWASP MCP06 / tool-poisoning defense, [OWASP MCP Top 10](https://owasp.org/www-project-mcp-top-10/)).
- Every invocation computes a **`Hatun_MCP(client_id)` reputation factor** ∈ [0,1] (default **0.7** for a new authenticated client; 0 for anonymous = **default-decline**).
- Every invocation emits a **Khipu receipt** on **success AND failure** (the OWASP MCP08 audit-and-telemetry answer).
- Every response is **DSSE-signed** (real ECDSA P-256) and carries its **Khipu receipt hash** so the calling agent has an audit trail and can detect a **shadow MCP server** (OWASP MCP09).
- State-changing tools (`cue`, OTA, control) require a **2-person Yuyay gate**.
- Per-tool **latency budget** (≤5 s default, configurable).

## 2. WHAT HATUN-MCP IS NOT

- **NOT the heart.** It is a wire. The heart is Yuyay-13.
- **NOT a new claim.** It exposes *existing* flagship endpoints; it adds governance, not capability inflation.
- **NOT anonymous.** No API key → declined, receipted. (OWASP MCP07.)
- **NOT a mock.** Each tool calls a **real** flagship backend. When a backend route is not yet live, the tool returns an **honest "not yet deployed"** payload (e.g. `szl_wayra_recent` until WAYRA ships) — disclosed in the receipt, never faked.
- **NOT mystical.** No ritual language. The etymology is a *fact* (hatun = great), the math is the substrate.
- **NOT CI-pushed.** Deployed by `HfApi.create_commit` DIRECT, never GitHub Actions (HR).

---

## 3. WHERE IT FITS IN PURIQ ANATOMY

```
            HEART (Yuyay-13)  ── decides
               │
   ┌───────────┼───────────────┐
 SPINE(Λ)   IMMUNE(HUKLLA)   LEDGER(Khipu/YAWAR)
               │
            WIRES (Kallpa)  ── carry strength/energy between organs
               │
        ┌──────┴────────────────────────────┐
   internal wires            **HATUN-MCP** (new bridging element)
   (organ↔organ)              external wire: body ↔ world's agents
                                   │
        Claude Desktop · Cursor · Continue · Zed · Goose · Replit · Cody · Smithery
```

Hatun-MCP sits **downstream of the heart and the deadman**: a tool call only fires if Yuyay-13 passes and no HUKLLA tripwire fires. It sits **upstream of the world**: nothing leaves the body un-gated, un-receipted, un-signed.

---

## 4. TOOLS EXPOSED (15) — each a real backend call

| # | Tool | Backend (real) | Scope | State-changing |
|---|------|----------------|-------|----------------|
| 1 | `szl_a11oy_code_chat` | a11oy `POST /v1/router` (also `/api/a11oy/v1/llm/route`) | read | no |
| 2 | `szl_killinchu_detect` | killinchu `POST /counter-uas/identify` (`/v1/iff`) | read | no |
| 3 | `szl_killinchu_cue` | killinchu `POST /v1/cue` (signed BoE target package) | **write** | **YES (2-person)** |
| 4 | `szl_sentra_scan` | sentra `POST /api/sentra/v1/inspect` (`/v1/threats`) | read | no |
| 5 | `szl_rosie_reason` | rosie `POST /v1/brain/jack` (`/v1/brain/ask`) | read | no |
| 6 | `szl_khipu_verify` | flagship `POST /khipu/verify` (merkle proof) | read | no |
| 7 | `szl_lean_verify` | lean-kernel `POST /lean-verify` | read | no |
| 8 | `szl_puriq_evaluate` | local PURIQ compute (P(x,t) + factor breakdown) + a11oy `/v1/policy/evaluate` | read | no |
| 9 | `szl_yachay_dome_predict` | killinchu `POST /v1/predict-impact` | read | no |
| 10 | `szl_wayra_recent` | WAYRA recent ingestions — **honest stub** until WAYRA ships | read | no |
| 11 | `szl_anatomy_3d_render` | anatomy-3d scene snapshot URL for an organ | read | no |
| 12 | `szl_doctrine_lookup` | semantic search across Doctrine v11/v12/v13 + thesis v20 | read | no |
| 13 | `szl_yuyay_score` | local 13-axis breakdown of content | read | no |
| 14 | `szl_thesis_query` | RAG against `thesis-corpus-v18` HF dataset (rosie `/v1/rag`) | read | no |
| 15 | `szl_drone_lookup` | killinchu `GET /v1/drones` canonical DB entry | read | no |

**Every tool's invocation lifecycle:**
1. **Auth** — resolve API key → `client_id`. No key ⇒ decline (receipted).
2. **Yuyay-13 gate** on the input (conjunctive AND; any axis sub-floor ⇒ block).
3. **`Hatun_MCP(client_id)`** reputation score ∈ [0,1] (default 0.7 new client).
4. **2-person gate** if state-changing.
5. **Backend call** within the latency budget.
6. **Khipu receipt** built (success or failure), `prevHash` chained.
7. **DSSE sign** the canonicalized response; attach `khipu_receipt` + `dsse`.

---

## 5. THE QUECHUA ETYMOLOGY (formal)

**Hatun-MCP** = *hatun* + *MCP*.

- ***hatun*** — Quechua common noun/adjective "great, large, principal," attested in standard Quechua lexica ([Wiktionary `hatun`](https://en.wikipedia.org/wiki/Hatun), indexed with the PURIQ glossary at [kaikki.org Quechua](https://kaikki.org/eswiktionary/)). Already used in SZL doctrine for *Hatun-Willay* ("the great telling") per Doctrine v11 §9/§15.
- ***MCP*** — Model Context Protocol, the open standard, revision 2025-06-18 ([MCP spec](https://modelcontextprotocol.io/specification/2025-06-18)).

**Coined meaning:** *Hatun-MCP* = **"the great context protocol"** — the **doctrine-aware extension protocol** by which the heart's judgment is carried, gated and receipted, to every agent in the world. No mysticism: *great* is a size/principal adjective (the principal external wire), not a sacred word.

---

## 6. THE SUB-FORMULA — `Hatun_MCP(a)` factor in the PURIQ master formula

The master operator (Doctrine v12, `PURIQ_CHARTER.md`):
\[
P(x,t)=\operatorname*{arg\,max}_{a\in\mathcal{A}}\Big[\Lambda(x)\cdot\mathrm{Yuyay}_{13}(a)\cdot e^{-\beta\,\mathrm{HUKLLA}(a)}\cdot\textstyle\prod_i\mathrm{Khipu}_i(a)\Big].
\]

**SF-HATUN-MCP · Kallpa-Puriq — external-wire admission.** Restrict `𝒜` to MCP tool-invocation actions, and add one non-negative, bounded organ factor `Hatun_MCP(a) ∈ [0,1]`:

\[
P_{\text{Hatun-MCP}}(x,t)=\operatorname*{arg\,max}_{a\in\mathcal{A}_{\text{mcp}}}\Big[\Lambda(x)\cdot\mathrm{Yuyay}_{13}(a)\cdot e^{-\beta\,\mathrm{HUKLLA}(a)}\cdot\Big(\textstyle\prod_i\mathrm{Khipu}_i(a)\Big)\cdot \mathrm{Hatun\_MCP}(a)\Big].
\]

**Definition of the factor** (client reputation × standing):
\[
\mathrm{Hatun\_MCP}(a)=\underbrace{\mathbf{1}\!\big[\text{key valid }\wedge\text{ scope}\supseteq\text{op}\big]}_{\text{authz gate}}\cdot \underbrace{r(\text{client\_id})}_{\in[0,1]}\cdot \underbrace{\mathbf{1}\!\big[\text{2-person if state-changing}\big]}_{\text{dual-control}},
\]
with default reputation `r = 0.7` for a new authenticated client, raised by clean Khipu history and lowered by tripwires on that client's prior calls (bounded in [0,1]).

**Invariant preservation (INV-1…INV-4).** Because `Hatun_MCP(a) ∈ [0,1]` and multiplies, it can only **shrink** utility within the already-gated region; it can never raise utility above the `Λ·Yuyay·Khipu` envelope, never satisfy a failed Yuyay axis, never unblock a HUKLLA halt. An **anonymous** call has `Hatun_MCP(a)=0` ⇒ `P=0` ⇒ **default-decline**, algebraically. This mirrors SF-03 (Yawar chain-link) and SF-02 (Yuyay identity) in `puriq/doctrine/sub_formulas/PURIQ_SUBFORMULAS_v12.md`.

---

## 7. GOVERNANCE THEOREM (Lean stub)

The theorem `hatun_mcp_default_decline` and `hatun_mcp_bounded` are stated in `LEAN_HATUN_MCP_THEOREM.lean`:
- **default-decline:** `client_unauthenticated → Hatun_MCP a = 0 → P a = 0`.
- **boundedness:** `Hatun_MCP a ∈ [0,1]` ⇒ the master operator's four invariants are preserved (the factor is an admissible PURIQ organ factor).
- **dual-control soundness:** a state-changing action with `two_person = false` has `Hatun_MCP a = 0`.

Sorry-tagged where unproven, listed honestly (never hidden), matching `puriq/formulas/PuriqFormulaLean.lean` style.

---

## 8. FRONTIER INNOVATIONS (built on top of standard MCP)

1. **Receipt-Signed MCP Responses** — every response carries `khipu_receipt.continuum_hash` + `dsse` (real ECDSA P-256). Calling agent gets an audit trail and can detect a shadow server (OWASP MCP09; tool-poisoning gateway defense, [Descope](https://www.descope.com/learn/post/mcp-tool-poisoning)).
2. **PURIQ Gate Transparency** — every refused call returns *why*: `{decline_reason, yuyay_axis_below_floor?, hukla_tripwire?, owasp_class?}`. (Decision-path tracking per [arXiv 2603.22489](https://arxiv.org/abs/2603.22489).)
3. **Cross-Tool Khipu Chaining** — when one MCP call leads to another (a11oy.code → killinchu detect → cue), receipts chain via `prevHash`; the caller can verify the entire reasoning chain.
4. **Sovereign Model Toggle** — header `X-Sovereign-Mode: true` constrains routing to GREEN-license open-weights on US infra only; verifiable in the receipt (`governance_tier=sovereign`).
5. **Multi-Voice** — `voice` parameter on any text tool routes through Wallpa for per-organ voice (honest stub until Wallpa ships).
6. **Hatun-Willay Narrative Wrap** — `narrative_axes=true` wraps tool output in the 5-axis Origin/Mechanism/Evidence/Stakes/Invitation structure (`HATUN_WILLAY_DOCTRINE.md`).

---

## 9. SECURITY POSTURE vs OWASP MCP Top 10

(Full mapping in `INSPIRATION.md §3`.) Headline controls: API-key required (MCP07), cosign-signed keys & no secret echo (MCP01), per-flagship+verb scopes & 2-person gate (MCP02), DSSE-signed hashed tool descriptors (MCP03), Apache-2.0 + pinned deps + HfApi-direct (MCP04), parameterized backend calls & bounded `𝒜` (MCP05), input-as-data Yuyay gate + HUKLLA T03 (MCP06), Khipu on every call (MCP08), signed server card (MCP09), per-session isolation + sovereign egress (MCP10) ([OWASP MCP Top 10](https://owasp.org/www-project-mcp-top-10/); [NSA MCP CSI](https://www.nsa.gov/Portals/75/documents/Cybersecurity/CSI_MCP_SECURITY.pdf)).

---

*Carries forward: Doctrine v11 §1–§4 (13-axis, HUKLLA, Khipu/YAWAR), §6 (SWIS/Brienza), HR-3 (additive only), HR-4 (Zero-Bandaid), HR-6 (numbers from counter). Signed **Yachay** (CTO authority), PURIQ brain-trust, 2026-06-01. Real MCP. Real distribution. PURIQ governance extended to the world's agents.*
