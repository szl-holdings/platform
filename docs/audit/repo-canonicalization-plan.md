# SZL Holdings — Repository Canonicalization Plan

**Date:** April 2026  
**Status:** Canonical

---

## 1. Canonical Repository Declaration

### Primary Public Mirror

| Field | Value |
|-------|-------|
| **Repo** | `stephenlutar2-hash/szl-holdings-platform` |
| **Branch** | `master` |
| **Visibility** | Public |
| **Purpose** | Curated public mirror of the live Replit workspace |
| **Source of truth** | Replit workspace (this repo) |

This is the single authoritative GitHub repository for the SZL Holdings platform. All other repositories should either be designated as supporting repos (profile README) or archived.

### GitHub Profile README Repo

| Field | Value |
|-------|-------|
| **Repo** | `stephenlutar2-hash/stephenlutar2-hash` |
| **Branch** | `main` |
| **Visibility** | Public |
| **Purpose** | GitHub profile README — founder identity and navigation |

---

## 2. Repository Configuration Standards

### szl-holdings-platform (Flagship)

**Description (GitHub):**  
`Platform ecosystem for business observability, AI orchestration, maritime intelligence, and secure execution — built by Stephen Lutar.`

**Topics/Labels (GitHub):**  
`typescript`, `react`, `nodejs`, `postgresql`, `drizzle-orm`, `expo`, `monorepo`, `pnpm`, `azure`, `ai-orchestration`, `business-observability`, `maritime-intelligence`, `saas`

**Homepage:**  
`https://szlholdings.com`

**Settings:**
- Issues: enabled (for enterprise evaluators to raise questions)
- Projects: disabled (internal project management stays internal)
- Wiki: disabled (documentation is in `/docs/`)
- Discussions: disabled (not appropriate for this repo type)
- Packages: disabled

---

## 3. Private vs. Mirrored Decision Matrix

### Always Mirrored

| Content | Rationale |
|---------|-----------|
| `artifacts/*/src/` | Core product demonstration material |
| `lib/` | Shared infrastructure — proves architectural maturity |
| `infra/` | IaC templates — demonstrates enterprise deployment readiness |
| `docs/` (curated) | Trust, architecture, investor docs — the reason for a public mirror |
| `.github/workflows/` | CI/CD discipline — visible to technical evaluators |
| `packages/` | Marketplace integrations — external credibility |
| `README.md` | Primary entry point for all evaluators |
| `CHANGELOG.md` | Release history — demonstrates active development discipline |
| `SECURITY.md` | Trust signal for enterprise buyers |
| `CONTRIBUTING.md` | Engineering culture signal |
| `LICENSE.md` | Proprietary notice — legal clarity |

### Always Private (Never Mirrored)

| Content | Rationale |
|---------|-----------|
| `.local/` | Replit agent workspace — not for external eyes |
| `.env` files | Secret material — would be a security incident |
| `attached_assets/` | Raw user payload dumps — not curated |
| Cap table | Investor data room only |
| Financial projections | Investor data room only |
| Internal sprint/triage docs | Would undermine investor-grade presentation |
| Detailed internal roadmap specifics | Competitive sensitivity |
| PGPASSWORD, SESSION_SECRET values | Secret material |

---

## 4. Branch Strategy

```
master (primary, always clean)
  └── single published branch
  └── never publish feature branches or work-in-progress
  └── all branching/merging in Replit workspace

No secondary branches are published.
No draft/WIP branches exposed publicly.
```

---

## 5. Release Tagging Strategy

```
v0.1.0 — Initial public platform release (Q1 2026)
v0.2.0 — Revenue activation (Stripe billing live)
v1.0.0 — First commercial deployment
```

See `/docs/releases/release-strategy.md` for the full versioning policy.

---

## 6. Update Cadence

The mirror is updated:
1. After significant feature milestones (new platform, major capability)
2. Before investor, partner, or enterprise evaluation sessions
3. After every investor-grade hardening task
4. At the founder's discretion for trust and credibility events

---

## 7. Manual Actions Required

The following GitHub settings must be applied manually (no API auth available):

- [ ] Set repository description to the canonical text above
- [ ] Add all listed topics/labels
- [ ] Set homepage URL to `https://szlholdings.com`
- [ ] Create profile README repo if not yet created
- [ ] Push `/profile-readme/README.md` content to profile repo
- [ ] Apply branch protection rules to `master`
- [ ] Create `v0.1.0` release tag

See `/ops/github/manual-checklist.md` for full step-by-step instructions.
