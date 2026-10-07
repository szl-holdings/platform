/**
 * Substrate MCP Gateway — Per-Request Context Store
 *
 * Uses AsyncLocalStorage to propagate the authenticated actor/tenant identity
 * from the HTTP transport layer through to tool and resource handlers, without
 * threading extra parameters through every call site.
 *
 * Wire-up:
 *   transport/http.ts extracts auth context from each incoming request and
 *   runs the MCP SDK handler inside `requestContextStore.run(ctx, callback)`.
 *
 * Consumption:
 *   handlers.ts and nexus-fabric.ts call `getCurrentActorId()` /
 *   `getCurrentTenantId()` to obtain the per-request identity. If no context
 *   is stored (e.g. in stdio transport or unit tests) the functions return
 *   safe defaults.
 */

import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestContext {
  actorId: string;
  tenantId: string;
}

export const requestContextStore = new AsyncLocalStorage<RequestContext>();

/**
 * Run `fn` inside a context that identifies the current request actor.
 * Call this at the outermost HTTP handler, before delegating to the MCP SDK.
 */
export function runWithRequestContext<T>(ctx: RequestContext, fn: () => T): T {
  return requestContextStore.run(ctx, fn) as T;
}

/**
 * Return the actorId for the current HTTP request, or a safe default.
 * Safe to call outside of a stored context (e.g. stdio transport).
 */
export function getCurrentActorId(): string {
  return requestContextStore.getStore()?.actorId ?? 'anonymous';
}

/**
 * Return the tenantId for the current HTTP request, or undefined.
 * `undefined` means "no tenant restriction" — open access to all signal
 * domains. Callers that require restriction should treat undefined as
 * 'substrate-gateway' (a whitelisted super-tenant with all-domain access).
 */
export function getCurrentTenantId(): string | undefined {
  return requestContextStore.getStore()?.tenantId;
}

/**
 * Derive a tenant identifier from an actorId string.
 *
 * Strategy:
 *  - API-key and explicit development-bypass calls use the configured gateway
 *    tenant when the authentication layer provides one. This function retains
 *    `substrate-gateway` only as a non-production compatibility fallback.
 *  - Agent delegation calls use the agent name as actor, which will match
 *    their dedicated TENANT_DOMAIN_WHITELIST entry (e.g. 'helmsman',
 *    'sentinel', 'terra', 'lexis', 'beacon').
 *  - Unknown actorIds are passed through as-is; resolveAuthorizedDomains()
 *    will deny them by default.
 */
export function actorIdToTenantId(actorId: string): string {
  if (
    actorId.startsWith('api-key:') ||
    actorId.startsWith('gateway:') ||
    actorId.startsWith('gateway-dev:') ||
    actorId === 'anonymous:dev'
  ) {
    return 'substrate-gateway';
  }
  if (actorId === 'anonymous') return 'anonymous';
  // Agent names and other identities are used directly for whitelist lookup
  return actorId;
}
