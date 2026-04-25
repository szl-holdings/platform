---
name: doc-comment-hygiene
description: Audit and improve inline documentation, JSDoc comments, and README files across the monorepo. Use when preparing code for review, after completing a feature, or when a new engineer needs to onboard to a module. Adapted from Antigravity Awesome Skills documentation patterns.
---

# Doc & Comment Hygiene

Well-placed documentation saves time for every future reader — including future task agents. Poorly placed documentation is noise. This skill guides you to the right balance.

## The Rule: Comment Why, Not What

Code explains *what* it does. Comments explain *why* it does it. Delete comments that restate the code.

```typescript
// Bad: restates the code
// Add 1 to count
count += 1;

// Good: explains non-obvious intent
// Increment before the request so duplicate submissions during the await are rejected
count += 1;
await submitForm();
```

## JSDoc for Exported Symbols

Every exported function, class, type, and constant in a shared package should have a JSDoc comment:

```typescript
/**
 * Formats a monetary value for display with the tenant's configured currency.
 *
 * @param amount - Value in cents (integer)
 * @param currency - ISO 4217 currency code (e.g., "USD")
 * @returns Localized string, e.g. "$1,234.56"
 * @throws {RangeError} if amount is negative
 */
export function formatCurrency(amount: number, currency: string): string { ... }
```

Required tags for exported functions: `@param`, `@returns`. Add `@throws` if the function can throw. Add `@deprecated` with a migration note when retiring a symbol.

## What Needs a Comment

| Situation | Comment type |
|-----------|-------------|
| Non-obvious algorithm or formula | Inline comment explaining the logic |
| Workaround for a library bug | Inline comment with issue URL |
| Magic number | Named constant + JSDoc |
| Complex regex | Inline comment with example match |
| Exported API surface | JSDoc on the symbol |
| Complex component prop | JSDoc on the interface field |

## What Does NOT Need a Comment

- Self-explanatory variable names (`const isLoading = true`)
- Standard React patterns (`useState`, `useEffect` with obvious deps)
- Boilerplate imports
- Every line in a simple utility function

## README Health

Every package in `packages/` and every artifact in `artifacts/` should have a `README.md` with:
1. **What it is** — one sentence
2. **How to run it** — the dev command
3. **Key environment variables** — link to `.env.example`
4. **Architecture note** — one paragraph on non-obvious design decisions (optional for simple packages)

## Audit Process

1. Open the file or package to audit.
2. For each exported symbol: does it have a JSDoc? Is it accurate? (Outdated docs are worse than no docs.)
3. For each inline comment: is it explaining *why*? If it just restates the code, delete it.
4. Check README exists and is not stale.
5. Commit as `docs(<scope>): <description>`.
