---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-ntfy-web-2026-06-20/prd.md
  - _bmad-output/planning-artifacts/prds/prd-ntfy-web-2026-06-20/addendum.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/EXPERIENCE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/reconcile-prd.md
project_name: ntfy-web
user_name: Jay
date: 2026-06-20
---

# ntfy-web - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for ntfy-web, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories. ntfy-web is a from-scratch UI redesign of the self-hosted ntfy web client — a presentation-layer rebuild (MUI → Tailwind v4 + Radix) that preserves the existing `src/app/` logic layer, with zero backend changes, for a single-user / single-server instance.

## Requirements Inventory

### Functional Requirements

FR1: Connect to the ntfy server using a configurable URL plus authentication (basic auth or `?auth=` token); credentials are stored and reused for subscriptions. (US1)
FR2: Subscribe to a topic by name; on success the topic appears in the sidebar and its feed opens. (US2)
FR3: Receive notifications in real time without refresh, via WebSocket (primary) with 5-minute HTTP poll fallback; new cards appear with a calm fade/slide. (US3)
FR4: Browse past notifications as an infinite-scroll feed — both per-topic (sticky header) and an "all topics" merged stream where a topic chip identifies each card's source. (US4)
FR5: Open a notification's detail showing full markdown body (~70ch), priority, tags, attachment preview/download, action buttons, source topic, and timestamp. (US5)
FR6: Make priority visually obvious — P4 "High" / P5 "Urgent" stand out via squared badge + colored left accent bar + position, never color alone. (US6)
FR7: Mute / unmute a topic; a muted topic still receives and stores notifications but suppresses sound + browser notification; state persists in IndexedDB. (US7)
FR8: Publish a message to a topic (topic, title, body, priority, tags) from a desktop Dialog or mobile bottom Sheet; send is optimistic. (US8)
FR9: Manage subscriptions — rename / clear / unsubscribe — and view live connection status. (US9)
FR10: Run a notification's action buttons (up to 3: view URL / http / broadcast); `view` opens the URL, `http`/`broadcast` fire inline and report result on the card without leaving the feed. (US10)
FR11: Switch theme between light / dark / system; choice persists in IndexedDB and toggles the `.dark` class; `system` tracks `prefers-color-scheme` live. (US11)
FR12: Work as an installable PWA with desktop/browser notifications fired from the service worker, respecting per-topic mute. (US12)
FR13: Provide a responsive layout comfortable on desktop (3-column), tablet (icon-rail), and mobile (top bar + bottom nav). (US13)
FR14: Present clear empty / error / connection states — not-connected, connecting, no-subscriptions, no-messages — each with a friendly line and a way out. (US14)
FR15: Provide per-topic and global settings — server URL + auth, theme, notification sounds, browser-notification permission, message retention/deletion policy. (US15)
FR16: Render the notification card body adaptively by content shape — paragraph (markdown free text), key-value rows, or rich key-value with inline meter bars — with a safe raw-text fallback. (Architecture / UX-D3)
FR17: Queue publishes optimistically (sending → queued → failed) in memory; persist to Dexie only on server ack; a failed entry retains form content for one-tap retry-in-place. (Architecture)
FR18: Show an unread indicator (accent dot on the leading edge) cleared on read; provide a per-card overflow menu (mark read / copy / delete). (UX / card anatomy)
FR19: Render a login UI only when the server reports `config.require_login` is true; otherwise auth is just stored settings. Remove account / signup / billing / plan / reserved-topic / token-management surfaces entirely. (Architecture §4.5 / feature trim)

### NonFunctional Requirements

NFR1: Real-time delivery uses WebSocket primary + 5-min HTTP poll fallback (NOT SSE); the connection logic in `Connection.js`/`ConnectionManager.js`/`Poller.js` stays functionally identical — presentation-only rebuild.
NFR2: Offline-first — Dexie/IndexedDB + service worker; the last-known feed renders immediately on cold open and history survives reload/offline.
NFR3: Accessibility — WCAG AA (≥4.5:1 body text) in both light and dark; priority conveyed by label + icon + position; keyboard/focus rebuilt on Radix; `aria-live` for arriving notifications + connection changes; `prefers-reduced-motion` honored.
NFR4: Shared design system — one token set is the source of truth, hand-synced 1:1 to web CSS vars and Android `colors.xml`/`dimens.xml`; the emerald `#42D392` accent is shared 1:1 with Android.
NFR5: PWA installable on all three form factors; SW serves the shell offline; browser notifications fire from the SW honoring per-topic mute.
NFR6: Responsive — three layouts (desktop 3-col / tablet icon-rail / mobile top-bar + bottom-nav) off one codebase; detail = right pane (desktop) vs full-screen route (mobile), one route param split by CSS breakpoint.
NFR7: Standalone static build behind Cloudflare Tunnel; must NOT embed in the ntfy server binary; runtime server URL/auth configurable (`public/config.js`).
NFR8: i18n via i18next retained; LTR / Korean only (RTL machinery dropped with MUI).
NFR9: No backend / API / transport changes; every request conforms to current ntfy endpoints, params, and auth. Single server assumed.
NFR10: Message dedup is idempotent by `&id` PK; feed ordering derives from `sequenceId` so a late poll row cannot visually rewind a newer WS row. Pinned by a characterization test before the rebuild.
NFR11: Markdown is XSS-safe — `react-remark` `useRemark` renders React elements (no `rehype-raw` / `dangerouslySetInnerHTML`); the remark plugin chain is kept verbatim.
NFR12: FOUC-free theme — an inline blocking script in `index.html` sets `<html class="dark">` pre-paint, evaluating `system` via `matchMedia`; the choice is mirrored to `localStorage` (per `Session.js`) with IndexedDB as the durable store.
NFR13: Readability — one body size (16px), line-height 1.5, detail markdown capped ~70ch, minimum legible text 14px, tabular-nums on meter percentages; calm motion only.
NFR14: Performance — self-host Plus Jakarta Sans + JetBrains Mono variable fonts (no CDN); route-level code splitting; MUI/Emotion bundle dropped at cleanup.

### Additional Requirements

(From Architecture — technical/infrastructure requirements that shape epics and story sequencing.)

- **Selected stack (greenfield-on-brownfield):** Tailwind CSS v4 (`@tailwindcss/vite`, CSS-first `@theme`, no PostCSS / no `tailwind.config.js`) + Radix UI primitives directly (no shadcn CLI) + `class-variance-authority` / `tailwind-merge` / `clsx`, all JavaScript. Add `jsconfig.json` with `@/*` → `./src/*` and a matching Vite `resolve.alias` + ESLint `import/resolver: vite`.
- **Foundation story (first):** install the stack, wire `@tailwindcss/vite` + alias, create `styles/tokens.css` (+ `main.css` with `@import "./tokens.css"` BEFORE `@import "tailwindcss"`), the `index.html` FOUC script, and the `public/sw.js` / `vite.config.js` `app.html` → `index.html` fix.
- **Preserve `src/app/` logic layer** untouched (no React/UI imports; only sanctioned edge is `Notifier.js` → `routes.js`). Re-wire connection listeners in `hooks.js`; preserve the `Notifier.js` notification-permission user-gesture call site.
- **Strangler migration** with per-area flags in `src/config/migration.js`; `App.jsx`/`routes.js` switch old↔new by flag; old files deleted in a follow-up PR after the flag survives one cycle on `main`; cleanup story removes MUI/Emotion/RTLCacheProvider/stylis-rtl — entry condition: last MUI route replaced.
- **Spikes (run before/early):** S1 Emotion `@layer` coexistence PoC (HIGH — only result that can force a rethink, runs first); S2 FOUC 3-state matrix; S3 Radix/MUI z-index stacking; S4 URL-as-SoT selection; S5 Dexie dedup + ordering characterization test.
- **Service-worker fix (required):** drop the `index.html` → `app.html` rename in `vite.config.js`; point `navigateFallback` / `createHandlerBoundToURL` at `index.html`; keep `skipWaiting` + `clientsClaim`.
- **Three-folder structure:** `src/components/ui/` (domain-ignorant Radix primitives), `src/components/contexts/` (cross-cutting state only), `src/components/message/` (domain-aware composites). `ui/` may not import `message/`.
- **Contexts:** `ConnectionContext` (state × hasData + debounce), `SelectionContext` (derived from router, no local `selectedId`), `ThemeContext` (.dark + matchMedia + Prefs/localStorage), `PublishQueueContext` (sending/queued/failed, memory; Dexie on ack). Provider order codified in `AppProviders.jsx`: Theme → Connection → Selection → PublishQueue.
- **Code-structure enforcement:** `<DataBoundary loading empty error>` wrapper owns branch logic; `StatePanel` props-only shell. ESLint rules: `no-literal-string` (incl. aria-label/title), `tailwindcss/no-arbitrary-value` + raw-hex restriction (with `/* layout-nudge */` escape), `no-restricted-paths` (app↔components, ui↔message), per-directory `no-restricted-syntax` (ban `useState` in Provider files, `useState`/`useRef` in `SelectionContext`, `useLiveQuery` in `contexts/`, `cva` outside `ui/`).
- **Token contract:** `src/styles/tokens.css` is the web source of truth; `design-tokens.md` is the canonical web↔Android manifest (`canonical | light | dark | web-key | android-key`, `-`→`_` rule). No generator; a ~20-line diff linter only if drift appears. Accent splits into `accent-text` / `accent-ui` / `accent-on-surface` for WCAG 1.4.11.
- **Characterization tests on `src/app/`** (dedup + sequence ordering) recommended before the UI swap; Vitest + RTL adoption deferred otherwise. CI/CD deferred (single `vite build` → static host step).

### UX Design Requirements

(From DESIGN.md + EXPERIENCE.md — first-class inputs, extracted with FR-level rigor. The spines win on any conflict with a mock.)

UX-DR1: Implement the token system in `tokens.css` — full color ramp (dark hero + light counterpart), type scale, 4px spacing scale, radius set, and soft/low elevation — exactly per DESIGN.md frontmatter.
UX-DR2: Build the hero notification card — header band (priority badge + title + trailing bell/mute + overflow ⋯ + unread dot, 1px divider), the signature squared-left accent bar (`0 16px 16px 0`, 4px coral/amber, dark-only glow), elev-1 resting / elev-2 hover, whole card tappable.
UX-DR3: Build the adaptive card body renderer — three forms (paragraph / key-value rows / rich key-value with leading mono icon + inline meter), picked by content shape, never user-toggled.
UX-DR4: Build the meter bar component — track / green-ok → amber (≥65% warning) → coral (≥90% critical) fill, 7px height, pill radius, tabular-nums percentage that tints coral at critical.
UX-DR5: Build the chip set — squared solid priority badge (radius 6px, uppercase 800-weight), soft emerald-tinted topic chip (pill), outlined tag chip; the squared-vs-pill contrast is load-bearing for color-blind safety.
UX-DR6: Build the button system — achromatic white-fill primary + neutral ghost secondary; green is NEVER a button color except the single publish FAB.
UX-DR7: Build the desktop sidebar/nav — gray active surface (not colored) + green leading dot, hover = surface, green "＋ 토픽 구독" add action; collapses to an icon-rail on tablet.
UX-DR8: Build the mobile bottom nav — 3 items (구독 / 전체 / 설정), active item green.
UX-DR9: Build the mobile publish FAB (the one green button) → bottom Sheet with segmented priority chips (selected = priority-colored outline + tint).
UX-DR10: Build the settings layout — left icon-nav (gray active) with 5 sections (일반 / 서버·인증 / 모양·테마 / 알림·소리 / 보존·삭제), sectioned form with divider + hint per heading, segmented theme control, toggles ON = green, dark-fill selects, white "설정 저장" button.
UX-DR11: Build the empty / connection state panels — centered single-tone icon in a tinted rounded-square tile + title + one line + one action, in 4 colorways: not-connected (coral) / connecting (amber pulse) / no-subscriptions (green + ＋토픽 CTA) / no-messages (muted).
UX-DR12: Apply the Voice & Tone microcopy — Korean 해요체, friendly/calm, reassuring errors (point at situation + next move, never blame), verbs on buttons, quiet success. `[ASSUMPTION]` — drafted for Jay's review.
UX-DR13: Build the detail display — desktop right-side pane (selected card = brighter surface, NOT a colored border; feed stays live), mobile full-screen route with back button + sticky bottom action bar; one route param split by CSS breakpoint.
UX-DR14: Build the skeleton loading state — 4–6 placeholder cards matching card layout when there is no cache; cached feed renders immediately with no spinner over existing data.
UX-DR15: Implement the Accessibility Floor behaviors — Radix focus trap/restore/Esc on dialogs/menus/sheets, route-detail focus move to heading, `aria-live` for new notifications + connection changes, `prefers-reduced-motion`, roles + state on every interactive element, focus ring via `focus-ring` token.
UX-DR16: Self-host the variable fonts — Plus Jakarta Sans (UI) + JetBrains Mono (code/values), Roboto fallback; no CDN.
UX-DR17: Mobile card swipe gesture — horizontal swipe reveals 읽음 표시 / 삭제 (delete confirmed), tap remains primary. `[ASSUMPTION]`.
UX-DR18: Attachment behavior in card + detail — image thumbnail or file chip (name/size), tap → open/download; `surface-muted` bg, `radius-sm`. (Carried from PRD §3.4; flagged in reconcile as not yet a standalone component row.)

### FR Coverage Map

| FR | Primary Epic | Notes |
|----|--------------|-------|
| FR1 connect (URL + auth) | E2 | First-run auth entry establishes the connection; the broader settings editor is FR15/E5. |
| FR2 subscribe to topic | E2 | First subscribe is Flow 1's climax; `SubscribeDialog` is built here and reused in E4. |
| FR3 real-time receive | E3 | WS + poll surfaced via `hooks.js` listeners. |
| FR4 feeds / history | E3 | Per-topic + merged "all" feed, infinite scroll. |
| FR5 detail | E3 | Detail pane (desktop) / full-screen route (mobile) — unified with the card per party-mode. |
| FR6 priority | E3 | Badge + accent bar + position. |
| FR7 mute / unmute | E4 | Per-topic; surfaced on card header bell + sidebar + settings. |
| FR8 publish | E4 | Dialog (desktop) / FAB + Sheet (mobile). |
| FR9a connection status | E2 | Live connection indicator (split from FR9 per party-mode — one ID, one meaning). |
| FR9b manage subscriptions | E4 | rename / clear / unsubscribe. |
| FR10 action buttons | E3 | Inline `view` / `http` / `broadcast`, report on card/detail. |
| FR11 theme | E2 | Light/dark/system, FOUC-free `.dark` toggle. |
| FR12 PWA + browser notifications | E5 | Notifications + permission UI; the SW `app.html`→`index.html` fix lands in E1. |
| FR13 responsive | E2 | 3-form-factor shell; spans all epics but the shell is owned here. |
| FR14 states | E2 + E3 | not-connected/connecting/no-subscriptions = E2 (born with first-run); no-messages = E3 (feed). State *voice* defined in E1 design system. |
| FR15 settings surface | E5 | Full sectioned settings (server/auth editor, sounds, permission, retention/deletion). |
| FR16 adaptive card body | E3 | paragraph / key-value / rich key-value + meter; raw fallback. |
| FR17 publish queue | E4 | Optimistic sending→queued→failed; card pending/error slots designed in E3. |
| FR18 unread + overflow | E3 | unread dot + overflow (읽음/복사/삭제) — single home after Feed+Detail merge. |
| FR19 conditional login + feature trim | E2 + E5 | Conditional login UI = E2; account/billing/reserved screen *removal* completes at E5 cleanup. |

All 19 FRs are mapped. Multi-epic entries (FR9/FR13/FR14/FR19) are cross-surface capabilities with a single primary owner and a noted earlier/later sub-delivery — not split decomposition.

## Epic List

### Epic 1: Foundation & Design System  *(enabler — risk-gated)*
De-risk the rebuild and lay its foundation: run the migration-gating spike **S1 (Emotion `@layer` coexistence) as a blocking lead story** — no `ui/` primitive work begins until S1 is GREEN — then S2–S5, pin `src/app/` with characterization tests (dedup `&id` + `sequenceId` ordering), install the Tailwind v4 + Radix stack, encode the design tokens as the single source of truth (`tokens.css` + `design-tokens.md` manifest), self-host the fonts, fix the SW `app.html`→`index.html` + FOUC issues, and build the domain-ignorant `ui/` primitives **including the loading/empty/error component voices** (`Skeleton`, `DataBoundary`, `StatePanel`) so states are born with the design system, not bolted on later.
**FRs covered:** (enabler — no direct user FR) · NFR4, NFR10, NFR11, NFR12, NFR14 · UX-DR1, UX-DR16, UX-DR15 (focus-ring token) · S1–S5, SW fix

### Epic 2: First Run — Jay Gets In  *(Flow 1 vertical slice)*
Jay walks from a dead screen to a live, subscribed feed in four taps. Delivers the responsive app shell (desktop sidebar / tablet icon-rail / mobile top-bar + bottom-nav), the FOUC-free theme switch, the cross-cutting contexts (Theme → Connection → Selection → PublishQueue), the live connection indicator, the auth/conditional-login entry, the first `SubscribeDialog`, and the not-connected / connecting / no-subscriptions states **wearing their real Korean voice**. After this epic the product is enterable and demoable end-to-end for onboarding.
**FRs covered:** FR1, FR2, FR11, FR13, FR19 (conditional login), FR9 (connection-status indicator), FR14 (connection + no-subscriptions states) · UX-DR7, UX-DR8, UX-DR11 (connection/no-subs colorways), UX-DR12 (voice) · NFR1, NFR8

### Epic 3: Notification Experience — Receive · Read · Act  *(hero; Flow 2)*
The heart of the product, kept as one heartbeat: a notification arrives in real time, Jay reads it, and he acts on it without ever leaving the moment. Delivers real-time receive into both feeds (per-topic + merged "all", infinite scroll, skeleton/no-messages), the hero adaptive notification card (priority badge + squared-left accent bar, adaptive body with meters/chips, unread dot, **pending/error slots designed in from the start**), and — in the **same** epic — tap→detail (desktop right-pane / mobile full-screen route), full markdown, attachment view/download, inline action buttons, and the overflow menu (읽음/복사/삭제).
**FRs covered:** FR3, FR4, FR5, FR6, FR10, FR16, FR18, FR14 (no-messages state) · UX-DR2, UX-DR3, UX-DR4, UX-DR5, UX-DR13, UX-DR14, UX-DR17, UX-DR18 · NFR2, NFR3 (priority-by-label, aria-live), NFR9, NFR13

### Epic 4: Topics & Publishing — Jay Sends  *(Flow 3)*
Jay controls which topics he follows and sends his own messages. Delivers subscription management (rename / clear / unsubscribe), per-topic mute/unmute (card bell + sidebar + settings), and publishing — desktop `Dialog` / mobile green FAB → bottom `Sheet` — backed by the optimistic publish queue (sending → queued → failed, retry-in-place) that never loses a message on a weak signal.
**FRs covered:** FR7, FR8, FR9 (manage subs), FR17 · UX-DR6 (button system), UX-DR9 (FAB + sheet + segmented priority) · NFR3 (focus/keyboard on dialogs)

### Epic 5: Settings, PWA & Migration Cleanup  *(closeout — gated)*
The configuration tail and the rebuild's end. Delivers the full sectioned settings surface (서버·인증 editor, 모양·테마, 알림·소리, 보존·삭제), PWA browser/desktop notifications honoring per-topic mute, and the not-connected/error states' final polish — then the **gated cleanup**: remove MUI / Emotion / RTLCacheProvider / stylis-rtl and the trimmed account/billing/reserved screens. **Cleanup entry condition: every migration flag is `true` (last route migrated) and has survived one cycle on `main`** — a separate go/no-go from feature completion.
**FRs covered:** FR12, FR15, FR19 (account-screen removal) · UX-DR10 (settings layout), UX-DR15 (a11y verification pass) · NFR5, NFR7 · Additional: MUI/Emotion/RTL cleanup, ESLint full enforcement, token-drift linter (only if drift observed)

## Story-Creation Guardrails  *(party-mode consensus — carry into Step 3)*

These do not change the epic structure; they are the quality rules story creation must honor.

**Cross-cutting ownership (Mary).** Flow-based epics leave horizontal quality attributes ownerless. Fix by **dual-binding: E1 is the primary owner; each flow epic inherits an AC**:
- **NFR3 accessibility** — E1 owns a "primitive a11y contract" (focus-trap on Dialog/Sheet/Menu, ARIA `aria-live` for arriving notifications + connection changes, `prefers-reduced-motion`, focus-ring token). E2/E3/E4 each carry a "this surface passes a11y" AC.
- **FR14 states** — `ui/StatePanel` + `ui/DataBoundary` (built in E1) are the **structural owner**; each epic is a *consumer*, not a re-implementer.
- **NFR2 offline** — SW (E1) + optimistic queue (E4) + PWA (E5); E5 closeout carries the integrated "behaves offline" verification AC.
- **NFR4 token parity** — defined E1, **verified per flag-flip** (each epic DoD) + final parity gate in E5.
- **[ASSUMPTION] UX-DRs** — DR12 voice (E1 owns copy as a single-source like tokens), DR17 swipe (E3 or explicit scope-out), light-theme contrast (E1 define + each a11y AC). Confirm or scope-out with Jay before/at story time.

**Enabler AC shapes (Paige).** E1 mixes three "done" shapes — do not force all into Given/When/Then:
- **Spike → Decision Record:** the open questions, the decision, rejected alternatives, and the constraint it places on later epics. **S1's AC must name which decision unblocks E3's adaptive card.**
- **Characterization test → Behavioral Snapshot:** pre-swap behavior captured as a passing test; same input → same output after migration.
- **Primitive → Given/When/Then** + a separate AC line for Korean **voice** copy.
- **Glossary to fix before stories:** single-source tokens (file vs format), primitive vs component boundary, characterization scope (visual vs behavioral), voice (tone vs literal strings), gated (who/what signal), optimistic-queue rollback policy.

**Implementer guardrails (Amelia) — G1–G6:**
- **G1** BLOCKING stories (`E1` S1 spike, S2 characterization) state in their AC: "successor entry condition = this story GREEN."
- **G2** each story header estimates touched files + new LOC; split if it risks exceeding one dev-agent context. **Primitive grouping rule (revised): 1–2 unrelated primitives per story, OR up to ~4 that share one implementation pattern (e.g. Radix overlays)** — the real cap is the dev-agent context, not the count. Stories 1.6 (3), 1.7 (5), 1.8 (4) bundle cohesive sets under this rule; **Story 1.7 (5 Radix overlays) is the outlier — split into overlay-core (Dialog/Sheet/Menu) + overlay-aux (Popover/Tooltip) if context pressure appears at implementation.**
- **G3** every story carries a `Depends-on:` line; no undeclared cross-story imports; bidirectional dependency → merge the stories.
- **G4 (card slot contract)** E3's adaptive-card story AC fixes the pending/error slot prop types + a GREEN empty-slot render test. **E4 injects data only — no card signature edits** (kills E3↔E4 churn).
- **G5** E5 cleanup entry AC asserts every migration flag `=== true` **in code**, not prose; survived one cycle on `main`.
- **G6** red-green-refactor; characterization tests stay GREEN through every refactor — if one breaks, that story stops.

---

## Epic 1: Foundation & Design System

De-risk the rebuild and lay its foundation so every later epic composes proven primitives against a stable, theme-correct, offline-correct base. The migration-gating spike runs first as a blocking lead story; no `ui/` primitive work begins until it is GREEN. Enabler stories use the AC shapes agreed in party-mode: **Decision Record** for spikes, **Behavioral Snapshot** for characterization tests, **Given/When/Then** for primitives (with a separate voice-copy line).

### Story 1.1: Spike — Emotion `@layer` coexistence PoC  *(SPIKE · BLOCKING lead)*

As the rebuild team,
I want to prove that legacy MUI/Emotion styles and new Tailwind v4 utilities can coexist on one page with predictable precedence,
So that the Strangler migration strategy is validated before any primitive is built on it.

`Depends-on:` none. **Touched:** throwaway PoC branch (Emotion CacheProvider + a Tailwind utility on a shared page). **Est:** spike, decision-only.

**Acceptance Criteria** *(Decision Record shape — output is a decision, not shipping code)*

**Given** the existing MUI/Emotion stack and a Tailwind v4 `@layer`-based build,
**When** Emotion's cache is pushed into an `@layer` via its CacheProvider and a Tailwind utility competes with an MUI `sx` rule on the same element,
**Then** a Decision Record is produced stating whether coexistence holds, the chosen layering approach, rejected alternatives, and the explicit precedence rule the migration will rely on.
**And** the Record names the entry condition it unblocks: *"S1 GREEN ⇒ `ui/` primitive stories (1.6–1.9) and all flow epics may begin"* (G1).
**And** if coexistence does NOT hold, the Record documents the migration-strategy rethink required and this epic halts pending re-plan.

### Story 1.2: Characterization snapshot — message dedup & ordering  *(CHARACTERIZATION · BLOCKING)*

As the rebuild team,
I want the current `src/app/` notification dedup and ordering behavior pinned by automated tests,
So that the presentation rebuild cannot silently regress the data layer (NFR10).

`Depends-on:` none (independent of 1.1). **Touched:** `src/app/*.test.js` (new), Vitest config. **Est:** test-only, no `src/app/` source changes.

**Acceptance Criteria** *(Behavioral Snapshot shape)*

**Given** the existing Dexie schema (`notifications` keyed `&id`, `[subscriptionId+sequenceId]` index),
**When** the same message id is inserted twice,
**Then** a passing test asserts the row count stays 1 (idempotent upsert).
**And** **Given** a late-arriving poll row with a lower `sequenceId` than an existing WS row, **When** the feed query runs, **Then** a passing test asserts feed order derives from `sequenceId` and the newer row is not visually rewound.
**And** these tests are the entry gate for any feed/card story (G1) and must stay GREEN through every later refactor (G6).

### Story 1.3: Install UI stack and wire Tailwind v4 + path aliases

As a developer,
I want the Tailwind v4 + Radix stack installed and wired into the existing Vite build,
So that subsequent stories can author components against it.

`Depends-on:` 1.1 (S1 GREEN). **Touched:** `package.json`, `vite.config.js`, `jsconfig.json` (new), `src/styles/main.css` (new). **Est:** config, small.

**Acceptance Criteria**

**Given** the existing Vite 6 project,
**When** `tailwindcss` + `@tailwindcss/vite` + `radix-ui` + `class-variance-authority` + `clsx` + `tailwind-merge` are installed and `@tailwindcss/vite` is added to `vite.config.js`,
**Then** `npm run build` and `npm start` succeed with no MUI removed yet (coexistence intact).
**And** `@/*` resolves to `./src/*` in three places: Vite `resolve.alias`, `jsconfig.json`, and the ESLint `import/resolver: vite`.
**And** `src/styles/main.css` imports `./tokens.css` BEFORE `tailwindcss` so utilities generate from tokens.

### Story 1.4: Design tokens as single source + web↔Android manifest

As the design-system owner,
I want all tokens defined once in `tokens.css` and mirrored in a `design-tokens.md` manifest,
So that web styling is single-source and the Android sister app has a 1:1 reference (NFR4).

`Depends-on:` 1.3. **Touched:** `src/styles/tokens.css` (new), `design-tokens.md` (new). **Est:** medium.

**Acceptance Criteria**

**Given** the DESIGN.md frontmatter token set (color ramp dark + light, type, 4px spacing, radius, elevation),
**When** tokens are authored inside the `@theme` block of `tokens.css`,
**Then** every token resolves as both a CSS var (`--token`) and an auto-derived Tailwind utility, with `.dark` overrides for the dark hero theme.
**And** the accent splits into `accent-text` / `accent-ui` / `accent-on-surface` sub-tokens with their contrast targets recorded (WCAG 1.4.11).
**And** `design-tokens.md` lists `canonical | light | dark | web-key | android-key` with the `-`→`_` rule, and `[ASSUMPTION]` light-theme values carry the marker in both manifest and code comment.
**And** no raw hex or arbitrary px appears in component code thereafter (enforced later by ESLint).

### Story 1.5: Self-hosted fonts, SW fix, and FOUC-free theme bootstrap

As Jay,
I want the app to load its fonts locally and apply my theme with no flash and no blank offline page,
So that the first paint is correct and the PWA works offline (NFR12, NFR2, NFR14).

`Depends-on:` 1.3, 1.4. **Touched:** `public/static/fonts/*`, `index.html`, `public/sw.js`, `vite.config.js`. **Est:** medium. Covers spike **S2 (FOUC 3-state matrix)**.

**Acceptance Criteria**

**Given** Plus Jakarta Sans + JetBrains Mono variable fonts self-hosted (no CDN),
**When** the app loads,
**Then** fonts resolve locally and `@font-face` is defined in the token/style layer.
**And** **Given** a stored theme of `system | light | dark`, **When** `index.html` runs its inline pre-paint script, **Then** `<html class="dark">` is set before first paint, evaluating `system` via `matchMedia('(prefers-color-scheme: dark)')` — verified across all three stored values (S2 matrix), with the choice mirrored to `localStorage` and IndexedDB as durable store.
**And** **Given** an offline cold open, **When** the SW serves the shell, **Then** `navigateFallback`/`createHandlerBoundToURL` point at `index.html` (the `app.html` rename dropped) and a real shell renders, not a blank page; `skipWaiting` + `clientsClaim` retained.

### Story 1.6: `ui/` display primitives — Button, Card, Chip

As a developer,
I want token-driven Button, Card, and Chip primitives,
So that screens compose consistent, domain-ignorant building blocks.

`Depends-on:` 1.1 (S1 GREEN), 1.4. **Touched:** `src/components/ui/{Button,Card,Chip}.jsx`, `src/components/ui/utils.js` (`cn` + `cva`). **Est:** small (3 primitives, cohesive).

**Acceptance Criteria**

**Given** the token system,
**When** Button is rendered,
**Then** it is an arrow-function component using `cva` for variants (`variant: primary|ghost`, `size: sm|md|lg`) and `cn()` for class merge; primary = achromatic white fill, ghost = neutral border (UX-DR6); green is never a button variant.
**And** Card renders the signature shape (`rounded-card` = `0 16px 16px 0`, squared left edge), elev-1 resting / elev-2 hover, `surface` background.
**And** Chip supports the squared priority-badge form (radius 6px) and the pill form (topic/tag) so the squared-vs-pill contrast is available (UX-DR5).
**And** all three carry visible focus styling via the `focus-ring` token (NFR3 primitive a11y contract).

### Story 1.7: `ui/` overlay primitives on Radix — Dialog, Sheet, Menu, Popover, Tooltip

As a developer,
I want accessible overlay primitives built on Radix,
So that dialogs, sheets, and menus get focus management and keyboard behavior for free (NFR3).

`Depends-on:` 1.1 (S1 GREEN), 1.4. **Touched:** `src/components/ui/{Dialog,Sheet,Menu,Popover,Tooltip}.jsx`. **Est:** medium (shared Radix overlay pattern). Folds spike **S3 (Radix/MUI z-index stacking)** as a verification AC.

**Acceptance Criteria**

**Given** Radix primitives,
**When** any overlay opens,
**Then** it traps focus, restores focus to the trigger on close, and closes on `Esc` (NFR3 a11y contract); Menu items are arrow-key navigable.
**And** styling resolves to tokens (`menu` background/border/radius/elevation per DESIGN.md), no raw hex.
**And** **Given** an overlay rendered over a still-mounted MUI surface during migration, **When** it opens, **Then** z-index stacking is verified correct (S3) and documented.
**And** modal stacking is limited to one level deep (no dialog-on-dialog).

### Story 1.8: `ui/` form + data primitives — Switch, Tabs, Meter, Skeleton

As a developer,
I want Switch, Tabs, Meter, and Skeleton primitives,
So that settings, segmented controls, meters, and loading states share one implementation.

`Depends-on:` 1.1 (S1 GREEN), 1.4. **Touched:** `src/components/ui/{Switch,Tabs,Meter,Skeleton}.jsx`. **Est:** medium.

**Acceptance Criteria**

**Given** the token system,
**When** Switch is on,
**Then** its fill is `accent` green (UX-DR10 toggle), with `aria` pressed/checked state and keyboard toggle.
**And** Meter renders track + fill with threshold colors green-ok → amber (≥65%) → coral (≥90%) and a tabular-nums label that tints coral at critical (UX-DR4); a bad/non-numeric value degrades safely (no crash).
**And** Skeleton renders a shimmer placeholder shaped like a card (UX-DR14), gated on `prefers-reduced-motion`.
**And** Tabs is arrow-key navigable with roving tabindex.

### Story 1.9: `ui/` state-boundary primitives — DataBoundary, StatePanel, live-region

As a developer,
I want a single DataBoundary + StatePanel + aria-live utility,
So that every data surface branches loading/empty/error identically and announces changes to screen readers (FR14 structural owner, NFR3).

`Depends-on:` 1.6, 1.8. **Touched:** `src/components/ui/{DataBoundary,StatePanel}.jsx`, `src/components/ui/LiveRegion.jsx` (or hook). **Est:** medium. This is the **structural owner** of FR14 and the a11y live-region; later epics consume it, never re-implement.

**Acceptance Criteria**

**Given** the `<DataBoundary loading empty error>` wrapper,
**When** loading with no cache,
**Then** it renders 4–6 Skeleton cards; with cache, it renders children with no spinner over existing data; on empty it renders a StatePanel slot; on error it renders an inline reassuring message with a way out.
**And** StatePanel is a props-only shell (icon / title / desc / action) carrying NO domain words — it accepts the colorway (coral/amber/green/muted) and copy from its consumer (UX-DR11).
**And** an `aria-live="polite"` region utility exists for announcing arriving notifications and connection changes (NFR3), reused by E2/E3.
**And** the Korean voice copy that fills StatePanel is sourced from one place (DR12 single-source), so tone cannot drift between epics.


---

## Epic 2: First Run — Jay Gets In

Jay walks from a dead screen to a live, subscribed feed in four taps. This epic delivers the shell, theme, connection, auth, first subscribe, and the first-run states wearing their real Korean voice — the first end-to-end demoable Jay moment (Flow 1). It establishes `App.jsx` and `AppProviders.jsx` in their final shape; later epics **append** providers/routes, never restructure (Winston's append-only rule).

### Story 2.1: Responsive app shell + provider scaffold

As Jay,
I want a responsive shell that adapts to desktop, tablet, and phone,
So that the app is comfortable on every device I use (FR13, NFR6).

`Depends-on:` 1.6 (Button/Card), 1.7 (Sheet/Menu for drawer), 1.9 (StatePanel host). **Touched:** `src/components/{App,AppProviders,Sidebar,AppBar,BottomNav}.jsx`, `src/config/migration.js` (new), `routes.js`. **Est:** medium-large.

**Acceptance Criteria**

**Given** a viewport ≥ `lg`,
**When** the shell renders,
**Then** it shows a 3-column layout (persistent sidebar · content · reserved detail region) with the feed column capped ~720px (UX-DR7).
**And** **Given** a `md` viewport, **Then** the sidebar collapses to an icon-rail; **Given** `< md`, **Then** a top app bar + 3-item bottom nav (구독/전체/설정) render and the sidebar moves into a drawer (UX-DR8).
**And** `AppProviders.jsx` composes providers in the codified order Theme → Connection (Selection and PublishQueue are appended by E3/E4); the provider order lives in code, not docs.
**And** `src/config/migration.js` exports `NEW = { shell, feed, detail, dialogs, settings }` flags and `App.jsx`/`routes.js` switch old↔new by flag (append-only flag additions thereafter, G3).
**And** chrome (sidebar/nav/bars) stays a tone quieter than any card (DESIGN.md discipline).

### Story 2.2: Theme switch — light / dark / system

As Jay,
I want to switch between light, dark, and system themes,
So that the app matches my preference and my OS (FR11).

`Depends-on:` 1.5 (FOUC bootstrap), 2.1. **Touched:** `src/components/contexts/ThemeContext.jsx` (new), a theme control surfaced in the shell. **Est:** small-medium.

**Acceptance Criteria**

**Given** the pre-paint script already set the initial class,
**When** `ThemeContext` mounts,
**Then** it reads the durable choice from Prefs/IndexedDB, mirrors to `localStorage`, and toggles the `.dark` class — never via a JS `theme.palette.mode` branch.
**And** **Given** the choice is `system`, **When** the OS theme changes, **Then** a `matchMedia` listener updates the class live.
**And** the file uses a reducer (no `useState` in the Provider, G-enforced) and `useTheme()` throws outside its Provider.
**And** switching theme keeps WCAG AA in both modes (NFR3).

### Story 2.3: Connection indicator (state × hasData)

As Jay,
I want an always-present connection indicator,
So that I know whether my server is reachable (FR9a, NFR1).

`Depends-on:` 2.1. **Touched:** `src/components/contexts/ConnectionContext.jsx` (new), `hooks.js` (listener glue), `ConnectionIndicator.jsx` (new). **Est:** medium.

**Acceptance Criteria**

**Given** the preserved `ConnectionManager` listeners,
**When** `hooks.js` wires `registerStateListener`/`registerMessageListener` into `ConnectionContext`,
**Then** the context exposes `connectionState (connected|connecting|reconnecting|offline) × hasData` with ~300ms debounced transitions that suppress flicker but never mask a real state change.
**And** the indicator renders 연결됨 / 연결 중… / 연결 끊김 with the connecting state showing a calm amber pulse (gated on `prefers-reduced-motion`).
**And** connection changes are announced via the `aria-live` region from Story 1.9 (NFR3).
**And** `src/app/` is not modified (mapping happens in `hooks.js` only); components read via `useConnection()`, never `ConnectionManager` directly.

### Story 2.4: Server + auth entry with conditional login

As Jay,
I want to enter my server URL and credentials,
So that the app can connect and subscribe on my behalf (FR1, FR19).

`Depends-on:` 2.1, 2.3. **Touched:** a 서버·인증 entry surface (minimal, expanded fully in E5), `Login.jsx` (conditional), `UserManager`/`Session` (read-only use). **Est:** medium.

**Acceptance Criteria**

**Given** the settings 서버·인증 surface,
**When** Jay enters server URL + token or basic auth and saves,
**Then** credentials are stored via the existing `UserManager`/`Session` plumbing (no API changes) and the connection attempts with them.
**And** **Given** `config.require_login` is true, **When** the app loads unauthenticated, **Then** a login UI renders; **Given** it is false (Jay's setup), **Then** no login UI appears and creds are just stored settings.
**And** account / signup / billing / reserved / token-management surfaces are not reachable (feature trim; full removal at E5 cleanup).
**And** on wrong URL/auth, the indicator returns to 연결 끊김 and the entered values are retained for a quick fix (voice: "주소와 인증을 확인해 주세요.").

### Story 2.5: Subscribe to a topic

As Jay,
I want to subscribe to a topic by name,
So that I start receiving its messages (FR2).

`Depends-on:` 1.7 (Dialog/Sheet), 2.3 (connection). **Touched:** `SubscribeDialog.jsx` (rebuilt → `ui/Dialog`/`ui/Sheet`). **Est:** medium. Built here; reused by E4 management.

**Acceptance Criteria**

**Given** a connected server,
**When** Jay opens the subscribe dialog (desktop `Dialog` / mobile `Sheet`),
**Then** the topic name is required, the server is pre-filled with the configured default, and auth is optional.
**And** **When** he submits a valid topic,
**Then** the dialog closes, the topic appears in the sidebar, and its feed opens (feed surface itself is E3 — here it lands on the no-messages/empty state).
**And** the dialog traps focus, restores to trigger, and closes on `Esc` (NFR3, inherited from `ui/Dialog`).
**And** all strings route through `t()` — no hardcoded user-facing text (NFR8).

### Story 2.6: First-run state panels with Korean voice

As Jay,
I want clear, friendly screens when I'm not connected or have no subscriptions,
So that I always know the next step (FR14, UX-DR11, DR12).

`Depends-on:` 1.9 (StatePanel/DataBoundary), 2.3 (connection), 2.5 (subscribe CTA). **Touched:** `message/EmptyStates.jsx` (new), wiring into the content region. **Est:** small-medium.

**Acceptance Criteria**

**Given** no server connection,
**When** the content region renders,
**Then** a not-connected StatePanel (coral colorway) shows "서버에 연결할 수 없음" + "주소와 인증을 확인해 주세요." + a "설정 열기" action.
**And** **Given** connecting with no cache, **Then** a connecting panel (amber, pulse) shows "서버와 연결하고 있어요. 잠시만요."
**And** **Given** connected but zero subscriptions, **Then** a no-subscriptions panel (green colorway) shows "아직 구독한 토픽이 없어요" + "토픽을 구독하면 여기에 알림이 도착합니다." + the one green "＋ 토픽" CTA (UX-DR6 — the only green button).
**And** all copy comes from the single-source voice (DR12); `EmptyStates.jsx` fills the domain-ignorant `StatePanel` (it owns the words, StatePanel owns the shell).
**And** the full Flow 1 journey (dead screen → 설정 열기 → save creds → 연결됨 → ＋토픽 → subscribe → live empty feed) is demoable end to end.


---

## Epic 3: Notification Experience — Receive · Read · Act

The heart of the product, kept as one heartbeat (Flow 2): a notification arrives in real time, Jay reads it, and he acts on it without leaving the moment. The card is built first to pressure-test the primitives, with its pending/error slot contract fixed up front (G4) so E4 can inject data without re-opening the card. This epic appends `SelectionContext` to `AppProviders`.

**Epic DoD (S4 — subjective visual-quality gate):** beyond the per-story ACs, this epic is not "done" until **Jay accepts the notification card and feed as "polished" on both desktop and mobile** (PRD S4). This is a sign-off gate, not a test — record the acceptance (or the change list) before closing the epic.

### Story 3.1: Notification card shell + slot contract  *(G4 — card signature frozen here)*

As Jay,
I want each notification rendered as the hero card,
So that the one that matters lifts off the canvas at a glance (FR6, FR18 unread, UX-DR2/5).

`Depends-on:` 1.6 (Card/Chip), 1.8 (Meter), 1.9 (StatePanel). **Touched:** `src/components/message/{NotificationCard,PriorityBadge,TopicChip,TagChip}.jsx`. **Est:** medium-large.

**Acceptance Criteria**

**Given** a notification object from the logic layer (consumed as-is, not reshaped),
**When** the card renders,
**Then** it shows the header band (priority badge when P4/P5 + title + trailing bell/overflow icon buttons + unread dot, 1px divider), the squared-left accent bar (`0 16px 16px 0`, 4px coral=P5 / amber=P4 / none=P3, dark-only glow), elev-1 resting / elev-2 hover, whole card tappable.
**And** priority is conveyed by **label + icon + position**, never color alone (FR6, NFR3): P4="High", P5="Urgent" squared badge.
**And** an unread `accent` dot shows on the leading edge until read (FR18).
**And (G4 slot contract)** the card exposes typed `pending` / `error` slot props with a **GREEN render test for the empty slots**; E4 will inject data only — **the card component signature is frozen after this story** (no edits in E4/E5).
**And** a body slot accepts the adaptive renderer (Story 3.2) without the card knowing the body's internals.

### Story 3.2: Adaptive card body renderer

As Jay,
I want the card body to render appropriately whatever shape the message takes,
So that plain text, key-value data, and metrics all read well (FR16, UX-DR3/4).

`Depends-on:` 3.1, 1.8 (Meter), 1.4 (mono token). **Touched:** `src/components/message/{CardBody,MarkdownContent}.jsx`. **Est:** medium-large.

**Acceptance Criteria**

**Given** message content,
**When** the renderer inspects its shape,
**Then** it picks one of: *paragraph* (markdown, `body-sm`, clamped ~3 lines with in-place expand), *key-value rows* (`dt`/`dd`, bad values coral / ok values accent), or *rich key-value* (leading mono icon + label + value, numeric/percentage → inline Meter + tabular-nums %). The renderer picks; Jay never toggles (UX-DR3).
**And** **Given** content that fails to parse, **Then** it degrades to safe raw text — the card always survives (2-level ladder, not 4).
**And** markdown is rendered via `useRemark` (React elements, no `rehype-raw`/`dangerouslySetInnerHTML`) with the plugin chain kept verbatim; the component map re-points to `ui`/Tailwind `prose` (NFR11 — restyle, not a security change).
**And (security, C4)** link `href` and image `src` in rendered markdown are sanitized to an allowlist (`http`/`https`/`mailto`); `javascript:`/`data:` (and any other scheme) are stripped or neutralized — blocking raw HTML alone does NOT cover malicious URIs in valid markdown links. A test asserts a `javascript:` link does not produce a clickable executable href.
**And** a failed sub-element (bad meter value, broken image) is dropped without killing the card.

### Story 3.3: Feeds — per-topic + all, real-time, with states

As Jay,
I want both a per-topic feed and a merged all-topics feed that fill in real time,
So that I can scan one topic or everything at once (FR3, FR4, FR14 no-messages).

`Depends-on:` 3.1, 3.2, 1.9 (DataBoundary), 2.3 (connection). **Touched:** `src/components/Feed.jsx` (new), `hooks.js` (`useActiveTopic`). **Est:** medium-large.

**Acceptance Criteria**

**Given** subscribed topics,
**When** the all-feed renders,
**Then** every topic merges into one newest-first infinite-scroll stream, each card showing a topic chip for its source; the per-topic feed shows one topic with a sticky header (FR4).
**And** **Given** a new message over the live WebSocket, **When** it arrives, **Then** a card slides in at the top with the calm fade (gated on `prefers-reduced-motion`) and is announced via `aria-live` (NFR3); data flows server → `hooks.js` listener → SubscriptionManager → Dexie → `useLiveQuery` → render (Dexie is sole source; never copied into state).
**And** feed state branches through `DataBoundary`: cached → render immediately (no spinner over data); no cache → 4–6 skeletons (UX-DR14); single-topic empty → muted "이 토픽에 아직 메시지가 없습니다. 도착하면 바로 보여드릴게요."; all-feed empty → "알림이 없어요" (FR14).
**And** the 1.2 characterization tests stay GREEN (dedup `&id` + `sequenceId` ordering, G6).

### Story 3.4: Card overflow actions — read / copy / delete

As Jay,
I want a per-card overflow menu,
So that I can mark read, copy, or delete a notification without opening it (FR18 overflow).

`Depends-on:` 3.1, 1.7 (Menu). **Touched:** `message/NotificationCard.jsx` overflow slot (already in signature), action wiring to SubscriptionManager. **Est:** small-medium.

**Acceptance Criteria**

**Given** the card overflow ⋯ button,
**When** Jay opens it,
**Then** a Radix `Menu` offers 읽음 표시 / 복사 / 삭제, arrow-key navigable, Esc to close (NFR3).
**And** 읽음 표시 clears the unread dot (FR18) and persists via the logic layer; 복사 copies the message text; 삭제 removes it (with a naming confirm: "이 알림을 삭제할까요?").
**And** opening detail (Story 3.5) also clears the unread dot.
**And** the menu uses the frozen card signature — no card-component edits (G4).

### Story 3.5: URL-as-source-of-truth selection + detail host

As Jay,
I want opening a notification to show its detail beside the feed on desktop and full-screen on mobile,
So that reading one never loses my place (FR5 host, UX-DR13).

`Depends-on:` 3.3, 2.1 (App host). **Touched:** `src/components/contexts/SelectionContext.jsx` (new, appended to AppProviders), `routes.js` (`/:topic/:msgId`), `App.jsx` (host decision), `DetailPane.jsx` (new). **Est:** medium. Covers spike **S4 (URL-as-SoT)**.

**Acceptance Criteria**

**Given** the route `/:topic/:msgId`,
**When** Jay taps a card,
**Then** desktop renders the detail as a right-side pane (feed stays live beside it); mobile pushes a full-screen route with a back button — **one param split by CSS breakpoint, not two routes** (UX-DR13, NFR6).
**And (S4)** `SelectionContext` is a **derived selector over `useParams`/`useSearchParams`** with **no local `selectedId` state** (no `useState`/`useRef` in the file, ESLint-enforced); refresh / deep-link / back behave identically on every form factor.
**And** the selected card shows a slightly brighter `surface-active` surface — **not** a colored border (distinct from the keyboard focus ring).
**And** on mobile open, focus moves to the detail heading; on back, focus returns toward the feed (NFR3 minimal route a11y).

### Story 3.6: Detail content — markdown, attachment, metadata

As Jay,
I want the full notification in detail,
So that I can read everything and get the attachment (FR5, UX-DR18, NFR13).

`Depends-on:` 3.5, 3.2 (MarkdownContent). **Touched:** `DetailPane.jsx`, `message/{MarkdownContent,AttachmentBox}.jsx`. **Est:** medium.

**Acceptance Criteria**

**Given** a selected notification,
**When** the detail renders,
**Then** it shows the full markdown body capped ~70ch (NFR13), priority, tags, source topic chip, and timestamp.
**And** **Given** an attachment, **Then** it shows an image thumbnail or a file chip (name/size) with `surface-muted` bg + `radius-sm`; tap → open/download (UX-DR18).
**And** body line-height is 1.5, body size 16px, mono code spans 14px (NFR13).
**And** markdown remains XSS-safe (NFR11) and degrades to raw text on parse failure.

### Story 3.7: Inline action buttons (view / http / broadcast)

As Jay,
I want to run a notification's action buttons in place,
So that I can respond without leaving the feed (FR10).

`Depends-on:` 3.1 (pending/error slot), 3.6 (detail surface), 1.6 (Button). **Touched:** `ActionBar.jsx` (rebuilt), wiring to `actions.js`/`Api.js`. **Est:** medium.

**Acceptance Criteria**

**Given** up to 3 ntfy action buttons on a notification,
**When** Jay taps `view`,
**Then** the URL opens; **When** he taps `http`/`broadcast`, **Then** the request fires inline and the result reports on the card/detail without navigating away.
**And** **Given** the request fails, **Then** the card's **error slot** (frozen in 3.1) shows "실패 — 재시도" and retry runs in place — never a full-screen dead end.
**And** buttons follow the achromatic system (primary white / secondary ghost, UX-DR6); strings via `t()`.

### Story 3.8: Mobile card swipe gesture  *([ASSUMPTION] — confirm or scope-out)*

As Jay on mobile,
I want to swipe a card to reveal quick actions,
So that read/delete are faster than opening the overflow menu (UX-DR17).

`Depends-on:` 3.1, 3.4. **Touched:** `message/NotificationCard.jsx` gesture layer (no signature change). **Est:** small. **Status: [ASSUMPTION]** — tap remains the primary path; this is an accelerator only. **Confirm with Jay before implementing, or scope-out.**

**Acceptance Criteria**

**Given** a touch viewport,
**When** Jay swipes a card horizontally,
**Then** 읽음 표시 / 삭제 are revealed (delete asks a confirm), feeling native.
**And** tap still opens detail (swipe is never the only way to reach an action, NFR3).
**And** the gesture respects `prefers-reduced-motion` and does not trap focus or reorder tab order.
**And** if Jay scopes this out, the work is removed and overflow (3.4) remains the action path.


---

## Epic 4: Topics & Publishing — Jay Sends

Jay controls which topics he follows and sends his own messages (Flow 3). Publishing is optimistic so a phone-published message is never lost on a weak signal. This epic appends `PublishQueueContext` to `AppProviders` and injects into the card's frozen pending/error slots — no card-component edits (G4).

### Story 4.1: Manage subscriptions — rename / clear / unsubscribe

As Jay,
I want to rename, clear, or unsubscribe from a topic,
So that I keep my topic list tidy (FR9b).

`Depends-on:` 2.1 (sidebar), 2.5 (SubscribeDialog), 1.7 (Menu). **Touched:** `Sidebar.jsx`, `SubscriptionPopup.jsx`/`PopupMenu.jsx` (rebuilt → `ui/Menu`). **Est:** medium.

**Acceptance Criteria**

**Given** a subscribed topic in the sidebar,
**When** Jay opens its context menu,
**Then** he can rename it, clear its messages (naming confirm: "이 토픽의 알림을 모두 삭제할까요?"), or unsubscribe — all persisted via the existing `SubscriptionManager` (no API change).
**And** the active topic row shows the gray active surface + green leading dot (UX-DR7), reading selection via `useActiveTopic()` (not re-derived from Dexie).
**And** the menu is keyboard-navigable, Esc-closable (NFR3); strings via `t()`.

### Story 4.2: Mute / unmute a topic

As Jay,
I want to mute a topic,
So that I control noise without losing its history (FR7).

`Depends-on:` 3.1 (card bell slot), 2.1 (sidebar). **Touched:** mute wiring in `NotificationCard.jsx` bell slot + `Sidebar.jsx` row, `SubscriptionManager`/`Prefs`. **Est:** small-medium.

**Acceptance Criteria**

**Given** a topic,
**When** Jay toggles mute (card header bell or sidebar row),
**Then** the change is immediate and optimistic, persists in IndexedDB, and reverts with an inline "재시도" on failure.
**And** a muted topic **still receives and stores** notifications but suppresses sound + browser notification (FR7; honored by `Notifier.js`, preserved).
**And** mute state is reflected consistently on the card bell, sidebar row, and (later) settings — all reading one source.
**And** the toggle carries `aria-pressed` state (NFR3) and uses the frozen card signature (no card edits, G4).

### Story 4.3: Publish a message

As Jay,
I want to publish a message from the app,
So that I can leave myself notes or trigger my own alerts (FR8, UX-DR9).

`Depends-on:` 1.7 (Dialog/Sheet), 1.6 (Button), 1.8 (segmented control). **Touched:** `Messaging.jsx`/`PublishDialog.jsx` (rebuilt), `PublishFab.jsx` (new). **Est:** medium-large.

**Acceptance Criteria**

**Given** a connected server,
**When** Jay opens publish — desktop via a header action `Dialog`, mobile via the green FAB → bottom `Sheet` (UX-DR9) —
**Then** he can set topic (pre-set to the current feed, changeable), title, body, priority, and tags.
**And** the priority selector is segmented chips; the selected chip shows a priority-colored outline + tint; unselected sits at P3 (UX-DR9).
**And** the FAB is the single green button in the product (UX-DR6); all other buttons stay white/ghost.
**And** the dialog/sheet traps focus, restores to trigger, closes on Esc (NFR3); strings via `t()`.

### Story 4.4: Optimistic publish queue

As Jay,
I want my published message to appear instantly and survive a weak signal,
So that publishing from my phone is never lost (FR17).

`Depends-on:` 4.3, 3.1 (card pending/error slot), 3.3 (feed). **Touched:** `src/components/contexts/PublishQueueContext.jsx` (new, appended to AppProviders), `Api.js` (use). **Est:** medium.

**Acceptance Criteria**

**Given** a submitted publish,
**When** it is sent,
**Then** the card appears at the top of the feed immediately (optimistic), in the card's **pending** slot (frozen in 3.1 — no card edits), with queue states `sending → queued → failed` held in the `PublishQueueContext` reducer (memory).
**And** **Given** the server acks, **Then** the message persists to Dexie and the queue entry clears — the Dexie row (via `useLiveQuery`) is the surviving record (no second ledger to reconcile).
**And** **Given** the send fails, **Then** the card marks itself failed with "재시도" (error slot), the compose form's content is retained, and one tap re-sends idempotently (same client-side action id).
**And** the Provider uses a reducer (no `useState`, enforced); mute/action-button stay simple optimistic-update + revert (no queue).


---

## Epic 5: Settings, PWA & Migration Cleanup

The configuration tail and the rebuild's end. Delivers the full settings surface and PWA notifications, then the **gated** cleanup — a separate go/no-go from feature completion. Cleanup may only start once every migration flag is `true` and has survived one cycle on `main` (G5).

### Story 5.1: Settings surface — sectioned form

As Jay,
I want one place to configure everything,
So that I control server, appearance, sound, and retention (FR15, UX-DR10).

`Depends-on:` 2.2 (theme), 2.4 (server/auth entry), 1.8 (Switch/Tabs), 1.7 (Menu/selects). **Touched:** `Preferences.jsx`/`Pref.jsx` (rebuilt). **Est:** medium-large.

**Acceptance Criteria**

**Given** the settings route,
**When** it renders,
**Then** a left icon-nav lists 일반 · 서버·인증 · 모양·테마 · 알림·소리 · 보존·삭제 with a gray (not colored) active surface, each section a sectioned form with a divider + hint per heading (UX-DR10).
**And** 서버·인증 fully expands Story 2.4's entry (URL + basic/token); 모양·테마 hosts the segmented light/dark/system control (reusing `ThemeContext`); toggles render ON = green; selects are dark-fill controls; the save action is a white "설정 저장" button.
**And** 보존·삭제 exposes the message retention/deletion policy wired to the existing `Pruner`/`Prefs` (no API change).
**And** all strings via `t()`; the surface passes its a11y AC (keyboard, focus, labels — NFR3).

### Story 5.2: PWA browser notifications + permission

As Jay,
I want desktop/browser notifications even when the tab is in the background,
So that I see urgent alerts without watching the app (FR12, NFR5).

`Depends-on:` 5.1 (알림·소리 section), 4.2 (mute). **Touched:** 알림·소리 settings, `Notifier.js` call-site preservation, `public/sw.js`. **Est:** medium.

**Acceptance Criteria**

**Given** the 알림·소리 settings,
**When** Jay grants browser-notification permission,
**Then** the permission is requested in a user-gesture path (the preserved `Notifier.js` call site — must not be broken or notifications silently die).
**And** **Given** a new notification on an unmuted topic, **When** it arrives, **Then** the SW fires a browser/desktop notification; **Given** the topic is muted, **Then** no notification fires (FR7/FR12 interaction, NFR5).
**And** clicking the notification routes via `routes.forSubscription` to the in-app card (the preserved `Notifier.js`→`routes.js` seam; route shapes `/:topic`, `/:baseUrl/:topic` kept).
**And** the app is installable as a PWA on all three form factors; the SW serves the shell offline (NFR2/NFR5).

### Story 5.3: Accessibility + light-theme contrast verification pass

As Jay,
I want the app to meet WCAG AA in both themes and be fully keyboard-operable,
So that it's readable and usable for everyone (NFR3, UX-DR15, S3 light-theme).

`Depends-on:` all feature epics (verifies them). **Touched:** light-theme `[ASSUMPTION]` token values in `tokens.css`/`design-tokens.md`, any contrast/focus fixes. **Est:** medium.

**Acceptance Criteria**

**Given** the light theme `[ASSUMPTION]` tokens (`accent-light #1A9E5F`, surface-2, meter, topic-chip),
**When** measured,
**Then** body text clears ≥4.5:1 and non-text UI clears ≥3:1 (WCAG 1.4.11) on both `#FFFFFF` and `#F3F4F6`; failing values are corrected and the `[ASSUMPTION]` markers resolved.
**And** every surface (shell, feed, card, detail, dialogs, menus, settings, state panels) is keyboard-operable with visible focus via the `focus-ring` token, traps/restores focus in overlays, and announces arriving notifications + connection changes via `aria-live` (NFR3 — the dual-bound a11y obligation verified here).
**And** priority is never color-only anywhere; `prefers-reduced-motion` is honored across all motion.

### Story 5.4: Migration cleanup — remove MUI/Emotion/RTL + trimmed screens  *(GATED · G5)*

As the rebuild team,
I want the legacy stack and trimmed screens removed once every route is migrated,
So that the bundle is lean and the codebase is single-stack (FR19 removal, NFR14, NFR7).

`Depends-on:` ALL prior stories. **Touched:** remove `@mui/*`, `@emotion/*`, `stylis*`; delete `styles.js`, `theme.js`, `RTLCacheProvider.jsx`, `Account.jsx`, `Signup.jsx`, `UpgradeDialog.jsx`, `Reserve*.jsx`, `Navigation.jsx`, `Notifications.jsx`, `AccountApi.js`; enable full ESLint rule set. **Est:** medium.

**Acceptance Criteria** *(GATED)*

**Given (entry gate, G5)** the cleanup story asserts **in code** that every flag in `src/config/migration.js` `NEW` is `=== true` and has survived one cycle on `main`,
**When** the gate passes,
**Then** MUI / Emotion / stylis / RTLCacheProvider and the trimmed account/billing/reserved/token screens are removed; the app builds and all flows still work.
**And** the full ESLint rule set is enabled CI-failing: `no-literal-string`, `tailwindcss/no-arbitrary-value` + raw-hex restriction (with `/* layout-nudge */` escape), `no-restricted-paths` (app↔components, ui↔message), per-directory `no-restricted-syntax`.
**And** **token parity (NFR4):** a final web↔Android manifest check confirms no drift; a ~20-line diff-linter is added only if drift is observed.
**And** the build produces standalone static assets (NFR7) — not embedded in the ntfy go-server — deployable behind the Cloudflare Tunnel; the MUI/Emotion bundle is gone (NFR14).

