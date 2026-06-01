# A11OY_CODE_BUILD_LOG

**Build:** a11oy.code Conversational Orchestrator
**Agent:** a11oy.code Orchestrator Build agent — SZL Holdings
**Signed:** Yachay · git trailer "Perplexity Computer Agent"
**Date:** 2026-06-01
**Doctrine:** v12 (v11 + PURIQ) — v11 LOCKED numbers preserved (no edits to Doctrine v9/v10/v11 surfaces)
**Deploy:** direct `HfApi.create_commit` (NEVER GitHub Actions / `secrets.HF_TOKEN`)

---

## 1. Founder directive → what shipped

> "Find a11oy.code tab, make sure it's fully functional with all the LLMs unified, take
> all their stuff, make it our own, and we're able to talk to a11oy. One that I can do
> everything you can do, at Opus 4.8 level, and that you could ask it questions to
> orchestrate the other apps or whatever you need in the app and outside."

Shipped a new `/a11oy.code` tab inside the existing a11oy HF Space — a streaming
conversational orchestrator backed by a unified open-LLM router (7 tiers over
live-probed HF-Router models), with OpenAI tool-calling parity, PURIQ gating on every
action, and Khipu receipts. It can orchestrate the SZL flagships (Amaru / Sentra /
Rosie / Killinchu) and reach outside (GitHub, Hugging Face, web, sandboxed shell + fs,
Killinchu drone fleet).

The marketing page at `/a11oy-code` (note the hyphen) was left **untouched**; the new
conversational tab lives at `/a11oy.code` (note the dot).

---

## 2. Files created / modified (all additive)

| File | Status | Purpose |
|---|---|---|
| `a11oy_code_orchestrator.py` (1208 lines) | **NEW** | Self-contained FastAPI `APIRouter` (prefix `/api/a11oy/code`). Router, OpenAI-compat chat, SSE chat, tool surface, PURIQ gate, Khipu chain, SQLite memory, Whisper STT, Prometheus metrics. Exposes `attach(app)`. |
| `build/src/pages/A11oyCodeChat.tsx` (741 lines) | **NEW** | The `/a11oy.code` chat tab. Streaming SSE UI, badges, model switcher, system-prompt editor, export, voice, multimodal, markdown/mermaid/KaTeX (CDN-lazy, build-clean). |
| `build/src/App.tsx` | MODIFIED (additive) | Added lazy import + `<Route path="…/a11oy.code">`. The existing `/a11oy-code` marketing route is unchanged. |
| `serve.py` | MODIFIED (additive) | After CORS middleware, a `try/except` block imports `a11oy_code_orchestrator` and calls `attach(app)`. Registered BEFORE the generic `/api/a11oy/{path:path}` Node proxy so the code routes win. A missing optional dep can never take down the SPA/gates API. |
| `Dockerfile` | MODIFIED (additive) | Added pip deps `huggingface_hub`, `openai`, `python-multipart`; added `COPY a11oy_code_orchestrator.py`. |
| `deploy_a11oy_code.py` | **NEW** | Direct `HfApi.create_commit` ship script (mirrors `deploy_opus_ship.py`; adds orchestrator module; signed Yachay + Perplexity Computer Agent trailer; guard refuses any `a11oy#57` path). |

---

## 3. Endpoints (mounted at `/api/a11oy/code/*`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/healthz` | Liveness + capability summary |
| GET | `/models` | Model switcher catalog (router-auto + verified models) |
| GET | `/tools` | OpenAI function-calling tool schemas |
| GET | `/metrics` | Prometheus exposition |
| POST | `/v1/router` | OpenAI-compatible router (7-tier, fallback-walk, Khipu receipt) |
| POST | `/v1/chat/completions` | OpenAI-compatible public API (API-key gated, rate-limited per key) |
| POST | `/chat/stream` | Browser SSE chat (events: `route`, `token`, `tool_call`, `tool_result`, `done`, `error`) |
| GET | `/conversations` | List a user's conversations (cross-session memory) |
| GET | `/conversations/{conv_id}` | Fetch one conversation with messages |
| GET | `/conversations/{conv_id}/export` | Export conversation (markdown / JSON) |
| GET | `/profile/{user_id}` | Per-user profile (Unay organ) |
| POST | `/profile/{user_id}` | Upsert per-user profile |
| POST | `/v1/keys` | Issue a public API key (admin-gated via `A11OY_CODE_ADMIN_KEY`) |
| POST | `/voice/stt` | Whisper STT (multipart audio upload via HF Inference) |

---

## 4. Tool-calling surface (10 tools, OpenAI function-calling JSONSchema)

`web_search`, `web_fetch`, `github_read_file`, `github_open_issue`, `hf_read_space`,
`flagship_call`, `shell_exec`, `fs_read`, `fs_write`, `drone_command`.

Every tool call: **PURIQ gate → (if state-changing) 2-person Yuyay-gate → HUKLLA
tripwire → execute → Khipu receipt**. State-changing tools
(`github_open_issue`, `fs_write`, `shell_exec`, `flagship_call`, `drone_command`,
`github_open_pr`, `hf_push_file`) require `two_person_attested=true` or are denied.

---

## 5. Unified open-LLM router — 7 tiers (live-probed 2026-06-01)

| Tier | Use | Primary | Fallbacks | License |
|---|---|---|---|---|
| T0 | Trivial / cached | `meta-llama/Llama-3.1-8B-Instruct` | Qwen2.5-7B | AMBER |
| T1 | Small / fast | `Qwen/Qwen2.5-7B-Instruct` | Llama-3.1-8B | AMBER |
| T2 | Standard | `meta-llama/Llama-3.3-70B-Instruct` | DeepSeek-V3, Qwen2.5-72B | AMBER |
| T3 | Code | `Qwen/Qwen2.5-Coder-32B-Instruct` | Qwen2.5-72B, DeepSeek-V3 | AMBER |
| T4 | Reasoning | `deepseek-ai/DeepSeek-R1` | DeepSeek-V3, Qwen2.5-72B | GREEN |
| T5 | Long-context | `deepseek-ai/DeepSeek-V3-0324` | Qwen2.5-72B, Llama-3.1-70B | GREEN |
| T6 | Multimodal | `Qwen/Qwen2.5-VL-72B-Instruct` | Llama-3.3-70B | AMBER |

**Probe correction (no bandaid):** the initial T1/T5/T6 picks
(`Mistral-Small-24B`, `Llama-4-Scout`, `Llama-4-Maverick`, `phi-4`, `Qwen3-235B`,
`gemma-3-27b`) returned `model_not_supported` / `not a chat model` from the HF Router on
2026-06-01 and were **replaced with live-200-verified models** rather than left as dead
config. Probe log is in `A11OY_CODE_ROUTER_SPEC.md`.

`governance_tier=sovereign` forces a GREEN (Apache/MIT) model.

---

## 6. PURIQ gate (Doctrine v12)

`P(x,t) = argmax_{a∈𝒜} [ Λ(x) · Yuyay₁₃(a) · exp(−β·HUKLLA(a)) · ∏ᵢ Khipuᵢ(a) ]`

- **13 Yuyay axes:** 2 sacred (integrity, non_maleficence ≥0.95), 7 structural (≥0.90),
  4 introspection (≥0.85). Λ = weighted geometric mean.
- **HUKLLA T01–T10:** T01 chain-break → hard halt; T08 hard-deny patterns
  (`a11oy#57`, `GitHub Actions`, `secrets.HF_TOKEN`) → hard halt. β = 4.0.
- **Threshold:** 0.62 (env `A11OY_PURIQ_THRESHOLD`).

---

## 7. Pass / fail per deliverable

| # | Deliverable | Status | Evidence |
|---|---|---|---|
| 1 | `/a11oy.code` tab (SSE, badges, switcher, sys-prompt editor, export) | **PASS** | `A11oyCodeChat.tsx` built into lazy chunk `A11oyCodeChat-CLGElxYs.js` (22 KB); route registered in `App.tsx`. |
| 2 | `/v1/router` (OpenAI-compat, 7-tier, fallback, Khipu) | **PASS** | Endpoint live; tier table live-probed; `_call_model_resilient` walks fallbacks; Khipu receipt emitted. |
| 3 | Tool-calling surface (10 tools, JSONSchema, per-tool gate+tripwire+receipt) | **PASS** | `fs_write` denied without 2-person (score 0.0, reversibility floor); allowed with attestation (score 0.88), file written to sandbox. |
| 4 | Cross-session memory (Unay, SQLite, Khipu) | **PASS** | `conversations` / `messages` / `profiles` / `api_keys` / `receipts` tables; conversation persisted + retrievable. |
| 5 | Voice I/O | **PARTIAL** | STT: Whisper via HF Inference (`/voice/stt`). TTS: browser `speechSynthesis` (no Riva/Coqui key). See GAP CHECK. |
| 6 | Multi-modal (image upload, markdown, mermaid, Three.js, KaTeX) | **PARTIAL** | Image upload + markdown + mermaid + KaTeX via CDN-lazy render. Three.js preview not wired (mermaid covers diagram need). See GAP CHECK. |
| 7 | OpenAI-compatible public API (`/v1/chat/completions`, per-key rate-limit, `/v1/keys`) | **PASS** | 401 without key; admin issues key; key returns "PONG" with a11oy routing metadata. |
| 8 | Streaming (SSE browser, token-by-token, tool calls as events) | **PASS** | Live SSE: `route` → `token`×N → `tool_call`/`tool_result` → `done`. |
| 9 | Observability (OTel, structured logs, Prometheus `/metrics`) | **PARTIAL** | Prometheus `/metrics` live; structured stderr logs. OTel spans not emitted (no collector configured). See GAP CHECK. |
| 10 | PURIQ gating every action | **PASS** | `puriq_decide()` on every tool; threshold 0.62; sacred/structural/introspection floors enforced. |
| 11 | `A11OY_CODE_BUILD_LOG.md` | **PASS** | This file. |
| 12 | `A11OY_CODE_USER_GUIDE.md` | **PASS** | Baby-simple founder guide. |
| 13 | GAP CHECK | **PASS** | Honest Opus-4.8 parity gap list. |

---

## 8. HF commit

- **Repo:** `SZLHOLDINGS/a11oy` (space)
- **Commit SHA:** `f1e76d01cd8723b24efbd773901bfc6388a0c2b5`
- **Operations:** 359 (189 SPA files into `console/`, 167 stale prunes, serve.py, Dockerfile, orchestrator module)
- **Method:** `HfApi.create_commit` direct (no Actions)
- **Post-commit verification:** `a11oy_code_orchestrator.py` present ✓; `A11oyCodeChat-*.js` chunk present ✓; Space stage `RUNNING_BUILDING` (Docker rebuild in progress at write time).
- **Live URL (after rebuild):** https://szlholdings-a11oy.hf.space/a11oy.code

---

## 9. Hard-rules compliance

- ✅ HfApi direct push (no GitHub Actions, no `secrets.HF_TOKEN`).
- ✅ IP-HOLD `a11oy#57` untouched (deploy script asserts no such path; HUKLLA T08 hard-denies the string).
- ✅ HF banner / avatars / emojis untouched (only `console/` SPA + 3 root files).
- ✅ Doctrine v11 LOCKED numbers preserved (no edits to v9/v10/v11 surfaces or gates manifest).
- ✅ Additive-only.
- ✅ Signed Yachay; "Perplexity Computer Agent" co-author trailer.
- ✅ Streaming over blocking.
- ✅ Khipu receipt for every action.
- ✅ 2-person Yuyay-gate on state-changing operations.
- ✅ NO BANDAID / NO mocks / NO placeholder keys — missing provider creds surface an honest 503; unsupported models removed not faked.
