# Atlassian Marketplace Listing — SZL Platform Connector for Jira

## Listing Details

**Title:** SZL Platform Connector for Jira  
**Tagline:** Sprint health, SLA signals, and bi-directional sync — powered by SZL intelligence.  
**Category:** Reporting & Analytics  
**Hosting:** Cloud (Atlassian Connect)  
**Distribution:** Server, Data Center NOT supported (Cloud-only)  
**Compatible with:** Jira Software Cloud  
**Partner level:** Solution Partner (apply at partners.atlassian.com)

---

## Short Description (200 chars)

Connect Jira Cloud to the SZL Holdings intelligence platform. Get sprint burndown risk signals, blocked-issue alerts, SLA breach detection, and bi-directional issue sync in one install.

---

## Long Description

**SZL Platform Connector for Jira** is the official Atlassian Connect app that bridges your Jira Cloud projects with the SZL Holdings intelligence platform. Install it once and your sprint health, delivery execution signals, and blocked-issue data flow continuously into the SZL Alloy engine — giving portfolio leadership a real-time view of engineering risk alongside commercial intelligence.

### Features

**Sprint Health Signals**  
Every active sprint is monitored for burndown risk. When velocity falls behind the ideal trend, a warning signal is raised in the SZL Command Center — before your retrospective reveals the problem.

**Blocked Issue Alerts**  
Issues with unresolved blockers trigger immediate `blocked_issues` signals tagged with affected issue keys, sprint name, and project context.

**SLA Breach Detection**  
Service-desk and incident tickets tagged `sla` are monitored continuously. Critical SLA breaches generate `critical` severity signals that surface in executive dashboards.

**Bi-Directional Issue Sync**  
Push Jira issues from the SZL platform into any connected project. Every signal in the SZL Alloy feed can be converted to a tracked Jira ticket with one click.

**Real-Time Webhooks**  
Issue created/updated/deleted, sprint started/closed, and worklog updates are delivered to the SZL platform in real time via Atlassian Connect webhooks — no polling.

**Admin Configuration UI**  
Configure sync interval, feature flags, and connection settings directly within Jira via the embedded admin panel. No Jira admin CLI needed.

**Issue Glance Panel**  
View SZL intelligence signals contextually on any Jira issue without leaving Jira — a side-panel shows linked signals, sprint risk, and a direct link to the SZL platform.

---

## Screenshots (placeholder — add before submission)

1. `screenshot_01_signal_feed.png` — SZL Signal Feed with Jira sprint health signals
2. `screenshot_02_issue_panel.png` — SZL Intelligence glance panel on a Jira issue
3. `screenshot_03_admin_config.png` — Admin configuration page in Jira
4. `screenshot_04_setup_wizard.png` — Post-install OAuth wizard

---

## Privacy & Security

- Cloud-only (no on-prem data storage)
- JWT-authenticated per Atlassian Connect specification
- Scopes: `READ`, `WRITE` (no broader `ACT_AS_USER`)
- Data transmitted only over HTTPS
- Tenant secrets stored encrypted at rest
- Atlassian security review self-assessment completed

---

## Support

**Documentation:** https://szlholdings.com/integrations/jira  
**Support email:** support@szlholdings.com  
**Status page:** https://status.szlholdings.com  
**Atlassian Connect descriptor:** https://api.szlholdings.com/api/atlassian/atlassian-connect.json

---

## Release Notes (v1.0.0)

- Initial Cloud release
- Lifecycle hooks: installed, uninstalled, enabled, disabled
- Webhook subscriptions: issue_created, issue_updated, issue_deleted, sprint_started, sprint_closed, worklog_updated
- Admin configuration page
- Post-install OAuth setup wizard
- Issue Glance web panel with SZL intelligence context
- Full integration with existing SZL Jira adapter (no duplicate logic)
