# SZL Holdings — Repository Role Map

**Version:** 1.0  
**Date:** April 2026  
**Authority:** Stephen Lutar, Founder

---

## Purpose

This document defines the role of every GitHub repository associated with the SZL Holdings organization and Stephen Lutar's personal GitHub profile. It establishes which repo is the flagship public mirror, which is the profile README, which are secondary/legacy, and what belongs in each visibility tier.

---

## 1. Canonical Repository Assignments

### 1.1 Flagship Public Repo

| Field | Value |
|-------|-------|
| **Repository** | `stephenlutar2-hash/szl-holdings-platform` |
| **Visibility** | Public |
| **Branch** | `master` |
| **Role** | Primary public mirror of the SZL Holdings platform monorepo |
| **Audience** | Investors, enterprise evaluators, technical reviewers, design partners |
| **Content** | Curated subset of the Replit workspace: apps, libraries, docs, infra, scripts |

**Why this repo is the flagship:**
- Contains the entire platform ecosystem in one coherent monorepo
- Demonstrates architectural maturity: shared libraries, shared schema, shared auth
- Shows the full signal-to-action pipeline: Lyte → Alloy → domain packs
- Embodies the investor thesis in code: one platform, multiple verticals, compounding infrastructure
- A single flagship repo is stronger than fragmented product repos

### 1.2 GitHub Profile README Repo

| Field | Value |
|-------|-------|
| **Repository** | `stephenlutar2-hash/stephenlutar2-hash` |
| **Visibility** | Public |
| **Branch** | `main` |
| **Role** | GitHub profile README — founder identity and platform navigation |
| **Audience** | GitHub visitors, technical community |
| **Content** | `profile-readme/README.md` from the workspace |

### 1.3 Source of Truth (Not a GitHub Repo)

| Field | Value |
|-------|-------|
| **Location** | Replit workspace |
| **Role** | Live development environment — source of truth for all content |
| **Relationship to GitHub** | GitHub is the downstream mirror; Replit is upstream |

---

## 2. Visibility Matrix

### Always Public (Flagship Repo Content)

| Content Path | Category | Rationale |
|--------------|----------|-----------|
| `artifacts/*/src/` | Application source | Core product demonstration |
| `lib/` | Shared libraries | Proves architectural maturity |
| `packages/` | Marketplace integrations | External credibility signal |
| `infra/` | Azure Bicep IaC | Enterprise deployment readiness |
| `scripts/public-mirror/` | Mirror tooling | Transparency and discipline signal |
| `scripts/github/` | GitHub automation | Operational maturity |
| `docs/architecture/` | Architecture docs | Technical evaluator trust |
| `docs/trust/` | Trust center | Enterprise buyer trust |
| `docs/investor/` | Investor docs | Investment evaluation material |
| `docs/buyer/` | Buyer docs | Enterprise sales enablement |
| `docs/releases/` | Release history | Active development proof |
| `docs/public/` | Mirror governance | Policy transparency |
| `docs/design/` | Design system | Product quality signal |
| `docs/media/` | Screenshots / diagrams | Visual credibility |
| `.github/` | GitHub templates | Engineering culture signal |
| `ops/github/` | GitHub operations | Process maturity |
| `README.md` | Entry point | Primary evaluator landing |
| `CHANGELOG.md` | Release history | Active development discipline |
| `SECURITY.md` | Security policy | Enterprise trust signal |
| `CONTRIBUTING.md` | Contribution standards | Engineering culture |
| `LICENSE.md` | Proprietary license | Legal clarity |
| `CODEOWNERS` | Code ownership | Governance signal |
| `profile-readme/` | Profile README package | Linked from profile repo |
| `.env.example` | Sanitized env template | Developer experience |

### Always Private (Never in Public Mirror)

| Content Path | Category | Why Never Public |
|--------------|----------|-----------------|
| `.env`, `.env.*`, `*.env` | Secrets | Would be a security incident |
| `.local/` | Agent workspace | Replit-internal state, task files |
| `attached_assets/` | Raw user uploads | Unsorted payload — not curated |
| `backups/` | Database backups | Contains sensitive SQL data |
| `exports/` | Raw export artifacts | Internal operational output |
| `test-results/` | CI test output | Operational noise |
| `social-content/` | Social media drafts | Not public-ready |
| `spfx-webparts/` | SharePoint web parts | Internal tooling |
| `.archive/` | Archived work | Historical cleanup artifacts |
| `.git-rewrite/` | History rewrite artifacts | Internal cleanup |
| `.cache/` | Build cache | Transient |
| `.canvas/`, `.cursor/` | Editor state | Development tooling |
| `node_modules/`, `dist/` | Build artifacts | Installed/built from source |
| `*.sql.gz`, `*.dump`, `*.pgdump` | Database dumps | Sensitive operational data |
| `docs/internal/` | Internal strategy | Not investor-appropriate |
| Cap table details | Investor data room | Data room only |
| Financial projections | Investor data room | Data room only |

### Conditionally Public (Audit Before Mirror Push)

| Content Path | Condition | Action |
|--------------|-----------|--------|
| `docs/reports/` | Review each file individually | Exclude internal-only reports |
| Root markdown files (`ROADMAP.md`, `ECOSYSTEM_ROADMAP.md`, etc.) | Redundant with curated docs | Quarantine from root; content preserved in `docs/` |
| `tests/` | Unit/integration tests | Include if clean; exclude test fixtures with sensitive data |
| `playwright.config.ts` | Test config | Include — demonstrates QA discipline |
| `vitest.config.ts` | Test config | Include — demonstrates QA discipline |

---

## 3. Legacy Repository Strategy

If any previously created GitHub repos exist under `stephenlutar2-hash` or related accounts:

| Repo Type | Disposition |
|-----------|-------------|
| Older platform mirrors | Archive on GitHub (Settings → Archive) |
| Experimental repos | Archive or set private |
| Duplicate product repos | Archive — flagship replaces them |
| Profile README repo | Maintain — update with current content |

**Archive procedure (GitHub UI):**
1. Navigate to repo → Settings
2. Scroll to "Danger Zone"
3. Select "Archive this repository"
4. Confirm — repo becomes read-only, links preserved

**Do not delete** old repos. Archiving preserves link stability and historical context.

---

## 4. Repo Count Summary

| Role | Repository | Visibility |
|------|-----------|------------|
| Flagship platform mirror | `szl-holdings-platform` | Public |
| Profile README | `stephenlutar2-hash` | Public |
| All others (if any) | Legacy | Archive / Private |

---

## 5. Review Cadence

This role map is reviewed:
- Before every public mirror push
- When the platform adds a new major product or vertical
- When the GitHub profile strategy changes

*Maintained by: Stephen Lutar, Founder — SZL Holdings*
