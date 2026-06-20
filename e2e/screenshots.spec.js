import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

// ── Config ───────────────────────────────────────────────────────────────
// Captures reference screenshots of the redesigned ntfy-web UI for the Android
// sister app (UI parity). Run: SHOT_DIR=/abs/path npx playwright test screenshots
const BASE_URL = "https://notify.eli.kr";
const USERNAME = process.env.NTFY_USERNAME || "e2e-test";
const TOKEN = process.env.NTFY_TOKEN;
const TOPIC = `shots-${Date.now().toString(36)}`;
const SHOT_DIR = process.env.SHOT_DIR || path.resolve("e2e/screenshots-out");

if (!TOKEN) throw new Error("NTFY_TOKEN is required in .env");
fs.mkdirSync(SHOT_DIR, { recursive: true });

const MOBILE = { width: 412, height: 915 }; // Pixel-class phone
const DESKTOP = { width: 1366, height: 900 };

const shot = (page, name) => page.screenshot({ path: path.join(SHOT_DIR, `${name}.png`), animations: "disabled" });

async function apiPublish(topic, message, opts = {}) {
  const res = await fetch(BASE_URL, {
    method: "PUT",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message, topic, ...opts }),
  });
  if (!res.ok) throw new Error(`publish failed: ${res.status} ${await res.text()}`);
}

async function authenticate(page) {
  await page.goto("/settings");
  await page.getByRole("button", { name: "Server & Auth" }).click();
  await page.locator("#saf-username-token").fill(USERNAME);
  await page.locator("#saf-token").fill(TOKEN);
  await page.getByRole("button", { name: /server_auth_form_save_button|Save/i }).click();
  await page.waitForTimeout(800);
}

async function subscribe(page, topic) {
  await page.evaluate(
    async ({ topic, baseUrl }) => {
      const subMod = await import("/src/app/SubscriptionManager.js");
      const pollMod = await import("/src/app/Poller.js");
      const subscription = await subMod.default.add(baseUrl, topic, {});
      pollMod.default.pollInBackground(subscription);
    },
    { topic, baseUrl: BASE_URL }
  );
}

async function setTheme(page, choice) {
  await page.goto("/settings");
  await page.getByRole("button", { name: "Appearance" }).click();
  await page.getByRole("tab", { name: choice }).click();
  await page.waitForTimeout(300);
}

// Seed a varied feed once, before any screenshots.
test.beforeAll(async () => {
  await apiPublish(TOPIC, "Backup completed successfully on srv-01.", {
    title: "Nightly backup OK",
    tags: ["white_check_mark", "backup"],
  });
  await apiPublish(TOPIC, "Disk usage on /var crossed 85% — consider pruning logs.", {
    title: "Disk space warning",
    priority: 4,
    tags: ["warning", "srv-01"],
  });
  await apiPublish(TOPIC, "Production deploy **v2.4.1** finished. [Release notes](https://example.com)", {
    title: "Deploy finished 🚀",
    priority: 5,
    tags: ["rocket"],
  });
  await apiPublish(TOPIC, "Hello from ntfy — this is a plain message with no title.");

  // Structured cards (tag `card` + JSON body) — showcase kv / chart / sections + categorized tags.
  await apiPublish(
    TOPIC,
    JSON.stringify({
      type: "kv",
      rows: [
        { key: "CPU", value: "12%", meter: 12 },
        { key: "Memory", value: "71%", status: "warn", meter: 71 },
        { key: "Disk", value: "96%", status: "error", meter: 96 },
        { key: "Uptime", value: "22 hours" },
      ],
    }),
    { title: "srv-01 status", tags: ["card"] }
  );
  await apiPublish(
    TOPIC,
    JSON.stringify({
      type: "chart",
      kind: "bar",
      data: [
        { label: "Mon", value: 12 },
        { label: "Tue", value: 34 },
        { label: "Wed", value: 28 },
        { label: "Thu", value: 41 },
        { label: "Fri", value: 19 },
      ],
    }),
    { title: "Weekly errors", tags: ["card"] }
  );
  await apiPublish(
    TOPIC,
    JSON.stringify({
      type: "sections",
      blocks: [
        { type: "markdown", text: "## Build failed ❌\n`main` nightly stopped at **test**." },
        {
          type: "kv",
          columns: 2,
          rows: [
            { key: "Branch", value: "main" },
            { key: "Stage", value: "test", status: "error" },
            { key: "Coverage", value: "81%", meter: 81 },
            { key: "Failed", value: "3 tests", status: "error" },
          ],
        },
        { type: "list", items: ["auth/login — timeout", "api/orders — 500"] },
      ],
    }),
    { title: "nightly build #482", priority: 5, tags: ["card", "service:github", "deploy", "ci", "backend"] }
  );
});

// ── MOBILE (primary reference for Android) ────────────────────────────────
test.describe("mobile", () => {
  test.use({ viewport: MOBILE });

  test("01 first-run + auth + seeded feed", async ({ page }) => {
    await authenticate(page);
    await subscribe(page, TOPIC);

    await page.goto("/");
    await page.waitForTimeout(500);
    await shot(page, "mobile-01-subscriptions-home");

    await page.goto(`/${TOPIC}`);
    await expect(page.getByText("nightly build #482").first()).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(800);
    await shot(page, "mobile-02-feed");

    // Structured cards (kv / chart / sections) are at the top of the feed
    await shot(page, "mobile-10-structured-cards");

    // Drawer (hamburger)
    await page.locator("header button").first().click();
    await page.waitForTimeout(400);
    await shot(page, "mobile-04-drawer");
    await page.keyboard.press("Escape");

    // Publish sheet via FAB
    await page.goto(`/${TOPIC}`);
    await page.locator("button.z-fab").click();
    await expect(page.locator("#publish-body")).toBeVisible({ timeout: 10000 });
    await page.locator("#publish-body").fill("Reference screenshot — publish sheet");
    await page.waitForTimeout(300);
    await shot(page, "mobile-05-publish");
    await page.keyboard.press("Escape");

    // Settings
    await page.goto("/settings");
    await page.waitForTimeout(400);
    await shot(page, "mobile-06-settings-general");
    await page.getByRole("button", { name: "Appearance" }).click();
    await page.waitForTimeout(300);
    await shot(page, "mobile-07-settings-appearance");
    await page.getByRole("button", { name: "Server & Auth" }).click();
    await page.waitForTimeout(300);
    await shot(page, "mobile-08-settings-server");

    // Dark theme feed
    await setTheme(page, "Dark");
    await page.goto(`/${TOPIC}`);
    await expect(page.getByText("nightly build #482").first()).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(800);
    await shot(page, "mobile-09-feed-dark");
    await setTheme(page, "Light");
  });
});

// ── DESKTOP (layout intent) ───────────────────────────────────────────────
test.describe("desktop", () => {
  test.use({ viewport: DESKTOP });

  test("10 shell + detail + settings", async ({ page }) => {
    await authenticate(page);
    await subscribe(page, TOPIC);

    await page.goto(`/${TOPIC}`);
    await expect(page.getByText("nightly build #482").first()).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(800);
    await shot(page, "desktop-01-shell");

    await page.goto("/settings");
    await page.waitForTimeout(400);
    await shot(page, "desktop-03-settings");

    await setTheme(page, "Dark");
    await page.goto(`/${TOPIC}`);
    await expect(page.getByText("nightly build #482").first()).toBeVisible({ timeout: 30000 });
    await page.waitForTimeout(800);
    await shot(page, "desktop-04-shell-dark");
    await setTheme(page, "Light");
  });
});
