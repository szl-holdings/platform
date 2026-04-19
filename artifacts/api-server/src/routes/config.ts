import { Router, type IRouter, type Request, type Response, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { validateBody, adminPinVerifySchema } from "../lib/validation";

const router: IRouter = Router();

const configLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const pinLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

router.post("/config/verify-admin-pin", pinLimit, validateBody(adminPinVerifySchema), (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ ok: false, error: "authentication_required" });
    return;
  }
  const user = req.user as { roles?: string[] } | undefined;
  const roles = user?.roles ?? [];
  const isAdmin = roles.some((r: string) => ["admin", "super_admin"].includes(r));
  if (!isAdmin) {
    res.status(403).json({ ok: false, error: "admin_role_required" });
    return;
  }
  const { pin } = req.body;
  const adminPin = process.env.ADMIN_PIN;
  if (!adminPin) {
    res.status(503).json({ ok: false, error: "admin_pin_not_configured" });
    return;
  }
  if (pin !== adminPin) {
    res.status(401).json({ ok: false, error: "invalid_pin" });
    return;
  }
  res.json({ ok: true });
});

router.get("/config/mapbox-token", configLimit, (_req: Request, res: Response) => {
  // Mapbox publishable tokens (pk.*) are intentionally public and protected
  // via URL allowlists configured in the Mapbox account, so this endpoint is
  // intentionally unauthenticated. This lets demo-mode visitors and
  // pre-auth marketing pages render the maritime and property maps.
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    res.json({ configured: false, token: null, message: "MAPBOX_ACCESS_TOKEN is not set." });
    return;
  }
  if (!token.startsWith("pk.")) {
    res.json({ configured: false, token: null, message: "A public Mapbox token (pk.*) is required. The current token is not a public token." });
    return;
  }
  res.json({ configured: true, token });
});

export default router;
