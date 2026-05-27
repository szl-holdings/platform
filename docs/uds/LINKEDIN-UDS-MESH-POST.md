SZL Holdings — UDS bundle mesh, v0.2.0 — live on GHCR.

Five signed Zarf payloads + a read-only mesh registry for Defense-Unicorns environments. Same pull-verify-install contract across every bundle. Cosign-keyless via GitHub Actions OIDC. Air-gap-compatible from day one.

The five bundles:

1) A11oy — brand orchestration layer. @a11oy/core + @a11oy/connection kernels, optional hash-chained attestations component for offline provenance without a Rekor round-trip.
   oci://ghcr.io/szl-holdings/a11oy-uds:0.2.0

2) Amaru — Andean Ouroboros convergent data-sync. Doctrine V6 runtime: Lutar Σ, Λ floor, Bekenstein admission, bounded-loop convergence, KL drift, hash-chained proof receipts.
   oci://ghcr.io/szl-holdings/amaru-uds:0.2.0

3) ROSIE — governed decision fabric. Policy admission, contradiction detection, governed-action emit, hash-chained decision receipts.
   oci://ghcr.io/szl-holdings/rosie-uds:0.2.0

4) Sentra — cyber resilience command. Asset-scoped fail-closed Safety Gate. NIST CSF 2.0 + SP 800-61r2 + CISA CIRCIA + MITRE D3FEND mappings. Ising allocation. Proof Chain.
   oci://ghcr.io/szl-holdings/sentra-uds:0.2.0

5) Vessels — maritime intelligence. CPA (Bowditch), collision cone, AIS-gap dark-vessel detector (Λ-floor 0.90), sanctions screen, voyage Λ-receipts.
   oci://ghcr.io/szl-holdings/vessels-uds:0.2.0

The universal three-step contract:

  zarf package pull oci://ghcr.io/szl-holdings/<bundle>-uds:0.2.0

  cosign verify \
    --certificate-identity-regexp 'https://github.com/szl-holdings/.+/\.github/workflows/<bundle>-uds-publish\.yml@.+' \
    --certificate-oidc-issuer https://token.actions.githubusercontent.com \
    ghcr.io/szl-holdings/<bundle>-uds:0.2.0

  zarf package deploy zarf-package-<bundle>-uds-*.tar.zst --confirm

Mesh registry — read-only, machine-readable, live:
  curl https://<mesh-host>/api/uds/registry
Returns versions, OCI coords, cosign identity regex, install paths, build commands. Bundles register at publish time via the per-bundle Actions workflow — the same workflow whose identity cosign verifies against. No POST surface. That invariant is the trust anchor.

Air-gap path: every release attaches the raw *.tar.zst, *.sig, and *.sha256 sidecars to the matching GitHub Release. Verify offline against per-file MANIFEST.json, deploy from the local tarball.

Repos:
github.com/szl-holdings/szl — monorepo (bundle sources, mesh api-server, publish workflows, verifier scripts)
ghcr.io/szl-holdings/<bundle>-uds — signed OCI images, one per bundle

Shared SZL packages baked into every bundle (v0.2): @szl-holdings/perception-loop, @szl-holdings/sequence-pipeline, @szl-holdings/sparse-attention-kit. v0.3 adds @szl-holdings/memo-reflection-kit.

Pull the registry. Pull a bundle. Verify. Deploy. If any step surprises you, that's a bug — open an issue.

#DefenseUnicorns #UDS #Zarf #Cosign #Sigstore #SupplyChainSecurity #SLSA #SBOM #AirGap #GHCR #OIDC #ZeroTrust
