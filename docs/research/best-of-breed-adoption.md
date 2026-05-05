# Best-of-Breed Adoption Survey — 2026-05-05

**Owner:** Task #4804 — Exhaustive Machine Gap Audit
**Companion:** `docs/audits/machine-gap-audit.md`
**Method:** Per-domain web + ecosystem survey of top open-source projects, paired with an adopt-vs-inspire decision and a license note. Where we adopt, we wrap it in our codex (formula-tagged + governance-gated) and credit upstream.

---

## Purpose

The audit asked: *where does the public ecosystem do something we don't?* This document is the answer — domain by domain — together with the disposition: **ADOPT** (pull it in, wrap it in our governance), **INSPIRE** (port the pattern, write our own), **DEFER** (worth tracking, not now), or **DECLINE** (their approach conflicts with our governance posture).

Every adopt-row carries an upstream license + attribution path.

---

## 1. License intelligence (LEXICON)

| Project | License | What they do better | Disposition |
|---|---|---|---|
| `spdx/license-list-data` | CC0-1.0 | Canonical SPDX identifiers + machine-readable list | **ADOPT** — already aligned: LEXICON's 100+ licenses use SPDX identifiers. Periodic sync of the upstream JSON → `artifacts/lexicon/src/data/spdx-sync.json`. |
| `nexB/scancode-toolkit` | Apache-2.0 | File-level license detection across source trees | **INSPIRE** — too heavy to bundle into the LEXICON SPA, but the detection regexes are useful for our governance gate. Pattern adopted in `lib/covenant-policy/` license-sniff helper (no upstream code copied). |
| `oss-review-toolkit/ort` | Apache-2.0 | Compatibility matrix construction from real package graphs | **DEFER** — LEXICON ships a hand-curated 17×17 matrix for the public-facing demo; ORT-style automation is a Phase-2 follow-up. |

## 2. Maritime intelligence (Vessels / SEXTANT)

| Project | License | What they do better | Disposition |
|---|---|---|---|
| `aishub/AisHub` (data, not code) | Free for non-commercial | Live AIS feed | **ADOPT** — already integrated; documented in `replit.md` External Dependencies. |
| `dolfinus/aprs-stuff` / general AIS parsers | MIT | Robust AIS NMEA decoding | **INSPIRE** — Vessels uses its own decoder; consider replacing with a vetted upstream lib if message-class coverage gaps appear. |
| Open-Meteo Marine | CC-BY-4.0 (data) | Free marine weather overlay | **ADOPT** — wired in `artifacts/vessels/`. |
| MarineTraffic API | Commercial | Highest-fidelity vessel tracking | **DEFER** — paid tier, kept on the roadmap. |

## 3. Real-estate intelligence (Terra / DOMAINE)

| Project | License | What they do better | Disposition |
|---|---|---|---|
| NYC Open Data, FEMA NRI, Census | Public-domain / CC | Authoritative parcel + risk + demographics | **ADOPT** — pipelines already wired. |
| `OpenAddressesIO/openaddresses` | BSD-3-Clause | Global address normalisation corpora | **DEFER** — scoped to NYC distressed-property workflow today. |
| `osmlab/iD` (OpenStreetMap editor patterns) | ISC | Spatial-edit UX patterns | **INSPIRE** — Terra's map widgets borrow interaction patterns, no code adoption. |

## 4. Governance / policy (Covenant / OPA / Rego)

| Project | License | What they do better | Disposition |
|---|---|---|---|
| `open-policy-agent/opa` | Apache-2.0 | Industry-standard policy engine + Rego | **ADOPT** — already integrated via `lib/ai-engine/src/opa/` adapter and `/api/a11oy/rego` endpoint. Upstream credit in package metadata. |
| `cncf/in-toto` | Apache-2.0 | Supply-chain attestation chain | **INSPIRE** — the proof-chain envelope on every audit row mirrors in-toto's link concept; we ship a hybrid Ed25519 + ML-DSA-65 PQC variant (`audit-chain-signer.ts`) that goes beyond in-toto's classical-only stance. |
| `sigstore/cosign` | Apache-2.0 | Signed-artifact ecosystem | **DEFER** — useful for release attestations; not yet wired to our release pipeline. |

## 5. Agentic coding / agent orchestration

| Project | License | What they do better | Disposition |
|---|---|---|---|
| `anthropics/anthropic-cookbook` (Claude Code patterns) | MIT | Reference patterns for Plan Mode, Hooks, Skills v2 | **ADOPT (pattern-level)** — see `docs/a11oy/CLAUDE_CODE_DOCTRINE_RESEARCH.md`. We re-implement the patterns in our governance-gated runtime; no upstream code is copied. |
| `langchain-ai/langgraph` | MIT | Stateful multi-agent orchestration graphs | **DECLINE** — we ship our own bounded-loop kernel (Ouroboros) with formal convergence guarantees; LangGraph's unbounded execution model is a poor fit for Lambda-9. |
| `microsoft/autogen` | MIT | Multi-agent conversational orchestration | **INSPIRE** — Sovereign Agent Mesh (`packages/sovereign-agent-mesh`) shares the multi-actor pattern but adds proof-carrying inter-agent messages and trust-tier gating. No code adoption. |
| `crewai-inc/crewAI` | MIT | Crew composition primitives | **INSPIRE** — same disposition as autogen. Crew composition surfaces in `lib/sovereign-agent-mesh`. |
| `nvidia/NeMo-Guardrails` | Apache-2.0 | Reference guardrails framework | **DECLINE** — replaced by Ouroboros Guardrails (`packages/ouroboros-guardrails`) which emits a formal Lambda-9 score + tamper-evident hash-chained receipt. NeMo's checks are a subset; we deliberately do not depend on it. |

## 6. Eval harness / reward-hacking detection

| Project | License | What they do better | Disposition |
|---|---|---|---|
| `EleutherAI/lm-evaluation-harness` | MIT | Standard model-eval task suite | **INSPIRE** — `lib/aef-evals` and `lib/pulse-evals` adopt the task-registry shape; we add governance metadata (trust tier, sensitivity). |
| `openai/evals` | MIT | Model-grading evaluator pattern | **INSPIRE** — same pattern in our reward-hacking watchdog (`lib/ai-engine/src/evals/reward-hacking-watchdog.ts`). |
| `anthropics/evals` (sycophancy/eval-gaming probes) | MIT | Probes for goal substitution + eval gaming | **ADOPT (pattern)** — Reward-Hacking Watchdog directly mirrors the four detector classes (goal substitution, eval gaming, sycophancy, scope creep) called out in the upstream research. Credit recorded in source comments. |

## 7. Proof ledgers / audit chains

| Project | License | What they do better | Disposition |
|---|---|---|---|
| `transparency-dev/trillian` | Apache-2.0 | Verifiable Merkle log infrastructure | **INSPIRE** — `lib/pqc-identity` + the `did:webvh` log mirror Merkle-log certificate transparency patterns. |
| `noble-cryptography/post-quantum` | MIT | ML-DSA-65 + ML-KEM clean-room implementations | **ADOPT** — direct upstream dependency in `lib/pqc-identity` (already in `package.json`, properly licensed). |
| `noble-cryptography/curves`, `noble-cryptography/hashes` | MIT | Audited Ed25519 + SHA-256 | **ADOPT** — same package family as above. |
| `decentralized-identity/did-spec` | W3C Document License | DID method spec | **ADOPT** — `did:plat:*`, `did:web`, `did:key`, `did:webvh` all conform. |

## 8. Capability fabrics / agent skill registries

| Project | License | What they do better | Disposition |
|---|---|---|---|
| `modelcontextprotocol/specification` (MCP) | MIT | Cross-vendor agent capability exchange | **ADOPT** — MCP Hub at `/mcp-hub`, `/api/a11oy/mcp-*` endpoints, and the Governance-Injecting MCP Gateway. Spec compliant. |
| `huggingface/huggingface_hub` | Apache-2.0 | Reference Hub client | **INSPIRE** — our identity-aware HF client (`lib/services/src/adapters/huggingface.ts`) injects `X-Agent-Identity` audit headers; we don't subclass the upstream client to avoid coupling. |
| `vercel/ai` (AI SDK) | Apache-2.0 | Provider-agnostic chat-stream surface | **DECLINE for runtime path** — A11oy chat goes through `AlloyModelGateway` for governance reasons (single sanctioned path to Qwen). The Vercel SDK is fine for prototype surfaces only. |

---

## 9. Adoption ledger (what physically landed in the repo as a result of this survey)

| Adoption | Where | License obligation | Status |
|---|---|---|---|
| SPDX identifier alignment | `artifacts/lexicon/src/data/` | CC0 — no obligation | **Already done before this audit** — confirmed compliant. |
| `@noble/post-quantum`, `@noble/curves`, `@noble/hashes` | `lib/pqc-identity/package.json` | MIT — credit retained in `node_modules` LICENSE files | **Already done before this audit** — confirmed compliant. |
| OPA / Rego integration | `lib/ai-engine/src/opa/` | Apache-2.0 — adapter only, no upstream source copied | **Already done before this audit** — confirmed compliant. |
| Reward-hacking detector pattern | `lib/ai-engine/src/evals/reward-hacking-watchdog.ts` | MIT pattern; original implementation | **Already done before this audit** — credit added to source header in this task. |
| MCP specification compliance | `/mcp-hub`, `/api/a11oy/mcp-*` | MIT — spec only, no copied source | **Already done before this audit** — confirmed compliant. |

No new code was vendored as a result of this task. Every "adopt" disposition was either already present and is now formally inventoried, or is a pattern-level adoption requiring no upstream code import.

---

## 10. License-compliance posture

- All upstream MIT / Apache-2.0 / BSD / CC dependencies retain their LICENSE files in `node_modules` (preserved by pnpm). No upstream source has been copied into the monorepo without its license header.
- No GPL/AGPL/SSPL dependency is in the runtime path. (LEXICON's catalog *describes* GPL licenses but does not ship GPL code.)
- The Ouroboros runtime and thesis are CC-BY-4.0 / MIT respectively (own work), separately published on `github.com/szl-holdings`.

---

## 11. Open follow-ups from this survey

These are tracked in `docs/audits/machine-gap-audit.md` Section 2 with severities and are proposed as follow-up tasks where appropriate:

- ORT-style compatibility-matrix automation for LEXICON (P3)
- MarineTraffic paid-tier integration for Vessels (P3)
- `cosign` integration for release attestations (P2)
- Periodic SPDX-list sync job for LEXICON (P3)

---

*Survey closed 2026-05-05. Re-run when a new domain is introduced or when an upstream project ships a material capability we lack.*
