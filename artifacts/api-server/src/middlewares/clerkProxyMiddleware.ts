/**
 * Clerk Frontend API Proxy Middleware
 *
 * Proxies Clerk Frontend API requests through your domain, enabling Clerk
 * authentication on custom domains and .replit.app deployments without
 * requiring CNAME DNS configuration.
 *
 * AUTH CONFIGURATION: To manage users, enable/disable login providers
 * (Google, GitHub, etc.), change app branding, or configure OAuth credentials,
 * use the Auth pane in the workspace toolbar. There is no external Clerk
 * dashboard — all auth configuration is done through the Auth pane.
 *
 * IMPORTANT:
 * - Only active in production (Clerk proxying doesn't work for dev instances)
 * - Must be mounted BEFORE express.json() middleware
 *
 * Usage in app.ts:
 *   import { CLERK_PROXY_PATH, clerkProxyMiddleware } from "./middlewares/clerkProxyMiddleware";
 *   app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
 */

import type { RequestHandler } from "express";

const CLERK_FAPI = "https://frontend-api.clerk.dev";
export const CLERK_PROXY_PATH = "/api/__clerk";

let _createProxyMiddleware: ((opts: Record<string, unknown>) => RequestHandler) | null = null;

async function getProxyMiddleware(): Promise<((opts: Record<string, unknown>) => RequestHandler) | null> {
  if (_createProxyMiddleware) return _createProxyMiddleware;
  try {
    const mod = await import("http-proxy-middleware");
    _createProxyMiddleware = mod.createProxyMiddleware as unknown as (opts: Record<string, unknown>) => RequestHandler;
    return _createProxyMiddleware;
  } catch (err) {
    // http-proxy-middleware is not installed; Clerk FAPI proxy will be unavailable.
    // Install http-proxy-middleware to enable Clerk domain proxying in production.
    console.warn("[clerkProxy] http-proxy-middleware unavailable, Clerk FAPI proxy disabled:", (err as Error).message);
    return null;
  }
}

export function clerkProxyMiddleware(): RequestHandler {
  if (process.env.NODE_ENV !== "production") {
    return (_req, _res, next) => next();
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return (_req, _res, next) => next();
  }

  // Return an async-initialized middleware that lazily loads http-proxy-middleware
  const handler: RequestHandler = async (req, res, next) => {
    const createProxy = await getProxyMiddleware();
    if (!createProxy) {
      next();
      return;
    }
    const proxy = createProxy({
      target: CLERK_FAPI,
      changeOrigin: true,
      pathRewrite: (path: string) =>
        path.replace(new RegExp(`^${CLERK_PROXY_PATH}`), ""),
      on: {
        proxyReq: (proxyReq: import("http").ClientRequest, req: import("express").Request) => {
          const protocol = req.headers["x-forwarded-proto"] || "https";
          const host = req.headers.host || "";
          const proxyUrl = `${protocol}://${host}${CLERK_PROXY_PATH}`;
          proxyReq.setHeader("Clerk-Proxy-Url", proxyUrl);
          proxyReq.setHeader("Clerk-Secret-Key", secretKey);

          const xff = req.headers["x-forwarded-for"];
          const clientIp =
            (Array.isArray(xff) ? xff[0] : xff)?.split(",")[0]?.trim() ||
            req.socket?.remoteAddress ||
            "";
          if (clientIp) {
            proxyReq.setHeader("X-Forwarded-For", clientIp);
          }
        },
      },
    });
    proxy(req, res, next);
  };

  return handler;
}
