# SZL Holdings Platform — Integration Reference

This document lists every third-party integration wired across the SZL Holdings platform, the environment variables each needs, which artifacts use it, and a smoke-test checklist for verifying each integration is live.

---

## 1. Stripe — Payments & Subscriptions

**Status:** Wired across all authenticated apps + mobile (test mode keys required)
**Artifacts:** api-server (billing backend), carlota-jo, command, terra, vessels, szl-holdings, pulse (web); szl-holdings-mobile (mobile). Note: aegis is a public investor slide deck with no user subscription flow.

### How it works

Stripe is implemented server-side in `lib/services/src/adapters/stripe.ts` via a `StripeAdapter` class that toggles between a mock mode (when no key is set) and live mode (when `STRIPE_SECRET_KEY` is present). All subscription state is persisted to the `subscriptions`, `invoices`, and `revenue_events` database tables.

**Frontend entry points wired (all call real Stripe checkout API):**

| App | File | Action |
|---|---|---|
| carlota-jo | `BookingFlow.tsx` | Calls `POST /api/stripe/checkout` at payment step; fires `trackEvent("conversion")` on success |
| command | `operations/pages/pricing.tsx` | "Start Free Trial" calls `POST /api/billing/command/subscribe` → redirects to Stripe checkout |
| terra | `pages/spatial-walkthrough.tsx` | "Upgrade to Terra Pro" calls `POST /api/billing/terra/subscribe` → Stripe checkout |
| vessels | `pages/billing-panel.tsx` | "Upgrade Fleet" calls `POST /api/billing/checkout` → Stripe checkout |
| szl-holdings | `components/SubscriptionManager.tsx` | "Start Free Trial" calls `POST /api/billing/checkout`; "View Plans" fires `trackEvent("upgrade_clicked")` |
| pulse | `pages/Settings.tsx` | "Upgrade Plan" calls `POST /api/billing/checkout` → Stripe checkout; "Manage Billing" calls `POST /api/billing/portal-session` → Stripe Customer Portal |
| szl-holdings (org) | `pages/org-settings.tsx` | "Manage Billing" calls `POST /api/billing/portal-session` → Stripe Customer Portal |
| mobile | `app/(shell)/settings/index.tsx` | "Upgrade Plan" calls `POST /api/billing/checkout` → opens URL via `Linking.openURL`; fires `trackEvent("upgrade_clicked")` |

### Environment Variables

| Variable | Description | Scope |
|---|---|---|
| `STRIPE_SECRET_KEY` | Test-mode secret key (`sk_test_...`) | API server |
| `STRIPE_PUBLISHABLE_KEY` | Test-mode publishable key (`pk_test_...`) | API server / frontend |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_...`) | API server |
| `STRIPE_PRICE_COMMAND_PRO_MONTHLY` | Command Pro (monthly) price ID | API server |
| `STRIPE_PRICE_COMMAND_PRO_ANNUAL` | Command Pro (annual) price ID | API server |
| `STRIPE_PRICE_TERRA_STARTER_MONTHLY` | Terra Starter (monthly) price ID | API server |
| `STRIPE_PRICE_TERRA_STARTER_ANNUAL` | Terra Starter (annual) price ID | API server |
| `STRIPE_PRICE_TERRA_PRO_MONTHLY` | Terra Pro (monthly) price ID | API server |
| `STRIPE_PRICE_TERRA_PRO_ANNUAL` | Terra Pro (annual) price ID | API server |

### API Endpoints

- `POST /api/billing/checkout` — Generic checkout session (vessels, szl-holdings)
- `POST /api/stripe/checkout` — Carlota Jo service booking checkout
- `POST /api/billing/terra/subscribe` — Terra plan checkout (terra-starter-monthly, terra-pro-annual, etc.)
- `POST /api/billing/command/subscribe` — Command plan checkout (command-pro-monthly, command-pro-annual)
- `POST /api/lyte/billing/pilot-checkout` — Lyte pilot checkout
- `POST /api/billing/customer-portal` — Customer billing portal redirect (requires `customerId` + feature flag)
- `POST /api/billing/portal-session` — Session-aware billing portal (authenticates from session user email; no feature flag required; used by Pulse, szl-holdings, mobile)
- `POST /api/billing/webhooks` — Stripe webhook receiver
- `GET /api/billing/subscription-status` — Check user subscription status
- `GET /api/billing/stripe-config` — Stripe key + price ID configuration status report
- `GET /api/billing/terra/plans` — Available Terra plans
- `GET /api/billing/command/plans` — Available Command plans

### Webhook Configuration

In your Stripe dashboard, set the webhook endpoint to:
```
https://<your-domain>/api/billing/webhooks
```
Subscribe to: `checkout.session.completed`, `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed`, `payment_intent.succeeded`

### Smoke Tests

**Test 1 — Carlota Jo booking flow:**
1. Open `/carlota-jo/` → click "Book a Session" → select a service tier → click "Proceed to Payment"
2. Verify browser redirects to a Stripe-hosted checkout page (`checkout.stripe.com`)
3. Complete using test card `4242 4242 4242 4242`, any future expiry, any CVC
4. Check PostHog for `conversion` event with `feature: "carlota_booking_checkout"`

**Test 2 — Command pricing page:**
1. Open `/command/pricing` → click "Start Free Trial" on any tier
2. Verify browser redirects to Stripe checkout (requires `STRIPE_PRICE_COMMAND_PRO_MONTHLY` to be set in Stripe)
3. Check PostHog for `upgrade_clicked` event with `feature: "lyte_pricing"`

**Test 3 — Terra subscribe:**
1. Open `/terra/property` → click "Upgrade to Terra Pro"
2. Verify browser redirects to Stripe checkout (requires `STRIPE_PRICE_TERRA_STARTER_MONTHLY` in env)
3. Check PostHog for `upgrade_clicked` event with `feature: "terra_walkthrough"`

**Test 4 — Vessels billing panel:**
1. Open `/vessels/billing` → click "Upgrade Fleet"
2. Verify API call to `/api/billing/checkout` → check PostHog for `upgrade_clicked` event

---

## 2. Sentry — Error Monitoring

**Status:** Wired for API server and all web frontends; mobile uses a lightweight HTTP reporter
**Artifacts:** api-server, szl-holdings, pulse, aegis, terra, vessels, carlota-jo, command, szl-holdings-mobile

### Implementation

**API server:** `artifacts/api-server/src/lib/sentry.ts` — initialized in `src/index.ts` before any other code. Captures unhandled exceptions, rejections, and deliberate manual captures. Sanitizes auth headers from requests.

**Web frontends:** `lib/observability/src/react/sentry.ts` — `initSentry({ appSlug })` called in each app's `main.tsx`. Includes browser tracing and session replay. Uses `VITE_SENTRY_DSN`.

**Mobile (Expo):** `artifacts/szl-holdings-mobile/lib/sentry.ts` — a lightweight HTTP reporter using the Sentry Store API. Avoids native module dependencies. Uses `EXPO_PUBLIC_SENTRY_DSN`. Wires into React Native's `ErrorUtils.setGlobalHandler` for uncaught exception capture. Initialized via `initSentryGlobalHandlers()` in `_layout.tsx`.

### Environment Variables

| Variable | Description | Scope |
|---|---|---|
| `SENTRY_DSN` | Server-side Sentry DSN | API server |
| `VITE_SENTRY_DSN` | Frontend Sentry DSN | All web apps |
| `EXPO_PUBLIC_SENTRY_DSN` | Mobile Sentry DSN | Mobile (Expo) |
| `SENTRY_TRACES_SAMPLE_RATE` | Trace sampling rate (default: 0.1) | API server |
| `SENTRY_PROFILES_SAMPLE_RATE` | Profile sampling rate (default: 0.1) | API server |

### Per-App Slugs (used as release tags)

| App | `appSlug` |
|---|---|
| szl-holdings | `szl-holdings` |
| pulse | `pulse` |
| aegis | `aegis` |
| terra | `terra` |
| vessels | `vessels` |
| carlota-jo | `carlota-jo` |
| command | `command` |

### Smoke Test

1. Hit `GET /api/debug/sentry-test` (authenticated, non-production only) — response should say `"status": "captured"`
2. Check Sentry dashboard within ~60 seconds — a `SentryTestError` event should appear tagged with `app: "api-server"`
3. For frontend: trigger a JS error in the browser console → verify Sentry receives a browser error event
4. For mobile: set `EXPO_PUBLIC_SENTRY_DSN` and restart the Expo app — verify `initSentryGlobalHandlers` logs confirm initialization

---

## 3. PostHog — Product Analytics

**Status:** Initialized in all web apps; user identification wired at login; mobile HTTP API client ready (requires env keys)
**Artifacts:** szl-holdings, pulse, aegis, terra, vessels, carlota-jo, command (web); szl-holdings-mobile (pending EXPO_PUBLIC keys)

### Implementation

`initAnalytics({ appSlug })` called in each web app's `main.tsx` via `@szl-holdings/observability/react`. Initializes PostHog with autocapture, pageview, pageleave, and persistence enabled. Each app registers its `app` property on all events.

`identifyAnalyticsUser(user)` is called in each app's auth guard component (RequireAuth / AppContent / PortalAuthGuard) when the user authenticates. `resetAnalyticsUser()` is called on sign-out.

`trackEvent` is called in key UX flows: `cta_clicked` when booking flow payment is initiated, `conversion` when Stripe checkout URL is returned.

**Mobile:** HTTP batch API client in `artifacts/szl-holdings-mobile/lib/analytics.ts`. User identification is wired in `context/AuthContext.tsx` — `identifyUser()` is called whenever the auth user changes, and `resetUser()` is called on logout. Requires `EXPO_PUBLIC_POSTHOG_KEY` to be set.

### Environment Variables

| Variable | Description | Scope |
|---|---|---|
| `VITE_POSTHOG_KEY` | PostHog project API key (`phc_...`) | All web apps |
| `VITE_POSTHOG_HOST` | PostHog API host (default: `https://us.i.posthog.com`) | All web apps |
| `EXPO_PUBLIC_POSTHOG_KEY` | PostHog key for mobile | Mobile (Expo) |
| `EXPO_PUBLIC_POSTHOG_HOST` | PostHog host for mobile | Mobile (Expo) — set to `https://us.i.posthog.com` |
| `POSTHOG_API_KEY` | Server-side PostHog key | API server (future) |

### Smoke Test

1. Open the SZL Holdings dashboard — PostHog → Activity should show `page_view` events tagged `app: "szl-holdings"`
2. Visit `/pulse/`, `/terra/`, `/vessels/` — verify events appear per app
3. Log in → PostHog → Persons should show the user identified by ID (not just anonymous)
4. In carlota-jo, start a booking and reach the payment step → PostHog should show `cta_clicked` with `feature: "carlota_booking_checkout"` and `conversion` with `feature: "carlota_booking_checkout"` after the Stripe redirect

---

## 4. Amplitude — Product Analytics

**Status:** Initialized in all web apps; user identification wired at login; mobile HTTP API client ready (requires env keys)
**Artifacts:** szl-holdings, pulse, aegis, terra, vessels, carlota-jo, command (web); szl-holdings-mobile (pending EXPO_PUBLIC keys)

### Implementation

`initAnalytics({ appSlug })` also initializes `@amplitude/analytics-browser` with default tracking (page views, sessions, form interactions, file downloads). Each app is tagged with `group("app", appSlug)`.

`identifyAnalyticsUser` also calls `amplitude.setUserId` and sends an Identify event with email, name, and plan properties.

**Mobile:** Uses the Amplitude HTTP API v2 directly via `artifacts/szl-holdings-mobile/lib/analytics.ts`. Requires `EXPO_PUBLIC_AMPLITUDE_API_KEY`.

### Mobile Environment Variables

| Variable | Value |
|---|---|
| `EXPO_PUBLIC_POSTHOG_KEY` | Same value as `VITE_POSTHOG_KEY` |
| `EXPO_PUBLIC_AMPLITUDE_API_KEY` | Same value as `VITE_AMPLITUDE_API_KEY` |
| `EXPO_PUBLIC_SENTRY_DSN` | Same DSN as `VITE_SENTRY_DSN` |

### Smoke Test

1. Open any web app → Amplitude → Events → look for `[Amplitude] Page Viewed` events
2. Log in → Amplitude → User Look-up → user should appear with their real ID (not anonymous)
3. Check `[Amplitude] Session Started` events appear

---

## 5. Google Maps — Satellite Imagery + Geocoding (Server-Proxied)

**Status:** Wired — satellite imagery proxied to terra frontend; geocoding available
**Artifacts:** api-server (key held server-side), terra (satellite map imagery via proxy)

### Implementation

The `GOOGLE_MAPS_API_KEY` is never exposed to the browser. Two new endpoints proxy Google Maps API requests server-side:

- **`GET /api/maps/static`** — Proxies Google Static Maps API. Accepts `center`, `zoom`, `size`, `maptype`, `markers` params. Used by `artifacts/terra/src/pages/spatial-walkthrough.tsx` to render satellite imagery of the property at 425 Park Ave, NY.
- **`GET /api/maps/geocode`** — Proxies Google Geocoding API. Accepts `address` param. Used for server-side address-to-coordinates resolution.

**Terra satellite map:** The spatial walkthrough page renders a live Google Maps satellite view of the property address via `<img src="/terra/api/maps/static?center=425+Park+Ave+New+York+NY&zoom=17&size=900x220&maptype=satellite&markers=..." />`. The API key never leaves the server.

**Vessels fleet map:** The vessel detail panel renders a live Google Maps satellite view of the vessel's current position (lat/lng) via the same proxy endpoint, with a cyan marker showing real-time vessel location.

**Mobile portfolio map:** `app/(shell)/portfolio/(tabs)/map.tsx` shows a full-screen portfolio map with all SZL properties marked using Google Maps satellite imagery via the server proxy. Tapping a property selects it and recenters to a zoomed satellite view of that location. Accessible via the SpotlightFab "Portfolio Map" command. Fires `page_view` and `feature_used` analytics events.

**Note on map rendering:** Terra and Vessels use Mapbox for interactive vector map layers (GeoJSON, real-time vessel tracking). Google Maps is used additively for satellite imagery overlays via the server proxy (not the Google Maps JS SDK). Both rendering systems coexist: Mapbox handles interactivity (pan, zoom, route lines), Google Maps provides high-resolution satellite raster imagery.

**Mapbox (separate):** Interactive vector map rendering in terra/vessels uses Mapbox for real-time property portfolio and vessel tracking overlays. Mapbox handles pan/zoom/click interactivity; Google Maps handles satellite tile quality.

### Environment Variables

| Variable | Description | Scope |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | Google Maps API key (Static Maps + Geocoding APIs enabled) | API server only — never sent to browser |

### Smoke Tests

1. `GET /api/debug/integrations` — verify `google_maps.configured: true` and `frontend_integration` is set
2. Open `/terra/property` → verify the satellite map image loads at the top of the property walkthrough (shows 425 Park Ave, NY from satellite)
3. If image shows error, confirm `GOOGLE_MAPS_API_KEY` has **Static Maps API** and **Geocoding API** enabled in Google Cloud Console
4. `GET /api/maps/geocode?address=425+Park+Ave+New+York+NY` — response should include `lat/lng` coordinates

---

## 6. Mapbox — Interactive Maps (Frontend)

**Status:** Production-ready in Terra and Vessels
**Artifacts:** terra, vessels

### Implementation

- **Terra:** `artifacts/terra/src/components/property-map.tsx` — renders property portfolios with status-based markers, clustering, and interactive side panels
- **Vessels:** `artifacts/vessels/src/pages/fleet-map.tsx` — renders global vessel tracking with live AIS positioning, route visualization, and vessel detail panels

Both use `mapbox-gl` v3 with the `dark-v11` style. When `VITE_MAPBOX_TOKEN` is not set, vessels falls back to OpenStreetMap tiles.

**Note:** Google Maps JavaScript API is not used for rendering. Mapbox provides superior maritime/real-estate visualization performance and was chosen as the production map renderer. Google Maps is used server-side only for geocoding.

### Environment Variables

| Variable | Description | Scope |
|---|---|---|
| `VITE_MAPBOX_TOKEN` | Mapbox public access token (`pk.eyJ1...`) | terra, vessels |

### Smoke Test

1. Open `/terra/` → navigate to the map view → verify property markers appear on the map
2. Click a property marker → verify the detail panel opens with correct data
3. Open `/vessels/` → navigate to Fleet Map → verify vessel positions appear
4. Click a vessel → verify the route and vessel details display correctly
5. Browser console should show no Mapbox token errors

---

## 7. MCP Connector Hub

The SZL Holdings platform includes an MCP (Model Context Protocol) server at `/api/mcp` that exposes third-party connector integrations to AI agents and the Navigator AI assistant.

**Endpoint:** `POST /api/mcp` — Authenticated; requires session + tenant scope

**Built-in MCP tools:**

| Tool | Description |
|---|---|
| `connector_hub_discover` | List all registered connectors and their capabilities (Jira/Atlassian, Slack, PagerDuty, Salesforce, Groq, and more) |
| `connector_hub_execute` | Execute a connector capability (e.g., create Jira ticket, post Slack message) |
| `connector_hub_health` | Real-time health status of each connector (latency, error rate, circuit breaker) |

**Available connectors:** `jira` (Atlassian), `slack`, `pagerduty`, `salesforce`, `siem`, `groq`, `fal-ai`, `honeyhive`, `huggingface`, `elevenlabs`

**Sign-in / credentials**: Each connector authenticates via the Connector Hub in `lib/services/src/connectors/`. API keys and tokens are stored as environment secrets and passed to connectors at runtime — they are never exposed to the browser.

**Connector auth setup steps:**
1. Add the connector's API key as a Replit secret (e.g., `JIRA_API_TOKEN`, `SLACK_BOT_TOKEN`)
2. The Connector Hub auto-discovers keys on startup and registers the connector as live
3. Verify via `connector_hub_health` tool — status transitions from `demo` to `live`

**Usage from Navigator AI:** Users can prompt the AI assistant (e.g., "Create a Jira ticket for the Terra outage") and the MCP tools handle authentication, retry, and circuit breaking automatically.

---

## 8. API Debug Endpoints

These endpoints are available in **non-production** environments only and require authentication:

| Endpoint | Description |
|---|---|
| `GET /api/debug/sentry-test` | Throws and captures a deliberate Sentry test error |
| `GET /api/debug/integrations` | Returns the configuration status of all integrations |

---

## Full Environment Variable Checklist

### Required for Payments

- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`

### Required for Error Monitoring

- [ ] `SENTRY_DSN` (API server)
- [ ] `VITE_SENTRY_DSN` (all web frontends)
- [ ] `EXPO_PUBLIC_SENTRY_DSN` (mobile)

### Required for Product Analytics (Web)

- [ ] `VITE_POSTHOG_KEY`
- [ ] `VITE_AMPLITUDE_API_KEY`

### Required for Product Analytics (Mobile)

- [ ] `EXPO_PUBLIC_POSTHOG_KEY` (same value as `VITE_POSTHOG_KEY`)
- [ ] `EXPO_PUBLIC_AMPLITUDE_API_KEY` (same value as `VITE_AMPLITUDE_API_KEY`)

### Required for Maps

- [ ] `VITE_MAPBOX_TOKEN` (terra, vessels)
- [ ] `GOOGLE_MAPS_API_KEY` (API server geocoding)

---

## Switching to Production

All Stripe integrations run in **test mode** until you swap the keys. To go live:
1. Replace `STRIPE_SECRET_KEY` with the live secret key (`sk_live_...`)
2. Replace `STRIPE_PUBLISHABLE_KEY` with the live publishable key (`pk_live_...`)
3. Create a new Stripe webhook endpoint for production and update `STRIPE_WEBHOOK_SECRET`
4. Update `NODE_ENV=production` in the production environment

> ⚠️ Never commit API keys to source control. All secrets are managed via Replit Secrets.
