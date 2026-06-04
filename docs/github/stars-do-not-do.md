# GitHub Stars — Anti-Patterns

**Version:** 1.0  
**Owner:** Stephen Lutar  
**Last Updated:** April 2026

---

## What Not To Do

This document describes failure modes in GitHub star management. Avoid these. None are catastrophic individually; collectively they turn a research asset into noise.

---

## Anti-Pattern 1: Trending Page Browsing

**What it looks like:** Opening github.com/trending on Monday morning and starring 8 repos because they appear interesting.

**Why it's a problem:** Trending repos are popular with the GitHub audience at large, not with SZL's product and infrastructure domains. You will accumulate TypeScript toy projects, viral README templates, and AI demos that never connect to any active decision.

**The rule:** Only star from a context — a problem you're solving, a decision you're evaluating, a competitor you're researching.

---

## Anti-Pattern 2: Stars Without Lists

**What it looks like:** A growing collection of starred repos, none assigned to a list.

**Why it's a problem:** An unlisted star has no retrieval path. You cannot search or filter stars by tag in the GitHub UI. Within 3 months, a 150-repo collection with no lists is functionally opaque. You can't find what you need; you don't know what's there.

**The rule:** Every starred repo gets assigned to a list within 24 hours of being starred. If it doesn't fit a list, it doesn't get a star.

---

## Anti-Pattern 3: Volume as Signal

**What it looks like:** Treating a high star count (3,000+) as evidence of good curation.

**Why it's a problem:** Volume correlates with curiosity, not discipline. The research value of a curated 300-repo collection is higher than a sprawling 3,000-repo one that no one actually reads.

**The rule:** Target 200-400 stars. Above 400 triggers a review pass. Above 600 is an active failure state requiring pruning.

---

## Anti-Pattern 4: Demo and Tutorial Stars

**What it looks like:** Starring repos named `awesome-react-tutorial`, `react-crash-course-2024`, `build-your-own-x`.

**Why it's a problem:** Tutorial repos document learning paths, not production decisions. They are out of date within 12 months, often forked from better-maintained originals, and do not reflect how systems work at scale.

**The rule:** Star production codebases, not learning materials. If you need a tutorial, find it; don't archive it.

---

## Anti-Pattern 5: Reciprocal Starring

**What it looks like:** Starring someone's repo because they starred yours, or because they are a person you want to acknowledge.

**Why it's a problem:** The collection becomes a social map, not a research index. Every repo that enters via social reciprocity dilutes the strategic signal.

**The rule:** Stars are not social currency. Do not use them as appreciation or acknowledgment.

---

## Anti-Pattern 6: Abandoned Repos in Active Lists

**What it looks like:** A repo last committed 18 months ago remains in the Observability list.

**Why it's a problem:** If you're benchmarking against an abandoned project, you're benchmarking against nothing. Decisions informed by dead projects are uninformed decisions.

**The rule:** Monthly review pass checks for repos with no commits in 12+ months. They get unstarred or moved to a dead-reference note in the journal.

---

## Anti-Pattern 7: Stars as Backlog

**What it looks like:** "I'll star this and read it properly later." Three months pass. You don't read it.

**Why it's a problem:** A star is not a read-later queue. It is a research index. If you have 40 repos you've starred to read later and haven't touched, the system is being used wrong.

**The rule:** If you need to read something, open it in a tab or export it to a reading list. Stars mean "this is worth tracking," not "I intend to study this."

---

## Anti-Pattern 8: Over-Precision on Categorization

**What it looks like:** Spending 20 minutes debating whether a repo goes in Component Libraries vs. Design/UI.

**Why it's a problem:** The goal is useful retrieval, not perfect taxonomy. Both lists are reviewed. Put it in the most natural home and move on.

**The rule:** When in doubt, choose the list where you'd most likely look for it. Don't over-engineer the placement.

---

## Anti-Pattern 9: Stars as Competitive Moat Monitoring

**What it looks like:** Starring every repo from a competitor's organization to "watch them."

**Why it's a problem:** This is not how you monitor competitors. It floods your collection with their internal tooling, experiments, and scaffolding. Use your Competitive/Reference list deliberately — one or two canonical repos per competitor.

**The rule:** One canonical repo per competitor unless there's a specific, distinct technical signal in a second repo.

---

## Anti-Pattern 10: Never Pruning

**What it looks like:** A star collection that only grows, never shrinks.

**Why it's a problem:** GitHub as an ecosystem moves fast. A framework that was the benchmark 24 months ago may now be deprecated, superseded, or simply no longer the right reference point. A collection that only grows becomes historical noise.

**The rule:** Quarterly review includes a pruning pass. Anything that no longer connects to an active product domain or decision gets removed.
