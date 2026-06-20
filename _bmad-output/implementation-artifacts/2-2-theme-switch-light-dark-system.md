---
baseline_commit: 5cef3b5
---

# Story 2.2: Theme switch — light / dark / system

Status: done

## Story

As Jay,
I want to switch between light, dark, and system themes,
so that the app matches my preference and my OS (FR11).

## Acceptance Criteria

1. **Given** the pre-paint script already set the initial class,
   **When** `ThemeContext` mounts,
   **Then** it reads the durable choice from `Prefs.js`/IndexedDB, mirrors to `localStorage` (key `"theme"`), and toggles the `.dark` class on `<html>` — never via a JS `theme.palette.mode` branch.

2. **Given** the choice is `system`,
   **When** the OS theme changes,
   **Then** a `matchMedia` listener updates the `.dark` class live without a page reload.

3. **Given** the `ThemeProvider` component,
   **When** it is implemented,
   **Then** the Provider uses `useReducer` (no `useState` in Provider body) and `useTheme()` throws `Error("useTheme() must be used inside <ThemeProvider>")` when called outside the Provider.

4. **Given** the ThemeContext is wired into `AppProviders.jsx`,
   **When** the app renders,
   **Then** ThemeProvider is the **outermost** wrapper (Theme → Connection → Selection → PublishQueue order codified in code).

5. **Given** a theme toggle control surfaced in the app shell,
   **When** Jay selects light / dark / system,
   **Then** the `.dark` class updates immediately, the choice is persisted to Prefs/IndexedDB and mirrored to localStorage, and the label/icon reflects the active selection.

6. **Given** both light and dark themes,
   **When** rendered,
   **Then** all token-driven surfaces meet WCAG AA (≥4.5:1 body text contrast) in both modes (NFR3).

## Tasks / Subtasks

- [x] Task 1: Create `src/components/contexts/ThemeContext.jsx` (AC: #1, #2, #3)
  - [x] Create the file at `src/components/contexts/ThemeContext.jsx`
  - [x] Define `reducer(state, action)` handling: `"load"`, `"set"`, `"system_change"` action types
  - [x] Initialize state with `{ choice: THEME.SYSTEM, systemPrefersDark: window.matchMedia("(prefers-color-scheme: dark)").matches }`
  - [x] Load durable choice from `prefs.theme()` on mount via `useEffect` + dispatch `"load"`
  - [x] Apply `.dark` class via `document.documentElement.classList.toggle("dark", isDark)` in `useEffect` on state change
  - [x] Mirror choice to `localStorage.setItem("theme", state.choice)` in same effect (wrap in try/catch for private-browsing safety)
  - [x] Wire `matchMedia("(prefers-color-scheme: dark)")` `addEventListener("change", handler)` with cleanup `removeEventListener` in `useEffect(fn, [])`
  - [x] Expose `{ choice, setChoice }` via `ThemeContext.Provider`
  - [x] `setChoice(newChoice)` calls `prefs.setTheme(newChoice)` then dispatches `"set"`
  - [x] Export `useTheme()` that calls `useContext(ThemeContext)` and throws if `null`

- [x] Task 2: Add i18n keys to `public/static/langs/ko.json` (AC: #5)
  - [x] Add `"theme_toggle_label": "테마"` (aria-label for the toggle control)
  - [x] Add `"theme_system": "시스템"` (system option label)
  - [x] Add `"theme_dark": "다크"` (dark option label)
  - [x] Add `"theme_light": "라이트"` (light option label)
  - [x] Verify existing `prefs_appearance_theme_title`, `prefs_appearance_theme_system`, `prefs_appearance_theme_dark`, `prefs_appearance_theme_light` keys are present (add to ko.json if missing — en.json has them at lines ~380–383)

- [x] Task 3: Create theme toggle component for the app shell (AC: #5)
  - [x] Create `src/components/ThemeToggle.jsx` — a 3-option segmented control (시스템 / 라이트 / 다크)
  - [x] Import `useTheme` from `@/components/contexts/ThemeContext`
  - [x] Import `THEME` from `@/app/Prefs`
  - [x] Use `cn()` from `@/components/ui/utils` for conditional classes
  - [x] All strings routed through `t()` — no hardcoded user-facing text
  - [x] No MUI imports — Tailwind + tokens only

- [x] Task 4: Wire ThemeContext into `AppProviders.jsx` (AC: #4)
  - [x] Import `{ ThemeProvider }` from `@/components/contexts/ThemeContext`
  - [x] Wrap all children in `<ThemeProvider>` as the outermost provider
  - [x] Confirm provider order in code: Theme → (Connection stub or placeholder) — do NOT reorder

- [x] Task 5: Surface ThemeToggle in the app shell (AC: #5)
  - [x] Import `ThemeToggle` into the shell component from 2.1 (likely `Sidebar.jsx` footer or `AppBar.jsx`)
  - [x] Render `<ThemeToggle />` in the appropriate slot with correct aria-label

- [x] Task 6: Verify build and behavior (AC: all)
  - [x] Run `npm run build` — must exit 0, no TS/lint errors
  - [x] Verify `.dark` class toggles correctly for all three values (system/light/dark)
  - [x] Verify OS preference change (matchMedia) updates class live when choice is `system`
  - [x] Verify `useTheme()` outside provider throws (can test in browser console)

## Dev Notes

### ⛔ PREREQUISITE: Story 2.1 Must Be Done First

Story 2.2 depends on `AppProviders.jsx` and the app shell (Sidebar/AppBar) created in 2.1. Do NOT begin implementation until:
- `src/components/AppProviders.jsx` exists (2.1 creates it)
- `src/config/migration.js` exists with `NEW.shell` flag (2.1 creates it)
- The shell components (`Sidebar.jsx`, `AppBar.jsx`) exist for Task 5

If AppProviders.jsx doesn't exist, create a minimal version as part of this story but expect it to be reconciled with 2.1's full version.

### Critical: What 1.5 Already Did (DO NOT Redo)

Story 1.5 (status: review) already completed:
- **FOUC pre-paint script** is in `index.html` `<head>` as the first element — it reads `localStorage.getItem("theme")`, defaults to `"system"`, and evaluates `system` via `matchMedia`. **DO NOT touch `index.html`.**
- **`src/styles/tokens.css`** has the `.dark { ... }` overrides for all color tokens — **DO NOT modify.**
- Both font files exist in `public/static/fonts/`

ThemeContext's job is to **keep the class in sync** after the pre-paint moment — the class is already correctly set before first paint.

### ThemeContext.jsx — Exact Implementation Pattern

```jsx
import { createContext, useContext, useEffect, useReducer } from "react";
import prefs, { THEME } from "../../app/Prefs";

const ThemeContext = createContext(null);
const DARK_CLASS = "dark";

function isDark(choice, systemPrefersDark) {
  return choice === THEME.DARK || (choice === THEME.SYSTEM && systemPrefersDark);
}

function reducer(state, action) {
  switch (action.type) {
    case "load":
    case "set":
      return { ...state, choice: action.choice };
    case "system_change":
      return { ...state, systemPrefersDark: action.prefersDark };
    default:
      return state;
  }
}

export function ThemeProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, {
    choice: THEME.SYSTEM,
    systemPrefersDark: window.matchMedia("(prefers-color-scheme: dark)").matches,
  });

  // Load durable choice from IndexedDB on mount
  useEffect(() => {
    prefs.theme().then((choice) =>
      dispatch({ type: "load", choice: choice ?? THEME.SYSTEM })
    );
  }, []);

  // Apply .dark class + mirror to localStorage on every relevant state change
  useEffect(() => {
    document.documentElement.classList.toggle(DARK_CLASS, isDark(state.choice, state.systemPrefersDark));
    try { localStorage.setItem("theme", state.choice); } catch (_) {}
  }, [state.choice, state.systemPrefersDark]);

  // OS preference listener — wired once, cleaned up on unmount
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => dispatch({ type: "system_change", prefersDark: e.matches });
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const setChoice = async (newChoice) => {
    await prefs.setTheme(newChoice);
    dispatch({ type: "set", choice: newChoice });
  };

  return (
    <ThemeContext.Provider value={{ choice: state.choice, setChoice }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme() must be used inside <ThemeProvider>");
  return ctx;
}
```

### Critical Anti-Patterns to AVOID

```js
// WRONG — useState in Provider (G-enforced: use useReducer)
const [choice, setChoiceState] = useState(THEME.SYSTEM);

// WRONG — MUI-ism (never use theme.palette.mode)
const isDark = theme.palette.mode === "dark";

// WRONG — importing useLiveQuery in contexts/ (ESLint-enforced)
import { useLiveQuery } from "dexie-react-hooks";  // FORBIDDEN in contexts/

// WRONG — wrong localStorage key
localStorage.setItem("ntfy-theme", choice);  // key must be "theme"

// WRONG — missing try/catch (crashes in private browsing)
localStorage.setItem("theme", choice);  // must wrap in try/catch

// WRONG — useTheme() silently returning null instead of throwing
export function useTheme() { return useContext(ThemeContext); }  // must throw

// WRONG — not cleaning up matchMedia listener
mq.addEventListener("change", handler);  // must return () => mq.removeEventListener("change", handler)

// WRONG — applying theme via JS prop instead of .dark class
document.documentElement.setAttribute("data-theme", "dark");  // must use classList.toggle("dark", ...)
```

### ThemeToggle Component Pattern

```jsx
// src/components/ThemeToggle.jsx
import { useTranslation } from "react-i18next";
import { cn } from "@/components/ui/utils";
import { useTheme } from "@/components/contexts/ThemeContext";
import { THEME } from "@/app/Prefs";

const OPTIONS = [
  { value: THEME.SYSTEM, key: "theme_system" },
  { value: THEME.LIGHT,  key: "theme_light" },
  { value: THEME.DARK,   key: "theme_dark" },
];

export function ThemeToggle() {
  const { t } = useTranslation();
  const { choice, setChoice } = useTheme();

  return (
    <div role="group" aria-label={t("theme_toggle_label")} className="flex rounded-full border border-border">
      {OPTIONS.map(({ value, key }) => (
        <button
          key={value}
          type="button"
          onClick={() => setChoice(value)}
          aria-pressed={choice === value}
          className={cn(
            "px-3 py-1 text-caption rounded-full transition-colors",
            choice === value
              ? "bg-surface-active text-text"
              : "text-muted hover:text-text"
          )}
        >
          {t(key)}
        </button>
      ))}
    </div>
  );
}
```

### AppProviders.jsx Wiring

```jsx
// src/components/AppProviders.jsx (from 2.1 — update to add ThemeProvider)
import { ThemeProvider } from "@/components/contexts/ThemeContext";
// ... other imports from 2.1

export function AppProviders({ children }) {
  return (
    <ThemeProvider>  {/* OUTERMOST — matches pre-paint class already set */}
      {/* Connection, Selection, PublishQueue added by E2.3, E3, E4 */}
      {children}
    </ThemeProvider>
  );
}
```

### Architecture Layer Invariants

| Rule | Detail |
|---|---|
| `contexts/` CANNOT import `useLiveQuery` | ESLint `no-restricted-imports` — Dexie is the data layer; Prefs.js calls are async/one-shot, not live queries |
| `contexts/` CANNOT import `message/` | ESLint boundary — contexts are domain-ignorant |
| No `useState` in Provider | Use `useReducer` — G-enforced by story AC |
| `.dark` class only | Never `theme.palette.mode`, never `data-theme` attribute |
| localStorage key = `"theme"` | Matches the FOUC pre-paint script exactly (Story 1.5) |
| Try/catch localStorage writes | Required for private-browsing / strict CSP contexts |

### Existing Files: What Exists, What Changes

| File | Status | Notes |
|---|---|---|
| `src/app/Prefs.js` | **DO NOT TOUCH** | Already has `theme()`, `setTheme()`, and `THEME` enum — import as-is |
| `src/styles/tokens.css` | **DO NOT TOUCH** | `.dark {}` overrides already defined; `@theme` block has all light tokens |
| `index.html` | **DO NOT TOUCH** | FOUC script already in `<head>` from Story 1.5 |
| `src/components/contexts/ThemeContext.jsx` | **CREATE** | Main deliverable of this story |
| `src/components/ThemeToggle.jsx` | **CREATE** | Shell-surfaced theme control |
| `src/components/AppProviders.jsx` | **UPDATE** | Add `ThemeProvider` as outermost wrapper (from 2.1) |
| `src/components/Sidebar.jsx` or `AppBar.jsx` | **UPDATE** | Render `<ThemeToggle />` in appropriate slot (shell from 2.1) |
| `public/static/langs/ko.json` | **UPDATE** | Add missing theme i18n keys |
| `src/components/theme.js` | **DO NOT TOUCH** | Old MUI theme — removed by migration cleanup in E5 |
| `src/components/App.jsx` | **DO NOT TOUCH** | Old MUI ThemeProvider stays behind migration flag |

### Migration Flag Pattern

`src/config/migration.js` is created in Story 2.1:
```js
export const NEW = { shell: false, feed: false, detail: false, dialogs: false, settings: false };
```

When `NEW.shell` is `true`, `App.jsx` should route through `AppProviders.jsx` (which includes `ThemeContext`). The old MUI ThemeProvider path in `App.jsx` stays in place until cleanup (E5).

**Do NOT delete `src/components/theme.js`** in this story — it's removed in Epic 5 cleanup (5-4).

### i18n Keys Reference

Keys to add to `ko.json` (check en.json at lines ~380–383 for existing theme keys):

```json
"prefs_appearance_theme_title": "테마",
"prefs_appearance_theme_system": "시스템 (기본값)",
"prefs_appearance_theme_dark": "다크 모드",
"prefs_appearance_theme_light": "라이트 모드",
"theme_toggle_label": "테마",
"theme_system": "시스템",
"theme_dark": "다크",
"theme_light": "라이트"
```

Note: `prefs_appearance_theme_*` keys may already be in ko.json — verify before adding (grep the file first).

### Prefs.js API (DO NOT recreate)

```js
// src/app/Prefs.js — already exists, use as-is
import prefs, { THEME } from "../../app/Prefs";  // from ThemeContext.jsx

// THEME.SYSTEM = "system", THEME.DARK = "dark", THEME.LIGHT = "light"
await prefs.theme()       // returns current stored choice (defaults to THEME.SYSTEM)
await prefs.setTheme(mode) // persists to IndexedDB
```

### Project Structure Notes

- `src/components/contexts/ThemeContext.jsx` — new, alongside ConnectionContext.jsx (from 2.3)
- `src/components/ThemeToggle.jsx` — flat component, NOT in `ui/` (it uses domain hook `useTheme`)
- `cn()` import: `import { cn } from "@/components/ui/utils"` (Story 1.3 wired the `@/*` alias)
- `cva` usage: import from `@/components/ui/utils` if needed for variants

### References

- Story AC source: `_bmad-output/planning-artifacts/epics.md` §Story 2.2
- FOUC script + localStorage key: `_bmad-output/implementation-artifacts/1-5-self-hosted-fonts-sw-fix-and-fouc-free-theme-bootstrap.md` §Task 3 Dev Notes
- Theme / FOUC architecture decision: `_bmad-output/planning-artifacts/architecture.md` §Theme/FOUC (corrected) (lines ~319–325)
- Provider order: `_bmad-output/planning-artifacts/architecture.md` §Provider order (lines ~648–650)
- Directory structure: `_bmad-output/planning-artifacts/architecture.md` §Directory Structure (lines ~609–612)
- Prefs.js API: `src/app/Prefs.js` (lines 50–57 — `theme()` and `setTheme()`)
- Session.js mirror pattern: `src/app/Session.js` (localStorage mirror → same pattern for theme)
- Token vars: `src/styles/tokens.css` (`.dark {}` block, lines ~127–165)
- Design token contract: `design-tokens.md` at project root
- i18n theme keys (English): `public/static/langs/en.json` lines ~380–383
- UX theme control: `_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/DESIGN.md` §Settings (segmented control: light/dark/system)
- Trap map (FOUC system bug): `_bmad-output/project-context.md` §Don't-Step-On Trap Map

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None.

### Completion Notes List

- Implemented ThemeContext.jsx with useReducer (not useState) handling load/set/system_change actions per AC #3
- .dark class toggling via classList.toggle("dark", ...) tied to both choice and systemPrefersDark state — satisfies AC #1 and #2
- matchMedia listener wired in a separate useEffect(fn, []) with cleanup via removeEventListener — satisfies AC #2
- localStorage mirror wrapped in try/catch for private-browsing safety — satisfies AC #1
- useTheme() throws `Error("useTheme() must be used inside <ThemeProvider>")` when ctx is null — satisfies AC #3
- ThemeProvider set as outermost wrapper in AppProviders.jsx (ConnectionProvider from Story 2.3 sits inside it) — satisfies AC #4
- ThemeToggle renders 3 buttons (system/light/dark) using t() for all labels, aria-pressed, cn() for classes, no MUI — satisfies AC #5
- All 8 theme i18n keys added to ko.json (4 prefs\_appearance\_theme\_ + 4 theme\_ prefixed) — satisfies AC #5
- 168/168 tests pass; build exits 0

### File List

- src/components/contexts/ThemeContext.jsx (created)
- src/components/contexts/ThemeContext.test.jsx (created)
- src/components/ThemeToggle.jsx (created)
- src/components/ThemeToggle.test.jsx (created)
- src/components/AppProviders.jsx (updated — ThemeProvider as outermost wrapper)
- src/components/Sidebar.jsx (updated — ThemeToggle rendered in footer above settings)
- public/static/langs/ko.json (updated — 8 theme i18n keys added)

## Change Log

- 2026-06-20: Story implemented — ThemeContext with useReducer, matchMedia live listener, localStorage mirror, ThemeToggle segmented control, wired into AppProviders and Sidebar. 16 new tests added. All 168 tests pass, build exits 0.
