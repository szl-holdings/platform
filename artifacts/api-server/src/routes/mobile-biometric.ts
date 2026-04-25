import {
  biometricChallengesTable,
  db,
  deviceBiometricBindingsTable,
  stepUpAssertionsTable,
} from '@szl-holdings/db';
import crypto from 'node:crypto';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth';
import { createSessionWithRefresh } from '../middlewares/session-policy';
import { getSessionToken } from '../lib/auth';
import { logger } from '../lib/logger';

const router = Router();

const BINDING_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const STEP_UP_TTL_MS = 5 * 60 * 1000;
const CHALLENGE_TTL_MS = 60 * 1000;

/**
 * Compute a proof-of-possession value matching what the client sends.
 * Client computes: SHA-256(bindingToken + ":" + nonce) using expo-crypto.
 * Server verifies by computing the same hash with the stored binding token.
 */
function computeProof(bindingToken: string, nonce: string): string {
  return crypto.createHash('sha256').update(`${bindingToken}:${nonce}`).digest('hex');
}

const EnrollBody = z.object({
  deviceId: z.string().min(1).max(256),
  deviceName: z.string().max(256).optional(),
  platform: z.enum(['ios', 'android']).optional(),
});

const ChallengeBody = z.object({
  deviceId: z.string().min(1).max(256),
});

const AuthenticateBody = z.object({
  challengeId: z.string().min(1),
  deviceId: z.string().min(1).max(256),
  proof: z.string().length(64),
});

const RevokeBody = z.object({
  deviceId: z.string().min(1).max(256).optional(),
});

const StepUpBody = z.object({
  challengeId: z.string().min(1),
  deviceId: z.string().min(1).max(256),
  proof: z.string().length(64),
});

/**
 * POST /mobile-biometric/enroll
 * Registers a new device binding for the authenticated user.
 * Returns a server-issued binding token to be stored in device SecureStore.
 * The token is used only for computing proofs — it is never sent over the wire
 * again after enrollment.
 */
router.post('/mobile-biometric/enroll', authMiddleware(), async (req, res) => {
  const parsed = EnrollBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body', details: parsed.error.flatten() });
    return;
  }

  const user = req.user!;
  const { deviceId, deviceName, platform } = parsed.data;

  try {
    const bindingToken = crypto.randomBytes(48).toString('hex');
    const expiresAt = new Date(Date.now() + BINDING_TTL_MS);

    await db
      .insert(deviceBiometricBindingsTable)
      .values({
        userId: user.id,
        deviceId,
        bindingToken,
        deviceName: deviceName ?? null,
        platform: platform ?? null,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: [deviceBiometricBindingsTable.userId, deviceBiometricBindingsTable.deviceId],
        set: {
          bindingToken,
          deviceName: deviceName ?? null,
          platform: platform ?? null,
          expiresAt,
          revokedAt: null,
          revokedReason: null,
          enrolledAt: new Date(),
          lastUsedAt: null,
        },
      });

    logger.info({ userId: user.id, deviceId }, '[biometric] Device enrolled');

    res.json({
      bindingToken,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, '[biometric] Enroll error');
    res.status(500).json({ error: 'Enrollment failed' });
  }
});

/**
 * POST /mobile-biometric/challenge
 * Issues a one-time server nonce for a device. The client must use this nonce
 * to compute a proof before authenticating. Challenges expire in 60 seconds.
 * No auth required — only the deviceId is needed.
 */
router.post('/mobile-biometric/challenge', async (req, res) => {
  const parsed = ChallengeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  const { deviceId } = parsed.data;

  try {
    const nonce = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);

    const [challenge] = await db
      .insert(biometricChallengesTable)
      .values({ deviceId, nonce, expiresAt })
      .returning({ id: biometricChallengesTable.id, nonce: biometricChallengesTable.nonce });

    res.json({
      challengeId: String(challenge.id),
      nonce: challenge.nonce,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, '[biometric] Challenge error');
    res.status(500).json({ error: 'Failed to issue challenge' });
  }
});

/**
 * POST /mobile-biometric/authenticate
 * Authenticates using a challenge/proof pair. The binding token NEVER travels
 * over the wire — the client sends proof = SHA-256(bindingToken + ":" + nonce)
 * and the server verifies using the stored binding token.
 */
router.post('/mobile-biometric/authenticate', async (req, res) => {
  const parsed = AuthenticateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  const { challengeId, deviceId, proof } = parsed.data;

  try {
    const challengeIdNum = parseInt(challengeId, 10);
    if (isNaN(challengeIdNum)) {
      res.status(400).json({ error: 'Invalid challengeId' });
      return;
    }

    const [challenge] = await db
      .select()
      .from(biometricChallengesTable)
      .where(
        and(
          eq(biometricChallengesTable.id, challengeIdNum),
          eq(biometricChallengesTable.deviceId, deviceId),
          isNull(biometricChallengesTable.usedAt),
          gt(biometricChallengesTable.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!challenge) {
      res.status(401).json({ error: 'Challenge invalid, expired, or already used' });
      return;
    }

    const [binding] = await db
      .select()
      .from(deviceBiometricBindingsTable)
      .where(
        and(
          eq(deviceBiometricBindingsTable.deviceId, deviceId),
          isNull(deviceBiometricBindingsTable.revokedAt),
          gt(deviceBiometricBindingsTable.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!binding) {
      res.status(401).json({ error: 'Biometric binding not found or expired', code: 'BINDING_INVALID' });
      return;
    }

    const expectedProof = computeProof(binding.bindingToken, challenge.nonce);
    const proofValid = crypto.timingSafeEqual(
      Buffer.from(proof, 'hex'),
      Buffer.from(expectedProof, 'hex'),
    );

    await db
      .update(biometricChallengesTable)
      .set({ usedAt: new Date() })
      .where(eq(biometricChallengesTable.id, challenge.id));

    if (!proofValid) {
      logger.warn({ deviceId }, '[biometric] Proof verification failed');
      res.status(401).json({ error: 'Proof verification failed', code: 'PROOF_INVALID' });
      return;
    }

    const created = await createSessionWithRefresh({
      userId: binding.userId,
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
      reason: 'mobile_biometric_auth',
    });

    await db
      .update(deviceBiometricBindingsTable)
      .set({ lastUsedAt: new Date() })
      .where(eq(deviceBiometricBindingsTable.id, binding.id));

    logger.info({ userId: binding.userId, deviceId }, '[biometric] Biometric sign-in successful');

    res.json({
      token: created.token,
      refreshToken: created.refreshToken,
      expiresAt: created.expiresAt.toISOString(),
      refreshTokenExpiresAt: created.refreshTokenExpiresAt.toISOString(),
    });
  } catch (err) {
    logger.error({ err }, '[biometric] Authenticate error');
    res.status(500).json({ error: 'Authentication failed' });
  }
});

router.get('/mobile-biometric/status', authMiddleware(), async (req, res) => {
  const user = req.user!;

  try {
    const bindings = await db
      .select({
        id: deviceBiometricBindingsTable.id,
        deviceId: deviceBiometricBindingsTable.deviceId,
        deviceName: deviceBiometricBindingsTable.deviceName,
        platform: deviceBiometricBindingsTable.platform,
        enrolledAt: deviceBiometricBindingsTable.enrolledAt,
        lastUsedAt: deviceBiometricBindingsTable.lastUsedAt,
        expiresAt: deviceBiometricBindingsTable.expiresAt,
      })
      .from(deviceBiometricBindingsTable)
      .where(
        and(
          eq(deviceBiometricBindingsTable.userId, user.id),
          isNull(deviceBiometricBindingsTable.revokedAt),
          gt(deviceBiometricBindingsTable.expiresAt, new Date()),
        ),
      );

    res.json({ bindings });
  } catch (err) {
    logger.error({ err }, '[biometric] Status error');
    res.status(500).json({ error: 'Failed to fetch biometric status' });
  }
});

router.delete('/mobile-biometric/binding', authMiddleware(), async (req, res) => {
  const parsed = RevokeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  const user = req.user!;
  const { deviceId } = parsed.data;

  try {
    if (deviceId) {
      await db
        .update(deviceBiometricBindingsTable)
        .set({ revokedAt: new Date(), revokedReason: 'user_revoked' })
        .where(
          and(
            eq(deviceBiometricBindingsTable.userId, user.id),
            eq(deviceBiometricBindingsTable.deviceId, deviceId),
            isNull(deviceBiometricBindingsTable.revokedAt),
          ),
        );
    } else {
      await db
        .update(deviceBiometricBindingsTable)
        .set({ revokedAt: new Date(), revokedReason: 'user_revoked_all' })
        .where(
          and(
            eq(deviceBiometricBindingsTable.userId, user.id),
            isNull(deviceBiometricBindingsTable.revokedAt),
          ),
        );
    }

    logger.info({ userId: user.id, deviceId }, '[biometric] Binding revoked');
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, '[biometric] Revoke error');
    res.status(500).json({ error: 'Failed to revoke binding' });
  }
});

/**
 * POST /mobile-biometric/step-up
 * Issues a step-up assertion that is valid for 5 minutes.
 * Requires a fresh biometric challenge/proof to prove the user's physical
 * device confirmed the action — not just an existing session.
 */
router.post('/mobile-biometric/step-up', authMiddleware(), async (req, res) => {
  const parsed = StepUpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  const { challengeId, deviceId, proof } = parsed.data;
  const user = req.user!;
  const sessionToken = getSessionToken(req);

  if (!sessionToken) {
    res.status(401).json({ error: 'No active session' });
    return;
  }

  try {
    const challengeIdNum = parseInt(challengeId, 10);
    if (isNaN(challengeIdNum)) {
      res.status(400).json({ error: 'Invalid challengeId' });
      return;
    }

    const [challenge] = await db
      .select()
      .from(biometricChallengesTable)
      .where(
        and(
          eq(biometricChallengesTable.id, challengeIdNum),
          eq(biometricChallengesTable.deviceId, deviceId),
          isNull(biometricChallengesTable.usedAt),
          gt(biometricChallengesTable.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!challenge) {
      res.status(401).json({ error: 'Challenge invalid, expired, or already used' });
      return;
    }

    const [binding] = await db
      .select()
      .from(deviceBiometricBindingsTable)
      .where(
        and(
          eq(deviceBiometricBindingsTable.userId, user.id),
          eq(deviceBiometricBindingsTable.deviceId, deviceId),
          isNull(deviceBiometricBindingsTable.revokedAt),
          gt(deviceBiometricBindingsTable.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!binding) {
      res.status(403).json({ error: 'No active biometric binding for step-up', code: 'STEP_UP_NO_BINDING' });
      return;
    }

    const expectedProof = computeProof(binding.bindingToken, challenge.nonce);
    const proofValid = crypto.timingSafeEqual(
      Buffer.from(proof, 'hex'),
      Buffer.from(expectedProof, 'hex'),
    );

    await db
      .update(biometricChallengesTable)
      .set({ usedAt: new Date() })
      .where(eq(biometricChallengesTable.id, challenge.id));

    if (!proofValid) {
      logger.warn({ userId: user.id, deviceId }, '[biometric] Step-up proof verification failed');
      res.status(401).json({ error: 'Biometric proof verification failed', code: 'PROOF_INVALID' });
      return;
    }

    const assertionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + STEP_UP_TTL_MS);

    await db.insert(stepUpAssertionsTable).values({
      userId: user.id,
      token: assertionToken,
      sessionToken,
      bindingId: binding.id,
      expiresAt,
    });

    logger.info({ userId: user.id }, '[biometric] Step-up assertion issued');

    res.json({
      stepUpToken: assertionToken,
      expiresAt: expiresAt.toISOString(),
      validForSeconds: STEP_UP_TTL_MS / 1000,
    });
  } catch (err) {
    logger.error({ err }, '[biometric] Step-up error');
    res.status(500).json({ error: 'Failed to issue step-up assertion' });
  }
});

router.delete('/mobile-biometric/bindings/all', authMiddleware(), async (req, res) => {
  const user = req.user!;

  try {
    await db
      .update(deviceBiometricBindingsTable)
      .set({ revokedAt: new Date(), revokedReason: 'sign_out_everywhere' })
      .where(
        and(
          eq(deviceBiometricBindingsTable.userId, user.id),
          isNull(deviceBiometricBindingsTable.revokedAt),
        ),
      );

    logger.info({ userId: user.id }, '[biometric] All bindings revoked (sign-out-everywhere)');
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, '[biometric] Revoke-all error');
    res.status(500).json({ error: 'Failed to revoke all bindings' });
  }
});

export default router;

/**
 * requireStepUp middleware
 * Apply this to sensitive routes that require a fresh biometric step-up assertion.
 * The client must include `X-Step-Up-Token: <assertionToken>` in the request headers.
 * The token must be tied to the current session and not yet expired.
 */
export function requireStepUp(req: Request, res: Response, next: NextFunction): void {
  const stepUpToken = req.headers['x-step-up-token'] as string | undefined;
  const sessionToken = getSessionToken(req);
  const userId = req.user?.id;

  if (!stepUpToken || !sessionToken || !userId) {
    res.status(403).json({
      error: 'Biometric step-up required for this action',
      code: 'STEP_UP_REQUIRED',
    });
    return;
  }

  db.select()
    .from(stepUpAssertionsTable)
    .where(
      and(
        eq(stepUpAssertionsTable.token, stepUpToken),
        eq(stepUpAssertionsTable.userId, userId),
        eq(stepUpAssertionsTable.sessionToken, sessionToken),
        isNull(stepUpAssertionsTable.usedAt),
        gt(stepUpAssertionsTable.expiresAt, new Date()),
      ),
    )
    .limit(1)
    .then(([assertion]) => {
      if (!assertion) {
        res.status(403).json({
          error: 'Step-up token invalid, expired, or already consumed',
          code: 'STEP_UP_INVALID',
        });
        return;
      }

      db.update(stepUpAssertionsTable)
        .set({ usedAt: new Date() })
        .where(eq(stepUpAssertionsTable.id, assertion.id))
        .then(() => next())
        .catch(() => next());
    })
    .catch((err: unknown) => {
      logger.error({ err }, '[biometric] requireStepUp DB error');
      res.status(500).json({ error: 'Failed to verify step-up token' });
    });
}
