# SZL Agent Gateway

**Phase:** 11 — Agent Gateway  
**Location:** `platform/agent-gateway/`  
**Owner:** platform-team  
**Status:** Local validation complete; production rollout requires human approval.

---

## What This Is

The Agent Gateway is the policy, audit, and evidence boundary for all AI agent operations at SZL Holdings. It fronts the OpenAI Agents SDK and enforces:

- **Authentication** — every caller must present a signed JWT
- **Authorization** — every action is evaluated against the OPA policy bundle (`platform/policy/`)
- **Capability enforcement** — allowed and forbidden capabilities are hard-coded; forbidden capabilities cannot be granted by any policy or approval
- **Impact simulation** — every action is dry-run before execution
- **Plan generation** — human-readable step list attached to the evidence record
- **Diff generation** — advisory manifest/PR diff for change-producing capabilities
- **Evidence attachment** — immutable evidence record tying caller, model, prompt hash, OPA decision, simulation, plan, diff, and rollback path
- **Approval routing** — Temporal approval workflow when policy requires it
- **Audit logging** — structured NDJSON + stdout (OTel pipeline) for every action

---

## Allowed Capabilities

These are the only capabilities an agent may request. Anything outside this list is rejected before authentication runs.

| Capability | Description |
|---|---|
| `inspect_code` | Read-only inspection of source files |
| `inspect_manifests` | Read-only inspection of deployment manifests |
| `analyze_telemetry` | Query-only analysis of observability data |
| `summarize_incidents` | Read-only summarization of incident records |
| `draft_runbooks` | Advisory runbook text; no file committed without PR-flow |
| `draft_prs` | Advisory PR diff; no PR opened without explicit human action |
| `propose_policy_fixes` | Advisory Rego amendment; no policy applied without policy-approver sign-off |
| `generate_documentation` | Advisory documentation; no commit without human review |
| `generate_test_plans` | Advisory test plan; no test files modified |
| `propose_architecture_diffs` | Advisory ADR; no infrastructure change without approval |

---

## Forbidden Capabilities

These are enforced in code before any other check. No amount of policy, approval, or token grants these.

| Capability | Rejection Reason |
|---|---|
| `direct_prod_change` | No agent may mutate production infrastructure directly |
| `policy_bypass` | No agent may bypass OPA policy evaluation |
| `pr_flow_bypass` | No agent may merge code without the PR review gate |
| `approval_bypass` | No agent may skip a required Temporal approval |
| `plaintext_secret_access` | No agent may read or emit plaintext secrets |

---

## Architecture

```
Caller
  │
  ▼
[1] Capability Enforcement (code-level; synchronous)
  │   FORBIDDEN → immediate reject (no auth, no OPA, no audit of caller)
  │   UNKNOWN   → immediate reject
  │
  ▼
[2] Authentication (JWT HS256 / Entra ID in prod)
  │   MISSING / INVALID → reject; audit entry written
  │
  ▼
[3] OPA Authorization (platform/policy/approval/approval-requirements.rego)
  │   DENY → reject; audit entry written
  │   ALLOW → continue with requiredApprovals / requiredGroups
  │
  ▼
[4] Impact Simulation (dry-run; synchronous)
[5] Plan Generation (human-readable steps)
[6] Diff Generation (advisory manifest/PR diff)
[7] Evidence Attachment (immutable EvidenceRecord assembled)
  │
  ▼
[8] Approval Routing (Temporal approval workflow if policy requires it)
  │   REJECTED / EXPIRED → reject; audit entry written
  │
  ▼
[9] Agent Execution (OpenAI Agents SDK)
  │
  ▼
[10] Audit Log (structured NDJSON + OTel stdout)
  │
  ▼
GatewayResponse → Caller
```

---

## Running Tests

```bash
cd platform/agent-gateway
pnpm install
pnpm test
```

All tests use local stubs (no live OPA, Temporal, or OpenAI required).

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `JWT_SECRET` | `szl-agent-gateway-dev-secret-do-not-use-in-prod` | JWT signing secret |
| `OPA_ENDPOINT` | `local` | OPA endpoint URL; `local` uses embedded evaluator |
| `TEMPORAL_ENDPOINT` | `local` | Temporal endpoint URL; `local` auto-approves |
| `OPENAI_API_KEY` | `local` | OpenAI API key; `local` returns deterministic stubs |
| `AUDIT_LOG_PATH` | `/tmp/agent-gateway-audit.ndjson` | Audit log file path |
| `APPROVAL_TIMEOUT_MS` | `300000` | Approval timeout in milliseconds |
| `PORT` | `8090` | HTTP server port |

---

## Observability

Every gateway action emits a structured JSON line to stdout with:

- `correlationId` — traces the request across the full pipeline
- `auditId` — unique ID for the audit entry
- `actor` — caller subject from the JWT
- `role` — caller role
- `capability` — the requested capability
- `target` — the target resource
- `model` — the AI model used
- `status` — the outcome (completed / forbidden / auth_failed / authz_denied / approval_denied / error)
- `durationMs` — total gateway time
- `riskLevel` — simulation risk assessment
- `approvalOutcome` — approval workflow result

---

## Deployment Notes

Production rollout requires:
1. Human approval from `platform-team`
2. Azure Entra ID integration for JWT (replace HS256 secret with JWKS endpoint)
3. Live OPA sidecar deployment (set `OPA_ENDPOINT` to sidecar URL)
4. Live Temporal cluster connection (set `TEMPORAL_ENDPOINT` to Temporal Cloud URL)
5. Real `OPENAI_API_KEY` (never committed; injected via Azure Key Vault)
