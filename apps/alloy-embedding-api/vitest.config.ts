import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    conditions: ['workspace'],
  },
  server: {
    deps: {
      inline: [/^@workspace\//],
    },
  },
  test: {
    include: ['src/__tests__/**/*.test.ts'],
    environment: 'node',
  },
});
