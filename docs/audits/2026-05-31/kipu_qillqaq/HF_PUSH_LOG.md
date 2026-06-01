# HF_PUSH_LOG.md — real SHAs via founder token

**Auth:** `HfApi(token=Path(".secret/hf_token").read_text().strip())` — DIRECT, never the
connector. `whoami` → name `betterwithage`, orgs `['SZLHOLDINGS']` (admin). Verified before push.

## Target: `SZLHOLDINGS/a11oy` (Space)

| Field | Value |
|---|---|
| Space sha **BEFORE** | `a44b38bd2a72b24d844e26c3fa5722b31947a7b7` |
| Commit OID | `f2eb3719c6812346716ed0d037bbe08545083f32` |
| Space sha **AFTER** | `f2eb3719c6812346716ed0d037bbe08545083f32` |
| Changed | **true** |
| Files in commit | **27** (atomic) |
| Build stage after rebuild | **RUNNING** |
| Host | `https://szlholdings-a11oy.hf.space` |

### Files pushed (ADDITIVE, one atomic commit)
- `kipu_qillqaq/__init__.py`, `cell.py`, `pool.py`, `events.py`, `coding.py`, `genome.py`,
  `transcribe.py`, `handlers.py` (vendored package — no pip install of the package needed)
- `kipu_qillqaq/genomes/*.toml` (16 organ genomes)
- `kipu_qillqaq_serve.py` (the additive FastAPI router)
- `serve.py` (patched: `include_router` registered **before** the SPA catch-all, try/except-guarded)
- `Dockerfile` (patched: explicit `COPY kipu_qillqaq_serve.py` + `COPY kipu_qillqaq/`, optional `reedsolo`)

### Commit message
> ADDITIVE: mount KIPU receipt-cell substrate + QILLQAQ genome engine at /v1/kipu +
> /v1/qillqaq (Doctrine v15). Honest naming: Reed-Solomon erasure coding (not holographic
> QEC); genome=TOML config+module loading. 16 organ genomes. LOCKED preserved: 749/14/163,
> 13-axis yuyay_v3, replay bacf5443...631fc5, A2=IsHomogeneous, A4=IsBounded, SLSA L1.
> Sign: Yachay · Co-authored-by: Perplexity Computer Agent

## Live verification (curl 200 after deploy)

```
GET /v1/kipu/healthz
  -> {"ok":true,"substrate":"KIPU","engine":"QILLQAQ","substrate_version":"0.1.0","organs":16}

GET /v1/kipu/stats
  -> {"store_backend":"json","cells":2,"durability":true,"rs_code":"RS(10,6)"}

POST /v1/kipu/write {"organ":"a11oy","kind":"note","payload":{"founder":"verify"}}
  -> {"cid":"e70c9da37fb1eb6c28a77f4cfa6f815db18be4cf74d15634852dfe4c7d1f6b3a","verify":true}

GET /v1/kipu/read/e70c9da3...
  -> {"organ":"a11oy","kind":"note","payload":{"founder":"verify"},"author":"Yachay",...,"cid":"e70c9da3..."}

GET /v1/qillqaq/manifest   -> 16 organs, engine QILLQAQ, RS(10,6)
GET /v1/qillqaq/organ/wayra -> {"name":"WAYRA",...,"handler_status":"bound"}
```

## Non-regression (existing routes unaffected — ADDITIVE proven)
```
GET /api/a11oy/healthz -> 200
GET /                  -> 200 (SPA root / Brand Orchestration Layer)
```

**The founder's question answered:** each Space pulling from the substrate reports its
working import via `/v1/kipu/healthz` → `substrate_version: 0.1.0`. The a11oy Space imports
the vendored `kipu_qillqaq` package at boot and serves it live.

Signed: **Yachay** · agent: Perplexity Computer Agent.
