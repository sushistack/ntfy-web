---
baseline_commit: 992146f999de2b5bc427245017d9f0ef0e171ce1
---

# Story 5.4: Migration Cleanup — Remove MUI/Emotion/RTL + Trimmed Screens

Status: done

## Story

As the rebuild team,
I want the legacy stack and trimmed screens removed once every route is migrated,
so that the bundle is lean and the codebase is single-stack (FR19 removal, NFR14, NFR7).

## Acceptance Criteria

1. **G5 Entry Gate (HARD STOP)**: Every flag in `src/config/migration.js` `NEW` is `=== true`; confirmed by a new Vitest gate test (`src/config/migration.test.js`) that fails CI if any flag is false.

2. **Deleted — trimmed account/billing/reserve screens**: `Account.jsx`, `Signup.jsx`, `UpgradeDialog.jsx`, `ReserveDialogs.jsx`, `ReserveIcons.jsx`, `ReserveTopicSelect.jsx`, `AccountApi.js` are gone from the repo.

3. **Deleted — legacy MUI shell and infra**: `Navigation.jsx`, `Notifications.jsx`, `ActionBar.jsx`, `SubscriptionPopup.jsx`, `theme.js`, `styles.js`, `RTLCacheProvider.jsx`, `AttachmentIcon.jsx`, `AvatarBox.jsx`, `DialogFooter.jsx` are gone from the repo.

4. **`App.jsx` simplified**: `LegacyApp`, `Layout`, `Main`, `Loader` functions and `AccountContext` export are removed; `App` renders `<AppProviders><NewShell /></AppProviders>` directly; all MUI, RTL, and theme imports removed.

5. **`hooks.js` cleaned**: `useAccountListener` and its `import accountApi` are removed; `useAccountListener` is no longer exported.

6. **`ErrorBoundary.jsx` migrated**: MUI `Link`/`Button` replaced with native `<a>`/`<button>` elements styled with Tailwind token classes; no MUI import remains.

7. **npm packages removed**: `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`, `@emotion/cache`, `stylis`, `stylis-plugin-rtl` are absent from `package.json` and `node_modules`.

8. **ESLint full rule set enabled** (CI-failing):
   - `eslint-plugin-i18next` `no-literal-string` flags all hardcoded user-visible strings incl. `aria-label`/`title`
   - `eslint-plugin-tailwindcss` `no-arbitrary-value` allows `/* layout-nudge: <why> */` escape
   - `import/no-restricted-paths` zones block `src/app/→src/components/` and `src/components/ui/→src/components/message/`; sole allowed crossing: `Notifier.js → routes.js`
   - `no-restricted-syntax` override in `contexts/` bans `useLiveQuery` calls

9. **Token parity**: `tokens.css` `@theme` var names compared against Android `design-tokens.md`; a ~20-line diff-linter script added only if drift is detected.

10. **Build passes**: `npm run build` produces standalone static assets in `build/`; no MUI/Emotion chunks in bundle; `npm run dev` starts clean with zero console errors across all routes.

## Tasks / Subtasks

- [x] Task 1: G5 Gate — assert all migration flags are true (AC: #1)
  - [x] 1.1 Open `src/config/migration.js` and verify all 6 flags (`shell`, `feed`, `detail`, `dialogs`, `settings`, `auth`) are `true` — if any is `false`, STOP and flip it in the responsible story (see table in Dev Notes)
  - [x] 1.2 Create `src/config/migration.test.js` with Vitest assertions for all 6 flags (see snippet in Dev Notes)

- [x] Task 2: Delete trimmed account/billing/reserve screens (AC: #2)
  - [x] 2.1 Delete `src/app/AccountApi.js`
  - [x] 2.2 Delete `src/components/Account.jsx`
  - [x] 2.3 Delete `src/components/Signup.jsx`
  - [x] 2.4 Delete `src/components/UpgradeDialog.jsx`
  - [x] 2.5 Delete `src/components/ReserveDialogs.jsx`
  - [x] 2.6 Delete `src/components/ReserveIcons.jsx`
  - [x] 2.7 Delete `src/components/ReserveTopicSelect.jsx`

- [x] Task 3: Delete legacy MUI shell and infrastructure (AC: #3)
  - [x] 3.1 Delete `src/components/theme.js` (MUI ThemeOptions — `darkTheme`, `lightTheme`)
  - [x] 3.2 Delete `src/components/styles.js` (MUI `styled` exports — `Paragraph`, `VerticallyCenteredContainer`, `LightboxBackdrop`)
  - [x] 3.3 Delete `src/components/RTLCacheProvider.jsx` (Emotion CacheProvider + stylis-plugin-rtl)
  - [x] 3.4 Delete `src/components/AttachmentIcon.jsx` (only imported by `Notifications.jsx`, superseded by `message/AttachmentBox.jsx`)
  - [x] 3.5 Delete `src/components/AvatarBox.jsx` (only imported by deleted `Signup.jsx`)
  - [x] 3.6 Delete `src/components/DialogFooter.jsx` (only imported by deleted `ReserveDialogs.jsx` and `SubscriptionPopup.jsx`)
  - [x] 3.7 Delete `src/components/Navigation.jsx` (replaced by `Sidebar.jsx`)
  - [x] 3.8 Delete `src/components/Notifications.jsx` (replaced by `Feed.jsx` + `DetailPane.jsx`)
  - [x] 3.9 Delete `src/components/ActionBar.jsx` (replaced by `AppBar.jsx`; only used by deleted `LegacyApp` `Layout`)
  - [x] 3.10 Delete `src/components/SubscriptionPopup.jsx` (replaced by `Sidebar.jsx`'s inline `ui/Menu`; no new component imports it)
  - [x] 3.11 Check `src/components/Pref.jsx` — if it still has MUI `styled` imports, delete it (Story 5.1 should have rebuilt `Preferences.jsx` without it); if 5.1 already replaced it with a Tailwind version, leave it

- [x] Task 4: Simplify App.jsx (AC: #4)
  - [x] 4.1 Delete the `LegacyApp` arrow function (lines ~45–92 in current file)
  - [x] 4.2 Delete the `Layout`, `Main`, `Loader` helper components (lines ~220–295)
  - [x] 4.3 Delete `export const AccountContext = createContext(null)` (line 42)
  - [x] 4.4 Remove now-dead imports from the top of the file:
    - `{ Box, Toolbar, CssBaseline, Backdrop, CircularProgress, useMediaQuery, ThemeProvider, createTheme }` from `@mui/material`
    - `RTLCacheProvider` from `./RTLCacheProvider`
    - `{ darkTheme, lightTheme }` from `./theme`
    - `Navigation` from `./Navigation`
    - `ActionBar` from `./ActionBar`
    - `{ AllSubscriptions, SingleSubscription }` from `./Notifications`
    - `{ useAccountListener }` from `./hooks` (keep the other hooks)
    - `userManager` from `../app/UserManager` (if only used in removed Layout)
  - [x] 4.5 Remove `import { NEW } from "@/config/migration"` and the `NEW.feed`/`NEW.shell` conditionals in `NewShell`; hardcode the new-path routes directly
  - [x] 4.6 Replace `App`: `const App = () => <AppProviders><NewShell /></AppProviders>;`
  - [x] 4.7 Run `npm run dev` — zero import errors; app loads

- [x] Task 5: Clean hooks.js (AC: #5)
  - [x] 5.1 Remove `import accountApi from "../app/AccountApi"` (line 12)
  - [x] 5.2 Delete the `useAccountListener` function (~line 369 to end)
  - [x] 5.3 Remove `useAccountListener` from any named export list at the bottom (if present)

- [x] Task 6: Migrate ErrorBoundary.jsx to native HTML (AC: #6)
  - [x] 6.1 Remove `import { Link, Button } from "@mui/material"`
  - [x] 6.2 Replace every `<Link href="...">` with `<a href="..." target="_blank" rel="noopener noreferrer">`
  - [x] 6.3 Replace every `<Button variant="outlined" onClick={fn}>label</Button>` with `<button type="button" className="border border-border rounded px-3 py-1.5 text-sm text-text hover:bg-surface-2" onClick={fn}>label</button>`
  - [x] 6.4 Verify class component `ErrorBoundaryImpl` + `withTranslation()` wrapper is preserved unchanged

- [x] Task 7: Remove MUI/Emotion/stylis npm packages (AC: #7)
  - [x] 7.1 Run `npm rm @mui/material @mui/icons-material @emotion/react @emotion/styled @emotion/cache stylis stylis-plugin-rtl`
  - [x] 7.2 Confirm none appear in `package.json` dependencies or devDependencies

- [x] Task 8: Install ESLint plugins and enable full rule set (AC: #8)
  - [x] 8.1 Run `npm i -D eslint-plugin-i18next eslint-plugin-tailwindcss`
  - [x] 8.2 Add `"i18next"` and `"tailwindcss"` to the `plugins` array in `.eslintrc`
  - [x] 8.3 Add `"i18next/no-literal-string"` rule (see exact config in Dev Notes)
  - [x] 8.4 Add `"tailwindcss/no-arbitrary-value": "error"` rule
  - [x] 8.5 Add `"import/no-restricted-paths"` rule with app↔components and ui↔message zones (see Dev Notes)
  - [x] 8.6 Add `no-restricted-syntax` override for `contexts/*Context.jsx` to ban `useLiveQuery` calls
  - [x] 8.7 Run `npx eslint src/` and fix any new violations surfaced by the rules

- [x] Task 9: Delete migration.js (AC: #1)
  - [x] 9.1 Confirm no file imports `@/config/migration` or `../config/migration` anymore
  - [x] 9.2 Delete `src/config/migration.js` — all conditionals are removed and the gate test covers it
  - [x] 9.3 Update `src/config/migration.test.js` if needed (since migration.js is deleted, the test may need to be rephrased or removed — if deleted, add a comment-only placeholder noting G5 passed)

- [x] Task 10: Build, smoke-test, and ESLint verify (AC: #10)
  - [x] 10.1 Run `npm run build` — must succeed with zero errors and no MUI chunk in output
  - [x] 10.2 Run `npm start` and verify all routes: `/` (feed), `/:topic` (topic feed), `/:topic/:msgId` (detail pane mobile), `/settings`, `/login` (if `config.require_login`)
  - [x] 10.3 Run `npx eslint src/` — zero errors; any `no-literal-string` violations from pre-existing code must be fixed before merge

- [x] Task 11: Token parity check (AC: #9)
  - [x] 11.1 Run the diff commands from Dev Notes to compare `tokens.css` vs `design-tokens.md`
  - [x] 11.2 If no drift: document "no drift observed" in Dev Agent Record completion notes
  - [x] 11.3 If drift found: create `scripts/check-token-drift.sh` (~20 lines) and wire it into `package.json` scripts

### Review Findings

- [x] [Review][Patch] Restore the conditional `/login` route and unauthenticated redirect guard [src/components/App.jsx:92]
- [x] [Review][Patch] Configure `i18next/no-literal-string` with supported options so JSX text and user-facing attributes are enforced [`.eslintrc`:54]
- [x] [Review][Patch] Make `tailwindcss/no-arbitrary-value` inspect `cn()`/`cva()` usage and remove remaining arbitrary utility values [`.eslintrc`:58]
- [x] [Review][Patch] Replace utility classes that reference nonexistent design tokens [src/components/Login.jsx:49]
- [x] [Review][Patch] Migrate remaining ErrorBoundary inline pixel styles and generic radius classes to project tokens [src/components/ErrorBoundary.jsx:61]
- [x] [Review][Patch] Declare the Node runtime required by the installed Tailwind ESLint plugin [package.json]
- [x] [Review][Patch] Keep repeated key-value rows uniquely keyed during React reconciliation [src/components/message/CardBody.jsx:99]
- [x] [Review][Patch] Preserve valid native button types such as `reset` [src/components/ui/Button.jsx:30]
- [x] [Review][Patch] Preserve an accessible localized fallback title for title-less dialogs [src/components/ui/Dialog.jsx:22]
- [x] [Review][Patch] Keep the document language synchronized without reintroducing RTL behavior [src/components/App.jsx:24]
- [x] [Review][Patch] Preserve unread-count document title, app badge, and favicon updates in the new shell [src/components/App.jsx:24]
- [x] [Review][Defer] Disambiguate external-subscription and message-detail two-segment routes [src/components/routes.js:9] — deferred, pre-existing

## Dev Notes

### HARD STOP: G5 Gate Check

Before any deletions, open `src/config/migration.js` and verify the current state:

```js
// Current state (all false — must be all true before 5.4 begins):
export const NEW = {
  shell: false,   // flip in story 2.1 once app shell confirmed stable on main
  feed: false,    // flip in story 3.3 once Feed.jsx confirmed stable on main
  detail: false,  // flip in story 3.5 once DetailPane.jsx confirmed stable on main
  dialogs: false, // flip in story 4.3 once publish dialog confirmed stable on main
  settings: false,// flip in story 5.1 once Preferences.jsx rebuild confirmed stable on main
  auth: false,    // flip in story 2.4 once ServerAuthForm confirmed stable on main
};
```

If any flag is `false`, STOP. Go to the responsible story and flip the flag there, build, confirm no regressions, then return.

**Flag → Responsible Story mapping:**
| Flag | Story | New Component |
|------|-------|---------------|
| `shell` | 2.1 | `AppProviders.jsx`, `AppBar.jsx`, `BottomNav.jsx` |
| `feed` | 3.3 | `Feed.jsx` |
| `detail` | 3.5 | `DetailPane.jsx` |
| `dialogs` | 4.3 | `Messaging.jsx` (publish dialog) |
| `settings` | 5.1 | `Preferences.jsx` (rebuilt) |
| `auth` | 2.4 | `ServerAuthForm.jsx` |

**Gate test to create (`src/config/migration.test.js`):**

```js
import { describe, it, expect } from "vitest";
import { NEW } from "./migration";

describe("G5 migration gate", () => {
  it("all migration flags must be true before cleanup runs", () => {
    for (const [key, value] of Object.entries(NEW)) {
      expect(value, `NEW.${key} must be true — flip it in the responsible story first`).toBe(true);
    }
  });
});
```

### Deletion Order (dependency-safe)

Delete in this order to avoid cascading import errors between deleted files:

**Round 1 — leaf nodes (no dependents in remaining code):**
- `src/app/AccountApi.js`
- `src/components/theme.js`
- `src/components/styles.js`
- `src/components/RTLCacheProvider.jsx`
- `src/components/ReserveIcons.jsx`
- `src/components/ReserveTopicSelect.jsx`
- `src/components/AvatarBox.jsx`
- `src/components/AttachmentIcon.jsx`

**Round 2 — mid-layer (import from Round 1):**
- `src/components/Account.jsx` (imports Pref, DialogFooter, ReserveDialogs, AccountApi, SubscriptionPopup)
- `src/components/Signup.jsx` (imports AvatarBox)
- `src/components/UpgradeDialog.jsx`
- `src/components/ReserveDialogs.jsx` (imports ReserveIcons, ReserveTopicSelect, DialogFooter)
- `src/components/DialogFooter.jsx` (imported by ReserveDialogs and SubscriptionPopup)

**Round 3 — shell-level legacy (import from Round 1+2):**
- `src/components/Navigation.jsx` (imports SubscriptionPopup)
- `src/components/Notifications.jsx` (imports AttachmentIcon, styles)
- `src/components/ActionBar.jsx` (imports SubscriptionPopup, AccountApi)
- `src/components/SubscriptionPopup.jsx` (imports AccountApi, ReserveDialogs, DialogFooter)

**Round 4 — infrastructure cleanup:**
- `src/components/Pref.jsx` (if MUI-only; should be deleted/replaced by Story 5.1)
- `src/config/migration.js` (last, after all conditional branches removed from App.jsx)

### App.jsx: Final Shape After Cleanup

The file shrinks from ~295 lines to ~90 lines. Keep only:

```jsx
import * as React from "react";
import { useState } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { useTranslation } from "react-i18next";        // keep for i18n init
import { useBackgroundProcesses, useConnectionListeners, useWebPushTopics } from "./hooks";
import subscriptionManager from "../app/SubscriptionManager";
import ErrorBoundary from "./ErrorBoundary";
import routes from "./routes";
import initI18n from "../app/i18n";
import AppProviders from "./AppProviders";
import Feed from "@/components/Feed";
import Sidebar, { SidebarContent } from "./Sidebar";
import AppBarNew from "./AppBar";
import BottomNav from "./BottomNav";
import { Sheet, SheetContent } from "@/components/ui/Sheet";
import { useConnection } from "@/components/contexts/ConnectionContext";
import { useSelection } from "@/components/contexts/SelectionContext";
import { NotConnectedPanel, ConnectingPanel, NoSubscriptionsPanel } from "@/components/message/EmptyStates";
import DetailPane from "./DetailPane";
import SubscribeDialog from "./SubscribeDialog";
import Messaging from "./Messaging";
import ServerAuthForm from "./ServerAuthForm";
import db from "@/app/db";

initI18n();

// ContentRegion, MsgDetailRoute, DetailRegion, NewShell stay exactly as-is
// (NewShell no longer needs the NEW.feed conditional — hardcode the new routes)

const App = () => (
  <AppProviders>
    <NewShell />
  </AppProviders>
);

export default App;
```

**In `NewShell`**, the `{NEW.feed ? (...) : (...)}` conditional block becomes the new-path routes only:

```jsx
// BEFORE (with flag):
{NEW.feed ? (
  <>
    <Route path={routes.app} element={<Feed />} />
    <Route path={routes.msgDetail} element={<MsgDetailRoute />} />
    <Route path={routes.subscription} element={<Feed />} />
    <Route path={routes.subscriptionExternal} element={<Feed />} />
  </>
) : (
  <>... legacy routes ...</>
)}

// AFTER (unconditional):
<Route path={routes.app} element={<Feed />} />
<Route path={routes.msgDetail} element={<MsgDetailRoute />} />
<Route path={routes.subscription} element={<Feed />} />
<Route path={routes.subscriptionExternal} element={<Feed />} />
```

Also remove `<Route path={routes.settings} element={<ServerAuthForm />} />` and replace with the rebuilt `Preferences.jsx` route (Story 5.1 handles this; verify the import).

### hooks.js: Exact Lines to Remove

- **Line 12**: `import accountApi from "../app/AccountApi";`
- **Line ~369 onward**: The entire `useAccountListener` function

```js
// Delete this entire block from hooks.js:
export const useAccountListener = (setAccount) => {
  useEffect(() => {
    // ... subscribes to account updates via accountApi
  }, []);
};
```

Verify the export list at the bottom of hooks.js (if any grouped `export` block) and remove `useAccountListener`.

### ErrorBoundary.jsx: Native HTML Replacement

`ErrorBoundary.jsx` is a class component wrapped with `withTranslation()`. Preserve that structure exactly. Only change the two MUI primitives:

```jsx
// REMOVE this import:
import { Link, Button } from "@mui/material";

// REPLACE each <Link href="url">text</Link> with:
<a href="url" target="_blank" rel="noopener noreferrer">text</a>

// REPLACE each <Button variant="outlined" onClick={fn}>{label}</Button> with:
<button
  type="button"
  className="border border-border rounded px-3 py-1.5 text-sm text-text hover:bg-surface-2"
  onClick={fn}
>
  {label}
</button>
```

There are 2 `Button` instances (copy stack trace, reload ntfy) and 6 `Link` instances (github, discord, matrix × 2 error types). The `<a>` tags already have `href` on them — just swap the component. Use Tailwind token classes only; no raw hex or px (invariant from project-context.md).

### .eslintrc: Full Rule Set Config

Add to the existing `.eslintrc` (which extends `airbnb` + `prettier`):

```json
{
  "plugins": ["i18next", "tailwindcss"],
  "rules": {
    "i18next/no-literal-string": ["error", {
      "markupOnly": false,
      "ignoreAttribute": []
    }],
    "tailwindcss/no-arbitrary-value": "error",
    "import/no-restricted-paths": ["error", {
      "zones": [
        {
          "target": "./src/components",
          "from": "./src/app",
          "except": ["./Notifier.js"],
          "message": "src/app/ must not be imported into src/components/ (except Notifier.js → routes.js)"
        },
        {
          "target": "./src/components/ui",
          "from": "./src/components/message",
          "message": "ui/ is domain-ignorant — it must not import from message/ domain"
        }
      ]
    }]
  },
  "overrides": [
    { "files": ["./public/sw.js"], "rules": { "no-restricted-globals": "off" } },
    {
      "files": ["./src/components/contexts/*Context.jsx"],
      "rules": {
        "no-restricted-syntax": [
          "error",
          "ForInStatement",
          "LabeledStatement",
          "WithStatement",
          {
            "selector": "CallExpression[callee.name='useLiveQuery']",
            "message": "contexts/ must not call useLiveQuery — data stays in Dexie, read in components"
          }
        ]
      }
    }
  ]
}
```

**Note on `tailwindcss/no-arbitrary-value`**: The `/* layout-nudge: <why> */` comment escape is a project convention — verify that `eslint-plugin-tailwindcss` respects inline disable comments (`// eslint-disable-next-line tailwindcss/no-arbitrary-value`) for the escape, and document the pattern in the PR.

**Important**: After enabling `i18next/no-literal-string`, run `npx eslint src/` immediately. Pre-existing violations in legacy files being deleted won't matter (those files are gone), but any violations in files being kept must be fixed before the story is done.

### Token Parity Check

Run this to detect web↔Android token drift:

```sh
# Web tokens from @theme block
grep -oP '(?<=--)[a-z][a-zA-Z0-9-]+(?=\s*:)' src/styles/tokens.css | sort -u > /tmp/web-tokens.txt

# Android tokens from design manifest (adjust path if needed)
grep -oP '(?<=--)[a-z][a-zA-Z0-9-]+(?=\s*:)' _bmad-output/planning-artifacts/design-tokens.md | sort -u > /tmp/android-tokens.txt

diff /tmp/web-tokens.txt /tmp/android-tokens.txt
```

If the diff is clean: document "token parity confirmed, no drift" in Dev Agent Record and close AC #9.
If drift exists: create `scripts/check-token-drift.sh` with the above diff logic and add `"token-parity": "bash scripts/check-token-drift.sh"` to `package.json` scripts.

### Build Verification Checklist

After Task 7 (npm rm), run:

```sh
npm run build
```

Expected: `build/` directory produced, no `@mui` or `@emotion` strings in the bundle output. Check with:

```sh
grep -r "@mui\|@emotion\|stylis" build/ 2>/dev/null | head -5
```

If any MUI strings appear: a remaining import was missed. Search `src/` for `@mui` and trace it.

### Files Being Kept (no MUI, no cleanup needed)

These new-stack files should already be MUI-free and require no changes:
- `src/components/AppProviders.jsx`
- `src/components/Feed.jsx`
- `src/components/Sidebar.jsx`
- `src/components/DetailPane.jsx`
- `src/components/Messaging.jsx`
- `src/components/PublishDialog.jsx`
- `src/components/ServerAuthForm.jsx`
- `src/components/AppBar.jsx`
- `src/components/BottomNav.jsx`
- `src/components/PublishFab.jsx`
- `src/components/contexts/` (all 3 contexts)
- `src/components/ui/` (all 13 primitives)
- `src/components/message/` (all domain components)

Verify none of these have a stray `@mui` import before closing the story.

### Project Structure Notes

- After `src/config/migration.js` is deleted, `src/config/` will be empty — leave the empty directory rather than deleting it (avoids needing to recreate it if future config files are added).
- `Notifier.js → routes.js` is the only permitted `src/app/ → src/components/` crossing; the `import/no-restricted-paths` `except` clause covers it.
- `ErrorBoundary.jsx` native `<button>` must use token classes only — `border-border`, `text-text`, `bg-surface-2` are all defined in `tokens.css` and resolve to `var(--border)` etc. No raw hex (project-context.md invariant).
- `eslint-plugin-i18next` and `eslint-plugin-tailwindcss` are devDependencies — add with `-D` flag.
- The `@/config/migration` alias: after deleting `migration.js`, ESLint's `import/no-unresolved` or Vite will warn if any stale import remains. Fix before build.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 5.4] — acceptance criteria, G5 gate definition
- [Source: _bmad-output/planning-artifacts/architecture.md#lines 196-198] — `npm rm` command
- [Source: _bmad-output/planning-artifacts/architecture.md#lines 504-510] — ESLint rules to enable
- [Source: _bmad-output/planning-artifacts/architecture.md#lines 572-574] — .eslintrc rebuild note
- [Source: _bmad-output/project-context.md#Technology Stack] — removing stack items
- [Source: _bmad-output/project-context.md#Migration & Scope] — RTL is dropped, no reintroduce `dir`
- [Source: src/config/migration.js] — all 6 flags currently false
- [Source: src/components/App.jsx:3-10] — MUI/legacy imports to remove
- [Source: src/components/App.jsx:44-92] — LegacyApp function to delete
- [Source: src/components/App.jsx:220-295] — Layout/Main/Loader helpers to delete
- [Source: src/components/hooks.js:12] — accountApi import to remove
- [Source: src/components/hooks.js:369+] — useAccountListener to delete
- [Source: src/components/ErrorBoundary.jsx:2] — MUI Link/Button import to replace
- [Source: package.json:16-20,35-36] — MUI/Emotion/stylis dependency versions

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (initial interrupted run)
OpenAI GPT-5 Codex (continuation and completion)

### Debug Log References

- 2026-06-20: Customization resolver could not run under system Python (<3.11); merged base customization manually. No team/user overrides existed.
- 2026-06-20: System Node 14 could not parse current Vitest; validation used local Node 20.15.1.
- 2026-06-20: `jsdom` 29 required Node 20.19+; pinned compatible `jsdom` 26.1.0 and added PointerEvent/React act test setup.
- 2026-06-20: G5 gate test passed with all six flags true before `migration.js` deletion; replacement invariant test now prevents the module from being reintroduced.
- 2026-06-20: Full validation passed: 34 test files / 368 tests, ESLint zero errors, token parity, production build, and dev-server route smoke tests.

### Implementation Plan

- Resume from the existing dirty worktree without reverting prior story work.
- Validate the G5 gate before deleting legacy code and migration flags.
- Remove account/MUI/Emotion/RTL consumers dependency-safely, preserving login token behavior without `AccountApi`.
- Enable the full lint boundary/i18n/Tailwind rules, then resolve product-code violations and isolate test fixtures.
- Promote repeated arbitrary layout/color values into design tokens and add an automated parity gate.
- Run full tests, lint, build, bundle scans, package scans, and local route smoke checks before review.

### Completion Notes List

- Verified all migration flags were true, then removed `src/config/migration.js`; `migration.test.js` now asserts the completed flag module remains absent.
- Removed trimmed account/reserve surfaces and legacy MUI shell/RTL infrastructure, including transitive legacy-only components.
- Simplified `App.jsx` to the new provider/shell path and removed `AccountContext`, `LegacyApp`, legacy layout helpers, and migration conditionals.
- Removed `AccountApi` integration from hooks and preserved login token exchange through the existing low-level request utilities.
- Migrated `ErrorBoundary.jsx` links/buttons to native token-styled HTML.
- Removed MUI, Emotion, stylis, and RTL packages from manifests and confirmed they are absent from `node_modules`, source, and build output.
- Enabled i18next literal-string, Tailwind arbitrary-value, restricted-path, and context `useLiveQuery` lint gates; `npm run lint` passes with zero errors.
- Resolved token drift, added semantic layout/priority/motion tokens, and added `npm run token-parity`; parity now passes.
- `npm run build` succeeds and generated assets contain no MUI/Emotion/stylis references.
- `npm start` launched cleanly; `/`, `/:topic`, `/:topic/:msgId`, and `/settings` returned HTTP 200. `/login` was not required because `config.require_login` is false.
- Full regression suite passes: 34 files, 368 tests.
- Code review fixes restored conditional login routing, document language and unread-count effects, made the i18n/Tailwind lint gates effective, removed remaining invalid/arbitrary token classes, and pinned the regressions with tests.
- Post-review validation passes: 37 test files / 408 tests, ESLint zero errors, token parity, production build, and no MUI/Emotion/stylis bundle references.

### File List

#### Added

- `scripts/check-token-drift.sh`
- `src/components/App.test.jsx`
- `src/config/migration.test.js`

#### Modified

- `.eslintrc`
- `_bmad-output/implementation-artifacts/deferred-work.md`
- `design-tokens.md`
- `package-lock.json`
- `package.json`
- `public/static/langs/en.json`
- `public/static/langs/ko.json`
- `src/app/test-setup.js`
- `src/app/utils.js`
- `src/components/App.jsx`
- `src/components/AppBar.jsx`
- `src/components/BottomNav.jsx`
- `src/components/DetailPane.jsx`
- `src/components/ErrorBoundary.jsx`
- `src/components/Feed.jsx`
- `src/components/Login.jsx`
- `src/components/Login.test.jsx`
- `src/components/Messaging.jsx`
- `src/components/PublishDialog.jsx`
- `src/components/PublishDialog.test.jsx`
- `src/components/PublishFab.jsx`
- `src/components/ServerAuthForm.jsx`
- `src/components/ServerAuthForm.test.jsx`
- `src/components/Sidebar.jsx`
- `src/components/Sidebar.test.jsx`
- `src/components/SubscribeDialog.jsx`
- `src/components/contexts/ConnectionContext.jsx`
- `src/components/contexts/ConnectionContext.test.jsx`
- `src/components/contexts/PublishQueueContext.jsx`
- `src/components/contexts/SelectionContext.jsx`
- `src/components/contexts/ThemeContext.jsx`
- `src/components/hooks.js`
- `src/components/message/AttachmentBox.jsx`
- `src/components/message/AttachmentBox.test.jsx`
- `src/components/message/CardBody.jsx`
- `src/components/message/CardBody.test.jsx`
- `src/components/message/CardOverflowMenu.jsx`
- `src/components/message/CardOverflowMenu.test.jsx`
- `src/components/message/EmptyStates.test.jsx`
- `src/components/message/NotificationActions.test.jsx`
- `src/components/message/NotificationCard.jsx`
- `src/components/message/NotificationCard.test.jsx`
- `src/components/message/PriorityBadge.jsx`
- `src/components/ui/Button.jsx`
- `src/components/ui/Button.test.jsx`
- `src/components/ui/Card.jsx`
- `src/components/ui/Chip.jsx`
- `src/components/ui/DataBoundary.test.jsx`
- `src/components/ui/Dialog.jsx`
- `src/components/ui/Dialog.test.jsx`
- `src/components/ui/Menu.jsx`
- `src/components/ui/Meter.jsx`
- `src/components/ui/Skeleton.jsx`
- `src/components/ui/Switch.jsx`
- `src/components/ui/Tabs.jsx`
- `src/components/ui/utils.js`
- `src/index.jsx`
- `src/styles/tokens.css`

#### Deleted

- `src/app/AccountApi.js`
- `src/components/Account.jsx`
- `src/components/ActionBar.jsx`
- `src/components/AttachmentIcon.jsx`
- `src/components/AvatarBox.jsx`
- `src/components/DialogFooter.jsx`
- `src/components/EmojiPicker.jsx`
- `src/components/Navigation.jsx`
- `src/components/Notifications.jsx`
- `src/components/PopupMenu.jsx`
- `src/components/Pref.jsx`
- `src/components/Preferences.jsx`
- `src/components/RTLCacheProvider.jsx`
- `src/components/ReserveDialogs.jsx`
- `src/components/ReserveIcons.jsx`
- `src/components/ReserveTopicSelect.jsx`
- `src/components/Signup.jsx`
- `src/components/SubscriptionPopup.jsx`
- `src/components/UpgradeDialog.jsx`
- `src/components/styles.js`
- `src/components/theme.js`
- `src/config/migration.js`

## Change Log

- 2026-06-20: Completed migration cleanup, removed legacy MUI/Emotion/RTL/account surfaces, enabled final lint gates, added token parity enforcement, and validated the new-only application stack.
