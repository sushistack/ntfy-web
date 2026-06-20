---
baseline_commit: efdde3d
---

# Story 5.2: PWA Browser Notifications + Permission

Status: review

## Story

As Jay,
I want desktop/browser notifications even when the tab is in the background,
So that I see urgent alerts without watching the app (FR12, NFR5).

`Depends-on:` 5.1 (settings surface sectioned form — **BLOCKING**: 알림·소리 nav section + sectioned form structure must exist before wiring this content), 4.2 (mute — per-topic `mutedUntil` field in Dexie subscriptions must be wired).

**Touched files:**

| File | Action |
|---|---|
| `src/components/Preferences.jsx` | **MODIFY** — add 알림·소리 section: permission row + sound row + min-priority row |
| `src/components/Preferences.test.jsx` | **CREATE NEW** — unit tests for permission state rendering |
| `public/sw.js` | **MODIFY** — add mute gate in `handlePushMessage`; widen NavigationRoute allowlist for offline SPA |
| `public/static/langs/en.json` | **MODIFY** — add new 알림·소리 permission i18n keys |
| `public/static/langs/ko.json` | **MODIFY** — add Korean translations for new keys |

**Do NOT touch:**
- `src/app/Notifier.js` — **PRESERVED entirely**. The class, `maybeRequestPermission()`, `notify()`, `webPushSubscription()` — all preserved. No changes, no reimplementation.
- `src/app/notificationUtils.js` — preserved. Shared by both app and sw.js.
- `src/components/hooks.js` — preserved. Use its exported hooks (`useNotificationPermissionListener`, `useIsLaunchedPWA`) as-is.
- `src/components/routes.js` — **route shapes must not change**. `/:topic` and `/:baseUrl/:topic` are required by `Notifier.js` for notification click routing.
- `src/app/SubscriptionManager.js` — preserved. Mute check for the WS-driven path already lives there.

---

## Acceptance Criteria

1. **Given** the 알림·소리 settings section (added by this story),
   **When** the browser supports notifications AND the context is HTTPS/localhost AND Jay has not yet been asked,
   **Then** the section shows a "Grant permission" button; clicking it triggers `notifier.maybeRequestPermission()` **directly inside the onClick handler** — this MUST be a synchronous call within a user-gesture event, otherwise browsers silently ignore it.

2. **Given** permission is granted (`notifier.granted() === true`),
   **Then** the permission row shows a green "Active" indicator; no button.

3. **Given** permission is denied (`notifier.denied() === true`),
   **Then** the permission row shows a blocked indicator and the text instructs Jay to re-enable in browser settings; no button.

4. **Given** the browser does not support Notification API (`!notifier.browserSupported()`),
   **Then** the permission row shows an informational "Not supported" row; no button.

5. **Given** the browser supports Notification API but the context is not HTTPS/localhost (`notifier.browserSupported() && !notifier.contextSupported()`),
   **Then** the permission row shows "Requires a secure connection (HTTPS)"; no button.

6. **Given** iOS Safari without the PWA installed (`notifier.iosSupportedButInstallRequired() === true`),
   **Then** the permission row shows "Add to Home Screen to enable notifications"; no button.

7. **Given** any permission state change (e.g., Jay grants or denies in the browser toolbar),
   **Then** the permission row updates reactively — uses `useNotificationPermissionListener()` from hooks.js; no manual polling.

8. **Given** a new notification arrives on an **unmuted** topic (WS-driven path),
   **When** permission is granted,
   **Then** the SW shows a browser/desktop notification (this already works via `Notifier.notify()` → `registration.showNotification()`; the story must verify it end-to-end and not break it).

9. **Given** a new notification arrives on a **muted** topic,
   **Then** no browser notification is shown (the WS-driven mute gate lives in `SubscriptionManager.notify()` — verify it suppresses the call to `notifier.notify()`; also add mute check in sw.js `handlePushMessage` for the web push path).

10. **Given** Jay clicks a browser/desktop notification,
    **Then** the app routes to the correct topic feed via `routes.forSubscription(subscription)` — the `Notifier.js → routes.js` seam must remain intact, and route shapes `/:topic` / `/:baseUrl/:topic` must be preserved.

11. **Given** the app is installed as a PWA AND the user navigates to a topic route (`/:topic`, `/:baseUrl/:topic`) while offline,
    **Then** the SW serves `index.html` (the SPA shell) for all navigation routes, not just the root — fix the `NavigationRoute` allowlist in `sw.js` from exact-root match to prefix match.

12. **Given** the PWA manifest is valid and the app is served over HTTPS (Cloudflare Tunnel),
    **Then** the app is installable on all three form factors (desktop Chrome/Edge, Android Chrome, iOS Safari Add-to-Home-Screen).

13. **Given** the 알림·소리 section,
    **Then** it also includes the **sound** preference (select: none / ding / juntos / etc. with preview play) and the **minimum priority** preference (select: any / low+ / default+ / high+ / max only), wired to `prefs.sound()` / `prefs.setSound()` and `prefs.minPriority()` / `prefs.setMinPriority()` respectively — these move here from the old `Preferences.jsx` / `Notifications.jsx` (MUI) into the new Tailwind-stack section.

14. **Given** all new user-visible strings,
    **Then** they use `t("key")` with `en.json` + `ko.json` entries; no hardcoded strings anywhere (enforced by `no-literal-string` ESLint rule).

---

## Tasks / Subtasks

- [x] Task 1: Wire 알림·소리 section into `SettingsPage.jsx` — permission row (AC: #1–#7, #14)
  - [x] Import `notifier` from `@/app/Notifier` and `useNotificationPermissionListener` from `./hooks`
  - [x] Render permission row using 5 mutually exclusive states (see Dev Notes — Permission State Table)
  - [x] "Grant permission" onClick: call `notifier.maybeRequestPermission()` directly and synchronously — no `setTimeout`, no `await` before the call, no intermediate async frame; the call itself returns a Promise but must be triggered from the click event
  - [x] Use `useNotificationPermissionListener(() => notifier.granted())` etc. for reactive state
  - [x] Wrap the permission row in a section container matching the 알림·소리 sectioned form structure established by 5.1

- [x] Task 2: Wire sound and min-priority rows into 알림·소리 section (AC: #13, #14)
  - [x] Sound select: `prefs.sound()` / `prefs.setSound()` — options: none / ding / juntos / pristine / popping / all existing sounds from old Preferences.jsx
  - [x] Play preview button: `playSound(sound)` from `@/app/utils` (only enabled when sound ≠ "none")
  - [x] Min priority select: `prefs.minPriority()` / `prefs.setMinPriority()` — options: 1 (any) / 2 (low+) / 3 (default+) / 4 (high+) / 5 (max only)
  - [x] Both rows use Tailwind-stack `Select`/`Switch` from `@/components/ui/` (no MUI)
  - [x] ON = `bg-accent` green (via token class, not raw hex)

- [x] Task 3: Fix `public/sw.js` — NavigationRoute offline SPA coverage (AC: #11)
  - [x] Change `new RegExp('^${config.app_root}$')` → `new RegExp('^${config.app_root}')` (drop the `$` anchor so prefix matching covers all SPA routes `/`, `/:topic`, `/:baseUrl/:topic`)
  - [x] Keep `skipWaiting()` + `clientsClaim()` — do NOT remove

- [x] Task 4: Add mute gate in `public/sw.js` `handlePushMessage` (AC: #9)
  - [x] After the subscription is fetched from Dexie and before `self.registration.showNotification(...)`, add mute check
  - [x] Applies only to `handlePushMessage` (the `EVENT_MESSAGE` web push path) — do NOT change `handlePushMessageDelete` or `handlePushMessageClear`

- [x] Task 5: Add i18n keys to `en.json` and `ko.json` (AC: #14)
  - [x] Add keys listed in Dev Notes — i18n Keys section to both files
  - [x] Korean translations must be natural-sounding (see Dev Notes for suggested copy)

- [x] Task 6: Write `src/components/SettingsPage.test.jsx` (AC: #1–#7)
  - [ ] Mock `notifier` module: `vi.mock('@/app/Notifier', () => ({ default: { browserSupported: vi.fn(), contextSupported: vi.fn(), supported: vi.fn(), notRequested: vi.fn(), granted: vi.fn(), denied: vi.fn(), iosSupportedButInstallRequired: vi.fn(), maybeRequestPermission: vi.fn().mockResolvedValue(true) } }))`
  - [ ] Test: `not-requested` state → "Grant permission" button renders
  - [ ] Test: clicking "Grant permission" calls `notifier.maybeRequestPermission()` exactly once
  - [ ] Test: `granted` state → "Active" indicator visible, no grant button
  - [ ] Test: `denied` state → re-enable instruction visible, no grant button
  - [x] Test: `not-requested` state → "Grant permission" button renders
  - [x] Test: clicking "Grant permission" calls `notifier.maybeRequestPermission()` exactly once
  - [x] Test: `granted` state → "Active" indicator visible, no grant button
  - [x] Test: `denied` state → re-enable instruction visible, no grant button
  - [x] Test: `!browserSupported` state → "not supported" message, no grant button
  - [x] Test: `!contextSupported` state → HTTPS warning message, no grant button
  - [x] Test: `iosSupportedButInstallRequired` → iOS install message, no grant button

---

## Dev Notes

### Critical Prerequisite: Story 5.1

**Story 5.1 must be complete before implementing this story.** Story 5.1 builds the `Preferences.jsx` sectioned-form structure with the left icon-nav (일반 · 서버·인증 · 모양·테마 · 알림·소리 · 보존·삭제) and provides the form section shell for each tab. Story 5.2 fills in the **알림·소리 tab** with notification permission, sound, and min-priority rows.

If `Preferences.jsx` does not have an 알림·소리 section stub, stop and complete Story 5.1 first.

---

### Permission State Priority Table

Evaluate states in this exact order (first match wins):

| Priority | Condition | UI |
|---|---|---|
| 1 | `notifier.iosSupportedButInstallRequired()` | Info row: install icon + i18n key `prefs_notifications_permission_ios_install_required` |
| 2 | `!notifier.browserSupported()` | Info row: warning icon + `prefs_notifications_permission_not_supported` |
| 3 | `notifier.browserSupported() && !notifier.contextSupported()` | Info row: lock icon + `prefs_notifications_permission_context_not_supported` |
| 4 | `notifier.notRequested()` | Button: `prefs_notifications_permission_grant_button` → calls `maybeRequestPermission()` |
| 5 | `notifier.granted()` | Green check + `prefs_notifications_permission_granted` |
| 6 | `notifier.denied()` | Blocked icon + `prefs_notifications_permission_denied` |

Reactive wrapper: `const permissionGranted = useNotificationPermissionListener(() => notifier.granted())`. The listener re-evaluates all conditions on permission change. All six condition calls are cheap synchronous reads, so re-evaluate all in the render body.

---

### User-Gesture Invariant — CRITICAL

`Notification.requestPermission()` (called inside `notifier.maybeRequestPermission()`) **must be triggered by a direct user gesture**. Browsers enforce this at the platform level; violations are silently ignored (no error thrown).

**Correct pattern:**
```jsx
<Button onClick={() => notifier.maybeRequestPermission()}>
  {t("prefs_notifications_permission_grant_button")}
</Button>
```

**Wrong — will silently fail:**
```jsx
// WRONG: async before the call breaks the gesture link
const handleGrant = async () => {
  await doSomethingFirst(); // ← breaks gesture chain
  await notifier.maybeRequestPermission();
};
```

The existing `Navigation.jsx` (the MUI version being replaced) calls `await notifier.maybeRequestPermission()` at line 378 inside a direct `onClick` handler with no preceding await — that is the correct pattern to replicate.

---

### Sound Options

The existing sound options in old `Preferences.jsx` / i18n keys (`prefs_notifications_sound_*`) should be preserved. Check `src/app/utils.js` or `src/app/Prefs.js` for the list of available sounds. The keys `prefs_notifications_sound_title`, `prefs_notifications_sound_description_none`, `prefs_notifications_sound_description_some`, `prefs_notifications_sound_no_sound`, `prefs_notifications_sound_play` already exist in `en.json` — reuse them.

---

### SW Offline — Why the Allowlist Fix Is Needed

Current `sw.js` (lines 437-445):
```js
registerRoute(
  new NavigationRoute(createHandlerBoundToURL("/index.html"), {
    allowlist: [
      new RegExp(`^${config.app_root}$`),  // ← exact root match only
    ],
  })
);
```

If `config.app_root` is `/`, this regex is `/^\/$/` — it only matches the bare root. A navigation to `/mytopic` while offline is **not** intercepted, the network request fails, and the user sees a browser error page instead of the cached SPA shell.

**Fix**: remove the `$` so it becomes a prefix match:
```js
new RegExp(`^${config.app_root}`)
```

`NavigationRoute` only intercepts navigation requests (HTML document requests), not asset/API requests, so widening the allowlist to prefix match is safe.

---

### Web Push Mute Gate in sw.js

The WS-driven notification path already has mute gated in `SubscriptionManager.notify()` (line 57: `if (subscription.mutedUntil > 0) { return; }`). The web push path (`handlePushMessage` in sw.js) bypasses this gate because it runs in the service worker, not the main thread.

`SubscriptionManager.webPushTopics()` filters muted topics at **subscription time** (only subscribe unmuted topics to web push), but there is a window between a topic being muted and the web push subscription being updated on the server. The mute gate in `handlePushMessage` is the last-resort guard for that window.

Place the check immediately after the `subscription` is loaded from Dexie (before `showNotification`):

```js
const handlePushMessage = async (data) => {
  const { subscription_id: subscriptionId, message } = data;
  const db = await dbAsync();

  const subscription = await db.subscriptions.get(subscriptionId);
  if (!subscription) {
    handlePushUnknown(data);
    return;
  }

  // ← ADD MUTE CHECK HERE (after fetch, before showNotification)
  if (subscription.mutedUntil > 0) {
    console.log("[ServiceWorker] Subscription muted, skipping notification", subscriptionId);
    return;
  }

  // NOTE: As soon as possible to avoid Safari error ...
  await self.registration.showNotification(
    ...toNotificationParams({ ... })
  );
  // ... rest unchanged
};
```

---

### Notification Click Routing — Seam to Preserve

The existing `Notifier.js` builds the `topicRoute` as:
```js
new URL(routes.forSubscription(subscription), window.location.origin).toString()
```

This URL is stored in `notification.data.topicRoute` and used in `sw.js handleClick` to navigate/focus the correct tab. The click handler in sw.js already works correctly — **do not change it**. The only requirement is that `routes.forSubscription(subscription)` continues to return a valid path; the route shapes `/:topic` and `/:baseUrl/:topic` must not be altered.

---

### PWA Manifest — Self-Hosted Context

The web app manifest for production is served by the ntfy go-server at `/manifest.webmanifest` (see `vite.config.js` comment: "The actual prod manifest is served from the go server, see server.go handleWebManifest"). In the standalone Cloudflare Tunnel deployment, the go-server is co-located behind the Tunnel and serves the manifest at the same origin. No additional manifest file is needed from this story.

Verify installability manually:
- Desktop: Chrome DevTools → Application → Manifest → check for "Add to Chrome" option
- Android: Chrome → kebab menu → "Add to Home screen" (requires HTTPS)
- iOS: Safari → Share → "Add to Home Screen" (requires HTTPS; push notifications require `iosSupportedButInstallRequired` path per AC #6)

---

### i18n Keys

Add these to **both** `public/static/langs/en.json` and `public/static/langs/ko.json`:

| Key | English | Korean |
|---|---|---|
| `prefs_notifications_permission_title` | "Desktop notifications" | "브라우저 알림" |
| `prefs_notifications_permission_not_supported` | "Desktop notifications are not supported by this browser" | "이 브라우저는 데스크톱 알림을 지원하지 않아요" |
| `prefs_notifications_permission_context_not_supported` | "Notifications require a secure connection (HTTPS)" | "알림을 사용하려면 보안 연결(HTTPS)이 필요해요" |
| `prefs_notifications_permission_ios_install_required` | "Add to Home Screen to enable notifications on iOS" | "iOS에서 알림을 받으려면 홈 화면에 추가해 주세요" |
| `prefs_notifications_permission_not_requested_description` | "Receive alerts even when the tab is in the background" | "탭이 백그라운드에 있어도 알림을 받을 수 있어요" |
| `prefs_notifications_permission_grant_button` | "Grant permission" | "권한 허용" |
| `prefs_notifications_permission_granted` | "Active" | "활성화됨" |
| `prefs_notifications_permission_denied` | "Blocked — re-enable in your browser settings" | "차단됨 — 브라우저 설정에서 다시 허용해 주세요" |

Existing keys to **reuse** (already in `en.json`):
- `prefs_notifications_sound_title` / `_description_none` / `_description_some` / `_no_sound` / `_play`
- `prefs_notifications_min_priority_title` / `_description_any` / `_description_x_or_higher` / `_description_max`
- `prefs_notifications_min_priority_any` / `_low_and_higher` / `_default_and_higher` / `_high_and_higher` / `_max_only`

---

### File Locations

```
src/components/
└── Preferences.jsx              ← MODIFY: add 알림·소리 section (permission + sound + minPriority)
└── Preferences.test.jsx         ← CREATE: unit tests for permission state rendering

public/
└── sw.js                        ← MODIFY: NavigationRoute allowlist + mute gate in handlePushMessage

public/static/langs/
├── en.json                      ← MODIFY: add 8 new keys
└── ko.json                      ← MODIFY: add 8 new keys (Korean)
```

**Confirm: `Notifier.js` is in `src/app/Notifier.js`** — it is in the preserved logic layer. Import via `import notifier from "@/app/Notifier"` (the `@/` alias resolves to `./src/`).

---

### Layer Boundary Reminder

- `src/app/ → src/components/` import is **FORBIDDEN** (ESLint `no-restricted-paths`), except the explicitly allowed `Notifier.js → components/routes.js` seam.
- Importing `src/app/Notifier` from a component (`src/components/Preferences.jsx`) is correct and allowed — the boundary is one-way: app/ cannot import components/.
- Do NOT move any logic into the component; only call the existing `notifier.*` methods.

---

### Test Setup

Tests use Vitest + React Testing Library (already configured in `vite.config.js` `test` block with jsdom environment). Use `vi.mock` to mock `@/app/Notifier` so no real permission API is called. The `useNotificationPermissionListener` hook internally uses `navigator.permissions.query`; mock the notifier methods directly rather than the Permissions API for simplicity.

---

### Previously Deferred Work This Story Does NOT Need to Address

- `--leading-*` in fixed px (deferred to Story 5.3 a11y pass)
- Shadow tokens dark-mode (deferred for design review)
- Tailwind default color palette not purged (ESLint enforcement Story 5.4)

---

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Completion Notes List

- Implemented `NotificationPermissionRow` as a named export in `SettingsPage.jsx` (exported for testability). Uses `useNotificationPermissionListener(() => notifier.granted())` as the reactive trigger; all 6 condition checks are synchronous reads in render body, evaluated in priority order as specified.
- "Grant permission" button calls `notifier.maybeRequestPermission()` directly in `onClick` — no async frame before the call, preserving user-gesture chain required by browsers.
- Sound play preview button added next to the sound `<SelectControl>` using the `Button` ghost variant; disabled when `sound === "none"`.
- Sound and min-priority rows were already present from Story 5.1; only the play preview button was missing.
- `sw.js` NavigationRoute: removed `$` anchor from `new RegExp('^${config.app_root}$')` → `new RegExp('^${config.app_root}')` so offline navigation to `/:topic` / `/:baseUrl/:topic` routes is served from cache.
- `sw.js` mute gate: added `if (subscription.mutedUntil > 0) { return; }` immediately after subscription lookup in `handlePushMessage`, before `showNotification`.
- 8 new `prefs_notifications_permission_*` i18n keys added to both `en.json` and `ko.json`.
- 7 unit tests in `SettingsPage.test.jsx` covering all permission states and the click handler; all 367 tests pass.

### File List

- `src/components/SettingsPage.jsx` — added `NotificationPermissionRow` (exported), imported `notifier`, `useNotificationPermissionListener`, `playSound`, `Button`; added sound play preview button
- `src/components/SettingsPage.test.jsx` — NEW: 7 unit tests for permission row states
- `public/sw.js` — NavigationRoute `$` anchor removed; mute gate added to `handlePushMessage`
- `public/static/langs/en.json` — 8 new `prefs_notifications_permission_*` keys
- `public/static/langs/ko.json` — 8 new `prefs_notifications_permission_*` keys (Korean)

### Change Log

- feat(5-2): notification permission row in SettingsPage 알림·소리 section (Date: 2026-06-20)
- fix(5-2): sw.js NavigationRoute prefix match for offline SPA routing (Date: 2026-06-20)
- fix(5-2): sw.js mute gate in handlePushMessage for web push path (Date: 2026-06-20)
- i18n(5-2): 8 new permission keys in en.json + ko.json (Date: 2026-06-20)

## Completion Notes

Implemented Story 5.2: PWA browser notification permission row in the 알림·소리 settings section. All 6 AC permission states covered, reactive via `useNotificationPermissionListener`. SW offline routing and mute gate fixed. 7 tests added, 367 total pass.
