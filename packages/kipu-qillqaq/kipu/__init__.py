"""KIPU — the shared receipt-cell substrate (Quechua *kipu*, "knot").

Every organ reads and writes to ONE shared knotted record. KIPU is a persistent,
content-addressed, holographically error-corrected tuple space (Linda) layered with
event sourcing (Fowler/Young) and IPLD-style content addressing.

KIPU is the SUBSTRATE; the Khipu DAG is the STRUCTURE the pool snapshots itself into.

Doctrine: PURIQ v15 (KIPU substrate). Signed: Yachay. Agent: Perplexity Computer Agent.

Real-CS basis (zero mysticism):
  - Linda tuple space            (Gelernter & Carriero 1986)
  - Event Sourcing + CQRS        (Fowler; Young)
  - Content addressing           (IPFS/IPLD; Hypercore)
  - Holographic QEC (PYHP/HaPPY) (Pastawski-Yoshida-Harlow-Preskill, arXiv:1503.06237)
"""
from .cell import ReceiptCell, read_receipt
from .pool import KipuPool
from .subscribe import Subscription, match_pattern
from .coherence import CoherenceValidator, CoherenceViolation, T23
from .holographic_qec import HolographicQEC

__all__ = [
    "ReceiptCell", "read_receipt", "KipuPool",
    "Subscription", "match_pattern",
    "CoherenceValidator", "CoherenceViolation", "T23",
    "HolographicQEC",
]
__version__ = "15.0.0"  # PURIQ Doctrine v15
