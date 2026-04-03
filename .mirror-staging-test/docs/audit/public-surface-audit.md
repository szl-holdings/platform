# Public Surface Audit

## Audit Date
April 2026

## Workspace Structure

### Flagship Platform App
- **Location**: `/artifacts/szl-holdings/` (SZL Holdings parent site + Alloy execution fabric)
- **Secondary**: `/artifacts/lyte-command-center/` (Lyte operational dashboard)
- **Status**: Both operational and serving

### Marketing / Public Surface
- SZL Holdings landing page with Lyte + Alloy wedge narrative
- Trust center, investor story, design partners, solutions pages
- Developer documentation portal at `/developers`

### Investor / Trust / Docs Surface
- `/docs/trust/` — trust center, security posture, deployment model
- `/docs/investor/` — platform thesis, product readiness, why now
- `/docs/architecture/` — system overview, platform map, data flow
- `/docs/reports/` — operationalization reports, acceptance criteria

### Directories Unsuitable for Public Mirror
| Directory | Reason | Action |
|-----------|--------|--------|
| `.archive/` | Internal archived code | Exclude |
| `.git-rewrite/` | Git history rewrite artifacts | Exclude |
| `backups/` | Database backups with sensitive data | Exclude |
| `exports/` | Raw export artifacts | Exclude |
| `test-results/` | CI/test output | Exclude |
| `attached_assets/` | Chat-attached files | Exclude |
| `social-content/` | Draft social media content | Exclude |
| `spfx-webparts/` | SharePoint web parts (internal) | Exclude |
| `.local/` | Agent workspace files | Exclude |
| `.canvas/` | Canvas board assets | Exclude |
| `node_modules/` | Dependencies | Exclude |

### Duplicated / Noisy Root Files
- `PUBLIC_RELEASE_NOTES.md` — redundant with `/docs/releases/`
- `PUBLIC_REPO_AUDIT_REPORT.md` — superseded by this audit
- `ECOSYSTEM_ROADMAP.md` — redundant with `/docs/architecture/platform-map.md`
- `ROADMAP.md` — redundant with releases

## Canonicalization Decisions

### Canonical Flagship Public Repo
**Name**: `szl-holdings-platform`
**Content**: Curated subset — apps, packages, docs, infra (sanitized), architecture visuals, trust docs, screenshots

### Profile README Repo
**Name**: `stephenlutar2-hash` (GitHub username repo)
**Content**: Founder-grade profile README with platform links

### Private-Only Content
- Database backups, seeds with real data
- Environment configurations and secrets
- Internal agent scratch files
- Git rewrite history
- SharePoint web parts
- Raw test results
