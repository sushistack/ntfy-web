---
baseline_commit: efdde3dd6681d5b6e2e7c900d48cd28386e7faf3
---

# Story 3.7: Inline Action Buttons (view / http / broadcast)

Status: review

## Story

As Jay,
I want to run a notification's action buttons in place,
so that I can respond without leaving the feed (FR10).

## Acceptance Criteria

1. **Given** a notification has up to 3 ntfy action buttons, **when** the card or detail pane renders, **then** an action row appears below the body (separated by a top divider), with the first button as Primary and subsequent buttons as Ghost (UX-DR6 achromatic system).

2. **Given** Jay taps a `view` action button, **then** the URL opens (via `openUrl()` from `src/app/utils.js`); if `action.clear` is true, the notification is also marked read.

3. **Given** Jay taps an `http` action button, **then** the request fires inline (method, url, headers, body from the action object); the button shows a loading suffix during the request; on success the button shows a success indicator; never navigates away.

4. **Given** the `http` request fails (network error or non-2xx status), **then** the button transforms to show "실패 — 재시도" and tapping it retries the request in place — never a full-screen dead end.

5. **Given** a `broadcast` action button, **then** it renders disabled with a tooltip explaining web does not support this action type.

6. **Given** a notification with 0 action buttons (`notification.actions` is empty/falsy), **then** the action row is not rendered at all (no divider, no empty space).

7. **All** button labels and aria attributes use `t()` keys; no hardcoded user-facing strings.

8. **All** button styles use token-based Tailwind classes only — no raw hex or px values (per project invariant).

## Tasks / Subtasks

- [x] Create `src/components/message/NotificationActions.jsx` (AC: 1, 2, 3, 4, 5, 6, 7, 8)
  - [x] Render nothing when `notification.actions` is falsy or empty
  - [x] Map each action to a `NotificationAction` sub-component by type
  - [x] Implement `view` handler: `openUrl(action.url)` + optional `clearNotification`
  - [x] Implement `http` handler: `fetch()` with progress state (idle→ongoing→success/failed)
  - [x] Implement `broadcast` as disabled button + `<Tooltip>` explaining web limit
  - [x] Wire `error` slot from `NotificationCard` props for failed-action inline error

- [x] Create `src/components/message/NotificationActions.test.jsx` (AC: 1–8)
  - [x] Renders nothing when actions is empty
  - [x] Renders correct count of action buttons for a 3-action notification
  - [x] `view` button calls `openUrl` on click
  - [x] `http` button fires fetch and shows loading/success/failure states
  - [x] `broadcast` button renders disabled
  - [x] Failed HTTP shows "실패 — 재시도" and retry fires again

- [x] Wire `NotificationActions` into the card via the `body` slot (AC: 1)
  - [x] Feed.jsx (story 3-3) or whatever renders NotificationCard passes `<NotificationActions .../>` as the `body` prop or appended after body content
  - [x] The `error` state from `NotificationActions` flows into the card's `error` prop slot

- [x] Wire `NotificationActions` into `DetailPane.jsx` (story 3-6 surface) (AC: 3, 4)
  - [x] Add action row at the bottom of the detail pane content

- [x] Add i18n keys to `public/static/langs/ko.json` and `public/static/langs/en.json` (AC: 7)
  - [x] `notification_action_broadcast_not_supported`
  - [x] `notification_action_failed_retry_label`
  - [x] `notification_action_view_aria_label`
  - [x] `notification_action_http_aria_label`

- [x] Update `src/config/migration.js` if needed to gate the new action bar rendering

## Dev Notes

### Critical: What NOT to use from existing code

| Trap | What to do instead |
| ---- | ------------------ |
| `maybeActionErrors(notification)` in `src/app/utils.js:102` | **Do not call.** It reads `action.error` from persisted Dexie rows — we no longer persist action status to Dexie. Use local `useState` for status. |
| `subscriptionManager.updateNotification` for progress | **Do not call.** Used in old `updateActionStatus` to persist action progress. New implementation keeps status in local component state only. |
| `Api.js` | **Do not use.** Despite the epics' "wiring to Api.js" note, HTTP actions fire via raw `fetch()`, not `Api.js` (which handles polling and publishing, not action button requests). Existing `Notifications.jsx:522` confirms this. |

### Migration flag note

`src/config/migration.js` already has `feed: false` and `detail: false` flags. NotificationActions renders inside those flag-gated paths — **no new flag is needed**. The action buttons appear whenever `notification.actions` is non-empty, gated by whichever parent component (Feed or DetailPane) checks `NEW.feed` / `NEW.detail`.

---

### New File: `src/components/message/NotificationActions.jsx`

This is the ONLY new component for this story. The architecture refers to it as `ActionBar.jsx (rebuilt)`, but since `src/components/ActionBar.jsx` currently holds the MUI **app top bar** (topic title, mute icon, overflow menu), naming the new component `NotificationActions.jsx` inside `message/` avoids a collision. This file is domain-aware (knows ntfy action types) so it belongs in `src/components/message/`, not `src/components/ui/`.

#### Component structure

```jsx
// NotificationActions.jsx
export function NotificationActions({ notification, onError }) {
  // onError(node | null) — lifts error JSX to the parent's card error slot
  ...
}
```

`onError` is a callback the parent passes in order to populate the `error` slot on `NotificationCard`. When an http action fails, call `onError(<span>{t("notification_action_failed_retry_label")}</span>)`. When the user retries and succeeds, call `onError(null)` to clear it.

#### Per-action status state shape

Use local `useState` — do NOT write action progress to Dexie (no `subscriptionManager.updateNotification` for in-flight state). This aligns with the architecture's "optimistic + revert-on-failure, no queue, no ledger" rule for action buttons.

```js
// Per-action local state:
const [statuses, setStatuses] = useState({}); // { [action.id]: "idle" | "ongoing" | "success" | "failed" }
```

#### `performHttpAction` logic (ported from Notifications.jsx:522)

```js
const performHttpAction = async (actionId, action) => {
  setStatuses(s => ({ ...s, [actionId]: "ongoing" }));
  try {
    const response = await fetch(action.url, {
      method: action.method ?? "POST",
      headers: action.headers ?? {},
      body: action.body,   // must NOT null-coalesce — null body is valid for GET/DELETE
    });
    if (response.ok) {
      setStatuses(s => ({ ...s, [actionId]: "success" }));
      onError?.(null);
      if (action.clear) await clearNotification(notification);
    } else {
      setStatuses(s => ({ ...s, [actionId]: "failed" }));
      onError?.(<span className="text-caption text-muted">{t("notification_action_failed_retry_label")}</span>);
    }
  } catch {
    setStatuses(s => ({ ...s, [actionId]: "failed" }));
    onError?.(<span className="text-caption text-muted">{t("notification_action_failed_retry_label")}</span>);
  }
};
```

#### `ACTION_COPY` — silently skip

`ACTION_COPY` is handled by the overflow menu (story 3-4), not the inline action row. If a notification's actions array contains a copy action, **do not render it** in `NotificationActions`. Return `null` for that entry (or filter it before the map):

```js
if (action.action === ACTION_COPY) return null;
```

#### Disabled button tooltip — wrapper required

Disabled `<button>` elements do not fire pointer events, so `<Tooltip>` won't show. Wrap the disabled button in a `<span>` so the tooltip fires on the wrapper:

```jsx
// Broadcast — disabled on web
<Tooltip content={t("notification_action_broadcast_not_supported")}>
  <span>
    <Button disabled variant="ghost" size="sm">{action.label}</Button>
  </span>
</Tooltip>
```

#### DetailPane.jsx placement (story 3-6 surface)

When wiring into `DetailPane.jsx` (created by story 3-6), the action row goes **after** all content (body, attachment, metadata), at the bottom before the pane's close/back control. Example:

```jsx
// In DetailPane.jsx (add after story 3-6 content sections)
{notification.actions?.length > 0 && (
  <NotificationActions notification={notification} onError={setActionError} />
)}
```

#### `clearNotification` (ported from Notifications.jsx:513)

```js
const clearNotification = async (notification) => {
  const subscription = await subscriptionManager.get(notification.subscriptionId);
  if (subscription) await notifier.cancel(subscription, notification);
  await subscriptionManager.markNotificationRead(notification.id);
};
```

Import `subscriptionManager` and `notifier` from the same paths as `Notifications.jsx` does today.

#### UX-DR6 Button rendering

```jsx
// First action = Primary; subsequent = Ghost
const variant = index === 0 ? "primary" : "ghost";
<Button key={action.id} variant={variant} size="sm" onClick={...} aria-label={...}>
  {label}
</Button>
```

Use the `<Button>` primitive from `src/components/ui/Button.jsx` (story 1-6). Variants:
- `primary` → `bg-[var(--color-button-fill)] text-[var(--color-button-fill-text)] font-semibold rounded-[var(--rounded-sm)]`
- `ghost` → `bg-transparent border border-[var(--color-border)] text-muted rounded-[var(--rounded-sm)]`

Label suffixes for http actions (matching existing pattern):
- ongoing → `${action.label} …`
- success → `${action.label} ✔`
- failed → `t("notification_action_failed_retry_label")` (replaces the label entirely)

#### Action row layout

```jsx
{hasActions && (
  <>
    <div className="h-px bg-border mx-4" />
    <div className="flex flex-wrap gap-2 px-4 py-2">
      {notification.actions.map((action, i) => <NotificationAction ... index={i} />)}
    </div>
  </>
)}
```

### Wiring into NotificationCard (via body/error slots — G4 frozen)

The `NotificationCard` signature is **frozen** (G4, story 3-1). Do NOT add props to it. Instead:
- Pass `NotificationActions` content as part of `body` (rendered at end of body section)
- Pass error node as the `error` prop via the parent's state

Pattern in the parent (e.g., `CardBody.jsx` or the Feed card renderer):

```jsx
const [actionError, setActionError] = useState(null);

<NotificationCard
  ...
  body={
    <>
      {/* story 3-2 body content */}
      <NotificationActions notification={notification} onError={setActionError} />
    </>
  }
  error={actionError}
/>
```

### Files to Read Before Implementing

| File | Why |
|------|-----|
| `src/components/Notifications.jsx:488–622` | Contains the FULL existing UserActions / UserAction / performHttpAction / updateActionStatus / clearNotification logic. Port the core logic; drop the MUI Button/Tooltip wrappers. |
| `src/app/actions.js` | `ACTION_VIEW`, `ACTION_HTTP`, `ACTION_BROADCAST`, `ACTION_COPY` constants |
| `src/app/utils.js:211` | `openUrl(url)` function |
| `src/components/message/NotificationCard.jsx` | Confirm G4 slot contract — `body`, `pending`, `error` rendered in order |
| `src/components/ui/Button.jsx` | Available variants and size props |
| `src/components/ui/Tooltip.jsx` | For broadcast "not supported" tooltip |

### Dependencies Status

| Dep | Story | Status | Impact |
|-----|-------|--------|--------|
| 1.6 Button | src/components/ui/Button.jsx | done | Import and use |
| 3.1 Error slot | NotificationCard error prop | ready-for-dev | Slot exists in frozen signature |
| 3.6 DetailPane | DetailPane.jsx | backlog | Wire action row into detail pane when 3-6 is done; if implementing before 3-6 is merged, stub the DetailPane wiring as a TODO comment |

### i18n Keys to Add

```json
// ko.json
"notification_action_broadcast_not_supported": "브로드캐스트 동작은 웹에서 지원되지 않습니다",
"notification_action_failed_retry_label": "실패 — 재시도",
"notification_action_view_aria_label": "URL 열기: {{url}}",
"notification_action_http_aria_label": "HTTP 요청: {{method}} {{url}}"
```

```json
// en.json
"notification_action_broadcast_not_supported": "Broadcast actions are not supported on web",
"notification_action_failed_retry_label": "Failed — Retry",
"notification_action_view_aria_label": "Open URL: {{url}}",
"notification_action_http_aria_label": "HTTP request: {{method}} {{url}}"
```

### Key Invariants (from project-context.md)

- **No hardcoded strings** — `t("snake_case_key")`, including all aria-label/title attributes
- **Tokens only** — Tailwind classes resolving to `@theme` tokens or `var(--token)`. No raw hex/px.
- **`ui/` may not import `message/`** — this component lives in `message/` and imports from `ui/`, never the reverse
- **`useLiveQuery` returns `undefined` on first render** — guard `notification.actions ?? []` before `.map()`
- **No MUI** — use `src/components/ui/Button.jsx` and `src/components/ui/Tooltip.jsx` only
- **body: null-coalesce for fetch** — `body: action.body` (NOT `action.body ?? ""`) since non-null-ish value causes fetch to reject GET/DELETE

### Testing Pattern

Follow story 3-1's established Vitest + RTL pattern:

```jsx
// NotificationActions.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { NotificationActions } from "./NotificationActions";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k) => k }),
}));

// Mock openUrl
vi.mock("@/app/utils", () => ({ openUrl: vi.fn() }));
```

**Required test cases:**
1. Renders nothing when `notification.actions` is empty
2. Renders 3 buttons for a 3-action notification; first = primary variant, others = ghost
3. `view` button: clicking calls `openUrl` with action.url
4. `http` button: clicking triggers fetch; button shows loading state; on success shows `✔`
5. `http` button: on fetch rejection, button label becomes `notification_action_failed_retry_label`; clicking again re-fires fetch
6. `broadcast` button: renders as disabled; shows tooltip on hover

### Project Structure Notes

- `src/components/message/NotificationActions.jsx` — **NEW** (domain-aware; knows ntfy action types)
- `src/components/message/NotificationActions.test.jsx` — **NEW**
- `src/components/ActionBar.jsx` — **do NOT modify**; this is the MUI app top navigation bar, still used by `App.jsx` until its migration story removes it
- `src/app/actions.js` — **read-only reference** for constants
- `public/static/langs/ko.json` — **UPDATE** (add 4 keys)
- `public/static/langs/en.json` — **UPDATE** (add 4 keys)
- `DetailPane.jsx` (story 3-6 output) — **UPDATE** when 3-6 is available; add action row at bottom

### References

- Existing UserActions/UserAction/performHttpAction logic: [src/components/Notifications.jsx:488-622](src/components/Notifications.jsx#L488-L622)
- Action type constants: [src/app/actions.js](src/app/actions.js)
- `openUrl` utility: [src/app/utils.js:211](src/app/utils.js#L211)
- `copyToClipboard` utility: [src/app/utils.js:389](src/app/utils.js#L389)
- `subscriptionManager.updateNotification`: [src/app/SubscriptionManager.js:217](src/app/SubscriptionManager.js#L217)
- Frozen NotificationCard slot contract (G4): [_bmad-output/implementation-artifacts/3-1-notification-card-shell-slot-contract.md](_bmad-output/implementation-artifacts/3-1-notification-card-shell-slot-contract.md)
- UX-DR6 achromatic button system: [_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/DESIGN.md](_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/DESIGN.md)
- Action row in EXPERIENCE.md: [_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/EXPERIENCE.md](_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/EXPERIENCE.md)
- Architecture SC3 mapping: [_bmad-output/planning-artifacts/architecture.md](_bmad-output/planning-artifacts/architecture.md)
- Project invariants: [_bmad-output/project-context.md](_bmad-output/project-context.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Created `NotificationActions` component with per-action local state (idle→ongoing→success→failed), no Dexie writes
- `clearNotification` ported from `Notifications.jsx:513` — calls `subscriptionManager.get` + `notifier.cancel` + `markNotificationRead`
- `ACTION_COPY` filtered from inline row (handled by overflow menu story 3-4)
- Broadcast button wrapped in `<span>` to allow tooltip on disabled element
- Wired `FeedCard` wrapper in `Feed.jsx` to manage per-card `actionError` state (avoids useState in map)
- `CardBody` also wired into Feed via the same `FeedCard` body slot (previously unwired)
- `DetailPane.jsx` updated: `NotificationActions` added before meta row; `actionError` rendered below it
- 4 i18n keys added to both `en.json` and `ko.json`
- `migration.js`: no new flag needed — actions render inside existing `NEW.feed`/`NEW.detail` flag-gated paths
- 19 new tests pass; 317 total, zero regressions

### File List

- `src/components/message/NotificationActions.jsx` (NEW)
- `src/components/message/NotificationActions.test.jsx` (NEW)
- `src/components/Feed.jsx` (MODIFIED — FeedCard wrapper; wired CardBody + NotificationActions)
- `src/components/DetailPane.jsx` (MODIFIED — wired NotificationActions + actionError state)
- `public/static/langs/en.json` (MODIFIED — 4 new keys)
- `public/static/langs/ko.json` (MODIFIED — 4 new keys)

## Change Log

- 2026-06-20: Implemented NotificationActions component with view/http/broadcast handlers, 19 tests, wired into Feed.jsx and DetailPane.jsx, added 4 i18n keys (en + ko)
