import { spawn, type ChildProcess } from "node:child_process";
import { resolve, dirname } from "node:path";
import type { Plugin } from "vite";

export function apiServerPlugin(): Plugin {
  let child: ChildProcess | null = null;
  const apiRoot = resolve(dirname(import.meta.dirname!), "api-server");

  function startApi() {
    if (child) return;
    console.log("[api-plugin] Starting API server on port 9090...");
    child = spawn("node", [
      "--max-old-space-size=512",
      "--enable-source-maps",
      resolve(apiRoot, "dist/index.mjs"),
    ], {
      cwd: apiRoot,
      env: { ...process.env, PORT: "9090", __FAST_START_SERVER: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.stdout?.on("data", (d: Buffer) => {
      const line = d.toString().trim();
      if (line) console.log(`[api] ${line}`);
    });
    child.stderr?.on("data", (d: Buffer) => {
      const line = d.toString().trim();
      if (line) console.error(`[api] ${line}`);
    });

    child.on("exit", (code, signal) => {
      console.log(`[api-plugin] API exited (code=${code}, signal=${signal}). Restarting in 3s...`);
      child = null;
      setTimeout(startApi, 3000);
    });
  }

  return {
    name: "api-server-plugin",
    configureServer() {
      startApi();
    },
    buildEnd() {
      if (child) {
        child.removeAllListeners("exit");
        child.kill();
        child = null;
      }
    },
  };
}
