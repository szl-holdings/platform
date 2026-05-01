# License Strategy — Ouroboros Unified Runtime

**Status:** decision required before v3 publication.
**Owner:** Stephen P. Lutar.
**Recommended deadline:** before posting v3 publicly.

This document lays out the three viable paths and recommends one. It is not legal advice. Get a 30-minute call with an IP attorney before final decision.

## Why this matters now

The license decision determines:

1. Whether the runtime can be acquired in a strategic acquisition (Tier 3+ in the valuation memo).
2. Whether A11oy / Sentra / Amaru can be sold as proprietary products on top of the runtime.
3. Whether competitors can fork the runtime and undercut the commercial offering.
4. Whether enterprise buyers can deploy without legal review friction.

A wrong license choice is reversible but expensive. Every contributor after the first commit under license X has a copyright stake. Changing licenses later requires CLAs from every contributor or a clean rewrite.

## Path A — MIT or Apache-2.0 (permissive)

**Pros.** Maximum adoption. No friction for any deployment. Maximizes citation, integration, and standards-track potential. This is the OPA / OpenTelemetry path.

**Cons.** A well-funded competitor can fork the runtime, build a hosted service on it, and compete with the founder's commercial offering with zero royalty. AWS does this regularly (Elasticsearch → OpenSearch).

**When to choose.** If the moat is the founder + the standards play, not the code. If the runtime is the substrate and A11oy/Sentra/Amaru are the products, this can work.

## Path B — Source-available with commercial license (BUSL, Elastic License 2, SSPL)

**Pros.** Code is public, readable, auditable. Commercial use above a defined threshold (revenue, deployment scale, hosted service) requires a paid license. This is the Sentry / HashiCorp / MongoDB / Elastic path.

**Cons.** Some regulated buyers' procurement teams flag non-OSI licenses. Some open-source advocates won't contribute. Standards bodies generally won't accept BUSL'd code.

**When to choose.** If the runtime *is* the product and the moat is the code itself. If you expect a competitor cloud to wrap the runtime and resell it.

## Path C — Dual license (AGPL + commercial)

**Pros.** OSI-approved on the AGPL side, defensible against cloud-resellers, and a clear commercial path. This is the GitLab path.

**Cons.** AGPL scares some enterprise buyers, especially those embedding the runtime in proprietary products. Negotiation overhead on every commercial deal.

**When to choose.** If you want OSI-approved status *and* defensibility. Higher operational overhead than B.

## Recommendation

**Path B (BUSL-1.1) for the unified payload, MIT for adapters and examples.**

Rationale:
- The runtime (`@workspace/horizon`, `@workspace/resonance`, the anchor) is the IP. Protect it with BUSL.
- The adapters (OpenAI, Perplexity, A11oy/Sentra/Amaru integration glue) and examples should be MIT so integrators can copy them freely.
- BUSL converts to Apache-2.0 after 4 years by default. This gives the project a credible long-term OSS commitment while protecting the early years.
- This is the same split Sentry uses and that has scaled to a $3B+ valuation without legal friction.

## Open questions for the IP attorney

1. Does BUSL-1.1 with a 4-year change date conflict with any planned standards-body submission (OpenTelemetry SIG, NIST AI RMF)?
2. Should the change-date license be Apache-2.0 or MIT?
3. What's the additional usage grant — what scale of commercial use is permitted without a paid license? (Sentry: <$1M ARR or <100K events/month, for example.)
4. CLA or DCO for contributors? Recommend DCO for lower friction.
5. How does BUSL interact with the witness-anchor module if integrators run their own internal anchor?

## Decision checklist

- [ ] 30-min call with IP attorney scheduled.
- [ ] Path chosen and written into LICENSE at repo root.
- [ ] Contributor agreement (DCO recommended) added to CONTRIBUTING.md.
- [ ] All existing files have correct SPDX headers.
- [ ] Change-date license documented in README.
- [ ] First commercial license terms drafted (one page is enough for v0.1).

## What we ship until the decision

The repo currently has no LICENSE file. **Do not post v3 publicly without one.** A repo without a license is "all rights reserved" by default, which is the worst of all worlds — adoption-hostile and not commercially defensible.

The minimum acceptable interim state is a placeholder LICENSE file that says "license decision pending; contact stephen@szl-holdings for usage." This buys 2–4 weeks while the attorney call happens.
