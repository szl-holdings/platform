import pino from "pino";

export const logger = pino({
  name: "szl-atlassian-connect",
  level: process.env["LOG_LEVEL"] ?? "info",
});
