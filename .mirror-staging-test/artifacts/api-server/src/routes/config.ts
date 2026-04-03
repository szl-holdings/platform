import { Router, type IRouter, type Request, type Response, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";

const router: IRouter = Router();

const configLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

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

export default router;
