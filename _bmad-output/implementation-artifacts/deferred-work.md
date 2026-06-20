# Deferred Work

## Deferred from: code review of 1-4-design-tokens-as-single-source-web-android-manifest (2026-06-20)

- `--leading-*` in fixed `px` instead of unitless ratios — WCAG 1.4.12 risk at 200% browser zoom (fixed px doesn't scale with font-size); defer to Story 5.3 accessibility audit
- Shadow tokens missing dark-mode override — `rgba(0,0,0,0.4)` black shadows nearly invisible on `#0C0D0F` dark canvas; intentional design (border provides depth cue in dark mode); defer for design review
- `--spacing-5/6/7` override Tailwind built-in utilities with non-default values — intentional design system: `p-5`=24px, `p-6`=32px, `p-7`=48px (vs Tailwind defaults 20/24/28px); document in onboarding if pain point
- `--color-*` prefix is Tailwind's reserved namespace — future collision risk if Tailwind ships `--color-bg` or `--color-surface`; acceptable risk for now
- No `prefers-color-scheme` CSS fallback — if Story 1.5 inline script is blocked, system-dark users see light mode; Story 1.5 scope
- `.dark` class on Radix portals/nested elements — CSS custom properties don't cascade upward; portals appended to `document.body` inherit `html.dark` correctly; no current risk
- Glow opacity values `0.267`/`0.333` have undocumented origin — appear to be 8-bit alpha (68/255, 85/255) from Android resources; add comment if cross-platform parity matters
- `--glow-accent-dot` uses opaque hex instead of `rgba()` — functionally equivalent; style inconsistency only
- `--color-surface-active` always equals `--color-surface-2` — independent token creates future drift risk; semantic separation is intentional
- `--color-focus-ring` always equals `--color-accent-ui` — semantic separation intentional (may diverge for high-contrast accessibility mode)
- Tailwind default color palette not purged — `text-red-500`, `bg-slate-100` etc. remain active alongside token system; ESLint enforcement comes in later story
- Shadow opacity 40% (`rgba(0,0,0,0.4)`) is high for elevation — Material/HIG use 12-20%; design decision, not a bug
- `rgba()` whitespace inconsistency between `tokens.css` and `design-tokens.md` — both valid CSS; cosmetic only
