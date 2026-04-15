import type { Request, Response, NextFunction } from "express";
import { createHash } from "crypto";
import { logger } from "../lib/logger";

export function computeETag(body: unknown): string {
  try {
    const content = typeof body === "string" ? body : JSON.stringify(body);
    const hash = createHash("sha256").update(content).digest("base64url");
    return `"${hash}"`;
  } catch {
    return `"${Date.now().toString(36)}"`;
  }
}

export function etagMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.method !== "GET") {
    next();
    return;
  }

  const originalJson = res.json.bind(res);
  res.json = (body: unknown): Response => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const etag = computeETag(body);
      res.setHeader("ETag", etag);
      res.setHeader("Cache-Control", "no-cache");

      const ifNoneMatch = req.headers["if-none-match"];
      if (ifNoneMatch && ifNoneMatch === etag) {
        res.status(304).end();
        return res;
      }
    }
    return originalJson(body);
  };

  next();
}

export async function validateIfMatch(
  req: Request,
  res: Response,
  fetchCurrent: () => Promise<unknown>
): Promise<boolean> {
  const ifMatch = req.headers["if-match"] as string | undefined;
  if (!ifMatch) return true;

  try {
    const current = await fetchCurrent();
    if (current === undefined || current === null) return true;

    const serverETag = computeETag(current);

    if (serverETag !== ifMatch) {
      logger.debug(
        { path: req.path, ifMatch, serverETag },
        "ETag conflict — stale write detected"
      );
      res.status(409).json({
        error: "Conflict",
        message: "The resource was modified since you last fetched it. Fetch the latest version and retry.",
        code: "OPTIMISTIC_CONCURRENCY_CONFLICT",
        statusCode: 409,
        serverVersion: current,
        clientVersion: req.body,
        serverETag,
        clientETag: ifMatch,
      });
      return false;
    }
  } catch (err) {
    logger.error({ err, path: req.path }, "validateIfMatch fetch failed — allowing write");
  }

  return true;
}
