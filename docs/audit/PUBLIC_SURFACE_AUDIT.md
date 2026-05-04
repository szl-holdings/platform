# Public Surface Audit

> growth capital readiness audit · April 2026

Evaluation of everything visible to an investor, evaluator, or security researcher who accesses the public GitHub repository.

---

## 1. Repository Profile

| Signal | Status | Notes |
|--------|--------|-------|
| Repository description | ✅ Set | "Governed decision infrastructure — connecting what is observable to what is executable, with full attribution." |
| Repository topics | ✅ Set | monorepo, react, typescript, postgresql, vite, ai-governance, decision-intelligence, enterprise |
| Homepage URL | ✅ Set | szlholdings.com |
| Social preview image | ⚠️ Verify in GitHub UI | Should be set to a premium hero image |
| Org profile (`README.md`) | ✅ Present | Professional, well-structured |
| License badge | ✅ Present | UNLICENSED / Proprietary |

---

## 2. README Assessment

### Main `README.md`

| Section | Status | Quality |
|---------|--------|---------|
| Badge row (CI, CodeQL, Security, License, TypeScript, pnpm, PostgreSQL) | ✅ | Professional |
| Category statement / value prop | ✅ | Clear and credible |
| Trust section | ✅ | Structurally addresses AI governance concern |
| What We Build | ✅ | Signal-to-action chain is compelling |
| Product Portfolio | ✅ | Honest with archived/deferred status |
| Architecture diagram (ASCII) | ✅ | Clean hierarchy |
| Platform primitives table | ✅ | Differentiating |
| Repository Map | ✅ | Clear |
| Build / Run / Contribute | ✅ | Functional quickstart |
| Governance, Security, Contact | ✅ | Professional |
| Documentation index | ✅ | Comprehensive |
| Screenshots section | ⚠️ | References `assets/readme/products/` — validate images are current |

### Org Profile `README.md` (`.github/profile/README.md`)

| Section | Status | Quality |
|---------|--------|---------|
| Header / value prop | ✅ | Clear |
| CI/CodeQL/Security badges | ✅ | Live status |
| Stack badges | ✅ | Professional |
| Platform overview diagram | ✅ | Informative |
| Differentiation | ✅ | Honest |
| Six primitives | ✅ | Credible |
| Trust / governance | ✅ | Strong |
| Links to investor docs | ✅ | Present |

**Inflated language check:** No unsubstantiated superlatives found. Claims reference actual architecture (RBAC, Proof Chain, Covenant Policy). API endpoint count (2,816) and table count (798) reference auto-generated metrics. Recommend owners verify these counts remain current via `pnpm metrics:validate` before next investor review.

---

## 3. GitHub-Native Trust Signals

| Signal | Status |
|--------|--------|
| `SECURITY.md` | ✅ Present — responsible disclosure policy |
| `CODE_OF_CONDUCT.md` | ✅ Present — Contributor Covenant |
| `CONTRIBUTING.md` | ✅ Present — proprietary framing appropriate |
| `SUPPORT.md` | ✅ Created this pass |
| `CODEOWNERS` | ✅ Present |
| Issue templates (bug, feature, security) | ✅ Present |
| PR template | ✅ Present — comprehensive checklist |
| Dependabot config | ✅ Present — grouped, weekly |
| CodeQL | ✅ Present — security analysis workflow |
| Secret scanning (gitignore pattern) | ✅ Present in `.gitleaks.toml` |
| Branch protection documentation | ✅ Present in `.github/BRANCH_PROTECTION.md` |

---

## 4. CI/CD Visibility

The CI badge row in the README links to live GitHub Actions. An investor can see:
- Whether CI is currently passing
- Whether CodeQL security analysis is green
- Whether the security audit is passing

**This is a strong positive signal for investor trust.**

---

## 5. Public Content Risk Assessment

| Risk | Status | Notes |
|------|--------|-------|
| Secrets in tracked files | ✅ Low | `.env.example` uses placeholder values; `.gitleaks.toml` present; CI secret-scan gate active |
| Internal URLs in tracked files | ✅ Low | No internal hostnames found in README or public docs |
| Sensitive business data | ✅ Low | Demo data only; no real customer data committed |
| Proprietary algorithms in public repo | ✅ Mitigated | Platform primitives are described architecturally; implementation is in private layers |
| PII in commit history | ✅ Low | No indication found; GitHub secret scanning enabled |
| Over-promising / inflated claims | ✅ Low | Claims tied to documented architecture |

---

*Generated: April 21, 2026 — growth capital GitHub Rehaul*
