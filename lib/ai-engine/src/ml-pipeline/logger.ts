import pino from "pino";
import { getEnv } from "@szl-holdings/env";

export const logger = pino({ name: "ml-pipeline", level: getEnv().LOG_LEVEL ?? "info" });
