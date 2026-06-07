"""quota.py — honor-system soft quota + hard ceiling. No mock.
Author: Yachay (CTO authority) 2026-06-01."""
SOFT = {"demo": 1_000, "builder": 100_000, "professional": 1_000_000}

def quota_state(tier: str, calls_this_period: int) -> str:
    soft = SOFT.get(tier)
    if soft is None:                       # enterprise / dod_ic
        return "unlimited"
    if calls_this_period < soft:           return "ok"
    if calls_this_period < soft * 10:      return "over_quota"   # 402 advisory header
    return "hard_ceiling"                                        # 429
