# Flow Audit Matrix — SZL Holdings Platform

**Last updated:** 2026-04-16  
**Owner:** Engineering / QA  
**Audience:** VP Engineering, QA Lead, Product, Customer Success

This matrix documents every significant user and admin flow across the SZL Holdings platform. Each row captures the flow's current implementation state, gaps, and quality posture.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Implemented and verified |
| ⚠️ | Partially implemented or has known gaps |
| ❌ | Not implemented or broken |
| N/A | Not applicable to this flow |

---

## 1. Authentication & Identity Flows

| Flow | User Role | Tenant Impact | Entry Point | Happy Path | Edge Cases | Instrumented | Audit Logged | Supportable | Blocking Gaps |
|------|-----------|--------------|-------------|------------|------------|--------------|--------------|-------------|----------------|
| Sign-up (new user) | Anonymous | Creates tenant | `/` landing page | ⚠️ Auth route exists; UI flow is demo-mode only | No email verification | ⚠️ Partial | ✅ Auth events logged | ⚠️ Manual only | No email verification; no guided onboarding trigger |
| Login (returning user) | Any | None | `/login` or OIDC redirect | ✅ Replit OIDC / Azure AD | Session expiry, OIDC misconfiguration | ✅ | ✅ | ✅ | MFA not implemented (KG026) |
| Logout | Any | None | Session clear | ✅ Session cleared | Stale cookie | ✅ | ✅ | ✅ | None |
| Token refresh | Any | None | Auto via middleware | ✅ | Token race on concurrent requests | ⚠️ | ✅ | ✅ | None |
| Password reset | Any | None | N/A (SSO only) | N/A | N/A | N/A | N/A | N/A | No local auth — SSO-only by design |
| MFA enrollment | Any | None | N/A | ❌ Not implemented | N/A | N/A | N/A | N/A | KG026 — planned for enterprise tier |

---

## 2. Onboarding Flows

| Flow | User Role | Tenant Impact | Entry Point | Happy Path | Edge Cases | Instrumented | Audit Logged | Supportable | Blocking Gaps |
|------|-----------|--------------|-------------|------------|------------|--------------|--------------|-------------|----------------|
| First-time user landing | Any | None | `/` | ⚠️ Landing page loads; no guided wizard | User lands with no org context | ⚠️ Partial | ❌ | ⚠️ | No new-user wizard; no empty-state guidance |
| Tenant creation | Admin | Creates org | Admin panel | ✅ API route exists (`POST /admin/tenants`) | Duplicate org name | ✅ | ✅ | ✅ | None |
| Org profile setup | Admin | Updates tenant | Admin settings | ✅ | Missing required fields | ✅ | ✅ | ✅ | None |
| Team member invitation | Admin | Scoped to tenant | Admin → Users | ✅ Invite route exists | Email delivery failures | ⚠️ | ✅ | ⚠️ | No email delivery confirmation |
| Role assignment at signup | Admin | Scoped to tenant | User detail | ✅ | Assigning unsupported role | ✅ | ✅ | ✅ | None |
| Domain pack activation | Admin | Global tenant | Domain Packs | ⚠️ UI present; API mock in places | Insufficient entitlements | ⚠️ | ⚠️ | ⚠️ | Some domain packs use mock data |
| Signal source connection | Admin | Tenant-wide | Settings → Integrations | ⚠️ Alloy integrations UI exists | Auth failure on external system | ⚠️ | ✅ | ⚠️ | No guided troubleshooter |

---

## 3. Core Platform Flows

| Flow | User Role | Tenant Impact | Entry Point | Happy Path | Edge Cases | Instrumented | Audit Logged | Supportable | Blocking Gaps |
|------|-----------|--------------|-------------|------------|------------|--------------|--------------|-------------|----------------|
| First workflow activation | Admin / Operator | Tenant | Workflow Builder | ⚠️ Workflow engine exists; UI activation incomplete | Conflicting triggers | ⚠️ | ✅ | ⚠️ | No walkthrough; empty state sparse |
| Signal ingestion | System | Tenant-scoped | Event Fabric | ✅ Event bus wired | Burst / backpressure | ✅ | ✅ | ✅ | None |
| Recommendation review | Analyst / Operator | Tenant | Action Queue | ✅ | Stale recommendation | ✅ | ✅ | ✅ | None |
| Proof visibility | Any | Tenant-scoped | Proof Chain | ✅ | Missing proof for archived action | ⚠️ | ✅ | ✅ | Proof Chain UI complete; missing deep-link from notification |
| Decision simulation | Analyst | Tenant | Simulation Engine | ✅ | Invalid scenario inputs | ✅ | ✅ | ✅ | None |
| Policy check | System | Tenant | Policy Engine | ✅ | Policy conflict / override | ✅ | ✅ | ✅ | None |
| Approval routing | Manager / Admin | Tenant | Approvals Queue | ✅ | Approver out of office / timeout | ⚠️ | ✅ | ⚠️ | No escalation path for timed-out approvals |
| Action execution | System / Operator | Tenant | Forge Runtime | ✅ | Execution failure / partial run | ✅ | ✅ | ✅ | None |
| Outcome capture | System | Tenant | Outcome Graph | ✅ | Missing outcome mapping | ⚠️ | ✅ | ✅ | None |

---

## 4. Domain-Specific Flows

### Aegis (Defense & Security)

| Flow | User Role | Happy Path | Gaps |
|------|-----------|------------|------|
| Threat intelligence review | SOC Analyst | ✅ | — |
| Incident response activation | Incident Commander | ✅ | OT/ICS live decoder noted as gap (separate task) |
| CISO executive briefing | CISO | ✅ CISO dashboard present | KPI aggregation from new modules not yet wired |
| Security posture score | Admin | ✅ | — |

### Terra (Real Estate)

| Flow | User Role | Happy Path | Gaps |
|------|-----------|------------|------|
| Property portfolio review | Analyst | ✅ | Live market data connection status varies |
| Deal pipeline management | Sales | ✅ | — |
| CRM contact management | Sales / CS | ✅ | — |

### Vessels (Maritime)

| Flow | User Role | Happy Path | Gaps |
|------|-----------|------------|------|
| Voyage P&L review | Operations | ✅ | Freight rate benchmarking gap (separate task) |
| Fleet tracking | Operations | ✅ | — |
| Commercial contracts | Commercial Manager | ⚠️ | Live DB connection for commercial modules (separate task) |

### PRISM Counsel (Legal / Advisory)

| Flow | User Role | Happy Path | Gaps |
|------|-----------|------------|------|
| Matter intake | Attorney / Admin | ✅ | — |
| Document review | Attorney | ✅ | — |
| Recovery data seeding | Dev / QA | ❌ | Broken seed scripts (TD-002) |

---

## 5. Admin Flows

| Flow | User Role | Tenant Impact | Happy Path | Edge Cases | Instrumented | Audit Logged | Blocking Gaps |
|------|-----------|--------------|------------|------------|--------------|--------------|----------------|
| Tenant management | Platform Admin | Cross-tenant | ✅ | Orphaned tenant data | ✅ | ✅ | None |
| User management | Org Admin | Tenant-scoped | ✅ | Removing last admin | ✅ | ✅ | No guard for removing last admin |
| Role assignment | Org Admin | Tenant-scoped | ✅ | Assigning unsupported role | ✅ | ✅ | None |
| Billing management | Platform Admin / Org Admin | Tenant | ⚠️ Billing architecture documented; Stripe/billing backend not wired for all flows | Failed payment / dunning | ⚠️ | ⚠️ | No live billing integration |
| Support intake review | Support | Tenant-scoped | ✅ Support ops documented | Missing SLA timers | ⚠️ | ⚠️ | No SLA enforcement automation |
| Export / Reporting | Analyst / Admin | Tenant-scoped | ✅ Export routes exist | Large datasets / timeout | ⚠️ | ✅ | No streaming export for large payloads |
| Audit log review | Admin | Tenant-scoped | ✅ | Log retention limits | ✅ | ✅ | None |
| System settings | Platform Admin | Global | ✅ | Invalid config | ✅ | ✅ | None |

---

## 6. Mobile Flows (SZL Holdings Mobile / CORTEX Mobile)

| Flow | User Role | Happy Path | Gaps |
|------|-----------|------------|------|
| Mobile login | Any | ✅ Expo auth wired | Deep linking for push notifications (separate task) |
| Workspace navigation | Any | ✅ | — |
| Push notification receipt | Any | ⚠️ Notifications fire | Push → correct workspace deep link missing (separate task) |
| Offline access | Any | ⚠️ Offline engine exists | Full offline data sync coverage varies |
| Mobile-parity feature coverage | Any | ⚠️ | Mobile does not cover all web flows (by design for v1) |

---

## 7. Settings & Notifications

| Flow | Happy Path | Gaps |
|------|------------|------|
| User profile settings | ✅ | — |
| Notification preferences | ✅ | — |
| Email notification delivery | ⚠️ Alloy email route exists | Delivery confirmation not captured |
| Webhook configuration | ✅ | SSRF validation absent on webhook URL (KG020b) |
| API key management | ✅ | — |

---

## Gap Summary

| Category | Critical Gaps | Open Items |
|----------|--------------|------------|
| Auth / Identity | MFA not implemented | KG026 |
| Onboarding | No new-user guided wizard | FLOW-001 |
| Billing | Live billing integration incomplete | FLOW-002 |
| Support | No SLA enforcement automation | FLOW-003 |
| Mobile | Push notification deep linking missing | Separate task queued |
| Seed / Dev | Broken PRISM Counsel seed scripts | TD-002 |
| Webhook | SSRF validation on URLs | KG020b |
| Approvals | No escalation for timed-out approvals | FLOW-004 |

---

*For the full security gap register see KNOWN-GAPS.md. For the launch blocker list see LAUNCH_BLOCKERS.md.*
