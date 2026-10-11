import { randomBytes } from 'node:crypto';

export interface LocalOAuthToken {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  issuedAt: number;
  scope: string;
  actorId: string;
  tenantId: string;
}

const issuedTokens = new Map<string, LocalOAuthToken>();

export function issueLocalOAuthToken(input: {
  actorId: string;
  tenantId: string;
  scope: string;
}): LocalOAuthToken {
  const token: LocalOAuthToken = {
    accessToken: randomBytes(32).toString('base64url'),
    tokenType: 'Bearer',
    expiresIn: 3600,
    issuedAt: Date.now(),
    scope: input.scope,
    actorId: input.actorId,
    tenantId: input.tenantId,
  };
  issuedTokens.set(token.accessToken, token);
  return token;
}

export function resolveLocalOAuthToken(accessToken: string): LocalOAuthToken | undefined {
  const token = issuedTokens.get(accessToken);
  if (!token) return undefined;
  if (Date.now() >= token.issuedAt + token.expiresIn * 1000) {
    issuedTokens.delete(accessToken);
    return undefined;
  }
  return token;
}

export function revokeLocalOAuthTokensForActor(actorId: string): number {
  let revoked = 0;
  for (const [accessToken, token] of issuedTokens) {
    if (token.actorId !== actorId) continue;
    issuedTokens.delete(accessToken);
    revoked++;
  }
  return revoked;
}
