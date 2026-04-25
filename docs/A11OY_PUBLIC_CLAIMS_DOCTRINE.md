# A11OY_PUBLIC_CLAIMS_DOCTRINE.md — Public Claim Safety

A11oy is an active prototype and investor demo platform. Every public-facing claim about its capabilities, customers, compliance, and integrations must use the approved qualifiers defined here. Unqualified overreach erodes investor and operator trust; it also creates legal exposure.

---

## Blocked Claims

The following claims are unconditionally blocked unless the supporting evidence is verified and documented in `docs/platform-facts.md` or the source-of-truth registry:

| Blocked Claim | Why Blocked |
|--------------|-------------|
| "We have [N] enterprise customers" | Customer count must be verified and current |
| "Processing $[X]B in transactions" | Revenue/volume figures require verified data |
| "SOC 2 Type II certified" | Certification has not been awarded |
| "ISO 27001 certified" | Certification has not been awarded |
| "HIPAA compliant" | Compliance designation has not been formally established |
| "Integrated with [Vendor]" (for mock connectors) | Mock connectors are simulations, not live integrations |
| "Real-time data from [Vendor]" (for mock connectors) | No live data exchange exists |
| "Deployed in production at [Company]" | No production deployments have been confirmed |
| "Proven ROI of [X]%" | No verified ROI study has been completed |
| "Best-in-class [feature]" | Comparative superlatives require benchmarking |
| "The only platform that..." | Exclusivity claims require market research |
| "[N] signals processed" (if not from current verified count) | Signal counts must come from `docs/platform-facts.md` |

---

## Required Qualifiers

Use these qualifiers when making capability or status claims:

| Claim Type | Approved Qualifier |
|------------|-------------------|
| Platform status | "active prototype", "investor demo platform", "proof-of-concept" |
| Feature capability | "designed to", "built to", "architected for", "demonstrates" |
| Customer relationships | "design partner conversations", "enterprise evaluation discussions", "investor demo" |
| Compliance | "architected for SOC 2 readiness", "SOC 2 roadmap", "compliance-ready architecture" |
| Integrations (mock) | "mock connector", "future connector target", "roadmap integration target" |
| Integrations (planned) | "planned integration", "connector on the roadmap", "future connector target" |
| Performance claims | "in demo mode", "in controlled conditions", "with seed data" |
| Revenue / volume | Do not state unless verified. Use "designed to handle" for architectural claims. |

---

## Soften-or-Remove Rule

When reviewing any public-facing copy, apply the soften-or-remove rule:

1. **Identify the claim.** Is it a capability, status, customer, compliance, integration, or metric claim?
2. **Can you verify it?** Check `docs/platform-facts.md` and the source-of-truth registry. If not verifiable, proceed to step 3.
3. **Can it be softened?** Apply the appropriate qualifier from the Required Qualifiers table. If softening makes the claim still meaningful, soften it and document the change.
4. **If it cannot be softened meaningfully, remove it.** A removed claim is better than an overstated claim. Document the removal in the Proof Packet.

---

## Claim Review Cadence

- **Before any public release:** ClaimGuard must run a full public claims review.
- **Before any investor demo:** BoardroomOracle must confirm all claims in the demo script use approved qualifiers.
- **Before merging any copy change to a public-facing surface:** The commit must include a public claim check in the Proof Packet.

---

## Platform Facts Reference

The canonical, verified set of platform statistics is in `docs/platform-facts.md`. This file is generated from `packages/platform-metrics-registry` and must not be edited by hand. Run `pnpm metrics:generate` to regenerate it and `pnpm metrics:validate` to verify no drift.

Agents and contributors must use `docs/platform-facts.md` as the source of truth for any claim involving counts, route numbers, artifact numbers, or other quantitative platform statements.

---

## Claim Dispute Resolution

If an agent or contributor believes a documented fact is inaccurate, the correct response is:

1. Open a task to audit the claim against the source of truth.
2. Do not publish the disputed claim while the audit is open.
3. Document the dispute and its resolution in the Proof Packet.

Do not override, suppress, or work around a claim dispute unilaterally.
