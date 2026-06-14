# Dev7 — HF Estate Agentic Upgrade + Field-Leaders Adoption (openly-licensed only)

**Author:** Dev7 (Opus 4.8) · SZL Holdings · **Date:** 2026-06-13 (UTC)
**Org:** HF `SZLHOLDINGS` / GitHub `szl-holdings`
**Doctrine:** v11 — locked=8 · Λ = Conjecture 1 (advisory, NOT a theorem) · Khipu BFT = Conjecture 2
(conditional only) · SLSA L1 honest · joules MEASURED-only · organs EXPERIMENTAL ·
killinchu effectors SIMULATED · NEVER free-energy claims · NEVER fabricate live numbers
(label seed/fallback clearly).

**Lane discipline.** I did NOT touch any working dir owned by other devs
(`hf_energy_space`, `hf_khipu_space`, `hf_llmrouter_space`, `cathedral_live_src`,
`killinchu_dev`, `a11oy*`, `a11oy_tabs`). All my outputs are research + a self-contained,
drop-in widget under `estate_audit/` for the parent / Forge to hand to the owning devs.
No banned codenames (amaru/sentra/rosie/jarvis) are introduced anywhere in my deliverables.
(Note: `szl_rosie_reason` / `szl_sentra_scan` already exist as **immutable internal hatun
route segments** — I neither renamed nor created those.)

---

## 0. PROVENANCE DISCIPLINE — the moat (stated explicitly)

> **We NEVER copy code from NO-LICENSE / unlicensed / GPL/AGPL-copyleft / "dark" repos.**
> Tainted provenance would poison SZL's clean-room moat (verified compute + clean
> provenance). For every leader we *only* adopt the **idea** — and only when the source
> carries a **permissive license (MIT / Apache-2.0 / BSD)** that we verified by reading the
> actual `LICENSE` file at HEAD. We then **rebuild it SZL-native, clean-room**, and carry an
> **attribution line** crediting the idea's origin. Apache-2.0 inbound is fine for an
> idea-level rebuild; if we ever vendor an Apache-2.0 file verbatim we would also ship its
> `NOTICE`. Copyleft and "Apache-with-extra-commercial-conditions" sources are **rejected for
> code**, and only studied as prior art at the concept level with attribution.

All licenses below were verified by fetching the repo's raw `LICENSE` at HEAD on 2026-06-13.

---

## 1. LEADERS ADOPTION TABLE (openly-licensed only)

| # | Leader idea | Source repo | Exact license (verified) | Adopt? | SZL-native rebuild plan + attribution line |
|---|---|---|---|---|---|
| 1 | **ReAct "think → act → observe" loop with step logs persisted to memory** (agent re-polls, stores execution logs each step, stops on `final_answer`). | `huggingface/smolagents` — [github.com/huggingface/smolagents](https://github.com/huggingface/smolagents) | **Apache-2.0** (verified `LICENSE`) | **YES** (idea only) | Rebuild as a **read-only "decision-flow trace"** panel that mirrors a11oy's *real* agent loop via `/code/healthz` + gates — each step is a *receipt*, not an invented thought. anatomy already has a `runDecisionFlow` V8 hook; extend it to log step→step as Khipu-style entries. **Attribution:** `// trace-loop pattern inspired by smolagents (Apache-2.0, huggingface/smolagents); rebuilt SZL-native, no code copied`. |
| 2 | **Code-as-action vs JSON-tool-call** (LLM writes Python actions; ~30% fewer steps). | `huggingface/smolagents` | **Apache-2.0** | **YES** (concept, advisory) | We do NOT execute model-written code in a static space. Adopt only the *display* convention: show each fabric tool call as a typed call signature (`verify(receipt) → STRUCTURAL-ONLY`) in the trace panel. Same attribution as #1. |
| 3 | **In-browser inference, no server** (ONNX-Runtime via WASM default / WebGPU opt-in; `pipeline()` API; `env.backends.onnx.wasm.wasmPaths` lets you self-host the `.wasm` + model, no CDN). | `huggingface/transformers.js` — [github.com/huggingface/transformers.js](https://github.com/huggingface/transformers.js) | **Apache-2.0** (verified `LICENSE`) | **YES, but sovereign-gated** | Adopt for a future **client-side embed/classify** demo (e.g. a tiny on-device classifier in `llm-router-live` to *illustrate* a routing tier). MUST be vendored (0 CDN): self-host `.wasm` + a quantized model in the Space, set `wasmPaths` locally. Label clearly "runs on YOUR device — not SZL sovereign GPU; advisory demo only." **Attribution:** `// in-browser ONNX inference pattern from transformers.js (Apache-2.0, huggingface/transformers.js); models+wasm vendored locally, no CDN`. **Deferred** to a later wave (heavy assets) — flagged, not built now. |
| 4 | **Streaming chat / tool-call trace UI** (assistant message + tool-call cards + status pills). | `assistant-ui/assistant-ui` — [github.com/assistant-ui/assistant-ui](https://github.com/assistant-ui/assistant-ui) | **MIT** (verified `LICENSE`) | **YES** (idea only) | Rebuilt as the **receipt-trace / tool-call card** styling in my `dev7_verify_widget.js` (pass/fail pills, advisory badge). Vanilla JS, no React, 0 deps. **Attribution:** `// tool-call card UI inspired by assistant-ui (MIT); rebuilt vanilla, no code copied`. |
| 5 | **Streaming protocol & "data parts" for incremental agent output** (server-sent incremental chunks). | `vercel/ai` (AI SDK) — [github.com/vercel/ai](https://github.com/vercel/ai) | **Apache-2.0** (verified `LICENSE`) | **YES** (idea only) | Adopt the *concept* for the **live receipt-stream panel**: incrementally append receipts as they arrive (poll `/v1/ledger` or chain feed, fallback to last snapshot). We use plain `fetch` polling + honest backpressure (NOT SSE, to respect the 60/min cap). **Attribution:** `// incremental-append streaming concept from Vercel AI SDK (Apache-2.0); rebuilt as polled receipt stream`. |
| 6 | **WebGL 3D scene graph** (cinematic organ/cathedral rendering). | `mrdoob/three.js` — [github.com/mrdoob/three.js](https://github.com/mrdoob/three.js) | **MIT** (verified `LICENSE`) | **YES** (already in use, keep) | Already **vendored** at `anatomy/lib/three.min.js` (0 CDN ✓). Keep vendored copy; do not switch to CDN import. **Attribution:** three.js is MIT; keep the MIT header in the vendored file. |
| 7 | **GPU-accelerated data-viz layers** (scatter/arc/hexagon layers for node fabric maps). | `visgl/deck.gl` — [github.com/visgl/deck.gl](https://github.com/visgl/deck.gl) | **MIT** (verified `LICENSE`) | **NO (now) — concept noted** | The compute-pool node map (6 nodes) is far too small to justify deck.gl's weight; rebuild a tiny SZL-native SVG/canvas node graph instead. Revisit only if a node count explodes. **Attribution if ever used:** `// node-fabric layer concept from deck.gl (MIT)`. |
| 8 | **JS client primitives for HF inference / hub** (typed fetch wrappers). | `huggingface/huggingface.js` — [github.com/huggingface/huggingface.js](https://github.com/huggingface/huggingface.js) | **MIT** (verified `LICENSE`) | **NO** | Not needed — our fabric is first-party (a11oy.net). We already have the V8 `pull()` contract. Studied only; nothing adopted. |
| 9 | **Gradio agentic Space scaffolding** (chat + tool panels for HF Spaces). | `gradio-app/gradio` — [github.com/gradio-app/gradio](https://github.com/gradio-app/gradio) | **Apache-2.0** (verified `LICENSE`) | **NO** | Our static spaces are vanilla HTML/JS by sovereign design (0 CDN, system fonts). Pulling Gradio's runtime would violate the 0-CDN / vendoring rule and bloat static spaces. Concept (tool panel layout) informs our panel design only. |
| — | **Dify** (agent platform) | `langgenius/dify` | **Apache-2.0 + EXTRA commercial conditions** (verified `LICENSE` — "modified Apache 2.0") | **REJECT** | NOT pure permissive — the added multi-tenant/commercial-attribution conditions make it unsafe for our clean-room moat. Do not study its code; concept-level only. |
| — | **text-generation-webui** (LLM UI) | `oobabooga/text-generation-webui` | **AGPL-3.0** (verified `LICENSE`) | **REJECT** | **Copyleft (AGPL).** Network-use copyleft would force-license our whole fabric. NEVER copy. Not studied at code level. |

**Net:** 6 ideas adopted (3 ship now: trace-loop, tool-call cards, receipt-stream concept; three.js kept vendored; transformers.js deferred-but-cleared; deck.gl/gradio concept-only). 2 hard rejects on license grounds (Dify, text-generation-webui), demonstrating the discipline in practice.

---

## 2. AGENTIC UPGRADE PLAN — per static space

"Agentic" here = the space actively **queries the live a11oy fabric and reacts** —
live receipt streams, an "ask the fabric" verify widget, tool-call/receipt trace panels,
with **honest fallback when offline** and never a fabricated number.

**Shared live endpoints (verified live 2026-06-13, HTTP 200):**
- `GET https://a11oy.net/api/a11oy/v1/healthz` → `{status:"ok", organ, doctrine:"v11", lock:"749/14/163", commit}`
- `GET https://a11oy.net/api/a11oy/v1/compute-pool` → multi-node fabric: `counts{nodes_total:6, nodes_reachable:5, gpu_nodes_reachable:1, sovereign_gpu_live:true}` + per-node `{name,kind,reachable,sovereign,capabilities,models}` + an explicit `honesty` string ("reachable=True only on a real probe; sovereign=True only for owned hardware; no node fabricated; no energy/joule claim; Lambda = Conjecture 1").
- `POST/GET https://a11oy.net/api/a11oy/v1/verify` → honest receipt verdicts: `VERIFIED | STRUCTURAL-ONLY | FAILED | UNRECOGNISED` (+ `checks[]`, `engine_version`, `doctrine`).
- **Rate limit is REAL: 60/min per IP → HTTP 429** (`{error:{code:"rate_limited"}}`). Every widget MUST treat 429 as honest backpressure, NOT failure, and back off.

| Space | "Agentic" feature to add | Live endpoint(s) it calls | Honest-fallback behavior |
|---|---|---|---|
| **anatomy** (static, rich; already has V8/V9 live lens for `/code/healthz`,`/v1/qbio/*`, killinchu `/v1/honest`) | (a) **"ask the fabric" verify widget** in the honesty/provenance panel (paste a Khipu receipt → real verdict). (b) **Compute-pool organ binding**: bind the "circulation/metabolism" organ to the *real* node fabric (reachable/sovereign/GPU counts) as live respiration. | `/v1/verify` (widget); `/v1/compute-pool` (organ binding). Reuse V8 `pull()` AbortController contract. | Widget: 429 → "rate-limited · honest backpressure"; timeout/err → "offline · static snapshot — no verdict invented." Organ: falls back to `data.js` baseline labeled `offline · static snapshot`; never shows a live count without a 200. **STRUCTURAL-ONLY shown as advisory amber, never green.** |
| **cathedral** (static, cinematic 3D) | **Live "fabric heartbeat" in the scene**: a subtle pulse/HUD driven by `compute-pool` (nodes_reachable, gpu, sovereign_gpu_live) + `healthz` lock string — the cathedral "breathes" only when the fabric is reachable. Plus a corner **verify widget** launcher. | `/v1/healthz` (lock + commit), `/v1/compute-pool` (node counts). | If unreachable: heartbeat freezes to a labeled `static snapshot` state; HUD shows `offline · last known: <none live>`; lock string falls back to the doctrine constant `749/14/163` **labeled seed**, never presented as a fresh probe. (Coordinate with cathedral dev — concept only, do not edit `cathedral_live_src`.) |
| **energy** (static) | **Honest energy posture strip**: show `sovereign_gpu_live` + `gpu_nodes_reachable` from compute-pool as the *only* truthful "is there metal to soak?" signal. **NO joule number unless a real MEASURED exporter is present.** | `/v1/compute-pool` (gpu/sovereign flags only). | When GPU node unreachable: `wasted_energy_available:false`, posture `sample`, **joules stay MEASURED-only → show "—" / "no measured exporter," never a fabricated joule**. NEVER a free-energy claim. (Owned by energy dev — concept only; do not edit `hf_energy_space`.) |
| **khipu-constellation** (static) | **Live receipt-stream constellation**: stars = recent Khipu receipts; new receipts append (incremental-append concept, polled not SSE). Tap a star → opens the verify widget pre-filled with that receipt. | receipts/chain feed (`/v1/ledger` or chain stream — both rate-limited) for the stream; `/v1/verify` for tap-to-verify. | Poll at ≤1 req/15s to stay under 60/min; on 429/err → freeze constellation to last snapshot labeled `offline · static snapshot`, show "fabric rate-limited/unreachable — showing last received receipts." Never mint a fake receipt. (Owned by khipu dev — concept only; do not edit `hf_khipu_space`.) |
| **llm-router-live** (static) | (a) **Live node/model roster** from compute-pool (which sovereign GPU + which models are *actually* listed live, e.g. `qwen2.5-coder:7b`, `bge-large`). (b) **Optional, deferred**: a vendored transformers.js on-device classifier to *illustrate* a routing tier (clearly "your device, advisory"). | `/v1/compute-pool` (`nodes[].models`, reachable, sovereign). | Roster falls back to a static labeled snapshot; hosted fallbacks (groq/nvidia/hf-router) shown with the fabric's own `sovereign:false` + "NOT GPU compute you own" note verbatim. (Owned by llm-router dev — concept only; do not edit `hf_llmrouter_space`.) |

> **hatun-mcp / anatomy "make agentic" scope decision.** `hatun-mcp` is a **live Docker MCP
> server** (already deeply agentic — 25 governed tools, Khipu receipts, DSSE signing,
> Byzantine quorum). Making it "more agentic" means backend code edits that would **collide**
> with active a11oy/killinchu work and the open drift PRs. **I deliberately did NOT touch it.**
> For **anatomy** (a static space) I provide a *drop-in, additive* widget (below) that the
> owning dev/Forge can mount with one line — no rewrite of the existing V8/V9 lens. This keeps
> me strictly in the safe lane.

---

## 3. PROTOTYPE — vendored, self-contained "verify-a-claim" widget (full code)

Validated against the **live** fabric on 2026-06-13:
- `POST /v1/verify` with a sample in-toto statement → real verdict `STRUCTURAL-ONLY`, real
  checks `intoto.predicate_type:pass`, `intoto.subject_digests:pass`.
- 1 ms AbortController timeout → `ok=false, aborted=true` → renders honest "offline" state.
- 429 path renders "rate-limited · honest backpressure," never a false green.

**Properties:** 0 runtime CDN · system fonts only (`system-ui` stack) · AbortController +
try/catch (never throws) · honest fallback · STRUCTURAL-ONLY rendered **advisory amber**
(never green) · self-contained IIFE (no deps, no React) · `SZLVerify.mount('#id', {base})`.

The full source is saved alongside this report at
**`estate_audit/dev7_verify_widget.js`** (208 lines). To mount in any static space:

```html
<div id="szl-verify"></div>
<script src="./dev7_verify_widget.js"></script>
<script>SZLVerify.mount('#szl-verify', { base: 'https://a11oy.net' });</script>
```

Key excerpt — the honest fetch contract + verdict mapping (full file has the UI/CSS):

```js
/* honest fetch contract: AbortController + try/catch. NEVER throws. */
function pull(url, opts, timeoutMs){
  var ctl = (typeof AbortController!=='undefined') ? new AbortController() : null;
  var to  = ctl ? setTimeout(function(){ try{ctl.abort();}catch(e){} }, timeoutMs||12000) : null;
  opts = opts||{}; opts.signal = ctl?ctl.signal:undefined; opts.cache='no-store'; opts.mode='cors';
  return fetch(url, opts).then(function(r){
    if(to) clearTimeout(to);
    return r.json().then(function(d){ return {ok:r.ok,status:r.status,data:d}; },
                         function(){ return {ok:false,status:r.status,data:null}; });
  }).catch(function(e){
    if(to) clearTimeout(to);
    return {ok:false,status:0,data:null,err:String(e&&e.message||e),aborted:e&&e.name==='AbortError'};
  });
}

/* HONEST verdict mapping — STRUCTURAL-ONLY is advisory amber, NEVER green. */
function verdictView(v){
  var s=String(v||'').toUpperCase();
  if(s==='VERIFIED')        return {label:'VERIFIED',        cls:'ok',   advisory:false};
  if(s==='STRUCTURAL-ONLY') return {label:'STRUCTURAL-ONLY', cls:'warn', advisory:true};
  if(s==='FAILED')          return {label:'FAILED',          cls:'fail', advisory:false};
  if(s==='UNRECOGNISED')    return {label:'UNRECOGNISED',    cls:'muted',advisory:false};
  return {label:s||'—', cls:'muted', advisory:false};
}

/* 429 + offline render honestly — never a false green */
function renderResult(res){
  if(res.status===429) return '<div class="szlv-state fail">rate-limited · the fabric caps at '+
    '60/min per IP. Honest backpressure, not a failure of your receipt. Try again shortly.</div>';
  if(!res.ok || !res.data){
    var why = res.aborted ? 'timed out' : (res.status ? ('HTTP '+res.status) : 'unreachable');
    return '<div class="szlv-state muted">offline · fabric '+esc(why)+
      '. No verdict shown — the widget never invents a green.</div>';
  }
  /* …renders real verdict + real checks + "re-verify yourself" footer… */
}
```

**Attribution lines carried in the file header:**
- `// tool-call / receipt-trace UI inspired by smolagents (Apache-2.0, huggingface/smolagents) + assistant-ui (MIT); rebuilt SZL-native, no code copied.`
- `// AbortController fetch contract reuses anatomy V8 (SZL own prior art).`

---

## 4. FORGE INSTRUCTION BLOCK

> **Forge — agentic upgrades for the static spaces (additive only, do NOT rewrite existing lenses):**
>
> 1. **Vendor the widget.** Copy `estate_audit/dev7_verify_widget.js` into each target space's
>    repo (it is 0-CDN, system-font, self-contained). Do NOT fetch it from a CDN.
> 2. **anatomy** (`SZLHOLDINGS/anatomy`): mount the verify widget inside the existing honesty/
>    provenance panel — `SZLVerify.mount('#szl-verify',{base:'https://a11oy.net'})`. Additionally
>    add ONE V8 organ binding to `GET /v1/compute-pool` (reachable/sovereign/GPU counts) reusing
>    the existing `V8.pull` contract; honest fallback to `data.js` snapshot. Hand to the anatomy
>    owner; do not disturb V8/V9.
> 3. **cathedral**: add a corner verify-widget launcher + a fabric-heartbeat HUD driven by
>    `/v1/healthz` (lock/commit) and `/v1/compute-pool` (node counts). Heartbeat freezes +
>    labels "static snapshot" when unreachable. Coordinate with cathedral dev.
> 4. **khipu-constellation**: add the verify widget for tap-to-verify a star; poll the receipt
>    feed at ≤1 req/15s (respect the 60/min cap); freeze to last snapshot on 429/err.
> 5. **llm-router-live**: render the live node/model roster from `/v1/compute-pool`; show hosted
>    fallbacks with the fabric's own `sovereign:false` note verbatim. (transformers.js on-device
>    demo: DEFER — vendored only, never CDN, label "your device / advisory.")
> 6. **energy**: surface only `sovereign_gpu_live` / `gpu_nodes_reachable` as the truthful
>    "metal to soak?" signal; **no joule unless a real MEASURED exporter**; never a free-energy claim.
> 7. **hatun-mcp**: DO NOT change in this wave (live MCP server; collision risk with active
>    a11oy/killinchu work).
>
> **Hard rails for every space:** 0 runtime CDN (vendor every lib) · system fonts only ·
> doctrine v11 (Λ=Conjecture 1 advisory; locked=8; Khipu BFT=Conjecture 2; SLSA L1 honest;
> joules MEASURED-only; organs EXPERIMENTAL; killinchu effectors SIMULATED) · never fabricate a
> live number — label seed/fallback clearly · STRUCTURAL-ONLY is advisory, never green · 429 =
> honest backpressure · no banned codenames (amaru/sentra/rosie/jarvis).

---

## 5. Files produced by Dev7
- `estate_audit/dev7_agentic_leaders.md` — this report (adoption table, per-space plan, code, Forge block).
- `estate_audit/dev7_verify_widget.js` — the validated, vendored, self-contained verify-a-claim widget (208 lines, tested live).

*Signed-off: Dev7 (Opus 4.8) · clean provenance, honest doctrine, concrete code.*
