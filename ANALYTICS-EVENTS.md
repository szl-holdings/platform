# SZL Holdings — Analytics Event Taxonomy

This document is the canonical reference for all analytics events emitted by the SZL Holdings platform. Events are captured via the shared `AnalyticsProvider` (frontend) and flushed to the `/api/telemetry/events` ingest endpoint, where they are stored in `dos_analytics_events` as JSONB metadata rows.

**Naming convention:** `{object}_{action}` in snake_case.

---

## Investor Data Room

Events emitted by `artifacts/szl-holdings/src/pages/investors-data-room.tsx`.

| Event Name | Trigger | Key Properties | Contains PII? |
|---|---|---|---|
| `page_view` | Investor lands on the data room after NDA accepted | `page: "investors_data_room"`, `userEmail`, `userId` | Yes (authenticated session only) |
| `data_room_nda_accepted` | Investor accepts the NDA and enters the data room | `userEmail`, `userId`, `recordFailed?` | Yes (authenticated session only) |
| `data_room_document_opened` | Investor navigates to a document or the Executive Brief panel (fires on every navigation, including revisits) | `docId`, `docTitle`, `docCategory`, `firstView` | **No** — no user identifiers |
| `data_room_document_dwell` | Investor navigates away from or unmounts a document they spent ≥ 2 seconds on | `docId`, `docTitle`, `docCategory`, `durationSeconds` | **No** — no user identifiers |
| `data_room_executive_brief_viewed` | Investor opens the Executive Brief panel for the **first time** in the session | `userEmail`, `userId` | Yes (authenticated session only — first-view only, retained for per-investor engagement rollup) |
| `data_room_executive_brief_pdf_downloaded` | Investor clicks "Download PDF" on the Executive Brief | `userEmail`, `userId` | Yes (authenticated session only) |
| `data_room_demo_request_submitted` | Investor submits the demo request form | `userEmail`, `userId`, `company`, `role` | Yes (authenticated session only) |
| `data_room_deeper_access_requested` | Investor submits the deeper-access inquiry form | `userEmail`, `userId`, `company`, `role`, `materialsRequested` | Yes (authenticated session only) |

### Privacy Design

- **Document view events (`data_room_document_opened`, `data_room_document_dwell`) carry no PII.** Only document metadata (`docId`, `docTitle`, `docCategory`) and behavioural signals (`durationSeconds`, `firstView`) are included. This satisfies the "no PII beyond session identifier" requirement for document tracking.
- `userEmail` and `userId` appear only in high-intent action events (NDA acceptance, PDF download, demo requests) where linking to an authenticated user is operationally necessary.
- Anonymous investors (unauthenticated) always produce `null` for `userEmail`/`userId` fields.
- No IP addresses, device fingerprints, or raw session tokens are stored in event metadata.
- `durationSeconds` in `data_room_document_dwell` is computed client-side from `Date.now()` deltas and rounded to the nearest second.

---

## Page Tracking (anonymous)

Events emitted by all SZL Holdings pages through the `analytics.page()` call or the anonymous `/api/track` endpoint.

| Event Name | Trigger | Key Properties |
|---|---|---|
| `page_view` | Any page load or SPA navigation | `page`, `path`, `referrer?` |

---

## General Platform

| Event Name | Trigger | Key Properties |
|---|---|---|
| `identify` | User authenticates | `userId`, `email?`, `plan?` |

---

## Aggregation Endpoints (Backend)

Both endpoints require `admin` or `ops` role authentication.

| Endpoint | Description |
|---|---|
| `GET /api/investor-analytics/data-room-engagement` | Per-investor engagement rollup (NDA, doc opens, brief views, demo requests) for last 90 days. Groups by `userEmail` where present, otherwise "anonymous". |
| `GET /api/investor-analytics/data-room-docs` | Per-document open counts and dwell time for last 90 days. **No PII** — groups only by `docId`. Returns `openCount`, `dwellEvents`, `avgDwellSeconds`, `maxDwellSeconds`, `pdfDownloads`. |
