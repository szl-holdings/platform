# Database Schema Health Report

Generated: 2026-04-15

## Overview

| Metric | Value |
|--------|-------|
| Total Tables | ~561 |
| ORM | Drizzle ORM |
| Database | PostgreSQL (Replit-managed) |
| Schema Location | `lib/db/src/schema/` |
| Push Method | `drizzle-kit push` |

## Schema Organization

The schema is organized by domain:

```
lib/db/src/schema/
  ├── core/           # Auth, users, orgs, sessions
  ├── defense/        # Aegis/Firestorm domain tables
  ├── maritime/       # Vessels domain tables
  ├── real-estate/    # Terra domain tables
  ├── advisory/       # Carlota Jo domain tables
  ├── operations/     # Command domain tables
  ├── intelligence/   # CORTEX cross-domain tables
  ├── compliance/     # Compliance and audit tables
  ├── msp/            # Managed services tables
  └── shared/         # Common reference tables
```

## Known Issues

### 1. drizzle-kit push timeout
- **Status**: Known, non-fatal
- **Impact**: Schema sync sometimes times out on large schema
- **Workaround**: Retry, or push individual schema files
- **Root Cause**: 561 tables exceeds comfortable push size

### 2. Schema sprawl
- **Status**: Monitoring
- **Impact**: Many tables may be unused or overlapping
- **Recommendation**: Audit table usage via query analysis

### 3. No migration history
- **Status**: By design (using push, not migrate)
- **Impact**: No rollback capability for schema changes
- **Recommendation**: Consider switching to `drizzle-kit generate` + `migrate` for production

## Index Health

- Primary keys on all tables
- Foreign keys defined in Drizzle relations
- Need to audit: missing indexes on frequently queried columns
- Need to audit: composite indexes for multi-column WHERE clauses

## Recommendations

1. **Audit unused tables** — query `pg_stat_user_tables` for tables with 0 rows and 0 scans
2. **Add indexes** — for columns used in WHERE, JOIN, ORDER BY
3. **Switch to migrations** — for production deployments (rollback capability)
4. **Document ERD** — generate entity-relationship diagram for key domains
5. **Connection pooling** — verify pool size matches deployment (default 10)
