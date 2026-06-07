# Manual Actions Left

**Date:** April 2026  
**Purpose:** Complete list of manual actions not yet done — organized by urgency. These are not product tasks. They are operational and commercial actions that require human execution.

---

## Priority 1: Required Before First Pilot Kickoff

These must be done before any design partner pilot goes live.

### Platform

- [ ] **Run full smoke test suite** — verify all web apps load, API health passes, auth flow works
  - Where: command line or browser
  - Reference: `post-deploy-verification-final.md` Tier 3

- [ ] **Confirm all Replit Secrets are set** — review secret inventory for any "unknown" items
  - Where: Replit Secrets panel
  - Reference: `ops/security/secret-inventory.md`

- [ ] **Confirm OAUTH_STATE_SECRET is set** — was removed from `.replit` shared config
  - Where: Replit Secrets panel
  - Action: Generate new value with `openssl rand -hex 32`, set in Replit Secrets

- [ ] **Confirm VAPID_PRIVATE_KEY is set** — was removed from `.replit` shared config
  - Where: Replit Secrets panel
  - Action: Generate new VAPID key pair, set private key in Replit Secrets, update public key in `.replit` shared config

### Commercial

- [ ] **Prepare pilot agreement / LOI template** — needed before first partner signs
  - Where: Create in word processor; consult with attorney if needed
  - Reference: `pilot-to-production-commercial-path.md` (agreement structure)

- [ ] **Prepare DPA template** — needed before any enterprise diligence completes
  - Where: Create or use a standard SaaS DPA template as starting point
  - Reference: `diligence-fast-path-final.md` (procurement path)

- [ ] **Set up partner Slack workspace or channels** — needed for first pilot kickoff
  - Where: Slack (create a workspace or use a shared channel approach)

### Trust Center

- [ ] **Review /trust pages against trust-center-launch-pass.md checklist**
  - Where: Browser — navigate to /trust
  - Action: Verify each section exists and content is accurate

---

## Priority 2: Required Within First 30 Days of Pilot

### Mobile Beta

- [ ] **Register App ID in Apple Developer Portal** — `com.szlholdings.executive.mobile`
  - Where: developer.apple.com → Identifiers
  - Reference: `manual-console-actions-master-final.md` (Apple section)

- [ ] **Create app in App Store Connect** — note the 10-digit ASC App ID
  - Where: appstoreconnect.apple.com → My Apps
  - Reference: `ops/mobile/testflight-play-internal-runbook.md`

- [ ] **Update `eas.json` with real Apple credentials** — `appleId`, `ascAppId`, `appleTeamId`
  - Where: `artifacts/szl-holdings-mobile/eas.json`

- [ ] **Run first EAS iOS build** — `eas build --profile preview --platform ios`
  - Where: Terminal in `artifacts/szl-holdings-mobile/`

- [ ] **Create Google Play Console app** — complete mandatory store listing
  - Where: play.google.com/console
  - Reference: `manual-console-actions-master-final.md` (Google section)

- [ ] **Create Google Play service account** — download JSON key for EAS submit
  - Where: Google Cloud Console → IAM → Service Accounts

- [ ] **Set up EAS project** — `eas init` in mobile directory
  - Where: Terminal in `artifacts/szl-holdings-mobile/`

### Billing

- [ ] **Configure Stripe price IDs** for design partner pricing tier
  - Where: Stripe dashboard → Products → Create price
  - Reference: `pilot-to-production-commercial-path.md` (billing activation)

- [ ] **Confirm Stripe secret key is set in Replit Secrets**
  - Where: Replit Secrets + Stripe dashboard

---

## Priority 3: Required Before First Production Agreement

### Legal

- [ ] **Finalize MSA template** — Master Services Agreement
  - Reference: `pilot-to-production-commercial-path.md` (MSA section)
  - Note: Have attorney review before first use

- [ ] **Confirm /legal/privacy is published and accurate**
  - Where: Browser → /legal/privacy

- [ ] **Confirm /legal/terms is published and accurate**
  - Where: Browser → /legal/terms

### Security

- [ ] **Commission penetration test** — required before production customer
  - Who: Third-party security firm
  - Timing: 4–8 weeks before planned first production agreement

- [ ] **Set up external log sink** — tamper-proof logging for compliance
  - Reference: `ops/security/threat-model-summary.md` (known gaps)

### Staging

- [ ] **Set up staging environment** in Replit
  - Reference: `environment-and-release-final.md` (staging section)

---

## Priority 4: Before Public Product Announcement / Press

- [ ] **Verify no internal paths or secrets in GitHub public repo**
  - Where: GitHub → search repo for any hardcoded values

- [ ] **Create GitHub release for current version** (if not already done)
  - Reference: `ops/github/release-plan.md`

- [ ] **Confirm CORS_ORIGINS is set correctly for production domain**
  - Where: Replit production deployment settings

- [ ] **Set up PostHog or equivalent analytics on szl-holdings public site**
  - Reference: `ops/growth/analytics-implementation-plan.md`

---

## Priority 5: Rotation Schedule (Recurring)

Set calendar reminders for these — they are not one-time tasks:

| Action | Frequency | Set Reminder For |
|---|---|---|
| Rotate SESSION_SECRET | Every 90 days | July 2026 + every 90 days |
| Rotate FIELD_ENCRYPTION_KEY | Every 90 days | July 2026 + every 90 days |
| Rotate ALLOY_INTERNAL_TOKEN | Every 90 days | July 2026 + every 90 days |
| Rotate AI provider keys | Every 180 days | October 2026 + every 180 days |
| Review secret inventory | Quarterly | July 2026 + quarterly |
| Renew Apple Developer membership | Annual | Set based on renewal date |

---

## What Is NOT on This List

These are engineering tasks (separate from manual console actions):

- Adding Zod validation to remaining routes (code task)
- CI/CD pipeline setup (engineering task)
- WebSocket timeout enforcement (code task)
- AI provider circuit breakers (code task)
- Webhook implementation (code task)
- Database query timeout enforcement (code task)

These belong in the engineering backlog, not this manual actions list.

---

*See also: `founder-next-15-actions.md` (prioritized next actions), `founder-launch-kit.md` (operational checklists)*
