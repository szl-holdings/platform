"""szl-pqc — post-quantum and hybrid signing for SZL DSSE envelopes.

Doctrine v11 LOCKED (749/14/163). Apache-2.0.

Threat model
------------
SZL DSSE signatures use ECDSA over NIST P-256 + SHA-256. ECDSA security rests on
the elliptic-curve discrete-log problem, which Shor's algorithm solves in
polynomial time on a fault-tolerant quantum computer. Fault-tolerant machines at
that scale are widely estimated at 2030+, but defense procurement applies a
"harvest-now, decrypt-later" model and asks for PQC readiness today.

Design rules (non-negotiable)
-----------------------------
* ECDSA P-256 stays the DEFAULT signature type.
* Post-quantum (ML-DSA / FIPS 204) is ADDITIVE — never a silent replacement of a
  verified classical primitive with an unverified one.
* Hybrid mode signs with BOTH ECDSA and ML-DSA; the envelope carries both; verify
  can require either, or both (defense-in-depth during the PQC transition).

Signed-off-by: Yachay <yachay@szlholdings.dev>
"""

from .signature import (
    SignatureType,
    Signer,
    Verifier,
    sign_envelope,
    verify_envelope,
    ml_dsa_backend_available,
)
from .envelope import DSSEEnvelope

__all__ = [
    "SignatureType",
    "Signer",
    "Verifier",
    "sign_envelope",
    "verify_envelope",
    "ml_dsa_backend_available",
    "DSSEEnvelope",
]

__version__ = "0.1.0"
