/**
 * Backward-compatible re-export shim.
 *
 * All proxy logic and route constants have been moved to the dedicated
 * @szl-holdings/shared-proxy workspace package (packages/shared-proxy/).
 *
 * Artifact vite.config.ts files continue to import from this file via
 * relative path (../../packages/proxy-routes.js) and work without changes.
 * New code should import directly from @szl-holdings/shared-proxy.
 */
export * from './shared-proxy/src/index.js';
