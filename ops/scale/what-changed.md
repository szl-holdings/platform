# What Changed

Phase J · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

Append-only log of material changes to the SZL platform's operational
state. Each entry: date, scope, rationale, references. New entries go
at the top.

## Entry Schema

```
## YYYY-MM-DD — <one-line title>

**Scope:** <docs | ops | code | infra | mobile | release | hotfix | held>
**Owner:** <founder | engineering | counsel>
**Rationale:** <why this change>
**References:** <files, PRs, tags>
**Effect on customers:** <none | <description>>
```

A release entry uses the same schema, plus the founder release approval
template appended below it (see `founder-release-approval.md`).

A held release uses scope `held` with the reason and the next target
window.

---

## 2026-04-16 — SZL Scale, Close, and Operate Pass complete (Task #793)

**Scope:** docs
**Owner:** founder
**Rationale:** Convert the platform from a Series-A-grade asset into an
operable, closable, scalable company system. Codify every cadence,
checklist, escalation path, and decision rule needed to onboard the
first paying enterprise customer without depending on memory.
**References:**
- `ops/scale/README.md` (index)
- `ops/scale/executive-summary.md` (top-down)
- 35 deliverable docs across `ops/scale/` Phases A–J
**Effect on customers:** None directly. Improves the operational
backbone behind every customer touchpoint.

---

## 2026-04-15 — ATLAS Spatial Runtime core merged

**Scope:** code
**Owner:** engineering
**Rationale:** Adds spatial event taxonomy + API routes per Task #848.
**References:** `packages/atlas-events`, `artifacts/api-server` routes.
**Effect on customers:** None until exposed via tenant features.

---

## 2026-04-14 — Mobile Honest Pass (Task #791) approved

**Scope:** docs
**Owner:** founder
**Rationale:** Establish canonical mobile path
(`artifacts/szl-holdings-mobile` = CORTEX) and document deferred scaffold
(`artifacts/cortex-mobile` = DEFERRED). Index Phase K mobile work.
**References:**
- `artifacts/cortex-mobile/DEFERRED.md`
- `ops/mobile/phase-k-mobile-honest-pass.md`
**Effect on customers:** None directly. Removes ambiguity in mobile
positioning for partners and buyers.

---

## 2026-04-15 — Hardcoded secrets removed from `.replit`

**Scope:** infra
**Owner:** founder
**Rationale:** `OAUTH_STATE_SECRET` and `VAPID_PRIVATE_KEY` were
hardcoded in `.replit [userenv.shared]`. Removed from shared env;
documented rotation in `ops/security/rotate-now.md`.
**References:**
- `ops/security/secret-inventory.md`
- `ops/security/rotate-now.md`
**Effect on customers:** None today. Production cutover will use freshly
generated values per `production-cutover-checklist.md` Phase 1.

---

## How to Add an Entry

1. Open this file
2. Insert a new entry at the top (above the most recent), under the
   schema header
3. Commit with a descriptive message
4. Reference this entry from the corresponding pipeline / incident /
   release artifact

## What Belongs Here

- Material doc passes (like this one) — yes
- Production deploys — yes
- Hotfixes — yes
- Held releases — yes
- Schema migrations — yes
- Subprocessor changes — yes
- Pricing changes — yes
- Major customer-impacting policy changes — yes

## What Does NOT Belong Here

- Every commit (use `main` log)
- Workspace-only changes
- Internal-only doc changes that do not change operating model
- Routine dependency bumps (those live in PR descriptions)
