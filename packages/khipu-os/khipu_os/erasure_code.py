# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Perplexity Computer Agent — KHIPU-OS Reed-Solomon erasure coding
"""
erasure_code.py — REAL Reed-Solomon (n, k) erasure coding over receipt blocks.

HONEST NAMING (Zero-Bandaid Law):
  This is Reed–Solomon erasure coding over GF(2^8). It is NOT "holographic", NOT
  "quantum error correction", NOT any pseudo-physics. It is the same math used by
  RAID-6, CD/DVD, QR codes, and distributed-storage systems (Backblaze, Ceph, HDFS).
  Reference: Reed & Solomon (1960), "Polynomial Codes over Certain Finite Fields",
  J. SIAM 8(2):300-304. We use the `reedsolo` library (open-source, MIT) for the
  underlying GF(2^8) arithmetic and Berlekamp-Massey / Forney decoding.

SCHEME (systematic, shard-wise — the Backblaze/Vandermonde layout):
  · A data blob is split into `k` equal DATA shards (zero-padded to a multiple of k).
  · `m = n - k` PARITY shards are computed so that ANY `k` of the `n = k + m` shards
    reconstruct the original blob.
  · Erasure coding is applied COLUMN-WISE: for byte-column `c`, the k data bytes
    [d0[c], d1[c], ..., d_{k-1}[c]] form one RS message; reedsolo.RSCodec(m) appends
    `m` parity bytes, which become the c-th bytes of the m parity shards. Decoding a
    column with up to `m` *known-position* erasures uses reedsolo's `erase_pos`
    interface (an erasure costs 1 parity symbol, vs 2 for an unknown-position error),
    so we recover from any `m` lost shards — the (n, k) erasure guarantee.

This matches the Lean theorem `dag_reed_solomon_recovery`:
  an (n, k) Reed-Solomon code recovers all k data shards from any k present shards
  whenever at most n-k shards are erased.
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import reedsolo  # open-source (MIT). Hard dependency — no silent fallback.


@dataclass
class ErasureBlock:
    """An (n, k) RS-erasure-coded block of one data blob.

    shards[i] is shard i (0..k-1 are systematic DATA shards, k..n-1 are PARITY).
    A shard set to None denotes a LOST/erased shard (known-position erasure)."""
    k: int                       # data shards
    m: int                       # parity shards (n - k)
    shard_len: int               # bytes per shard
    orig_len: int                # original (pre-pad) blob length
    shards: List[Optional[bytes]]
    digest: str                  # sha3-256 of the original blob (integrity check)

    @property
    def n(self) -> int:
        return self.k + self.m

    def present_count(self) -> int:
        return sum(1 for s in self.shards if s is not None)


class ReedSolomonErasure:
    """Systematic (n, k) Reed-Solomon erasure coder over GF(2^8).

    n = k + m, with m = n - k parity shards. Recovers the original blob from ANY k
    of the n shards (i.e. tolerates up to m simultaneous shard losses)."""

    def __init__(self, k: int, m: int):
        if k < 1 or m < 1:
            raise ValueError("need k>=1 data shards and m>=1 parity shards")
        if k + m > 255:
            raise ValueError("GF(2^8) Reed-Solomon supports at most n=255 shards")
        self.k = k
        self.m = m
        # one column codeword = k message symbols + m parity symbols (per byte-column)
        self.rsc = reedsolo.RSCodec(nsym=m, nsize=k + m)

    # ---- encode -------------------------------------------------------------
    def encode(self, data: bytes) -> ErasureBlock:
        """Split `data` into k data shards and compute m parity shards (column-wise RS)."""
        orig_len = len(data)
        # pad so length is a multiple of k
        shard_len = (orig_len + self.k - 1) // self.k
        if shard_len == 0:
            shard_len = 1
        padded = data.ljust(shard_len * self.k, b"\x00")
        data_shards: List[bytearray] = [
            bytearray(padded[i * shard_len:(i + 1) * shard_len]) for i in range(self.k)
        ]
        parity_shards: List[bytearray] = [bytearray(shard_len) for _ in range(self.m)]

        # column-wise Reed-Solomon: encode each byte-column independently
        for c in range(shard_len):
            col = bytes(data_shards[r][c] for r in range(self.k))
            enc = self.rsc.encode(col)              # k data + m parity bytes
            for j in range(self.m):
                parity_shards[j][c] = enc[self.k + j]

        shards: List[Optional[bytes]] = [bytes(s) for s in data_shards] + \
                                        [bytes(s) for s in parity_shards]
        return ErasureBlock(
            k=self.k, m=self.m, shard_len=shard_len, orig_len=orig_len,
            shards=shards, digest=hashlib.sha3_256(data).hexdigest(),
        )

    # ---- decode / recover ---------------------------------------------------
    def decode(self, block: ErasureBlock) -> bytes:
        """Reconstruct the original blob from any >= k present shards.

        Lost shards must be marked as None in block.shards (known-position erasures).
        Raises if fewer than k shards are present (information-theoretically
        unrecoverable) or if an integrity check fails."""
        present = block.present_count()
        if present < block.k:
            raise reedsolo.ReedSolomonError(
                f"only {present} shards present; need at least k={block.k} to recover")

        erase_pos = [i for i, s in enumerate(block.shards) if s is None]
        if not erase_pos:
            # all shards present — just concatenate the systematic data shards
            recovered = b"".join(block.shards[i] for i in range(block.k))
            return self._finalize(block, recovered)

        if len(erase_pos) > block.m:
            raise reedsolo.ReedSolomonError(
                f"{len(erase_pos)} shards lost exceeds m={block.m} parity capacity")

        # rebuild each byte-column, supplying the erased positions to reedsolo
        recovered_data = [bytearray(block.shard_len) for _ in range(block.k)]
        for c in range(block.shard_len):
            codeword = bytearray(block.k + block.m)
            for i in range(block.k + block.m):
                s = block.shards[i]
                codeword[i] = 0 if s is None else s[c]
            decoded, _, _ = self.rsc.decode(bytes(codeword), erase_pos=erase_pos)
            # `decoded` is the k recovered message bytes for this column
            for r in range(block.k):
                recovered_data[r][c] = decoded[r]

        recovered = b"".join(bytes(s) for s in recovered_data)
        return self._finalize(block, recovered)

    def _finalize(self, block: ErasureBlock, recovered_padded: bytes) -> bytes:
        out = recovered_padded[:block.orig_len]
        got = hashlib.sha3_256(out).hexdigest()
        if got != block.digest:
            raise reedsolo.ReedSolomonError(
                f"integrity check failed after recovery: {got[:12]} != {block.digest[:12]}")
        return out


def shard_map(block: ErasureBlock) -> Dict[str, str]:
    """Human-readable shard digest map (for receipts / archive manifests)."""
    out: Dict[str, str] = {}
    for i, s in enumerate(block.shards):
        kind = "data" if i < block.k else "parity"
        out[f"shard{i:02d}:{kind}"] = ("LOST" if s is None
                                       else hashlib.sha3_256(s).hexdigest()[:16])
    return out
