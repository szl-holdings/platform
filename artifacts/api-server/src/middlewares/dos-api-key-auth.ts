import { createHash } from "crypto";
import { Request, Response, NextFunction } from "express";
import { db, dosSiteSettingsTable } from "@szl-holdings/db";
import { eq, and, sql } from "drizzle-orm";

export async function dosApiKeyAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header. Use: Authorization: Bearer <key>" });
    return;
  }
  const rawKey = authHeader.slice(7).trim();
  if (!rawKey) {
    res.status(401).json({ error: "API key is empty" });
    return;
  }
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  try {
    const rows = await db.select({ id: dosSiteSettingsTable.id, label: dosSiteSettingsTable.label }).from(dosSiteSettingsTable).where(
      and(
        eq(dosSiteSettingsTable.category, "integration"),
        eq(dosSiteSettingsTable.value, keyHash),
        sql`${dosSiteSettingsTable.key} LIKE 'apikey_%'`
      )
    ).limit(1);
    if (!rows.length) {
      res.status(401).json({ error: "Invalid API key" });
      return;
    }
    (req as any).dosApiKeyId = rows[0].id;
    (req as any).dosApiKeyName = rows[0].label;
    next();
  } catch (err) {
    res.status(500).json({ error: "Authentication service error" });
  }
}
