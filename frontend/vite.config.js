import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const publicAssets = new Map([
  ["AutoLuxe.html", "text/html; charset=utf-8"],
  ["luxury-showcase.png", "image/png"],
  ["vite.svg", "image/svg+xml"],
]);

const publicDirectory = new URL("./public/", import.meta.url);
const readPublicAsset = (name) => readFile(new URL(name, publicDirectory));

// Keep the same public URLs in development and builds, publishing only the app's assets.
const publishPublicAssets = {
  name: "publish-public-assets",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const name = req.url?.split("?")[0].slice(1);
      if (!publicAssets.has(name) || !["GET", "HEAD"].includes(req.method)) return next();
      try {
        const contents = await readPublicAsset(name);
        res.setHeader("Content-Type", publicAssets.get(name));
        res.end(req.method === "HEAD" ? undefined : contents);
      } catch (error) {
        next(error);
      }
    });
  },
  async generateBundle() {
    for (const name of publicAssets.keys()) {
      this.emitFile({ type: "asset", fileName: name, source: await readPublicAsset(name) });
    }
  },
};

export default defineConfig({
  plugins: [react(), publishPublicAssets],
  publicDir: false,
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          calendar: ["react-datepicker"],
          motion: ["framer-motion"],
        },
      },
    },
  },
  server: {
    proxy: { "/api": "http://127.0.0.1:5000" },
    fs: {
      // Keep Vite's default sensitive-file rules and block direct access to public source files.
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", fileURLToPath(publicDirectory) + "**"],
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.js",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{js,jsx}"],
      exclude: ["src/main.jsx", "src/setupTests.js", "**/*.test.{js,jsx}"],
    },
  },
});
