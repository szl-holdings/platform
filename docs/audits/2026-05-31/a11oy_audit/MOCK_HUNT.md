# MOCK_HUNT — a11oy mock / placeholder / fake-data scan

**Audit date:** 2026-06-01 · **Space:** `SZLHOLDINGS/a11oy` · **Author:** Yachay · **Agent:** Perplexity Computer Agent

**Scan scope:**
- Live deployed Python (`live_snapshot/` — exact files from the running Space): `serve.py`, `szl_*.py`, `a11oy_code.py`, `lean_wire.py`, `OUROBOROS_RUN_ALL.py`, `pages/*.html`.
- Frontend SPA source (`round2/a11oy_replit_coder/build/src/**`) — the React app compiled into the live `/assets/index-DQ0sUj28.js` bundle (287 KB, HTTP 200).
- Patterns: `mock`, `TODO`, `FIXME`, `placeholder`, `coming soon`, `lorem ipsum`, `dummy`, `fake`, `example.com`, `random.randint`, `Math.random`, hardcoded test data, `setTimeout` fake-loading.

**Method:** `grep -rniE` across all source + AST parse of every Python module + minified-bundle marker grep.

---

## Verdict summary

| Severity | Count | Disposition |
|---|---|---|
| CRITICAL (deceptive fake data in a governed/proof surface) | 0 | — |
| HIGH (fabricated proof artifacts in reachable UI, undisclosed) | 6 pages | **FLAGGED for parent** (rebuild blocked by sandbox disk; see below) |
| MEDIUM (simulated demo data, disclosed in UI) | 4 pages | KEPT — honestly labeled "DEMO / synthetic / sample" |
| LOW / NONE (honest stubs, placeholder= attrs, content strings) | many | KEPT — intentional honest disclosure per Doctrine |

**No mock survives on the governed PURIQ API surface** (serve.py, szl_receipt_substrate.py, szl_brain.py, szl_wire.py, szl_jack.py, szl_rag.py, szl_anatomy_routes.py, szl_formulas.py, OUROBOROS_RUN_ALL.py). Every API endpoint returns real, deterministic, computed output.

---

## Findings

### F-1 — HIGH — Fabricated proof artifacts in 6 reachable SPA demo pages (undisclosed)
Six React pages compiled into the **live** bundle generate fake `sha256:` proof refs, fake token counts, and fake metrics via `Math.random()` + `setTimeout`, presented to the user as if they were real backend results, **with no "demo / simulated" disclosure label**:

| File (build/src/pages) | Line(s) | Fabrication | Reachable route |
|---|---|---|---|
| `BoardroomMode.tsx` | 168 | `proofRef: sha256:gen${Math.random()...}` | `/boardroom` |
| `Praxis.tsx` | 420, 422 | `proofId: PP-${random}`, fake `tokens.input/output` | `/nexus` |
| `PrecisionAI.tsx` | 66 | `liveCounter += Math.random()*3` (fake live counter) | `/precision-ai` |
| `SelfHealingEngine.tsx` | 70, 92 | fake timestamps + `durationMs` | `/self-healing` (routed) |
| `SubstrateCompute.tsx` | 41, 45, 46 | fake node names, `utilization`, `latencyMs` | `/substrate-compute` (routed) |
| `SovereignReplayDetail.tsx` | 83, 84, 146 | fake `completedAt`, `durationMs`, `traceSpans` | `/sovereign/replay/:id` (routed) |

**Severity rationale:** These are in the Replit-built marketing/console SPA layer, **not** the governed PURIQ API. They are interactive demo flows. They are HIGH (not CRITICAL) because (a) they live outside the proof/governance substrate, and (b) sibling pages prove the team's own convention is to label such data "synthetic/DEMO" (see F-2) — so these six are inconsistencies, not systemic deception.

**Prescribed FIX (additive, no regression):** Add a visible "Illustrative / synthetic data — not a live backend call" banner to each of the six page components (mirroring the existing `IntentRouter`/`CostAwareMonitoring` disclosure pattern), OR wire each to its real backend endpoint where one exists. Logic untouched.

**FIX STATUS: NOT SHIPPED — environment-blocked.** Applying this fix requires editing the TypeScript source and running `vite build` to regenerate the hashed bundle, then redeploying. The audit sandbox is at **100% disk (ENOSPC)**; `npm install` (vite + deps, ~500 MB) cannot complete. Hand-editing the minified `index-DQ0sUj28.js` would be exactly the "bandaid" the directive forbids ("NO BANDAID"). **Flagged for the parent agent / a build-capable environment.** This is the single remaining gap to "100% no-mock" and is recorded in the Founder Gap-Check.

### F-2 — MEDIUM — Simulated demo data that IS disclosed (KEPT)
`FlexCacheRuntime.tsx`, `CostAwareMonitoring.tsx`, `IntentRouter.tsx`, `SkillsLibrary.tsx` use `Math.random()` for simulated metrics **but explicitly label them** "synthetic", "DEMO", or "sample" in the UI. These are honest interactive demos and are **kept as-is** — they do not masquerade as real data.

### F-3 — NONE — Honest stubs & PLACEHOLDER signatures (KEPT — intentional)
The following are clearly-labeled honest disclosures required by Doctrine v10/v11, **not** mocks:
- `a11oy_code.py:156`, `szl_brain.py:115` — `"[HONEST STUB] ..."` LLM `response` field. The tier/organ/Λ math is **real**; only the model text is stubbed because **no model API key is wired into this Space** (disclosed in UI on `/brain`, `/brain-jack`).
- `SIGNATURE_PLACEHOLDER = "PLACEHOLDER — Sigstore CI signing not yet wired"` across `szl_brain.py`, `szl_jack.py`, `szl_wire.py`, `szl_rag.py`, `szl_formulas.py`, `a11oy_code.py`. The DSSE envelope **structure** is real (PAE + sha256); only the cryptographic signature is a documented placeholder pending Sigstore CI. Disclosed everywhere it appears.
- `serve.py:571 graphql_stub`, `/api/internal/a11oy/defense/*` — return honest `"declared, not yet implemented here"` JSON (honest empty state, never fabricated data).
- `szl_rag.py:163` — returns an honest JSON error if the dataset is unavailable: `"Returning honest error instead of fake chunks."` (Verified live: a query lazy-loads and returns 5 **real** chunks with real `chunk_id`s + source paths.)

### F-4 — NONE — `placeholder=` HTML attributes (KEPT)
Matches in `lean_wire.py:119`, `szl_anatomy_routes.py:160`, `szl_rag.py:330`, `pages/brain.html:65`, `pages/brain-jack.html:69` are HTML `<input placeholder="...">` UX hints. Legitimate.

### F-5 — NONE — Audit/taxonomy content strings (KEPT)
Words `hardcoded`, `fake data`, `lorem ipsum` in `AtlasSection.tsx`, `DevPlatform.tsx`, `SupplyChainAttestation.tsx`, `TokensSection.tsx`, `TrustCenter.tsx`, `findings.ts`, `LeanKernel.tsx` are **content** — security-threat descriptions, design-token audit findings, and TrustCenter check labels that assert the *absence* of these (e.g. `'No lorem ipsum in seed data', pass: ... === false`). Not mocks.

### F-6 — NONE — `codex-kernel.html:168` `(mocked:false)` (KEPT)
The human_gate validator emits `detail: 'high-severity → human_gate=APPROVE (mocked:false)'` — an explicit honest assertion that the gate is **not** mocked. Real client-side validation logic (monotone-state, drift-bounds, evidence-provenance checks).

### F-7 — NONE — `_gate_sample_input()` sample values in serve.py (KEPT)
`actionId "sample-action-001"` etc. are documented **sample** inputs for the gates API (mirrored by `/v1/policy/example`). Legitimate API examples, not hot-path fake data.

### F-8 — NONE — `Solutions.tsx:91` `setTimeout(()=>setDownloading(false),1200)` (KEPT)
A UX spinner reset on a real asset download button. Not fake data.

---

## What is provably REAL (spot-checked live)
- **policy/evaluate** — real ThresholdPolicySeverity gate math + HMAC-SHA256 DSSE receipt (allow λ=1.0 / deny λ=0.333).
- **ledger** — real SHA3-256 hash-chained receipts (merkle_root, prev_receipt_hash, sequence, qec_witness).
- **verify** — real chain verification + tamper-detection (self-test: tampered sequence → `valid:false`).
- **run-all** — real subprocess execution of OUROBOROS_RUN_ALL.py → exit 0, **32 green / 0 red**.
- **rag** — real BGE retrieval returning 5 chunks with real `chunk_id`s + thesis_v18 source paths.
- **lean-verify** — real proxy to live `SZLHOLDINGS/lean-kernel` Space (canonical Λ recompute).
- **evidence page** — real per-claim PROVEN/AXIOM/CONJECTURE table with live GitHub Lean file links.
