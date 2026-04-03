# Review Cadence & Maintenance Checklist — SZL Holdings

**Version:** 1.0  
**Owner:** Stephen Lutar  
**Last Updated:** April 2026

---

## Overview

A stars collection without a review cadence becomes stale within 6 months. This document defines exactly when to review, what to do during each pass, and what "done" looks like for each review type.

---

## Cadence Summary

| Review Type | Frequency | Time Budget | Focus |
|-------------|-----------|-------------|-------|
| Weekly Scan | Weekly | 15 min | Add new stars, assign to lists |
| Monthly Review | Monthly | 45 min | Check staleness, promote to shortlist, prune obviously dead repos |
| Quarterly Deep Review | Quarterly | 90 min | Full pruning pass, shortlist to full entries, rebalance lists |

---

## Weekly Scan (15 minutes)

**When:** Monday morning, before starting product work. Or Friday, as a close-out habit. Pick one and keep it.

**Purpose:** Process anything starred in the past 7 days. Every new star gets a list assignment before the week ends.

**Checklist:**

- [ ] Review all repos starred in the past 7 days
- [ ] Assign each new star to one of the 8 canonical lists
- [ ] Remove any star that doesn't survive a 10-second relevance check ("Why did I star this?")
- [ ] Note any repo that might be Reference Library material — add to shortlist queue if so
- [ ] Check that total star count has not drifted significantly above 400 (if > 400, note for monthly review)

**Done when:** Every starred repo has a list assignment. No starred repos are unassigned.

---

## Monthly Review (45 minutes)

**When:** First week of the month. Calendar block recommended.

**Purpose:** Quality pass on the collection. Remove stale repos. Promote shortlisted repos. Check list balance.

**Checklist:**

### Staleness Check
- [ ] Filter each list for repos with last commit > 12 months ago
- [ ] For each stale repo: is the pattern still relevant even if the repo isn't maintained?
  - If yes: keep with a mental note that it's historical reference
  - If no: unstar

### Orphaned Stars Check
- [ ] Verify no stars are unassigned to a list (should be zero after weekly scans)
- [ ] Assign any found orphans or unstar them

### Shortlist Promotion
- [ ] Review the shortlist queue in `reference-library-index.md`
- [ ] For any shortlisted repo older than 30 days: either write a full entry or remove from shortlist
- [ ] Promote one or two standout repos to full Reference Library entries if time permits

### List Balance Check
- [ ] Review total count per list against target ranges (see `list-taxonomy.md`)
- [ ] If any list is > 20% above maximum target, identify candidates for pruning
- [ ] If any list is significantly under minimum target, note research gaps

### Collection Quality Check
- [ ] Spot-check 10 random repos across the collection: would they still pass the curation rubric?
- [ ] Remove any that wouldn't pass

**Done when:** All stale candidates reviewed, all shortlists processed, all lists within target range, total count confirmed.

---

## Quarterly Deep Review (90 minutes)

**When:** First week of January, April, July, October.

**Purpose:** Full strategic review of the collection. This is the highest-investment pass and should leave the collection in noticeably better shape than when you started.

**Checklist:**

### Full Staleness Audit
- [ ] Review every list for repos with no commits in 12+ months
- [ ] Hard decision on each: keep (with documented reason) or unstar
- [ ] Review for repos where the ecosystem has moved on — project is "alive" but no longer the right benchmark

### Competitive/Reference List Update
- [ ] For each product (Lyte, Alloy, Aegis, Vessels, Terra, Carlota Jo): is the competitive benchmark still accurate?
- [ ] Have any new competitors or category leaders emerged that should be added?
- [ ] Are any previously competitive repos now obsolete (pivot, acquisition, shutdown)?

### Reference Library Full Pass
- [ ] All shortlisted repos either get full entries or get removed from shortlist
- [ ] Review all existing full entries: is the SZL Connection still accurate?
- [ ] Mark any entries as Superseded or Archived as appropriate
- [ ] Identify top 3 repos in the collection that don't have entries yet — write entries

### Pruning Pass
- [ ] Apply the curation rubric to any repo you're uncertain about
- [ ] Remove anything below the threshold
- [ ] Target: collection should be slightly smaller after a quarterly review than before — this is a sign of quality, not loss

### Gap Analysis
- [ ] For each SZL product: are there meaningful research gaps in the collection?
- [ ] List specific gaps for the next quarter's research sessions
- [ ] Note any categories that have been neglected

### Total Count Recalibration
- [ ] Confirm total star count is within 200–400 target range
- [ ] If above 400: pruning pass complete; reassess
- [ ] If below 200: identify high-priority research sessions to build coverage

**Done when:** Collection is clean, all lists balanced, reference library updated, gaps documented for next quarter.

---

## Maintenance Checklist Quick Reference

Print or bookmark this for fast use during reviews:

```
WEEKLY (15 min)
  [ ] All new stars assigned to lists
  [ ] Stars without obvious value removed
  [ ] Shortlist queue checked for new candidates

MONTHLY (45 min)
  [ ] Stale repos (12+ months) reviewed
  [ ] Orphaned stars cleared
  [ ] Shortlist queue processed (>30 days old = decide)
  [ ] One or two Reference Library entries written
  [ ] List counts checked against targets

QUARTERLY (90 min)
  [ ] Full staleness audit complete
  [ ] Competitive/Reference list updated for all 6 products
  [ ] All shortlist entries resolved
  [ ] All Reference Library entries reviewed
  [ ] Pruning pass — collection slightly smaller than before
  [ ] Gap analysis documented
  [ ] Total count within 200–400 target
```

---

## Tracking Review History

After each quarterly review, add a one-line entry to this section:

```
| Date | Stars Before | Stars After | Entries Added | Notes |
|------|-------------|------------|--------------|-------|
| [Q2 2026] | — | — | — | Initial system established |
```
