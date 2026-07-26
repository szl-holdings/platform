# Business Continuity & Disaster Recovery — SZL Holdings

## Backup Strategy
- **Database**: Replit-managed PostgreSQL with automated daily backups
- **Codebase**: Git version control with GitHub mirror (szl-holdings organization)
- **Configuration**: Infrastructure-as-code in repository
- **Secrets**: Environment-managed, documented in env inventory

## Recovery Objectives
| Metric | Target | Current |
|--------|--------|---------|
| Recovery Time Objective (RTO) | < 4 hours | Replit-managed |
| Recovery Point Objective (RPO) | < 24 hours | Daily backups |
| Maximum Tolerable Downtime | 8 hours | — |

## Disaster Scenarios

### Database Failure
- **Response**: Replit-managed failover and backup restoration
- **Rollback**: Checkpoint system allows codebase + DB rollback

### Application Failure
- **Response**: Restart workflows, check health endpoints
- **Rollback**: Git revert to last known good checkpoint

### Code Compromise
- **Response**: GitHub CodeQL alerts, dependency review
- **Rollback**: Git revert, secret rotation

### Infrastructure Failure
- **Response**: Replit-managed infrastructure redundancy
- **Communication**: Status page update, stakeholder notification

## Continuity Measures
- All code in Git with full history
- GitHub mirror provides secondary code storage
- 45 CI/CD workflows are inventoried in `artifacts/SOURCE_OF_TRUTH.json`; their current results determine build integrity
- Health/readiness endpoints for service monitoring
- Structured audit logs for forensic analysis

*Last updated: April 3, 2026*
