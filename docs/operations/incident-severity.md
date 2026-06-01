# Incident Severity Matrix — SZL Holdings Platform

> Classification criteria, response times, and escalation paths for all incident severity levels.

---

## Severity Levels

### SEV1 — Critical

**Definition:** Complete service outage, data breach, or authentication failure affecting all users.

**Criteria (any one is sufficient):**
- Public-facing site is completely down (HTTP 5xx on all routes)
- Authentication system is broken (users cannot log in)
- Data breach or unauthorized data access confirmed or suspected
- Database corruption or data loss
- API server completely unresponsive

**Response time:** 
- Detection to acknowledgment: < 15 minutes
- Detection to active response: < 30 minutes
- Target resolution: < 2 hours

**Escalation:** Immediate notification to Stephen Lutar. All hands on deck.

**Communication:** Status page update every 15–30 minutes.

---

### SEV2 — High

**Definition:** Major feature broken or significant user-facing degradation. Service is partially available.

**Criteria (any one is sufficient):**
- A core product area is inaccessible (e.g., Lyte dashboard 500-ing)
- Contact form submissions failing (revenue/lead impact)
- Authentication broken for a subset of users
- Performance degraded > 50% from baseline
- Database queries failing intermittently
- A recent deployment caused visible regressions

**Response time:**
- Detection to acknowledgment: < 1 hour
- Detection to active response: < 2 hours
- Target resolution: < 8 hours

**Escalation:** Stephen Lutar notified within 1 hour.

**Communication:** Status page update within 1 hour; updates every 2 hours thereafter.

---

### SEV3 — Medium

**Definition:** Non-critical feature broken or isolated issue with limited user impact.

**Criteria:**
- A non-critical route is broken or shows incorrect content
- Minor performance degradation (< 50%)
- A specific user or org experiencing issues (not systemic)
- Analytics or monitoring data inaccurate or missing
- Non-critical API endpoint failing

**Response time:**
- Detection to acknowledgment: < 4 hours
- Target resolution: < 24 hours (next business day acceptable for off-hours detection)

**Escalation:** Engineering lead notified; Stephen informed at next scheduled check-in unless escalation is warranted.

**Communication:** Internal only; status page not updated unless user-facing.

---

### SEV4 — Low

**Definition:** Cosmetic, minor, or low-impact issue.

**Criteria:**
- Visual/styling bug on a non-critical page
- Minor copy error
- Non-functional feature that was already known to be incomplete
- Documentation outdated

**Response time:**
- Acknowledgment: Next business day
- Resolution: Within 5 business days or next release cycle

**Escalation:** No escalation required; log in issue tracker for next sprint.

**Communication:** Internal only.

---

## Severity Decision Tree

```
Is the entire site or auth system down?
  Yes → SEV1

Is a major feature or core route completely broken?
  Yes → SEV2

Is there a confirmed security breach or data exposure?
  Yes → SEV1 (regardless of other criteria)

Is a single non-critical feature broken?
  Yes → SEV3

Is it cosmetic, copy, or minor?
  Yes → SEV4
```

---

## Response Matrix

| Severity | Acknowledge | Active Response | Resolution | Status Page | Escalation |
|----------|-------------|----------------|------------|-------------|------------|
| SEV1 | < 15 min | < 30 min | < 2 hours | Immediate + every 15–30 min | Immediate to Stephen |
| SEV2 | < 1 hour | < 2 hours | < 8 hours | Within 1 hour | Within 1 hour to Stephen |
| SEV3 | < 4 hours | < 8 hours | < 24 hours | Internal only | Next check-in |
| SEV4 | Next business day | Next sprint | Within 5 days | No | No |

---

## Incident Commander Responsibilities

For SEV1 and SEV2, an **Incident Commander (IC)** is designated:

1. Owns communication — internal and external
2. Coordinates the technical response without doing the hands-on work
3. Makes the call on rollback vs. fix forward
4. Updates status page
5. Schedules post-mortem
6. Files the incident report

The IC is typically the most senior engineer available at time of detection. Stephen Lutar serves as IC for all SEV1 incidents by default.

---

## Post-Incident Requirements

| Severity | Post-Mortem Required | Filing Location | Deadline |
|----------|---------------------|----------------|---------|
| SEV1 | Yes | `docs/internal/incidents/` | Within 24 hours |
| SEV2 | Yes | `docs/internal/incidents/` | Within 48 hours |
| SEV3 | Recommended | `docs/internal/incidents/` | Within 1 week |
| SEV4 | No | Issue tracker comment | N/A |

---

## Historical Incidents

Incident records are filed in `docs/internal/incidents/` by date (YYYY-MM-DD-description.md).

See [INCIDENT_RESPONSE.md](incident-response.md) for the post-mortem template and full incident workflow.
