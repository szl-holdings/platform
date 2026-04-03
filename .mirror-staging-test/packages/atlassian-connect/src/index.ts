/**
 * SZL Platform Connector — Atlassian Connect App Server
 *
 * Serves the atlassian-connect.json descriptor, lifecycle hooks,
 * webhook endpoints, and iframe UI pages for the Jira Cloud app.
 *
 * The existing JiraAdapter (lib/services/src/adapters/jira.ts) handles
 * all Jira API calls — this server only deals with the Atlassian Connect
 * protocol layer (JWT verification, tenant registration, webhook delivery).
 */

import express, { type Application } from "express";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import lifecycleRouter from "./routes/lifecycle.js";
import webhooksRouter from "./routes/webhooks.js";
import pagesRouter from "./routes/pages.js";
import { logger } from "./lib/logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env["PORT"] ?? "3400", 10);

const app: Application = express();
app.use(express.json());

app.get("/atlassian-connect.json", (_req, res) => {
  try {
    const descriptorPath = join(__dirname, "../../atlassian-connect.json");
    const descriptor = JSON.parse(readFileSync(descriptorPath, "utf-8")) as Record<string, unknown>;

    const baseUrl = process.env["CONNECT_BASE_URL"] ?? descriptor["baseUrl"];
    res.json({ ...descriptor, baseUrl });
  } catch {
    res.status(500).json({ error: "Failed to load descriptor" });
  }
});

const SZL_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="6" fill="#0052CC"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
    font-family="sans-serif" font-weight="700" font-size="14" fill="#fff">S</text>
</svg>`;

app.get("/static/icon-16.png", (_req, res) => {
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(SZL_ICON_SVG);
});

app.get("/static/icon-32.png", (_req, res) => {
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(SZL_ICON_SVG);
});

app.use(lifecycleRouter);
app.use(webhooksRouter);
app.use(pagesRouter);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "szl-atlassian-connect", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  logger.info({ port: PORT }, "SZL Atlassian Connect server listening");
});

export default app;
