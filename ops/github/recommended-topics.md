# Recommended GitHub Topics — SZL Holdings Platform

GitHub Topics improve discoverability and signal the platform's category, technology, and market positioning to technical reviewers.

---

## Recommended Topics

Apply these topics to the `szl-holdings-platform` repository on GitHub:

```
szl-holdings
lyte
alloy
business-observability
ai-orchestration
secure-operations
enterprise-platform
typescript
react
azure
vessels
```

---

## Topic Classification & Rationale

### Brand Topics

| Topic | Rationale |
|-------|-----------|
| `szl-holdings` | Company brand. Creates a discovery path for anyone searching SZL Holdings on GitHub. |
| `lyte` | Flagship product name. Investors and technical reviewers evaluating the platform will search for it. |
| `alloy` | Core execution fabric. Searchable by name for partners and technical evaluators. |
| `vessels` | Domain pack with the most distinctive name — maritime intelligence buyers and researchers may search this term. |

### Technical Topics

| Topic | Rationale |
|-------|-----------|
| `typescript` | The language of the entire codebase. Standard GitHub topic for TypeScript monorepos. Signals code quality discipline. |
| `react` | Frontend stack. Searchable by technical reviewers assessing the UI layer. |
| `azure` | Production infrastructure target. Enterprise buyers evaluating Azure-native vendors will find this. |

### Market / Category Topics

| Topic | Rationale |
|-------|-----------|
| `business-observability` | The primary product category for Lyte. Emerging category — early topic ownership has search value. |
| `ai-orchestration` | Positions Alloy and the AI governance layer accurately. Increasingly searched as enterprise AI adoption grows. |
| `secure-operations` | Positions Aegis and the security domain. Relevant for MSSP, SOC, and enterprise security buyers. |
| `enterprise-platform` | Signals the target buyer profile. Differentiates from consumer tools and hobby projects. |

---

## Topics to Avoid

| Topic | Reason to Avoid |
|-------|----------------|
| `open-source` | Incorrect — this is a proprietary public mirror |
| `saas` | Premature — not yet commercially deployed |
| `startup` | Undermines enterprise positioning |
| `ai` (generic) | Too broad; no search signal value |
| `dashboard` | Too generic; does not position the product |

---

## Topic Count

GitHub allows up to 20 topics. 11 topics is appropriate for this repository — enough for meaningful discoverability without dilution.

---

## Automation

See `scripts/github/update-topics.ts` for automated topic update via the GitHub API.

For manual application:
1. Go to the repository on GitHub
2. Click the gear icon next to "About"
3. Add topics one at a time in the Topics field
4. Save

See `ops/github/repo-branding-manual-steps.md` for the full manual workflow.
