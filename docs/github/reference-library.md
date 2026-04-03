# Reference Library System — SZL Holdings

**Version:** 1.0  
**Owner:** Stephen Lutar  
**Last Updated:** April 2026

---

## Purpose

The Reference Library is the top tier of the stars system. Not every starred repo belongs here — only repos that have earned a permanent context note explaining why they matter, what they teach, and how they relate to SZL's active products.

Think of it as the difference between a bookmark and a research file. Stars are bookmarks. The Reference Library is the research file.

---

## What Belongs in the Reference Library

A repo earns a Reference Library entry when it meets at least two of these criteria:

1. **Cited in an architectural decision** — you referenced it when making a real choice
2. **Taught a concept** — reading the code changed how you think about a problem
3. **Directly benchmarks a product** — it's the external reference point for a specific SZL feature
4. **Competitive anchor** — it's the canonical example of how a category solves a problem
5. **Permanent pattern reference** — the implementation is good enough that you'd use it as a standard

---

## Master Index Structure

The master index lives at `docs/github/reference-library-index.md`. It is organized by the 8 list categories, with each entry containing:

- Repo URL and name
- One-line description of what it is
- Context note explaining why it was indexed and what it teaches
- SZL product connection (which product/domain this informs)
- Date added
- Status (Active / Superseded / Archived)

---

## Entry Template

Use this template when adding a repo to the Reference Library:

```markdown
## [org/repo-name](https://github.com/org/repo-name)

**Category:** [List name]  
**Added:** [Month Year]  
**Status:** Active  
**SZL Connection:** [Product(s) this informs]

### What it is
[One paragraph: what the repo does, what problem it solves, who uses it]

### Why it's indexed
[One paragraph: what about this repo earned an index entry — what it teaches, why it matters as a benchmark]

### Key patterns to study
- [Specific file, directory, or pattern worth reading]
- [Another pattern worth studying]

### Limitations and caveats
[What this repo doesn't do well, or where its patterns break down — so you don't over-apply it]
```

---

## Shortlist Template

Use the shortlist template for fast tracking — when a repo is clearly reference-worthy but you don't have time for a full entry. Fill in the full entry during the next monthly review.

```markdown
## [org/repo-name] — SHORTLISTED

**Category:** [List name]  
**Added:** [Month Year]  
**SZL Connection:** [Product(s)]  
**Why shortlisted:** [One sentence — what caught your attention]  
**Full entry due:** [Next monthly review date]
```

---

## Promotion Pathway

```
Starred repo → [Weekly scan]
    ↓
Listed repo → [Monthly review]
    ↓
Reference Library shortlist → [Monthly review pass]
    ↓
Reference Library full entry → [Quarterly review or on active use]
```

Not every starred repo will reach the Reference Library. Most won't. The expected ratio is roughly:

- 100% of curated stars → listed
- 25–35% of listed repos → shortlisted
- 10–15% of starred repos → full Reference Library entry

---

## Maintenance Rules

- Full entries are reviewed quarterly for status (Active / Superseded / Archived)
- A repo is marked **Superseded** when a better reference exists for the same purpose
- A repo is marked **Archived** when it's abandoned and no longer reflects how the domain works
- Archived entries are not deleted — they provide historical context

---

## Current Entry Count Target

| Status | Target |
|--------|--------|
| Active full entries | 20–50 |
| Active shortlists | 10–20 |
| Archived (for history) | No limit |

A reference library with 30 well-annotated entries is more valuable than one with 200 stub entries.
