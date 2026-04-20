/**
 * Page View Tracking — Anonymous Visitor Capture
 *
 * Lightweight public endpoint that records pre-login page views.
 * No authentication required — the session ID is client-generated and
 * carries no PII.  IP addresses are not stored; a stable per-request
 * hash is persisted only if the caller opts in via the `ipHash` field.
 *
 * Mounted BEFORE guardianPolicyCheck and the global auth enforcer in
 * src/routes/index.ts and allowed via PUBLIC_PREFIXES in
 * src/middlewares/global-auth-enforcer.ts.
 */

import { bodyShape } from '@szl-holdings/contracts/common';
import { db, pageViewEventsTable } from '@szl-holdings/db';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod/v4';
import { handleRouteError, sendBadRequest, sendSuccess } from '../lib/api-response';
import { validateBody } from '../lib/validation';

const router: IRouter = Router();

const trackSchema = z.object({
  sessionId: z.string().min(1).max(128),
  path: z.string().min(1).max(2048),
  referrer: z.string().max(2048).optional().nullable(),
  userAgent: z.string().max(512).optional().nullable(),
  country: z.string().max(64).optional().nullable(),
  // Optional pre-hashed IP: caller may supply a SHA-256 or similar hash of the
  // visitor's IP address for geo-dedup purposes.  Raw IPs must NOT be sent.
  ipHash: z.string().max(128).optional().nullable(),
});

router.post(
  '/track/page-view',
  validateBody(bodyShape({})),
  async (req: Request, res: Response) => {
    try {
      const parsed = trackSchema.safeParse(req.body);
      if (!parsed.success) {
        sendBadRequest(res, 'Invalid page-view payload');
        return;
      }

      const { sessionId, path, referrer, userAgent, country, ipHash } = parsed.data;

      await db.insert(pageViewEventsTable).values({
        sessionId,
        path,
        referrer: referrer ?? null,
        userAgent: userAgent ?? null,
        country: country ?? null,
        ipHash: ipHash ?? null,
      });

      sendSuccess(res, { recorded: true }, 201);
    } catch (err) {
      handleRouteError(res, err, 'Failed to record page view');
    }
  },
);

export default router;
