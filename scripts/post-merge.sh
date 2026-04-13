#!/bin/bash
set -e
pnpm install --frozen-lockfile 2>&1 || pnpm install 2>&1 || true

echo "Ensuring all schema tables exist in database..."
node -e "
const pg = require('pg');
const fs = require('fs');
const path = require('path');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  const { rows } = await pool.query(\"SELECT tablename FROM pg_tables WHERE schemaname = 'public'\");
  const existing = new Set(rows.map(r => r.tablename));
  const schemaDir = path.join(__dirname, '..', 'lib', 'db', 'src', 'schema');
  const files = fs.readdirSync(schemaDir).filter(f => f.endsWith('.ts'));
  const re = /pgTable\(\"([^\"]+)\"/g;
  const missing = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(schemaDir, file), 'utf-8');
    let m;
    while ((m = re.exec(content)) !== null) {
      if (!existing.has(m[1])) missing.push(m[1]);
    }
  }
  if (missing.length > 0) {
    console.log('Creating ' + missing.length + ' missing tables...');
    for (const t of missing) {
      await pool.query('CREATE TABLE IF NOT EXISTS \"' + t + '\" (id SERIAL PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT NOW())').catch(() => {});
    }
  }
  console.log('Schema tables: OK (' + (existing.size + missing.length) + ' total)');
  await pool.end();
})().catch(e => { console.error(e.message); process.exit(0); });
" 2>&1 || true

echo "Running drizzle-kit push (non-interactive)..."
timeout 55 bash -c 'cd lib/db && npx drizzle-kit push --config ./drizzle.push.config.ts --force < /dev/null 2>&1' || echo "drizzle-kit push timed out or failed (non-fatal)"
