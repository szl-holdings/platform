# Customer Setup Checklist — SZL Holdings Platform

**Version:** 1.0 · **Date:** April 2026
**Audience:** New customers, design partners, CS team

> Use this checklist to track setup progress for your SZL Holdings tenant. Share with your CS contact or complete independently using the Admin Setup Guide.

---

## Phase 1: Account & Organization (Day 1)

### Account Setup

- [ ] Sign up at `app.szlholdings.com` or accept invitation link
- [ ] Confirm email address
- [ ] Set a strong password or configure SSO

### Organization Profile

- [ ] Set organization name and slug
- [ ] Select primary industry vertical
- [ ] Set timezone
- [ ] Upload organization logo (optional but recommended)

### Team Invitations

- [ ] Identify team members who need platform access
- [ ] Determine role for each user (owner / admin / member / viewer)
- [ ] Send invitations from Settings → Team → Invite
- [ ] Confirm all invitations accepted (check pending invitations list)

---

## Phase 2: Authentication & Security (Day 1–3)

- [ ] Decide: Standard auth, Google SSO, Microsoft SSO, or Azure AD enterprise SSO
- [ ] If enterprise SSO: Complete Azure AD application registration
- [ ] If enterprise SSO: Test SSO login for at least one user
- [ ] If SCIM: Configure SCIM provisioning endpoint and test user sync
- [ ] Configure admin notification email
- [ ] Review default session settings (adjust if needed for your security policy)

---

## Phase 3: Signal Sources & Data (Day 1–5)

- [ ] Identify signal sources relevant to your vertical (Slack, Jira, SIEM, AIS, etc.)
- [ ] Connect at least one signal source or activate demo data
- [ ] Verify signal ingestion (check Signal Timeline for incoming events)
- [ ] Configure signal routing rules (if needed)

**If using demo data:**
- [ ] Demo signals activated for your selected vertical
- [ ] Confirm demo data is clearly labeled (not confused with real data)
- [ ] Plan for replacing demo data with live sources before production use

---

## Phase 4: Workflows & Governance (Day 3–7)

- [ ] Deploy at least one workflow template from the onboarding wizard
- [ ] Review deployed workflow in Alloy (Factory Floor)
- [ ] Verify workflow is connected to your signal source
- [ ] Walk the Governed Decision Loop at least once:
  - Signal received → context enriched → recommendation generated → simulation run → policy gate evaluated → execution → Proof Chain entry created → Outcome Graph updated → Learning
- [ ] Review the Proof Chain entry for your first governed action

---

## Phase 5: Domain Packs (If Applicable)

*(Complete for each domain pack your subscription includes)*

### Aegis (Security & Defense)

- [ ] Aegis domain pack activated in billing settings
- [ ] SIEM integration configured or demo incidents loaded
- [ ] First incident triaged through exception center
- [ ] SOAR playbook deployed and tested
- [ ] MITRE ATT&CK mapping reviewed for at least one incident

### Vessels (Maritime Intelligence)

- [ ] Vessels domain pack activated
- [ ] AIS feed configured or demo fleet activated
- [ ] Fleet map displaying vessel positions
- [ ] First exception routed through exception center
- [ ] Voyage P&L simulation run for at least one voyage

### Terra (Real Estate Intelligence)

- [ ] Terra domain pack activated
- [ ] NYC distress data pipeline active (or demo properties loaded)
- [ ] First property added to deal pipeline
- [ ] Ownership entity graph explored for at least one property
- [ ] Market signals feed active

### PRISM Counsel (Legal Matter Command)

- [ ] PRISM Counsel pack activated
- [ ] First matter created and team assigned
- [ ] Document upload tested
- [ ] Approval chain configured for matter review
- [ ] Proof Chain entry verified for first matter action

---

## Phase 6: Billing & Entitlements (Day 1)

- [ ] Current plan reviewed and confirmed
- [ ] Payment method on file (credit card or invoice)
- [ ] Billing email address confirmed
- [ ] Usage limits reviewed (seats, workflows, AI calls)
- [ ] Usage notification alerts configured (80% and 95% thresholds)
- [ ] Domain packs activated that are part of your subscription

---

## Phase 7: Admin Configuration (Day 3–7)

- [ ] API keys created for any machine-to-machine integrations
- [ ] Feature flags reviewed and configured for your use case
- [ ] AI model preferences set (LLM provider, trace retention)
- [ ] Notification channels configured (Slack webhook, PagerDuty if applicable)
- [ ] IP allowlisting configured if required by your security policy
- [ ] Audit trail reviewed — no provisioning errors

---

## Phase 8: Go-Live Verification

Before using the platform for real operational decisions:

- [ ] All team members have accepted invitations and logged in
- [ ] SSO and/or SCIM tested with real user accounts
- [ ] At least one real signal source connected and verified
- [ ] At least one production workflow deployed and tested
- [ ] Proof Chain entries verified for test actions
- [ ] Admin contact and notification email confirmed
- [ ] Backup admin designated (in case primary admin is unavailable)
- [ ] Support contact saved: `inquiries@szlholdings.com`
- [ ] Security contact saved: `security@szlholdings.com`

---

## Design Partner Supplement

*For design partners on the direct support track:*

- [ ] Dedicated Slack channel set up with SZL Holdings team
- [ ] Weekly check-in cadence agreed
- [ ] Feedback form shared with team members
- [ ] First use case identified for platform validation
- [ ] Success criteria documented and agreed

---

## Status Summary

Use this section in your own tracking document:

| Phase | Owner | Status | Completion Date |
|-------|-------|--------|----------------|
| Account & Organization | | Not started / In progress / Complete | |
| Authentication & Security | | | |
| Signal Sources & Data | | | |
| Workflows & Governance | | | |
| Domain Packs | | | |
| Billing & Entitlements | | | |
| Admin Configuration | | | |
| Go-Live Verification | | | |

---

## Getting Help

| Need | Contact |
|------|---------|
| Setup questions (design partner) | Your dedicated Slack channel |
| General setup questions | `inquiries@szlholdings.com` |
| Enterprise / SSO questions | `inquiries@szlholdings.com` — subject: ENTERPRISE SETUP |
| Security questions | `security@szlholdings.com` |
| Billing questions | `inquiries@szlholdings.com` — subject: BILLING |
| Documentation | `/docs` |

---

## Related Documents

| Document | Path |
|----------|------|
| Admin setup guide | `ADMIN_SETUP_GUIDE.md` |
| Onboarding strategy | `ONBOARDING_STRATEGY.md` |
| First 10 minutes | `FIRST_10_MINUTES.md` |
| Support model | `SUPPORT_MODEL.md` |
| Access control matrix | `ACCESS-CONTROL-MATRIX.md` |
