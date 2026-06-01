# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
# Perplexity Computer Agent — KHIPU-OS (agentic Khipu DAG)
"""
szl-khipu-os — the self-driving Khipu DAG.

The Khipu DAG becomes an OrganAgent (PURIQ-OS base): a Wiener feedback loop whose reference
is the Doctrine, ticking every 60 s and running six autonomous behaviours — self-prune,
self-Merkle-checkpoint (12 h), self-verify (5 min, random-sample), self-link-suggest
(Bayesian), self-publish (constellation delta), self-prosecute (HUKLLA T22 on tamper).

Every autonomous tick emits a signed Khipu receipt — the DAG signs itself, recursively.
LOCKED v11 numbers preserved verbatim. ADDITIVE only. NO mysticism.
"""
from __future__ import annotations

__version__ = "1.0.0"

from ._puriq_compat import (
    OrganAgent, KhipuSigner, KhipuReceipt, YuyayGate, YuyayScores, YuyayGateError,
    HukullaTripwires, lambda_aggregate, LOCKED, _USING_REAL_PURIQ_OS,
)
from .dag import (KhipuDAG, merkle_root, merkle_proof, verify_merkle_proof, BranchMeta)
from .erasure_code import ReedSolomonErasure, ErasureBlock, shard_map
from .store import open_store, SQLiteStore
from .pruner import Pruner
from .checkpointer import Checkpointer
from .verifier import Verifier
from .linker import Linker, hashed_embed, cosine
from .publisher import ConstellationPublisher
from .tamper_prosecutor import TamperProsecutor
from .runner import KhipuDAGRunner

__all__ = [
    "KhipuDAG", "merkle_root", "merkle_proof", "verify_merkle_proof", "BranchMeta",
    "ReedSolomonErasure", "ErasureBlock", "shard_map", "open_store", "SQLiteStore",
    "Pruner", "Checkpointer", "Verifier", "Linker", "ConstellationPublisher",
    "TamperProsecutor", "KhipuDAGRunner",
    "OrganAgent", "KhipuSigner", "KhipuReceipt", "YuyayGate", "YuyayScores",
    "YuyayGateError", "HukullaTripwires", "lambda_aggregate", "LOCKED",
    "hashed_embed", "cosine", "_USING_REAL_PURIQ_OS", "__version__",
]
