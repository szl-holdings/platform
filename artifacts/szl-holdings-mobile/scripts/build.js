const { execSync } = require("child_process");
const path = require("path");

console.log("[szl-holdings-mobile] Building web bundle…");
try {
  execSync("pnpm exec expo export --platform web --output-dir dist", {
    stdio: "inherit",
    cwd: path.resolve(__dirname, ".."),
  });
  console.log("[szl-holdings-mobile] Build complete → dist/");
} catch (err) {
  console.error("[szl-holdings-mobile] Build failed:", err.message);
  process.exit(1);
}
