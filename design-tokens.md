# Design Tokens — ntfy-web ↔ Android Manifest

Web source of truth: `src/styles/tokens.css`

**Naming rule:** `android-key = canonical` with every `-` replaced by `_`. No other variation.
Example: `accent-on-surface` → `accent_on_surface`

**Web-key rule:** always the full CSS custom property name: `--color-surface`, `--radius-md`, etc.

`[A]` = `[ASSUMPTION]` — unconfirmed light-theme value pending WCAG contrast verification (Story 5.3).

---

## Color Tokens

| canonical | light | dark | web-key | android-key |
|---|---|---|---|---|
| `bg` | `#F3F4F6` `[A]` | `#0C0D0F` | `--color-bg` | `bg` |
| `surface` | `#FFFFFF` `[A]` | `#16181B` | `--color-surface` | `surface` |
| `surface-2` | `#EEF0F2` `[A]` | `#1C1F23` | `--color-surface-2` | `surface_2` |
| `surface-active` | `#EEF0F2` `[A]` | `#1C1F23` | `--color-surface-active` | `surface_active` |
| `border` | `#E4E6E9` `[A]` | `#23262B` | `--color-border` | `border` |
| `text` | `#1C1E21` `[A]` | `#E8EAED` | `--color-text` | `text` |
| `muted` | `#6B7177` `[A]` | `#8B9197` | `--color-muted` | `muted` |
| `accent-text` | `#1A9E5F` `[A]` | `#42D392` | `--color-accent-text` | `accent_text` |
| `accent-ui` | `#1A9E5F` `[A]` | `#42D392` | `--color-accent-ui` | `accent_ui` |
| `accent-on-surface` | `#FFFFFF` `[A]` | `#0C1A12` | `--color-accent-on-surface` | `accent_on_surface` |
| `priority-high` | `#E8943A` `[A]` | `#F5A95C` | `--color-priority-high` | `priority_high` |
| `priority-max` | `#E5484D` `[A]` | `#FF6B6E` | `--color-priority-max` | `priority_max` |
| `meter-ok` | `#1A9E5F` `[A]` | `#42D392` | `--color-meter-ok` | `meter_ok` |
| `meter-track` | `#E4E6E9` `[A]` | `#262A2F` | `--color-meter-track` | `meter_track` |
| `meter-warning` | `#E8943A` `[A]` | `#F5A95C` | `--color-meter-warning` | `meter_warning` |
| `meter-critical` | `#E5484D` `[A]` | `#FF6B6E` | `--color-meter-critical` | `meter_critical` |
| `topic-chip-bg` | `#E1F2EA` `[A]` | `#143A2D` | `--color-topic-chip-bg` | `topic_chip_bg` |
| `topic-chip-text` | `#136B43` `[A]` | `#7CE6B4` | `--color-topic-chip-text` | `topic_chip_text` |
| `button-fill` | `#F4F5F6` | `#F4F5F6` | `--color-button-fill` | `button_fill` |
| `button-fill-text` | `#15171A` | `#15171A` | `--color-button-fill-text` | `button_fill_text` |
| `focus-ring` | `#1A9E5F` `[A]` | `#42D392` | `--color-focus-ring` | `focus_ring` |

### Accent Sub-Token Decision Table

Pick the accent sub-token by **what is painted**, not by component type:

| What is painted | Token to use | Contrast target |
|---|---|---|
| Text / informational icon | `accent-text` | 4.5:1 on background |
| Border / divider / focus ring / nav dot / unread dot | `accent-ui` | 3:1 (WCAG 1.4.11) |
| Foreground **on top of** an accent-colored fill | `accent-on-surface` | 4.5:1 on the fill |

**Rule:** if the accent color IS the background → use `accent-on-surface` for the text.
Example: primary button label sits on the FAB green fill → `text-accent-on-surface`.

---

## Radius Tokens

| canonical | value | web-key | android-key | usage |
|---|---|---|---|---|
| `radius-sm` | `10px` | `--radius-sm` | `radius_sm` | buttons, inputs |
| `radius-md` | `16px` | `--radius-md` | `radius_md` | cards, dialogs, empty-state icon tile |
| `radius-full` | `9999px` | `--radius-full` | `radius_full` | chips, pill, avatars, toggles, meter tracks |
| `radius-badge` | `6px` | `--radius-badge` | `radius_badge` | priority badge — intentionally squared |
| `rounded-card` | `0 16px 16px 0` | `@utility rounded-card` | _(no equivalent)_ | notification card: squared left, rounded right |

---

## Shadow / Elevation Tokens

| canonical | value | web-key | android-key | usage |
|---|---|---|---|---|
| `shadow-flat` | `none` | `--shadow-flat` | `shadow_flat` | elev-0: border-only |
| `shadow-elev-1` | `0 1px 2px rgba(0,0,0,0.4)` | `--shadow-elev-1` | `shadow_elev_1` | resting card |
| `shadow-elev-2` | `0 1px 2px rgba(0,0,0,0.4), 0 6px 16px rgba(0,0,0,0.3)` | `--shadow-elev-2` | `shadow_elev_2` | hover / dialog |

### Glow Effects (Dark-Only)

These tokens are defined only in `.dark {}` and must NOT be applied in light mode. Use `var(--glow-*, none)` fallback pattern for safety.

| canonical | dark value | web-key | usage |
|---|---|---|---|
| `glow-priority-high` | `0 0 10px rgba(245,169,92,0.267)` | `--glow-priority-high` | amber glow on P4 bar |
| `glow-priority-max` | `0 0 10px rgba(255,107,110,0.333)` | `--glow-priority-max` | coral glow on P5 bar |
| `glow-accent-dot` | `0 0 7px #42D392` | `--glow-accent-dot` | status/unread dot glow |

---

## Overlay & Z-Index Tokens

| canonical | light | dark | web-key | android-key |
|---|---|---|---|---|
| `overlay` | `rgba(0,0,0,0.45)` `[A]` | `rgba(0,0,0,0.65)` | `--color-overlay` | _(web only)_ |
| `z-popover` | `50` | `50` | `--z-popover` | _(web only)_ |
| `z-overlay` | `1350` | `1350` | `--z-overlay` | _(web only)_ |

`[A]` = unconfirmed light-mode value. Android does not use CSS z-index or overlay tokens.

---

## Typography Tokens

### Font Families

| canonical | value | web-key | android-key |
|---|---|---|---|
| `font-sans` | `'Plus Jakarta Sans', 'Roboto', system-ui, sans-serif` | `--font-sans` | `font_sans` |
| `font-mono` | `'JetBrains Mono', 'Roboto Mono', monospace` | `--font-mono` | `font_mono` |

### Font Sizes

| canonical | value | web-key | android-key | usage |
|---|---|---|---|---|
| `text-display` | `28px` | `--text-display` | `text_display` | display heading |
| `text-title` | `22px` | `--text-title` | `text_title` | section title |
| `text-subtitle` | `18px` | `--text-subtitle` | `text_subtitle` | subtitle |
| `text-body` | `16px` | `--text-body` | `text_body` | primary body text |
| `text-body-sm` | `14px` | `--text-body-sm` | `text_body_sm` | secondary body text |
| `text-caption` | `12px` | `--text-caption` | `text_caption` | captions, labels |
| `text-mono` | `14px` | `--text-mono` | `text_mono` | monospace content |

### Line Heights

| canonical | value | web-key | android-key |
|---|---|---|---|
| `leading-display` | `34px` | `--leading-display` | `leading_display` |
| `leading-title` | `28px` | `--leading-title` | `leading_title` |
| `leading-subtitle` | `24px` | `--leading-subtitle` | `leading_subtitle` |
| `leading-body` | `24px` | `--leading-body` | `leading_body` |
| `leading-body-sm` | `20px` | `--leading-body-sm` | `leading_body_sm` |
| `leading-caption` | `16px` | `--leading-caption` | `leading_caption` |
| `leading-mono` | `20px` | `--leading-mono` | `leading_mono` |

---

## Spacing Scale (4px base)

| canonical | value | web-key | android-key | usage |
|---|---|---|---|---|
| `spacing-1` | `4px` | `--spacing-1` | `spacing_1` | tightest: icon↔label |
| `spacing-2` | `8px` | `--spacing-2` | `spacing_2` | |
| `spacing-3` | `12px` | `--spacing-3` | `spacing_3` | |
| `spacing-4` | `16px` | `--spacing-4` | `spacing_4` | card internal padding base |
| `spacing-5` | `24px` | `--spacing-5` | `spacing_5` | card internal padding full |
| `spacing-6` | `32px` | `--spacing-6` | `spacing_6` | |
| `spacing-7` | `48px` | `--spacing-7` | `spacing_7` | between major surfaces |

---

## Android Naming Rule

The kebab-case → snake_case transformation:
- Replace every `-` with `_`
- Prefix with your resource type (e.g. `@color/accent_text`, `@dimen/spacing_4`)
- No other variation from the canonical name

Example mapping:
```
canonical:    accent-on-surface
web-key:      --color-accent-on-surface
android-key:  accent_on_surface  →  @color/accent_on_surface
```
