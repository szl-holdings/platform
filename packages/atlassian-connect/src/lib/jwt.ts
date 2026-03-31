/**
 * Atlassian Connect JWT verification.
 *
 * Every inbound request from Jira (lifecycle hooks, webhook events, iframe pages)
 * must carry a valid JWT signed with the tenant's shared secret. This module
 * verifies the token and returns the decoded payload or throws.
 *
 * Spec: https://developer.atlassian.com/cloud/jira/platform/understanding-jwt/
 */

import { createHmac, timingSafeEqual } from "crypto";
import { getTenant } from "../lib/tenantStore.js";

interface JWTHeader {
  alg: string;
  typ: string;
}

interface ConnectJWTPayload {
  iss: string;
  iat: number;
  exp: number;
  qsh?: string;
  sub?: string;
}

function base64urlDecode(str: string): Buffer {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + "=".repeat(padding), "base64");
}

export class JWTVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JWTVerificationError";
  }
}

export function verifyConnectJWT(token: string, sharedSecret: string): ConnectJWTPayload {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new JWTVerificationError("Malformed JWT: expected 3 parts");
  }

  const [headerB64, payloadB64, signatureB64] = parts as [string, string, string];

  const header = JSON.parse(base64urlDecode(headerB64).toString("utf-8")) as JWTHeader;
  if (header.alg !== "HS256") {
    throw new JWTVerificationError(`Unsupported JWT algorithm: ${header.alg}`);
  }

  const signingInput = `${headerB64}.${payloadB64}`;
  const expectedSig = createHmac("sha256", sharedSecret).update(signingInput).digest();
  const actualSig = base64urlDecode(signatureB64);

  if (expectedSig.length !== actualSig.length || !timingSafeEqual(expectedSig, actualSig)) {
    throw new JWTVerificationError("JWT signature verification failed");
  }

  const payload = JSON.parse(base64urlDecode(payloadB64).toString("utf-8")) as ConnectJWTPayload;

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (payload.exp !== undefined && payload.exp < nowSeconds) {
    throw new JWTVerificationError("JWT has expired");
  }
  if (payload.iat !== undefined && payload.iat > nowSeconds + 60) {
    throw new JWTVerificationError("JWT issued in the future");
  }

  return payload;
}

export function extractJWTFromRequest(req: {
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, unknown>;
}): string | null {
  const authHeader = req.headers["authorization"];
  if (authHeader && typeof authHeader === "string" && authHeader.startsWith("JWT ")) {
    return authHeader.slice(4);
  }
  const queryJwt = req.query["jwt"];
  if (queryJwt && typeof queryJwt === "string") {
    return queryJwt;
  }
  return null;
}

export async function verifyRequestJWT(
  req: {
    headers: Record<string, string | string[] | undefined>;
    query: Record<string, unknown>;
    body: unknown;
  },
): Promise<ConnectJWTPayload> {
  const token = extractJWTFromRequest(req);
  if (!token) {
    throw new JWTVerificationError("No JWT found in request");
  }

  let issuer: string;
  try {
    const [, payloadB64] = token.split(".") as [string, string, string];
    const decoded = JSON.parse(base64urlDecode(payloadB64).toString("utf-8")) as ConnectJWTPayload;
    issuer = decoded.iss;
  } catch {
    throw new JWTVerificationError("Failed to decode JWT payload");
  }

  const tenant = await getTenant(issuer);
  if (!tenant) {
    throw new JWTVerificationError(`Unknown tenant clientKey: ${issuer}`);
  }

  return verifyConnectJWT(token, tenant.sharedSecret);
}
