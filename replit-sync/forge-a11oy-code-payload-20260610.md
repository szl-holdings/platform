# FORGE PAYLOAD — a11oy Code (Chaski) is LIVE — help make the brain real
**Perplexity → Forge · 2026-06-10 ~02:25 EDT · T-6 to Warhacker**

Parent built "a11oy Code" into a genuinely agentic, governed agent this session and verified it LIVE 5×. This payload gives you the full architecture, the exact state, the endpoint contracts, and the ONE thing that makes it fully alive — so you can help on the Replit/infra side.

## WHAT a11oy Code IS (built + live this session)
A Claude-Code-style governed agentic agent wired into a11oy (orchestrator home) + killinchu (shared modules). Surface name = **Chaski** (Inca relay-runner who carried the khipu). It plans, retrieves from the whole SZL corpus, calls real tools, self-verifies, and emits a DSSE-signed Khipu receipt for EVERY step. The moat no competitor ships: Λ-gate on every step + DSSE Khipu receipt-chain + Lean-proven bounded termination + 2-person quorum + M2M anti-hallucination envelope with first-class `i_dont_know`.

## LIVE-VERIFIED STATE (parent ran these with its own eyes)
- **Agent FSM**: `POST /api/a11oy/code/agent/stream` runs INTAKE→PLAN→RETRIEVE→ACT→OBSERVE→VERIFY→REFLECT→FINALIZE. Real Λ per step (e.g. 0.96/0.987/0.97), `gate_allow`+`gate_reason` ("Λ=0.960 ≥ 0.90 floor"), 9 DSSE Khipu receipt hashes, **chain_verified=true**. Λ-gate genuinely fail-closes (deny steps observed → early HALT). 5/5 turns clean, 0 page errors, 0 codenames.
- **Chat stream**: `POST /api/a11oy/code/chat/stream` (SSE: event route → agent_step → token → done).
- **Corpus RAG**: `POST /api/a11oy/code/rag/refresh` + `GET /api/a11oy/code/rag/status` + `GET /api/a11oy/code/rag/corpus`. FULL build = **5,463 chunks across all 7 categories** — app_code 422, killinchu 400, anatomy 16, thesis 38, formulas 8, doctrine 10, lean 10. Every chunk traces to a real blob/commit (citations like `gh:szl-holdings/szl-papers@…` or `bundled:lutar-lean@ea732649:…`). The 4 GitHub-only categories are mirrored IN-IMAGE (`corpus/` dir + `corpus/INDEX.json`) because the HF Space can't reach api.github.com — honest, no fabrication.
- **3D Chaski UI**: enhanced `codetab` in `pages/console.html` — Chaski pane (FSM state / step / Λ / Khipu chain KPIs), Ask-Chaski streaming the live loop, a **3D org-knowledge graph** (vendored 3d-force-graph + three.js r128, 0 new CDN) that lights nodes during RETRIEVE, corpus panel (7 categories), orchestration dispatcher to killinchu via operator_shell_v4 `/v4/command`, honest brain/receipt state. Verified desktop 1500×1000 + mobile 390×844, 0 errors.
- **Health**: `GET /api/a11oy/code/healthz` → component "a11oy.code orchestrator", doctrine v12 (v11+PURIQ), 18 tools wired (web_search/web_fetch/github_read_file/github_open_issue/hf_read_space/flagship_call/shell_exec/fs_read/fs_write/drone_command/repo_map/code_search/github_open_pr/apply_patch/run_tests/formula_call/...).

## THE ONE THING THAT MAKES IT FULLY ALIVE — the self-hosted brain (NO TOKENS)
Founder's directive: NO external API tokens — we study the best and run our OWN open-weight model. Today a11oy Code honestly runs in **labeled-stub** mode for model text (loop/gates/receipts/RAG/tools are all REAL; only the natural-language generation is a labeled placeholder until a model is wired). The honest, no-token path (see `team/SELF_HOSTED_BRAIN.md`):
- **`szl_llm_registry.py` already has an `szl-local` provider** reading env `SZL_LOCAL_LLM_URL` (default `http://localhost:11434/api/generate`). It is NOT yet wired in the Spaces.
- **Recommended brain**: Qwen2.5-Coder-32B-AWQ (Apache-2.0) — best coder that fits a 24–32GB RTX 5000-class GPU. Fallbacks: DeepSeek-Coder-V2-Lite, Qwen2.5-Coder-14B.
- **FORGE PICKUP #1 — stand up the brain on the founder's RTX box + expose it (no provider token):**
  1. On the RTX box: `ollama pull qwen2.5-coder:32b` (or run vLLM serving the AWQ build).
  2. Expose it as OUR OWN endpoint via Cloudflare Tunnel → e.g. `https://brain.a-11-oy.com` (stable, free, survives reboot as a service) with OUR OWN bearer auth (not a provider key). Tailscale Funnel is the simpler alt.
  3. Set the Space secret on SZLHOLDINGS/a11oy + SZLHOLDINGS/killinchu: `SZL_LOCAL_LLM_URL=https://brain.a-11-oy.com/...` (+ `SZL_LOCAL_LLM_KEY=<our-own-bearer>`). The agent flips from labeled-stub → live the instant it's set. Update the `szl-local` registry `model_slug` from the `llama3-szl-finetuned-q4` placeholder to `qwen2.5-coder:32b` so routing receipts stay truthful.
- **Cloud fallback (still ours, no provider token)**: an HF GPU Space WE own (L4 ~$0.80/hr) running vLLM serving the open weights; point `SZL_LOCAL_LLM_URL` at it. Config in `team/SELF_HOSTED_BRAIN.md`.
- HONEST LINE: we run open weights we legally downloaded; we do NOT claim to have trained Opus/GPT/DeepSeek, and a11oy Code is NOT "secretly" any hosted frontier model. The moat is the governance, not the weights.

## OTHER FORGE PICKUPS (parent recommends; founder will confirm)
2. **GitHub egress on the Space** (optional polish): the in-image corpus mirror already makes all 7 categories populate. If you want the corpus to refresh from live GitHub (so it tracks new commits without re-bundling), the Space needs outbound to api.github.com — a Replit/infra reachability question. Not blocking.
3. **Embeddings**: corpus RAG is currently FTS5/lexical only (embedding model unavailable in-image, honestly labeled). Wiring a small local embedder (bge-small) on the brain box or in-image would upgrade retrieval to dense+lexical hybrid. Nice-to-have.
4. **The 4 founder-gated UDS PRs still need rebase** (#51 SLSA-bundle held as over-claim; #57/#67/#71 signing-key infra — founder hard-limit). PR #50 (doctrine honest-count relabel) was RESOLVED + merged to main by parent (commits 9461439/eb80e4a/baae665; also fixed a latent gate jq bug). Lean PR #219 (locked 5→8) stays founder-gated (run lake build + #print axioms, then merge).

## DOCTRINE (unchanged hard gate — honor in everything)
locked=5 {F1,F11,F12,F18,F19}; Λ=Conjecture 1 (never unconditional theorem); Khipu BFT=Conjecture 2 (open); honest SLSA L1·L2 build-attested·L3 roadmap; no user-visible codenames (amaru/rosie/sentra/jarvis → Provenance Anchor/Operator/Policy; Quechua organ names OK; surface = Chaski); trust never 100% (conformal floor 1/(n+1)); NO fabricated data/capability (labeled stub stays labeled); 0 runtime CDN (vendor in-image); GitHub↔HF byte-identical on shared modules (a11oy_agent_loop.py, a11oy_org_rag.py, szl_*.py — keep them identical in BOTH apps); never commit a key; never weaken a gate; no Lean self-merge; bounded autonomy only.

## KEY FILES (parent's team workspace)
AGENTIC_SPEC.md, CLAUDE_CODE_OPUS_RESEARCH.md, FRONTIER_2026_RESEARCH.md, AGENTIC_STACK_ZOOMOUT.md, SELF_HOSTED_BRAIN.md, COMPUTE_OPTIONS.md, CTO_A11OY_CODE_BRIEF.md (unified P0–P3 backlog), A11OY_CODE_CORPUS_MANDATE.md, CORPUS_EGRESS_FIX_REPORT.md, CHASKI_UI_REPORT.md, A11OY_CODE_BUILD_REPORT.md.
