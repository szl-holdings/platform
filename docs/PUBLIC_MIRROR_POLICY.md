# Public Mirror Policy

---

## About This Repository

This GitHub repository is the **public build mirror** of the SZL Holdings platform ecosystem.

It is a professionally curated, intentionally published representation of the live platform — designed for partners, investors, enterprise evaluators, and technical reviewers. It is not a raw development workspace.

---

## Source of Truth

The authoritative source of the SZL Holdings codebase is the **live Replit development workspace**. All active development, feature work, and integrations happen there. This repository reflects the public-ready state of that work.

---

## Update Cadence

The mirror is updated:
- After significant feature milestones
- Before investor, partner, or enterprise reviews
- When the platform state has materially changed
- At the discretion of the founder

---

## What Is Published

The mirror includes:
- All application source code (`artifacts/`)
- Shared libraries (`lib/`)
- Infrastructure templates (`infra/`)
- Scripts and tooling (`scripts/`)
- Documentation (`docs/`)
- Configuration templates (`.env.example`, `tsconfig.json`, etc.)
- Screenshot references (`docs/screenshots/`)
- Marketplace packages (`packages/`)

---

## What Is Intentionally Excluded

The following are omitted by design — not by accident:

| Excluded | Reason |
|---------|--------|
| `.env` files | Never committed — all secrets via environment variable injection |
| `node_modules/` | Standard — install via `pnpm install` |
| `dist/` build outputs | Standard — build via `pnpm -r build` |
| `.local/` | Replit agent workspace — internal tooling |
| `.cache/` | Temporary files |
| Internal sprint reports | Internal triage and QA documentation |
| Internal prioritization rationale | Detailed implementation ordering is internal |
| Cap table and financial details | Available to qualified investors via data room request |
| Some infrastructure configuration | Sensitive configuration parameters |
| Internal roadmap specifics | Detailed execution sequencing is internal |

This exclusion is intentional and reflects standard practice for public-facing enterprise software repositories.

---

## On Data State

Platform dashboards visible in the codebase may reference seeded or simulated data for demonstration purposes. Every platform includes explicit data state labeling — Demo, Pilot, or Live — so evaluators always know what they are looking at.

The infrastructure, schemas, APIs, and interfaces are designed for real workloads. Data state does not represent capability.

---

## Repository

**Repository**: `stephenlutar2-hash/szl-holdings-platform`
**Published Branch**: `master` — always clean and buildable
**Maintainer**: Stephen Lutar, Founder — SZL Holdings

---

## Contact

For questions about the platform, evaluation access, or investor data room access:
[inquiries@szlholdings.com](mailto:inquiries@szlholdings.com)
