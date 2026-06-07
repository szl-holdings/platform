# Founder Workflow — GitHub Stars

**Version:** 1.0  
**Owner:** Stephen Lutar  
**Last Updated:** April 2026

---

## Overview

This document answers one question: when you land on a GitHub repo, what do you do with it?

The answer is not always "star it." There are five possible actions. This workflow helps you pick the right one fast.

---

## The Five Actions

| Action | What it means | When to use |
|--------|--------------|-------------|
| **Star + List** | Curate into the research collection | Meets curation bar, fits a list |
| **Index** | Add to Reference Library | Exceptional — you'd cite it in a decision |
| **Note** | Add to journal without starring | Interesting but doesn't meet bar yet |
| **Ignore** | Close the tab | Doesn't fit any active context |
| **Unstar** | Remove from collection | Previously starred, no longer relevant |

---

## Decision Tree

```
You land on a repo.
        |
        v
Is it relevant to an active SZL problem, product, or domain?
        |
       NO → Ignore. Close the tab.
        |
       YES
        |
        v
Does it pass a quick curation check?
(Design quality, documentation, production credibility)
        |
       NO → Note in journal if the concept is interesting. Don't star.
        |
       YES
        |
        v
Does it fit one of the 8 canonical lists?
        |
       NO → It probably shouldn't be starred. Reconsider.
        |
       YES
        |
        v
STAR IT + assign to list immediately.
        |
        v
Is it exceptional?
(Would you cite it in an architectural decision? Does it teach a pattern?)
        |
       NO → Done. It's a curated star.
        |
       YES
        |
        v
Add to Reference Library shortlist in reference-library-index.md.
Write full entry during next monthly review.
```

---

## When to Star

Star a repo when:
- You're researching a specific problem and this repo is a real reference
- It directly benchmarks something you're building on Lyte, Alloy, Aegis, Vessels, Terra, or Carlota Jo
- It demonstrates an architectural pattern worth studying
- It's a competitive reference that gives you market context
- It's an example of documentation or design quality worth emulating

---

## When to Ignore

Ignore a repo when:
- It's interesting in the abstract but doesn't connect to anything active
- It's a tutorial or learning resource (not a production reference)
- You would never actually go back to it
- The list it would go into is already well-covered
- You landed on it through trending or social signal, not a specific research need

The test: "Could I explain in one sentence why this is in my collection and which SZL product it serves?" If you can't, ignore it.

---

## When to Note (Without Starring)

Note a repo in your journal when:
- It's interesting but too early — the project is young and may or may not mature
- You want to revisit it in 6 months to see if it's gained traction
- It covers a domain not yet active at SZL but potentially relevant in the future

Format for a journal note:

```
[Date] — [org/repo-name]
What it does: [one sentence]
Why I noted it: [one sentence]
Revisit: [specific date or trigger]
```

---

## When to Index (Reference Library)

Move a repo to the Reference Library when:
- You've actually cited it in a real architectural or product decision
- Reading the code taught you something you've applied
- You'd recommend it to a new team member as a benchmark
- It's the canonical example of how a domain solves a problem

Don't add a repo to the Reference Library just because it's high quality. The bar is that it *matters to your specific system* — not just that it's technically impressive.

---

## When to Unstar

Unstar a repo when:
- It hasn't been committed to in 12+ months and the pattern is now superseded
- The product or framework has been abandoned
- You find a better reference for the same purpose
- It no longer connects to any active SZL domain
- On reflection, you can't remember why you starred it

Unstarring is not failure. It's signal that the collection is healthy. A system that never shrinks is a system accumulating noise.

---

## The 60-Second Rule

When you land on a repo for the first time, you should be able to make the star/don't-star decision in 60 seconds or less.

If you're spending more than 60 seconds on the decision, you're either:
1. Over-researching something that doesn't clear the bar (ignore it)
2. Already convinced it's worth starring (star it and move on)
3. Uncertain about which list it belongs to (pick the closest one — you can reassign later)

The system exists so your individual decisions are fast. The review cadence exists so your occasional mistakes are corrected.

---

## Weekly Rhythm for Stars

**Monday (5 min):**
- Check if anything was starred over the weekend
- Assign to list or unstar

**During work (as needed):**
- When researching a specific problem: star relevant repos immediately
- Assign to list on the spot — don't leave unassigned stars

**End of week (5 min):**
- Verify all stars from this week have list assignments
- Note any shortlist candidates
- Close the loop
