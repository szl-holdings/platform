---
name: debug-protocol
description: Systematic debugging protocol for isolating and fixing bugs in this TypeScript/React/Node monorepo. Use when a bug is non-obvious, a fix attempt failed, or a regression appeared after a recent change. Adapted from Everything Claude Code debugging patterns.
---

# Debug Protocol

A structured approach to debugging that avoids the "try random things" anti-pattern. Always produce a falsifiable hypothesis before changing code.

## Phase 1 — Reproduce

Before touching code, reproduce the bug reliably.

- What is the exact input or action sequence that triggers it?
- Does it reproduce in development? In a specific artifact only? After a cold start?
- Is it deterministic or intermittent?

If you cannot reproduce it, add logging first and wait for a recurrence before fixing.

## Phase 2 — Gather Evidence

Collect the full error signal before forming a hypothesis.

```bash
# Check workflow logs
# Use refresh_all_logs tool to get latest output

# TypeScript errors
pnpm tsc --noEmit 2>&1 | head -50

# Check for recent changes that might correlate
git log --oneline -20
git diff HEAD~5..HEAD -- <suspected-file>
```

For runtime errors:
- Read the full stack trace — focus on the first frame in your code (not in node_modules).
- Note the exact error message, type, and HTTP status if applicable.
- Check whether the error is thrown at the call site or originates deeper.

## Phase 3 — Form a Hypothesis

Write one sentence: "I believe the bug is caused by X, which I can verify by Y."

- X should be a specific code path, not a vague category ("async issue", "type error").
- Y should be a concrete check (add a `console.log`, inspect a value in the network tab, read a specific line).

Do not modify production code until you have a hypothesis.

## Phase 4 — Test the Hypothesis

Make the smallest possible change to confirm or refute:
- Add a log statement and observe the value.
- Add a type assertion and see if TypeScript catches it.
- Comment out the suspected line and check if the error disappears.

If the hypothesis is refuted, return to Phase 2.

## Phase 5 — Fix

Apply the minimal fix that addresses the root cause.

- Do not fix symptoms — fix the cause.
- If the fix is more than ~20 lines, it probably addresses more than one issue.
- If the fix requires changes in ≥ 3 files, run `monorepo-impact-analysis` first.

## Phase 6 — Prevent Recurrence

After fixing:
- Can a TypeScript type catch this class of bug at compile time? Add it.
- Should this code path have a guard clause for the edge case? Add it.
- Does the fix reveal a missing validation in the API layer?

## Common Patterns in This Stack

| Symptom | Common Cause | Check |
|---------|-------------|-------|
| `Cannot read properties of undefined` | Race condition or missing null guard | Add optional chaining, check async order |
| React component renders twice in dev | StrictMode (intentional) | Ignore in dev, verify in prod build |
| Vite HMR stops working | Circular import | Run `vite --debug` and look for circular dep warning |
| API 401 on first load | Session not initialized before request | Check auth middleware order |
| `Module not found` in monorepo | Package not built or not linked | Run `pnpm --filter <pkg> build` |
