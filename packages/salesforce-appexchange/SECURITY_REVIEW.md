# AppExchange Security Review — SZL Platform Connector

## Package Overview

**Package Name:** SZL Platform Connector  
**Namespace:** szlpltfm  
**Version:** 1.0.0  
**Category:** Analytics & Reporting / Productivity  
**Pricing:** Paid (per-org subscription)

---

## Security Checklist

### Authentication & Authorization

- [x] OAuth 2.0 Connected App with least-privilege scopes (`api`, `refresh_token`, `offline_access`)
- [x] No passwords or tokens hard-coded in Apex source
- [x] All credentials stored in Custom Metadata (encrypted at rest by Salesforce platform)
- [x] Permission Set gates access — not granted to all profiles by default
- [x] Remote Site Setting restricts callout target to `https://api.szlholdings.com` only
- [x] HTTPS enforced on all callout endpoints (`disableProtocolSecurity: false`)
- [x] `with sharing` enforced on all Apex classes

### Data Handling

- [x] No subscriber data is stored outside the subscriber Salesforce org, except for intelligence signals explicitly pushed to the SZL platform
- [x] Outbound payloads include only fields specified in integration scope (see SZLPlatformCallout.cls)
- [x] No mass data export — API limits respected (max 50–200 records per call)
- [x] No use of `@SuppressWarnings` or PMD exclusions that bypass security rules

### External Callouts

- [x] All external HTTP callouts use `HttpRequest` with `HttpResponse` error handling
- [x] Callout timeout set to 10,000 ms (well within 120,000 ms limit)
- [x] `@future(callout=true)` used to avoid mixed DML errors
- [x] Callout failures are caught and logged — no uncaught exceptions exposed to end users

### AppExchange Listing Requirements

- [x] `InstallHandler` implemented (`SZLPostInstallScript`)
- [x] Managed package namespace registered: `szlpltfm`
- [x] Connected App admin approval required (`isAdminApproved: true`)
- [x] No use of deprecated APIs (targeting API v59.0)
- [x] Package covers: no Lightning components (scoped to future release)

---

## GDPR / Data Residency

The SZL Platform API endpoint is hosted in the US (AWS us-east-1). Customers with EU data residency requirements should review their DPA with SZL Holdings before enabling sync.

---

## Penetration Test

Penetration test is required for AppExchange listing (schedule via Cobalt or NCC Group before submission). Report to be uploaded to Partner Community.

---

## Contact

**Security contact:** security@szlholdings.com  
**Engineering contact:** integrations@szlholdings.com
