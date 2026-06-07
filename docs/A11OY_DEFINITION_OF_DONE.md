# A11OY_DEFINITION_OF_DONE.md — Full Done Checklist

A task is not done when the code is written. A task is done when it satisfies every item on this checklist. This is not aspirational — it is the acceptance bar for every merged change.

---

## Core Criteria

### 1. Objective Met

- [ ] The patch implements exactly what the task plan specified — no more, no less.
- [ ] The objective stated in the plan can be verified by a third party reading the Proof Packet.
- [ ] No out-of-scope changes were introduced.

### 2. Code Quality

- [ ] `pnpm typecheck` passes (or is explicitly documented as no worse than pre-patch baseline).
- [ ] `pnpm test` passes for any changed logic that has tests.
- [ ] `pnpm qa:routes` passes for any route additions or changes.
- [ ] No `console.log` statements introduced in server code.
- [ ] No new TypeScript `any` casts introduced without documented justification.
- [ ] No unresolved TODO comments introduced in public-facing code.

### 3. Screenshot Evidence

- [ ] Every UI surface modified by this patch has at least one live screenshot.
- [ ] Screenshots are stored in `docs/assets/screenshots/current/` with correct filename convention.
- [ ] Screenshots are free of placeholder data, error states, and loading spinners (unless the patch is about those states).
- [ ] Every screenshot has a catalog entry in `audit/screenshot-catalog.md`.

### 4. Proof Packet

- [ ] A Proof Packet has been assembled at the required proof level for this Workcell.
- [ ] The Proof Packet includes: plan summary, patch summary, test results, screenshot refs, verification notes, public claim check, security check.
- [ ] The Proof Packet is recorded (in the commit message, in `audit/`, or both).

### 5. Security

- [ ] No secrets, tokens, credentials, or `.env` values appear in any committed file.
- [ ] SecretHawk sweep completed — result recorded in Proof Packet.
- [ ] `.gitignore` still covers all required patterns.
- [ ] No hardcoded credentials introduced.

### 6. Public Claims

- [ ] No unqualified public claims about customers, compliance, revenue, or integrations were introduced.
- [ ] ClaimGuard review completed for any public-facing copy changes — result recorded in Proof Packet.
- [ ] All capability claims use the approved qualifiers from `docs/A11OY_PUBLIC_CLAIMS_DOCTRINE.md`.

### 7. Naming

- [ ] No Bo11y, Bolly, or Boss naming appears in any changed file.
- [ ] All agent names match the canonical roster in `docs/A11OY_AGENT_DOCTRINE.md`.
- [ ] All product terminology matches the approved terms in `docs/A11OY_PRODUCT_LANGUAGE.md`.
- [ ] No vendor copy or trade dress introduced.

### 8. Documentation

- [ ] `docs/operations/known-gaps.md` is updated if new gaps were introduced or existing gaps were closed.
- [ ] `docs/APP_STATUS.md` is updated if artifact readiness status changed.
- [ ] Relevant artifact README is updated if the patch changes how the artifact works.
- [ ] If a new file was created, it is referenced from the appropriate index (`docs/INDEX.md` or similar).

### 9. Commit

- [ ] The commit message states: what changed, why, and what was verified.
- [ ] The commit message references the Workcell ID or task number.
- [ ] No force-push was performed.
- [ ] No history was rewritten.

### 10. Workcell Status

- [ ] The Workcell status is updated to `complete`.
- [ ] The Proof Packet is attached to the Workcell record.
- [ ] If the Workcell introduced or closed items in `docs/operations/known-gaps.md`, those entries are current.

---

## Minimum Bar (Non-Negotiable Floor)

Even for the smallest change, the absolute minimum is:

- [ ] `pnpm typecheck` run — result recorded.
- [ ] Commit message references the task.
- [ ] No secrets committed.
- [ ] No Bo11y / Bolly / Boss naming.
- [ ] Plan summary in Proof Packet (even if informal).

This minimum bar corresponds to Proof Level 1. It is the floor, not the standard. Most patches should meet Proof Level 3 or higher.

---

## Definition of "Not Done"

A task is explicitly NOT done if any of the following are true:

- The code is written but `pnpm typecheck` has not been run.
- A UI surface was modified but no screenshot was taken.
- A Proof Packet was not assembled.
- A public-facing copy change was made without a ClaimGuard review.
- A secret is present in the committed diff.
- Bo11y, Bolly, or Boss naming appears in a changed file.
- The commit message does not reference the task or Workcell.
- A force-push was performed.
- The Workcell status was not updated to `complete`.
