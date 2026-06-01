# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Doctrine v13 — WAYRA organ (the wind/breath). Additive 4th edge organ.
"""
normalize.py — canonical IngestEvent + normalization helpers for WAYRA.

WAYRA (Quechua *wayra* = "wind, air"; Wiktionary: https://en.wiktionary.org/wiki/wayra)
is the empire's lungs: it breathes in the world's continuous knowledge stream and
renders every inbound item into one canonical shape so every downstream organ sees
the same envelope. Every source adapter emits an `IngestEvent`; the WAYRA factor is
computed on it; a Khipu receipt is chained for it.

Stdlib only (dataclasses, hashlib, json, time, datetime). No external deps so it
runs in the slim a11oy Docker image with zero new pip installs.

Honest labels (Doctrine v12 §2, carried): scores below are heuristic, deterministic,
inspectable functions in [0,1] — NOT a trained model and NOT a claim of ground truth.
They exist so the Yuyay-13 gate has an admissible, reproducible signal to act on.
"""
from __future__ import annotations

import hashlib
import json
import time
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Any

# ---------------------------------------------------------------------------
# Canonical organ routing targets (the SZL flagships WAYRA can route to).
# ---------------------------------------------------------------------------
KNOWN_ORGANS = {
    "a11oy",      # coding brain / model router
    "amaru",      # governance / receipts
    "sentra",     # security gates
    "vessels",    # maritime
    "killinchu",  # drone flagship
    "rosie",      # orchestration
    "wasi-rikuq", # observability / resilience (telemetry sink)
    "wallpa",     # voice / digest narration
    "puriq",      # agentic layer (doctrine updates)
}


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def content_hash(*parts: Any) -> str:
    """Deterministic SHA3-256 over the canonicalized parts. Used for dedup."""
    raw = json.dumps(
        [p for p in parts], sort_keys=True, separators=(",", ":"), default=str
    ).encode("utf-8")
    return hashlib.sha3_256(raw).hexdigest()


@dataclass
class IngestEvent:
    """The single canonical shape every WAYRA source emits.

    Fields:
      source          — source category id (e.g. "hf_hub", "github_releases", "arxiv")
      source_detail   — sub-source (org/repo/category), free-form
      timestamp       — ISO-8601 UTC of the *source* event (publication / last_modified)
      ingested_at     — ISO-8601 UTC of when WAYRA breathed it in
      title           — short human title
      url             — canonical public URL of the item
      content_hash    — dedup key (sha3-256 over identity-defining fields)
      raw             — minimal raw payload kept for replay (bounded)
      parsed_summary  — short normalized summary string
      license         — detected license / ToS class (string; may be "unknown")
      yuyay_score     — [0,1] 13-axis admissibility heuristic (see yuyay_gate)
      novelty_score   — [0,1] novelty vs known corpus
      wayra_factor    — [0,1] = quality * novelty * yuyay (the WAYRA sub-formula)
      organ_routing   — list of KNOWN_ORGANS this event is routed to
      decision        — "accept" | "review" | "drop" (set by the Yuyay gate)
    """
    source: str
    source_detail: str
    timestamp: str
    title: str
    url: str
    content_hash: str
    raw: dict[str, Any] = field(default_factory=dict)
    parsed_summary: str = ""
    license: str = "unknown"
    yuyay_score: float = 0.0
    novelty_score: float = 0.0
    wayra_factor: float = 0.0
    organ_routing: list[str] = field(default_factory=list)
    decision: str = "review"
    ingested_at: str = field(default_factory=utc_now_iso)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "IngestEvent":
        known = {f for f in cls.__dataclass_fields__}  # type: ignore[attr-defined]
        return cls(**{k: v for k, v in d.items() if k in known})


def make_event(
    *,
    source: str,
    source_detail: str,
    timestamp: str,
    title: str,
    url: str,
    raw: dict[str, Any] | None = None,
    parsed_summary: str = "",
    license: str = "unknown",
    identity_parts: list[Any] | None = None,
) -> IngestEvent:
    """Construct an IngestEvent with a deterministic content_hash.

    `identity_parts` defaults to [source, url, timestamp] — the dedup identity.
    Scores/routing are filled later by the Yuyay gate + router.
    """
    raw = raw or {}
    parts = identity_parts if identity_parts is not None else [source, url, timestamp]
    return IngestEvent(
        source=source,
        source_detail=source_detail,
        timestamp=timestamp,
        title=title.strip()[:500],
        url=url,
        content_hash=content_hash(*parts),
        raw=raw,
        parsed_summary=parsed_summary.strip()[:2000],
        license=license,
    )


# ---------------------------------------------------------------------------
# License classification — GREEN / AMBER / RED (mirrors WALLPA license_class tag,
# Doctrine v13 §2.2). GREEN = unrestricted commercial; AMBER = AUP / MAU clause;
# RED = research-only / closed / unknown-restrictive.
# ---------------------------------------------------------------------------
_GREEN = {"apache-2.0", "apache2.0", "mit", "bsd-3-clause", "bsd-2-clause",
          "cc0-1.0", "cc-by-4.0", "cc-by-sa-4.0", "unlicense", "isc", "cc-by"}
_AMBER = {"llama", "gemma", "qwen", "openrail", "creativeml", "cc-by-nc",
          "llama3", "llama4", "llama2"}
_RED = {"research-only", "cc-by-nc-4.0", "proprietary", "closed", "noncommercial",
        "non-commercial", "all-rights-reserved"}


def license_class(license_str: str) -> str:
    """Return GREEN / AMBER / RED for a license string (lowercased substring match)."""
    if not license_str:
        return "RED"
    s = license_str.strip().lower()
    for tok in _RED:
        if tok in s:
            return "RED"
    for tok in _GREEN:
        if s == tok or s.startswith(tok):
            return "GREEN"
    for tok in _AMBER:
        if tok in s:
            return "AMBER"
    if s in ("unknown", ""):
        return "RED"
    return "AMBER"
