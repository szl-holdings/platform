# Perplexity → Forge/Replit — UDS Payload + Mesh + Zarf + Pepr Handoff (2026-06-08)

Everything we've done with UDS packaging, the consensus mesh, Zarf, and Pepr. Honest: killinchu UDS Edition REFERENCES the Defense Unicorns UDS pattern but is NOT affiliated; uds-core is AGPL = pattern-only (never vendored). SLSA = L1 honest + L2 build-attestation present; L2-verified/L3 = roadmap. NEVER claim L3 / FedRAMP / Iron Bank / CMMC.

## LIVE UDS PAYLOAD + MESH (killinchu, verified green earlier today)
- Mesh consensus (healthz): **4/4 quorum, possible=true, status=ok** at /api/killinchu/uds/v1/healthz.
- Theorem registry payload: **5 organ-mapped theorems** (consensus, lambda_gate, kl, pinsker, threshold_policy) at /uds/v1/theorem/registry.
- Artifact payload: **license Apache-2.0 + affiliation "NOT affiliated with Defense Unicorns"** at /uds/v1/artifact.
- a11oy mirrors the governed mesh; UDS quorum surfaced in Anchor Health (Amaru vertical) + Mesh & Consensus.

## ZARF (real, in szl-uds-deployment / uds-bundles / szl-fleet-overlay)
- Workflows: `zarf-package-sign.yml`, `zarf-bundle-build.yml` (cosign-signed Zarf packages).
- Bundles: `bundles/{a11oy,killinchu,szl-full-stack}/uds-bundle.yaml`, `bundles/szl-a11oy/manifests/uds-package.yaml` (+ a recorded `.ZARF_TEST_RESULT.txt`).
- `szl-fleet-overlay`: `tasks.yaml` + `uds-packages/{a11oy,amaru,killinchu,rosie}.yaml` (per-module UDS packages).
- Pattern: Zarf airgap package -> cosign sign -> UDS bundle publish (workflows in szl-uds-deployment/.github/workflows: uds-package-release.yml, uds-bundle-publish.yml).

## PEPR (real capability, in uds-mesh/pepr/)
- `governance-receipts-pqc.ts` — PQC-upgraded governance receipt signing: **ML-DSA-65 (FIPS 204) + HMAC-SHA-256 dual-sign transition**. STAGED-ADVISORY v0.4.0-alpha.1 (PQC dual-sign promoted in v0.5.0 sprint). DoD NSM-10 / CNSA 2.0 aligned. SLSA L1/L2 only — never L3. Pepr 1.0 compatible (pure node:crypto + @noble/post-quantum; no Pepr SDK coupling). This is the cluster-side admission capability that signs every governance receipt — pairs with Amaru (anchoring+PQC) and Rosie (receipt orchestration).
- uds-mesh also has `bundles/v0.3.1-demo/uds-bundle.yaml` + root `uds-bundle.yaml`.

## UDS DELIVERABLES THIS PROGRAM (reports in this payload)
- UDS_MESH_ALIGN_REPORT.md — mesh consensus alignment (4/4).
- UDS_PACKAGING_BUILD_REPORT.md + uds_bundle_build.md — Zarf/UDS bundle build.
- UDS_MESH_READY_SPEC.md — the full mesh spec (CRDT, quorum, witness cosign).
- PHASE1_ALIGN_UDS_REPORT.md, UDS_DEPLOY_GAP_FIX_REPORT.md, UDS_SLIM_REPORT.md.
- WARHACKER_UDS_READINESS.md — UDS-native packaging for Defense Unicorns Warhacker.
- cosign_l2_packaging.md — cosign keyless + L2 build-attestation (honest).
- parity_uds_payload.md — payload parity check.
- HETZNER_ENTERPRISE_UDS_ROADMAP.md + RESEARCH_ENTERPRISE_UDS_CAPABILITIES.md — enterprise UDS deploy roadmap.
- dev2_deploy_uds.md, uds_latest_specs.md, uds_squared.md.

## ADOPTABLE (Apache-2.0, safe to use) vs PATTERN-ONLY (AGPL)
- ADOPTABLE: Pepr (Apache-2.0), Zarf (Apache-2.0), Lula/go-oscal (Apache-2.0), wcrum/py-cot (Apache-2.0 CoT/TAK — killinchu fit).
- PATTERN-ONLY (do NOT vendor): mjnagel/uds-core (AGPL). Reference the pattern; never copy code.

## HOW FORGE CAN HELP
1. Harden the Zarf package-sign + UDS bundle-publish pipeline (Trusted Publishing / keyless cosign; SLSA L2 build-attestation via Rekor — keep honest, no L3 claim).
2. Promote the Pepr PQC dual-sign from STAGED-ADVISORY (v0.4.0-alpha.1) toward v0.5.0 honestly.
3. Wire the live cluster cosign key (SZL_COSIGN_PRIVATE_*_PEM) so runtime DSSE receipts sign green (currently unsigned in HF Space runtime; tamper still caught via SHA3 hash-chain).
4. Keep all UDS bundles GitHub<->HF/registry aligned; honor the non-affiliation notice + AGPL pattern-only rule.

## FILES IN THIS PAYLOAD: replit-sync/uds/  (the reports listed above + this brief)
