import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // the sources import project files as `src/...` (tsconfig `baseUrl`)
    alias: { src: path.resolve(import.meta.dirname, 'src') },
  },
  test: {
    include: ['src/**/*.spec.ts'],
  },
});
