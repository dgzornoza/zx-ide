module.exports = {
  content: [
    "./index.html",
    "./attach-project-graphics.html",
    "./src/**/*.{ts,vue}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Space Grotesk", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
