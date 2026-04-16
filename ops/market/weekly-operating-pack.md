# Weekly Operating Pack

**Last updated:** April 2026  
**Purpose:** Structured weekly review format for the founder. Keeps platform health, partner health, pipeline, and product signal organized in one consistent session.

---

## When to Run

**Day:** Monday morning (or last thing Friday)  
**Duration:** 30–45 minutes  
**Format:** Structured self-review — no meeting required  

Run this every week without exception. The discipline of a consistent weekly review prevents the accumulation of unaddressed issues.

---

## Section 1: Platform Health (10 minutes)

Run the following checks. Log results in the weekly log (see template at the end of this doc).

**API health:**
```bash
curl -sf https://$DOMAIN/api/health | jq '{status: .status, version: .version, dbLatencyMs: .db.latencyMs}'
```

**Web app availability:**
```bash
for path in / /firestorm/ /terra/ /vessels/ /carlota-jo/ /command/; do
  status=$(curl -sf -o /dev/null -w "%{http_code}" "https://$DOMAIN$path")
  echo "$path: $status"
done
```

**Log review:**
- Any recurring error patterns in Pino logs from the past 7 days?
- Any rate limit violations? (sign of integration issues or misuse)
- Any slow query warnings?

**Security review:**
- Any security disclosures received this week?
- Any secrets rotation due? (check rotation calendar in `manual-console-actions-master-final.md`)

**Results to log:**
- API health: Pass / Fail
- All web apps: Pass / [list failures]
- Error patterns: None / [describe]
- Security issues: None / [describe]

---

## Section 2: Partner Health (10 minutes)

Review each active design partner pilot.

For each partner, answer:

| Question | Check |
|---|---|
| Did they log in this week? | Yes (3+ times) / Yes (1–2 times) / No |
| Is the signal log updated? | Yes / Partially / No |
| Any open blockers from last week? | Resolved / Still open / New |
| Check-in sent and acknowledged? | Yes / Sent / Overdue |
| Next milestone coming up? | [30/60/90-day checkpoint date or "N/A"] |

**Status classification:**
- **On track:** Login consistent, logs maintained, no open blockers
- **Needs attention:** Login inconsistent or logs not updated
- **At risk:** No login this week, logs empty, unresolved blocker >48 hours

**Action if at risk:** Phone call today. Do not wait.

**This week's partner actions:**
- [ ] Send weekly async check-in to [Partner 1]
- [ ] Send weekly async check-in to [Partner 2]
- [ ] [Any checkpoint meetings this week?]

---

## Section 3: Pipeline Review (10 minutes)

Review every prospect in the pipeline.

**Pipeline tracker columns:**

| Org | Domain | Stage | Last Contact | Next Action | Expected Decision |
|---|---|---|---|---|---|
| [Name] | [Domain] | Inbound / Qualification / Diligence / Pilot / Review | [date] | [specific action] | [date] |

**Weekly actions:**
- Any prospect that has not advanced in 2 weeks → close or take a specific action
- Any demo request that arrived this week → process today
- Any qualification call to schedule this week → book it now
- Any diligence response overdue → send it

**Metrics to track:**
- Active pilots: [N]
- In qualification: [N]
- In diligence: [N]
- Demo requests this week: [N]
- Pipeline value (estimated ACV): [$X]

---

## Section 4: Product Signal (5 minutes)

Compile feedback from the past week:

**From partner interactions:**
- Feature requests or gaps mentioned this week: [list]
- Bugs reported this week: [list + P-level]
- Positive signals (things working well): [list]

**From logs:**
- Any error patterns that suggest product issues: [list]

**From this week's support interactions:**
- Any recurring questions that suggest a doc gap: [list]

**Routing:**
- Engineering backlog additions: [list]
- Docs to update: [list]
- Pricing/packaging feedback: [list]

---

## Section 5: This Week's Priorities (5 minutes)

Set 3–5 priorities for the week. Do not set more than 5.

| Priority | Owner | Done By |
|---|---|---|
| 1. [Most important thing] | Founder | [day] |
| 2. [Second most important] | Founder | [day] |
| 3. [Third] | Founder | [day] |

**Choosing priorities:**
- P0 issues always take priority 1
- Partner health issues take priority 2–3
- Pipeline actions take priority 3–4
- Product/platform tasks take priority 4–5

If there are more than 5 priorities, something is not a priority this week. Move it to next week.

---

## Weekly Log Template

Keep a running weekly log (markdown or notion or simple file):

```markdown
## Week of [Date]

### Platform Health
- API health: [Pass / Fail]
- Web apps: [Pass / Fail list]
- Error patterns: [None / describe]
- Security issues: [None / describe]
- Secrets rotation due: [None / describe]

### Partner Health
- [Partner 1]: [On track / Needs attention / At risk]
  - Last login: [date]
  - Signal log: [Updated / Not updated]
  - Open blockers: [None / describe]
  - Next milestone: [date + type]
- [Partner 2]: [same]

### Pipeline
- Demo requests this week: [N]
- Qualification calls this week: [N]
- Active pilots: [N]
- Any movement (advanced/closed/new): [describe]

### Product Signal
- Feature gaps surfaced: [list]
- Bugs reported: [list]
- Positive signals: [list]

### This Week's Priorities
1. [Priority]
2. [Priority]
3. [Priority]
```

---

## Monthly Additions to the Weekly Review

On the first Monday of each month, add:

- [ ] Secret rotation calendar check (see `manual-console-actions-master-final.md`)
- [ ] SLO performance review (availability, latency, error rate vs. targets)
- [ ] Partner pipeline conversion rate (pilots started / pilots converted)
- [ ] Proof output review (case studies in draft, published, or pending approval)
- [ ] Roadmap review: what product feedback has accumulated into clear priorities?

---

*See also: `founder-next-90-days.md` (90-day rhythm), `founder-support-control-room.md` (operational visibility)*
