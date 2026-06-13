# NEXT_ORDER — Perplexity → Forge (2026-06-13 ~04:45 UTC / 2026-06-13 00:45 ET)

Full estate overhaul for the June 18 demo is underway on the Perplexity side (4 new/elevated
front-end surfaces built as previews: SZL landing, killinchu site, the 3D Verification Sky, and
"Verify it yourself" hero features — all honest, 0 runtime CDN, CTO doctrine-clean). Founder will
run the box GPS step at home. Forge: align the BACK ENDS + do the box/Space deploys when the box
step is done. Doctrine v11 throughout (locked=8, Λ=Conj1, BFT=Conj2, SLSA L1, effector SIMULATED,
no fabricated data, byte-identical shared modules). Box/Hetzner prod = founder-approved (granted for R0).

## R0 (URGENT, unchanged) — a11oy.net sovereign OVERCLAIM half-state. Honest fix = redeploy current
a11oy main (#324/#327 already make it honest) + sudo a11oy-rebuild (no GPU needed). Optional sovereign
upgrade: serve open-weight model on betterwithage + set A11OY_MODEL_BASE_URL/A11OY_GPU_LABEL(/A11OY_GPU_TOKEN
for vLLM) + rebuild. Proof: healthz base_url=LOCAL (not router), sovereign:true, chat turn = local tag, no cost_usd.
## R0b — #323 autodeploy loop + commit real a11oy-rebuild to ops/.
## R7 — run WIRE_IT_UP.sh AS ROOT on 167.233.50.75 + /etc/forge-perplexity.env (unblocks hands-off dispatch).

## NEW — BACK-END ALIGNMENT FOR THE OVERHAUL (Forge, in priority order)
B1. szl_core shared library (was R1): extract verticals/receipts/health/connectors/governance_client used by
    BOTH a11oy + killinchu; feed responses BYTE-IDENTICAL (golden-file tests); killinchu effector stays OUT
    (SIMULATED enforced structurally). This is the back-end the new front-ends + hero features read from.
B2. PUBLIC VERIFY API (powers the new "Verify it yourself" + self-verifying permalink + Sky): ensure a stable,
    CORS-enabled, read-only endpoint set the static sites can call from a browser:
      - a11oy: /api/a11oy/v1/{honest,formulas,gates,qbio/lambda,qbio/summary,ledger}
      - killinchu: /api/killinchu/v1/{honest,...}, /counter-uas/evaluate, /khipu/sign|verify, /receipt/export
    Add permissive CORS (GET) + a canonical receipt-bytes endpoint /receipt/<id>/canonical so a visitor's browser
    can re-hash and MATCH. Every field LABELED; never fabricate. (The static sites ship a SAMPLE fallback, but
    LIVE is far better for the demo — make the browser-fetch path work.)
B3. killinchu drones&vessels data: confirm the real protocol decoders (Remote ID/ADS-B/MAVLink) + 53 fingerprints
    + maritime/vessel fusion endpoints return honest live/SAMPLE-labeled data for the new killinchu site to embed.
B4. When founder approves publish: deploy the 4 static sites to their homes (szlholdings-site for the landing;
    a new killinchu site host; verify.szlholdings + sky as Spaces/Pages) and point domains. Wire the cross-links +
    swap the verify QR placeholder to the real published URL. (Front-end source will be handed over / in repos.)
B5. HF Space deploys: when console/back-end changes land, NDJSON-commit byte-identical + factory restart + verify
    live oid==blob sha (the CI mirror sometimes skips republish).

## CARRIED: R2 de-commit stale .hf-mirror/serve.py; R3 Pepr real single-key DSSE verify (label "single-key DSSE
verified; threshold=P2 roadmap, ledger=P3 roadmap"); R4 serve.py serialized refactor into szl_core (exclusive lock,
small PRs); R5 SLSA L1->L3 needs cosign key (founder); R6 finance lineage (Polygon.io + Frankfurter, yfinance LABELED).

## Honesty floor v11: never keystone self-merge, never commit a key, never weaken a gate, label live only on real
200, locked=8, Λ=Conjecture 1, BFT=Conjecture 2, effector SIMULATED. NOTE: the LIVE consoles are cosign-signed +
double-mirrored — the founder/CTO has DEFERRED a visual console restyle until after June 18; do NOT restyle /console
or /elite now. Back-end + box + deploys only.
