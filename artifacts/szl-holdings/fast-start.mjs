import http from "http";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 3000;

const placeholder = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end("<html><body>Starting...</body></html>");
});

placeholder.listen(port, "0.0.0.0", () => {
  console.log(`Port ${port} open (placeholder)`);
  
  setTimeout(() => {
    placeholder.close(() => {
      console.log("Placeholder closed, starting Vite...");
      const vite = spawn(
        path.join(__dirname, "node_modules/.bin/vite"),
        ["--config", "vite.config.ts", "--host", "0.0.0.0"],
        {
          cwd: __dirname,
          stdio: "inherit",
          env: { ...process.env, PORT: String(port) },
        }
      );
      vite.on("exit", (code) => process.exit(code || 0));
    });
  }, 2000);
});
