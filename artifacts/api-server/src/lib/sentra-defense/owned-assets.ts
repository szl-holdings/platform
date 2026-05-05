/**
 * Owned Asset Registry
 *
 * Defines the set of assets that Sentra is permitted to act against.
 * The Scope Boundary Enforcer uses this registry to validate every
 * active-response and counter-move action before execution.
 *
 * Asset taxonomy:
 *  - ip_range            : Infrastructure we directly operate (loopback, server itself).
 *  - incoming_connection : Source IP ranges of inbound HTTP connections to our API.
 *                          These are NOT IPs we claim to own — they are the IP ranges
 *                          from which clients reach us. Permitted actions are strictly
 *                          access-control only (block/tarpit/rate-limit their access
 *                          to OUR API). RFC 1918 private ranges are included because
 *                          internal tooling and Replit platform infra originates there;
 *                          public IPs are NOT in scope — we have no right to interfere
 *                          with public infrastructure we do not control.
 *  - domain              : Hostnames we own and serve responses from.
 *  - session_namespace   : Session token namespaces we manage.
 *  - db_table            : Tables we own (honey rows, canaries).
 *  - honey_endpoint      : Trap paths on our server.
 *  - api_path_prefix     : API path prefixes under our control.
 *
 * INVARIANT: Actions may ONLY target assets listed here. No external public IPs,
 * domains, or databases may ever be targeted.
 */

export type OwnedAssetType =
  | 'ip_range'
  | 'incoming_connection'
  | 'domain'
  | 'db_table'
  | 'session_namespace'
  | 'honey_endpoint'
  | 'api_path_prefix';

export interface OwnedAsset {
  id: string;
  type: OwnedAssetType;
  value: string;
  description: string;
  allowedActions: string[];
}

const OWNED_ASSETS: OwnedAsset[] = [
  // ── Infrastructure IPs we directly operate ────────────────────────────────
  {
    id: 'loopback-ipv4',
    type: 'ip_range',
    value: '127.0.0.0/8',
    description: 'Loopback — server-internal only',
    allowedActions: ['BlockIp', 'TarpitClient', 'EscalateRateLimit'],
  },

  // ── Incoming connection source IP ranges ──────────────────────────────────
  // These are RFC 1918 private ranges that internal platform traffic and
  // Replit infrastructure uses to reach our API. We are NOT claiming ownership
  // of these ranges — we are declaring that traffic originating from them may
  // be subject to access-control actions (block, tarpit, rate-limit) when
  // behaving adversarially. Public IPs are deliberately excluded: we have no
  // right to interfere with public internet infrastructure we do not control.
  {
    id: 'incoming-rfc1918-10',
    type: 'incoming_connection',
    value: '10.0.0.0/8',
    description: 'RFC 1918 private range — access-control source scope only, not ownership claim',
    allowedActions: ['BlockIp', 'TarpitClient', 'EscalateRateLimit'],
  },
  {
    id: 'incoming-rfc1918-172',
    type: 'incoming_connection',
    value: '172.16.0.0/12',
    description: 'RFC 1918 private range — access-control source scope only, not ownership claim',
    allowedActions: ['BlockIp', 'TarpitClient', 'EscalateRateLimit'],
  },
  {
    id: 'incoming-rfc1918-192',
    type: 'incoming_connection',
    value: '192.168.0.0/16',
    description: 'RFC 1918 private range — access-control source scope only, not ownership claim',
    allowedActions: ['BlockIp', 'TarpitClient', 'EscalateRateLimit'],
  },

  // ── Domains we own and serve ──────────────────────────────────────────────
  {
    id: 'replit-dev',
    type: 'domain',
    value: '.replit.dev',
    description: 'Replit development domain — owned by our Replit team account',
    allowedActions: ['BlockIp', 'TarpitClient', 'EscalateRateLimit', 'PoisonedResponse'],
  },
  {
    id: 'replit-app',
    type: 'domain',
    value: '.replit.app',
    description: 'Replit production domain — owned by our Replit team account',
    allowedActions: ['BlockIp', 'TarpitClient', 'EscalateRateLimit', 'PoisonedResponse'],
  },

  // ── Sessions we manage ────────────────────────────────────────────────────
  {
    id: 'platform-sessions',
    type: 'session_namespace',
    value: 'session:*',
    description: 'Session tokens issued and managed by our auth layer',
    allowedActions: ['RevokeSession', 'RotateTokenScope'],
  },

  // ── DB tables / rows we own ───────────────────────────────────────────────
  {
    id: 'db-table-sentra-canaries',
    type: 'db_table',
    value: 'sentra_canaries',
    description: 'Honey rows in our canary table — PoisonedResponse is in-table bait data only',
    allowedActions: ['PoisonedResponse'],
  },

  // ── Honey endpoints and API paths we operate ─────────────────────────────
  {
    id: 'api-honey-prefix',
    type: 'honey_endpoint',
    value: '/api/honey/',
    description: 'Trap paths — any request here is by definition a hostile probe',
    allowedActions: ['TarpitClient', 'PoisonedResponse', 'BlockIp'],
  },
  {
    id: 'api-sentra-prefix',
    type: 'api_path_prefix',
    value: '/api/sentra/',
    description: 'Sentra API namespace — deceptive responses and rate-limiting',
    allowedActions: ['EscalateRateLimit', 'TarpitClient', 'PoisonedResponse'],
  },
  {
    id: 'api-root-prefix',
    type: 'api_path_prefix',
    value: '/api/',
    description: 'All API paths we serve — rate-limit, tarpit, deceptive response',
    allowedActions: ['EscalateRateLimit', 'TarpitClient', 'PoisonedResponse', 'BlockIp'],
  },
];

// ── IP range matching ────────────────────────────────────────────────────────

function ipToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] ?? 0) << 24) | ((parts[1] ?? 0) << 16) | ((parts[2] ?? 0) << 8) | (parts[3] ?? 0);
}

function isIpInCidr(ip: string, cidr: string): boolean {
  try {
    const [network, prefixStr] = cidr.split('/');
    if (!network || !prefixStr) return false;
    const prefix = parseInt(prefixStr, 10);
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    const networkInt = ipToInt(network) & mask;
    const ipInt = ipToInt(ip) & mask;
    return networkInt === ipInt;
  } catch {
    return false;
  }
}

// ── Registry API ─────────────────────────────────────────────────────────────

export interface AssetLookupResult {
  found: boolean;
  asset?: OwnedAsset;
  actionAllowed: boolean;
}

export function lookupAsset(targetType: string, targetValue: string, action: string): AssetLookupResult {
  for (const asset of OWNED_ASSETS) {
    if (asset.type !== targetType && !isCompatibleType(asset.type, targetType)) continue;

    let matches = false;
    if (asset.type === 'ip_range' || asset.type === 'incoming_connection') {
      // Both types use CIDR matching — difference is semantic (ownership vs connection scope)
      matches = isIpInCidr(targetValue, asset.value);
    } else if (asset.type === 'domain') {
      matches = targetValue === asset.value || targetValue.endsWith(asset.value);
    } else if (asset.type === 'session_namespace') {
      matches = targetValue.startsWith('session:') || asset.value === 'session:*';
    } else if (asset.type === 'db_table') {
      matches = targetValue === asset.value;
    } else if (asset.type === 'honey_endpoint') {
      matches = targetValue.startsWith(asset.value);
    } else if (asset.type === 'api_path_prefix') {
      matches = targetValue.startsWith(asset.value);
    }

    if (matches) {
      const actionAllowed = asset.allowedActions.includes(action) || asset.allowedActions.includes('*');
      return { found: true, asset, actionAllowed };
    }
  }

  if (_isLocalhost(targetValue)) {
    return {
      found: true,
      asset: OWNED_ASSETS.find(a => a.id === 'loopback-ipv4'),
      actionAllowed: true,
    };
  }

  return { found: false, actionAllowed: false };
}

function isCompatibleType(assetType: OwnedAssetType, targetType: string): boolean {
  // Both ip_range (direct ownership) and incoming_connection (connection source scope)
  // are matched against 'ip' target type — actions differ but CIDR logic is the same
  if (assetType === 'ip_range' && targetType === 'ip') return true;
  if (assetType === 'incoming_connection' && targetType === 'ip') return true;
  if (assetType === 'api_path_prefix' && targetType === 'api_path') return true;
  if (assetType === 'honey_endpoint' && targetType === 'api_path') return true;
  return false;
}

function _isLocalhost(value: string): boolean {
  return value === '127.0.0.1' || value === '::1' || value === 'localhost';
}

export function listOwnedAssets(): OwnedAsset[] {
  return [...OWNED_ASSETS];
}

/**
 * Returns true if the IP falls within an asset in scope for access-control actions.
 * Note: RFC 1918 ranges are in scope as incoming_connection sources (not ownership claims).
 * Public IPs (e.g. 8.8.8.8) return false — they are never in scope.
 */
export function isIpOwned(ip: string): boolean {
  return OWNED_ASSETS
    .filter(a => a.type === 'ip_range' || a.type === 'incoming_connection')
    .some(a => isIpInCidr(ip, a.value)) || _isLocalhost(ip);
}
