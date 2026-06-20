---
status: final
updated: 2026-06-20
project: ntfy-web
ui_system: tailwind + shadcn/headless
sources:
  - ../../prds/prd-ntfy-web-2026-06-20/prd.md
references: DESIGN.md
---

# ntfy-web — Experience Spine

> Standalone React + Vite PWA for a self-hosted, single-user, single-server ntfy instance behind a Cloudflare Tunnel. Tailwind + shadcn/headless (Radix primitives), replacing the old MUI stack. `DESIGN.md` is the visual reference — every color, radius, type, and elevation lives there as a token; this spine is the behavior. One persona: **Jay, the self-hoster**, who runs the server and reads its notifications on web and Android. Zero backend changes.

## Foundation

Multi-form-factor responsive web, installable as a PWA. Three layouts off one codebase:

- **Desktop** — 3-column: sidebar · feed (max ~720px) · detail right-pane. Opening a notification never hides the feed.
- **Tablet** — sidebar collapses to a collapsible icon-rail; feed + detail otherwise as desktop.
- **Mobile** — top app bar + bottom nav; sidebar lives in a drawer; detail is a full-screen route; publish is a green FAB → bottom sheet.

UI system is **Tailwind + shadcn/headless**, built on Radix primitives for dialogs, menus, sheets, and popovers. The component library carries structure and a11y plumbing; the brand layer (defined in `DESIGN.md`) carries identity. Dark is the hero theme — `{colors.bg}` near-black neutral, chrome quiet, the card the one bright surface — with a well-supported light counterpart and a system option.

Single-user, single-server, single-tenant by construction. There is no signup, account, billing, plan, reserved-topic, or token-management surface — those features were trimmed. Connection is **WebSocket primary with a 5-minute HTTP poll fallback** (not SSE). Local persistence is Dexie/IndexedDB plus a service worker, so history and the last-known feed survive a reload or an offline open. i18next is retained; LTR / Korean only (RTL dropped).

## Information Architecture

| Surface | Reached from | Purpose |
|---|---|---|
| App shell | App open | Sidebar (topic list · add · settings) + content region. Holds every surface below. |
| Subscribed-topic feed | Sidebar topic row | One topic's notifications, newest first, infinite scroll. Sticky topic header. |
| All-notifications feed | Sidebar "전체" / bottom nav | Every topic merged into one stream, infinite scroll. Topic chip identifies each card's source. |
| Notification detail | Card tap | Full body (markdown, ~70ch), priority, tags, attachment, action buttons, source topic + time. Desktop = right pane; mobile = full-screen route (D16). |
| Subscribe dialog | Sidebar "+" / no-subscriptions CTA | Topic name, server (defaulted), optional auth → subscribe. |
| Publish dialog / sheet | Header action (desktop) / green FAB (mobile) | Topic, title, body, priority, tags → send. Desktop = `Dialog`, mobile = bottom `Sheet`. |
| Settings | Sidebar gear / bottom nav "설정" | Sectioned form: 일반 · 서버·인증 · 모양·테마 · 알림·소리 · 보존·삭제. |
| States | Any feed/connection condition | not-connected · connecting · no-subscriptions · no-messages. Each replaces the surface it belongs to. |

Sidebar collapses to an icon-rail on tablet and into a drawer on mobile. Modal stacks one level deep — a `Dialog` or `Sheet` opens on top of a surface, never on top of another dialog. Detail is the one exception by layout: on desktop it is a persistent pane, not a modal, so the feed stays live behind it.

→ Composition reference (mockups): [beszel-feel-shell](mockups/beszel-feel-shell.html) (desktop sidebar + feed), [mobile-layout](mockups/mobile-layout.html) (feed · detail · publish), [settings-and-states](mockups/settings-and-states.html), [card-body-variants](mockups/card-body-variants.html), [desktop-complete](mockups/desktop-complete.html) (all-notifications feed · green detail pane · subscribe dialog). These render the locked visual language; **the spines (DESIGN.md + EXPERIENCE.md) win on any conflict** with a mock.

## Voice and Tone

`[ASSUMPTION]` — drafted for Jay's review. Microcopy only; brand voice and aesthetic posture live in `DESIGN.md`.

Friendly and calm, written for one person looking after their own server. Warm but never cute. Concise. On errors, reassuring first and blaming-the-user never — Jay knows his own setup, so copy points at the situation and the next move, not at a mistake. Korean throughout, plain and conversational (해요체), not formal-stiff and not emoji-laced.

| Do | Don't |
|---|---|
| "아직 구독한 토픽이 없어요" | "구독 항목 0개" |
| "토픽을 구독하면 여기에 알림이 도착합니다." | "지금 구독을 시작하세요! 🚀" |
| "서버와 연결하고 있어요. 잠시만요." | "연결 시도 중 (재시도 1/5)" |
| "서버에 연결할 수 없음" + "주소와 인증을 확인해 주세요." | "오류: 연결 실패 (NETWORK_ERROR)" |
| "이 토픽에 아직 메시지가 없습니다. 도착하면 바로 보여드릴게요." | "데이터 없음" |
| Buttons say the verb: "구독", "알림 보내기", "설정 저장", "재시도" | "확인", "제출", "OK" |
| Connection dot label: "연결됨" / "연결 중…" / "연결 끊김" | "온라인" / "STATUS: OK" |
| Destructive confirm names the thing: "이 토픽의 알림을 모두 삭제할까요?" | "정말 삭제하시겠습니까?" |
| Quiet success — the new card or saved state is the proof. | "성공적으로 저장되었습니다 ✓" toast for every action |

Empty and connection states pair a title with one friendly line and one action (per UX-D18). Errors never trap Jay on a dead screen: every error state carries the way out (재시도, 설정 열기).

## Component Patterns

Behavioral. Visual specs live in `DESIGN.md.Components`.

| Component | Use | Behavioral rules |
|---|---|---|
| `{components.notification-card}` | Both feeds | Whole card is tappable → detail (D16 target). Header band = priority badge + title + trailing icon buttons (bell/mute, overflow ⋯). Body clamped ~3 lines with an expand affordance; expand happens in place, does not navigate. Unread = `{colors.accent}` dot on the leading edge until read; reading it (open detail, or "읽음 표시") clears the dot. Overflow `{components.menu}` = 읽음 표시 / 복사 / 삭제. Up to 3 ntfy action buttons (view / http / broadcast) run **inline** — `view` opens the URL, `http`/`broadcast` fire the request and report result on the card, never leaving the feed. |
| Adaptive card body | Both feeds, detail | Renders by content shape (UX-D3): free text → paragraph; structured → key-value rows; numeric/percentage → key-value with inline meter bars. Meter fill follows priority thresholds — `{colors.meter-ok}` → `{colors.meter-warning}` (≥65%) → `{colors.meter-critical}` (≥90%). Key-value rows carry a leading mono icon (UX-D11). The renderer picks the shape; Jay never toggles it. |
| Priority badge | Card header, detail | P4 = "High", P5 = "Urgent" squared solid badge; P3 and below = no badge. Priority is conveyed by **label + icon + position**, not color alone (see Accessibility Floor). |
| Topic chip | Cards, detail meta | Soft-tinted pill identifying the source topic. Tap → that topic's feed. In the all-notifications feed it is the primary "which topic" cue. |
| Mute toggle | Card header bell, sidebar topic row, settings | Per-topic. Toggling mute is immediate and optimistic; a muted topic still receives and stores notifications but suppresses sound + browser notification. State persists in IndexedDB. |
| Connection indicator | App-bar / sidebar | Reflects live socket state: 연결됨 / 연결 중… / 연결 끊김. Driven by the WebSocket, falls to the 5-min poll without changing its meaning. Behavioral states detailed below. |
| Subscribe dialog | Radix `Dialog` / mobile `Sheet` | Topic name required; server pre-filled with the configured default; auth optional. On submit, the topic appears in the sidebar and its feed opens. |
| Publish form | Desktop `Dialog`, mobile bottom `Sheet` | Topic, title, body, priority (segmented chips — selected = priority-colored outline + tint, UX-D16), tags. Send is optimistic: the card appears in the feed immediately, reconciles when the server acks. |
| Settings section | Settings | Left icon-nav (active = `{colors.surface-active}` gray, not colored), sectioned form, divider + hint per heading. Theme = segmented control; toggles ON = `{colors.accent}` green; selects render as dark-fill controls; primary save = white "설정 저장" button. |
| Empty / state panel | States | Centered single-tone icon in a tinted rounded square + title + one line + one primary action (UX-D18). Replaces the surface; never a banner over content. |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| Cold open (cached) | Feed | Render last-known feed from IndexedDB immediately while the socket reconnects. No spinner over content Jay already has. |
| Cold open (no cache) | Feed | `{components.skeleton}` cards (4–6) matching card layout; resolve on first data. |
| Not connected | Feed | Replaces feed (coral colorway, UX-D18). Title "서버에 연결할 수 없음", line "주소와 인증을 확인해 주세요.", primary action "설정 열기". |
| Connecting | Feed / indicator | Indicator "연결 중…" with a calm amber pulse (UX-D18). If it is the first connect with no cache: state panel "서버와 연결하고 있어요. 잠시만요." Existing cached feed stays visible meanwhile. |
| No subscriptions | Feed | Green colorway. "아직 구독한 토픽이 없어요" + "토픽을 구독하면 여기에 알림이 도착합니다." Primary "＋ 토픽" (the one green CTA, UX-D16/D18). |
| No messages (single topic) | Feed | Muted colorway. "이 토픽에 아직 메시지가 없습니다. 도착하면 바로 보여드릴게요." No CTA needed — the feed will fill itself. |
| No messages (all feed) | Feed | Muted. "알림이 없어요" + "토픽을 구독하면 여기에 알림이 도착합니다." |
| Reconnected | Indicator | Indicator returns to "연결됨"; any notifications missed during the gap arrive (poll/socket backfill) and appear with the calm new-notification fade. No "다시 연결됨" interruption. |
| Offline (was connected) | Indicator + feed | Indicator "연결 끊김". Feed stays readable from IndexedDB. No modal. Reconnect is automatic; the indicator is the only signal. |
| Action button failure | Card / detail | The triggered `http`/`broadcast` action reports inline on the card: "실패 — 재시도". Retry in place. Never a full-screen error. |
| Publish failure | Dialog / feed | Optimistic card marks itself failed with "재시도"; the compose form's content is retained for a one-tap resend. |
| Focus (inputs) | Dialogs, forms | Native cursor + Radix focus management. No custom focus chrome beyond the `{colors.focus-ring}` token. |

## Interaction Primitives

- **Tap / click a card → detail.** Desktop opens the right pane (feed stays); mobile pushes the full-screen detail route.
- **Hover elevation** on cards (`md+` only) — `{elevation.card-rest}` → `{elevation.card-hover}`. Touch surfaces skip hover; the whole card is the target.
- **Selected card highlight** — the card whose detail is open in the desktop pane shows a slightly brighter surface (`{colors.surface-active}`), **not** a colored border/outline, so the coupling reads as a gentle lift rather than an attention-grabbing ring. (Keyboard `{colors.focus-ring}` still applies for focus, distinct from selection.)
- **Theme toggle** — segmented light / dark / system in settings; choice persists in IndexedDB and toggles the `.dark` class; system tracks `prefers-color-scheme` live.
- **Green FAB → bottom sheet** (mobile) — the FAB is the single place a button is green (UX-D16); it opens the publish sheet. All other buttons stay white / ghost (UX-D6).
- **Infinite scroll** in both feeds; sticky topic header on a single-topic feed.
- **Connection-status indicator** — always-present, passive; reflects socket/poll state (see State Patterns).
- **Expand clamped body** — in place, on the card; does not navigate.
- **Swipe on mobile cards** `[ASSUMPTION]` — horizontal swipe to reveal 읽음 표시 / 삭제 (native-feeling), with a confirm for delete. Tap remains the primary path; swipe is an accelerator, never the only way to reach an action.
- **Banned:** auto-playing celebratory toasts on routine success; hover-only affordances on touch viewports; modal stacks > 1 deep; color as the sole carrier of priority or status.

## Accessibility Floor

`[ASSUMPTION]` on the rebuild scope; behavioral. Visual contrast (AA ≥ 4.5:1 body, both themes) is enforced in `DESIGN.md`.

- **Keyboard + focus management is rebuilt from scratch after MUI removal**, on shadcn/Radix primitives. Dialogs and sheets trap focus, restore it to the trigger on close, and close on `Esc`. Menus (overflow ⋯) are arrow-key navigable. The detail right-pane is reachable and dismissible by keyboard.
- **Priority is conveyed by label + icon + position, never color alone** — P4/P5 carry "High"/"Urgent" text and a badge in the header band; meter thresholds carry their state in the value, not just the fill color. Color-blind-safe by construction.
- **`prefers-reduced-motion` honored** — the calm new-notification fade/slide, the connecting pulse, and any state transitions reduce to instant state changes. Nothing essential is animation-only.
- **Tab order matches reading order** on every surface; the sticky topic header and FAB do not trap or reorder focus.
- **Live region** announces arriving notifications and connection changes politely (`aria-live`), so a screen-reader user learns of a new alert and of "연결 끊김" / "연결됨" without polling the page.
- **Roles + state on every interactive element** — cards (button role → detail), mute toggle (pressed state), connection indicator (status), action buttons.
- **Focus ring** uses `{colors.focus-ring}`, visible at AA against `{colors.bg}` and `{colors.surface}`.

## Responsive & Platform

| Breakpoint | Behavior |
|---|---|
| Desktop (`≥ lg`) | 3-column: sidebar · feed (max ~720px, centered in its column) · detail right-pane. Detail opens beside the feed; the selected card keeps its brighter-surface highlight. Publish = `Dialog` from a header action. |
| Tablet (`md`) | Sidebar collapses to a collapsible icon-rail (icons + dot, expandable). Feed + detail behave as desktop; detail may take a larger share of width. |
| Mobile (`< md`) | Top app bar (menu · topic title · connection dot · avatar) + bottom nav (구독 / 전체 / 설정). Sidebar moves into a drawer behind the menu. Detail is a full-screen route with a back button + sticky bottom action bar. Publish = green FAB → bottom `Sheet`. |

PWA: installable on all three; service worker serves the shell offline and IndexedDB serves the last feed. Browser/desktop notifications fire from the service worker when permission is granted (managed in 알림·소리 settings) and respect per-topic mute. The Android sister app shares the brand token (`{colors.accent}` green, hand-synced 1:1) but not this layout.

## Inspiration & Anti-patterns

- **Lifted from Beszel:** the near-black neutral canvas with one bright accent; the card header band (title + trailing icon buttons); key-value rows with leading icons and inline meter bars; the left icon-nav settings with gray (not colored) active state; the white "Save" button. Adopt its *feel*, not its function — ntfy stays a notification reader, not a dashboard.
- **Lifted from native mobile:** bottom nav + FAB + bottom sheet for the primary mobile create action; full-screen detail route with a back affordance.
- **Rejected — colored action buttons:** buttons stay achromatic (white emphasis, neutral ghost). Green is reserved for accent moments — unread/status dot, active-nav dot, links, the FAB, the one create CTA. (UX-D6, UX-D13.)
- **Rejected — account / multi-user / cloud chrome:** no signup, login-as-account, billing, plan, reserved-topics, or token-management screens. This is one person and one server; the UI never pretends otherwise.
- **Rejected — noisy success feedback:** no celebratory toast or animation on routine save/publish/read. The quiet new state is the confirmation.
- **Rejected — color-only priority:** never. Label + icon + position always accompany the color.

## Key Flows

`[ASSUMPTION]` — named-protagonist journeys drafted for Jay's review; protagonist is the persona.

### Flow 1 — First run (Jay, just deployed the standalone PWA behind his Tunnel)

1. Jay opens the app URL. There are no subscriptions and no server connection yet, so the shell renders with a **not-connected** state in the content region: "서버에 연결할 수 없음" + "설정 열기".
2. He taps **설정 열기**, lands in 서버·인증, and enters his ntfy server URL and his token (or basic auth). He taps "설정 저장".
3. The connection indicator goes "연결 중…" (amber pulse), then "연결됨". The content region swaps to the **no-subscriptions** state: "아직 구독한 토픽이 없어요" + "토픽을 구독하면 여기에 알림이 도착합니다." with a green "＋ 토픽" CTA.
4. He taps **＋ 토픽**, the subscribe `Dialog` opens with the server pre-filled. He types his first topic name — `backups` — and taps "구독".
5. **Climax:** the dialog closes and the `backups` topic appears in the sidebar, its feed open and live. The indicator reads "연결됨". The empty topic shows "이 토픽에 아직 메시지가 없습니다. 도착하면 바로 보여드릴게요." Jay's self-hosted instance and his web client are now one connected thing — from a dead screen to a live socket in four taps, no account in sight.

Failure: the URL or auth is wrong → indicator returns to "연결 끊김", state stays not-connected with "주소와 인증을 확인해 주세요." His entered values are retained in settings for a quick fix.

### Flow 2 — The live-alert moment (Jay, 2:14am, the nightly backup just failed)

1. Jay's laptop is open on the all-notifications feed; the indicator reads "연결됨".
2. The backup job fails on the server and publishes a **P5 / Urgent** notification to `backups`. Over the live WebSocket it arrives in under a second.
3. **Climax:** a new card slides in at the top of the feed with the calm fade (not a bounce) — a coral "Urgent" badge in its header, title "백업 실패", an unread green dot on its leading edge. The browser notification fires too (the topic isn't muted), so even with the tab in the background Jay sees it. The single bright card lifts off the near-black canvas; there is no mistaking which one matters.
4. He clicks the card. On desktop the detail opens in the right pane — the feed stays beside it — showing the full body as key-value rows: the failed step in coral, the meter bars for disk and memory, the exit code. The unread dot clears.
5. The notification carries an `http` action button: "재시도". He clicks it; the request fires **inline** and reports back on the detail — no navigation away. The action runs, and a moment later the *next* card arrives: "백업 성공". Jay closes the laptop.

Failure: the retry action's request fails → it reports inline "실패 — 재시도" on the card; Jay retries in place or opens the server himself. Nothing about the feed breaks.

### Flow 3 — Publish from mobile via the FAB (Jay, on his phone, away from the server)

1. Jay is out and wants to leave himself a note on the `notes` topic. He opens the PWA on his phone — bottom nav, top app bar, indicator "연결됨".
2. He taps the green **FAB** at the bottom-right.
3. The publish **bottom sheet** rises. Topic is pre-set to the current feed (`notes`); he can change it.
4. He types a title and body, leaves priority at default (the segmented priority chips sit unselected at P3), and taps **알림 보내기**.
5. **Climax:** the sheet closes and the message appears at the top of the `notes` feed immediately — optimistic, before the server even acks — then settles as the ack arrives. Jay published to his own server from his pocket with one green tap and a sheet; the same card he'd have seen if anyone else had sent it.

Failure: the send fails (poll fallback, weak signal) → the optimistic card marks itself "재시도" and the sheet's content is retained, so a single tap resends without retyping.
