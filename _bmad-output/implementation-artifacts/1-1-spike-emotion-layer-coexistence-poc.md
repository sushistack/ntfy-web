---
baseline_commit: f99a4233a2fa37362eb340a5b436a66757d3a4ce
---

# Story 1.1: Spike — Emotion `@layer` Coexistence PoC

Status: review

## Story

As the rebuild team,
I want to prove that legacy MUI/Emotion styles and new Tailwind v4 utilities can coexist on one page with predictable precedence,
so that the Strangler migration strategy is validated before any `ui/` primitive is built on it.

`Depends-on:` none. **BLOCKING:** stories 1.6–1.9 and all flow epics may NOT begin until this spike is GREEN.

---

## Acceptance Criteria

**AC1 — Decision Record produced:**
Given the existing MUI/Emotion stack and a Tailwind v4 `@layer`-based build,
When Emotion's cache is pushed into an `@layer` via its CacheProvider and a Tailwind utility competes with an MUI `sx` rule on the same element,
Then a Decision Record is produced stating whether coexistence holds, the chosen layering approach, rejected alternatives, and the explicit precedence rule the migration will rely on.

**AC2 — Entry condition named (G1):**
The Decision Record explicitly names: *"S1 GREEN ⇒ `ui/` primitive stories (1.6–1.9) and all flow epics may begin."*

**AC3 — Rethink documented if RED:**
If coexistence does NOT reliably hold, the Decision Record documents the required migration-strategy rethink and this epic halts pending re-plan.

---

## Tasks / Subtasks

- [x] Task 1: Set up PoC environment (AC1)
  - [x] 1.1 Install Tailwind v4 (`tailwindcss`, `@tailwindcss/vite`) alongside existing MUI stack — do NOT remove MUI
  - [x] 1.2 Wire `@tailwindcss/vite` into `vite.config.js` (add alongside `react()` plugin, leave PWA config untouched)
  - [x] 1.3 Create `src/styles/poc.css` with `@import "tailwindcss"` and a test `@layer` order declaration
  - [x] 1.4 Import `poc.css` in a throwaway test file (NOT in `main.jsx`/`index.jsx` — avoid polluting prod bootstrap)

- [x] Task 2: Reproduce the conflict scenario (AC1)
  - [x] 2.1 Create `src/components/__spike_1_1__/SpikeTestPage.jsx` — throwaway component, NOT exported or routed in prod
  - [x] 2.2 Render an element with both an MUI `sx` prop style (e.g. `sx={{ color: 'red' }}`) and a competing Tailwind utility (e.g. `text-blue-500`)
  - [x] 2.3 Render the same element inside the existing `ThemeProvider` + `RTLCacheProvider` wrappers (same context App.jsx uses) to test real coexistence — not an isolated sandbox

- [x] Task 3: Test layering approaches (AC1)
  - [x] 3.1 **Approach A — DOM order only:** configure Emotion `createCache({ key: 'mui', prepend: false })` (inject after Tailwind); observe which rule wins in DevTools; document result
  - [x] 3.2 **Approach B — insertionPoint:** add sentinel `<style id="emotion-anchor"></style>` before Tailwind's `<style>` in `index.html`; set `createCache({ ..., insertionPoint: document.getElementById('emotion-anchor') })`; document result
  - [x] 3.3 **Approach C — stylis `@layer` plugin:** write a custom stylis plugin that wraps every emitted rule in `@layer mui { ... }`; set layer order `@layer mui, base, components, utilities` in `poc.css` so Tailwind utilities beat mui; document result
  - [x] 3.4 **Approach D — migration-flag isolation:** verify that on a fully-migrated route (migration flag = `true`), MUI's `ThemeProvider` and `RTLCacheProvider` still wrap the new components but emit zero conflicting styles on new-Tailwind elements — confirm coexistence is moot when there is no competing `sx` rule on the same element

- [x] Task 4: Write Decision Record (AC1, AC2, AC3)
  - [x] 4.1 Create `_bmad-output/implementation-artifacts/1-1-decision-record.md` using the template in Dev Notes below
  - [x] 4.2 State clearly: **GREEN** (coexistence holds with chosen approach) or **RED** (rethink required)
  - [x] 4.3 If GREEN: name the precedence rule, the chosen approach, and the constraint it places on stories 1.6–1.9
  - [x] 4.4 If RED: describe why it fails and what migration-strategy change is needed; do NOT proceed with 1.6–1.9

- [x] Task 5: Cleanup (AC1)
  - [x] 5.1 Delete `src/components/__spike_1_1__/` — spike PoC files do NOT ship
  - [x] 5.2 Delete `src/styles/poc.css` — the real `main.css` + `tokens.css` are built in story 1.3/1.4
  - [x] 5.3 Revert any `vite.config.js` or `index.html` changes that were only for the spike
  - [x] 5.4 Update sprint-status.yaml: `1-1-spike-emotion-layer-coexistence-poc: done`

---

## Dev Notes

### What This Spike Must Prove

The Strangler migration uses `src/config/migration.js` feature flags to switch old↔new per route/area in `App.jsx`. During migration, **both** the MUI `ThemeProvider` and the new Tailwind components are active simultaneously:

```jsx
// App.jsx (current structure — migration period)
<RTLCacheProvider>          ← Emotion CacheProvider still active globally
  <ThemeProvider theme={muiTheme}>   ← MUI theme still active globally
    {migration.NEW.shell
      ? <NewTailwindShell />   ← new Tailwind component (uses Tailwind classes)
      : <OldMuiNavigation />}  ← old MUI component (uses sx/styled)
  </ThemeProvider>
</RTLCacheProvider>
```

The spike must determine: when `<NewTailwindShell />` renders Tailwind utilities while `ThemeProvider` is still active overhead, do Emotion's global styles (CssBaseline body overrides, etc.) conflict with Tailwind utilities on new elements?

### Current Emotion Cache Configuration

`RTLCacheProvider.jsx:11-14` — existing cache (keep this as reference, do NOT modify in spike):
```js
const cacheRtl = createCache({
  key: "muirtl",
  stylisPlugins: [prefixer, rtlPlugin],
});
```

The RTL cache wraps children only when `i18n.dir() === 'rtl'`. Since this project drops RTL (Korean/LTR only), `RTLCacheProvider` is always a passthrough — but it is still mounted. MUI `ThemeProvider` uses its own default Emotion cache with key `"css"`.

### CSS Precedence Rules for Tailwind v4 + Emotion

| Style type | In `@layer`? | Beats non-layered? |
|---|---|---|
| Tailwind v4 `@layer utilities { ... }` | YES | NO — layered styles always lose to non-layered |
| MUI/Emotion injected styles | NO (by default) | YES — non-layered styles beat layered |

**Critical:** Without intervention, MUI's non-layered styles beat Tailwind's `@layer utilities`. This is the core conflict to resolve.

**Approach C (stylis `@layer` plugin) is the most promising** — it pushes Emotion into a named layer, making it possible to define layer order so Tailwind utilities win.

Minimal stylis plugin to test in Approach C:
```js
// Wraps emitted CSS rules in @layer mui { ... }
// stylis element.type values: 'rule', 'atrule', 'decl', '@keyframes', '@media', etc.
const layerPlugin = (element) => {
  if (element.type === 'rule' && element.root.type !== '@layer') {
    element.value = `@layer mui { ${element.value} }`;
  }
};
```

Layer order declaration in `poc.css`:
```css
/* Layer order: mui (lowest) → base → components → utilities (highest) */
@layer mui, base, components, utilities;
@import "tailwindcss";
```

### Decision Record Template

Create `_bmad-output/implementation-artifacts/1-1-decision-record.md`:

```markdown
# Decision Record: S1 — Emotion `@layer` Coexistence

**Date:** 2026-06-20
**Status:** GREEN | RED

## Question
Can MUI/Emotion styles and Tailwind v4 utilities coexist on one page with predictable, tool-enforced precedence?

## Approaches Tested

| Approach | Description | Result |
|---|---|---|
| A — DOM order | `prepend: false` | [PASS/FAIL + why] |
| B — insertionPoint | Sentinel element before Tailwind | [PASS/FAIL + why] |
| C — stylis @layer plugin | Wraps Emotion rules in `@layer mui` | [PASS/FAIL + why] |
| D — flag isolation | Migration flag prevents co-occurrence on same element | [PASS/FAIL + why] |

## Decision

**Chosen approach:** [A | B | C | D | combination]

**Explicit precedence rule:**
> [One sentence: the rule migration will rely on. e.g. "Emotion styles are wrapped in @layer mui; Tailwind utilities in @layer utilities; the order declaration mui < utilities guarantees Tailwind wins on any element."]

## Rejected Alternatives

- Approach X: [reason rejected]

## Constraint on Follow-on Stories

- Stories 1.6–1.9 (`ui/` primitives) MUST [follow this constraint].
- All flow epics MAY begin: S1 GREEN ⇒ `ui/` primitive stories (1.6–1.9) and all flow epics may begin.

## If RED: Rethink Required

[If GREEN, delete this section]
[If RED: describe why coexistence fails and what migration-strategy change is required. This epic halts.]
```

### What NOT to Do

- **Do NOT install `@tailwindcss/postcss`** — Tailwind v4 uses `@tailwindcss/vite`, which needs no PostCSS config.
- **Do NOT add `tailwind.config.js`** — Tailwind v4 is CSS-first; config is in `@theme` block of `tokens.css`.
- **Do NOT modify `src/app/`** — the logic layer is untouched.
- **Do NOT merge spike code** — the `__spike_1_1__` component and `poc.css` are throwaway; delete them in Task 5.
- **Do NOT declare victory on approach D alone** — even if flags prevent co-occurrence on the same element, Emotion's CssBaseline and global resets may still conflict with Tailwind's `@layer base`. Both must be verified.

### File Locations

| File | Purpose | Fate |
|---|---|---|
| `src/components/__spike_1_1__/SpikeTestPage.jsx` | Throwaway PoC | DELETE in Task 5 |
| `src/styles/poc.css` | Throwaway @layer test | DELETE in Task 5 |
| `_bmad-output/implementation-artifacts/1-1-decision-record.md` | Spike output | KEEP — blocks 1.6–1.9 |

### Project Structure Notes

- **JavaScript only** — `.js`/`.jsx` only, no TypeScript/tsconfig.
- **RTL is dropped** — LTR/Korean only. `RTLCacheProvider.jsx` will be removed in 5.4, but during migration it is still mounted (always passthrough for Korean). Do not add RTL logic.
- **`src/app/` is off-limits** — no imports of React/UI inside `src/app/`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.1] — acceptance criteria shape (Decision Record, not Given/When/Then)
- [Source: _bmad-output/planning-artifacts/epics.md#Story-Creation-Guardrails] — G1 blocking requirement
- [Source: _bmad-output/planning-artifacts/architecture.md#Migration] — Strangler flag-driven approach
- [Source: _bmad-output/project-context.md#Migration] — runtime rollback switch details
- [Source: src/components/RTLCacheProvider.jsx:11-14] — current Emotion cache config
- [Source: src/components/App.jsx:1-60] — current ThemeProvider/CacheProvider wrapping structure
- [Source: vite.config.js:17-58] — PWA plugin config; do not break `injectManifest` setup

---

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Investigated stylis v4 plugin pipeline to determine correct @layer wrapping point.
  Finding: `element.value` modification in stylisPlugins is silently ignored by stylis
  (serializer uses `element.props`, not `element.value`). Post-stringify `element.return`
  modification works correctly but cannot be placed in `createCache.stylisPlugins` because
  user plugins run before stringify in Emotion's middleware chain. Solution: `cache.sheet.insert`
  override intercepts CSS at the correct point (after Emotion's stringify, before DOM injection).

### Completion Notes List

- **GREEN**: Coexistence holds with Approach C (`cache.sheet.insert` override wraps all Emotion CSS in `@layer mui`).
- **Approach C implementation correction**: Dev Notes plugin (`element.value` modification) does not work.
  Correct mechanism is `cache.sheet.insert` override — see Decision Record for the implementation.
- **Approach A & B**: Definitively FAIL per CSS Cascade Level 5 §6.6.3 (unlayered > any @layer).
- **Approach D**: PARTIAL — avoids per-element conflict but not global reset conflict (CssBaseline vs Preflight).
- All 7 spike tests pass. No regressions in existing suite (SubscriptionManager tests).
- **Constraint for story 1.3**: Must add `@layer mui, base, components, utilities` before `@import "tailwindcss"` in tokens.css.
- **Constraint for stories 1.6–1.9**: Use `createLayeredCache` pattern (or equivalent) for any Emotion cache.
- Tailwind v4 packages (`tailwindcss`, `@tailwindcss/vite`) installed and remain in devDependencies for story 1.3.

### File List

- `_bmad-output/implementation-artifacts/1-1-decision-record.md` (created — KEEP, blocks 1.6–1.9)
- `package.json` (modified — tailwindcss, @tailwindcss/vite added to devDependencies)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified — status: done)
- `_bmad-output/implementation-artifacts/1-1-spike-emotion-layer-coexistence-poc.md` (modified — status, tasks, record)

### Change Log

- 2026-06-20: Completed spike. GREEN result. Decision Record produced. Spike artifacts cleaned up. tailwindcss + @tailwindcss/vite installed for story 1.3.

---

### Review Findings

- [x] \[Review]\[Patch] Stale spike test file reference in Decision Record `1-1-decision-record.md:38` — fixed: updated reference to note spike tests were validated and deleted per Task 5.1 cleanup
- [x] \[Review]\[Defer] `messageWithSequenceId()` falsy guard misses `sequenceId: 0` `notificationUtils.js:95` — deferred, pre-existing
- [x] \[Review]\[Defer] String-fallback `sequenceId` (message.id) mixes types with integer sequenceId in IndexedDB sort order `notificationUtils.js:98` — deferred, pre-existing
- [x] \[Review]\[Defer] `addNotifications([])` empty array crashes on `.at(-1).id` `SubscriptionManager.js:~210` — deferred, pre-existing
- [x] \[Review]\[Defer] Fallback logic duplicated in Poller and notificationUtils `Poller.js:95 / notificationUtils.js:98` — deferred, pre-existing
