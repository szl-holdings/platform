<!-- SPDX-License-Identifier: Apache-2.0 -->
# RUNBOOK — Deployment (staging → prod promotion)

**Doctrine v11 — 749 / 14 / 163 — replay hash c7c0ba17**
**Maintained by:** Yachay (yachay@szlholdings.dev)
**Last updated:** 2026-06-01

---

## Overview

Every SZL flagship ships through a **staging gate** before prod. Staging Spaces
build from the **same source as prod** (the prod HF Space repo is cloned at Docker
build time) and run with the environment variable **`SZL_ENV=staging`**. The only
behavioral difference is that `/healthz` reports `env: "staging"` so smoke tests can
distinguish the two environments.

| Flagship  | Prod Space | Staging Space | Staging URL |
|-----------|-----------|---------------|-------------|
| a11oy     | [SZLHOLDINGS/a11oy](https://huggingface.co/spaces/SZLHOLDINGS/a11oy) | [SZLHOLDINGS/a11oy-staging](https://huggingface.co/spaces/SZLHOLDINGS/a11oy-staging) | <https://szlholdings-a11oy-staging.hf.space> |
| killinchu | [SZLHOLDINGS/killinchu](https://huggingface.co/spaces/SZLHOLDINGS/killinchu) | [SZLHOLDINGS/killinchu-staging](https://huggingface.co/spaces/SZLHOLDINGS/killinchu-staging) | <https://szlholdings-killinchu-staging.hf.space> |
| amaru     | [SZLHOLDINGS/amaru](https://huggingface.co/spaces/SZLHOLDINGS/amaru) | _staged-to-create_ | <https://szlholdings-amaru-staging.hf.space> |
| sentra    | [SZLHOLDINGS/sentra](https://huggingface.co/spaces/SZLHOLDINGS/sentra) | _staged-to-create_ | <https://szlholdings-sentra-staging.hf.space> |
| rosie     | [SZLHOLDINGS/rosie](https://huggingface.co/spaces/SZLHOLDINGS/rosie) | _staged-to-create_ | <https://szlholdings-rosie-staging.hf.space> |

> **Status (2026-06-01):** a11oy + killinchu staging Spaces are **live** (the two demo
> flagships). amaru / sentra / rosie are **staged-to-create** — to avoid the org's
> 20-Space/day creation rate limit during a 14-agent concurrency window, they are
> documented here and created on the next day's window using the identical pattern.

---

## The staging pattern (how it works)

A staging Space is a thin Docker wrapper around the prod source:

1. **`Dockerfile`** installs the same dependency surface as prod, then
   `git clone https://huggingface.co/spaces/SZLHOLDINGS/<flagship>` into
   `/app/prod-src` (so staging always tracks the exact prod source). A build-arg
   `SZL_PROD_REF` (default `main`) pins an exact ref when promoting.
2. **`serve_staging.py`** sets `SZL_ENV=staging`, imports the prod `app` from
   `serve.py` verbatim, strips any stale `/healthz` route, and re-registers an
   env-aware `/healthz` (and `/api/<flagship>/healthz`) that reports `env: "staging"`.
3. **`CMD ["python", "/app/serve_staging.py"]`** on port 7860.

This is **additive** — prod source is never modified. To stand up a new staging
Space for amaru / sentra / rosie, copy `Dockerfile.<flagship>-staging` +
`serve_staging.py` + `README.<flagship>.md` and create
`SZLHOLDINGS/<flagship>-staging` (docker SDK, public). Templates live in this repo's
PR history and in the agent workspace under `_staging_work/`.

---

## Flow 1 — PR merge → auto-deploy to staging

```
PR opened ──► CI (lint + unit + build) ──► merge to main
                                              │
                                              ▼
                       CI deploy job force-rebuilds the *-staging Space
                       (push empty commit to the staging Space repo OR
                        bump SZL_PROD_REF build-arg to the merge SHA)
                                              │
                                              ▼
                          staging Space rebuilds from same source
                          https://szlholdings-<flagship>-staging.hf.space
```

**Mechanics:** the deploy job authenticates with `HF_TOKEN` (founder/betterwithage
write scope) and forces a staging rebuild. Because staging clones prod source at
build, simply rebuilding pulls the just-merged code.

## Flow 2 — Smoke test passes on staging → manual promote to prod via tag

```
staging green ──► engineer runs smoke battery against staging URL
                                              │
                          all checks pass (p99 < 1.5s, error < 1%,
                          /healthz env == "staging", core routes 200)
                                              │
                                              ▼
                       engineer tags a release on the flagship repo:
                          git tag vX.Y.Z && git push origin vX.Y.Z
                                              │
                                              ▼
                       prod Space rebuild promotes the verified ref
                          https://huggingface.co/spaces/SZLHOLDINGS/<flagship>
```

**Promotion is manual and tag-gated** — there is no auto-promote from staging to
prod. The tag is the human approval signal.

### Smoke test battery (run against staging)

```bash
BASE=https://szlholdings-a11oy-staging.hf.space
# 1. env marker
curl -fsS "$BASE/healthz" | grep -q '"env": *"staging"' && echo "OK env=staging"
# 2. core routes return 2xx
for p in / /khipu/ledger /api/a11oy/v1/honest; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE$p"); echo "$p -> $code"
done
# 3. load baseline (see platform/load-tests/)
k6 run platform/load-tests/a11oy.js -e BASE_URL="$BASE"
```

---

## Rollback

Prod Spaces are immutable per-commit. To roll back, re-tag the previous good ref or
revert the merge on the flagship repo and let the prod rebuild pull the reverted
source. Staging always reflects `main`, so a bad merge is caught on staging first.

---

*Co-Authored-By: Perplexity Computer Agent*
*Doctrine v11 — 749/14/163 — c7c0ba17 — signed Yachay*
