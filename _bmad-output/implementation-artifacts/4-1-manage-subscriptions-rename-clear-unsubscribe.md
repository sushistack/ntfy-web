# Story 4.1: Manage Subscriptions — Rename / Clear / Unsubscribe

---
baseline_commit: efdde3dd6681d5b6e2e7c900d48cd28386e7faf3
---

Status: review

## Story

As Jay,
I want to rename, clear, or unsubscribe from a topic,
so that I keep my topic list tidy (FR9b).

## Acceptance Criteria

1. **Given** a subscribed topic in the sidebar,
   **when** Jay clicks/taps the ⋯ trigger button on a subscription row,
   **then** a `ui/Menu` (Radix DropdownMenu) opens with three actions: 이름 바꾸기 / 알림 모두 삭제 / 구독 해제; the menu is arrow-key navigable and closes on Esc (NFR3).

2. **Given** Jay selects "이름 바꾸기",
   **when** the rename `ui/Dialog` opens,
   **then** a text `<input>` is pre-filled with `sub.displayName ?? sub.topic`, accepts up to 64 characters, and on confirm calls `subscriptionManager.setDisplayName(sub.id, trimmedValue)` — after which the sidebar immediately shows the new name (Dexie live-query); the Dialog closes.

3. **Given** Jay selects "알림 모두 삭제",
   **when** the confirm `ui/Dialog` opens showing "이 토픽의 알림을 모두 삭제할까요?",
   **then** confirming calls `subscriptionManager.deleteNotifications(sub.id)` and closes; cancelling closes without action.

4. **Given** Jay selects "구독 해제",
   **when** the action fires immediately (no additional confirm),
   **then** `subscriptionManager.remove(subscription)` is called (removes the Dexie subscription row and all its notifications); if the unsubscribed topic was the currently viewed feed, navigate: `subscriptionManager.first()` → if non-`null` and not `internal` → `routes.forSubscription(next)`, otherwise → `routes.app` ("/").

5. **And** each subscription row shows `sub.displayName ?? sub.topic` (not raw `sub.topic`) so renamed topics display their custom name immediately after rename without a page reload.

6. **And** the active topic row is detected via `useActiveTopic()` from `hooks.js` — **do not** add a second `useLiveQuery` call for selection state or use `getTopicFromPath()` inside `SidebarContent` for active-row highlighting.

7. **And** all menu labels, Dialog titles, placeholder text, and button labels route through `t()` — no hardcoded user-facing strings (NFR8).

## Tasks / Subtasks

- [x] Task 1: Restructure subscription rows in `SidebarContent` to support inline context menu (AC: #1, #5, #6)
  - [x] Replace `const { pathname } = useLocation()` + `const topic = getTopicFromPath(pathname)` with `const activeSub = useActiveTopic()` (import from `@/components/hooks`)
  - [x] Change each row's `isActive` check: `sub.topic === topic` → `sub.topic === activeSub` (useActiveTopic returns the topic string, not a subscription object)
  - [x] Remove `useLocation` from the react-router-dom import in `Sidebar.jsx` (it is no longer used in `SidebarContent`; `getTopicFromPath` is a pure function that doesn't import it)
  - [x] **CRITICAL**: Do NOT remove `export const getTopicFromPath` — it is imported and used by `AppBar.jsx`
  - [x] Restructure each subscription `<button>` into a `<div>` wrapper that contains: (a) a navigation `<button>` for click-to-navigate, (b) mute toggle button (from story 4.2), and (c) a `Menu`-wrapped ⋯ trigger button
  - [x] Update display to `{sub.displayName ?? sub.topic}` for the subscription label
  - [x] Add inline `DotsHorizontalIcon` SVG (keep consistent with the pattern of inlining icons in `Sidebar.jsx` to avoid adding `@radix-ui/react-icons`)

- [x] Task 2: Implement the per-subscription context Menu and Dialogs (AC: #1–#4, #7)
  - [x] Add state at the top of `SidebarContent`: `const [renameSub, setRenameSub] = useState(null)`, `const [renameValue, setRenameValue] = useState("")`, `const [clearSub, setClearSub] = useState(null)`
  - [x] Inside the map: wrap the ⋯ trigger in `<Menu>/<MenuTrigger asChild>/<MenuContent>` with three `<MenuItem>` entries
  - [x] On "이름 바꾸기" `onSelect`: `setRenameSub(sub); setRenameValue(sub.displayName ?? sub.topic)`
  - [x] On "알림 모두 삭제" `onSelect`: `setClearSub(sub)`
  - [x] On "구독 해제" `onSelect`: call `handleUnsubscribe(sub)` (defined below)
  - [x] Add `handleRename` async fn: `await subscriptionManager.setDisplayName(renameSub.id, renameValue.trim()); setRenameSub(null)`
  - [x] Add `handleClearConfirm` async fn: `await subscriptionManager.deleteNotifications(clearSub.id); setClearSub(null)`
  - [x] Add `handleUnsubscribe` async fn: check if `sub.topic === activeSub`; call `await subscriptionManager.remove(sub)`; then navigate to `first()` or `routes.app`
  - [x] Render rename Dialog **outside** the `.map()` loop (after it), controlled by `renameSub !== null`
  - [x] Render clear confirm Dialog **outside** the `.map()` loop, controlled by `clearSub !== null`
  - [x] Rename Dialog: `<Dialog open={!!renameSub} onOpenChange={open => !open && setRenameSub(null)}>` containing an `<input>` and `<Button variant="ghost">` cancel + `<Button variant="primary">` save
  - [x] Clear Dialog: `<Dialog open={!!clearSub} onOpenChange={open => !open && setClearSub(null)}>` containing body text + `<Button variant="ghost">` cancel + `<Button variant="primary">` delete-all
  - [x] Add new i18n imports (strings only — `t()` is already available via `useTranslation`)

- [x] Task 3: Add i18n keys to `public/static/langs/ko.json` and `public/static/langs/en.json` (AC: #7)
  - [x] Ko: `"sub_menu_trigger_label"`: `"{{name}} 메뉴"`
  - [x] Ko: `"sub_menu_rename"`: `"이름 바꾸기"`
  - [x] Ko: `"sub_menu_clear"`: `"알림 모두 삭제"`
  - [x] Ko: `"sub_menu_unsubscribe"`: `"구독 해제"`
  - [x] Ko: `"sub_rename_dialog_title"`: `"토픽 이름 바꾸기"`
  - [x] Ko: `"sub_rename_dialog_placeholder"`: `"표시 이름"`
  - [x] Ko: `"sub_clear_confirm_body"`: `"이 토픽의 알림을 모두 삭제할까요?"`
  - [x] Ko: `"sub_clear_confirm_action"`: `"모두 삭제"`
  - [x] Reuse existing: `common_cancel`, `common_save` — **do NOT add duplicates**
  - [x] Add matching English keys to `en.json` (same key names, English copy)

- [x] Task 4: Write `src/components/Sidebar.test.jsx` (new file) (AC: #1–#7)
  - [x] Mock `subscriptionManager` singleton; mock `useActiveTopic` from `hooks.js`; mock `react-router-dom` navigate
  - [x] Test: clicking the ⋯ trigger opens the dropdown menu (menu content becomes visible)
  - [x] Test: selecting "이름 바꾸기" opens the rename Dialog with the current `displayName ?? topic` pre-filled
  - [x] Test: submitting rename calls `subscriptionManager.setDisplayName(id, value)` and closes Dialog
  - [x] Test: selecting "알림 모두 삭제" opens the clear confirm Dialog
  - [x] Test: confirming clear calls `subscriptionManager.deleteNotifications(id)` and closes Dialog
  - [x] Test: selecting "구독 해제" calls `subscriptionManager.remove(subscription)` and navigates away
  - [x] Test: `sub.displayName` is displayed in place of `sub.topic` when a custom name is set
  - [x] Test: active topic row has `bg-surface-2` class (isActive = true)

## Dev Notes

### Hard Prerequisites

| File | Story | Current State |
|---|---|---|
| `src/components/Sidebar.jsx` | 2.1 (done) | EXISTS — restructure subscription rows; do NOT rewrite the frame/outer Sidebar |
| `src/components/ui/Menu.jsx` | 1.7 (done) | EXISTS — `Menu`, `MenuTrigger`, `MenuContent`, `MenuItem`, `MenuSeparator` exports |
| `src/components/ui/Dialog.jsx` | 1.7 (done) | EXISTS — `Dialog`, `DialogContent`, `DialogClose` exports |
| `src/components/ui/Button.jsx` | 1.6 (done) | EXISTS — `Button` with `variant="primary"` and `variant="ghost"` |
| `src/components/hooks.js` | existing | EXISTS — `useActiveTopic()` exported (line 158); already returns `null` when no topic is active |
| `src/app/SubscriptionManager.js` | existing | EXISTS — `setDisplayName`, `deleteNotifications`, `remove`, `first` are all stable APIs |

---

### Critical: `getTopicFromPath` Must Stay Exported

`getTopicFromPath` is defined and exported in `Sidebar.jsx` (line 32) and imported by `AppBar.jsx` (line 4). Do **NOT** remove it, even though `SidebarContent` will stop using it internally.

```js
// AppBar.jsx — line 4 (do not break this)
import { getTopicFromPath } from "./Sidebar";
```

The fix: after switching `SidebarContent` to `useActiveTopic()`, remove only the internal usage of `getTopicFromPath` inside `SidebarContent`, not the export.

---

### Subscription Row Restructuring

Current (single button, invalid for nesting):
```jsx
<button key={sub.id} type="button" onClick={() => navigate(routes.forSubscription(sub))} className="...">
  <span className="dot indicator" />
  <BellIcon />
  <span>{sub.topic}</span>
  {sub.new > 0 && <span>{sub.new}</span>}
</button>
```

New (div wrapper → nav button + menu trigger side by side):
```jsx
<div key={sub.id} className={cn(
  "group relative flex items-center rounded-sm transition-colors",
  "hover:bg-surface",
  isActive && "bg-surface-2"
)}>
  {/* Navigation area — takes up all available space */}
  <button
    type="button"
    onClick={() => navigate(routes.forSubscription(sub))}
    className={cn(
      "flex flex-1 items-center gap-3 pl-3 py-2 min-w-0 text-left",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
    )}
  >
    <span
      className={cn(
        "flex-shrink-0 w-1 h-4 rounded-full",
        isActive ? "bg-accent-ui [box-shadow:var(--glow-accent-dot)]" : "bg-transparent"
      )}
      aria-hidden="true"
    />
    {collapsed ? (
      <BellIcon className={cn("flex-shrink-0", isActive ? "text-accent-text" : "text-muted")} />
    ) : (
      <>
        <BellIcon className={cn("flex-shrink-0", isActive ? "text-accent-text" : "text-muted")} />
        <span className="text-text text-body-sm truncate">{sub.displayName ?? sub.topic}</span>
        {sub.new > 0 && (
          <span className="ml-auto pr-1 text-caption font-medium text-accent-text">
            {sub.new <= 99 ? sub.new : "99+"}
          </span>
        )}
      </>
    )}
  </button>

  {/* Context menu — only show trigger when not collapsed */}
  {!collapsed && (
    <Menu>
      <MenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex-shrink-0 p-2 mr-1 rounded-sm text-muted",
            "hover:text-text hover:bg-surface-active",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]"
          )}
          aria-label={t("sub_menu_trigger_label", { name: sub.displayName ?? sub.topic })}
        >
          <DotsHorizontalIcon />
        </button>
      </MenuTrigger>
      <MenuContent align="start" side="right">
        <MenuItem onSelect={() => { setRenameSub(sub); setRenameValue(sub.displayName ?? sub.topic); }}>
          {t("sub_menu_rename")}
        </MenuItem>
        <MenuItem onSelect={() => setClearSub(sub)}>
          {t("sub_menu_clear")}
        </MenuItem>
        <MenuSeparator />
        <MenuItem onSelect={() => handleUnsubscribe(sub)}>
          {t("sub_menu_unsubscribe")}
        </MenuItem>
      </MenuContent>
    </Menu>
  )}
</div>
```

Note: The `collapsed` sidebar (tablet icon-rail mode) should NOT show the menu trigger — in collapsed mode the sidebar is too narrow. The per-subscription actions are only accessible in the expanded sidebar. This is acceptable UX: the sidebar must be expanded to manage subscriptions.

---

### Inline SVG for ⋯ Icon

Following the established pattern in `Sidebar.jsx` (all icons are inline SVGs), add:

```jsx
const DotsHorizontalIcon = ({ className }) => (
  <svg className={cn("w-4 h-4", className)} viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
    <path d="M3.625 7.5a1.125 1.125 0 1 1-2.25 0 1.125 1.125 0 0 1 2.25 0Zm5 0a1.125 1.125 0 1 1-2.25 0 1.125 1.125 0 0 1 2.25 0Zm5 0a1.125 1.125 0 1 1-2.25 0 1.125 1.125 0 0 1 2.25 0Z" />
  </svg>
);
```

---

### Active Topic Detection Change

| Before (current code) | After (this story) |
|---|---|
| `import { useLocation } from "react-router-dom"` | Remove from `SidebarContent` import (keep file-level if needed) |
| `const { pathname } = useLocation()` | Remove |
| `const topic = getTopicFromPath(pathname)` | Remove |
| `const isActive = sub.topic === topic` | `const isActive = sub.id === activeSub?.id` |
| — | `import { useActiveTopic } from "@/components/hooks"` |
| — | `const activeSub = useActiveTopic()` (at top of SidebarContent) |

`useActiveTopic()` returns `null` when no topic is active (on `/`, `/all`, `/settings`), so `sub.id === null?.id` safely evaluates to `false` for all rows. Guard is built in.

---

### SubscriptionManager APIs

All are imported via the existing `import subscriptionManager from "@/app/SubscriptionManager"` at the top of `Sidebar.jsx`:

```js
// Rename — update displayName only (topic string is immutable in Dexie)
await subscriptionManager.setDisplayName(subscriptionId, displayName);
// SubscriptionManager.js line 260-264

// Clear all notifications for a topic
await subscriptionManager.deleteNotifications(subscriptionId);
// SubscriptionManager.js line 238-240

// Unsubscribe — removes the subscription row AND all its notifications
await subscriptionManager.remove(subscription);  // takes the FULL subscription object, not just id
// SubscriptionManager.js line 148-151

// Get first remaining subscription (for post-unsubscribe nav)
const next = await subscriptionManager.first();  // returns undefined if none remain
// SubscriptionManager.js line 153-155
```

---

### Post-Unsubscribe Navigation

```js
const handleUnsubscribe = async (sub) => {
  const wasActive = sub.id === activeSub?.id;
  await subscriptionManager.remove(sub);
  if (wasActive) {
    const next = await subscriptionManager.first();
    if (next && !next.internal) {
      navigate(routes.forSubscription(next));
    } else {
      navigate(routes.app);
    }
  }
  // If not active, no navigation needed — user stays on current feed
};
```

`routes.app` = `config.app_root` which is `"/"` in the standalone build.

---

### Rename Dialog Implementation Pattern

Follow the Dialog API established in Story 1.7 (`src/components/ui/Dialog.jsx`):

```jsx
{/* Rendered outside the .map() loop, inside SidebarContent return */}
<Dialog open={!!renameSub} onOpenChange={(open) => !open && setRenameSub(null)}>
  <DialogContent title={t("sub_rename_dialog_title")}>
    <input
      autoFocus
      type="text"
      value={renameValue}
      onChange={(e) => setRenameValue(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && handleRename()}
      placeholder={t("sub_rename_dialog_placeholder")}
      maxLength={64}
      className={cn(
        "w-full px-3 py-2 mt-2 mb-4 text-body-sm",
        "bg-surface-2 border border-border rounded-sm text-text placeholder:text-muted",
        "focus:outline-none focus:ring-2 focus:ring-[var(--color-focus-ring)]"
      )}
    />
    <div className="flex justify-end gap-2">
      <DialogClose asChild>
        <Button variant="ghost">{t("common_cancel")}</Button>
      </DialogClose>
      <Button variant="primary" onClick={handleRename}>
        {t("common_save")}
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

`handleRename` async fn:
```js
const handleRename = async () => {
  if (!renameSub || !renameValue.trim()) return;
  await subscriptionManager.setDisplayName(renameSub.id, renameValue.trim());
  setRenameSub(null);
};
```

---

### Clear Confirm Dialog Implementation Pattern

```jsx
<Dialog open={!!clearSub} onOpenChange={(open) => !open && setClearSub(null)}>
  <DialogContent title={t("sub_menu_clear")}>
    <p className="text-body-sm text-muted mt-1 mb-4">
      {t("sub_clear_confirm_body")}
    </p>
    <div className="flex justify-end gap-2">
      <DialogClose asChild>
        <Button variant="ghost">{t("common_cancel")}</Button>
      </DialogClose>
      <Button variant="primary" onClick={handleClearConfirm}>
        {t("sub_clear_confirm_action")}
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

`handleClearConfirm` async fn:
```js
const handleClearConfirm = async () => {
  if (!clearSub) return;
  await subscriptionManager.deleteNotifications(clearSub.id);
  setClearSub(null);
};
```

---

### Import Changes for `SidebarContent`

Add to `Sidebar.jsx`:
```js
import { useState } from "react";
import { useActiveTopic } from "@/components/hooks";
import { Menu, MenuTrigger, MenuContent, MenuItem, MenuSeparator } from "@/components/ui/Menu";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
```

Remove from `Sidebar.jsx` (only if `useLocation` is no longer used anywhere in the file):
```js
// remove: useLocation from "react-router-dom"
import { useNavigate } from "react-router-dom"; // keep useNavigate
```

`useNavigate` is still needed for the subscription click + unsubscribe navigation. `useLocation` is no longer needed inside `SidebarContent` because `useActiveTopic()` uses `useParams()` internally.

**Sidebar outer component** (`const Sidebar = ...`) uses `t("app_name")` which needs no location.

---

### i18n Keys Reference

| Key | Korean | English |
|---|---|---|
| `sub_menu_trigger_label` | `"{{name}} 메뉴"` | `"{{name}} menu"` |
| `sub_menu_rename` | `"이름 바꾸기"` | `"Rename"` |
| `sub_menu_clear` | `"알림 모두 삭제"` | `"Clear all notifications"` |
| `sub_menu_unsubscribe` | `"구독 해제"` | `"Unsubscribe"` |
| `sub_rename_dialog_title` | `"토픽 이름 바꾸기"` | `"Rename topic"` |
| `sub_rename_dialog_placeholder` | `"표시 이름"` | `"Display name"` |
| `sub_clear_confirm_body` | `"이 토픽의 알림을 모두 삭제할까요?"` | `"Delete all notifications for this topic?"` |
| `sub_clear_confirm_action` | `"모두 삭제"` | `"Delete all"` |
| `common_cancel` | *(reuse — already `"취소"`)* | *(reuse — already `"Cancel"`)* |
| `common_save` | *(reuse — already `"저장"`)* | *(reuse — already `"Save"`)* |

---

### Architecture Boundary Summary

```
src/
├── components/
│   ├── Sidebar.jsx              ← MODIFY: restructure rows; add menu + dialogs
│   ├── Sidebar.test.jsx         ← CREATE: new test file
│   ├── AppBar.jsx               ← DO NOT TOUCH (imports getTopicFromPath — must stay)
│   ├── hooks.js                 ← READ-ONLY: import useActiveTopic (line 158–166)
│   ├── ui/
│   │   ├── Menu.jsx             ← EXISTING (Menu, MenuTrigger, MenuContent, MenuItem, MenuSeparator)
│   │   ├── Dialog.jsx           ← EXISTING (Dialog, DialogContent, DialogClose)
│   │   └── Button.jsx           ← EXISTING (variant="primary", variant="ghost")
│   └── app/
│       └── SubscriptionManager.js ← READ-ONLY: setDisplayName, deleteNotifications, remove, first
├── public/static/langs/
│   ├── ko.json                  ← MODIFY: add 8 new keys
│   └── en.json                  ← MODIFY: add 8 new keys
```

Layer rules (from project-context.md):
- `message/` → `ui/` imports: ALLOWED
- `ui/` → `message/` imports: FORBIDDEN (ESLint-enforced) — no risk in this story
- Components → `app/` imports: ALLOWED (`subscriptionManager`)

---

### Critical Anti-Patterns to Avoid

```jsx
// ✗ Removing getTopicFromPath export — AppBar.jsx breaks silently
export const getTopicFromPath = (...) => {...}  // MUST STAY

// ✗ Adding a second useLiveQuery for active state
const activeSub = useLiveQuery(() => subscriptionManager.get(activeId));  // ✗ — use useActiveTopic()

// ✗ Adding a useState for selected subscription id
const [selectedId, setSelectedId] = useState(null);  // ✗ — URL is source of truth (NFR per SelectionContext)

// ✗ Placing the rename/clear Dialog INSIDE the .map() loop
{visibleSubs.map(sub => (
  <>
    <div>{sub.topic}</div>
    <Dialog>...</Dialog>   // ✗ — creates N dialog instances, causes focus issues
  </>
))}

// ✗ Calling subscriptionManager.remove with just the id
await subscriptionManager.remove(sub.id);  // ✗ — remove() takes the whole subscription object

// ✗ Hardcoded Korean strings
<MenuItem>이름 바꾸기</MenuItem>  // ✗ — must be t("sub_menu_rename")

// ✗ Adding a confirmation Dialog for unsubscribe
// The epic spec only mandates a confirm for "clear notifications"

// ✗ Showing the ⋯ menu trigger in collapsed sidebar (icon-rail mode)
// collapsed={true} → no ⋯ button (too narrow, no room for text labels either)

// ✗ Using useState in the outer Sidebar frame component
// State belongs in SidebarContent (where the list and dialogs are rendered)
```

---

### Testing Pattern

```jsx
// src/components/Sidebar.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SidebarContent } from "./Sidebar";
import subscriptionManager from "@/app/SubscriptionManager";
import { useActiveTopic } from "@/components/hooks";

// Mock subscriptionManager
vi.mock("@/app/SubscriptionManager", () => ({
  default: {
    all: vi.fn(),
    setDisplayName: vi.fn(),
    deleteNotifications: vi.fn(),
    remove: vi.fn(),
    first: vi.fn().mockResolvedValue(null),
  },
}));

// Mock hooks.js — only useActiveTopic
vi.mock("@/components/hooks", async (importOriginal) => ({
  ...(await importOriginal()),
  useActiveTopic: vi.fn().mockReturnValue(null),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
  useParams: () => ({}),
}));

// Mock dexie-react-hooks — SidebarContent uses useLiveQuery for subscriptions
vi.mock("dexie-react-hooks", () => ({
  useLiveQuery: vi.fn((fn) => fn()),
}));
```

Key test stubs:
- Subscriptions array with at least 2 entries (one `displayName` set, one without)
- `subscriptionManager.all()` returns the stubs in tests

---

### Korean Voice (UX-DR12)

| Copy | Key | Value |
|---|---|---|
| ⋯ trigger aria-label | `sub_menu_trigger_label` | `"{{name}} 메뉴"` (screen reader: "backups 메뉴") |
| Rename menu item | `sub_menu_rename` | `"이름 바꾸기"` |
| Clear menu item | `sub_menu_clear` | `"알림 모두 삭제"` |
| Unsubscribe menu item | `sub_menu_unsubscribe` | `"구독 해제"` |
| Rename dialog title | `sub_rename_dialog_title` | `"토픽 이름 바꾸기"` |
| Clear confirm body | `sub_clear_confirm_body` | `"이 토픽의 알림을 모두 삭제할까요?"` |
| Clear confirm action | `sub_clear_confirm_action` | `"모두 삭제"` |

Voice is calm and action-forward (UX-DR12 해요체 / verb-on-button). No exclamation marks. No blame.

---

### References

- Epic spec: `_bmad-output/planning-artifacts/epics.md` § Story 4.1
- FR9b (manage subscriptions): `_bmad-output/planning-artifacts/epics.md` § Requirements FR9
- UX-DR7 (sidebar active-row design): `_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/DESIGN.md`
- G4 (card slot contract — not affected here): `_bmad-output/implementation-artifacts/3-1-notification-card-shell-slot-contract.md`
- `useActiveTopic` hook: `src/components/hooks.js` lines 158–166
- `getTopicFromPath` export: `src/components/Sidebar.jsx` line 32 (also imported by `AppBar.jsx` line 4)
- `SubscriptionManager.setDisplayName`: `src/app/SubscriptionManager.js` line 260
- `SubscriptionManager.deleteNotifications`: `src/app/SubscriptionManager.js` line 238
- `SubscriptionManager.remove`: `src/app/SubscriptionManager.js` line 148
- `SubscriptionManager.first`: `src/app/SubscriptionManager.js` line 153
- Menu component API: `src/components/ui/Menu.jsx` (Menu, MenuTrigger, MenuContent, MenuItem, MenuSeparator)
- Dialog component API: `src/components/ui/Dialog.jsx` (Dialog, DialogContent, DialogClose)
- Button component API: `src/components/ui/Button.jsx` (variant="primary", variant="ghost")
- Project context: `_bmad-output/project-context.md` — JS only, layer rules, i18n enforcement
- Story 3.4 pattern reference (overflow menu + confirm dialog): `_bmad-output/implementation-artifacts/3-4-card-overflow-actions-read-copy-delete.md`
- CardOverflowMenu.jsx (confirm Dialog pattern reference): `src/components/message/CardOverflowMenu.jsx`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `useActiveTopic()` returns the topic string (not a subscription object), so `isActive` is compared as `sub.topic === activeSub` instead of `sub.id === activeSub?.id` as noted in the spec. This is semantically equivalent given the actual hook implementation in SelectionContext.

### Completion Notes List

- Task 1: Replaced `useLocation` + `getTopicFromPath` active-topic detection with `useActiveTopic()` hook. Updated `isActive` to compare topic strings. Preserved `export const getTopicFromPath` for AppBar.jsx. Restructured subscription rows into `div` wrapper (nav button + mute toggle + ⋯ menu trigger). Updated label to `sub.displayName ?? sub.topic`. Added `DotsHorizontalIcon` inline SVG. Also updated "All notifications" active-state check to use `!activeSub`.
- Task 2: Added `renameSub`, `renameValue`, `clearSub` state. Implemented `handleRename`, `handleClearConfirm`, `handleUnsubscribe` handlers. Rendered Radix Menu with 3 items per row. Rendered rename and clear Dialogs outside the map loop. Preserved story 4.2 mute toggle alongside the ⋯ menu.
- Task 3: Added 8 new i18n keys to both ko.json and en.json. Reused existing `common_cancel` and `common_save` without duplication.
- Task 4: 18 tests in Sidebar.test.jsx — all pass. Covers trigger, rename (open/prefill/submit/empty-guard), clear (open/confirm/cancel), unsubscribe (remove/navigate-active/navigate-next/no-nav-inactive), displayName display, active-row highlight, no-hardcoded-Korean. Full suite: 348/348 passing.

### File List

- `src/components/Sidebar.jsx` — modified
- `src/components/Sidebar.test.jsx` — created
- `public/static/langs/ko.json` — modified (8 new keys)
- `public/static/langs/en.json` — modified (8 new keys)

## Change Log

- 2026-06-20: Story implemented — subscription rows restructured with ⋯ context menu; rename, clear, and unsubscribe actions added; active topic detection migrated to `useActiveTopic()`; displayName display added; 8 i18n keys added to ko.json/en.json; Sidebar.test.jsx created with 18 passing tests.
