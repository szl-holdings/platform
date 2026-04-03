# Admin Guide — SZL Platform

## Administration Overview
Platform administrators manage users, roles, settings, feature flags, and system health.

## User Management
- Add users via auth provider or SCIM provisioning
- Assign roles: admin, operator, viewer
- Manage organization/tenant assignments
- Deactivate accounts as needed

## Role Management
- Define custom roles if needed
- Map roles to permissions
- Review role assignments quarterly
- Ensure least-privilege principle

## Feature Flags
- Review active flags weekly
- Clean up fully-rolled-out flags
- Monitor kill switches
- Document flag ownership

## System Health
- Check /api/health regularly
- Monitor error rates in audit logs
- Review CI/CD pipeline status on GitHub
- Track dependency update status (Dependabot)

## Content Management (Distribution OS)
- Review articles in editorial queue
- Manage newsletter sends
- Monitor lead pipeline
- Check analytics dashboard
- Review automation outputs

## Security Administration
- Rotate credentials per schedule
- Review auth logs for anomalies
- Check GitHub security alerts
- Update CODEOWNERS as team changes
- Review branch protection rules

## Backup & Recovery
- Database backups are automated (Replit-managed)
- Codebase backed up via Git/GitHub
- Checkpoint system available for rollback
- Test recovery procedures quarterly
