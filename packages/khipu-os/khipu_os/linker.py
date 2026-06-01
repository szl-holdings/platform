# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Perplexity Computer Agent — KHIPU-OS Bayesian parent-link suggester
"""
linker.py — self-link-suggest (Bayesian parent inference; LeanDojo premise-selection analogue).

On a new receipt R, infer which existing receipts are likely *parents* via a Naïve-Bayes
product of three likelihoods:
  - content-embedding similarity   (cosine over a lightweight hashed bag-of-tokens embed),
  - temporal proximity             (exponential decay over |Δt|, half-life configurable),
  - organ correlation              (prior P(parent.organ → R.organ) from observed co-occurrence).

posterior(parent=c | R) ∝ sim(c,R) · temporal(c,R) · organ_corr(c.organ, R.organ)

We SUGGEST the top-k parents to the writer — we never auto-link. The writer keeps authority
(suggestion only), so the suggester can never violate INV-DAG (no forward edges) by itself.
Pure-Python, dependency-free embedding so the loop runs in any Space.
"""
from __future__ import annotations

import hashlib
import math
import re
from typing import Any, Dict, List, Optional, Tuple

_TOKEN = re.compile(r"[a-z0-9]+")
EMBED_DIM = 64


def hashed_embed(text: str, dim: int = EMBED_DIM) -> List[float]:
    """Deterministic hashed bag-of-tokens embedding (no external model needed)."""
    v = [0.0] * dim
    for tok in _TOKEN.findall((text or "").lower()):
        h = int(hashlib.blake2b(tok.encode(), digest_size=8).hexdigest(), 16)
        v[h % dim] += 1.0
    norm = math.sqrt(sum(x * x for x in v)) or 1.0
    return [x / norm for x in v]


def cosine(a: List[float], b: List[float]) -> float:
    return max(0.0, min(1.0, sum(x * y for x, y in zip(a, b))))


class Linker:
    def __init__(self, dag, temporal_halflife_s: float = 3600.0):
        self.dag = dag
        self.halflife = temporal_halflife_s

    def _text_of(self, r) -> str:
        return f"{r.organ} {r.action} {r.payload}"

    def organ_corr(self, parent_organ: str, child_organ: str) -> float:
        """Prior from observed parent→child organ co-occurrence in the hot set.
        Laplace-smoothed; same-organ gets a mild floor so it is never zero."""
        num = 1.0
        den = 2.0
        for rid, r in self.dag.hot.items():
            for p in r.parents:
                pr = self.dag.hot.get(p)
                if pr is None:
                    continue
                den += 1.0
                if pr.organ == parent_organ and r.organ == child_organ:
                    num += 1.0
        base = num / den
        return max(base, 0.05 if parent_organ == child_organ else 0.01)

    def suggest(self, new_receipt, top_k: int = 3,
                now: Optional[float] = None) -> List[Dict[str, Any]]:
        """Return top-k candidate parents with posterior scores (suggestion only)."""
        import time
        now = now if now is not None else time.time()
        r_embed = hashed_embed(self._text_of(new_receipt))
        scored: List[Tuple[float, str, Dict[str, float]]] = []
        for cid, c in self.dag.hot.items():
            if cid == getattr(new_receipt, "receipt_id", None):
                continue
            if c.ts > new_receipt.ts:   # candidate must predate R (no forward edges, INV-DAG)
                continue
            sim = cosine(r_embed, hashed_embed(self._text_of(c)))
            dt = abs(now - c.ts)
            temporal = math.exp(-math.log(2) * dt / self.halflife)
            oc = self.organ_corr(c.organ, new_receipt.organ)
            post = sim * temporal * oc
            scored.append((post, cid, {"sim": sim, "temporal": temporal, "organ_corr": oc}))
        scored.sort(key=lambda t: t[0], reverse=True)
        out = [{"parent_id": cid, "posterior": post, **parts}
               for post, cid, parts in scored[:top_k] if post > 0.0]
        return out

    def run(self, new_receipt, top_k: int = 3) -> Dict[str, Any]:
        sug = self.suggest(new_receipt, top_k=top_k)
        rec = self.dag.add_receipt(
            organ=self.dag.name, action="self_link_suggest",
            payload={"for_receipt": getattr(new_receipt, "receipt_id", "?"),
                     "suggestions": sug},
            parents=[],   # the suggestion receipt itself stays unlinked (advice only)
            yuyay=1.0,
        )
        return {"suggestions": sug, "receipt": rec.receipt_id}
