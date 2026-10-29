import { defineConfig } from 'vitest/config';

// Unit tests for the pure domain modules; code that needs `vscode` is tested by `pnpm test` (extension host).
export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
    environment: 'node',
  },
});
