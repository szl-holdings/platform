# SZL Holdings — Salesforce AppExchange Security Review Checklist

## 1. Authentication & Authorization

| Control | Status | Notes |
|---------|--------|-------|
| No hardcoded credentials | PASS | All endpoints use Named Credentials |
| Named Credentials configured | PASS | `SZL_API_NC` Named Credential required |
| Apex callouts use Named Credentials | PASS | `SZLApiClient.cls` uses `callout:SZL_API_NC` |
| CSRF protection | PASS | Session-bound tokens; no GET-based state changes |
| Object-level security respected | PASS | All SOQL uses `WITH SECURITY_ENFORCED` |
| Field-level security respected | PASS | `Security.stripInaccessible` applied before DML |

## 2. Data Handling

| Control | Status | Notes |
|---------|--------|-------|
| No PII in debug logs | PASS | Record IDs only; no field values logged |
| Callout payloads sanitized | PASS | JSON.serialize with type-checked DTOs |
| Response deserialization safe | PASS | Typed DTOs via JSON.deserializeStrict |
| Governor limits respected | PASS | Queueable chain pattern; max 1 callout/transaction |
| Bulk-safe triggers | PASS | `OpportunitySZLSync.trigger` processes up to 200 records |

## 3. Apex Code Quality

| Control | Status | Notes |
|---------|--------|-------|
| No dynamic SOQL | PASS | All queries static |
| Exception handling | PASS | Try/catch in all Queueable.execute() methods |
| No System.runAs abuse | PASS | Not used in production code |
| Test coverage ≥ 75% | PENDING | Stub classes provided; org-specific test run required |

## 4. API Integration

| Control | Status | Notes |
|---------|--------|-------|
| TLS 1.2+ enforced | PASS | Named Credential enforces HTTPS |
| Timeout configured | PASS | `HttpRequest.setTimeout(10000)` |
| Retry backoff | PASS | Queueable re-enqueue on 5xx with max 3 retries |
| Sensitive data masked in logs | PASS | Auth headers stripped before logging |

## 5. Packaging

| Control | Status | Notes |
|---------|--------|-------|
| No `global` Apex unless required | PASS | All classes `public` |
| Namespace registered | PENDING | Namespace `szlhld` reserved; confirm in packaging org |
| No undocumented external endpoints | PASS | Single endpoint declared in `Remote Site Settings` |

## 6. Security Review Submission

- [ ] Run PMD Apex scanner — fix all P1/P2 findings
- [ ] Enable "Detect Injection" in Code Analyzer
- [ ] Submit Scanner report with submission
- [ ] Confirm Named Credential URL matches declared Remote Site Setting
- [ ] Verify packaging org has `szlhld` namespace
