import { getEnv } from '@szl-holdings/env';
import { defineConfig } from 'drizzle-kit';
// Migrations need a direct (unpooled) session; see scripts/migration-url.mjs.
import { migrationDatabaseUrl } from './scripts/migration-url.mjs';

const _env = getEnv();

const url = migrationDatabaseUrl({ DATABASE_URL: _env.DATABASE_URL, DATABASE_URL_DIRECT: _env.DATABASE_URL_DIRECT });

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url,
  },
});
