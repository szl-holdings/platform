# Runtime Modes — SZL Holdings Platform

**Status:** Authoritative  
**Date:** April 16, 2026  
**Owner:** Engineering  
**Implemented in:** `lib/config/src/runtime-mode.ts`

---

## Overview

The SZL Holdings platform operates across four runtime modes. Each mode governs a distinct execution context with explicit, machine-enforceable policies for authentication, data sourcing, connector behavior, billing, notifications, analytics, and error visibility.

The mode is resolved at startup from environment variables in this priority order:

1. `RUNTIME_MODE` — explicit override (must match a valid mode name)
2. `DEMO_MODE=true` or `ENABLE_DEMO_SEED=true` — forces `demo`
3. `APP_ENV` — maps `demo`, `production`, `staging`/`internal-preview`
4. `NODE_ENV=production` — forces `production`
5. Default — `local-dev`

---

## Mode Definitions

### `local-dev`

**Purpose:** Active development in the Replit workspace by engineers.  
**Who uses it:** Engineers and technical contributors.

| Axis | Behavior |
|------|----------|
| Auth | Replit OIDC (dev provider) |
| Seeded data | Allowed — may serve seed/mock records |
| Connector fallbacks | Allowed — connectors without keys fall back to stubs silently |
| AI provider fallbacks | Allowed — Replit proxy or stub responses permitted |
| Billing (Stripe) | Inactive — no real charges |
| External notifications | Suppressed — Slack, email, Twilio do not send |
| Analytics | Suppressed — PostHog events not emitted |
| Error verbosity | Full stack traces in API responses |
| Destructive ops | Permitted |
| Demo data labels | Not required (internal use only) |

**How to activate:** Default when no environment variables are set.

---

### `internal-preview`

**Purpose:** Internal demos, QA, stakeholder previews against the Replit-hosted build. Not customer-facing.  
**Who uses it:** Internal team members, design partners, pilot evaluators (non-public access).

| Axis | Behavior |
|------|----------|
| Auth | Replit OIDC (dev provider) |
| Seeded data | Allowed — may serve seed/mock records |
| Connector fallbacks | Allowed — connectors without keys fall back to stubs |
| AI provider fallbacks | Allowed |
| Billing (Stripe) | Inactive |
| External notifications | Suppressed |
| Analytics | Active — PostHog events emitted (internal workspace key) |
| Error verbosity | Full stack traces (internal use) |
| Destructive ops | Blocked |
| Demo data labels | **Required** — any seeded/simulated data must be labeled "Demo" or "Simulated" |

**How to activate:** Set `APP_ENV=internal-preview` or `APP_ENV=staging`.

---

### `demo`

**Purpose:** Investor demos, partner evaluations, external walkthroughs, conference presentations.  
**Who uses it:** Sales, founders, external evaluators.

| Axis | Behavior |
|------|----------|
| Auth | Replit OIDC (guest demo accounts allowed) |
| Seeded data | Allowed — demo data is the primary data source |
| Connector fallbacks | Allowed — all connectors serve realistic mock responses when keys absent |
| AI provider fallbacks | Allowed — AI responses are real or high-quality stubs |
| Billing (Stripe) | Inactive — no real charges, billing UI shows "Pending Activation" |
| External notifications | Suppressed — no external emails, Slack messages, or SMS |
| Analytics | Active — PostHog events emitted (demo key) |
| Error verbosity | Sanitized — no stack traces surfaced externally |
| Destructive ops | Blocked — delete/purge operations return a "Demo Mode" rejection |
| Demo data labels | **Required** — "Demo" badge on all seeded data; "Simulated" annotation on generated charts |

**How to activate:** Set `DEMO_MODE=true`, `ENABLE_DEMO_SEED=true`, or `APP_ENV=demo`.

**Critical rule:** No demo/mock data may masquerade as live operational data in demo mode. Every non-live surface must carry a visible label.

---

### `production`

**Purpose:** Live customer-facing service with real data, real billing, real notifications.  
**Who uses it:** Production tenants, activated customers.

| Axis | Behavior |
|------|----------|
| Auth | Full OIDC — organization-scoped RBAC enforced, session expiry enforced |
| Seeded data | **Blocked** — serving seed data in production throws a runtime error |
| Connector fallbacks | **Blocked** — missing connector credentials surface a clean "Not Activated" state; no silent mocks |
| AI provider fallbacks | **Blocked** — AI requests fail explicitly if no provider key is configured |
| Billing (Stripe) | Active — real charges, real invoices, real Stripe webhooks |
| External notifications | Active — Slack, email (Resend/SendGrid), Twilio SMS, Microsoft Teams |
| Analytics | Active — full PostHog event stream, production workspace key |
| Error verbosity | Sanitized — generic error messages only, full traces written to server logs |
| Destructive ops | Permitted with appropriate RBAC checks |
| Demo data labels | Not applicable — all data is real |

**How to activate:** Set `NODE_ENV=production` or `APP_ENV=production`.

**Critical rule:** Any code path that serves seed data or allows connector fallbacks must call `isSeedDataAllowed()` or `isConnectorFallbackAllowed()` before executing. Bypassing these checks in production is a Class-1 incident.

---

## What Changes Across Modes — Full Matrix

| Axis | local-dev | internal-preview | demo | production |
|------|-----------|------------------|------|------------|
| Auth enforcement | Dev OIDC | Dev OIDC | Dev OIDC | Full OIDC + Org RBAC |
| Seeded data permitted | Yes | Yes | Yes | **No** |
| Connector mock fallback | Yes | Yes | Yes | **No** |
| AI mock fallback | Yes | Yes | Yes | **No** |
| Stripe billing active | No | No | No | **Yes** |
| External notifications | Off | Off | Off | **On** |
| PostHog analytics | Off | On | On | **On** |
| Stack traces in responses | Yes | Yes | No | **No** |
| Destructive ops blocked | No | Yes | Yes | No (RBAC enforced) |
| Demo/simulated labels required | No | Yes | **Yes** | No |

---

## Environment Variables

| Variable | Type | Effect |
|----------|------|--------|
| `RUNTIME_MODE` | `local-dev \| internal-preview \| demo \| production` | Explicit mode override — highest priority. **Must be a valid mode name.** Invalid values cause a hard startup error. |
| `DEMO_MODE` | `true \| false` | Forces `demo` mode when `true` |
| `ENABLE_DEMO_SEED` | `true \| false` | Forces `demo` mode when `true`; also triggers seed data loading |
| `APP_ENV` | `demo \| production \| staging \| internal-preview` | Derived mode (lower priority than explicit) |
| `NODE_ENV` | `development \| production \| test` | Forces `production` when set to `production` |

**Strict validation:** If `RUNTIME_MODE` is set to any value that is not in `["local-dev", "internal-preview", "demo", "production"]`, `resolveRuntimeMode()` throws an error and the server fails to start. This is intentional — a misconfigured mode value must not silently fall through to an unintended behavior (e.g., treating a typo as "local-dev" when "production" was intended).

---

## Connector Activation Model

Each external connector (Stripe, Slack, OpenAI, NOAA, AbuseIPDB, etc.) has a set of required credential environment variables. The `resolveConnectorStatus()` function in `lib/config/src/runtime-mode.ts` determines whether a connector is:

- **Live** — all credential keys are present and non-empty
- **Demo (mock fallback)** — keys absent, non-production mode, serves realistic mock responses with a "Demo" label
- **Not Activated** — keys absent, production mode, surfaces a clean "not activated" state with no silent fallback

This model ensures:
- Demos look compelling with realistic mock data
- Production never silently serves mock data
- The distinction is machine-enforceable, not dependent on developer discipline

---

## Demo Data Labeling Requirements

In `demo` and `internal-preview` modes, any data surface that serves seeded or simulated records **must** display a visible label. Accepted label patterns:

| Pattern | Usage |
|---------|-------|
| `Demo` badge | Data cards, table rows, module headers showing seeded records |
| `Simulated` annotation | Charts and time-series visualizations generated from seed data |
| `Pilot` badge | Pre-production customer data used in pilot evaluation |
| `Not Activated` pill | Connector features not yet configured with live credentials |

Labels must be:
- Visible at a glance (not buried in tooltips)
- Consistent in appearance (use `shared-ui` badge components)
- Present on initial render — not deferred behind a loading state

---

## AI Provider Fallback Model

In non-production modes, if `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or equivalent keys are absent, the AI engine may:
1. Fall back to the Replit AI proxy (configured by the platform)
2. Serve high-quality canned responses for known demo prompt patterns
3. Return a clear "AI not configured" state

In production mode, missing AI keys must surface an explicit activation error — not a fallback response.

---

## Security Implications

- **Production mode** suppresses all internal state from API error responses. Stack traces, environment values, and service internals must never appear in HTTP responses.
- **Demo mode** must block destructive operations (DELETE, bulk purge, org deletion) to protect demo data integrity across sessions.
- **All modes** — session tokens, API keys, and secrets must never appear in client-side code, logs, or API responses regardless of mode.

---

## Implementation Reference

All mode resolution logic lives in:

```
lib/config/src/runtime-mode.ts
```

Key exports:

| Export | Type | Description |
|--------|------|-------------|
| `RUNTIME_MODES` | `const string[]` | All valid mode names |
| `RuntimeMode` | `type` | Union type of valid mode strings |
| `RuntimeModeProfile` | `interface` | Full mode behavior profile |
| `RUNTIME_MODE_PROFILES` | `Record<RuntimeMode, RuntimeModeProfile>` | All profiles keyed by mode |
| `resolveRuntimeMode()` | `() => RuntimeMode` | Server-side mode resolver |
| `getRuntimeModeProfile()` | `() => RuntimeModeProfile` | Current mode profile (server) |
| `getClientRuntimeMode(env)` | `(env) => RuntimeMode` | Client-side (Vite) resolver |
| `isProductionMode()` | `() => boolean` | Production predicate |
| `isDemoMode()` | `() => boolean` | Demo predicate |
| `isSeedDataAllowed()` | `() => boolean` | Seed data gate |
| `isConnectorFallbackAllowed()` | `() => boolean` | Connector fallback gate |
| `isBillingActive()` | `() => boolean` | Billing gate |
| `areNotificationsActive()` | `() => boolean` | Notification gate |
| `resolveConnectorStatus(name, keys)` | `ConnectorStatus` | Per-connector status resolver |
| `assertNotProductionOrThrow(ctx)` | `void` | Safety assertion for seed data paths |
| `assertNotificationsAllowedOrThrow(ctx)` | `void` | Safety assertion for notification paths |

---

## Checklist for New Features

Before shipping a new feature or data surface, verify:

- [ ] All connector calls check `isConnectorFallbackAllowed()` or `resolveConnectorStatus()` before falling back to mock responses
- [ ] All seed/demo data paths call `isSeedDataAllowed()` before serving synthetic records
- [ ] All external notification sends check `areNotificationsActive()` before dispatching
- [ ] All billing flows check `isBillingActive()` before initiating Stripe operations
- [ ] Demo and internal-preview modes show "Demo" / "Simulated" labels on non-live data
- [ ] Production mode serves an explicit "Not Activated" state — not a silent fallback — when credentials are absent
