import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // sequential — shared server state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  timeout: 60_000,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "http://localhost:3002",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      // PW_CHROMIUM: use an already-installed Chromium instead of downloading the pinned build
      use: { ...devices["Desktop Chrome"], launchOptions: { executablePath: process.env.PW_CHROMIUM || undefined } },
    },
  ],
  webServer: {
    command: "npm start -- --port 3002 --strictPort",
    url: "http://localhost:3002",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
