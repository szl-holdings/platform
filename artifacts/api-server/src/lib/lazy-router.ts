import { Router, type RequestHandler, type IRouter } from "express";
import { logger } from "./logger";

type RouterModule = { default: RequestHandler | Router } | RequestHandler | Router;
type Loader = () => Promise<RouterModule>;

/**
 * Defer loading a route module (and its top-level code) until the FIRST
 * request actually reaches the mount point. Returns an Express handler that
 * is registered eagerly at startup but only triggers `loader()` (and therefore
 * the module's top-level evaluation) on first invocation.
 *
 * Why: the API server statically imports ~120 route modules at boot, which
 * causes V8 heap usage to sit at 90+% before any traffic. Lazy mounting moves
 * that work to first-hit, drastically reducing startup heap and steady-state
 * footprint for routes that are never called in a given run.
 *
 * Concurrent requests during the initial load share a single in-flight
 * promise so the module is initialised exactly once.
 *
 * IMPORTANT: when registered with `router.use(lazyMount(...))` at the root of
 * a router, the handler runs on EVERY request that flows through that router
 * — which means the first arbitrary request will trigger the import,
 * defeating the point. Use `lazyMatch(prefixes, loader, label)` to only
 * trigger the import when the request path actually targets a route this
 * module owns. `lazyMount` should only be used when the parent caller
 * already gates the path (e.g. `router.use("/foo", lazyMount(...))`, where
 * Express itself only invokes the handler when `/foo` matches).
 */
export function lazyMount(loader: Loader, label?: string): RequestHandler {
  let cached: RequestHandler | Router | null = null;
  let pending: Promise<RequestHandler | Router> | null = null;

  return function lazyMountHandler(req, res, next) {
    if (cached) {
      return (cached as RequestHandler)(req, res, next);
    }
    if (!pending) {
      pending = loader()
        .then((mod) => {
          const resolved =
            (mod && typeof mod === "object" && "default" in (mod as Record<string, unknown>))
              ? ((mod as { default: RequestHandler | Router }).default)
              : (mod as RequestHandler | Router);
          if (typeof resolved !== "function") {
            throw new Error(
              `[lazy-mount] Loader for ${label ?? "<unknown>"} did not resolve to an Express handler`
            );
          }
          cached = resolved;
          return resolved;
        })
        .catch((err) => {
          // Reset so a later request can retry rather than permanently failing.
          pending = null;
          throw err;
        });
    }

    pending
      .then((handler) => (handler as RequestHandler)(req, res, next))
      .catch((err) => {
        logger.error({ err, label }, "[lazy-mount] Failed to load lazy route module");
        next(err);
      });
  };
}

/**
 * Defer loading a `register(router)`-style namespace import (e.g. groups that
 * mount many sub-routes onto a parent router) until first request. The
 * registered routes are attached to a private sub-router so the parent's
 * middleware order is preserved.
 */
export function lazyRegister(
  loader: () => Promise<{ register: (r: IRouter) => void }>,
  label?: string,
): RequestHandler {
  let cachedSub: IRouter | null = null;
  let pending: Promise<IRouter> | null = null;

  return function lazyRegisterHandler(req, res, next) {
    if (cachedSub) {
      return (cachedSub as unknown as RequestHandler)(req, res, next);
    }
    if (!pending) {
      pending = loader()
        .then((mod) => {
          if (!mod || typeof mod.register !== "function") {
            throw new Error(
              `[lazy-register] Loader for ${label ?? "<unknown>"} did not export a register() function`
            );
          }
          const sub = Router();
          mod.register(sub);
          cachedSub = sub;
          return sub;
        })
        .catch((err) => {
          pending = null;
          throw err;
        });
    }

    pending
      .then((sub) => (sub as unknown as RequestHandler)(req, res, next))
      .catch((err) => {
        logger.error({ err, label }, "[lazy-register] Failed to load lazy route group");
        next(err);
      });
  };
}

function pathMatchesPrefix(reqPath: string, prefix: string): boolean {
  if (prefix === "/" || prefix === "") return true;
  if (reqPath === prefix) return true;
  return reqPath.startsWith(prefix + "/");
}

/**
 * Path-gated wrapper around `lazyMount`. Only triggers the module load when
 * the incoming request path actually targets one of the prefixes the module
 * owns. Use this when registering a lazy module on a parent router via
 * `router.use(lazyMatch([...], loader))` — without a prefix gate the handler
 * would run (and trigger the import) on every request, defeating the lazy
 * loading.
 *
 * The prefix is NOT stripped from `req.url`, so the inner module continues
 * to see its full original path (matching what eager `router.use(<router>)`
 * would deliver).
 */
export function lazyMatch(
  prefixes: string | string[],
  loader: Loader,
  label?: string,
): RequestHandler {
  const list = Array.isArray(prefixes) ? prefixes : [prefixes];
  const inner = lazyMount(loader, label);
  return function lazyMatchHandler(req, res, next) {
    for (const p of list) {
      if (pathMatchesPrefix(req.path, p)) {
        return inner(req, res, next);
      }
    }
    return next();
  };
}

/**
 * Path-gated wrapper around `lazyRegister`. See `lazyMatch` for the
 * rationale: without a prefix gate, a root `router.use(lazyRegister(...))`
 * would execute on every request and force-load the namespace module on
 * the first arbitrary hit.
 */
export function lazyRegisterMatch(
  prefixes: string | string[],
  loader: () => Promise<{ register: (r: IRouter) => void }>,
  label?: string,
): RequestHandler {
  const list = Array.isArray(prefixes) ? prefixes : [prefixes];
  const inner = lazyRegister(loader, label);
  return function lazyRegisterMatchHandler(req, res, next) {
    for (const p of list) {
      if (pathMatchesPrefix(req.path, p)) {
        return inner(req, res, next);
      }
    }
    return next();
  };
}
