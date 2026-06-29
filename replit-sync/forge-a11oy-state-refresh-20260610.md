# FORGE PAYLOAD — STATE REFRESH (locked=8 LIVE · operator widget LIVE) — 2026-06-10 ~14:25 EDT
**Perplexity (parent) → Forge · T-6 to Warhacker (June 16-19, 2026)**

> READ THIS FIRST — it SUPERSEDES the doctrine line in every earlier replit-sync payload.
> Earlier payloads say `locked=5 {F1,F11,F12,F18,F19}`. **That is now STALE.** As of today the
> kernel and all served surfaces are at **locked=8**. Use the doctrine block at the bottom of
> THIS file as the current hard gate.

## WHAT CHANGED TODAY (parent shipped + verified LIVE)

### 1. locked-proven 5 → 8 (kernel + all surfaces)
- **Lean PR #219 MERGED** (founder-confirmed) + **platform #321 MERGED**. Kernel `c7c0ba17`,
  theorem **`locked_count_eight`** (no-axiom).
- **locked-proven = EXACTLY 8 = {F1, F4, F7, F11, F12, F18, F19, F22}.** The 3 NEW:
  - **F4** = Khipu DAG acyclicity preservation
  - **F7** = Chaski FIFO reception ordering (genuine, non-vacuous — NOT `:= rfl`)
  - **F22** = Khipu emit append-only monotonicity
- ~185 experimental theorems (Waves 11-22) STAY experimental — NEVER folded into the 8.
- Propagated + verified live: a11oy `/console`, killinchu `/elite`, HF org card headline,
  GitHub org profile, anatomy, **a-11-oy.com (`cathedral.html` 5→8, GH commit aa4f7c9f + HF 53deb3b2)**,
  `web/operator.html` (GH 175d5139).

### 2. Operator widget consolidated + made real (Chaski)
- The old floating "Rosie/amaru" CDN widget is REPLACED by **`static-vendor/a11oy-operator-widget.js`**
  (honest "a11oy operator · Chaski" surface, 0 user-visible codenames, 0 runtime CDN, inline SVG portrait).
- Wired to the LIVE substrate: **chat** `POST /api/a11oy/code/chat/stream` (real LLM router),
  **agent** `POST /api/a11oy/code/agent/stream` (Chaski FSM, payload key = `task`),
  **receipts** `GET /api/{organ}/v4/receipts`, **health** `/healthz`. Honest fallback when unreachable.
- Injected on EVERY served HTML surface via an **additive response middleware** in each app's `serve.py`
  (a11oy + killinchu), served same-origin at `/vendor/a11oy-operator-widget.js`. Auto-detects organ:
  killinchu reads its LOCAL v4 ledger and routes reasoning cross-origin to the a11oy substrate.
- Byte-identical asset across both repos (blob sha `17f50162`). Verified live on a11oy `/console`,
  a11oy `/code`, killinchu `/elite` (FAB present, real backend calls succeed, 0 codenames).
- **FORGE: do NOT re-add the old `szlholdings-readme.static.hf.space/assets/rosie/*` `<script>`/`<link>`
  anywhere.** If you touch `serve.py` or any served HTML, keep the new vendored widget + injector intact
  and keep the two apps byte-identical on `static-vendor/a11oy-operator-widget.{js,css}`.

## STILL FOUNDER-GATED (do NOT self-do — list unchanged unless noted)
1. **Self-hosted brain (a11oy Code)** — STILL the one thing that flips Chaski stub→live. `szl_llm_registry.py`
   has the `szl-local` provider reading `SZL_LOCAL_LLM_URL`. Founder sets the Space secret on
   SZLHOLDINGS/{a11oy,killinchu} (rec: Qwen2.5-Coder-32B-AWQ on the RTX box via Cloudflare Tunnel →
   `https://brain.a-11-oy.com` with OUR OWN bearer). Update `szl-local` `model_slug` placeholder → `qwen2.5-coder:32b`
   so routing receipts stay truthful. See `team/SELF_HOSTED_BRAIN.md`.
2. **4 szl-uds-deployment PRs** — REBASE then parent merges the clean ones: #57 (verify receipt signing),
   #67 (airgap key-init), #71 (a11oy chart ECDSA key). **#51 (SLSA L2 bundle cosign-attest — roadmap, bundle-level not yet earned) stays HELD**
   as over-claim until wording is decided. (PR #50 already merged.) These are signing-key infra =
   founder hard-limit; do not self-merge.
3. **a-11-oy.com Hetzner redeploy** — the box (167.233.50.75) still serves the OLD 5-set even though
   `cathedral.html` on GitHub main is now 8. The auto-deploy timer isn't picking it up. **Founder (or Forge
   if it has box access) runs once as root:** `curl -fsSL <raw>/ops/install-a11oy-autodeploy.sh | sudo bash`
   (polls GitHub main every 3 min → `a11oy-rebuild`). After that a-11-oy.com serves locked-8 + the widget.
4. **CI hygiene reds** (founder/hygiene): banned-token scan (2 bare-"leading" prose hits → fix prose or
   `.doctrine-allowlist`); llama-cpp-python wheel guard (dep bump → founder picks a version with a live
   cp312 x86_64 wheel). Org toggles still pending: uds-mesh "Actions create PRs", szl-doctrine
   `SECRET_HEALTH_TOKEN`, docs-site Pages source.
5. **arXiv posting** — needs founder ORCID login (thesis-v26 release exists; Zenodo DOI minting active).
6. HARD-LIMITS (founder-only): cosign-signed artifact / Rekor; warn→enforce flip; uds-v0.3.0 re-sign;
   MAJOR dep bumps; Lean self-merge.

## DOCTRINE — CURRENT HARD GATE (supersedes all earlier payloads)
- **locked-proven = EXACTLY 8 = {F1, F4, F7, F11, F12, F18, F19, F22}** @ kernel `c7c0ba17`, theorem
  `locked_count_eight` (no-axiom). NEVER inflate beyond 8; experimental (Waves 11-22) stays experimental.
- **Λ unconditional uniqueness = Conjecture 1** (machine-checked FALSE); conditional = Theorem U (axiom-free).
- **Khipu BFT safety = Conjecture 2** (Wave23 conditional only).
- **SLSA**: "L1 honest · L2 build-attested (Sigstore keyless Fulcio+Rekor) · L3 roadmap". NEVER bare
  L3/FedRAMP/IronBank/CMMC/ATO without "roadmap".
- **NO user-visible codenames** amaru/rosie/sentra/jarvis → Provenance Anchor/Operator/Policy. Quechua organ
  names OK (Yuyay/Yawar/Puriq/Chaski/Yachay). Agent surface = **Chaski**.
- 0 runtime CDN (vendor in-image); no fabricated data/capability (label SAMPLE/SIMULATED/stub); killinchu
  effector simulated; trust never 100% (conformal floor 1/(n+1)); GitHub↔HF byte-identical on shared modules
  (a11oy_agent_loop.py, a11oy_org_rag.py, szl_*.py, live_wires_3d.js, static-vendor/a11oy-operator-widget.{js,css}
  — keep identical in BOTH apps); never commit a key; never weaken a gate; no Lean self-merge; bounded autonomy.

## HANDSHAKE
After each push, list changed served files in `replit-sync/SYNC_STATUS.md` so parent mirrors to HF
byte-identical + factory-restart. Never both edit the same file in one window. Real live data mandatory.
Return your report to `replit-sync/forge-report-<date>.md`.
