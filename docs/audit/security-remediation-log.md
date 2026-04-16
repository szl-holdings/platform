# Security Remediation Log

**Maintained by:** Platform Engineering  
**Last updated:** April 16, 2026

This log records all security findings, their disposition, and remediation status. Every finding from `security-findings.md` that requires action is tracked here with owner, dates, and closure criteria.

---

## Active Remediations

### REM-002 — Zod Input Validation Coverage Gap

| Field | Value |
|-------|-------|
| **Finding** | Only 21 of 170 top-level route files apply Zod input validation via `validateBody()`, `validateQuery()`, or `validateParams()` |
| **Severity** | HIGH |
| **Affected routes** | 149 of 170 top-level route files |
| **Risk** | Unvalidated inputs could bypass type expectations, cause unexpected behavior, or create injection surfaces |
| **Mitigation in place** | All DB queries use Drizzle ORM parameterized queries (no raw SQL); 155 routes have auth enforcement; the highest-risk surfaces (auth, forms, payments) are already validated |
| **Status** | ⚠️ Active — dedicated expansion task in backlog |
| **Owner** | Platform Engineering |
| **Target close date** | Q2 2026 |
| **Closure criteria** | Zod validation coverage ≥ 80% of top-level route files; automated route security matrix tracks this |

---

### REM-003 — Route Security Matrix Not Automated

| Field | Value |
|-------|-------|
| **Finding** | No automated tooling exists to enumerate the auth enforcement level of every API route; the current 155/170 coverage count is from manual inspection |
| **Severity** | MEDIUM |
| **Risk** | New routes can be added without auth middleware without being detected until the next manual audit |
| **Mitigation in place** | Manual audit documented in `docs/known-gaps.md §3.2`; auth middleware applied to 155/170 routes |
| **Status** | ⚠️ Active — companion task in backlog ("Build an automated route security matrix") |
| **Owner** | Platform Engineering |
| **Target close date** | Q2 2026 |
| **Closure criteria** | CI step that enumerates all routes and fails if any route lacks explicit auth middleware annotation |

---

### REM-004 — In-Memory Session Store

| Field | Value |
|-------|-------|
| **Finding** | Session data is stored in memory, not in a persistent store (Redis, Postgres) |
| **Severity** | MEDIUM |
| **Risk** | Sessions are lost on server restart; does not support horizontal scaling; a memory leak in session store could cause OOM |
| **Mitigation in place** | Short session TTL (7 days); single-instance deployment (no horizontal scaling currently) |
| **Status** | ⚠️ Planned — see `docs/known-gaps.md §Session Store` |
| **Owner** | Platform Engineering |
| **Target close date** | Before first paid production tenant |
| **Closure criteria** | Session store backed by Redis or Postgres; sessions survive server restart |

---

### ~~REM-005~~ — CLOSED — See REM-C005 below

---

## Closed Remediations

### REM-C001 — Real Secrets in Tracked Files (CLOSED — NOT FOUND)

| Field | Value |
|-------|-------|
| **Finding** | Concern: real API keys, passwords, or tokens may have been committed to version control |
| **Resolution** | Full scan completed April 16, 2026. No real secrets found. `.env.example` contains only safe placeholder values. Backups excluded by `.gitignore`. |
| **Status** | ✅ Closed — No action required |
| **Closed date** | April 16, 2026 |

---

### REM-C002 — Playwright E2E Missing Trace/Video Retention

| Field | Value |
|-------|-------|
| **Finding** | Playwright E2E tests may not retain traces and videos on failure |
| **Resolution** | `playwright.config.ts` already has `trace: "retain-on-failure"` and `video: "retain-on-failure"`. E2E workflow uploads traces and screenshots as artifacts on failure. |
| **Status** | ✅ Closed — Already configured |
| **Closed date** | April 16, 2026 |

---

### REM-C005 — `codeql.yml` Missing Top-Level `permissions: {}` Default (CLOSED)

| Field | Value |
|-------|-------|
| **Finding** | `codeql.yml` did not set a top-level `permissions: {}` default |
| **Resolution** | Added `permissions: {}` at top level in `codeql.yml` as part of this hardening pass. Per-job permissions remain explicitly set: `actions: read`, `contents: read`, `security-events: write`. |
| **Status** | ✅ Closed |
| **Closed date** | April 16, 2026 |

---

### REM-C004 — GitHub Actions Not Fully SHA-Pinned (CLOSED)

| Field | Value |
|-------|-------|
| **Finding** | Several workflow files used version tags (`@v4`, `@v3`) instead of immutable commit SHAs |
| **Resolution** | All third-party actions across all 17 workflow files are now pinned to exact commit SHAs: `actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683` (v4.2.2), `pnpm/action-setup@fe52bf0ad0164d2310b5e4d5d7bfec47b67e3f9d` (v4.0.0), `actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020` (v4.4.0), `actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02` (v4.6.2), `actions/dependency-review-action@2031cfc080254a8a887f58cffee85186f0e49e48` (v4.9.0), `github/codeql-action/*@ce64ddcb0d8d890d2df4a9d1c04ff297367dea2a` (v3.35.2), `docker/build-push-action@10e90e3645eae34f1e60eeb005ba3a3d33f178e8` (v6), `docker/login-action@c94ce9fb468520275223c153574b00df6fe4bcc9` (v3), `docker/metadata-action@c299e40c65443455700f0fdfc63efafe5b349051` (v5), `docker/setup-buildx-action@8d2750c68a42422c14e847fe6c8ac0403b4cbd6f` (v3). Dependabot configured to keep SHAs updated automatically. |
| **Status** | ✅ Closed |
| **Closed date** | April 16, 2026 |

---

### REM-C003 — SBOM Generation Not Validated

| Field | Value |
|-------|-------|
| **Finding** | SBOM generation script may not be working or integrated into CI |
| **Resolution** | `scripts/qa/generate-sbom.js` exists and is integrated into the `security.yml` CI workflow. SBOM artifact is retained for 90 days per run. Uses npm bulk advisory endpoint. |
| **Status** | ✅ Closed — Already working |
| **Closed date** | April 16, 2026 |

---

*Add new findings at the top of the Active section. Close findings by moving them to the Closed section with resolution notes.*
