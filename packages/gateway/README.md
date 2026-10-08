# Governance Gateway Candidate Reference Core

This directory is a TypeScript candidate/reference implementation of a
governance gateway core. It is not evidence that a gateway is deployed in
front of any customer product surface.

There is currently no package manifest, TypeScript build configuration,
container image definition, deployment manifest, or published artifact for
this directory. The shared repository test harness can execute its source and
contract tests, but production promotion remains on **HOLD** until a deployable
artifact and its external dependencies are independently built and proven.

## Modules
| Module | Role |
|--------|------|
| `gateway.ts` | Main request entry — runs auth → authz → planner → simulation → enforce → audit |
| `server.ts` | Candidate HTTP bootstrap using Node's native `node:http` server |
| `auth.ts` | Strict local HS256 and live RS256 JWT verification |
| `authz.ts` | OPA policy evaluation, date-header signing |
| `approval.ts` | Temporal client boundary and strict approval-result validation; no worker is shipped here |
| `planner.ts` | Action plan generator with cost + risk scoring |
| `simulation.ts` | Dry-run simulator — predicts side-effects before execute |
| `differ.ts` | State diff producer (before/after table previews) |
| `evidence.ts` | Evidence-record assembler; durable production storage is external |
| `enforce.ts` | Final enforcement gate — blocks unauthorized writes |
| `audit.ts` | Required persistence call plus a mutable development NDJSON sink |
| `agent-runner.ts` | Candidate model-provider execution boundary; no latency or overhead bound is proven |
| `operation-type.ts` | Operation taxonomy enum |
| `types.ts` | Shared type contracts |

Every action must provide an explicit `targetEnvironment` of `development`,
`staging`, or `production`; neither the HTTP boundary nor the gateway core
defaults a missing value to development.

The explicit development/test stub uses HS256 and requires `JWT_SECRET`.
HS256 is rejected in live mode. Live startup instead requires
`JWT_ALGORITHM=RS256`, a valid RSA public key of at least 2048 bits in
`JWT_PUBLIC_KEY`, and exact `JWT_ISSUER`, `JWT_AUDIENCE`, and `JWT_ORG_ID`
values. RS256
verification checks the signature, algorithm, type, issuer, audience,
not-before, expiry, issued-at, caller-identity claim types, and an exact signed
organization binding. The verified `orgId` is propagated to OPA as `org_id`.

Provider execution is live by default and requires `OPENAI_API_KEY`. Tests and
local development may explicitly set `GATEWAY_EXECUTION_MODE=stub`; that mode
is rejected in production and returns only an `UNAVAILABLE` marker, never a
fabricated success claim.

Live mode also requires `OPA_ENDPOINT` and `TEMPORAL_ENDPOINT`. A TCP-open
Temporal frontend is not readiness evidence: this repository does not ship the
`approvalWorkflow` worker. The proof endpoint is an external, authenticated
service boundary; this source posts a fixed probe and strictly validates its
response, but it does not itself execute or observe the worker. Live startup
remains on HOLD unless
`TEMPORAL_NAMESPACE`, `TEMPORAL_APPROVAL_TASK_QUEUE`,
`TEMPORAL_APPROVAL_PROOF_ENDPOINT` (HTTPS), and
`TEMPORAL_APPROVAL_PROOF_TOKEN` point to a deployed proof service that returns
the exact fixed workflow, namespace, task-queue, distinct-approver, count, and
group contract. That response is necessary readiness evidence, not a local
proof that such infrastructure exists. Embedded policy and local auto-approval
are test/development-only and throw in production.
The current checkout also does not declare `@temporalio/client`; readiness
checks its runtime availability, so the live gateway remains non-promotable
until both the client and deployed-worker proof exist.

The remote OPA boundary queries `/v1/data/szl/approval/decision` with a bounded
timeout and rejects
missing, malformed, ambiguous, or explicitly denied results. The reviewed
bundle is `policy/approval/approval-requirements.rego`; its adjacent SHA-256
file and a hard-coded test digest make presence and exact content a mandatory,
non-skippable CI contract. Startup/readiness posts a fixed production probe to
that same decision path and verifies the exact approval count and groups; OPA
`/health` alone cannot mark the gateway ready. A native OPA integration is
supplemental when an authenticated OPA binary is available.

Live mode is also on startup HOLD unless `EVIDENCE_LEDGER_ENDPOINT` (HTTPS) and
`EVIDENCE_LEDGER_TOKEN` configure a backend whose readiness response attests
`durable`, `tamperEvident`, and `appendOnly`. Evidence and an authorization
audit record must be acknowledged with the exact record digest before provider
execution. Persistence failure blocks execution, and a final audit failure can
never return success. Those properties are claims supplied by the external
backend and still require deployment evidence. The local/test NDJSON sink is
fsynced but remains a mutable development artifact; it is neither immutable nor
production evidence.

## Tests (`test/`)
Tests cover auth, strict OPA decisions, policy-bundle integrity, evidence and
audit persistence, target-environment validation, simulation, gateway E2E,
gateway integration, optional native OPA execution, and server startup/smoke.
