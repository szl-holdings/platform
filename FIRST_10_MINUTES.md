# First 10 Minutes — SZL Holdings Platform

**Version:** 1.0 · **Date:** April 2026
**Audience:** New users, customer success, design partners

---

## Purpose

This is the definitive walkthrough of the first 10 minutes on the SZL Holdings platform — from landing on the signup page to experiencing the first governed decision. Use this as a reference for customer success calls, design partner onboarding, and product design review.

---

## The Goal

In 10 minutes, a new user will:

1. Create their account and tenant
2. Set up their organization profile
3. Invite a team member (or skip and explore solo)
4. Connect a signal source (or activate demo mode)
5. Deploy their first workflow
6. See the action queue populate with their first pending decision
7. Experience the Proof Chain for the first time

This is not a "click through the features" tour. It is a guided path to first value.

---

## Minute-by-Minute Walkthrough

### Minutes 0–1: Signup

**URL:** `/signup`

**What the user sees:**
- Clean signup form — email, password, or SSO (Google, Microsoft)
- Brief three-word value proposition: "Governed operational intelligence"
- No marketing clutter on the signup page itself

**What happens in the background:**
- OIDC session created
- New `organizations` record provisioned with default settings
- User assigned `owner` role
- Trial subscription activated (14-day free trial with full feature access)
- Onboarding wizard state initialized

**User action:** Enter email + password, or click SSO button. Done. They're in.

---

### Minutes 1–2: Organization Setup (Wizard Step 1)

**URL:** `/onboarding/org-profile`

**What the user sees:**
- "Welcome to SZL Holdings" — brief, direct
- Three fields: Organization name, industry vertical (dropdown), primary timezone
- Logo upload (optional — skip link visible)
- Progress indicator: Step 1 of 4

**What the vertical selection does:**
- Maps to a pre-configured signal template set
- Sets the demo data context (maritime signals for Vessels, property alerts for Terra, etc.)
- Pre-selects recommended workflow templates for Step 4

**User action:** Fill in name, select industry, hit Next. ~60 seconds.

---

### Minutes 2–4: Invite Team (Wizard Step 2)

**URL:** `/onboarding/invite-team`

**What the user sees:**
- "Build your team" header
- Email invite fields for up to 5 users
- Role dropdown per invite: Admin, Member, Viewer
- "Skip for now" prominently available — single explorer is a valid path
- "Why roles matter" expand panel (collapsible, not forced)

**What the invitation flow does:**
- Creates pending invitation records
- Sends email invitations with deep link to accept
- Dashboard shows pending invites count until accepted

**For solo users:**
- Skip is shown as an equal option, not a lesser path
- Platform works fully for a single user

**User action:** Enter up to 5 emails with roles, or click Skip. ~90 seconds.

---

### Minutes 4–6: Connect a Signal Source (Wizard Step 3)

**URL:** `/onboarding/connect-signals`

**What the user sees:**
- "Where do your signals come from?" header
- Connector cards: Slack, Jira, GitHub, Salesforce, CSV upload
- "Start with demo signals" option — recommended, featured prominently
- Brief description under each connector: what data it ingests, what signals it creates

**Recommended path — Demo Signals:**
- One click — no integration required
- Platform activates a synthetic operational signal set tuned to their selected vertical
- Signal feed populates immediately with realistic (not absurd) demo data
- User can replace demo signals with real signals at any time

**Integration path:**
- OAuth flow for each connector (Slack, GitHub, Salesforce)
- CSV upload for custom data
- Connector saves to `integrations` table; signal ingestion begins immediately

**User action:** Click "Start with demo signals" (most common path) or configure integration. ~60–90 seconds.

---

### Minutes 6–7: Deploy First Workflow (Wizard Step 4)

**URL:** `/onboarding/first-workflow`

**What the user sees:**
- "Your first governed workflow" header
- 3–4 pre-built workflow templates relevant to their vertical:
  - *Approval Chain* — Route pending decisions to approvers
  - *Incident Triage* — Classify and assign incoming incidents
  - *Deal Review* — Standardize investment or opportunity review
  - *Exception Escalation* — Auto-escalate high-priority exceptions
- "Deploy" button on each — one click
- Brief explanation of what each template does

**What deployment does:**
- Creates an Alloy workflow record
- Attaches signal sources to the workflow
- Generates synthetic pending decisions in the action queue (if using demo signals)
- Creates first Proof Chain initialization entry

**User action:** Select a template, click Deploy. ~60 seconds.

---

### Minutes 7–10: First Meaningful Outcome

**URL:** `/command` or `/lyte-command-center` (depending on entry product)

**What the user sees upon completing the wizard:**
- Action queue populated with pending decisions from the deployed workflow
- Signal timeline showing correlated activity from connected signals
- First Proof Chain entry visible (workflow initialization)
- Orientation checklist in sidebar — progress so far shown, next steps visible

**The first action moment:**
1. User clicks on a pending decision in the action queue
2. They see: decision context, signal sources, recommendation (AI-generated), simulation parameters, policy gate status, approval chain
3. They click Approve or Route for review
4. Platform records the approval in the Proof Chain
5. Outcome Graph entry created

**This is the "aha moment."**

The user has just made a governed decision — with full audit trail, policy enforcement, and outcome tracking — in under 10 minutes.

---

## Common Paths

### Path A: Solo Explorer (Most Common)
- Skips team invite
- Uses demo signals
- Deploys approval chain template
- Triages first demo decision

**Expected time: 7–9 minutes**

### Path B: Team Admin
- Invites 2–3 team members
- Connects Slack or Jira
- Deploys incident triage template
- Waits for team members to accept invites before triaging first decision

**Expected time: 10–15 minutes** (depends on integration setup)

### Path C: Enterprise Evaluator
- Assisted by CS / founder
- Custom signal source discussion
- Multiple workflow templates deployed
- Live demo of Proof Chain and Covenant Policy

**Expected time: Structured demo session (30–60 minutes)**

---

## What Not to Show in the First 10 Minutes

The following features are high value but should NOT be surfaced in the first 10 minutes — they overwhelm before trust is established:

- Monte Carlo simulation (introduce in Day 3)
- Full MITRE ATT&CK matrix (Aegis — Day 1 for security buyers)
- MCP gateway configuration
- Admin settings panel (beyond wizard)
- Full billing and plan management
- API documentation

These are introduced progressively through the orientation checklist and contextual prompts after activation.

---

## First 10 Minutes by Domain Pack

### Aegis (Security)
- Wizard Step 3: Connect SIEM feed or use demo incidents
- First workflow: Incident Triage (SOAR playbook)
- First outcome: Incident classified, Proof Chain entry, MITRE ATT&CK tag applied

### Vessels (Maritime)
- Wizard Step 3: Demo AIS vessel signals
- First workflow: Exception Escalation
- First outcome: Dark vessel alert triaged, Covenant Policy gate evaluated

### Terra (Real Estate)
- Wizard Step 3: NYC distress signals (demo)
- First workflow: Deal Review
- First outcome: Property added to pipeline, ownership graph explored

---

## Empty State Handling (First 10 Minutes)

No user should ever see a blank dashboard. At every step:

| Surface | Empty State Handling |
|---------|---------------------|
| Action Queue | Populated with 3–5 demo decisions from deployed workflow |
| Signal Timeline | Demo signals appear immediately after Step 3 |
| Proof Chain | Initialization entry appears after wizard completion |
| Team Roster | "Invite your first team member" prompt with direct link |
| Integrations | "Connect a source" with integration cards, demo option featured |

---

## Error Handling (First 10 Minutes)

| Error | User-Facing Message | Resolution |
|-------|--------------------|-----------| 
| Email already registered | "An account with this email exists. Sign in instead?" | Link to login |
| OAuth failure (Slack/GitHub) | "Could not connect. Try again or use demo data." | Retry + skip option |
| Workflow deploy failure | "Workflow setup encountered an issue. We've been notified." | CS notification triggered |
| Session expiry during wizard | "Your session expired. Your progress is saved." | Resume from last step |

---

## Related Documents

| Document | Path |
|----------|------|
| Onboarding strategy | `ONBOARDING_STRATEGY.md` |
| Admin setup guide | `ADMIN_SETUP_GUIDE.md` |
| Activation playbook | `ACTIVATION_PLAYBOOK.md` |
| Customer setup checklist | `CUSTOMER_SETUP_CHECKLIST.md` |
