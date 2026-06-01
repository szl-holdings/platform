# SZL Holdings — Public Repository Goals

**Version:** 1.0  
**Date:** April 2026  
**Authority:** Stephen Lutar, Founder

---

## Purpose

This document defines what the SZL Holdings public GitHub repository (`szl-holdings-platform`) is trying to accomplish — and what it is explicitly not trying to accomplish. It provides strategic clarity for every curation, content, and presentation decision.

---

## 1. What the Public Repo Is For

### Primary Audiences

| Audience | What They Need to See |
|----------|-----------------------|
| **Investors** | Platform scale, architectural maturity, product breadth, execution evidence |
| **Enterprise Evaluators** | Technical depth, security posture, documentation quality, deployment readiness |
| **Technical Reviewers** | Code quality, architecture coherence, shared library design, AI governance |
| **Design Partners** | Product sophistication, UI quality, domain breadth |
| **Recruits / Collaborators** | Engineering standards, codebase organization, tech stack |

### Strategic Goals

**1. Demonstrate architectural coherence at scale.**
The monorepo contains 16 deployable artifacts, 8 shared libraries, and 120+ database tables. The public repo makes this visible. A fragmented set of repos cannot convey this.

**2. Prove the platform thesis in code.**
The investor thesis is: one platform architecture, multiple verticals, compounding shared infrastructure. The repo is the primary proof point — showing Lyte, Alloy, Aegis, Vessels, Terra, and Carlota Jo all built on the same library stack.

**3. Establish enterprise trust signals.**
Enterprise buyers and investors need to see: responsible disclosure policy, RBAC documentation, audit trail architecture, IaC templates, compliance framework stubs. These live in the repo and serve as trust anchors.

**4. Support investor and partner evaluation.**
Before a partner call or investor meeting, reviewers will look at the GitHub repo. It must represent the company at its best — not as a raw development workspace.

**5. Signal active, disciplined development.**
CHANGELOG entries, GitHub releases, commit history, and CI workflow status communicate that the platform is being actively and carefully maintained.

---

## 2. What the Public Repo Is NOT For

| Not For | Reason |
|---------|--------|
| **Open-source community contributions** | Proprietary software — contributions are by invitation only |
| **Exposing internal operations** | Internal sprint reports, QA notes, and execution sequencing are internal |
| **Real-time development sync** | The repo is a curated mirror, not a live sync of the Replit workspace |
| **Data room material** | Cap tables, financial projections, and detailed investor terms are in the data room |
| **Social media or marketing draft content** | `social-content/` is internal — not publication-ready |
| **Raw backups or database dumps** | Would be a security incident |

---

## 3. The Mirror Standard

Every file in the public repo must meet the following bar:

### Accuracy
- All claimed capabilities exist in the codebase
- No aspirational features presented as current
- All demo/seed data is labeled as Demo or Seeded

### Professionalism
- No work-in-progress markdown files with broken links or `TODO: fill this in`
- No test output, scratch files, or dev-only config left in root
- No redundant files that create confusion about which is authoritative

### Security
- No `.env` files, credentials, or real API keys in any committed file
- No database dumps or SQL files with real data
- No internal configuration with sensitive system details

### Completeness
- README accurately represents the full current platform state
- CHANGELOG is current with the latest release
- Trust files (SECURITY, CONTRIBUTING, LICENSE) are present and accurate
- GitHub templates (PR template, issue templates) are present

---

## 4. Success Metrics

The public repo is succeeding when:

| Metric | Target |
|--------|--------|
| Time for investor to understand the platform | Under 5 minutes from README |
| Time for technical reviewer to assess architecture | Under 10 minutes from README → architecture docs |
| Trust file completeness | 100% — SECURITY, CONTRIBUTING, LICENSE, CHANGELOG, CODEOWNERS |
| Documentation completeness | Architecture, trust, investor, buyer, releases all present |
| Secret / sensitive content | 0 files — clean validation on every mirror push |
| Noisy root files | 0 — no redundant, outdated, or WIP files at root |
| README screenshot accuracy | Screenshots reflect current platform state |

---

## 5. Evolution of Goals

This document is a living record. Goals will expand as the platform matures:

| Phase | Additional Goal |
|-------|----------------|
| **Revenue activation** | Stripe integration visible in codebase; pricing documentation |
| **Enterprise GTM** | Case study documentation, enterprise onboarding flow visible |
| **First commercial deployment** | v1.0.0 release tag; deployment architecture documented |
| **Marketplace listing** | AppExchange and Atlassian Connect package code visible and documented |

---

*Maintained by: Stephen Lutar, Founder — SZL Holdings*  
*See also: [Public Mirror Policy](public-mirror-policy.md) | [Excluded Content Policy](excluded-content-policy.md)*
