---
baseline_commit: ba9eb29
---

# Story 2.5: Subscribe to a Topic

Status: review

## Story

As Jay,
I want to subscribe to a topic by name,
so that I start receiving its messages (FR2).

`Depends-on:` 1.7 (Dialog/Sheet primitives ✅ exist), 2.3 (ConnectionContext — story file created, may be in-progress).

**Touched files:**

| File | Action |
|---|---|
| `src/components/SubscribeDialog.jsx` | **REBUILD** — strip MUI/Account/reserve; use `ui/Dialog` (desktop) + `ui/Sheet` (mobile) |
| `public/static/langs/ko.json` | **UPDATE** — add missing subscribe i18n keys (see Dev Notes) |

**Do NOT touch:**
- `src/app/` (logic layer — ESLint-enforced boundary)
- `src/components/ui/` files (owned by E1 stories)
- `src/styles/tokens.css` / `src/styles/main.css`
- Any other MUI component files (coexistence until Story 5.4)

---

## Acceptance Criteria

1. **Given** a connected server (or any state),
   **When** Jay opens the subscribe dialog — via the Sidebar "＋토픽" button (Story 2.1) or the no-subscriptions CTA (Story 2.6) —
   **Then** on desktop (≥ `md` / 768px) it renders as a centered `ui/Dialog`; on mobile (< `md`) it renders as a `ui/Sheet` (bottom sheet, `side="bottom"`).

2. **When** the dialog/sheet renders,
   **Then** the topic name field is required and auto-focused, the server field is pre-filled with `config.base_url` and read-only by default, and "Use another server" is a toggleable option (for multi-server use); auth field is never shown upfront.
   **And** a "무작위 이름 생성" button generates a random alphanumeric topic name via `randomAlphanumericString(16)` from `src/app/utils.js`.

3. **When** Jay submits a valid topic name (no existing topic at that URL),
   **Then** `api.topicAuth` is called first to verify access; if the topic is public or Jay has credentials, `subscriptionManager.add(baseUrl, topic, {})` runs; `poller.pollInBackground(subscription)` is called (dangling — intentional); the dialog/sheet closes; the app navigates to `routes.forSubscription(subscription)`; and the topic appears in the sidebar (driven by Dexie → `useLiveQuery` in Sidebar — no direct callback needed for sidebar update).

4. **Given** `api.topicAuth` returns false and no user is stored for that baseUrl,
   **When** Jay submits,
   **Then** the dialog/sheet switches to a `LoginPage` sub-view asking for username + password; on successful login, credentials are saved via `userManager.save(user)` and the subscribe flow resumes.
   **And** on failed login, an inline error message shows: `t("subscribe_dialog_error_user_not_authorized", { username })`.

5. **And** the dialog/sheet traps focus, restores focus to the trigger element on close, and closes on `Esc` — inherited from the `ui/Dialog` / `ui/Sheet` Radix primitives; no custom focus management needed.

6. **And** all user-facing strings route through `t()` — no hardcoded Korean or English text (NFR8, ESLint `no-literal-string`).

7. **And** the submit button is disabled when: topic is empty, topic fails `validTopic()`, the topic URL already exists in `subscriptions`, or (when "another server" is visible) the URL fails `validUrl()`.

---

## Tasks / Subtasks

- [x] Task 0: Verify prerequisites (AC: all)
  - [x] Confirm `src/components/ui/Dialog.jsx` exports `Dialog`, `DialogContent`, `DialogTrigger`, `DialogClose` ✅ (confirmed in analysis)
  - [x] Confirm `src/components/ui/Sheet.jsx` exports `Sheet`, `SheetContent`, `SheetTrigger`, `SheetClose` ✅
  - [x] Confirm `src/styles/tokens.css` `@theme` block exists ✅
  - [x] If anything is missing, **STOP** and report — do not stub

- [x] Task 1: Rebuild `src/components/SubscribeDialog.jsx` — component skeleton (AC: #1, #5)
  - [x] Add `useIsMobile()` helper inside the file (see Dev Notes for implementation)
  - [x] Main `SubscribeDialog` component accepts props: `open: bool`, `onSuccess: (subscription) => void`, `onCancel: () => void`, `subscriptions: array`
  - [x] Based on `isMobile`: render `<Sheet open={open}>` with `<SheetContent side="bottom">` OR `<Dialog open={open}>` with `<DialogContent title={t("subscribe_dialog_subscribe_title")}>`
  - [x] State: `baseUrl`, `topic`, `showLoginPage` — same shape as old component
  - [x] Wire `onOpenChange` on both Dialog and Sheet to call `props.onCancel` when closed externally

- [x] Task 2: Build `SubscribePage` sub-component — simplified (AC: #2, #6, #7)
  - [x] Topic name input: `<input autoFocus>` wrapped in a label, `onChange` calls `setTopic`; `maxLength={64}`; `placeholder={t("subscribe_dialog_subscribe_topic_placeholder")}` (existing key)
  - [x] Random name button: `<Button variant="ghost" size="sm">` calls `setTopic(randomAlphanumericString(16))` from `src/app/utils.js`; label via `t("subscribe_dialog_subscribe_button_generate_topic_name")` — **ADD this key** (see Dev Notes)
  - [x] "Use another server" toggle: `<ui/Switch>` with label `t("subscribe_dialog_subscribe_use_another_label")`; when enabled, shows a free-text `<input>` for baseUrl
  - [x] Inline error display below the form fields for validation errors
  - [x] Submit button: `<Button>` disabled when `!subscribeButtonEnabled` (see Dev Notes for logic); label `t("subscribe_dialog_subscribe_button_subscribe")`
  - [x] Cancel button: `<Button variant="ghost">` calls `props.onCancel`; label `t("subscribe_dialog_subscribe_button_cancel")`
  - [x] **REMOVE**: AccountContext, accountApi, ReserveTopicSelect, ReserveLimitChip, webPushEnabled — these are trimmed features

- [x] Task 3: Build `LoginPage` sub-component — for protected topics (AC: #4, #6)
  - [x] Username `<input>` + password `<input type="password">`, both required
  - [x] Back button → `setShowLoginPage(false)` (returns to SubscribePage), label `t("common_back")` (existing key)
  - [x] Login button: calls `api.topicAuth(baseUrl, topic, { baseUrl, username, password })`; on success, calls `userManager.save(user)` then `props.onSuccess()`; on failure, sets inline error
  - [x] Title: `t("subscribe_dialog_login_title")`; description: `t("subscribe_dialog_login_description")`

- [x] Task 4: Wire `subscribeTopic` helper + `handleSuccess` (AC: #3)
  - [x] Export `subscribeTopic` as a named export (callers like `Navigation.jsx` and future E4 will import it):
    ```js
    export const subscribeTopic = async (baseUrl, topic, opts) => {
      return await subscriptionManager.add(baseUrl, topic, opts);
      // NOTE: accountApi.addSubscription removed — feature trimmed (no account management)
    };
    ```
  - [x] `handleSuccess` inside the component:
    ```js
    const handleSuccess = async () => {
      const actualBaseUrl = baseUrl || config.base_url;
      const subscription = await subscribeTopic(actualBaseUrl, topic, {});
      poller.pollInBackground(subscription); // dangling — intentional, starts background poll
      props.onSuccess(subscription);
    };
    ```
  - [x] The CALLER (Sidebar or EmptyStates) is responsible for navigating after `onSuccess` — this component does not call `navigate()` directly (see Dev Notes)

- [x] Task 5: Handle `handleSubscribe` auth check (AC: #3, #4)
  - [x] Call `api.topicAuth(baseUrl, topic, user)` where `user = await userManager.get(baseUrl)` (may be undefined for anonymous)
  - [x] If success → call `handleSuccess()`
  - [x] If fail AND user exists → show inline error `t("subscribe_dialog_error_user_not_authorized", { username: user.username })`
  - [x] If fail AND no user → `setShowLoginPage(true)` (switch to LoginPage)

- [x] Task 6: Add missing i18n keys to `public/static/langs/ko.json` (AC: #6)
  - [x] `"subscribe_dialog_subscribe_button_generate_topic_name"` → `"무작위 이름 생성"` (currently missing)
  - [x] Confirm all other existing keys remain intact (do not remove any `subscribe_dialog_*` keys)
  - [x] Do NOT add an `en.json` entry in this story (Korean-only target, per NFR8 + project scope)

---

## Dev Notes

### CRITICAL: What to STRIP vs KEEP from the existing SubscribeDialog.jsx

The existing `src/components/SubscribeDialog.jsx` has features that are TRIMMED for Jay's single-user setup:

| Feature | Existing code | Decision |
|---|---|---|
| `AccountContext` / `AccountApi` | `useContext(AccountContext)`, `accountApi.addSubscription` | **REMOVE** — account management is trimmed (FR19) |
| Reserve topic | `ReserveTopicSelect`, `ReserveLimitChip`, `reserveTopicVisible` | **REMOVE** — reserved topics are trimmed |
| `session.exists()` checks | `if (session.exists())` guard | **REMOVE** — no session/account management |
| `webPushEnabled` prefs check | `const webPushEnabled = useLiveQuery(...)` | **REMOVE** — E5 concern |
| `topicAuth` check + `LoginPage` | `api.topicAuth(baseUrl, topic, user)` | **KEEP** — protected topics still need auth |
| `userManager.get/save` | credential storage | **KEEP** — private topic support |
| `subscriptionManager.add` | core subscribe call | **KEEP** |
| `poller.pollInBackground` | triggers initial poll | **KEEP** (dangling is intentional) |
| `validTopic`, `validUrl` | from `src/app/utils.js` | **KEEP** |
| `randomAlphanumericString(16)` | from `src/app/utils.js` | **KEEP** |
| "Use another server" toggle | `anotherServerVisible` state | **KEEP** (simplified, no Autocomplete) |

### Mobile Detection — Custom `useIsMobile` Hook

MUI's `useMediaQuery(theme.breakpoints.down("sm"))` is gone. Use a simple hook **defined in the same file** (not in `ui/`):

```jsx
// At the top of SubscribeDialog.jsx (not exported, local use only)
const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < 768);
  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};
```

768px is the Tailwind `md` breakpoint used throughout the project. Desktop ≥ 768px → `Dialog`; mobile < 768px → `Sheet` (bottom).

### Dialog vs Sheet Rendering

Render mutually exclusively based on `isMobile`:

```jsx
const SubscribeDialog = (props) => {
  const isMobile = useIsMobile();
  const [baseUrl, setBaseUrl] = React.useState("");
  const [topic, setTopic] = React.useState("");
  const [showLoginPage, setShowLoginPage] = React.useState(false);

  const content = !showLoginPage ? (
    <SubscribePage ... />
  ) : (
    <LoginPage ... />
  );

  if (isMobile) {
    return (
      <Sheet open={props.open} onOpenChange={(open) => !open && props.onCancel()}>
        <SheetContent side="bottom">
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={props.open} onOpenChange={(open) => !open && props.onCancel()}>
      <DialogContent title={t("subscribe_dialog_subscribe_title")}>
        {content}
      </DialogContent>
    </Dialog>
  );
};
```

Note: `DialogContent` already renders the title in a `<Dialog.Title>`. For `SheetContent`, add the title manually inside as a `<h2>` or use the same title-prop pattern if you extend `SheetContent`.

### Who Navigates After Subscribe

`SubscribeDialog` does NOT call `useNavigate()` directly. It calls `props.onSuccess(subscription)` and the CALLER navigates. The two callers:

1. **Sidebar.jsx** (Story 2.1) — will navigate to `routes.forSubscription(subscription)` in its `handleSuccess` handler
2. **EmptyStates.jsx** (Story 2.6) — same pattern

This keeps the dialog decoupled from routing. If a Story 2.1 or 2.6 `onSuccess` handler is not yet implemented, use `console.log` as a placeholder — do NOT add routing logic inside the dialog itself.

### Sidebar Update After Subscribe is Automatic

After `subscriptionManager.add(...)` writes to Dexie, **the sidebar updates automatically** via `useLiveQuery` in the Sidebar component (Story 2.1). No manual callback is needed to "update the sidebar list." The topic appears because Dexie is the source of truth.

### `subscribeButtonEnabled` Derivation

```js
const subscribeButtonEnabled = (() => {
  const effectiveBaseUrl = anotherServerVisible ? baseUrl : config.base_url;
  const topicUrlStr = topicUrl(effectiveBaseUrl, topic);
  const existingTopicUrls = props.subscriptions.map((s) => topicUrl(s.baseUrl, s.topic));
  const isExisting = existingTopicUrls.includes(topicUrlStr);

  if (anotherServerVisible) {
    return validTopic(topic) && validUrl(baseUrl) && !isExisting;
  }
  return validTopic(topic) && !isExisting;
})();
```

All three utilities (`validTopic`, `validUrl`, `topicUrl`) are from `src/app/utils.js` — already imported.

### i18n Keys Reference

Existing keys in `ko.json` (verified — do not re-add, do not change):
- `subscribe_dialog_subscribe_title` → "주제 구독하기"
- `subscribe_dialog_subscribe_description` → (long description about topic naming)
- `subscribe_dialog_subscribe_topic_placeholder` → "주제 이름, 예를 들면 phil_alerts"
- `subscribe_dialog_subscribe_use_another_label` → "다른 서버 사용"
- `subscribe_dialog_subscribe_base_url_label` → "서비스 URL"
- `subscribe_dialog_subscribe_button_cancel` → "취소"
- `subscribe_dialog_subscribe_button_subscribe` → "구독하기"
- `subscribe_dialog_login_title` → "로그인 필요함"
- `subscribe_dialog_login_description` → (long description about protected topic)
- `subscribe_dialog_login_username_label` → "사용자 이름, 예를 들면 phil"
- `subscribe_dialog_login_password_label` → "비밀번호"
- `subscribe_dialog_login_button_login` → "로그인"
- `subscribe_dialog_error_user_anonymous` → "익명"
- `subscribe_dialog_error_user_not_authorized` → "사용자 {{username}} 은(는) 인증되지 않았습니다"
- `common_back` → "뒤로가기"

**Missing — must add:**
- `subscribe_dialog_subscribe_button_generate_topic_name` → `"무작위 이름 생성"`

**Drop the web-push background info key** — `subscribe_dialog_subscribe_use_another_background_info` is not used in the rebuild (web push permission is E5).

### Styling Guidelines

Use `ui/Button`, `ui/Switch` primitives. For text inputs, use a styled `<input>` directly (no MUI TextField):

```jsx
<input
  autoFocus
  type="text"
  maxLength={64}
  placeholder={t("subscribe_dialog_subscribe_topic_placeholder")}
  value={topic}
  onChange={(e) => setTopic(e.target.value)}
  className="w-full bg-transparent border-b border-border py-1 text-body text-text focus:outline-none focus:border-accent-ui"
  aria-label={t("subscribe_dialog_subscribe_topic_placeholder")}
/>
```

**No raw hex or arbitrary px** — token classes only (`border-border`, `text-text`, `text-body`, `focus:border-accent-ui`).

Button layout: `<div className="flex justify-end gap-2 mt-4">` for the footer row with cancel + subscribe buttons.

Error display: `{error && <p className="text-caption text-priority-urgent mt-2">{error}</p>}` (reuse the existing `priority-urgent` token for error color — coral).

### Architectural Boundaries (ENFORCE)

- `SubscribeDialog.jsx` is in `src/components/` (screen-level) — NOT in `ui/` or `message/`
- Imports from `src/app/`: `api`, `userManager`, `subscriptionManager`, `poller`, `config`, `utils` — ALL ALLOWED
- `useTranslation` from `react-i18next` — ALLOWED
- `useLiveQuery` — **NOT NEEDED** here (topics list is passed as `props.subscriptions`); if needed, do NOT import in this file (use as prop)
- Do NOT import `AccountContext`, `accountApi`, `session`, `AccountApi`, `ReserveDialogs` — removed features

### Previous Story Pattern Reference (Story 2.3)

Story 2.3's dev notes show the pattern for co-locating a component with its helper logic. Follow the same approach: keep `useIsMobile`, `subscribeTopic`, `SubscribePage`, and `LoginPage` all in `SubscribeDialog.jsx` as private functions/exports. This is consistent with the original file structure.

### File Locations

| File | Location | Notes |
|---|---|---|
| `SubscribeDialog.jsx` | `src/components/SubscribeDialog.jsx` | REBUILD in place — same path |
| `ko.json` | `public/static/langs/ko.json` | ADD `subscribe_dialog_subscribe_button_generate_topic_name` |

### Dependencies Status

- **Story 1.7** (`ui/Dialog.jsx`, `ui/Sheet.jsx`) — ✅ confirmed existing at `src/components/ui/`
- **Story 1.6** (`ui/Button.jsx`, `ui/Switch.jsx`) — ✅ confirmed existing
- **Story 2.1** (Sidebar "＋토픽" trigger) — must exist before this dialog can be triggered from the new shell
- **Story 2.3** (ConnectionContext) — ready-for-dev; no hard dependency at code level, but the dialog UX assumes a connection indicator is visible

### No Tests Required in This Story

The acceptance criteria for this story are UI integration behaviors (dialog open/close, form validation, auth check). Unit-testable logic (`subscribeButtonEnabled` derivation) is simple enough that a test would be redundant overhead. No test file needed.

If future review requires it, `SubscribeDialog.test.jsx` co-located with the component is the correct location.

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Rebuilt `src/components/SubscribeDialog.jsx` — stripped all MUI/AccountContext/session/reserve-topic/webPush; uses `ui/Dialog` (desktop ≥768px) and `ui/Sheet` (mobile <768px) via `useIsMobile()` hook defined in-file.
- `dialogTitle` is derived dynamically (subscribe vs login) so both Dialog title prop and Sheet h2 stay in sync when switching views.
- `subscribeButtonEnabled` logic uses the spec derivation from Dev Notes exactly — guards on `validTopic`, `validUrl`, and existing topic deduplication.
- `handleSubscribe` in SubscribePage correctly computes `effectiveBaseUrl` regardless of `anotherServerVisible` state before calling `api.topicAuth`.
- `subscribeTopic` exported as named export with `accountApi.addSubscription` removed.
- Added `"subscribe_dialog_subscribe_button_generate_topic_name": "무작위 이름 생성"` to `public/static/langs/ko.json`.
- Build passes clean (`npm run build` ✅ — 12003 modules transformed, no errors).
- No tests required per story Dev Notes (UI integration behaviors; `subscribeButtonEnabled` logic is straightforward).

### File List

- `src/components/SubscribeDialog.jsx` — rebuilt (MUI→Tailwind+Radix, trimmed features removed)
- `public/static/langs/ko.json` — added `subscribe_dialog_subscribe_button_generate_topic_name`

### Change Log

- 2026-06-20: Story 2.5 implemented — SubscribeDialog rebuilt with Tailwind/Radix, missing i18n key added (claude-sonnet-4-6)
