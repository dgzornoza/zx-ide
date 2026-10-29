import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // same aliases as tsconfig `baseUrl` / `paths` and webpack
    alias: {
      src: path.resolve(import.meta.dirname, 'src'),
      externalShared: path.resolve(import.meta.dirname, '../shared'),
    },
  },
  test: {
    include: ['src/**/*.spec.ts'],
  },
});
