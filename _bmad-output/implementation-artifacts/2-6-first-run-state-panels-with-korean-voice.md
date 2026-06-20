---
baseline_commit: 50645f853e7dd0a72ca7b40398b5b0a16536c2a6
---

# Story 2.6: First-run State Panels with Korean Voice

Status: review

## Story

As Jay,
I want clear, friendly screens when I'm not connected or have no subscriptions,
so that I always know the next step (FR14, UX-DR11, UX-DR12).

## Acceptance Criteria

1. **Given** no server connection, **when** the content region renders,
   **then** a not-connected StatePanel (coral colorway) shows:
   - Title: "서버에 연결할 수 없음"
   - Desc: "주소와 인증을 확인해 주세요."
   - Action: a "설정 열기" button (white/ghost — NOT green per UX-DR6)

2. **And given** connecting state with no cached data (`connectionState === 'connecting'|'reconnecting'` AND `!hasData`),
   **then** a connecting panel (amber colorway, pulse animation) shows:
   - Desc: "서버와 연결하고 있어요. 잠시만요."
   - (no action button needed — Jay just waits)

3. **And given** connected state but zero subscriptions,
   **then** a no-subscriptions panel (green colorway) shows:
   - Title: "아직 구독한 토픽이 없어요"
   - Desc: "토픽을 구독하면 여기에 알림이 도착합니다."
   - Action: "＋ 토픽" — the **one and only green button** in the product (UX-DR6).

4. **And** all copy is sourced exclusively from `message/EmptyStates.jsx` via `t()` keys in `ko.json`. `StatePanel` itself has zero Korean strings — it remains the domain-ignorant shell. `EmptyStates.jsx` is the single source of voice (DR12).

5. **And** the full Flow 1 journey is demoable end to end:
   dead screen (`연결할 수 없음`) → "설정 열기" → save creds → "연결됨" → `＋토픽` → subscribe → live feed (no-messages state, Story 3.3).

## Tasks / Subtasks

- [x] Task 1: Create `src/components/message/EmptyStates.jsx` (AC: #1, #2, #3, #4)
  - [x] Export `NotConnectedPanel({ onSettings })` — coral colorway, inline SVG cloud-off icon, "설정 열기" ghost button
  - [x] Export `ConnectingPanel()` — amber colorway, inline SVG loader/signal icon, no CTA, pulse inherited from StatePanel colorway
  - [x] Export `NoSubscriptionsPanel({ onSubscribe })` — green colorway, inline SVG bell icon, green "＋ 토픽" button
  - [x] All strings via `t("...")`, no hardcoded Korean
  - [x] `EmptyStates.jsx` imports `StatePanel` from `@/components/ui/StatePanel` and `Button` from `@/components/ui/Button`
  - [x] `NoSubscriptionsPanel` green button: use `className="bg-accent-ui text-accent-on-surface ..."` directly (it's the one sanctioned green CTA — not a `variant` on Button; Button has no green variant per UX-DR6)
  - [x] **DO NOT** import `useConnection()` inside `EmptyStates.jsx` — panels are dumb; connection logic lives in the wiring layer (App.jsx or a ContentRegion component)

- [x] Task 2: Add i18n keys to `public/static/langs/ko.json` (AC: #1, #2, #3, #4)
  - [x] `"empty_state_not_connected_title"`: `"서버에 연결할 수 없음"`
  - [x] `"empty_state_not_connected_desc"`: `"주소와 인증을 확인해 주세요."`
  - [x] `"empty_state_not_connected_action"`: `"설정 열기"`
  - [x] `"empty_state_connecting_title"`: `"연결 중…"`
  - [x] `"empty_state_connecting_desc"`: `"서버와 연결하고 있어요. 잠시만요."`
  - [x] `"empty_state_no_subscriptions_title"`: `"아직 구독한 토픽이 없어요"`
  - [x] `"empty_state_no_subscriptions_desc"`: `"토픽을 구독하면 여기에 알림이 도착합니다."`
  - [x] `"empty_state_no_subscriptions_action"`: `"＋ 토픽"`

- [x] Task 3: Wire empty state panels into the content region (AC: #1, #2, #3, #5)
  - [x] Identify or create the "content region" component in `App.jsx` (created in Story 2.1 — if not done, see wiring notes below)
  - [x] Import `useConnection()` from `@/components/contexts/ConnectionContext` (Story 2.3 prerequisite — if not done, leave TODO)
  - [x] Import `useLiveQuery` from `dexie-react-hooks` + `db` from `@/app/db` to get subscription count
  - [x] Wiring logic: `connectionState === 'offline'` → `NotConnectedPanel` / `(connecting|reconnecting) && !hasData` → `ConnectingPanel` / `connected && subs.length === 0` → `NoSubscriptionsPanel` / else → children (future Feed, E3)
  - [x] Pass `onSettings` callback into `NotConnectedPanel` (navigates to settings route via `useNavigate()` to `/`)
  - [x] Pass `onSubscribe` callback into `NoSubscriptionsPanel` (wires to subscribe dialog — Story 2.5; use TODO comment if 2.5 not done)

- [x] Task 4: Add tests (AC: #1, #2, #3)
  - [x] Test file: `src/components/message/EmptyStates.test.jsx`
  - [x] Test: `NotConnectedPanel` renders title, desc, and "설정 열기" button; calls `onSettings` on click
  - [x] Test: `ConnectingPanel` renders desc, no button
  - [x] Test: `NoSubscriptionsPanel` renders title, desc, green "＋ 토픽" button; calls `onSubscribe` on click
  - [x] Use Vitest + `@testing-library/react` + `react-i18next` mock (`jest.mock('react-i18next', ...)`)

## Dev Notes

### Hard Prerequisites (Do Not Start Until These Exist)

| Prerequisite | Story | Status | What You Need |
|---|---|---|---|
| `src/components/ui/StatePanel.jsx` | 1.9 | in-progress | `StatePanel` component with colorway variants |
| `src/components/ui/Button.jsx` | 1.6 | done | `Button` component (ghost variant for "설정 열기") |
| `src/components/contexts/ConnectionContext.jsx` | 2.3 | ready-for-dev | `useConnection()` hook (for wiring in Task 3) |

If `StatePanel.jsx` does not yet exist, **stop and complete Story 1.9 first**. `EmptyStates.jsx` cannot render without it.

---

### File Locations

| File | Action |
|---|---|
| `src/components/message/EmptyStates.jsx` | **CREATE NEW** |
| `src/components/message/EmptyStates.test.jsx` | **CREATE NEW** |
| `public/static/langs/ko.json` | **UPDATE** — add 8 keys |
| `src/components/App.jsx` | **MODIFY** — wire panels into content region (depends on Story 2.1 shape) |

**`EmptyStates.jsx` MUST be in `src/components/message/`** — NOT in `ui/`. It is domain-aware (knows Korean copy, product states). ESLint `no-restricted-paths` blocks `ui/` from importing `message/`, not the other way around.

---

### StatePanel API Contract (from Story 1.9)

```jsx
// src/components/ui/StatePanel.jsx — already exists after Story 1.9
// Props:
//   icon:     ReactNode  — icon element passed by consumer
//   title:    string     — i18n'd title (optional)
//   desc:     string     — i18n'd description (optional)
//   action:   ReactNode  — CTA element (optional)
//   colorway: "coral" | "amber" | "green" | "muted"
//   className: string    — extra classes (optional)
```

Colorway → token mapping (for your own awareness; StatePanel handles this internally):

| Colorway | Icon tile bg | Icon color | Use case |
|---|---|---|---|
| `coral` | `bg-priority-max/10` | `text-priority-max` | Not connected |
| `amber` | `bg-priority-high/10` | `text-priority-high` | Connecting (pulses) |
| `green` | `bg-accent-text/10` | `text-accent-text` | No subscriptions |
| `muted` | `bg-muted/10` | `text-muted` | No messages (Story 3.3) |

The amber colorway's pulse animation is **already baked into StatePanel**:
`animate-pulse motion-reduce:animate-none` on the icon tile — you do NOT add it in EmptyStates.jsx.

---

### EmptyStates.jsx Component API

```jsx
// src/components/message/EmptyStates.jsx

import { useTranslation } from "react-i18next";
import StatePanel from "@/components/ui/StatePanel";
import Button from "@/components/ui/Button";

// Icon approach: use inline SVG or lucide-react (if installed).
// If no icon library is available, use simple inline SVG viewBox="0 0 24 24".
// The icon tile is 64×64 and tinted by the colorway — a 24px SVG centered inside.

export const NotConnectedPanel = ({ onSettings }) => {
  const { t } = useTranslation();
  return (
    <StatePanel
      icon={<CloudOffIcon />}
      title={t("empty_state_not_connected_title")}
      desc={t("empty_state_not_connected_desc")}
      action={
        <Button variant="ghost" onClick={onSettings}>
          {t("empty_state_not_connected_action")}
        </Button>
      }
      colorway="coral"
    />
  );
};

export const ConnectingPanel = () => {
  const { t } = useTranslation();
  return (
    <StatePanel
      icon={<SignalIcon />}
      title={t("empty_state_connecting_title")}
      desc={t("empty_state_connecting_desc")}
      colorway="amber"
      // No action — amber pulse is shown; user just waits
    />
  );
};

export const NoSubscriptionsPanel = ({ onSubscribe }) => {
  const { t } = useTranslation();
  return (
    <StatePanel
      icon={<BellIcon />}
      title={t("empty_state_no_subscriptions_title")}
      desc={t("empty_state_no_subscriptions_desc")}
      action={
        // THE ONE GREEN BUTTON (UX-DR6). Do NOT add a green variant to Button.
        // Override inline: bg-accent-ui text-accent-on-surface rounded-sm px-4 py-2
        <button
          type="button"
          onClick={onSubscribe}
          className="bg-accent-ui text-accent-on-surface font-semibold rounded-sm px-4 py-2 focus:outline-none focus:ring-2 focus:ring-focus-ring"
        >
          {t("empty_state_no_subscriptions_action")}
        </button>
      }
      colorway="green"
    />
  );
};
```

**⚠ The green button is a ONE-OFF.** Using a raw `<button>` with accent tokens is correct here. Do NOT:
- Add a `green` or `accent` variant to `Button.jsx` in `ui/` (UX-DR6 — green is never a Button variant)
- Use `bg-[#42D392]` raw hex (tokens only)
- Place any styling token not already in `tokens.css`

---

### Wiring Logic — Content Region

This is what the content region component does once all dependencies are in place:

```jsx
// Wiring lives in App.jsx (or a ContentRegion component extracted from it)
// Requires: useConnection() from Story 2.3, useLiveQuery from dexie-react-hooks

import { useConnection } from "@/components/contexts/ConnectionContext";
import { useLiveQuery } from "dexie-react-hooks";
import db from "@/app/db";
import { NotConnectedPanel, ConnectingPanel, NoSubscriptionsPanel } from "@/components/message/EmptyStates";

// Inside your component:
const { connectionState, hasData } = useConnection();
const subscriptions = useLiveQuery(() => db.subscriptions.toArray(), []) ?? [];

// Decision tree (in this priority order):
if (connectionState === "offline") {
  return <NotConnectedPanel onSettings={() => navigate("/settings")} />;
}
if ((connectionState === "connecting" || connectionState === "reconnecting") && !hasData) {
  return <ConnectingPanel />;
}
if (connectionState === "connected" && subscriptions.length === 0) {
  return <NoSubscriptionsPanel onSubscribe={openSubscribeDialog} />;
}
return <>{children}</>; // Feed renders here in E3
```

**Connection state values** (from `ConnectionContext` — Story 2.3):
- `"offline"` — no subscriptions in context OR all disconnected (no prior connection)
- `"connecting"` — connecting for the first time (never was connected)
- `"reconnecting"` — was connected previously, now reconnecting
- `"connected"` — at least one subscription is connected

`hasData` = true when at least one notification exists in Dexie (derived from `db.notifications.limit(1).count()`).

**Critical:** When `hasData` is true AND state is `connecting`/`reconnecting`, do NOT show ConnectingPanel — let the feed render with cached data (see DataBoundary story 1.9: "render cached feed immediately").

---

### Dependency Story Status Warning

This story has the following upstream stories in `backlog` (no story file yet):
- **2.1** (App shell + AppProviders.jsx) — needed for `App.jsx` content region wiring
- **2.4** (Server + auth entry) — needed for the "설정 열기" target route
- **2.5** (SubscribeDialog) — needed for the "＋ 토픽" CTA callback

**Recommended implementation approach:**
1. **Do Task 1 (EmptyStates.jsx) and Task 2 (i18n) immediately** — no blockers.
2. **Do Task 3 (wiring) last**, when stories 2.1 and 2.5 are done. If those aren't done yet, add TODO comments in App.jsx:
   ```jsx
   // TODO 2.6: wire NotConnectedPanel here (requires 2.1 content region)
   // TODO 2.6: wire ConnectingPanel here (requires 2.3 ConnectionContext)
   // TODO 2.6: wire NoSubscriptionsPanel + onSubscribe (requires 2.5 SubscribeDialog)
   ```
3. Story 2.6 is not **done** until Task 3 is complete and the Flow 1 journey is demoable.

---

### Icon Approach

Check `package.json` for an installed icon library. If `lucide-react` is present, use:
```jsx
import { WifiOff, Loader2, Bell } from "lucide-react";
// WifiOff → NotConnectedPanel
// Loader2 → ConnectingPanel  
// Bell    → NoSubscriptionsPanel
```

If no icon library is installed, use minimal inline SVGs (24px, `currentColor`):
```jsx
// CloudOff-like icon for not-connected
const CloudOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M2 2l20 20M5.782 5.782A7 7 0 0 0 12 19h7a5 5 0 0 0 1.79-9.65" />
    <path d="M17.386 17.386a7 7 0 0 1-12.154-6.77" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);
```

**NEVER** import from `@mui/icons-material` — MUI is being removed.

---

### Korean Voice Rules (UX-DR12)

| Principle | Applies to This Story |
|---|---|
| 해요체 (casual polite) | "연결하고 있어요", "도착합니다" |
| Reassure first; point at situation and next move | "주소와 인증을 확인해 주세요." (not "오류 발생") |
| Verbs on buttons | "설정 열기" (verb), "＋ 토픽" (action) |
| Never blame Jay | "확인해 주세요" ≠ "잘못 입력하셨습니다" |
| Quiet, not performative | No "！" exclamation marks, no "🚀" emoji |

These exact strings are canonical — do not paraphrase:
- `"서버에 연결할 수 없음"` (no verb — noun form for title, per UX table)
- `"주소와 인증을 확인해 주세요."` (period at end)
- `"설정 열기"` (no "으로 이동" etc.)
- `"서버와 연결하고 있어요. 잠시만요."` (two sentences with period)
- `"아직 구독한 토픽이 없어요"` (no period — intentional per UX table)
- `"토픽을 구독하면 여기에 알림이 도착합니다."` (period at end)
- `"＋ 토픽"` (full-width ＋ U+FF0B, not regular ASCII +)

---

### i18n Key Reference

Complete set of new ko.json entries (key-value format for copy/paste):

```json
"empty_state_not_connected_title":   "서버에 연결할 수 없음",
"empty_state_not_connected_desc":    "주소와 인증을 확인해 주세요.",
"empty_state_not_connected_action":  "설정 열기",
"empty_state_connecting_title":      "연결 중…",
"empty_state_connecting_desc":       "서버와 연결하고 있어요. 잠시만요.",
"empty_state_no_subscriptions_title": "아직 구독한 토픽이 없어요",
"empty_state_no_subscriptions_desc": "토픽을 구독하면 여기에 알림이 도착합니다.",
"empty_state_no_subscriptions_action": "＋ 토픽"
```

Note: `ko.json` keys are in no consistent alphabetical order in the existing file (checked). Add these near other `empty_` or state-related keys if any exist, or append near the end. Maintain valid JSON — no trailing commas.

---

### Critical Anti-Patterns to Avoid

```jsx
// ✗ Domain words in StatePanel (StatePanel is domain-ignorant)
// StatePanel.jsx must stay empty of Korean text — the `title` prop is passed by EmptyStates.jsx

// ✗ Green variant on Button
const button = cva("...", { variants: { variant: { green: "bg-accent-ui" } } }); // WRONG

// ✗ Hardcoded Korean in EmptyStates.jsx
<p>서버에 연결할 수 없음</p>  // ✗ — must go through t()

// ✗ Connection logic inside EmptyStates.jsx
export const NotConnectedPanel = () => {
  const { connectionState } = useConnection(); // ✗ — panels are dumb display components
};

// ✗ Wrong icon library
import WifiOffIcon from "@mui/icons-material/WifiOff"; // ✗ — MUI is being removed

// ✗ Wrong file location
// src/components/ui/EmptyStates.jsx  // ✗ — ui/ is domain-ignorant; this is message/

// ✗ ASCII + in the button label
t("empty_state_no_subscriptions_action") // must return "＋ 토픽" (full-width ＋)
// Verify: ko.json value uses U+FF0B (＋), not U+002B (+)

// ✗ Showing ConnectingPanel when hasData is true
if (connectionState === "connecting") return <ConnectingPanel />; // WRONG — ignores hasData
// CORRECT: if ((connectionState === "connecting" || connectionState === "reconnecting") && !hasData)
```

---

### Testing Approach

Use the Vitest + RTL pattern established in the project. For i18next, mock it:

```jsx
// EmptyStates.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NotConnectedPanel, ConnectingPanel, NoSubscriptionsPanel } from "./EmptyStates";

// Minimal i18next mock
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,  // returns key as text so tests can assert on key names
  }),
}));

describe("NotConnectedPanel", () => {
  it("calls onSettings when action button is clicked", () => {
    const onSettings = vi.fn();
    render(<NotConnectedPanel onSettings={onSettings} />);
    fireEvent.click(screen.getByText("empty_state_not_connected_action"));
    expect(onSettings).toHaveBeenCalledOnce();
  });
});

describe("ConnectingPanel", () => {
  it("renders description, no action button", () => {
    render(<ConnectingPanel />);
    expect(screen.getByText("empty_state_connecting_desc")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("NoSubscriptionsPanel", () => {
  it("calls onSubscribe when green button is clicked", () => {
    const onSubscribe = vi.fn();
    render(<NoSubscriptionsPanel onSubscribe={onSubscribe} />);
    fireEvent.click(screen.getByText("empty_state_no_subscriptions_action"));
    expect(onSubscribe).toHaveBeenCalledOnce();
  });
});
```

No `fake-indexeddb` needed — EmptyStates.jsx is a pure display component with no Dexie access.

---

### Architecture Boundary Summary

```
src/components/
├── message/
│   └── EmptyStates.jsx   ← NEW (domain-aware: owns Korean copy, fills StatePanel)
└── ui/
    └── StatePanel.jsx    ← EXISTING (domain-ignorant: shell only, zero Korean strings)
```

Boundary rule: `ui/` → `message/` imports are **FORBIDDEN** (ESLint `no-restricted-paths`).
`message/` → `ui/` imports are **ALLOWED** (EmptyStates imports StatePanel — this is correct).

### Project Structure Notes

- `EmptyStates.jsx` is listed in the architecture directory structure: `src/components/message/EmptyStates.jsx` `fills ui/StatePanel with no-subscriptions/no-messages copy`
- `no-messages` copy (muted colorway, Story 3.3) is **NOT** in scope for this story — EmptyStates.jsx will gain that export in Story 3.3.
- The `message/` folder itself should exist after Story 3.1 creates it; if doing this story first, create the folder.

### References

- Epic spec: `_bmad-output/planning-artifacts/epics.md` § Story 2.6
- State panel colorways: Story 1.9 dev notes → Colorway Token Mapping table
- StatePanel component API: Story 1.9 dev notes → `StatePanel.jsx` API contract
- ConnectionContext API: Story 2.3 dev notes → `useConnection()` and state values
- Korean voice copy: `_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/EXPERIENCE.md` § State Patterns table + Voice and Tone
- UX colorway spec: `_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/DESIGN.md` § empty-state-icon-tile
- Green button rule: epics.md § Story 2.6 AC + Architecture § UX-DR6 ("the one green CTA")
- Token names: `src/styles/tokens.css` — `--color-accent-ui`, `--color-accent-on-surface`, `--color-priority-max`, `--color-priority-high`
- i18n pattern: architecture.md § i18n → key format `<feature>_<element>_<action>`
- Architecture boundary: architecture.md § Architectural Boundaries → "ui/ may not import message/"
- Architecture file location: architecture.md § Complete Project Directory Structure → `message/EmptyStates.jsx`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Task 1: Created `src/components/message/EmptyStates.jsx` with `NotConnectedPanel` (coral), `ConnectingPanel` (amber), `NoSubscriptionsPanel` (green). All strings via `t()`, no hardcoded Korean. Green button uses raw `<button>` with `bg-accent-ui` token (UX-DR6). No `useConnection()` import — panels are pure display components.
- Task 2: Added 8 i18n keys to `public/static/langs/ko.json`. Verified canonical strings match spec exactly, including U+FF0B full-width plus in `empty_state_no_subscriptions_action`.
- Task 3: Created `ContentRegion` component in `App.jsx` with full decision tree: offline → `NotConnectedPanel`, connecting/reconnecting+!hasData → `ConnectingPanel`, connected+0 subs → `NoSubscriptionsPanel`, else null (E3 feed). `SubscribeDialog` (Story 2.5, now in review) wired with `onSuccess` navigating to subscription route. Added route `<Route path={routes.app} element={<ContentRegion />} />` to `NewShell`.
- Task 4: Created 18 tests in `src/components/message/EmptyStates.test.jsx` using Vitest + createRoot/act pattern (no @testing-library/react — not installed). Tests cover: render of title/desc/action keys, click callbacks, colorway token classes, and architecture boundary (no hardcoded Korean). All 18 tests pass; 210/210 total suite passes, no regressions.

### File List

- `src/components/message/EmptyStates.jsx` — NEW
- `src/components/message/EmptyStates.test.jsx` — NEW
- `public/static/langs/ko.json` — MODIFIED (8 keys added)
- `src/components/App.jsx` — MODIFIED (ContentRegion component + imports + route wired)

### Change Log

- 2026-06-20: Implemented Story 2.6 — EmptyStates.jsx with 3 Korean-voice panels, 8 i18n keys in ko.json, ContentRegion wiring in App.jsx, 18 unit tests. All ACs satisfied.
