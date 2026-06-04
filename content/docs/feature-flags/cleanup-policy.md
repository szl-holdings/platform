# Feature Flag Cleanup Policy

## Rules
1. **No permanent flags**: Every flag must have a review date
2. **90-day maximum**: Flags older than 90 days must be reviewed and either renewed or removed
3. **Fully rolled out = remove**: Once a flag is at 100% for 2+ weeks, remove it
4. **Dead flags = remove**: If a flag hasn't been toggled in 60 days, review for removal
5. **No orphan flags**: If the owning feature is removed, the flag must be removed too

## Review Cadence
- Weekly: Review flags approaching expiry
- Monthly: Audit all active flags for staleness
- Quarterly: Full flag registry audit

## Removal Process
1. Verify flag is at 100% (fully rolled out) or no longer needed
2. Remove flag checks from application code
3. Remove flag from feature_flags table
4. Remove any overrides from feature_flag_overrides
5. Update documentation
6. Log removal in changelog

## Exceptions
- Platform safety flags may be permanent (e.g., `enforce-rate-limits`)
- Ops kill switches may be permanent but must be reviewed quarterly
