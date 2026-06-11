# FORGE INSTRUCTIONS — gated items only (CTO did everything else with admin)
**Issued:** 2026-06-11 ~13:55 EDT (T-5 to Warhacker). From CTO (Computer) for founder Stephen P. Lutar Jr.

## WHAT THE CTO ALREADY DID (do NOT redo — verify only)
- 6 SZL counter-UAS formulas (`szl_cuas_formulas.py`) authored, self-test 12/12, pushed byte-identical to a11oy + killinchu (blob `88678c2d`) + replit-sync.
- 6 living-3D tabs (Intercept Solver, Spoof Sentinel, Fusion Picture, Swarm Mesh [Anvaka galaxy], Threat Triage, PQ Provenance) wired live on both apps, Playwright-verified, all /v1/cuas/* endpoints 200.
- Namespace-title fix applied (a11oy no longer mislabels as "killinchu") — verified live.
- GitHub↔HF byte-identical confirmed across ALL shared modules on both apps; both drift guards GREEN.
- Both Spaces factory-restarted + RUNNING. a11oy #304 already closed. UDS bundle inherits the modules from the app images (Dockerfile COPY) automatically.

## FORGE: ONLY THESE REMAIN (all FOUNDER-GATED — need a human secret/approval; never auto)
1. **GHCR push token** → rebuild + push the a11oy + killinchu GHCR images (uds-v0.2.0) so the new modules ship in the UDS payload and the Hetzner autodeploy can pull them. This is the single biggest unlock: it propagates szl_cuas_formulas.py + the unified module into the air-gapped UDS bundle and a11oy.net. Until the token lands, the `Build image + SBOM` + `GHCR Build+Push` reds are EXPECTED, not real failures.
2. **Hetzner root redeploy** (167.233.50.75): after the GHCR image rebuilds, run `curl -fsSL .../ops/install-a11oy-autodeploy.sh | sudo bash` (or the existing autodeploy) so a11oy.net serves /api/a11oy/v1/cuas/*. FOUNDER runs this — do not auto.
3. **Zenodo DOI token** → mint the DOI for the v8 canonical thesis (`szl-papers/papers/SZL_THESIS_v8.md`, CITATION.cff + .zenodo.json already staged for v8). One mint = one authoritative DOI.
4. **oqs-python PQ keys** → flips the PQ Provenance tab signature from honest PROXY to a real ML-DSA-65 signature. Wire ML-KEM-768/ML-DSA-65/SLH-DSA per NIST FIPS 203/204/205 when the key material is provided.
5. **cosign/Rekor** (uds-v0.3.0 re-sign), **SZL_LOCAL_LLM_URL** (Chaski stub→live), and any MAJOR dep bump — STOP and notify founder.

## FORGE: ONE ONGOING TASK (you CAN do, env-gated only)
- **platform vitest/E2E** if any reds recur: run the toolchain locally, fix real errors (node16/nodenext `.js` extensions), keep green. (CTO confirmed platform is currently clean.)
- **UDS mesh** (szl-mesh / szl-fleet-overlay): if the mesh service map advertises app endpoints, register the new /v1/cuas/* routes so meshed nodes discover the counter-UAS C2 surface. Effector stays SIMULATED across the mesh.

## DOCTRINE (unchanged): locked-8 EXACT @ c7c0ba17 · Λ=Conjecture 1 · Khipu=Conjecture 2 · effector SIMULATED · 0 runtime CDN · trust never 100% · no user-visible codenames (agent=Chaski) · cite classical inspirations, claim none as ours · byte-identical shared modules · ast.parse before push · NEVER commit a key · NEVER weaken a gate · no fabricated data.

Report any action to platform/replit-sync/FORGE-RESULT-*.md. Honesty over checklist.
