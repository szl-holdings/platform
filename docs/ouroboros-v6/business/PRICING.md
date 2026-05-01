# Pricing — Ouroboros Runtime

**Status:** speculative v0.1. Not legally binding. Adjust before customer-facing posting.
**Purpose:** triangulate ARR potential for buyers and investors. Stated prices anchor expectations.

## Tier 1 — Open Source

**$0 / forever**

- Full runtime under the source-available license (BUSL-1.1 recommended; see [LICENSE_STRATEGY.md](../ouroboros-unified-payload/docs/LICENSE_STRATEGY.md)).
- 144 passing tests, full source, all docs.
- Self-host, single tenant, non-production use.
- Community support via GitHub Issues.
- Includes: horizon, resonance, anchor (LOCAL driver only), adapters, verifier, bench.

**Use case:** evaluation, research, indie deployments under $500K ARR.

## Tier 2 — Hosted Witness Anchor

**$2,500 / month, starting**

- Sigstore Rekor anchoring at scale, managed.
- 99.9% SLA on anchor availability.
- 13-month retention of root hashes, 30-day plaintext (opt-in).
- Email support, 1-business-day response.
- Up to 10M anchor calls / month.

**Add-ons:**
- Additional 10M calls: $1,500 / month.
- Real-time Grafana dashboard hosted: $500 / month.
- 24/7 on-call: $2,000 / month.

**Use case:** SaaS companies, mid-market deployments, regulated SMBs.

## Tier 3 — Enterprise (Air-Gapped + SLA)

**$60,000 / year, starting**

- Source-available license cleared for production, internal modification rights.
- Air-gapped deployment mode (HSM-anchored Merkle log, no external dependency).
- Custom integration support (one A11oy / Sentra / Amaru surface included).
- Quarterly architecture reviews.
- 99.99% SLA, 24/7 incident response.
- Threat model + privacy attestation specific to deployment.
- Roadmap input.

**Add-ons:**
- Formal verification artifact (Lean or Coq proof bundle): $25,000 one-time.
- BAA / DPA negotiation: included.
- Dedicated solutions architect: $120,000 / year.

**Use case:** finance, healthcare, defense, public sector. Lighthouse customers.

## Design Partner Program

**$0 for first 3 lighthouse partners. Pricing locked at Tier 3 starting rate through 2027.**

- Founder-led white-glove deployment.
- Co-authored case study (logo on website with mutual approval).
- Roadmap influence.
- First commercial license, grandfathered.

In exchange:
- Public reference within 90 days of go-live.
- Quarterly check-in calls.
- Permission to cite deployment in regulatory filings and standards submissions.

## What's not priced yet

- A11oy, Sentra, Amaru product-tier pricing — defined when each surface reaches GA.
- Multi-region, multi-tenant managed hosting.
- Reseller / OEM licenses.
- Standards-body certification fees (when applicable).

## Contact

stephen@szl-holdings (placeholder) • [github.com/szl-holdings](https://github.com/szl-holdings)
