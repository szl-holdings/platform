# FORGE MASTER ORDER — 2026-09-04

Supersedes the 2026-09-03 order. Archive that text in git history at SHA 43448395.

Doctrine v11 (hard): never fabricate a 200 / joule / receipt / signature / digest / label. Honest BLOCKED beats fake green. Never commit a key. Never weaken a required check to force a merge.

Authority: founder green-light via Grok GitHub session (`stephenlutar2-hash`). This session can write GitHub. It cannot operate the box, Tailscale, Cloudflare environment secrets, Neon approvals, or Hugging Face write tokens.

=================================================================
## CLOSED SINCE 2026-09-03 ORDER (do not re-queue)
=================================================================
- `.github#611` MERGED
- `a11oy#1745` MERGED 2026-09-03T22:00:55Z
- `a11oy#1747` MERGED 2026-09-03T22:03:04Z
- `david-leads#88` MERGED 2026-09-03T22:01:07Z
- `david-leads#92` MERGED 2026-09-03T22:18:19Z
- `a11oy#1738` / `#1739` / `#1740` and `.github#598` MERGED 2026-09-03
- `david-leads` GitHub description is now the live product sentence (not ARCHIVED hologram). MEASURED 2026-09-04.

=================================================================
## P0 — OPEN PRs (2 org-wide as of 2026-09-04T16:00Z)
=================================================================
1. `platform#739` feat(estate): bind PRISM Counsel to canonical SZL estate contract
   - mergeable_state=unstable
   - FAIL: Lint (oxlint + biome) on files NOT in the PR diff (hologram.js var-hoist, unused ouroboros imports, template-literal nits)
   - FAIL: Runtime Audit (audit:full) exit 1 — likely the generate-vuln-report.js verdict change vs pipeline expectation
   - DO NOT MERGE red. Either rebase onto a lint-clean main, or split the estate JSON onto a branch that does not carry the vuln-policy change, and land lint fixes as their own PR against main.
2. `platform#601` docs(series-a): reconcile protected promotion evidence
   - DRAFT + unstable. Keep draft until required checks are green. Docs-only; not a runtime blocker.

=================================================================
## P1 — LIVE BOX GAPS (MEASURED 2026-09-04 ~16:00Z from this session)
=================================================================
- `https://a-11-oy.com/` HTTP 200
- `/healthz` 200, doctrine v11 749/14/163, signer ABSENT / signing_available=false
- `/api/a11oy/v1/honest` git_sha=11ba481ea79b3f7d74348b740cc3cc2a363a7e23 (runtime moved past yesterday's a8d9ec95)
- `/api/a11oy/v1/energy/operator/status` running=false, jobs_done=0, nodes_computing=[]
- `/api/a11oy/v1/mesh-resilience/health` HTTP 404
- `https://www.a-11-oy.com/` TLS alert access denied (not an apex 404)

Founder-gated on the box (this session cannot do it):
- start the energy operator against REAL NVML or leave running=false honest
- install signer or keep ABSENT labeled
- restore mesh-resilience route or delete stale docs that claim it live
- Cloudflare www cert / redirect after #1745/#1747 token routing

=================================================================
## P2 — PUBLIC HONESTY ISSUES
=================================================================
Keep open until independently green:
- a11oy#1497 INC-05 — retitled; apex serves; www + HF READY unproved
- a11oy#1282 HF ecosystem manifest drift
- a11oy#1359 / #1350 HF frontend canary / viewport drift
- a11oy#1714 private security alert posture
- .github#617 PATCH remaining public-seven hologram labels (`szl-atelier` still archived AND listed)
- .github#158 CI health digest

Do not close #1497 as "apex 404 fixed" without a MEASURED www 301/302 to apex and a HF READY receipt.

=================================================================
## P3 — STILL NOT THIS SESSION
=================================================================
- OMEN tailnet / box SSH
- UDS/k3d co-resident deploy
- HF write / Space visibility
- Neon production approval
- lutar-lean edits

=================================================================
## VERIFY NEXT PASS
=================================================================
Report only MEASURED:
- org-wide open PR count
- #739 lint + audit:full conclusions
- apex / www / healthz signer / energy.running / mesh-resilience
- whether szl-atelier is still both archived and in the public seven
