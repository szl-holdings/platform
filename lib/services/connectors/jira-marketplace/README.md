# @szl/jira-marketplace

Atlassian Forge app that bridges Jira Cloud with the SZL Holdings Alloy platform
(workflows, PRISM signals, issue panels, and run-completion comments).

This package runs inside Atlassian's Forge sandbox and **cannot** depend on the
workspace `@szl-holdings/env` package. Instead, configuration is validated at
module load by `src/env.ts`.

## Required environment variables

| Variable              | Required | Description                                                                 |
| --------------------- | -------- | --------------------------------------------------------------------------- |
| `SZL_INTERNAL_TOKEN`  | yes      | Internal token sent as `x-internal-token` to the SZL API. Min 16 chars.     |
| `SZL_API_BASE`        | no       | Base URL of the SZL API. Defaults to `https://api.szlholdings.com`. Must be a valid `http(s)` URL. |

If either variable is missing or malformed, the Forge function fails to load
with a clear `[jira-marketplace] Invalid configuration: ...` error instead of
silently issuing requests that return opaque 401s in production.

Set these via the Forge CLI before deploying:

```bash
forge variables set --encrypt SZL_INTERNAL_TOKEN "<token>"
forge variables set SZL_API_BASE "https://api.szlholdings.com"
```

## Scripts

- `pnpm validate` — validate `manifest.yml`
- `pnpm bundle` — bundle the Forge app for upload
