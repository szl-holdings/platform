# Hugging Face Push Log — AYNI-OS additive deployment to a11oy

**Date:** 2026-06-01
**Author:** Yachay
**Auth (HARD RULE):** Founder-token `HfApi`:
```python
HfApi(token=Path("/home/user/workspace/szl/audit_2026-05-30_cursor_offline/.secret/hf_token").read_text().strip())
```
- `whoami` → `betterwithage`, org `SZLHOLDINGS` (write OK)

## Target

- **Space:** `SZLHOLDINGS/a11oy` (`repo_type="space"`)
- **Domain:** https://szlholdings-a11oy.hf.space

## Constraint compliance

- **ADDITIVE only.** No existing routes modified; AYNI-OS endpoints added via a
  self-contained `APIRouter` included in `serve.py` **before** the SPA catch-all
  (pattern mirrors `kipu_qillqaq_serve.py`). Page route added like `wasi-rikuq`.
- **IP-HOLD a11oy#57 untouched.**
- Dockerfile uses **per-file COPY** (NO `COPY . .`) per the a11oy build gotcha.
- **yuyay_v3 replay hash untouched** — `yuyay_v4` axis-14 is a separate, additive
  surface; the live `/v1/ayni/healthz` echoes the locked v3 hash verbatim.

## Commits

| Commit OID | Note |
|------------|------|
| `5849e0e76058b12103e89dd950ad2389431de2f0` | First create_commit (later clobbered by a concurrent agent). |
| `2c32ceae33680dd6f005bd344ebb6834bbe56392` | Re-applied against fresh serve.py text. |

Files committed: `ayni_os_serve.py`, `pages/ayni.html`, `ayni_os/replay_api.py`,
`ayni_os/ledger.py`, `ayni_os/tinkuy.py` (+ supporting runtime), `serve.py` patch,
`Dockerfile` patch. All confirmed `PRESENT` post-commit.

## Final live status

- **Runtime stage:** `RUNNING`
- Space SHA has since advanced (`057c23e9...`) because concurrent agents keep
  committing to the same space; **the AYNI-OS wiring survived** — verified by live
  HTTP probes (see VERIFY_REPORT.md). All 5 endpoints return HTTP 200 with the
  expected payloads.

## Endpoints deployed (live, verified)

- `GET /v1/ayni/healthz` — locked v11 numbers + v3 replay hash
- `GET /v1/ayni` — per-organ reciprocity coefficients, deficits, T24 tripwire
- `GET /v1/tinkuy` — Kuramoto order parameter `r`, flow flag
- `GET /v1/replay?at=<ts>` — event-sourcing replay (chain-verified)
- `GET /ayni` — the AYNI-OS surface tab (HTTP 200)

---

Signed — **Yachay**
