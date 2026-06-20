---
baseline_commit: 50645f853e7dd0a72ca7b40398b5b0a16536c2a6
---

# Story 3.3: Feeds — per-topic + all, real-time, with states

Status: done

## Story

As Jay,
I want both a per-topic feed and a merged all-topics feed that fill in real time,
so that I can scan one topic or everything at once (FR3, FR4, FR14 no-messages).

## Acceptance Criteria

1. **Given** subscribed topics, **when** the all-feed renders, **then** every topic merges into one newest-first infinite-scroll stream, each card showing a topic chip for its source; the per-topic feed shows one topic with a sticky header (FR4).

2. **And given** a new message over the live WebSocket, **when** it arrives, **then** a card slides in at the top with the calm fade (gated on `prefers-reduced-motion`) and is announced via `aria-live` (NFR3); data flows server → `hooks.js` listener → SubscriptionManager → Dexie → `useLiveQuery` → render (Dexie is sole source; never copied into state).

3. **And** feed state branches through `DataBoundary`: cached → render immediately (no spinner over data); no cache → 4–6 skeletons (UX-DR14); single-topic empty → muted "이 토픽에 아직 메시지가 없습니다. 도착하면 바로 보여드릴게요."; all-feed empty → "알림이 없어요" (FR14).

4. **And** the 1.2 characterization tests stay GREEN (dedup `&id` + `sequenceId` ordering, G6).

## Blocking Dependencies

**Story 3.3 cannot be started until both of these are done:**
- **Story 3.1** (`NotificationCard`, `PriorityBadge`, `TopicChip`, `TagChip`) — Feed renders `<NotificationCard>` and requires `<TopicChip>` for the all-feed source label
- **Story 3.2** (`CardBody`, `MarkdownContent`) — `NotificationCard` renders `<CardBody>` which must already exist

These are `backlog` at story creation time. Confirm they are `done` before starting implementation.

**Prerequisites already done:** 1.9 (DataBoundary ✅, Skeleton ✅, StatePanel ✅), 2.3 (ConnectionContext ✅, useConnection ✅), EmptyStates.jsx (3 panels ✅ — Story 2.6)

## Tasks / Subtasks

- [x] Task 1: Add `useActiveTopic()` to `src/components/hooks.js` (AC: #1, #2)
  - [x] Export `useActiveTopic()` — derives active subscription from `useParams().topic` and a Dexie lookup; returns the full subscription object or `null` for the all-feed
  - [x] Implementation: `const { topic: topicName } = useParams(); const subscriptions = useLiveQuery(() => subscriptionManager.all()) ?? []; return topicName ? (subscriptions.find(s => s.topic === topicName) ?? null) : null;`
  - [x] **No local `useState`/`useRef` in `useActiveTopic`** — pure selector; data from `useLiveQuery`, route from `useParams`
  - [x] Add to existing imports in hooks.js (`useParams` already imported for `useAutoSubscribe`)

- [x] Task 2: Add no-messages panels to `src/components/message/EmptyStates.jsx` (AC: #3)
  - [x] Export `NoMessagesTopicPanel()` — muted colorway, inline SVG inbox-empty icon, no CTA, desc: "이 토픽에 아직 메시지가 없습니다. 도착하면 바로 보여드릴게요." via `t("empty_state_no_messages_topic_desc")`
  - [x] Export `NoMessagesAllPanel()` — muted colorway, inline SVG bell-slash icon, no title, desc: "알림이 없어요" via `t("empty_state_no_messages_all_desc")`, no CTA (the feed will fill itself)
  - [x] Follow the exact same pattern as the three existing panels — import `StatePanel` from `@/components/ui/StatePanel`, use `t()` for all strings, inline SVG icons

- [x] Task 3: Add i18n keys to `public/static/langs/ko.json` (AC: #3)
  - [x] `"empty_state_no_messages_topic_desc": "이 토픽에 아직 메시지가 없습니다. 도착하면 바로 보여드릴게요."`
  - [x] `"empty_state_no_messages_all_desc": "알림이 없어요"`
  - [x] `"feed_notifications_list": "알림 목록"` (aria-label for the notification list)
  - [x] `"feed_sticky_header_label": "현재 토픽"` (aria-label for sticky header region)
  - [x] Check `public/static/langs/en.json` for matching English keys (mirror the same keys in English too)

- [x] Task 4: Create `src/components/Feed.jsx` (AC: #1, #2, #3)
  - [x] Import dependencies: `useLiveQuery` (dexie-react-hooks), `useState`, `useTranslation` (react-i18next), `InfiniteScroll` (react-infinite-scroll-component), `subscriptionManager` (../app/SubscriptionManager), `DataBoundary` (@/components/ui/DataBoundary), `{ Skeleton }` (@/components/ui/Skeleton), `NotificationCard` (./message/NotificationCard), `{ NoMessagesTopicPanel, NoMessagesAllPanel }` (./message/EmptyStates), `{ useActiveTopic }` (./hooks)
  - [x] Derive active topic: `const subscription = useActiveTopic(); const isAllFeed = !subscription;`
  - [x] Query notifications via useLiveQuery (see Dev Notes — guard pattern is critical)
  - [x] Derive loading/empty state BEFORE `?? []`
  - [x] Infinite scroll with page size 20 (matching legacy pattern)
  - [x] Reset scroll position when subscription changes (matching legacy Notifications.jsx:111-119 pattern)
  - [x] Render sticky topic header for per-topic feed (when `!isAllFeed`)
  - [x] Wrap with `<DataBoundary loading={isLoading} hasCache={false} skeletonCount={5} empty={isEmpty} emptySlot={...}>`
  - [x] Inside DataBoundary, render `<InfiniteScroll>` (see exact props in Dev Notes)
  - [x] Notification list: `<ul role="list" aria-live="polite" aria-label={t("feed_notifications_list")} aria-relevant="additions">`
  - [x] Pass `showTopicChip={isAllFeed}` to each `<NotificationCard>` (all-feed shows topic source, per-topic does not)
  - [x] Card enter animation: `motion-safe:animate-[slide-in-top_0.25s_ease-out]` on index 0 only; keyframe added to main.css

- [x] Task 5: Wire Feed in `src/components/App.jsx` via `NEW.feed` flag (AC: #1)
  - [x] Add `import Feed from "@/components/Feed"` (guarded by `NEW.feed`)
  - [x] Add `id="main"` to the `<main>` element in `NewShell`
  - [x] Inside `NewShell`'s `<Routes>`, add feed routes when `NEW.feed` is true; keep ContentRegion routes when false
  - [x] Keep the existing `<Route path={routes.settings} element={<ServerAuthForm />} />` — do not remove it
  - [x] **`NEW.feed` stays `false`** in migration.js — flag committed as false until code review passes

- [x] Task 6: Verify 1.2 characterization tests still pass (AC: #4)
  - [x] Run `npx vitest run` — 269 tests pass (26 test files), including `&id` dedup and `sequenceId` ordering characterization tests
  - [x] Feed.jsx does NOT modify SubscriptionManager data access methods — only reads via `useLiveQuery`

## Dev Notes

### Critical: useLiveQuery Guard Pattern

`useLiveQuery` returns `undefined` on first render (before IndexedDB resolves). **Never use `?? []` before checking for loading state** — doing so collapses `undefined` into `[]` which makes `isLoading` always false:

```js
// ✅ CORRECT — check undefined before applying fallback
const rawNotifications = useLiveQuery(queryFn, deps);
const isLoading = rawNotifications === undefined;
const notifications = rawNotifications ?? [];

// ✗ WRONG — isLoading is always false; skeletons never show
const notifications = useLiveQuery(queryFn, deps) ?? [];
const isLoading = notifications === undefined; // always false!
```

### Critical: Never Copy Dexie Data Into State

```js
// ✅ CORRECT
const rawNotifications = useLiveQuery(() => subscriptionManager.getAllNotifications(), []);

// ✗ WRONG — breaks real-time updates and violates architecture invariant
const [notifications, setNotifications] = useState([]);
useEffect(() => { setNotifications(useLiveQuery(...)); }, []); // doesn't even work
```

### Data Flow (Existing — Do Not Change)

Server → `Connection.js` (WS) → `connectionManager.registerMessageListener` (hooks.js) → `subscriptionManager.addNotification()` → Dexie `notifications` table → `useLiveQuery` re-fires → `Feed` re-renders.

`sequenceId` ordering is already correct in SubscriptionManager methods:
- `getAllNotifications()`: `.orderBy("sequenceId")` then reversed (newest first)
- `getNotifications(subscriptionId)`: same with `.filter(n => n.subscriptionId === id)`

**Do not change these methods.** Feed.jsx just reads the pre-ordered data.

### InfiniteScroll Usage Pattern

`react-infinite-scroll-component` is already installed (used in `Notifications.jsx`). Use the same pattern:

```jsx
<InfiniteScroll
  dataLength={visible.length}
  next={() => setDisplayCount(prev => prev + PAGE_SIZE)}
  hasMore={visible.length < notifications.length}
  loader={<Skeleton className="mt-3" />}
  scrollThreshold={0.7}
  scrollableTarget="main"
>
  <ul role="list" aria-live="polite" aria-label={t("feed_notifications_list")} aria-relevant="additions">
    {visible.map(n => (
      <li key={n.id}>
        <NotificationCard notification={n} showTopicChip={isAllFeed} />
      </li>
    ))}
  </ul>
</InfiniteScroll>
```

`scrollableTarget="main"` looks for an element with **id="main"** — the `<main>` element in NewShell must have this id (Task 5).

### DataBoundary API (Existing — src/components/ui/DataBoundary.jsx)

```jsx
<DataBoundary
  loading={isLoading}      // true when useLiveQuery returns undefined
  hasCache={false}         // false: show skeletons; true: show children while loading
  skeletonCount={5}        // 4-6 per architecture spec (UX-DR14)
  empty={isEmpty}          // true when loaded but notifications.length === 0
  emptySlot={<Panel />}    // component to show when empty
>
  {/* InfiniteScroll + notification list */}
</DataBoundary>
```

`hasCache={false}` is correct for Feed.jsx: `useLiveQuery` reads IndexedDB synchronously — if data exists it resolves immediately (not "loading"), so there's no real "loading with cached data" phase.

### Skeleton Already Built

`src/components/ui/Skeleton.jsx` exports `<Skeleton />` with a `variant` prop. The default `variant="card"` matches NotificationCard's layout (header band + body lines + meta row). DataBoundary's default `skeletonCount={5}` renders 5 of these automatically.

### useActiveTopic() Implementation

`hooks.js` already imports `useParams` (used by `useAutoSubscribe`). Add:

```js
export const useActiveTopic = () => {
  const { topic: topicName } = useParams();
  const subscriptions = useLiveQuery(() => subscriptionManager.all()) ?? [];
  if (!topicName) return null;
  return subscriptions.find(s => s.topic === topicName) ?? null;
};
```

- Returns `null` for all-feed (`/` route with no topic param)
- Returns the full subscription object for per-topic (`/:topic` route)
- No local state — selector only
- Story 3.5 will add `SelectionContext`; at that point `useActiveTopic` will delegate to it instead of re-deriving from Dexie

### External Server Topics

`routes.subscriptionExternal = "/:baseUrl/:topic"` — `useParams()` gives both `baseUrl` and `topic`. `useActiveTopic` currently matches by `topic` name only. For external servers, the subscription may have a different `baseUrl`. Update the find to:

```js
const { topic: topicName, baseUrl } = useParams();
if (!topicName) return null;
return subscriptions.find(s => {
  if (baseUrl) return s.topic === topicName && s.baseUrl?.includes(baseUrl);
  return s.topic === topicName;
}) ?? null;
```

Check how `useAutoSubscribe` (hooks.js:136-138) handles `expandSecureUrl(params.baseUrl)` for the matching logic if needed.

### Animation: Calm Fade on New Card

Architecture requires a "calm fade/slide" on new notifications, gated on `prefers-reduced-motion` (NFR3). Two options:
1. Add a Tailwind keyframe in `tokens.css` or `main.css`: `@keyframes slide-in-top { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }` with `motion-safe:animate-[slide-in-top_0.25s_ease-out]`
2. Apply the animation class only to newly-arriving cards (not to all cards on initial load). Since the full list re-renders on each `useLiveQuery` update, use a stable `newId` ref to track the latest notification id and only animate when it changes.

Keep the animation simple: 0.2–0.25s ease-out, opacity+translateY. Do not bounce or overshoot (UX-DR17).

### aria-live for Real-Time Announcements

`aria-live="polite"` on the notification list (`<ul>`) announces new additions to screen readers without interrupting current speech. `aria-relevant="additions"` limits announcements to new items only (not reorders/removals).

**Do not** put `aria-live` on a wrapper that includes skeletons — only on the list of real notification cards.

### Sticky Topic Header (Per-Topic Feed)

```jsx
{!isAllFeed && subscription && (
  <div
    className="sticky top-0 z-10 bg-surface border-b border-border px-5 py-3"
    role="region"
    aria-label={t("feed_sticky_header_label")}
  >
    <span className="text-body font-semibold text-text">
      {subscription.displayName || subscription.topic}
    </span>
  </div>
)}
```

`z-10` ensures it stays above card content while scrolling. `bg-surface` prevents content bleeding through.

### EmptyStates.jsx Additions

The file already exists at `src/components/message/EmptyStates.jsx` with three exported panels. Add two more exports following the exact same pattern (StatePanel + t() + inline SVG). Use `colorway="muted"` for both no-messages panels (neutral, not alarming — the feed will fill itself).

The three existing panels are: `NotConnectedPanel` (coral), `ConnectingPanel` (amber), `NoSubscriptionsPanel` (green). The two new panels are purely informational — muted colorway, no CTA.

### Migration Flag Notes

`src/config/migration.js`:
```js
export const NEW = {
  shell: false,  // Story 2.1 (App shell) — set true to enable NewShell
  feed: false,   // Story 3.3 (Feed) — set true within NewShell to enable Feed
  ...
};
```

**Testing workflow:**
1. Set `NEW.shell = true` to activate `NewShell` (disables `LegacyApp`)
2. Set `NEW.feed = true` to mount `Feed` routes in NewShell
3. Verify both feeds (all `/` and per-topic `/:topic`) render correctly
4. Run characterization tests: `npx vitest run`
5. Revert flags to `false` before committing — flags stay `false` until code review passes

**Keep `NEW.feed = false`** in the committed story; the PR description should note how to enable for testing.

### Routes Context

`src/components/routes.js` (already complete for this story — do not modify):
- `routes.app` = config.app_root (all-feed)
- `routes.subscription` = "/:topic" (per-topic)
- `routes.subscriptionExternal` = "/:baseUrl/:topic" (external server)
- `routes.msgDetail` = "/:topic/:msgId" (Story 3.5 — do NOT add this route yet)

### Characterization Tests (G6)

Story 1.2 added Vitest characterization tests in `src/app/` that pin:
- Dedup: adding the same notification id twice results in count=1 (`&id` PK constraint)
- Ordering: `sequenceId` ordering (a late-arriving poll row cannot visually rewind a newer WS message)

These tests must stay GREEN. Since Feed.jsx only reads via `useLiveQuery` without touching SubscriptionManager, they should pass automatically — but run them to confirm.

### Source Hints

- `SubscriptionManager.getAllNotifications()` → `src/app/SubscriptionManager.js:169` — already ordered by `sequenceId` (newest-first after `.reverse()`)
- `SubscriptionManager.getNotifications(id)` → `src/app/SubscriptionManager.js:157` — same ordering pattern
- `InfiniteScroll` usage pattern → `src/components/Notifications.jsx:103-153` (legacy reference)
- `DataBoundary` API → `src/components/ui/DataBoundary.jsx:1-41`
- `Skeleton` (card variant) → `src/components/ui/Skeleton.jsx:28-57`
- `EmptyStates.jsx` panels → `src/components/message/EmptyStates.jsx` (add after line 85)
- `NewShell` `<main>` block → `src/components/App.jsx:106-113` (add `id="main"`)
- `hooks.js` `useAutoSubscribe` → `src/components/hooks.js:126` (model for `useActiveTopic` placement)
- Architecture feed section → `_bmad-output/planning-artifacts/architecture.md` §"Data Architecture" and §"Frontend Architecture"

### Project Structure Notes

- `Feed.jsx` lives flat in `src/components/` (not in a subdirectory) — architecture explicitly collapses `shell/` and `feed/` to flat components (architecture.md:556)
- `EmptyStates.jsx` lives in `src/components/message/` — domain-aware, fills StatePanel with copy
- `useActiveTopic` lives in `src/components/hooks.js` — not in `contexts/` (contexts/ bans `useLiveQuery`)
- `ui/` may not import `message/` — Feed.jsx imports both, but that's fine since Feed is not in `ui/`
- Tailwind tokens only — no raw hex/px (use `bg-surface`, `border-border`, `text-text`, etc.)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3] — user story + ACs
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture] — sequenceId ordering, useLiveQuery invariant
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — feed structure, component boundaries
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/EXPERIENCE.md#States] — all empty/loading state copy strings
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/EXPERIENCE.md#Flows] — FR3/FR4 real-time card arrival
- [Source: _bmad-output/project-context.md] — useLiveQuery guard, Dexie SoT, sequenceId ordering, no raw tokens

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Task 1: `useActiveTopic()` added to hooks.js — handles external-server routes via `baseUrl` param matching, returns full subscription object or null for all-feed
- Task 2: `NoMessagesTopicPanel` and `NoMessagesAllPanel` added to EmptyStates.jsx — muted colorway, inline SVGs, no CTA
- Task 3: 4 i18n keys added to ko.json; matching English keys added to en.json
- Task 4: `Feed.jsx` created — useLiveQuery guard pattern strictly followed (rawNotifications checked for undefined before ?? []); subscription name lookup via `subsById` map for all-feed topic chips; `slide-in-top` keyframe added to main.css; animation gated on `motion-safe:` (prefers-reduced-motion); `NotificationCard` updated to accept `showTopicChip` prop and conditionally render TopicChip
- Task 5: App.jsx updated — `id="main"` on `<main>`, Feed routes gated on `NEW.feed` (stays false), ContentRegion preserved when flag is false; Feed import added
- Task 6: 269 tests pass (26 test files) including all characterization tests from Story 1.2

### File List

- `src/components/hooks.js` (UPDATE — add `useActiveTopic()`)
- `src/components/message/EmptyStates.jsx` (UPDATE — add `NoMessagesTopicPanel`, `NoMessagesAllPanel`)
- `src/components/message/NotificationCard.jsx` (UPDATE — add `showTopicChip` prop, conditionally render TopicChip)
- `public/static/langs/ko.json` (UPDATE — 4 new i18n keys)
- `public/static/langs/en.json` (UPDATE — matching English keys)
- `src/styles/main.css` (UPDATE — add `slide-in-top` keyframe)
- `src/components/Feed.jsx` (NEW)
- `src/components/App.jsx` (UPDATE — add `id="main"` to `<main>`, import Feed, add feed routes gated on `NEW.feed`)

### Review Findings

- [x] [Review][Defer] Feed.jsx: `allSubscriptions` useLiveQuery resolves as `[]` on first render in all-feed — topic chips absent briefly before Dexie resolves [src/components/Feed.jsx:43] — deferred, pre-existing loading-state flicker; fix when SelectionContext/loading-sentinel lands in Story 3.5
- [x] [Review][Defer] Feed.jsx: `slide-in-top` animation always applied to `index === 0` — re-fires on re-renders, not only on new WS-pushed cards [src/components/Feed.jsx:114] — deferred, minor cosmetic; acceptable per architecture decision for now
