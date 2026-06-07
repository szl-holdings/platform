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

## Onboarding Lifecycle Events

These seven events define the canonical onboarding activation funnel. They are the authoritative measurement points for time-to-first-value, stage conversion rates, and 7-day activation rate. See `docs/ONBOARDING_ARCHITECTURE.md` for stage definitions and `docs/ACTIVATION_METRICS.md` for measurement methodology.

**Emitter:** Server-side (API server) for events 1–2 and 5–7; frontend (`GuidedSetupChecklist`) for events 3–4.
**Storage:** `dos_analytics_events` table, `event_category: "business"`, `domain: "system"`.
**Schema:** Conforms to base event schema in `docs/EVENT_SCHEMA.md` under the `onboarding.*` event type namespace.

| Event Name | Trigger | Emitter | Key Properties | Contains PII? |
|---|---|---|---|---|
| `signup_completed` | User confirms their account (email verification or SSO) and the org profile step completes | Auth service (server-side) | `userId`, `email`, `orgSlug`, `orgId`, `signupMethod` (`email`\|`sso`\|`azure`), `onboardingVariant` (`standard`\|`forge`\|`azure_tenant`) | Yes — `userId`, `email` |
| `workspace_created` | The workspace record is written to the database and the org slug is confirmed active | Onboarding API (server-side) | `workspaceId`, `orgSlug`, `orgId`, `domainPacksSelected[]`, `teamSize`, `onboardingVariant` | No |
| `first_data_connected` | The first external data source or domain integration emits its first record into the platform, OR seed data is loaded | Integration controller (server-side) | `workspaceId`, `orgSlug`, `dataSourceType` (`integration`\|`seed`\|`csv_upload`), `domainPack`, `integrationId?`, `seedDatasetId?` | No |
| `first_recommendation_seen` | The user views a signal card, alert, or recommendation for the first time — `firstView: true` — with ≥ 2 seconds dwell | Frontend — signal/alert view component | `workspaceId`, `userId`, `domainPack`, `signalId`, `signalType`, `confidenceScore?`, `dwellSeconds` | Minimal — `userId` only |
| `first_approval_submitted` | The user submits their first approval, escalation, or triage action via the approval workflow | Approval service (server-side) | `workspaceId`, `userId`, `approvalId`, `approvalAction` (`approve`\|`reject`\|`escalate`\|`dismiss`), `domainPack`, `signalId?`, `timeFromRecommendationSeenMs?` | Minimal — `userId` only |
| `first_outcome_verified` | The first proof chain entry is written for the user's workspace, confirming a governed decision outcome is recorded | Proof chain service (server-side) | `workspaceId`, `proofChainEntryId`, `domainPack`, `approvalId`, `timeFromSignupMs`, `timeFromWorkspaceCreatedMs` | No |
| `onboarding_completed` | All items in the `GuidedSetupChecklist` are marked complete and the completion state is written to `onboarding_wizard_state` | Onboarding API (server-side) | `workspaceId`, `orgSlug`, `completedAt`, `totalDurationMs`, `onboardingVariant`, `domainPacksActive[]`, `teamSize` | No |

### Payload Examples

**`signup_completed`**
```json
{
  "event_type": "onboarding.signup.completed",
  "event_category": "business",
  "domain": "system",
  "payload": {
    "userId": "usr_abc123",
    "email": "founder@example.com",
    "orgSlug": "example-corp",
    "orgId": "org_xyz789",
    "signupMethod": "email",
    "onboardingVariant": "standard"
  }
}
```

**`workspace_created`**
```json
{
  "event_type": "onboarding.workspace.created",
  "event_category": "business",
  "domain": "system",
  "payload": {
    "workspaceId": "ws_001",
    "orgSlug": "example-corp",
    "orgId": "org_xyz789",
    "domainPacksSelected": ["cyber", "maritime"],
    "teamSize": 3,
    "onboardingVariant": "standard"
  }
}
```

**`first_data_connected`**
```json
{
  "event_type": "onboarding.data.first_connected",
  "event_category": "business",
  "domain": "system",
  "payload": {
    "workspaceId": "ws_001",
    "orgSlug": "example-corp",
    "dataSourceType": "seed",
    "domainPack": "cyber",
    "seedDatasetId": "seed_cyber_default_v2"
  }
}
```

**`first_recommendation_seen`**
```json
{
  "event_type": "onboarding.recommendation.first_seen",
  "event_category": "business",
  "domain": "system",
  "payload": {
    "workspaceId": "ws_001",
    "userId": "usr_abc123",
    "domainPack": "cyber",
    "signalId": "sig_8f3a...",
    "signalType": "security.incident.detected",
    "confidenceScore": 0.87,
    "dwellSeconds": 18
  }
}
```

**`first_approval_submitted`**
```json
{
  "event_type": "onboarding.approval.first_submitted",
  "event_category": "business",
  "domain": "system",
  "payload": {
    "workspaceId": "ws_001",
    "userId": "usr_abc123",
    "approvalId": "apv_001",
    "approvalAction": "approve",
    "domainPack": "cyber",
    "signalId": "sig_8f3a...",
    "timeFromRecommendationSeenMs": 42000
  }
}
```

**`first_outcome_verified`**
```json
{
  "event_type": "onboarding.outcome.first_verified",
  "event_category": "business",
  "domain": "system",
  "payload": {
    "workspaceId": "ws_001",
    "proofChainEntryId": "pce_001",
    "domainPack": "cyber",
    "approvalId": "apv_001",
    "timeFromSignupMs": 420000,
    "timeFromWorkspaceCreatedMs": 360000
  }
}
```

**`onboarding_completed`**
```json
{
  "event_type": "onboarding.completed",
  "event_category": "business",
  "domain": "system",
  "payload": {
    "workspaceId": "ws_001",
    "orgSlug": "example-corp",
    "completedAt": "2026-04-25T14:23:11.000Z",
    "totalDurationMs": 540000,
    "onboardingVariant": "standard",
    "domainPacksActive": ["cyber", "maritime"],
    "teamSize": 3
  }
}
```

### Privacy Design

- `email` and `userId` appear only in `signup_completed` and `first_recommendation_seen` / `first_approval_submitted` where user identity is operationally necessary for funnel analysis.
- `first_data_connected`, `first_outcome_verified`, and `onboarding_completed` carry no PII — workspace-level aggregation is sufficient.
- `timeFromSignupMs` and `timeFromWorkspaceCreatedMs` are computed server-side from event timestamps, not from PII.

---

## Aggregation Endpoints (Backend)

Both endpoints require `admin` or `ops` role authentication.

| Endpoint | Description |
|---|---|
| `GET /api/investor-analytics/data-room-engagement` | Per-investor engagement rollup (NDA, doc opens, brief views, demo requests) for last 90 days. Groups by `userEmail` where present, otherwise "anonymous". |
| `GET /api/investor-analytics/data-room-docs` | Per-document open counts and dwell time for last 90 days. **No PII** — groups only by `docId`. Returns `openCount`, `dwellEvents`, `avgDwellSeconds`, `maxDwellSeconds`, `pdfDownloads`. |
