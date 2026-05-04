/**
 * Passport Resolver — Quant-Aware Model Router Integration
 *
 * Bridges the ai-engine model router with the Model Passport registry.
 * The resolver is installed at API-server boot via registerPassportResolver().
 * When no resolver is installed (e.g. unit tests), routing falls back to
 * the existing static lane→model map transparently.
 */

import type { RouteClass } from './providers/hf-router.js';

export interface PassportResolverInput {
  lane: RouteClass;
  budgetUsdPerCall?: number;
  slaP95Ms?: number;
  tenantId?: number | string;
  requiredCapabilities?: string[];
  /** When set, resolve a specific passport by ID rather than scoring all active passports. Used for downgrade-ladder traversal. */
  passportId?: string;
}

export interface PassportResolverOutput {
  passportId: string;
  signatureDigest: string;
  model: string;
  provider: string;
  /** Quantization tier declared in the passport (e.g. 'hosted', 'int8', 'gguf-q4'). */
  quantTier: string;
  /** Autonomy tier from the passport's policy envelope (e.g. 'advisory', 'supervised'). */
  autonomyTier: string;
  downgradeLadder: Array<{ passportId: string; displayName: string; reason: string }>;
}

export type PassportResolverFn = (
  input: PassportResolverInput,
) => Promise<PassportResolverOutput | null>;

let _passportResolver: PassportResolverFn | null = null;

export function registerPassportResolver(fn: PassportResolverFn | null): void {
  _passportResolver = fn;
}

export function getPassportResolver(): PassportResolverFn | null {
  return _passportResolver;
}

export async function resolveViaPassport(
  input: PassportResolverInput,
): Promise<PassportResolverOutput | null> {
  const fn = _passportResolver;
  if (!fn) return null;
  try {
    return await fn(input);
  } catch {
    return null;
  }
}

