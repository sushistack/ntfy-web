import { test, expect } from "@playwright/test";

// Incident board e2e against the real server: publish alerts the way our senders do
// (ops-alerter re-fires, Kuma DOWN/UP, numbers in titles, low-priority info) and check the app
// groups them. Needs NTFY_TOKEN in .env for a user with rw on `e2e-*`.
const BASE_URL = "https://ntfy.eli.kr";
const USERNAME = process.env.NTFY_USERNAME || "e2e-test";
const TOKEN = process.env.NTFY_TOKEN;
const TOPIC = `e2e-board-${Date.now().toString(36)}`;

if (!TOKEN) throw new Error("NTFY_TOKEN is required in .env");

async function publish(title, priority, message = title, tags = []) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ topic: TOPIC, title, priority, message, tags }),
  });
  if (!res.ok) throw new Error(`publish failed: ${res.status} ${await res.text()}`);
  // ntfy timestamps are whole seconds; real senders never publish the same alert twice in one second
  await new Promise((resolve) => setTimeout(resolve, 1100));
}

const backupCard = JSON.stringify({
  type: "kv",
  rows: [
    { key: "Service", value: "e2e-svc" },
    { key: "Newest", value: "31h old", status: "error" },
  ],
});

async function authenticate(page) {
  await page.goto("/settings");
  await page.getByRole("button", { name: "Server & Auth" }).click();
  await page.locator("#saf-username-token").fill(USERNAME);
  await page.locator("#saf-token").fill(TOKEN);
  await page.getByRole("button", { name: /server_auth_form_save_button|Save|Save settings/i }).click();
  await expect(page.locator('[role="alert"]')).not.toBeVisible({ timeout: 5000 });
}

async function subscribe(page) {
  await page.evaluate(
    async ({ topic, baseUrl }) => {
      const subMod = await import("/src/app/SubscriptionManager.js");
      const pollMod = await import("/src/app/Poller.js");
      const subscription = await subMod.default.add(baseUrl, topic, {});
      await pollMod.default.poll(subscription);
    },
    { topic: TOPIC, baseUrl: BASE_URL }
  );
}

const card = (page, title) => page.getByRole("button", { name: new RegExp(title, "i") });
const section = (page, name) => page.locator("section").filter({ has: page.getByRole("heading", { name }) });

test.describe.configure({ mode: "serial" });

test.describe("incident board (real server)", () => {
  test.beforeAll(async () => {
    // ops-alerter style: same alert three times
    for (let i = 0; i < 3; i += 1) await publish("🥪 Backup stale: e2e-svc", 5, backupCard, ["card"]);
    // numbers in the title must still group
    await publish("e2e-node disk at 80%", 4);
    await publish("e2e-node disk at 82%", 4);
    // Kuma style DOWN then UP
    await publish("Webapp  DOWN", 5);
    await publish("Webapp  UP", 3);
    // low-priority one-off
    await publish("Daily summary", 3, "Collected 3,000 videos.");
  });

  test("groups repeats, numbers and DOWN/UP into incidents by state", async ({ page }) => {
    await page.goto("/");
    await authenticate(page);
    await subscribe(page);
    await page.goto(`/${TOPIC}`);

    await expect(page.getByRole("heading", { level: 1, name: "2 things are still firing." })).toBeVisible({ timeout: 15000 });

    const firing = section(page, "Firing now");
    await expect(card(firing, "Backup stale: e2e-svc")).toHaveCount(1);
    await expect(card(firing, "Backup stale: e2e-svc")).toContainText("Sent 3 times");
    await expect(card(firing, "e2e-node disk at")).toHaveCount(1);
    await expect(card(firing, "e2e-node disk at")).toContainText("Sent 2 times");

    await expect(card(section(page, "Went quiet today"), "Webapp DOWN")).toHaveCount(1);
    await expect(card(section(page, "For your information"), "Daily summary")).toHaveCount(1);
  });

  test("new alerts arrive live and join their incident", async ({ page }) => {
    await page.goto("/");
    await authenticate(page);
    await subscribe(page);
    await page.goto(`/${TOPIC}`);
    await expect(card(page, "Backup stale: e2e-svc")).toContainText("Sent 3 times", { timeout: 15000 });

    await publish("🥪 Backup stale: e2e-svc", 5, backupCard, ["card"]);
    await expect(card(page, "Backup stale: e2e-svc")).toContainText("Sent 4 times", { timeout: 20000 });
  });

  test("incident detail shows the structured message, send times, mark read and back", async ({ page }) => {
    await page.goto("/");
    await authenticate(page);
    await subscribe(page);
    await page.goto(`/${TOPIC}`);

    await card(page, "Backup stale: e2e-svc").click();
    await expect(page).toHaveURL(/\?incident=/);
    await expect(page.getByRole("heading", { level: 1, name: /Backup stale: e2e-svc/ })).toBeVisible();
    await expect(page.getByText(/Still firing since/)).toBeVisible();
    await expect(page.getByText("31h old")).toBeVisible(); // kv card rendered, not raw JSON
    await expect(page.getByRole("heading", { name: "Sent at" })).toBeVisible();

    // Backlog fetched on subscribe is stored as read; a live arrival is unread and updates the open detail.
    const markRead = page.getByRole("button", { name: "Mark read" });
    await expect(markRead).toBeHidden();
    await publish("🥪 Backup stale: e2e-svc", 5, backupCard, ["card"]);
    await expect(page.getByText(/Sent 5 times/)).toBeVisible({ timeout: 20000 });
    await expect(markRead).toBeVisible();
    await markRead.click();
    await expect(markRead).toBeHidden();

    await page.getByRole("button", { name: /Board/ }).first().click();
    await expect(page).not.toHaveURL(/\?incident=/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("still firing");
  });

  test("Messages tab keeps the raw feed", async ({ page }) => {
    await page.goto("/");
    await authenticate(page);
    await subscribe(page);
    await page.goto(`/${TOPIC}`);

    await page.getByRole("button", { name: "Messages", exact: true }).click();
    await expect(page).toHaveURL(/view=messages/);
    await expect(page.getByRole("list", { name: "Notification list" }).locator(":scope > li")).toHaveCount(10, { timeout: 15000 }); // 8 + 2 live publishes above
  });

  test("History shows the alert across the week", async ({ page }) => {
    await page.goto("/");
    await authenticate(page);
    await subscribe(page);

    await page.getByRole("button", { name: "History" }).click();
    await expect(page).toHaveURL("/history");
    await expect(page.getByRole("heading", { level: 1, name: "Last 7 days" })).toBeVisible();
    const row = card(page, "Backup stale: e2e-svc");
    await expect(row).toContainText("Still firing", { timeout: 15000 });
    await expect(page.getByRole("button", { name: /Daily summary/ })).toHaveCount(0); // info is not history

    await row.click();
    await expect(page).toHaveURL(new RegExp(`/${TOPIC}\\?incident=`));
  });
});
