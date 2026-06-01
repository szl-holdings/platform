# kipu_qillqaq

**KIPU** = a content-addressed receipt-cell substrate (LMDB or JSON-file persistence,
in-process pub/sub event bus, Reed-Solomon erasure coding for durability).
**QILLQAQ** = a declarative engine that reads organ `genome.toml` files (parsed with the
stdlib `tomllib`), validates them against a schema, and boots `OrganAgent` instances.

## Honest naming

- Durability is **Reed-Solomon** erasure coding (Reed & Solomon 1960) — the MDS code used
  by RAID-6, CD/DVD, QR codes, and Backblaze. It is **not** "holographic quantum error
  correction".
- A "genome" is a **TOML config file**. "Boot from DNA" means *parse config + import a
  module/handler*. No biology, no magic — it is config + module loading.

## Install

```bash
pip install -e .            # core (zero non-stdlib deps; tomllib is stdlib 3.11+)
pip install -e .[full]      # + lmdb persistence + reedsolo backend
```

## Quick start

```python
import kipu_qillqaq
print(kipu_qillqaq.__version__)

from kipu_qillqaq import QillqaqEngine
eng = QillqaqEngine()
eng.boot_packaged()                 # boots the 16 bundled organ genomes
print(eng.manifest()["count"])      # -> 16

amaru = eng.agents["AMARU"]
cid = amaru.write("reasoning_verdict", {"ok": True})   # gated by genome [writes]
cell = eng.pool.read(cid, reader="YUYAY")
```

## Reed-Solomon durability

```python
from kipu_qillqaq import KipuPool, ReceiptCell
pool = KipuPool(path="/tmp/kipu_demo")
cid = pool.write(ReceiptCell(organ="AMARU", kind="reasoning_verdict", payload={"x": 1}))
recovered = pool.recover(cid, drop=[0, 1, 2, 3])   # lose 4/10 shards, still recover
assert recovered.cid == cid
```

License: Apache-2.0. Author: Yachay (SZL Holdings). Agent: Perplexity Computer Agent.
