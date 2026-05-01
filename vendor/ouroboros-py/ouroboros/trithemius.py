"""
Trithemius module — Primitives 53-56.

Primitive 53: Carrier integrity (chi-square against baseline)
Primitive 54: Cipher-table provenance
Primitive 55: Steganographic key separation
Primitive 56: Polygraphic redundancy
"""

from __future__ import annotations

import hashlib
import json
import math
from dataclasses import dataclass
from typing import Dict, List, Literal, Optional


# ---------------------------------------------------------------------------
# Primitive 53 — Carrier integrity (chi-square against baseline)
# ---------------------------------------------------------------------------

@dataclass
class CarrierTest:
    observed: Dict[str, float]
    expected: Dict[str, float]  # same keys, expected counts
    threshold: float             # chi-square critical value


@dataclass
class CarrierReceipt:
    chi_square: float
    degrees_of_freedom: int
    threshold: float
    anomalous: bool
    rationale: str


def check_carrier(t: CarrierTest) -> CarrierReceipt:
    """
    Compute a Pearson chi-square statistic between observed and expected
    symbol frequencies; flag carrier if it exceeds the declared threshold.
    """
    keys = list(t.expected.keys())
    chi = 0.0
    for k in keys:
        o = t.observed.get(k, 0)
        e = t.expected[k]
        if e <= 0:
            continue
        chi += ((o - e) ** 2) / e

    df = max(1, len(keys) - 1)
    anomalous = chi > t.threshold
    return CarrierReceipt(
        chi_square=chi,
        degrees_of_freedom=df,
        threshold=t.threshold,
        anomalous=anomalous,
        rationale=(
            "carrier deviates from baseline beyond threshold"
            if anomalous
            else "carrier consistent with baseline within threshold"
        ),
    )


# ---------------------------------------------------------------------------
# Primitive 54 — Cipher-table provenance
# ---------------------------------------------------------------------------

@dataclass
class CipherProvenance:
    author: str
    work: str
    edition: str
    page: str


@dataclass
class CipherTable:
    table: Dict[str, str]
    provenance: CipherProvenance
    digest: str  # sha256 of canonical(table+provenance)


def _canon(table: Dict[str, str], p: CipherProvenance) -> str:
    """Canonical JSON of table+provenance (sorted keys, same as TS)."""
    sorted_keys = sorted(table.keys())
    sorted_table = [[k, table[k]] for k in sorted_keys]
    prov_dict = {
        "author": p.author,
        "work": p.work,
        "edition": p.edition,
        "page": p.page,
    }
    return json.dumps({"sortedTable": sorted_table, "p": prov_dict}, separators=(",", ":"))


def bind_cipher(table: Dict[str, str], provenance: CipherProvenance) -> CipherTable:
    """Bind a cipher table to its provenance with a SHA-256 digest."""
    digest = hashlib.sha256(_canon(table, provenance).encode()).hexdigest()
    return CipherTable(table=table, provenance=provenance, digest=digest)


def verify_cipher(ct: CipherTable) -> bool:
    """Verify that the cipher table digest matches the canonical content."""
    expected = hashlib.sha256(_canon(ct.table, ct.provenance).encode()).hexdigest()
    return expected == ct.digest


# ---------------------------------------------------------------------------
# Primitive 55 — Steganographic key separation
# ---------------------------------------------------------------------------

@dataclass
class ChannelBinding:
    asset: Literal["key", "carrier"]
    channel_id: str


@dataclass
class KeySeparationReceipt:
    key_channels: List[str]
    carrier_channels: List[str]
    overlap: List[str]
    passes: bool
    rationale: str


def audit_key_separation(bindings: List[ChannelBinding]) -> KeySeparationReceipt:
    """
    The key MUST travel by a different channel than the carrier. Verifies that
    cipher-key channels are disjoint from every carrier channel.
    """
    # Deduplicate while preserving insertion order (like JS Set spread)
    key_channels = list(dict.fromkeys(
        b.channel_id for b in bindings if b.asset == "key"
    ))
    carrier_channels = list(dict.fromkeys(
        b.channel_id for b in bindings if b.asset == "carrier"
    ))
    carrier_set = set(carrier_channels)
    overlap = [c for c in key_channels if c in carrier_set]
    passes = len(overlap) == 0 and len(key_channels) > 0 and len(carrier_channels) > 0
    if passes:
        rationale = "key and carrier channels are disjoint"
    elif overlap:
        rationale = "key channel overlaps carrier channel — separation violated"
    else:
        rationale = "missing key or carrier channel binding"
    return KeySeparationReceipt(
        key_channels=key_channels,
        carrier_channels=carrier_channels,
        overlap=overlap,
        passes=passes,
        rationale=rationale,
    )


# ---------------------------------------------------------------------------
# Primitive 56 — Polygraphic redundancy
# ---------------------------------------------------------------------------

@dataclass
class SymbolicRendering:
    system_id: str
    decoded: str


@dataclass
class PolygraphicReceipt:
    systems: int
    required: int
    quorum_value: Optional[str]
    agreement_count: int
    passes: bool
    rationale: str


def check_polygraphic(
    renderings: List[SymbolicRendering],
    required: int = 3,
    quorum_fraction: float = 2 / 3,
) -> PolygraphicReceipt:
    """
    Any critical message must be transmitted across >= 3 independent symbolic
    systems; reception is accepted only if a quorum of decodings agree.
    """
    distinct_systems = len({r.system_id for r in renderings})

    if distinct_systems < required:
        return PolygraphicReceipt(
            systems=distinct_systems,
            required=required,
            quorum_value=None,
            agreement_count=0,
            passes=False,
            rationale=f"under-redundant: {distinct_systems} systems < {required} required",
        )

    # Tally decoded values across DISTINCT systems (one vote per system, first seen)
    seen_systems: set = set()
    tally: Dict[str, int] = {}
    for r in renderings:
        if r.system_id in seen_systems:
            continue
        seen_systems.add(r.system_id)
        tally[r.decoded] = tally.get(r.decoded, 0) + 1

    best_val: Optional[str] = None
    best_count = 0
    for v, c in tally.items():
        if c > best_count:
            best_count = c
            best_val = v

    quorum_threshold = math.ceil(distinct_systems * quorum_fraction)
    passes = best_count >= quorum_threshold

    return PolygraphicReceipt(
        systems=distinct_systems,
        required=required,
        quorum_value=best_val if passes else None,
        agreement_count=best_count,
        passes=passes,
        rationale=(
            f"quorum reached: {best_count} of {distinct_systems} systems agree"
            if passes
            else f"no quorum: best agreement {best_count} below {quorum_threshold} required"
        ),
    )
