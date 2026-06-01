# UDS_PR_CONTRIBUTION_OPPORTUNITIES.md — 5 ways SZL contributes today

> "American make it fully operational and functional" in action. Real, currently-open issues across `defenseunicorns/uds-core`, `zarf-dev/zarf`, and `defenseunicorns/pepr` where Killinchu/SZL can ship value. Verified open via GitHub API 2026-06-01. **Research only — DO NOT push.** — *Yachay*

---

## #1 — Pepr policy to verify image signatures on admission (the keystone)
- **Issue:** `uds-core` **#789** — "Research UDS Operator Pepr policy to validate image signatures" ([github.com/defenseunicorns/uds-core/issues/789](https://github.com/defenseunicorns/uds-core/issues/789)).
- **Why it fits us:** "As Ezra I want a configurable way to enforce verification of image signatures on Pod admission so I can have assurance that images come from where they say." This is **exactly** the Killinchu wedge — extend the proposed Pepr policy to verify **Cosign signature + an in-toto/Khipu DAG attestation label** before a drone-payload workload schedules.
- **SZL deliverable:** a Pepr admission module + UDS exemption schema for signature/attestation enforcement.

## #2 — Sign UDS Core Zarf packages
- **Issue:** `uds-core` **#1798** — "Sign UDS Core zarf packages" (labels: enhancement, Blocked External) ([github.com/defenseunicorns/uds-core/issues/1798](https://github.com/defenseunicorns/uds-core/issues/1798)).
- **Why it fits us:** UDS Core packages aren't currently signed; Zarf supports `--key` verification at deploy. Closing this is foundational to the "American-controlled, attested supply chain" claim (AMERICAN_MADE_SUPPLY_CHAIN.md §5). SZL can contribute the signing pipeline + Sigstore keyless flow.
- **SZL deliverable:** CI signing of UDS Core packages with Cosign + verification docs.

## #3 — Zarf signature verification across all package commands
- **Issue:** `zarf-dev/zarf` **#4917** — "Support signature verification flags on all package commands" ([github.com/zarf-dev/zarf/issues/4917](https://github.com/zarf-dev/zarf/issues/4917)).
- **Why it fits us:** verification today happens on package load; as Zarf expands signing surface area, every load operation needs verification. This is where **RemoteID-compliance bundles** and **drone supply-chain attestation** ride — every airgap package load is a chance to enforce provenance.
- **SZL deliverable:** PR adding consistent `--verify`/trusted-signer flags across package commands; tie-in to a Khipu receipt check.

## #4 — Expose Zarf SBOM + tarball functions (Khipu DAG receipt integration)
- **Issue:** `zarf-dev/zarf` **#4794** — "Expose some useful sbom and tar related functions" (e.g., `createReproducibleTarballFromDir`, `getChecksum`) ([github.com/zarf-dev/zarf/issues/4794](https://github.com/zarf-dev/zarf/issues/4794)).
- **Why it fits us:** exposing reproducible-tarball + checksum helpers lets external tooling (Killinchu's Khipu DAG receipt emitter) generate **verifiable, reproducible** package digests that anchor a receipt chain. Reproducibility = the math substrate for chain_verified.
- **SZL deliverable:** PR exporting the functions + an example wiring a Zarf package digest into an in-toto attestation / Khipu receipt.

## #5 — Pepr `--registry-info` input validation hardening
- **Issue:** `defenseunicorns/pepr` **#2511** — "Unvalidated input for `--registry-info` CLI flag in `pepr build`" ([github.com/defenseunicorns/pepr/issues/2511](https://github.com/defenseunicorns/pepr/issues/2511)).
- **Why it fits us:** a small, high-trust first PR — validate the image-name/registry input and warn on malformed values. Low-risk way to establish SZL as a credible contributor with Pepr lead **Case Wylie (`cmwylie19`)** before proposing the bigger #789 work.
- **SZL deliverable:** input-validation + warning PR; opens the relationship.

---

## Sequencing (smallest-trust-first)
1. **#5 (Pepr validation)** → establish contributor credibility with the Pepr lead.
2. **#4 (Zarf SBOM functions)** → land the reproducibility primitive Khipu needs.
3. **#3 (Zarf verify-all)** → make verification universal at the airgap boundary.
4. **#2 (Sign UDS Core)** → close the unsigned-package gap.
5. **#789 (Pepr signature+attestation policy)** → the keystone: attestation-gated admission, the Killinchu product surface.

> Every PR above is **public, FOSS, and additive** — it is literally "American helping make UDS fully operational and functional," with full upstream credit to Defense Unicorns. **Do not push without explicit human sign-off.**

---
*Compiled by Yachay — SZL Holdings. 2026-06-01.*
