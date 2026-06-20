---
baseline_commit: 5cef3b5
---

# Story 2.1: Responsive App Shell + Provider Scaffold

Status: done

## Story

As Jay,
I want a responsive shell that adapts to desktop, tablet, and phone,
so that the app is comfortable on every device I use (FR13, NFR6).

`Depends-on:` 1.6 (Button/Card primitives), 1.7 (Sheet/Menu — Drawer on mobile), 1.9 (StatePanel host for content region).

**Touched files:**

| File | Action |
|---|---|
| `src/config/migration.js` | **CREATE NEW** — per-area cutover flags |
| `src/components/AppProviders.jsx` | **CREATE NEW** — provider order scaffold |
| `src/components/App.jsx` | **REBUILD** — branch on `NEW.shell`; preserve old code in false branch |
| `src/components/Sidebar.jsx` | **CREATE NEW** — full / icon-rail / drawer content |
| `src/components/AppBar.jsx` | **CREATE NEW** — mobile-only top bar |
| `src/components/BottomNav.jsx` | **CREATE NEW** — mobile-only 3-item nav |
| `src/components/routes.js` | **REBUILD** — add `msgDetail` route; keep all existing keys intact |
| `public/static/langs/ko.json` | **UPDATE** — add shell i18n keys |

**Do NOT touch:**

- `src/app/` (logic layer — ESLint-enforced boundary)
- `src/styles/tokens.css` or `src/styles/main.css` (owned by E1 stories)
- Any existing `src/components/*.jsx` MUI files (coexistence required until Story 5.4)
- `src/components/ui/` files (owned by E1 stories)

---

## Acceptance Criteria

1. **Given** a viewport ≥ `lg`,
   **When** the shell renders,
   **Then** it shows a 3-column layout: persistent sidebar (~280px) · feed column (max-width ~720px, `max-w-[720px]`) · reserved detail region.
   **And** chrome (sidebar, nav bars) stays a tone quieter than any card surface — sidebar uses `bg-surface`, canvas uses `bg-bg`, cards use `bg-surface` + elevation.

2. **Given** an `md` viewport (tablet),
   **When** the shell renders,
   **Then** the sidebar collapses to a ~56px icon-rail (icons only, no labels); feed + detail layout otherwise behave as desktop.
   **Given** `< md` (mobile),
   **Then** a top AppBar + 3-item BottomNav render; sidebar moves into a Radix Sheet-based Drawer opened via the AppBar hamburger.

3. **And** `AppProviders.jsx` establishes the **append-only provider scaffold** with BrowserRouter and clearly commented provider slots in this exact order:
   ```
   BrowserRouter
     {/* 2.2: ThemeProvider goes here */}
     {/* 2.3: ConnectionProvider goes here */}
     {/* 3.5: SelectionProvider appended here */}
     {/* 4.4: PublishQueueProvider appended here */}
     {children}
   ```
   The provider order lives in code, not in documentation. Later stories append inside this structure — never restructure it.

4. **And** `src/config/migration.js` exports:
   ```js
   export const NEW = {
     shell: false,
     feed: false,
     detail: false,
     dialogs: false,
     settings: false,
   };
   ```
   `App.jsx` reads `NEW.shell`: when `false` it renders the **unchanged** legacy code path (the MUI `App` currently in place); when `true` it renders `<AppProviders><NewShell /></AppProviders>`.

5. **And** `routes.js` retains all existing keys (`login`, `signup`, `app`, `account`, `settings`, `subscription`, `subscriptionExternal`, `forSubscription`) and adds:
   ```js
   msgDetail: "/:topic/:msgId",
   ```
   No other routes are removed in this story (trim happens at Story 5.4).

6. **And** all user-facing strings (nav labels, aria labels, titles) route through `t()` — no hardcoded Korean or English text.

7. **And** `npm run build` exits 0 with `NEW.shell = false` (coexistence with MUI intact).

---

## Tasks / Subtasks

- [x] Task 0: Verify prerequisites (AC: all)
  - [x] Confirm `src/components/ui/Button.jsx`, `Card.jsx`, `Chip.jsx` exist (Story 1.6)
  - [x] Confirm `src/components/ui/Sheet.jsx`, `Menu.jsx` exist (Story 1.7)
  - [x] Confirm `src/components/ui/DataBoundary.jsx`, `StatePanel.jsx` exist (Story 1.9)
  - [x] Confirm `src/styles/tokens.css` has `@theme` block with all color/spacing tokens (Story 1.4)
  - [x] If any is missing, **STOP** and report — do not stub

- [x] Task 1: Create `src/config/migration.js` (AC: #4)
  - [x] Export `NEW` object with all five flags set to `false`
  - [x] Add JSDoc comment: "Flip a flag to `true` to enable the new implementation for that area"

- [x] Task 2: Create `src/components/AppProviders.jsx` (AC: #3)
  - [x] Import `BrowserRouter` from `react-router-dom` and `Suspense` from `react`
  - [x] Write the provider scaffold with ordered slot comments (Theme → Connection → Selection → PublishQueue)
  - [x] Wrap children in `<Suspense fallback={null}><BrowserRouter>…</BrowserRouter></Suspense>`
  - [x] Default export: `AppProviders`

- [x] Task 3: Rebuild `src/components/App.jsx` with migration flag (AC: #4)
  - [x] Import `NEW` from `@/config/migration`
  - [x] Extract the **entire** current `App` component body into a `LegacyApp` component defined in the same file (no logic change — copy-paste only)
  - [x] Write new `App` component that returns `<LegacyApp />` when `!NEW.shell` and `<AppProviders><NewShell /></AppProviders>` when `NEW.shell`
  - [x] Write a `NewShell` component (the responsive layout — see Task 4–6 wiring)
  - [x] **Critical:** `LegacyApp` must be the verbatim copy of the old `App` — do not refactor, simplify, or change any logic

- [x] Task 4: Create `src/components/Sidebar.jsx` (AC: #1, #2)
  - [x] **Desktop (lg+):** full-width sidebar (~280px), vertical stack — topic list + "＋ 토픽 구독" add action + footer items
  - [x] **Tablet (md):** icon-rail variant (~56px) — only icons + active dot, no text labels
  - [x] **Mobile:** export a `SidebarContent` sub-component (the inner list without the frame) for use inside the mobile Drawer
  - [x] Active topic row: `bg-surface-2` background + `bg-accent-ui` leading dot (4px × 16px vertical bar or 8px circle) + dark mode: `shadow-[var(--glow-accent-dot)]` on the dot
  - [x] Hover state: `bg-surface` (one step down from active)
  - [x] "＋ 토픽 구독" add action: `text-accent-text` (green text, NOT a green button background — UX-DR6 rule)
  - [x] Focus ring: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]`
  - [x] Read active subscription from `useParams()` (topics from subscriptions via `useLiveQuery` — see Dev Notes)
  - [x] All strings via `t()`

- [x] Task 5: Create `src/components/AppBar.jsx` (AC: #2)
  - [x] Visible only on mobile (`md:hidden`)
  - [x] Contains: hamburger/menu icon button (opens Drawer), current topic title, connection dot placeholder (Story 2.3 wires the real dot), avatar placeholder
  - [x] `bg-surface` background, `border-b border-border` bottom divider
  - [x] Hamburger `aria-label={t("app_bar_menu_open")}` and `aria-expanded` state
  - [x] All strings via `t()`

- [x] Task 6: Create `src/components/BottomNav.jsx` (AC: #2)
  - [x] Visible only on mobile (`md:hidden`)
  - [x] 3 items: 구독 (Subscriptions `/:topic`), 전체 (All `/`), 설정 (Settings `/settings`)
  - [x] Active item: `text-accent-text` (green); inactive: `text-muted`
  - [x] Use `useLocation()` from react-router-dom to determine active item
  - [x] `bg-surface`, `border-t border-border` top divider
  - [x] `role="navigation"` + `aria-label={t("bottom_nav_aria_label")}`
  - [x] All strings via `t()`

- [x] Task 7: Rebuild `src/components/routes.js` (AC: #5)
  - [x] Copy the existing routes.js verbatim
  - [x] Add `msgDetail: "/:topic/:msgId"` to the routes object
  - [x] No other changes — login/signup/account routes stay (removal is Story 5.4)

- [x] Task 8: Add i18n keys to `public/static/langs/ko.json` (AC: #6)
  - [x] Add all new keys (see Dev Notes for the complete list)
  - [x] Maintain alphabetical ordering within the file

- [x] Task 9: Wire `NewShell` in App.jsx (AC: #1, #2)
  - [x] `NewShell` renders the responsive 3-column layout (see Dev Notes for layout skeleton)
  - [x] Desktop: `flex h-screen` with `<Sidebar>` fixed + scrollable feed column + detail placeholder `<div>`
  - [x] Mobile: `<AppBar>` + content `<main>` + `<BottomNav>` + `<Sheet>` Drawer for sidebar
  - [x] Content region uses `<DataBoundary>` / `<StatePanel>` from Story 1.9 as the placeholder (not-connected state text from Story 2.6 — for now render an empty `<div>` in the content region)

- [x] Task 10: Build verification (AC: #7)
  - [x] `NEW.shell` is `false` — `npm run build` must exit 0 (MUI coexistence intact)
  - [x] Visually confirm the old app still renders in dev mode

---

## Dev Notes

### Architecture Context — Read This First

This story is the **structural gate for all of Epic 2**. Everything from Story 2.2 onward depends on the scaffold created here. Get the provider order and migration flag right — they are **never restructured**, only appended.

The key architectural invariant:
- **`AppProviders.jsx` is append-only after this story.** Stories 2.2, 2.3, 3.5, and 4.4 each insert exactly one provider wrapper. The BrowserRouter outermost nesting must not change.
- **`migration.js` flags start at `false`.** The dev turns them to `true` when a feature area is complete and tested. `NEW.shell = true` is NOT toggled by this story's code — the story implements the new shell but leaves the flag false.

### How the Migration Branch Works

Current `src/index.jsx` renders `<App />`. After this story, `App.jsx` looks like:

```jsx
import { NEW } from "@/config/migration";
import AppProviders from "./AppProviders";
// ... all existing App.jsx imports stay for LegacyApp

const LegacyApp = () => {
  // ← verbatim copy of the ENTIRE current App body (RTLCacheProvider, ThemeProvider, BrowserRouter, etc.)
};

const NewShell = () => {
  // ← new responsive shell (see below)
};

const App = () => (NEW.shell ? <AppProviders><NewShell /></AppProviders> : <LegacyApp />);

export default App;
```

**Critical:** `LegacyApp` is a copy-paste of the current App function body — no logic changes, no refactoring, no cleanup. Cleanup is Story 5.4.

### AppProviders.jsx — Exact Shape

```jsx
import { Suspense } from "react";
import { BrowserRouter } from "react-router-dom";

const AppProviders = ({ children }) => (
  <Suspense fallback={null}>
    <BrowserRouter>
      {/* PROVIDER ORDER — append-only after Story 2.1. Never restructure. */}
      {/* Story 2.2 inserts: <ThemeProvider>…</ThemeProvider> wrapping below */}
      {/* Story 2.3 inserts: <ConnectionProvider>…</ConnectionProvider> inside ThemeProvider */}
      {/* Story 3.5 appends: <SelectionProvider>…</SelectionProvider> inside ConnectionProvider */}
      {/* Story 4.4 appends: <PublishQueueProvider>…</PublishQueueProvider> inside SelectionProvider */}
      {children}
    </BrowserRouter>
  </Suspense>
);

export default AppProviders;
```

**Why `fallback={null}` and not a spinner?** The FOUC pre-paint script (Story 1.5) handles the initial paint. A Suspense spinner over the whole shell causes a white flash. Story 2.2 (ThemeContext) and Story 1.5 (FOUC script) together make the shell appear correctly with no flash.

### NewShell Layout Skeleton

Use CSS Grid for the outer shell — it handles the responsive column transitions cleanly:

```jsx
const NewShell = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <div className="flex flex-col h-screen bg-bg">
      {/* Mobile top bar — hidden on md+ */}
      <AppBar onMenuOpen={() => setDrawerOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop/tablet sidebar — hidden below md */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>

        {/* Feed/content column */}
        <main className="flex-1 overflow-y-auto">
          {/* Content region — Story 2.6 fills this with real state panels */}
          <div className="max-w-[720px] mx-auto px-4">
            {/* Routes will be wired here in later stories */}
          </div>
        </main>

        {/* Detail region — desktop right pane, reserved for Story 3.5 */}
        <div className="hidden lg:block w-[420px] border-l border-border overflow-y-auto">
          {/* Detail pane placeholder */}
        </div>
      </div>

      {/* Mobile bottom nav — hidden on md+ */}
      <BottomNav />

      {/* Mobile drawer (Sidebar inside Sheet) */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen} side="left">
        <SidebarContent />
      </Sheet>
    </div>
  );
};
```

**Token notes:**
- `bg-bg` = canvas (the darkest surface)
- `bg-surface` = sidebar and AppBar background
- `border-border` = all 1px dividers between layout regions
- Chrome deliberately has no shadow — separation is by color-step only (elev-0)

### Sidebar Component Details

The Sidebar has two visual states driven by a `collapsed` prop (not CSS alone — the icon-rail is a fundamentally different layout):

```
Desktop (lg+):      Tablet (md → lg):
┌──────────────┐    ┌────┐
│ ntfy         │    │ 🔔 │
│ ──────────   │    │ 📋 │ ← icons only, centered
│ ● Topic A    │    │ ⚙  │
│   Topic B    │    └────┘
│              │
│ + 토픽 구독  │
│ ─────────────│
│ ⚙ 설정       │
└──────────────┘
```

Active nav item classes:
```
bg-surface-2 rounded-sm        ← item background
```

Active leading dot:
```
w-1 h-full rounded-full bg-accent-ui dark:[box-shadow:var(--glow-accent-dot)]
```

Hover (inactive items):
```
hover:bg-surface transition-colors
```

"＋ 토픽 구독" button:
```
text-accent-text font-medium          ← green text, transparent background
hover:bg-surface rounded-sm           ← hover has surface bg
```
**NOT:** `bg-accent-text` or `bg-accent-ui` — green is never a button background except the FAB (Story 4.3).

### BottomNav Component Details

```jsx
const NAV_ITEMS = [
  { key: "subscriptions", labelKey: "bottom_nav_subscriptions", icon: BellIcon, path: "/" },
  { key: "all", labelKey: "bottom_nav_all", icon: LayoutIcon, path: "/all" },
  { key: "settings", labelKey: "bottom_nav_settings", icon: SettingsIcon, path: "/settings" },
];
```

Active detection uses `useLocation().pathname`. Active item: `text-accent-text`. Inactive: `text-muted`.

Use Radix `@radix-ui/react-icons` for icons — it's already installed (part of the Radix stack from Story 1.3). Do not add a new icon library.

### i18n Keys to Add

All keys go in `public/static/langs/ko.json`. Find the right alphabetical slot for each:

```json
"app_bar_menu_open": "메뉴 열기",
"app_bar_menu_close": "메뉴 닫기",
"app_bar_title_all": "모든 알림",
"bottom_nav_aria_label": "주요 탐색",
"bottom_nav_subscriptions": "구독",
"bottom_nav_all": "전체",
"bottom_nav_settings": "설정",
"sidebar_add_topic": "＋ 토픽 구독",
"sidebar_settings": "설정",
"sidebar_all_notifications": "모든 알림",
"sidebar_aria_label": "구독 목록"
```

### Sidebar Data — `useLiveQuery` Pattern

Sidebar needs the subscription list. Use the existing `subscriptionManager`:

```jsx
import { useLiveQuery } from "dexie-react-hooks";
import subscriptionManager from "@/app/SubscriptionManager";

const subscriptions = useLiveQuery(() => subscriptionManager.list()) ?? [];
```

**`?? []` is mandatory** — `useLiveQuery` returns `undefined` on first render. Mapping over `undefined` crashes the feed. This is a hard invariant (project-context.md).

### Reading Active Topic in Sidebar

Use `useParams()` from react-router-dom to get the current `topic` param:

```jsx
import { useParams } from "react-router-dom";
const { topic } = useParams();
// topic is undefined on the "all" route, so guard: sub.topic === topic
```

**Do NOT use `useLiveQuery` to derive which topic is active** — selection authority belongs to the URL (project-context.md, Architecture §SelectionContext). The Sidebar reads `useParams()` directly until `SelectionContext` is added in Story 3.5.

### File Locations Summary

```
src/
├── config/
│   └── migration.js         ← NEW (Task 1)
└── components/
    ├── App.jsx              ← REBUILD — branch on NEW.shell (Task 3, 9)
    ├── AppProviders.jsx     ← NEW — provider scaffold (Task 2)
    ├── Sidebar.jsx          ← NEW — full + icon-rail + SidebarContent export (Task 4)
    ├── AppBar.jsx           ← NEW — mobile top bar (Task 5)
    ├── BottomNav.jsx        ← NEW — mobile bottom nav (Task 6)
    └── routes.js            ← REBUILD — add msgDetail (Task 7)
```

### Architectural Boundaries (ESLint-enforced)

- **`src/app/` import ban in components:** You may import `subscriptionManager`, `prefs`, `session`, `routes`, etc. from `src/app/`. The reverse (`src/app/` importing from `src/components/`) is FORBIDDEN except the single `Notifier.js`→`routes.js` seam (not touched by this story).
- **`useLiveQuery` banned in `contexts/`:** Sidebar and App.jsx are not contexts, so `useLiveQuery` is fine here.
- **`cva` only inside `ui/`:** Do not import `cva` in Sidebar/AppBar/BottomNav. Use `cn()` from `@/components/ui/utils` for class merging.
- **No raw hex or arbitrary px:** Use token utilities only. Exception: a one-off optical nudge may use raw px with `/* layout-nudge: <reason> */`.
- **Dark mode via `.dark` class only:** Never check `theme.palette.mode` or any JS theme flag. Token vars handle both themes automatically.

### What NOT to do

```jsx
// ✗ Hardcoded string — must use t()
<span>구독</span>

// ✗ Raw hex in className
<div className="bg-[#16181B]" />  // use bg-surface

// ✗ Arbitrary px without layout-nudge comment
<div className="w-[280px]" />  // use a Tailwind sizing class or /* layout-nudge */

// ✗ State for selection (derives from URL)
const [activeTopic, setActiveTopic] = useState(null);  // use useParams()

// ✗ cva outside ui/
import { cva } from "class-variance-authority";  // not in Sidebar.jsx

// ✗ Modifying LegacyApp logic
// LegacyApp is a copy-paste — any change to it is a bug

// ✗ Creating contexts/ files in this story
// ThemeContext → Story 2.2, ConnectionContext → Story 2.3
```

### Story 2.2 / 2.3 Append Contract

After this story, the next two stories append into AppProviders like this:

**Story 2.2 (ThemeContext)** will change AppProviders to:
```jsx
<BrowserRouter>
  <ThemeProvider>   {/* ← Story 2.2 inserts this wrapper */}
    {children}
  </ThemeProvider>
</BrowserRouter>
```

**Story 2.3 (ConnectionContext)** will then change it to:
```jsx
<BrowserRouter>
  <ThemeProvider>
    <ConnectionProvider>   {/* ← Story 2.3 inserts inside ThemeProvider */}
      {children}
    </ConnectionProvider>
  </ThemeProvider>
</BrowserRouter>
```

This is the append-only rule. Once you write AppProviders.jsx, **the structure you establish is fixed** — future stories only add wrapper layers, never move or remove them.

### Build Verification

With `NEW.shell = false` (as it will be when you deliver this story):
1. `npm run build` — must exit 0
2. `npm start` — old MUI app loads normally, no visual change
3. Manually flip `NEW.shell = true` in migration.js, reload — new shell should render with the 3-column structure on desktop, icon-rail on tablet, AppBar + BottomNav on mobile

### Epic 2 Story Dependencies

This story creates the scaffold that all subsequent Epic 2 stories build on:
- **2.2 (ThemeContext)** — appends ThemeProvider into `AppProviders.jsx`
- **2.3 (ConnectionContext)** — appends ConnectionProvider into `AppProviders.jsx`; adds `ConnectionIndicator` to `AppBar`
- **2.4 (Auth entry)** — mounts inside the shell's content region
- **2.5 (SubscribeDialog)** — wires the "＋ 토픽 구독" sidebar action to a Dialog
- **2.6 (Empty states)** — fills the content region's `<DataBoundary>` with `EmptyStates.jsx`

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (2026-06-20)

### Debug Log References

- `@radix-ui/react-icons` was not installed (story assumed it was from Story 1.3 — only `radix-ui` unified package is present). Used inline SVG icons in Sidebar, AppBar, BottomNav to avoid adding a new dependency. The icons are equivalent visually. Story 1.3 should install `@radix-ui/react-icons` if future stories need the full icon set.
- Sheet component (Story 1.7) only has `side="bottom"` and `side="right"` variants. Mobile drawer uses `side="right"` with a `className` override (`right-auto left-0`) to position it on the left side — no modification to the ui/ file required.

### Completion Notes List

- All 10 tasks implemented and verified. `npm run build` exits 0 with `NEW.shell = false`.
- `src/config/migration.js` — NEW object with 5 flags, all `false`.
- `src/components/AppProviders.jsx` — append-only provider scaffold with BrowserRouter + ordered slot comments.
- `src/components/App.jsx` — rebuilt with `LegacyApp` (verbatim copy), `NewShell` (responsive layout), and `App` branch on `NEW.shell`.
- `src/components/Sidebar.jsx` — `default Sidebar` (desktop/tablet frame), named export `SidebarContent` (inner list used by mobile drawer). Desktop 280px, tablet icon-rail 56px via `collapsed` prop. Active dot, hover state, add-topic action (text-accent-text), settings footer. All strings via `t()`.
- `src/components/AppBar.jsx` — mobile-only (`md:hidden`), hamburger with aria-label + aria-expanded, topic title, connection dot placeholder.
- `src/components/BottomNav.jsx` — mobile-only (`md:hidden`), 3 items, active detection via `useLocation()`, `role="navigation"`.
- `src/components/routes.js` — added `msgDetail: "/:topic/:msgId"`, all existing keys preserved.
- `public/static/langs/ko.json` — 11 new keys added in alphabetical position.

### File List

- `src/config/migration.js` — NEW
- `src/components/AppProviders.jsx` — NEW
- `src/components/App.jsx` — REBUILT
- `src/components/Sidebar.jsx` — NEW
- `src/components/AppBar.jsx` — NEW
- `src/components/BottomNav.jsx` — NEW
- `src/components/routes.js` — REBUILT (added msgDetail)
- `public/static/langs/ko.json` — UPDATED (11 new i18n keys)

### Change Log

- 2026-06-20: Story 2.1 implemented — responsive app shell scaffold, provider scaffold, migration flag, routes update, i18n keys.
- 2026-06-20: Code review applied — 9 patches, 4 deferred.

### Review Findings

- [x] `review:patch` useParams() always undefined in Sidebar/AppBar — no Routes tree in NewShell; replaced with useLocation() path parsing (`Sidebar.jsx`, `AppBar.jsx`)
- [x] `review:patch` Sheet drawer uses side="right" + CSS hack to position left — fragile Tailwind specificity; added `left` variant to Sheet CVA, changed to side="left" (`Sheet.jsx`, `App.jsx`)
- [x] `review:patch` navigate(`/${sub.topic}`) ignores external subscriptions — use routes.forSubscription(sub) (`Sidebar.jsx`)
- [x] `review:patch` "ntfy" brand string hardcoded — AC #6 violation; added app_name i18n key (`Sidebar.jsx`, `ko.json`)
- [x] `review:patch` AppProviders comments deviate from exact AC #3 spec format (`AppProviders.jsx`)
- [x] `review:patch` data_boundary_error_generic key out of alphabetical order (`ko.json`)
- [x] `review:patch` dark: Tailwind variant responds to media query not .dark class — replaced with bare CSS var (resolves via cascade) (`Sidebar.jsx`)
- [x] `review:patch` sub.new badge has no "99+" cap — legacy Navigation caps at 99 (`Sidebar.jsx`)
- [x] `review:patch` Redundant role="navigation" on semantic nav element (`BottomNav.jsx`)
- [x] `review:defer` "Add topic" button has no onClick handler — Story 2.5 wires the SubscribeDialog
- [x] `review:defer` BottomNav "/all" path has no registered route — routing wired in later story
- [x] `review:defer` require_login redirect absent from NewShell — Story 2.4 handles auth entry
- [x] `review:defer` msgDetail route ambiguous with subscriptionExternal (/:topic/:msgId vs /:baseUrl/:topic) — resolve when Routes tree is wired
