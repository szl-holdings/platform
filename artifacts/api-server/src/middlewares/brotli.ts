/**
 * Brotli Compression Middleware
 *
 * Augments the existing gzip compression with Brotli support.
 * Brotli (RFC 7932) typically achieves 15-25% better compression than gzip
 * at equivalent CPU cost. Modern browsers all support it over HTTPS.
 *
 * Strategy:
 *  - Clients that send `Accept-Encoding: br` (or `br, gzip`) receive Brotli
 *  - Clients without `br` fall through to the existing gzip `compression` middleware
 *  - SSE connections and already-compressed content are excluded
 */

import zlib from 'node:zlib';
import type { NextFunction, Request, Response } from 'express';

const BROTLI_THRESHOLD = 1024; // bytes — skip tiny responses

const BROTLI_PARAMS = {
  [zlib.constants.BROTLI_PARAM_QUALITY]: 4, // quality 4 = fast, good compression
  [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
};

const COMPRESSIBLE_MIME_RE =
  /^(text\/(html|plain|css|javascript|xml|csv)|application\/(json|javascript|xml|graphql|x-www-form-urlencoded))/;

function clientAcceptsBrotli(req: Request): boolean {
  const accept = req.headers['accept-encoding'] ?? '';
  return accept.includes('br');
}

function isCompressibleContentType(contentType: string | undefined): boolean {
  if (!contentType) return false;
  return COMPRESSIBLE_MIME_RE.test(contentType.split(';')[0].trim().toLowerCase());
}

function isSseConnection(req: Request, res: Response): boolean {
  return (
    req.headers.accept?.includes('text/event-stream') === true ||
    res.getHeader('content-type')?.toString().includes('text/event-stream') === true
  );
}

/**
 * Brotli middleware — intercepts res.json() and res.send() to compress
 * eligible responses. Runs before gzip so clients that prefer Brotli
 * get Brotli; the Express `compression` middleware handles gzip fallback.
 */
export function brotliMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!clientAcceptsBrotli(req)) {
    next();
    return;
  }

  if (req.method === 'HEAD') {
    next();
    return;
  }

  const originalSend = res.send.bind(res);
  const originalJson = res.json.bind(res);

  function maybeBrotli(body: string | Buffer): string | Buffer | null {
    if (isSseConnection(req, res)) return null;
    const ct = res.getHeader('content-type')?.toString();
    if (!isCompressibleContentType(ct)) return null;

    const buf = Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf-8');
    if (buf.length < BROTLI_THRESHOLD) return null;
    if (res.getHeader('content-encoding')) return null; // already encoded

    try {
      return zlib.brotliCompressSync(buf, { params: BROTLI_PARAMS });
    } catch {
      return null;
    }
  }

  // Override res.json to compress JSON payloads
  res.json = function brotliJson(body: unknown) {
    const json = JSON.stringify(body);
    const compressed = maybeBrotli(json);
    if (compressed) {
      res.setHeader('Content-Encoding', 'br');
      res.setHeader('Content-Length', compressed.length);
      res.removeHeader('Transfer-Encoding');
      originalSend(compressed);
      return res;
    }
    return originalJson(body);
  };

  // Override res.send for non-JSON text responses
  res.send = function brotliSend(body: unknown) {
    if (typeof body === 'string' || Buffer.isBuffer(body)) {
      const compressed = maybeBrotli(body as string | Buffer);
      if (compressed) {
        res.setHeader('Content-Encoding', 'br');
        res.setHeader('Content-Length', compressed.length);
        res.removeHeader('Transfer-Encoding');
        return originalSend(compressed);
      }
    }
    return originalSend(body);
  };

  // Vary header — tells caches that the response differs by Accept-Encoding
  res.setHeader('Vary', 'Accept-Encoding');

  next();
}
