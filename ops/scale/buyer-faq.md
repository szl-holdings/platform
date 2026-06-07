# Buyer FAQ

Phase E · SZL Scale, Close, and Operate Pass
Updated: 2026-04-16

## Purpose

Pre-emptive answers to the questions every enterprise buyer asks. All
answers are honest about today's state. No aspirational claims.

---

## Product

**What does SZL Holdings actually do?**
SZL Holdings is a governed decision infrastructure platform. It runs
multi-domain workloads through a canonical 9-step decision loop —
Signal, Context, Recommendation, Simulation, Policy, Execution, Proof,
Outcome, Learning — and produces an auditable record (proof chain) for
every automated decision. Today it serves seven canonical domain
surfaces: defense intelligence (Aegis), maritime (Vessels), real estate
(Terra), advisory (Carlota Jo), unified ops (Command), the SZL flagship
portfolio surface, and the CORTEX mobile command app.

**Is the product ready for production use?**
The flagship and Carlota Jo are operational. Aegis, Terra, Vessels,
and Command are functional alphas — UIs are real and the data model is
real, but several live data sources (STIX/TAXII, AIS feeds, MLS feeds)
are still in demo mode and require integration work for production
deployments. CORTEX mobile is alpha; not yet in app stores. Honest
status per product is in `ops/frontier/market-benchmark-gap-analysis.md`.

**Who else uses it?**
At the time of this document the platform is in design-partner phase.
Reference availability requires explicit per-use approval per design
partner.

---

## Architecture

**How is it deployed?**
Today: Replit Autoscale managed deployment. The Production deployment
slot, secrets, and pager are stood up via the documented cutover path
in `ops/scale/production-cutover-checklist.md`; live operator status of
those items is tracked in `ops/scale/manual-actions-left.md` and
`ops/scale/go-live-readiness-verdict.md`. Custom-cloud deployments (the
buyer's AWS/GCP/Azure) are a roadmap item, not currently available.

**What database?**
Replit-managed PostgreSQL. 569 tables across 116 schema files in
`lib/db`. Drizzle ORM. All schemas reviewed and forward-only migrations.

**How is auth done?**
Clerk for end-user auth (SSO via OIDC). Server-side session validation.
RBAC with 11-role hierarchy enforced in API middleware. Internal
service tokens carry their own auth path with rate limiting and audit.

**What AI providers do you use?**
OpenAI, Anthropic, Gemini, accessed through the Replit AI Integrations
proxy. Provider tokens are not in source. Buyer-specific provider
preferences are configurable.

**Multi-tenant model?**
Single-tenant per customer organization. Cross-tenant data access is
guarded by `callerOrgIds` + `inArray` patterns at the query layer.
Cross-tenant leakage detection is a Tier 1 telemetry alarm.

---

## Security

**Are you SOC 2 / ISO 27001 certified?**
Not yet. Controls aligned to SOC 2 Trust Services Criteria are in
place — see `ops/security/production-hardening-checklist.md`. Audit
trail, encryption, access controls, vulnerability management, and
incident response are all documented and operating. Certification path
will start when buyer demand justifies the investment.

**Where do you store secrets?**
Replit Secrets panel for production. `.replit` shared env contains only
public values (VAPID public key, NODE_ENV, log level). Mobile credential
files are .gitignored; only `.example` templates are tracked. See
`ops/security/secret-inventory.md`.

**Do you encrypt data at rest?**
Yes. Replit-managed PostgreSQL encrypts at rest. Field-level encryption
(AES-256-GCM with HMAC-SHA256 key derivation) is applied to fields
classified as Restricted (PII, regulated data) using
`FIELD_ENCRYPTION_KEY`.

**Do you encrypt in transit?**
Yes. TLS via Replit proxy. HSTS, CSP, X-Frame-Options enforced via
Helmet. CORS restricted to production origin.

**How do you handle secret rotation?**
Documented rotation schedule in `ops/security/rotate-now.md`:
session/encryption secrets every 90 days; AI provider keys every 180 days.

**What about pen testing?**
No third-party pen test completed yet. Internal scans run via the
security CI workflows (`security.yml`, `codeql.yml`, `dependency-review.yml`).
A pen test is committed to before any contract requiring one.

**Do you log audit events?**
Every sensitive action passes through `lib/audit`. Audit log gaps are
treated as a P1 minimum. Logs are append-only in PostgreSQL.

**What is the proof chain?**
Every automated decision the platform makes records a proof chain entry
including step, signal references (no payload bodies), recommendation,
policy decision, execution outcome. Customers can audit any decision
end-to-end. See `lib/proof-chain` and the proof-chain explainer in
`customer-launch-pack.md`.

---

## Data

**Where is data stored geographically?**
Wherever Replit's managed PostgreSQL stores it for our deployment region.
Buyer-specific data residency is a roadmap item.

**Can we extract our data?**
Yes. Standard data export is per-table CSV / JSON via authenticated API.
Bulk export is a manual operator action documented in
`manual-console-actions-master.md`.

**What happens to our data on termination?**
Returned in the format of the buyer's choosing (CSV/JSON), then deleted
within 30 days, with a written deletion confirmation. This is in the
DPA template.

**Subprocessors?**
- Replit (hosting + managed Postgres + secrets)
- Clerk (authentication)
- Stripe (billing, only when active)
- OpenAI / Anthropic / Google (AI inference, via Replit AI Integrations
  proxy)
- Sentry (mobile crash reporting; buyer-opt-in)

The current list is small and stable. Material changes to the
subprocessor list are notified to enterprise customers in advance per
DPA.

---

## Operations

**What is your uptime SLA?**
99.9% target. SLA is offered in the order form for enterprise customers.
Underlying: Replit Autoscale + smoke-test gated deploys + Tier 1
telemetry per `ops/scale/telemetry-priority-matrix.md`.

**How do you handle incidents?**
Documented severity model in `ops/scale/incident-triage-model.md`. P0
acked within 15 minutes 24×7; postmortem within 48 hours. Customers
notified via Slack Connect or email per their preference.

**How do you ship changes?**
Release train per `ops/scale/release-train-model.md`. Every change
passes lint, typecheck, unit tests, code review, staging deploy, smoke
tests, and explicit founder release approval before reaching Production.

**Mobile?**
CORTEX mobile (`artifacts/szl-holdings-mobile`) is the canonical mobile
app. Currently in alpha; TestFlight + Play Internal once EAS credentials
are operator-set. Expected production app store availability:
buyer-discussed timeline.

---

## Commercial

**Pricing?**
Annual contracts, named-user-based with a workload-tier modifier.
Specific pricing in the order form per opportunity.

**Contract paper?**
Either. SZL has a standard MSA + DPA + order form. Will negotiate on
buyer paper for enterprise.

**Limit of liability?**
Standard cap at 12 months trailing fees. Negotiable upward for
enterprise.

**IP indemnity?**
Standard third-party IP indemnity for the SZL-developed software.
Excludes buyer-supplied data.

**Source code escrow?**
Available on request for enterprise contracts >$500k ARR.

---

## Anything not in this FAQ

Send to founder. Answer goes back within 2 business days. The new
question and answer are added to this FAQ on resolution.
