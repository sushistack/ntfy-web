---
baseline_commit: cf52af32630a255851f18ea5b2facc1cdac6a336
---

# Story 1.3: Install UI Stack and Wire Tailwind v4 + Path Aliases

Status: review

## Story

As a developer,
I want the Tailwind v4 + Radix stack installed and wired into the existing Vite build,
so that subsequent stories can author components against it.

## Acceptance Criteria

1. **Given** the existing Vite 6 project, **When** `tailwindcss` + `@tailwindcss/vite` + `radix-ui` + `class-variance-authority` + `clsx` + `tailwind-merge` are installed and `@tailwindcss/vite` is added to `vite.config.js`, **Then** `npm run build` and `npm start` succeed with no MUI removed yet (coexistence intact).
2. **And** `@/*` resolves to `./src/*` in **three** places: Vite `resolve.alias`, `jsconfig.json`, and the ESLint `import/resolver: vite` (via `eslint-import-resolver-vite`).
3. **And** `src/styles/main.css` imports `./tokens.css` **BEFORE** `@import "tailwindcss"` so Tailwind utilities will be generated from tokens.

## Tasks / Subtasks

- [x] Install new packages (AC: 1)
  - [x] `npm i tailwindcss @tailwindcss/vite radix-ui class-variance-authority clsx tailwind-merge`
  - [x] `npm i -D eslint-import-resolver-vite`
- [x] Update `vite.config.js` (AC: 1, 2)
  - [x] Add `@tailwindcss/vite` plugin import and register it in `plugins[]`
  - [x] Add `resolve.alias` mapping `'@'` → `'./src'` (use `fileURLToPath(new URL('./src', import.meta.url))`)
- [x] Create `jsconfig.json` at project root (AC: 2)
  - [x] Map `@/*` → `./src/*` under `compilerOptions.paths`
- [x] Update `.eslintrc` (AC: 2)
  - [x] Add `settings.import/resolver.vite` to hook into the Vite alias for ESLint
- [x] Create `src/styles/` directory with stub files (AC: 3)
  - [x] Create `src/styles/tokens.css` — empty `@theme {}` stub (Story 1.4 fills this out)
  - [x] Create `src/styles/main.css` — imports tokens then tailwindcss
- [x] Wire CSS into entry point (AC: 1)
  - [x] Add `import './styles/main.css'` to `src/index.jsx` (required for Tailwind to process)
- [x] Verify build passes (AC: 1)
  - [x] `npm run build` exits 0
  - [x] `npm start` runs without errors, existing MUI UI still renders

## Dev Notes

### What this story does and does NOT do

**In scope:** package install, Vite plugin, `@/*` alias in all three tool layers, CSS entry files.
**Out of scope:** real design tokens (Story 1.4), FOUC script (Story 1.5), SW/app.html fix (Story 1.5), font self-hosting (Story 1.5), ESLint token rules (Story 5.4), any UI components.

Do not add `tailwind.config.js` — Tailwind v4 is CSS-first with no config file.
Do not add `postcss.config.js` — `@tailwindcss/vite` handles all processing, no PostCSS step.
Do not remove any MUI/Emotion packages — coexistence is required until Story 5.4.

### Package install details

```bash
# New runtime dependencies
npm i tailwindcss @tailwindcss/vite radix-ui class-variance-authority clsx tailwind-merge

# New dev dependency (ESLint Vite resolver)
npm i -D eslint-import-resolver-vite
```

`radix-ui` is the unified package (single install for all Radix primitives). Individual `@radix-ui/react-*` packages are pulled in transitively; do not install them individually for now — later stories reference the unified re-exports.

### vite.config.js — exact changes

Current file uses `import { defineConfig } from "vite"` at the top. Make three additions:

1. Import the Vite plugin:
```js
import tailwindcss from "@tailwindcss/vite";
```

2. Import the URL utility for the path alias (ES module safe, no `__dirname` needed):
```js
import { fileURLToPath } from "url";
```

3. Inside `defineConfig`, add both the plugin and the resolve alias:
```js
resolve: {
  alias: {
    "@": fileURLToPath(new URL("./src", import.meta.url)),
  },
},
plugins: [
  tailwindcss(),  // MUST come before react()
  react(),
  VitePWA({ ... }),
],
```

`tailwindcss()` must be listed **before** `react()` so CSS transforms happen first.

The existing `VitePWA` config (including the `manifestTransforms` with the `app.html` rename) is **left untouched** — the SW/app.html fix is Story 1.5 scope.

### jsconfig.json (new file at project root)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

This is for editor IntelliSense only. It does NOT affect the build or lint — Vite and ESLint have their own configs above.

### .eslintrc — import resolver addition

Add a top-level `"settings"` key:
```json
"settings": {
  "import/resolver": {
    "vite": {}
  }
}
```

The `eslint-import-resolver-vite` package reads `vite.config.js` to resolve `@/*` imports at lint time. Without this, ESLint will report `@/...` imports as unresolved. The existing `eslint-config-airbnb` import rules remain unchanged.

### src/styles/tokens.css (new — STUB only)

```css
@theme {
  /* Design tokens are defined in Story 1.4 */
}
```

This stub exists solely so `main.css` can import it without breaking. Story 1.4 replaces the entire `@theme {}` block with the full token set. Do not add any token values here.

### src/styles/main.css (new)

```css
@import "./tokens.css";
@import "tailwindcss";
```

The import order is non-negotiable: `tokens.css` MUST precede `tailwindcss` so the `@theme` block is parsed before utility generation. Reversing the order causes Tailwind utilities to be generated without custom token values.

### src/index.jsx — CSS import

Add one line at the top of `src/index.jsx`:
```js
import "./styles/main.css";
```

This is the only change to `index.jsx`. Tailwind v4's Vite plugin processes any CSS file that contains `@import "tailwindcss"`, but the file must be reachable from the JS module graph. Without this import, the CSS file is never processed and Tailwind classes have no effect.

### Coexistence verification

After the install and config changes, the existing MUI app must continue to render with no visual regressions. MUI uses Emotion, which inserts styles into `<head>`. Tailwind v4 generates a separate stylesheet. At this point there are no Tailwind utility classes in any component, so there is no rule collision to verify — just confirm the build succeeds and the app loads.

Story 1.1 (the S1 spike) verified that Emotion and Tailwind v4 can coexist with Emotion's CacheProvider pushing MUI styles into an `@layer`. The coexistence detail is Story 1.1's scope — this story just installs the packages and trusts S1's outcome.

### Alias must be wired in all three tools

| Tool | Config | Effect if missing |
|------|--------|------------------|
| Vite | `resolve.alias['@']` | Build fails on `@/...` imports |
| ESLint | `settings.import/resolver.vite` | Lint errors on `@/...` imports |
| Editor | `jsconfig.json paths` | No IntelliSense for `@/...` imports |

All three must be set in this story. Future stories that write `import { cn } from "@/components/ui/utils"` depend on all three being correct.

### Project Structure Notes

- `src/styles/` is a new directory — create it as part of this story.
- `jsconfig.json` lives at project root (same level as `package.json`, `vite.config.js`).
- `.eslintrc` already exists at root — add `"settings"` key, do not replace other config.
- `src/index.jsx` already exists — add one import line at top, touch nothing else.

### References

- Architecture §Starter Template Evaluation — selected stack rationale [Source: _bmad-output/planning-artifacts/architecture.md#Selected-Stack]
- Architecture §Build config — alias must be in all three tools [Source: _bmad-output/planning-artifacts/architecture.md#Build-config-that-must-match]
- Architecture Initialization Commands — exact npm install commands [Source: _bmad-output/planning-artifacts/architecture.md#Initialization-Commands]
- Project Context §Technology Stack — Tailwind v4 postcss/config constraints [Source: _bmad-output/project-context.md#Technology-Stack]
- Project Context §Build-Breaking Invariants — `@/*` alias source of truth [Source: _bmad-output/project-context.md#Build-config]
- Epic 1.3 story definition — Depends-on, Touched files, AC [Source: _bmad-output/planning-artifacts/epics.md#Story-1.3]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Installed runtime packages: `radix-ui`, `class-variance-authority`, `tailwind-merge` (clsx was already present as transitive dep). `tailwindcss` + `@tailwindcss/vite` were pre-installed by another session.
- Installed dev package: `eslint-import-resolver-vite`
- `vite.config.js`: added `fileURLToPath` + `tailwindcss` imports; added `resolve.alias` block with `@` → `./src`; registered `tailwindcss()` before `react()` in plugins array. Existing `test` block (Vitest, from Story 1.2 session) and VitePWA config left untouched.
- Created `jsconfig.json` at project root with `@/*` → `./src/*` path mapping for editor IntelliSense.
- Updated `.eslintrc`: added top-level `settings.import/resolver.vite` for `eslint-import-resolver-vite`.
- Created `src/styles/tokens.css` stub with empty `@theme {}` block.
- Created `src/styles/main.css` with tokens import before tailwindcss (order is non-negotiable per AC3).
- Added `import "./styles/main.css"` as first line in `src/index.jsx`.
- `npm run build` exits 0 — all 11887 modules transformed, MUI coexistence intact, no Tailwind utility collisions (no classes used yet).

### File List

- package.json (modified — added radix-ui, class-variance-authority, tailwind-merge, eslint-import-resolver-vite)
- package-lock.json (modified)
- vite.config.js (modified — tailwindcss plugin, resolve.alias)
- jsconfig.json (created)
- .eslintrc (modified — settings.import/resolver.vite)
- src/styles/tokens.css (created)
- src/styles/main.css (created)
- src/index.jsx (modified — CSS import)

## Change Log

- 2026-06-20: Story 1.3 implemented — installed Tailwind v4 + Radix UI stack, wired @/* alias in all three tool layers (Vite, ESLint, jsconfig), created CSS entry files with correct token-first import order. Build verified green.
