# SZL Holdings — README Standard

**Date:** April 2026  
**Status:** Canonical  
**Applies to:** All public repos in `szl-holdings` org and `stephenlutar2-hash` personal account

---

## Principle

A README is the first thing a technical evaluator reads after the repo name and description. It must answer — within 30 seconds — what this repo is, whether it's active, who owns it, and where to go next. READMEs that leave these questions open are credibility risks.

Every README must be honest about status. A cleanly-labeled archived repo is more credible than a repo that pretends to be active. Never use placeholder text in a public README.

---

## Required Sections — All Public Repos

Every public repo README must include these sections, in this order:

### 1. Navigation Bar (top of file)

```markdown
→ [Demo](https://szlholdings.com) | [Trust & Security](./SECURITY.md) | [Architecture](./docs/architecture/) | [Docs](./docs/)
```

Adapt links to what exists in the repo. Do not include links that go nowhere.

### 2. Title + One-Liner

```markdown
# [Repo/Product Name]

**[One sentence: what it is and what it does.]**
```

Example: `**Full platform ecosystem for business observability, AI orchestration, and secure operational intelligence.**`

### 3. Status Badge Line

```markdown
![Status](https://img.shields.io/badge/status-active-brightgreen)
![License](https://img.shields.io/badge/license-proprietary-red)
```

Status values: `active`, `stable`, `archived`, `pre-release`

### 4. How It Fits the Architecture

For repos that are part of the SZL Holdings ecosystem:

```markdown
## Platform Context

This repository is part of the SZL Holdings platform ecosystem. It sits in the [layer description] layer, serving [purpose].

→ [Platform overview](https://github.com/szl-holdings/szl-holdings-platform)
```

### 5. What This Repo Contains

Concise section listing key directories and their purpose.

### 6. Current Status

Explicit statement of the repo's current state:

```markdown
## Status

**Active development.** Built on [tech]. Last significant update: [month year]. Actively maintained.
```

Or for archived repos, use the archived annotation template (see below).

### 7. How to Run / Find Docs

Minimal instructions for running locally or finding documentation. Do not write novels here — link to docs.

### 8. Live Demo

```markdown
## Live Demo

→ [szlholdings.com](https://szlholdings.com)
```

Include specific product demo URL if applicable.

### 9. Trust & Security

```markdown
## Security

See [SECURITY.md](./SECURITY.md) for the vulnerability disclosure policy and supported versions.
```

### 10. Access & Contribution

```markdown
## Contribution & Access

This repository is a public mirror of the SZL Holdings platform workspace. Direct contributions are not accepted at this time. 

For enterprise evaluation, design partner conversations, or technical review access: inquiries@szlholdings.com
```

Or adapt for repos that do accept contributions.

---

## Flagship README — Premium Standard

The `szl-holdings-platform` README must exceed the baseline. Required sections:

### Hero Section

```markdown
# SZL Holdings Platform

→ [Live Demo](https://szlholdings.com) | [Security](./SECURITY.md) | [Architecture](./docs/architecture/system-overview.md) | [Investor Docs](./docs/investor/) | [Trust Center](./docs/trust/)

**Enterprise platforms for business observability, AI orchestration, and secure operational intelligence.**

16 deployable artifacts. 120+ database tables. TypeScript everywhere. One platform, four verticals, compounding infrastructure.
```

### Platform Hierarchy

```markdown
## Platform Architecture

| Layer | Product | Purpose |
|-------|---------|---------|
| **Observability** | Lyte | Surfaces risk, drift, and execution friction (PRISM framework) |
| **Execution** | Alloy | Signal normalization, workflow routing, approval gates, audit trail |
| **Verticals** | Aegis | Security & defense intelligence command |
| | Vessels | Maritime fleet command & intelligence |
| | Terra | Real estate portfolio intelligence |
| | Carlota Jo | Premium advisory & client operations |
| **Corporate** | SZL Holdings | Corporate identity and investor surface |
```

### Product Map

Full table of all 16 artifacts with type, tech stack, and live link.

### Architecture Summary

Brief (5–10 line) summary of the technical architecture. Link to `docs/architecture/system-overview.md` for detail.

### Trust & Docs Links

Explicit links to trust center, security docs, investor docs, architecture docs.

### Public-Safe Roadmap Summary

2–3 bullet points on current development focus. No internal timelines, no sensitive roadmap items.

### Demo Path

```markdown
## Evaluation Path

1. **Live platform:** [szlholdings.com](https://szlholdings.com)
2. **Architecture:** [System Overview](./docs/architecture/system-overview.md)
3. **Trust surface:** [Trust Center](./docs/trust/)
4. **Investor materials:** [Platform Thesis](./docs/investor/platform-thesis.md)
5. **Enterprise evaluation:** inquiries@szlholdings.com
```

---

## Archived Repo Annotation Template

For any repo that is archived:

```markdown
# [Original Repo Name]

> **ARCHIVED** — This repository is no longer actively maintained.
>
> **Why archived:** [Brief reason — e.g., "Superseded by szl-holdings-platform monorepo."]  
> **Current version:** [Link to current repo if it moved]  
> **Archived:** [Month Year]  
> **Access:** Contact inquiries@szlholdings.com for historical context

---

[Original README content below, preserved for reference]
```

---

## Mirror / Not Live Source Note

For any repo that is a mirror or not the primary development source:

```markdown
> **Note:** This repository is a curated public mirror. The source of truth is the live development workspace. 
> All active development happens there first. This mirror is updated on major milestones.
```

---

## What Not to Include

- Placeholder sections ("Coming soon", "TODO", "Add content here")
- Personal apologies for missing content
- Internal roadmap specifics or timelines
- Financial data or projections
- Real credentials, tokens, or connection strings
- Redundant badges that add no information
- ASCII art or excessive decorative elements
- Walls of text that bury the key information

---

## Rollout Tracking — Applied READMEs

Track which repos have had the standard applied. Update this table whenever a repo's README is brought to standard.

### szl-holdings-platform (Flagship) — Rollout Complete

| Section | Applied | Notes |
|---------|---------|-------|
| Navigation bar (top of file) | ✅ Applied | Demo → Security → Architecture → Investor Docs → Trust Center |
| Status badges | ✅ Applied | `active` + `proprietary` |
| One-liner headline | ✅ Exists | Platform tagline in opening paragraph |
| Platform context | ✅ Exists | Full platform ecosystem section |
| What the repo contains | ✅ Exists | Platform Ecosystem, Products sections |
| Current status | ✅ Exists | Deployment & Operations section |
| How to run / find docs | ✅ Exists | Documentation Map section |
| Live demo link | ✅ Exists | Contact section with szlholdings.com |
| Trust & security | ✅ Exists | Trust section + SECURITY.md link |
| Access & contribution | ✅ Exists | Public Mirror Notice section |
| Mirror notice | ✅ Applied | Public Mirror Notice |

### SECURITY.md — Navigation Bar Applied

| Section | Applied | Notes |
|---------|---------|-------|
| Navigation bar | ✅ Applied | Platform Repo → Architecture → Trust → Contact |

### CONTRIBUTING.md — Navigation Bar Applied

| Section | Applied | Notes |
|---------|---------|-------|
| Navigation bar | ✅ Applied | Platform Repo → Security → Architecture → Contact |

### Repos Pending Standardization (Create When Ready)

| Repo | Status | Action |
|------|--------|--------|
| `szl-holdings/szl-docs` | ⬜ Repo doesn't exist | Apply standard on creation |
| `szl-holdings/szl-design-system` | ⬜ Repo doesn't exist | Apply standard on creation |
| `szl-holdings/szl-infra` | ⬜ Repo doesn't exist | Apply standard on creation |
| Archive repos (any found in account audit) | ⬜ Audit at execution | Apply archived annotation template |
