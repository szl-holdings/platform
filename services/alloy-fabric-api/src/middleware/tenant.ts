import type { NextFunction, Request, Response } from 'express';

export function tenantScopingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const tenantHeader = req.headers['x-tenant-id'];
  const bodyTenantId = (req.body as Record<string, unknown> | undefined)?.tenantId;

  const headerTenant =
    typeof tenantHeader === 'string' && tenantHeader.trim().length > 0 ? tenantHeader.trim() : null;
  const bodyTenant =
    typeof bodyTenantId === 'string' && bodyTenantId.trim().length > 0 ? bodyTenantId.trim() : null;

  if (!headerTenant && !bodyTenant) {
    res.status(400).json({
      error: 'missing_tenant_id',
      message: 'A tenantId is required. Provide it via the X-Tenant-ID header.',
    });
    return;
  }

  if (headerTenant && bodyTenant && headerTenant !== bodyTenant) {
    res.status(400).json({
      error: 'tenant_mismatch',
      message:
        'The tenantId in the request body does not match the X-Tenant-ID header. They must be identical.',
    });
    return;
  }

  const requestedTenant = headerTenant ?? bodyTenant!;
  const authenticatedTenant = res.locals.authenticatedTenantId as string | undefined;
  if (authenticatedTenant && requestedTenant !== authenticatedTenant) {
    res.status(403).json({
      error: 'credential_tenant_mismatch',
      message: 'The authenticated credential is not authorized for the requested tenant.',
    });
    return;
  }

  res.locals.tenantId = authenticatedTenant ?? requestedTenant;
  next();
}

export function getTenantId(res: Response): string {
  const id = res.locals.tenantId as string | undefined;
  if (!id) throw new Error('tenantId not set by tenantScopingMiddleware');
  return id;
}
