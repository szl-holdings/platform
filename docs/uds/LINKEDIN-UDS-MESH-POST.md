SZL Holdings — UDS bundle drop, v0.2.0. Five signed Zarf payloads, live on GitHub Releases.

Every consequential action traverses a 9-step governance loop — signal → context → recommendation → simulation → policy → approval → execution → proof → outcome — and seals into a hash-chained Proof Chain. These bundles are how that doctrine ships to Defense-Unicorns nodes.

Each bundle is its own public repo with a uds-v0.2.0 release (2026-05-27) carrying four assets: bundle, sha256, cosign blob signature, dev pubkey. Trust chain attached to the Release itself — no GHCR, no Sigstore round-trip. Air-gap parity by construction.

• A11oy — governed execution fabric. Λ-gate (9-axis Lutar Invariant), Bekenstein-bounded admission, dual-witness MATCH/DIVERGE verdict, signed receipts.
https://github.com/szl-holdings/a11oy/releases/tag/uds-v0.2.0

• Amaru — convergent data-sync. Append-only delta logs, hash-verified ingest, bounded-loop convergence with KL drift, proof receipts.
https://github.com/szl-holdings/amaru/releases/tag/uds-v0.2.0

• ROSIE — governed decision fabric. Deny-by-default admission, contradiction detector, hash-chained decision receipts.
https://github.com/szl-holdings/rosie/releases/tag/uds-v0.2.0

• Sentra — cyber resilience command. Asset-scoped fail-closed Safety Gate · NIST CSF 2.0 / SP 800-61r2 / CISA CIRCIA / D3FEND · Ising allocation · Proof Chain.
https://github.com/szl-holdings/sentra/releases/tag/uds-v0.2.0

• Vessels — maritime intelligence. Trajectory inspector, AIS-gap detector, sanctions screen, voyage Λ-receipts.
https://github.com/szl-holdings/vessels/releases/tag/uds-v0.2.0

Universal verify-and-install (<bundle> ∈ {a11oy, amaru, rosie, sentra, vessels}):

  BASE=https://github.com/szl-holdings/<bundle>/releases/download/uds-v0.2.0
  curl -LO $BASE/<bundle>-uds-0.2.0.tar.zst
  curl -LO $BASE/<bundle>-uds-0.2.0.tar.zst.sha256
  curl -LO $BASE/<bundle>-uds-0.2.0.tar.zst.sig
  curl -LO $BASE/<bundle>-uds-dev.pub
  sha256sum -c <bundle>-uds-0.2.0.tar.zst.sha256
  cosign verify-blob --key <bundle>-uds-dev.pub \
    --signature <bundle>-uds-0.2.0.tar.zst.sig \
    <bundle>-uds-0.2.0.tar.zst
  zarf package deploy <bundle>-uds-0.2.0.tar.zst --confirm

Doctrine is published, machine-verified, measured:

— Ouroboros Thesis v1–v13 on Zenodo. Concept DOI 10.5281/zenodo.19944926. v11 (APPLIED Λ) measured 24,800 HTTP calls — median Λ₁₀ overhead 0.49–0.59 ms, p99 ≤ 1.27 ms, ρ = 1.000 on 8,000/8,000 governed pairs (10.5281/zenodo.20119582).
— Lean 4 kernel-verified Lutar Invariant: github.com/szl-holdings/lutar-lean
— Ouroboros runtime, 218/218 guardrail tests: github.com/szl-holdings/ouroboros
— Stephen P. Lutar · ORCID 0009-0001-0110-4173

Download. sha256-check. cosign verify-blob. zarf deploy. If any of those four steps surprises you, that is a bug.

#DefenseUnicorns #UDS #Zarf #Cosign #SupplyChainSecurity #AirGap #FormalMethods #Lean4
