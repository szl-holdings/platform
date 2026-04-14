# Feedback Status Model

## Lifecycle

```
new → triaged → planned → in-progress → released
                ↓
             declined
```

## Status Definitions

### new
- Just received, no review yet
- Auto-acknowledged to submitter
- SLA: Review within 48 hours

### triaged
- Reviewed by product team
- Severity and product assigned
- Owner assigned
- Decision: plan, decline, or investigate further

### planned
- Added to product roadmap
- Approximate timeline communicated
- Linked to internal tracking

### in-progress
- Implementation started
- Submitter may be contacted for clarification
- Progress updates at key milestones

### released
- Shipped to production
- Submitter notified
- Noted in release notes if significant

### declined
- Not pursuing
- Decline reason documented
- Submitter notified with explanation
- Common reasons: out of scope, duplicate, insufficient demand, technical infeasibility

## Triage Queue Rules
1. Bug reports triaged within 24 hours
2. Feature requests triaged within 1 week
3. Critical bugs escalated immediately
4. Duplicate requests merged
5. All feedback reviewed in weekly product review
