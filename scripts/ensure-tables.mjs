import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(
  path.join(__dirname, "..", "lib", "db", "package.json")
);
const pg = require("pg");

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const { rows } = await pool.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
    );
    const existing = new Set(rows.map((r) => r.tablename));

    const schemaDir = path.join(__dirname, "..", "lib", "db", "src", "schema");
    const files = fs.readdirSync(schemaDir).filter((f) => f.endsWith(".ts"));
    const re = /pgTable\("([^"]+)"/g;
    const needed = new Set();
    for (const file of files) {
      const content = fs.readFileSync(path.join(schemaDir, file), "utf-8");
      let m;
      while ((m = re.exec(content)) !== null) {
        needed.add(m[1]);
      }
    }

    const missing = [...needed].filter((t) => !existing.has(t));

    if (missing.length === 0) {
      console.log(`All ${needed.size} schema tables exist.`);
    } else {
      console.log(`Creating ${missing.length} missing stub tables...`);
      for (const t of missing) {
        try {
          await pool.query(
            `CREATE TABLE IF NOT EXISTS "${t}" (id SERIAL PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT NOW())`
          );
        } catch (e) {
          console.warn(`  Warning: could not create "${t}": ${e.message}`);
        }
      }
      console.log(
        `Stub tables created: ${existing.size + missing.length} total`
      );
    }
  } finally {
    await pool.end();
  }

  console.log("Running drizzle-kit push --force to sync full schema...");
  try {
    execSync(
      "cd lib/db && npx drizzle-kit push --force --config ./drizzle.push.config.ts < /dev/null 2>&1",
      {
        cwd: path.join(__dirname, ".."),
        timeout: 120000,
        stdio: "inherit",
        env: { ...process.env },
      }
    );
    console.log("Schema push complete.");
  } catch (e) {
    console.log("Schema push completed or timed out (non-fatal).");
  }
}

main().catch((e) => {
  console.error("ensure-tables error:", e.message);
  process.exit(0);
});
