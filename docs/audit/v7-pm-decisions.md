# Fly-High V7 — Pending PM Decisions

**Source:** `packages/payload/raw_v7/03_manifests/MANIFEST.json`
→ `pending_pm_decisions[]`
**Surfaced via:** `@szl-holdings/payload` → `V7.manifest.pendingPmDecisions`
**Date:** 2026-05-16
**Audience:** Stephen P. Lutar (PM / owner)
**Status:** propose-only — these items must be decided by the operator
before the V7 apply scripts can run end-to-end.

The V7 specialist explicitly surfaced three items that it **did not**
auto-resolve. Each is below with options, risk, and the V7 specialist's
recommendation. Picking a path here is a prerequisite for
`docs/audit/v7-apply-runbook.md` step 1.

---

## Decision 1 — `Glasswing` / `Mythos` usage inside `platform/`

### Observation

The V7 doctrine sweep counted 25+ occurrences of `Glasswing` and 30+
occurrences of `Mythos` inside `platform/` (the private 17th repo flagged
by `docs/audit/github-deep-scan.md`). Both strings appear to be **live
product feature names** — i.e. user-visible UI labels, route names, and
internal type names — not stale documentation drift.

### Why this matters

Both strings are on the V6/V7 forbidden-patterns list. Without an explicit
ruling, the only consistent doctrine outcome is to rename them throughout
`platform/`, which is a substantial refactor with downstream URL / API
breaking implications.

### Options

| Option | Description | Risk | Reversibility |
| ------ | ----------- | ---- | ------------- |
| **A. Doctrine exception** | Add `platform/`-scoped exception clauses to the doctrine for both names, formalized in `MANIFEST.json` as a fields analogous to `mythos_exception`. | Doctrine becomes more permissive; future audits must read both exception fields. | High — easy to retract later. |
| **B. Rename in `platform/`** | Sweep `platform/` and rename both features. New names TBD. | Multi-week refactor; URL/API breakage; possible billing / marketing impact. | Low — old names live in git history. |
| **C. Mark `platform/` out-of-scope** | Treat `platform/` as a non-canonical surface; doctrine guards skip the repo entirely. | Loses doctrine coverage on a customer-facing surface — defeats the point of V6. | Medium. |

### V7 specialist recommendation

**Option A — formalized doctrine exception** — provided the
`Claude Mythos Preview` precedent (already in V7) establishes the template
for narrowly-scoped name exemptions. The new exception should specify the
exact `platform/` path prefix and the two feature names, not be a blanket
allowance.

### Action requested from Stephen

Choose A / B / C. If A, name each feature explicitly (e.g.
`platform/internal/glasswing/**` is exempt for the literal string
`Glasswing`).

### Decision: A — doctrine exception (recorded 2026-05-17)

**Rationale.** Both `Glasswing` and `Mythos` are live, customer-facing
product feature names inside `platform/`. Renaming them (Option B) would
break URLs and APIs without doctrinal benefit; marking `platform/` as
out-of-scope (Option C) would gut V6's customer-facing coverage. The
existing `Claude Mythos Preview` precedent already establishes that
narrowly-scoped, path-anchored name exemptions are doctrine-compatible.

**Scope (narrow, path-anchored — not a blanket allowance).**

| Literal | Path prefix exempted |
| ------- | -------------------- |
| `Glasswing` | `platform/` (any subpath) |
| `Mythos`    | `platform/` (any subpath) |

Outside `platform/` both strings remain forbidden. The exception is
encoded in `@szl-holdings/payload` as `V7_PLATFORM_NAME_EXCEPTIONS` and
honored by `v7ForbiddenHits(text, context, path)` when `path` starts
with `platform/`.

---

## Decision 2 — BP review-count deadlock

### Observation

The V7 BP-fix specialist drafted 6 branch-protection PUT payloads. Each
sets `required_approving_review_count: 1` and (where applicable)
`require_code_owner_reviews: true`. Combined with three pre-existing org
constraints:

1. **Self-only CODEOWNERS** in several repos (Stephen is the only owner).
2. **`platform/`-side self-approve ban** — Stephen, as both author and
   owner, cannot self-approve his own PRs under the doctrine.
3. **`required_approving_review_count: 1`** in the new PUT payload.

…the math is: author cannot approve own PR + no other approver exists +
1 approval required = no merge path.

### Options

| Option | Description | Risk | Reversibility |
| ------ | ----------- | ---- | ------------- |
| **A. Set review_count to 0** | Drop required reviews; rely on CI + status checks only. | Loses human review gate. | Trivial — flip back to 1 later. |
| **B. Add a second human reviewer** | Onboard a second org admin (e.g. a contractor or an LLM-driven bot account approved by the org). | Org-membership change; identity-management work. | Medium. |
| **C. Add a non-self code-owner per repo** | Make CODEOWNERS list a second account that is not Stephen for each protected path. | Same identity problem as B; less invasive in repo settings. | Medium. |
| **D. Use Replit Agent / Claude as the reviewer** | Authorize an LLM-backed bot account to approve PRs against a narrow allowlist. | Doctrine / governance question — does an LLM constitute a "human review"? | Medium. |

### V7 specialist recommendation

**Option B or C**, depending on whether Stephen wants the second reviewer
to be a person or a constrained service account. Option A is the only
zero-effort path but defeats the BP-strict posture that V6 reports.

### Action requested from Stephen

Choose A / B / C / D. If B or C, name the second reviewer; the BP PUT
payload references CODEOWNERS that does not yet exist for those identities.

### Decision: A — set required_approving_review_count to 0 (recorded 2026-05-17)

**Rationale.** Options B/C/D all require onboarding a second identity
(human or bot) into the org, which is governance work that is out of
scope for the V7 apply window and was not pre-approved by Stephen.
Option A is the only path that unblocks `05_apply_bp.sh` without
introducing a new identity. The strict CI / status-check gate is
preserved; only the human-approval requirement is dropped. This is
explicitly recorded as a **temporary** posture — to be revisited as a
follow-up once a second reviewer (Option B or C) is named.

**Concrete change to the 6 BP PUT payloads** in
`raw_v7/05_apply_scripts/05_apply_bp.sh` (applied at apply-time, not by
this task):

- `required_approving_review_count: 1` → `required_approving_review_count: 0`
- `require_code_owner_reviews: true` → `require_code_owner_reviews: false`
- `required_status_checks.strict: true` — **unchanged** (CI gate kept)
- `enforce_admins: true` — **unchanged**

This keeps the BP-strict posture on every dimension except the
human-approval count, which the org's single-owner reality makes
unenforceable today.

---

## Decision 3 — `vsp-otel` / `agi-forecast` have no CODEOWNERS file

### Observation

The V7 hygiene-fix specialist drafted SECURITY.md, CONTRIBUTING.md, and
CODE_OF_CONDUCT.md for both `vsp-otel` and `agi-forecast` but did **not**
draft a CODEOWNERS file. The V7 BP payload for these two repos sets
`require_code_owner_reviews: true` — which, applied to a repo with no
CODEOWNERS file, is silently treated by GitHub as "no one can approve",
producing the same deadlock as Decision 2 on a wider blast radius.

### Options

| Option | Description | Risk | Reversibility |
| ------ | ----------- | ---- | ------------- |
| **A. Draft CODEOWNERS first** | Add a `.github/CODEOWNERS` file naming Stephen as owner for both repos before applying the BP payload. | Reproduces the Decision-2 problem unless a second reviewer is also onboarded. | Trivial. |
| **B. Drop `require_code_owner_reviews` for these two repos** | Apply a softer BP payload that omits the flag. | These two repos diverge from the rest of the org's strict posture. | Trivial. |
| **C. Defer BP for these two repos** | Leave them on current BP until Decision 2 is resolved and CODEOWNERS work is done in the same batch. | Two repos remain at `bp_weak` until the bundled work lands. | Trivial. |

### V7 specialist recommendation

**Option C** — coupling Decision 3 to Decision 2 keeps the BP-strict
rollout consistent across the org and avoids a partial-state where two
repos have strict BP with no merge path.

### Action requested from Stephen

Choose A / B / C. If A, confirm the CODEOWNERS path mapping for each repo.

### Decision: A — draft CODEOWNERS first (recorded 2026-05-17)

**Rationale.** Decision 2 (above) was resolved by dropping
`required_approving_review_count` to 0 and disabling
`require_code_owner_reviews`, which neutralizes the deadlock that
motivated the V7 specialist's coupled Option C. With the deadlock gone,
the rationale for deferring (Option C) evaporates, and a softer BP
payload (Option B) would leave these two repos diverging from the rest
of the org. Drafting CODEOWNERS now keeps `vsp-otel` and `agi-forecast`
on the same posture as the other four BP targets and lets
`05_apply_bp.sh` run in one batch.

**CODEOWNERS path mapping** (to be drafted at apply-time, not by this
task; both repos use the same single-owner pattern as the rest of the
org):

```
# .github/CODEOWNERS — vsp-otel
*       @SLutar

# .github/CODEOWNERS — agi-forecast
*       @SLutar
```

The `03_open_hygiene_prs.sh` script should add this CODEOWNERS file to
each of the two PRs it opens, alongside SECURITY.md / CONTRIBUTING.md /
CODE_OF_CONDUCT.md. With Decision 2 already removing
`require_code_owner_reviews`, the CODEOWNERS file is documentary rather
than gating, but it preserves parity with the rest of the org for any
future tightening.

---

## Provenance

- Manifest field: `pending_pm_decisions` in
  `packages/payload/raw_v7/03_manifests/MANIFEST.json`
- Rollup: `packages/payload/raw_v7/00_README/PM_OVERWATCH_FLY_V7_ROLLUP.md`
- Typed access: `import { V7 } from '@szl-holdings/payload'; V7.manifest.pendingPmDecisions`

Once all three decisions are recorded, append the chosen options to
`docs/audit/v7-apply-runbook.md` step 1 and proceed with the apply scripts
in the documented order — with explicit per-batch sign-off.
