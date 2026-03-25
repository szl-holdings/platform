import { db, activityLogTable } from "@workspace/db";
import type { Request } from "express";

export async function logActivity(
  req: Request,
  action: string,
  resource: string,
  resourceId?: string,
  description?: string,
  metadata?: unknown
) {
  try {
    await db.insert(activityLogTable).values({
      userId: req.user?.id ?? null,
      action,
      resource,
      resourceId,
      description,
      metadata: metadata ?? null,
      ipAddress: req.ip ?? null,
    });
  } catch (err) {
    req.log?.warn({ err }, "Failed to log activity");
  }
}
