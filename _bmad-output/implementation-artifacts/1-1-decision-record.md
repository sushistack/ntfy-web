# Decision Record: S1 — Emotion `@layer` Coexistence

**Date:** 2026-06-20
**Status:** GREEN

## Question

Can MUI/Emotion styles and Tailwind v4 utilities coexist on one page with predictable,
tool-enforced precedence during the Strangler migration period?

## Context

During migration, `App.jsx` keeps `RTLCacheProvider` (always passthrough for LTR/Korean)
and `ThemeProvider` globally active while new Tailwind-only components are swapped in
per route via `migration.NEW.*` flags. The risk: Emotion's global styles (CssBaseline
body resets, `sx` props) conflict with Tailwind v4 utilities on new components.

**Root cause of conflict:** Tailwind v4 emits utilities in `@layer utilities { ... }`.
CSS Cascade Level 5 §6.6.3 states that unlayered styles unconditionally outrank any
`@layer` styles. Emotion's default output is unlayered — it always beats Tailwind, making
utility overrides impossible without architectural intervention.

## Approaches Tested

| Approach | Description | Result |
|---|---|---|
| A — DOM order | `createCache({ prepend: false })` — Emotion injects after Tailwind | FAIL — unlayered Emotion still beats @layer utilities regardless of position |
| B — insertionPoint | Sentinel `<style id="emotion-anchor">` placed before Tailwind's style tag | FAIL — DOM order is irrelevant when comparing unlayered vs. @layer CSS |
| C — cache.sheet.insert override | Intercept Emotion's CSS post-stringify; wrap each rule in `@layer mui{}` | PASS — both sides now layered; explicit order gives utilities > mui |
| D — migration flag isolation | Flag prevents sx + Tailwind class on the same element | PARTIAL — per-element conflict avoided, but CssBaseline global resets still conflict with Tailwind Preflight at document level |

### Analysis Method

Approaches A and B were evaluated against the CSS Cascade Level 5 specification
(definitive, browser-implementation-verified rules). Approach C was validated via
a direct stylis v4 serialization test that proved the post-stringify wrapping mechanism
produces `@layer mui{selector{declarations}}` output. Seven tests were written in
`src/components/__spike_1_1__/SpikeTestPage.test.js` and all passed; the file was
deleted as part of Task 5.1 spike cleanup.

### Approach C — Implementation Detail

The Dev Notes suggest a `stylisPlugins` entry that modifies `element.value`. Testing
revealed this does NOT work: stylis serializes `element.props` (not `element.value`)
for rulesets, so the modification is silently ignored.

**Correct implementation** — override `cache.sheet.insert` AFTER cache creation:

```js
// From src/components/__spike_1_1__/SpikeTestPage.jsx: createLayeredCache()
export function createLayeredCache(key) {
  const cache = createCache({ key, stylisPlugins: [prefixer] });
  const originalInsert = cache.sheet.insert.bind(cache.sheet);
  cache.sheet.insert = (rule) => {
    if (rule.trim().startsWith("@import")) {
      originalInsert(rule); // @import cannot nest inside @layer
    } else {
      originalInsert(`@layer mui{${rule}}`);
    }
  };
  return cache;
}
```

**Layer order in CSS** (must appear before `@import "tailwindcss"`):

```css
@layer mui, base, components, utilities;
@import "tailwindcss";
```

This places `mui` at priority 1 (lowest) and `utilities` at priority 4 (highest).
Any element with both an Emotion-generated rule and a Tailwind utility will show
the Tailwind value.

### Approach D — Global Reset Conflict

Even with migration flags (no same-element conflict), CssBaseline emits body-level
resets (font, color, box-sizing) that are unlayered. Tailwind's Preflight emits
similar resets inside `@layer base`. Until Approach C is applied (wrapping CssBaseline
output in `@layer mui`), these will conflict. Approach D is a necessary complement
but not a standalone solution.

## Decision

**Chosen approach:** C (primary) + D (complementary during migration)

**Explicit precedence rule:**
> All Emotion/MUI CSS is wrapped in `@layer mui` via `cache.sheet.insert` override.
> The layer order declaration `@layer mui, base, components, utilities` in the root
> CSS file ensures Tailwind utilities (`@layer utilities`) always win over Emotion
> (`@layer mui`) on any element, including those only affected by CssBaseline globals.

## Rejected Alternatives

- **Approach A (DOM order):** Cannot work — CSS spec makes unlayered CSS unconditionally
  win over `@layer` regardless of injection order.
- **Approach B (insertionPoint):** Cannot work — same fundamental reason as A.
- **stylis plugin via `stylisPlugins`:** Appears to work in theory but fails in practice
  because stylis user-plugins run before stringify (element.return is empty); the plugin
  has no correct hook point within `createCache.stylisPlugins`.

## Constraint on Follow-on Stories

- **Stories 1.6–1.9** (`ui/` primitives) MUST use `createLayeredCache(key)` (or the
  production equivalent from story 1.3) for any `CacheProvider` they create. They MUST NOT
  use the default `createCache` without the `@layer mui` insert override.
- **Story 1.3** (install UI stack) MUST include the `@layer mui, base, components, utilities`
  declaration in `src/styles/tokens.css` BEFORE `@import "tailwindcss"`.
- **All flow epics** MAY begin: **S1 GREEN ⇒ `ui/` primitive stories (1.6–1.9) and all flow
  epics may begin.**
