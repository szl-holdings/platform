/**
 * ANP (Agent Negotiation Protocol) Identity & Negotiation Layer
 *
 * Implements the ANP three-layer stack:
 * 1. DID-based identity verification (did:web method — claim + format validation)
 * 2. Meta-protocol negotiation (agents negotiate which protocol to use)
 * 3. Agent Description Protocol (ADP) documents in JSON-LD
 *
 * Trust Model:
 * - "trusted": DID is in the platform's trusted agent registry
 * - "verified": Valid did:web format + Bearer token present (claim accepted)
 * - "anonymous": No DID and no token — REJECTED for all protected operations
 *
 * Note: Full cryptographic DID proof (key resolution + signature verification) is
 * an out-of-scope extension requiring a DID resolver service. Current implementation
 * enforces format validity and trust-registry membership, and rejects unauthenticated
 * requests with clear error messages.
 */

import { createHmac } from "crypto";
import { logger } from "./logger";

const BASE_URL = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : `http://localhost:${process.env["PORT"] || 8080}`;

const PLATFORM_JWT_SECRET = process.env["SESSION_SECRET"] ?? process.env["JWT_SECRET"];
if (!PLATFORM_JWT_SECRET) {
  // Warn at startup — token-based ANP verification will be unavailable until configured
  // eslint-disable-next-line no-console
  console.warn("[anp] WARNING: SESSION_SECRET or JWT_SECRET not set — Bearer token validation disabled. Set the secret to enable token-based ANP identity.");
}

export interface ANPNegotiationRequest {
  did?: string;
  preferredProtocols: Array<"mcp" | "a2a" | "anp" | "acp">;
  capabilities?: string[];
  agentInfo?: {
    name: string;
    version: string;
    description?: string;
  };
  authToken?: string;
}

export interface ANPNegotiationResult {
  negotiatedProtocol: "mcp" | "a2a" | "anp" | "acp";
  endpoint: string;
  sessionToken: string;
  expiresAt: string;
  capabilities: string[];
  governanceRequired: boolean;
  trustLevel: "trusted" | "verified" | "anonymous";
}

export interface ANPIdentityVerification {
  verified: boolean;
  did?: string;
  trustLevel: "trusted" | "verified" | "anonymous";
  agentId?: string;
  reason: string;
}

// Platform's own agent DIDs — automatically trusted
const TRUSTED_DIDS = new Set([
  "did:web:vessels.szlholdings.com",
  "did:web:aegis.szlholdings.com",
  "did:web:terra.szlholdings.com",
  "did:web:prism.szlholdings.com",
  "did:web:lyte.szlholdings.com",
  "did:web:carlota-jo.szlholdings.com",
  "did:web:inca.szlholdings.com",
]);

const DID_WEB_PATTERN = /^did:web:[a-zA-Z0-9.-]+(:[a-zA-Z0-9._-]+)*$/;

const PROTOCOL_PRIORITY: Array<"mcp" | "a2a" | "anp" | "acp"> = ["a2a", "mcp", "acp", "anp"];
const PLATFORM_PROTOCOLS: Array<"mcp" | "a2a" | "anp" | "acp"> = ["mcp", "a2a", "anp", "acp"];

function generateSessionToken(): string {
  return `anp_sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getProtocolEndpoint(protocol: "mcp" | "a2a" | "anp" | "acp", agentId?: string): string {
  const apiBase = `${BASE_URL}/api`;
  switch (protocol) {
    case "mcp": return `${apiBase}/mcp`;
    case "a2a": return agentId ? `${apiBase}/a2a/agents/${agentId}` : `${apiBase}/a2a`;
    case "anp": return `${apiBase}/alloy/gateway`;
    case "acp": return `${apiBase}/alloy/gateway`;
    default: return `${apiBase}/alloy/gateway`;
  }
}

/**
 * Validate a Bearer token using HMAC-SHA256 against the platform secret.
 *
 * Only platform-issued HMAC-signed tokens (szl_agent_<id>_<sig>) are accepted.
 * JWT-shaped strings and opaque tokens are NOT accepted without signature verification.
 * If the platform secret is not configured, all token validation fails.
 */
function validateBearerToken(token: string): { valid: boolean; trusted: boolean; agentId?: string } {
  if (!token || token.length < 10) {
    return { valid: false, trusted: false };
  }

  // Require the signing secret to be configured
  if (!PLATFORM_JWT_SECRET) {
    return { valid: false, trusted: false };
  }

  // Only accept platform-issued HMAC tokens with the szl_agent_* prefix
  if (!token.startsWith("szl_agent_")) {
    return { valid: false, trusted: false };
  }

  const parts = token.split("_");
  // Expected format: szl_agent_<agentId>_<16-char-hmac-sig>
  if (parts.length < 4) {
    return { valid: false, trusted: false };
  }

  const agentId = parts[2];
  const claimedSig = parts.slice(3).join("_");

  if (!agentId || !claimedSig) {
    return { valid: false, trusted: false };
  }

  const expectedSig = createHmac("sha256", PLATFORM_JWT_SECRET)
    .update(`szl_agent_${agentId}`)
    .digest("hex")
    .slice(0, 16);

  if (claimedSig !== expectedSig) {
    return { valid: false, trusted: false };
  }

  const isTrusted = TRUSTED_DIDS.has(`did:web:${agentId}.szlholdings.com`);
  return { valid: true, trusted: isTrusted, agentId };
}

export function verifyANPIdentity(req: {
  headers: Record<string, string | string[] | undefined>;
}): ANPIdentityVerification {
  const didHeader = Array.isArray(req.headers["x-anp-did"])
    ? req.headers["x-anp-did"][0]
    : req.headers["x-anp-did"] as string | undefined;

  const authHeader = Array.isArray(req.headers["authorization"])
    ? req.headers["authorization"][0]
    : req.headers["authorization"] as string | undefined;

  // Case 1: No identity at all — anonymous, rejected
  if (!didHeader && !authHeader) {
    return {
      verified: false,
      trustLevel: "anonymous",
      reason: "No identity provided — DID or Bearer token required",
    };
  }

  // Case 2: DID-based identity
  if (didHeader) {
    // Only did:web is supported
    if (!didHeader.startsWith("did:web:")) {
      return {
        verified: false,
        trustLevel: "anonymous",
        did: didHeader,
        reason: `Unsupported DID method — only did:web is accepted (got: ${didHeader.split(":")[1] ?? "unknown"})`,
      };
    }

    // Validate DID format
    if (!DID_WEB_PATTERN.test(didHeader)) {
      return {
        verified: false,
        trustLevel: "anonymous",
        did: didHeader,
        reason: "Invalid did:web format — must match did:web:hostname[:path-segments]",
      };
    }

    const isTrusted = TRUSTED_DIDS.has(didHeader);
    const agentId = didHeader.replace("did:web:", "").split(":").join(".");

    // Trusted DIDs (in the platform registry) still require a valid platform token.
    // The registry grants HITL bypass (trustLevel = "trusted"), but does NOT bypass
    // authentication. Accepting DID header value alone is spoofable — a caller can
    // forge the X-ANP-DID header to match any trusted DID without holding valid credentials.
    if (isTrusted) {
      if (!authHeader?.startsWith("Bearer ")) {
        return {
          verified: false,
          did: didHeader,
          trustLevel: "anonymous",
          reason: "Registry-listed trusted DID requires a valid platform Bearer token. DID header alone is not sufficient proof of identity.",
        };
      }
      const token = authHeader.slice(7);
      const tokenResult = validateBearerToken(token);
      if (!tokenResult.valid) {
        return {
          verified: false,
          did: didHeader,
          trustLevel: "anonymous",
          reason: "Registry-listed trusted DID presented an invalid Bearer token. Must provide a valid szl_agent_<id>_<sig> HMAC platform token.",
        };
      }
      return {
        verified: true,
        did: didHeader,
        trustLevel: "trusted",
        agentId: tokenResult.agentId ?? agentId,
        reason: "Trusted platform agent — DID in registry + valid platform token verified",
      };
    }

    // Non-trusted DIDs: require a valid Bearer token as proof of control.
    // The token's agentId MUST match the DID domain to prevent token→DID spoofing.
    // Format-only DID headers (no token or invalid token) are rejected — we cannot
    // cryptographically verify DID ownership without a bound platform token.
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const tokenResult = validateBearerToken(token);
      if (tokenResult.valid) {
        // Bind DID claim to token identity: token agentId must match DID domain
        const didDomain = agentId; // agentId = DID domain e.g. "vessels.szlholdings.com"
        const tokenAgentDomain = tokenResult.agentId
          ? `${tokenResult.agentId}.szlholdings.com`
          : null;
        if (tokenResult.agentId && tokenAgentDomain !== didDomain) {
          return {
            verified: false,
            did: didHeader,
            trustLevel: "anonymous",
            reason: `DID claim rejected — token agentId (${tokenResult.agentId}) does not match DID domain (${didDomain}). Token must correspond to the claimed DID.`,
          };
        }
        return {
          verified: true,
          did: didHeader,
          trustLevel: tokenResult.trusted ? "trusted" : "verified",
          agentId: tokenResult.agentId ?? agentId,
          reason: tokenResult.trusted
            ? "Trusted platform agent — DID + bound token verified"
            : "Verified did:web + bound Bearer token — HITL required for cross-protocol boundaries",
        };
      }
    }

    // DID present but no valid token — reject; format-only DID claims are not accepted
    return {
      verified: false,
      did: didHeader,
      trustLevel: "anonymous",
      reason: "did:web identity rejected — platform Bearer token required to authenticate DID claim (format-only DIDs are not accepted)",
    };
  }

  // Case 3: Bearer token only (no DID)
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const result = validateBearerToken(token);

    if (!result.valid) {
      return {
        verified: false,
        trustLevel: "anonymous",
        reason: "Invalid Bearer token — must be a platform-issued szl_agent_<id>_<sig> HMAC token",
      };
    }

    return {
      verified: true,
      trustLevel: result.trusted ? "trusted" : "verified",
      agentId: result.agentId,
      reason: result.trusted
        ? "Trusted platform agent token"
        : "Verified Bearer token — claim accepted",
    };
  }

  // Malformed auth header
  return {
    verified: false,
    trustLevel: "anonymous",
    reason: "Invalid authorization header — must be 'Bearer <token>'",
  };
}

export function negotiateProtocol(
  request: ANPNegotiationRequest,
  identity: ANPIdentityVerification,
): ANPNegotiationResult {
  const requested = request.preferredProtocols.filter(p => PLATFORM_PROTOCOLS.includes(p));

  let negotiatedProtocol: "mcp" | "a2a" | "anp" | "acp" = "acp";
  for (const preferred of PROTOCOL_PRIORITY) {
    if (requested.includes(preferred)) {
      negotiatedProtocol = preferred;
      break;
    }
  }

  if (requested.length === 0) {
    negotiatedProtocol = "acp";
  }

  const governanceRequired =
    identity.trustLevel !== "trusted" ||
    (negotiatedProtocol === "anp" && identity.trustLevel === "verified");

  const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

  logger.info({
    negotiatedProtocol,
    trustLevel: identity.trustLevel,
    did: identity.did,
    governanceRequired,
  }, "ANP protocol negotiation completed");

  return {
    negotiatedProtocol,
    endpoint: getProtocolEndpoint(negotiatedProtocol),
    sessionToken: generateSessionToken(),
    expiresAt,
    capabilities: request.capabilities ?? ["task-delegation", "tool-execution"],
    governanceRequired,
    trustLevel: identity.trustLevel,
  };
}

export function buildADPDocument(agentId: string, name: string, description: string): Record<string, unknown> {
  const did = `did:web:${BASE_URL.replace(/^https?:\/\//, "")}:agents:${agentId}`;

  return {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/anp/v1",
    ],
    "@type": "AgentDescription",
    id: did,
    name,
    description,
    controller: did,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    protocolSupport: {
      mcp: { version: "2024-11-05", endpoint: `${BASE_URL}/api/mcp` },
      a2a: { version: "0.3.0", endpoint: `${BASE_URL}/api/a2a/agents/${agentId}` },
      anp: { version: "1.0.0", endpoint: `${BASE_URL}/api/alloy/gateway` },
      acp: { version: "1.0.0", endpoint: `${BASE_URL}/api/alloy/gateway` },
    },
    negotiation: {
      endpoint: `${BASE_URL}/api/alloy/gateway/negotiate`,
      supportedProtocols: ["mcp", "a2a", "anp", "acp"],
      preferenceOrder: ["a2a", "mcp", "acp", "anp"],
    },
    governance: {
      requiresApproval: true,
      hitlForExternalAgents: true,
      auditTrail: true,
    },
    authRequirements: {
      methods: ["did:web", "Bearer"],
      minimumTrustLevel: "verified",
      trustedIssuers: Array.from(TRUSTED_DIDS),
    },
  };
}

export interface ANPTelemetryEntry {
  timestamp: string;
  did?: string;
  requestedProtocols: string[];
  negotiatedProtocol: string;
  trustLevel: string;
  governanceRequired: boolean;
  latencyMs: number;
  success: boolean;
}

const anpTelemetry: ANPTelemetryEntry[] = [];
const MAX_ANP_TELEMETRY = 500;

export function recordANPTelemetry(entry: ANPTelemetryEntry): void {
  anpTelemetry.unshift(entry);
  if (anpTelemetry.length > MAX_ANP_TELEMETRY) {
    anpTelemetry.length = MAX_ANP_TELEMETRY;
  }
}

export function getANPTelemetry(limit = 50): ANPTelemetryEntry[] {
  return anpTelemetry.slice(0, limit);
}

export function getANPStats(): Record<string, unknown> {
  const total = anpTelemetry.length;
  if (total === 0) {
    return { total: 0, byProtocol: {}, byTrustLevel: {}, successRate: 1 };
  }

  const byProtocol: Record<string, number> = {};
  const byTrustLevel: Record<string, number> = {};
  let successCount = 0;
  let totalLatency = 0;

  for (const entry of anpTelemetry) {
    byProtocol[entry.negotiatedProtocol] = (byProtocol[entry.negotiatedProtocol] ?? 0) + 1;
    byTrustLevel[entry.trustLevel] = (byTrustLevel[entry.trustLevel] ?? 0) + 1;
    if (entry.success) successCount++;
    totalLatency += entry.latencyMs;
  }

  return {
    total,
    byProtocol,
    byTrustLevel,
    successRate: successCount / total,
    avgLatencyMs: totalLatency / total,
  };
}
