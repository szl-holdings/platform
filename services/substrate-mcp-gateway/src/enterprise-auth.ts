/**
 * Substrate MCP Gateway — Enterprise-Managed Authorization (ID-JAG Flow)
 *
 * Implements MCP spec extension `io.modelcontextprotocol/enterprise-managed-authorization`.
 * Accepts ID-JAG assertions (urn:ietf:params:oauth:grant-type:jwt-bearer) and exchanges
 * them for scoped MCP access tokens.
 *
 * Flow:
 *   1. Client presents a JWT assertion issued by their enterprise IdP
 *   2. Gateway fetches + caches the IdP's JWKS and validates the signature
 *   3. JWT claims (issuer, audience, subject, email, groups/roles) are validated
 *   4. IdP claims are mapped to platform RBAC roles and MCP tool access policies
 *   5. Account linking identifies the platform user (or auto-provisions if allowed)
 *   6. A scoped MCP access token is issued and returned
 *   7. All events are written to the audit log
 *
 * Enterprise IdP configurations are sourced from:
 *   - Environment: MCP_ENTERPRISE_IDP_CONFIG (JSON array of IdP configs)
 *   - Runtime registry updated via the admin API (in-memory, refreshed periodically)
 */

import { createHash, randomBytes } from 'node:crypto';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EnterpriseIdpConfig {
  id: string;
  tenantId: string;
  name: string;
  issuerUrl: string;
  jwksUri: string;
  expectedAudience: string;
  claimsToRoleMapping: ClaimsToRoleMapping;
  autoProvisionUsers: boolean;
  defaultRole: string;
  enabled: boolean;
  jwksCacheTtlSeconds: number;
  requireEmailVerified: boolean;
  notes?: string | null;
}

export interface ClaimsToRoleMapping {
  groups?: Record<string, string>;
  roles?: Record<string, string>;
  customClaims?: Array<{
    claim: string;
    value: string;
    role: string;
  }>;
}

export interface IdJagValidationResult {
  valid: boolean;
  idpId: string | null;
  issuer: string | null;
  subject: string | null;
  email: string | null;
  displayName: string | null;
  mappedRole: string;
  mcpScope: string;
  tenantId: string | null;
  error?: string;
  errorCode?: string;
}

export interface McpEnterpriseToken {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  scope: string;
  issuedAt: number;
  subject: string;
  issuer: string;
  tenantId: string;
  mappedRole: string;
}

// ─── JWKS Cache ────────────────────────────────────────────────────────────────

interface JwksCacheEntry {
  keys: JwkKey[];
  fetchedAt: number;
  ttlSeconds: number;
}

interface JwkKey {
  kid?: string;
  kty: string;
  use?: string;
  alg?: string;
  n?: string;
  e?: string;
  x?: string;
  y?: string;
  crv?: string;
}

const jwksCache = new Map<string, JwksCacheEntry>();

async function fetchJwks(jwksUri: string, ttlSeconds: number): Promise<JwkKey[]> {
  const entry = jwksCache.get(jwksUri);
  if (entry && Date.now() - entry.fetchedAt < entry.ttlSeconds * 1000) {
    return entry.keys;
  }

  const resp = await fetch(jwksUri, {
    headers: { Accept: 'application/json', 'User-Agent': 'szl-substrate-mcp-gateway/1.0' },
    signal: AbortSignal.timeout(10_000),
  });

  if (!resp.ok) {
    throw new Error(`JWKS fetch failed: ${resp.status} ${resp.statusText}`);
  }

  const body = (await resp.json()) as { keys?: JwkKey[] };
  const keys = Array.isArray(body.keys) ? body.keys : [];

  jwksCache.set(jwksUri, { keys, fetchedAt: Date.now(), ttlSeconds });
  return keys;
}

export function invalidateJwksCache(jwksUri: string): void {
  jwksCache.delete(jwksUri);
}

// ─── JWT Parsing (no external dependency) ────────────────────────────────────

function base64UrlDecode(s: string): Buffer {
  const pad = 4 - (s.length % 4);
  const padded = s + (pad < 4 ? '='.repeat(pad) : '');
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function parseJwtUnsafe(token: string): {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  headerB64: string;
  payloadB64: string;
  signatureB64: string;
} | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(base64UrlDecode(parts[0]!).toString('utf8')) as Record<string, unknown>;
    const payload = JSON.parse(base64UrlDecode(parts[1]!).toString('utf8')) as Record<string, unknown>;
    return {
      header,
      payload,
      headerB64: parts[0]!,
      payloadB64: parts[1]!,
      signatureB64: parts[2]!,
    };
  } catch {
    return null;
  }
}

async function verifyJwtSignature(
  jwt: string,
  keys: JwkKey[],
  alg: string,
  kid?: string,
): Promise<boolean> {
  const { createVerify } = await import('node:crypto');
  const parts = jwt.split('.');
  if (parts.length !== 3) return false;

  const signingInput = `${parts[0]}.${parts[1]}`;
  const signatureBytes = base64UrlDecode(parts[2]!);

  const candidateKeys = kid ? keys.filter((k) => !k.kid || k.kid === kid) : keys;
  if (candidateKeys.length === 0) return false;

  for (const key of candidateKeys) {
    if (key.kty !== 'RSA' && key.kty !== 'EC') continue;

    try {
      const cryptoKey = await importJwkKey(key);
      if (!cryptoKey) continue;

      let signature: string;
      if (alg === 'RS256' || alg === 'RS384' || alg === 'RS512') {
        const hashAlg = alg.replace('RS', 'SHA-') as 'SHA-256' | 'SHA-384' | 'SHA-512';
        const verifier = createVerify(hashAlg === 'SHA-256' ? 'RSA-SHA256' : hashAlg === 'SHA-384' ? 'RSA-SHA384' : 'RSA-SHA512');
        verifier.update(signingInput);
        if (verifier.verify(cryptoKey as string, signatureBytes)) return true;
      } else if (alg === 'ES256' || alg === 'ES384' || alg === 'ES512') {
        const hashAlg = alg.replace('ES', 'SHA-');
        const verifier = createVerify(hashAlg === 'SHA-256' ? 'SHA256' : hashAlg === 'SHA-384' ? 'SHA384' : 'SHA512');
        verifier.update(signingInput);
        if (verifier.verify(cryptoKey as string, signatureBytes)) return true;
      }
    } catch {
      // Try next key
    }
  }

  return false;
}

async function importJwkKey(key: JwkKey): Promise<string | null> {
  if (key.kty === 'RSA' && key.n && key.e) {
    const { createPublicKey } = await import('node:crypto');
    try {
      const cryptoKey = createPublicKey(
        { key: { kty: 'RSA', n: key.n, e: key.e }, format: 'jwk' } as unknown as Parameters<typeof createPublicKey>[0],
      );
      return cryptoKey.export({ type: 'spki', format: 'pem' }) as string;
    } catch {
      return null;
    }
  }
  if (key.kty === 'EC' && key.x && key.y && key.crv) {
    const { createPublicKey } = await import('node:crypto');
    try {
      const cryptoKey = createPublicKey(
        { key: { kty: 'EC', x: key.x, y: key.y, crv: key.crv }, format: 'jwk' } as unknown as Parameters<typeof createPublicKey>[0],
      );
      return cryptoKey.export({ type: 'spki', format: 'pem' }) as string;
    } catch {
      return null;
    }
  }
  return null;
}

// ─── Claims Mapping ───────────────────────────────────────────────────────────

const ROLE_TO_MCP_SCOPE: Record<string, string> = {
  // Platform roles
  super_admin: 'mcp:admin mcp:read mcp:write mcp:approve',
  admin: 'mcp:read mcp:write mcp:approve',
  ops: 'mcp:read mcp:write mcp:approve',
  operator: 'mcp:read mcp:write',
  analyst: 'mcp:read mcp:write',
  viewer: 'mcp:read',
  executive_viewer: 'mcp:read',
  // Enterprise (ID-JAG) roles — must be kept in sync with UI role options
  // and with the `mapClaimsToRole` output. mcp_admin is the highest enterprise
  // role and carries the full admin+approve scope surface.
  mcp_admin: 'mcp:admin mcp:read mcp:write mcp:approve',
};

export function mapClaimsToRole(
  payload: Record<string, unknown>,
  mapping: ClaimsToRoleMapping,
  defaultRole: string,
): string {
  const groups = (payload.groups as string[]) ?? (payload['https://platform.szl.ai/groups'] as string[]) ?? [];
  const roles = (payload.roles as string[]) ?? (payload.appRoles as string[]) ?? [];

  if (mapping.roles) {
    for (const role of roles) {
      const mapped = mapping.roles[role];
      if (mapped) return mapped;
    }
  }

  if (mapping.groups) {
    for (const group of groups) {
      const mapped = mapping.groups[group];
      if (mapped) return mapped;
    }
  }

  if (mapping.customClaims) {
    for (const rule of mapping.customClaims) {
      const claimVal = payload[rule.claim];
      if (String(claimVal) === rule.value) return rule.role;
    }
  }

  return defaultRole;
}

export function roleToMcpScope(role: string): string {
  return ROLE_TO_MCP_SCOPE[role] ?? ROLE_TO_MCP_SCOPE['viewer']!;
}

// ─── Enterprise IdP Registry (in-memory, env-seeded) ─────────────────────────

const idpRegistry = new Map<string, EnterpriseIdpConfig>();

export function registerEnterpriseIdp(config: EnterpriseIdpConfig): void {
  idpRegistry.set(config.issuerUrl, config);
}

export function unregisterEnterpriseIdp(issuerUrl: string): void {
  idpRegistry.delete(issuerUrl);
}

export function listEnterpriseIdps(): EnterpriseIdpConfig[] {
  return Array.from(idpRegistry.values());
}

export function getEnterpriseIdpByIssuer(issuerUrl: string): EnterpriseIdpConfig | null {
  return idpRegistry.get(issuerUrl) ?? null;
}

function loadIdpsFromEnv(): void {
  const raw = process.env.MCP_ENTERPRISE_IDP_CONFIG;
  if (!raw) return;
  try {
    const configs = JSON.parse(raw) as EnterpriseIdpConfig[];
    if (!Array.isArray(configs)) return;
    for (const cfg of configs) {
      if (cfg.issuerUrl && cfg.jwksUri && cfg.expectedAudience) {
        idpRegistry.set(cfg.issuerUrl, {
          ...cfg,
          enabled: cfg.enabled !== false,
          autoProvisionUsers: cfg.autoProvisionUsers ?? false,
          defaultRole: cfg.defaultRole ?? 'viewer',
          jwksCacheTtlSeconds: cfg.jwksCacheTtlSeconds ?? 3600,
          requireEmailVerified: cfg.requireEmailVerified !== false,
          claimsToRoleMapping: cfg.claimsToRoleMapping ?? {},
        });
      }
    }
  } catch {
    console.warn('[enterprise-auth] Failed to parse MCP_ENTERPRISE_IDP_CONFIG');
  }
}

loadIdpsFromEnv();

// ─── Issued Enterprise Tokens ─────────────────────────────────────────────────

const enterpriseTokens = new Map<string, McpEnterpriseToken>();

const TOKEN_TTL_SECONDS = parseInt(process.env.MCP_ENTERPRISE_TOKEN_TTL ?? '3600', 10);

export function getEnterpriseToken(accessToken: string): McpEnterpriseToken | null {
  const tok = enterpriseTokens.get(accessToken);
  if (!tok) return null;
  if (Date.now() > tok.issuedAt + tok.expiresIn * 1000) {
    enterpriseTokens.delete(accessToken);
    return null;
  }
  return tok;
}

export function revokeEnterpriseTokensForSubject(issuer: string, subject: string): number {
  let revoked = 0;
  for (const [key, tok] of enterpriseTokens.entries()) {
    if (tok.issuer === issuer && tok.subject === subject) {
      enterpriseTokens.delete(key);
      revoked++;
    }
  }
  return revoked;
}

// ─── Revocation Registry (in-memory cache + DB-persisted) ────────────────────
// Revocations are persisted to the api-server DB via /api/enterprise-mcp/internal-revoke
// so the state survives gateway restarts and is shared across multiple instances.
// The in-memory set is a local cache: populated at startup via syncRevokedSubjectsFromDb()
// and updated in real-time as revocation webhooks arrive.

const revokedSubjects = new Set<string>();

function revokedKey(issuer: string, subject: string): string {
  return createHash('sha256').update(`${issuer}|${subject}`).digest('hex');
}

export function revokeSubject(issuer: string, subject: string): void {
  revokedSubjects.add(revokedKey(issuer, subject));
}

export function isSubjectRevoked(issuer: string, subject: string): boolean {
  return revokedSubjects.has(revokedKey(issuer, subject));
}

// persistRevocationToDb fire-and-forgets a DB write via the api-server internal endpoint.
async function persistRevocationToDb(issuer: string, subject: string, reason?: string, revokedBy?: string): Promise<void> {
  const apiBase = process.env.MCP_API_SERVER_BASE_URL ??
    (process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'http://localhost:3000');
  const internalToken = process.env.ALLOY_INTERNAL_TOKEN;
  if (!internalToken) return;

  try {
    await fetch(`${apiBase}/api/enterprise-mcp/internal-revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-token': internalToken },
      body: JSON.stringify({ issuer, subject, reason, revokedBy }),
      signal: AbortSignal.timeout(3_000),
    });
  } catch {
    // Best-effort — revocation is already applied in-memory
  }
}

// syncRevokedSubjectsFromDb loads all previously revoked (issuer, subject) pairs
// from the api-server DB into the local in-memory set. Call this once at startup.
export async function syncRevokedSubjectsFromDb(): Promise<void> {
  const apiBase = process.env.MCP_API_SERVER_BASE_URL ??
    (process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'http://localhost:3000');
  const internalToken = process.env.ALLOY_INTERNAL_TOKEN;
  if (!internalToken) return;

  try {
    const resp = await fetch(`${apiBase}/api/enterprise-mcp/revoked-subjects`, {
      headers: { 'x-internal-token': internalToken },
      signal: AbortSignal.timeout(5_000),
    });
    if (!resp.ok) return;

    const data = (await resp.json()) as { subjects: Array<{ issuer: string; subject: string }> };
    let loaded = 0;
    for (const { issuer, subject } of data.subjects ?? []) {
      revokedSubjects.add(revokedKey(issuer, subject));
      loaded++;
    }
    if (loaded > 0) {
      console.log(`[enterprise-auth] Synced ${loaded} revoked subject(s) from DB at startup`);
    }
  } catch {
    // Non-fatal — the gateway can still operate; revocations will be
    // re-applied as webhooks arrive and are re-persisted on the next revoke event.
    console.warn('[enterprise-auth] Could not sync revoked subjects from DB at startup');
  }
}

// syncIdpConfigsFromDb loads all enabled enterprise IdP configurations from the
// api-server DB at gateway startup. Without this, the gateway's in-memory IdP
// registry starts empty after a restart and rejects all enterprise token exchanges
// until each IdP is manually re-pushed via the admin API.
export async function syncIdpConfigsFromDb(): Promise<void> {
  const apiBase = process.env.MCP_API_SERVER_BASE_URL ??
    (process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'http://localhost:3000');
  const internalToken = process.env.ALLOY_INTERNAL_TOKEN;
  if (!internalToken) return;

  try {
    const resp = await fetch(`${apiBase}/api/enterprise-mcp/idp-configs`, {
      headers: { 'x-internal-token': internalToken },
      signal: AbortSignal.timeout(5_000),
    });
    if (!resp.ok) return;

    const data = (await resp.json()) as { idps: EnterpriseIdpConfig[] };
    let loaded = 0;
    for (const config of data.idps ?? []) {
      if (config.issuerUrl && config.jwksUri && config.expectedAudience) {
        registerEnterpriseIdp(config);
        loaded++;
      }
    }
    if (loaded > 0) {
      console.log(`[enterprise-auth] Synced ${loaded} enterprise IdP config(s) from DB at startup`);
    }
  } catch {
    console.warn('[enterprise-auth] Could not sync IdP configs from DB at startup');
  }
}

// ─── Audit Callback ───────────────────────────────────────────────────────────

type AuditEvent = {
  eventType: string;
  tenantId?: string | null;
  idpId?: string | null;
  issuer?: string | null;
  subject?: string | null;
  email?: string | null;
  mappedRole?: string | null;
  mcpScope?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
};

async function emitAuditEvent(event: AuditEvent): Promise<void> {
  const apiBase = process.env.MCP_API_SERVER_BASE_URL ??
    (process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'http://localhost:3000');
  const internalToken = process.env.ALLOY_INTERNAL_TOKEN;
  if (!internalToken) return;

  try {
    await fetch(`${apiBase}/api/enterprise-mcp/audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': internalToken,
      },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(3_000),
    });
  } catch {
    // Audit emission is best-effort — never block the auth flow
  }
}

// ─── Core ID-JAG Validation ───────────────────────────────────────────────────

export async function validateIdJag(
  assertionJwt: string,
  ipAddress?: string,
): Promise<IdJagValidationResult> {
  const parsed = parseJwtUnsafe(assertionJwt);
  if (!parsed) {
    return failure('invalid_token', 'Assertion JWT is malformed');
  }

  const { header, payload } = parsed;
  const issuer = payload.iss as string | undefined;
  const alg = header.alg as string | undefined;
  const kid = header.kid as string | undefined;

  if (!issuer) {
    return failure('invalid_token', 'JWT missing iss claim');
  }
  if (!alg || (!alg.startsWith('RS') && !alg.startsWith('ES'))) {
    return failure('invalid_token', `Unsupported algorithm: ${alg ?? 'none'}`);
  }

  const idp = getEnterpriseIdpByIssuer(issuer);
  if (!idp || !idp.enabled) {
    return failure('unauthorized_client', `Issuer not recognized or IdP disabled: ${issuer}`);
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = payload.exp as number | undefined;
  const nbf = payload.nbf as number | undefined;

  if (!exp || exp < now) {
    await emitAuditEvent({ eventType: 'idjag_validation_failure', issuer, errorCode: 'token_expired', ipAddress });
    return failure('invalid_grant', 'JWT has expired');
  }
  if (nbf && nbf > now + 60) {
    return failure('invalid_grant', 'JWT not yet valid (nbf)');
  }

  const aud = payload.aud as string | string[] | undefined;
  const audiences = Array.isArray(aud) ? aud : (aud ? [aud] : []);
  if (!audiences.includes(idp.expectedAudience)) {
    await emitAuditEvent({ eventType: 'idjag_validation_failure', issuer, errorCode: 'invalid_audience', ipAddress });
    return failure('invalid_grant', `JWT audience mismatch. Expected: ${idp.expectedAudience}`);
  }

  if (idp.requireEmailVerified) {
    const emailVerified = payload.email_verified as boolean | undefined;
    if (emailVerified === false) {
      return failure('access_denied', 'IdP requires a verified email address');
    }
  }

  let keys: JwkKey[];
  try {
    keys = await fetchJwks(idp.jwksUri, idp.jwksCacheTtlSeconds);
  } catch (err) {
    await emitAuditEvent({ eventType: 'idjag_validation_failure', issuer, errorCode: 'jwks_fetch_error', ipAddress });
    return failure('server_error', `JWKS fetch failed: ${err instanceof Error ? err.message : 'unknown'}`);
  }

  let signatureValid: boolean;
  try {
    signatureValid = await verifyJwtSignature(assertionJwt, keys, alg, kid);
  } catch {
    signatureValid = false;
  }

  if (!signatureValid) {
    if (kid) {
      invalidateJwksCache(idp.jwksUri);
      try {
        const freshKeys = await fetchJwks(idp.jwksUri, idp.jwksCacheTtlSeconds);
        signatureValid = await verifyJwtSignature(assertionJwt, freshKeys, alg, kid);
      } catch {
        signatureValid = false;
      }
    }

    if (!signatureValid) {
      await emitAuditEvent({ eventType: 'idjag_validation_failure', issuer, errorCode: 'invalid_signature', ipAddress });
      return failure('invalid_grant', 'JWT signature verification failed');
    }
  }

  const subject = (payload.sub as string | undefined) ?? null;
  const email = (payload.email as string | undefined) ?? null;
  const displayName = (payload.name as string | undefined) ?? (payload.preferred_username as string | undefined) ?? email ?? subject ?? 'Unknown';

  if (!subject) {
    return failure('invalid_grant', 'JWT missing sub claim');
  }

  if (isSubjectRevoked(issuer, subject)) {
    await emitAuditEvent({ eventType: 'idjag_validation_failure', issuer, subject, email, errorCode: 'subject_revoked', ipAddress });
    return failure('access_denied', 'User has been revoked from enterprise MCP access');
  }

  const mappedRole = mapClaimsToRole(payload, idp.claimsToRoleMapping, idp.defaultRole);
  const mcpScope = roleToMcpScope(mappedRole);

  await emitAuditEvent({
    eventType: 'idjag_validation_success',
    tenantId: idp.tenantId,
    idpId: idp.id,
    issuer,
    subject,
    email,
    mappedRole,
    mcpScope,
    ipAddress,
    metadata: { alg, kid, aud: audiences },
  });

  return {
    valid: true,
    idpId: idp.id,
    issuer,
    subject,
    email,
    displayName,
    mappedRole,
    mcpScope,
    tenantId: idp.tenantId,
  };
}

// ─── Account Linking / Auto-Provisioning ──────────────────────────────────────

/**
 * Calls the api-server to link an enterprise identity to a platform user,
 * or provision a new user if `autoProvisionUsers` is enabled and no match exists.
 * Best-effort — never blocks token issuance. Returns the platform userId if found.
 */
export async function linkOrProvisionUser(
  idp: EnterpriseIdpConfig,
  subject: string,
  email: string | null,
  mappedRole: string,
  ipAddress?: string,
): Promise<number | null> {
  const apiBase = process.env.MCP_API_SERVER_BASE_URL ??
    (process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'http://localhost:3000');
  const internalToken = process.env.ALLOY_INTERNAL_TOKEN;
  if (!internalToken) return null;

  try {
    const resp = await fetch(`${apiBase}/api/enterprise-mcp/link-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': internalToken,
      },
      body: JSON.stringify({
        tenantId: idp.tenantId,
        idpId: idp.id,
        issuer: idp.issuerUrl,
        subject,
        email,
        mappedRole,
        autoProvision: idp.autoProvisionUsers,
        ipAddress,
      }),
      signal: AbortSignal.timeout(3_000),
    });
    if (!resp.ok) return null;
    const data = await resp.json() as { userId?: number | null };
    return data.userId ?? null;
  } catch {
    return null;
  }
}

function failure(errorCode: string, error: string): IdJagValidationResult {
  return {
    valid: false,
    idpId: null,
    issuer: null,
    subject: null,
    email: null,
    displayName: null,
    mappedRole: 'viewer',
    mcpScope: '',
    tenantId: null,
    error,
    errorCode,
  };
}

// ─── Token Issuance ───────────────────────────────────────────────────────────

export async function issueEnterpriseToken(
  validation: IdJagValidationResult,
  ipAddress?: string,
): Promise<McpEnterpriseToken> {
  const accessToken = randomBytes(32).toString('base64url');

  const token: McpEnterpriseToken = {
    accessToken,
    tokenType: 'Bearer',
    expiresIn: TOKEN_TTL_SECONDS,
    scope: validation.mcpScope,
    issuedAt: Date.now(),
    subject: validation.subject!,
    issuer: validation.issuer!,
    tenantId: validation.tenantId!,
    mappedRole: validation.mappedRole,
  };

  enterpriseTokens.set(accessToken, token);

  await emitAuditEvent({
    eventType: 'token_issued',
    tenantId: validation.tenantId,
    idpId: validation.idpId,
    issuer: validation.issuer,
    subject: validation.subject,
    email: validation.email,
    mappedRole: validation.mappedRole,
    mcpScope: validation.mcpScope,
    ipAddress,
    metadata: { expiresIn: TOKEN_TTL_SECONDS, scope: validation.mcpScope },
  });

  return token;
}

// ─── Enterprise Token Validation (for auth middleware) ────────────────────────

export function resolveEnterpriseAuthContext(bearerToken: string): {
  authenticated: boolean;
  actorId: string;
  role: string;
  scope: string;
  enterprise: true;
} | null {
  const tok = getEnterpriseToken(bearerToken);
  if (!tok) return null;

  if (isSubjectRevoked(tok.issuer, tok.subject)) {
    enterpriseTokens.delete(bearerToken);
    return null;
  }

  return {
    authenticated: true,
    actorId: `enterprise:${tok.issuer}:${tok.subject}`,
    role: tok.mappedRole,
    scope: tok.scope,
    enterprise: true,
  };
}

// ─── Revocation Webhook Handler ────────────────────────────────────────────────

export interface RevocationWebhookPayload {
  issuer: string;
  subject: string;
  reason?: string;
  revokedBy?: string;
}

export async function handleRevocationWebhook(
  payload: RevocationWebhookPayload,
  ipAddress?: string,
): Promise<{ revoked: number }> {
  const { issuer, subject, reason, revokedBy } = payload;

  // Apply in-memory revocation immediately (synchronous — takes effect for all
  // subsequent token validations in this process without any network round-trip).
  revokeSubject(issuer, subject);

  // Persist to DB asynchronously so other gateway instances (and restarts)
  // inherit the revocation state without relying on a fresh webhook delivery.
  void persistRevocationToDb(issuer, subject, reason, revokedBy);

  const tokenCount = revokeEnterpriseTokensForSubject(issuer, subject);

  await emitAuditEvent({
    eventType: 'token_revoked',
    issuer,
    subject,
    ipAddress,
    metadata: { reason, revokedBy, tokensRevoked: tokenCount },
  });

  return { revoked: tokenCount };
}
