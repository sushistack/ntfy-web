# Deferred Work

## Deferred from: code review of 2-1-responsive-app-shell-provider-scaffold (2026-06-20)

- "Add topic" button in Sidebar has no `onClick` handler — Story 2.5 wires the SubscribeDialog action
- BottomNav "/all" path has no registered route — React Router will match `/:topic` and treat "all" as a topic name until routing is properly wired in a later story
- `require_login` auth redirect absent from `NewShell` path — Story 2.4 handles conditional login/auth entry; guarded by `NEW.shell = false` until then
- `msgDetail: "/:topic/:msgId"` is structurally ambiguous with `subscriptionExternal: "/:baseUrl/:topic"` (both two-segment dynamic paths) — cannot distinguish at the router level without additional path structure; resolve when `<Routes>` tree is wired in Story 3.5

## Deferred from: code review of 1-9-ui-state-boundary-primitives-databoundary-statepanel-live-region (2026-06-20)

- `role="status"` + `aria-live="assertive"` semantic conflict in LiveRegion — spec mandates `role="status"` unconditionally; explicit `aria-live` attribute overrides implicit role value in most ATs; acceptable until Story 2.x accessibility audit
- `politeness` prop in LiveRegion has no runtime validation — invalid `aria-live` values silently ignored by ATs; add validation if LiveRegion becomes a public API boundary
- `StatePanel` renders empty colored icon tile when `icon` prop is null/undefined — spec assumes icon is always provided by consumer; guard with `{icon && ...}` if null icon becomes a real consumer pattern

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

## Deferred from: code review of 3-3-feeds-per-topic-all-real-time-with-states (2026-06-20)

- Feed.jsx: `allSubscriptions` useLiveQuery resolves as `[]` on first render — topic chips absent briefly before Dexie resolves; fix when SelectionContext/loading-sentinel lands in Story 3.5
- Feed.jsx: `slide-in-top` animation always applied to `index === 0` — re-fires on re-renders, not only on new WS-pushed cards; acceptable cosmetic tradeoff for now

## Deferred from: code review of 3-8-mobile-card-swipe-gesture (2026-06-20)

- NotificationCard.jsx: `prefersReducedMotion` captured once at render time, not reactive to OS preference changes mid-session; spec only requires correct value on mount
- NotificationCard.jsx: `dragRef.current.isDragging` read during render for `contentStyle` — ref mutation doesn't trigger re-render, single-tick transition flicker at swipe start; sub-perceptual on modern devices

## Deferred from: code review of 4-4-optimistic-publish-queue (2026-06-20)

- PublishQueueContext.jsx: Zombie "sending" entry if TCP drops mid-flight without an HTTP error — entry stays as "sending" forever with no timeout or cleanup; inherent network limitation, out of scope for v1
- QueueSlots.jsx: RetryBar retry button has no disabled state — double-clicking sends two concurrent requests; cosmetic race condition, acceptable for v1

## Deferred from: code review of 5-4-migration-cleanup-remove-mui-emotion-rtl-trimmed-screens (2026-06-20)

- `routes.msgDetail` and `routes.subscriptionExternal` are both two-segment dynamic paths, so React Router cannot distinguish them structurally; this predates Story 5.4 and requires a deliberate URL contract change or runtime discriminator.
