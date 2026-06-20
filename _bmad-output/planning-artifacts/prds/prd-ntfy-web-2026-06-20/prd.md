---
title: ntfy Web Dashboard — Redesign PRD
status: final
created: 2026-06-20
updated: 2026-06-20
owner: Jay
---

# ntfy Web Dashboard — Redesign PRD

A from-scratch UI redesign of the ntfy web app, extracted into a standalone React + Vite
project, defining a **shared "warm & friendly" design system** that the sister Android app
(Kotlin + XML Views) will adopt. Functionality is preserved; the visual layer is rebuilt.

> Scope note: `[ASSUMPTION]` tags mark inferences made under Fast path. Confirm or correct
> any of them and the relevant section updates.

---

## 1. Project Brief

### 1.1 Context

- Self-hosted ntfy server, **single user, single server**, reachable via Cloudflare Tunnel.
- The official web app (`web/` in `binwiederhier/ntfy`) is already copied into this repo's
  `src/` (React + MUI v5 + Vite 6, react-router v6, i18next, Dexie/IndexedDB, PWA).
- Real-time delivery today = **WebSocket primary** (`src/app/Connection.js`) + **HTTP poll
  fallback every 5 min** (`src/app/Poller.js`). *Not* SSE/EventSource.
- Sister project: forked Android app (`ntfy-android`, Material3 DayNight, View system, minSDK 26).
  Both apps already share the brand teal `#338574`.

### 1.2 Goals

| # | Goal |
|---|------|
| G1 | Rebuild the web UI to a polished, highly readable **warm & friendly** look — notification cards are the hero element. |
| G2 | Define a **platform-neutral design-token system** (color, type, spacing, radius, elevation) authored in this web project. |
| G3 | Run as a **standalone React + Vite** app served independently (static build behind Cloudflare Tunnel), talking directly to the ntfy server. |
| G4 | Preserve all core functionality: subscribe, real-time receive, history, detail, publish, settings/auth. |
| G5 | Produce a **handoff spec** the Android project implements 1:1 in Kotlin/XML. |

### 1.3 Non-Goals

- No backend, no API changes, no new server. Web talks to ntfy as-is.
- No multi-user / cloud / billing features. **Removed:** signup, account, billing, plan upgrade,
  reserved topics, access-token management UI. (See §4.5.)
- No change to subscription/connection logic (WebSocket + poll stay functionally identical).
- Not re-implementing the Android app's logic — only restyling it to the shared tokens.
- No new notification transport (no SSE migration, no push-service rework).

### 1.4 Success Criteria

| # | Criterion | Measure |
|---|-----------|---------|
| S1 | Functional parity for core flows | Subscribe → receive live → browse history → open detail → publish → change settings all work against the existing server with zero backend changes. |
| S2 | Shared design system is real | A single token table is the source of truth; web CSS vars and Android `colors.xml`/`dimens.xml` are generated from / map to the same names and values. |
| S3 | Readability | Notification card passes WCAG AA contrast (≥4.5:1 body text) in both light and dark; body text ≥14px/sp; priority is distinguishable without relying on color alone. |
| S4 | Visual quality (subjective gate) | Jay accepts the notification card and topic list as "polished" on desktop and mobile. |
| S5 | Android adoption | Android app renders the notification card and topic list with matching color, type scale, radius, and spacing. |

---

## 2. User Stories

Single-operator product — one persona, **"the self-hoster"** (Jay), who runs the server and
consumes notifications across web and phone. Platform column: **W** = web, **A** = Android,
**B** = both.

| ID | Story | Platform |
|----|-------|----------|
| US1 | As a self-hoster, I want to **connect to my server** (URL + auth: basic or token) so the app can subscribe on my behalf. | B |
| US2 | As a self-hoster, I want to **subscribe to a topic** by name so I start receiving its messages. | B |
| US3 | As a self-hoster, I want to **see notifications arrive in real time** without refreshing. | B |
| US4 | As a self-hoster, I want to **browse past notifications** (history) for a topic and across all topics. | B |
| US5 | As a self-hoster, I want to **open a notification's detail** to read the full message (markdown), see tags/priority, and view/download any attachment. | B |
| US6 | As a self-hoster, I want **priority to be visually obvious** so urgent (P4–P5) messages stand out at a glance. | B |
| US7 | As a self-hoster, I want to **mute / unmute a topic** so I control noise. | B |
| US8 | As a self-hoster, I want to **publish a message** to a topic from the app (title, body, priority, tags). | B |
| US9 | As a self-hoster, I want to **manage subscriptions** (rename/clear/unsubscribe, see connection status). | B |
| US10 | As a self-hoster, I want to **tap an action button** on a notification (view URL / HTTP action) and have it run. | B |
| US11 | As a self-hoster, I want to **switch light/dark theme** (or follow system) with a warm, consistent palette. | B |
| US12 | As a self-hoster on the web, I want the app to **work as an installable PWA** with desktop/browser notifications. | W |
| US13 | As a self-hoster on web, I want a **responsive layout** that's comfortable on desktop, tablet, and phone. | W |
| US14 | As a self-hoster, I want **clear empty/error/connection states** (not connected, no subscriptions, no messages yet). | B |
| US15 | As a self-hoster, I want **per-topic and global settings** (sounds, notification permission, message retention/deletion policy). | B |

US12 (PWA install + browser notifications) is **confirmed kept** — service worker and
`Notifier.js` are retained independent of the UI rebuild.

---

## 3. UI/UX Requirements

### 3.1 Design Principles — what "warm, polished, readable" means concretely

1. **Warm neutrals, not clinical white.** Backgrounds are soft cream/sand (light) and warm
   near-black (dark), never pure `#FFF`/`#000`. Cards are the bright surface that "pops" off the warm canvas.
2. **The card is the product.** Every pixel of chrome (sidebar, toolbar) is quieter than the
   notification card. Generous padding, soft corners, gentle elevation.
3. **Readability first.** One comfortable body size (16px web / 16sp Android), high line-height
   (1.5), max line length on detail views (~70ch). AA contrast minimum.
4. **Priority is multi-channel.** Color + a label/icon + position emphasis — never color alone
   (color-blind safe, US6/S3).
5. **Calm motion.** Subtle fade/slide on new notifications; no bouncing. Respect
   `prefers-reduced-motion`.
6. **One system, two platforms.** Every visual decision is expressed as a token that maps cleanly
   to both CSS and Android resources.

### 3.2 Design Tokens

> ⚠️ **SUPERSEDED — do not implement from this section.** During UX, Jay overrode the warm
> palette below. The canonical visual system is now **cool/neutral, emerald `#42D392`,
> near-black `#0C0D0F`** — see `ux-designs/.../DESIGN.md` (frontmatter tokens) and
> `reconcile-prd.md`. The hex tables in §3.2 and addendum §A/§B are kept only for history.
> Token source of truth at implementation = `src/styles/tokens.css` + `design-tokens.md`.

Platform-neutral names are the source of truth. Web = CSS custom property / Tailwind key;
Android = `colors.xml` / `dimens.xml` resource. Full mapping table → `addendum.md`.

#### Color

Warm palette anchored on the existing brand teal. **Dark is the hero theme** (Jay's pick): a warm
charcoal with brown undertone (not blue-black or muddy gray), brighter "glowing" brand/accent
colors so cards lift off the canvas. Light is the secondary, well-supported counterpart.

| Token | Light | Dark (hero) | Use |
|-------|-------|------|-----|
| `brand` | `#338574` | `#6FD3BC` | Primary actions, active nav, links. Brighter teal glows on dark. |
| `brand-container` | `#A0F2DD` | `#08453A` | Tinted brand backgrounds, chips. |
| `bg` (canvas) | `#FAF7F2` | `#1A1613` | App background — warm cream / warm charcoal. |
| `surface` (card) | `#FFFFFF` | `#251F1A` | Notification cards, dialogs, sheets — card lifts off canvas. |
| `surface-muted` | `#F3EEE6` | `#2F2823` | Secondary panels, hover, input fields. |
| `border` | `#ECE6DD` | `#3A322B` | Hairline dividers, card outlines. |
| `text` | `#2B2724` | `#F5EFE7` | Primary text (warm near-black / warm off-white). |
| `text-muted` | `#7A7068` | `#B5AA9C` | Timestamps, captions, secondary. |
| `prio-min` | `#9A9088` | `#8A8178` | Priority 1 accent (muted). |
| `prio-low` | `#6F8F86` | `#8FB3A9` | Priority 2 accent. |
| `prio-default` | `transparent` | `transparent` | Priority 3 — no accent. |
| `prio-high` | `#E8943A` | `#F5A95C` | Priority 4 accent (warm amber, glows on dark). |
| `prio-max` | `#E5484D` | `#FF6B6E` | Priority 5 accent (warm coral, glows on dark). |
| `success` | `#2F9E6E` | `#5FD49A` | Connected / success. |
| `warning` | `#E8943A` | `#F5A95C` | Reconnecting / caution. |
| `danger` | `#C30000` | `#FF6B6E` | Errors, destructive. |

#### Typography

Typeface = **Plus Jakarta Sans** (Jay's pick: "the pretty one"). A friendly geometric sans with
gentle, slightly rounded letterforms — warm and distinctive while staying highly readable at body
sizes. Free variable font; bundles into Android via `res/font`. Monospace for code spans =
**JetBrains Mono** (or system mono fallback). Roboto kept only as a system fallback.

| Token | Size / Line / Weight | Use |
|-------|----------------------|-----|
| `display` | 28 / 34 / 600 | Page/section title |
| `title` | 22 / 28 / 600 | Dialog titles, topic header |
| `subtitle` | 18 / 24 / 600 | Notification title (card) |
| `body` | 16 / 24 / 400 | Notification body, primary reading |
| `body-sm` | 14 / 20 / 400 | List secondary, dense areas |
| `caption` | 12 / 16 / 500 | Timestamps, chips, labels |
| `mono` | 14 / 20 / 400 | Code / markdown code spans |

#### Spacing — 4px base scale

`space-1`=4, `space-2`=8, `space-3`=12, `space-4`=16, `space-5`=24, `space-6`=32, `space-7`=48.
(Android: identical values in `dp`.)

#### Radius

`radius-sm`=10 (buttons, inputs), `radius-md`=16 (cards, dialogs), `radius-pill`=999 (chips/avatars).
Warm & friendly = larger corners than stock Material.

#### Elevation (soft, low)

| Token | Web (box-shadow) | Android (dp) | Use |
|-------|------------------|--------------|-----|
| `elev-0` | none + 1px `border` | 0dp + stroke | Flat surfaces, list dividers |
| `elev-1` | `0 1px 2px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.04)` | 1dp | Resting card |
| `elev-2` | `0 4px 12px rgba(0,0,0,.08)` | 3dp | Hover / raised card, dialogs |

### 3.3 Key Screens (web) + layout

| # | Screen | Layout |
|---|--------|--------|
| SC1 | **App shell** | Desktop/tablet: left sidebar (topic list + add + settings, brand teal active state) + main content. Mobile: top app bar + bottom drawer/nav; sidebar collapses. |
| SC2 | **All-notifications / topic feed** | Vertical list of **notification cards** (§3.4), infinite scroll, sticky topic header on single-topic view, empty state when none. |
| SC3 | **Notification detail** | Full markdown body (max ~70ch), priority badge, tags, attachment preview/download, action buttons, timestamp, source topic. **Desktop: right-side pane** (list stays visible); mobile: full-screen route. |
| SC4 | **Subscribe dialog** | Topic name input, server (defaults to configured), optional auth, subscribe CTA. |
| SC5 | **Publish dialog** | Topic, title, body, priority selector (uses priority colors), tags/emoji, send CTA. |
| SC6 | **Settings** | Server URL + auth (basic/token), theme (light/dark/system), notification sounds, browser-notification permission, message retention/deletion policy. |
| SC7 | **States** | Not-connected / connecting / no-subscriptions / no-messages — each a friendly illustration + one-line guidance + primary action. |

### 3.4 Notification Card — the hero element

Required anatomy (top→bottom, left→right):

1. **Priority accent** — left vertical bar (4px) colored by `prio-*`; for P4/P5 also a small label
   chip ("High"/"Urgent"). P3 = no accent. (US6, S3: never color-only.)
2. **Title** — `subtitle` weight 600. Falls back to topic/first line if no title.
3. **Body** — `body`, markdown-rendered, **clamped to ~3 lines** with "expand" affordance; full
   text on detail (SC3).
4. **Metadata row** — topic chip (`radius-pill`, `brand-container` tint) · relative timestamp
   (`caption`, `text-muted`) · tags as small chips · emoji tags inline.
5. **Attachment** — thumbnail (image) or file chip with name/size; tap → open/download.
6. **Actions** — up to 3 ntfy action buttons (view/http/broadcast) as text buttons.
7. **Unread indicator** — brand dot on the leading edge until read.
8. **Affordances** — whole card tappable → detail; overflow menu (mark read, copy, delete).

Visual spec: `surface` background, `radius-md`, `elev-1` resting / `elev-2` hover, padding
`space-4`, gap `space-3` between cards. Same anatomy must render in Android `DetailAdapter`'s
`fragment_detail_item.xml` (see §5).

### 3.5 Responsive Breakpoints (web)

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile | `< 640px` | Single column, top app bar, bottom nav / drawer, full-width cards, FAB for publish. |
| Tablet | `640–1024px` | Collapsible sidebar (icon rail), single content column, wider cards. |
| Desktop | `> 1024px` | Persistent sidebar + content; card list max-width ~720px for line length; **detail opens as a right-side pane** (list stays visible). |

---

## 4. Technical Constraints

### 4.1 Standalone React + Vite
Builds to static assets, served independently (e.g. Cloudflare Pages / static host behind the
Tunnel). **Must not** be embedded in or built into the ntfy server binary. Runtime server URL/auth
stay configurable (current `public/config.js` pattern or settings-stored values).

### 4.2 Server connection unchanged
Connects directly to the self-hosted ntfy server over its existing API. **WebSocket (primary) +
HTTP poll (fallback)** subscription logic in `Connection.js` / `ConnectionManager.js` / `Poller.js`
stays **functionally identical** — the redesign is a presentation-layer change only.

### 4.3 No backend changes / API compatibility
Zero server modifications. All requests conform to current ntfy endpoints, params, and auth
(`?auth=` token param, basic auth). Dexie/IndexedDB local persistence (`db.js`,
`SubscriptionManager.js`) retained.

### 4.4 Component stack: replace MUI with Tailwind + shadcn/headless
Decision: **replace MUI**. Implications that are now in-scope work (not optional):

- **Full screen re-implementation** — every component currently using MUI (`Navigation`,
  `Notifications`, dialogs, `Preferences`, etc.) is rebuilt with Tailwind + headless primitives.
- **RTL** — MUI + `stylis-plugin-rtl` gave RTL for free. Tailwind/shadcn does not. RTL must be
  **dropped** (Jay's decision — single LTR/Korean self-hoster). Saves the RTL re-implementation
  work; `stylis-plugin-rtl` and RTL handling are removed. i18next stays for translations.
- **i18n** — keep i18next; only the component markup changes.
- **Accessibility** — headless libs (Radix/shadcn) provide a11y primitives; dialogs, menus, and
  focus management must be re-verified (S3).
- **PWA / service worker** — `vite-plugin-pwa` retained independent of UI lib.

Rationale and the trade-off vs. "keep MUI + retheme" recorded in `addendum.md`.

### 4.5 Feature scope trim (single-user)
Remove cloud/account UI: **signup, login-as-account, billing, plan upgrade, reserved topics,
access-token management screens** (`Account.jsx`, `Signup.jsx`, upgrade/reserve dialogs).
**Keep:** server URL + auth (basic/token) in settings, subscriptions, receive, history, detail,
publish, per-topic + global settings, theme. `[ASSUMPTION]` A minimal login is retained only if
the server has `require_login` / protected topics; otherwise auth is just stored credentials.

### 4.6 Out of scope / unchanged
Notification transport, server features, multi-server switching UI (single server assumed).

---

## 5. Design Handoff Spec — for the Android sister project

Target: `ntfy-android` (Kotlin, **View system + Material3 DayNight**, minSDK 26 / target 36).
Goal: render the **same warm design system** without changing app logic. Implement tokens as
resources, then restyle adapters/layouts.

### 5.1 Tokens → Android resources

| Web token | Android resource | Where |
|-----------|------------------|-------|
| color `brand`, `bg`, `surface`, `text`, `prio-*`, … | matching `<color>` names | `res/values/colors.xml` (light) + `res/values-night/colors.xml` (dark) |
| `space-1..7` | `<dimen>` `space_1`…`space_7` (dp) | `res/values/dimens.xml` (new; today only `fab_margin`) |
| `radius-sm/md/pill` | `<dimen>` `radius_sm`=10dp, `radius_md`=16dp; pill via shape | `dimens.xml` + `res/drawable` shape |
| `elev-1/2` | `cardElevation` 1dp / 3dp | card styles in `themes.xml` |
| type tokens | `TextAppearance.App.*` styles + Inter `res/font` | `themes.xml` / `res/font/inter*.ttf` |

Map all colors via theme attributes (`?attr/colorPrimary`, `?attr/colorSurface`, custom
`?attr/colorPrioMax`, etc.) — the project already references attrs, not raw hex, so this drops in cleanly.

### 5.2 Notification card → `fragment_detail_item.xml` (rendered by `DetailAdapter.kt`)

Match §3.4 anatomy in the existing `MaterialCardView`:

- Card: `cardCornerRadius` = `radius_md` (16dp), `cardElevation` = `elev-1` (1dp), `cardBackgroundColor` = `?attr/colorSurface`, margin `space_3`, padding `space_4`.
- **Priority accent**: 4dp left `View` stripe colored by priority (`colorPrioMax`/`High`/…); P4/P5 add a label chip. Add to the item's `ConstraintLayout`.
- Title: `TextAppearance.App.Subtitle` (18sp/600). Body: `TextAppearance.App.Body` (16sp), `maxLines=3` + ellipsize, expand on tap (detail already full).
- Metadata: topic/timestamp/tag chips using `chip_background_color` → retune to `brand-container`/`surface-muted`. Relative time.
- Attachment: existing `view_attachment_box.xml` — apply `radius_sm` corners, `surface-muted` bg.
- Actions: existing `button_action.xml` — restyle to text buttons in `brand`.

### 5.3 Topic list → `fragment_main_item.xml` (`MainAdapter.kt`)
Same `surface` card on `bg` canvas, `radius_md`, `space_4` padding; active/muted/connection icons
tinted with `brand` / `text-muted`; last-message preview in `body-sm`.

### 5.4 Global Android theming
- `themes.xml` parent stays `Theme.Material3.DayNight.NoActionBar`; override color attrs + card/FAB/typography styles to the tokens.
- `action_bar` + `detail_activity_background` recolor to warm `surface`/`bg`.
- Verify contrast in both `values/` and `values-night/` (S3).

### 5.5 Handoff sequence
1. Web finalizes the token table (this PRD §3.2 → `addendum.md` mapping is canonical).
2. Android lands tokens (`colors.xml`, `values-night/colors.xml`, `dimens.xml`, type styles, Inter font).
3. Android restyles `DetailAdapter` card, then `MainAdapter` list, then global theme.
4. Side-by-side visual check of the notification card web vs. Android (S5).

---

## Resolved (2026-06-20)

- **Font** → Plus Jakarta Sans (UI) + JetBrains Mono (code). §3.2.
- **Palette** → warm system confirmed; dark is the hero theme. §3.2.
- **PWA + browser notifications** → kept. US12 / §4.6.
- **RTL** → dropped (single LTR/Korean self-hoster). §4.4.
- **Desktop detail view** → right-side pane. SC3 / §3.5.

All discovery questions resolved. No open items — ready for UX / architecture.
