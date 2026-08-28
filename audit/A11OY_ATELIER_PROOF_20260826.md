# A11oy Atelier — Local Integration Proof

**Date:** 2026-08-26

**Workcell:** `A11OY-ATELIER-20260826`

**Branch:** `feat/a11oy-atelier-20260826`

**Base and pre-commit HEAD:** `7383a30fffeb44c7e8a3fa2c27e176ee450607fd`

**Truth label:** `VERIFIED_LOCAL`

This packet proves source wiring, targeted local validation, a live local provider call, browser rendering, and in-process receipt/memory behavior. It does **not** prove deployment, durable persistence, direct xAI API operation, remote CI, or production runtime.

## Delivered chain

- Original SZL product identity: A11oy Atelier (`a11oy.atelier`)
- Strict request contract and deterministic default-deny capability policy
- Fixed-endpoint xAI Responses API adapter (`store: false`, manual redirect handling, one call, timeout)
- Local-only Grok Build CLI adapter (shell-free execution, one turn, tools/search/subagents denied)
- Canonical authenticated route: `POST /api/a11oy/v1/atelier/ask`
- Configuration-only provider health route and tenant-scoped session read route
- Provider disclosure, prompt/response SHA-256 hashes, usage, policy and truth labels
- In-process `EvidenceLedger` append and 24-hour/12-turn tenant working memory
- `a11oy-atelier ask` and `a11oy-atelier doctor` CLI surface
- A11oy navigation and original Atelier UI at `/a11oy/atelier`
- Windows-compatible shared proxy listener and truth-labeled Omnia beacon compatibility response
- Environment contract, product documentation, status register, known-gap register, route registry

## Dependency proof

- Repository-pinned package manager: pnpm `10.26.1`
- Frozen install: `PASS`; lockfile current; workspace count `203`; no package downloads
- Build-script warning retained: `@google/genai`, `core-js`, and `protobufjs` scripts remain unapproved
- Repository-wide peer warnings remain pre-existing and were not converted into a pass claim

## Test and build proof

| Gate | Result |
|---|---|
| `@szl-holdings/a11oy-atelier` typecheck | PASS |
| `@szl-holdings/a11oy-atelier` tests | PASS — 1 file, 9 tests |
| `@workspace/alloy-runtime-api` typecheck | PASS |
| `@workspace/alloy-runtime-api` tests | PASS — 11 files, 48 tests |
| `@workspace/a11oy-cli` typecheck + build | PASS |
| `@workspace/a11oy` typecheck | PASS |
| Environment coverage | PASS — all checked artifacts documented |
| Scoped A11oy route witness | PASS — 17/17, including `/a11oy/atelier` |
| Full estate route smoke | INCOMPLETE — A11oy 16/16 and runtime API 5/5 passed before Atelier registration; 60 routes for five unrelated, stopped local apps failed connection |
| Banned brand-string gate | FAILED BASELINE/UNRELATED — 42 existing `TENAX` findings in files not changed by this workcell |
| `git diff --check` | PASS before proof/status additions; rerun required pre-commit |

The full estate smoke and brand-string results are intentionally not labeled green. The stopped unrelated apps were not started or spoofed, and their failures were not suppressed. The A11oy scoped rerun after route registration passed 17/17.

## Provider boundary tests

Automated tests prove:

- fixed xAI URL `https://api.x.ai/v1/responses`
- one fetch call
- `redirect: manual`
- `store: false`
- missing direct API key fails closed
- redirects fail closed
- tools, search, provider durable storage, and provider subagents fail before inference
- unknown request fields are rejected

## Live local Grok Build witness

The first governed call correctly failed closed with HTTP 502 because the installed Grok Build JSON schema used a top-level `text` field. The adapter was extended for the witnessed `text`, `requestId`, and `cache_read_input_tokens` fields without relaxing any execution restriction. Core tests/typecheck then passed.

Final witnessed request:

- route: `POST http://127.0.0.1:9090/api/a11oy/v1/atelier/ask`
- tenant: `solo-builder`
- session: `tenant-proof-20260826`
- provider/model: `grok-build` / `grok-4.6`
- answer: `A11OY_ATELIER_TENANT_OK`
- HTTP: `200`
- provider request: `4813c7c2-aef2-4adf-82df-8b40016a57c9`
- receipt: `atelier_b2f3541d-4eec-4b03-a547-e28a00b03e19`
- ledger: `le_1787777745982_000001`, `IN_PROCESS_APPEND_ACCEPTED`
- memory: `COMMITTED_IN_PROCESS`
- policy: `allow`
- evidence: `OBSERVED`
- local-only: `true`
- latency: `8394 ms`
- usage: 20,808 input; 47 output; 35 reasoning; 20,855 total tokens

Tenant isolation immediately after the call:

- `solo-builder`: 2 turns
- `other-tenant`: 0 turns for the same session ID

The earlier live witness exposed and drove a fix for keyless-development tenant propagation. Production still fails closed when `ALLOY_API_KEY` is absent.

## Browser witness

URL: `http://127.0.0.1:9090/a11oy/atelier`

- HTTP 200
- title `A11oy Atelier — Evidence-Bound Intelligence`
- meaningful body content (2,927 characters)
- expected Grok provider health label present
- no Vite/Next/Webpack overlay
- no console errors
- no page errors
- no HTTP error responses
- screenshot: `audit/screenshots/a11oy-atelier-live-20260826.png` (111,888 bytes)

The requested page was opened visibly in the default desktop browser. API PID `13844` and UI PID `43788` were running when this packet was authored; PIDs are transient and are not deployment evidence.

## Current gaps

- Ledger and session memory are in-process and are lost on restart.
- Direct xAI API inference is untested because no `A11OY_ATELIER_XAI_API_KEY` was configured.
- Production identity binding and deployment are not witnessed.
- Remote branch, pull request, exact-head CI, and merge status are not established by this local packet.
- The browser witness uses the repository-pinned Playwright fallback because the skill-provided `agent-browser` executable was unavailable.
- The screenshot reader hit a Windows ACL helper error; Playwright itself created and validated the screenshot.

## Required disclosure

> A11oy Atelier is an SZL Holdings product. Its Ayllu council, policy gates, retrieval, and receipts are operated by A11oy. Model inference for this response was provided by {provider} using {model}. Third-party provider names identify the configured inference service only; no affiliation or endorsement is implied.
