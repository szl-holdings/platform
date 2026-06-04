# Feature Flag Operations

## Creating a Flag
1. Define the flag in the feature_flags table with all required fields
2. Set default to `false` (off) for safety
3. Assign an owner
4. Set an expiry/review date
5. Document what the flag controls

## Enabling a Flag
- **Per-user**: Add an override in feature_flag_overrides for specific user IDs
- **Per-org**: Add an override for a specific organization
- **Percentage**: Set a percentage rollout (0-100%)
- **Environment**: Enable for specific environments (dev, staging, production)

## Rolling Out
Recommended rollout sequence:
1. Internal team (5%)
2. Beta users (10%)
3. 25% of users
4. 50% of users
5. 100% of users
6. Remove flag (cleanup)

## Kill Switch Protocol
When a feature causes issues:
1. Set flag to `false` immediately
2. Notify team
3. Investigate root cause
4. Fix the issue
5. Re-enable flag gradually

## Monitoring
After enabling a flag:
- Monitor error rates for 30 minutes
- Check key metrics (load time, API response time)
- Watch user feedback channels
- Be ready to kill switch if needed

## Admin UI
Feature flags can be inspected and managed at `/admin` under the feature flags section.
