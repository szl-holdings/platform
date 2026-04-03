# SZL Holdings — Gist Policy

**Date:** April 2026  
**Status:** Canonical  
**Authority:** Stephen Lutar, Founder

---

## Policy Statement

GitHub Gists are not a primary brand surface for SZL Holdings. They are a tool for sharing small, standalone code artifacts — not for presenting the company, its products, or its capabilities.

The public impression sequence is: **live demo → trust / architecture / docs → GitHub repos**. Gists appear nowhere in this sequence and must not be inserted into it.

---

## Acceptable Use

Gists are acceptable when all of the following are true:

| Criterion | Requirement |
|-----------|-------------|
| **Size** | Small, self-contained — fits in a single file or a handful of files |
| **Purpose** | Reference artifact, not product demonstration |
| **Content type** | Configuration snippets, CLI one-liners, example queries, schema fragments |
| **Audience** | Technical users looking for a specific pattern, not evaluators forming a first impression |
| **Polish** | Clean, documented, no placeholder text, no broken syntax |
| **Link context** | Linked from documentation or a repo README — not from the homepage, hero section, or any marketing surface |

### Acceptable Gist Examples

- SQL query demonstrating a Drizzle schema pattern — linked from architecture docs
- Example environment variable configuration — linked from CONTRIBUTING.md
- CLI snippet for a deployment operation — linked from infra docs
- Example API request/response for a documented endpoint — linked from API reference

---

## Unacceptable Use

| Pattern | Why It's Unacceptable |
|---------|----------------------|
| Gist as first CTA from homepage or bio | Sends evaluators to an unbranded, unpolished surface |
| Gist replacing a proper repo for a product or feature | Creates a weak impression; no governance, no README standard |
| Gist linked from the profile README hero section | Undermines brand professionalism |
| Gist containing partial or work-in-progress code | Public-facing WIP is a credibility risk |
| Gist containing any real credentials, tokens, or secrets | Security incident — report and delete immediately |
| Gist that duplicates content already in the flagship repo | Redundant — link to the repo instead |
| Secret gist for anything requiring access control | Use private repos, not secret gists |

---

## Approval Gate

Before creating a public gist:

- [ ] Is this content small enough that a repo would be overkill? If no — create a repo.
- [ ] Is this content polished and complete? If no — do not publish.
- [ ] Is the gist being linked from docs or a repo README (not a hero/marketing surface)? If no — reconsider.
- [ ] Does the gist contain any credentials, secrets, or real data? If yes — do not publish, add to secrets scan instead.
- [ ] Is there already a better home for this content in the flagship repo? If yes — use the repo.

---

## Existing Gists — Audit Protocol

1. Review all gists on `github.com/stephenlutar2-hash?tab=gists`
2. For each gist, apply the acceptable use criteria
3. Gists that do not meet criteria: make private or delete
4. Gists that meet criteria: verify link placement is appropriate
5. Document any retained gists in the table below

### Retained Gists Registry

| Gist | Purpose | Linked From | Review Date |
|------|---------|-------------|-------------|
| (none currently registered) | — | — | — |

Update this table whenever a gist is created or retained after audit.

---

## Summary Rule

**If it deserves to be public, it deserves to be in a repo.**  
Gists are scratch surfaces. Repos are the brand.
