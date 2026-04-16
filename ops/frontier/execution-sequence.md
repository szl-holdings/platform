# Execution Sequence

Generated: 2026-04-15
Purpose: Recommended ordering for operationalization work after Phase 0–1 truth audit and security hygiene.

---

## Phase 0 — Truth Audit (THIS TASK — COMPLETE)

**Goal:** Know what we actually have before making decisions.

- [x] Audit every artifact — source file counts, classification, real vs. stub
- [x] Audit every shared library — activity level, stub detection
- [x] Audit mobile directories — credential exposure, release readiness
- [x] Audit CI/CD workflows — stale detection, coverage gaps
- [x] Audit documentation — README accuracy, claim verification
- [x] Create `ops/frontier/` deliverables (all 7 docs)

---

## Phase 1 — Security & Credential Hygiene (THIS TASK — COMPLETE)

**Goal:** No secrets in source, no leaked credentials, gitignore hardened.

- [x] Remove `OAUTH_STATE_SECRET` and `VAPID_PRIVATE_KEY` from `.replit [userenv.shared]`
- [x] Confirm mobile Firebase credential files are placeholders (confirmed — already placeholder)
- [x] Update `.gitignore` with mobile credential patterns
- [x] Create `ops/security/rotate-now.md` — rotation action list
- [x] Create `ops/security/secret-inventory.md` — full inventory
- [x] Create `ops/security/frontend-env-boundary.md` — VITE_ boundary rules
- [x] Create `ops/frontier/disposition-matrix.md`

---

## Phase 2 — Product Topology Rationalization

**Goal:** Stop running redundant/deprecated apps; reduce surface area.

**Blocked by:** Phase 0 (understanding what to cut) — now unblocked.

Sequence:
1. Deregister `stephen-site` artifact — content already in szl-holdings /founder
2. Deregister `prism-counsel` artifact — deprecated task #579, DEPRECATED.md present
3. Deregister `lyte-command-center` artifact — merged into command
4. Deregister `imperium` artifact — merged into command
5. Add 301 redirects for all deregistered paths
6. Update README — remove deprecated apps from Products table, fix badge counts
7. Update E2E matrix — remove lyte-command-center spec, add command spec
8. Delete `prism-counsel-ci.yml` workflow

**Outcome:** 8 canonical web apps + 2 mobile. No zombie processes.

---

## Phase 3 — Live Data Wiring (Domain by Domain)

**Goal:** Replace demo/stub data with real API connections. Prioritized by revenue proximity.

Priority order:
1. **Carlota Jo** — already most wired, finish remaining gaps (e-signature, scheduling)
2. **Vessels** — wire real AIS feed (MarineTraffic API or equivalent)
3. **Aegis** — wire real STIX/TAXII threat intel feeds
4. **Terra** — wire NYC public records + MLS data feed
5. **Command** — ensure all 8 domain signals are real SSE events

---

## Phase 4 — Mobile Release

**Goal:** CORTEX in app stores.

1. Set up EAS build credentials (Apple, Google) in EAS Secrets — not in source
2. Generate real `google-services.json` and `GoogleService-Info.plist` for cortex-mobile
3. Submit to TestFlight for iOS beta
4. Submit to Play Internal Testing for Android beta
5. Fix any store review issues
6. Public release

---

## Phase 5 — CI/CD Completeness

**Goal:** All canonical apps validated on every merge.

1. Add `aegis`, `terra`, `vessels`, `carlota-jo`, `command` to CI build matrix
2. Add `cortex-mobile` Expo build check to CI
3. Add integration test coverage for mutation paths (Vessels, Firestorm)
4. Set up integration test environment secrets
5. Add automated cleanup for test records

---

## Phase 6 — Infrastructure Hardening

**Goal:** Production-grade secret management, no dev fallbacks in prod.

1. Verify all dev fallbacks throw in `NODE_ENV=production` (not just warn)
2. Rotate `OAUTH_STATE_SECRET` — new value, delete old
3. Rotate `VAPID_PRIVATE_KEY` — new value, update push subscriptions
4. Move test token out of source
5. Enable Azure Key Vault for production secrets (if enterprise deployment proceeds)

---

## Phase 7 — Documentation Accuracy

**Goal:** README and all docs accurately reflect reality.

1. Update README badges: apps=8, endpoints=verified-count, DB-tables=561, Node=24
2. Remove PRISM Counsel and Stephen Site from Products table
3. Add honest "not yet in app stores" note for CORTEX
4. Verify all architecture diagram references are accurate
5. Archive or remove stale ops docs that contradict current state

---

## Dependency Graph

```
Phase 0 (Audit)
    │
    ├── Phase 1 (Security) — parallel
    │
    ▼
Phase 2 (Topology Rationalization)
    │
    ├── Phase 3 (Live Data) — parallel with Phase 4
    ├── Phase 4 (Mobile Release) — parallel with Phase 3
    │
    ▼
Phase 5 (CI/CD Completeness)
    │
    ▼
Phase 6 (Infra Hardening)
    │
    ▼
Phase 7 (Docs Accuracy)
```
