# Analytics Implementation Plan

Generated: 2026-04-15

## Current State

- `lib/analytics` exists with event tracking utilities
- `ANALYTICS_PLAN.md` at root defines event taxonomy
- `EVENT_TAXONOMY.md` defines event naming conventions
- PostHog or similar analytics likely planned but integration status unclear

## Recommended Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Product Analytics | PostHog (or Mixpanel) | User behavior, funnels, retention |
| Web Analytics | Plausible (or PostHog) | Page views, referrals, geography |
| Error Tracking | Sentry | Client + server errors |
| Performance | Web Vitals + Lighthouse CI | Core Web Vitals monitoring |

## Key Events to Track

### Acquisition
- `page_view` — all pages, with referrer
- `demo_request_submitted` — demo form completion
- `contact_form_submitted` — contact form completion
- `newsletter_signup` — email capture

### Activation
- `user_registered` — new account creation
- `first_login` — initial authenticated session
- `workspace_created` — first workspace setup
- `first_query_run` — first search/analysis action

### Engagement
- `nav_link_click` — navigation interaction (already tracked)
- `command_palette_used` — power user engagement
- `domain_switched` — cross-domain navigation
- `ai_feature_used` — AI-powered action
- `export_completed` — data export action
- `report_generated` — report creation

### Conversion
- `demo_scheduled` — demo meeting booked
- `pricing_viewed` — pricing page visit
- `plan_selected` — pricing tier selection

## Implementation

1. Add PostHog SDK to szl-holdings (public site)
2. Configure page view auto-capture
3. Add custom events for CTA interactions
4. Create conversion funnels: Visit → Demo Request → Signup → Activation
5. Set up weekly automated reports

## Environment Variables
```
VITE_POSTHOG_KEY=phc_...       # PostHog project API key (public)
VITE_POSTHOG_HOST=https://app.posthog.com
VITE_SENTRY_DSN=https://...    # Sentry DSN (public)
```
