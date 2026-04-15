import pino from "pino";

export const logger = pino({ name: "ml-pipeline", level: process.env.LOG_LEVEL ?? "info" });
