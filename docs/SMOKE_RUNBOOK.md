# Smoke Test Runbook

This runbook covers the post-deploy smoke testing system for the SZL Holdings
platform portfolio. Smoke tests run automatically after every production
release and can also be triggered manually against any live URL.

---

## What the smoke tests check

For every registered artifact the runner asserts:

| Assertion | Detail |
|-----------|--------|
| **HTTP 200** | The main route returns a successful response |
| **Title match** | `document.title` contains the configured substring |
| **Time budget** | Navigation completes within `timeBudgetMs` (default 8 s) |
| **No console errors** | Zero `console.error` / `pageerror` events during page load |
| **Body markers** _(optional)_ | Configured visible text strings appear in the rendered page |

The API server is checked separately — `GET /api/health` must return 200 within 5 s.

---

## Running smoke tests manually

### Against the live production deployment

```bash
SMOKE_BASE_URL=https://your-app.replit.app \
  pnpm exec playwright test tests/e2e/post-deploy-smoke.spec.ts
```

### Against a local dev server

```bash
# Start the local server first, then:
SMOKE_BASE_URL=http://localhost:80 \
  pnpm exec playwright test tests/e2e/post-deploy-smoke.spec.ts
```

### Smoke a single artifact

```bash
SMOKE_BASE_URL=https://your-app.replit.app \
  pnpm exec playwright test tests/e2e/post-deploy-smoke.spec.ts \
  --grep "Sentra"
```

The `--grep` value matches the artifact `name` field in
`tools/smoke/artifact-smoke.config.ts`.

### View the HTML report after a run

```bash
pnpm exec playwright show-report playwright-report/
```

---

## GitHub Actions integration

The workflow is defined in `.github/workflows/post-deploy-smoke.yml`.

| Trigger | Behaviour |
|---------|-----------|
| `workflow_run` (Deploy — Production succeeds) | Smoke tests run automatically against the URL from the `PRODUCTION_BASE_URL` secret |
| `workflow_dispatch` | Runs against the URL supplied via the `base_url` input (falls back to `PRODUCTION_BASE_URL`) |

### Required secrets / environment variables

| Secret | Scope | Description |
|--------|-------|-------------|
| `PRODUCTION_BASE_URL` | `production` environment | Root URL of the deployed app, e.g. `https://your-app.replit.app` |
| `SLACK_WEBHOOK_URL` | `production` environment (optional) | Incoming webhook for failure alerts |

Configure secrets in **Settings → Environments → production**.

### Reading results

Each artifact runs as a separate matrix job. A failed matrix job means that
specific artifact's smoke failed. The unified **Smoke Gate** job summarises
the full portfolio result.

Playwright HTML reports are uploaded as workflow artifacts named
`smoke-report-<artifact>` (retained 14 days).  
Traces for failing tests are in `smoke-traces-<artifact>` (retained 7 days).

---

## Adding a new artifact

1. **Add an entry** to `tools/smoke/artifact-smoke.config.ts`:

   ```typescript
   {
     name: 'My New App — Short Label',
     path: '/my-new-app/',           // URL path on the deployed host
     titleContains: 'My New App',    // Substring of the HTML <title>
     timeBudgetMs: 8000,             // 8 s is a sensible default
     // bodyMarkers: ['Welcome to My New App'],  // optional extra assertions
   }
   ```

2. **Add a matrix entry** to `.github/workflows/post-deploy-smoke.yml`
   inside the `strategy.matrix.include` list:

   ```yaml
   - artifact: my-new-app
     grep: "My New App"
   ```

3. **Verify locally** with:

   ```bash
   SMOKE_BASE_URL=http://localhost:80 \
     pnpm exec playwright test tests/e2e/post-deploy-smoke.spec.ts \
     --grep "My New App"
   ```

4. Open a PR. The smoke check will gate the next production release
   automatically.

---

## Triaging a failure

### Step 1 — Identify the failing artifact

Look at the GitHub Actions matrix view. Each row corresponds to one artifact.
A red row names the artifact; click it to read the Playwright output.

### Step 2 — Download the HTML report

From the failed run page click **Artifacts → smoke-report-\<artifact\>**.
Open `playwright-report/index.html` to see the full trace, screenshot, and
assertion details.

### Step 3 — Common causes and fixes

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| HTTP status ≠ 200 | App is not serving / crashed on boot | Check deploy logs; rollback if needed |
| Title mismatch | `<title>` tag changed in the artifact | Update `titleContains` in the config |
| Time budget exceeded | Cold start / slow DB query on first render | Optimise server startup; warm up caches; raise budget if justified |
| Console errors | JS exception in the app | Fix the underlying error; check the trace video for context |
| Body marker not found | Text was renamed or gated behind auth | Update `bodyMarkers` or remove if no longer accurate |

### Step 4 — Rerun after a fix

Trigger a manual rerun from the failed workflow page, or dispatch
`post-deploy-smoke` with the `base_url` input pointing at the fixed deployment.

---

## Out of scope

- **Full user-journey E2E tests** — see the per-artifact spec files under
  `tests/e2e/`.
- **Synthetic monitoring from multiple regions** — not covered here.
- **Mobile app smoke tests** — `szl-holdings-mobile` and `szl-demo-video` are
  not web-served artifacts and are therefore not included in this runner.
