# SZL Holdings — Jira Marketplace Forge Security Review Checklist

## 1. Forge App Sandboxing

| Control | Status | Notes |
|---------|--------|-------|
| Runs in Forge sandbox | PASS | All handlers use `@forge/api`; no external Node.js runtime |
| No `egress` beyond declared domains | PASS | Single egress rule: `api.szlholdings.com` |
| No `unsafe-eval` | PASS | No dynamic code execution |
| Custom UI uses `@forge/bridge` only | PASS | All parent↔iframe comms via `invoke()` |
| Manifest `permissions.scopes` minimal | PASS | `read:jira-work`, `write:jira-work` (required for run-completion comment), `read:jira-user` |

## 2. Authentication & Authorization

| Control | Status | Notes |
|---------|--------|-------|
| `requestConfluence`/`requestJira` used for all API calls | PASS | Never raw fetch to Atlassian API |
| `useProductContext()` for issue/project context | PASS | `trigger-workflow.ts` uses product context |
| No hardcoded credentials | PASS | SZL API key stored in `forge variables set` |
| User identity verified server-side | PASS | `context.accountId` used for audit |
| Installation-level auth | PASS | `FORGE_APP_INSTALL_TOKEN` env var not exposed to browser |

## 3. Data Handling

| Control | Status | Notes |
|---------|--------|-------|
| No PII stored beyond session | PASS | Only `issueKey`, `projectKey`, `cloudId` logged |
| User data not shared with third parties | PASS | Only SZL API receives data; no other egress |
| Egress payload minimized | PASS | Only identifiers sent; no field values |
| Response data not persisted | PASS | Run results displayed in UI; not stored in Forge storage |

## 4. Manifest Compliance

| Control | Status | Notes |
|---------|--------|-------|
| `app.runtime.name` is `nodejs18.x` | PASS | Forge LTS runtime (declared in manifest.yml) |
| All modules declared | PASS | 5 modules: jira:issuePanel, jira:issueAction × 2, trigger, webhook |
| `connect.authentication` not used | PASS | Pure Forge (no Connect hybrid) |
| `forge-manifest.yml` version is current | PASS | Manifest version 1 (2024 format) |

## 5. Marketplace Submission

- [ ] Run `forge lint` — resolve all warnings
- [ ] Run `forge deploy --environment production`
- [ ] Complete Data Privacy section in Partner Portal
- [ ] Provide EULA URL in listing
- [ ] Confirm support contact email in listing
- [ ] Pass Atlassian security review (typically 5–10 business days)
