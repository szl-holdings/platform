import { type TenantId, TenantIdSchema } from '@workspace/aef-contracts';
import type { NextFunction, Request, Response } from 'express';

declare global {
  namespace Express {
    interface Request {
      tenantId: TenantId;
      profileId: string;
    }
  }
}

const DEFAULT_PROFILE = 'default';

export function tenantScoping(req: Request, res: Response, next: NextFunction): void {
  const rawTenant = req.headers['x-tenant-id'];
  if (typeof rawTenant !== 'string' || !rawTenant.trim()) {
    res.status(400).json({ error: 'X-Tenant-Id header is required', code: 'TENANT_REQUIRED' });
    return;
  }

  const tenantResult = TenantIdSchema.safeParse(rawTenant.trim());
  if (!tenantResult.success) {
    res.status(400).json({ error: 'Invalid tenant ID', detail: tenantResult.error.message });
    return;
  }

  const queryTenant = req.query.tenantId;
  if (
    queryTenant !== undefined &&
    (typeof queryTenant !== 'string' || queryTenant !== tenantResult.data)
  ) {
    res.status(403).json({ error: 'Forbidden', code: 'TENANT_SCOPE_MISMATCH' });
    return;
  }
  if (
    req.aefAuthContext?.authorizedTenantId &&
    req.aefAuthContext.authorizedTenantId !== tenantResult.data
  ) {
    res.status(403).json({ error: 'Forbidden', code: 'TENANT_SCOPE_MISMATCH' });
    return;
  }

  req.tenantId = tenantResult.data;
  req.profileId =
    (req.headers['x-profile-id'] as string | undefined) ??
    (req.query.profileId as string | undefined) ??
    DEFAULT_PROFILE;

  next();
}

export function enforceTenantRequestConsistency(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (typeof req.tenantId !== 'string' || !req.tenantId.trim()) {
    res.status(400).json({ error: 'X-Tenant-Id header is required', code: 'TENANT_REQUIRED' });
    return;
  }
  const body = req.body;
  if (
    body !== null &&
    typeof body === 'object' &&
    !Array.isArray(body) &&
    Object.hasOwn(body, 'tenantId')
  ) {
    const bodyTenant = (body as Record<string, unknown>).tenantId;
    if (typeof bodyTenant !== 'string' || bodyTenant !== req.tenantId) {
      res.status(403).json({ error: 'Forbidden', code: 'TENANT_SCOPE_MISMATCH' });
      return;
    }
  }
  next();
}
