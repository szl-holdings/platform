# AGENTS — packages/policy-engine

**Scope:** Narrows [root AGENTS.md](../../AGENTS.md) for the policy engine package.

## What This Is

`@szl-holdings/policy-engine` provides hierarchical policy evaluation and guardrail enforcement for the agentic layer. It is distinct from `lib/covenant-policy` (which governs the platform/human layer) — this package governs AI agent behavior specifically.

## Critical Rules

- **Guardrails fire before agent output is returned.** The `guardrails` module checks every agent output before it is surfaced to users or passed to the next step. Do not bypass guardrails by returning output from a side channel.
- **Policy evaluation is deterministic.** Same input, same policy version → same output. Do not introduce randomness into policy evaluation. Policy rules must be pure functions.
- **Policy version is frozen at decision time.** When a policy is evaluated for a consequential decision, the policy version must be recorded in the decision snapshot. See [policy-model.md](../../policy-model.md).
- **Denied actions must log the reason.** Every `deny` result must produce a log entry with the rule that triggered the denial. Silent denials are policy violations.

## Key Files

| File | Purpose |
|------|---------|
| `src/evaluator.ts` | Core policy evaluation logic |
| `src/guardrails.ts` | Guardrail enforcement for agent outputs |
| `src/types.ts` | Policy type definitions |
| `src/index.ts` | Public surface |
