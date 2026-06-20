# UX/UI Findings — ntfy Web Dashboard Redesign
_Extracted from prd-ntfy-web-2026-06-20 (prd.md + addendum.md + .decision-log.md). Source confirmed by Jay 2026-06-20._

## 1. Product summary
A from-scratch UI redesign of the ntfy web app, extracted into a standalone React + Vite project. It defines a shared "warm & friendly" design system (color, type, spacing, radius, elevation) that the sister Android app (Kotlin + XML Views) will adopt 1:1. Functionality is preserved; only the visual layer is rebuilt. Serves a self-hosted, single-user, single-server ntfy instance reachable via Cloudflare Tunnel.

## 2. Target users / personas
- Single-operator product, one persona: **"the self-hoster" (Jay)** — runs the server and consumes notifications across web and phone.
- Single LTR/Korean user (rationale for dropping RTL). No multi-user, account, or team contexts.

## 3. Form factor / platforms
- **Web:** standalone React + Vite app, static build behind Cloudflare Tunnel; responsive desktop/tablet/phone.
- **Installable PWA** with desktop/browser notifications (service worker + `Notifier.js` retained).
- **Android sister app:** Kotlin, View system + Material3 DayNight, minSDK 26 / target 36 — restyled to same tokens (logic unchanged).
- Both apps share brand teal `#338574`.

## 4. Core features & screens
- **SC1 App shell** — desktop/tablet: left sidebar (topic list + add + settings, brand-teal active state) + main content; mobile: top app bar + bottom drawer/nav, sidebar collapses.
- **SC2 Feed** — vertical list of notification cards, infinite scroll, sticky topic header on single-topic view, empty state.
- **SC3 Detail** — full markdown body (~70ch max), priority badge, tags, attachment preview/download, action buttons, timestamp, source topic. Desktop = right-side pane; mobile = full-screen route.
- **SC4 Subscribe dialog** — topic name input, server (defaults), optional auth, subscribe CTA.
- **SC5 Publish dialog** — topic, title, body, priority selector, tags/emoji, send CTA. Mobile = FAB entry.
- **SC6 Settings** — server URL + auth (basic/token), theme (light/dark/system), notification sounds, browser-notification permission, retention/deletion.
- **SC7 States** — not-connected / connecting / no-subscriptions / no-messages, each = friendly illustration + one-line guidance + primary action.

**Notification Card (hero element) anatomy:**
1. Priority accent — 4px left vertical bar colored by `prio-*`; P4/P5 add label chip ("High"/"Urgent"); P3 = no accent.
2. Title — `subtitle` weight 600; falls back to topic/first line.
3. Body — markdown-rendered, clamped ~3 lines with expand affordance.
4. Metadata row — topic chip (pill, `brand-container` tint) · relative timestamp · tag chips · inline emoji tags.
5. Attachment — image thumbnail or file chip (name/size); tap to open/download.
6. Actions — up to 3 ntfy action buttons (view/http/broadcast) as text buttons.
7. Unread indicator — brand dot on leading edge until read.
8. Affordances — whole card tappable → detail; overflow menu (mark read, copy, delete).
Visual: `surface` bg, `radius-md`, `elev-1` rest / `elev-2` hover, padding `space-4`, gap `space-3`.

Functional surfaces: connect (URL + basic/token auth), subscribe, real-time receive, browse history (per-topic + all), detail, priority visibility, mute/unmute, publish, manage subscriptions (rename/clear/unsubscribe + connection status), action buttons, light/dark/system theme, PWA install + browser notifications, responsive layout, empty/error/connection states, per-topic + global settings.

## 5. Key user flows
- Core parity gate S1: **Subscribe → receive live → browse history → open detail → publish → change settings**, against existing server, zero backend changes.
- Theme switch: system pref + IndexedDB-stored choice; `.dark` class toggle.
- Notification interaction: card tap → detail (right pane desktop / full-screen mobile); expand clamped body; tap action button (view/HTTP); overflow → mark read/copy/delete.

## 6. Visual / branding signals
- Direction: **warm & friendly** — warm neutrals, not clinical white. Backgrounds soft cream/sand (light), warm near-black w/ brown undertone (dark), never pure `#FFF`/`#000`. Cards are the bright surface that "pops."
- **Dark = hero theme** (Jay): warm charcoal w/ brown undertone (not blue-black/muddy gray), brighter "glowing" brand/accents so cards lift off canvas. Light = well-supported secondary.
- Brand: teal `#338574` (light) / `#6FD3BC` (dark glowing). Primary actions, active nav, links.
- Priority: prio-high warm amber (`#E8943A`/`#F5A95C`), prio-max warm coral (`#E5484D`/`#FF6B6E`), glowing on dark.
- Type: **Plus Jakarta Sans** (UI, friendly geometric sans, gently rounded), **JetBrains Mono** (code); Roboto system fallback. Free variable fonts, self-hosted (no CDN).
- Scale: display 28/34/600, title 22/28/600, subtitle 18/24/600, body 16/24/400, body-sm 14/20/400, caption 12/16/500, mono 14/20/400.
- Radius: `radius-sm`=10 (buttons/inputs), `radius-md`=16 (cards/dialogs), `radius-pill`=999 (chips/avatars).
- Spacing: 4px base (4/8/12/16/24/32/48).
- Elevation: soft/low — `elev-0` flat+1px border, `elev-1` resting card, `elev-2` hover/dialogs.
- Tone: "the card is the product" — all chrome quieter than card; generous padding, soft corners, gentle elevation.

⚠️ PRD §3.2 and addendum §B show slightly different dark hex for some tokens (dark `brand` `#6FD3BC` canonical vs `#65B5A3` CSS sketch; `bg` `#1A1613` vs `#1A1715`). **§3.2 / Addendum §A tables = canonical source of truth.**

## 7. A11y / i18n / dark / notifications / offline
- **A11y:** card passes WCAG AA (≥4.5:1 body) both themes; body ≥14px/sp; priority distinguishable without color alone (color + label/icon + position; color-blind safe). Dialog/menu/focus management re-verified after MUI removal.
- **Motion:** calm — subtle fade/slide on new notifications, no bouncing; respect `prefers-reduced-motion`.
- **i18n:** keep i18next; markup only changes. RTL dropped (`stylis-plugin-rtl` removed).
- **Dark:** light/dark/system; dark = hero. `.dark` class, system pref + IndexedDB choice.
- **Notifications:** PWA install + browser/desktop notifications kept; sounds + permission in settings.
- **Offline:** Dexie/IndexedDB + PWA service worker retained.
- **Readability:** one body size (16px web / 16sp Android), line-height 1.5, max ~70ch on detail.

## 8. Constraints & stakes
- **Stakes:** hobby / solo / self-hosted, single user, single server. Reviewer gate skipped (solo/hobby). Acceptance: "Jay accepts the card and topic list as polished on desktop and mobile."
- Not regulated; no multi-user/cloud/billing.
- **Constraints:** standalone static React+Vite (NOT embedded in server binary); server URL/auth runtime-configurable. Connection unchanged: WebSocket primary + HTTP poll fallback (5 min), NOT SSE. Zero backend/API changes (`?auth=` token, basic auth). Replace MUI with **Tailwind + shadcn/headless** (full re-impl of every component). Feature trim: remove signup, account/login-as-account, billing, plan upgrade, reserved topics, access-token mgmt. Keep server URL+auth, subscriptions, receive, history, detail, publish, settings, theme. (Minimal login retained only if server has `require_login`/protected topics — assumption.) One token system → CSS vars + Android resources, hand-synced (no Style Dictionary).

## 9. Explicit UX decisions (decision log)
- **D3:** warm & friendly. **D4:** Tailwind + shadcn/headless (full re-impl; RTL/a11y/i18n rework accepted). **D5:** remove cloud/account UI, core only. **D7:** brand teal `#338574`. **D11:** Plus Jakarta Sans + JetBrains Mono. **D12:** dark = hero, warm-charcoal + glowing accents, light counterpart. **D13:** PWA + browser notifications. **D15:** RTL dropped, i18next kept. **D16:** desktop detail = right pane, mobile full-screen. **D17:** all open questions resolved, PRD final.
- Note: PRD §3.5 / SC3 — desktop card list max-width ~720px; mobile FAB for publish; tablet = collapsible icon-rail sidebar.
