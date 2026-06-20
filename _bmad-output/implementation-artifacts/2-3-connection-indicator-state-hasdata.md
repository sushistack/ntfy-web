---
baseline_commit: f2f7bd4fc45bbd7efdacaae6fc7c1456204f25ad
---

# Story 2.3: Connection Indicator (state × hasData)

Status: done

## Story

As Jay,
I want an always-present connection indicator,
so that I know whether my server is reachable (FR9a, NFR1).

## Acceptance Criteria

1. **Given** the preserved `ConnectionManager` listeners, **when** `hooks.js` wires `registerStateListener`/`registerMessageListener` into `ConnectionContext`, **then** the context exposes `connectionState (connected|connecting|reconnecting|offline) × hasData` with ~300ms debounced transitions that suppress flicker but never mask a real state change.

2. **And** the indicator renders 연결됨 / 연결 중… / 연결 끊김 with the connecting/reconnecting state showing a calm amber pulse (gated on `prefers-reduced-motion`). The `offline` and `connecting` labels both render as 연결 끊김 and 연결 중… respectively; `reconnecting` uses 연결 중… as well (same label, same visual, different internal state).

3. **And** connection changes are announced via the `LiveRegion` component from Story 1.9 (`src/components/ui/LiveRegion.jsx`, `aria-live="polite"`) — **NOT** a raw `aria-live` div (NFR3).

4. **And** `src/app/` is not modified. Mapping happens in `hooks.js` only. Components read via `useConnection()`, never by calling `ConnectionManager` directly.

5. **And** `useConnection()` throws outside its Provider with a clear error message.

## Tasks / Subtasks

- [x] Task 1: Create `src/components/contexts/ConnectionContext.jsx` (AC: #1, #4, #5)
  - [x] Define `CONN_STATES = { CONNECTED, CONNECTING, RECONNECTING, OFFLINE }` as a frozen object (not imported from `Connection.js` — keep app/components boundary clean)
  - [x] Implement reducer with actions: `UPDATE_SUB_STATE`, `SET_HAS_DATA`
  - [x] Provider maintains `subStates: Map<subscriptionId, { state, wasConnected }>` plus debounce ref
  - [x] Derive aggregate state from Map (see Dev Notes for derivation logic)
  - [x] Expose `{ connectionState, hasData }` via context; `useConnection()` guard-throws outside Provider
  - [x] **Do NOT import `useLiveQuery` or any `src/app/` module** (architectural boundary — see Dev Notes)

- [x] Task 2: Update `src/components/hooks.js` — wire state listener into ConnectionContext (AC: #1, #4)
  - [x] **PRESERVE** existing call `subscriptionManager.updateState(id, state)` inside the new listener — it must still run
  - [x] Add `dispatch({ type: 'UPDATE_SUB_STATE', subscriptionId: id, state })` alongside the existing call
  - [x] Add `useLiveQuery` call for `hasData` (notifications count) and dispatch `SET_HAS_DATA` when it changes
  - [x] The `useConnectionListeners` hook must accept `dispatch` from `ConnectionContext` as a parameter, or the context Provider must host the listener wiring via `useEffect`
  - [x] **Prefer**: Let `ConnectionContext.jsx` export a `useConnectionListeners` hook that reads context dispatch internally — keeps the connection wiring co-located with the context

- [x] Task 3: Create `src/components/ConnectionIndicator.jsx` (AC: #2, #3)
  - [x] Read state via `useConnection()` — never import `connectionManager` directly
  - [x] Render a colored status dot + Korean label using design tokens (see Dev Notes for colors)
  - [x] Connecting/reconnecting: amber dot with `motion-safe:animate-pulse` Tailwind modifier
  - [x] Connected: emerald dot (`text-accent-ui`), no animation
  - [x] Offline: muted dot (`text-muted`), no animation
  - [x] Mount `<LiveRegion message={announcementText} />` that updates when connectionState changes
  - [x] Announcement text must go through `t()` — never hardcode Korean strings

- [x] Task 4: Add i18n keys to `public/static/langs/en.json` (AC: #2, #3)
  - [x] `"connection_indicator_connected"` → `"Connected"`
  - [x] `"connection_indicator_connecting"` → `"Connecting…"`
  - [x] `"connection_indicator_disconnected"` → `"Disconnected"`
  - [x] Add corresponding Korean strings to `public/static/langs/ko.json`:
    - `"connection_indicator_connected"` → `"연결됨"`
    - `"connection_indicator_connecting"` → `"연결 중…"`
    - `"connection_indicator_disconnected"` → `"연결 끊김"`

- [x] Task 5: Wire `ConnectionContext` into `AppProviders.jsx` (AC: #1)
  - [x] This file was created in Story 2.1. Add `<ConnectionProvider>` in the `Theme → Connection → Selection → PublishQueue` order
  - [x] If Story 2.1 is not yet merged, leave a `// TODO 2.3: add ConnectionProvider here` comment placeholder and note in Dev Agent Record

- [x] Task 6: Tests (AC: #1, #2)
  - [x] Unit test for reducer: `UPDATE_SUB_STATE` → correct aggregate state derivation for all four outcomes (`connected`, `connecting`, `reconnecting`, `offline`)
  - [x] Unit test for `useConnection()` guard: throws when rendered outside Provider
  - [x] Test file: `src/components/contexts/ConnectionContext.test.jsx`

## Dev Notes

### CRITICAL: `Connection.js` only emits two states

`ConnectionState` in `src/app/Connection.js` only has two values:
- `Connected = "connected"` — emitted in `ws.onopen`
- `Connecting = "connecting"` — emitted in `ws.onclose` when the connection dies and a retry is queued

There is **no `reconnecting` or `offline` state** from the logic layer. The UI model must derive them:

```js
// Derivation inside the reducer or a selector:
function deriveAggregateState(subStates) {
  if (subStates.size === 0) return CONN_STATES.OFFLINE;

  const entries = [...subStates.values()];
  const anyConnected = entries.some(e => e.state === "connected");
  if (anyConnected) return CONN_STATES.CONNECTED;

  const anyConnecting = entries.some(e => e.state === "connecting");
  if (!anyConnecting) return CONN_STATES.OFFLINE;

  // At least one is connecting — was any previously connected?
  const wasEverConnected = entries.some(e => e.wasConnected);
  return wasEverConnected ? CONN_STATES.RECONNECTING : CONN_STATES.CONNECTING;
}
```

The `wasConnected` flag is set in the reducer when a subscription transitions FROM `connected` to `connecting`. It is never reset (once connected → always `wasConnected`).

### CRITICAL: Do NOT break the existing state listener

`hooks.js:96` currently wires:
```js
connectionManager.registerStateListener((id, state) => subscriptionManager.updateState(id, state));
```

`ConnectionManager.registerStateListener` **replaces** the previous listener (single slot, see `ConnectionManager.js:20-22`). The new connection-indicator listener **MUST still call `subscriptionManager.updateState(id, state)`** inside it. If you forget this, per-subscription connection state in Dexie stops updating, breaking state panel behavior in Story 2.6.

Preferred pattern — have `ConnectionContext.jsx` export the Provider + listener wiring together:

```jsx
// ConnectionContext.jsx
export const ConnectionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(connectionReducer, initialState);
  const debounceRef = useRef(null);

  useEffect(() => {
    // Wire the listener: BOTH subscriptionManager update AND context dispatch
    connectionManager.registerStateListener((subscriptionId, connState) => {
      subscriptionManager.updateState(subscriptionId, connState); // PRESERVE THIS
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        dispatch({ type: 'UPDATE_SUB_STATE', subscriptionId, state: connState });
      }, DEBOUNCE_MS);
    });
    return () => {
      connectionManager.resetStateListener();
      clearTimeout(debounceRef.current);
    };
  }, []);

  // ... hasData wiring (see below)
  return <ConnectionContext.Provider value={...}>{children}</ConnectionContext.Provider>;
};
```

If you use this pattern, **remove** the `registerStateListener` call from the existing `useConnectionListeners` hook in `hooks.js` — do NOT register it twice.

### CRITICAL: `contexts/` cannot import `useLiveQuery` or `src/app/`

The architectural boundary (architecture.md, "Architectural Boundaries"):
> **Data:** Dexie is the single source of truth; read via `useLiveQuery` only; `contexts/` may not import `useLiveQuery` (enforced).
> **Logic ↔ Presentation:** `src/app/` imported by presentation, never the reverse.

`hasData` is derived from Dexie notification count. Since `ConnectionContext.jsx` cannot use `useLiveQuery`, the notification count must be computed **outside** the context and dispatched in:

**Option A (preferred):** `ConnectionProvider` accepts `hasData: boolean` as a prop, computed by the parent (`AppProviders.jsx`) via `useLiveQuery(() => db.notifications.limit(1).count(), [])`. The Provider simply dispatches `SET_HAS_DATA` on change via a `useEffect`.

**Option B:** `hooks.js` exports a `useHasData()` hook that calls `useLiveQuery` and dispatches into context using a context-provided `setHasData` function.

Do NOT import `db` from `src/app/db.js` inside `ConnectionContext.jsx`.

### Debounce: suppress flicker, never mask real changes

The 300ms debounce applies to the CONTEXT state update, not to the indicator re-render. Its only purpose is to avoid the visual flicker of `connected → connecting → connected` during a brief WS hiccup. It must NOT cause the indicator to lag more than 300ms behind a genuine connection drop.

The debounce is a `setTimeout` on `dispatch`, cleared on each new state event. If state changes again within 300ms, the timer resets. This means: a state that changes and stabilizes within 300ms will show the final stable value, not an intermediate one.

### Connection indicator visual spec

| State | Label (ko) | Label (en) | Dot color | Animation |
|---|---|---|---|---|
| `connected` | 연결됨 | Connected | `text-accent-ui` (emerald `#42D392` / light `#1A9E5F`) | none |
| `connecting` | 연결 중… | Connecting… | `text-priority-high` (amber) | `motion-safe:animate-pulse` |
| `reconnecting` | 연결 중… | Connecting… | `text-priority-high` (amber) | `motion-safe:animate-pulse` |
| `offline` | 연결 끊김 | Disconnected | `text-muted` | none |

The dot is rendered as a small filled circle (`w-2 h-2 rounded-full bg-current`). The label is `caption`-scale text (`text-xs font-medium`). The indicator is a `flex items-center gap-1.5` row.

**Never hardcode color hex** — always use token class names (`text-accent-ui`, `text-priority-high`, `text-muted`) so light/dark themes resolve correctly.

### Animation: `prefers-reduced-motion` via Tailwind modifier

Use Tailwind's built-in `motion-safe:` modifier — do NOT write a custom `@keyframes` or a JS `prefers-reduced-motion` media query check. This handles accessibility automatically:

```jsx
<span className={cn(
  "w-2 h-2 rounded-full bg-current",
  isAnimating && "motion-safe:animate-pulse"
)} />
```

`motion-safe:animate-pulse` renders `animate-pulse` only when `prefers-reduced-motion: no-preference` — exactly what the AC requires.

### `aria-live` announcement via `LiveRegion`

Story 1.9 (`src/components/ui/LiveRegion.jsx`) provides the `<LiveRegion message={text} />` component with `aria-live="polite"` and the forced re-announcement trick. Use it — do NOT create a raw `<div aria-live="polite">` in `ConnectionIndicator.jsx`.

If Story 1.9 is not yet merged when you implement this, leave a `// TODO 1.9: add <LiveRegion message={...} /> here` comment. The component must exist before this story is considered done.

```jsx
// in ConnectionIndicator.jsx
const announcement = t(`connection_indicator_${connectionState === 'reconnecting' ? 'connecting' : connectionState}`);
// Only announce when state actually changes (use useRef to track previous state)
<LiveRegion message={prevState !== connectionState ? announcement : ""} />
```

### `useConnection()` guard

```js
export const useConnection = () => {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error("useConnection() must be used inside <ConnectionProvider>");
  return ctx;
};
```

### Reducer skeleton

```js
const initialState = {
  subStates: new Map(),        // subscriptionId → { state: "connected"|"connecting", wasConnected: bool }
  connectionState: "offline",  // derived aggregate
  hasData: false,
};

const connectionReducer = (state, action) => {
  switch (action.type) {
    case "UPDATE_SUB_STATE": {
      const prev = state.subStates.get(action.subscriptionId) ?? { state: null, wasConnected: false };
      const wasConnected = prev.wasConnected || prev.state === "connected";
      const next = new Map(state.subStates);
      next.set(action.subscriptionId, { state: action.state, wasConnected });
      return { ...state, subStates: next, connectionState: deriveAggregateState(next) };
    }
    case "REMOVE_SUB": {
      const next = new Map(state.subStates);
      next.delete(action.subscriptionId);
      return { ...state, subStates: next, connectionState: deriveAggregateState(next) };
    }
    case "SET_HAS_DATA":
      return { ...state, hasData: action.hasData };
    default:
      return state;
  }
};
```

Note: `REMOVE_SUB` is needed when a subscription is removed and its connection closes cleanly (no state callback from `Connection.js`). Wire it by observing the active subscriptions list length in `AppProviders.jsx` or in the Provider's `useEffect` cleanup.

### File locations (architecture.md)

| File | Action |
|---|---|
| `src/components/contexts/ConnectionContext.jsx` | **CREATE NEW** |
| `src/components/ConnectionIndicator.jsx` | **CREATE NEW** (flat chrome, next to Sidebar.jsx) |
| `src/components/hooks.js` | **MODIFY** — remove old registerStateListener, add hasData hook |
| `src/components/AppProviders.jsx` | **MODIFY** — add `<ConnectionProvider>` (created in story 2.1) |
| `src/components/contexts/ConnectionContext.test.jsx` | **CREATE NEW** |
| `public/static/langs/en.json` | **MODIFY** — add `connection_indicator_*` keys |
| `public/static/langs/ko.json` | **MODIFY** — add `connection_indicator_*` Korean strings |

**Do not modify anything in `src/app/`.**

### Dependencies

- **Story 2.1** (AppProviders.jsx + provider scaffold) must be done or in-progress — `ConnectionProvider` must be slotted in the `Theme → Connection → Selection → PublishQueue` order codified there. If 2.1 is not done, create `ConnectionContext.jsx` and `ConnectionIndicator.jsx` but leave the Provider wiring for 2.1's implementation.
- **Story 1.9** (`LiveRegion.jsx`) must be done or at minimum the file must exist — `ConnectionIndicator.jsx` imports it. Currently in-progress status.

### Testing approach

Follow the pattern from Story 1.2 (characterization tests co-located in `*.test.js`/`*.test.jsx`):
- Vitest + jsdom (already configured, `vitest.config.js`)
- Do NOT use `fake-indexeddb` here — the hasData path should be tested via a mock prop or injected value, not a real Dexie instance

```jsx
// ConnectionContext.test.jsx
import { renderHook } from "@testing-library/react";
import { ConnectionProvider, useConnection, CONN_STATES } from "./ConnectionContext";

// Test reducer logic directly (no DOM needed)
describe("connectionReducer", () => {
  it("returns offline when subStates is empty", () => { ... });
  it("returns connected when any sub is connected", () => { ... });
  it("returns reconnecting when sub was once connected, now connecting", () => { ... });
  it("returns connecting when sub never connected, now connecting", () => { ... });
});

// Test guard hook
describe("useConnection guard", () => {
  it("throws when rendered outside provider", () => {
    expect(() => renderHook(() => useConnection())).toThrow("useConnection()");
  });
});
```

### Project Structure Notes

- `src/components/contexts/ConnectionContext.jsx` is the canonical location for cross-cutting state (architecture.md `contexts/` section). Do not put it in `src/components/` directly or `src/app/`.
- `src/components/ConnectionIndicator.jsx` is flat chrome (not a `ui/` primitive) — per architecture `[new] (flat chrome)` listing alongside `Sidebar.jsx`, `AppBar.jsx`.
- `contexts/` may not import from `message/`, `ui/` domain knowledge modules, or `useLiveQuery`. The ESLint `no-restricted-paths` rule enforces this.

### References

- Connection state machine: [architecture.md#Connection state machine](../_bmad-output/planning-artifacts/architecture.md) — "connectionState (connected|connecting|reconnecting|offline) × hasData in a ConnectionContext"
- `ConnectionManager.registerStateListener` API: [src/app/ConnectionManager.js:20](src/app/ConnectionManager.js#L20)
- `ConnectionState` enum: [src/app/Connection.js:7-11](src/app/Connection.js#L7)
- Existing hooks.js listener: [src/components/hooks.js:96](src/components/hooks.js#L96)
- LiveRegion component: [Story 1.9 spec](1-9-ui-state-boundary-primitives-databoundary-statepanel-live-region.md)
- Design tokens (amber color): [src/styles/tokens.css:53](src/styles/tokens.css#L53) — `--color-priority-high`
- Design tokens (emerald): [src/styles/tokens.css](src/styles/tokens.css) — `--color-accent-ui`
- UX indicator states: [EXPERIENCE.md](../_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/EXPERIENCE.md#L87-93)
- Korean voice copy: UX-DR12, EXPERIENCE.md — "연결됨 / 연결 중… / 연결 끊김"
- Provider order: architecture.md — "Theme → Connection → Selection → PublishQueue"
- Architectural boundaries: architecture.md `contexts/` may not import `useLiveQuery`
- i18n existing key: [public/static/langs/ko.json:19](public/static/langs/ko.json#L19) — `nav_button_connecting: "연결중"` (existing, do not remove)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- ConnectionContext.jsx owns the `registerStateListener` wiring (removed from hooks.js). The listener preserves `subscriptionManager.updateState()` call AND dispatches `UPDATE_SUB_STATE` with 300ms debounce.
- `hasData` computed via `useLiveQuery` in `HasDataBridge` component inside AppProviders.jsx (architectural boundary: contexts/ cannot import useLiveQuery). Passed as prop to `<ConnectionProvider hasData={…}>`.
- Story 2.2 was already done (ThemeProvider exists). ConnectionProvider inserted inside ThemeProvider wrapping children.
- ConnectionIndicator uses `prevStateRef` to emit non-empty LiveRegion announcements only on state changes (avoids duplicate announcements on re-render).
- All 7 new tests pass; full suite 175/175 green.

### Change Log

- 2026-06-20: Story 2.3 implemented — ConnectionContext, ConnectionIndicator, i18n keys, AppProviders wiring, and tests.

### File List

- src/components/contexts/ConnectionContext.jsx (created)
- src/components/contexts/ConnectionContext.test.jsx (created)
- src/components/ConnectionIndicator.jsx (created)
- src/components/hooks.js (modified — removed registerStateListener, owned by ConnectionContext now)
- src/components/AppProviders.jsx (modified — added HasDataBridge + ConnectionProvider)
- public/static/langs/en.json (modified — added connection_indicator_* keys)
- public/static/langs/ko.json (modified — added connection_indicator_* Korean keys)
