---
baseline_commit: 3e6c554f4d39291910070b6a33adea8640b8e39e
---

# Story 1.5: Self-hosted Fonts, SW Fix, and FOUC-free Theme Bootstrap

Status: review

## Story

As Jay,
I want the app to load its fonts locally and apply my theme with no flash and no blank offline page,
so that the first paint is correct and the PWA works offline (NFR12, NFR2, NFR14).

## Acceptance Criteria

1. **Given** Plus Jakarta Sans + JetBrains Mono variable fonts are self-hosted (no CDN),
   **When** the app loads,
   **Then** fonts resolve locally and `@font-face` is defined in `src/styles/tokens.css` (the token/style layer).

2. **Given** a stored theme of `system | light | dark`,
   **When** `index.html` runs its inline pre-paint blocking script,
   **Then** `<html class="dark">` is set **before first paint**, evaluating `system` via `matchMedia('(prefers-color-scheme: dark)')` — verified across all three stored values (S2 matrix), with the choice mirrored to `localStorage` (key `"theme"`) and IndexedDB (`Prefs.js`) as the durable store.

3. **Given** an offline cold open,
   **When** the SW serves the shell,
   **Then** `navigateFallback`/`createHandlerBoundToURL` point at `index.html` (the `app.html` rename is dropped) and a real shell renders, not a blank page; `skipWaiting` + `clientsClaim` are retained unchanged.

## Tasks / Subtasks

- [x] Task 1: Download and commit variable font files (AC: #1)
  - [x] Download `PlusJakartaSans-VariableFont_wght.woff2` (source: Google Fonts API or https://github.com/tokotype/PlusJakartaSans releases)
  - [x] Download `JetBrainsMono-VariableFont_wght.woff2` (source: https://github.com/JetBrains/JetBrainsMono releases, `fonts/variable/` directory)
  - [x] Place both files in `public/static/fonts/` alongside existing Roboto woff2 files
  - [x] Verify files are `.woff2` format (not `.ttf` — woff2 is required for production)

- [x] Task 2: Add `@font-face` to `src/styles/tokens.css` (AC: #1)
  - [x] Add `@font-face` for Plus Jakarta Sans variable font ABOVE the `@theme {}` block
  - [x] Add `@font-face` for JetBrains Mono variable font ABOVE the `@theme {}` block
  - [x] Use `font-display: swap` on both declarations
  - [x] Use weight range `200 800` for Plus Jakarta Sans, `100 800` for JetBrains Mono (variable font axis)
  - [x] Path: `/static/fonts/PlusJakartaSans-VariableFont_wght.woff2` (absolute, public-dir root)

- [x] Task 3: Add FOUC pre-paint inline script to `index.html` (AC: #2)
  - [x] Add inline `<script>` block as the FIRST child of `<head>` (before any `<link>` or other `<script>`)
  - [x] Script reads `localStorage.getItem("theme")` — returns `"dark"`, `"light"`, `"system"`, or `null`
  - [x] Default to `"system"` when key is absent
  - [x] For `system`: evaluate via `window.matchMedia("(prefers-color-scheme: dark)").matches`
  - [x] For `dark` or `system`-resolved-dark: `document.documentElement.classList.add("dark")`
  - [x] For `light` or `system`-resolved-light: do nothing (no class = light mode)
  - [x] Wrap the entire script in `try/catch` (localStorage may be unavailable in some contexts)

- [x] Task 4: Fix SW `app.html` → `index.html` in `public/sw.js` (AC: #3)
  - [x] Change `createHandlerBoundToURL("/app.html")` → `createHandlerBoundToURL("/index.html")` (line ~439)
  - [x] Keep ALL other sw.js logic untouched (push handlers, Dexie calls, skipWaiting, clientsClaim)

- [x] Task 5: Remove `manifestTransforms` rename from `vite.config.js` (AC: #3)
  - [x] Remove the entire `manifestTransforms: [...]` property from the `injectManifest` config block
  - [x] Keep `globPatterns`, `globIgnores` and all other `injectManifest` properties
  - [x] Keep all other VitePWA config unchanged

- [x] Task 6: Verify build (AC: all)
  - [x] Run `npm run build` — must exit 0
  - [x] Confirm SW output does not reference `/app.html` (grep build output)
  - [x] Confirm font files appear in `build/static/fonts/` output

## Dev Notes

### Prerequisite Check — STOP if not met

This story builds directly on top of Story 1.3 (Tailwind v4 stack install) and Story 1.4 (tokens.css). Before implementing:

- `src/styles/tokens.css` MUST exist (Story 1.4 creates it). If absent, do not proceed.
- `src/styles/main.css` MUST exist with `@import "./tokens.css"` before `@import "tailwindcss"`. If absent, do not proceed.

### Task 2: Exact @font-face code for `tokens.css`

Add ABOVE the existing `@theme {` line:

```css
/* ── Self-hosted variable fonts ──────────────────────────────
   Files live in public/static/fonts/ (served at /static/fonts/).
   Weight ranges: PJS 200–800, JBM 100–800 (variable wght axis).
   Roboto @font-face stays in public/static/css/fonts.css as fallback.
   ─────────────────────────────────────────────────────────── */
@font-face {
  font-family: 'Plus Jakarta Sans';
  src: url('/static/fonts/PlusJakartaSans-VariableFont_wght.woff2') format('woff2');
  font-weight: 200 800;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'JetBrains Mono';
  src: url('/static/fonts/JetBrainsMono-VariableFont_wght.woff2') format('woff2');
  font-weight: 100 800;
  font-style: normal;
  font-display: swap;
}

```

The `--font-sans` and `--font-mono` tokens inside `@theme` already reference these families; this just provides the local source. Roboto stays in `public/static/css/fonts.css` as the system fallback — do NOT touch that file.

**Path note:** `/static/fonts/...` is an absolute path resolving to the `public/` directory. Vite passes absolute URL paths in CSS through unchanged. At runtime (dev and production), this resolves to `<host>/static/fonts/...`.

### Task 3: Exact FOUC script for `index.html`

The script must be the **first thing in `<head>`** — before any `<link rel="stylesheet">` and before any other `<script>`. This is a synchronous blocking script; it runs before the browser paints.

```html
<script>
  (function () {
    try {
      var t = localStorage.getItem("theme") || "system";
      if (t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
        document.documentElement.classList.add("dark");
      }
    } catch (e) {}
  })();
</script>
```

**localStorage key is `"theme"`** — matches the Dexie `db.prefs` key name exactly (`Prefs.js` stores `{ key: "theme", value: "dark"|"light"|"system" }`). Story 2.2 (ThemeContext) will write this key when the user changes theme; this script only reads it.

**The S2 3-state matrix (covered by this story):**

| localStorage value | `matchMedia` dark? | Result |
|---|---|---|
| `"dark"` | any | `.dark` added |
| `"light"` | any | no class (light mode) |
| `"system"` | `true` | `.dark` added |
| `"system"` | `false` | no class (light mode) |
| `null` (not set) | `true` | `.dark` added (defaults to system) |
| `null` (not set) | `false` | no class |

**Critical bug to avoid:** a plain `t === 'dark'` check misses the `"system"` case. A user who has never changed the theme (null key) gets defaulted to `"system"` and respects OS preference. This is the confirmed correct behavior (architecture §FOUC corrected).

### Task 4: Exact sw.js change

Only change line ~439. Everything else in `public/sw.js` is **completely preserved** — all push handlers, Dexie operations, i18n, badge logic, etc.

```js
// BEFORE (line ~439):
new NavigationRoute(createHandlerBoundToURL("/app.html"), {

// AFTER:
new NavigationRoute(createHandlerBoundToURL("/index.html"), {
```

The `allowlist` regex (`^${config.app_root}$`) is kept unchanged. `skipWaiting()` and `clientsClaim()` are kept unchanged (do not "fix" or refactor them).

### Task 5: Exact vite.config.js change

Remove the `manifestTransforms` array from `injectManifest`. The comment block about `app.html` context can be removed too.

```js
// BEFORE (inside VitePWA > injectManifest):
injectManifest: {
  globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"],
  globIgnores: ["config.js"],
  manifestTransforms: [
    (entries) => ({
      manifest: entries.map((entry) =>
        entry.url === "index.html"
          ? { ...entry, url: "app.html" }
          : entry
      ),
    }),
  ],
},

// AFTER:
injectManifest: {
  globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"],
  globIgnores: ["config.js"],
},
```

**Note:** Story 1.3 also modifies `vite.config.js` (adds `@tailwindcss/vite` plugin and `resolve.alias`). If Story 1.3 has been implemented, `vite.config.js` will already have those additions — preserve them. Only remove `manifestTransforms`.

### Current File States (as of this story's creation)

**`public/sw.js`** — functional; the only bug is `createHandlerBoundToURL("/app.html")`. The `precacheAndRoute(self.__WB_MANIFEST)` injection point is preserved (required for Vite PWA build). The `activate` event handler also calls `self.skipWaiting()` — this is redundant (skipWaiting has no effect in activate) but is existing behavior; preserve it as-is.

**`index.html`** — currently has no FOUC script; has `<link rel="stylesheet" href="/static/css/fonts.css">` for Roboto. Both the FOUC script (new) and the Roboto fonts link (keep) coexist.

**`vite.config.js`** — currently has `manifestTransforms` (to be removed) and no Tailwind plugin yet (added by Story 1.3). Story 1.5 only removes `manifestTransforms`.

### Anti-Patterns to Avoid

```js
// WRONG — misses system preference entirely
if (localStorage.getItem("theme") === "dark") { ... }

// WRONG — missing try/catch (crashes in private browsing / strict CSP)
var t = localStorage.getItem("theme");

// WRONG — using a different localStorage key
localStorage.getItem("ntfy-theme");  // key must be "theme"
```

```css
/* WRONG — @font-face inside @theme block */
@theme {
  @font-face { ... }  /* @theme cannot contain at-rules other than @keyframes */
}

/* WRONG — relative path (won't resolve from src/styles/) */
src: url('../../public/static/fonts/PlusJakartaSans-VariableFont_wght.woff2')

/* CORRECT — absolute public path */
src: url('/static/fonts/PlusJakartaSans-VariableFont_wght.woff2')
```

```html
<!-- WRONG — FOUC script is not first in <head> -->
<head>
  <meta charset="UTF-8" />
  <link rel="stylesheet" href="/static/css/app.css" />
  <script>/* FOUC script here */</script>  <!-- too late, CSS already loaded -->

<!-- CORRECT — FOUC script is absolute first -->
<head>
  <script>(function(){ try { ... } catch(e){} })();</script>
  <meta charset="UTF-8" />
  ...
```

### Project Structure Notes

| File | Action | Notes |
|---|---|---|
| `public/static/fonts/PlusJakartaSans-VariableFont_wght.woff2` | **CREATE** | Variable font, wght axis 200–800 |
| `public/static/fonts/JetBrainsMono-VariableFont_wght.woff2` | **CREATE** | Variable font, wght axis 100–800 |
| `src/styles/tokens.css` | **UPDATE** | Add @font-face above @theme block |
| `index.html` | **UPDATE** | Add FOUC inline script as first child of `<head>` |
| `public/sw.js` | **UPDATE** | Change `/app.html` → `/index.html` in NavigationRoute only |
| `vite.config.js` | **UPDATE** | Remove `manifestTransforms` from `injectManifest` |
| `public/static/css/fonts.css` | **DO NOT TOUCH** | Roboto fallback — keep as-is |
| `src/app/Prefs.js` | **DO NOT TOUCH** | Theme localStorage mirroring is Story 2.2's job |
| `src/styles/main.css` | **DO NOT TOUCH** | Import order already correct from Story 1.3 |

### References

- Story AC source: `_bmad-output/planning-artifacts/epics.md` §Story 1.5
- SW `app.html` trap: `_bmad-output/project-context.md` §Don't-Step-On Trap Map
- FOUC correction (system via matchMedia): `_bmad-output/project-context.md` §Don't-Step-On Trap Map + `_bmad-output/planning-artifacts/architecture.md` §Theme/FOUC corrected
- Architecture file structure: `_bmad-output/planning-artifacts/architecture.md` §Directory Structure (lines ~566–580)
- Font spec: `_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/DESIGN.md` §Typography (Plus Jakarta Sans + JetBrains Mono, variable, self-hosted)
- Token font families: `src/styles/tokens.css` `--font-sans`, `--font-mono` (Story 1.4 deliverable)
- Session.js localStorage mirror pattern: `src/app/Session.js`
- Prefs.js theme key: `src/app/Prefs.js` (`db.prefs.put({ key: "theme", value: ... })`)
- SW injection point: `public/sw.js` line 420 (`self.__WB_MANIFEST`) — must be preserved

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- PlusJakartaSans-VariableFont_wght.woff2: Downloaded Latin variable subset (wght 200–800) from fonts.gstatic.com (Google Fonts CDN). tokotype/PlusJakartaSans GitHub releases only ship TTF, not woff2; Google Fonts provides the canonical woff2 variable subset.
- JetBrainsMono-VariableFont_wght.woff2: Downloaded from JetBrains/JetBrainsMono GitHub `fonts/webfonts/JetBrainsMono[wght].woff2` (renamed to match story convention).
- @font-face declarations added ABOVE the @theme block in tokens.css per Tailwind v4 constraint (@theme cannot contain @font-face).
- FOUC script placed as absolute first child of `<head>` — evaluates `system` via matchMedia to cover the S2 3-state matrix correctly.
- sw.js: only line 439 changed (createHandlerBoundToURL target). All push handlers, Dexie operations, skipWaiting, clientsClaim preserved.
- vite.config.js: manifestTransforms array removed; tailwindcss() plugin and resolve.alias from Story 1.3 preserved.
- Build: exits 0, 70 tests pass (no regressions), SW output clean of app.html reference, fonts present in build/static/fonts/.

### File List

- public/static/fonts/PlusJakartaSans-VariableFont_wght.woff2
- public/static/fonts/JetBrainsMono-VariableFont_wght.woff2
- src/styles/tokens.css
- index.html
- public/sw.js
- vite.config.js

## Change Log

| Date | Changes |
|---|---|
| 2026-06-20 | Added Plus Jakarta Sans + JetBrains Mono variable woff2 fonts to public/static/fonts/; added @font-face declarations above @theme in tokens.css; added FOUC pre-paint inline script as first child of index.html head; fixed sw.js navigateFallback to /index.html; removed manifestTransforms from vite.config.js |
