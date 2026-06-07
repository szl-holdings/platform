# Rollout Playbook

## Standard Feature Rollout

### Day 1: Internal
- Enable flag for SZL team only (5%)
- Monitor for 24 hours
- Check error rates, performance, UX issues

### Day 2-3: Beta
- Enable for beta users (10%)
- Collect feedback
- Fix any issues found

### Day 4-5: Gradual
- Increase to 25%
- Monitor metrics
- Compare with control group

### Day 7: Majority
- Increase to 50%
- Monitor for 48 hours
- Check all KPIs

### Day 10: Full Rollout
- Increase to 100%
- Final monitoring period (48 hours)
- Schedule flag cleanup

### Day 14+: Cleanup
- Remove flag checks from code
- Delete flag from registry
- Document in changelog

## Emergency Rollback
1. Set flag to false (kill switch)
2. Notify team immediately
3. Investigate root cause
4. Fix the issue
5. Re-start rollout from beginning

## Rules
- Never skip the internal testing phase
- Never go from 0% to 100% in one step
- Always have a rollback plan before enabling
- Monitor error rates for 30 minutes after each increase
- Document every rollout decision
