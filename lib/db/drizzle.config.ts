import { getEnv } from '@szl-holdings/env';
import { defineConfig } from 'drizzle-kit';

const _env = getEnv();

if (!_env.DATABASE_URL) {
  throw new Error('DATABASE_URL, ensure the database is provisioned');
}

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: _env.DATABASE_URL,
  },
});
