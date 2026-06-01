# HF_PUSH_LOG.md — a11oy /formulas deployment (founder-token HfApi)

**Author:** Yachay · **Date:** 2026-06-01 · **Space:** `SZLHOLDINGS/a11oy` (Docker SDK)

All pushes used the **founder-token HfApi** pattern, verified `whoami` lists `SZLHOLDINGS`
before any write. Changes are **ADDITIVE only**. IP-HOLD a11oy#57 untouched.

```python
token = Path("/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/hf_token").read_text().strip()
api = HfApi(token=token)
who = api.whoami(); assert "SZLHOLDINGS" in [o["name"] for o in who["orgs"]]
```

- `whoami` → **betterwithage**; orgs include **SZLHOLDINGS** ✔ (pre-push guard asserted, would refuse otherwise).

## Commits

| When | SHA | Summary |
|---|---|---|
| Initial push | `95884469926507fa24edc07392153539f05e4e48` | ADDITIVE: szl_puriq_formulas.py + serve.py register block + Dockerfile COPY (3 files, single create_commit). |
| Re-apply push | `d5aab7b721cb63457e313234ab616589232d0d12` | ADDITIVE (re-apply): re-wired serve.py register block + Dockerfile COPY after concurrent commits dropped them; szl_puriq_formulas.py re-affirmed. |

Commit URL (live): https://huggingface.co/spaces/SZLHOLDINGS/a11oy/commit/d5aab7b721cb63457e313234ab616589232d0d12

**Post-push survival:** after my `d5aab7b7`, further concurrent commits landed (HEAD advanced to
`057c23e9…`), but because my `szl_puriq_formulas.py` file **and** its Dockerfile `COPY` line are now
baked in, the PURIQ layer **survived** — verified live `/formulas` 200 and run-log mount line present
at `057c23e9`. (If a future wholesale Dockerfile rewrite drops the COPY again, re-apply per G7.)

## Why a re-apply was needed (honest account)

The a11oy space was under **heavy concurrent edit** during this session — multiple commits landed
within the same minutes as my work (e.g. `5717e05` "Wire I (RE-APPLY): re-bake szl-rosie-companion",
`cc03a9e` "GET /hatun-mcp route", `2c32cea` "AYNI-OS router re-apply", all timestamped
2026-06-01T09:19–09:21). Those commits **replaced `serve.py` and `Dockerfile` wholesale**, which
dropped my register block and my `COPY szl_puriq_formulas.py` line — while my module file itself
**survived** in the repo tree.

Rather than clobber the concurrent work, I **re-downloaded the current HEAD**, re-applied my two
additive edits on top, validated syntax + a FastAPI `TestClient` smoke locally, then pushed `d5aab7b7`.

## The a11oy Dockerfile gotcha (handled)

The Dockerfile uses **explicit per-file COPY** (no `COPY . .`). A new root `.py` therefore needs its
own `COPY <file> ./<file>` line or it is never placed in the container. My added line (after the
`szl_khipu_os_routes.py` COPY):

```dockerfile
COPY szl_puriq_formulas.py ./szl_puriq_formulas.py
```

## Build + run confirmation (post `d5aab7b7`)

- **Build log:** `--> COPY szl_puriq_formulas.py ./szl_puriq_formulas.py` ✔ (file lands in `/app`).
- **Run log:** `[szl_puriq] PURIQ agentic formulas mounted (/formulas + /api/a11oy/v1/puriq/formulas*) — Doctrine v11 LOCKED` ✔ (register ran, routes mounted).
- Space runtime stage reached **RUNNING** at SHA `d5aab7b7`.

See `VERIFY_REPORT.md` for live HTTP smoke results.

Signed — **Yachay**.
