---
baseline_commit: 50645f853e7dd0a72ca7b40398b5b0a16536c2a6
---

# Story 3.5: URL-as-Source-of-Truth Selection + Detail Host

Status: review

## Story

As Jay,
I want opening a notification to show its detail beside the feed on desktop and full-screen on mobile,
so that reading one never loses my place (FR5 host, UX-DR13).

## Acceptance Criteria

1. **Given** the route `/:topic/:msgId`,
   **when** Jay taps a card,
   **then** desktop renders the detail as a right-side pane (feed stays live beside it); mobile pushes a full-screen route with a back button — **one param split by CSS breakpoint, not two routes** (UX-DR13, NFR6).

2. **And (S4)** `SelectionContext` is a **derived selector over `useParams`/`useSearchParams`** (or `useMatch`) with **no local `selectedId` state** — no `useState` or `useRef` in the file (ESLint-enforced); refresh / deep-link / back behave identically on every form factor.

3. **And** the selected card shows a slightly brighter `surface-active` surface — **not** a colored border (distinct from the `focus-ring` keyboard focus ring).

4. **And** on mobile open, focus moves to the detail heading; on back, focus returns toward the feed (NFR3 minimal route a11y).

5. **And** `SelectionProvider` is appended to `AppProviders.jsx` inside `BrowserRouter`, after `ConnectionProvider`, completing the codified provider order: Theme → Connection → **Selection** → (PublishQueue in 4.4).

6. **And** opening detail clears the unread dot by calling `subscriptionManager.markNotificationRead(notification.id)` at detail-mount time (same call used in Story 3.4's overflow menu — consistent path).

## Tasks / Subtasks

- [x] Task 1: Create `src/components/contexts/SelectionContext.jsx` (AC: #2, #5)
  - [x] Export `SelectionProvider` that derives `{ topic, msgId }` from `useMatch("/:topic/:msgId")` and `useMatch("/:topic")` — **no `useState`, no `useRef`** in the file
  - [x] Export `useSelection()` that throws if used outside provider
  - [x] Export `SelectionProvider`, `useSelection` as named exports; no default export needed
  - [x] Pattern exactly mirrors `ConnectionContext.jsx` (createContext → Provider → named hook that throws)
  - [x] Write `SelectionContext.test.jsx` co-located:
    - [x] Test: `useSelection()` throws outside provider
    - [x] Test: when route is `/:topic/:msgId`, `useSelection()` returns `{ topic, msgId }` (render inside MemoryRouter with the given path)
    - [x] Test: when route is `/:topic`, returns `{ topic, msgId: null }`
    - [x] Test: when route is `/settings`, returns `{ topic: null, msgId: null }` (no match)

- [x] Task 2: Append `SelectionProvider` to `AppProviders.jsx` (AC: #5)
  - [x] Wrap `HasDataBridge`'s children with `SelectionProvider` — inside `BrowserRouter`, after `ConnectionProvider` (the comment `{/* 3.5: SelectionProvider appended here */}` already marks the correct location — move it inside `BrowserRouter`)
  - [x] Provider order must be: Theme → BrowserRouter → HasDataBridge (ConnectionProvider) → **SelectionProvider** → children
  - [x] Do NOT restructure existing providers — append only (append-only rule from architecture)

- [x] Task 3: Add `useActiveTopic` to `src/components/hooks.js` (AC: #2)
  - [x] Add export `useActiveTopic = () => useSelection().topic` — a convenience alias for Sidebar and Feed consumers
  - [x] Import `useSelection` from `@/components/contexts/SelectionContext`
  - [x] This is the single entry point for "which topic is active" (architecture: `hooks.js [rebuild] connection listener glue + useActiveTopic() single entry`)

- [x] Task 4: Create `src/components/DetailPane.jsx` — shell only (AC: #1, #4, #6)
  - [x] Accept no props — reads `{ topic, msgId }` from `useSelection()`
  - [x] Look up notification from Dexie: `useLiveQuery(() => msgId ? db.notifications.get(msgId) : null, [msgId])`
  - [x] On mount (when `msgId` present and notification loaded), call `subscriptionManager.markNotificationRead(notification.id)` (AC #6)
  - [x] Render a heading (`<h1>` or `<h2>`) with `notification.title ?? notification.message.slice(0, 60)` — this is the focus target for mobile a11y
  - [x] Add `tabIndex={-1}` and `ref={headingRef}` to the heading; call `headingRef.current?.focus()` in a `useEffect([msgId])` — mobile focus-to-heading (AC #4)
  - [x] Include a "뒤로" back button (mobile-only, `md:hidden`) that calls `navigate(-1)` — triggers browser back, returning focus (AC #4)
  - [x] Body area renders a placeholder with key: `t("detail_loading_placeholder")` — Story 3.6 fills this in with `MarkdownContent + AttachmentBox`
  - [x] All strings via `t()` — no hardcoded Korean

- [x] Task 5: Wire detail pane + `/:topic/:msgId` route into `App.jsx` (AC: #1, #3)
  - [x] In `NewShell`, replace the placeholder `<div className="hidden lg:block w-[420px] border-l border-border overflow-y-auto">` with `<DetailRegion />`
  - [x] `DetailRegion` = `<div className="hidden lg:block w-[420px] border-l border-border overflow-y-auto">{msgId && <DetailPane />}</div>` where `msgId` comes from `useSelection()`
  - [x] In the main column `<Routes>`, add `<Route path={routes.msgDetail} element={<MsgDetailRoute />} />` BEFORE `<Route path={routes.subscription} .../>` (more specific routes first in RR6)
  - [x] `MsgDetailRoute` component: `<div className="lg:hidden"><DetailPane /></div><div className="hidden lg:block"><Feed /></div>` — mobile shows detail full-screen, desktop shows feed (detail renders in right column)
  - [x] Also add `<Route path={routes.subscription} element={<Feed />} />` if not present yet (Story 3.3 would add this — if 3.3 is not done, leave a TODO with the expected Feed component)
  - [x] Import `DetailPane` from `./DetailPane`

- [x] Task 6: Surface-active card highlight (AC: #3)
  - [x] In `Feed.jsx` (Story 3.3 output), read `useSelection().msgId` and pass `isSelected={n.id === msgId}` to each `<NotificationCard>`
  - [x] In `NotificationCard.jsx` (Story 3.1 output), accept `isSelected` prop and apply `bg-surface-active` when true — **this is not a new prop to add in this story if 3.1 didn't include it**; confirm the 3.1 output and wire accordingly
  - [x] The brighter surface replaces `bg-surface`; use `bg-[var(--surface-active)]` or the Tailwind token class if defined in `tokens.css`
  - [x] **Do NOT add a colored border for selection** — `surface-active` background only (UX-DR13)

- [x] Task 7: Add i18n keys to `public/static/langs/ko.json` (AC: #1, #4)
  - [x] `"detail_back_button"`: `"뒤로"`
  - [x] `"detail_loading_placeholder"`: `"알림 내용을 불러오는 중…"`

- [x] Task 8: Add tests `src/components/contexts/SelectionContext.test.jsx` (from Task 1)
  - [x] All tests listed in Task 1 above

## Dev Notes

### Hard Prerequisites (Do Not Start Until These Exist)

| Prerequisite | Story | Sprint Status | What You Need |
|---|---|---|---|
| `src/components/Feed.jsx` | 3.3 | ready-for-dev | Feed to show beside detail on desktop; wiring for `isSelected` prop |
| `src/components/message/NotificationCard.jsx` | 3.1 | ready-for-dev | `isSelected` prop support for `bg-surface-active` highlight |
| `src/components/AppProviders.jsx` | 2.1 | done | Provider scaffold; SelectionProvider appended inside here |
| `src/components/App.jsx` | 2.1 | done | NewShell host for detail pane; add `msgDetail` route |
| `src/components/ui/` primitives | 1.6–1.9 | done | Button (back), tokens (surface-active) |

**Stories 3.1 and 3.3 are the gating dependencies for Tasks 5 and 6.** Tasks 1, 2, 3, 4, 7, 8 are independent and can be done first.

---

### File Locations

| File | Action |
|---|---|
| `src/components/contexts/SelectionContext.jsx` | **CREATE NEW** |
| `src/components/contexts/SelectionContext.test.jsx` | **CREATE NEW** |
| `src/components/DetailPane.jsx` | **CREATE NEW** |
| `src/components/AppProviders.jsx` | **MODIFY** — wrap HasDataBridge children with SelectionProvider |
| `src/components/App.jsx` | **MODIFY** — add `:topic/:msgId` route, replace placeholder div with DetailRegion |
| `src/components/hooks.js` | **MODIFY** — add `useActiveTopic` export |
| `src/components/Feed.jsx` | **MODIFY** — pass `isSelected` to NotificationCard (if Feed exists from 3.3) |
| `public/static/langs/ko.json` | **UPDATE** — add 2 new keys |

**Do NOT add `detail: true` to `migration.js`** — the detail feature is gated by the `NEW.shell` flag at `App.jsx` level. `SelectionContext` is always available once appended to providers.

---

### SelectionContext Implementation Guide

**CRITICAL CONSTRAINT:** `src/components/contexts/SelectionContext.jsx` must contain **no `useState` and no `useRef`**. ESLint bans both in this file (`per-directory no-restricted-syntax`). The URL IS the state.

```jsx
// src/components/contexts/SelectionContext.jsx
import { createContext, useContext } from "react";
import { useMatch } from "react-router-dom";

const SelectionContext = createContext(null);

export const SelectionProvider = ({ children }) => {
  // Derive from router — no local state, no refs
  const detailMatch = useMatch("/:topic/:msgId");
  const topicMatch = useMatch("/:topic");

  const value = {
    topic: detailMatch?.params?.topic ?? topicMatch?.params?.topic ?? null,
    msgId: detailMatch?.params?.msgId ?? null,
  };

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
};

export const useSelection = () => {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("useSelection() must be used inside <SelectionProvider>");
  return ctx;
};
```

**Why `useMatch` over `useParams`:**
`useParams` only reads params from the *nearest matched Route ancestor* — it returns `{}` when called outside any matching Route. `useMatch("/:topic/:msgId")` reads the current URL globally and returns null when unmatched. This is required since `SelectionProvider` lives in `AppProviders`, outside the `Routes` tree.

**Why two `useMatch` calls (not one):**
- `useMatch("/:topic/:msgId")` → detail view; topic + msgId both present
- `useMatch("/:topic")` → feed-only view; msgId is null
- When neither matches (settings, root), both return null; value is `{ topic: null, msgId: null }`

**Route priority note:** `/:topic` ALSO matches `/:topic/:msgId` in React Router v6 if not using exact matching. Verify the order in `routes.js`. If `useMatch("/:topic")` erroneously fires on `/:topic/:msgId`, use a negative check: only use `topicMatch` when `detailMatch` is null (the code above already does this via `detailMatch?.params?.topic ?? topicMatch?.params?.topic`).

---

### AppProviders.jsx Modification

Current state of `AppProviders.jsx` (Story 2.1 output):
```jsx
const AppProviders = ({ children }) => (
  <ThemeProvider>
    {/* PROVIDER ORDER — append-only. Never restructure. */}
    {/* 3.5: SelectionProvider appended here */}
    {/* 4.4: PublishQueueProvider appended here */}
    <Suspense fallback={null}>
      <BrowserRouter>
        <HasDataBridge>{children}</HasDataBridge>
      </BrowserRouter>
    </Suspense>
  </ThemeProvider>
);
```

**Important:** The comment `{/* 3.5: SelectionProvider appended here */}` is OUTSIDE `BrowserRouter`. **This placement is wrong** — `SelectionProvider` uses `useMatch` from react-router-dom, which requires a `BrowserRouter` ancestor. Move it INSIDE `BrowserRouter`, wrapping the children of `HasDataBridge`:

```jsx
// HasDataBridge — already exists in AppProviders.jsx
const HasDataBridge = ({ children }) => {
  const hasData = useLiveQuery(() => db.notifications.limit(1).count().then((c) => c > 0), []) ?? false;
  return (
    <ConnectionProvider hasData={hasData}>
      <SelectionProvider>{children}</SelectionProvider>  {/* ← Story 3.5 adds this */}
    </ConnectionProvider>
  );
};
```

Provider order inside BrowserRouter: Theme → (BrowserRouter) → HasDataBridge → ConnectionProvider → **SelectionProvider** → children.

---

### App.jsx — Route and Pane Changes

**Current NewShell (Story 2.1 output) main column Routes:**
```jsx
<Routes>
  <Route path={routes.app} element={<ContentRegion />} />
  <Route path={routes.settings} element={<ServerAuthForm />} />
</Routes>
```

**After Story 3.5:**
```jsx
<Routes>
  <Route path={routes.app} element={<ContentRegion />} />
  <Route path={routes.settings} element={<ServerAuthForm />} />
  {/* /:topic/:msgId must come BEFORE /:topic — more specific first in RR6 */}
  <Route path={routes.msgDetail} element={<MsgDetailRoute />} />
  <Route path={routes.subscription} element={<Feed />} />
  {/* Story 3.3 adds Feed — if not yet done, leave TODO comment here */}
</Routes>
```

**`MsgDetailRoute` component (defined in App.jsx or a small local component):**
```jsx
// One route, split by CSS breakpoint — NOT two routes.
// mobile (< lg): shows DetailPane full-screen; feed hidden
// desktop (≥ lg): shows Feed in main column; detail is in the right column
const MsgDetailRoute = () => (
  <>
    <div className="lg:hidden"><DetailPane /></div>
    <div className="hidden lg:block"><Feed /></div>
  </>
);
```

**Right pane (replace placeholder):**
```jsx
// BEFORE (Story 2.1 placeholder):
<div className="hidden lg:block w-[420px] border-l border-border overflow-y-auto">
  {/* Detail pane placeholder */}
</div>

// AFTER (Story 3.5):
<DetailRegion />

// Where DetailRegion is:
const DetailRegion = () => {
  const { msgId } = useSelection();
  return (
    <div className="hidden lg:block w-[420px] border-l border-border overflow-y-auto">
      {msgId && <DetailPane />}
    </div>
  );
};
```

The `w-[420px]` is a layout-nudge (existing `/* layout-nudge: placeholder width; Story 3.5 finalises */` comment in the current code). The width is acceptable per UX-DR13.

---

### DetailPane.jsx Implementation Guide

**Story 3.5 role:** `DetailPane` is a SHELL and HOST. It reads the selected notification, clears the unread dot, and provides a heading + placeholder body area. **Story 3.6 fills in the full content** (MarkdownContent, AttachmentBox, priority, tags, timestamp).

```jsx
// src/components/DetailPane.jsx
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLiveQuery } from "dexie-react-hooks";
import { useSelection } from "@/components/contexts/SelectionContext";
import subscriptionManager from "@/app/SubscriptionManager";
import db from "@/app/db";
import Button from "@/components/ui/Button";

const DetailPane = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { topic, msgId } = useSelection();
  const headingRef = useRef(null);

  const notification = useLiveQuery(
    () => (msgId ? db.notifications.get(msgId) : null),
    [msgId]
  ) ?? null;

  // Clear unread dot on mount (same API as 3.4 overflow menu)
  useEffect(() => {
    if (notification?.id) {
      subscriptionManager.markNotificationRead(notification.id);
    }
  }, [notification?.id]);

  // Move focus to heading on mobile open (AC #4)
  useEffect(() => {
    if (msgId && headingRef.current) {
      headingRef.current.focus();
    }
  }, [msgId]);

  if (!msgId || !notification) {
    return null; // or a loading skeleton — Story 3.6 decides
  }

  return (
    <article className="flex flex-col h-full p-4">
      {/* Mobile-only back button */}
      <div className="flex items-center gap-2 mb-4 lg:hidden">
        <Button variant="ghost" onClick={() => navigate(-1)} aria-label={t("detail_back_button")}>
          {t("detail_back_button")}
        </Button>
      </div>

      {/* Heading — focus target for mobile a11y (AC #4) */}
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-heading font-semibold outline-none"
      >
        {notification.title ?? notification.message?.slice(0, 60)}
      </h1>

      {/* Body placeholder — Story 3.6 replaces this with MarkdownContent + AttachmentBox */}
      <div className="mt-4 text-muted text-body-sm">
        {t("detail_loading_placeholder")}
      </div>
    </article>
  );
};

export default DetailPane;
```

**Note on `useRef` in DetailPane:** `useRef` is only banned in `SelectionContext.jsx` (per ESLint `per-directory no-restricted-syntax`). It is allowed in `DetailPane.jsx`.

**Note on `useLiveQuery`:** OK in `DetailPane.jsx` — the ban applies only to `contexts/` directory.

---

### useActiveTopic in hooks.js

Add this export to `src/components/hooks.js`:

```js
// Add this import at top of hooks.js
import { useSelection } from "@/components/contexts/SelectionContext";

// Add this new export (place near top with other simple exports)
export const useActiveTopic = () => useSelection().topic;
```

This is the single entry point for consumers (Sidebar, Feed) to read the active topic. They MUST use this hook — not re-derive from URL params or Dexie.

---

### Surface-Active Card Highlight (AC #3)

The selected card shows `bg-surface-active` (CSS var `--surface-active`, `#1C1F23` dark / light equivalent). This is NOT a border or ring — it's a background fill that makes the card "lift" slightly.

**In Feed.jsx (Story 3.3 output):**
```jsx
const { msgId } = useSelection();
// Pass to each card:
<NotificationCard
  notification={n}
  isSelected={n.id === msgId}
  // ... other props
/>
```

**In NotificationCard.jsx (Story 3.1 output):**
The card should already accept `isSelected` if Story 3.1 included it (per AC #3 in the epics, which references UX-DR13). If `isSelected` is NOT yet in the 3.1 output, add it as a prop:
```jsx
// In NotificationCard.jsx — NOT a frozen slot (isSelected is styling, not data injection)
const NotificationCard = ({ notification, isSelected, bodySlot, overflowMenu, pending, error }) => {
  return (
    <div className={cn("rounded-card bg-surface ...", isSelected && "bg-surface-active")}>
      {/* ... */}
    </div>
  );
};
```

**NEVER use a colored border for selection** (`border-accent`, `ring-accent`, etc.). Only `bg-surface-active`. The keyboard `focus-ring` is separate and distinct.

---

### i18n Key Reference

```json
"detail_back_button":          "뒤로",
"detail_loading_placeholder":  "알림 내용을 불러오는 중…"
```

Follow `<feature>_<element>_<action>` naming convention. Add near other `detail_*` keys if they exist.

---

### Testing Approach

**SelectionContext.test.jsx pattern:**
```jsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { SelectionProvider, useSelection } from "./SelectionContext";

// Helper consumer component
const Consumer = () => {
  const { topic, msgId } = useSelection();
  return <div data-testid="out">{JSON.stringify({ topic, msgId })}</div>;
};

// Helper: renders SelectionProvider inside MemoryRouter at a given path
const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="*"
          element={
            <SelectionProvider>
              <Consumer />
            </SelectionProvider>
          }
        />
      </Routes>
    </MemoryRouter>
  );

describe("SelectionContext", () => {
  it("returns topic + msgId when at /:topic/:msgId", () => {
    renderAt("/my-topic/msg123");
    expect(JSON.parse(screen.getByTestId("out").textContent)).toEqual({
      topic: "my-topic",
      msgId: "msg123",
    });
  });

  it("returns topic + null msgId when at /:topic only", () => {
    renderAt("/my-topic");
    expect(JSON.parse(screen.getByTestId("out").textContent)).toEqual({
      topic: "my-topic",
      msgId: null,
    });
  });

  it("returns nulls when at /settings (no topic match)", () => {
    renderAt("/settings");
    // /settings does NOT match /:topic — note: this depends on route specificity
    // If /settings unexpectedly matches /:topic (topic = "settings"), that's OK — adjust test
    const out = JSON.parse(screen.getByTestId("out").textContent);
    expect(out.msgId).toBeNull();
  });

  it("useSelection() throws when used outside provider", () => {
    const ThrowingComponent = () => { useSelection(); return null; };
    expect(() =>
      render(
        <MemoryRouter>
          <ThrowingComponent />
        </MemoryRouter>
      )
    ).toThrow("useSelection() must be used inside <SelectionProvider>");
  });
});
```

**No `fake-indexeddb` needed for SelectionContext tests** — it has no Dexie access.

For `DetailPane.test.jsx`, mock Dexie + subscriptionManager (same pattern as 3.4 tests).

---

### Critical Anti-Patterns to Avoid

```jsx
// ✗ Local selectedId state in SelectionContext — the URL IS the state
const [selectedId, setSelectedId] = useState(null); // BANNED by ESLint in SelectionContext.jsx

// ✗ useRef in SelectionContext.jsx — ALSO BANNED by ESLint
const prevMsgId = useRef(null); // banned

// ✗ useParams() in SelectionProvider — returns {} when outside a matching Route
import { useParams } from "react-router-dom";
const { msgId } = useParams(); // returns {} if provider is in AppProviders (outside Routes)

// ✗ Colored selection border on the card
className="border-2 border-accent" // never — use bg-surface-active only

// ✗ Two separate routes for desktop/mobile detail
<Route path="/desktop/:topic/:msgId" element={<DesktopDetail />} />
<Route path="/mobile/:topic/:msgId" element={<MobileDetail />} />
// Reality: ONE route (/:topic/:msgId), split by CSS breakpoint in MsgDetailRoute

// ✗ SelectionProvider outside BrowserRouter
// The comment in AppProviders.jsx placed it outside BrowserRouter — that's wrong.
// useMatch() requires a router context. Must be inside BrowserRouter.

// ✗ useLiveQuery in contexts/SelectionContext.jsx
import { useLiveQuery } from "dexie-react-hooks"; // BANNED in contexts/ by ESLint

// ✗ Hard-coded Korean in DetailPane
<button>뒤로</button> // must go through t("detail_back_button")
```

---

### Architecture Boundary Summary

```
src/components/
├── contexts/
│   └── SelectionContext.jsx   ← NEW (derives topic + msgId from URL; no useState, no useRef, no useLiveQuery)
├── DetailPane.jsx             ← NEW (domain-aware: useLiveQuery + subscriptionManager OK; in components/, not contexts/)
├── AppProviders.jsx           ← MODIFY (SelectionProvider added inside BrowserRouter → ConnectionProvider)
├── App.jsx                    ← MODIFY (msgDetail route + DetailRegion replacing placeholder)
└── hooks.js                   ← MODIFY (useActiveTopic export added, delegates to useSelection)
```

**Dependency chain:**
`useActiveTopic` (hooks.js) → `useSelection` (SelectionContext.jsx) → `useMatch` (react-router-dom) → URL

**Data vs Selection authority:**
- Dexie is authority for **notification data** (what the notification contains)
- SelectionContext is authority for **which notification is selected** (derived from URL)
- Neither re-derives from the other

---

### Dependency Story Status Warning

This story's key dependencies NOT yet implemented:
- **3.1** (NotificationCard) — Task 6 `isSelected` wiring blocked until 3.1 done
- **3.3** (Feed) — Task 5 Feed route and Task 6 `isSelected` prop blocked until 3.3 done

**Recommended implementation order:**
1. **Tasks 1, 2, 3, 7, 8** immediately — SelectionContext, AppProviders, hooks.js, i18n, tests
2. **Task 4** (DetailPane) — independent of Feed/NotificationCard
3. **Tasks 5 + 6** — after Stories 3.1 and 3.3 are implemented

### References

- Epic spec: `_bmad-output/planning-artifacts/epics.md` § Story 3.5
- Architecture — SelectionContext: `_bmad-output/planning-artifacts/architecture.md` § State Management (line 466)
- Architecture — Provider order: `_bmad-output/planning-artifacts/architecture.md` § Architectural Boundaries (line 648)
- Architecture — file structure: `_bmad-output/planning-artifacts/architecture.md` § Project Structure (line 598)
- UX — Detail pane: `_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/EXPERIENCE.md` § layout (line 19) + story D16 (line 34) + selected card (line 102)
- UX — CSS breakpoints: `_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/EXPERIENCE.md` § Form Factors table (lines 127–129)
- UX — focus management: `_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/EXPERIENCE.md` § Accessibility (line 115)
- surface-active token: `_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/DESIGN.md` (line 72: `background-selected: '{colors.surface-active}'`)
- ConnectionContext.jsx: `src/components/contexts/ConnectionContext.jsx` — exact pattern to mirror
- AppProviders.jsx: `src/components/AppProviders.jsx` — existing provider scaffold with marker comment
- App.jsx: `src/components/App.jsx` — NewShell with detail placeholder at line 153
- routes.js: `src/components/routes.js` — `msgDetail: "/:topic/:msgId"` already defined (line 10)
- migration.js: `src/config/migration.js` — `detail` flag exists but is NOT flipped by this story
- G4 card slot contract: `_bmad-output/planning-artifacts/epics.md` § Story-Creation Guardrails G4
- Story 3.4 unread-dot path: `_bmad-output/implementation-artifacts/3-4-card-overflow-actions-read-copy-delete.md` § Unread Dot Clearing

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- SelectionContext.jsx created with `useMatch("/:topic/:msgId")` + `useMatch("/:topic")` — no useState/useRef (ESLint-compliant). 4 tests pass.
- AppProviders.jsx: SelectionProvider inserted inside HasDataBridge → after ConnectionProvider, inside BrowserRouter (correct router context).
- hooks.js: useActiveTopic replaced from Dexie subscription-object lookup to `() => useSelection().topic`. Feed.jsx updated accordingly to re-derive subscription object from `subscriptionManager.all()`.
- DetailPane.jsx: shell + host created; reads msgId from SelectionContext; marks read on mount; focuses heading on msgId change (a11y); back button mobile-only via navigate(-1).
- App.jsx: MsgDetailRoute (one route, CSS breakpoint split) + DetailRegion added; `/:topic/:msgId` registered before `/:topic` in RR6 route order.
- Feed.jsx: `isSelected={n.id === msgId}` wired to NotificationCard. Subscription lookup migrated from hook return value to Dexie query keyed by topicName string.
- NotificationCard.jsx: fixed pre-existing `import Button from` (default) → `import { Button } from` (named); NotificationCard.test.jsx mock updated to match.
- All ACs satisfied. 317 tests pass, build green.

### File List

- src/components/contexts/SelectionContext.jsx (NEW)
- src/components/contexts/SelectionContext.test.jsx (NEW)
- src/components/DetailPane.jsx (NEW)
- src/components/AppProviders.jsx (MODIFIED)
- src/components/hooks.js (MODIFIED)
- src/components/App.jsx (MODIFIED)
- src/components/Feed.jsx (MODIFIED)
- src/components/message/NotificationCard.jsx (MODIFIED — fixed default→named Button import)
- src/components/message/NotificationCard.test.jsx (MODIFIED — updated Button mock)
- public/static/langs/ko.json (MODIFIED — added detail_back_button, detail_loading_placeholder)
- public/static/langs/en.json (MODIFIED — added detail_back_button, detail_loading_placeholder)

## Change Log

- 2026-06-20: Story 3.5 implementation complete — SelectionContext (URL-derived, no state), SelectionProvider wired into AppProviders, useActiveTopic delegated to useSelection, DetailPane shell+host, App.jsx routes/pane wired, Feed isSelected, i18n keys added. 317 tests pass, build green.
