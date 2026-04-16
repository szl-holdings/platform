# Support Troubleshooting Guide

Phase C · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

Common problems, the fastest known diagnostic path, and the resolution
path. Founder-friendly first; engineering-deep second. All steps map
to artifacts and routes that exist in this repo today.

## How to Use This Guide

For each issue:

1. Symptom — what the customer reported in their words
2. Confirm — the smallest probe that proves it is happening
3. Likely cause — top 2–3 hypotheses, ranked
4. Fix path — what to do, with file references

If the symptom is not in this guide and is customer-impacting, classify
under `incident-triage-model.md` first, then add the new entry here
once resolved.

---

## 1. "I can't log in"

**Confirm:** Reproduce on the partner's account in an incognito window.

**Likely causes (ranked):**

1. Clerk session expired or device cookie cleared — most common
2. Clerk production instance misconfigured (allowed origins or redirect URI)
3. RBAC role not assigned to the user
4. Workspace has been suspended (billing or admin action)

**Fix path:**

- For (1): walk the partner through cookie clear + retry
- For (2): check Clerk dashboard allowed origins against the production
  domain in `CORS_ORIGINS` — see `ops/scale/environment-promotion-model.md`
- For (3): use `org_admin` to assign the correct role per
  `customer-launch-pack.md` cheat sheet
- For (4): check workspace status; restore if accidental

---

## 2. "The dashboard shows no data"

**Confirm:** Check the workspace via founder login. If founder also sees
empty, escalate.

**Likely causes:**

1. Data was never loaded for that workspace (onboarding missed a step)
2. RBAC scope filter is hiding the data (the row exists, but the user
   cannot read it under their org scope)
3. ATLAS event ingestion stalled for that domain

**Fix path:**

- For (1): re-run the documented import path; never use ad-hoc SQL
- For (2): inspect with `org_admin` role; if rows exist for the org but
  not the user, role assignment is wrong
- For (3): check the ATLAS event envelope flow per
  `staging-and-prod-smoke-tests.md` probes 21–23

---

## 3. "An automated decision looks wrong"

**Confirm:** Pull the proof chain entry for that decision via the
workspace UI or `lib/proof-chain` API.

**Likely causes:**

1. The Recommendation step received bad signal data (Signal step issue)
2. The Policy step blocked an action and it was misread as a wrong decision
3. The model returned an honest "we don't know" that the user expected
   to be a positive answer

**Fix path:**

- Walk the partner through the 9-step loop output for that decision:
  Signal → Context → Recommendation → Simulation → Policy → Execution →
  Proof → Outcome → Learning
- The proof entry will name the step that drove the outcome
- If the user was expecting the system to be sure when it was honestly
  uncertain, the fix is communication, not code

---

## 4. "Push notifications stopped"

**Confirm:** Send a test push from the admin tool.

**Likely causes:**

1. `VAPID_PRIVATE_KEY` rotated without rotating the public key on the
   client — subscriptions are now invalid
2. Service worker scope changed
3. User browser revoked permission

**Fix path:**

- For (1): confirm `VAPID_PUBLIC_KEY` matches the current private key
  per `ops/security/rotate-now.md`; users must re-subscribe
- For (2): check service worker registration in browser dev tools
- For (3): user-side; document in partner FAQ

---

## 5. "Mobile app won't sign in"

**Confirm:** Reproduce on a fresh install with the test account.

**Likely causes:**

1. Biometric enrolment is a separate, additional step on mobile that
   runs after first PIN setup (5-attempt lockout per
   `ops/mobile/flagship-release-readiness.md`)
2. Real Firebase credentials missing in the build
3. The user is on `cortex-mobile` (deferred scaffold) instead of
   `szl-holdings-mobile` (canonical CORTEX) — see
   `artifacts/cortex-mobile/DEFERRED.md`

**Fix path:**

- For (1): walk through PIN-then-biometric setup
- For (2): rebuild via EAS using a profile with real Firebase config
- For (3): direct the user to the correct TestFlight / Play Internal link

---

## 6. "API request returns 503"

**Confirm:** Hit `/api/health/detailed` with the internal token.

**Likely causes:**

1. Database unreachable
2. AI provider timeout cascading to a dependent route
3. Rate limit exceeded (200/15m global, 10/15m on auth)

**Fix path:**

- For (1): check Replit-managed PostgreSQL status; escalate per
  `incident-triage-model.md` "Replit infra" path
- For (2): identify the AI route returning 503; if global, file with the
  provider; if local, check the AI integrations skill proxy
- For (3): the rate limit is intentional; the 503 is correct behavior;
  educate the partner

---

## 7. "Audit log entry is missing"

This is a P1 minimum. Audit log gaps are never normal.

**Fix path:**

- Open P1 incident
- Capture timestamp, actor, action, expected entry
- Engineering inspects `lib/audit` middleware path for that route
- Postmortem mandatory

---

## 8. "I see data from another tenant"

This is P0. Stop. Open a P0 incident immediately.

**Fix path:**

- Snapshot the screen
- Identify the route serving the data
- Engineering inspects `callerOrgIds` + `inArray` guards (see
  `ops/security/threat-model-summary.md`)
- Customer notification per Comms Lead in `incident-triage-model.md`
- Postmortem within 48 hours

---

## Adding a New Entry

When a new issue is resolved, append a new section here with:

- Number, symptom, confirm, likely causes, fix path
- Linked file paths in this repo (no broken refs)
- Date stamp at the top of the section

The list grows; entries are not deleted.
