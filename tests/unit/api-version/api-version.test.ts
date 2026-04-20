import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

function createMockReq(headers: Record<string, string> = {}): Partial<Request> {
  return { headers, apiVersion: undefined };
}

function createMockRes(): Partial<Response> & {
  _headers: Record<string, string>;
  _status: number;
  _json: unknown;
} {
  const res: any = {
    _headers: {},
    _status: 200,
    _json: null,
    getHeader(key: string) {
      return res._headers[key];
    },
    setHeader(key: string, value: string) {
      res._headers[key] = value;
      return res;
    },
    status(code: number) {
      res._status = code;
      return res;
    },
    json(body: unknown) {
      res._json = body;
      return res;
    },
  };
  return res;
}

describe('apiVersionMiddleware', () => {
  let apiVersionMiddleware: typeof import('../../../artifacts/api-server/src/middlewares/api-version').apiVersionMiddleware;
  let requireMinVersion: typeof import('../../../artifacts/api-server/src/middlewares/api-version').requireMinVersion;
  let CURRENT_VERSION: string;
  let SUPPORTED_VERSIONS: readonly string[];

  beforeEach(async () => {
    const mod = await import('../../../artifacts/api-server/src/middlewares/api-version');
    apiVersionMiddleware = mod.apiVersionMiddleware;
    requireMinVersion = mod.requireMinVersion;
    CURRENT_VERSION = mod.CURRENT_VERSION;
    SUPPORTED_VERSIONS = mod.SUPPORTED_VERSIONS;
  });

  it('defaults to current version when no header provided', () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    apiVersionMiddleware(req as Request, res as unknown as Response, next);

    expect((req as any).apiVersion).toBe(CURRENT_VERSION);
    expect(res._headers['X-Api-Version']).toBe(CURRENT_VERSION);
    expect(next).toHaveBeenCalled();
  });

  it('accepts a valid supported version', () => {
    const req = createMockReq({ 'x-api-version': '2025-01-01' });
    const res = createMockRes();
    const next = vi.fn();

    apiVersionMiddleware(req as Request, res as unknown as Response, next);

    expect((req as any).apiVersion).toBe('2025-01-01');
    expect(res._headers['X-Api-Version']).toBe('2025-01-01');
    expect(next).toHaveBeenCalled();
  });

  it('rejects unsupported version with 400', () => {
    const req = createMockReq({ 'x-api-version': '9999-01-01' });
    const res = createMockRes();
    const next = vi.fn();

    apiVersionMiddleware(req as Request, res as unknown as Response, next);

    expect(res._status).toBe(400);
    expect((res._json as any).error).toContain('is not supported');
    expect(next).not.toHaveBeenCalled();
  });

  it('sets deprecation headers for deprecated version', () => {
    const req = createMockReq({ 'x-api-version': '2025-01-01' });
    const res = createMockRes();
    const next = vi.fn();

    apiVersionMiddleware(req as Request, res as unknown as Response, next);

    expect(res._headers['Deprecation']).toBe('true');
    expect(res._headers['X-Api-Deprecated']).toBe('true');
    expect(res._headers['Sunset']).toBeTruthy();
    expect(res._headers['X-Api-Deprecation-Notice']).toContain('deprecated');
    expect(next).toHaveBeenCalled();
  });

  it('does not set deprecation headers for current version', () => {
    const req = createMockReq({ 'x-api-version': CURRENT_VERSION });
    const res = createMockRes();
    const next = vi.fn();

    apiVersionMiddleware(req as Request, res as unknown as Response, next);

    expect(res._headers['Deprecation']).toBeUndefined();
    expect(res._headers['X-Api-Deprecated']).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('includes supported versions in response header', () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = vi.fn();

    apiVersionMiddleware(req as Request, res as unknown as Response, next);

    expect(res._headers['X-Api-Versions-Supported']).toBe(SUPPORTED_VERSIONS.join(', '));
  });
});

describe('requireMinVersion', () => {
  let requireMinVersion: typeof import('../../../artifacts/api-server/src/middlewares/api-version').requireMinVersion;
  let CURRENT_VERSION: string;

  beforeEach(async () => {
    const mod = await import('../../../artifacts/api-server/src/middlewares/api-version');
    requireMinVersion = mod.requireMinVersion;
    CURRENT_VERSION = mod.CURRENT_VERSION;
  });

  it('allows request when version meets minimum', () => {
    const req = createMockReq();
    (req as any).apiVersion = CURRENT_VERSION;
    const res = createMockRes();
    const next = vi.fn();

    requireMinVersion('2026-04-15')(req as Request, res as unknown as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it('rejects request when version is below minimum', () => {
    const req = createMockReq();
    (req as any).apiVersion = '2025-01-01';
    const res = createMockRes();
    const next = vi.fn();

    requireMinVersion('2026-04-15')(req as Request, res as unknown as Response, next);
    expect(res._status).toBe(400);
    expect((res._json as any).error).toContain('requires API version');
    expect(next).not.toHaveBeenCalled();
  });
});
