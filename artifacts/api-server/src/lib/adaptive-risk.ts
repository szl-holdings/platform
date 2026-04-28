/**
 * Adaptive Risk Scoring
 *
 * Evaluates auth attempts across multiple signals and returns a composite
 * risk score (0–100). High-risk scores trigger step-up verification.
 *
 * Signal weights:
 *   - IP reputation / failed-attempt history  : 0–40 pts
 *   - Device familiarity                       : 0–30 pts
 *   - Time-of-day anomaly                      : 0–15 pts
 *   - Geographic / UA anomaly                  : 0–15 pts
 *
 * Thresholds:
 *   - < 30   LOW     — proceed normally
 *   - 30–59  MEDIUM  — allow but flag for monitoring
 *   - 60–79  HIGH    — trigger step-up verification
 *   - ≥ 80   CRITICAL — block + alert
 */

import { createHash } from 'node:crypto';
import { hashIp } from '@szl-holdings/audit';
import { db, loginAttemptsTable, userDevicesTable, usersTable } from '@szl-holdings/db';
import { and, count, eq, gte, isNull, lt } from 'drizzle-orm';
import { logger } from './logger';
import { redisGet } from './redis-client.js';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskSignals {
  ipFailedAttempts: number;
  isKnownDevice: boolean;
  isUnusualHour: boolean;
  isNewIpForUser: boolean;
  uaAnomalyScore: number;
}

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  signals: RiskSignals;
  stepUpRequired: boolean;
  blocked: boolean;
  reasons: string[];
}

const LOOKBACK_WINDOW_MS = 15 * 60 * 1000;
const LOOKBACK_IP_FAILURES_MS = 60 * 60 * 1000;

function scoreToLevel(score: number): RiskLevel {
  if (score < 30) return 'low';
  if (score < 60) return 'medium';
  if (score < 80) return 'high';
  return 'critical';
}

function hashFingerprint(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function isUnusualHour(): boolean {
  const hour = new Date().getUTCHours();
  return hour < 5 || hour > 22;
}

function scoreUaAnomaly(userAgent: string | null): number {
  if (!userAgent) return 15;
  const ua = userAgent.toLowerCase();
  if (ua.includes('curl') || ua.includes('python') || ua.includes('go-http') || ua.includes('wget')) return 25;
  if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) return 25;
  return 0;
}

export async function assessLoginRisk(params: {
  email: string;
  ipAddress: string | null;
  userAgent: string | null;
  deviceFingerprintHash?: string | null;
  userId?: number | null;
}): Promise<RiskAssessment> {
  const { email, ipAddress, userAgent, deviceFingerprintHash, userId } = params;
  const reasons: string[] = [];
  let score = 0;

  const windowStart = new Date(Date.now() - LOOKBACK_IP_FAILURES_MS);
  const ipWindowStart = new Date(Date.now() - LOOKBACK_WINDOW_MS);

  const ipHash = ipAddress ? hashIp(ipAddress) : null;

  const [ipFailureRow, emailFailureRow] = await Promise.all([
    ipHash
      ? db
          .select({ count: count() })
          .from(loginAttemptsTable)
          .where(
            and(
              eq(loginAttemptsTable.ipAddress, ipHash),
              eq(loginAttemptsTable.success, false),
              gte(loginAttemptsTable.createdAt, ipWindowStart),
            ),
          )
          .then(([r]) => r?.count ?? 0)
      : Promise.resolve(0),
    db
      .select({ count: count() })
      .from(loginAttemptsTable)
      .where(
        and(
          eq(loginAttemptsTable.email, email.toLowerCase()),
          eq(loginAttemptsTable.success, false),
          gte(loginAttemptsTable.createdAt, windowStart),
        ),
      )
      .then(([r]) => r?.count ?? 0),
  ]);

  const ipFailedAttempts = Number(ipFailureRow);
  const emailFailedAttempts = Number(emailFailureRow);

  if (ipFailedAttempts >= 10) {
    score += 40;
    reasons.push(`High failed-attempt rate from this IP (${ipFailedAttempts} in last hour)`);
  } else if (ipFailedAttempts >= 5) {
    score += 20;
    reasons.push(`Elevated failed attempts from this IP (${ipFailedAttempts})`);
  } else if (ipFailedAttempts >= 2) {
    score += 10;
  }

  if (emailFailedAttempts >= 5) {
    score += 15;
    reasons.push(`Multiple recent failed attempts for this account`);
  }

  let isKnownDevice = false;
  if (deviceFingerprintHash && userId) {
    const [device] = await db
      .select({ id: userDevicesTable.id, isTrusted: userDevicesTable.isTrusted })
      .from(userDevicesTable)
      .where(
        and(
          eq(userDevicesTable.userId, userId),
          eq(userDevicesTable.fingerprintHash, deviceFingerprintHash),
          isNull(userDevicesTable.revokedAt),
        ),
      )
      .limit(1);

    if (device) {
      isKnownDevice = true;
      if (device.isTrusted) {
        score = Math.max(0, score - 10);
      }
    } else {
      score += 30;
      reasons.push('Sign-in from unrecognized device');
    }
  } else if (userId && !deviceFingerprintHash) {
    score += 15;
    reasons.push('No device fingerprint provided');
  }

  let isNewIpForUser = false;
  if (userId && ipHash) {
    const [knownIpDevice] = await db
      .select({ id: userDevicesTable.id })
      .from(userDevicesTable)
      .where(
        and(
          eq(userDevicesTable.userId, userId),
          eq(userDevicesTable.lastIpHash, ipHash),
          isNull(userDevicesTable.revokedAt),
        ),
      )
      .limit(1);

    if (!knownIpDevice) {
      isNewIpForUser = true;
      score += 10;
      reasons.push('Sign-in from new IP address');
    }
  }

  const unusualHour = isUnusualHour();
  if (unusualHour) {
    score += 10;
    reasons.push('Sign-in outside normal business hours (UTC)');
  }

  const uaScore = scoreUaAnomaly(userAgent);
  score += uaScore;
  if (uaScore > 0) {
    reasons.push('Anomalous user agent detected');
  }

  score = Math.min(100, Math.max(0, score));
  const level = scoreToLevel(score);

  return {
    score,
    level,
    signals: {
      ipFailedAttempts,
      isKnownDevice,
      isUnusualHour: unusualHour,
      isNewIpForUser,
      uaAnomalyScore: uaScore,
    },
    stepUpRequired: level === 'high' || level === 'critical',
    blocked: level === 'critical',
    reasons,
  };
}

export async function recordLoginAttempt(params: {
  email: string;
  ipAddress: string | null;
  success: boolean;
  failureReason?: string;
  deviceFingerprintHash?: string | null;
  riskScore?: number;
}): Promise<void> {
  try {
    const ipHash = params.ipAddress ? hashIp(params.ipAddress) : null;
    await db.insert(loginAttemptsTable).values({
      email: params.email.toLowerCase(),
      ipAddress: ipHash,
      success: params.success,
      failureReason: params.failureReason ?? null,
      deviceFingerprintHash: params.deviceFingerprintHash ?? null,
      riskScore: params.riskScore ?? null,
    });
  } catch (err) {
    logger.warn({ err }, '[adaptive-risk] Failed to record login attempt — non-fatal');
  }
}

export async function getAccountLockoutStatus(
  email: string,
): Promise<{ locked: boolean; lockedUntilMs: number | null; failureCount: number; captchaRequired: boolean }> {
  const windowMs = 15 * 60 * 1000;
  const windowStart = new Date(Date.now() - windowMs);

  const [row] = await db
    .select({ count: count() })
    .from(loginAttemptsTable)
    .where(
      and(
        eq(loginAttemptsTable.email, email.toLowerCase()),
        eq(loginAttemptsTable.success, false),
        gte(loginAttemptsTable.createdAt, windowStart),
      ),
    );

  const failureCount = Number(row?.count ?? 0);

  if (failureCount >= 10) {
    const lockedUntilMs = Date.now() + Math.min(60 * 60 * 1000, Math.pow(2, Math.min(failureCount - 10, 6)) * 1000);
    return { locked: true, lockedUntilMs, failureCount, captchaRequired: true };
  }

  if (failureCount >= 5) {
    return { locked: false, lockedUntilMs: null, failureCount, captchaRequired: true };
  }

  return { locked: false, lockedUntilMs: null, failureCount, captchaRequired: false };
}

export async function upsertUserDevice(params: {
  userId: number;
  fingerprintHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  displayName?: string;
}): Promise<{ isNewDevice: boolean }> {
  const { userId, fingerprintHash, userAgent, ipAddress } = params;
  const ipHash = ipAddress ? hashIp(ipAddress) : null;

  try {
    const [existing] = await db
      .select({ id: userDevicesTable.id })
      .from(userDevicesTable)
      .where(
        and(
          eq(userDevicesTable.userId, userId),
          eq(userDevicesTable.fingerprintHash, fingerprintHash),
          isNull(userDevicesTable.revokedAt),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(userDevicesTable)
        .set({ lastSeenAt: new Date(), lastIpHash: ipHash, userAgent: userAgent ?? undefined })
        .where(eq(userDevicesTable.id, existing.id));
      return { isNewDevice: false };
    }

    const allDevices = await db
      .select({ id: userDevicesTable.id })
      .from(userDevicesTable)
      .where(and(eq(userDevicesTable.userId, userId), isNull(userDevicesTable.revokedAt)));

    const displayName = params.displayName ?? deriveDeviceName(userAgent);

    await db.insert(userDevicesTable).values({
      userId,
      fingerprintHash,
      userAgent: userAgent ?? null,
      displayName,
      lastIpHash: ipHash,
      isTrusted: allDevices.length === 0,
    });

    return { isNewDevice: allDevices.length > 0 };
  } catch (err) {
    logger.warn({ err }, '[adaptive-risk] Failed to upsert user device — non-fatal');
    return { isNewDevice: false };
  }
}

function deriveDeviceName(ua: string | null): string {
  if (!ua) return 'Unknown device';
  const lower = ua.toLowerCase();
  if (lower.includes('iphone')) return 'iPhone';
  if (lower.includes('ipad')) return 'iPad';
  if (lower.includes('android')) return 'Android device';
  if (lower.includes('mac os')) return 'Mac';
  if (lower.includes('windows')) return 'Windows PC';
  if (lower.includes('linux')) return 'Linux device';
  return 'Unknown device';
}

export function hashDeviceFingerprint(raw: string): string {
  return hashFingerprint(raw);
}
