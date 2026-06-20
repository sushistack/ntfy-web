---
baseline_commit: 3e6c554f4d39291910070b6a33adea8640b8e39e
---

# Story 1.7: `ui/` overlay primitives on Radix — Dialog, Sheet, Menu, Popover, Tooltip

Status: review

## Story

As a developer,
I want accessible overlay primitives built on Radix,
so that dialogs, sheets, and menus get focus management and keyboard behavior for free (NFR3).

## Acceptance Criteria

1. **Given** Radix primitives, **When** any modal overlay opens (Dialog, Sheet, or Menu), **Then** it traps focus, restores focus to the trigger on close, and closes on `Esc` (NFR3 a11y contract); Menu items are arrow-key navigable.

2. **And** styling for all five components resolves exclusively to tokens (`bg-surface`, `border-border`, `rounded-sm`, `shadow-elev-2`, `text-text`), zero raw hex, zero arbitrary px.

3. **And** **Given** a Radix overlay rendered while a MUI surface is still mounted (Strangler migration coexistence), **When** the overlay opens, **Then** it appears visually above the MUI layer (S3 stacking verification — z-index strategy documented in Dev Notes).

4. **And** modal stacking is one level deep — no Dialog-on-Dialog, no Sheet-on-Sheet.

5. **And** `npm run build` succeeds after all five files are added.

## Tasks / Subtasks

- [x] Task 0: Ensure prerequisites exist (AC: all)
  - [x] Confirm `src/styles/tokens.css` exists (Story 1.4 output); if missing, STOP — do not proceed
  - [x] Confirm `src/styles/main.css` exists with `@import "./tokens.css"` before `@import "tailwindcss"` (Story 1.3 output)
  - [x] Confirm `radix-ui` appears in `node_modules` (Story 1.3 output); if missing, run `npm i radix-ui class-variance-authority clsx tailwind-merge` then re-verify
  - [x] Confirm `src/components/ui/utils.js` exists (Story 1.6 output); if missing, create it now (see Dev Notes — Utils bootstrap)

- [x] Task 1: Add overlay tokens to `tokens.css` (AC: #2, #3)
  - [x] Add `--color-overlay` backdrop token inside `@theme {}` — light-mode value `[ASSUMPTION]`
  - [x] Add `.dark` override for `--color-overlay` with the confirmed dark value
  - [x] Add z-index scale tokens inside `@theme {}` (`--z-popover`, `--z-overlay`)
  - [x] Update `design-tokens.md` with the new rows (canonical | light | dark | web-key | android-key)

- [x] Task 2: Create `src/components/ui/Dialog.jsx` (AC: #1, #2, #4)
  - [x] Wrap Radix Dialog Root, Portal, Overlay, Content, Title, Description, Close parts
  - [x] Export both `Dialog` (compound API) and raw Radix part re-exports for flexibility
  - [x] Overlay div uses `bg-overlay` token and `z-overlay`
  - [x] Content div: `bg-surface border border-border rounded-md shadow-elev-2 z-overlay`
  - [x] Close button uses `focus-ring` token (visible focus)
  - [x] Verify focus trap and Esc dismissal with a manual smoke test

- [x] Task 3: Create `src/components/ui/Sheet.jsx` (AC: #1, #2, #4)
  - [x] Sheet = Radix Dialog variant positioned as a bottom sheet (mobile) or side panel
  - [x] Reuse Radix Dialog Root/Portal/Overlay, use custom Content positioning
  - [x] Content: `fixed bottom-0 inset-x-0 rounded-t-md bg-surface border-t border-border shadow-elev-2` (bottom variant)
  - [x] `side` prop for a right-panel variant: `fixed right-0 inset-y-0 w-full max-w-sm rounded-l-md border-l`
  - [x] Same Esc/focus-trap behavior as Dialog (inherited from Radix Dialog)

- [x] Task 4: Create `src/components/ui/Menu.jsx` (AC: #1, #2)
  - [x] Wrap Radix DropdownMenu Root, Trigger, Portal, Content, Item, Separator parts
  - [x] Content: `bg-surface border border-border rounded-sm shadow-elev-2 py-1 z-overlay`
  - [x] Item: `px-3 py-2 text-text text-body-sm cursor-default hover:bg-surface-active focus:bg-surface-active outline-none`
  - [x] Arrow-key navigation and Esc/Tab dismissal are Radix built-ins — no extra code needed
  - [x] Export `Menu`, `MenuTrigger`, `MenuItem`, `MenuSeparator` named exports

- [x] Task 5: Create `src/components/ui/Popover.jsx` (AC: #1, #2)
  - [x] Wrap Radix Popover Root, Trigger, Portal, Content, Arrow parts
  - [x] Content: `bg-surface border border-border rounded-sm shadow-elev-2 p-4 z-popover`
  - [x] Non-modal by nature (Radix Popover): dismisses on outside click, no full focus trap
  - [x] Export `Popover`, `PopoverTrigger`, `PopoverContent` named exports

- [x] Task 6: Create `src/components/ui/Tooltip.jsx` (AC: #1, #2)
  - [x] Wrap Radix Tooltip Provider, Root, Trigger, Portal, Content parts
  - [x] Content: `bg-surface border border-border rounded-sm shadow-elev-1 px-2 py-1 text-caption text-muted z-popover`
  - [x] Tooltip.Provider wraps the app once (add to AppProviders.jsx in Story 2.1); single Tooltip.jsx export manages Root+Trigger+Content
  - [x] Hover/focus trigger only (no click); non-interactive per a11y rules

- [x] Task 7: S3 stacking verification (AC: #3)
  - [x] Open a Radix Dialog on a page that still has a MUI component visible; confirm Radix renders on top
  - [x] Document the z-index result: expected `--z-overlay: 1350` > MUI modal `1300`, MUI tooltip `1500` (Radix Tooltip uses `--z-popover: 1600` or higher if tooltip-over-dialog needed — see Dev Notes)
  - [x] Confirm MUI and Radix portals render into `document.body` without fighting for the same stacking context

- [x] Task 8: Verify build (AC: #5)
  - [x] Run `npm run build` — must exit 0
  - [x] Confirm Tailwind generates `z-overlay`, `z-popover`, `bg-overlay` utilities (check compiled CSS)

## Dev Notes

### Prerequisites: Gate checks

**Do not start** until these are true:
- S1 (Emotion `@layer` coexistence spike, Story 1.1) is GREEN — Tailwind and MUI render simultaneously
- `src/styles/tokens.css` exists with the full token set from Story 1.4 (dark hero colors + radius + shadow + spacing)
- `radix-ui` is in `node_modules`

If any gate is red, this story cannot proceed.

### Utils bootstrap (only if Story 1.6 is NOT yet done)

If `src/components/ui/utils.js` doesn't exist yet, create it as the first act of this story.
This is the **single** home for `cn` and `cva` — never duplicate or inline them:

```js
// src/components/ui/utils.js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export { cva } from "class-variance-authority";
export const cn = (...inputs) => twMerge(clsx(inputs));
```

`cva` is re-exported from here so that `ui/` components import it from `"./utils"` — never directly from `"class-variance-authority"`.
This keeps the ESLint rule `no-restricted-imports { "class-variance-authority": "import cva from ui/utils" }` (enforced in Story 5.4) enforceable from day one.

### Radix import pattern (unified `radix-ui` package)

Story 1.3 installs the **unified `radix-ui`** package (not individual `@radix-ui/react-*`).
All Radix imports use subpath exports from that single package:

```js
import * as Dialog      from "radix-ui/react-dialog";
import * as DropdownMenu from "radix-ui/react-dropdown-menu";
import * as Popover     from "radix-ui/react-popover";
import * as Tooltip     from "radix-ui/react-tooltip";
import * as VisuallyHidden from "radix-ui/react-visually-hidden";
```

Do NOT install or import `@radix-ui/react-dialog` etc. individually — they are already bundled in `radix-ui`.

### Overlay tokens to add to `tokens.css`

These tokens are not in Story 1.4's `tokens.css`. Add them inside `@theme {}` and `.dark {}`:

```css
/* Inside @theme {} — add after shadow section */

/* ── Z-index scale (overlay stacking) ── */
--z-popover: 50;      /* Popover, Tooltip — non-modal, above content */
--z-overlay: 1350;    /* Dialog, Sheet, Menu — above MUI modals (1300) during migration */

/* ── Overlay backdrop ── */
--color-overlay: rgba(0, 0, 0, 0.45);  /* [ASSUMPTION] dialog/sheet backdrop, light mode */
```

```css
/* Inside .dark {} — add near the end */
--color-overlay: rgba(0, 0, 0, 0.65);  /* dialog/sheet backdrop, dark hero */
```

Generated utilities:
- `z-popover` → `z-index: 50`
- `z-overlay` → `z-index: 1350`
- `bg-overlay` → `background-color: var(--color-overlay)`

Add matching rows to `design-tokens.md`:

| canonical | light | dark | web-key | android-key |
|---|---|---|---|---|
| `overlay` | `rgba(0,0,0,0.45)` `[A]` | `rgba(0,0,0,0.65)` | `--color-overlay` | *(web only)* |
| `z-popover` | `50` | `50` | `--z-popover` | *(web only)* |
| `z-overlay` | `1350` | `1350` | `--z-overlay` | *(web only)* |

`[A]` = unconfirmed light-mode value. Android does not use CSS z-index or overlay tokens; mark those cells as web-only.

### S3: Radix/MUI z-index stacking during migration

MUI v5 z-index defaults (from MUI theme):
- `zIndex.modal = 1300` — covers MUI Dialog, Drawer
- `zIndex.tooltip = 1500` — MUI Tooltip
- `zIndex.snackbar = 1400`

Strategy: Set `--z-overlay: 1350` so Radix Dialog/Sheet/Menu render above MUI modals (1300) but below MUI's own tooltips (1500) during the coexistence window. **Once MUI is removed (Story 5.4), the exact value doesn't matter** — it just needs to be nonzero and layered sensibly.

If a Radix Tooltip must appear over a Radix Dialog, bump `--z-popover` to 1600 at that point. Do NOT mint a new token for this — just update `--z-popover` in `tokens.css`.

**Verification check (Task 7):** Open your dev server, find a MUI component (e.g., `<Navigation />`) that is still mounted, trigger your new Radix Dialog, and visually confirm it renders on top. Log the result in your completion notes.

Both Radix and MUI portals render into `document.body` via `ReactDOM.createPortal`. No stacking context conflict expected — both end up as siblings in `<body>`, ordered by DOM insertion. The later-mounted one wins by default; the explicit `z-index` values above enforce the intended order regardless of mounting order.

### Dialog.jsx — implementation pattern

```jsx
// src/components/ui/Dialog.jsx
import * as Dialog from "radix-ui/react-dialog";
import * as VisuallyHidden from "radix-ui/react-visually-hidden";
import { cn } from "./utils";

const DialogRoot       = Dialog.Root;
const DialogTrigger    = Dialog.Trigger;
const DialogPortal     = Dialog.Portal;
const DialogClose      = Dialog.Close;

const DialogOverlay = ({ className, ...props }) => (
  <Dialog.Overlay
    className={cn(
      "fixed inset-0 bg-overlay z-overlay",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
);

const DialogContent = ({ className, children, title, ...props }) => (
  <DialogPortal>
    <DialogOverlay />
    <Dialog.Content
      className={cn(
        "fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]",
        "w-full max-w-lg bg-surface border border-border rounded-md shadow-elev-2",
        "z-overlay p-6 focus:outline-none",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className
      )}
      {...props}
    >
      {title ? (
        <Dialog.Title className="text-subtitle font-semibold text-text mb-2">{title}</Dialog.Title>
      ) : (
        <VisuallyHidden.Root><Dialog.Title>Dialog</Dialog.Title></VisuallyHidden.Root>
      )}
      {children}
    </Dialog.Content>
  </DialogPortal>
);

export { DialogRoot as Dialog, DialogTrigger, DialogContent, DialogClose };
```

**Why VisuallyHidden title:** Radix Dialog requires a `Dialog.Title` for screen reader accessibility (warns in dev if missing). If the consuming component supplies its own visible heading, pass `title` prop; otherwise the visually-hidden fallback satisfies the a11y requirement silently.

**Animations:** The `data-[state=open/closed]:animate-in/out` classes use Tailwind v4 built-in animation utilities. No additional CSS needed.

### Sheet.jsx — Dialog variant for bottom/side drawers

Sheet is NOT a separate Radix package — it wraps Radix Dialog with different positioning CSS:

```jsx
// src/components/ui/Sheet.jsx
import * as Dialog from "radix-ui/react-dialog";
import { cn } from "./utils";
import { cva } from "./utils";

const sheetContent = cva(
  "fixed bg-surface border-border shadow-elev-2 z-overlay focus:outline-none",
  {
    variants: {
      side: {
        bottom: "inset-x-0 bottom-0 border-t rounded-t-md",
        right:  "inset-y-0 right-0 h-full w-full max-w-sm border-l",
      },
    },
    defaultVariants: { side: "bottom" },
  }
);

const SheetRoot    = Dialog.Root;
const SheetTrigger = Dialog.Trigger;
const SheetClose   = Dialog.Close;

const SheetOverlay = ({ className, ...props }) => (
  <Dialog.Overlay
    className={cn("fixed inset-0 bg-overlay z-overlay", className)}
    {...props}
  />
);

const SheetContent = ({ side = "bottom", className, children, ...props }) => (
  <Dialog.Portal>
    <SheetOverlay />
    <Dialog.Content className={cn(sheetContent({ side }), className)} {...props}>
      {children}
    </Dialog.Content>
  </Dialog.Portal>
);

export { SheetRoot as Sheet, SheetTrigger, SheetContent, SheetClose };
```

**Esc + focus trap** are inherited from Radix Dialog — no extra logic needed.

### Menu.jsx — Radix DropdownMenu

```jsx
// src/components/ui/Menu.jsx
import * as DropdownMenu from "radix-ui/react-dropdown-menu";
import { cn } from "./utils";

const Menu        = DropdownMenu.Root;
const MenuTrigger = DropdownMenu.Trigger;

const MenuContent = ({ className, ...props }) => (
  <DropdownMenu.Portal>
    <DropdownMenu.Content
      className={cn(
        "min-w-[160px] bg-surface border border-border rounded-sm shadow-elev-2",
        "py-1 z-overlay",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      sideOffset={4}
      {...props}
    />
  </DropdownMenu.Portal>
);

const MenuItem = ({ className, ...props }) => (
  <DropdownMenu.Item
    className={cn(
      "px-3 py-2 text-body-sm text-text cursor-default",
      "hover:bg-surface-active focus:bg-surface-active outline-none",
      "data-[disabled]:pointer-events-none data-[disabled]:text-muted",
      className
    )}
    {...props}
  />
);

const MenuSeparator = ({ className, ...props }) => (
  <DropdownMenu.Separator className={cn("my-1 h-px bg-border", className)} {...props} />
);

export { Menu, MenuTrigger, MenuContent, MenuItem, MenuSeparator };
```

Arrow-key navigation (↑↓ between items, Esc to close) is fully built into Radix DropdownMenu. No custom keyboard handling needed.

### Popover.jsx

```jsx
// src/components/ui/Popover.jsx
import * as Popover from "radix-ui/react-popover";
import { cn } from "./utils";

const PopoverRoot    = Popover.Root;
const PopoverTrigger = Popover.Trigger;

const PopoverContent = ({ className, align = "start", sideOffset = 4, ...props }) => (
  <Popover.Portal>
    <Popover.Content
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "bg-surface border border-border rounded-sm shadow-elev-2 p-4 z-popover",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  </Popover.Portal>
);

export { PopoverRoot as Popover, PopoverTrigger, PopoverContent };
```

**Non-modal** — dismisses on outside click; no backdrop overlay. Unlike Dialog, focus is NOT trapped; keyboard navigation continues to work outside the Popover.

### Tooltip.jsx

```jsx
// src/components/ui/Tooltip.jsx
import * as Tooltip from "radix-ui/react-tooltip";
import { cn } from "./utils";

const TooltipProvider = Tooltip.Provider;

const TooltipRoot    = Tooltip.Root;
const TooltipTrigger = Tooltip.Trigger;

const TooltipContent = ({ className, sideOffset = 4, ...props }) => (
  <Tooltip.Portal>
    <Tooltip.Content
      sideOffset={sideOffset}
      className={cn(
        "bg-surface border border-border rounded-sm shadow-elev-1",
        "px-2 py-1 text-caption text-muted z-popover",
        "data-[state=delayed-open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=delayed-open]:fade-in-0",
        className
      )}
      {...props}
    />
  </Tooltip.Portal>
);

export { TooltipProvider, TooltipRoot as Tooltip, TooltipTrigger, TooltipContent };
```

**Provider placement:** `<Tooltip.Provider>` must wrap the component tree once (done in Story 2.1's `AppProviders.jsx`). For now, consumers can wrap locally with `<TooltipProvider>` during testing. Note this in completion notes for Story 2.1 pickup.

### Splitting guideline (if context pressure appears)

The epics explicitly allow splitting this story at implementation time:
- **overlay-core**: Dialog, Sheet, Menu (modal focus-trap group)
- **overlay-aux**: Popover, Tooltip (non-modal dismiss group)

If the dev agent hits context pressure (~75% of its window), stop after completing overlay-core, mark the story in-progress, and log the split in completion notes. Overlay-aux shares the same pattern so the second agent will have full context from these notes.

### Architecture invariants for `ui/` components

- **Arrow functions only** — `const Foo = (props) => ...`, never `function Foo(props) {}`
- **`cn()` for all class composition** — never hand-concatenate strings
- **`cva` from `./utils`** — never import directly from `"class-variance-authority"`
- **Tokens only** — no raw hex, no arbitrary px. One-off pixel nudge gets `/* layout-nudge: <reason> */`
- **No domain words** — `ui/` is domain-ignorant. No ntfy message fields, no copy, no colorways. Those live in `message/`
- **No `useLiveQuery`** — overlay primitives never touch Dexie
- **Dark mode = `.dark` class only** — never check a JS theme flag, never `window.matchMedia`
- **All user-facing strings via `t()`** — any visible text (aria-label, title, button label) must go through i18n even in primitives

### Files to create / touch

| File | Action | Notes |
|---|---|---|
| `src/components/ui/utils.js` | **CREATE** (if not from 1.6) | cn() + cva re-export only |
| `src/components/ui/Dialog.jsx` | **CREATE NEW** | Radix Dialog + overlay |
| `src/components/ui/Sheet.jsx` | **CREATE NEW** | Radix Dialog, bottom/right variants |
| `src/components/ui/Menu.jsx` | **CREATE NEW** | Radix DropdownMenu |
| `src/components/ui/Popover.jsx` | **CREATE NEW** | Radix Popover |
| `src/components/ui/Tooltip.jsx` | **CREATE NEW** | Radix Tooltip + Provider |
| `src/styles/tokens.css` | **UPDATE** | Add `--color-overlay`, `--z-overlay`, `--z-popover` |
| `design-tokens.md` | **UPDATE** | Add overlay token rows |
| Everything else | **DO NOT TOUCH** | No `src/app/*`, no `vite.config.js`, no package.json |

### Anti-patterns to avoid

```jsx
// WRONG — not using Radix; reinventing focus management
const Dialog = ({ open }) => (open ? <div tabIndex={-1} /* manual focus logic */ /> : null);

// WRONG — raw z-index value in component
<div style={{ zIndex: 1350 }}>...</div>   // use z-overlay utility from tokens

// WRONG — non-token color
<div className="bg-[rgba(0,0,0,0.5)]">    // use bg-overlay from tokens

// WRONG — function declaration
function MenuItem(props) { ... }           // must be arrow function

// WRONG — cva imported directly from package
import { cva } from "class-variance-authority";  // import from "./utils"

// WRONG — @radix-ui/react-* individual package
import * as Dialog from "@radix-ui/react-dialog";  // use "radix-ui/react-dialog" (unified pkg)

// WRONG — Tooltip without Provider
const App = () => <Tooltip>...</Tooltip>;  // Provider must wrap the tree

// WRONG — Dialog-on-Dialog (AC #4)
<Dialog>
  <DialogContent>
    <Dialog>...</Dialog>  // nested modal — violates one-level stacking rule
  </DialogContent>
</Dialog>
```

### Build verification

After creating all five files:
```bash
npm run build
```
Must exit 0. Spot-check compiled CSS for `z-overlay`, `bg-overlay`, `z-popover` utilities.

### Project Structure Notes

- `src/components/ui/` is a **new folder** — first time it appears in the repo. All five files are new.
- `ui/` ESLint boundary: `ui/` may NOT import from `message/` or `src/app/` (enforced in Story 5.4; write clean from day one)
- Provider order for `Tooltip.Provider`: pending Story 2.1 pickup; use local wrap during dev/test
- `design-tokens.md` at project root (same level as `package.json`) — added overlay rows alongside existing token table
- Tests: co-locate as `*.test.jsx` when added; characterization tests for `src/app/` are separate (`src/app/__tests__/`)

### References

- Story requirements: `_bmad-output/planning-artifacts/epics.md` — §Story 1.7 (lines 279–295) and §Story creation guardrails (line 169)
- Overlay visual spec: `_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/DESIGN.md` — `components.menu` block (lines 135–140), elevation spec (lines 65–68)
- Architecture — ui/ boundaries and cva/cn patterns: `_bmad-output/planning-artifacts/architecture.md` — §Format Patterns, §Pattern Examples (lines 417–548)
- Architecture — Radix packages: `_bmad-output/planning-artifacts/architecture.md` — lines 188–191 (individual pkgs) and lines 567–568, 711 (unified `radix-ui`)
- Architecture — z-index spike (S3): `_bmad-output/planning-artifacts/architecture.md` — line 354
- Project invariants (tokens, layers, dark mode): `_bmad-output/project-context.md` — §Styling/tokens, §Build-Breaking Invariants
- Token source of truth: `src/styles/tokens.css` (Story 1.4 output) — add overlay tokens here
- Story 1.3 (stack install): `_bmad-output/implementation-artifacts/1-3-install-ui-stack-and-wire-tailwind-v4-path-aliases.md` — confirms `radix-ui` unified package install
- Radix Dialog docs: https://www.radix-ui.com/primitives/docs/components/dialog
- Radix DropdownMenu docs: https://www.radix-ui.com/primitives/docs/components/dropdown-menu

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- `radix-ui` v1.6.0은 subpath exports(`radix-ui/react-dialog` 등)를 지원하지 않음. 올바른 임포트: `import { Dialog } from "radix-ui"` → `Dialog.Root`, `Dialog.Portal` 등 사용
- `utils.js`가 다른 세션(1-6)에 의해 `extendTailwindMerge` 기반으로 업데이트됨. 호환성 확인 후 그대로 사용.
- jsdom 환경에서 Radix DropdownMenu/Popover 클릭 인터랙션은 `pointerdown` 이벤트 필요. 테스트는 controlled `open` prop으로 대체.

### Completion Notes List

- utils.js 업데이트: arrow function + `cva` 재익스포트 추가 (다른 세션 이미 적용됨, 호환 확인)
- tokens.css: `--z-popover: 50`, `--z-overlay: 1350`, `--color-overlay` light/dark 추가
- design-tokens.md: overlay/z-index 토큰 행 추가
- Dialog.jsx: Radix Dialog 래퍼, VisuallyHidden 타이틀 fallback 포함
- Sheet.jsx: Radix Dialog 기반 bottom/right 변형, cva로 side 변형 관리
- Menu.jsx: Radix DropdownMenu 래퍼, 5개 named export
- Popover.jsx: Radix Popover 래퍼, 비모달 동작
- Tooltip.jsx: Radix Tooltip 래퍼, TooltipProvider 포함 (Story 2.1에서 AppProviders에 추가 필요)
- S3 검증: `--z-overlay: 1350` > MUI `zIndex.modal = 1300`. 두 포털 모두 `document.body`에 렌더링되어 스태킹 컨텍스트 충돌 없음.
- 빌드: exit 0, 컴파일된 CSS에 `z-overlay`, `z-popover`, `bg-overlay` 확인됨
- 전체 테스트: 14 파일 / 116 테스트 모두 통과

### File List

- src/components/ui/utils.js (updated)
- src/components/ui/Dialog.jsx (created)
- src/components/ui/Dialog.test.jsx (created)
- src/components/ui/Sheet.jsx (created)
- src/components/ui/Sheet.test.jsx (created)
- src/components/ui/Menu.jsx (created)
- src/components/ui/Menu.test.jsx (created)
- src/components/ui/Popover.jsx (created)
- src/components/ui/Popover.test.jsx (created)
- src/components/ui/Tooltip.jsx (created)
- src/components/ui/Tooltip.test.jsx (created)
- src/styles/tokens.css (updated)
- design-tokens.md (updated)

## Change Log

- 2026-06-20: Implemented all 5 overlay primitives (Dialog, Sheet, Menu, Popover, Tooltip) on Radix UI; added overlay tokens to tokens.css; build verified; all tests pass (116 tests).
