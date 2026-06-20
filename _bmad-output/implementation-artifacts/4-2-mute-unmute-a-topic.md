---
baseline_commit: 27886bc
---

# Story 4.2: Mute / Unmute a Topic

Status: review

## Story

As Jay,
I want to mute a topic,
so that I control noise without losing its history (FR7).

## Acceptance Criteria

1. **Given** a topic, **when** Jay toggles mute (card header bell OR sidebar row), **then** the change is immediate and optimistic, persists in IndexedDB, and reverts with an inline "재시도" on failure.

2. **And** a muted topic **still receives and stores** notifications but suppresses sound + browser notification (FR7; already enforced by `Notifier.js` checking `mutedUntil > 0` — this just has to stay intact).

3. **And** mute state is reflected consistently on the card bell, sidebar row, and (later) settings — all reading one source (`subscription.mutedUntil` from Dexie via `useLiveQuery`).

4. **And** the card bell toggle carries `aria-pressed` state (already implemented in NotificationCard) and the story uses the **frozen card signature** — **no edits to `NotificationCard.jsx`** (G4).

## Blocking Dependencies

- **Story 3.1** (`NotificationCard` + bell slot with `onMuteToggle` / `isMuted` props) — `done` ✅
- **Story 2.1** (`Sidebar.jsx` subscription rows) — `done` ✅
- **Story 3.3** (`Feed.jsx`) — currently `in-progress`; this story adds mute wiring to Feed.jsx once 3.3 is `done`

> ⚠️ **Note:** 4.2 was created before 4.1. Its `Depends-on` is 3.1 + 2.1 (not 4.1). Story 4.1 (manage subscriptions) is independent and can land in parallel.

## Tasks / Subtasks

- [x] Task 1: Wire `isMuted` + `onMuteToggle` into `Feed.jsx` (AC: #1, #3, #4)
  - [x] In the per-topic branch: derive `isMuted = (subscription?.mutedUntil ?? 0) > 0`
  - [x] In the all-feed branch: derive `isMuted = (subsById[n.subscriptionId]?.mutedUntil ?? 0) > 0`; `subsById` already exists in Feed.jsx
  - [x] Add `handleMuteToggle(sub)` handler — see Dev Notes for exact pattern
  - [x] Pass `isMuted={isMuted}` and `onMuteToggle={() => handleMuteToggle(sub)}` to each `<NotificationCard>` render
  - [x] **Do NOT edit `NotificationCard.jsx`** — its signature already accepts these props (G4)

- [x] Task 2: Update `Sidebar.jsx` subscription rows (AC: #1, #3, #4)
  - [x] Add a `BellOffIcon` SVG inline component (see Dev Notes for SVG)
  - [x] Show `BellOffIcon` in place of `BellIcon` when `sub.mutedUntil > 0`
  - [x] Add a mute-toggle `<button>` inside each subscription row that calls `handleMuteToggle(sub)`, stops propagation so it does NOT navigate
  - [x] Button must have `aria-label={t(sub.mutedUntil ? "sidebar_topic_unmute_label" : "sidebar_topic_mute_label")}` and `aria-pressed={sub.mutedUntil > 0}`
  - [x] Focus styling: same `focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]` pattern as existing buttons
  - [x] Do NOT show the mute button when `collapsed={true}` (icon-rail mode) — only in expanded mode

- [x] Task 3: Add `handleMuteToggle` to both Feed and Sidebar (AC: #1)
  - [x] Pattern (both files): `async function handleMuteToggle(sub) { const next = sub.mutedUntil ? 0 : 1; try { await subscriptionManager.setMutedUntil(sub.id, next); } catch { /* show error */ } }`
  - [x] On catch: set a local `muteError` state string with the subscription id; render an inline "재시도" button next to that row/card
  - [x] `useLiveQuery` auto-reflects the Dexie write — no explicit state update needed on success

- [x] Task 4: Add i18n keys (AC: #1, #3)
  - [x] `public/static/langs/en.json`: add `"sidebar_topic_mute_label": "Mute topic"` and `"sidebar_topic_unmute_label": "Unmute topic"`
  - [x] `public/static/langs/ko.json`: add `"sidebar_topic_mute_label": "토픽 음소거"` and `"sidebar_topic_unmute_label": "토픽 음소거 해제"`
  - [x] Both keys go in the sidebar section, after existing sidebar keys
  - [x] Do NOT add new keys for the card bell — `notification_card_mute_toggle_label` and `notification_card_unmute_toggle_label` already exist in both files

## Dev Notes

### Mute Data Model

The `subscriptions` Dexie table has a `mutedUntil` field:
- `mutedUntil === 0` → **not muted**
- `mutedUntil > 0` → **muted** (value `1` = "muted indefinitely")

**Toggle formula** (from existing `ActionBar.jsx:104`):
```js
const next = subscription.mutedUntil ? 0 : 1;
await subscriptionManager.setMutedUntil(subscription.id, next);
```

This is a **pure Dexie write** — no network call needed. `useLiveQuery` auto-reflects the change. "Optimistic" here means the Dexie write succeeds instantly and the UI updates via live query; the failure path is only if Dexie throws (hardware/storage errors).

### Notifier.js Already Honors Mute — No Changes Needed

`Notifier.js` line 57 checks `subscription.mutedUntil > 0` before firing browser notifications. Do **not** modify `Notifier.js`, `ConnectionManager.js`, `SubscriptionManager.js`, or `Prefs.js`. This story is UI-only.

Similarly, `SubscriptionManager.webPushTopics()` filters muted topics via `where({ mutedUntil: 0 })` — Web Push exclusion is automatic once the Dexie row changes.

### Card Bell Slot Is Already Implemented (G4 — FROZEN)

`NotificationCard.jsx` already accepts `onMuteToggle` and `isMuted`:
```jsx
// NotificationCard.jsx:55-56 (read-only reference)
onMuteToggle,
isMuted,
```
And renders:
```jsx
// NotificationCard.jsx:114-115
aria-label={t(isMuted ? "notification_card_unmute_toggle_label" : "notification_card_mute_toggle_label")}
aria-pressed={isMuted ?? false}
```
**The card component is frozen. Any edits to `NotificationCard.jsx` in this story are a bug.**

### Feed.jsx Changes

Current `Feed.jsx` does NOT pass `isMuted`/`onMuteToggle` to `NotificationCard`. Add them:

```jsx
// For per-topic feed (inside the visible.map):
// subscription is already available from useActiveTopic()
const isMuted = (subscription?.mutedUntil ?? 0) > 0;
const handleMuteToggle = async () => {
  const next = subscription.mutedUntil ? 0 : 1;
  try {
    await subscriptionManager.setMutedUntil(subscription.id, next);
  } catch (e) {
    console.error("[Feed] mute toggle failed", e);
    // optional: surface error state
  }
};

// For all-feed (per-notification):
const notifSub = subsById[n.subscriptionId];
const isMuted = (notifSub?.mutedUntil ?? 0) > 0;
const handleMuteToggle = async () => {
  if (!notifSub) return;
  const next = notifSub.mutedUntil ? 0 : 1;
  try {
    await subscriptionManager.setMutedUntil(notifSub.id, next);
  } catch (e) {
    console.error("[Feed] mute toggle failed", e);
  }
};
```

Pass to the card render:
```jsx
<NotificationCard
  notification={n}
  subscriptionName={subscriptionName}
  showTopicChip={isAllFeed}
  isMuted={isMuted}
  onMuteToggle={handleMuteToggle}
/>
```

The `subsById` map is already built in Feed.jsx for the all-feed. For the per-topic feed, `subscription` is already in scope from `useActiveTopic()`.

> **Simplification option:** For per-topic feed, since all cards share one subscription, you can define `handleMuteToggle` once outside the `.map()` loop.

### Sidebar.jsx Changes

Add a `BellOffIcon` (muted bell with slash) alongside the existing `BellIcon`:
```jsx
const BellOffIcon = ({ className }) => (
  <svg className={cn("w-5 h-5", className)} viewBox="0 0 15 15" fill="currentColor" aria-hidden="true">
    <path d="M1.646 1.646a.5.5 0 0 1 .708 0L13.354 13.354a.5.5 0 0 1-.708.708l-1.293-1.293A3 3 0 0 1 6 13a.5.5 0 1 1 0-1 2 2 0 0 0 1.938-1.496L1.646 2.354a.5.5 0 0 1 0-.708ZM5 6.5V5.56A2.5 2.5 0 0 1 10 5.5v3.44l-5-4.94ZM8.5 12H6a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1H8.5Z" />
  </svg>
);
```

Modify the subscription row to include an inline mute button (collapsed mode: omit). The row is currently:
```jsx
// Sidebar.jsx lines 85-119 — a single <button> that navigates
```

Keep the row navigable by keeping the outer `<button>` for navigation. Add a mute `<button>` as a sibling:
```jsx
{/* inside the subscription row's flex container, after the topic name */}
{!collapsed && (
  <button
    type="button"
    onClick={(e) => { e.stopPropagation(); handleSidebarMuteToggle(sub); }}
    aria-label={t(sub.mutedUntil ? "sidebar_topic_unmute_label" : "sidebar_topic_mute_label")}
    aria-pressed={sub.mutedUntil > 0}
    className="ml-auto p-0.5 rounded-sm text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] transition-colors"
  >
    {sub.mutedUntil ? <BellOffIcon /> : <BellIcon />}
  </button>
)}
```

**Problem:** The existing row is one `<button>` and nested `<button>` is invalid HTML. **Solution:** Wrap the row in a `<div>` with the navigation click handler, or use `role="row"` with separate interactive children. The simplest valid pattern: convert the outer navigation element from `<button>` to a `<div role="button" tabIndex={0}>` and add a separate mute `<button>` as a sibling child.

Or even simpler: keep the outer element as-is and place the mute `<button>` **outside** the outer button, alongside it in a flex wrapper `<div>`:
```jsx
// Replace the outer <button> with a flex wrapper div containing:
// 1. A navigation button (flex-1, existing content)
// 2. A mute toggle button (shrink-0, only in expanded mode)
<div key={sub.id} className="flex items-center gap-1 w-full">
  <button
    type="button"
    onClick={() => navigate(routes.forSubscription(sub))}
    className={cn(
      "flex flex-1 items-center gap-3 px-3 py-2 rounded-sm text-body-sm transition-colors text-left min-w-0",
      "hover:bg-surface",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
      isActive && "bg-surface-2"
    )}
  >
    {/* active dot + icon + topic name + unread count — unchanged */}
  </button>
  {!collapsed && (
    <button
      type="button"
      onClick={() => handleSidebarMuteToggle(sub)}
      aria-label={t(sub.mutedUntil ? "sidebar_topic_unmute_label" : "sidebar_topic_mute_label")}
      aria-pressed={(sub.mutedUntil ?? 0) > 0}
      className="shrink-0 p-1 mr-1 rounded-sm text-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] transition-colors"
    >
      {sub.mutedUntil ? (
        <BellOffIcon className="text-muted" />
      ) : (
        <BellIcon className="text-transparent hover:text-muted" />
      )}
    </button>
  )}
</div>
```

> The mute button in the sidebar should be **low-visibility** by default (transparent or near-transparent bell icon) and highlight on hover — not compete with the unread count badge. Only the `BellOffIcon` state should be persistently visible to signal muted state.

### `handleSidebarMuteToggle` in Sidebar

```js
const handleSidebarMuteToggle = async (sub) => {
  const next = sub.mutedUntil ? 0 : 1;
  try {
    await subscriptionManager.setMutedUntil(sub.id, next);
  } catch (e) {
    console.error("[Sidebar] mute toggle failed", e);
    // Sidebar doesn't have inline error UX yet; a simple console.error is acceptable here
    // since mute failure in Dexie is extremely rare (storage error)
  }
};
```

Note: `subscriptionManager` is already imported in `Sidebar.jsx`.

### i18n Keys Inventory

**Already exist in both en.json and ko.json (do NOT add again):**
- `notification_card_mute_toggle_label` ("Mute notifications" / "알림 끄기")
- `notification_card_unmute_toggle_label` ("Unmute notifications" / "알림 켜기")
- `nav_button_muted` ("Notifications muted" / "알림 음소거됨")

**Must add (not present in either file):**
| Key | English | Korean |
|-----|---------|--------|
| `sidebar_topic_mute_label` | `"Mute topic"` | `"토픽 음소거"` |
| `sidebar_topic_unmute_label` | `"Unmute topic"` | `"토픽 음소거 해제"` |

### Scope Guardrails

- ❌ Do not add a "mute" option to story 4.1's context menu here — that's 4.1's scope
- ❌ Do not modify `Notifier.js`, `SubscriptionManager.js`, `Prefs.js`, `db.js`
- ❌ Do not modify `NotificationCard.jsx` — frozen (G4)
- ✅ The story's "settings" surface for mute (`(later) settings` in AC #3) is deferred to E5 settings story — do NOT implement it here
- ✅ Muted topic continues receiving real-time messages without any code change — handled by existing logic layer

### Project Structure

Files to modify:
- `src/components/Feed.jsx` — wire `isMuted` + `onMuteToggle`
- `src/components/Sidebar.jsx` — add `BellOffIcon`, split nav/mute buttons, add `handleSidebarMuteToggle`
- `public/static/langs/en.json` — 2 new keys
- `public/static/langs/ko.json` — 2 new keys

No new files needed.

### Layer Rules (project-context.md invariants)
- `src/app/` is NOT modified — mute wiring is purely in `src/components/`
- `contexts/` must not import `useLiveQuery` — subscription data from props/useLiveQuery in components
- No hardcoded Korean strings — all copy via `t()` keys
- Token-only styling — `bg-surface`, `text-muted`, `text-accent-text`, `text-text` — no raw hex

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Feed.jsx: Added `FeedCard` props `isMuted`/`onMuteToggle`, `muteError` state with inline retry button via `error` slot. Per-topic handler defined once outside map (`handleTopicMuteToggle`); all-feed handler defined inline per notification. Both throw through — FeedCard catches and shows `notification_action_failed_retry_label` retry button.
- Sidebar.jsx: Added `BellOffIcon` inline SVG component. Subscription rows restructured from single `<button>` to `<div>` + nav-button + mute-button (avoids nested button HTML violation). `handleSidebarMuteToggle` logs to console on failure (Dev Notes: acceptable for rare Dexie errors). Mute button hidden when `collapsed=true`.
- NotificationCard.jsx: NOT modified (G4 frozen constraint satisfied).
- `notification_card_mute_toggle_label` / `notification_card_unmute_toggle_label` already existed — not added again.
- 3 new tests added to `NotificationCard.test.jsx`: `aria-pressed=false` when unmuted, `aria-pressed=true`+unmute label when muted, `onMuteToggle` callback fired on click.
- PublishDialog.test.jsx: 5 pre-existing failures confirmed (not introduced by this story; present before any changes).

### File List

- src/components/Feed.jsx
- src/components/Sidebar.jsx
- src/components/message/NotificationCard.test.jsx
- public/static/langs/en.json
- public/static/langs/ko.json
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/4-2-mute-unmute-a-topic.md

### Change Log

- 2026-06-20: Story 4-2 implemented — mute/unmute wired to Feed.jsx card bell + Sidebar.jsx subscription rows; 2 i18n keys added; 3 new tests added (Date: 2026-06-20)
