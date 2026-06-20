---
baseline_commit: cf52af32630a255851f18ea5b2facc1cdac6a336
---

# Story 1.4: Design Tokens as Single Source + Web↔Android Manifest

Status: done

## Story

As the design-system owner,
I want all tokens defined once in `tokens.css` and mirrored in a `design-tokens.md` manifest,
so that web styling is single-source and the Android sister app has a 1:1 reference (NFR4).

## Acceptance Criteria

1. **Given** the DESIGN.md frontmatter token set (color ramp dark + light, type, 4px spacing, radius, elevation),
   **When** tokens are authored inside the `@theme` block of `tokens.css`,
   **Then** every token resolves as both a CSS var (`--token`) and an auto-derived Tailwind utility (e.g. `bg-surface`, `rounded-md`, `shadow-elev-1`), with `.dark` class overrides for the dark hero theme.

2. **And** the accent splits into `accent-text` / `accent-ui` / `accent-on-surface` sub-tokens with their contrast targets recorded (WCAG 1.4.11).

3. **And** `design-tokens.md` lists `canonical | light | dark | web-key | android-key` with the `-`→`_` rule, and `[ASSUMPTION]` light-theme values carry the marker in both manifest and code comment.

4. **And** no raw hex or arbitrary px appears in component code thereafter (enforced later by ESLint; this story only establishes the token file as the source of truth).

5. **And** `npm run build` succeeds with no errors after `tokens.css` is created.

## Tasks / Subtasks

- [x] Task 1: Create `src/styles/tokens.css` (AC: #1, #2, #3)
  - [x] Add light values inside `@theme {}` block as the conventional CSS base
  - [x] Add `.dark {}` block outside `@theme` with all dark (hero) overrides
  - [x] Add accent sub-tokens: `accent-text`, `accent-ui`, `accent-on-surface` (both themes)
  - [x] Add `@utility rounded-card` for the signature `0 16px 16px 0` card shape
  - [x] Add all typography, spacing, radius, and elevation tokens
  - [x] Mark all light `[ASSUMPTION]` values with inline code comments
  - [x] Verify file is NOT adding `@import` — that lives in `main.css` (from Story 1.3)

- [x] Task 2: Create `design-tokens.md` at project root (AC: #3)
  - [x] Write the `canonical | light | dark | web-key | android-key` table
  - [x] Include all color tokens (bg, surface, surface-2, border, text, muted, accent-*, priority-*, meter-*, topic-chip-*, button-*)
  - [x] Include accent sub-token decision table (what is painted → which sub-token)
  - [x] Document the kebab→snake_case Android naming rule
  - [x] Mark `[ASSUMPTION]` light-theme values

- [x] Task 3: Verify build (AC: #5)
  - [x] Run `npm run build` — must exit 0
  - [x] Confirm that Tailwind utilities derived from `@theme` resolve (spot-check `bg-surface`, `text-muted`, `rounded-md`, `shadow-elev-1` in the compiled CSS)

## Dev Notes

### Prerequisites (from Story 1.3 — must already be done)

Story 1.3 installs Tailwind v4 and creates `src/styles/main.css`. This story ONLY adds tokens. Do NOT touch `main.css`, `vite.config.js`, or `package.json`.

`src/styles/main.css` from Story 1.3 must look like:
```css
@import "./tokens.css";   /* MUST come before tailwindcss */
@import "tailwindcss";
```

If `main.css` does not exist yet, Story 1.3 is incomplete — do not proceed.

### Tailwind v4 `@theme` Rules (Critical)

Tailwind v4 is **CSS-first** with no `tailwind.config.js`. Tokens live in `@theme {}` inside `tokens.css`.

**`@theme` cannot contain selector-scoped rules** — `.dark {}` must be written OUTSIDE `@theme`.

Auto-derived utility names from `@theme` variables:
- `--color-surface` → `bg-surface`, `text-surface`, `border-surface`, `ring-surface`
- `--color-accent-text` → `bg-accent-text`, `text-accent-text`, etc.
- `--radius-md` → `rounded-md`
- `--shadow-elev-1` → `shadow-elev-1`
- `--font-sans` → `font-sans`
- `--text-body` → `text-body` (font-size utility)
- `--spacing-4` → `p-[--spacing-4]` (direct use) OR set via `--spacing` base

**Pattern — light as `@theme` base, dark override via `.dark`:**
```css
@theme {
  --color-surface: #FFFFFF;   /* light base */
}
.dark {
  --color-surface: #16181B;   /* dark override — wins over :root when .dark on <html> */
}
```
This is the conventional Tailwind dark-mode pattern. Do NOT invert (dark in `@theme`, light in `:root`) — it would require duplicating all dark values.

### Complete `tokens.css` Specification

Create `src/styles/tokens.css` with the following content (exact values from DESIGN.md):

```css
/* ============================================================
   ntfy-web design tokens — web source of truth
   Load order: @import "./tokens.css" BEFORE @import "tailwindcss" in main.css
   Dark mode: .dark class on <html> (set by FOUC script in Story 1.5)
   Android sync: see design-tokens.md at project root
   ============================================================ */

@theme {
  /* ── Color: Backgrounds ── */
  --color-bg:             #F3F4F6;   /* [ASSUMPTION] off-white page canvas, never pure #FFF */
  --color-surface:        #FFFFFF;   /* [ASSUMPTION] card surface (Beszel exception) */
  --color-surface-2:      #EEF0F2;   /* [ASSUMPTION] hover/active chrome one step up */
  --color-surface-active: #EEF0F2;   /* [ASSUMPTION] = surface-2; active nav row, icon-button hover */

  /* ── Color: Borders ── */
  --color-border:         #E4E6E9;   /* [ASSUMPTION] hairline 1px depth device */

  /* ── Color: Text ── */
  --color-text:           #1C1E21;   /* [ASSUMPTION] primary body — WCAG AA on surface/bg */
  --color-muted:          #6B7177;   /* [ASSUMPTION] secondary/label text — WCAG AA on surface/bg */

  /* ── Color: Accent (3 semantic sub-tokens — WCAG 1.4.11) ──
     Pick by what is PAINTED, not by component type:
       text/icon        → accent-text    (4.5:1 contrast target)
       border/focus/dot → accent-ui      (3:1 contrast target)
       fg ON accent bg  → accent-on-surface (4.5:1 contrast target)  */
  --color-accent-text:        #1A9E5F;   /* [ASSUMPTION] darker emerald; 4.5:1 on #FFF, #F3F4F6 */
  --color-accent-ui:          #1A9E5F;   /* [ASSUMPTION] 3:1 for borders, focus ring, nav dot */
  --color-accent-on-surface:  #FFFFFF;   /* [ASSUMPTION] foreground on accent-filled button/FAB */

  /* ── Color: Priority / Meter thresholds ── */
  --color-priority-high:    #E8943A;   /* [ASSUMPTION] P4 amber (deepened for light AA) */
  --color-priority-max:     #E5484D;   /* [ASSUMPTION] P5 coral (deepened for light AA) */
  --color-meter-ok:         #1A9E5F;   /* [ASSUMPTION] = accent-text */
  --color-meter-track:      #E4E6E9;   /* [ASSUMPTION] */
  --color-meter-warning:    #E8943A;   /* [ASSUMPTION] = priority-high; threshold ≥ 65% */
  --color-meter-critical:   #E5484D;   /* [ASSUMPTION] = priority-max; threshold ≥ 90% */

  /* ── Color: Topic chip ── */
  --color-topic-chip-bg:    #E1F2EA;   /* [ASSUMPTION] emerald-tinted light pill */
  --color-topic-chip-text:  #136B43;   /* [ASSUMPTION] */

  /* ── Color: Buttons (achromatic — same in both themes) ── */
  --color-button-fill:      #F4F5F6;   /* white-fill primary button background */
  --color-button-fill-text: #15171A;   /* near-black primary button text */

  /* ── Color: Focus ring ── */
  --color-focus-ring:       #1A9E5F;   /* [ASSUMPTION] = accent-ui; keyboard focus outline */

  /* ── Typography: Font families ── */
  --font-sans: 'Plus Jakarta Sans', 'Roboto', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Roboto Mono', monospace;

  /* ── Typography: Font sizes (generate text-* utilities) ── */
  --text-display:  28px;
  --text-title:    22px;
  --text-subtitle: 18px;
  --text-body:     16px;
  --text-body-sm:  14px;
  --text-caption:  12px;
  --text-mono:     14px;

  /* ── Typography: Line heights (pair with text-* using leading-* or explicit style) ── */
  --leading-display:  34px;
  --leading-title:    28px;
  --leading-subtitle: 24px;
  --leading-body:     24px;
  --leading-body-sm:  20px;
  --leading-caption:  16px;
  --leading-mono:     20px;

  /* ── Spacing: 4px base scale ── */
  --spacing-1: 4px;    /* tightest: icon↔label */
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;   /* card internal padding base */
  --spacing-5: 24px;   /* card internal padding full */
  --spacing-6: 32px;
  --spacing-7: 48px;   /* between major surfaces */

  /* ── Radius ── */
  --radius-sm:    10px;    /* buttons, inputs */
  --radius-md:    16px;    /* cards, dialogs, empty-state icon tile */
  --radius-full:  9999px;  /* chips, pill, avatars, toggles, meter tracks */
  --radius-badge: 6px;     /* priority badge — intentionally squared (sharper than sm) */
  /* NOTE: card shape (0 16px 16px 0) cannot be a single @theme value.
     Use @utility rounded-card below, or var(--radius-md) with explicit border-radius. */

  /* ── Elevation / Shadow ── */
  --shadow-flat:   none;                                                    /* elev-0: border-only */
  --shadow-elev-1: 0 1px 2px rgba(0, 0, 0, 0.4);                           /* resting card */
  --shadow-elev-2: 0 1px 2px rgba(0, 0, 0, 0.4), 0 6px 16px rgba(0, 0, 0, 0.3); /* hover / dialog */
}

/* ── Dark mode (hero theme) ────────────────────────────────────
   Applies when .dark class is on <html> (set by FOUC pre-paint script in Story 1.5).
   All values here are CONFIRMED (no [ASSUMPTION] markers).
   ─────────────────────────────────────────────────────────── */
.dark {
  --color-bg:             #0C0D0F;   /* near-black neutral canvas */
  --color-surface:        #16181B;   /* card surface */
  --color-surface-2:      #1C1F23;   /* one step up: hover/active chrome */
  --color-surface-active: #1C1F23;   /* = surface-2 */
  --color-border:         #23262B;   /* hairline 1px */
  --color-text:           #E8EAED;   /* primary body text */
  --color-muted:          #8B9197;   /* secondary/label text */

  /* Accent sub-tokens */
  --color-accent-text:       #42D392;   /* emerald — 4.5:1 on dark bg; brand shared with Android */
  --color-accent-ui:         #42D392;   /* 3:1 for borders, focus ring, nav dot, unread dot */
  --color-accent-on-surface: #0C1A12;   /* very dark green on #42D392 fill (FAB label, etc.) */

  /* Priority */
  --color-priority-high:    #F5A95C;   /* P4 amber */
  --color-priority-max:     #FF6B6E;   /* P5 coral */

  /* Meter */
  --color-meter-ok:       #42D392;   /* = accent-text */
  --color-meter-track:    #262A2F;
  --color-meter-warning:  #F5A95C;   /* = priority-high; threshold ≥ 65% */
  --color-meter-critical: #FF6B6E;   /* = priority-max; threshold ≥ 90% */

  /* Topic chip */
  --color-topic-chip-bg:   #143A2D;   /* soft dark emerald tint */
  --color-topic-chip-text: #7CE6B4;   /* light emerald text */

  /* Focus ring */
  --color-focus-ring: #42D392;   /* = accent-ui */

  /* Glow effects (dark-only — do NOT apply in light mode) */
  --glow-priority-high: 0 0 10px rgba(245, 169, 92, 0.267);  /* amber glow on P4 bar */
  --glow-priority-max:  0 0 10px rgba(255, 107, 110, 0.333);  /* coral glow on P5 bar */
  --glow-accent-dot:    0 0 7px #42D392;                       /* status/unread dot glow */
}

/* ── Custom utility: Notification card signature shape ───────────
   Left edge is SQUARED so the 4px priority accent bar sits flush;
   right side keeps the standard 16px radius.
   Use: <div class="rounded-card"> (no arbitrary value needed)
   ─────────────────────────────────────────────────────────── */
@utility rounded-card {
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}
```

### Complete `design-tokens.md` Specification

Create `design-tokens.md` at the **project root** (same level as `package.json`, `vite.config.js`).

**Naming rule:** `android-key = canonical` with every `-` replaced by `_`. No other variation. Example: `accent-on-surface` → `accent_on_surface`.

**Web-key rule:** always the full CSS custom property name: `--color-surface`, `--radius-md`, etc.

The manifest table must include every token from `tokens.css`. Model after the architecture example:

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

`[A]` = `[ASSUMPTION]` — unconfirmed light-theme value pending WCAG contrast verification (Story 5.3).

Also include:
- Radius tokens (`radius-sm`, `radius-md`, `radius-full`, `radius-badge`)
- Shadow tokens (`shadow-flat`, `shadow-elev-1`, `shadow-elev-2`)
- Typography tokens (`font-sans`, `font-mono`, text sizes, line-heights)
- Spacing scale (`spacing-1` through `spacing-7`)

### Accent Sub-Token Decision Table

Include this in `design-tokens.md` after the main token table:

| What is painted | Token to use | Contrast target |
|---|---|---|
| Text / informational icon | `accent-text` | 4.5:1 on background |
| Border / divider / focus ring / nav dot / unread dot | `accent-ui` | 3:1 (WCAG 1.4.11) |
| Foreground **on top of** an accent-colored fill | `accent-on-surface` | 4.5:1 on the fill |

Rule: **if the accent color IS the background → use `accent-on-surface` for the text**. Example: primary button label sits on the FAB green fill → `text-accent-on-surface`.

### Glow Effects (Dark-Only, Component Use)

The glow vars (`--glow-priority-high`, `--glow-priority-max`, `--glow-accent-dot`) are defined in `.dark {}` and MUST NOT appear in light mode. Components that use them:

```jsx
// Priority bar — apply only with dark-mode conditional
// Good:
<div className="... dark:shadow-[var(--glow-priority-high)]" />

// Or via inline style:
style={{ boxShadow: `var(--glow-priority-high, none)` }}
// The fallback `none` handles light mode safely since the var is only defined in .dark
```

The `var(--glow-priority-high, none)` pattern is safe: in light mode the var is undefined, so the fallback `none` applies automatically.

### ESLint Token Enforcement (Context for this Story)

The ESLint rules enforcing token-only styling (`tailwindcss/no-arbitrary-value`, raw-hex restriction) are **not yet installed** — they come in a later story. This story only establishes the token file. However, write all future component code against token utilities from day one:

```jsx
// CORRECT — token utilities
<div className="bg-surface text-text rounded-md shadow-elev-1" />

// WRONG — arbitrary values (will be blocked by ESLint later)
<div className="bg-[#16181B] text-[#E8EAED] rounded-[16px]" />
```

One-off optical nudges: use a raw `px` only with `/* layout-nudge: <reason> */` comment.

### Files to Create / Touch

| File | Action | Notes |
|---|---|---|
| `src/styles/tokens.css` | **CREATE NEW** | Web source of truth — the primary deliverable |
| `design-tokens.md` | **CREATE NEW** | Project root; web↔Android manifest |
| Everything else | **DO NOT TOUCH** | No vite.config.js, package.json, main.css, src/app/* changes |

### Build Verification

After creating `tokens.css`, run:
```bash
npm run build
```

The build should succeed. If Tailwind doesn't recognize the `@utility` directive, check that `@tailwindcss/vite` version ≥ 4.0 is installed (Story 1.3 prerequisite). The `@utility` directive was introduced in Tailwind v4.

### Anti-Patterns to Avoid

```css
/* WRONG — @theme cannot hold selector-scoped overrides */
@theme {
  .dark {          /* ← syntax error / ignored */
    --color-bg: #0C0D0F;
  }
}

/* WRONG — duplicating dark values in @theme AND :root */
@theme { --color-bg: #0C0D0F; }
:root  { --color-bg: #F3F4F6; }   /* would override @theme; confusing */
.dark  { --color-bg: #0C0D0F; }   /* duplicate of @theme; error-prone */

/* CORRECT */
@theme { --color-bg: #F3F4F6; }   /* light base */
.dark  { --color-bg: #0C0D0F; }   /* dark override only */
```

```css
/* WRONG — multi-value radius in @theme (not supported) */
@theme {
  --radius-card: 0 16px 16px 0;   /* ← @theme needs single values */
}

/* CORRECT — @utility for custom multi-value shapes */
@utility rounded-card {
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
}
```

```css
/* WRONG — light mode glow leaking from dark vars */
.dark {
  --glow-accent-dot: 0 0 7px #42D392;
}
/* Applied wrong in component: */
box-shadow: var(--glow-accent-dot);   /* no fallback — undefined in light → no shadow */
/* ↑ This is actually fine behavior, but explicit fallback is clearer */

/* BETTER */
box-shadow: var(--glow-accent-dot, none);   /* explicit none fallback */
```

### Project Structure Notes

- `src/styles/tokens.css` — new; web source of truth; defines `@theme` + `.dark` overrides
- `design-tokens.md` — new; at project root (alongside `package.json`); web↔Android manifest
- `src/styles/main.css` — DO NOT TOUCH; Story 1.3 created this with the correct import order
- `src/app/` — DO NOT TOUCH (preserved logic layer)
- No `@tailwindcss/postcss`, no `tailwind.config.js`, no `postcss.config` — Tailwind v4 is CSS-first
- The `rounded-card` utility requires `@utility` (Tailwind v4 feature) — verify `@tailwindcss/vite` ≥ 4.0

### References

- Token values: `_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/DESIGN.md` (frontmatter, lines 1–144)
- Token architecture: `_bmad-output/planning-artifacts/architecture.md` — §Token Contract (web↔Android), §Format Patterns
- Token invariants: `_bmad-output/project-context.md` — §Styling/tokens section
- Accent sub-tokens decision table: `_bmad-output/planning-artifacts/architecture.md` — §Format Patterns → accent decision table
- Tailwind v4 CSS-first docs: `@theme` block, `@utility` directive, dark mode via class
- Story 1.3 (Install UI Stack) — prerequisite; must be done before this story

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Replaced `src/styles/tokens.css` placeholder (3-line stub from Story 1.3) with the full 130-line token file per story spec. Light values in `@theme {}`, dark hero overrides in `.dark {}` (outside `@theme` as required by Tailwind v4), and `@utility rounded-card` for the signature card shape.
- `[ASSUMPTION]` markers applied to all 18 light-theme color tokens; dark values are CONFIRMED (no markers).
- Glow vars (`--glow-priority-high`, `--glow-priority-max`, `--glow-accent-dot`) defined only in `.dark {}` — not present in light mode.
- Created `design-tokens.md` at project root with complete `canonical | light | dark | web-key | android-key` tables covering all color, radius, shadow, typography, and spacing tokens, plus the accent sub-token decision table and Android kebab→snake_case naming rule.
- `npm run build` exited 0. Spot-check confirmed `bg-surface`, `text-muted`, `rounded-md`, `shadow-elev-1`, `rounded-card` all appear in compiled CSS — Tailwind v4 `@theme` auto-derivation and `@utility` directive are working correctly.
- `main.css` was NOT touched (correct import order from Story 1.3 already in place).

### File List

- `src/styles/tokens.css` (modified — replaced placeholder with full token definition)
- `design-tokens.md` (created — web↔Android manifest at project root)

## Change Log

- 2026-06-20: Story 1.4 implemented — created `tokens.css` (21 color tokens, 4 radius, 3 shadow, 7 font sizes, 7 line-heights, 7 spacing steps, `@utility rounded-card`) and `design-tokens.md` (canonical manifest with Android key mapping). Build verified: exit 0, all spot-check utilities resolved.
- 2026-06-20: Code review passed — 2 patches applied, 13 items deferred.

## Review Findings

### Patches Applied

- [x] [Review][Patch] Add glow light-mode `none` defaults in `@theme` [src/styles/tokens.css] — `--glow-*` vars undefined in light mode caused entire `box-shadow` to become invalid when stacked with other shadows; fixed by declaring `none` defaults in `@theme` block
- [x] [Review][Patch] Add rationale to bare `[ASSUMPTION]` comments [src/styles/tokens.css] — `--color-meter-track` and `--color-topic-chip-text` had bare `/* [ASSUMPTION] */` with no explanation; added brief rationale matching style of surrounding comments

### Deferred

- [x] [Review][Defer] `--leading-*` in fixed `px` instead of unitless ratios — WCAG 1.4.12 risk at 200% browser zoom (fixed px doesn't scale with font-size); deferred to Story 5.3 accessibility audit
- [x] [Review][Defer] Shadow tokens missing dark-mode override — `rgba(0,0,0,0.4)` black shadows nearly invisible on `#0C0D0F` dark canvas; intentional design (border provides depth cue in dark mode); defer for design review
- [x] [Review][Defer] `--spacing-5/6/7` override Tailwind built-in utilities with non-default values — intentional design system: `p-5`=24px, `p-6`=32px, `p-7`=48px (vs Tailwind defaults 20/24/28px); document if onboarding pain
- [x] [Review][Defer] `--color-*` prefix is Tailwind's reserved namespace — future collision risk if Tailwind ships `--color-bg` or `--color-surface`; acceptable risk for now
- [x] [Review][Defer] No `prefers-color-scheme` CSS fallback — if Story 1.5 inline script is blocked, system-dark users see light mode; Story 1.5 scope
- [x] [Review][Defer] `.dark` class on Radix portals/nested elements — CSS custom properties don't cascade upward; portals appended to `document.body` inherit `html.dark` correctly; no current risk
- [x] [Review][Defer] Glow opacity values `0.267`/`0.333` have undocumented origin — appear to be 8-bit alpha (68/255, 85/255) from Android resources; add comment if cross-platform parity matters
- [x] [Review][Defer] `--glow-accent-dot` uses opaque hex instead of `rgba()` — functionally equivalent; style inconsistency only
- [x] [Review][Defer] `--color-surface-active` always equals `--color-surface-2` — independent token creates future drift risk; semantic separation is intentional
- [x] [Review][Defer] `--color-focus-ring` always equals `--color-accent-ui` — semantic separation intentional (may diverge for high-contrast accessibility mode)
- [x] [Review][Defer] Tailwind default color palette not purged — `text-red-500`, `bg-slate-100` etc. remain active alongside token system; ESLint enforcement comes in later story
- [x] [Review][Defer] Shadow opacity 40% (`rgba(0,0,0,0.4)`) is high for elevation — Material/HIG use 12-20%; design decision, not a bug
- [x] [Review][Defer] `rgba()` whitespace inconsistency between `tokens.css` and `design-tokens.md` — both valid CSS; cosmetic only
