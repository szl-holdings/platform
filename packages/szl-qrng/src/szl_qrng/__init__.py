"""szl-qrng — entropy source for SZL nonce generation.

Doctrine v11 LOCKED (749/14/163). Apache-2.0.

Honest stance
-------------
The OS-level CSPRNG (``secrets.token_bytes``) is **cryptographically sufficient**
for current threat models and is the DEFAULT. A quantum-random-number-generator
(QRNG) mode is provided for future-proofing and defense-customer requests: if the
``QRNG_API_URL`` environment variable is set, entropy is pulled from a real QRNG
service (e.g., the ANU Quantum RNG). Both modes are audited and signed; QRNG mode
is NOT a claim that the default is inadequate.

Signed-off-by: Yachay <yachay@szlholdings.dev>
"""

from .rng import (
    EntropySource,
    token_bytes,
    nonce,
    active_source,
)

__all__ = ["EntropySource", "token_bytes", "nonce", "active_source"]
__version__ = "0.1.0"
