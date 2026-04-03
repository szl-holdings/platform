# AppExchange Listing — SZL Platform Connector

## Listing Details

**Title:** SZL Platform Connector  
**Tagline:** Real-time CRM intelligence — pipe your Salesforce signals into the SZL decision engine.  
**Category:** Analytics & Reporting  
**Sub-category:** Business Intelligence  
**Pricing model:** Per-org subscription  
**Supported editions:** Professional, Enterprise, Unlimited, Developer  
**Supported Lightning Experience:** Yes  
**Compatible with:** Salesforce API v55.0+

---

## Short Description (150 chars)

Connect Salesforce to SZL Holdings — live pipeline health, escalated case signals, and bi-directional task/case sync in one managed package.

---

## Long Description

The **SZL Platform Connector** is the official managed package that bridges your Salesforce CRM with the SZL Holdings intelligence platform. Once installed, your pipeline data, escalated cases, and converted leads flow automatically into the SZL Alloy signal engine — giving your executive team a unified view of risk, revenue velocity, and operational health across every business unit.

### What you get

**Live Pipeline Intelligence**  
Opportunity stage changes, forecast revisions, and win/loss signals are ingested in real time. The SZL engine computes weighted pipeline health, value-at-risk, and deal velocity so your CFO doesn't have to run a report.

**Escalated Case Alerts**  
When a case is escalated in Salesforce, a critical signal is raised in the SZL Command Center within seconds — not on the next nightly batch.

**Bi-Directional Sync**  
Push tasks and cases from SZL directly back into Salesforce. Trigger a Salesforce sync from a Flow or Process Builder using the included Invocable Method.

**Zero Custom Code Required**  
The package ships with a Connected App, Remote Site Setting, Custom Metadata type, Permission Set, and scheduled Apex job. Configuration is done in the Setup Wizard — no development needed for standard deployments.

**Security-First**  
OAuth 2.0. No hard-coded credentials. All callouts restricted to `api.szlholdings.com` via Remote Site Setting. `with sharing` enforced on all Apex. Passes AppExchange Security Review requirements.

---

## Screenshots (placeholder — add before submission)

1. `screenshot_01_pipeline_dashboard.png` — SZL Pipeline Health view sourced from Salesforce
2. `screenshot_02_signal_feed.png` — Escalated case signals in the Alloy Signal Feed
3. `screenshot_03_setup_wizard.png` — Post-install OAuth setup wizard
4. `screenshot_04_bidirectional_sync.png` — Task push from SZL to Salesforce

---

## Supported Languages

English (United States)

---

## Support

**Documentation:** https://szlholdings.com/integrations/salesforce  
**Support email:** support@szlholdings.com  
**SLA:** Business hours response (9 AM–6 PM ET, Mon–Fri)

---

## Release Notes (v1.0.0)

- Initial release
- OAuth 2.0 Connected App with Admin approval flow
- Custom Metadata-based configuration (no hard-coded credentials)
- `SZLPlatformCallout` — outbound signal delivery and sync trigger
- `SZLPostInstallScript` — auto-schedules hourly sync on install
- `SZLHourlySyncJob` — scheduled Apex for periodic signal ingest
- `SZL_Platform_Connector_Access` Permission Set
- Remote Site Setting for `api.szlholdings.com`
