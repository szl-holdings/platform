# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Doctrine v11 — 749/14/163 — replay hash c7c0ba17 — signed Yachay
"""szl_throttle — FastAPI rate-limiting + CORS + Khipu-audited rejections.

One-line install into any SZL flagship serve.py startup:

    from szl_throttle import setup
    setup(app)

Provides:
  * Token-bucket rate limiter (default 100 req/min per client IP, configurable).
  * CORS middleware with an SZL-default allow-list.
  * Khipu audit: every 429 (rate-limit) or CORS rejection emits a hash-chained
    Khipu receipt to an in-process ledger (and an optional DSSE signing hook).
"""
from .middleware import (
    setup,
    TokenBucketRateLimiter,
    KhipuAuditLedger,
    SZL_DEFAULT_CORS_ALLOW,
)

__all__ = [
    "setup",
    "TokenBucketRateLimiter",
    "KhipuAuditLedger",
    "SZL_DEFAULT_CORS_ALLOW",
]
__version__ = "0.1.0"
