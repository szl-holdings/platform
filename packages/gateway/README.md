# @szl/gateway — Governance Gateway Core

TypeScript core for the SZL Holdings governance gateway. Implements the
Covenant Proof Standard (CPS) enforcement layer that sits in front of
every customer-facing surface (A11oy, ROSIE, Sentra, Amaru, Vessels,
Terra, Counsel, Carlota Jo).

## Modules
| Module | Role |
|--------|------|
| `gateway.ts` | Main request entry — runs auth → authz → planner → simulation → enforce → audit |
| `server.ts` | HTTP server bootstrap (Fastify + structured logging) |
| `auth.ts` | JWT + OAuth verification, key rotation |
| `authz.ts` | OPA policy evaluation, date-header signing |
| `approval.ts` | Multi-party approval workflow (human-in-loop) |
| `planner.ts` | Action plan generator with cost + risk scoring |
| `simulation.ts` | Dry-run simulator — predicts side-effects before execute |
| `differ.ts` | State diff producer (before/after table previews) |
| `evidence.ts` | CPS evidence bundle assembler |
| `enforce.ts` | Final enforcement gate — blocks unauthorized writes |
| `audit.ts` | Immutable audit trail emitter (proof_ledger.jsonl) |
| `agent-runner.ts` | LLM agent executor with Λ-bounded overhead |
| `operation-type.ts` | Operation taxonomy enum |
| `types.ts` | Shared type contracts |

## Tests (`test/`)
8 test files covering auth, authz, evidence, simulation, gateway E2E,
gateway integration, OPA live policy, and server smoke.
