# Demo Data Policy — SZL Holdings Platform

**Version:** 1.0  
**Date:** April 16, 2026  
**Authority:** Stephen Lutar, Founder  
**Related:** `docs/audit/mock-stub-placeholder-register.md`, `scripts/qa/check-demo-seed.js`

---

## Purpose

This policy governs all demo data, seeded data, mock data, and placeholder values used across the SZL Holdings platform. The goal is to ensure that demos are **trustworthy, repeatable, and clearly labeled** — and that no demo data can be mistaken for live production data by any internal or external audience.

---

## 1. Core Principles

### 1.1 Demos Must Be Trustworthy

Demo data must accurately represent what the product does. It must:
- Showcase real capabilities and real workflows
- Use plausible, realistic values (not obviously fake placeholder strings)
- Be consistent across all apps that reference shared entities (e.g., a vessel that appears in Vessels should also appear in Aegis threat feeds if applicable)
- Not claim false data is live unless it truly is live

### 1.2 Demos Must Be Clearly Labeled

Any data element that is seeded/simulated (not live) must be labeled in the UI. Acceptable labeling patterns:
- **"Demo"** badge on data cards or module headers
- **"Simulated"** annotation on charts that use generated data
- **"Live"** badge ONLY on data that is confirmed to come from a real external source

### 1.3 Demos Must Be Repeatable

Any authorized person must be able to run `pnpm seed` (or the equivalent seeding command) and arrive at a consistent, working demo state. Demo data must not depend on:
- External services that may be unavailable
- Manual database edits
- Local environment state that is not captured in seed scripts

### 1.4 Demo Data Must Never Include Real PII

Seeded demo data must not include:
- Real names of actual people (use synthetic names)
- Real addresses of real individuals
- Real financial account numbers
- Real email addresses of non-consenting individuals
- Real phone numbers of non-consenting individuals

Business entities used in demo data (company names, vessel names, property addresses) may be based on real public information where relevant for realism (e.g., a real port name).

---

## 2. Data Classification

| Class | Definition | Labeling Required |
|-------|-----------|------------------|
| **Live** | Pulled from a real external API or database in real-time | "Live" badge optional (implied by real-time nature) |
| **Seeded** | Loaded via seed scripts into the real DB; realistic values, not real | "Demo" badge required in UI |
| **Hardcoded** | Values baked into React components or route handlers | Must be replaced before first paid tenant |
| **Mocked endpoint** | API route returns fabricated data (no DB query) | Document in `docs/audit/mock-stub-placeholder-register.md` |
| **Stub integration** | External service call stubbed; no real API key used | Document in mock-stub register |
| **Placeholder UI** | Static "Coming soon" or empty-state panels | Acceptable — no special labeling needed |

---

## 3. Canonical Demo Data

### 3.1 Seeding Commands

```bash
# Full demo seed (all domains)
pnpm seed

# Domain-specific seeds
pnpm --filter @workspace/api-server run seed:demo
pnpm --filter @workspace/api-server run seed:agents
pnpm --filter @workspace/api-server run seed:vessels

# Verify demo seed is valid
node scripts/qa/check-demo-seed.js
```

### 3.2 Demo Credentials

Canonical demo credentials are documented in `DEMO.md` (not committed to public mirror). The standard demo setup includes:
- An `admin` user with full platform access
- A `viewer` user for read-only demonstrations
- Sample organizations with realistic portfolio data

**These credentials must be changed before any production tenant is onboarded.**

### 3.3 Current Seeded Data by Domain

Refer to `docs/audit/mock-stub-placeholder-register.md` for the full inventory. Summary:

| Domain | Seed Status | Live Data Sources |
|--------|------------|------------------|
| SZL Holdings / Lyte | Seeded | BLS unemployment, GitHub Trending, TechCrunch RSS, The Verge RSS |
| Aegis / Firestorm | Seeded | CISA KEV feed (live), CVE NVD feed (live) |
| Terra | Seeded | CoStar integration (live when key configured) |
| Vessels | Seeded | AIS feed (live when key configured) |
| Forge | Seeded | None (CRM is fully demo) |
| PRISM Counsel | Seeded | None (legal module is fully demo) |
| CORTEX | Seeded | None (agent OS is demo state) |
| Command Portal | Seeded | Aggregates from above |

---

## 4. Live Data Sources

The following data feeds are live (pulling from real external sources) when properly configured:

| Feed | Source | Config Required | Notes |
|------|--------|----------------|-------|
| BLS Unemployment | US Bureau of Labor Statistics | None (public API) | Always live |
| GitHub Trending | GitHub public scrape | None | Always live |
| TechCrunch RSS | TechCrunch RSS feed | None | Always live |
| The Verge RSS | The Verge RSS feed | None | Always live |
| CISA KEV | CISA Known Exploited Vulnerabilities | None (public API) | Always live |
| CVE NVD | NIST NVD API | `NVD_API_KEY` optional | Live with or without key |
| AIS Maritime | AIS provider | `AIS_API_KEY` | Live when key set; stubbed otherwise |
| CoStar | CoStar API | `COSTAR_API_KEY` | Live when key set; stubbed otherwise |

---

## 5. Rules for Updating Demo Data

### Adding new seeded demo data

1. Add to the appropriate seed script in `scripts/` or `artifacts/api-server/src/scripts/`
2. Ensure the data uses synthetic identifiers (no real UUIDs from production)
3. Update `docs/audit/mock-stub-placeholder-register.md` with the new entry
4. Test `pnpm seed` end-to-end on a clean database
5. Verify with `node scripts/qa/check-demo-seed.js`

### Transitioning from demo to live data

When a module transitions from seeded/hardcoded to live data:
1. Update `docs/audit/mock-stub-placeholder-register.md` — mark as "Live"
2. Remove the "Demo" UI badge for that module
3. Ensure the live data path has a graceful fallback if the external service is unavailable
4. Add the live data source to Section 4 of this document
5. Verify the live feed in staging before production deploy

### Removing demo data

Demo data for deprecated features must be removed from seed scripts to prevent confusion. When removing:
1. Update `docs/audit/mock-stub-placeholder-register.md`
2. Ensure seed scripts are idempotent after removal

---

## 6. Demo Data Hygiene

### Smoke test cleanup

When smoke tests create database records, they must clean them up. See the cleanup approach in `scripts/qa/`:
- Smoke tests that create records should use a test-namespaced identifier (e.g., org slug `smoke-test-*`)
- A post-smoke cleanup step removes all records with `smoke-test-*` identifiers
- See backlog task: "Keep smoke tests clean by automatically removing test records after each run"

### No production data in demo environments

- Production database contents must never be copied to staging or development
- Database backups must never be used to populate demo environments
- If realistic volume is needed for demos, generate it via seed scripts

---

## 7. Investor and Partner Demo Guidance

When running demos for investors or partners:

1. **Always start from a known seed state.** Run `pnpm seed` on a clean database before the demo.
2. **Label everything correctly.** Do not claim hardcoded or seeded data is live unless it is.
3. **Use the demo credentials from `DEMO.md`.** Do not use production credentials.
4. **Highlight the live feeds.** BLS, CISA KEV, RSS feeds, and configured API integrations are genuinely live — it's fine to say so.
5. **Do not modify demo data during a live demo** unless you can reset it afterward.

---

## Enforcement

The `check-demo-seed.js` script verifies:
- Seed scripts exist and are runnable
- Critical demo entities (orgs, users, vessels, properties) exist after seeding
- No obvious PII patterns in seeded data

This script should be run as part of pre-release verification.

---

*Version 1.0 — April 16, 2026. Update this document whenever demo data strategy changes or a major new module is added.*
