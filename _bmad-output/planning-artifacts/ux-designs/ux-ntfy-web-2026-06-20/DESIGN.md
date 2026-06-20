---
name: ntfy-web
description: From-scratch UI redesign of the ntfy web app. Tailwind + shadcn/headless on React + Vite; dark is the hero theme, light the supported counterpart. The notification card is the product. One token system, hand-synced 1:1 to CSS vars (web) and Android resources.
status: final
updated: 2026-06-20
project: ntfy-web
colors:
  # ── DARK (hero) ──
  bg: '#0C0D0F'
  surface: '#16181B'
  surface-2: '#1C1F23'
  border: '#23262B'
  text: '#E8EAED'
  muted: '#8B9197'
  accent: '#42D392'            # emerald green — brand, shared 1:1 with Android sister app
  priority-high: '#F5A95C'     # amber — also meter "warning"
  priority-max: '#FF6B6E'      # coral — also meter "critical"
  meter-ok: '#42D392'          # = accent
  meter-track: '#262A2F'
  topic-chip-bg: '#143A2D'
  topic-chip-text: '#7CE6B4'
  button-fill: '#F4F5F6'       # achromatic white
  button-fill-text: '#15171A'
  # ── semantic aliases (referenced by EXPERIENCE.md) ──
  surface-active: '#1C1F23'    # = surface-2; active/hover chrome (nav rows, icon-button hover)
  meter-warning: '#F5A95C'     # = priority-high
  meter-critical: '#FF6B6E'    # = priority-max
  focus-ring: '#42D392'        # = accent; keyboard focus outline (both themes)
  # ── LIGHT (counterpart, neutral — no warm/brown) ──
  bg-light: '#F3F4F6'          # off-white page bg, never pure #FFF
  surface-light: '#FFFFFF'     # card surface only (Beszel exception)
  surface-2-light: '#EEF0F2'   # [ASSUMPTION] hover/active chrome
  border-light: '#E4E6E9'
  text-light: '#1C1E21'
  muted-light: '#6B7177'
  accent-light: '#1A9E5F'      # [ASSUMPTION] darker emerald to hit WCAG AA on light surfaces
  priority-high-light: '#E8943A'
  priority-max-light: '#E5484D'
  meter-ok-light: '#1A9E5F'    # [ASSUMPTION] = accent-light
  meter-track-light: '#E4E6E9' # [ASSUMPTION]
  topic-chip-bg-light: '#E1F2EA'   # [ASSUMPTION] light tint of accent
  topic-chip-text-light: '#136B43' # [ASSUMPTION]
typography:
  display:   { fontFamily: 'Plus Jakarta Sans', fontSize: 28px, lineHeight: 34px, fontWeight: '600' }
  title:     { fontFamily: 'Plus Jakarta Sans', fontSize: 22px, lineHeight: 28px, fontWeight: '600' }
  subtitle:  { fontFamily: 'Plus Jakarta Sans', fontSize: 18px, lineHeight: 24px, fontWeight: '600' }
  body:      { fontFamily: 'Plus Jakarta Sans', fontSize: 16px, lineHeight: 24px, fontWeight: '400' }
  body-sm:   { fontFamily: 'Plus Jakarta Sans', fontSize: 14px, lineHeight: 20px, fontWeight: '400' }
  caption:   { fontFamily: 'Plus Jakarta Sans', fontSize: 12px, lineHeight: 16px, fontWeight: '500' }
  mono:      { fontFamily: 'JetBrains Mono',    fontSize: 14px, lineHeight: 20px, fontWeight: '400' }
rounded:
  sm: 10px        # buttons, inputs
  md: 16px        # cards, dialogs
  full: 9999px    # chips, avatars, toggles ("pill")
  badge: 6px      # squared priority badge — intentionally sharper than sm
  card: '0 16px 16px 0'   # notification card: left edge SQUARED, right rounded
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
  '7': 48px
elevation:
  flat: 'none'                                  # elev-0 — relies on 1px border only
  card-rest: '0 1px 2px rgba(0,0,0,.4)'          # elev-1 — resting card
  card-hover: '0 1px 2px rgba(0,0,0,.4), 0 6px 16px rgba(0,0,0,.3)'  # elev-2 — hover / dialog
components:
  notification-card:
    background: '{colors.surface}'
    background-selected: '{colors.surface-active}'   # detail-open: slightly brighter surface, NOT a colored border
    border: '1px solid {colors.border}'
    radius: '{rounded.card}'
    padding: '{spacing.5}'
    accent-bar-width: 4px
    elevation: elev-1
  priority-bar-high:
    background: '{colors.priority-high}'
    glow: '0 0 10px #F5A95C44'   # dark only
  priority-bar-max:
    background: '{colors.priority-max}'
    glow: '0 0 10px #FF6B6E55'   # dark only
  priority-badge:
    radius: '{rounded.badge}'
    fontWeight: '800'
    textTransform: uppercase
    high: { background: '{colors.priority-high}', foreground: '#241403' }
    max:  { background: '{colors.priority-max}',  foreground: '#1A0E0E' }
  topic-chip:
    background: '{colors.topic-chip-bg}'
    foreground: '{colors.topic-chip-text}'
    radius: '{rounded.full}'
    fontWeight: '600'
  tag-chip:
    background: transparent
    border: '1px solid {colors.border}'
    foreground: '{colors.muted}'
    radius: '{rounded.full}'
  meter:
    track: '{colors.meter-track}'
    fill-ok: '{colors.meter-ok}'
    fill-warning: '{colors.priority-high}'    # ≥ 65% (default)
    fill-critical: '{colors.priority-max}'    # ≥ 90% (default)
    height: 7px
    radius: '{rounded.full}'
  button-primary:
    background: '{colors.button-fill}'
    foreground: '{colors.button-fill-text}'
    radius: '{rounded.sm}'
    fontWeight: '600'
  button-ghost:
    background: transparent
    border: '1px solid {colors.border}'
    foreground: '{colors.muted}'
    radius: '{rounded.sm}'
  status-dot:
    background: '{colors.accent}'
    glow: '0 0 7px {colors.accent}'   # dark only
  nav-item-active:
    background: '{colors.surface-2}'    # gray surface, NOT colored
    leadingDot: '{colors.accent}'
  fab-publish:
    background: '{colors.accent}'       # the single green button
    radius: '{rounded.sm}'
    foreground: '#0C1A12'
  toggle-on:
    background: '{colors.accent}'
  empty-state-icon-tile:
    radius: '{rounded.md}'
    not-connected: '{colors.priority-max}'
    connecting: '{colors.priority-high}'    # pulses
    no-subscriptions: '{colors.accent}'
    no-messages: '{colors.muted}'
  menu:                                      # Radix dropdown — overflow (읽음/복사/삭제)
    background: '{colors.surface}'
    border: '1px solid {colors.border}'
    radius: '{rounded.sm}'
    elevation: card-hover
    item-hover: '{colors.surface-active}'
  skeleton:                                  # loading placeholder for feed/detail
    background: '{colors.surface}'
    shimmer: '{colors.surface-active}'
    radius: '{rounded.card}'
---

## Brand & Style

ntfy-web is a self-hosted notification dashboard for a single operator. The product premise is simple: **the notification card is the product, and everything else is quiet chrome that gets out of its way.** Borrowing the feel (not the function) of the Beszel monitoring dashboard, the surface reads as a calm, data-dense, near-black control room — flat backgrounds, hairline borders, low elevation, and a single bright emerald that means "alive, healthy, here."

Dark is the hero theme; light is a fully supported neutral counterpart. Neither is warm or brown — the canvas is cool-neutral charcoal in dark, off-white in light, and all of the color character is carried by the brand emerald and the priority palette (amber / coral). Cards are the bright surfaces that lift off the canvas; chrome (sidebar, nav, headers) stays a tone quieter than any card.

The system is built on Tailwind + shadcn/headless — every component is re-implemented from scratch (the old MUI stack is gone). One token set drives both the web CSS variables and the Android sister app's resources, hand-synced 1:1; the emerald accent in particular is a shared brand token across both apps. Theme is applied via a `.dark` class plus system preference, with the user's choice stored in IndexedDB. Anything not pinned by a locked decision is marked `[ASSUMPTION]`.

## Colors

The palette is disciplined: one neutral ramp, one brand accent, and a two-color priority/threshold scale that doubles as the meter scale.

- **Background `{colors.bg}` (`#0C0D0F`)** — near-black neutral, slightly cool, flatter and darker than a typical charcoal. This is the canvas, never a card.
- **Surface `{colors.surface}` (`#16181B`) / Surface-2 `{colors.surface-2}` (`#1C1F23`)** — the card surface and the one-step-up chrome tone used for hover/active states (sidebar active row, icon-button hover). Never pure black.
- **Border `{colors.border}` (`#23262B`)** — hairline 1px separation. The primary depth device; this system leans on borders, not shadows.
- **Text `{colors.text}` (`#E8EAED`) / Muted `{colors.muted}` (`#8B9197`)** — primary body and secondary/label text. Both target WCAG AA (≥4.5:1) on surface and bg.
- **Accent — Emerald `{colors.accent}` (`#42D392`)** — the brand color, shared 1:1 with the Android sister app (this overrides the old teal `#338574`). Reserved for **accent moments only**: status/unread dots, the active-nav leading dot, links, the meter "ok" fill, the brand logo, and the single green publish FAB. **Never used for normal buttons.**
- **Priority-high / meter-warning — Amber `{colors.priority-high}` (`#F5A95C`)** — P4 priority bar + badge, and the meter "warning" fill at ≥ 65% (default threshold).
- **Priority-max / meter-critical — Coral `{colors.priority-max}` (`#FF6B6E`)** — P5 priority bar + badge, and the meter "critical" fill at ≥ 90% (default threshold).
- **Topic chip — bg `{colors.topic-chip-bg}` (`#143A2D`), text `{colors.topic-chip-text}` (`#7CE6B4`)** — a soft emerald-tinted pill, the only place the topic name gets a colored container.
- **Button fill `{colors.button-fill}` (`#F4F5F6`) on text `{colors.button-fill-text}` (`#15171A`)** — achromatic white primary buttons.

**Light counterpart** is neutral with no warm/brown undertone: page bg `{colors.bg-light}` (`#F3F4F6`, off-white — never pure `#FFF`), card surface `{colors.surface-light}` (`#FFFFFF`, the Beszel card exception), border `#E4E6E9`, text `#1C1E21`, muted `#6B7177`. Light priority colors deepen for contrast: amber `#E8943A`, coral `#E5484D`. The bright emerald `#42D392` fails AA on white, so light mode uses a darker emerald **`accent-light` `#1A9E5F` `[ASSUMPTION]`** — to be confirmed it clears ≥4.5:1 on `#FFFFFF` and `#F3F4F6`. The light topic-chip tint, surface-2, meter track, and meter-ok are derived and marked `[ASSUMPTION]` in frontmatter.

Avoid: pure `#000`/`#FFF` for surfaces (the light card on `#FFFFFF` is the one allowed exception, per Beszel); warm/brown neutrals; green on anything that isn't an accent moment; gradients on surfaces; more than the one accent + two priority colors.

## Typography

**Plus Jakarta Sans** is the UI typeface (friendly geometric sans, gently rounded), **JetBrains Mono** is the code/value face (used on key-value leading values and version strings), with **Roboto** as the system fallback. All fonts are self-hosted variable fonts — **no CDN**.

| Role | Size / Line / Weight | Use |
|---|---|---|
| `display` | 28 / 34 / 600 | Largest headings, hero state titles |
| `title` | 22 / 28 / 600 | Section / route titles |
| `subtitle` | 18 / 24 / 600 | Card titles, dialog headings |
| `body` | 16 / 24 / 400 | Default reading text (one size: 16px web / 16sp Android) |
| `body-sm` | 14 / 20 / 400 | Card body, key-value rows, dense text |
| `caption` | 12 / 16 / 500 | Tags, meta, timestamps, section labels |
| `mono` | 14 / 20 / 400 | Code, numeric values, version strings |

Body line-height is 1.5; detail-view markdown body is capped at **~70ch** max-width for readability. Priority and section labels are uppercase with tracking. The minimum legible text size is 14px/sp. Tabular numerals (`font-variant-numeric: tabular-nums`) are used on meter percentage labels so digits don't jitter.

## Layout & Spacing

Spacing is a 4px base scale: **4 / 8 / 12 / 16 / 24 / 32 / 48** (`{spacing.1}`–`{spacing.7}`). The largest gaps land between major surfaces; the smallest sit between tightly-related elements (icon ↔ label). Card internal padding is `{spacing.5}` (24px).

**Desktop / tablet:** left sidebar (topic list + add + settings) on the left, scrolling feed in the main column. The feed list is centered and capped at ~760px max-width — ntfy is a reading-and-scanning product, not a wide table. Tablet collapses the sidebar to a collapsible icon-rail. Detail opens as a **right-side pane**.

**Mobile:** top app bar (menu · topic title · connection dot · avatar) + a 3-item bottom nav (구독 / 전체 / 설정); the sidebar collapses into the menu drawer. Detail is a **full-screen route** with a back button and a sticky bottom action bar. Publish is a bottom sheet launched from the green FAB.

LTR only (RTL was dropped); i18next is retained, so layouts are authored single-direction.

## Elevation & Depth

Elevation is **soft and low** — depth comes from borders and tone, not heavy shadow (the Beszel discipline).

- **elev-0** — flat, separated only by a 1px `{colors.border}`. Default for chrome.
- **elev-1** — resting card: the 1px border plus a barely-there `0 1px 2px rgba(0,0,0,.4)`.
- **elev-2** — hover / dialog: a slightly lifted shadow, still minimal.

Priority accent bars add a subtle matching **glow** in dark mode only (amber/coral box-shadow on the bar, and a soft glow on the green status dot). Light mode drops the glows. Hierarchy is layout + tone first, shadow last.

## Shapes

- **`{rounded.sm}` (10px)** — buttons and inputs.
- **`{rounded.md}` (16px)** — cards, dialogs, the empty-state icon tile.
- **`{rounded.full}` (999px / pill)** — topic chips, tag chips, avatars, toggles, meter tracks.
- **`{rounded.badge}` (6px)** — the priority badge only: intentionally squared, sharper than `sm`. The squared-badge-vs-pill-chip contrast is a deliberate signal (priority reads as a hard "stamp," topic/tags read as soft labels).
- **Notification card `{rounded.card}` (`0 16px 16px 0`)** — the **left edge is SQUARED** so the 4px priority accent bar sits flush against it; the right side keeps the 16px `md` radius. This is the system's signature shape.

## Components

> Rendered references: [card-body-variants](mockups/card-body-variants.html), [beszel-feel-shell](mockups/beszel-feel-shell.html) (desktop), [mobile-layout](mockups/mobile-layout.html), [settings-and-states](mockups/settings-and-states.html). **This spine wins on any conflict** with a mock.

### 1. Notification card (hero element)
The card is the product. Structure top-to-bottom:
- **Header band** — priority badge (when P4/P5) + title (`subtitle`) + trailing icon buttons (bell/mute, overflow ⋯) + a status/unread dot. A 1px divider separates the band from the body.
- **Priority accent bar** — 4px vertical bar on the squared left edge: **coral** for max/urgent (P5), **amber** for high (P4), **none** for normal (P3). In dark mode the bar carries a subtle matching glow.
- **Body — three forms**, driven by message content:
  - *Paragraph* — markdown free text, `body-sm`, clamped to ~3 lines with an expand affordance.
  - *Key-value rows* — `dt`/`dd` pairs; failed/bad values render in coral, ok values in the accent.
  - *Rich key-value* — the richest form: each row has a **leading mono icon** + muted label + value, and numeric/percentage values get an **inline meter bar** + a tabular-nums percentage.
- **Tags row** — outlined pill chips, on their own row.
- **Meta row** — soft-pill **topic chip on the left**, relative **time pushed to the far right** (tags never sit after the time).
- **Action row** — separated by a top divider; up to ~3 ntfy action buttons. Primary = white fill, secondary = ghost.

Resting elev-1, hover elev-2; whole card tappable → detail.

### 2. Meter bar
Track `{colors.meter-track}` (`#262A2F`), height 7px, pill radius. Fill: **green (ok) → amber (≥ warning, default 65%) → coral (≥ critical, default 90%)**. Paired with a tabular-nums percentage label; the label tints to coral at critical.

### 3. Chips
- **Priority chip** — squared solid badge, radius `{rounded.badge}` (6px), filled with the priority color, uppercase 800-weight label.
- **Topic chip** — soft emerald-tinted pill (`{colors.topic-chip-bg}` / `{colors.topic-chip-text}`), 600 weight.
- **Tag chip** — outlined pill (transparent, 1px border, muted text).
The squared-vs-pill contrast is intentional and load-bearing for color-blind safety.

### 4. Buttons
- **Primary** — white fill `{colors.button-fill}` + dark text, radius `{rounded.sm}`.
- **Secondary** — ghost: transparent + 1px neutral border + light-gray text.
Green is **never** used for buttons — **except the publish FAB.**

### 5. Sidebar / nav (desktop)
Active row = gray surface `{colors.surface-2}` (`#1C1F23`), never a colored background; only the **leading dot is green** (with a soft glow in dark). Hover = `{colors.surface}`. The "＋ 토픽 구독" add action uses green text (accent moment). Footer holds "모든 알림" and "설정."

### 6. Bottom nav (mobile)
3 items (구독 / 전체 / 설정); the active item is green.

### 7. FAB (mobile publish)
Green rounded-square, bottom-right — the single green button in the product, the deliberate "accent moment." Launches the publish bottom sheet (priority selector = segmented chips, selected = priority-colored outline + tint).

### 8. Settings
Beszel pattern: left icon-nav (일반 / 서버·인증 / 모양·테마 / 알림·소리 / 보존·삭제) with gray active surface; sectioned form with section dividers and hint text under each heading; a segmented control for theme (light/dark/system); toggles where **ON = green**; selects rendered as dark-fill controls; a white "설정 저장" button.

### 9. Empty / connection states
Centered single-tone icon in a tinted rounded-square tile (`{rounded.md}`) + a title + one friendly line + one primary action. Colorways: **not-connected = coral**, **connecting = amber (pulse)**, **no-subscriptions = green** (with a ＋토픽 CTA), **no-messages = muted**. CTAs follow the button rules — green only on the create/＋토픽 action, everything else white/ghost.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Treat the card as the product; keep all chrome quieter than any card | Let sidebar/nav/headers compete with the card for attention |
| Reserve green for accent moments — dots, links, meter-ok, FAB, active-nav indicator, brand | Use green for normal buttons or as an active-row background |
| Keep buttons achromatic: white fill primary, neutral ghost secondary | Introduce a colored (indigo/violet/teal) button accent |
| Make priority readable without color: badge label + accent bar + position | Rely on color alone to signal priority (color-blind unsafe) |
| Square the priority badge, pill the topic/tag chips — keep the contrast | Round the priority badge to match the chips |
| Square the card's left edge so the accent bar sits flush; round the right | Fully round the card and float the accent bar |
| Hit WCAG AA (≥4.5:1 body) in both themes; use the darker `accent-light` on light surfaces | Ship the bright `#42D392` on white (fails AA) |
| Use borders + tone for depth; keep shadows soft and low (elev-0/1/2) | Use heavy drop shadows or elevation as the primary hierarchy device |
| Keep surfaces off-pure (bg `#0C0D0F`, light bg `#F3F4F6`) | Use pure `#000` or pure `#FFF` for surfaces (light card `#FFFFFF` is the only exception) |
| Use calm motion: subtle fade/slide on new notifications; honor `prefers-reduced-motion` | Bounce, overshoot, or animate without a reduced-motion fallback |
| Keep one token set, hand-synced 1:1 to web CSS vars + Android resources | Fork web and Android values; let the shared accent drift apart |
