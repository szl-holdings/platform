# GitHub Stars & Lists System — Summary

**Owner:** Stephen Lutar / SZL Holdings  
**Version:** 1.0  
**Date:** April 2026

---

## What Was Built

A complete internal operating system for GitHub Stars and Lists at SZL Holdings. Stars function as a deliberate research and benchmarking layer — not casual bookmarking — structured to serve six active product surfaces: Lyte, Alloy, Aegis, Vessels, Terra, and Carlota Jo.

---

## System Components

| File | Purpose |
|------|---------|
| `docs/github/stars-strategy.md` | Core strategy, guiding principles, star count targets |
| `docs/github/stars-why-it-matters.md` | The case for structured curation |
| `docs/github/stars-do-not-do.md` | Anti-patterns to avoid |
| `docs/github/list-taxonomy.md` | 8 canonical lists with inclusion/exclusion criteria |
| `docs/github/curation-rubric.md` | 8-dimension scoring rubric with evaluation template |
| `docs/github/reference-library.md` | Reference Library system: promotion pathway, templates |
| `docs/github/reference-library-index.md` | Master index (scaffolded, ready to populate) |
| `docs/github/review-cadence.md` | Weekly/monthly/quarterly review process + checklists |
| `docs/github/founder-workflow.md` | Decision tree: star, index, note, ignore, unstar |
| `scripts/github/stars/export-starred-repos.ts` | Export all starred repos to JSON + Markdown |
| `scripts/github/stars/generate-category-report.ts` | Generate category reports from export JSON |
| `scripts/github/stars/scaffold-list-taxonomy.ts` | Scaffold the 8 lists (or print manual steps) |

---

## The 8 Recommended Lists

| List | Slug | Target Count | SZL Connection |
|------|------|-------------|---------------|
| Design/UI | `design-ui` | 25–45 | All product surfaces |
| AI/Agents/RAG | `ai-agents-rag` | 30–50 | Alloy, AI integrations |
| Observability | `observability` | 20–35 | Lyte core domain |
| Security/Trust | `security-trust` | 20–35 | Aegis, all platform trust |
| Infra/DevOps | `infra-devops` | 20–35 | Deployment, CI/CD layer |
| Docs/README | `docs-readme` | 15–25 | Public docs quality |
| Component Libraries | `component-libraries` | 20–30 | Web + mobile UI |
| Competitive/Reference | `competitive-reference` | 25–40 | All 6 product domains |

**Total target star count: 200–400**

---

## Curation Rules

1. **Every star gets a list.** Stars without a list assignment are removed during the next weekly scan.
2. **Stars serve the products.** If you can't name which SZL product a star informs, don't star it.
3. **Minimum rubric score: 16/27.** The rubric has 9 dimensions (max 27 pts); scoring 0 on Security Posture is a hard stop regardless of total.
4. **No demo repos.** Tutorial and learning projects don't belong in a production research collection.
5. **No social starring.** Stars are not acknowledgment or reciprocity.
6. **Quarterly pruning is mandatory.** The collection should occasionally shrink. That's healthy.

---

## Review Cadence

| Cadence | Time | Focus |
|---------|------|-------|
| Weekly | 15 min | Assign new stars to lists; remove obvious misses |
| Monthly | 45 min | Stale check, shortlist promotion, list balance |
| Quarterly | 90 min | Full pruning, competitive update, reference library pass |

---

## Automation Status

| Script | Status | What It Does |
|--------|--------|-------------|
| `export-starred-repos.ts` | Ready | Exports all starred repos to JSON + Markdown. Requires `GITHUB_TOKEN` or unauthenticated (60 req/hr limit). Includes manual fallback. |
| `generate-category-report.ts` | Ready | Reads exported JSON, classifies repos by taxonomy, generates per-category Markdown reports. No auth required after export. |
| `scaffold-list-taxonomy.ts` | Ready | Prints canonical list definitions and step-by-step manual setup instructions. Validates token if present. GitHub Lists require the web UI — not API-creatable. |
| `print-system-summary.ts` | Ready | Prints terminal summary of all system files with status checks and quick-reference commands. |

**Auth requirement:** Set `GITHUB_TOKEN` env variable for full API access. All scripts include manual fallback instructions when auth is unavailable.

**Run all scripts:**
```bash
# Print terminal summary of all system files
npx tsx scripts/github/stars/print-system-summary.ts

# Step 1: Export starred repos
npx tsx scripts/github/stars/export-starred-repos.ts

# Step 2: Generate category reports
npx tsx scripts/github/stars/generate-category-report.ts

# Step 3: View canonical list definitions + guided manual setup
npx tsx scripts/github/stars/scaffold-list-taxonomy.ts
```

Outputs are written to `exports/github-stars/`.

---

## Next 10 Manual Actions

Complete these in order. Each builds on the last.

**1. Create the 8 lists in GitHub UI**
Go to `github.com/[username]?tab=stars` → Create list → Use names and descriptions from `list-taxonomy.md`.  
Time: 10 minutes.

**2. Audit existing stars**
Run `export-starred-repos.ts` (or use GitHub web). Review what's already starred. Delete anything that doesn't pass the relevance test.  
Time: 20 minutes.

**3. Generate a category report**
Run `generate-category-report.ts` on the export. Review the Uncategorized bucket — those need assignment or removal.  
Time: 10 minutes.

**4. Assign all existing stars to lists**
Using the GitHub web UI, assign each currently-starred repo to one of the 8 canonical lists.  
Time: 30–60 minutes depending on current star count.

**5. First monthly review pass**
Run through the monthly checklist in `review-cadence.md`. This establishes the baseline.  
Time: 45 minutes.

**6. Populate Reference Library shortlist**
Identify the top 5–10 repos in your collection — the ones you've actually used to make decisions. Add them to the shortlist queue in `reference-library-index.md`.  
Time: 20 minutes.

**7. Write 3 full Reference Library entries**
Take your top 3 shortlisted repos and write full entries using the template in `reference-library.md`.  
Time: 30 minutes.

**8. Identify gaps by product**
For each of the 6 SZL products, name one research gap in your current collection. Schedule targeted research sessions to fill each gap.  
Time: 15 minutes.

**9. Set up a weekly calendar block**
Block 15 minutes every Monday (or Friday) for the weekly scan. This is the lowest-cost habit that keeps the system functional.  
Time: 2 minutes to create the calendar event.

**10. Run the first quarterly review**
In Q3 2026, run the full quarterly checklist from `review-cadence.md`. By then you'll have 2–3 months of data and the pruning pass will be meaningful.  
Time: 90 minutes (scheduled in advance).

---

## Operating Principles

The system is designed for a single founder running multiple product surfaces simultaneously. It is not designed to be comprehensive — it is designed to be useful. Every decision in the system prioritizes fast retrieval, low maintenance overhead, and direct connection to active product work.

A collection of 250 well-organized, well-indexed stars reviewed quarterly is worth more than 2,000 casual bookmarks that no one ever reads.

---

## System Files Created

```
docs/github/
  stars-strategy.md
  stars-why-it-matters.md
  stars-do-not-do.md
  list-taxonomy.md
  curation-rubric.md
  reference-library.md
  reference-library-index.md
  review-cadence.md
  founder-workflow.md

docs/final/
  stars-system-summary.md  ← this file

scripts/github/stars/
  export-starred-repos.ts
  generate-category-report.ts
  scaffold-list-taxonomy.ts
  print-system-summary.ts
```
