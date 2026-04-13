import { Router, type IRouter, type Request, type Response } from 'express';
import {
  db,
  azureTenantsTable,
  tenantBrandingTable,
  type InsertTenantBranding,
} from '@szl-holdings/db';
import { eq } from 'drizzle-orm';
import { sendSuccess, sendBadRequest, handleRouteError } from '../lib/api-response';
import { authMiddleware, requireRole } from '../middlewares/auth';
import rateLimit from 'express-rate-limit';
import { type RequestHandler } from 'express';
const tenantRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded for tenant provisioning.' },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const router: IRouter = Router();

// ─── Tenant Branding Routes ───────────────────────────────────────────────────

router.get(
  "/admin/tenants/:id/branding",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) { sendBadRequest(res, "Invalid tenant ID"); return; }

      const [tenant] = await db.select().from(azureTenantsTable).where(eq(azureTenantsTable.id, id)).limit(1);
      if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }

      const [branding] = await db.select().from(tenantBrandingTable).where(eq(tenantBrandingTable.tenantId, id)).limit(1);

      sendSuccess(res, { branding: branding ?? null });
    } catch (err) {
      handleRouteError(res, err, "Failed to get tenant branding");
    }
  },
);

router.put(
  "/admin/tenants/:id/branding",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) { sendBadRequest(res, "Invalid tenant ID"); return; }

      const [tenant] = await db.select().from(azureTenantsTable).where(eq(azureTenantsTable.id, id)).limit(1);
      if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }

      const body = req.body ?? {};

      const brandingData: Partial<InsertTenantBranding> = {
        tenantId: id,
        companyName: body.companyName !== undefined ? String(body.companyName || "").trim() || null : undefined,
        tagline: body.tagline !== undefined ? String(body.tagline || "").trim() || null : undefined,
        logoUrl: body.logoUrl !== undefined ? String(body.logoUrl || "").trim() || null : undefined,
        faviconUrl: body.faviconUrl !== undefined ? String(body.faviconUrl || "").trim() || null : undefined,
        primaryColor: body.primaryColor !== undefined ? String(body.primaryColor || "").trim() || null : undefined,
        accentColor: body.accentColor !== undefined ? String(body.accentColor || "").trim() || null : undefined,
        sidebarHeaderText: body.sidebarHeaderText !== undefined ? String(body.sidebarHeaderText || "").trim() || null : undefined,
        customDomainLabel: body.customDomainLabel !== undefined ? String(body.customDomainLabel || "").trim() || null : undefined,
        emailFromName: body.emailFromName !== undefined ? String(body.emailFromName || "").trim() || null : undefined,
        emailFooterText: body.emailFooterText !== undefined ? String(body.emailFooterText || "").trim() || null : undefined,
      };

      Object.keys(brandingData).forEach((k) => {
        const key = k as keyof typeof brandingData;
        if (brandingData[key] === undefined) delete brandingData[key];
      });

      const [existing] = await db.select({ id: tenantBrandingTable.id }).from(tenantBrandingTable).where(eq(tenantBrandingTable.tenantId, id)).limit(1);

      let branding;
      if (existing) {
        [branding] = await db
          .update(tenantBrandingTable)
          .set({ ...brandingData, updatedAt: new Date() })
          .where(eq(tenantBrandingTable.tenantId, id))
          .returning();
      } else {
        [branding] = await db
          .insert(tenantBrandingTable)
          .values({ tenantId: id, ...brandingData })
          .returning();
      }

      sendSuccess(res, { branding, message: "Tenant branding saved" });
    } catch (err) {
      handleRouteError(res, err, "Failed to save tenant branding");
    }
  },
);

router.delete(
  "/admin/tenants/:id/branding",
  tenantRateLimit,
  authMiddleware(),
  requireRole("admin"),
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      if (isNaN(id)) { sendBadRequest(res, "Invalid tenant ID"); return; }

      await db.delete(tenantBrandingTable).where(eq(tenantBrandingTable.tenantId, id));

      sendSuccess(res, { message: "Tenant branding reset to defaults" });
    } catch (err) {
      handleRouteError(res, err, "Failed to reset tenant branding");
    }
  },
);

router.get(
  "/tenant-branding/:azureTenantId",
  tenantRateLimit,
  async (req: Request, res: Response) => {
    try {
      const azureTenantId = String(req.params.azureTenantId);
      if (!azureTenantId) { sendBadRequest(res, "azureTenantId is required"); return; }

      const [tenant] = await db
        .select({ id: azureTenantsTable.id, displayName: azureTenantsTable.displayName, status: azureTenantsTable.status })
        .from(azureTenantsTable)
        .where(eq(azureTenantsTable.azureTenantId, azureTenantId))
        .limit(1);

      if (!tenant || tenant.status !== "active") {
        sendSuccess(res, { branding: null });
        return;
      }

      const [branding] = await db
        .select()
        .from(tenantBrandingTable)
        .where(eq(tenantBrandingTable.tenantId, tenant.id))
        .limit(1);

      sendSuccess(res, { branding: branding ?? null });
    } catch (err) {
      handleRouteError(res, err, "Failed to get tenant branding");
    }
  },
);


export default router;
