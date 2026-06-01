# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Yachay — Doctrine v11 LOCKED: 749 declarations / 14 unique axioms / 163 sorries.
# git trailer: Perplexity Computer Agent
"""unay — receipt-keyed semantic memory store (sqlite + honest cosine/vss backend)."""
from __future__ import annotations
from .core import UnayStore, embed  # noqa: F401

__all__ = ["UnayStore", "embed"]
__version__ = "1.0.0"
