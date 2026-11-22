# platform domain leader study r1 (propose-only)

Date: 2026-11-22. Method: web-verified 2026 leaders. Documentation only: no code, CI, config, or existing-PR status changes. All absorb actions are FUTURE and non-authorizing; implementation and merges remain separately reviewed and gated by the signature wall.

## Domain: signed-artifact producer chain (SBOM + attestations on every release)

## Leaders studied (web-verified 2026-11-22)

1. **CycloneDX SBOM** standard. [Normative spec](https://cyclonedx.org/specification/).
2. **cosign attest** + in-toto predicates. [Normative docs](https://docs.sigstore.dev/cosign/attest/).
3. **GitHub-native artifact attestations** for Actions builds. [Normative docs](https://docs.github.com/en/actions/security-for-github/using-artifact-attestations/using-artifact-attestations-to-establish-provenance-for-builds).

## Absorb actions (FUTURE PROPOSALS, non-authorizing)

1. (SBOM) Every release emits a CycloneDX SBOM measured from the actual build, never hand-listed.
2. (attestation) Every artifact carries an in-toto/cosign attestation of its build; consumer verification documentation shipped alongside.
3. (ladder) Producer-chain measurement ladder: release IDs, stored artifacts, package versions, attestations, consumer-pin step, each individually receipted.
Read-only alignment: earlier estate findings (releases with zero assets; attestations 404) motivate the ladder; no status claim.

## Sources (accessed 2026-11-22)

- CycloneDX specification: https://cyclonedx.org/specification/ (normative)
- cosign attest docs: https://docs.sigstore.dev/cosign/attest/ (normative)
- GitHub artifact attestations docs: https://docs.github.com/en/actions/security-for-github/using-artifact-attestations/using-artifact-attestations-to-establish-provenance-for-builds (normative)

## Do not do

Do not merge, bypass the signature wall, or claim implementation beyond this card.
