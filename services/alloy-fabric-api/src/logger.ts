const isTest = process.env["NODE_ENV"] === "test";

function emit(level: string, msg: string, fields?: Record<string, unknown>): void {
  if (isTest) return;
  const line = JSON.stringify({ level, ts: new Date().toISOString(), service: "alloy-fabric-api", msg, ...fields });
  if (level === "error" || level === "warn") {
    process.stderr.write(line + "\n");
  } else {
    process.stdout.write(line + "\n");
  }
}

export const logger = {
  info: (msg: string, fields?: Record<string, unknown>) => emit("info", msg, fields),
  warn: (msg: string, fields?: Record<string, unknown>) => emit("warn", msg, fields),
  error: (msg: string, fields?: Record<string, unknown>) => emit("error", msg, fields),
  debug: (msg: string, fields?: Record<string, unknown>) => emit("debug", msg, fields),
};
