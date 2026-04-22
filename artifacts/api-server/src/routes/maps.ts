import { type Request, type Response, Router } from 'express';
import rateLimit from 'express-rate-limit';

import { anyQuerySchema, validateQuery } from '../lib/validation';

const mapsRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many map requests — please wait before retrying' },
});

const router = Router();

router.get(
  '/maps/static',
  validateQuery(anyQuerySchema),
  mapsRateLimiter,
  async (req: Request, res: Response) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      res.status(503).json({ error: 'Google Maps not configured — set GOOGLE_MAPS_API_KEY' });
      return;
    }

    const { center, zoom = '15', size = '600x400', maptype = 'satellite', markers } = req.query;
    if (!center) {
      res
        .status(400)
        .json({ error: "'center' query param is required (e.g. ?center=40.7580,-73.9855)" });
      return;
    }

    const params = new URLSearchParams({
      center: center as string,
      zoom: zoom as string,
      size: size as string,
      maptype: maptype as string,
      key: apiKey,
    });
    if (markers) params.append('markers', markers as string);

    const upstreamUrl = `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;

    try {
      const upstream = await fetch(upstreamUrl);
      if (!upstream.ok) {
        res.status(upstream.status).json({ error: `Google Maps API error: ${upstream.status}` });
        return;
      }
      const contentType = upstream.headers.get('Content-Type') || 'image/png';
      res.set('Content-Type', contentType);
      res.set('Cache-Control', 'public, max-age=86400');
      const buffer = await upstream.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (_err) {
      res.status(502).json({ error: 'Failed to fetch from Google Maps' });
    }
  },
);

router.get(
  '/maps/geocode',
  validateQuery(anyQuerySchema),
  mapsRateLimiter,
  async (req: Request, res: Response) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      res.status(503).json({ error: 'Google Maps not configured — set GOOGLE_MAPS_API_KEY' });
      return;
    }

    const { address } = req.query;
    if (!address) {
      res.status(400).json({ error: "'address' query param is required" });
      return;
    }

    const params = new URLSearchParams({ address: address as string, key: apiKey });
    const upstreamUrl = `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`;

    try {
      const upstream = await fetch(upstreamUrl);
      const data = (await upstream.json()) as Record<string, unknown>;
      res.json(data);
    } catch (_err) {
      res.status(502).json({ error: 'Failed to geocode address' });
    }
  },
);

export default router;
