# Open-Source Boundary Policy

> SZL Holdings Platform Governance · April 2026

---

## Position

The SZL Holdings platform is **proprietary software**. The repository is a **public mirror for evaluation, transparency, and investor review** — not an open-source project.

---

## What This Means

| Aspect | Position |
|--------|----------|
| License | Proprietary / UNLICENSED — see `LICENSE.md` |
| Community contributions | Not accepted; development is invitation-only |
| Issue reports | Accepted via issue templates; triage at SZL Holdings discretion |
| Forking | Not prohibited by GitHub policy, but not authorized by SZL Holdings license |
| Use of code | Not authorized without explicit written agreement with SZL Holdings |
| Bug reports by security researchers | Welcome — follow `SECURITY.md` for responsible disclosure |

---

## What The Public Repository Contains

The public repository contains:
- Platform architecture documentation
- API surface documentation
- Security posture documentation
- Investor and governance documentation
- Source code for evaluation purposes

It does **not** contain:
- Production credentials or secrets
- Customer data or PII
- Internal tooling not relevant to platform evaluation
- Private business strategy documents

---

## Internal vs. Public Content Boundary

| Content Type | Repository | Notes |
|-------------|-----------|-------|
| Platform source code | Public repo | For evaluation |
| Architecture docs | Public repo | For trust and investor review |
| Security policy | Public repo | Responsible disclosure |
| Business strategy | Not in repo — internal only | Never committed |
| Investor documentation (non-sensitive) | Public repo (`docs/investor/`) | For investor due diligence review |
| Customer contracts | Not in repo | Never committed |
| Credentials / secrets | Not in repo | `.gitignore` + secret scanning enforce this |
| Internal incident details | Not in repo | Sanitized summaries only |

---

## Contributor License Agreement

Any invited contributor must execute a CLA or contractor agreement with SZL Holdings before any code contribution is accepted. Contact `inquiries@szlholdings.com`.

---

*SZL Holdings Platform Governance · April 2026*
