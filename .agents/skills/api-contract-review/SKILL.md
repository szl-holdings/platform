---
name: api-contract-review
description: Review API route changes for backward compatibility and breaking changes before shipping. Use any time a REST endpoint's path, method, request body, or response shape changes in api-server, or when a shared type used across the API boundary is modified. Adapted from Claude Agent Blueprints API review patterns.
---

# API Contract Review

Breaking API changes silently corrupt mobile apps, web clients, and third-party integrations. This skill enforces a review gate before any API surface changes land.

## What Counts as a Breaking Change

| Change | Breaking? |
|--------|-----------|
| Remove a field from response body | **Yes** |
| Rename a field in response body | **Yes** |
| Change a field's type (e.g., string → number) | **Yes** |
| Add a required field to request body | **Yes** |
| Change HTTP method for a route | **Yes** |
| Change route path | **Yes** |
| Add an optional field to response body | No |
| Add a new optional request parameter | No |
| Add a new route | No |
| Change error message text (not code) | No |

## Review Checklist

### Route Shape
- [ ] The HTTP method is unchanged
- [ ] The path pattern is unchanged (or the old path still works via alias)
- [ ] All existing required request parameters are still accepted
- [ ] No existing response fields have been removed or renamed

### Types
- [ ] Shared request/response types in `packages/shared` are not narrowed in a breaking way
- [ ] Optional fields have not become required
- [ ] Enum values have not been removed

### Clients
- [ ] Identify every artifact that calls this endpoint (grep for the route path)
- [ ] Each client has been updated if the request shape changed
- [ ] Each client can handle the new response shape without crashing on old-shaped data

### Versioning (when a breaking change is unavoidable)
1. Add the new route at a new path (e.g., `/api/v2/...`) or under a new field.
2. Keep the old route working for at least one release cycle.
3. Update all internal clients to the new route.
4. Remove the old route in a follow-up PR clearly labeled `BREAKING CHANGE`.

## Grepping for Consumers

```bash
# Find all callers of an API route
grep -rn '"/api/tenants"' --include="*.ts" --include="*.tsx"
grep -rn "fetch.*tenants" --include="*.ts" --include="*.tsx"
```

## Output Format

```markdown
## API Contract Review: <route>

### Breaking Changes
- [yes/no] <reason>

### Affected Clients
- <artifact>: <file>:<line>

### Migration Required
<describe what callers must change, or "none">

### Verdict
[ Safe to Ship | Requires Migration | Blocked — needs versioning ]
```
