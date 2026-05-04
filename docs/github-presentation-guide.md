# GitHub Presentation Guide — SZL Holdings Platform

> Manual steps for the founder to complete in the GitHub UI.
> Last updated: 2026-05-04

---

## Status of Automated Steps (Already Completed)

| Step | Status | Details |
|------|--------|---------|
| Feature branch pushed | Done | `release/github-alignment-2026-05` — full workspace sync |
| Pull request opened | Done | PR #92 against `master` |
| Repository description | Done | Updated via API to reflect current platform scope |
| Repository topics | Done | 20 topics set (enterprise-ai, agentic-ai, ai-governance, etc.) |
| Website URL | Done | Points to https://szlholdings.com |
| Secret scan | Done | No API keys, tokens, or credentials in tracked files |
| `ops/security/rotate-now.md` | Done | Documents all historically-exposed secrets with rotation instructions |

---

## Manual Steps Required

### 1. Merge the Pull Request

**URL:** https://github.com/szl-holdings/szl-holdings-platform/pull/92

Review the PR and merge when satisfied. Use **"Create a merge commit"** (not squash) to preserve the full commit history for investor due diligence.

---

### 2. Upload Social Preview Image

GitHub does not support social preview upload via the REST API. This must be done manually.

1. Go to **Settings** → scroll to **Social preview**
2. Click **Edit** → **Upload an image**
3. Use the file at `docs/media/social-preview/repo-social-preview.png` (1280×640, optimized for GitHub's OG card format)
4. Alternatively, use `docs/media/social-preview/org-social-preview-source.jpg` for a higher-resolution source
5. Click **Save**

**Why this matters:** When an investor clicks a GitHub link shared on LinkedIn, Slack, or email, the social preview image is the first thing they see. A branded, professional image replaces GitHub's generic code preview.

---

### 3. Pin the Repository on the Org Profile

1. Go to https://github.com/szl-holdings
2. Click **Customize your pins**
3. Select `szl-holdings-platform` and pin it
4. This ensures the platform repo is the first thing visible on the org page

---

### 4. Set Up the Org Profile README (Optional)

Create a `.github` repository under the `szl-holdings` organization to display a profile README:

1. Create a new repository: https://github.com/organizations/szl-holdings/repositories/new
2. Name it `.github`
3. Add a `profile/README.md` file with a brief description of SZL Holdings
4. Suggested content:

```markdown
## SZL Holdings

**Governed AI decision infrastructure for high-consequence enterprise operations.**

Signal detection → AI recommendation → human approval → cryptographic proof — across cybersecurity, real estate, maritime, legal, defense, and advisory verticals.

- [Platform Repository](https://github.com/szl-holdings/szl-holdings-platform)
- [Website](https://szlholdings.com)
- [Contact](mailto:inquiries@szlholdings.com)
```

---

### 5. Configure Branch Protection Rules

Requires repository admin access:

1. Go to **Settings** → **Branches** → **Add branch protection rule**
2. Branch name pattern: `master`
3. Recommended settings:
   - **Require a pull request before merging** — enforces code review
   - **Require status checks to pass before merging** — select CI, CodeQL, and Security checks once they run
   - **Require conversation resolution before merging**
   - **Do not allow bypassing the above settings** (even for admins) — demonstrates governance maturity to investors
4. Click **Save changes**

**Investor signal:** Branch protection rules visible in the repo demonstrate engineering discipline. Investors reviewing the repo can see that the team follows a structured development process.

---

### 6. Repository Visibility Decision

The repository is currently **public**. Consider:

| Visibility | Investor Impact | Trade-off |
|------------|----------------|-----------|
| **Public** | Investors can browse code, architecture, and commit history directly. Demonstrates transparency and engineering maturity. | Competitors can see implementation details. |
| **Private** | Code is protected. Share access selectively during due diligence. | Requires granting collaborator access to each investor. |

**Recommendation:** Keep public for now. The proprietary license (`LICENSE.md`) protects against unauthorized use. Public repos signal confidence and reduce friction for investor evaluation. Switch to private only if a specific competitive concern arises.

---

### 7. Enable GitHub Discussions (Optional)

1. Go to **Settings** → **Features** → check **Discussions**
2. This provides a public Q&A surface for potential partners and evaluators
3. Only enable if you plan to monitor and respond to discussions

---

### 8. Verify README Rendering

After merging the PR, visit https://github.com/szl-holdings/szl-holdings-platform and verify:

- [ ] Screenshots render correctly (images in `.github/assets/screenshots/`)
- [ ] Badge links (CI, CodeQL, Security) point to valid workflow URLs
- [ ] All internal document links resolve (`SECURITY.md`, `CONTRIBUTING.md`, `LICENSE.md`, etc.)
- [ ] The narrative reads well for a first-time visitor
- [ ] Contact information is current

---

## Repository Metadata Reference

These were set via the GitHub API and can be modified in **Settings** → **General**:

**Description:**
> Governed AI decision infrastructure for high-consequence enterprise operations. Signal detection → AI recommendation → human approval → cryptographic proof — across cybersecurity, real estate, maritime, legal, defense, and advisory verticals. TypeScript monorepo, 14 artifacts, React + Express + PostgreSQL.

**Topics (20):**
enterprise-ai, agentic-ai, ai-governance, workflow-automation, human-in-the-loop, typescript, react, postgresql, pnpm-monorepo, decision-intelligence, proof-chain, cybersecurity, real-estate-tech, maritime-tech, govtech, vite, express, drizzle-orm, multi-tenant, audit-trail

**Website:** https://szlholdings.com

---

## What Investors See

When an investor receives a GitHub link, here is what they evaluate (in order):

1. **Social preview card** — the OG image shown in Slack/LinkedIn/email (Step 2)
2. **README.md** — the landing page; should communicate product, scale, and maturity in 30 seconds
3. **Repository metadata** — description, topics, and star count signal legitimacy
4. **Commit history** — regular, well-named commits demonstrate active development
5. **CI badges** — green badges signal a working build pipeline
6. **File organization** — clean directory structure signals engineering discipline
7. **Documentation depth** — comprehensive docs signal a serious platform, not a prototype
8. **License** — proprietary license is appropriate for pre-revenue enterprise software
9. **Security policy** — `SECURITY.md` with responsible disclosure demonstrates maturity
10. **Contributing guide** — even for proprietary software, this signals structured development

All of these are in place for the SZL Holdings platform repository.
