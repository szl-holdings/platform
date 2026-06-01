# Authentication & Roles — SZL Holdings

## Authentication
- **Provider**: Replit Auth (OpenID Connect with PKCE)
- **Session**: Cookie-based session management
- **Middleware**: `requireAuth` on all admin/write endpoints
- **SCIM**: SCIM 2.0 endpoints for enterprise provisioning

## Role Model

| Role | Description | Access Level |
|------|-------------|-------------|
| admin | Platform administrator | Full access to all features and settings |
| operator | Domain operator | Full access within assigned domain |
| viewer | Read-only user | View dashboards and reports |
| public | Unauthenticated | Public pages only (insights, newsletter, link-in-bio) |

## Permission Matrix

| Resource | Admin | Operator | Viewer | Public |
|----------|-------|----------|--------|--------|
| Dashboard | ✅ | ✅ | ✅ | ❌ |
| Create/Edit records | ✅ | ✅ | ❌ | ❌ |
| Delete records | ✅ | ❌ | ❌ | ❌ |
| Admin settings | ✅ | ❌ | ❌ | ❌ |
| Audit logs | ✅ | ✅ | ✅ | ❌ |
| Public content | ✅ | ✅ | ✅ | ✅ |
| Lead capture | ✅ | ✅ | ✅ | ✅ |

## API Authentication
All authenticated endpoints require a valid session. The auth middleware validates the session and attaches user context to the request.

```
Authorization flow:
1. User signs in via auth provider
2. Session token stored in httpOnly cookie
3. Each API request validated by auth middleware
4. User context (id, role, org) attached to request
5. Route handler checks permissions
```

## Organization/Tenant Model
- Users belong to organizations
- Data is scoped by organization where applicable
- Admin users can manage organization settings
- SCIM provisioning for enterprise identity management
