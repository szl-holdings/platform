## Add hygiene files: SECURITY.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md

### Summary

This PR adds the three standard community health files that are currently absent from `szl-holdings/vsp-otel`, bringing it into parity with sibling repos (`ouroboros`, `sentra`, `amaru`).

### Files Added

| File | Purpose |
|---|---|
| `SECURITY.md` | Vulnerability reporting policy — contact `stephen@szlholdings.com`, 72 h response SLA, CVSS v3.1 triage, PGP optional, in-scope/out-of-scope table |
| `CONTRIBUTING.md` | DCO sign-off required, GPG-signed commits required, doctrine-V6 conjunctive Λ ≥ 0.90 gate for logic changes, permitted license list (Apache-2.0 / MIT / BSD-3-Clause / CC-BY-4.0), PR template, code review by @stephenlutar2-hash |
| `CODE_OF_CONDUCT.md` | Contributor Covenant v2.1, enforcement contact `stephen@szlholdings.com` |

### Motivation

GitHub marks repositories without these files as lacking community standards. Adding them:
- Closes the GitHub Community Standards checklist gaps for `vsp-otel`
- Establishes a clear security disclosure path consistent with the rest of the SZL Holdings platform
- Sets explicit contribution quality requirements (DCO, signed commits, doctrine-V6 Λ ≥ 0.90)

### Style Reference

Templates adapted from `szl-holdings/ouroboros` and `szl-holdings/sentra` equivalents, with `vsp-otel`-specific scope language in `SECURITY.md` (receipt hashing, Λ-gate span emission, ρ-closure witness logic).

### Doctrine-V6 Λ-vector

Documentation-only change — no executable logic modified. Doctrine-V6 gate does not apply to pure documentation PRs; this PR introduces the gate requirement for future contributors.

### Checklist

- [x] No forbidden patterns (Jr., AlloyScape, Glass Wing, Pillpintu, Khipu outside Anthropic context, Stephen Paul, Perplexity Computer, anonymous)
- [x] Author byline: `Lutar, Stephen P.` (ORCID 0009-0001-0110-4173 · SZL Holdings)
- [x] Contact email: `stephen@szlholdings.com`
- [x] Matches sibling repo style (ouroboros, sentra)
- [x] Permitted licenses only referenced (Apache-2.0 / MIT / BSD-3-Clause / CC-BY-4.0)
- [x] CODE_OF_CONDUCT.md uses Contributor Covenant v2.1
- [x] No mutations to existing files
