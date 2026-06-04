# SZL Holdings — Public Mirror Policy

**Version:** 2.0  
**Date:** April 2026  
**Authority:** Stephen Lutar, Founder

---

## Purpose

This document defines the curation rules, content boundaries, and operational discipline for the `szl-holdings-platform` GitHub repository — the public mirror of the live Replit workspace.

The public mirror exists to provide partners, investors, enterprise evaluators, and technical reviewers with a professional, curated, and always-buildable representation of the SZL Holdings platform ecosystem.

---

## Source of Truth Declaration

The authoritative source of the SZL Holdings codebase is the **live Replit development workspace**. All active development, feature work, integration, and architecture decisions happen there first.

The GitHub repository is a **downstream mirror** — not a development branch.

```
Replit Workspace  →  [curation gate]  →  GitHub: szl-holdings-platform (master)
(source of truth)                        (public mirror)
```

---

## What Is Published (Mirror-Safe Content)

### Source Code

| Path | Status | Notes |
|------|--------|-------|
| `artifacts/*/src/` | ✅ Published | All application source code |
| `lib/` | ✅ Published | Shared TypeScript libraries |
| `packages/` | ✅ Published | Salesforce AppExchange, Jira Connect packages |
| `infra/` | ✅ Published | Azure Bicep IaC templates |
| `scripts/` | ✅ Published | Build, seed, automation scripts |

### Documentation

| Path | Status | Notes |
|------|--------|-------|
| `docs/architecture/` | ✅ Published | System overview, platform map, data flow |
| `docs/trust/` | ✅ Published | Security posture, trust center, privacy boundaries |
| `docs/investor/` | ✅ Published | Platform thesis, product readiness, go-to-market |
| `docs/buyer/` | ✅ Published | Executive overview, solution brief, security summary |
| `docs/releases/` | ✅ Published | Release notes, versioning policy |
| `docs/public/` | ✅ Published | This policy and mirror governance docs |
| `docs/design/` | ✅ Published | Design system audit and tokens |
| `docs/audit/` | ✅ Published | Public surface audit and canonicalization plan |
| `docs/media/` | ✅ Published | Screenshots and architecture diagrams |
| `docs/screenshots/` | ✅ Published | Platform screenshots |

### Configuration & Standards

| Path | Status | Notes |
|------|--------|-------|
| `README.md` | ✅ Published | Primary entry point |
| `CHANGELOG.md` | ✅ Published | Version history |
| `SECURITY.md` | ✅ Published | Vulnerability disclosure |
| `CONTRIBUTING.md` | ✅ Published | Engineering standards |
| `LICENSE.md` | ✅ Published | Proprietary license notice |
| `CODEOWNERS` | ✅ Published | Code ownership declaration |
| `.github/` | ✅ Published | PR/issue templates, workflows, instructions |
| `.env.example` | ✅ Published | Sanitized environment variable template |

---

## What Is Excluded (Never Published)

### Absolute Exclusions

| Path | Reason |
|------|--------|
| `.env`, `.env.local`, `.env.*.local` | Secret material — would be a security incident |
| `.local/` | Replit agent workspace — internal tooling, task files |
| `attached_assets/` | Raw user payload dumps — not curated |
| `node_modules/` | Install via `pnpm install` |
| `dist/` | Build output — build via `pnpm -r build` |
| `.cache/` | Temporary build cache |

### Conditional Exclusions (Quarantine Protocol)

If any of the following are found, they must be quarantined (added to `.gitignore`) before a mirror push:

| Pattern | Category |
|---------|----------|
| `.archive/` | Historical/archived work |
| `backups/`, `exports/` | Internal backups |
| `temp/`, `tmp/`, `scratch/` | Temporary directories |
| `*.log` | Runtime log output |
| `*.bak`, `*.backup` | Backup files |
| `*.tar.gz`, `*.zip` (in repo root or docs) | Compressed archives |
| `NOTES.md`, `TODO.md` in root | Unpolished developer notes |
| Files containing real API keys, tokens, or secrets | Security risk — check with script |

### Document-Level Exclusions

| Document Type | Reason |
|---------------|--------|
| Cap table details | Investor data room only |
| Financial projections | Investor data room only |
| Internal sprint/QA reports | Triage docs — not investor-appropriate |
| Detailed execution sequencing | Competitive sensitivity |
| Implementation prioritization rationale | Internal |

---

## Curation Rules

### Rule 1: Clean Before Push

Run the mirror preparation and validation pipeline before any mirror push:

```bash
# Step 1: Generate surface inventory (workspace content classification)
# → writes docs/audit/public-surface-inventory.md
tsx scripts/public-mirror/report-public-surface.ts

# Step 2: Stage the mirror (apply inclusion/exclusion policy → .mirror-staging/)
tsx scripts/public-mirror/prepare-public-mirror.ts

# Step 3: Validate the staged mirror (pass/fail)
# → writes docs/audit/public-mirror-report.md
tsx scripts/public-mirror/validate-public-surface.ts .mirror-staging
```

**Important:** `report-public-surface.ts` writes the workspace inventory to `docs/audit/public-surface-inventory.md`. `validate-public-surface.ts` writes the validation result to `docs/audit/public-mirror-report.md`. These are separate files with distinct purposes — never overwrite one with the other.

The validation script flags:
- Excluded directories present in staging (`.archive`, `backups`, `social-content`, etc.)
- Secret/env file patterns (`.env`, `.env.*` — `.env.example` is explicitly allowed)
- Hardcoded credentials (API keys, tokens, passwords)
- Internal-only documents (`docs/internal/` at any path depth)
- Database dumps (`*.sql.gz`, `*.dump`, `*.pgdump`)
- Missing required trust files

**`.github/` inclusion note:** The `.github/` directory is included in the public mirror **except** `.github/instructions/` (Replit agent configuration — excluded by mirror scripts). The exclusion is enforced by `EXCLUDE_PATH_SEGMENTS` in `prepare-public-mirror.ts`.

### Rule 2: README Must Be Current

Before every mirror push, verify `README.md` reflects current platform state. Stale README is the primary credibility risk.

### Rule 3: No WIP Content

The master branch is always clean and buildable. Never publish draft, broken, or work-in-progress states.

### Rule 4: Data State Honesty

All platform screenshots and documentation must accurately represent the current state:
- Demo data is labeled as Demo
- Seeded data is labeled as Seeded/Pilot
- Live data connections are labeled as Live

### Rule 5: Explicit Over Vague

Every capability claimed in documentation must exist in the codebase. No aspirational features presented as current capabilities.

---

## Update Cadence

The mirror is updated when:

1. A significant feature milestone is reached (new platform capability, major workflow)
2. Before investor, partner, or enterprise evaluation sessions
3. After completion of investor-grade hardening tasks
4. When documentation substantially improves
5. At the founder's discretion

Minimum cadence: at least once per quarter while the platform is in active development.

---

## Mirror Push Checklist

Before every mirror push:

- [ ] Run `tsx scripts/public-mirror/report-public-surface.ts` — review surface inventory
- [ ] Run `tsx scripts/public-mirror/prepare-public-mirror.ts` — stage mirror
- [ ] Run `tsx scripts/public-mirror/validate-public-surface.ts .mirror-staging` — no errors
- [ ] Verify README.md is current and accurate
- [ ] Verify CHANGELOG.md has been updated
- [ ] Check `.env.example` is sanitized
- [ ] Confirm no `.env` files have been added
- [ ] Confirm no secrets in any committed files
- [ ] Verify `master` branch builds cleanly (`pnpm install && pnpm -r build`)
- [ ] Update screenshots if UI has changed significantly

---

## Contact

Mirror governance questions: inquiries@szlholdings.com  
Technical review access: available on request
