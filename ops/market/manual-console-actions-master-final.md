# Manual Console Actions — Master Final

**Last updated:** April 2026  
**Purpose:** Complete list of manual actions that cannot be automated — required for Apple, Google, Expo, Replit, and GitHub operations.

---

## Overview

Some operational actions cannot be scripted. They require manual navigation through external consoles. This document is the master reference for those actions — what they are, where to do them, and when.

---

## Apple App Store Connect / Developer Portal

### One-Time Setup (Do Once Per App)

| Action | Where | Steps |
|---|---|---|
| Register App ID | developer.apple.com → Certificates, Identifiers & Profiles → Identifiers | Click "+", select "App IDs", enter `com.szlholdings.executive.mobile`, enable required capabilities (Push Notifications, Associated Domains if needed) |
| Create App in App Store Connect | appstoreconnect.apple.com → My Apps → "+" | Platform: iOS, Name: [App Name], Bundle ID: select from list, note the 10-digit ASC App ID |
| Add internal testers to TestFlight | App Store Connect → TestFlight → Internal Testing → [Group] → "+" | Enter Apple ID email, no review required |
| Set test notes in TestFlight | App Store Connect → TestFlight → [Build] → Test Information | Enter test account info (from password manager — do not hardcode) and testing instructions |

### Per-Release Actions (Every Production Build)

| Action | Where | When |
|---|---|---|
| Submit for App Store Review | App Store Connect → App → [Version] → Submit for Review | After screenshots, privacy details, and description are complete |
| Complete App Privacy Details | App Store Connect → App → Privacy → App Privacy | Before first App Store submission; update if data collection changes |
| Manage distribution certificates | developer.apple.com → Certificates | Renew before expiry; EAS handles this automatically if using managed credentials |

### Certificate and Profile Management

EAS managed credentials handle most certificate operations automatically. Manual intervention is needed if:
- Certificate is revoked and EAS cannot auto-renew
- Adding a new device to a distribution profile (for internal development builds)
- Revoking a compromised key

---

## Google Play Console

### One-Time Setup

| Action | Where | Steps |
|---|---|---|
| Create app | play.google.com/console → Create app | App name, default language, type: App, free |
| Complete mandatory store listing | Play Console → [App] → Main store listing | Title, short description, full description, category, contact details |
| Link Google Cloud project | Play Console → Setup → API access | Link to Google Cloud project, create service account |
| Create service account | Google Cloud Console → IAM → Service Accounts | Create account, grant Release Manager role, download JSON key |
| Set up internal testing track | Play Console → [App] → Testing → Internal testing | Complete before uploading first build |

### Per-Release Actions

| Action | Where | When |
|---|---|---|
| Upload AAB | Play Console → [App] → Testing → [Track] → Create release | Or use EAS submit — but manual upload is the fallback |
| Promote from internal to closed beta | Play Console → [App] → Testing → Internal → Promote | After internal validation |
| Promote from beta to production | Play Console → [App] → Production → Create release | After beta validation and any Play review |
| Roll out to percentage | Play Console → Production → [Release] → Rollout percentage | Start at 10–20%, watch crash rate, expand |

---

## Expo / EAS Console

### One-Time Setup

| Action | Where | Steps |
|---|---|---|
| Create Expo account | expo.dev | Register with work email |
| Link project to Expo | Terminal in `artifacts/szl-holdings-mobile` | `eas init` — generates EAS project ID, sets in app.json |
| Set EAS secrets | Terminal | `eas secret:create --name SENTRY_DSN --value <dsn>` |
| Configure managed credentials | Terminal | `eas credentials` — follow interactive setup |

### Per-Build Actions

| Action | Command | Notes |
|---|---|---|
| Build iOS preview | `eas build --profile preview --platform ios` | From `artifacts/szl-holdings-mobile/` |
| Build Android production | `eas build --profile production --platform android` | Outputs .aab |
| Submit iOS to TestFlight | `eas submit --profile production --platform ios --latest` | Requires ASC credentials configured |
| Submit Android to Play | `eas submit --profile production --platform android --latest` | Requires service account JSON |
| Push OTA update | `eas update --channel production --message "Fix: [description]"` | JS-only changes |
| Rollback OTA | `eas update --channel production --rollback-to-embedded` | Reverts to embedded JS bundle |

### EAS Secrets That Must Be Set Before First Build

| Secret | How to Set |
|---|---|
| `EXPO_TOKEN` | `eas secret:create --name EXPO_TOKEN --value <token>` |
| `SENTRY_DSN` | `eas secret:create --name SENTRY_DSN --value <dsn>` (when Sentry configured) |

Apple and Google credentials are managed through EAS managed credentials — not as EAS secrets.

---

## Replit Console

### Deployment Management

| Action | Where | Steps |
|---|---|---|
| Deploy an artifact | Replit → [Workspace] → Deploy | Select artifact, configure deployment type, deploy |
| Roll back to previous deployment | Replit → [Deployment] → Deployment history | Select previous version, redeploy |
| Set production secrets | Replit → Secrets panel | Add key + value; these are available as env vars in deployments |
| Configure custom domain | Replit → [Deployment] → Settings → Custom domain | Enter domain, configure DNS CNAME as instructed |
| View deployment logs | Replit → [Deployment] → Logs | Pino-formatted JSON logs |

### Secrets Management

All secrets must be set via Replit Secrets panel — never in source code.

| Secret Type | When to Update |
|---|---|
| `SESSION_SECRET` | Rotate every 90 days (mark calendar) |
| `FIELD_ENCRYPTION_KEY` | Rotate every 90 days (mark calendar) |
| `ALLOY_INTERNAL_TOKEN` | Rotate every 90 days; rotate immediately if suspected exposure |
| `OAUTH_STATE_SECRET` | Generate fresh value; add to Replit Secrets |
| `VAPID_PRIVATE_KEY` | Rotate when push notification key pair is regenerated |
| AI provider keys | Rotate every 180 days |
| Stripe keys | Rotate if compromised; otherwise keep stable |

Secret rotation procedure:
1. Generate new value (use `openssl rand -hex 32` for symmetric keys)
2. Set new value in Replit Secrets
3. Restart affected workflows
4. Verify health endpoints pass

---

## GitHub Actions / Repository Management

| Action | Where | Steps |
|---|---|---|
| Set repository secrets | GitHub → [Repo] → Settings → Secrets and variables → Actions | Add secret name + value |
| Create GitHub release | GitHub → [Repo] → Releases → Draft new release | Tag, title, notes from `docs/releases/v{X}.{Y}.{Z}.md` |
| Manage branch protection | GitHub → [Repo] → Settings → Branches | Require PR review before merge, require status checks |
| Invite collaborator | GitHub → [Repo] → Settings → Collaborators | Add GitHub username, select role |
| Review Actions run | GitHub → [Repo] → Actions | See CI run results, download logs |

### GitHub Secrets That Must Be Set for CI

| Secret | Purpose | Set When |
|---|---|---|
| `REPLIT_STAGING_DEPLOY_TOKEN` | Staging auto-deploy from CI | When staging is configured |
| `REPLIT_STAGING_APP_ID` | Staging deployment target | When staging is configured |
| `REPLIT_PROD_DEPLOY_TOKEN` | Production deploy from CI | When production CI is configured |
| `REPLIT_PROD_APP_ID` | Production deployment target | When production CI is configured |
| `EXPO_TOKEN` | EAS builds from CI | When CI mobile builds are configured |

---

## Rotation and Maintenance Calendar

| Action | Frequency | Next Due |
|---|---|---|
| Rotate SESSION_SECRET | Every 90 days | Track from last rotation |
| Rotate FIELD_ENCRYPTION_KEY | Every 90 days | Track from last rotation |
| Rotate ALLOY_INTERNAL_TOKEN | Every 90 days | Track from last rotation |
| Rotate AI provider keys | Every 180 days | Track from last rotation |
| Renew Apple Developer membership | Annual | $99/year; 30-day advance notice from Apple |
| Renew EAS subscription | Per pricing tier | Monitor expo.dev billing |
| Review secret inventory | Quarterly | See `ops/security/secret-inventory.md` |

---

*See also: `ops/mobile/testflight-play-internal-runbook.md` (detailed mobile submission), `ops/replit/production-secret-checklist.md` (secrets checklist)*
