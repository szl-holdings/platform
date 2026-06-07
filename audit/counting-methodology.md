# SZL Holdings — Counting Methodology Appendix

**Audit date:** 2026-04-21  
**Purpose:** Define exactly what is being counted and how, so every canonical metric in the audit package is reproducible from a clean checkout. All commands are run from the repository root.

**Truth Label Key:**
- **VERIFIED** — confirmed by the exact command shown
- **PARTIALLY VERIFIED** — partially confirmed; not all conditions can be validated without a running server
- **UNVERIFIED** — asserted but not validated in this audit
- **BROKEN** — claim contradicted by primary-source evidence

---

## Canonical Commands and Results

### 1. pgTable Definitions (Database Tables)

**Canonical count: 915**

```sh
grep -r "pgTable(" lib/db/src/schema/ --include="*.ts" | wc -l
# → 915
```

**Why `pgTable(` not `pgTable`:**  
Using `pgTable(` (with open parenthesis) counts only direct Drizzle ORM table definition function calls. The broader pattern `grep "pgTable"` yields **1,078 lines** because TypeScript source files also:
- Import the function: `import { pgTable } from "drizzle-orm/pg-core"`
- Reference it in type inference: `InferSelectModel<typeof tableName>`
- Use it in type annotations and helper generics

None of the import/type lines define new database tables. The correct count of actual table definitions is **915**.

**Audit Status: VERIFIED**

---

### 2. Schema Files

**Canonical count: 165**

```sh
find lib/db/src/schema -name "*.ts" | wc -l
# → 165
```

**Audit Status: VERIFIED**

---

### 3. API Route Files

**Canonical count: 382 `.ts` files in 268 top-level route groups**

```sh
find artifacts/api-server/src/routes -name "*.ts" | wc -l
# → 382

ls artifacts/api-server/src/routes/ | wc -l
# → 268
```

**Audit Status: VERIFIED**

---

### 4. Package Directories

**Canonical count: 81 package directories + 41 lib directories = 122 total**

```sh
find packages -maxdepth 1 -mindepth 1 -type d | wc -l
# → 81  (excludes packages/proxy-routes.ts — a standalone file, not a package)

find lib -maxdepth 1 -mindepth 1 -type d | wc -l
# → 41

# ls packages/ | wc -l = 82 (includes proxy-routes.ts — do NOT use this for package count)
```

**Note:** `packages/proxy-routes.ts` is a top-level TypeScript file in `packages/` that is not a package directory. The canonical package count excludes it.

**Audit Status: VERIFIED**

---

### 5. Registered Artifacts

**Two separate registration systems — both accurate:**

| System | Count | Command |
|--------|-------|---------|
| `.replit [[artifacts]]` | 2 entries (`artifacts/api-server`, `artifacts/mockup-sandbox`) | `grep -c "^\[\[artifacts\]\]" .replit` = 2 |
| Workspace registry | 15 registered | Platform workspace registry (list visible in environment) |

`platform-facts.md` "Active artifacts: 2" refers only to the `.replit [[artifacts]]` entries. The workspace registry has 15. Neither system has any workflow currently running.

**Audit Status: VERIFIED for both counts; VERIFIED that none are running (system log)**

---

### 6. Workflow Count and Status

**Canonical count: 18 workflows; all NOT STARTED**

Confirmed from system log at time of audit:
1. `api-test` — NOT STARTED
2. `artifacts/aegis: web` — NOT STARTED
3. `artifacts/api-server: api` — NOT STARTED
4. `artifacts/carlota-jo: web` — NOT STARTED
5. `artifacts/command: web` — NOT STARTED
6. `artifacts/counsel: web` — NOT STARTED
7. `artifacts/lyte-command-center: web` — NOT STARTED
8. `artifacts/mockup-sandbox: web` — NOT STARTED
9. `artifacts/pulse: web` — NOT STARTED
10. `artifacts/sentra: web` — NOT STARTED
11. `artifacts/szl-demo-video: web` — NOT STARTED
12. `artifacts/szl-holdings-mobile: expo` — NOT STARTED
13. `artifacts/szl-holdings: web` — NOT STARTED
14. `artifacts/terra: web` — NOT STARTED
15. `artifacts/vessels: web` — NOT STARTED
16. `lyte-metrics-store-test` — NOT STARTED
17. `lyte-metrics-store: service` — NOT STARTED
18. `shared-proxy` — NOT STARTED

**Audit Status: VERIFIED**

---

### 7. Hardcoded Credentials in `.replit`

Phase A secrets scan used `gitleaks` on `.ts/.tsx/.js/.jsx` files only and did not scan `.replit`. This audit scanned `.replit` directly and found:

| Variable | Section | Type | Risk |
|----------|---------|------|------|
| `SUBSTRATE_SIGNING_KEY` | `[userenv.shared]` | 256-bit hex key (64 chars) | HIGH |
| `ALLOY_INTERNAL_TOKEN` | `[userenv.development]` | Service token (`dev-` prefix) | MEDIUM |
| `CORS_ORIGINS` | `[userenv.production]` | Config value (non-sensitive) | None |

**Audit Status: VERIFIED** — values confirmed by direct inspection of `.replit`

---

### 8. RBAC Role System

**Two parallel systems found:**

```sh
# platformRole enum values in lib/db/src/schema/auth.ts:
grep -A 20 "platformRole" lib/db/src/schema/auth.ts | grep "'" | head -20
# → 12 values (exact values documented in audit/auth-flow-matrix.md)

# rolesTable entries:
grep -r "rolesTable" lib/db/src/schema/ --include="*.ts" | wc -l
# → Present; 4 roles expected in rolesTable
```

`PLATFORM_CANONICAL.md` claims 7 role names (`super_admin`, `exec`, `ops`, `compliance`, `maintenance`, `analyst`, `viewer`) — none of these match the actual schema enum values.

**Audit Status: PARTIALLY VERIFIED** — enum presence confirmed; exact rolesTable rows require running DB

---

## Summary Table

| Metric | Canonical Value | Command | Audit Status |
|--------|----------------|---------|--------------|
| pgTable definitions | **915** | `grep -r "pgTable(" lib/db/src/schema/ --include="*.ts" \| wc -l` | VERIFIED |
| Schema files | **165** | `find lib/db/src/schema -name "*.ts" \| wc -l` | VERIFIED |
| Route files (.ts) | **382** | `find artifacts/api-server/src/routes -name "*.ts" \| wc -l` | VERIFIED |
| Route groups (top-level) | **268** | `ls artifacts/api-server/src/routes/ \| wc -l` | VERIFIED |
| Package directories | **81** | `find packages -maxdepth 1 -mindepth 1 -type d \| wc -l` | VERIFIED |
| Lib directories | **41** | `find lib -maxdepth 1 -mindepth 1 -type d \| wc -l` | VERIFIED |
| Total packages | **122** | 81 + 41 | VERIFIED |
| `.replit [[artifacts]]` entries | **2** | `grep -c "^\[\[artifacts\]\]" .replit` | VERIFIED |
| Workspace-registered artifacts | **15** | Platform registry | VERIFIED |
| Workflows configured | **18** | System log | VERIFIED |
| Workflows running | **0** | System log | VERIFIED |
| `grep "pgTable"` line count | **1,078** | `grep -r "pgTable" lib/db/src/schema/ --include="*.ts" \| wc -l` | VERIFIED (not the canonical table count) |
