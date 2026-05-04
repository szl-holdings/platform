/**
 * Push Notification Device Registration
 *
 * POST /api/push/register — unified device-token registration endpoint.
 *
 * Accepts an Expo push token (ExponentPushToken[...]) plus optional platform
 * and appId fields. Auth is optional — allows pre-auth registration during
 * mobile onboarding; when authenticated the token is linked to the user.
 *
 * This is a thin adapter over the existing /push-tokens route so that mobile
 * deep-link handlers and CI integration tests have a stable, documented URL.
 */

import { db, pushTokensTable } from '@szl-holdings/db';
import { eq } from 'drizzle-orm';
import { Expo } from 'expo-server-sdk';
import { type IRouter, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { handleRouteError, sendBadRequest, sendCreated, sendSuccess } from '../lib/api-response';
import { logger } from '../lib/logger';
import { authMiddleware } from '../middlewares/auth';

const router: IRouter = Router();

const registerSchema = z.object({
  token: z.string().min(1, 'token is required'),
  platform: z.enum(['ios', 'android', 'web']).optional().default('ios'),
  appId: z.string().optional().default('cortex-mobile'),
  deepLinkBase: z.string().url().optional(),
});

router.post(
  '/push/register',
  authMiddleware({ required: false }),
  async (req: Request, res: Response) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        sendBadRequest(res, 'Validation failed', parsed.error);
        return;
      }

      const { token, platform, appId } = parsed.data;
      const userId = req.user?.id ?? null;

      if (!Expo.isExpoPushToken(token)) {
        sendBadRequest(
          res,
          'Invalid push token format. Expected an Expo push token (ExponentPushToken[...]).',
        );
        return;
      }

      const existing = await db
        .select()
        .from(pushTokensTable)
        .where(eq(pushTokensTable.token, token));

      if (existing.length > 0) {
        const resolvedUserId = userId !== null ? userId : existing[0].userId;
        const [updated] = await db
          .update(pushTokensTable)
          .set({
            userId: resolvedUserId,
            isActive: true,
            platform,
            appId: appId ?? existing[0].appId ?? 'cortex-mobile',
            updatedAt: new Date(),
          })
          .where(eq(pushTokensTable.token, token))
          .returning();

        logger.info({ token: token.slice(-8), appId, userId }, '[push/register] Token updated');
        sendSuccess(res, {
          registered: true,
          tokenId: updated.id,
          appId: updated.appId,
          platform: updated.platform,
        });
        return;
      }

      const [created] = await db
        .insert(pushTokensTable)
        .values({
          userId,
          token,
          platform,
          appId: appId ?? 'cortex-mobile',
          isActive: true,
        })
        .returning();

      logger.info({ token: token.slice(-8), appId, userId }, '[push/register] Token registered');
      sendCreated(res, {
        registered: true,
        tokenId: created.id,
        appId: created.appId,
        platform: created.platform,
      });
    } catch (err) {
      handleRouteError(res, err, 'push:register');
    }
  },
);

export default router;
