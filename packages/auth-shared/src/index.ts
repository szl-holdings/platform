/**
 * @szl-holdings/auth-shared
 *
 * Unified auth primitives for the SZL Holdings platform.
 *
 * This is the canonical package for all auth-related types, guards,
 * CSRF helpers, RBAC utilities, and tenant-scoping contracts.
 *
 * Sub-path imports:
 *   @szl-holdings/auth-shared          — shared types + pure role helpers
 *   @szl-holdings/auth-shared/server   — server-side (Node.js / Express)
 *   @szl-holdings/auth-shared/client   — client-side (browser / React)
 *   @szl-holdings/auth-shared/mobile   — mobile adapter (Expo / React Native)
 */

export * from "./types.js";
