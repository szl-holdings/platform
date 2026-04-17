# Next 15 Actions — Prioritized

**Owner:** Founder  
**Last updated:** April 2026  
**Version:** 1.0

---

## How to Use This List

This is a living, ordered list. The top item is always the single most important next action. Do not start item N+1 until item N is done or explicitly unblocked by an external dependency. When you complete an item, archive it and pull the next one up. Review and re-rank weekly.

---

## Current Priority Stack

### P0 — Blocking Go-Live

| # | Action | Owner | Effort | Blocking |
|---|--------|-------|--------|---------|
| 1 | Add `OAUTH_STATE_SECRET` to Replit Secrets with a new generated value | Founder | 15 min | Auth security |
| 2 | Add `VAPID_PRIVATE_KEY` to Replit Secrets with a new generated value | Founder | 15 min | Push notifications |
| 3 | Confirm `CONNECTOR_ENCRYPTION_KEY` exists in Replit Secrets; add if missing | Founder | 15 min | RMM security |
| 4 | Confirm `HF_TOKEN`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `MAPBOX_ACCESS_TOKEN` presence in Replit Secrets | Founder | 30 min | External services |

**How to generate secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### P1 — Required Before Investor or Buyer Engagement

| # | Action | Owner | Effort | Blocking |
|---|--------|-------|--------|---------|
| 5 | ✅ DONE — `INTEGRATION_TEST_TOKEN` removed from source (task #721); tests read from env var. Remaining: add a freshly generated value to GitHub Actions Secrets (`openssl rand -base64 24`) | Founder / Dev | 5 min | CI security |
| 6 | Run full go-live sequence (Phases 0–7) from `docs/internal/ops/go-live-sequence.md` and check off every item | Founder | 3–4 hours | Launch gate |
| 7 | Create smoke test user account in production with a dedicated email (e.g. `smoke@yourdomain.com`) and a unique randomly generated password; store the password in Replit Secrets as `SMOKE_TEST_PASSWORD` — never use a predictable or reused password | Founder | 15 min | Smoke tests |
| 8 | Verify Slack webhook is connected and `#ops-alerts` channel receives a test alert | Founder | 15 min | Incident detection |
| 9 | Load demo seed data and verify all domain apps display representative data (`pnpm run seed:demo`) | Founder | 30 min | Demo readiness |

---

### P2 — Required Before First External Demo

| # | Action | Owner | Effort | Blocking |
|---|--------|-------|--------|---------|
| 10 | Run the full pre-demo checklist (`ops/cto/founder-launch-kit.md`) against preview/production environment | Founder | 60 min | Demo quality |
| 11 | Review and update all investor-facing docs for accuracy: `docs/investor/product-readiness.md`, `docs/investor/investor-overview.md` | Founder | 45 min | Investor readiness |
| 12 | Confirm support inbox (inquiries@szlholdings.com) is monitored and routing correctly | Founder | 15 min | Buyer response time |

---

### P3 — Required Within First 30 Days

| # | Action | Owner | Effort | Blocking |
|---|--------|-------|--------|---------|
| 13 | Wire Firebase real credentials into CORTEX mobile (`artifacts/cortex-mobile/google-services.json` and `GoogleService-Info.plist`) | Founder / Dev | 1–2 hours | Mobile launch |
| 14 | Create App Store Connect record and Play Console record for CORTEX mobile | Founder | 45 min | Mobile distribution |
| 15 | Link EAS project to the two app store records; configure `app.json` with correct bundle IDs | Dev | 1 hour | EAS build pipeline |

---

## Completed Actions

_Archive completed items here with the date completed._

| # | Action | Completed |
|---|--------|-----------|
| | | |

---

## How to Add New Actions

Before adding a new item:
1. Is this truly a top-15 priority? If not, it belongs in the backlog.
2. Is it something only the founder can do, or can it wait for a future agent/employee?
3. Assign a priority level (P0 / P1 / P2 / P3) using the criteria above.

---

*See also: `ops/cto/manual-actions-left.md` · `ops/cto/founder-launch-kit.md` · `ops/security/secret-inventory.md`*
