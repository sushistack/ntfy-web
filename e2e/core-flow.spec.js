import { test, expect } from "@playwright/test";

// ─ Config ──────────────────────────────────────────────────────────────
const BASE_URL = "https://notify.eli.kr";
const USERNAME = process.env.NTFY_USERNAME || "e2e-test";
const TOKEN = process.env.NTFY_TOKEN;
const TEST_TOPIC = `e2e-${Date.now().toString(36)}`;

if (!TOKEN) throw new Error("NTFY_TOKEN is required in .env");

// ── API helpers (slice: calls real server) ──────────────────────────────
async function apiPublish(baseUrl, topic, message, opts = {}) {
  const res = await fetch(baseUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, topic, ...opts }),
  });
  if (!res.ok) throw new Error(`publish failed: ${res.status} ${await res.text()}`);
}

async function apiPoll(baseUrl, topic) {
  const res = await fetch(`${baseUrl}/${topic}/json?poll=1`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) throw new Error(`poll failed: ${res.status}`);
  const text = await res.text();
  return text
    .trim()
    .split(/\n+/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function waitForApiMessage(topic, predicate, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const messages = await apiPoll(BASE_URL, topic);
    const message = messages.find(predicate);
    if (message) return message;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return undefined;
}

// ── Auth helper ─────────────────────────────────────────────────────────
const settingsButton = (page) => page.getByRole("button", { name: /Settings|sidebar_settings/i });
const addTopicButton = (page) => page.getByRole("button", { name: /Subscribe to topic|sidebar_add_topic/i });

async function authenticate(page) {
  const settingsBtn = settingsButton(page);
  await settingsBtn.click();
  await expect(page).toHaveURL("/settings", { timeout: 10000 });

  await expect(page.getByRole("button", { name: "Server & Auth" })).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: "Server & Auth" }).click();

  await page.locator("#saf-username-token").fill(USERNAME);
  await page.locator("#saf-token").fill(TOKEN);
  await page.getByRole("button", { name: /server_auth_form_save_button|Save|Save settings/i }).click();
  await expect(page.locator('[role="alert"]')).not.toBeVisible({ timeout: 5000 });
}

// ── Subscribe helper (creates subscription in IndexedDB + starts poller) ─
async function addSubscription(page, topic, baseUrl = BASE_URL) {
  await page.evaluate(
    async ({ topic, baseUrl }) => {
      const subMod = await import("/src/app/SubscriptionManager.js");
      const pollMod = await import("/src/app/Poller.js");
      const subscription = await subMod.default.add(baseUrl, topic, {});
      pollMod.default.pollInBackground(subscription);
    },
    { topic, baseUrl }
  );
}

// ── Tests ──────────────────────────────────────────────────────────────

test.describe("ntfy-web e2e — full core flow", () => {
  test("1. 앱 로드 및 셸 렌더링", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ntfy/);
    await expect(settingsButton(page)).toBeVisible({ timeout: 15000 });
    await expect(addTopicButton(page)).toBeVisible();
    await expect(page.locator("#main")).toBeVisible();
    await expect(page.getByRole("button", { name: /Publish a message/i })).toBeVisible();
  });

  test("2. 서버 인증 (토큰) → 세션 유지", async ({ page }) => {
    await page.goto("/");
    await authenticate(page);

    // Navigate away and back
    await page.goto("/");
    const settingsBtn = settingsButton(page);
    await settingsBtn.click();
    await expect(page).toHaveURL("/settings");

    // Switch to Server tab — auth data should persist
    await page.getByRole("button", { name: "Server & Auth" }).click();
    await expect(page.locator("#saf-token")).toBeVisible({ timeout: 10000 });
  });

  test("3. 구독 생성 → 사이드바에 표시", async ({ page }) => {
    await page.goto("/");
    await authenticate(page);
    await addSubscription(page, TEST_TOPIC);

    // Navigate to topic
    await page.goto(`/${TEST_TOPIC}`);
    await expect(page.locator("#main")).toBeVisible({ timeout: 10000 });

    // Sidebar should show the topic
    await expect(page.getByRole("button", { name: new RegExp(TEST_TOPIC, "i") }).first()).toBeVisible({ timeout: 10000 });
  });

  test("4. 메시지 발송 (UI) → API로 확인", async ({ page }) => {
    const testMessage = `e2e-msg-${Date.now()}`;

    await page.goto("/");
    await authenticate(page);
    await addSubscription(page, TEST_TOPIC);
    await page.goto(`/${TEST_TOPIC}`);
    await page.waitForSelector("#main", { timeout: 10000 });

    // Click FAB (fixed-position button with plus icon)
    await page.locator("button.z-fab").click();

    // Wait for dialog/sheet
    await expect(page.locator("#publish-body")).toBeVisible({ timeout: 10000 });

    // Fill message body
    await page.locator("#publish-body").fill(testMessage);

    // Send — use the last button in the dialog (the send button)
    await page.locator('[role="dialog"] button, [role="complementary"] button').last().click();

    // Wait for dialog to close
    await expect(page.locator("#publish-body")).not.toBeVisible({ timeout: 10000 });

    // Verify via API
    await expect(async () => {
      expect(await waitForApiMessage(TEST_TOPIC, (m) => m.message === testMessage)).toBeDefined();
    }).toPass({ timeout: 15000 });
  });

  test("5. API 슬라이스 — 구독 후 발행 → 피드에 표시", async ({ page }) => {
    const testMessage = `e2e-slice-${Date.now()}`;

    // Setup: auth + subscribe first
    await page.goto("/");
    await authenticate(page);
    await addSubscription(page, TEST_TOPIC);
    await page.goto(`/${TEST_TOPIC}`);
    await expect(page.locator("#main")).toBeVisible({ timeout: 10000 });

    // Now publish via API (after subscription exists)
    await apiPublish(BASE_URL, TEST_TOPIC, testMessage);

    // Verify via API
    const messages = await apiPoll(BASE_URL, TEST_TOPIC);
    expect(messages.find((m) => m.message === testMessage)).toBeDefined();

    // Message should appear in feed (polling picks it up)
    await expect(page.getByText(testMessage).first()).toBeVisible({ timeout: 30000 });
  });

  test("6. 설정 — 테마 변경", async ({ page }) => {
    await page.goto("/");
    await expect(settingsButton(page)).toBeVisible({ timeout: 15000 });

    await settingsButton(page).click();
    await expect(page).toHaveURL("/settings");
    await page.getByRole("button", { name: "Appearance" }).click();
    await page.getByRole("tab", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/, { timeout: 5000 });
  });

  test("7. 설정 — 언어 변경 → i18n 적용", async ({ page }) => {
    await page.goto("/");
    await expect(settingsButton(page)).toBeVisible({ timeout: 15000 });

    await settingsButton(page).click();
    await expect(page).toHaveURL("/settings");
    await page.getByRole("button", { name: "General" }).click();

    const langSelect = page.locator('select[id*="language"]').or(page.locator("select").first());
    await expect(langSelect).toBeVisible();
    await langSelect.selectOption("ko");

    await expect(page.locator("html")).toHaveAttribute("lang", /ko/, { timeout: 10000 });
  });

  test("8. 전체 플로우 — 인증 → 구독 → 발행 → 수신", async ({ page }) => {
    const testMessage = `e2e-full-${Date.now()}`;
    const testTitle = `Full ${Date.now()}`;

    // 1. Authenticate
    await page.goto("/");
    await authenticate(page);

    // 2. Create subscription
    await addSubscription(page, TEST_TOPIC);

    // 3. Navigate to topic
    await page.goto(`/${TEST_TOPIC}`);
    await expect(page.locator("#main")).toBeVisible({ timeout: 10000 });

    // 4. Publish via API
    await apiPublish(BASE_URL, TEST_TOPIC, testMessage, { title: testTitle });

    // 5. Verify in UI (polling picks it up)
    await expect(page.getByText(testMessage).first()).toBeVisible({ timeout: 30000 });

    // 6. Click card to see detail
    await page.getByText(testMessage).first().click();
    await expect(page.getByText(testTitle).first()).toBeVisible({ timeout: 10000 });
  });
});
