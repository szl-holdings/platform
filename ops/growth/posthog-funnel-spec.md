# PostHog Acquisition Funnel — Spec

Owner: Growth
Last updated: 2026-04-20
Status: Live

## Funnel definition

Configure the following funnel in the PostHog project (Insights → Funnels → New
funnel). Steps are strictly ordered and bound to a single session by default.

| # | PostHog event           | Filter                  | Page          |
|---|-------------------------|-------------------------|---------------|
| 1 | `landing_view`          | `funnel = acquisition`  | `/` (and `/landing` if exposed) |
| 2 | `cta_click`             | `page in ("/", "/pricing")` | landing/pricing CTAs |
| 3 | `contact_form_submit`   | (no filter)             | `/contact`    |
| 4 | `demo_request`          | (no filter)             | `/contact`    |

Recommended settings:
- Conversion window: 1 day
- Breakdowns: `utm_source`, `utm_campaign`, `referrer`
- Visualization: time-to-convert + step-by-step drop-off

The intermediate `pricing_view` event is also emitted from `/pricing` and can
be added as an optional fifth step or used for a parallel "pricing-led" funnel.

## Event sources (verified)

All events are tracked in `artifacts/szl-holdings/src/lib/analytics.ts` and
fire on the following surfaces:

- `landing_view` — `artifacts/szl-holdings/src/pages/landing.tsx`
  (mounts `useEffect` calling `analytics.landingView("/")`).
- `pricing_view` — `artifacts/szl-holdings/src/pages/pricing.tsx`
  (mount effect, plus `cta_click` on every CTA link).
- `contact_view` — `artifacts/szl-holdings/src/pages/contact.tsx`
  (mount effect; precedes `contact_funnel_start` once a user starts typing).
- `cta_click` — pricing hero + qualification CTAs (direct emit), and landing
  hero / Lyte / bottom CTAs (dual-emitted by `analytics.heroCTAClick` so the
  existing `hero_cta_click` events keep working while the funnel sees a
  consistent step-2 event).
- `contact_form_submit` — `analytics.contactFormSubmit(form.type)` after the
  contact form `POST /api/contact/submit` succeeds.
- `demo_request` — landing hero buttons (`hero`, `lyte-cta`, `bottom-cta`) and
  on contact form success when `form.type === "demo"`.

## Session recordings

- PostHog init keeps recordings disabled by default
  (`disable_session_recording: true`) so authenticated dashboards are never
  recorded.
- Marketing pages opt in programmatically by calling
  `startMarketingSessionRecording(page)` from `lib/analytics`. The helper only
  starts recording when `page` is one of `/`, `/landing`, `/contact`,
  `/pricing`.
- The router-level `PageViewTracker` in `App.tsx` enforces the boundary on
  every navigation: it calls `startMarketingSessionRecording` when entering an
  allowed page and `stopMarketingSessionRecording` on every other route, so
  recording cannot leak into authenticated dashboards via SPA navigation.
- Recording inherits the existing PII redaction settings
  (`mask_all_text`, `mask_all_element_attributes`).

To enable recordings end-to-end, ensure the PostHog project also has session
recording toggled on under Project Settings → Recordings.

## QA

Manual verification (DEV build, `import.meta.env.DEV`):

```
1. Open /        → console: [analytics] landing_view {...}
2. Click hero "Request demo" → cta_click + demo_request
3. Open /pricing → console: [analytics] pricing_view {...}
4. Click "Start a Conversation" → cta_click {cta_label: "start-a-conversation"}
5. Open /contact → console: [analytics] contact_view {...}
6. Submit contact form (type=demo) → contact_form_submit + demo_request
```

In PostHog, use the Live Events view filtered by `event in ('landing_view',
'pricing_view', 'contact_view', 'cta_click', 'contact_form_submit',
'demo_request')` to confirm ingestion before saving the funnel.
