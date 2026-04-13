import { Router, type IRouter, type Request, type Response, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";

const inMemoryPrefs: Map<string, UserPreferences> = new Map();

interface UserPreferences {
  colorMode?: "dark" | "light" | "system";
  displayDensity?: "compact" | "comfortable" | "spacious";
  favoriteViews?: string[];
  notificationSettings?: Record<string, boolean>;
  updatedAt: string;
}

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

router.post("/config/verify-admin-pin", pinLimit, (req: Request, res: Response) => {
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
  const { pin } = req.body as { pin?: string };
  if (typeof pin !== "string" || pin.length === 0) {
    res.status(400).json({ ok: false, error: "pin_required" });
    return;
  }
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

router.get("/config/mapbox-token", configLimit, (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

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

router.get("/config/user-preferences", configLimit, (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const user = req.user as { id?: number | string } | undefined;
  const userId = String(user?.id ?? "");
  const prefs = inMemoryPrefs.get(userId) ?? { updatedAt: new Date().toISOString() };
  res.json({ ok: true, preferences: prefs });
});

router.patch("/config/user-preferences", configLimit, (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const user = req.user as { id?: number | string } | undefined;
  const userId = String(user?.id ?? "");
  const existing = inMemoryPrefs.get(userId) ?? {};
  const { colorMode, displayDensity, favoriteViews, notificationSettings } = req.body as Partial<UserPreferences>;
  const validColorModes = ["dark", "light", "system"] as const;
  const validDensities = ["compact", "comfortable", "spacious"] as const;

  const updated: UserPreferences = {
    ...existing,
    updatedAt: new Date().toISOString(),
  };

  if (colorMode !== undefined) {
    if (!validColorModes.includes(colorMode as never)) {
      res.status(400).json({ error: "Invalid colorMode" });
      return;
    }
    updated.colorMode = colorMode;
  }

  if (displayDensity !== undefined) {
    if (!validDensities.includes(displayDensity as never)) {
      res.status(400).json({ error: "Invalid displayDensity" });
      return;
    }
    updated.displayDensity = displayDensity;
  }

  if (Array.isArray(favoriteViews)) {
    updated.favoriteViews = favoriteViews.filter((v) => typeof v === "string");
  }

  if (notificationSettings && typeof notificationSettings === "object") {
    updated.notificationSettings = notificationSettings;
  }

  inMemoryPrefs.set(userId, updated);
  res.json({ ok: true, preferences: updated });
});

export default router;
