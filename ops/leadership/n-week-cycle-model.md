# N-Week Cycle Model — SZL Holdings

**Phase:** H · **Audience:** Founder, internal · **Last reviewed:** 2026-04-16

---

## Purpose

A 6-week cycle is the unit of company-level execution at SZL Holdings. Long enough to ship something meaningful; short enough to course-correct before drifting. The cycle model defines how strategic priorities are turned into 6 weeks of focused work, and how the company learns from each cycle to improve the next.

This is heavily influenced by Shape Up (Basecamp) and adapted for a founder-led, design-partner-stage company.

---

## The Cycle Structure

```
Cycle = 6 weeks of focused work + 2 weeks of cooldown
                                = 8-week super-cycle
```

The 8-week super-cycle is the planning unit. The 6-week cycle is the execution unit. The 2-week cooldown is for synthesis, refactoring, and selecting the next cycle's bets.

**Cycles per year:** 6 (with breaks built in for holidays / offsite / fundraise sprints)

---

## What Happens in a 6-Week Cycle

### One primary objective
Each cycle has one primary objective, written as a single sentence. Examples:
- "Sign 3 new design partners in the security domain pack."
- "Convert 2 pilots to production contracts."
- "Ship the Outcome Graph public surface and launch the case study landing page."
- "Reduce time-to-first-decision in pilots from Day 14 to Day 7."

### Three to five strategic bets
Each cycle ships 3-5 strategic bets — projects scoped to the 6-week shape. Bets are sized to fit; if they don't fit, they are re-shaped or deferred.

### Bet shape (the planning artifact)
Each bet is shaped before the cycle begins. Shaping = a 1-2 page document covering:
- **Problem:** What pain or opportunity this addresses
- **Appetite:** How much time the bet is worth (small bet = 2 weeks; big bet = 6 weeks)
- **Solution outline:** The shape of the work, not the implementation detail
- **Rabbit holes:** What could derail this; how we avoid them
- **No-gos:** What we explicitly will NOT do as part of this bet

### Founder bet vs. team bet
At the design partner stage, most bets are founder-led:
- Founder bets: typically commercial (pilots, deals, references) or strategic (positioning, content)
- Team bets (when team exists): typically product (features, infrastructure) or ops (CS, security)

---

## The Cycle Calendar

```
Week -2  : Cooldown 2 (last cooldown week; cycle planning happens here)
Week -1  : Cooldown 1 (founder finalizes bet shapes; pre-cycle prep)
Week 0   : Cycle kickoff (Monday morning)
Week 1-2 : Discovery and rapid progress on each bet
Week 3-4 : Mid-cycle: course-correct or kill bets that aren't working
Week 5-6 : Push to cycle end; ship what's shippable
Week 7   : Cooldown 1 (synthesis; what worked, what didn't)
Week 8   : Cooldown 2 (next cycle planning)
```

---

## Cycle Kickoff (Monday of Week 0)

### Agenda (3 hours)
- 30 min: Review last cycle's retrospective
- 30 min: State the primary objective for this cycle
- 60 min: Walk through each bet shape
- 30 min: Define the cycle's success criteria
- 30 min: Calendar the cycle (deep work blocks, partner reviews, milestone reviews)

### Output
- One-page cycle plan: objective, bets, success criteria
- Each bet shape finalized
- Cycle calendar set

---

## Mid-Cycle Check (End of Week 3)

The most important meeting of the cycle. By end of Week 3, we should know:
- Which bets are on track
- Which bets are off track
- Which bets need re-shaping or killing

### Agenda (2 hours)
- 30 min per bet: status, what's working, what's not, what's needed
- 30 min: collective decision — what to push, what to re-shape, what to kill

### Mid-cycle decisions

| State | Action |
|-------|--------|
| On track | Continue; no change |
| Off track but recoverable | Re-scope (cut features); ship the smaller version |
| Off track, not recoverable in this cycle | Kill; defer to next cycle's planning OR drop entirely |
| Discovered a bigger opportunity | Capture in cooldown planning; do not chase mid-cycle |

**Killing a bet mid-cycle is a feature, not a failure.** The point of mid-cycle check is to free time for what's working.

---

## Cycle End (End of Week 6)

### Cycle close meeting (2 hours)
- Walk through every bet: shipped or killed?
- Review primary objective: did we hit it?
- Capture lessons: what did we learn about the company, the market, the playbook?

### Cycle output document (1-2 pages)
- Primary objective: hit / partial / missed
- Each bet: status (shipped, partial, killed, deferred)
- Lessons (3-5 bullets)
- Cycle metrics (pilots signed, conversions, revenue, product velocity)
- Input to next cycle's planning

---

## The Cooldown (Weeks 7-8)

The cooldown is not "vacation." It is a different mode of work.

### Week 7 — Synthesis
- Founder: write the cycle retrospective
- Founder: catch up on industry reading, competitor analysis, market signals
- Founder: refactor: clean up tracker, archive completed work, update positioning docs
- Pipeline: keep moving (no slowdown on commercial cadence)

### Week 8 — Planning
- Founder: shape next cycle's bets (1-2 pages each)
- Founder: surface candidate bets through pipeline review, product gaps, strategic priorities
- Founder: decide the primary objective for the next cycle
- Cycle planning meeting end of Week 8

---

## Cycle Quality Bars

A cycle was healthy if:
- ✅ Primary objective was hit or close (>70%)
- ✅ At least 60% of bets shipped (the rest killed deliberately)
- ✅ Mid-cycle check happened and produced real decisions
- ✅ Cooldown was used for synthesis and planning, not panic
- ✅ Founder wrote the retrospective and used it to inform the next cycle

A cycle was unhealthy if:
- ❌ Primary objective was forgotten by Week 3
- ❌ All bets were "still in progress" at Week 6 (no shipping discipline)
- ❌ Mid-cycle check was skipped
- ❌ Cooldown was consumed by reactive work
- ❌ Next cycle planning happened "during" the next cycle (no pre-shaping)

---

## When to Use Different Cycle Lengths

The 6-week cycle is the default. Variations:

| Cycle length | When to use |
|--------------|-------------|
| 6 weeks | Default — strategic work + product + commercial |
| 4 weeks | Early-stage, fast-iteration, small team (e.g., first 6 months) |
| 8 weeks | Larger product investments, infrastructure work |
| 12 weeks (rare) | Major architectural overhaul; almost always too long |

Avoid mixing cycle lengths within a single planning unit. Pick one and run it consistently for at least 4 cycles before changing.

---

## Annual Cycles (Pattern)

A typical year (6 cycles):

```
Q1 Cycle 1 — Theme: [annual theme] kickoff
Q1 Cycle 2 — Q1 momentum cycle
Q2 Cycle 3 — Q2 expansion cycle
Q2 Cycle 4 — Pre-summer push
Q3 Cycle 5 — Fall ramp
Q4 Cycle 6 — Year-end close + next year prep
```

The annual offsite (see `company-operating-rhythm.md`) sets the annual theme. The 6 cycles execute against it.

---

## Anti-Patterns

- **No cycles.** Just continuous work. Founder loses sense of progress and direction.
- **Cycles without primary objective.** Bets without alignment; momentum without direction.
- **Cycles without mid-cycle check.** Bets drift, founder discovers at Week 6 that nothing is shippable.
- **Cycles without cooldown.** Founder burns out by cycle 3.
- **Cycles that always slip.** If every cycle goes 8 weeks, the cycle length is wrong. Lengthen it OR fix the planning.
- **Bets too big to ship.** Re-shape during planning; if it can't be shaped to fit, it's not a cycle bet, it's a multi-cycle initiative.

---

*The 6-week cycle is the unit of execution. The cooldown is the unit of synthesis. Run the rhythm consistently and the company ships more, learns more, and stays out of the founder-burnout trap.*
