# eval-runner — Series-A Reproducibility Harness

Top-tier-tech-company reproducibility harness for the SZL Holdings platform.
Runs the full guardrails test suite (62 tests across 9 formal axes) and
produces deterministic CPS proof-chain artifacts (decision receipt, proof
ledger, run identity) for the Public Trust Portal.

## Files
- `Procfile` — Heroku/Replit dyno entry: `worker: python run.py`
- `run.py` — orchestrator: pulls latest substrate, executes test_suite,
  emits 12 CPS artifacts to ./artifacts/
- `conftest.py` — pytest fixtures: seeded RNG, mocked LLM clients,
  determinism guards (PYTHONHASHSEED, sorted dict iteration)
- `test_suite_reproducibility.py` — full E4 Codex Kernel run: Dresden
  Codex + IAU citations, 12 decision receipts, mocked:false
- `requirements.txt` — pinned deps (pytest, pydantic, httpx)

## Run locally
```bash
cd apps/eval-runner
pip install -r requirements.txt
python run.py
```

## Run in CI
GitHub Actions and CircleCI both invoke `python apps/eval-runner/run.py`
on every PR; artifacts are uploaded to the szl-trust public repo.

## Output
12 artifacts per run, matching the CPS v1 schema:
decision_receipt.json, deployment_contract.json, final_state.json,
final_table_preview.json, proof_ledger.jsonl, run_identity.json,
run_manifest.json, run_summary.json, secrets_status.json, trace.jsonl,
version_lineage.json, subkit_lib.py
