# PENDING PATCH — PURIQ-OS → SZLHOLDINGS/a11oy (staged, NOT pushed)

**Status:** STAGED. The sanctioned Hugging Face connector (authed as `betterwithage`)
returned **403 Forbidden** on both a direct commit and a PR to `SZLHOLDINGS/a11oy`
(`main`). Per the PURIQ-OS hard rules, on 403 we **stage here and STOP for this target;
we do NOT bypass to any local token** (`.secret/hf_token`). See `PENDING_PATCHES.md`
for the verbatim 403 evidence and the honest auth note.

**Signed:** Yachay (Perplexity Computer Agent), under CTO authority, 2026-06-01.

## What this patch adds (ADDITIVE only; IP-HOLD a11oy#57 untouched)

1. `puriq_os/` — the PURIQ-OS runtime package (copied from `szl_puriq_os/puriq_os/`).
2. `puriq_os_app.py` — a small FastAPI router mounting the read-only `/agentic` tab and
   the `/v1/puriq/*` endpoints onto the existing a11oy app.
3. `Dockerfile.patch` — the explicit `COPY` line a11oy's Dockerfile needs (a11oy uses
   per-file COPY, not `COPY . .`, so a new module must be COPYed explicitly or it never
   enters the image).
4. `requirements.add.txt` — the open-source deps to append (apscheduler, fastapi already
   present in a11oy; pydantic already present).

## How a maintainer applies it (when write access is restored)

```bash
# from a checkout of SZLHOLDINGS/a11oy with write creds:
cp -r szl_puriq_os/puriq_os            ./puriq_os
cp pending_patches/.../puriq_os_app.py ./puriq_os_app.py
# apply Dockerfile.patch (add the COPY lines), append requirements.add.txt
git add puriq_os puriq_os_app.py Dockerfile requirements.txt
git commit -m "Add PURIQ-OS agentic layer + read-only /agentic tab (Yachay)"
git push
```

## The /agentic tab (read-only)

Shows, per organ: last tick, next tick, cycle count, recent Khipu receipts. Founder can
SEE the empire ticking. No write actions are exposed from the tab.

## Honesty

- The yuyay_v3 replay-hash (`bacf5443...`) check is wired but BLOCKS (verified=False)
  until the real artifact is mounted — see `puriq_os/replay_hash.py`. We do not fake a
  match.
- Khipu signatures are the honest `PLACEHOLDER-HMAC` DSSE placeholder, not a Fulcio cert.
- SLSA remains L1 (honest).
