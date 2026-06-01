# amaru — Backend Fixes

## Smoke test result: NO broken endpoint found
amaru's smoke test did not reveal a broken endpoint. The Space was RUNNING, serving its static
front door at `/` and its `/api/amaru/*` routes were GREEN. The only gap was front-door
presentation (no dense hero), which is a styling change — not a backend fix. No backend code was
modified for amaru, honoring ADDITIVE-only and the "don't invent work" constraint.

## Routes verified GREEN (before and after the push)
- `GET /` → HTTP 200 (now with hero prepended)
- `GET /api/amaru/healthz` → 200

### Honest note on `/readyz`
- `GET /api/amaru/readyz` → 404. This endpoint **never existed** on amaru — it is not a
  regression caused by this makeover. We list it explicitly so the diff is unambiguous.

File-count delta on the repo: **+1** (our single front-door edit); zero deletions.
