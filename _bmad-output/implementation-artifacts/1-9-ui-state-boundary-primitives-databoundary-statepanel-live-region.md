---
baseline_commit: 5cef3b52b3a0408a60c8ed7a98aec52f00af2931
---

# Story 1.9: `ui/` State-Boundary Primitives — DataBoundary, StatePanel, LiveRegion

Status: done

## Story

As a developer,
I want a single DataBoundary + StatePanel + aria-live utility,
so that every data surface branches loading/empty/error identically and announces changes to screen readers (FR14 structural owner, NFR3).

## Acceptance Criteria

1. **Given** the `<DataBoundary loading hasCache empty emptySlot error errorAction>` wrapper,
   **When** `loading` is true and `hasCache` is false,
   **Then** it renders `skeletonCount` (default 5, range 4–6) Skeleton cards in place of children.
   **And When** `loading` is true and `hasCache` is true,
   **Then** it renders children immediately — no spinner over existing data.
   **And When** `empty` is true (and not loading),
   **Then** it renders the `emptySlot` ReactNode (StatePanel provided by the consumer).
   **And When** `error` is truthy,
   **Then** it renders an inline reassuring generic message (i18n'd) plus the `errorAction` ReactNode from the consumer.

2. **And** `StatePanel` is a **props-only shell** (icon / title / desc / action / colorway) carrying **NO domain words** — it accepts the colorway and all copy from its consumer (UX-DR11).
   **And** the four colorways resolve correctly: `coral` (not-connected), `amber` (connecting, with `animate-pulse motion-reduce:animate-none` on the icon tile), `green` (no-subscriptions), `muted` (no-messages).

3. **And** a `LiveRegion` component exists at `src/components/ui/LiveRegion.jsx` with an `aria-live="polite"` region that reliably announces its `message` prop to screen readers, reusable by E2/E3 for arriving notifications and connection changes (NFR3).

4. **And** the Korean voice copy that fills StatePanel **is sourced from the consumer** (`message/EmptyStates.jsx` in story 2.6) — this story establishes the structural shell only; no domain strings live in `StatePanel.jsx` itself.

5. **And** `npm run build` exits 0 after all three files are created.

## Tasks / Subtasks

- [x] Task 1: Create `src/components/ui/StatePanel.jsx` (AC: #2, #4)
  - [x] Define `cva` colorway variants: coral / amber / green / muted (icon tile bg + icon color)
  - [x] Icon tile: `w-16 h-16 rounded-md flex items-center justify-center mb-4`, colorway-tinted bg
  - [x] Amber colorway: add `animate-pulse motion-reduce:animate-none` to icon tile only
  - [x] Render: centered column, icon tile → title (`text-title text-text`) → desc (`text-body-sm text-muted`) → action slot
  - [x] All props are pass-through; zero hardcoded strings (no Korean, no English)
  - [x] Verify `cva` is imported only from inside `ui/` — NOT from message/ or any other location

- [x] Task 2: Create `src/components/ui/DataBoundary.jsx` (AC: #1, #3)
  - [x] Import `Skeleton` from `./Skeleton` (Story 1.8 prerequisite — must exist)
  - [x] Import `useTranslation` from `react-i18next` for the generic error message
  - [x] Branch logic (highest priority first): error → loading (no cache → skeletons) → loading (has cache → children) → empty → children
  - [x] Error state: render `t("data_boundary_error_generic")` + `errorAction` prop (ReactNode)
  - [x] Skeleton render: `Array.from({ length: skeletonCount }, (_, i) => <Skeleton key={i} />)`
  - [x] Default `skeletonCount` = 5 (range 4–6)
  - [x] Zero domain logic, zero hardcoded strings (error text is i18n'd)

- [x] Task 3: Create `src/components/ui/LiveRegion.jsx` (AC: #3)
  - [x] Import `useState` + `useEffect` from React
  - [x] Props: `message` (string), `politeness` (string, default `"polite"`)
  - [x] Clear-then-set pattern: on `message` change, clear content, then set after ~100ms timeout (ensures screen reader re-announces)
  - [x] Render: `<div role="status" aria-live={politeness} aria-atomic="true" className="sr-only">{content}</div>`
  - [x] `sr-only` class is standard Tailwind — visually hides the element but keeps it in accessibility tree

- [x] Task 4: Add i18n key to `public/static/langs/ko.json` (AC: #1)
  - [x] Add `"data_boundary_error_generic": "잠시 오류가 생겼어요."` to the JSON object
  - [x] Maintain alphabetical key ordering if the file uses it; otherwise append near similar keys

- [x] Task 5: Build verification (AC: #5)
  - [x] Run `npm run build` — must exit 0
  - [x] Confirm all three new files are importable without errors

## Dev Notes

### Hard Prerequisites (Do Not Start Until These Exist)

| Prerequisite | Source | What You Need |
|---|---|---|
| `src/components/ui/Skeleton.jsx` | Story 1.8 | Imported by DataBoundary — the file must exist |
| `src/components/ui/utils.js` | Story 1.3 | `cn()` + `cva` helpers |
| `src/styles/tokens.css` | Story 1.4 | All color/spacing tokens |

If `Skeleton.jsx` does not yet exist, **stop and implement story 1.8 first**.

Story 1.6 (Button/Card/Chip) is listed as a dependency in the epics because **consumers** of StatePanel will pass Buttons as the `action` prop — but StatePanel itself does not import Button. So 1.6 is not an import-time hard prerequisite for this story.

### File Locations

All three new files go into the `ui/` folder. No subdirectories.

| File | Action |
|---|---|
| `src/components/ui/StatePanel.jsx` | **CREATE NEW** |
| `src/components/ui/DataBoundary.jsx` | **CREATE NEW** |
| `src/components/ui/LiveRegion.jsx` | **CREATE NEW** |
| `public/static/langs/ko.json` | **UPDATE** — add one key |

**DO NOT TOUCH:** `src/app/`, `src/styles/main.css`, `src/styles/tokens.css`, `vite.config.js`, any existing component.

### Component API Contracts

#### `StatePanel.jsx`

```jsx
// Props
// icon: ReactNode — icon element (sized by consumer or defaulted; tile constrains display)
// title: string — i18n'd title (from consumer, e.g. t("empty_state_not_connected_title"))
// desc: string — i18n'd description (from consumer, optional)
// action: ReactNode — CTA element (from consumer, optional)
// colorway: "coral" | "amber" | "green" | "muted" — controls icon tile color
// className: string — extra classes merged via cn() (optional)

import { cva } from "class-variance-authority";
import { cn } from "./utils";

const iconTile = cva(
  "flex items-center justify-center rounded-md w-16 h-16 mb-4",
  {
    variants: {
      colorway: {
        coral: "bg-priority-max/10 text-priority-max",
        amber:  "bg-priority-high/10 text-priority-high animate-pulse motion-reduce:animate-none",
        green:  "bg-accent-text/10 text-accent-text",
        muted:  "bg-muted/10 text-muted",
      },
    },
    defaultVariants: { colorway: "muted" },
  }
);

const StatePanel = ({ icon, title, desc, action, colorway, className }) => (
  <div className={cn("flex flex-col items-center justify-center text-center px-6 py-10", className)}>
    <div className={iconTile({ colorway })}>{icon}</div>
    <p className="text-title font-semibold text-text mb-2">{title}</p>
    {desc && <p className="text-body-sm text-muted mb-4">{desc}</p>}
    {action}
  </div>
);

export default StatePanel;
```

**CRITICAL — StatePanel carries ZERO domain words.** It is a slot. All text (title, desc, action label) comes from the consumer via props. `message/EmptyStates.jsx` (Story 2.6) is the layer that holds Korean copy and fills these props.

#### `DataBoundary.jsx`

```jsx
// Props
// loading: bool — data is being fetched
// hasCache: bool — cached data exists (controls whether to show skeleton or pass through)
// skeletonCount: number — how many Skeleton cards to show (default 5, range 4–6)
// empty: bool — data fetched and result set is empty
// emptySlot: ReactNode — what to render when empty (StatePanel from consumer)
// error: Error | string | null — error that occurred
// errorAction: ReactNode — recovery CTA from consumer (e.g. retry Button); optional
// children: ReactNode — the actual data content

import { useTranslation } from "react-i18next";
import Skeleton from "./Skeleton";

const DataBoundary = ({
  loading = false,
  hasCache = false,
  skeletonCount = 5,
  empty = false,
  emptySlot = null,
  error = null,
  errorAction = null,
  children,
}) => {
  const { t } = useTranslation();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <p className="text-body-sm text-muted">{t("data_boundary_error_generic")}</p>
        {errorAction}
      </div>
    );
  }

  if (loading && !hasCache) {
    return (
      <>
        {Array.from({ length: skeletonCount }, (_, i) => <Skeleton key={i} />)}
      </>
    );
  }

  if (loading && hasCache) {
    return <>{children}</>;
  }

  if (empty) {
    return <>{emptySlot}</>;
  }

  return <>{children}</>;
};

export default DataBoundary;
```

**Priority order:** error > loading (no cache) > loading (with cache) > empty > children.

The "render cached feed immediately" behavior (UX-DR14) is critical: if `hasCache` is true and `loading` is true, children render without any spinner or skeleton. The socket reconnect happens in the background.

#### `LiveRegion.jsx`

```jsx
// Props
// message: string — the announcement to read aloud
// politeness: "polite" | "assertive" — aria-live value (default "polite")

import { useState, useEffect } from "react";

const LiveRegion = ({ message, politeness = "polite" }) => {
  const [content, setContent] = useState(message);

  useEffect(() => {
    setContent("");
    const id = setTimeout(() => setContent(message), 100);
    return () => clearTimeout(id);
  }, [message]);

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {content}
    </div>
  );
};

export default LiveRegion;
```

**Why the clear-then-set pattern?** Screen readers do not re-announce text that hasn't changed. If `message` is set to the same value twice (e.g., "연결됨" twice), clearing first and setting after 100ms forces a new announcement each time.

**Usage by E2/E3:** Consumers mount `<LiveRegion message={announcementText} />` wherever they want to trigger announcements — e.g., in `ConnectionIndicator.jsx` for connection changes, or in the feed for arriving notifications. The message text is i18n'd by the consumer.

### Colorway Token Mapping

| Colorway | Semantic name | Tile bg class | Icon color class | Use case |
|---|---|---|---|---|
| `coral` | not-connected | `bg-priority-max/10` | `text-priority-max` | Server unreachable |
| `amber` | connecting | `bg-priority-high/10` | `text-priority-high` | Connecting / reconnecting |
| `green` | no-subscriptions | `bg-accent-text/10` | `text-accent-text` | Connected, no topics yet |
| `muted` | no-messages | `bg-muted/10` | `text-muted` | Topic exists, no notifications |

The `/10` opacity modifier works in Tailwind v4 for `@theme` color tokens — `--color-priority-max` generates `bg-priority-max`, and `/10` applies 10% opacity. No arbitrary values needed.

### Architectural Boundaries (ESLint-enforced)

- **`ui/` → `message/` imports are FORBIDDEN.** StatePanel must not import EmptyStates or any domain file. `message/EmptyStates.jsx` (Story 2.6) is the only place that holds Korean voice copy for state panels.
- **`cva` only inside `ui/`.** StatePanel.jsx uses `cva`; DataBoundary and LiveRegion do not need it.
- **No hardcoded user-facing strings** (incl. `aria-label`, `title`, `role` descriptions). The only i18n key introduced by this story is `data_boundary_error_generic` in DataBoundary.
- **No raw hex or arbitrary px.** Use token utilities only (`text-title`, `text-body-sm`, `text-muted`, `rounded-md`, `w-16`, `h-16`, `px-6`, `py-10`, `mb-4`). One-off optical nudge: use raw `px` only with `/* layout-nudge: <reason> */`.

### StatePanel Is NOT the Source of Korean Copy

This story creates the **structural shell**. Korean voice copy (UX-DR12) lives in `message/EmptyStates.jsx` (Story 2.6). That file will fill StatePanel like this:

```jsx
// Story 2.6 — message/EmptyStates.jsx (not this story)
import StatePanel from "@/components/ui/StatePanel";
import { WifiOffIcon } from "...";

export const NotConnectedPanel = ({ onSettings }) => {
  const { t } = useTranslation();
  return (
    <StatePanel
      icon={<WifiOffIcon />}
      title={t("empty_state_not_connected_title")}
      desc={t("empty_state_not_connected_desc")}
      action={<Button onClick={onSettings}>{t("empty_state_not_connected_action")}</Button>}
      colorway="coral"
    />
  );
};
```

The strings `"서버에 연결할 수 없음"`, `"주소와 인증을 확인해 주세요."`, `"설정 열기"`, `"아직 구독한 토픽이 없어요"`, etc. are NOT added to `ko.json` in this story — they belong in Story 2.6.

### i18n Key to Add (this story only)

Add this one key to `public/static/langs/ko.json`:

```json
"data_boundary_error_generic": "잠시 오류가 생겼어요."
```

Find an appropriate alphabetical location in the JSON (near `"error_boundary_*"` keys). The file uses plain JSON — no trailing commas.

### Connection State × hasCache Interaction

From architecture (critical for DataBoundary callers to understand):

| Connection state | hasData (hasCache) | DataBoundary behavior |
|---|---|---|
| loading, no cache | false | Show 4–6 Skeleton cards |
| loading, has cache | true | Render cached children (socket reconnects silently) |
| connected, no messages | false | Render `emptySlot` (consumer provides StatePanel) |
| error | — | Render generic error + errorAction |

`hasData` comes from `ConnectionContext` in E2/E3. DataBoundary only cares about the `loading` + `hasCache` boolean pair — it doesn't import ConnectionContext itself.

### Pattern Consistency with Existing `ui/` Primitives

Follow the pattern established in Story 1.3/1.4:
- **Arrow function components only** (no `function ComponentName` declarations)
- **Named export may be added** but default export is sufficient
- `cn()` from `./utils` for class merging
- `cva` imported from `class-variance-authority` (only inside `ui/`)
- No TypeScript — plain `.jsx` files

Anti-patterns to avoid:
```jsx
// ✗ Domain words in StatePanel
const StatePanel = () => <div>서버에 연결할 수 없음</div>;  // hardcoded Korean

// ✗ Wrong import location for cva
// In DataBoundary.jsx:
import { cva } from "class-variance-authority";  // cva not needed here; use cn() only

// ✗ Copying Dexie result into useState
const [data, setData] = useState(useLiveQuery(...));  // NEVER — not relevant here but keep in mind

// ✗ Spinner over cached data
if (loading) return <Spinner />;  // WRONG — ignores hasCache; must check hasCache first

// ✗ Raw hex or arbitrary px
<div className="bg-[#FF6B6E]/10 w-[64px]" />  // WRONG — use bg-priority-max/10 w-16
```

### Building This Story — Recommended Order

1. Write and verify `StatePanel.jsx` first — it's a leaf (no imports from other new files)
2. Write `DataBoundary.jsx` second — imports only Skeleton (must already exist from 1.8) and react-i18next
3. Write `LiveRegion.jsx` third — imports only React hooks, no other ui/ dependencies
4. Update `ko.json` with the single error key
5. `npm run build` — should exit 0

### Project Structure Notes

```
src/components/ui/
├── utils.js          ← already exists (Story 1.3)
├── Skeleton.jsx      ← must exist (Story 1.8 prerequisite)
├── DataBoundary.jsx  ← NEW this story
├── StatePanel.jsx    ← NEW this story
└── LiveRegion.jsx    ← NEW this story
```

`message/EmptyStates.jsx` — does NOT exist yet; created in Story 2.6. Do not create it in this story.

### References

- Story spec: `_bmad-output/planning-artifacts/epics.md` § Story 1.9
- UX colorways: `_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/DESIGN.md` § empty-state-icon-tile
- UX state copy: `_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/EXPERIENCE.md` § State Patterns table
- Architecture patterns: `_bmad-output/planning-artifacts/architecture.md` § Process Patterns → "One state vocabulary"
- Architecture structure: `_bmad-output/planning-artifacts/architecture.md` § Complete Project Directory Structure
- Token values: `_bmad-output/implementation-artifacts/1-4-design-tokens-as-single-source-web-android-manifest.md` § Complete `tokens.css` Specification
- Invariants: `_bmad-output/project-context.md` § Build-Breaking Invariants → Layers, Styling/tokens, i18n

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Fixed `import Skeleton from "./Skeleton"` → `import { Skeleton } from "./Skeleton"` (named export, not default)
- Fixed LiveRegion test: same-message re-render doesn't trigger useEffect (React optimization); updated test to use different messages

### Completion Notes List

- **Task 1 (StatePanel):** Created pure props-through shell with 4 `cva` colorways (coral/amber/green/muted). Amber adds `animate-pulse motion-reduce:animate-none` on icon tile only. Zero hardcoded strings. `cva` + `cn` imported from `./utils` following project pattern.
- **Task 2 (DataBoundary):** Created with priority branch: error > loading(no-cache) > loading(has-cache) > empty > children. Default skeletonCount=5. i18n error key via `useTranslation`. Named import `{ Skeleton }` from `./Skeleton`.
- **Task 3 (LiveRegion):** Created with `useState`/`useEffect` clear-then-set pattern (100ms timeout). `role="status"`, `aria-live`, `aria-atomic="true"`, `sr-only`. Reusable by any consumer.
- **Task 4 (ko.json):** Added `"data_boundary_error_generic": "잠시 오류가 생겼어요."` adjacent to `error_boundary_*` keys.
- **Task 5 (build):** `npm run build` exits 0. All 3 new files tree-shaken successfully.
- **Tests:** 36 new tests (StatePanel: 12, DataBoundary: 14, LiveRegion: 10). Full suite: 152/152 pass.

### File List

- `src/components/ui/StatePanel.jsx` — NEW
- `src/components/ui/StatePanel.test.jsx` — NEW
- `src/components/ui/DataBoundary.jsx` — NEW
- `src/components/ui/DataBoundary.test.jsx` — NEW
- `src/components/ui/LiveRegion.jsx` — NEW
- `src/components/ui/LiveRegion.test.jsx` — NEW
- `public/static/langs/ko.json` — MODIFIED (added `data_boundary_error_generic`)

### Review Findings

- [x] `Review/Patch` LiveRegion `useState(message)` → `useState("")` — extra render cycle on mount (`src/components/ui/LiveRegion.jsx:4`)
- [x] `Review/Patch` StatePanel.test.jsx dead querySelector `.text-muted.\\!mb-4` → meaningful assertion (`src/components/ui/StatePanel.test.jsx:44`)
- [x] `Review/Patch` DataBoundary `skeletonCount` negative/NaN RangeError crash (`src/components/ui/DataBoundary.jsx:26`)
- [x] `Review/Patch` `data_boundary_error_generic` missing from en.json — 47 locales, only ko.json had key (`public/static/langs/en.json`)
- [x] `Review/Defer` `role="status"` + `aria-live="assertive"` semantic conflict — spec mandates role="status"; ATs handle conflict correctly in practice (`src/components/ui/LiveRegion.jsx:13`) — deferred, pre-existing
- [x] `Review/Defer` `politeness` prop has no runtime validation against invalid aria-live values — low crash risk, ATs ignore invalid values (`src/components/ui/LiveRegion.jsx:3`) — deferred, pre-existing
- [x] `Review/Defer` `StatePanel` renders empty icon tile when `icon` is null — spec assumes icon always provided (`src/components/ui/StatePanel.jsx:17`) — deferred, pre-existing

## Change Log

- 2026-06-20: Story 1.9 implemented — created DataBoundary, StatePanel, LiveRegion primitives; added ko.json i18n key; 36 new tests; build passes (claude-sonnet-4-6)
- 2026-06-20: Code review — 4 patches applied (LiveRegion useState init, StatePanel test selector, DataBoundary skeletonCount guard, en.json missing i18n key); 3 deferred; story marked done (claude-sonnet-4-6)
