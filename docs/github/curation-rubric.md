# GitHub Curation Rubric — SZL Holdings

**Version:** 1.0  
**Owner:** Stephen Lutar  
**Last Updated:** April 2026

---

## Purpose

This rubric exists to make the star/don't-star decision fast and consistent. Use it when you are evaluating a repo and not sure if it clears the bar. You don't need to run every repo through this in full — use it when your instinct is uncertain.

---

## Scoring Dimensions

Each dimension is scored 0–3. A repo needs a total score of **14 or above** (out of 24) to earn a star. Any dimension scoring 0 is a hard stop.

---

### 1. Design Quality (0–3)

Does the repo's code, structure, or visual output demonstrate taste?

| Score | Meaning |
|-------|---------|
| 0 | No structure — scaffolded, messy, or clearly a learning project |
| 1 | Functional but unremarkable — standard patterns, nothing worth studying |
| 2 | Deliberate and clean — clear thought in organization and presentation |
| 3 | Excellent — something a senior engineer or designer would call well-crafted |

---

### 2. Documentation Quality (0–3)

Is the repo well-documented in a way that creates learning value?

| Score | Meaning |
|-------|---------|
| 0 | No README, or a one-liner with no context |
| 1 | Basic README — describes what it is, not why or how |
| 2 | Good documentation — architecture notes, usage examples, decision rationale |
| 3 | Excellent — treats documentation as a first-class artifact; teaches concepts |

---

### 3. Architectural Signal (0–3)

Does the codebase structure teach something about how to build systems?

| Score | Meaning |
|-------|---------|
| 0 | No architecture — a flat list of files or a single-purpose script |
| 1 | Standard structure — uses common patterns without originality |
| 2 | Thoughtful structure — clear layering, separation of concerns, deliberate decisions |
| 3 | Instructive — studying this repo would improve how you think about system design |

---

### 4. Production Credibility (0–3)

Is this used in real systems, by real teams, at meaningful scale?

| Score | Meaning |
|-------|---------|
| 0 | Demo, toy, or tutorial — not used in production by anyone |
| 1 | Used by the author's own projects — limited external validation |
| 2 | Widely used — multiple organizations, credible adoption, active issues |
| 3 | Production-critical — used by organizations you'd recognize, battle-tested |

---

### 5. Codebase Organization (0–3)

Is the code organized in a way you'd want to emulate?

| Score | Meaning |
|-------|---------|
| 0 | Disorganized — hard to navigate, no clear pattern |
| 1 | Acceptable — follows convention but without intention |
| 2 | Clean — easy to navigate, good naming, clear file structure |
| 3 | Exemplary — the organization itself is a reference for how to structure a codebase |

---

### 6. Security Posture (0–3)

Does the repo handle security concerns appropriately for its domain?

| Score | Meaning |
|-------|---------|
| 0 | Security red flags — hardcoded secrets, no auth, obvious vulnerabilities |
| 1 | Neutral — doesn't address security specifically, but no obvious failures |
| 2 | Security-aware — appropriate handling of secrets, auth, and trust |
| 3 | Security-exemplary — demonstrates patterns worth copying for trust-critical systems |

*Note: A score of 0 on Security Posture is a hard stop — do not star.*

---

### 7. Relevance to SZL Products (0–3)

Does this repo connect to a specific product domain or architectural challenge at SZL?

| Score | Meaning |
|-------|---------|
| 0 | No connection — interesting but unrelated to any active SZL problem |
| 1 | Tangential — adjacent to a product domain but not directly applicable |
| 2 | Relevant — clearly applicable to one of: Lyte, Alloy, Aegis, Vessels, Terra, Carlota Jo, or shared infra |
| 3 | Directly applicable — solving a problem you are actively working on |

*Note: A score of 0 on Relevance is a soft stop — challenge yourself to name the product connection before starring.*

---

### 8. Uniqueness (0–3)

Does this offer something not already covered in the existing collection?

| Score | Meaning |
|-------|---------|
| 0 | Duplicate — already have a better repo covering the same ground |
| 1 | Overlapping — adds marginal coverage of a topic already well-represented |
| 2 | Distinct — covers an angle not currently in the collection |
| 3 | Fills a gap — addresses something missing from the collection |

---

### 9. Reuse Potential (0–3)

How likely is it that patterns, code, or architectural decisions from this repo could be directly applied or adapted into SZL products?

| Score | Meaning |
|-------|---------|
| 0 | Not reusable — too domain-specific, deprecated approach, or wrong stack |
| 1 | Low reuse — conceptually interesting but unlikely to be directly applied |
| 2 | Reusable patterns — specific components, patterns, or approaches worth borrowing |
| 3 | High reuse potential — actively applicable to current or near-term SZL development |

---

## Score Thresholds

| Total Score | Decision |
|------------|---------|
| 23–27 | Star and consider indexing in Reference Library |
| 16–22 | Star and assign to list |
| 9–15 | Hold — revisit in 30 days or when the use case becomes clearer |
| 0–8 | Do not star |
| Any dimension = 0 on Security Posture | Hard stop — do not star |

*Maximum score: 27 (9 dimensions × 3 points each)*

---

## Quick Evaluation Template

Use this for fast decisions (< 3 minutes):

```
Repo: [org/repo-name]
List candidate: [which list?]
Last commit: [date]

1. Design quality:        [ ]  Why: 
2. Documentation:         [ ]  Why: 
3. Architectural signal:  [ ]  Why: 
4. Production credibility:[ ]  Why: 
5. Code organization:     [ ]  Why: 
6. Security posture:      [ ]  Why: 
7. SZL relevance:         [ ]  Product: 
8. Uniqueness:            [ ]  What it adds: 
9. Reuse potential:       [ ]  How applied: 

Total: [ ]/27
Decision: [ Star ] [ Hold ] [ Skip ]
```

---

## Notes on Application

**You don't need to fill this out for every repo.** For repos where the decision is obvious (clearly excellent, clearly garbage), skip the rubric. Use it for the edge cases — repos that feel interesting but where you're not sure they clear the bar.

**The SZL Relevance score is the most important dimension.** A technically excellent repo that connects to nothing active at SZL should not get a star. The collection must serve the products.

**Security Posture is a filter, not just a score.** A score of 0 disqualifies the repo regardless of other scores. Curating repos with security red flags signals something about your judgment, not just your collection.
