import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { conditions: ['workspace', 'development'] },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
