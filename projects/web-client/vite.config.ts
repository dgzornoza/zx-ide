import vue from "@vitejs/plugin-vue";
import * as path from "path";
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
        "extract-graphics": path.resolve(root, "extract-graphics.html"),
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
    },
  },
});
