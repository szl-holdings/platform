<div align="center">

# szl-qrng

**Entropy source for SZL nonce generation — OS CSPRNG default, optional QRNG.**

[![Doctrine v11](https://img.shields.io/badge/Doctrine-v11_LOCKED-3b82f6?style=flat-square)](https://github.com/szl-holdings/.github/blob/main/DOCTRINE_V11.md) [![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-0B1F3A.svg?style=flat-square)](https://www.apache.org/licenses/LICENSE-2.0)

</div>

## Honest stance

> **OS CSPRNG is cryptographically sufficient for current threat models.** It is
> the default and will remain so. QRNG mode exists for **future-proofing** and
> **defense-customer requests** — it is *not* a claim that the default is
> inadequate.

ECDSA security depends on unpredictable per-signature **nonces** (nonce reuse or
bias leaks the private key). SZL generates nonces with the OS CSPRNG
(`secrets.token_bytes`). A **Quantum Random Number Generator (QRNG)** derives
randomness from quantum measurement (photon arrival, vacuum fluctuations) and
gives *device-level* auditable entropy provenance.

## Modes

| Mode | When active | Behavior |
|---|---|---|
| `os-csprng` (default) | always, unless `QRNG_API_URL` set | `secrets.token_bytes(n)` |
| `qrng` | `QRNG_API_URL` env set | fetch QRNG bytes, **XOR-fold with OS CSPRNG** |

**Never-weaker guarantee:** in QRNG mode the output is `QRNG XOR OS_CSPRNG`. Even
if the QRNG service is degraded, unreachable, or spoofed, the result is at least
as strong as the OS CSPRNG. If the service is unreachable, it silently falls back
to pure OS CSPRNG.

## Configure QRNG

```bash
export QRNG_API_URL="https://your-qrng-proxy.example/qrng"   # GET ?length=N -> N raw bytes
export QRNG_TIMEOUT_SECONDS=3
```

The endpoint contract is `GET {url}?length=N` returning N raw bytes
(`application/octet-stream`). A thin proxy can adapt providers such as the
[ANU Quantum RNG](https://qrng.anu.edu.au/) to this contract.

## Usage

```python
from szl_qrng import token_bytes, nonce, active_source

print(active_source())     # EntropySource.OS_CSPRNG (default)
n = nonce()                # 32 strong random bytes for an ECDSA nonce
```

## Tests

```bash
python -m pytest
```

---

*Doctrine v11 LOCKED (749/14/163) · Apache-2.0 · Signed-off-by: Yachay \<yachay@szlholdings.dev\>*
