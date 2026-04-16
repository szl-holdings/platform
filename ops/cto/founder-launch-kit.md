# Founder Launch Kit

**Owner:** Founder  
**Last updated:** April 2026  
**Version:** 1.0

---

## Purpose

This kit contains every checklist the founder needs from first demo to post-release follow-up. Work through each checklist in order. Do not skip items — each one closes a real failure mode.

---

## Checklist 1 — Pre-Demo Checklist

Run this 30–60 minutes before every investor, buyer, or press demo.

### Environment

- [ ] API server is running and `/api/health/live` returns 200
- [ ] All web apps load without console errors (open DevTools and check)
- [ ] Demo seed data is loaded (`pnpm run seed:demo`)
- [ ] No stale data from a prior demo run visible in any UI
- [ ] Browser cache cleared (Cmd+Shift+R or Ctrl+Shift+R)
- [ ] Browser is Chrome or Edge (most compatible, safest for demos)
- [ ] Screen sharing is tested and the correct monitor is selected
- [ ] Zoom / Meet / Teams is muted before sharing; test audio

### Content

- [ ] Demo script reviewed (`ops/cto/founder-demo-script.md`)
- [ ] Key talking points for this audience refreshed
- [ ] Any customer-specific data or scenario prepared
- [ ] Investor data room link confirmed accessible (if sharing during demo)
- [ ] Backup slide deck open in second window in case internet drops

### Access

- [ ] Demo account credentials available (retrieve from Replit Secrets: `SMOKE_TEST_PASSWORD`)
- [ ] Admin console bookmarked: `/api/health/detailed`
- [ ] Fallback: screenshots or screen recording available if live demo fails

### Final 5-Minute Check

- [ ] Open SZL Holdings homepage — verify hero and nav render correctly
- [ ] Open Aegis (`/aegis/`) — verify sidebar and workspace switching
- [ ] Open Terra (`/terra/`) — verify map and property pipeline visible
- [ ] Open Vessels (`/vessels/`) — verify fleet list loads
- [ ] Open Carlota Jo (`/carlota-jo/`) — verify client portal accessible
- [ ] Open Command Portal (`/command/`) — verify mode switching works
- [ ] Audio/video test complete

---

## Checklist 2 — Pre-Release Checklist

Run before every production deployment.

### Code Quality

- [ ] All CI gates passing: `pnpm run typecheck`, `pnpm run lint`, `pnpm run build`
- [ ] Dependency audit clean: `pnpm audit --audit-level high` returns zero high/critical
- [ ] Secret scan clean: no secrets in committed code
- [ ] Integration tests passing: `pnpm run test`
- [ ] No open SEV-1 or SEV-2 bugs

### Configuration

- [ ] `NODE_ENV=production` confirmed in deployment environment
- [ ] `CORS_ORIGINS` set to production domain list only
- [ ] `DATABASE_URL` pointing to production database
- [ ] All required secrets present in Replit Secrets (see `ops/security/secret-inventory.md`)
- [ ] `SESSION_SECRET` is a unique production value (not dev value)
- [ ] `OAUTH_STATE_SECRET` confirmed in Replit Secrets
- [ ] `VAPID_PRIVATE_KEY` confirmed in Replit Secrets
- [ ] `FIELD_ENCRYPTION_KEY` confirmed in Replit Secrets
- [ ] Database migrations applied: `pnpm run db:migrate` ran successfully
- [ ] Demo seed data does NOT auto-load in production (`seed:demo` is not in startup)

### Security

- [ ] Helmet CSP headers enabled and verified in production responses
- [ ] HSTS (`Strict-Transport-Security`) header present
- [ ] `X-Frame-Options: DENY` present
- [ ] Rate limiting active on `/api/auth/login` and `/api/auth/register`
- [ ] CSRF token endpoint reachable: `GET /api/auth/csrf-token`
- [ ] WebSocket connection tested end-to-end (HMAC ticket auth)
- [ ] No sensitive data visible in page source or network requests

### Smoke Test (Staging/Preview)

- [ ] `/api/health/live` → 200
- [ ] `/api/health/ready` → 200 with DB connected
- [ ] Login and logout cycle completes
- [ ] At least one domain app loads data correctly
- [ ] Rollback SHA documented: `ops/cto/release-log.md` updated

---

## Checklist 3 — Launch Day Checklist

Run on the day of production go-live.

### T-4 Hours

- [ ] Final staging smoke test complete — all green
- [ ] `ops/cto/release-log.md` entry prepared (pending SHA)
- [ ] On-call founder phone charged and accessible
- [ ] Slack alert channel (`#ops-alerts`) monitored
- [ ] Rollback plan confirmed: know the previous deployment URL

### T-1 Hour

- [ ] All team (if any) aware of launch window
- [ ] Investor/buyer notification draft ready (held, not sent)
- [ ] Support inbox (inquiries@szlholdings.com) monitored
- [ ] Data room link confirmed shareable

### Deployment

- [ ] Deploy API server to Reserved VM (Replit deployment)
- [ ] Deploy all web apps (Autoscale) in this order:
  1. szl-holdings (flagship)
  2. aegis
  3. terra
  4. vessels
  5. carlota-jo
  6. command
- [ ] Verify commit SHA matches expected in `/api/health` response
- [ ] `ops/cto/release-log.md` updated with full SHA

### T+15 Minutes (First Health Window)

- [ ] Run full smoke test suite (`ops/observability/post-deploy-smoke-tests.md`)
- [ ] Check Slack: at least one health alert received (confirms alerting is live)
- [ ] All domain apps load without errors
- [ ] Login flow completes for real user account
- [ ] No error spikes in logs (check Replit deployment logs)

### T+1 Hour

- [ ] Analytics events firing: check server telemetry for `user_logged_in`
- [ ] P95 latency baseline confirmed < 500ms
- [ ] Error rate < 1%
- [ ] Investor/buyer notification sent (if planned)

### T+48 Hours (Stability Gate)

- [ ] No SEV-1 or SEV-2 incidents in 48-hour window
- [ ] Error rate stable < 1%
- [ ] No unexpected restart events
- [ ] Post-launch review notes documented
- [ ] Launch declared successful

---

## Checklist 4 — Post-Release Checklist

Run within 24 hours after every production release (not just launch day).

### Verification

- [ ] Release log updated with final SHA and outcome notes (`ops/cto/release-log.md`)
- [ ] Smoke tests re-run and passing
- [ ] No new P0 or P1 alerts in first 24 hours
- [ ] User-facing error rate below baseline (< 1%)
- [ ] DB connection pool healthy (check `/api/health/detailed`)

### Observability

- [ ] Review Replit deployment logs for anomalies
- [ ] Confirm self-monitor running without false positives
- [ ] Confirm provider health probes active

### Operational

- [ ] Rollback SHA documented (in case needed later)
- [ ] Any known issues from this release added to `ops/cto/release-log.md`
- [ ] Slack on-call rotation confirmed for next 48 hours (founder self-coverage at this stage)

---

## Checklist 5 — Buyer Follow-Up Checklist

Run within 24 hours after every buyer conversation (demo, intro call, or evaluation meeting).

### Immediate (Same Day)

- [ ] Meeting notes captured (company, contacts, key concerns, stated timeline, budget signal)
- [ ] CRM or tracking sheet updated with lead status
- [ ] Thank-you email sent within 4 hours of meeting end
- [ ] Any specific questions from the call answered in follow-up email
- [ ] Relevant materials attached: solution brief, security summary, pricing, data room link

### Within 48 Hours

- [ ] Proof-of-concept or pilot proposal drafted if requested
- [ ] Technical evaluation questions answered if raised
- [ ] Next meeting booked or follow-up sequence initiated
- [ ] Internal notes: what would this buyer need to sign? What is the blocker?

### Pilot Conversion (If Moving to Pilot)

- [ ] Pilot scope defined in writing and agreed by both parties
- [ ] Pilot environment prepared (demo seed data, dedicated access)
- [ ] Pilot success criteria defined and documented
- [ ] Pilot timeline confirmed (start date, check-in dates, decision date)
- [ ] Design Partner Agreement or NDA executed if required
- [ ] Pilot kickoff scheduled

---

*See also: `ops/cto/founder-demo-script.md` · `ops/cto/founder-next-90-days.md` · `docs/internal/ops/go-live-sequence.md`*
