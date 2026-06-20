---
project_name: 'ntfy-web'
user_name: 'Jay'
date: '2026-06-20'
sections_completed: ['technology_stack', 'invariants', 'trap_map', 'scope_out']
existing_patterns_found: 7
status: 'complete'
optimized_for_llm: true
---

# Project Context for AI Agents

_Critical, non-obvious rules for ntfy-web. Full reasoning lives in
`_bmad-output/planning-artifacts/architecture.md`. **Brownfield UI rebuild: preserve `src/app/`,
rebuild `src/components/` (MUI → Tailwind v4 + Radix).** Two axes below: invariants that break the
build/data if violated, and a trap map of things an agent will step on if it doesn't know them.
Anything ESLint/Prettier already enforces is intentionally NOT repeated here._

---

## Technology Stack

- **JavaScript only** (`.js`/`.jsx`) — no TypeScript, no `tsconfig`. **`package.json` is the version
  source of truth** (don't trust pinned patch numbers in prose). Hard constraints: **react-router
  stays v6** (no v7), **Tailwind stays v4** (no v3), Dexie 3.x, i18next 21.x.
- Stack: React + Vite 6 · react-router-dom v6 · Dexie + `dexie-react-hooks` · i18next/react-i18next ·
  `react-remark` (uses the **`useRemark` hook**, not `<Remark>`) · vite-plugin-pwa (workbox
  `injectManifest`, `public/sw.js`).
- Adding: **Tailwind v4** (`@tailwindcss/vite`; needs no `postcss.config` and no `@tailwindcss/postcss`)
  · unified **`radix-ui`** package · `class-variance-authority` + `clsx` + `tailwind-merge`.
- Removing (don't write new code against): `@mui/*`, `@emotion/*`, `stylis`, `stylis-plugin-rtl`.

---

## Build-Breaking Invariants (violate → broken build or data)

### Layers (ESLint-enforced)
- `src/app/ → src/components/` is **FORBIDDEN** (logic layer imports no React/UI). Sole exception:
  `Notifier.js → components/routes.js`.
- `ui/ → message/` (or any domain module) is **FORBIDDEN** — `ui/` is domain-ignorant ("knows shapes,
  not words"). Domain copy/colorways live in `message/EmptyStates.jsx`, never `ui/StatePanel.jsx`.
- `contexts/` must **not import `useLiveQuery`** — Contexts hold UI state only; data stays in Dexie.

### Data / state
- **Dexie is the single source of truth.** Read via `useLiveQuery` only — **never copy a Dexie result
  into `useState`/Context.** Writes go through `SubscriptionManager`/`Prefs`.
- **`useLiveQuery` returns `undefined` on first render** — always guard before `.map`/`.length`
  (`const rows = useLiveQuery(...) ?? []`), or the feed crashes on cold mount.
- **Dexie schema:** `db.version(n).stores({...})` in `db.js`. You may only `orderBy`/`where` on
  **indexed** fields (`&id`, `sequenceId`, `subscriptionId`, `time`, `[subscriptionId+sequenceId]`).
  Querying an unindexed field throws — add the index AND bump `db.version` if you need a new one.
- Dedupe on PK `&id`; **order feeds by `sequenceId`, not arrival time** (a late poll must not rewind a
  newer WS message). Both behaviors must be pinned by a characterization test before the UI swap.
- Listeners are wired **once** in `hooks.js`; read connection via `useConnection()`, never call
  `ConnectionManager` directly. Connection model = `state × hasData` (debounced ~300ms for flicker only).
- **Selection = the URL.** `SelectionContext` derives from `useParams`/`useSearchParams` — **no local
  `selectedId`**. Route `/:topic/:msgId` drives desktop right-pane AND mobile full-screen (split by CSS).
- Optimistic: `mute`/action-buttons = optimistic + revert-on-failure. **Publish-only** send queue
  (`sending/queued/failed`) lives in memory (`PublishQueueContext`); persist to Dexie **only on ack**,
  then clear the queue entry. Single-user ⇒ no conflict/merge logic.

### Styling / tokens (ESLint-enforced: no raw hex/px)
- **Tokens only** — Tailwind classes resolving to `@theme` tokens (`bg-surface`, `rounded-md`) or
  `var(--token)`. New values go to `src/styles/tokens.css` + `design-tokens.md` first. One-off optical
  nudge may use raw `px` **only** with `/* layout-nudge: <why> */`.
- `tokens.css` is the web source of truth and loads via `@import "./tokens.css"` **before**
  `@import "tailwindcss"`. **Static token values go inside the `@theme` block** (so utilities
  generate); **theme overrides redefine the same vars OUTSIDE `@theme`** under `.dark` /`:root`
  (`@theme` can't hold selector-scoped values). **Dark mode = `.dark` class only** — never a JS theme flag.
- `cva` for variants (imported only inside `ui/`); merge classes via the single `cn()` in `ui/utils.js`.
- Accent has 3 sub-tokens — pick by *what is painted*: text/icon → `accent-text` (4.5:1); border/focus
  → `accent-ui` (3:1); foreground on an accent fill → `accent-on-surface` (4.5:1).

### i18n (ESLint-enforced: no-literal-string)
- **No hardcoded user-facing strings** (incl. `aria-label`/`title`). `t("snake_case_key")` +
  `<Trans>`; key shape `<feature>_<element>_<action>`; Korean copy in `public/static/langs/ko.json`.

### Security
- **Markdown link sanitization is mandatory.** `useRemark` not using `rehype-raw` blocks raw HTML, but
  it does **not** neutralize `javascript:`/`data:` URIs in links — sanitize `a[href]`/image src to an
  allowlist (`http`/`https`/`mailto`) when rendering user message content. Never render user content
  via `dangerouslySetInnerHTML`. Keep the existing remark plugin chain; only re-point the component map.

### Build config (must match the structure or it silently breaks)
- `@/*` alias source of truth = **Vite `resolve.alias`**; mirror it in `jsconfig.json` (editor) and
  ESLint `eslint-import-resolver-vite` (lint). All three or imports break in one tool only.
- vite-plugin-pwa **injectManifest**: `public/sw.js` is hand-authored and MUST contain the
  `self.__WB_MANIFEST` injection point, or the build fails.
- Provider order is codified in `AppProviders.jsx`: **Theme → Connection → Selection → PublishQueue.**

---

## Don't-Step-On Trap Map (verified against the code)

- **Theme FOUC:** Prefs stores `system|light|dark` in IndexedDB (async). The pre-paint inline script in
  `index.html` MUST evaluate `system` via `matchMedia('(prefers-color-scheme: dark)')` — a raw
  `=== 'dark'` check misses `system`. Mirror the choice to `localStorage` (like `Session.js` does for
  the session) so the script reads it synchronously before first paint.
- **Service-worker `app.html` legacy:** `vite.config.js` renames `index.html`→`app.html` and
  `public/sw.js` binds `navigateFallback`/`createHandlerBoundToURL` to `/app.html` (a go-server-embed
  leftover). For the standalone build, **drop the rename and point both at `index.html`** or offline
  navigation serves a blank page. Keep `skipWaiting` + `clientsClaim`.
- **Notification permission** is requested inside a **user-gesture** path in `Notifier.js` — keep it
  there; called outside a gesture, browsers silently ignore it.
- **`config` is a `window.config` global** (`public/config.js`, server-generated); import via
  `import config from "../app/config"` (ESLint readonly global).
- **Conditional login:** render login UI **only when `config.require_login` is true**; otherwise auth
  is just stored credentials. Account/signup/billing/reserved/token-management are removed.
- **Tests:** none yet. Before the UI swap, add `src/app/` characterization tests with Vitest +
  `fake-indexeddb` — `import "fake-indexeddb/auto"` at top, and reset the DB between tests
  (`indexedDB.deleteDatabase`) to avoid state leakage. Co-locate as `*.test.js`.

---

## Migration & Scope

- **Strangler, flag-driven:** `src/config/migration.js` (`export const NEW = {...}`) switches old↔new
  per area in `App.jsx`/`routes.js` — it's a **runtime rollback switch** (flip a flag to recover a
  broken area without breaking the build). First task: spike **S1 (Emotion `@layer` coexistence)** —
  it gates the migration timeline. Remove an old MUI file once its flag is `true`, the build is green,
  and characterization tests pass (no separate-PR ceremony required).
- **Scope: out** — RTL is dropped (LTR/Korean only; do not reintroduce `dir`/logical-property RTL).
  No multi-user/account/billing/reserved-topic surfaces. No backend/API/transport changes.

---

## Usage Guidelines

**For AI agents:** read this file before implementing; follow every invariant exactly; when unsure,
prefer the more restrictive option; consult `architecture.md` for the reasoning behind a rule.

**For humans:** keep it lean (invariants + traps only — never repeat what ESLint/Prettier enforces);
update when the stack or a verified fact changes; once a rule becomes obvious to current models,
remove it.

Last Updated: 2026-06-20
