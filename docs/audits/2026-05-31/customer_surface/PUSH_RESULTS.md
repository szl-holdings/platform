# Customer-Surface Push Results — 2026-06-01

Signed **Yachay** (CTO authority). Doctrine v12 (carries v11 LOCKED verbatim).
Pushes done via **HfApi-class direct / git CLI** — **NEVER GitHub Actions** (hard rule honored).

---

## 1. GitHub `szl-holdings` org — DONE ✅

### (a) `.github` org profile README — pushed
- **Repo:** `szl-holdings/.github`
- **File:** `profile/README.md` (the org-rendered profile)
- **Change:** additive append of the "Build on SZL — the commercial surface" block (docs/portal/status/SDK/pricing + flagships + honest labels + LOCKED-number re-derivation). Touched nothing locked.
- **Commit:** `d76db59` — `105dc17..d76db59  HEAD -> main` (push accepted).
- **Note:** remote printed a "commits must have verified signatures" advisory, but the ref updated successfully (push went through).

### (b) `szl-holdings/customer-portal` — created + pushed
- **Repo created:** `https://github.com/szl-holdings/customer-portal`
- **Visibility:** **PRIVATE.** A `--public` create was blocked by the action-safety classifier (task did not name a visibility, and the standing default is private-unless-told-public). Created private; **founder can flip to public** in repo settings if the commercial surface is meant to be open. This is the one judgment call worth a quick confirm.
- **Commit:** `8b0696c` — `[new branch] HEAD -> main`.
- **Contents:** `README.md`, `requirements.txt`, `.gitignore`, and `app/` = `app.py`, `verify_key.py`, `quota.py`, `schema.sql` (the tested FastAPI portal microservice).

---

## 2. Hugging Face `SZLHOLDINGS/a11oy` Space — BLOCKED ⛔ (handoff required)

**Goal:** add `/docs` and `/pricing` customer tabs to the a11oy Space.

**Resolved target paths** (static root is `console/`, per `Dockerfile: COPY console/ ./static/`; `serve.py` catch-all serves any real file under `/app/static/{path}`):
- `console/docs.html`    → served at `https://szlholdings-a11oy.hf.space/docs`
- `console/pricing.html` → served at `https://szlholdings-a11oy.hf.space/pricing`

**Why blocked:** the only HfApi-capable credential available is the `hugging_face`
connector, authenticated as user **`betterwithage`**, who has **no write/PR access**
to `SZLHOLDINGS/a11oy`:
- direct commit to `main` → **403 Forbidden** ("pass create_pr=1 …")
- retry with `create_pr=true` → **403 Forbidden: Authorization error** (no PR rights either)
- there is **no `HF_TOKEN`/`HUGGINGFACE_TOKEN` in the environment**, so a raw `HfApi()` is anonymous (`whoami()` fails).

This is a hard permissions wall; not retryable with available credentials.

**Handoff — ship in one command** (from a machine where the founder has an HF token
with write on `SZLHOLDINGS/a11oy`; this is a direct HfApi push, not GitHub Actions):

```bash
cd customer_surface/patches/a11oy_space
export HF_TOKEN=hf_...        # token with WRITE on SZLHOLDINGS/a11oy
DRY_RUN=0 python push_a11oy_tabs.py
# -> commits console/docs.html + console/pricing.html
# -> live at https://szlholdings-a11oy.hf.space/docs and /pricing
```

Driver: `customer_surface/patches/a11oy_space/push_a11oy_tabs.py` (validated in DRY_RUN).
Tab files are final, self-contained (inline CSS, no external asset deps), match the
a11oy dark theme, cross-link `/ · /docs · /pricing`, carry LOCKED numbers
(749 / 14 / 163 @ `lutar-v18.0.0` `c7c0ba17`, replay `bacf5443…631fc5`) and the
honest labels (Λ=Conjecture, Khipu sig=cosign PLACEHOLDER, SLSA=L1, Wire D in-process),
and cite competitor pricing with real URLs. Signed Yachay.

---

## Summary

| Target | Action | Status |
|---|---|---|
| `szl-holdings/.github` profile README | additive commercial-surface block | ✅ pushed (`d76db59`) |
| `szl-holdings/customer-portal` | new repo + FastAPI portal | ✅ created (private) + pushed (`8b0696c`) |
| `SZLHOLDINGS/a11oy` → `/docs` tab | `console/docs.html` | ⛔ blocked (no HF write perms) — driver ready |
| `SZLHOLDINGS/a11oy` → `/pricing` tab | `console/pricing.html` | ⛔ blocked (no HF write perms) — driver ready |

**Two founder decisions:** (1) flip `customer-portal` to public if intended; (2) run `push_a11oy_tabs.py` with a write-scoped HF token to land the two a11oy tabs.
