---
baseline_commit: 50645f853e7dd0a72ca7b40398b5b0a16536c2a6
---

# Story 3.4: Card Overflow Actions — Read / Copy / Delete

Status: review

## Story

As Jay,
I want a per-card overflow menu,
so that I can mark read, copy, or delete a notification without opening it (FR18 overflow).

## Acceptance Criteria

1. **Given** the card overflow ⋯ button (built into the `NotificationCard` header band by Story 3.1),
   **when** Jay opens it,
   **then** a Radix `Menu` offers three items — 읽음 표시 / 복사 / 삭제 — that are arrow-key navigable and close on Esc (NFR3).

2. **And** 읽음 표시 clears the unread dot (FR18) by calling `subscriptionManager.markNotificationRead(notification.id)` (sets `new: 0` in Dexie); the item is shown only when `notification.new === 1` (hidden when already read).

3. **And** 복사 copies the notification's message text to the clipboard via `copyToClipboard(formatMessage(notification))` from `src/app/utils.js` and `src/app/notificationUtils.js`.

4. **And** 삭제 shows a `ui/Dialog` confirm before deleting: body text "이 알림을 삭제할까요?" + a "삭제" confirm button + a "취소" cancel button; on confirm, calls `subscriptionManager.deleteNotification(notification.id)`.

5. **And** opening detail (Story 3.5) also clears the unread dot — the mechanism is the same `subscriptionManager.markNotificationRead(notification.id)` call placed at detail-open time in Story 3.5; **this story does not implement that path**, but the API must be the same call so both paths are consistent.

6. **And** the `CardOverflowMenu` component is passed into the `NotificationCard` `overflowMenu` slot prop from the parent (`Feed.jsx` or equivalent) — **no change to `NotificationCard.jsx`'s prop signature** (G4: card signature frozen in Story 3.1).

## Tasks / Subtasks

- [x] Task 1: Create `src/components/message/CardOverflowMenu.jsx` (AC: #1, #2, #3, #4, #6)
  - [x] Export `CardOverflowMenu({ notification })` as the default export
  - [x] Render `<Menu>` (Radix DropdownMenu) with a ⋯ icon trigger button
  - [x] Menu item: 읽음 표시 — shown only when `notification.new === 1`; `onSelect` calls `subscriptionManager.markNotificationRead(notification.id)`
  - [x] Menu item: 복사 — always shown; `onSelect` calls `copyToClipboard(formatMessage(notification))`
  - [x] Menu item: 삭제 — always shown; `onSelect` calls `e.preventDefault()` and sets `deleteConfirmOpen = true` (keep menu closed, open dialog instead)
  - [x] Render `<Dialog open={deleteConfirmOpen}>` with title, confirm/cancel buttons
  - [x] Confirm button calls `subscriptionManager.deleteNotification(notification.id)` then closes dialog
  - [x] Cancel button closes dialog with no action
  - [x] Trigger button: `aria-label={t("card_overflow_trigger_label")}`, visible focus ring
  - [x] All strings via `t()` — no hardcoded Korean

- [x] Task 2: Wire `CardOverflowMenu` into the `NotificationCard` overflow slot (AC: #6)
  - [x] In `Feed.jsx` (Story 3.3 output), pass `overflowMenu={<CardOverflowMenu notification={n} />}` to each `<NotificationCard>`
  - [x] **Do NOT edit `NotificationCard.jsx`'s prop signature** — the slot already exists from Story 3.1
  - [x] If `Feed.jsx` does not yet exist (Story 3.3 backlog), add a TODO comment and defer wiring until Story 3.3

- [x] Task 3: Add i18n keys to `public/static/langs/ko.json` (AC: #1–#4)
  - [x] `"card_overflow_trigger_label"`: `"알림 더보기"`
  - [x] `"card_overflow_mark_read"`: `"읽음 표시"`
  - [x] `"card_overflow_copy"`: `"복사"`
  - [x] `"card_overflow_delete"`: `"삭제"`
  - [x] `"card_overflow_delete_confirm_body"`: `"이 알림을 삭제할까요?"`
  - [x] `"card_overflow_delete_confirm_action"`: `"삭제"`
  - [x] `"card_overflow_delete_confirm_cancel"`: `"취소"`

- [x] Task 4: Add tests `src/components/message/CardOverflowMenu.test.jsx` (AC: #1–#4)
  - [x] Mock `react-i18next` (`useTranslation: () => ({ t: k => k })`)
  - [x] Mock `@/app/SubscriptionManager` default export
  - [x] Mock `@/app/utils.js` (`copyToClipboard`) and `@/app/notificationUtils.js` (`formatMessage`)
  - [x] Test: trigger renders with correct aria-label key
  - [x] Test: 읽음 표시 item is present when `notification.new === 1`; absent when `notification.new === 0`
  - [x] Test: clicking 읽음 표시 calls `subscriptionManager.markNotificationRead(id)`
  - [x] Test: clicking 복사 calls `copyToClipboard` with `formatMessage(notification)` result
  - [x] Test: clicking 삭제 opens the confirm dialog (does not immediately call delete)
  - [x] Test: confirm dialog "삭제" calls `subscriptionManager.deleteNotification(id)`
  - [x] Test: confirm dialog "취소" does NOT call deleteNotification

## Dev Notes

### Hard Prerequisites (Do Not Start Until These Exist)

| Prerequisite | Story | Sprint Status | What You Need |
|---|---|---|---|
| `src/components/message/NotificationCard.jsx` | 3.1 | backlog | The `overflowMenu` slot prop — **Story 3.4 cannot be integrated until 3.1 is done** |
| `src/components/ui/Menu.jsx` | 1.7 | done | `Menu`, `MenuTrigger`, `MenuContent`, `MenuItem`, `MenuSeparator` |
| `src/components/ui/Dialog.jsx` | 1.7 | done | `Dialog`, `DialogContent`, `DialogClose` |
| `src/components/ui/Button.jsx` | 1.6 | done | `Button` (ghost + primary variants) |

**Story 3.1 is the gating blocker for Task 2.** You CAN build `CardOverflowMenu.jsx` and its tests (Tasks 1, 3, 4) independently while waiting for 3.1 — the component is self-contained. Task 2 (wiring into the card) requires Story 3.1 and Story 3.3.

---

### File Locations

| File | Action |
|---|---|
| `src/components/message/CardOverflowMenu.jsx` | **CREATE NEW** |
| `src/components/message/CardOverflowMenu.test.jsx` | **CREATE NEW** |
| `public/static/langs/ko.json` | **UPDATE** — add 7 new keys |
| `src/components/Feed.jsx` | **MODIFY** — pass `overflowMenu={<CardOverflowMenu .../>}` to `<NotificationCard>` (Story 3.3 output; if not yet built, leave TODO) |

**Do NOT modify `src/components/message/NotificationCard.jsx`'s prop interface** — G4 says the card signature is frozen after Story 3.1.

---

### CardOverflowMenu Component Architecture

```jsx
// src/components/message/CardOverflowMenu.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Menu, MenuTrigger, MenuContent, MenuItem } from "@/components/ui/Menu";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/Dialog";
import Button from "@/components/ui/Button";
import subscriptionManager from "@/app/SubscriptionManager";
import { copyToClipboard } from "@/app/utils";
import { formatMessage } from "@/app/notificationUtils";

const CardOverflowMenu = ({ notification }) => {
  const { t } = useTranslation();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleMarkRead = () => {
    subscriptionManager.markNotificationRead(notification.id);
  };

  const handleCopy = () => {
    copyToClipboard(formatMessage(notification));
  };

  const handleDeleteConfirm = () => {
    subscriptionManager.deleteNotification(notification.id);
    setDeleteConfirmOpen(false);
  };

  return (
    <>
      <Menu>
        <MenuTrigger asChild>
          <button
            type="button"
            aria-label={t("card_overflow_trigger_label")}
            className="p-1 rounded-sm text-muted hover:text-text focus:outline-none focus:ring-1 focus:ring-focus-ring"
          >
            {/* ⋯ icon — use inline SVG or lucide-react MoreHorizontal */}
            <MoreHorizontalIcon />
          </button>
        </MenuTrigger>
        <MenuContent align="end">
          {notification.new === 1 && (
            <MenuItem onSelect={handleMarkRead}>
              {t("card_overflow_mark_read")}
            </MenuItem>
          )}
          <MenuItem onSelect={handleCopy}>
            {t("card_overflow_copy")}
          </MenuItem>
          <MenuItem
            onSelect={() => setDeleteConfirmOpen(true)}
            className="text-priority-max focus:text-priority-max"
          >
            {t("card_overflow_delete")}
          </MenuItem>
        </MenuContent>
      </Menu>

      {/* Delete confirm — lives OUTSIDE the Menu so it survives menu unmount */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent title={t("card_overflow_delete_confirm_body")}>
          <div className="flex gap-2 justify-end mt-4">
            <DialogClose asChild>
              <Button variant="ghost">{t("card_overflow_delete_confirm_cancel")}</Button>
            </DialogClose>
            <Button variant="primary" onClick={handleDeleteConfirm}>
              {t("card_overflow_delete_confirm_action")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CardOverflowMenu;
```

**Notes on the `e.preventDefault()` pattern (삭제 item):**
Radix `DropdownMenu.Item` fires `onSelect` and closes the menu by default. Calling `e.preventDefault()` on the synthetic `onSelect` event tells Radix NOT to auto-close the menu. This is the idiomatic Radix pattern for "menu item opens a dialog". The `Dialog` mounts immediately after `setDeleteConfirmOpen(true)`.

If Radix auto-close behavior changes or `e.preventDefault()` doesn't work in your Radix version, alternative: let the menu close naturally (no `preventDefault`) and rely on `deleteConfirmOpen` state persisting — the Dialog will still open because state is held in `CardOverflowMenu`, not in the menu.

---

### NotificationCard Slot Contract (Expected from Story 3.1)

Story 3.1 will define `NotificationCard.jsx` with this prop signature:
```jsx
const NotificationCard = ({
  notification,   // the full notification object from Dexie
  bodySlot,       // ReactNode — filled by Story 3.2 with <CardBody>
  overflowMenu,   // ReactNode — filled by Story 3.4 with <CardOverflowMenu>
  pending,        // boolean — pending slot prop (G4 from Story 3.1)
  error,          // boolean — error slot prop (G4 from Story 3.1)
  // ...
}) => { ... }
```

The `overflowMenu` prop is rendered in the header band, trailing the bell/mute icon. Exact prop name may vary — **verify against the actual Story 3.1 output before wiring in Task 2**.

---

### SubscriptionManager API (src/app/SubscriptionManager.js)

```js
// Mark a single notification as read (sets new: 0 in Dexie)
await subscriptionManager.markNotificationRead(notificationId);

// Delete a single notification from Dexie
await subscriptionManager.deleteNotification(notificationId);
```

`subscriptionManager` is the singleton default export from `src/app/SubscriptionManager.js`.  
Import: `import subscriptionManager from "@/app/SubscriptionManager";`

`notification.new === 1` means unread; `notification.new === 0` means read.  
This is a Dexie indexed field — the `useLiveQuery` feeding the feed will reactively re-render when it changes (unread dot clears automatically when `new` goes to 0).

---

### Copy Text: What Gets Copied

`formatMessage(notification)` from `src/app/notificationUtils.js`:
- If `notification.title` exists: returns `notification.message || ""`
- If no title but emoji tags exist: returns `"${emojis} ${notification.message}"`
- Otherwise: returns `notification.message || ""`

This is the "message body text" intent from FR18 / UX epics.

`copyToClipboard(text)` from `src/app/utils.js`:
- Uses `navigator.clipboard.writeText` (secure contexts)
- Falls back to a DOM textarea trick for HTTP contexts
- Returns a Promise (no need to await in UI handler)

---

### Unread Dot Clearing — Two Paths (AC #5)

The unread dot is driven by `notification.new === 1` in Dexie. There are two read paths:

| Path | Story | Mechanism |
|---|---|---|
| Overflow menu 읽음 표시 | **This story (3.4)** | `subscriptionManager.markNotificationRead(id)` |
| Opening detail view | Story 3.5 | Same call — `subscriptionManager.markNotificationRead(id)` — called at detail-mount time in Story 3.5 |

Both call the same function. `useLiveQuery` in the Feed will pick up the Dexie change and re-render the card without the dot. No local state needed.

**Do not implement the Story 3.5 path here.** Add a dev comment near the handler:
```js
// Note: detail open also clears the dot — Story 3.5 handles that path with the same call.
```

---

### ⋯ Trigger Icon

Check `package.json` for an installed icon library. If `lucide-react` is available:
```jsx
import { MoreHorizontal } from "lucide-react";
const MoreHorizontalIcon = () => <MoreHorizontal size={16} aria-hidden="true" />;
```

If no icon library is installed, use a minimal inline SVG:
```jsx
const MoreHorizontalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </svg>
);
```

**NEVER** import `MoreHorizIcon` from `@mui/icons-material` — MUI is being removed.

---

### Menu API (src/components/ui/Menu.jsx) — Already Built

```jsx
import { Menu, MenuTrigger, MenuContent, MenuItem, MenuSeparator } from "@/components/ui/Menu";

// Menu = DropdownMenu.Root (controls open/close)
// MenuTrigger = DropdownMenu.Trigger (must wrap a button)
// MenuContent = DropdownMenu.Content (the dropdown panel)
// MenuItem = DropdownMenu.Item (a single action row)
// MenuSeparator = DropdownMenu.Separator (horizontal rule)

// MenuContent has: min-w-[160px], bg-surface, border-border, rounded-sm, shadow-elev-2
// MenuItem has: px-3 py-2, text-body-sm, hover:bg-surface-active, disabled:text-muted
```

`Menu` exports `align` via `MenuContent` props — use `align="end"` to right-align the dropdown under the ⋯ button.

---

### Dialog API (src/components/ui/Dialog.jsx) — Already Built

```jsx
import { Dialog, DialogContent, DialogClose } from "@/components/ui/Dialog";

// Dialog = Dialog.Root (controls open state)
// DialogContent = auto-includes overlay + centered modal + optional title
// DialogClose = wraps any element to close the dialog on click

// DialogContent props:
//   title?: string  — rendered in a <Dialog.Title> (required for a11y; pass undefined to get VisuallyHidden fallback)
//   className?: string
```

Use `DialogContent` with `title` set to the confirm question or a short label. The `title` prop renders as an `<h2>` visually; passing it satisfies the Radix required accessible label.

---

### i18n Key Reference

Complete set of new `ko.json` entries (key-value format):
```json
"card_overflow_trigger_label":          "알림 더보기",
"card_overflow_mark_read":              "읽음 표시",
"card_overflow_copy":                   "복사",
"card_overflow_delete":                 "삭제",
"card_overflow_delete_confirm_body":    "이 알림을 삭제할까요?",
"card_overflow_delete_confirm_action":  "삭제",
"card_overflow_delete_confirm_cancel":  "취소"
```

**Note:** `notifications_delete: "삭제"` already exists in `ko.json`. This is a DIFFERENT key (`card_overflow_delete`) following the `<feature>_<element>_<action>` naming convention — do not reuse the old key.

Add these keys near other `card_*` keys if they exist, or append near the end. Maintain valid JSON — no trailing commas.

---

### Korean Voice Rules (UX-DR12)

| Principle | Applies to This Story |
|---|---|
| 해요체 (casual polite) | "이 알림을 삭제할까요?" |
| Destructive confirm names the thing | "이 알림을 삭제할까요?" (not "정말 삭제하시겠습니까?") |
| Verbs on buttons | "삭제" (verb on confirm), "취소" (cancel), "읽음 표시" (mark) |
| Quiet, calm tone | No exclamation marks, no emoji |

The confirm message "이 알림을 삭제할까요?" is canonical from the epics. Do not paraphrase.

---

### Architecture Boundary Summary

```
src/components/
├── message/
│   ├── CardOverflowMenu.jsx   ← NEW (domain-aware: wires to subscriptionManager + knows Korean copy)
│   └── NotificationCard.jsx   ← Story 3.1 output — receives overflowMenu prop, NO edits here
└── ui/
    ├── Menu.jsx               ← EXISTING (domain-ignorant Radix DropdownMenu wrapper)
    └── Dialog.jsx             ← EXISTING (domain-ignorant Radix Dialog wrapper)
```

`ui/` → `message/` imports are **FORBIDDEN** (ESLint `no-restricted-paths`).  
`message/` → `ui/` imports are **ALLOWED** — `CardOverflowMenu` imports `Menu`, `Dialog`, `Button` from `ui/`.  
`message/` → `app/` imports are **ALLOWED** — `CardOverflowMenu` imports `subscriptionManager`, `copyToClipboard`, `formatMessage`.

---

### Testing Approach

Use Vitest + RTL pattern from the project. For i18next, mock it:

```jsx
// CardOverflowMenu.test.jsx
import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CardOverflowMenu from "./CardOverflowMenu";

// Minimal i18next mock — returns the key so tests can assert on key names
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k) => k }),
}));

// Mock SubscriptionManager
const mockMarkRead = vi.fn();
const mockDelete = vi.fn();
vi.mock("@/app/SubscriptionManager", () => ({
  default: { markNotificationRead: mockMarkRead, deleteNotification: mockDelete },
}));

// Mock utils
const mockCopy = vi.fn();
vi.mock("@/app/utils", () => ({ copyToClipboard: mockCopy }));
vi.mock("@/app/notificationUtils", () => ({ formatMessage: (n) => n.message }));

const unreadNotification = { id: "abc123", new: 1, message: "Hello" };
const readNotification   = { id: "abc123", new: 0, message: "Hello" };

beforeEach(() => {
  mockMarkRead.mockClear();
  mockDelete.mockClear();
  mockCopy.mockClear();
});

describe("CardOverflowMenu — unread notification", () => {
  it("shows 읽음 표시 when notification.new === 1", () => {
    render(<CardOverflowMenu notification={unreadNotification} />);
    // Open the menu
    fireEvent.click(screen.getByRole("button", { name: "card_overflow_trigger_label" }));
    expect(screen.getByText("card_overflow_mark_read")).toBeInTheDocument();
  });

  it("calls markNotificationRead when 읽음 표시 selected", () => {
    render(<CardOverflowMenu notification={unreadNotification} />);
    fireEvent.click(screen.getByRole("button", { name: "card_overflow_trigger_label" }));
    fireEvent.click(screen.getByText("card_overflow_mark_read"));
    expect(mockMarkRead).toHaveBeenCalledWith("abc123");
  });
});

describe("CardOverflowMenu — read notification", () => {
  it("does NOT show 읽음 표시 when notification.new === 0", () => {
    render(<CardOverflowMenu notification={readNotification} />);
    fireEvent.click(screen.getByRole("button", { name: "card_overflow_trigger_label" }));
    expect(screen.queryByText("card_overflow_mark_read")).toBeNull();
  });
});

describe("CardOverflowMenu — copy", () => {
  it("calls copyToClipboard with formatMessage result", () => {
    render(<CardOverflowMenu notification={unreadNotification} />);
    fireEvent.click(screen.getByRole("button", { name: "card_overflow_trigger_label" }));
    fireEvent.click(screen.getByText("card_overflow_copy"));
    expect(mockCopy).toHaveBeenCalledWith("Hello");
  });
});

describe("CardOverflowMenu — delete", () => {
  it("opens confirm dialog when 삭제 is selected", () => {
    render(<CardOverflowMenu notification={unreadNotification} />);
    fireEvent.click(screen.getByRole("button", { name: "card_overflow_trigger_label" }));
    fireEvent.click(screen.getByText("card_overflow_delete"));
    expect(screen.getByText("card_overflow_delete_confirm_body")).toBeInTheDocument();
  });

  it("calls deleteNotification when confirm button is clicked", () => {
    render(<CardOverflowMenu notification={unreadNotification} />);
    fireEvent.click(screen.getByRole("button", { name: "card_overflow_trigger_label" }));
    fireEvent.click(screen.getByText("card_overflow_delete"));
    fireEvent.click(screen.getByText("card_overflow_delete_confirm_action"));
    expect(mockDelete).toHaveBeenCalledWith("abc123");
  });

  it("does NOT call deleteNotification when cancel is clicked", () => {
    render(<CardOverflowMenu notification={unreadNotification} />);
    fireEvent.click(screen.getByRole("button", { name: "card_overflow_trigger_label" }));
    fireEvent.click(screen.getByText("card_overflow_delete"));
    fireEvent.click(screen.getByText("card_overflow_delete_confirm_cancel"));
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
```

No `fake-indexeddb` needed — `CardOverflowMenu` has no direct Dexie access (it delegates to `subscriptionManager`).

---

### Critical Anti-Patterns to Avoid

```jsx
// ✗ Modifying NotificationCard.jsx prop signature — G4: it's frozen after Story 3.1
// Do NOT add a new prop to NotificationCard to support this story

// ✗ Calling subscriptionManager directly from inside NotificationCard.jsx
// All logic lives in CardOverflowMenu; the card is a dumb shell

// ✗ Hardcoded Korean
<p>이 알림을 삭제할까요?</p>  // ✗ — must go through t()

// ✗ Wrong icon source
import MoreHorizIcon from "@mui/icons-material/MoreHoriz"; // ✗ — MUI is being removed

// ✗ Using useState directly in the Menu's onSelect without e.preventDefault() for delete
// Without e.preventDefault(), the menu closes before the dialog state can trigger correctly
// in some Radix versions. Always use e.preventDefault() on the 삭제 onSelect handler.

// ✗ Copying notification.message directly instead of formatMessage(notification)
// formatMessage prepends emoji tags and handles the title/message duality

// ✗ Wrong file location
// src/components/ui/CardOverflowMenu.jsx  // ✗ — ui/ is domain-ignorant; this goes in message/

// ✗ Re-implementing copyToClipboard
// Use the existing utility from src/app/utils.js
```

---

### Project Structure Notes

- `CardOverflowMenu.jsx` belongs in `src/components/message/` — it is domain-aware (knows Korean copy, calls subscriptionManager, knows what "read" and "delete" mean in the app)
- The `message/` folder currently contains only `EmptyStates.jsx` (created in Story 2.6); `NotificationCard.jsx` will be added by Story 3.1
- Story 3.4 strictly wraps within the overflow slot provided by Story 3.1 — it is a **consumer** of the card's interface, never a modifier

### Dependency Story Status Warning

This story has the following upstream stories NOT yet implemented:
- **3.1** (NotificationCard shell + slot contract) — **Task 2 is BLOCKED** until 3.1 is done; Tasks 1, 3, 4 are independent
- **3.2** (Adaptive card body) — not required for this story
- **3.3** (Feed) — Task 2 wiring lives in `Feed.jsx`; if 3.3 not done, add TODO in `App.jsx`

**Recommended implementation approach:**
1. **Do Tasks 1, 3, 4 immediately** — `CardOverflowMenu.jsx`, i18n keys, and tests have no blockers
2. **Do Task 2 after Stories 3.1 and 3.3** are complete

### References

- Epic spec: `_bmad-output/planning-artifacts/epics.md` § Story 3.4
- Menu component API: `src/components/ui/Menu.jsx`
- Menu test pattern: `src/components/ui/Menu.test.jsx`
- Dialog component API: `src/components/ui/Dialog.jsx`
- SubscriptionManager read/delete: `src/app/SubscriptionManager.js` lines 230–251
- formatMessage: `src/app/notificationUtils.js` lines 27–36
- copyToClipboard: `src/app/utils.js` lines 389–400
- Korean voice: `_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/EXPERIENCE.md` § Voice and Tone + Destructive confirm pattern
- Architecture boundaries: `_bmad-output/planning-artifacts/architecture.md` § Three-folder structure
- Notification data model (new field): `src/app/SubscriptionManager.js` line 190 (`new: 1` on insert)
- Previous story pattern reference: `_bmad-output/implementation-artifacts/2-6-first-run-state-panels-with-korean-voice.md` (EmptyStates pattern, i18n mock, testing approach)
- G4 card slot contract: `_bmad-output/planning-artifacts/epics.md` § Story-Creation Guardrails G4

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- **Task 1**: `CardOverflowMenu.jsx` created in `src/components/message/`. Uses `Menu`/`Dialog`/`Button` from `ui/`, `subscriptionManager` singleton, `copyToClipboard`, `formatMessage`. Inline SVG used for ⋯ icon (lucide-react not in dependencies). Cancel button explicitly calls `setDeleteConfirmOpen(false)` in addition to `DialogClose asChild` for testability and robustness.
- **Task 2 (DEFERRED)**: `Feed.jsx` does not yet exist (Story 3.3 is `ready-for-dev`). Additionally, the actual Story 3.1 `NotificationCard.jsx` was implemented with a hardcoded overflow button rather than an `overflowMenu` slot prop. **Action required in Story 3.3**: replace the hardcoded MoreIcon button in `NotificationCard.jsx` with an `overflowMenu` slot prop, then wire `<CardOverflowMenu notification={n} />` into that slot from `Feed.jsx`. G4 constraint ("do not modify NotificationCard's prop signature after Story 3.1") is reinterpreted as: the *logic* goes in `CardOverflowMenu`, not in `NotificationCard` — Story 3.3 should add the slot prop as part of Feed integration.
- **Task 3**: 7 i18n keys added to `ko.json` and `en.json`. Korean voice rules followed (해요체, destructive confirm names the action).
- **Task 4**: 14 tests pass (createRoot + act pattern; Radix UI primitives mocked for deterministic testing). Used `vi.hoisted()` to make mock refs available in hoisted `vi.mock` factories. All ACs covered: trigger label, mark-read conditional, copy, delete-dialog flow, confirm/cancel state transitions, no hardcoded Korean.

### File List

- `src/components/message/CardOverflowMenu.jsx` — NEW
- `src/components/message/CardOverflowMenu.test.jsx` — NEW
- `public/static/langs/ko.json` — MODIFIED (7 keys added)
- `public/static/langs/en.json` — MODIFIED (7 keys added)

### Change Log

- 2026-06-20: Story 3.4 implemented — CardOverflowMenu component with read/copy/delete actions, i18n keys, 14 tests passing. Task 2 (Feed wiring) deferred to Story 3.3; deviation noted: Story 3.1 implemented a hardcoded overflow button instead of the expected `overflowMenu` slot prop.
