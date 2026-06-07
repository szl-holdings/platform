# Feature Flags — Overview

## Purpose
Feature flags provide safe, controlled rollout of new features. They allow us to:
- Deploy code without exposing features to all users
- Gradually roll out features to specific user segments
- Instantly disable problematic features (kill switches)
- Run experiments with controlled feature variations
- Manage beta access programs

## Flag Types

| Type | Purpose | Example |
|------|---------|---------|
| **Release Flag** | Control feature visibility during rollout | `new-dashboard-v2` |
| **Experiment Flag** | A/B test feature variations | `pricing-page-variant` |
| **Ops Kill Switch** | Emergency disable capability | `disable-ai-inference` |
| **Internal-Only Flag** | Features only visible to SZL team | `admin-debug-panel` |
| **Beta Access Flag** | Features for beta program users | `beta-vessel-analytics` |
| **Platform Safety Flag** | System-level safety controls | `enforce-rate-limits` |

## Flag Lifecycle
```
Created → Active → Rolled Out (100%) → Cleanup → Removed
              ↓
         Kill Switch (disabled) → Re-enabled or Removed
```

## Database Schema
Feature flags are stored in `feature_flags` and `feature_flag_overrides` tables:
- `feature_flags`: Flag definition, default value, type, owner, description
- `feature_flag_overrides`: Per-user, per-org, or percentage-based overrides

## Flag Requirements
Every flag must have:
- Owner (who is responsible)
- Description (what it controls)
- Default value (off by default for safety)
- Environments (which environments it applies to)
- Created date
- Expiry/review date (no permanent stale flags)

## Operations
See [Feature Flag Operations](./operations.md) for day-to-day management.
See [Cleanup Policy](./cleanup-policy.md) for flag lifecycle and removal rules.
