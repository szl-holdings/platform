# Alert Matrix

Generated: 2026-04-15

## Critical (P0) — Page Immediately

| Alert | Condition | Channel |
|-------|-----------|---------|
| API Down | /health/live returns non-200 for > 2m | Slack + SMS |
| Database Unreachable | /health/ready returns non-200 for > 1m | Slack + SMS |
| Error Rate Spike | 5xx rate > 5% for > 3m | Slack + SMS |
| Memory Exhaustion | Process memory > 90% of limit | Slack |

## High (P1) — Respond Within 1 Hour

| Alert | Condition | Channel |
|-------|-----------|---------|
| High Latency | p95 > 1000ms for > 5m | Slack |
| Auth Brute Force | > 50 failed auth in 5m from single IP | Slack |
| AI Provider Down | All AI requests failing for > 5m | Slack |
| Disk Usage High | > 80% disk utilization | Slack |
| Connection Pool Exhaustion | DB connections > 90% of max | Slack |

## Medium (P2) — Review Next Business Day

| Alert | Condition | Channel |
|-------|-----------|---------|
| Elevated Error Rate | 5xx rate > 1% for > 15m | Slack |
| Slow Queries | DB queries > 500ms avg for > 10m | Email |
| Certificate Expiry | TLS cert expires within 14 days | Email |
| Dependency Vulnerability | Critical CVE in dependencies | Email |

## Low (P3) — Weekly Review

| Alert | Condition | Channel |
|-------|-----------|---------|
| Rate Limit Hits | > 100 429 responses in 1h | Dashboard |
| Unused Endpoints | Routes with 0 traffic for 30d | Dashboard |
| Test Failure | CI test suite fails | GitHub notification |

## Notification Channels

| Channel | Setup |
|---------|-------|
| Slack | Create #szl-alerts channel, add webhook |
| Email | alerts@szlholdings.com distribution list |
| SMS | PagerDuty or Twilio for P0 alerts |
| Dashboard | Grafana or equivalent |
