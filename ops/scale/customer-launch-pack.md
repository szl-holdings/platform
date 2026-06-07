# Customer Launch Pack

Phase A · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

The single bundle of assets handed to a new design partner on signature
day. Everything in one folder; one link to share.

## Bundle Contents

| Asset | Format | Source | Personalize? |
|-------|--------|--------|--------------|
| Welcome letter from the founder | PDF | Founder template | Yes — name, workload, success metric |
| Onboarding tracker | Editable doc | `partner-first-14-days.md` | Yes — copy day-by-day checklist |
| Workspace access guide | PDF | Generated from this doc | Yes — workspace URL, named users |
| RBAC role cheat sheet | PDF | Derived from `lib/services/rbac` | No |
| Data classification + handling note | PDF | DPA companion | Yes — partner data scope |
| Support contact card | PDF | This doc, "Support" section | No |
| Proof chain explainer | PDF | Founder narrative | No |
| Status page link | URL | Replit deployment status | No |
| Slack Connect channel link | URL | Channel created on Day 0 | Yes |
| Roadmap snapshot | PDF | Last published roadmap | No |

## Welcome Letter — Required Elements

- Restates the workload the partner is solving
- Names the success metric and its measurement date
- Names the founder as the primary owner of the relationship
- Lists the four onboarding sessions with dates
- Names the back-channel (Slack Connect) and acceptable response window

## Workspace Access Guide

For each named user:

- Workspace URL (`https://<deploy-host>/<artifact>/`)
- Username (email)
- Initial credential delivery method (Clerk magic link is default; see
  `.local/skills/clerk-auth`)
- RBAC role assigned and what it can / cannot do
- MFA expectation (TOTP, enrolled at first login)
- Session lifetime (24h per current API config — see
  `ops/security/threat-model-summary.md`)

## RBAC Role Cheat Sheet

Surface only the roles the partner will encounter:

| Role | Can do | Cannot do |
|------|--------|-----------|
| `org_admin` | Add/remove users, change roles, view audit log | Delete the workspace, change billing |
| `operator` | All workflow execution + data write | Manage users, see billing |
| `analyst` | Read all workspace data, export, comment | Write data, change config |
| `viewer` | Read assigned dashboards | Export, comment, change anything |

Full role hierarchy lives in `lib/services/rbac` and is enforced in
`artifacts/api-server/src/middlewares/`. The cheat sheet is a
plain-English subset.

## Data Classification Note

Three classes only:

- **Public** — marketing data, public records, synthetic test data
- **Confidential** — partner business data, redacted PII
- **Restricted** — unredacted PII, regulated data (HIPAA, GLBA, etc.)

The platform encrypts Restricted-class fields with `FIELD_ENCRYPTION_KEY`
(AES-256-GCM, see `ops/security/secret-inventory.md`). Restricted data
must be declared in the DPA before load.

## Support Contact Card

| Channel | Use For | Response SLA |
|---------|---------|--------------|
| Slack Connect channel | Day-to-day questions, small issues | Same business day |
| `support@szlholdings.com` | Anything in writing for the record | 1 business day |
| Pager email (TBD before first paying tenant) | Production-down only | 30 min, 24×7 once operational |

The pager channel is currently TBD — see `manual-actions-left.md`.
Until it is stood up, production-down escalates to the founder via
phone (number in the welcome letter).

## Proof Chain Explainer

A one-page founder-written explainer covering:

1. What a proof chain entry is (what the system records on every
   automated decision)
2. What it does **not** record (no payload contents, no PII bodies —
   only references and hashes per `lib/proof-chain`)
3. How the partner can audit any decision
4. How long entries are retained (default: full retention; see
   ATLAS event envelope retention policy in `packages/atlas-events`)

## Roadmap Snapshot

A one-pager carved from the current roadmap. Constraints:

- Names only items already underway or committed for the next quarter
- Marks anything aspirational as such
- Excludes anything not aligned to a canonical product surface

## Distribution

The launch pack is a single shared folder per partner with view-only
permissions, sent as one link in the Day-1 kickoff email. The folder
URL goes in the partner row of the founder pipeline dashboard.

## Refresh Cadence

The launch pack templates are reviewed at the end of every quarter.
Version stamp is in each PDF footer (`v<quarter>`). Out-of-date
material is the second-most-common partner complaint after slow
support response — keep it current.
