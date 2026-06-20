---
baseline_commit: 3e6c554f4d39291910070b6a33adea8640b8e39e
---

# Story 1.8: `ui/` form + data primitives — Switch, Tabs, Meter, Skeleton

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want Switch, Tabs, Meter, and Skeleton primitives,
so that settings, segmented controls, meters, and loading states share one implementation.

## Acceptance Criteria

1. **Given** the token system (Story 1.4 complete),
   **When** Switch is on,
   **Then** its fill is `accent-ui` green (UX-DR10 toggle), with `aria-checked` state and keyboard toggle (Space key) provided by Radix Switch — not re-implemented.

2. **And** Meter renders track + fill with threshold colors green-ok → amber (≥65%) → coral (≥90%) and a tabular-nums label that tints `text-meter-critical` at critical (UX-DR4); a bad/non-numeric value (NaN, null, undefined, non-finite, or out of [0, 100]) degrades safely to an empty track without crashing.

3. **And** Skeleton renders a shimmer placeholder shaped like a card (UX-DR14), with the shimmer animation gated on `prefers-reduced-motion` (static `bg-surface-2` fallback when motion is reduced).

4. **And** Tabs is arrow-key navigable with roving tabindex, provided by Radix Tabs — not re-implemented.

5. **And** all four primitives use only token-derived Tailwind utilities (no raw hex, no arbitrary px except the one layout-nudge noted for Meter height), reside in `src/components/ui/`, and carry visible focus styling via the `focus-ring` token.

## Tasks / Subtasks

- [x] Task 1: Ensure `src/components/ui/utils.js` exists (AC: #1, #4, #5)
  - [x] Check whether Story 1.6 has already created `utils.js` — if it exists, import from it; do NOT overwrite
  - [x] If missing: create with `cn()` (clsx + tailwind-merge) — see Dev Notes for exact content

- [x] Task 2: Create `src/components/ui/Switch.jsx` (AC: #1, #5)
  - [x] Build on `radix-ui/react-switch` (SwitchRoot + SwitchThumb)
  - [x] Track ON = `bg-accent-ui`, track OFF = `bg-surface-2`, thumb = `bg-white`; pill shape via `rounded-full`
  - [x] `data-[state=checked]` Radix attribute drives the fill — no JS conditional for color
  - [x] Focus ring via `ring-focus-ring` + `ring-offset-bg` on `SwitchRoot`
  - [x] `disabled` state: `disabled:pointer-events-none disabled:opacity-50`
  - [x] Export: `function Switch({ checked, onCheckedChange, disabled, className, ...props })`
  - [x] `aria-label` must come from the **caller** via spread props — do NOT hardcode or call `t()` inside

- [x] Task 3: Create `src/components/ui/Tabs.jsx` (AC: #4, #5)
  - [x] Build on `radix-ui/react-tabs` (Root, List, Trigger, Content)
  - [x] Arrow-key navigation and roving tabindex are provided by Radix — do NOT re-implement
  - [x] Trigger: `data-[state=active]` → `bg-surface-active text-text shadow-elev-1`; inactive → `text-muted hover:text-text hover:bg-surface-2`
  - [x] Focus ring on `TabsTrigger`: `focus-visible:ring-2 focus-visible:ring-focus-ring`
  - [x] Export named re-exports: `TabsRoot`, `TabsList`, `TabsTrigger`, `TabsContent`
  - [x] No domain-specific labels or strings inside the component

- [x] Task 4: Create `src/components/ui/Meter.jsx` (AC: #2, #5)
  - [x] Pure custom component — no Radix Meter exists
  - [x] Props: `value` (0–100), `label` (optional string), `className`
  - [x] `safeMeterValue()` guard: NaN/null/undefined/non-finite → 0; clamp to [0, 100]
  - [x] Fill color: `<65` → `bg-meter-ok`; `≥65` → `bg-meter-warning`; `≥90` → `bg-meter-critical`
  - [x] Track: `bg-meter-track`, height `7px` via `style` with `/* layout-nudge: meter spec 7px */` comment, `rounded-full`
  - [x] Fill width: `style={{ width: \`${safeValue}%\` }}`; no transition (instant)
  - [x] Label: `tabular-nums text-body-sm`; tint `text-meter-critical` when value ≥90, else `text-muted`
  - [x] ARIA: `role="meter" aria-valuenow={safeValue} aria-valuemin={0} aria-valuemax={100}` on wrapper

- [x] Task 5: Create `src/components/ui/Skeleton.jsx` (AC: #3, #5)
  - [x] Pure custom component — no Radix Skeleton exists
  - [x] Props: `variant: 'card' | 'line' | 'block'` (default `'card'`), `className`
  - [x] `card` variant: matches NotificationCard anatomy — header band (badge + title + icon placeholders), body lines, meta row; see Dev Notes for layout
  - [x] Shimmer: `animate-pulse`; gate with `motion-reduce:animate-none`; static variant uses `bg-surface-2`
  - [x] No text content, no domain words, no `t()` calls needed

- [x] Task 6: Verify build (AC: #5)
  - [x] `npm run build` must exit 0 after all four files are created
  - [x] No `src/app/` files modified

## Dev Notes

### Prerequisites — Must Be Done First

| Prerequisite | Story | What it provides |
|---|---|---|
| S1 GREEN decision record | 1.1 | Validates Tailwind v4 + Radix coexist with MUI; **no `ui/` work starts without it** |
| Vite alias + stack install | 1.3 | `radix-ui`, `cva`, `clsx`, `tailwind-merge` in `package.json`; `@/*` alias wired |
| `src/styles/tokens.css` | 1.4 | All color, radius, shadow, meter-*, accent-*, focus-ring tokens |

Do NOT proceed if `src/styles/tokens.css` does not exist or Story 1.1 is not GREEN.

### `utils.js` — Story 1.6 Coordination

Stories 1.6 and 1.8 share the same dependency chain (1.1 + 1.4) and may run in either order or in parallel. Both need `cn()`. Rule: **whichever story runs first creates `utils.js`; the second story imports from it and does NOT overwrite.**

```js
// src/components/ui/utils.js
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

CVA is imported directly from `'class-variance-authority'` in each component file. It does NOT need to be re-exported from `utils.js`. **ESLint enforces `cva` may only be used inside `src/components/ui/`.**

### Radix Import Paths

Story 1.3 installs the unified `radix-ui` package. Use the subpath imports:

```js
import * as SwitchPrimitive from 'radix-ui/react-switch';
import * as TabsPrimitive from 'radix-ui/react-tabs';
```

Do NOT use the individual `@radix-ui/react-switch` package — it is NOT installed. Verify with `cat package.json | grep radix-ui` after Story 1.3 runs.

### Switch — Full Implementation

Radix Switch manages `aria-checked`, Space-key toggle, and focus internally.

```jsx
import * as SwitchPrimitive from 'radix-ui/react-switch';
import { cn } from './utils.js';

export function Switch({ checked, onCheckedChange, disabled, className, ...props }) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full',
        'border-2 border-transparent transition-colors',
        'data-[state=checked]:bg-accent-ui data-[state=unchecked]:bg-surface-2',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-elev-1',
          'transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0'
        )}
      />
    </SwitchPrimitive.Root>
  );
}
```

Critical points:
- `data-[state=checked]` is a Radix data attribute — drives fill without JS branching
- `bg-accent-ui` = the correct sub-token for a UI-element fill (3:1 non-text contrast, WCAG 1.4.11); NOT `accent-text` (which is for foreground text)
- `bg-white` on the thumb is intentionally achromatic (same value both themes, per button spec)
- `.dark` on `<html>` overrides `--color-accent-ui` automatically via CSS var — no JS theme check needed
- `ring-offset-bg` matches the page background so the ring appears correctly on both themes

### Tabs — Full Implementation

Radix Tabs manages roving tabindex, arrow-key navigation, and `aria-selected` internally.

```jsx
import * as TabsPrimitive from 'radix-ui/react-tabs';
import { cn } from './utils.js';

export const TabsRoot = TabsPrimitive.Root;

export function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-sm bg-surface-2 p-1',
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5',
        'text-body-sm font-medium transition-all',
        'data-[state=active]:bg-surface-active data-[state=active]:text-text data-[state=active]:shadow-elev-1',
        'data-[state=inactive]:text-muted',
        'hover:text-text hover:bg-surface-2',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      className={cn('mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring', className)}
      {...props}
    />
  );
}
```

Usage pattern for settings segmented control (Story 5.1) and priority selector (Story 4.3):
```jsx
<TabsRoot defaultValue="system">
  <TabsList>
    <TabsTrigger value="light">{t("theme_light")}</TabsTrigger>
    <TabsTrigger value="dark">{t("theme_dark")}</TabsTrigger>
    <TabsTrigger value="system">{t("theme_system")}</TabsTrigger>
  </TabsList>
</TabsRoot>
```

### Meter — Full Implementation

No Radix Meter exists. Pure custom component. Height 7px is the only layout-nudge permitted raw value.

```jsx
import { cn } from './utils.js';

function safeMeterValue(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function getFillClass(safeValue) {
  if (safeValue >= 90) return 'bg-meter-critical';
  if (safeValue >= 65) return 'bg-meter-warning';
  return 'bg-meter-ok';
}

export function Meter({ value, label, className }) {
  const safeValue = safeMeterValue(value);
  const isCritical = safeValue >= 90;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        role="meter"
        aria-valuenow={safeValue}
        aria-valuemin={0}
        aria-valuemax={100}
        className="relative flex-1 overflow-hidden rounded-full bg-meter-track"
        style={{ height: '7px' /* layout-nudge: meter spec 7px */ }}
      >
        <div
          className={cn('h-full rounded-full', getFillClass(safeValue))}
          style={{ width: `${safeValue}%` }}
        />
      </div>
      {label !== undefined && (
        <span
          className={cn(
            'tabular-nums text-body-sm shrink-0',
            isCritical ? 'text-meter-critical' : 'text-muted'
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}
```

**Graceful degradation table:**

| Input | `safeMeterValue` returns | Render result |
|---|---|---|
| `75` | `75` | 75% amber fill |
| `null` | `0` | empty track, no crash |
| `undefined` | `0` | empty track, no crash |
| `NaN` | `0` | empty track, no crash |
| `""` | `0` | empty track, no crash |
| `Infinity` | `0` | empty track, no crash |
| `-10` | `0` | clamped to 0 |
| `150` | `100` | clamped to 100 |
| `"85"` | `85` | `Number("85")` = 85; amber fill |

**Threshold logic — exact boundaries:**
- `safeValue < 65` → `bg-meter-ok` (green)
- `65 ≤ safeValue < 90` → `bg-meter-warning` (amber)
- `safeValue ≥ 90` → `bg-meter-critical` (coral); label also tints coral

**Note on label position:** The UX spec shows the percentage label to the right of the track (as in rich key-value rows in the card body). The `label` prop accepts a pre-formatted string (e.g., `"72%"`) — the Meter component does NOT format the number; that is the caller's responsibility.

### Skeleton — Full Implementation

Skeleton `card` variant must anatomically match Story 3.1's `NotificationCard` so the skeleton-to-content transition is seamless. Card anatomy per epics: header band (badge + title + bell + overflow) → body lines → meta row (topic chip + timestamp).

```jsx
import { cn } from './utils.js';

export function Skeleton({ variant = 'card', className }) {
  if (variant === 'line') {
    return (
      <div
        className={cn(
          'h-4 w-full rounded-full bg-surface-2',
          'animate-pulse motion-reduce:animate-none',
          className
        )}
      />
    );
  }

  if (variant === 'block') {
    return (
      <div
        className={cn(
          'h-20 w-full rounded-md bg-surface-2',
          'animate-pulse motion-reduce:animate-none',
          className
        )}
      />
    );
  }

  // card variant — matches NotificationCard layout from Story 3.1
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface shadow-elev-1',
        'animate-pulse motion-reduce:animate-none',
        className
      )}
    >
      {/* Header band: priority badge + title + trailing bell + overflow */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="h-5 w-12 shrink-0 rounded-badge bg-surface-2" />
        <div className="h-4 flex-1 rounded-full bg-surface-2" />
        <div className="h-5 w-5 shrink-0 rounded-full bg-surface-2" />
        <div className="h-5 w-5 shrink-0 rounded-full bg-surface-2" />
      </div>
      {/* Body: 3 lines at decreasing widths */}
      <div className="flex flex-col gap-2 px-5 py-4">
        <div className="h-3 w-full rounded-full bg-surface-2" />
        <div className="h-3 w-4/5 rounded-full bg-surface-2" />
        <div className="h-3 w-3/5 rounded-full bg-surface-2" />
      </div>
      {/* Meta row: topic chip (left) + timestamp (right) */}
      <div className="flex items-center justify-between px-5 pb-4">
        <div className="h-5 w-20 rounded-full bg-surface-2" />
        <div className="h-3 w-16 rounded-full bg-surface-2" />
      </div>
    </div>
  );
}
```

**`animate-pulse` in Tailwind v4:** Ships as a built-in. If it doesn't resolve (Tailwind version issue), add to `tokens.css` or `main.css`:
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

**`motion-reduce:animate-none`:** Tailwind v4 `motion-reduce:` prefix applies `@media (prefers-reduced-motion: reduce)`. The element renders as a static `bg-surface-2` block — still visible, just not animated.

**Downstream note:** Story 1.9 `DataBoundary` will render 4–6 `<Skeleton variant="card" />` when loading with no cache. Story 3.3 Feed uses DataBoundary in the loading branch. The Skeleton layout defined here must match the final NotificationCard anatomy — if Story 3.1 changes the card header structure, update the Skeleton card variant accordingly.

### Token Mapping Reference

| Tailwind utility | CSS variable | Dark value | Light value |
|---|---|---|---|
| `bg-accent-ui` | `--color-accent-ui` | `#42D392` | `#1A9E5F` [A] |
| `bg-surface-2` | `--color-surface-2` | `#1C1F23` | `#EEF0F2` [A] |
| `bg-surface-active` | `--color-surface-active` | `#1C1F23` | `#EEF0F2` [A] |
| `bg-surface` | `--color-surface` | `#16181B` | `#FFFFFF` [A] |
| `bg-meter-ok` | `--color-meter-ok` | `#42D392` | `#1A9E5F` [A] |
| `bg-meter-warning` | `--color-meter-warning` | `#F5A95C` | `#E8943A` [A] |
| `bg-meter-critical` | `--color-meter-critical` | `#FF6B6E` | `#E5484D` [A] |
| `bg-meter-track` | `--color-meter-track` | `#262A2F` | `#E4E6E9` [A] |
| `text-meter-critical` | `--color-meter-critical` | `#FF6B6E` | `#E5484D` [A] |
| `text-muted` | `--color-muted` | `#8B9197` | `#6B7177` [A] |
| `text-text` | `--color-text` | `#E8EAED` | `#1C1E21` [A] |
| `ring-focus-ring` | `--color-focus-ring` | `#42D392` | `#1A9E5F` [A] |
| `ring-offset-bg` | `--color-bg` | `#0C0D0F` | `#F3F4F6` [A] |
| `border-border` | `--color-border` | `#23262B` | `#E4E6E9` [A] |
| `rounded-full` | `--radius-full` | `9999px` | same |
| `rounded-md` | `--radius-md` | `16px` | same |
| `rounded-sm` | `--radius-sm` | `10px` | same |
| `rounded-badge` | `--radius-badge` | `6px` | same |
| `rounded-card` | `@utility` | `0 16px 16px 0` | same |
| `shadow-elev-1` | `--shadow-elev-1` | `0 1px 2px rgba(0,0,0,.4)` | same |

[A] = `[ASSUMPTION]` — pending WCAG verification in Story 5.3.

### Layer and Import Rules

**FORBIDDEN in `src/components/ui/`:**
- Importing from `src/components/message/` (domain-ignorant rule — ESLint `no-restricted-paths`)
- Importing from `src/app/` (layer separation rule — ESLint `no-restricted-paths`)
- `cva` used outside `src/components/ui/` (ESLint `no-restricted-syntax`)
- Raw hex values (future ESLint `tailwindcss/no-arbitrary-value` + hex restriction)
- Arbitrary `px` values except with `/* layout-nudge: <reason> */` comment

**i18n note:** These four primitives are domain-ignorant structural atoms. They carry no user-visible strings. Any `aria-label` must be passed as a prop by the consuming component, where the consumer calls `t()`. Do NOT import `useTranslation` or call `t()` inside these primitive files.

### Anti-Patterns to Avoid

```jsx
// WRONG — hardcoded color
<div className="bg-[#42D392]" />
// CORRECT
<div className="bg-accent-ui" />

// WRONG — JS theme check for dark mode
const isDark = document.documentElement.classList.contains('dark');
<div style={{ background: isDark ? '#42D392' : '#1A9E5F' }} />
// CORRECT — CSS token resolves via .dark class automatically
<div className="bg-accent-ui" />

// WRONG — Meter crashing on bad value
<div style={{ width: `${value}%` }} />  // null/undefined/NaN causes "null%" or NaN%
// CORRECT
const safeValue = safeMeterValue(value);
<div style={{ width: `${safeValue}%` }} />

// WRONG — re-implementing Radix keyboard / ARIA
<button
  role="switch"
  aria-checked={checked}
  onKeyDown={(e) => e.key === ' ' && toggle()}
/>
// CORRECT — Radix handles all of this
<SwitchPrimitive.Root checked={checked} onCheckedChange={onCheckedChange} />

// WRONG — domain words inside a ui/ primitive
<SwitchPrimitive.Root aria-label={t("notifications_mute_toggle")} />
// CORRECT — caller passes it via spread props
<Switch aria-label={t("mute_topic_switch")} checked={muted} onCheckedChange={setMuted} />

// WRONG — arbitrary px without justification
<div className="h-[7px]" />
// CORRECT — inline style with layout-nudge comment for spec-required value
<div style={{ height: '7px' /* layout-nudge: meter spec 7px */ }} />
```

### Downstream Impact — Skeleton Must Match Card Anatomy

The Skeleton `card` variant is a structural promise: its placeholder rows must align with the actual `NotificationCard` layout built in Story 3.1. If Story 3.1 changes the card header (e.g., adds an unread-dot element or changes the order of trailing icons), the Skeleton must be updated in the same PR to avoid a visible layout jump on data load.

Story 3.1 freeze note (G4): the card component *signature* is frozen after Story 3.1. But the Skeleton is a separate file in `ui/` — it can be updated independently.

### Project Structure Notes

| File | Action | Notes |
|---|---|---|
| `src/components/ui/Switch.jsx` | **CREATE NEW** | Radix-based toggle; ON = `accent-ui` |
| `src/components/ui/Tabs.jsx` | **CREATE NEW** | Radix-based tab navigation; re-exports Root/List/Trigger/Content |
| `src/components/ui/Meter.jsx` | **CREATE NEW** | Custom (no Radix); 7px track, threshold fill, safe degradation |
| `src/components/ui/Skeleton.jsx` | **CREATE NEW** | Custom; card/line/block variants; motion-reduce gated |
| `src/components/ui/utils.js` | **CREATE if missing** | `cn()` only — create if Story 1.6 hasn't run yet; never overwrite |
| `src/app/**` | **DO NOT TOUCH** | Preserved logic layer |
| `src/styles/tokens.css` | **DO NOT TOUCH** | Token source of truth; read-only for this story |
| `package.json` | **DO NOT TOUCH** | Packages installed in Story 1.3 |

### References

- Token values: [1-4-design-tokens-as-single-source-web-android-manifest.md](_bmad-output/implementation-artifacts/1-4-design-tokens-as-single-source-web-android-manifest.md) — full `tokens.css` specification
- Meter bar spec: `_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/DESIGN.md` — Meter bar section (7px height, `≥65%` warning, `≥90%` critical, tabular-nums label)
- Skeleton spec: `_bmad-output/planning-artifacts/epics.md` Story 1.8 AC + UX-DR14 (4–6 skeleton cards, no spinner over cached data)
- Switch spec: epics.md Story 1.8 AC (ON = accent green) + UX-DR10 (settings toggles ON = green)
- Tabs spec: epics.md Story 1.8 AC (arrow-key navigable, roving tabindex)
- Layer rules: `_bmad-output/project-context.md` — §Layers, §Styling/tokens sections
- Architecture token contract: `_bmad-output/planning-artifacts/architecture.md` — §Token Contract
- Radix Switch docs: `radix-ui/react-switch` (Root + Thumb, `data-[state=checked]`)
- Radix Tabs docs: `radix-ui/react-tabs` (Root + List + Trigger + Content, `data-[state=active]`)
- Downstream consumers: Story 1.9 (Skeleton via DataBoundary), Story 3.2 (Meter in rich key-value rows), Story 4.3 (Tabs for priority selector), Story 5.1 (Switch + Tabs in settings)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `radix-ui/react-switch` subpath import path fails — package is a barrel; correct pattern is `import { Switch as SwitchPrimitive } from 'radix-ui'` (same for Tabs). Confirmed via `node_modules/radix-ui/package.json` exports `./*` wildcard does not create subpath files.
- `@testing-library/react` not installed; used `react-dom/client` createRoot + `act` from `react` directly with jsdom environment for component rendering tests.

### Completion Notes List

- Created `src/components/ui/utils.js` with `cn()` (clsx + tailwind-merge). Linter/Story 1.7 session added `cva` re-export — preserved as-is, our code only uses `cn()`.
- Created `src/components/ui/Switch.jsx` using Radix `Switch` namespace from barrel `radix-ui` package. `data-[state=checked]` drives fill color without JS branching. aria-label always from caller via spread props.
- Created `src/components/ui/Tabs.jsx` using Radix `Tabs` namespace. Arrow-key / roving tabindex delegated to Radix entirely. Named exports: `TabsRoot`, `TabsList`, `TabsTrigger`, `TabsContent`.
- Created `src/components/ui/Meter.jsx` with pure custom logic. `safeMeterValue()` guards all bad inputs (NaN/null/undefined/Infinity/out-of-range) to safe 0. Threshold: <65 ok, ≥65 warning, ≥90 critical. ARIA role=meter with aria-valuenow/min/max. 7px height via inline style with layout-nudge comment.
- Created `src/components/ui/Skeleton.jsx` with card/line/block variants. animate-pulse gated by `motion-reduce:animate-none`. Card variant anatomically matches Story 3.1 NotificationCard spec.
- All 58 tests pass (5 test files). Build exits 0. No `src/app/` files touched.
- Pre-existing `Chip.test.jsx` failure (1 test) confirmed to exist before this story's baseline commit — belongs to Story 1.7 (in-progress in another session).

### File List

- `src/components/ui/utils.js` (created)
- `src/components/ui/utils.test.js` (created)
- `src/components/ui/Switch.jsx` (created)
- `src/components/ui/Switch.test.jsx` (created)
- `src/components/ui/Tabs.jsx` (created)
- `src/components/ui/Tabs.test.jsx` (created)
- `src/components/ui/Meter.jsx` (created)
- `src/components/ui/Meter.test.jsx` (created)
- `src/components/ui/Skeleton.jsx` (created)
- `src/components/ui/Skeleton.test.jsx` (created)
- `_bmad-output/implementation-artifacts/1-8-ui-form-data-primitives-switch-tabs-meter-skeleton.md` (updated)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (updated)

## Change Log

- 2026-06-20: Story 1.8 implemented — Switch, Tabs, Meter, Skeleton primitives created in `src/components/ui/`. 58 tests added across 5 test files. Build verified. Radix import pattern corrected from subpath to barrel import.
