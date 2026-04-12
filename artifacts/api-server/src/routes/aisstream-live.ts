import { Router, type IRouter, type RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { sendSuccess, handleRouteError } from "../lib/api-response";
import { authMiddleware } from "../middlewares/auth";
import { services } from "@szl-holdings/services";
import { fetchDigitrafficAis, fetchBarentsWatchAis } from "./vessels-live";

const router: IRouter = Router();

const aisLiveLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AISStream rate limit exceeded." },
  validate: { xForwardedForHeader: false, ip: false },
}) as unknown as RequestHandler;

const aisAdapter = services.aisstream;

if (aisAdapter.isLive) {
  aisAdapter.connect();
}

router.get("/vessels/live/aisstream", aisLiveLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    if (!aisAdapter.isLive) {
      sendSuccess(res, {
        source: "AISStream.io Global AIS WebSocket",
        url: "https://aisstream.io/",
        status: "NOT_CONFIGURED",
        note: "Set AISSTREAM_API_KEY environment variable to enable global AIS WebSocket feed. Free registration at https://aisstream.io/",
        vessels: [],
        count: 0,
        fetchedAt: new Date().toISOString(),
      });
      return;
    }

    const stats = aisAdapter.getStats();
    const vessels = aisAdapter.getVessels(limit);

    sendSuccess(res, {
      source: "AISStream.io Global AIS WebSocket",
      url: "https://aisstream.io/",
      status: stats.connected ? "live" : "reconnecting",
      connected: stats.connected,
      cachedVessels: stats.cachedVessels,
      lastMessageAt: stats.lastMessageAt,
      count: vessels.length,
      vessels,
      liveData: true,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch AISStream global AIS data"); }
});

router.get("/vessels/live/aisstream/vessel/:mmsi", aisLiveLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const mmsi = String(req.params["mmsi"] ?? "");
    if (!aisAdapter.isLive) {
      sendSuccess(res, { status: "NOT_CONFIGURED", note: "Set AISSTREAM_API_KEY to enable global vessel lookup", vessel: null });
      return;
    }
    const vessel = aisAdapter.getVesselByMmsi(mmsi);
    sendSuccess(res, {
      source: "AISStream.io",
      mmsi,
      vessel,
      found: !!vessel,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch vessel from AISStream"); }
});

router.get("/vessels/live/aisstream/status", aisLiveLimit, authMiddleware({ required: false }), async (_req, res) => {
  try {
    const stats = aisAdapter.getStats();
    sendSuccess(res, {
      source: "AISStream.io Global AIS WebSocket",
      configured: aisAdapter.isLive,
      ...stats,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch AISStream status"); }
});

router.get("/vessels/live/ais/global", aisLiveLimit, authMiddleware({ required: false }), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 300);

    const [aisStreamResult, digitrafficResult, barentswatchResult] = await Promise.allSettled([
      Promise.resolve(aisAdapter.isLive ? aisAdapter.getVessels(200) : []),
      fetchDigitrafficAis(),
      fetchBarentsWatchAis(),
    ]);

    const aisStreamVessels = aisStreamResult.status === "fulfilled" ? aisStreamResult.value : [];
    const digitrafficVessels = digitrafficResult.status === "fulfilled" ? digitrafficResult.value.vessels : [];
    const barentswatchVessels = barentswatchResult.status === "fulfilled" ? barentswatchResult.value.vessels : [];

    const mmsiSeen = new Set<string>(aisStreamVessels.map((v) => v.mmsi));
    const dtDeduped = digitrafficVessels.filter((v) => { if (mmsiSeen.has(v.mmsi)) return false; mmsiSeen.add(v.mmsi); return true; });
    const bwDeduped = barentswatchVessels.filter((v) => { if (mmsiSeen.has(v.mmsi)) return false; mmsiSeen.add(v.mmsi); return true; });

    const combined = [...aisStreamVessels, ...dtDeduped, ...bwDeduped].slice(0, limit);

    sendSuccess(res, {
      source: "Global AIS — AISStream.io + Digitraffic + BarentsWatch",
      url: "https://aisstream.io/",
      count: combined.length,
      vessels: combined,
      providerCounts: {
        aisstream: aisStreamVessels.length,
        digitraffic: dtDeduped.length,
        barentswatch: bwDeduped.length,
      },
      aisStreamConfigured: aisAdapter.isLive,
      aisStreamConnected: aisAdapter.isLive && aisAdapter.getStats().connected,
      liveData: combined.length > 0,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) { handleRouteError(res, err, "Failed to fetch global AIS data"); }
});

export default router;
