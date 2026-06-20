---
baseline_commit: 50645f853e7dd0a72ca7b40398b5b0a16536c2a6
---

# Story 3.1: Notification Card Shell + Slot Contract

Status: review

## Story

As Jay,
I want each notification rendered as the hero card,
so that the one that matters lifts off the canvas at a glance (FR6, FR18 unread, UX-DR2/5).

## Acceptance Criteria

1. **Given** a notification object from Dexie (consumed as-is, not reshaped),
   **when** the card renders,
   **then** it shows the header band (priority badge when P4/P5 + title + trailing bell icon button + overflow ⋯ icon button + unread dot on leading edge, separated from body by a 1px divider).

2. **And** the squared-left accent bar (4px, full card height, positioned `left-0 absolute`) renders:
   - P5 (`priority === 5`): `bg-priority-max` + dark-only glow via `var(--glow-priority-max)`
   - P4 (`priority === 4`): `bg-priority-high` + dark-only glow via `var(--glow-priority-high)`
   - P3 or unset (`priority <= 3` or absent): no bar rendered
   - Card left edge is **squared** (`rounded-l-none`) so the bar sits flush; right rounded (`rounded-r-card` or explicit `rounded-card` class with override).

3. **And** priority is conveyed by **label + icon + position, never color alone** (FR6, NFR3):
   - P5 badge: "긴급" (`t("notification_card_badge_max")`) — squared, `bg-priority-max`, near-black text
   - P4 badge: "높음" (`t("notification_card_badge_high")`) — squared, `bg-priority-high`, near-black text
   - P1/P2/P3: no badge rendered
   - Badge uses `<Chip variant="priority" />` + `className` for color override (existing Chip API).

4. **And** an unread accent dot shows on the leading edge when `notification.new === 1`:
   - Token: `bg-accent-ui` + dark-only glow `var(--glow-accent-dot)` from `tokens.css`
   - Clears visually when `notification.new === 0` (dot removed, no DOM node)
   - `aria-label={t("notification_card_unread_label")}` on the dot element.

5. **And (G4 slot contract — card signature frozen after this story)**:
   The component accepts these slot props and renders them if provided:
   - `body: ReactNode | null` — Story 3.2 fills this; renders in the body section
   - `pending: ReactNode | null` — E4 optimistic inject; renders below the header band
   - `error: ReactNode | null` — E4 error inject; renders below the header band
   - A **GREEN render test** asserts the card renders without crash when all three slots are `null` or `undefined`.
   - **After this story is done, no props may be added to `NotificationCard` in E4/E5.**

6. **And** the whole card is tappable (calls `onTap(notification)`) while inner icon buttons `stopPropagation`. Card container: `div` with `role="button"`, `tabIndex={0}`, keyboard handler for `Enter`/`Space`. Hover `elev-2` (card-hover shadow), `cursor-pointer`.

7. **And** the card shows `bg-surface-active` background when `isSelected === true` (detail open), with no colored border added (UX-DR13). Default `bg-surface`.

8. **And** a11y: card `role="button"`, unread dot `aria-label`, bell `aria-label` via `t("notification_card_mute_toggle_label")`, overflow `aria-label` via `t("notification_card_overflow_label")`. Focus ring via `focus-visible:ring-[var(--color-focus-ring)]`. No hardcoded Korean.

## Tasks / Subtasks

- [x] Task 1: Create `src/components/message/PriorityBadge.jsx` (AC: #3)
  - [x] Props: `priority: number` — renders nothing for P1/P2/P3; P4 = "높음" amber badge, P5 = "긴급" coral badge
  - [x] Uses `<Chip variant="priority" className="..." />` from `@/components/ui/Chip` — no new badge component from scratch
  - [x] P5: `className="bg-priority-max text-[#1A0E0E]"`, P4: `className="bg-priority-high text-[#241403]"` (near-black per DESIGN.md spec; use `/* layout-nudge: DESIGN.md priority-badge foreground */` comment)
  - [x] Label via `t("notification_card_badge_max")` / `t("notification_card_badge_high")`; uppercase via Chip's existing `uppercase font-extrabold` classes
  - [x] `aria-label={t("notifications_priority_x", { priority })}` for screen readers (reuse existing key)

- [x] Task 2: Create `src/components/message/TopicChip.jsx` (AC: #1)
  - [x] Props: `name: string`, `as?: "button" | "span"`, `onClick?: () => void`
  - [x] Wraps `<Chip variant="topic" as={as ?? "span"} onClick={onClick} />`
  - [x] Displays the `subscriptionName` string passed from the card
  - [x] If `as="button"`, adds `stopPropagation` on click (tapping topic chip in all-feed → navigate to that topic; 3.3 wires this)

- [x] Task 3: Create `src/components/message/TagChip.jsx` (AC: #1)
  - [x] Props: `label: string`
  - [x] Wraps `<Chip variant="tag" />` — purely presentational, no click needed (3.1 scope)

- [x] Task 4: Create `src/components/message/NotificationCard.jsx` (AC: #1–#8)
  - [x] **Frozen prop API (do not change after this story):**
    ```
    notification       object   — raw Dexie row, consumed as-is
    subscriptionName   string   — display name for TopicChip (caller looks up subscription)
    onTap              func     — (notification) => void, called on card click
    isSelected         bool     — true = detail pane open
    body               node     — Story 3.2 fills; null = no body section rendered
    pending            node     — E4 inject; null = nothing rendered
    error              node     — E4 inject; null = nothing rendered
    onMuteToggle       func     — () => void; Story 4.2 wires; undefined = bell renders as icon-only
    isMuted            bool     — false default; Story 4.2 wires
    ```
  - [x] Card wrapper: `div role="button" tabIndex={0}` with `onClick={onTap}` and Enter/Space keydown. Use `Card` from `@/components/ui/Card` as the visual shell; override bg to `bg-surface-active` when `isSelected`, else keep Card's default `bg-surface`
  - [x] Accent bar: absolute `left-0 top-0 bottom-0 w-1` div; conditional on priority; dark glow via inline `style={{ boxShadow: 'var(--glow-priority-max)' }}`
  - [x] Header band: flex row — `PriorityBadge`, `<p className="text-subtitle font-semibold text-text">`, unread dot, bell icon button, overflow ⋯ icon button
  - [x] 1px divider below header band only when `body` is not null
  - [x] Body section: renders `{body}` slot, `{pending}` slot, `{error}` slot below divider
  - [x] Tags row: renders `<TagChip>` per tag if `notification.tags?.length > 0` (use `unmatchedTags()` from `@/app/utils` to skip emoji-mapped tags)
  - [x] Meta row: `<TopicChip name={subscriptionName} />` left, timestamp right (`text-caption text-muted`)
  - [x] Timestamp: use the existing `formatShortDateTime(notification.time, i18n.language)` from `@/app/utils`; import `useTranslation` for `i18n.language`
  - [x] Bell icon button and overflow ⋯ button: use inline SVG icons (no MUI) with `onClick={e => { e.stopPropagation(); ... }}`
  - [x] Hover elevation: `md:hover:shadow-elev-2` (Card already has this; verify it applies)
  - [x] `prefers-reduced-motion` already handled by Tailwind `motion-reduce:` on transition classes

- [x] Task 5: Add i18n keys (AC: #3, #4, #8)
  - [x] Add to `public/static/langs/ko.json`:
    - `"notification_card_badge_high"`: `"높음"`
    - `"notification_card_badge_max"`: `"긴급"`
    - `"notification_card_unread_label"`: `"읽지 않음"`
    - `"notification_card_mute_toggle_label"`: `"알림 끄기"`
    - `"notification_card_unmute_toggle_label"`: `"알림 켜기"`
    - `"notification_card_overflow_label"`: `"더 보기"`
  - [x] Also add same keys to `public/static/langs/en.json` (English):
    - `"notification_card_badge_high"`: `"High"`
    - `"notification_card_badge_max"`: `"Urgent"`
    - `"notification_card_unread_label"`: `"Unread"`
    - `"notification_card_mute_toggle_label"`: `"Mute notifications"`
    - `"notification_card_unmute_toggle_label"`: `"Unmute notifications"`
    - `"notification_card_overflow_label"`: `"More options"`

- [x] Task 6: Write `src/components/message/NotificationCard.test.jsx` (AC: #5 G4 + a11y)
  - [x] Test: card renders with all slot props as `null` — no crash (G4 GREEN render test)
  - [x] Test: P5 notification renders coral badge with "긴급" text, P4 amber "높음", P3 no badge
  - [x] Test: `notification.new === 1` renders unread dot; `new === 0` does not
  - [x] Test: `isSelected === true` applies `bg-surface-active` class (or override class on Card)
  - [x] Test: clicking card calls `onTap(notification)`; clicking bell icon does NOT call `onTap`
  - [x] Use Vitest + createRoot/act + i18next mock (same pattern as EmptyStates.test.jsx)

## Dev Notes

### Hard Prerequisites — All Must Exist Before Starting

| Dep | Story | Status | What You Need |
|-----|-------|--------|----------------|
| `src/components/ui/Card.jsx` | 1.6 | done | `Card` component; uses `rounded-card`, `bg-surface`, `border-border`, `shadow-elev-1 hover:shadow-elev-2` |
| `src/components/ui/Chip.jsx` | 1.6 | done | `Chip` with `variant: priority\|topic\|tag`; priority supplies `uppercase font-extrabold rounded-badge`; bg/text injected via `className` |
| `src/components/ui/Meter.jsx` | 1.8 | done | Not used in 3.1, but needed for 3.2 which depends on this story |
| `src/components/ui/StatePanel.jsx` | 1.9 | done | Used by EmptyStates; not by card directly |
| `src/components/ui/utils.js` | 1.6 | done | `cn()` + `cva` re-export |

---

### File Locations — No Deviations

| File | Action |
|------|--------|
| `src/components/message/NotificationCard.jsx` | **CREATE NEW** |
| `src/components/message/NotificationCard.test.jsx` | **CREATE NEW** |
| `src/components/message/PriorityBadge.jsx` | **CREATE NEW** |
| `src/components/message/TopicChip.jsx` | **CREATE NEW** |
| `src/components/message/TagChip.jsx` | **CREATE NEW** |
| `public/static/langs/ko.json` | **UPDATE** — add 5 keys |
| `public/static/langs/en.json` | **UPDATE** — add 5 keys |

**No file belongs in `src/components/ui/`** — these are ALL domain-aware (`message/`). ESLint `no-restricted-paths` forbids `ui/` → `message/` imports.

**No migration.js flag needed.** `NotificationCard` is a new component; it isn't yet wired into the live feed (that's Story 3.3). The card renders in isolation now; `migration.js` `feed` flag gates the full feed, not individual components.

---

### Notification Object Shape (raw from Dexie — consume as-is, do not reshape)

```js
{
  id:             string,   // PK (indexed &id)
  subscriptionId: string,   // FK → subscriptions.id
  sequenceId:     number,   // ordering key (indexed)
  time:           number,   // unix timestamp seconds
  message:        string,   // body text
  content_type:   string,   // "text/markdown" | "text/plain" | undefined
  title:          string,   // optional — render in header if present
  priority:       number,   // 1–5; default 3 if absent → use `notification.priority ?? 3`
  tags:           string[], // optional — may be undefined
  click:          string,   // optional click URL
  actions:        Action[], // optional ntfy action buttons (Story 3.7 scope)
  attachment:     object,   // optional (Story 3.6 scope)
  new:            number,   // 1 = unread, 0 = read
}
```

**Priority scale:** 1=min, 2=low, 3=default, 4=high (P4), 5=urgent/max (P5).
- Only P4 and P5 get accent bar + badge.
- `notification.priority ?? 3` — always default to 3 if missing.

---

### Card Visual Anatomy (top-to-bottom)

```
┌── [accent bar 4px] ─────────────────────────────────────┐
│  [priority badge?]  [title]       [· unread?] [🔕] [⋯]  │
│ ─────────────────────────────────────────────────────── │  ← 1px divider (only if body exists)
│  [body slot]                                             │
│  [pending slot]                                          │
│  [error slot]                                            │
│  [tag chips row — if tags exist]                         │
│  [topic chip] ──────────────────────── [timestamp]       │
└──────────────────────────────────────────────────────────┘
```

**Accent bar specifics:**
- `position: absolute; left: 0; top: 0; bottom: 0; width: 4px`
- Card container must be `position: relative` for the absolute bar to anchor
- Dark-mode glow: `boxShadow: 'var(--glow-priority-max)'` or `var(--glow-priority-high)` inline style (these tokens are `none` in light mode — safe)
- No bar for P3/P2/P1 — do NOT render an invisible placeholder div

**Card container radius:**
- The card spec is `border-radius: 0 16px 16px 0` — left squared, right rounded
- The existing `Card` component uses class `rounded-card` which maps to `border-radius: 0 16px 16px 0` via `@utility rounded-card` in tokens.css (verify this utility exists or apply manually as `rounded-r-md rounded-l-none`)
- Accent bar sits flush against the squared left edge — this is the signature shape

---

### Existing Chip API (from `src/components/ui/Chip.jsx`)

```jsx
// variant: "priority" | "topic" | "tag"
// priority: no bg/text — caller provides via className
// topic: bg-topic-chip-bg + text-topic-chip-text, rounded-full
// tag: transparent + border-border + text-muted, rounded-full

<Chip variant="priority" className="bg-priority-max text-[#1A0E0E] /* layout-nudge: DESIGN.md priority-badge foreground */">
  {t("notification_card_badge_max")}
</Chip>
```

PriorityBadge wraps this and picks the className based on priority number.

---

### Existing Card API (from `src/components/ui/Card.jsx`)

```jsx
// Card renders: rounded-card bg-surface border border-border shadow-elev-1 hover:shadow-elev-2 transition-shadow
// className override accepted via {...props}
// For isSelected: pass className="bg-surface-active" to override bg-surface

<Card className={cn(isSelected && "bg-surface-active", "relative cursor-pointer")}>
  {/* accent bar — absolute, left-0, h-full, w-1 */}
  {/* header band */}
  {/* body/slots */}
</Card>
```

---

### Priority Token + Glow Reference

| Priority | Badge text | Badge bg token | Badge text color | Accent bar token | Glow token |
|---------|-----------|---------------|-----------------|----------------|-----------|
| P5 (5) | "긴급" | `bg-priority-max` | `#1A0E0E` | `bg-priority-max` | `var(--glow-priority-max)` |
| P4 (4) | "높음" | `bg-priority-high` | `#241403` | `bg-priority-high` | `var(--glow-priority-high)` |
| P1–P3 | none | — | — | none | none |

Glow tokens are defined in `tokens.css`:
- `.dark { --glow-priority-max: 0 0 10px rgba(255,107,110,.333); }`
- `.dark { --glow-priority-high: 0 0 10px rgba(245,169,92,.267); }`
- Light mode: `--glow-priority-max: none; --glow-priority-high: none;` (safe, no glow in light)

Use `style={{ boxShadow: 'var(--glow-priority-max)' }}` — do NOT hardcode the rgba value.

---

### Unread Dot

```jsx
{notification.new === 1 && (
  <span
    role="status"
    aria-label={t("notification_card_unread_label")}
    className="w-2 h-2 rounded-full bg-accent-ui shrink-0"
    style={{ boxShadow: 'var(--glow-accent-dot)' }}
  />
)}
```

`--glow-accent-dot` is in tokens.css `.dark`: `0 0 7px #42D392`. Light mode: `none`.

---

### G4 Slot Contract (CRITICAL — Freeze After This Story)

After this story ships, **no dev agent in E4 or E5 may add, remove, or rename props on `NotificationCard`**. E4's mute (4.2) and publish-queue (4.4) use the frozen `onMuteToggle`, `isMuted`, `pending`, `error` slots.

Minimum GREEN render test (must pass in CI):
```jsx
it("renders with all slots null — no crash (G4)", () => {
  const notification = { id: "1", new: 0, priority: 3, time: 1700000000, message: "hello" };
  render(
    <NotificationCard
      notification={notification}
      subscriptionName="test"
      onTap={() => {}}
      isSelected={false}
      body={null}
      pending={null}
      error={null}
    />
  );
  // no assertion needed — this test passes if it doesn't throw
});
```

---

### Icon Approach

Check `package.json` for `lucide-react`. If present:
```jsx
import { Bell, MoreHorizontal } from "lucide-react";
// Bell → mute toggle button
// MoreHorizontal → overflow button
```

If not present, use minimal inline SVGs (24px, `currentColor`, `aria-hidden="true"`):
```jsx
const BellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
```

**NEVER** import from `@mui/icons-material`.

---

### Helper Imports from `src/app/`

```jsx
import { unmatchedTags, formatShortDateTime } from "@/app/utils";
// unmatchedTags(tags): filters out emoji-mapped tags — already exists in utils.js
// formatShortDateTime(time, lang): formats timestamp — already exists in utils.js

// For lang:
import { useTranslation } from "react-i18next";
const { i18n } = useTranslation();
// use i18n.language in formatShortDateTime(notification.time, i18n.language)
```

Do NOT reimport from `@/app/notificationUtils.js` (check if this file exists — it may not have the functions you need; `utils.js` is the source for `unmatchedTags` and `formatShortDateTime`).

---

### Bell Icon Button (Mute Toggle)

The bell renders as an icon button in the card header. For 3.1 it is rendered but NOT wired (Story 4.2 wires mute behavior via the frozen props):

```jsx
<button
  type="button"
  onClick={(e) => { e.stopPropagation(); onMuteToggle?.(); }}
  aria-label={t(isMuted ? "notification_card_unmute_toggle_label" : "notification_card_mute_toggle_label")}
  aria-pressed={isMuted ?? false}
  className="p-1 rounded-sm text-muted hover:text-text hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] transition-colors"
>
  <BellIcon />
</button>
```

`onMuteToggle?.()` — optional chaining so the button is safe when `onMuteToggle` is undefined (3.1 callers won't pass it yet).

Note: there is no "unmute_toggle_label" key being added in Task 5 — add it:
- ko.json: `"notification_card_unmute_toggle_label"`: `"알림 켜기"`
- en.json: `"notification_card_unmute_toggle_label"`: `"Unmute notifications"`

(This is 6 new keys total per lang file, not 5 — the unmute label is needed for `aria-pressed` accessible state.)

---

### Whole-Card Click Handler (Accessibility)

```jsx
const handleKeyDown = (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    onTap?.(notification);
  }
};

<Card
  role="button"
  tabIndex={0}
  onClick={() => onTap?.(notification)}
  onKeyDown={handleKeyDown}
  className={cn(
    "relative cursor-pointer",
    isSelected && "bg-surface-active"
  )}
>
```

---

### Testing Pattern (from 2.6 EmptyStates.test.jsx)

```jsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import NotificationCard from "./NotificationCard";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: "ko" },
  }),
}));

// Mock utils.js formatShortDateTime to avoid date formatting complexity
vi.mock("@/app/utils", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    formatShortDateTime: () => "2024-01-01",
  };
});
```

No `fake-indexeddb` needed — `NotificationCard` renders a notification object passed as props; no Dexie access inside the component itself.

---

### Architecture Boundary Check

```
src/components/
├── message/
│   ├── NotificationCard.jsx  ← NEW (domain-aware: knows ntfy priority/unread/topics)
│   ├── PriorityBadge.jsx     ← NEW
│   ├── TopicChip.jsx         ← NEW
│   ├── TagChip.jsx           ← NEW
│   └── EmptyStates.jsx       ← existing (from 2.6)
└── ui/
    ├── Card.jsx        ← imported by NotificationCard (allowed: message/ → ui/)
    ├── Chip.jsx        ← imported by PriorityBadge, TopicChip, TagChip (allowed)
    └── Meter.jsx       ← NOT used in 3.1 (Story 3.2 uses it in CardBody)
```

**Forbidden imports (ESLint `no-restricted-paths`):**
- `ui/` → `message/` is BLOCKED — never import from `message/` inside `ui/`
- `src/app/` → `src/components/` is BLOCKED (except the sanctioned Notifier→routes seam)

---

### Critical Anti-Patterns to Avoid

```jsx
// ✗ Reshaping the notification object
const { title, priority, ...rest } = notification; // WRONG — consume as-is

// ✗ Copying Dexie data into state inside the card
const [isRead, setIsRead] = useState(notification.new === 0); // WRONG — subscribe via useLiveQuery in the feed, not the card

// ✗ Calling SubscriptionManager directly from the card
import subscriptionManager from "@/app/SubscriptionManager"; // WRONG — card is a pure display component

// ✗ Hardcoded Korean in JSX
<span>긴급</span> // WRONG — must go through t()

// ✗ Hardcoded hex in className
<div className="bg-[#FF6B6E]" /> // WRONG — use bg-priority-max token

// ✗ Adding a green priority badge variant
// Priority badges are amber/coral only — never green

// ✗ Nested <button> inside a <button>
<button onClick={onTap}> // card wrapper as button
  <button onClick={bell}> // nested button — INVALID HTML
// FIX: card wrapper is a div with role="button", not a <button>

// ✗ Accent bar with display:block when priority=3
<div className="w-1 bg-transparent" /> // renders an invisible spacer — don't do it; omit entirely

// ✗ Wrong card placement
// NotificationCard.jsx in src/components/ui/ — WRONG (domain-aware → message/)

// ✗ Using MUI icons
import BellIcon from "@mui/icons-material/Notifications"; // WRONG — MUI being removed

// ✗ Glow as raw rgba in JSX
style={{ boxShadow: '0 0 10px rgba(255,107,110,.333)' }} // WRONG — use var(--glow-priority-max)
```

---

### Korean Voice for Badge Labels

Badge labels are short priority indicators, not sentences:
- P4: "높음" — simple adjective, uppercase rendered by Chip's CSS
- P5: "긴급" — "urgent/critical", uppercase rendered by Chip's CSS

Do not use full phrases like "우선순위 높음" in the badge — the badge is a stamp, not a sentence.
The full `aria-label` on the badge element reuses the existing key `notifications_priority_x` with `{ priority }` interpolation for screen readers.

---

### Story 3.2 Dependency Note

Story 3.2 (CardBody) depends on this story and will fill the `body` slot. When 3.2 is implemented:
```jsx
// Story 3.3 (Feed) will render something like:
<NotificationCard
  notification={notification}
  subscriptionName={topicDisplayName(subscription)}
  onTap={handleTap}
  isSelected={selectedId === notification.id}
  body={<CardBody notification={notification} />}  // ← 3.2
  pending={null}  // ← E4 fills
  error={null}    // ← E4 fills
/>
```

For **this story (3.1)**, simply pass `body={<p className="text-body-sm text-muted p-4">{notification.message}</p>}` in the test to verify the body slot renders.

---

### Do Not Scope Into 3.2+ Territory

3.1 scope is the **shell + slot contract**. Explicitly out of scope for this story:
- Adaptive card body renderer (markdown, key-value, meters) — Story 3.2
- Overflow menu items (읽음/복사/삭제) wiring — Story 3.4
- URL-as-SoT selection (isSelected driven by route) — Story 3.5
- Mute wiring — Story 4.2
- Pending/error slot content — Story 4.4
- Mobile swipe gesture — Story 3.8

The overflow ⋯ button renders (icon + aria-label) but the menu it opens is Story 3.4.

---

### References

- Epic spec: `_bmad-output/planning-artifacts/epics.md` § Story 3.1
- Card anatomy: `_bmad-output/planning-artifacts/ux-designs/ux-ntfy-web-2026-06-20/DESIGN.md` § Notification card
- Token values: `src/styles/tokens.css` — `--color-priority-max`, `--color-priority-high`, `--color-accent-ui`, `--glow-priority-max`, `--glow-priority-high`, `--glow-accent-dot`
- Chip API: `src/components/ui/Chip.jsx`
- Card API: `src/components/ui/Card.jsx`
- `cn()` / `cva`: `src/components/ui/utils.js`
- Priority icon SVGs (old reference): `src/img/priority-4.svg`, `priority-5.svg` (DO NOT IMPORT — these are MUI-era assets; use inline SVG or lucide-react)
- `unmatchedTags`, `formatShortDateTime`: `src/app/utils.js`
- `topicDisplayName(subscription)`: `src/app/utils.js` — used by the caller (Feed in 3.3) to derive `subscriptionName` prop
- Old card reference (read-only): `src/components/Notifications.jsx` — understand the existing logic but do NOT copy MUI/Emotion patterns
- Testing pattern: `src/components/message/EmptyStates.jsx` + (when created) `EmptyStates.test.jsx`
- Architecture boundaries: `_bmad-output/planning-artifacts/architecture.md` § Architectural Boundaries

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — clean implementation pass.

### Completion Notes List

- Created `PriorityBadge.jsx`: wraps Chip variant="priority"; renders nothing for P1–P3, amber "높음" for P4, coral "긴급" for P5; aria-label reuses existing `notifications_priority_x` key.
- Created `TopicChip.jsx`: wraps Chip variant="topic"; stopPropagation on click when `as="button"` (3.3 wires navigation).
- Created `TagChip.jsx`: purely presentational Chip variant="tag" wrapper.
- Created `NotificationCard.jsx`: full card shell with frozen G4 slot contract (body/pending/error); accent bar P4/P5 only with CSS var glow tokens; unread dot with glow; bell + overflow icon buttons with stopPropagation; isSelected bg override; formatShortDateTime + unmatchedTags from utils.js; no MUI, no hardcoded Korean, no reshaped Dexie data.
- Added 6 i18n keys to both ko.json and en.json (badge_high, badge_max, unread_label, mute_toggle_label, unmute_toggle_label, overflow_label).
- 26 new tests across G4 slot contract, priority badge, unread dot, selection state, click handling, a11y, and accent bar. All 236 tests pass (24 test files), zero regressions.
- lucide-react not in package.json; used inline SVGs per story fallback spec.

### File List

- src/components/message/PriorityBadge.jsx (created)
- src/components/message/TopicChip.jsx (created)
- src/components/message/TagChip.jsx (created)
- src/components/message/NotificationCard.jsx (created)
- src/components/message/NotificationCard.test.jsx (created)
- public/static/langs/ko.json (updated — 6 keys added)
- public/static/langs/en.json (updated — 6 keys added)

### Change Log

- 2026-06-20: Story 3.1 implemented — NotificationCard shell + G4 slot contract, PriorityBadge, TopicChip, TagChip, 26 tests, 6 i18n keys per locale.
