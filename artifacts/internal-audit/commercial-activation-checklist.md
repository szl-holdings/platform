# Commercial Activation Checklist
**Audit Date:** April 19, 2026

## Status Legend
- ✅ Activated (test/sandbox mode or full)
- ⚠️ Built but dormant — needs secrets/config
- 🔧 Partial — code exists, path incomplete
- ❌ Not built

---

## Stripe Billing
**Status:** ✅ Activated in test mode

- Stripe publishable key: ✅ configured
- Stripe webhook: ✅ configured  
- Test mode confirmed: ✅ (smoke-test PASS)
- Checkout UI for Carlota Jo: ⚠️ scaffold present, no checkout page wired to Stripe SDK
- **One-step to production:** Swap test keys for live keys in secrets panel

---

## Email (Resend / SendGrid / SMTP)
**Status:** ⚠️ Built, not activated

- Code scaffold: ✅ present in api-server
- RESEND_API_KEY: ❌ not set
- SENDGRID_API_KEY: ❌ not set
- SMTP fallback: 🔧 handler present
- Email templates: ✅ exist (notification, approval, digest)
- **Required secrets:** `RESEND_API_KEY` OR `SENDGRID_API_KEY`
- **One-step to activation:** Add either secret to secrets panel

---

## Mapbox
**Status:** ✅ Activated

- VITE_MAPBOX_TOKEN: ✅ configured
- Terra property map: ✅ rendering
- Vessels fleet map: ✅ rendering
- **No action needed**

---

## Google Maps
**Status:** ✅ Activated

- GOOGLE_MAPS_API_KEY: ✅ configured
- Proxy routes: ✅ /api/maps/static, /api/maps/geocode
- **No action needed**

---

## SSO / SCIM
**Status:** ⚠️ Scaffold present, no IdP configured

- OIDC/PKCE scaffold: ✅ present
- Session-based auth: ✅ working
- Enterprise SSO: ❌ no IdP configured
- SCIM provisioning: ❌ not wired
- **Required:** Set up Okta, Azure AD, or Auth0 credentials
- **Required secrets:** `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`

---

## Redis Cache
**Status:** ⚠️ Built, not activated

- Code: ✅ REDIS_URL check present; graceful fallback to DB/LRU
- REDIS_URL: ❌ not set
- Impact: Reduced cache performance; all functionality works without it
- **One-step to activation:** Add REDIS_URL to secrets panel

---

## Customer Contact / Inquiry Flows
**Status:** 🔧 Partial

- Contact forms: ✅ UI exists (Carlota Jo, Command marketing)
- Form submission handlers: 🔧 partial — missing email delivery backend
- CRM integration: ❌ not wired
- **Required:** Activate email (above) to complete contact flow

---

## Admin Control Surface
**Status:** 🔧 Partial

- Admin routes: ✅ exist in API
- Admin UI: ⚠️ basic; no dedicated admin app
- Tenant provisioning: ✅ API-based
- **Recommended:** Build dedicated admin panel (out of scope for this task)

---

## OpenAPI / Developer Portal
**Status:** 🔧 Partial

- API spec: ✅ exists (API-SPEC.md, API-CATALOGUE.md)
- OpenAPI JSON: ✅ generated
- Hosted portal UI: ❌ not built
- MCP Gateway: ✅ working
- **Recommended:** Host Swagger UI or Redoc from api-server

---

## Analytics (PostHog / Amplitude)
**Status:** ✅ Activated

- PostHog server: ✅ POSTHOG_API_KEY configured
- PostHog frontend: ✅ VITE_POSTHOG_KEY configured
- Amplitude frontend: ✅ VITE_AMPLITUDE_API_KEY configured
- **No action needed**

---

## Error Tracking (Sentry)
**Status:** ✅ Activated

- Server Sentry: ✅ SENTRY_DSN configured
- Frontend Sentry: ✅ VITE_SENTRY_DSN configured
- **No action needed**

---

## Summary

| Category | Status | Priority |
|---|---|---|
| Stripe billing | ✅ Test mode active | P1: Swap to live keys |
| Email delivery | ⚠️ Dormant | P1: Add RESEND_API_KEY |
| Mapbox / Google Maps | ✅ Active | — |
| SSO / SCIM | ⚠️ Dormant | P2: Configure IdP |
| Redis | ⚠️ Dormant | P3: Performance only |
| Contact / inquiry | 🔧 Partial | P2: Needs email |
| Admin panel | 🔧 Partial | P3: Post-launch |
| OpenAPI portal | 🔧 Partial | P3: Post-launch |
| Analytics | ✅ Active | — |
| Error tracking | ✅ Active | — |
