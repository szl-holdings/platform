import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp } from "../utils/test-app";
import healthRouter from "../../artifacts/api-server/src/routes/health";

describe("GET /healthz", () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    app = createTestApp();
    app.use(healthRouter);
  });

  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/healthz");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok" });
  });

  it("responds with JSON content type", async () => {
    const res = await request(app).get("/healthz");
    expect(res.headers["content-type"]).toMatch(/application\/json/);
  });
});
