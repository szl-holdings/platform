# NEXT_ORDER — Perplexity → Forge (2026-06-12 ~17:21 ET)

Full estate zoom-out done (Opus 4.8 + web-leaders benchmark + UDS/Zarf/Pepr
stress-test). Plan: replit-sync/zoomout/UNIFIED_ZOOMOUT_20260612.md. Prioritized
dev work below. ALL doctrine-clean (locked=8, Λ=Conj1, BFT=Conj2, SLSA L1,
open-weight only, killinchu effector SIMULATED). Do what you can on the box;
gated items report honestly.

## DONE by agent (FYI): szl-uds-deployment#82 merged — Pepr governance capability
fresh build was BROKEN (typescript@6.0.3 vs pepr peer ^5.8.3; build used
pepr@latest). Fixed: TS→^5.8.3, pinned pepr@1.2.1. npm install + pepr build now
clean (both receipt-gates compile). Re-verify on your side if you redeploy Pepr.

## R1 (highest leverage) — extract szl_core shared library
verticals / receipts / health / connectors / governance_client — both a11oy +
killinchu import it; delete duplicated a11oy_vertical_feeds + shared connector
code from app trees; feed responses must stay BYTE-IDENTICAL (golden-file tests).
killinchu effector stays OUT of szl_core (SIMULATED enforced structurally).

## R2 — de-commit the stale mirror
organs/amaru/.hf-mirror/serve.py (94KB) is a stale committed mirror. Make mirrors
generated + git-ignored; CI fails if a committed mirror reappears. Verify the live
Space imports the real source before deleting.

## R3 — Pepr P1: real single-key DSSE verify in the receipt gates
Implement actual signature verify in a11oy/killinchu-receipt-gate.ts; tampered/
unsigned receipt => admission DENIED (negative+positive tests in a test cluster).
Label EXACTLY "single-key DSSE verified; threshold=P2 roadmap, ledger=P3 roadmap"
— do NOT claim threshold or ledger. Keys via Zarf, NEVER committed.

## R4 — serve.py god-file (470KB): SERIALIZED single-owner refactor into szl_core
Hold an exclusive refactor lock (no parallel edits — it's live + cosign-signed +
double-mirrored). Small PRs, each preserving the route surface, per-step snapshot
tests. NOT a big-bang.

## R6 — finance data lineage
Add Polygon.io (official API + WebSocket live ticks) and Frankfurter (ECB FX)
alongside Coinbase; keep yfinance as a LABELED fallback (it's unofficial). Honest
freshness labels as always.

## Gated (report, don't fake): R5 SLSA L1->L3 needs cosign key (founder); R7 box
dispatch wiring needs /etc/forge-perplexity.env (founder — WIRE_IT_UP.sh ready).

## Honesty floor (v11): never keystone self-merge, never commit a key, never weaken
a gate, label live only on real 200, locked=8, Λ=Conjecture 1, BFT=Conjecture 2.
