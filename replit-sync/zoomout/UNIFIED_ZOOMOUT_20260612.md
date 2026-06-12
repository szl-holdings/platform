# Unified Zoom-Out — debug, stress-test, align, unify, evolve (2026-06-12)

**Author:** Perplexity Computer (CTO agent) · with Opus 4.8 (analysis) + web research · **Doctrine:** v11

This consolidates the UDS/Zarf/Pepr stress-test, the Opus architectural zoom-out
(`OPUS_ZOOMOUT.md`), and the market-leaders benchmark (`LEADERS_RESEARCH.md`)
into one honest action plan. Nothing here overclaims; locked=8, Λ=Conjecture 1,
Khipu BFT=Conjecture 2, SLSA L1 honest, open-weight only, killinchu effector
SIMULATED.

## 1. Stress-test results — what was actually broken (and now fixed)
- **UDS bundles + Zarf YAML:** all 7 bundle/zarf manifests parse clean. The one
  "bad parse" was the Helm template (`{{ }}` directives — expected). **No bug.**
- **Pepr governance capability:** a clean checkout **could not build** —
  `typescript@6.0.3` conflicted with `pepr@1.2.1`'s `^5.8.3` peer (ERESOLVE), and
  `build` used `pepr@latest` (drift). **FIXED + MERGED (szl-uds-deployment #82):**
  TS→^5.8.3, pepr pinned to 1.2.1. Now `npm install` clean + `npm run build`
  SUCCEEDS — both a11oy/killinchu receipt-gates compile + register. This was a
  real latent deploy-mesh breakage.
- **Real-cluster Prove Bundle Install:** dispatch-only; root cause (sh-vs-bash
  pipefail) already fixed (#81). Not a main-CI blocker.

## 2. Unify verdict — keep two apps, extract `szl_core` (Opus + doctrine agree)
**Do NOT full-merge a11oy and killinchu.** Process separation IS the
LIVE-vs-SIMULATED safety boundary — merging risks a SIMULATED effector riding a
surface that emits LIVE labels. Instead extract a shared, semver-pinned
`szl_core` library both apps import:
- `szl_core.verticals` (the 5 live feed adapters — one cache + rate-limit budget)
- `szl_core.receipts` (DSSE build/verify, one canonical schema)
- `szl_core.health` (health-label-from-URL — a label never means two things)
- `szl_core.connectors` (shared auth/retry/source-registry)
- `szl_core.governance_client` (produces receipts the Pepr gate accepts)
**killinchu effector stays OUT of szl_core** — SIMULATED enforced structurally.

## 3. Stale / duplicate cleanup
- `organs/amaru/.hf-mirror/serve.py` (94 KB) = **almost certainly stale committed
  mirror.** Make mirrors generated + git-ignored, CI fails if a committed mirror
  reappears. Verify import target before delete. Low risk, high hygiene.
- The 470 KB root `serve.py` = **serialized, single-owner, lock-held refactor**
  into `szl_core` + thin entrypoint, small PRs, per-step snapshot tests. NOT a
  big-bang (it's live + double-mirrored + cosign-signed).

## 4. Adopt from the leaders (benchmark — honest, not a parity claim)
SZL's open-data + policy + proof stack is **already best-in-class** where it
counts: CourtListener (gold-standard open court data), NYC HPD/DOB + Federal
Register (best open civic data), **Pepr** (legitimate DoD-adjacent admission
leader), **Lean 4 + Mathlib** (the most active formal-methods community on
earth). Real upgrades to adopt:
1. **Finance data lineage:** `yfinance` is community/unofficial — for production
   add **Polygon.io** (official API, WebSocket live ticks) and **Frankfurter**
   (ECB-backed FX) / Alpha Vantage. Keep yfinance as labeled fallback.
2. **SLSA L1→L2/L3 (honest path):** wire **`slsa-github-generator`** into Actions
   (2–3 lines) to emit Build-L3 provenance to Rekor, and add **cosign
   verify** gates so no unsigned image deploys. Only THEN may L2/L3 language be
   used — and only after a real attestation verifies. Pairs with the Pepr P1.
3. **Continuous SBOM:** **Syft + Grype** (already partly present) → ingest into
   **Dependency-Track** for continuous component risk, not just advisory pulls.
4. **Legal canonical source:** add **GovInfo API** (GPO-signed) alongside the
   Federal Register feed for canonical documents.

## 5. Top moves, owned (ranked by leverage)
| # | Move | Owner | Honest "done" |
|---|---|---|---|
| R1 | Extract `szl_core` (verticals/receipts/health/connectors/gov-client) | Forge-box | both apps import it; feed responses byte-identical (golden tests); killinchu effector excluded |
| R2 | De-commit `.hf-mirror`; mirrors generated + CI-guarded | Forge-box | committed mirror gone; live Space imports real source |
| R3 | Pepr P1: real single-key DSSE verify in receipt gates | math-team + Forge-box | tampered/unsigned DENIED in test cluster; labeled "single-key; threshold P2/ledger P3 roadmap" |
| R4 | `serve.py` god-file → modules (serialized, lock-held) | one designated owner | thin entrypoint; route surface preserved per PR |
| R5 | SLSA L1→L3 via slsa-github-generator + cosign verify gate | Forge-box + founder (cosign key) | real L3 provenance in Rekor; verify gate blocks unsigned; only then L2/L3 wording |
| R6 | Finance: add Polygon + Frankfurter, label yfinance fallback | Forge-box | live ticks from official API; freshness labels honest |
| R7 | Box dispatch wiring (`FORGE_DISPATCH_CMD`) | founder (box) | dispatch_ok:true; loop hands-off (WIRE_IT_UP.sh ready) |

**Done this pass (agent):** Pepr build fix (#82, merged). Everything else is
filed to Forge (R1–R4, R6) or founder-gated (R5 cosign key, R7 box). No item
violates Doctrine v11.
