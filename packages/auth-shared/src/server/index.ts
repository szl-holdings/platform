/**
 * Server-side auth primitives.
 *
 * This barrel re-exports all server-side helpers.  Import from
 * `@szl-holdings/auth-shared/server` in Express apps and API servers.
 *
 * Do NOT import this from browser bundles — it uses Node.js built-ins.
 */

export * from "./csrf.js";
export * from "./rbac.js";
export * from "./session.js";
export * from "./tenant.js";
