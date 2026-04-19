/**
 * Regression test for GAP-016 reviewer fix:
 *
 * When a router is mounted under a prefix (e.g. `app.use("/api", router)`),
 * inside that router `req.path` strips the mount and only contains the
 * router-relative path (e.g. `/internal/foo`). Path-prefix scoping must run
 * against the externally visible URL so that scoped tokens whose pathPrefixes
 * contain the mount (`/api/internal/`) still match.
 *
 * This test exercises that contract via `req.originalUrl`.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import express from "express";
import request from "supertest";
import {
  verifyInternalHeader,
  resetInternalTokenRegistry,
} from "../lib/internal-tokens";

const SCOPED = JSON.stringify([
  {
    name: "internal-runner",
    token: "scoped-secret-xyz",
    scopes: ["internal:write"],
    pathPrefixes: ["/api/internal/"],
  },
]);

describe("verifyInternalHeader under a mounted router (GAP-016 reviewer fix)", () => {
  let prevScoped: string | undefined;

  beforeEach(() => {
    prevScoped = process.env["INTERNAL_SERVICE_TOKENS"];
    process.env["INTERNAL_SERVICE_TOKENS"] = SCOPED;
    resetInternalTokenRegistry();
  });

  afterEach(() => {
    if (prevScoped === undefined) delete process.env["INTERNAL_SERVICE_TOKENS"];
    else process.env["INTERNAL_SERVICE_TOKENS"] = prevScoped;
    resetInternalTokenRegistry();
  });

  it("accepts a path-scoped token when the prefix matches the externally-visible URL via req.originalUrl", async () => {
    const app = express();
    const router = express.Router();
    router.get("/foo", (req, res) => {
      // Inside a mounted router, req.path = "/foo", but originalUrl = "/api/internal/foo".
      const matchByPath = verifyInternalHeader(
        req.headers["x-internal-token"] as string | undefined,
        req.path,
      );
      const matchByOriginal = verifyInternalHeader(
        req.headers["x-internal-token"] as string | undefined,
        req.originalUrl || req.url,
      );
      res.json({
        viaPath: matchByPath !== null,
        viaOriginalUrl: matchByOriginal !== null,
      });
    });
    app.use("/api/internal", router);

    const resp = await request(app)
      .get("/api/internal/foo")
      .set("x-internal-token", "scoped-secret-xyz");

    expect(resp.status).toBe(200);
    // Demonstrates the bug we fixed: req.path strips the mount → false.
    expect(resp.body.viaPath).toBe(false);
    // The fix uses originalUrl → matches and authenticates.
    expect(resp.body.viaOriginalUrl).toBe(true);
  });

  it("still rejects a scoped token when the externally-visible URL is outside its pathPrefixes", async () => {
    const app = express();
    const router = express.Router();
    router.get("/bar", (req, res) => {
      const match = verifyInternalHeader(
        req.headers["x-internal-token"] as string | undefined,
        req.originalUrl || req.url,
      );
      res.json({ matched: match !== null });
    });
    app.use("/api/public", router);

    const resp = await request(app)
      .get("/api/public/bar")
      .set("x-internal-token", "scoped-secret-xyz");

    expect(resp.status).toBe(200);
    expect(resp.body.matched).toBe(false);
  });
});
