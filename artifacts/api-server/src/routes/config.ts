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
    res.status(404).json({ error: "Mapbox token not configured" });
    return;
  }
  if (!token.startsWith("pk.")) {
    res.status(500).json({ error: "MAPBOX_ACCESS_TOKEN must be a public token (pk.*). Secret tokens (sk.*) must not be exposed to clients." });
    return;
  }
  res.json({ token });
});

export default router;
