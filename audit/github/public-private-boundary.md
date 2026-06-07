# Public / Private Boundary — SZL Holdings GitHub

**Produced:** Phase D, April 2026  
**Scope:** All content visible or potentially visible on the public GitHub surface for `szl-holdings` org and affiliated accounts.

---

## Principle

The public surface exists to communicate credibility to a technical Series A investor — not to expose implementation details, financial assumptions, or competitive intelligence. The default is private; everything that goes public must earn its place.

---

## Currently Public Repos

| Repo | Visibility | Status | Recommendation |
|------|-----------|--------|----------------|
| `szl-holdings/szl-holdings-platform` | Public | Active, primary platform mono repo | **Keep public** — main trust signal for technical investors |
| `szl-holdings/.github` | Public | Org profile README | **Keep public** — org landing page; must stay current |

---

## What Stays Public

### `szl-holdings-platform` (main mono repo)
- `README.md` — platform overview, architecture diagram, product table, trust section, getting-started
- `architecture.md`, `PLATFORM_PRIMITIVES.md` — system design docs, no sensitive detail
- `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `LICENSE.md` — community and legal hygiene
- `KNOWN-GAPS.md` — honest debt disclosure; earns trust from technical reviewers
- `.github/workflows/` — CI, CodeQL, security workflows; demonstrates engineering maturity
- `.github/dependabot.yml` — automated dependency hygiene signal
- `docs/trust/` — trust center, proof-and-policy model
- `docs/platform-facts.md` — authoritative metrics (generated; verifiable)
- `packages/` public API surface — shared config, platform registry, feature flags (no secrets)
- `assets/readme/` — curated screenshots for README
- `scripts/` — build and seed utilities (no credentials, no internal runbooks)

### `szl-holdings/.github` (org profile)
- `profile/README.md` — org landing page; must match platform README claims exactly

---

## What Must Stay Private (or Be Moved Private)

| Content | Current Location | Risk | Action |
|---------|-----------------|------|--------|
| Investor financial models / cap table | `docs/investor/` (on-disk, not pushed) | Confidential financial data | Never push to public; keep local or in private repo |
| Customer-specific data models and configs | `ops/` internal runbooks referencing customer env | Customer confidentiality | Keep out of public surface |
| API credentials, tokens, connection strings | Any `.env*`, secrets matrix | Security | Already in `.gitignore`; verify no historical leaks |
| Unreleased product roadmap specifics | Internal planning docs | Competitive exposure | Keep in private channel or investor-only repo |
| Internal pricing logic and margin assumptions | Financial planning docs | Confidentiality | Never push to public |
| EAS build secrets, App Store credentials | `ops/mobile/eas-and-store-secrets-matrix.md` | Security | This file is a reference doc only — verify no live secrets are embedded |
| Internal incident post-mortems | `ops/` runbooks | Operational privacy | Strip customer-identifying detail before any public exposure |
| `demo-assets/szl-holdings-investor-carousel.pdf` | `demo-assets/` | Investor materials may contain non-public metrics | Move to private channel; remove from public repo if present |

---

## Boundary Rules

1. **No credentials** in any public file — enforced by `.gitignore`, secret scanning, and push protection.
2. **No customer names or data** in public files — reference domain verticals generically.
3. **No financial specifics** (ARR targets, cap table, runway) in public README or docs — link to investor-only docs via private channel.
4. **Archived artifacts on disk** (`artifacts/firestorm/`, `artifacts/imperium/`, `artifacts/lyte-command-center/`) are in the public repo but clearly labeled archived — acceptable; do not expose implementation details that reference unreleased capabilities as active.
5. **`docs/investor/`** — the `platform-thesis.md` is linked from README. Review before each public push to ensure no financial assumptions are embedded.
6. **`ops/`** — all ops docs are public in this repo. Review each file to confirm no customer-specific secrets or pricing data appear.

---

## Recommended Private Repo (Not Yet Existing)

A `szl-holdings/investor-materials` private repo should be created to house:
- Cap table and financial models
- NDA-gated investor decks
- Term sheet drafts
- Detailed customer reference cases

The public README may link to an investor-facing summary; the full materials remain gated.
