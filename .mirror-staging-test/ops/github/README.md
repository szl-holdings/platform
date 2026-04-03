# SZL Holdings — GitHub Operations

This directory contains documentation, scripts, and configuration for managing the `szl-holdings-platform` GitHub repository and the `stephenlutar2-hash` GitHub profile.

---

## Directory Contents

| File | Purpose |
|------|---------|
| `README.md` | This file — overview and navigation |
| `manual-checklist.md` | Step-by-step manual instructions for all GitHub operations |
| `commands.sh` | Shell commands for GitHub CLI operations |
| `commands.ps1` | PowerShell equivalents for Windows environments |
| `repo-settings.json` | Canonical repository settings reference |
| `profile-values.md` | Recommended GitHub profile field values |

---

## Primary Operations

### Repository Setup / Update

Apply canonical settings to `szl-holdings-platform`:
- Description, topics, homepage URL
- Branch protection rules
- Issue and PR settings

See `manual-checklist.md` for step-by-step instructions.

### Profile Update

Apply recommended profile settings to `stephenlutar2-hash` account:

See `profile-values.md` for exact field values.

### Release Creation

Create a new GitHub Release for a version tag:

See `commands.sh` for the GitHub CLI command.

### Label Bootstrapping

Create the canonical set of issue labels for the repository:

See `commands.sh` for the full label creation commands.

---

## GitHub CLI vs Manual

Most operations in this directory can be performed either via the GitHub CLI (`gh`) or manually through the GitHub web interface.

**GitHub CLI** (`gh auth login` required):
- Faster for scripted operations
- Required for API-based operations
- See `commands.sh` for all CLI commands

**GitHub Web Interface**:
- No authentication setup required
- Slower but accessible from any browser
- See `manual-checklist.md` for step-by-step web instructions

---

## Authentication

To use GitHub CLI:
```bash
gh auth login
# Follow the prompts — authenticate with your GitHub account
gh auth status  # Verify authentication
```

GitHub API automation is available if auth is configured. Otherwise, all operations are documented as manual steps in `manual-checklist.md`.
