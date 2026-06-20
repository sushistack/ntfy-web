---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-06-20'
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-ntfy-web-2026-06-20/prd.md
  - _bmad-output/planning-artifacts/prds/prd-ntfy-web-2026-06-20/addendum.md
  - _bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/EXPERIENCE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/reconcile-prd.md
workflowType: 'architecture'
project_name: 'ntfy-web'
user_name: 'Jay'
date: '2026-06-20'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
A brownfield presentation-layer rebuild of the self-hosted ntfy web client. 15 user
stories (US1–US15) across 7 screens (SC1–SC7): connect to server (URL + basic/token
auth), subscribe to topics, receive in real time, browse history (per-topic + merged
"all"), open notification detail (markdown, tags, priority, attachment, action buttons),
publish, mute/unmute, manage subscriptions, switch theme, and clear empty/error/connection
states. All flows run against the existing ntfy server with **zero backend changes** — every
request conforms to current endpoints, params, and auth. The logic layer in `src/app/`
(Connection, ConnectionManager, Poller, db/Dexie, SubscriptionManager, UserManager, Api,
Notifier, Prefs, Pruner) is preserved functionally; `src/components/` (MUI) is rebuilt.
Account/billing/signup/reserved-topic/token-management surfaces are trimmed.

**Non-Functional Requirements:**
- **Real-time delivery** — WebSocket primary + 5-minute HTTP poll fallback (NOT SSE);
  connection logic stays functionally identical, redesign is presentation-only.
- **Offline-first** — Dexie/IndexedDB + service worker; cached feed renders immediately on
  cold open, history survives reload/offline.
- **Accessibility** — WCAG AA (≥4.5:1 body) in both light and dark; priority conveyed by
  label + icon + position, never color alone; keyboard/focus rebuilt on Radix after MUI
  removal; `aria-live` for arriving notifications + connection changes; `prefers-reduced-motion`.
- **Shared design system** — one token set is source of truth, hand-synced 1:1 to web CSS
  vars and Android `colors.xml`/`dimens.xml`; emerald `#42D392` accent shared 1:1 with Android.
- **PWA** — installable on all 3 form factors; SW serves shell offline; browser notifications
  fire from SW honoring per-topic mute.
- **Responsive** — 3 layouts off one codebase (desktop 3-col / tablet icon-rail / mobile
  top-bar+bottom-nav); detail = right pane (desktop) vs full-screen route (mobile).
- **Standalone deploy** — static build behind Cloudflare Tunnel; must NOT embed in the ntfy
  server binary; runtime server URL/auth configurable.
- **i18n** — i18next retained; LTR/Korean only (RTL dropped with MUI).

**Scale & Complexity:**
Single-user, single-server, single-tenant by construction. No backend, no multi-tenancy, no
regulatory compliance, no auth provider integration. Complexity concentrates in: (1) the
real-time connection state machine and its UI reflection, (2) the adaptive notification-card
renderer (paragraph / key-value / rich key-value with inline meters), (3) the 3-form-factor
responsive shell, and (4) re-establishing a11y/focus/theming after dropping MUI.

- Primary domain: client-side web (React + Vite PWA SPA)
- Complexity level: medium
- Estimated architectural components: app shell · sidebar/nav · two feeds · notification card
  (+ adaptive body renderer) · detail pane/route · subscribe dialog · publish dialog/sheet ·
  settings · state panels · theme system · connection indicator — ~11 presentation areas over
  a preserved logic core.

### Technical Constraints & Dependencies

- **Preserve** logic layer (`src/app/`): WebSocket/poll connection, Dexie persistence,
  subscription/user managers, Api, Notifier, Prefs, Pruner, i18n.
- **Replace** MUI v5 + Emotion + stylis-plugin-rtl with Tailwind + shadcn/headless (Radix).
  Every `src/components/` screen re-implemented; RTL machinery removed.
- **Remove** Account.jsx, Signup.jsx, Login.jsx, Upgrade*/Reserve* dialogs, RTLCacheProvider,
  AccountApi.js; keep auth plumbing in UserManager/Api (protected topics may still need
  token/basic auth).
- **Retain** vite-plugin-pwa + public/sw.js, Dexie/IndexedDB, react-router v6, i18next,
  react-remark (markdown), react-infinite-scroll-component (or equivalent).
- **No backend changes / no API changes / no new transport.** Single ntfy server assumed.
- **Token system** is the contract with the Android sister app — hand-synced, no generator
  (Style Dictionary not justified at this scale).
- Theme applied via `.dark` class + `prefers-color-scheme`, choice stored in IndexedDB
  (replaces MUI `createTheme`).

### Cross-Cutting Concerns Identified

- **Theming** — token-driven CSS vars + `.dark` toggle; spans every component; AA in both modes.
- **Connection state** — global, live; drives the connection indicator and feed state panels
  (not-connected / connecting / reconnected / offline) everywhere.
- **Accessibility** — focus management, keyboard nav, live regions, reduced-motion; rebuilt
  from scratch on Radix across all dialogs/menus/sheets/panes.
- **Offline / caching** — IndexedDB-first render + SW shell; affects every data surface.
- **i18n** — i18next strings across all rebuilt markup; LTR-only.
- **Optimistic UI** — publish + mute + action buttons report inline, reconcile on server ack.
- **Cross-platform token parity** — web ↔ Android drift prevention (manual sync discipline).

### Verified Separation Findings (empirical, 2026-06-20)

Six targeted greps tested the "presentation-only rebuild" premise against the actual code:

- **Logic layer is clean of MUI/Emotion/theme.** `src/app/` has zero MUI, Emotion,
  `palette`, `createTheme`, or `sx` references (the one hit is an emoji description string).
  The MUI→Tailwind boundary does NOT leak into the preserved logic layer.
- **app→components coupling is localized to a 3-item contract**, not a tangle:
  1. `src/components/hooks.js` registers the connection listeners
     (`connectionManager.registerStateListener` / `registerMessageListener`, hooks.js:96-101)
     — the single lifecycle-glue file the rebuild must re-wire.
  2. `src/components/routes.js` is imported by `src/app/Notifier.js` (`routes.forSubscription`,
     Notifier.js:30) to build the browser-notification click-through URL — a cross-layer
     contract that MUST be preserved (route shape `/:topic`, `/:baseUrl/:topic`).
  3. `Notifier.js` requests notification permission in a user-gesture path — the new UI must
     preserve that call site or notifications silently die.
  (`src/app/AccountApi.js`→routes also exists but AccountApi is removed.)
- **Data flows one-way:** Connection → messageListener → SubscriptionManager → Dexie →
  `dexie-react-hooks` (`useLiveQuery`) → React re-render. Infinite-scroll anchor is a
  component concern, not a Poller↔component ref coupling. A strangler/incremental migration is
  structurally viable; a big-bang is not forced.

### New Risks Surfaced (to resolve during architecture decisions)

- **Theme FOUC.** Theme lives only in IndexedDB (`Prefs.js`, async); a Tailwind `darkMode:'class'`
  toggle needs `<html class="dark">` set before first paint. Mitigation precedent already exists —
  `Session.js` mirrors session to `localStorage` and syncs back; mirror the theme key the same way
  and read it from an inline blocking script in `index.html`.
- **Service-worker `/app.html` fallback.** `vite.config.js` renames `index.html`→`app.html` and
  `public/sw.js` binds `NavigationRoute` to `/app.html` — legacy of the ntfy go-server embed. The
  standalone build must drop the rename and point `navigateFallback`/`createHandlerBoundToURL` at
  `index.html`, or offline navigation serves a blank page.
- **Markdown styling, not safety.** `react-remark`'s `useRemark` renders to React elements (no
  `rehype-raw`, no `dangerouslySetInnerHTML`) — XSS-safe as-is. The real work is porting the
  Emotion `styled` MarkdownContainer to a Tailwind `prose`-style treatment; keep the remark plugin
  chain identical.
- **Connection state is a state machine, not a boolean.** WS-primary + 5-min poll fallback can
  double-deliver across the WS-drop↔poll-fill seam; rely on idempotent Dexie upsert by message id.
  The UI indicator must reflect a `connectionState × hasData` model with debounced transitions so a
  1.5s blip doesn't blow away the feed.
- **Token contract needs a naming map.** Add a single canonical `design-tokens` manifest
  (`canonical | light | dark | web-key | android-key | status`) with a kebab↔snake rule and an
  ASSUMPTION→confirmed status column; rule: "a color/spacing change that doesn't touch the manifest
  is unfinished." No generator — a ~20-line diff linter only if/when drift appears.
- **Accent is multi-purpose for AA.** `#42D392` fails text AA on light; the light `#1A9E5F`
  assumption must also clear WCAG 1.4.11 non-text contrast (3:1) for meter fills, dots, FAB, links.
  Split accent into semantic sub-tokens (text / ui / on-surface) and verify per theme.

## Starter Template Evaluation

### Primary Technology Domain

Client-side web (React + Vite PWA SPA). **Brownfield** — the official ntfy web app is already
present (React + Vite 6.4.2 + react-router v6 + i18next + Dexie + vite-plugin-pwa). There is no
greenfield scaffold to generate; the "starter" decision is **which UI stack to layer onto the
existing Vite project** while replacing MUI.

### Starter Options Considered

- **`create vite` / T3 / Next.js fresh scaffold** — rejected. Would discard the preserved logic
  layer (`src/app/`) and the working Vite/PWA/i18n/Dexie wiring. Brownfield ≠ greenfield.
- **Keep MUI, retheme only** — rejected in PRD §4.4 / addendum C (kept as the fallback path).
- **Tailwind v3 + shadcn CLI** — viable but heavier: PostCSS config, `tailwind.config.js`, a
  CLI black box that scaffolds TS-first components whose default styling we'd fully override.
- **Tailwind v4 + Radix primitives (direct) — SELECTED.**

### Selected Stack: Tailwind CSS v4 + Radix UI primitives (no shadcn CLI), JavaScript

**Rationale for Selection:**
- **Tailwind v4** is CSS-first: `@import "tailwindcss"` + an `@theme` block, **no PostCSS and no
  `tailwind.config.js`** required. The design tokens already live as CSS custom properties in
  `:root`/`.dark` (PRD addendum §B), so v4's `@theme` maps the token system 1:1 with the least
  glue. The `@tailwindcss/vite` plugin drops straight into the existing `vite.config.js`.
- **Radix primitives directly** (not the shadcn CLI): the design is highly custom — every
  component is re-implemented from DESIGN.md tokens, so shadcn's default component styling would
  be 100% overridden anyway. Using `@radix-ui/react-*` primitives + `class-variance-authority`
  (cva) + `tailwind-merge`/`clsx` gives the same a11y plumbing (focus trap, keyboard nav, ESC,
  scroll-lock) the rebuild needs (Accessibility Floor) without a CLI/`components.json` layer or
  TS-first friction. EXPERIENCE.md already specifies "built on Radix primitives."
- **JavaScript retained** (not migrating to TS): the preserved logic layer is 52 JS files with no
  tsconfig; staying JS keeps `src/app/` untouched (zero migration), and new components are `.jsx`.
  A `jsconfig.json` with a `@/*` → `./src/*` path alias is the only addition.

**Initialization Commands (layered onto the existing project):**

```bash
# Tailwind v4 + Vite plugin
npm i tailwindcss @tailwindcss/vite

# Radix primitives needed by the rebuild (add per-component as screens land)
npm i @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-popover \
      @radix-ui/react-tooltip @radix-ui/react-switch @radix-ui/react-tabs \
      @radix-ui/react-visually-hidden

# Variant/merge helpers (the shadcn recipe, used directly)
npm i class-variance-authority tailwind-merge clsx

# Remove the old MUI/Emotion/RTL stack (after screens are migrated)
npm rm @mui/material @mui/icons-material @emotion/react @emotion/styled @emotion/cache \
       stylis stylis-plugin-rtl
```

**Architectural Decisions Provided by This Stack:**

- **Language & Runtime:** JavaScript (ES modules), React, Vite 6 (Node 25). No TypeScript;
  `jsconfig.json` adds the `@/*` path alias only.
- **Styling Solution:** Tailwind CSS v4 (`@tailwindcss/vite` 4.3.x), CSS-first `@theme` driven by
  the design-token CSS vars (`:root` + `.dark`). No PostCSS, no `tailwind.config.js`. Token
  manifest stays the source of truth; `@theme` references the vars.
- **Component Primitives:** Radix UI (`@radix-ui/react-*`) for Dialog/DropdownMenu/Popover/
  Switch/Tabs/Tooltip + cva/tailwind-merge/clsx for variant styling. No shadcn CLI.
- **Build Tooling:** existing Vite config + `@tailwindcss/vite` plugin; vite-plugin-pwa retained
  (with the `app.html`→`index.html` fix noted in Project Context risks).
- **Testing Framework:** none currently in repo. Recommend Vitest + React Testing Library when a
  test layer is added; first priority is characterization tests on `src/app/` before the UI swap
  (per the verified-separation finding). [decided in a later step]
- **Code Organization:** preserve `src/app/` (logic) untouched; rebuild `src/components/`;
  introduce `src/components/ui/` for the reusable Radix-based primitives (Button, Dialog, Sheet,
  Menu, Switch, Chip, Meter, Card) that the screens compose.
- **Development Experience:** Vite HMR (existing `npm start`), ESLint (airbnb config already
  present, prune RTL/MUI rules), Prettier already configured.

**Note:** The stack install + Tailwind v4 wiring + `jsconfig.json` alias + the `app.html` SW fix
should be the first implementation story; MUI removal happens incrementally as screens migrate.

## Core Architectural Decisions

> Reviewed in Party Mode and revised against empirical fact-checks (2026-06-20). Scope was
> deliberately trimmed for a single-user / single-server product (no conflict, no collaboration,
> no enterprise governance). Accessibility is kept at the WCAG-AA floor (a hard PRD S3 criterion),
> not cut.

### Decision Priority Analysis

**Critical (block implementation):** UI stack (Tailwind v4 + unified `radix-ui` + JS);
Strangler migration; data via `useLiveQuery` + cross-cutting UI via Context/`useReducer`;
FOUC-free theme; connection `state × hasData` model.

**Important:** selection-as-route; 2-level card renderer; `src/components/ui/` primitives;
token manifest as the web↔Android contract.

**Deferred:** Vitest+RTL adoption (but `src/app/` characterization tests come BEFORE the swap);
CI/CD (a static `vite build` host step); mobile card swipe (`[ASSUMPTION]`).

### Data Architecture

- **Persistence:** Dexie/IndexedDB unchanged. Reads via `dexie-react-hooks` `useLiveQuery`.
- **Idempotency (verified):** `notifications` uses `&id` (unique PK) — `put`/`bulkPut` is
  idempotent by message id. **Ordering** is carried by `sequenceId` (+ `[subscriptionId+sequenceId]`
  index) and `Poller.latestNotificationsBySequenceId()`; feed order derives from `sequenceId`, so a
  late-arriving poll row cannot visually rewind a newer WS row. A characterization test must pin
  **both** dedup (same id twice → count 1) **and** sequence ordering before the rebuild.
- **Renderer input validation:** a defensive parse layer in the renderer (not in `src/app/`)
  tolerates malformed payloads (see Frontend Architecture).

### Authentication & Security

- **Auth:** stored token/basic creds (`UserManager.js`/`Session.js`), unchanged. Account/signup/
  billing/reserved/token surfaces removed; `routes.js` login/signup/account keys pruned.
- **Conditional login UI (verified flag):** login is rendered **only when `config.require_login`
  is true** (a runtime, server-generated flag — `public/config.js`). For Jay's setup it is false,
  so credentials are just stored settings; the plumbing stays for protected-topic setups.
- **Markdown safety:** `react-remark` `useRemark` renders React elements (no `rehype-raw` /
  `dangerouslySetInnerHTML`) — XSS-safe. A component map exists (`Notifications.jsx:700`); re-point
  its element overrides to the Tailwind/`ui` primitives during restyle. Keep the remark plugin
  chain verbatim. (Restyle, not a security change.)
- **Transport:** HTTPS behind Cloudflare Tunnel; SW https/localhost guard in `Notifier.js` kept.

### API & Communication Patterns

- **No API/transport changes.** `Connection.js`/`ConnectionManager.js`/`Poller.js` functionally
  identical. UI consumes them via the existing listener interface, wired in `hooks.js`.
- **Connection state machine:** `connectionState (connected|connecting|reconnecting|offline) ×
  hasData` in a `ConnectionContext`, mapped from logic-layer states in `hooks.js` (no `src/app/`
  change). Surface-replacing state panels only when `hasData` is false; otherwise a non-intrusive
  top strip. Transitions debounced (~300ms) **purely to suppress flicker — never to mask a state
  bug**; the debounce must not swallow late-poll ordering (ordering is guarded by `sequenceId`
  above, not by the debounce).
- **Optimistic UI (scope-trimmed):** single-user ⇒ no write conflicts, so **no transaction
  ledger**. mute / action-button = optimistic update; on failure, revert + an inline "재시도".
  **Offline send queue is publish-only**, modeled as a simple **보냄 / 대기 / 실패** state
  (retry-in-place), so a phone-published message is never lost on a weak signal. Dexie remains the
  single source of truth — nothing to reconcile a second ledger against.

### Frontend Architecture

- **Migration = Strangler, with an explicit order and a cleanup entry-condition.**
  1. `src/components/ui/` Radix primitives + token wiring.
  2. **App shell + sidebar + the three Contexts first** — lowest-risk surface that proves the
     MUI/Tailwind coexistence harness, theme, and connection model.
  3. **Notification card + feeds second** — the hero element, to pressure-test the primitives early.
  4. detail → 5. dialogs → 6. settings/state panels.
  7. **Cleanup story** removes MUI/Emotion/`RTLCacheProvider`/stylis-rtl. **Entry condition: the
     last MUI route has been replaced** (named, so coexistence can't become permanent at ~90%).
  *Honest label:* this is "presentation + two named glue seams" (`hooks.js` listeners,
  `Notifier.js`→`routes.js`), not a pure presentation layer — to stop future logic creeping into
  `hooks.js`.
- **Coexistence risk (spike first): Emotion is unlayered, Tailwind v4 lives in `@layer`** — so
  Tailwind utilities lose to MUI `sx` during the transition. The first spike (S1) proves we can
  push Emotion into an `@layer` via its CacheProvider; this is the one result that could force an
  architecture rethink, so it runs before screen migration.
- **State management:** `useLiveQuery` (data) + React Context/`useReducer` (UI). `ConnectionContext`
  (state×hasData+debounce); `SelectionContext`; `ThemeContext`; a small publish-queue reducer. No
  new state library.
- **Routing / selection = URL is the single source of truth.** Shared route `/:topic/:msgId`; on
  desktop it renders as a right pane, on mobile as a full-screen view — **one param, split by CSS
  breakpoint, not two routes**. `SelectionContext` is a **derived selector over `useParams`/
  `useSearchParams` (no local `selectedId` state)**, so refresh / deep-link / back behave
  identically on every form factor and a phone-opened link lands on the selected card.
- **Focus & a11y (kept at floor, framework cut):** rely on Radix for dialog/menu/sheet focus
  trapping, restore-to-trigger, and Esc — free. For the route-based mobile detail, add the
  **minimal** a11y baseline (move focus to the detail heading on open; return toward the feed on
  back) **without** an elaborate router focus-metadata system. `aria-live` announces arriving
  notifications + connection changes; `prefers-reduced-motion` honored. (Scope cut applies to the
  framework, not to the WCAG-AA obligation in PRD S3.)
- **Adaptive card renderer = 2 levels, not 4.** (1) **Rich**: render all known ntfy fields
  (title, body markdown, priority badge+bar, tags, topic chip, attachment, ≤3 action buttons, and
  inline meters when a value parses as numeric/percentage). (2) **Fallback**: anything that fails
  to parse drops to safe raw text — the card always survives. Extra intermediate tiers are YAGNI;
  add one only if a real ntfy payload shape demands it.
- **Theme / FOUC (corrected):** mirror the theme choice to `localStorage` (per the existing
  `Session.js` mirror pattern); an inline blocking script in `index.html` sets `<html class="dark">`
  pre-paint and **evaluates `system` via `matchMedia('(prefers-color-scheme: dark)')`** (Prefs
  stores `system|light|dark`, so a raw `=== 'dark'` check is insufficient). IndexedDB (`Prefs.js`)
  stays the durable store and re-syncs on load; a `matchMedia` change listener handles live OS
  toggles for `system`. Accent splits into semantic sub-tokens (`accent-text`/`accent-ui`/
  `accent-on-surface`) for WCAG 1.4.11 — define the tokens; no audit pipeline.
- **Performance:** self-host Plus Jakarta Sans + JetBrains Mono (no CDN); route-level code
  splitting; MUI/Emotion bundle dropped at cleanup.

### Infrastructure & Deployment

- **Standalone static build** behind Cloudflare Tunnel; not embedded in the ntfy go-server.
- **SW fix (required):** drop the `index.html`→`app.html` rename in `vite.config.js` and point
  `navigateFallback`/`createHandlerBoundToURL` at `index.html` in `public/sw.js` (the `app.html`
  indirection is a go-server-embed legacy → blank page offline otherwise). Keep `skipWaiting` +
  `clientsClaim`.
- **Runtime config:** server URL/auth stay runtime-configurable (`public/config.js` pattern).
- **CI/CD:** deferred; a single `vite build` → static host step suffices for MVP.

### Token Contract (web ↔ Android)

- A single canonical **`design-tokens` manifest** in the web repo: `canonical | light | dark |
  web-key | android-key` with an explicit **kebab↔snake naming map** and inline `[ASSUMPTION]`
  markers on unconfirmed light-theme values. One-line social contract: *"a color/spacing change
  that doesn't touch the manifest is unfinished."* **No generator, no formal status-transition
  workflow** (single maintainer — governance ceremony is self-harm per PM review); a ~20-line diff
  linter only if drift is ever observed.

### Spikes to run before/early in implementation (ranked)

1. **S1 — Emotion `@layer` coexistence PoC** (HIGH; only result that can force a rethink).
2. **S2 — FOUC 3-state matrix** (HIGH; the `system` fix is a confirmed correction, not open).
3. **S5 — Dexie dedup+ordering characterization test** (LOW cost; PK already verified `&id`).
4. **S4 — URL-as-SoT selection** (MEDIUM; guardrail = no local `selectedId`).
5. **S3 — Radix/MUI z-index stacking** (MEDIUM; hot only late in the transition).

### Decision Impact Analysis

**Implementation sequence:** characterization tests on `src/app/` → stack install + Tailwind
`@theme` + `jsconfig` alias + SW `app.html` fix + FOUC script → `ui/` primitives → shell + 3
Contexts → card + feeds → detail (route-driven, CSS-split) → dialogs (publish queue) → settings +
states → cleanup (remove MUI, entry-condition: last route migrated).

**Cross-component dependencies:** `ConnectionContext` feeds the indicator and every state panel;
`SelectionContext`↔router underpins detail on all form factors; the token manifest gates the
Tailwind `@theme` and the Android sync; the SW `app.html` fix gates offline correctness;
the publish queue depends on `ConnectionContext` liveness.

## Implementation Patterns & Consistency Rules

This is a client-side React + Vite + JavaScript + Tailwind v4 SPA, so the conflict surface is not
DB/API naming — it is token usage, component/file structure, state conventions, i18n, and
state-handling. Patterns build on the repo's ESLint baseline (airbnb + prettier: arrow-function
components, `func-style: expression`, no prop-types, double quotes, `import/no-cycle` warn).

> Guiding principle (from the patterns review): **a rule an agent must *judge* should be demoted
> into code structure (wrapper / template / single source) so the judgment disappears; a rule a
> machine can *detect* should be an ESLint rule, not prose.** Don't lean on the "manifest-first"
> social rule to carry consistency — it's a meta-rule and enforces none of the below.

### Naming Patterns

**Code naming (existing — keep):** Components `PascalCase.jsx`, one per file, **arrow functions**
(no `function` declarations). Hooks `useCamelCase` in `camelCase.js`. Logic layer `src/app/`
unchanged (class singletons `PascalCase.js`, util modules lowercase). No prop-types, no TS.

**i18n keys (existing — keep, now enforced):** `snake_case` via `t("...")`, rich nodes via
`<Trans>`. Korean copy in `public/static/langs/ko.json`. **Key structure: `<feature>_<element>_<action>`**
(e.g. `publish_button_send`). No hardcoded user-facing strings (incl. `aria-label`/`title`).

**Token naming:** `kebab-case` canonical (`surface-2`, `accent-ui`) → CSS var `--surface-2` →
Tailwind utility `surface-2` (auto-derived by `@theme`) → Android `surface_2`. **Conversion rule:
`android-key = canonical with every "-" replaced by "_"`, no other variation.** Never invent a
synonym for an existing token.

### Structure Patterns

**Folder layout:**
- `src/app/` — preserved logic layer. **No React/UI imports** (enforced; only `Notifier.js`→
  `routes.js` is allowed). Pure formatting helpers (date/bytes/priority-label) join here if a
  formatter module already exists; otherwise `src/lib/format.js`.
- `src/components/ui/` — domain-**ignorant** Radix primitives, one per file (`Button.jsx`,
  `Dialog.jsx`, `Sheet.jsx`, `Menu.jsx`, `Switch.jsx`, `Chip.jsx`, `Meter.jsx`, `Card.jsx`).
- `src/components/ui/utils.js` — **style helpers only**: `cn()` (clsx + tailwind-merge) and `cva`
  re-export. **No domain formatting here.**
- `src/components/message/` — **domain-aware** composites: the adaptive card renderer + card body
  forms (it knows the ntfy message shape, so it does NOT belong in `ui/`).
- `src/components/` — screen-level components composing `ui/` + `message/`.
- `src/components/contexts/` — `ConnectionContext.jsx`, `SelectionContext.jsx`, `ThemeContext.jsx`.
  **Entry rule: only cross-cutting *state* lives here.** Anything derivable from Dexie/router stays
  a selector hook in `hooks.js` (same "don't store what you can derive" rule as SelectionContext).
- `src/styles/tokens.css` — **the web source of truth**: token CSS vars in `:root` + `.dark`.
- `design-tokens.md` — the canonical web↔Android manifest (table below).
- Templates: `src/components/contexts/_template.context.jsx`,
  `src/components/ui/_template.ui.jsx` — new Contexts/primitives start by copying these.
- Tests (when added): `src/app/__tests__/` for characterization; co-located `*.test.jsx` elsewhere.

### Format Patterns

**Styling — the most conflict-prone area:**
- **Tokens only.** Use Tailwind classes resolving to `@theme` tokens (`bg-surface`, `text-muted`,
  `rounded-md`) or `var(--token)`. **No raw hex; no arbitrary px** (`bg-[#16181B]`, `mt-[13px]`).
  Shadow/overlay alphas are tokens too (added to the set up front).
  - **Sanctioned escape hatch:** a genuine one-off optical nudge may use a raw `px` **only with a
    `/* layout-nudge: <reason> */` comment**. The linter blocks raw px/hex *without* that comment —
    so the rule survives real work instead of being silently routed around. (Don't mint junk tokens
    like `--nudge-3` for one-offs.)
- **Variants via `cva`, conditional classes via the single `cn()`** from `ui/utils.js`. Never
  hand-concatenate class strings. `cva` is imported only inside `ui/` (variant defs live there).
  Standard variant vocabulary: `size: sm|md|lg`, `variant: primary|ghost|...` (see `_template.ui.jsx`).
- **Dark mode = `.dark` class only.** Never a JS `theme.palette.mode` branch (MUI-ism).

**Token manifest (`design-tokens.md`) — the written map, with rows filled:**

| canonical | light | dark | web-key | android-key |
|---|---|---|---|---|
| `accent-ui` | `#1A9E5F` `[ASSUMPTION]` | `#42D392` | `--accent-ui` | `accent_ui` |
| `surface-2` | `#EEF0F2` `[ASSUMPTION]` | `#1C1F23` | `--surface-2` | `surface_2` |

- **`web-key` = the CSS variable name only** (`--surface-2`). The Tailwind utility is auto-derived
  by `@theme` and is **not** recorded in the manifest (one cell, one meaning).
- **`[ASSUMPTION]` values are implemented as-is, with the same marker left as a code comment — do
  not block.** The manifest value is the single source of truth (manifest-first).
- **Accent sub-token decision table — branch on *what is being painted*, not on component type:**

  | Painting | Token | Contrast target |
  |---|---|---|
  | Read text / informational icon | `accent-text` | 4.5:1 |
  | UI outline: border, divider, focus ring | `accent-ui` | 3:1 |
  | Foreground **on top of** an accent background | `accent-on-surface` | 4.5:1 |

  Rule of thumb: **foreground over an accent background → always `accent-on-surface`; otherwise pick
  by "text vs outline."** (e.g. a primary button's label sits on the fill → `accent-on-surface`.)

**Data formats:** consume the logic layer's notification object shape as-is (don't reshape in
components). Timestamps via the existing i18n/date helpers, not re-implemented.

### Communication Patterns

**State management:**
- **Data** (notifications, subscriptions, prefs) is read with `useLiveQuery` — **never copied into
  Context/component state.** Dexie is the single source of truth. (Enforced: `contexts/` may not
  import `useLiveQuery`.)
- **Cross-cutting UI state** uses the Context trio `XxxContext` + `XxxProvider` + `useXxx()`, with
  `SCREAMING_SNAKE` action-type constants and immutable reducer updates. Providers use a reducer,
  not `useState` (enforced per-file). `useXxx()` throws if used outside its Provider (template).
- **`SelectionContext` is a derived selector over the router** (`useParams`/`useSearchParams`) —
  **no local `selectedId` state** (enforced: no `useState`/`useRef` in that file). URL
  (`/:topic/:msgId`) is the source of truth; desktop pane + mobile route read the same param,
  split by CSS breakpoint.
- **Connection** is mapped from logic-layer listeners in `hooks.js` into the `state × hasData`
  model; components read it via `useConnection()`, never by calling `ConnectionManager` directly.

**Optimistic publish queue (reconciliation rule, made explicit):**
- States `sending → queued → failed`. The in-flight queue lives in the `PublishQueueContext`
  reducer (**memory**); the published message persists to Dexie **only on server ack**, at which
  point it leaves the queue and the Dexie row (via `useLiveQuery`) is the surviving record.
- Retry is idempotent (re-send by the same client-side action id). A `failed` entry stays in the
  memory queue (with retained form content) until retried or dismissed — it is **not** written to
  Dexie. mute / action-button = optimistic update + revert-on-failure (no queue, no ledger).

### Process Patterns

**One state vocabulary, demoted into a component:**
- All feed/detail data surfaces render through a single **`<DataBoundary loading empty error>`**
  wrapper that owns the branch logic, so two agents can't choose differently:
  - **loading (no cache):** 4–6 `Skeleton` cards matching layout. With cache: render cached feed
    immediately, no spinner over existing data.
  - **empty:** `StatePanel` (centered tinted icon tile + title + one line + one action). `StatePanel`
    is a **slot that can fill an empty surface**, covering `no-data`, `filtered-empty` (data exists,
    filter yields 0), and connection-empty with one mechanism — not a hard "replace the surface."
  - **error:** inline, reassuring, always with the way out (재시도 / 설정 열기). Action/publish
    failures report inline on the card ("실패 — 재시도"). Never a full-screen dead end.
- **Connection states** show as the non-intrusive top strip whenever `hasData` is true; the
  `StatePanel` colorways (`not-connected | connecting | no-subscriptions | no-messages`) take the
  surface only when there's nothing to show.
- **Renderer failure:** the 2-level ladder degrades (rich → raw); a failed sub-element (bad meter
  value, broken image) is dropped, the card survives.
- **Motion:** calm fade/slide on new cards, all gated on `prefers-reduced-motion`.
- **a11y:** Radix handles dialog/menu/sheet focus + Esc; route-detail moves focus to its heading;
  `aria-live` announces new notifications + connection changes.

### Enforcement Guidelines

**Machine-detectable rules → ESLint (turn these on; don't leave as prose):**
- `eslint-plugin-i18next` `no-literal-string` (incl. `aria-label`/`title`).
- `eslint-plugin-tailwindcss` `no-arbitrary-value` + a raw-hex restriction; both allow the
  `/* layout-nudge */` escape. CI-failing.
- `eslint-plugin-import` `no-restricted-paths`: zone-block `src/app/` → `src/components/`; ban
  `react` imports in `src/app/`; single exception `Notifier.js`→`routes.js`.
- Per-file `no-restricted-syntax`: ban `useState` in Provider files; ban `useState`/`useRef` in
  `SelectionContext.jsx`; ban `useLiveQuery` import in `contexts/`; ban `cva` import outside `ui/`.

**Judgment rules → demote to code structure (no prose enforcement):**
- `<DataBoundary>` wrapper (loading/empty/error branching).
- `_template.context.jsx` / `_template.ui.jsx` (Context + primitive shape, variant vocabulary).
- `ui/utils.js` as the only home of `cn`/`cva`; `message/` as the only home of domain renderers.

**Tokens:** `src/styles/tokens.css` is the **web source of truth**; `@theme` references the vars
(no hex re-entry → web is single-source without a generator). **Android is the only hand-synced
target** (1-way, via the `design-tokens.md` table + the `-`→`_` rule). A ~20-line diff-linter is
added **only if** web↔Android drift is ever observed. (No codegen build step — overkill for a
single maintainer; consensus over Amelia's codegen push.)

### Pattern Examples

**Good:**
```jsx
// src/components/ui/Button.jsx
import { cva } from "class-variance-authority";
import { cn } from "./utils";
const button = cva("rounded-sm font-semibold", {
  variants: { variant: { primary: "bg-button-fill text-button-fill-text", ghost: "border border-border text-muted bg-transparent" } },
  defaultVariants: { variant: "primary" },
});
const Button = ({ variant, className, ...props }) => (
  <button className={cn(button({ variant }), className)} {...props} />
);
```

**Anti-patterns:**
```jsx
function Button(props) { ... }                  // ✗ arrow function only
<div className="bg-[#16181B] mt-[13px]" />      // ✗ raw hex / arbitrary px — use tokens (or /* layout-nudge */ for a one-off px)
<button>구독</button>                            // ✗ hardcoded string — t("subscribe_button_confirm")
const [selectedId, setSelectedId] = useState()  // ✗ selection derives from the URL
theme.palette.mode === "dark" ? ... : ...       // ✗ MUI-ism — .dark class + tokens
const data = useState(useLiveQuery(...))         // ✗ never copy Dexie into state
// AdaptiveCard.jsx placed in src/components/ui/  // ✗ domain-aware → src/components/message/
```

## Project Structure & Boundaries

> Revised after the structure review: folders earn their keep only when a rule or a frequent
> "where is this?" lookup justifies them. Kept three — `ui/` (ESLint-enforced domain boundary),
> `contexts/` (state lookup), `message/` (the domain target that `ui/` is forbidden to import).
> `shell/` and `feed/` collapse to flat components. Empty-promise folders (`__tests__/`,
> `lib/(maybe)`, standalone `_template.*` files) are dropped — the first-built primitive/Context is
> the reference (this supersedes the `_template.*` mention in the Patterns section).

### Complete Project Directory Structure

Legend: `[keep]` · `[rebuild]` MUI→Tailwind · `[remove]` · `[new]`.

```
ntfy-web/
├── index.html                      [rebuild] + inline FOUC script (system via matchMedia, pre-paint)
├── package.json                    [rebuild] +tailwindcss/@tailwindcss/vite, radix-ui, cva, clsx,
│                                              tailwind-merge, lint plugins; −@mui/*,@emotion/*,stylis*
├── vite.config.js                  [rebuild] +@tailwindcss/vite; +resolve.alias '@'→'./src';
│                                              DROP index.html→app.html rename
├── jsconfig.json                   [new]     "@/*"→"./src/*" (editor IntelliSense only — see boundaries)
├── .eslintrc                       [rebuild] prune RTL/MUI; +no-literal-string,
│                                              tailwindcss/no-arbitrary-value(+/* layout-nudge */ escape),
│                                              no-restricted-paths(app↔components), import/resolver vite,
│                                              per-DIRECTORY no-restricted-syntax (glob, not filename)
├── design-tokens.md                [new]     canonical web↔Android manifest (doc, not structure)
├── public/
│   ├── config.js                   [keep]    runtime server URL/auth + feature flags
│   ├── sw.js                       [rebuild] navigateFallback/createHandlerBoundToURL → index.html
│   └── static/{fonts,images,langs,css}       [rebuild fonts/css for variable fonts; keep images/langs]
└── src/
    ├── index.jsx                   [keep]    entry + registerSW
    ├── styles/main.css             [new]     @import "./tokens.css"; THEN @import "tailwindcss";
    ├── styles/tokens.css           [new]     @theme { --token: … } block = WEB SOURCE OF TRUTH
    │                                          (values live INSIDE @theme so utilities generate)
    ├── config/migration.js         [new]     per-area cutover flags: export const NEW = {...}
    ├── app/                        [keep]    — PRESERVED LOGIC LAYER (no React/UI imports) —
    │   ├── Connection.js ConnectionManager.js Poller.js     [keep] WS + poll
    │   ├── db.js SubscriptionManager.js Pruner.js           [keep] Dexie persistence
    │   ├── Api.js UserManager.js Session.js                 [keep] auth plumbing
    │   ├── Notifier.js                                      [keep] notifications (→routes.js)
    │   ├── Prefs.js i18n.js emojis.js emojisMapped.js       [keep]
    │   ├── actions.js errors.js events.js utils.js          [keep]
    │   ├── notificationUtils.js config.js VersionChecker.js [keep]
    │   ├── format.js                                        [new] pure formatters (joins app/, no new lib/ folder)
    │   ├── AccountApi.js                                    [remove]
    │   └── (characterization tests co-located as *.test.js when added — no standing __tests__/)
    └── components/
        ├── App.jsx                 [rebuild] layout; decides DetailPane host (split vs Sheet)
        ├── AppProviders.jsx        [new]     provider order codified in code (Theme→Connection→Selection→PublishQueue)
        ├── routes.js               [rebuild] prune login/signup/account; keep /:topic, /:baseUrl/:topic, /:topic/:msgId
        ├── hooks.js                [rebuild] connection listener glue + useActiveTopic() single entry
        ├── ui/                     [new]    domain-IGNORANT primitives (knows shapes, not words)
        │   ├── utils.js                       cn() + cva re-export (style helpers ONLY)
        │   ├── Button Dialog Sheet Menu Popover Switch Tabs Tooltip
        │   ├── Chip Meter Card Skeleton
        │   ├── DataBoundary.jsx                loading/empty/error branch mechanism
        │   └── StatePanel.jsx                  props-only shell (icon/title/desc/action) — no domain words
        ├── contexts/               [new]    cross-cutting STATE only (no useLiveQuery import)
        │   ├── ConnectionContext.jsx           state × hasData + debounce (from hooks.js)
        │   ├── SelectionContext.jsx             derived from router (no useState/useRef)
        │   ├── ThemeContext.jsx                 .dark + matchMedia + Prefs/localStorage
        │   └── PublishQueueContext.jsx          sending/queued/failed (memory; Dexie on ack)
        ├── message/                [new]    domain-AWARE (the ESLint import target ui/ may not touch)
        │   ├── NotificationCard.jsx  CardBody.jsx (rich→raw ladder)
        │   ├── PriorityBadge.jsx TopicChip.jsx TagChip.jsx AttachmentBox.jsx
        │   ├── MarkdownContent.jsx              useRemark + Tailwind prose (re-point component map)
        │   └── EmptyStates.jsx                  fills ui/StatePanel with no-subscriptions/no-messages copy
        ├── Feed.jsx                [new]     all + per-topic, infinite scroll, sticky header
        ├── DetailPane.jsx          [new]     renders selected message BODY only (host decides split/Sheet)
        ├── Sidebar.jsx BottomNav.jsx AppBar.jsx ConnectionIndicator.jsx PublishFab.jsx [new] (flat chrome)
        ├── Messaging.jsx PublishDialog.jsx SubscribeDialog.jsx [rebuild] → ui/Dialog,ui/Sheet
        ├── SubscriptionPopup.jsx PopupMenu.jsx                 [rebuild] → ui/Menu
        ├── Preferences.jsx Pref.jsx                            [rebuild] settings
        ├── EmojiPicker.jsx ActionBar.jsx                       [rebuild]
        ├── AvatarBox.jsx AttachmentIcon.jsx DialogFooter.jsx   [rebuild→ui/ or message/]
        ├── ErrorBoundary.jsx                                   [keep] plain React
        ├── Login.jsx                                           [rebuild] only if config.require_login
        ├── Navigation.jsx Notifications.jsx                    [remove after migrating to Sidebar/Feed]
        ├── styles.js theme.js RTLCacheProvider.jsx             [remove] Emotion/MUI/RTL
        └── Account.jsx Signup.jsx UpgradeDialog.jsx Reserve*.jsx [remove] feature trim
```

### Architectural Boundaries

- **Logic ↔ Presentation:** `src/app/` imported by presentation, never the reverse. Only sanctioned
  `app→components` edge: `Notifier.js`→`routes.js`. Enforced by `no-restricted-paths` + `react`-import
  ban in `src/app/`.
- **Primitive ↔ domain:** `ui/` may not import `message/` (or any domain module) — ESLint
  `no-restricted-paths` zone. `ui/` knows shapes, not words; domain copy/colorways live in
  `message/EmptyStates.jsx`, not in `ui/StatePanel.jsx`.
- **Data:** Dexie is the single source of truth; read via `useLiveQuery` only; `contexts/` may not
  import `useLiveQuery` (enforced).
- **Active selection:** `SelectionContext` (derived from the router) is the sole authority for "which
  topic/message is active"; both `Sidebar` and `Feed` read it via `useActiveTopic()` — neither
  re-derives selection from Dexie. Dexie is authority for *data*, Selection for *what's selected*.
- **Connection:** listener interface wired once in `hooks.js`; UI reads via `useConnection()`.
- **Provider order (codified, not documented):** `AppProviders.jsx` composes Theme → Connection →
  Selection → PublishQueue. Theme outermost (pre-paint class already set by the `index.html`
  script); Connection needs the logic layer ready; Selection/PublishQueue depend on Connection.
- **Detail display form:** `DetailPane` renders body only; the layout host (`App.jsx`) decides
  desktop split-pane vs mobile `ui/Sheet`, so `feed`-level code never reaches into chrome.
- **No backend/API boundary changes.**

### Migration cutover (notation is not the source of truth)

`src/config/migration.js` holds per-area flags (`export const NEW = { shell:false, feed:false,
detail:false, dialogs:false, settings:false }`). `App.jsx`/`routes.js` switch old↔new by flag, so
the live cutover is one citable line in git. **Old files are deleted in a separate follow-up PR**
after the flag has flipped and survived one cycle on `main`. Cleanup story removes MUI/Emotion/RTL
once every flag is `true`.

### Requirements → Structure Mapping

| Screen / story | Lives in |
|---|---|
| SC1 App shell (US13) | `App.jsx`, `AppProviders.jsx`, `Sidebar.jsx`, `AppBar.jsx`, `BottomNav.jsx` |
| SC2 Feeds (US3,US4) | `Feed.jsx` + `message/NotificationCard.jsx` |
| SC3 Detail (US5,US10) | `DetailPane.jsx`, `message/CardBody.jsx`, `message/MarkdownContent.jsx`, `ActionBar.jsx` |
| SC4 Subscribe (US2) | `SubscribeDialog.jsx` → `ui/Dialog`/`ui/Sheet` |
| SC5 Publish (US8) | `Messaging.jsx`/`PublishDialog.jsx` + `contexts/PublishQueueContext.jsx` + `PublishFab.jsx` |
| SC6 Settings (US1,US7,US11,US15) | `Preferences.jsx`/`Pref.jsx`, `Login.jsx` (conditional) |
| SC7 States (US14) | `ui/DataBoundary.jsx` + `ui/StatePanel.jsx` + `message/EmptyStates.jsx` |
| US6 priority | `message/PriorityBadge.jsx` + accent bar in `NotificationCard.jsx` |
| US9 manage subs/status | `Sidebar.jsx`, `ConnectionIndicator.jsx`, `SubscriptionPopup.jsx` |
| US12 PWA/notif | `public/sw.js`, `app/Notifier.js` (preserved) |

### Integration Points & Data Flow

- **Inbound (live):** server → `Connection.js` (WS) → `messageListener` (`hooks.js`) →
  `SubscriptionManager` → Dexie → `useLiveQuery` → `Feed`/`NotificationCard`. Poll: `Poller.js` →
  `SubscriptionManager.addNotifications` → Dexie (same sink; dedup `&id`, order `sequenceId`).
- **Outbound (publish):** `PublishQueueContext` (optimistic, memory) → `Api.js` → server; on ack →
  Dexie row survives, queue entry clears.
- **Notifications:** Dexie write → `Notifier.js` → browser/SW (per-topic mute) → click →
  `routes.forSubscription` → in-app nav.
- **External:** ntfy server (HTTPS via Cloudflare Tunnel) only.

### Build config that must match the structure (else it silently breaks)

- **`@/*` alias in two places**, not just jsconfig: Vite `resolve.alias { '@': './src' }` (runtime)
  + ESLint `import/resolver: vite` via `eslint-import-resolver-vite` (lint). jsconfig is editor-only.
- **`@theme` placement:** token values live **inside** the `@theme` block in `tokens.css`, and
  `@import "./tokens.css"` precedes `@import "tailwindcss"` in `main.css` — otherwise Tailwind
  utilities don't generate / tokens don't resolve.
- **Per-file ESLint guards use a directory/convention glob** (`contexts/*Context.jsx`), never a
  single filename (rename would silently drop the guard).

### Development / Build / Deployment

- **Dev:** `npm start` (Vite HMR :3000); `public/config.js` → dev/real server.
- **Build:** `npm run build` → static `build/` (Vite + `@tailwindcss/vite` + `vite-plugin-pwa`
  injectManifest). No `app.html` rename.
- **Deploy:** static host behind Cloudflare Tunnel; not embedded in the ntfy go-server.

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** The stack is internally consistent and current — React + Vite 6.4.2
(Node 25) + Tailwind v4 (`@tailwindcss/vite` 4.3.x, CSS-first `@theme`) + unified `radix-ui` + cva/
clsx/tailwind-merge, all JavaScript. No version conflicts; Tailwind v4's CSS-var `@theme` maps the
token system with zero glue, and Radix supplies the a11y primitives the WCAG-AA floor needs. The
preserved `src/app/` logic layer is verified free of MUI/Emotion/theme, so the UI-only swap carries
no hidden logic coupling beyond the two named seams.

**Pattern Consistency:** Patterns reinforce the decisions — token-only styling + `.dark` class
realize the theme decision; `useLiveQuery`-as-SoT + Context/`useReducer` realize the state decision;
URL-as-SoT selection realizes the cross-form-factor detail decision. Enforcement is matched to type
(ESLint for detectable rules, code structure — `DataBoundary`, `AppProviders`, `useActiveTopic` —
for judgment rules), so two agents converge.

**Structure Alignment:** The three-folder structure (`ui/` / `contexts/` / `message/` + flat
chrome) is exactly what the boundaries require: `ui/`-may-not-import-`message/` is enforceable, the
data/selection/connection authorities are single, and `AppProviders.jsx` codifies provider order
rather than leaving it implicit.

### Requirements Coverage Validation ✅

**User-story coverage:** All 15 user stories (US1–US15) map to concrete files (see Requirements →
Structure Mapping). All 7 screens (SC1–SC7) are placed.

**Success-criteria coverage:**
- S1 functional parity — preserved logic layer + unchanged API ✅
- S2 shared design system — token manifest + naming map + Android 1-way sync ✅
- S3 readability/WCAG-AA — accent sub-tokens + a11y floor; **light-theme AA contrast still
  unverified** (3 `[ASSUMPTION]` tokens) — tracked as a spike, non-blocking for the dark hero theme
- S4 visual quality — gated on Jay's subjective acceptance at implementation (cannot validate here)
- S5 Android adoption — token contract defined; downstream to the sister project

**NFR coverage:** real-time (WS+poll, preserved, dedup `&id`/order `sequenceId`) ✅; offline-first
(Dexie + SW, `app.html` fix) ✅; PWA ✅; responsive 3-form-factor ✅; standalone build ✅; i18n LTR ✅;
shared tokens ✅; theme FOUC-free (corrected `system` handling) ✅.

### Implementation Readiness Validation ✅

**Decision Completeness:** All critical decisions documented with verified versions; migration
strategy, state model, connection model, and FOUC handling are specified, not hand-waved.

**Structure Completeness:** Complete file tree with keep/rebuild/remove/new status, boundaries,
build-config requirements, and a flag-driven cutover mechanism.

**Pattern Completeness:** Naming, structure, format, communication, and process patterns defined
with good/anti examples and concrete enforcement.

### Gap Analysis Results

**Critical Gaps (block implementation):** None in the document. One **critical spike to run first**:
S1 (Emotion `@layer` coexistence) — the single result that could force a migration-strategy rethink.
It is the first implementation task, not a documentation gap.

**Important Gaps (non-blocking, resolve early):**
- Light-theme accent AA contrast unverified (`accent-light #1A9E5F` + derived light tokens) — verify
  text 4.5:1 and non-text 3:1 before the light theme ships (S2 is the FOUC matrix; add a contrast
  check).
- Characterization tests on `src/app/` (dedup + sequence ordering) are specified but not yet written
  — recommended before the UI swap.

**Nice-to-Have Gaps:** token drift diff-linter (deferred until drift appears); CI pipeline (deferred);
mobile card swipe gesture (`[ASSUMPTION]`); voice/tone microcopy + key flows (`[ASSUMPTION]`, from UX).

### Validation Issues Addressed

All issues raised across the Party Mode rounds were folded into the document: the migration is
Strangler with a flag-driven cutover; optimistic UI was scope-trimmed to a publish-only queue;
the card renderer is a 2-level ladder; the connection model is `state × hasData` with debounce;
FOUC handling evaluates `system` via `matchMedia`; the token contract gained a naming map + accent
decision table; the folder set was reduced from five to three; and ESLint/code-structure enforcement
replaced prose for the consistency rules.

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION — all 16 checklist items confirmed; no Critical Gaps.
The two important gaps (light-theme AA, characterization tests) are non-blocking and scheduled as
the first implementation tasks alongside the S1 spike.

**Confidence Level:** High — boundaries and key risks were verified empirically against the code,
not assumed (`src/app/` MUI-clean, `&id` idempotency, `sequenceId` ordering, Poller one-way flow,
`require_login` flag, `app.html` SW legacy).

**Key Strengths:** verified separation premise; current CSS-first token stack that maps 1:1 to the
design system; enforcement matched to rule type; scope disciplined to a single-user product.

**Areas for Future Enhancement:** light-theme token confirmation; token drift linter; optional CI;
Vitest+RTL test layer; the `[ASSUMPTION]` UX items (microcopy, swipe).

### Implementation Handoff

**AI Agent Guidelines:** follow the decisions and patterns exactly; respect the three boundaries
(logic↔presentation, ui↔domain, data/selection/connection authorities); use token classes only;
route strings through `t()`; read data via `useLiveQuery`.

**First Implementation Priority:** run spike **S1 (Emotion `@layer` coexistence)** and write the
`src/app/` characterization tests; then the foundation story — `npm i tailwindcss @tailwindcss/vite
radix-ui class-variance-authority clsx tailwind-merge`, wire `@tailwindcss/vite` + `resolve.alias`,
add `jsconfig.json`, create `styles/tokens.css` (+`main.css`), the `index.html` FOUC script, and the
`public/sw.js`/`vite.config.js` `app.html`→`index.html` fix.
