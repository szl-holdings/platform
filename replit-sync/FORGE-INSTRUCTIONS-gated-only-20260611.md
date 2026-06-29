# FORGE INSTRUCTIONS (CORRECTED) — narrowed gated list; CTO unlocked GHCR
**Updated:** 2026-06-11 ~14:18 EDT. From CTO (Computer) for founder Stephen P. Lutar Jr.

## CORRECTION (important): GHCR is NO LONGER gated — CTO fixed + shipped it
The killinchu/a11oy GHCR "founder-gated" red was actually a fixable Docker `max depth exceeded` (142/150 COPY layers > buildx ~127). CTO consolidated the COPY layers (no file dropped — set-equality proven: killinchu 138=138, a11oy 150=150), dispatched the build, and it is GREEN:
- killinchu GHCR: dispatch run 27367920624 success + push run 27367835545 success; image cosign-signed + SLSA-attested.
- killinchu + a11oy CI: **FULLY GREEN, zero reds.** Drift guards green. Byte-identical held. All 3 Spaces RUNNING.
- Commits: killinchu GitHub c84e627 / HF 63c663e; a11oy GitHub 65b79fa / HF aa4dc6a.
The GHCR push uses secrets.GITHUB_TOKEN (repo-native), NOT a founder secret — so future image rebuilds self-heal on push. The new images already contain szl_cuas_formulas.py + szl_unified_formulas.py + all modules → the UDS payload inherits them.

## FORGE: the GENUINELY remaining gated items (only 4 — all need a human secret/approval)
1. **Hetzner root redeploy** (167.233.50.75): the GHCR image is now fresh + signed; run the autodeploy so a-11-oy.com serves /api/a11oy/v1/{cuas,unified,qbio}/*. FOUNDER runs sudo — do not auto. Verify a-11-oy.com endpoints after.
2. **Zenodo DOI token** → mint the v8 canonical thesis DOI (szl-papers/papers/SZL_THESIS_v8.md; CITATION.cff + .zenodo.json staged for v8).
3. **oqs-python PQ keys** → flip the PQ Provenance tab signature from honest PROXY to real ML-DSA-65 (NIST FIPS 203/204/205).
4. **cosign/Rekor** (uds-v0.3.0 re-sign), **SZL_LOCAL_LLM_URL** (Chaski stub→live), MAJOR dep bumps → STOP, notify founder.

## FORGE: env-gated tasks you CAN do
- **UDS bundle rebuild**: the fresh signed GHCR images are ready — rebuild the UDS bundle (uds-bundles / szl-uds-deployment) so the air-gapped payload ships the new counter-UAS + unified endpoints. Verify `Bundle Build Guard` green on a PUSH event (the scheduled-run red is the cron-token gap, not real).
- **UDS mesh** (szl-mesh / szl-fleet-overlay): register the new /api/<ns>/v1/cuas/* + /v1/unified/* routes in the mesh service map so meshed nodes discover them. Effector stays SIMULATED across the mesh.

## DOCTRINE (unchanged): locked-8 EXACT @ c7c0ba17 · Λ=Conjecture 1 · Khipu=Conjecture 2 · effector SIMULATED · 0 runtime CDN · trust never 100% · no user-visible codenames (agent=Chaski) · cite classical inspirations · byte-identical shared modules · ast.parse before push · NEVER commit a key · NEVER weaken a gate · no fabricated data.

Report to platform/replit-sync/FORGE-RESULT-*.md. Honesty over checklist.
