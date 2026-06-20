# Reconciliation — PRD (prd-ntfy-web-2026-06-20) vs final spines

The PRD was the source. During UX coaching Jay overrode several PRD visual decisions; the spines reflect the overrides. Functional scope is unchanged. Logged here so nothing is silently dropped.

## Deliberate overrides (spines win)
| PRD decision | Final | Note |
|---|---|---|
| D3 "warm & friendly", warm neutrals, cream/sand | **Neutral, cool — no warm/brown** | Jay: "갈색톤 없애". Light = neutral off-white; dark = near-black neutral. |
| D7 brand teal `#338574` | **Emerald green `#42D392`** (UX-D9) | Shared 1:1 with Android — Android brand changes too. |
| D12 dark = warm charcoal w/ brown undertone | **Near-black neutral `#0C0D0F`** (UX-D10) | Beszel-inspired control-room dark. |
| D11 Plus Jakarta Sans + JetBrains Mono | **Kept** | No change. |
| Card all-corners `radius-md` | **Left edge squared** `0 16 16 0` (UX-D2) | Priority bar flush. |
| (PRD silent) button color | **Achromatic white** primary + ghost (UX-D6) | Green only for the FAB. |

## Adopted from new input (Beszel reference)
Icon+meter key-value rows, threshold meter colors (reuse priority palette), gray-active nav, card header band with trailing icons, settings layout. See `imports/beszel-reference.md`.

## Carried forward unchanged from PRD
Form factors & layouts (3-col desktop / icon-rail tablet / mobile top+bottom, detail pane vs full-screen D16), feature trim (no account/billing/reserved/token screens), WebSocket+poll connection, Dexie/IndexedDB + PWA, i18next/LTR-only, AA contrast, calm motion, priority-without-color, notification-card anatomy.

## Dropped / not carried (qualitative)
- PRD's specific warm dark hex tables (§3.2 / addendum §B) — fully superseded; no longer relevant.
- RTL — already dropped in PRD (D15), confirmed.

## Open assumptions for Jay (non-blocking)
- Light-theme accent + derived light tokens (`accent-light #1A9E5F`, light topic-chip/meter/surface-2) — `[ASSUMPTION]`, need a contrast check before light theme ships.
- Voice & Tone microcopy and the named-protagonist Key Flows in EXPERIENCE.md — `[ASSUMPTION]`, drafted from approved mock copy.
- Attachment behavior — specified in IA/detail but not a standalone Component Patterns row.
- Mobile card swipe gesture — `[ASSUMPTION]`.
