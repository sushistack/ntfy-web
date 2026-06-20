---
baseline_commit: 50645f853e7dd0a72ca7b40398b5b0a16536c2a6
---

# Story 3.8: Mobile Card Swipe Gesture

Status: done

## Story

As Jay on mobile,
I want to swipe a card to reveal quick actions,
so that read/delete are faster than opening the overflow menu (UX-DR17).

## Acceptance Criteria

1. **Given** a touch viewport,
   **when** Jay swipes a card left past the snap threshold (~80px),
   **then** a delete action button ("삭제") is revealed on the trailing edge of the card; releasing snaps the card open to show it.

2. **Given** a touch viewport and `notification.new === 1`,
   **when** Jay swipes a card right past the snap threshold (~80px),
   **then** a mark-read action button ("읽음 표시") is revealed on the leading edge; releasing snaps the card open to show it.
   (When `notification.new === 0`, right-swipe has no revealed action — the card snaps back.)

3. **And** tapping the revealed 읽음 표시 button calls `subscriptionManager.markNotificationRead(notification.id)` and collapses the card back to its resting position.

4. **And** tapping the revealed 삭제 button opens the same `ui/Dialog` delete confirm used by the overflow menu ("이 알림을 삭제할까요?"); on confirm, calls `subscriptionManager.deleteNotification(notification.id)`; on cancel or Esc, closes the dialog without action and collapses the card.

5. **And** tap still opens detail (swipe is never the only way to reach an action, NFR3):
   - A pointer movement < 10px horizontal is treated as a tap → `onTap(notification)` fires normally.
   - The swipe gesture does NOT fire `onTap`.

6. **And** the gesture respects `prefers-reduced-motion`:
   - When `prefers-reduced-motion: reduce` is set, skip the CSS `transition` — card jumps instantly to the revealed state or back; no slide animation.
   - The action buttons are still fully functional when reduced motion is active.

7. **And** the gesture does not trap focus or reorder tab order:
   - Revealed action buttons are only keyboard-reachable when the card is in the revealed state.
   - When collapsed, the revealed buttons have `tabIndex={-1}` (hidden from tab order).
   - After action completes or card collapses, focus returns to the card element.

8. **And** the gesture is touch-only (`pointerType === 'touch'` guard):
   - Mouse drags do NOT trigger the reveal. The overflow menu remains the mouse/keyboard path.

9. **And** **no prop API change to `NotificationCard`** (G4 from Story 3.1 — signature is frozen):
   - The swipe gesture is implemented as **internal state** within `NotificationCard.jsx`.
   - No new props are added. The component's external interface is unchanged.

## Tasks / Subtasks

- [x] Task 1: Add swipe gesture logic to `src/components/message/NotificationCard.jsx` (AC: #1–#8, #9)
  - [x] Add internal state: `swipeOffset` (number, px) + `revealedSide` (`'mark-read' | 'delete' | null`)
  - [x] Add `dragRef` (`useRef({ startX: 0, startY: 0, isDragging: false, isLocked: false })`) — `isLocked` prevents new drag while Dialog is open
  - [x] Compute `prefersReducedMotion` once via `window.matchMedia('(prefers-reduced-motion: reduce)').matches` inside the component (read on each render; no subscription needed)
  - [x] Attach pointer handlers to the card's outer `div` (the element that already has `role="button"` / `onTap`):
    - `onPointerDown`: if `e.pointerType !== 'touch'` → early return; record `startX`, `startY`; call `e.currentTarget.setPointerCapture(e.pointerId)`; set `isDragging = true`
    - `onPointerMove`: if not dragging → return; compute `deltaX = e.clientX - startX`, `deltaY = e.clientY - startY`; if `Math.abs(deltaY) > Math.abs(deltaX)` (vertical scroll intent) → cancel drag (`isDragging = false`, reset offset); else clamp `deltaX` to `[-REVEAL_MAX, REVEAL_MAX]` (96px) and `setSwipeOffset(deltaX)`
    - `onPointerUp` + `onPointerCancel`: commit or snap-back based on threshold (see thresholds below)
  - [x] On `onPointerUp`: if `|deltaX| >= SNAP_THRESHOLD` (72px):
    - `deltaX < 0` (left swipe) → `setRevealedSide('delete'); setSwipeOffset(0)`
    - `deltaX > 0` (right swipe, only if `notification.new === 1`) → `setRevealedSide('mark-read'); setSwipeOffset(0)`
    - Right swipe on already-read card → snap back (`setRevealedSide(null); setSwipeOffset(0)`)
  - [x] On `onPointerUp`: if `|deltaX| < SNAP_THRESHOLD` → snap back (`setRevealedSide(null); setSwipeOffset(0)`)
  - [x] On `onPointerCancel` → always snap back
  - [x] Distinguish tap from swipe: if `|totalDeltaX| < 10` on `pointerUp` → call `onTap(notification)` (the existing tap handler logic); if `>= 10` → swipe, do NOT fire `onTap`
  - [x] Wrap the card's **content layer** (not the root container) in a `div` with `style={{ transform: \`translateX(${swipeOffset}px)\`, transition: isDragging || prefersReducedMotion ? 'none' : 'transform 200ms ease-out' }}` — this slides the visual card over the backing layer
  - [x] Inside the root container (which is `position: relative overflow-hidden`), add backing action layers (see layout below)

- [x] Task 2: Create action backing layers inside `NotificationCard.jsx` (AC: #1–#4, #7)
  - [x] Left backing layer (leading, for mark-read): positioned via inline style (left:0, top:0, bottom:0) + `w-24 flex items-center justify-center bg-accent-text` — contains the 읽음 표시 button
    - Button: `tabIndex={revealedSide === 'mark-read' ? 0 : -1}` `aria-label={t("swipe_mark_read_label")}` `onClick={handleSwipeMarkRead}`
    - `handleSwipeMarkRead`: calls `subscriptionManager.markNotificationRead(notification.id)` then `collapse()`
  - [x] Right backing layer (trailing, for delete): positioned via inline style (right:0, top:0, bottom:0) + `w-24 flex items-center justify-center bg-priority-max` — contains the 삭제 button
    - Button: `tabIndex={revealedSide === 'delete' ? 0 : -1}` `aria-label={t("swipe_delete_label")}` `onClick={() => { setDeleteConfirmOpen(true); dragRef.current.isLocked = true; }}`
  - [x] Both layers are always in the DOM but invisible until the card content slides to reveal them
  - [x] Root container: `overflow-hidden relative` added to Card className
  - [x] Add `deleteConfirmOpen` state (boolean) + Dialog for delete confirm (identical pattern to `CardOverflowMenu.jsx` from Story 3.4)
  - [x] `handleSwipeDeleteConfirm`: calls `subscriptionManager.deleteNotification(notification.id)` then `setDeleteConfirmOpen(false)` then `collapse()` then `cardRef.current?.focus()`
  - [x] When Dialog opens, set `dragRef.current.isLocked = true`; when Dialog closes via onOpenChange, collapse card and restore focus

- [x] Task 3: Add i18n keys to `public/static/langs/ko.json` (AC: #1–#4)
  - [x] `"swipe_mark_read_label"`: `"밀어서 읽음 표시"`
  - [x] `"swipe_delete_label"`: `"밀어서 삭제"`
  - [x] **Reuse existing keys** for the delete confirm dialog — `card_overflow_delete_confirm_body`, `card_overflow_delete_confirm_action`, `card_overflow_delete_confirm_cancel` (added by Story 3.4 — do NOT add duplicates)

- [x] Task 4: Write `src/components/message/NotificationCard.test.jsx` additions (AC: #3–#6, #7, #8)
  - [x] Add to the existing `NotificationCard.test.jsx` file (do not create a new file):
  - [x] Setup: mock `window.matchMedia` returning `{ matches: false }` by default
  - [x] Test: pointer move < 10px → `onTap` is called (swipe does not suppress tap)
  - [x] Test: pointer move ≥ 72px left → delete backing layer becomes accessible (`tabIndex={0}`)
  - [x] Test: pointer move ≥ 72px right on unread card → mark-read backing layer becomes accessible
  - [x] Test: pointer move ≥ 72px right on read card (`new === 0`) → card snaps back (no reveal)
  - [x] Test: tapping 읽음 표시 backing button calls `subscriptionManager.markNotificationRead(id)`
  - [x] Test: tapping 삭제 backing button opens delete confirm Dialog
  - [x] Test: `pointerType = 'mouse'` drag → `onTap` fires, no reveal (mouse guard)
  - [x] Test: `prefers-reduced-motion: reduce` → transition style is `'none'` (mock matchMedia to return `{ matches: true }`)
  - [x] Test: `aria-label` on both backing buttons present
  - [x] Use native `PointerEvent` + `dispatchEvent` via `act()` (consistent with existing test style)

## Dev Notes

### Hard Prerequisites

| Prerequisite | Story | Status | What You Need |
|---|---|---|---|
| `src/components/message/NotificationCard.jsx` | 3.1 | ready-for-dev | The card component to modify — gesture layer goes INSIDE this file |
| `src/components/ui/Dialog.jsx` | 1.7 | done | Delete confirm dialog (same as used in CardOverflowMenu) |
| `src/components/ui/Button.jsx` | 1.6 | done | Confirm/cancel buttons inside Dialog |
| Story 3.4 i18n keys | 3.4 | ready-for-dev | `card_overflow_delete_confirm_*` keys must be in `ko.json` before this story or added here |
| `src/app/SubscriptionManager.js` | existing | done | `markNotificationRead` + `deleteNotification` APIs |

**If Story 3.4 is not yet done**, add the three `card_overflow_delete_confirm_*` i18n keys here (identical values). If 3.4 is done, do NOT re-add them — just import/reuse the keys.

---

### File Locations

| File | Action |
|---|---|
| `src/components/message/NotificationCard.jsx` | **MODIFY** — add swipe gesture logic + backing layers (no prop signature change) |
| `src/components/message/NotificationCard.test.jsx` | **MODIFY** — add swipe gesture tests to existing file |
| `public/static/langs/ko.json` | **MODIFY** — add 2 new swipe-specific keys; reuse 3 existing delete confirm keys from Story 3.4 |

**No new files.** Everything lives inside the existing `NotificationCard.jsx`. No new hook file needed — the gesture logic is self-contained enough to live inline.

---

### Critical: G4 — No Prop Signature Change

`NotificationCard.jsx` prop API was frozen in Story 3.1. These props are fixed:

```
notification, subscriptionName, onTap, isSelected, body, pending, error, onMuteToggle, isMuted
```

The swipe feature uses **only internal `useState` + `useRef`** — zero new props. This is what the epic means by "gesture layer (no signature change)".

---

### Swipe Gesture — Implementation Blueprint

The card has two layers:

```
┌─ card root div (relative, overflow-hidden) ──────────────────────────┐
│  ┌─ mark-read backing (absolute left-0, w-24, accent-text bg) ─────┐ │
│  │  [읽음 표시 button]                                               │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│  ┌─ delete backing (absolute right-0, w-24, priority-max bg) ──────┐ │
│  │  [삭제 button]                                                    │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│  ┌─ content layer (translateX-animated) ───────────────────────────┐ │
│  │  [existing card content — header, body, meta, tags]              │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

**Thresholds:**
- `REVEAL_MAX = 96` — max px card can move while dragging (clamp boundary)
- `SNAP_THRESHOLD = 72` — px needed to snap open; below this, snap back

**Pointer handler pattern:**

```jsx
const REVEAL_MAX = 96;
const SNAP_THRESHOLD = 72;

const dragRef = useRef({ startX: 0, startY: 0, isDragging: false, isLocked: false });
const [swipeOffset, setSwipeOffset] = useState(0);
const [revealedSide, setRevealedSide] = useState(null); // 'mark-read' | 'delete' | null
const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const handlePointerDown = (e) => {
  if (e.pointerType !== 'touch' || dragRef.current.isLocked) return;
  dragRef.current = { ...dragRef.current, startX: e.clientX, startY: e.clientY, isDragging: true };
  e.currentTarget.setPointerCapture(e.pointerId);
};

const handlePointerMove = (e) => {
  if (!dragRef.current.isDragging) return;
  const deltaX = e.clientX - dragRef.current.startX;
  const deltaY = e.clientY - dragRef.current.startY;
  // Vertical scroll intent — cancel swipe
  if (Math.abs(deltaY) > Math.abs(deltaX) + 10) {
    dragRef.current.isDragging = false;
    setSwipeOffset(0);
    return;
  }
  setSwipeOffset(Math.max(-REVEAL_MAX, Math.min(REVEAL_MAX, deltaX)));
};

const handlePointerUp = (e) => {
  if (!dragRef.current.isDragging) return;
  dragRef.current.isDragging = false;
  const deltaX = e.clientX - dragRef.current.startX;
  if (Math.abs(deltaX) < 10) {
    // Treat as tap
    onTap?.(notification);
    setSwipeOffset(0);
    return;
  }
  if (deltaX <= -SNAP_THRESHOLD) {
    setRevealedSide('delete');
  } else if (deltaX >= SNAP_THRESHOLD && notification.new === 1) {
    setRevealedSide('mark-read');
  } else {
    setRevealedSide(null);
  }
  setSwipeOffset(0);
};
```

**Content layer style:**

```jsx
// Snap position when revealed (override swipeOffset):
const contentOffset =
  revealedSide === 'delete'    ? -REVEAL_MAX :
  revealedSide === 'mark-read' ? REVEAL_MAX  :
  swipeOffset;

const contentStyle = {
  transform: `translateX(${contentOffset}px)`,
  transition: dragRef.current.isDragging || prefersReducedMotion ? 'none' : 'transform 200ms ease-out',
};
```

**Collapse helper (call after any action executes):**

```jsx
const collapse = () => {
  setRevealedSide(null);
  setSwipeOffset(0);
  dragRef.current.isLocked = false;
};
```

---

### Backing Layer Token Reference

| Layer | Tailwind classes | Rationale |
|---|---|---|
| Mark-read (leading, left) | `bg-accent-text text-bg` | Accent green — positive action |
| Delete (trailing, right) | `bg-priority-max text-bg` | Coral red — destructive action |

Both use `absolute top-0 bottom-0 w-24 flex items-center justify-center`.
Mark-read: `left-0`. Delete: `right-0`.

Button inside each layer: `p-3 text-body-sm font-semibold focus:outline-none focus:ring-1 focus:ring-focus-ring rounded-sm` — white text inherited from layer.

Do NOT use a named `Button` component here — these are bespoke backing-layer elements, not standard UI buttons. Inline `<button>` is correct.

---

### SubscriptionManager API (read from `src/app/SubscriptionManager.js`)

```js
// Mark single notification read (sets new: 0 in Dexie)
await subscriptionManager.markNotificationRead(notificationId);

// Delete single notification from Dexie
await subscriptionManager.deleteNotification(notificationId);
```

Import: `import subscriptionManager from "@/app/SubscriptionManager";`
Both are already used in Story 3.4 (`CardOverflowMenu.jsx`) — same singleton, same API.

---

### i18n Key Reference

New keys (add only these 2 — the 3 delete confirm keys come from Story 3.4):

```json
"swipe_mark_read_label": "밀어서 읽음 표시",
"swipe_delete_label":    "밀어서 삭제"
```

**Reused from Story 3.4 (do NOT duplicate):**
```json
"card_overflow_delete_confirm_body":   "이 알림을 삭제할까요?",
"card_overflow_delete_confirm_action": "삭제",
"card_overflow_delete_confirm_cancel": "취소"
```

If Story 3.4 is not yet implemented, these three may not yet be in `ko.json`. In that case, add them here — they will be deduplicated when Story 3.4 runs.

---

### prefers-reduced-motion Contract

| Condition | Behavior |
|---|---|
| `prefers-reduced-motion: no-preference` (default) | Card slides smoothly with `transition: transform 200ms ease-out` |
| `prefers-reduced-motion: reduce` | `transition: none` — card snaps instantly; no CSS animation |
| Both | Action buttons still functional; actions still execute on tap |

Implementation: `window.matchMedia('(prefers-reduced-motion: reduce)').matches` read inline during render (not subscribed). Acceptable because theme changes trigger re-render anyway, and motion preference rarely changes mid-session. No need for a listener.

---

### a11y Behavior

**Tab order:**
- When card is collapsed: backing buttons have `tabIndex={-1}` — invisible to keyboard nav.
- When revealed side === 'mark-read': leading button has `tabIndex={0}`; trailing button stays `-1`.
- When revealed side === 'delete': trailing button has `tabIndex={0}`; leading button stays `-1`.

**Focus management:**
- After mark-read executes: `collapse()` is called; focus stays on the card (already focused).
- After delete Dialog closes (any outcome): `collapse()` is called; focus returns to the card element (Radix Dialog restores focus to the trigger — the backing 삭제 button; `collapse()` then resets that button to `tabIndex={-1}`, so code should move focus to the card wrapper explicitly via `cardRef.current?.focus()` after `collapse()`).

**Screen reader announcement:**
- The two backing buttons with `aria-label` provide screen reader context even when tabIndex controls accessibility.
- When revealed, the button becomes reachable by tab — screen reader will announce "밀어서 읽음 표시 버튼" / "밀어서 삭제 버튼".

---

### Vertical Scroll Conflict — Critical Guard

Cards live inside a scrollable feed. A vertical swipe MUST still scroll the feed, not trigger the card gesture.

Guard in `handlePointerMove`:
```js
if (Math.abs(deltaY) > Math.abs(deltaX) + 10) {
  dragRef.current.isDragging = false;  // cancel swipe
  setSwipeOffset(0);
  return;  // let event propagate for native scroll
}
```

**Do NOT call `e.preventDefault()` on `pointerMove` by default.** Calling `preventDefault` would block native scroll. Only cancel swipe state; leave the event to propagate for the scroll container.

`setPointerCapture` on `pointerDown` is fine — it ensures `pointerMove` and `pointerUp` fire on the element even if the pointer moves outside, which is needed for accurate tracking. But it does NOT prevent scrolling in browsers that implement pointer capture correctly. If you see scroll issues, remove `setPointerCapture` and track globally (complex — prefer keeping capture and testing on device).

---

### Collapse on Outside Tap

When the card is in revealed state and the user taps anywhere else (another card, the feed background), the revealed card should collapse.

Mechanism: add a `useEffect` that listens for `pointerdown` on `document` when `revealedSide !== null`, and calls `collapse()` if the event target is outside the card.

```jsx
useEffect(() => {
  if (!revealedSide) return;
  const handler = (e) => {
    if (!cardRef.current?.contains(e.target)) collapse();
  };
  document.addEventListener('pointerdown', handler);
  return () => document.removeEventListener('pointerdown', handler);
}, [revealedSide]);
```

`cardRef` = `useRef()` attached to the card's root div.

---

### Architecture Boundary Summary

```
src/components/
├── message/
│   ├── NotificationCard.jsx   ← MODIFY — add swipe gesture (no prop API change)
│   └── NotificationCard.test.jsx ← MODIFY — add gesture tests
└── ui/
    ├── Dialog.jsx             ← EXISTING — used for delete confirm
    └── Button.jsx             ← EXISTING — used inside Dialog
```

`message/` → `ui/` imports: ALLOWED.
`message/` → `app/` imports: ALLOWED (`subscriptionManager`).
`ui/` must NOT import from `message/` — ESLint enforces this; no risk here.

---

### Critical Anti-Patterns to Avoid

```jsx
// ✗ Adding a new prop to NotificationCard — G4: signature is frozen
const NotificationCard = ({ ..., onSwipe }) => { ... }  // ✗

// ✗ Calling e.preventDefault() on pointerMove — breaks scroll
handlePointerMove(e) { e.preventDefault(); ... }  // ✗

// ✗ Using a CSS-only solution (no JS state) — can't handle confirm dialog
// Swipe opens dialog → dialog must be JS-driven state

// ✗ Using mouse events (mousedown/mousemove) — mouse drag must NOT trigger swipe
// Use Pointer Events with pointerType guard

// ✗ Adding new gesture library (framer-motion, @use-gesture/react)
// Not in package.json — do NOT add. Pointer Events API is sufficient.

// ✗ Hardcoded Korean in JSX
<button>밀어서 삭제</button>  // ✗ — must go through t()

// ✗ Creating a separate "SwipeableCard" wrapper component
// Keep everything inside NotificationCard.jsx to preserve the slot contract

// ✗ Duplicating delete confirm i18n keys already added by Story 3.4
// Reuse card_overflow_delete_confirm_* — same copy, same UX

// ✗ Setting tabIndex={0} on both backing buttons when only one side is revealed
// Only the revealed side's button should be keyboard-reachable
```

---

### Testing Pattern

```jsx
// NotificationCard.test.jsx — additions for swipe gesture
import { render, screen, fireEvent, act } from "@testing-library/react";

// Mock matchMedia (prefers-reduced-motion)
const mockMatchMedia = (matches) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
};

// Mock subscriptionManager
vi.mock("@/app/SubscriptionManager", () => ({
  default: {
    markNotificationRead: vi.fn(),
    deleteNotification: vi.fn(),
  },
}));

// Simulate swipe left
const swipeLeft = (element, px = 80) => {
  fireEvent.pointerDown(element, { pointerType: 'touch', clientX: 200, clientY: 100, pointerId: 1 });
  fireEvent.pointerMove(element, { pointerType: 'touch', clientX: 200 - px, clientY: 100, pointerId: 1 });
  fireEvent.pointerUp(element, { pointerType: 'touch', clientX: 200 - px, clientY: 100, pointerId: 1 });
};

// Simulate swipe right
const swipeRight = (element, px = 80) => {
  fireEvent.pointerDown(element, { pointerType: 'touch', clientX: 200, clientY: 100, pointerId: 1 });
  fireEvent.pointerMove(element, { pointerType: 'touch', clientX: 200 + px, clientY: 100, pointerId: 1 });
  fireEvent.pointerUp(element, { pointerType: 'touch', clientX: 200 + px, clientY: 100, pointerId: 1 });
};

describe("NotificationCard — swipe gesture", () => {
  const card = { id: "abc", new: 1, message: "test", priority: 3 };

  it("swipe left past threshold reveals delete button (tabIndex 0)", () => {
    const { getByLabelText } = render(<NotificationCard notification={card} />);
    const container = getByLabelText(...); // card root
    swipeLeft(container, 80);
    expect(getByLabelText("swipe_delete_label")).toHaveAttribute("tabindex", "0");
  });

  it("swipe right on unread card reveals mark-read button", () => {
    const { getByLabelText } = render(<NotificationCard notification={card} />);
    swipeRight(getByLabelText(...), 80);
    expect(getByLabelText("swipe_mark_read_label")).toHaveAttribute("tabindex", "0");
  });

  it("swipe right on read card (new=0) does NOT reveal mark-read", () => {
    const readCard = { ...card, new: 0 };
    const { getByLabelText } = render(<NotificationCard notification={readCard} />);
    swipeRight(getByLabelText(...), 80);
    expect(getByLabelText("swipe_mark_read_label")).toHaveAttribute("tabindex", "-1");
  });

  it("mouse drag does NOT reveal actions (pointerType=mouse)", () => {
    const { getByLabelText } = render(<NotificationCard notification={card} />);
    const el = getByLabelText(...);
    fireEvent.pointerDown(el, { pointerType: 'mouse', clientX: 200, clientY: 100 });
    fireEvent.pointerMove(el, { pointerType: 'mouse', clientX: 120, clientY: 100 });
    fireEvent.pointerUp(el, { pointerType: 'mouse', clientX: 120, clientY: 100 });
    expect(getByLabelText("swipe_delete_label")).toHaveAttribute("tabindex", "-1");
  });

  it("small move (<10px) fires onTap instead of revealing", () => {
    const onTap = vi.fn();
    const { getByLabelText } = render(<NotificationCard notification={card} onTap={onTap} />);
    swipeLeft(getByLabelText(...), 5); // tiny move
    expect(onTap).toHaveBeenCalledWith(card);
  });

  it("prefers-reduced-motion: transition is 'none'", () => {
    mockMatchMedia(true); // matches = true for reduced motion
    const { getByLabelText } = render(<NotificationCard notification={card} />);
    swipeLeft(getByLabelText(...), 80);
    // Check content layer has no transition (implementation-specific; assert data-testid style if needed)
  });
});
```

**Note on JSDOM + Pointer Events:** JSDOM supports `fireEvent.pointerDown/Move/Up` via `@testing-library/react`. However, `setPointerCapture` is not implemented in JSDOM and will throw. Add this to your test setup or mock it:

```js
// In test file or vitest setup
HTMLElement.prototype.setPointerCapture = vi.fn();
HTMLElement.prototype.releasePointerCapture = vi.fn();
```

---

### Korean Voice (UX-DR12)

| Copy | Key | Value |
|---|---|---|
| Swipe mark-read aria-label | `swipe_mark_read_label` | "밀어서 읽음 표시" |
| Swipe delete aria-label | `swipe_delete_label` | "밀어서 삭제" |

These labels are for screen readers, not visible text. The backing layer buttons show no text — the colored background + icon (or label) IS the affordance.

If you add visible text inside the backing layer buttons (optional), use the same key values. Calm, minimal — no emoji, no exclamation.

---

### References

- Epic spec: `_bmad-output/planning-artifacts/epics.md` § Story 3.8
- UX-DR17: `_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/EXPERIENCE.md` § Interaction Primitives — "Swipe on mobile cards"
- NFR3 (swipe is never only path): `_bmad-output/planning-artifacts/epics.md` § Story-Creation Guardrails
- G4 (frozen card signature): Story 3.1 AC #5 — `_bmad-output/implementation-artifacts/3-1-notification-card-shell-slot-contract.md`
- NotificationCard prop API: `_bmad-output/implementation-artifacts/3-1-notification-card-shell-slot-contract.md` § Task 4
- CardOverflowMenu delete confirm pattern (reuse): `_bmad-output/implementation-artifacts/3-4-card-overflow-actions-read-copy-delete.md` § CardOverflowMenu Component Architecture
- SubscriptionManager read/delete API: `src/app/SubscriptionManager.js` lines 230–251
- Dialog component API: `src/components/ui/Dialog.jsx` (Story 1.7 output)
- prefers-reduced-motion: `_bmad-output/planning-artifacts/architecture.md` § Motion
- Pointer Events API: MDN — `pointerdown`, `pointermove`, `pointerup`, `setPointerCapture`
- Project context: `_bmad-output/project-context.md` — JS only, no gesture library, `message/` boundary rules

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — implementation proceeded without blockers.

### Completion Notes List

- Implemented full swipe gesture (Pointer Events API, no gesture library) inside `NotificationCard.jsx` as internal state — zero new props, G4 prop signature preserved.
- Two backing layers always in DOM; use inline `position: absolute` style (not Tailwind `absolute` class) to avoid class-attribute selector conflicts with the existing P4/P5 accent-bar tests.
- `Card.jsx` updated with `React.forwardRef` to support `cardRef` for focus restoration after Dialog close.
- `collapse()` helper resets `revealedSide`, `swipeOffset`, and `dragRef.current.isLocked`. `useEffect` wires outside-tap collapse when `revealedSide !== null`.
- Touch tap (<10px move) calls `e.preventDefault()` on `pointerup` to suppress the subsequent synthetic click event, preventing double-fire of `onTap`.
- Delete confirm Dialog reuses all three `card_overflow_delete_confirm_*` i18n keys from Story 3.4 (already in `ko.json` / `en.json` — not duplicated).
- Added 2 new i18n keys to both `ko.json` and `en.json`: `swipe_mark_read_label`, `swipe_delete_label`.
- 40 total tests in `NotificationCard.test.jsx` — all pass; 283 total project tests — all pass, no regressions.

### File List

- `src/components/ui/Card.jsx` — added `React.forwardRef` for cardRef support
- `src/components/message/NotificationCard.jsx` — swipe gesture logic + backing layers + delete Dialog
- `src/components/message/NotificationCard.test.jsx` — swipe gesture tests (14 new tests)
- `public/static/langs/ko.json` — added `swipe_mark_read_label`, `swipe_delete_label`
- `public/static/langs/en.json` — added `swipe_mark_read_label`, `swipe_delete_label`

### Review Findings

- [x] [Review][Patch] Backing buttons self-closing — no content fills the w-24 backing layer, leaving a tiny ~24px tap target [src/components/message/NotificationCard.jsx:202,221]
- [x] [Review][Patch] Pointer capture not released on vertical scroll bail-out — list unscrollable for remainder of that touch [src/components/message/NotificationCard.jsx:110-113]
- [x] [Review][Patch] Outside-click collapse fires when clicking inside delete Dialog portal — collapses card mid-confirm [src/components/message/NotificationCard.jsx:80-91]
- [x] [Review][Patch] iOS Safari: e.preventDefault() on pointerup does not suppress synthetic click — onTap may fire twice [src/components/message/NotificationCard.jsx:122-124]
- [x] [Review][Defer] prefersReducedMotion captured once at render time — not reactive to OS preference changes mid-session [src/components/message/NotificationCard.jsx:77] — deferred, spec only requires correct value on mount; minor a11y quality
- [x] [Review][Defer] dragRef.current.isDragging read during render for contentStyle — ref mutation doesn't trigger re-render, single-tick transition flicker [src/components/message/NotificationCard.jsx:169] — deferred, sub-perceptual on modern devices

### Change Log

- 2026-06-20: Implemented Story 3.8 — mobile card swipe gesture with delete/mark-read backing layers, touch-only Pointer Events handler, prefers-reduced-motion support, a11y tabIndex management, and delete confirm Dialog.
