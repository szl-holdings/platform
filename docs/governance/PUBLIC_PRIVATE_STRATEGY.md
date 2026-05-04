# Public vs. Private Repository Strategy

> SZL Holdings Platform Governance · April 2026

---

## Decision

The SZL Holdings platform repository is **public by design** for investor review purposes during the growth capital fundraising process. This is a deliberate, time-bound decision — not a permanent open-source commitment.

---

## Rationale for Public Visibility

| Reason | Details |
|--------|---------|
| Investor due diligence | Institutional investors require technical review access; a public repo eliminates friction |
| Technical credibility signal | CI badges, CodeQL, Dependabot, and commit history signal engineering rigor |
| Evaluation partner access | Design partners and enterprise evaluators can review architecture without NDA friction |
| Competitive moat | Our moat is execution, governance architecture, and AI integration — not keeping code secret |

---

## Risk Mitigations

| Risk | Mitigation |
|------|-----------|
| Secret leakage | gitleaks CI gate + GitHub native secret scanning + push protection |
| Competitor copying | License prohibits use; architecture requires significant domain expertise to replicate |
| IP disclosure | Implementation is public; trade secrets are in the governance model and domain expertise |
| PII in commits | Secret scanning covers PII patterns; demo data only in committed code |
| Premature disclosure of roadmap | Roadmap and strategy documents are in `.github-private/` (gitignored) or `docs/investor/` (internal) |

---

## What Stays Private

| Content | Location | Mechanism |
|---------|----------|-----------|
| Internal strategy docs | `.github-private/` | Gitignored |
| Investor-specific pricing | Not in repo | Never committed |
| Customer contracts | Not in repo | Never committed |
| Internal incident details | Not in repo | Sanitized logs only |
| Production credentials | `.env` (gitignored) | `.gitignore` + secret scanning |
| Personal employee information | Not in repo | Never committed |

---

## Post-Series-A Review

After growth capital closes, the org should evaluate:
1. Whether to maintain public visibility or move to private + investor access via GitHub team
2. Whether to establish a separate public-facing documentation site (docs.szlholdings.com) and make the repo private
3. Whether to open-source any non-core components (e.g., a shared UI library) for community/employer branding benefit

This decision should be documented in the next governance review.

---

*SZL Holdings Platform Governance · April 2026*
