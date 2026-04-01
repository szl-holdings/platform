# SZL Holdings — Public Surface Audit

**Date:** April 2026  
**Author:** Stephen Lutar, Founder  
**Status:** Canonical

---

## 1. Canonical Flagship Repository

**Repository:** `stephenlutar2-hash/szl-holdings-platform`  
**Branch:** `master`  
**Purpose:** Public mirror of the Replit workspace — curated, enterprise-grade, always buildable.

This is the single authoritative public representation of the SZL Holdings platform. No other repositories should be considered canonical for the platform codebase.

---

## 2. GitHub Profile

**Username:** `stephenlutar2-hash`  
**Profile README repo:** `stephenlutar2-hash/stephenlutar2-hash` (standard GitHub profile README convention)  
**Purpose:** Founder identity, positioning, and navigation to flagship repo.

See `/profile-readme/README.md` for the ready-to-deploy profile README content.

---

## 3. Workspace Structure Assessment

### 3.1 Public-Safe Directories

| Directory | Status | Notes |
|-----------|--------|-------|
| `artifacts/` | ✅ Mirror-safe | All app source code — mirrored |
| `lib/` | ✅ Mirror-safe | Shared libraries — mirrored |
| `packages/` | ✅ Mirror-safe | Marketplace packages — mirrored |
| `infra/` | ✅ Mirror-safe | Azure Bicep IaC — mirrored |
| `docs/` | ✅ Mirror-safe | Documentation — mirrored (see exclusions) |
| `scripts/` | ✅ Mirror-safe | Build & utility scripts — mirrored |
| `social-content/` | ✅ Mirror-safe | Brand assets — mirrored |
| `.github/` | ✅ Mirror-safe | CI/CD, templates, instructions — mirrored |

### 3.2 Excluded Directories (Never Mirrored)

| Directory | Reason |
|-----------|--------|
| `.local/` | Replit agent workspace — internal tooling, task files, skills |
| `.cache/` | Temporary build cache — not source |
| `node_modules/` | Dependencies — install via `pnpm install` |
| `dist/` | Build outputs — build via `pnpm -r build` |
| `attached_assets/` | User-pasted payload dumps — internal only |
| `tmp/`, `temp/`, `scratch/` | Temporary files — excluded by .gitignore |
| `backups/`, `exports/` | Internal backups — not for public mirror |
| `.archive/` | Archived work — historical only, not representative |

### 3.3 Document-Level Exclusions

| Document | Reason |
|----------|--------|
| Internal sprint reports | QA and triage docs — not investor-appropriate |
| Cap table & financials | Data room only — qualified investors via direct request |
| Internal roadmap specifics | Execution sequencing is internal |
| Prioritization rationale | Implementation ordering is internal |

---

## 4. Noise Inventory

### 4.1 Identified Noisy Patterns

The following file/folder patterns are flagged as mirror-unsafe if found:

- `*.log` — Runtime log output
- `*.bak`, `*.backup` — Backup files
- `*.tar.gz`, `*.zip` — Compressed archives
- `scratch.*`, `temp.*`, `tmp.*` — Temporary work
- `NOTES.md`, `TODO.md` (if in root) — Internal developer notes
- `.env`, `.env.local`, `.env.*.local` — Secret material

### 4.2 Currently Detected State

As of this audit:
- No `.archive/` directory present ✅
- No `backups/` directory present ✅
- No `exports/` directory present ✅
- No `temp/` or `tmp/` directories present ✅
- No `scratch/` directory present ✅
- `.gitignore` covers all primary risk paths ✅
- `attached_assets/` excluded ✅
- `.local/` excluded ✅

---

## 5. Content Readiness Assessment

### 5.1 Platform Credibility Status

| Platform | Public-Ready | Notes |
|----------|-------------|-------|
| Lyte | ✅ | Full feature set, PRISM framework, seeded dashboards |
| Aegis | ✅ | SOC, command, and intelligence workspaces |
| Terra | ✅ | NYC distress pipeline, real data integration |
| Vessels | ✅ | Fleet command, AIS integration, voyage economics |
| Carlota Jo | ✅ | Web + mobile, advisory workflow |
| SZL Holdings | ✅ | Corporate site, investor relations, trust center |
| Stephen Site | ✅ | Founder authority and portfolio |
| Alloy | ✅ | Execution fabric — documented in architecture docs |

### 5.2 Documentation Completeness (Pre-Hardening)

| Doc | Status |
|-----|--------|
| Architecture | ✅ Exists — restructured to `/docs/architecture/` |
| Trust Center | ✅ Exists — expanded in `/docs/trust/` |
| Investor Narrative | ✅ Exists — expanded in `/docs/investor/` |
| Mirror Policy | ✅ Exists — consolidated in `/docs/public/` |
| Deployment | ✅ Exists — current |
| Production Readiness | ✅ Exists — detailed |

---

## 6. Conclusions

1. The workspace is substantially mirror-ready. Primary risk is documentation depth, not code hygiene.
2. The `.gitignore` adequately covers core exclusion categories. Minor additions recommended (see canonicalization plan).
3. No sensitive internal documents were found at mirror-accessible paths.
4. `szl-holdings-platform` is the correct canonical repo name — consistent with existing documentation.
5. Documentation restructure (phases 3–4) will significantly improve investor and technical reviewer experience.

---

*This audit was conducted as part of the 10-phase investor-grade hardening program, Q1 2026.*
