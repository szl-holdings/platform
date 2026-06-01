"""kipu/holographic_qec.py — PYHP holographic error correction for the KIPU pool.

Implements the Pastawski-Yoshida-Harlow-Preskill (HaPPY) holographic-code idea so that the
KIPU pool SURVIVES PARTIAL CORRUPTION: the canonical cell-set (the "bulk") is recoverable from
any sufficient subset of stored shards (the "boundary"). This is F40 of Deep Corpus v3 made real.

Academic construction (cited + implemented):
  Pastawski, Yoshida, Harlow, Preskill, "Holographic quantum error-correcting codes:
  Toy models for the bulk/boundary correspondence," JHEP 06 (2015) 149, arXiv:1503.06237.
  (https://errorcorrectionzoo.org/c/happy)

Faithful classical realization:
  The HaPPY code is built from *perfect tensors* (6-leg, 5-qubit) whose defining property is
  that the encoding isometry maps bulk legs to ANY sufficiently large boundary leg-subset --
  i.e. it is an MDS (maximum-distance-separable) code. The classical perfect realization of a
  perfect tensor is a Reed-Solomon / MDS code over a finite field: an [n, k] RS code recovers
  the k message symbols from ANY k of n shards (erasure-optimal, the Singleton bound met with
  equality). We therefore encode the canonical bulk (k cell-shards) into n>k boundary shards
  via RS over GF(2^8). Recovery uses a *greedy decoder* that mirrors PYHP's rule:
  "absorb any tensor for which at least half of the legs are already included" -> here, once
  >= k shards survive, the greedy step reconstructs the entire bulk.

Erasure tolerance: an [n,k] MDS code tolerates up to (n-k) erasures = (n-k)/n fraction. With
n=10, k=7 we tolerate 30% loss (matches the verification target and is in the regime of the
PYHP pentagon-hexagon erasure threshold ~26%-50%).
"""
from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import Optional

# ----------------------------------------------------------------------------------------------
# GF(2^8) arithmetic (AES field, primitive polynomial 0x11d) -- exact, no floats.
# ----------------------------------------------------------------------------------------------
_EXP = [0] * 512
_LOG = [0] * 256


def _init_tables():
    x = 1
    for i in range(255):
        _EXP[i] = x
        _LOG[x] = i
        x <<= 1
        if x & 0x100:
            x ^= 0x11d
    for i in range(255, 512):
        _EXP[i] = _EXP[i - 255]


_init_tables()


def _gmul(a: int, b: int) -> int:
    if a == 0 or b == 0:
        return 0
    return _EXP[_LOG[a] + _LOG[b]]


def _gdiv(a: int, b: int) -> int:
    if b == 0:
        raise ZeroDivisionError("GF(2^8) division by zero")
    if a == 0:
        return 0
    return _EXP[(_LOG[a] - _LOG[b]) % 255]


# ----------------------------------------------------------------------------------------------
# Reed-Solomon (Vandermonde / systematic-evaluation) erasure code over GF(2^8).
# Encode k data symbols -> n shards by evaluating the degree-(k-1) interpolating polynomial at
# n distinct points. Decode from ANY k surviving (index, value) pairs via Lagrange interpolation.
# This is the MDS / "perfect tensor" property the HaPPY code is built from.
# ----------------------------------------------------------------------------------------------
@dataclass
class _RS:
    n: int
    k: int

    def __post_init__(self):
        if not (0 < self.k <= self.n <= 255):
            raise ValueError("require 0 < k <= n <= 255")
        self.points = list(range(1, self.n + 1))  # n distinct nonzero eval points

    def encode_symbol(self, data_k: list) -> list:
        """data_k: list of k ints in [0,255] -> n shard values (one byte each)."""
        assert len(data_k) == self.k
        # treat data_k as polynomial coefficients c0..c_{k-1}; shard_j = poly(point_j)
        out = []
        for p in self.points:
            acc = 0
            xp = 1
            for c in data_k:
                acc ^= _gmul(c, xp)
                xp = _gmul(xp, p)
            out.append(acc)
        return out

    def decode_symbol(self, shards: dict) -> list:
        """shards: {shard_index(0-based): value} with >= k entries -> recover k coefficients."""
        items = list(shards.items())[: self.k]
        if len(items) < self.k:
            raise ValueError(f"need >= {self.k} shards, got {len(shards)}")
        xs = [self.points[i] for i, _ in items]
        ys = [v for _, v in items]
        # Recover polynomial coefficients via solving Vandermonde system with Gaussian elim in GF.
        # Build matrix A (k x k): A[r][c] = xs[r]^c ; solve A c = ys.
        A = []
        for r in range(self.k):
            row = []
            xp = 1
            for _c in range(self.k):
                row.append(xp)
                xp = _gmul(xp, xs[r])
            row.append(ys[r])
            A.append(row)
        # Gaussian elimination over GF(2^8)
        for col in range(self.k):
            piv = next((r for r in range(col, self.k) if A[r][col] != 0), None)
            if piv is None:
                raise ValueError("singular system (shards not independent)")
            A[col], A[piv] = A[piv], A[col]
            inv = _gdiv(1, A[col][col])
            A[col] = [_gmul(v, inv) for v in A[col]]
            for r in range(self.k):
                if r != col and A[r][col] != 0:
                    f = A[r][col]
                    A[r] = [a ^ _gmul(f, b) for a, b in zip(A[r], A[col])]
        return [A[r][self.k] for r in range(self.k)]


# ----------------------------------------------------------------------------------------------
# HolographicQEC: encode a "bulk" byte-string (the canonical cell-set serialization) into n
# shards; recover from any >= k. Per-byte RS so payloads of arbitrary length are supported.
# ----------------------------------------------------------------------------------------------
@dataclass
class HolographicQEC:
    n: int = 10   # boundary shards
    k: int = 7    # bulk symbols (recover from any 7 of 10 -> tolerate 30% erasure)

    def __post_init__(self):
        self.rs = _RS(self.n, self.k)

    @property
    def erasure_tolerance(self) -> float:
        return (self.n - self.k) / self.n

    def _digest(self, data: bytes) -> str:
        return hashlib.blake2b(data, digest_size=16).hexdigest()

    def encode(self, bulk: bytes) -> dict:
        """Encode bulk bytes -> {meta, shards:[shard0..shard_{n-1}]} (boundary).

        We pad bulk into groups of k bytes; each group -> n shard-bytes; shard j collects the
        j-th byte of every group. Each shard also stores length + a content digest of the bulk
        so corruption is *detectable* (content addressing, IPLD-style)."""
        pad = (-len(bulk)) % self.k
        padded = bulk + b"\x00" * pad
        groups = [list(padded[i:i + self.k]) for i in range(0, len(padded), self.k)]
        # shard_bytes[j] = list of j-th shard value across all groups
        shard_bytes = [bytearray() for _ in range(self.n)]
        for g in groups:
            enc = self.rs.encode_symbol(g)
            for j in range(self.n):
                shard_bytes[j].append(enc[j])
        digest = self._digest(bulk)
        meta = {"n": self.n, "k": self.k, "orig_len": len(bulk), "digest": digest}
        shards = []
        for j in range(self.n):
            shards.append({
                "index": j,
                "point": self.rs.points[j],
                "bytes": bytes(shard_bytes[j]).hex(),
                "meta_digest": digest,
            })
        return {"meta": meta, "shards": shards}

    def greedy_recoverable(self, surviving_shards: list) -> bool:
        """PYHP greedy-decoder admissibility: bulk is recoverable iff >= k shards survive
        (>= half-the-legs absorption succeeds for an MDS/perfect-tensor code)."""
        return len({s["index"] for s in surviving_shards}) >= self.k

    def decode(self, encoded_meta: dict, surviving_shards: list) -> bytes:
        """Recover bulk bytes from ANY >= k surviving shards (greedy MDS decoder)."""
        meta = encoded_meta
        n, k, orig_len = meta["n"], meta["k"], meta["orig_len"]
        if not self.greedy_recoverable(surviving_shards):
            raise ValueError(
                f"PYHP greedy decoder: need >= {k} shards, got "
                f"{len({s['index'] for s in surviving_shards})} -> below erasure threshold")
        by_index = {}
        for s in surviving_shards:
            by_index[s["index"]] = bytes.fromhex(s["bytes"])
        ngroups = len(next(iter(by_index.values())))
        out = bytearray()
        chosen = list(by_index.items())[:k]
        for gi in range(ngroups):
            shards = {idx: vals[gi] for idx, vals in chosen}
            coeffs = self.rs.decode_symbol(shards)
            out.extend(coeffs)
        recovered = bytes(out[:orig_len])
        # verify content digest (corruption is detectable; recovery is *verified*)
        if self._digest(recovered) != meta["digest"]:
            raise ValueError("recovered bulk failed content-digest verification")
        return recovered

    # convenience: round-trip a list of ReceiptCell dicts (the canonical cell-set)
    def encode_cells(self, cell_dicts: list) -> dict:
        return self.encode(json.dumps(cell_dicts, sort_keys=True, separators=(",", ":")).encode())

    def decode_cells(self, encoded: dict, surviving_shards: Optional[list] = None) -> list:
        shards = surviving_shards if surviving_shards is not None else encoded["shards"]
        return json.loads(self.decode(encoded["meta"], shards).decode())
