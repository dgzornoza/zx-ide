import vue from "@vitejs/plugin-vue";
import * as path from "node:path";
import { defineConfig } from "vite";

const root = path.resolve(__dirname);

export default defineConfig({
  root,
  plugins: [vue()],
  css: {
    postcss: path.resolve(__dirname, "postcss.config.cjs"),
  },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    assetsDir: "assets",
    rollupOptions: {
      input: {
        "extract-tiles": path.resolve(root, "extract-tiles.html"),
        "extract-sprites": path.resolve(root, "extract-sprites.html"),
        "extract-map-tileset": path.resolve(root, "extract-map-tileset.html"),
        "create-tiles": path.resolve(root, "create-tiles.html"),
        "create-sprites": path.resolve(root, "create-sprites.html"),
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, "src"),
      // Use the runtime-only build of vue-i18n. The default `vue-i18n.mjs`
      // includes the message compiler, which calls `new Function()` to evaluate
      // compiled locale messages — that violates the strict CSP that VS Code
      // applies to webviews (`unsafe-eval` is not allowed). The runtime build
      // has no compiler, so messages must be plain strings (we only use
      // simple `{placeholder}` substitutions, which the runtime supports).
      // See https://vue-i18n.intlify.dev/guide/extra/dist
      "vue-i18n": path.resolve(
        __dirname,
        "node_modules/vue-i18n/dist/vue-i18n.runtime.esm-bundler.js"
      ),
    },
  },
});
