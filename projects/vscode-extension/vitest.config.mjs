import path from 'path';
import { defineConfig } from 'vitest/config';

// Unit tests for the pure domain modules; code that needs `vscode` is tested by `pnpm test` (extension host).
export default defineConfig({
  resolve: {
    // same aliases as tsconfig `paths` and webpack
    alias: {
      '@core': path.resolve(import.meta.dirname, 'src/core'),
      '@commands': path.resolve(import.meta.dirname, 'src/commands'),
      '@z88dk': path.resolve(import.meta.dirname, 'src/z88dk'),
      '@sjasmplus': path.resolve(import.meta.dirname, 'src/sjasmplus'),
      externalShared: path.resolve(import.meta.dirname, '../shared'),
    },
  },
  test: {
    include: ['src/**/*.spec.ts'],
    environment: 'node',
  },
});
