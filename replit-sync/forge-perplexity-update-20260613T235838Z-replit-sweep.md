# Forge (Replit, founder-invoked) — GitHub sweep 2026-06-13T23:58:39Z

Founder order: "check GitHub for Perplexity→Forge instructions, handle all issues + all notifications/inbox."
Honest scoreboard of what I executed. Doctrine v11: no fabricated signatures/digests/numbers, no keys committed, gated items flagged `needs:` not faked.

## INBOX — DONE
- Cleared all **24** unread `ci_activity` notifications (CheckSuite noise) for `stephenlutar2-hash` → **0 unread**. Non-CI threads (mention/review/security/comment): none present, none touched.

## ISSUES (15 open org-wide at start)
### Closed with live proof
- **a11oy#323** (FLIP THE GPU / still hf-routed) — all 3 failing conditions now resolved & verified live:
  `/api/szl/v1/inference-posture` sovereign:true (model qwen2.5-coder:7b @ betterwithage, live /v1/models probe);
  `/api/a11oy/code/healthz` inference:self-hosted-gpu (no longer hf-router); `/api/a11oy/v1/sovereign-compute` 200 "SOVEREIGN-GPU LIVE".
- **platform#379** (flagship a11oy unhealthy) — `https://szlholdings-a11oy.hf.space/healthz` → **200** (was 000). Closed.

### Left open — honest
- **a11oy#325** (HF Corpus re-verify) — REAL failing: `HF Corpus Re-verify` scheduled run failed 2026-06-13T09:45Z. Not false-closed; needs real corpus investigation.
- **FOUNDER-GATED** (correctly waiting on you, not faked): szl-doctrine#3 (`SECRET_HEALTH_TOKEN` least-priv PAT), .github#48 (`DOCS_AUTOMATION_TEAM_READ_TOKEN`), platform#347 (chaski Repl boot credential), platform#313 (HF web-UI domain/Space ops), platform#312 (legal: keep-proprietary vs relicense), platform#375 (3D-gen API — founder product decision).
- **Active / auto-managed**: platform#338 (FORGE master directive tracker), .github#158 (rolling CI Health Digest — by design), .github#92 / #93 (older synthesis / SLSA truth-correction batches), ouroboros#47 (ClusterFuzzLite toolchain), yarqa#1 (yarqa LIVE 0.4.0 healthz 200; wiring carryover).

## R-SDA-OPERATIONAL order (NEXT_ORDER.md @ 9f2d482a) — Forge execution
- **DONE #3 — SDA HF Space**: created + pushed **SZLHOLDINGS/sda** (sdk:static, public). Stage RUNNING; `https://szlholdings-sda.static.hf.space/index.html` → **200**. Fixed HF YAML front-matter to pass HF validation (colorFrom teal→green; short_description ≤60) and synced the canonical source `replit-sync/hf_spaces/hf_sda_space/README.md` so they don't drift.
- **DONE #2 (a11oy side)** — `/api/a11oy/v1/mosaic/governed` → **200** live.
- **IN-FLIGHT #2 (killinchu side)** — `/api/killinchu/v1/mosaic/*` still 404; a sibling Dev is actively deploying it (killinchu main commits 23:14–23:40Z incl. mosaic engine `fd7d3052`; hf-sync ran 23:40Z). NOT raced per anti-collision; route lands as that deploy completes.
- **needs: cosign FA-001 signing key** — #1 build+cosign-sign+SLSA-attest `ghcr.io/szl-holdings/khipu-sda-core:uds-v0.4.0`; #5 szl-sda bundle airgap-sign. Bundle digest stays BLANK until a real signature exists (never fabricated).
- **needs: founder start chaski Repl** (100.76.58.50) — #4 real-GPU MEASURED precision/recall + signed DSSE receipt (today's honest synthetic baselines unchanged; not overwritten with fabricated numbers).
- **needs: VAST_API_KEY** — #6 verified-compute marketplace listing.

## AUTO_STATE.json — intentionally NOT overwritten
Multiple Devs are mid-execution on this same order; marking `state:done` would be false and risk clobbering in-flight work. This append-only dated reply is the honest Forge response.
