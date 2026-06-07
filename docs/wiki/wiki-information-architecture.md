# Wiki Information Architecture — SZL Holdings Platform

## Purpose

The GitHub Wiki serves as the extended knowledge layer for the SZL Holdings platform repository. It supplements the README and in-repo docs without duplicating them. The README is the entry point and executive overview. The Wiki is the operational reference.

## Audience Hierarchy

| Audience | Primary Need | Wiki Priority |
|----------|-------------|---------------|
| **Technical Reviewer** | Architecture depth, security model, deployment options | High |
| **Enterprise Buyer** | Use cases, trust posture, onboarding model | High |
| **Investor** | Platform thesis, differentiation, readiness, roadmap | High |
| **Developer/Partner** | Integration patterns, API surface, deployment reqs | Medium |
| **General Public** | Platform overview, who we are | Low |

## Structural Principles

1. **README first** — The README is the primary public-facing document. The Wiki extends it, never competes with it.
2. **Topic ownership** — Each wiki page owns one topic. No page tries to be a summary of everything.
3. **Scannable** — Headers at every major transition. Tables for comparisons. No walls of prose.
4. **Maintained by sync** — Wiki content originates in `docs/wiki/wiki-seed/` and is pushed via `scripts/wiki/`. Manual edits on GitHub are overwritten on next sync.
5. **No marketing copy** — Substantive claims only. Capabilities described accurately. No superlatives without evidence.

## Navigation Architecture

```
Wiki Home
├── Platform Overview
│   ├── Architecture
│   ├── Deployment Model
│   └── Security Posture
├── Trust & Compliance
│   └── Trust Center
├── Product Reference
│   ├── Buyer Use Cases
│   └── Screenshots & Demos
├── Investor Layer
│   └── Investor Overview
├── Project Reference
│   ├── Roadmap
│   ├── Glossary
│   └── FAQ
```

## Content Authority Matrix

| Topic | Primary Location | Wiki Role |
|-------|-----------------|-----------|
| Platform thesis | `docs/investor/platform-thesis.md` | Summary + link |
| Architecture overview | `docs/architecture/system-overview.md` | Summary + diagram ref |
| Security posture | `docs/trust/security-posture.md` | Extended detail |
| Trust center | `docs/trust/trust-center.md` | Extended detail |
| Deployment model | `docs/trust/deployment-model.md` | Summary + options |
| Use cases | `docs/buyer/use-cases.md` | Extended with scenarios |
| Roadmap | ROADMAP.md | Wiki mirrors sections |
| Glossary | Wiki-only | No in-repo equivalent |
| FAQ | Wiki-only | No in-repo equivalent |

## Sync Model

- Source of truth: `docs/wiki/wiki-seed/*.md` in the Replit workspace
- Push mechanism: `scripts/wiki/wiki-commit.sh`
- Frequency: After each significant release or documentation update
- Sidebar/Footer: Maintained alongside seed pages as `_Sidebar.md` and `_Footer.md`

## Page Naming Convention

GitHub Wiki pages use the filename as the page slug. Names must be:
- PascalCase or kebab-case (GitHub normalizes to kebab internally)
- Descriptive and standalone (no "Part 1", "Overview 2")
- Consistent with the page map defined in `wiki-page-map.md`
