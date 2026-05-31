# eval-runner — FastAPI eval harness

A Python FastAPI service that runs governed eval *suites* and reports weighted,
reproducible scores. Each suite has a deterministic SHA-256 `content_hash` over
its cases, so a CI gate can detect if a suite's content drifts between runs.

This is a Python FastAPI app (not a pnpm workspace package): no `package.json`,
no `workspace:*` deps. It is driven by `requirements.txt` + `run.py`
(Procfile: `web: python run.py`), which launches `uvicorn src.main:app`.

## What an "eval" is here

An eval is a suite of small, self-contained cases. Each case:

```json
{ "id": "std-002", "category": "mmlu", "prompt": "What is the capital of France?",
  "expected": "Paris", "grader": "exact_match", "weight": 1 }
```

Graders are real and run against a candidate answer:

- `exact_match` — normalised (case/whitespace) equality with `expected`.
- `contains` — every comma-separated token in `expected` must appear in the
  candidate (used for list answers like `red, green, blue`).

`POST /eval` routes each case through its grader, aggregates by `weight`, and
compares the weighted score (0.0–1.0) to a `pass_threshold`. Wrong answers
lower the score; partial submissions cannot inflate it.

## Files

- `Procfile` — dyno entry: `web: python run.py`
- `run.py` — starts `uvicorn src.main:app` on `$PORT` (default 8001)
- `src/main.py` — FastAPI app: `/healthz`, `/suites`, `/suites/{name}`, `/eval`
- `src/suites.py` — case schema, graders, `_hash_suite`/`_build`,
  `STANDARD_SUITE`, and per-vertical domain suites
- `src/lm_eval_bridge.py` — bridge to lm-eval/HF datasets for the online
  standard suite; raises offline so the offline baseline is used
- `conftest.py` — pytest fixtures + offline determinism guards
- `test_suite_reproducibility.py` — content_hash reproducibility tests
- `test_app_eval.py` — grader + HTTP behaviour tests
- `requirements.txt` — pinned runtime deps (fastapi, uvicorn, pydantic,
  structlog, httpx); optional GPU extras are commented for a GPU host

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/healthz` | liveness; reports the standard suite `content_hash` |
| GET | `/suites` | list suites with their `content_hash` |
| GET | `/suites/{name}` | full suite descriptor (cases + hash) |
| POST | `/eval` | grade `answers` (case id → answer) against a named suite |

## Suites

- `standard` — offline baseline (MMLU/IFEval/TruthfulQA-style closed-form
  cases). When online with the GPU extras installed, the lm-eval bridge can
  source the standard suite instead; the `source` field records which was used.
- Domain suites mirroring SZL Holdings verticals: `vessels`, `terra`, `aegis`,
  `sentra`, `counsel`.

## Run locally

```bash
cd apps/eval-runner
pip install -r requirements.txt
python run.py            # serves on http://0.0.0.0:8001

curl localhost:8001/healthz
curl -X POST localhost:8001/eval -H 'content-type: application/json' \
  -d '{"suite":"standard","answers":{"std-001":"4","std-002":"Paris","std-003":"red, green, blue","std-004":"7","std-005":"yes"}}'
```

## Test

```bash
cd apps/eval-runner
pip install -r requirements.txt pytest
python -m pytest -q          # offline; conftest sets the offline flags
```

## Offline / online

`conftest.py` sets `EVAL_OFFLINE_FALLBACK=1` (plus HF/transformers offline
flags) so tests never touch the network. In that mode the standard suite uses
the built-in offline baseline. Online benchmark sourcing (lm-eval / HF
datasets) requires the optional GPU extras listed in `requirements.txt`; those
adapters are not provisioned in the CPU image.

## Build the container

Build from the monorepo root:

```bash
docker build -f apps/eval-runner/Dockerfile -t eval-runner .
```

The image runs as a non-root user, exposes `$PORT` (default 8001), and declares
a `HEALTHCHECK` against `/healthz`.
