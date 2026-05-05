/**
 * Identity Bootstrap
 *
 * Called once during server startup (after migrations) to:
 *   1. Ensure the platform root signing key exists via the key custody service.
 *   2. Mint the platform-service DID (`did:plat:platform_service:szl-api-server`).
 *   3. Validate the custody backend is reachable.
 *
 * On a fresh DB this runs bootstrap; on an existing DB it verifies the key is
 * still there and returns immediately. Never blocks startup on non-fatal errors.
 */

import { getKeyCustodyProvider } from './key-custody';
import { ensurePlatformServiceDid, getPlatformServiceDid } from './platform-did-registry';
import { logger } from './logger';

let _bootstrapped = false;
let _bootstrapTimestamp: string | null = null;

export async function bootstrapPlatformIdentity(): Promise<{
  platformServiceDid: string;
  bootstrapTimestamp: string;
}> {
  if (_bootstrapped && _bootstrapTimestamp && getPlatformServiceDid()) {
    return {
      platformServiceDid: getPlatformServiceDid()!,
      bootstrapTimestamp: _bootstrapTimestamp,
    };
  }

  const custody = getKeyCustodyProvider();

  const platformServiceDid = await ensurePlatformServiceDid();

  const meta = await custody.getActiveKeyMeta(platformServiceDid);
  if (!meta) {
    throw new Error(
      '[identity-bootstrap] Platform service DID exists but has no active key — inconsistent state',
    );
  }

  _bootstrapped = true;
  _bootstrapTimestamp = new Date().toISOString();

  logger.info(
    {
      platformServiceDid,
      keyId: meta.keyId,
      schemeVersion: meta.schemeVersion,
      bootstrappedAt: _bootstrapTimestamp,
    },
    '[identity-bootstrap] Platform identity bootstrapped',
  );

  return { platformServiceDid, bootstrapTimestamp: _bootstrapTimestamp };
}

export function isIdentityBootstrapped(): boolean {
  return _bootstrapped;
}

export function getBootstrapTimestamp(): string | null {
  return _bootstrapTimestamp;
}
