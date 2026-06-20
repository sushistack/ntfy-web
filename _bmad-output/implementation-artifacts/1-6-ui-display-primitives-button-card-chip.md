---
baseline_commit: 3e6c554f4d39291910070b6a33adea8640b8e39e
---

# Story 1.6: `ui/` Display Primitives — Button, Card, Chip

Status: review

## Story

As the design-system owner,
I want token-driven Button, Card, and Chip primitives,
so that every higher-level component composes from a shared, theme-correct, accessible base.

`Depends-on:` 1.1 (S1 GREEN), 1.3 (CVA/clsx/tailwind-merge installed), 1.4 (tokens.css in place).

**Touched files (all NEW):**
- `src/components/ui/utils.js` — `cn()` helper + `cva` re-export
- `src/components/ui/Button.jsx`
- `src/components/ui/Card.jsx`
- `src/components/ui/Chip.jsx`

**Do NOT touch:**
- `src/app/` (logic layer — layer boundary is ESLint-enforced)
- `src/styles/tokens.css` or `src/styles/main.css` (owned by Story 1.4/1.3)
- Any existing `src/components/*.jsx` MUI files (coexistence required until Story 5.4)

**Estimated size:** small (3 primitives, one cohesive pass).

---

## Acceptance Criteria

1. **Given** a `<Button>` component,
   **When** rendered,
   **Then** it is an arrow-function component using `cva` for variants (`variant: primary|ghost`, `size: sm|md|lg`) and `cn()` for class merge; primary = achromatic white fill (`bg-button-fill text-button-fill-text`), ghost = neutral border (`border border-border text-muted bg-transparent`); **green is never a button variant** (only the publish FAB in a later story may be green).

2. **And** Card renders the signature shape (`rounded-card` = `border-radius: 0 16px 16px 0`, squared left edge), elev-1 resting / elev-2 hover, `bg-surface` background.

3. **And** Chip supports:
   - **Priority badge** form: squared radius (`rounded-badge` = 6px), solid priority-color fill, uppercase 800-weight label
   - **Pill** form (topic/tag): `rounded-full` radius — topic has `bg-topic-chip-bg` fill + `text-topic-chip-text`; tag has transparent bg + `border-border` + `text-muted`
   - The squared-vs-pill contrast is intentional and load-bearing for color-blind safety — **do not unify them.**

4. **And** all three components carry visible focus styling via the `focus-ring` token:
   ```
   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]
   ```
   (Use `focus-visible:` not `focus:` to avoid showing the ring on mouse clicks.)

5. **And** `npm run build` succeeds with no errors after all three primitives are created.

---

## Tasks / Subtasks

- [x] Task 0: Verify prerequisites (AC: all)
  - [x] Confirm `src/styles/tokens.css` exists with `@theme {}` block (Story 1.4 must be done)
  - [x] Confirm `src/styles/main.css` imports tokens then tailwindcss (Story 1.3 must be done)
  - [x] Confirm `class-variance-authority`, `clsx`, `tailwind-merge` are in `package.json` (Story 1.3 install)
  - [x] If any prerequisite is missing, STOP and report — do not create placeholder stubs

- [x] Task 1: Create `src/components/ui/utils.js` (AC: 1, 2, 3)
  - [x] Export `cn()` using `clsx` + `tailwind-merge`
  - [x] Re-export `cva` from `class-variance-authority` so all `ui/` files import it from one place
  - [x] No domain logic here — style helpers only

- [x] Task 2: Create `src/components/ui/Button.jsx` (AC: 1, 4)
  - [x] Arrow-function component, named export
  - [x] Define `button` variant config with `cva`: `variant: { primary, ghost }`, `size: { sm, md, lg }`
  - [x] Apply `cn(button({ variant, size }), className)` pattern
  - [x] Spread remaining `...props` onto the `<button>` element so callers can pass `onClick`, `type`, `disabled`, `aria-*`
  - [x] Include focus ring classes
  - [x] Default variant: `primary`, default size: `md`
  - [x] **Never add a green/accent variant** — that's for the publish FAB only (a later story)

- [x] Task 3: Create `src/components/ui/Card.jsx` (AC: 2, 4)
  - [x] Arrow-function component, named export
  - [x] Applies `rounded-card`, `bg-surface`, `border border-border`, `shadow-elev-1`, hover `shadow-elev-2`
  - [x] `hover:shadow-elev-2` for md+ breakpoint hover elevation (desktop only — `md:hover:shadow-elev-2`)
  - [x] Accept `className` prop for composition overrides; spread `...props`
  - [x] Card is a layout shell only — does NOT know about priority bars, headers, body slots (those are in `message/NotificationCard.jsx` in Epic 3)

- [x] Task 4: Create `src/components/ui/Chip.jsx` (AC: 3, 4)
  - [x] Arrow-function component, named export
  - [x] Define `chip` variant config with `cva`: `variant: { priority, topic, tag }`
  - [x] Priority: `rounded-badge`, uppercase, `font-extrabold` (800-weight); caller passes background via `className` (priority color varies by level — P4 amber, P5 coral — so Chip itself is color-neutral, caller applies the specific priority bg)
  - [x] Topic: `rounded-full`, `bg-topic-chip-bg text-topic-chip-text font-semibold`
  - [x] Tag: `rounded-full`, `bg-transparent border border-border text-muted font-normal`
  - [x] Include focus ring when `as="button"` (topic chip is tappable → topic feed); default is a `<span>` unless `as` prop is `"button"`
  - [x] Accept `className`, spread `...props`

- [x] Task 5: Build verification (AC: 5)
  - [x] Run `npm run build` — must exit 0
  - [x] Check that Tailwind utilities `bg-button-fill`, `text-button-fill-text`, `shadow-elev-1`, `shadow-elev-2`, `rounded-badge`, `bg-topic-chip-bg` appear in compiled CSS

---

## Dev Notes

### Prerequisites — What Must Already Be Done

**Story 1.3** must have installed:
```bash
npm i tailwindcss @tailwindcss/vite radix-ui class-variance-authority clsx tailwind-merge
```
And created `src/styles/main.css`:
```css
@import "./tokens.css";
@import "tailwindcss";
```

**Story 1.4** must have created `src/styles/tokens.css` with `@theme {}` block defining all token vars (colors, radius, shadows, spacing). This story's components depend on those tokens resolving to Tailwind utilities. If `tokens.css` is missing, stop — the components will produce no meaningful output.

**Story 1.1** (S1 GREEN spike) must be complete, confirming Tailwind v4 and the existing Emotion/MUI layer can coexist. This story adds no CSS-in-JS and touches no MUI files, so it operates safely even if S1 is still in progress — **but wait for S1 to be GREEN before merging to main** per the epic gate.

---

### Task 1 — `src/components/ui/utils.js` (exact implementation)

```js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export { cva } from "class-variance-authority";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

- `cn()` is the **single class-merge function** for all of `ui/`. Never hand-concatenate class strings with template literals.
- `cva` is re-exported here so that `ui/` files always import it from `./utils`, not directly from `class-variance-authority`. This keeps the indirection in one place.
- No domain logic here — no imports from `src/app/`, `message/`, or `contexts/`.

---

### Task 2 — `src/components/ui/Button.jsx` (exact implementation)

```jsx
import { cva, cn } from "./utils";

const button = cva(
  // base styles — applied to every Button regardless of variant
  [
    "inline-flex items-center justify-center",
    "font-semibold select-none transition-colors",
    "rounded-sm",              // --radius-sm = 10px (buttons, inputs)
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
    "disabled:pointer-events-none disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        primary: "bg-button-fill text-button-fill-text hover:bg-surface-2",
        ghost:   "bg-transparent border border-border text-muted hover:bg-surface-2",
      },
      size: {
        sm: "h-8 px-3 text-caption",    // 32px tall, 12px text
        md: "h-10 px-4 text-body-sm",   // 40px tall, 14px text (default)
        lg: "h-12 px-5 text-body",      // 48px tall, 16px text — safe touch target
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export function Button({ variant, size, className, ...props }) {
  return (
    <button className={cn(button({ variant, size }), className)} {...props} />
  );
}
```

**Critical rules:**
- `hover:bg-surface-2` is the hover state for both variants — never hardcode hex values.
- **Green is never a Button variant.** The `accent` / `#42D392` / `focus-ring` green is for focus rings and the FAB only (Story 4.3).
- `disabled:pointer-events-none disabled:opacity-50` handles disabled state without JavaScript.
- `font-semibold` = 600-weight (matches DESIGN.md `button.fontWeight: 600`).
- `rounded-sm` = `--radius-sm` = 10px (buttons, inputs — per DESIGN.md radius scale).
- `select-none` prevents accidental text selection on rapid clicks.
- `transition-colors` for smooth hover (gated by `prefers-reduced-motion` via Tailwind's default motion utilities — no extra work needed).

**Caller passing `type`:** always pass `type="button"` when inside a `<form>` to prevent accidental submit. The caller is responsible for this — Button doesn't force it.

---

### Task 3 — `src/components/ui/Card.jsx` (exact implementation)

```jsx
import { cn } from "./utils";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-card",                     // @utility: border-radius 0 16px 16px 0 (left squared)
        "bg-surface",                       // --color-surface
        "border border-border",             // 1px hairline
        "shadow-elev-1",                    // resting: 0 1px 2px rgba(0,0,0,.4)
        "md:hover:shadow-elev-2",           // hover elevation (desktop md+ only)
        "transition-shadow",                // smooth elevation transition
        className
      )}
      {...props}
    />
  );
}
```

**Critical rules:**
- `rounded-card` is the `@utility` defined in `tokens.css` from Story 1.4. It expands to `border-radius: 0 var(--radius-md) var(--radius-md) 0;`. This is the product's signature shape — the LEFT edge is **deliberately squared** so the 4px priority accent bar sits flush.
- Card is a **layout shell only.** It knows nothing about priority bars, header bands, body slots, unread dots, or action buttons. Those are assembled in `src/components/message/NotificationCard.jsx` (Epic 3, Story 3.1). Keep Card generic.
- `md:hover:shadow-elev-2` scopes hover elevation to desktop breakpoints — touch devices skip it (no hover on touch).
- `transition-shadow` ensures smooth elevation on hover (respects Tailwind's `motion-reduce` by default).
- Selected card state (`bg-surface-active`) is applied by the parent via `className` override — Card itself does not know about selection state.
- Dark-mode glow effects (priority bar, unread dot) are NOT part of Card — they're in `message/NotificationCard.jsx`.

---

### Task 4 — `src/components/ui/Chip.jsx` (exact implementation)

```jsx
import { cva, cn } from "./utils";

const chip = cva(
  // base styles
  [
    "inline-flex items-center justify-center",
    "text-caption font-normal select-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]",
  ],
  {
    variants: {
      variant: {
        priority: [
          "rounded-badge",                    // --radius-badge = 6px (squared intent)
          "uppercase font-extrabold",          // 800-weight, uppercase
          "px-2 py-0.5",                       // tight padding — badge is compact
          // bg/text applied by caller: e.g. className="bg-priority-max text-white"
        ],
        topic: [
          "rounded-full",                     // pill
          "bg-topic-chip-bg text-topic-chip-text font-semibold", // emerald tint
          "px-3 py-1",
        ],
        tag: [
          "rounded-full",                     // pill
          "bg-transparent border border-border text-muted", // outlined
          "px-3 py-1",
        ],
      },
    },
    defaultVariants: {
      variant: "tag",
    },
  }
);

export function Chip({ variant, as, className, ...props }) {
  const Tag = as === "button" ? "button" : "span";
  return (
    <Tag className={cn(chip({ variant }), className)} {...props} />
  );
}
```

**Critical rules:**

**Priority chip (`variant="priority"`):**
- The chip itself is **color-neutral** for its base class — the priority color (coral P5 / amber P4) is injected by the caller as a `className` override. This is intentional: the design system shouldn't hardcode which priority level goes on which chip instance.
  ```jsx
  // In message/NotificationCard.jsx (Story 3.1):
  <Chip variant="priority" className="bg-priority-max text-white">MAX</Chip>
  <Chip variant="priority" className="bg-priority-high text-white">HIGH</Chip>
  ```
- `font-extrabold` = 800-weight (matches DESIGN.md `priority-badge.fontWeight: 800`).
- `uppercase` is applied via Tailwind `uppercase` class (NOT `text-transform` inline style).
- `rounded-badge` = `--radius-badge` = 6px — **intentionally sharper** than `rounded-sm` (10px). The squared severity vs. pill topic contrast is load-bearing for color-blind users.

**Topic chip (`variant="topic"`):**
- `bg-topic-chip-bg` / `text-topic-chip-text` are tokens:
  - Light: `#E1F2EA` / `#136B43` (emerald tint)
  - Dark: `#143A2D` / `#7CE6B4`
- Topic chips are often tappable (→ topic feed). Pass `as="button"` when interactive:
  ```jsx
  <Chip variant="topic" as="button" onClick={...}>alerts</Chip>
  ```

**Tag chip (`variant="tag"`):**
- Outlined pill — transparent fill, `border-border`, `text-muted`.
- Usually non-interactive (`<span>` default). If tappable, pass `as="button"`.

**DO NOT** collapse priority and pill into a single variant — the squared-vs-pill distinction is intentional UX-DR5 design.

---

### Layer Boundary Rule

The `ui/` layer is **domain-ignorant.** These invariants are ESLint-enforced:

- `ui/` files may NOT import from `src/app/`, `message/`, or `contexts/`.
- `ui/` files may NOT reference i18n keys (primitives have no user-facing copy — callers pass `children`).
- `cva` is imported only inside `ui/` files. Components outside `ui/` use `cn()` only.

If you find yourself adding "ntfy-specific" logic to Button/Card/Chip — stop and move it to the caller.

---

### i18n: No User-Facing Strings in Primitives

Button, Card, Chip have **no hardcoded user-facing text.** All visible copy is passed by callers as `children` or `aria-label`. This is by design — primitives are English-neutral. The i18n `no-literal-string` ESLint rule will not trigger on these files if they contain no string literals (beyond class names and prop names).

---

### Focus Ring Implementation

All three components use the same focus ring pattern:
```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]
```

- `focus-visible:` (not `focus:`) — only shows the ring for keyboard navigation, not mouse clicks. This is the correct WCAG 2.1 pattern.
- `focus-visible:outline-none` removes the browser's default outline before applying our token ring.
- `ring-[var(--color-focus-ring)]` references the token var directly (Tailwind v4 arbitrary values with CSS vars work without special config).
- The focus-ring token is `--color-focus-ring: #1A9E5F` (light) / `#42D392` (dark) — both pass 3:1 contrast against their respective backgrounds (WCAG 1.4.11 UI component minimum).

---

### Token Reference (Tokens from Story 1.4)

All tokens used by this story are defined in `src/styles/tokens.css` (created in Story 1.4). Tailwind v4 auto-derives utility classes from `@theme` vars:

| Token var | Tailwind utility | Notes |
|---|---|---|
| `--color-button-fill` | `bg-button-fill` | `#F4F5F6` light **and** dark (achromatic) |
| `--color-button-fill-text` | `text-button-fill-text` | `#15171A` — near-black |
| `--color-surface` | `bg-surface` | Card background |
| `--color-surface-2` | `bg-surface-2` | Hover state for button/card chrome |
| `--color-border` | `border-border` | Hairline divider |
| `--color-muted` | `text-muted` | Ghost button text, tag chip text |
| `--color-topic-chip-bg` | `bg-topic-chip-bg` | Emerald tinted topic chip bg |
| `--color-topic-chip-text` | `text-topic-chip-text` | Emerald topic chip text |
| `--color-priority-high` | `bg-priority-high` | P4 amber — caller applies |
| `--color-priority-max` | `bg-priority-max` | P5 coral — caller applies |
| `--color-focus-ring` | (via `ring-[var(--color-focus-ring)]`) | Focus ring color |
| `--shadow-elev-1` | `shadow-elev-1` | Card resting shadow |
| `--shadow-elev-2` | `shadow-elev-2` | Card hover shadow |
| `--radius-sm` | `rounded-sm` | 10px — buttons, inputs |
| `--radius-badge` | `rounded-badge` | 6px — priority chip |
| `--radius-full` | `rounded-full` | 9999px — pill chips |
| (custom utility) | `rounded-card` | `0 16px 16px 0` — card signature shape |

**ESLint will later block raw hex and arbitrary px** (Story 5.4). Write only token utilities from the start so no rework is needed.

---

### Anti-Patterns to Avoid

```jsx
// WRONG — green on button
variant: {
  accent: "bg-accent-text text-accent-on-surface",  // ← forbidden (FAB only)
}

// WRONG — hand-concatenated classes
const cls = `${baseClasses} ${variantClass}`;  // ← use cn() + cva()

// WRONG — raw hex in className
<Button className="bg-[#F4F5F6]" />  // ← use bg-button-fill token

// WRONG — merging all chip forms into a single variant
<Chip squared={priority} />  // ← use explicit variant prop: variant="priority"|"topic"|"tag"

// WRONG — Card knowing about domain state
// Card should not render unread dots, priority bars, or check message.priority
// Those belong in message/NotificationCard.jsx

// WRONG — importing cva outside ui/
// Only ui/ files use cva — components in message/ or contexts/ use cn() only
import { cva } from "class-variance-authority";  // ← only ok inside src/components/ui/
```

---

### File Structure After Story Completion

```
src/components/
├── ui/                         ← NEW directory (this story)
│   ├── utils.js                ← cn() + cva re-export
│   ├── Button.jsx              ← variant: primary|ghost, size: sm|md|lg
│   ├── Card.jsx                ← rounded-card, elev-1/elev-2, bg-surface
│   └── Chip.jsx                ← variant: priority|topic|tag
│
└── (existing MUI files — DO NOT TOUCH)
    ├── App.jsx
    ├── Notifications.jsx
    └── ...
```

---

### Downstream Consumers (Context for Implementation)

Understanding where these primitives will be used helps you build the right abstraction surface:

| Primitive | First consumer | Story |
|---|---|---|
| `Card` | `message/NotificationCard.jsx` | 3.1 — adds priority bar, header band, body slot |
| `Chip` (priority) | `message/PriorityBadge.jsx` | 3.1 — injects `bg-priority-max/high className` |
| `Chip` (topic) | `message/TopicChip.jsx` | 3.1 — tappable, navigates to topic feed |
| `Chip` (tag) | `message/TagChip.jsx` | 3.1 — static label |
| `Button` (primary) | `message/NotificationCard.jsx` action row | 3.1 — "View", "Send" actions |
| `Button` (ghost) | Dialog/Sheet footer | 2.x, 4.x |

These are future callers — they are NOT written in this story. Build primitives that are easy to compose, not pre-composed.

---

### Previous Story Intelligence (from Story 1.4)

Story 1.4 established:
- `src/styles/tokens.css` is the web source of truth — load via `@import "./tokens.css"` before `@import "tailwindcss"` in `main.css`.
- Static token values live inside `@theme {}` (generates utilities); `.dark` class overrides live **outside** `@theme`.
- `@utility rounded-card` was defined there for the card shape — use `rounded-card` class directly.
- No `tailwind.config.js` — Tailwind v4 is CSS-first.
- Button tokens (`button-fill`, `button-fill-text`) are defined as achromatic — same values in light and dark themes. This is intentional per DESIGN.md.

---

### Build Verification

After creating all four files, run:
```bash
npm run build
```

The build should exit 0. Verify in the compiled CSS (check `dist/assets/*.css`) that these utilities appear:
- `bg-button-fill` — from Button
- `shadow-elev-1` — from Card
- `rounded-badge` — from Chip
- `bg-topic-chip-bg` — from Chip

If utilities don't appear, it means Tailwind didn't scan the new files. Check that Tailwind v4's content detection is picking up `src/components/ui/*.jsx` (it should by default — Tailwind v4 auto-detects JS/JSX files in the project).

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `tailwind-merge` v3 treats all unknown `text-*` utilities as conflicting. `text-body-sm` (font-size) was silently dropping `text-button-fill-text` (color). Fixed by using `extendTailwindMerge` in `utils.js` with explicit `font-size` group for our custom typography tokens (`body`, `body-sm`, `caption`, `display`, etc.).
- In Chip.test.jsx: React reconciliation reuses the same DOM node across `root.render()` calls (span→span), so a reference captured before the second render reflects the second render's classes. Fixed by capturing `.className` as a string immediately after each render.

### Completion Notes List

- `utils.js`: Updated to use `extendTailwindMerge` to properly separate custom `text-*` font-size tokens from `text-*` color tokens. All 5 tests pass.
- `Button.jsx`: Named export, `cva` variants (`primary`/`ghost`) and sizes (`sm`/`md`/`lg`), focus-visible ring, no green/accent variant. 10 tests pass.
- `Card.jsx`: Layout shell only — `rounded-card`, `bg-surface`, `border border-border`, `shadow-elev-1`, `md:hover:shadow-elev-2`, `transition-shadow`. 9 tests pass.
- `Chip.jsx`: Three variants — `priority` (rounded-badge, color-neutral), `topic` (pill, emerald tokens), `tag` (pill, outlined). `as="button"` prop for interactive topic chips. 14 tests pass.
- `npm run build` exits 0. All 4 target utilities (`bg-button-fill`, `shadow-elev-1`, `rounded-badge`, `bg-topic-chip-bg`) confirmed in compiled CSS.

### File List

- `src/components/ui/utils.js` (modified — added extendTailwindMerge for custom text-* groups)
- `src/components/ui/utils.test.js` (pre-existing, all 5 tests pass)
- `src/components/ui/Button.jsx` (new)
- `src/components/ui/Button.test.jsx` (new — 10 tests)
- `src/components/ui/Card.jsx` (new)
- `src/components/ui/Card.test.jsx` (new — 9 tests)
- `src/components/ui/Chip.jsx` (new)
- `src/components/ui/Chip.test.jsx` (new — 14 tests)

## Change Log

- 2026-06-20: Created `src/components/ui/` with Button, Card, Chip primitives and cn()/cva utils. All 38 new tests pass. Build verified green with target utilities in compiled CSS.
