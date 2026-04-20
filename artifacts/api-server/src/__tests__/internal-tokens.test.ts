/**
 * Unit tests for the scoped internal-token registry.
 *
 * Locks in the contract from GAP-016:
 *   - Tokens declared in INTERNAL_SERVICE_TOKENS carry only the scopes they
 *     declare (no implicit super_admin).
 *   - Path-prefix scoping is enforced at the verify step.
 *   - Bad/forged headers are rejected without leaking timing info.
 *   - Legacy ALLOY_INTERNAL_TOKEN still works but is marked legacy=true and
 *     gets the constrained default scope set (no super_admin scope).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  type InternalAgentContext,
  matchInternalToken,
  resetInternalTokenRegistry,
  tokenHasScope,
  verifyInternalHeader,
} from '../lib/internal-tokens';

function setEnv(scoped: string | undefined, legacy: string | undefined): void {
  if (scoped === undefined) delete process.env['INTERNAL_SERVICE_TOKENS'];
  else process.env['INTERNAL_SERVICE_TOKENS'] = scoped;
  if (legacy === undefined) delete process.env['ALLOY_INTERNAL_TOKEN'];
  else process.env['ALLOY_INTERNAL_TOKEN'] = legacy;
  resetInternalTokenRegistry();
}

describe('internal-tokens registry (GAP-016)', () => {
  beforeEach(() => {
    setEnv(undefined, undefined);
  });

  it('returns null when no tokens are configured', () => {
    expect(matchInternalToken('anything')).toBeNull();
  });

  it('matches a scoped token and returns its declared scopes', () => {
    setEnv(
      JSON.stringify([
        {
          name: 'alloy-runner',
          token: 'secret-aaa',
          scopes: ['alloy:write', 'agent:write'],
          pathPrefixes: ['/api/alloy/agent/'],
        },
      ]),
      undefined,
    );
    const match = matchInternalToken('secret-aaa');
    expect(match).not.toBeNull();
    expect(match!.context.name).toBe('alloy-runner');
    expect(match!.context.legacy).toBe(false);
    expect(match!.context.scopes.has('alloy:write')).toBe(true);
    expect(match!.context.scopes.has('agent:write')).toBe(true);
    // Critical: scoped tokens never auto-grant other scopes.
    expect(match!.context.scopes.has('internal:write')).toBe(false);
  });

  it('rejects unknown tokens', () => {
    setEnv(
      JSON.stringify([{ name: 'x', token: 'secret-aaa', scopes: ['alloy:write'] }]),
      undefined,
    );
    expect(matchInternalToken('not-the-secret')).toBeNull();
    expect(matchInternalToken('')).toBeNull();
    expect(matchInternalToken(undefined)).toBeNull();
  });

  it('ignores tokens with unknown scopes (allowlist)', () => {
    setEnv(
      JSON.stringify([{ name: 'x', token: 'secret-aaa', scopes: ['alloy:write', 'super_admin'] }]),
      undefined,
    );
    const match = matchInternalToken('secret-aaa');
    expect(match).not.toBeNull();
    // "super_admin" is not in the allowlist — silently dropped.
    expect(Array.from(match!.context.scopes)).toEqual(['alloy:write']);
  });

  it('verifyInternalHeader enforces pathPrefixes', () => {
    setEnv(
      JSON.stringify([
        {
          name: 'alloy-runner',
          token: 'secret-aaa',
          scopes: ['alloy:write'],
          pathPrefixes: ['/api/alloy/agent/'],
        },
      ]),
      undefined,
    );
    expect(verifyInternalHeader('secret-aaa', '/api/alloy/agent/run')).not.toBeNull();
    expect(verifyInternalHeader('secret-aaa', '/api/admin/users')).toBeNull();
  });

  it('legacy ALLOY_INTERNAL_TOKEN matches with legacy=true and constrained scopes', () => {
    setEnv(undefined, 'legacy-secret');
    const match = matchInternalToken('legacy-secret');
    expect(match).not.toBeNull();
    expect(match!.context.legacy).toBe(true);
    // Constrained default set — no super_admin-equivalent scope and no
    // `internal:write` (admin-guard requires that, so legacy can't pass it).
    expect(match!.context.scopes.has('alloy:write')).toBe(true);
    expect(match!.context.scopes.has('internal:read')).toBe(true);
    expect(match!.context.scopes.has('health:read')).toBe(true);
    expect(match!.context.scopes.has('internal:write' as never)).toBe(false);
    // Legacy token is restricted to its historical path allowlist; admin
    // routes (and other routes outside the allowlist) are explicitly denied.
    // See internal-tokens-legacy-allowlist.test.ts for the full matrix.
    expect(verifyInternalHeader('legacy-secret', '/api/internal/status')).not.toBeNull();
    expect(verifyInternalHeader('legacy-secret', '/api/admin/users')).toBeNull();
    expect(verifyInternalHeader('legacy-secret', '/health/detailed')).not.toBeNull();
  });

  it('scoped + legacy can coexist; scoped wins on its secret, legacy on its own', () => {
    setEnv(
      JSON.stringify([{ name: 'scoped', token: 'scoped-secret', scopes: ['health:read'] }]),
      'legacy-secret',
    );
    const a = matchInternalToken('scoped-secret');
    const b = matchInternalToken('legacy-secret');
    expect(a?.context.legacy).toBe(false);
    expect(b?.context.legacy).toBe(true);
    expect(a?.context.name).toBe('scoped');
    expect(b?.context.name).toBe('alloy-internal-legacy');
  });

  it('tokenHasScope returns false on undefined context (defensive)', () => {
    expect(tokenHasScope(undefined, 'internal:write')).toBe(false);
  });

  it('tokenHasScope is exact-match (no scope hierarchy)', () => {
    const ctx: InternalAgentContext = {
      name: 'x',
      scopes: new Set(['alloy:write']),
      legacy: false,
    };
    expect(tokenHasScope(ctx, 'alloy:write')).toBe(true);
    expect(tokenHasScope(ctx, 'alloy:read')).toBe(false);
    expect(tokenHasScope(ctx, 'internal:write')).toBe(false);
  });

  it('tolerates malformed INTERNAL_SERVICE_TOKENS without crashing', () => {
    setEnv('not-json{{{', undefined);
    expect(matchInternalToken('anything')).toBeNull();
    setEnv(JSON.stringify({ name: 'wrong-shape' }), undefined); // not an array
    expect(matchInternalToken('anything')).toBeNull();
  });

  it('skips entries missing required fields', () => {
    setEnv(
      JSON.stringify([
        { name: 'no-token', scopes: ['alloy:write'] },
        { token: 'no-name', scopes: ['alloy:write'] },
        { name: 'no-scopes', token: 'x' },
        { name: 'ok', token: 'good-secret', scopes: ['alloy:write'] },
      ]),
      undefined,
    );
    expect(matchInternalToken('good-secret')).not.toBeNull();
    expect(matchInternalToken('x')).toBeNull(); // no-scopes was skipped
  });
});
