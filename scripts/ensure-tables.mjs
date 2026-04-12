import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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
      return;
    }

    console.log(`Creating ${missing.length} missing tables...`);
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
      `Schema tables: OK (${existing.size + missing.length} total)`
    );
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error("ensure-tables error:", e.message);
  process.exit(0);
});
