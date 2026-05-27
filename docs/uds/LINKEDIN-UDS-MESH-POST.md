SZL Holdings — UDS bundles, v0.2.0 — live on GitHub Releases today.

Five signed Zarf payloads for Defense-Unicorns environments. One repo per bundle. Same download → sha256 → cosign-verify-blob → zarf deploy contract across every release. Air-gap-compatible by construction — every byte you need is attached to the Release itself.

The five releases (each tagged uds-v0.2.0, published 2026-05-27):

• A11oy — brand orchestration. @a11oy/core + @a11oy/connection kernels, optional hash-chained attestations component for offline provenance.
https://github.com/szl-holdings/a11oy/releases/tag/uds-v0.2.0

• Amaru — convergent multi-source data-sync. Append-only delta logs, hash-verified ingest, bounded-loop convergence, KL drift, hash-chained proof receipts.
https://github.com/szl-holdings/amaru/releases/tag/uds-v0.2.0

• ROSIE — governed decision fabric. Deny-by-default admission, contradiction detector, governed-action emit, hash-chained decision receipts.
https://github.com/szl-holdings/rosie/releases/tag/uds-v0.2.0

• Sentra — cyber resilience command. Asset-scoped fail-closed Safety Gate, NIST CSF 2.0 / SP 800-61r2 / CISA CIRCIA / MITRE D3FEND mappings, Ising allocation, hash-chained Proof Chain.
https://github.com/szl-holdings/sentra/releases/tag/uds-v0.2.0

• Vessels — maritime intelligence. Trajectory inspector, AIS-gap detector, sanctions screen, voyage Λ-receipts.
https://github.com/szl-holdings/vessels/releases/tag/uds-v0.2.0

Every release ships four assets:

  <bundle>-uds-0.2.0.tar.zst
  <bundle>-uds-0.2.0.tar.zst.sha256
  <bundle>-uds-0.2.0.tar.zst.sig
  <bundle>-uds-dev.pub

Universal verify-and-install (replace <bundle> with: a11oy, amaru, rosie, sentra, or vessels):

  BASE=https://github.com/szl-holdings/<bundle>/releases/download/uds-v0.2.0
  curl -LO $BASE/<bundle>-uds-0.2.0.tar.zst
  curl -LO $BASE/<bundle>-uds-0.2.0.tar.zst.sha256
  curl -LO $BASE/<bundle>-uds-0.2.0.tar.zst.sig
  curl -LO $BASE/<bundle>-uds-dev.pub
  sha256sum -c <bundle>-uds-0.2.0.tar.zst.sha256
  cosign verify-blob \
    --key <bundle>-uds-dev.pub \
    --signature <bundle>-uds-0.2.0.tar.zst.sig \
    <bundle>-uds-0.2.0.tar.zst
  zarf package deploy <bundle>-uds-0.2.0.tar.zst --confirm

Source repos (all public, all auditable):
github.com/szl-holdings/a11oy
github.com/szl-holdings/amaru
github.com/szl-holdings/rosie
github.com/szl-holdings/sentra
github.com/szl-holdings/vessels
github.com/szl-holdings/uds-mesh

Download a tarball. Check its sha256. Verify its signature against the published dev key. Deploy. If anything in those four steps surprises you — that's a bug. Open an issue on the per-bundle repo.

#DefenseUnicorns #UDS #Zarf #Cosign #Sigstore #SupplyChainSecurity #SBOM #AirGap #ZeroTrust
