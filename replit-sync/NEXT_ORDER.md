# NEXT_ORDER — Perplexity → Forge (2026-06-12 ~1:16 ET)

Consolidated. The verticals are confirmed serving REAL live web data (verified
externally: defense KEV/NVD, finance Yahoo/Coinbase/FX, cyber KEV/NVD/GitHub,
realestate HPD/DOB/Treasury, legal Federal Register — 24 live sources, 0 stale).
The probe now VERIFIES this freshness (committed: replit-sync/health/chaski_probe.py).
Items below.

## 1. Deploy mesh-resilience backend (carryover from order 3bb20688)
- `apps/mesh-resilience/` — cache-backed FastAPI, verified working. Run on :8081,
  surface at `/api/a11oy/v1/mesh-resilience/*`, systemd-persist. Mandatory
  measured-simulation / OPEN-hypothesis labels (already in responses). No new keys.

## 2. Merge the two ready PRs
- **lutar-lean#238** (The Relational Mesh, keystone) — now FULLY CI-GREEN (title-lint
  fixed). Run your keystone gate and merge.
- **szl-mesh#6** (Spec 08) — only the DCO Trailers check is red; the commit HAS a
  valid `Signed-off-by: stephenlutar2-hash <stephenlutar2@gmail.com>`. Likely a
  squash-base/parent quirk. Re-sign/rebase as needed and merge.

## 3. CourtListener (legal vertical) resilience — box-side
- The legal vertical's `court_filings` (CourtListener v4) intermittently reports
  `unavailable` on the live box, BUT the exact URL our code builds returns HTTP
  200 with 7106 results from MY network. So the source + our URL are FINE — the
  box's outbound call is failing intermittently (likely UA block, rate-limit, or
  too-tight timeout). Fix on the box: (a) raise the CourtListener fetch timeout,
  (b) add a polite UA + a short retry/backoff, (c) on failure keep serving the
  last good cached result with an honest `stale` label instead of `unavailable`.
  Federal Register stays live regardless, so legal never goes fully dark.

## 4. Wire live-source counts into the digest (nice-to-have)
- The upgraded probe reports per-vertical live/stale/unavailable counts. If you
  surface a verticals card on a11oy, show those counts + freshness — honest,
  real, and it makes a degraded source visible immediately.

## Honesty floor (v11)
locked=8 · Λ=Conjecture 1 · Khipu BFT=Conjecture 2 · SLSA L1 · open-weight serving
only · killinchu SIMULATED · all vertical data carries honest live/stale/unavailable
freshness labels — never fabricate freshness · "live" requires a real fetch · never
commit a key · no Lean self-merge beyond your gate. Skip+report anything founder-gated.
