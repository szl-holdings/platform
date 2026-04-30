# Counsel — Mobile Strategy

**Version:** 1.0  
**Date:** April 2026  
**Scope:** Phase 2 product planning

---

## Strategic Context

The primary Counsel experience is desktop — attorneys and paralegals doing deep matter work benefit from a full-screen interface with rich context, structured views, and the ability to work through complex analysis. The desktop interface is where the full Matter Twin, Pressure Graph, Copilot Workbench, and document review live.

Mobile is not a replacement for the desktop interface. It is the right tool for a specific set of high-value moments: when an attorney is away from their desk and needs to check something quickly, act on an approval, triage an alert, or review a summary before a call.

Mobile is Phase 2 because the desktop experience must be solid first. A mobile app that surfaces bad data or requires constant desktop-side setup is worse than no mobile app.

---

## Phase 2 Scope

Mobile is intentionally scoped to the actions attorneys and paralegals take outside the office — not the full feature set.

### 1. Alerts and Notifications

**What:** Push notifications for high-priority events that require attention:
- Deadline approaching (7 days, 3 days, 1 day)
- Pressure dimension crossing a high-risk threshold (> 0.7)
- New document added to a matter (pending review)
- Approval item requiring attorney sign-off
- Connector sync failure (ops role)
- Quiet risk detection (matter going stale)

**Why mobile is right for this:** Alerts are time-sensitive. An attorney away from their desk who gets a "SOL approaching in 3 days on Anderson matter" notification can take immediate action — not wait until they're back at their computer.

**Implementation:** Expo Push Notifications. Platform-appropriate permissions request (iOS: request on first meaningful interaction; Android: immediate). Notification tap routes to the relevant matter or approval item.

---

### 2. Deadline Triage

**What:** A focused view of upcoming deadlines across all matters the user has access to:
- Sorted by proximity and risk level
- Grouped: Overdue · Due this week · Due this month
- One-tap drill-down to matter detail
- One-tap to view the full deadline context

**Why mobile is right for this:** Deadline triage is a quick-check workflow — "What's due this week?" is a 60-second question that doesn't require a desktop session. Attorneys check this on their phones.

**Implementation:** Simple list view. No editing on mobile (deadline management stays on desktop). Pull-to-refresh. Offline cache for last-loaded state.

---

### 3. Matter Summaries

**What:** A compact, read-only view of each matter's current state:
- Health score + trend
- Top 3 pressure dimensions with scores
- Outstanding deadlines count
- Documents pending review count
- Open approvals count
- Last Matter Twin snapshot timestamp

**Why mobile is right for this:** An attorney heading into a call or meeting wants a quick "where does this matter stand?" view without navigating the full desktop interface.

**Implementation:** Card-based list of assigned matters. Tap for detail. Detail view shows the compact summary. No AI generation on mobile — this is reading the existing Matter Twin snapshot, not generating new analysis.

---

### 4. Quick Review and Approval

**What:** For attorneys, the ability to review and approve (or reject) pending items from the review queue on mobile:
- View the output content and source summary
- See the confidence score and model version
- Approve / Request revision / Reject
- Approval recorded with actor, timestamp, and note

**Why mobile is right for this:** Approvals are often time-sensitive. An attorney at lunch or traveling who has a signoff queue item can clear it without waiting until they're at their desk.

**Implementation:** List of pending signoff items. Each item shows title, review summary (not full content on mobile — a link-to-full is available), confidence, sources count. Swipe-to-approve with confirmation. Fully synced with desktop state.

**Security consideration:** Approval actions on mobile go through the same API enforcement as desktop. The `exportSafe` flag is set only after the API validates the role and approval state — mobile does not bypass any approval gate.

---

### 5. Activity Feed

**What:** A chronological feed of recent events across all assigned matters:
- New document added
- Pressure dimension change (with direction)
- Deadline status change
- Approval resolved
- Connector sync complete
- Forecast change

**Why mobile is right for this:** An attorney or paralegal who has been away from the desk for a few hours wants to quickly scan "what happened while I was out?" This is the mobile version of the Matter Twin change detection.

**Implementation:** Feed view ordered by most recent. Each event item shows: matter name, event type, brief description, timestamp. Tap to drill down to the matter. No generation — read-only of audit/change events.

---

### 6. Lightweight Search

**What:** Matter-level search by name, case number, party name, or keyword:
- Returns matching matter cards
- No document-level search (retrieval pipeline requires desktop context)
- No AI reasoning (advisory output requires review workflow)

**Why mobile is right for this:** Quick lookup — "What is the Anderson matter's case number?" or "Find all matters with Allstate" — is a common quick-check that shouldn't require a desktop session.

**Implementation:** Search bar at the top of the matters list. Client-side filtering of the cached matter list for recent data; server-side search for full query. No privilege-sensitive content in search results (summary only).

---

## What Is Out of Scope for Mobile

The following capabilities are intentionally excluded from Phase 2 mobile:

| Capability | Why excluded |
|-----------|-------------|
| Full Copilot Workbench | AI reasoning requires full context assembly; mobile UX is not suited for long-form analysis sessions |
| Document upload and extraction | Large file handling on mobile is unreliable; document pipeline requires desktop |
| Full Pressure Graph editing | Configuration and scoring is a desktop workflow |
| M365 connector management | Admin workflow — desktop only |
| Export generation | Export requires full approval workflow; mobile can approve but not initiate export |
| Worldline signal management | Admin workflow — desktop only |
| User and role management | Admin workflow — desktop only |

These exclusions are not permanent — they represent Phase 2 scope. Later mobile phases can expand capabilities as the mobile experience matures.

---

## Technical Approach

**Framework:** Expo (React Native) — consistent with the existing mobile portfolio (SZL Holdings Mobile, Aegis Mobile, Vessels Mobile, Lyte Mobile). Shared patterns across apps.

**Authentication:** `expo-auth-session` OIDC flow, consistent with existing mobile apps.

**State management:** React Query for server state. Same API endpoint patterns as desktop.

**Notifications:** Expo Push Notifications. Server-side delivery via job queue trigger on qualifying events.

**Offline behavior:** Matter list and last Matter Twin snapshot cached locally. Approvals queue with local state and sync-on-reconnect. No offline AI generation.

**Design:** Consistent with the dark, premium aesthetic of the existing Counsel desktop interface. Compact matter cards. Clean list views. No decorative complexity.

---

## Phase 2 Delivery Order

1. Authentication and matter list (foundation)
2. Matter summary cards (read-only Matter Twin compact view)
3. Push notifications (alerts)
4. Deadline triage view
5. Activity feed
6. Quick review and approval
7. Lightweight search

---

## Success Criteria for Phase 2

- Attorneys use the deadline triage view at least 3x per week
- Push notifications for high-priority events achieve > 60% open rate
- Quick approval reduces average approval cycle time by > 20%
- Mobile DAU among pilot attorneys > 40% of desktop DAU

---

*See also:*
- *[Executive Overview](../buyer/prism-counsel-executive-overview.md)*
- *[Alloy Control Plane Architecture](../architecture/prism-counsel-alloy-control-plane.md)*
- *[Trust Center](../trust/prism-counsel-trust-center.md)*
