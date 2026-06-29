# Forge (Replit, founder-invoked) — GitHub sweep + szl-mesh CI fix

**Founder order:** "check GitHub for Perplexity→Forge instructions, handle all issues + all notifications/inbox — all of it."
**Doctrine v11:** no fabricated sigs/numbers, no key committed, gated items flagged `needs:` not faked. Append-only; AUTO_STATE.json (current @ c49ff872) and forge-perplexity-update-20260614.md (auto-loop owned) left untouched.

## Perplexity → Forge order state
- Latest NEXT_ORDER.md = **c49ff872** (szl-mesh alignment + keep-it-live). AUTO_STATE = done, order_sha matches HEAD. Order is explicitly REPORT-not-execute until dispatch on; founder invoked execution directly.

## INBOX / NOTIFICATIONS
- **0 unread** (a sibling cleared 24 ci_activity threads at 23:58Z; re-confirmed still 0). Nothing to do.

## CHASKI — LIVE
- `replit-chaski` tailnet node ONLINE (tailscale v1.98.4, userspace, workflow "Chaski Tailnet Node"). Pings a11oy-box (direct) + betterwithage GPU (DERP). Duplicate stale device deleted via TAILSCALE_API_KEY → exactly one clean node. Honest caveat: up only while the Repl/workflow runs; re-registers IP on cold start (not always-on metal).

## szl-mesh alignment (order item #1) — REAL FIX
- **szl-mesh main CI was RED**: green @ eeb0a154 (23:21Z) then FAILED @ merge 340b3dc3 (23:58Z, "Merge dev2/quorum-wiring"). Root cause = **DCO Trailers only** — the merge commit carried no `Signed-off-by:`. All other jobs (Proto Lint, hello-mesh Smoke, Markdown Lint, SLSA L1) passed; quorum code unaffected.
- **Fixed honestly**: forward DCO remediation commit **dc87aa0d** (docs note in `src/szl_mesh/_vendor/PROVENANCE.md` + proper sign-off). No history rewrite of protected main, no force-push, gate NOT weakened (no test disabled, no bot-skip widened). szl-mesh main CI now **GREEN, all 5 jobs success**.
- **Correction to the 00:12Z mosaic report**: a11oy `copy-sync lockstep guard` is **GREEN on main (58d0cd4a)**. The "RED on af363cf4" is branch `ci/lockstep-trip-test` — the *by-design negative-fixture* branch that is SUPPOSED to trip the guard (proves it works). Not a regression. killinchu lockstep green too.
- HF/overlay: killinchu Space on f92d9ee (mesh routes 200, /elite/mesh 200) per 00:12Z report; not re-raced.

## ISSUES (12 open org-wide) — triaged, corroborated
Founder-gated (report-only, correctly waiting on founder, NOT faked):
- szl-doctrine#3 (SECRET_HEALTH_TOKEN least-priv PAT), .github#48 (DOCS_AUTOMATION_TEAM_READ_TOKEN PAT), platform#347 (chaski HF-Space activation secrets + scaling merges), platform#313 (HF web-UI domain/Space ops), platform#312 (legal: keep-proprietary vs relicense).
Auto-managed / tracker (by design, leave open): .github#158 (rolling CI Health Digest), platform#338 (FORGE master directive tracker), .github#92/#93 (synthesis / SLSA truth-correction), ouroboros#47 (ClusterFuzzLite toolchain), yarqa#1 (yarqa LIVE 0.4.0; wiring carryover).
Real open incident (honest, needs investigation — not false-closed): **a11oy#325** HF Corpus Re-verify — a SIGNED published receipt no longer re-verifies; requires real corpus/signing investigation, not a sweep close.

## Reachability
a-11-oy.com/healthz 200 · szl-mesh main CI GREEN (run 27483506146) · killinchu /elite/mesh 200 · inbox 0 unread.