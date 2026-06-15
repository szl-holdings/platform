# ▶ TOP POINTER — UDS ECOSYSTEM DEPLOY + COSIGN HANDOFF (2026-06-15 19:24 ET)

**Warhacker 50-pt CAPSTONE.** The four UDS technical lanes are DONE + validated. The box-side deploy
order is now live:
→ **`replit-sync/FORGE-INSTRUCTION-uds-ecosystem-deploy-20260615-1924.md`** (commit fb7b0e20).

It contains: exact `uds create`/`uds deploy` for a11oy.uds + killinchu.uds + energy.uds + the air-gap
k3d/uds-core mesh bring-up, the warhacker umbrella recut, and a clear AUTOMATABLE-BY-FORGE vs
FOUNDER-GATED split (cosign sign FA-001 + energy image publish + NVML). Judge-facing scoring map +
demo runbook: `team/AUDIT/uds/WARHACKER_SCORING_NARRATIVE.md`.

DO ORDERS 1–3 (non-secret) NOW; leave ORDER 4 (FA-001 sign / image publish / NVML) BLOCKED-on-founder
with the exact one command. Doctrine v11 hard: SLSA L1/L2/L3-roadmap ONLY; effectors SIMULATED;
joules SAMPLE until NVML; tamper-EVIDENT; never commit a key; never fake a signature or a joule;
honest BLOCKED beats fake green; the half-state is the only unacceptable outcome.

---

# FORGE MASTER ORDER — 2026-06-15 15:25 ET (founder: Stephen) — SUPERSEDES 1520

Doctrine v11 throughout. Never fabricate a 200 / receipt / joule / digest / signature. joules MEASURED only via real NVML. Λ = Conjecture 1 (advisory, never "proven trust"). Never touch lutar-lean (keystone). Honest BLOCKED beats fake green. NEVER bypass Banned-token / doctrine CI gates — fix wording instead. Never commit a key into the repo (env/secret store only).

### FOUNDER GREEN LIGHT ON SIGNING (NEW — 2026-06-15 15:25 ET)
The founder has authorized cosign signing of ALL bundles: verbatim "I signed them all green light have it done yes do it." Therefore the cosign-sign step is NO LONGER founder-gated. You MAY now run the full sign-AND-publish path using the box-resident cosign key (COSIGN_KEY env / box secret store). RULES:
- Use the key from the box env/secret store ONLY. NEVER print it, NEVER write it into a repo file or log.
- Sign ONLY bundles you actually recut + prove-installed this run. NEVER sign a bundle you did not build. NEVER fabricate a signature or a "verified" line.
- After signing, PROVE it: run `cosign verify` (or `gh attestation verify`) against the pushed OCI ref and paste the REAL verify output. If the key is NOT present on the box, do NOT fake it — report `BLOCKED-cosign-key-not-on-box` with the exact command the founder would run, and still deliver the prove-installed unsigned bundle. Honest beats fake.

GROUND TRUTH (CTO verified live — do NOT re-block what's already done):
- jtoken ALREADY MEASURED (200, label=MEASURED). Keep it; add staleness guard (see ORDER B).
- chaski ALREADY reachable on fabric (compute-pool, gpu_nodes_reachable=2). Real gap = make it a 2nd ENERGY-producing lung (see ORDER A).
- Real deployable bundles live in szl-uds-deployment/bundles/: szl-warhacker, szl-full-stack, szl-uds-bundle, a11oy, killinchu, energy, prove-organs.

================================================================
ORDER A — CHASKI SECOND ENERGY LUNG (auto-arm on Repl boot)
================================================================
[unchanged from 1520 — restated so this file is self-contained]
GOAL: when founder boots the replit-chaski Repl, the energy operator auto-detects chaski (health-gate GET http://100.102.173.88:11434/api/tags == 200 w/ models) and dispatches MEASURED inference jobs to it as a 2nd lung; receipts node=chaski chain into the SAME ledger. If chaski down → clean `offline`, rtx keeps computing, NO alarm. Reversible env flags A11OY_ENERGY_CHASKI_ENABLED=1 + A11OY_ENERGY_CHASKI_URL, persisted so it survives box restart.
HONEST joules: only label chaski joules MEASURED if a real per-job energy reading exists for chaski; else joules_label=MODELED-PER-TOKEN with joules_source=modeled-from-fabric-coefficient. NEVER fake MEASURED.
PROVE: operator/status shows chaski in nodes_computing when reachable + jobs_done climbing; ledger shows ≥1 node=chaski receipt with honest label. If Repl not booted = "armed, waiting-for-boot" = SUCCESS.

================================================================
ORDER B — JTOKEN: KEEP MEASURED + STALENESS GUARD
================================================================
jtoken is already 200+MEASURED. Add guard: if NVML source goes stale (>N s no read), endpoint says label=MEASURED-STALE w/ last-good ts — never silently flip to ROADMAP, never fabricate fresh numbers. Confirm survives box restart. Paste live JSON.

================================================================
ORDER C — FULL-ESTATE UDS RECUT + SIGN + PUBLISH (TIERED)
================================================================
Recut from CURRENT main, prove-install into a clean k3d cluster, then SIGN (founder green-lit) + publish, for the real bundles below. Fresh package digests + fresh OCI ref each. Un-stage any STAGED member apps (esp. a11oy + killinchu) so they ship as REAL packages. Run the OCI-ref + digest guard checks (scripts/uds-bundle-publish-guard-checks.sh).

*** TIER 1 — MUST LAND, BLOCKS THE DEMO (do FIRST, never let Tier 2 delay it) ***
  1. szl-uds-deployment/bundles/szl-warhacker — THE June-18 demo bundle. Un-stage a11oy+killinchu → real packages. Fresh digests + OCI ref. prove-bundle-install into k3d → in-cluster health 200. cosign sign + cosign verify (paste real verify). Update UDS_DEPLOY_RUNBOOK.md `uds deploy` one-liner with the fresh signed OCI ref + digest.

*** TIER 2 — ESTATE COMPLETENESS (only AFTER Tier 1 is fully DONE) ***
  2. szl-uds-deployment/bundles/szl-full-stack  (the 5-flagship)
  3. szl-uds-deployment/bundles/szl-uds-bundle   (the published umbrella — currently ghcr tag uds-v0.2.1 / 0.4.0; recut to a fresh tag from current main)
  4. szl-uds-deployment/bundles/a11oy
  5. szl-uds-deployment/bundles/killinchu
  6. szl-uds-deployment/bundles/energy
  7. szl-uds-deployment/bundles/prove-organs
  Each: recut from current main → fresh digests + OCI ref → prove-install in clean k3d (health 200) → cosign sign + verify (paste real output) → note the deploy one-liner.

HARD RULE: Tier 2 NEVER delays Tier 1. If you run low on time/cycles, ship Tier 1 fully (signed+verified+runbook) and report each remaining Tier-2 bundle honestly as `recut-pending` / `prove-installed-unsigned` / `signed` — whatever its TRUE state is. Per-bundle honest status, no blanket claims.

DO NOT: sign a bundle you didn't build this run; claim a verify you didn't run; un-stage by faking a package; bump anything in lutar-lean; touch locked-claim files (data.js) to inflate counts.

================================================================
REPORT
================================================================
Append a dated section to replit-sync/forge-perplexity-update-20260615.md. For ORDER A, B: DONE / armed / blocked + real probe output. For ORDER C: a per-bundle table — bundle | recut(y/n) | fresh OCI ref+digest | prove-install health | signed(y/n) + real cosign verify line | deploy one-liner. Update replit-sync/AUTO_STATE.json uds section with Tier-1 result first. Honest doctrine v11. Per-bundle truth only — never a blanket "all signed" unless every line truly is.
