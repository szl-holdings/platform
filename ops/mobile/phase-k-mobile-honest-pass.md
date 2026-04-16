# Phase K — Mobile Beta Honest Pass (Completion Summary)

**Updated:** 2026-04-16
**Task:** Series A Frontier Pass — Phase K
**Status:** Complete

This document is the single index for the Phase K Mobile Beta Honest Pass.
It links to every deliverable required by the task and records what changed
to deliver Phase K honestly.

---

## Done-Looks-Like Checklist

| Requirement | Status | Source of Truth |
|-------------|--------|-----------------|
| One canonical mobile beta path is clearly identified | Done | `mobile-disposition.md` — flagship is `artifacts/szl-holdings-mobile` (CORTEX, 167 src files, full `app.json` + `eas.json`) |
| Non-canonical mobile path is clearly downgraded in docs and positioning | Done | `artifacts/cortex-mobile/DEFERRED.md` (in-tree marker) + `mobile-disposition.md` + `ops/frontier/disposition-matrix.md` (classified `SHELL`) |
| Mobile credential needs and manual console steps are isolated and documented | Done | `eas-and-store-secrets-matrix.md`, `testflight-play-internal-runbook.md`, `artifacts/szl-holdings-mobile/SETUP.md` |
| Mobile story aligns with platform — governed command surface, not a standalone app | Done | `flagship-release-readiness.md` (positions CORTEX as unified-command surface across 8 domains) and `mobile-series-a-pass.md` (Section "CORTEX Mobile — Current State") |
| Credible beta and internal-testing plan exists | Done | `mobile-beta-to-launch.md` (phased Internal Alpha → Founder Beta → Public path with explicit exit criteria) |
| App-store-facing materials consistent with real feature set and permissions | Done | `store-asset-inventory.md`, `reviewer-notes-and-test-accounts.md` (claims match capabilities listed in `mobile-series-a-pass.md`) |
| `/ops/benchmark/mobile-series-a-pass.md` produced | Done | `ops/benchmark/mobile-series-a-pass.md` (85 lines) |
| `/ops/benchmark/mobile-beta-to-launch.md` produced | Done | `ops/benchmark/mobile-beta-to-launch.md` (88 lines) |

---

## Canonical vs Deferred — Authoritative Statement

**Canonical mobile app:** `artifacts/szl-holdings-mobile` (named "CORTEX"
in `app.json`, bundle `com.szlholdings.executive.mobile`).

**Deferred scaffold:** `artifacts/cortex-mobile`. Empty Expo Router
scaffold; no `package.json`, no `app.json`, no implemented screens. Carries
an in-tree `DEFERRED.md` marker that names the canonical app and forbids
new work in the directory.

This statement is consistent across:

- `ops/mobile/mobile-disposition.md`
- `ops/mobile/flagship-release-readiness.md`
- `ops/frontier/disposition-matrix.md`
- `artifacts/cortex-mobile/DEFERRED.md`

---

## Deliverable Index

### `/ops/benchmark/` (required by Phase K)

| File | Purpose |
|------|---------|
| `ops/benchmark/mobile-series-a-pass.md` | What CORTEX mobile signals to Series A investors; competitive comparison; current capability matrix |
| `ops/benchmark/mobile-beta-to-launch.md` | Phased path from current alpha to public store listing with exit criteria per phase |

### `/ops/mobile/` (operator runbooks, credentials, store assets)

| File | Purpose |
|------|---------|
| `ops/mobile/mobile-disposition.md` | Authoritative disposition: flagship vs deferred |
| `ops/mobile/flagship-release-readiness.md` | Readiness matrix split into Code-Ready vs Operator-Action tracks |
| `ops/mobile/testflight-play-internal-runbook.md` | Step-by-step TestFlight + Play Internal release runbook (canonical) |
| `ops/mobile/eas-and-store-secrets-matrix.md` | Inventory of every credential, secret, and console action required (canonical) |
| `ops/mobile/store-asset-inventory.md` | Required iOS + Android store assets and their status (canonical) |
| `ops/mobile/reviewer-notes-and-test-accounts.md` | Apple/Google reviewer-facing notes and demo account handoff |
| `ops/mobile/push-notification-setup.md` | Push notification architecture and operator setup |

### Deprecated predecessors (retained as historical pointers)

These files carry a `DEPRECATED` banner pointing to the canonical version
above. They were kept to preserve link backwards-compatibility:

- `ops/mobile/flagship-mobile-release-plan.md` → superseded by `flagship-release-readiness.md`
- `ops/mobile/store-assets-checklist.md` → superseded by `store-asset-inventory.md`
- `ops/mobile/eas-secrets-matrix.md` → superseded by `eas-and-store-secrets-matrix.md`

---

## What Changed in Phase K

The Phase K work was an audit pass; most deliverables already existed and
were verified for accuracy. The audit produced two changes:

1. **Added `artifacts/cortex-mobile/DEFERRED.md`** — an in-tree marker so
   the deferred status is visible to anyone browsing the directory, not
   only readers of the `ops/` docs. Lists what the directory contains
   (empty route folders, `expo-env.d.ts`, `.expo/`, `node_modules/`) and
   names the canonical app.
2. **Added this file (`ops/mobile/phase-k-mobile-honest-pass.md`)** — a
   single index that maps each Phase K requirement to its source of truth
   so the honest-pass story is auditable end-to-end.

No new mobile features, app-store submissions, or push-notification
infrastructure changes were made; those are explicitly out of scope per
the task definition.

---

## Downstream

The downstream "Series A: Readiness Verdict & Final Deliverables" task
already accounts for the mobile readiness verdict and any remaining
Series A roll-up. No additional follow-up tasks are proposed from
Phase K.
