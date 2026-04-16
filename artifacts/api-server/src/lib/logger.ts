import pino from "pino";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const isProduction = process.env.NODE_ENV === "production";

const SERVICE_NAME = process.env.OTEL_SERVICE_NAME ?? "szl-api-server";
const SERVICE_ENV = process.env.NODE_ENV ?? "development";

let SERVICE_VERSION = "0.0.0";
try {
  const require = createRequire(import.meta.url);
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const pkg = require(join(__dirname, "../../package.json"));
  SERVICE_VERSION = pkg.version ?? "0.0.0";
} catch {
  // version remains default
}

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: {
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    env: SERVICE_ENV,
  },
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});
