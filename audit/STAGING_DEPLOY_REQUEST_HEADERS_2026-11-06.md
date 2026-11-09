# Staging deployment request headers

- Workcell: `STAGING-REQUEST-HEADERS-20261106`
- Recorded at: 2026-11-06 UTC
- Base: `d3e5178743e139a547e6b79ec6beb52deda49e10`
- Failed run: https://github.com/szl-holdings/platform/actions/runs/42134629935
- Evidence class: MEASURED Actions log plus unauthenticated contract probes; provider acceptance BLOCKED
- Proof level: source/workflow only; no UI surface changed

## Diagnosis

Job `Deploy to Staging` on push of `d3e5178743e139a547e6b79ec6beb52deda49e10`
(`chore(deps): bump oauthlib` via merged #1032) passed checkout, deploy info,
and "Verify staging configuration", then failed "Trigger staging deployment"
at 2026-11-06T00:08:44Z with:

```text
Replit staging API returned HTTP 403; request rejected or acceptance unverified
```

Both environment secrets were nonempty: the verify step exits before any
request when either value is empty, and the trigger log masks
`REPLIT_APP_ID` and `REPLIT_DEPLOY_TOKEN`. The `staging` environment has an
empty `protection_rules` list, so this was not an environment approval gate.
The workflow triggers on push to `main`/`master` and ignores only
`replit-sync/**`. This commit is outside that path, so the trigger was correct.
Permissions remain `contents: read`. The script sends one POST and fails on
any non-2xx. It discards the response body.

An unauthenticated POST to
`https://replit.com/api/v1/repls/diagnostic-nonexistent/deployments`, with no
repository secret, reproduced HTTP 403 `Expected X-Requested-With header`.
`X-Requested-With: XMLHttpRequest` alone then returned HTTP 403
`Expected referrer, referer, or origin header`. That header plus
`Origin: https://replit.com` and a dummy bearer returned HTTP 401
`{"message":"repl-identity-token-invalid"}` for an empty body. A foreign Origin
stayed HTTP 403 `Invalid referrer`. The same POST without
`X-Requested-With` stayed on the first 403 even when Origin and Referer were
present.

The Actions 403 is therefore the provider's browser-contract gate. It is
evaluated before the bearer. It does not show that the configured token is
expired, missing, or unauthorized. The route is real: a dummy bearer is
parsed as a repl identity token once the headers are present.

## Patch

`.github/workflows/deploy-staging.yml` adds two headers to the existing single
POST:

- `X-Requested-With: XMLHttpRequest`
- `Origin: https://replit.com`

URL, method, secret names, empty-body request, timeouts, fail-closed status
handling, permissions, environment, and trigger are unchanged. The offline
contract test now requires those headers in the curl argument list.

No secret was read, printed, created, or rotated. No deployment was claimed.
Hosted acceptance of the configured identity token remains BLOCKED until a
later push to `main` observes HTTP 2xx. Runtime readiness stays UNKNOWN.

## Checks

`python3 -B -m unittest discover -s scripts/ci -p test_staging_deployment.py -v`

Screenshots, route checks, and `pnpm typecheck`: NOT RUN. No UI, route, or
TypeScript changed. The workspace Node is v22; the repo engine asks for Node
24, and the known typecheck baseline already fails before this patch.
