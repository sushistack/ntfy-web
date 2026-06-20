# ntfy-web — Final UI/UX Spec (2026-06 redesign)

Consolidated spec of the current UI/UX, with pointers to the implementing source. This is the
**web** view; the **cross-platform parity contract** (for the Android rebuild) lives in
`~/projects/ntfy-android/docs/ui-parity/` (design-tokens, components, message-format,
screens-layout, changelog). The structured **message format** is duplicated here as
[`message-format.md`](message-format.md) because it is platform-agnostic and senders rely on it.

---

## 1. Information architecture

Two surfaces — **feed** and **settings** — plus a **drawer** for switching topics. **No message
detail view.** (`src/components/App.jsx`)

- Routes: `/` (All), `/:topic`, `/:topic/:msgId` (deep-link → renders the topic feed, no detail),
  `/settings`.
- **No bottom nav** (removed). Mobile nav = app-bar hamburger → drawer
  (All / topics / Subscribe / Settings). FAB publishes. (`AppBar.jsx`, `Sidebar.jsx`, `PublishFab.jsx`)
- Desktop ≥lg: sidebar + feed (feed max `--container-feed` 720). Tablet: icon-rail. Mobile: top bar + feed.

## 2. The notification card (`message/NotificationCard.jsx`)

The card **is** the message — full content, no detail, no compact mode. Anatomy:

- **Container:** fully **squared** (`rounded-card` = `border-radius:0`), `surface` bg, 1px
  `border`, `shadow-elev-1` (hover `elev-2`+lift on desktop). Whole card is the tap target;
  tap → **mark read**. Selected (deep-link) → `surface-active`.
- **Left accent bar** (`w-1`, full height), colored for **all** priorities: 1–2 `muted` (gray),
  3 `text` (white), 4 `priority-high` (amber), 5 `priority-max` (coral); glow on 4/5 in dark.
- **Header:** PriorityBadge + title (`body` semibold, truncate; falls back to message text) +
  unread dot (`new==1`, `accent-ui`+glow) + **X delete** button (opens confirm dialog).
- **Body:** `CardBody` — structured/markdown/heuristic (see §5).
- **Meta:** `CardTags` (left) + timestamp (`ml-auto`, right) `YYYY-MM-DD HH:mm:ss` local.
- **Swipe (touch):** left → delete (coral), right → mark-read (emerald, when unread); backing
  layers mount only while swiping. Delete → confirm dialog.

## 3. Priority (`message/PriorityBadge.jsx`, `PublishDialog.jsx`)

Badge shows for every priority — `Min`/`Low`/`Normal`/`High`/`Urgent`. Low=gray text, Normal=white
text (both on `surface-2`); High=amber fill, Urgent=coral fill. Publish dialog's 4 priority chips
all show a selected tint with the same palette.

## 4. Tags (`message/CardTags.jsx`)

Card meta tag row, left→right: **topic** chip (emerald, fixed) · **service** tags (`service:`
prefix, slate-blue fixed) · **general** tags (hash color from a 6-palette, **max 2 + "+N more"**).
`card` marker tag and emoji-shortcode tags are excluded.

## 5. Message body rendering (`message/CardBody.jsx` + `StructuredCard.jsx`)

Tag `card` + JSON body → structured card (`kv` / `list` / `chart` / `sections`). Untagged →
markdown, or a loose `key: value` heuristic kv. **Full detail in [`message-format.md`](message-format.md).**
Charts are hand-drawn SVG (no chart dep). Meter thresholds: <65 emerald / ≥65 amber / ≥90 coral.

## 6. Feed (`Feed.jsx`)

- Full cards, **18px gap** (`gap-[1.125rem]`), client-paginated (20/page, infinite scroll).
- Order: **`sequenceId` desc** (newest by server sequence; not wall-clock — robust to skew).
  (`app/SubscriptionManager.js`)
- **No sticky topic header.** New arrivals: only the arrived card slides in (`animate-slide-in-top`).
- All-feed shows topic chips; per-topic omits them. Optimistic sends pin to top.

## 7. Sidebar / drawer (`Sidebar.jsx`)

All notifications · topic rows · Subscribe · Settings. Topic row: active bar + **message icon**
(accent when active) + name + unread count + **passive muted indicator** (bell-off) + **⋯ menu**
(Mute/Unmute · Rename · Clear · Unsubscribe).

## 8. Tokens & themes

All styling from `src/styles/tokens.css` (`@theme` light, `.dark` hero). Dark is default. Literal
non-token colors: the CardTags palette + service color (see the android `design-tokens.md`).

---

## Source map (where each thing lives)

| Concern | File |
|---|---|
| Shell / routes / layout | `src/components/App.jsx` |
| Feed (list, order, animation) | `src/components/Feed.jsx`, `src/app/SubscriptionManager.js` |
| Card shell (header, bar, swipe, X-delete) | `src/components/message/NotificationCard.jsx` |
| Body dispatch + heuristic kv | `src/components/message/CardBody.jsx` |
| Structured kv/list/chart/sections | `src/components/message/StructuredCard.jsx` |
| Markdown | `src/components/message/MarkdownContent.jsx` |
| Priority badge | `src/components/message/PriorityBadge.jsx` |
| Tags | `src/components/message/CardTags.jsx` |
| Meter | `src/components/ui/Meter.jsx` |
| Sidebar / drawer | `src/components/Sidebar.jsx` |
| Mobile app bar | `src/components/AppBar.jsx` |
| Publish sheet/dialog | `src/components/PublishDialog.jsx` |
| FAB | `src/components/PublishFab.jsx` |
| Date format | `src/app/utils.js` (`formatShortDateTime`) |
| Tokens | `src/styles/tokens.css` |
