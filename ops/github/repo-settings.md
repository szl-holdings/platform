# Repository Settings Guide

Generated: 2026-04-15

## Manual Steps (GitHub Web UI)

### 1. Branch Protection (Settings > Branches)
1. Click "Add branch protection rule"
2. Branch name pattern: `main`
3. Enable:
   - Require a pull request before merging
   - Required approvals: 1
   - Require status checks to pass: `ci / lint`, `ci / typecheck`, `ci / build-web`, `ci / test-api`
   - Require conversation resolution before merging
   - Include administrators
4. Save changes

### 2. Merge Settings (Settings > General)
1. Under "Pull Requests":
   - Allow squash merging: Yes
   - Allow merge commits: No (optional)
   - Allow rebase merging: No (optional)
   - Always suggest updating PR branches: Yes
   - Automatically delete head branches: Yes

### 3. Environments (Settings > Environments)
1. Create "staging":
   - No protection rules needed
   - Add secrets: REPLIT_DEPLOY_TOKEN, REPLIT_APP_ID
2. Create "production":
   - Required reviewers: 1 (add yourself)
   - Wait timer: 0 minutes
   - Add secrets: REPLIT_DEPLOY_TOKEN, REPLIT_APP_ID

### 4. Security Settings (Settings > Code security and analysis)
1. Enable Dependabot alerts
2. Enable Dependabot security updates
3. Enable secret scanning
4. Enable push protection (prevents secrets in commits)
5. Enable CodeQL analysis (already configured via workflow)

### 5. Organization Profile
1. Go to github.com/szl-holdings
2. Click "Customize your organization's profile"
3. Content is in `.github/profile/README.md`
4. Pin repositories: szl-holdings-platform, .github

### 6. Social Preview
1. Go to repo Settings > General
2. Under "Social preview", click "Edit"
3. Upload image from `docs/media/social-preview/`
