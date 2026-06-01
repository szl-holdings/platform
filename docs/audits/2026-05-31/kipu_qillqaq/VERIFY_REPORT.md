# VERIFY_REPORT.md — KIPU + QILLQAQ

Every claim below is reproduced by `pkg/verify.py` (full transcript in `VERIFY_OUTPUT.txt`)
and by live `curl` against `https://szlholdings-a11oy.hf.space` (transcript in HF_PUSH_LOG.md).

## 1. Package is a real importable Python package (install proof)

```
$ pip install -e pkg/
Successfully built kipu_qillqaq
Successfully installed kipu_qillqaq-0.1.0

$ python3 -c "import kipu_qillqaq; print(kipu_qillqaq.__version__)"
0.1.0
```

Package path: `kipu_qillqaq/pkg/` (source under `pkg/src/kipu_qillqaq/`). Buildable wheel:
`kipu_qillqaq-0.1.0-0.editable-py3-none-any.whl` (sha256 331cac1c...).

## 2. TOML parsed with stdlib `tomllib` + real schema validation (parse demo)

Input `amaru.toml` (excerpt):
```toml
[organ]
name = "AMARU"
function = "Cortex / agentic reasoning scheduler over 7 chakra kernels."
[reads]
kinds = ["task", "context", "yuyay_score"]
[writes]
kinds = ["reasoning_verdict", "chakra_trace", "task"]
[boot]
handler = "kipu_qillqaq.handlers:echo"
```
Parser output:
```
tomllib.load -> {"organ": {"name": "AMARU", ...}, "reads": {"kinds": [...]}, ...}
validate_genome -> name=AMARU | reads=['task','context','yuyay_score']
                   | writes=['reasoning_verdict','chakra_trace','task']
may_write('reasoning_verdict') = True
may_write('NOT_ALLOWED')       = False
```
Schema rejects malformed config:
```
validate_genome({"organ": {"name": "X"}})
  -> GenomeError: [organ] missing required key 'function'
```

## 3. QILLQAQ boots 16 organs from DNA (config + module loading)
```
organs booted: 16
names: AMARU, CHASKI, HATUN, HUKLLA, KALLPA, KANCHAY, KHIPU, LAMBDA_SPINE,
       SUMAQ_RIKUQ, UNAY, VSP_OTEL, WALLPA, WASI_RIKUQ, WAYRA, YAWAR, YUYAY
errors: {}   (all 16 parsed + validated + handler-bound)
```

## 4. Genome gating is enforced (organs act only within declared role)
```
AMARU.write("reasoning_verdict", {...}) -> cid 9add3566...   (allowed)
AMARU.write("voice", {...})             -> PermissionError    (not in [writes])
```

## 5. KIPU pub/sub event bus
```
subscribe("write", cb); YUYAY.write("yuyay_score", {...})
  -> subscriber received: ('write', 'YUYAY', 'yuyay_score')
```

## 6. Content addressing + chain verify
```
read back kind=reasoning_verdict | verify()=True   (cid == sha256(canonical content))
```

## 7. Reed-Solomon durability (honest naming)
```
RS(10,6): recover after losing 4/10 shards -> cid match = True
          refuses 5/10 losses -> ValueError "need >= 6 shards, have 5"
```

## 8. Live on a11oy (each Space reports working import + substrate version)
```
GET https://szlholdings-a11oy.hf.space/v1/kipu/healthz
  -> {"ok":true,"substrate":"KIPU","engine":"QILLQAQ","substrate_version":"0.1.0","organs":16}
POST /v1/kipu/write -> {"cid":"e70c9da3...","verify":true}
GET  /v1/kipu/read/e70c9da3... -> full cell round-trips
GET  /v1/qillqaq/organ/wayra -> handler_status "bound"
Existing routes unaffected: /api/a11oy/healthz 200, / 200  (ADDITIVE proven)
```

## Open-source dependency audit
| Dep | Used for | License | Required? |
|---|---|---|---|
| `tomllib` | TOML parse | stdlib (Python 3.11+) | yes (stdlib) |
| `hashlib`, `json`, `dataclasses`, `threading`, `importlib` | core | stdlib | yes (stdlib) |
| `reedsolo` | optional RS backend | MIT | no (pure-python fallback ships) |
| `lmdb` | optional persistence | OpenLDAP Public License | no (JSON-file fallback ships) |
| `fastapi`/`starlette` | the a11oy router (already in the Space) | MIT/BSD | only for serve |

Signed: **Yachay** · agent: Perplexity Computer Agent.
