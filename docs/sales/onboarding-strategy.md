# Onboarding Strategy — SZL Holdings Platform

**Version:** 1.0 · **Date:** April 2026
**Audience:** Product, engineering, customer success, design partners

---

## Purpose

This document defines the first-run experience for new tenants on the SZL Holdings platform — from initial account creation through first meaningful outcome. It covers the full onboarding journey for all buyer profiles, with Lyte as the primary entry product.

---

## Onboarding Philosophy

The platform is built for operators who make high-stakes decisions. Onboarding must match that quality bar. We do not offer a generic product tour. We deliver a **first meaningful outcome** — a moment where the customer sees the platform generating real value in their operational context — within the first session.

**Core principles:**

1. **Shortest path to value** — Every step in onboarding must justify its existence against the time it consumes. If a step does not move the user closer to their first meaningful outcome, remove it.
2. **Progressive disclosure** — Surface the right capability at the right moment. Do not overwhelm with the full feature set on day one.
3. **Defaults that work** — Sensible defaults for every configuration. Operators should not need to configure the platform to experience it.
4. **Visible governance from step one** — The platform's core differentiator is governed intelligence. The Proof Chain, Covenant Policy, and Alloy workflow surface should be visible and legible from the first session.
5. **Real data orientation** — Where possible, use the customer's context (their domain, their team structure, their workflows) rather than generic demo data.

---

## Tenant Profiles

| Profile | Entry Product | Onboarding Track | Time to Value Target |
|---------|--------------|-----------------|---------------------|
| Operations Lead (50–500 employees) | Lyte | Self-service SaaS | < 15 minutes |
| CISO / SOC Lead | Aegis | Design partner guided | < 1 hour |
| Maritime Fleet Executive | Vessels | Sales-assisted | < 2 hours |
| NYC Real Estate Broker | Terra | Self-service SaaS | < 20 minutes |
| Legal Partner | Counsel | Sales-assisted | < 2 hours |
| Carlota Jo Client | Carlota Jo | White-glove | Intake call |
| Enterprise (multi-domain) | Command | Sales-assisted | Dedicated success |

---

## Onboarding Journey — Primary Track (Lyte Self-Service)

### Phase 0: Pre-Signup

**Touchpoints:** szlholdings.com, product pages, LinkedIn, GitHub

**Goal:** Prospect understands the core proposition and self-qualifies before signing up. They arrive at signup with a clear expectation of what the platform does and why it matters to them.

**Content assets:**
- Product page with 60-second value proposition
- Governed Decision Loop demo (interactive, no login required)
- Trust Center (security posture, compliance, architecture)

---

### Phase 1: Signup & Tenant Creation (Minutes 0–3)

**Entry:** `/signup` or invitation link

**Steps:**

1. **Account creation** — Email + password or SSO (Google, Microsoft). OIDC flow automatically creates a session.
2. **Tenant provisioning** — System creates a new `organizations` record. User assigned `owner` role automatically.
3. **Organization setup** — Name, slug, primary domain, timezone. Industry vertical selection (maps to recommended domain pack).
4. **Plan selection** — Free trial auto-applied. Upgrade path visible but not required.

**Empty state handling:** No blank dashboards. Tenant is provisioned with demo-mode data for their selected vertical so the dashboard is populated on first login.

**Error states:**
- Email already in use → redirect to login with "sign in instead" prompt
- Domain taken → suggest variations or contact support
- SSO misconfiguration → clear error with link to SSO setup guide

---

### Phase 2: Admin First-Run Setup (Minutes 3–8)

**Entry:** Post-signup onboarding wizard (`/onboarding`)

**The wizard covers four steps:**

#### Step 1 — Organization Profile (1 minute)
- Logo upload
- Primary timezone
- Notification email
- Industry context (used to pre-configure signal templates)

#### Step 2 — Invite Your Team (2 minutes)
- Email invitation flow — up to 5 users in the wizard
- Role assignment per invite (admin, member, viewer)
- Skip option — solo exploration is valid
- Invitations land as pending until accepted; dashboard shows pending count

#### Step 3 — Connect a Signal Source (2 minutes)
- Choose one: Slack, Jira, GitHub, Salesforce, CSV upload, or "skip — use demo data"
- OAuth flow for each connector
- "Use demo data" is the recommended default for first session — sets up synthetic operational signals so the user can experience the full loop without needing integration setup

#### Step 4 — Launch Your First Workflow (1 minute)
- Pre-built workflow templates (approval chain, incident triage, deal review)
- Select one → it deploys via Alloy instantly
- User sees the workflow appear in the action queue

**First meaningful outcome:** At the end of the wizard, the user is looking at a live action queue with pending decisions, a workflow running, and the Proof Chain recording the session. This is the "aha moment."

---

### Phase 3: Domain Orientation (Minutes 8–15)

**Entry:** First time on main dashboard post-wizard

**Orientation checklist** (persistent sidebar card, collapsible):

- [ ] Connect a second signal source
- [ ] Approve your first pending action
- [ ] View the Proof Chain for a completed action
- [ ] Run a Monte Carlo simulation on an open decision
- [ ] Invite a team member

Each item links to the relevant surface. Completed items show a checkmark. The checklist dismisses after all items are complete or after 30 days.

**Contextual tooltips:** First-visit tooltips on key surfaces (action queue, proof chain viewer, governance audit). These appear once, dismiss on interaction, and do not repeat.

---

### Phase 4: First Meaningful Outcome

**Target:** User has approved or triaged one real decision (or demo decision) with a Proof Chain entry created.

This is the activation event. It triggers:
- Welcome email with summary of the session
- Onboarding completion metric recorded
- Follow-up from customer success (for design partner track)
- Activation prompt: "Add a domain pack to extend your intelligence"

---

## Onboarding Journey — Enterprise Track

Enterprise customers are onboarded through a dedicated success process:

1. **Kickoff call** (Founder / CS) — requirements review, data sources, role mapping
2. **Tenant provisioning** — Admin provisions org via internal tooling
3. **SCIM configuration** — Azure AD integration for user provisioning
4. **SSO setup** — OIDC configuration with enterprise IDP
5. **Data source integration** — Custom connectors or ETL setup
6. **Role mapping** — Enterprise groups → platform roles
7. **Pilot workflow deployment** — First production workflow deployed with monitoring
8. **Success criteria review** — First 30-day check-in against agreed KPIs

**Timeline:** 5–10 business days to first production use

---

## Onboarding for Domain Pack Expansion

When an existing tenant adds a domain pack:

1. **Pack activation** — Admin enables pack from billing/entitlements settings
2. **Pack setup wizard** — Domain-specific data source configuration (e.g., AIS feed for Vessels, NYC public records for Terra)
3. **Template deployment** — Pre-built domain pack workflows deployed to Alloy
4. **First domain action** — Platform prompts user to triage the first domain-specific signal

Each domain pack has its own `DOMAIN_PACK_SETUP.md` in `docs/domain-packs/`.

---

## Metrics and Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to first meaningful outcome | < 15 minutes | Session analytics |
| Wizard completion rate | > 80% | Funnel analytics |
| Signal source connected in first session | > 60% | Integration events |
| First workflow activated | > 70% | Alloy events |
| Day-7 retention | > 50% | Login events |
| Day-30 activation | > 40% | First Proof Chain entry created |

---

## Related Documents

| Document | Path |
|----------|------|
| First 10 minutes walkthrough | `FIRST_10_MINUTES.md` |
| Admin setup guide | `ADMIN_SETUP_GUIDE.md` |
| Customer setup checklist | `CUSTOMER_SETUP_CHECKLIST.md` |
| Activation playbook | `ACTIVATION_PLAYBOOK.md` |
| Tenancy model | `TENANCY-MODEL.md` |
| Access control matrix | `ACCESS-CONTROL-MATRIX.md` |
| Support model | `SUPPORT_MODEL.md` |
