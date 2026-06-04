# Founder Next 15 Actions

**Date:** April 2026  
**Purpose:** The 15 most important actions to take, in priority order, starting now. No ambiguity. No "it depends." Just the list.

---

## How to Use This

Work through these in order. Do not skip to action 7 because it looks easier than action 3. The ordering reflects dependencies and commercial impact.

Each action has an estimated time, a reference document, and a done state. "Done" means it is done — not "in progress" and not "mostly done."

---

## Action 1: Draft the Pilot Agreement Template

**Why first:** Nothing moves until there is a document for partners to sign.  
**Time:** 2–4 hours (draft), 1–2 weeks (attorney review if possible)  
**Done when:** A one-page LOI and a 3-page pilot agreement exist that can be sent to any qualified prospect.  
**Reference:** `pilot-to-production-commercial-path.md` (agreement structure section)  

Minimum contents:
- Pilot scope (domain pack, user count, window)
- Mutual confidentiality
- Data handling summary
- Success metric agreement placeholder
- Referenceability discussion clause
- Commercial path acknowledgment (design partner pricing lock)

---

## Action 2: Generate and Set OAUTH_STATE_SECRET in Replit Secrets

**Why:** This secret was removed from `.replit` shared config but not yet added to Replit Secrets with a new value.  
**Time:** 10 minutes  
**Done when:** Secret is confirmed set in Replit Secrets panel.  
**How:**
```bash
openssl rand -hex 32
# Copy the output. Set it as OAUTH_STATE_SECRET in Replit Secrets panel.
```

---

## Action 3: Generate and Set VAPID_PRIVATE_KEY in Replit Secrets

**Why:** Same as above — removed from shared config, needs to be set with a valid key pair.  
**Time:** 15 minutes  
**Done when:** New VAPID key pair generated; private key in Replit Secrets; public key updated in `.replit` shared config.  
**How:**
```bash
node -e "const webpush = require('web-push'); const keys = webpush.generateVAPIDKeys(); console.log(keys);"
# Set VAPID_PRIVATE_KEY to the privateKey value in Replit Secrets
# Update VAPID_PUBLIC_KEY in .replit shared config with the publicKey value
```

---

## Action 4: Qualify Top 3 Pipeline Prospects

**Why:** The commercial motion starts with qualified partners. Until someone is in a pilot, everything else is preparation.  
**Time:** 3 × 30-minute calls  
**Done when:** Each prospect is classified as qualified / not yet / no fit, with documented reason.  
**Reference:** `design-partner-offer.md` (qualification criteria), `design-partner-operating-model.md` (qualification call agenda)  

If there are not 3 prospects in the pipeline: outreach to 10 relevant contacts this week to start conversations.

---

## Action 5: Run Full Platform Smoke Test

**Why:** Before inviting partners onto the platform, verify everything works.  
**Time:** 30–60 minutes  
**Done when:** All Tier 1 automated checks pass AND Tier 2 manual spot-check passes.  
**Reference:** `post-deploy-verification-final.md`

---

## Action 6: Verify Trust Center at /trust

**Why:** Design partners will look at it. External diligence will look at it. It must be accurate.  
**Time:** 60–90 minutes  
**Done when:** Each section reviewed against `trust-center-launch-pass.md` checklist; inaccurate or missing content corrected.  

---

## Action 7: Sign Pilot Agreement with First Qualified Partner

**Why:** A signed agreement makes the pilot real.  
**Depends on:** Action 1 (agreement template), Action 4 (qualified partner)  
**Time:** 1–2 hours (negotiation), depends on partner legal review  
**Done when:** Signed agreement in hand.  

---

## Action 8: Complete First Design Partner Kickoff

**Why:** The pilot is not live until the kickoff happens.  
**Depends on:** Action 7  
**Time:** 2–4 hours  
**Done when:** All items on the kickoff checklist in `founder-launch-kit.md` are checked off.  

---

## Action 9: Complete Baseline Document with First Partner

**Why:** Without a baseline, there is no delta. Without a delta, there is no case study.  
**Depends on:** Action 8  
**Time:** 1–2 hours with partner  
**Done when:** Baseline document completed and partner has reviewed and agreed it is accurate.  
**Reference:** `proof-engine-final.md` (Stage 1: Baseline)  

---

## Action 10: Set Up EAS Project for szl-holdings-mobile

**Why:** Mobile beta is blocked on this configuration step.  
**Time:** 1–2 hours  
**Done when:** `eas init` completed in `artifacts/szl-holdings-mobile/`, EAS project UUID set in `app.json`, first internal build successfully created.  
**Reference:** `mobile-beta-final.md` (EAS configuration section)  

---

## Action 11: Register App in Apple Developer Portal and App Store Connect

**Why:** TestFlight cannot be activated without a registered app.  
**Depends on:** Action 10  
**Time:** 1–2 hours  
**Done when:** App ID registered, app created in App Store Connect, ASC App ID noted and added to `eas.json`.  
**Reference:** `manual-console-actions-master-final.md` (Apple section)  

---

## Action 12: Submit First TestFlight Internal Build

**Why:** Partners need mobile access to evaluate CORTEX capabilities.  
**Depends on:** Actions 10, 11  
**Time:** 1–2 hours (build + submit) + Apple processing time  
**Done when:** Build appears in App Store Connect TestFlight, internal testing group created.  

---

## Action 13: Draft MSA and DPA Templates

**Why:** Required before any pilot converts to production.  
**Time:** 4–8 hours (draft), 2–4 weeks (attorney review recommended)  
**Done when:** Both documents drafted and attorney-reviewed (or flagged for review at next commercial engagement).  
**Reference:** `pilot-to-production-commercial-path.md` (agreement structure)  

---

## Action 14: Configure Stripe Billing for Design Partner Tier

**Why:** Cannot activate billing when first partner converts to production without this setup.  
**Time:** 1–2 hours  
**Done when:** At least one price ID is configured in Stripe for the expected design partner pricing range; Stripe secret key is confirmed set in Replit Secrets.  
**Reference:** `pilot-to-production-commercial-path.md` (billing activation section)  

---

## Action 15: Run First 30-Day Checkpoint with Partner

**Why:** The 30-day checkpoint is where you learn if the pilot is working — and course-correct if it is not.  
**Depends on:** Action 8 (pilot live) + 30 days  
**Time:** 30–45 minutes  
**Done when:** Checkpoint meeting held, written summary sent to partner within 24 hours, pilot classified as on track or at risk with action plan.  
**Reference:** `first-30-days-partner-plan.md` (Days 22–30 section)  

---

## The List at a Glance

| # | Action | Time | Depends On |
|---|---|---|---|
| 1 | Draft pilot agreement template | 2–4 hours | — |
| 2 | Set OAUTH_STATE_SECRET | 10 min | — |
| 3 | Set VAPID_PRIVATE_KEY | 15 min | — |
| 4 | Qualify top 3 prospects | 3 × 30 min | — |
| 5 | Run full smoke test | 30–60 min | — |
| 6 | Verify Trust Center | 60–90 min | — |
| 7 | Sign pilot agreement | 1–2 hours | 1, 4 |
| 8 | First partner kickoff | 2–4 hours | 7 |
| 9 | Complete baseline document | 1–2 hours | 8 |
| 10 | Set up EAS project | 1–2 hours | — |
| 11 | Register app in Apple portals | 1–2 hours | 10 |
| 12 | Submit first TestFlight build | 1–2 hours | 11 |
| 13 | Draft MSA and DPA | 4–8 hours | — |
| 14 | Configure Stripe billing | 1–2 hours | — |
| 15 | Run 30-day checkpoint | 30–45 min | 8 + 30 days |

**Parallelizable today (no dependencies):** Actions 1, 2, 3, 4, 5, 6, 10, 13, 14

---

*See also: `manual-actions-left.md` (full manual actions inventory), `founder-next-90-days.md` (90-day plan)*
