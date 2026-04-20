import type { Request, Response, NextFunction } from "express";
import type { TenantId } from "@workspace/aef-contracts";
import { TenantIdSchema } from "@workspace/aef-contracts";

declare module "express" {
  interface Request {
    tenantId: TenantId;
    profileId: string;
  }
}

const DEFAULT_TENANT = "default";
const DEFAULT_PROFILE = "default";

export function tenantScoping(req: Request, res: Response, next: NextFunction): void {
  const rawTenant =
    (req.headers["x-tenant-id"] as string | undefined) ??
    (req.query["tenantId"] as string | undefined) ??
    DEFAULT_TENANT;

  const tenantResult = TenantIdSchema.safeParse(rawTenant);
  if (!tenantResult.success) {
    res.status(400).json({ error: "Invalid tenant ID", detail: tenantResult.error.message });
    return;
  }

  req.tenantId = tenantResult.data;
  req.profileId =
    (req.headers["x-profile-id"] as string | undefined) ??
    (req.query["profileId"] as string | undefined) ??
    DEFAULT_PROFILE;

  next();
}
