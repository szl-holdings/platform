# AGENTIC-PROBE-20261111 — candidate proof

- Agent/recorded_by: Codex, acting for the repository owner.
- Recorded_at: 2026-11-11.
- Base revision: `034766fafe1ee98b8a9f9f2d3fd9dc45da1a778f`.
- Objective: make Agentic-GPU endpoint-liveness and fallback reporting match
  successful probe responses, and prevent integration errors from passing tests.
- Plan: inspect the operating doctrine, app status, gaps and artifact README;
  patch the backend adapter, add loopback HTTP regression tests, wire existing
  offline Python CI, document the contract and retained deployment limits.
- Patch: `vllm_backend.py`, `test_vllm_backend.py`, `.github/workflows/tests.yml`,
  artifact README and known-gaps candidate entry. Scheduler and daemon unchanged.
- Tests: new 9-test suite on original source failed with 20 failure/subtest
  reports; after repair all 9 pass. These exercise HTTP error/redirect handling,
  missing versus unhealthy health endpoints, trailing slash normalization,
  transport failure, fallback posture and propagation of daemon integration errors.
- `python3 -m unittest discover -s apps/agentic-gpu -p test_vllm_backend.py -v`:
  exit 0 after patch. Loopback only, no production endpoint queried.
- `python3 apps/agentic-gpu/vllm_backend.py`: exit 0 before and after;
  after patch `ok=true`, `daemon_integration_exercised=true`, all 18 checks true.
- Python AST and YAML workflow-step validation: exit 0.
- `pnpm typecheck`: exit 1 before and after, unsupported pnpm version
  (runtime 11.25.0; repository requires 10.26.1). Partial source workspace lacks
  installed monorepo dependencies. No TypeScript pass or release proof claimed.
- Screenshots: not applicable; no UI or route changes.
- Verification: unsuccessful HTTP responses cannot mark the selected backend
  live; redirects are not followed; a fallback daemon cannot assert local serving
  without a new backend selection; existing kwargs metadata remains compatible.
- Public claims: source-level liveness fix only. No model quality, inference,
  endpoint ownership, production security, runtime or deployment claim.
- Security: no credentials or environment files added. Existing private-network
  endpoint defaults retained; production transport/authentication remains open.
- Known gaps: candidate entry AGENTIC-PROBE-20261111 added, no runtime gap closed.
- Proof level: 2 source-test evidence, incomplete release proof; hosted CI pending.

Primary API references used for the repair:
- https://docs.vllm.ai/en/latest/api/vllm/entrypoints/serve/instrumentator/health/
- https://docs.python.org/3/library/urllib.request.html#urllib.request.HTTPRedirectHandler
