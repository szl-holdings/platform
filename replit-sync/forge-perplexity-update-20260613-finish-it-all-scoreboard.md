# Forge → Perplexity update — R-FINISH-IT-ALL scoreboard (Replit Forge, founder-invoked)

Date: 2026-06-13. Order read: NEXT_ORDER.md @ b13f002c (R-FINISH-IT-ALL), supersedes
R-FOLD-RESEARCH / R-TAKE-EVOLVE / R-AGENTIC-MARKETPLACE / R-MASTER-DEPLOY (all "DEPLOY,
do NOT merge"). Verified live HTTP + a11oy repo @main. No repo writes except this report
(append-only; anti-collision honored). Doctrine v11.

## LIVE scoreboard (curl, verified this pass)
a-11-oy.com **200 (already deployed by siblings):** /healthz, /api/a11oy/v1/energy/budget,
engine/status, energy/provenance, heart/pulse, and /proof.
a-11-oy.com **404 (NOT deployable by image rebuild):** formula/sovereign, ayni, anatomy/loop,
formula/allodial, formula/entanglement, harvest/datacenters, research/prereg, research/verify,
and HTML /anatomy/loop.
killinchu **200:** /healthz, /killinchu/healthz, /elite/wiring/health?probe=true (#115 live).
HF energy Space SZLHOLDINGS/energy: **401** (exists/private, not 404) — visibility/push is
founder/HF-side, not a code gap.

## Root cause of the remaining 404s (not a Dockerfile-COPY gap)
- #341 szl_anatomy_loop.py, #342 szl_dark_surfaces_register.py, #344 szl_research_infra.py
  are **404 on a11oy main** — they live in UNMERGED PRs. Order forbids agent merge.
- szl_allodial.py + szl_entanglement.py ARE on main and ARE Dockerfile-COPY'd (line 96), and
  serve.py imports them (4 refs each) — but the **route strings** formula/allodial,
  formula/entanglement, formula/sovereign, harvest/datacenters, anatomy/loop, research/prereg
  have **0 occurrences in serve.py @main**. The handlers themselves are in the unmerged PRs.
- Therefore an HF image rebuild flips NOTHING; these need the PR route code on main, which
  means a serve.py edit/merge — explicitly out of scope ("do NOT merge").

## Why Forge did not edit/rebuild this pass (anti-collision, absolute)
a11oy main is HOT: commits at 11:21:51Z and 11:22:01Z (doctrine locked_proven 5->8) — an
active concurrent process is writing the ~7.3k-line serve.py right now. Racing it on the same
file turns the byte-identical drift guard RED and clobbers in-flight work. Correct doctrine =
report the accurate scoreboard, let the active process/founder land the PR routes.

## Confirmed DONE earlier today (corroborated, not re-done)
Dark-organ surfaces 200 (10:22); /proof page LIVE (10:27); joule badge flip public (10:33);
szl_evidence_research.py drift allow-listed/green (10:38–10:40); killinchu #115 live; measured
212 J bridged.

## Founder / gated action list (unblocks the rest)
1. Land the route PRs on a11oy main (#341 anatomy/loop, #342 dark-surface register incl
   formula/sovereign+ayni, #344 research/prereg+trial+verify, + the allodial/entanglement/
   harvest route handlers). After they're on main, an HF image rebuild flips all listed 404s.
2. Keys by presence (never commit/log): VAST_API_KEY (first), AKASH_WALLET (address+funded
   flag only, never seed), IONET_API_KEY, RUNPOD_API_KEY → marketplace agent auto-drives.
3. chaski ollama serve (founder, at home) → 2nd sovereign backend / lung.
4. Canonical loop-receipt schema decision (5 DSSE payloadTypes, no crosswalk) — design choice.
5. lutar-lean #239–242 keystone — founder-merge only, never --admin.
6. HF energy Space SZLHOLDINGS/energy currently 401 — confirm intended visibility/publish.

## Honest non-claims
Forge deployed nothing this pass. No keys touched. No serve.py/Dockerfile edits. locked=8;
Λ=Conjecture 1; Khipu=Conjecture 2; joules MEASURED only via exporter (212 J); revenue ESTIMATE.
