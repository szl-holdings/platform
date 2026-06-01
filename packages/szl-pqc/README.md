<div align="center">

# szl-pqc

**Post-quantum & hybrid signing for SZL DSSE envelopes.**

[![Doctrine v11](https://img.shields.io/badge/Doctrine-v11_LOCKED-3b82f6?style=flat-square)](https://github.com/szl-holdings/.github/blob/main/DOCTRINE_V11.md) [![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-0B1F3A.svg?style=flat-square)](https://www.apache.org/licenses/LICENSE-2.0) [![FIPS 204](https://img.shields.io/badge/NIST-FIPS_204_ML--DSA-2DA44E.svg?style=flat-square)](https://csrc.nist.gov/pubs/fips/204/final)

</div>

`szl-pqc` adds **post-quantum** and **hybrid** signature support to the SZL DSSE
signing chain — **additive** to the existing ECDSA P-256 default, never a
replacement.

## Threat model

SZL DSSE signatures use **ECDSA over NIST P-256 + SHA-256**. ECDSA's security
rests on the elliptic-curve discrete-log problem, which **Shor's algorithm**
solves in polynomial time on a fault-tolerant quantum computer. Fault-tolerant
machines at the required scale are widely estimated at **2030+**, but defense
procurement applies a **"harvest-now, decrypt-later"** model and asks for PQC
readiness **today**.

NIST finalized the relevant standards on **2024-08-13**:

| Standard | Algorithm | Role |
|---|---|---|
| [FIPS 204](https://csrc.nist.gov/pubs/fips/204/final) | **ML-DSA** (CRYSTALS-Dilithium) | primary PQC signature — used here as `ML-DSA-65` |
| [FIPS 203](https://csrc.nist.gov/pubs/fips/203/final) | **ML-KEM** (CRYSTALS-Kyber) | key encapsulation — `ML-KEM-768` |
| [FIPS 205](https://csrc.nist.gov/pubs/fips/205/final) | **SLH-DSA** (SPHINCS+) | conservative hash-based fallback |

## Transition plan

1. **Today (default):** ECDSA P-256 signs every envelope.
2. **Now → 2030 (hybrid):** sign with **both** ECDSA *and* ML-DSA-65. The
   envelope carries both signatures; verifiers can require either or both. This
   is the standard defense-in-depth pattern for the PQC migration.
3. **Post-transition (PQC):** ML-DSA-only once classical curves are deprecated.

ECDSA P-256 **stays the default**. PQC is additive — we never replace a verified
classical primitive with an unverified one.

## Backends

ML-DSA / ML-KEM are provided through a backend abstraction:

* **Production:** [`oqs-python`](https://github.com/open-quantum-safe/liboqs-python)
  (liboqs). Install via the `oqs` extra. liboqs is a **C library** that is not
  always installable, so it is an optional extra.
* **Pure-Python reference:** [`dilithium-py`](https://pypi.org/project/dilithium-py/)
  (FIPS 204) and [`kyber-py`](https://pypi.org/project/kyber-py/) (FIPS 203),
  used by CI and the test suite when liboqs is absent.

If no backend is present, the ECDSA-only path still works; PQC/hybrid calls
raise a clear error.

## Install

```bash
pip install szl-pqc                # ECDSA only
pip install "szl-pqc[oqs]"         # + liboqs production PQC backend
pip install "szl-pqc[pyref]"       # + pure-Python FIPS 204/203 backends
pip install "szl-pqc[test]"        # + pytest + dilithium-py
```

## Usage

```python
from szl_pqc import (
    SignatureType, Signer, Verifier,
    sign_envelope, verify_envelope, DSSEEnvelope,
)

env = DSSEEnvelope(payload=b'{"action":"khipu.tick","verdict":"ALLOW"}')

# Hybrid: sign with BOTH ECDSA P-256 and ML-DSA-65
signer = Signer.generate(SignatureType.HYBRID)
env = sign_envelope(env, signer, SignatureType.HYBRID)
print(env.sig_types())  # ['ECDSA-P256-SHA256', 'ML-DSA-65']

verifier = Verifier.from_signer(signer)
assert verify_envelope(env, verifier, SignatureType.HYBRID)  # both must verify
```

## DSSE envelope

The bytes signed are the DSSE **PAE** (Pre-Authentication Encoding):

```
DSSEv1 SP LEN(payloadType) SP payloadType SP LEN(payload) SP payload
```

Each signature entry carries `keyid`, `sig`, and `sig_type`
(`ECDSA-P256-SHA256` or `ML-DSA-65`), so one envelope can carry both.

## Tests

```bash
python -m pytest
```

Round-trip sign+verify is covered for ECDSA, PQC, and hybrid, plus tamper
rejection and hybrid-missing-signature rejection.

## References

* NIST FIPS 204 (ML-DSA): <https://csrc.nist.gov/pubs/fips/204/final>
* NIST FIPS 203 (ML-KEM): <https://csrc.nist.gov/pubs/fips/203/final>
* NIST FIPS 205 (SLH-DSA): <https://csrc.nist.gov/pubs/fips/205/final>
* NIST PQC announcement (2024-08-13): <https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards>
* DSSE spec: <https://github.com/secure-systems-lab/dsse>

---

*Doctrine v11 LOCKED (749/14/163) · Apache-2.0 · Signed-off-by: Yachay \<yachay@szlholdings.dev\>*
