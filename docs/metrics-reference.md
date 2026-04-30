# SZL Holdings — Platform Metrics Reference

**Single source of truth for all public-facing platform metrics.**

Update this file whenever a structural change affects a tracked metric. All other documentation files (README.md, .github/profile/README.md, SECURITY.md, investor docs) must draw from this reference.

---

## How Metrics Are Measured

| Metric | How to Count |
|--------|-------------|
| Database tables | `grep -rE "^export const \w+ = pgTable\(" lib/db/src/schema/ --include="*.ts" \| wc -l` |
| Shared packages | `ls lib/ \| wc -l` |
| API routes | `grep -rE "^\s*router\.(get\|post\|put\|patch\|delete)\(" artifacts/api-server/src/ --include="*.ts" \| wc -l` |
| Registered artifacts | Count entries in `artifact.toml` files under `artifacts/` |
| Schema files | `find lib/db/src/schema -name "*.ts" \| wc -l` |

---

## Canonical Metrics (April 2026)

| Metric | Value | Notes |
|--------|-------|-------|
| **Registered artifacts** | 14 | 11 web, 1 mobile, 1 video, 1 design |
| **Web applications** | 11 | aegis, api-server, carlota-jo, command, counsel, lyte-command-center, pulse, sentra, szl-holdings, terra, vessels |
| **Mobile applications** | 1 | szl-holdings-mobile (Expo / React Native — iOS + Android) |
| **Database tables** | 798 | pgTable definitions across 170 schema files, org-scoped |
| **Shared TypeScript packages** | 40 | In `lib/` monorepo |
| **API routes** | 2,816 | Measured from api-server route definitions |
| **Domain verticals** | 8 | Aegis, Sentra, Vessels, Terra, Counsel, Carlota Jo, Lyte, Alloy |
| **Platform primitives** | 6 | Outcome Graph, Proof Chain, Covenant Policy, Monte Carlo, Workflow Engine, Event Fabric |
| **RBAC roles** | 11 | anonymous_visitor through pilot_customer_user |
| **Schema files** | 170 | Under `lib/db/src/schema/` |

---

## Files That Reference These Metrics

| File | Metrics Used | Last Synced |
|------|-------------|-------------|
| `.github/profile/README.md` | artifacts, tables, API routes, packages, domain packs | April 2026 |
| `SECURITY.md` | API routes, RBAC roles | April 2026 |
| `docs/investor/platform-thesis.md` | artifacts, tables, schema files, packages, RBAC roles, primitives | April 2026 (updated) |
| `docs/investor/product-readiness.md` | No numeric metrics — readiness labels only | April 2026 |
| `README.md` | RBAC roles | April 2026 |

---

## Change Log

| Date | Changed Metric | Old Value | New Value | Reason |
|------|---------------|-----------|-----------|--------|
| April 2026 | Database tables | 644 / 685 | 798 | Measured from actual pgTable definitions |
| April 2026 | Shared packages | 37 / 51 | 40 | Measured from lib/ directory |
| April 2026 | API routes | 2,331 | 2,816 | Measured from api-server route definitions |
| April 2026 | Registered artifacts | 22 / 15 | 11 | Measured from registered artifact.toml files |
| April 2026 | Schema files | 112 | 131 | Measured from lib/db/src/schema/ |
| April 2026 | Registered artifacts | 11 | 14 | Added counsel, lyte-command-center, sentra to registered set; web apps updated from 8 to 11 |
| April 2026 | Domain packs | Aegis, Vessels, Terra, PRISM Counsel, Carlota Jo, IMPERIUM | Aegis, Sentra, Vessels, Terra, Counsel, Carlota Jo | IMPERIUM not registered; Sentra added; PRISM Counsel renamed to Counsel |
