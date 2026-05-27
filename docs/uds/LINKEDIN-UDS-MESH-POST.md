SZL Holdings — UDS bundle mesh, v0.2.0. Five signed Zarf payloads, live on GHCR and GitHub Releases.

Every consequential action traverses a 9-step governance loop (signal→context→recommendation→simulation→policy→approval→execution→proof→outcome) and seals into a hash-chained Proof Chain. These bundles are how that doctrine ships to Defense-Unicorns nodes.

Each uds-v0.2.0 release (2026-05-27) carries four assets — bundle, sha256, cosign blob signature, dev pubkey — on the Release itself. No GHCR, no Sigstore round-trip. Air-gap parity by construction.

The five bundles (all v0.2.0, all signed, all deterministic):

1) A11oy — governed execution fabric. Λ-gate (9-axis Lutar Invariant), Bekenstein-bounded admission, dual-witness MATCH/DIVERGE verdict, signed receipts.
   oci://ghcr.io/szl-holdings/a11oy-uds:0.2.0
   https://github.com/szl-holdings/a11oy/releases/tag/uds-v0.2.0

2) Amaru — convergent data-sync. Doctrine V6 runtime: Lutar Σ, Λ floor, Bekenstein admission, bounded-loop convergence, KL drift, hash-chained proof receipts.
   oci://ghcr.io/szl-holdings/amaru-uds:0.2.0
   https://github.com/szl-holdings/amaru/releases/tag/uds-v0.2.0

3) ROSIE — governed decision fabric. Deny-by-default admission, contradiction detector, governed-action emit, hash-chained decision receipts.
   oci://ghcr.io/szl-holdings/rosie-uds:0.2.0
   https://github.com/szl-holdings/rosie/releases/tag/uds-v0.2.0

4) Sentra — cyber resilience command. Asset-scoped fail-closed Safety Gate · NIST CSF 2.0 / SP 800-61r2 / CISA CIRCIA / D3FEND · Ising allocation · Proof Chain.
   oci://ghcr.io/szl-holdings/sentra-uds:0.2.0
   https://github.com/szl-holdings/sentra/releases/tag/uds-v0.2.0

5) Vessels — maritime intelligence. Trajectory inspector, AIS-gap detector, sanctions screen, voyage Λ-receipts. CPA (Bowditch), collision cone.
   oci://ghcr.io/szl-holdings/vessels-uds:0.2.0
   https://github.com/szl-holdings/vessels/releases/tag/uds-v0.2.0

Universal verify-and-install contract:

  zarf package pull oci://ghcr.io/szl-holdings/<bundle>-uds:0.2.0

  cosign verify \
    --certificate-identity-regexp 'https://github.com/szl-holdings/.+/\.github/workflows/<bundle>-uds-publish\.yml@.+' \
    --certificate-oidc-issuer https://token.actions.githubusercontent.com \
    ghcr.io/szl-holdings/<bundle>-uds:0.2.0

  zarf package deploy zarf-package-<bundle>-uds-*.tar.zst --confirm

Mesh registry — read-only, machine-readable, live:
  curl https://<mesh-host>/api/uds/registry
Returns versions, OCI coords, cosign identity regex, install paths, build commands.

Air-gap path: every release attaches the raw *.tar.zst, *.sig, and *.sha256 sidecars to the matching GitHub Release. Verify offline against per-file MANIFEST.json, deploy from the local tarball.

Doctrine — published, machine-verified, measured:

— Ouroboros Thesis v1–v13 on Zenodo (concept DOI 10.5281/zenodo.19944926). v11 APPLIED Λ measured 24,800 HTTP calls, median Λ₁₀ 0.49–0.59 ms, p99 ≤ 1.27 ms, ρ = 1.000 on 8,000/8,000 (10.5281/zenodo.20119582).
— Lean 4 kernel-verified Lutar Invariant: github.com/szl-holdings/lutar-lean/releases/tag/v0.1.0
— Ouroboros runtime, 218/218 tests: github.com/szl-holdings/ouroboros/releases/tag/v6.3.0
— Thesis v13: github.com/szl-holdings/ouroboros-thesis/releases/tag/paper-v13-exhaustive-1.0.0
— Stephen P. Lutar · ORCID 0009-0001-0110-4173

Pull the registry. Pull a bundle. Verify. Deploy. If any step surprises you, that's a bug.

#DefenseUnicorns #UDS #Zarf #Cosign #Sigstore #SupplyChainSecurity #SLSA #SBOM #AirGap #GHCR #OIDC #ZeroTrust #FormalMethods #Lean4
