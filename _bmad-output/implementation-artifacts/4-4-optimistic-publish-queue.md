---
baseline_commit: 27886bc
---

# Story 4.4: Optimistic Publish Queue

Status: review

## Story

As Jay,
I want my published message to appear instantly and survive a weak signal,
so that publishing from my phone is never lost (FR17).

## Blocking Dependencies

Story 4.4 cannot start until **all** of the following are done:
- **Story 4.3** (`PublishDialog.jsx` Tailwind rebuild, `PublishFab.jsx`) — the submit handler from 4.3's dialog must call `enqueue()` from this story
- **Story 3.1** (`NotificationCard` with frozen `pending`/`error` slots) — optimistic cards fill those slots
- **Story 3.3** (`Feed.jsx`) — feed must exist to render optimistic entries at the top
- **Story 3.5** (`SelectionProvider`) — must already be in `AppProviders.jsx` so `PublishQueueProvider` can be appended after it

Confirm all four are `done` in sprint-status.yaml before starting implementation.

## Acceptance Criteria

1. **Given** a submitted publish from the dialog/sheet (4.3),
   **when** Jay taps "알림 보내기",
   **then** the card appears at the **top** of the current-topic feed immediately (before server ack) via `NotificationCard` with the **pending** slot filled — G4 is in force: zero changes to `NotificationCard.jsx` props.

2. **And** the queue state machine lives entirely in the `PublishQueueContext` reducer (in-memory, never Dexie); three states:
   - `sending` — API request in-flight (spinner + `t("publish_queue_sending")`)
   - `queued` — device offline, will auto-retry on reconnect (`t("publish_queue_queued")`)
   - `failed` — server rejected or network error; **error** slot shows `t("publish_queue_failed")` + "재시도" button; form content retained in queue entry for one-tap resend

3. **And given** the server acks (HTTP 2xx from `api.publish()`),
   **then** the queue entry is dispatched `CLEAR_ENTRY` immediately; the real message arrives naturally via WS/poll → `useLiveQuery` → Feed (no second ledger, no dedup needed).

4. **And given** the send fails (non-2xx or network error),
   **then** the entry moves to `failed`; one tap on "재시도" re-sends using the **same `id`** (idempotent — no new queue entry created, no duplicate card).

5. **And** the Provider uses `useReducer` with `SCREAMING_SNAKE` action types; **no `useState` for queue state**. `usePublishQueue()` throws `"usePublishQueue() must be used inside <PublishQueueProvider>"` when called outside the provider.

6. **And** `PublishQueueProvider` is appended as the innermost provider in `AppProviders.jsx`, after `SelectionProvider`, preserving the immutable provider order: `Theme → Connection → Selection → PublishQueue`.

7. **And** optimistic cards appear before all Dexie cards in the feed, filtered to the active topic (per-topic feed) or unfiltered (all-feed). A dismissed or ACKed queue entry causes its card to disappear from the feed immediately.

8. **And** all user-facing strings in pending/error slots are via `t()`; keys added to both `en.json` and `ko.json`.

## Tasks / Subtasks

- [x] Task 1: Create `src/components/contexts/PublishQueueContext.jsx` (AC: #2, #3, #4, #5)
  - [x] Declare `SCREAMING_SNAKE` action constants at top: `ADD_ENTRY`, `CLEAR_ENTRY`, `MARK_FAILED`, `SET_QUEUED`, `SET_SENDING`
  - [x] Queue entry shape: `{ id: string, baseUrl: string, topic: string, title: string, body: string, priority: number, tags: string, state: 'sending'|'queued'|'failed' }`
  - [x] `publishQueueReducer(state, action)` — initial state `{ entries: [] }`; each action updates entries immutably
  - [x] `PublishQueueProvider({ children })` component:
    - `const [state, dispatch] = useReducer(publishQueueReducer, { entries: [] })`
    - Import and consume `useConnection` — read `connectionState` to decide initial entry state (`'sending'` when connected, `'queued'` when offline)
    - `enqueue(payload)` — `id = crypto.randomUUID()`, dispatch `ADD_ENTRY` with derived state, then call `_sendEntry()` if connected
    - `retry(id)` — dispatch `SET_SENDING`, then call `_sendEntry()` for that id
    - `dismiss(id)` — dispatch `CLEAR_ENTRY` (user closes a failed card without retrying)
    - `_sendEntry(entry)` (internal async) — calls `await api.publish(...)`, on success dispatch `CLEAR_ENTRY`, on failure dispatch `MARK_FAILED`
    - `useEffect` watching `connectionState`: when transitions to `'connected'`, find all `'queued'` entries and dispatch `SET_SENDING` + call `_sendEntry` for each
    - Context value: `{ queue: state.entries, enqueue, retry, dismiss }`
  - [x] `usePublishQueue()` — `const ctx = useContext(PublishQueueContext); if (!ctx) throw new Error("usePublishQueue() must be used inside <PublishQueueProvider>"); return ctx;`
  - [x] **HARD CONSTRAINT: NO `useLiveQuery` import** — ESLint `no-restricted-imports` in `contexts/` enforced
  - [x] **HARD CONSTRAINT: NO `useState` for queue state** — only `useReducer` (arch-enforced)
  - [x] `api.publish()` already handles auth internally — call as `api.publish(entry.baseUrl, entry.topic, entry.body, { title: entry.title || undefined, priority: entry.priority !== 3 ? entry.priority : undefined, tags: entry.tags || undefined })`

- [x] Task 2: Append `PublishQueueProvider` to `AppProviders.jsx` (AC: #6)
  - [x] Verify `SelectionProvider` (from 3.5) is already present
  - [x] Replace the comment `{/* 4.4: PublishQueueProvider appended here */}` with `<PublishQueueProvider>{children}</PublishQueueProvider>` as the innermost wrapper inside `SelectionProvider`
  - [x] Import `{ PublishQueueProvider }` from `@/components/contexts/PublishQueueContext`
  - [x] Do NOT restructure any existing provider — append-only per the `PROVIDER ORDER` comment

- [x] Task 3: Wire `enqueue()` into `PublishDialog.jsx` (from 4.3) (AC: #1, #4)
  - [x] Import `usePublishQueue` from `@/components/contexts/PublishQueueContext`
  - [x] In the dialog's submit handler, call `usePublishQueue().enqueue({ baseUrl, topic, title, body, priority, tags })` — do NOT call `api.publish()` directly from the dialog
  - [x] Close the dialog immediately after `enqueue()` (no await — optimistic close)
  - [x] On retry (from the feed error slot), the queue re-sends; the dialog does not reopen

- [x] Task 4: Update `src/components/Feed.jsx` to render optimistic entries (AC: #1, #7)
  - [x] Import `usePublishQueue` from `@/components/contexts/PublishQueueContext`
  - [x] `const { queue } = usePublishQueue()`
  - [x] Derive `optimisticEntries`:
    - Per-topic feed: `queue.filter(e => e.topic === subscription.topic && e.baseUrl === subscription.baseUrl)`
    - All-feed (`!subscription`): all queue entries
  - [x] Build a `syntheticNotification` for each optimistic entry (see Dev Notes for exact shape)
  - [x] Render optimistic `<NotificationCard>` items **before** the Dexie notification list; pass:
    - `notification={syntheticNotification}`
    - `subscriptionName` — derive from subscription lookup by baseUrl+topic
    - `isSelected={false}`
    - `onTap={() => {}}` (noop — optimistic cards are not selectable)
    - `body={null}`
    - `pending={entry.state !== 'failed' ? <SendingIndicator state={entry.state} /> : null}`
    - `error={entry.state === 'failed' ? <RetryBar id={entry.id} /> : null}`

- [x] Task 5: Create pending/error slot components (AC: #2, #4, #8)
  - [x] Co-locate in `src/components/message/QueueSlots.jsx` (keeps domain UI together; `message/` is the right layer)
  - [x] `SendingIndicator({ state })`:
    - `state === 'sending'`: small spinner SVG + `t("publish_queue_sending")`, `text-muted` token
    - `state === 'queued'`: `t("publish_queue_queued")`, `text-muted` token, no spinner
    - Tailwind tokens only (`text-muted`, `text-sm`); use `cn()` from `@/components/ui/utils`
  - [x] `RetryBar({ id })`:
    - Import `usePublishQueue`; call `retry(id)` and `dismiss(id)` from it
    - Layout: `t("publish_queue_failed")` text + `<Button variant="ghost" size="sm" onClick={() => retry(id)}>t("publish_queue_retry")</Button>` + `<Button variant="ghost" size="sm" aria-label={t("publish_queue_dismiss_label")} onClick={() => dismiss(id)}>×</Button>`
    - Import `Button` from `@/components/ui/Button`
    - `aria-label` on retry button: `t("publish_queue_retry_label")`
  - [x] Export both; import into `Feed.jsx`

- [x] Task 6: Add i18n keys (AC: #8)
  - [x] `public/static/langs/en.json` — add under publish section:
    - `"publish_queue_sending"`: `"Sending…"`
    - `"publish_queue_queued"`: `"Queued"`
    - `"publish_queue_failed"`: `"Send failed"`
    - `"publish_queue_retry"`: `"Retry"`
    - `"publish_queue_dismiss_label"`: `"Dismiss failed notification"`
    - `"publish_queue_retry_label"`: `"Retry sending notification"`
  - [x] `public/static/langs/ko.json` — same keys:
    - `"publish_queue_sending"`: `"보내는 중…"`
    - `"publish_queue_queued"`: `"대기 중"`
    - `"publish_queue_failed"`: `"전송 실패"`
    - `"publish_queue_retry"`: `"재시도"`
    - `"publish_queue_dismiss_label"`: `"실패한 알림 닫기"`
    - `"publish_queue_retry_label"`: `"알림 재전송"`

- [x] Task 7: Write tests for `PublishQueueContext.jsx` (AC: #2–#5)
  - [x] Co-locate: `src/components/contexts/PublishQueueContext.test.jsx`
  - [x] Vitest + `@testing-library/react` (see ConnectionContext.test.jsx for the project test pattern)
  - [x] `vi.mock('@/app/Api', () => ({ default: { publish: vi.fn() } }))` at top
  - [x] Also mock `./ConnectionContext`: `vi.mock('./ConnectionContext', () => ({ useConnection: () => ({ connectionState: 'connected' }) }))`
  - [x] Test cases:
    - reducer: `ADD_ENTRY` → entry appears with correct state
    - reducer: `CLEAR_ENTRY` → entry removed from state
    - reducer: `MARK_FAILED` → entry state is `'failed'`
    - reducer: `SET_QUEUED` → entry state is `'queued'`
    - reducer: `SET_SENDING` → entry state is `'sending'`
    - provider: `enqueue()` → calls `api.publish()` with correct args
    - provider: on `api.publish()` resolve → dispatches `CLEAR_ENTRY`
    - provider: on `api.publish()` reject → dispatches `MARK_FAILED`
    - provider: `retry()` → re-calls `api.publish()` with same id, dispatches `SET_SENDING`
    - provider: `dismiss()` → dispatches `CLEAR_ENTRY` without API call
    - hook: `usePublishQueue()` outside provider → throws expected error message

## Dev Notes

### Architecture Hard Rules
- **`contexts/` may NOT import `useLiveQuery`** — ESLint `no-restricted-imports` enforced. PublishQueueContext is a pure in-memory state machine; Dexie is updated by the logic layer after WS/poll arrives.
- **`useReducer` only for queue state, never `useState`** — arch-enforced pattern for cross-cutting contexts.
- **`SCREAMING_SNAKE` action types** — all action type strings must be `UPPER_SNAKE_CASE`.
- **G4 frozen card API** — `NotificationCard` accepts `{ pending, error, body, ...}` slots defined in 3.1; do NOT add any new props to it.
- **Provider order is append-only** — `AppProviders.jsx` comment says "PROVIDER ORDER — append-only. Never restructure."
- **No hardcoded Korean** — all strings via `t()` (ESLint `no-literal-string` enforced).
- **Tokens only** — Tailwind classes resolving to `@theme` tokens; no raw hex/px in slot components.

### ConnectionContext Pattern (reference implementation)
`PublishQueueContext.jsx` must follow the same structural pattern as `src/components/contexts/ConnectionContext.jsx`:
```js
import { createContext, useContext, useReducer, useEffect } from 'react';

const PublishQueueContext = createContext(null);

export const publishQueueReducer = (state, action) => {
  switch (action.type) {
    case ADD_ENTRY: ...
    default: return state;
  }
};

export const PublishQueueProvider = ({ children }) => {
  const [state, dispatch] = useReducer(publishQueueReducer, { entries: [] });
  const { connectionState } = useConnection();  // OK — context-to-context is allowed
  // ... effects, helper fns ...
  return (
    <PublishQueueContext.Provider value={{ queue: state.entries, enqueue, retry, dismiss }}>
      {children}
    </PublishQueueContext.Provider>
  );
};

export const usePublishQueue = () => {
  const ctx = useContext(PublishQueueContext);
  if (!ctx) throw new Error('usePublishQueue() must be used inside <PublishQueueProvider>');
  return ctx;
};
```

### AppProviders.jsx — Expected State After 3.5 + 4.4
```jsx
const AppProviders = ({ children }) => (
  <ThemeProvider>
    {/* PROVIDER ORDER — append-only. Never restructure. */}
    <Suspense fallback={null}>
      <BrowserRouter>
        <HasDataBridge>
          <SelectionProvider>          {/* 3.5 */}
            <PublishQueueProvider>     {/* 4.4 — NEW */}
              {children}
            </PublishQueueProvider>
          </SelectionProvider>
        </HasDataBridge>
      </BrowserRouter>
    </Suspense>
  </ThemeProvider>
);
```

### `api.publish()` Call Signature
`src/app/Api.js` lines ~32–48 — already exists, do NOT modify the method itself:
```js
// existing signature:
async publish(baseUrl, topic, message, options) { ... }
// auth is handled internally via userManager.get(baseUrl)
```
Call from the queue context:
```js
await api.publish(
  entry.baseUrl,
  entry.topic,
  entry.body,
  {
    title: entry.title || undefined,
    priority: entry.priority !== 3 ? entry.priority : undefined,
    tags: entry.tags || undefined,
  }
);
```

### Synthetic Notification Object (for optimistic Feed cards)
The `NotificationCard` `notification` prop expects a raw Dexie row shape. For optimistic entries:
```js
const syntheticNotification = {
  id: `optimistic-${entry.id}`,    // prefix avoids collision with real Dexie integer ids
  title: entry.title,
  message: entry.body,
  priority: entry.priority,
  tags: entry.tags ? entry.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
  time: Math.floor(Date.now() / 1000),
  new: 0,                          // optimistic cards are not "unread"
  subscriptionId: subscription?.id ?? null,
};
```
Do NOT pass `sequenceId` — ordering within optimistic cards is insertion order (they sit above all Dexie cards regardless).

### Reconciliation Rule — No Second Ledger
On success (`api.publish()` resolves):
1. Dispatch `CLEAR_ENTRY` → queue entry and its optimistic card disappear
2. Server pushes the published message back via WS/poll → `hooks.js` → SubscriptionManager → Dexie → `useLiveQuery` → Feed renders the real card automatically
3. Do NOT try to match the optimistic entry to the arriving Dexie message by content or id — the server assigns its own id. Accept the brief moment where no card appears between CLEAR and WS arrival (~100ms typical).

### Offline / Queued State Wiring
```js
useEffect(() => {
  if (connectionState !== CONN_STATES.CONNECTED) return;
  const queued = state.entries.filter(e => e.state === 'queued');
  if (queued.length === 0) return;
  queued.forEach(entry => {
    dispatch({ type: SET_SENDING, id: entry.id });
    _sendEntry(entry);  // fire and forget; dispatch on resolve/reject
  });
}, [connectionState]);
```
Import `{ CONN_STATES }` from `./ConnectionContext`.

### Feed.jsx Integration Guard
When accessing `usePublishQueue()` in Feed.jsx, it must already be inside `<PublishQueueProvider>` (guaranteed by provider nesting). No null-check needed, but if the provider is somehow missing, the hook throws clearly.

### File List (all files touched by this story)
- **NEW**: `src/components/contexts/PublishQueueContext.jsx`
- **NEW**: `src/components/contexts/PublishQueueContext.test.jsx`
- **NEW**: `src/components/message/QueueSlots.jsx`
- **UPDATED**: `src/components/AppProviders.jsx` — append `PublishQueueProvider`
- **UPDATED**: `src/components/Feed.jsx` (from 3.3) — read queue, render optimistic cards
- **UPDATED**: `src/components/PublishDialog.jsx` (from 4.3) — call `enqueue()` in submit handler
- **UPDATED**: `public/static/langs/en.json` — 6 new keys
- **UPDATED**: `public/static/langs/ko.json` — 6 new keys

### Project Structure Notes
- `src/components/contexts/` — correct home for `PublishQueueContext.jsx` per architecture directory map
- `src/components/message/` — correct home for `QueueSlots.jsx`; domain display components live here
- `ui/ → message/` import direction is forbidden (ESLint `no-restricted-paths`); `QueueSlots.jsx` MAY import from `ui/` (Button, etc.) but `ui/StatePanel.jsx` must never import from `message/`
- All new files are `.jsx` JavaScript — no TypeScript, no type annotations

### References
- Provider order: [`architecture.md` lines ~600–650](../_bmad-output/planning-artifacts/architecture.md)
- Queue state machine: [`architecture.md` lines 473–481](../_bmad-output/planning-artifacts/architecture.md)
- G4 frozen slot API: [`3-1-notification-card-shell-slot-contract.md` AC #5](./3-1-notification-card-shell-slot-contract.md)
- Context reducer pattern: [`src/components/contexts/ConnectionContext.jsx`](../../src/components/contexts/ConnectionContext.jsx)
- `api.publish()`: [`src/app/Api.js` lines ~32–48](../../src/app/Api.js)
- UX mobile publish flow: [`EXPERIENCE.md` — Flow 3](../_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/EXPERIENCE.md)
- AppProviders current state: [`src/components/AppProviders.jsx`](../../src/components/AppProviders.jsx)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Created `PublishQueueContext.jsx` with `publishQueueReducer` (5 SCREAMING_SNAKE action types), `PublishQueueProvider` (useReducer, no useState for queue state), and `usePublishQueue()` guard hook. Zero useLiveQuery imports per arch constraint.
- `PublishQueueProvider` appended as innermost provider inside `SelectionProvider` in `AppProviders.jsx` — provider order: Theme → ConnectionProvider → SelectionProvider → PublishQueueProvider → children.
- `PublishDialog.jsx` now calls `enqueue()` synchronously instead of `api.publish()`. Dialog closes immediately (optimistic). Removed error/submitting state — errors surface via the feed's RetryBar.
- `Feed.jsx` renders optimistic cards before Dexie cards for both per-topic and all-feed. Synthetic notification shape matches Dexie row structure. `SendingIndicator` / `RetryBar` passed as `pending` / `error` slots.
- `QueueSlots.jsx` created in `message/` layer: `SendingIndicator` (spinner + t() string) and `RetryBar` (retry + dismiss buttons via usePublishQueue).
- 6 i18n keys added to both en.json and ko.json.
- 12 tests written and passing for `PublishQueueContext` (reducer, provider behaviour, guard hook). `PublishDialog.test.jsx` updated to mock `usePublishQueue` and verify optimistic enqueue flow. All 360 tests pass.

### File List

- NEW: src/components/contexts/PublishQueueContext.jsx
- NEW: src/components/contexts/PublishQueueContext.test.jsx
- NEW: src/components/message/QueueSlots.jsx
- UPDATED: src/components/AppProviders.jsx
- UPDATED: src/components/Feed.jsx
- UPDATED: src/components/PublishDialog.jsx
- UPDATED: src/components/PublishDialog.test.jsx
- UPDATED: public/static/langs/en.json
- UPDATED: public/static/langs/ko.json

### Review Findings

- [x] [Review/Patch] isEmpty ignores optimistic entries — DataBoundary renders empty-state over pending cards [Feed.jsx:96] — **fixed**
- [x] [Review/Patch] Stale closure in reconnect useEffect — queued entries not flushed on reconnect [PublishQueueContext.jsx:78] — **fixed** (useRef entriesRef pattern)
- [x] [Review/Patch] showTopicChip missing on optimistic all-feed cards [Feed.jsx:163] — **fixed**
- [x] [Review/Patch] Dismiss button × hardcoded, not via t() — AC#8 [QueueSlots.jsx:50] — **fixed** (publish_queue_dismiss key added)
- [x] [Review/Patch] time computed at render, not at enqueue — stale timestamp [Feed.jsx:157] — **fixed** (enqueuedAt stored in entry)
- [x] [Review/Patch] tags whitespace-only string sent raw to API [PublishQueueContext.jsx:53] — **fixed** (entry.tags?.trim())
- [x] [Review/Defer] Zombie "sending" entry if TCP drops mid-flight without HTTP error — stuck spinner [PublishQueueContext.jsx:44] — deferred, inherent network limitation, out of scope
- [x] [Review/Defer] Retry double-click sends two concurrent requests [QueueSlots.jsx:36] — deferred, cosmetic race, acceptable for v1
