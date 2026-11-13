/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/app/test-setup.js"],
    exclude: ["**/node_modules/**", "e2e/**"], // e2e/ is Playwright (npm run e2e), not vitest
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "build",
    assetsDir: "static/media",
    sourcemap: true,
  },
  server: {
    port: 3000,
  },
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // see registerSW.js imported by index.jsx
      injectRegister: null,
      strategies: "injectManifest",
      devOptions: {
        enabled: true,
        /* when using generateSW the PWA plugin will switch to classic */
        type: "module",
        navigateFallback: "index.html",
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"],
        globIgnores: ["config.js"],
      },
      // Standalone UI (no ntfy go server in front), so the manifest is a static file:
      // public/manifest.webmanifest. Without it prod had no installable PWA (/manifest.webmanifest fell through to index.html).
      manifest: false,
    }),
  ],
}));
